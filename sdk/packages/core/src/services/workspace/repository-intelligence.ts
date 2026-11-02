import { readFile } from "node:fs/promises";
import path from "node:path";
import { getFileIndex } from "./file-indexer";

const MAX_FILES = 1_200;
const MAX_FILE_BYTES = 256 * 1024;
const MAX_CHUNKS = 2_000;
const CHUNK_LINES = 80;
const CHUNK_OVERLAP = 12;
const IGNORED_SEGMENTS = new Set([
	".git",
	".makerrr",
	".vscode-test",
	"node_modules",
	"vendor",
	"dist",
	"build",
	"coverage",
	".next",
	".turbo",
	".cache",
	"target",
]);
const SENSITIVE_FILE = /(^|\/)(\.env(?:\..*)?|.*\.(?:pem|key|p12|pfx)|credentials?\.(?:json|ya?ml)|secrets?\.(?:json|ya?ml))$/i;
const TEXT_FILE = /\.(?:[cm]?[jt]sx?|jsonc?|ya?ml|toml|mdx?|py|go|rs|java|kt|swift|c|h|cc|cpp|cs|rb|php|sh|bash|zsh|sql|graphql|proto|html|css|scss|vue|svelte)$/i;
const LANGUAGE_BY_EXTENSION: Record<string, string> = {
	".ts": "TypeScript", ".tsx": "TypeScript", ".js": "JavaScript",
	".jsx": "JavaScript", ".mjs": "JavaScript", ".cjs": "JavaScript",
	".py": "Python", ".go": "Go", ".rs": "Rust", ".java": "Java",
	".kt": "Kotlin", ".swift": "Swift", ".c": "C", ".h": "C/C++",
	".cc": "C++", ".cpp": "C++", ".cs": "C#", ".rb": "Ruby",
	".php": "PHP", ".sh": "Shell", ".sql": "SQL", ".vue": "Vue",
	".svelte": "Svelte", ".html": "HTML", ".css": "CSS", ".scss": "SCSS",
	".md": "Markdown", ".mdx": "Markdown", ".json": "JSON", ".yaml": "YAML",
	".yml": "YAML", ".toml": "TOML",
};

function isIndexable(relativePath: string): boolean {
	const normalized = relativePath.replace(/\\/g, "/");
	const segments = normalized.split("/");
	return (
		!SENSITIVE_FILE.test(normalized) &&
		!segments.some((segment) => IGNORED_SEGMENTS.has(segment)) &&
		(TEXT_FILE.test(normalized) ||
			["README", "LICENSE", "Makefile", "Dockerfile"].includes(path.basename(normalized)))
	);
}

function safeWorkspacePath(cwd: string, relativePath: string): string | null {
	const absolute = path.resolve(cwd, relativePath);
	const relative = path.relative(cwd, absolute);
	if (relative === "" || relative.startsWith("..") || path.isAbsolute(relative)) {
		return null;
	}
	return absolute;
}

function summarizeDirectory(files: string[]): string[] {
	const directories = new Map<string, number>();
	for (const file of files) {
		const parent = path.posix.dirname(file);
		if (parent === ".") continue;
		const topLevel = parent.split("/").slice(0, 2).join("/");
		directories.set(topLevel, (directories.get(topLevel) ?? 0) + 1);
	}
	return [...directories.entries()]
		.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
		.slice(0, 80)
		.map(([directory, count]) => `${directory}/ (${count} files)`);
}

