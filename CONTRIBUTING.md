# Contributing to harnessed

> 感谢您对 harnessed 的兴趣。本文档涵盖 **dev setup**、**常用命令**、**commit 规则**、**ADR 写作**、**manifest 提交**、**findings 文档化**。

## Prerequisites

- **Node.js ≥ 22.0.0**（v0.1 锁 22 LTS — `engines.node` 强制）
- **Git**（Windows 用户推荐 Git for Windows / Git Bash）
- 不需要全局装 pnpm — 通过 `corepack` 自动管理

## Setup

```bash
git clone https://github.com/<owner>/harnessed.git
cd harnessed

# 启用 corepack（Node 自带，无需额外装）
corepack enable

# 安装依赖
corepack pnpm install --frozen-lockfile
```

### Windows Workaround（F1 finding mitigation）

如果 `corepack enable` 在 Windows 上报 `EPERM: operation not permitted, open 'C:\Program Files\nodejs\pnpm.CMD'`，是 Node 装在受 ACL 保护目录所致。**请用 prepare 模式**：

```bash
corepack prepare pnpm@10.12.0 --activate
# 后续命令用 corepack pnpm <cmd> 间接调用
corepack pnpm install --frozen-lockfile
corepack pnpm test
```

`packageManager` 字段强制 binding pnpm 版本，行为等价于 `pnpm <cmd>`。
**不要** `Run as Administrator` — 会污染全局 ACL。

## 常用命令

| 命令 | 说明 |
| ---- | ---- |
| `corepack pnpm typecheck` | TS 严格类型检查（`tsc --noEmit`） |
| `corepack pnpm lint` | Biome lint + format check |
| `corepack pnpm lint:fix` | 自动修复 lint + format |
| `corepack pnpm test` | vitest run（71+ tests） |
| `corepack pnpm test:watch` | vitest watch mode |
| `corepack pnpm test:coverage` | vitest + v8 coverage |
| `corepack pnpm bench` | vitest bench（perf SLA 验证） |
| `corepack pnpm build` | typecheck + tsup build → dist/ |
| `corepack pnpm build:schema` | 从 TypeBox 编译 → schemas/manifest.v1.schema.json |
| `corepack pnpm validate:schema` | Ajv 2020 strict 编译 disk artifact |

## Commit Message 格式

格式：`phase-<N.M>: T<N>.<M> <action>`

示例：

```
phase-1.1: T9.4 add CONTRIBUTING.md (F1 corepack workaround documented)
phase-1.2: T2.1 implement cli-npm installer with idempotent_check
phase-1.1: T8.6 add bench + perf gate (A6 acceptance bar)
```

每个 task 独立 atomic commit；多文件改动同属一个 task 时合并。
不允许 `WIP` / `fix typo` / `update`（信息密度过低）。

## ADR 写作规则

何时写 ADR — 见 [`docs/adr/README.md`](./docs/adr/README.md) "何时写 ADR" 章节。

写作步骤：

1. 复制现有 ADR（如 [`0001-manifest-schema-v1.md`](./docs/adr/0001-manifest-schema-v1.md)）作为模板
2. 编号 = 上一个 ADR 编号 + 1（**永不重用**，即使被 deprecated）
3. Status 从 `Proposed` 起；merge 时改 `Accepted`
4. 更新 [`docs/adr/README.md`](./docs/adr/README.md) 索引表

**重要**：ADR 0001 / 0002 main body 一旦 `Accepted`，**禁止 inline 修改**（A7 acceptance bar 守恒）。
任何修改必须出新 ADR errata（参考 [`0003-install-method-count-errata.md`](./docs/adr/0003-install-method-count-errata.md) 模式）。

## Manifest 提交规则

每份 `manifests/tools/*.yaml` 或 `manifests/skill-packs/*.yaml` 必须：

1. 通过 `corepack pnpm test`（fixture-driven 自动校验，参考 `tests/unit/manifest-validate.fixtures.test.ts`）
2. 满足 [`manifests/SCHEMA.md`](./manifests/SCHEMA.md) 字段表
3. 满足 [ADR 0001](./docs/adr/0001-manifest-schema-v1.md) type × method 矩阵
4. 满足 [ADR 0003](./docs/adr/0003-install-method-count-errata.md)（method 数 = 6）
5. 文件名 = `<metadata.name>.yaml`（小写，匹配 `^[a-z0-9][a-z0-9-]*$`）

## Findings 文档化

执行中的意外、决策修订、需 escalate 事项 → 写到当前 phase 的 `progress.md § B`：

- 路径模板：`.planning/phase-<N.M>/progress.md`
- 模板：见 [`.planning/phase-1.1/progress.md § B.2`](./.planning/phase-1.1/progress.md)
- 重大事项（影响 ADR / SPEC 决策）→ 升级为 ADR errata + 同步 `progress.md § B.5` 索引表

## verbatimModuleSyntax + CJS Interop（F9 finding）

`tsconfig.json` 启用 `verbatimModuleSyntax: true`（per [ADR 0002](./docs/adr/0002-repo-structure-toolchain-v0.1.md)）禁用 esModuleInterop synthetic-default。
CJS 包（如 `ajv-formats`）必须用 namespace import + `.default` 解引用：

```ts
import * as ajvFormatsNs from 'ajv-formats'
const addFormats = (ajvFormatsNs as unknown as { default: (a: Ajv) => Ajv }).default
```

## Ajv 2020 Entry（F11 finding）

声明 `$schema: draft-2020-12` 的 schema artifact（如 `schemas/manifest.v1.schema.json`）必须用 `ajv/dist/2020.js` 入口编译，**不**能用默认 `ajv` entry（默认仅支持 draft-07）。

```js
import Ajv from 'ajv/dist/2020.js'  // CJS default — 注意 interop
```

## 不允许的操作

- ❌ `git commit` 修改 ADR 0001/0002 main body（用 errata ADR 代替）
- ❌ vendor/* 添加上游代码（除非满足 [`vendor/ENTRY-CRITERIA.md`](./vendor/ENTRY-CRITERIA.md) 全部条件）
- ❌ manifest 中 `${shell}` / `$(...)` / `eval(...)` / `!ruby/regexp`（ADR 0001 reject list）
- ❌ 顶层 `extends` / 未声明字段（schema strict mode 拒绝）
- ❌ 跳过 `git commit --no-verify`（pre-commit hook 是 quality gate）
- ❌ `package-lock.json` / `yarn.lock`（仓库统一 `pnpm-lock.yaml`）

## karpathy Simplicity 原则

- **think before coding** — 先想清楚再写
- **surgical changes** — 最小必要修改
- **no premature abstraction** — 不为虚构未来需求设计

详见用户全局 CLAUDE.md 路由规则。

## Questions?

- Issues: [GitHub Issues](https://github.com/<owner>/harnessed/issues)
- Roadmap: [.planning/ROADMAP.md](./.planning/ROADMAP.md)
- v0.4 起开放 co-maintainer 招募窗口（参考 [docs/MAINTAINER-ONBOARDING.md](./docs/MAINTAINER-ONBOARDING.md)）
