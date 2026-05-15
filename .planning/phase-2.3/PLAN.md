---
phase: 2.3
plan: 1
type: execute
wave: 0
depends_on: []
files_modified:
  - .github/workflows/ci.yml
  - .github/workflows/perf-bench.yml
  - tests/integration/manifest-validate.perf.test.ts
  - scripts/check-deferred-items.mjs
  - .planning/intel/omc-comparison.md
  - .planning/RETROSPECTIVE.md
  - docs/adr/0012-extension-mvp-karpathy-inject.md
  - manifests/skill-packs/frontend-design.yaml
  - manifests/skill-packs/anthropics-skills-pptx.yaml
  - manifests/skill-packs/anthropics-skills-slide-deck.yaml
  - manifests/skill-packs/karpathy-skills.yaml
  - manifests/tools/playwright-test.yaml
  - manifests/tools/chrome-devtools-mcp.yaml
  - skills/karpathy-baseline/SKILL.md
  - routing/decision_rules.yaml
  - src/routing/decisionRules.ts  # W4 plan-check fix: re-export only, 主体不动 ~183L
  - src/routing/lib/arbitrateRedirect.ts  # W4 plan-check fix: proactive split (committed, not fallback) ~25-30L
  - src/cli/manifest-add.ts
  - src/cli.ts
  - tests/routing/arbitrate-redirect.test.ts
  - tests/cli/manifest-add-ee5.test.ts
  - tests/routing/samples-30.test.ts
  - .planning/phase-2.3/SAMPLES.md
  - .planning/STATE.md
autonomous: true
requirements:
  - R6.2
  - R7.1
  - R7.2
must_haves:
  truths:
    - "developer can run `harnessed install frontend-design` and 装得到 ~/.claude/skills/frontend-design/SKILL.md"
    - "developer can run `harnessed install karpathy-skills` and 装得到 ~/.claude/skills/karpathy-baseline/SKILL.md(D-02 SKILL-ONLY,不动 CLAUDE.md)"
    - "developer can run `harnessed manifest add <upstream>` and 走 5-question prompt(EE-5 双层 gate CLI 层)"
    - "decision_rules.yaml CD-3 字段 (do_not_use_when + if_rejected_use) 在 arbitrateWithRedirect 返回 `{ kind: 'rejected', redirectTo }`"
    - "做出风格 anchor 9 keywords(D2.3-4)在 30 SAMPLES.md ≥85% 命中(30 中 ≥26)"
    - "Wave 0 6 项一次根治:M1 schema regen gate + M2 intel 回填 + M3 perf gate 移出 critical path(perf-bench.yml NEW + ci.yml perf step skip)+ T1.2 schemaVersion grep gate + T1.3 Win pwsh sentinel + T5 deferred-items review(warn-only)"
    - "ADR errata 0012 accepted 含 5 章节(extension category MVP + CD-3 + EE-5 + karpathy SKILL-ONLY + Wave 0 perf gate);ADR 0001-0011 main body 0 diff;baseline tag 1-11 → 1-0012"
    - "3-OS CI 全绿(Win Git Bash + macOS + Linux)含 manifest install 链路 e2e + arbitrate redirect 实跑 + Win pwsh provenance sentinel"
  artifacts:
    - path: "docs/adr/0012-extension-mvp-karpathy-inject.md"
      provides: "Phase 2.3 单 ADR errata 5 章节(extension category MVP / CD-3 negative-space / EE-5 双层 gate / karpathy SKILL-ONLY / Wave 0 perf gate 根治)"
      contains: "### 1. extension category MVP, ### 2. CD-3, ### 3. EE-5, ### 4. karpathy SKILL-ONLY, ### 5. Wave 0 perf gate"
    - path: "skills/karpathy-baseline/SKILL.md"
      provides: "Karpathy 4 心法 always-on skill(单文件 SKILL.md + frontmatter `always_active: true`,本仓库 source of truth)"
      contains: "always_active: true"
    - path: "manifests/skill-packs/frontend-design.yaml"
      provides: "frontend-design manifest(D-08 anchor 主导 redirect 目标;git-clone-with-setup 装)"
    - path: "manifests/skill-packs/anthropics-skills-pptx.yaml"
      provides: "anthropics-skills pptx subdir(npx-skill-installer --copy --global skills@1.5.7)"
    - path: "manifests/skill-packs/anthropics-skills-slide-deck.yaml"
      provides: "anthropics-skills slide-deck subdir(npx-skill-installer)"
    - path: "manifests/tools/playwright-test.yaml"
      provides: "playwright-test(npx-skill-installer)"
    - path: "manifests/tools/chrome-devtools-mcp.yaml"
      provides: "chrome-devtools-mcp(mcp-http-add;perf/a11y/memory-leak trigger)"
    - path: "manifests/skill-packs/karpathy-skills.yaml"
      provides: "REWRITE — D-02 SKILL-ONLY 替换 CLAUDE.md sed-injection 为 ~/.claude/skills/karpathy-baseline/ 装/卸"
    - path: "src/routing/decisionRules.ts"
      provides: "arbitrateWithRedirect() NEW + legacy arbitrate() 保留(B-18 A7 守恒)"
      exports: ["arbitrateWithRedirect", "arbitrate (legacy)"]
    - path: "src/cli/manifest-add.ts"
      provides: "EE-5 5-question merge gate CLI(readline 互动 + --apply/--dry-run/--non-interactive H1 gate)"
      exports: ["registerManifestAdd"]
    - path: ".planning/phase-2.3/SAMPLES.md"
      provides: "FRESH-30(10 design + 10 content + 10 testing,含 ≥1 做出风格 anchor + ≥1 false-pos 负样本 + CD-3 disqualify edge ≥3)"
    - path: ".github/workflows/perf-bench.yml"
      provides: "Wave 0 M3 perf gate 移出 CI critical path 新 workflow(cron + advisory only)"
    - path: "scripts/check-deferred-items.mjs"
      provides: "Wave 0 T5 deferred-items review walker(warn-only round 1,沿袭 check-transparency-verdicts.mjs pattern)"
  key_links:
    - from: "src/routing/decisionRules.ts arbitrateWithRedirect"
      to: "routing/decision_rules.yaml do_not_use_when + if_rejected_use 字段"
      via: "evaluate negative-space then return { kind: 'rejected', redirectTo }"
      pattern: "do_not_use_when|if_rejected_use"
    - from: "src/cli/manifest-add.ts"
      to: "readline/promises 内建"
      via: "5-question interactive prompt(EE-5 双层 gate CLI 层)"
      pattern: "readline.*createInterface"
    - from: "manifests/skill-packs/frontend-design.yaml decision_rules hint"
      to: "routing/decision_rules.yaml ui-task-bold-style-override priority 100"
      via: "anchor regex 9 keywords(D2.3-4)— SSOT 单一,manifest hint 是冗余守护(B-17)"
      pattern: "做出风格|design-led|distinctive"
    - from: "tests/routing/samples-30.test.ts"
      to: ".planning/phase-2.3/SAMPLES.md + arbitrateWithRedirect"
      via: "30-sample harness ≥85% 命中(30 中 ≥26)"
      pattern: "expect.*toBeGreaterThanOrEqual.*26"
    - from: "scripts/check-deferred-items.mjs"
      to: ".planning/RETROSPECTIVE.md + .planning/phase-*/deferred-items.md"
      via: "walker pattern + warn-only round 1"
      pattern: "Deferred items review|DEFERRED.*\\.md"
    - from: ".github/workflows/ci.yml"
      to: ".github/workflows/perf-bench.yml + scripts/check-deferred-items.mjs + scripts/check-provenance.mjs"
      via: "M1 schema regen + T1.2 grep gate + T1.3 Win pwsh sentinel + perf step skip(移出 critical path)"
      pattern: "branchOnSchemaVersion|build:schema|runner.os == 'Windows'"
