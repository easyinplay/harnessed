# Phase 1.2 Task Plan (planning-with-files 主计划)

> **状态**：ready for execute-phase
> **维护规则**：每完成一个 task → 勾选 + 同步 `progress.md`（追加 ISO 日期 + task ID + 简短结果 + commit short-hash）
> **决策回溯**：所有 "为什么这么做" 的疑问 → 查 `PLAN.md` § 7-8 / `docs/adr/{0001,0002,0003,0004}` / `phase-1.2/{ASSUMPTIONS, GRAY-AREA-1, GRAY-AREA-2, PATTERNS}.md`
> **执行策略**：每个 task 完成后 commit；commit message 格式 `phase-1.2: T<N>.<M> <action>`；建议每个子任务用 `/ralph-loop` 包裹直到输出 COMPLETE
> **总规模**：37 atomic 子任务 / 7 wave / 预计 2-3 周

---

## Phase 1.2 Acceptance Bar (verify before mark phase done)

(来自 PLAN.md § 4.1 — 必须全部 ✅)

- [ ] **B1'** 3 平台真实可装 ctx7 + dry-run UX 跑通（mac/linux/win）
- [ ] **B2'** tavily-mcp + exa-mcp 真实可装 + `--scope project` 写到 `.mcp.json`
- [ ] **B3'** Rollback 验证：install + rollback 后系统状态完全恢复（含 .mcp.json 复原 + CRLF/LF preserve）
- [ ] **B4'** 12 contract tests 全绿（6 契约 × 2 method）
- [ ] **B5'** Cross-OS CI 三平台保持全绿（A4 守恒）
- [ ] **B6'** Tests 数 ≥ 110（89 baseline + 12 contract + ~10 install unit + ~5 doctor/audit unit + ~3 schema marketplace_source）
- [ ] **B7'** ADR 0001/0002/0003/0004 main body 不动（A7 守恒，CI 自动 enforce）
- [ ] **B8'** `harnessed doctor` 检测 ralph-loop Win 依赖（jq + Git Bash vs WSL）
- [ ] **B9'** `INSTALLER-CONTRACT.md` ≥ 100 行 + 6 契约逐条说明 + FAQ

---

## Task Graph

### Wave 0 — 前置（依赖修复 + 必修 manifest + 条件 ADR）

#### T1.1 加 3 个 deferred deps（picocolors / diff / @clack/prompts）+ pnpm install
- [ ] **目标**：装 GA-2 § B 选定的 CLI lib 三件套
- **文件**：`/d/GitCode/harnessed/package.json` deps 块
- **命令 / 内容**：
  ```bash
  cd /d/GitCode/harnessed
  corepack pnpm add picocolors@^1.1.0 diff@^9.0.0 @clack/prompts@^0.10.0
  corepack pnpm install
  ```
- **验收**：
  - [ ] `package.json` `dependencies` 含 picocolors / diff / @clack/prompts 三个
  - [ ] `pnpm-lock.yaml` 更新；`corepack pnpm typecheck` 0 错误
  - [ ] 总 install size 增 ~250KB（picocolors 7 + diff 30 + clack 200 含子 dep）
- **决策来源**：GA-2 § "Ready-to-use package.json deps" + ADR 0002 § ESM-only

---

#### T1.2 起草 ADR 0005 errata（marketplace_source schema 加 optional 字段）+ accept
- [ ] **目标**：A7 守恒（不动 ADR 0001 main body）下，给 phase 2.1 cc-plugin-marketplace installer 备好 schema 字段
- **文件**：`/d/GitCode/harnessed/docs/adr/0005-marketplace-source-schema-errata.md`
- **内容大纲**：
  - Status: Accepted 2026-MM-DD
  - Context: GA-1 § Phase 1.1 manifest fix needed — planning-with-files NOT in claude-plugins-official，需要 third-party marketplace 2-step add+install；ADR 0001 schema 缺该字段
  - Decision: 加 optional `install.marketplace_source: { source: 'github', repo: '<owner>/<repo>' }` 字段；仅 cc-plugin-marketplace method；official 上游可省略
  - Consequences: phase 1.2 仅 schema 加字段（不实装 installer 代码）；phase 2.1 cc-plugin-marketplace installer 消费该字段
  - Compliance: ADR 0001 main body 不动（A7 守恒）；fixture-driven validate test 自动覆盖
  - References: GA-1 § "Phase 1.1 manifest fix needed"、ADR 0001、ADR 0003、phase-1.1 progress.md F20
- **同步**：更新 `docs/adr/README.md` index（加 0005 行）
- **验收**：
  - [ ] ADR 0005 文件 ≥ 60 行
  - [ ] `docs/adr/README.md` 含 0005 链接
  - [ ] `git diff adr-0001-accepted -- docs/adr/0001-*.md` 输出空（A7 守恒）
- **决策来源**：GA-1 § Recommendation + ASSUMPTIONS A8 + phase-1.1 ADR 0003 errata 风格

---

#### T1.3 schema 实装：ccPluginMarketplace.ts 加 optional `marketplace_source` 字段
- [ ] **目标**：让 third-party marketplace（OthmanAdi 类）能在 manifest 中声明 source；phase 1.2 不实装 cc-plugin-marketplace installer 代码（推 phase 2.1）
- **文件**：`/d/GitCode/harnessed/src/manifest/schema/installMethods/ccPluginMarketplace.ts`
- **内容**：在现有 schema 加 optional 字段（不破坏 backward compat）：
  ```typescript
  // 现有字段保留 ...
  // 新加（optional，official 上游省略）：
  marketplace_source: Type.Optional(Type.Object({
    source: Type.Literal('github'),  // v0.1 仅 github；v0.2+ 加 gitlab / direct-url
    repo: Type.String({ pattern: '^[a-zA-Z0-9_.-]+/[a-zA-Z0-9_.-]+$', minLength: 3 }),
  }, { additionalProperties: false })),
  ```
- **后置命令**：
  ```bash
  cd /d/GitCode/harnessed
  corepack pnpm build:schema  # 重新生成 schemas/manifest.v1.schema.json artifact
  ```
- **验收**：
  - [ ] `corepack pnpm typecheck && corepack pnpm lint` 0 错误
  - [ ] `schemas/manifest.v1.schema.json` 重新生成；含 `marketplace_source` 在 cc-plugin-marketplace allOf 分支
  - [ ] `git diff adr-0001-accepted -- docs/adr/0001-*.md` 输出空（A7 守恒）
- **决策来源**：ADR 0005 + GA-1 § "schema-extension and manifest-fix coupled commit"

---

#### T1.4 修复 manifests/skill-packs/planning-with-files.yaml + 同步 fixture
- [ ] **目标**：planning-with-files 是 third-party marketplace（不在 claude-plugins-official）；phase 1.1 manifest 当前缺 marketplace_source 字段
- **文件**：
  - `/d/GitCode/harnessed/manifests/skill-packs/planning-with-files.yaml`
  - `/d/GitCode/harnessed/tests/fixtures/manifests/valid/planning-with-files.yaml`（同步）
