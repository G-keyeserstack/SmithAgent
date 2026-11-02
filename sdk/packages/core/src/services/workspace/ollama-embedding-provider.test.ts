import { describe, expect, it, vi } from "vitest"
import { OllamaEmbeddingProvider } from "./ollama-embedding-provider"

describe("OllamaEmbeddingProvider", () => {
	it("embeds in bounded batches and preserves input order", async () => {
		const fetchImpl = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
			const body = JSON.parse(String(init?.body)) as { model: string; input: string[] }
			return new Response(JSON.stringify({
				embeddings: body.input.map((text) => [text.length, 1]),
			}), { status: 200 })
		})
		const provider = new OllamaEmbeddingProvider({
			baseUrl: "http://localhost:11434/",
			batchSize: 16,
			fetchImpl: fetchImpl as typeof fetch,
		})

		const texts = Array.from({ length: 33 }, (_, index) => "chunk-" + index)
		const vectors = await provider.embed(texts)

		expect(provider.id).toBe("ollama:qwen3-embedding:0.6b")
		expect(fetchImpl).toHaveBeenCalledTimes(3)
		expect(vectors).toHaveLength(33)
		expect(vectors[0]?.[0]).toBe(texts[0].length)
		expect(vectors[32]?.[0]).toBe(texts[32].length)
		const firstRequest = JSON.parse(String(fetchImpl.mock.calls[0]?.[1]?.body)) as { model: string; input: string[] }
		expect(firstRequest.model).toBe("qwen3-embedding:0.6b")
		expect(firstRequest.input).toHaveLength(16)
	})

	it("rejects non-HTTP endpoints and URLs containing credentials", () => {
		expect(() => new OllamaEmbeddingProvider({ baseUrl: "file:///tmp/ollama" })).toThrow("HTTP or HTTPS")
		expect(() => new OllamaEmbeddingProvider({ baseUrl: "http://user:pass@localhost:11434" })).toThrow("must not contain credentials")
	})

	it("surfaces missing-model and endpoint errors without exposing response bodies", async () => {
		const fetchImpl = vi.fn(async () => new Response("sensitive server response", { status: 404 }))
		const provider = new OllamaEmbeddingProvider({
			baseUrl: "http://localhost:11434",
			fetchImpl: fetchImpl as typeof fetch,
		})
		await expect(provider.embed(["query"])).rejects.toThrow("HTTP 404")
	})

	it("rejects malformed vector payloads", async () => {
		const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ embeddings: [[1], []] }), { status: 200 }))
		const provider = new OllamaEmbeddingProvider({
			baseUrl: "http://localhost:11434",
			fetchImpl: fetchImpl as typeof fetch,
		})
		await expect(provider.embed(["query"])).rejects.toThrow("invalid embedding batch")
	})
})
