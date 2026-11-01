import {
	existsSync,
	lstatSync,
	lstatSync,
	mkdirSync,
	readFileSync,
	writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

/**
 * Makerrr's canonical global configuration root.
 *
 * Cline paths remain available through the legacy resolvers below. New
 * Makerrr data is written to ~/.makerrr unless MAKERRR_DIR or the legacy
 * CLINE_DIR override is explicitly supplied.
 */
export function resolveMakerrrDir(): string {
	const configured =
		process.env.MAKERRR_DIR?.trim() || process.env.CLINE_DIR?.trim();
	return configured || join(homedir(), ".makerrr");
}

export function resolveMakerrrDataDir(): string {
	const configured = process.env.MAKERRR_DATA_DIR?.trim();
	return configured || join(resolveMakerrrDir(), "data");
}

export function resolveMakerrrSettingsDir(): string {
	return join(resolveMakerrrDataDir(), "settings");
}

export function resolveMakerrrGlobalSettingsPath(): string {
	const configured = process.env.MAKERRR_GLOBAL_SETTINGS_PATH?.trim();
	return configured || join(resolveMakerrrSettingsDir(), "global-settings.json");
}

export function resolveMakerrrProviderSettingsPath(): string {
	const configured = process.env.MAKERRR_PROVIDER_SETTINGS_PATH?.trim();
	return configured || join(resolveMakerrrSettingsDir(), "providers.json");
}

export function resolveMakerrrMcpSettingsPath(): string {
	const configured = process.env.MAKERRR_MCP_SETTINGS_PATH?.trim();
	return configured ||
		join(resolveMakerrrSettingsDir(), "makerrr_mcp_settings.json");
}

/** The legacy root is read-only during migration; it is never removed. */
export function resolveLegacyClineDir(): string {
	const configured =
		process.env.MAKERRR_LEGACY_CLINE_DIR?.trim() ||
		process.env.CLINE_DIR?.trim();
	return configured || join(homedir(), ".cline");
}

export function resolveLegacyClineDataDir(): string {
	const configured =
		process.env.MAKERRR_LEGACY_CLINE_DATA_DIR?.trim() ||
		process.env.CLINE_DATA_DIR?.trim();
	return configured || join(resolveLegacyClineDir(), "data");
}

function assertRealDirectory(path: string, label: string): void {
	if (!existsSync(path)) {
		return;
	}
	const stats = lstatSync(path);
	if (stats.isSymbolicLink() || !stats.isDirectory()) {
		throw new Error(`${label} must be a real directory, not a symlink or file`);
	}
}

export type LegacySettingsMigrationItem = {
	source: string;
	destination: string;
	status: "would-copy" | "copied" | "already-exists" | "missing" | "failed";
	error?: string;
};

export type LegacySettingsMigrationResult = {
	sourceDir: string;
	destinationDir: string;
	items: LegacySettingsMigrationItem[];
};

/**
 * Copy the small, user-authored Cline settings files into Makerrr's settings
 * directory without overwriting existing Makerrr files or deleting sources.
 *
 * This intentionally does not copy live SQLite databases or session stores:
 * those require a coordinated, application-stopped migration. Existing Cline
 * rules/skills/workflows remain discoverable through compatibility search
 * paths until their dedicated migration is implemented.
 */
export function migrateLegacyClineSettings(options?: {
	sourceDataDir?: string;
	destinationSettingsDir?: string;
	dryRun?: boolean;
}): LegacySettingsMigrationResult {
	const sourceDir = options?.sourceDataDir || resolveLegacyClineDataDir();
	const destinationDir =
		options?.destinationSettingsDir || resolveMakerrrSettingsDir();
	const files = [
		["settings/global-settings.json", "global-settings.json"],
		["settings/providers.json", "providers.json"],
		["settings/cline_mcp_settings.json", "makerrr_mcp_settings.json"],
	] as const;

	const items: LegacySettingsMigrationItem[] = [];
	for (const [sourceRelative, destinationName] of files) {
		const source = join(sourceDir, sourceRelative);
		const destination = join(destinationDir, destinationName);
		if (!existsSync(source)) {
			items.push({ source, destination, status: "missing" });
			continue;
		}
		if (existsSync(destination)) {
			items.push({ source, destination, status: "already-exists" });
			continue;
		}
		try {
			assertRealDirectory(sourceDir, "Legacy Cline data directory");
			assertRealDirectory(dirname(source), "Legacy Cline settings directory");
			assertRealDirectory(destinationDir, "Makerrr settings destination");
			assertRealDirectory(dirname(destinationDir), "Makerrr data directory");
			assertRealDirectory(resolveMakerrrDir(), "Makerrr configuration root");
			const sourceStats = lstatSync(source);
			if (!sourceStats.isFile() || sourceStats.isSymbolicLink()) {
				throw new Error("Source is not a regular, non-symlink file");
			}
			if (options?.dryRun) {
				items.push({ source, destination, status: "would-copy" });
				continue;
			}
			mkdirSync(destinationDir, { recursive: true, mode: 0o700 });
			assertRealDirectory(destinationDir, "Makerrr settings destination");
			// Settings may contain provider credentials. Create the destination
			// exclusively with owner-only permissions; never overwrite an existing file.
			writeFileSync(destination, readFileSync(source), {
				flag: "wx",
				mode: 0o600,
			});
			items.push({ source, destination, status: "copied" });
		} catch (error) {
			items.push({
				source,
				destination,
				status: "failed",
				error: error instanceof Error ? error.message : String(error),
			});
		}
	}
	return { sourceDir, destinationDir, items };
}
