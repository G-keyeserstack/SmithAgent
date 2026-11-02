# Makerrr Core — Implementation Progress

**Branch:** `makerrr/sqlite-runtime-migration`  
**Review:** [Draft PR #4](https://github.com/G-keyeserstack/SmithAgent/pull/4) — targets `G-keyeserstack/SmithAgent:main`; intentionally unmerged.  
**Scope:** First compatibility-first implementation slice following the repository capability audit.

## Implemented in source

### Configuration and migration
- Canonical global root: `~/.makerrr/`.
- Runtime data root: `~/.makerrr/data/`.
- Project configuration root: `.makerrr/`.
- New global Documents-based context files use `Documents/Makerrr/`; `Documents/Cline/` remains discoverable.
- Explicit overrides: `MAKERRR_DIR`, `MAKERRR_DATA_DIR`, `MAKERRR_GLOBAL_SETTINGS_PATH`, `MAKERRR_PROVIDER_SETTINGS_PATH`, `MAKERRR_MCP_SETTINGS_PATH`; explicit Makerrr data roots take precedence over legacy data discovery.
- `MAKERRR_SANDBOX` and Makerrr-prefixed sandbox data paths are honored, with Cline-prefixed fallbacks for existing integrations.
- Explicit legacy `CLINE_DIR` and `CLINE_DATA_DIR` values are captured as compatibility/migration sources.
- Shared SDK storage now defaults to Makerrr for CLI, VS Code, desktop and other clients using the shared path resolver.
- Global and workspace discovery now prefers Makerrr rules, skills, hooks, workflows, agents and plugins while retaining legacy Cline locations, including the `~/Makerrr/Rules` fallback used on headless/WSL systems.
- Existing Cline session, team, connector, database and chat-workspace directories remain the active runtime stores when present. New users use Makerrr data directories; existing runtime stores are not silently hidden or split between two databases.
- MCP settings now use `makerrr_mcp_settings.json`; the migration maps the old Cline MCP file to this name.
- CLI migration defaults to preview. Actual copying requires `makerrr migrate --yes`.
- VS Code offers a one-time consent prompt before copying settings.
- Migration uses exclusive file creation, owner-only file mode where supported, rejects symlinked source files/directories and destination directories, never overwrites destination files and never deletes originals.

**Migration boundary:** settings-only migration remains the lightweight default. Draft PR #4 adds a shared SQLite-aware runtime migration prototype: it stages the destination and Cline source, snapshots SQLite databases with `VACUUM INTO` (including committed WAL content), skips transient SQLite sidecars, rejects symlinks/special files and conflicting data, writes an external fsynced transaction journal, and supports interrupted-cutover recovery and explicit rollback. The CLI requires `--runtime --yes --offline`; recovery and rollback also require explicit confirmation. Cline source data is not deleted. A committed journal makes shared runtime resolvers switch to the Makerrr destination, while rollback restores legacy path selection. This is not yet production-approved: process quiescence is user-asserted, and full schema/version compatibility, application-level record validation and cross-client acceptance remain release gates.

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
- Relative and absolute patch paths that resolve outside the workspace are rejected when workspace restriction is enabled, including symlink escapes.
- New-file and move destinations use exclusive creation so a file created after preflight is not overwritten.
- Path checks are segment-aware, allowing valid in-workspace names that begin with `..`.
- Regression tests cover stale files, multi-file preflight and symlink escapes.
- Existing checkpoint restore transaction and refusal tests were inspected and retained; no restore semantics were rewritten.

## Not yet complete

- Clean install, build, typecheck, unit and integration test runs.
- Full workspace-wide audit of Cline identifiers and persistent storage consumers.
- Production-grade migration acceptance: complete persistent-store/schema inventory, automatic process-quiescence verification, schema/version compatibility, application-level record checks and full client acceptance.
- Cross-platform recovery validation beyond the current prototype fixtures.
- A Makerrr-owned configuration migration UI/rollback report across all clients.
- Unified VS Code/CLI file-picker backend. CLI content search now shares the SDK executor; the VS Code file picker retains its host-native fuzzy file discovery path.
- Context inspector for the *active* prompt/session (the current CLI `context` command inspects configured sources).
- Full atomic multi-file edit transaction and preview-to-apply snapshot binding.
- Checkpoint restore changes beyond the existing upstream-tested safeguards.
- npm publication, marketplace publication or production deployment.

## Validation record

The baseline GitHub Actions run 41322386660 failed on both Ubuntu and Windows. The Windows logs identified four shared-storage failures (legacy settings fixture path, old `.cline` home expectation, old workspace task path) and four core failures (workspace plugin installation path, legacy/global rules fixture isolation, plugin search-path count, configured agent root). The Ubuntu logs showed the same path/configuration classes plus Desktop MCP settings expectations; the CLI test process was also interrupted after the failing package tests. PR #4 contains fixes for those failures, updates the workspace plugin installer to use the shared Makerrr-first resolver, and adds runtime-migration tests.

The runtime migration prototype and path activation tests are now in the PR. CI for the latest candidate has been triggered, but no passing full-matrix result has yet been verified. No clean local checkout or local Bun test run has been possible in this environment. Do not merge or publish until the exact PR head passes frozen install, builds, typechecks, shared/core/CLI/VS Code/Desktop tests and the platform matrix.

## Next engineering gate

1. Finish the current Ubuntu and Windows CI runs and inspect every failing step/log, including the new runtime-migration suite.
2. Correct failures in the PR branch only and rerun the complete affected suites.
3. Validate that CLI, VS Code and Desktop all resolve the committed Makerrr data root and read migrated sessions/configuration; test rollback switches all clients back.
4. Complete the persistent-store/schema inventory, process-quiescence verification and application-level record checks.
5. Run the full SDK/CLI/VS Code/Desktop CI matrix on the exact final PR head.
6. Complete the security review and independent review of journal recovery/rollback.
7. Keep PR #4 unmerged until every acceptance gate is evidenced.
