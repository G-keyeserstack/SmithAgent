import { describe, expect, it } from "vitest"
import {
	createTabCompletionPrompt,
	NO_TAB_COMPLETION,
	normalizeTabCompletion,
} from "./tab-completion-prompt"

describe("Makerrr Tab completion prompt", () => {
	it("includes the language, filename and cursor-bounded context", () => {
		const prompt = createTabCompletionPrompt({
			languageId: "typescript",
			fileName: "editor.ts",
			prefix: "const answer = ",
			suffix: "\nconsole.log(answer)",
		})

		expect(prompt.systemPrompt).toContain("Makerrr Tab")
		expect(prompt.userPrompt).toContain("Language: typescript")
		expect(prompt.userPrompt).toContain("File: editor.ts")
		expect(prompt.userPrompt).toContain("<makerrr-prefix>\nconst answer = ")
		expect(prompt.userPrompt).toContain("<makerrr-suffix>\nconsole.log(answer)")
	})

	it("bounds context while preserving the nearest text around the cursor", () => {
		const prompt = createTabCompletionPrompt({
			languageId: "python",
			fileName: "main.py",
			prefix: "x".repeat(10_000),
			suffix: "y".repeat(10_000),
			maxContextCharacters: 1_000,
		})
		const prefix = prompt.userPrompt.split("<makerrr-prefix>\n")[1].split("\n</makerrr-prefix>")[0]
		const suffix = prompt.userPrompt.split("<makerrr-suffix>\n")[1].split("\n</makerrr-suffix>")[0]

		expect(prefix).toHaveLength(750)
		expect(suffix).toHaveLength(250)
		expect(prefix).toBe("x".repeat(750))
		expect(suffix).toBe("y".repeat(250))
	})

	it("clamps context size to the supported maximum", () => {
		const prompt = createTabCompletionPrompt({
			languageId: "typescript",
			fileName: "file.ts",
			prefix: "p".repeat(20_000),
			suffix: "s".repeat(20_000),
			maxContextCharacters: 100_000,
		})
		expect(prompt.userPrompt).toContain("p".repeat(9_000))
		expect(prompt.userPrompt).toContain("s".repeat(3_000))
	})

	it("removes model markdown fences without stripping code indentation", () => {
		expect(normalizeTabCompletion("```typescript\n    return value\n```")).toBe("    return value")
	})

	it("returns no suggestion for the explicit empty-completion marker", () => {
		expect(normalizeTabCompletion(NO_TAB_COMPLETION)).toBe("")
		expect(normalizeTabCompletion("   ")).toBe("")
	})

	it("caps completion output", () => {
		expect(normalizeTabCompletion("x".repeat(1_500), 1_200)).toHaveLength(1_200)
	})
})
