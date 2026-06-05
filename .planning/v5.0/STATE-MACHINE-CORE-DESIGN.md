# harnessed v5.0 — Workflow State Machine Core (Spec 1: A/B/C/E/F)

> Status: DESIGN LOCKED (superpowers:brainstorming, 2026-06-05)
> Pending: gstack `/plan-eng-review` → GSD `/gsd-plan-phase` + planning-with-files → execute → verify
> Author CC session: state-machine absorption from Trellis + comet
> Sister docs: docs/adr/0033-*.md (evidence guard fail-closed exception)

---

## 0. Provenance & motivation

Absorption study of two sister "assembly-ist prompt-orchestration" harnesses:

- **mindfold-ai/Trellis** — workflow.md SoT + per-turn hook renders state into prompt; dual-layer state (coarse status DB + fine phase/step prompt-only); session-scoped active-task pointer with single-session fallback. Admitted weakness: `in_progress` status overloads 9 steps → crash recovery can't tell which step.
- **rpamis/comet** — near-mirror of harnessed (Node+TS+pnpm+vitest, assembles OpenSpec + Superpowers). Explicit transition events + `require_*` exit guards; **verification evidence gate** (verify-pass requires real report file); SHA256 handoff traceability; `--recover` structured recovery context.

Both deliberately avoid an FSM library — confirms harnessed's D-02 KARPATHY-minimal 3-state choice.

### Gaps in harnessed (v4.1.3) this spec closes

| Gap | Current state | Closed by |
|-----|---------------|-----------|
| **G1 resume granularity** | workflow 3-state (active/paused/complete) only; no record of which sub in a master chain is done. Crash mid-`task` → checkpoint has `phase`+`last_task` string, no structured position. | A — structured progress ledger |
| **G2 no exit guards** | `gates.ts` only evaluates pre-conditions (fire/skip). Nothing checks verify actually produced evidence → "fake verification" risk. | C — evidence exit guard (fail-closed) |
| **G3 no structured recover** | `resume` prints one-line hint. After compaction, no "you are here, this is missing, do this next". | B — `status --recover` |
| **G5 handoff integrity unscripted** | cc-handoff.md is prose; no hash drift detection on Plan-CC → Execute-CC PLAN.md. | F — evidence sha256 drift |

(G4 session-scoped state = deferred Spec 2; per-turn hook G + scale H = deferred Spec 3.)

---

## 1. Scope (locked Q1 = decompose, core only)

This spec (Spec 1) locks the **state machine core + schema** only:
- **A** structured progress ledger
- **B** `harnessed status --recover`
- **C** verify evidence exit guard
- **E** ledger-only implicit progression (NO full transition-event machine)
- **F** handoff sha256 drift (unified into evidence)
- schema evolution strategy (additive, no version bump)

**Deferred to sibling specs** (same v5.0 milestone):
- Spec 2 — **D** session-scoped state (`sessions/<CLAUDE_SESSION_ID>.json`) + single-session fallback
- Spec 3 — **G** per-turn injection hook + **H** scale-adaptive verify strength

---

## 2. Locked decisions

| # | Decision | Choice | Rationale |
|---|----------|--------|-----------|
| Q2 | Progression model | **ledger-only implicit** + evidence as assertion hook; NO transition-event enum | harnessed master chains are linear (order fixed by gates plan); branching already in gate eval (fire/skip). comet needs events for its 5-phase + verify-fail back-edge topology; harnessed doesn't. KARPATHY-minimal. |
| Q3 | Ledger storage | **`current-workflow.json`** only (sole SoT; **eng-review D1 dropped the checkpoint snapshot copy**) | Ledger IS fine-grained "where am I" — same nature as the singleton pointer. Makes `status --recover` free. No checkpoint 1000-token budget impact. |
| Q4 | Schema migration | **additive optional fields, NO version bump** (stay v1) | Every addition is optional; `activate()` starts with empty ledger (no required new field). Old files (no field) still `Value.Check`-pass; new files pass. Zero migration code, zero data-loss. Bump only when a field becomes required or an old field's semantics change. |
| Q5 | Ledger population | **seed-upfront from gates plan** (fire→pending, skip→skipped+reason) | `status --recover` gets the complete picture (what remains, what was gated out + why), not just what's done. |
| Q6 | Evidence contract | reuse leaf `artifacts_expected`; **fail-CLOSED** guard at complete; `--force` records `evidence_overridden` | No new declaration syntax. Fail-closed blocks agents from reporting fake completion. Deliberate exception to ADR-0029 fail-soft (see ADR-0033). |
| Q7 | C+F unification | evidence = `[{path, sha256}]`; complete-missing → **block**, resume-drift → **warn** | One structure, two payoffs: existence (C, block) + handoff integrity (F, warn). Upstream `artifacts_expected` auto-serves as downstream handoff ref. |

