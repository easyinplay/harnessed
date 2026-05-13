# Phase 1.3 Task Plan (planning-with-files 主计划)

> **状态**: ready for execute-phase
> **维护规则**: 每完成一个 task → 勾选 + 同步 `progress.md`（追加 ISO 日期 + task ID + 简短结果 + commit short-hash）
> **决策回溯**: 所有 "为什么这么做" → 查 `PLAN.md` § 1-8 / `ASSUMPTIONS.md` § B-D / `RESEARCH.md` / `PATTERNS.md`
> **执行策略**: 每个 task 完成后 commit；commit message 格式 `phase-1.3: T<N>.<M> <action>`；建议每个子任务 `/ralph-loop` 包裹直到 COMPLETE
> **总规模**: 20 atomic 子任务 / 7 wave / 预计 3-5 工作日

---

## Phase 1.3 Acceptance Bar (verify before mark phase done)

(来自 PLAN.md § 6 — 必须全部 ✅)

- [ ] **B1** ADR 0007 errata accepted + `adr-0007-accepted` tag pushed
- [ ] **B2** manifest schema 加 3 字段（category/install_type/decision_rules）+ `validate:schema` 通过
- [ ] **B3** schema unit tests ≥ 12 cell + tests 202+1 → ≥ 215+1
- [ ] **B4** decision_rules.yaml v1 + arbitrate function 单测 ≥ 8 cell
- [ ] **B5** `harnessed install-base` 子命令 + dry-run 三态输出
- [ ] **B6** ui-ux-pro-max install path 实测 + manifest 创建 + F36 finding logged
- [ ] **B7** AgentDefinition factory contract draft ≥ 150 行 + 12 字段 grep hit
- [ ] **B8** CI 三平台全绿 + A7 step iterate 1-7 全绿 + ADR 0001-0006 main body diff 0

---

## Task Graph

### Wave 0 — 前置（ADR 0007 + ci.yml A7 step 升级）

#### T1.1 起草 ADR 0007 errata + accepted + adr-0007-accepted tag
- [ ] **目标**: A7 守恒（不动 ADR 0001 main body）下，给 phase 1.4 routing engine 实装备好 manifest schema 3 字段
- **文件**: `/d/GitCode/harnessed/docs/adr/0007-categorization-schema-errata.md`
- **内容大纲**（≥ 100 行 — ADR 0005 errata 同款风格）:
  - Status: Accepted 2026-MM-DD
  - Context: phase 1.2.5 ADR 0006 wedge 重定位锁定 6 大 category × decision rules + 4 install_type；ADR 0001 schema 缺这 3 字段；走 errata 路径不动 0001 main body
  - Decision: 加 3 字段
    - `category: 'meta' | 'engineering' | 'design' | 'content' | 'testing' | 'search'`（必填，A8' lock）
    - `install_type: 'skill' | 'mcp' | 'npm' | 'git'`（必填，D1.2.5-12 — 区分 skill / MCP / npm / git 4 种安装路径）
    - `decision_rules: { trigger?, default_expert?, arbitration_rule?, override_signals?[] }`（optional Object — DMN-style 关键词匹配 + 仲裁规则）
  - Consequences: phase 1.3 仅 schema 加字段；phase 1.4 routing engine 消费这些字段；phase 1.1-1.2 已 ship 10 manifest 全部需要补 category + install_type 字段（迁移由 T2.1 完成）
  - Compliance: ADR 0001 main body 不动（A7 守恒）；fixture-driven validate test 自动覆盖（T2.3）；**W-2 D-9 propagation**: ADR 0006 § 6 描述 "harnessed install --base flag" → 实装走 D-9 决策 = 独立 `harnessed install-base` 子命令（不加 --base flag），覆盖 ADR 0006 § 6 描述（A7 守恒规则下不能改 ADR 0006 main body，故 D-9 决策由本 ADR 0007 errata Compliance 段官方覆盖）
  - References: ADR 0006 § 4 + 5 / RESEARCH (R2) / PATTERNS (R1) / ASSUMPTIONS / GRAY-AREA-1 § 2 schema
- **同步**: 更新 `docs/adr/README.md` index（加 0007 行）
- **后置命令**:
  ```bash
  cd /d/GitCode/harnessed
  git tag adr-0007-accepted HEAD
  git ls-files --eol docs/adr/0007-*.md  # 应 i/lf
  ```
- **验收**:
  - [ ] ADR 0007 文件 ≥ 100 行
  - [ ] `docs/adr/README.md` 含 0007 链接
  - [ ] `git diff adr-0001-accepted -- docs/adr/0001-*.md` 输出空（A7 守恒 paranoid check — R2 R2 mitigation）
  - [ ] `git tag -l 'adr-*-accepted' | wc -l` = 7
- **决策来源**: ADR 0006 § 6 + ASSUMPTIONS D1.3-2 + D1.3-7 + D1.3-8

---

#### T1.2 ci.yml A7 step iterate 1-6 → 1-7
- [ ] **目标**: ADR 0007 加入 A7 守恒 baseline tag iterate；phase 1.3 push 后 CI 实测 7 个 baseline tag 全绿
- **文件**: `/d/GitCode/harnessed/.github/workflows/ci.yml`
- **内容修改**（**S-1 4 处明确化** — 实际行号 push 前以 `grep -n '0001 0002' .github/workflows/ci.yml` 实测为准）:
  - **L34-L38** comment（"ADR baseline tag" 描述段）: "ADR 0001-0006 main body 守恒" → "ADR 0001-0007 main body 守恒"
  - **L42** A7 step `for n in 0001 ... 0006` 列表头次出现：加 `0007`
  - **L53** A7 step `for n in 0001 ... 0006` 第二次出现（如有）：加 `0007`
  - **L64** A7 step echo 文案 "iterate 0001-0006" → "iterate 0001-0007"
