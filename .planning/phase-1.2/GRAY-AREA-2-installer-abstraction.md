# GA-2: Installer Abstraction + CLI Output Lib

> Phase 1.2 plan-phase 前置研究 · 双议题（installer 抽象层 + CLI lib 选型）
> 调研日期：2026-05-12
> 调研者：advisor-researcher（Opus 4.7） via WebSearch + Context7（picocolors / @clack/prompts / jsdiff）

---

## 议题概览

Phase 1.2 要把 ADR 0003 列出的 6 个 install method（`cc-plugin-marketplace` / `git-clone-with-setup` / `npx-skill-installer` / `npm-cli` / `mcp-stdio-add` / `mcp-http-add`）从 schema 校验层（已 ship）推进到 **runtime install 实装**。每个 installer 必须满足 ADR 0004 6 条契约：

1. dry-run 默认 + explicit `--apply`
2. unified diff 输出（红删/绿增 + isTTY-aware nocolor + > 200 行折叠）
3. `<project>/.harnessed-backup/<ISO-ts>/` rollback
4. L1-L4 4-level confirm（不同操作严格度不同）
5. MCP server 强制走 `claude mcp add/remove --scope project` CLI（避 user-scope bug）
6. 不允许 silent failures（partial install 必须显式 + 含可执行修复命令）

两个待决设计点 plan-phase 必须先锁定：**A. installer 内部抽象风格**（决定代码组织 + 测试 surface）；**B. CLI lib 三件套选型**（决定 deps + ESM 兼容性 + 跨 OS 行为）。

---

## Sub-issue A: Installer 抽象层

### 现状证据

读 `src/manifest/schema/installMethods/{ccPluginMarketplace,gitCloneWithSetup,npmCli,npxSkillInstaller,mcpStdioAdd,mcpHttpAdd}.ts`，6 个 method schema 几乎同构：

| 字段 | cc-plugin-marketplace | git-clone-with-setup | npx-skill-installer | npm-cli | mcp-stdio-add | mcp-http-add |
|------|-----------------------|----------------------|---------------------|---------|---------------|--------------|
| `cmd` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `cwd` | optional | optional | optional | optional | optional | optional |
| `env` | optional | optional | optional | optional | optional | optional |
| `args` | optional | optional | optional | optional | optional | optional |
| `idempotent_check` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `git_ref` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `npm_version` | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| **唯一区分** | git-ref 锁 + ~/.claude.json | git-ref 锁 + 可选 setup.sh | npm-version 锁 + ephemeral | npm-version 锁 + global/npx fallback | MCP CLI add | MCP CLI add |

**差异面实际只有 4 处**：（a）版本锁字段（git_ref vs npm_version）、（b）影响范围（L2/L3/L4）、（c）MCP CLI vs 普通 spawn、（d）setup.sh 可选 hook（仅 git-clone-with-setup）。其余 90% 行为（preflight / dry-run plan / diff / backup / spawn / verify / rollback）完全可共享。

### 4 方案对比

