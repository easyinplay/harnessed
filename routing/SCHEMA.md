# routing/ — B+C Routing Frontmatter SSOT (v0.1 placeholder spec)

> **决策来源**：[`PROJECT-SPEC.md` § 9](../PROJECT-SPEC.md)
> **机器消费 artifact**：**未实现**（v0.1 phase 1.1 仅文档化字段；JSON Schema artifact + 真实 routing/*.md 由 v0.1 phase 1.4 落地）
> **本文件定位**：B+C 混合路由方案的 yaml frontmatter 标准定义。B 层（skill description）与 C 层（hook script）共享**同一份 frontmatter** —— 改一处两层同步生效。

---

## 1. SSOT 模式（为什么 B 层 + C 层共享同一 frontmatter）

`routing/<topic>.md` 是一份普通 markdown，但 frontmatter 同时被两层消费：

| 层 | 读 frontmatter 哪块 | 干什么 |
|---|---|---|
| **B 层（skill description）** | `soft_hint.description_template` | 生成 skill 的 1 行描述，让 LLM 在 skill 路由时能读到"标准化、数据驱动的 UI 设计；优先于 frontend-design"这种 hint |
| **C 层（hook script）** | `trigger.keywords` + `trigger.file_globs` + `hard_route.*` | hook 在用户输入触发关键词或匹配文件 glob 时强制路由到 `hard_route.primary` skill；override 条件支持差异化 |

**好处**：
1. 改一处两层同步生效（避免双轨维护腐烂）
2. CI 校验 routing schema 合法性（v0.1 phase 1.4 起）
3. 用户读 markdown 部分学习路由逻辑；引擎读 frontmatter 自动决策
4. 跨 harness 时砍 `hard_route` 块即可，`soft_hint` 跨平台通用

---

## 2. 顶层结构

```yaml
---
trigger:                          # 触发条件
  keywords: [...]
  file_globs: [...]?
  contexts: [...]?

hard_route:                       # C 层 hook 读这块
  primary: <skill-name>
  secondary: <skill-name>?
  default: <skill-name>?
  override:                       # 条件覆盖
    condition: "<自然语言描述触发条件>"
    primary: <skill-name>
    secondary: <skill-name>?
  branches:                       # 多分支（mutex 决策）
    - condition: ...
      route: <skill-name>
      members: [...]?

soft_hint:                        # B 层 skill description 自动生成
  description_template: "<1-line hint, ≤ 500 char>"

fallback:
  on_hook_fail: <degrade_to_soft_hint|prompt_user>
  on_both_fail: <prompt_user|halt>
---

# 人类可读的路由说明（markdown 部分）
（详细规则、边界场景、历史决策……）
```

`additionalProperties: false`（v0.1 phase 1.4 落地）— 未声明字段被 reject。

---

## 3. trigger 字段表

| 字段 | 必填 | 类型 | 说明 |
|------|------|------|------|
| `keywords` | ✅ | string[] | 至少 1 个；C 层 hook 在用户输入子串匹配时触发；中英文混合（`[ui, ux, frontend, layout, design, 前端, 界面, 设计稿]`） |
| `file_globs` | optional | string[] | 仅当用户当前打开 / 修改这些 glob 文件时触发（`["**/*.tsx", "**/*.css"]`） |
| `contexts` | optional | string[] | 上下文标签（`design-review` / `pr-review` / `bug-fix` 等），由 workflow phase 写入 `.harnessed/context.json` |

至少要有 `keywords`；其他字段任选。所有 `keywords` / `file_globs` / `contexts` **OR** 关系（任一命中即触发）。

---

## 4. hard_route 字段表（C 层 hook 决策）

| 字段 | 必填 | 类型 | 说明 |
|---|---|---|---|
| `primary` | optional | string | 默认主路由 skill name |
| `secondary` | optional | string | 默认次路由（cooperative）skill name |
| `default` | optional | string | 无 override / branches 命中时的兜底（兼容性） |
| `override` | optional | object | 单一覆盖规则（见下） |
| `override.condition` | required if override | string | 自然语言条件（如 `"用户明确说'做出风格'/'独特设计'"`），hook 用 LLM 子调用判定 |
| `override.primary` | required if override | string | 覆盖后的主路由 |
| `override.secondary` | optional | string | 覆盖后的次路由 |
| `branches` | optional | object[] | 多分支决策（互斥，按顺序首个命中生效） |
| `branches[].condition` | required if branches | string | 分支条件 |
| `branches[].route` | required if branches | string | 该分支的 skill name |
| `branches[].members` | optional | string[] | 群体路由成员（如 code-review-team） |

**至少**要有 `primary` 或 `default` 或 `branches[0].route` 之一（保证至少有一个 fallback path）。

---

## 5. soft_hint 字段表（B 层 skill description 模板）

| 字段 | 必填 | 类型 | 说明 |
|---|---|---|---|
| `description_template` | ✅ | string | 1 行 hint，≤ 500 char；写入 skill 的 description metadata，让 LLM 在 skill 路由时读到 |

**好的 description 示例**：
- `"标准化、数据驱动的 UI 设计；优先于 frontend-design 用于布局/规范类任务"`
- `"通用 web 搜索（关键词、库文档、新闻）；性能、过滤器最丰富；默认选 Tavily"`

**不好的示例**：
- `"useful for UI"`（太泛）
- `"description here"`（占位）

---

## 6. fallback 字段表

| 字段 | 必填 | 类型 | 说明 |
|---|---|---|---|
| `on_hook_fail` | ✅ | enum | hook 异常 / 超时时行为：`degrade_to_soft_hint`（降级到 B 层）/ `prompt_user`（直接问用户） |
| `on_both_fail` | ✅ | enum | B+C 双双失败时行为：`prompt_user` / `halt`（中止当前任务） |

`degrade_to_soft_hint` 是默认推荐 — hook 失败时不卡用户；`halt` 仅用于安全敏感场景。

---

## 7. 完整示例（PROJECT-SPEC § 9 摘录）

```yaml
# routing/ui.md
---
trigger:
  keywords: [ui, ux, frontend, layout, design, 前端, 界面, 设计稿]
  file_globs: ["**/*.tsx", "**/*.vue", "**/*.css", "**/*.scss"]

hard_route:                       # C 层 hook 读这块
  primary: ui-ux-pro-max
  secondary: frontend-design
  override:
    condition: "用户明确说'做出风格'/'要风格'/'独特设计'"
    primary: frontend-design
    secondary: ui-ux-pro-max

soft_hint:                        # B 层 skill description 自动生成
  description_template: "标准化、数据驱动的 UI 设计；优先于 frontend-design 用于布局/规范类任务"

fallback:
  on_hook_fail: degrade_to_soft_hint     # hook 失败时降级回 B 层
  on_both_fail: prompt_user              # 都失败时直接问用户
---

# 路由说明
ui-ux-pro-max 主导（数据驱动、可解释），frontend-design 在剩余维度补充。冲突时 ui-ux-pro-max 优先。
**除非用户明确要求"做出风格"** —— 此时 frontend-design 主导。
```

---

## 8. v0.1 落地预告：routing/search.md（web 搜索路由）

依据用户全局 `CLAUDE.md` § "Web 搜索路由规则"，phase 1.4 将落地（示意，按 routing schema CI 校验）：

```yaml
# routing/search.md
---
trigger:
  keywords: [search, 搜索, 查文档, find, "网络上"]
  contexts: [research]

hard_route:
  primary: tavily-mcp                           # 默认 Tavily（关键词查询、库文档、新闻）
  branches:
    - condition: "描述式查询 / 学术论文 / 批量抓取多个 URL / 用户明说'研究'"
      route: exa-mcp                            # 神经搜索
    - condition: "抓整站 / 站点结构（crawl/map）"
      route: tavily-mcp
  override:
    condition: "用户拿不准时"
    primary: tavily-mcp
    secondary: exa-mcp                          # 并行打两边对比

soft_hint:
  description_template: "通用 web 搜索；关键词查询 / 站点抓取走 Tavily，描述式 / 学术 / 批量 URL 走 Exa"

fallback:
  on_hook_fail: degrade_to_soft_hint
  on_both_fail: prompt_user
---
```

---

## 9. 当前 status & 关联（v0.1 phase 1.1）

- ✅ 字段定义已锁定（本文件 + SPEC § 9）
- ❌ JSON Schema artifact / routing/*.md / validator 由 v0.1 phase 1.4 落地（TypeBox + Ajv 同 `src/manifest/schema/` 模式）；v0.3 验证 B+C 命中率 ≥ 85%

**关联**：
- 决策：`PROJECT-SPEC.md` § 9（B+C 混合方案 R4.1）
- B+C 角色映射：用户全局 `CLAUDE.md` § "Web 搜索路由规则" + § "UI/UX / 前端相关子任务"
- workflow 触发引用：`workflows/SCHEMA.md` § plan-feature reference（`02-brainstorm.conditional.if` 即来自 `routing/ui.md`）
- manifest 上游引用目标：`manifests/SCHEMA.md`（路由结果是 manifest name）
- ROADMAP 落地节奏：v0.1 phase 1.4 → routing schema + ≥ 1 份真实 routing/*.md