- **验收**:
  - [ ] CI yaml 含 0007 in iterate (`grep -c "0007" .github/workflows/ci.yml` ≥ 2)
  - [ ] `corepack pnpm typecheck && corepack pnpm lint` 0 错误（不应触发 — yaml 改不影响 ts）
- **决策来源**: B8 acceptance bar + phase 1.2.5 commit 33da1a0 升级模式 + S-1 PLAN-CHECK fix

---

### Wave 1 — Schema 实装（manifest 加 3 字段 + tests ≥ 12 cell）

#### T2.1 src/manifest/schema/spec.ts 加 3 字段（Pattern L spec-level metadata 加法）
- [ ] **目标**: 在 SpecSchema 顶层加 3 字段，影响所有 manifest type；现有 10 manifest 全部补字段
- **IMPL NOTE — B-1 schema 区分**:
  - `manifest.spec.decision_rules` (本 task 加) **是 per-manifest decision hint**（manifest 自己声明 "我适合什么场景"），与全局 `routing/decision_rules.yaml`（T3.1 起草，含 `hit_policy` + `rules[]` + `fallback_supervisor` + `deprecated[]`）**是两个完全独立 schema**。
  - phase 1.4 routing engine **优先读全局 yaml**（`loadDecisionRules()`）；manifest 字段是 backup hint，phase 1.4 实装时按需 fallback。
  - T2.3 unit test（`manifest-validate.decision-rules.test.ts`）只测 manifest.spec.decision_rules；T3.3 unit test（`routing-decisionRules.test.ts`）只测全局 yaml。两个 schema isolated 不混。
- **IMPL NOTE — B-2 install_type 1:N 映射**（4 enum × 6 install method 闭合）:
  - `install_type: skill` → method 可为 `cc-plugin-marketplace` / `npx-skill-installer`（CC 生态 skill 装载，2 method 同 enum）
  - `install_type: mcp` → method 可为 `mcp-stdio-add` / `mcp-http-add`（2 method 同 enum）
  - `install_type: npm` → method 为 `npm-cli`（npm package install，1:1）
  - `install_type: git` → method 为 `git-clone-with-setup`（git clone + setup script，1:1）
- **文件**: 
  - `/d/GitCode/harnessed/src/manifest/schema/spec.ts`（修改）
  - 全部 manifest yaml — **B-3 glob 自动列举**：`manifests/{tools,skill-packs}/*.yaml`（不写死路径；execute 阶段命令: `find manifests -name '*.yaml'` 或 `ls manifests/{tools,skill-packs}/*.yaml`，再 yq foreach 加字段）
  - `/d/GitCode/harnessed/tests/fixtures/manifests/valid/*.yaml`（fixture 同步）
- **内容**（参 R2 § 2.3 TypeBox 嵌套示例 + ccPluginMarketplace.ts:29-37 marketplace_source pattern）:
  ```typescript
  // SpecSchema 加：
  category: Type.Union([
    Type.Literal('meta'), Type.Literal('engineering'), Type.Literal('design'),
    Type.Literal('content'), Type.Literal('testing'), Type.Literal('search'),
  ]),
  install_type: Type.Union([
    Type.Literal('skill'), Type.Literal('mcp'), Type.Literal('npm'), Type.Literal('git'),
  ]),
  // per-manifest decision hint（非全局 rule-set — 全局在 routing/decision_rules.yaml T3.1）
  decision_rules: Type.Optional(Type.Object({
    trigger: Type.Optional(Type.String({ minLength: 1 })),
    default_expert: Type.Optional(Type.String({ minLength: 1 })),
    arbitration_rule: Type.Optional(Type.String({ minLength: 1 })),
    override_signals: Type.Optional(Type.Array(Type.Object({
      phrase: Type.String({ minLength: 1 }),
      use: Type.String({ minLength: 1 }),
    }, { additionalProperties: false }))),
  }, { additionalProperties: false })),
  ```
- **manifest category + install_type 映射**（execute 时用 `find manifests -name '*.yaml'` 自动列举；以下表为 reference，**实际文件位置以 glob 结果为准**）:
  ```yaml
  # 实际文件路径以 glob 结果为准（B-3 fix）
  ctx7.yaml:               { category: search, install_type: npm }    # method: npm-cli
  tavily-mcp.yaml:         { category: search, install_type: mcp }    # method: mcp-stdio-add
  exa-mcp.yaml:            { category: search, install_type: mcp }    # method: mcp-stdio-add
  gstack.yaml:             { category: engineering, install_type: git }    # method: git-clone-with-setup
  gsd.yaml:                { category: engineering, install_type: npm }    # method: npm-cli
  superpowers.yaml:        { category: engineering, install_type: skill }  # method: cc-plugin-marketplace（B-2 闭合）
  planning-with-files.yaml:{ category: engineering, install_type: skill }  # method: cc-plugin-marketplace（B-2 闭合）
  mattpocock-skills.yaml:  { category: engineering, install_type: skill }  # method: 视实测 cc-plugin-marketplace 或 npx-skill-installer
  karpathy-skills.yaml:    { category: engineering, install_type: skill }  # method: 视实测 cc-plugin-marketplace 或 npx-skill-installer
  ralph-loop.yaml:         { category: engineering, install_type: skill }  # method: cc-plugin-marketplace（B-2 闭合）
  ```
