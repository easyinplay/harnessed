# Phase 34 findings — session-scoped workflow state

> PWF findings. Research + locked decisions + gotchas. Distilled, not a transcript.

## Brainstorming decisions (superpowers:brainstorming 2026-06-25, user-approved)

1. **Keying = composite key `<repoKey>::<sessionId>`** (user-chosen over separate `sessions/<id>.json`
   and over nested map). Rationale: Phase 15 already moved state to `workflows.json` keyed by `repoKey`;
   composite key overlays the session axis on that store with zero schema change + one write/lock path.
2. **Session id source** = `process.env.CLAUDE_CODE_SESSION_ID`. Verified CC exposes it to Bash tool
   calls (`CLAUDE_CODE_SESSION_ID=60552b8e-eaf8-41df-b654-95d4a0d5dc6c`). NOTE the var is
   `CLAUDE_CODE_SESSION_ID`, **not** `CLAUDE_SESSION_ID` (the v5.0 sketch + old REQ text were wrong).
3. **Read fallback** = session-key → bare `repoKey` → null (single→multi seamless; in-flight + legacy
   compat-read stay visible).
4. **Write** = active key only; no bare-slot migration (read-fallback covers it).
5. **retro_meta + learnings stay keyed by `repoKey`** — repo properties, not session. Only the workflow
   slot (state.ts:91/109) flips. Deliberate asymmetry.
6. **Schema unchanged, no schemaVersion bump** — composite key is a legal `Record<string,…>` map-key.

## Codebase research (grep-verified)

- `src/checkpoint/workflowStore.ts:60` `repoKey(cwd)` = walk-up to nearest `.git` ancestor, else cwd.
  Store = `workflows.json`, `Record<repoKey, CurrentWorkflowV1>` (Phase 15, replaced the singleton).
- `readStoreRaw` (workflowStore.ts:77) legacy compat-read surfaces a legacy `current-workflow.json`
  in-memory under `repoKey()` — so the bare-repoKey read-fallback branch also reaches legacy data.
- Workflow-slot accesses (the ONLY two that flip to activeKey):
  - `state.ts:91` read `store.workflows[repoKey()] ?? null`
  - `state.ts:109` write `store.workflows[repoKey()] = s`
- repoKey uses that must STAY repoKey (NOT workflow slot):
  - `checkpoint.ts:271` → `retro_meta` counter (per-repo retro cadence)
  - `learnings.ts:86` → `appendLearning(repoKey())` (repo artifact)
- D7 dual-write (state.ts:114) mirrors the active envelope to the legacy `statePath()` singleton as a
  one-release rollback anchor — session-agnostic, leave unchanged.
- No existing `CLAUDE_CODE_SESSION_ID` reference in src/ or tests/ → genuinely new read.
- subagents carry `CLAUDE_CODE_CHILD_SESSION=1` + inherit the parent's `CLAUDE_CODE_SESSION_ID` →
  a subagent's checkpoint writes to the same session slot as its parent (correct: same workflow). No
  special-casing needed.

## Gotchas
- When no sid, `activeKey() === repoKey()` → the read-fallback `?? store.workflows[repoKey()]` second
  branch is redundant but harmless; keeps one code path for both modes.
- Tests MUST save/restore `process.env.CLAUDE_CODE_SESSION_ID` per cell (vitest shares process env) to
  avoid cross-cell bleed.

## TDD posture
TDD MANDATORY — this is core state-SoT data-structure keying; an off-by-one in the key silently
splits or merges sessions' ledgers (high error cost). No TDD-skip declaration.
