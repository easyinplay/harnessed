# workflows/ — Composition Skill 层（核心 IP）

`workflows/` 是 harnessed **80% 价值所在**。每个目录是一个 composition skill — 不写代码，只写"指挥棒"prompt 描述步骤，按 phases schema 编排上游。

## v0.1 MVP Workflows

- `research/` — 多源调研路由（Tavily / Exa / ctx7） — v0.1.0
- `execute-task/` — 子任务执行（superpowers + karpathy + mattpocock + ralph-loop） — v0.2.0
- `plan-feature/` — 三层栈编排（gstack + GSD + planning-with-files） — v0.3.0（**phases schema reference implementation**）

## Phases Schema

每个 workflow `SKILL.md` 的 frontmatter 必须符合 `workflows/SCHEMA.md` 定义的 phases schema（layer / upstream / invokes / inputs / outputs / pause / on_veto / conditional）。

详细字段定义见：

- `PROJECT-SPEC.md` v2.1 § 10（schema 标准定义）
- `WORKFLOWS-MVP.md` v2.1（每个 workflow 的具体 phases）
- `workflows/SCHEMA.md`（实现视图）

## 路由感知

每个 workflow 通过 `routing/*.md` SSOT 感知上下文（B+C 混合）。详见 `routing/README.md`。
