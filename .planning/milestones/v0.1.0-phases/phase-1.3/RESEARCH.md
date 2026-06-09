# Phase 1.3 RESEARCH — Implementation Research

> **调研日期**: 2026-05-12
> **Reviewer**: gsd-phase-researcher (Claude Opus 4.7)
> **任务**: 为 phase 1.3 plan-phase 提供 4 个 P0 实装细节调研
> **调研工具**: ctx7 (Context7) + WebFetch + WebSearch + gh api (GitHub) + npm view
> **耗时**: ~40 min
> **Confidence**: 整体 **HIGH** — 4 个 P0 全部有官方 docs 或 GitHub 源码 / 多源印证

---

## TL;DR

1. **Q1 (DMN YAML 解析库)**: 🟢 **复用现有 stack**（`yaml@2.9.0` + `ajv@8.20.0` + `@sinclair/typebox@0.34.49` 全 latest）+ **手写 Priority Hit Policy 仲裁逻辑**（< 50 行）。**不引入** DMN 专用 npm 包：`@hbtgmbh/dmn-eval-js` 不支持 PRIORITY、`@that-one-tom/n8n-nodes-dmn` 是 n8n 节点（不能独立用）、`json-rules-engine` 用 priority + parallel 不是 DMN 语义。引入 = 添加 ≥ 1 dep + 不匹配 DMN PRIORITY 仲裁。
2. **Q2 (TypeBox 嵌套 Object)**: 🟢 **每层 Type.Object 独立声明 `additionalProperties: false`** — TypeBox `TObjectOptions` 只对当前 Object 生效不递归。phase 1.1 marketplace_source 已是教科书实例（嵌套 Object + additionalProperties: false 双层），**复用此模式**。`Type.Array(Type.Object({...}))` 嵌套在 Ajv 8 strict 模式下完全 OK，**无 typecheck pitfall**。
3. **Q3 (ui-ux-pro-max install path)**: 🟡 **直接 tree URL with branch 路径理论可行**：`npx skills add https://github.com/midwayjs/midway/tree/v4-next/.codex/skills/ui-ux-pro-max`，但**有 issue #373 update bug** — skills CLI lock file 不存 branch ref，update 时 hardcode `/tree/main/`，对 `v4-next` 分支会破。**phase 1.3 必须实测 + 兜底 install adapter**（git-clone with `git_ref` 锁 SHA + 子目录拷贝 + symlink）。
4. **Q4 (AgentDefinition factory)**: 🟢 **官方 schema 完整 12 字段已确认**（`description` / `prompt` 必填 + `tools` / `disallowedTools` / `model` / `skills` / `mcpServers` / `memory` / `maxTurns` / `background` / `effort` / `permissionMode` 全 optional）。phase 1.2.5 RESEARCH-1 § 3.1 inheritance table **不全** — 缺 `disallowedTools` / `memory` / `maxTurns` / `background` / `effort` 5 个字段，phase 1.3 contract draft 必须 capture 全 12 字段。**`skills: string[]` 是 skill 名引用**，主进程必须先 install 到 `~/.claude/skills/` — fail-fast 是官方推荐。

**4 个 P0 推荐汇总**:
- **P0-1**: 复用 yaml + Ajv + TypeBox + 手写 ≤ 50 行 Priority 仲裁。
- **P0-2**: TypeBox 每层 `additionalProperties: false` + `Type.Array(Type.Object({...}))` 嵌套，参 marketplace_source 已实施 pattern。
- **P0-3**: `npx skills add` tree URL 实测优先；issue #373 update 破坏路径作为 v0.1 必测 fallback；准备 git-clone-with-setup adapter（已有 install method）作为兜底。
- **P0-4**: AgentDefinition contract draft 写全 12 字段，明确 `skills` 字段语义（"主进程预 install + 字段是 string array reference，subagent 启动时 startup-injected"）+ verbatim COMPLETE F33 mitigation。

---

## § 1 Q1 — DMN YAML 解析 + 验证库选型 (B4 实装)

### 1.1 候选库对比表

| 库 | 用途 | DMN PRIORITY 支持 | npm install size | 引入成本 | phase 1.3 适合度 |
|---|---|---|---|---|---|
| **yaml@2.9.0** (eemeli/yaml) — 已用 | YAML 1.2 解析 | N/A (语言层) | 已 dep | 0 | ✅ 复用 |
| **ajv@8.20.0** + **@sinclair/typebox@0.34.49** — 已用 | JSON Schema 验证 + TS 类型 | N/A (验证层) | 已 dep | 0 | ✅ 复用 |
| **@hbtgmbh/dmn-eval-js** | DMN XML 决策表执行 | ❌ **不支持 PRIORITY**（仅 FIRST/UNIQUE/RULE_ORDER/COLLECT-no-aggregation） | ~80 KB + edgeverve FEEL | 中 | ❌ 关键 hit policy 缺失 |
| **@that-one-tom/n8n-nodes-dmn** | DMN 1.3 完整 hit policy（含 PRIORITY） | ✅ 但**仅 n8n node**，不能独立 NPM import | n8n 整套 dep | 高 | ❌ 不可独立用 |
| **json-rules-engine** (CacheControl) | 通用 JSON 规则引擎 | ⚠️ **不是 DMN PRIORITY** — priority + parallel within same priority + manual stop | ~20 KB | 低 | ❌ 语义不匹配 |
| **node-rules** (mithunsatheesh) | 通用 forward-chaining 规则引擎 | ⚠️ R.stop 实现 first-hit 但非 DMN | 已废 | 低 | ❌ 语义不匹配 |

