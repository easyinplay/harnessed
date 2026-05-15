# Phase 2.1 Verification (Reproduction Guide)

> **Purpose**：让任何 reviewer / fork 能本地复现 phase 2.1 的 8 acceptance bar (E1-E8) 验收
> **Tag baseline**：`adr-0010-accepted`（local tag — 见 T6.5，main agent 决定 push）+ `v0.2.0-alpha.1-installers`（候选 milestone tag）
> **Created**：2026-05-15（phase 2.1 final ship — Wave 5 T6.6）
> **Style**：phase-1.5 VERIFICATION.md 同款（D1-D8 → E1-E8 复现 + finding 索引 + 下一 phase prereq）
> **Test state**：374 passed + 3 skipped（phase 1.5 baseline 318+3 → +56：8 schema + 24 installer unit + 24 contract +4 dispatch identity -4 stale）
> **6 install method**：全 runtime-ready（npm-cli + mcp-stdio-add + mcp-http-add + git-clone-with-setup + cc-plugin-marketplace + npx-skill-installer）；`phase21Placeholder` 已删除

## Prerequisites

- Node.js ≥ 22.0.0（v0.1 锁 22 LTS — `engines.node` 强制；实测机 v24.15.0）
- Git（Windows: Git Bash 推荐 — 见 CONTRIBUTING.md "Windows Workaround"）
- pnpm 10.12.0（corepack 自动激活 — `corepack enable`）
- 5 分钟 + 干净仓库（`git status` clean）
- (可选) `gh` CLI 已装 + `gh auth status` 通过（E8 CI 状态查询才需）
- (可选) `claude` CLI v2.1+（mcp-http-add / cc-plugin-marketplace real-spawn 需；契约测试通过 `vi.mock` 不依赖真实 CLI）

## Setup

```bash
git clone <repo-url>
cd harnessed
git checkout adr-0010-accepted   # phase 2.1 baseline tag (pending T6.5 push)
corepack enable
corepack pnpm install --frozen-lockfile
```

如 Windows ACL 报错 → CONTRIBUTING.md "Windows Workaround"（F1）。

---

## § 1 Acceptance Bar E1-E8 复现

### E1 — ADR 0010 draft（≥100L 6-section + license_source / provides / H3 / H4 / --header）

```bash
# ADR 0010 行数 (≥ 100L)
wc -l docs/adr/0010-installer-schema-extension-errata.md
# 期望：≥ 100

# 6-section structure
grep -c "^## " docs/adr/0010-installer-schema-extension-errata.md
# 期望：≥ 6 (Status/Context/Decision/Consequences/Compliance/Errata-path note)

# 关键 decision 项命中
grep -c "MIT-0\|anthropics-official\|license_source\|provides\|H3\|H4\|--header" docs/adr/0010-installer-schema-extension-errata.md
# 期望：≥ 7

# Status accepted (ship 时)
grep -E "^status: (Accepted|Proposed)" docs/adr/0010-*.md
# 期望：status: Accepted (ship 后；draft 阶段 Proposed)
```

phase 2.1 Wave 0 commit `58ead88` (T1.1) 落地 ADR 0010 — 6-section errata 沿袭 ADR 0008/0009 风格；6 子项 decision 含 license whitelist 扩展（MIT-0 + anthropics-official，D-03/D-04/D-05）/ `license_source` audit 字段（D-04）/ bundle-install `provides:` 顶层字段（D2.1-1/2）/ `install_type` ↔ `install.method` 1:N 闭合（ADR 0007）/ H3 agentDefinition budget ≤150L → ≤200L 正式记录（实测 191L = +43L delta）/ H4 substring match 已知 false-positive 风险 + transparency verify checklist 防复发；§ Errata-path note：ship 时 `adr-0010-accepted` baseline tag + ci.yml A7 step iter 1-9 → 1-10。

### E2 — schema 扩展（license whitelist + bundle-install provides + install_type enforcement + decision_rules.yaml）

```bash
# license whitelist 扩展 (MIT-0 + anthropics-official)
grep -rc "Type.Literal('MIT-0')" src/manifest/schema/
# 期望：≥ 1
grep -rc "Type.Literal('anthropics-official')" src/manifest/schema/
# 期望：≥ 1

# license_source audit 字段
grep -rc "license_source" src/manifest/schema/
# 期望：≥ 1

# bundle-install `provides:` 字段
grep -c "ProvidedUnit\|provides: Type.Optional" src/manifest/schema/spec.ts
# 期望：≥ 2

# install_type ↔ install.method 1:N 闭合 cross-field check
grep -c "install-type-mismatch\|installTypeMethod" src/manifest/validate.ts
# 期望：≥ 1

# decision_rules.yaml chinese-content-deck 的 warn: 已移除（baoyu-skills resolve 为 MIT-0）
grep -B 1 -A 6 "chinese-content-deck" routing/decision_rules.yaml | grep -c "warn:"
# 期望：0 (chinese-content-deck rule 块内无 warn key)

# Schema unit tests 全绿 (≥ 13 新 cell：5 license + 5 bundle + 3 install-type)
corepack pnpm test -- tests/unit/manifest-validate 2>&1 | tail -5
# 期望：全 passed
```

