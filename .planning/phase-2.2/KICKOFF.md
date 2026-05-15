# Phase 2.2 plan-phase — KICKOFF

> **Authored**: 2026-05-15
> **Phase**: v0.2.0 Phase 2.2 — execute-task workflow + ralph-loop full integration
> **依赖**: `2.2-CONTEXT.md`(discuss-phase 4 灰色地带 15 D-决策)+ `.planning/research/v0.2.0-execute-task-ralph.md` HIGH conf + `.planning/intel/omc-comparison.md` 第 4 条 + § 0 SSOT 引用纪律
> **风格沿袭**: phase 1.5/2.1 plan-phase Wave 结构(KICKOFF → Wave A R1 PATTERNS + R2 RESEARCH → Wave B ASSUMPTIONS + PLAN + task_plan → Wave C PLAN-CHECK)

---

## § 1 Phase Goal & Scope

### 1.1 Goal

把 v0.1.0 routing engine v1 + Phase 2.1 的 6 install method runtime-ready 升级为**真实 SDK spawn subagent + ralph-loop 完整闭合**。实装 execute-task workflow 主线 4 phase chain(brainstorming → karpathy 心法 always-on → mattpocock 招式按需召唤 → conditional TDD → ralph-loop 交付 COMPLETE),每子任务 verbatim COMPLETE 回流主流程。

**Wave 0 必办**(Phase 2.1 deferred 继承)— transparency CI gate `ENFORCE` flip 为 `true` + 全史 verdict 文档迁移到结构化 marker + reviewer 洞察的 CI gate freshness check 扩展(README/PROJECT-SPEC 状态节)— **一次性根治** transparency 反模式。

### 1.2 In Scope（8 acceptance bar F1-F8 — 详 Wave B ASSUMPTIONS § A）

- **F1 — Wave 0 transparency 一次性根治**: `scripts/check-transparency-verdicts.mjs` `ENFORCE = true` + 全 `.planning/**/PLAN-CHECK.md` + `*-AUDIT.md` + `VERIFICATION.md` 加 marker 行(`Verdict:` / `状态:` / `Closure:` 行首 + `\d+/\d+` ratio + `miss:` 声明)+ 扩展 CI gate 覆盖 README/PROJECT-SPEC 状态节 freshness check(D-07 + reviewer item 21)
- **F2 — ADR errata draft**: 单 ADR 覆盖 Phase 2.2 全部决策(SDK 引入 + ralph-wiggum keep-vs-switch + dual-signal completion + contract v1.2 reconcile + per-phase model tier schema errata + Wave 0 transparency)— **ADR 编号由本 plan-phase 实占**(沿袭 intel § 0 不预占;Phase 2.1 D-08 暂记 0011 仅参考)
- **F3 — SDK spike + 引入**: `@anthropic-ai/claude-agent-sdk` 版本复核(`npm view @anthropic-ai/claude-agent-sdk version`,research valid until ~2026-06-15)+ spike `outputFormat: { type: 'json_schema' }` + `agents`-map 组合可行性(research § 4 open question)+ package.json 引入 + lockfile + 3-OS CI verify
- **F4 — agentFactory contract v1.2 reconcile + dual-signal completion**: factory 产 14 字段 `AgentDefinition`(类型不变)+ query() 调用前 unpack 4 字段(`description`/`prompt`/`tools`/`model`)作 SDK 物理 input + 其余 10 字段拼 prompt 上下文 + dual-signal completion(structured output PRIMARY + `<promise>` FALLBACK)
- **F5 — per-phase model tier schema**: `workflows/<name>/phases.yaml` schema 加 `model:` 必填字段 + 4 phase 默认表(01-clarify=opus/sonnet / 02-code=sonnet / 03-test=sonnet/haiku / 04-deliver=haiku)+ `--model-tier inherit` CLI flag override 逃生口 + agentFactory 读 `phase.model` 注 `AgentDefinition.model`
- **F6 — ralph-loop full integration 主流程 routing engine 调用**: `engine.route()` 升级 — arbitrate → install missing → agentFactory → **SDK `query()` spawn**(替换 placeholder)→ `ralphLoopWrap` wrap → dual-signal `isComplete` → verbatim COMPLETE 回流(`<promise>COMPLETE</promise>` XML wrapper 协议保留)
- **F7 — execute-task workflow CLI 实装 + 30 子任务测试**: `harnessed execute-task <name>` 子命令(10th register fn,沿袭 phase 1.4 research.ts 9th 模式)+ 30 子任务 ralph-loop COMPLETE 检测 100% 准确(沿袭 phase 1.4 SAMPLES.md R3 frozen selection rationale)
- **F8 — ship**: CI 三平台全绿(含 transparency gate `ENFORCE=true` 实测)+ adr-NN-accepted baseline tag(N 由 plan-phase 实占)+ ci.yml A7 step iter 1-10 → 1-(N) + ADR 0001-0010 main body 0 diff + v0.2.0-alpha.2-execute-task 候选 milestone tag

