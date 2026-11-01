import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { resolveSessionDataDir } from "@cline/shared/storage";

const keys = ["MAKERRR_DIR", "MAKERRR_DATA_DIR", "CLINE_DATA_DIR"] as const;
const previous = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
const roots: string[] = [];

afterEach(() => {
	for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
	for (const key of keys) {
		const value = previous[key];
		if (value === undefined) delete process.env[key];
		else process.env[key] = value;
	}
});

describe("CLI migrated runtime storage", () => {
	it("reads sessions from Makerrr after the runtime migration journal commits", () => {
		const root = mkdtempSync(join(tmpdir(), "makerrr-cli-migration-"));
		roots.push(root);
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
	});
});
