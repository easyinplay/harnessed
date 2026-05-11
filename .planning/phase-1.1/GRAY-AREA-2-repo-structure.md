# Gray Area 2: 仓库结构 / 工具链选型

> Phase 1.1 第二份 advisor 调研（v0.1.0 起步阶段）
> 日期：2026-05-11
> 调研范围：6 个子决策（monorepo / 包管理器 / TS 构建 / 测试框架 / CLI 框架 / lint+format）
> calibration：standard（每维度 2-4 选项 + 条件式推荐）
> 关联输入：PROJECT-SPEC.md v2.1 § 4 / ROADMAP.md v0.1.0 phase 1.1 必含项 / Gray Area 1（manifest schema）

---

## 0. 调研边界与判定原则

**已锁定约束（不可调整）**：
- Node.js + TypeScript（SPEC § 1）
- 不 vendor 上游（SPEC § 1 集成模型 Z）
- 5 种 installer + DAG resolver + routing engine + checkpoint engine + CLI 入口（SPEC § 4）
- npm + CC marketplace 双轨发布（SPEC § 5.4）
- `npx harnessed@latest setup` 是事实标准（必备 `package.json#bin`）
- Cross-OS Day 1：mac/linux/win-native CI 矩阵（SPEC § 11、ROADMAP v0.1 phase 1.2）
- 单维护者 + bus factor 兜底（必须降低 fork / contributor 入门门槛）
- karpathy simplicity（避免不必要复杂度）

**判定原则**（出现冲突时按以下优先级）：
1. **simplicity 第一**：能用 1 个工具就不用 2 个
2. **Day 1 Cross-OS**：任何选择必须 Windows native 跑通
3. **降低 contributor 门槛**：主流 / 标准生态优先；冷门 / 大学习曲线工具拒绝
4. **npx 启动延迟可接受**：harnessed 是开发期工具，单次 setup 1-2 秒可接受，但日常调用必须 < 500ms
5. **不为虚构未来需求设计**（YAGNI）：v0.1 / v0.2 / v0.3 路径决定，v1.0 后再考虑

---

## 1. monorepo vs single package

| Option | Pros | Cons | Complexity | Recommendation |
|--------|------|------|------------|----------------|
| **Single package（一个 `harnessed`）** | 1 个 package.json，1 份 lock，1 份 CI；contributor 5 分钟 onboard；npm 发布 / 版本管理零开销；karpathy simplicity；ECC / GSD / ctx7 / create-vite 自身的 CLI 入口都是单包；`src/` 4 子目录已能容纳 installers/routing-engine/checkpoint/doctor 全部模块 | 公共类型不能独立 publish 给第三方扩展使用（v1.0+ 才考虑）；如果未来要把 schemas 单独发布需要拆包 | 影响面：repo 根 1 份 `package.json` + `tsconfig.json`；新增依赖：无 -- Risk: 几乎为零 | **强推**：v0.1-v1.0 全周期（直到第三方真要 import `@harnessed/schemas` 才拆） |
| **pnpm workspaces monorepo** | 公共类型可独立发布；理论可拆 contributor 工作；模块边界更明确 | 4 个 package.json + workspace 配置 + 4 套版本 / changelog 同步；CI 需 `pnpm -r build` + 拓扑感知；Windows + pnpm symlink 偶发权限问题；contributor 需要懂 workspace 协议；单维护者 release 4 包成本陡增；schema 改动要跨包同步发版 | 影响面：repo 根 1 份 + 4 个子 package.json + workspace 配置；新增工具：pnpm workspaces / changesets -- Risk: 单 maintainer release 摩擦、版本漂移、CI 复杂度 | **拒绝**：v0.1 没有第三方 import 需求；ECC / GSD / ctx7 等同定位项目都是单包 |
| **Turborepo monorepo** | 跨包增量构建、远程缓存（v1.0 后大型团队有用） | 同上 + 额外 turbo.json + 远程缓存账号；对单包项目纯属负担 | 同上 + 1 个新工具 + 配置文件 -- Risk: 单维护者过度工程化 | **拒绝**：bus factor 1 时 turbo 的远程缓存 / 增量价值约等于 0 |

