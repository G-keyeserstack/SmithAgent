import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

type EnvSnapshot = {
	HOME: string | undefined;
	USERPROFILE: string | undefined;
	HOMEDRIVE: string | undefined;
	HOMEPATH: string | undefined;
	CLINE_DIR: string | undefined;
	MAKERRR_DIR: string | undefined;
};

function captureEnv(): EnvSnapshot {
	return {
		HOME: process.env.HOME,
		USERPROFILE: process.env.USERPROFILE,
		HOMEDRIVE: process.env.HOMEDRIVE,
		HOMEPATH: process.env.HOMEPATH,
		CLINE_DIR: process.env.CLINE_DIR,
		MAKERRR_DIR: process.env.MAKERRR_DIR,
	};
}

function restoreEnv(snapshot: EnvSnapshot): void {
	for (const key of [
		"HOME",
		"USERPROFILE",
		"HOMEDRIVE",
		"HOMEPATH",
		"CLINE_DIR",
		"MAKERRR_DIR",
	] as const) {
		const value = snapshot[key];
		if (value === undefined) delete process.env[key];
		else process.env[key] = value;
	}
}

describe("storage home directory fallback", () => {
	let snapshot: EnvSnapshot = captureEnv();

	afterEach(() => {
		restoreEnv(snapshot);
		vi.resetModules();
	});

	it("uses USERPROFILE when HOME is unset", async () => {
		snapshot = captureEnv();
		delete process.env.HOME;
		process.env.USERPROFILE = "C:\\Users\\saoud";
		delete process.env.HOMEDRIVE;
		delete process.env.HOMEPATH;
		process.env.CLINE_DIR = join("C:\\Users\\saoud", ".cline");
		delete process.env.MAKERRR_DIR;

		const { resolveClineDir } = await import("./paths");
		expect(resolveClineDir()).toBe(join("C:\\Users\\saoud", ".makerrr"));
	});

	it("prefers MAKERRR_DIR over a legacy CLINE_DIR override", async () => {
		snapshot = captureEnv();
		process.env.MAKERRR_DIR = join("C:\\Users\\saoud", ".makerrr-custom");
		process.env.CLINE_DIR = join("C:\\Users\\saoud", ".cline");

		const { resolveClineDir } = await import("./paths");
		expect(resolveClineDir()).toBe(join("C:\\Users\\saoud", ".makerrr-custom"));
	});

	it("treats HOME=~ as unset and falls back to USERPROFILE", async () => {
		snapshot = captureEnv();
		process.env.HOME = "~";
		process.env.USERPROFILE = "C:\\Users\\saoud";
		delete process.env.HOMEDRIVE;
		delete process.env.HOMEPATH;
		delete process.env.CLINE_DIR;
		delete process.env.MAKERRR_DIR;

		const { resolveClineDir } = await import("./paths");
		expect(resolveClineDir()).toBe(join("C:\\Users\\saoud", ".makerrr"));
	});
});
