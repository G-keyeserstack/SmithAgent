import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { applyPatchChanges, computePatchChanges, createApplyPatchExecutor } from "./apply-patch";

describe("createApplyPatchExecutor", () => {
	let tempDir: string;

	beforeEach(async () => {
		tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "apply-patch-"));
	});

	afterEach(async () => {
		await fs.rm(tempDir, { recursive: true, force: true });
	});

	it("applies the documented freeform patch format without shell wrappers", async () => {
		const filePath = path.join(tempDir, "page.tsx");
		await fs.writeFile(
			filePath,
			[
				"export default function Page() {",
				"\treturn (",
				"\t\t<div>",
				'\t\t\t<button onClick={() => console.log("clicked")}>Click me</button>',
				"\t\t</div>",
				"\t);",
				"}",
			].join("\n"),
			"utf-8",
		);

		const execute = createApplyPatchExecutor();
		const result = await execute(
			{
				input: [
					"*** Update File: page.tsx",
					"@@",
					" export default function Page() {",
					" \treturn (",
					" \t\t<div>",
					' \t\t\t<button onClick={() => console.log("clicked")}>Click me</button>',
					'+\t\t\t<button onClick={() => console.log("cancel clicked")}>Cancel</button>',
					" \t\t</div>",
					" \t);",
					" }",
				].join("\n"),
			},
			tempDir,
			{} as never,
		);

		await expect(fs.readFile(filePath, "utf-8")).resolves.toContain(
			'console.log("cancel clicked")',
		);
		expect(result).toContain("Successfully applied patch");
		expect(result).toContain("page.tsx");
	});

	it("accepts the legacy shell wrapper around the patch", async () => {
		const filePath = path.join(tempDir, "note.txt");
		const execute = createApplyPatchExecutor();

		await execute(
			{
				input: [
					"%%bash",
					'apply_patch <<"EOF"',
					"*** Begin Patch",
					"*** Add File: note.txt",
					"+hello",
					"*** End Patch",
					"EOF",
				].join("\n"),
			},
			tempDir,
			{} as never,
		);

		await expect(fs.readFile(filePath, "utf-8")).resolves.toBe("hello");
	});

	it("does not strip valid patch lines that begin with wrapper tokens after the patch prefix", async () => {
		const filePath = path.join(tempDir, "note.txt");
		await fs.writeFile(
			filePath,
			["alpha", "EOF literal", "``` fence", "omega"].join("\n"),
			"utf-8",
		);

		const execute = createApplyPatchExecutor();
		await execute(
			{
				input: [
					"*** Update File: note.txt",
					"@@",
					" alpha",
					" EOF literal",
					" ``` fence",
					"+tail",
					" omega",
				].join("\n"),
			},
			tempDir,
			{} as never,
		);

		await expect(fs.readFile(filePath, "utf-8")).resolves.toBe(
			["alpha", "EOF literal", "``` fence", "tail", "omega"].join("\n"),
		);
	});

	it("accepts an end sentinel with trailing whitespace", async () => {
		const filePath = path.join(tempDir, "note.txt");
		const execute = createApplyPatchExecutor();

		await execute(
			{
				input: [
					"*** Begin Patch",
					"*** Add File: note.txt",
					"+hello",
					"*** End Patch ",
				].join("\n"),
			},
			tempDir,
			{} as never,
		);

		await expect(fs.readFile(filePath, "utf-8")).resolves.toBe("hello");
	});

	// The CRLF branch is exercised for real by Windows CI, where os.EOL is
	// "\r\n" (github.com/cline/cline/issues/13504).
	it("adds new files with the platform-native line ending", async () => {
		const filePath = path.join(tempDir, "added.txt");
		const execute = createApplyPatchExecutor();

		await execute(
			{
				input: [
					"*** Begin Patch",
					"*** Add File: added.txt",
					"+one",
					"+two",
					"*** End Patch",
				].join("\n"),
			},
			tempDir,
			{} as never,
		);

		await expect(fs.readFile(filePath, "utf-8")).resolves.toBe(
			["one", "two"].join(os.EOL),
		);
	});

	it("preserves CRLF line endings when updating a CRLF file", async () => {
		const filePath = path.join(tempDir, "note.txt");
		await fs.writeFile(filePath, "alpha\r\nbeta\r\ngamma", "utf-8");
		const execute = createApplyPatchExecutor();

		// Models emit LF-only patch text even for CRLF files.
		await execute(
			{
				input: [
					"*** Update File: note.txt",
					"@@",
					" alpha",
					"-beta",
					"+BETA",
					"+inserted",
					" gamma",
				].join("\n"),
			},
			tempDir,
			{} as never,
		);

		await expect(fs.readFile(filePath, "utf-8")).resolves.toBe(
			"alpha\r\nBETA\r\ninserted\r\ngamma",
		);
	});

	it("preserves CRLF line endings when a patch moves a CRLF file", async () => {
		const filePath = path.join(tempDir, "old.txt");
		await fs.writeFile(filePath, "one\r\ntwo", "utf-8");
		const execute = createApplyPatchExecutor();

		await execute(
			{
				input: [
					"*** Update File: old.txt",
					"*** Move to: new.txt",
					"@@",
					" one",
					"-two",
					"+TWO",
				].join("\n"),
			},
			tempDir,
			{} as never,
		);

		await expect(
			fs.readFile(path.join(tempDir, "new.txt"), "utf-8"),
		).resolves.toBe("one\r\nTWO");
	});

	it("updates a pure-LF file without introducing CRLF", async () => {
		const filePath = path.join(tempDir, "lf.txt");
		await fs.writeFile(filePath, "one\ntwo\nthree", "utf-8");
		const execute = createApplyPatchExecutor();

		await execute(
			{
				input: [
					"*** Update File: lf.txt",
					"@@",
					" one",
					"-two",
					"+TWO",
					" three",
				].join("\n"),
			},
			tempDir,
			{} as never,
		);

		await expect(fs.readFile(filePath, "utf-8")).resolves.toBe(
			"one\nTWO\nthree",
		);
	});

	it("refuses to add a file that already exists", async () => {
		const filePath = path.join(tempDir, "note.txt");
		await fs.writeFile(filePath, "important data", "utf-8");
		const execute = createApplyPatchExecutor();

		await expect(
			execute(
				{
					input: [
						"*** Begin Patch",
						"*** Add File: note.txt",
						"+overwritten",
						"*** End Patch",
					].join("\n"),
				},
				tempDir,
				{} as never,
			),
		).rejects.toThrow("Add File Error: File already exists: note.txt");

		await expect(fs.readFile(filePath, "utf-8")).resolves.toBe(
			"important data",
		);
	});

	it("rejects incomplete patch sentinels", async () => {
		const execute = createApplyPatchExecutor();

		await expect(
			execute(
				{
					input: "*** Begin Patch\n*** Add File: note.txt\n+hello",
				},
				tempDir,
				{} as never,
			),
		).rejects.toThrow("Invalid patch text - incomplete sentinels");
	});

	it("rejects a patch when a hunk context does not match", async () => {
		const filePath = path.join(tempDir, "note.txt");
		const original = ["alpha", "beta", "gamma"].join("\n");
		await fs.writeFile(filePath, original, "utf-8");
		const execute = createApplyPatchExecutor();

		await expect(
			execute(
				{
					input: [
						"*** Update File: note.txt",
						"@@",
						" unrelated heading",
						" missing middle",
						"+replacement",
						" absent footer",
					].join("\n"),
				},
				tempDir,
				{} as never,
			),
		).rejects.toThrow(/note\.txt: hunk 1: Could not find matching context/);

		await expect(fs.readFile(filePath, "utf-8")).resolves.toBe(original);
	});

	it("refuses to overwrite a file changed after patch preview", async () => {
		const filePath = path.join(tempDir, "concurrent.txt");
		await fs.writeFile(filePath, "original\n", "utf-8");
		const patch = [
			"*** Update File: concurrent.txt",
			"@@",
			" original",
			"+agent change",
		].join("\n");
		const { changes } = await computePatchChanges(patch, tempDir);
		await fs.writeFile(filePath, "newer user change\n", "utf-8");

		await expect(
			applyPatchChanges(changes, tempDir, "utf-8", true),
		).rejects.toThrow("File changed after patch preview");
		await expect(fs.readFile(filePath, "utf-8")).resolves.toBe("newer user change\n");
	});

	it("preflights all files before writing any part of a multi-file patch", async () => {
		const firstPath = path.join(tempDir, "first.txt");
		const secondPath = path.join(tempDir, "second.txt");
		await fs.writeFile(firstPath, "first\n", "utf-8");
		await fs.writeFile(secondPath, "second\n", "utf-8");
		const patch = [
			"*** Update File: first.txt",
			"@@",
			" first",
			"+updated first",
			"*** Update File: second.txt",
			"@@",
			" second",
			"+updated second",
		].join("\n");
		const { changes } = await computePatchChanges(patch, tempDir);
		await fs.writeFile(secondPath, "concurrent second\n", "utf-8");

		await expect(
			applyPatchChanges(changes, tempDir, "utf-8", true),
		).rejects.toThrow("File changed after patch preview");
		await expect(fs.readFile(firstPath, "utf-8")).resolves.toBe("first\n");
		await expect(fs.readFile(secondPath, "utf-8")).resolves.toBe("concurrent second\n");
	});


	it("enforces workspace boundaries for absolute paths without rejecting in-workspace names beginning with dots", async () => {
		const inWorkspacePath = path.join(tempDir, "..notes.txt");
		await fs.writeFile(inWorkspacePath, "before\n", "utf-8");
		const patch = [
			"*** Update File: ..notes.txt",
			"@@",
			" before",
			"+after",
		].join("\n");
		const { changes } = await computePatchChanges(patch, tempDir);
		await applyPatchChanges(changes, tempDir, "utf-8", true);
		await expect(fs.readFile(inWorkspacePath, "utf-8")).resolves.toBe("before\nafter");

		const outsideDir = await fs.mkdtemp(path.join(os.tmpdir(), "apply-patch-absolute-outside-"));
		try {
			const outsidePath = path.join(outsideDir, "secret.txt");
			await fs.writeFile(outsidePath, "outside data\n", "utf-8");
			const outsidePatch = [
				`*** Update File: ${outsidePath}`,
				"@@",
				" outside data",
				"+changed",
			].join("\n");
			await expect(computePatchChanges(outsidePatch, tempDir)).rejects.toThrow(
				"Path must stay within cwd",
			);
			await expect(fs.readFile(outsidePath, "utf-8")).resolves.toBe("outside data\n");
		} finally {
			await fs.rm(outsideDir, { recursive: true, force: true });
		}
	});


	it("rejects relative edit paths that escape the workspace through a symlink", async () => {
		const outsideDir = await fs.mkdtemp(path.join(os.tmpdir(), "apply-patch-outside-"));
		try {
			await fs.writeFile(path.join(outsideDir, "secret.txt"), "outside data\n", "utf-8");
			try {
				await fs.symlink(outsideDir, path.join(tempDir, "linked"), "dir");
			} catch {
				// Some Windows environments do not grant symlink creation rights.
				return;
			}
			const patch = [
				"*** Update File: linked/secret.txt",
				"@@",
				" outside data",
				"+changed",
			].join("\n");
			await expect(computePatchChanges(patch, tempDir)).rejects.toThrow(
				"Path resolves outside cwd through a symbolic link",
			);
			await expect(fs.readFile(path.join(outsideDir, "secret.txt"), "utf-8")).resolves.toBe("outside data\n");
		} finally {
			await fs.rm(outsideDir, { recursive: true, force: true });
		}
	});

});