**Rationale**：harnessed 不是 framework（如 Vite 自身需拆 `vite` + `create-vite` + `@vitejs/plugin-*`），而是 CLI orchestrator——同定位的 GSD（`get-shit-done-cc`）单包 + `bin/install.js` + 内部 `sdk/` 子目录的方案已被市场验证（4500+ commits、61.4k★）。SPEC § 4 已规划的 `src/installers/` `src/routing-engine/` `src/checkpoint/` `src/doctor/` 是**模块边界**而非**包边界**——拆包要等到 (a) 第三方真的要 `import` schemas、或 (b) maintainer 数量 ≥ 3 才有拆的收益。v0.1 拆 monorepo 100% 是 SPEC § 7 风险表"过度抽象成枷锁"的预演。**结论**：`harnessed/` 单包，`src/` 4 子目录划分模块边界。后期若需暴露 schema 给生态扩展，`exports` field 子路径导出（`harnessed/schemas`）能覆盖 90% 用例，无需拆 monorepo。

---

## 2. 包管理器（开发期）

| Option | Pros | Cons | Complexity | Recommendation |
|--------|------|------|------------|----------------|
| **pnpm 10** | content-addressable store（磁盘节省 50-70%）；strict 严格依赖（catch phantom deps）；2026 monorepo 事实标准；`packageManager` 字段 + corepack 钉死版本；CI cache 成熟（setup-node v6 内置）；65M weekly downloads；Windows native 稳定 | symlink 在 Windows 老版本上偶发权限问题（已基本修复）；新 contributor 要 `corepack enable`（一行命令） | 影响面：1 份 `pnpm-lock.yaml` + `packageManager: "pnpm@10.x"` 字段；CI：`pnpm/action-setup@v6` -- Risk: 新 contributor 0.5 分钟学习成本 | **推荐默认**：单包也用 pnpm（lock 文件确定性 + corepack pin + 未来如真拆 workspaces 平滑过渡） |
| **npm 11** | Node 自带零配置；`min-release-age` 与 `npm trust` 是 2026 供应链硬化亮点；contributor 0 学习成本 | install 速度最慢（小项目无感）；workspaces 功能落后 pnpm；store 不去重 | 影响面：1 份 `package-lock.json` -- Risk: 几乎为零 | **次选**：如果担心 contributor 学习曲线（bus factor 1 极致兜底） |
| **bun** | 1.3 install 最快；catalog / interactive updates 体验好 | 需要装 Bun runtime；harnessed 用户绝大多数是 Node.js（CC 用户基数）；偶发 Node 兼容性边界；CI Windows native 比 pnpm 略慢成熟 | 影响面：要求 contributor 装 Bun -- Risk: 提高 contributor 门槛，违反 bus factor 兜底 | **拒绝**：harnessed 项目的 USP 之一是"100% CC 用户已有 Node 环境"，自身却用 Bun 自相矛盾 |
| **yarn 4** | constraints 系统强；Berry PnP 存在感 | PnP 兼容性持续踩坑；Yarn 1 用户多但 Yarn 4 学习曲线陡；2026 已经被 pnpm 完全压制 | 影响面：1 份 `.yarnrc.yml` + `yarn.lock` -- Risk: 学习曲线 + 生态摩擦 | **拒绝**：无明显优势 |

**Rationale**：pnpm 在 2026 已是 Node monorepo / 大型项目事实标准（最稳妥的"主流默认"），用 `corepack` + `packageManager: "pnpm@10.x"` 字段钉死版本可让 contributor 不需要全局装 pnpm（`corepack enable` 一行就够），完全消除"学习曲线"反对意见。对单包项目同样有 lock-file 确定性 + 严格依赖 + setup-node 内置 cache 收益。bun 的速度优势在 v0.1 体量（< 30 直接依赖）下绝对值可忽略，且违反 SPEC § 1 "用户 100% 有 Node" 的设计契约——harnessed 自己用 Bun = 给上游设了个 Bun 依赖暗坑。**结论**：pnpm 10 + corepack 钉版本。

---

## 3. TS 构建工具

