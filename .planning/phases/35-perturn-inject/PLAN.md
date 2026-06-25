---
phase: 35
milestone: v11.0
title: per-turn injection hook (UserPromptSubmit wiring + cross-harness session seam)
status: ready-to-execute
created: 2026-06-25
requirement: REQ-v110-perturn-inject
depends_on: [34, 26, 27, 28]
blocks: [36]
verified_refs:
  - "src/installers/lib/platform.ts:40 PlatformDescriptor interface (exists — ADD sessionIdEnv field)"
  - "src/installers/lib/platform.ts:70 claudeDescriptor (exists — populate sessionIdEnv='CLAUDE_CODE_SESSION_ID')"
  - "src/installers/lib/platform.ts:104 codexDescriptor (exists — populate sessionIdEnv=null)"
  - "src/installers/lib/platform.ts:148 detectPlatform (exists — reused, no change)"
  - "src/checkpoint/workflowStore.ts activeKey (exists — Phase 34; REFACTOR off hardcoded CLAUDE_CODE_SESSION_ID → detectPlatform().sessionIdEnv)"
  - "bin/harnessed-inject-state.mjs:143 const key = repoKey(process.cwd()) (exists — make session-aware: activeKey-equivalent slot + session→bare fallback)"
  - "src/checkpoint/injectState.ts:147 buildInjection (exists — takes wf arg; NO production reader other than the bin → read-path change is bin-only)"
  - "manifests/cc-hooks/dashboard-autospawn.yaml (exists — sister template for the cc-hook-add manifest)"
  - "manifests/optional/ (exists — opt-in dir; install.ts:72 resolves it, setup.ts auto-glob EXCLUDES it → opt-in by construction)"
  - "src/manifest/schema/installMethods/ccHookAdd.ts:18 HookEvent union incl. UserPromptSubmit (exists — feasibility proven)"
  - "tests/installers/platform.test.ts (exists — add sessionIdEnv cells)"
  - "tests/checkpoint/workflowStore.test.ts (exists — activeKey-via-seam + codex→null cells)"
  - "tests/checkpoint/injectState.test.ts:208 bin parity (exists — deterministic session env + session-keyed read cell)"
  - "manifests/optional/perturn-inject.yaml (NEW)"
---

# Phase 35 — per-turn injection hook (Spec 3/G)

## Goal

Make the per-turn `<workflow-state>` + `<project-context>` injection actually fire **every turn** by
wiring the already-built `bin/harnessed-inject-state.mjs` as a (opt-in) **UserPromptSubmit** hook, AND
make that injection read the **current session's** workflow slot (Phase 34 integration) — resolving
the session-id env **through the PlatformDescriptor seam** so the harness stays cross-harness, not
welded to Claude Code. Closes the v5.0 deferred Spec 3/G.

## Why this phase is mostly wiring (research finding)

The injection logic ALREADY exists and is parity-tested: `buildInjection` (injectState.ts, the pure
builder) + `bin/harnessed-inject-state.mjs` (the self-contained hot-path bin). What was missing:
1. **No CC hook registers it** — the only `cc-hook-add` manifest today is `dashboard-autospawn.yaml`
   (SessionStart). So the breadcrumb is built but never injected per turn.
2. **The bin reads the bare `repoKey` slot** (line 143), so after Phase 34 (which writes the active
   workflow to `<repoKey>::<sessionId>`) it would miss the session slot and fall back to the legacy
   mirror — i.e. inject the **last-writing** session's state under concurrency.

Feasibility of a CC per-turn hook is already proven: `ccHookAdd` supports `UserPromptSubmit` and a
working SessionStart hook ships today. No `/plan-eng-review` blocker.

## Design (locked via superpowers:brainstorming 2026-06-25, user-approved)

