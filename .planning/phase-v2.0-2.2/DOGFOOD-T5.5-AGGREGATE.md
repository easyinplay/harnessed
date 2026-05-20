# Phase v2.0-2.5 W5 Cycle 5 — DOGFOOD AGGREGATE 5-Axis 16 R20.x End-to-End Verification

**Date**: 2026-05-20
**Phase**: v2.0-2.5 W5 Cycle 5 (final aggregate sister Phase 4.3 60L pattern extended ~180L 5-axis)
**R coverage**: 13/15 active R20.x dogfood-verified inline (R20.5 + R20.9 operational deferred Phase 2.6 close ship; R20.6 DROPPED Phase 2.1 D-decision)
**Test artifact**: aggregate-only (cite W1-W4 4 dogfood file × 46 NEW fixture); 0 NEW fixture this cycle
**Verdict**: **PASS** (5/5 axes verified, miss: none; Ready for Phase v2.0-2.6 close cadence)
**Baseline**: 895 passed / 4 skipped / 0 failed (sister Phase 2.5 W4 baseline maintained, 0 regression for W5 aggregate-only)

---

## Axis 1 — 16 R20.x acceptance backward mapping

每 R 实装 task + dogfood verify cross-link verbatim 追溯。R20.6 DROPPED per Phase 2.1 D-decision; R20.5 + R20.9 operational deferred Phase 2.6 close ship。

