import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import type { ClineMessage } from "@shared/ExtensionMessage"
import SubagentStatusRow from "./SubagentStatusRow"

describe("SubagentStatusRow", () => {
	it("shows per-agent input, output, context and cost while the agent runs", () => {
		const message = {
			ts: 1,
			say: "subagent_status",
			text: JSON.stringify({
				status: "running",
				items: [
					{
						index: 1,
						prompt: "Inspect authentication and token refresh flows",
						status: "running",
						toolCalls: 3,
						inputTokens: 1_200,
						outputTokens: 400,
						totalCost: 0.04,
						contextTokens: 1_600,
						contextWindow: 128_000,
						contextUsagePercentage: 1.25,
					},
				],
			}),
		} as ClineMessage

		render(<SubagentStatusRow message={message} isLast />)

		expect(screen.getByText("Makerrr Bot wants to delegate to a subagent:")).toBeTruthy()
		expect(
			screen.getByText("3 tools · 1,200 input / 400 output · 1,600 context · $0.04"),
		).toBeTruthy()
	})
})
