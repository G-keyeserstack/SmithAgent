# Makerrr — Cursor Competitive Roadmap

**Prepared:** 1 November 2026  
**Purpose:** Product strategy and sequenced engineering programme  
**Positioning:** A powerful, open, local-first AI development platform priced for developers and teams in emerging markets.

## 1. Strategic ambition

Makerrr should become a credible Cursor alternative, not a superficial rebrand of an existing coding agent. The goal is to match or exceed the day-to-day developer experience across agentic coding, inline assistance, codebase understanding, review, automation and cloud workflows—while preserving the advantages of the Cline-derived foundation:

- Open and inspectable foundations under the applicable open-source licences.
- Direct provider choice and bring-your-own-key (BYOK) paths.
- Local model support and local execution.
- Optional cloud services rather than mandatory server-side prompt processing.
- User control over source-code transfer, tools, permissions and consequential actions.
- Pricing and infrastructure choices designed for emerging-market purchasing power and variable connectivity.

Cursor is a product-quality benchmark, not an architectural template. Makerrr should not copy closed-source implementation details or assume Cursor's reported internal architecture is independently verified.

## 2. What Makerrr should own

Makerrr owns the product and control plane. Infrastructure vendors supply replaceable capacity and services.

| Makerrr-owned capability | Responsibility |
|---|---|
| Developer experience | Editor, CLI, desktop, SDK, onboarding, docs |
| Identity and access | Accounts, organisations, roles, devices, sessions, SSO |
| Agent orchestration | Task lifecycle, tool policy, planning, approvals, checkpoints, subagents |
| Context engine | Local indexing, retrieval, prompt compilation, context budgets |
| Model gateway | Provider adapters, routing, BYOK, local endpoints, quotas, cost visibility |
| Cloud control plane | Scheduling, task dispatch, environment lifecycle, session state |
| Billing and entitlements | Plans, usage ledger, subscriptions, local currency, credits |
| Trust and governance | Privacy settings, retention, audit, sandbox policy, admin controls |
| Marketplace and integrations | MCP, plugins, skills, templates, team catalogues |
| Evaluation and quality | Benchmarks, regression tests, task success and safety evaluations |

**Infrastructure partners**
- **Stratos Lab:** evaluate for GPUaaS, managed PaaS, bare-metal orchestration and hosted model-serving capacity.
- **YSBERG:** evaluate for dedicated GPU capacity and private/local inference.
- Neither provider owns Makerrr identity, billing, policy, orchestration APIs, developer accounts or the product roadmap.
- Keep adapters and deployment automation portable. Provider selection, commercial terms and production readiness require due diligence and proof-of-concept testing.

## 3. Product architecture

~~~text
VS Code / Desktop / CLI / SDK / Web
                  |
                  v
       MAKERRR CONTROL PLANE
 identity | orgs | entitlements | billing
 sessions | policy | audit | scheduler
                  |
        +---------+----------+
        |                    |
        v                    v
 LOCAL-FIRST RUNTIME    OPTIONAL CLOUD RUNTIME
 local files/tools      task scheduler + API
 local index            ephemeral isolated workers
 local model            encrypted artifacts
 BYOK provider          Git integrations
        |                    |
        +---------+----------+
                  |
                  v
        MAKERRR MODEL GATEWAY
 BYOK | direct provider | local inference
 routing | quotas | metering | policy
                  |
          +-------+-------+
          |               |
          v               v
      Stratos Lab       YSBERG
      GPU / PaaS        dedicated GPU
~~~

### Non-negotiable architecture rules

1. Local-only workflows must remain usable without a Makerrr account or Makerrr cloud dependency, subject to the relevant provider's own requirements.
2. Source code and prompts do not leave the device by default. Every cloud/indexing feature must clearly describe what data is transferred and why.
3. The Makerrr model gateway is optional for BYOK/direct-provider and local-model workflows.
4. Keep model inference separate from untrusted code execution. GPU nodes are not agent sandboxes.
5. Cloud tasks run in disposable, strongly isolated environments with short-lived credentials, restricted egress and explicit resource limits.
6. Provider-specific infrastructure code sits behind adapters. Keep the control plane deployable on alternative infrastructure.
7. Meter usage in a Makerrr-owned ledger, even when a third-party provider supplies the underlying model or compute.
8. Never describe a feature as available, secure, private, compliant or production-ready until implemented and validated.

