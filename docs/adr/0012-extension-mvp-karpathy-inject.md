# ADR 0012: extension category MVP + karpathy SKILL inject 引擎 + EE-5 双层 + CD-3 negative-space + 30-sample routing ≥85% + Wave 0 backlog 根治 (phase 2.3 — 9 章节 errata 合并)

## Status

**Accepted (phase 2.3 W6 — 2026-05-16)** — phase 2.3 plan-phase Wave 0 sketch (T0.2 5 章节 draft) → Wave 6 fill-out (T6.1 9 章节 expand) → Accepted at phase 2.3 ship。

> Phase 2.3 extension category MVP + karpathy 注入 + 30-sample routing harness 的合并 ADR — 沿袭 ADR 0008 / 0009 / 0010 / 0011 多决策合并 errata 模式 (B-20 lock)。**2026-05-16 W6 fill-out**：原 5 章节扩 9 章节 (加 § 6 Consequences / § 7 Compliance / § 8 Errata-path note / § 9 Adoption-confirmation)。**T0.10 always_active spike FAIL → R2 A1 fallback locked**（description-keyword + self-reflexive prompt）。

## Context

Phase 2.3 是 v0.2.0 sub-task loop 里程碑的第 3 phase — 把 Phase 2.2 ship 后的 execute-task workflow + ralph-loop full integration 升级为「3 extension category (design / content / testing) MVP 装配 + karpathy behavior-rule SKILL-ONLY 注入 + 30 category-specific 样本 routing ≥85% 命中」(含 D-08 "做出风格" override anchor)。

装配 6-7 真实 adapter (design = `ui-ux-pro-max` 已装配 + `frontend-design` 新; content = `anthropics-skills` pptx/slide-deck 新; testing = `playwright-test` 新 + `webapp-testing` 已装配 + `chrome-devtools-mcp` 新), 用 `decision_rules` MIN scope 最小 rule 集驱动 arbitrate, 升级 `arbitrate()` 读 CD-3 negative-space `do_not_use_when:` + `if_rejected_use:` 重定向 (~15L)。

并办 STATE.md L545+ Phase 2.3 Prereq Notes 6 项 backlog 一次根治 — M1 schema regen CI gate / M2 intel 实施进度回填 / M3 perf gate 根治 (移出 CI critical path) / T1.2 schemaVersion consumer call site gate / T1.3 Win pwsh provenance sentinel / T5 deferred-items review cadence — 沿袭 Phase 2.1/2.2 Wave 0 一次根治模式。

### A7 守恒约束 (ADR 0001-0011 main body 不可改)

phase 2.3 沿袭 ADR 0003 / 0005 / 0007 / 0008 / 0009 / 0010 / 0011 errata 风格 — **不动 ADR 0001-0011 main body** (A7 守恒)。 baseline tag iterate 11 → 12 (Wave 6 T6.2 ship 时 push `adr-0012-accepted` tag, ci.yml A7 step iter `1-11` → `1-0012`)。 本 ADR 0012 起 phase 2.3 ship 时刻 frozen; v0.2.4+ 演化走 ADR 0013+ errata。

## Decisions

### 1. extension category MVP 装配 (B-01 ~ B-05 / D-01)

`manifests/<category>/<adapter>.yaml` 6-7 entry MIN scope 验证 install 链路通 (沿袭 Phase 2.1 6 install method dispatch):

- **design**: `ui-ux-pro-max` (已装配, 复用 Phase 2.1) + `frontend-design` (新, git-clone-with-setup, D-08 "做出风格" anchor 主导)
- **content**: `anthropics-skills` pptx + slide-deck (新, npx-skill-installer 或 git-clone-with-setup, planner 实占)
- **testing**: `playwright-test` (新, npx) + `webapp-testing` (已装配) + `chrome-devtools-mcp` (新, mcp-http-add)

**Wave 1 实测 (T1.1-T1.6, commits `ae4f984` ~ `a23fe91`)**: 5 NEW manifest ship + e2e dry-run integration test `tests/integration/install-5-adapters.dry-run.test.ts` 全 PASS。 manifest 总数 (with existing): design 2 / content 2 / testing 3 = 7 entry.

