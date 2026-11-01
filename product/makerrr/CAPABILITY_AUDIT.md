# Makerrr Repository Capability Audit

**Audit date:** 1 November 2026  
**Repository:** `G-keyeserstack/SmithAgent`  
**Audited branch:** `makerrr/product-foundation`  
**Audited commit:** `20d2ff0ee06d23f20bf69c67fe779f9bf22db5c6`  
**Purpose:** Establish what the Cline-derived foundation already contains before Makerrr implementation begins.

## 1. Executive conclusion

The repository is a substantial, multi-application developer-agent platform. It is not a starter template and should not be rewritten. It already provides a layered TypeScript/Bun runtime, multiple clients, provider adapters, tool execution, context management, local search, edit previews, checkpoints, agent teams, a Hub, cloud-session client functionality and an example GitHub PR-review application.

However, the current branch remains Cline-branded and Cline-integrated. The existence of SDK interfaces, sample applications, feature flags or cloud clients is not proof of a production Makerrr service. In particular, the current code does not establish Makerrr-owned identity, billing, model gateway, cloud orchestration or a Tab-style inline completion experience.

**Recommendation:** retain the runtime and client architecture. Begin with a measured, compatibility-preserving Makerrr core layer. Do not start a monorepo rewrite.

## 2. Evidence and status definitions

This is a static source-tree and source-file audit of the audited branch. It is not a clean checkout, build, test run, security review or production deployment.

| Status | Meaning |
|---|---|
| **Present — source evidence** | Relevant implementation and/or tests are present in the repository. Runtime behaviour has not necessarily been executed in this audit. |
| **Partial / example** | Some supporting code exists, but the complete product capability or production service is not established. |
| **External dependency** | The client or SDK integrates with a Cline-owned or third-party service; Makerrr does not own that service. |
| **Not found in inspected source** | No implementation was identified in the inspected tree and targeted source review. Confirm with a local full-text scan before treating as definitively absent. |
| **Not verified** | Requires execution, CI evidence, deployment inspection, or commercial/security validation. |

## 3. Repository structure and reusable foundation

The branch tree contains 5,164 entries and is organised as a Bun workspace. The root `package.json` declares workspaces for `sdk/packages/*`, `apps/*`, the VS Code webview/testing platform, Hub webview, desktop/examples and SDK examples. It pins Bun 1.4.2 and Node >=22.

The SDK architecture document defines four principal layers:

- `@cline/shared`: shared types, schemas, paths, hooks, extension contracts, prompt/parsing helpers, storage paths and remote-config primitives.
- `@cline/llms`: provider configuration, model catalogues, gateway contracts, handler registry and provider execution.
- `@cline/agents`: stateless agent loop, tool orchestration, runtime events, hooks/extensions and in-memory team/runtime primitives.
- `@cline/core`: runtime composition, session lifecycle, persistence, config watching, tools, plugins, compaction, telemetry, Hub services and experimental cloud-session client.

The documented dependency direction is shared → llms/agents → core → host applications. Preserve this separation when introducing Makerrr-owned services.

**Primary evidence:** `sdk/ARCHITECTURE.md`; `package.json`; `sdk/packages/{core,agents,llms}/package.json`.

## 4. Capability inventory

