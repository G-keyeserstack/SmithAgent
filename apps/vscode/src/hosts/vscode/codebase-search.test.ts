import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => {
	class Position {
		constructor(public line: number, public character: number) {}
	}
	class Range {
		constructor(public start: Position, public end: Position) {}
	}
	class Selection {
		constructor(public anchor: Position, public active: Position) {}
	}
	const selected = {
		path: "src/auth/login.ts",
		startLine: 42,
		endLine: 58,
		snippet: "export async function login() {}",
		score: 0.75,
	}
	return {
		Position,
		Range,
		Selection,
		selected,
		searchWorkspaceCode: vi.fn(),
		showWarningMessage: vi.fn(),
		showInformationMessage: vi.fn(),
		showInputBox: vi.fn(),
		withProgress: vi.fn(async (_options: unknown, task: () => Promise<unknown>) => task()),
		showQuickPick: vi.fn(),
		openTextDocument: vi.fn(),
		showTextDocument: vi.fn(),
		isTrusted: true,
		workspaceFolders: [{ uri: { fsPath: "/workspace/project" } }],
		Uri: { joinPath: vi.fn((_uri: unknown, relative: string) => ({ fsPath: `/workspace/project/${relative}` })) },
	}
})

vi.mock("@cline/core", () => ({ searchWorkspaceCode: mocks.searchWorkspaceCode }))
vi.mock("vscode", () => ({
	ProgressLocation: { Notification: 15 },
	TextEditorRevealType: { InCenter: 1 },
	Position: mocks.Position,
	Range: mocks.Range,
	Selection: mocks.Selection,
	Uri: mocks.Uri,
	workspace: {
		get isTrusted() { return mocks.isTrusted },
		get workspaceFolders() { return mocks.workspaceFolders },
		openTextDocument: mocks.openTextDocument,
	},
	window: {
		showWarningMessage: mocks.showWarningMessage,
		showInformationMessage: mocks.showInformationMessage,
		showInputBox: mocks.showInputBox,
		withProgress: mocks.withProgress,
		showQuickPick: mocks.showQuickPick,
		showTextDocument: mocks.showTextDocument,
	},
	commands: { registerCommand: vi.fn((_name: string, handler: () => Promise<void>) => ({ handler })) },
}))

import { registerMakerrrCodebaseSearch } from "./codebase-search"

describe("Makerrr desktop codebase search", () => {
	beforeEach(() => {
		vi.clearAllMocks()
		mocks.isTrusted = true
		mocks.workspaceFolders = [{ uri: { fsPath: "/workspace/project" } }]
		mocks.showInputBox.mockResolvedValue("where are login tokens refreshed?")
		mocks.searchWorkspaceCode.mockResolvedValue({ mode: "lexical", results: [mocks.selected] })
		mocks.showQuickPick.mockResolvedValue({ result: mocks.selected })
		mocks.openTextDocument.mockResolvedValue({ uri: { fsPath: "/workspace/project/src/auth/login.ts" } })
		mocks.showTextDocument.mockResolvedValue({
			selection: undefined,
			revealRange: vi.fn(),
		})
	})

	it("searches only the trusted active workspace and opens the selected source location", async () => {
		const registration = registerMakerrrCodebaseSearch() as unknown as { handler: () => Promise<void> }
		await registration.handler()

		expect(mocks.searchWorkspaceCode).toHaveBeenCalledWith(
			"/workspace/project",
			"where are login tokens refreshed?",
			{ topK: 12, maxFiles: 1_200 },
		)
		expect(mocks.Uri.joinPath).toHaveBeenCalledWith(
			mocks.workspaceFolders[0].uri,
			"src/auth/login.ts",
		)
		expect(mocks.openTextDocument).toHaveBeenCalled()
		const editor = await mocks.showTextDocument.mock.results[0]?.value
		expect(editor.selection.anchor.line).toBe(41)
		expect(editor.selection.anchor.character).toBe(0)
		expect(editor.revealRange).toHaveBeenCalled()
	})

	it("does not inspect workspace files until the user trusts the workspace", async () => {
		mocks.isTrusted = false
		const registration = registerMakerrrCodebaseSearch() as unknown as { handler: () => Promise<void> }
		await registration.handler()

		expect(mocks.showWarningMessage).toHaveBeenCalled()
		expect(mocks.searchWorkspaceCode).not.toHaveBeenCalled()
	})

	it("asks the developer to open a project before searching", async () => {
		mocks.workspaceFolders = []
		const registration = registerMakerrrCodebaseSearch() as unknown as { handler: () => Promise<void> }
		await registration.handler()

		expect(mocks.showInformationMessage).toHaveBeenCalled()
		expect(mocks.showInputBox).not.toHaveBeenCalled()
	})

	it("does not search when the query is cancelled", async () => {
		mocks.showInputBox.mockResolvedValue(undefined)
		const registration = registerMakerrrCodebaseSearch() as unknown as { handler: () => Promise<void> }
		await registration.handler()

		expect(mocks.searchWorkspaceCode).not.toHaveBeenCalled()
	})
})
