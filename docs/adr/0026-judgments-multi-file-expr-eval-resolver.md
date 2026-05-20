# ADR-0026: judgments/ Multi-File Classification + expr-eval + judgmentResolver (D-03 + D-04 + D-16 + Q-AUDIT-5c)

## Status

**Accepted (phase v2.0-2.6 W0 — 2026-05-20)** — phase v2.0-2.1 discuss-phase D-03 / D-04 LOCK → D-16 + Q-AUDIT-5c amend → phase v2.0-2.3 W0.2 + W0.3 + W0.4 + W0.6 SHIPPED → phase v2.0-2.6 W0.3 ADR backfill。

> Phase v2.0 architectural major refactor 三层栈方法论机器化的核心 ADR — 沿袭 ADR 0011 9-section + errata 合并模式（B-20 lock）。**3 errata sub-bullet absorbed**：(1) expr-eval 2.0.2 实测 unpacked size 145.6 KB ≠ CONTEXT.md 文案 "~5KB"；(2) expr-eval 2.0.2 keyword case-sensitivity (`and`/`or` lowercase only)；(3) judgmentResolver.ts 实装 ~98L vs Q-AUDIT-5c spec ~60L (+38L 来自 JSDoc + TriggerNotFoundError class + dual-schema cast 链 overhead, ≤200L Karpathy 守住)。

## Context

Phase v2.0 milestone 的核心是把 maintainer `~/.claude/CLAUDE.md` 三层栈方法论 prose 形态 → ship 给其他 user via bundled defaults 的可执行 yaml 形态。CLAUDE.md「澄清/审查触发判据」节明确分三层 (战略 / Phase / 子任务) 各自的 ✅ 触发 / ❌ 跳过条件 + Fallback 三条铁律 (拿不准跳过 / 用户明示覆盖 / 链式互不前置)。这套 prose 判据需要：

1. **yaml gate eval grammar** —— workflow.yaml `gate:` 字段写 `phase.type in [...] AND open_decisions >= 2` 类表达式, runtime 注入 phase fact context 求值得 boolean (D-03)
2. **multi-file classification** —— sister `~/.claude/rules/*.md` 多 file pattern (web-design / web-testing / web-search / agent-teams / cc-handoff / context7 / google-workspace) verbatim 借鉴, 按 gate 类型分文件 (D-04 single → D-16 multi-file 分类 reframe per user Q-AUDIT-3 annotation "judgment 单个 → 类似 rule 分类")
3. **4-level reference resolver** —— expr-eval Parser AST 视 `judgments.<file>.<trigger>.<field>` 为 4-level dot-access identifier chain, 不理解 file boundary semantics, workflow engine 必须在 evalGate 调用前预 resolve 4 层 ref → load yaml → TypeBox validate → extract `triggers.<gate>.fires_when` 表达式串 → pass to expr-eval (Q-AUDIT-5c judgmentResolver.ts ~60L NEW spec)

Phase v2.0-2.1 discuss-phase LOCK D-03 (Q3 RESET) + D-04 (Q4 RESET initial single file) + D-16 (Q-AUDIT-3 amend multi-file reframe) + Q-AUDIT-5c (Q-AUDIT-5 5c 2026-05-20 amend judgmentResolver.ts ~60L NEW MANDATORY)。Phase v2.0-2.3 W0 Wave 0 schema 拓扑必含 4 task (W0.2 6 file yaml + W0.3 exprBuilder.ts + W0.4 judgmentResolver.ts + W0.6 dual-schema TypeBox)。

本 ADR 覆盖 Phase v2.0 此 4 决策线, 合并入单 ADR (B-20)— 沿袭 ADR 0011 多决策合并 errata 模式。ADR 编号 `0026` 由 Phase v2.0-2.6 W0.3 ADR backfill 时实占 (phase v2.0-2.2 PLAN T2.6.W0.3 spec L572-581)。

### A7 守恒约束 (ADR 0001-0025 main body 不可改)

phase v2.0 沿袭 ADR 0011 / 0024 / 0025 errata 风格 —— **不动 ADR 0001-0025 main body**（A7 守恒）。`docs/AGENT-DEFINITION-FACTORY-CONTRACT.md` v1.1 14-字段 contract main body **不动**。`docs/INSTALLER-CONTRACT.md` main body **不动**。本 ADR 0026 起 Phase v2.0 ship 时刻 frozen；v2.0.1+ 演化走 ADR 0027+ errata。

