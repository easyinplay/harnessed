# Phase 2.3: extension category MVP + karpathy 注入引擎 — Pattern Map

> **Mapped**: 2026-05-16
> **Mapper**: gsd-pattern-mapper (Claude Opus 4.7, 1M ctx)
> **Files analyzed**: 14 NEW / MODIFIED targets (per KICKOFF § 4 R1 + D-01~D-08)
> **Analogs found**: 12 / 14 (~86%; 2 targets fresh-research, see § 3 D-WP-*)
> **Anti-stall**: 12 tool uses pre-Write (1× Read batch ×3 + 1× Read batch ×4 + 1× Glob batch ×5 + 1× Read batch ×7 + 1× Grep batch ×2)
> **Style**: 沿袭 phase 2.2 PATTERNS.md(§ 1 table + § 2 concrete excerpts + § 3 D-WP-* + § 4 reuse summary + § 5 path dependency)

---

## § 1 NEW / MODIFIED Targets → Existing Analog Mapping

| # | New / Modified Target | Role | Data Flow | Closest Analog | Reuse % | Copy vs Adapt |
|---|----------------------|------|-----------|----------------|---------|---------------|
| 1 | `manifests/skill-packs/frontend-design.yaml` (NEW, D-01 design) | manifest (declarative skill-pack entry) | declarative (yaml → schema validate → installer dispatch) | `manifests/skill-packs/ui-ux-pro-max.yaml` (55L, Phase 2.1 git-clone-with-setup ship) | **~85%** | **COPY** frontmatter + `metadata.upstream` + `spec.{type,component_type,category,install_type,install,verify,uninstall}` 12 字段 + `decision_rules` 内联 hint;**ADAPT** upstream source / repo URL / install cmd / category=design / `decision_rules.override_signals` "做出风格" → frontend-design(D-08, 与现 `ui-ux-pro-max.yaml` L48-54 互为 mirror) |
| 2 | `manifests/skill-packs/anthropics-skills-pptx.yaml` (NEW, D-01 content) | manifest | declarative | `manifests/skill-packs/karpathy-skills.yaml` (40L, npx-skill-installer install_type=skill) | **~80%** | **COPY** `install_type: skill` + `method: npx-skill-installer` + `cmd: "npx --yes skills@1.5.7 add <ref> --copy --global"`(D2.1-5 必含 --copy --global flag,见 `npxSkillInstaller.ts` L92+L111);**ADAPT** ref=`anthropics/skills` 子目录 pptx, verify cmd 改 `test -f ~/.claude/skills/pptx/SKILL.md`(D2.1-6 real-path verify) |
| 3 | `manifests/skill-packs/anthropics-skills-slide-deck.yaml` (NEW, D-01 content) | manifest | declarative | 同上 + Phase 1.5 SAMPLES.md S08 `jimliu-baoyu-skills-baoyu-slide-deck` 既存映射 | **~80%** | 同 row 2 pattern;ref=`anthropics/skills` 子目录 slide-deck;**planner 决** 走 npx-skill-installer vs git-clone-with-setup(D-01 hint 已留两条路) |
| 4 | `manifests/tools/playwright-test.yaml` (NEW, D-01 testing) | manifest | declarative | `manifests/skill-packs/karpathy-skills.yaml`(npx)OR `manifests/tools/tavily-mcp.yaml`(若 install_type=mcp-stdio-add) | **~75%** | **COPY** npx-skill-installer 模板(同 row 2 framing);**ADAPT** 若 playwright-test 是纯 npm CLI 而非 skill,改 install_type=npm + method=npm-cli(参 `src/installers/npmCli.ts`);planner 实占 |
| 5 | `manifests/tools/chrome-devtools-mcp.yaml` (NEW, D-01 testing) | manifest | declarative | `manifests/tools/tavily-mcp.yaml` / `exa-mcp.yaml`(mcp-http-add OR mcp-stdio-add) | **~85%** | **COPY** install_type=mcp + method=mcp-http-add(Phase 2.1 ship 装配链路),`spec.install.cmd: "claude mcp add chrome-devtools-mcp --transport http <url>"`;**ADAPT** upstream URL + `decision_rules.trigger` "performance / a11y / memory-leak / LCP / Core Web Vitals"(沿袭 `decision_rules.yaml` L79-95 `perf-a11y-memory` rule forbidden_experts 模式) |
| 6 | `routing/decision_rules.yaml` — design/content/testing 三 category 段 MIN rule 集 + CD-3 字段 (MODIFIED, D-03 + D-04 + D-08) | config / schema | declarative | 现 `decision_rules.yaml` v2 — `rules:` 数组下已有 design(2)/content(2)/testing(4)/search(2)/meta(2)/engineering(5) 17 rule,模式成熟 | **~90%** | **COPY** entry shape — `id:` `priority:` `domain:` `when:{task_type,override_keywords?,signals?}` `decision:{primary_expert,secondary_expert?,conflict_policy?,rationale,forbidden_experts?}`;**ADAPT** 加 CD-3 optional fields `do_not_use_when: [<regex|task_type>]` + `if_rejected_use: <component-id>`(每 category 1-2 anchor + 1 negative-space + 1 redirect);**A7 守恒** — `version: 2` 不动(不 bump v3,additive D1.5-10) |
| 7 | `src/manifest/schema/spec.ts` — CD-3 optional fields TypeBox schema 加 (MODIFIED, D-04) | schema | declarative (TypeBox spec) | 现 `RuleSchema` in `src/routing/decisionRules.ts` L40-46(`when` / `decision` 已 `T.Record(T.String(), T.Unknown())` 开放 record,**已可承载 CD-3 字段无需 schema bump**)+ `spec.ts` L161-180 category/install_type enum 模式 | **~70%** | **NO schema change required**(`when`/`decision` 已 open record);**ADAPT** 仅在 `decisionRules.ts` 加 narrowing types `DoNotUseWhen = T.Optional(T.Array(T.String()))` + `IfRejectedUse = T.Optional(Str1)` if planner 决要 explicit field 校验;否则现 open record 接住 — Karpathy YAGNI 推荐 do nothing(planner 决,proposal § 3 D-WP-1) |
| 8 | `src/routing/decisionRules.ts` — `arbitrate()` 升级 do_not_use_when + if_rejected_use (MODIFIED, D-04) | service / pure fn | transform (Rule[] × TaskContext → Rule \| RedirectResult) | 现 `arbitrate()` L126-132(6L body,filter+sort+top返回)+ `matchesWhen()` L156-176(v1 scalar + v2 F42 array semantic match) | **~50%** | **COPY** filter+sort 主流程不动;**ADAPT** 加 ~15L:`top` 命中后 evaluate `top.decision.do_not_use_when`(同款 F42 array semantic substring match against task),若命中 → 返 `{ rejected: true, redirectTo: top.decision.if_rejected_use }`(planner 决调用方 engine.route 单层 redirect 重跑 OR 直接以 redirectTo 作 primary_expert) — 防 cycle 策略 planner 实占 |
| 9 | `~/.claude/skills/karpathy-baseline/SKILL.md` (NEW user-level skill, D-02 SKILL-ONLY) | composition skill | declarative (Claude Code skill registry) | 现 ui-ux-pro-max skill `~/.claude/skills/ui-ux-pro-max/SKILL.md`(Phase 2.1 ship,git-clone-with-setup 装) + `manifests/skill-packs/ui-ux-pro-max.yaml` L25 idempotent_check `test -f ~/.claude/skills/ui-ux-pro-max/SKILL.md` | **~40%** | **ADAPT-mostly** — skill 形态(单 SKILL.md vs 目录+rules/*.md split)由 **Wave A R2-2 research 决**(proposal § 3 D-WP-2);always-on toggle 通过 frontmatter `always: true`(规范待 R2-2 确认);内容 = Karpathy 心法 6 条(Think Before Coding / Simplicity First / Surgical Changes / 小步原子修改 / Goal-Driven / 最小有效代码)精炼版,无 in-repo 文本 analog,从用户 CLAUDE.md karpathy 段落抽取 |
| 10 | `manifests/skill-packs/karpathy-skills.yaml` — D-02 SKILL-ONLY rework (MODIFIED) | manifest | declarative | 现 `karpathy-skills.yaml` 40L,**install cmd 现走 `npx skills@latest add forrestchang/andrej-karpathy-skills` + verify `grep -q 'Think Before Coding' ~/.claude/CLAUDE.md` + uninstall `sed -i '...CLAUDE.md 标记块...'`** — **该 manifest 现违反 D-02 SKILL-ONLY**(动用户 CLAUDE.md) | **~50%** | **ADAPT-critical** — 改 install method 走 git-clone-with-setup OR git-clone-with-setup-equivalent(纯 cp 到 `~/.claude/skills/karpathy-baseline/`)+ verify 改 `test -f ~/.claude/skills/karpathy-baseline/SKILL.md` + uninstall 改 `rm -rf ~/.claude/skills/karpathy-baseline/`(沿袭 `ui-ux-pro-max.yaml` L25+L31+L32 uninstall pattern);D-02 lock — **不再动 CLAUDE.md**(低风险 ROADMAP L121 冲突一键关闭);版本 pin `skills@1.5.7`(D2.1-5)若选 npx 路;planner 选 npx vs git-clone(D-02 hint 已留两条路) |
| 11 | `src/cli/manifest-add.ts` (NEW, D-03 EE-5 5-question CLI gate) | CLI controller | request-response (commander → interactive 5-prompt → manifest stub) | `src/cli/research.ts` 93L(10th register fn,phase 1.4 T5.1)+ `src/cli/install.ts`(L1 confirmAt pattern)+ `src/installers/lib/confirm.ts`(L2 等级互动模板) | **~70%** | **COPY** register fn signature + `RawOpts` interface + `--apply` × `--dry-run` × `--non-interactive` H1 gate(research.ts L37-43)+ exit code map(0/1/2,research.ts L11-14 注释);**ADAPT** 新 5-question prompt(intel L86 原型,planner 实占 exact wording):①真 reusable surface ②fit shape ③overlap ④import 概念 vs 身份 ⑤user 理解;`--non-interactive` 跳 dry-run-only(D-03 锁:不绕过 hard reject);commander.js 互动用 `readline/promises` 内建(避免 inquirer.js 新依赖,Karpathy YAGNI) |
| 12 | `.planning/phase-X.Y/KICKOFF.md` 模板加 EE-5 5 题 + gsd-plan-checker BLOCKER 规则 (MODIFIED, D-03) | plan-phase template | declarative (markdown convention + checker schema) | 现 phase 1.4 / 1.5 / 2.1 / 2.2 / 2.3 KICKOFF.md 一致结构(§ 1 Goal & Scope / § 2 Wave 拓扑 / § 3 Hard Constraints / § 4 Wave A 研究分工 / § 5 预算 / § 6 phase 边界)+ gsd-plan-checker BLOCKER/WARNING/SUGGESTION 三档(参 phase 2.2 PLAN-CHECK.md verdict 模式) | **~80%** | **COPY** 现 KICKOFF 模板节结构;**ADAPT** 加新节 `## § 7 EE-5 manifest-add gate(if any new upstream adapter)` — 5 题 + 必答字段;gsd-plan-checker BLOCKER 规则 = "若 KICKOFF.md 列出新 upstream adapter 且 § 7 任一题未答 → BLOCKER"(沿袭 phase 2.2 plan-checker verdict 严苛度) |
| 13 | `.planning/phase-2.3/SAMPLES.md` (NEW, D-05 FRESH-30 + D-08 anchor) | test fixture | declarative (truth table 30 row) | `.planning/phase-2.2/SAMPLES.md` (R3 frozen, 30 sample,§ 1.1 三约束 + § 1.4 cherry-pick 防御 + § 2 truth table)+ `.planning/phase-1.4/SAMPLES.md`(R3 frozen 原版) | **~75%** | **COPY** § 1.1 三约束 + § 1.2 分布表 + § 1.4 cherry-pick 防御 + § 2 truth table 列 schema(# / task_type / expected_route / primary_expert / acceptance_signal);**ADAPT** 30 sample 全 FRESH(D-05 不复用 phase 1.4 / 2.2 — Phase 2.3 是 category-specific routing 命中,测试维度不同);分布 10 design + 10 content + 10 testing;每 category 含 anchor / non-anchor / cross-category edge / **CD-3 negative-space disqualify edge 至少各 1**;design 段必含 ≥1 "做出风格" anchor case(D-08 frontend-design 主导,验 phase 2.2 SAMPLES.md L58 `S06 ui-task-bold-style-override → frontend-design` 既存映射在 Phase 2.3 重置 frozen 后仍命中) |
| 14 | Wave 0 CI gate 6 step in `.github/workflows/ci.yml` (MODIFIED, D-07 ALL-W0) | CI gate | batch (per-step bash / pwsh / node script) | 现 `.github/workflows/ci.yml` 已有 transparency gate L83-84 + provenance gate L90-91 + A7 守恒 L53-78 + installer integration L113-164,3-OS matrix 成熟 | **~85%** | **COPY** step shape — `- name: <human-readable> ... \n  run: <one-line>`;**ADAPT** 6 step 加入:(M1) `corepack pnpm build:schema && git diff --exit-code schemas/`(RETROSPECTIVE Lesson 6 落地, ~10L);(M2) 非 CI step — `intel/omc-comparison.md` markdown 文档回填 L236-238 加 `## 实施进度回填` 节(纯文档,无 CI);(M3) **R2-1 fresh research 决** perf gate 3-tier 根治策略(候选 a/b/c,planner 实占,proposal § 3 D-WP-3);(T1.2) `grep -r "branchOnSchemaVersion(" src/ \| wc -l` ≥ 7 gate;(T1.3) Win-only pwsh sentinel `pwsh -c "node scripts/check-provenance.mjs"`(沿袭 ci.yml L90-91 现 cross-OS 同步,但加 pwsh shell override 验 Win path-sep);(T5) RETROSPECTIVE 模板加 `## Deferred items review` 节(纯文档约定,无 CI script,**或 add micro `scripts/check-deferred-items.mjs` 沿袭 check-transparency-verdicts.mjs walker 套壳**) |

---

## § 2 Per-target Concrete Code Excerpts

### 2.1 `manifests/skill-packs/frontend-design.yaml` — analog: `ui-ux-pro-max.yaml` L1-55

**COPY frontmatter + structure** (`ui-ux-pro-max.yaml` L1-55,12-field shape):

```yaml
# yaml-language-server: $schema=../../schemas/manifest.v1.schema.json
apiVersion: harnessed/v1
kind: Manifest
metadata:
  name: frontend-design                                     # ← ADAPT
  display_name: frontend-design (<upstream>)                # ← ADAPT planner 实占
  description: Style-led frontend design skill (layout / 动效 / 装饰细节, D-08 "做出风格" anchor 时主导).
  upstream:
    source: <upstream>                                      # ← ADAPT (D-01 cc-plugin-marketplace vs git-clone-with-setup, planner 决)
    homepage: <url>
    repository: <url>
    license: <license>
    notice: |
      frontend-design — D-08 "做出风格" override anchor 主导;default 下补 ui-ux-pro-max 剩余维度.
spec:
  type: cc-skill-pack
  component_type: command
  category: design                                          # ← KEY (D-01 category MIN scope)
  install_type: <git|skill>                                 # ← ADAPT planner 决
  install:
    method: <git-clone-with-setup|cc-plugin-marketplace>
    cmd: "<verbatim, MUST include --copy --global if npx>"
    git_ref: <SHA>                                          # ← if git-clone
    idempotent_check: "test -f ~/.claude/skills/frontend-design/SKILL.md"
  verify:
    cmd: "test -f ~/.claude/skills/frontend-design/SKILL.md"
    timeout_ms: 5000
    expected_exit_code: 0
  uninstall:
    cmd: "rm -rf ~/.claude/skills/frontend-design"
    cleanup_paths:
      - ~/.claude/skills/frontend-design
  upstream_health: { stability: beta, last_check: "2026-05-16", last_known_good_version: <ref>, fallback_action: warn }
  signed_by: easyinplay
  platforms: [linux, darwin, win32]
  decision_rules:                                           # ← 内联 hint, 与 routing/decision_rules.yaml SSOT 不冲突 (manifest hint per-adapter, ADR 0007)
    trigger: "user 请求 style-led / 独特创意 / 做出风格"
    default_expert: frontend-design                         # ← D-08 anchor 时主导
    override_signals:
      - phrase: "做出风格"
        use: frontend-design
```

### 2.2 `manifests/tools/chrome-devtools-mcp.yaml` — analog: `tavily-mcp.yaml`(mcp-http-add) + 现 `perf-a11y-memory` rule(decision_rules.yaml L79-95)

**COPY mcp-http-add install_type + forbidden_experts cross-link**(decision_rules.yaml L79-95 现 pattern):

```yaml
spec:
  type: cc-skill-pack
  component_type: mcp-server
  category: testing                                         # ← D-01 testing
  install_type: mcp
  install:
    method: mcp-http-add                                    # ← 沿袭 Phase 2.1 6 install method dispatch
    cmd: "claude mcp add chrome-devtools-mcp --transport http <upstream-url>"
    idempotent_check: "claude mcp list | grep -q chrome-devtools-mcp"
  decision_rules:
    trigger: "perf / a11y / memory-leak / Core Web Vitals / LCP"
    default_expert: chrome-devtools-mcp
    # 现 decision_rules.yaml L79-95 已有 perf-a11y-memory rule + forbidden_experts: [playwright-cli, playwright-test, webapp-testing] —
    # manifest 此处仅 hint, routing SSOT 仍是 decision_rules.yaml (ADR 0007 errata 已 lock).
```

### 2.3 `routing/decision_rules.yaml` — design/content/testing 三 category 段 + CD-3 字段 — analog: 现 L29-126 三段已存(17 rule)

**ADAPT 加 CD-3 optional fields**(现 design 段 L28-56 是 2 rule MIN scope 已 ready,只需补 CD-3):

```yaml
# === design (2 rules + CD-3 + 1 anchor) — Phase 2.3 ADAPT ===
  - id: ui-task-bold-style-override                         # ← 现存 L29-46, 不动 (A7 守恒 + Phase 2.2 S06 既存映射 frozen)
    priority: 100
    domain: design
    when:
      task_type: ui-design
      override_keywords: [做出风格, design-led, experimental, 独特, creative, distinctive]
    decision:
      primary_expert: frontend-design
      secondary_expert: ui-ux-pro-max
      conflict_policy: primary_wins
      rationale: 用户明示 style-driven, 由 frontend-design 主导剩余维度

  - id: ui-task-default                                     # ← 现存 L47-56, 加 CD-3 字段 (ADAPT)
    priority: 50
    domain: design
    when:
      task_type: ui-design
    decision:
      primary_expert: ui-ux-pro-max
      secondary_expert: frontend-design
      conflict_policy: primary_wins
      rationale: 数据驱动 + 标准化 + 可解释 优先
      # ↓ Phase 2.3 D-04 CD-3 negative-space + redirect — NEW optional fields
      do_not_use_when:
        - 做出风格
        - 独特
        - 独创
      if_rejected_use: frontend-design                      # ← D-08 锁 redirect target

# === content / testing 段同款补 CD-3 (anthropics-skills-pptx do_not_use_when "通用 markdown 文档" → if_rejected_use: docs-default-mcp 等)
```

### 2.4 `src/routing/decisionRules.ts` `arbitrate()` 升级 — analog: 现 L126-132 (6L body)

**当前 6L 主体**(decisionRules.ts L126-132):

```typescript
export function arbitrate(rules: Rule[], task: TaskContext): Rule | null {
  const matches = rules.filter((r) => matchesWhen(r.when, task))
  const [top, second] = [...matches].sort((a, b) => b.priority - a.priority)
  if (!top) return null
  if (second && second.priority === top.priority) return null
  return top
}
```

**Phase 2.3 ADAPT — D-04 CD-3 consume**(加 ~15L,~+2 inline helper 引 F42 substring 复用):

```typescript
export type ArbitrateResult =
  | { kind: 'matched'; rule: Rule }
  | { kind: 'rejected'; redirectTo: string }
  | { kind: 'none' }

export function arbitrate(rules: Rule[], task: TaskContext): ArbitrateResult {
  const matches = rules.filter((r) => matchesWhen(r.when, task))
  const [top, second] = [...matches].sort((a, b) => b.priority - a.priority)
  if (!top) return { kind: 'none' }
  if (second && second.priority === top.priority) return { kind: 'none' }
  // Phase 2.3 D-04 CD-3 — negative-space disqualify + if_rejected_use redirect
  const dec = top.decision as { do_not_use_when?: string[]; if_rejected_use?: string }
  if (Array.isArray(dec.do_not_use_when) && dec.do_not_use_when.some((k) => taskHas(task, k))) {
    return dec.if_rejected_use
      ? { kind: 'rejected', redirectTo: dec.if_rejected_use }
      : { kind: 'none' }
  }
  return { kind: 'matched', rule: top }
}
```

**调用方 (engine.route) 适配** — 三 kind 分支,`rejected` 路径 planner 决:
- (a) 单层 redirect 重跑 arbitrate(filter by `id === redirectTo`)
- (b) 直接以 redirectTo 作 primary_expert,跳过二次 arbitrate
- (c) 抛 `RedirectError` 给上层 CLI 显式提示
推荐 (b) — Karpathy 最简,防 cycle 默认安全。

**A7 守恒** — `ArbitrateResult` 是新出参 union,**会破现有调用方接口**(`arbitrate(...) === null` check 失效)。**两条路**:
- (i) 保留旧 signature 作 `arbitrateLegacy()`(returns Rule | null,内部 wrap 新 fn,rejected → null fallback)— **推荐**,A7 守恒 + 既存测试 byte-stable
- (ii) 全调用方升级 — 工作量大且触发 contract drift ADR errata

### 2.5 `~/.claude/skills/karpathy-baseline/SKILL.md` — analog: ui-ux-pro-max skill 目录形态

**Wave A R2-2 fresh research 待决**(proposal § 3 D-WP-2),候选两形态:

**形态 (a) 单文件 `~/.claude/skills/karpathy-baseline.md`**:

```markdown
---
name: karpathy-baseline
description: Andrej Karpathy 心法 (Think Before Coding / Simplicity / Surgical) — always-on baseline.
always: true                                                # ← Claude Code skill registry 待 R2-2 验证
---

# Karpathy Baseline (心法 always-on)

## Think Before Coding
[精炼 1 段]

## Simplicity First
[精炼 1 段]

## Surgical Changes
[精炼 1 段]

## 小步原子修改 / Goal-Driven / 最小有效代码
[各 1 段]
```

**形态 (b) 目录 + rules/*.md split**:

```
~/.claude/skills/karpathy-baseline/
  SKILL.md                              # 入口 + frontmatter always: true + 索引
  rules/
    01-think-before-coding.md
    02-simplicity-first.md
    03-surgical-changes.md
    04-small-atomic.md
    05-goal-driven.md
    06-minimum-effective.md
```

**Wave A R2-2 决** — Claude Code skill registry 是否支持 frontmatter `always: true` always-on toggle(若否,形态 (b) 目录 + 在 SKILL.md 入口 trigger 段写 "本 skill 加载即激活"). 推 R2-2 调研后 planner 实占。

### 2.6 `src/cli/manifest-add.ts` — analog: `src/cli/research.ts` L27-92

**COPY scaffold**(research.ts L19-92 → manifest-add.ts 类比骨架):

```typescript
import type { Command } from 'commander'
import * as readline from 'node:readline/promises'
import { stdin, stdout } from 'node:process'

interface RawOpts {
  upstream?: string
  apply?: boolean
  dryRun?: boolean
  nonInteractive?: boolean
}

const QUESTIONS = [
  '① 这是真 reusable surface 还是临时 wrapper?',
  '② 上游名字 fit 项目 shape 吗? 有现有命名冲突吗?',
  '③ 与已装配组件有 overlap surface 吗?',
  '④ 是 import 概念 (可控) 还是 import 别人产品身份 (高耦合)?',
  '⑤ user 不知 upstream 还能理解该装配吗?',
] as const

export function registerManifestAdd(program: Command): void {
  program
    .command('manifest add <upstream>')
    .description('Add a new upstream adapter (EE-5 5-question gate)')
    .option('--apply', 'persist to manifests/ (default: dry-run preview)')
    .option('--dry-run', 'force dry-run')
    .option('--non-interactive', 'CI/scripts — requires --apply or --dry-run; skips prompts in dry-run-only mode (D-03 锁 不绕 plan-phase hard reject)')
    .action(async (upstream: string, raw: RawOpts) => {
      // H1 gate (research.ts L37-43 verbatim copy)
      if (raw.nonInteractive && !raw.apply && !raw.dryRun) { /* exit 2 */ }
      if (raw.nonInteractive) {
        // D-03 dry-run-only — skip 5-question prompt, emit warn-only summary
        console.warn('[ee-5-gate] WARN: --non-interactive skips 5-question prompt (D-03 dry-run-only path). plan-phase template hard reject still applies.')
        // ... arbitrate-only preview, exit 0
        return
      }
      const rl = readline.createInterface({ input: stdin, output: stdout })
      const answers: string[] = []
      for (const q of QUESTIONS) {
        const a = (await rl.question(`${q}\n> `)).trim()
        if (!a) { console.error('error: EE-5 gate requires non-empty answer'); rl.close(); process.exit(1) }
        answers.push(a)
      }
      rl.close()
      // Apply path — write manifest stub + log answers to provenance (D-03 audit trail)
      // ...
    })
}
```

### 2.7 `scripts/check-deferred-items.mjs` (optional, T5) — analog: `check-transparency-verdicts.mjs` L9-32 walker

**COPY walker shape**(check-transparency-verdicts.mjs L25-32):

```javascript
#!/usr/bin/env node
// Phase 2.3 Wave 0 T5 — deferred-items review cadence gate (RETROSPECTIVE template).
// 沿袭 check-transparency-verdicts.mjs walker pattern.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const ENFORCE = false                                       // warn-only round 1 (沿袭 transparency W3 模式)
const ROOT = '.planning'

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (/deferred-items\.md$|DEFERRED.*\.md$/.test(name)) out.push(p)
  }
  return out
}

