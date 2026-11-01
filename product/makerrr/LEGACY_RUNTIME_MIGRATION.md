# Legacy Cline Runtime Migration — Safety Design

**Status:** Design specification; not an authorization to move live user data.  
**Scope:** Existing Cline runtime data transitioning to Makerrr-managed paths on the same device.  
**Primary invariant:** The original Cline tree remains recoverable and is never deleted by the migration.

## 1. Migration principles

1. Migration is opt-in, explicit and previewable. Startup must never silently move a database.
2. Existing installations continue using their existing Cline runtime stores until a complete migration is explicitly committed. Do not split one logical store across Cline and Makerrr.
3. Fresh Makerrr installations use `~/.makerrr/data` and do not create or depend on Cline paths.
4. Never modify the source database, source settings or source workspace during migration.
5. Never overwrite an existing destination. A collision is a hard stop requiring user review.
6. Every operation is idempotent, auditable and recoverable. An interrupted run must be safe to retry.
7. A successful file copy is not sufficient: application/schema compatibility and representative client startup must also pass.

## 2. Inventory and migration manifest

Before implementation, enumerate every persistent store through the actual storage resolvers and their consumers. The inventory must include, at minimum:

- global settings and provider credentials;
- MCP and connector configuration, including encrypted/secret material and connector state;
- session databases, session metadata, message/task artifacts and checkpoints;
- team databases and team/task state;
- cron/schedule databases and file-backed specifications;
- task queue databases and file-backed task specifications;
- connector databases, logs and per-connector data;
- chat workspaces, attachments, generated files and other user-owned workspace content;
- user-authored rules, skills, agents, hooks, workflows and plugins.

For each store, record its resolver, concrete filenames, format, schema/version marker, owning process, write concurrency, encryption/key dependency, size estimate, and compatibility readers in CLI, VS Code and Desktop. Do not infer filenames or schema from directory names; derive them from the current source and runtime tests.

A versioned manifest should record source and destination roots, store identifiers, source file sizes and hashes, source schema versions, destination schema versions, migration tool version, backup location, timestamps, per-store state and validation results. It must not contain secrets or prompt/source contents.

## 3. Preflight and quiescence

The migration command should have separate `inspect`, `backup`, `stage`, `validate` and `commit` phases. Default invocation is read-only.

Preflight must:
- resolve source and destination using the same shared path resolver used by all clients;
- canonicalize paths and reject source/destination overlap, symlink roots, path traversal and unexpected mount boundaries;
- check available disk space for a complete backup plus staged destination;
- verify ownership and restrictive permissions;
- detect running Makerrr/Cline processes and open database handles where possible;
- identify all databases and dependent files, including sidecar files;
- detect destination collisions and unsupported schema versions;
- write a plan and require explicit confirmation before any writes.

Before a database snapshot, stop all writers cleanly: close CLI/VS Code/Desktop database connections, stop background services, flush pending writes and acquire an exclusive migration lock. If quiescence cannot be proven, abort. Do not kill processes or attempt a live file copy as a fallback.

## 4. SQLite backup and WAL/SHM handling

**Preferred method:** use SQLite's supported online backup API through the repository's supported SQLite driver, with the source application quiesced. Snapshot each database to a new temporary backup file. This produces a consistent database image that includes committed transactions represented in the WAL. Never assume copying only the main `.db` file captures committed WAL transactions.

For every SQLite store:
1. Record `PRAGMA user_version`, application schema/version metadata and source database identity.
2. Confirm no application writer is active; checkpoint/close using the database owner's normal lifecycle.
3. Use the SQLite backup API into a new temporary file. If the driver cannot perform a backup, stop and implement a tested driver-specific backup path; do not silently fall back to copying a live database.
4. Run `PRAGMA integrity_check` on the backup and require exactly `ok`. Run `PRAGMA foreign_key_check` where the schema uses foreign keys.
5. Re-open the backup read-only and verify expected schema tables, indexes, migration metadata, row-count invariants and application-level sample reads.
6. Record the backup hash and validation report in the migration manifest.