phase 2.1 Wave 0 commit `58ead88` (T1.2-T1.6) 落地 — `spec.ts` 加 `MIT-0` + `anthropics-official` 至 license whitelist + `license_source` 4-enum optional 字段 + `ProvidedUnit` schema（id + component_type + `minItems: 2` + `uniqueItems: true`）；`validate.ts` 加 install_type↔method cross-field refinement（TypeBox 不支持 cross-field，validate 层 refinement rule）；`decision_rules.yaml` 移除 `chinese-content-deck` rule 的 `warn:`；3 个 schema test 文件 ≥ 13 新 cell。

### E3 — transparency 纪律基建（verdict-marker checklist + CI gate + M1 SAMPLES + CONTRIBUTING SSOT）

```bash
# transparency verdict-marker checklist (≥ 40L)
wc -l docs/TRANSPARENCY-VERDICT-CHECKLIST.md
# 期望：≥ 40

# CI gate script (W3 — warn-only round 1，phase 2.2 flip enforce)
test -f scripts/check-transparency-verdicts.mjs && echo "script OK"
grep -c "ENFORCE = false" scripts/check-transparency-verdicts.mjs
# 期望：≥ 1 (W3 lock — 历史文档自由 prose 不 red CI)

# ci.yml 加 gate step
grep -c "check-transparency-verdicts" .github/workflows/ci.yml
# 期望：≥ 1

# warn-only round 1 实测 exit 0
node scripts/check-transparency-verdicts.mjs; echo "exit=$?"
# 期望：exit=0 (即使历史文档违规，warn-only)

# M1 SAMPLES § 8.4 — 2/30 miss sample 身份标注
grep -c "miss" .planning/phase-1.4/SAMPLES.md
# 期望：≥ 2

# T1.9 — CONTRIBUTING.md SSOT 引用纪律 section
grep -c "SSOT 引用" CONTRIBUTING.md
# 期望：≥ 1
grep -c "绝不预占\|语义锚定" CONTRIBUTING.md
# 期望：≥ 2
```

phase 2.1 Wave 0 commit `58ead88` (T1.7-T1.9) 落地 — `TRANSPARENCY-VERDICT-CHECKLIST.md` 定义 `Verdict:` / `状态:` / `Closure:` marker 约定（行首 + N/N ratio + miss 声明）；`check-transparency-verdicts.mjs` scan `.planning/**/{PLAN-CHECK,*-AUDIT,VERIFICATION}.md` glob，regex 容忍 `**Verdict:**` markdown bold 包裹；**W3 warn-only round 1**（`ENFORCE = false` + 注释 "W3: warn-only round 1; flip to true in phase 2.2"）— 历史 verdict 文档（phase 1.x PLAN-CHECK / v0.1.0-MILESTONE-AUDIT）多自由 prose 不 red CI，phase 2.2+ 新 verdict 文档已遵守 marker；M1 跑 `routing-30-samples` 拿 28/30 specific match miss 身份标注到 SAMPLES.md § 8.4；T1.9 把 intel `omc-comparison.md` § 0 的 SSOT 引用纪律提升为 `CONTRIBUTING.md` § 项目级文档纪律（语义锚定 phase 编号 + ADR 编号绝不预占 + 校验时机 + 反面教材）。

### E4 — mcp-http-add installer + unit test

```bash
# installer 文件存在 + 关键签名
test -f src/installers/mcpHttpAdd.ts && echo "OK"
grep -c "mcp-http-add" src/installers/mcpHttpAdd.ts
# 期望：≥ 1 (discriminator guard)
grep -c "'--scope','project'\|--scope.*project\|--scope.,'project'" src/installers/mcpHttpAdd.ts
# 期望：≥ 1 (D-12 hardcode)
grep -c "transport.*http\|'http'" src/installers/mcpHttpAdd.ts
# 期望：≥ 1
grep -c "resolveHeaders\|resolveEnvVars\|process.env" src/installers/mcpHttpAdd.ts
# 期望：≥ 1 (D-16 env-resolution carve-out)

# Unit test ≥ 6 cell (clone mcpStdioAdd test 结构)
corepack pnpm test -- tests/unit/installers-mcpHttpAdd 2>&1 | tail -5
# 期望：全 passed ≥ 6 cell
```

phase 2.1 Wave 1 commit `80c3ff9` (T2.1+T2.2) 落地 — clone `mcpStdioAdd.ts` ~85% + adapt：`addArgs = ['mcp','add','--scope','project','--transport','http',...headerArgs, name, url]`（D-12 hardcode `--scope project` + D-16 env-resolution 先 resolve ${ENV_VAR} 再构造 args）；`.mcp.json` 入口 shape `{[name]:{type:'http',url,headers}}`；verify `claude mcp list | grep -q ${name}` exit-code（C6 discipline）。schema-gap：url + headers 字段不在 install method schema → installer parse from `install.cmd`（保留 cmd 作 audit-trail，构造 args authoritative；deviation Rule 2 — 详 progress.md F2.1-1）。

