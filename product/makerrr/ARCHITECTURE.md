# Makerrr Architecture Overview

## High-level system

```text
Clients
  ├── VS Code extension
  ├── CLI
  └── Desktop application
          │
          ▼
     @makerrr/sdk
  ├── Core agent orchestration
  ├── Agent/tool interfaces
  ├── Model adapters
  └── Shared types and utilities
          │
     ┌────┴──────────────┐
     ▼                   ▼
Local execution      Optional cloud services
(files, shell,       ├── Cloud agent workers
browser, MCP)        ├── Model gateway (optional)
                     ├── Auth and organisations
                     ├── Durable session metadata
                     └── Object storage
```

The SDK is a logical boundary and package target; actual package boundaries must follow the existing repository architecture and should not be fabricated by documentation.

## Architectural principles

1. **Client-side first.** Most coding-agent work should execute locally. No source code leaves the device by default.
2. **Explicit cloud boundary.** Cloud agents are an opt-in execution mode with clear data-transfer and permission disclosures.
3. **Stateless workers, durable state.** Cloud workers should be replaceable and horizontally scalable; session metadata and artifacts live in durable services.
4. **Tenant isolation.** User, organisation, project, session and billing records require tenant-scoped authorization.
5. **Provider abstraction.** Model adapters expose a common interface while preserving provider-specific capabilities and errors.
6. **Graceful degradation.** Local providers and recoverable operations should remain usable during cloud or network disruption.
7. **Observable by design.** Instrument task lifecycle, latency, errors and model usage without collecting source code by default.

## Logical components

### Clients
- VS Code extension: editor integration and approval UI.
- CLI: terminal-first interaction and device authentication for cloud features.
- Desktop: standalone application with platform-specific packaging.
- SDK: reusable public API for supported agent capabilities.

### Local execution
- Workspace file access.
- Shell/terminal execution with explicit approval.
- Browser and MCP integrations subject to permission boundaries.
- Checkpoint, diff and restore functionality.
- Local model endpoints such as Ollama and LM Studio where supported.

### Model adapters and optional gateway
A direct-to-provider mode should remain available where appropriate. A central gateway may provide:
- provider routing and fallback;
- rate limits and quota enforcement;
- usage and cost attribution;
- policy enforcement;
- caching where safe and semantically valid.

The gateway must not become a mandatory path for local-only users. Do not cache sensitive prompts or completions without a documented privacy and retention policy.

### Cloud agents
- One isolated execution environment per task or equivalent strong isolation boundary.
- Ephemeral credentials and restricted network egress.
- Durable session metadata in PostgreSQL or an equivalent relational store.
- Artifacts in encrypted object storage.
- Queue-based scheduling and worker autoscaling.
- Git integration with scoped installation tokens.
- Audit events for privileged operations.

### Identity and organisations
Support local-only use independently of SaaS login. SaaS identity should support email authentication and selected OAuth providers; enterprise SSO can be layered through WorkOS or an equivalent identity provider. API access should use short-lived, scoped credentials. Device flow is recommended for CLI sign-in.

### Observability
Use OpenTelemetry-compatible traces, metrics and structured logs. Candidate backends include Grafana stack or Datadog. Collect operational metadata such as task duration, provider, token counts where available, errors and cost estimates. Source code and prompt bodies should be excluded by default.

## Scaling to 100,000 developers

100,000 developers is a design target, not an assertion of current capacity. Validate capacity through realistic load tests and operational exercises.

- Keep local execution independent of cloud service throughput.
- Use stateless API and worker services behind load balancers.
- Partition or index tenant-scoped data based on measured access patterns.
- Queue long-running tasks and apply per-tenant concurrency limits.
- Use object storage for large artifacts rather than relational database blobs.
- Apply backpressure, retries with jitter and idempotency keys.
- Establish per-provider and per-tenant rate limits.
- Monitor queue depth, worker saturation, database connections, storage growth and regional latency.
- Define recovery objectives, backup policies and incident procedures before general availability.

## Multi-region strategy

Potential African regions include Johannesburg, Lagos and Nairobi. Region selection must be based on actual cloud availability, data residency obligations, provider latency, connectivity, cost and operational support. Keep control-plane and data-plane placement explicit. Do not imply regional hosting exists until deployed and verified.

## Configuration paths

| Scope | Path |
|---|---|
| Global | `~/.makerrr/` |
| Project | `.makerrr/` |
| Rules | `.makerrr/rules/` |
| Skills | `.makerrr/skills/` |
| MCP settings | `~/.makerrr/data/settings/makerrr_mcp_settings.json` |

A migration utility should detect legacy Cline configuration, offer a safe copy/migration, preserve user data, and avoid destructive deletion. During a transition period, document precedence when both legacy and Makerrr settings exist.

## Security boundaries

- Treat model output, repository files, MCP responses and plugin metadata as untrusted.
- Validate tool arguments and enforce permissions in the execution layer.
- Require approval for shell commands and other consequential actions.
- Apply workspace path validation to prevent traversal and unintended file access.
- Isolate cloud tasks and restrict network access by policy.
- Encrypt secrets and artifacts in transit and at rest.
- Record privileged actions in an append-only audit trail where feasible.
- Test tenant isolation and authorization failures as first-class security cases.

## Suggested technology choices

These are options, not existing implementation claims:
- Relational persistence: PostgreSQL.
- Queue: a managed queue or Redis-backed queue, selected after workload testing.
- Artifacts: S3-compatible object storage.
- Identity: WorkOS or equivalent for enterprise SSO; OAuth/email for standard accounts.
- Telemetry: OpenTelemetry with Grafana or Datadog.
- Runtime: preserve upstream Bun and Node.js compatibility requirements.