- **内容修改**：在 `spec.install` 块加：
  ```yaml
  spec:
    install:
      method: cc-plugin-marketplace
      cmd: "/plugin marketplace add OthmanAdi/planning-with-files && /plugin install planning-with-files@planning-with-files"
      git_ref: v2.37.0
      idempotent_check: "/plugin list | grep -q planning-with-files"
      marketplace_source:        # 新加 — ADR 0005
        source: github
        repo: OthmanAdi/planning-with-files
  ```
- **后置命令**：
  ```bash
  cd /d/GitCode/harnessed
  corepack pnpm test  # fixture-driven test 自动验证 valid/planning-with-files.yaml 仍通过
  git ls-files --eol manifests/skill-packs/planning-with-files.yaml  # 应输出 i/lf
  ```
- **验收**：
  - [ ] 两文件（manifest + fixture）字段同步
  - [ ] `corepack pnpm test -- --filter fixtures` 全绿（10 manifest fixture 全 pass）
  - [ ] LF 行尾保持（A8 守恒）
  - [ ] yaml 注释 H5（"NOTE: spec.install.cmd is a Claude Code REPL slash command..."）保留 — F20 仍 valid（cc-plugin-marketplace installer 推 phase 2.1）
- **决策来源**：GA-1 § "Phase 1.1 manifest fix needed" + ADR 0005 + phase-1.1.1 H4 manifest+fixture 同步风格

---

#### T1.5 加 marketplace_source schema unit test（≥ 3 tests）
- [ ] **目标**：覆盖 ADR 0005 字段约束 — official 上游可省略 / OthmanAdi 写正确 / source: 'gitlab' 非 github reject
- **文件**：`/d/GitCode/harnessed/tests/unit/manifest-validate.marketplace-source.test.ts`
- **内容**（BASE template + with* modifier 风格 — Pattern J）：
  - test 1: cc-plugin-marketplace manifest **省略** marketplace_source → pass（official 上游 like ralph-loop / superpowers）
  - test 2: cc-plugin-marketplace manifest **含正确** `marketplace_source: { source: github, repo: "OthmanAdi/planning-with-files" }` → pass
  - test 3: cc-plugin-marketplace manifest **含 invalid** `marketplace_source: { source: 'gitlab', repo: "..." }` → reject（const 'github' 限制）
  - test 4: cc-plugin-marketplace manifest **含 invalid** `marketplace_source: { source: 'github', repo: "no-slash" }` → reject（pattern 限制）
  - test 5: 非 cc-plugin-marketplace method（如 npm-cli）声明 marketplace_source → reject（additionalProperties: false on npmCli schema）
- **验收**：
  - [ ] tests 89 → ≥ 92（+3 至少）
  - [ ] 每 test assert path-substring + keyword（`required` / `enum` / `pattern` / `additionalProperties`）
- **决策来源**：Pattern J + GA-1 § "Phase 1.1 manifest fix needed" 校验需求

---

### Wave 1 — Lib helpers L0 类型基座（无依赖；Wave 0 完成后启动）

#### T2.1 写 src/installers/lib/types.ts
- [ ] **目标**：建立 phase 1.2 全 installer 类型基座 — 一处 import，全 phase 复用
- **文件**：`/d/GitCode/harnessed/src/installers/lib/types.ts`
- **内容大纲**（~50 行）：
  ```typescript
  // src/installers/lib/types.ts
  // Re-export Manifest from manifest layer (Pattern F)
  // Define InstallContext / InstallResult / InstallError / Level
  
  import type { Manifest } from '../../manifest/schema/types.js'
  import type { ValidationError } from '../../manifest/errors.js'
  
  export type Level = 'L1' | 'L2' | 'L3' | 'L4'
  
  export interface InstallOpts {
    apply: boolean         // false = dry-run (default)
    dryRun: boolean        // explicit dry-run flag
    system: boolean        // L4 explicit flag
    nonInteractive: boolean
    fullDiff: boolean      // expand > 200L diff
    color: boolean | 'auto'
  }
  
  export interface InstallContext {
    manifest: Manifest
    opts: InstallOpts
    level: Level
    cwd: string            // user project root
  }
  
  // Pattern E: extend ValidationError with installer-specific fields
  export interface InstallError extends ValidationError {
    installer?: 'npm-cli' | 'mcp-stdio-add' | 'cc-plugin-marketplace' | 'git-clone-with-setup' | 'npx-skill-installer' | 'mcp-http-add'
    suggest?: string       // executable fix command (ADR 0004 contract 6)
  }
  
  // Pattern C: discriminated Result
  export type InstallResult =
    | { ok: true; backupId: string; appliedFiles: string[] }
    | { ok: false; phase: 'preflight' | 'dry-run' | 'confirm' | 'spawn' | 'verify' | 'rollback'; error: InstallError; backupId?: string }
    | { aborted: true; reason: 'user-cancel' | 'level-flag-missing' | 'platform-mismatch' }
  
  export type Installer = (ctx: InstallContext) => Promise<InstallResult>
  
  // re-export Manifest for downstream files
  export type { Manifest }
  ```
- **验收**：
  - [ ] `corepack pnpm typecheck` 0 错误
  - [ ] 在 src/installers/index.ts (T3.3) / lib/preflight.ts (T2.3) 等可成功 import
- **决策来源**：PATTERNS § 二 D-1 + Pattern F + Pattern C + Pattern E + GA-2 骨架

---

### Wave 2 — Lib helpers L1（5 路并行；依赖 T2.1）

#### T2.2 写 src/installers/lib/spawn.ts
- [ ] **目标**：跨 OS spawn 封装 + B1 二次 security check（防 phase 1.4 routing 绕过 schema 直传字符串场景）
- **文件**：`/d/GitCode/harnessed/src/installers/lib/spawn.ts`
- **内容大纲**（~90 行）：
  - 顶部 IMPL NOTE：引用 R03 § 3.7（Win cmd /c wrapper）
  - 单一导出 `spawnCmd(ctx: InstallContext, cmd: string, args: string[]): Promise<{ exitCode, stdout, stderr }>`
  - 内部步骤：
    1. **二次跑 `checkSecurityViolations(cmd)`** — defense-in-depth（Pattern D pre-pass）
    2. 平台分支：`process.platform === 'win32'` → `spawn('cmd.exe', ['/c', cmd, ...args])`；else → `spawn('/bin/sh', ['-c', `${cmd} ${args.join(' ')}`])`
    3. timeout 15s default（spec.verify.timeout_ms 复用，缺省 15000）
    4. env 注入（manifest.spec.install.env || {}）
    5. cwd 来自 `manifest.spec.install.cwd || ctx.cwd`
    6. 子进程 stderr/stdout 收集到 InstallResult.appliedFiles 或 error.message
- **验收**：
  - [ ] `corepack pnpm typecheck && corepack pnpm lint` 0 错误
  - [ ] 文件顶部含 `// IMPL NOTE (Rule 1 / R03 § 3.7): Win cmd.exe /c wrapper for npx ...`
  - [ ] B1 二次 check 失败 → 返回 InstallResult `{ ok: false, phase: 'preflight', ... }` 不抛
