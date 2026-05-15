# ADR-0011: execute-task workflow + ralph-loop SDK introduction + dual-signal completion + per-phase model tier + Wave 0 transparency gate flip + schemaVersion + provenance gate + Task Session 复用 (phase 2.2 — 9 章节 errata 合并)

## Status

**Draft** — 2026-05-15 (phase 2.2 plan-phase Wave 0 sketch；Wave 6 fill-out + flip to **Accepted** at phase 2.2 ship)

> Phase 2.2 execute-task workflow + ralph-loop full integration 的合并 ADR — 沿袭 ADR 0008 / 0009 / 0010 多决策合并 errata 模式（B-20 lock）。本 draft 仅 sketch 9 章节标题与一句 intent；Wave 6 T6.1 由 ship 时 plan-phase planner fill-out 实测细节、引用证据、A7 守恒命令。**2026-05-15 discuss-phase delta absorbed**：原 6 章节扩 9 章节(加 § 7 SchemaVersion / § 8 Provenance gate / § 9 Task Session 复用)。

## Context

Phase 2.2 是 v0.2.0 sub-task loop 里程碑的核心 phase — 把 v0.1.0 routing engine v1 + Phase 2.1 ship 后的 6 install method runtime-ready 升级为「真实 SDK spawn subagent + ralph-loop 完整闭合」。实装 execute-task workflow 主线 4 phase chain（brainstorming → karpathy 心法 always-on → mattpocock 招式按需召唤 → conditional TDD → ralph-loop 交付 COMPLETE），每子任务 verbatim COMPLETE 回流主流程。

并办 Phase 2.1 deferred — transparency CI gate `ENFORCE` flip 为 `true` + 全史 verdict 文档迁移到结构化 marker + reviewer 洞察的 CI gate freshness check 扩展（README/PROJECT-SPEC 状态节）— **一次性根治** transparency 反模式（phase 1.4 T1 + phase 1.5 H1/M1 连续 2 phase 复发后的结构性根治）。

**discuss-phase delta (2026-05-15)** absorbed 3 个 ⭐⭐+ items 来自 intel 3-project (OMC + omo + ECC) 扩展：CD-5 FULL schemaVersion 单一兼容门 (ECC ⭐⭐⭐)、CD-6 BEFORE-W4 provenance gate hard fail (ECC ⭐⭐)、CD-4 PIGGY-W1 Task Session 复用 conditional (omo ⭐⭐)。EE-4 plan 4 维量化阈值 schema (omo ⭐⭐) deferred → Phase 2.4 doctor 完整版 absorb OR 独立 phase 2.5。

本 ADR 覆盖 Phase 2.2 9 大决策线，合并入单 ADR（B-20）— 沿袭 phase 1.4 ADR 0008 多决策合并 errata 模式。ADR 编号 `0011` 由 phase 2.2 plan-phase Wave 0 实占（intel § 0 SSOT 引用纪律 + Phase 2.1 T1.9 CONTRIBUTING.md 项目级规则）— Phase 2.1 D-08 暂记 `0011` 仅参考，本 plan-phase 实占值与之一致。

### A7 守恒约束（ADR 0001-0010 main body 不可改）

phase 2.2 沿袭 ADR 0003 / 0005 / 0007 / 0008 / 0009 / 0010 errata 风格 — **不动 ADR 0001-0010 main body**（A7 守恒）。`docs/AGENT-DEFINITION-FACTORY-CONTRACT.md` v1.1 14-字段 contract main body **不动** — contract v1.2 reconcile 仅通过本 ADR § Decision 4 inline 记录。本 ADR 0011 起 phase 2.2 ship 时刻 frozen；v0.2.3+ 演化走 ADR 0012+ errata。

## Decisions

### 1. SDK 引入 (B-04)

