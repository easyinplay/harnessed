# Phase 1.3 PATTERNS — Codebase Pattern Mapping

> **调研日期**: 2026-05-12
> **Reviewer**: gsd-pattern-mapper（Opus 4.7，read-only）
> **目的**: 把 phase 1.3 acceptance bar B1-B8 涉及的新文件 / 修改文件 1:1 映射到 phase 1.1 / 1.2 / 1.2.5 已 ship 的 pattern analogs，避免重新发明轮子，确保风格一致。
> **输入实证**:
>   - `D:\GitCode\harnessed\.planning\phase-1.3\KICKOFF.md` — B1-B8 acceptance bar
>   - `D:\GitCode\harnessed\.planning\phase-1.2\PATTERNS.md` — phase 1.2 已识别 11 patterns A-K + 6 reuse decisions D-1~D-6（参考风格）
>   - `D:\GitCode\harnessed\src\manifest\schema\installMethods\ccPluginMarketplace.ts` — phase 1.2.5 ADR 0005 加 `marketplace_source` 实施（最近 errata 实施 analog）
>   - `D:\GitCode\harnessed\tests\unit\manifest-validate.marketplace-source.test.ts` — Pattern J BASE+with* modifier 风格（最近示例）
>   - `D:\GitCode\harnessed\src\cli\install.ts` — phase 1.2 cli/install.ts (~117L) — `--base` flag 扩展点
>   - `D:\GitCode\harnessed\src\installers\index.ts` — Pattern G barrel + dispatcher
>   - `D:\GitCode\harnessed\.planning\phase-1.2.5\GRAY-AREA-1-routing-engine.md` § 2 — `decision_rules.yaml` schema 完整定义（B4 来源真理）
>   - `D:\GitCode\harnessed\docs\adr\0005-marketplace-source-schema-errata.md` — ADR 0007 起草最近 errata analog
>   - `D:\GitCode\harnessed\.github\workflows\ci.yml` L34-L64 — A7 step iterate 0001-0006 expansion 点
>   - `D:\GitCode\harnessed\src\manifest\security.ts` L122-L128 — B1 cmdPaths 硬编码扩展点（KICKOFF 约束 §3）
>   - `D:\GitCode\harnessed\src\manifest\schema\{spec,index,metadata,types}.ts` — schema 加字段位置确定
>   - `D:\GitCode\harnessed\tests\integration\installer-real-spawn.test.ts` — Pattern K skipIf gate（B6 实测脚本风格）
>   - `D:\GitCode\harnessed\docs\INSTALLER-CONTRACT.md` (~180L) — B7 contract 文档风格 analog

---

## § 1 phase 1.3 acceptance bar B1-B8 → phase 1.1-1.2 analog 映射