- **决策来源**：PATTERNS Pattern D + Pattern H + GA-2 § A4 跨 OS 红旗 3 + ADR 0004 契约 6 + R03 § 3.7

---

#### T2.3 写 src/installers/lib/preflight.ts
- [ ] **目标**：第一道 gate — 在 dry-run plan 之前快速过滤明显不可装场景
- **文件**：`/d/GitCode/harnessed/src/installers/lib/preflight.ts`
- **内容大纲**（~80 行）：
  - 顶部注释解释"为什么 preflight 不合到 spawn"（让用户先看到 platform 不支持 / git_ref invalid，不是 spawn 报错）
  - 检查清单（硬编码 path，不递归 AST — 沿 Pattern D security.ts 风格）：
    1. `manifest.spec.platforms.includes(process.platform)` — 不含则返回 InstallResult `{ aborted, reason: 'platform-mismatch' }`
    2. `manifest.spec.install.git_ref` 字段 shape 校验（已被 schema 校验，preflight 仅做 sanity grep）
    3. `manifest.spec.install.idempotent_check` 字段非空 + 是 string
    4. （可选 — 推 Wave 3 优化）`git ls-remote` 探测 git_ref 真实存在 — phase 1.2 不强制（推 phase 2.1）
  - 返回 `errors[]` 而非抛
- **验收**：
  - [ ] `corepack pnpm typecheck && corepack pnpm lint` 0 错误
  - [ ] 单元测试 (T2.8) 覆盖：platform-mismatch / 缺 idempotent_check / 全 pass 三场景
- **决策来源**：PATTERNS Pattern D + ASSUMPTIONS A6 + ADR 0004 契约 1（preflight 在 dry-run 之前）

---

#### T2.4 写 src/installers/lib/diff.ts
- [ ] **目标**：unified diff 渲染 + 跨 OS CRLF 处理 + isTTY-aware nocolor
- **文件**：`/d/GitCode/harnessed/src/installers/lib/diff.ts`
- **内容大纲**（~60 行）：
  - 顶部 IMPL NOTE 2 条：
    1. `// IMPL NOTE (Rule 1 / C3): jsdiff stripTrailingCr=true forced; Windows CRLF vs mac/linux LF mixed input must produce stable diff`
    2. `// IMPL NOTE (Rule 1 / nodejs/node#39673): use picocolors.isColorSupported NOT process.stdout.isTTY directly (returns undefined under Win git-bash)`
  - 单一导出 `renderDiff(plan: DiffPlan): string`
  - 内部：
    - `import { createPatch } from 'diff'`
    - `import pc from 'picocolors'`
    - `createPatch(filename, oldText, newText, '', '', { stripTrailingCr: true })` 输出 unified diff
    - 按行 split → 第一字符 `+`/`-`/`@@` 用 `pc.green` / `pc.red` / `pc.cyan` 染色（仅当 `pc.isColorSupported` 为 true）
    - join 输出
    - **> 200 行折叠**：默认仅显示 100 行 + summary `... <N> more lines (use --full-diff to expand)`；ctx.opts.fullDiff = true 时全展开
  - summary 行：`will modify N files (M lines added, K removed)`（计算自 +/- 行数）
- **验收**：
  - [ ] `corepack pnpm typecheck && corepack pnpm lint` 0 错误
  - [ ] 单元测试 (T2.8) 覆盖：基础 diff / CRLF / 200L 折叠 / nocolor 4 场景
  - [ ] 手工 `node -e "import('./dist/installers/lib/diff.js').then(m => console.log(m.renderDiff(...)))"` 输出含 ANSI 颜色（在 TTY 终端）
- **决策来源**：ADR 0004 契约 2 + GA-2 § B.1 + B.2 + ASSUMPTIONS C3 + nodejs/node#39673

---

#### T2.5 写 src/installers/lib/confirm.ts
- [ ] **目标**：4-level confirm + isCancel 守卫（防 Ctrl-C 变 undefined-poisoning bug — GA-2 § B.3）
- **文件**：`/d/GitCode/harnessed/src/installers/lib/confirm.ts`
- **内容大纲**（~70 行）：
  - 顶部 IMPL NOTE：引用 GA-2 § B.3 + Clack v0.10 isCancel 守卫规约
  - 单一导出 `confirmAt(level: Level, ctx: InstallContext): Promise<{ proceed: boolean; reason?: 'user-cancel' | 'flag-missing' }>`
  - 内部：
    - `import * as p from '@clack/prompts'`
    - L1 → `p.note('will write: <files>')` 后 return `{ proceed: true }`（默认 apply，仅 print）
    - L2 → `p.confirm({ message: 'Proceed?', initialValue: false })` + `p.isCancel(ans)` 守卫
    - L3 → 两次 `p.confirm()` 串联（第二次 message 含 "This affects other plugins (e.g. ~/.claude.json)"）
    - L4 → 检查 `ctx.opts.system` flag 缺失 → 立即返回 `{ proceed: false, reason: 'flag-missing' }`（不弹 prompt）+ print 教学行 "this method requires --system flag (e.g. global npm install affects PATH)"
    - 所有 await 后 isCancel(ans) 守卫
  - ctx.opts.nonInteractive = true 时跳所有 prompt 直接走 ctx.opts.apply 决定
- **验收**：
  - [ ] `corepack pnpm typecheck && corepack pnpm lint` 0 错误
  - [ ] 单元测试 (T2.8) 用 `vi.mock('@clack/prompts')` 覆盖 4 level + isCancel + nonInteractive 6 场景
- **决策来源**：ADR 0004 契约 4 + GA-2 § B.3 + ASSUMPTIONS B3 候选 1 教学行

---

#### T2.6 写 src/installers/lib/backup.ts
- [ ] **目标**：ISO-ts 备份目录 + metadata.json + sha1 + **per-file eol 字段**（CRLF preservation C3 mitigation）
- **文件**：`/d/GitCode/harnessed/src/installers/lib/backup.ts`
- **内容大纲**（~120 行）：
  - 顶部 IMPL NOTE：引用 C3（CRLF/LF preservation in metadata.eol field）
  - 单一导出 `backup(plan: DiffPlan, ctx: InstallContext): Promise<{ ok: true; backupId: string } | { ok: false; error: InstallError }>`
  - 内部：
    - 生成 backupId = ISO timestamp（`new Date().toISOString().replace(/:/g, '-')`，避免 Win 文件名 invalid char）
    - mkdir `<ctx.cwd>/.harnessed-backup/<backupId>/`
    - 遍历 plan.files[]：
      - 读原文件（`fs.readFile(path)`）→ 检测 EOL（`buf.includes('\r\n')` ? 'crlf' : 'lf'）
      - 写到 `<backup>/HOME/<mirror-path>` （`~/.claude.json` → `<backup>/HOME/.claude.json`；`<project>/.mcp.json` → `<backup>/PROJECT/.mcp.json`）
      - 计算 sha1（`crypto.createHash('sha1').update(buf).digest('hex')`）
      - metadata.json 加条目 `{ target, backup, sha1, mode, eol: 'lf' | 'crlf' }`
    - 写 metadata.json：`{ installer, manifest, timestamp, files: [...] }`（ADR 0004 § 3 schema + 新加 eol 字段）
