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
\tCodeSearchResponse,
\tCodeSearchResult,
\tEmbeddingProvider,
\tRepositoryMap,
\tRepositoryMapOptions,
\tSemanticSearchOptions,
} from "./repository-intelligence";
export { buildRepositoryMap, searchWorkspaceCode } from "./repository-intelligence";
