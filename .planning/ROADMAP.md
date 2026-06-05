# ROADMAP — harnessed

> Regenerated 2026-06-05 from `.planning/intel/` reconciliation.
> Shipped history = indexed archive (do NOT re-plan). Active milestone = **v5.0 State Machine Core (Spec 1)**.
> Current published: **v4.1.3** · v5.0 phases reference `.planning/v5.0/task_plan.md`.

---

## Shipped milestones (archived index)

> Delivered baseline. Detail in `.planning/milestones/*-MILESTONE-AUDIT.md` + `CHANGELOG.md` (46 releases) + `.planning/RETROSPECTIVE.md`.

| Milestone | Shipped | Summary |
|-----------|---------|---------|
| v0.1.0 | 2026-05-12~14 | manifest 引擎 + research workflow. |
| v0.2.0 | 2026-05-16 | sub-task loop + extension installers. |
| v0.3.0 | 2026-05-17 | plan-feature + checkpoint engine; routing 30/30 100%. |
| v0.4.0 | 2026-05-19 | dogfooding + 稳定期 (benchmark, audit log, community). |
| v2.0 | 2026-05-20 | Architecture Refactor — pure bundled SoT + capabilities + judgments. |
| v3.0 | 2026-05-21 | 4-Stage Namespace-Layered Workflow — master orchestrator + 22 sub-workflow + L0 disciplines. ADR-0030/0031/0032. |
| v0.5.0 / v1.0 GA | 2026-05-22 | v1.0-RC2 hardening → production GA. |
| v3.9.x | 2026-05-24~30 | maintenance series (v3.9.3→v3.9.26), dogfood bug fixes. |
| v4.0.0 | 2026-05-30 | orchestration-brain redesign — gates/prompt/checkpoint CLIs, CC-native spawn. |
| v4.1.0→v4.1.3 | 2026-05-30~06-04 | yaml SoT richness + code-review fixes + P0 data-loss fixes. 1107 tests. |

---

## Active milestone: v5.0 State Machine Core (Spec 1)

**Goal**: Add a structured progress ledger + fail-closed evidence guard + `status --recover` to harnessed's workflow state machine (absorbing Trellis/comet patterns). Additive optional schema, single SoT (`current-workflow.json`), no version bump, no FSM library.

**Design**: LOCKED (7 brainstorm + 3 eng-review D1/D2/D3) — ADR-0033 (Proposed) + `.planning/v5.0/STATE-MACHINE-CORE-DESIGN.md`. No open gray areas.

**Invariants**: ADR-0029 gate fail-soft UNCHANGED (evidence guard is separate fail-CLOSED); atomic write + dir lock reuse; KARPATHY-minimal; Windows CI green.

### Phases

