# ADR 0012: extension category MVP + karpathy SKILL inject 引擎 + EE-5 双层 + CD-3 negative-space + 30-sample routing ≥85% + Wave 0 backlog 根治

## Status

**Draft (phase 2.3 W0 sketch — 2026-05-16; → Accepted (Wave 6 fill-out at phase 2.3 ship))**

> 沿袭 ADR 0008 / 0009 / 0010 / 0011 多决策合并 errata 模式 (B-20 lock)。 本 ADR 9 章节 sketch 在 Wave 0 T0.2 落地, Wave 6 T6.1 fill 详细 detail (B-33)。

## Context

Phase 2.3 是 v0.2.0 sub-task loop 里程碑的第 3 phase — 把 Phase 2.2 ship 后的 execute-task workflow + ralph-loop full integration 升级为「3 extension category (design / content / testing) MVP 装配 + karpathy behavior-rule SKILL-ONLY 注入 + 30 category-specific 样本 routing ≥85% 命中」(含 D-08 "做出风格" override anchor)。

装配 6-7 真实 adapter (design = `ui-ux-pro-max` 已装配 + `frontend-design` 新; content = `anthropics-skills` pptx/slide-deck 新; testing = `playwright-test` 新 + `webapp-testing` 已装配 + `chrome-devtools-mcp` 新), 用 `decision_rules` MIN scope 最小 rule 集驱动 arbitrate, 升级 `arbitrate()` 读 CD-3 negative-space `do_not_use_when:` + `if_rejected_use:` 重定向 (~15L)。

并办 STATE.md L545+ Phase 2.3 Prereq Notes 6 项 backlog 一次根治 — M1 schema regen CI gate / M2 intel 实施进度回填 / M3 perf gate 根治 (移出 CI critical path) / T1.2 schemaVersion consumer call site gate / T1.3 Win pwsh provenance sentinel / T5 deferred-items review cadence — 沿袭 Phase 2.1/2.2 Wave 0 一次根治模式。

### A7 守恒约束 (ADR 0001-0011 main body 不可改)

phase 2.3 沿袭 ADR 0003 / 0005 / 0007 / 0008 / 0009 / 0010 / 0011 errata 风格 — **不动 ADR 0001-0011 main body** (A7 守恒)。 baseline tag iterate 11 → 12 (Wave 6 T6.2 ship 时 push `adr-0012-accepted` tag, ci.yml A7 step iter `1-11` → `1-12`)。 本 ADR 0012 起 phase 2.3 ship 时刻 frozen; v0.2.4+ 演化走 ADR 0013+ errata。

## Decisions

### 1. extension category MVP 装配 (B-01 ~ B-05 / D-01)

`manifests/<category>/<adapter>.yaml` 6-7 entry MIN scope 验证 install 链路通 (沿袭 Phase 2.1 6 install method dispatch):

- **design**: `ui-ux-pro-max` (已装配, 复用 Phase 2.1) + `frontend-design` (新, git-clone-with-setup, D-08 "做出风格" anchor 主导)
- **content**: `anthropics-skills` pptx + slide-deck (新, npx-skill-installer 或 git-clone-with-setup, planner 实占)
- **testing**: `playwright-test` (新, npx) + `webapp-testing` (已装配) + `chrome-devtools-mcp` (新, mcp-http-add)

karpathy YAGNI MIN scope discipline: 不预扩 role-router scoring 中间层 (EE-1 推 v0.3+), 不扩 9-field manifest schema (EE-2 推 Phase 2.4)。

### 2. karpathy SKILL-ONLY 注入 (B-06 ~ B-10 / D-02)

`~/.claude/skills/karpathy-baseline/SKILL.md` always-on skill 形态 (Think Before Coding / Simplicity First / Surgical Changes / 小步原子修改 / Goal-Driven / 最小有效代码 ≤心法精炼)。 **不动 CLAUDE.md** (低风险 ROADMAP L121 "karpathy behavior-rule 与用户私有 CLAUDE.md 冲突" 一键关闭)。 `harnessed install karpathy-skills` 装/卸 干净 (沿袭 Phase 2.1 install_type 字段 + provenance 4 字段)。

**always_active 字段实现方式** — Wave 0 T0.10 spike outcome 决定 (3 候选): (a) Anthropic skill frontmatter `always_active: true` 字段 supported → SKILL.md frontmatter 实占; (b) 字段名不同 (e.g. `auto_load: true`) → 实占正确字段名; (c) 完全不支持 frontmatter toggle → fallback description-keyword 匹配 + self-reflexive prompt "ALWAYS apply..."。 spike outcome 记 task_plan.md Resolved (T0.10) block, Wave 2 T2.3 SKILL.md 实占据此 block。