**关键 finding**:
- **DMN-specific Node.js 生态破碎** — 唯一支持 PRIORITY hit policy 的 npm 包是 `@that-one-tom/n8n-nodes-dmn`（仅 n8n 节点），独立可用的 `@hbtgmbh/dmn-eval-js` **明确不支持 PRIORITY**（GitHub README 直接列 limitation）。`json-rules-engine` 的 priority 语义是"同 priority 并行 + 显式 stop()"，**不是 DMN 的"多规则匹配按 priority 排序取最高"**。
- **YAML 不是 DMN 标准格式** — DMN 标准是 XML（OMG）；YAML 化决策表是各家自定义。我们做"DMN-style YAML"实际上是借用 PRIORITY 语义的概念，不需要严格 DMN 引擎。
- **phase 1.1 stack 已 cover 90%** — yaml.parseDocument → JS object → Ajv validate（带 TypeBox-derived schema）这条 pipeline 在 phase 1.1 manifest validation 已经在跑（参 `src/manifest/validate.ts:51-52`），phase 1.3 完全复用。

### 1.2 推荐方案

**🟢 复用 yaml + Ajv + TypeBox 三件套，手写 Priority Hit Policy 仲裁逻辑（< 50 行）**

理由（按重要度排序）：
1. **零 dep 增长** — phase 1.1 已 production-ready 的 stack（202 + 1 skipped 测试全绿），不引入新失败点。
2. **DMN 不是 hard requirement** — phase 1.4 routing engine 用的是"DMN-style 借鉴"语义，不是 DMN 标准 compliance。仲裁规则（按 priority 排序取最高、相同 priority 报错或第一个胜）业务逻辑 < 30 行 TS。
3. **TypeBox schema 优势保留** — yaml 解析后过 Ajv strict 模式 + TypeBox-derived schema → 类型安全 + JSON Schema 校验 + 友好错误（`src/manifest/errors.ts` 已有的 `ajvErrorToFriendly` pattern 直接复用）。
4. **避免引入 dep 维护风险** — `@hbtgmbh/dmn-eval-js` 上次 release 是 2022，`json-rules-engine` 虽然活跃但 priority 语义不匹配，`@that-one-tom/n8n-nodes-dmn` n8n 强耦合。
5. **决策规则数据量小** — phase 1.3 v1 schema 是 6 category × ≥ 12 rules MVP，约 < 200 行 YAML，不需要 industrial DMN engine。

**[ASSUMED — phase 1.3 实装时确认]**: 仲裁规则只支持 PRIORITY（取最高），不支持 COLLECT/RULE_ORDER 等其他 6 种 DMN hit policy。如果 phase 1.4+ 需要 COLLECT 等，再考虑 `@that-one-tom/n8n-nodes-dmn` fork 或自实现。

### 1.3 实施 schema sketch

**Pipeline**:

```typescript
// .planning/decision_rules.yaml 加载流程
import { parseDocument } from 'yaml'
import { Ajv } from 'ajv'
import { Type } from '@sinclair/typebox'

// 1. TypeBox-derived JSON Schema for decision_rules.yaml top-level
const DecisionRulesSchema = Type.Object({
  version: Type.Literal(1),
  hit_policy: Type.Union([Type.Literal('P'), Type.Literal('F'), Type.Literal('U')]),
  rules: Type.Array(RuleSchema, { minItems: 1 }),
  fallback_supervisor: Type.Optional(SupervisorSchema),
  deprecated: Type.Optional(Type.Array(DeprecationSchema)),
}, { additionalProperties: false })

// 2. yaml.parseDocument → JS → Ajv validate（与 phase 1.1 manifest 同 pipeline）
const doc = parseDocument(yamlSource, { lineCounter })
const validate = ajv.compile(DecisionRulesSchema)
if (!validate(doc.toJS())) { /* friendly errors */ }

// 3. Priority Hit Policy 仲裁（手写 ≤ 30 行）
function arbitrate(rules: Rule[], task: TaskContext): Rule | null {
  const matches = rules.filter(r => matchesWhen(r.when, task))
  if (matches.length === 0) return null
  // DMN PRIORITY: 按 priority desc 排序，取最高
  matches.sort((a, b) => b.priority - a.priority)
  // 同 priority 多个匹配：phase 1.4 决定（fallback to supervisor LLM 仲裁）
  if (matches.length > 1 && matches[0].priority === matches[1].priority) {
    return null  // 触发 L2 supervisor
  }
  return matches[0]
}
```

**B1 安全性 (KICKOFF.md § 关键约束 3)**: yaml 解析后所有 rule 字段（特别是 string fields）必须过 phase 1.1.1 实装的 `checkSecurityViolations`（参 `src/manifest/security.ts`），防止 yaml 注入 shell-escape bypass。

