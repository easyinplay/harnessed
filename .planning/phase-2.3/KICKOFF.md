# Phase 2.3 plan-phase — KICKOFF

> **Authored**: 2026-05-16
> **Phase**: v0.2.0 Phase 2.3 — design/content/testing extension category MVP + karpathy behavior-rule 注入引擎 + 30 category-specific 样本 routing ≥85%
> **依赖**: `2.3-CONTEXT.md`(discuss-phase 8 D-决策 D-01~D-08)+ `.planning/intel/omc-comparison.md` L92(EE-5 必上)+ L130-135(CD-3 显式负空间)+ § 0 SSOT 引用纪律 + `.planning/ROADMAP.md` L109-112 + `.planning/STATE.md` Phase 2.3 Prereq Notes(L545+)
> **风格沿袭**: phase 1.5/2.1/2.2 plan-phase Wave 结构(KICKOFF → Wave A R1 PATTERNS + R2 RESEARCH → Wave B ASSUMPTIONS + PLAN + task_plan → Wave C PLAN-CHECK)

---

## § 1 Phase Goal & Scope

### 1.1 Goal

把 v0.2.0 routing engine 升级为**3 extension category(design/content/testing) MVP 装配 + karpathy behavior-rule 注入引擎 ship + 30 category-specific 样本 routing ≥85% 命中**(含 "做出风格" override anchor)。 装配 6-7 真实 adapter(design = `ui-ux-pro-max` 已装配 + `frontend-design`;content = `anthropics-skills` pptx/slide-deck;testing = `playwright-test` + `webapp-testing` 已装配 + `chrome-devtools-mcp`), 用 `decision_rules` MIN scope 最小 rule 集驱动 arbitrate。

**intel 必上两项 absorb**(L92 + L130-135):**EE-5 5-question merge gate**(CLI prompt warn-only + plan-phase template hard reject 双层防 thin wrapper)+ **CD-3 显式职责负空间 + `if_rejected_use:<id>`**(decision_rules optional fields `do_not_use_when:` + `if_rejected_use:` redirect target)。

**karpathy-skills 注入机制** = `~/.claude/skills/karpathy-baseline.md` always-on skill(SKILL-ONLY 不动 CLAUDE.md, 低风险 ROADMAP L121 "karpathy behavior-rule 与用户私有 CLAUDE.md 冲突" 一键关闭)。 `harnessed install karpathy-skills` 装/卸 干净。

**Wave 0 必办**(STATE.md L545+ Phase 2.3 Prereq Notes 6 项一次根治) — M1 schema regen CI gate / M2 intel 实施进度回填 / M3 perf gate 3-tier ADR errata + 根治(移出 CI critical path OR OS-tolerance OR nightly cron 拆分) / T1.2 schemaVersion consumer call site CI gate / T1.3 Win path-sep provenance sentinel / T5 deferred-items review cadence — 沿袭 Phase 2.1/2.2 Wave 0 模式(引重但后面净)。

### 1.2 In Scope（8 acceptance bar F1-F8 — 详 Wave B ASSUMPTIONS § A）

### F1 — Wave 0 一次性根治（6 项 STATE.md backlog）

M1 + M2 + M3 + T1.2 + T1.3 + T5 全 Wave 0 ship。 关键:M3 perf gate 根治(移 CI critical path OR OS-dependent + IQR tolerance OR nightly cron 拆分,plan-phase 实占方案)+ M1 `pnpm build:schema && git diff --exit-code schemas/` ~10L CI step + M2 intel 实施进度回填(L236-238 标 `IMPL: Phase 2.2 (commit hash)`)+ T1.2 grep gate(7 surface consumer ≥ 1)+ T1.3 Windows pwsh sentinel + T5 RETROSPECTIVE 模板加 deferred-items review 节。

### F2 — Extension category 3 adapter manifest 装配（6-7 adapter MIN scope）

`manifests/<category>/<adapter>.yaml` 6-7 entry 验证 install 链路通(沿袭 Phase 2.1 6 install method dispatch):
- **design**: `ui-ux-pro-max`(已装配, 复用 Phase 2.1)+ `frontend-design`(新)
- **content**: `anthropics-skills` pptx/slide-deck(新, 走 npx-skill-installer 或 git-clone-with-setup, planner 实占)
- **testing**: `playwright-test`(新, npx)+ `webapp-testing`(已装配)+ `chrome-devtools-mcp`(新, mcp-http-add)

