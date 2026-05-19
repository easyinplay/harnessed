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
- **Composition Skill** — 自家 workflow skill 当指挥棒,调度多个上游协同 (research / execute-task / plan-feature 三 MVP workflow)
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

## 🗂️ 项目结构

```
harnessed/
├── manifests/         # 上游描述层 (不 vendor)
│   ├── tools/         # CLI / MCP / hooks
│   └── skill-packs/   # Claude Code skill packs
├── workflows/         # composition skill (指挥棒)
├── routing/           # 路由 SSOT (B+C 混合)
├── schemas/           # JSON Schema artifact (IDE / CI consume)
├── src/               # TS 源码 (installer / validator / router / checkpoint / audit)
├── tests/             # vitest 单测 + 集成 + bench
└── docs/adr/          # 架构决策记录 (ADR 0001-0023)
```

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
