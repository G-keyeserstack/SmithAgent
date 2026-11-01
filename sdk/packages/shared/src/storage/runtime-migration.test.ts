import {
	existsSync,
	mkdirSync,
	mkdtempSync,
	symlinkSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { loadSqliteDb } from "../db/sqlite-db";
import {
	migrateLegacyRuntimeData,
	recoverInterruptedRuntimeMigration,
	rollbackLegacyRuntimeMigration,
	type RuntimeMigrationJournal,
} from "./runtime-migration";

const roots: string[] = [];
function makeRoot(): string {
	const root = mkdtempSync(join(tmpdir(), "makerrr-runtime-migration-"));
	roots.push(root);
	return root;
}

afterEach(() => {
	for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

function createDatabase(path: string, value: string): void {
	const db = loadSqliteDb(path);
	try {
		db.exec("PRAGMA journal_mode=WAL");
		db.exec("CREATE TABLE IF NOT EXISTS records (id INTEGER PRIMARY KEY, value TEXT NOT NULL)");
		db.prepare("INSERT INTO records(value) VALUES (?)").run(value);
	} finally {
		db.close?.();
	}
}

describe("Makerrr runtime migration", () => {
	it("snapshots committed WAL data and renames the legacy MCP settings file", () => {
		const root = makeRoot();
		const source = join(root, ".cline", "data");
		const destination = join(root, ".makerrr", "data");
		mkdirSync(join(source, "settings"), { recursive: true });
		const databasePath = join(source, "db", "sessions.db");
		createDatabase(databasePath, "committed-in-wal");
		// Keep a second SQLite connection open so the committed WAL remains
		// present while the migration takes its consistent snapshot.
		const walKeeper = loadSqliteDb(databasePath);
		expect(existsSync(databasePath + "-wal")).toBe(true);
		writeFileSync(
			join(source, "settings", "cline_mcp_settings.json"),
			JSON.stringify({ mcpServers: {} }),
		);
		writeFileSync(join(source, "session-note.json"), '{"note":"legacy"}');

		const preview = migrateLegacyRuntimeData({
			sourceDataDir: source,
			destinationDataDir: destination,
			dryRun: true,
		});
		expect(preview.dryRun).toBe(true);
		expect(preview.databases).toContain("db/sessions.db");

		const result = migrateLegacyRuntimeData({
			sourceDataDir: source,
			destinationDataDir: destination,
		});
		walKeeper.close?.();
		expect(result.phase).toBe("committed");
		expect(existsSync(join(destination, "settings", "makerrr_mcp_settings.json"))).toBe(true);
		expect(existsSync(join(destination, "settings", "cline_mcp_settings.json"))).toBe(false);
		expect(readFileSync(join(destination, "session-note.json"), "utf8")).toContain("legacy");

		const migrated = loadSqliteDb(join(destination, "db", "sessions.db"));
		try {
			expect(migrated.prepare("SELECT value FROM records").get()).toMatchObject({
				value: "committed-in-wal",
			});
		} finally {
			migrated.close?.();
		}
		expect(existsSync(join(source, "db", "sessions.db"))).toBe(true);
	});

	it("preserves the previous destination and supports explicit rollback", () => {
		const root = makeRoot();
		const source = join(root, "cline-data");
		const destination = join(root, "makerrr-data");
		mkdirSync(source, { recursive: true });
		mkdirSync(destination, { recursive: true });
		writeFileSync(join(source, "legacy.txt"), "from-cline");
		writeFileSync(join(destination, "existing.txt"), "keep-makerrr");

		const result = migrateLegacyRuntimeData({
			sourceDataDir: source,
			destinationDataDir: destination,
		});
		expect(readFileSync(join(destination, "legacy.txt"), "utf8")).toBe("from-cline");
		expect(readFileSync(join(destination, "existing.txt"), "utf8")).toBe("keep-makerrr");
		expect(result.backupDir).toBeDefined();
		expect(existsSync(result.backupDir ?? "")).toBe(true);

		const journal = rollbackLegacyRuntimeMigration(destination);
		expect(journal.phase).toBe("rolled-back");
		expect(readFileSync(join(destination, "existing.txt"), "utf8")).toBe("keep-makerrr");
		expect(existsSync(join(destination, "legacy.txt"))).toBe(false);
		expect(existsSync(join(source, "legacy.txt"))).toBe(true);
	});

	it("recovers a crash after the old destination was renamed but before promotion", () => {
		const root = makeRoot();
		const destination = join(root, "makerrr-data");
		const staging = destination + ".staging-test";
		const backup = destination + ".backup-test";
		const journalPath = destination + ".migration-journal.json";
		mkdirSync(backup, { recursive: true });
		mkdirSync(staging, { recursive: true });
		writeFileSync(join(backup, "original.txt"), "original");
		writeFileSync(join(staging, "new.txt"), "new");
		const now = new Date().toISOString();
		const journal: RuntimeMigrationJournal = {
			version: 1,
			id: "test",
			phase: "destination-backed-up",
			sourceDataDir: join(root, "cline-data"),
			destinationDataDir: destination,
			stagingDir: staging,
			backupDir: backup,
			hadDestination: true,
			createdAt: now,
			updatedAt: now,
			copiedFiles: [],
			snapshottedDatabases: [],
		};
		writeFileSync(journalPath, JSON.stringify(journal));
		writeFileSync(
			destination + ".migration.lock",
			JSON.stringify({ pid: 99999999, createdAt: now }),
		);

		const recovered = recoverInterruptedRuntimeMigration(destination);
		expect(recovered?.phase).toBe("rolled-back");
		expect(readFileSync(join(destination, "original.txt"), "utf8")).toBe("original");
		expect(existsSync(staging)).toBe(false);
		expect(existsSync(destination + ".migration.lock")).toBe(false);
	});

	it("recognizes a promoted staging directory when the process stops before the commit journal update", () => {
		const root = makeRoot();
		const destination = join(root, "makerrr-data");
		const staging = destination + ".staging-test";
		const journalPath = destination + ".migration-journal.json";
		mkdirSync(destination, { recursive: true });
		writeFileSync(join(destination, "promoted.txt"), "new-data");
		const now = new Date().toISOString();
		const journal: RuntimeMigrationJournal = {
			version: 1,
			id: "promoted",
			phase: "staged",
			sourceDataDir: join(root, "cline-data"),
			destinationDataDir: destination,
			stagingDir: staging,
			hadDestination: false,
			createdAt: now,
			updatedAt: now,
			copiedFiles: ["promoted.txt"],
			snapshottedDatabases: [],
		};
		writeFileSync(journalPath, JSON.stringify(journal));

		const recovered = recoverInterruptedRuntimeMigration(destination);
		expect(recovered?.phase).toBe("committed");
		expect(readFileSync(join(destination, "promoted.txt"), "utf8")).toBe("new-data");
	});

	it("refuses to overwrite a database when both stores contain the same relative path", () => {
		const root = makeRoot();
		const source = join(root, "cline-data");
		const destination = join(root, "makerrr-data");
		createDatabase(join(source, "db", "sessions.db"), "legacy");
		createDatabase(join(destination, "db", "sessions.db"), "existing");
		expect(() =>
			migrateLegacyRuntimeData({
				sourceDataDir: source,
				destinationDataDir: destination,
			}),
		).toThrow(/Automatic database merging is not supported/);
		const existing = loadSqliteDb(join(destination, "db", "sessions.db"));
		try {
			expect(existing.prepare("SELECT value FROM records").get()).toMatchObject({
				value: "existing",
			});
		} finally {
			existing.close?.();
		}
	});

	it("rejects symbolic links instead of following them into user data", () => {
		const root = makeRoot();
		const source = join(root, "cline-data");
		const destination = join(root, "makerrr-data");
		mkdirSync(source, { recursive: true });
		writeFileSync(join(root, "outside.txt"), "private");
		symlinkSync(join(root, "outside.txt"), join(source, "linked.txt"));
		expect(() =>
			migrateLegacyRuntimeData({
				sourceDataDir: source,
				destinationDataDir: destination,
			}),
		).toThrow(/Symbolic links are not migrated/);
		expect(existsSync(destination)).toBe(false);
	});
});