### F3 — decision_rules MIN rule 集 + CD-3 负空间字段

`routing/decision_rules.yaml` 新加 `design:` / `content:` / `testing:` 三 category schema 段, 每段最小 rule 集(每 category 1-2 anchor rule + 1 do_not_use_when 负空间 + 1 if_rejected_use redirect)。 TypeBox schema 加 optional fields `do_not_use_when:` + `if_rejected_use: <component-id>`。 `arbitrate()` 升级读 negative-space → down-rank + reject 时返回 redirect target(~15L code)。 单一 SSOT。

### F4 — karpathy-baseline.md skill + harnessed install karpathy-skills

`~/.claude/skills/karpathy-baseline.md` always-on skill 形态(Think Before Coding / Simplicity First / Surgical Changes / 小步原子修改 / Goal-Driven / 最小有效代码 ≤心法精炼)。 `harnessed install karpathy-skills` 装/卸 干净(沿袭 Phase 2.1 install_type 字段 + provenance 4 字段)。 不动 CLAUDE.md(D-02)。

### F5 — EE-5 5-question merge gate 双层（CLI warn + plan-phase hard reject）

`harnessed manifest add <upstream>` 互动 5 问 prompt(intel L86 5 题原型: 真 reusable surface / fit shape / overlap / import 概念 vs 身份 / user 理解), `--non-interactive` 跳 dry-run-only。 plan-phase 模板加 5 题清单, gsd-plan-checker BLOCKER if 5 问 未答 (~30L code 双层合)。

### F6 — 30 category-specific FRESH SAMPLES.md + arbitrate routing ≥85%

`.planning/phase-2.3/SAMPLES.md` 全新 10 design + 10 content + 10 testing 样本(D-05 FRESH-30 不复用 Phase 2.2 6 category × 5 cross-domain), 包含 ≥1 "做出风格" anchor case(D-08 frontend-design 主导, regex `做出风格|独特|独创` → redirect)。 arbitrate 实测 ≥85% 命中(沿袭 phase 1.4 R3 frozen rationale 模式, Phase 2.3 SAMPLES.md 自身重置 frozen)。

### F7 — A7 守恒（ADR 0001-0011 main body 0 diff + new ADR baseline tag）

本 phase 新 ADR 走 errata 路径(覆盖 extension category schema + decision_rules CD-3 字段 + EE-5 双层 gate + karpathy skill + Wave 0 perf gate ADR errata)。 **ADR 编号由本 plan-phase 实占**(沿袭 intel § 0 SSOT 引用纪律, **不预占 ADR 0012**)。 baseline tag 11 → N(N 实占), ci.yml A7 iter 1-11 → 1-N, ADR 0001-0011 main body 0 diff。

### F8 — ship（3-OS CI 全绿 + milestone tag）

CI 三平台全绿(M1 schema regen gate / M3 perf gate 根治后 / T1.2+T1.3 加固 step 全跑)+ adr-NN-accepted baseline tag(N 实占)+ ci.yml A7 step iter 1-11 → 1-N + ADR 0001-0011 main body 0 diff + v0.2.0-alpha.3-extension-mvp 候选 milestone tag(v0.2.0 4 phase 3/4 ship)。

### 1.3 Out of Scope（推后续 phase）

| 项 | 推迟到 | Rationale |
|----|-------|-----------|
| EE-4 plan 4 维量化阈值 schema | Phase 2.4 doctor 完整版 absorb OR Phase 2.5 独立 | 与 Phase 2.3 extension category 主线 orthogonal(D-06) |
| T4.4 Task Session 复用 完整版 | v0.3.0 checkpoint | closure infra 三件套 ready(`.planning/phase-2.2/T4.4-DEFERRED-onboarding.md`)|
| T1.1 dual-signal 4-layer real-API integration cell | v0.3.0 prep | 需 ANTHROPIC_API_KEY, real-API e2e |
| EE-2 ECC 9-field manifest schema | Phase 2.4 manifest schema 演进时同步评估 | 与本 phase MIN scope 不冲突 |
| EE-1 role-router scoring 中间层 | v0.3+ 路由命中率验收 | 30 sample → 100+ sample × multi-model 验收时 |
| CD-1 handoff 四字段完整模板 | v0.3.0 checkpoint 完整版 | Phase 2.2 已用模板格式, 完整机制 v0.3.0 |
| V-1 动态 model routing | v0.3+ discuss | static model tier 跑通(Phase 2.2 ship)后再考虑升级 |
| V-2 Manual fallback bundle export | v0.4+ | 边界 case wedge 风险警示, 不在 v0.2 主线 |
| intel 第 2 条 resolved_routing 快照冻结 | v0.3+ evaluation | karpathy YAGNI — 真实 mid-session drift 出现后再做 |

