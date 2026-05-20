# Phase v2.0-2.5 W3 Cycle 3 — TDD + planning-with-files + ralph-loop Dogfood Report

**Date**: 2026-05-20
**Phase**: v2.0-2.5 W3 Cycle 3 (tdd-gate auto-invoke + planning-with-files /plan plugin + ralph-loop COMPLETE gate dogfood)
**R coverage**: R20.10 (ralph-loop COMPLETE + fallback) + R20.13 (tdd-gate 6 fires + 3 skips) + R20.15 (planning-with-files Claude Code plugin /plan) + Q-AUDIT-5a (impl=claude-code-plugin NOT npm-sdk reframe)
**Test artifact**: `tests/dogfood/tdd-plan-ralph.dogfood.test.ts` (20 fixture NEW, 273L)
**Verdict**: **PASS** (3/3 axes verified, 0 deviation)

---

## Scenario A — TDD-gate auto-invoke (R20.13)

**Setup**: 真接 `resolveJudgmentGate()` (T2.3.W0.4 SHIPPED 98L) → `evalGate()` (T2.3.W0.3 SHIPPED 53L expr-eval Parser singleton) → `Value.Check(JudgmentTriggersFile)` (T2.3.W0.6 SHIPPED 86L) full path, **NOT mock**. `packageRoot = process.cwd()` 真接 fs.readFile `workflows/judgments/tdd-gate.yaml` (W0.2 SHIPPED 6 fires + 3 skips)。
**Action**: 6 fires_when 触发 + 3 skips_when 跳过 + capabilities.yaml tdd entry aliases + execute-task phases.yaml 02-code on[] tdd-gate clause wiring 完整 matrix verify:

| Input | Trigger field | Result | Fixture |
|-------|---------------|--------|---------|
| `subtask.is_core_business_logic = true` | fires | ✅ true | F1 |
| `subtask.is_algorithm = true` | fires | ✅ true | F2 |
| `subtask.is_data_processing = true` | fires | ✅ true | F3 |
| `subtask.regression_risk = 'high'` | fires | ✅ true | F4 |
| `subtask.reliability_required = true` | fires | ✅ true | F4 |
| `subtask.type = 'crud'` | skips | ✅ true | F5 |
| `subtask.type = 'ui_polish'` | skips | ✅ true | F5 |
| `subtask.type = 'docs_only'` | skips | ✅ true | F5 |
| `capabilities.tdd.aliases[0].impl = mattpocock-skills` + `.cmd = /tdd` | wire | ✅ verified | F6 |
| execute-task 02-code on[] `if: judgments.tdd-gate.tdd-strongly-suggested.fires` → `invoke: {{ capabilities.tdd.cmd }}` | wire | ✅ verified | F7 |

**Acceptance**: 6 fires + 3 skips 独立激活全验 + capabilities.yaml tdd entry 双 impl 候选 alias (superpowers 主 + mattpocock /tdd 备 per D-13) + execute-task workflow 02-code phase 真接 tdd-gate conditional invoke wiring 完整。R20.13 acceptance (a) schema 6+3 字段 ✅; (b) capabilities entry alias 2 个 impl 候选 ✅; (c) execute-task workflow 引用 tdd-gate trigger ✅; (d) 核心算法/数据处理子任务自动 invoke TDD ✅。
**Status**: ✅ PASS (F1-F7 covered)

## Scenario B — planning-with-files /plan plugin invoke (R20.15 + Q-AUDIT-5a)

**Setup**: 真接 fs.readFile `workflows/plan-feature/workflow.yaml` + `workflows/capabilities.yaml` + parseYaml + Value.Check(WorkflowSchemaV2/Capabilities); 真接 `checkPlanningWithFiles()` (T2.4.W3.1 SHIPPED 58L 10th doctor check) probe dev machine 实际 plugin 安装状态。Q-AUDIT-5a 2026-05-20 LOCK terminology reframe: planning-with-files **是 Claude Code plugin NOT npm SDK** (npm registry 404 verified)。
**Action**: 6 fixture × capability template + literal /plan + 3 file artifacts + impl=claude-code-plugin + real probe + anti-pattern grep guard 完整 verify:

| Aspect | Expectation | Result | Fixture |
|--------|-------------|--------|---------|
| 05-persist capability | `{{ capabilities.planning-with-files.cmd }}` template | ✅ matched | F8 |
| 05-persist invokes | `/plan` literal (NOT npm SDK NOT fs.writeFile) | ✅ matched | F8 |
| 05-persist artifacts_expected | `[task_plan.md, progress.md, findings.md]` | ✅ exact 3 file | F9 |
| capabilities.yaml planning-with-files.impl | `claude-code-plugin` (NOT `npm-sdk` per Q-AUDIT-5a) | ✅ matched + negative assert | F10 |
| capabilities.yaml planning-with-files.requires.plugin | matches `planning-with-files >=2\.2\.0` regex | ✅ matched | F10 |
| capabilities.yaml planning-with-files.outputs | `[task_plan.md, progress.md, findings.md]` | ✅ exact | F10 |
| `checkPlanningWithFiles()` real probe | dev machine status=pass + version stamp | ✅ pass (v2.34.0 ≥ 2.2.0) | F11 |
| Anti-pattern grep guard | 0 hit `npm-sdk` + 0 hit `fs.writeFile` + 0 hit `writeFile(` in yaml values (comments stripped) | ✅ 0/3 | F12 |
| plan-feature workflow.yaml | TypeBox WorkflowSchemaV2 Value.Check pass | ✅ schema_version v2 + workflow=plan-feature | F13 |

**Acceptance**: capabilities.yaml planning-with-files entry impl=`claude-code-plugin` (NOT npm-sdk) + plugin >=2.2.0 + outputs 3 file ✅; plan-feature 05-persist `invokes: '/plan'` literal + capability template + artifacts_expected 3 file ✅; checkPlanningWithFiles dev machine v2.34.0 real probe pass ✅; anti-pattern grep guard 完全干净 ✅。R20.15 acceptance (a)~(d) + Q-AUDIT-5a reframe 全验。
**Status**: ✅ PASS (F8-F13 covered)

**Note on live `/plan` round-trip**: 完整 `/plan-feature → 05-persist → /plan plugin invocation → .planning/<phase-id>/{task_plan.md, progress.md, findings.md}` 3 file 生成 lifecycle 因 orchestrator brief "DO NOT spawn sub-subagents" 约束 deferred 至 v2.0 GA 后 first user usage; 本 Cycle 3 验证 yaml capability wiring + plugin presence + impl 字段语义正确性 — wiring 错则 lifecycle 必失败, prerequisite-first surgical verification (sister Phase 2.5 W1/W2 同 pattern, deferred 同性质)。

## Scenario C — ralph-loop COMPLETE gate (R20.10)

**Setup**: 真接 fs.readFile `workflows/execute-task/phases.yaml` + `workflows/defaults.yaml` + `workflows/capabilities.yaml` + `src/routing/lib/fallbackHandlers.ts` 4 SoT。`evalGate()` (T2.3.W0.3 SHIPPED) runtime spot-check both branches。Sister Phase 2.2 v0.2.0 SHIPPED `src/routing/lib/ralphLoop.ts` 50L (ADR 0011 dual-signal 4-layer isComplete) **复用 NOT 重写**。
**Action**: 7 fixture × capability template + completion_promise + max_iterations interpolation + fallback schema + sdk_ref + handlers export + on[] dual branch + schema invariant 完整 verify:

| Aspect | Expectation | Result | Fixture |
|--------|-------------|--------|---------|
| 04-deliver capability | `{{ capabilities.ralph-loop.cmd }}` template | ✅ matched | F14 |
| 04-deliver args.completion_promise | `COMPLETE` literal | ✅ matched | F14 |
| 04-deliver args.max_iterations | `{{ defaults.ralph_max_iterations.execute-task.04-deliver }}` template | ✅ matched | F14 |
| defaults.yaml ralph_max_iterations.execute-task.04-deliver | `20` (within 1-100 hard_upper_limit) | ✅ 20 ≤ 100 STRIDE T-2.2-05 DoS cap | F15 |
| 04-deliver fallback.max_iterations_exceeded.action | `emit_warning_and_halt` (R20.10 explicit NOT silent) | ✅ matched | F16 |
| 04-deliver fallback.max_iterations_exceeded.message | contains `{{ args.max_iterations }}` placeholder (sister handleMaxIterationsExceeded regex substitute) | ✅ regex matched | F16 |
| 04-deliver fallback.max_iterations_exceeded.exit_code | `1` | ✅ matched | F16 |
| capabilities.yaml ralph-loop.impl | `bundled-skill` | ✅ matched | F17 |
| capabilities.yaml ralph-loop.cmd | `ralph-loop` | ✅ matched | F17 |
| capabilities.yaml ralph-loop.sdk_ref | `src/routing/lib/ralphLoop.ts` (Phase 2.2 sister 复用) | ✅ matched | F17 |
| fallbackHandlers.ts exports `handleMaxIterationsExceeded` | grep `export\s+function\s+handleMaxIterationsExceeded` hit | ✅ matched | F18 |
| fallbackHandlers.ts exports `handleVerbatimCompleteFail` | grep `export\s+function\s+handleVerbatimCompleteFail` hit | ✅ matched | F18 |
| fallbackHandlers.ts contains `process.exit(fallback.exit_code)` | explicit halt path (R20.10 c) | ✅ matched | F18 |
| 04-deliver on[0] `if: 'subtask.lines >= 20 and subtask.type != "single_command_query"'` → invoke ralph-loop.cmd | wrapper branch | ✅ matched + runtime evalGate=true | F19 |
| 04-deliver on[1] `if: 'subtask.lines < 20 or subtask.type == "single_command_query"'` → action: skip | main-session-fallback branch | ✅ matched + runtime evalGate=true | F19 |
| execute-task phases.yaml | TypeBox WorkflowSchemaV2 Value.Check pass | ✅ schema invariant | F20 |
| capabilities.yaml | TypeBox Capabilities Value.Check pass | ✅ schema invariant | F20 |

**Acceptance**: 04-deliver capability template interpolation + completion_promise=COMPLETE literal + max_iterations defaults interpolation + fallback.max_iterations_exceeded 三字段 schema (action=emit_warning_and_halt / message=含 placeholder / exit_code=1) + on[] dual branch (ralph-loop wrapper invoke + main-session-fallback skip) + capabilities.yaml ralph-loop sdk_ref 复用 Phase 2.2 ralphLoop.ts + fallbackHandlers.ts export 双 handler + R20.10 acceptance c "explicit NOT silent" 全验。
**Status**: ✅ PASS (F14-F20 covered)

**Note on live ralph-loop iteration round-trip**: 完整 `ralph-loop → spawn subagent → iterate → verbatim COMPLETE detection → return` lifecycle 因 orchestrator brief "DO NOT spawn sub-subagents" 约束 deferred 至 v2.0 GA; 本 Cycle 3 验证 yaml wiring + SDK ref + fallback handler export + on[] branch logic — wiring 错则 lifecycle 必失败, prerequisite-first surgical verification per Karpathy simplicity (sister Phase 2.5 W1 F4 / W2 F5 同 pattern)。

---

## Aggregate verification

- **R20.13 tdd-gate 6 fires + 3 skips 独立激活**: ✅ Scenario A F1-F5 (6 fires_when + 3 skips_when 真接 resolveJudgmentGate full path)
- **R20.13 capabilities.yaml tdd entry alias**: ✅ Scenario A F6 (superpowers primary + mattpocock /tdd alias 双 impl 候选 per D-13)
- **R20.13 execute-task 02-code tdd-gate conditional wiring**: ✅ Scenario A F7 (phase on[] judgments.tdd-gate.tdd-strongly-suggested.fires → invoke capabilities.tdd.cmd)
- **R20.15 + Q-AUDIT-5a planning-with-files Claude Code plugin /plan invoke**: ✅ Scenario B F8-F10 (capability template + invokes /plan literal + impl=claude-code-plugin + outputs 3 file)
- **R20.15 acceptance d plugin real probe**: ✅ Scenario B F11 (checkPlanningWithFiles dev machine v2.34.0 ≥ 2.2.0 status=pass)
- **R20.15 anti-pattern guard (Q-AUDIT-5a reframe)**: ✅ Scenario B F12 (0 hit npm-sdk + 0 hit fs.writeFile + 0 hit writeFile() in yaml values)
- **R20.10 ralph-loop 4-deliver capability + args + max_iterations + fallback**: ✅ Scenario C F14-F16 (capability template + completion_promise=COMPLETE + max_iterations=20 + fallback 三字段)
- **R20.10 acceptance c "explicit NOT silent" halt path**: ✅ Scenario C F18 (fallbackHandlers.ts process.exit(fallback.exit_code) + 双 handler export)
- **R20.10 sdk_ref Phase 2.2 复用 NOT 重写**: ✅ Scenario C F17 (capabilities.yaml ralph-loop.sdk_ref = src/routing/lib/ralphLoop.ts)
- **R20.4 schema invariant**: ✅ Scenario B F13 + Scenario C F20 (plan-feature + execute-task TypeBox WorkflowSchemaV2 Value.Check pass + capabilities.yaml Capabilities Value.Check pass)
- **Full test suite gate**: ✅ 880 passed / 4 skipped / 0 failed (vitest direct run — baseline 860 Cycle 2 + 20 NEW Cycle 3 dogfood fixture)
- **Biome lint**: ✅ clean (no fixes applied — sister Phase 2.1/2.2/2.3/2.5-W1/W2 5-recurrence project memory preempt successful)
- **TypeScript noEmit**: ✅ exit 0 (0 type error — 3 处 `if (!x) throw` 非空断言修复 `Record<string, X>` index access TS18048 strict mode warning)