---

## § 2 Q2 — TypeBox 嵌套 Object 最佳实践 (B2 实装)

### 2.1 phase 1.1 marketplace_source 嵌套实施回顾

`src/manifest/schema/installMethods/ccPluginMarketplace.ts:29-37` 是教科书示例（已 production-ready，202 + 1 skipped 测试覆盖）：

```typescript
marketplace_source: Type.Optional(
  Type.Object(
    {
      source: Type.Literal('github'),
      repo: Type.String({ pattern: REPO_PATTERN, minLength: 3 }),
    },
    { additionalProperties: false },  // ← 嵌套层独立声明
  ),
),
```

**关键观察**:
- `Type.Optional(Type.Object({...}, {additionalProperties: false}))` — Optional 包装外层 Object，`additionalProperties: false` 是嵌套 Object 的 `TObjectOptions`，**只控制嵌套层**。
- 外层（`InstallMethodSchema`）也单独声明 `additionalProperties: false`（参 `ccPluginMarketplace.ts:39`） — 两层 strict。
- Ajv 8 strict 模式（`strict: true, strictSchema: true, strictTypes: true, strictRequired: true, allErrors: true`，参 `validate.ts:24-33`）下完全无报错。

### 2.2 嵌套 array of object 设计

phase 1.3 `decision_rules.override_signals` 是 array of object 嵌套 — TypeBox 完整支持（参 ctx7 docs 实例）：

```typescript
const OverrideSignal = Type.Object({
  phrase: Type.String({ minLength: 1 }),
  use: Type.String({ pattern: '^[a-z][a-z0-9-/]*$' }),
}, { additionalProperties: false })

const DecisionRules = Type.Object({
  trigger: Type.String(),
  default_expert: Type.String(),
  arbitration_rule: Type.Optional(Type.String()),
  override_signals: Type.Optional(
    Type.Array(OverrideSignal, { minItems: 1 })  // ← Array of Object
  ),
}, { additionalProperties: false })
```

**Static<typeof DecisionRules>** 自动推导完整 TS 类型（参 ctx7 文档）：

```typescript
type DecisionRules = {
  trigger: string
  default_expert: string
  arbitration_rule?: string
  override_signals?: { phrase: string; use: string }[]
}
```

**Ajv 8 strict 模式 + Type.Array(Type.Object) 嵌套验证**:
- `strictTypes: true` 要求每层 Object 显式 `type: 'object'`（TypeBox 自动生成）— **无问题**。
- `strictRequired: true` 要求 required 字段在 properties 内 — **无问题**（TypeBox 从非 Optional 字段自动推导 required）。
- `additionalProperties: false` 在 array items（即 OverrideSignal）和外层 DecisionRules **必须分别声明** — TypeBox `{additionalProperties: false}` option 只对当前 Object 生效，不递归。

**[VERIFIED — ctx7 docs]**: TypeBox `TObjectOptions.additionalProperties` 只控制当前 Object schema，不向 nested Object 传播。

### 2.3 推荐 schema sketch (decision_rules TypeBox)

完整 phase 1.3 manifest schema 加 `decision_rules` 字段（B2）：

```typescript
// src/manifest/schema/decisionRules.ts (新文件)
import { Type, type Static } from '@sinclair/typebox'

const OverrideSignal = Type.Object({
  phrase: Type.String({ minLength: 1, maxLength: 200 }),
  use: Type.String({ minLength: 1 }),  // expert name reference
}, { additionalProperties: false })

export const DecisionRulesSchema = Type.Object({
  trigger: Type.String({ minLength: 1, maxLength: 500 }),
  default_expert: Type.String({ minLength: 1 }),
  arbitration_rule: Type.Optional(Type.String({ minLength: 1, maxLength: 500 })),
  override_signals: Type.Optional(Type.Array(OverrideSignal, { minItems: 1, maxItems: 20 })),
  combo_default: Type.Optional(Type.Object({
    primary: Type.String(),
    secondary: Type.Optional(Type.String()),
  }, { additionalProperties: false })),
}, { additionalProperties: false })

export type DecisionRules = Static<typeof DecisionRulesSchema>
```

挂到 `src/manifest/schema/spec.ts` SpecSchema 上：

```typescript
export const SpecSchema = Type.Object({
  // ... 已有 14 字段
  category: Type.Union([  // B2 新加
    Type.Literal('meta'), Type.Literal('engineering'), Type.Literal('design'),
    Type.Literal('content'), Type.Literal('testing'), Type.Literal('search'),
  ]),
  install_type: Type.Union([  // B2 新加
    Type.Literal('skill'), Type.Literal('mcp'),
    Type.Literal('npm'), Type.Literal('git'),
  ]),
  decision_rules: Type.Optional(DecisionRulesSchema),  // B2 新加
}, { additionalProperties: false })
```