| R | Description | Implementation task | Dogfood verify | Status |
|---|-------------|---------------------|----------------|--------|
| R20.1 | Pure bundled SoT (workflows/ packageRoot, NO user-dir override) | T2.3.W1.1 setup.ts Pure bundled distribution wire | T5.3 Scenario B F8 capability template fs path verify NOT containing `~/.harnessed/` | ✅ |
| R20.2 | capabilities.yaml flat yaml map ~37 entry baseline | T2.3.W0.1 capabilities.yaml 37 entry + T2.3.W0.6 TypeBox Capabilities schema validate | T5.1 F1-F5 + T5.2 F8 + T5.3 F6/F10/F17 + T5.4 F4/F6 各 cycle 触发 capabilities lookup runtime | ✅ |
| R20.3 | gate yaml-eval grammar via expr-eval npm dep + Parser singleton + locked-down operators | T2.3.W0.3 expr-eval 2.0.2 install + exprBuilder.ts 53L + T2.3.W1.3 phaseFactContext.ts | T5.1-T5.4 evalGate cross-verify (38+ runtime evalGate call across 4 cycle) | ✅ |
| R20.4 | judgments/ multi-file 6 file 分类 (rule-style sister `~/.claude/rules/*.md` pattern) | T2.3.W0.2 judgments/ 6 file (parallelism + tdd + fallback + strategic-gate + phase-gate + subtask-gate) + T2.3.W0.4 judgmentResolver.ts 98L 4 层 ref split | T5.1 F5 + T5.2 F6 + T5.3 F13/F20 + T5.4 F10 yaml schema Value.Check pass (dual-schema rules vs triggers routing 实证) | ✅ |
| R20.5 | static manifest discipline + ADR cadence (per upstream upgrade 2-3 day npm patch release) | Phase 2.6 W0 ADR 0024-0029 backfill (待 Phase 2.6 ship) + ADR 0025 D-07 + D-14 LOCK | n/a (operational cadence — ADR backfill 在 Phase 2.6 W0) | ⏳ Phase 2.6 deferred |
| R20.6 | ~~user-dir hot-reload manifest~~ | n/a (DROPPED per Phase 2.1 D-decision YAGNI) | n/a | 🚫 DROPPED |
| R20.7 | research + verify-work 2 NEW workflows ship (D-08 + D-12) | Phase 2.4 W2.1 research workflow.yaml 2-phase + W2.2 verify-work workflow.yaml 144L 9-phase | T5.2 F1-F6 verify-work 9-phase matrix + T5.4 F9 research 2-phase shape + 3 web 搜索 source entry verify | ✅ |
| R20.8 | mattpocock capability route by condition (on: syntax + expr-eval) — 12+ 关键招式子集 | T2.3.W0.1 mattpocock 11 entry impl=`mattpocock-skills` + T2.4.W1.1 execute-task phases.yaml v2 02-code 3 on-clause + 03-test 1 on-clause | T5.4 F1-F3 (3 触发 invoke runtime evalGate=true) + F4 (11 entry impl) + F5 (fires_when 句型 verbatim 对齐 CLAUDE.md) | ✅ |
| R20.9 | release notes only migration (CHANGELOG + 升级一行指令 + schema v1→v2 diff) | Phase 2.6 W1.1 CHANGELOG [2.0.0] entry + W1.3 package.json 1.0.4→2.0.0 (待 Phase 2.6 ship) | n/a (operational doc — CHANGELOG 在 Phase 2.6 W1) | ⏳ Phase 2.6 deferred |
| R20.10 | ralph-loop completion-promise 真接 (NOT mock; explicit fallback NOT silent) | T2.4.W1.1 execute-task phases.yaml 04-deliver capability template + completion_promise=COMPLETE + max_iterations interpolation + fallback 三字段 (action=emit_warning_and_halt + message + exit_code=1) + T2.4.W1.2 fallbackHandlers.ts double handler export | T5.3 Scenario C F14-F20 (7 fixture: capability + args + max_iterations + fallback shape + sdk_ref 复用 Phase 2.2 ralphLoop.ts + on[] dual branch) | ✅ |
| R20.11 | parallelism-gate 3 路径 + Agent Teams 5 升级触发 OR-chain + checkAgentTeams env probe | T2.3.W0.5 checkAgentTeams.ts 47L + T2.3.W0.2 parallelism-gate.yaml 4-trigger + T2.3.W1.1 setup.ts wire + Phase 2.4 W3 doctor MIN 8→10 | T5.1 Axis A 3 route × 5 trigger matrix (F1-F3) + Axis B real env probe (F4 status=pass) + Axis C schema invariant (F5) + T5.2 Axis B Pattern C 4-specialist 3 branch eval (F5) | ✅ |
| R20.12 | verify-work full 4-stage 9-phase (必跑 2 + 并行 1 + 强制 1 + 可选 3 + 末尾 1 + Pattern C 升级 1) | T2.4.W2.2 verify-work workflow.yaml 144L 9-phase ship + WorkflowSchemaV2 v2 字段验证 | T5.2 Axis A 9-phase matrix verify (F1-F6) + Axis B Pattern C 升级 (F5 3 branch) + Axis C gstack 3 可选 (F4 6 sub-scenario) | ✅ |
| R20.13 | tdd-gate 6 fires + 3 skips + capabilities tdd entry alias 双 impl 候选 (superpowers + mattpocock) | T2.3.W0.2 tdd-gate.yaml 6+3 + T2.4.W1.1 execute-task 02-code on[] tdd-gate clause + capabilities.yaml tdd entry aliases | T5.3 Scenario A F1-F7 (6 fires + 3 skips 独立激活 + aliases + execute-task wire) | ✅ |
| R20.14 | special-purpose tools 13+ entry routing (5 bucket: gstack/npm-cli/mcp/cli/gsd) | T2.3.W0.1 capabilities.yaml Bucket 2 137-256L 13 entry + T2.4.W2.2 verify-work 4 gstack 治理关卡 capability template + T2.4.W2.1 research 2-phase + 3 web 搜索 source | T5.2 Axis C 6 sub-scenario × 3 phase (F4) + T5.4 Scenario B F6-F9 (13 entry 全 impl/cmd/since + 5 bucket 分类 + verify-work wire + research presence) | ✅ |
| R20.15 | planning-with-files Claude Code plugin /plan (Q-AUDIT-5a reframe NOT npm SDK) | T2.4.W1.3 plan-feature 05-persist phase capability template + invokes /plan literal + artifacts_expected 3 file + T2.4.W3.1 checkPlanningWithFiles.ts 58L 10th doctor check real probe | T5.3 Scenario B F8-F13 (6 fixture: capability + /plan literal + 3 file + impl=claude-code-plugin negative assert + real probe v2.34.0 + anti-pattern grep guard 0/3) | ✅ |
| R20.16 | fallback 3 铁律 (uncertain-skip-transparently + user-explicit-override + chain-isolation) + dual-schema rules vs triggers | T2.3.W0.2 fallback.yaml 35L 3 rule entry + T2.3.W0.6 JudgmentRulesFile dual-schema routing in judgmentResolver | T5.4 Scenario C F10-F15 (6 fixture: schema + 3 铁律字段 + 6 verbatim override_signal + chain-isolation runtime 独立 eval 实证 + TriggerNotFoundError throw path) | ✅ |