| AB | 新文件 / 修改文件 | 最近 phase 1.1-1.2 analog | reuse 类型 | 备注 |
|----|------------------|---------------------------|-----------|------|
| **B1** | `docs/adr/0007-categorization-schema-errata.md` (新建) | `docs/adr/0005-marketplace-source-schema-errata.md` (phase 1.2.5 ship) | structure-clone（Status / Context / Decision / Consequences / Compliance / References 6-section 风格 + "errata 不动 main body" 沿袭说辞 + A7 守恒命令更新段）| 0007 是 **schema errata**（与 0005 同性质）；不是 0006 那种 wedge-level new ADR。0006 适合 phase 1.4 大改时参考，0007 走 0005 路径。|
| **B2** | `src/manifest/schema/spec.ts` 修改 + 可能新建 `src/manifest/schema/categorization.ts` | `src/manifest/schema/installMethods/ccPluginMarketplace.ts` L19-L40（`marketplace_source` 加字段）| **方向不同的字段加法 pattern** ⚠️ | 0005 加在 **method-specific** 文件（仅 cc-plugin-marketplace 接受）；phase 1.3 三字段是 **spec-level metadata**（与 install.method 正交），加在 `spec.ts` SpecSchema 内。详见 § 3 Pattern L 新加。|
| **B3** | `tests/unit/manifest-validate.{category,install-type,decision-rules}.test.ts`（≥ 12 cell 拆 3 文件）| `tests/unit/manifest-validate.marketplace-source.test.ts` (5 cell, 148L) | Pattern J（BASE template + `with*()` modifier + `__PLACEHOLDER__` replace）+ Pattern I 自动 glob 复用 | 复用同样的 yaml-template-string + `BASE.replace('__CATEGORY__\n', ...)` 风格。L88-L93 `withMarketplaceSource()` helper 直接抄。|
| **B4** | `.planning/decision_rules.yaml` (新建 v1) | **无直接 analog** — `manifests/*/*.yaml` 是 entity manifest（per-tool）；decision_rules 是 rule-set。可参考 `manifests/SCHEMA.md` (schema doc artifact 风格，~50L 顶层结构表) + `schemas/manifest.v1.schema.json` (build:schema 产物)。**真理来源**: `.planning/phase-1.2.5/GRAY-AREA-1-routing-engine.md` § 2 (L49-L194 完整 schema 草案) | structure-clone-from-spec | 直接把 GRAY-AREA-1 § 2 的 yaml 块拷出（已含 6 category × 12+ rules + DMN Priority Hit Policy + `fallback_supervisor` + `deprecated`）+ 头部加 `# yaml-language-server` 指令 + 加 `version: 1` SSOT 字段（沿袭 manifest `apiVersion: harnessed/v1` 风格 — 见 § 5 风险点）|
| **B5** | `src/cli/install.ts` 修改（加 `--base` flag）| `src/cli/install.ts` L46-L56 现有 5 flag 注册（`--apply` `--dry-run` `--system` `--non-interactive` `--full-diff` `--no-color`）| commander **flag 添加 pattern**（同文件原位 extension）+ Pattern C narrow（`--base` 不接受 `<name>` 参数 → 改 command signature 或 split subcommand）+ Pattern H IMPL NOTE | 关键设计选择：**(a)** 同 `install <name>` 命令但 `<name>` 改 optional + `--base` 互斥；或 **(b)** 新建 `install-base` 子命令（commander `.command('install-base')`）。建议 **(b)** —— 不污染现有 `install <name>` 5-flag combo 的 H1 pre-action gate 逻辑（L57-L64）。base profile 安装是 batch 操作，命令独立更 clean。复用 `runInstall()` orchestrator + 循环遍历 `manifests/{tools,skill-packs}/*.yaml` 10 个文件。|
| **B6** | （实验性脚本）`tests/integration/ui-ux-pro-max-real-install.test.ts` 或 `scripts/ci/probe-ui-ux-pro-max.sh` | `tests/integration/installer-real-spawn.test.ts`（85L，`HARNESSED_REAL_SPAWN=1` skipIf gate, L31 `const REAL = process.env.HARNESSED_REAL_SPAWN === '1'`, L33 `describe.skipIf(!REAL)(...)`, L77-L83 sandbox cleanup `mkdtempSync` + `rmSync({ recursive, force })`）| Pattern K（platform-aware skipIf gate） + Pattern H IMPL NOTE 引用 D1.2.5-11 | 复用 `mkdtempSync + tmpdir() + rmSync(recursive)` 沙箱模式；env 变量建议**新加** `HARNESSED_UI_UX_PROBE=1`（与 `HARNESSED_REAL_SPAWN` 隔离 — 后者是 npm 全局装，前者是 git-clone 子目录拷贝/symlink）。**或** 简化版本：用 `scripts/ci/probe-ui-ux-pro-max.sh` shell 脚本 + 不进 vitest（B6 是 D1.2.5-11 实测调研，不是 commit 的 regression test）。|
| **B7** | `docs/AGENT-DEFINITION-FACTORY-CONTRACT.md` (新建 ≥ 100L draft) | `docs/INSTALLER-CONTRACT.md` (180L, phase 1.2 ship) | structure-clone（"Why this contract" → "Six Contracts (or N Contracts)" 编号段 → "Error Reference" 表 → "FAQ" → "See Also" link 块的 5-section 风格）| INSTALLER-CONTRACT.md L1-L8 "Audience / Source / Phase / Cross-ref" header block 直接复用风格。draft 不实装 — 仅 contract 定义（function signature `createAgentDefinition(skills, prompt, tools): AgentDefinition` + 错误处理路径 + 与 `runInstall()` interop）。phase 1.4 实装时此文件升级为 enforced contract（同 INSTALLER-CONTRACT 升级路径）。|
| **B8** | `.github/workflows/ci.yml` 修改（A7 step iterate 1-6 → 1-7）| `.github/workflows/ci.yml` L34-L64 phase 1.2.5 实施版（已 iterate 0001-0006，2 处 `for n in 0001 0002 0003 0004 0005 0006`）| **yaml shell loop expansion pattern**（数字字符串列表追加）+ comment block 同步更新（L37-L38 "ADR 0001-0006 main body 守恒"）| 改动极小：**3 处** —— L42 + L53 加 `0007`；L64 输出文案 `"A7 ✅ ADR 0001-0006 unchanged"` → `"... 0001-0007 ..."`；L34-L38 注释 phase 标识从 phase 1.2.5 → phase 1.3。`adr-0007-accepted` tag 必须在 ship commit 上打 + push（否则 missing_tags warning 会 silent skip）。|

### 关键 mapping insight

- **B2 是 phase 1.3 schema 字段加法的 invert** — 不是再加在 method-specific 文件（如 0005 加在 `installMethods/ccPluginMarketplace.ts`），而是加在 spec-level（`spec.ts`）。这意味着所有 install.method 的 manifest 都强制 `category` + `install_type` 字段。**无现有 analog**（phase 1.1-1.2 没改过 spec.ts 顶层）—— 但 spec.ts 内部加字段的句法风格（见 spec.ts L79-L94 现有 SpecSchema 内 `Type.Optional(...)` 风格）依然沿袭 Pattern A。
- **B7 与 B4 是仅有的两个"draft 类"产物**（不是 immediately enforced） — B4 v1 schema 落地后 phase 1.4 routing engine 才消费；B7 contract 文档 phase 1.4 factory 才实装。两者都需要 "v1 / draft" 标签，避免 phase 1.4 调整时被 A7 守恒锁死（**注意**: phase 1.3 的 `decision_rules.yaml` 不打 baseline tag — 它是活文档；只有 ADR 0007 main body 锁定）。
- **B8 是 phase 1.3 影响最小的 acceptance bar** — 仅改 ci.yml 数字 + 文案。但**前置依赖**: B1 ADR 0007 ship + tag push 必须先于 B8 enable —— 否则 CI green run 时 missing_tags warning 让 A7 step silent skip，B8 实际未生效。

---

## § 2 phase 1.2 patterns A-K phase 1.3 复用决策

phase 1.2 已识别 11 patterns（A-K，详 `.planning/phase-1.2/PATTERNS.md` § 一）。phase 1.3 复用决策：

