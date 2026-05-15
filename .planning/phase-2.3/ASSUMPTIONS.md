# Phase 2.3 — ASSUMPTIONS

> **Authored**: 2026-05-16
> **Author**: gsd-planner (Wave B)
> **Sources**: `KICKOFF.md` § 1-6 / `2.3-CONTEXT.md` D-01~D-08 / `2.3-DISCUSSION-LOG.md` audit trail / `PATTERNS.md` D-WP-1~D-WP-8 / `RESEARCH.md` D2.3-1~D2.3-7 + Q1~Q5 open questions / `.planning/intel/omc-comparison.md` § 0 SSOT 引用纪律 + L92 EE-5 + L130-135 CD-3 + L86 5 题原型 / `.planning/ROADMAP.md` L109-112 + L121 / `.planning/STATE.md` L545+ Phase 2.3 Prereq Notes
> **Style**: 沿袭 phase 2.2 ASSUMPTIONS.md(§ A acceptance-bar status + § B lock 合并 + § C risks one-line mitigation + § D references)

---

## § A — F1-F8 Acceptance Bar Status Mapping

| Bar | What it asserts | Source artifact | Status entering plan-phase | Mapped Wave |
|-----|-----------------|-----------------|-----------------------------|-------------|
| **F1** | Wave 0 一次性根治 6 项:M1 schema regen gate + M2 intel 回填 + M3 perf gate ADR errata + 移出 CI critical path + T1.2 schemaVersion grep gate + T1.3 Win pwsh sentinel + T5 deferred-items review cadence | `.github/workflows/ci.yml` + `.github/workflows/perf-bench.yml`(NEW)+ `.planning/intel/omc-comparison.md` § 实施进度回填 + `scripts/check-deferred-items.mjs`(NEW)+ ADR errata + `RETROSPECTIVE.md` 模板 | INFRA partial(Phase 2.2 transparency + provenance ship);6 项全 PENDING | **Wave 0** |
| **F2** | extension category 6-7 adapter manifest 装配 + install 链路 e2e 通(design = ui-ux-pro-max 已 + frontend-design NEW;content = anthropics-skills-pptx NEW + anthropics-skills-slide-deck NEW;testing = playwright-test NEW + webapp-testing 已 + chrome-devtools-mcp NEW;karpathy-skills.yaml D-02 ADAPT REWRITE) | `manifests/skill-packs/frontend-design.yaml` + `manifests/skill-packs/anthropics-skills-pptx.yaml` + `manifests/skill-packs/anthropics-skills-slide-deck.yaml` + `manifests/tools/playwright-test.yaml` + `manifests/tools/chrome-devtools-mcp.yaml` + `manifests/skill-packs/karpathy-skills.yaml`(ADAPT REWRITE) | NOT started;5 NEW manifest + 1 REWRITE 全待 | **Wave 1** |
| **F3** | decision_rules 三 category 段 **升级**(R2 critical finding:已 ship,Phase 2.3 是 CD-3 字段 ADAPT 非 schema 段新建)+ CD-3 `do_not_use_when:` + `if_rejected_use:` optional fields + arbitrate 升级(D-WP-5 (b) `arbitrateWithRedirect()` legacy 保留) | `routing/decision_rules.yaml` MODIFY + `src/routing/decisionRules.ts` MODIFY(+~20L `arbitrateWithRedirect()` 新增 fn,旧 `arbitrate()` 不动 A7) | INFRA ship(decision_rules v2 + 8 rules + ui-task-bold-style-override priority 100 anchor production);CD-3 字段 + 新 fn 待 | **Wave 2** |
| **F4** | karpathy-baseline.md SKILL.md(D-02 SKILL-ONLY + D2.3-2 单文件 + `always_active: true` + git-clone-with-setup D2.3-3) + harnessed install karpathy-skills 装/卸 干净 + karpathy-skills.yaml D-02 REWRITE 删 CLAUDE.md sed-injection | `skills/karpathy-baseline/SKILL.md`(NEW,本仓库源 truth)+ `manifests/skill-packs/karpathy-skills.yaml`(REWRITE) | NOT started;现 manifest 仍走 CLAUDE.md sed(D-02 否决);SKILL.md 不存在 | **Wave 2** |
| **F5** | EE-5 5-question merge gate 双层(D-03 BOTH):CLI `harnessed manifest add <upstream>` 互动 5 问(readline)+ `--non-interactive` dry-run-only + plan-phase template § 7 节 + gsd-plan-checker BLOCKER rule | `src/cli/manifest-add.ts`(NEW ≤90L)+ `src/cli.ts`(register)+ `.planning/_templates/KICKOFF-TEMPLATE.md` § 7(NEW or KICKOFF.md 直接 convention)+ gsd-plan-checker rule | NOT started;5 题 wording planner 实占;readline interactive 新模式 | **Wave 3** |
| **F6** | 30 SAMPLES.md FRESH(D-05 不复用)+ arbitrate routing ≥85% 命中 + ≥1 "做出风格" anchor case(D-08 FE-DESIGN 主导) + 9 high-precision keywords(D2.3-4)+ ≥1 false-pos 负样本 | `.planning/phase-2.3/SAMPLES.md`(NEW,30 row R3 frozen Wave B per D-WP-7 (a))+ `tests/routing/arbitrate-redirect.test.ts`(NEW 30 sample harness) | NOT started;30 sample 选取 + acceptance signal planner R3 frozen | **Wave 4** |
| **F7** | A7 守恒 + integration tests(arbitrate-redirect + manifest-add EE-5 + 30-sample integration + Win sentinel)+ end-to-end install adapter → karpathy skill → arbitrate negative-space → EE-5 gate 全链路 | ADR errata draft(编号 plan-phase 实占)+ test files 全过 + ADR 0001-0011 main body 0 diff verify | NOT started | **Wave 5** |
| **F8** | Ship:3-OS CI 全绿 + adr-NN-accepted baseline tag(N 实占)+ ci.yml A7 iter 1-11 → 1-N + STATE.md + RETROSPECTIVE.md 续编 + `v0.2.0-alpha.3-extension-mvp` 候选 tag | `ci.yml` + git tag + `.planning/STATE.md` + `.planning/RETROSPECTIVE.md` | NOT started | **Wave 6** |