`@anthropic-ai/claude-agent-sdk` INTRODUCE NOW — phase-1.5 deferral 触发条件已满足（real spawn + dual-signal completion 都被它 hard-block）；Wave 1 first action = `npm view @anthropic-ai/claude-agent-sdk version` 复核版本（research valid until ~2026-06-15）+ 对照 installed `.d.ts` 重验 14→4 字段映射 + Wave 1 spike `outputFormat`+`agents`-map 组合可行性（throwaway `scripts/spike-outputFormat-agents.mjs`，**not committed** per B-06）+ Wave 1 spike SC4 verify SDK session resume API 是否暴露（delta D-18 / B-35）+ `package.json` + `package-lock.json` + 3-OS CI verify。

> [Wave 6 T6.1 fill] — 实际 SDK version + 14→4 字段对照表 + spike SC1/SC2/SC3/SC4 result + Tier A/B/C 选定路径 + Task Session SC4 pass/fail outcome + lockfile diff lines。

### 2. ralph-wiggum keep (B-05)

`ralph-wiggum` 官方 plugin **不切换** — 官方 plugin interactive-TUI-Stop-hook-only + jq 依赖撞 Win 红旗（R6 closed）；`ralphLoopWrap` 自实装是**永久架构**。Phase 2.2 升级是接 SDK callback 不是替换 wrapper — `ralph-loop.ts` ≤50L 主体守住（B-26），加 `resumeSessionId` 闭包 + JSON envelope `isComplete` ≈ +6L → ~48L。

> [Wave 6 T6.1 fill] — 实际 ralphLoop.ts 升级前/后 wc -l + isComplete 4-layer 签名 + Win compat verify result（B-31）。

### 3. dual-signal completion 4-layer (B-02)

Completion = **4-layer dual-signal**（RESEARCH § 1.3 refine CONTEXT D-02）:

| Layer | Signal | Source |
|-------|--------|--------|
| Outer PRIMARY | `outputFormat: json_schema` → `SDKResultMessage.structured_output.status === 'COMPLETE'` | SDK `query()` options |
| Outer FALLBACK | `<promise>COMPLETE</promise>` extract on `result.result` text | `promiseExtract.ts` (shipped 32L) |
| Inner PRIMARY | subagent `<promise>` grep on last message text | `promiseExtract.ts` |
| Inner FALLBACK | `Task` tool_use `subtype === 'success'` | SDK |

Outer schema constrains 主 agent 最终轮；inner layer 是每个 `Task` spawn 独立 signal — `<promise>` grep 在两层都 load-bearing。

> [Wave 6 T6.1 fill] — 实际 30 sample test 中各 layer 命中分布 + `isComplete()` 调用 snippet + `COMPLETION_SCHEMA` 最终 sketch。

### 4. contract v1.2 reconcile (B-01)

14 字段 `AgentDefinition` 类型 **byte-identical 不变**（harnessed-internal contract）；`query()` 调用前 unpack 4 字段（`description`/`prompt`/`tools`/`model`）作 SDK 物理 input；其余 10 字段（`initialPrompt`、`criticalSystemReminder_EXPERIMENTAL` 等）通过 prompt template inject 拼入 SystemPrompt 上下文。reconcile fn 走 `src/routing/lib/sdkReconcile.ts` (NEW) — `agentDefinition.ts` 现 191L + reconcile ≈ +30-40L 预计超 200L → split (B-24)。

`docs/AGENT-DEFINITION-FACTORY-CONTRACT.md` v1.1 main body **不动**（A7 守恒）— contract v1.2 errata 仅通过本 ADR § Decision 4 inline 记录。

> [Wave 6 T6.1 fill] — 实际 `toSdkAgentDefinition()` + `injectFactoryInternalFields()` 签名 + lib/sdkReconcile.ts wc -l + agentDefinition.ts 升级后 wc -l。

### 5. per-phase model tier schema (B-08~B-13)

`workflows/<name>/phases.yaml` schema 加 `model:` **必填字段**（execute-task 主流程 phase 静态标 model）；4 phase 默认表（intel 第 4 条）：

