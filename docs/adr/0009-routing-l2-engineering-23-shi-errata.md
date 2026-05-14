# ADR-0009: Routing L2 + Engineering 23 招式 Errata (phase 1.5 D5 三 P1 interface contract delta + DAG + Semantic Router L2 + mattpocock_phases schema)

## Status

**Accepted** — 2026-05-14 (phase 1.5 plan-phase Wave 0)

## Context

### Phase 1.4 ship 8 接口契约 ready

phase 1.4（commit `99b1c2d`，tag `v0.1.0-alpha.4-routing-v1`）落地了 routing engine v1 全部实装，包括：

1. `engine.route(task, opts): Promise<EngineResult>` — 主流程入口，三态 discriminated union
2. `EngineResult` 三态 discriminated union (`ok` / `aborted` / `phase`) — stable export
3. `agentFactory: (task, decision, opts) => Promise<AgentDefinition>` — contract § 3 W-5 V1 BLOCKER 守恒
4. 4 typed error classes (`SkillNotInstalledError` / `InvalidDecisionError` / `MissingManifestError` / `RestartRequiredError`)
5. `SYSTEM_PROMPT` const + `COMPLETE_TOKEN` const — `src/routing/systemPrompt.ts` D-18 1:1 contract § 5.4
6. `installResearchWorkflowDeps()` — `src/routing/lib/installAdapter.ts` D1.4-4 sequential MCP + parallel ctx7
7. `routing/index.ts` barrel re-export — Pattern G 复用
8. `tests/integration/routing-30-samples.test.ts` SAMPLES inline truth table 30 entries — D-16 lock

### Phase 1.4 ADR 0008 errata 推 phase 1.5 evaluate 的 4 items

ADR 0008 § Decision 3（D1.4-2 contract delta）明确推 phase 1.5 evaluate 以下 4 个 errata items：

1. **D1.4-2 contract v1.1** — `AgentDefinition` 12 → 14 字段（`initialPrompt` + `criticalSystemReminder_EXPERIMENTAL`），phase 1.4 因 W-5 V1 BLOCKER 守恒不实装，推 phase 1.5
2. **F42 array semantic match** — `arbitrate()` v1 仅做 exact-match trigger 比对，emerge phase 1.4 execute 时 array element substring match 遗漏；phase 1.5 upgrade `decisionRules.ts` arbitrate ≤ 30L
3. **ralph-wiggum `<promise>COMPLETE</promise>` XML wrapper** — phase 1.4 沿用 raw `^COMPLETE$/m` regex，phase 1.5 upgrade XML wrapper 更健壮；`--add-plugin ralph-wiggum` phase 2.1+ smooth switchover
4. **Phase 1.5 interface contract delta** — 8 new phase-2.0-prereq contracts 全部 phase 1.5 ship

### Phase 1.5 scope 新增 items

phase 1.5 KICKOFF / PATTERNS / RESEARCH 三件套（commit `5eab091`）+ ASSUMPTIONS / PLAN / task_plan Wave B（commit `99b1c2d`）经 fresh 2026-05-14 plan-checker 通过（PLAN-CHECK.md，0 BLOCKER / 2 WARNING / 2 SUGGESTION — Option A direct execute）。phase 1.5 新增以下 scope：

- **DAG resolver** (`src/lib/dag.ts` ≤ 200L Kahn + cycle detect) — D1.5-1 lock
- **Semantic Router L2 stub** (`src/routing/semanticRouter.ts` ≤ 150L return null v0.1) — D1.5-2 lock（true embedding deferred v0.2+）
- **engineering category 5 rules** + `decision_rules.yaml` v2 `mattpocock_phases:` schema — D1.5-3 lock
- **mattpocock 23 招式 phase routing** 4 phase × 23 skill mapping table — D1.5-3 lock
- **manifest spec `phase` enum + `triggers` 字段** upgrade — D1.5-6 lock

### A7 守恒约束（ADR 0001-0008 main body 不可改）