---

## 3. Data structures (additive optional, no bump)

`src/checkpoint/schema/currentWorkflow.v1.ts` — add `sub_progress` (live truth):

```ts
const EvidenceRef = Type.Object(
  { path: Type.String({ minLength: 1 }), sha256: Type.String({ minLength: 1 }) },
  { additionalProperties: false },
)

const SubProgressEntry = Type.Object(
  {
    sub: Type.String({ minLength: 1 }),               // flattened name, e.g. "task-code"
    status: Type.Union([
      Type.Literal('pending'),
      Type.Literal('done'),
      Type.Literal('failed'),
      Type.Literal('skipped'),
    ]),
    gate_fired: Type.Boolean,
    reason: Type.Optional(Type.String()),             // skip reason (from gates plan skip[].reason)
    // D2 (eng-review) — three-state evidence posture, NOT a boolean.
    //   'verified'      — artifacts_expected declared AND all present (sha256 recorded)
    //   'none_declared' — leaf declares no artifacts_expected → guard N/A (NOT a pass)
    //   'overridden'    — --force used to bypass a missing-artifact block
    evidence_status: Type.Optional(
      Type.Union([
        Type.Literal('verified'),
        Type.Literal('none_declared'),
        Type.Literal('overridden'),
      ]),
    ),
    evidence: Type.Optional(Type.Array(EvidenceRef)),
  },
  { additionalProperties: false },
)

// added to CurrentWorkflowV1 object:
sub_progress: Type.Optional(Type.Array(SubProgressEntry)),
```

**D1 (eng-review) — single SoT: the checkpoint snapshot does NOT carry a ledger
copy.** `current-workflow.json` is the sole ledger source of truth. Rationale: the
snapshot copy created a dual-SoT precision risk (`resume` reads the checkpoint, which
can be staler than the live ledger) AND a 1000-token budget risk (evidence sha256 ×
N subs could blow `enforceBudget`). Dropping the copy collapses both. `resume` reads
the ledger from `current-workflow.json` (same file it already reads `status` from →
zero loss; "recover from snapshot only" was never reachable since `resume` reads the
live singleton first).

`sub_progress` optional on `CurrentWorkflowV1` only → old `current-workflow.json`
files validate unchanged; readers use `s.sub_progress ?? []`. `checkpoint.v1.ts` is
NOT modified.

---

## 4. Orchestration flow (ledger-only)

```
main session: harnessed gates task --task "..."            → JSON { fire[], skip[] }
              harnessed checkpoint start task --plan <gates-json>
                → activate() seeds current-workflow.json ledger:
                    fire[]  → { sub, status:'pending',  gate_fired:true }
                    skip[]  → { sub, status:'skipped', gate_fired:false, reason }
for each fired sub in order:
              harnessed prompt task-<sub>                   → spawn subagent
              harnessed checkpoint complete task-<sub>      ← evidence guard here
                → read leaf workflow.yaml `artifacts_expected`
                → fs.stat each:
                    missing → exit 1 (fail-CLOSED); entry stays 'pending'; print missing list
                    present → sha256 each → write evidence[] → flip status 'done'
                → --force: skip stat; set evidence_overridden:true; flip 'done'
              (on failure) harnessed checkpoint fail task-<sub> → status 'failed'
```

No event enum, no transition table. The next sub is determined by the gates plan `order`; the ledger only records outcomes. Write path stays funneled through `checkpoint.ts` (agents never write state files directly).

---

## 5. Evidence guard = fail-CLOSED (ADR-0033)

Two orthogonal error postures, must not be conflated:

| Concern | Question | Posture | Where |
|---------|----------|---------|-------|
| Gate eval | "should this sub run?" | **fail-soft / fire** (ADR-0029, unchanged) | `gates.ts` / `judgmentResolver` |
| Evidence guard | "did this sub actually produce output?" | **fail-closed / block** (ADR-0033, NEW) | `checkpoint complete` |

ADR-0033 fixes this distinction so a future "unify all error handling to fail-soft" refactor cannot silently re-open the fake-verification hole.

---

## 6. C + F unified: `evidence: [{ path, sha256 }]`

- **C existence** — `complete` with a missing `artifacts_expected` entry → block.
- **F handoff integrity** — `complete` computes sha256 → stored. `resume` / `status --recover` re-hash each evidence path; mismatch → **drift warn** (not block: cross-CC source files may legitimately evolve; per cc-handoff.md let the user adjudicate). Bonus: detects artifact deleted/corrupted post-completion.
- Upstream stage `artifacts_expected` auto-serves as downstream handoff ref (plan's `PLAN.md` = execute's input) — no new declaration.