### 1.3 Out of Scope（推后续 phase — 详 CONTEXT § Deferred）

| 项 | 推迟到 | Rationale |
|----|-------|-----------|
| design/content/testing extension category MVP | Phase 2.3 | 本 phase 只做 execute-task 主线 |
| doctor 完整版 + audit + ralph-loop Win 兼容 | Phase 2.4 | jq/Git Bash 探测/upstream_health weekly cron/audit log 是独立 phase |
| checkpoint 完整版(`harnessed resume` + compact 协议) | v0.3.0 P3.1 | execute-task 长链路 checkpoint 模板可用 phase 2.2 但完整版推 v0.3.0 |
| intel 第 2 条 `resolved_routing` 快照冻结 | Phase 2.3+ 评估 | karpathy YAGNI — 真实 drift 出现后再做 |
| intel 第 3 条 handoff 四字段 checkpoint 模板 | v0.3.0 checkpoint 完整版 | Decided/Rejected/Risks/Files 进 `.harnessed/checkpoints/` |
| 动态 model routing(intel 愿景) | v0.3+ 评估 | static model tier 跑通后再考虑 signal→rules→scorer 升级 |
| karpathy-skills behavior-rule 注入 + CLAUDE.md merge | Phase 2.3 | extension category 时一起做 |
| gstack 前缀探测 + workflow 变量插值 | v0.3.0 P3.2 | plan-feature workflow 时落地 |

---

## § 2 Wave 拓扑（预期 — Wave B planner 细化）

```
Wave 0 — transparency 一次性根治 + ADR errata draft (F1+F2)
  ├─ flip scripts/check-transparency-verdicts.mjs ENFORCE=true
  ├─ 全 .planning/** PLAN-CHECK/AUDIT/VERIFICATION 加 marker 行(批量迁移)
  ├─ CI gate freshness check 扩展(README/PROJECT-SPEC 状态节)
  └─ ADR errata draft(编号 plan-phase 实占;覆盖 Phase 2.2 全决策)
       ↓
Wave 1 — SDK spike + 引入 (F3)
  ├─ npm view @anthropic-ai/claude-agent-sdk version 复核
  ├─ spike outputFormat + agents-map 组合可行性(research § 4 open question)
  └─ package.json + lockfile + 3-OS CI verify
       ↓
Wave 2 — agentFactory contract v1.2 reconcile + dual-signal completion (F4)
  ├─ 对照 installed `.d.ts` 重验 14 → 4 字段映射
  ├─ factory unpack 4 字段 (description/prompt/tools/model) → SDK query() input
  ├─ 其余 10 字段拼 prompt 上下文(SystemPrompt template inject)
  ├─ dual-signal isComplete(structured_output PRIMARY + extractPromise FALLBACK)
  └─ contract v1.2 errata(进 ADR;A7 守恒不动 main body)
       ↓
Wave 3 — per-phase model tier schema (F5)
  ├─ workflows/<name>/phases.yaml schema 加 `model:` 必填
  ├─ 4 phase 默认表 + `--model-tier inherit` CLI flag override
  └─ agentFactory 读 phase.model → AgentDefinition.model
       ↓
Wave 4 — ralph-loop full integration 主流程 (F6)
  ├─ engine.route() spawn placeholder 替换为 SDK query()
  ├─ ralphLoopWrap callback 升级为 SDK 真实 spawn
  └─ verbatim COMPLETE 回流主流程验证
       ↓
Wave 5 — execute-task CLI + 30 sample 测试 (F7)
  ├─ src/cli/execute-task.ts(10th register fn)
  ├─ 4 phase chain orchestration(brainstorming → karpathy → mattpocock → TDD → ralph-loop)
  └─ 30 子任务 SAMPLES.md(沿袭 phase 1.4 R3 frozen)+ COMPLETE 100% 准确
       ↓
Wave 6 — ship (F8)
  ├─ CI 三平台全绿 + transparency gate ENFORCE=true 实测
  ├─ ADR errata accepted + adr-NN-accepted baseline tag(N 实占)
  ├─ ci.yml A7 iter 1-10 → 1-(N)
  └─ v0.2.0-alpha.2-execute-task 候选 milestone tag
```