### 3. EE-5 5-question merge gate 双层 (B-11 ~ B-14 / D-03)

intel L92 EE-5 反 thin wrapper 必上 — 5 题:① reusable surface? ② name fit + conflict? ③ overlap with 已装配? ④ concept vs identity import? ⑤ user 无 upstream 理解?

**双层防御**:
- **L1 CLI 互动**: `harnessed manifest add <upstream>` 5 题 prompt (commander.js + inquirer/prompt), `--non-interactive` 跳 dry-run-only (不绕过 hard reject)
- **L2 plan-phase 模板 + gsd-plan-checker BLOCKER**: KICKOFF/PLAN 模板加 § 7 EE-5 self-meta 节 (若 phase 引入新 upstream adapter), gsd-plan-checker 若 5 题任一未答 → BLOCKER (非 warning)

本 phase 2.3 KICKOFF § 7 已 self-instance EE-5 5 题 × 5 adapter (frontend-design + 2 anthropics-skills + playwright-test + chrome-devtools-mcp) = 25 answers (W5 plan-check fix Karpathy simplicity inline 在 task_plan.md T1.1-T1.5)。

### 4. CD-3 negative-space + if_rejected_use (B-15 ~ B-19 / D-04)

intel L130-135 CD-3 显式职责负空间必上 — `decision_rules.yaml` schema 加 optional fields:
- `do_not_use_when: <regex/keyword 集>` (component 不适用条件)
- `if_rejected_use: <component-id>` (redirect target)

`arbitrate()` 升级 (~15L code) 读 negative-space → match → down-rank; reject 时返回 redirect target component。 单一 SSOT (`routing/decision_rules.yaml` 不开第二来源避免 schema 分裂)。 arbitrate() legacy 保留 (B-18) 避免 30-sample routing-engine.test.ts byte-stable 回归。

### 5. SAMPLES.md FRESH-30 (B-20 ~ B-24 / D-05)

`.planning/phase-2.3/SAMPLES.md` 全新 10 design + 10 content + 10 testing 样本 (D-05 FRESH-30 不复用 Phase 2.2 6 category × 5 cross-domain), 包含 ≥1 "做出风格" anchor case (D-08 frontend-design 主导, regex anchor 候选词集 RESEARCH § 3 实测后确定)。

arbitrate 实测 ≥85% 命中 (沿袭 phase 1.4 R3 frozen rationale 模式, Phase 2.3 SAMPLES.md 自身重置 frozen)。 ROI 显著优于 real-API integration test (Phase 2.2 Lesson 5 mock-based wiring harness pattern 复用)。

### 6. Wave 0 backlog 一次根治 (B-25 ~ B-32 / D-07)

STATE.md L545+ 6 项 prereq backlog 一次 Wave 0 ship:

| 项 | task | files | acceptance |
|-----|------|-------|-----------|
| M1 schema regen drift gate | T0.4 | ci.yml +10L | `corepack pnpm build:schema && git diff --exit-code schemas/` |
| M2 intel 实施进度回填 | T0.7 | omc-comparison.md L236 后 | 加 `## 实施进度回填` 节, 每 entry 标 IMPL: Phase X.Y (commit) 或 PENDING |
| M3 perf gate 根治 (D2.3-1 (a)) | T0.3 | `.github/workflows/perf-bench.yml` NEW ≤50L + ci.yml 删 perf step OR `it.skip(IS_GHA)` | nightly cron advisory only, PR 不阻塞 |
| T1.2 schemaVersion grep gate | T0.5 | ci.yml +10L | `grep -r "branchOnSchemaVersion" src/ \| wc -l ≥ 2` (B1 honest baseline) |
| T1.3 Win pwsh provenance sentinel | T0.6 | ci.yml +8L | `if: runner.os == 'Windows'` + `shell: pwsh` + invoke check-provenance.mjs |
| T5 deferred-items review cadence | T0.8 | RETROSPECTIVE.md 模板节 + `scripts/check-deferred-items.mjs` NEW ≤80L (warn-only round 1) | ci.yml warn-only step |

并: T0.9 STATE.md + RETROSPECTIVE.md Phase 2.3 preheat / T0.10 always_active spike (W1 plan-check fix 提前到 W0 → T2.3 ship 前 validated)。

### 7. schemaVersion adoption status errata (B1 plan-check fix)