- [x] **Phase 1: Schema extension** - Add EvidenceRef + SubProgressEntry + sub_progress to currentWorkflow.v1 (additive, no bump).
- [x] **Phase 2: ledger.ts pure functions** - seedLedger / markSub / nextPending (TDD, no I/O).
- [x] **Phase 3: evidence.ts** - hashFile / checkArtifacts / detectDrift (TDD, fs+crypto isolated).
- [x] **Phase 4: checkpoint CLI wiring** - start --plan (seed) / complete (fail-closed guard) / fail.
- [x] **Phase 5: status --recover + resume drift** - structured recovery render + evidence re-hash drift warns.
- [x] **Phase 6: generateCommands ORCHESTRATOR body** - deterministic gates→start→complete/fail sequence.
- [x] **Phase 7: verify/* artifacts_expected backfill** - every verify leaf declares ≥1 artifact.
- [x] **Phase 8: Release gate** - e2e ✅ + verify (2 reviewers, 2 P0 + 5 P1 fixed) + simplifier; 1166 tests / tsc 0 / biome clean; **bumped 4.2.0** (semver minor, additive — not 5.0.0); STOP before push (pending user approval).

---

## Phase Details

### Phase 1: Schema extension
**Goal**: `currentWorkflow.v1` schema carries an optional progress ledger without breaking existing state files.
**Depends on**: Nothing (first phase)
**Requirements**: REQ-v5-additive-schema (E)
**Success Criteria** (what must be TRUE):
  1. A `current-workflow.json` written before v5.0 (no `sub_progress`) still passes `Value.Check`.
  2. A new `current-workflow.json` carrying `sub_progress` with `evidence` entries passes `Value.Check`.
  3. `checkpoint.v1.ts` is unchanged (no snapshot ledger copy — single SoT preserved).
  4. `tsc --noEmit` clean; existing state tests green.
**Plans**: TBD
**Status**: Done (working tree, uncommitted)

### Phase 2: ledger.ts pure functions
**Goal**: A pure, I/O-free ledger module that seeds and transitions per-sub progress.
**Depends on**: Phase 1
**Requirements**: REQ-v5-ledger (A)
**Success Criteria** (what must be TRUE):
  1. `seedLedger(plan)` maps each fired sub to `{pending, gate_fired:true}` and each skipped sub to `{skipped, gate_fired:false, reason}`.
  2. `markSub` returns a new array (input not mutated) and throws when the sub is not in the ledger.
  3. `nextPending` returns the first pending sub (or null when none remain).
  4. `ledger.ts` performs zero I/O; tests go RED before GREEN.
**Plans**: TBD

### Phase 3: evidence.ts
**Goal**: An isolated evidence module that hashes artifacts and detects drift.
**Depends on**: Phase 1
**Requirements**: REQ-v5-evidence-guard (C, hashing/detection half)
**Success Criteria** (what must be TRUE):
  1. `checkArtifacts` returns `none_declared` when a leaf workflow.yaml declares no `artifacts_expected`.
  2. With all declared artifacts present, it returns `verified` plus each `{path, sha256}`.
  3. With a declared artifact absent, it returns the missing path(s) and does not mark verified.
  4. `detectDrift` flags a mutated file and returns empty for unchanged files; tests run in tmpdir isolation.
**Plans**: TBD

### Phase 4: checkpoint CLI wiring
**Goal**: The checkpoint CLI seeds the ledger and enforces the fail-closed evidence guard on completion.
**Depends on**: Phase 2, Phase 3
**Requirements**: REQ-v5-evidence-guard (C, CLI half), REQ-v5-ledger (A, wiring)
**Success Criteria** (what must be TRUE):
  1. `checkpoint start <master> --plan <json>` writes `current-workflow.json` with a seeded ledger; absent/empty `--plan` degrades to an empty ledger.
  2. `checkpoint complete <sub>` with a missing declared artifact exits 1, leaves the entry pending, and prints the missing list.
  3. `checkpoint complete <sub> --force` marks done with `evidence_status:'overridden'`; a present artifact marks `'verified'`; none declared marks `'none_declared'`.
  4. `checkpoint fail <sub>` transitions the entry to failed; all writes are atomic + locked.
**Plans**: TBD

### Phase 5: status --recover + resume drift
**Goal**: A user recovering after compaction sees full ledger state and any evidence drift.
**Depends on**: Phase 4
**Requirements**: REQ-v5-recover (B), REQ-v5-handoff-drift (F)
**Success Criteria** (what must be TRUE):
  1. `harnessed status --recover` renders every sub with status markers, `evidence_status`, and `→ next: harnessed prompt <sub>`.
  2. An empty ledger degrades gracefully to "no ledger — run gates + start".
  3. `none_declared` renders distinctly from `verified` (not shown as a pass).
  4. `resume` and `status --recover` re-hash evidence paths and emit a drift warning (not a block) on sha256 mismatch.
**Plans**: TBD

### Phase 6: generateCommands ORCHESTRATOR body
**Goal**: Generated orchestrator command bodies deterministically drive the gates→ledger→evidence sequence.
**Depends on**: Phase 4
**Requirements**: REQ-v5-orchestrator-body
**Success Criteria** (what must be TRUE):
  1. The generated ORCHESTRATOR body emits `gates → checkpoint start --plan`, then per-sub `prompt`+spawn+`checkpoint complete`, then `checkpoint fail` on error.
  2. Affected command markdown is regenerated under the harnessed-generated marker.
  3. The generated-body snapshot test is updated and passes; biome + tsc clean.
**Plans**: TBD

### Phase 7: verify/* artifacts_expected backfill
**Goal**: The evidence guard is real where it matters most — every verify leaf declares its artifacts.
**Depends on**: Phase 3
**Requirements**: REQ-v5-verify-backfill (D2-followup)
**Success Criteria** (what must be TRUE):
  1. Every `workflows/verify/*/workflow.yaml` leaf declares ≥1 `artifacts_expected`.
  2. `check-workflow-schema` passes after the backfill.
  3. An e2e run produces no `none_declared` for any verify sub.
**Plans**: TBD
**Status**: Done (working tree, uncommitted)

### Phase 8: Release gate
**Goal**: v5.0 ships green across the full quality gate and is bumped to 5.0.0 (pending user approval to push).
**Depends on**: Phase 5, Phase 6, Phase 7
**Requirements**: REQ-v5-release
**Success Criteria** (what must be TRUE):
  1. An e2e PowerShell run exercises gates → start --plan → complete (missing⇒exit1 / --force⇒pass / none_declared) → status --recover → mutate artifact⇒drift warn.
  2. `pnpm exec biome check --write`, `tsc --noEmit`, and full `vitest run` are all green.
  3. `package.json` is bumped to 5.0.0 with a CHANGELOG v5.0.0 entry and STATE.md updated.
  4. Work STOPS before push — no remote push without explicit user approval.
**Plans**: TBD

---

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Schema extension | 0/0 | Done (working tree) | 2026-06-05 |
| 2. ledger.ts pure functions | 0/0 | Not started | - |
| 3. evidence.ts | 0/0 | Not started | - |
| 4. checkpoint CLI wiring | 0/0 | Not started | - |
| 5. status --recover + resume drift | 0/0 | Not started | - |
| 6. generateCommands ORCHESTRATOR body | 0/0 | Not started | - |
| 7. verify/* artifacts_expected backfill | 0/0 | Done (working tree) | 2026-06-05 |
| 8. Release gate | 0/0 | Not started | - |

---

## Deferred (same v5.0 milestone, future specs)

- **Spec 2** — session-scoped state (`sessions/<CLAUDE_SESSION_ID>.json`) + single-session fallback.
- **Spec 3** — per-turn injection hook + scale-adaptive verify strength.