---

## § B — Consolidated Decision Locks

合并 4 处来源:**CONTEXT D-01~D-08**(discuss-phase 8 锁)+ **RESEARCH D2.3-1~D2.3-7**(researcher 决议 + R2 critical finding `decision_rules.yaml` v2 已 ship 三 category 段)+ **PATTERNS D-WP-1~D-WP-8**(pattern-mapper 提案 → plan-phase 决)+ **intel directive 必上两项**(EE-5 L92 + CD-3 L130-135)。同号但跨来源不同语义统一 → CONTEXT 主、RESEARCH 补、PATTERNS 提案选项。

### B.1 Extension Category Scope & Adapter 装配

| Lock | Decision | Source chain |
|------|----------|--------------|
| **B-01** | 3 category adapter scope = **MIN**(每 category 1-2 代表,decision_rules 加最小 rule 集) — design = ui-ux-pro-max(已)+ frontend-design(NEW);content = anthropics-skills-pptx + anthropics-skills-slide-deck(2 NEW);testing = playwright-test(NEW)+ webapp-testing(已)+ chrome-devtools-mcp(NEW)— 计 5 NEW + 2 已装 + 1 REWRITE(karpathy-skills.yaml D-02) | CONTEXT D-01 |
| **B-02** | frontend-design install method = **git-clone-with-setup**(沿袭 ui-ux-pro-max ship 路径 + sparse-checkout 子目录) — `manifests/skill-packs/frontend-design.yaml` 12 字段沿用 ui-ux-pro-max.yaml COPY scaffold(PATTERNS § 2.1) | PATTERNS § 2.1 → **PLANNER LOCK** |
| **B-03** | anthropics-skills-pptx + slide-deck install method = **npx-skill-installer**(D2.1-5 `--copy --global` 必带 + skills@1.5.7 pin) — ref=`anthropics/skills` 子目录 pptx / slide-deck;verify `test -f ~/.claude/skills/<sub>/SKILL.md`(D2.1-6 real-path) | PATTERNS row 2-3 → **PLANNER LOCK** |
| **B-04** | playwright-test install method = **npx-skill-installer**(若纯 CLI 则 npm-cli 但本 phase 沿 skill-pack 框架统一)— Wave 1 executor 视实际 npm 包 vs skill subdir 决,优先 npx-skill-installer 与 anthropics-skills 一致 | PATTERNS row 4 → **PLANNER LOCK** |
| **B-05** | chrome-devtools-mcp install method = **mcp-http-add**(Phase 2.1 6 method dispatch 现成)— `claude mcp add chrome-devtools-mcp --transport http <url>`;decision_rules trigger "perf / a11y / memory-leak / LCP / Core Web Vitals" 与现 `perf-a11y-memory` rule L79-95 一致 | PATTERNS § 2.2 → **PLANNER LOCK** |

### B.2 Karpathy SKILL.md Injection(D-02 SKILL-ONLY)

