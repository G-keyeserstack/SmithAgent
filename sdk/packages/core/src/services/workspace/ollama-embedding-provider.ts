import { createHash } from "node:crypto";
import type { EmbeddingProvider } from "./repository-intelligence";

export interface OllamaEmbeddingProviderOptions {
	baseUrl: string;
	apiKey?: string;
	model?: string;
	batchSize?: number;
	timeoutMs?: number;
	maxCacheEntries?: number;
	fetchImpl?: typeof fetch;
}

const DEFAULT_MODEL = "qwen3-embedding:0.6b";
const DEFAULT_BATCH_SIZE = 32;
const DEFAULT_TIMEOUT_MS = 45_000;
const DEFAULT_MAX_CACHE_ENTRIES = 5_000;

function normalizeBaseUrl(baseUrl: string): string {
	const parsed = new URL(baseUrl);
	if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
		throw new Error("Ollama embedding endpoint must use HTTP or HTTPS");
	}
	if (parsed.username || parsed.password) {
		throw new Error("Ollama embedding endpoint must not contain credentials");
	}
	parsed.pathname = parsed.pathname.replace(/\/v1\/?$/, "") || "/";
	return parsed.toString().replace(/\/$/, "");
}

/**
 * Local Qwen3 embedding adapter for repository retrieval.
 *
 * It never downloads a model. The selected Ollama model must already be
 * installed; callers can fall back to lexical retrieval when it is absent.
 * Embeddings are cached in memory by content hash, so unchanged chunks are
 * not re-embedded during the current application session.
 */
export class OllamaEmbeddingProvider implements EmbeddingProvider {
	readonly id: string;
	private readonly baseUrl: string;
	private readonly model: string;
	private readonly apiKey?: string;
	private readonly batchSize: number;
	private readonly timeoutMs: number;
	private readonly maxCacheEntries: number;
	private readonly fetchImpl: typeof fetch;
	private readonly cache = new Map<string, number[]>();

	constructor(options: OllamaEmbeddingProviderOptions) {
		this.baseUrl = normalizeBaseUrl(options.baseUrl);
		this.model = options.model ?? DEFAULT_MODEL;
		this.apiKey = options.apiKey;
		this.batchSize = Math.max(1, Math.min(options.batchSize ?? DEFAULT_BATCH_SIZE, 128));
		this.timeoutMs = Math.max(1_000, Math.min(options.timeoutMs ?? DEFAULT_TIMEOUT_MS, 120_000));
		this.maxCacheEntries = Math.max(1, Math.min(options.maxCacheEntries ?? DEFAULT_MAX_CACHE_ENTRIES, 50_000));
		this.fetchImpl = options.fetchImpl ?? fetch;
		this.id = "ollama:" + this.model;
	}

	private cacheKey(text: string): string {
		return createHash("sha256").update(text).digest("hex");
	}

	private remember(key: string, vector: number[]): void {
		this.cache.delete(key);
		this.cache.set(key, vector);
		while (this.cache.size > this.maxCacheEntries) {
			const oldestKey = this.cache.keys().next().value;
			if (oldestKey === undefined) break;
			this.cache.delete(oldestKey);
		}
	}

	async embed(texts: string[]): Promise<number[][]> {
		if (texts.length === 0) return [];

		const keys = texts.map((text) => this.cacheKey(text));
		const missing = new Map<string, string>();
		for (let index = 0; index < texts.length; index++) {
			const key = keys[index];
			if (key !== undefined && !this.cache.has(key)) {
				missing.set(key, texts[index] ?? "");
			}
		}

		const missingEntries = [...missing.entries()];
		for (let start = 0; start < missingEntries.length; start += this.batchSize) {
			const batch = missingEntries.slice(start, start + this.batchSize);
			const headers: Record<string, string> = { "Content-Type": "application/json" };
			if (this.apiKey) headers.Authorization = "Bearer " + this.apiKey;
			const response = await this.fetchImpl(this.baseUrl + "/api/embed", {
				method: "POST",
				headers,
				body: JSON.stringify({
					model: this.model,
					input: batch.map(([, text]) => text),
					truncate: true,
				}),
				redirect: "error",
				signal: AbortSignal.timeout(this.timeoutMs),
			});
			if (!response.ok) {
				throw new Error("Ollama embedding request failed with HTTP " + response.status);
			}

			const payload = (await response.json()) as { embeddings?: unknown };
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
				throw new Error("Ollama returned an invalid embedding batch");
			}

			for (let index = 0; index < batch.length; index++) {
				const key = batch[index]?.[0];
				const vector = payload.embeddings[index] as number[];
				if (key !== undefined) this.remember(key, vector);
			}
		}

		return keys.map((key) => this.cache.get(key) ?? []);
	}
}
