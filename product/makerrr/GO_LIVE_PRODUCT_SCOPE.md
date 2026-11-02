# Makerrr — Go-live product scope and acceptance contract

**Product:** Makerrr  
**Agent identity:** Makerrr Bot  
**Positioning:** An AI-native development environment for individual developers and engineering teams. Makerrr is intended to compete directly with Cursor as a daily-driver editor and agent platform; it is not a chat extension or a thin model wrapper.

This document is the go-live contract. A feature is not complete because a component, command, API, configuration flag or mock exists. It is complete only when the user can discover it, use it in the desktop product, understand its permissions and costs, recover from failure, and rely on it in a supported release.

## 1. Product surface

| Surface | Go-live requirement |
| --- | --- |
| Makerrr Desktop | First-party branded editor, workspace, terminal, source control, extensions, settings, keyboard shortcuts, update and recovery paths |
| Makerrr Composer | Multi-file agent workflow, Plan/Act, codebase context, streaming progress, steering, queued follow-ups, diffs, review and restore |
| Makerrr Tab | Low-latency inline completions, cancellation, acceptance/rejection, model selection and privacy controls |
| Makerrr Chat | Multi-model chat, codebase Q&A, file/image inputs, conversation history, voice input and shareable outputs |
| Makerrr Bot | Persistent agent identity across desktop, CLI and cloud; autonomous task execution, tool use, delegation, approvals and resumability |
| Makerrr Models | Model catalogue and router for Kimi, GLM, OpenAI, Anthropic, Google, xAI and compatible/local models, with capability and rate disclosure |
| Makerrr Cloud | Isolated remote workspaces, background agents, persistent sessions, artifacts, logs, cancellation and recovery |
| Makerrr Origin | Hosted Git repositories, import/export, branches, pull requests, protected branches, CI status, access controls and repository activity |
| Makerrr Automations | Scheduled and event-triggered repository tasks with explicit permissions, budgets, logs and failure notifications |
| Makerrr CLI | Interactive and headless coding, scripts, CI use, model selection, usage output, session resume and secure credential handling |
| Makerrr Review | Pull-request review, bug finding, suggested patches, inline findings, severity/confidence and human approval |
| Makerrr Marketplace | Discoverable extensions, MCP servers, skills, rules, workflows and team-curated private catalogues |
| Makerrr Studio | Voice dictation/response, image generation for UI mockups and assets, diagram creation, screenshot understanding and multimodal context for Composer |
| Makerrr Mobile | Secure companion experience for monitoring, steering, approving and resuming cloud agents; not a substitute for the desktop editor |
| Makerrr API | Public API, SDKs, webhooks and service-to-service access for tasks, models, repositories and automations |
| Teams and Enterprise | Shared workspaces, pooled or assigned usage, roles, SSO, policy, audit, procurement and administrative controls |

The desktop editor is the primary product. Chat, Bot, Composer, Models, Origin, CLI, Cloud, Automations, Review, Studio, Marketplace, Mobile and API must share the same identity, agent/task model, model catalogue, permissions and usage ledger rather than becoming disconnected products.

## 2. Composer: one end-to-end coding workflow

Composer is the primary interaction surface for Makerrr Bot. It must connect the existing SDK runtime, VS Code host, task queue, checkpoints and diff services.

### Required user experience

1. **Understand:** accept natural-language instructions, file/folder mentions, images and repository context; show the active workspace and selected model.
2. **Plan:** produce an editable implementation plan, identify affected files and tools, and request approval where policy requires it.
3. **Execute:** make coordinated multi-file changes through the agent runtime; stream progress, tool activity, agent hand-offs and changed-file state.
4. **Delegate:** split independent work into named sub-agents with bounded scopes, explicit tool permissions and visible status; support parallel execution without allowing conflicting writes to silently overwrite one another.
5. **Steer:** let the user send an instruction to the active turn. Show whether it was accepted, is pending, or was applied at a safe continuation point.
6. **Queue:** preserve ordered follow-up tasks and attachments; allow edit, reorder, promote-to-steer and cancel; continue automatically only when the active turn reaches a safe point.
7. **Review:** show a task-scoped changed-file list, additions/deletions, per-file and per-hunk diffs, test results and agent explanation. Review must work while the task is active and after it completes.
8. **Recover:** create checkpoints before agent writes; restore a selected run or file set; recover interrupted tasks and queued prompts without duplication or silent loss.
9. **Finish:** report what changed, what was tested, what remains unverified and the actual/estimated usage.

### Acceptance criteria

- A single Composer task can safely create, modify, rename and delete multiple files.
- Every write is attributable to a task, agent and checkpoint.
- The user can inspect diffs before accepting or retaining changes; reject/restore is a real filesystem operation, not a UI-only state.
- A failed tool, model timeout, app restart or network interruption cannot silently discard the draft or queued instructions.
- Queue ordering, steering priority, retry idempotency and cancellation have deterministic unit and integration tests.
- Parallel agents have conflict detection and cannot write outside their authorised workspace.
- The desktop experience exposes these capabilities without requiring users to open a developer console or edit JSON configuration.
- The same task lifecycle is available through CLI and cloud APIs, with surface-appropriate controls.

