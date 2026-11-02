import { fireEvent, render, screen } from "@testing-library/react"
import type { ClineMessage, ClineSaySubagentStatus } from "@shared/ExtensionMessage"
import { describe, expect, it } from "vitest"
import SubagentStatusRow from "./SubagentStatusRow"

function createSubagentPromptMessage(prompts: string[]): ClineMessage {
	return {
		ts: 1,
		ask: "use_subagents",
		text: JSON.stringify({ prompts }),
	} as ClineMessage
}

function createSubagentStatusMessage(status: ClineSaySubagentStatus): ClineMessage {
	return {
		ts: 2,
		say: "subagent",
		text: JSON.stringify(status),
	} as ClineMessage
}

function createStatusItem(overrides: Partial<ClineSaySubagentStatus["items"][number]> = {}) {
	return {
		index: 1,
		prompt: "Review the API contract",
		status: "running" as const,
		toolCalls: 3,
		inputTokens: 1200,
		outputTokens: 450,
		totalCost: 0.0125,
		contextTokens: 1650,
		contextWindow: 32000,
		contextUsagePercentage: 5.2,
		...overrides,
	}
}

function createStatus(items: ClineSaySubagentStatus["items"], status: ClineSaySubagentStatus["status"] = "running"): ClineSaySubagentStatus {
	return {
		status,
		total: items.length,
		completed: items.filter((item) => item.status === "completed").length,
		successes: items.filter((item) => item.status === "completed").length,
		failures: items.filter((item) => item.status === "failed").length,
		toolCalls: items.reduce((total, item) => total + item.toolCalls, 0),
		inputTokens: items.reduce((total, item) => total + item.inputTokens, 0),
		outputTokens: items.reduce((total, item) => total + item.outputTokens, 0),
		contextWindow: 32000,
		maxContextTokens: 32000,
		maxContextUsagePercentage: 5.2,
		items,
	}
}

describe("SubagentStatusRow Makerrr Bot identity", () => {
	it("identifies Makerrr Bot when delegating one subagent task", () => {
		render(<SubagentStatusRow isLast message={createSubagentPromptMessage(["Review the API contract"])} />)
		expect(screen.getByText("Makerrr Bot wants to delegate to a subagent:")).toBeTruthy()
		expect(screen.getByText('"Review the API contract"')).toBeTruthy()
	})

	it("identifies Makerrr Bot when delegating parallel subagent tasks", () => {
		render(
			<SubagentStatusRow
				isLast
				message={createSubagentPromptMessage(["Implement the endpoint", "Write regression tests"])}
			/>,
		)
		expect(screen.getByText("Makerrr Bot wants to delegate to subagents:")).toBeTruthy()
		expect(screen.getByText('"Implement the endpoint"')).toBeTruthy()
		expect(screen.getByText('"Write regression tests"')).toBeTruthy()
	})

	it("shows live per-agent tool, token, cost and latest-action usage", () => {
		const item = createStatusItem({ latestToolCall: "Editing src/api.ts" })
		render(<SubagentStatusRow isLast message={createSubagentStatusMessage(createStatus([item]))} />)
		expect(screen.getByText("3 tools called · 1,650 tokens · $0.0125")).toBeTruthy()
		expect(screen.getByText("Editing src/api.ts")).toBeTruthy()
	})

	it("expands completed agent output for review", () => {
		const item = createStatusItem({ status: "completed", result: "Added API contract regression coverage." })
		render(<SubagentStatusRow isLast message={createSubagentStatusMessage(createStatus([item], "completed"))} />)
		fireEvent.click(screen.getByRole("button", { name: "Show subagent output" }))
		expect(screen.getByText("Added API contract regression coverage.")).toBeTruthy()
		expect(screen.getByRole("button", { name: "Hide subagent output" })).toBeTruthy()
	})

	it("shows a failed agent's error without presenting it as a successful result", () => {
		const item = createStatusItem({ status: "failed", error: "Permission denied for src/secrets.ts" })
		render(<SubagentStatusRow isLast message={createSubagentStatusMessage(createStatus([item], "failed"))} />)
		fireEvent.click(screen.getByRole("button", { name: "Show subagent output" }))
		expect(screen.getByText("Permission denied for src/secrets.ts")).toBeTruthy()
		expect(screen.queryByText("Added API contract regression coverage.")).toBeNull()
	})

	it("preserves the main-branch live usage contract", () => {
		const message = {
			ts: 3,
			say: "subagent_status",
			text: JSON.stringify({
				status: "running",
				items: [{
					index: 1,
					prompt: "Inspect authentication and token refresh flows",
					status: "running",
					toolCalls: 3,
					inputTokens: 1200,
					outputTokens: 400,
					totalCost: 0.04,
					contextTokens: 1600,
					contextWindow: 128000,
					contextUsagePercentage: 1.25,
				}],
			}),
		} as ClineMessage
		render(<SubagentStatusRow message={message} isLast />)
		expect(screen.getByText("Makerrr Bot wants to delegate to a subagent:")).toBeTruthy()
		expect(screen.getByText("3 tools called · 1,600 tokens · $0.04")).toBeTruthy()
	})

	it("reports malformed subagent messages without crashing", () => {
		render(<SubagentStatusRow isLast message={{ ts: 4, ask: "use_subagents", text: "{" } as ClineMessage} />)
		expect(screen.getByText("Subagent status update unavailable.")).toBeTruthy()
})
