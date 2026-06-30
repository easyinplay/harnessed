---
title: v13.0 Upstream Re-sync — gstack / gsd-core / superpowers pin bump + selective wire
date: 2026-06-30
status: DESIGN-LOCKED (ready-to-execute)
author: 3-subagent delta research (gstack / gsd-core / superpowers) + 2 main-session spikes
problem: 三个核心上游(gstack / gsd-core / superpowers)自 harnessed 上次 re-sync(v5.1, 2026-06-10)起已各更新数版,pin 全部 stale。窗口内几乎无新 user-facing skill,价值集中在「已编排能力被上游硬化」(bump pin 即继承)+ 少数现存但未编排的能力补 gap。
scope: 完整档(user-locked 2026-06-30)= 3 pin bump + 2 高价值 wire + 3 可选 wire。
verified_refs:
  - "manifests/skill-packs/gstack.yaml — git_ref 1626d485 / last_known_good 1.52.1.0 (exists)"
  - "manifests/skill-packs/gsd.yaml — npm_version ^1.4.1 / last_known_good 1.4.1 (exists)"
  - "manifests/tools/superpowers.yaml — git_ref v5.1.0 / last_known_good 5.1.0 (exists)"
  - "workflows/capabilities.yaml — 35-entry capability map, impl→cmd→fires_when (exists)"
  - "workflows/judgments/parallelism-gate.yaml:17 — superpowers-subagent-driven-development ref (exists)"
  - "~/.claude/skills/gsd-eval-review/SKILL.md (exists, SPIKE-1 verified)"
  - "~/.claude/skills/gsd-validate-phase/SKILL.md (exists, SPIKE-1 verified)"
  - "~/.claude/skills/gstack/diagram/SKILL.md (exists local 1.58.0.0, gstack-subagent verified) — NEW wire"
  - "superpowers verification-before-completion / systematic-debugging SKILL.md (exists local 5.1.0, superpowers-subagent verified) — NEW wire"
non_goals:
  - "NOT wiring gsd-mempalace-recall/capture — 跨 session 记忆与 .planning/ 三层纪律 + planning-with-files findings.md 强重叠;引 GSD MemPalace KG = 记忆双 home,违反「一事实一个家」反腐铁律。保留 .planning/ 单一 home。(user-confirmed skip 2026-06-30)"
  - "NOT wiring sync-gbrain — harnessed 不依赖 gbrain 栈(已有 codegraph + understand-anything),wire 即死 entry。"
  - "NOT wiring gstack ios-*(5) — harnessed 是 Node/TS/pnpm CLI,零 iOS 关联,stack 不匹配。"
  - "NOT wiring gsd ship/pr-branch/code-review · ns-* router · autonomous/fast/quick — 跨层重叠(ship→gstack 决策层 / code-review→mattpocock 招式 / execute→harnessed 自有 keystone 不 wire gsd-execute-phase)。"
  - "NOT wiring superpowers writing-plans(CLAUDE.md 已显式禁,与 planning-with-files 重叠) · using-git-worktrees(Agent native isolation:worktree 已覆盖) · finishing-a-development-branch(与 ship 重叠)。"
---

# v13.0 Upstream Re-sync — design spec

## 1. Pin delta + SPIKE 结论(已验证)

| 上游 | manifest | pin (旧) | 实际最新 | 窗口新增 skill | bump 隐性收益(继承) |
|------|----------|----------|----------|----------------|----------------------|
| gstack | `manifests/skill-packs/gstack.yaml` | 1.52.1.0 | 1.58.0.0(本地) | 1 (`/diagram`) | token carving(`/ship` -59%)· redaction/staging/codex-auth guard · AskUserQuestion 文本 fallback · unresolved-decisions 强制 verdict |
| gsd-core | `manifests/skill-packs/gsd.yaml` | ^1.4.1 | 1.6.0(npm + 本地) | 2 (mempalace, skip) | verify-work deterministic UAT routing · plan:pre 漂移预检 · gsd-review 强制源码核验 |
| superpowers | `manifests/tools/superpowers.yaml` | v5.1.0 | v6.0.3 | 0 | 6.0 SDD 重写(file-based handoff / 单 reviewer / `.superpowers/sdd/`)— 对 harnessed 透明 |

**SPIKE-1 (gsd 1.6.0 兼容)**: 本地装 1.6.0,manifest `idempotent_check` + `verify`(`~/.claude/skills/gsd-plan-phase/SKILL.md`)实测 PASS;19 个已 wire skill + 候选 eval-review/validate-phase 本地全在;ADR-1244 capability CLI 未改 skill 落地路径(仍 `skills/<name>/SKILL.md`)。**check 命令无需改,bump 安全。**