---

## § 2 Wave 拓扑（预期 — Wave B planner 细化）

```
Wave 0 — STATE.md 6 项 prereq backlog 一次根治 (F1)
  ├─ M3 perf gate 3-tier ADR errata + 根治(plan-phase 实占根治策略)
  ├─ M1 ci.yml `pnpm build:schema && git diff --exit-code schemas/` step
  ├─ M2 intel L236-238 实施进度回填(标 IMPL: Phase 2.2 commit hash)
  ├─ T1.2 grep gate(7 surface branchOnSchemaVersion consumer ≥ 1)
  ├─ T1.3 Win pwsh check-provenance sentinel
  └─ T5 RETROSPECTIVE 模板 deferred-items review 节
       ↓
Wave 1 — extension category manifest schema 演进 (F2 装配链路)
  ├─ design/content/testing 三 category 段 schema 加
  ├─ 6-7 adapter manifest yaml 编写(D-01 MIN scope)
  └─ install 链路 e2e 验证(沿袭 Phase 2.1 6 method dispatch)
       ↓
Wave 2 — decision_rules + CD-3 负空间 + karpathy skill (F3 + F4)
  ├─ decision_rules.yaml 三 category MIN rule 集 + 负空间字段
  ├─ arbitrate() 升级 do_not_use_when + if_rejected_use(~15L)
  ├─ karpathy-baseline.md skill 形态 + always-on 配置(D-02 SKILL-ONLY)
  └─ harnessed install karpathy-skills 装/卸链路
       ↓
Wave 3 — EE-5 5-question merge gate 双层 (F5)
  ├─ harnessed manifest add <upstream> CLI 互动 5 问 + --non-interactive dry-run
  └─ plan-phase 模板 5 题 + gsd-plan-checker BLOCKER if 未答
       ↓
Wave 4 — 30 SAMPLES.md FRESH + arbitrate routing ≥85% (F6)
  ├─ 10 design + 10 content + 10 testing FRESH 样本
  ├─ "做出风格" anchor regex(D-08 frontend-design 主导 redirect)
  └─ 30-sample test ≥85% 实测 + R3 frozen rationale 重置
       ↓
Wave 5 — integration + tests (F7 A7 守恒)
  ├─ ADR errata draft(编号 plan-phase 实占, 不预占 0012)
  ├─ 3-OS CI 全绿 verify
  └─ 全链路 e2e(install adapter → karpathy skill → arbitrate negative space → EE-5 gate)
       ↓
Wave 6 — ship (F8)
  ├─ CI 三平台全绿 + Wave 0 加固 step 全跑
  ├─ adr-NN-accepted baseline tag(N 实占)
  ├─ ci.yml A7 iter 1-11 → 1-N
  └─ v0.2.0-alpha.3-extension-mvp 候选 milestone tag
```

**Wave 0 必须最先** — STATE.md prereq backlog 6 项尤其 M3 perf gate 根治不解, 后续 wave CI 不稳。 Wave 1 manifest schema 演进先于 Wave 2(decision_rules 引 category 后才能加 rule), Wave 4 SAMPLES.md 依赖 Wave 1+2+3 全完成(adapter 装配 + rule 集 + EE-5 gate 全在位才能跑 ≥85% 命中)。

---

## § 3 Hard Constraints（不可违反）

