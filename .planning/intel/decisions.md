# Decisions Intel (ADRs)

> Synthesized by gsd-doc-synthesizer from 4 classified ADRs (2026-06-05).
> Precedence: ADR > SPEC > PRD > DOC. LOCKED ADRs cannot be auto-overridden.
> 3 LOCKED (Accepted), 1 Proposed. No LOCKED-vs-LOCKED contradiction detected.

---

## ADR-0030 — Namespace Policy: Bare Slash Command Convention (D-02 LOCK)

- **source**: `docs/adr/0030-namespace-policy-bare-slash-cmd.md`
- **status**: LOCKED (Accepted phase v3.0-3.6 — 2026-05-21)
- **scope**: SKILL.md `name:` field / slash command namespace policy / `scan-nested.ts` flatten / v2 legacy cmd deprecation

**Decision statement**: All `workflows/` SKILL.md `name:` fields use bare slash command convention. Flatten nested physical dirs to single-layer slash cmd names; no namespace prefix/separator (`:`, `/`, `.`).

Flatten rule (`scan-nested.ts` L106-110):
- `workflows/<stage>/auto/` → `name: <stage>` (master, e.g. `/discuss`)
- `workflows/<stage>/<sub>/` → `name: <stage>-<sub>` (e.g. `/discuss-strategic`)
- `workflows/<flat-standalone>/` → `name: <flat-standalone>` (e.g. `/research`, `/retro`)

Sister ADR-0009 v1.0.2 LOCK inherited. v2 legacy cmds (`/plan-feature`, `/execute-task`, `/verify-work`) emit deprecation warn then skip install. Rejected: Option B colon namespace (`/discuss:strategic`), Option C 3-level hierarchical (`/harnessed:discuss:strategic`) — both deferred pending Claude Code platform native namespace support.

**Note for downstream**: This LOCKED decision supersedes PROJECT-SPEC.md §5.2 (`/harnessed:*` full prefix). See INGEST-CONFLICTS.md INFO bucket — bare won, shipped & verified across 26 SKILL.md.

---

## ADR-0031 — 4-Stage Namespace-Layered Workflow Architecture (M-01 + D-03 + D-07)

- **source**: `docs/adr/0031-4-stage-namespace-layered-architecture.md`
- **status**: LOCKED (Accepted phase v3.0-3.6 — 2026-05-21)
- **scope**: workflow architecture / 4-stage namespace layering / master orchestrator / nested dir layout / schema_version harnessed.workflow.v3 / v2→v3 BREAKING migration

**Decision statement** (4 sub-decisions):

1. **4-stage architecture (M-01)**: v2 5-phase `plan-feature` decomposed into 4 master orchestrators (`/discuss` + `/plan` + `/task` + `/verify`) + 16 sub-workflows + 2 standalone (`/research` + `/retro`). Total 22 v3 workflows (errata: D-07 locked "20", actual ship 22 after verify split to 7 sub). Master `auto/workflow.yaml` uses `delegates_to:` + gate-eval conditional fire.
2. **Nested 2-level dir (D-03)**: `workflows/<stage>/<sub>/` grouped by 4 stage, mirrors CLAUDE.md 4-stage cadence. Bare slash cmd uses `-` separator (per ADR-0030); dir path uses `/`.
3. **20→22 workflow ship (D-07)**: 4 master + 16 sub + 2 standalone (errata-corrected from locked 20).
4. **BREAKING migration (D-04)**: v2→v3 via CHANGELOG [3.0.0] BREAKING section + alias map, release-notes-only (no `harnessed migrate` CLI, YAGNI).

A7 conservation: ADR-0001 through 0030 main bodies untouched. v2 schema retained for 3 legacy alias workflows.

---

## ADR-0032 — Cross-Cutting Disciplines (L0) + Execution Mechanism Layer (L5b) + Rules-Based Routing

- **source**: `docs/adr/0032-cross-cutting-disciplines-and-execution-mechanism.md`
- **status**: LOCKED (Accepted phase v3.0-3.6 — 2026-05-21)
- **scope**: L0 Discipline Substrate (6 yaml + 4 hooks) / L5b Execution Mechanism Layer / rules-based routing (4 NEW judgments yaml) / D-13 superset commitment

**Decision statement** (3 NEW first-class concepts):

1. **L0 Discipline Substrate (D-09)**: `workflows/disciplines/*.yaml` 6 files (karpathy / output-style / language / operational / priority / protocols), schema `harnessed.discipline.v1`. `workflow.yaml` v3 `disciplines_applied:` field + 4 runtime hook helpers (`before-spawn` / `before-phase-execute` / `before-commit` / `after-output`) inject + enforce.
2. **L5b Execution Mechanism Layer (D-10)**: subagent / Agent Teams / main session / ralph-loop are cross-workflow orthogonal mechanisms (not phase-private). `judgments/parallelism-gate.yaml` 4 routes: `subagent-default`, `main-session-fallback`, `agent-teams-upgrade`, `ralph-loop-wrapper`.
3. **Rules-Based Routing (D-11)**: 4 NEW judgments yaml (`web-design-routing` / `web-testing-routing` / `web-search-routing` / `stage-routing`) machine-codify `~/.claude/rules/*.md` prose via expr-eval, reusing ADR-0026 multi-file resolver.

D-13 superset commitment: harnessed 1:1 covers CLAUDE.md 13 sections + `~/.claude/rules/*.md` 5 files + Obsidian doc (16-row mapping table). Schema NOT bumped (additive `harnessed.workflow.v2` field extension).

---

## ADR-0033 — Workflow State Machine: Progress Ledger + Fail-Closed Evidence Guard

- **source**: `docs/adr/0033-state-machine-ledger-evidence-guard.md`
- **status**: PROPOSED (2026-06-05, NOT locked) — v5.0 Spec 1 of 3
- **supersedes**: none. **relates-to**: ADR-0029 (fail-soft gate eval), ADR-0031/0032
- **scope**: workflow state machine / `current-workflow.json` sub_progress ledger / checkpoint complete/start / fail-closed evidence guard (sha256) / status --recover / cross-CC handoff drift / additive schema

**Decision statement** (4 sub-decisions, design-locked but ADR status Proposed):

1. **D1 — Progress ledger, ledger-only progression**: add optional `sub_progress: [{sub, status∈{pending,done,failed,skipped}, gate_fired, reason?, evidence_status?, evidence?}]` to `current-workflow.json` (sole live truth). Checkpoint envelope does NOT carry a ledger copy (eng-review D1 — dual-SoT + 1000-token budget risk). Seeded upfront from gates plan. No transition-event machine (linear topology).
2. **D2 — Fail-CLOSED evidence guard** (deliberate exception to ADR-0029 fail-soft): `checkpoint complete <sub>` reads `artifacts_expected`; missing → block (exit 1); present → sha256 → `evidence_status:'verified'`; no declaration → `'none_declared'` (NOT a pass); `--force` → `'overridden'`. Three-state posture, never collapse to boolean.
3. **D3 — Additive schema evolution, no version bump**: `sub_progress` + `evidence` optional on v1 schemas; old files pass `Value.Check`; readers use `?? []`.
4. **D4 — Unified evidence = handoff integrity**: `evidence:[{path,sha256}]` serves existence (D2 block) + cross-CC handoff drift (resume re-hash → warn, not block, per cc-handoff.md).

**Note for downstream**: Proposed status → roadmapper treats as forward-scope (v5.0), not a locked baseline. Companion spec `.planning/milestones/v5.0-phases/STATE-MACHINE-CORE-DESIGN.md` carries the implementation contract.