---

<objective>
Phase 2.3 把 v0.2.0 routing engine 升级为 **3 extension category(design/content/testing)MVP 装配 + karpathy behavior-rule 注入引擎 ship + 30 category-specific 样本 routing ≥85% 命中**(含 "做出风格" override anchor)。装配 5 NEW + 2 已装 + 1 REWRITE = 总 6-7 真实 adapter,用 `decision_rules` MIN scope 最小 rule 集 + CD-3 显式职责负空间(`do_not_use_when:` + `if_rejected_use:<id>`)驱动 arbitrate。

**intel 必上两项 absorb**(L92 + L130-135):**EE-5 5-question merge gate 双层**(CLI warn + plan-phase hard reject) + **CD-3 显式职责负空间 + `if_rejected_use:<id>`**。 **karpathy 注入** = `~/.claude/skills/karpathy-baseline/SKILL.md` always-on(D-02 SKILL-ONLY 不动 CLAUDE.md)。

**Wave 0 必办 6 项一次根治**(STATE.md L545+) — M1 schema regen CI gate / M2 intel 实施进度回填 / M3 perf gate 根治(D2.3-1 移出 CI critical path)/ T1.2 schemaVersion consumer grep gate / T1.3 Win pwsh provenance sentinel / T5 deferred-items review cadence(warn-only round 1)。 沿袭 Phase 2.1/2.2 Wave 0 模式。

**Purpose**: R6.2(extension category MVP — 3 真实 category × 真实候选 install adapter 装配链路通)+ R7.1(karpathy behavior-rule 注入 — SKILL-ONLY 路径低风险一键关闭)+ R7.2(routing ≥85% 命中 + 做出风格 anchor)。

**Output**: 7 Wave × ~28 atomic task(F1-F8 acceptance bars 全 ship)+ 单 ADR errata(实占 N,5 章节)+ `v0.2.0-alpha.3-extension-mvp` 候选 tag。

