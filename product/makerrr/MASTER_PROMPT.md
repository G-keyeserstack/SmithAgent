# Makerrr — Product Master Specification

**Owner:** Suppple Group Plc  
**Product:** Makerrr (always spelled with three “r” characters)  
**Repository:** SmithAgent, a Cline-derived codebase  
**Status:** Product and engineering source of truth

## Mission

Build Makerrr as a developer-first, open agent platform that helps people create and maintain software using an AI agent across the editor, terminal, desktop and SDK. Preserve local-first execution and explicit human approval while making optional cloud capabilities secure, observable and scalable.

The product is intended for broad international adoption, with particular attention to African developer needs: variable connectivity, local model access, practical pricing, multilingual readiness and regional hosting options.

## Product deliverables

1. VS Code extension.
2. CLI executable named `makerrr`.
3. Desktop application for macOS, Windows and Linux.
4. SDK published as `@makerrr/sdk` when package ownership and release controls are ready.
5. Optional cloud-agent and team services.
6. Documentation and onboarding site.
7. Public marketing site and customer account experience.
8. Admin console, subscriptions, invoicing and prepaid-code operations.
9. Brand assets and deployment documentation.

Do not represent an item as production-ready until it has been implemented, tested, deployed and operationally verified.

## Product principles

- **Local-first:** repository contents and execution remain on the user's device by default. Cloud transfer must be explicit and clearly described.
- **Human control:** preserve plan/act workflows, approval gates for edits and commands, diffs, checkpoints and restore.
- **Model choice:** support hosted providers, OpenAI-compatible endpoints and local runtimes, subject to tested provider integrations.
- **Transparency:** expose model, usage, estimated cost, network activity and limitations where available.
- **Resilience:** tolerate intermittent connectivity, resume supported operations and provide clear offline/local-mode behaviour.
- **Security:** treat workspace content, MCP servers, extensions, model output and shell commands as untrusted input.
- **Accessibility:** maintain high contrast, keyboard support and responsive layouts.
- **Open-source integrity:** preserve upstream licensing, notices and required attribution.

## Branding and identifiers

- Product name: **Makerrr**.
- CLI: `makerrr`.
- Global configuration: `~/.makerrr/`.
- Project configuration: `.makerrr/`.
- Rules: `.makerrr/rules/`.
- Skills: `.makerrr/skills/`.
- MCP settings: `~/.makerrr/data/settings/makerrr_mcp_settings.json`.
- Environment variables: use `MAKERRR_` for new product-specific variables.
- Proposed VS Code publisher/extension ID: `suppple.makerrr`, subject to marketplace availability and publisher verification.
- Proposed npm scope: `@makerrr/*`, subject to registry ownership and package-name availability.

Do not perform blind global string replacement. Classify each upstream occurrence before changing it: user-facing branding, package/API identifier, persistent data/configuration, protocol identifier, migration compatibility, legal notice or historical documentation. Provide migration and compatibility shims where needed.

## Runtime and provider strategy

Retain the upstream Bun workspace architecture unless a documented engineering decision justifies a change. Support providers only where the relevant adapter is implemented and tested. The intended provider catalogue includes Anthropic, OpenAI, Google, OpenRouter, xAI/Grok, Groq, Cerebras, AWS Bedrock, Azure, Vertex, Ollama, LM Studio and compatible endpoints.

Never claim universal support merely because a provider appears in product copy. Document authentication method, supported models, tool-use capability, streaming behaviour and known limitations for each adapter.

## Cloud and account services

Cloud services are optional and must remain separated from local agent execution. Target capabilities include:
- authenticated user and organisation accounts;
- device authorisation for CLI;
- role-based team access;
- isolated per-task workspaces or containers;
- durable session metadata and object storage;
- Git hosting integration and pull-request workflows;
- scheduled agents with explicit permissions;
- usage metering, subscription tiers and enterprise controls;
- audit events and exportable logs.

Use tenant-scoped authorization on every server-side data access. Never rely on client-side role checks.

## Security and privacy

- Require explicit consent before sending source code or workspace data to cloud services.
- Use least-privilege credentials and short-lived tokens where possible.
- Keep secrets out of logs, telemetry, client bundles and repository files.
- Validate and authorize every cloud-agent operation server-side.
- Require human approval for potentially destructive or externally visible actions.
- Sandbox cloud execution; do not treat a container alone as a complete security boundary.
- Make telemetry opt-in where appropriate and document exactly what is collected.
- Provide account deletion, data export and retention controls before public SaaS launch.

## African market readiness

- Optimise application and documentation delivery for constrained bandwidth.
- Support local inference guidance, including Ollama and LM Studio where compatible.
- Prepare UI localisation for English, isiZulu, Kiswahili, Afrikaans and French.
- Design pricing and payment interfaces to allow local currencies and regional payment providers, including SuppplePAY where separately integrated.
- Consider Johannesburg, Lagos and Nairobi for future regional deployment, subject to provider availability, latency testing, data-protection review and operational capability.

## Implementation sequence

### Stage 0 — Repository assessment
- Map the upstream monorepo, packages, applications, build scripts and release workflows.
- Record all Cline-specific identifiers and classify them by migration risk.
- Confirm current upstream commit, repository licence and third-party notices.
- Establish baseline install, typecheck, test and build results.
- Create an implementation plan with reversible, reviewable changes.

### Stage 1 — Product foundation and safe rebrand
- Add Makerrr product documentation and brand foundations.
- Rebrand public-facing product surfaces.
- Introduce new config paths with migration from legacy paths.
- Rename CLI and package metadata only where dependency and release implications are understood.
- Preserve upstream licence files, copyright notices and attribution.
- Build and test the CLI and VS Code extension.

### Stage 2 — Hardening
- Improve error handling and recovery.
- Add opt-in observability and usage accounting.
- Review command execution, filesystem access, MCP and browser-tool boundaries.
- Add security policy, support processes and release automation.
- Add self-hosted deployment examples for cloud components.

### Stage 3 — SaaS and scale
- Implement tenant-aware identity and organisation roles.
- Implement isolated cloud agents and durable session storage.
- Add usage metering, subscriptions, invoicing and prepaid redemption.
- Add marketplace discovery and trust/safety review.
- Add enterprise SSO, audit logs and deployment controls.

### Stage 4 — Launch readiness
- Publish documentation, installation guides and release notes.
- Verify marketplace publisher identity and package ownership.
- Run security review, dependency review, load tests and recovery exercises.
- Confirm support, incident response, privacy and terms documentation.
- Launch gradually with feature flags and measurable rollback criteria.

## Engineering quality gates

A release must not be called production-ready until:
- clean install and reproducible build succeed;
- typecheck, unit tests and relevant integration/e2e tests pass;
- upgrade and configuration migration paths are tested;
- security-sensitive paths have been reviewed;
- secrets and production credentials are configured outside source control;
- monitoring, alerting, backups and rollback are operational;
- documentation accurately describes implemented functionality.

The aspiration to support 100,000 or more developers is a capacity-planning target, not a claim of current tested capacity. Validate it through workload modelling, load tests, regional latency measurements and operational readiness.

## Product voice

Clear, direct, confident and developer-first. Express African pride without making the product feel exclusive to one geography. Be candid about AI limitations, supported integrations and data handling.
