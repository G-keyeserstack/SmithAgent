export { ensureAgentSchedulesWorkspace } from "./agent-schedules-workspace";
export { ensureChatWorkspace } from "./chat-workspace";
export type { FastFileIndexOptions } from "./file-indexer";
export { getFileIndex, prewarmFileIndex } from "./file-indexer";
export type {
	MentionEnricherOptions,
	MentionEnrichmentResult,
} from "./mention-enricher";
export { enrichPromptWithMentions } from "./mention-enricher";

export type {
	CodeSearchResponse,
	CodeSearchResult,
	EmbeddingProvider,
	RepositoryMap,
	RepositoryMapOptions,
	SemanticSearchOptions,
} from "./repository-intelligence";
export { buildRepositoryMap, searchWorkspaceCode } from "./repository-intelligence";
export { OllamaEmbeddingProvider, type OllamaEmbeddingProviderOptions } from "./ollama-embedding-provider";
