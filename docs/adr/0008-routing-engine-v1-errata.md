# ADR-0008: Routing Engine v1 Errata (phase 1.3 deferred items inline + phase 1.4 接口契约升级)

## Status

**Accepted** — 2026-05-13 (phase 1.4 plan-phase Wave 0)

## Context

### Phase 1.3 ship 7 接口契约 ready

phase 1.3（commit `e0029e5`，tag `v0.1.0-alpha.3-base-profile`）落地了三层栈方法论可执行 engine 的全部 schema layer + base profile 数据契约：

1. `manifest.spec.category` 6 enum (`meta` / `engineering` / `design` / `content` / `testing` / `search`) — A8' lock，phase 1.4 routing engine L1 router category match
2. `manifest.spec.install_type` 4 enum (`skill` / `mcp` / `npm` / `git`，1:N → 6 install method) — phase 1.4 install adapter 选择
3. `manifest.spec.decision_rules` optional Object (`trigger` / `default_expert` / `arbitration_rule` / `override_signals`) — per-manifest decision hint backup
4. `routing/decision_rules.yaml` v1 schema (12 rules + Priority hit policy + fallback_supervisor) — phase 1.4 routing engine load + parse 入口
5. `arbitrate(rules, taskContext): Rule | null` (`src/routing/decisionRules.ts`) — phase 1.4 L1 router 直接 import
6. `harnessed install-base` 子命令 (D-9 决策) — 用户 setup 入口；phase 1.4 不动
7. `docs/AGENT-DEFINITION-FACTORY-CONTRACT.md` 12 字段 schema + W-5 V1 BLOCKER 检查机制 (phase 1.3 ship frozen) — phase 1.4 factory implementation 1:1 对应

### Phase 1.4 routing engine v1 实装时 emerge 的需透明化项

phase 1.4 落地 main-process-driven routing engine v1 + AgentDefinition factory invoke + research workflow E2E + 30 真实样本 ≥ 85% 内部基线时，从 fresh 2026-05-13 RESEARCH（R2 P0 lock 4 项）+ phase 1.3 sister review 推迟项中 emerge 4 个 errata items 必须透明化。本 ADR 沿袭 ADR 0003 / 0005 / 0007 errata 风格 — **不动 ADR 0001-0007 main body**（A7 守恒），新加 4 字段 / 1 新决策 / 2 phase 1.5 prereq 跟踪。

### Phase 1.3 sister review 推迟项 (H1a + M1) 因 A7 守恒锁定 ADR 0007 Consequences 段已 frozen

phase 1.3 batch 4 sister review 输出 5 finding（3 H + 2 M），其中两项必须推到 ADR 0008：

- **H1a**: ADR 0007 Consequences 节加 perf cost transparency reference — 因 ADR 0007 已 `adr-0007-accepted` tag 守恒，A7 paranoid check 禁止 main body modification；F38 narrative + T7.3 PERF-ATTRIBUTION.md 已提供本地 transparency，但需正式 ADR errata inline
- **M1**: yaml path migration `.planning/decision_rules.yaml` → `routing/decision_rules.yaml` (phase 1.3 sister patch round commit `df54d3c` 已落地) — ADR 0007 main body 4 处旧 path refs locked by `adr-0007-accepted` tag (A7 守恒)，需本 ADR 0008 errata 官方覆盖

### A7 守恒约束（ADR 0001-0007 main body 不可改）

phase 1.1 acceptance bar A7 + phase 1.2 acceptance bar B7' + phase 1.2.5 wedge + phase 1.3 acceptance bar B7 共同要求 **ADR 0001-0007 main body 不可改**（仅允许 ADR-NNNN errata）。CI A7 step 自动 enforce — 任一 baseline tag iterate 出现非空 diff 即 fail。本 ADR 0008 是 **errata** 形式 — 不动 ADR 0001-0007 main body；新增字段 / 决策 / 跟踪条目通过本 errata 一次落地。本 errata 沿袭 ADR 0003（install method count 5→6）+ ADR 0005（marketplace_source 字段补完）+ ADR 0007（manifest 加 3 字段）的"errata 不动 main body"风格。

## Decision

### 1. H1a perf cost transparency reference（ADR 0007 Consequences 段补完）

phase 1.3 给 SpecSchema 顶层加 3 字段 (`category` 6 enum + `install_type` 4 enum + `decision_rules` optional nested Object 含 `override_signals` array of object) 后，本地 best-of-50 manifest validate 100-manifest 平均时延：