| 方案 | 描述 | 优势 | 劣势 | Karpathy simplicity 打分 | LLM 友好度 |
|------|------|------|------|---------------------------|------------|
| **A1. Abstract class + 6 子类** | `BaseInstaller` 模板方法 dryRun/diff/rollback/confirm；6 子类填 `install`/`verify`/`uninstall` | OOP 教科书；继承树清晰；ADR 0004 6 契约一处实装 | 6 instances 用继承明显 over-engineering；TypeScript class 比 function 更难做 narrow typing；mock 测试要 jest.spyOn class methods | 6/10 — 继承结构 boilerplate 偏多 | 8/10 — 模板方法对 LLM 顺序读友好 |
| **A2. Functional pipeline** | 每 installer = `(manifest) => Pipeline<Step[]>`，pipeline = preflight → dryrun → prompt → backup → apply → verify；steps 是 named `(ctx) => Promise<ctx>` | FP 风格 + 易测（每 step 独立 unit）；6 method 的差异只体现在 step 数组组合上 | TypeScript pipeline 类型推导对 6+ 步链式 ctx 累积比较绕（要么 `any` 要么 generic 复杂）；compose 调试栈不直观 | 7/10 — 类型推导失控就退化成 `any` | 6/10 — pipeline 跳跃式数据流 LLM 不容易顺序 trace |
| **A3. Plain object + helper** ⭐ | 6 个 `installXxx(ctx)` plain async function；调 shared helpers `runDryRun`, `applyDiff`, `backup`, `confirmL3`；helpers 在 `src/installers/lib/` 一组纯函数 | 最简；karpathy "simplicity first" 直接命中；test = call function + assert；TypeScript narrow typing 由 discriminator union 自然驱动；新增 method 只要写 1 个 function | 6 method × 6 step 矩阵在视觉上有少量重复（但每行只是 `await runDryRun(ctx)` 一行 helper call，不是真重复） | 9/10 — 完全符合 surgical changes | 9/10 — function flat 结构最容易被 LLM 顺读 |
| **A4. State machine（XState）** | install 是 FSM；phases = transitions；guards 处理 confirm/error；XState 可 visualize | 形式化（dry-run / partial-install 状态机化）；可视化报告漂亮；error recovery 模型化 | 引入 XState dep（~50KB + 学习曲线）；6 个简单串行 phase 杀鸡用牛刀；XState v5 强 TypeScript 但 ESM-only 配置仍踩坑；维护者得懂 actor model | 4/10 — 严重违反 simplicity | 5/10 — actor model 对 LLM 是新心智模型 |

### 外部参考

- **Homebrew Cask** 用 `Cask::Installer` Ruby class + DSL 定义层（builder + strategy 混合）。Cask 的 install method 数量 >> 6（dmg / pkg / zip / app / installer / suite ...），所以用类继承是合理的；harnessed 6 method 量级不到 cask 的零头。
- **Cargo** 用 `sources::source::Source` trait 抽象 package source，实现散落在 `sources/` 目录。Rust trait 是组合 + 静态分发，等价于 TypeScript 的 discriminated union + 函数集合（A3）。Cargo 的 source 数量也少（registry / git / path / replaced），证实"少 instance + 函数集合"是 mainstream。
- **create-vite / create-astro**（直接对标 — 都是 Node.js + ESM + commander 类似栈）：实测都用 **A3 风格** —— `init()` 函数 + 直接调 `mri` argparse + `@clack/prompts` 顺序 prompt + `node:fs` + `cross-spawn`，**没有抽象类**，只有 plain functions + shared helper 模块。
  - 这是与 harnessed 最相似的 peer，强烈支持 A3。

### 推荐：A3（Plain object + helper）

**为什么不是 A1**：6 个 instance 用继承是 textbook over-engineering。继承树带来的 1 个收益（contract enforcement）已经被 ADR 0004 的 contract test（`tests/integration/installer-contract.test.ts`）覆盖。重复 surface 也不是真重复 — 每个 method 的 `install*` function 体内主要是 helper call，不是逻辑复制。

**为什么不是 A2**：TypeScript 的函数式 pipeline（`pipe(preflight, dryRun, ...)`）对 6 步链式 context 累积要么用复杂 generic（`<C1, C2, C3, C4, C5, C6>`）要么退化 `any`。Phase 1.1 已经吃过类型不严的亏（F8/F9 ajv/typebox interop）— 不再增加类型负担。

**为什么不是 A4**：XState 是为了 reactive UI / 长生命周期 actor 设计；harnessed 的 install 是短命 batch process，引入 XState 等于打开 Pandora's box（actor lifecycle / persistence / event sourcing 全要决策）— 完全 over-spec。