## Decisions

### 1. D-03 expr-eval npm dep + Parser singleton + operator lockdown

`expr-eval@2.0.2` (MIT, zero-dep) INTRODUCE NOW — workflow.yaml gate 字段 expression 解析 + 求值一站式。**rejected alternatives** (D-03 LOCK rationale):

- ~~自写 mini-parser~~ —— YAGNI + 安全审计成本 + 重新发明 parser 边际收益低
- ~~jsep parser-only~~ —— jsep 只产 AST 不求值, 需自己实现 AST walker ~100L, 不必要

**Phase v2.0-2.3 W0.3 实测 (`src/workflow/exprBuilder.ts` 57L)**：

```typescript
import { Parser, type Values } from 'expr-eval'

const PARSER_OPTIONS = {
  operators: {
    add: false, subtract: false, multiply: false, divide: false,  // STRIDE T-2.2-02 mitigation
    logical: true, comparison: true, in: true,                    // gate eval 仅需 3 类
    assignment: false,                                             // yaml-injection 防护
  },
} as const

const _parserSingleton = new Parser(PARSER_OPTIONS)  // module-level, hot-path 复用

export function evalGate(expression: string, context: Record<string, unknown>): boolean {
  const parsed = _parserSingleton.parse(expression)
  const result = parsed.evaluate(context as unknown as Values)
  if (typeof result !== 'boolean') throw new GateEvalError(...)
  return result
}
```

**3 关键 hardening 决策**：

1. **Parser singleton (PLAN-ENG-REVIEW § 4 LOW perf)** —— 避 hot-path Parser rebuild, module-level 单例 + test-only `_parserSingleton` export 作 identity assertion (acceptance criterion e)
2. **Operator lockdown (Phase 2.2 STRIDE T-2.2-02 yaml-injection mitigation)** —— disable `add/subtract/multiply/divide/assignment`, 仅保 `logical/comparison/in` 3 类 (gate eval 充分)
3. **GateEvalError class 包裹 expr-eval 内部异常** —— consumer 仅 catch 1 个 error type, 不暴露 expr-eval Parser internals

**Wave 0 实测验收 (b)**: workflow gate 表达式 phase fact context 注入 + 求值正确, 含 `phase.type in ['new_project', 'new_milestone', 'new_feature']` 类 嵌套 dot-access + array `in` operator。

### 2. D-04 + D-16 judgments/ 6 file multi-file 分类 (rule-style)

`<packageRoot>/workflows/judgments/` 目录 **6 file 分类** — sister `~/.claude/rules/*.md` 多 file pattern verbatim 借鉴。**D-04 initial single judgment.yaml → D-16 multi-file reframe** per user Q-AUDIT-3 annotation "judgment 单个 → 类似 rule 分类":

| File | Top-level key | Coverage | Source CLAUDE.md section |
|------|--------------|----------|--------------------------|
| `strategic-gate.yaml` | `triggers` | gstack `/office-hours` + `/plan-ceo-review` | 「战略层」节 |
| `phase-gate.yaml` | `triggers` | GSD `/gsd-discuss-phase` (或 `/gsd-new-project` / `/gsd-next`) | 「Phase 层」节 |
| `subtask-gate.yaml` | `triggers` | `superpowers:brainstorming` | 「子任务层」节 |
| `parallelism-gate.yaml` | `triggers` | subagent-default / agent-teams-upgrade / main-session-fallback / ralph-loop-wrapper | 「子任务并行执行机制」节 (per D-11) |
| `tdd-gate.yaml` | `triggers` | red-green-refactor TDD 强制条件 (核心业务逻辑 / 算法 / 高可靠性) | 「Execute 阶段」TDD 句型 (per D-13) |
| `fallback.yaml` | `rules` | 3 铁律: 拿不准跳过 / 用户明示覆盖 / 链式互不前置 | 「Fallback 三条铁律」节 (per R20.16) |

**workflow.yaml gate reference path**: `gate: judgments.strategic-gate.fires` (NOT `judgments.fires` — 4-level: `judgments.<file>.<trigger>.<field>`)

