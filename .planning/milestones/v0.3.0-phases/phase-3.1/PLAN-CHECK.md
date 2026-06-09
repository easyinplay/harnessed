# Phase 3.1 PLAN-CHECK Report

**Date**: 2026-05-16
**Plans verified**: PLAN.md (1154L) + task_plan.md (1107L)
**Cross-sources**: RESEARCH.md (990L) + PATTERNS.md (363L) + 3.1-CONTEXT.md + 3.1-KICKOFF.md
**Verdict:** **ISSUES FOUND** (22/28 atomic tasks issue-free, miss: T0.3 / T0.5 / T1.1 / T3.2 / T3.3 / T5.4 — 2 BLOCKER + 4 WARNING; revision iter 1/3 triggered)

---

## EE-4 4-dimension quantitative scores (Phase 2.4 W2 SSOT, RELAX baseline)

| Dim | Score | Threshold | Verdict | Evidence |
|------|-------|-----------|---------|----------|
| **file_references_verified** | 14/14 = 100% | ≥80% | ✅ PASS | schemaVersion.ts:41 / engine.ts:171,178,182 / ralphLoop.ts:43,45 / sdkSpawn.ts:30-32,68 / cli.ts:25-35 / ROADMAP L156-158 / REQUIREMENTS L263-273 / AUDIT.md:21-25 / ADR 0013 latest |
| **reference_sources_real** | 12/12 = 100% | ≥80% | ✅ PASS | ADR/CONTEXT/RESEARCH/PATTERNS cross-refs accessible; ctx7 `/anthropics/claude-agent-sdk-demos` + code.claude.com sessions docs cited with snippets |
| **concrete_acceptance** | 28/28 = 100% | ≥80% | ✅ PASS | 每 task `<verify><automated>` 有 grep/wc/pnpm test cmd; T0.1/T1.1/T2.1/T3.2/T4.4/T5.4 抽样 verify |
| **business_logic_assumptions** | 0 BLOCKER | =0 | ✅ PASS | weasel word grep 0 matches in `<action>/<verify>/<done>` |

**Overall**: **4/4 PASS** — EE-4 量化全通过。

---

## Goal-backward verification (4 ROADMAP acceptance + 2 REQ-ID)

| # | Acceptance / REQ | Status | Evidence |
|---|------------------|--------|----------|
| 1 | summary < 1k token (R7.2) | ✅ YES | T2.1 template.ts ~80L estimateTokens + enforceBudget 2-level truncate + throw |
| 2 | archive complete (R7.2) | ✅ YES | T2.2 archive.ts ~40L writeArchive → `.harnessed/archive/phase-<X.Y>/raw-<ISO>.json` |
| 3 | `current-workflow.json` state machine (D-02) | ✅ YES | T1.2-T1.4 3-state Union + state.ts + 7 fixture; 8th surface registered |
| 4 | human-interrupted resume (R7.3) | ✅ YES | T4.1 sigintTrap + T4.3 resume cwd guard + T4.4 12th subcommand + T3.2 capturedSessionId wire + T5.1+T5.5 e2e dogfood |
| R7.2 | checkpoint layered | ✅ COVERED | requirements frontmatter; T2.1+T2.2+T2.4 |
| R7.3 | harnessed resume | ✅ COVERED | requirements frontmatter; T4.3+T4.4+T5.1+T5.5 |

---

## Carry-forward verification

| Item | Status | Evidence |
|------|--------|----------|
| **D-01 TEMPLATE zero LLM call** | ✅ PASS | T2.1 acceptance L416 explicit anti-LLM grep `! grep -E "query\|anthropic" src/checkpoint/template.ts` |
| **D-02 KARPATHY 3-state** | ✅ PASS | WorkflowStatus only 3 literal; state.ts 3 fn; no xstate/robot3 dep |
| **D-03 RELOAD no-stealth** | ✅ PASS | resume.ts stdout output 无 spawn; cli/resume.ts console.log + process.exit |
| **D-04 WIRE-IN triplet activation** | ✅ PASS | T3.1 ralphLoop L43 dead var 激活; T3.2 engine L182 void delete + writeCheckpoint + onSessionIdInner propagate |
| **Karpathy hard limit ≤200L** | ⚠️ borderline | engine.ts ≤215L (B-03 5% 容忍) explicit + fallback split — W-01 建议升级 PRIMARY |
| **schemaVersion 7→8 surface** | ✅ PASS | T1.1 +4L SCHEMA_VERSIONS + Literal + JSDoc; T1.4 fixture grep gate ≥8 |