`complete`-missing blocks; `resume`-drift warns. Not contradictory: block = "should be here at completion but isn't"; warn = "was here, changed since".

---

## 7. `harnessed status --recover` (B)

Reads `current-workflow.json`, prints structured position:

```
workflow: task (active)  started 2026-06-05T10:00:00Z
  clarify  ✅ done     evidence: .planning/.../DISCUSS.md
  code     ✅ done     evidence: progress.md
  test     ⏳ pending  (tdd-gate fired)              ← next
  deliver  ⬜ pending
  [skipped] (none)
→ next: harnessed prompt task-test
⚠ drift: progress.md sha256 changed since complete (was abc1234…, now def5678…)
```

One command after compaction answers: where am I, what's missing, what's next.

---

## 8. CLI surface (surgical)

| Command | Change |
|---------|--------|
| `checkpoint start <master>` | add `--plan <json>` (gates output) → seed ledger |
| `checkpoint complete <sub>` | add evidence guard + `--force` |
| `checkpoint fail <sub>` | flip ledger entry → `failed` (extends existing verb) |
| `status --recover` | NEW flag → structured ledger output + drift detection |
| `resume` | existing flow + evidence re-hash drift warn |

---

## 9. Component isolation (new files, single purpose)

| File | Responsibility | Depends on |
|------|----------------|------------|
| `src/checkpoint/ledger.ts` | pure fns `seedLedger(plan)`, `markSub(state, sub, status, evidence)` over `CurrentWorkflowV1Type` | schema types only |
| `src/checkpoint/evidence.ts` | `checkArtifacts(sub, packageRoot)` → `{ ok, found:[{path,sha256}], missing:[] }`; `hashFile(path)` | node:fs, node:crypto, leaf yaml loader |
| `src/cli/status.ts` (`--recover` branch) | recover formatter + drift compute + empty-ledger graceful degrade (D3) | ledger.ts, evidence.ts |
| schema: `currentWorkflow.v1.ts` + `checkpoint.v1.ts` | additive optional fields | — |

Each unit understandable/testable in isolation: ledger has no I/O (pure), evidence is the only fs/crypto touch, recover is pure formatting over read state.

---

## 10. Invariants preserved

- ADR-0029 gate fail-soft — unchanged (evidence fail-closed is a separate, new posture).
- v4.1.3 atomic write (`writeFileAtomic` / `writeFileSyncAtomic`) — ledger writes go through existing `writeCurrentWorkflow` / `writeCheckpoint` (already atomic + locked).
- proper-lockfile dir lock — ledger mutation is inside `writeCurrentWorkflow`'s `withLock`.
- KARPATHY-minimal — no FSM library; ledger is a plain array, progression is field writes.

---

## 11. Testing

- **unit** — `seedLedger` (fire→pending, skip→skipped+reason); `markSub` (pending→done/failed); drift detect (sha mismatch); `checkArtifacts` against a tmpdir (present → found+sha, missing → blocked list).
- **e2e (PowerShell)** — `gates task` → `checkpoint start --plan` → `checkpoint complete` (missing artifact ⇒ exit 1 / `--force` ⇒ pass) → `status --recover` (ledger render) → mutate artifact ⇒ drift warn.

---

## 12. Eng-review decisions (RESOLVED 2026-06-05, gstack /plan-eng-review)

| ID | Finding | Decision |
|----|---------|----------|
| **D1** | F1 dual-SoT precision (resume reads checkpoint, can be staler than live) + F2 1000-token budget risk from ledger in snapshot | **Single SoT** — checkpoint snapshot does NOT carry ledger. `current-workflow.json` is sole ledger SoT; `resume` reads it. `checkpoint.v1.ts` unchanged. |
| **D2** | F3 undeclared `artifacts_expected` → guard空过 looks identical to "verified" (false confidence) | **Three-state `evidence_status`** (`verified` / `none_declared` / `overridden`); `status --recover` marks each distinctly, never collapses to "done". |
| **D3** | F4 reliability of seeding (orchestrator must pipe `gates`→`start`) | **Two-step separate** (composability; `gates` is no-spawn plan SoT). Generated ORCHESTRATOR command body deterministically emits `gates`→`start`. `recover` degrades gracefully on empty ledger ("no ledger — run gates + start"). |
| **D2-followup** | verify leafs may lack `artifacts_expected` → evidence guard is N/A for the exact stage it most matters | **Plan task**: audit + backfill `artifacts_expected` on all `workflows/verify/*/workflow.yaml` leafs (no schema enforcement — kept lighter per user). |

Resolved sub-questions: `--plan` JSON = full `gates` output verbatim (gates is the SoT
producer). `recover` lives as `status --recover` flag (richer read of state `status`
already loads), not a separate `recover.ts`.