| Capability | Status | Source evidence and assessment |
|---|---|---|
| VS Code extension | **Present — source evidence** | `apps/vscode/package.json`, `apps/vscode/src/`, `apps/vscode/webview-ui/`. Existing extension contribution points, commands, views, settings, controller and host abstractions are extensive. Still branded Cline; package name is `claude-dev`, display name Cline, publisher `saoudrizwan`, and command/config namespaces include `cline.*`. |
| CLI | **Present — source evidence** | `apps/cli/package.json`, `apps/cli/src/`. Interactive TUI, one-shot/headless modes, NDJSON, approval controls, auth commands, connectors, schedules, MCP, plugins, ACP and Hub commands are present in source. Package is `@cline/cli`, binary is `cline`, and environment/config naming is Cline-specific. |
| Desktop application | **Present — source evidence** | `apps/examples/desktop-app/`; Tauri v2, Next.js webview and Bun sidecar. Sidecar architecture reuses the shared Core Hub rather than owning a separate private agent runtime. Desktop package remains `@cline/code`. |
| Hub / local orchestration | **Present — source evidence** | `apps/cline-hub/src/`, `sdk/packages/core/src/hub/`, CLI Hub commands. The Hub handles sessions, client connections, approvals and session state. It is a local/shared runtime service, not proof of a Makerrr-hosted multi-tenant control plane. |
| Agent runtime and tool orchestration | **Present — source evidence** | `sdk/packages/agents/src/agent-runtime.ts`, `sdk/packages/core/src/ClineCore.ts`, `sdk/packages/core/src/extensions/tools/`. Agent loop and stateful runtime are deliberately separated. |
| Model/provider abstraction | **Present — source evidence** | `sdk/packages/llms/src/`, provider manifests/registry and dependencies for Anthropic, Google, OpenAI, OpenAI-compatible, Bedrock, Vertex, OpenRouter, Ollama and other adapters. The exact supported model/tool/streaming matrix must be tested per adapter; dependency presence is not a support guarantee. |
| Local workspace file discovery | **Present — source evidence** | `apps/vscode/src/services/search/file-search.ts` and `apps/vscode/src/core/controller/file/searchFiles.ts`. Uses ripgrep and host-native file index where available, with fuzzy file/folder selection. |
| Local code/text search | **Present — source evidence** | `sdk/packages/core/src/extensions/tools/executors/search.ts`. Built-in codebase search uses ripgrep where available or regex fallback, with include/exclude controls, result limits and context lines. This is useful lexical search, not a semantic embedding/index service. |
| Semantic codebase index | **Not found in inspected source** | The inspected search implementation is ripgrep/regex and workspace file indexing. No dedicated semantic embedding/index subsystem was identified in the targeted tree review. Validate with a full local scan before closing this gap. |
| Context tracking | **Present — source evidence** | `apps/vscode/src/core/context/context-tracking/FileContextTracker.ts` tracks files read, mentioned and edited, watches external modifications and helps avoid stale context. |
| Rules, skills and workflows | **Present — source evidence** | `apps/vscode/src/core/context/instructions/user-instructions/`; SDK rule/config and plugin infrastructure; `sdk/examples/hooks/`, `sdk/examples/plugins/`. Existing rules are Cline-compatible and use Cline-specific paths. |
| Context compaction | **Present — source evidence** | `sdk/packages/core/src/extensions/context/agentic-compaction.ts` and related context modules implement budget projection and agentic summarisation. |
| Context prioritisation / prompt compiler | **Partial / needs design review** | Prompt helpers, compaction, instruction loading and context construction exist. A Makerrr-owned, priority-ranked prompt compiler with inspectable inclusion/exclusion explanations has not been established by this audit. |
| Edit preview and review | **Present — source evidence** | `apps/vscode/src/integrations/editor/EditPreview.ts`, `apps/vscode/src/hosts/vscode/VscodeEditPreview.ts`, external host edit preview/comment review controllers. Preview surfaces exist; verify all edit application paths and race/stale-file handling with tests. |
| Checkpoints / restore | **Present — source evidence** | Checkpoint controller paths in `apps/vscode/src/core/controller/checkpoints/`; SDK/Core exposes session/checkpoint facilities. Audit exact git/non-git restore semantics before changing storage or identifiers. |
| Tab-style inline completion / next-edit prediction | **Not found in inspected source** | Targeted tree review did not identify a VS Code inline-completion provider or next-edit prediction subsystem. The extension has editor integrations, but this specific completion experience is a new product capability. Confirm with a local symbol scan for VS Code inline completion APIs before implementation. |
| GitHub PR review | **Partial / example** | `apps/examples/code-review-bot/src/index.ts` and README demonstrate fetching PR metadata/diffs, agent-driven structured findings, SSE streaming and optional posting. `sdk/examples/cron/events/pr-review.event.md` and review workflows provide related automation examples. This is not yet a first-party Makerrr Review product integrated into the main clients. |
| Cloud sessions | **Partial / external dependency** | `sdk/packages/core/src/cloud/`, `apps/vscode/src/sdk/cloud-session-host.ts`, `apps/examples/desktop-app/sidecar/cloud-sessions.ts` contain an experimental cloud-session client and host projection. The sidecar delegates to shared Hub/Core and Cline cloud services; this is not Makerrr-owned cloud orchestration. |
| Identity / organisations | **External dependency** | `sdk/packages/core/src/account/cline-account-service.ts` calls Cline account API endpoints for users, remote config, balances and usage/payment transactions. Cline auth flows also exist in client code. No Makerrr-owned identity service was identified. |
| Billing / metering | **External dependency / partial client plumbing** | Cline account balance and usage/payment transaction interfaces exist, along with provider usage/cost display. No Makerrr-owned billing ledger, entitlements, pricing catalogue, prepaid credits or payment orchestration was identified. |
| Model gateway | **Partial / upstream provider gateway** | `sdk/packages/llms/src/providers/gateway/` provides a provider-facing gateway abstraction. This is not the proposed Makerrr-owned hosted model gateway with tenant policy, routing, metering and provider portability. |
| Cloud agent isolation | **Not verified** | Cloud handoff/session code exists, but this audit does not establish the deployed sandbox boundary, per-task isolation, egress controls, credential scoping, quotas or isolation assurance. Must be threat-modelled and validated before production. |
| Makerrr website / account portal / admin console | **Not found in inspected app structure** | No dedicated Makerrr marketing/account/admin application was identified in the inspected workspace layout. The Hub dashboard is not a substitute for these services. |
| Makerrr configuration migration | **Not implemented on audited branch** | Existing source still uses Cline config/rules paths and identifiers, including `.clinerules` and Cline storage helpers. No complete migration to `~/.makerrr/`, `.makerrr/`, `MAKERRR_*` and compatibility flow has been implemented. |
| Makerrr product rebrand | **Not implemented on audited branch** | Product packages, UI metadata, commands, environment variables, app names, docs and service endpoints remain Cline-branded. Product documentation has been added, but runtime rebrand has not. |

