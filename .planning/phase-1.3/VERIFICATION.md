# Phase 1.3 Verification (Reproduction Guide)

> **Purpose**：让任何 reviewer / fork 能本地复现 phase 1.3 的 8 acceptance bar (B1-B8) 验收
> **Tag baseline**：`v0.1.0-alpha.3-base-profile`（local tag — 见 T8.3，main agent 决定 push）
> **Created**：2026-05-13（phase 1.3 final ship batch 4 — Wave 7 T8.2）
> **Style**：phase-1.2 VERIFICATION.md 同款（B1'-B9' 复现 + finding 索引 + 下一 phase prereq）

## Prerequisites

- Node.js ≥ 22.0.0（v0.1 锁 22 LTS — `engines.node` 强制）
- Git（Windows: Git Bash 推荐 — 见 CONTRIBUTING.md "Windows Workaround"）
- pnpm 10.12.0 (corepack 自动激活 — `corepack enable`)
- 5 分钟 + 干净仓库（`git status` clean）
- (可选) `gh` CLI 已装 + `gh auth status` 通过（B8 CI 状态查询才需）
- (可选) `claude` CLI 已装且能 `claude mcp list`（phase 1.2 B2'/B3' 跨 phase verify 才需 — phase 1.3 本身不依赖）

## Setup

```bash
git clone <repo-url>
cd harnessed
git checkout v0.1.0-alpha.3-base-profile   # phase 1.3 milestone tag
corepack enable
corepack pnpm install --frozen-lockfile
```

如 Windows ACL 报错 → CONTRIBUTING.md "Windows Workaround"（F1）。

---

## § 1 Acceptance Bar B1-B8 复现

### B1 — ADR 0007 errata accepted + adr-0007-accepted tag pushed

```bash
# 检查 ADR 0007 文件存在
ls docs/adr/0007-*.md
# 期望：docs/adr/0007-categorization-schema-extension.md

# 检查 baseline tag 已打
git tag -l | grep adr-0007-accepted
# 期望：adr-0007-accepted

# A7 守恒 verify — 全 7 ADR baseline tag 0 diff
for n in 0001 0002 0003 0004 0005 0006 0007; do
  diff_lines=$(git diff "adr-${n}-accepted" -- "docs/adr/${n}-*.md" 2>/dev/null | wc -l)
  echo "ADR $n diff lines: $diff_lines"
done
# 期望：所有 7 ADR diff lines = 0
```

phase 1.3 batch 1 commit `bc8d624` 起草 217 行 ADR 0007 errata；`b173a84` 把 CI A7 step iterate 1-6 → 1-7 同步加入 0007 baseline tag iterate；F37 retroactive 修复 ADR 0006 baseline tag 漂移（重打到 `3e24c16` 的 phase 1.2.5 Wave D 后 commit）。

### B2 — manifest schema 加 3 字段（category / install_type / decision_rules）+ `validate:schema` 通过

```bash
corepack pnpm validate:schema
# 期望：✅ Ajv 8 strict + discriminator + 7.81 KB artifact OK

# 字段名 grep 命中
grep -E '"category"|"install_type"|"decision_rules"' schemas/manifest.v1.schema.json
# 期望：3 字段 grep hit
```

phase 1.3 batch 1 commit `a5ce405` (T2.1+T2.2) 一次落地：`spec.ts` 加 3 字段 + 10 manifest 全 patch + 10 fixture pair 全 patch + 6 BASE template (`tests/fixtures/manifests/illegal/`) 同步加字段（per Rule 2 critical functionality fix — manifest-validate.security spec 行号 18→20）+ `validate:schema` 通过。

### B3 — schema unit tests +19 cell + 测试 202+1 → 235+1

```bash
corepack pnpm test 2>&1 | grep -E "Test Files|Tests +[0-9]+ passed"
# 期望：33 passed | 1 skipped (34) / 235 passed | 1 skipped (236)

# 19 cell breakdown
corepack pnpm test -- tests/unit/manifest-validate.category.test.ts \
  tests/unit/manifest-validate.install-type.test.ts \
  tests/unit/manifest-validate.decision-rules.test.ts 2>&1 | tail -5
# 期望：3 个 unit test 文件 19 cell 全绿
# 分布：category 8 cell / install-type 6 cell / decision-rules 5 cell (含 R1 嵌套 array+object reject mitigation)
```