**Wave 0 实测验收 (Phase v2.0-2.3 W0.2 SHIPPED 6 file 158L)**: schema_version `harnessed.judgment.v1` (sister `src/types/schemaVersion.ts` 14th surface)。strategic-gate 2 trigger (office-hours / plan-ceo-review) + phase-gate / subtask-gate / parallelism-gate / tdd-gate 各自 multi-trigger, fallback 3 rule。

### 3. Q-AUDIT-5c judgmentResolver.ts 4-level ref pre-resolve

expr-eval Parser AST 视 `judgments.strategic-gate.office-hours.fires` 为 4-level dot-access identifier chain, **Parser 不理解 file boundary semantics** —— workflow engine 必须在 evalGate 调用前 **预 resolve** 4 层 ref。

**Q-AUDIT-5c spec** (CONTEXT D-16 L153): "expr-eval 不理解 file boundary, workflow engine 在 expr-eval 求值前预 resolve 4 层 ref。Input: `judgments.<file>.<gate>.fires` → split 4 层 → read `judgments/<file>.yaml` → resolve `triggers.<gate>.fires_when` → 输出 resolved expression string → pass to expr-eval Parser + TypeBox schema validate。Phase 2.3 Wave 0 schema 拓扑必含此任务。"

**Phase v2.0-2.3 W0.4 实测 (`src/workflow/judgmentResolver.ts` 98L NEW)**：

```typescript
const _fileCache = new Map<string, JudgmentTriggersFileT | JudgmentRulesFileT>()

export async function resolveJudgmentGate(
  gateRef: string,
  context: Record<string, unknown>,
  packageRoot: string,
): Promise<boolean> {
  const parts = gateRef.split('.')
  if (parts.length !== 4 || parts[0] !== 'judgments') throw new Error(...)
  const [, fileName, triggerName, fieldName] = parts

  let parsed = _fileCache.get(fileName)
  if (!parsed) {
    const raw = await readFile(resolve(packageRoot, 'workflows', 'judgments', `${fileName}.yaml`), 'utf8')
    const parsedRaw = parseYaml(raw) as unknown
    const schema = fileName === 'fallback' ? JudgmentRulesFile : JudgmentTriggersFile
    if (!Value.Check(schema, parsedRaw)) throw new Error(...)
    parsed = parsedRaw as ...
    _fileCache.set(fileName, parsed)
  }

  const entries = 'triggers' in parsed ? parsed.triggers : parsed.rules as ...
  const trigger = entries[triggerName] ?? (throw new TriggerNotFoundError(...))
  const expr = fieldName === 'fires' ? trigger.fires_when : fieldName === 'skips' ? trigger.skips_when : undefined
  if (!expr) throw new Error(...)

  return evalGate(expr, context)
}
```

**5 关键实装决策**：

1. **Dual-schema routing** (W0.6) —— `fileName === 'fallback' ? JudgmentRulesFile : JudgmentTriggersFile` 二分支 TypeBox validate, 因为 fallback rules root 没 `fires_when/skips_when` 字段 (设计意图: fallback 由 runtime 词法匹配 + UX message_template 处理, NOT expr eval)
2. **Module-level `_fileCache` Map** —— hot-path avoid readFile + parseYaml + TypeBox.Check, perf per PLAN L195
3. **`TriggerNotFoundError` 专用 class** —— consumer 区分 "yaml 不存在" vs "trigger 名错" vs "field 错"
4. **`_clearJudgmentCache()` test-only export** —— cache-hit / cache-miss fixture 隔离
5. **`<promise>` field 仅 `fires` / `skips` 两种** —— fields beyond these → error path (gate ref 指向 fallback file 时必走 error, 设计意图)

### 4. fallback 3 铁律 (D-16 + R20.16 + CLAUDE.md verbatim)

`fallback.yaml` 不参与 expr-eval, top-level key 是 `rules` (NOT `triggers`)。**3 rule 机器化 CLAUDE.md「Fallback 三条铁律」verbatim**：