| Pattern | phase 1.3 复用? | 复用方式 | 关键文件 |
|---------|----------------|---------|---------|
| **A** TypeBox `Type.Object + additionalProperties: false + Type.Union literal` | ✅ **直接复用** | spec.ts 加 3 字段沿袭：`category: Type.Union([Type.Literal('meta'), ..., Type.Literal('search')])`（6 enum）+ `install_type: Type.Union([Type.Literal('skill'), ..., Type.Literal('git')])`（4 enum）+ `decision_rules: Type.Optional(Type.Object({...}, { additionalProperties: false }))`（嵌套 object，optional）| `src/manifest/schema/spec.ts` ＋（如另抽文件）`src/manifest/schema/categorization.ts` |
| **B** Module-level singleton + lazy compile（Ajv） | ✅ **直接复用，零成本** | phase 1.3 不重新初始化 Ajv —— `validate.ts` L36-L42 `getValidator()` 编译入口已含 ManifestSchema；schema 加字段后第一次 validate 调用自动 re-compile（vitest 跨 test instance 的 module cache 问题不存在 — Ajv compile 是 schema 引用比对，spec.ts 改后 ManifestSchema 是新引用 → cache miss → recompile）| `src/manifest/validate.ts` 不动 |
| **C** Discriminated `Result` (ok/errors)，不抛异常 | ✅ **直接复用** | B5 `--base` flag 实施：`runInstall()` 在 for-loop 内调用，每次返回 `InstallResult`；同样 narrow 到 exit code（per-file ok=0 / aborted=2 / error=1）+ aggregate 总结（"installed 8 / 10, 2 failed"）。**新设计**: B5 base profile 总结输出形状建议 `{ ok: true; summary: { installed, failed, skipped } } \| { ok: false; firstFailure: InstallError }`（仍是 discriminator 风格，per Pattern C）| `src/cli/install.ts` 内新加 `registerInstallBase()` |
| **D** Pre-pass before main validation（security gate） | ⚠️ **需扩展** | B1 KICKOFF 第 44 行硬约束："新加 manifest 字段 `decision_rules` 是 yaml object，可能含字符串字段 — 需要在 phase 1.1.1 实装的 `checkSecurityViolations` 内确保 `decision_rules.*` 字段也走 shell-escape 过滤"。`security.ts` L122-L128 `cmdPaths` 是硬编码 path 列表，**必须追加** `['spec', 'decision_rules', 'cmd']` / `['spec', 'decision_rules', 'install', 0]` 等若 decision_rules schema 含 cmd-shape 字段。**或** decision_rules schema 设计为 v1 仅含**非命令**字段（如 `category_hint: string`），躲开 security gate 扩展（推荐 — karpathy YAGNI）。详见 § 5 风险 1。| `src/manifest/security.ts` L122-L128 cmdPaths 数组 |
| **E** Friendly error mapping（统一 ValidationError 形状） | ✅ **直接复用** | phase 1.3 三个新 schema 字段错误（enum mismatch / missing required / additionalProperties）走 Ajv → `ajvErrorToFriendly` 自动归一到 `ValidationError`，**无需扩展** keyword 取值集合（enum / additionalProperties / required 都已存在）；`category` enum 错走 `keyword: 'enum'`（同 B5 测试 L120）。| `src/manifest/errors.ts` 不动 |
| **F** Re-export `Static<typeof S>` | ✅ **直接复用** | spec.ts 加字段后 `Manifest` 类型自动派生 — `src/manifest/schema/types.ts` L10 `Static<typeof ManifestBase>` 自动追新字段；下游 `manifest.spec.category` / `manifest.spec.decision_rules?.xxx` IDE 补全立即可用，0 重写。| `src/manifest/schema/types.ts` 不动 |
| **G** Public re-export（barrel index） | ✅ **直接复用 + 可能扩展** | 若 B2 把 categorization 抽到独立文件 `categorization.ts`，需在 `schema/index.ts` 内 `import { CategoryEnum, InstallTypeEnum, DecisionRulesSchema } from './categorization.js'` 然后 spec.ts 引用；与 phase 1.1 已有 `installMethods/index.ts` 的 dispatcher 风格一致。| `src/manifest/schema/index.ts`（新加 import）|
| **H** IMPL NOTE 注释规约 | ✅ **强制复用** | phase 1.3 必有 4 处 IMPL NOTE：**(1)** spec.ts 新字段顶部引用 ADR 0007 + KICKOFF B2 6-cat / 4-method 锁定来源；**(2)** decision_rules.yaml 顶部引用 GRAY-AREA-1 § 2 truth source + D1.2.5-5 (DMN Priority Hit Policy)；**(3)** cli/install.ts `registerInstallBase` 顶部引用 ADR 0006 § 1 base layer "10 固定 manifest 一键装齐"；**(4)** ci.yml A7 step iterate 数字段开头引用 phase 1.3 B8 + adr-0007-accepted tag。| 4 处分布 |
| **I** Auto-glob fixture | ✅ **直接复用** | B5 `--base` 命令实施：用 `readdirSync('manifests/tools')` + `readdirSync('manifests/skill-packs')` 自动列举 10 manifest（与 phase 1.1 fixtures.test.ts L15-L16 风格一致 —— 加新 manifest = drop yaml 即可，零样板）。**注意**: phase 1.3 实施 B5 时若 `manifests/tools/*.yaml` 目录里出现新 method 的 manifest（如 phase 1.4 加 cc-plugin-marketplace），`runInstall()` 会路由到 `phase21Placeholder`（installers/index.ts L22-L34）报错 — base profile 应**仅装 npm-cli + mcp-stdio-add 两 method 的 manifest**，跳过 placeholder method（per B5 acceptance "phase 1.1-1.2 已 ship 10 manifest" 范围）。| `src/cli/install.ts` 新 `registerInstallBase` 内 readdirSync + filter `m.spec.install.method in ['npm-cli', 'mcp-stdio-add']` |
| **J** BASE template + `with*()` modifier（negative-case 测试） | ✅ **直接复用** | B3 测试 ≥ 12 cell 拆 3 文件：`manifest-validate.category.test.ts`（6 enum × 1 valid + 2 invalid 字符串 = 8 cell）+ `manifest-validate.install-type.test.ts`（4 enum × 同上 = 6 cell）+ `manifest-validate.decision-rules.test.ts`（present-valid / absent / nested-bad-type 至少 3 cell）。**直接抄** marketplace-source.test.ts L13-L48 的 `BASE_*` yaml-template-string + L89-L93 `withMarketplaceSource()` 函数 = `withCategory()` / `withInstallType()` / `withDecisionRules()` 三 helper。| `tests/unit/manifest-validate.{category,install-type,decision-rules}.test.ts` |
| **K** Performance threshold gate / skipIf gate | ✅ **复用 K 的 skipIf 部分** | B6 ui-ux-pro-max install path 实测：复用 `installer-real-spawn.test.ts` L31 / L33 / L77-L83 的 env-gated skipIf + sandbox cleanup pattern。**不复用** perf threshold（manifest-validate.perf.test.ts L65 风格 — phase 1.3 B6 不是 perf gate，是 install path 可行性 probe）。env 变量隔离: `HARNESSED_UI_UX_PROBE=1`（不复用 `HARNESSED_REAL_SPAWN` — 语义不同）。| `tests/integration/ui-ux-pro-max-probe.test.ts` (新建) |