phase 1.5 沿袭 ADR 0003 / 0005 / 0007 / 0008 errata 风格 — **不动 ADR 0001-0008 main body**（A7 守恒）。CI A7 step iterate 1-8 → 1-9，加入 ADR 0009 baseline。本 ADR 0009 起 phase 1.5 ship 时刻 frozen；v0.2+ 演化走 ADR 0010+ errata。

### Phase 1.3 sister review + phase 1.4 PLAN-CHECK lessons

phase 1.4 PLAN-CHECK round 2 锁定"每个新 enum value 必须配 test cell"（W-5 V1 BLOCKER sister patch）。phase 1.5 沿袭此原则：14 字段 enum value assert lands in T6.3；F42 array semantic match 配独立 test cell；XML wrapper regex 配 spike report 验证后再实装。

## Decision

### 1. D1.4-2 contract v1.1 — `AgentDefinition` 12 → 14 字段

phase 1.3 ship 的 `docs/AGENT-DEFINITION-FACTORY-CONTRACT.md` 12 字段 schema 经 fresh 2026-05-13 RESEARCH 验证 100% accurate。但官方 TypeScript SDK schema 多 2 个字段（phase 1.4 ADR 0008 § 3 暴露）：

| 新字段 | 类型 | 必填 | 稳定性 | 用途 | phase 1.5 决策 |
|---|---|---|---|---|---|
| `initialPrompt` | `string` | No | **Stable** (2026-05) | Auto-submitted as first user turn when plugin agent runs as main thread agent（限 plugin `settings.json` `agent: <name>` 升级场景） | **实装** — phase 1.5 T5.4 + T6.3 enum cell enforce |
| `criticalSystemReminder_EXPERIMENTAL` | `string` | No | **Experimental** (`_EXPERIMENTAL` suffix = field-name instability; see contract.md errata inline) | Critical reminder injected to system prompt — `_EXPERIMENTAL` suffix signals API may rename without semver bump | **实装** — phase 1.5 T5.4 + T6.3；`_EXPERIMENTAL` suffix 原样保留到 contract.md errata inline，不 strip |

**contract.md errata inline**: phase 1.5 T5.4 在 `docs/AGENT-DEFINITION-FACTORY-CONTRACT.md` 追加 errata note — "v1.1 (2026-05-14): fields 13-14 added: `initialPrompt: string` (Stable) + `criticalSystemReminder_EXPERIMENTAL: string` (Experimental — field name may change without semver bump; monitor `code.claude.com/docs/en/agent-sdk/typescript` release notes)"。

**W-5 V1 BLOCKER 守恒**: 14 字段 factory 依旧 W-5 V1 BLOCKER 严格守恒 — 新字段加入 contract v1.1，不动 v1 main body 已 frozen 的 1-12 字段语义；v1.1 仅是 additive errata（与 ADR 0003 install method count 5 → 6 + ADR 0005 marketplace_source 补完同模式）。

### 2. F42 array semantic match — `arbitrate()` upgrade

phase 1.4 ship 的 `src/routing/decisionRules.ts` `arbitrate()` 函数 v1 仅做 exact-match trigger 比对：`rule.trigger === task.category`。phase 1.4 execute 时 emerge **F42 finding**：priority-field array element 触发时，exact-match 遗漏 substring 包含关系（如 `task.prompt` 内含 trigger 关键词但非精确等值 → v1 miss）。

**upgrade specification**:

```typescript
// v2 array semantic match (arbitrate <=30L — D1.5-7 hard limit)
function matchesTrigger(trigger: string, task: TaskContext): boolean {
  return (
    task.prompt.toLowerCase().includes(trigger.toLowerCase()) ||
    (task.signals?.some(s => s.includes(trigger)) ?? false)
  );
}
```

**replaces** v1 exact-match miss；`decisionRules.ts` `arbitrate()` 函数实装 ≤ 30L（D1.5-7 hard limit）；F42 fix 预期 30 sample specific match 命中从 21/30 (70%) → ≥ 27/30 (≥ 90%，含 engineering 5 rules 4 specific)。

**测试覆盖**: phase 1.5 T5.3 + T6.4 验收；array element substring match 独立 test cell 必有。