**Coverage**: **13/15 active R20.x dogfood-verified inline** (R20.5 + R20.9 operational deferred Phase 2.6); R20.6 DROPPED。

---

## Axis 2 — 4-stage CLAUDE.md cadence coverage (Discuss → Plan → Execute → Verify)

各 stage workflow + capability + judgment 实装路径完整性 cross-link 三层栈方法论 verbatim machine 化。

| Stage | Workflow shipped | Capability used | Judgment gate | Dogfood verify |
|-------|------------------|-----------------|---------------|----------------|
| ① **Discuss** | `workflows/research/` NEW (T2.4.W2.1) | `tavily-mcp` + `exa-mcp` + `ctx7` (3 web 搜索 source fan-out) + `gsd-discuss-phase` (Phase 层灰色澄清) + `office-hours` (战略层 alias) + `superpowers-brainstorming` (子任务层) | `judgments/strategic-gate.yaml` + `phase-gate.yaml` + `subtask-gate.yaml` (D-04 + D-16 multi-file 3 file 分类) | T5.4 F9 research 2-phase shape verify + T5.4 F15 chain-isolation 战略/Phase 独立 eval 实证 |
| ② **Plan** | `workflows/plan-feature/` upgraded v2 (T2.4.W1.3) | `gsd-plan-phase` (主) + `planning-with-files` plugin `/plan` (Q-AUDIT-5a reframe) + `plan-eng-review` (复杂架构 conditional) | `strategic-gate.office-hours` (Plan 入口前置) + `phase-gate.gsd-discuss-phase` (灰色澄清 ≥2 open decision) | T5.3 Scenario B F8-F13 plan-feature 05-persist `/plan` + 3 file artifacts + impl=claude-code-plugin |
| ③ **Execute** | `workflows/execute-task/` upgraded v2 (T2.4.W1.1) | `ralph-loop` (04-deliver COMPLETE gate) + `tdd-gate` route → `superpowers-tdd` + `/tdd` alias (D-13) + `mattpocock` 11 高频招式 (02-code 3 on-clause + 03-test 1) + `parallelism-gate` 3 路径 | `tdd-gate.yaml` 6 fires + 3 skips + `parallelism-gate.yaml` 4-trigger (subagent-default + main-session-fallback + agent-teams-upgrade + ralph-loop-wrapper orthogonal) | T5.3 Scenario A F1-F7 tdd-gate + Scenario C F14-F20 ralph-loop + T5.4 F1-F3 mattpocock + T5.1 F1-F5 parallelism-gate full matrix |
| ④ **Verify** | `workflows/verify-work/` NEW 9-phase (T2.4.W2.2) | `gsd-verify-work` + `gsd-progress` (必跑串行 2) + `code-review` (并行 fan-out) + `gstack-review` (关键模块强制) + `gstack-qa` + `gstack-cso` + `gstack-design-review` (可选 3) + `code-simplifier` (末尾) + **Pattern C 4-specialist Agent Team 升级** (is_major_release OR is_large_refactor) | `parallelism-gate.agent-teams-upgrade` (4-specialist Pattern C 升级 OR-chain) | T5.2 Axis A 9-phase matrix (F1-F6) + Axis B Pattern C 3 branch eval (F5) + Axis C gstack 3 可选 (F4 6 sub-scenario) |

**4-stage 完整 machine 化**: ✅ 4 workflows ship (research NEW + plan-feature v2 + execute-task v2 + verify-work NEW); ✅ judgments/ 6 file 各 stage 入口 gate 完整; ✅ capabilities.yaml 39 entry (37 + 2 NS resolved per Phase 2.4 retro)。三层栈 cadence "Discuss → Plan → Execute → Verify" 端到端可执行。