### 复用率统计

- **直接复用零修改**: A / B / C / E / F / I / J（7 / 11 = 64%）
- **复用 + 扩展**: D（cmdPaths 追加） / G（barrel 加 import） / H（4 处新 IMPL NOTE）（3 / 11 = 27%）
- **部分复用**: K（仅 skipIf，不要 perf 部分）（1 / 11 = 9%）
- **不复用**: 0 / 11 = 0%

phase 1.3 是**纯 schema-layer + 文档 + base profile 命令**的工作，不引入新执行 path（不像 phase 1.2 第一次写 child_process / fs 操作），所以 pattern reuse 率显著高于 phase 1.2 的 ~70% 估计。

---

## § 3 phase 1.3 新加 patterns（如有）

phase 1.3 引入 1 个新 pattern + 1 个候选半 pattern。

### Pattern L: spec-level metadata 字段加法（vs method-specific 加法）

- **代表文件（拟）**: `src/manifest/schema/spec.ts` 内 `SpecSchema` Type.Object 顶层 + 可能新建 `src/manifest/schema/categorization.ts`
- **特征**:
  - 字段加在 `SpecSchema`（spec 层 metadata），不加在 `installMethods/<method>.ts`（method-specific）
  - 与 install.method 选择**正交** —— 任何 method 的 manifest 都有 `category` / `install_type`
  - 当字段是嵌套 object（`decision_rules`）时，独立到子文件 `categorization.ts` + barrel re-export，避免 spec.ts 膨胀
  - **不**触发 cross-field allOf 矩阵（不像 ADR 0001 的 `type × install.method` matrix） —— 6 category × 4 install_type 是独立维度
- **vs 现有 marketplace_source 加法（method-specific）**:
  | 维度 | marketplace_source (ADR 0005) | category/install_type/decision_rules (ADR 0007) |
  |------|------------------------------|------------------------------------------------|
  | 加在 | `installMethods/ccPluginMarketplace.ts` | `spec.ts` (or `spec.ts` + `categorization.ts`) |
  | 适用范围 | 仅 cc-plugin-marketplace 接受（其他 method `additionalProperties: false` reject）| 全部 method 的 manifest 都接受 / 强制 |
  | required | optional（official 上游可省略）| `category` / `install_type` 必填；`decision_rules` optional |
  | 是否影响 cross-field allOf | 否 | 否（独立维度，无 type×method 那种矩阵）|
- **使用场景**: 当未来需要加 spec-level metadata（如 phase 1.4 加 `routing_priority: int`，phase 2.x 加 `deprecation_date: date`）时，复用 Pattern L 而非 Pattern marketplace_source 路径。
- **规模**: spec.ts 新增 ~15-20 行；若拆 categorization.ts ~50 行（含嵌套 decision_rules schema）

### Pattern M (候选半 pattern): yaml schema artifact with `version: N` SSOT

- **代表文件（拟）**: `.planning/decision_rules.yaml` 头部 `version: 1` 字段
- **特征**:
  - yaml 配置文件不是 manifest（不是 entity描述），而是 rule-set / config-set
  - 顶部第一字段是 `version: 1` (int)，沿袭 manifest `apiVersion: harnessed/v1` 的 SSOT 哲学
  - 文件第一行 `# yaml-language-server: $schema=...` 注释绑定 schema artifact（沿袭 manifest yaml 风格 — 见 `manifests/tools/ctx7.yaml` L1）
  - 当 schema 演化（v1 → v2）时，提供 migration script `scripts/migrate-decision-rules-v1-to-v2.mjs`（沿袭 phase 1.1 `scripts/h4-replace-signed-by.mjs` 风格 — 一次性迁移脚本）
- **使用场景**: phase 1.4+ 加 routing engine 配置 / phase 2.x 加 vendor curation criteria yaml 等都走此 pattern。
- **当前是"半"**: 仅 phase 1.3 一处使用，未到 pattern 级（≥ 2 处复用才算）。M 命名占位，phase 1.4 出现第二处 yaml config 时 promote 为正式 pattern。

---