### 3. ralph-wiggum `<promise>COMPLETE</promise>` XML wrapper

phase 1.4 `src/routing/systemPrompt.ts` + `src/lib/ralphLoop.ts` 沿用 raw `^COMPLETE$/m` regex。**问题**: agent 输出 think-out-loud 文本（如 "I should output COMPLETE to signal done"）可能触发误判；XML wrapper 消歧义更强。

**upgrade specification**:

- **`systemPrompt.ts` prompt body upgrade** (~10L 增量)：raw `^COMPLETE$/m` → `<promise>COMPLETE</promise>` verbatim；系统提示中指示 agent 输出 `<promise>COMPLETE</promise>` 标记完成（而非裸 `COMPLETE`）
- **`ralphLoop.ts` regex upgrade** (~10L 增量)：`/^COMPLETE$/m` → `/<promise>([^<]+)<\/promise>/` extract `match[1] === 'COMPLETE'`；避免 inline think-out-loud 的 `COMPLETE` 文本触发误判
- **`src/lib/promiseExtract.ts` hard split**（PLAN-CHECK W-2 建议吸收）：`ralphLoop.ts` 66L 已超 D1.4-3 ≤ 50L wedge；phase 1.5 T5.2 upgrade 做 hard split — `extractPromise(text): string | null` 提取到 `src/lib/promiseExtract.ts` (~30L)；`ralphLoop.ts` 主体 ≤ 50L strict，replace raw regex call → `lib/promiseExtract.extractPromise`

**phase 2.1+ smooth switchover**: `--add-plugin ralph-wiggum` 官方 plugin 切换时，XML wrapper 协议不变（`<promise>COMPLETE</promise>` 即 ralph-wiggum 官方 tag format）；phase 1.5 自实装 ≤ 50L wedge + XML wrapper = smooth switchover prerequisite。

**spike validation**: T2.1 + T2.2 spike report 先验证 regex `/<promise>([^<]+)<\/promise>/` 能正确从含 think-out-loud 文本的 string 提取 `COMPLETE`，且裸 `COMPLETE` 不触发误判；spike GO verdict → T5.1 / T5.2 实装。

### 4. Phase 1.5 interface contract delta — 8 new phase-2.0-prereq contracts

phase 1.5 ship 后，phase 2.0 v0.2.0 starting point = execute-task workflow + ralph-loop full integration。以下 8 接口契约全部 phase 1.5 ship：

| # | 接口契约 | ship 位置 | 状态 |
|---|---|---|---|
| 1 | `resolveDag(graph): string[]` Kahn topology interface | `src/lib/dag.ts` T3.1 | phase 1.5 ship |
| 2 | `semanticRouter.match(query, threshold) -> Promise<SemanticMatchResult>` v0.1 stub | `src/routing/semanticRouter.ts` T3.2 | phase 1.5 ship (return null stub) |
| 3 | `SemanticMatchResult` type (`matched: boolean / rule: Rule | null / confidence: number`) | `src/routing/semanticRouter.ts` T3.2 | phase 1.5 ship |
| 4 | `engine.route()` upgrade — DAG topology pre-check + semantic stub hook-in | `src/routing/engine.ts` T3.3 | phase 1.5 ship |
| 5 | `decision_rules.yaml` v2 `mattpocock_phases:` schema (4 phase × 23 skill) + engineering 5 rules | `routing/decision_rules.yaml` T4.1 | phase 1.5 ship |
| 6 | `AgentDefinition` v1.1 14 字段 (`initialPrompt` + `criticalSystemReminder_EXPERIMENTAL`) | `docs/AGENT-DEFINITION-FACTORY-CONTRACT.md` errata + `src/routing/agentDefinition.ts` T5.4 | phase 1.5 ship |
| 7 | `ManifestSpec` `phase` enum + `triggers` 字段 upgrade (14 fields total) | manifest schema + `src/types/spec.ts` T5.5 | phase 1.5 ship |
| 8 | XML wrapper protocol (`<promise>COMPLETE</promise>` extract) | `src/lib/promiseExtract.ts` + `src/lib/ralphLoop.ts` + `src/routing/systemPrompt.ts` T5.1-T5.2 | phase 1.5 ship |

