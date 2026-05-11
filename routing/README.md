# routing/ — B+C 混合路由 SSOT

`routing/` 是 harnessed 的**路由元规则**——B 层（skill description 自动生成）+ C 层（UserPromptSubmit hook 硬路由）共享同一份 yaml frontmatter，避免双轨维护。

## 结构（v0.1 MVP）

- `search.md` — research workflow 路由（ctx7 / tavily / exa / parallel） — v0.1.0
- `ui.md` — UI/UX 任务路由（ui-ux-pro-max + frontend-design） — v0.3.0
- `testing.md` — 测试工具路由（playwright / vitest / webapp-testing） — v0.3.0
- `execute.md` — execute-task 内部路由（mattpocock 招式触发） — v0.2.0

## Schema

每个 routing 文件 yaml frontmatter 必须含 `trigger` / `hard_route` / `soft_hint` / `fallback` 四块（详见 `routing/SCHEMA.md`）。

JSON Schema 严格校验：
- 字段定义：`PROJECT-SPEC.md` v2.1 § 9
- 实现：`schemas/routing.v1.schema.json`（v0.1 phase 1.4）

## 透明度

每次路由决策**必须可见输出**（默认折叠，可展开）— 决策来源、备选方案、实际命令均显示给用户。详见 `WORKFLOWS-MVP.md` § 路由透明度设计。
