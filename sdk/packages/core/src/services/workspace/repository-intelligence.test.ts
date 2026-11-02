import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildRepositoryMap, searchWorkspaceCode } from "./repository-intelligence";

vi.mock("./file-indexer", () => ({
	getFileIndex: async (cwd: string) => {
		const files: string[] = [];
		const walk = async (directory: string): Promise<void> => {
			for (const entry of await (await import("node:fs/promises")).readdir(directory, { withFileTypes: true })) {
				if (entry.isDirectory()) {
					if (["node_modules", ".git", ".makerrr"].includes(entry.name)) continue;
					await walk(path.join(directory, entry.name));
				} else {
					files.push(path.relative(cwd, path.join(directory, entry.name)).replace(/\\/g, "/"));
				}
			}
		};
		await walk(cwd);
		return new Set(files);
	},
}));

let workspace = "";
afterEach(async () => {
	if (workspace) await rm(workspace, { recursive: true, force: true });
	vi.clearAllMocks();
});

async function createWorkspace(): Promise<string> {
	workspace = await mkdtemp(path.join(os.tmpdir(), "makerrr-repo-intelligence-"));
	await mkdir(path.join(workspace, "src", "auth"), { recursive: true });
	await writeFile(path.join(workspace, "package.json"), '{"name":"sample"}');
	await writeFile(path.join(workspace, "README.md"), "# Sample repository");
	await writeFile(path.join(workspace, "src", "auth", "session.ts"), 'import { token } from "./token";\nexport function createSession() { return token; }');
	await writeFile(path.join(workspace, "src", "auth", "token.ts"), "export const token = 'session-token';");
	await writeFile(path.join(workspace, ".env"), "API_KEY=do-not-index");
	await writeFile(path.join(workspace, "id_rsa.pem"), "private key do-not-index");
	return workspace;
}

describe("repository intelligence", () => {
	it("builds a bounded repository map with languages, entry points and relative imports", async () => {
		const cwd = await createWorkspace();
		const map = await buildRepositoryMap(cwd);
		expect(map.fileCount).toBe(4);
		expect(map.entryPoints).toContain("package.json");
		expect(map.languages.some((item) => item.language === "TypeScript")).toBe(true);
		expect(map.files.find((file) => file.path.endsWith("session.ts"))?.imports).toEqual(["./token"]);
		expect(map.files.some((file) => file.path === ".env")).toBe(false);
		expect(map.files.some((file) => file.path === "id_rsa.pem")).toBe(false);
	});

	it("provides lexical retrieval when no embedding provider is configured", async () => {
		const cwd = await createWorkspace();
		const result = await searchWorkspaceCode(cwd, "createSession token");
		expect(result.mode).toBe("lexical");
		expect(result.results[0]?.path).toBe("src/auth/session.ts");
		expect(result.results[0]?.score).toBeGreaterThan(0);
	});

	it("uses injected embeddings and reports the provider for semantic retrieval", async () => {
		const cwd = await createWorkspace();
		const provider = {
			id: "test-embedding-model",
			embed: vi.fn(async (texts: string[]) =>
				texts.map((text) => (text.includes("session") ? [1, 0] : [0, 1])),
			),
		};
		const result = await searchWorkspaceCode(cwd, "session lifecycle", { embeddingProvider: provider });
		expect(result.mode).toBe("semantic");
		expect(result.provider).toBe("test-embedding-model");
		expect(provider.embed).toHaveBeenCalledOnce();
		expect(result.results[0]?.score).toBe(1);
	});

	it("rejects embedding providers that return an incomplete vector batch", async () => {
		const cwd = await createWorkspace();
		await expect(
			searchWorkspaceCode(cwd, "session", {
				embeddingProvider: { id: "broken", embed: async () => [[1, 0]] },
			}),
		).rejects.toThrow("invalid vector batch");
	});

	it("returns no results for an empty query", async () => {
		const cwd = await createWorkspace();
		await expect(searchWorkspaceCode(cwd, "   ")).resolves.toMatchObject({ results: [] });
	});
});
