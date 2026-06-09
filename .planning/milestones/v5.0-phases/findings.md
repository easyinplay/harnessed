# findings — harnessed v5.0 State Machine Core

## Absorption source (Trellis + comet) — key takeaways
- Both deliberately avoid an FSM library → validates harnessed D-02 KARPATHY-minimal 3-state.
- comet `require_verification_evidence` (real report file must exist) → C evidence guard.
- comet `--recover` structured DONE/PENDING/BROKEN → B `status --recover`.
- comet SHA256 handoff drift → F unified into evidence `[{path,sha256}]`.
- Trellis dual-layer (coarse status DB + fine prompt-only) → harnessed gap: no per-sub record.
- Trellis admits `in_progress` overload = recovery can't tell which step → exactly the G1 gap.

## harnessed existing pieces (reuse, do NOT rebuild)
- `src/cli/checkpoint.ts` — already has `start|complete|fail <sub>`; extend, don't replace.
- `src/checkpoint/state.ts` — `activate/pause/complete` + `withLock` + `writeFileAtomic`. Ledger writes go through `writeCurrentWorkflow` (already atomic+locked).
- `src/checkpoint/schema/currentWorkflow.v1.ts` — `Value.Check` + additionalProperties:false. Additive Optional field is backward-compatible (old files pass).
- `src/cli/gates.ts` — produces `{fire:[{sub,order,mode,gate,is_master}], skip:[{sub,reason}], parallelism}`. This IS the `--plan` input shape (verbatim).
- `src/cli/status.ts` — already reads state + prints lock holder; `--recover` is a richer read of the same file.
- `src/checkpoint/resume.ts` — reads `last_checkpoint_path`; add ledger drift re-hash.
- Leaf `workflow.yaml` already has `artifacts_expected` (e.g. task/code → progress.md) — reuse as evidence declaration, no new syntax.

## gates plan shape (from src/cli/gates.ts, verified)
```
{ master, fire:[{sub, order?, mode?, gate?, is_master?}], skip:[{sub, reason}],
  parallelism:{escalate_to_teams, reason} }
```
seedLedger consumes fire[] + skip[] (ignores parallelism/master).

## Risk notes (from eng-review)
- F2 budget: AVOIDED by D1 (ledger not in checkpoint snapshot).
- F3 none_declared blind spot: verify leafs may lack artifacts_expected → Phase 7 backfill is the real fix; three-state prevents false-pass meanwhile.
- fail-closed (evidence) vs fail-soft (gate) are DIFFERENT postures — ADR-0033 records this so a future "unify error handling" can't collapse them.

## Windows/dev quirks
- Git Bash + PowerShell; e2e in PowerShell. biome check --write before TS commit (3 CI-red recurrences).
- HARNESSED_ROOT_OVERRIDE env for test isolation.
