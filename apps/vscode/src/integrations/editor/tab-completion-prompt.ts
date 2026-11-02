export const NO_TAB_COMPLETION = "<|no_completion|>"

export const TAB_COMPLETION_SYSTEM_PROMPT = [
	"You are Makerrr Tab, an inline code-completion engine.",
	"Predict only the code that should be inserted at the cursor.",
	"Return raw code only: no Markdown fences, prose, explanations, or repeated context.",
	"Continue the existing indentation, naming conventions, and local style.",
	"Do not rewrite or repeat text already present before or after the cursor.",
	"Keep the suggestion concise and useful, with no more than 12 lines.",
	"If there is no useful completion, return exactly " + NO_TAB_COMPLETION + ".",
].join(" ")

export interface TabCompletionPromptInput {
	languageId: string
	fileName: string
	prefix: string
	suffix: string
	maxContextCharacters?: number
}

export interface TabCompletionPrompt {
	systemPrompt: string
	userPrompt: string
}

export function createTabCompletionPrompt(input: TabCompletionPromptInput): TabCompletionPrompt {
	const maxContextCharacters = Math.min(Math.max(input.maxContextCharacters ?? 6_000, 1_000), 12_000)
	const prefixBudget = Math.floor(maxContextCharacters * 0.75)
	const suffixBudget = maxContextCharacters - prefixBudget
	const prefix = input.prefix.slice(-prefixBudget)
	const suffix = input.suffix.slice(0, suffixBudget)

	return {
		systemPrompt: TAB_COMPLETION_SYSTEM_PROMPT,
		userPrompt: [
			`Language: ${input.languageId}`,
			`File: ${input.fileName}`,
			"",
			"<makerrr-prefix>",
			prefix,
			"</makerrr-prefix>",
			"",
			"<makerrr-suffix>",
			suffix,
			"</makerrr-suffix>",
			"",
			"Return only the text to insert at the cursor.",
		].join("\n"),
	}
}

export function normalizeTabCompletion(raw: string, maxCharacters = 1_200): string {
	if (!raw.trim()) {
		return ""
	}

	let completion = raw.replace(/^\s*```(?:[\w+-]+)?\s*\r?\n/, "")
	completion = completion.replace(/\r?\n```\s*$/, "")
	if (completion.trim() === NO_TAB_COMPLETION) {
		return ""
	}

	completion = completion.replace(/\r\n/g, "\n")
	if (!completion.trim()) {
		return ""
	}

	return completion.slice(0, maxCharacters)
}