**Wave 0 必须最先** — transparency gate flip 是 Phase 2.1 T1.7 W3 lock 解除,后续 wave CI 全凭 gate 通过运行。Wave 1 SDK spike GO 后才能 Wave 2-4 实装(否则 SDK 不可用)。Wave 5 依赖 Wave 2-4 全完成(SDK 真实 spawn + dual-signal + model tier + ralph-loop wrap)。

---

## § 3 Hard Constraints（不可违反）

1. **A7 守恒** — ADR 0001-0010 main body 0 diff;Phase 2.2 新 ADR 走 errata 路径(不动旧 ADR);ship 时 baseline tag 10 → 11(N 实占);ci.yml A7 step iter 1-10 → 1-N;`docs/AGENT-DEFINITION-FACTORY-CONTRACT.md` + `docs/INSTALLER-CONTRACT.md` main body 不动(contract v1.2 走 ADR errata inline)
2. **ADR 编号不预占**(intel § 0 SSOT 引用纪律,Phase 2.1 T1.9 CONTRIBUTING 项目级)— 本 phase 一切文档(KICKOFF/PATTERNS/RESEARCH/ASSUMPTIONS/PLAN/task_plan)写 "ADR errata(编号 plan-phase 实占)" 或 "ADR <实占N>",**不写 ADR 0011**(Phase 2.1 D-08 暂记 0011 仅参考);plan-phase Wave 7 ship 时 git mv / new file 决定实际编号
3. **TypeBox not zod** — schema 改动用 `@sinclair/typebox` `Type.*`;沿袭 Phase 2.1 ADR 0010 errata 注释块 fence 模式
4. **dual-signal completion**(D-02)— PRIMARY = SDK `outputFormat: { type: 'json_schema' }` `structured_output`;FALLBACK = `<promise>COMPLETE</promise>` `extractPromise`;不允许只用单一信号
5. **Karpathy simplicity 5 hard limit 严守**(继承 Phase 1.5)— `engine.ts` ≤200L / `agentDefinition.ts` ≤200L(H3 errata cap)/ `systemPrompt.ts` ≤80L / `ralphLoop.ts` ≤50L 主体(D1.4-3 + Phase 1.5.1 enforced)/ `promiseExtract.ts` ≤50L;新文件超 hard limit 必须 spillover to lib/
6. **不切换 ralph-wiggum 官方 plugin**(D-12)— `ralphLoopWrap` 自实装是永久架构;Phase 2.2 升级是接 SDK callback 不是替换 wrapper
7. **transparency 反模式根治**(F1)— W3 lock 解除是 phase 1.4 T1 + 1.5 H1/M1 连续 2 phase 复发后的结构性根治;Wave 0 必办,不可 deferred
8. **A8 LF line endings** — 所有新文件 LF;Win 测试需 Git Bash(`gitCloneWithSetup` 已实证 PATH_A+B 双 OK,新 SDK call 路径同样需 Win 兼容验证)

---

## § 4 Wave A 研究分工

research refresh(`v0.2.0-execute-task-ralph.md` HIGH conf)+ intel `omc-comparison.md` 第 4 条 已 cover 主决议(SDK 引入 / ralph-wiggum keep-vs-switch / dual-signal completion / per-phase model tier 建议表)。Wave A 聚焦 **剩余不确定**:

### R1 (gsd-pattern-mapper → PATTERNS.md)

9-ish 新/改文件 → existing analog mapping。重点:
- `src/cli/execute-task.ts`(new,10th register fn)→ analog: `src/cli/research.ts` 93L(phase 1.4 9th register fn,workflow E2E 实装模式)
- `engine.route()` 升级 SDK spawn → analog: 当前 `ralphLoopWrap` callback 接 stub spawn fn;Phase 2.2 替换为 SDK `query()`
- `agentFactory` contract v1.2 reconcile → analog: `agentDefinition.ts` 191L 14 字段(Phase 2.1 H3 errata 已 191L,本 phase 加 dual-signal completion 字段可能再增)
- `workflows/<name>/phases.yaml` schema → analog: `src/manifest/schema/spec.ts` TypeBox(Phase 2.1 加 `provides:` + `license_source` 模式),phases schema 可能是新 schema 文件 vs 折叠进 spec
- `--model-tier inherit` CLI flag → analog: `harnessed install --apply` flag pattern(commander.js)
- transparency 全史迁移 → analog: 无直接,但 marker 注入是 1-line per file 批量编辑
- freshness check 扩展 → analog: `scripts/check-transparency-verdicts.mjs` 当前 line-prefix marker scan + regex
- 7 lib helper(types/spawn/preflight/diff/confirm/backup/state)是否够用(Phase 2.1 PATTERNS § 5 已确认 6 method 全够,Phase 2.2 spawn 接 SDK 是新模式)