- **后置**: `corepack pnpm build:schema` 重新生成 `schemas/manifest.v1.schema.json`
- **验收**:
  - [ ] `corepack pnpm typecheck && corepack pnpm lint` 0 错误
  - [ ] `corepack pnpm test -- --filter fixtures` 全绿（实际 manifest 数 = `find manifests -name '*.yaml' | wc -l` 输出，全 fixture pass）
  - [ ] `git diff adr-0001-accepted -- docs/adr/0001-*.md` 输出空（A7 守恒 paranoid check）
  - [ ] `schemas/manifest.v1.schema.json` 含 3 新字段
- **决策来源**: ADR 0007 + R2 § 2 P0-2 lock + R1 D-7 Pattern L + PLAN-CHECK B-1/B-2/B-3 fix

---

#### T2.2 build:schema artifact 重新生成
- [ ] **目标**: 重新生成 `schemas/manifest.v1.schema.json`（IDE 用）
- **命令**: `cd /d/GitCode/harnessed && corepack pnpm build:schema`
- **验收**:
  - [ ] `schemas/manifest.v1.schema.json` 含 `category` enum 6 + `install_type` enum 4 + `decision_rules` Object schema
  - [ ] `corepack pnpm validate:schema` 通过
- **决策来源**: T2.1 后置必走

---

#### T2.3 schema unit tests ≥ 12 cell（3 文件 — Pattern J BASE+modifier）
- [ ] **目标**: B3 acceptance bar — 覆盖 3 新字段 schema 验证
- **文件**（3 文件 — 6 路并行可，但先按顺序写）:
  - `/d/GitCode/harnessed/tests/unit/manifest-validate.category.test.ts`（≥ 4 cell）
  - `/d/GitCode/harnessed/tests/unit/manifest-validate.install-type.test.ts`（≥ 4 cell）
  - `/d/GitCode/harnessed/tests/unit/manifest-validate.decision-rules.test.ts`（≥ 4 cell — 含 nested array+object reject case，R1 风险 1 mitigation）
- **测试 cell**:
  - category test: 6 valid enum 各 1 / 1 invalid enum reject / 1 missing reject
  - install_type test: 4 valid enum 各 1 / 1 invalid enum reject / 1 missing reject
  - decision_rules test: 1 完整 valid / 1 omit (optional pass) / 1 invalid override_signals shape reject (nested array+object) / 1 additionalProperties reject
- **验收**:
  - [ ] tests 202 + 1 skipped → ≥ 215 + 1 skipped (+12 cell at minimum)
  - [ ] `corepack pnpm test -- --filter "manifest-validate.(category|install-type|decision-rules)"` 全绿
  - [ ] 每 test assert keyword (enum / required / additionalProperties / type)
- **决策来源**: Pattern J + R2 § 2 嵌套 robust 性测试 + R1 风险 1 mitigation

---

### Wave 2 — decision_rules.yaml v1 + arbitrate logic

#### T3.1 routing/decision_rules.yaml v1 起草
- [ ] **目标**: 落地 6 category × ≥ 12 rules MVP；从 GRAY-AREA-1 § 2 schema 提取
- **IMPL NOTE — B-1 schema 区分**: 本文件是**全局 rule-set**（`hit_policy` / `rules[]` / `fallback_supervisor` / `deprecated[]`）— 与 T2.1 加的 manifest.spec.decision_rules（per-manifest hint）schema 完全独立。phase 1.4 routing engine **优先读本文件**。
- **IMPL NOTE — W-6 v1 frozen criteria + v2 migration**:
  - v1 frozen 一旦 phase 1.3 ship → 任何字段改动必走 ADR 0008+ errata 路径（A7 守恒模式 — 不动 v1 main body）
  - v2 演化时同步打 `scripts/migrate-decision-rules-v1-to-v2.mjs` 迁移脚本（沿袭 phase 1.1 H4 mock-claude-cli.sh shim pattern）
  - `version: 1` 字段是 reserved，phase 1.4+ 任何 reader 必先 check version 否则 reject
- **文件**: `/d/GitCode/harnessed/routing/decision_rules.yaml`
- **内容大纲**（参 GRAY-AREA-1 § 2 schema）:
  ```yaml
  version: 1  # reserved — v2 演化必走 ADR 0008+ errata + migration script (W-6)
  hit_policy: P  # Priority Hit Policy
  rules:
    # === design (2 rules) ===
    - id: ui-task-bold-style-override
      priority: 100
      domain: design
      when: { task_type: ui-design, override_keywords: ["做出风格", "design-led", ...] }
      decision: { primary_expert: frontend-design, secondary_expert: ui-ux-pro-max, ... }
    - id: ui-task-default
      priority: 50
      domain: design
      when: { task_type: ui-design }
      decision: { primary_expert: ui-ux-pro-max, secondary_expert: frontend-design, ... }
    # === content (2 rules) ===
    - id: pptx-file-task
    - id: chinese-content-deck
    # === testing (4 rules) ===
    - id: perf-a11y-memory
    - id: e2e-with-python-backend
    - id: e2e-default
    - id: ai-explore-debug
    # === search (2 rules) ===
    - id: search-academic-or-batch-or-token-sensitive
    - id: search-default
    # === meta (2 rules) ===
    - id: meta-create-skill
    - id: meta-find-skill
    # === engineering (W-1 + S-2 占位 — 0 rules in v1) ===
    # NOTE: engineering category base layer 已装（gstack/GSD/superpowers/karpathy/mattpocock/ralph-loop/planning-with-files），
    #       不需 install routing；rules 推 phase 1.4 加（参 GRAY-AREA-3 § 3.3 mattpocock_phases routing schema：
    #       discuss/plan/execute/verify 分阶段调度 23 招式，含心法 4 + 招式 23）。
  fallback_supervisor: { trigger: "L1 无 rule 命中 OR 多 rule 同 priority 冲突", llm: claude-opus-4-7 }
  deprecated:
    - { id: brave-search-mcp, reason: "API 改 $5/月信用 + 强制信用卡", fallback: tavily-mcp + exa-mcp }
  ```
