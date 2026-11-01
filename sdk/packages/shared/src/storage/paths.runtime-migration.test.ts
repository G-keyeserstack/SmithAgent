import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { resolveClineDataDir, resolveDbDataDir, resolveSessionDataDir } from "./paths";

const keys = [
	"MAKERRR_DIR",
	"MAKERRR_DATA_DIR",
	"MAKERRR_LEGACY_CLINE_DATA_DIR",
	"MAKERRR_SESSION_DATA_DIR",
	"MAKERRR_DB_DATA_DIR",
	"CLINE_DATA_DIR",
	"CLINE_SESSION_DATA_DIR",
	"CLINE_DB_DATA_DIR",
] as const;
const originalEnv = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
const roots: string[] = [];

afterEach(() => {
	for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
	for (const key of keys) {
		const value = originalEnv[key];
		if (value === undefined) delete process.env[key];
		else process.env[key] = value;
	}
});

describe("runtime migration path activation", () => {
	it("switches all shared runtime resolvers to Makerrr only after a committed journal", () => {
		const root = mkdtempSync(join(tmpdir(), "makerrr-runtime-paths-"));
		roots.push(root);
		const makerrrRoot = join(root, ".makerrr");
		const makerrrData = join(makerrrRoot, "data");
		const legacyData = join(root, ".cline", "data");
		mkdirSync(join(makerrrData, "sessions"), { recursive: true });
		mkdirSync(join(makerrrData, "db"), { recursive: true });
		mkdirSync(join(legacyData, "sessions"), { recursive: true });
		mkdirSync(join(legacyData, "db"), { recursive: true });

		process.env.MAKERRR_DIR = makerrrRoot;
		delete process.env.MAKERRR_DATA_DIR;
		delete process.env.MAKERRR_LEGACY_CLINE_DATA_DIR;
		process.env.CLINE_DATA_DIR = legacyData;
		for (const key of [
			"MAKERRR_SESSION_DATA_DIR",
			"MAKERRR_DB_DATA_DIR",
			"CLINE_SESSION_DATA_DIR",
			"CLINE_DB_DATA_DIR",
		]) delete process.env[key];

		expect(resolveClineDataDir()).toBe(legacyData);
		expect(resolveSessionDataDir()).toBe(join(legacyData, "sessions"));
		expect(resolveDbDataDir()).toBe(join(legacyData, "db"));

		const journalPath = makerrrData + ".migration-journal.json";
		const journal = {
			version: 1,
			phase: "committed",
			destinationDataDir: makerrrData,
		};
		writeFileSync(journalPath, JSON.stringify(journal));

		expect(resolveClineDataDir()).toBe(makerrrData);
		expect(resolveSessionDataDir()).toBe(join(makerrrData, "sessions"));
		expect(resolveDbDataDir()).toBe(join(makerrrData, "db"));

		writeFileSync(journalPath, JSON.stringify({ ...journal, phase: "rolled-back" }));
		expect(resolveSessionDataDir()).toBe(join(legacyData, "sessions"));
		expect(resolveDbDataDir()).toBe(join(legacyData, "db"));
	});
});
