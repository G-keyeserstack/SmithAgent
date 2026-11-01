# Makerrr authentication architecture: repository implementation

**Status:** implementation reference for the current repository, not a statement that every target capability is already shipped.

This document describes the authentication code currently present in SmithAgent/Makerrr. It separates implemented behaviour from the target commercial architecture so product, engineering and security decisions are made against the code rather than marketing assumptions.

## 1. Security boundaries

Makerrr has three distinct credential domains:

1. **Makerrr account identity** — who the developer is, their organisation, roles, subscription and product entitlements.
2. **Model-provider credentials** — API keys or OAuth credentials used to call OpenAI, Anthropic, Google, OpenRouter and other inference providers.
3. **Integration credentials** — OAuth tokens, client registrations and other secrets used by MCP servers and external integrations.

The current repository has a provider-authentication framework and inherits Cline account authentication. It does **not** yet establish a complete first-party Makerrr identity, subscription, organisation IAM or central inference-authorisation service. Do not describe provider login as Makerrr account registration.

## 2. Components in the current codebase

| Component | Source | Responsibility |
|---|---|---|
| CLI auth command | `apps/cli/src/commands/auth.ts` | Provider selection, BYOK setup and OAuth onboarding |
| CLI provider resolution | `apps/cli/src/utils/provider-auth.ts` and `apps/cli/src/main.ts` | Normalises provider IDs and resolves the credential used by a CLI run |
| Provider auth registry | `sdk/packages/core/src/auth/provider-auth-registry.ts` | Maps provider IDs to login, refresh, save and configured-state handlers |
| OAuth contracts | `sdk/packages/core/src/auth/types.ts` | Shared access/refresh/expiry credential contract and callback types |
| Cline account OAuth | `sdk/packages/core/src/auth/cline.ts` | WorkOS device authorisation and Cline account token lifecycle |
| OpenAI Codex OAuth | `sdk/packages/core/src/auth/codex.ts` and `apps/vscode/src/integrations/openai-codex/oauth.ts` | Codex browser authorisation, PKCE, callback and token refresh |
| Oracle Code Assist OAuth | `sdk/packages/core/src/auth/oca.ts` | OCA provider-specific OAuth |
| Provider settings | `sdk/packages/core/src/services/storage/provider-settings-manager.ts` | Validates, normalises and persists provider settings |
| Runtime refresh | `sdk/packages/core/src/runtime/orchestration/runtime-oauth-token-manager.ts` | Resolves OAuth credentials and coordinates refresh |
| Cross-process refresh lock | `sdk/packages/core/src/runtime/orchestration/oauth-refresh-lock.ts` | Serialises refresh for a provider across processes |
| VS Code secret storage | `apps/vscode/src/shared/storage/ClineFileStorage.ts` and `apps/vscode/src/shared/storage/storage-context.ts` | File-backed secret/state compatibility storage |
| MCP OAuth | `sdk/packages/core/src/extensions/mcp/oauth.ts` and `apps/vscode/src/services/mcp/McpOAuthManager.ts` | MCP OAuth discovery, client metadata, callback and token lifecycle |
| Provider request adapters | `sdk/packages/llms/src/providers/vendors/` | Converts resolved provider configuration into authenticated model requests |

## 3. Onboarding and request flow

### BYOK API-key setup

The CLI currently supports non-interactive quick setup using provider, API key and model options:

```sh
makerrr auth --provider openai-compatible --apikey <key> --modelid <model> --baseurl https://api.example.com/v1
```

The command validates the provider against the local provider catalogue, checks required fields and provider-specific base-URL rules, then calls `ProviderSettingsManager.saveProviderSettings()`. The API key is persisted as provider configuration; it is not exchanged for a Makerrr session token.

**Security note:** passing a production secret in `--apikey` can expose it through shell history, process inspection or command capture. Prefer a secure prompt or a documented environment/secret-manager flow before recommending this mode to commercial customers. A secure, masked prompt is a release-hardening task.

### OAuth setup

The provider auth registry chooses the handler for the selected provider. The handler starts its provider-specific authorisation flow, returns credentials, and saves them through the provider settings manager.

The built-in registry includes Cline account authentication, OpenAI Codex and Oracle Code Assist. These providers do not share an identical OAuth protocol:

- **Cline account:** WorkOS device authorisation. The user completes verification in a browser while the client polls for the result.
- **OpenAI Codex:** browser authorisation using PKCE S256, a random state value, a local callback server and an authorisation-code exchange. The main callback path validates state. The manual code-entry fallback should require state rather than accepting an omitted state.
- **Oracle Code Assist:** provider-specific OAuth/OIDC handling.

### CLI model request

At startup, the CLI creates the provider settings manager, determines the selected provider, resolves an explicitly supplied key or persisted provider credentials, resolves model configuration, constructs the shared runtime configuration and starts the agent. The final HTTP authentication header is added by the relevant LLM provider adapter, not by the agent loop itself.

Headless execution does not launch an interactive browser login. A valid existing credential or provider-supported environment configuration must be available.

## 4. Credential and token model

The shared OAuth credential contract represents:

| Field | Meaning |
|---|---|
| `access` | Current short-lived access credential |
| `refresh` | Long-lived refresh credential used to obtain a replacement |
| `expires` | Expiry time in milliseconds |
| `accountId` | Provider account identifier when available |
| `email` | Display/account metadata when available |
| `metadata` | Provider-specific non-uniform metadata |

The provider registry reconstructs this object from saved provider settings. Explicit expiry is preferred; JWT expiry can be derived where supported. If expiry cannot be established, the credential is treated as expired and refresh is attempted on resolution.

## 5. Storage: current state and release gap

### Provider settings