---

## Axis 3 — 16 D-decision LOCK 反映 + 3 Q-AUDIT-5 schema fix evidence

Phase 2.1 16 D-decision + 3 Q-AUDIT-5a/5b/5c errata 全部实装 evidence cross-link。

| D-ID | Decision summary | Shipped artifact | Test evidence |
|------|------------------|------------------|---------------|
| D-01 | Pure bundled distribution (workflow.yaml v2 share-only readonly) | T2.3.W1.1 setup.ts wire + T2.4.W0.1 WorkflowSchemaV2 87L | T5.3 Scenario B F8 (capability template fs NOT `~/.harnessed/`) |
| D-02 | capability abstraction flat yaml map | T2.3.W0.1 capabilities.yaml 37 entry | T5.1-T5.4 all cycle (capabilities lookup 38+ runtime) |
| D-03 | expr-eval npm dep (2.0.2 MIT zero-dep, Parser singleton + operator lockdown) | T2.3.W0.3 exprBuilder.ts 53L | T5.1-T5.4 evalGate runtime cross-verify |
| D-04 | judgments/ multi-file 6 file 分类 (rule-style sister `~/.claude/rules/*.md`) | T2.3.W0.2 judgments/ 6 file | T5.4 F10 dual-schema rules vs triggers routing 实证 |
| D-05 | release notes only migration (Pure bundled YAGNI) | T2.6.W1.1 CHANGELOG + W1.3 package.json (Phase 2.6 待 ship) | n/a (operational, Phase 2.6 ship verify) |
| D-07 | static manifest discipline + ADR cadence per upstream upgrade | T2.6.W0.2 ADR 0025 backfill (Phase 2.6 W0 待 ship) | n/a (operational, Phase 2.6) |
| D-08 | ship 2 NEW workflows (research + verify-work) | T2.4.W2.1 research + W2.2 verify-work | T5.2 Axis A 9-phase + T5.4 F9 research 2-phase |
| D-09 | mattpocock capability route by condition (on: syntax + expr-eval) | T2.3.W0.1 mattpocock 11 entry + T2.4.W1.1 execute-task on[] | T5.4 F1-F5 (3 触发 invoke + 句型对齐 CLAUDE.md) |
| D-10 | ralph-loop completion-promise 真接 (NOT mock; explicit fallback NOT silent) | T2.4.W1.1 execute-task 04-deliver + W1.2 fallbackHandlers.ts | T5.3 Scenario C F14-F20 (7 fixture) |
| D-11 | parallelism-gate 3 路径 + Agent Teams env check + 5 升级触发 | T2.3.W0.5 checkAgentTeams + W0.2 parallelism-gate.yaml + W1.1 setup.ts | T5.1 Axis A-C (5 fixture) + T5.2 Axis B (Pattern C) |
| D-12 | verify-work full 4-stage 9-phase scope (Q-AUDIT-2) | T2.4.W2.2 verify-work 144L 9-phase | T5.2 Axis A 9-phase matrix (F1-F6) |
| D-13 | tdd-gate fires_when 6 + skips_when 3 + 双 impl 候选 (superpowers + mattpocock) | T2.3.W0.2 tdd-gate.yaml + T2.4.W1.1 execute-task 02-code | T5.3 Scenario A F1-F7 |
| D-14 | special-purpose tools 13+ entry (Q-AUDIT-3) | T2.3.W0.1 capabilities.yaml Bucket 2 137-256L 13 entry | T5.4 Scenario B F6-F9 (13 entry + 5 bucket) |
| D-15 → reframe **Q-AUDIT-5a** | planning-with-files **Claude Code plugin /plan** NOT npm SDK (terminology drift fix) | T2.4.W1.3 plan-feature 05-persist + capabilities planning-with-files.impl=`claude-code-plugin` + W3.1 checkPlanningWithFiles 10th doctor | T5.3 Scenario B F10-F12 (impl=claude-code-plugin negative assert + real probe + anti-pattern grep guard 0/3) |
| D-16 | fallback.yaml 3 字段 + 6 override_signal + chain_isolation | T2.3.W0.2 fallback.yaml 35L | T5.4 Scenario C F10-F15 (6 fixture) |
| **Q-AUDIT-5b** errata | settings.json schema root-level `env.*` NOT nested `experimental.*` | Wave A 本地实证 fix + T2.3.W0.5 checkAgentTeams + ~/.claude/settings.json env=1 | T5.1 Axis B F4 (real probe status=pass + envValue='1' + settingsValue='1') |
| **Q-AUDIT-5c** errata | judgmentResolver.ts ~60L NEW (4 层 ref split + dual-schema routing) | T2.3.W0.4 judgmentResolver.ts 98L (final size > 60L 估计) | T5.1-T5.4 resolveJudgmentGate cross-verify (38+ runtime call) |

