# Makerrr production-readiness programme: 10 million users

**Status:** engineering programme and release-gate definition. This document is a target architecture and execution plan, not a claim that the capabilities below are already deployed.

## Objective

Build Makerrr into a dependable, secure and commercially competitive AI software-development platform for a broad global developer base, with a long-term capacity target of more than 10,000,000 registered users. The product benchmark is Cursor-class usability and coding effectiveness, while retaining Makerrr's differentiated local-first execution, multi-provider choice, agent extensibility and transparent user control.

Ten million registered users is not the same as ten million concurrent users. Capacity planning must separately model registered accounts, monthly active users, daily active users, concurrent sessions, active agent runs, tokens per task, storage growth and peak regional traffic. No capacity claim is valid until it is supported by repeatable load tests and operational evidence.

## Product principles

1. **Fast time to value:** a new developer can install, open a project, select a model and complete a useful coding task with minimal setup.
2. **Best-in-class coding loop:** understand a repository, plan, edit multiple files, run commands and tests, inspect diffs, recover from mistakes and explain the result.
3. **User control:** clear permissions, reviewable diffs, checkpoints, undo, command approval and explicit cloud execution.
4. **Provider freedom:** BYOK and supported model providers, with a clear distinction between Makerrr identity, provider credentials and integration credentials.
5. **Local-first by default:** code remains on the user's device unless a feature explicitly requires remote processing.
6. **Open ecosystem:** compatible MCP, plugins, skills, hooks, agents and SDK interfaces with supply-chain controls.
7. **Honest product status:** never advertise hosted identity, billing, encryption, availability or scale until deployed and verified.

## Workstreams and exit criteria

### 1. Product experience and differentiation

- Establish one coherent experience across VS Code, desktop, CLI and SDK.
- Make onboarding, model selection, context selection, agent mode, approvals, diffs, checkpoints and task history consistent.
- Improve repository indexing and context selection, large-repository handling, multi-file edits, terminal workflows and test-driven repair.
- Add clear task progress, token/cost visibility, latency feedback, cancellation and resumability.
- Build first-run tutorials, sample tasks, accessible UI, keyboard-first navigation and internationalisation foundations.
- Measure task completion, accepted edit rate, revert rate, time-to-first-success, time-to-completion and user-reported quality.

**Exit gate:** scripted golden tasks across small, medium and large repositories; comparative blind evaluations against selected coding-agent baselines; no critical regressions in core workflows.

### 2. Agent quality and model orchestration

- Define a provider-neutral model capability registry covering tool calling, structured output, context window, image input, reasoning, latency and pricing.
- Implement model routing by task type, capability, user policy, latency and cost, with explicit user override.
- Add robust context compaction, retrieval, repository maps, symbol-aware search and prompt-injection boundaries for untrusted repository content.
- Make tool execution idempotent where possible; enforce budgets, timeouts, cancellation, retry limits and loop detection.
- Add evaluation datasets for planning, code changes, bug fixes, tests, refactors, terminal commands and security-sensitive changes.
- Track task-level quality and cost without collecting source code or secrets by default.

**Exit gate:** reproducible evaluation suite with published internal baselines, bounded tool loops, safe failure recovery and measurable improvements over the current baseline.

### 3. Identity, security and privacy

- Deliver first-party Makerrr identity, verified email, sessions, account recovery, MFA/passkeys and secure device/session revocation.
- Separate personal accounts, organisations, teams, roles, seats, entitlements and billing.
- Replace file-backed long-lived secrets with OS-native credential stores: macOS Keychain, Windows Credential Manager/DPAPI and Linux Secret Service/libsecret; document and encrypt any fallback.
- Centralise OAuth refresh, token rotation, logout, revocation and cross-process concurrency.
- Protect cloud execution with isolated workspaces, short-lived credentials, least-privilege service identities, network egress policy and auditable approvals.
- Threat-model prompt injection, malicious MCP servers, plugins, dependency confusion, compromised extensions, workspace escape and command execution.
- Establish secure SDLC, dependency and licence scanning, SBOM, signed builds, provenance, vulnerability disclosure, incident response and independent penetration testing.
- Provide privacy controls, data retention/deletion, export, telemetry opt-in/out and clear model-provider data disclosures.

**Exit gate:** no unresolved critical/high security findings; independent penetration test; verified secret-store behaviour on all supported OSes; account lifecycle and recovery tested end-to-end; documented incident and data-deletion procedures.

### 4. Reliability and engineering quality

- Make Linux, Windows and macOS build, unit, integration and E2E checks reliable and required before release.
- Eliminate flaky tests and stale Cline-only assumptions in Makerrr product flows while preserving intentional migration compatibility.
- Add contract tests for provider adapters, MCP, plugins, SDK and CLI.
- Introduce crash reporting with privacy-safe diagnostics, structured logs, trace IDs and actionable error messages.
- Test upgrades, interrupted migrations, rollback, offline operation, low disk, permission failures and corrupted local state.
- Add release channels, staged rollouts, automatic rollback criteria and reproducible release artifacts.
- Define supported OS/architecture matrix and a tested upgrade/support policy.

**Exit gate:** required CI green on all supported platforms; no known release-blocking bugs; successful clean-install, upgrade and rollback drills; signed and reproducible release artifacts.

### 5. Cloud platform and 10M-scale infrastructure

- Keep local execution independent of cloud availability.
- Build cloud services as stateless APIs plus durable queues and workers; separate control plane from execution plane.
- Use tenant isolation, regional data placement, per-tenant quotas, fair scheduling and resource limits.
- Store task state and artifacts durably; support retries, deduplication, cancellation, resumable runs and disaster recovery.
- Add multi-region routing, rate limiting, abuse prevention, DDoS protection, secrets management, backups and tested restore procedures.
- Instrument API latency, queue delay, worker saturation, model-provider latency, token usage, failure rates, cost per task and tenant-level consumption.
- Build autoscaling from measured demand, with overload shedding and graceful degradation.
- Establish SLOs for API availability, task-start latency, task completion, data durability and recovery time.