- phase 1.1 baseline（`v0.1.0-alpha.1-schema-frozen`）：~22ms (mean) / RME ±2%
- phase 1.3 head（current main）：~28ms (mean) / +12.17%（约 +6ms / 100 manifest）
- 增量主导：`decision_rules.override_signals` nested array of object 占 ~67%（Ajv strict + additionalProperties:false 多层 walk）；`category` + `install_type` 两 enum union 占余 ~33%（各 6/4 enum literal compare）
- F38 50→75ms hotfix 决议 cost-benefit 数据驱动正确；A6 acceptance bar 数值更新：< 50ms → < 75ms
- 详尽方法论 + bench 数据 + reproduction guide 见 `.planning/phase-1.3/PERF-ATTRIBUTION.md`（177 行 H1b transparency narrative）

**phase 1.4 implication**: routing engine 主流程**不需** schema validation 进一步优化 — Ajv compiled 已是 industry-standard 上限；30 sample × routing arbitrate 不走 manifest validate hot path（`arbitrate()` 直接消费已加载的 rule 对象，不重复 schema validate）。任何 phase 1.4 routing engine 实装后 perf 退化（如 `runInstall` hook 进 `validateManifestFile` 调用次数增加）由 task_plan T7.3（可选 PERF-ATTRIBUTION-2.md）跟踪。

### 2. M1 yaml path migration 官方化（ADR 0007 path references 覆盖）

phase 1.3 sister review 落地（commit `df54d3c`）已迁移 `routing/decision_rules.yaml`：

- **旧 path**: `.planning/decision_rules.yaml`（phase 1.2.5 GRAY-AREA-1 草案位置；plan-phase artifact 性质）
- **新 path**: `routing/decision_rules.yaml`（运行时 SSOT 位置；与 `src/routing/` 源码同源管理；非 plan-phase 一次性产物）
- **理由**: routing engine 是运行时组件 — yaml 应在源码运行时路径下 (与 `manifests/`、`src/` 同根)，不应埋在 `.planning/` 内（plan-phase ephemeral 产物目录）；M1 finding 已正确驱动迁移
- **ADR 0007 main body 4 处旧 path refs**（L39 / L105 / L171 等）由本 ADR 0008 errata 官方覆盖：phase 1.4+ 实装统一引用 `routing/decision_rules.yaml`；ADR 0007 main body 因 A7 守恒不修改，旧 path refs 在 main body 内视为"非规范性 sketch"，本 ADR 0008 § Compliance 视为"规范性实装契约"

phase 1.4 routing engine `loadDecisionRules()` 调用方一律使用 `routing/decision_rules.yaml` — 测试覆盖在 `tests/integration/decision-rules-load.test.ts` 已 ship；phase 1.4 新增 30-sample test 在 inline truth table 直接消费 arbitrate 结果（不 reload yaml）。

### 3. D1.4-2 contract delta（`initialPrompt` + `criticalSystemReminder_EXPERIMENTAL` 推 phase 1.5 evaluate）

phase 1.3 ship 的 `docs/AGENT-DEFINITION-FACTORY-CONTRACT.md` 12 字段 schema（`description` / `prompt` / `tools` / `disallowedTools` / `model` / `skills` / `mcpServers` / `memory` / `maxTurns` / `background` / `effort` / `permissionMode`）经 fresh 2026-05-13 RESEARCH § 2.1 cross-check（`code.claude.com/docs/en/agent-sdk/typescript` + `/anthropics/claude-code` ctx7 双源） — **12 字段 100% accurate** — 不动 contract v1 main body（W-5 V1 BLOCKER bar 守恒）。

但官方 schema 多 2 个 phase 1.3 contract 未列字段（fresh 暴露）：

| 新字段 | 类型 | 必填 | 用途 | phase 1.4 决策 |
|---|---|---|---|---|
| `initialPrompt` | optional `string` | No | Auto-submitted as the first user turn when this agent runs as the **main thread agent** — 限 plugin `settings.json` `agent: <name>` 把 plugin agent 升级为 main thread 时 | 不用（main thread = harnessed routing engine 自己，不是 plugin agent） |
| `criticalSystemReminder_EXPERIMENTAL` | optional `string` | No | **Experimental** Critical reminder added to the system prompt — inject 强 system reminder | 不依赖（`_EXPERIMENTAL` 字段名暗示不稳定） |