| Phase | Model |
|-------|-------|
| `01-clarify` | `opus` / `sonnet` |
| `02-code` | `sonnet` |
| `03-test` | `sonnet` / `haiku` |
| `04-deliver` | `haiku` |

`--model-tier inherit` CLI flag 逃生口（`harnessed execute-task <name> --model-tier inherit` 不读 `phase.model`，继承调用方 model）；`agentFactory` 读 `phase.model` 填入 `AgentDefinition.model` — zero new engine（intel "zero new engine" 理念）。schema 位置 = **新文件** `src/workflow/schema/phases.ts` (B-13)，loader = `src/workflow/loadPhases.ts`（沿袭 `loadManifest.ts` pattern）。

GSD `/gsd-set-profile`（orchestration agent model）与 harnessed model tier（spawn subagent model）**namespace 独立**（B-11）— 文档明示，避免认知混淆。

> [Wave 6 T6.1 fill] — 实际 `phases.yaml` schema 字段表 + 4 phase 默认值 final + `--model-tier inherit` 解析 snippet。

### 6. Wave 0 transparency CI gate flip + freshness ext (B-14~B-19)

三动作 atomic（W3 lock 解除，phase 1.4 T1 + 1.5 H1/M1 连续 2 phase 复发后的结构性根治）:

1. **`scripts/check-transparency-verdicts.mjs` `ENFORCE = false` → `true`**（B-14, B-18 独立 atomic commit；T0.6 落地）
2. **13 verdict 文档 marker migration**（B-15 manual 1-by-1：10 ADD + 3 REPAIR — phase 1.1/1.2/1.3/1.4 PLAN-CHECK+VERIFICATION × 2 + 1.5 VERIFICATION + 2.1 VERIFICATION = 10 ADD；phase 1.5 PLAN-CHECK / v0.1.0 MILESTONE-AUDIT / 2.1 PLAN-CHECK = 3 REPAIR；T0.3 落地）
3. **Freshness ext 扩展**（B-16, B-17 RESEARCH § 3.5 +25L sketch；T0.4 落地）— `STATUS_MARKER` regex (`/^\s*>?\s*\*{0,2}(?:Status|状态)\*{0,2}\s*[:：]\s*(.+)$/m`) + `FRONT_MATTER_DOCS = ['README.md', 'docs/PROJECT-SPEC.md']` + `getLatestShippedToken()` 读 `.planning/ROADMAP.md` (`ROADMAP_LATEST_RE = /^##\s+v\d+\.\d+\.\d+\s+—.*✅\s*SHIPPED/m`) + `checkFreshness()` 检测 README/PROJECT-SPEC `Status:` marker 是否含 latest shipped token。

Wave 0 必须最先（B-19）— 保 CI 不 red on gate violations 后续 wave；ENFORCE flip 独立 atomic commit（B-18），易 revert if migration miss。

> [Wave 6 T6.1 fill] — 实际 13 verdict 文档 N/N ratio + miss list 汇总 + ENFORCE flip 前后 CI run URL + check-transparency-verdicts.mjs 最终 wc -l。

### 7. SchemaVersion 单一兼容门 (B-32 — delta D-16, intel CD-5 ⭐⭐⭐)

**naming 约定**：`harnessed.<surface>.v1`（e.g. `harnessed.routing-snapshot.v1`、`harnessed.phases.v1`、`harnessed.manifest-state.v1`）—— **schemaVersion 字段是单一兼容门**，跨边界 artifact 演进 consumer 必须 branch on it。

**3 rules**:
1. **Consumer 必须 branch-on-version** — 读取 artifact 时显式 switch on `schemaVersion`，非匹配版本走 graceful path（不 crash）
2. **未知 enum 值 graceful degrade** — adapter-specific 字符串值不 fail（沿袭 ECC `ecc.session.v1` 模式），未知 enum 视作 `unknown`-bucket
3. **新增字段必须 nested** — 不能 top-level（防 schemaVersion bump 失控）