**Cross-harness session seam (the core decision).** `CLAUDE_CODE_SESSION_ID` is Claude-Code-specific;
harnessed targets multiple harnesses (the Phase 26–28 PlatformDescriptor seam already abstracts
claude/codex). So the session-id env name becomes a **descriptor field**, not a hardcode:
- Add `sessionIdEnv: string | null` to `PlatformDescriptor`. claude → `'CLAUDE_CODE_SESSION_ID'`;
  codex → `null` (no verified session env → degrades to single-session bare `repoKey`, correct, not a
  regression; anti-stale — do not invent a codex session var before it exists).
- `activeKey()` (Phase 34) is **refactored** off the hardcoded env to
  `detectPlatform().sessionIdEnv` → read that env (null → bare `repoKey`). Same behavior for claude;
  now correct for any future harness. (Phase 34 is committed but NOT pushed — zero-cost to fix now;
  leaving the hardcode would be CC-coupling tech debt.)

**Bin session-awareness (parity-preserving).** The bin is self-contained plain JS (no project
imports, hot path) and already replicates `repoKey` + `harnessedRoot`. It gains a minimal
descriptor-mirror: resolve the session env from `HARNESSED_PLATFORM` (claude→`CLAUDE_CODE_SESSION_ID`,
codex→null; default claude), read it, compute the `<repoKey>::<sid>` slot with the **same
session→bare→legacy fallback** the TS read uses. Because each harness sets only its own session env,
this stays parity-equal to `detectPlatform().sessionIdEnv` for the realistic cases. (Simplification vs
full `detectPlatform`: the bin uses `HARNESSED_PLATFORM`-or-default rather than the `.platform`-pin /
auto-probe precedence — documented; the pin/auto-probe governs state-root selection, which the bin
already covers via `HARNESSED_ROOT_OVERRIDE`. The parity test sets matching signals.)

**Wiring = opt-in.** NEW `manifests/optional/perturn-inject.yaml` (`cc-hook-add`, `UserPromptSubmit`,
`node bin/harnessed-inject-state.mjs`), mirroring `dashboard-autospawn.yaml`. `manifests/optional/` is
opt-in by construction (`harnessed install perturn-inject`; `setup` auto-glob covers only
tools+skill-packs). Rationale: every-turn injection has a token cost (~1500 budget) and only matters
in a repo running a harnessed workflow — user opts in. The bin already exits 0 silently when there is
no workflow, so an enabled hook in a non-workflow repo is a cheap no-op.

## Tasks

### T35.1 — `sessionIdEnv` on PlatformDescriptor (TDD: red → green)
- **File**: `src/installers/lib/platform.ts`. Add `sessionIdEnv: string | null` to the
  `PlatformDescriptor` interface; populate `claudeDescriptor` → `'CLAUDE_CODE_SESSION_ID'`,
  `codexDescriptor` → `null`. No new resolver needed (consumers read `detectPlatform().sessionIdEnv`).
- **Tests** (`tests/installers/platform.test.ts`): claude descriptor exposes `'CLAUDE_CODE_SESSION_ID'`;
  codex exposes `null`; `detectPlatform()` default (claude) exposes the claude value.
- **Acceptance**: red→green; existing platform/platform-codex/dual-platform cells unchanged; gate green.

### T35.2 — `activeKey()` resolves session env via the seam (TDD: red → green)
- **File**: `src/checkpoint/workflowStore.ts`. Replace the hardcoded
  `process.env.CLAUDE_CODE_SESSION_ID?.trim()` in `activeKey` with: resolve `envName =
  detectPlatform().sessionIdEnv`; `sid = envName ? process.env[envName]?.trim() : undefined`;
  `sid ? `${repoKey}::${sid}` : repoKey`. (Import `detectPlatform` from `../installers/lib/platform.js`.)
- **Tests** (`tests/checkpoint/workflowStore.test.ts`): claude default + `CLAUDE_CODE_SESSION_ID` set →
  composite (existing cells keep passing); **`HARNESSED_PLATFORM=codex` → `sessionIdEnv` null → bare
  `repoKey` even when `CLAUDE_CODE_SESSION_ID` is set** (proves de-hardcoding); no env → bare.
