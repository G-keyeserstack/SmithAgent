import { formatLargeNumber } from "@/utils/format"

export interface MakerrrUsageMeterProps {
	inputTokens: number
	outputTokens: number
	cacheReadTokens?: number
	cacheWriteTokens?: number
	costUsd?: number
	costKind?: "estimated" | "cloud-reported"
	provider?: string
	model?: string
	contextTokens?: number
	contextWindow?: number
}

/**
 * Live, task-scoped usage disclosure. Input tokens already include cached
 * prompt tokens in the normalized provider metrics, so cache counts are
 * shown as informational subsets and are not added to the total.
 */
export function MakerrrUsageMeter({
	inputTokens,
	outputTokens,
	cacheReadTokens = 0,
	cacheWriteTokens = 0,
	costUsd,
	costKind = "estimated",
	provider,
	model,
	contextTokens = 0,
	contextWindow = 0,
}: MakerrrUsageMeterProps) {
	const totalTokens = Math.max(0, inputTokens) + Math.max(0, outputTokens)
	const hasTokens = totalTokens > 0
	const hasCost = typeof costUsd === "number" && Number.isFinite(costUsd) && costUsd >= 0
	const hasContext = contextTokens > 0 && contextWindow > 0
	const contextPercentage = hasContext ? Math.min(100, (contextTokens / contextWindow) * 100) : 0

	if (!hasTokens && !hasCost) {
		return null
	}

	return (
		<details className="group relative inline-flex shrink-0 text-xs" data-testid="makerrr-usage-meter">
			<summary
				aria-label="View live Makerrr task usage"
				className="inline-flex cursor-pointer list-none items-center gap-1 rounded-full border border-badge-foreground/20 bg-badge-foreground/10 px-2 py-0.5 text-foreground hover:bg-badge-foreground/20 [&::-webkit-details-marker]:hidden">
				<span aria-hidden="true" className="codicon codicon-pulse text-[11px]" />
				{hasTokens && <span className="font-mono tabular-nums">{formatLargeNumber(totalTokens)} tokens</span>}
				{hasCost && (
					<span className="font-mono tabular-nums">
						{costKind === "cloud-reported" ? "· " : "· est. "}${costUsd.toFixed(4)}
					</span>
				)}
			</summary>
			<div className="absolute right-0 top-full z-50 mt-1 min-w-52 rounded-sm border border-border-panel bg-menu p-2 shadow-lg">
				<div className="mb-2 flex items-center justify-between gap-3 font-semibold">
					<span>Task usage</span>
					<span className="text-[10px] font-normal text-description">Updates as the agent runs</span>
				</div>
				<div className="mb-2 space-y-1 text-[11px] text-description">
					{provider && <div className="flex justify-between gap-4"><span>Provider</span><span className="max-w-36 truncate font-mono text-foreground">{provider}</span></div>}
					{model && <div className="flex justify-between gap-4"><span>Model</span><span className="max-w-36 truncate font-mono text-foreground">{model}</span></div>}
					{hasContext && <div className="flex justify-between gap-4"><span>Context used</span><span className="font-mono text-foreground">{formatLargeNumber(contextTokens)} / {formatLargeNumber(contextWindow)} ({contextPercentage.toFixed(1)}%)</span></div>}
				</div>
				<div className="space-y-1 font-mono tabular-nums">
					<div className="flex justify-between gap-4"><span>Input</span><span>{formatLargeNumber(inputTokens)}</span></div>
					<div className="flex justify-between gap-4"><span>Output</span><span>{formatLargeNumber(outputTokens)}</span></div>
					{cacheReadTokens > 0 && <div className="flex justify-between gap-4 text-description"><span>Cache reads (included in input)</span><span>{formatLargeNumber(cacheReadTokens)}</span></div>}
					{cacheWriteTokens > 0 && <div className="flex justify-between gap-4 text-description"><span>Cache writes</span><span>{formatLargeNumber(cacheWriteTokens)}</span></div>}
				</div>
				{hasCost && (
					<div className="mt-2 border-t border-border-panel pt-2">
						<div className="flex justify-between gap-4 font-semibold">
							<span>{costKind === "cloud-reported" ? "Cloud-reported usage" : "Estimated API cost"}</span>
							<span className="font-mono tabular-nums">${costUsd.toFixed(4)} USD</span>
						</div>
						{costKind === "estimated" && <p className="mt-1 text-[10px] leading-snug text-description">Estimate based on the provider's published model rates; it may differ from your provider invoice.</p>}
					</div>
				)}
			</div>
		</details>
	)
}