> **R2 critical finding absorbed**: `routing/decision_rules.yaml` v2 **已 ship** design(2)/ content(2)/ testing(4)三 category 段 + 8 rules + `ui-task-bold-style-override` priority 100 anchor production at L29-46。 Phase 2.3 是 **CD-3 字段 ADAPT + 9 keywords 词集校准 + 加 1-2 anchor/negative-space rule**,**非 schema 段 greenfield 新建**。 ADR errata 章节 ① wording 与本 PLAN/task_plan 同步。
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phase-2.3/KICKOFF.md
@.planning/phase-2.3/2.3-CONTEXT.md
@.planning/phase-2.3/2.3-DISCUSSION-LOG.md
@.planning/phase-2.3/PATTERNS.md
@.planning/phase-2.3/RESEARCH.md
@.planning/phase-2.3/ASSUMPTIONS.md
@.planning/intel/omc-comparison.md

# Frozen interface contracts(本 phase 升级或消费)
@src/routing/decisionRules.ts
@src/routing/engine.ts
@routing/decision_rules.yaml
@src/installers/index.ts
@src/cli/research.ts
@manifests/skill-packs/ui-ux-pro-max.yaml
@manifests/skill-packs/karpathy-skills.yaml
@scripts/check-transparency-verdicts.mjs
@scripts/check-provenance.mjs
@.github/workflows/ci.yml
</context>

---

## § 1 Goal & Scope

### 1.1 Goal
3 extension category MVP 装配 + karpathy SKILL-ONLY 注入 + 30 FRESH 样本 routing ≥85% 含 做出风格 anchor + CD-3 negative-space + EE-5 双层 gate + Wave 0 6 项一次根治。

### 1.2 In Scope
F1-F8 acceptance bars(详 ASSUMPTIONS § A)。

### 1.3 Out of Scope
EE-4 plan 4 维量化阈值(DEFER-2.4 / D-06)+ T4.4 Task Session 完整版(v0.3.0)+ T1.1 dual-signal real-API integration(v0.3.0 prep)+ EE-2 ECC 9-field manifest schema(Phase 2.4)+ EE-1 role-router scoring(v0.3+)+ CD-1 handoff 四字段完整版(v0.3.0)+ V-1 动态 model routing(v0.3+)+ V-2 fallback bundle(v0.4+)+ intel 第 2 条 resolved_routing 快照冻结(v0.3+)(详 CONTEXT § Deferred + KICKOFF § 1.3)。

---

## § 2 Wave 拓扑(实占)