`ProviderSettingsManager` stores provider settings in a JSON file. Credential-bearing fields include API keys, OAuth access and refresh tokens, AWS credentials, SAP client secrets and custom headers. The implementation sanitises invisible control/format characters, uses atomic temporary-file replacement and applies restrictive POSIX file permissions (directory 0700, file 0600).

These controls reduce accidental disclosure and partial writes. They are **not encryption at rest**. The JSON file remains readable to a process or user account that can access it.

### VS Code secrets

The VS Code storage layer includes a legacy `secrets.json` file-backed store. The security-hardening change on the current security branch hardens permissions on an existing file and makes credential writes fail visibly before publishing the new in-memory state. This also is not an OS-native encrypted vault.

### Duplicate stores

Some integrations, notably Codex, have historically written credentials to both the provider settings manager and extension state secrets. MCP OAuth stores access/refresh tokens, client metadata and code verifier data in MCP settings. These secondary stores must be migrated into the same credential-management boundary; protecting only `apiKey` is insufficient.

**Commercial-release requirement:** implement one shared credential-manager interface backed by macOS Keychain, Windows Credential Manager/DPAPI and Linux Secret Service/libsecret, with an explicitly designed encrypted fallback. Provider settings should retain credential references and non-secret configuration, not long-lived secret values.

## 6. Refresh, rotation and concurrency

The SDK `RuntimeOAuthTokenManager` uses an in-process single-flight map and a SQLite-backed cross-process lock. It re-reads credentials after acquiring the lock, checks that the credential set has not been replaced while refresh was in flight, and saves rotated credentials after a successful refresh.

There are still provider/client-specific refresh paths. The VS Code Codex integration has its own in-memory refresh promise and must be checked for cross-process races with CLI and desktop. The release target is one shared refresh coordinator, with tests for token rotation, two-process concurrency, logout during refresh, account switching, invalid-grant responses, transient network errors and persistence failure.

## 7. API request construction and endpoint trust

Provider settings are converted into provider configuration and passed to vendor adapters. API keys and OAuth access credentials are then applied by the adapter or provider SDK. Custom base URLs and custom headers are security-sensitive inputs.

Before commercial release:

- Require HTTPS for remote provider endpoints; explicitly allow loopback/local model endpoints.
- Prevent credentials from being forwarded to a different origin on redirects.
- Redact custom secret headers and URL query credentials.
- Apply identical credential precedence and policy across CLI, VS Code and desktop.
- Keep BYOK credentials local for local execution; cloud execution must use explicit, scoped credential hand-off.

## 8. Logging and diagnostics

The security-hardening branch removes stable token fingerprints from the provider-settings and runtime-refresh debug messages. Logs should report provider ID, operation, success/failure and non-secret correlation identifiers, never token-derived fingerprints or token fragments.

Truncating an error message is not redaction. A shared sanitisation layer is still required for telemetry, provider errors, URLs, OAuth codes, custom headers, request-capture output and crash diagnostics. Provider request capture is disabled by default, but full/wire capture can contain prompts, source code, request bodies and URLs; production builds need explicit opt-in, warnings, restrictive file permissions and retention controls.

## 9. Cline-to-Makerrr migration and logout

Runtime migration copies ordinary files and snapshots SQLite databases, stages the destination, records a journal and preserves backups/source data for recovery. Legacy provider migration also reads legacy settings and secret stores.

That protects recoverability but can leave credential copies in the original `.cline` directory, destination data, staging/backup folders, legacy secret files and new settings. Migration must identify secret-bearing records, move them into the credential manager, verify them, then retire old copies under a documented rollback and retention policy. Do not delete the whole legacy directory: it may contain user data.

Logout must not report success if durable credential deletion fails. All clients need the same deletion path for provider settings, legacy secrets, Codex state and MCP OAuth state. Local sign-out is not remote revocation; the UI and CLI must distinguish local deletion from remote session/key revocation.

## 10. Target commercial identity architecture

The target architecture adds a separate Makerrr identity and access layer above provider authentication:

1. **Makerrr Identity:** email/password or passwordless login, GitHub/Google OAuth, WorkOS SSO, MFA, device authorisation and local-only mode.
2. **Organisation IAM:** organisation membership, RBAC, invitations, audit events and enterprise provisioning.
3. **Entitlements:** plan, seat, usage and budget policy. Entitlements authorise Makerrr services; they do not replace provider credentials.
4. **Model Gateway:** optional hosted inference, rate limiting, routing, cost accounting and policy enforcement.
5. **Credential Manager:** local OS vault for BYOK by default; narrowly scoped encrypted vault access only when a user explicitly enables cloud execution.

This separation supports the Codex-style experience across editor, terminal, desktop and cloud without confusing ChatGPT/OpenAI OAuth, other provider credentials and Makerrr customer identity.

## 11. Source references

- `apps/cli/src/commands/auth.ts`
- `apps/cli/src/main.ts`
- `sdk/packages/core/src/auth/provider-auth-registry.ts`
- `sdk/packages/core/src/auth/cline.ts`
- `sdk/packages/core/src/auth/codex.ts`
- `sdk/packages/core/src/auth/oca.ts`
- `sdk/packages/core/src/services/storage/provider-settings-manager.ts`
- `sdk/packages/core/src/runtime/orchestration/runtime-oauth-token-manager.ts`
- `sdk/packages/core/src/runtime/orchestration/oauth-refresh-lock.ts`
- `apps/vscode/src/shared/storage/ClineFileStorage.ts`
- `apps/vscode/src/services/mcp/McpOAuthManager.ts`
- `sdk/packages/core/src/extensions/mcp/oauth.ts`

**Release status:** provider authentication is implemented; Makerrr first-party identity, OS-native credential vault, unified refresh across all clients, complete migration retirement and verified remote revocation remain implementation work.