1. **A7 守恒** — ADR 0001-0011 main body 0 diff;Phase 2.3 新 ADR 走 errata 路径(不动旧 ADR);ship 时 baseline tag 11 → N(N 实占);ci.yml A7 step iter 1-11 → 1-N;`docs/AGENT-DEFINITION-FACTORY-CONTRACT.md` + `docs/INSTALLER-CONTRACT.md` main body 不动
2. **ADR 编号不预占**(intel § 0 SSOT 引用纪律 + CONTRIBUTING.md 项目级) — 本 phase 一切文档(KICKOFF/PATTERNS/RESEARCH/ASSUMPTIONS/PLAN/task_plan)写 "ADR errata(编号 plan-phase 实占)" 或 "新 ADR", **不写 ADR 0012**(写作惯例); plan-phase Wave 5/6 ship 时 git mv / new file 决定实际编号
3. **TypeBox not zod** — schema 改动用 `@sinclair/typebox` `Type.*`;沿袭 ADR 0010/0011 errata 注释块 fence 模式;CD-3 `do_not_use_when:` + `if_rejected_use:` 字段 TypeBox optional
4. **SKILL-ONLY karpathy 注入**(D-02) — `~/.claude/skills/karpathy-baseline.md` 路径, NOT 动 CLAUDE.md(低风险 ROADMAP L121 冲突一键关闭);install/uninstall 干净
5. **MIN scope 严守**(D-01 Karpathy YAGNI) — 6-7 adapter 不扩;每 category 1-2 anchor rule;不预先抽 role-router scoring 中间层(EE-1 v0.3+);plan-phase 实占不破 MIN 边界
6. **Karpathy simplicity 5 hard limit 继承** — `engine.ts` ≤200L / `agentDefinition.ts` ≤200L / `systemPrompt.ts` ≤80L / `ralphLoop.ts` ≤50L / `promiseExtract.ts` ≤50L;新文件超 hard limit 必须 spillover to lib/
7. **EE-5 双层 gate hard reject**(D-03) — plan-phase 模板 5 题未答 gsd-plan-checker 出 BLOCKER(非 warning);CLI 层 `--non-interactive` 跳 dry-run-only(不绕过 hard reject)
8. **CD-3 negative-space DR-only**(D-04) — `decision_rules.yaml` 单一 SSOT, 不开第二来源(避免 schema 分裂);arbitrate 一致 consume
9. **A8 LF line endings** — 所有新文件 LF;Win 测试需 Git Bash;新 SAMPLES.md + skill md + decision_rules yaml 全 LF

---

## § 4 Wave A 研究分工

research refresh 范围:Phase 2.3 主决议(extension category MIN scope / karpathy SKILL-ONLY / EE-5 双层 gate / CD-3 DR-only / FRESH-30 / Wave 0 ALL-W0 / "做出风格" FE-DESIGN)已 8 D-decisions D-01~D-08 锁(2.3-CONTEXT.md), Wave A 聚焦**剩余不确定**:

### R1 (gsd-pattern-mapper → PATTERNS.md)

extension category 6-7 adapter + 新代码文件 → existing analog mapping。 重点:
- `manifests/<category>/<adapter>.yaml` 6-7 entry → analog: Phase 2.1 6 install method manifest yaml + ui-ux-pro-max/webapp-testing 已装配实战
- `decision_rules.yaml` 三 category 段 + 负空间字段 → analog: Phase 1.5 v2 `mattpocock_phases:` 段 + Phase 2.1 schema errata
- `arbitrate()` 升级 do_not_use_when + if_rejected_use → analog: `src/routing/decisionRules.ts` 当前 override_signals 正向触发 + Phase 2.2 schemaVersion branchOnVersion
- `karpathy-baseline.md` skill 形态 → analog: 已装配 `ui-ux-pro-max` skill md 结构 + anthropics-skills 上游模板
- `harnessed manifest add <upstream>` CLI 互动 prompt → analog: Phase 2.1 install --apply confirmation pattern + commander.js prompt 库
- plan-phase 模板 5 题 → analog: Phase 1.4 KICKOFF/CONTEXT 模板 + gsd-plan-checker schema(BLOCKER/WARNING/SUGGESTION 三档)

### R2 (gsd-phase-researcher → RESEARCH.md)

3 项 fresh research(主决议 D-01~D-08 已锁不重做):

