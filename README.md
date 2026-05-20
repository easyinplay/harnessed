# harnessed

> AI coding harness 包管理器 + composition orchestrator
> 把 CLAUDE.md 三层栈协作规则机器化为可执行 engine

[![npm](https://img.shields.io/npm/v/harnessed?label=npm&color=blue)](https://npmjs.com/package/harnessed)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](./LICENSE)
[![Sponsor](https://img.shields.io/github/sponsors/easyinplay?logo=github&label=Sponsor)](https://github.com/sponsors/easyinplay)

> Not affiliated with, endorsed by, or sponsored by Harness Inc. (见 [NOTICE](./NOTICE))

---

## ✨ 一句话定位

装配市面上最优秀的开源 Claude Code 生态组件,用强意见 composition skill 织成统一工作流;不 vendor 上游代码,通过 manifest 描述 install/check + composition skill 编排多上游协作。

---

## 🎯 关键差异化

- **三层栈机器化** — `gstack 决策` + `GSD 项目经理` + `superpowers 资深工程师` + `karpathy 4 心法` + `mattpocock 23 招式`,5 支柱 100% capture
- **不 vendor 上游** — manifest describe install/check;上游升级用户 re-install 即获最新版
- **Composition Skill** — 自家 workflow skill 当指挥棒,调度多个上游协同 (v2.0: 4 workflows 完整 4-stage 机器化 — `research` 多源调研 + `plan-feature` 5-phase 三层栈 + `execute-task` ralph-loop completion + `verify-work` 9-phase Pattern C 4-specialist)
- **包管理器思维** — install dependency graph 自动解析, doctor 健康检查, install-base 一键装齐
- **统一入口** — 用户面对 `/plan-feature` / `/execute-task` 等 slash command,不需学每家上游术语

---

## 📦 快速安装

```bash
npm install -g harnessed
```

或不全局安装 (ephemeral 模式):

```bash
npx harnessed@latest <command>
```

---

## 🚩 命令一览

### 主命令

| 命令 | 说明 |
| ---- | ---- |
| `harnessed setup` | 一次性 setup,装 workflow skills 到 `~/.claude/skills/` |
| `harnessed install <name>` | 装上游 manifest (默认 dry-run) |
| `harnessed uninstall <name>` | 反向卸载 (默认 dry-run) |
| `harnessed audit-log` | 路由透明日志 query (支持 `--filter` jq 表达式) |
| `harnessed status` | 当前 phase + lock holder |
| `harnessed resume` | session 中断后恢复至最近 checkpoint |
| `harnessed doctor` | 8-check 健康检查 (Node / MCP / jq / Win bash / 路由 / token budget 等) |
| `harnessed backup` | snapshot 备份管理 |
| `harnessed rollback <timestamp>` | 一行回滚 (EOL preserve + sha1 verify) |
| `harnessed gc` | 清理过期 backups |

### 参数 (Flags)

| Flag | 说明 |
| ---- | ---- |
| `--apply` | 显式执行 (默认 dry-run) |
| `--dry-run` | 永不写盘 (即使加 `--apply` 也优先 dry-run) |
| `--non-interactive` | CI / 脚本场景;必须配合 `--apply` 或 `--dry-run` |
| `--system` | L4 全局装允许 (否则降级 L1 npx ephemeral) |
| `--yes` | uninstall 跳过交互 confirm |
| `--full-diff` | 展开 > 200 行的 diff 折叠 |
| `--no-color` | 强制 nocolor (即使 TTY) |

---

## ⚡ 使用流程

`/plan-feature "新功能 X"` 一行触发 CLAUDE.md 4-stage 三层栈方法论:

```
① Discuss  →  ② Plan  →  ③ Execute  →  ④ Verify
```

| Stage | 上游协同 | 职责 |
| ---- | ---- | ---- |
| ① **Discuss** | gstack `/office-hours` + GSD `/gsd-discuss-phase` | 多角色决策 + 灰色澄清 |
| ② **Plan** | GSD `/gsd-plan-phase` + planning-with-files | 任务拆解 + 持久化 `task_plan.md` |
| ③ **Execute** | superpowers brainstorm + karpathy 心法 + mattpocock 招式 + ralph-loop | 子任务至 verbatim `COMPLETE` |
| ④ **Verify** | GSD `/gsd-verify-work` + code-review + gstack `/review` + code-simplifier | 多角度审查 + 简化 |

实操示例:

```bash
# 1. 装 workflow 上游 (一行装齐 gstack + GSD + superpowers + planning-with-files)
harnessed install plan-feature

# 2. 在 Claude Code 内跑
/plan-feature "新功能 X"

# 3. 中断后恢复 (任何时候)
harnessed resume
```

📊 详细 mermaid + 各 stage 完整说明:[docs/WORKFLOW.md](./docs/WORKFLOW.md)

---

## 🗂️ 架构 (v3.0 — 4-stage namespace-layered)

### 1. 目录结构

```
harnessed/
├── manifests/                  # L1: 上游描述层 (NOT vendored)
├── workflows/                  # L6: composition skill (4-stage 指挥棒)
│   ├── discuss/                # Stage ① 3 layer (strategic + phase + subtask)
│   │   ├── auto/               # /discuss master gate-route
│   │   ├── strategic/          # /discuss-strategic (gstack /office-hours + /plan-ceo-review)
│   │   ├── phase/              # /discuss-phase (GSD /gsd-discuss-phase)
│   │   └── subtask/            # /discuss-subtask (superpowers brainstorming)
│   ├── plan/                   # Stage ② (architecture + phase 任务图)
│   ├── task/                   # Stage ③ (clarify + code + test + deliver)
│   ├── verify/                 # Stage ④ (progress + code-review + paranoid + qa + cso + design + simplify + multispec)
│   ├── research/               # standalone Stage ① alternate
│   ├── retro/                  # standalone post-④ milestone close
│   ├── capabilities.yaml       # L5a: ~70 entry, 7 category SoT
│   ├── defaults.yaml           # ralph_max_iterations per workflow phase
│   ├── judgments/              # L5a: 三层栈判据 + parallelism + tdd + fallback + rules-routing
│   │   ├── strategic-gate.yaml
│   │   ├── phase-gate.yaml
│   │   ├── subtask-gate.yaml
│   │   ├── parallelism-gate.yaml         # L5b execution mechanism routing
│   │   ├── tdd-gate.yaml
│   │   ├── fallback.yaml                 # 3 铁律: skip_with_transparency + override + chain_isolation
│   │   ├── web-design-routing.yaml       # rules/web-design.md codify
│   │   ├── web-testing-routing.yaml      # rules/web-testing.md codify
│   │   ├── web-search-routing.yaml       # rules/web-search.md codify
│   │   └── stage-routing.yaml            # master orchestrator sub-stage 路由
│   └── disciplines/            # L0: NEW v3.0 global cross-stage behavioral norms
│       ├── karpathy.yaml       # 4 心法 + ≤200L
│       ├── output-style.yaml   # BLUF + no-emoji + no-em-dash
│       ├── language.yaml       # zh-Hans default + English preserve
│       ├── operational.yaml    # biome preempt + A7 + commit safety
│       ├── priority.yaml       # skill conflict 仲裁
│       └── protocols.yaml      # cc-handoff design doc 自包含
├── routing/                    # L4: routing engine SSOT (decision_rules.yaml)
├── schemas/                    # L3: JSON Schema (IDE / CI consume)
├── src/                        # L4: TS engine (workflow + routing + cli + installers + checkpoint + audit + state)
├── tests/                      # vitest unit + integration + dogfood (R8.1 dogfood-first)
├── scripts/                    # CI gate (check-workflow-schema, transparency-verdict, state-archive)
├── .planning/                  # project memory (STATE + ROADMAP + REQUIREMENTS + per-phase + milestones)
└── docs/adr/                   # 架构决策记录 (ADR 0001-0032)
```

### 2. 逻辑分层 (8 层)

```
┌────────────────────────────────────────────────────────────┐
│ L7 User-facing slash cmd + harnessed CLI                    │
│   /discuss /plan /task /verify (master) + 14 sub + /research /retro
│   + direct gstack invoke (30+ optional): /office-hours /review /qa /...
├────────────────────────────────────────────────────────────┤
│ L6 Workflow orchestration (workflows/<stage>/<sub>/)         │
├────────────────────────────────────────────────────────────┤
│ L5b Execution Mechanism (orthogonal): subagent / Agent Teams │
│   / 主 session + ralph-loop wrapper                         │
│   parallelism-gate.yaml: 默认 subagent → escalate 5 触发     │
│   Pattern A 全栈三路 / B 对立假设 / C 多维度审查              │
├────────────────────────────────────────────────────────────┤
│ L5a Capability + Judgment + Defaults SoT                    │
│   capabilities.yaml (7 category) + judgments/ (10 file) +    │
│   defaults.yaml                                              │
├────────────────────────────────────────────────────────────┤
│ L4  Runtime engine (workflow / routing / handlers)           │
├────────────────────────────────────────────────────────────┤
│ L3  TypeBox schema + CI gate                                 │
├────────────────────────────────────────────────────────────┤
│ L2  Installer + Manifest engine                              │
├────────────────────────────────────────────────────────────┤
│ L1  Upstream components (NOT vendored)                       │
├────────────────────────────────────────────────────────────┤
│ L0  Discipline Substrate (NEW v3.0 — 全局生效)               │
│   karpathy 心法 + output-style + language + operational +    │
│   priority + protocols (applied universally to L1-L7)       │
└────────────────────────────────────────────────────────────┘
```

### 3. Cross-cutting Capabilities (capabilities.yaml 7 category, ~70 entry)

```
behavioral (1):       karpathy-guidelines (4 心法 always-on)
tool-slash-cmd (40+): gstack 30+ optional + gsd 10+ + mattpocock 12 高频
tool-mcp (4):         chrome-devtools-mcp / tavily-mcp / exa-mcp / playwright-mcp
tool-cli (3):         ctx7 / playwright-cli / gws
tool-plugin (2):      planning-with-files / @playwright/test
tool-bundled (2):     ralph-loop / webapp-testing
agent-platform (3):   agent-teams-create / send-message / shutdown
```

### 4. 数据流示例 (用户调用 `/discuss "新功能 X"`)

```
[L7] User invokes /discuss "新功能 X"
  ↓
[L6] workflows/discuss/auto/workflow.yaml master orchestrator
  ↓
[L5a] judgments.strategic-gate.fires + phase-gate.fires + subtask-gate.fires (3-way 并行 eval)
  ↓
[L4] judgmentResolver.ts (4-level ref split) + exprBuilder.ts (expr-eval evaluate)
  ↓
[L0] discipline.priority-hierarchy 仲裁工具冲突 / output-style 格式化输出
  ↓
[fires=true sub] → invoke sub-workflow (/discuss-strategic / /discuss-phase / /discuss-subtask)
  ↓ for each sub:
      ├─ behavioral_layer: karpathy-guidelines (always-on)
      ├─ tools_available: planning-with-files / ctx7 / mattpocock by-condition
      ├─ parallelism: judgments.parallelism-gate.<route>.fires (L5b mechanism)
      └─ phase invocations execute via capability template interpolation
  ↓
[fallback.yaml chain-isolation] 三层独立判断, 不串行依赖
[Skip 透明声明] 不 fire 的 sub → "⚠️ 跳过 <sub>, 因为 <reason>"
  ↓
planning-with-files /plan (cross-cutting tool) → write artifacts to .planning/<phase-id>/
  ↓
[L4] state.ts writeCurrentWorkflow (proper-lockfile) + audit.append (12-field JSONL)
```

### 5. 抉择路由矩阵 (rules-based, codified in judgments + capabilities)

| 场景 | Rule source | Default → Escalate |
|------|------------|---------------------|
| 并行机制 | rules/agent-teams.md | subagent → Agent Teams Pattern A/B/C (5 触发) |
| UI 设计主方案 | rules/web-design.md | ui-ux-pro-max → frontend-design (用户明示风格) |
| E2E 浏览器探查 | rules/web-testing.md | playwright-cli (Bash 一行 token 省) |
| E2E commit-able TS | rules/web-testing.md | @playwright/test 默认 |
| E2E Python 后端联动 | rules/web-testing.md | webapp-testing |
| 性能/a11y/内存 | rules/web-testing.md | chrome-devtools-mcp |
| Web 搜索 (关键词) | rules/web-search.md | Tavily MCP 默认 |
| Web 搜索 (描述式/学术) | rules/web-search.md | Exa MCP |
| 库 API 文档 | rules/context7.md | ctx7 CLI |
| GitHub URL | rules/web-search.md | gh CLI |
| 单 URL 抓取 | rules/web-search.md | WebFetch 内置 |
| Gmail/Drive/Calendar | rules/google-workspace.md | gws CLI |
| 架构审查 (复杂) | CLAUDE.md Stage ② | gstack /plan-eng-review |
| TDD 强制 (核心算法) | CLAUDE.md Stage ③ | superpowers TDD OR mattpocock /tdd |
| 关键模块 PR | CLAUDE.md Stage ④ | gstack /review |
| 大重构 PR multi-dim | CLAUDE.md Stage ④ + Pattern C | 4-spec Agent Team |
| 跨 CC 协议 | rules/cc-handoff.md | discipline.protocols self-contained design doc |

### v3.0 superset commitment

harnessed v3.0 是 user 个人 `~/.claude/CLAUDE.md` + Obsidian doc + `~/.claude/rules/` 的 **machine-codified superset**:
- ✅ 4-stage cadence verbatim 机器化 (20 workflows)
- ✅ 三层栈判据 + fallback 3 铁律 (judgments/ 10 file)
- ✅ Pattern A/B/C Agent Teams routing (L5b mechanism)
- ✅ Rules-based tool routing (4 NEW judgments + capabilities)
- ✅ Global discipline (L0 substrate, 6 yaml)
- ✅ harnessed > user manual via: auto gate-route + Pure bundled + cross-session memory + ADR audit + Token cost estimation + real-time discipline enforcement

---

## ❓ FAQ

<details>
<summary><b>Q1. 装了 harnessed 还需要装 superpowers / gstack / GSD 上游吗?</b></summary>

<br>

需要,但**用户感知 = 一行命令**:

```bash
harnessed install plan-feature  # 自动装齐 gstack + GSD + superpowers + planning-with-files
```

类比 `brew install <formula>` 装全套依赖 — 你不需要单独 `brew install` 每个依赖项。

</details>

<details>
<summary><b>Q2. 为什么不直接 vendor superpowers / gstack 进 harnessed 仓库?</b></summary>

<br>

4 条理由:

1. **差异化哲学** — harnessed 是「装配主义包管理器」对位「all-in-one 自建派」。vendor = 失去 wedge → 沦为又一个 plugin pack
2. **License + attribution 噩梦** — vendor 4-5 个主动维护的上游 = 复杂 license 拼盘
3. **上游升级反向** — 当前 manifest 描述,上游升级用户 re-install 即得新版;vendor 后手动 sync code 永远落后
4. **Bus factor 1** — 单 maintainer 维护 vendor 4-5 上游 = 加速 burnout

</details>

<details>
<summary><b>Q3. gstack / GSD / superpowers 看起来都是 plan/discuss 类,是不是重叠?</b></summary>

<br>

**不是**。它们是三层栈的不同阶段:

| 阶段 | 上游 | 职责 |
| ---- | ---- | ---- |
| Governance | gstack | 多角色决策关卡 (CEO / EM / Designer / Paranoid Engineer) |
| Brainstorming | superpowers | 子任务设计澄清、方案对比 |
| Orchestration | GSD | 高层 phase 任务图 + 依赖分析 |
| Persistence | planning-with-files | 持久化 `task_plan.md` / `progress.md` / `findings.md` |

`/plan-feature` 把 4 阶段串起来 — 每个阶段做不同事,输出喂给下一阶段。**没有合并**。

</details>

<details>
<summary><b>Q4. workflow phase 之间是自动跑还是等用户?</b></summary>

<br>

看 `workflows/<name>/SKILL.md` frontmatter 的 `pause` 字段:

- `pause: human_review` → 阻塞等用户 approve (governance gate / final lock,如 `plan-feature` 的 phase 01 + 05)
- 无 `pause` → 自动 chain 到下一 phase

每个 phase 输出写到 `.harnessed/checkpoints/`,session 中断后 `harnessed resume` 从最近 checkpoint 继续。

</details>

<details>
<summary><b>Q5. harnessed 自己是 CC plugin 吗?</b></summary>

<br>

混合体:

- `npx harnessed@latest setup` 跑的是 **Node.js CLI** (`bin/harnessed`)
- setup 装的 **workflow skills** (markdown) 进 `~/.claude/skills/`,由 Claude Code 运行时加载
- `/plan-feature` / `/execute-task` 等是 CC 内的 slash command,触发 skill 执行
- CLI 和 CC skill 共享 `.harnessed/checkpoints/` 状态目录

</details>

---

## 📚 文档导航

- [docs/WORKFLOW.md](./docs/WORKFLOW.md) — 4-stage workflow mermaid + 各 stage 详解
- [docs/INSTALLER-CONTRACT.md](./docs/INSTALLER-CONTRACT.md) — installer 6 条用户视角硬契约
- [docs/MAINTAINER-ONBOARDING.md](./docs/MAINTAINER-ONBOARDING.md) — 30 分钟跑通 dev 环境
- [docs/adr/](./docs/adr/) — 架构决策记录 (ADR 0001-0023)
- [CHANGELOG.md](./CHANGELOG.md) — 完整版本历史
- [CONTRIBUTING.md](./CONTRIBUTING.md) — 贡献指南
- [SECURITY.md](./SECURITY.md) — 漏洞披露通道

---

## License

[Apache-2.0](./LICENSE) — 见 [NOTICE](./NOTICE) (含 Harness Inc. 商标 disclaimer)

支持开发: [![Sponsor](https://img.shields.io/github/sponsors/easyinplay?logo=github&label=Sponsor)](https://github.com/sponsors/easyinplay)