phase 1.3 batch 1 commit `75419a0` (T2.3) 落地 +19 cell。

### B4 — `routing/decision_rules.yaml` v1 + arbitrate Priority Hit Policy + 8 cell

```bash
# YAML schema validate
corepack pnpm test -- tests/unit/routing-decisionRules.test.ts 2>&1 | tail -5
# 期望：8 cell 全绿 (3 schema validate / 1 B1 security $(...) reject / 4 arbitrate Priority Hit Policy)

# YAML 文件 12 rules 命中
grep -c '^  - id:' routing/decision_rules.yaml
# 期望：12

# version: 1 + hit_policy: P + fallback_supervisor 配置
grep -E '^version:|^hit_policy:|fallback_supervisor:' routing/decision_rules.yaml
# 期望：3 行 hit (version: 1 / hit_policy: P / fallback_supervisor: claude-opus-4-7)
```

phase 1.3 batch 2 commits：`a74aa9e` (T3.1) `routing/decision_rules.yaml` v1 (179L)；`093fced` (T3.2) `src/routing/decisionRules.ts` (105L; loadDecisionRules + Ajv strict + B1 security gate twin-pass + arbitrate Priority Hit Policy)；`58a2840` (T3.3) +8 cell。M1 sister patch (commit `df54d3c`) 把文件从 `.planning/decision_rules.yaml` 移到 `routing/decision_rules.yaml`（更合 SSOT 位置语义）。

### B5 — `harnessed install-base` 子命令 + dry-run 三态输出

```bash
corepack pnpm build
node ./dist/cli.mjs install-base --help
# 期望：3 flag 显示 --apply / --dry-run / --non-interactive

# H1 gate verify (--non-interactive 必须配 --apply 或 --dry-run)
node ./dist/cli.mjs install-base --non-interactive
# 期望：exit 2 + 错误信息 "must specify --apply or --dry-run"

# 三态输出 (D-11) — 默认 dry-run
node ./dist/cli.mjs install-base --dry-run
# 期望输出：installed: 0 / skipped: N (10 base manifests，方法已实装的算 installed，phase 2.1 placeholder 算 skipped) / failed: 0
# (实际仅 npm-cli + mcp-stdio-add 2 method 已实装；其他 4 method 算 placeholder skipped)

# 8 register fn 验证
node ./dist/cli.mjs --help | grep -E 'install|install-base|doctor|audit|rollback|status|backup|gc' | wc -l
# 期望：≥ 7 (含 install-base 在 install 之外作 sibling 子命令)

# 5 cell unit
corepack pnpm test -- tests/unit/cli-install-base.test.ts 2>&1 | tail -5
# 期望：5 cell 全绿 (H1 gate / happy path 2 manifest / placeholder skip / dispatcher fail / 全 placeholder degenerate)
```

phase 1.3 batch 3 commits：`ace8dc0` (T4.1) `src/cli/install-base.ts` 102L；`b14c5ff` (T4.2) `src/cli.ts` wire registerInstallBase (8 register fn)；`5e85282` (T4.3) +5 cell。

### B6 — ui-ux-pro-max install path 实测 + manifest 创建

```bash
# Path A specimen probe (D-10 — 不入 CI test suite)
bash scripts/probe/ui-ux-pro-max-install.sh
# 期望 (Win Git Bash MINGW64 已实测)：
# PATH_A_OK + PATH_B_OK + v4-next tip SHA = e89d70e4bcd0...
# (Mac/Linux 待 phase 1.4 cross-OS verify 时同步)

# manifest 文件命中 + decision_rules per-manifest hint
cat manifests/skill-packs/ui-ux-pro-max.yaml
# 期望: install_type=git + method=git-clone-with-setup + git_ref e89d70e4bcd0ae04709a773db549cf61fcf813ac (40 hex)
# + decision_rules per-manifest hint (UI/UX 设计 trigger / default_expert ui-ux-pro-max / override 做出风格→frontend-design)

# fixture mirror +1 cell (235+1 confirmed in B3)
ls tests/fixtures/manifests/valid/ | grep ui-ux
# 期望：ui-ux-pro-max.yaml 镜像
```