Phase 2.2 W2 schemaVersion ship 实际 = **helper-only adoption** (consumer count = 2 at Phase 2.3 start: `src/types/schemaVersion.ts` 定义 + 1 self-reference)。 Phase 2.2 W2 T2.0 claim 的 7 surface 各 ≥ 1 consumer call site **未真实落地**。

Phase 2.3+ 逐步扩 consumer per surface (handoff doc / phases-yaml / manifest state / installer state / route decision log / checkpoint / agent definition factory)。 Wave 0 T0.5 gate 阈值 ≥2 反映 honest baseline; 后续 phase 每扩 1 consumer surface 同步 bump 阈值。

**Rationale**: 原 ≥7 阈值是 Phase 2.2 W2 ship claim 但 consumer call sites 未真实落地 — 强 push CI 红。 阈值 ≥2 是 honest baseline, B1 BLOCKER plan-check fix (commit `a4e8b93`)。

### 8. always_active spike outcome (Wave 0 T0.10)

> **Filled at Wave 0 T0.10 execute**: spike outcome ∈ {PASS / PARTIAL / FAIL} + field name + fallback path。 详 task_plan.md 顶部 Resolved (T0.10) block。

W1 plan-check fix 反序修正 — 原 spike 在 Wave 4 T4.2 但 Wave 2 T2.3 ship SKILL.md `always_active: true` 反序; spike 提前到 Wave 0 (R2 RESEARCH A1 MED-HIGH conf, spike LOC < 30 min)。 若 FAIL → fallback description-keyword 匹配 + self-reflexive prompt (R2 ASSUMPTIONS A1 fallback)。

### 9. Wave C PLAN-CHECK fixes 合并 (W1-W5 + S1-S4 + S-1/S-2/S-3)

Wave C plan-check delta (commit `a4e8b93` + `43b9fee`) 5 W + 4 S 合 (Karpathy simplicity inline absorb):

- **W1**: always_active spike 提前 Wave 4 → Wave 0 (T0.10)
- **W2**: T2.4 sed → node script portable (Win Git Bash 兼容)
- **W3**: T0.1 manifest placeholder zero-residue sed-replace gate
- **W4**: T2.2 decisionRules.ts proactive split (~15L addition + 加 ≤ 200L hard limit)
- **W5**: EE-5 self-meta KICKOFF § 7 inline (5 adapter × 5 题 = 25 answers in task_plan T1.1-T1.5)
- **S1-S4 + S-1/S-2/S-3**: cosmetic polish (no-paren grep / task count sync / Path B alt-considered annotation)

## A7 Conservation

- ADR 0001-0011 main body untouched (verify: Wave 6 T6.3 `git diff adr-0011-accepted..HEAD -- "docs/adr/00[01][1-9]-*.md"` 0L)
- baseline tag iterate: 1-11 → 1-12 (Wave 6 T6.2 ship `adr-0012-accepted` tag push)
- ci.yml A7 step iter 1-11 → 1-12
- arbitrate() legacy 保留 (B-18) 避免 30-sample routing-engine.test.ts byte-stable 回归
- `docs/AGENT-DEFINITION-FACTORY-CONTRACT.md` v1.1 + `docs/INSTALLER-CONTRACT.md` main body 不动

## References

- KICKOFF: `.planning/phase-2.3/KICKOFF.md`
- PATTERNS: `.planning/phase-2.3/PATTERNS.md`
- RESEARCH: `.planning/phase-2.3/RESEARCH.md` (D2.3-1 perf gate / D2.3-2 karpathy skill / D2.3-3 anchor regex)
- ASSUMPTIONS: `.planning/phase-2.3/ASSUMPTIONS.md` § A bar mapping + § B 39 lock
- PLAN: `.planning/phase-2.3/PLAN.md`
- task_plan: `.planning/phase-2.3/task_plan.md` (35 atomic tasks, W0:10 / W1:6 / W2:5 / W3:3 / W4:3 / W5:4 / W6:4)
- PLAN-CHECK: `.planning/phase-2.3/PLAN-CHECK.md` (verdict APPROVED WITH CONDITIONS 1B / 5W / 4S)
- PLAN-CHECK-DELTA: `.planning/phase-2.3/PLAN-CHECK-DELTA.md` (APPROVED WITH CONDITIONS 0B/0W/3S all cosmetic resolved)
- intel L92 (EE-5 必上) + L130-135 (CD-3 显式负空间)
- STATE.md L545+ (Phase 2.3 Wave 0 prereq backlog 6 项)
- 2.3-CONTEXT.md (8 D-decisions D-01~D-08 锁)
