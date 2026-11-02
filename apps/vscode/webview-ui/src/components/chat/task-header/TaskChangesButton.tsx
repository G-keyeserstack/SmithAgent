import { EmptyRequest } from "@shared/proto/cline/common"
import { GitCompareIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { CheckpointsServiceClient } from "@/services/grpc-client"

interface TaskChangesButtonProps {
	enabled: boolean
	refreshKey: string
}

/**
 * Keeps the task's checkpoint diff reachable from the Composer header, not
 * only from the final completion message. The host remains authoritative for
 * whether a checkpoint exists and how many files differ.
 */
export function TaskChangesButton({ enabled, refreshKey }: TaskChangesButtonProps) {
	const [changedFiles, setChangedFiles] = useState(0)
	const [checking, setChecking] = useState(false)
	const [opening, setOpening] = useState(false)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		if (!enabled) {
			setChangedFiles(0)
			return
		}
		let cancelled = false
		setChecking(true)
		setError(null)
		CheckpointsServiceClient.checkpointLatestChangesCount(EmptyRequest.create({}))
			.then((result) => {
				if (!cancelled) setChangedFiles(Math.max(0, result.value ?? 0))
			})
			.catch((cause) => {
				if (!cancelled) {
					setChangedFiles(0)
					setError(cause instanceof Error ? cause.message : "Could not check workspace changes")
				}
			})
			.finally(() => {
				if (!cancelled) setChecking(false)
			})
		return () => {
			cancelled = true
		}
	}, [enabled, refreshKey])

	if (!enabled || changedFiles === 0) return null

	const openChanges = async () => {
		if (opening) return
		setOpening(true)
		setError(null)
		try {
			await CheckpointsServiceClient.checkpointViewLatestChanges(EmptyRequest.create({}))
		} catch (cause) {
			const message = cause instanceof Error ? cause.message : "Could not open the change review"
			setError(message)
			console.error("Failed to open Makerrr task changes:", cause)
		} finally {
			setOpening(false)
		}
	}

	return (
		<div className="inline-flex shrink-0 flex-col items-end">
			<button
				aria-label={`Review changes in ${changedFiles} files`}
				className="inline-flex items-center gap-1 rounded-full border border-link/30 bg-link/10 px-2 py-0.5 text-xs text-link hover:bg-link/20 disabled:cursor-wait disabled:opacity-60"
				disabled={opening || checking}
				onClick={() => void openChanges()}
				title="Open the multi-file diff from the latest checkpoint"
				type="button">
				<GitCompareArrows aria-hidden="true" className="size-3" />
				{opening ? "Opening…" : `Review ${changedFiles} ${changedFiles === 1 ? "file" : "files"}`}
			</button>
			{error && <span className="mt-1 max-w-48 text-right text-[10px] text-error" role="alert">{error}</span>}
		</div>
	)
}
