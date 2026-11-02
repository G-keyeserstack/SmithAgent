import { render, screen } from "@testing-library/react"
import type { ClineMessage } from "@shared/ExtensionMessage"
import { describe, expect, it } from "vitest"
import SubagentStatusRow from "./SubagentStatusRow"

function createSubagentPromptMessage(prompts: string[]): ClineMessage {
	return {
		ts: 1,
		ask: "use_subagents",
		text: JSON.stringify({ prompts }),
	} as ClineMessage
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

	it("reports malformed subagent updates without crashing", () => {
		render(<SubagentStatusRow isLast message={{ ts: 2, ask: "use_subagents", text: "{" } as ClineMessage} />)

		expect(screen.getByText("Subagent status update unavailable.")).toBeTruthy()
	})
})