| Lock | Decision | Source chain |
|------|----------|--------------|
| **B-06** | karpathy-skills inject 机制 = **SKILL-ONLY**(`~/.claude/skills/karpathy-baseline/SKILL.md` always-on,不动 CLAUDE.md);低风险 ROADMAP L121 "karpathy behavior-rule 与用户私有 CLAUDE.md 冲突" 一键关闭 | CONTEXT D-02 |
| **B-07** | karpathy SKILL.md 形态 = **单文件 `~/.claude/skills/karpathy-baseline/SKILL.md`**(D2.3-2;不开 rules/*.md split;4 心法 cross-cutting <80L 全装;沿袭现役 ui-ux-pro-max skill 同模式) | RESEARCH D2.3-2 + § 2.1 → **PLANNER LOCK** |
| **B-08** | karpathy SKILL.md frontmatter = **`always_active: true`**(D2.3-2;Wave 4 spike 验证字段名是否被 Claude Code skill registry 真支持;若 fail fallback description-keyword 匹配 + self-reflexive prompt "ALWAYS apply...") | RESEARCH D2.3-2 + § 2.3 + A1 |
| **B-09** | karpathy install method = **git-clone-with-setup**(D2.3-3;复用 Phase 2.1 ship 路径 + sparse-checkout `skills/karpathy-baseline/`);ui-ux-pro-max 模式延续,D-01 MIN scope 守 Phase 2.1 6 method dispatch frozen(不开新 install_type) | RESEARCH D2.3-3 + § 2.4 |
| **B-10** | `manifests/skill-packs/karpathy-skills.yaml` = **REWRITE non-trivial**(D-02 否决现 CLAUDE.md sed-injection);install cmd 改 `cp -R skills/karpathy-baseline ~/.claude/skills/`(via git-clone-with-setup);verify `test -f ~/.claude/skills/karpathy-baseline/SKILL.md`;uninstall `rm -rf ~/.claude/skills/karpathy-baseline`;migration cleanup script 一次性清旧 CLAUDE.md `<!-- karpathy-skills:start/end -->` block(Q5 risk MEDIUM,本 lock 含 mitigation) | RESEARCH § 2.4 + Q5 |

### B.3 EE-5 5-question Merge Gate(D-03 BOTH)

| Lock | Decision | Source chain |
|------|----------|--------------|
| **B-11** | EE-5 安装位置 = **BOTH**(CLI prompt warn-only + plan-phase template hard reject)— 双层防 thin wrapper / import 别人产品身份 | CONTEXT D-03 + intel L92 |
| **B-12** | EE-5 CLI 实现 = **`src/cli/manifest-add.ts` NEW**(10th register fn 模式 + readline.question 互动 5 题);≤90L;`--non-interactive` 跳 dry-run-only(不绕过 plan-phase hard reject — D-03 锁);`--apply` × `--dry-run` × `--non-interactive` H1 gate 沿袭 research.ts L37-43 exit-2 pattern;dependencies = readline/promises 内建(无新 inquirer.js,Karpathy YAGNI) | CONTEXT D-03 + PATTERNS § 2.6 → **PLANNER LOCK** |
| **B-13** | 5 题 exact wording(planner 实占,基于 intel L86 原型):① 这是真 reusable surface 还是临时 wrapper?② 上游名字 fit 项目 shape 吗?有现有命名冲突吗?③ 与已装配组件有 overlap surface 吗?④ 是 import 概念(可控)还是 import 别人产品身份(高耦合)?⑤ user 不知 upstream 还能理解该装配吗? | CONTEXT D-03 + intel L86 + PATTERNS § 2.6 → **PLANNER LOCK** |
| **B-14** | plan-phase template gate = **KICKOFF.md § 7 节(if any new upstream adapter)** + gsd-plan-checker BLOCKER rule:若 KICKOFF 列出新 upstream adapter 且 § 7 任一题未答 → BLOCKER(沿袭 phase 2.2 plan-checker verdict 严苛度) | PATTERNS § 1 row 12 + D-03 |

### B.4 CD-3 Negative-space + Redirect(D-04 DR-only)

| Lock | Decision | Source chain |
|------|----------|--------------|
| **B-15** | CD-3 syntax + 位置 = **DR-only**(`routing/decision_rules.yaml` 单一 SSOT 加 optional fields `do_not_use_when:` + `if_rejected_use: <component-id>`,不开第二来源避免 schema 分裂) | CONTEXT D-04 + intel L130-135 |
| **B-16** | CD-3 字段 TypeBox schema 形态 = **open record (D-WP-1 (b) do nothing)** — 现 `RuleSchema.decision` 已 `T.Record(T.String(), T.Unknown())` 完全 open(decisionRules.ts L40-46),无需 schema bump;arbitrate consume narrowly typed cast | PATTERNS D-WP-1 → **PLANNER LOCK** |
| **B-17** | per-manifest hint 层冗余字段 = **加**(Q3 — manifest.spec.decision_rules 加 do_not_use_when + if_rejected_use 作冗余守护;不破 D-04 DR-only 因 per-manifest 历来是 fallback hint,全局 yaml 仍是 SSOT) | RESEARCH Q3 → **PLANNER LOCK** |
| **B-18** | `arbitrate()` 升级路径 = **D-WP-5 (b) 保留 legacy + 新 `arbitrateWithRedirect()`**(返 `ArbitrateResult = matched\|rejected\|none` discriminated union);engine.route() 用新 fn,既存 phase 1.4-2.2 routing-engine.test.ts byte-stable + A7 守恒 | PATTERNS D-WP-5 + RESEARCH D2.3-7 → **PLANNER LOCK** |
| **B-19** | arbitrate rejected path 调用方 = **D-WP-4 (b) 直接以 redirectTo 作 primary_expert**(跳过二次 arbitrate;Karpathy 最简 + 防 cycle 天然);单层 redirect,Phase 2.3 不做多层级联 | PATTERNS D-WP-4 + RESEARCH D2.3-7 → **PLANNER LOCK** |

### B.5 30 SAMPLES.md FRESH(D-05 + D-08)

| Lock | Decision | Source chain |
|------|----------|--------------|
| **B-20** | 30 SAMPLES.md = **FRESH-30**(D-05 不复用 Phase 2.2 6×5 cross-domain,Phase 2.3 是 3 category × 10 routing 命中,测试维度不同) | CONTEXT D-05 |
| **B-21** | 30 sample 分布:**10 design + 10 content + 10 testing**;每 category 含 anchor / non-anchor / cross-category edge / CD-3 negative-space disqualify edge **各至少 1**;design 段必含 ≥1 "做出风格" anchor case(D-08 frontend-design 主导)+ ≥1 false-pos 负样本(D2.3-4 验 9 keyword 词集 precision) | CONTEXT D-05 + D-08 + RESEARCH § 3.2-3.3 |
| **B-22** | SAMPLES.md frozen 时机 = **Wave B planner 编写 + Wave C plan-checker 审 + execute-phase R3 frozen 不允许改**(D-WP-7 (a);沿袭 phase 1.4 / 2.2 SAMPLES.md plan-phase Wave B frozen 模式) | PATTERNS D-WP-7 → **PLANNER LOCK** |
| **B-23** | "做出风格" anchor regex 词集 = **9 high-precision keywords**(D2.3-4):做出风格 / 独创 / 风格化 / 品牌调性 / design-led / distinctive / signature style / art direction / bold style;**REMOVE** 独特(false-pos 太高 "独特的搜索方案" 误命中);KEEP-with-caveat creative + experimental(已 ship,SAMPLES 边界 case 验证) | RESEARCH D2.3-4 + § 3.3 |
| **B-24** | D-08 redirect 主导路径 = **anchor priority-100 rule 直接 set(`ui-task-bold-style-override` L29-46 现 production)+ CD-3 manifest hint 层冗余守护**(D2.3-5;正交不冲突,双道防漂移) | RESEARCH D2.3-5 + § 3.4 |

### B.6 Wave 0 Prereq 一次根治(D-07 ALL-W0)

| Lock | Decision | Source chain |
|------|----------|--------------|
| **B-25** | Wave 0 处理 = **ALL-W0**(全 6 项 Wave 0 一次根治) — 沿袭 Phase 2.1/2.2 Wave 0 模式,引重但后面净 | CONTEXT D-07 |
| **B-26** | **M1 schema regen CI gate** = `.github/workflows/ci.yml` 加 step `corepack pnpm build:schema && git diff --exit-code schemas/`(~10L) — RETROSPECTIVE Lesson 6 自我建议落地 | CONTEXT D-07 + PATTERNS § 2.8 + Phase 2.2 RETROSPECTIVE |
| **B-27** | **M2 intel 实施进度回填** = `.planning/intel/omc-comparison.md` L236-238 加 `## 实施进度回填` 节,每 entry 标 `IMPL: Phase 2.2 (commit hash)` 或 `PENDING`(纯文档,无 CI) | CONTEXT D-07 + § 0 SSOT 引用纪律 |
| **B-28** | **M3 perf gate 根治策略 = D2.3-1 候选 (a) 移出 CI critical path**(advisory nightly only) — 新 `.github/workflows/perf-bench.yml`(~25L cron `0 3 * * *` + advisory annotation)+ `ci.yml` 删 perf.test.ts step(保留 file 但 `it.skip(IS_GHA)`);Karpathy 真根治;4 累计 nudge anti-pattern 终结;vitest/Next.js/Deno 业内 advisory-only 共识 | RESEARCH D2.3-1 + § 1.3 |
| **B-29** | **T1.2 schemaVersion consumer gate** = `ci.yml` grep gate `grep -r "branchOnSchemaVersion(" src/ \| wc -l ≥ 2`(**B1 plan-check fix**: ≥7 → ≥2 honest baseline reflecting Phase 2.2 W2 helper-only adoption — consumer count = 2 at Phase 2.3 start: `src/types/schemaVersion.ts` 定义 + 1 self-reference;Phase 2.3+ 逐步扩 7 surface,详 ADR 0012 § 7 errata) | CONTEXT D-07 + Phase 2.3 Wave C plan-check fix |
| **B-30** | **T1.3 Win provenance sentinel** = `ci.yml` Win-only pwsh step `if: runner.os == 'Windows'` + `shell: pwsh` + `pwsh -c "node scripts/check-provenance.mjs"`(Win path-sep 行为验) | CONTEXT D-07 + PATTERNS § 2.8 |
| **B-31** | **T5 deferred-items review** = **D-WP-6 (b) markdown 模板 + warn-only CI script**(`scripts/check-deferred-items.mjs` 沿袭 check-transparency-verdicts.mjs walker pattern ~80L,ENFORCE=false round 1) + RETROSPECTIVE.md 模板加 `## Deferred items review` 节;round 2 ENFORCE 推迟到下 phase | PATTERNS D-WP-6 + § 2.7 |
| **B-32** | Wave 0 task 排序 = **M3 first**(后续 wave CI 稳定性依赖 perf gate 移出 critical path)→ M1 + T1.2 + T1.3 同 Wave 0(ci.yml 同文件改动 sequential)→ M2 + T5(纯文档 + new script,parallel)→ ADR draft sketch(T0.x)| CONTEXT D-07 hint + 推理 |

### B.7 ADR & A7 守恒

| Lock | Decision | Source chain |
|------|----------|--------------|
| **B-33** | **新 ADR errata 覆盖 Phase 2.3 全决策**(沿袭 phase 1.4 ADR 0008 + phase 2.2 ADR 0011 多决策合并 errata 模式)— 内部章节 sketch 5:① extension category MVP 装配 + manifest schema ② CD-3 negative-space + if_rejected_use + arbitrateWithRedirect ③ EE-5 5-question merge gate 双层 ④ karpathy SKILL-ONLY 注入 + always_active 形态 ⑤ Wave 0 perf gate 根治(移出 CI critical path)+ schemaVersion grep gate + deferred-items review cadence | CONTEXT D-06(EE-4 DEFER-2.4)+ KICKOFF § 3.2 |
| **B-34** | **ADR 编号 = plan-phase 实占,绝不预占**(intel § 0 + CONTRIBUTING.md 项目级 SSOT 引用纪律)— 本 phase 所有文档(KICKOFF/PATTERNS/RESEARCH/ASSUMPTIONS/PLAN/task_plan/NEW ADR)写 `0012` placeholder;**禁写 `ADR 0012`**;T0.1 sed-replace discipline 批量 resolve(Phase 2.1 W1 plan-check fix 沿袭) | PATTERNS D-WP-8 + KICKOFF § 3.2 |
| **B-35** | **A7 守恒持续**:ADR 0001-0011 main body **0 diff**;新 ADR 走 errata 路径;ship 时 baseline tag `1-11 → 1-0012`;CI `ci.yml` A7 step iter 同步;`docs/AGENT-DEFINITION-FACTORY-CONTRACT.md` + `docs/INSTALLER-CONTRACT.md` main body 不动;`arbitrate()` legacy 保留(B-18)避免 30-sample routing-engine.test.ts byte-stable 回归 | KICKOFF § 3.1 + B-18 |

### B.8 Karpathy Hard Limits & File Split

| Lock | Decision | Source chain |
|------|----------|--------------|
| **B-36** | Karpathy 5 hard limit 继承:`engine.ts` ≤200L / `agentDefinition.ts` ≤200L(H3 errata cap)/ `systemPrompt.ts` ≤80L / `ralphLoop.ts` ≤50L 主体 / `promiseExtract.ts` ≤50L;**Phase 2.3 不动 engine.ts 主体**(arbitrate 改在 decisionRules.ts);decisionRules.ts 现 ~180L + `arbitrateWithRedirect()` ~20L + helper ~5L ≈ ~205L → **可能超** → fallback split 到 `src/routing/lib/arbitrateRedirect.ts`(B-18 (b) 默认 inline,超 200L 时 split) | KICKOFF § 3.6 + PATTERNS § 2.4 |
| **B-37** | manifest yaml hard limit = **≤60L each**(沿袭 ui-ux-pro-max.yaml 55L);decisionRules.ts arbitrate 升级 ≤+20L;karpathy-baseline.md SKILL.md ≤80L(D2.3-2);manifest-add.ts EE-5 CLI ≤90L(沿袭 research.ts 93L scaffold);check-perf-bench.yml ≤50L;check-deferred-items.mjs ≤80L;SAMPLES.md ≤250L | KICKOFF § 3.6 + 推理 |
| **B-38** | TypeBox not zod — schema 改动用 `@sinclair/typebox` `Type.*`;沿袭 ADR 0010/0011 errata 注释块 fence 模式;新 ADR errata 注释行 `// ADR 0012 errata — <topic> (phase 2.3 W<N> — F<N>)` | KICKOFF § 3.3 |
| **B-39** | A8 LF line endings — 所有新文件 LF;Win 测试需 Git Bash;新 SAMPLES.md + SKILL.md + decision_rules.yaml CD-3 字段 + 5 NEW manifest yaml 全 LF;Win sentinel T1.3 验 path-sep 行为 | KICKOFF § 3.9 |

### B.9 RESOLVED conflict chain notes

- **R2 critical finding** vs **KICKOFF § 1 F3 wording** — KICKOFF 草稿写 "三 category 段 schema 加",R2 RESEARCH 发现 `decision_rules.yaml` v2 **已 ship** design(2 rules)/ content(2 rules)/ testing(4 rules)三段 + `ui-task-bold-style-override` priority 100 anchor production at L29-46。 **统一**:F3 文案改为 "三 category 段 schema **升级**(CD-3 字段)+ 现 8 rules 微调 + 加 1-2 anchor/negative-space rule"(D2.3-6);ADR errata 章节 ① wording 同步。沿袭 Phase 2.2 Wave B 也调过 KICKOFF wording 先例(允许)。
- **D-WP-1 (a/b/c) PATTERNS proposal** → **B-16 = (b) open record do nothing**(原因:`decision` 已 open record + Karpathy YAGNI + A7 守恒不打破 schema gate)
- **D-WP-2 (a/b/c) PATTERNS proposal** + **D2.3-2 RESEARCH 推荐** → **B-07 = (a) 单文件 SKILL.md**(原因:现役 ui-ux-pro-max 实证 + 4 心法 cross-cutting <80L 全装 + description-field <1024B 余量足)
- **D-WP-3 (a/b/c) PATTERNS proposal** + **D2.3-1 RESEARCH 推荐** → **B-28 = (a) 移出 CI critical path**(原因:vitest/Next.js/Deno 业内共识 + Karpathy 真根治 + 4 累计 nudge anti-pattern 终结)
- **D-WP-4 + D-WP-5 PATTERNS proposal** + **D2.3-7 RESEARCH ~15L 增量** → **B-18 + B-19 = (b) legacy 保留 + 新 fn `arbitrateWithRedirect()`**(原因:A7 守恒 + 30-sample byte-stable + 防 cycle by-default)
- **D-WP-6 (a/b/c) PATTERNS proposal** → **B-31 = (b) markdown 模板 + warn-only CI script**(原因:沿袭 Phase 2.1 transparency W3 warn-only round 1 + W4 ENFORCE 阶梯)
- **D-WP-7 (a/b) PATTERNS proposal** → **B-22 = (a) Wave B frozen**(原因:沿袭 phase 1.4 / 2.2 SAMPLES.md plan-phase Wave B frozen + execute-phase 不允许改触发 ADR errata)
- **D-WP-8 PATTERNS** + **KICKOFF § 3.2 + intel § 0 + CONTRIBUTING.md** → **B-34 = ADR 编号不预占,T0.1 sed-replace `0012`**(单线性 solo 开发无并发风险,Phase 2.1 W1 plan-check fix 沿袭)
- **Q3 per-manifest hint vs DR-only D-04** — RESEARCH Q3 推荐"加 per-manifest hint 作冗余守护",**B-17 LOCK** 该路径不破 D-04 DR-only(per-manifest 历来是 fallback hint,全局 yaml 仍是 SSOT)
- **Q5 karpathy-skills.yaml backward compat** — RESEARCH Q5 推荐"install 时跑 migration cleanup script 一次性清旧 CLAUDE.md block",**B-10 LOCK** 含 mitigation(清除而非注入,符合 D-02 精神)

**No unresolved cross-source conflicts.** All decision chains converge.

---

## § C — Risk Register

| ID | Risk | Severity | Mitigation(one-line) |
|----|------|---------|----------------------|
| **R1** | `always_active: true` frontmatter 字段在 Anthropic skill spec 未完整公开文档(RESEARCH A1 MED-HIGH conf) | LOW | Wave 4 T4.1 装最小 SKILL.md spike(<30 min)验证;若 fail fallback description-keyword 匹配 + self-reflexive prompt "ALWAYS apply ... coding"(RESEARCH § 2.3) |
| **R2** | `decisionRules.ts` 现 ~180L + `arbitrateWithRedirect()` ~20L 可能超 200L hard limit(B-36) | LOW-MEDIUM | 默认 inline;若 `wc -l` > 200 fallback split 到 `src/routing/lib/arbitrateRedirect.ts`(沿袭 Phase 2.2 sdkReconcile.ts split 模式) |
| **R3** | `manifests/skill-packs/karpathy-skills.yaml` REWRITE 后旧用户 CLAUDE.md 残留 `<!-- karpathy-skills:start/end -->` block(Q5) | MEDIUM | Wave 2 install 时 migration cleanup script `sed -i '/karpathy-skills:start/,/karpathy-skills:end/d' ~/.claude/CLAUDE.md` 一次性清旧 block + 提示 user(清除非注入,符合 D-02 精神);uninstall 时同步 |
| **R4** | 30 SAMPLES.md ≥85% 命中(30 中 ≥26)实测不达 — anchor regex 9 keywords 误伤 OR 误漏(D2.3-4 A4 MED-HIGH conf) | LOW-MEDIUM | Wave 4 SAMPLES.md frozen + Wave 5 跑 arbitrate harness;若 <26 → SAMPLES.md miss 节列入 + Wave 4 R4 fallback 微调 9 keywords(remove false-pos / add false-neg);沿袭 phase 1.4 SAMPLES.md miss 节模式 |
| **R5** | EE-5 5 题 CLI readline `--non-interactive` 被误用绕过 plan-phase hard reject(D-03 锁明确不绕过) | LOW | `--non-interactive` 跳 dry-run-only(不 commit manifest state);plan-phase gsd-plan-checker BLOCKER rule 双层守护(B-14);CLI emit `[ee-5-gate] WARN: --non-interactive skips prompt; plan-phase template hard reject still applies`(PATTERNS § 2.6) |
| **R6** | M3 perf gate 移出 CI critical path 后 1 night latency 内 schema 改动 regression 漏(D2.3-1 A5 HIGH conf) | LOW | Schema 改动 PR review 兜底(maintainer hand-review);nightly cron 第二天 GHA `::warning::` annotation;1 night 可接受 industry standard(vitest/Next.js advisory) |
| **R7** | ADR 编号实占冲突(plan-phase 实占 N 时,git 上已有 N — 并发其他 phase 占了) | LOW | T0.1 第一步 `ls docs/adr/` + `max(NNNN) + 1`;solo 开发无并发;沿袭 phase 2.1 W1 plan-check fix sed-replace discipline(B-34) |
| **R8** | manifest yaml ≤60L hard limit 突破 — frontend-design.yaml 加 decision_rules 内联 hint + 5 字段 CD-3 redundant 可能超 60L | LOW | 沿袭 ui-ux-pro-max.yaml 55L 模板 1:1 scaffold(PATTERNS § 2.1);CD-3 hint 仅 `override_signals + phrase + use` 3 行;若 fail fallback 砍 metadata.upstream.notice 长描述 |
| **R9** | `git-clone-with-setup` sparse-checkout `skills/karpathy-baseline/` 单子目录实现复杂(RESEARCH Q2 A2 MED conf) | LOW | Wave 2 executor 优先 sparse-checkout;若 install LOC > ~30L 复杂度大 → fallback 直接 `cp -R skills/karpathy-baseline ~/.claude/skills/`(本仓内 source-of-truth 直接 copy,不开新 install_type,守 D-01 MIN scope) |

---

## § D — References

### D.1 In-phase 上游产出
- `.planning/phase-2.3/KICKOFF.md` — § 1-6(F1-F8 + Wave 拓扑 + 9 hard constraint + R1/R2 分工 + 预算 + 边界)
- `.planning/phase-2.3/2.3-CONTEXT.md` — discuss-phase 8 D-决策 D-01~D-08 + canonical refs
- `.planning/phase-2.3/2.3-DISCUSSION-LOG.md` — audit trail
- `.planning/phase-2.3/PATTERNS.md` — 14 file analog mapping + ~86% reuse + 8 D-WP proposals
- `.planning/phase-2.3/RESEARCH.md` — 3 focused topics + 7 D2.3-* decision locks + Q1-Q5 open questions + R2 critical finding

### D.2 Carry-forward 主依据
- `.planning/intel/omc-comparison.md` — L86 EE-5 5 题原型 + L92 EE-5 必上 + L130-135 CD-3 显式负空间 + § 0 SSOT 引用纪律 + § v0.2.0+ actionable table
- `.planning/ROADMAP.md` v0.2.0 Phase 2.3 — L109-112 Goal + 必含项 + 验收(30 category-specific 样本 ≥85% 含 override "做出风格")+ L121 关键风险(karpathy CLAUDE.md 冲突一键关闭)
- `.planning/STATE.md` L545+ Phase 2.3 Prereq Notes 6 项 backlog + L553 M3 3-tier ADR errata direct cite
- `.planning/phase-2.2/2.2-CONTEXT.md` D-09/D-10 — ADR 拆分约定(0011 = Phase 2.2 全决策;Phase 2.3 新 ADR 编号 plan-phase 实占,**不预占 0012**)
- `.planning/phase-2.2/RETROSPECTIVE.md` Lesson 6 — schema regen CI gate 自我建议未实施 → Phase 2.3 Wave 0 M1 落地

### D.3 Frozen 接口契约(本 phase 升级或消费)
- `src/routing/engine.ts` — main-process-driven routing + SDK query() + ralph-loop wrap(Phase 2.2 ship,本 phase 不动接口)
- `src/routing/decisionRules.ts` ~180L — arbitrate v1 + matchesWhen F42 array semantic + schemaVersion branchOnVersion;本 phase **加 `arbitrateWithRedirect()`**(~+20L,legacy 保留)
- `src/routing/agentDefinition.ts` — AgentDefinition v1.2 14 字段(Phase 2.2 ship,本 phase 不动)
- `src/installers/index.ts` — 6 install method dispatch table(Phase 2.1 ship,本 phase 直接调用)
- `src/routing/lib/ralphLoop.ts` — `ralphLoopWrap` ≤50L wedge(D1.4-3 lock 永久架构)
- `src/cli/research.ts` 93L — 10th register fn scaffold(本 phase `manifest-add.ts` 沿袭)
- `routing/decision_rules.yaml` v2 — 已 ship design/content/testing 三段 + 8 rules + `ui-task-bold-style-override` priority 100 anchor production at L29-46
- `src/manifest/schema/spec.ts` — TypeBox manifest schema(`RuleSchema.decision` 已 open record,本 phase **no schema bump**)
- `docs/AGENT-DEFINITION-FACTORY-CONTRACT.md` + `docs/INSTALLER-CONTRACT.md` — A7 守恒不动 main body
- `manifests/skill-packs/ui-ux-pro-max.yaml` 55L — git-clone-with-setup 模板 + override_signals shape(本 phase 5 NEW manifest COPY scaffold)
- `manifests/skill-packs/karpathy-skills.yaml` 40L — D-02 否决,本 phase **REWRITE non-trivial**
- `scripts/check-transparency-verdicts.mjs` — Phase 2.2 T1.7 ENFORCE=true ship + freshness ext;本 phase 沿用 + 沿袭其 walker pattern(check-deferred-items.mjs)
- `scripts/check-provenance.mjs` — Phase 2.2 T4.0 ship;本 phase Wave 0 T1.3 加 Win pwsh sentinel
- `.github/workflows/ci.yml` — 3-OS matrix + transparency + provenance step;本 phase Wave 0 M1 + T1.2 + T1.3 + 删 perf step + 新 perf-bench.yml

### D.4 Milestone refs
- `.planning/v0.1.0-MILESTONE-AUDIT.md` — milestone shipped baseline
- `.planning/phase-2.2/SAMPLES.md` — R3 frozen 30 sample selection rationale(本 phase D-05 不复用 FRESH-30)
- `.planning/phase-1.4/SAMPLES.md` — phase 1.4 R3 frozen 原版

---

*Phase 2.3 ASSUMPTIONS.md complete — § A 8 acceptance bars mapped to 7 Wave / § B 39 lock 全消化 4 来源(CONTEXT 8 + RESEARCH 7 + PATTERNS 8 + intel 直引 + KICKOFF + planner inference;0 unresolved conflict)/ § C 9 risk 全 mitigation / § D references full chain.*

*Wave B planner LOCK status: 13 PATTERNS D-WP-* + 7 RESEARCH D2.3-* + 8 CONTEXT D-* = **28 sources → 39 B-locks consolidated**(含 inference 推导 4 lock)。 No carry-forward issue to Wave C plan-checker。*
