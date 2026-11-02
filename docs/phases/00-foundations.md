# Phase 0 — Foundations

Status: **PLAN**. Execution is not approved. No acceptance item below has been run. Do not mark any of them done in this document until a command has produced the evidence and that evidence is pasted into the Evidence section.

| | |
|---|---|
| Date | 2026-11-02 |
| Repo | [G-keyeserstack/SmithAgent](https://github.com/G-keyeserstack/SmithAgent) |
| Plan branch | `phase-0/editor-shell` |
| Base | `main` @ `8d09492a12f39cc820ddae403b5819b54264f151` |
| Owner | Makerrr / Suppple Group Plc |

This file is the Phase 0 plan required before any editor-shell work. It is not a claim that Makerrr launches.

## Scope

In:

- Pin Code-OSS, fetch it out of tree, and apply a Makerrr patch series that is written against that pin.
- Brand the shell Makerrr. Bundle id `app.makerrr.editor`. Data directory `~/.makerrr`.
- Extension gallery is Open VSX only.
- Telemetry, crash reporting, experiments, and the GitHub Copilot product pointers default off.
- CI that fails when a patch does not apply. A manually dispatched Linux build job.
- License files and an ADR for the package-manager decision.
- A `docs/PARITY.md` matrix, created on the first execution commit, not in this plan commit.

Out:

- Phase 1 agent integration, model gateway, Tab, inline edit, indexing, cloud, billing, notarized installers.
- Renaming `@cline/*` packages or the `apps/vscode` extension id.
- Replacing root `AGENTS.md`. That file is the Bun/Cline cloud-agent contract (`Do not use npm/yarn/pnpm`). The master prompt's pnpm + Turborepo line loses to it. See ADR 0001, to be written on approval.
- Deleting the upstream Copilot/agent source. It stays compiling and is not activated.
- Apple notarization and Windows Authenticode. No Developer ID has been supplied.
- Remote SSH / `vsda`. Microsoft's remote server is not shipped.

### What already exists

SmithAgent is already the Makerrr agent repository: Cline, Apache-2.0, Bun 1.4.2, Node >= 22. Surfaces that Phase 0 must not break:

| Surface | Path |
|---|---|
| VS Code extension | `apps/vscode` (package name still `claude-dev`) |
| CLI | `apps/cli` |
| Desktop (Tauri + Next) | `apps/examples/desktop-app` |
| SDK | `sdk/` |
| Product docs | `product/makerrr/` |
| Dependency patches | root `patches/` (OpenTUI, shadcn, ollama provider). These are Bun patches, not editor patches. |

Editor patches therefore live in `apps/editor/patches/`, never in root `patches/`.

## Design

### Pin

| | |
|---|---|
| Tag | `1.144.0` (stable, released 28 Oct 2026) |
| Commit | `2c33b50b16c472efe58357d1d2a8a5414bc23fbf` |
| Tag type | Lightweight. The ref SHA is the commit. Confirmed via the Git refs API. |
| Expected toolchain | Electron 43.8.3, Node 24.22.0, Chromium 150.0.7871.250 |

First execution step is to read `engines` / electron from that commit's `package.json` and correct this table if it disagrees. Nothing else is trusted until that read happens.

Why not Insiders, and why not a monthly rebase: VS Code has shipped weekly stables since March 2026. The pin is the current stable. The rebase job runs every two weeks against the newest stable tag, not monthly.

### Layout

Code-OSS is not vendored into git.

```
apps/editor/                 # tracked: patches, scripts, product notes
apps/editor/src/             # gitignored checkout of 2c33b50
apps/editor/patches/*.patch  # our series, written against that commit
scripts/fetch-vscode.sh
scripts/apply-patches.sh
```

`scripts/fetch-vscode.sh` clones `https://github.com/microsoft/vscode` at `2c33b50` into `apps/editor/src`. `scripts/apply-patches.sh` applies the series with `git apply --check` first, then `git apply`, and exits non-zero on the first reject. A reject is a failed phase, not a fuzzy match to paper over.

The checkout is not a Bun workspace member. Code-OSS keeps its own install and gulp build. Root `bun install` and `bun run test` must not start resolving it.

### Package manager (ADR 0001, on approval)

The master prompt asks for pnpm and Turborepo. Root `AGENTS.md` forbids npm, yarn, and pnpm. The repository already builds, tests, and releases with Bun. Introducing a second package manager at the root is a migration, not a foundation.

Decision, pending approval: Bun stays for SmithAgent. The editor fork is a side checkout with upstream's own package manager. Turborepo is not added in Phase 0.

### product.json at the pin

Code-OSS `product.json` has no `extensionsGallery` and no `updateUrl`. Identity is `Code - OSS`, `com.visualstudio.code.oss`, `.vscode-oss`, `.vscode-oss-shared`. It also already contains:

- `defaultChatAgent` aimed at `GitHub.copilot` and `GitHub.copilot-chat`, including `api.github.com/copilot_internal/*` and `aka.ms` URLs.
- `builtInExtensionsEnabledWithAutoUpdates: ["GitHub.copilot-chat"]`.
- `trustedExtensionAuthAccess` granting GitHub auth to Copilot Chat.
- `voiceWsUrl`: `wss://falcon-caas.mai.microsoft.com/voice-code/api/v1/realtime/voice`.
- `webviewContentExternalBaseUrlTemplate` on `vscode-cdn.net` for commit `ef65ac1ba57f57f2a3961bfe94aa20481caca4c6`, which is not our pin. The gulp build is expected to rewrite it. If it does not, webviews are stop-ship.
- Built-ins, kept: `ms-vscode.js-debug-companion@1.1.3`, `ms-vscode.js-debug@1.140.0`, `ms-vscode.vscode-js-profile-table@1.0.11`. They are fetched from their GitHub repos and are MIT. They stay so Run and Debug works. Publisher metadata is not rewritten to claim them as Makerrr.

### Target identity

| Key | Value |
|---|---|
| nameShort / nameLong | Makerrr |
| applicationName | makerrr |
| dataFolderName | `.makerrr` |
| sharedDataFolderName | `.makerrr-shared` |
| urlProtocol | `makerrr` |
| darwinBundleIdentifier | `app.makerrr.editor` |
| linuxDesktopName | `app.makerrr.editor` |
| linuxIconName | `makerrr` |
| win32MutexName | `makerrr` |
| win32DirName / win32NameVersion | Makerrr |
| win32RegValueName | Makerrr |
| win32AppUserModelId | `Makerrr.Editor` |
| win32ShellNameShort | `Ma&kerrr` |
| serverApplicationName | `makerrr-server` |
| serverDataFolderName | `.makerrr-server` |
| tunnelApplicationName | `makerrr-tunnel` |
| quality | `stable` |
| licenseName | MIT (for the Code-OSS portion; product notices also carry Apache-2.0 for Cline) |
| reportIssueUrl | `https://github.com/G-keyeserstack/SmithAgent/issues/new` |
| update mode | `none` until Phase 7 |

Win32 AppUserModel IDs and Darwin profile UUIDs are new, so a Makerrr install does not collide with a Code-OSS install. The brace shape matches what the upstream installer scripts already expect (`{{GUID}`):

| Key | Value |
|---|---|
| win32x64AppId | `{{C4465B01-F5E0-412B-AC7E-BC11DE2EE37B}` |
| win32arm64AppId | `{{94A3DC52-679F-4295-856B-302ACA70FCC8}` |
| win32x64UserAppId | `{{1130FB14-AC44-4A89-B0AF-EB946A3E5B2B}` |
| win32arm64UserAppId | `{{4C3B2084-F49B-40BD-ABDF-509A10A93DDB}` |
| darwinProfileUUID | `2E849BFD-5F3C-4D9F-822A-51581238A558` |
| darwinProfilePayloadUUID | `DBD64D35-4316-4656-9E65-3DC3BA28049D` |

Gallery, and only this gallery:

```json
"extensionsGallery": {
  "serviceUrl": "https://open-vsx.org/vscode/gallery",
  "itemUrl": "https://open-vsx.org/vscode/item",
  "resourceUrlTemplate": "https://open-vsx.org/vscode/unpkg/{publisher}/{name}/{version}/{path}",
  "extensionUrlTemplate": "https://open-vsx.org/vscode/gallery/{publisher}/{name}/latest"
}
```

`open-vsx.org` is added to the trusted-domain list. `marketplace.visualstudio.com` is never written.

Removed from product config, not from the source tree: `defaultChatAgent`, `builtInExtensionsEnabledWithAutoUpdates` entry `GitHub.copilot-chat`, Copilot entries in `trustedExtensionAuthAccess`, and `voiceWsUrl`.

Telemetry defaults off: `telemetry.telemetryLevel` = `off`, `telemetry.enableTelemetry` = false, `telemetry.enableCrashReporter` = false, `workbench.enableExperiments` = false. Any remaining Application Insights or Vortex endpoint found outside `product.json` is removed in the same patch.

Icon and wordmark are the existing Makerrr mark (ink `#0c0d0b`, bone `#f3f0e7`). Not a recolored Visual Studio Code icon, and not the VSCodium mark.

### Patch series

Written by us against `2c33b50`. VSCodium's patch list is the map. Those files are not copied: they target other line numbers, and a copied series that does not apply is not progress.

| File | Change |
|---|---|
| `01-product-identity.patch` | Names, ids, protocol, data dirs, license URL, issue URL, the UUIDs above |
| `02-open-vsx-gallery.patch` | The gallery object and the trusted domain |
| `03-telemetry-off.patch` | Default telemetry, crash reporter, and experiments off. Microsoft ingestion hosts removed where hardcoded |
| `04-copilot-product-off.patch` | Remove the Copilot product pointers listed above. Leave the TypeScript compiling |
| `05-branding-strings.patch` | About dialog, window title, desktop file name, icon. No Microsoft or VS Code mark |
| `06-updates-disabled.patch` | Update mode `none`. Update cache under `.makerrr` |
| `07-cli-and-server-name.patch` | Binary `makerrr`. Server and tunnel names stop saying `code-oss` |
| `08-linux-desktop.patch` | `.desktop`, icon name, startup WM class |
| `09-darwin-bundle.patch` | `CFBundleIdentifier` `app.makerrr.editor`. No signing identity |
| `10-windows-resources.patch` | Mutex, AppUserModelID, shell name |
| `11-voice-and-cdn.patch` | Remove the Falcon voice socket. Do not hand-edit the webview CDN hash; assert the build rewrites it |

### CI

On pull request:

- Existing SmithAgent checks stay as they are (`bun` install, lint, test).
- New job `editor-patches`: fetch the pin, `git apply --check` the series, fail on reject. No compile.

Manual dispatch only:

- `editor-build-linux`: full Linux x64 package. A Code-OSS compile is too heavy for every push.

macOS compile is a separate manual dispatch, and only if a macOS runner is available. It is not part of the required check.

### Gate, restated honestly

The prompt's gate is "signed-off launch on macOS and Linux." Phase 0 signs off the checklist below. It does not produce a notarized macOS app or a signed Windows installer. Those need certificates and are Phase 7 unless a Developer ID is provided during this phase.

Remote-SSH is recorded in `docs/PARITY.md` as **none**.

### First execution commits, after approval, in this order

1. `docs: add ADR 0001 and parity matrix` — `docs/adr/0001-editor-pin-and-package-manager.md`, `docs/adr/0000-template.md`, `docs/PARITY.md`, `THIRD_PARTY_LICENSES.md` (MIT Code-OSS, Apache-2.0 Cline). Root `AGENTS.md` is not replaced. A short pointer is added at the bottom only if review wants it.
2. `build: add vscode fetch and patch scripts` — scripts plus `.gitignore` for `apps/editor/src`.
3. `build: add makerrr editor patch series` — one commit per patch, or one commit for the series if splitting them hides a dependency. Conventional Commits. No force-push.
4. `ci: check that editor patches apply`.
5. Linux build, only after 1–4 are green. Evidence pasted back into this file.

`.clinerules/00-master.md` is not added in the plan commit. Existing rules under `.clinerules/` stay. On approval, the master prompt can be added as `00-master.md` with one line at the top: where it conflicts with root `AGENTS.md` on the package manager, `AGENTS.md` wins until ADR 0001 is superseded.

## Risks

1. **Copilot is product config.** Removing `defaultChatAgent` may throw if the 1.144 workbench assumes the object. First experiment is delete versus empty stub. If the object is required, the stub names no extension and contains no GitHub URL. Three failed attempts, then stop and ask. Do not delete the agent harness to make the typechecker quiet.
2. **Weekly upstream.** A two-week rebase will reject at least one patch most cycles. The PR job exists so that failure is a red check, not a broken release.
3. **Build weight.** Expect tens of minutes and several GB of electron and node modules. This is a CI job. It is not a laptop-only experiment and it cannot be demonstrated inside a browser preview of this repository.
4. **Webview CDN.** If gulp leaves `vscode-cdn.net` pointed at `ef65ac1`, extension and notebook webviews come up blank. Stop-ship.
5. **Marketplace terms.** One accidental `marketplace.visualstudio.com` fails the phase even if the window opens.
6. **Trademarks.** Visual Studio Code, the VS Code icon, and Microsoft branding are not ours. The debugger extensions may still display the upstream publisher name "Microsoft". That is accurate and stays. The shell must not.
7. **builtInExtensions network.** The three debugger extensions download from `github.com/microsoft/*` at build time. That is allowed (MIT, public GitHub). A URL that points at the Visual Studio Marketplace is not.
8. **Signing.** An unsigned macOS build is blocked by Gatekeeper. Do not describe it as a launch.
9. **Identity migration.** `@cline/*`, the `cline` CLI alias, and the `claude-dev` extension package name are still upstream. Phase 0 does not rename them. Doing so is a multi-thousand-file change with no user-facing shell to show for it.
10. **Root `patches/` collision.** Putting editor diffs in root `patches/` would mix them with Bun dependency patches. Do not.

## Acceptance checklist

Each box stays open until the Evidence section quotes the command and the result.

- [ ] `scripts/fetch-vscode.sh` checks out `2c33b50b16c472efe58357d1d2a8a5414bc23fbf` and the electron version in that tree is recorded here.
- [ ] `scripts/apply-patches.sh` applies all 11 patches with no `.rej` files.
- [ ] Linux x64 package builds.
- [ ] The process starts. Window title is Makerrr.
- [ ] User data is created under `~/.makerrr`, not `~/.vscode-oss`.
- [ ] A folder opens.
- [ ] One extension installs from Open VSX. Candidate: Prettier, only after confirming it is actually published there.
- [ ] Cold-start capture shows no requests to `dc.services.visualstudio.com`, `vortex.data.microsoft.com`, `mobile.events.data.microsoft.com`, `marketplace.visualstudio.com`, or `falcon-caas.mai.microsoft.com`.
- [ ] Root `bun run test` is still green, or any failure is shown to be pre-existing on `main` at `8d09492`.
- [ ] `THIRD_PARTY_LICENSES.md` names MIT for Code-OSS and Apache-2.0 for Cline, with copyright notices preserved.
- [ ] macOS: either a runner log of a successful compile, or the explicit sentence "not built, no macOS runner." Notarization is not claimable in this phase.

## Evidence

None. No fetch, patch, build, or launch command has been run for this phase.

Commands that were run while writing this plan, and only these:

- Git refs API for `refs/tags/1.144.0` returned commit `2c33b50b16c472efe58357d1d2a8a5414bc23fbf`.
- Raw `product.json` at tag `1.144.0` was read. Findings are in the design section. That read is not a build.
- This document was committed to `phase-0/editor-shell`. That commit does not touch the editor.

## Open questions (block execution)

1. Confirm the pin: `1.144.0` at `2c33b50b16c472efe58357d1d2a8a5414bc23fbf`.
2. Confirm the work stays in this repository on `phase-0/editor-shell`, and Bun is not replaced.
3. Confirm the gate is the checklist above: a Linux launch plus an honest macOS line. Notarization waits.
4. Confirm Copilot source stays in the tree and is default-off, rather than being deleted.

A "go" with no edits to those four is approval. Any other answer changes the plan before scripts are written.