## 4. Competitive capability programme

The source comparison is a useful hypothesis set, not a verified feature-by-feature audit of the current repository or Cursor's closed internals. Every feature below must receive a code-level inventory, implementation status, test evidence and product acceptance criteria before being represented as parity.

### A. Inline intelligence — highest user-visible priority

**Tab-style next-edit prediction**
- Inline completions while typing, including multi-line edits where the editor API and model support it.
- Accept, partial accept, reject, dismiss and suppress controls.
- Context from current file, recent edits, diagnostics and nearby symbols.
- Debounce, cancellation, streaming and latency budgets.
- Privacy-conscious telemetry: acceptance and latency metrics without silently collecting source code.
- Start with a capable hosted completion model and local-compatible path; do not train a proprietary foundation model as the first milestone.

**Acceptance measures**
- P50/P95 time to first suggestion.
- Suggestion acceptance and partial-accept rates.
- False-positive and interruption rates.
- Suggestions per accepted edit.
- CPU, memory and network impact.
- Quality across TypeScript, JavaScript, Python, Go, Java, PHP, Rust and other priority languages.

**Apply and edit reliability**
- Retain deterministic patch/editor application as the safe default.
- Add robust fuzzy matching, context anchors, syntax-aware edits and post-edit validation.
- Explore speculative or model-assisted apply only behind a feature flag and benchmark it against deterministic application.
- Never overwrite a file without a recoverable diff/checkpoint.
- Run formatter, typecheck or targeted tests where configured; report exactly what ran.

### B. Codebase intelligence — local-first advantage

Build a hybrid context engine in deliberate steps:

1. Fast local text/regex search with ignore rules, binary filtering and incremental file watching.
2. Language-aware symbol and syntax extraction using existing language servers and tree-sitter-compatible tooling where practical.
3. Local lexical and semantic retrieval, with embeddings cached on device.
4. Optional team/shared index for users who explicitly opt in.
5. Context ranking and reranking based on task relevance, recency, symbol references, diagnostics and user-selected files.

**Privacy model**
- Local indexing is the default.
- A remote index is opt-in and must specify whether raw chunks, embeddings, paths, hashes and metadata leave the device.
- Do not assume embeddings are anonymous or non-sensitive.
- Use tenant-scoped access, deletion propagation and explicit retention for any hosted index.
- Do not reproduce Cursor's inferred Merkle proof scheme without an independent threat model and demonstrated need.

**Acceptance measures**
- Indexing time and incremental update time.
- Retrieval precision/recall on curated coding tasks.
- Search latency on small, medium and large repositories.
- Memory and disk footprint.
- Offline functionality and recovery after interrupted indexing.

### C. Prompt compiler and context management

Create a structured, priority-based prompt assembly system:
- System and safety instructions.
- User request and explicit constraints.
- Relevant repository rules and skills.
- Current task state and recent conversation.
- Retrieved files, symbols, diagnostics and tool results.
- Provider/model-specific token budgets.

Every context component should carry provenance, priority, token estimate and truncation policy. Lower-priority content is removed or summarised first. Expose a context inspector showing what was included, omitted and why. Preserve security instructions and user constraints during compaction.

### D. Agent harness and multi-agent workflows

- Keep the Cline-derived agent loop and tool contracts as the initial foundation.
- Improve task planning, tool reliability, cancellation, retries and recovery.
- Add specialist subagents with explicit task scopes and workspace boundaries.
- Support parallel agents through isolated Git worktrees or stronger isolated workspaces.
- Add a multi-agent manager showing status, ownership, changed files, costs and approvals.
- Consider best-of-N model evaluation only for bounded tasks where the expected quality gain justifies extra cost.
- Never let parallel agents silently overwrite each other's changes.