karpathy YAGNI MIN scope discipline: 不预扩 role-router scoring 中间层 (EE-1 推 v0.3+), 不扩 9-field manifest schema (EE-2 推 Phase 2.4)。

### 2. karpathy SKILL-ONLY 注入 (B-06 ~ B-10 / D-02)

`~/.claude/skills/karpathy-baseline/SKILL.md` always-on skill 形态 (Think Before Coding / Simplicity First / Surgical Changes / 小步原子修改 / Goal-Driven / 最小有效代码 ≤心法精炼)。 **不动 CLAUDE.md** (低风险 ROADMAP L121 "karpathy behavior-rule 与用户私有 CLAUDE.md 冲突" 一键关闭)。 `harnessed install karpathy-skills` 装/卸 干净 (沿袭 Phase 2.1 install_type 字段 + provenance 4 字段)。

**Wave 0 T0.10 spike outcome = FAIL** (commit `20cf8f5`)：SDK 0.3.142 `skillFrontmatter` 只 extract `name + source + tokens`；无 `always_active` / `auto_load` / `always_on` 任何字段变体。 R2 ASSUMPTION A1 (MED-HIGH confidence) 验证 wrong → fallback locked (R2 A1 secondary):

- SKILL.md frontmatter 不含 `always_active: true`
- `description:` 字段用 high-precision keyword 集 (e.g. "ALWAYS apply Karpathy 4 心法 baseline: ...")
- SKILL.md body 首段 self-reflexive prompt "ALWAYS apply these 4 心法 to every coding decision..."
- Claude Code session start 时 description-keyword discovery + LLM 看到首段 prompt 自我激活

**Wave 2 实测 (T2.3 + T2.4, commits `0ccb58d` + `b97677d`)**：`skills/karpathy-baseline/SKILL.md` NEW + `manifests/skill-packs/karpathy-skills.yaml` D-02 SKILL-ONLY (cp -R 路径 + strip-claude-md-section.mjs migration cleanup)。 spike-first sequence (W1 plan-check fix 反序 → Wave 0) 把"先 ship 后 spike"避免 → W2 T2.3 SKILL.md 设计已 informed。

### 3. EE-5 5-question merge gate 双层 (B-11 ~ B-14 / D-03)

intel L92 EE-5 反 thin wrapper 必上 — 5 题:① reusable surface? ② name fit + conflict? ③ overlap with 已装配? ④ concept vs identity import? ⑤ user 无 upstream 理解?

**双层防御**:
- **L1 CLI 互动**: `harnessed manifest add <upstream>` 5 题 prompt (commander.js + inquirer/prompt), `--non-interactive` 跳 dry-run-only (不绕过 hard reject)
- **L2 plan-phase 模板 + gsd-plan-checker BLOCKER**: KICKOFF/PLAN 模板加 § 7 EE-5 self-meta 节 (若 phase 引入新 upstream adapter), gsd-plan-checker 若 5 题任一未答 → BLOCKER (非 warning)

**Wave 3 实测 (T3.1 + T3.2 + T3.3, commits `ce9f42e` + `686233a` + `d6489bb`)**：`src/cli/manifest-add.ts` NEW 78L + cli.ts register 11 subcommands + `tests/cli/manifest-add-ee5.test.ts` NEW 133L 6 cells (register / non-interactive exit 2 / WARN dry-run / 5Q readline mock / --apply 5-field write / empty reject)。 本 phase 2.3 KICKOFF § 7 已 self-instance EE-5 5 题 × 5 adapter = 25 answers (W5 plan-check fix Karpathy simplicity inline 在 task_plan.md T1.1-T1.5)。

### 4. CD-3 negative-space + if_rejected_use (B-15 ~ B-19 / D-04)

intel L130-135 CD-3 显式职责负空间必上 — `decision_rules.yaml` schema 加 optional fields:
- `do_not_use_when: <regex/keyword 集>` (component 不适用条件)
- `if_rejected_use: <component-id>` (redirect target)