**为什么是 A3**：典 karpathy simplicity 命中（"the fastest way to write code is to not write it"）。create-vite / create-astro 双 peer 实证此模式可 scale 到 production CLI（vite 周下载 ~10M）。Phase 1.1 已经选定 commander + tsup + ESM 的 plain TypeScript 栈，A3 与现有风格 100% 对齐。

### Ready-to-use 代码骨架（≤ 50 行）

```typescript
// src/installers/types.ts
import type { Manifest } from '../manifest/schema/types.js'
import type { InstallResult, InstallContext } from './lib/types.js'

export type Installer = (ctx: InstallContext) => Promise<InstallResult>

// src/installers/index.ts
import { installCcPluginMarketplace } from './ccPluginMarketplace.js'
import { installGitCloneWithSetup } from './gitCloneWithSetup.js'
import { installNpxSkillInstaller } from './npxSkillInstaller.js'
import { installNpmCli } from './npmCli.js'
import { installMcpStdioAdd } from './mcpStdioAdd.js'
import { installMcpHttpAdd } from './mcpHttpAdd.js'

export const installers: Record<Manifest['spec']['install']['method'], Installer> = {
  'cc-plugin-marketplace': installCcPluginMarketplace,
  'git-clone-with-setup':  installGitCloneWithSetup,
  'npx-skill-installer':   installNpxSkillInstaller,
  'npm-cli':               installNpmCli,
  'mcp-stdio-add':         installMcpStdioAdd,
  'mcp-http-add':          installMcpHttpAdd,
}

export async function runInstall(manifest: Manifest, opts: InstallOpts): Promise<InstallResult> {
  const installer = installers[manifest.spec.install.method]
  return installer({ manifest, opts, level: levelOf(manifest) })
}

// src/installers/ccPluginMarketplace.ts (典型 method 文件，~30 行)
import { preflight, planDryRun, renderDiff, confirmAt, backup, spawnCmd, verify } from './lib/index.js'

export const installCcPluginMarketplace: Installer = async (ctx) => {
  await preflight(ctx)                                    // upstream reachable / git_ref valid
  const plan = await planDryRun(ctx)                      // 计算 will-modify file list
  console.log(renderDiff(plan))                           // unified diff (ADR 0004 § 2)
  if (!await confirmAt('L3', ctx)) return { status: 'aborted' }
  const backupId = await backup(plan)                     // .harnessed-backup/<iso>/
  try {
    await spawnCmd(ctx.manifest.spec.install.cmd, ctx)
    await verify(ctx.manifest.spec.verify)
    return { status: 'ok', backupId }
  } catch (e) {
    return { status: 'failed', backupId, error: e, suggest: `harnessed rollback ${backupId}` }
  }
}
```

`lib/` 6 个纯函数（preflight / planDryRun / renderDiff / confirmAt / backup / spawnCmd）是 ADR 0004 6 契约的实装焦点 —— 6 method × 6 helper = 36 测试 cell 的 contract test 矩阵。

---

## Sub-issue B: CLI Output Lib 选型

ADR 0004 § 2 + § 4 要求：unified diff + 终端有色 + isTTY 检测 + 大 diff 折叠 + 4-level prompt（含 L3 二次确认 + L4 explicit flag）。需要三类 lib。

### B.1 彩色输出 lib

| Lib | 周下载（2026-05） | 包大小 | ESM | CJS | 链式 API | 推荐场景 |
|-----|--------------------|--------|------|-----|----------|----------|
| **picocolors** v1.1 | 90M+ | **7 KB** | 是 | 是（dual） | 否（无 `.red.bold`） | tooling / CLI / library deps（PostCSS / Vite / Prettier 内部用） |
| chalk v5 | 407M | 101 KB | 是 | 否（v5 ESM-only） | 是 | 已是 ESM-only 项目 + 要 truecolor 才值 |
| kleur v4 | 49M | 21 KB | 是 | 是 | 是 | dual-format 中庸选项；harnessed 不 dual-format → 无差异化 |
| ansi-colors v4 | — | ~10 KB | 是 | 是 | 是 | 老项目；新项目无理由选 |
| 内置 ANSI codes | — | 0 KB | — | — | — | 极致省 dep；但 isColorSupported 自己写 ~30 行（重新发明轮子） |