### E. Review, testing and debugging

**Makerrr Review**
- Local diff review before commit.
- PR review in GitHub Actions/CI and optional hosted review.
- Findings grouped by severity, confidence, file and line.
- Explainable evidence and reproduction steps.
- Suggested patches require human review.
- Custom repository rules, security checks and regression-aware review.
- Pre-push review must be opt-in and must not block unrelated Git workflows unexpectedly.

**Debug and quality mode**
- Collect selected runtime logs, tool traces and relevant diagnostics with user consent.
- Redact secrets and credentials.
- Distinguish observed facts from model hypotheses.
- Generate test plans and run only approved commands.
- Provide an exportable diagnostic bundle with a preview of included data.

### F. Memory and automation

- Project memory stored in reviewable files inside the repository or user-selected local storage.
- User can inspect, edit, disable and delete memory.
- Separate durable project facts from transient task history.
- Scheduled and event-triggered agents for GitHub, GitLab, Linear, Slack and webhooks, subject to implemented connectors.
- Every automation has an owner, trigger, scope, credential set, budget, retention policy and approval policy.
- Default to draft/notify rather than publish/deploy.
- Include replay protection, idempotency, audit history and a kill switch.

### G. Browser, visual and creative tools

- Embedded browser with clear separation between read-only browsing and authenticated actions.
- Browser-agent permission prompts and domain allowlists.
- Visual inspection and browser-driven UI testing.
- Image generation through supported model providers, with user-selected destination and clear cost indication.
- Canvas/visual editor as a distinct product capability only after the core editor and agent workflows are stable.
- MCP Apps and interactive tool UIs through a sandboxed, permissioned extension model.

### H. Cloud agents and remote development

- Remote environments that can be named, reused or disposed of, with explicit lifecycle and cost controls.
- Multi-repository workspaces and scoped Git credentials.
- Cloud subagents and parallel task execution.
- Mobile-friendly task monitoring and approval experience before committing to a native mobile app.
- Resume, pause, cancel, inspect and hand off tasks to local editor.
- Strong isolation, resource quotas, egress controls, encrypted storage and auditable access.
- Separate GPU inference fleet from untrusted task-execution fleet.

### I. Enterprise and ecosystem

- Organisation policy and role-based access.
- SSO and SCIM only after identity lifecycle and tenant isolation are implemented.
- Admin-enforced privacy, provider allowlists, retention and cloud-agent policies.
- Audit export, deployment controls and usage reporting.
- Curated extension/skill/MCP marketplace with publisher verification, permissions disclosure and vulnerability response.
- Imports from GitHub, GitLab, Bitbucket and Azure DevOps based on demand and connector maturity.
- Team templates and centrally managed rules.

## 5. Emerging-market pricing strategy

Affordability must be structural. Makerrr should avoid subsidising unlimited expensive model calls with a flat fee.

### Product principles

1. **Free local-first entry:** local models and BYOK should make the core agent useful without requiring a paid Makerrr inference subscription.
2. **Low-cost paid tiers:** subscriptions buy product features, collaboration and a predictable included usage allowance.
3. **Transparent usage:** show model, input/output usage where available, estimated cost, remaining allowance and cloud-compute charges before expensive work.
4. **Regional purchasing power:** localise price points by market and payment method, not simply convert a US price at spot FX.
5. **BYOK fairness:** users supplying their own provider key should not pay Makerrr again for the same model inference; charge only for clearly identified Makerrr-hosted services.
6. **No fake unlimited:** apply fair-use and concurrency policies transparently. Never advertise unlimited usage when model or GPU costs are capped.
7. **Low-bandwidth design:** compact downloads, resumable transfers, offline docs, efficient sync and optional local inference.

### Proposed packaging (commercial hypotheses, not final prices)

