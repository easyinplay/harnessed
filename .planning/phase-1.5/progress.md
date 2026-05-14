# Phase 1.5 Progress

> 最后更新: 2026-05-14 — **phase 1.5 SHIPPED** + sister review remediation (H1+H2 fixed inline, H3/H4/M1+结构性根治 deferred phase 2.0 Wave 0)
> Phase: v0.1.0 Phase 1.5 — DAG Resolver + Semantic Router L2 + engineering 23 招式 phase routing
> 状态: ✅ SHIPPED (tags adr-0009-accepted + v0.1.0-alpha.5-routing-l2-engineering pushed) — ready for phase 2.0

---

## § A Current Status

### Plan-phase 完成情况

| Wave | 产出 | 状态 | commit |
|------|------|------|--------|
| A.R1 PATTERNS.md | 165L — 9 新文件 mapping + 4 新生 Pattern Q/R/S/T + 8 决策提案 D-19~D-26 | ✅ | `09fd1a6` |
| A.R2 RESEARCH.md | 571L HIGH conf — 5 P0 lock + ralph-wiggum XML wrapper fresh 发现 | ✅ | `09fd1a6` |
| B.1 ASSUMPTIONS.md | 173L — 5 P0 lock + D-19~D-26 reuse + D1.5-1~15 追溯 + R1-R6 风险 | ✅ | `99b1c2d` |
| B.2 PLAN.md | 240L — 8-Wave 拓扑 + 29 atomic + 8 接口契约 + D1-D8 复现命令 | ✅ | `99b1c2d` |
| B.3 task_plan.md | 851L — 29 atomic 子任务 / 8 wave / 每 task 验收 + 决策来源 | ✅ | `99b1c2d` |
| C.1 PLAN-CHECK.md | APPROVED zero BLOCKER / W-1+W-2 WARNING / S-1+S-2 SUGGESTION | ✅ | `f105ca4` |

**PLAN-CHECK verdict**: APPROVED — 零 BLOCKER。W-1/W-2 由 T8.1/T5.2 execute 阶段吸收（AA 全 accept）。

### Execute-phase 完成 — 4 batches all SHIPPED

| Batch | Wave | commit | 产出 |
|-------|------|--------|------|
| 1 | 0+1 | `d817d0d` | ADR 0009 errata 232L + ci.yml A7 iter 1-9 + DAG spike 10/10 PASS + SPIKE-REPORT-2 GO |
| 2 | 2+3 | `fb11763` | dag.ts 142L + semanticRouter.ts 81L + embedding.ts 17L + engine.ts 199L + decision_rules.yaml v2 + migrate script + decisionRules.ts F42 |
| 3 | 4+5 | `0636c17` | systemPrompt XML wrapper 53L + ralphLoop 65L + promiseExtract 32L + agentDefinition 14字段 191L + contract v1.1 errata + spec.ts phase/triggers + 4 test files + SAMPLES v2 |
| 4 | 6+7 | `548c7b1` | PERF-ATTRIBUTION-2 202L + STATE/VERIFICATION/ROADMAP final-ship docs |

**Final ship**: CI run 25867694330 三平台全绿 (win/mac/ubuntu) → tags `adr-0009-accepted` + `v0.1.0-alpha.5-routing-l2-engineering` pushed → `548c7b1`

### Sister review remediation (phase 1.5.1)

| commit | 内容 |
|--------|------|
| (本次) | H2 ralphLoop.ts Anchor 3 hard split → `skillInstall.ts` (ralphLoop 65L→42L ≤50L) + H1 STATE.md/PLAN-CHECK A7' wording 修正 + H3/H4/M1+结构性根治 deferred phase 2.0 Wave 0 |

---

## § B.1 8 支柱 Implementation Enforcement (phase 1.5 ship 后)