const stale = []
for (const file of walk(ROOT)) {
  const txt = readFileSync(file, 'utf8')
  // RETROSPECTIVE 模板节: ## Deferred items review (每 ship phase 强制 review)
  if (!/##\s+Deferred\s+items?\s+review/i.test(txt)) {
    stale.push(`${file}: missing "## Deferred items review" section`)
  }
}
if (stale.length > 0) { /* warn / exit */ }
```

### 2.8 Wave 0 CI step shape — analog: `.github/workflows/ci.yml` L83-91 transparency + provenance gate

**COPY 单 step shape** + ADAPT 6 step(M1/T1.2/T1.3 — CI;M2/M3/T5 — markdown/research/optional script):

```yaml
# Phase 2.3 Wave 0 M1 — schema regen CI gate (RETROSPECTIVE Lesson 6 落地, ~10L)
- name: Schema regen gate (Phase 2.3 Wave 0 M1)
  run: |
    corepack pnpm build:schema
    git diff --exit-code schemas/ || {
      echo "::error::schemas/ drift detected — run 'corepack pnpm build:schema' locally and commit"
      exit 1
    }

# Phase 2.3 Wave 0 T1.2 — schemaVersion consumer call-site gate (7-surface ≥ 1 ENFORCE)
- name: schemaVersion consumer gate (Phase 2.3 Wave 0 T1.2)
  run: |
    count=$(grep -r "branchOnSchemaVersion(" src/ | wc -l | tr -d ' ')
    if [ "$count" -lt 7 ]; then
      echo "::error::expected ≥ 7 branchOnSchemaVersion call sites, found $count"
      exit 1
    fi