- **Acceptance**: red→green; state.ts:91/109 consumers unaffected (activeKey signature unchanged);
  gate green. NOTE: this changes Phase-34 internals — call it out (de-hardcode), not a regression.

### T35.3 — bin session-aware slot read (TDD: red → green via the parity test)
- **File**: `bin/harnessed-inject-state.mjs`. Resolve the session env (HARNESSED_PLATFORM→map, default
  claude→`CLAUDE_CODE_SESSION_ID`, codex→null) → compute `<repoKey>::<sid>`; `readWorkflow` tries the
  session slot, then the bare `repoKey` slot, then the legacy singleton (extend the existing
  two-tier fallback to three-tier).
- **Tests** (`tests/checkpoint/injectState.test.ts`): make the existing bin-parity cells deterministic
  w.r.t. the session env (explicitly clear `CLAUDE_CODE_SESSION_ID` in the bin `env`, OR assert via the
  bare fallback); ADD a cell: session env set + slot written under `<repoKey>::<sid>` → bin reads the
  session's workflow (not the bare/legacy one); parity vs `buildInjection(...)` on the same `wf`.
- **Acceptance**: red→green; bin stdout still byte-matches `buildInjection` on identical `wf`; concurrent
  sessions inject their own state; gate green.

### T35.4 — opt-in UserPromptSubmit manifest (NEW)
- **File**: `manifests/optional/perturn-inject.yaml` (NEW, mirror `dashboard-autospawn.yaml`):
  `type: cc-hook`, `install.method: cc-hook-add`, `hook_event: UserPromptSubmit`,
  `hook_command: "node bin/harnessed-inject-state.mjs"`, `hook_matcher` per UserPromptSubmit shape,
  idempotent `grep` check, `verify`, `platforms: [linux, darwin, win32]`, `signed_by: easyinplay`.
- **Tests**: validate the manifest against `schemas/manifest.v1.schema.json` (sister to however
  cc-hooks manifests are currently asserted — reuse the existing manifest-validation test harness; if
  none covers cc-hooks, add a focused parse+schema-check cell).
- **Acceptance**: manifest validates; `harnessed install perturn-inject` resolves it (optional path);
  NOT picked up by `setup` auto-glob (stays opt-in); gate green.

### T35.5 — gate + end-to-end verify
- **Acceptance**: `corepack pnpm exec biome check --write` clean; `tsc` exit 0; full `vitest`
  **serialized** exit 0 vs the 1456 baseline (+ new cells). End-to-end (PowerShell): build `dist`;
  set `CLAUDE_CODE_SESSION_ID`, seed a workflow under `<repoKey>::<sid>` via `harnessed checkpoint
  start`, run `node bin/harnessed-inject-state.mjs` → stdout contains that session's `<workflow-state>`;
  a second session id with its own slot → its own state; `HARNESSED_PLATFORM=codex` → bin reads bare
  `repoKey` (no session scoping). Confirm the manifest installs a UserPromptSubmit entry into a temp
  settings.json (idempotent re-install → skip).

## Out of scope (YAGNI)
- NO default-on wiring (opt-in only); NO codex session env (descriptor `null` until a real one exists).
- NO change to `buildInjection` (pure builder, no production reader but the bin).
- NO new injection content (workflow-state / project-context blocks unchanged) — this phase is wiring +
  session-correctness only.
- scale-adaptive verify (Phase 36) — next phase.
- schema / schemaVersion — UNCHANGED.

## Goal-backward check
Goal = "per-turn injection fires every turn AND reads the current session's slot, cross-harness-clean."
T35.1 puts the session-env name on the descriptor (cross-harness seam). T35.2 routes `activeKey`
through it (de-hardcodes Phase 34). T35.3 makes the actual injector (the bin) read the session slot
with parity preserved. T35.4 wires the bin to UserPromptSubmit (opt-in) = the "fires every turn"
deliverable. T35.5 proves both the firing and the session-correctness + gate. Every clause of
REQ-v110-perturn-inject is covered; cross-harness coupling is removed, not added.
