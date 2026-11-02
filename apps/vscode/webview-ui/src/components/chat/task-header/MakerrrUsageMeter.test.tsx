import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { MakerrrUsageMeter } from "./MakerrrUsageMeter"

describe("MakerrrUsageMeter", () => {
	it("shows live token totals without inventing a cost for subscription or local models", () => {
		render(<MakerrrUsageMeter inputTokens={1200} outputTokens={300} cacheReadTokens={400} />)
		expect(screen.getByTestId("makerrr-usage-meter").textContent).toContain("1.5K tokens")
		expect(screen.getByText("Cache reads (included in input)")).toBeTruthy()
		expect(screen.queryByText(/USD/)).toBeNull()
	})

	it("labels provider-rate estimates distinctly from cloud-reported usage", () => {
		const { rerender } = render(
			<MakerrrUsageMeter inputTokens={100} outputTokens={20} costUsd={0.0123} costKind="estimated" />,
		)
		expect(screen.getByText("Estimated API cost")).toBeTruthy()
		expect(screen.getByText("$0.0123 USD")).toBeTruthy()
		rerender(<MakerrrUsageMeter inputTokens={100} outputTokens={20} costUsd={0.0123} costKind="cloud-reported" />)
		expect(screen.getByText("Cloud-reported usage")).toBeTruthy()
	})

	it("renders nothing when there is no usage to report", () => {
		const { container } = render(<MakerrrUsageMeter inputTokens={0} outputTokens={0} />)
		expect(container.firstChild).toBeNull()
	})
})
