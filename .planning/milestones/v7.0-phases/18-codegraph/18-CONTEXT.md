# Phase 18 CONTEXT — CodeGraph semantic index (F)

> Locked from v7.0 milestone discuss + Phase 18 design clarification (2026-06-13, AskUserQuestion: catalog + doctor-detect, NOT harnessed-managed install). Planned + executed in the MAIN session. Parallelizable (no dep on 14–17) — a manifest/capability-layer phase, NOT checkpoint internals.

## Goal

Catalog CodeGraph as an optional, opt-in semantic-index component: a validated manifest (provenance/discoverability) + a doctor check that detects its presence + a capability map entry. harnessed does NOT run the install — CodeGraph ships its own installer; harnessed catalogs + detects (the no-vendor thesis taken to its end).

## What CodeGraph is (verified)

- npm `@colbymchenry/codegraph`, **MIT**, TypeScript, 100% local. A pre-indexed code knowledge graph for Claude Code (+ Cursor/Codex/etc.) — "fewer tokens, fewer tool calls" (comet reported tool-calls ↓58%).
- Its own install flow: `npm i -g @colbymchenry/codegraph` → `codegraph install` (auto-wires the CodeGraph MCP server into Claude Code and other agents) → `codegraph init` (per-project: creates `.codegraph/` + builds the graph; auto-syncs after). Shortcut: `npx @colbymchenry/codegraph`.
- verify: `codegraph status`. uninstall: `codegraph uninstall` (+ `codegraph uninit` per project). Agent-facing surface: the `codegraph_explore` / `codegraph_status` MCP tools.
- We already have a local `.codegraph/codegraph.db` (4.8M) from comet's CodeGraph run here.

## Infrastructure (verified)

- `install-base` globs ALL `.yaml` in `manifests/tools/` + `manifests/skill-packs/` → anything there is BASE. There is NO `optional`/`base` manifest field. → an opt-in manifest must live in a NEW dir `manifests/optional/` (not globbed by install-base).
- `harnessed install <name>` resolves only `manifests/tools/<name>.yaml` + `manifests/skill-packs/<name>.yaml` → a `manifests/optional/` manifest is intentionally NOT installable via harnessed (CodeGraph self-installs).
- Manifest schema: `cli-npm` shape (sister `manifests/tools/ctx7.yaml`): type/component_type/category/install_type + install{method:npm-cli, cmd, npm_version, idempotent_check} + verify + uninstall + upstream_health + signed_by + platforms. License must be whitelist (MIT ✓).
- Doctor: `CheckResult {name, status: pass|warn|fail, message, fix?}`; `CHECKS` registry array in `doctor-registry.ts` (currently 12); `warn ≠ fail` (doctor exits 0 on warn). `tests/cli/doctor.test.ts` pins `CHECKS.length` (3 assertions: 12) + asserts summary `'pass'`.
- `capabilities.yaml` tool entry shape (sister chrome-devtools-mcp): `impl / cmd / since / category / description / fires_when`. Validated by `check-workflow-schema`.

## Locked decisions

- **D1 — catalog + detect only** (chosen): harnessed does NOT run CodeGraph's install. The manifest DESCRIBES CodeGraph's own commands (provenance/discoverability); the doctor detects presence and points users at `npx @colbymchenry/codegraph`.
- **D2 — opt-in via `manifests/optional/`** (NEW dir): NOT globbed by install-base → never in the base profile. NOT resolvable by `harnessed install` → CodeGraph self-installs. The manifest still VALIDATES against the schema (well-formed catalog).
- **D3 — manifest type `cli-npm`** (npm global CLI is the install vehicle; `codegraph install` does the MCP wiring): mirror ctx7's cli-npm shape. install.cmd describes the real flow; verify `codegraph status`; uninstall `codegraph uninstall`. MIT license (whitelist).
- **D4 — doctor check always-pass** (opt-in tool absence is NOT a health failure): detect `.codegraph/` in cwd (fs, deterministic, testable). present → `pass` "CodeGraph index detected". absent → `pass` "CodeGraph not configured (optional — `npx @colbymchenry/codegraph` to enable)". Always pass → doctor summary stays green; no nag.
- **D5 — capability map entry**: add `codegraph` to `capabilities.yaml` as a tool entry (catalog/discoverability), conforming to the tool-entry shape; no workflow wires it (no routing auto-suggest — that was the rejected ambitious option).
- **D6 — TDD red-first** for the doctor check + manifest validation.

## Scope

- `manifests/optional/codegraph.yaml` (NEW dir + file) — cli-npm manifest, MIT, describes CodeGraph's own install/verify/uninstall.
- `src/cli/lib/check-codegraph.ts` (NEW) — `checkCodeGraph(cwd?): CheckResult`, fs-detect `.codegraph/`, always-pass + info.
- `src/cli/lib/doctor-registry.ts` — append `checkCodeGraph` to `CHECKS` (12→13).
- `tests/cli/doctor.test.ts` — bump the 3 `CHECKS.length`/`toHaveLength` assertions 12→13.
- `workflows/capabilities.yaml` — add the `codegraph` tool entry.
- `tests/...` — manifest-validates test + check-codegraph present/absent test.

## Out of scope (do NOT touch)

- Running CodeGraph's install / vendoring any CodeGraph code (D1 — self-installs).
- Adding CodeGraph to the base profile or `harnessed install` (D2 — opt-in).
- Routing/decision-rule auto-suggest (rejected ambitious option).
- checkpoint internals (this is the manifest/capability layer); Phase 19.

## Invariants

- No-vendor: only a manifest + detection; zero upstream code copied.
- opt-in: never in base; never auto-installed; doctor never fails on absence.
- License whitelist (MIT) — manifest passes schema validation.
- KARPATHY-minimal; TDD red→green; full gate green vs the post-Phase-17 baseline (1280); Windows CI green; biome preempt; NEVER `git add -A`; NEVER push without approval.

## Acceptance

1. `manifests/optional/codegraph.yaml` validates (`validateManifestFile().ok === true`); MIT; describes codegraph install/verify/uninstall.
2. It is NOT in the base profile (install-base does not glob `manifests/optional/`) and NOT resolvable by `harnessed install`.
3. `checkCodeGraph`: present (`.codegraph/` exists) → pass "detected"; absent → pass "optional, not configured" + enable hint. Always pass. (unit)
4. doctor registry has 13 checks; `harnessed doctor` summary stays `'pass'`; the 3 length assertions updated.
5. `capabilities.yaml` has a conforming `codegraph` tool entry; `check-workflow-schema` still green.
6. Full test gate green; biome clean.