- **验收**:
  - [ ] yaml 通过 lint（参 phase 1.1 yaml lint pipeline）
  - [ ] `git ls-files --eol routing/decision_rules.yaml` 应 `i/lf`
  - [ ] 12 rules 全含必填字段（id / priority / domain / when / decision）
  - [ ] engineering category 注释占位行存在（W-1 + S-2 verify — `grep "engineering.*占位" routing/decision_rules.yaml`）
  - [ ] `version: 1` reserved 字段存在（W-6 verify）
- **决策来源**: GRAY-AREA-1 § 2 + ADR 0006 § 4 A8' + ASSUMPTIONS D1.3-X + PLAN-CHECK B-1/W-1/S-2/W-6 fix

---

#### T3.2 src/routing/decisionRules.ts (parse + Ajv validate + arbitrate)
- [ ] **目标**: yaml 加载 → Ajv strict validate → Priority arbitrate（< 50 行 per R2 § 1.3 sketch）
- **文件**: `/d/GitCode/harnessed/src/routing/decisionRules.ts`
- **内容大纲**（≤ 100 行 — karpathy simplicity）:
  - 顶部 IMPL NOTE 引用 R2 § 1.3 sketch + KICKOFF B1 安全约束 (security gate yaml 注入预防)
  - TypeBox-derived `DecisionRulesSchema` (top-level + RuleSchema + SupervisorSchema + DeprecationSchema)
  - export `loadDecisionRules(yamlPath: string): DecisionRules` — yaml.parseDocument → toJS → Ajv validate → friendly errors
  - export `arbitrate(rules: Rule[], task: TaskContext): Rule | null` — Priority Hit Policy ≤ 30 行（参 R2 § 1.3 code sketch）
- **B1 security**: 加载后所有 rule 字段（特别 string fields）过 `checkCmdString` 二次验证（参 phase 1.1.1 H7 mitigation pattern）— 防 yaml 注入 shell-escape bypass
- **验收**:
  - [ ] `corepack pnpm typecheck && corepack pnpm lint` 0 错误
  - [ ] 文件 ≤ 100 行
  - [ ] export 函数 typecheck 通过
- **决策来源**: R2 § 1.3 sketch + R1 风险 4 mitigation (security gate)

---

#### T3.3 unit tests for decisionRules + arbitrate（≥ 8 cell）
- [ ] **目标**: B4 acceptance bar — 覆盖 yaml load + arbitrate
- **文件**: `/d/GitCode/harnessed/tests/unit/routing-decisionRules.test.ts`
- **测试 cell**:
  - load 1 valid yaml → 通过
  - load 1 invalid hit_policy reject
  - load 1 missing rules reject
  - arbitrate single rule match → 返回该 rule
  - arbitrate multi rule, 不同 priority → 返回最高 priority
  - arbitrate multi rule, 同 priority → 返回 null（触发 L2 supervisor）
  - arbitrate 0 rule match → 返回 null
  - security gate inject reject (yaml 含 `$(...)` reject)
- **验收**:
  - [ ] tests 215+1 → ≥ 223+1 skipped (+8 cell)
  - [ ] `corepack pnpm test -- --filter routing-decisionRules` 全绿
- **决策来源**: B4 acceptance + R2 § 1.3

---

### Wave 3 — Base profile install (`harnessed install-base`)

#### T4.1 src/cli/install-base.ts (独立子命令)
- [ ] **目标**: B5 acceptance bar — D-9 独立子命令；D-11 三态输出
- **文件**: `/d/GitCode/harnessed/src/cli/install-base.ts`
- **内容大纲**（≤ 100 行）:
  - 顶部 IMPL NOTE 引用 D-9 + D-11
  - 单一导出 `registerInstallBase(program: Command)`
  - flags: `--dry-run` / `--apply` / `--non-interactive`（与 install 子命令风格一致）
  - 内部:
    - auto-glob `manifests/{tools,skill-packs}/*.yaml` (10 文件)
    - 每 manifest:
      - validate
      - check method != phase21Placeholder（4 个 phase 2.1 deferred）
      - call `runInstall(manifest, opts)` (复用 phase 1.2 dispatcher)
      - aggregate 结果到 `installed[] / skipped[] / failed[]` 三态数组
    - print summary: "✅ installed: N / ⏸ skipped (deferred phase 2.1): M / ❌ failed: K"
  - exit code: 0 if installed > 0 + failed === 0; 1 if failed > 0; 2 if 全 skipped (degenerate case)
- **验收**:
  - [ ] `corepack pnpm typecheck && corepack pnpm lint` 0 错误
  - [ ] 文件 ≤ 100 行（karpathy）
- **决策来源**: D-9 + D-11 + INSTALLER-CONTRACT 契约 6 (放宽 deferred ≠ failure)

---

#### T4.2 src/cli.ts wire registerInstallBase（8 个 register fn 之一）
- [ ] **目标**: cli.ts 顶层注册 install-base
- **文件**: `/d/GitCode/harnessed/src/cli.ts`
- **内容修改**:
  ```typescript
  import { registerInstallBase } from './cli/install-base.js'
  // ...
  registerInstallBase(program)  // 8th register fn
  ```
- **验收**:
  - [ ] `corepack pnpm build && node ./dist/cli.mjs --help` 输出含 `install-base` 子命令
  - [ ] `node ./dist/cli.mjs install-base --help` 显示 flags
- **决策来源**: phase 1.2 cli.ts wire 模式（7 register fn → 8）

---