```
Wave 0 — STATE.md 6 项 prereq backlog 一次根治 + ADR draft (F1)
  ├─ T0.1  ADR 编号实占(0012)+ ROADMAP latest-shipped token + sed-replace placeholder discipline
  ├─ T0.2  ADR 0012 draft(5 章节 sketch only,Wave 6 详细 fill)
  ├─ T0.3  M3 perf gate 根治(D2.3-1)— 新 perf-bench.yml + ci.yml perf step skip(it.skip(IS_GHA))+ STATE.md L553 close
  ├─ T0.4  M1 schema regen CI gate(`corepack pnpm build:schema && git diff --exit-code schemas/`,~10L)
  ├─ T0.5  T1.2 schemaVersion consumer grep gate(`grep -r "branchOnSchemaVersion" src/ | wc -l ≥ 2`, **B1 plan-check fix** honest baseline; SUGGESTION-1 delta: no-paren grep 与 plan text 一致)
  ├─ T0.6  T1.3 Win pwsh provenance sentinel(`if: runner.os == 'Windows'` + `shell: pwsh`)
  ├─ T0.7  M2 intel L236-238 ## 实施进度回填 节(每 entry 标 IMPL: Phase 2.2 (commit) 或 PENDING)
  ├─ T0.8  T5 deferred-items review — RETROSPECTIVE.md 模板加节 + scripts/check-deferred-items.mjs(warn-only ≤80L)
  ├─ T0.9  3-OS CI 跑通 gate verify(Wave 0 全 step 合规)
  └─ T0.10 always_active spike(**W1 plan-check fix — 提前到 Wave 0 末**;<30 min;outcome 进 Resolved block;T4.2 SKIP)
       ↓
Wave 1 — manifest schema 演进(F2 装配链路 — D-01 MIN scope)
  ├─ T1.1  manifests/skill-packs/frontend-design.yaml NEW(D-08 anchor redirect 目标;git-clone-with-setup)
  ├─ T1.2  manifests/skill-packs/anthropics-skills-pptx.yaml NEW(npx-skill-installer skills@1.5.7 --copy --global pptx 子目录)
  ├─ T1.3  manifests/skill-packs/anthropics-skills-slide-deck.yaml NEW(同款 slide-deck 子目录)
  ├─ T1.4  manifests/tools/playwright-test.yaml NEW(npx-skill-installer / testing)
  ├─ T1.5  manifests/tools/chrome-devtools-mcp.yaml NEW(mcp-http-add)
  └─ T1.6  install 链路 e2e smoke(沿袭 Phase 2.1 6 method dispatch,5 NEW manifest 各跑 install dry-run + verify cmd)
       ↓
Wave 2 — decision_rules CD-3 字段 + karpathy SKILL-ONLY(F3 + F4 — D-02 + D-04 + D-08)
  ├─ T2.1  routing/decision_rules.yaml CD-3 字段加(`do_not_use_when:` + `if_rejected_use:`)+ 9 keywords 词集校准(D2.3-4 remove 独特 / add signature style + art direction + bold style)+ 1-2 anchor/negative-space rule
  ├─ T2.2  src/routing/decisionRules.ts arbitrateWithRedirect() NEW(B-18 (b) legacy 保留;**W4 plan-check fix — PROACTIVE SPLIT**: fn 主体 ship 到 src/routing/lib/arbitrateRedirect.ts ≤80L, decisionRules.ts 仅 5L re-export 主体不动 ≤188L)
  ├─ T2.3  skills/karpathy-baseline/SKILL.md NEW(D-02 + D2.3-2 单文件 + always_active: true frontmatter + 4 心法 ≤80L)
  ├─ T2.4  manifests/skill-packs/karpathy-skills.yaml REWRITE(D-02 删 CLAUDE.md sed → cp -R skills/karpathy-baseline ~/.claude/skills/ via git-clone-with-setup + migration cleanup script R3)
  └─ T2.5  per-manifest hint 层冗余字段(Q3 / B-17)— ui-ux-pro-max.yaml + frontend-design.yaml 加 decision_rules.do_not_use_when + if_rejected_use 冗余守护
       ↓
Wave 3 — EE-5 双层 gate (F5 — D-03)
  ├─ T3.1  src/cli/manifest-add.ts NEW(EE-5 5-question CLI ≤90L;readline/promises 互动 + --apply/--dry-run/--non-interactive H1 gate)
  ├─ T3.2  src/cli.ts register registerManifestAdd
  └─ T3.3  KICKOFF.md 模板加 § 7 EE-5 节(if any new upstream adapter 5 题清单)+ gsd-plan-checker BLOCKER rule
       ↓
Wave 4 — 30 SAMPLES.md FRESH + arbitrate routing ≥85%(F6 — D-05 + D-08)
  ├─ T4.1  .planning/phase-2.3/SAMPLES.md NEW R3 frozen(10 design + 10 content + 10 testing;≥1 做出风格 anchor + ≥1 false-pos 负样本 + CD-3 negative-space disqualify ≥3;truth table 列 schema 沿袭 phase 1.4 / 2.2)
  ├─ T4.2  always_active spike(R1 mitigation;<30 min 验 SKILL.md frontmatter 是否被 Claude Code skill registry 真支持;若 fail fallback description-keyword + self-reflexive prompt)
  └─ T4.3  tests/routing/samples-30.test.ts NEW(30-sample harness 实测 ≥85% 命中 → expect ≥26;R3 cherry-pick 防御沿袭 phase 1.4)
       ↓
Wave 5 — integration + tests(F7 A7 守恒)
  ├─ T5.1  tests/routing/arbitrate-redirect.test.ts NEW(CD-3 negative-space + if_rejected_use 单元测试 4 case:matched / rejected with redirect / rejected without redirect → none / multiple equal priority → none)
  ├─ T5.2  tests/cli/manifest-add-ee5.test.ts NEW(5-question CLI + --non-interactive dry-run-only 验证)
  ├─ T5.3  end-to-end 全链路 smoke(install adapter → karpathy skill → arbitrate negative-space → EE-5 gate)
  └─ T5.4  A7 守恒 verify — `git diff <baseline-1-11>..HEAD -- "docs/adr/00[0-1][0-9]-*.md" | wc -l` == 0
       ↓
Wave 6 — ship(F8)
  ├─ T6.1  ADR 0012 finalize 5 章节(Wave 0 draft → Wave 6 详细 fill 完成)+ accepted
  ├─ T6.2  ci.yml A7 step iter 1-11 → 1-0012
  ├─ T6.3  STATE.md 续编 + RETROSPECTIVE.md 加 milestone retrospective(deferred items review 跑通)
  └─ T6.4  baseline tag adr-0012-accepted + v0.2.0-alpha.3-extension-mvp 候选 tag
```

**Wave 0 必须最先**(B-25 + B-32)— M3 perf gate 根治不解后续 wave CI 不稳。 Wave 1 先于 Wave 2(decision_rules `if_rejected_use: frontend-design` 需 frontend-design.yaml 先 ship)。 Wave 4 SAMPLES.md 依赖 Wave 1+2+3 全完成(adapter 装配 + rule 集 + EE-5 gate 全在位)。 Wave 5 依赖 Wave 4 SAMPLES R3 frozen。

---

## § 3 Atomic Task Table

详 `task_plan.md`。本节是 summary view。