`arbitrate()` 升级 (~15L code) 读 negative-space → match → down-rank; reject 时返回 redirect target component。 单一 SSOT (`routing/decision_rules.yaml` 不开第二来源避免 schema 分裂)。 arbitrate() legacy 保留 (B-18) 避免 30-sample routing-engine.test.ts byte-stable 回归。

**Wave 2 实测 (T2.1 + T2.2 + T2.5, commits `4ac1677` + `24ecbf2` + `8f0ef69`)**：`decision_rules.yaml` 加 9 keywords + 3 negative-space rules + `arbitrateWithRedirect` proactive split (B-18 + ≤200L hard limit 守住)。 per-manifest hint mirror `do_not_use_when` + `if_rejected_use` (B-17 + S3)。 **Wave 5 实测 (T5.1, commit `f13ca63`)**：`tests/unit/routing-arbitrateRedirect.test.ts` +3 complementary cells (CD-3 disqualify cascade + false-pos guard + multi-keyword OR, 90L→166L) — T5.1 4-cell spec 功能由 W2 T2.2 d6489bb 6 cells 覆盖, DRY consolidation。

### 5. SAMPLES.md FRESH-30 (B-20 ~ B-24 / D-05)

`.planning/phase-2.3/SAMPLES.md` 全新 10 design + 10 content + 10 testing 样本 (D-05 FRESH-30 不复用 Phase 2.2 6 category × 5 cross-domain), 包含 ≥1 "做出风格" anchor case (D-08 frontend-design 主导, regex anchor 候选词集 RESEARCH § 3 实测后确定)。

arbitrate 实测 **≥85% 命中** (沿袭 phase 1.4 R3 frozen rationale 模式, Phase 2.3 SAMPLES.md 自身重置 frozen)。 ROI 显著优于 real-API integration test (Phase 2.2 Lesson 5 mock-based wiring harness pattern 复用)。

**Wave 4 实测 (T4.1 + T4.3, commits `1d7d5aa` + `2c4442e`)**：30 FRESH samples (10/10/10 + 5 anchor + 1 false-pos + 4+ CD-3 disqualify edges) + `tests/routing/samples-30.test.ts` NEW = **30/30 (100%) hit rate**。 D-05 ≥85% acceptance bar **远超达成** (15% headroom). T4.2 spike 已 W0 ship → SKIPPED Resolved 占位 (commit `6306cfd`)。

### 6. Consequences

**Capability deltas (Phase 2.3 ship 后新增):**

| Capability | Delta | Verify |
|------------|-------|--------|
| extension category 3 MVP | 5 NEW manifest (frontend-design / anthropics-skills × 2 / playwright-test / chrome-devtools-mcp) | `tests/integration/install-5-adapters.dry-run.test.ts` |
| arbitrateWithRedirect | CD-3 negative-space + if_rejected_use redirect (~15L) | `tests/unit/routing-arbitrateRedirect.test.ts` 6+3 cells |
| EE-5 CLI gate | `harnessed manifest-add` 5Q readline 互动 (78L) + dual-layer (CLI L1 + plan-phase L2) | `tests/cli/manifest-add-ee5.test.ts` 6 cells |
| karpathy SKILL-ONLY | description-keyword + self-reflexive prompt (T0.10 fallback locked) — CLAUDE.md 不动 | install karpathy-skills + idempotent_check |
| 30-sample routing harness | 100% (30/30) hit rate, ≥85% bar 远超 | `tests/routing/samples-30.test.ts` |
| Wave 0 backlog 根治 | 6 项 (M1/M2/M3/T1.2/T1.3/T5) 一次 ship + perf-bench.yml NEW nightly cron (D2.3-1 a 终止累积 nudge) | ci.yml 4 NEW step + perf-bench.yml |

karpathy 4 心法 always-on via description-keyword (非 frontmatter) — Claude Code session 启动时 SKILL discovery match keyword → LLM 看到首段 self-reflexive prompt 自我激活, ROI 对等 frontmatter, 0 SDK 改动。

### 7. Compliance