phase 1.3 batch 3 commits：`e49e5f8` (T5.1) shell probe 108L；`6a4a1f4` (T5.2) manifest + fixture +1 cell；`762ee30` (T5.3) progress.md F36 finding。**Path B 主推 / Path A specimen 跑通**（per D1.3-5 + W-3 fallback 决策树第 1 路径），规避 vercel-labs/skills issue #373 update bug。

### B7 — AgentDefinition factory contract draft 12 字段

```bash
wc -l docs/AGENT-DEFINITION-FACTORY-CONTRACT.md
# 期望：≥ 150 行

# 12 字段命中 + signature + W-5 consumption + V1 BLOCKER
grep -E "12 字段|disallowedTools|memory|maxTurns|background|effort|skills.*string\[\]|verbatim COMPLETE|V1 BLOCKER" \
  docs/AGENT-DEFINITION-FACTORY-CONTRACT.md | wc -l
# 期望：≥ 8 (multiple field references + signature + verbatim COMPLETE marker + V1 BLOCKER 检查)
```

phase 1.3 batch 3 commit `7c9b66f` (T6.1) 落地完整 12 字段 + signature + W-5 consumption (Wave 5 phase 1.4 routing engine prereq) + V1 BLOCKER 检查。

### B8 — CI 三平台全绿 + A7 step iterate 1-7 全绿 + ADR 0001-0007 main body diff 0

```bash
# 最新 CI run 状态
gh run list --limit 1 --json conclusion,headSha,databaseId
# 期望：conclusion: "success" / 三平台 success

# 详细 jobs 状态
gh run view <id> --json jobs | jq '.jobs[] | {name: .name, conclusion: .conclusion}'
# 期望：windows-latest / ubuntu-latest / macos-latest 全 success

# A7 step log
gh run view <id> --log | grep "A7 ✅ ADR 0001-0007 main body unchanged"
# 期望：3 hit (windows / ubuntu / macos)
```

phase 1.3 batch 3 push 触发 CI run **25790126213 @ 7c9b66f** — **三平台全绿 ✅** (windows-latest / ubuntu-latest / macos-latest 全 success；A7 ✅ ADR 0001-0007 main body unchanged on all 3 platforms；235 passed / 1 skipped tests consistent across platforms).

phase 1.3.1 hotfix bundle 历史:
- F37 retroactive retag adr-0006-accepted → 3e24c16 (commit `ef2fdd7` 解决 phase 1.2.5 残留 baseline tag 漂移)
- F38 perf gate 50→75ms relax (commit `ba79551`，hotfix CI Ubuntu 50.14ms 越线)
- F39 sister review patch round (commit `df54d3c` + `0d3ec97`，6/8 applied + 2 deferred)

---

## § 2 Phase 1.4 prereq 列表

phase 1.4 routing engine v1 实装时**直接消费 phase 1.3 输出**，无需重做：

| Phase 1.4 需要 | Phase 1.3 已落地位置 | 接口签名 |
|---------------|--------------------|----------|
| manifest spec 顶层 `category` 6 enum | `src/manifest/schema/spec.ts:133` | `category: Category` (required, enum design/content/testing/search/meta/engineering) |
| manifest spec 顶层 `install_type` 4 enum | `src/manifest/schema/spec.ts:134` | `install_type: InstallType` (required, enum ngm/npx/git/local) |
| manifest spec 顶层 `decision_rules` optional Object schema | `src/manifest/schema/spec.ts:135` | `decision_rules: Type.Optional(DecisionRules)` (per-manifest hint) |
| `routing/decision_rules.yaml` v1 schema (12 rules) | `routing/decision_rules.yaml` (179L) | YAML doc v1 / hit_policy: P / fallback_supervisor / 12 rules across 6 category |
| `src/routing/decisionRules.ts` arbitrate(rules, taskContext) | `src/routing/decisionRules.ts:arbitrate()` | export function arbitrate(rules: DecisionRules, ctx: TaskContext): RoutingResult — Priority Hit Policy ≤ 7 行 |
| `src/routing/decisionRules.ts` loadDecisionRules() | `src/routing/decisionRules.ts:loadDecisionRules()` | export async function loadDecisionRules(path: string): Promise<DecisionRules> — yaml.parseDocument + Ajv strict + checkCmdString B1 security twin-pass |
| `harnessed install-base` 命令 (10 manifest 一键装齐) | `src/cli/install-base.ts` (102L; src/cli.ts wire registerInstallBase 8th register fn) | `node ./dist/cli.mjs install-base [--apply\|--dry-run] [--non-interactive]` |
| `docs/AGENT-DEFINITION-FACTORY-CONTRACT.md` 12 字段 | `docs/AGENT-DEFINITION-FACTORY-CONTRACT.md` | name / description / model / verbatim_marker / disallowedTools / memory / maxTurns / background / effort / skills (string[]) / system_prompt_template / V1 BLOCKER 检查 |

