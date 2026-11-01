import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
	migrateLegacyClineSettings,
	resolveLegacyClineDir,
	resolveMakerrrDataDir,
	resolveMakerrrDir,
	resolveMakerrrGlobalSettingsPath,
	resolveMakerrrMcpSettingsPath,
	resolveMakerrrProviderSettingsPath,
} from "./makerrr-paths";

const ENV_KEYS = [
	"MAKERRR_DIR",
	"MAKERRR_DATA_DIR",
	"MAKERRR_GLOBAL_SETTINGS_PATH",
	"MAKERRR_MCP_SETTINGS_PATH",
	"MAKERRR_PROVIDER_SETTINGS_PATH",
	"CLINE_DIR",
	"CLINE_DATA_DIR",
] as const;

const originalEnv = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));
const roots: string[] = [];

function tempRoot(): string {
	const root = mkdtempSync(join(tmpdir(), "makerrr-paths-"));
	roots.push(root);
	return root;
}

afterEach(() => {
	for (const key of ENV_KEYS) {
		const value = originalEnv[key];
		if (value === undefined) delete process.env[key];
		else process.env[key] = value;
	}
	for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("Makerrr path resolution", () => {
	it("uses ~/.makerrr by default and derives data/settings paths", () => {
		delete process.env.MAKERRR_DIR;
		delete process.env.MAKERRR_DATA_DIR;
		expect(resolveMakerrrDir()).toMatch(/[\\/]\.makerrr$/);
		expect(resolveMakerrrDataDir()).toBe(join(resolveMakerrrDir(), "data"));
	});

	it("honours explicit Makerrr environment overrides", () => {
		const root = join(tempRoot(), "custom");
		process.env.MAKERRR_DIR = root;
		delete process.env.MAKERRR_DATA_DIR;
		expect(resolveMakerrrDir()).toBe(root);
		expect(resolveMakerrrDataDir()).toBe(join(root, "data"));

		process.env.MAKERRR_DATA_DIR = join(root, "state");
		process.env.MAKERRR_GLOBAL_SETTINGS_PATH = join(root, "global.json");
		process.env.MAKERRR_PROVIDER_SETTINGS_PATH = join(root, "providers.json");
		process.env.MAKERRR_MCP_SETTINGS_PATH = join(root, "mcp.json");
		expect(resolveMakerrrDataDir()).toBe(join(root, "state"));
		expect(resolveMakerrrGlobalSettingsPath()).toBe(join(root, "global.json"));
		expect(resolveMakerrrProviderSettingsPath()).toBe(join(root, "providers.json"));
		expect(resolveMakerrrMcpSettingsPath()).toBe(join(root, "mcp.json"));
	});

	it("resolves the legacy Cline root without redirecting Makerrr writes", () => {
		const legacy = join(tempRoot(), "old-cline");
		process.env.CLINE_DIR = legacy;
		process.env.MAKERRR_DIR = join(tempRoot(), "new-makerrr");
		expect(resolveLegacyClineDir()).toBe(legacy);
		expect(resolveMakerrrDir()).not.toBe(legacy);
	});
});

describe("legacy Cline settings migration", () => {
	it("copies known settings without changing or deleting the source files", () => {
		const root = tempRoot();
		const source = join(root, "cline-data");
		const destination = join(root, "makerrr-settings");
		mkdirSync(join(source, "settings"), { recursive: true });
		writeFileSync(join(source, "settings", "global-settings.json"), '{"theme":"dark"}');
		writeFileSync(join(source, "settings", "providers.json"), '{"provider":"local"}');
		writeFileSync(join(source, "settings", "cline_mcp_settings.json"), '{"mcpServers":{}}');

		const result = migrateLegacyClineSettings({
			sourceDataDir: source,
			destinationSettingsDir: destination,
		});

		expect(result.items.map((item) => item.status)).toEqual(["copied", "copied", "copied"]);
		expect(readFileSync(join(destination, "global-settings.json"), "utf8")).toBe('{"theme":"dark"}');
		expect(readFileSync(join(destination, "providers.json"), "utf8")).toBe('{"provider":"local"}');
		expect(readFileSync(join(destination, "makerrr_mcp_settings.json"), "utf8")).toBe('{"mcpServers":{}}');
		expect(existsSync(join(source, "settings", "global-settings.json"))).toBe(true);
		expect(existsSync(join(source, "settings", "providers.json"))).toBe(true);
	});

	it("never overwrites existing Makerrr settings and reports missing sources", () => {
		const root = tempRoot();
		const source = join(root, "cline-data");
		const destination = join(root, "makerrr-settings");
		mkdirSync(join(source, "settings"), { recursive: true });
		mkdirSync(destination, { recursive: true });
		writeFileSync(join(source, "global-settings.json"), '{"from":"cline"}');
		writeFileSync(join(destination, "global-settings.json"), '{"from":"makerrr"}');

		const result = migrateLegacyClineSettings({
			sourceDataDir: source,
			destinationSettingsDir: destination,
		});

		expect(result.items.map((item) => item.status)).toEqual([
			"already-exists",
			"missing",
			"missing",
		]);
		expect(readFileSync(join(destination, "global-settings.json"), "utf8")).toBe('{"from":"makerrr"}');
	});

	it("does not migrate live session databases or arbitrary files", () => {
		const root = tempRoot();
		const source = join(root, "cline-data");
		const destination = join(root, "makerrr-settings");
		mkdirSync(join(source, "settings"), { recursive: true });
		writeFileSync(join(source, "sessions.db"), "live database");
		writeFileSync(join(source, "settings", "providers.json"), "{}");

		const result = migrateLegacyClineSettings({
			sourceDataDir: source,
			destinationSettingsDir: destination,
		});

		expect(result.items).toHaveLength(3);
		expect(existsSync(join(destination, "sessions.db"))).toBe(false);
		expect(existsSync(join(source, "sessions.db"))).toBe(true);
	});
});