### E5 — git-clone-with-setup installer + unit test

```bash
test -f src/installers/gitCloneWithSetup.ts && echo "OK"
grep -c "git-clone-with-setup" src/installers/gitCloneWithSetup.ts
# 期望：≥ 1
grep -c "rev-parse\|sha-mismatch" src/installers/gitCloneWithSetup.ts
# 期望：≥ 1 (D-15 inline SHA-verify)
grep -c "spawnCmd" src/installers/gitCloneWithSetup.ts
# 期望：≥ 1 (复用 lib/spawn.ts)

# Unit test ≥ 6 cell
corepack pnpm test -- tests/unit/installers-gitCloneWithSetup 2>&1 | tail -5
# 期望：全 passed ≥ 6 cell
```

phase 2.1 Wave 2 commit `80c3ff9` (T3.1+T3.2) 落地 — npmCli orchestrator 形 + mcpStdioAdd preflight/verify pattern (~55% reuse)；inline `gitRevParseHead` ≤ 10L（D-15 — 单 caller YAGNI 不建 lib/gitVerify.ts）；inline `extractCloneTarget` 解析 `git clone [flags] <url> <dest>` 拿 dest dir 跑 `rev-parse HEAD`；SHA-match prefix semantics（7-hex prefix 是 full 40-hex 的合法 name）；deviation Rule 2 — strict SHA-pin enforce（schema 允许 SemVer，installer enforce SHA-only — `git rev-parse HEAD` returns SHA，authority must be SHA；ui-ux-pro-max.yaml + gstack.yaml 已 follow 40-hex SHA pin。详 progress.md F2.1-2）。

### E6 — cc-plugin-marketplace installer + unit test

```bash
test -f src/installers/ccPluginMarketplace.ts && echo "OK"
grep -c "cc-plugin-marketplace" src/installers/ccPluginMarketplace.ts
# 期望：≥ 1
grep -c "marketplace.*add\|plugin.*install" src/installers/ccPluginMarketplace.ts
# 期望：≥ 2 (two-step spawn — D-20)
grep -c "'--scope','project'\|--scope.*project\|--scope.,'project'" src/installers/ccPluginMarketplace.ts
# 期望：≥ 1 (D-12 hardcode)

# Unit test ≥ 6 cell
corepack pnpm test -- tests/unit/installers-ccPluginMarketplace 2>&1 | tail -5
# 期望：全 passed ≥ 6 cell
```

phase 2.1 Wave 3 commit `80c3ff9` (T4.1+T4.2) 落地 — clone mcpStdioAdd direct-spawn 模式 (~65% reuse) + two sequential `runArgs`：step 1 `claude plugin marketplace add <ref>`（D-20 idempotency — 非零退出视为非致命 IF step 2 install 成功，marketplace 已注册是 benign）；step 2 `claude plugin install <plugin>@<mkt> --scope project`（D-12 hardcode）；diff target `.claude/settings.json` `enabledPlugins`；verify `claude plugin list --json | grep -q <pluginName>` exit-code；inline `parseCmd` regex 解析 `plugin marketplace add <ref>` + `plugin install <plugin>@<mkt>`（manifest cmd audit-trail，args authoritative — deviation Rule 2 schema-gap，详 progress.md F2.1-1）。

### E7 — npx-skill-installer installer + unit test

```bash
test -f src/installers/npxSkillInstaller.ts && echo "OK"
grep -c "npx-skill-installer" src/installers/npxSkillInstaller.ts
# 期望：≥ 1
grep -c "skills@\|--copy\|--global" src/installers/npxSkillInstaller.ts
# 期望：≥ 2 (D2.1-5 flag enforcement)
grep -c "SKILL.md\|verify-failed\|access" src/installers/npxSkillInstaller.ts
# 期望：≥ 1 (D2.1-6 real-path verify via fs.access)

# Unit test ≥ 6 cell
corepack pnpm test -- tests/unit/installers-npxSkillInstaller 2>&1 | tail -5
# 期望：全 passed ≥ 6 cell
```

phase 2.1 Wave 4 commit `80c3ff9` (T5.1+T5.2) 落地 — npmCli npx 模式 (~50% reuse)；preflight enforce `skills@<version-spec>` shape（forbids `@latest` — ADR 0001 reproducibility；deviation Rule 2 — 不 hardcode `1.5.7` 让 manifest 自由 pin minor bump，详 progress.md F2.1-3）+ `--copy` + `--global` 同 mandatory（D2.1-5 — `--copy` Win symlink-safe / `--global` ~/.claude/skills/ user scope）；**D2.1-6 CRITICAL real-path verify** — `fs.access('~/.claude/skills/<name>/SKILL.md')`（实路径，非 npx exit code — npx 0 ≠ files written；C6 directory-conflict gotcha — known limitation D-02 ~/.agents/ vs ~/.claude/ bridge 推后续 phase 完整桥接）。

