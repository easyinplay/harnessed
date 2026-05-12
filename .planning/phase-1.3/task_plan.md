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
  - Compliance: ADR 0001 main body 不动（A7 守恒）；fixture-driven validate test 自动覆盖（T2.3）
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
- **内容修改**: A7 step 内的 `for n in 0001 0002 0003 0004 0005 0006` → `for n in 0001 0002 0003 0004 0005 0006 0007`；comment 升级 "ADR 0001-0007 main body 守恒"
- **验收**:
  - [ ] CI yaml 含 0007 in iterate
  - [ ] `corepack pnpm typecheck && corepack pnpm lint` 0 错误（不应触发 — yaml 改不影响 ts）
- **决策来源**: B8 acceptance bar + phase 1.2.5 commit 33da1a0 升级模式

---

### Wave 1 — Schema 实装（manifest 加 3 字段 + tests ≥ 12 cell）

#### T2.1 src/manifest/schema/spec.ts 加 3 字段（Pattern L spec-level metadata 加法）
- [ ] **目标**: 在 SpecSchema 顶层加 3 字段，影响所有 manifest type；现有 10 manifest 全部补字段
- **文件**: 
  - `/d/GitCode/harnessed/src/manifest/schema/spec.ts`（修改）
  - `/d/GitCode/harnessed/manifests/{tools,skill-packs}/*.yaml`（10 文件 — 全部加 category + install_type 字段；decision_rules optional 暂不加）
  - `/d/GitCode/harnessed/tests/fixtures/manifests/valid/*.yaml`（同步）
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
- **10 manifest category + install_type 映射**（基于 phase 1.1 上游清单）:
  ```yaml
  # tools/
  ctx7.yaml:        { category: search, install_type: npm }
  tavily-mcp.yaml:  { category: search, install_type: mcp }
  exa-mcp.yaml:     { category: search, install_type: mcp }
  # skill-packs/
  gstack.yaml:           { category: engineering, install_type: git }
  gsd.yaml:              { category: engineering, install_type: npm }
  superpowers.yaml:      { category: engineering, install_type: skill }
  planning-with-files.yaml: { category: engineering, install_type: skill }
  mattpocock-skills.yaml: { category: engineering, install_type: skill }
  karpathy-skills.yaml:   { category: engineering, install_type: skill }
  ralph-loop.yaml:        { category: engineering, install_type: skill }
  ```
- **后置**: `corepack pnpm build:schema` 重新生成 `schemas/manifest.v1.schema.json`
- **验收**:
  - [ ] `corepack pnpm typecheck && corepack pnpm lint` 0 错误
  - [ ] `corepack pnpm test -- --filter fixtures` 全绿（10 manifest fixture pass）
  - [ ] `git diff adr-0001-accepted -- docs/adr/0001-*.md` 输出空（A7 守恒 paranoid check）
  - [ ] `schemas/manifest.v1.schema.json` 含 3 新字段
- **决策来源**: ADR 0007 + R2 § 2 P0-2 lock + R1 D-7 Pattern L

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

#### T3.1 .planning/decision_rules.yaml v1 起草
- [ ] **目标**: 落地 6 category × ≥ 12 rules MVP；从 GRAY-AREA-1 § 2 schema 提取
- **文件**: `/d/GitCode/harnessed/.planning/decision_rules.yaml`
- **内容大纲**（参 GRAY-AREA-1 § 2 schema）:
  ```yaml
  version: 1
  hit_policy: P  # Priority Hit Policy
  rules:
    # design (2 rules)
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
    # content (2 rules)
    - id: pptx-file-task
    - id: chinese-content-deck
    # testing (4 rules)
    - id: perf-a11y-memory
    - id: e2e-with-python-backend
    - id: e2e-default
    - id: ai-explore-debug
    # search (2 rules)
    - id: search-academic-or-batch-or-token-sensitive
    - id: search-default
    # meta (2 rules)
    - id: meta-create-skill
    - id: meta-find-skill
  fallback_supervisor: { trigger: "L1 无 rule 命中 OR 多 rule 同 priority 冲突", llm: claude-opus-4-7 }
  deprecated:
    - { id: brave-search-mcp, reason: "API 改 $5/月信用 + 强制信用卡", fallback: tavily-mcp + exa-mcp }
  ```
- **验收**:
  - [ ] yaml 通过 lint（参 phase 1.1 yaml lint pipeline）
  - [ ] `git ls-files --eol .planning/decision_rules.yaml` 应 `i/lf`
  - [ ] 12 rules 全含必填字段（id / priority / domain / when / decision）
- **决策来源**: GRAY-AREA-1 § 2 + ADR 0006 § 4 A8' + ASSUMPTIONS D1.3-X

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
  - [ ] **不**入 CI test suite（D-10 — 一次性 verify）
- **决策来源**: D-10 + R2 § 3.2 路径 B 主推

---

#### T5.2 manifests/skill-packs/ui-ux-pro-max.yaml
- [ ] **目标**: 视 T5.1 实测结果决定 install method
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
  - [ ] `corepack pnpm test -- --filter fixtures` 全绿（11 manifest 含新加 ui-ux-pro-max）
  - [ ] `git ls-files --eol manifests/skill-packs/ui-ux-pro-max.yaml` 应 `i/lf`
- **决策来源**: D1.3-5 路径 B + ADR 0007 schema 字段 + GRAY-AREA-1 § 2 yaml schema

---

#### T5.3 progress.md F36 finding
- [ ] **目标**: T5.1 实测结果记录到 progress.md § B
- **内容**: F36 finding narrative — 实测跑哪条路径 / 是否成功 / install adapter 是否启用 / 推 phase 1.4 还是 phase 1.5 优化
- **决策来源**: F33-F35 narrative 模式（phase 1.2.5 progress.md § B）

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
  - § 7 phase 1.4 implementation roadmap (1-2 段)
- **验收**:
  - [ ] `wc -l docs/AGENT-DEFINITION-FACTORY-CONTRACT.md` ≥ 150
  - [ ] grep "12 字段\|disallowedTools\|memory\|maxTurns\|background\|effort\|skills.*string\[\]\|verbatim COMPLETE" 全 hit
- **决策来源**: D-12 + R2 § 4 P0-4 + sister review M5 (phase 1.2.5)

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

### Wave 7 — Docs + ship

#### T8.1 update STATE.md phase 1.3 SHIPPED
- [ ] **目标**: STATE.md 标记 phase 1.3 ship + 解锁 phase 1.4
- **文件**: `/d/GitCode/harnessed/.planning/STATE.md`
- **内容修改**:
  - 当前位置: phase 1.3 ✅ COMPLETED — SHIPPED 2026-MM-DD
  - 下一 phase: 1.4 (routing engine v1 + research workflow E2E)
  - 进度: 3 / 16 phases ▓▓▓░░░░░░░░░░░░░ 18.75%
  - 已完成段加 "Phase 1.3 SHIPPED" 条目
  - 累积 ADR: 6 → 7（加 ADR 0007 errata）
- **验收**:
  - [ ] STATE.md phase 1.3 段落完整
  - [ ] 进度表更新

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
