# ADR-0002: Repository Structure and Toolchain v0.1

## Status

**Accepted** — 2026-05-11

## Context

Phase 1.1（v0.1.0）必须初始化 Node.js + TypeScript 仓库骨架。`PROJECT-SPEC.md` v2.1 § 4 已锁定顶层 4 层目录（manifests/ workflows/ routing/ config-templates/ vendor/ src/ tests/ docs/），但工具链 6 个子决策（仓库结构 / 包管理器 / TS 构建 / 测试 / CLI / lint+format）属于 phase 1.1 gray area。

### 立项调研依据

- `.planning/phase-1.1/GRAY-AREA-2-repo-structure.md`（gsd-advisor-researcher 完整调研，6 维度对比 + ready-to-use 配置）
- `.planning/phase-1.1/ASSUMPTIONS.md`（B 类隐式 assumptions 需澄清）
- `.planning/research/04-failure-modes.md`（拒绝清单：v1.0 前不加 monorepo / 不 wrap 上游 API）
- `PROJECT-SPEC.md` v2.1 § 5.1（karpathy simplicity 哲学）
- `PROJECT-SPEC.md` v2.1 § 11（cross-OS Day 1 启用约束）

### 核心约束

- **单维护者** — 工具链每提速 10×，bus factor 风险下降一个量级
- **不 vendor 上游** — 不需要复杂的 build pipeline 处理外部代码
- **`npx harnessed@latest setup` 是事实标准** — bin 字段 + 跨 OS shebang 是底线
- **cross-OS Day 1**（Mac / Linux / Windows native，非 WSL）— 工具链必须不引入平台依赖
- **karpathy simplicity** — 避免不必要复杂度

## Decision

### 1. 仓库结构 → **Single Package**

- **决策**：单 `harnessed` 包，`src/` 4 子目录划分模块边界（installers / routing-engine / checkpoint / cli）
- **拒绝**：pnpm workspaces / turborepo / Lerna
- **理由**：
  1. YAGNI — 单 maintainer 过度工程化，monorepo 加 IDE 复杂度、CI 时间、版本同步成本
  2. `src/` 子目录已足以表达模块边界（参考 ctx7、Vite 单包结构）
  3. `exports."./schemas"` 字段为未来第三方 import schema 留接口（无需拆 monorepo）
  4. R04 拒绝清单：v1.0 前不拆包

### 2. 包管理器 → **pnpm 10 + corepack 钉版本**

- **决策**：`package.json` 加 `"packageManager": "pnpm@10.12.0"`，contributor 一行 `corepack enable`
- **拒绝**：npm / yarn / bun
- **理由**：
  1. pnpm 10 严格 hoisting + content-addressable store → 单维护者不会因依赖混乱踩坑
  2. corepack 锁版本避免环境漂移（不同贡献者用不同 pnpm 版本导致 lockfile diff）
  3. 跨 OS 兼容性优于 bun（bun 在 Windows native 上仍有边角问题）
  4. npx 兼容性无关 — 用户运行 `npx harnessed@latest setup` 时不感知开发期工具

### 3. TS 构建 → **tsup (esbuild) + pure ESM**

- **决策**：
  - tsup 8.x 作 bundler（基于 esbuild）
  - **pure ESM 输出**（不双发 CJS）
  - `tsc --noEmit` 作类型守门（CI 必跑）
  - tsup 自动注入 shebang `#!/usr/bin/env node` + chmod +x
- **拒绝**：tsc / unbuild / 手写 esbuild config
- **理由**：
  1. 25-30% 冷启动收益（npx 启动时间敏感）
  2. **tsup 自动 shebang + chmod = day 1 规避 GSD issue #2453**（dist mode 644 不可执行）
  3. 2026 默认 ESM 已成熟（Node 22+ 全面 ESM-friendly），不双发 CJS 减半维护负担
  4. 不导入 CJS-only 上游代码（installer 仅 spawn 子进程，零 import 上游模块）

### 4. 测试框架 → **Vitest 4 + @vitest/coverage-v8**

- **决策**：vitest 4.x 全栈，coverage 用 v8 provider
- **拒绝**：node:test（Node 20+ 内置）/ jest
- **理由**：
  1. installer / routing 测试需要 fixture / snapshot / mock，node:test 这些能力不完整
  2. vitest 4 vite-native HMR — TDD 体感最佳（karpathy 心法对齐）
  3. 与 tsup 共享 esbuild 底座，测试 transform 0 配置
  4. `vitest --coverage` 单命令出报告（biome ecosystem 配套）

### 5. CLI 框架 → **Commander 12.x**

- **决策**：commander 12.1+ 作主 CLI 框架，子命令 `setup` / `install` / `doctor` / `audit` / `status` / `resume` / `validate` / `manifest scaffold`
- **拒绝**：yargs / clipanion / cac
- **理由**：
  1. 152.5M weekly downloads — 生态最稳，文档最全
  2. 25ms startup（vs yargs ~80ms）— npx 启动敏感场景胜出
  3. Git-style subcommand 完美匹配 harnessed 命令结构
  4. 帮助文本生成 + 类型推导兼顾