#### T4.3 tests/unit/cli-install-base.test.ts (≥ 5 cell)
- [ ] **目标**: B5 unit test 覆盖
- **文件**: `/d/GitCode/harnessed/tests/unit/cli-install-base.test.ts`
- **测试 cell**:
  - parse args + dry-run flag → 调用 dry-run 路径
  - 10 manifest 全 install ok → exit 0
  - 4 phase-2.1 placeholder → skipped 三态输出
  - 任一 install fail → exit 1 + failed 三态输出
  - 0 install + 0 fail (全 skipped) → exit 2
- **验收**:
  - [ ] tests 223+1 → ≥ 228+1 skipped (+5 cell)
- **决策来源**: D-11 三态 + Pattern J

---

### Wave 4 — ui-ux-pro-max install path 实测（D-10 shell probe）

#### T5.1 scripts/probe/ui-ux-pro-max-install.sh (shell probe — 不入 CI)
- [ ] **目标**: B6 acceptance bar — 一次性实测 + 不污染 CI
- **文件**: `/d/GitCode/harnessed/scripts/probe/ui-ux-pro-max-install.sh`
- **内容大纲**（~50 行 bash）:
  - 顶部注释: D-10 shell probe（一次性实测，不入 CI test suite）
  - **Path A 实测**: `npx skills@latest add https://github.com/midwayjs/midway/tree/v4-next/.codex/skills/ui-ux-pro-max` (R2 § 3.1 实测路径)
  - 验证 install: `ls ~/.claude/skills/ui-ux-pro-max/SKILL.md`
  - **Path B fallback**（如 Path A 失败）: `git clone --depth 1 --branch v4-next https://github.com/midwayjs/midway.git /tmp/midway-clone` + 拷贝 `.codex/skills/ui-ux-pro-max/` → `~/.claude/skills/` + symlink to `~/.claude/skills/ui-ux-pro-max`
  - 输出 result: PATH_A_OK / PATH_A_BROKEN_PATH_B_OK / BOTH_BROKEN
- **运行（一次性）**: `chmod +x scripts/probe/ui-ux-pro-max-install.sh && ./scripts/probe/ui-ux-pro-max-install.sh`
- **验收**:
  - [ ] 文件存在 + executable
  - [ ] 至少 1 平台（Mac 或 Linux）实测跑通输出 result
  - [ ] **W-4 condition**: 如条件允许，也跑 Win Git Bash 验证；若 Win 卡（npx skills CLI 在 Win 兼容性不确定），record finding F36-Win 而非阻塞（**Win fail ≠ phase 1.3 阻塞**；至少 1 平台 Mac/Linux pass 即接受）
  - [ ] **H3c sister patch — Path A 4-hour timeout escape**: 路径 A `npx skills` 实测如阻塞 ≥ 4 小时（vercel-labs/skills issue #373 / 兼容性问题 / 网络故障）→ 立即切**路径 B git-clone-with-setup**（D1.3-5 主推路径）兜底，记 F36 finding；**不阻塞 phase 1.3 整体推进**（Wave 4 是高风险 timebox-bound task）
  - [ ] **不**入 CI test suite（D-10 — 一次性 verify）
- **决策来源**: D-10 + R2 § 3.2 路径 B 主推 + W-4 PLAN-CHECK fix

---

#### T5.2 manifests/skill-packs/ui-ux-pro-max.yaml
- [ ] **目标**: 视 T5.1 实测结果决定 install method
- **W-3 fallback 决策树**（基于 T5.1 result）:
  1. **`PATH_A_OK` + `PATH_B_OK`** → manifest 用**路径 B**（`git-clone-with-setup` + 锁 v4-next tip SHA）— 防 vercel-labs/skills issue #373 update break v4-next；路径 A 不写入 production manifest（仅 specimen 验证）
  2. **`PATH_A_BROKEN` + `PATH_B_OK`** → manifest 必走**路径 B**（`git-clone-with-setup`）；F36 finding 记录路径 A broken 现象 + issue #373 引用
  3. **`BOTH_BROKEN`** → 不创建 ui-ux-pro-max manifest；F36 finding 记录 BLOCKER + 推 phase 1.4 evaluate fork-and-mirror 方案；不阻塞 phase 1.3 其他 task ship（B6 降级为 manifest 创建 deferred）
- **文件**: `/d/GitCode/harnessed/manifests/skill-packs/ui-ux-pro-max.yaml`
- **内容**（以 Path B 为主推，路径 A 通过则可二选）:
  ```yaml
  apiVersion: harnessed/v1
  metadata:
    name: ui-ux-pro-max
    upstream:
      source: midwayjs/midway
      repository: https://github.com/midwayjs/midway
    signed_by: <maintainer>
  spec:
    type: cc-skill-pack
    component_type: command
    category: design
    install_type: git  # 路径 B 路径
    install:
      method: git-clone-with-setup
      cmd: "git clone --depth 1 --branch v4-next ... + 子目录拷贝"
      git_ref: <v4-next tip SHA — T5.1 实测时锁定>
      idempotent_check: "test -f ~/.claude/skills/ui-ux-pro-max/SKILL.md"
    verify:
      cmd: "ls ~/.claude/skills/ui-ux-pro-max/SKILL.md"
      expected_exit_code: 0
    platforms: [darwin, linux, win32]
    decision_rules:
      trigger: "user 请求 UI/UX 设计 / 前端组件"
      default_expert: ui-ux-pro-max
      arbitration_rule: "ui-ux-pro-max 出主方案；frontend-design 补 layout / 动效 / 装饰"
      override_signals:
        - { phrase: "做出风格", use: frontend-design }
        - { phrase: "experimental", use: frontend-design }
  ```
