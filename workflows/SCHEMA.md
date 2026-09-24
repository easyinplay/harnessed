# workflows/ — Phases Schema (v0.1 placeholder spec)

> **决策来源**：[`PROJECT-SPEC.md` § 10](../PROJECT-SPEC.md) + [`WORKFLOWS-MVP.md` Workflow 3](../WORKFLOWS-MVP.md)
> **机器消费 artifact**：**未实现**（v0.1 phase 1.1 仅文档化字段；JSON Schema artifact 由 v0.3 phase 1.4+ 落地，此时 workflows/*.yaml 才进 CI 校验循环）
> **本文件定位**：phases schema 的标准定义 + plan-feature reference 摘录。校验器实现先于 workflow yaml 落地（v0.3 ship `/harnessed:plan-feature` 时启用）。

---

## 1. workflow yaml 顶层结构

每个 workflow 是一份 `workflows/<name>/SKILL.md`，frontmatter 形如：

```yaml
---
name: <kebab-case>            # 必填，与目录名一致
namespace: /harnessed:<name>  # 必填，命令命名空间
phases:                       # 必填，至少 1 个 phase
  - id: 01-<name>
    layer: <governance|orchestration|execution>
    upstream: <manifest-name>
    invokes: [<command>, ...]
    inputs: [...]
    outputs: ...
    pause: <human_review|optional_human_review>?
    on_veto: <halt_workflow|rollback_to_phase_N>?
    conditional: {...}?
---

# Markdown body — 人类可读 workflow 描述
```

`additionalProperties: false`（v0.3 落地）— 未声明字段被 reject。

---

## 2. phases[*] 字段表

| 字段 | 必填 | 类型 | 说明 |
|------|------|------|------|
| `id` | ✅ | string | `^[0-9]{2}-[a-z][a-z0-9-]*$`（如 `01-gstack-decision`） |
| `layer` | ✅ | enum | `governance` / `orchestration` / `execution`（三层栈） |
| `upstream` | ✅ | string\|string[] | 依赖的上游 manifest 名（必须在 `manifests/` 中存在） |
| `invokes` | ✅ | string[] | 调用的具体命令 / skill（变量插值如 `{{gstack.command_prefix}}/office-hours`） |
| `inputs` | ✅ | string[] | 引用前阶段产出（`$NN.outputs` 语法） |
| `outputs` | ✅ | string\|string[] | 产出文件路径 |
| `pause` | optional | enum | `human_review` 阻塞等用户 approve；`optional_human_review` 默认放行可手动暂停 |
| `on_veto` | optional | enum | 用户拒绝时行为：`halt_workflow` / `rollback_to_phase_N` |
| `conditional` | optional | object | 条件触发（如 `{ if: ui_task_detected, then_also_invoke: [ui-ux-pro-max] }`），来自 `routing/*.md` |
| `on_demand_invoke` | optional | bool | 仅按需触发（默认 false） |
| `branch_on` | optional | string | 分支条件名 |
| `branches` | optional | object[] | 分支定义（v0.3+ 详化） |

**约束**：
- `phases` 至少 1 个 phase（minItems: 1）
- `id` 全局唯一（同一 workflow 内）
- `upstream` 引用必须解析到一个真实 manifest（CI 在 phases-resolver 阶段校验）

---

## 3. 三层栈语义（layer enum）

| layer | 角色 | 典型上游 | 干什么 |
|---|---|---|---|
| `governance` | 决策层 | gstack | CEO / Eng Manager / Designer / Paranoid Staff Engineer 等关卡审查 |
| `orchestration` | 项目经理 | GSD | discuss-phase / plan-phase / execute-phase / verify-phase 整体流程管理 |
| `execution` | 资深工程师 | superpowers / planning-with-files / mattpocock-skills / karpathy-skills | brainstorming / TDD / 持久化 / 子任务级动手 |

详细职责映射见用户全局 `CLAUDE.md` § "角色与框架定位"。

---

## 4. Reference implementation

v3 workflow yaml 示例（摘录自 `workflows/verify/paranoid/workflow.yaml`）。所有 v3 sub-workflow 套此范式。

```yaml
# workflows/verify/paranoid/workflow.yaml
schema_version: harnessed.workflow.v3
workflow: verify-paranoid
description: |
  Stage ④.c gstack /review Paranoid Staff Engineer 

disciplines_applied: [karpathy, output-style, language, operational, priority, protocols]
tools_available: [gstack-review]

phases:
  - id: 01-review
    name: gstack-review
    upstream: gstack
    capability: '{{ capabilities.gstack-review.cmd }}'
    model: opus
    gate: judgments.stage-routing.verify-paranoid-critical.fires
    max_iterations: '{{ defaults.ralph_max_iterations.verify-paranoid.01-review }}'
```

---

## 4b. capabilities.yaml 的 `by_host`（v16.0 Phase 65）

一个 capability 条目的 `impl` / `cmd` 可以按宿主取不同值。**顶层字段仍是权威值（Claude Code）**，
`by_host.<host>` 只替换它显式声明的字段：

```yaml
  agent-teams-send-message:
    impl: claude-platform
    cmd: SendMessage
    by_host:
      codex:
        impl: codex-platform
        cmd: send_input
```

设计约定：

- **顶层值一个字节都不能因为加 `by_host` 而改动** —— claude 侧的渲染产物有逐字节金标
  （`tests/fixtures/render-golden/`）锁着。
- `by_host` 是 optional，绝大多数 capability 不需要它。当前只有 Bucket 5 的三个
  agent-platform 条目使用。
- 宿主键是**具名**的（`claude` / `codex`）而非自由 record。写错宿主名在自由 record 下会
  静默永不命中、继续渲染 Claude 原语；具名 + `additionalProperties: false` 把这类拼写错误
  变成构建期错误。
- 读取一律经 `pickHostValues()`（`src/cli/lib/capabilityResolver.ts`），不要直接读 `by_host`。
  该函数默认 `claude`，所以任何未显式传宿主的既有调用点行为不变。
- schema 的 SSOT 在 `src/workflow/schema/capabilities.ts`；`scripts/check-workflow-schema.mjs`
  内是它的镜像，两处必须同步。

---

## 5. 收益（schema-driven 设计动机）

每 phase idempotent + 可单步重跑 + session 中断从最近 checkpoint 恢复 + `harnessed status` 可视化当前 phase。
schema 校验保证 `upstream` 引用在 manifests/ 真实存在（防"引用一个根本没装的上游"），保证 `inputs/$NN.outputs` 引用解析合法。

---

## 6. 当前 status（v3.9.16）

- ✅ 字段定义已锁定（本文件 + SPEC § 10）
- ✅ workflow yaml v3 schema 已实装 (`src/workflow/schema/workflow.ts`)
- ✅ 24 sub-workflow 已 SHIPPED (discuss/plan/task/verify stages)
- ✅ workflow validator 已实装 (TypeBox, `src/workflow/schema/`)
- ❌ JSON Schema artifact `schemas/workflow.v1.schema.json` **未生成** — deferred

任何字段语义冲突以本文件 + SPEC § 10 为准；机器层级冲突时（v3.0+）以 TypeBox schema 为准。

---

## 7. 关联

- **决策**：`PROJECT-SPEC.md` § 10（字段定义）+ `WORKFLOWS-MVP.md` Workflow 1-3（reference 实例）
- **三层栈职责**：用户全局 `CLAUDE.md` § "角色与框架定位"
- **路由 yaml frontmatter SSOT**：`routing/SCHEMA.md`（B+C 共享同一 frontmatter 块）
- **manifest 上游引用目标**：`manifests/SCHEMA.md`
- **ROADMAP 落地节奏**：v0.1 = `research` / v0.2 = `task` / v0.3 = `plan` / v3.0 = full stage-based workflow system
