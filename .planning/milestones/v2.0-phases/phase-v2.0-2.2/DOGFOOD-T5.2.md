# Phase v2.0-2.5 W2 Cycle 2 — verify-work + Pattern C 4-specialist Dogfood Report

**Date**: 2026-05-20
**Phase**: v2.0-2.5 W2 Cycle 2 (verify-work 9-phase + Pattern C 4-specialist Agent Team dogfood)
**R coverage**: R20.12 (verify-work full 4-stage 9-phase) + R20.11 (parallelism-gate + Pattern C 升级) + R20.14 (gstack 3 可选 conditional invoke)
**Test artifact**: `tests/dogfood/verify-work-pattern-c.dogfood.test.ts` (6 fixture NEW, 226L)
**Verdict**: **PASS** (3/3 axes verified; 1 production yaml bug fixed via Rule 1 deviation)

---

## Axis A — R20.12 verify-work 9-phase 实装 matrix verify

**Setup**: 真接 fs.readFile `workflows/verify-work/workflow.yaml` → `parseYaml()` → `Value.Check(WorkflowSchemaV2)` 三步链 (NOT mock)。Sister T2.4.W2.2 SHIPPED 144L 9-phase + T2.4.W0.1 SHIPPED 87L WorkflowSchemaV2。
**Action**: 9 phase id + gate / on logic + parallelism reference + action branch 完整 matrix verify:

| Phase | Type | Gate / on logic | Verify |
|-------|------|-----------------|--------|
| 01-gsd-verify-work | 必跑串行 | unconditional (no on / no gate) | ✅ F1 |
| 02-gsd-progress | 必跑串行 | unconditional | ✅ F1 |
| 03-code-review-parallel | 并行 fan-out | `parallelism: judgments.parallelism-gate.subagent-default.fires` resolved fires=true (parallel_count=3, no comm) | ✅ F2 |
| 04-gstack-review-conditional | 关键模块强制 | `on[0]: phase.is_critical_module == true → invoke`; `on[1]: == false → skip` 双 branch | ✅ F3 |
| 05-qa-conditional | 可选 | `phase.has_ui_changes` true→invoke / false→skip | ✅ F4 (2 sub) |
| 06-cso-conditional | 可选 | `phase.has_auth_or_secrets` true→invoke / false→skip | ✅ F4 (2 sub) |
| 07-design-review-conditional | 可选 | `phase.has_design_changes` true→invoke / false→skip | ✅ F4 (2 sub) |
| 08-code-simplifier | 末尾串行 | unconditional | ✅ F1 |
| 09-agent-team-multispecialist | Pattern C 升级 | `is_major_release or is_large_refactor → invoke` (OR-chain); 二者 both false → skip | ✅ F5 (3 branch) |

**Acceptance**: 9 phase id 全 verified + 必跑串行 3 phase unconditional shape verified + 6 conditional phase 双 branch evalGate 全 PASS + parallelism reference resolved runtime fires=true。R20.12 acceptance (a) ≥7 phase 实装实证: 9 ≥ 7 ✅; (b) Agent Team gate expression expr-eval 验证 ✅ (F5 invoke/skip 各 branch evalGate runtime PASS).
**Status**: ✅ PASS

## Axis B — Pattern C 4-specialist 升级 conditional logic 验证

**Setup**: 真接 `evalGate()` (T2.3.W0.3 SHIPPED expr-eval Parser singleton, NOT mock) + `resolveJudgmentGate()` (T2.3.W0.4 SHIPPED) 双链路 verify。sister `~/.claude/rules/agent-teams.md` L61-64 Pattern C "多维度审查 ≥3 specialist + lead 委派" verbatim, capability mapping per `workflows/capabilities.yaml` L259-345。
**Action**: F5 fixture 3 branch evaluation:

| Branch | Context | Invoke expr (`...is_major_release == true or ...is_large_refactor == true`) | Skip expr | 4-specialist team 形成 |
|--------|---------|---|---|---|
| 1 (major release) | `{is_major_release: true, is_large_refactor: false}` | ✅ true (OR-chain 第一项) | false | ✅ form team |
| 2 (large refactor) | `{is_major_release: false, is_large_refactor: true}` | ✅ true (OR-chain 第二项) | false | ✅ form team |
| 3 (neither) | both false | ✅ false | ✅ true | ❌ skip → fallback subagent fan-out (R20.16 chain_isolation per sister Phase 2.5 W1) |

