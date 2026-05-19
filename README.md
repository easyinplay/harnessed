# harnessed

> **AI coding harness package manager + composition orchestrator** — 装配主义包管理器,不 vendor 上游;用 manifest 描述安装 + 用 composition skill 编排多上游协作工作流;把"gstack 决策 → GSD 项目经理 → superpowers 资深工程师"三层栈方法论机器化。

[![npm](https://img.shields.io/npm/v/harnessed?label=npm&color=blue)](https://npmjs.com/package/harnessed)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](./LICENSE)
[![Sponsor](https://img.shields.io/github/sponsors/easyinplay?logo=github&label=Sponsor)](https://github.com/sponsors/easyinplay)

> Not affiliated with, endorsed by, or sponsored by Harness Inc. (见 [NOTICE](./NOTICE))

## 安装

```bash
npm install -g harnessed
```

## Quick Start

```bash
# 1. 一次性 setup (装 workflow skills 到 ~/.claude/skills/)
harnessed setup

# 2. 装某个 workflow 用到的所有上游 (一行装齐 gstack + GSD + superpowers + planning-with-files)
harnessed install plan-feature

# 3. 在 Claude Code 内跑 workflow
/harnessed:plan-feature "新功能 X"

# 4. 中断后恢复 (任何时候)
harnessed resume

# 5. 健康检查 / 路由审计
harnessed doctor
harnessed audit-log --tail 20
```

## 三层栈 4-stage workflow

`/harnessed:plan-feature` 一行命令串起完整工作流:

| Stage | 上游 | 职责 |
|------|------|------|
| ① **Discuss** | gstack `/office-hours` + GSD `/gsd-discuss-phase` | 多角色决策关卡 + 灰色澄清 |
| ② **Plan** | GSD `/gsd-plan-phase` + planning-with-files | 任务拆解 + 持久化 task_plan.md |
| ③ **Execute** | superpowers brainstorm + karpathy 4 心法 + mattpocock 23 招式 + 可选 TDD + ralph-loop | 子任务执行至 verbatim COMPLETE |
| ④ **Verify** | GSD `/gsd-verify-work` + code-review + gstack `/review` + code-simplifier | 多角度审查 + 简化 |

详细 mermaid + CLAUDE.md gap 分析: [docs/WORKFLOW.md](./docs/WORKFLOW.md)。

## 核心特性

- **不 vendor 上游** — 上游代码不进我们仓库,靠 manifest 描述 install/check,升级用户重 install 即得新版
- **dry-run 默认** — 所有装/改命令默认 preview,必须 `--apply` 或 `y` 才真执行
- **`/harnessed:*` 统一入口** — 用户不需学每家上游术语,composition skill 调度多个上游协同
- **路由透明日志** — `.harnessed/audit.log` JSONL 完整记录每次路由决策,`harnessed audit-log --filter` 消费
- **并发安全** — 状态目录 `.harnessed/` 文件锁保护,多 process 安全
- **路径安全** — manifest path + alias 5-vector 路径遍历加固 (OWASP A1)
- **跨 OS** — Windows + Linux + macOS Day 1 CI 验证

## 文档

- [docs/WORKFLOW.md](./docs/WORKFLOW.md) — 4-stage workflow mermaid + 各 stage 详解
- [docs/INSTALLER-CONTRACT.md](./docs/INSTALLER-CONTRACT.md) — installer 6 条用户视角硬契约
- [docs/MAINTAINER-ONBOARDING.md](./docs/MAINTAINER-ONBOARDING.md) — 30 分钟跑通 dev 环境
- [docs/adr/](./docs/adr/) — 架构决策记录 (ADR 0001-0023)
- [CHANGELOG.md](./CHANGELOG.md) — 完整版本历史
- [CONTRIBUTING.md](./CONTRIBUTING.md) — 贡献指南
- [SECURITY.md](./SECURITY.md) — 漏洞披露通道

## License

[Apache-2.0](./LICENSE) — 见 [NOTICE](./NOTICE) (含 Harness Inc. 商标 disclaimer)。

支持开发: [![Sponsor](https://img.shields.io/github/sponsors/easyinplay?logo=github&label=Sponsor)](https://github.com/sponsors/easyinplay)