### E8 — dispatch table 全覆盖 + contract test 全套 + ci.yml A7 step iter 1-10

```bash
# dispatch table 全覆盖 — phase21Placeholder 删除
grep -c "phase21Placeholder" src/installers/index.ts
# 期望：0 (const + comment 引用 全删)

# 6 installer 全 wired
grep -c "installMcpHttpAdd\|installGitCloneWithSetup\|installCcPluginMarketplace\|installNpxSkillInstaller" src/installers/index.ts
# 期望：≥ 8 (4 import + 4 dispatch table entry)

# Contract test 全套 — 6 method × 6 contract = 36 cell + 4 新 installer 各有 contract cell
corepack pnpm test -- tests/integration/installer-contract 2>&1 | tail -5
# 期望：全 passed (36 cell)

# ci.yml A7 step iter 1-9 → 1-10
grep -c "0001 0002 0003 0004 0005 0006 0007 0008 0009 0010" .github/workflows/ci.yml
# 期望：≥ 2 (两处 for loop)
grep -c "ADR 0001-0010" .github/workflows/ci.yml
# 期望：≥ 1 (step name + comment)

# A7 守恒 — ADR 0001-0009 main body 0 diff (phase 2.1 只动 ADR 0010 + errata path)
for n in 0001 0002 0003 0004 0005 0006 0007 0008 0009; do
  diff_lines=$(git diff "adr-${n}-accepted" -- "docs/adr/${n}-*.md" 2>/dev/null | wc -l)
  echo "ADR $n diff lines: $diff_lines"
done
# 期望：所有 9 ADR diff lines = 0

# CI 三平台全绿 (main agent push 后 verify — T6.4)
gh run list --workflow ci.yml --limit 1
# 期望：conclusion success / windows-latest + ubuntu-latest + macos-latest 全 success

# baseline tag (main agent T6.5 创建 + push)
git tag -l adr-0010-accepted
# 期望：adr-0010-accepted (main agent ship step 创建)
```

phase 2.1 Wave 5 commit (本 commit) (T6.1-T6.3+T6.5 drafts+T6.6) 落地 — `src/installers/index.ts` 4-line swap + 4 imports + `phase21Placeholder` const + 注释 删除（PATTERNS § 4）；`tests/integration/installer-contract.test.ts` extend — 4 新 factory (mcpHttp / gitClone / ccPlugin / npxSkill) + `factories` map + `methods` 数组扩 2 → 6，`SYSTEM_FLAG_REQUIRED` Set 区分 L4 npm-cli vs L2/L3 其他，`CLAUDE_CLI_METHODS` Set 区分 claude-CLI 走者（mcp-stdio + mcp-http + cc-plugin）；`ci.yml` A7 step 两处 loop 加 `0010` + step name + 注释更新 + phase 2.1 errata 说明注释；`installers-index.test.ts` 5 stale phase-deferred 测试 → 2 dispatch identity 测试（**Rule 1 auto-fix** — stale tests）。

---

## § 2 Phase 2.2/2.3 prereq — 7 接口契约

phase 2.1 ship 后 frozen 的 **7 接口契约**（PLAN.md § 4 1:1），phase 2.2/2.3 直接消费无需重做：

| # | 接口 | phase 2.1 落地位置 | 签名 / 形态 |
|---|------|-------------------|------------|
| 1 | 6 install method dispatch table | `src/installers/index.ts` | `installers: Record<method, Installer>` 6 method 全 runtime-ready；`phase21Placeholder` 删除 |
| 2 | `provides: ProvidedUnit[]` schema 字段 | `src/manifest/schema/spec.ts` | optional 顶层 array，`{ id, component_type }`，`minItems: 2` + `uniqueItems: true`；phase 2.3 写 document-skills manifest 直接消费 |
| 3 | `license_source` audit 字段 | `src/manifest/schema/` (license 同层) | optional enum（README/registry/none/anthropics-official）；phase 2.3 extension manifest license 来源审计 |
| 4 | license whitelist 扩展 | `src/manifest/schema/` (license enum) | `MIT-0` + `anthropics-official` 已在白名单；phase 2.3 anthropics/skills 来源 candidate 直接过 |
| 5 | install_type enforcement | `src/manifest/validate.ts` | `install_type` ↔ `install.method` 1:N 闭合 cross-field refinement；phase 2.3 manifest 写入时强制 |
| 6 | transparency verdict-marker 约定 | `docs/TRANSPARENCY-VERDICT-CHECKLIST.md` + `scripts/check-transparency-verdicts.mjs` | `Verdict:`/`状态:`/`Closure:` 行须带 `N/N` + miss 声明；W3 warn-only round 1（phase 2.2 flip enforce）；phase 2.2+ 所有 verify/audit 文档遵守 |
| 7 | 4 个 installer module | `src/installers/{mcpHttpAdd,gitCloneWithSetup,ccPluginMarketplace,npxSkillInstaller}.ts` | 各 export 1 `Installer`（`installMcpHttpAdd` / `installGitCloneWithSetup` / `installCcPluginMarketplace` / `installNpxSkillInstaller`）；phase 2.3 extension category 复用 |