**推荐：picocolors**

理由：
1. ESM + CJS dual（哪怕 harnessed v0.1 是 pure ESM，downstream 工具链兼容性无成本）
2. 7 KB 是 chalk 的 1/14，与 karpathy "minimal lock-in" 完美对齐
3. 内置 `isColorSupported` 已经处理 NO_COLOR / FORCE_COLOR / TERM=dumb / `process.stdout.isTTY`，不用自己重写
4. **关键：picocolors 与 jsdiff 一起是 create-vite / create-astro 的栈**（与 harnessed 99% 同构的 peer 实证可 scale）
5. 不需要 chalk truecolor / 链式 API（unified diff 只用 red / green / dim / bold 4 色）

**避开 chalk v5 的真实风险**：phase 1.1 F9 已经记录 ajv-formats CJS interop 坑；chalk v5 是 strict ESM-only（`exports` 字段无 `require` 条目），未来若 harnessed 想被 CJS 项目消费（unlikely 但可能），chalk v5 是单点污染源。picocolors 干净。

### B.2 Diff 生成 lib

| Lib | 周下载 | 包大小 | API | 推荐 |
|-----|--------|--------|------|------|
| **diff (jsdiff)** v9.0 | 100M+ | ~30 KB | `createPatch(name, old, new, oldHdr, newHdr, opts)` 返回 unified diff 字符串；`stripTrailingCr: true` 选项处理 CRLF/LF | 标准选择 |
| diff-match-patch-es (antfu) | 低 | 类似 | 不同算法（Google DMP）；ESM/TS 重写 | 算法导向不同；harnessed 要 line-level patch 不是 char-level |
| 自实现 LCS | 0 | 0 | ~200 行 TS | 重新发明轮子；CRLF / Unicode / large file timeout 全要自己解 |

**推荐：diff (jsdiff) v9**

理由：
1. v9 已经 native TS types（不再依赖 `@types/diff`）
2. ESM + CJS dual export
3. `stripTrailingCr: true` 直接解决 ADR 0004 跨 OS 痛点（Win CRLF 写文件 vs mac/linux LF 读 manifest）
4. `createPatch` 输出原生 unified diff，与 ADR 0004 § 2 "类似 git diff" 100% 字面对齐 —— 用户复制粘贴即可喂给任何 diff viewer
5. `timeout` + `maxEditLength` 选项可防止 pathological 大 manifest diff 卡死
6. 9 上游已实证 manifest 体积（每个 ~1-3 KB），diff 性能完全不是瓶颈

**diff format 决策（unified vs side-by-side vs intra-line）**：unified。理由：
- 终端宽度不可控（CI runner 80 col / 用户 fullscreen 200 col 都要适配）—— side-by-side 在窄终端崩
- ADR 0004 已经明文 "unified diff"
- 大多数 install 改的是 `~/.claude.json` 单文件、几行 patch — side-by-side 优势（视觉对照）不显著
- 用户已经熟悉 git diff 阅读模型 —— 学习成本 0

### B.3 Prompt 库

| Lib | 周下载 | 包大小 | ESM | 关键能力 | 推荐 |
|-----|--------|--------|-----|----------|------|
| @clack/prompts v0.10+ | 500K（高速增长） | 220 KB（含 4 dep） | pure ESM | intro/outro + confirm + select + multiselect + text + spinner + group（多步 wizard）+ isCancel 守卫；自带漂亮样式 | 现代选择 |
| prompts (terkelg) | 44M | ~30 KB | CJS-first，ESM 可用但 maintenance lag | 类似 API；社区仍喜欢；但 v2.4 多年没大更新 | 备选（若不要 spinner / group） |
| inquirer v12 | 45M | ~200 KB | v9+ ESM-only | 最 feature-rich；v9 重写裂出 @inquirer/prompts | over-engineering for 6 install method |
| enquirer | — | — | — | 弃维护 | 否 |
| readline 内置 | 0 | 0 | — | UX 粗糙；y/n + 选项菜单全自己写 | 否 |

