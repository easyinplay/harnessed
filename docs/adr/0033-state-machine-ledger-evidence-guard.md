# ADR 0033 — Workflow State Machine: Progress Ledger + Fail-Closed Evidence Guard

- **Status**: Proposed
- **Date**: 2026-06-05
- **Supersedes**: none
- **Relates to**: ADR-0029 (fail-soft gate eval), ADR-0031/0032 (4-stage namespace + cross-cutting disciplines)
- **Milestone**: v5.0 (Spec 1 of 3 — state machine core)
- **Design doc**: `.planning/milestones/v5.0-phases/STATE-MACHINE-CORE-DESIGN.md`

## Context

harnessed v4.1.3 tracks workflow position at one granularity: a 3-state machine
(`active`/`paused`/`complete`) in the singleton `current-workflow.json`, plus
per-phase checkpoint snapshots. A master orchestration chain (`task` → clarify →
code → test → deliver) has **no persisted record of which sub completed**. A crash
or context compaction mid-chain leaves only a `phase` string and a free-text
`last_task` — the same weakness Trellis documents for its overloaded `in_progress`
status.

Separately, `gates.ts` evaluates only **pre-conditions** (which subs fire). Nothing
verifies that a sub — especially a verify sub — actually produced output. An agent
can report a verify stage "complete" with no report artifact (the "fake
verification" failure mode that comet's `require_verification_evidence` exists to
block).

Absorption study (Trellis, comet) confirmed: (a) a structured per-sub ledger is the
fix for resume granularity; (b) a real-artifact existence check is the fix for fake
completion; (c) both projects deliberately avoid an FSM library, validating
harnessed's KARPATHY-minimal stance.

## Decision

### D1 — Progress ledger, ledger-only progression (no transition-event machine)

Add an optional `sub_progress: [{ sub, status, gate_fired, reason?,
evidence_status?, evidence? }]` to `current-workflow.json` (the **sole** live truth).
`status ∈ {pending, done, failed, skipped}`.

**The checkpoint envelope does NOT carry a ledger copy (eng-review D1).** A snapshot
copy was considered and rejected: it created a dual-source-of-truth precision risk
(`resume` reads the checkpoint, which can be staler than the live ledger) and a
1000-token budget risk (evidence sha256 × N subs). `resume` reads the ledger from
`current-workflow.json` — the same singleton it already reads `status` from.

Progression is **implicit field-writes**, not an event/transition state machine.
harnessed master chains are linear — the next sub is fixed by the `gates` plan
`order`; branching is already resolved upstream in gate eval (fire/skip). comet's
explicit `transition <event>` model is needed for its 5-phase topology with a
verify-fail back-edge; harnessed's topology does not justify that complexity.

Ledger is **seeded upfront** from the `gates` plan at `checkpoint start --plan`:
fired subs → `pending` (`gate_fired:true`), skipped subs → `skipped`
(`gate_fired:false`, with `reason`). This gives recovery the complete remaining
picture, not just completed history.

### D2 — Fail-CLOSED evidence guard (deliberate exception to ADR-0029)

`checkpoint complete <sub>` reads the leaf's existing `artifacts_expected`, and:
- any declared artifact **missing** → **block** (exit 1); entry stays `pending`.
- all present → compute sha256 of each → record `evidence:[{path,sha256}]`,
  `evidence_status:'verified'` → flip `done`.
- leaf declares **no** `artifacts_expected` → `evidence_status:'none_declared'` →
  flip `done`. This is NOT a pass — the guard had nothing to check. `status --recover`
  renders it distinctly so an undeclared verify leaf cannot masquerade as verified
  (eng-review D2, three-state posture).
- `--force` overrides a missing-artifact block, records `evidence_status:'overridden'`
  (audit trail surfaced in `status --recover`).

The three-state `evidence_status` exists because a boolean conflates "verified" with
"nothing to verify". Verify-stage leafs that have not yet declared `artifacts_expected`
get backfilled (tracked as a plan task) so the guard is real where it matters most.

This is **fail-closed**, the opposite posture from ADR-0029's gate fail-soft. The
two govern different questions:

| Concern | Question | Posture |
|---------|----------|---------|
| Gate eval (ADR-0029) | "should this sub run?" | fail-**soft** / fire |
| Evidence guard (ADR-0033) | "did this sub produce output?" | fail-**closed** / block |

A gate-eval operational fault must not be read as "skip" (fire instead). An absent
artifact at completion **must** be read as "not done" (block instead). Conflating
them either fires phantom subs or accepts fake completions. This ADR records the
distinction so a future "unify error handling" refactor cannot silently collapse the
evidence guard into fail-soft and re-open the fake-verification hole.

### D3 — Additive schema evolution, no version bump

`sub_progress` and `evidence` are added as **optional** fields to the existing v1
schemas. Old state/checkpoint files (without them) still pass `Value.Check`; new
files pass; readers use `?? []`. No migrator, no `SCHEMA_VERSIONS` bump. A bump is
reserved for when a field becomes required or an existing field's semantics change —
neither applies here.

### D4 — Unified evidence = handoff integrity

`evidence:[{path,sha256}]` serves both existence (D2) and cross-CC handoff drift:
`resume` / `status --recover` re-hash each path and emit a **drift warn** (not block)
on mismatch — cross-CC source files (e.g. Plan-CC's `PLAN.md`) may legitimately
evolve, so per cc-handoff.md the user adjudicates. Upstream `artifacts_expected`
auto-serves as the downstream handoff ref; no separate `handoff_refs` mechanism.

## Consequences

**Positive**
- Crash/compaction recovery becomes precise (`status --recover` shows done/pending/
  skipped + next command) — directly serves harnessed's context-rot-resistance pitch.
- Fake verification is structurally blocked, not prose-requested.
- Handoff drift is detected mechanically (scriptizes cc-handoff.md).
- Zero migration risk (additive optional); existing invariants (fail-soft gate,
  atomic write, dir lock, no FSM lib) preserved.

**Negative / risks**
- Evidence guard is N/A (`evidence_status:'none_declared'`) for any leaf that does
  not declare `artifacts_expected` — requires an audit + backfill (tracked in the
  plan), especially verify leafs. The three-state posture prevents this from reading
  as a false pass, but the guard is only real once the backfill lands.
- `--force` is an escape hatch; if overused it erodes the guard. Mitigated by the
  `evidence_status:'overridden'` audit flag surfaced in `status --recover`.
- Ledger lives only in `current-workflow.json` (D1) — no checkpoint-budget impact,
  but "recover purely from a checkpoint snapshot" is not supported (acceptable:
  `resume` reads the live singleton first).

**Neutral**
- D (session-scoped state) and G/H (per-turn hook, scale-adaptive verify) are
  out of scope here — deferred to v5.0 Spec 2 / Spec 3.

## Alternatives considered

- **Full comet-style transition-event machine** — rejected: linear topology doesn't
  need event-selected transitions; adds enum + transition table against KARPATHY-minimal.
- **Schema v2 bump + migrator** — rejected: all changes additive-optional; bump buys
  clean lineage at the cost of a migrator for zero compatibility benefit.
- **Ledger in a separate `<master>.progress.json`** — rejected: extra file + extra
  lock, no benefit over extending the singleton that `resume`/`status` already read.
- **Evidence guard as warn-only** — rejected: a warning does not block fake
  completion; equivalent to not having the guard.
