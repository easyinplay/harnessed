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

## intel / 参考文档的 SSOT 引用规则

`.planning/intel/**` 及任何引用 phase / ADR 编号的参考文档（外部对比、研究笔记、借鉴清单）
是**外部参考，不是 SSOT**。引用 SSOT 资源（phase 编号、ADR 编号）时必须防 stale —— 本节
把该纪律从 intel-local 提升为**项目级文档纪律**，所有贡献者遵守。

- **phase 编号 → 语义锚定**：引用 phase 时用语义描述（"Phase 2.2 = execute-task
  workflow"），**不只靠数字**。phase 编号是可被 insert 的 —— `phase 1.2.5` 插入即先例；
  纯数字引用在 phase 重排后即 stale。
- **ADR 编号 → 绝不预占**：ADR 编号是"先 plan-phase 先占"的**动态资源**。需要新 ADR 时
  写"需起 errata ADR（编号由对应 phase plan-phase 流程分配）"，**不写死 `ADR NNNN`**。
  预占的编号会被实际 plan-phase 流程抢占 → 引用失效。
- **校验时机**：任何 phase discuss-phase 取用参考文档时，先比对当前 `.planning/ROADMAP.md`
  / `docs/adr/` 的**实际编号**，发现 drift 即就地修正。
- **适用范围**：`.planning/intel/**` + 任何引用 phase / ADR 编号的参考 / 研究文档。

**反面教材**：`.planning/intel/omc-comparison.md` 2026-05-14 初版写死 "phase 2.0" +
"ADR 0010" —— 2026-05-15 v0.2.0 激活 + Phase 2.1 plan-phase 后即 stale（execute-task
实际是 Phase 2.2；ADR 0010 已被 Phase 2.1 installer-schema-extension-errata 占用）。
本规则与上文「ADR 写作规则」§ "编号 = 上一个 ADR 编号 + 1，永不重用" 互补：ADR 写作侧
管"如何分配"，本节管"参考文档如何引用尚未分配的编号"。

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

## How to add a doctor check (Pattern I — auto-glob)

`harnessed doctor` 检查 4 项 phase 1.2 baseline（Node ≥ 22 / MCP scope / jq present / Win bash flavor）。新加 check 走以下步骤：

1. **加 check fn**：`src/cli/doctor.ts` 加新函数 `checkXxx(): DoctorResult`，返回 `{ ok, name, version?, fixHint? }`。Pattern I auto-glob 风格——每 check 平均 25-35 行，含 cross-OS fix hint 三分支（Win/Mac/Linux）。
2. **register 到 entry**：`runDoctor()` 顶部加 `const xxx = await checkXxx()` + `printResult(xxx)`。无需手动维护 check 数组——doctor.ts 用 sequential await 顺序展示。
3. **加 unit test**：`tests/unit/cli-doctor.test.ts` 加 BASE+modifier cell（Pattern J），mock `node:child_process` spawnSync 模拟 cmd not found / cmd ok / cmd version-mismatch 三场景。
4. **跑 acceptance**：`corepack pnpm test -- --filter cli-doctor` 全绿；`corepack pnpm typecheck && corepack pnpm lint` 0 errors；提交时跑 `biome check --write` 一次 format pass 避免 lint round-trip（Wave 4-5 教训）。

参考实装：`src/cli/doctor.ts` checkWinBash（双 step：`where bash` → `bash -c "echo $WSL_DISTRO_NAME"` 探 WSL）。

## ADR 0005 marketplace_source schema errata 写作背景

ADR 0005（2026-05-12 accepted）补 `cc-plugin-marketplace.spec.install.marketplace_source` optional 字段——为什么不直接改 ADR 0001？

**A7 守恒**：ADR 0001 / 0002 / 0003 / 0004 main body 一旦 accepted，**永久禁止 inline 修改**。CI workflow 通过 5 个 baseline tag (`adr-0001-accepted` / 0002 / 0003 / 0004 / 0005) 自动 enforce——任一 tag 之后 main body 任何字符 diff = CI fail（详见 `.github/workflows/ci.yml` "A7 acceptance bar" step iterate 5 tag）。

**Errata 流程**：

1. 发现 schema 字段缺口（如 phase 1.2 实装 `cc-plugin-marketplace` installer 时发现 manifest 描述 marketplace 来源 URL）
2. 起草新 ADR `0005-<short-title>.md`，Status `Proposed` → 决策 review → `Accepted`
3. 改对应 `src/manifest/typebox/<methodSchema>.ts` 加 optional 字段（不动 schema kernel；run `corepack pnpm build:schema` 重生 artifact）
4. 同步 manifest fixture（如 `manifests/skill-packs/planning-with-files.yaml` add `marketplace_source`）
5. 加 unit tests（Pattern J BASE+modifier，5 cell × 平均 1.4 assertion）
6. 更新 `docs/adr/README.md` 索引；ADR 0001 main body 在 § Status 之后加 cross-ref 注释（**不改 main body**，仅在标题行加 "see ADR 0005 for ..." prefix）
7. CI 复跑 5 baseline tag iterate 全 0 diff — A7 守恒满足

ADR 0005 实装路径（commit 8950ff3 → 715f880 → 1ec7478 → 840e606）即此流程的 reference implementation——任何后续 schema errata（ADR 0006+）沿用同款。

## Phase Verification Index

每 phase ship 时落 `.planning/phase-<N.M>/VERIFICATION.md`（≥ 120 行）—— 任何人按文件可复现该 phase acceptance bar。phase 1.1 由 `VERIFICATION.md` 引导 8 项 A1-A8 复现；phase 1.2 由同款文件引导 9 项 B1'-B9'。文件包含：

- § 1 Acceptance Bar 复现命令（每 bar 一行 bash）
- § 2 Contract / Integration test 索引表
- § 3 下一 phase prereq（依赖契约）
- § 4 Findings 索引（progress.md § B 反向链接）
- § 5 Known issues + deferred items 列表

## Questions?

- Issues: [GitHub Issues](https://github.com/<owner>/harnessed/issues)
- Roadmap: [.planning/ROADMAP.md](./.planning/ROADMAP.md)
- v0.4 起开放 co-maintainer 招募窗口（参考 [docs/MAINTAINER-ONBOARDING.md](./docs/MAINTAINER-ONBOARDING.md)）