**SPIKE-2 (superpowers 6.0 worktree)**: harnessed 未 wire superpowers `using-git-worktrees`(用 Agent native `isolation:worktree`);6.0 worktree skill 反而改成「优先 harness native 工具」与 harnessed 同向。SDD 6.0 重写是 skill 内部语义,cmd 名 `superpowers:subagent-driven-development` + `parallelism-gate.yaml:17` wiring 不变。**bump 安全,bump 后 smoke-test 一次 parallelism-gate dispatch。**

## 2. Wire 清单(5)+ 挂载点

### 高价值(P42)
1. **`verification-before-completion`**(superpowers,impl=superpowers · cmd `superpowers:verification-before-completion`)
   - gap: harnessed verify 全是 phase 级(gsd-verify-work UAT / code-review / gstack-review),缺 **task 级 per-claim 证据门**(说 "done" 前强制贴验证 output)。契合 ralph-loop verbatim COMPLETE + karpathy「完成=验收通过」。
   - 挂载: capabilities.yaml 核心 capability bucket + `task/deliver` COMPLETE 前 + verify-progress 起点。fires_when: 任何 COMPLETE/PR 声明前。
2. **`gsd-eval-review`**(impl=gsd · cmd `/gsd-eval-review`)
   - gap: 已 wire `gsd-ai-integration-phase`(plan 侧出 eval strategy)但 verify 侧从不审计 eval 是否真覆盖。一对一配对空洞。
   - 挂载: capabilities special-purpose bucket + verify stage(has_ai_phase conditional)。

### 可选(P43)
3. **`/diagram`**(gstack,Bucket 7 optional registry)— 英文→可编辑架构图(.mmd + .excalidraw + SVG)。补 ADR/SPEC 重项目可视化。mirror `make-pdf` 形状,on-demand 不 gate。fires_when: `subtask.needs_diagram == true OR user explicit 'diagram'`。
4. **`gsd-validate-phase`**(impl=gsd · cmd `/gsd-validate-phase`)— Nyquist 覆盖后向查漏(TDD 前向之外补 requirement→test 缺口)。verify stage 可选。
5. **`systematic-debugging`**(superpowers · cmd `superpowers:systematic-debugging`)— 与已编排 mattpocock `diagnose` **双 impl 备选**(类 tdd 的 superpowers-主/mattpocock-备 模式)。挂 diagnose 同触发点作 superpowers-native alias。

## 3. Phase 拆分 + 验收

- **P41 — Pin bumps**(低风险,spike 已验证)
  - T41.1 gstack.yaml: git_ref → 1.58.0.0 对应 commit · last_known_good_version 1.58.0.0 · last_check 2026-06-30
  - T41.2 gsd.yaml: npm_version ^1.6.0 · last_known_good_version 1.6.0 · last_check 2026-06-30
  - T41.3 superpowers.yaml: git_ref v6.0.3 · last_known_good_version 6.0.3 · last_check 2026-06-30
  - 验收: 3 manifest 改完 · manifest-schema test 绿 · `node scripts/check-*.mjs` 相关 gate 绿
- **P42 — 高价值 wire**: verification-before-completion + gsd-eval-review
  - capabilities.yaml entry(+ zh i18n parity if yaml-i18n 覆盖)· judgments fires_when · workflow 挂载点 · skill-invoke-parity / capability-schema test
  - 验收: 2 capability 可被 workflow 模板解析 · parity test 绿 · vitest + workflow-schema 绿
- **P43 — 可选 wire**: /diagram + gsd-validate-phase + systematic-debugging
  - 验收: 同 P42 · /diagram 进 Bucket 7 optional · systematic-debugging 双 impl 不破坏 diagnose
- **P44 — Verify + docs**
  - full gate(vitest / tsc / biome / skill+yaml-i18n-parity / workflow-schema)· CHANGELOG `[Unreleased]` · ADR(3 upstream upgrade 决策 + MemPalace/gbrain skip 理由)· STATE/ROADMAP/MILESTONES sync
  - 验收: 全 gate 绿 3-OS-ready · CHANGELOG/ADR 落 · npm patch/minor release 决策待用户

## 4. 待 execute 期确认的实施细节(非 user gray area,主 session 自决)
- gstack 1.58.0.0 的精确 commit hash(git_ref)— execute 时 `gh api` 取 1.58.0.0 tag 的 sha。
- verification-before-completion / systematic-debugging 的精确 capability bucket 归属 + fires_when 语法 — 照抄 capabilities.yaml 现有同类 entry。
- yaml-i18n parity 是否覆盖新 capability 的 description(若覆盖需补 zh sibling)。