**A7 守恒 verify outputs** (Wave 5 T5.4 mid-wave verify + Wave 6 T6.4 ship-time re-verify):

```bash
git diff adr-0011-accepted..HEAD -- 'docs/adr/000[1-9]-*.md' 'docs/adr/0010-*.md' 'docs/adr/0011-*.md' | wc -l   # = 0
```

T5.4 (commit `3a3e5ee`) mid-wave verify PASS (0 lines diff)。 Wave 6 T6.4 ship-time re-verify 是最终 gate (S4 plan-check fix mirror Phase 2.2 T6.3)。

**SSOT 引用纪律 verify** (CONTRIBUTING.md Phase 2.1 T1.9 项目级规则):
- 49 `<实占N>` placeholder zero-residue (Wave 0 T0.1 commit `a5c75e0` sed-replace gate) 已全 0012 实占
- 0 NEW literal `0012` injection in pre-existing intel docs (intel/omc-comparison.md 反面教材引用未改)

**Karpathy hard limits met (all files ≤ budget):**
- ADR 0012 ≤ 250L (本 ADR fill-out 实占 ≈ 220L)
- `src/cli/manifest-add.ts` = 78L ≤ 120L
- `src/routing/arbitrateWithRedirect.ts` split ≤ 200L 守住 (proactive split B-18)
- `tests/cli/manifest-add-ee5.test.ts` = 133L (Karpathy deviation logged in T3.3 commit msg: 6-cell coverage 证 justified vs single-cell trim)
- `scripts/check-deferred-items.mjs` ≤ 80L (warn-only round 1)
- `.github/workflows/perf-bench.yml` NEW ≤ 50L (nightly cron advisory only)

### 8. Errata-path note

phase 2.3 走 ADR 0012 errata pattern (新决策 inline, ADR 0001-0011 0-diff preserved); future Phase 2.4+ 走 ADR 0013+ errata。 本 ADR 0012 起 phase 2.3 ship 时刻 frozen — 任何 v0.2.4+ 演化 (extension category 扩展 / karpathy SKILL inject 升级 always_active SDK 字段支持后 / EE-5 gate 自动化扩展 / CD-3 negative-space 第二来源 / SAMPLES.md FRESH-N 扩展 / Wave 0 backlog 余项) 必须开 ADR 0013+ errata; 本 ADR 0012 main body 不可改 (与 ADR 0001-0011 同等守恒规则)。

phase 2.3 ship 时 Wave 6 T6.2 (本 ADR `adr-0012-accepted` baseline tag push 前) ci.yml A7 step `seq 1 11` → `seq 1 0012` (baseline tag iteration `1-11 → 1-0012`)。

### 9. Adoption-confirmation

**T0.10 spike outcome (Wave 0 ship, commit `20cf8f5`):**
- Result: **FAIL** (SDK 0.3.142 无 always_active / auto_load 任何字段变体)
- Fallback (R2 A1 secondary): description-keyword + self-reflexive prompt SKILL.md body 首段
- W2 T2.3 SKILL.md ship (commit `0ccb58d`) 按 fallback 落地, frontmatter 无 always_active 字段

**Routing accuracy outcome (Wave 4 T4.3, commit `2c4442e`):**
- 30/30 = **100%** hit rate (≥85% D-05 acceptance bar 远超 15% headroom)
- 5 anchor case (D-08 "做出风格") 全 redirect to frontend-design
- 1 false-pos guard cell PASS
- 4+ CD-3 disqualify edges PASS

**Tests baseline:** 432 → 491 (+59 cells across W0-W6); 3-OS CI matrix 全绿 (run 25947791608 head `3a3e5ee` `success`)

**DI-1 hotfix outcome (Wave 6, deferred-items.md):**
- karpathy-skills.yaml L31 `git_ref: HEAD` schema bug → fixed by pinning to canonical "all-zeros" sentinel SHA `0000000000000000000000000000000000000000` (40-hex pattern compliant) + cmd 内 cp -R local skills/ path 实际 install (git_ref 仅 schema 占位 — local-copy install method 无 git fetch)。 加 karpathy-skills.yaml 到 install dry-run integration list。