## § 4 Phase 1.3 reuse decisions D-1 ~ D-7（追溯 phase 1.2 D-1~D-6 风格）

phase 1.2 PATTERNS.md § 4.3 已给 D-1~D-6（复用 ValidationError / 不复用 yaml CST line mapping / Ajv singleton 复用 / installer 内部类型不走 TypeBox / 复用 fixture-driven test / 复用 H IMPL NOTE）。phase 1.3 新加：

### D-7: 复用 spec.ts SpecSchema 加字段路径（不走 method-specific 路径）

- **决策**: B2 三个新字段加在 `src/manifest/schema/spec.ts` 的 `SpecSchema` 内（`category`, `install_type`, `decision_rules`），不加在 `installMethods/*.ts`
- **理由**:
  - 三个字段是 spec-level metadata，与 install.method 维度正交
  - 加在每个 `installMethods/<method>.ts` 内会导致 6 处重复字段定义 + 测试矩阵爆炸
  - **反驳预案**: 有人会问 "若某个 install_type 仅适用于某 install method（如 install_type=npm 仅 npm-cli），不应在 method-specific 文件 enforce 吗?" → 答: phase 1.3 的 4 install_type (skill/mcp/npm/git) 与 6 install.method 的关系是 **N:M**（如 git 可同时是 git-clone-with-setup 和 mcp-stdio-add via git URL），不是 1:1 映射；若未来需 enforce 兼容性矩阵，走 phase 1.4 ADR 0008 加 allOf if/then 矩阵（同 ADR 0001 的 type × method 矩阵），不污染 spec.ts。

### D-8: ADR 0007 走 errata 路径（不走 wedge 新 ADR 路径）

- **决策**: ADR 0007 走 ADR 0005 风格（schema 字段补完 errata，6-section 文档结构），不走 ADR 0006 风格（wedge 重定位）
- **理由**:
  - phase 1.3 不是架构 wedge —— 是 ADR 0006 § 1 base+extension 双层架构 lock 后的"第一步实装"
  - schema 加字段是 errata 性质（ADR 0001 main body 不动 + A7 守恒维持），与 ADR 0005 完全同质
  - **反驳预案**: 有人会问 "三字段一次加是不是太多，应拆 ADR 0007a/0007b/0007c?" → 答: 三字段同源 D1.2.5-12 (install_type 4 enum) + A8' (6 category) + GRAY-AREA-1 § 2 (decision_rules schema)，是同一 phase 1.2.5 wedge 的 schema 落地；拆 ADR 反而割裂可追溯性。

### D-9: B5 `--base` 走独立 subcommand `install-base`（不污染 `install <name>`）

- **决策**: cli/install.ts 新加 `registerInstallBase(program)` 注册 `install-base` 子命令，不在 `install <name>` 上加 `--base` flag
- **理由**:
  - `install <name>` 现有 6 flag 组合 + H1 pre-action gate（L57-L64 `--non-interactive` 必须配 `--apply`/`--dry-run`） 已经复杂；加 `--base` 让 `<name>` optional 会让 `harnessed install --base ctx7` 这种歧义状态难以处理
  - base profile 是 batch 操作 —— 与 single-target install 语义不同，独立命令更自然
  - **反驳预案**: 有人会问 "用户记两个命令是不是负担?" → 答: `install-base` 输出 `--help` 时同 `install <name>` 一起列出，可发现性 OK；`harnessed install` (no name) 不报错而提示 "did you mean 'install-base'?" mitigation 可加（但 phase 1.3 不强求 — phase 1.4 抛光时加）

### D-10: B6 ui-ux-pro-max 实测**不**写 vitest（用 shell 脚本 / 一次性运行）

- **决策**: B6 实测产物是 `scripts/ci/probe-ui-ux-pro-max.sh`（shell 一次性脚本）+ 调研结论写入 progress.md / RESEARCH.md，不进 `tests/integration/` 目录
- **理由**:
  - B6 是 D1.2.5-11 的实测调研，不是 regression test —— 一次成功验证后即归档结论
  - 若进 vitest，`HARNESSED_UI_UX_PROBE=1` env 默认 skipIf 99% 时间不跑，与 `installer-real-spawn.test.ts` 重复风险
  - **反驳预案**: 有人会问 "phase 1.4 routing engine 真用 ui-ux-pro-max 时不是需要回归测试吗?" → 答: phase 1.4 routing engine factory 实装时会有完整 contract test 覆盖 install path（同 INSTALLER-CONTRACT 12-cell pattern）；phase 1.3 仅是预 probe，确认 install path 可达即可。

### D-11: B4 `decision_rules.yaml` 不打 baseline tag（活文档 vs ADR 锁定）

- **决策**: phase 1.3 ship 时仅打 `adr-0007-accepted` tag（用于 A7 守恒）；`.planning/decision_rules.yaml` v1 不打独立 baseline tag
- **理由**:
  - decision_rules.yaml 是活文档（phase 1.4 routing engine 实装时会调整 rules），打 tag 会被 A7 守恒锁死违反实装路径
  - ADR 0007 main body 是 schema 字段决策（locked） —— decision_rules.yaml 是 schema 实例数据（mutable）
  - 与 phase 1.1 manifest yaml 文件**不**打 baseline tag 一致（仅 ADR 文件打 tag）
  - **反驳预案**: 有人会问 "活文档是否需要版本字段防止 phase 1.4 静默 break?" → 答: 是 —— 走 Pattern M `version: 1` 顶字段 + future migration script，不需 git tag。

### D-12: B7 AgentDefinition factory contract 仅 draft（≥ 100L），不实装代码