**7 surface 列表**（Wave 2 SDK contract v1.2 reconcile 同步引入）：
1. routing snapshot — `harnessed.routing-snapshot.v1`
2. handoff doc — `harnessed.handoff-doc.v1`
3. phases.yaml — `harnessed.phases.v1`
4. manifest state — `harnessed.manifest-state.v1`
5. installer state — `harnessed.installer-state.v1`
6. route decision log — `harnessed.route-decision-log.v1`
7. checkpoint — `harnessed.checkpoint.v1`

**纯学不 vendor**（intel CD-5 实施约束）— 引擎层算法结构，不引入 ECC 外部代码。

> [Wave 6 T6.1 fill] — 7 surface 实际引入 schemaVersion 字段位置 + TypeBox schema vs convention-only doc 决议 + consumer branch helper 命名（如 `branchOnSchemaVersion()`）+ unknown enum graceful degrade test result。

### 8. Provenance gate hard fail (B-33 + B-34 — delta D-17, intel CD-6 ⭐⭐)

**~5KB `provenance.schema.json` JSON schema**，4 字段：

| Field | Type | Description |
|-------|------|-------------|
| `source` | enum | 产源分层：`curated` / `learned` / `imported` / `evolved`（沿袭 ECC SKILL-PLACEMENT-POLICY.md 4 类） |
| `created_at` | ISO 8601 timestamp | 创建时刻 |
| `confidence` | float 0-1 | 来源可信度（curated=1.0；evolved 视演化次数 decay） |
| `author` | string | 作者署名（subagent name OR human user OR ralph-loop iteration id） |

**Enforce path** (B-34)：composition skill + installer 加 lint check — 任何 runtime artifact（routing 决策日志 / handoff doc / failed-route 记录 / checkpoint 修复 / session learnings）必须 sibling `.provenance.json`，否则 **hard fail**（CI red + commit reject）。

**为什么 BEFORE-W4 是 hard gate**：Wave 4 ralph-loop full integration 真实 spawn 一启动即产 runtime artifact 洪流 —— 之前不上 gate = 之后追溯 curated 装配上游 vs runtime 生成物污染极痛（ECC 实证）。**WARN-ONLY 不够**：开发者会忘记 → 污染累积。

**CI integration**：Wave 4 启动前 `scripts/check-provenance.mjs`（或扩展 existing transparency gate）加 enforce step；3-OS sentinel；**scope 限定 runtime artifact path**（`.harnessed/sessions/**`、`.harnessed/checkpoints/**` 等），curated path（`workflows/**/SKILL.md`、`manifest.yaml` 等）不扫（R8 mitigation）。

> [Wave 6 T6.1 fill] — `provenance.schema.json` 最终 wc + 实际 enforce scope regex + check-provenance.mjs wc + Wave 4 启动前 CI 红线 verify run URL。

### 9. Task Session 复用 conditional (B-35 + B-36 — delta D-18, intel CD-4 ⭐⭐)

**Decision: conditional on Wave 1 SDK SC4 verify outcome**。

**Wave 1 spike SC4 verify** (B-35)：T1.1 / T1.2 加 success criterion **SC4** — verify `@anthropic-ai/claude-agent-sdk` 是否暴露 session resume API（查 `.d.ts` `resume?: string` option on `query()` + spike 实测 resume 后 agent state 真的保留：`memory` 字段 / tools 状态 / conversation history 全 carry，omo `task_sessions[task_key]` 语义）。

**Branch outcomes** (B-36)：