- **验收**：
  - [ ] `corepack pnpm typecheck && corepack pnpm lint` 0 错误
  - [ ] 单元测试 (T2.8) 用 `vi.mock('node:fs/promises')` 覆盖 mkdir / readFile / writeFile / sha1 一致性
  - [ ] 手工 dry-run 后 `<project>/.harnessed-backup/<ts>/metadata.json` 存在 + per-file `eol` 字段非空
- **决策来源**：ADR 0004 § 3 + ASSUMPTIONS C3 + Pattern C + Pattern B (lazy timestamp dir creation) + Pattern H

---

### Wave 3 — Lib helpers L2 + Unit Tests（依赖 Wave 2）

#### T2.7 写 src/installers/lib/state.ts
- [ ] **目标**：`.harnessed/state.json` 单一 SSOT — 已装清单 + 版本 + 最后 install 时间；不预留 audit.log / current-workflow（推 phase 1.4 / 3.1）
- **文件**：`/d/GitCode/harnessed/src/installers/lib/state.ts`
- **内容大纲**（~50 行）：
  - 单一导出 `readState(cwd) / writeState(cwd, state) / updateInstalled(cwd, name, version)` 三 helper
  - state.json schema（plain interface — 不走 TypeBox，karpathy YAGNI per D1.2-7）：
    ```typescript
    interface HarnessedState {
      version: '1'  // schema version of this file
      installed: Record<string, { version: string; installedAt: string; manifestSha1: string }>
    }
    ```
  - `writeState` 用 atomic update（write to .tmp + rename）防 concurrent corruption
  - `readState` 文件缺失时返回 default `{ version: '1', installed: {} }`
- **验收**：
  - [ ] `corepack pnpm typecheck && corepack pnpm lint` 0 错误
  - [ ] 单元测试 (T2.8) 覆盖：缺文件返回 default / atomic write / concurrent simulation
- **决策来源**：ASSUMPTIONS B7 候选 1 + ADR 0004 契约 6（partial install 状态显示）

---

#### T2.8 写 lib helpers unit tests（5-6 个文件 — 6 路并行）
- [ ] **目标**：每 lib helper 1 测试文件；BASE InstallContext + with* modifier 风格（Pattern J）
- **文件**（6 文件并行）：
  - `tests/unit/installers-lib-preflight.test.ts`
  - `tests/unit/installers-lib-diff.test.ts`
  - `tests/unit/installers-lib-confirm.test.ts`（mock @clack/prompts）
  - `tests/unit/installers-lib-backup.test.ts`（mock node:fs/promises + node:crypto）
  - `tests/unit/installers-lib-spawn.test.ts`（mock child_process — C6 mitigation）
  - `tests/unit/installers-lib-state.test.ts`（mock node:fs/promises）
- **每文件内容**：
  - 顶部 BASE InstallContext fixture（一份最小 valid manifest + opts）
  - 5-10 个 `it()` test 覆盖：normal path / edge case / error path
  - 使用 `vi.mock(...)` 隔离 fs / child_process / @clack/prompts
- **验收**：
  - [ ] tests 92 → ≥ 102（+10 至少 — 6 文件 × 平均 ≥ 1.7 test）
  - [ ] `corepack pnpm test -- --filter installers-lib` 全绿
  - [ ] 无任何真实 spawn / 真实 fs 写文件（mock-only）
- **决策来源**：PATTERNS § 4.1 D-5 + Pattern J + Pattern I + ASSUMPTIONS C6 mitigation

---

### Wave 4 — Install methods + Dispatcher（依赖 Wave 1+2+3）

#### T3.1 写 src/installers/npmCli.ts
- [ ] **目标**：cli-npm × npm-cli 实装 — Level: L4 if global / L1 if npx fallback；用户拒 L4 → 自动降级 L1（B3 候选 1）
- **文件**：`/d/GitCode/harnessed/src/installers/npmCli.ts`
- **内容大纲**（~50 行）：
  - 单一导出 `installNpmCli: Installer = async (ctx) => { ... }`
  - 内部步骤（GA-2 § A 骨架 L100-L116）：
    1. preflight(ctx) → 失败 return
    2. **判定 Level**：manifest.spec.install.cmd 含 `npm install -g` → L4；含 `npx` → L1
    3. planDryRun(ctx) → 计算 will-modify（global = npm prefix；npx = ephemeral cache 仅）
    4. console.log(renderDiff(plan))（注：npx ephemeral 时 plan 为空 → print "no persistent file changes"）
    5. confirmAt(level, ctx)：
       - level=L4 + ctx.opts.system=false → **降级 L1**：print "global install requires --system; falling back to npx ephemeral. Use 'harnessed install <name> --system' for permanent global install." + 改 cmd 为 `npx --yes <pkg>@<version>` + level=L1
       - 重跑 confirmAt(L1, ctx) → 直接 proceed
    6. backup(plan)（npx 时 plan 为空 → backupId 空但 .harnessed-backup/<ts>/metadata.json 仍记录）
    7. spawnCmd(ctx, cmd, args) — Win 自动注入 `cmd /c`（lib/spawn 已封装）
    8. verify(manifest.spec.verify) — 跑 verify.cmd
    9. updateInstalled(ctx.cwd, manifest.metadata.name, version, manifestSha1)
    10. return InstallResult