| Option | Pros | Cons | Complexity | Recommendation |
|--------|------|------|------------|----------------|
| **tsup（esbuild backbone）** | 零配置默认全对（ESM + CJS + .d.ts + 自动 shebang chmod +x）；6M weekly；esbuild 速度（45x faster than tsc 冷构建）；TypeScript starter templates 默认；自动 externalize package.json deps；npm 发布约定全包（exports / types / sourcemap）；shebang 自动 chmod 解决 GSD issue #2453 那种"dist/cli.js mode 644"事故 | 不做类型检查（要 tsc 单独 pass）；Rolldown 后继 tsdown 已发布但还在 ramp-up | 影响面：1 份 `tsup.config.ts`（< 30 行）+ npm script `tsc --noEmit && tsup` -- Risk: 自动 chmod 必须 verify 一次 Windows native 不出错 | **强推**：v0.1-v1.0 默认；karpathy simplicity 完美命中 |
| **tsc 单独** | 零额外依赖；纯 ESM 出口最干净；contributor 心智模型最简单 | 不做 bundle = 用户 `npx harnessed` 时要 import 几十个 files（Node module resolution 瀑布）；npm install 后包里 100+ 个 .js（用户 disk 体感差）；自动 shebang + chmod 要自己写 postbuild 脚本（GSD issue #2453 教训）；冷启动慢 25-30%（实测 ~1.30s vs bundled ~0.94s） | 影响面：1 份 `tsconfig.json` -- Risk: 冷启动慢 + 手动 chmod | **拒绝**：harnessed 是 CLI（npx 启动延迟敏感），bundle 一定划算 |
| **unbuild** | UnJS 生态；stub mode（无需 watch 即时热更）；多 preset | 生态规模小于 tsup；学习曲线非零；harnessed 不在 UnJS 圈 | 影响面：1 份 `build.config.ts` -- Risk: 生态小、bus factor 风险 | **拒绝**：tsup 已覆盖所有需求 |
| **tsdown（Rolldown 后继）** | 比 tsup 快；接口几乎一致；2026 趋势 | 仍在 ramp-up（API 偶有 break）；社区规模 < tsup 1/10 | 影响面：1 份 config -- Risk: 早期采用者风险 | **延后评估**：v0.4 稳定期再考虑迁移（迁移成本几乎为零） |
| **esbuild 直调** | 最薄抽象；最快 | 要自己写 declaration 生成 / dual format / externalize / shebang chmod 全套 | 影响面：1 份 build script + 多个粘合代码 -- Risk: 自己维护一堆 corner case | **拒绝**：tsup 已经是 esbuild + 这些约定的零配置封装 |

**Rationale**：harnessed 是 CLI（`npx harnessed@latest setup` 是 USP），bundle 减少 25-30% 冷启动是用户可感知差异；tsup 自动 shebang + chmod 直接规避 GSD issue #2453 那种"tsc 输出 mode 644 无 +x → 用户 install 完 binary 不可执行"事故（Cross-OS Day 1 必须严防）。tsup 同时是 npm `exports` field / dual ESM+CJS / `.d.ts` 生成的零配置默认。**类型检查与构建分离**：build pipeline = `tsc --noEmit`（type check，慢但严格）+ `tsup`（emit，快），CI 跑全套，本地 watch 用 `tsup --watch` + `tsc --noEmit --watch` 并行。**ESM 决策**：Node 22+ 已支持 CJS sync require ESM，且 harnessed 是 CLI 终端产品（无下游 require 它），**纯 ESM 输出**（`type: "module"`），bin 指 `.mjs`，exports field 不写 require 条件，最简最干净。**结论**：tsup（esbuild 后端）+ pure ESM + `tsc --noEmit` 类型守门。

---

## 4. 测试框架

