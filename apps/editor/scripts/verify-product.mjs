import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"

const here = dirname(fileURLToPath(import.meta.url))
const editorRoot = resolve(here, "..")
const repoRoot = resolve(editorRoot, "../..")
const product = JSON.parse(await readFile(resolve(editorRoot, "product.json"), "utf8"))
const extension = JSON.parse(await readFile(resolve(repoRoot, "apps/vscode/package.json"), "utf8"))

assert.equal(product.nameShort, "Makerrr")
assert.equal(product.nameLong, "Makerrr")
assert.equal(product.applicationName, "makerrr")
assert.equal(product.dataFolderName, ".makerrr")
assert.equal(product.urlProtocol, "makerrr")
assert.equal(product.darwinBundleIdentifier, "com.makerrr.editor")
assert.equal(product.win32AppUserModelId, "Makerrr.Editor")
assert.equal(product.extensionsGallery.serviceUrl, "https://open-vsx.org/vscode/gallery")
assert.equal(extension.displayName, "Makerrr")
assert.equal(extension.publisher, "makerrr")
assert.equal(extension["x-makerrr-attribution"], "Based on Cline (Apache-2.0)")

console.log("Makerrr editor product identity verified.")
