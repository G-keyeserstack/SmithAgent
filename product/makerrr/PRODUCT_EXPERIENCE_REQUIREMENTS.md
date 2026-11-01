# Makerrr product experience requirements

**Purpose:** translate the supplied Codex product experience reference into Makerrr requirements. This is a product specification and gap map, not a claim that every capability is already implemented.

## Product promise

One trusted coding agent across the developer's editor, terminal, desktop and optional cloud workspaces. Tasks should be reviewable, resumable and consistent across surfaces. Local execution is the default; cloud execution is explicit and scoped.

Makerrr should learn from the interaction patterns described in the supplied Codex material without copying OpenAI branding, copy, product names or visual design.

## Experience pillars

### 1. The same agent wherever developers work

Target surfaces:

- VS Code extension for inline development, diffs, approvals and task history.
- CLI for interactive, scripted and CI/CD workflows.
- Desktop app for project selection, long-running tasks, schedules and task review.
- SDK for embedding the agent in developer products and internal platforms.
- Cloud workspace for tasks that users explicitly choose to run remotely.

Acceptance criteria:

- A task started in one surface can be inspected and resumed in another where the selected storage mode permits it.
- Provider, model, permission and privacy settings have consistent semantics across surfaces.
- The user can identify where a task is running and which files or services it can access.

### 2. Long-running cloud tasks

Target behaviour:

- Tasks continue after the local laptop closes or disconnects.
- Each cloud task runs in an isolated workspace, worktree or sandbox.
- Durable task state is stored separately from stateless workers.
- Users can reconnect, inspect output, pause, cancel or resume tasks.
- Workspace data and credentials are scoped to the task and removed according to a documented retention policy.

Target infrastructure from the Makerrr architecture:

- Stateless workers.
- Durable session/task state in PostgreSQL.
- Object storage for permitted artifacts.
- Per-task containers or equivalent isolation.
- Queue-based scheduling, retries and cancellation.
- Regional placement close to users, including Johannesburg, Lagos and Nairobi where operationally justified.

**Current position:** cloud-agent and Hub-related code and documentation exist in the repository. Production isolation, durable multi-region operation, operational SLOs and 100,000-concurrent-developer capacity have not been established by the current source audit or load testing.

### 3. Multi-agent workflows

Target behaviour:

- Split larger work into bounded subtasks.
- Run independent agents in parallel when safe.
- Show task dependencies, status, cost and outputs.
- Require human review before merging changes or taking consequential actions.
- Preserve a unified audit trail for parent and child agents.

The repository already contains subagent and agent-team foundations. Productisation still requires workload limits, cancellation propagation, shared budget controls, workspace isolation and clear conflict handling.

### 4. Code review and GitHub workflows

Target behaviour:

- Review pull requests and surface actionable findings.
- Explain findings with file/line references.
- Suggest tests and verify fixes.
- Allow a developer to approve a proposed patch or request changes.
- Support branch/worktree creation and PR creation only with explicit permission.

Repository samples and GitHub integration code are a foundation; a hosted, automatic PR-review service and its operational guarantees should not be marketed as live until implemented and tested.

### 5. Plugins and connected tools

Target behaviour:

- Curated catalogue of plugins and MCP servers.
- Clear publisher identity, permissions and data-access declarations.
- Version pinning, signature/integrity checks and security scanning.
- Install, update, disable and remove from CLI, editor and desktop.
- Enterprise allowlists and audit logs.

Potential integration examples include GitHub, Figma, Supabase, Slack, Notion and Google Drive. These should be treated as connector targets, not as a claim that first-party integrations are already shipped. MCP remains the extensibility route where supported.

### 6. Team and enterprise workspace

Target capabilities:

- Shared projects and team workspaces.
- Organisation membership, invitations and role-based access.
- Admin policy for model providers, MCP servers, plugins and data handling.
- SSO through WorkOS or an equivalent OIDC/SAML provider.
- Audit events, export and enterprise retention controls.
- Private networking or customer-managed deployment options.

Makerrr Identity and organisation IAM must be separate from external model-provider authentication. An OpenAI or Anthropic credential is not a Makerrr account.

## Plans and commercial model

The target packaging is:

| Plan | Intended audience | Product boundary |
|---|---|---|
| Free | Individual developers exploring Makerrr | Local-first core with transparent usage limits |
| Pro | Individual professional developers | Higher usage, advanced models and longer-running workflows |
| Team | Small and growing engineering teams | Shared workspace, seats, budgets and team controls |
| Enterprise | Regulated and large organisations | SSO, RBAC, audit, retention, private deployment and support |

Pricing must be localised, transparent and aligned with provider/model costs. South African and wider African payment support should be considered, including SuppplePAY where appropriate.

The supplied Codex reference listed OpenAI prices of ZAR 399/month for Plus, from ZAR 1,839/month for Pro, and ZAR 320/user/month for Business on annual billing (2+ seats). These are competitor reference prices only; they are **not Makerrr prices or approved pricing recommendations**. Makerrr pricing requires separate unit-economics, willingness-to-pay and regional research.

## Trust, privacy and security requirements

- Local-first execution must be the default.
- The user must explicitly enable remote/cloud execution.
- Display the execution location, data boundary and credential scope before a cloud task starts.
- Never silently upload a workspace or source tree.
- Keep BYOK credentials local unless the user explicitly authorises a cloud task to use a scoped secret.
- Separate Makerrr identity, provider credentials, MCP credentials and organisation entitlements.
- Provide reliable logout, credential deletion and remote revocation where supported.
- Show model, token, cost and budget information without exposing secrets.
- Provide clear controls for telemetry and request capture.

## African market differentiation

- Resumable and low-bandwidth-friendly sessions.
- Local model support and practical hardware guidance.
- Localization-ready UI and prompts: English first, with Swahili, isiZulu, Afrikaans and French readiness.
- Regional hosting options and data-residency decisions.
- Examples and skills for African developer ecosystems.
- Pricing and payment options designed for local purchasing power.

African identity should be an advantage and source of perspective, not a barrier to global adoption.

## Implementation sequence

1. **Core release:** complete Makerrr branding and packaging, preserve compatibility, establish green CI and ship stable CLI/VS Code/SDK workflows.
2. **Security:** OS-backed credential manager, unified refresh, secure migration, durable logout, redaction and threat-model tests.
3. **Identity:** Makerrr accounts, device flow, MFA, organisations, RBAC and entitlements.
4. **Cloud agents:** isolated workers, durable task state, resume/cancel, GitHub worktrees and observability.
5. **Team product:** multi-agent board, code review, plugin catalogue, admin controls and billing.
6. **Scale proof:** load testing, chaos testing, regional failover, SLOs and cost controls.

Do not claim a scale target as a current capability. Publish measured capacity only after repeatable load tests and operational review.