| Option | Pros | Cons | Complexity | Recommendation |
|--------|------|------|------------|----------------|
| **vitest 4** | 原生 ESM + TS 零配置；Jest 95% API 兼容；3-5x faster than Jest；watch mode + UI；coverage（v8）开箱即用；snapshot / fixture 成熟；vitest 4.1 浏览器测试（不影响 CLI 但选项保留）；与 tsup 共生态（esbuild 同源） | 多一个 dev 依赖（vitest + @vitest/coverage-v8） | 影响面：1 份 `vitest.config.ts` + `tests/` 目录 -- Risk: 几乎为零，主流默认 | **强推**：v0.1-v1.0 默认；TDD-friendly + watch UX 最好 |
| **node:test (Node 20+ built-in)** | 0 dependency；Node 自带；karpathy 极致 simplicity；启动快；Node 23 起有 watch mode | 缺 snapshot；coverage UI 弱（`node --experimental-test-coverage`）；mocking 需自手写或额外库（`mock-import`）；fixture 体系不成熟；社区 examples 少；bus factor 敏感的工具链（contributor 默认懂 vitest）；Node 22 LTS 还没全部稳定 watch | 影响面：1 份 `package.json#scripts.test` + tests 目录 -- Risk: snapshot / mocking 时切其他工具的迁移成本 | **次选**：如果项目极少 mock + 不用 snapshot（harnessed 安装器测试有大量 fixture，所以不适合） |
| **jest 30** | 业界存量最大；React Native 必须 | TypeScript + ESM 配置坑多（ts-jest / babel-jest 一堆）；启动慢；harnessed 不需要 Jest 生态特定优势 | 影响面：jest.config + ts-jest + 多个粘合 -- Risk: 配置复杂 + 启动慢 | **拒绝**：vitest 已完全替代 |

**Rationale**：harnessed 测试需求 = installer 集成测试 + DAG resolver 单测 + routing engine 单测 + schema 校验单测 + checkpoint 状态机单测——其中**安装器和 routing 测试有大量 fixture**（mock manifest 文件、模拟 npm/git 命令输出、snapshot 期望产物路径），node:test 在 fixture / snapshot / mock 维度都吃力，自手写工具链违反 simplicity。Vitest 4 与 tsup 共享 esbuild 内核，配置 1 文件 < 20 行，TDD 时 watch + UI 是 superpowers TDD skill 的最佳载体。**结论**：vitest 4 + @vitest/coverage-v8。

---

## 5. CLI 框架

| Option | Pros | Cons | Complexity | Recommendation |
|--------|------|------|------------|----------------|
| **commander** | 152.5M weekly（CLI 框架第一）；零依赖；启动 ~25ms（最快全功能 CLI 框架）；Git-style subcommand 一等公民；health 85/100；ECC / 多数主流 CLI 默认；help 文本自动生成；TS 类型完备；ESM + CJS 双发 | 自带 type coercion 与 typo suggestion 弱（要自手写） | 影响面：1 个依赖；`src/cli.ts` 中 `program.command('setup').action(...)` -- Risk: 几乎为零 | **强推**：6 个 subcommand 完美匹配（setup / install / doctor / audit / status / resume） |
| **cac** | 5KB minified；TS 内建；启动最快 | 生态比 commander 小；中文文档少；contributor 学习曲线非零（虽然简单） | 影响面：1 个依赖 -- Risk: 选择小众工具的 bus factor 风险 | **次选**：bundle size 极致敏感时（harnessed 不敏感） |
| **clipanion** | yarn 用过；class-based 类型安全；零依赖 | class-based 风格与 harnessed 函数式风格不符；contributor 学习曲线最高；plugin lazy loading 是 yarn 那种规模才需要 | 影响面：1 个依赖 + class 风格代码 -- Risk: 风格不一致 + 学习曲线 | **拒绝** |
| **yargs** | 验证 / middleware / shell completion 内建；80M weekly | 启动慢（48ms vs commander 25ms）；包大（67.8KB gzipped）；nested callback 风格；health 67/100；维护活跃度低（40/100） | 影响面：1 个依赖 -- Risk: 启动延迟 + 维护活跃度 | **拒绝**：feature 过剩 + 启动慢 |
| **自手写 process.argv 解析** | 0 依赖 | 6 subcommand + help + flags + positional args 自手写 ≈ 重新发明 commander | 影响面：自维护 100+ 行解析逻辑 -- Risk: 重复造轮子，违反 simplicity | **拒绝** |

**Rationale**：harnessed CLI 至少 6 个 subcommand（setup / install / doctor / audit / status / resume），加上 v0.2+ 可能新增 upgrade / resume / log——明显的 Git-style subcommand 树，commander 的零依赖 + 25ms 启动 + 152.5M weekly 是"最主流默认"完美命中。commander 的 `program.command(...).description(...).action(...)` 链式 API 与 harnessed 函数式风格无缝。**结论**：commander。

---

## 6. lint / format

