import { beforeEach, describe, expect, it, vi } from "vitest"
import type { OAuthTokens } from "@modelcontextprotocol/sdk/shared/auth.js"

const mocks = vi.hoisted(() => {
	const state = {
		oauthStates: new Map<string, Record<string, unknown>>(),
		secrets: new Map<string, string>(),
		writeError: undefined as Error | undefined,
		skipWrite: false,
	}
	const logger = {
		log: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
	}
	const stateManager = {
		getSecretKey: vi.fn((key: string) => state.secrets.get(key)),
		setSecret: vi.fn((key: string, value: string | undefined) => {
			if (value === undefined) state.secrets.delete(key)
			else state.secrets.set(key, value)
		}),
	}
	const getMcpServerOAuthState = vi.fn((serverName: string) => state.oauthStates.get(serverName))
	const updateMcpServerOAuthStateAsync = vi.fn(
		async (serverName: string, updater: (current: Record<string, unknown>) => Record<string, unknown>) => {
			if (state.writeError) throw state.writeError
			const next = updater(state.oauthStates.get(serverName) ?? {})
			if (!state.skipWrite) state.oauthStates.set(serverName, next)
		},
	)

	return {
		state,
		logger,
		stateManager,
		getStateManager: vi.fn(() => stateManager),
		getMcpServerOAuthState,
		updateMcpServerOAuthStateAsync,
		authorizeMcpServerOAuth: vi.fn(),
	}
})

vi.mock("@cline/core", () => ({
	authorizeMcpServerOAuth: mocks.authorizeMcpServerOAuth,
	getMcpServerOAuthState: mocks.getMcpServerOAuthState,
	updateMcpServerOAuthStateAsync: mocks.updateMcpServerOAuthStateAsync,
}))
vi.mock("@core/storage/StateManager", () => ({
	StateManager: { get: mocks.getStateManager },
}))
vi.mock("@/utils/mcpAuth", () => ({
	getServerAuthHash: vi.fn(() => "server-hash"),
}))
vi.mock("@/shared/services/Logger", () => ({ Logger: mocks.logger }))
vi.mock("@/shared/net", () => ({ fetch: vi.fn() }))
vi.mock("@/utils/env", () => ({ openExternal: vi.fn() }))

import { McpOAuthManager } from "./McpOAuthManager"

const SERVER_NAME = "linear"
const SERVER_URL = "https://mcp.linear.app"
const LEGACY_TOKENS: OAuthTokens = {
	access_token: "legacy-access-token",
	refresh_token: "legacy-refresh-token",
	token_type: "Bearer",
}

function seedLegacySecret(): string {
	const secret = JSON.stringify({
		"server-hash": {
			tokens: LEGACY_TOKENS,
			tokens_saved_at: 123,
			client_info: { client_id: "legacy-client" },
		},
	})
	mocks.state.secrets.set("mcpOAuthSecrets", secret)
	return secret
}

function createManager(): McpOAuthManager {
	return new McpOAuthManager(async () => "/tmp/makerrr-mcp-settings.json")
}

describe("McpOAuthManager credential persistence", () => {
	beforeEach(() => {
		vi.clearAllMocks()
		mocks.state.oauthStates.clear()
		mocks.state.secrets.clear()
		mocks.state.writeError = undefined
		mocks.state.skipWrite = false
	})

	it("verifies shared settings before deleting the legacy credential", async () => {
		seedLegacySecret()
		const provider = await createManager().getOrCreateProvider(SERVER_NAME, SERVER_URL)

		expect(await provider.tokens()).toEqual(LEGACY_TOKENS)
		expect(mocks.state.secrets.has("mcpOAuthSecrets")).toBe(false)
		expect(mocks.state.oauthStates.get(SERVER_NAME)).toMatchObject({
			tokens: LEGACY_TOKENS,
			clientInformation: { client_id: "legacy-client" },
			lastAuthenticatedAt: 123,
		})
	})

	it("retains the legacy credential when the shared settings write fails", async () => {
		const legacySecret = seedLegacySecret()
		mocks.state.writeError = new Error("disk full")

		await createManager().getOrCreateProvider(SERVER_NAME, SERVER_URL)

		expect(mocks.state.secrets.get("mcpOAuthSecrets")).toBe(legacySecret)
		expect(mocks.logger.warn).toHaveBeenCalledWith(expect.stringContaining("disk full"))
		expect(mocks.state.oauthStates.has(SERVER_NAME)).toBe(false)
	})

	it("retains the legacy credential when the durable readback does not contain the token", async () => {
		const legacySecret = seedLegacySecret()
		mocks.state.skipWrite = true

		await createManager().getOrCreateProvider(SERVER_NAME, SERVER_URL)

		expect(mocks.state.secrets.get("mcpOAuthSecrets")).toBe(legacySecret)
		expect(mocks.logger.warn).toHaveBeenCalledWith(expect.stringContaining("verification failed"))
	})

	it("prefers existing shared credentials and retires the legacy copy", async () => {
		const currentTokens = {
			access_token: "newer-shared-token",
			token_type: "Bearer",
		}
		seedLegacySecret()
		mocks.state.oauthStates.set(SERVER_NAME, { tokens: currentTokens })

		const provider = await createManager().getOrCreateProvider(SERVER_NAME, SERVER_URL)

		expect(await provider.tokens()).toEqual(currentTokens)
		expect(mocks.updateMcpServerOAuthStateAsync).not.toHaveBeenCalled()
		expect(mocks.state.secrets.has("mcpOAuthSecrets")).toBe(false)
	})

	it("rejects saveTokens when OAuth state cannot be persisted", async () => {
		const provider = await createManager().getOrCreateProvider(SERVER_NAME, SERVER_URL)
		mocks.state.writeError = new Error("disk full")

		await expect(
			provider.saveTokens({
				access_token: "new-access-token",
				refresh_token: "new-refresh-token",
				token_type: "Bearer",
			}),
		).rejects.toThrow("disk full")
	})

	it("rejects credential invalidation when OAuth state cannot be persisted", async () => {
		const provider = await createManager().getOrCreateProvider(SERVER_NAME, SERVER_URL)
		mocks.state.writeError = new Error("read-only settings file")

		if (typeof provider.invalidateCredentials !== "function") {
			throw new Error("OAuth provider does not expose credential invalidation")
		}
		await expect(provider.invalidateCredentials("tokens")).rejects.toThrow("read-only settings file")
	})

	it("rejects server-auth clearing when OAuth state cannot be persisted", async () => {
		const manager = createManager()
		mocks.state.writeError = new Error("read-only settings file")

		await expect(manager.clearServerAuth(SERVER_NAME, SERVER_URL)).rejects.toThrow("read-only settings file")
	})
})