- **决策**: phase 1.3 仅产出 `docs/AGENT-DEFINITION-FACTORY-CONTRACT.md` (≥ 100L 文档)；不创建 `src/factories/agent-definition.ts` 代码文件
- **理由**:
  - KICKOFF B7 明确："phase 1.3 仅 draft 不实装（推 phase 1.4）"
  - factory 实装依赖 phase 1.4 routing engine 决策 + AgentDefinition CC API 当前形态（R2 调研待做） —— 提前实装会被 phase 1.4 重写
  - 文档是 phase 1.4 plan-phase 的输入（GRAY-AREA-7 / Sister review M5 触发的提前 capture）
  - **反驳预案**: 有人会问 "如何防止 phase 1.4 实装与 phase 1.3 draft 偏离?" → 答: contract 文档 + ADR 0007 互引; phase 1.4 plan-phase 的 PLAN-CHECK 阶段用此 contract 做 V1 BLOCKER 检查（同 phase 1.1 plan-check 用 ADR 0001 检查 schema 字段一致性的路径）

---

## § 5 关键风险 mapping（KICKOFF Q3）

### 风险 1: TypeBox optional Object 嵌套（`decision_rules` 字段）

- **触发**: B2 加 `decision_rules: Type.Optional(Type.Object({...}, { additionalProperties: false }))`，子字段如 `rules: Type.Array(Type.Object({ id, priority, when, decision, ... }))` 多层嵌套
- **phase 1.1-1.2 已知模式 robust 度**:
  - phase 1.2.5 `marketplace_source` 单层 object 嵌套（仅 `source` + `repo` 2 字段）—— **已实证 OK**（marketplace-source.test.ts 5 cell 全 pass）
  - **未实证**: ≥ 2 层嵌套 + Type.Array of Type.Object（decision_rules schema 真实形状从 GRAY-AREA-1 § 2 看至少 3 层 + array of object）
  - Ajv discriminator strict mode + nested optional object 组合**未在 phase 1.1-1.2 实证**
- **缓解策略**:
  - **Step 1**: phase 1.3 实装 B2 时**先用最小 decision_rules schema**（仅 `version: int` + `rules: Type.Array(Type.Unknown())`），延迟内部 object 形状到 phase 1.4 routing engine 实装时再 firm up
  - **Step 2**: 若 phase 1.3 必须 firm up，优先用 `Type.Record(Type.String(), Type.Unknown())` (typebox 兼容 JSON Schema 的 `additionalProperties: true`) + 用 schema 文档（manifest SCHEMA.md 风格）描述真实 shape，不上 TypeBox 嵌套
  - **Step 3**: 真要嵌套时分文件（`schema/decisionRules.ts` 独立 + barrel re-export），便于单文件 unit test isolation
- **触发应对模式**: phase 1.1 schema/installMethods/index.ts L34-L42 的 hand-built JSON Schema 路径（绕 TypeBox emit `anyOf` vs Ajv 期望 `oneOf` 不匹配）—— 若 TypeBox nested optional object emit 与 Ajv strict 冲突，复制此手写 JSON Schema 路径

### 风险 2: A7 守恒在加新字段时如何不污染 ADR 0001 main body

- **触发**: B1 加 ADR 0007 errata 时如何确保 ADR 0001 main body 仍 byte-identical
- **phase 1.1-1.2 已知模式**:
  - ADR 0003 / 0005 已实证 errata 路径 —— ADR 0001 main body 0 修改，A7 step iterate 验证通过
  - phase 1.2.5 wedge ADR 0006 也走"不动 0001"路径 —— 即使是架构重定位级改动，ADR 0001 schema 决策仍守恒
- **缓解策略**:
  - **Step 1**: ADR 0007 起草前先 `git diff adr-0001-accepted -- docs/adr/0001-*.md` 确认空 diff（phase 1.3 起手就是 0006-accepted 状态，应该已 OK，但 paranoid check）
  - **Step 2**: ADR 0007 文档**仅引用**ADR 0001 字段表行号（如 "ADR 0001 line 79 spec 字段表后追加 category / install_type / decision_rules 三行 — 走 errata，不 inline 修订"），sender 不动 ADR 0001 文件本身
  - **Step 3**: ADR 0007 ship commit 内 `git status` paranoid check：必须**仅** `docs/adr/0007-*.md` 新加 + `src/manifest/schema/spec.ts` 修改 + `tests/unit/...` + `.planning/decision_rules.yaml` + cli/install.ts + ci.yml + （optional）docs/AGENT-DEFINITION-FACTORY-CONTRACT.md。若 git status 含 `docs/adr/0001-*.md` modified 立即 abort + revert
  - **Step 4**: phase 1.2.5 commit 33da1a0 (B8 acceptance) 是参考 — `git show --stat 33da1a0 -- docs/adr/0001-*.md` 应空（验证守恒维持）
- **触发应对模式**: ADR 0005 的"沿袭风格"段（L23-L26 "本 ADR 沿袭 ADR 0003 errata 不动 main body 风格"）+ Compliance § 守恒强化段（L88-L91）— ADR 0007 必须含同款 disclaimer + verification command。

### 风险 3: yaml schema 文件（decision_rules.yaml）的版本演化策略

- **触发**: B4 v1 ship 后 phase 1.4 routing engine 实装时大概率需调整 rules 形状（如加 `confidence_threshold` 字段或拆 rule 子类）
- **phase 1.1-1.2 已知模式**:
  - manifest schema 已用 `apiVersion: harnessed/v1` SSOT 字段（manifest yaml 第 1 行；ADR 0001 § Compliance 强制）
  - 当 manifest schema v2 来临时（远期），新文件用 `apiVersion: harnessed/v2`，validator 据此分流（v1 走旧 schema / v2 走新 schema），不是 in-place 修订
  - **未实证**: 真实 v1 → v2 迁移路径（项目 v0.1 阶段，没出现过）