| Option | Pros | Cons | Complexity | Recommendation |
|--------|------|------|------------|----------------|
| **biome 2** | 单一工具（lint + format）；10-20x faster than ESLint；零配置默认全对；type-aware 75-85% 覆盖（v2 新增 noFloatingPromises 等）；YAML/JSON/TS 一锅端；contributor `biome check --write` 一条命令；karpathy simplicity；pre-commit hook < 1s（单维护者必须快） | 部分 ESLint plugin 没移植（next.js 等，但 harnessed 不是 Next.js）；type-aware 覆盖 75-85% 有边界 | 影响面：1 份 `biome.json`（< 30 行）+ 1 个依赖 -- Risk: type-aware 边缘 case 偶发漏报（可叠 oxlint 兜底，但 v0.1 不需要） | **强推**：v0.1-v1.0 默认 |
| **eslint + prettier + @typescript-eslint** | 700+ rules + 4000+ plugins；React/Next/Vue 生态完备；type-aware 最成熟（no-floating-promises 等） | 3 个工具配置（eslint + prettier + typescript-eslint）；启动 / CI 慢 15-50x；contributor 配置心智重；commit hook 时间长 | 影响面：4-5 个依赖 + 3 份 config -- Risk: 维护负担 + 速度 | **拒绝**：harnessed 不是 React/Next 项目，不需要 ESLint plugin 生态 |
| **oxlint（OXC）** | Rust，最快（2x faster than biome）；VoidZero 背书 | linting only（仍需 prettier 格式化）；rule 覆盖 ~300 还在 ramping | 影响面：1 个依赖 -- Risk: 必须配 formatter 形成两工具链 | **拒绝**（v0.1）：单工具 vs 两工具，simplicity 优先 biome；v0.4 稳定期可考虑 dual-linter（oxlint 预过滤 + biome）模式 |

**Rationale**：harnessed 是 CLI orchestrator（无 React / 无 Next.js），ESLint 4000+ plugin 生态价值约等于 0；single-tool biome 是 karpathy simplicity 与单维护者 commit hook 速度的双优解。biome v2 已能 type-aware 检查 noFloatingPromises 等关键 async 规则——routing engine + checkpoint 大量 async 代码，正好命中 biome 强项。**结论**：biome 2，单工具同时承担 lint + format + import sort。

---

## 综合推荐（一行陈述）

**harnessed v0.1 工具链**：单包 + pnpm 10（corepack pin）+ pure ESM tsup 构建（`tsc --noEmit` 类型守门）+ vitest 4 测试 + commander CLI + biome 2 lint+format，全部跑在 GitHub Actions cross-OS 矩阵（mac/linux/windows native × Node 22 LTS）。

---

## 推荐 package.json 模板（ready-to-use）

```json
{
  "name": "harnessed",
  "version": "0.1.0-alpha.1",
  "description": "AI coding harness package manager + composition orchestrator",
  "type": "module",
  "license": "Apache-2.0",
  "repository": {
    "type": "git",
    "url": "https://github.com/<owner>/harnessed.git"
  },
  "homepage": "https://github.com/<owner>/harnessed#readme",
  "bugs": "https://github.com/<owner>/harnessed/issues",
  "keywords": [
    "claude-code",
    "ai-harness",
    "package-manager",
    "composition",
    "skill-pack",
    "mcp",
    "orchestrator"
  ],
  "engines": {
    "node": ">=22.0.0"
  },
  "packageManager": "pnpm@10.12.0",
  "bin": {
    "harnessed": "./dist/cli.mjs"
  },
  "main": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "default": "./dist/index.mjs"
    },
    "./schemas": {
      "types": "./dist/schemas/index.d.ts",
      "import": "./dist/schemas/index.mjs"
    },
    "./package.json": "./package.json"
  },
  "files": [
    "dist",
    "manifests",
    "workflows",
    "routing",
    "config-templates",
    "schemas",
    "README.md",
    "LICENSE",
    "NOTICE"
  ],
  "scripts": {
    "dev": "tsup --watch",
    "build": "pnpm run typecheck && tsup",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "lint": "biome check .",
    "lint:fix": "biome check --write .",
    "format": "biome format --write .",
    "validate-schemas": "node ./scripts/validate-schemas.mjs",
    "prepublishOnly": "pnpm run lint && pnpm run typecheck && pnpm run test && pnpm run build && pnpm run validate-schemas && publint && attw --pack .",
    "release": "changeset publish"
  },
  "dependencies": {
    "commander": "^13.0.0",
    "ajv": "^8.17.1",
    "ajv-formats": "^3.0.1",
    "yaml": "^2.7.0",
    "execa": "^9.5.0",
    "kleur": "^4.1.5",
    "prompts": "^2.4.2"
  },
  "devDependencies": {
    "@biomejs/biome": "^2.0.0",
    "@types/node": "^22.10.0",
    "@types/prompts": "^2.4.9",
    "@vitest/coverage-v8": "^2.1.0",
    "@arethetypeswrong/cli": "^0.17.0",
    "publint": "^0.3.0",
    "tsup": "^8.3.0",
    "typescript": "^5.6.0",
    "vitest": "^4.1.0",
    "@changesets/cli": "^2.27.0"
  }
}
```