---

## Deep work rule verification (per task)

- `<read_first>` 5 sample × 5 PASS (T0.1/T1.2/T2.1/T3.2/T4.3 全列 file:line precondition + analog + RESEARCH/PATTERNS 引用)
- `<acceptance_criteria>` 5 sample × 5 PASS (全机械 grep/wc/pnpm test cmd)
- `<action>` concrete 5 sample × 5 PASS (T0.1 verbatim markdown / T1.2 verbatim TypeBox / T1.3 verbatim state.ts 60L / T3.1 verbatim ralphLoop Option-a / T4.3 verbatim resume.ts 60L)

---

## Risk inventory check

- **R3** SDK 0.3.142 session resume 实验性 (ADR 0011) → ✅ mitigation present (mock SDK T3.3 + real-API dogfood T5.5 + fallback fresh session T4.3)
- **R4** cwd mismatch silent fresh session → ✅ mitigation present (T1.2 cwd field + T4.3 cwdWarn + T-3.1-03 threat note)
- **R7** Phase 3.1 self-dogfood (T5.5) → ✅ mitigation present (sister Phase 2.4 W6 hotfix-within-ship-wave pattern; DOGFOOD-T5.5.md outcome capture)

---

## Issues found

```yaml
issues:
  - id: B-01
    severity: BLOCKER
    location: task_plan.md L84-113 (T0.3 W0.3 CI step) + PLAN.md L411-418
    finding: |
      W0.3 README completeness check regex first-push CI red guaranteed.
      Pre-flight local verify of planned regex `^[-*]?\s*\*?\*?Phase [1-9]\.[0-9]\*?\*?.*[Ss]hipped`:
        - .planning/STATE.md → 0 matches (STATE 嵌 "Phase X.Y SHIPPED" 在 prose 不在 line-start)
        - README.md → 10 matches
      Drift 10 vs 0 → CI 必 fail. Sister Phase 2.4 W0 T0.3 同 "4th recurrence" pattern.
    recommendation: Fix path (b) warn-only round 1 + flip ENFORCE Phase 3.2 after format normalization. Sister Phase 2.1 RETROSPECTIVE "transparency anti-pattern CI gate warn-only round 1" + Phase 2.3 W0 perf gate "moved out of CI critical path to nightly cron advisory" pattern.

  - id: B-02
    severity: BLOCKER
    location: PLAN.md L795-808 (T3.2 engine.ts wrappedSpawn signature extend) + task_plan.md L534-545
    finding: |
      T3.2 engine.ts wrappedSpawn signature extend 漏 userSpawn branch.
      engine.ts L171-181: `userSpawn ? userSpawn(agentDef) : defaultSpawn(...)`.
      userSpawn signature `(agentDef) => Promise<string>` — 无 onSessionId out-param.
      用户提供 custom spawn → onSessionIdInner callback 永不 invoke → ralphLoop sessionId remains undefined → Test 2 (capture-then-resume mid-loop) 在 userSpawn integration test 必 fail.
    recommendation: Fix path (b) document userSpawn as fresh-session-only + add T3.3 explicit fixture (no session_id capture, fallback fresh + reload). YAGNI: userSpawn 是 <5% niche, 扩 public API breaking changes 太重.

  - id: W-01
    severity: WARNING
    location: task_plan.md L530-589 (T3.2 hard limit gate)
    finding: |
      T3.2 engine.ts wc gate target ≤215L (B-03 5% tolerance) 估超.
      Current 195L + delete L182 void(-1L) + extend wrappedSpawn signature+callback(+5-7L) + 3 imports(+3L) + phaseId+checkpointPath+activate(+3L) + writeCheckpoint 8 fields+completeWorkflow(+12-15L) ≈ 217-220L.
      Resolved (T3.2 wc gate) fallback split engineCheckpointHook.ts ≤50L 仅 post-MODIFY 触发 → 1 wasted iteration risk.
    recommendation: Promote engineCheckpointHook.ts to PRIMARY path. engine.ts wedge import hook ≤3L; final engine.ts ≤200L clean. T3.2 step 1 重写: "Extract checkpoint hook to engineCheckpointHook.ts NEW ≤50L; engine.ts 仅加 import + 1-2 行 hook call."

  - id: W-02
    severity: WARNING
    location: PLAN.md L43 + L1011 (T5.4 A7 ci.yml iter bump)
    finding: |
      T5.4 plans "1-0013" → "1-0014" 字面 update. ci.yml 实际 L60+L85 用 `ADR 0001-0013` range 不是裸 "1-0013".
      Grep `"1-0013" ci.yml` = 0 matches. Plan verify grep `grep -q "1-0014" ci.yml` 技术上过 (substring "0001-0014" 含) 但意图不明.
    recommendation: T5.4 step 2 重写: update step name `ADR 0001-0013` → `ADR 0001-0014` + summary loop bound `ADR 0001-0014 main body unchanged`. acceptance grep `ADR 0001-0014`.

  - id: W-03
    severity: WARNING
    location: task_plan.md L153-165 (T0.5 test dirs setup)
    finding: |
      T0.5 mkdir 不验 vitest.config.ts include glob 覆盖. RESEARCH §9 + task_plan R10 假 `tests/**/*.test.ts` 覆盖, 未 verify.
    recommendation: T0.5 acceptance 加 positive verify `grep -E "tests/\*\*" vitest.config.ts` exit 0. 若 restrictive, 同任务显式加 3 dir glob.

  - id: W-04
    severity: WARNING
    location: PLAN.md L796 + task_plan.md L548
    finding: |
      T3.2 engine.ts MODIFY 用 `(matched?.decision as any)?.phase` 抽 phaseId — `as any` 违 Karpathy "Surgical Changes" + type safety; sister 用 Discriminated Union narrowing 不是 `as any`.
      Fallback 到 `task.task_type` (per-task identifier 如 "research", 不是 Phase identifier 如 "3.1") → checkpoint paths `.harnessed/checkpoints/research.json` 替 `3.1.json`.
      current-workflow.last_checkpoint_path 与 resume.ts assume (phase = "3.1") mismatch → resume 找不到 paused phase → R7.3 acceptance fail.
    recommendation: 路径 (a) Thread phaseId:string into task schema (T1.1 加 task.phaseId field). 删 `as any` cast; phaseId 显式 propagate.
```