- **缓解策略**:
  - **Step 1**: B4 `.planning/decision_rules.yaml` 顶部用 `version: 1`（int，同 DMN-style；不用 `apiVersion: harnessed/v1` 因 decision_rules 不是 manifest）+ `# yaml-language-server: $schema=../schemas/decision-rules.v1.schema.json`（schema artifact 路径占位，phase 1.4 实装 routing engine 时 build 出真实 artifact）
  - **Step 2**: phase 1.4 routing engine 在加载 decision_rules.yaml 时**强制** `version === 1` check，不匹配立即 error（沿袭 manifest validator pattern — `apiVersion === 'harnessed/v1'` 的 Type.Literal）
  - **Step 3**: 未来 v2 时新建 `.planning/decision_rules.v2.yaml`（不修订 v1） + 提供 `scripts/migrate-decision-rules-v1-to-v2.mjs` 一次性迁移脚本（沿袭 `scripts/h4-replace-signed-by.mjs` 风格 — 见 phase 1.1 R03 § 3.7 hotfix）
- **触发应对模式**: ADR 0001 § Compliance 的"schema 任何字段 add/remove/rename/type 变更 → ADR 0002+ + 全量 migration"路径 + phase 1.1 H4 sister review hardening 的"replace signed_by placeholder via migration script"实践

### 风险 4 (新): B1 security gate cmdPaths 扩展 vs decision_rules schema 设计协调

- **触发**: KICKOFF 第 44 行硬约束要求 decision_rules.* 字段也走 shell-escape 过滤；但 decision_rules schema v1（GRAY-AREA-1 § 2）含 `decision.primary_expert: string` / `install: [skill-name]` / `rationale: string` 等字段，没有 cmd-shape 字段
- **phase 1.1-1.2 已知模式**:
  - security.ts L122-L128 cmdPaths 是显式硬编码（不递归 AST） —— 加新 path 是 surgical change（增加数组元素 + 同步 IMPL NOTE 更新）
  - phase 1.1.1 hotfix B1 实施时已沉淀 "走显式 path 列表，不走通用 AST 递归" decision（见 security.ts L19-L26 头部注释）
- **缓解策略**:
  - **Step 1**: B4 decision_rules.yaml v1 schema **设计为不含 cmd-shape 字段**（仅含 string label / enum 字段 / 数组 of identifier） —— 整体躲开 security gate 扩展（karpathy YAGNI）
  - **Step 2**: 若 phase 1.4 routing engine 必须加 cmd 字段（如 `install_cmd: string`）时再扩展 security.ts cmdPaths（沿袭 0005 → 0007 → 0008 errata 路径）
  - **Step 3**: B1 ADR 0007 起草明确写 "decision_rules schema v1 不含 spawn-shape 字段；security gate 扩展推 phase 1.4 ADR 0008（如必要）" —— 设置后续工作的 explicit deferred 标记
- **触发应对模式**: phase 1.2 KICKOFF "Out of Phase 1.2 scope" 段的 explicit deferred 风格（PATTERNS.md § 4.4）

### 风险 5 (新): B5 `install-base` 命令对 phase 2.1 placeholder method 的处理

- **触发**: `manifests/skill-packs/planning-with-files.yaml` 等 cc-plugin-marketplace method manifest 在 phase 1.3 仍是 phase 2.1 placeholder（installers/index.ts L22-L34）—— `install-base` 一键装齐时若不过滤会触发 placeholder error
- **phase 1.1-1.2 已知模式**:
  - installers/index.ts phase21Placeholder 已实装 —— 调用任何未实装 method 返回 `keyword: 'phase-deferred'` error（ok=false but 非 throw — 沿袭 Pattern C）
  - cli/install.ts narrow 到 `aborted` 走 exit 2 —— 但 phase-deferred 是 ok=false（exit 1），不是 aborted
- **缓解策略**:
  - **Step 1**: `registerInstallBase` 内 pre-filter manifest list —— `manifest.spec.install.method in ['npm-cli', 'mcp-stdio-add']` 才入 install 队列；其余打印 "skipped: <name> (deferred to phase 2.1)" 但不算 error
  - **Step 2**: aggregate 总结输出 "installed N, skipped M (phase 2.1 deferred)"，与 "failed K" 区分
  - **Step 3**: phase 2.1 unblocking 4 placeholder method 后此 filter 自然失效（method 都进入实装），install-base 自动覆盖 10 manifest
  - **Step 4**: B5 acceptance 测试 ≥ 1 cell 验证 "install-base 跳过 phase21Placeholder method 不算失败" —— 沿袭 INSTALLER-CONTRACT.md "no silent failure" 契约 6 但放宽到 "deferred ≠ failure"
- **触发应对模式**: installers/index.ts L22-L34 已 ship 的 phase21Placeholder pattern + INSTALLER-CONTRACT.md L121-L132 Error Reference 表的 phase-deferred 行（已含 keyword "phase-deferred" 设计）

---

## § 6 References（具体 path + 行号）

### Schema 加字段位置确定

