import { searchWorkspaceCode } from "@cline/core"
import * as vscode from "vscode"

const MAX_QUERY_LENGTH = 500

export function registerMakerrrCodebaseSearch(): vscode.Disposable {
	return vscode.commands.registerCommand("makerrr.searchCodebase", async () => {
		if (!vscode.workspace.isTrusted) {
			void vscode.window.showWarningMessage("Trust this workspace before searching its codebase with Makerrr.")
			return
		}

		const workspace = vscode.workspace.workspaceFolders?.[0]
		if (!workspace) {
			void vscode.window.showInformationMessage("Open a project folder before searching its codebase.")
			return
		}

		const query = await vscode.window.showInputBox({
			title: "Makerrr Codebase Search",
			prompt: "Search symbols, implementation details and concepts in this workspace",
			placeHolder: "e.g. where are OAuth refresh tokens persisted?",
			validateInput: (value) =>
				value.length > MAX_QUERY_LENGTH ? `Search query must be ${MAX_QUERY_LENGTH} characters or fewer.` : undefined,
		})
		if (!query?.trim()) return

		const progressLocation = vscode.ProgressLocation.Notification
		const response = await vscode.window.withProgress(
			{ location: progressLocation, title: "Makerrr is searching your codebase…", cancellable: false },
			() => searchWorkspaceCode(workspace.uri.fsPath, query.trim(), { topK: 12, maxFiles: 1_200 }),
		)

		if (response.results.length === 0) {
			void vscode.window.showInformationMessage("Makerrr found no matching code. Try a more specific symbol or concept.")
			return
		}

		const items = response.results.map((result) => ({
			label: result.path,
			description: `Lines ${result.startLine}–${result.endLine} · ${Math.round(result.score * 100)}% ${response.mode} match`,
			detail: result.snippet.split("\n").slice(0, 3).join(" ").slice(0, 240),
			result,
		}))
		const selected = await vscode.window.showQuickPick(items, {
			title: `Makerrr Codebase Search · ${response.mode} results`,
			placeHolder: "Select a result to open it in the editor",
			matchOnDescription: true,
			matchOnDetail: true,
		})
		if (!selected) return

		const document = await vscode.workspace.openTextDocument(
			vscode.Uri.joinPath(workspace.uri, selected.result.path),
		)
		const line = Math.max(0, selected.result.startLine - 1)
		const editor = await vscode.window.showTextDocument(document, { preview: true })
		const position = new vscode.Position(line, 0)
		editor.selection = new vscode.Selection(position, position)
		editor.revealRange(new vscode.Range(position, position), vscode.TextEditorRevealType.InCenter)
	})
}