**4-specialist Pattern C composition** (per ~/.claude/rules/agent-teams.md Pattern C + workflow.yaml L128-131 comment):
- `code-review` (capabilities.yaml L259 mattpocock-skills)
- `gstack-review` (Paranoid Staff Eng, capabilities.yaml L283)
- `gstack-cso` (security OWASP, capabilities.yaml L295)
- `gstack-qa` (E2E, capabilities.yaml L287)
- + implicit `team-lead` (Pattern C lead 委派 — workflow engine wiring, NOT yaml v2 schema scope per T2.4.W0.1 comment)

`parallelism: judgments.parallelism-gate.agent-teams-upgrade.fires` reference resolved fires=true on spot-check (teammate_send_message_needed=true, 4 others=false) — sister Phase 2.5 W1 F3 already verified 5 trigger OR-chain 独立激活全集。
**Acceptance**: Pattern C 3 branch logic 全验 + 4-specialist composition reference 完整 + cleanup discipline (SendMessage shutdown_request + TeamDelete) 实装位置 = workflow engine-level wiring (per T2.4.W0.1 comment + agent-teams.md L42-50 防呆清单, NOT yaml schema strict scope)。
**Status**: ✅ PASS

**Note on live TeamCreate→SendMessage round-trip→TeamDelete lifecycle**: 完整 round-trip 因 orchestrator brief "DO NOT spawn sub-subagents" 约束 deferred 至 v2.0 GA 后 first user usage; 本 Cycle 2 验证 yaml gate path + on[] conditional branch logic + 4-specialist composition reference 完整性 — gate 实装错则 lifecycle 必失败, prerequisite-first surgical verification (sister Phase 2.5 W1 Cycle 1 同 pattern, deferred 同性质)。

## Axis C — R20.14 gstack 3 可选 conditional invoke 各命中 1 次

**Setup**: 真接 F4 fixture 3 phase × 2 branch = 6 sub-scenario loop assertion (`evalGate(invokeExpr, ctx)` + `evalGate(skipExpr, ctx)` 两 branch 各 1 真值 evaluation)。
**Action**:

| Phase | factKey | invoke branch (true→invoke) | skip branch (false→skip) |
|-------|---------|------|------|
| 05-qa-conditional | `has_ui_changes` | ✅ evalGate fires=true | ✅ evalGate fires=true |
| 06-cso-conditional | `has_auth_or_secrets` | ✅ evalGate fires=true | ✅ evalGate fires=true |
| 07-design-review-conditional | `has_design_changes` | ✅ evalGate fires=true | ✅ evalGate fires=true |

**Acceptance**: R20.14 gstack 可选 3 工具 (/qa /cso /design-review) conditional invoke 各命中 1 次 + skip branch (R20.16 chain_isolation else-branch) 各命中 1 次, 6 sub-scenario 全 verified。`workflows/capabilities.yaml` 含 `gsd-progress` / `gstack-qa` / `gstack-cso` / `gstack-design-review` 4 entry (sister Phase 2.3 W0.1 SHIPPED, R20.12 acceptance (c) 已验)。
**Status**: ✅ PASS

---

## Aggregate verification

- **R20.12 verify-work full 4-stage 9-phase**: ✅ Axis A (9 phase id + matrix 全 verified; 必跑 2 + 并行 1 + 强制 1 + 可选 3 + 末尾 1 + Pattern C 升级 1 = 9)
- **R20.11 Pattern C 4-specialist 升级 conditional logic**: ✅ Axis B (3 branch evalGate 全 PASS + parallelism gate resolve OK + composition reference 完整)
- **R20.14 gstack 3 可选 conditional invoke**: ✅ Axis C (6 sub-scenario × 2 branch all evalGate fires=true)
- **R20.4 yaml schema invariant**: ✅ F6 (verify-work/workflow.yaml `Value.Check(WorkflowSchemaV2)` pass + schema_version literal verified)
- **Full test suite gate**: ✅ 860 passed / 4 skipped / 0 failed (vitest direct run — baseline 854 + 6 NEW Cycle 2 dogfood fixture)
- **Biome lint**: ✅ clean (1 expect-fold auto-fix applied post-write — sister Phase 2.1/2.2/2.3/2.5-W1 4-recurrence project memory preempt successful)
- **TypeScript noEmit**: ✅ exit 0 (0 type error)

## Deviation log (Rule 1 — bug discovered during dogfood)

### [Rule 1 - Bug] verify-work/workflow.yaml + execute-task/phases.yaml uppercase OR/AND → expr-eval parse error