- `D:\GitCode\harnessed\src\manifest\schema\spec.ts` L79-L94 — `SpecSchema` 顶层 `Type.Object` —— B2 三字段加在此 object 内（`Type.Optional(...)` 风格 L88 / L90 / L91 是模板）
- `D:\GitCode\harnessed\src\manifest\schema\index.ts` L15-L23 `ManifestBase` —— spec 引用入口（不需改）
- `D:\GitCode\harnessed\src\manifest\schema\types.ts` L10 `Manifest = Static<typeof ManifestBase>` —— 类型自动派生（不需改）
- `D:\GitCode\harnessed\src\manifest\schema\installMethods\ccPluginMarketplace.ts` L19-L40 — `marketplace_source` 单层嵌套 Type.Object 风格（D1.2.5 风险 1 缓解 step 2 引用此模板）
- `D:\GitCode\harnessed\src\manifest\schema\installMethods\index.ts` L34-L42 — hand-built JSON Schema 路径（discriminator strict mode 不兼容时的 fallback ）

### Test 风格 analog

- `D:\GitCode\harnessed\tests\unit\manifest-validate.marketplace-source.test.ts` L13-L48 (BASE_CC_PLUGIN_MARKETPLACE template) + L51-L87 (BASE_NPM_CLI for additionalProperties reject test) + L89-L93 `withMarketplaceSource()` helper + L95-L148 5 cells —— B3 三测试文件 1:1 复用风格
- `D:\GitCode\harnessed\tests\unit\manifest-validate.fixtures.test.ts` L9-L34 — Pattern I 自动 glob 风格（B5 install-base 命令的 manifest 列表来源同款）
- `D:\GitCode\harnessed\tests\integration\installer-real-spawn.test.ts` L1-L23 (header IMPL NOTE 风格) + L31 `const REAL = process.env.HARNESSED_REAL_SPAWN === '1'` + L33 `describe.skipIf(!REAL)(...)` + L35 `mkdtempSync` + L77-L83 cleanup —— B6 ui-ux-pro-max-probe.test.ts 沿袭 (env 改为 `HARNESSED_UI_UX_PROBE`)

### CLI 扩展位置

- `D:\GitCode\harnessed\src\cli\install.ts` L1-L21 (header IMPL NOTE 双 flag + H1 pre-action gate 风格) + L46-L56 (commander flag 注册 6 行) + L57-L64 (H1 pre-action gate) + L65-L83 (manifest path resolve fallback) + L92-L116 (narrow Result → exit code) —— B5 `registerInstallBase` 同文件加新函数 + 在 main `cli.ts` register
- `D:\GitCode\harnessed\src\installers\index.ts` L20-L34 phase21Placeholder + L36-L43 dispatch table + L60-L63 `runInstall(manifest, opts)` orchestrator —— B5 `install-base` 内部 for-loop 调 `runInstall()` 入口

### ADR errata 风格 analog

- `D:\GitCode\harnessed\docs\adr\0005-marketplace-source-schema-errata.md` 全文 —— B1 ADR 0007 起草直接 structure-clone（Status / Context / Decision (4 sub-decisions) / Consequences (正面/负面/中性) / Compliance / References (内部依据 + 外部参考) ）
  - L1 title 风格: "ADR-0005: marketplace_source Schema Errata (cc-plugin-marketplace 字段补完)"
  - L21-L26 "A7 守恒约束" + "沿袭风格" 两段是 ADR 0007 的引用 anchor
  - L88-L101 "守恒强化 (H5 sister review hardening)" + "A7 验收命令更新" 两小节给 phase 1.3 B8 ci.yml step 加 0007 的迁移路径
- `D:\GitCode\harnessed\docs\adr\0003-install-method-count-errata.md` L29-L31 + L46-L52 — "ADR 0001 main body 不动" + "historical wording" 风格（D-7 / D-8 决策追溯）

### CI A7 step 扩展位置

- `D:\GitCode\harnessed\.github\workflows\ci.yml` L34-L38 (注释 phase 标识) + L42 第一个 for loop iterate list + L53 第二个 for loop iterate list + L64 输出文案 —— B8 仅改这 4 行（加 `0007`）

### Decision rules schema 真理来源

- `D:\GitCode\harnessed\.planning\phase-1.2.5\GRAY-AREA-1-routing-engine.md` § 2 L49-L194 — `decision_rules.yaml` v1 完整 schema 草案（B4 直接拷贝来源 + 加 `version: 1` 顶字段）

### Contract 文档风格 analog

- `D:\GitCode\harnessed\docs\INSTALLER-CONTRACT.md` 全文（180L）—— B7 AGENT-DEFINITION-FACTORY-CONTRACT.md 起草直接 structure-clone
  - L1-L8 header block "Audience / Source / Phase / Cross-ref" 直接抄
  - L18-L94 6-contract 编号段（Contract 1 ~ Contract 6 + 每条 ~12 行）—— B7 contract 数取决于 factory 真实复杂度，建议 4-5 条
  - L121-L132 Error Reference 表 (phase / keyword / 触发 / Exit / 修复建议 列) —— B7 同款风格
  - L137-L171 FAQ —— B7 类似 5-6 题

### Phase 1.2 PATTERNS.md 参考

- `D:\GitCode\harnessed\.planning\phase-1.2\PATTERNS.md` § 一 (Pattern A-K 11 patterns) + § 4.1 (Task 命名建议表) + § 4.3 (D-1~D-6 reuse decisions) —— phase 1.3 PATTERNS.md 风格沿袭 + decision 编号 D-7~D-12 续接

### Phase 1.2.5 ADR 0006 sister review M5 触发

- `D:\GitCode\harnessed\docs\adr\0006-three-stack-mechanization-wedge.md` L36-L52 (Decision § 1 双层架构 ASCII 图) —— B5 install-base 命令的 base layer 来源 (10 固定 manifest 一键装齐)
- KICKOFF L19 "Sister review M5: AgentDefinition factory contract 推迟到 phase 1.3 plan-phase 起草" —— B7 起源