| Tier | Target user | Product entitlement | Cost model |
|---|---|---|---|
| Free | Students, learners, individual developers | Local agent, BYOK, local models, core editor/CLI features | No Makerrr inference included; user pays own provider if used |
| Starter | Emerging-market individual developers | Hosted inference starter allowance, basic cloud sync and limited cloud-agent minutes | Low monthly regional price; hard usage cap |
| Pro | Professional developers | Larger model allowance, advanced context, review and more cloud-agent capacity | Subscription plus transparent overage/top-up |
| Team | Startups and developer houses | Shared workspaces, team rules, usage controls, pooled credits, review and admin | Per-seat platform fee plus pooled usage |
| Enterprise / Self-hosted | Regulated and larger organisations | SSO, policy, audit, private deployment options, support and procurement | Annual contract; infrastructure and usage separately priced |

### Regional price design

- Set a globally understandable reference price, then establish country-specific local price bands based on purchasing power, payment acceptance, taxes, FX volatility and support costs.
- Prioritise ZAR, NGN, KES, EGP, GHS, UGX, TZS, INR, PKR, BRL, MXN and USD as market research warrants.
- Support card and locally relevant payment rails through a replaceable billing integration. SuppplePAY is a candidate integration, not an assumed completed payment capability.
- Offer student, education, startup and open-source maintainer programmes with clear eligibility and abuse controls.
- Offer prepaid credits and team-funded usage for customers who cannot or do not want recurring international-card subscriptions.
- Publish actual prices only after unit economics, taxes, payment fees and willingness-to-pay research are complete.

### Unit economics guardrails

Track contribution margin by plan, country, model, provider and workload. Include inference, GPU, storage, egress, payment processing, support, abuse and failed-task costs. Set model-specific budgets, per-user concurrency limits and spend alerts. The product must degrade gracefully when a user reaches a cap rather than silently incur unbounded costs.

## 6. Delivery sequence

The roadmap is intentionally sequenced to create a useful product early and avoid expensive infrastructure before product-market evidence.

### Phase 0 — baseline and evidence (first)
- Freeze a reproducible repository baseline and record the exact upstream commit.
- Inventory current code and tests for every capability in section 4.
- Label each capability: implemented and tested; implemented but unverified; partial; absent; or not applicable.
- Record architecture seams and upstream dependencies.
- Run install, typecheck, unit tests and build; document failures without hiding them.
- Define product analytics that do not collect source code by default.
- Produce threat model and data-flow map for local, provider-direct and cloud modes.

**Exit:** evidence-backed feature matrix, baseline CI report, prioritised backlog and architecture decisions.

### Phase 1 — excellent core agent
- Safe Makerrr branding and configuration migration.
- Fast local search and context inspection.
- Priority-based prompt/context compiler.
- More reliable patch application and recovery.
- Better onboarding, model setup, permissions and usage visibility.
- First-party quality benchmark suite.

**Exit:** dependable daily-use coding agent with local/BYOK paths and clear privacy boundaries.

### Phase 2 — inline intelligence and review
- Tab-style inline completion MVP.
- Multi-line next-edit prediction behind feature flag.
- Makerrr Review for local diffs and GitHub PRs.
- Debug mode and project memory.
- Acceptance, latency and quality evaluation.

**Exit:** compelling editor experience and useful review workflow.

### Phase 3 — cloud control plane
- Makerrr-owned identity, organisations, entitlements and billing ledger.
- Provider-neutral model gateway and metering.
- Cloud task scheduler, durable session metadata and encrypted artifact store.
- Isolated execution workers with short-lived credentials and restricted egress.
- Stratos Lab and YSBERG adapters/proofs of concept.
- Usage budgets, user approvals, audit and account controls.

**Exit:** opt-in cloud agents with measured reliability, security and unit economics.

### Phase 4 — team intelligence and automation
- Shared optional codebase index.
- Parallel agents and multi-repository environments.
- Event-triggered automations and integrations.
- Enterprise policies, SSO/SCIM, audit export and marketplace controls.
- Mobile-responsive remote agent management.

**Exit:** differentiated team platform with operational controls.