- **验收**：
  - [ ] `corepack pnpm typecheck && corepack pnpm lint` 0 错误
  - [ ] 文件 ≤ 60 行（karpathy simplicity）
  - [ ] 无重复 helper logic（全调 lib/* 函数）
- **决策来源**：ADR 0004 契约 1+2+3+4+6 + ASSUMPTIONS B3 候选 1 + GA-2 骨架

---

#### T3.2 写 src/installers/mcpStdioAdd.ts
- [ ] **目标**：mcp-npm × mcp-stdio-add 实装 — Level: L3；强制 `--scope project`；idempotent 用 grep -q（C2 mitigation）
- **文件**：`/d/GitCode/harnessed/src/installers/mcpStdioAdd.ts`
- **内容大纲**（~50 行）：
  - 顶部 IMPL NOTE：引用 ADR 0004 契约 5 + R03 § 3.3 红旗 1（CC #54803 user-scope bug）
  - 单一导出 `installMcpStdioAdd: Installer = async (ctx) => { ... }`
  - 内部步骤：
    1. preflight(ctx) → 失败 return
    2. Level = L3 固定
    3. planDryRun(ctx) → diff 仅显示 `<project>/.mcp.json` 将加条目（用 `claude mcp add --dry-run` if available；fallback 自己 simulate）
    4. console.log(renderDiff(plan))
    5. confirmAt(L3, ctx) → 失败 return aborted
    6. backup(plan) — 备份 .mcp.json
    7. **不调通用 spawn.ts 路径** — 直接 `spawnSync('claude', ['mcp', 'add', '--scope', 'project', '--transport', 'stdio', name, '--', 'npx', '--yes', `${pkg}@${version}`])`
    8. verify — 用 `claude mcp list` pipe `grep -q <name>` 查 exit code（**不解析 stdout** — C2 mitigation）
    9. updateInstalled
    10. return InstallResult
- **验收**：
  - [ ] `corepack pnpm typecheck && corepack pnpm lint` 0 错误
  - [ ] 文件顶部含 `// IMPL NOTE (Rule 1 / CC #54803): mandatory --scope project; user scope is broken in v2.1.122`
  - [ ] grep `--scope project` hardcoded（不可由 manifest 覆盖）
- **决策来源**：ADR 0004 契约 5 + ASSUMPTIONS C2 mitigation + R3.2 + R03 § 3.3

---

#### T3.3 写 src/installers/index.ts — dispatch + runInstall orchestrator
- [ ] **目标**：2-method dispatch + 其余 4 method 显式 placeholder（ROADMAP phase 2.1 unblock）
- **文件**：`/d/GitCode/harnessed/src/installers/index.ts`
- **内容大纲**（~40 行）：
  ```typescript
  // src/installers/index.ts
  // Dispatch table for 6 install methods.
  // Phase 1.2 implements 2: npm-cli + mcp-stdio-add.
  // Phase 2.1 unblocks the remaining 4 (cc-plugin-marketplace / git-clone-with-setup / npx-skill-installer / mcp-http-add).
  
  import type { Installer, Manifest, InstallOpts, InstallResult } from './lib/types.js'
  import { installNpmCli } from './npmCli.js'
  import { installMcpStdioAdd } from './mcpStdioAdd.js'
  
  const phase21Placeholder: Installer = async (ctx) => ({
    ok: false,
    phase: 'preflight',
    error: {
      file: ctx.manifest.metadata.name,
      path: 'spec.install.method',
      message: `Install method '${ctx.manifest.spec.install.method}' is reserved for phase 2.1 — see ROADMAP v0.2.0 + ADR 0005`,
      line: null, column: null,
      keyword: 'phase-deferred',
      suggest: 'wait for v0.2.0 release, or open an issue if blocked',
    },
  })
  
  export const installers: Record<Manifest['spec']['install']['method'], Installer> = {
    'npm-cli':              installNpmCli,
    'mcp-stdio-add':        installMcpStdioAdd,
    'cc-plugin-marketplace': phase21Placeholder,
    'git-clone-with-setup': phase21Placeholder,
    'npx-skill-installer':  phase21Placeholder,
    'mcp-http-add':         phase21Placeholder,
  }
  
  export async function runInstall(manifest: Manifest, opts: InstallOpts): Promise<InstallResult> {
    const installer = installers[manifest.spec.install.method]
    return installer({ manifest, opts, level: levelOf(manifest), cwd: process.cwd() })
  }
  
  function levelOf(manifest: Manifest): Level { /* ... */ }
  ```
- **验收**：
  - [ ] `corepack pnpm typecheck && corepack pnpm lint` 0 错误
  - [ ] 4 个 placeholder method 调用返回 explicit error（非抛）
  - [ ] `runInstall(ctx7-manifest, { dryRun: true })` 走通 npmCli（mock spawn）
- **决策来源**：PATTERNS § Pattern G (barrel) + GA-2 骨架 + ASSUMPTIONS B6 (推 phase 2.1)

---

### Wave 5 — CLI subcommands（4 路并行；依赖 Wave 4）

#### T4.1 写 src/cli/install.ts
- [ ] **目标**：commander subcommand 注册 + flags + InstallResult narrow → exit code
- **文件**：`/d/GitCode/harnessed/src/cli/install.ts`
- **内容大纲**（~80 行）：
  - 顶部 IMPL NOTE：引用 ADR 0004 契约 1 双 flag --non-interactive --apply
  - 单一导出 `registerInstall(program: Command)`
  - 内部：
    - `program.command('install <name>') ... .option('--apply') .option('--dry-run') .option('--system') .option('--non-interactive') .option('--full-diff') .option('--no-color')`
    - action(name, opts) → 加载 manifest（fs.readFile + validateManifestFile from phase 1.1）→ runInstall → narrow result → exit code mapping：
      - `result.ok === true` → process.exit(0)
      - `result.aborted === true` → process.exit(2)（aborted 不算 error）
      - `result.ok === false` → console.error(formatError(result.error)) + process.exit(1)
- **验收**：
  - [ ] `corepack pnpm typecheck && corepack pnpm lint` 0 错误
  - [ ] `harnessed install --help` 显示 dry-run 默认行为（ADR 0004 契约 1 用户文档）
- **决策来源**：ADR 0004 契约 1 + GA-2 § B.1

---

#### T4.2 写 src/cli/doctor.ts
- [ ] **目标**：4 项最小 check（Node / MCP scope / jq / Win bash — Git Bash vs WSL detect）
- **文件**：`/d/GitCode/harnessed/src/cli/doctor.ts`
- **内容大纲**（~80 行）：
  - 顶部 IMPL NOTE：引用 C4 mitigation（`spawnSync('bash', ['-c', 'echo $WSL_DISTRO_NAME'])` 判别 WSL）
  - 单一导出 `registerDoctor(program: Command)`
  - 内部 — 4 个 CheckResult 函数：
    1. `checkNodeVersion()` — `process.versions.node` semver ≥ 22；fail → 修复命令 `nvm install 22 && nvm use 22`
    2. `checkMcpScope()` — 解析 `<cwd>/.mcp.json` 存在 + 不在 `~/.claude.json` mcpServers 块；fail → 修复命令 `claude mcp add --scope project ...`
    3. `checkJq()` — `which jq` (Unix) / `where jq` (Win)；fail Win → `winget install jqlang.jq` / `scoop install jq`
    4. `checkWinBash()` — 仅 Win 平台跑：`spawnSync('bash', ['-c', 'echo $WSL_DISTRO_NAME'])` → 输出非空 = WSL（不 ok）；输出空 = Git Bash 或 native bash（ok）；记录 PATH 第一个 bash 解析路径
  - aggregate report — print 每项 ✅/❌ + 修复命令
- **验收**：
  - [ ] `corepack pnpm typecheck && corepack pnpm lint` 0 错误
  - [ ] `harnessed doctor` 输出 4 行 check + 总结行
  - [ ] Windows native CI 跑 doctor 不报错（即使 jq 缺失也 graceful degrade）
- **决策来源**：ASSUMPTIONS B4 候选 1 + C4 mitigation + R2.2 + R5.3 ralph-loop Win fix 骨架

---

#### T4.3 写 src/cli/audit.ts
- [ ] **目标**：phase 1.2 仅做 manifest 内自一致校验（已 install 副本 origin 比对推 phase 2.4）
- **文件**：`/d/GitCode/harnessed/src/cli/audit.ts`
- **内容大纲**（~60 行）：
  - 单一导出 `registerAudit(program: Command)`
  - 内部：
    - auto-glob `manifests/{tools,skill-packs}/*.yaml` (10 文件)
    - 每文件：parse → validateManifestFile → check `metadata.upstream.repository` 字段格式（git URL pattern）+ `signed_by` 非默认占位 + `git_ref` 非 HEAD/main/master（phase 1.1.1 M1 hotfix 已 schema enforce，audit 是 second-line check）
    - aggregate report — print 每 manifest ✅/⚠️ + 详情
  - **不**调真 git remote get-url（推 phase 2.4 真 audit）
- **验收**：
  - [ ] `corepack pnpm typecheck && corepack pnpm lint` 0 错误
  - [ ] `harnessed audit` 跑 10 manifest 输出 ✅
- **决策来源**：ASSUMPTIONS B4 候选 1 + R2.3 (skeleton) + phase-1.1.1 M1 git_ref pattern

---

#### T4.4 写 src/cli/rollback.ts + status.ts + backup-list.ts
- [ ] **目标**：3 子命令 — rollback / status / backup list；CRLF/LF preservation per metadata.eol
- **文件**（3 文件）：
  - `/d/GitCode/harnessed/src/cli/rollback.ts`（~50 行）
  - `/d/GitCode/harnessed/src/cli/status.ts`（~30 行）
  - `/d/GitCode/harnessed/src/cli/backup-list.ts`（~25 行）
- **内容大纲**：
  - **rollback.ts**：
    - 顶部 IMPL NOTE：引用 C3 CRLF eol preservation
    - `harnessed rollback <timestamp>` → 读 `.harnessed-backup/<ts>/metadata.json` → 反向遍历 files[] → 还原（按 eol 字段恢复 CRLF/LF）+ sha1 验证
  - **status.ts**：
    - `harnessed status` → 读 `.harnessed/state.json` → print installed[] 列表 + 版本 + 时间；ADR 0004 契约 6 partial install 状态行（如有）
  - **backup-list.ts**：
    - `harnessed backup list` → 列出 `.harnessed-backup/*/metadata.json` 摘要（ts + installer + manifest）
- **验收**：
  - [ ] `corepack pnpm typecheck && corepack pnpm lint` 0 错误
  - [ ] 手工测试：rollback 后文件 EOL 保持原状（diff 0 行差异）
- **决策来源**：ADR 0004 § 3 + ASSUMPTIONS C3 + Pattern C + Pattern B + Pattern H

---

### Wave 6 — 顶层 wire + Tests + Cross-OS CI 扩展（依赖 Wave 5）

#### T5.1 改 src/cli.ts 顶层 — 注册 5 个子命令
- [ ] **目标**：Wave 5 的 5 个子命令挂到 commander root
- **文件**：`/d/GitCode/harnessed/src/cli.ts`
- **内容**（在现有 phase-1.1 cli.ts skeleton 之上）：
  ```typescript
  import { Command } from 'commander'
  import { registerInstall } from './cli/install.js'
  import { registerDoctor } from './cli/doctor.js'
  import { registerAudit } from './cli/audit.js'
  import { registerRollback } from './cli/rollback.js'
  import { registerStatus } from './cli/status.js'
  import { registerBackupList } from './cli/backup-list.js'
  
  const program = new Command()
  program.name('harnessed').version('0.1.0-alpha.2-installer-runtime')
  
  registerInstall(program)
  registerDoctor(program)
  registerAudit(program)
  registerRollback(program)
  registerStatus(program)
  registerBackupList(program)
  
  program.parse()
  ```
- **验收**：
  - [ ] `corepack pnpm build && node ./dist/cli.mjs --help` 输出含 6 子命令（install / doctor / audit / rollback / status / backup）
  - [ ] `node ./dist/cli.mjs --version` 输出 `0.1.0-alpha.2-installer-runtime`
- **决策来源**：ADR 0004 § Compliance + phase-1.1 src/cli.ts skeleton 扩展

---

#### T5.2 写 tests/integration/installer-contract.test.ts — 6 契约 × 2 method = 12 cell
- [ ] **目标**：ADR 0004 6 硬契约 × 2 method（npm-cli + mcp-stdio-add）= 12 contract test 全绿
- **文件**：`/d/GitCode/harnessed/tests/integration/installer-contract.test.ts`
- **内容大纲**（~250 行）：
  - 顶部 `vi.mock('child_process')` + `vi.mock('@clack/prompts')` + `vi.mock('node:fs/promises')`（C6 mitigation）
  - nested loop：
    ```typescript
    const methods = ['npm-cli', 'mcp-stdio-add']
    const contracts = ['dry-run-default', 'diff-format', 'backup-location', 'level-declaration', 'mcp-cli-only', 'no-silent-failure']
    for (const method of methods) {
      describe(`${method} satisfies ADR 0004 contracts`, () => {
        for (const contract of contracts) {
          it(`contract: ${contract}`, async () => { /* assertions */ })
        }
      })
    }
    ```
  - 每 cell 用 `tests/fixtures/installers/<method>/<contract>.yaml` fixture（auto-glob — Pattern I）
  - 每 cell 1+ assertion：
    - `dry-run-default`: 默认 opts.apply=false → spawn 不被调用（mocked）
    - `diff-format`: renderDiff 输出含 `+++ NEW:` / `--- REMOVE:` / `@@` 标头
    - `backup-location`: backup 写到 `.harnessed-backup/<ts>/`（mocked fs.mkdir 被调用）
    - `level-declaration`: npm-cli 测 L4↔L1 切换；mcp-stdio 测 L3 固定
    - `mcp-cli-only`: mcp-stdio 测 spawn 只用 `claude mcp` 不直接 fs.writeFile `.mcp.json`；npm-cli 测 spawn 不调 `claude mcp`
    - `no-silent-failure`: 注入 spawn exit=1 → InstallResult `{ ok: false, error: { suggest: <fix-cmd> } }`；suggest 字段非空
- **验收**：
  - [ ] tests 102 → ≥ 114（+12 contract cell，每 cell ≥ 1 assertion）
  - [ ] `corepack pnpm test -- --filter installer-contract` 12/12 ✅
  - [ ] B4' acceptance bar 达成
- **决策来源**：ADR 0004 § Compliance + PATTERNS § 4.1 D-5 + ASSUMPTIONS C6 mitigation

---

#### T5.3 写 method-level unit tests（3 文件）
- [ ] **目标**：npmCli / mcpStdioAdd / index 各一文件 — BASE manifest + with* modifier
- **文件**（3 文件）：
  - `tests/unit/installers-npmCli.test.ts`
  - `tests/unit/installers-mcpStdioAdd.test.ts`
  - `tests/unit/installers-index.test.ts`
- **内容大纲**（每文件 ~50 行）：
  - BASE manifest fixture（npm-cli × cli-npm × cli-binary / mcp-stdio-add × mcp-npm × mcp-tool）
  - withGlobalFlag / withNpxFallback / withFailingIdempotentCheck 等 modifier
  - vi.mock spawn → assert InstallResult shape
  - assert L4 → L1 fallback path（npm-cli）；assert grep -q exit code（mcp-stdio-add）；assert phase21Placeholder 抛 explicit error（index.ts）
- **验收**：
  - [ ] tests 114 → ≥ 124（+10 至少 — 3 文件 × 平均 ≥ 3.3 test）
  - [ ] `corepack pnpm test -- --filter "installers-(npmCli|mcpStdioAdd|index)"` 全绿
- **决策来源**：PATTERNS § 4.1 D-5 + Pattern J

---

#### T5.4 写 cli-level unit tests（5 文件）
- [ ] **目标**：commander parse + InstallResult narrow + exit code assertion
- **文件**（5 文件 — 5 路并行）：
  - `tests/unit/cli-install.test.ts`
  - `tests/unit/cli-doctor.test.ts`
  - `tests/unit/cli-audit.test.ts`
  - `tests/unit/cli-rollback.test.ts`
  - `tests/unit/cli-status.test.ts`
- **内容大纲**（每文件 ~30 行）：
  - mock runInstall / readState / etc.
  - assert exit code（0 ok / 1 error / 2 aborted）
  - assert flag parsing（--apply / --dry-run / --system / --non-interactive / --full-diff / --no-color）
- **验收**：
  - [ ] tests 124 → ≥ 130（+5 至少）
  - [ ] `corepack pnpm test -- --filter cli-` 全绿
- **决策来源**：PATTERNS § 4.1

---

#### T5.5 扩展 .github/workflows/ci.yml — installer integration step
- [ ] **目标**：3 平台 CI 加 installer integration step（real spawn ctx7 + tavily/exa **--dry-run only**；tmpdir 隔离 — C6 mitigation）
- **文件**：`/d/GitCode/harnessed/.github/workflows/ci.yml`
- **追加 step**（在 `corepack pnpm test` 之后）：
  ```yaml
  - name: Installer integration (real spawn, dry-run only)
    env:
      npm_config_prefix: ${{ runner.temp }}/npm-prefix
    run: |
      mkdir -p $npm_config_prefix
      corepack pnpm build
      node ./dist/cli.mjs install ctx7 --dry-run --non-interactive
      node ./dist/cli.mjs install tavily-mcp --dry-run --non-interactive
      node ./dist/cli.mjs install exa-mcp --dry-run --non-interactive
  ```
- **验收**：
  - [ ] CI 三平台 (ubuntu/macos/windows × Node 22) installer integration step 全 ✅
  - [ ] B5' acceptance bar 达成（A4 沿袭）
  - [ ] tmpdir 隔离不污染 CI runner 全局环境
- **决策来源**：A5 + ASSUMPTIONS C6 + R5.1

---

#### T5.6 （可选）real-spawn skipIf gate — 仅 phase 1.2 final acceptance
- [ ] **目标**：phase 1.2 ship 前手工跑一次真 install + verify + rollback；CI 仅 dry-run（避免污染）
- **文件**：`/d/GitCode/harnessed/tests/integration/installer-real-spawn.test.ts`
- **内容大纲**（~80 行）：
  - `it.skipIf(!process.env.HARNESSED_REAL_SPAWN)('real ctx7 install + verify + rollback', async () => { ... })`
  - 用 `tmpdir()` + `npm_config_prefix` 隔离
  - 跑 `runInstall(ctx7-manifest, { apply: true, nonInteractive: true })` → assert ok + backupId
  - 跑 `claude mcp list` → assert 不含 ctx7（npm-cli 装的不是 mcp）
  - 跑 rollback → assert state restored + sha1 match
- **验收**：
  - [ ] 手工 `HARNESSED_REAL_SPAWN=1 corepack pnpm test -- --filter real-spawn` 通过（仅 phase 1.2 final acceptance run）
  - [ ] B1' / B2' / B3' acceptance bar 达成
- **决策来源**：ASSUMPTIONS C6 + Pattern K (perf threshold gate skipIf 风格)

---

### Wave 7 — Docs + Phase verify（依赖 Wave 6）

#### T6.1 写 docs/INSTALLER-CONTRACT.md ≥ 100 行
- [ ] **目标**：ADR 0004 6 契约用户视角 + 错误信息库 + FAQ
- **文件**：`/d/GitCode/harnessed/docs/INSTALLER-CONTRACT.md`
- **内容大纲**（≥ 100 行）：
  - § 1 Why this contract — 为什么需要 dry-run + diff + rollback
  - § 2 Six Contracts — 逐条用户视角（Contract 1-6 各 ≥ 10 行）
  - § 3 Level System (L1-L4) — 表格 + 4 method 当前 Level 映射
  - § 4 Error Reference — 错误信息库（按 InstallError.keyword 分类）
  - § 5 FAQ — "dry-run 怎么 disable" → `--non-interactive --apply` 双 flag；"我可以同时装两个 method 的同名 manifest 吗" → 否（idempotent_check 守护）；"L4 全局装失败如何 fallback" → 自动降级 L1 npx + 教学行
- **验收**：
  - [ ] `wc -l docs/INSTALLER-CONTRACT.md` ≥ 100
  - [ ] grep "Contract 1" / "Contract 2" / ... / "Contract 6" 全部 hit
  - [ ] B9' acceptance bar 达成
- **决策来源**：ADR 0004 § Compliance "用户文档"

---

#### T6.2 更新 README.md — 加 install quick start + flag 文档
- [ ] **目标**：README 加 `harnessed install` quick start 段落 + 链接 INSTALLER-CONTRACT.md
- **文件**：`/d/GitCode/harnessed/README.md`
- **追加内容**（在 phase-1.1 现有 72 行之后）：
  - § Quick Start — `harnessed install ctx7` / `harnessed install tavily-mcp --apply`
  - § Flags — `--apply` / `--dry-run` / `--system` / `--non-interactive` / `--full-diff` / `--no-color` 各一行说明
  - 链接 `docs/INSTALLER-CONTRACT.md`
- **验收**：
  - [ ] README ≥ 100 行
  - [ ] grep "harnessed install" hit
- **决策来源**：ADR 0004 § Compliance

---

#### T6.3 更新 CONTRIBUTING.md — 加 doctor 部分 + ADR 0005 errata 写作背景
- [ ] **目标**：维护者新加 doctor check 时的指南 + ADR 0005 起草背景
- **文件**：`/d/GitCode/harnessed/CONTRIBUTING.md`
- **追加内容**（在 phase-1.1 现有 139 行之后）：
  - § "How to add a doctor check" — 步骤 + Pattern I 示例（auto-glob）
  - § "ADR 0005 marketplace_source schema errata" — 为什么不动 ADR 0001 main body（A7 守恒）+ errata 流程
- **验收**：
  - [ ] CONTRIBUTING.md ≥ 160 行
- **决策来源**：phase-1.1 CONTRIBUTING.md 风格 + ADR 0005

---

#### T6.4 更新 docs/adr/README.md — 加 0004 + 0005 index
- [ ] **目标**：ADR index 追加 0004 / 0005
- **文件**：`/d/GitCode/harnessed/docs/adr/README.md`
- **追加内容**：
  - `0004-installer-dry-run-diff-preview-contract.md` — Accepted 2026-05-12
  - `0005-marketplace-source-schema-errata.md` — Accepted 2026-MM-DD（Wave 0 完成后填）
- **验收**：
  - [ ] 含 0004 + 0005 链接
- **决策来源**：R8.4 占位

---

#### T6.5 写 .planning/phase-1.2/VERIFICATION.md
- [ ] **目标**：B1'-B9' 复现命令清单 + 12 contract test 索引 + F23+ finding 索引
- **文件**：`/d/GitCode/harnessed/.planning/phase-1.2/VERIFICATION.md`
- **内容大纲**（≥ 120 行 — phase-1.1 VERIFICATION.md 风格）：
  - § 1 Acceptance Bar 复现命令（B1'-B9' 各一行 bash）
  - § 2 12 Contract Test 索引表（method × contract → fixture 路径 + assertion 摘要）
  - § 3 Phase 1.3 prereq 列表（DAG resolver 接口契约 / runInstall 调用 shape）
  - § 4 Findings 索引（F23+，从 progress.md § B 反向链接）
  - § 5 Known issues 与 deferred items（cc-plugin-marketplace installer 推 phase 2.1 / 6 月 stale 推 phase 2.4 / etc.）
- **验收**：
  - [ ] ≥ 120 行
  - [ ] 任何人按文件可复现 9 acceptance bar
- **决策来源**：phase-1.1 VERIFICATION.md 风格

---

#### T6.6 更新 .planning/STATE.md — phase 1.2 completed
- [ ] **目标**：标记 phase 1.2 ship + 解锁 phase 1.3 / 1.4 / 2.1
- **文件**：`/d/GitCode/harnessed/.planning/STATE.md`
- **内容修改**：
  - 当前位置：phase 1.2 ✅ COMPLETED — SHIPPED 2026-MM-DD
  - 下一 phase：1.3（DAG resolver + harnessed-router 引擎 + setup 完整版）
  - 进度：2 / 16 phases ▓▓░░░░░░░░░░░░░░ 12.5%
  - 已完成段加 "Phase 1.2 SHIPPED" 条目
  - 累积 ADR：3 → 5（加 0004 + 0005）
  - 总 commits / vitest tests 更新
- **验收**：
  - [ ] STATE.md phase 1.2 段落完整
  - [ ] 各里程碑进度表更新
- **决策来源**：GSD 标准 + phase-1.1 T10.3 风格

---

#### T6.7 （可选）git tag v0.1.0-alpha.2-installer-runtime
- [ ] **目标**：标 phase 1.2 milestone — installer runtime ready
- **命令**：
  ```bash
  cd /d/GitCode/harnessed
  git tag -a v0.1.0-alpha.2-installer-runtime -m "Phase 1.2 done: cli-npm + mcp-stdio installer + setup/doctor/audit/rollback skeleton"
  # main agent 决定是否 push
  ```
- **验收**：
  - [ ] `git tag --list | grep installer-runtime` 输出该 tag
- **决策来源**：phase-1.1 T10.4 风格

---

## 完成 phase 1.2 的最后一行 commit message 模板

```
phase-1.2: T6.7 close phase 1.2 — installer runtime ready

