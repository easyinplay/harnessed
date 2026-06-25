# Phase 35 findings — per-turn injection hook

> PWF findings. Research + locked decisions + gotchas. Distilled.

## Brainstorming decisions (superpowers:brainstorming 2026-06-25, user-approved)

1. **Session-env via the PlatformDescriptor seam, NOT a hardcoded `CLAUDE_CODE_SESSION_ID`.** User
   flagged: harnessed targets multiple harnesses (Phase 26–28 seam: claude/codex/…); hardcoding CC's
   env welds Phase 34/35 to Claude Code. → add `sessionIdEnv: string | null` to `PlatformDescriptor`
   (claude→`'CLAUDE_CODE_SESSION_ID'`, codex→`null`); `activeKey` + the bin resolve through it.
2. **De-hardcode Phase 34's `activeKey` in THIS phase** (it is committed but not pushed → zero-cost;
   otherwise CC-coupling tech debt). Same external behavior for claude.
3. **codex `sessionIdEnv = null`** — no verified codex session env; degrades to single-session bare
   `repoKey` (correct, not a regression). anti-stale: do not invent a codex var before it exists.
4. **Wiring = opt-in** (`manifests/optional/perturn-inject.yaml`), not default-on. Every-turn
   injection has a ~1500-token cost and only matters in a repo running a harnessed workflow; the bin
   already exits 0 silently with no workflow, so an enabled hook in a non-workflow repo is a cheap no-op.

## Codebase research (grep-verified)

- **Injection already built**: `src/checkpoint/injectState.ts` `buildInjection` (pure, takes `wf` arg)
  + `bin/harnessed-inject-state.mjs` (self-contained hot-path replica). Parity test at
  `tests/checkpoint/injectState.test.ts:208` runs the bin and byte-compares stdout to `buildInjection`.
- **`buildInjection` has NO production TS caller** other than its definition → the ONLY production
  reader is the bin → the session-aware read change is **bin-only** (+ the TS `activeKey` already done
  in Phase 34, which the bin mirrors). The TS builder needs no read-path change.
- **bin reads bare repoKey**: `bin/harnessed-inject-state.mjs:143` `const key = repoKey(process.cwd())`;
  `readWorkflow` = `workflows.json[key]` → legacy `current-workflow.json` fallback. After Phase 34 a
  session writes to `<repoKey>::<sid>`, so the bin misses it and falls back to the legacy mirror = the
  last-writing session under concurrency. → must become session-aware (3-tier: session→bare→legacy).
- **Hook feasibility proven**: `src/manifest/schema/installMethods/ccHookAdd.ts:18` HookEvent union
  includes `UserPromptSubmit`; `manifests/cc-hooks/dashboard-autospawn.yaml` is a working SessionStart
  cc-hook-add (the sister template).
- **opt-in by construction**: `src/cli/install.ts:72` resolves `manifests/{tools,skill-packs,optional}/`;
  `src/cli/setup.ts` auto-globs only `{tools,skill-packs}` → `optional/` is explicit-install only.
- **PlatformDescriptor**: `src/installers/lib/platform.ts:40` interface (8 fields, id union incl. codex),
  `claudeDescriptor`:70 / `codexDescriptor`:104 / `detectPlatform`:148 (HARNESSED_PLATFORM → .platform
  pin → auto-probe → claude). `sessionIdEnv` is genuinely new (no existing ref).

## Gotchas
- **Parity test env bleed**: the bin-parity cells spread `...process.env`, which carries the live
  `CLAUDE_CODE_SESSION_ID`. After T35.3 the bin computes a composite key and would miss the bare-key
  slot the test writes, surviving only via the bare fallback. Make the session env explicit in those
  cells (clear it, or write the composite slot) so the test asserts intent, not luck.
- **bin can't import `detectPlatform`** (self-contained). It replicates a minimal version:
  `HARNESSED_PLATFORM`→sessionEnv map (default claude). This is parity-equal to
  `detectPlatform().sessionIdEnv` for realistic cases because each harness sets only its own session
  env. Simplification vs full detectPlatform (skips `.platform`-pin / auto-probe for the SESSION env —
  those govern state-root, which the bin already handles via HARNESSED_ROOT_OVERRIDE). Document it.

## TDD posture
TDD MANDATORY — state-read slot selection + a cross-harness abstraction seam; a wrong session env or
slot silently injects another session's state (high error cost). No TDD-skip declaration.
