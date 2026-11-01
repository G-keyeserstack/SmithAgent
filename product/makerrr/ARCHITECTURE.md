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

## South African cloud infrastructure strategy

Makerrr's preferred South African infrastructure design uses Stratos Lab and YSBERG as complementary infrastructure providers. These are target provider relationships and architecture decisions; they are not evidence of a signed commercial agreement, deployed integration, reserved capacity or production service. Commercial, technical, security and legal due diligence must precede production use.

### Provider responsibilities

**Stratos Lab — primary cloud and AI infrastructure partner**
- Evaluate Stratos Lab GPU-as-a-Service for scalable hosted model inference and, where commercially and technically appropriate, fine-tuning or training workloads.
- Evaluate its Managed PaaS and bare-metal orchestration for the Makerrr cloud data plane, model-serving operations and supporting compute services.
- Use its published GPU catalogue (including A100, H100, H200 and B200 offerings) as planning inputs only; confirm actual availability, region, tenancy, networking, storage, service levels and pricing directly before sizing deployments.
- Treat Stratos Lab as a provider abstraction behind Makerrr's infrastructure adapters. Avoid hard-coding provider-specific assumptions into the agent runtime.

**YSBERG — complementary dedicated compute and private inference partner**
- Evaluate dedicated GPU nodes for private, predictable inference capacity, local model hosting, development and performance benchmarking.
- Consider its Johannesburg/Teraco footprint where it meets latency, data-location, connectivity and contractual requirements.
- Use YSBERG as an additional capacity and resilience option rather than assuming it is a substitute for Stratos Lab's managed GPU cloud or PaaS capabilities.
- Confirm hardware configuration, tenancy, support, network throughput, backup, failover and actual service availability contractually.

### Logical deployment topology

```text
Makerrr clients (VS Code / CLI / Desktop / SDK)
                    |
                    v
       Makerrr control plane and API
  identity | organisations | policy | billing
  session metadata | scheduler | audit | routing
                    |
          +---------+----------+
          |                    |
          v                    v
 Isolated agent workers    Model gateway / router
 ephemeral workspace      provider policy / quotas
 restricted egress        model selection / telemetry
          |                       |
          |               +-------+-------+
          |               |               |
          v               v               v
 Git / artifact store  Stratos Lab      YSBERG
 encrypted, scoped     GPUaaS/PaaS      dedicated GPU
          |
          v
 durable session and audit metadata
```

This is a target logical design, not a diagram of deployed infrastructure. The control plane should remain portable, and the model gateway should support direct provider and local-model routes where the product permits them.

### Critical separation: agent execution vs model inference

GPU inference and untrusted agent code execution are different security domains. A shared GPU node or model-serving process must not be treated as an isolated workspace for arbitrary user code. Keep model-serving endpoints separate from ephemeral agent workers.

For cloud agent tasks:
- provision a fresh isolated environment per task or per explicitly bounded session;
- evaluate Firecracker microVMs or an equivalently strong isolation boundary for untrusted repository code and shell commands;
- do not assume a standard container alone is a sufficient hostile-code boundary;
- restrict outbound network access using explicit allowlists and policy enforcement;
- issue short-lived, task-scoped Git and service credentials;
- enforce CPU, memory, disk, process, runtime and wall-clock quotas;
- destroy the execution environment after completion while retaining only approved artifacts and durable session metadata;
- require user approval for consequential actions such as publishing, pushing, deploying or accessing external systems.

Stratos Lab or YSBERG may supply compute for an execution pool only after confirming that the required isolation, privileged runtime support, networking controls, lifecycle APIs and operational guarantees are available. Do not assume GPUaaS or bare-metal orchestration automatically provides Firecracker-compatible task isolation.

### Model-serving design

- Place model endpoints behind a Makerrr-owned provider interface and authenticated gateway.
- Keep API keys and provider credentials in a secrets manager, never in clients or task workspaces.
- Route requests based on user choice, model capability, policy, latency, availability and cost.
- Support streaming, tool calling, structured output, context limits and provider-specific errors explicitly in adapter capability metadata.
- Apply per-user and per-tenant quotas, concurrency limits, request timeouts and circuit breakers.
- Avoid prompt/completion retention by default; document any logging, caching, abuse-monitoring or provider retention before enabling it.
- Benchmark representative coding-agent workloads, not just raw tokens-per-second. Measure first-token latency, end-to-end task completion, tool-call reliability, context-window behaviour and cost per successful task.

### Data residency and privacy

South African hosting can support local data-location objectives, but location alone does not establish POPIA compliance or eliminate cross-border processing. Map every data flow, including support access, telemetry, backups, model providers, subprocessors and disaster recovery. Complete privacy, security and contractual reviews before promising data residency or sovereignty to customers.

### Provider due diligence and acceptance gates

Before selecting either provider for production, obtain and validate:
1. Written capacity, hardware/GPU specifications, region and physical hosting location.
2. Pricing, minimum commitments, billing granularity, egress charges and scaling lead times.
3. SLA, support escalation, maintenance windows, incident communications and service credits.
4. Network topology, bandwidth, latency, private connectivity, firewall controls and DDoS posture.
5. Tenant isolation, privileged access controls, vulnerability management and independent security assurance.
6. Data-processing terms, subprocessors, retention/deletion, backup locations and cross-border transfer terms.
7. Monitoring, usage metering, API/automation support and portability/export procedures.
8. Recovery options, capacity reservations and exit/migration assistance.

Run a proof of concept against identical Makerrr workloads on both providers. Compare reliability, latency, throughput, cost per completed task, operational burden and portability. Keep provider-specific integration behind adapters so that Makerrr can fail over or migrate without rewriting agent logic.