推荐：@clack/prompts

理由：
1. ADR 0004 § 4 4-level confirm 直接映射 Clack API
   - L1 用 note() 仅打印
   - L2 用 confirm({ message: Proceed?, initialValue: false })
   - L3 用 confirm() x 2（第二个 message 含 this affects other plugins）
   - L4 程序检测 --system flag 缺失就 cancel() + exit
2. p.group() 完美适配 install wizard，6 个 step（preflight check → dry-run summary → diff → confirm → backup → execute）可以 group 写一遍
3. isCancel(answer) 守卫让 Ctrl-C 不会变成 undefined-poisoning bug（terkelg/prompts 知名痛点）
4. spinner() 自带，install 期间动画不用引第二个包（ora 100K+ 跳过）
5. 官方推荐栈是 @clack/prompts + picocolors + mri（Clack README 直接背书 vite-style stack） — 与 harnessed 现有 commander 栈兼容
6. Node.js >= 20.12 要求 — harnessed engines >=22.0.0 满足

Clack 真实风险：
- pure ESM only — 与 ADR 0002 type module 一致
- 220 KB install size 比 terkelg/prompts 大（30 KB）—— 但 4 个 dep 都是 small（fast-string-width / fast-wrap-ansi / sisteransi / @clack/core），不是 inquirer 量级膨胀
- 周下载 500K 比 prompts 44M 小 100x — 但增长趋势猛（被 vite / astro / nuxt scaffolders 全栈采用），bus factor 不孤立

### Ready-to-use package.json deps

```
{
  "dependencies": {
    "@sinclair/typebox": "^0.34.49",
    "ajv": "^8.20.0",
    "ajv-errors": "^3.0.0",
    "ajv-formats": "^3.0.1",
    "commander": "^13.0.0",
    "yaml": "^2.9.0",
    "@clack/prompts": "^0.10.0",
    "picocolors": "^1.1.0",
    "diff": "^9.0.0"
  }
}
```

3 个新 dep，加起来 ~250 KB install / ~37 KB runtime（picocolors 7 + diff 30 + clack 200 含子 dep）。

### 简单使用示例（diff renderer + 4-level confirm）

伪码（避免引入复杂引号转义；详细文件路径 + import 见 plan-phase task T-2.3 / T-2.4）：

- diff renderer = createPatch(filename, oldText, newText, "", "", { stripTrailingCr: true }) → 按行 split → 第一字符 +/-/@@ 用 picocolors green/red/cyan 染色 → join 输出
- 4-level confirm = 用 @clack/prompts 的 note(L1) / confirm(L2) / confirm × 2(L3) / 程序 cancel + exit if !--system flag(L4)；统一 isCancel 守卫

---

## 综合推荐（一句话堆栈）

A3 plain functions + 6 method-files + lib/ helpers，CLI 用 picocolors + diff(jsdiff) + @clack/prompts —— 即 vite/astro 同款栈，已被千万级周下载工具实证可 scale。

---

## 对 phase 1.2 plan-phase 的输入

### Task 拆分建议（粗粒度）