| 支柱 | phase 1.5 实装 | 状态 |
|------|---------------|------|
| A1' gstack 6+ 角色 routing | engineering 5 rules (T4.1) | ✅ CLOSED |
| A2' gstack 双职责 | mattpocock_phases discuss/plan vs execute/verify 分段 | ✅ |
| A3' GSD 环境质量 | A7 守恒 + CI 三平台 + iter 1-9 | ✅ |
| A4' karpathy 4 心法 | phase 1.4 已 ship — continued | ✅ |
| A5' mattpocock 23 招式 phase routing | mattpocock_phases yaml v2 (4×21×23) + spec.ts | ✅ CLOSED |
| A6' 心法+招式配对 | phase 1.4 已 ship — continued | ✅ |
| A7' brainstorming + TDD 触发规则 | spec.ts triggers 字段 + semanticRouter stub | **INTERFACE CLOSED / CAPABILITY DEFERRED v0.2+** (sister review H1) |
| A8' 6 category × decision rules | engineering 5 rules + 30 sample 28/30 specific | ✅ CLOSED |

---

## § B.2 Findings Tracker

### Plan-check findings (resolved)

| ID | 来源 | 内容 | 状态 |
|----|------|------|------|
| W-1 | PLAN-CHECK | STATE.md line 11 "7 接口契约" → "8 接口契约" | ✅ T8.1 fixed |
| W-2 | PLAN-CHECK | ralphLoop.ts ≤50L wedge soft-overflow | ✅ batch 3 promiseExtract.ts 32L split (部分) + sister review H2 完整修复 |
| S-1 | PLAN-CHECK | systemPrompt.ts ≤80L budget → ≤60L | ✅ batch 3 实测 53L |
| S-2 | PLAN-CHECK | T6.4/T6.5 action outline 补 3 步骤 | ✅ batch 3 吸收进 T6.4 atomic |

### Sister review findings (paranoid staff engineer 视角)

| ID | 级别 | 内容 | 状态 |
|----|------|------|------|
| H1 | 🔴 High | semanticRouter.ts return null stub 标裸 "CLOSED" — transparency 反模式复发 | ✅ **fixed inline** — STATE.md + PLAN-CHECK A7' 改 "INTERFACE CLOSED / CAPABILITY DEFERRED v0.2+" |
| H2 | 🔴 High | ralphLoop.ts 65L vs ADR 0009 § Decision 3 "≤50L strict" — 文档/代码 drift | ✅ **fixed inline** — Anchor 3 hard split → `skillInstall.ts` 34L，ralphLoop.ts **42L ≤50L**，ADR 0009 声明变真（option a，A7 守恒保留无需动 ADR） |
| H3 | 🟡 Med | agentDefinition.ts 148→191L，budget ≤150→≤200 无 ADR 记录 | ⏳ deferred phase 2.0 Wave 0 — ADR 0010 errata 正式记录 |
| H4 | 🟡 Med | arbitrate substring match false-positive 风险 ADR 0009 未记 | ⏳ deferred phase 2.0 Wave 0 — ADR 0010 errata § Consequences |
| M1 | 🟡 Med | 30 sample 2 个 miss 身份未记录（只有聚合 28/30） | ⏳ deferred phase 2.0 Wave 0 — SAMPLES.md v2 § 8.4 标注 |
| 结构性 | — | transparency verify checklist — "CLOSED/100%/全绿" 须附 specific 数字+miss 清单 | ⏳ deferred phase 2.0 Wave 0 — 根治连续 2 phase 复发 |
| L1 | 🔵 Low | 1000-node DAG +60.6% regress | ✅ tracked — PERF-ATTRIBUTION-2.md § 7 监控触发器 |
| L2 | 🔵 Low | .omc/ biome check 污染 | ✅ tracked — deferred-items.md D-OOS-1 |

---

## § A.4 Batch 执行进度 (全 ✅)

### Batch 1 — Wave 0+1 (`d817d0d`)
| Task | 文件 | 状态 |
|------|------|------|
| T1.1 | `docs/adr/0009-routing-l2-engineering-23-shi-errata.md` 232L 6-section 4 errata items | ✅ |
| T1.2 | `.github/workflows/ci.yml` A7 step iter 1-9 (两处 loop) | ✅ |
| T2.1 | `scripts/spike/dag-and-promise-xml.sh` 258L — 10/10 assertions PASS | ✅ |
| T2.2 | `.planning/phase-1.5/SPIKE-REPORT-2.md` 269L — verdict GO | ✅ |