### Phase 2.2 entry — execute-task workflow 主线 + ralph-loop full integration + SDK INTRODUCE

phase 2.1 ship 后 phase 2.2 启动项：

- **execute-task workflow 主线**（WORKFLOWS § 2 — brainstorming → karpathy 心法 always-on → mattpocock 招式按需召唤 → 条件 TDD → ralph-loop 交付 COMPLETE）
- **ralph-loop full integration**（主流程 routing engine 调用 ralph-loop wrap "...COMPLETE" --completion-promise；A7' 8 支柱 100% 闭环）
- **`@anthropic-ai/claude-agent-sdk` 0.2.141 INTRODUCE NOW**（D1.5-5 + v0.2.0 research refresh 决议；ADR 编号由 phase 2.2 plan-phase 流程分配，不预占）
- **transparency CI gate flip ENFORCE = true**（phase 2.1 W3 warn-only round 1 → phase 2.2 起 enforce — 所有新 verdict 文档已遵守 marker，历史文档 phase 2.1 ship 前批改完成）

### Phase 2.3 entry — extension category 实装

phase 2.1 schema 前置就绪后 phase 2.3 启动项：

- **document-skills bundle-install** — 用 `provides:` 顶层 array 写 4-in-1 bundle manifest
- **design/content/testing extension category 实装** — license whitelist + license_source 审计 ready；4 installer module 复用
- **decision_rules.yaml bundle-routing**（`anthropics-skills-pptx` → bundle 解析）

---

## § 3 Findings 索引

phase 2.1 plan-check + execute 期间的 findings（W = warning / S = suggestion / D = deviation，全部已 resolve）：

### Wave C plan-check round 1 findings（已 patch 进 PLAN-layer）

- **W2 (drafting 前实测对齐)** — ADR 0010 H3 errata 数字 191L / ≤200L / +43L delta 提前实测对齐
- **W3 (CI gate warn-only round 1 锁定)** — `ENFORCE = false` + 注释 "W3: warn-only round 1; flip to true in phase 2.2"
- **S1 (T1.1 ADR W2 引用)** / **S2 (T1.7 transparency 文档 sample 命中)** / **S3 (D-15 inline SHA-verify YAGNI lock)** / **S5 (verdict marker regex 容忍 markdown bold)** 全部 patch 进 task_plan / PATTERNS / scripts。

### Wave 1-4 execute findings（5 deviations，全部 Rule 1/Rule 2 reasonable）

- **F2.1-1 (Rule 2 schema-gap parse-from-cmd × 3)** — mcp-http-add / git-clone-with-setup / cc-plugin-marketplace 的 url + headers / clone dest / marketplace ref + plugin@mkt 不在 install method schema 中。Installer 从 `install.cmd` 解析这些字段（cmd 保留作 audit-trail，args authoritative 构造）— 沿袭 mcpStdioAdd 既有 discipline（cmd informational，args reconstructed authoritatively）。Rule 2 auto-add — 解析 helper 是 installer 内部 private 函数（≤30L），不污染 lib/。
- **F2.1-2 (Rule 2 git-clone strict SHA-only enforcement)** — schema regex 允许 SHA(7-40 hex) OR SemVer (v1.2.3)，installer-layer enforce SHA-only（`git rev-parse HEAD` returns SHA，authority must be SHA）。SemVer git_ref 走 cc-plugin-marketplace 时仍合法（不用 SHA-verify），git-clone-with-setup 强制 SHA。Rule 2 — D-15 SHA-verify 的必要前置。
- **F2.1-3 (Rule 2 npx-skill 灵活 pin enforcement)** — preflight enforce `skills@<version-spec>` shape（forbids `@latest`），不 hardcode `1.5.7`。让 manifest 自由 pin minor bump 是 ADR 0001 reproducibility 的合理解读（pin 是 manifest 责任，installer 验 pin shape）。

### Wave 5 execute findings（本 wave，3 deviations + 1 Rule 1 auto-fix）