**Lock D1.4-2 (本 ADR 0008 errata)**: phase 1.4 实装 12 字段 1:1（与 phase 1.3 contract 1:1 对齐 — W-5 V1 BLOCKER 守恒）；2 新字段标记 **「possible v1.1 errata, deferred to phase 1.5 evaluate」**（不动 v1 main body — A7 守恒）。phase 1.5 KICKOFF prereq 加入 `initialPrompt` + `criticalSystemReminder_EXPERIMENTAL` 评估条目。

### 4. Routing engine 接口契约升级（phase 1.4 实装中 emerge 微调跟踪点）

phase 1.4 routing engine v1 实装时 ship 的 8 个接口契约（详 `.planning/phase-1.4/PLAN.md` § 4），如 phase 1.4 execute-phase 中 emerge 微调（如 `EngineResult` 三态字段名 / `SkillNotInstalledError` 构造 signature 微调 / `installResearchWorkflowDeps` adapter signature 演化），通过本 ADR 0008 errata § Decision 4 跟踪条目透明化（execute-phase 末尾如有微调，commit 后由 main agent 决议是否需补 ADR 0008 patch 或推 ADR 0009+）：

| 接口契约 | phase 1.4 ship 位置 | 微调风险 |
|---|---|---|
| `engine.route(task, opts): Promise<EngineResult>` | `src/routing/engine.ts` (T3.1) | 主流程入口签名稳定 — 推 phase 1.5 DAG resolver 实装时 supersede |
| `EngineResult` 三态 discriminated union | `src/routing/engine.ts` 类型 export | 三态字段名 (`ok` / `aborted` / `phase`) 稳定 |
| `agentFactory: (task, decision, opts) => Promise<AgentDefinition>` | `src/routing/agentDefinition.ts` (T3.2) | contract § 3 锁 — W-5 V1 BLOCKER bar |
| 4 typed error class (Skill/Invalid/Missing/RestartRequired) | `src/routing/agentDefinition.ts` export | contract § 5.1 锁 |
| `systemPrompt` const + `COMPLETE_INSTRUCTION` const | `src/routing/systemPrompt.ts` (T3.3) | D-18 1:1 contract § 5.4 锁 |
| `installResearchWorkflowDeps()` install adapter | `src/cli/research.ts` 内部 / spillover `src/routing/lib/installAdapter.ts` (T5.1) | D1.4-4 sequential MCP + parallel ctx7 锁 |
| `routing/index.ts` barrel re-export | `src/routing/index.ts` (T3.1 末尾) | Pattern G 复用 — phase 1.5 加新组件直接 re-export |
| `tests/integration/routing-30-samples.test.ts` SAMPLES inline truth table | T6.2 ship | D-16 锁 — phase 3.4 v0.3.0 100+ sample 验收时 fixture 化迁移基线 |

execute-phase 最终 ship 时若 8 接口契约全部 1:1 对应 plan，则本节作为透明化条目落地；若有微调，progress.md F40+ finding narrative 同步沉淀，必要时本 ADR 0008 errata 加 sister patch 段落（沿袭 phase 1.3 W-2 / W-6 sister patch 模式）。

## Consequences

### 正面

1. **phase 1.4 routing engine + factory + systemPrompt 实装可直接消费 phase 1.3 ship 的 7 接口契约 + 本 ADR 0008 errata 4 items**：12 字段 contract 不变；2 新字段推 phase 1.5；yaml path 统一 `routing/decision_rules.yaml`；perf transparency 已落地 PERF-ATTRIBUTION.md
2. **A7 守恒持续** — ADR 0001-0007 main body 0 修改；本 ADR 加 `adr-0008-accepted` baseline tag，CI A7 step iterate 1-7 → 1-8（task_plan T1.2 同步落地）
3. **W-5 V1 BLOCKER 守恒** — phase 1.4 factory 12 字段 1:1 contract v1 (frozen at phase 1.3 ship)；2 新字段在 errata § 3 标记 deferred，不动 v1 main body
4. **phase 1.5 prereq 透明化** — 2 新字段 contract evaluate / DAG resolver / Semantic Router L2 / engineering category routing / mattpocock 23 招式 phase routing 全部本 ADR 0008 § Consequences R6 跟踪条目落地
5. **phase 1.4 sister review 模式准备** — 本 ADR 0008 § Decision 4 接口契约升级跟踪点为 phase 1.4 execute-phase 末尾如有微调留 sister patch 落地通道（沿袭 phase 1.3 W-2 / W-6 模式）

