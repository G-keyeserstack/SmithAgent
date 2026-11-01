import {
	chmodSync,
	copyFileSync,
	existsSync,
	mkdirSync,
	statSync,
} from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

/**
 * Makerrr's canonical global configuration root.
 *
 * Cline paths remain available through the legacy resolvers below. New
 * Makerrr data is always written to ~/.makerrr unless an explicit
 * MAKERRR_DIR override is supplied.
 */
export function resolveMakerrrDir(): string {
	const configured = process.env.MAKERRR_DIR?.trim();
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
	return configured || join(resolveMakerrrSettingsDir(), "makerrr_mcp_settings.json");
}

/** The legacy root is read-only during migration; it is never removed. */
export function resolveLegacyClineDir(): string {
	const configured = process.env.CLINE_DIR?.trim();
	return configured || join(homedir(), ".cline");
}

export function resolveLegacyClineDataDir(): string {
	const configured = process.env.CLINE_DATA_DIR?.trim();
	return configured || join(resolveLegacyClineDir(), "data");
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
		if (options?.dryRun) {
			items.push({ source, destination, status: "would-copy" });
			continue;
		}
		try {
			mkdirSync(destinationDir, { recursive: true, mode: 0o700 });
			const sourceStats = statSync(source);
			if (!sourceStats.isFile()) {
				throw new Error("Source is not a regular file");
			}
			// Settings may contain provider credentials. Always create private
			// destination files, regardless of the source file's old mode.
			copyFileSync(source, destination, 1); // COPYFILE_EXCL: never overwrite.
			try {
				chmodSync(destination, 0o600);
			} catch {
				// Best effort on filesystems/platforms without POSIX permissions.
			}
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