- **F2.5-1 (Rule 1 auto-fix — stale phase-deferred tests in `installers-index.test.ts`)** — 5 stale 测试假设 `phase21Placeholder` 还存在；T6.1 dispatch swap 后必须更新。改 2 个 dispatch identity 测试（assert `installers[m] === installRealFn` × 6 + assert `new Set(refs).size === refs.length`）— 净 -3 cell（5 stale 移除 + 2 identity 加入），但语义更精确（identity-based dispatch verification > behavior-based stale assertion）。
- **F2.5-2 (Rule 1 auto-fix — contract test C5 mcp-cli-only regex tighten)** — 原 `\bclaude\b` regex 会误命中 `claude-code`（npx-skill-installer 的 `--agent claude-code` 参数 — `\b` 在 `e-` 之间触发）。Fix: `/(?:^|\s)claude(?:\s|$)/` 严格匹配 `claude` 作为 binary 词（前后必空格或行首尾，不接 `-` / `_`）。语义更准确（mcp-cli-only 是说调 `claude` 这个 binary，不是字符串包含 `claude`）。
- **F2.5-3 (Rule 1 auto-fix — contract test cc-plugin git_ref shape compliance)** — cc-plugin fixture 原写 `git_ref: 'fixture-git-ref'` 不过 preflight `GIT_REF_SHAPE` regex（`^([a-f0-9]{7,40}|v?\d+\.\d+\.\d+...)$`），改为 40-hex 'a1b2c3d4e5f67890123456789012345678901234'。cc-plugin verify 不直接用 git_ref，记录用作 audit-trail。
- **F2.5-4 (Rule 2 — contract test mock fs.access for npx-skill)** — npx-skill-installer 用 `fs.access` 做 real-path verify，原 mock 文件只 mock 了 `mkdir/readFile/writeFile/rename`。加 `access: vi.fn(async () => undefined)` 默认 return success（path exists）让 C3/C5 测试能 reach end-of-install。C6 测试用 spawn-exit-1 path return 在 fs.access 之前。

### Wave 0 known limitations（v0.2+ 评估）

- **D-02 known limitation** — npx-skill-installer ~/.agents/ vs ~/.claude/skills/ 目录冲突（vercel-labs/skills CLI default 在某些系统写 ~/.agents/）；real-path verify catch + suggest 提示用户手动 bridge；完整 SessionStart sync-hook 桥接 deferred 后续 phase。
- **H4 known limitation** — `arbitrate` substring match（ADR 0009 § Decision 2 `task.prompt.toLowerCase().includes(trigger.toLowerCase())`）已知 false-positive 风险（trigger `"test"` 命中 `"latest"`/`"contest"`）；v0.2+ semantic router L2 替代；ADR 0010 § Consequences 透明记录。

---

## § 4 Sister review references

phase 1.5 sister review T1+T2+T3 transparency 模式 phase 2.1 持续 + 结构性根治：

- **sister T1（inline transparency）**：T1.8 SAMPLES § 8.4 标注 2/30 miss 身份（28/30 specific match，2 个 miss 身份 + 为何 acceptable）— 防 "100% / 全绿" 聚合数字盖过真实状态的反模式
- **sister T2（Known Limitations transparency）**：ADR 0010 § Consequences 内联 H4 substring match 已知 false-positive 风险 + npx-skill D-02 目录冲突 known limitation
- **sister T3（transparency 结构性根治）**：T1.7 `TRANSPARENCY-VERDICT-CHECKLIST.md` + `check-transparency-verdicts.mjs` CI gate — `Verdict:` / `状态:` / `Closure:` marker 必带 `N/N` ratio + miss 声明，**W3 warn-only round 1 + phase 2.2 flip enforce**；T1.9 `CONTRIBUTING.md` SSOT 引用纪律 section（phase 编号语义锚定 + ADR 编号绝不预占 + 校验时机 + 反面教材）

---

## § 5 ADR 0010 引用 + Tag verify + Wave 0-5 commit 索引

### ADR 0010 + Tag

```bash
git tag -l adr-0010-accepted                                      # main agent ship step 创建
git tag -l v0.2.0-alpha.1-installers                              # 候选 milestone tag
cat docs/adr/0010-*.md | head -8                                  # Status: Accepted + 6-section
```

- **ADR 0010**（`docs/adr/0010-installer-schema-extension-errata.md`）— phase 2.1 installer-schema-extension errata（license whitelist MIT-0 + anthropics-official / license_source audit / bundle-install provides[] / install_type↔method 1:N enforcement / H3 agentDefinition budget ≤200L errata / H4 substring match known limitation / D-16 --header ${ENV_VAR} env-resolution carve-out）
- **adr-0010-accepted** + **v0.2.0-alpha.1-installers**（候选）— main agent final ship step 创建 + push（与 Wave 5 commit 解耦）

### Wave 0-5 commit 索引

| Wave | commit | 内容 |
|------|--------|------|
| Wave 0 | `58ead88` | ADR 0010 draft + schema 4 项改动（license whitelist + license_source + provides + install_type enforce）+ decision_rules.yaml warn 移除 + 3 schema test 文件 ≥13 新 cell + transparency CI gate W3 warn-only + M1 SAMPLES § 8.4 + CONTRIBUTING SSOT 纪律 |
| Wave 1-4 | `80c3ff9` | 4 installer（mcpHttpAdd / gitCloneWithSetup / ccPluginMarketplace / npxSkillInstaller）+ 4 unit test 文件 ≥6 cell 各 + 5 deviations (3 schema-gap parse-from-cmd + 1 SHA-only + 1 npx flag preflight) |
| Wave 5 | (本 commit) | dispatch table 6 method 全覆盖 + contract test 36 cell + ci.yml A7 step iter 1-10 + STATE.md SHIPPED line + progress.md + VERIFICATION.md + installers-index.test.ts dispatch identity 测试更新 (Rule 1 auto-fix) |

