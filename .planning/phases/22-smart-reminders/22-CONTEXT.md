# Phase 22 CONTEXT — Smart reminders (ship + retro)

> Decided 2026-06-14. TWO sibling reminders on ONE mechanism (envelope flag → per-turn inject line → AI judges). Trigger semantics differ (ship = cycle-level git fact; retro = milestone-level internal counter). Ships after 4.5.1. Builds both together (shared inject-line infra).

## Goal

When a verify/auto workflow completes, surface two AI-judged nudges via the existing G4 per-turn inject hook:
- **SHIP-READY** — there are unshipped commits since the last release tag → consider shipping.
- **RETRO-DUE** — enough phases have completed since the last retro → consider `/retro`.

Both are hints the AI judges, not hard gates. Reuse Phase 21 `release-preflight` as the downstream ship gate.

## Grounded surfaces (verified)

- `checkpoint complete` (`src/cli/checkpoint.ts`): `allResolved = nextPending(...) === null` is THE workflow-completion signal (sister to the existing `captureWorkflowLearnings` call). ✓
- Envelope schema `CurrentWorkflowV1` (`src/checkpoint/schema/currentWorkflow.v1.ts`): `additionalProperties: false`; additive-OPTIONAL fields pass old files without a schemaVersion bump. ✓
- `activate()` (`src/checkpoint/state.ts:144`) writes a **fresh** envelope — carries NO fields forward. → an envelope-stored retro counter would reset every new phase. ✓ (drives D3)
- Per-repo store `WorkflowStoreV1` (`src/checkpoint/workflowStore.ts`): `{schemaVersion, workflows: Record<repoKey, envelope>}`, `additionalProperties: false`. Survives workflow lifecycle. ✓
- Inject: `buildWorkflowStateBlock` (`src/checkpoint/injectState.ts:11`) + plain-JS twin `workflowStateBlock` (`bin/harnessed-inject-state.mjs:53`); parity test guards drift. Both read the envelope object. ✓
- `release-preflight.ts` has `git tag -l` + `git status` but NO commits-since-tag helper → NEW helper needed. ✓

## Locked decisions

- **D1 — two flags, one mechanism.** Envelope gains optional `ship_ready: boolean` + `retro_due: boolean` (additive, no version bump). Both inject twins emit a line per set flag. The bin reads ONLY these booleans — it never computes git or thresholds (hot-path stays dumb).
- **D2 — ship_ready = git-derived, recomputed at each allResolved complete.** New `src/checkpoint/shipReady.ts`: `collectShipReady(deps)` pure + `defaultShipDeps(cwd)` impure (git, fail-soft, sister to `release-preflight.defaultDeps`). Fact = commits since the most recent `vX.Y.Z` tag > 0 (`git tag -l 'v*.*.*'` newest + `git rev-list <tag>..HEAD --count`; no tag → all commits count). No carry-forward — git self-heals at the next completion. Optional `ship_commits: number` on the envelope feeds the hint text.
- **D3 — retro counter = internal, persisted in a STORE sidecar (NOT the envelope).** `WorkflowStoreV1` gains optional `retro_meta: Record<repoKey, {phases_since_retro: int, last_retro_at?: string}>`. Survives `activate()` by construction. Incremented by 1 on each allResolved complete. The bin does NOT read the sidecar (only checkpoint-complete + retro-reset touch it).
- **D4 — retro_due derivation.** At allResolved complete: after incrementing the sidecar counter, if `phases_since_retro >= N` → set envelope `retro_due: true`. `retro_due` is a derived cache on the envelope (re-set each completion from the persistent counter); the activate-gap until the next completion is acceptable (retro is low-frequency). Same self-heal pattern as ship_ready.
- **D5 — N threshold default 5, env `HARNESSED_RETRO_PHASE_THRESHOLD`.** Read only in the TS checkpoint-complete path; the bin never needs N (it reads the resolved boolean).
- **D6 — reset mechanism = explicit `harnessed retro --done`.** New tiny CLI (sister to `harnessed learn` / `reject`): resets the sidecar `phases_since_retro = 0`, stamps `last_retro_at`, clears envelope `retro_due`. `/retro` is a gstack skill harnessed can't observe, so the RETRO-DUE inject line advertises the reset verb: `RETRO-DUE: N phases since last retro — run /retro, then \`harnessed retro --done\``.
- **D7 — dismiss policy = persist-until-reset (v1).** No snooze/cooldown; the flag shows until an actual ship (ship_ready self-heals to false next completion) or `harnessed retro --done`. Low frequency → not noisy. `--snooze` is a deferred enhancement.
- **D8 — fail-soft everywhere.** Any git error, missing store, or unreadable input → flag stays unset (no reminder). A reminder mechanism must never block a checkpoint or a prompt.