**16 D-decision + 3 Q-AUDIT-5 schema fix**: ✅ 13 D-decision 实装 dogfood-verified inline; D-05 + D-07 operational deferred Phase 2.6 close; D-15 reframe Q-AUDIT-5a verbatim verify。

---

## Axis 4 — Agent Teams + 三层栈 cadence validation

### Pattern A 全栈三路 first-use (Phase 2.4 W1 Team 1 实证)

- **Team**: `phase24-w1-execute-team` (Phase 2.4 W1 plan-feature + execute-task ship)
- **Teammate count**: 3 (frontend-spec + backend-spec + test-spec sister Pattern A composition per `~/.claude/rules/agent-teams.md` L52-55)
- **SendMessage round-trip count**: 4 round-trip (API contract align + mock data + 2 architectural arbitration)
- **Lifecycle**: TeamCreate → 3 Agent → 4 SendMessage round-trip → 3 shutdown_request → TeamDelete clean
- **Status**: ✅ Pattern A real-use first-time verified, sister CLAUDE.md L43-50 防呆清单 verbatim 遵循 (session-scoped + mandatory cleanup + token estimation + self-contained brief)

### Pattern C 4-specialist Multi-dim review (verify-work 09-agent-team-multispecialist)

- **Yaml gate**: `verify-work/workflow.yaml` L128-131 `parallelism: judgments.parallelism-gate.agent-teams-upgrade.fires` + on[] dual branch (`is_major_release or is_large_refactor → invoke` vs `both false → skip`)
- **4-specialist composition**: code-review (mattpocock) + gstack-review (Paranoid Staff Eng) + gstack-cso (security OWASP) + gstack-qa (E2E) + implicit team-lead (engine-level wiring NOT yaml scope)
- **Test fixture**: T5.2 Axis B F5 3 branch evaluation (major_release true / large_refactor true / neither false)
- **Status**: ✅ runtime evalGate 3 branch 全 PASS + composition reference 完整 + cleanup discipline impl-level wiring (NOT yaml strict scope per T2.4.W0.1 comment); live TeamCreate→SendMessage round-trip→TeamDelete lifecycle deferred 至 v2.0 GA 后 first user usage

### parallelism-gate 3 路径 + 5 升级触发 完整 verify (T5.1)

- **subagent-default** (默认): `parallel_count <= 3 AND communication_needed == false` ✅ F1
- **main-session-fallback**: `lines < 20 OR type == 'single_command_query'` ✅ F2
- **agent-teams-upgrade** OR-chain 5 trigger: teammate_send_message_needed / subagent_context_overflow / shared_task_list / opposing_hypothesis_debate / fullstack_three_way 各独立激活 fires=true ✅ F3.T1-T5 + F3.S sanity negative

### chain-isolation 独立 eval (R20.16 铁律 3, T5.4 F15)

- **Setup**: 战略层 `strategic-gate.office-hours.fires` (phase.type='bug_fix') → false (skip); Phase 层 `phase-gate.gsd-discuss-phase.fires` (open_decisions=3) → true (fires)
- **Result**: 两层独立 eval, 父子无继承 — 战略层 skip ≠ phase 层必须 skip ✅
- **Evidence**: CLAUDE.md「澄清/审查触发判据」节 "链式互不前置" 实装 runtime 验证

