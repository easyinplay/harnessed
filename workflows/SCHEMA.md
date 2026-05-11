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

## 4. plan-feature reference implementation

完整 5-phase 示例（摘录自 `WORKFLOWS-MVP.md` Workflow 3 + `PROJECT-SPEC.md` § 10）。所有其他 workflow 套此范式。

```yaml
# workflows/plan-feature/SKILL.md
---
name: plan-feature
namespace: /harnessed:plan-feature
phases:
  - id: 01-gstack-decision
    layer: governance
    upstream: gstack
    invokes: [/office-hours, /plan-ceo-review, /plan-eng-review]
    inputs: [user_request]
    outputs: .harnessed/checkpoints/01-decision.md
    pause: human_review
    on_veto: halt_workflow

  - id: 02-brainstorm
    layer: execution
    upstream: superpowers
    invokes: [brainstorming]
    inputs: [user_request, $01.outputs]
    outputs: .harnessed/checkpoints/02-design-memo.md
    conditional:
      if: ui_task_detected            # 来自 routing/ui.md
      then_also_invoke: [ui-ux-pro-max]

  - id: 03-gsd-discuss
    layer: orchestration
    upstream: GSD
    invokes: [/gsd-discuss-phase]
    inputs: [$01.outputs, $02.outputs]
    outputs: gsd_phase_doc

  - id: 04-gsd-plan
    layer: orchestration
    upstream: GSD
    invokes: [/gsd-plan-phase]
    inputs: [$03.outputs]
    outputs: [PLAN.md, ROADMAP.md, REQUIREMENTS.md]

  - id: 05-persist
    layer: execution
    upstream: planning-with-files
    inputs: [$04.outputs]
    outputs: [task_plan.md, progress.md, findings.md]
    pause: human_review
---
```

**关键设计点**（决策已敲定，见 WORKFLOWS-MVP § Workflow 3）：

- gstack 命令前缀通过变量插值 `{{gstack.command_prefix}}/office-hours`，**禁止硬编码** — `harnessed doctor` 探测 plugin 化路径与 git-clone-with-setup 路径，写 `.harnessed/config.json` 供 workflow 引擎读取
- `01` 阶段 veto → `halt_workflow`，不自动回滚；用户决定是否重新构思
- `02` 阶段 UI 任务识别完全走 `routing/ui.md` 的 `trigger.keywords` + `file_globs` 规则（B+C 混合）
- `pause: human_review` 强制 checkpoint compact —— 写 `.harnessed/checkpoints/<id>.md`（≤ 1k token），原文留 `.harnessed/archive/<id>-full.md` 不进后续 context（PROJECT-SPEC § 12）

---

## 5. 收益（schema-driven 设计动机）

每 phase idempotent + 可单步重跑 + session 中断从最近 checkpoint 恢复 + `harnessed status` 可视化当前 phase。
schema 校验保证 `upstream` 引用在 manifests/ 真实存在（防"引用一个根本没装的上游"），保证 `inputs/$NN.outputs` 引用解析合法。

---

## 6. 当前 status（v0.1 phase 1.1）

- ✅ 字段定义已锁定（本文件 + SPEC § 10）
- ❌ JSON Schema artifact `schemas/workflow.v1.schema.json` **未生成** — 由 v0.3 phase 1.4+ 配 plan-feature 落地时一并实装
- ❌ workflow yaml fixtures **未起草** — v0.1 phase 1.4 起草 `research`，v0.2 phase 起草 `execute-task`，v0.3 phase 起草 `plan-feature`
- ❌ workflow validator **未实装** — TypeBox + Ajv 同样模式（参考 `src/manifest/schema/`），落入 `src/workflow/schema.ts` + `src/workflow/validate.ts`

任何字段语义冲突以本文件 + SPEC § 10 为准；机器层级冲突时（v0.3+）以 `schemas/workflow.v1.schema.json` 为准。

---

## 7. 关联

- **决策**：`PROJECT-SPEC.md` § 10（字段定义）+ `WORKFLOWS-MVP.md` Workflow 1-3（reference 实例）
- **三层栈职责**：用户全局 `CLAUDE.md` § "角色与框架定位"
- **路由 yaml frontmatter SSOT**：`routing/SCHEMA.md`（B+C 共享同一 frontmatter 块）
- **manifest 上游引用目标**：`manifests/SCHEMA.md`
- **ROADMAP 落地节奏**：v0.1 = `research` workflow / v0.2 = `execute-task` / v0.3 = `plan-feature`（reference）