1. **M3 perf gate 根治策略**(Wave 0) — 3 候选评估:(a) 移出 CI critical path(perf 只 nightly cron 跑, PR 不阻塞);(b) OS-dependent threshold + IQR tolerance(retain CI critical path 但容忍 cloud-VM-class degrade);(c) nightly cron 拆分(PR 跑轻 smoke, nightly 跑完整 100+ sample)— 评各自 false-positive / 维护成本 / Win/Mac/Linux 一致性, 给 plan-phase 推荐一项 + 实施细则
2. **karpathy-baseline.md skill 形态 + always-on 配置** — Claude Code skill 形态规范:`~/.claude/skills/<name>/SKILL.md`(目录 vs 单文件)+ frontmatter(always-on toggle / rules/*.md split / 描述长度 token budget);harnessed install adapter 路径 + uninstall 干净度(provenance 4 字段约束下)
3. **"做出风格|独特|独创" regex anchor 实测候选词集** — D-08 FE-DESIGN 主导规则要 robust regex, 实测候选: `做出风格` / `独特` / `独创` / `创新` / `品牌调性` / `风格化` / `独家` / `特色` 等中文 anchor + 英文 anchor `unique style` / `bold` / `signature` / `creative direction` — 给 30 sample 中 ≥1 anchor case 选 hit 率高的子集(避免误伤标准化诉求)

intel directive(L92 EE-5 必上 + L130-135 CD-3 显式负空间)已 D-03 + D-04 锁不重做。 Wave 0 STATE.md backlog 6 项除 M3 perf gate(R2-1)外其余 5 项(M1/M2/T1.2/T1.3/T5)细则由 planner 实占。

---

## § 5 预算

- **plan-phase**: ~2-3h(Wave A 并行 R1+R2 ~45min / Wave B planner ~60min / Wave C plan-checker ~30min — Phase 2.3 task 数估 ~22-28 子任务, 介于 Phase 2.1 的 23 与 Phase 2.2 的 ~32 之间, MIN scope discipline 控制)
- **execute-phase**: ~6-9 工作日(Wave 0 prereq 一次根治 ~2d / Wave 1 manifest schema 演进 ~1d / Wave 2 decision_rules + karpathy skill ~1.5d / Wave 3 EE-5 双层 gate ~1d / Wave 4 30 SAMPLES + arbitrate ≥85% ~1d / Wave 5 integration ~1d / Wave 6 ship ~0.5d)
- 沿袭 phase 1.5/2.1/2.2 batch 节奏(PP cadence — push + 并行 batch executor;期望 Wave 0/1 同 batch, Wave 2/3 同 batch, Wave 4/5 同 batch, Wave 6 final ship)

---

## § 6 phase 2.3 vs phase 2.2/2.4 边界

| 维度 | phase 2.2(已 ship) | phase 2.3(本 phase) | phase 2.4 |
|------|---------------------|---------------------|-----------|
| workflow | execute-task 主线 + ralph-loop full integration ✅ | extension category MVP + karpathy 注入引擎 | — |
| schema | phases.yaml + `model:` + contract v1.2 ✅ | decision_rules 三 category 段 + CD-3 `do_not_use_when:` / `if_rejected_use:` 字段 | — |
| ADR | ADR 0011 单一覆盖 Phase 2.2 全决策 ✅ | 新 ADR(编号 plan-phase 实占, 不预占 0012) | — |
| SDK | INTRODUCE + dual-signal completion ✅ | — | — |
| transparency | gate ENFORCE=true + 全史迁移 + freshness ext ✅ | M1+M2+M3 backlog 一次根治 | — |
| installer | 6 method dispatch frozen | extension category 6-7 真实 adapter 装配 | — |
| skill 注入 | — | karpathy-baseline.md SKILL-ONLY(不动 CLAUDE.md) | — |
| gate | — | EE-5 5-question merge gate 双层(CLI warn + plan-phase hard reject) | — |
| doctor | — | — | 完整版 jq/Git Bash 探测 + weekly cron + audit + ralph-loop Win 兼容 + EE-4 4 维 schema(候选 absorb) |
| sample 命中 | 30 ralph-loop COMPLETE ✅ | 30 category-specific routing ≥85% | 100+ sample × multi-model(v0.3.0 P3.3 prep) |

---

**phase 2.3 KICKOFF complete** — Wave A(R1 PATTERNS + R2 RESEARCH 并行, 带 anti-stall 约束)启动准备。