### R2 (gsd-phase-researcher → RESEARCH.md)

聚焦 3 项 fresh research(SDK + ralph-wiggum + model tier 主决议已 v0.2.0-SUMMARY 锁,不重做):

1. **SDK `outputFormat` + `agents`-map 组合可行性**(research § 4 flagged open question)— 单 sample spike 验 + 多 agent 场景 + degraded fallback path(若 `outputFormat` 与 `agents`-map 不兼容,structured_output 覆盖 main-agent turn,subagent completion 退到 `<promise>` grep)
2. **transparency 全史迁移策略**(F1 D-07b)— 扫现有 `.planning/**/PLAN-CHECK.md` + `*-AUDIT.md` + `VERIFICATION.md`,识别有/无 marker 行 + 缺哪些字段(`N/N` ratio / `miss:` 声明),给迁移清单(预估 10-20 文件 × 1-3 行 patch)+ 批量 migrate script 候选
3. **freshness check 具体形态**(F1 D-07c + reviewer item 21)— 候选 (a) 简单 grep README/PROJECT-SPEC 状态节是否含当前 ROADMAP latest-shipped phase 编号;(b) 结构化 `Status: <version>` marker 约定;(c) 静态分析 + cross-ref `STATE.md` 已完成节;评估各自 false-positive 风险 + 实装复杂度,推荐一项

**SDK 引入主决议已研究 valid**(research § 1-3 HIGH conf,2026-05-15 时点)— R2 不重做 SDK + ralph-wiggum + per-phase model tier 调研,只补 § 4 open question + Wave 0 工程实施细节

---

## § 5 预算

- **plan-phase**: ~2-3h(Wave A 并行 R1+R2 ~45min / Wave B planner ~60min / Wave C plan-checker ~30min — phase 2.2 task 数估 ~25-32 子任务,介于 phase 1.5 的 29 与 phase 2.1 的 23 之间)
- **execute-phase**: ~8-12 工作日(Wave 0 transparency 一次性根治 ~2d / Wave 1 SDK spike+引入 ~1d / Wave 2 contract v1.2 + dual-signal ~2d / Wave 3 model tier schema ~1d / Wave 4 ralph-loop full integration ~2d / Wave 5 execute-task CLI + 30 sample ~2d / Wave 6 ship ~1d)
- 沿袭 phase 1.5/2.1 batch 节奏(PP cadence — push + 并行 batch executor;期望 Wave 0/1 同 batch,Wave 2/3 同 batch,Wave 4/5 同 batch,Wave 6 final ship)

---

## § 6 phase 2.2 vs phase 2.3/2.4 边界

| 维度 | phase 2.2（本 phase） | phase 2.3 | phase 2.4 |
|------|----------------------|-----------|-----------|
| workflow | execute-task 主线 + ralph-loop full integration | design/content/testing extension category MVP + karpathy behavior-rule + CLAUDE.md merge | — |
| schema | phases.yaml + `model:` 必填 + contract v1.2 reconcile | — | — |
| ADR | 单 ADR 覆盖 Phase 2.2 全决策(编号实占) | — | — |
| SDK | INTRODUCE NOW + dual-signal completion | — | — |
| transparency | gate `ENFORCE=true` 一次性根治 + 全史迁移 + freshness ext | — | — |
| installer | 复用 Phase 2.1 6 method dispatch table | extension category install adapter 真实候选实装 | — |
| doctor | — | — | 完整版 jq/Git Bash 探测 + weekly cron + audit + ralph-loop Win 兼容 |
| checkpoint | execute-task 长链路 checkpoint 模板(handoff 四字段可用)| — | — |

---

**phase 2.2 KICKOFF complete** — Wave A(R1 PATTERNS + R2 RESEARCH 并行,带 anti-stall 约束)启动准备。
