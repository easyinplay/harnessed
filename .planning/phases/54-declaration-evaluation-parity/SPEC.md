---
phase: 54
name: Declaration/Evaluation Parity
status: ready-to-execute
created: 2026-08-26
gates_passed:
  - office-hours (design doc APPROVED)
  - plan-ceo-review (HOLD_SCOPE, 6 findings accepted, outside voice ran)
  - plan-eng-review (FULL_REVIEW, 3 findings, 0 critical gaps)
design_doc: ~/.gstack/projects/easyinplay-harnessed/easyi-main-design-20260826-213000.md
verified_refs:
  - "workflows/capabilities.yaml — 112 `fires_when` (existing; count verified)"
  - "src/workflow/schema/capabilities.ts:70 fires_when Type.Optional(Type.Array) (exists)"
  - "src/workflow/judgmentResolver.ts:98,106 — reads fires_when from judgment files ONLY (verified)"
  - "src/cli/prompt.ts:72-96 — renders cmd/impl/aliases only, NOT fires_when (verified)"
  - "src/workflow/schema/phaseFactContext.ts — 46 declared facts (counted)"
  - "src/cli/facts.ts — 32 derived facts (counted)"
  - "src/workflow/schema/workflow.ts:106 artifacts_expected phase-level static array (exists)"
  - "src/checkpoint/evidence.ts:36-43 collects artifacts_expected across all leaf phases (exists)"
  - "src/checkpoint/scale.ts:38-48 countChangedFiles uses merge-base HEAD origin/main (exists)"
  - "src/checkpoint/shipReady.ts:52 — tag-based commit counting precedent (exists)"
  - "src/checkpoint/injectState.ts buildWorkflowStateBlock (exists; ENGINE/REOPENED line pattern)"
  - "scripts/check-workflow-schema.mjs:302 ORPHAN_TRIGGER_EXEMPTIONS Map + declared/exempt output (exists)"
  - "src/eval/runner.ts:236-237 mkdtemp repo + state root per scenario, NO git tag (exists)"
  - "workflows/verify/auto/workflow.yaml:52-83 delegates_to[] entries carry `gate:` (verified)"
  - "workflows/verify/simplify/workflow.yaml — leaf template shape v3 (exists)"
  - "workflows/defaults.yaml:80-81 verify-simplify.01-code-simplifier: 5 (exists)"
  - "src/workflow/loadPhases.ts:79-83 — interpolate applies to ph.invokes ONLY (verified)"
  - "src/workflow/run.ts:274-289 resolveMaxIterations parseInt → NaN → RALPH_DEFAULT_MAX_ITER (verified)"
  - "workflows/verify/second-opinion/ (NEW)"
  - "tests/workflow/fact-derivation-parity.test.ts (NEW)"
  - "tests/workflow/template-ref-resolvable.test.ts (NEW)"
---

# Phase 54 — Declaration / Evaluation Parity

## 主张

本仓的签名缺陷是「声明了机制,却没有代码求值它」。三次已修实例(4.36.0 失效的 eval trap、
4.37.0 chrome-devtools 的散文承诺、4.38.0 verify 缺回退边)都是事故或审计倒推发现的。
规划期又量出**三个新面**,其中一个有真实行为后果:

| 面 | 规模 | 后果 |
|---|---|---|
| `capabilities.yaml` 的 `fires_when` | 112 条 | 误读(读的人当它生效) |
| `phaseFactContext` 声明未派生的事实 | 14 个 | 误读 + 未来引用会 fail-closed |
| **`phases[].max_iterations` 模板引用** | **21 处全部失效** | **行为:每个 phase 的迭代上限实跑 20,而非声明值** |

## T0 是最重的一条(P1,规划期实测发现)

链条(逐环已验):

```
  workflow.yaml                loadPhases.ts:79-83           run.ts:277-283
  max_iterations:              if (vars && phases)           parseInt('{{ …') → NaN
   '{{ defaults.…             ─▶  ph.invokes 才插值      ─▶  fromYaml undefined
     .01-simplify }}'              max_iterations 从不插值      ↓
                                                          RALPH_DEFAULT_MAX_ITER = 20
```

21 处引用**没有一处生效**。此外 5 处连 `defaults.yaml` 里的键都对不上:

```
  workflows/discuss/phase/workflow.yaml   -> discuss-phase.01-gsd-discuss
  workflows/plan/phase/workflow.yaml      -> plan-phase.01-gsd-plan
  workflows/task/clarify/workflow.yaml    -> task-clarify.01-brainstorm
  workflows/verify/paranoid/workflow.yaml -> verify-paranoid.01-review
  workflows/verify/simplify/workflow.yaml -> verify-simplify.01-simplify
                                             (defaults 键是 01-code-simplifier)
```

**边界(不要混淆两个天花板)**:`src/checkpoint/budget.ts:82` 的 `resolveAttemptBudget`
按 **sub** 直读 `defaults.yaml`,工作正常 —— checkpoint 的 attempt budget 没坏。
坏的是 run 引擎的 **per-phase 迭代上限**。