## 5. What should be retained

The following are high-value foundation assets and should be retained unless a later code-level review identifies a concrete defect:

1. The layered SDK architecture and package boundaries.
2. Provider registry/adapters and model metadata pipeline.
3. Agent runtime, tool executor and event/hook architecture.
4. Core session lifecycle, persistence, compaction and Hub abstractions.
5. Existing CLI, VS Code and Tauri/desktop clients.
6. Ripgrep/regex search, file discovery and context tracking.
7. Approval gates, edit previews, checkpoints and restore primitives.
8. MCP, plugin, rules, skills, schedules, connectors and agent-team primitives.
9. Existing tests, fixtures, evals and CI scripts as the compatibility baseline.

Makerrr should own its product identity, configuration, account/control plane, policies, billing, model routing and developer experience without unnecessarily forking the underlying runtime architecture.

## 6. Makerrr core implementation implications

### 6.1 Rebrand and configuration migration

Do not globally replace `cline` strings. First classify each occurrence as:
- user-visible brand/copy;
- package name/import;
- CLI executable or environment variable;
- persistent data/config path;
- protocol, RPC or storage key;
- cloud endpoint/auth contract;
- legal notice/attribution;
- tests, fixtures, historical docs or upstream compatibility.

Implement dual-read migration with safe writes:
1. Detect existing Cline global/project configuration and data.
2. Offer/perform an explicit, backed-up migration into Makerrr paths.
3. Preserve identifiers required for old sessions and protocol compatibility.
4. Write new Makerrr settings to Makerrr paths.
5. Retain a documented compatibility window and migration tests.
6. Never delete the original data until the migration has been verified and the user has a recovery path.

### 6.2 Local search and context management

Extend existing lexical search rather than replace it. Priorities:
- unify search behaviour between CLI, VS Code and desktop where feasible;
- ensure ignore rules, symlinks, multi-root, large files and result limits are consistent;
- expose search/context provenance to the user;
- add context inclusion/exclusion explanations and token-budget visibility;
- later add an optional local semantic index behind a clear privacy boundary.

### 6.3 Edit reliability

Build on existing preview/checkpoint/context-tracking infrastructure. First map all write paths and their invariants. Add tests for stale reads, concurrent user edits, partial patch failure, rollback, binary/large files, multi-root workspaces and interrupted sessions before changing patch semantics.

## 7. Ordered delivery plan

This follows the approved Makerrr action order.

### Phase 1 — Repository capability audit (this document)

- [x] Inspect audited branch and commit.
- [x] Map workspace/apps and SDK layers.
- [x] Identify key evidence for search, context, edit, review, cloud and account capabilities.
- [ ] Run clean install, build, typecheck and test baseline from a full checkout.
- [ ] Capture existing CI/workflow results and test failures.
- [ ] Run full local Cline identifier and inline-completion symbol scans.
- [ ] Complete dependency/licence and release-workflow inventory.

