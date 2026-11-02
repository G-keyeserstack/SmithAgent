import * as vscode from "vscode"
import type { Controller } from "@/core/controller"
import { buildApiHandlerWithHostContext } from "@/sdk/sdk-api-handler"
import { Logger } from "@/shared/services/Logger"
import { createTabCompletionPrompt, normalizeTabCompletion } from "./tab-completion-prompt"

const SUPPORTED_LANGUAGES = new Set([
	"c",
	"cpp",
	"csharp",
	"css",
	"go",
	"html",
	"java",
	"javascript",
	"javascriptreact",
	"json",
	"jsonc",
	"kotlin",
	"markdown",
	"php",
	"python",
	"ruby",
	"rust",
	"scss",
	"shellscript",
	"swift",
	"typescript",
	"typescriptreact",
	"yaml",
])

const MAX_DOCUMENT_CHARACTERS = 1_000_000
const MAX_COMPLETION_CHARACTERS = 1_200
const activeRequests = new Map<string, AbortController>()

function waitForDelay(milliseconds: number, signal: AbortSignal): Promise<boolean> {
	if (signal.aborted) {
		return Promise.resolve(false)
	}

	return new Promise((resolve) => {
		let timer: ReturnType<typeof setTimeout> | undefined
		const cleanup = () => {
			if (timer) clearTimeout(timer)
			signal.removeEventListener("abort", onAbort)
		}
		const onAbort = () => {
			cleanup()
			resolve(false)
		}
		signal.addEventListener("abort", onAbort, { once: true })
		if (signal.aborted) {
			onAbort()
			return
		}
		timer = setTimeout(() => {
			cleanup()
			resolve(true)
		}, milliseconds)
	})
}

function shouldOfferCompletion(document: vscode.TextDocument, position: vscode.Position): boolean {
	if (document.uri.scheme !== "file" || document.isUntitled || !SUPPORTED_LANGUAGES.has(document.languageId)) {
		return false
	}
	if (document.getText().length > MAX_DOCUMENT_CHARACTERS) {
		return false
	}

	const currentLinePrefix = document.lineAt(position.line).text.slice(0, position.character)
	const previousContext = document.getText(
		new vscode.Range(Math.max(0, position.line - 2), 0, position.line, position.character),
	)
	return currentLinePrefix.trim().length >= 2 || previousContext.trim().length >= 2
}

async function provideTabCompletion(
	controller: Controller,
	document: vscode.TextDocument,
	position: vscode.Position,
	context: vscode.InlineCompletionContext,
	token: vscode.CancellationToken,
): Promise<vscode.InlineCompletionItem[] | undefined> {
	const settings = vscode.workspace.getConfiguration("makerrr.tabCompletion")
	if (!settings.get<boolean>("enabled", false) || !vscode.workspace.isTrusted || !shouldOfferCompletion(document, position)) {
		return undefined
	}

	const documentKey = document.uri.toString()
	activeRequests.get(documentKey)?.abort()
	const abortController = new AbortController()
	activeRequests.set(documentKey, abortController)
	const cancellation = token.onCancellationRequested(() => abortController.abort())

	let handler: Awaited<ReturnType<typeof buildApiHandlerWithHostContext>> | undefined
	try {
		const debounceMs = Math.min(Math.max(settings.get<number>("debounceMs", 450), 100), 1_500)
		if (context.triggerKind !== vscode.InlineCompletionTriggerKind.Invoke) {
			const ready = await waitForDelay(debounceMs, abortController.signal)
			if (!ready) return undefined
		}
		if (abortController.signal.aborted) return undefined

		const workspace = vscode.workspace.getWorkspaceFolder(document.uri)
		if (!workspace) return undefined

		const documentText = document.getText()
		const offset = document.offsetAt(position)
		const prompt = createTabCompletionPrompt({
			languageId: document.languageId,
			// Never send the developer's absolute local path to the model provider.
			fileName: document.uri.path.split("/").at(-1) ?? "untitled",
			prefix: documentText.slice(Math.max(0, offset - 9_000), offset),
			suffix: documentText.slice(offset, offset + 3_000),
			maxContextCharacters: settings.get<number>("maxContextCharacters", 6_000),
		})

		handler = await buildApiHandlerWithHostContext(controller.stateManager.getApiConfiguration(), "act", {
			disableReasoning: true,
		})
		handler.setAbortSignal?.(abortController.signal)
		if (abortController.signal.aborted) {
			handler.abort?.()
			return undefined
		}

		let response = ""
		for await (const chunk of handler.createMessage(prompt.systemPrompt, [{ role: "user", content: prompt.userPrompt }])) {
			if (abortController.signal.aborted || token.isCancellationRequested) {
				handler.abort?.()
				return undefined
			}
			if (chunk.type === "text") {
				response += chunk.text
				if (response.length >= MAX_COMPLETION_CHARACTERS) {
					break
				}
			} else if (chunk.type === "done" && chunk.success === false) {
				Logger.warn(`[MakerrrTab] Inline completion failed: ${chunk.error}`)
				return undefined
			}
		}

		if (abortController.signal.aborted || token.isCancellationRequested) {
			return undefined
		}
		const insertText = normalizeTabCompletion(response, MAX_COMPLETION_CHARACTERS)
		if (!insertText) return undefined

		return [new vscode.InlineCompletionItem(insertText, new vscode.Range(position, position))]
	} catch (error) {
		if (!abortController.signal.aborted) {
			Logger.warn(
				`[MakerrrTab] Inline completion unavailable: ${error instanceof Error ? error.message : String(error)}`,
			)
		}
		return undefined
	} finally {
		handler?.setAbortSignal?.(undefined)
		cancellation.dispose()
		if (activeRequests.get(documentKey) === abortController) {
			activeRequests.delete(documentKey)
		}
	}
}

export function registerMakerrrTabCompletionProvider(controller: Controller): vscode.Disposable[] {
	const provider: vscode.InlineCompletionItemProvider = {
		provideInlineCompletionItems: (document, position, context, token) =>
			provideTabCompletion(controller, document, position, context, token),
	}

	const completionProvider = vscode.languages.registerInlineCompletionItemProvider({ pattern: "**/*" }, provider)
	const toggleCommand = vscode.commands.registerCommand("makerrr.toggleTabCompletion", async () => {
		const settings = vscode.workspace.getConfiguration("makerrr.tabCompletion")
		const enabled = !settings.get<boolean>("enabled", false)
		await settings.update("enabled", enabled, vscode.ConfigurationTarget.Global)
		void vscode.window.showInformationMessage(`Makerrr Tab completions ${enabled ? "enabled" : "disabled"}.`)
	})

	const lifecycle = new vscode.Disposable(() => {
		for (const request of activeRequests.values()) request.abort()
		activeRequests.clear()
	})

	return [completionProvider, toggleCommand, lifecycle]
}