### 6. lint + format → **Biome 2 单工具**

- **决策**：biome 2.x 替代 eslint + prettier 双工具组合
- **拒绝**：eslint + prettier / oxlint
- **理由**：
  1. 10-20× faster than ESLint — pre-commit hook 不卡顿（单维护者每天提交多次）
  2. single command（`biome check --apply`）— karpathy simplicity 对齐
  3. 单一 `biome.json` 配置 — 减少配置文件膨胀
  4. 内置 TS / JSX / JSON 支持，零插件
  5. oxlint 仍 pre-1.0 阶段，生态不及 biome

## Consequences

### 正面

1. **仓库结构清晰但不复杂** — single package + src/ 子目录可读性高
2. **pure ESM 现代化** — 减少 CJS 双发负担，对齐 2026 生态
3. **tsup 自动 shebang** — day 1 解决 cross-OS bin 兼容（直接规避已知事故）
4. **biome 单工具** — pre-commit 提速 10-20×，单维护者关键
5. **pnpm + corepack** — 0 摩擦 contributor onboarding，降低 fork 成本
6. **vitest 4 与 tsup 共享 esbuild** — test transform 0 配置
7. **commander Git-style** — `harnessed manifest scaffold cli-npm` 这类嵌套命令自然表达

### 负面

1. **pure ESM 限制** — 若未来真有 CJS-only 上游需要直接 import 时受阻（mitigation：installer 仅 spawn 子进程，不 import 上游 → 不触发约束）
2. **Biome 生态比 ESLint 小** — 自定义 lint 规则少（mitigation：本项目不需要复杂 lint）
3. **single package 的天花板** — 未来若真有大型扩展（如 Web Dashboard）需要拆 monorepo → 那时出 ADR-NNNN 升级
4. **commander 与 zod-style 框架不同** — TS 类型推导不如 clipanion 强（mitigation：单维护者偏好稳定 > 极致 TS DX）

### 中性

1. **vitest vs node:test** — 选 vitest 多 ~5MB devDep，但功能完整；若未来 simpler，可降级
2. **pnpm vs bun** — bun 性能略优但 Windows native 有边角问题；待 bun 在 Windows 完全稳定（可能 v0.4+ 重新评估）
3. **tsup vs unbuild** — 两者底层都用 esbuild + rollup-style API；选 tsup 因社区更大、文档更全

## Compliance / Migration

### v0.1 起的强制约束

- 任何未来加 TS / lint / build / test 工具变更必须 ADR-NNNN
- `package.json packageManager` 字段必须钉到具体 minor 版本（`pnpm@10.X.Y`）
- pure ESM = 永久承诺（除非 CC plugin 体系强制要求 CJS — 目前未发现）
- tsup 自动 shebang/chmod 不能 disable（cross-OS 守护）

### 升级策略

- pnpm minor 升级 = 安全（10.12 → 10.13），lockfile 自动 migrate
- pnpm major 升级 = ADR 评估（10 → 11）
- biome minor 升级 = 必须先在分支 try（`biome migrate` + 全量 lint 验证）
- vitest minor 升级 = 安全
- commander minor 升级 = 安全
- TypeScript major 升级 = ADR 评估（影响 strict 模式行为）

### CI 守护

- GitHub Actions 矩阵 `[ubuntu-latest, macos-latest, windows-latest] × [node 22]`，`fail-fast: false`
- 每次 PR 必跑 `pnpm typecheck && pnpm lint && pnpm test && pnpm build`
- 每次 PR 必验证 `node ./dist/cli.mjs --version` 三平台都 exit 0（shebang/chmod 防退化）

## References

### 内部依据

- `.planning/phase-1.1/GRAY-AREA-2-repo-structure.md`（完整调研，含 ready-to-use package.json / tsconfig.json / biome.json / GitHub Actions 模板）
- `.planning/phase-1.1/ASSUMPTIONS.md` § B（隐式 assumptions B1-B6 全部由本 ADR 解答）
- `.planning/research/04-failure-modes.md`（v1.0 前拒绝清单 — 不拆 monorepo）
- `PROJECT-SPEC.md` v2.1 § 4（仓库 4 层架构）/ § 5.1 哲学 / § 11 cross-OS 前移
- ADR 0001 manifest schema v1（runtime 依赖：ajv + typebox + yaml）

### 外部参考

- [pnpm 10 release notes](https://pnpm.io/blog/2025/01/14/v10)
- [tsup docs](https://tsup.egoist.dev/)
- [Biome 2 release notes](https://biomejs.dev/blog/biome-2-0/)
- [Commander.js npm](https://www.npmjs.com/package/commander)
- [Vitest 4 release](https://vitest.dev/blog/vitest-4)
- [Node.js Corepack docs](https://nodejs.org/api/corepack.html)
- [GSD issue #2453: bin mode 644 incident](https://github.com/get-shit-done/get-shit-done-cc/issues/2453)（tsup 自动处理 = 直接规避）