### Batch 2 — Wave 2+3 (`fb11763`)
| Task | 文件 | 状态 |
|------|------|------|
| T3.1 | `src/routing/dag.ts` 142L Kahn iterative + cycle detect | ✅ |
| T3.2 | `src/routing/semanticRouter.ts` 81L v0.1 stub | ✅ |
| T3.3 | `src/routing/lib/embedding.ts` 17L placeholder interface | ✅ |
| T3.4 | `src/routing/engine.ts` 199L 升级 (DAG pre + Semantic post) | ✅ |
| T3.5 | `src/routing/index.ts` barrel re-exports | ✅ |
| T4.1 | `routing/decision_rules.yaml` v1→v2 (5 engineering rules + mattpocock_phases 4×21×23) | ✅ |
| T4.2 | `scripts/migrate-decision-rules-v1-to-v2.mjs` idempotent | ✅ |
| T4.3 | `src/routing/decisionRules.ts` arbitrate F42 array substring match | ✅ |

### Batch 3 — Wave 4+5 (`0636c17`)
| Task | 文件 | 状态 |
|------|------|------|
| T5.1 | `src/routing/systemPrompt.ts` XML wrapper 53L (S-1 ≤60L) | ✅ |
| T5.2 | `src/routing/lib/ralphLoop.ts` 65L + `lib/promiseExtract.ts` 32L (W-2 hard split) | ✅ |
| T5.3 | `src/routing/agentDefinition.ts` 12→14 字段 191L + AGENT_DEFINITION_FIELDS drift detector | ✅ |
| T5.4 | `docs/AGENT-DEFINITION-FACTORY-CONTRACT.md` v1.1 errata (main body 0 删除 A7 守恒) | ✅ |
| T5.5 | `src/manifest/schema/spec.ts` phase enum + triggers (TypeBox) | ✅ |
| T6.1 | `tests/unit/routing-dag.test.ts` 14 cell | ✅ |
| T6.2 | `tests/unit/routing-semanticRouter.test.ts` 9 cell + 1 skip | ✅ |
| T6.3 | `tests/unit/routing-engine.test.ts` 12→16 cell | ✅ |
| T6.4 | `tests/integration/routing-30-samples.test.ts` specific 28/30 + total 30/30 | ✅ |
| T6.5 | `.planning/phase-1.4/SAMPLES.md` v2 § 8.4 errata 11 sample 映射 | ✅ |

### Batch 4 — Wave 6+7 final ship (`548c7b1`)
| Task | 文件 | 状态 |
|------|------|------|
| T7.1 | `.planning/phase-1.5/PERF-ATTRIBUTION-2.md` 202L — DAG bench 50-node +0.96% regress | ✅ |
| T7.2 | CI 三平台全绿 verify (run 25867694330) + push | ✅ |
| T7.3 | (可选 hotfix) — 未触发 | — |
| T8.1 | `.planning/STATE.md` phase 1.5 SHIPPED + 6/17 + W-1 fix | ✅ |
| T8.2 | `.planning/phase-1.5/VERIFICATION.md` 388L D1-D8 复现命令 | ✅ |
| T8.3 | `git tag adr-0009-accepted` + `v0.1.0-alpha.5-routing-l2-engineering` pushed | ✅ |
| T8.4 | `.planning/ROADMAP.md` phase 2.0 prereq notes | ✅ |

---

## § C Acceptance Bar D1-D8 (8/8 ✅)

| AB | 验收 | 结果 |
|----|------|------|
| D1 | dag.ts ≤200L Kahn + ≥10 cell | 142L + 14 cell ✅ |
| D2 | semanticRouter.ts ≤150L stub + embedding.ts ≤30L + ≥8 cell | 81L + 17L + 9 cell ✅ |
| D3 | engineering 5 rules + 30 sample ≥27/30 specific | 5 rules + 28/30 specific + 30/30 total ✅ |
| D4 | mattpocock_phases yaml v2 + spec.ts phase enum + triggers | 4×21×23 + TypeBox ✅ |
| D5 | ADR 0009 errata 4 items + 14 字段 + XML wrapper | 全 ship ✅ |
| D6 | PERF-ATTRIBUTION-2.md ≥80L + ≤5% regress | 202L + 50-node +0.96% ✅ |
| D7 | ADR 0009 accepted + adr-0009-accepted tag | tag pushed ✅ |
| D8 | CI 三平台全绿 + A7 iter 1-9 + ADR 0001-0008 守恒 | run 25867694330 + iter 1-9 ✅ |

tests **291+2 → 318+3** (+27) / ADR 8→9 / baseline tag 8→9 / typecheck PASS