| Wave | Task Count | Est. Effort | Key Verify |
|------|-----------|-------------|-----------|
| 0 | 10 | ~2d | gate 0 violation + ENFORCE 兼容(Phase 2.2 ship) + perf-bench.yml cron + 3-OS CI 全绿 + T0.10 always_active spike outcome(**W1 plan-check fix**) |
| 1 | 6 | ~1d | 5 NEW manifest yaml ≤60L each + install dry-run e2e + decision_rules hint 一致 |
| 2 | 5 | ~1.5d | CD-3 字段 yaml + arbitrateWithRedirect() ≤+20L + decisionRules.ts ≤200L(or split) + SKILL.md ≤80L + karpathy-skills.yaml REWRITE 干净 + migration cleanup |
| 3 | 3 | ~1d | manifest-add.ts ≤90L + readline interactive + KICKOFF 模板 § 7 + checker BLOCKER rule |
| 4 | 3 | ~1d | 30 SAMPLES.md ≤250L R3 frozen + always_active spike outcome + samples-30.test ≥26/30 |
| 5 | 4 | ~1d | arbitrate-redirect.test 4 case + manifest-add-ee5.test 双层验证 + e2e smoke + A7 diff 0 |
| 6 | 4 | ~0.5d | 3-OS CI 全绿 + tag exist + ADR 0001-0011 main body diff 0 + adr-0012-accepted |
| **Total** | **35** | **~8d** | T0.10 spike 新加 (**W1 plan-check fix**);T4.2 SKIPPED slot 保留 |

---

## § 4 Phase 2.4 / v0.3.0 prereq 接口契约

Phase 2.3 ship 后,下游 phase 直接消费的接口:

| Consumer | Surface | Locked by Phase 2.3 |
|----------|---------|---------------------|
| Phase 2.4 doctor 完整版 | `arbitrateWithRedirect()` ArbitrateResult union + matchesDoNotUseWhen helper | B-18 + B-19 |
| Phase 2.4 EE-4 plan 4 维量化阈值 absorb(或独立 Phase 2.5) | gsd-plan-checker schema 改造 — 与 Phase 2.3 主线 orthogonal,deferred | 无 Phase 2.3 lock(D-06) |
| Phase 2.4 ralph-loop Win 全兼容 | T1.3 Win pwsh sentinel(provenance)pattern 复用 | B-30 |
| v0.3.0 sample 扩展(100+ × multi-model) | SAMPLES.md R3 frozen 模式 + arbitrateWithRedirect harness | B-20 + B-22 |
| v0.3.0 checkpoint 完整版 | EE-5 5-question gate 双层(ad-hoc CLI + plan-phase template) | B-11 + B-14 |
| v0.3+ 动态 model routing | (无 Phase 2.3 lock — static decision_rules 跑通后再考虑) | 无 lock |
| v0.3+ resolved_routing 快照冻结(intel 第 2 条) | SAMPLES.md R3 frozen rationale 模式可复用 | 无 lock(deferred) |

---

## § 5 Risks

详 ASSUMPTIONS § C(R1-R9)。
- **R1** always_active 字段未公开文档 → LOW;Wave 4 T4.2 spike + fallback description-keyword
- **R2** decisionRules.ts 可能超 200L → LOW-MED;默认 inline + fallback split lib/arbitrateRedirect.ts
- **R3** karpathy-skills.yaml REWRITE 旧 CLAUDE.md block 残留 → MED;migration cleanup script 一次性清旧 + uninstall 同步
- **R4** 30 SAMPLES ≥85% 实测不达 → LOW-MED;miss 节 + 9 keywords 微调 fallback
- **R5** EE-5 `--non-interactive` 绕过 → LOW;双层守护 + WARN emit
- **R6** M3 1 night latency schema regression 漏 → LOW;PR review 兜底 + nightly annotation
- **R7** ADR 编号实占冲突 → LOW;solo 单线性 + sed-replace discipline
- **R8** manifest yaml ≤60L 突破 → LOW;砍 notice 长描述 fallback
- **R9** sparse-checkout 单子目录复杂 → LOW;fallback 直接 cp -R 本仓 source-of-truth

**no Wave 1 BLOCKER**;**no SSOT 引用纪律 risk**(R7 单线性);**partial Win 兼容**(R3 Wave 2 migration cleanup Win 跑 + Wave 6 3-OS CI sentinel)。

---

## § 6 F1-F8 Acceptance Bar(with reproduction commands)

