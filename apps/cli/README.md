# Makerrr CLI

Makerrr is an open development agent for the terminal, editor and SDK. The CLI reuses the Cline-derived Apache-2.0 agent foundation while introducing Makerrr product identity, configuration paths and compatibility-safe migration.

**Primary command:** `makerrr`  
**Compatibility command:** `cline` remains available for existing scripts and installations.

> Makerrr is under active development on this branch. The npm wrapper and platform binary aliases are prepared in source; the package has not been published.

## Installation

Once the Makerrr CLI package is published:

```sh
npm install -g makerrr
```

The package resolves a platform-specific binary for macOS, Linux and Windows on supported architectures. Bun is embedded in the compiled binary; users do not need a separate Bun installation.

## Quick start

```sh
makerrr
makerrr "Audit this repository and propose fixes"
cat file.txt | makerrr "Summarise this file"
makerrr --help
```

## Local workspace tools

Search code and text using the same bounded, ripgrep-first executor used by the agent:

```sh
makerrr search "TODO|FIXME" --cwd .
makerrr search "function\\s+create.*Executor" --max-results 50 --context-lines 3
```

Inspect configured context sources (rules, skills, workflows, agents, plugins and MCP):

```sh
makerrr context
makerrr context --json
```

## Configuration and migration

New global configuration is stored under `~/.makerrr/`, with new runtime data under `~/.makerrr/data/`. Project configuration uses `.makerrr/`. New product-specific environment variables use the `MAKERRR_` prefix. If an existing Cline session, team, connector or database store is present, Makerrr continues using that legacy store until an offline-aware migration is available, so existing history is not silently hidden or split.

Makerrr retains compatibility discovery for existing Cline rules, skills, hooks, workflows, agents and plugins. It does not delete or silently rename legacy files.

Preview settings migration:

```sh
makerrr migrate
```

Copy only the supported settings files after reviewing the preview:

```sh
makerrr migrate --yes
```

The initial migration copies global settings, provider settings and MCP settings. It never overwrites an existing Makerrr file and leaves original Cline files untouched. Session databases, workspaces and other runtime data are not copied by this first pass; they require a separate offline-aware migration.

## Models and providers

The CLI inherits the provider adapters in the open-source foundation. Actual model, tool-use, streaming and authentication support depends on the adapter and model selected. Bring your own provider credentials or use a compatible local model runtime where supported. Makerrr-owned identity, hosted inference and billing services are not represented as live in this development branch.

## Product principles

- Local-first execution by default.
- Explicit user approval for potentially destructive or externally visible actions.
- Model choice, including BYOK and compatible local runtimes where tested.
- Transparent usage and cost information where available.
- Compatibility-first upgrades and recoverable configuration migration.

## Development status

This repository is a development branch, not a published production release. Clean installation, build, typecheck, test, security and release validation must pass before a production-readiness claim is made.

## Open-source attribution

Makerrr reuses code from Cline under the Apache License 2.0. Upstream license files, notices and copyright attributions are retained. Makerrr branding does not imply ownership of upstream contributions.