phase 1.4 plan-phase **只需读 schema + YAML + contract draft 即可启动**，不再修订 wedge（per phase 1.3 PLAN.md § 1.1 goal）。

---

## § 3 Findings 索引

详 `.planning/phase-1.3/progress.md` § B：

### F36 — ui-ux-pro-max install path 实测（D1.2.5-11 / D1.3-5）

- **触发**: phase 1.3 batch 3 Wave 4 T5.1 shell probe（commit `e49e5f8`）
- **平台**: Win Git Bash (MINGW64_NT-10.0-26200)
- **Path A**: PATH_A_OK ✅ — `npx --yes skills@latest add ...` 在 Win 兼容 v4-next 分支 + tree URL with branch ref；但 update 必破（vercel-labs/skills issue #373）
- **Path B (主推)**: PATH_B_OK ✅ — `git clone --depth 1 --branch v4-next ...` + `cp -R`；v4-next tip SHA `e89d70e4bcd0ae04709a773db549cf61fcf813ac` (40 hex `git ls-remote` 实证)；锁 SHA 完全可重现 + 不踩 issue #373
- **影响**: phase 1.4 routing engine 调用 design category 时 ui-ux-pro-max 可即用（仍是 phase 2.1 placeholder method 但 manifest schema OK + decision_rules hint 已落地）
- **status**: ✅ RESOLVED — Path A specimen 跑通 + Path B 主推已 ship；B6 acceptance bar 命中

### F37 — ADR 0006 baseline tag 与 main body 漂移 (pre-existing from phase 1.2.5 Wave D)

- **触发**: phase 1.3 batch 1 final A7 paranoid check (T2.3 commit 后)
- **Root cause**: phase 1.2.5 Wave D commit `3e24c16` (M3 sister review fix) 给 ADR 0006 加 ~50 行 self-contained snapshot；commit 时间戳早于 phase 1.3 batch 1，但 baseline tag 仍指向旧 commit `32803ad`
- **决议路径 A (落地 commit ef2fdd7)**: retroactive 重打 `adr-0006-accepted` → `3e24c16`（沿袭 phase 1.2 F26 模式）；A7 守恒规则下"tag 应反映 ship 时刻 main body"语义恢复
- **影响 (positive)**: CI A7 step iterate 1-7 全绿；7/7 ADR baseline tag 守恒规则恢复
- **status**: ✅ RESOLVED — batch 2 unblocked

### F38 — CI Ubuntu perf gate 越线 0.14ms — phase 1.3.1 hotfix threshold 50→75ms

- **触发**: phase 1.3 batch 1 push (`ef2fdd7`) 后 CI run **25782297583** Ubuntu fail：`100 manifest validations took 50.14ms (threshold 50ms)`
- **Root cause**: phase 1.3 给 SpecSchema 顶层加 3 字段（含嵌套 array of object `decision_rules`）— Ajv strict validate 路径加宽；phase 1.1 baseline 22ms → phase 1.3 baseline ~28ms；50ms threshold 余量从 2.3× → 1.8×；Ubuntu shared VM CI runner 偶发 GC/scheduler spike 越线
- **hotfix (commit ba79551)**: `tests/integration/manifest-validate.perf.test.ts:33` `THRESHOLD_MS = IS_CI_WIN ? 100 : 50` → `IS_CI_WIN ? 100 : 75`；A6 acceptance bar 数值更新 < 50ms → < 75ms
- **数据驱动**: 详 `.planning/phase-1.3/PERF-ATTRIBUTION.md` § 3.3 root cause 判定（schema cost necessary + CI runner GC noise sufficient 双因素）+ § 4.4 phase 1.4+ 不需 schema validation 优化结论
- **status**: ✅ HOTFIX SHIPPED + CI re-run verify

