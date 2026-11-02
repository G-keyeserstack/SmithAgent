# Makerrr Editor

Makerrr is being built as a first-party, AI-native desktop code editor—not merely as an extension for another vendor's IDE.

This app uses the MIT-licensed Code OSS workbench and the VSCodium community build pipeline as its source-build foundation. The shipped product identity, application data paths, URL scheme, extension gallery and bundled agent are Makerrr-owned. The upstream build scripts are pinned to commit `ca7f7b44b5e5c3faa663f6cdc043998f71936653` for reproducibility.

## What this first editor slice does

- Builds a native desktop editor for the host OS and CPU architecture.
- Applies Makerrr application identity and a distinct `.makerrr` data-folder identifier.
- Uses Open VSX for extension discovery; it does not depend on the Microsoft Marketplace.
- Builds and bundles the existing Makerrr agent extension into the editor distribution.
- Includes opt-in, model-backed Tab completions using the developer's selected Act-mode provider. The feature is disabled by default, respects workspace trust, sends a bounded cursor context window, and supports cancellation.
- Includes an interactive local codebase search command backed by the SDK repository-intelligence service. It ranks bounded source chunks locally by lexical relevance, respects workspace trust, filters sensitive files and generated/dependency directories, and opens the selected result at its source location.
- Uses the upstream telemetry-removal build steps and does not configure Microsoft's telemetry endpoints.
- Keeps the underlying agent SDK, tools, MCP and local execution in the existing repository rather than reimplementing them in the editor shell.

## Build

Prerequisites follow the upstream [VSCodium build requirements](https://github.com/VSCodium/vscodium/blob/master/docs/howto-build.md): Git, Node.js at the version in the pinned upstream `.nvmrc`, Bun, jq, Python 3.11, Rustup and the native compiler/toolchain for your operating system. Linux additionally needs the GTK/X11 development packages listed upstream. Windows builds must run from Git Bash or WSL2.

From the repository root:

```bash
bun install --frozen-lockfile
bun run editor:verify
bun run editor:build
```

The first build downloads the pinned VSCodium build scripts and the corresponding Code OSS source into `apps/editor/.build/`. It then compiles the Makerrr extension, packages it as a VSIX and installs it into the editor's built-in extension directory.

Set `MAX_OLD_SPACE_SIZE` to change the Node.js build heap. The build output remains under `apps/editor/.build/vscodium/`.

## Current boundaries

This is the first desktop-editor foundation, not a finished Cursor-equivalent release. First-party Tab completions are implemented as an opt-in preview and still require latency, quality, provider-compatibility and cross-platform acceptance testing. Composer UX, semantic embedding-provider integration and persistent incremental indexing, multi-agent orchestration UI, cloud workspace UX, signed installers, Makerrr-owned auto-update infrastructure, notarisation and cross-platform release CI remain to be implemented and validated. Do not distribute this build as a stable release until the editor and extension build matrix is green.

The upstream Code OSS and VSCodium build-tool licences and the Cline-derived Apache-2.0 notices remain applicable. See [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md).


## Tab completions (preview)

Enable **Makerrr: Toggle Tab Completions** from the Command Palette or set `makerrr.tabCompletion.enabled` to `true`. Suggestions use the selected Act-mode model/provider. The feature is disabled by default, only runs in trusted file-based workspaces, and sends at most the configured number of source characters around the cursor (6,000 by default; adjustable from 1,000 to 12,000). It sends only the file's basename, not the absolute local path. Requests are cancelled when typing continues or the extension shuts down. Provider privacy and retention policies still apply to code sent to that provider.


## Codebase search (first release slice)

Run **Makerrr: Search Codebase** from the Command Palette (or use the configured shortcut) to search the active trusted workspace. Search is local and lexical in this release slice; it does not send source code to an embedding service. The SDK bounds indexing to 1,200 candidate files and 2,000 chunks, skips generated/dependency directories and known secret-file names, and limits individual source files to 256 KiB. Search results show file paths and line ranges and open the selected source location. This is not yet persistent/incremental indexing or semantic vector search.


## Go-live acceptance: desktop codebase search

The local codebase search slice is not considered release-ready until all of the following are demonstrated on the same release candidate:

- [ ] Desktop build and bundled Makerrr agent install successfully on supported Linux, Windows and macOS architectures.
- [ ] Command Palette and keyboard shortcut launch search from the desktop editor.
- [ ] Workspace trust is enforced before any source files are read.
- [ ] Search remains local; no source text is sent to a remote embedding provider in lexical mode.
- [ ] Secret-file filters, generated/dependency exclusions, file-size and chunk-count bounds are covered by tests.
- [ ] Selecting a result opens the correct file and line on all supported platforms.
- [ ] Empty, cancelled, inaccessible and large-workspace cases fail safely without blocking the editor.
- [ ] Linux, Windows and macOS CI matrix is green; full desktop build, extension E2E and installer smoke tests are green on the release candidate.
- [ ] Search latency, indexed file/chunk counts and memory use are measured on representative repositories before enabling persistent background indexing.

The current CI workflow covers the command interaction, repository-intelligence tests, SDK build, product identity and host typecheck on Linux, Windows and macOS. It is a feature regression lane, not a substitute for the full native desktop build and installer acceptance matrix.