**T-W6-x sister review backlog (Phase 2.3 Wave 6 absorb):**
- T-W6-1: STATE.md 加入 `FRONT_MATTER_DOCS` (Phase 2.2 T0.4 freshness gate 盲点 closed)
- T-W6-2: dashboard.mjs (commit `0b4e76d`) RETROSPECTIVE 已完成节回写
- T-W6-3: ADR 0012 5 → 9 章节 fill (本 commit T6.1)

## A7 Conservation

ADR 0001-0011 main body **untouched**; baseline tag iteration `adr-0001-accepted` ... `adr-0011-accepted` → 加 `adr-0012-accepted` (phase 2.3 Wave 6 T6.4 ship 打)。 `docs/AGENT-DEFINITION-FACTORY-CONTRACT.md` v1.1 + `docs/INSTALLER-CONTRACT.md` main body **不动**。 arbitrate() legacy 保留 (B-18) 避免 30-sample routing-engine.test.ts byte-stable 回归。

### A7 守恒验收命令 (phase 2.3 ship 后 0001-0012 iterate)

```bash
for n in 0001 0002 0003 0004 0005 0006 0007 0008 0009 0010 0011 0012; do
  diff_out=$(git diff "adr-${n}-accepted" -- "docs/adr/${n}-*.md")
  [ -z "$diff_out" ] || { echo "A7 violated for ADR ${n}"; exit 1; }
done
echo "A7 ✅ ADR 0001-0012 main body unchanged"
```

phase 2.3 ship 前 A7 守恒 ADR 0001-0011 验收 (Wave 5 T5.4 mid-wave + Wave 6 T6.4 ship-time 双 verify):

```bash
git diff adr-0011-accepted..HEAD -- "docs/adr/000[1-9]-*.md" "docs/adr/0010-*.md" "docs/adr/0011-*.md" | wc -l   # = 0
```

### CI A7 step

`.github/workflows/ci.yml` A7 step 两处 `seq 1 11` (iterating ADR baseline tags 0001~0011) 加 `0012`; step name `ADR 0001-0011` → `ADR 0001-0012` (Wave 6 T6.2 落地 — baseline tag iteration `1-11 → 1-0012`)。

## References

### 内部依据