### F39 — Sister review (3 H + 2 M) patch round — phase 1.3.1 cleanup batch

- **触发**: phase 1.3 batch 2 (Wave 2) ship 后另一 cc 做 paranoid sister review，输出 5 finding (3 H + 2 M)
- **决议路径 AA — 全 accept (跟 phase 1.2.5 12-patch standard 一样)**:
  - **applied** (commits `df54d3c` + `0d3ec97`): H1b (perf attribution task → T7.3 + PERF-ATTRIBUTION.md) / H2 (README v3 wedge sync → T8.1 Part B) / H3a (工期 3-5 → 5-7 工作日) / H3c (Wave 4 timeout escape) / M1 (decision_rules.yaml `.planning/` → `routing/`)
  - **deferred**: H1a (ADR 0007 Consequences 节加 perf cost 透明化 → phase 1.4 ADR 0008 errata；A7 守恒禁止 main body modification；PERF-ATTRIBUTION.md 已承担过渡 transparency 角色) / M2 (ADR 0006 self-contained snapshot SSOT drift defense → v0.4 maintainer onboarding)
  - **rejected**: H3d (T6.1 拆分为 T6.1a/b — main agent 倾向 karpathy surgical 单 task 合理保留原子)
- **status**: ✅ APPLIED — sister patch round 6/8 applied + 2 deferred + 1 rejected

---

## § 4 How to Reproduce / How to Audit

```bash
# 0. checkout phase 1.3 milestone tag
git checkout v0.1.0-alpha.3-base-profile

# 1. 全套验证命令 (~3 min)
corepack pnpm install --frozen-lockfile  # ~30s
corepack pnpm typecheck                   # ~5s
corepack pnpm lint                        # ~3s
corepack pnpm test                        # ~30s (235 passed / 1 skipped)
corepack pnpm build                       # ~10s
corepack pnpm validate:schema             # ~2s
corepack pnpm bench                       # ~30s (~22.6ms mean / RME ±2%)

# 2. A7 守恒 paranoid check
for n in 0001 0002 0003 0004 0005 0006 0007; do
  diff_lines=$(git diff "adr-${n}-accepted" -- "docs/adr/${n}-*.md" 2>/dev/null | wc -l)
  echo "ADR $n diff lines: $diff_lines"
done
# 全部 = 0 → A7 守恒 hold ✅

# 3. install-base 子命令 dry-run
node ./dist/cli.mjs install-base --dry-run
# 期望：installed: N / skipped: M / failed: 0

# 4. CI 状态 (远程)
gh run list --limit 1 --json conclusion,headSha,databaseId
# 期望：success @ 7c9b66f (run 25790126213) 或更新 commit
```

---

## § 5 References

- **PLAN.md** (`.planning/phase-1.3/PLAN.md`) — phase 1.3 范围 + 7 wave + B1-B8 acceptance bar 定义
- **task_plan.md** (`.planning/phase-1.3/task_plan.md`) — 22 atomic 子任务 + 依赖图
- **progress.md** (`.planning/phase-1.3/progress.md`) — § A 进度日志 + § B F36-F39 finding narratives
- **PERF-ATTRIBUTION.md** (`.planning/phase-1.3/PERF-ATTRIBUTION.md`) — H1b sister patch 落地 / schema 3 字段 perf cost 量化 (177L)
- **ADR 0006** (`docs/adr/0006-architecture-wedge-revision-v3.md`) — phase 1.2.5 architecture wedge revision (8 支柱 100% capture)
- **ADR 0007** (`docs/adr/0007-categorization-schema-extension.md`) — phase 1.3 schema errata (3 字段 + decision_rules 设计)
- **AgentDefinition Factory Contract** (`docs/AGENT-DEFINITION-FACTORY-CONTRACT.md`) — phase 1.4 routing engine prereq draft (12 字段)
- **decision_rules.yaml** (`routing/decision_rules.yaml`) — v1 schema (12 rules / Priority Hit Policy / fallback_supervisor)
- **Phase 1.2 VERIFICATION** (`.planning/phase-1.2/VERIFICATION.md`) — 上游 phase 复现指南 (B1'-B9')
- **STATE.md** (`.planning/STATE.md`) — 跨 session 项目记忆 SSOT