| Rule key | Action / data | CLAUDE.md verbatim quote |
|----------|---------------|--------------------------|
| `uncertain-skip-transparently` | `fallback_action: skip_with_transparency` + `message_template: "⚠️ 跳过 {gate_name}, 因为 {reason}。如认为需要请明示。"` | "拿不准 → 倾向跳过, 但在响应里**透明声明**" |
| `user-explicit-override` | `override_signal: ["先 brainstorm", "跑 office-hours", "讨论一下", ...]` | "用户明示 → 覆盖判据: 用户说『先 brainstorm』/『跑 office-hours』/『讨论一下』时无条件激活" |
| `chain-isolation` | `chain_isolation: true` | "链式互不前置: 跳过战略层 ≠ 必须跳过 phase 层; 每层独立判断 (防『上层没跑下层不敢跑』的死板)" |

**Runtime semantics** (workflow engine consumer Phase v2.0-2.5 dogfood test 验证 round-trip):

- `skip_with_transparency` —— gate eval throw `GateEvalError` 或 evidence 不足时, emit ⚠️ message 给用户, **不静默跳过**
- `override_signal` —— 词法匹配 user input 命中任一 signal 强制 invoke, **即使 `fires_when==false` / `skips_when==true`**
- `chain_isolation: true` —— 战略 / phase / 子任务三层 gate eval **互相独立无父子继承**

### 5. Schema interaction with ADR 0011 § 7 SchemaVersion (B-32)

`harnessed.judgment.v1` 是 SchemaVersion 14th surface (sister `src/types/schemaVersion.ts` ADR 0011 § 7 7-surface baseline + Phase v2.0 新增 6 surface)。**3 rules 适用**：

1. Consumer 必须 branch-on-version (`judgmentResolver.ts` Value.Check `schema_version: Type.Literal(SCHEMA_VERSIONS.judgment)` 完成)
2. 未知 enum 值 graceful degrade (adapter-specific 字符串值不 fail; fallback `rules.uncertain-skip-transparently` 兜底)
3. 新增字段必须 nested (judgment v2 bump 需 ADR 0027+; 当前 v1 不动)

## A7 Conservation

ADR 0001-0025 main body **untouched**；baseline tag iteration `adr-0001-accepted` ... `adr-0025-accepted` → 加 `adr-0026-accepted`（phase v2.0-2.6 ship 时 T2.6.W6 落地打 tag）。本 ADR 0026 起 Phase v2.0 ship 时刻 frozen — 任何 v2.0.1+ 演化 (新 file 加入 judgments/ / schema v2 bump / resolver caching policy 调整 / expr-eval 升级) 必须开 ADR 0027+ errata。

### A7 守恒验收命令 (phase v2.0-2.6 ship 后 0001-0026 iterate)

```bash
for n in $(seq -f "%04g" 1 26); do
  diff_out=$(git diff "adr-${n}-accepted" -- "docs/adr/${n}-*.md")
  [ -z "$diff_out" ] || { echo "A7 violated for ADR ${n}"; exit 1; }
done
echo "A7 ✅ ADR 0001-0026 main body unchanged"
```

### CI A7 step

`.github/workflows/ci.yml` A7 step `for n in 0001 ... 0025` loop 加 `0026`；step name `ADR 0001-0025` → `ADR 0001-0026`（Phase v2.0-2.6 W6 落地）。

## References

### 内部依据