## Consequences

### 正面

1. **phase 1.5 engineering category routing + mattpocock 23 招式 phase routing ship transparency** (R6 from ADR 0008 § Consequences R6 跟踪条目 closed):
   - R6-1 engineering category routing rules ✅ phase 1.5 T4.1 (5 rules yaml v2)
   - R6-2 mattpocock 23 招式 phase routing schema ✅ phase 1.5 T4.1 (4 phase × 23 entries yaml v2)
   - R6-3 `--add-plugin ralph-wiggum` smooth switchover ✅ phase 1.5 XML wrapper prerequisite T5.1-T5.2
   - R6-4 DAG resolver + Semantic Router L2 stub ✅ phase 1.5 T3.1-T3.3 (v0.2+ true embedding deferred)
   - R6-5 100+ sample × 多 model × stability 验收 — still v0.3.0 phase 3.4 scope（phase 1.5 仅 30 sample 内部基线）

2. **A7 守恒持续** — ADR 0001-0008 main body 0 修改；本 ADR 加 `adr-0009-accepted` baseline tag，CI A7 step iterate 1-8 → 1-9（task_plan T1.2 同步落地）

3. **100% capture verify roadmap A1prime/A5prime/A7prime closure** (PLAN-CHECK Section 8):
   - **A1prime** (engineering 5 rules ship) ✅ CLOSED — T4.1 yaml v2
   - **A5prime** (mattpocock_phases ship) ✅ CLOSED — T4.1 yaml v2
   - **A7prime v0.1** (semantic L2 stub interface) ✅ CLOSED — T3.2 stub; v0.2+ true embedding deferred

4. **phase 2.0 prereq zero-debt** — 8 interface contracts 全 ship，phase 2.0 v0.2.0 starting point 无 debt

5. **PLAN-CHECK W-2 吸收** — `ralphLoop.ts` ≤ 50L hard split via `lib/promiseExtract.ts`；karpathy simplicity 恢复 wedge 上限

6. **PLAN-CHECK W-1 吸收** — phase 1.5 T8.1 STATE.md sync-fix 7 → 8 interface contracts（errata inline note）

### 负面

1. **认知负担扩大** — schema / contract 字段表分散到 ADR 0001 + 0005 + 0007 + 0008 + 0009；ADR README index 需加 0009 行
2. **mitigation**: `docs/adr/README.md` index 加 0009 行；本 ADR 自带"errata"语义，phase 1.5 PLAN-CHECK Section 10 cross-phase consistency OK
3. **`_EXPERIMENTAL` drift risk** — `criticalSystemReminder_EXPERIMENTAL` 字段名官方可能不保证稳定（_EXPERIMENTAL suffix 明示）；phase 1.5 实装时不依赖该字段，仅 contract v1.1 additive 登记；phase 2.x 评估时追 release notes
4. **spike gate** — T2.1 + T2.2 spike report 必须输出 GO verdict 后才能 T5.1 / T5.2 实装；若 spike FAIL（如 regex edge case）需增加 T5.x 预算

### 中性

1. v0.1 contract v1 12 字段 frozen 不动；v1.1 仅 additive（+2 字段）；v0.2+ 拓展走 ADR 0010+ errata
2. `semanticRouter.ts` v0.1 stub return null — phase 1.5 shipping stub 不影响 L1 + L3 路由精度；v0.2+ embedding 启用时仅替换 stub body，contract 不变（D1.5-2 swap-in 设计）
3. `decision_rules.yaml` v2 schema `mattpocock_phases:` + 5 engineering rules — v1 → v2 migration 由 T4.2 `scripts/migrate` entry 自动化（D-22 v1 → v2 compat 守恒）
4. XML wrapper (`<promise>COMPLETE</promise>`) 不破 phase 1.4 已 ship 的 30-sample truth table（SAMPLES 列 expected_primary 不含 COMPLETE token 判断逻辑）

