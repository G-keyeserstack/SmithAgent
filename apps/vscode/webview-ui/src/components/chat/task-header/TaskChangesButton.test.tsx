import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { TaskChangesButton } from "./TaskChangesButton"

const mocks = vi.hoisted(() => ({
	count: vi.fn(),
	view: vi.fn(),
}))

vi.mock("@/services/grpc-client", () => ({
	CheckpointsServiceClient: {
		checkpointLatestChangesCount: mocks.count,
		checkpointViewLatestChanges: mocks.view,
	},
}))

vi.mock("@shared/proto/cline/common", () => ({
	EmptyRequest: { create: () => ({}) },
}))

describe("TaskChangesButton", () => {
	beforeEach(() => {
		mocks.count.mockReset()
		mocks.view.mockReset()
		mocks.count.mockResolvedValue({ value: 3 })
		mocks.view.mockResolvedValue({})
	})

	it("shows the task-scoped multi-file review action when the checkpoint has changes", async () => {
		render(<TaskChangesButton enabled refreshKey="task-1:3" />)
		const button = await screen.findByRole("button", { name: "Review changes in 3 files" })
		fireEvent.click(button)
		await waitFor(() => expect(mocks.view).toHaveBeenCalledOnce())
	})

	it("does not show a review action when no checkpoint changes exist", async () => {
		mocks.count.mockResolvedValue({ value: 0 })
		render(<TaskChangesButton enabled refreshKey="task-2:0" />)
		await waitFor(() => expect(mocks.count).toHaveBeenCalledOnce())
		expect(screen.queryByRole("button", { name: /Review changes/ })).toBeNull()
	})

	it("does not query or render when checkpoint support is disabled", () => {
		render(<TaskChangesButton enabled={false} refreshKey="task-3" />)
		expect(mocks.count).not.toHaveBeenCalled()
		expect(screen.queryByRole("button", { name: /Review changes/ })).toBeNull()
	})

	it("surfaces host failures instead of silently pretending the diff opened", async () => {
		mocks.view.mockRejectedValue(new Error("checkpoint service unavailable"))
		render(<TaskChangesButton enabled refreshKey="task-4" />)
		fireEvent.click(await screen.findByRole("button", { name: "Review changes in 3 files" }))
		expect(await screen.findByRole("alert")).toHaveTextContent("checkpoint service unavailable")
	})
})