| Task ID | 内容 | 文件 | 行数预估 |
|---------|------|------|----------|
| T-2.1 | src/installers/lib/types.ts — InstallContext / InstallResult / Level 类型 | 新增 | ~40 |
| T-2.2 | src/installers/lib/preflight.ts — upstream reachable + git_ref valid + platform check | 新增 | ~80 |
| T-2.3 | src/installers/lib/diff.ts — createPatch wrapper + 折叠 + isTTY-aware 上色 | 新增 | ~60 |
| T-2.4 | src/installers/lib/confirm.ts — 4-level confirm + Clack wrappers + isCancel guards | 新增 | ~50 |
| T-2.5 | src/installers/lib/backup.ts — .harnessed-backup/ + metadata.json + sha1 | 新增 | ~120 |
| T-2.6 | src/installers/lib/spawn.ts — cross-OS spawn（Win cmd.exe vs sh）+ env 注入 + timeout | 新增 | ~90 |
| T-2.7 | 6 method file（cc / git / npx / npm / mcp-stdio / mcp-http） | 新增 ×6 | ~30 each = ~180 |
| T-2.8 | src/installers/index.ts — 6-method dispatch table + runInstall orchestrator | 新增 | ~40 |
| T-2.9 | src/cli.ts 接 harnessed install + flags (--apply / --dry-run / --system / --non-interactive) | 改 | ~80 |
| T-2.10 | tests/integration/installer-contract.test.ts — ADR 0004 6 契约 × 6 method = 36 test cells | 新增 | ~300 |
| T-2.11 | MCP CLI wrapper（mcp-stdio / mcp-http 调 claude mcp add --scope project）+ user-scope-bug 守门 test | 新增 | ~60 |
| T-2.12 | harnessed rollback / backup list / gc --older-than 30d 子命令 | 新增 | ~80 |
| T-2.13 | docs/INSTALLER-CONTRACT.md 用户视角 + 错误信息库 | 新增 | ~150 |

总行数估算（不含 docs / tests）：~1080 行 production TS。对 phase 1.2 是合理 surface（phase 1.1 是 ~1500 行 production schema 代码）。

### ADR 0004 6 契约的 abstraction 实装优先级

| 契约 | 实装位置 | 优先级 | 备注 |
|------|----------|--------|------|
| 1. Dry-run default + --apply | lib/preflight.ts + cli.ts flags | P0（最早做） | 不做这条所有 install 都不安全 |
| 2. Unified diff format | lib/diff.ts（jsdiff + picocolors） | P0 | 1 上锁所有 method |
| 3. Backup .harnessed-backup/ | lib/backup.ts | P0 | 没 backup 就没 rollback |
| 4. L1-L4 4-level confirm | lib/confirm.ts（Clack） | P1（依赖 #1 #2） | 每 method declare 自己的 level（spec 文件常量） |
| 5. MCP CLI 强制 | mcp-stdio-add / mcp-http-add 直接 spawn claude mcp ...，跳 lib/spawn.ts 通用路径 | P1 | F20 已记录 user-scope bug |
| 6. No silent failures | lib/spawn.ts exit code propagation + try/catch + InstallResult 显式 status | P0（与 #1 同步） | 错误信息含 harnessed rollback suggest |

### Karpathy simplicity 行数检查

- A3 abstraction：6 method file × ~30 行 + 6 helper file × ~50-120 行 + dispatch ~40 行 = ~600 行 abstraction surface
- A1 等价实装（继承）：BaseInstaller ~200 + 6 子类 × ~60 + protected helpers ~300 = ~860 行（多 ~40%）
- A3 节省 ~40% boilerplate 完全符合 simplicity first

### 跨 OS 风险红旗

1. process.stdout.isTTY 在 Windows git-bash 下返回 undefined（WebSearch 实证：nodejs/node#39673 多年未解）—— ADR 0004 § 2 通过 isTTY 检测 nocolor 字面执行会在 Win 用户机上误判。
   - 缓解：picocolors isColorSupported 内部已经组合 isTTY ?? false || env.FORCE_COLOR（不只读 isTTY），可信任。
   - 额外：installer 必须支持 --no-color flag 让用户手动覆盖（commander 接 1 行）。