**注释**：
- `engines.node: ">=22.0.0"`：v0.1 锁 Node 22 LTS（2027-04 EOL），消除 ESM/CJS 互操作历史包袱；用户 < 22 直接 fail-fast
- `packageManager` + corepack：contributor `corepack enable` 一行即可，无需全局装 pnpm
- 纯 ESM `bin → .mjs`：Node 22+ 已无技术原因保留 CJS
- `exports."./schemas"`：未来第三方 import schemas 不需要拆 monorepo（YAGNI 兜底）
- `files`：只发 dist + 用户运行时需要的 markdown 资源（manifests/workflows/routing/templates/schemas）
- `prepublishOnly`：`publint` + `@arethetypeswrong/cli`（发布前 lint package.json 与 types 配置——industry 2026 标配）
- 最小 runtime deps：commander（CLI）+ ajv（JSON schema）+ yaml（配置/manifest）+ execa（跨 OS 子进程，Windows 兼容自动）+ kleur（无依赖颜色）+ prompts（轻量交互）

---

## 推荐 tsconfig.json 模板（ready-to-use）

```jsonc
{
  "compilerOptions": {
    /* Node 22 LTS target */
    "target": "ES2023",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2023"],

    /* 输出策略：tsc 只做类型检查，emit 由 tsup 负责 */
    "noEmit": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,

    /* 严格模式全开 */
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "noPropertyAccessFromIndexSignature": false,

    /* 互操作 */
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "allowImportingTsExtensions": false,

    /* 类型生成（tsup 调用 tsc 来 emit .d.ts，这里不生效） */
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,

    /* 路径与根 */
    "rootDir": "./src",
    "baseUrl": "./",
    "paths": {
      "@/*": ["./src/*"]
    },

    /* 编辑器体验 */
    "incremental": true,
    "tsBuildInfoFile": "./.tscache/tsbuildinfo"
  },
  "include": ["src/**/*", "scripts/**/*", "tests/**/*"],
  "exclude": ["dist", "node_modules", ".harnessed", "vendor"]
}
```

**关键点**：
- `module: "NodeNext"` + `moduleResolution: "NodeNext"`：Node 22 ESM 标准
- `noEmit: true`：tsc 只跑类型检查，dist/ 由 tsup emit
- `verbatimModuleSyntax: true`：阻止隐式 type-only import 自动转换（避免 ESM 出错）
- `noUncheckedIndexedAccess: true`：installer 对 manifest 字段的 `obj[key]` 访问会被检查
- `incremental` + `.tscache/`：本地 watch 二次类型检查 < 1s

---

## 推荐 tsup.config.ts（ready-to-use）

```ts
// tsup.config.ts
import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    cli: "src/cli.ts",
    "schemas/index": "src/schemas/index.ts",
  },
  format: ["esm"],
  target: "node22",
  outDir: "dist",
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
  minify: false,                  // CLI 体积非瓶颈，保留可读性方便调试
  shims: false,                   // 纯 ESM 无需 shim
  platform: "node",
  external: [
    // peer 不打包；commander/ajv 等 runtime deps 由 tsup 自动从 package.json 识别
  ],
});
```

**`src/cli.ts` 顶部必须**：

