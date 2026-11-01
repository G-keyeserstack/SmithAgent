<p align="center">
  <img src="assets/makerrr-mark.svg" width="88" alt="Makerrr geometric mark" />
</p>

<h1 align="center">Makerrr</h1>

<p align="center">
  A developer-first AI coding agent for your editor, terminal and desktop.
</p>

<p align="center">
  <strong>Based on Cline (Apache-2.0).</strong> See <a href="./NOTICE.md">NOTICE.md</a> for attribution.
</p>

---

## Project status

Makerrr is under active development by Suppple Group Plc. This repository contains a Cline-derived foundation being developed into the Makerrr product described in `product/makerrr/`.

The Makerrr name and initial geometric identity are being introduced ahead of the controlled migration of package scopes, extension identifiers, environment variables and remaining upstream-facing strings. The CLI currently exposes both `makerrr` and `cline` command aliases; internal packages and source identifiers still use the upstream `@cline/*` and `cline` names for compatibility. They are implementation details, not the intended public Makerrr package or marketplace names.

**This repository is not yet a commercial release.** Do not assume that a hosted Makerrr identity service, subscription billing, OS-native credential vault, multi-region cloud service or 100,000-developer capacity has been deployed or load-tested.

## Product surfaces

| Surface | Repository location | Purpose |
|---|---|---|
| VS Code extension | `apps/vscode/` | Agent-assisted development in the editor, with human approval for changes and commands |
| CLI | `apps/cli/` | Interactive and headless agent workflows in the terminal |
| Desktop app | `apps/examples/desktop-app/` | Desktop client, sidecar runtime and workspace workflows |
| SDK | `sdk/` | Shared agent, provider, tools, storage and orchestration packages |
| Documentation | `docs/` | Product, CLI, SDK and deployment documentation |
| Product architecture | `product/makerrr/` | Makerrr product requirements, architecture and implementation decisions |

## Current capabilities in the codebase

- Agent workflows with Plan and Act modes, human-in-the-loop approvals and checkpoints.
- Multiple model providers through provider adapters, including BYOK credentials and local model runtimes.
- MCP integrations, tools, skills, plugins, hooks and configured agents.
- CLI, editor and desktop clients built around a shared SDK foundation.
- Agent teams, scheduling and cloud/Hub-related components in the repository.

The presence of code or documentation for a capability does not by itself mean that its hosted service, operational controls, billing, security certification or production scale has been completed.

## Architecture principles

1. **Local-first execution.** Local tasks should remain on the developer's device by default.
2. **Explicit cloud execution.** Cloud agents must be a deliberate user choice, with clear workspace, data and credential boundaries.
3. **One agent across surfaces.** CLI, VS Code, desktop and SDK should share core behaviour and consistent authentication policies.
4. **Provider credentials are not Makerrr identity.** A developer's OpenAI, Anthropic, Google or MCP credential must remain distinct from their Makerrr account, organisation and subscription.
5. **Scale horizontally.** Cloud workers, durable task state, model routing and observability are designed for growth; 100,000 concurrent developers remains a target requiring load tests and operational evidence.

See the [Makerrr overview](./docs/makerrr-overview.mdx), [authentication architecture](./product/makerrr/AUTHENTICATION_ARCHITECTURE.md) and [product experience requirements](./product/makerrr/PRODUCT_EXPERIENCE_REQUIREMENTS.md).

## Development

The repository uses Bun workspaces. The current CI workflow uses Bun 1.4.2 and Node.js 24 for its test matrix.

From the repository root:

```sh
bun install --frozen-lockfile
bun run build:sdk
bun -F @cline/cli build
bun run types
bun run lint
bun run test
```

The CLI workspace selector remains `@cline/cli` during the internal package migration. Do not publish that internal package name as the Makerrr public package identity. The intended public package scope is `@makerrr/*`, subject to the package and compatibility migration being completed and validated.

For VS Code-specific checks, see `apps/vscode/package.json` and the workflows under `.github/workflows/`. The repository's CI checks are the source of truth for the currently supported build and test commands.

## Security

Authentication and credential handling are being hardened in stages. Current provider credentials are still file-backed in parts of the application; restrictive file permissions are not encryption at rest. The OS-native credential manager, cross-client refresh unification, secure migration and complete logout/revocation lifecycle remain release gates.

Please do not submit real API keys, OAuth tokens, passwords or customer data in issues or pull requests. Contact the repository maintainers privately about suspected vulnerabilities; do not publish credentials, exploit details or customer data in public issues.

## Brand

- **Name:** Makerrr (always three r's).
- **Ink:** `#0c0d0b`.
- **Bone:** `#f3f0e7`.
- **Display type:** Cormorant Garamond.
- **Body/UI type:** Manrope or system sans-serif.
- **Voice:** clear, direct, developer-first and transparent about AI capabilities and limitations.

## Licence and upstream attribution

Makerrr is based on the open-source [Cline](https://github.com/cline/cline) project and retains the upstream Apache License 2.0 and applicable notices. Substantial Makerrr modifications are developed by Suppple Group Plc and the Makerrr team.

**Based on Cline (Apache-2.0).**