---

## § 6 一键 Reproduce 流程 (~3-5 min)

```bash
# 0. checkout phase 2.1 baseline tag
git checkout adr-0010-accepted

# 1. install + verify 全套 (~3 min)
corepack pnpm install --frozen-lockfile  # ~30s
corepack pnpm typecheck                   # ~5s — 0 错误
corepack pnpm lint                        # ~3s
corepack pnpm test                        # ~4s (374 passed / 3 skipped)
corepack pnpm build                       # ~2s
corepack pnpm build:schema                # ~1s — schemas/manifest.v1.schema.json
corepack pnpm validate:schema             # ~1s — schema artifact 自校验

# 2. A7 守恒 paranoid check (ADR 0001-0009 main body 不动 — phase 2.1 只动 0010)
for n in 0001 0002 0003 0004 0005 0006 0007 0008 0009; do
  diff_lines=$(git diff "adr-${n}-accepted" -- "docs/adr/${n}-*.md" 2>/dev/null | wc -l)
  echo "ADR $n diff lines: $diff_lines"
done
# 全部 = 0 → A7 守恒 hold ✅

# 3. 6 installer 文件 + 4 unit test verify
for f in mcpHttpAdd gitCloneWithSetup ccPluginMarketplace npxSkillInstaller; do
  test -f "src/installers/${f}.ts" && echo "${f} installer OK"
  test -f "tests/unit/installers-${f}.test.ts" && echo "${f} unit test OK"
done

# 4. dispatch table 6 method 全覆盖
grep -c "phase21Placeholder" src/installers/index.ts                                 # = 0
grep -c "installMcpHttpAdd\|installGitCloneWithSetup\|installCcPluginMarketplace\|installNpxSkillInstaller" src/installers/index.ts  # ≥ 8

# 5. transparency CI gate verify (warn-only round 1)
node scripts/check-transparency-verdicts.mjs; echo "exit=$?"
# 期望：exit=0 (W3 warn-only round 1 — 即使历史文档违规)

# 6. CI 状态 (远程 — main agent push 后)
gh run list --workflow ci.yml --limit 1
# 期望：success @ <phase-2.1-ship-commit> 三平台全绿
```

---

## § 7 References

- **PLAN.md**（`.planning/phase-2.1/PLAN.md`）— phase 2.1 范围 + 6 wave + E1-E8 acceptance bar 定义 + § 4 phase 2.2/2.3 prereq 7 接口契约
- **task_plan.md**（`.planning/phase-2.1/task_plan.md`）— 23 atomic 子任务 + 依赖图 + Wave-Level Acceptance Checkpoint
- **PLAN-CHECK.md**（`.planning/phase-2.1/PLAN-CHECK.md`）— gsd-plan-checker Wave C round 1 APPROVED WITH CONDITIONS（0 BLOCKER / 4 WARNING / 5 SUGGESTION，已 patch 进 task_plan）
- **PATTERNS.md**（`.planning/phase-2.1/PATTERNS.md`）— 4 installer pattern reuse map（~85% mcpHttpAdd / ~65% ccPluginMarketplace / ~55% gitCloneWithSetup / ~50% npxSkillInstaller）+ § 4 dispatch table 4-line swap pattern
- **RESEARCH.md**（`.planning/phase-2.1/RESEARCH.md`）— D2.1-1~D2.1-8 决议 + research refinement
- **ASSUMPTIONS.md**（`.planning/phase-2.1/ASSUMPTIONS.md`）— A 范围 / B 决策 / C 风险登记 R1-R6
- **progress.md**（`.planning/phase-2.1/progress.md`）— 6 wave 执行进度 + findings tracker（F2.1-1~F2.1-3 + F2.5-1~F2.5-4 + Wave 0 known limitations）
- **ADR 0010**（`docs/adr/0010-installer-schema-extension-errata.md`）— phase 2.1 installer-schema-extension errata（license whitelist + license_source + provides[] + install_type enforce + H3/H4 errata + --header env-resolution）
- **TRANSPARENCY-VERDICT-CHECKLIST.md**（`docs/TRANSPARENCY-VERDICT-CHECKLIST.md`）— verdict-marker 约定（`Verdict:`/`状态:`/`Closure:` 行须带 `N/N` + miss 声明）+ W3 warn-only round 1 → phase 2.2 flip enforce
- **CONTRIBUTING.md**（§ intel/参考文档 SSOT 引用规则）— phase 编号语义锚定 + ADR 编号绝不预占 + 校验时机 + 反面教材
- **INSTALLER-CONTRACT.md**（`docs/INSTALLER-CONTRACT.md`）— ADR 0004 6 契约（dry-run default + diff + rollback + 4-Level confirm + MCP CLI-only + no-silent-failure）— phase 2.1 4 新 installer 全 1:1 contract test 验证
- **Phase 1.5 VERIFICATION**（`.planning/phase-1.5/VERIFICATION.md`）— 上游 phase 复现指南（D1-D8 + W-1/W-2/S-1/S-2/F-note + Phase 2.0 prereq 8 接口契约）
- **STATE.md**（`.planning/STATE.md`）— 跨 session 项目记忆 SSOT（phase 2.1 ship 后 7/17 = ~41.2% / ADR 10 / baseline tag 10 / tests 374+3）