- **验收**:
  - [ ] T5.1 result ∈ {PATH_A_OK + PATH_B_OK, PATH_A_BROKEN + PATH_B_OK} → manifest 创建
  - [ ] T5.1 result = BOTH_BROKEN → manifest 不创建 + F36 finding logged + B6 降级
  - [ ] `corepack pnpm test -- --filter fixtures` 全绿（manifest 创建时 11 manifest）
  - [ ] `git ls-files --eol manifests/skill-packs/ui-ux-pro-max.yaml` 应 `i/lf`
- **决策来源**: D1.3-5 路径 B + ADR 0007 schema 字段 + GRAY-AREA-1 § 2 yaml schema + W-3 PLAN-CHECK fix fallback 决策树

---

#### T5.3 progress.md F36 finding
- [ ] **目标**: T5.1 实测结果记录到 progress.md § B
- **S-3 F36 narrative 模板**（沿袭 phase 1.2.5 progress.md § B F33-F35 风格）:
  ```markdown
  ### F36: ui-ux-pro-max install path 实测（D1.2.5-11 / D1.3-5）

  **触发**: phase 1.3 T5.1 shell probe（scripts/probe/ui-ux-pro-max-install.sh）
  **平台**: <Mac/Linux/Win>
  **Path A 结果**: <PATH_A_OK / PATH_A_BROKEN — 含原因，如 vercel-labs/skills #373 hardcode /tree/main/ 必破 v4-next>
  **Path B 结果**: <PATH_B_OK / PATH_B_BROKEN — 含 git ref + setup script 是否成功>
  **决策**: 视 fallback 决策树（task_plan T5.2 W-3）→ <manifest 创建 with method=git-clone-with-setup / manifest 不创建 + 推 phase 1.4>
  **影响**: phase 1.4 routing engine 调用 design category 时 <可用 ui-ux-pro-max / 暂不可用，需 fork-and-mirror>
  **下一步**: <无 / phase 1.4 evaluate fork-and-mirror 方案 / phase 2.1 install adapter 加 git-clone-with-setup method runtime>
  ```
- **内容**: F36 finding narrative — 实测跑哪条路径 / 是否成功 / install adapter 是否启用 / 推 phase 1.4 还是 phase 1.5 优化
- **决策来源**: F33-F35 narrative 模式（phase 1.2.5 progress.md § B）+ S-3 PLAN-CHECK fix

---

### Wave 5 — AgentDefinition factory contract draft

#### T6.1 docs/AGENT-DEFINITION-FACTORY-CONTRACT.md ≥ 150 行
- [ ] **目标**: B7 acceptance bar — 12 字段完整版 + factory function signature + 错误处理路径（仅 draft，不实装代码）
- **文件**: `/d/GitCode/harnessed/docs/AGENT-DEFINITION-FACTORY-CONTRACT.md`
- **内容大纲**（≥ 150 行）:
  - § 1 Why this contract — phase 1.4 routing engine 实装的 prereq；解决 sister review M5 actionability gap
  - § 2 AgentDefinition 12 字段完整 schema:
    - 必填: `description` / `prompt`
    - optional: `tools` / `disallowedTools` / `model` / `skills` / `mcpServers` / `memory` / `maxTurns` / `background` / `effort` / `permissionMode`
    - 每字段 1-2 句 + 类型 + 实例
  - § 3 factory function signature:
    ```typescript
    function createAgent(
      task: TaskContext,
      decision: ArbitrateResult,
      opts: AgentDefinitionOpts,
    ): Promise<AgentDefinition>
    ```
  - § 4 skills 字段语义: string[] reference 主进程预 install 的 skill 名（fail-fast SkillNotInstalledError）
  - § 5 错误处理路径: skill not installed / no-COMPLETE / spawn fail / verbatim COMPLETE summarize 风险
  - § 6 ralph-loop 集成: --completion-promise "COMPLETE" + --max-iterations 20 + factory 内 maxTurns × 50 兜底
  - § 7 phase 1.4 implementation roadmap + **W-5 consumption 接口契约**:
    - phase 1.4 plan-phase 启动时，**plan-checker 用本 contract 做 V1 BLOCKER 检查**（任何 phase 1.4 task 涉及 AgentDefinition factory 实装必须引用本 contract 12 字段 + 错误处理路径作为 acceptance bar）
    - phase 1.4 execute-phase 时，factory 实装代码必须 1:1 对应本 contract § 2 12 字段 + § 3 signature + § 5 错误处理路径；任何字段缺失 / signature 偏离 = phase 1.4 plan-checker reject
    - 本 contract 起 **phase 1.3 ship 时刻 frozen**（v1）；任何 v2 演化必走 ADR 0008+ errata 路径（A7 守恒模式）
- **验收**:
  - [ ] `wc -l docs/AGENT-DEFINITION-FACTORY-CONTRACT.md` ≥ 150
  - [ ] grep "12 字段\|disallowedTools\|memory\|maxTurns\|background\|effort\|skills.*string\[\]\|verbatim COMPLETE" 全 hit
  - [ ] § 7 含 phase 1.4 plan-checker V1 BLOCKER 检查段（W-5 verify — `grep "V1 BLOCKER" docs/AGENT-DEFINITION-FACTORY-CONTRACT.md`）
- **决策来源**: D-12 + R2 § 4 P0-4 + sister review M5 (phase 1.2.5) + W-5 PLAN-CHECK fix

---

### Wave 6 — Cross-OS CI verify

#### T7.1 push origin → CI 三平台全绿 + A7 step iterate 1-7 verify
- [ ] **目标**: B8 acceptance bar — push 后 CI 第 N 轮验证
- **命令**: 
  ```bash
  git push origin main
  git push origin adr-0007-accepted
  # 等通知 + gh run watch
  ```