## Lessons learned

- **`Record<string, X>` strict index access trap**: capabilities.yaml schema 用 `Type.Record(Type.String(), CapabilityEntry)` → TypeScript `caps.capabilities.tdd` 类型为 `CapabilityEntry | undefined`。strict mode 13 处 TS18048 first-run 抛错 — 修复 = `expect(x).toBeDefined()` 后加 `if (!x) throw new Error(...)` 非空断言 narrow type。`Record<string, T>` index access 永远 `T | undefined` 是 TypeScript 4.1+ noUncheckedIndexedAccess 行为, 与 `interface { tdd: CapabilityEntry }` 不同。dogfood test 大量用 capabilities entry 时应 default-add 非空断言模板。
- **`fs.writeFile` anti-pattern grep 需 strip comments**: F12 first impl 漏 strip yaml `#` comment, plan-feature/workflow.yaml L14 `# - NO fs.writeFile self-impl (no `fs.writeFile` ...)` 注释行触发 false-positive 命中。fix: `raw.split('\n').filter((l) => !l.trimStart().startsWith('#')).join('\n')` 先 strip comments 再 grep, 才 0/3 anti-pattern hit 干净。yaml SoT 注释经常引用反例字符串作 documentation, anti-pattern guard 必须区分 value vs comment。
- **dev machine plugin path 实证**: F11 checkPlanningWithFiles real probe 命中 `~/.claude/plugins/cache/planning-with-files/planning-with-files/2.34.0/` (Q-AUDIT-5a reframe verified location)。capabilities.yaml `plugin_path` 字段是 maintainer-documented hint, 不是 doctor probe 实际查找路径 — checkPlanningWithFiles 使用 hardcoded `~/.claude/plugins/cache/planning-with-files/planning-with-files/` root + readdir version subdir filter `/^\d+\.\d+/` pattern。dev machine 2.34.0 ≥ 2.2.0 requirement R20.15 acceptance ✅。
- **Biome 5-recurrence preempt 仍生效**: dogfood test 写完直跑 biome 0 auto-fix needed (清), 沿袭 Phase 2.1/2.2/2.3/2.5-W1/W2 累积 5 次 CI-red preempt lesson, **不**触发本 Cycle CI red 6th recurrence。`Record<string, X>` strict access 13 处 TS18048 是新 trap, 与 biome lint 正交 — biome 不 catch 类型问题, tsc 才 catch。
- **3-Scenario surgical scope 一致性**: W1 F1-F5 (5 fixture, parallelism-gate + Agent Teams env) → W2 F1-F6 (6 fixture, verify-work 9-phase + Pattern C) → W3 F1-F20 (20 fixture, 3 Scenario × ~7 each — TDD + planning-with-files + ralph-loop)。3 Cycle 累计 dogfood = 31 fixture 覆盖 R20.10 + R20.11 + R20.12 + R20.13 + R20.14 + R20.15 + R20.16 + Q-AUDIT-5a + Q-AUDIT-5b 全集。W4 + W5 仍需收尾 R20.8 + R20.9 + R20.16 aggregate。

## Next

Phase 2.5 W4 Cycle 4 — mattpocock 招式 auto-invoke + fallback 3 铁律 + special-purpose tools dogfood + DOGFOOD-T5.4.md (per PLAN L500-517; R20.8 + R20.9 + R20.14 + R20.16 主 target)。

---

*Phase v2.0-2.5 W3 Cycle 3 — TDD + planning-with-files + ralph-loop dogfood report*
*Run: 2026-05-20*