---

## § 8 Phase 2.1 Acceptance Summary

| Bar | Target | Actual | Commit |
|-----|--------|--------|--------|
| E1 ADR 0010 draft | ≥ 100L 6-section + 7 关键 decision 项 | ADR 0010 ≥ 100L 6-section + license_source/provides/H3/H4/--header/MIT-0/anthropics-official ≥ 7 命中 | `58ead88` (T1.1) |
| E2 schema 扩展 | license whitelist + license_source + provides + install_type enforce + decision_rules warn 移除 + tests | `MIT-0` + `anthropics-official` + `license_source` + `ProvidedUnit` + `install-type-mismatch` validate + chinese-content-deck warn 移除 + 3 test 文件 ≥13 新 cell | `58ead88` (T1.2-T1.6) |
| E3 transparency 基建 | checklist ≥ 40L + CI gate warn-only + M1 + CONTRIBUTING SSOT | `TRANSPARENCY-VERDICT-CHECKLIST.md` + `check-transparency-verdicts.mjs` (W3 warn-only round 1) + SAMPLES § 8.4 miss 标注 + CONTRIBUTING § SSOT 引用纪律 | `58ead88` (T1.7-T1.9) |
| E4 mcp-http-add | installer + unit test ≥ 6 cell | `mcpHttpAdd.ts` (clone ~85%) + `installers-mcpHttpAdd.test.ts` ≥ 6 cell | `80c3ff9` (T2.1+T2.2) |
| E5 git-clone-with-setup | installer + unit test ≥ 6 cell | `gitCloneWithSetup.ts` (~55% reuse) + inline SHA-verify + `installers-gitCloneWithSetup.test.ts` ≥ 6 cell | `80c3ff9` (T3.1+T3.2) |
| E6 cc-plugin-marketplace | installer + unit test ≥ 6 cell | `ccPluginMarketplace.ts` (~65% reuse) + two-step spawn + D-20 idempotency + `installers-ccPluginMarketplace.test.ts` ≥ 6 cell | `80c3ff9` (T4.1+T4.2) |
| E7 npx-skill-installer | installer + unit test ≥ 6 cell + real-path verify | `npxSkillInstaller.ts` (~50% reuse) + `fs.access` real-path verify + `installers-npxSkillInstaller.test.ts` ≥ 6 cell | `80c3ff9` (T5.1+T5.2) |
| E8 dispatch + contract + CI + tag | 6 method 全覆盖 + 36 contract cell + ci.yml A7 iter 1-10 + adr-0010-accepted tag + 三平台全绿 | dispatch table 6 method runtime-ready / `phase21Placeholder` 删除 / contract test 36 cell 全绿 / ci.yml `for n in 0001..0010` × 2 + `ADR 0001-0010` × 3 / A7 守恒 ADR 0001-0009 main body 0 diff / CI verify + tag main agent ship step | (本 commit + T6.4/T6.5 main agent) |

**全 8/8 ✅ — Phase 2.1 SHIPPED 2026-05-15**（pending T6.4/T6.5 main agent CI verify + push tag）

---

## § 9 Phase 2.1 vs phase 2.2/2.3 边界（重申）

phase 2.1 = **installer 实装收官**（4 placeholder installer 实装为 runtime-ready + Wave 0 schema/transparency 前置）

phase 2.2 = **execute-task workflow 主线**（execute-task workflow + ralph-loop full integration + `@anthropic-ai/claude-agent-sdk` 0.2.141 INTRODUCE NOW + 起 ADR 0011 errata）

phase 2.3 = **extension category 实装**（document-skills bundle-install with `provides:` + design/content/testing extension category + decision_rules.yaml bundle-routing）

**phase 2.1 不实装（推 phase 2.2+/2.3+）**：
- npx-skill-installer 完整目录桥接（SessionStart sync-hook — D-02）
- Claude Agent SDK + ralph-wiggum keep-vs-switch（D-08 — phase 2.2）
- execute-task workflow + ralph-loop full integration（phase 2.2）
- decision_rules.yaml bundle-routing（D2.1-3 — phase 2.3）
- design/content/testing extension category 真实候选实装（phase 2.3）
- transparency CI gate ENFORCE flip（W3 — phase 2.2 起新 verdict 文档已遵守 marker）