- `docs/adr/0011-execute-task-sdk-ralph.md` § 7 SchemaVersion 单一兼容门 (本 ADR Decision 5 `harnessed.judgment.v1` 14th surface 起点) + 9-section pattern (本 ADR 沿袭)
- `docs/adr/0024-pure-bundled-distribution-v2.md` (Phase v2.0-2.6 W0.1 NEW; 本 ADR judgments/ 全部在 `<packageRoot>/workflows/judgments/` 读 only Pure bundled 适配)
- `docs/adr/0025-capabilities-yaml-baseline-static-manifest.md` (Phase v2.0-2.6 W0.2 NEW; sister upstream upgrade + ADR per patch release pattern)
- `src/workflow/exprBuilder.ts` 57L (Phase v2.0-2.3 W0.3 NEW) —— Parser singleton + operator lockdown + GateEvalError class
- `src/workflow/judgmentResolver.ts` 98L (Phase v2.0-2.3 W0.4 NEW) —— 4-level ref split + readFile + parseYaml + TypeBox dual-schema validate + Map cache + evalGate
- `src/workflow/schema/judgment.ts` 86L (Phase v2.0-2.3 W0.6 NEW) —— TypeBox JudgmentTrigger + FallbackRule + JudgmentTriggersFile + JudgmentRulesFile + JudgmentFile discriminated union
- `src/types/schemaVersion.ts` (Phase 2.2 T2.0 NEW + Phase v2.0-2.3 W0.6 14th surface 扩) —— `harnessed.judgment.v1` SchemaVersion 单一兼容门
- `workflows/judgments/*.yaml` 6 file 158L (Phase v2.0-2.3 W0.2 NEW)：strategic-gate / phase-gate / subtask-gate / parallelism-gate / tdd-gate (triggers root) + fallback (rules root)
- `package.json` v2.0 + `expr-eval@2.0.2` dep (Phase v2.0-2.3 W0 install)
- `PROJECT-SPEC.md` § 8.1 (manifest schema 变更 + workflow gate 机制变更必须 ADR)
- `.planning/REQUIREMENTS.md` § R20.3 (expr-eval gate yaml-eval grammar) + § R20.4 (judgments/ multi-file 分类) + § R20.16 (fallback 3 铁律)
- `.planning/phase-v2.0-2.1/2.1-CONTEXT.md` § D-03 (expr-eval npm dep) + D-04 (judgment.yaml initial) + D-16 (multi-file reframe + Q-AUDIT-5c judgmentResolver MANDATORY) + Q-AUDIT-3 annotation history
- `.planning/phase-v2.0-2.2/RESEARCH.md` § 1 (expr-eval deep-dive HIGH conf + unpackedSize 145.6 KB 实测 + Parser API verified + operator lockdown verified) + § 6 (judgments multi-file schema design HIGH conf)
- `.planning/phase-v2.0-2.2/PLAN.md` T2.3.W0.2 + W0.3 + W0.4 + W0.6 atomic tasks + T2.6.W0.3 ADR backfill spec L572-581

### 外部参考