## 3. Agentic capability: Makerrr Bot

Makerrr Bot is the first-party agent identity. It is model-agnostic and uses the same governed runtime across products.

### Core capabilities

- **Chat:** answer engineering questions, explain repositories, research documentation and work with user-supplied files and images.
- **Voice:** accept speech-to-text instructions and support hands-free steering or spoken responses where the selected platform/provider supports it.
- **Imagine / Studio:** generate UI mockups, diagrams and design assets; let users attach those outputs to Composer as implementation context.
- **Build:** inspect, plan, edit, run tests, debug, iterate, produce previews and explain the result.
- **Autonomous coding:** inspect, plan, edit, run tests, debug, iterate and explain.
- **Multi-agent orchestration:** create specialist agents (for example, planner, implementer, reviewer, test engineer and researcher), delegate scoped tasks, run independent tasks concurrently and consolidate results.
- **Tool execution:** workspace filesystem, terminal, Git, browser, documentation/search, MCP tools and approved external integrations.
- **Repository intelligence:** repository maps, symbol and dependency relationships, semantic retrieval, lexical fallback, reranking and context selection.
- **Git-aware workflows:** branches/worktrees, commits, pull-request preparation, review and safe rollback.
- **Long-running work:** durable task state, pause/resume, cancellation, retry, queued steering and background execution.
- **Human controls:** approval gates for destructive commands, network access, secrets, publishing, deployments and spend thresholds.
- **Quality assurance:** run relevant tests, lint, typecheck and security checks; distinguish passed, failed, skipped and not-run checks.
- **Skills and policies:** reusable project/team instructions, skills, rules and MCP toolsets, with source and permission visibility.

### Agent reliability requirements

Each agent must have a stable task identity, scoped workspace, explicit model/tool permissions, bounded runtime and spend, structured event log, cancellation path and recoverable state. Sub-agents must not inherit credentials or permissions they do not need. A worker thread is not a security boundary: cloud execution requires OS/container/VM isolation and tenant-level enforcement.

## 4. Models and routing

Makerrr must not depend on a single model vendor. The model picker must distinguish generation, embedding and reranking models and disclose provider, context window, tool support, availability and billing type.

Initial model-provider acceptance targets:

- **Kimi K3.1 Pro / Highspeed:** first-class provider configuration where the user's API or coding-plan entitlement supports the model; stream text and tool calls; show context and provider usage accurately.
- **Z.ai GLM-5.x:** first-class provider configuration with tool calling, streaming, reasoning and model-specific context handling.
- **OpenAI, Anthropic, Google, xAI and other supported providers:** retain first-party provider integrations and compatible custom endpoints.
- **Local inference:** support compatible local runtimes where practical, with clear hardware/context limitations and no fabricated dollar cost.
- **Embeddings:** evaluate Qwen3-Embedding (0.6B as a practical local default; larger variants as opt-in) and BGE-M3 for multilingual/dense retrieval.
- **Reranking:** support a pluggable reranker, including Qwen3-Reranker where deployment and licensing permit.

Model availability must be driven by verified provider catalogues and account entitlements. Do not advertise a model as available merely because a model ID is hard-coded. Provider adapters must pass streaming, tool-call, cancellation, error, usage-normalization and fallback tests.

## 5. Live usage, cost and limits

Usage transparency is a core product feature, not an admin-only report.

### Individual task view

- Live input/output token counts and cache read/write counts.
- Current context-window consumption and remaining context.
- Active model/provider and billing type.
- Per-task cost where the provider supplies reliable pricing/usage.
- Clear distinction between **estimated API cost**, **provider-reported charge**, **subscription usage** and **unknown/unpriced usage**.
- No fabricated $0 cost for local, subscription or unpriced providers.
- Task history with model, token totals, duration, tool/agent activity and cost provenance.

### Account and team view

- Current billing period usage, included allowance, remaining allowance and overage.
- Breakdown by user, workspace, repository, model/provider, agent, task and cloud resource.
- Near-real-time usage events with reconciled provider invoices/usage where available.
- Configurable soft alerts and hard spend limits; policy enforcement must happen server-side for cloud/team usage.
- BYOK usage separated from Makerrr-billed usage.
- Exportable usage ledger and invoice reconciliation.
- Retention, privacy and data-export controls.

Every usage record must include a stable task/session identifier, timestamp, provider/model, input/output/cache metrics, currency, amount (if known), rate source/version and billing classification. Deduplicate retries and provider callbacks. Never add cached tokens twice when the provider's normalized input total already includes them.