### Phase 5 — advanced differentiation
- Visual/browser agent workflows.
- MCP Apps and interactive tools.
- Model judging and bounded best-of-N.
- Advanced speculative apply.
- Domain-specific models only if evaluation data and economics justify investment.

**Exit:** mature platform capabilities backed by measured customer value.

## 7. First 90-day execution focus

The first 90 days should not attempt all 25 comparison gaps. Concentrate on five workstreams:

1. **Baseline and rebrand:** repository audit, test baseline, product identity, configuration migration and release pipeline.
2. **Context and apply quality:** local search, context inspector, prompt compiler and reliable edits.
3. **Inline completion MVP:** latency-conscious completion provider abstraction, editor UX and evaluation harness.
4. **Makerrr Review MVP:** local review plus GitHub PR review workflow with safe suggested fixes.
5. **Cloud foundation design:** identity, usage ledger, model gateway, provider adapters and sandbox proof of concept—without launching paid cloud agents until security and economics pass.

Every workstream must have a named owner, engineering estimate, dependencies, acceptance tests and release flag before sprint commitment. Do not invent delivery dates or staffing capacity.

## 8. Measurement framework

### Developer value
- Weekly active developers and retained cohorts.
- Tasks completed successfully.
- Time from request to working change.
- User edit acceptance and revert rates.
- Review findings confirmed useful by developers.
- Repeat usage across editor, CLI and desktop.

### Product quality
- Agent task success on a maintained benchmark set.
- Tool-call success and recovery rate.
- Edit application failure and rollback rate.
- Context retrieval precision and latency.
- Inline completion acceptance and interruption rate.
- Crash-free sessions and support incidents.

### Affordability and economics
- Cost per successful task by model and plan.
- Median and P95 monthly spend by country and user cohort.
- Gross margin by plan and provider.
- Cloud-agent cost per completed task.
- Credit utilisation, failed-task waste and overage incidence.
- Conversion, churn and payment failure by region.

### Trust and safety
- Unapproved external actions (target zero).
- Cross-tenant access failures (target zero).
- Secrets exposed in logs (target zero).
- Data retention and deletion SLA.
- Sandbox escape and egress-policy test results.
- Privacy setting enforcement tests.

## 9. Claims and evidence discipline

- The supplied Cursor comparison is reverse-engineered and partly based on secondary reporting. Do not present inferred implementation details as confirmed facts.
- Cursor benchmark figures are vendor-reported unless independently reproduced.
- The current Cline-derived repository may contain capabilities newer than the docs snapshot used in the comparison. Verify against code before marking gaps.
- A capability in the upstream repository is not automatically a Makerrr capability; branding, configuration, security, tests and release packaging still matter.
- Do not claim Cursor parity, superior performance, 100,000-developer capacity, POPIA compliance, data sovereignty, zero retention or production readiness without relevant evidence.
- Retain all required Apache-2.0 notices, copyright statements and third-party attributions. Do not remove upstream notices as part of rebranding.

## 10. Immediate engineering tickets

1. Produce a capability inventory with source paths, tests, status and migration implications for all sections in the competitive comparison.
2. Record exact repository commit and clean baseline results.
3. Map existing shared, llms, agents, core, CLI, VS Code, desktop and hub boundaries to Makerrr ownership.
4. Specify the local index MVP and benchmark dataset.
5. Specify the prompt compiler API and context provenance model.
6. Prototype inline completion using a provider abstraction; compare hosted and local options.
7. Specify patch reliability and rollback acceptance tests.
8. Build the local/CI PR-review MVP design.
9. Define identity, entitlements, metering and billing-ledger data model.
10. Define cloud worker threat model and sandbox proof of concept.
11. Obtain Stratos Lab and YSBERG technical/commercial information and run comparable workload tests.
12. Establish regional pricing research and unit-economics model before publishing prices.

**North star:** Makerrr is the open, affordable development agent that developers can run locally, connect to the models they choose, and extend into secure cloud workflows when they need more power—without surrendering control of their code or their infrastructure.