- `expr-eval@2.0.2` ([github.com/silentmatt/expr-eval](https://github.com/silentmatt/expr-eval), MIT, zero-dep, npm `unpackedSize: 145.6 KB`, weekly downloads ~4M, last publish "over a year ago") —— Parser singleton + operator lockdown pattern verified RESEARCH.md § 1.2-1.4
- `@sinclair/typebox` Value.Check + Value.Errors —— dual-schema validate (sister ADR 0010 § Decision 5 manifest schema TypeBox pattern)
- `~/.claude/CLAUDE.md` 「澄清/审查触发判据」节 verbatim (战略层 / Phase 层 / 子任务层 + Fallback 三条铁律 — judgments/ 6 file 机器化对象)
- `~/.claude/rules/*.md` 7 file (web-design / web-testing / web-search / agent-teams / cc-handoff / context7 / google-workspace) —— sister multi-file rule pattern verbatim 借鉴

## Implementation Status

**SHIPPED 2026-05-20** Phase v2.0-2.3 W0:

- W0.2 (judgments/ 6 file yaml NEW 158L) — `workflows/judgments/{strategic-gate,phase-gate,subtask-gate,parallelism-gate,tdd-gate,fallback}.yaml`
- W0.3 (exprBuilder.ts NEW 57L) — Parser singleton + operator lockdown + GateEvalError + evalGate API
- W0.4 (judgmentResolver.ts NEW 98L) — 4-level ref resolve + TypeBox dual-schema validate + Map cache + TriggerNotFoundError + `_clearJudgmentCache()` test export
- W0.6 (schema/judgment.ts NEW 86L) — JudgmentTrigger + FallbackRule + JudgmentTriggersFile + JudgmentRulesFile + JudgmentFile discriminated union + `harnessed.judgment.v1` SchemaVersion 14th surface

**ADR backfill** Phase v2.0-2.6 W0.3 (本 ADR 0026, 2026-05-20)。

**Pending** Phase v2.0-2.5 dogfood test:

- 3 fallback 触发场景 round-trip 验证 (per R20.16 acceptance (f))
- workflow runtime expr-eval 实装 `fallback_action: skip_with_transparency` 输出透明声明 (R20.16 (b))
- workflow runtime 词法匹配 `override_signal` (R20.16 (c))
- workflow runtime `chain_isolation` 独立 layer eval (R20.16 (d))

## Errata (本 ADR 0026 backfill add)

### Errata 1 — expr-eval 2.0.2 actual unpacked size 145.6 KB (NOT ~5KB)

**Origin**: Phase v2.0-2.1 2.1-CONTEXT.md L34 D-03 文案声称 "`expr-eval` npm package (~5KB MIT, 4M weekly downloads)"。

**Phase v2.0-2.2 RESEARCH.md § 1.1 实测 verify (2026-05-20)**: npm `unpackedSize: 145577 bytes` = **145.6 KB**, 与 CONTEXT 文案 **不一致 29×**。

**实际尺寸 breakdown** (RESEARCH § 1.1):
- npm unpackedSize 145.6 KB (8 file, 含 source + UMD bundle + docs)
- UMD bundle minified ~30-40 KB (`dist/bundle.js` 单文件)
- gzip 进 Node CLI distribution ~10-15 KB delta
- tree-shake ESM ~30 KB (库不 tree-shake-friendly, single import = 完整 Parser)

**对 harnessed CLI 的影响**: harnessed 是 Node CLI 不是 browser bundle, 145.6 KB unpackedSize → 进 node_modules + require() lazy load → 启动 token 影响 < 1ms。**Decision 不变** —— D-03 LOCKED expr-eval keep, 仅 sizing claim 校正。

**Authoritative correction**: ~5KB → **~145 KB unpacked / ~30-40 KB minified / ~10-15 KB gzip delta**。

### Errata 2 — expr-eval 2.0.2 keyword case-sensitivity (lowercase only)

**Origin**: Phase v2.0-2.3 W2 dogfood test 实测发现 expr-eval 2.0.2 **仅 accept lowercase `and`/`or`**, uppercase `AND`/`OR` 解析 fail。

**RESEARCH.md / D-03 文案多处使用 uppercase** (e.g. CONTEXT L42 `phase.type in [...] AND open_decisions >= 2`) —— **错误**, 等价性不成立。

**Phase v2.0-2.5 W2 dogfood caught 3 处 production fail**:
- `workflows/verify-work/workflow.yaml` gate uppercase `AND`
- `workflows/execute-task/phases.yaml` conditional uppercase `OR`
- `workflows/plan-feature/workflow.yaml` gate uppercase `AND`

**Inline fix**: 全 yaml expression 统一 lowercase, 文档校正 (本 ADR + REQUIREMENTS R20.3 验收 (b) 实测语法)。

**Authoritative grammar**: expr-eval 2.0.2 boolean operator **必须** lowercase `and` / `or` / `not`。Comparison operator `==` / `!=` / `>=` / `<=` / `>` / `<` / `in` 大小写不敏感 (symbol-based)。

### Errata 3 — judgmentResolver.ts 实际 98L vs Q-AUDIT-5c spec ~60L

**Origin**: Q-AUDIT-5c CONTEXT L153 spec `src/workflow/judgmentResolver.ts ~60L NEW`。

**Phase v2.0-2.3 W0.4 实测**: 98L (含 import 11L + JSDoc 17L + TriggerNotFoundError class 9L + resolveJudgmentGate body 50L + `_clearJudgmentCache()` 4L + `_fileCache` decl 1L + trailing newlines/exports 6L)。

**+38L overhead breakdown**:
- JSDoc 顶部 17L 说明 4 层 ref 语义 + dual-schema routing + fallback error path + cache 设计意图 (RESEARCH § 6 文档化 explicit)
- `TriggerNotFoundError` 专用 class 9L (consumer 区分 yaml-not-found / trigger-name-wrong / field-wrong 3 类 error path)
- Dual-schema cast 链 5L (`'triggers' in parsed ? parsed.triggers : (parsed.rules as unknown as Record<...>)` discriminated union narrow)
- `_clearJudgmentCache()` test-only export 4L (W0.4 fixture 隔离 cache-hit / cache-miss)
- 4-level split + length check 3L (defensive: `parts.length !== 4 || parts[0] !== 'judgments'` early throw)

**Karpathy simplicity check**: 98L ≤ 200L H3 budget (sister ADR 0010 § Decision 5 budget hint), 38L overhead 全部 load-bearing (无 dead code / 无 over-engineering), acceptable。**Decision 不变** —— Q-AUDIT-5c judgmentResolver.ts SHIPPED, spec 数值 ~60L → 实测 ~98L 校正。

**Authoritative size**: ~60L → **98L (load-bearing overhead = JSDoc + custom error + dual-schema narrow + test export + defensive 4-level check)**。