- **Found during**: F5 first run (verify-work-pattern-c.dogfood.test.ts:218 evalGate invokeExpr 抛 `GateEvalError: Gate eval failed: parse error [1:34]: Expected EOF`)
- **Root cause**: `src/workflow/exprBuilder.ts` PARSER_OPTIONS `logical: true` 启用 expr-eval logical operators, **expr-eval 关键字一律小写** (`or` / `and`)。yaml 中大写 `OR` / `AND` 被 Parser 当 identifier, 后续 token (`phase.is_large_refactor`) 解析失败抛 EOF 错误。
- **Affected files**:
  - `workflows/verify-work/workflow.yaml:140-142` (Pattern C 09-agent-team-multispecialist on[].if)
  - `workflows/execute-task/phases.yaml:65-67` (04-deliver on[].if)
- **Why not caught earlier**: Phase 2.4 W2.2 schema-shape unit test (`tests/workflow/verify-work-v2.test.ts:137`) 用 `toMatch(/OR/)` 大写 regex 验 expression 字面包含 OR 子串, NOT runtime evalGate — schema-shape test 永不调用 expr-eval, 所以大写 OR/AND 静悄悄通过 schema validation 但 runtime 会爆。
- **Fix**: 3 处统一改小写 (匹配 `judgments/*.yaml` 4 文件 + `plan-feature/workflow.yaml` SoT pattern):
  1. `workflows/verify-work/workflow.yaml` L140 `OR` → `or`, L142 `AND` → `and`
  2. `workflows/execute-task/phases.yaml` L65 `AND` → `and`, L67 `OR` → `or`
  3. `tests/workflow/verify-work-v2.test.ts:137` `toMatch(/OR/)` → `toMatch(/\bor\b/)` + 补充 comment 说明 dogfood lesson
- **Verification**: re-run dogfood 6/6 PASS + full suite 860/864 pass (老 test 同步后)
- **Impact**: production bug 严重度 = ⚠️ HIGH (verify-work Pattern C 升级在真 user invoke 时会因 GateEvalError abort, blocking R20.12 acceptance d "关键模块场景触发 gstack /review + 4-specialist Agent Team 全 round-trip")。Dogfood-first methodology 在 GA 前 catch — sister CLAUDE.md "dogfooding 内在动力 R8.1" 价值实证。
- **No commit**: per orchestrator brief, batch commit by main session post Phase 2.5 全 5 cycle ship。

## Lessons learned

- **Dogfood-first 真 catch production bug**: F5 first-run 失败暴露 workflow.yaml 真实 syntax 不合 expr-eval 关键字小写规则 — schema-shape test 不替代 runtime gate eval test。这是 Phase 2.5 dogfood 内在动力的最直接收益 (R8.1 dogfooding 价值实证)。
- **expr-eval 关键字 case-sensitive 是单点 trap**: Parser 把大写 OR/AND 静默当 identifier, 不报 syntax error, 而是后续 token 解析时 EOF 错。这种 fail-late 模式比 fail-fast 更难调试。所有 yaml v2 `on[].if` / `gate` / `parallelism` expression 必须小写 logical operator — 建议 v2.x 加 schema-level validator 在 build-time 检测 (deferred to v2.x not v2.0 GA, per R8 freeze workflow scope)。
- **Schema-shape test ≠ runtime eval test**: 两类 test 互补不替代。Phase 2.4 W2.2 已写 schema-shape (verify-work-v2.test.ts), Phase 2.5 W2 dogfood 补 runtime evalGate (verify-work-pattern-c.dogfood.test.ts) — 两层网才能 catch case-sensitive 这类 yaml-runtime divergence bug。
- **Biome preempt 4-recurrence project memory 仍生效**: dogfood test 写完 biome auto-fix 1 处 (expect 单行折叠), clean — 沿袭 Phase 2.1/2.2/2.3/2.5-W1 4-recurrence CI-red preempt lesson, **不**触发本 Cycle CI red 5th recurrence。
- **Sub-subagent forbid → live Pattern C round-trip defer 至 v2.0 GA**: 与 Phase 2.5 W1 同 pattern, Cycle 2 范围聚焦 yaml gate path + on[] conditional branch + composition reference verify, 完整 TeamCreate→SendMessage round-trip→TeamDelete lifecycle 留给 GA 后 first user usage 自然评估 — surgical scope 与 prerequisite-first 一致 (Karpathy simplicity)。

## Next

Phase 2.5 W3 Cycle 3 — tdd-gate + planning-with-files + ralph-loop COMPLETE dogfood + DOGFOOD-T5.3.md (per PLAN L483-499; R20.10 + R20.13 + R20.15 主 target)。

---

*Phase v2.0-2.5 W2 Cycle 2 — verify-work + Pattern C 4-specialist dogfood report*
*Run: 2026-05-20*
