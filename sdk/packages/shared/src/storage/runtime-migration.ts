import {
	closeSync,
	copyFileSync,
	existsSync,
	mkdirSync,
	openSync,
	readdirSync,
	readFileSync,
	renameSync,
	rmSync,
	lstatSync,
	writeFileSync,
} from "node:fs";
import { randomUUID } from "node:crypto";
import { dirname, extname, join, relative, resolve } from "node:path";
import { loadSqliteDb } from "../db/sqlite-db";

export type RuntimeMigrationPhase =
	| "staging"
	| "staged"
	| "destination-backed-up"
	| "committed"
	| "rolled-back"
	| "failed";

export interface RuntimeMigrationJournal {
	version: 1;
	id: string;
	phase: RuntimeMigrationPhase;
	sourceDataDir: string;
	destinationDataDir: string;
	stagingDir: string;
	backupDir?: string;
	hadDestination: boolean;
	createdAt: string;
	updatedAt: string;
	copiedFiles: string[];
	snapshottedDatabases: string[];
	error?: string;
}

export interface RuntimeMigrationResult {
	dryRun: boolean;
	sourceDataDir: string;
	destinationDataDir: string;
	files: string[];
	databases: string[];
	journalPath: string;
	backupDir?: string;
	phase: RuntimeMigrationPhase;
}

const SQLITE_EXTENSIONS = new Set([".db", ".sqlite", ".sqlite3"]);
const SQLITE_SIDECAR = /-(?:wal|shm|journal)$/i;
const LEGACY_MCP_SETTINGS = "settings/cline_mcp_settings.json";
const MAKERRR_MCP_SETTINGS = "settings/makerrr_mcp_settings.json";

function isSqliteFile(path: string): boolean {
	return SQLITE_EXTENSIONS.has(extname(path).toLowerCase());
}