```ts
#!/usr/bin/env node
import { Command } from "commander";
// ... 实际 CLI 逻辑
```

tsup 会自动识别 shebang + `chmod +x dist/cli.mjs`（直接规避 GSD issue #2453 教训）。

---

## 推荐 biome.json（ready-to-use）

```jsonc
{
  "$schema": "https://biomejs.dev/schemas/2.0.0/schema.json",
  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "useIgnoreFile": true
  },
  "files": {
    "ignore": ["dist", "node_modules", ".harnessed", "vendor", "*.snap"]
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100,
    "lineEnding": "lf"
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "correctness": {
        "noUnusedVariables": "error",
        "noUnusedImports": "error",
        "useExhaustiveDependencies": "off"
      },
      "suspicious": {
        "noExplicitAny": "error",
        "noFloatingPromises": "error"
      },
      "style": {
        "useImportType": "error",
        "useNodejsImportProtocol": "error",
        "useTemplate": "warn"
      }
    }
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "semicolons": "asNeeded",
      "trailingCommas": "all",
      "arrowParentheses": "always"
    }
  },
  "json": {
    "formatter": {
      "trailingCommas": "none"
    }
  }
}
```

**`useNodejsImportProtocol`**：强制 `import fs from "node:fs"` 而不是 `"fs"`，与 `verbatimModuleSyntax` 配合，避免 bundler 误识别。

---

## CI 矩阵骨架（GitHub Actions）

`.github/workflows/ci.yml`：

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

# 防止 stale 长跑：commit 新提交立刻取消旧 run
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: ${{ github.event_name == 'pull_request' }}

permissions:
  contents: read

jobs:
  ci:
    name: ${{ matrix.os }} / Node ${{ matrix.node }}
    runs-on: ${{ matrix.os }}
    strategy:
      fail-fast: false              # 跨 OS 调试时必须见全失败矩阵
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
        node: [22]                  # v0.1 锁 22 LTS；v0.4 起增加 24 LTS
    steps:
      - uses: actions/checkout@v6

      # corepack 直接读 package.json#packageManager 字段装对版本 pnpm
      - name: Enable corepack
        run: corepack enable

      - name: Setup Node ${{ matrix.node }}
        uses: actions/setup-node@v6
        with:
          node-version: ${{ matrix.node }}
          cache: "pnpm"

      - name: Install (frozen)
        run: pnpm install --frozen-lockfile

      - name: Typecheck
        run: pnpm typecheck

      - name: Lint
        run: pnpm lint

      - name: Test
        run: pnpm test:coverage

      - name: Build
        run: pnpm build

      - name: Verify CLI runs (cross-OS shebang + chmod sanity)
        shell: bash
        run: |
          node ./dist/cli.mjs --version
          node ./dist/cli.mjs --help

      - name: Pack and validate (publint + attw)
        if: matrix.os == 'ubuntu-latest' && matrix.node == 22
        run: |
          pnpm pack
          pnpm dlx publint
          pnpm dlx @arethetypeswrong/cli --pack .

      - name: Upload coverage (one OS only)
        if: matrix.os == 'ubuntu-latest' && matrix.node == 22
        uses: actions/upload-artifact@v4
        with:
          name: coverage
          path: coverage/

  # weekly 上游漂移检测（v0.1 占位，v0.2+ 实装 manifest.lock 检查）
  upstream-drift:
    name: Weekly upstream drift check
    runs-on: ubuntu-latest
    if: github.event_name == 'schedule'
    steps:
      - uses: actions/checkout@v6
      - run: echo "Upstream drift CI placeholder; see SPEC section 5.5"