### 负面

1. **认知负担** — schema / contract 字段表分散到 ADR 0001 + 0005 + 0007 + 0008，需 ADR README index 显式 link
2. **mitigation**: `docs/adr/README.md` index 加 0008 行；ADR 0008 自带"errata"语义足够，不在 ADR 0007 索引行追加注释（避免索引行越来越长）
3. **phase 1.4 execute-phase 跟踪开销** — § Decision 4 接口契约升级跟踪点要求 execute-phase 末尾审查 8 接口是否 emerge 微调；若有则需补 sister patch（30-60 min 工作量）

### 中性

1. v0.1 contract v1 12 字段 frozen；v0.2+ 拓展（如评估 `initialPrompt` upgrade）走 ADR 0009+ errata
2. phase 1.4 routing engine 8 接口契约稳定后，phase 1.5 DAG resolver supersede 部分（`engine.route` / `EngineResult`），但 factory + systemPrompt + 4 error class + 30-sample inline truth table 持续复用
3. `decision_rules.yaml` v1 schema 仅含 6 category × 12 rules MVP；v0.2+ 拓展（如加 COLLECT / RULE_ORDER 其他 DMN hit policy）走 ADR 0009+ errata（推 phase 1.5+ 评估）

### R6 跟踪条目（phase 1.5 prereq）

phase 1.4 KICKOFF 第 38 行 explicit lock：**engineering category v1 占位 0 rules + mattpocock 23 招式 phase routing schema 推 phase 1.5**。本 ADR 0008 § Consequences R6 跟踪条目正式落地：

- **R6-1**: engineering category routing rules 实装 — phase 1.5 范围；phase 1.4 30 sample 中 engineering ≤ 5 sample 走 fallback_supervisor expected (`expected_primary = "fallback_supervisor"`)，不拉低 ≥ 85% 总命中率
- **R6-2**: mattpocock 23 招式 phase routing schema (discuss / plan / execute / verify 分阶段调度) — phase 1.5 范围；phase 1.4 research workflow E2E (C4) 仅实装单一 search category 路径
- **R6-3**: `--add-plugin ralph-wiggum` 官方 plugin headless mode 切换评估 — v0.2+ 范围；phase 1.4 自实装 ≤ 50L wedge 原则严守 (D1.4-3)
- **R6-4**: DAG resolver + Semantic Router L2 (embedding kNN 升级) — phase 1.5 范围；phase 1.4 仅 L1 关键词路由 + supervisor fallback
- **R6-5**: 100+ sample × 多 model × stability 完整命中率验收 — phase 3.4 v0.3.0 release 范围；phase 1.4 30 sample 是 v0.1 内部基线

## Compliance / Migration

### v0.1 强制约束（phase 1.4 ship 后生效）

- **factory 12 字段 1:1 contract v1 守恒** — `src/routing/agentDefinition.ts` ship 12 字段（与 phase 1.3 contract § 2 1:1）；`initialPrompt` + `criticalSystemReminder_EXPERIMENTAL` 不实装（推 phase 1.5）
- **yaml path 统一** — phase 1.4+ 实装一律 `routing/decision_rules.yaml`；`.planning/decision_rules.yaml` 旧 path 视为历史 artifact（grep -r `\.planning/decision_rules\.yaml` src/ tests/ 应 0 hit — 实装代码不引）
- **systemPrompt 1:1 contract § 5.4** — `src/routing/systemPrompt.ts` SYSTEM_PROMPT + COMPLETE_INSTRUCTION 字符串 1:1 对应 contract § 5.4 verbatim 文本（D-18 plan-checker enforce + T4.1 unit test cell 11 enforce — task_plan T3.3 + S-3 sister patch）；任何 prompt 字符串调整必须先改 contract 再改 systemPrompt（不是反向），contract drift 必走 ADR 0009+ errata
- **A7 验收命令更新**:
  ```bash
  for n in 0001 0002 0003 0004 0005 0006 0007 0008; do
    diff_out=$(git diff "adr-${n}-accepted" -- "docs/adr/${n}-*.md")
    [ -z "$diff_out" ] || { echo "A7 violated for ADR ${n}"; exit 1; }
  done
  echo "A7 ✅ ADR 0001-0008 main body unchanged"
  ```
- **CI A7 step**: `.github/workflows/ci.yml` A7 step iterate 1-7 → 1-8（task_plan T1.2 落地）

