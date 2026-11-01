# Makerrr Core — Implementation Progress

**Branch:** `makerrr/product-foundation`  
**Scope:** First compatibility-first implementation slice following the repository capability audit.

## Implemented in source

### Configuration and migration
- Canonical global root: `~/.makerrr/`.
- Runtime data root: `~/.makerrr/data/`.
- Project configuration root: `.makerrr/`.
- New global Documents-based context files use `Documents/Makerrr/`; `Documents/Cline/` remains discoverable.
- Explicit overrides: `MAKERRR_DIR`, `MAKERRR_DATA_DIR`, `MAKERRR_GLOBAL_SETTINGS_PATH`, `MAKERRR_PROVIDER_SETTINGS_PATH`, `MAKERRR_MCP_SETTINGS_PATH`.
- Explicit legacy `CLINE_DIR` and `CLINE_DATA_DIR` values are captured as compatibility/migration sources.
- Shared SDK storage now defaults to Makerrr for CLI, VS Code, desktop and other clients using the shared path resolver.
- Global and workspace discovery now prefers Makerrr rules, skills, hooks, workflows, agents and plugins while retaining legacy Cline locations, including the `~/Makerrr/Rules` fallback used on headless/WSL systems.
- Existing Cline session, team, connector, database and chat-workspace directories remain the active runtime stores when present. New users use Makerrr data directories; existing runtime stores are not silently hidden or split between two databases.
- MCP settings now use `makerrr_mcp_settings.json`; the migration maps the old Cline MCP file to this name.
- CLI migration defaults to preview. Actual copying requires `makerrr migrate --yes`.
- VS Code offers a one-time consent prompt before copying settings.
- Migration uses exclusive file creation, owner-only file mode where supported, rejects symlinked source files/directories and destination directories, never overwrites destination files and never deletes originals.

**Migration boundary:** this first pass copies only global settings, provider settings and MCP settings. Live SQLite/session databases, workspaces and other runtime data are deliberately not copied. Those need an offline-aware migration with backup, WAL/SHM handling, rollback and version compatibility. Existing Cline rules and other text-based configuration remain discoverable through compatibility paths.

### CLI identity and local developer workflow
- CLI program identity and user-facing command are `makerrr`.
- npm wrapper package is configured as `makerrr`.
- Platform packages expose both `makerrr` and `cline` executable aliases.
- Legacy `cline` wrapper and internal `@cline/*` workspace package identifiers remain for compatibility.
- `makerrr search` reuses the SDK's existing bounded ripgrep/regex content-search executor.
- `makerrr context` aliases the existing configuration inspector for rules, skills, workflows, agents, plugins and MCP.
- Makerrr-prefixed VCR and sandbox variables are supported with Cline-prefixed fallback.
- CLI README has been rewritten to reflect development status and current migration boundaries.

### Edit safety
- Patch operations preflight every affected file before the first write.
- Update/delete operations refuse to overwrite a file whose content changed after patch computation.
- Add operations refuse an existing destination.
- Move operations refuse an existing destination.
- Relative patch paths that resolve outside the workspace through symbolic links are rejected.
- Regression tests cover stale files, multi-file preflight and symlink escapes.
- Existing checkpoint restore transaction and refusal tests were inspected and retained; no restore semantics were rewritten.

## Not yet complete

- Clean install, build, typecheck, unit and integration test runs.
- Full workspace-wide audit of Cline identifiers and persistent storage consumers.
- Offline migration of legacy SQLite/session/runtime data into Makerrr data paths.
- Migration of SQLite sessions, teams, connector state and other runtime data.
- A Makerrr-owned configuration migration UI/rollback report across all clients.
- Unified VS Code/CLI file-picker backend. CLI content search now shares the SDK executor; the VS Code file picker retains its host-native fuzzy file discovery path.
- Context inspector for the *active* prompt/session (the current CLI `context` command inspects configured sources).
- Full atomic multi-file edit transaction and preview-to-apply snapshot binding.
- Checkpoint restore changes beyond the existing upstream-tested safeguards.
- npm publication, marketplace publication or production deployment.

## Validation record

Source changes and regression tests are committed on the feature branch. No clean Bun installation, build, typecheck or test suite has been executed in this environment. GitHub Actions currently reports no workflow runs or status checks for the branch. Do not merge or publish until the repository is checked out cleanly with Bun 1.4.2 and Node >=22 and the affected test suites pass.

## Next engineering gate

1. Obtain a clean checkout and run the root install, typecheck, shared/core/CLI/VS Code tests and relevant builds.
2. Fix every regression before extending the rebrand.
3. Complete the storage consumer inventory and offline runtime-data migration design.
4. Add an active-context inspector and bind edit previews to the exact file snapshots that are later applied.
5. Only then proceed to Tab-style inline completion.