```

**亮点**：
- `concurrency.cancel-in-progress` 仅 PR 取消，main push 不取消（保留主干审计）
- `fail-fast: false`：cross-OS 必见全失败（SPEC red flag 6 + ROADMAP v0.1 风险表）
- 显式 `node ./dist/cli.mjs --version` 步骤验证 cross-OS shebang + chmod 真的生效
- `publint` + `@arethetypeswrong/cli` 在 Ubuntu+Node22 跑一次（避免三平台跑 4 次浪费）
- weekly drift job 保留接口给 SPEC § 5.5 上游 lock CI

---

## 信息来源（URL）

- pnpm vs npm vs yarn vs bun 2026 — [DEV](https://dev.to/pockit_tools/pnpm-vs-npm-vs-yarn-vs-bun-the-2026-package-manager-showdown-51dc) / [Better Stack](https://betterstack.com/community/guides/scaling-nodejs/pnpm-vs-bun-install-vs-yarn/) / [pkgpulse 2026](https://www.pkgpulse.com/guides/pnpm-vs-bun-2026)
- tsup vs unbuild vs tsc 2026 — [pkgpulse](https://www.pkgpulse.com/guides/tsup-vs-tsdown-vs-unbuild-typescript-library-bundling-2026) / [LogRocket tsup](https://blog.logrocket.com/tsup/) / [tsup 官方](https://tsup.egoist.dev/) / [Liran Tal: TS in 2025](https://lirantal.com/blog/typescript-in-2025-with-esm-and-cjs-npm-publishing) / [johnnyreilly dual publishing](https://johnnyreilly.com/dual-publishing-esm-cjs-modules-with-tsup-and-are-the-types-wrong)
- vitest vs node:test vs jest 2026 — [pkgpulse](https://www.pkgpulse.com/blog/node-test-vs-vitest-vs-jest-native-test-runner-2026) / [Speakeasy](https://www.speakeasy.com/blog/vitest-vs-jest) / [Vitest 官方对比](https://vitest.dev/guide/comparisons.html)
- commander vs yargs vs cac vs clipanion 2026 — [Stricli alternatives](https://bloomberg.github.io/stricli/docs/getting-started/alternatives) / [Grizzly Peak](https://www.grizzlypeaksoftware.com/library/cli-framework-comparison-commander-vs-yargs-vs-oclif-utxlf9v9) / [pkgpulse](https://www.pkgpulse.com/blog/how-to-build-cli-nodejs-commander-yargs-oclif) / [npm-compare](https://npm-compare.com/commander,oclif,vorpal,yargs)
- biome vs eslint vs oxlint 2026 — [pkgpulse biome vs oxc](https://www.pkgpulse.com/guides/biome-vs-oxc-2026) / [pkgpulse oxc vs eslint vs biome](https://www.pkgpulse.com/blog/oxc-vs-eslint-vs-biome-javascript-linting-2026) / [Better Stack biome vs eslint](https://betterstack.com/community/guides/scaling-nodejs/biome-eslint/)
- esbuild / npx 启动延迟 — [esbuild FAQ](https://esbuild.github.io/faq/) / [Medium ESBuild SWC TSC 2026](https://medium.com/@mernstackdevbykevin/esbuild-swc-and-tsc-which-compiler-should-you-use-in-2026-a2df3c783ad2) / [pi-mono CLI bundling proposal](https://github.com/badlogic/pi-mono/issues/2522) / [pkgpulse tsx vs ts-node](https://www.pkgpulse.com/guides/tsx-vs-ts-node-vs-bun-running-typescript-directly-2026)
- GitHub Actions matrix + pnpm — [pnpm CI docs](https://pnpm.io/continuous-integration) / [actions/setup-node](https://github.com/actions/setup-node) / [pnpm/action-setup](https://github.com/pnpm/action-setup) / [OneUptime matrix 2026](https://oneuptime.com/blog/post/2026-02-02-github-actions-matrix-builds/view)
- GSD CLI 单包参照 — [npm get-shit-done-cc](https://www.npmjs.com/package/get-shit-done-cc) / [DeepWiki gsd-build/get-shit-done](https://deepwiki.com/gsd-build/get-shit-done) / [GSD bin/install.js](https://github.com/gsd-build/get-shit-done/blob/main/bin/install.js) / [GSD issue #2453（chmod 教训）](https://github.com/gsd-build/get-shit-done/issues/2453)
- create-vite / Vite 仓库参照 — [Vite getting started](https://vite.dev/guide/) / [DeepWiki vitejs/vite monorepo structure](https://deepwiki.com/vitejs/vite/2-monorepo-structure-and-packages)
- Node 22 ESM/CJS 现状 — [@tsconfig/node22](https://www.npmjs.com/package/@tsconfig/node22) / [pkgpulse ESM migration 2026](https://www.pkgpulse.com/guides/esm-migration-guide-commonjs-to-esm-2026)