### 守恒强化

phase 1.4 T1.1 完成时打 `adr-0008-accepted` tag（本地）；phase 1.4 T7.1 push 时让 CI A7 step 实测全绿 8 ADR baseline tag。任一非空 diff 即 fail。

### Phase 1.4 ship 时刻 frozen

本 ADR 0008 起 phase 1.4 ship 时刻 frozen — 任何 v0.2+ 演化（`initialPrompt` evaluate / `criticalSystemReminder_EXPERIMENTAL` evaluate / DAG resolver / Semantic Router L2 / engineering rules / mattpocock_phases routing / contract v1.1 errata）必须开 ADR 0009+ errata；本 ADR 0008 main body 不可改（与 ADR 0001-0007 同等守恒规则）。

## References

### 内部依据

- `docs/adr/0001-manifest-schema-v1.md` § "Top-level structure"（SpecSchema unchanged — A7 守恒）
- `docs/adr/0003-install-method-count-errata.md`（errata 不动 main body 风格沿袭）
- `docs/adr/0005-marketplace-source-schema-errata.md`（schema 字段补完 errata 风格沿袭）
- `docs/adr/0006-three-stack-mechanization-wedge.md` § 1（双层架构 ASCII 图 — phase 1.4 是 wedge 实装第二步硬实装）+ § 6（ROADMAP 重排 — phase 1.4 = routing engine v1 + research workflow E2E）
- `docs/adr/0007-categorization-schema-errata.md` § 1-2（manifest 加 3 字段；本 ADR 0008 § Decision 1+2 续接）+ § Compliance（A7 验收命令 — 本 ADR 0008 升级到 0001-0008 iterate）
- `docs/AGENT-DEFINITION-FACTORY-CONTRACT.md`（217 行 12 字段 contract v1 frozen at phase 1.3 ship — 本 ADR 0008 § 3 + § Compliance 守恒）
- `routing/decision_rules.yaml`（12 rules + Priority hit policy + fallback_supervisor — 本 ADR 0008 § 2 path 官方化）
- `.planning/phase-1.3/PERF-ATTRIBUTION.md`（177 行 H1b perf transparency narrative — 本 ADR 0008 § 1 inline reference）
- `.planning/phase-1.4/RESEARCH.md`（R2 — 4 P0 lock D1.4-1~5 HIGH conf — 本 ADR 0008 § 3 D1.4-2 + § 4 接口契约升级跟踪点 sourcing）
- `.planning/phase-1.4/PATTERNS.md`（R1 — 6 决策 D-13~D-18 + Pattern N/O/P + 6 风险 R1-R6 — 本 ADR 0008 § Consequences R6 跟踪条目 sourcing）
- `.planning/phase-1.4/ASSUMPTIONS.md`（D1.4-1~15 决策追溯 + § E R1-R6 paranoid 风险 — 本 ADR 0008 § 4 跟踪点 + § Consequences R6 sourcing）
- `.planning/phase-1.4/PLAN.md` § 4 接口契约（8 接口 — 本 ADR 0008 § 4 跟踪点 1:1 对应）+ § 6 acceptance bar C1-C8
- `.planning/phase-1.4/KICKOFF.md` § 关键约束（A7 守恒 + D1.2.5-3 main-process-driven + F33 verbatim COMPLETE + Karpathy simplicity hard limit）
- `.planning/phase-1.4/task_plan.md` T1.1（本 ADR 0008 errata 起草 + adr-0008-accepted tag）+ T1.2（ci.yml A7 iter 1-7 → 1-8）

### 外部参考

- `code.claude.com/docs/en/agent-sdk/typescript` (fetched 2026-05-13) — 12 字段 AgentDefinition 完整 schema verify + `initialPrompt` + `criticalSystemReminder_EXPERIMENTAL` 暴露
- `code.claude.com/docs/en/agent-sdk/subagents` (fetched 2026-05-13) — `Agent` tool 嵌套禁止 + `Task`/`Agent` rename 双兼容
- `anthropics/claude-code/plugins/ralph-wiggum` (Tavily fetched 2026-05-13) — 官方 ralph-loop plugin in-session stop-hook 实装 + `--completion-promise` exact match + `--max-iterations` actual safety net
- DMN 1.4 Hit Policy Specification（OMG Priority Hit Policy 仲裁规则起源 — 沿用 ADR 0007 reference）