**副作用预警**:修好之后上限会从 20 收紧到声明值(多为 3-5)。那些声明值**从未生效过**,
所以它们本身也没被验证过。T0 完成后需要看一轮实际值是否仍合理。

## 任务与波次

### Wave 0 — T0(独立,先行)

- [ ] **T0 (P1)** — engine — 让 `max_iterations` 的模板引用真的被解析
  - 1. `src/workflow/loadPhases.ts` — 插值覆盖 `max_iterations`(现仅 `ph.invokes`)
  - 2. `workflows/defaults.yaml` + 5 个 workflow.yaml — 对齐键名
  - 3. `tests/workflow/template-ref-resolvable.test.ts` — 每个 `{{ defaults.X.Y }}`
       必须在 `defaults.yaml` 里有键(与 T5 同形态:零正则、直接读两个 yaml)
  - Verify: 现有 workflow 测试全绿;人为写一个不存在的引用 → 测试红;
    实跑一次 `/verify` 确认上限收紧后未撞顶

### Wave 1 — T1(必须先于 T2)

- [ ] **T1 (P1)** — capabilities — `fires_when` → `routing_note`,schema 删旧字段
  - **sed 只作用于 `workflows/capabilities.yaml` 单文件** —— `workflows/judgments/*.yaml`
    里的 `fires_when` 是真求值字段,误伤即全线 gate 失效(ENG-3)
  - `src/workflow/schema/capabilities.ts` 删 `fires_when`、声明 `routing_note`;
    `additionalProperties: false` 使旧名成为构建期错误 —— 门缩成 schema 本身
  - Verify: `pnpm build:schema` 无漂移;人为写回 `fires_when` → 构建期报错(负例测试)

### Wave 2 — T2/T3/T4/T5(共享 judgment + 事实链,同一波)

- [ ] **T2 (P1)** — workflows — 新增 leaf `workflows/verify/second-opinion/`(order 90)
  - `workflow.yaml` 静态声明 `artifacts_expected: [second-opinion.md]`
  - master `workflows/verify/auto/workflow.yaml` 加 `delegates_to` 条目 + `gate:`
  - **顺带修 stale 注释**:该文件头部写「7 delegates_to」,实际 10 条(加本条后 11)
  - 双语 SKILL + `defaults.yaml` 的 `ralph_max_iterations` 条目(T0 之后键名才有意义)
  - Verify: `check-workflow-schema.mjs`(K10 无孤儿)+ 两道 i18n parity 门

- [ ] **T3 (P1)** — facts — `requires_second_opinion` 声明 + 派生
  - 基准:`git describe --tags --abbrev=0` .. HEAD ∪ 工作树(**不用** merge-base)
  - 命中集 = **引擎运行时真读的文件面**:`workflows/judgments/` · `capabilities.yaml` ·
    `role-prompts` · `disciplines` · `phaseFactContext.ts` · `facts.ts` ·
    `judgmentResolver.ts` · `exprBuilder.ts` · `ledger.ts` · `workflows/**/SKILL*.md`
  - 算不出来(无 tag / 无 git / shallow)→ `false`,并交由 T4 显式报出
  - Verify: 四条 shadow 路径单测;`harnessed facts --json` 含该键

- [ ] **T4 (P1)** — inject — `SECOND-OPINION: 判据不可用(<原因>)` 断点行
  - Verify: `tests/checkpoint/injectState.test.ts` 覆盖有/无两态;bin 重新生成

- [ ] **T5 (P1)** — tests — 事实派生一致性
  - declared ⇄ derived,差集 == 显式 `UNDERIVED_FACTS` 常量
  - **derived ⇄ consumed**(OV#4 补的第二条边:派生了却没人读同样是死的)
  - Verify: 人为加一个只声明不派生的事实 → 红

### Wave 3 — T6/T7

- [ ] **T6 (P1)** — eval — 带 tag 的 fixture git 仓
  - `src/eval/runner.ts` 的 tmp 仓没有 tag,tag 基准下 fire 分支在 CI 恒不可达
  - Verify: golden 覆盖 fire 与 skip 两态
- [ ] **T7 (P2)** — util — 抽 `gitChangedFiles(cwd, base)` 供 `scale.ts` 与 T3 复用
  - **不改 `scale.ts` 的基准语义**(CEO 发现 3 已裁定)

## 不在范围

- 自动执行 `codex exec`(会把仓内容自动外发第三方 API;本机 codex 指向 DeepSeek)
- 改 `scale.ts` 的 `countChangedFiles` 基准(会改 `assessScale` 的 light/full 判定)
- 112 条 `routing_note` 的逐条 triage(改名后自明为惰性,随手偿还)

## 未解

- **OQ4** — gemini 0.57 是否进第二意见目标集。判据:实际用不用,不是存不存在。