| Bar | Reproduction Command | Pass Criteria |
|-----|----------------------|---------------|
| **F1** | `node scripts/check-transparency-verdicts.mjs && cat .github/workflows/perf-bench.yml \| head -5 && grep "branchOnSchemaVersion" src/ -r \| wc -l && node scripts/check-deferred-items.mjs && grep -E "## 实施进度回填" .planning/intel/omc-comparison.md` | transparency exit 0(Phase 2.2 ship 持续 green);perf-bench.yml cron 存在;grep count ≥ 2(T1.2 — **B1 plan-check fix**: ≥7 → ≥2 honest baseline);check-deferred-items warn-only exit 0;intel 回填节存在 |
| **F2** | `ls manifests/skill-packs/frontend-design.yaml manifests/skill-packs/anthropics-skills-pptx.yaml manifests/skill-packs/anthropics-skills-slide-deck.yaml manifests/tools/playwright-test.yaml manifests/tools/chrome-devtools-mcp.yaml && for f in manifests/skill-packs/{frontend-design,anthropics-skills-pptx,anthropics-skills-slide-deck,karpathy-skills}.yaml manifests/tools/{playwright-test,chrome-devtools-mcp}.yaml; do wc -l $f; done` | 5 NEW manifest + 1 REWRITE 全 ≤60L;`harnessed install <each> --dry-run` 全 exit 0 |
| **F3** | `grep -E "do_not_use_when\|if_rejected_use" routing/decision_rules.yaml \| wc -l && npm test -- tests/routing/arbitrate-redirect.test.ts && wc -l src/routing/decisionRules.ts` | grep ≥ 4(每 category 至少 1 negative-space + 1 redirect)+ test 4 case pass;decisionRules.ts ≤200L(or split) |
| **F4** | `ls skills/karpathy-baseline/SKILL.md && wc -l skills/karpathy-baseline/SKILL.md && grep "always_active: true" skills/karpathy-baseline/SKILL.md && harnessed install karpathy-skills && test -f ~/.claude/skills/karpathy-baseline/SKILL.md && ! grep -q "karpathy-skills:start" ~/.claude/CLAUDE.md && harnessed uninstall karpathy-skills && ! test -f ~/.claude/skills/karpathy-baseline/SKILL.md` | SKILL.md ≤80L + always_active 命中;install/uninstall 双向干净;CLAUDE.md 不被改动(D-02 SKILL-ONLY) |
| **F5** | `wc -l src/cli/manifest-add.ts && npm test -- tests/cli/manifest-add-ee5.test.ts && grep -E "## § 7 EE-5\|EE-5 gate" .planning/phase-2.3/KICKOFF.md` | manifest-add.ts ≤90L;5-question test pass;KICKOFF § 7 节存在 |
| **F6** | `wc -l .planning/phase-2.3/SAMPLES.md && npm test -- tests/routing/samples-30.test.ts && grep -E "做出风格" .planning/phase-2.3/SAMPLES.md \| wc -l` | SAMPLES ≤250L;samples-30.test.ts ≥26/30 pass;≥1 做出风格 anchor case |
| **F7** | `git diff <baseline-1-11>..HEAD -- "docs/adr/0001-*.md" "docs/adr/0002-*.md" ... "docs/adr/0011-*.md" \| wc -l && ls docs/adr/0012-*.md && grep -E "^### [1-5]\. " docs/adr/0012-*.md \| wc -l` | A7 diff wc == 0;ADR 0012 存在 + 5 章节 |
| **F8** | `gh run list --workflow=ci.yml --limit=1 --json conclusion -q '.[0].conclusion'` + `git tag --list adr-0012-accepted v0.2.0-alpha.3-extension-mvp` | CI all-green 3 OS;两 tag 存在 |

---

## § 7 Wave Acceptance Checkpoint Table

| Wave | Checkpoint Type | Gate Check | Action if FAIL |
|------|----------------|-----------|----------------|
| 0 | auto | `node scripts/check-transparency-verdicts.mjs` exit 0 + perf-bench.yml cron 存在 + 3-OS CI 全绿 含 6 Wave 0 step | revert M3 perf step skip → identify Wave 0 step 失败 → 修;若 ADR 编号实占冲突 → max(NNNN)+1 重选 |
| 1 | auto | 5 NEW manifest yaml validate(schema valid)+ install dry-run e2e 全 exit 0 | yaml syntax err → fix;install dry-run fail → 沿 Phase 2.1 6 method dispatch 调 cmd |
| 2 | auto | CD-3 字段 yaml grep ≥ 4 + arbitrateWithRedirect test pass + SKILL.md always_active + karpathy-skills.yaml REWRITE 干净 | decisionRules.ts > 200L → R2 split lib/arbitrateRedirect.ts;always_active fail → R1 fallback description-keyword |
| 3 | auto | manifest-add.ts ≤90L + readline interactive smoke + KICKOFF § 7 + checker BLOCKER | --non-interactive 误绕过 → R5 加 WARN emit |
| 4 | auto | SAMPLES.md R3 frozen + samples-30.test ≥26/30 | <26 → R4 miss 节 + 9 keywords 微调(remove false-pos / add false-neg) |
| 5 | auto | 4 test file 全 pass + A7 diff 0 | A7 diff > 0 必 revert 改动到 ADR 0001-0011 main body |
| 6 | auto | 3-OS CI 全绿 + tag exist + ADR 0001-0011 main body diff 0 | rollback to last stable + investigate |

---

## § 8 Phase 2.3 vs 2.2 / 2.4 boundary