function quoteSqliteString(value: string): string {
	return "'" + value.replace(/'/g, "''") + "'";
}

function assertRegularDirectory(path: string): void {
	const stats = lstatSync(path);
	if (!stats.isDirectory() || stats.isSymbolicLink()) {
		throw new Error("Migration path must be a regular directory: " + path);
	}
}

function readIntegrity(dbPath: string): void {
	const db = loadSqliteDb(dbPath);
	try {
		const integrity = db.prepare("PRAGMA integrity_check").all();
		if (
			integrity.length !== 1 ||
			String(Object.values(integrity[0] ?? {})[0] ?? "").toLowerCase() !== "ok"
		) {
			throw new Error("SQLite integrity_check failed for " + dbPath);
		}
		const foreignKeyErrors = db.prepare("PRAGMA foreign_key_check").all();
		if (foreignKeyErrors.length > 0) {
			throw new Error(
				"SQLite foreign_key_check failed for " + dbPath + " (" +
					foreignKeyErrors.length + " violation(s))",
			);
		}
	} finally {
		db.close?.();
	}
}

function snapshotSqliteDatabase(sourcePath: string, destinationPath: string): void {
	mkdirSync(dirname(destinationPath), { recursive: true, mode: 0o700 });
	if (existsSync(destinationPath)) {
		throw new Error("Refusing to overwrite a staged SQLite database: " + destinationPath);
	}
	readIntegrity(sourcePath);
	const source = loadSqliteDb(sourcePath);
	try {
		// VACUUM INTO reads a transactionally consistent view of the database,
		// including committed WAL content, without copying -wal/-shm sidecars.
		// The caller must stop all application writers before invoking migration.
		source.exec("PRAGMA busy_timeout = 5000");
		source.exec("VACUUM INTO " + quoteSqliteString(destinationPath));
	} finally {
		source.close?.();
	}
	readIntegrity(destinationPath);
}

function walkFiles(root: string, current = root): string[] {
	const files: string[] = [];
	for (const entry of readdirSync(current, { withFileTypes: true })) {
		const absolute = join(current, entry.name);
		const stats = lstatSync(absolute);
		if (stats.isSymbolicLink()) {
			throw new Error("Symbolic links are not migrated: " + absolute);
		}
		if (entry.isDirectory()) {
			files.push(...walkFiles(root, absolute));
		} else if (entry.isFile()) {
			const rel = relative(root, absolute).split("\\").join("/");
			if (!SQLITE_SIDECAR.test(entry.name)) files.push(rel);
		} else {
			throw new Error("Unsupported filesystem entry in migration source: " + absolute);
		}
	}
	return files.sort();
}

function copyTree(
	sourceRoot: string,
	targetRoot: string,
	options: {
		copiedFiles: string[];
		snapshottedDatabases: string[];
		renameLegacyMcpSettings?: boolean;
	},
): void {
	if (!existsSync(sourceRoot)) return;
	assertRegularDirectory(sourceRoot);
	mkdirSync(targetRoot, { recursive: true, mode: 0o700 });
	for (const relativePath of walkFiles(sourceRoot)) {
		const sourcePath = join(sourceRoot, relativePath);
		const mappedPath =
			options.renameLegacyMcpSettings && relativePath === LEGACY_MCP_SETTINGS
				? MAKERRR_MCP_SETTINGS
				: relativePath;
		const destinationPath = join(targetRoot, mappedPath);
		if (existsSync(destinationPath)) {
			if (isSqliteFile(sourcePath)) {
				throw new Error(
					"Both Cline and Makerrr contain a database at " + mappedPath +
						". Automatic database merging is not supported; preserve both stores and resolve the conflict before retrying.",
				);
			}
			continue;
		}
		if (isSqliteFile(sourcePath)) {
			snapshotSqliteDatabase(sourcePath, destinationPath);
			options.snapshottedDatabases.push(mappedPath);
		} else {
			mkdirSync(dirname(destinationPath), { recursive: true, mode: 0o700 });
			copyFileSync(sourcePath, destinationPath);
			options.copiedFiles.push(mappedPath);
		}
	}
}

function writeJournal(journalPath: string, journal: RuntimeMigrationJournal): void {
	const temporaryPath = journalPath + "." + randomUUID() + ".tmp";
	journal.updatedAt = new Date().toISOString();
	writeFileSync(temporaryPath, JSON.stringify(journal, null, 2) + "\n", {
		flag: "wx",
		mode: 0o600,
	});
	renameSync(temporaryPath, journalPath);
}

function journalPathFor(destinationDataDir: string): string {
	return destinationDataDir + ".migration-journal.json";
}

function lockPathFor(destinationDataDir: string): string {
	return destinationDataDir + ".migration.lock";
}

export function recoverInterruptedRuntimeMigration(
	destinationDataDir: string,
): RuntimeMigrationJournal | undefined {
	const destination = resolve(destinationDataDir);
	const journalPath = journalPathFor(destination);
	if (!existsSync(journalPath)) return undefined;
	const journal = JSON.parse(
		readFileSync(journalPath, "utf8"),
	) as RuntimeMigrationJournal;
	if (journal.phase === "committed" || journal.phase === "rolled-back") return journal;

	const stagingExists = existsSync(journal.stagingDir);
	const backupExists = !!journal.backupDir && existsSync(journal.backupDir);
	let destinationExists = existsSync(destination);

	// A crash can occur between the destination rename and journal update.
	// Restore the backup whenever the live destination is absent, regardless
	// of whether the last durable journal phase was "staged" or later.
	if (!destinationExists && backupExists) {
		renameSync(journal.backupDir!, destination);
		destinationExists = true;
	}
	if (!stagingExists && destinationExists && (
		journal.phase === "destination-backed-up" ||
		(!journal.hadDestination && journal.phase === "staged") ||
		(backupExists && journal.phase === "staged")
	)) {
		// The staged directory was atomically promoted before the process
		// stopped. Preserve it and the old backup for an explicit rollback.
		journal.phase = "committed";
		writeJournal(journalPath, journal);
		return journal;
	}
	if (stagingExists) rmSync(journal.stagingDir, { recursive: true, force: true });
	journal.phase = "rolled-back";
	writeJournal(journalPath, journal);
	return journal;
}

export function migrateLegacyRuntimeData(options: {
	sourceDataDir: string;
	destinationDataDir: string;
	dryRun?: boolean;
}): RuntimeMigrationResult {
	const source = resolve(options.sourceDataDir);
	const destination = resolve(options.destinationDataDir);
	const sourceFromDestination = relative(destination, source);
	const destinationFromSource = relative(source, destination);
	if (
		source === destination ||
		(sourceFromDestination !== "" && !sourceFromDestination.startsWith("..") && !sourceFromDestination.startsWith("/")) ||
		(destinationFromSource !== "" && !destinationFromSource.startsWith("..") && !destinationFromSource.startsWith("/"))
	) {
		throw new Error("Source and destination data directories must be separate, non-nested paths");
	}
	if (!existsSync(source)) {
		throw new Error("Legacy Cline data directory does not exist: " + source);
	}
	assertRegularDirectory(source);
	const journalPath = journalPathFor(destination);
	const sourceFiles = walkFiles(source);
	const sourceDatabases = sourceFiles.filter(isSqliteFile);
	const sourceOrdinaryFiles = sourceFiles.filter((path) => !isSqliteFile(path));
	if (options.dryRun) {
		return {
			dryRun: true,
			sourceDataDir: source,
			destinationDataDir: destination,
			files: sourceOrdinaryFiles.map((path) =>
				path === LEGACY_MCP_SETTINGS ? MAKERRR_MCP_SETTINGS : path,
			),
			databases: sourceDatabases,
			journalPath,
			phase: "staging",
		};
	}

	const parent = dirname(destination);
	mkdirSync(parent, { recursive: true, mode: 0o700 });
	const lockPath = lockPathFor(destination);
	let lockFd: number | undefined;
	try {
		lockFd = openSync(lockPath, "wx", 0o600);
	} catch {
		throw new Error(
			"Another Makerrr migration is running, or a stale migration lock exists: " + lockPath,
		);
	}

	const id = randomUUID();
	const stagingDir = destination + ".staging-" + id;
	const backupDir = destination + ".backup-" + id;
	const hadDestination = existsSync(destination);
	const journal: RuntimeMigrationJournal = {
		version: 1,
		id,
		phase: "staging",
		sourceDataDir: source,
		destinationDataDir: destination,
		stagingDir,
		backupDir: hadDestination ? backupDir : undefined,
		hadDestination,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
		copiedFiles: [],
		snapshottedDatabases: [],
	};
	try {
		if (existsSync(journalPath)) {
			const previous = JSON.parse(
				require("node:fs").readFileSync(journalPath, "utf8"),
			) as RuntimeMigrationJournal;
			if (previous.phase !== "committed" && previous.phase !== "rolled-back") {
				throw new Error(
					"An interrupted migration journal must be recovered before retrying: " + journalPath,
				);
			}
		}
		writeJournal(journalPath, journal);
		mkdirSync(stagingDir, { recursive: true, mode: 0o700 });
		if (hadDestination) {
			copyTree(destination, stagingDir, {
				copiedFiles: journal.copiedFiles,
				snapshottedDatabases: journal.snapshottedDatabases,
			});
		}
		copyTree(source, stagingDir, {
			copiedFiles: journal.copiedFiles,
			snapshottedDatabases: journal.snapshottedDatabases,
			renameLegacyMcpSettings: true,
		});
		journal.phase = "staged";
		writeJournal(journalPath, journal);

		if (hadDestination) {
			renameSync(destination, backupDir);
			journal.phase = "destination-backed-up";
			writeJournal(journalPath, journal);
		}
		renameSync(stagingDir, destination);
		journal.phase = "committed";
		writeJournal(journalPath, journal);
		return {
			dryRun: false,
			sourceDataDir: source,
			destinationDataDir: destination,
			files: journal.copiedFiles,
			databases: journal.snapshottedDatabases,
			journalPath,
			backupDir: journal.backupDir,
			phase: journal.phase,
		};
	} catch (error) {
		if (!existsSync(destination) && hadDestination && existsSync(backupDir)) {
			renameSync(backupDir, destination);
		}
		if (existsSync(stagingDir)) rmSync(stagingDir, { recursive: true, force: true });
		journal.phase = "failed";
		journal.error = error instanceof Error ? error.message : String(error);
		try {
			writeJournal(journalPath, journal);
		} catch {}
		throw error;
	} finally {
		if (lockFd !== undefined) closeSync(lockFd);
		rmSync(lockPath, { force: true });
	}
}

export function rollbackLegacyRuntimeMigration(
	destinationDataDir: string,
): RuntimeMigrationJournal {
	const destination = resolve(destinationDataDir);
	const journalPath = journalPathFor(destination);
	if (!existsSync(journalPath)) {
		throw new Error("No Makerrr runtime migration journal exists: " + journalPath);
	}
	const journal = JSON.parse(
		require("node:fs").readFileSync(journalPath, "utf8"),
	) as RuntimeMigrationJournal;
	if (journal.phase !== "committed") {
		throw new Error("Only a committed migration can be rolled back (phase: " + journal.phase + ")");
	}
	const lockPath = lockPathFor(destination);
	let lockFd: number;
	try {
		lockFd = openSync(lockPath, "wx", 0o600);
	} catch {
		throw new Error("Cannot roll back while another migration holds the lock: " + lockPath);
	}
	if (journal.hadDestination && (!journal.backupDir || !existsSync(journal.backupDir))) {
		throw new Error("The pre-migration backup is missing; refusing destructive rollback");
	}
	const rollbackDir = destination + ".rollback-" + journal.id;
	try {
		if (existsSync(destination)) renameSync(destination, rollbackDir);
		if (journal.hadDestination && journal.backupDir && existsSync(journal.backupDir)) {
			renameSync(journal.backupDir, destination);
		}
		journal.phase = "rolled-back";
		writeJournal(journalPath, journal);
		if (existsSync(rollbackDir)) rmSync(rollbackDir, { recursive: true, force: true });
		return journal;
	} catch (error) {
		if (!existsSync(destination) && existsSync(rollbackDir)) {
			renameSync(rollbackDir, destination);
		}
		throw error;
	} finally {
		closeSync(lockFd);
		rmSync(lockPath, { force: true });
	}
}