### fallback 3 铁律 runtime + 6 override_signal verbatim (T5.4 F11-F15)

- **铁律 1 (uncertain-skip-transparently)**: ✅ F11 schema + F12 TriggerNotFoundError throw path runtime
- **铁律 2 (user-explicit-override)**: ✅ F13 6 verbatim string (`先 brainstorm` + `跑 office-hours` + `讨论一下` + `office-hours` + `brainstorm` + `深度调研`) + F14 includes() match positive 6/6 + negative 3/3
- **铁律 3 (chain-isolation)**: ✅ F15 chain_isolation=true + 战略 skip ≠ phase fires 独立 eval 实证

---

## Axis 5 — Production bugs caught during dogfood (R8.1 sister benchmark value 实证)

Phase 2.5 dogfood-first methodology 在 v2.0 GA 前 catch 1 production bug, 修复后 baseline 通过 — 证明 dogfood-first 不是 cosmetic 流程 cost。

### 🐛 Bug 1 (T5.2 W2 catch): 3 处 uppercase OR/AND in workflow.yaml runtime fail

- **Source**: T5.2 Scenario F first-run dogfood (`tests/dogfood/verify-work-pattern-c.dogfood.test.ts:218` evalGate invokeExpr 抛 `GateEvalError: Gate eval failed: parse error [1:34]: Expected EOF`)
- **Root cause**: `src/workflow/exprBuilder.ts` PARSER_OPTIONS `logical: true` 启用 expr-eval logical operators, **expr-eval 关键字一律小写** (`or` / `and`)。yaml 中大写 `OR` / `AND` 被 Parser 当 identifier, 后续 token (`phase.is_large_refactor`) 解析失败抛 EOF 错误。
- **Affected files**:
  1. `workflows/verify-work/workflow.yaml` L140 `OR` → `or`, L142 `AND` → `and`
  2. `workflows/execute-task/phases.yaml` L65 `AND` → `and`, L67 `OR` → `or`
  3. `tests/workflow/verify-work-v2.test.ts:137` `toMatch(/OR/)` → `toMatch(/\bor\b/)` + 补充 lesson comment
- **Why not caught earlier**: Phase 2.4 W2.2 schema-shape unit test 用 `toMatch(/OR/)` 大写 regex 验 expression 字面包含 OR 子串, NOT runtime evalGate — schema-shape test 永不调用 expr-eval, 所以大写 OR/AND 静悄悄通过 schema validation 但 runtime 会爆。
- **Impact**: ⚠️ HIGH — verify-work Pattern C 升级在真 user invoke 时会因 GateEvalError abort, blocking R20.12 acceptance d "关键模块场景触发 gstack /review + 4-specialist Agent Team 全 round-trip"。
- **Methodology evidence**: dogfood-first catch real production bug NOT pass-by schema-shape test (regex `/OR/` static pass while runtime expr-eval Parser fails) — **proves R8.1 sister benchmark "dogfooding 内在动力" 不是 cosmetic 而是 fail-late 防线** (5-bug-class taxonomy: case-sensitive operator drift 属 type 4 yaml-runtime divergence)。
- **Status**: ✅ FIXED (re-run dogfood 6/6 PASS + full suite 860/864 pass post-fix, lesson 沉淀 verify-work-v2.test.ts 注释作 future-Phase 防呆 anchor)

---

## Aggregate metrics

- **NEW fixture across 4 cycle**: W1 5 + W2 6 + W3 20 + W4 15 = **46 NEW dogfood fixture** (target ≥40 ✅)
- **R20.x dogfood coverage**: **13/15 active** (R20.5 + R20.9 operational deferred Phase 2.6 close ship)
- **Full test suite**: ✅ **895 passed / 4 skipped / 0 failed** (sister Phase 2.5 W4 baseline maintained — W5 aggregate-only 0 NEW fixture)
- **Biome lint**: ✅ clean (sister Phase 2.1/2.2/2.3/2.5-W1/W2/W3/W4 7-recurrence project memory preempt successful across cycle)
- **TypeScript noEmit**: ✅ exit 0 (0 type error)
- **Production bugs caught + fixed during dogfood**: 1 (Bug 1 W2 catch — uppercase OR/AND runtime fail; impact HIGH; fixed inline NO regression)