# Phase 2.3 Wave 0 T1.3 — Win pwsh provenance sentinel (Win path-sep 行为验)
- name: Provenance gate (Win pwsh sentinel)
  if: runner.os == 'Windows'
  shell: pwsh
  run: pwsh -c "node scripts/check-provenance.mjs"
```

---

## § 3 D-WP-* Decision Proposals for the Planner

**These are PROPOSALS, not LOCKS** — Wave B planner 决,Wave C plan-checker 审。**Honor SSOT 引用纪律 — phase 编号语义锚定, ADR 编号不预占**。

### D-WP-1: CD-3 字段 TypeBox schema 是否 explicit 还是 open record

- **(a) Explicit narrowing** — `decisionRules.ts` 加 `DoNotUseWhen = T.Optional(T.Array(Str1))` + `IfRejectedUse = T.Optional(Str1)` 在 `RuleSchema.decision` 中(目前 L40-46 是 `T.Record(T.String(), T.Unknown())` 完全 open)
- **(b) Open record(do nothing)** — 现 schema 已能 validate 任意 decision 子字段,arbitrate() 直接 read 字段;Karpathy YAGNI
- **(c) Hybrid** — 加 JSDoc 注释说明 D-04 字段语义,但不引 schema enforce
- **推荐**: **(b)** — `decision` open record 已成熟(F42 array semantic match 在 L156-176 实现),无需 schema bump;arbitrate() consume narrowly typed cast 充分
- Decision driver: Karpathy "do nothing if existing schema already accepts new field" + A7 守恒(`decision_rules.v1.schema.json` 不重 regen 即不打破 schema gate)

### D-WP-2: karpathy-baseline.md skill 形态 (Wave A R2-2 fresh research 必决)

- **(a) 单文件 `~/.claude/skills/karpathy-baseline.md`** — frontmatter `always: true` toggle(R2-2 验 Claude Code skill registry 是否支持)
- **(b) 目录 `~/.claude/skills/karpathy-baseline/SKILL.md + rules/*.md`** — 沿袭现 `ui-ux-pro-max/` skill 目录形态(确定可工作)
- **(c) Single SKILL.md (无 rules/ split)** — 目录但只一个文件
- **推荐**: **依赖 R2-2 research** — 若 always-on toggle 通过 frontmatter 行得通,**(a)** Karpathy 最简;否则 **(b)** 沿袭已实证形态
- Decision driver: Claude Code skill always-on activation mechanism 真实支持度(R2-2 给推荐)

### D-WP-3: M3 perf gate 根治策略 (Wave A R2-1 fresh research 必决)

- **(a) 移 CI critical path** — perf 只 nightly cron 跑,PR 不阻塞;false-positive=0 PR / false-negative=N nightly catch
- **(b) OS-dependent threshold + IQR tolerance** — retain critical path 但容忍 cloud-VM-class degrade(Win runner LCP > Linux+15% 容忍)
- **(c) Nightly cron 拆分** — PR 跑轻 smoke(<5sample), nightly 跑 full(100+ sample)
- **推荐**: **依赖 R2-1 research** — 各候选 false-positive / 维护成本 / 3-OS 一致性评估后决;**初步倾向 (c) hybrid** — PR 不阻塞但保留信号
- Decision driver: STATE.md L545+ Phase 2.3 Prereq Notes M3 backlog 三候选已列;R2-1 给数据驱动推荐

### D-WP-4: arbitrate() rejected path 调用方语义

- **(a) 单层 redirect 重跑** — engine.route 接 redirectTo,filter rules by `id === redirectTo` 再 arbitrate(防 cycle:max 1 redirect)
- **(b) 直接以 redirectTo 作 primary_expert** — 跳过二次 arbitrate(最简,无 cycle 风险)
- **(c) 抛 RedirectError 给 CLI** — 显式提示用户切 expert
- **推荐**: **(b)** — Karpathy 最简 / 防 cycle 天然 / 与现 `ArbitrateResult` 三 kind union 自然嵌合
- Decision driver: Karpathy YAGNI + cycle-safe-by-default

### D-WP-5: arbitrate() signature 升级 vs legacy wrap (A7 守恒)

- **(a) 直接升级 signature 返 `ArbitrateResult`** — 全调用方升级,触发 contract drift ADR errata
- **(b) 保留 `arbitrate()` legacy(returns Rule | null)+ 新加 `arbitrateWithRedirect()` 返 ArbitrateResult** — engine.route 用新 fn, 测试 byte-stable
- **(c) 升级 signature + legacy wrap fn `arbitrateLegacy()`** 给旧调用方
- **推荐**: **(b)** — 既存 phase 1.4-2.2 路由 routing-engine.test.ts 30 sample byte-stable + A7 守恒 + 新 fn 命名清晰
- Decision driver: A7 + Karpathy backward-compat-by-default + 减 ADR errata 数

### D-WP-6: T5 deferred-items review 是 markdown 模板 only 还是 CI script

- **(a) 纯 markdown 模板** — RETROSPECTIVE.md 加 `## Deferred items review` 节, 每 ship phase 强制 review(无 CI enforce)
- **(b) Markdown 模板 + warn-only CI script** — `scripts/check-deferred-items.mjs` 沿袭 check-transparency-verdicts.mjs walker(§ 2.7),warn-only round 1
- **(c) Markdown 模板 + ENFORCE script**(round 2)
- **推荐**: **(b)** — Karpathy 心法 "process > script" 但沿袭 phase 2.1 transparency W3 warn-only round 1 + W4 ENFORCE 阶梯;round 1 warn 收集真实 false-positive 再决是否 ENFORCE

### D-WP-7: 30 SAMPLES.md 是否在 Wave B frozen 还是 Wave 4 R3 frozen

- **(a) Wave B planner 编写 + Wave C plan-checker 审 + 进 execute-phase frozen**
- **(b) Wave B planner 选 5-10 canary sample, Wave 4 execute-phase R3 frozen 30 全集**
- **推荐**: **(a)** — phase 1.4 / 2.2 SAMPLES.md 均 plan-phase Wave B frozen, execute-phase 不允许改(R3 cherry-pick 防御);Phase 2.3 沿袭
- Decision driver: 沿袭 phase 1.4 SAMPLES.md R3 frozen 模式 + execute-phase 改 sample 触发 ADR errata

### D-WP-8: ADR 编号 plan-phase 何时实占

- **不预占 0012**(KICKOFF § 3.2 hard constraint + intel § 0 SSOT 引用纪律 + CONTRIBUTING.md 项目级)
- 本 PATTERNS.md / RESEARCH.md / ASSUMPTIONS.md / PLAN.md 一律写 "新 ADR(编号 plan-phase 实占)"
- Wave 5/6 ship 时 git mv / new file 决定实际编号 N(可能 0012 / 0013 / 更高,取决于 Phase 2.3 与并行 phase 的实际 ship 顺序)
- baseline tag iterate `adr-NNNN-accepted` 同步 1-11 → 1-N

---

## § 4 Reuse Pct Summary

| Target | Reuse % | New LoC est. | Weighted contribution |
|--------|---------|--------------|----------------------|
| frontend-design.yaml(new manifest) | 85% | ~55 yaml | high — ui-ux-pro-max.yaml 1:1 scaffold |
| anthropics-skills-pptx.yaml(new) | 80% | ~40 yaml | high — npx-skill-installer pattern mature |
| anthropics-skills-slide-deck.yaml(new) | 80% | ~40 yaml | high — 同上 |
| playwright-test.yaml(new) | 75% | ~40 yaml | high — npx OR npm-cli choice 两条路 |
| chrome-devtools-mcp.yaml(new) | 85% | ~40 yaml | high — mcp-http-add 现成 |
| decision_rules.yaml CD-3 + 三 category MIN rule | 90% | ~30 yaml(三 category 各加 0-2 CD-3 字段) | very high — 17 rule 模式成熟 |
| spec.ts CD-3 schema(maybe) | 70% | ~0-5 ts(D-WP-1 推荐 do nothing) | n/a |
| decisionRules.ts arbitrate() 升级 | 50% | ~15 ts add(+5 legacy wrap) | medium |
| karpathy-baseline SKILL.md(new) | 40% | ~30-60 md(形态 R2-2 决) | medium-low |
| karpathy-skills.yaml D-02 rework | 50% | ~15 yaml modify(改 install/uninstall) | medium |
| manifest-add.ts EE-5 CLI gate(new) | 70% | ~80 ts | high — research.ts 1:1 scaffold |
| KICKOFF.md 模板 + plan-checker BLOCKER | 80% | ~20 md(模板)+ ~5 ts(checker rule) | high |
| .planning/phase-2.3/SAMPLES.md(new) | 75% | ~120 md(30 row × 4 col + § 1 三约束) | high — phase 2.2 SAMPLES.md 模板成熟 |
| ci.yml Wave 0 加固 6 step | 85% | ~40-50 yaml(M1+T1.2+T1.3 + M3 R2-1 决) | high — ci.yml step 模板成熟 |
| **Total weighted reuse** | **~75%** | **~485-540 LoC** | — |

**Phase 2.3 reuse %(75%) > Phase 2.2(62%)** — 主原因:
1. **多数 NEW 目标是 declarative manifest yaml**(5 个 manifest,~85% reuse 各 自 ui-ux-pro-max / tavily-mcp / karpathy-skills 现成模板 1:1 scaffold)
2. **arbitrate() 升级是 surgical ~15L add**(decisionRules.ts 主体不动)
3. **SAMPLES.md / KICKOFF 模板 / CI step** 模板成熟,无新代码模式
4. **唯一新代码模式** = manifest-add.ts EE-5 CLI 互动(70% reuse research.ts 但需新 readline interactive prompt)+ karpathy SKILL.md 形态(40% — 形态待 R2-2 决)

**Truly NEW patterns this phase**(无 prior art):
1. **readline-based 5-question interactive CLI** — Phase 1.4-2.2 CLI 全 commander.js option-only,Phase 2.3 manifest-add.ts 是首次互动 prompt(沿袭 confirmAt 模板但新 readline.question 路径)
2. **`always: true` skill frontmatter activation**(若 R2-2 决形态 a)— Claude Code skill always-on toggle 在本 repo 未见实证,需 R2-2 fresh research 决
3. **CD-3 `do_not_use_when` substring semantic** — 复用 F42 `taskHas()` substring fn 但语义 inverted(命中即 disqualify 而非 hit)
4. **`ArbitrateResult` 三 kind union**(matched / rejected / none) — 现 `arbitrate() returns Rule | null` 单 kind,升级为 discriminated union 是新 contract

---

## § 5 Path Dependency — Wave A 研究必须覆盖

按 KICKOFF § 4 R2 已锁 3 fresh research 项,**本 R1 PATTERNS.md 不重复覆盖** — 仅指出 path dependency:

### 5.1 R2-1 M3 perf gate 根治策略 → Wave 0 step 实占

- **D-WP-3 直接依赖 R2-1** — perf gate 是 PR 阻塞 vs nightly 拆分 vs IQR tolerance 三候选,R2-1 给 3-OS false-positive 数据 + 维护成本评估 → planner 选定后,ci.yml Wave 0 step 实占(M3 影响后续 wave CI 稳定性,**Wave 0 first** in KICKOFF § 2 拓扑)
- **R1 此处无 analog 覆盖** — 现 `manifest-validate.perf.test.ts`(若存在)是最近 analog 但非完美(整 phase scope perf gate 与单 unit perf test 颗粒度不同)

### 5.2 R2-2 karpathy-baseline.md skill 形态 + always-on 配置 → § 2.5 + D-WP-2 实占

- **D-WP-2 直接依赖 R2-2** — skill 形态 (a) 单文件 + always frontmatter vs (b) 目录 + rules/*.md split 由 Claude Code skill registry 真实支持度决
- **R2-2 同步给 harnessed install 适配 path** — 若形态 (a),install adapter 走 npx-skill-installer(skills@1.5.7 + --copy --global D2.1-5 锁);若形态 (b),走 git-clone-with-setup(沿袭 ui-ux-pro-max.yaml install pattern)
- **uninstall 干净度验**(D-02 锁) — provenance 4 字段(source/created_at/confidence/author,见 check-provenance.mjs L37)在 karpathy-baseline 装/卸 全过程合规

### 5.3 R2-3 "做出风格|独特|独创" regex anchor 候选词集 → § 2.3 decision_rules.yaml ui-task-default 段 `do_not_use_when:` 字段实占

- **D-08 lock + § 2.3 placeholder `[做出风格, 独特, 独创]` 待 R2-3 robust 子集校准** — 现 `ui-task-bold-style-override` L34-39 已有 6 anchor `[做出风格, design-led, experimental, 独特, creative, distinctive]`,Phase 2.3 `do_not_use_when:` 字段须**子集 OR 同集** 避免不一致
- **R2-3 给 false-positive 评估** — 候选词集 vs 30 SAMPLES.md(D-05 FRESH)anchor case ≥1 命中率,但 standardized UI 诉求 sample 0 误伤
- **D-WP-7 SAMPLES.md frozen Wave B** — R2-3 候选词集决后,SAMPLES.md anchor case 选定即 frozen,execute-phase 不允许改(R3 cherry-pick 防御沿袭)

### 5.4 R1 + R2 协同:Wave 0 必须最先(KICKOFF § 2 拓扑)

- **Wave 0 必须 first** — M3 perf gate 根治(R2-1)+ M1 schema regen + T1.2 grep gate + T1.3 Win pwsh sentinel + T5 deferred-items 一次性 ship,**否则后续 wave CI 不稳定**(R1 § 2.8 已给 6 step CI shape ready,等 R2-1 决方案后实占)
- **Wave 1 manifest schema 演进**(F2,6-7 adapter manifest) 依赖 Wave 0 schema regen gate(M1)pass
- **Wave 2 decision_rules + karpathy skill** 依赖 Wave 1 manifest 全 ready(`if_rejected_use: frontend-design` 需 frontend-design.yaml 先在 manifest)
- **Wave 4 SAMPLES.md ≥85%** 依赖 Wave 1+2+3 全 ready(adapter 装配 + rule 集 + EE-5 gate 全在位才能跑 30-sample harness)

---

**phase 2.3 PATTERNS.md complete** — 14 target 全 mapping;12/14 (~86%) 有 in-repo analog;~75% weighted reuse(高,因多数 NEW 是 declarative yaml manifest + 现成 CLI/CI step 模板);8 D-WP-* proposal 待 Wave B planner 决(其中 D-WP-2/D-WP-3 强依赖 R2-2/R2-1 fresh research);Wave 0 必先 ship。