function extractImports(content: string): string[] {
	const matches = content.matchAll(
		/(?:from\s*|import\s*\(|require\s*\()(["'])(\.{1,2}\/[^"']+)\1/g,
	);
	return [...new Set([...matches].map((match) => match[2]))].slice(0, 40);
}

export interface RepositoryMap {
	workspace: string;
	generatedAt: number;
	fileCount: number;
	languages: Array<{ language: string; files: number }>;
	directories: string[];
	entryPoints: string[];
	files: Array<{ path: string; language: string; imports: string[] }>;
}

export interface RepositoryMapOptions {
	maxFiles?: number;
	maxChunks?: number;
}

export async function buildRepositoryMap(
	cwd: string,
	options: RepositoryMapOptions = {},
): Promise<RepositoryMap> {
	const maxFiles = Math.max(1, Math.min(options.maxFiles ?? MAX_FILES, MAX_FILES));
	const indexed = await getFileIndex(cwd);
	const files = [...indexed].filter(isIndexable).sort().slice(0, maxFiles);
	const languageCounts = new Map<string, number>();
	const mappedFiles: RepositoryMap["files"] = [];
	const entryPoints: string[] = [];

	for (const relativePath of files) {
		const absolutePath = safeWorkspacePath(cwd, relativePath);
		if (!absolutePath) continue;
		const extension = path.extname(relativePath).toLowerCase();
		const language = LANGUAGE_BY_EXTENSION[extension] ?? "Text";
		languageCounts.set(language, (languageCounts.get(language) ?? 0) + 1);
		if (
			/^(?:README(?:\.[^/]*)?|package\.json|pyproject\.toml|Cargo\.toml|go\.mod|pom\.xml|Makefile|Dockerfile)$/i.test(
				path.basename(relativePath),
			)
		) {
			entryPoints.push(relativePath);
		}
		let imports: string[] = [];
		if (TEXT_FILE.test(relativePath) && !SENSITIVE_FILE.test(relativePath)) {
			try {
				const content = await readFile(absolutePath, "utf8");
				if (Buffer.byteLength(content, "utf8") <= MAX_FILE_BYTES && !content.includes("\0")) {
					imports = extractImports(content);
				}
			} catch {
				// Files can disappear or become unreadable while the workspace is changing.
			}
		}
		mappedFiles.push({ path: relativePath, language, imports });
	}

	return {
		workspace: path.basename(path.resolve(cwd)),
		generatedAt: Date.now(),
		fileCount: mappedFiles.length,
		languages: [...languageCounts.entries()]
			.map(([language, count]) => ({ language, files: count }))
			.sort((a, b) => b.files - a.files || a.language.localeCompare(b.language)),
		directories: summarizeDirectory(mappedFiles.map((file) => file.path)),
		entryPoints: entryPoints.sort(),
		files: mappedFiles,
	};
}

export interface EmbeddingProvider {
	/** Stable identifier used by callers to namespace any persisted embedding cache. */
	id: string;
	/** Return one finite, non-empty vector for each supplied text, in the same order. */
	embed(texts: string[]): Promise<number[][]>;
}

export interface SemanticSearchOptions {
	embeddingProvider?: EmbeddingProvider;
	topK?: number;
	maxFiles?: number;
}

export interface CodeSearchResult {
	path: string;
	startLine: number;
	endLine: number;
	snippet: string;
	score: number;
}

export interface CodeSearchResponse {
	mode: "semantic" | "lexical";
	provider?: string;
	results: CodeSearchResult[];
}

interface CodeChunk {
	path: string;
	startLine: number;
	endLine: number;
	text: string;
}

function chunkFile(relativePath: string, content: string): CodeChunk[] {
	const lines = content.split(/\r?\n/);
	const chunks: CodeChunk[] = [];
	for (let start = 0; start < lines.length; start += CHUNK_LINES - CHUNK_OVERLAP) {
		const end = Math.min(lines.length, start + CHUNK_LINES);
		const text = lines.slice(start, end).join("\n").trim();
		if (text) chunks.push({ path: relativePath, startLine: start + 1, endLine: end, text });
		if (end === lines.length) break;
	}
	return chunks;
}

function lexicalScore(query: string, content: string): number {
	const terms = [...new Set(query.toLowerCase().match(/[a-z0-9_]{2,}/g) ?? [])];
	if (terms.length === 0) return 0;
	const haystack = content.toLowerCase();
	const matched = terms.filter((term) => haystack.includes(term)).length;
	return matched / terms.length;
}

function cosineSimilarity(left: number[], right: number[]): number {
	if (left.length === 0 || left.length !== right.length) return 0;
	let dot = 0;
	let leftNorm = 0;
	let rightNorm = 0;
	for (let i = 0; i < left.length; i++) {
		const a = left[i];
		const b = right[i];
		if (!Number.isFinite(a) || !Number.isFinite(b)) return 0;
		dot += a * b;
		leftNorm += a * a;
		rightNorm += b * b;
	}
	return leftNorm === 0 || rightNorm === 0 ? 0 : dot / Math.sqrt(leftNorm * rightNorm);
}

async function readCodeChunks(cwd: string, maxFiles: number, maxChunks = MAX_CHUNKS): Promise<CodeChunk[]> {
	const boundedMaxChunks = Math.max(1, Math.min(maxChunks, MAX_CHUNKS))
	const indexed = await getFileIndex(cwd);
	const candidates = [...indexed].filter(isIndexable).sort().slice(0, maxFiles);
	const chunks: CodeChunk[] = [];
	for (const relativePath of candidates) {
		const absolutePath = safeWorkspacePath(cwd, relativePath);
		if (!absolutePath) continue;
		try {
			const content = await readFile(absolutePath, "utf8");
			if (Buffer.byteLength(content, "utf8") > MAX_FILE_BYTES || content.includes("\0")) continue;
			chunks.push(...chunkFile(relativePath, content));
			if (chunks.length >= boundedMaxChunks) break;
		} catch {
			// Ignore files removed or made unreadable during indexing.
		}
	}
	return chunks.slice(0, boundedMaxChunks);
}

/**
 * Searches workspace code. Supply an embedding provider for semantic ranking;
 * without one, the same bounded chunks are ranked by lexical term overlap.
 * Embeddings are deliberately injected so hosts can use local models or any
 * OpenAI-compatible/Kimi/GLM endpoint without coupling core to a vendor.
 */
export async function searchWorkspaceCode(
	cwd: string,
	query: string,
	options: SemanticSearchOptions = {},
): Promise<CodeSearchResponse> {
	const normalizedQuery = query.trim();
	if (!normalizedQuery) return { mode: options.embeddingProvider ? "semantic" : "lexical", results: [] };
	const topK = Math.max(1, Math.min(options.topK ?? 10, 50));
	const chunks = await readCodeChunks(
		cwd,
		Math.max(1, Math.min(options.maxFiles ?? MAX_FILES, MAX_FILES)),
		options.maxChunks,
	);
	if (chunks.length === 0) return { mode: options.embeddingProvider ? "semantic" : "lexical", results: [] };

	if (options.embeddingProvider) {
		const vectors = await options.embeddingProvider.embed([
			normalizedQuery,
			...chunks.map((chunk) => chunk.text),
		]);
		if (
			vectors.length !== chunks.length + 1 ||
			vectors.some((vector) => !Array.isArray(vector) || vector.length === 0)
		) {
			throw new Error("Embedding provider returned an invalid vector batch");
		}
		const queryVector = vectors[0];
		const results = chunks.map((chunk, index) => ({
			path: chunk.path,
			startLine: chunk.startLine,
			endLine: chunk.endLine,
			snippet: chunk.text,
			score: cosineSimilarity(queryVector, vectors[index + 1]),
		}));
		return {
			mode: "semantic",
			provider: options.embeddingProvider.id,
			results: results.sort((a, b) => b.score - a.score).slice(0, topK),
		};
	}

	return {
		mode: "lexical",
		results: chunks
			.map((chunk) => ({
				path: chunk.path,
				startLine: chunk.startLine,
				endLine: chunk.endLine,
				snippet: chunk.text,
				score: lexicalScore(normalizedQuery, chunk.text),
			}))
			.filter((result) => result.score > 0)
			.sort((a, b) => b.score - a.score)
			.slice(0, topK),
	};
}