**WAL/SHM rules:**
- A `-wal` file may contain committed transactions not yet checkpointed into the main database. It must be included by SQLite's backup mechanism or by a documented, quiesced SQLite-aware snapshot.
- A `-shm` file is a transient WAL index, not an independent durable data store. Do not copy a stale SHM file into the new active database directory. SQLite should recreate it as needed.
- Do not delete, truncate, rename or manually checkpoint source `-wal` or `-shm` files during migration.
- After the backup has been independently validated, close all handles to the staged copy. Let SQLite create/rebuild destination sidecars on first open.
- If using a filesystem snapshot as a tested fallback, snapshot the database and WAL consistently while all writers are stopped; retain the original source sidecars untouched. A raw copy of an active database is prohibited.

## 5. Staging, compatibility and commit

Stage all stores into a versioned temporary directory on the same filesystem as the final Makerrr destination. Preserve relative layout and restrictive permissions. Copy file-backed user content without following symlinks; reject special files and unsafe links. Hash files before and after copying.

Before commit:
- run database integrity, foreign-key and schema checks;
- run supported schema migrations on staged copies only;
- verify application version compatibility and required provider/connector secret references;
- compare source and staged file hashes for byte-preserved files;
- run read-only smoke tests through the actual SDK storage repositories;
- validate sessions, teams, connectors, schedules, tasks and checkpoints through their normal APIs;
- produce a human-readable report for every migrated, skipped, incompatible or failed store.

Commit only after every required store passes. Prefer an atomic same-filesystem directory rename from a fully validated staging root. If an atomic directory swap is not supported on a platform, use a tested per-store journal with recoverable states; never report success for a partially committed multi-store migration. A destination collision or unexpected file change aborts commit.

## 6. Rollback and recovery

- Keep the original Cline tree unchanged and available after commit.
- Retain a verified, immutable pre-migration backup until the user explicitly confirms successful operation and the configured retention period expires.
- Before first Makerrr write to migrated stores, retain a rollback point. Rollback must stop all clients and restore the complete consistent set, not just selected database files.
- Store a transaction journal outside the directory being swapped. Each step is durable and restartable: `planned`, `backed-up`, `staged`, `validated`, `committing`, `committed`, `rolled-back`, or `needs-recovery`.
- On interruption, detect the journal and offer resume or rollback. Never guess which side of a rename is authoritative.
- If Makerrr has already written new data after cutover, do not overwrite it with an old backup. Require an explicit recovery workflow that exports or reconciles post-cutover writes.
- Never automatically delete backups or legacy sources.

## 7. Cross-client compatibility acceptance

The same path resolver and migrated stores must be tested through:
- CLI: inspect, migrate preview, backup, migrate, restart, history/session retrieval, provider configuration, edit/approval and checkpoint restore;
- VS Code: first-run consent, restart, session continuity, provider configuration, approval flow, diff application and restore;
- Desktop: clean launch, restart, sidecar startup, provider configuration, session continuity, approval flow, diff application and restore.

Test matrix:
- fresh Makerrr home with no Cline directories;
- legacy Cline home with all supported stores and non-empty databases;
- legacy home with active WAL transactions;
- legacy home with no WAL, stale SHM and no SHM;
- partially populated and mixed-version stores;
- destination already populated or conflicting;
- insufficient disk space, read-only source, permission failure and symlink attack;
- interruption at every journal state and retry;
- rollback before and after the first Makerrr write;
- supported older schema versions and a deliberately unsupported future schema.

For every fixture, assert that the source tree is byte-for-byte unchanged, migrated user-visible records remain readable, no records are duplicated, no data is silently omitted, and all three clients resolve the same canonical store.

## 8. Release gates and security review

The migration is not production-ready until:
- the persistent-store inventory is complete and code-reviewed;
- backup/restore and crash-recovery tests pass on Linux, macOS and Windows;
- all migration writes are least-privilege and path-safe;
- secrets are not logged or included in manifests;
- source immutability and destination collision handling are tested;
- database integrity and application-level compatibility checks pass;
- CLI, VS Code and Desktop smoke tests pass on fresh and upgraded fixtures;
- a security review covers symlinks, path traversal, TOCTOU races, permissions, secret handling, lock ownership, interrupted commits and malicious/corrupt databases;
- the full CI matrix passes on the exact release commit.

Until those gates pass, existing installations should continue using the Cline runtime data directories in place. The current settings-only migration remains the only supported copy operation.