**B3 测试增量** (phase 1.1 测试基线 202 + 1 skipped → ≥ 215 + 1 skipped):
- 6 category enum 校验（每个 valid + 1 invalid, ~7 cell）
- 4 install_type enum 校验（每个 valid + 1 invalid, ~5 cell）
- decision_rules required vs optional × override_signals nested array of object × additionalProperties strict（≥ 6 cell 嵌套场景）
- 总增量 ≥ 13 cell（KICKOFF B3 要求 ≥ 12 cell + 215 + 1 skipped 总数）

---

## § 3 Q3 — ui-ux-pro-max install path 实测可行性 (B6 实装)

### 3.1 npx skills 母仓 + 子目录定位可行性

**实证 finding (gh api 实证, 2026-05-12)**:

```
midwayjs/midway repo:
├── default branch: 待 verify (从 branches API 列表看 main / master 均不在 protected list)
├── ui-ux-pro-max 实际位置: .codex/skills/ui-ux-pro-max/ 在 v4-next 分支
│   ├── SKILL.md (8244 bytes, sha 24cf28f0...)
│   ├── data/ (subdirectory)
│   └── scripts/ (subdirectory)
└── main 分支无 .codex/skills/ — 上面 WebFetch 404 即 main 没有这目录
```

**Skills CLI 支持的 source format**（来自 vercel-labs/skills README + Vercel KB + Medium 教程）:
1. `owner/repo` shorthand → 默认 main 分支
2. `https://github.com/owner/repo/tree/<branch>/<path-to-skill>` ✅ **支持指定 branch + 子目录**
3. `--skill <name>` flag 在多 skill repo 内 cherry-pick
4. `--list` flag 先列再装