- **验收**:
  - [ ] 最新 CI run 三平台 success
  - [ ] A7 step iterate 1-7 全绿（含 ADR 0007）
  - [ ] tests ≥ 228+1 skipped
- **决策来源**: B8 acceptance bar + phase 1.2.5 push 模式

---

#### T7.2 (可选 hotfix) — CI red 时类 phase 1.2.1 模式
- [ ] **目标**: 如 CI red，做 phase 1.3.1 hotfix（参 phase 1.2.1 hotfix 模式）
- **触发条件**: T7.1 CI 任一平台 fail
- **决策来源**: phase 1.2.1 hotfix 经验

---

#### T7.3 (H1b sister patch) Perf attribution — schema 加 3 字段 perf cost 量化
- [ ] **目标**: 响应 sister review H1 finding — perf gate 第 2 次放松 (50→75ms F38) 趋势警报；做一次 root cause attribution，量化 phase 1.3 schema 加 3 字段对 manifest validate 路径的 perf cost
- **背景**:
  - phase 1.1 baseline: 21.7ms mean / RME ±2% (vitest bench output) / SLA 50ms
  - phase 1.3 现状: ubuntu CI 50.14ms 越线 → F38 hotfix relax 50→75ms
  - sister H1 推荐: profile + 对比 v0.1.0-alpha.1 (21.7ms) vs alpha.2 vs phase 1.3，识别 schema 加 3 字段（category/install_type/decision_rules nested array+object）贡献的 ms 量
- **文件**: `.planning/phase-1.3/PERF-ATTRIBUTION.md`（新文件，≥ 50 行）
- **内容大纲**:
  - § 1 Methodology: vitest bench --run + git stash apply v0.1.0-alpha.1 / alpha.2 / phase 1.3 spec.ts 各取 best-of-10
  - § 2 Results table: 各阶段 mean / RME / 字段数量 / Ajv compile 时间
  - § 3 Attribution: 每个新加字段（category 6 enum / install_type 4 enum / decision_rules nested）对 mean 的 increment 估算
  - § 4 Conclusion: 是否 schema 加字段 root cause 还是 CI runner 噪音；phase 1.4 是否需进一步优化
- **验收**:
  - [ ] PERF-ATTRIBUTION.md ≥ 50 行
  - [ ] § 2 results table 含 ≥ 3 阶段 baseline
  - [ ] § 4 conclusion 给出 actionable next-step（优化 / 接受现状 / 持续监控）
- **决策来源**: sister review H1b PLAN-CHECK fix + F38 root cause investigation 透明化

---

### Wave 7 — Docs + ship

#### T8.1 update STATE.md phase 1.3 SHIPPED + B-4 audit 补全 + H2 README sync
- [ ] **目标**: STATE.md 标记 phase 1.3 ship + 解锁 phase 1.4 + **B-4: audit 补全过时块**
- **文件**: `/d/GitCode/harnessed/.planning/STATE.md`
- **B-4 起手 audit step**（phase 1.3 ship 前 STATE.md 已停在 phase 1.2，未记 1.1.1 / 1.2.1 / 1.2.5）:
  - [ ] STATE.md "已完成" 段补 ✅ Phase 1.1.1 hotfix（2026-05-12）entry — paranoid review 9 项 fixes / tests 71→89 / A7 守恒
  - [ ] STATE.md "已完成" 段补 ✅ Phase 1.2.1 hotfix（2026-05-12）entry — B5' CI fail fix `set +o pipefail` / commit bad2f20 / CI run 25721497734 三平台全绿
  - [ ] STATE.md "已完成" 段补 ✅ Phase 1.2.5 architecture revision（2026-05-12）entry — ADR 0006 wedge 重定位 / 8 支柱 100% capture / 6 baseline tag
- **B-4 进度算法明确**: phase 1.2.5 算独立 phase → ROADMAP v3 重排后总 phase 数 = v0.1 (1.1+1.2+1.2.5+1.3+1.4+1.5 = 6) + v0.2 (4) + v0.3 (4) + v0.4 (3) = **17 phase**（**不再是 16**）
  - phase 1.3 ship 后：4 / 17 phases 已完成 (1.1, 1.2, 1.2.5, 1.3) ≈ **23.5%**
  - STATE.md L4 "总工期" + L24 "进度" + L28 各里程碑表全部更新
  - ROADMAP.md L7 "16 phases" → "17 phases" 同步（已在 plan-phase Wave B.4 fix 中预先 patch — execute 阶段验证）
- **内容修改**:
  - 当前位置: phase 1.3 ✅ COMPLETED — SHIPPED 2026-MM-DD
  - 下一 phase: 1.4 (routing engine v1 + research workflow E2E)
  - 进度: 4 / 17 phases ▓▓▓▓░░░░░░░░░░░░░ 23.5%（v3 重排后 17 phase）
  - 已完成段加 "Phase 1.1.1 hotfix" / "Phase 1.2.1 hotfix" / "Phase 1.2.5 architecture revision" / "Phase 1.3 SHIPPED" 4 entry
  - 累积 ADR: 5 → 7（加 ADR 0006 wedge + ADR 0007 errata）
  - 累积 baseline tag: 5 → 7（加 adr-0006-accepted + adr-0007-accepted）
- **验收**:
  - [ ] STATE.md phase 1.1.1 / 1.2.1 / 1.2.5 / 1.3 4 段落完整
  - [ ] 进度表 4/17 = 23.5% （v3 重排后总 phase 数）
  - [ ] ROADMAP.md L7 "17 phases" 已同步（plan-phase pre-patch 验证）
  - [ ] 累积 ADR / baseline tag count 准确
