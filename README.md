# harnessed

> AI coding harness 生态的**装配主义包管理器** + composition orchestrator
> 不 vendor 上游代码，用 manifest 描述 install/check，用 composition skill 编排多上游工作流

[![License: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](./LICENSE)
[![Status](https://img.shields.io/badge/status-pre--launch-orange)](./.planning/ROADMAP.md)

> Not affiliated with, endorsed by, or sponsored by Harness Inc.（见 [NOTICE](./NOTICE)）

## 一句话定位

别人造轮子（如 ECC 自家 30 agents/135 skills），我们做"指挥棒"——装配市面上最优秀的开源 Claude Code 生态组件，用强意见的 composition skill 编织成统一工作流。

## 关键差异化

- **不 vendor**：上游代码不进我们仓库，靠 manifest 描述 install/check（schema v1 frozen — see [ADR 0001](./docs/adr/0001-manifest-schema-v1.md)）
- **Composition Skill**：自家 workflow skill 当指挥棒，调度多个上游协同（research / execute-task / plan-feature 三 MVP workflow）
- **包管理器思维**：`harnessed install <workflow>` 自动解析依赖图、`doctor` 健康检查
- **强意见 vs all-in-one**：用户面对 `/harnessed:*` 统一入口，不需学每家上游术语

## Quick Start (placeholder — 实际 install 由 v0.1 phase 1.2 实装)

```bash
# 一次性 setup（v0.1 phase 1.2 起可用）
npx harnessed@latest setup

# 装 research workflow（含 ctx7 + Tavily MCP + Exa MCP）
harnessed install research

# 检测环境
harnessed doctor
```

## Repo Structure

```
harnessed/
├── manifests/           # 上游描述层（不 vendor）
│   ├── tools/          # cc-plugin / mcp-npm / cli-npm
│   └── skill-packs/    # cc-skill-pack
├── workflows/          # composition skill（指挥棒）
├── routing/            # B+C 混合路由 SSOT
├── config-templates/   # 配置注入层（hooks 等）
├── schemas/            # JSON Schema artifact (publish 给 IDE / CI)
├── src/                # TS 源码（installer / validator / router / checkpoint）
├── tests/              # vitest 单测 + 集成 + bench
└── docs/adr/           # 架构决策记录
```

## v0.1.0-alpha.1 状态

- **Phase 1.1 schema frozen** ✅ (manifest schema v1 + 10 上游 dry-run + 71 tests + bench 21.7ms)
- **Acceptance bar 7/8** ✅ — A4 (cross-OS CI) ⏳ pending first push
- **Next**：phase 1.2（cli-npm + mcp-stdio installer + cross-OS CI 实测）

## 文档导航

- [PROJECT-SPEC.md](./PROJECT-SPEC.md) — 立项参数 spec sheet（v2.1）
- [WORKFLOWS-MVP.md](./WORKFLOWS-MVP.md) — 3 个 MVP workflow 展开（v2.1）
- [docs/adr/](./docs/adr/) — 架构决策记录（0001 schema / 0002 toolchain / 0003 method count errata）
- [.planning/ROADMAP.md](./.planning/ROADMAP.md) — 4 milestones × 3-5 phases 路线图
- [.planning/STATE.md](./.planning/STATE.md) — 跨 session 项目记忆 SSOT
- [CONTRIBUTING.md](./CONTRIBUTING.md) — 贡献指南（含 Windows corepack ACL workaround）

## Sponsor / Co-maintainer

GitHub Sponsors 启用 + co-maintainer 招募窗口在 v0.4 开启（参考 [docs/MAINTAINER-ONBOARDING.md](./docs/MAINTAINER-ONBOARDING.md)）。

## License

[Apache-2.0](./LICENSE) — 见 [NOTICE](./NOTICE)（含 Harness Inc. 商标 disclaimer）