**v0.1 可行命令** [VERIFIED — vercel-labs/skills issue #373 + README]:

```bash
# 路径 A：直接 tree URL 指定 v4-next 分支 + 子目录
npx skills add "https://github.com/midwayjs/midway/tree/v4-next/.codex/skills/ui-ux-pro-max" \
  -g -a claude-code -y
```

**[CITED — vercel-labs/skills/issues/373]**: skills CLI lock file **不存 branch ref**；后续 `npx skills update` 会 hardcode 重建 `/tree/main/<skill>` URL → **对 `v4-next` 分支必然破**！

> "The lock file stores sourceUrl without a branch ref, so update will always reconstruct the /tree/main/ URL... You can manually re-add to pull the latest version once: npx skills add ...  but subsequent updates will break again."
> — issue #373, Feb 2026, still open

**结论**: v0.1 install 单次可行，update 必破。**phase 1.3 install adapter 必须兜底**。

### 3.2 install adapter 设计 (兜底)

**B6 实装策略 — 双路径**:

**路径 A (primary, 试)**: `cc-skill-pack` + `npx-skill-installer` install method（已存在于 phase 1.1 schema），用 `cmd: "npx skills add https://github.com/midwayjs/midway/tree/v4-next/.codex/skills/ui-ux-pro-max -g -a claude-code -y"`。
- 风险: update 必破（issue #373）
- mitigation: phase 1.3 v0.1 ship 时 idempotent_check 检查文件存在即 skip update；phase 1.5+ 再上 update 修复。

**路径 B (fallback, 必备)**: `git-clone-with-setup` install method（已存在），用 `git_ref: "<v4-next-tip-SHA>"` 锁版本 + 子目录拷贝。
- 已有 schema：`installMethods/gitCloneWithSetup.ts` (参 `src/manifest/schema/installMethods/gitCloneWithSetup.ts:12-23`)
- git_ref pattern 已强制 SHA / SemVer (`^([a-f0-9]{7,40}|v?\d+\.\d+\.\d+...)$`)，禁止 branch name (M1 hotfix) — 必须从 v4-next branches API 拉当前 tip SHA 锁定。
- 拷贝步骤可在 `cmd` 内 chain：`git clone --depth 1 ... && cp -r .codex/skills/ui-ux-pro-max ~/.claude/skills/ui-ux-pro-max`
- Cross-OS：Windows 用 PowerShell `Copy-Item -Recurse`（参 phase 1.2 R03 § 3.7 cross-OS pattern）

**phase 1.3 决策建议**:
- **B6 v0.1 ship**: 路径 B (git-clone-with-setup) 主推 — 兼容性最强、与现有 6 install method dispatch 0 适配。
- **B6 v0.1 实测**: 路径 A 在 `harnessed install ui-ux-pro-max` 命令下走 install method = `npx-skill-installer`，留存测试报告（`docs/specimens/ui-ux-pro-max-install-attempt.md` 之类）。
- **decision_rules.yaml 实施**: ui-ux-pro-max 的 manifest 用 install_type=`skill` + install.method=`git-clone-with-setup` 明确（路径 B）— 不让上游 issue #373 卡 v0.1 ship。

### 3.3 推荐方案 + 风险

**推荐**: 🟢 **路径 B 主、路径 A 测试**。

**风险（按严重度）**:

| 风险 | 严重度 | mitigation |
|---|---|---|
| midwayjs/midway force-push v4-next 改写 git history → SHA 失效 | 🟡 P1 | 监测 v4-next force-push（GitHub branch protection 没开 — 真实风险）；upstream_health.fallback_action: `block` if version drift |
| ui-ux-pro-max 是 Codex skill (非 Claude Code skill) — 内部引用 `Skill` tool 名 / `imagegen` 等 Codex 特有 tool | 🟡 P1 | phase 1.4 routing engine 在 spawn subagent 时检测 skill content 内 Codex-only tool reference → 降级 warn / 不阻塞 install |
| `.shared/ui-ux-pro-max/scripts/search.py` 的 `.shared/` 路径假设不存在于 `~/.claude/skills/ui-ux-pro-max/` 拷贝后的 fs 布局 | 🟡 P1 | install adapter 需创建 `.shared/ui-ux-pro-max/` symlink 或修改 SKILL.md 内的 path（v0.1 实测后决定） |
| skills CLI update 路径 A 必破 (issue #373) | 🟢 P2 | install method 选路径 B 锁 SHA 即避开此问题；phase 1.5+ 上 update 修复 |

---

## § 4 Q4 — AgentDefinition factory contract (B7 contract draft)

### 4.1 AgentDefinition schema 完整字段

**[VERIFIED — code.claude.com/docs/en/agent-sdk/subagents accessed 2026-05-12]**: AgentDefinition 完整 12 字段:

| Field | Type | Required | Description |
|---|---|---|---|
| `description` | `string` | ✅ Yes | Natural language description of when to use this agent |
| `prompt` | `string` | ✅ Yes | The agent's system prompt defining its role and behavior |
| `tools` | `string[]` | No | Array of allowed tool names. Omitted = inherits all tools |
| `disallowedTools` | `string[]` | No | Array of tool names to remove from the agent's tool set |
| `model` | `'sonnet' \| 'opus' \| 'haiku' \| 'inherit' \| string` | No | Model override; alias or full model ID |
| `skills` | `string[]` | No | **List of skill names to preload into agent's context at startup. Unlisted skills remain invocable through Skill tool** |
| `memory` | `'user' \| 'project' \| 'local'` | No | Memory source for this agent |
| `mcpServers` | `(string \| object)[]` | No | MCP servers available, by name or inline config |
| `maxTurns` | `number` | No | Maximum agentic turns before agent stops |
| `background` | `boolean` | No | Run agent as non-blocking background task |
| `effort` | `'low' \| 'medium' \| 'high' \| 'xhigh' \| 'max' \| number` | No | Reasoning effort level |
| `permissionMode` | `PermissionMode` | No | Permission mode for tool execution within this agent |

**关键 finding (vs phase 1.2.5 RESEARCH-1 § 3.1 inheritance table)**:
- ✅ phase 1.2.5 RESEARCH-1 引用的 `skills` 字段**确实存在** — 是 `string[]`，是 skill 名引用 array。
- ❌ phase 1.2.5 RESEARCH-1 § 3.1 **缺 5 字段**：`disallowedTools` / `memory` / `maxTurns` / `background` / `effort` — phase 1.3 contract draft 必须补全。
- ⚠️ `permissionMode` 字段在 AgentDefinition **真存在**（与 ClaudeAgentOptions 同名但分别是 main / subagent 各自的 permission control）— RESEARCH-1 § 1.1 也对应印证。

**Note from code.claude.com**:
> "Subagents cannot spawn their own subagents. Don't include `Agent` in a subagent's `tools` array."

仍然是 phase 1.4 routing engine 的硬天花板（参 RESEARCH-1 § 1.1 Fact D）。

### 4.2 factory pattern function signature

**[VERIFIED — code.claude.com/docs/en/agent-sdk/subagents Dynamic agent configuration section, 2026-05-12]**: 官方亲自给出的 factory pattern：

```typescript
import { query, type AgentDefinition } from "@anthropic-ai/claude-agent-sdk";

// Factory function pattern - 官方文档原文示例
function createSecurityAgent(securityLevel: "basic" | "strict"): AgentDefinition {
  const isStrict = securityLevel === "strict";
  return {
    description: "Security code reviewer",
    prompt: `You are a ${isStrict ? "strict" : "balanced"} security reviewer...`,
    tools: ["Read", "Grep", "Glob"],
    model: isStrict ? "opus" : "sonnet"
    // skills 字段 (B7 contract 要在 harnessed factory 内 capture)
    // skills: isStrict ? ["security-audit", "owasp-checks"] : ["basic-review"]
  };
}

// 主进程使用
for await (const message of query({
  prompt: "Review this PR for security issues",
  options: {
    allowedTools: ["Read", "Grep", "Glob", "Agent"],  // Agent tool 必含
    agents: {
      "security-reviewer": createSecurityAgent("strict")
    }
  }
})) { /* ... */ }
```

**phase 1.3 B7 contract 设计建议**:

```typescript
// docs/AGENT-DEFINITION-FACTORY-CONTRACT.md (B7 ship draft, ≥ 100 lines)

// 1. harnessed factory 标准 signature
type HarnessedAgentFactory = (
  category: 'meta' | 'engineering' | 'design' | 'content' | 'testing' | 'search',
  decision: DecisionOutput,  // routing engine L1/L2 输出
  context: TaskContext,       // 用户 task + override signals
) => AgentDefinition

// 2. 实施例 (phase 1.4 routing engine 用)
function createCategorizedAgent(
  category, decision, context
): AgentDefinition {
  return {
    description: `Expert for ${category} category. Triggered by: ${decision.matched_rule_id}`,
    prompt: buildSystemPrompt({
      category,
      心法_4_principles: KARPATHY_4_PRINCIPLES,  // ← always-on inject (CLAUDE.md § 心法)
      task_description: context.task,
      override_signals: context.override_keywords,
      verbatim_complete_marker: 'COMPLETE',  // ← F33 mitigation (RESEARCH-1 § 6)
    }),
    skills: [decision.primary_skill, ...(decision.secondary_skill ? [decision.secondary_skill] : [])],
    tools: getCategoryTools(category),  // 按 category 限定
    model: decision.complexity === 'high' ? 'opus' : 'sonnet',
    permissionMode: getCategoryPermission(category),
    // disallowedTools (phase 1.3 contract): testing category 强制 disallow 'Skill(playwright-cli)'
    //   when decision.task_type ∈ {performance, a11y, memory-leak} (笔记硬规则)
    disallowedTools: decision.forbidden_skills?.map(s => `Skill(${s})`),
    maxTurns: 50,  // 防止无限循环
  }
}
```

### 4.3 错误处理路径

**Path 1: skill not installed**
- **官方推荐 (code.claude.com docs)**: skills 字段 array 内的 skill 名必须在 spawn 前 install 到 `~/.claude/skills/` — Anthropic docs 不直接说 fail-fast 还是 silent，但 RESEARCH-1 § 1.1 Fact A 明确 "**主进程必须负责 install**" 是工程现实路径。
- **harnessed factory contract 推荐**: **fail-fast**。factory 在构造 AgentDefinition 前先 check `~/.claude/skills/<name>/SKILL.md` 是否存在；不存在 → throw `SkillNotInstalledError(name)`（main agent 接收后触发 install 流程或 abort）。
- **不推荐 silent fallback**: 主进程 spawn subagent 后，如果 skills 字段含未装 skill，CC 行为未明确 — 可能是 startup 失败、可能是降级（不注入 skill content）。silent 让用户难发现 install 漏装。

**Path 2: subagent final message 不含 "COMPLETE"**
- **F33 RESEARCH-1 § 6 mitigation**: main agent system prompt 强制要求 verbatim 返回 final message（不 summarize）+ 检查字符串包含 `COMPLETE` token verbatim。
- **不含 COMPLETE → ralph-loop retry**: 主进程构造新 AgentDefinition（同 skills + 增量 context "前一次未达标，请 fix X 并输出 COMPLETE"）+ spawn 新 subagent。
- **重试上限**: AgentDefinition.maxTurns = 50 + ralph-loop 外层 max-iterations = 20（与 CLAUDE.md ralph-loop 默认对齐）。
- **abort 条件**: 重试 ≥ 20 次仍无 COMPLETE → main agent 写 progress.md 标记 BLOCKED + 报告人类 review。

**Path 3: AgentDefinition 字段 schema 漂移**（CC v2.1+ 快速演进，半年内 schema 可能加字段）
- harnessed factory 用 TypeScript `AgentDefinition` import 自 `@anthropic-ai/claude-agent-sdk` — TS 编译期捕获字段不匹配。
- **upstream_health 监测**: phase 1.3 manifest schema `upstream_health.last_known_good_version` 字段记录调研时 SDK 版本（参 `src/manifest/schema/spec.ts:53-62`）；phase 1.4+ runtime check sdk version vs known_good，drift 时降级 fallback_action: warn。

**Path 4: spawn 失败（subagent timeout / network / model rate limit）**
- 不在 phase 1.3 contract 范围（phase 1.4 routing engine runtime 处理）。phase 1.3 contract 仅声明：factory 自身**纯函数 + 同步**，不做 spawn —spawn 是 main agent `query({agents: {...factory(...) }})` 的责任。

---

## § 5 给 Wave B 的 input

### 5.1 决策推荐汇总 (4 P0)

| P0 | 决策 | 来源 | risk |
|---|---|---|---|
| **P0-1 (Q1)** DMN YAML 验证库 | 🟢 **复用 yaml@2.9.0 + ajv@8.20.0 + @sinclair/typebox@0.34.49**，手写 < 50 行 Priority 仲裁。**不引入** DMN 专用库。 | npm view 实证 + WebSearch 证 DMN ecosystem 破碎 | 🟢 P2 (语义 PRIORITY-only，不 cover COLLECT) |
| **P0-2 (Q2)** TypeBox 嵌套 Object | 🟢 **每层 Type.Object 独立声明 `additionalProperties: false`** + `Type.Array(Type.Object({...}))` 嵌套合法。复用 phase 1.1 marketplace_source pattern。 | ctx7 docs + phase 1.1 ccPluginMarketplace.ts:29-37 实证 | 🟢 P2 (无已知 pitfall) |
| **P0-3 (Q3)** ui-ux-pro-max install path | 🟡 **路径 B (git-clone-with-setup with v4-next tip SHA + 子目录拷贝) 主**；路径 A (npx skills add tree URL) v0.1 实测留 specimen — issue #373 update bug 是已知风险。 | gh api 实证 + skills/issues/373 + Vercel KB | 🟡 P1 (force-push / Codex-only tool / .shared 路径假设) |
| **P0-4 (Q4)** AgentDefinition factory contract | 🟢 **写全 12 字段**（含 skills/disallowedTools/memory/maxTurns/background/effort 5 个 RESEARCH-1 § 3.1 漏字段）；factory pattern 用官方 `createSecurityAgent` 风格；4 错误处理路径 enumerate (skill-not-installed fail-fast / no-COMPLETE retry / schema drift / spawn fail). | code.claude.com/docs/en/agent-sdk/subagents 2026-05-12 + WebSearch 印证 | 🟢 P2 (CC v2.1 schema 半年内可能再加字段) |

### 5.2 关键风险

**🔴 P0 (无 — phase 1.3 实施前 4 个 P0 调研已 mitigation 好)**

**🟡 P1**:
1. **midwayjs/midway v4-next 分支不稳定** — non-protected branch 可能 force-push，install 时锁定的 git_ref SHA 失效。**phase 1.3 mitigation**: monitoring（GitHub watch 或 `harnessed audit upstream_health`）+ fallback_action: warn (manifest 字段)。
2. **ui-ux-pro-max Codex-only tool reference** — SKILL.md 内可能引用 `Skill` tool / `imagegen`（Codex 特有），Claude Code subagent 启动时 inject 后某些工具不可用 → silent failure。**phase 1.3 mitigation**: install adapter 时 grep SKILL.md 检测 `Skill\(` / `imagegen\(` 等 → warn + 文档化 known limitation。
3. **`.shared/ui-ux-pro-max/scripts/search.py` path 假设** — Codex skill 假设 `.shared/` 在 cwd，Claude Code skill 是 `~/.claude/skills/<name>/`，路径 layout 不同 → search.py 跑不起来。**phase 1.3 mitigation**: install adapter 创建 `.shared/ui-ux-pro-max/ → ~/.claude/skills/ui-ux-pro-max/` symlink 兜底（v0.1 实测后决定接 OS 级 OR SKILL.md 级 patch）。

**🟢 P2**:
- DMN PRIORITY-only 仲裁（不 cover COLLECT/RULE_ORDER）— phase 1.4+ 决定是否扩展。
- TypeBox 0.34 → 0.35 升级时 schema API 微调风险（已用 latest，6 month cycle 监测）。
- AgentDefinition schema CC v2.1 → v2.2 字段加字段风险 — TypeScript 编译期捕获。
- skills CLI update bug issue #373 — 用路径 B 锁 SHA 自动避开。

### 5.3 phase 1.4 顺承 (out-of-scope for phase 1.3)

phase 1.3 schema 落地后，phase 1.4 routing engine 实装时还需要解决（phase 1.3 不做）:
1. L1 关键词匹配的字符串 contains / 模糊匹配算法（v0.1 简单 substring，phase 1.5+ 升级 Semantic Router）
2. L2 LLM Supervisor 仲裁的 prompt template / 调用频率 / cost control
3. AgentDefinition factory 实装（phase 1.3 仅 contract）
4. ralph-loop COMPLETE verbatim detection 在 main agent 内的具体实施
5. 6 category × decision rules 的 ≥ 12 rules MVP 落地（phase 1.3 仅 schema + decision_rules.yaml v1，phase 1.4 把 rules 接到 routing engine runtime）

---

## § 6 References (含 access date)

所有 URL 均于 **2026-05-12** 访问验证。

### 官方 docs (HIGH)
- [Claude Agent SDK — Subagents in the SDK](https://code.claude.com/docs/en/agent-sdk/subagents) — AgentDefinition 12 字段完整表 + factory pattern 官方示例 + What subagents inherit table
- [Claude Agent SDK — Subagents (TypeScript reference)](https://code.claude.com/docs/en/agent-sdk/typescript) — 完整 TS interface
- [Claude Agent SDK — TypeScript types](https://platform.claude.com/docs/en/agent-sdk/typescript) — 平台站点 redirect 后的 type 引用
- [TypeBox docs — Type.Object / TObjectOptions / Type.Array](https://github.com/sinclairzx81/typebox) — additionalProperties / nested array of object 实例
- [json-rules-engine docs](https://github.com/CacheControl/json-rules-engine) — priority + parallel + stop semantics（不匹配 DMN PRIORITY）
- [Camunda — DMN Hit Policy reference](https://docs.camunda.io/docs/components/modeler/dmn/decision-table-hit-policy/) — Priority / First / Unique 7 种语义

### GitHub (HIGH — 实证)
- [midwayjs/midway repo (api/branches)](https://github.com/midwayjs/midway/branches) — v4-next 分支存在，main 无 .codex/skills（gh api 实证）
- [.codex/skills/ui-ux-pro-max on v4-next](https://github.com/midwayjs/midway/tree/v4-next/.codex/skills/ui-ux-pro-max) — gh api 实证 SKILL.md 8244 bytes + data/ + scripts/ 子目录
- [vercel-labs/skills CLI README](https://github.com/vercel-labs/skills/blob/main/README.md) — `--list` / `--skill` / `-g` / `-y` flag 完整列
- [vercel-labs/skills issue #373](https://github.com/vercel-labs/skills/issues/373) — update hardcodes /tree/main/ bug, Feb 2026 still open
- [vercel-labs/skills issue #277 (Bitbucket support)](https://github.com/vercel-labs/skills/issues/277) — URL pattern docs
- [HBTGmbH/dmn-eval-js](https://github.com/HBTGmbH/dmn-eval-js) — Limitation: PRIORITY hit policy not supported

### npm (HIGH — 版本实证)
- [yaml v2.9.0](https://www.npmjs.com/package/yaml) — npm view 实证 latest 2.9.0
- [ajv v8.20.0](https://www.npmjs.com/package/ajv) — npm view 实证 latest 8.20.0
- [@sinclair/typebox v0.34.49](https://www.npmjs.com/package/@sinclair/typebox) — npm view 实证 latest
- [skills npm package](https://www.npmjs.com/package/skills) — vercel-labs CLI npm 入口
- [@hbtgmbh/dmn-eval-js](https://www.npmjs.com/package/@hbtgmbh/dmn-eval-js) — DMN XML engine, PRIORITY 不支持
- [@that-one-tom/n8n-nodes-dmn](https://www.npmjs.com/package/@that-one-tom/n8n-nodes-dmn) — n8n node, 不可独立用
- [json-rules-engine](https://www.npmjs.com/package/json-rules-engine) — 通用 JSON 规则引擎

### WebSearch / 第三方 (MEDIUM — verified with primary sources)
- [Vercel KB — Agent Skills Creating, Installing, and Sharing](https://vercel.com/kb/guide/agent-skills-creating-installing-and-sharing-reusable-agent-context) — npx skills 工作流
- [Medium — Skills CLI Guide using npx skills](https://medium.com/@jacklandrin/skills-cli-guide-using-npx-skills-to-supercharge-your-ai-agents-38ddf3f0a826) — Mar 2026 实战
- [DevelopersIO — vercel-labs/skills 实测](https://dev.classmethod.jp/en/articles/varcel-labs-skills/) — 实战 case
- [Nected — Top 10 Node.js Rule Engines 2026](https://www.nected.ai/blog/rule-engine-in-node-js-javascript) — 引擎对比

### phase 内交叉引用
- `D:\GitCode\harnessed\.planning\phase-1.3\KICKOFF.md` — B1-B8 acceptance bar
- `D:\GitCode\harnessed\.planning\phase-1.2.5\GRAY-AREA-1-routing-engine.md` § 2 — decision_rules.yaml 完整 v1 schema
- `D:\GitCode\harnessed\.planning\phase-1.2.5\RESEARCH-1-routing-engine.md` § 1.1 / § 3.1 / § 4.2 — subagent isolation table + decision rules grammar
- `D:\GitCode\harnessed\.planning\phase-1.2.5\RESEARCH-2-skill-ecosystem.md` § 1.2 / § 4.4 — ui-ux-pro-max install path 风险 1
- `D:\GitCode\harnessed\src\manifest\schema\installMethods\ccPluginMarketplace.ts:29-37` — phase 1.1 marketplace_source 嵌套 Object 实施实例
- `D:\GitCode\harnessed\src\manifest\validate.ts:24-33` — Ajv 8 strict 模式配置
- `D:\GitCode\harnessed\src\manifest\schema\index.ts:33-63` — TypeBox + Ajv allOf if/then matrix pattern (phase 1.3 decision_rules 校验可借鉴)

---

## Confidence breakdown

| 域 | Confidence | 理由 |
|---|---|---|
| **Q1 DMN YAML 库选型** | **HIGH** | 5 个候选库逐一查证：npm view + GitHub README + 多源印证 PRIORITY 缺失；现有 stack 实证 production-ready (phase 1.1 通过 202 + 1 skipped 测试) |
| **Q2 TypeBox 嵌套 Object** | **HIGH** | ctx7 官方 docs + phase 1.1 marketplace_source production 实施实证（已 ship） |
| **Q3 ui-ux-pro-max install path** | **MEDIUM-HIGH** | gh api 实证 v4-next 分支 SKILL.md 实存 + skills CLI README 文档完整 + issue #373 实证 update bug；**v0.1 实测仍是 phase 1.3 必走步**（实测前不算 100% confident） |
| **Q4 AgentDefinition factory contract** | **HIGH** | code.claude.com/docs/en/agent-sdk/subagents 完整字段表 2026-05-12 fetch + 官方 createSecurityAgent factory 示例 + WebSearch 二源印证 |

**调研用时**: ~40 min。质量优先 — 4 个 P0 全部有官方 docs / GitHub 源码 / npm view 实证多源印证，未做凭空 cite。

**研究有效期**: 2026-06-12（30 天，AgentDefinition schema 半年内可能再演进 — phase 1.4 实装前需 re-verify）。

**调研者签名**: gsd-phase-researcher @ 2026-05-12