- **H2 sister patch — README L1-L20 wedge sync (新加 scope)**:
  - [ ] README L3 一句话定位: 从 "AI coding harness 生态的装配主义包管理器 + composition orchestrator" → 升级为 "完整三层栈方法论的可执行 engine — 6+ 虚拟角色 / 双职责治理 / 4 心法 / 23 招式 phase 路由 / 6 skill category，把 CLAUDE.md 协作规则机器化"
  - [ ] README 关键差异化段加一条 "三层栈机器化"（gstack 决策层 + GSD 项目经理 + superpowers 资深工程师 三角色横切）
  - [ ] README v0.1.0-alpha.2 状态加 phase 1.2.5 architecture revision wedge 升级 + ADR 0006 引用
  - [ ] "装配主义包管理器" 作为 phase 1.1-1.2 base layer 描述保留（不删，但下沉至次要 paragraph，不再是顶层 wedge）
  - **决策来源**: sister review H2 PLAN-CHECK fix — README 是项目门面 + STATE.md SSOT 一致性原则；phase 1.3 ship 前必修
- **决策来源**: phase 1.2/1.2.5 ship 史 + B-4 PLAN-CHECK fix + H2 sister patch (README sync)

---

#### T8.2 写 .planning/phase-1.3/VERIFICATION.md ≥ 100 行
- [ ] **目标**: B1-B8 复现命令清单 + Phase 1.4 prereq + Findings 索引
- **文件**: `/d/GitCode/harnessed/.planning/phase-1.3/VERIFICATION.md`
- **内容大纲**（≥ 100 行 — phase 1.2 风格）:
  - § 1 Acceptance Bar 复现命令（B1-B8 各一行 bash）
  - § 2 Phase 1.4 prereq 列表（routing engine implementation 直接消费 phase 1.3 输出）
  - § 3 Findings 索引（F36+，从 progress.md § B 反向链接）
- **验收**:
  - [ ] ≥ 100 行
  - [ ] B1-B8 复现命令完整

---

#### T8.3 (main agent decide) push tag v0.1.0-alpha.3-base-profile
- [ ] **目标**: phase 1.3 milestone tag（main agent 决定）
- **决策点**: 是否打 tag — 看 phase 1.3 是否 functional milestone（base profile install 命令 + decision_rules.yaml + AgentDefinition contract draft = 是 functional ship）
- **建议**: 打 tag `v0.1.0-alpha.3-base-profile`（与 phase 1.1/1.2 milestone 模式一致）
- **决策来源**: phase 1.1/1.2 milestone tag 风格

---

## 完成 phase 1.3 的最后一行 commit message 模板

```
phase-1.3: T8.3 close phase 1.3 — base profile + categorization schema ready

- All 7 wave (20 atomic subtasks) complete; acceptance bar B1-B8 all green.
- ADR 0007 errata accepted; manifest schema 加 3 字段 (category/install_type/decision_rules);
  10 base manifest 全部加 category + install_type 字段.
- decision_rules.yaml v1 落地 (DMN Priority Hit Policy + 6 category × 12 rules MVP);
  src/routing/decisionRules.ts arbitrate function ≤ 50 lines.
- harnessed install-base 子命令; 三态输出 (installed/skipped/failed).
- ui-ux-pro-max install path 实测 (路径 B git-clone-with-setup 主推); manifest 创建.
- AgentDefinition factory contract draft 12 字段完整版.
- Tests ≥ 228 + 1 skipped (+27 from 202 + 1 skipped).
- ADR 0001-0006 main body 不动 (A7 守恒); CI A7 step iterate 1-7 全绿.
- 6 baseline tag → 7 baseline tag (adr-0007-accepted 加入守恒).
- Unblocks phase 1.4 (routing engine v1 + research workflow E2E + AgentDefinition factory implementation).
- Tag: v0.1.0-alpha.3-base-profile
```

---

## 维护检查清单（每次 commit 前自检）

- [ ] 改动的 task 在本文件已勾选
- [ ] progress.md 已追加一行（含 commit short-hash）
- [ ] 任何意外 / 决策修订已写入 progress.md § B（F36+，模板沿用 phase 1.2.5）
- [ ] commit message 含 task ID + 简短 action + 决策来源（ADR / D1.3-X / R1 / R2）
- [ ] 该 task 涉及代码改动 → `corepack pnpm typecheck && corepack pnpm lint && corepack pnpm test` 全绿
- [ ] 涉及 schema 改动 → `corepack pnpm build:schema` 重新生成 artifact + `corepack pnpm validate:schema` 通过
- [ ] ADR 0001-0006 main body 不被本 task 修改（A7 守恒；CI 自动 enforce）

---

## Wave-Level Acceptance Checkpoint

每个 wave 完成时跑下列子集验收：

| Wave | 完成验收子集 |
|------|--------------|
| Wave 0 | adr-0007-accepted tag + ci.yml A7 iter 1-7 + commits 干净 |
| Wave 1 | typecheck/lint/test ≥ 215+1 + schema artifact + 10 manifest 全加字段 |
| Wave 2 | tests ≥ 223+1 + decision_rules.yaml validate + arbitrate function 单测 ≥ 8 cell |
| Wave 3 | tests ≥ 228+1 + `harnessed install-base --help` 显示子命令 |
| Wave 4 | shell probe 跑通 + ui-ux-pro-max manifest + F36 finding logged |
| Wave 5 | AgentDefinition contract draft ≥ 150 行 + 12 字段 grep hit |
| Wave 6 | CI 三平台 success + A7 iter 1-7 全绿 |
| Wave 7 | STATE/VERIFICATION update + 8/8 ✅ + (可选) v0.1.0-alpha.3-base-profile tag |