## Inject line formats (both twins, parity-locked)

```
SHIP-READY: <ship_commits> commit(s) since the last release tag — consider shipping (harnessed release-preflight, then /ship)
RETRO-DUE: <n> phases since last retro — run /retro, then `harnessed retro --done`
```
Emitted inside `<workflow-state>` after the `next:` / BREAK-LOOP lines, before `</workflow-state>`.

## Scope

- `src/checkpoint/schema/currentWorkflow.v1.ts` — +`ship_ready`, +`ship_commits`, +`retro_due` (optional).
- `src/checkpoint/workflowStore.ts` — +`retro_meta` (optional) on `WorkflowStoreV1`.
- `src/checkpoint/shipReady.ts` — NEW: pure `collectShipReady` + impure `defaultShipDeps`.
- `src/checkpoint/retroMeta.ts` — NEW: pure `incrementPhases` / `isRetroDue` / `resetRetro` / `retroThreshold(env)`.
- `src/checkpoint/state.ts` — +`mutateStore(fn)` locked read-modify-write for the sidecar.
- `src/cli/checkpoint.ts` — allResolved block: set ship flags on the existing post-mark envelope write; bump sidecar + set retro_due.
- `src/checkpoint/injectState.ts` + `bin/harnessed-inject-state.mjs` — emit the two lines (parity).
- `src/cli/retro.ts` — NEW `harnessed retro --done` reset command; register in `cli.ts`.
- Tests: shipReady pure, retroMeta pure, injectState two-line block, bin parity, checkpoint-complete integration (ship flags + counter bump + retro_due), retro reset.

## Out of scope

- `--snooze` / cooldown (D7 deferred).
- Coupling retro reset to release tags (D6 chose explicit verb; a release ≠ a retro).
- Touching the bin's sidecar awareness (bin reads booleans only).
- The actual `/retro` skill (gstack-owned).

## Invariants

- Additive-optional schema only — NO schemaVersion bump (old stores/envelopes Value.Check-pass).
- Bin stays git-free + threshold-free + LLM-free (hot path); reads booleans only.
- Inject TS builder ≡ bin twin (parity test green).
- Fail-soft: no git / no store / error → no reminder, never a crash.
- KARPATHY-minimal; TDD red→green on the pure cores; biome preempt; full gate green; NEVER push without approval.

## Acceptance

1. Envelope `ship_ready`/`retro_due` + store `retro_meta` are additive-optional (old files still validate; no version bump). (unit)
2. `collectShipReady`: commits-since-last-`vX.Y.Z`-tag > 0 → true; 0 → false; no tag → counts all commits; git error → false. (unit, injected deps)
3. `retroMeta`: increment bumps by 1; `isRetroDue` true at `>= N`; `resetRetro` zeroes + stamps; threshold reads env default 5. (unit)
4. allResolved `checkpoint complete` sets `ship_ready`(+`ship_commits`) from git, bumps the sidecar counter, sets `retro_due` when `>= N`. NOT-allResolved completion does none of it. (integration)
5. Both inject twins emit the SHIP-READY / RETRO-DUE lines from the flags, in the documented format; parity test green. (unit + parity)
6. `harnessed retro --done` zeroes the counter + clears `retro_due`. (unit/integration)
7. Full gate green; biome clean.
