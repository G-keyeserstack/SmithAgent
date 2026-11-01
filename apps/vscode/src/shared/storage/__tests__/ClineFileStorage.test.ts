import { chmodSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "bun:test"
import { ClineFileStorage } from "../ClineFileStorage"

const roots: string[] = []

afterEach(() => {
	for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true })
})

describe("ClineFileStorage secret-file permissions", () => {
	it("hardens an existing secrets file before loading it", () => {
		if (process.platform === "win32") return
		const root = mkdtempSync(join(tmpdir(), "makerrr-secret-storage-"))
		roots.push(root)
		const file = join(root, "secrets.json")
		writeFileSync(file, JSON.stringify({ apiKey: "test-secret" }), { mode: 0o644 })
		chmodSync(file, 0o644)

		const storage = new ClineFileStorage<string>(file, "Secrets", { fileMode: 0o600 })

		expect(statSync(file).mode & 0o777).toBe(0o600)
		expect(storage.get("apiKey")).toBe("test-secret")
		expect(readFileSync(file, "utf8")).toContain("test-secret")
	})
})