---

## Dimension summary

| Check | Status |
|-------|--------|
| Dim 1 Requirement coverage (R7.2 + R7.3) | ✅ PASS |
| Dim 2 Task completeness (28 tasks × 6 Waves) | ✅ PASS |
| Dim 3 Dependency correctness (W0→W1→...→W5 sequential) | ✅ PASS |
| Dim 4 Key links (7 wired) | ✅ PASS |
| Dim 5 Scope sanity | ⚠️ Wave 4 8 files 单 task; T4.1-T4.5 mitigates |
| Dim 6 Verification derivation (must_haves.truths user-observable) | ✅ PASS |
| Dim 7 Context compliance (D-01~D-04 locked) | ✅ PASS |
| Dim 7b Scope reduction (NO weasel) | ✅ PASS |
| Dim 7c Architectural tier (CLI/engine/checkpoint separated) | ✅ PASS |
| Dim 8 Nyquist (automated verify per task) | ✅ PASS |
| Dim 9 Cross-plan data contracts (checkpoint.v1+currentWorkflow.v1 单一兼容门) | ✅ PASS |
| Dim 10 CLAUDE.md compliance (Karpathy hard limit + biome preempt + ralph-loop) | ✅ PASS |
| Dim 11 Research resolution (RESEARCH 12 sections 全闭) | ✅ PASS |
| Dim 12 Pattern compliance (PATTERNS 14/14 mapped) | ✅ PASS |

## Verdict

## ISSUES FOUND (revision iteration 1/3 triggered)

**Orchestrator tier-call decisions (passed to revision planner)**:
- B-01 → fix path (b): warn-only round 1 + ENFORCE flip Phase 3.2 后
- B-02 → fix path (b): userSpawn fresh-session-only documented + T3.3 fallback fixture
- W-01 → promote engineCheckpointHook.ts PRIMARY (extract; engine.ts ≤200L clean)
- W-02 → 显式文本: `ADR 0001-0014`
- W-03 → 加 vitest.config.ts glob positive verify
- W-04 → 路径 (a): T1.1 task schema 加 `phaseId:string` field + 删 `as any`