| 维度 | phase 2.2(ship) | phase 2.3(本) | phase 2.4 |
|------|------------------|----------------|-----------|
| workflow | execute-task 主线 + ralph-loop full integration ✅ | extension category MVP + karpathy 注入引擎 + 30 routing ≥85% | — |
| schema | phases.yaml + model + contract v1.2 + schemaVersion 7 surface ✅ | decision_rules CD-3 optional fields(do_not_use_when + if_rejected_use)+ open record(B-16 do nothing) | — |
| ADR | 0011 单 ADR 9 章节 ✅ | 新 ADR errata 0012 5 章节(extension MVP / CD-3 / EE-5 / karpathy SKILL-ONLY / Wave 0 perf gate) | 新 ADR(Phase 2.4 决策 + EE-4 absorb) |
| SDK | INTRODUCE + 4-layer dual-signal ✅ | — | — |
| transparency | gate ENFORCE=true + 全史迁移 + freshness ext ✅ | M1+M2+M3+T1.2+T1.3+T5 Wave 0 backlog 一次根治 | — |
| installer | 6 method dispatch frozen ✅ | extension category 5 NEW + 1 REWRITE adapter 真实装配 | — |
| skill 注入 | — | karpathy-baseline SKILL-ONLY(不动 CLAUDE.md) | — |
| gate | — | EE-5 5-question merge gate 双层 | — |
| doctor | — | — | 完整版 jq/Git Bash + weekly cron + audit + ralph-loop Win 全兼容 + EE-4 4 维 schema(候选 absorb) |
| sample | 30 sample(15 复用 + 15 新增 execute-task)✅ | 30 sample FRESH category-specific routing ≥85% 含 做出风格 anchor | 100+ × multi-model(v0.3.0 P3.3 prep) |

---

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| CLI input → manifest-add | `harnessed manifest add <upstream>` 接受 upstream 字符串 → manifest stub 生成 + 5 question prompt 用户答案进 manifest provenance |
| User-controlled --non-interactive flag → CI/scripts path | 用户 CLI flag 跳 5-question prompt(D-03 锁 dry-run-only 不绕 plan-phase hard reject) |
| manifest yaml input → schema validate | 新 manifest yaml 可能含 user 改 → schema TypeBox validate + decision_rules hint 内联防注入 |
| Subagent prompt → decision_rules anchor match | subagent 输入文本含 "做出风格" anchor 可能 user-injected 触发 redirect → 9 keywords 高精度词集(D2.3-4)防 false-pos 误伤 |
| karpathy install → ~/.claude/skills/ | install cmd 跑用户级 ~/.claude/skills/ 写入 + migration cleanup 跑 CLAUDE.md sed(一次性清旧 block,不注入新内容)|
| decision_rules.yaml do_not_use_when regex → arbitrate disqualify | 全局 SSOT(D-04)+ per-manifest hint 冗余(B-17 Q3)→ arbitrate 一致 consume,无 schema 分裂 |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-2.3-01 | Tampering | `<upstream>` CLI arg in manifest-add | mitigate | Wave 3 T3.1 RawOpts validate upstream non-empty + URL/repo-id regex 校验(沿袭 research.ts L37-43 pattern);unicode tolerate(skill 名可中文)但禁 shell metacharacters;readline.question 用 array argv 而非 string concat |
| T-2.3-02 | Tampering | `--non-interactive` flag 绕过 EE-5 5 question | mitigate | D-03 锁 `--non-interactive` 跳 dry-run-only(不持久化 manifest state);CLI emit `[ee-5-gate] WARN: --non-interactive skips prompt; plan-phase hard reject still applies`;plan-phase template § 7 + gsd-plan-checker BLOCKER 双层守护(B-14) |
| T-2.3-03 | Tampering | manifest yaml `decision_rules.override_signals` user-modified | mitigate | manifest schema TypeBox `additionalProperties: false` 严格 validate + decision_rules.yaml SSOT 主导(D-04 DR-only);per-manifest hint 是冗余守护层(B-17)非授权 source |
| T-2.3-04 | Spoofing | subagent 文本含 "做出风格" anchor user-injected 触发误 redirect | accept | LLM-internal trust boundary;若 attacker 能控 subagent prompt 已 own engine spawn;9 keywords 高精度词集(D2.3-4 remove 独特 false-pos)减误伤;SAMPLES.md ≥1 false-pos 负样本验证 |
| T-2.3-05 | Tampering | karpathy install 改动 ~/.claude/CLAUDE.md(D-02 否决路径) | mitigate | D-02 SKILL-ONLY 锁 — install 仅写 ~/.claude/skills/karpathy-baseline/;migration cleanup 跑 sed -i '/karpathy-skills:start/,/karpathy-skills:end/d' 一次性清旧 block(清除非注入);uninstall 干净 rm -rf 无 CLAUDE.md 残留;ROADMAP L121 一键关闭 |
| T-2.3-06 | DoS | EE-5 5-question prompt 无上限阻塞 CI | mitigate | `--non-interactive` 跳 prompt(D-03 dry-run-only);readline timeout 不显式但 vitest test 含 mocked stdin → 不挂 CI |
| T-2.3-07 | Repudiation | manifest-add 互动 5 答案历史 audit | mitigate | Wave 3 T3.1 5 答案进 manifest provenance 4 字段(source/created_at/confidence/author),沿袭 Phase 2.2 B-33 provenance.schema.json |
| T-2.3-08 | Elevation of Privilege | chrome-devtools-mcp HTTP MCP server URL user-controlled | accept | mcp-http-add CLI claude 调用受 Claude Code 内 MCP allowlist 控;Phase 2.3 scope 内 manifest 默认 upstream URL pin;运行时由 Claude Code MCP gate 控 |
| T-2.3-09 | Tampering | decision_rules.yaml do_not_use_when regex 越界匹配 | mitigate | 现行 F42 substring lowercase match(decisionRules.ts L143-153)— 中文字符 lowercase 等价自身(A3 HIGH conf);keywords 9 高精度词集(D2.3-4)precision 评估过 |
| T-2.3-10 | Tampering | perf-bench.yml nightly cron 网络请求伪造 | accept | GHA cron 由 GitHub 触发 + 受 secrets.ANTHROPIC_API_KEY scope 控;advisory only 不阻 ship → 即使 falsified 不影响 release |
</threat_model>

