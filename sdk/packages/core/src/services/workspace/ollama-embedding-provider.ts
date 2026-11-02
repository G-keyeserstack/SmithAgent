import type { EmbeddingProvider } from "./repository-intelligence"

export interface OllamaEmbeddingProviderOptions {
	baseUrl: string
	model?: string
	batchSize?: number
	timeoutMs?: number
	fetchImpl?: typeof fetch
}

const DEFAULT_MODEL = "qwen3-embedding:0.6b"
const DEFAULT_BATCH_SIZE = 32
const DEFAULT_TIMEOUT_MS = 45_000

function normalizeBaseUrl(baseUrl: string): string {
	const parsed = new URL(baseUrl)
	if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
		throw new Error("Ollama embedding endpoint must use HTTP or HTTPS")
	}
	if (parsed.username || parsed.password) {
		throw new Error("Ollama embedding endpoint must not contain credentials")
	}
	return parsed.toString().replace(/\/$/, "")
}

/**
 * Local Qwen3 embedding adapter for repository retrieval.
 *
 * It never downloads a model. The selected Ollama model must already be
 * installed; callers can fall back to lexical retrieval when it is absent.
 */
export class OllamaEmbeddingProvider implements EmbeddingProvider {
	readonly id: string
	private readonly baseUrl: string
	private readonly model: string
	private readonly batchSize: number
	private readonly timeoutMs: number
	private readonly fetchImpl: typeof fetch

	constructor(options: OllamaEmbeddingProviderOptions) {
		this.baseUrl = normalizeBaseUrl(options.baseUrl)
		this.model = options.model ?? DEFAULT_MODEL
		this.batchSize = Math.max(1, Math.min(options.batchSize ?? DEFAULT_BATCH_SIZE, 128))
		this.timeoutMs = Math.max(1_000, Math.min(options.timeoutMs ?? DEFAULT_TIMEOUT_MS, 120_000))
		this.fetchImpl = options.fetchImpl ?? fetch
		this.id = "ollama:" + this.model
	}

	async embed(texts: string[]): Promise<number[][]> {
		if (texts.length === 0) return []
		const embeddings: number[][] = []
		for (let start = 0; start < texts.length; start += this.batchSize) {
			const batch = texts.slice(start, start + this.batchSize)
			const response = await this.fetchImpl(this.baseUrl + "/api/embed", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ model: this.model, input: batch, truncate: true }),
				signal: AbortSignal.timeout(this.timeoutMs),
			})
			if (!response.ok) {
				throw new Error("Ollama embedding request failed with HTTP " + response.status)
			}
			const payload = (await response.json()) as { embeddings?: unknown }
			if (
				!Array.isArray(payload.embeddings) ||
				payload.embeddings.length !== batch.length ||
				payload.embeddings.some(
					(vector) =>
						!Array.isArray(vector) ||
						vector.length === 0 ||
						vector.some((value) => typeof value !== "number" || !Number.isFinite(value)),
				)
			) {
				throw new Error("Ollama returned an invalid embedding batch")
			}
			embeddings.push(...(payload.embeddings as number[][]))
		}
		return embeddings
	}
}