| SC4 outcome | Phase 2.2 action | Phase manifest schema change |
|-------------|------------------|------------------------------|
| **pass** | Wave 4 ralph-loop integration 集成 `task_session_id`；executor 优先 resume 同 session（phase 03 test fail 回炉 phase 02 code 时复用同 subagent context） | 加 `task_session_id?: string`（optional field）到 phase manifest TypeBox schema |
| **fail** | CD-4 加入 deferred → v0.3.0 checkpoint 完整版（`harnessed resume` + compact 协议）；Phase 2.2 不实装、不动 schema | **无修改** — schema 不引入 task_session_id 字段 |

**为什么 PIGGY-W1**：Wave 1 SDK spike (T1.1/T1.2) 本就要跑 SDK probe，加 1 项 SC4 边际成本接近零；conditional branch 决策树清晰（无 over-engineering 风险）。

**Schema interaction with § 7 (B-32)**：Wave 2 schemaVersion 7 surface 引入若包含 phase manifest，**conditional reflect** — SC4 pass 才加 `task_session_id` 字段（沿袭 § 7 rule 3 "新字段必须 nested"）；SC4 fail 则 `harnessed.phases.v1` schema 不动。

> [Wave 6 T6.1 fill] — SC4 实测 outcome + 决议 branch 选择 + Wave 4 task_session_id 集成 snippet（pass branch）OR deferred 转移记录（fail branch）+ phase manifest schema diff（pass branch）。

## A7 Conservation

ADR 0001-0010 main body **untouched**；baseline tag iteration `adr-0001-accepted` ... `adr-0010-accepted` → 加 `adr-0011-accepted`（phase 2.2 Wave 6 ship 时打）。`docs/AGENT-DEFINITION-FACTORY-CONTRACT.md` v1.1 14-字段 contract main body **不动** — contract v1.2 reconcile 仅本 ADR § Decision 4 inline 记录；`docs/INSTALLER-CONTRACT.md` main body **不动**。

### A7 守恒验收命令（phase 2.2 ship 后 0001-0011 iterate）

```bash
for n in 0001 0002 0003 0004 0005 0006 0007 0008 0009 0010 0011; do
  diff_out=$(git diff "adr-${n}-accepted" -- "docs/adr/${n}-*.md")
  [ -z "$diff_out" ] || { echo "A7 violated for ADR ${n}"; exit 1; }
done
echo "A7 ✅ ADR 0001-0011 main body unchanged"
```

phase 2.2 draft 阶段（本 ADR `Draft`）验收（A7 仍 0001-0010 守恒）:

```bash
git diff adr-0010-accepted -- docs/adr/0010-*.md   # = 0 lines (A7 守恒)
```

### CI A7 step

`.github/workflows/ci.yml` A7 step 两处 `for n in 0001 ... 0010` loop 加 `0011`；step name `ADR 0001-0010` → `ADR 0001-0011`（Wave 6 T6.3 落地）。

### Errata-path note

phase 2.2 ship 时打 `adr-0011-accepted` baseline tag（本 ADR main body 自 Draft → Accepted 时刻 0 diff stable）。push 后 CI A7 step 实测 11 ADR baseline tag 全绿。任一非空 diff 即 fail。本 ADR 0011 起 phase 2.2 ship 时刻 frozen — 任何 v0.2.3+ 演化（新 SDK 升级 / dual-signal layer 调整 / per-phase model tier 真实模型 routing / Wave 0+ 后续 transparency 防线 / schemaVersion v2 bump / provenance gate scope 扩展 / Task Session 完整版升级）必须开 ADR 0012+ errata；本 ADR 0011 main body 不可改（与 ADR 0001-0010 同等守恒规则）。

## References

### 内部依据