## 6. Packaging and entitlements

The commercial structure should be competitive with the market benchmark supplied for Cursor, but Makerrr must set its own prices after model, cloud, support and payment costs have been measured. Do not copy competitor prices or promise unlimited use.

Indicative launch anchors below are a commercial hypothesis based on the supplied market benchmark, **not approved prices**. Final prices, included usage and overages must be set only after Gate 5 measures inference, cloud, support and payment costs.

| Makerrr plan | Indicative price | Usage-pool target | Intended customer and entitlement shape |
| --- | --- | --- | --- |
| Free | $0/month | Limited | Evaluation; desktop, Tab, Composer and Chat with a small allowance; BYOK/local models; limited cloud trial |
| Individual | $8/month | 1× base pool | Regular solo developer; larger included usage, full model choice, usage history and standard agent concurrency |
| Pro | $30/month | 4× Individual | Professional power user; cloud agents, automations, Origin hosting, advanced review and priority capacity |
| Max | $100/month | 15× Individual | Heavy individual; higher agent concurrency, priority model access and larger cloud allowance |
| Ultra | $200/month | 50× Individual | Highest individual tier; priority access at peak times, highest included allowance and early access to new capabilities |
| Teams | From $30/user/month | Pooled or assigned, configurable | Team marketplace, shared billing, usage analytics, mix-and-match seats, central privacy/policy controls and collaboration |
| Enterprise | Custom | Contracted pool | SSO, SCIM, audit logs, service accounts, invoice/PO, private networking options, custom retention, granular spend controls and support commitments |

Commercial rules:

- Show included usage and the current consumption multiplier before checkout.
- Provide Makerrr API access with separate rate limits, service-account entitlements and usage attribution; never let API keys bypass team policies.
- Offer voice and Studio capabilities as metered or included features according to the plan, with model/provider cost visibility.
- Separate subscription-included usage from third-party BYOK/API charges.
- Meter premium model and cloud usage transparently; allow admins to disable overages.
- Enforce concurrency, model access, cloud minutes/storage and team controls by entitlement on the server, not by hiding UI.
- Do not finalise price points or gross-margin claims until Gate 5 measurements are complete.

## 7. Go-live release acceptance

All supported release targets must be tested on the same commit. The minimum release matrix is macOS, Windows and Linux desktop; VS Code/VSCodium extension host; CLI on supported operating systems; and cloud service integration tests. Mobile is a separate release target and cannot be represented by a responsive web mock.

| Gate | Required evidence |
| --- | --- |
| 1 — Build and compatibility | Clean install, frozen-lockfile build, unit/integration/E2E, native desktop launch and all required platform jobs green on the same commit |
| 2 — Developer experience | Composer, Tab, multi-file edits, diff/review/restore, repository intelligence, queue/steer, agent delegation, CLI and onboarding tested by real workflows |
| 3 — Identity and commercial controls | First-party accounts, secure credential storage, session revocation, billing, entitlements, usage ledger, team roles and spend limits tested |
| 4 — Cloud and agent safety | Isolated tenant execution, resource quotas, network controls, secret boundaries, durable sessions, cancellation, audit and recovery tested |
| 5 — Scale and economics | Staging load tests, p50/p95/p99 latency, reliability, concurrency, provider failure recovery, per-task cost, gross margin and support capacity measured |

A green unit test does not substitute for a native application launch. A successful Linux build does not substitute for Windows/macOS validation. Queued, cancelled, skipped or partial jobs do not count as green.

## 8. Release-blocking anti-patterns

- No fake agent, cloud, review, marketplace, billing or usage screens backed only by fixtures.
- No “semantic search” label when the system is using lexical fallback.
- No model listed as available until its endpoint, entitlement and tool-calling behaviour are verified.
- No unbounded autonomous execution or hidden spend.
- No cloud multi-tenancy based only on worker threads or workspace path checks.
- No silently swallowed credential, persistence, restore or queue errors.
- No public launch based on partial CI, untested installers or unmeasured unit economics.

## 9. Immediate engineering sequence

1. Complete Composer integration across the existing runtime, task queue, checkpoint and diff services; expose task-scoped change review and restore.
2. Surface live task usage and make the same normalized usage ledger available to account/team reporting.
3. Complete agent delegation, conflict handling, tool permissions, durable continuation and recovery in the desktop UI.
4. Connect repository maps and semantic retrieval to Composer context selection; add persistent/incremental indexing and a tested embedding/reranker adapter.
5. Add first-class Kimi and GLM provider configuration, then validate the full model/tool/usage matrix.
6. Complete identity, credential security, billing, teams, cloud isolation, automations, review and marketplace integration.
7. Run the full release and unit-economics acceptance matrix before go-live.

**Go-live rule:** every surface and capability listed above is either available and tested at launch, or explicitly excluded from the launch announcement and entitlement catalogue. No placeholder counts as shipped functionality.