- All 7 wave (37 atomic subtasks) complete; acceptance bar B1'-B9' all green.
- 2 install methods runtime-ready (cli-npm + mcp-stdio-add); 4 method placeholders unblock phase 2.1.
- 5 CLI subcommands (install / doctor / audit / rollback / status) wired to commander root.
- 12 contract tests (6 × 2 method) green on 3 platforms; tests ~110 → ~130.
- ADR 0001-0004 main body untouched (A7 守恒); ADR 0005 marketplace_source errata accepted.
- Unblocks phase 1.3 (DAG resolver + harnessed-router + setup full version).
- Tag: v0.1.0-alpha.2-installer-runtime
```

---

## 维护检查清单（每次 commit 前自检）

- [ ] 改动的 task 在本文件已勾选
- [ ] progress.md 已追加一行（含 commit short-hash）
- [ ] 任何意外 / 决策修订已写入 progress.md § B（F23+，模板沿用 phase-1.1）
- [ ] commit message 含 task ID + 简短 action + 决策来源（ADR 0001-0005 / GA-1/2/3 / PATTERNS / ASSUMPTIONS § 章节）
- [ ] 该 task 涉及代码改动 → `corepack pnpm typecheck && corepack pnpm lint && corepack pnpm test` 局部都通过
- [ ] 涉及 schema / manifest 改动 → `corepack pnpm build:schema` 重新生成 artifact
- [ ] ADR 0001/0002/0003/0004 main body 不被本 task 修改（A7 守恒；CI 自动 enforce）

---

## Wave-Level Acceptance Checkpoint

每个 wave 完成时跑下列子集验收（防止累积积木倒塌）：

| Wave | 完成验收子集 |
|------|--------------|
| Wave 0 | typecheck / lint / test (≥ 92) / build / build:schema / `git diff adr-0001-accepted` 输出空 |
| Wave 1 | typecheck / lint（types.ts 可被其它文件 import） |
| Wave 2 | typecheck / lint / test (≥ 92 — Wave 2 helper 单元测试在 Wave 3 才加) |
| Wave 3 | typecheck / lint / test (≥ 102) |
| Wave 4 | typecheck / lint / test (≥ 102 — method/index 单元测试在 Wave 6) + 手工 `runInstall(ctx7, dryRun)` mock pass |
| Wave 5 | typecheck / lint / test (≥ 102) + 手工 `node ./dist/cli.mjs --help` 显示 6 子命令 |
| Wave 6 | typecheck / lint / test (≥ 130) + CI installer integration step 三平台全绿（B4' + B5' acceptance）|
| Wave 7 | 全 acceptance bar B1'-B9' 全绿（手工 + CI 复合验收） |

---

## Phase 1.2 deferred 项（明确推后 — 与 PLAN § 4.2 一致）

| 项 | 推到 | 理由 |
|----|------|------|
| cc-plugin-marketplace installer 实装代码 | phase 2.1 | GA-1 Recommendation Option C timing；ROADMAP 一致 |
| git-clone-with-setup installer 实装 | phase 2.1 | 同上 |
| npx-skill-installer installer 实装 | phase 2.1 | 同上 |
| mcp-http-add installer 实装 | phase 2.x | 无真实上游 demo |
| karpathy-skills CLAUDE.md merge 引擎 | phase 2.2 | B5 候选 2；ROADMAP Phase 2.2 已显式列 |
| research workflow 端到端 | phase 1.4 | phase 1.2 仅备 install 三 deps |
| DAG resolver / 拓扑排序 | phase 1.3 | ROADMAP 一致 |
| 6 月 stale 检测 + weekly cron + GitHub API token | phase 2.4 | B4 候选 1；R04 P1#8 v0.2 范围 |
| .harnessed/{audit.log, current-workflow.json, checkpoints/} 完整 | phase 1.4 / 3.1 | B7 候选 1 + karpathy YAGNI |
| harnessed setup 完整自检（npx@latest 提示）| phase 1.3 | GA-5 推迟 |
| 真 git origin URL 篡改 audit | phase 2.4 | 需已 install 副本存在 |
| Plugin uninstall 4 步 fallback | phase 2.4 | R6.5 v0.2 范围 |
| `harnessed gc --older-than 30d` 备份清理 | phase 2.4 | ADR 0004 § Consequences 负面 3 已注 |