**Exit gate:** capacity tests at 1x, 2x and 5x forecast peak; soak tests; regional failover; backup restore; queue-drain and worker-loss drills. The 10M-user target must be tied to explicit assumptions for MAU, DAU, concurrency and workload mix.

### 6. Commercial readiness and growth

- Create a clear free, individual paid, team and enterprise packaging model with transparent model usage and cost controls.
- Implement billing, invoices, trials, entitlements, usage limits, refunds and support escalation only after identity and metering are dependable.
- Enterprise controls: SSO/SAML, SCIM, audit logs, organisation policies, data retention, private networking and admin reporting.
- Publish installation, migration, privacy, security, status, support and service documentation.
- Establish customer support, incident communications, release notes, feedback loops and product analytics.
- Build distribution through VS Code Marketplace, desktop distribution, CLI package managers, SDK integrations, developer communities and education.

**Exit gate:** complete purchase-to-cancellation lifecycle; tested metering and entitlement enforcement; support runbooks; public status and documentation; enterprise security pack.

## Scale model and test programme

Use a workload model rather than a single headline user count. At minimum, test these dimensions independently:

| Dimension | Required measurement |
|---|---|
| Registered accounts | Total accounts and growth rate |
| MAU / DAU | Active users and geographic distribution |
| Concurrent clients | Connected editor, desktop and CLI sessions |
| Concurrent agent runs | Active local and cloud executions |
| Model traffic | Requests, tokens, context size, provider mix and throttling |
| Storage | User settings, task metadata, transcripts and generated artifacts |
| Cloud compute | Worker CPU, memory, disk, startup and execution time |
| Reliability | Error rate, p50/p95/p99 latency, queue delay and recovery |
| Economics | Cost per active user, task and successful completion |

Run load tests with synthetic tenants and non-sensitive fixtures. Define explicit target profiles for normal, peak and burst demand. Include provider rate-limit simulations and degraded-provider scenarios; external model-provider capacity is not controlled by Makerrr.

## Competitive scorecard

Evaluate Makerrr regularly against Cursor and other leading coding agents on the same tasks:

- Onboarding time and setup success.
- Repository understanding and relevant context retrieval.
- First-pass task success and test pass rate.
- Multi-file edit quality and diff review.
- Tool reliability and safe command execution.
- Latency and responsiveness.
- Model choice and routing quality.
- Cost per successful task.
- Recovery, undo and checkpoint quality.
- Privacy, local execution and enterprise controls.
- Extensibility and ecosystem compatibility.

Do not claim parity or superiority based on feature checklists alone. Use blind task evaluations, reproducible test repositories and published internal scorecards.

## Execution sequence

### Phase 0 — Stabilise the current foundation

- Resolve every known CI failure and make the full platform test matrix required.
- Complete the Cline-to-Makerrr identity and path migration without breaking legacy imports or user data.
- Inventory product surfaces, feature flags, remote services, external dependencies and release blockers.
- Establish a security baseline, software bill of materials and release checklist.

### Phase 1 — Ship a dependable individual developer product

- Polish installation, onboarding, provider setup and first-task success.
- Improve the coding loop, repository context, diff review, checkpoints and recovery.
- Finish local credential protection and consistent cross-platform behaviour.
- Launch staged public beta with telemetry and support controls.

### Phase 2 — Teams and enterprise

- Deliver first-party identity, organisations, RBAC, billing and enterprise administration.
- Add secure collaboration, policy enforcement, auditability and managed deployment options.
- Complete independent security testing and operational readiness.

### Phase 3 — Cloud execution and global scale

- Roll out isolated cloud agents, durable task orchestration and regional infrastructure.
- Introduce autoscaling, quotas, abuse controls, failover and disaster recovery.
- Run progressively larger capacity and soak tests before increasing public limits.

### Phase 4 — 10M-user readiness

- Validate the target workload model with production-like traffic and provider mix.
- Complete multi-region resilience, privacy, support and financial-operability reviews.
- Increase capacity in controlled stages, with rollback thresholds and executive sign-off.

## Current known release blockers

The repository README currently states that Makerrr is not yet a commercial release and that first-party identity, subscription billing, an OS-native credential vault, multi-region cloud service and 100,000-developer capacity are not deployed or load-tested. These are explicit gaps, not implied features.

The 2 November 2026 CI review also identified unresolved failures after PR #9 was merged:
- SDK Linux: CLI command-dispatch tests, CLI plugin path expectations and a Makerrr binary-wrapper environment-variable test.
- SDK Windows: provider-settings POSIX file-mode assertion was run on Windows and failed; Windows credential ACL protection remains a separate security requirement.
- VS Code E2E Linux/macOS: sign-in helper still searched only for the legacy "Login to Cline" button and timed out.
- VS Code unit/build workflows passed on Linux and Windows; SDK quality checks passed.

These defects must be fixed and rerun. A green typecheck or build alone does not satisfy the production release gate.

## Release governance

A production release requires named owners and evidence for:
- Product acceptance and usability.
- Agent evaluation and model-provider quality.
- Security review and vulnerability disposition.
- Cross-platform CI and upgrade/migration testing.
- SLOs, load tests, resilience and disaster recovery.
- Privacy, legal, licensing and customer support.
- Billing, entitlement and abuse controls where applicable.

Any missing evidence remains an explicit release blocker. This programme should be maintained as a living engineering plan with linked issues, pull requests, test runs, dashboards and sign-offs.