### v0.1.0-alpha.4 Known Limitations inline (sister T2 transparency)

**Phase 1.4 ship baseline** (v0.1.0-alpha.4): 30 sample specific rule match 21/30 = 70%。breakdown:

| category | sample count | correct | miss | miss reason |
|---|---|---|---|---|
| meta | 5 | 5 | 0 | — |
| engineering | 5 | 0 | 5 | phase 1.4 engineering ≤ 5 sample → fallback_supervisor expected; 0 engineering rules v1 |
| design | 5 | 5 | 0 | — |
| content | 5 | 5 | 0 | — |
| testing | 5 | 5 | 0 | — |
| search | 5 | 1 | 4 | F42 array element substring match miss (exact-match v1 遗漏) |

**Phase 1.5 target** (v0.1.1 ship): engineering 5/5 specific rules (`expected_primary` ≠ `fallback_supervisor`) + F42 array semantic match fix 4/4 specific → ≥ 27/30 (≥ 90%)。breakdown estimate:

| category | v0.1.0 miss | phase 1.5 fix | expected v0.1.1 |
|---|---|---|---|
| engineering | 5 miss → fallback | T4.1 5 rules yaml v2 | 5/5 specific ✅ |
| search | 4 miss F42 | T5.3 arbitrate ≤ 30L array match | 4/4 specific ✅ |
| other 4 categories | 0 miss | no change | 20/20 ✅ |
| **total** | **21/30 (70%)** | — | **≥ 27/30 (≥ 90%)** |

**D1.5-9 per-category 5/5**: phase 1.5 T6.5 acceptance bar — 全 6 category 每类 5/5 specific match confirmed post-yaml-v2。

## Compliance / Migration

### v0.1.1 强制约束（phase 1.5 ship 后生效）

- **factory 14 字段 contract v1.1 守恒** — `src/routing/agentDefinition.ts` ship 14 字段（v1 12 + errata v1.1 +2）；W-5 V1 BLOCKER 持续；`initialPrompt` 可选 + `criticalSystemReminder_EXPERIMENTAL` 可选，不破 existing call sites
- **arbitrate ≤ 30L hard limit** — `src/routing/decisionRules.ts` arbitrate function ≤ 30L；F42 upgrade 不突破上限；array semantic match 独立 `matchesTrigger()` helper inline（不抽 utils）
- **XML wrapper verbatim** — `systemPrompt.ts` COMPLETE instruction 字符串 verbatim 含 `<promise>COMPLETE</promise>`；`ralphLoop.ts` / `promiseExtract.ts` regex `/<promise>([^<]+)<\/promise>/` extract；两处 verbatim 不 drift（D-18 contract drift 禁止规则 applies）
- **A7 验收命令更新**:
  ```bash
  for n in 0001 0002 0003 0004 0005 0006 0007 0008 0009; do
    diff_out=$(git diff "adr-${n}-accepted" -- "docs/adr/${n}-*.md")
    [ -z "$diff_out" ] || { echo "A7 violated for ADR ${n}"; exit 1; }
  done
  echo "A7 ✅ ADR 0001-0009 main body unchanged"
  ```
- **CI A7 step**: `.github/workflows/ci.yml` A7 step iterate 1-8 → 1-9（task_plan T1.2 落地）

### v1 → v2 migration compat

`routing/decision_rules.yaml` v1 → v2 migration 由 `scripts/migrate-decision-rules-v1-to-v2.ts` entry 自动（T4.2）：
- `mattpocock_phases:` top-level key 新增（v1 无此 key → v2 完整 4 phase × 23 skill mapping table）
- engineering category rules v1（0 rules）→ v2（5 rules）inline patch
- v1 backup → `routing/decision_rules.v1.yaml.bak`（rollback path）

### 守恒强化

phase 1.5 T8.3 完成时打 `adr-0009-accepted` tag（本地）；push 后 CI A7 step 实测 9 ADR baseline tag 全绿。任一非空 diff 即 fail。

### Phase 1.5 ship 时刻 frozen

