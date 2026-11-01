import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { MessageWithMetadata } from "@cline/shared";
import { resolveSessionDataDir } from "@cline/shared/storage";
import { describe, expect, it, vi } from "vitest";

vi.mock("vscode", () => ({}));

import { mapPersistedMessagesToWebviewMessages } from "./extension";

describe("mapPersistedMessagesToWebviewMessages", () => {
	it("hydrates provider activity through the ordinary tool card path", () => {
		const nativeResult = [
			{
				type: "web_search_result",
				url: "https://bun.sh/blog/bun-v1.3.14",
				title: "Bun v1.3.14",
				pageAge: "2026-08-12",
				encryptedContent: "encrypted",
			},
		];
		const messages: MessageWithMetadata[] = [
			{
				id: "user-1",
				role: "user",
				content: '<user_input mode="act">Find Bun</user_input>',
			},
			{
				id: "assistant-search",
				role: "assistant",
				content: "Bun 1.3.14 is current.",
				metadata: {
					modelToolActivities: [
						{
							toolCallId: "search-1",
							toolName: "web_search",
							execution: "provider",
							input: { query: "latest Bun" },
							output: nativeResult,
						},
					],
				},
			},
		];

		const result = mapPersistedMessagesToWebviewMessages(messages, {
			history: [{ ref: "checkpoint-1", createdAt: 1, runCount: 1 }],
		});

		expect(result).toHaveLength(3);
		expect(result[0]).toMatchObject({
			role: "user",
			text: "Find Bun",
			checkpoint: { ref: "checkpoint-1", runCount: 1 },
		});
		expect(result[1]).toMatchObject({
			role: "assistant",
			toolEvents: [
				{
					toolCallId: "search-1",
					name: "web_search",
					state: "output-available",
					input: { query: "latest Bun" },
					output: nativeResult,
				},
			],
		});
		expect(result[2]).toMatchObject({
			id: "assistant-search",
			role: "assistant",
			text: "Bun 1.3.14 is current.",
		});
	});

	it("pairs canonical local tool messages across message boundaries", () => {
		const result = mapPersistedMessagesToWebviewMessages([
			{
				id: "local-use",
				role: "assistant",
				content: [
					{
						type: "tool_use",
						id: "read-1",
						name: "read_files",
						input: { paths: ["a.ts"] },
					},
				],
			},
			{
				id: "local-result",
				role: "user",
				content: [
					{
						type: "tool_result",
						tool_use_id: "read-1",
						name: "read_files",
						content: "contents",
					},
				],
			},
		]);

		expect(result).toHaveLength(1);
		expect(result[0]?.toolEvents).toEqual([
			expect.objectContaining({
				toolCallId: "read-1",
				state: "output-available",
				output: "contents",
			}),
		]);
	});

	it("keeps id-less history row ids stable as a provider result completes", () => {
		const activity = {
			toolCallId: "search-1",
			toolName: "web_search",
			execution: "provider" as const,
			input: { query: "latest Bun release" },
		};
		const source: MessageWithMetadata = {
			role: "assistant",
			content: "Bun 1.3.14 is current.",
			metadata: {
				modelToolActivities: [activity],
			},
		};

		const pending = mapPersistedMessagesToWebviewMessages([source]);
		const completed = mapPersistedMessagesToWebviewMessages([
			{
				...source,
				metadata: {
					modelToolActivities: [
						{
							...activity,
							output: "1.3.14",
						},
					],
				},
			},
		]);

		expect(pending.at(-1)?.id).toBe("history-0");
		expect(completed.at(-1)?.id).toBe("history-0");
	});
});


describe("VS Code migrated runtime storage", () => {
	it("resolves sessions from the committed Makerrr store and leaves Cline source available", () => {
		const root = mkdtempSync(join(tmpdir(), "makerrr-vscode-migration-"));
		const previous = {
			MAKERRR_DIR: process.env.MAKERRR_DIR,
			MAKERRR_DATA_DIR: process.env.MAKERRR_DATA_DIR,
			CLINE_DATA_DIR: process.env.CLINE_DATA_DIR,
		};
		try {
			const makerrrRoot = join(root, ".makerrr");
			const makerrrData = join(makerrrRoot, "data");
			const legacyData = join(root, ".cline", "data");
			mkdirSync(join(legacyData, "sessions"), { recursive: true });
			mkdirSync(join(makerrrData, "sessions"), { recursive: true });
			process.env.MAKERRR_DIR = makerrrRoot;
			delete process.env.MAKERRR_DATA_DIR;
			process.env.CLINE_DATA_DIR = legacyData;

			expect(resolveSessionDataDir()).toBe(join(legacyData, "sessions"));
			writeFileSync(
				makerrrData + ".migration-journal.json",
				JSON.stringify({
					version: 1,
					phase: "committed",
					destinationDataDir: makerrrData,
				}),
			);
			expect(resolveSessionDataDir()).toBe(join(makerrrData, "sessions"));
		} finally {
			for (const key of Object.keys(previous) as Array<keyof typeof previous>) {
				const value = previous[key];
				if (value === undefined) delete process.env[key];
				else process.env[key] = value;
			}
			rmSync(root, { recursive: true, force: true });
		}
	});
});