2. CRLF / LF 差异：jsdiff stripTrailingCr: true 必须 default ON（contract test 一项）。
3. PowerShell vs bash spawn 差异：cmd 字段在 Win 默认走 cmd.exe /c，Unix 走 /bin/sh -c。lib/spawn.ts 必须封装这层（不让 6 method 各自处理）。

---

## 信息来源（URL）

### 调研一手
- picocolors README + isColorSupported https://github.com/alexeyraspopov/picocolors （via Context7 /alexeyraspopov/picocolors）
- Clack prompts API（intro/outro/confirm/select/spinner/group/isCancel） https://github.com/bombshell-dev/clack （via Context7 /bombshell-dev/clack）
- jsdiff v9 createPatch + stripTrailingCr https://github.com/kpdecker/jsdiff （WebFetch）
- npm trends chalk vs picocolors vs kleur https://npmtrends.com/chalk-vs-colors-vs-picocolors
- npm trends enquirer vs inquirer vs prompt vs prompts https://npmtrends.com/enquirer-vs-inquirer-vs-prompt-vs-prompts
- PkgPulse Ink vs Clack vs Enquirer 2026 https://www.pkgpulse.com/guides/ink-vs-clack-vs-enquirer-interactive-cli-nodejs-2026
- PkgPulse ESM/CJS migration 2026 https://www.pkgpulse.com/guides/great-migration-cjs-to-esm-npm-ecosystem-2026
- DEV comparison of nodejs color libraries https://dev.to/webdiscus/comparison-of-nodejs-libraries-to-colorize-text-in-terminal-4j3a

### 抽象层 peer
- Homebrew Cask Installer Ruby class https://rubydoc.brew.sh/Cask/Installer.html
- Homebrew Formula and Cask System (DeepWiki) https://deepwiki.com/Homebrew/brew/3-formula-and-cask-system
- Cargo source trait abstraction https://docs.rs/cargo/latest/cargo/index.html
- create-vite source（FRAMEWORKS array + 函数式 init pattern） https://github.com/vitejs/vite
- DEV 3 cool things about create-vite CLI https://dev.to/bhuynhdev/3-cool-things-about-the-create-vite-cli-you-might-not-have-known-13ij
- Astro CLI Commands and Development Workflow (DeepWiki) https://deepwiki.com/withastro/astro/7.1-cli-commands-and-development-workflow

### 跨 OS / TTY 风险
- Node.js issue 39673 process.stdout.isTTY undefined in git-bash https://github.com/nodejs/node/issues/39673
- Node.js issue 3006 tty unreliable on Windows / cygwin https://github.com/nodejs/node/issues/3006
- Mintty wiki tips（ConPTY / winpty） https://github.com/mintty/mintty/wiki/Tips

### Diff format
- Git diff-format docs https://git-scm.com/docs/diff-format
- DEV Understanding Diff Formats https://dev.to/shrsv/understanding-diff-formats-a-developers-guide-to-making-sense-of-changes-414o
- HN Deff side-by-side terminal diff https://news.ycombinator.com/item?id=47169518

### 项目内
- D:/GitCode/harnessed/docs/adr/0001-manifest-schema-v1.md
- D:/GitCode/harnessed/docs/adr/0003-install-method-count-errata.md
- D:/GitCode/harnessed/docs/adr/0004-installer-dry-run-diff-preview-contract.md
- D:/GitCode/harnessed/src/manifest/schema/installMethods/ （6 method schema 同构性证据：ccPluginMarketplace / gitCloneWithSetup / npxSkillInstaller / npmCli / mcpStdioAdd / mcpHttpAdd）
- D:/GitCode/harnessed/src/manifest/schema/spec.ts （spec.verify / spec.uninstall / spec.platforms 已经把跨 method 行为字段化）
- D:/GitCode/harnessed/.planning/STATE.md § 关键提醒 # 4 cross-OS Day 1