本 ADR 0009 起 phase 1.5 ship 时刻 frozen — 任何 v0.2+ 演化（`criticalSystemReminder_EXPERIMENTAL` stable evaluate / semantic L2 embedding true impl / 100+ sample DAG stability / v1.2 contract + 未来字段）必须开 ADR 0010+ errata；本 ADR 0009 main body 不可改（与 ADR 0001-0008 同等守恒规则）。

## References

### 内部依据

- `docs/adr/0001-manifest-schema-v1.md` § "Top-level structure"（SpecSchema unchanged — A7 守恒）
- `docs/adr/0003-install-method-count-errata.md`（errata 不动 main body 风格沿袭）
- `docs/adr/0005-marketplace-source-schema-errata.md`（schema 字段补完 errata 风格沿袭）
- `docs/adr/0007-categorization-schema-errata.md` § 1-2（manifest 加 3 字段；本 ADR 0009 § 1 续接 14 字段）+ § Compliance（A7 验收命令 — 本 ADR 0009 升级到 0001-0009 iterate）
- `docs/adr/0008-routing-engine-v1-errata.md` § Decision 3（D1.4-2 contract delta deferred → 本 ADR 0009 § 1 landing）+ § Consequences R6（跟踪条目 → 本 ADR 0009 § Consequences 正面 1 全部 close）
- `docs/AGENT-DEFINITION-FACTORY-CONTRACT.md`（217 行 12 字段 contract v1 frozen → v1.1 additive errata 本 ADR 0009 § 1 inline）
- `routing/decision_rules.yaml`（v1 12 rules + Priority hit policy + fallback_supervisor → v2 `mattpocock_phases:` + 5 engineering rules 本 ADR 0009 § 5）
- `.planning/phase-1.5/RESEARCH.md`（§ 3 mattpocock 23 招式 research + § 4 XML wrapper + § 5 P0 lock D1.5-1~8 — 本 ADR 0009 Decision sourcing）
- `.planning/phase-1.5/PATTERNS.md`（Pattern Q Kahn DAG / R semantic stub / S mattpocock_phases yaml v2 / T XML wrapper — 本 ADR 0009 Decision 1-4 pattern reference）
- `.planning/phase-1.5/ASSUMPTIONS.md`（D1.5-1~15 决策追溯 + § E R1-R6 paranoid 风险 — 本 ADR 0009 Decision + Consequences sourcing）
- `.planning/phase-1.5/PLAN.md` § 2 Wave 0-7 + 8 acceptance bar D1-D8（本 ADR 0009 Compliance 对齐）
- `.planning/phase-1.5/KICKOFF.md` § 关键约束（A7 守恒 + D1.5-2 no embedding deps + karpathy simplicity hard limit）
- `.planning/phase-1.5/task_plan.md` T1.1（本 ADR 0009 errata 起草 + adr-0009-accepted tag）+ T1.2（ci.yml A7 iter 1-8 → 1-9）
- `.planning/phase-1.5/PLAN-CHECK.md` Section 10 cross-phase consistency（0 BLOCKER → direct execute Option A approved）

### 外部参考

- `code.claude.com/docs/en/agent-sdk/typescript` (fetched 2026-05-13) — 14 字段 AgentDefinition complete schema verify + `initialPrompt` (Stable) + `criticalSystemReminder_EXPERIMENTAL` (Experimental)
- `code.claude.com/docs/en/agent-sdk/subagents` (fetched 2026-05-13) — `Agent` tool 嵌套禁止 + `Task`/`Agent` rename 双兼容
- `anthropics/claude-code/plugins/ralph-wiggum` (Tavily fetched 2026-05-13) — 官方 ralph-loop plugin `--completion-promise` exact match + `<promise>COMPLETE</promise>` XML wrapper protocol source
- CLRS 22.4 Topological Sort (Kahn's BFS indegree algorithm — D1.5-1 canonical source)
- DMN 1.4 Hit Policy Specification（OMG Priority Hit Policy 仲裁规则 — `decision_rules.yaml` v2 hit policy basis）