- `docs/adr/0011-execute-task-sdk-ralph.md` (phase 2.2 ship base — 本 ADR § Decision 4 CD-3 arbitrate 升级 + § Decision 2 karpathy SKILL-ONLY 走 D-02 路径)
- `docs/adr/0010-installer-schema-extension-errata.md` (Phase 2.1 6 install method dispatch + manifest schema license/install_type 基础)
- `docs/AGENT-DEFINITION-FACTORY-CONTRACT.md` v1.1 (main body **不动** A7 守恒)
- `docs/INSTALLER-CONTRACT.md` (main body **不动** A7 守恒)
- `docs/TRANSPARENCY-VERDICT-CHECKLIST.md` (Phase 2.1 T1.7 ship; Phase 2.2 W0 freshness ext; Phase 2.3 W6 T-W6-1 STATE.md 加入 FRONT_MATTER_DOCS)
- `scripts/check-transparency-verdicts.mjs` (Phase 2.3 W6 T-W6-1: FRONT_MATTER_DOCS 加 'STATE.md')
- `scripts/check-deferred-items.mjs` (Phase 2.3 W0 T0.8 NEW ≤80L warn-only round 1)
- `scripts/strip-claude-md-section.mjs` (Phase 2.3 W2 T2.4 NEW — D-02 SKILL-ONLY transition migration cleanup, cross-platform via node)
- `src/cli/manifest-add.ts` (Phase 2.3 W3 T3.1 NEW 78L — EE-5 5Q gate L1 CLI)
- `src/routing/arbitrateWithRedirect.ts` (Phase 2.3 W2 T2.2 — CD-3 negative-space + if_rejected_use redirect, ≤200L proactive split B-18)
- `src/cli.ts` (Phase 2.3 W3 T3.2 — register manifest-add 11 subcommands)
- `manifests/extensions/design/frontend-design.yaml` (W1 T1.1) + `manifests/extensions/content/anthropics-skills-pptx.yaml` (T1.2) + `manifests/extensions/content/anthropics-skills-slide-deck.yaml` (T1.3) + `manifests/extensions/testing/playwright-test.yaml` (T1.4) + `manifests/extensions/testing/chrome-devtools-mcp.yaml` (T1.5)
- `manifests/skill-packs/karpathy-skills.yaml` (W2 T2.4 REWRITE D-02 SKILL-ONLY; W6 DI-1 hotfix git_ref pinning)
- `skills/karpathy-baseline/SKILL.md` (W2 T2.3 NEW — T0.10 fallback description-keyword + self-reflexive prompt)
- `routing/decision_rules.yaml` (W2 T2.1 + T2.5 — CD-3 fields + 9 keywords + 3 negative-space + per-manifest hint mirror)
- `tests/routing/samples-30.test.ts` (W4 T4.3 NEW — 30 sample harness 100% hit)
- `tests/unit/routing-arbitrateRedirect.test.ts` (W5 T5.1 +3 complementary cells — DRY consolidation T5.1 4-cell spec functionally subsumed by W2 T2.2 d6489bb 6 cells)
- `tests/cli/manifest-add-ee5.test.ts` (W3 T3.3 NEW 133L 6 cells — EE-5 5Q gate covered)
- `tests/integration/phase-2.3-e2e.test.ts` (W5 T5.3 NEW — e2e 5-link smoke 105L 6 cells)
- `tests/integration/install-5-adapters.dry-run.test.ts` (W1 T1.6 NEW — 5 manifest dry-run smoke)
- `.github/workflows/perf-bench.yml` (W0 T0.3 NEW ≤50L nightly cron advisory — M3 perf gate 根治 D2.3-1 a)
- `.planning/phase-2.3/2.3-KICKOFF.md` § 1.2 F1-F8 (acceptance bars)
- `.planning/phase-2.3/2.3-CONTEXT.md` D-01~D-08 (discuss-phase 锁)
- `.planning/phase-2.3/2.3-DISCUSSION-LOG.md` (delta gray area alternatives)
- `.planning/phase-2.3/PATTERNS.md` § 1-4
- `.planning/phase-2.3/RESEARCH.md` D2.3-1 ~ D2.3-7 (researcher 决议 + § 2 A1 secondary fallback path + § 3 anchor regex 实测)
- `.planning/phase-2.3/ASSUMPTIONS.md` § A bar mapping + § B 39 lock (B-01~B-39 含 W2-fix B-32/B-33/B-34/B-35)
- `.planning/phase-2.3/PLAN.md` Wave 0-6 + § 6 F1-F8 reproduction commands
- `.planning/phase-2.3/SAMPLES.md` (W4 T4.1 NEW — 30 FRESH design/content/testing baseline)
- `.planning/phase-2.3/task_plan.md` T0.1 ~ T6.4 atomic tasks (35 task across 7 Waves)
- `.planning/phase-2.3/PLAN-CHECK.md` (Wave C verdict APPROVED WITH CONDITIONS 0B/4W/5S)
- `.planning/phase-2.3/PLAN-CHECK-DELTA.md` (Wave C delta cosmetic resolved)
- `.planning/phase-2.3/deferred-items.md` (W6 DI-1 hotfix outcome 记)

### 外部参考

- `@anthropic-ai/claude-agent-sdk@0.3.142` `skillFrontmatter` shape — only extract `name + source + tokens` (T0.10 spike FAIL evidence)
- `.planning/intel/omc-comparison.md` § 0 SSOT 引用纪律 + CD-3 (L130-135, 源 OMC, ⭐⭐⭐ 显式职责负空间) + EE-5 (L84-92, 源 OMC, ⭐⭐ 5-question merge gate) + EE-4 (L74-82, omo, ⭐⭐ plan 4 维量化阈值 deferred → Phase 2.4)
- `.planning/ROADMAP.md` v0.2.0 Phase 2.3 — Goal + 必含项 + 验收 5 项 + 关键风险