## v2.0 Architecture Refactor scope LOCKED ✅

- ✅ **16 D-decision + 3 Q-AUDIT-5 schema fix** all 实装 (13 D dogfood-verified inline + D-05 + D-07 operational Phase 2.6 deferred)
- ✅ **4 workflows v2 shipped** (research NEW + plan-feature v2 + execute-task v2 + verify-work NEW)
- ✅ **judgments/ 6 file** (D-04 + D-16 multi-file 分类: parallelism + tdd + fallback + strategic-gate + phase-gate + subtask-gate)
- ✅ **capabilities.yaml 39 entry** (37 + 2 gsd-discuss-phase + gsd-plan-phase NS resolved per Phase 2.4 retro)
- ✅ **expr-eval + judgmentResolver + checkAgentTeams + fallbackHandlers + exprBuilder + phaseFactContext** 6 NEW src lib file
- ✅ **TypeBox schema 3 file** (capabilities + judgment dual-schema rules+triggers + phaseFactContext + workflow.v2 4 surface)
- ✅ **doctor MIN 8→10** (Agent Teams + planning-with-files real probe v2.34.0)
- ✅ **Pattern A real-use first-time** (Phase 2.4 W1 Team 1 phase24-w1-execute-team 3 teammate + 4 SendMessage round-trip)
- ✅ **Pattern C composition + on[] gate** (verify-work 09-agent-team-multispecialist runtime evalGate 3 branch verified)
- ✅ **fallback 3 铁律 + 6 override_signal + chain-isolation** runtime verbatim
- ✅ **Dogfood-first catch 1 production bug** (uppercase OR/AND fix — R8.1 sister benchmark value 实证)

## Next

Phase v2.0-2.6 close cadence (per PLAN L545-730):

- **W0 ADR backfill** (6 ADR 0024-0029 per ADR 0011 9-section pattern):
  - ADR 0024 — workflow schema v2 + capability abstraction (D-01 + D-02 + D-09)
  - ADR 0025 — capabilities.yaml v2.0 baseline + static manifest discipline (D-07 + D-14)
  - ADR 0026 — judgments/ 6 file + expr-eval + judgmentResolver (D-03 + D-04 + D-16 + Q-AUDIT-5c errata)
  - ADR 0027 — research + verify-work NEW workflows + planning-with-files plugin reframe errata (D-08 + D-12 + Q-AUDIT-5a)
  - ADR 0028 — ralph-loop + TDD + Agent Teams 路由 (D-10 + D-11 + D-13 + Q-AUDIT-5b schema fix errata)
  - ADR 0029 — fallback 3 铁律 runtime + 4-stage 机器化 dogfood (R20.16 + Phase 2.5 dogfood evidence)
- **W1 ship artifacts**: CHANGELOG [2.0.0] + ci.yml A7 step 0023→0029 + package.json 1.0.4→2.0.0 + README v2.0 highlight + docs/WORKFLOW.md v0.5+ 路线图全 SHIPPED 反映 + RETROSPECTIVE v2.0 close + cross-milestone trend
- **W2 milestone close**: `.planning/milestones/v2.0-MILESTONE-AUDIT.md` ship + tag triple LOCAL CREATE (`v2.0.0-alpha.1` + `v2.0.0-rc.1` ← 本 T2.5.W5.1 LOCAL CREATE + 🎯 `v2.0.0`)
- **W3 publish** (user approval gated): `publish.yml` tag-trigger npm publish (sister ADR 0023 OIDC + sigstore provenance pattern verbatim reuse) — user push `🎯 v2.0.0` tag 手动触发 LIVE

---

*Phase v2.0-2.5 W5 Cycle 5 — DOGFOOD AGGREGATE 5-axis 16 R20.x end-to-end verification*
*Run: 2026-05-20*
*Sister Phase 4.3 60L aggregate pattern extended ~180L 5-axis*