**Exit gate:** reproducible baseline and source-level capability map accepted; no speculative rewrites.

### Phase 2 — Makerrr core

- [ ] Create a Cline-to-Makerrr identifier and data migration inventory.
- [ ] Implement config path resolver and tested migration/rollback.
- [ ] Rebrand a thin vertical slice (CLI identity + VS Code extension metadata) before broad UI changes.
- [ ] Consolidate local search and context inspection.
- [ ] Harden edit application and restore paths with targeted tests.
- [ ] Keep legacy Cline identifiers readable where required for compatibility.

**Exit gate:** Makerrr-branded local workflow works without cloud dependency; migration and existing workflows pass tests.

### Phase 3 — Inline intelligence

- [ ] Add a VS Code inline-completion provider behind a feature flag.
- [ ] Start with low-latency, cancellable, single-line completion; expand to multi-line/next-edit only after evaluation.
- [ ] Support BYOK/local inference where latency and model capability are acceptable.
- [ ] Measure p50/p95 latency, acceptance rate, partial acceptance, undo rate, cost per accepted completion and failure rate.
- [ ] Do not block typing or degrade editor responsiveness.

**Exit gate:** measurable user value and acceptable latency/cost across representative hardware and network conditions.

### Phase 4 — Makerrr Review

- [ ] Extract the code-review-bot example into a reusable review service/module.
- [ ] Integrate GitHub App/OAuth permissions with least privilege.
- [ ] Review changed files and relevant surrounding context with bounded input/output.
- [ ] Produce evidence-linked findings with file/line, severity and category.
- [ ] Keep posting and patch application opt-in and user-approved.
- [ ] Add prompt-injection, secret leakage, false-positive, rate-limit and large-diff tests.

**Exit gate:** repeatable review quality, secure GitHub permissions and auditable user-controlled external writes.

### Phase 5 — Makerrr cloud platform

- [ ] Implement Makerrr-owned identity, organisations, device auth and RBAC.
- [ ] Implement tenant-scoped billing ledger, metering, entitlements and prepaid credits.
- [ ] Implement Makerrr model gateway with policy, routing, budgets and provider adapters.
- [ ] Implement orchestration, durable session metadata and isolated ephemeral agent execution.
- [ ] Add audit, observability, retention, export/deletion and recovery controls.
- [ ] Evaluate Stratos Lab and YSBERG through comparative POCs; keep both behind portable infrastructure adapters.
- [ ] Separate trusted model-serving plane from untrusted agent-execution plane.

**Exit gate:** security review, provider due diligence, load/recovery tests and operational readiness. Infrastructure partner integration follows Makerrr-owned control-plane design; partners do not own Makerrr identity, billing or orchestration.

## 8. Baseline validation record

| Check | Result |
|---|---|
| Branch and commit inspected | `makerrr/product-foundation` at `20d2ff0ee06d23f20bf69c67fe779f9bf22db5c6` |
| Recursive repository tree | Retrieved; 5,164 entries; GitHub response reports not truncated |
| Key package manifests | Inspected |
| SDK architecture document | Inspected |
| Search/context/edit/review/cloud/account source samples | Inspected |
| Clean dependency install | **Not run** |
| Build | **Not run** |
| Typecheck | **Not run** |
| Unit/integration/e2e tests | **Not run** |
| Live provider tests | **Not run** |
| Security review / sandbox verification | **Not run** |
| Production deployment / partner integration | **Not verified** |

The repository connector provides source inspection and GitHub operations, not a local Bun runtime. Therefore no successful build or test result is claimed in this document. These checks must be run from a clean checkout with Bun 1.4.2 and Node >=22 before implementation changes are treated as safe.

## 9. Immediate engineering decision

**Do not rewrite Cline Core, the agent runtime, provider adapters or clients.** The next implementation unit should be a narrow Makerrr Core foundation: config-path abstraction, migration planner, compatibility tests and a small CLI identity slice. Before that code change, obtain a reproducible clean-checkout baseline so that regressions can be attributed correctly.

Makerrr's differentiation should come from product ownership, context quality, inline intelligence, review quality, privacy, portability and emerging-market economics—not from replacing proven infrastructure merely to make it look new.
