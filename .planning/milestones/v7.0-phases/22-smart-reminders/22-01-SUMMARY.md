# Phase 22 SUMMARY — Smart reminders (ship + retro)

> Status: ✅ implemented & gate-green 2026-06-14. Details: this dir + `22-CONTEXT.md` (locked D1–D8). Ships in the next release.

## What shipped

Two AI-judged nudges on ONE mechanism — envelope boolean flag set at `checkpoint complete` (allResolved) → emitted as a line by the G4 per-turn inject twins → the AI decides. The bin stays git-free + threshold-free (reads booleans only).

- **ship-reminder** — `ship_ready` (+`ship_commits`) on the envelope, git-derived (`shipReady.ts`: commits since the most recent `vX.Y.Z` tag > 0; no tag → all commits; fail-soft to false). Recomputed each completion → self-heals to false after a release. Inject line: `SHIP-READY: <n> commit(s) since the last release tag — consider shipping (harnessed release-preflight, then /ship)`.
- **retro-reminder** — trigger = **phase-count threshold** (user-chosen). A per-repo counter `retro_meta[repoKey].phases_since_retro` lives in the **store sidecar** (NOT the envelope, which `activate()` replaces each phase), incremented on each allResolved completion; at `>= N` (default 5, env `HARNESSED_RETRO_PHASE_THRESHOLD`) the envelope `retro_due` flag is set. Inject line: `RETRO-DUE: enough phases completed since the last retro — run /retro, then \`harnessed retro --done\``.
- **`harnessed retro --done`** (27th CLI) — reset entry (`/retro` is a gstack skill harnessed can't observe): zeroes the sidecar counter, stamps `last_retro_at`, clears `retro_due`.

## Key design facts (grounded in code)

- `activate()` writes a **fresh** envelope (no carry-forward) → the retro counter MUST live in the store sidecar, not the envelope. ship_ready needs no persistence (git is SoT, recomputed each completion).
- Both flags are additive-OPTIONAL schema fields (`CurrentWorkflowV1` + `WorkflowStoreV1.retro_meta`) → old files Value.Check-pass, NO schemaVersion bump.
- Reminder wiring sits AFTER auto-compact in the allResolved block, wrapped in try/catch (fail-soft — never blocks a checkpoint).
- Inject TS builder ≡ bin twin (parity test green).

## Acceptance (all met)

1. ✓ Additive-optional schema (existing state-store/workflowStore tests construct flag-less envelopes that still validate; no version bump).
2. ✓ `collectShipReady`: commits>0→true; 0→false; no tag→all commits; git error→false (unit, injected counter).
3. ✓ `retroMeta`: increment +1; `isRetroDue` at `>=N`; `resetRetro` zeroes+stamps; threshold env default 5 (unit).
4. ✓ allResolved `checkpoint complete` bumps the sidecar counter + writes ship flags + sets `retro_due` at threshold; NOT-allResolved sets nothing (integration).
5. ✓ Both inject twins emit SHIP-READY/RETRO-DUE from the flags; parity test green.
6. ✓ `harnessed retro --done` (runRetroDone) zeroes the counter + clears retro_due (integration).
7. ✓ Gate green: tsc 0, biome clean, 1335 passed / 5 skipped / 1 todo (+24 vs 1311).

## Files

- NEW: `src/checkpoint/shipReady.ts`, `src/checkpoint/retroMeta.ts`, `src/cli/retro.ts`.
- `src/checkpoint/schema/currentWorkflow.v1.ts` (+ship_ready/ship_commits/retro_due), `src/checkpoint/workflowStore.ts` (+retro_meta sidecar), `src/checkpoint/state.ts` (+mutateStore), `src/cli/checkpoint.ts` (allResolved reminder wiring), `src/checkpoint/injectState.ts` + `bin/harnessed-inject-state.mjs` (two lines, parity), `src/cli.ts` (register 27th).
- Tests: `tests/checkpoint/shipReady.test.ts`, `tests/checkpoint/retroMeta.test.ts`, `tests/checkpoint/injectState.test.ts` (+reminder cases & parity), `tests/cli/checkpoint-reminders.test.ts`.

## Deferred (D7)

`--snooze`/cooldown — v1 is persist-until-reset (ship self-heals on release; retro cleared by `harnessed retro --done`).
