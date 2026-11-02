#!/usr/bin/env bash
# Build the first-party Makerrr desktop editor from the pinned Code OSS/VSCodium
# build tooling, then bundle the Makerrr agent extension into the application.
set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
EDITOR_DIR="$ROOT/apps/editor"
BUILD_DIR="$EDITOR_DIR/.build"
UPSTREAM_DIR="$BUILD_DIR/vscodium"
VSCODIUM_COMMIT="ca7f7b44b5e5c3faa663f6cdc043998f71936653"

command -v git >/dev/null || { echo "git is required" >&2; exit 1; }
command -v jq >/dev/null || { echo "jq is required" >&2; exit 1; }
command -v bun >/dev/null || { echo "Bun is required" >&2; exit 1; }
command -v node >/dev/null || { echo "Node.js is required" >&2; exit 1; }
command -v unzip >/dev/null || { echo "unzip is required" >&2; exit 1; }

node "$EDITOR_DIR/scripts/verify-product.mjs"

case "$(uname -s)" in
  Linux*) OS_NAME="linux"; VSCODE_PLATFORM="linux" ;;
  Darwin*) OS_NAME="osx"; VSCODE_PLATFORM="darwin" ;;
  MINGW*|MSYS*|CYGWIN*) OS_NAME="windows"; VSCODE_PLATFORM="win32" ;;
  *) echo "Unsupported build host: $(uname -s)" >&2; exit 1 ;;
esac

case "$(uname -m)" in
  aarch64|arm64) VSCODE_ARCH="arm64" ;;
  x86_64|AMD64) VSCODE_ARCH="x64" ;;
  *) echo "Unsupported architecture: $(uname -m)" >&2; exit 1 ;;
esac

mkdir -p "$BUILD_DIR"
if [[ ! -d "$UPSTREAM_DIR/.git" ]]; then
  git clone https://github.com/VSCodium/vscodium.git "$UPSTREAM_DIR"
fi
if [[ -n "$(git -C "$UPSTREAM_DIR" status --porcelain)" ]]; then
  echo "Refusing to overwrite local changes in $UPSTREAM_DIR" >&2
  exit 1
fi
git -C "$UPSTREAM_DIR" fetch --depth 1 origin "$VSCODIUM_COMMIT"
git -C "$UPSTREAM_DIR" checkout --detach "$VSCODIUM_COMMIT"

# Keep the pinned upstream checkout reusable even when the build fails.
TMP_DIR=""
cleanup() {
  if [[ -n "$TMP_DIR" ]]; then rm -rf "$TMP_DIR"; fi
  git -C "$UPSTREAM_DIR" restore --worktree -- product.json >/dev/null 2>&1 || true
}
trap cleanup EXIT

# Preserve upstream build metadata (icons, platform identifiers and gallery
# defaults), overriding only the product fields owned by Makerrr.
jq -s '.[0] * .[1]' "$UPSTREAM_DIR/product.json" "$EDITOR_DIR/product.json" > "$UPSTREAM_DIR/product.json.makerrr"
mv "$UPSTREAM_DIR/product.json.makerrr" "$UPSTREAM_DIR/product.json"

# Build local SDK packages first: the VS Code extension typecheck and bundle
# resolve @cline/core, @cline/shared and @cline/llms from these workspace builds.
(cd "$ROOT" && bun run build:sdk)

# Build the agent extension first. The packaged editor ships with it enabled.
(
  cd "$ROOT/apps/vscode"
  bunx --bun @vscode/vsce package --no-dependencies --out "$BUILD_DIR/makerrr-agent.vsix"
)

# Use the upstream's reproducible source preparation and build scripts, but
# override all user-visible product identifiers and keep Open VSX as the gallery.
(
  cd "$UPSTREAM_DIR"
  export CI_BUILD="no"
  export SHOULD_BUILD="yes"
  export SHOULD_BUILD_REH="no"
  export SHOULD_BUILD_REH_WEB="no"
  export SKIP_ASSETS="yes"
  export VSCODE_QUALITY="stable"
  export VSCODE_SKIP_NODE_VERSION_CHECK="yes"
  export VSCODE_LATEST="no"
  export RELEASE_VERSION=""
  export MS_TAG=""
  export MS_COMMIT=""
  export GITHUB_ENV=""
  export BUILD_SOURCEVERSION=""
  export npm_config_arch=""
  export DISABLE_UPDATE="yes"
  export OS_NAME VSCODE_PLATFORM VSCODE_ARCH
  export APP_NAME="Makerrr"
  export APP_NAME_LC="makerrr"
  export BINARY_NAME="makerrr"
  export ORG_NAME="Makerrr"
  export GH_REPO_PATH="G-keyeserstack/SmithAgent"
  export ASSETS_REPOSITORY="G-keyeserstack/SmithAgent"
  export TUNNEL_APP_NAME="makerrr-tunnel"
  export MAX_OLD_SPACE_SIZE="${MAX_OLD_SPACE_SIZE:-8192}"
  # The upstream scripts do not run with Bash nounset enabled. Keep errexit
  # and pipefail, but disable -u only while sourcing the pinned upstream code.
  set +u
  . ./get_repo.sh

  # VS Code invokes node-gyp from build/npm/gyp before its main npm ci.
  # The root Bun install does not populate this isolated, lockfile-pinned package.
  # `node -` reads this script from stdin, so argv[1] is "-" and the path is argv[2].
  # argv[1] was opening a file named "-" and the gyp bootstrap never ran.
  node - "$UPSTREAM_DIR/prepare_vscode.sh" <<'NODE'
const fs = require("node:fs");
const preparePath = process.argv[2];
if (!preparePath || preparePath === "-") {
  throw new Error("prepare_vscode.sh path must be argv[2]; argv[1] is the stdin marker '-'");
}
let source = fs.readFileSync(preparePath, "utf8");
const marker = "node build/npm/preinstall.ts";
const install = "npm ci --prefix build/npm/gyp --ignore-scripts --no-audit --no-fund";
if (!source.includes(marker)) {
  throw new Error("Pinned VSCodium prepare_vscode.sh no longer contains the expected preinstall hook");
}
if (!source.includes(install)) {
  source = source.replace(marker, install + "\n\n" + marker);
  fs.writeFileSync(preparePath, source);
}
NODE

  . ./build.sh
  set -u
)

APP_DIR="$UPSTREAM_DIR/VSCode-$VSCODE_PLATFORM-$VSCODE_ARCH"
if [[ ! -d "$APP_DIR/resources/app/extensions" ]]; then
  echo "Editor build output not found at $APP_DIR" >&2
  exit 1
fi

EXTENSION_DIR="$APP_DIR/resources/app/extensions/makerrr.claude-dev"
TMP_DIR="$(mktemp -d)"
unzip -q "$BUILD_DIR/makerrr-agent.vsix" 'extension/*' -d "$TMP_DIR"
rm -rf "$EXTENSION_DIR"
mkdir -p "$(dirname "$EXTENSION_DIR")"
mv "$TMP_DIR/extension" "$EXTENSION_DIR"

echo "Makerrr editor built at: $APP_DIR"
echo "Bundled agent extension: $EXTENSION_DIR"