<verification>
- `node scripts/check-transparency-verdicts.mjs` exit 0(Phase 2.2 ship 持续 green)
- `node scripts/check-deferred-items.mjs` warn-only exit 0(round 1 不 ENFORCE)
- `node scripts/check-provenance.mjs` exit 0
- `npm run typecheck` + `npm run lint` + `npm test` all pass
- `npx tsc --noEmit` 编译通过
- `wc -l src/routing/decisionRules.ts src/cli/manifest-add.ts skills/karpathy-baseline/SKILL.md scripts/check-deferred-items.mjs .github/workflows/perf-bench.yml` 全 ≤ hard limit(200/90/80/80/50)
- `wc -l manifests/skill-packs/frontend-design.yaml manifests/skill-packs/anthropics-skills-pptx.yaml manifests/skill-packs/anthropics-skills-slide-deck.yaml manifests/tools/playwright-test.yaml manifests/tools/chrome-devtools-mcp.yaml manifests/skill-packs/karpathy-skills.yaml` 全 ≤60L
- `wc -l .planning/phase-2.3/SAMPLES.md` ≤ 250
- `git diff <baseline-tag-1-11>..HEAD -- "docs/adr/000[1-9]-*.md" "docs/adr/0010-*.md" "docs/adr/0011-*.md"` 输出 empty(A7 守恒)
- 3-OS CI matrix(`ubuntu-latest` / `macos-latest` / `windows-latest`)all green
- `harnessed install frontend-design && test -f ~/.claude/skills/frontend-design/SKILL.md` 跑通(若执行环境)
- `harnessed install karpathy-skills && test -f ~/.claude/skills/karpathy-baseline/SKILL.md && ! grep -q "karpathy-skills:start" ~/.claude/CLAUDE.md`(D-02 SKILL-ONLY 验)
- 30 sample 跑通 samples-30.test.ts ≥26/30 命中(≥85% B-21)
- `grep -E "^### [1-5]\. " docs/adr/0012-*.md | wc -l` 输出 == 5(F7 reproduction — ADR 5 章节)
- `git tag --list adr-0012-accepted v0.2.0-alpha.3-extension-mvp` 两 tag 存在
- `grep "0011" .planning/phase-2.3/ docs/adr/ -r` 出非 Phase 2.2 ADR 引用范围之外的字面残留 == 0(T0.1 sed-replace discipline)
- `grep -E "branchOnSchemaVersion\(" src/ -r | wc -l` ≥ 2(T1.2 schemaVersion consumer gate — **B1 plan-check fix**: honest baseline reflecting Phase 2.2 W2 helper-only adoption)

</verification>

<success_criteria>
- F1-F8 全 ship(详 § 6 reproduction commands)
- 39 个 decision lock(B-01 ~ B-39)全 ship,**zero unresolved conflict**
- 34 atomic task 全 done + 7 Wave 全 checkpoint pass
- ADR errata 0012 accepted 含 5 章节 + baseline tag updated(1-11 → 1-0012)
- v0.2.0-alpha.3-extension-mvp 候选 milestone tag created
- `.planning/STATE.md` + `.planning/RETROSPECTIVE.md` 续编 reflect Phase 2.3 ship(deferred items review 节跑通)
- decision_rules.yaml CD-3 字段 + 9 keywords 词集 frozen(execute-phase R3 cherry-pick 防御沿袭)
- karpathy SKILL-ONLY 注入引擎 ship — 用户私有 CLAUDE.md 0 改动(D-02 + ROADMAP L121 一键关闭)
</success_criteria>

<output>
After completion, create `.planning/phases/2.3/2.3-SUMMARY.md`(沿袭 phase 1.5 / 2.1 / 2.2 SUMMARY 模式)+ 续编 `.planning/STATE.md` + `.planning/RETROSPECTIVE.md`。
</output>