- `docs/adr/0008-routing-engine-v1-errata.md` § Decision（routing engine v1 base — 本 ADR § Decision 1 SDK 引入扩展 spawn 真实化）
- `docs/adr/0009-routing-l2-engineering-23-shi-errata.md` § Decision 1（contract v1.1 14 字段 — § Decision 4 reconcile 起点）+ § Decision 3（systemPrompt verbatim COMPLETE marker — § Decision 3 dual-signal outer layer 起点）
- `docs/adr/0010-installer-schema-extension-errata.md` § Decision 5（agentDefinition.ts H3 budget ≤200L errata — § Decision 4 split rationale 起点）
- `docs/AGENT-DEFINITION-FACTORY-CONTRACT.md` v1.1（14 字段 contract main body — A7 守恒不动；本 ADR § Decision 4 inline reconcile）
- `docs/INSTALLER-CONTRACT.md`（main body 不动）
- `docs/TRANSPARENCY-VERDICT-CHECKLIST.md`（Phase 2.1 T1.7 ship — § Decision 6 freshness ext 扩展 + § Status freshness markers 新章节）
- `scripts/check-transparency-verdicts.mjs` 45L（Phase 2.1 T1.7 ship — § Decision 6 +25L freshness ext）
- `src/routing/engine.ts` 199L — § Decision 1 spawn placeholder 替换（split sdkSpawn.ts per B-25）
- `src/routing/agentDefinition.ts` 191L — § Decision 4 reconcile 起点（split sdkReconcile.ts per B-24）
- `src/routing/systemPrompt.ts` 53L — § Decision 3 outer PRIMARY schema const append
- `src/routing/lib/ralphLoop.ts` 42L — § Decision 2 + § Decision 3 升级（≤50L 守住 per B-26）
- `src/routing/lib/promiseExtract.ts` 32L — § Decision 3 outer/inner FALLBACK 路径不动
- `.planning/phase-2.2/2.2-CONTEXT.md` D-01~D-18（discuss-phase 锁 + 2026-05-15 delta D-16/D-17/D-18）
- `.planning/phase-2.2/2.2-DISCUSSION-LOG.md` — delta gray area 5~8 alternatives (CD-5 / CD-6 / EE-4 / CD-4)
- `.planning/phase-2.2/RESEARCH.md` D2.2-1~D2.2-7（researcher 决议 + § 1.6 spike outline + § 2.3 marker templates + § 3.5 freshness ext sketch）
- `.planning/phase-2.2/ASSUMPTIONS.md` § B 36 lock（合并 CONTEXT 18 incl delta + PATTERNS 7 + RESEARCH 7 + intel CD-5/CD-6/CD-4）
- `.planning/phase-2.2/PLAN.md` Wave 0-6 + § 6 F1-F8 reproduction commands
- `.planning/phase-2.2/task_plan.md` T0.1~T6.7 atomic tasks(含 T1.2 SC4 / T2.0 schemaVersion prep / T4.0 provenance prep / T4.x Task Session conditional)

### 外部参考

- `@anthropic-ai/claude-agent-sdk` (`/nothflare/claude-agent-sdk-docs` ctx7 821 snippets, 2026-05-15) — `outputFormat: { type: 'json_schema' }` structured-outputs.md + `agents` map subagents.md + `AgentDefinition` 4-field type + `SDKResultMessage.structured_output` + `resume?: string` option (SC4 verify target)
- `.planning/research/v0.2.0-execute-task-ralph.md`（HIGH conf, 2026-05-15, valid ~2026-06-15）— SDK INTRODUCE + ralph-wiggum keep + dual-signal v1 + 5-phase orchestration + reject list
- `.planning/intel/omc-comparison.md` — 第 4 条 per-phase model tier intel actionable + § 0 SSOT 引用纪律 + CD-5(L149-157,源 ECC,⭐⭐⭐ schemaVersion 单一兼容门) + CD-6(L159-167,源 ECC,⭐⭐ provenance gate) + CD-4(L139-147,源 omo,⭐⭐ Task Session 复用) + EE-4(L74-82,源 omo,⭐⭐ plan 4 维量化阈值 — deferred to Phase 2.4)
- `.planning/ROADMAP.md` v0.2.0 Phase 2.2 — Goal + 必含项 + 验收 5 项 + 关键风险
