---
phase: 05.3-v0.5.0-milestone-close
plan: 01
type: execute
wave: 0
depends_on: []
files_modified:
  - .planning/STATE.md
  - .planning/RETROSPECTIVE.md
  - scripts/check-state-archive-stale.mjs
  - .planning/ROADMAP.md
  - .planning/milestones/v0.5.0-ROADMAP.md
  - .planning/milestones/v0.5.0-REQUIREMENTS.md
  - .planning/milestones/v0.5.0-MILESTONE-AUDIT.md
  - CHANGELOG.md
  - README.md
  - PROJECT-SPEC.md
  - .planning/phase-5.3/DOGFOOD-T2.X.md
  - .planning/phases/05.3-v0.5.0-milestone-close/05.3-01-SUMMARY.md
autonomous: true
requirements:
  - R10.1
  - R10.2
  - R10.3
  - R10.4
  - R8.1
  - R8.2
  - R8.3
  - R8.4
  - R8.5
tags:
  - milestone-close
  - close-ceremony
  - v0.5.0
  - archive-triplet
  - dual-tag

must_haves:
  truths:
    - "v0.5.0 milestone has 3-file archive triplet in .planning/milestones/"
    - "CHANGELOG.md has [0.5.0] - 2026-05-22 stable release line above preserved alpha entries"
    - "ROADMAP.md Phase 5.3 row marked 🎯 SHIPPED and v1.0 chapter NEW visible"
    - "README.md Status section shows v0.5.0 SHIPPED + v1.0 GA target window"
    - "STATE.md shows 当前里程碑 v0.5.0 100% CLOSE + 进度 20/20"
    - "RETROSPECTIVE.md has Phase 5.3 section (7-section format) + Phase 5.2 archive append"
    - "Two LOCAL tags exist: v0.5.0-alpha.3-close + 🎯 v0.5.0 (annotated, ordered)"
    - "v0.5.0-MILESTONE-AUDIT § 7 Cadence Patterns has exactly 4 trend items"
    - "DOGFOOD-T2.X.md PASS 3/3 axes (triplet + v1.0 chapter + tag annotation)"
    - "CI gates pass (state-archive-stale + transparency-verdicts); 756+ tests stable; biome N/A"
  artifacts:
    - path: ".planning/milestones/v0.5.0-ROADMAP.md"
      provides: "v0.5.0 milestone roadmap snapshot"
      min_lines: 50
      max_lines: 65
    - path: ".planning/milestones/v0.5.0-REQUIREMENTS.md"
      provides: "v0.5.0 R10.1-R10.4 requirements snapshot"
      min_lines: 55
      max_lines: 75
    - path: ".planning/milestones/v0.5.0-MILESTONE-AUDIT.md"
      provides: "v0.5.0 audit PASSED + § 7 Cadence Patterns NEW"
      min_lines: 170
      max_lines: 200
    - path: ".planning/phase-5.3/DOGFOOD-T2.X.md"
      provides: "Phase 5.3 W2 empirical verify PASS 3/3"
      min_lines: 50
      max_lines: 80
    - path: ".planning/ROADMAP.md"
      provides: "Phase 5.3 SHIPPED row + v1.0 chapter NEW (~70-100L)"
      contains: "v1.0 — Production-ready GA"
    - path: "CHANGELOG.md"
      provides: "[0.5.0] - 2026-05-22 stable release block"
      contains: "## [0.5.0] - 2026-05-22"
    - path: ".planning/STATE.md"
      provides: "Post-close STATE; 当前里程碑 v0.5.0 CLOSE; ≤140L target"
      max_lines: 145
  key_links:
    - from: ".planning/milestones/v0.5.0-MILESTONE-AUDIT.md § 7"
      to: "Cross-milestone trends (D2 iter + SIZE_LIMIT + M2 backlog + sister review tiering)"
      via: "4-item trend list (Karpathy YAGNI limit per D-07)"
    - from: "git tag v0.5.0-alpha.3-close"
      to: "git tag 🎯 v0.5.0"
      via: "STRICT ordering: baseline FIRST, milestone SECOND (per sister T-4.3-07 STRIDE)"
    - from: ".planning/STATE.md L60 (Phase 5.2 narrative)"
      to: ".planning/RETROSPECTIVE.md § ARCHIVED FROM STATE — Phase 5.2"
      via: "D2 cadence iter 7 trim (REINFORCE post-iter-6 graduation)"
    - from: "README.md L42-44 Status section"
      to: "ROADMAP.md v0.5.0 SHIPPED + v1.0 chapter"
      via: "user-facing summary linking to canonical SoT"
---

<objective>
Phase 5.3 ships the 🎯 v0.5.0 milestone CLOSE CEREMONY: 3-file archive triplet + CHANGELOG v0.5.0 stable release line + ROADMAP v1.0 chapter NEW (~70-100L) + README/PROJECT-SPEC status updates + RETROSPECTIVE Phase 5.3 section + STATE post-close update + dual LOCAL tags (v0.5.0-alpha.3-close + 🎯 v0.5.0).

Purpose: Close v0.5.0 milestone per sister v0.3.0 + v0.4.0 close cadence 100% reuse; prep v1.0 GA Phase 6.x handoff (Phase 6.x discuss-phase reuses v1.0 chapter directly). NO src/ change (M-01 CLOSE CEREMONY class LOCK). NO new ADR (D-02 LOCKED). NO triple tag (dual only per D-08).

Output: 4 NEW files + 7 MODIFIED files + 2 LOCAL tags. All ≤200L Karpathy compliant; v0.5.0-MILESTONE-AUDIT.md borderline ~180-200L tightly budgeted.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT-SPEC.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phase-5.3/5.3-CONTEXT.md
@.planning/phase-5.3/RESEARCH.md
@.planning/phase-5.3/PATTERNS.md
@.planning/milestones/v0.4.0-ROADMAP.md
@.planning/milestones/v0.4.0-REQUIREMENTS.md
@.planning/milestones/v0.4.0-MILESTONE-AUDIT.md
@CHANGELOG.md
@README.md

<interfaces>
<!-- Sister format references (close ceremony 100% reuse pattern). -->
<!-- Executor must adapt sister format wording NOT reinvent structure. -->

Sister format anchor files (verified line counts):
- `.planning/milestones/v0.4.0-ROADMAP.md` = 62L (target v0.5.0: 55-65L)
- `.planning/milestones/v0.4.0-REQUIREMENTS.md` = 64L (target v0.5.0: 60-70L)
- `.planning/milestones/v0.4.0-MILESTONE-AUDIT.md` = 176L (target v0.5.0: 180-200L + § 7 NEW)
- `CHANGELOG.md` = 79L current (target +30-40L stable block)
- `README.md` = 178L current (target +0L net surgical 3-line replace at L42-44)
- `.planning/STATE.md` = 141L current (target ≤140L post-trim → SIZE_LIMIT flip conditional)

D2 archive comment format (STATE.md L54-58 verified):
```html
<!-- Phase X.Y narrative archived to RETROSPECTIVE.md § ARCHIVED FROM STATE — Phase X.Y
(YYYY-MM-DD Phase Z.W W0 D2 cadence iter N per standing process — ...) -->
```

Dual tag ordering constraint (sister T-4.3-07 STRIDE):
1. ALL doc commits FIRST
2. git tag -a v0.5.0-alpha.3-close (baseline)
3. git tag -a "🎯 v0.5.0" (milestone)
4. NO push (LOCAL CREATE only per CLAUDE.md commit safety)

🎯 v0.5.0 tag annotation 9-content-line format (per D-06; resolves A1):
```
Line 1: 🎯 v0.5.0 milestone close — v1.0-RC2 minor: audit log consumer + backlog absorb
Lines 2-4: Phase 5.1 / 5.2 / 5.3 top decision each
Lines 5-8: 4 cross-milestone trends (D2 iter / SIZE_LIMIT / M2 backlog / sister review tiering)
Line 9: tests cumulative 720→756 +36
```
</interfaces>
</context>

<tasks>

<!-- ============================================================ -->
<!-- WAVE 0 — Cadence absorb (3 tasks: D2 iter 7 + SIZE_LIMIT conditional + gate) -->
<!-- ============================================================ -->

<task type="auto">
  <name>Task 0.1: D2 cadence iter 7 — trim STATE Phase 5.2 narrative → RETROSPECTIVE archive</name>
  <files>.planning/STATE.md, .planning/RETROSPECTIVE.md</files>
  <action>
    Per D-08 sneak-block + Pitfall #1 in RESEARCH.md, trim ONLY Phase 5.2 narrative
    (STATE.md L60 "Phase 5.2 shipped" bullet) → RETROSPECTIVE.md § ARCHIVED FROM STATE — Phase 5.2.
    Sister cadence: iter 6 was implicit-standing-process graduation (Phase 5.2 W0); iter 7 = REINFORCE optional.

    Steps:
    1. Read current STATE.md L60-61 (Phase 5.2 shipped bullet content) — capture verbatim
    2. Append archive comment block to STATE.md (after existing L58 Phase 5.1 archive comment):
       ```html
       <!-- Phase 5.2 narrative archived to RETROSPECTIVE.md § ARCHIVED FROM STATE — Phase 5.2
       (2026-05-22 Phase 5.3 W0.1 D2 cadence iter 7 per standing process — implicit-standing-process
       graduation REINFORCE; iter 7 post-iter-6 terminus signal Phase 5.2 W0; single-phase archive per
       R-4 cadence consistency mitigation continuation) -->
       ```
    3. Delete STATE.md L60 Phase 5.2 narrative bullet (keep L61-65 prior phase bullets — they stay as user-facing summary)
    4. Append to .planning/RETROSPECTIVE.md (find end of existing § ARCHIVED FROM STATE sections):
       ```markdown
       ## ARCHIVED FROM STATE — Phase 5.2

       > (2026-05-22 Phase 5.3 W0.1 D2 cadence iter 7 REINFORCE per standing process)

       - **Phase 5.2 shipped** ✅ (2026-05-19) — R10.3 uninstall 14th subcommand + 7 uninstallers + R10.4 path-guard.ts + ADR 0022 + ci.yml A7 0021→0022 + 756 tests
       ```
    5. Verify post-trim line count: `wc -l .planning/STATE.md` — capture result for Task 0.2 decision tree

    Sister cadence: matches STATE.md L54-58 prior 5 D2 cadence comment blocks (iter 1-6 archive history).
  </action>
  <verify>
    <automated>wc -l .planning/STATE.md && grep -c "Phase 5.2 narrative archived" .planning/STATE.md && grep -c "ARCHIVED FROM STATE — Phase 5.2" .planning/RETROSPECTIVE.md</automated>
  </verify>
  <done>
    STATE.md Phase 5.2 narrative bullet deleted; archive comment added (1 occurrence);
    RETROSPECTIVE.md has new § ARCHIVED FROM STATE — Phase 5.2 section (1 occurrence);
    post-trim wc -l recorded for Task 0.2 decision tree (expect ~135-141L)
  </done>
</task>

<task type="auto">
  <name>Task 0.2: SIZE_LIMIT round 4 CONDITIONAL evaluation per #BA decision tree</name>
  <files>scripts/check-state-archive-stale.mjs (conditional MODIFY only)</files>
  <action>
    Per CONTEXT #BA + RESEARCH Pitfall #6 — decision tree CONDITIONAL.
    Run `wc -l .planning/STATE.md` from Task 0.1 result.

    Decision tree (DO NOT pre-decide; execute exactly per result):
    - **≤140L** → FLIP SIZE_LIMIT 150→140 in scripts/check-state-archive-stale.mjs (1-line surgical:
      find `const SIZE_LIMIT = 150` and change to `const SIZE_LIMIT = 140`).
      Note in commit message: "round 4 FLIP 150→140 post-iter-7 trim verified".
    - **141-145L** → DEFER #BA carry Phase 6.x (NO file change). Add note to STATE.md "未决问题" section
      (or "P1" 待办): "DEFERRED #BA SIZE_LIMIT round 4 evaluate — Phase 5.3 W0.2 post-trim STATE NL,
      stays within 150 limit but insufficient headroom for 140 flip; defer Phase 6.x signal evaluate".
    - **>145L** → BLOCKED, halt and ask user (over-budget unexpected; investigate Task 0.1 trim scope).

    Independent verification step (BEFORE deciding):
    ```bash
    node scripts/check-state-archive-stale.mjs && echo "D3 gate PASS at current SIZE_LIMIT"
    ```
    Must exit 0 — if it fails, BLOCKED, halt.

    Sister cadence reference: Phase 5.2 W0 T0.1 (round 3 165→150 FLIP after Phase 5.1 narrative trim verified ≤150L).
  </action>
  <verify>
    <automated>node scripts/check-state-archive-stale.mjs && node scripts/check-transparency-verdicts.mjs && (grep -c "SIZE_LIMIT" scripts/check-state-archive-stale.mjs)</automated>
  </verify>
  <done>
    D3 gate PASS post-decision; SIZE_LIMIT decision documented (either FLIPPED 150→140 with verify
    showing new limit, or DEFERRED with note appended); BLOCKED branch raises halt request.
  </done>
</task>

<task type="auto">
  <name>Task 0.3: W0 baseline gates verify — state-archive-stale + transparency-verdicts + tests regression</name>
  <files>(verification-only; no file modifications)</files>
  <action>
    Verify all baseline gates green before entering Wave 2.

    Run in sequence (halt on first failure):
    1. `node scripts/check-state-archive-stale.mjs` — must exit 0 (size + cadence rules)
    2. `node scripts/check-transparency-verdicts.mjs` — must exit 0 (STATE.md "当前位置" block intact)
    3. `corepack pnpm test --run` — must show 756+ PASS no regression (NO src/ change expected;
       this is regression baseline only)
    4. `corepack pnpm typecheck` — must exit 0

    Note: biome NOT needed Phase 5.3 (NO TS/JS commit per M-01 CLOSE CEREMONY).
    Phase 5.3 NO src/ change → 0 NEW tests expected.

    If any gate fails: halt, surface specific gate output to orchestrator.
  </action>
  <verify>
    <automated>node scripts/check-state-archive-stale.mjs && node scripts/check-transparency-verdicts.mjs && corepack pnpm test --run && corepack pnpm typecheck</automated>
  </verify>
  <done>
    All 4 gates green: D3 archive-stale exit 0; transparency-verdicts exit 0; 756+ tests PASS;
    typecheck exit 0. Ready to enter Wave 2 close ceremony artifacts ship.
  </done>
</task>

<!-- ============================================================ -->
<!-- WAVE 2 — Close ceremony artifacts (10 tasks) -->
<!-- NO Wave 1 — close ceremony has no src/ work per M-01 LOCKED -->
<!-- ============================================================ -->

<task type="auto">
  <name>Task 2.1: NEW .planning/milestones/v0.5.0-ROADMAP.md (55-65L snapshot)</name>
  <files>.planning/milestones/v0.5.0-ROADMAP.md</files>
  <action>
    Sister `.planning/milestones/v0.4.0-ROADMAP.md` (62L) format 100% reuse.

    Create with these sections (per PATTERNS.md):
    1. **Header** (L1-8):
       - Title: `# Milestone v0.5.0: v1.0-RC2 minor (audit log consumer + backlog absorb)`
       - Status: `🎯 SHIPPED & ARCHIVED 2026-05-22`
       - Phases: `5.1 / 5.2 / 5.3 (3 phases)`
       - Timeline: `2026-05-19 → 2026-05-22 (~3 days BB path window)`
       - Git range: `v0.4.0` tag → `v0.5.0` tag
       - Milestone tags: `v0.5.0-alpha.1-audit-lock / v0.5.0-alpha.2-uninstall-security / v0.5.0-alpha.3-close → 🎯 v0.5.0`
       - Audit link: `.planning/milestones/v0.5.0-MILESTONE-AUDIT.md`
    2. **## Overview** (~5-7L dense paragraph): R10.1+R10.2+R10.3+R10.4 delivered; 2 NEW ADR (0021+0022);
       CLOSE CEREMONY phase (M-01); D2 iter 6 graduation; SIZE_LIMIT 4-round complete; M2 backlog 10-cycle.
    3. **## Phases** — 3 subsections (Phase 5.1 / 5.2 / 5.3), each:
       - Goal (1 line per CONTEXT.md M-01)
       - Plans count + Wave structure
       - Bullet checklist of major deliverables with ADR refs + LoC where applicable

    Target: 55-65L. Karpathy ≤200L: PASS comfortably.

    Verify NO src/ references in this file (close ceremony archive snapshot only).
  </action>
  <verify>
    <automated>test -f .planning/milestones/v0.5.0-ROADMAP.md && [ "$(wc -l < .planning/milestones/v0.5.0-ROADMAP.md)" -ge 50 ] && [ "$(wc -l < .planning/milestones/v0.5.0-ROADMAP.md)" -le 70 ] && grep -c "Phase 5.1" .planning/milestones/v0.5.0-ROADMAP.md && grep -c "Phase 5.2" .planning/milestones/v0.5.0-ROADMAP.md && grep -c "Phase 5.3" .planning/milestones/v0.5.0-ROADMAP.md</automated>
  </verify>
  <done>
    File exists 50-70L; references Phase 5.1, 5.2, 5.3; status SHIPPED & ARCHIVED 2026-05-22;
    git range v0.4.0→v0.5.0; milestone tags listed; sister v0.4.0-ROADMAP format match.
  </done>
</task>

<task type="auto">
  <name>Task 2.2: NEW .planning/milestones/v0.5.0-REQUIREMENTS.md (60-70L snapshot)</name>
  <files>.planning/milestones/v0.5.0-REQUIREMENTS.md</files>
  <action>
    Sister `.planning/milestones/v0.4.0-REQUIREMENTS.md` (64L) format 100% reuse.

    Sections (per PATTERNS.md):
    1. **Header** (L1-8): Status SHIPPED & ARCHIVED 2026-05-22; Source: `.planning/REQUIREMENTS.md`;
       Audit link to v0.5.0-MILESTONE-AUDIT.md
    2. **> Note**: v0.5.0 涉及 4 个 v0.5-tagged 需求 (R10.1+R10.2+R10.3+R10.4)
    3. **## v0.5 需求结算表** — 4-row table:
       | Req | 描述 | 最终状态 | 实装 phase | 备注 |
       - R10.1 audit-log consumer ✅ Done Phase 5.1 (src/cli/audit-log.ts + ADR 0021)
       - R10.2 state lock ✅ Done Phase 5.1 (proper-lockfile@4.1.2 + ADR 0021)
       - R10.3 harnessed uninstall ✅ Done Phase 5.2 (14th subcommand + 7 uninstallers + ADR 0022)
       - R10.4 path traversal ✅ Done Phase 5.2 (src/manifest/lib/path-guard.ts + ADR 0022)
    4. **## 结算汇总**: 4/4 Done; 0 partial; 0 unsatisfied
    5. **## Phase 5.X Decision Lock 速查** — per-phase D-decisions condensed (Phase 5.1 D-01~D-08 / Phase 5.2 D-01~D-08 / Phase 5.3 D-01~D-08 8+8+8 = 24 total but cite top decision per phase tier)
    6. **## v1.0+ deferred 锚定** (v0.5.0 close 时 promoted):
       - #BC #BD #BE #BN sister conditional → Phase 6.x
       - #BJ #BK Phase 4.2 LOW cosmetic → Phase 6.x
       - #BL #BM F40-2 forward-compat → DEFER PERMANENT

    Target: 60-70L. Karpathy ≤200L: PASS.
  </action>
  <verify>
    <automated>test -f .planning/milestones/v0.5.0-REQUIREMENTS.md && [ "$(wc -l < .planning/milestones/v0.5.0-REQUIREMENTS.md)" -ge 55 ] && [ "$(wc -l < .planning/milestones/v0.5.0-REQUIREMENTS.md)" -le 75 ] && grep -c "R10.1" .planning/milestones/v0.5.0-REQUIREMENTS.md && grep -c "R10.4" .planning/milestones/v0.5.0-REQUIREMENTS.md</automated>
  </verify>
  <done>
    File exists 55-75L; R10.1+R10.2+R10.3+R10.4 all listed ✅ Done; per-phase ship attribution
    correct (5.1/5.1/5.2/5.2); v1.0+ deferred section present.
  </done>
</task>

<task type="auto">
  <name>Task 2.3: NEW .planning/milestones/v0.5.0-MILESTONE-AUDIT.md (180-200L) + § 7 Cadence Patterns NEW (Karpathy edge)</name>
  <files>.planning/milestones/v0.5.0-MILESTONE-AUDIT.md</files>
  <action>
    Sister `.planning/milestones/v0.4.0-MILESTONE-AUDIT.md` (176L) format 100% reuse + § 7 NEW per D-07.

    **CRITICAL: Karpathy ≤200L hard limit — borderline file**. R-1 risk top of phase.
    Mitigation: if exceeding 200L → split § 6 sea (verdict detail) OR § 7 trends to follow-on file
    `.planning/milestones/v0.5.0-CADENCE-TRENDS.md`. Prefer tight § content over split.

    Structure (per PATTERNS.md verified format):

    1. **YAML frontmatter** (L1-30 sister 34L):
       ```yaml
       ---
       milestone: 0.5.0
       audited: 2026-05-22
       status: passed
       status_history:
         - "2026-05-22 initial: passed — 3/3 phase × acceptance bar F1-F8 全 verified; 0 unsatisfied 残留 (R10.1+R10.2+R10.3+R10.4 all ✅ Done)"
       scores:
         requirements: 4/4
         phases: 3/3 self-report passed
         integration: [N]/[N] wired seams OK
         flows: [N]/[N] fully wired
       gaps:
         requirements: []
         integration: []
         flows: []
       tech_debt:
         - phase: "5.3"
           items:
             - "DEFERRED #BJ process.exit + unreachable return LOW cosmetic → Phase 6.x"
             - "DEFERRED #BK writeFileSync no try-catch LOW rare → Phase 6.x"
             - "DEFERRED PERMANENT #BL/#BM sdkSpawn + AgentDef SDK coupling (F40-2)"
             - "DEFERRED #BC/#BD/#BE/#BN sister conditional → Phase 6.x signal eval"
       ---
       ```

    2. **# v0.5.0 Milestone Audit — PASSED** (L31)
    3. **## TL;DR** (~8L dense)
    4. **## § 0.5 Line Budget Deviations Accepted** (table 4-5 rows for NEW files; 0 deviations target)
    5. **## § 1 Per-Phase Status** (3-row table Phase 5.1 / 5.2 / 5.3)
    6. **## § 2 Cross-Phase Integration** (seam table 5.1↔5.2↔5.3)
    7. **## § 3 E2E Flows** (flow table — audit-log + uninstall + path-guard + close ceremony)
    8. **## § 4 Requirements Coverage** (R10.1-R10.4 × 4 rows + R8.x carry-forward sustained)
    9. **## § 5 v0.5.0 vs v0.4.0 对比** (dimension table)
    10. **## § 6 Verdict** (PASSED + next Phase 6.x)
    11. **## § 7 Cadence Patterns — D2 iter graduation + SIZE_LIMIT tighten + M2 backlog + sister review tiering** (NEW per D-07, ~25-30L):
        - **Trend 1**: D2 cadence iter 1→6 implicit-standing-process graduation
          - Phase 3.4 W2 T2.2 (iter 1) → Phase 4.1 W0.3 (2) → Phase 4.2 W0.1 (3 terminus signal) → Phase 4.3 W0.1 (4 REINFORCE) → Phase 5.1 W0 T0.1 (5 TERMINUS) → Phase 5.2 W0 T0.1 (6 implicit-standing-process graduation) → Phase 5.3 W0.1 (7 REINFORCE optional)
          - Pattern lock: 5-recurrence terminus heuristic confirmed (ADR 0019 backfill institutional)
        - **Trend 2**: SIZE_LIMIT progressive tighten 200→175→165→150 (4 rounds; round 4 Phase 5.3 W0.2 RESULT)
          - Round 1: Phase 3.4 W0 D3 gate intro SIZE_LIMIT=200
          - Round 2: Phase 4.3 W0.2 FLIP 200→175 (sister H2 AA #BA resolve)
          - Round 3: Phase 5.2 W0 T0.1 FLIP 165→150
          - Round 4: Phase 5.3 W0.2 CONDITIONAL [FILL IN ACTUAL RESULT from Task 0.2: FLIPPED 150→140 OR DEFERRED]
        - **Trend 3**: M2 backlog discharge pattern stable (Phase 2.3→5.2 共 10 cycle)
          - Pattern: 'deferred → next phase W0 一次根治' standing process
          - 10 cycles enumerated (Phase 2.3→2.4→3.1→3.2→3.3→3.4→4.1→4.2→4.3→5.1)
        - **Trend 4**: Sister review tiering pattern stable (4 cycle)
          - Cycle 1: Phase 4.2 1st-cycle H1 absorb inline
          - Cycle 2: Phase 4.3 W2 2nd-cycle errata
          - Cycle 3: Phase 4.3 3rd-cycle #BT reinforce
          - Cycle 4: Phase 5.x 4th-cycle BB path strategic LOCK (2026-05-19)
        - Signal: H-tier inline absorb, M+L tier carry-forward appropriate

    **Anti-pattern guards**:
    - § 7 trends MUST be exactly 4 items (D-07 LOCKED + RESEARCH Pitfall #5; 5+ items = sneak-in REJECT)
    - NO trends duplicated in RETROSPECTIVE (single SoT per D-04 COLLAPSE 5-recurrence terminus lesson)
    - Tight budget: aim for 180-195L; if exceeding 200L at draft, prune § 6 verdict prose first

    Target: 180-200L. Karpathy ≤200L: AT LIMIT — Risk R-1 mitigated by tight budget per section.
  </action>
  <verify>
    <automated>test -f .planning/milestones/v0.5.0-MILESTONE-AUDIT.md && [ "$(wc -l < .planning/milestones/v0.5.0-MILESTONE-AUDIT.md)" -ge 170 ] && [ "$(wc -l < .planning/milestones/v0.5.0-MILESTONE-AUDIT.md)" -le 200 ] && grep -c "§ 7 Cadence Patterns" .planning/milestones/v0.5.0-MILESTONE-AUDIT.md && [ "$(grep -c '### Trend\|### D2 cadence\|### SIZE_LIMIT\|### M2 backlog\|### Sister review' .planning/milestones/v0.5.0-MILESTONE-AUDIT.md)" -ge 4 ] && [ "$(grep -c '### Trend\|### D2 cadence\|### SIZE_LIMIT\|### M2 backlog\|### Sister review' .planning/milestones/v0.5.0-MILESTONE-AUDIT.md)" -le 4 ]</automated>
  </verify>
  <done>
    File exists 170-200L (Karpathy ≤200L PASS); § 7 Cadence Patterns section present with EXACTLY 4
    trend subsections (D-07 LOCKED); YAML frontmatter status=passed; scores 4/4 requirements.
  </done>
</task>

<task type="auto">
  <name>Task 2.4: MODIFY .planning/ROADMAP.md — Phase 5.3 row SHIPPED + v1.0 chapter NEW (~70-100L)</name>
  <files>.planning/ROADMAP.md</files>
  <action>
    Two surgical edits to ROADMAP.md:

    **Edit 1: Phase 5.3 row PROGRESS → 🎯 SHIPPED** (around L273-278; sister L185 v0.4.0 SHIPPED format):
    - Find: `- **Phase 5.3: v0.5.0 milestone close + 🎯 v1.0 GA prep** (1 day target)`
    - Replace with: `- **Phase 5.3: v0.5.0 milestone close + 🎯 v1.0 GA prep** ✅ SHIPPED (2026-05-22)`
    - Update sub-bullets to past-tense SHIPPED form (matching sister v0.4.0 L224-229 format)

    **Edit 2: v0.5.0 chapter milestone header update** (L242 area):
    - Find: `## v0.5.0 — v1.0-RC2 minor ... **3-day target window 2026-05-20 ~ 2026-05-22**`
    - Add SHIPPED & ARCHIVED note after (sister L185 v0.4.0 format):
      ```
      > 🎯 **v0.5.0 MILESTONE 3/3 SHIPPED & ARCHIVED** (2026-05-22) — Phase 5.1+5.2 ship 2026-05-19;
      > Phase 5.3 ship 2026-05-22; 2 ADR (0021+0022) + 3 baseline tag + 1 milestone tag accumulate;
      > 756 tests; archive `.planning/milestones/v0.5.0-{ROADMAP,REQUIREMENTS,MILESTONE-AUDIT}.md`.
      > next: v1.0 GA Phase 6.x discuss-phase.
      ```

    **Edit 3: v1.0 chapter NEW (~70-100L)** — APPEND after existing v0.5.0 chapter end (before existing
    `## v1.0 前 拒绝清单` at L287; v1.0 chapter goes BEFORE rejection list):

    ```markdown
    ## v1.0 — Production-ready GA + npm publish + README "stable" badge — **target window 2026-05-22~23**

    > **Note (D-03 v1.0ChapterTiming LOCKED Phase 5.3)**: v1.0 GA = independent Phase 6.x window
    > 2026-05-22~23 post-v0.5.0 close (NOT Phase 5.3 scope).

    ### Goal

    production-ready harnessed; 6-month organic clock 结束后 maintenance-only mode 入。
    9 GA criteria 全部满足 + npm publish stream unblock + README "stable" badge transition。

    ### 9 GA 验收标准

    1. R8.1-R8.5 ALL sustained (benchmark + co-maintainer + stale-bot + ADR全集 + Sponsors)
    2. R10.1-R10.4 ALL satisfied (audit-log consumer + state lock + uninstall + path-guard)
    3. 6-month co-maintainer organic clock completed (ADR 0020 HYBRID 2-clock; window开 Phase 4.2)
    4. Tests threshold maintained (756+ as of Phase 5.2; no regression CI 三平台全绿)
    5. Benchmark public sustained (docs/benchmarks/v0.4.md; re-run cadence per CONTRIBUTING-BENCHMARK.md)
    6. CI green 三平台 (macOS + Linux + Windows native; A7 守恒 ADR 0001-0022 main body 0 diff)
    7. Security audit (R10.4 path-guard.ts 5-vector OWASP A1 + R10.2 state lock; no new critical OWASP)
    8. Docs production-ready (MAINTAINER-ONBOARDING.md + CONTRIBUTING.md + SECURITY.md + README stable)
    9. npm publish stream unblock (package.json `private` flag removal + npm registry setup)

    ### Phase 6.x outline (scope freeze guard; detailed task spec defer Phase 6.x discuss-phase)

    - **Phase 6.1**: v1.0-RC2 → 🎯 v1.0 GA tag + npm publish stream + README "stable" badge update
      - Window: 2026-05-22~23 post-v0.5.0 close
      - Entry: 9 GA criteria 全部 verify

    ### Scope freeze guard (sister R10.x freeze延袭)

    6-month organic clock 触发 backlog 诱惑 reject — v1.0 GA 阶段 workflow 数量 freeze 为 3
    (research + execute-task + plan-feature; RX.1-RX.6 reject list 继续有效)。

    ### 关键风险

    - ⚠️ **6-month co-maintainer organic clock 可能结束无 co-maintainer** → maintenance-only mode directly
    - ⚠️ **npm publish public visibility** increases attack surface → R10.4 path-guard + R10.2 state lock prerequisite
    - ⚠️ **scope creep** — 6 month organic clock 触发 "做更多 backlog" 诱惑 → v1.0 GA freeze 9 criteria only
    ```

    **Anti-pattern guards**:
    - Target ~70-100L for v1.0 chapter (RESEARCH Pitfall #3); MUST NOT include Phase 6.x detailed
      task spec / Wave structure / file-level specs (sneak-in REJECT per D-03 sneak-block)
    - If chapter exceeds 120L → prune; outline only.
  </action>
  <verify>
    <automated>grep -c "✅ SHIPPED (2026-05-22)" .planning/ROADMAP.md && grep -c "## v1.0 — Production-ready GA" .planning/ROADMAP.md && grep -c "9 GA 验收标准" .planning/ROADMAP.md && grep -c "MILESTONE 3/3 SHIPPED & ARCHIVED" .planning/ROADMAP.md</automated>
  </verify>
  <done>
    Phase 5.3 row marked ✅ SHIPPED (2026-05-22); v0.5.0 chapter MILESTONE 3/3 SHIPPED & ARCHIVED
    note present; v1.0 chapter NEW with Goal + 9 GA criteria + Phase 6.1 outline + scope freeze guard
    + 关键风险 sections all present; chapter ~70-100L (verify by line range count between v0.5.0 chapter
    end and 拒绝清单 section).
  </done>
</task>

<task type="auto">
  <name>Task 2.5: MODIFY CHANGELOG.md — add [0.5.0] - 2026-05-22 stable release block (preserve alpha entries)</name>
  <files>CHANGELOG.md</files>
  <action>
    Sister CHANGELOG.md `## [0.4.0] - 2026-05-19` block (L48-78) format 100% reuse.

    **CRITICAL per D-05 + RESEARCH Pitfall #2**: PRESERVE alpha.1 + alpha.2 entries (Keep-a-Changelog
    standard). ADD `## [0.5.0] - 2026-05-22` block ABOVE existing alpha blocks (NOT replace them).

    Steps:
    1. Read CHANGELOG.md (79L total); identify `## [Unreleased]` section (if exists) and the first
       `## [0.5.0-alpha.X]` block location.
    2. Insert ABOVE the first alpha.2 block (or below Unreleased section if present):

    ```markdown
    ## [0.5.0] - 2026-05-22

    ### Added
    - R10.1 audit log --filter consumer (`harnessed audit-log` CLI subcommand; ADR 0021)
    - R10.2 state.ts concurrent write lock (`proper-lockfile@4.1.2`; ADR 0021)
    - R10.3 `harnessed uninstall <name>` CLI subcommand — 14th subcommand, dry-run default (ADR 0022)
    - R10.4 `src/manifest/lib/path-guard.ts` — 5-vector OWASP A1 path traversal guard (ADR 0022)
    - ADR 0021 — Phase 5.1 R10.1+R10.2 institutional lock
    - ADR 0022 — Phase 5.2 R10.3+R10.4 institutional lock
    - v0.5.0 milestone archive triplet — `.planning/milestones/v0.5.0-{ROADMAP,REQUIREMENTS,MILESTONE-AUDIT}.md`
    - `.planning/ROADMAP.md` v1.0 chapter NEW (Goal + 9 GA criteria + Phase 6.1 outline + scope freeze guard)

    ### Changed
    - `scripts/check-state-archive-stale.mjs` — SIZE_LIMIT 200→175→165→150 progressive tightening (D2 cadence rounds 1-3) [+ round 4 → 140 conditional per Task 0.2 result; OMIT this bullet IF #BA deferred]
    - `.github/workflows/ci.yml` — A7 step retroactive iter ADR 0001-0021 → ADR 0001-0022

    ### Fixed
    - `.github/workflows/ci.yml` — A7 step iter retroactive 0019/0020/0021 (Phase 5.1) + 0022 (Phase 5.2)
    ```

    3. Update bottom URL references (find pattern `[X.Y.Z]: https://github.com/easyinplay/harnessed/...`):
       - Add: `[0.5.0]: https://github.com/easyinplay/harnessed/releases/tag/v0.5.0`
       - Update Unreleased compare to start from v0.5.0: `[Unreleased]: https://github.com/easyinplay/harnessed/compare/v0.5.0...HEAD`

    **Anti-pattern guards** (RESEARCH Pitfall #2):
    - CHANGELOG should GROW (not shrink); if final wc -l < current 79L → BUG (alpha entries deleted)
    - Keep-a-Changelog: alpha.1 + alpha.2 sections REMAIN above v0.4.0 section
  </action>
  <verify>
    <automated>grep -c "## \[0.5.0\] - 2026-05-22" CHANGELOG.md && grep -c "## \[0.5.0-alpha.2\]" CHANGELOG.md && grep -c "## \[0.5.0-alpha.1\]" CHANGELOG.md && grep -c "## \[0.4.0\] - 2026-05-19" CHANGELOG.md && [ "$(wc -l < CHANGELOG.md)" -gt 79 ]</automated>
  </verify>
  <done>
    CHANGELOG.md grows from 79L to ~110-120L; [0.5.0] - 2026-05-22 block present;
    alpha.1 + alpha.2 + [0.4.0] blocks all PRESERVED; URL references updated.
  </done>
</task>

<task type="auto">
  <name>Task 2.6: MODIFY README.md L42-44 Status section + PROJECT-SPEC.md L1 status header</name>
  <files>README.md, PROJECT-SPEC.md</files>
  <action>
    **A2 resolution**: Verified actual location L42-44 (NOT L46-48 from CONTEXT). Use L42-44 actual.

    **README.md edits** (D-04 LOCKED wording; sister Phase 4.3 W2 T2.10 format 100% reuse):

    Replace L42-43 current content:
    ```
    - **Current**: v0.5.0 milestone IN PROGRESS 2/3 — **Phase 5.2 SHIPPED 2026-05-19** ...
    - **Next**: Phase 5.3 — v0.5.0 milestone close (3-file archive + 🎯 v0.5.0 tag) + v1.0 GA prep
    ```

    With (per D-04 LOCKED):
    ```
    - **Current**: 🎯 **v0.5.0 SHIPPED 2026-05-22** (4/4 milestones close — v0.1.0+v0.2.0+v0.3.0+v0.4.0+v0.5.0); Phase 5.3 close ceremony COMPLETE — 3-file archive triplet + CHANGELOG v0.5.0 stable + dual tag LOCAL
    - **Next**: Phase 6.x — 🎯 v1.0 GA tag + npm publish stream + README "stable" badge (window 2026-05-22~23 post-close independent)
    ```

    **L44 stays unchanged** (Full phase history + release plan + per-milestone audits link).

    **pre-launch badge KEEP** (D-04 sneak-block; README.md L7 area): DO NOT touch. NO change to
    `[![Status](https://img.shields.io/badge/status-pre--launch-orange)]`. Verify line untouched
    post-edit.

    **PROJECT-SPEC.md edit** (L1 status header — sister Phase 4.3 prepend cadence):

    Find: `> 状态：✅ **Locked v3** + 🎯 **v0.4.0 MILESTONE 3/3 SHIPPED & ARCHIVED 2026-05-19** ... + **Phase 5.2 SHIPPED 2026-05-19** — R10.3 ...`

    Prepend `+ 🎯 **v0.5.0 MILESTONE 3/3 SHIPPED & ARCHIVED 2026-05-22** (Phase 5.1+5.2+5.3 全 ship sister v0.4.0 close cadence延袭)` after `v0.4.0 MILESTONE` block, before existing trailing `+ **Phase 5.2 SHIPPED**` (which now becomes redundant since v0.5.0 close encompasses it — can trim that segment or keep as detail; recommend trim for terseness sister Phase 4.3 cadence).

    **Anti-pattern guards** (D-04 sneak-blocks):
    - DO NOT remove pre-launch badge
    - DO NOT add "production-ready" badge (v1.0 GA scope)
    - DO NOT add 'v1.0 GA upcoming' section to README (ROADMAP v1.0 chapter is canonical SoT)
  </action>
  <verify>
    <automated>grep -c "v0.5.0 SHIPPED 2026-05-22" README.md && grep -c "Phase 6.x" README.md && grep -c "status-pre--launch-orange" README.md && grep -c "v0.5.0 MILESTONE 3/3 SHIPPED" PROJECT-SPEC.md</automated>
  </verify>
  <done>
    README.md L42-43 updated to v0.5.0 SHIPPED + Phase 6.x Next; pre-launch badge intact (1
    occurrence); PROJECT-SPEC.md status header has v0.5.0 MILESTONE SHIPPED prepended.
  </done>
</task>

<task type="auto">
  <name>Task 2.7: NEW .planning/phase-5.3/DOGFOOD-T2.X.md — 3-axis PASS empirical verify</name>
  <files>.planning/phase-5.3/DOGFOOD-T2.X.md</files>
  <action>
    Sister `.planning/phase-5.2/DOGFOOD-T2.X.md` 3-axis format 100% reuse adapted for Phase 5.3
    CLOSE CEREMONY architectural scope.

    Adapted axes for close ceremony (per PATTERNS.md):
    - **Axis A** — 3-file archive triplet ship verify:
      - `wc -l` all 3 files present in `.planning/milestones/v0.5.0-*.md`
      - Karpathy ≤200L compliance table (v0.5.0-ROADMAP / v0.5.0-REQUIREMENTS / v0.5.0-MILESTONE-AUDIT)
      - § 7 Cadence Patterns trends = exactly 4 items verify (D-07 LOCKED)
    - **Axis B** — v1.0 chapter spec accuracy:
      - ROADMAP.md contains `## v1.0 — Production-ready GA` heading
      - Contains 9 GA criteria (numbered 1-9)
      - Contains Phase 6.1 outline
      - Contains scope freeze guard
      - Contains 关键风险 section
      - Line count ~70-100L (chapter only, between heading and next `##` section)
    - **Axis C** — tag annotation 9-line format verify (D-06 resolution of A1):
      - `git tag -l v0.5.0-alpha.3-close 🎯\ v0.5.0` shows both tags present
      - `git cat-file tag "🎯 v0.5.0"` annotation content has ~9 meaningful content lines
      - Ordering verify: alpha.3-close tag committer-date BEFORE 🎯 v0.5.0 tag committer-date
        (`git for-each-ref --sort=taggerdate --format='%(refname:short) %(taggerdate)' refs/tags/v0.5.0*` shows ordered)

    Template (~50-80L):
    ```markdown
    # DOGFOOD-T2.X — Phase 5.3 Wave 2 Close Ceremony Empirical Verify
    # Sister: Phase 5.2 DOGFOOD-T2.X.md format 100% reuse adapted Phase 5.3 CLOSE CEREMONY scope

    **Date**: 2026-05-22
    **Phase**: 5.3 Wave 2
    **Axes**: A (3-file triplet ship) / B (v1.0 chapter accuracy) / C (tag annotation 9-line format)
    **Verdict**: PASS 3/3 axes

    ## Axis A — 3-file archive triplet PASS

    [wc -l table for v0.5.0-ROADMAP/REQUIREMENTS/MILESTONE-AUDIT]
    [Karpathy ≤200L compliance verify]
    [§ 7 trends = 4 items count verify]

    ---

    ## Axis B — v1.0 chapter accuracy PASS

    [grep evidence ROADMAP.md headings]
    [9 GA criteria enumerated count]
    [chapter line range count]

    ---

    ## Axis C — tag annotation 9-line format + ordering PASS

    [git tag -l output]
    [git cat-file tag "🎯 v0.5.0" annotation content + line count]
    [git for-each-ref taggerdate ordering verify]

    ---

    ## Summary

    | Axis | Metric | Result |
    |------|--------|--------|
    | A | 3-file triplet ship + Karpathy + § 7 = 4 | PASS |
    | B | v1.0 chapter 9 GA criteria + ~70-100L | PASS |
    | C | tag annotation 9-line + ordering | PASS |

    **Phase 5.3 Wave 2 verdict: PASS — close ceremony complete, ready for milestone tag commit.**
    ```

    Note: This task should run AFTER Tasks 2.1-2.6 complete (Axis A+B verify their output) and
    AFTER tags created (Axis C). However, tag verification can defer to post-Task 2.9 — Task 2.7
    creates the DOGFOOD file with Axis A+B filled in; Axis C tag verify appended after Task 2.9.
    Alternatively: split DOGFOOD into two updates (initial Axis A+B + post-tag Axis C append).
    Recommend: Task 2.7 creates initial PASS A+B; Task 2.9 final step appends Axis C tag verify.
  </action>
  <verify>
    <automated>test -f .planning/phase-5.3/DOGFOOD-T2.X.md && [ "$(wc -l < .planning/phase-5.3/DOGFOOD-T2.X.md)" -ge 45 ] && grep -c "Axis A" .planning/phase-5.3/DOGFOOD-T2.X.md && grep -c "Axis B" .planning/phase-5.3/DOGFOOD-T2.X.md && grep -c "Axis C" .planning/phase-5.3/DOGFOOD-T2.X.md && grep -c "PASS 3/3" .planning/phase-5.3/DOGFOOD-T2.X.md</automated>
  </verify>
  <done>
    DOGFOOD-T2.X.md exists ≥45L; 3 axes present (A/B/C); Axis A+B filled in with empirical evidence
    (Axis C placeholder for post-tag-creation fill; final PASS 3/3 verdict line present).
  </done>
</task>

<task type="auto">
  <name>Task 2.8: MODIFY .planning/RETROSPECTIVE.md — Phase 5.3 section (7-section format, 60-80L)</name>
  <files>.planning/RETROSPECTIVE.md</files>
  <action>
    Sister Phase 5.1 + 5.2 retrospective format 100% reuse (7-section structure).

    **CRITICAL per D-07 + RESEARCH Pitfall #5**: NO trend duplication. Cross-milestone trends
    live in v0.5.0-MILESTONE-AUDIT § 7 ONLY (single SoT per D-04 COLLAPSE lesson). Phase 5.3
    retrospective is standard 7-section format covering Phase 5.3 close ceremony only.

    Append new section to RETROSPECTIVE.md (find end of existing milestone retrospective sections):

    ```markdown
    ## Phase 5.3 milestone retrospective — v0.5.0 milestone close + v1.0 GA prep (2026-05-22 ship) — 🎯 v0.5.0 MILESTONE 3/3 CLOSE

    ### What Went Well

    - Close ceremony 3-file triplet ship 1-day target met (sister v0.4.0 close cadence 100% reuse)
    - 3-recurrence (v0.3.0 + v0.4.0 + v0.5.0) close ceremony cadence stable — format mature, no surprises
    - D-decisions 4 HIGH + 4 MED/LOW batch discuss-phase model proven (sister Phase 5.1+5.2 cadence)
    - v1.0 chapter NEW BB path 4th-cycle review precedent (v0.4.0 close + v0.5 chapter同 ship) reused for v0.5.0 close + v1.0 chapter
    - D2 cadence iter 7 REINFORCE clean (post-iter-6 implicit-standing-process graduation; no cadence regression)

    ### What Surprised Us

    - A1 tag annotation: D-06 spec "9-line summary" but observed v0.4.0 = 1-line (planner-time resolution applied 9 content lines per D-06)
    - A2 README line numbers: CONTEXT cited L46-48; verified actual L42-44 (planner-time resolution applied)

    ### What We'd Change

    - Consider tightening Karpathy ≤200L hard limit per v0.5.0-MILESTONE-AUDIT borderline (~180-200L at ship)
    - § 7 Cadence Patterns content discipline (4-item Karpathy YAGNI limit) — institutionalize via ADR 0023 candidate IF v0.6+ recurrence

    ### Lessons Learned

    - 3-recurrence cadence (v0.3.0/v0.4.0/v0.5.0 close) stable but NOT yet ADR-worthy (5-recurrence terminus per ADR 0019 backfill heuristic)
    - Sister format 100% reuse + planner-time A1/A2 assumption resolution = efficient close ceremony 1-day ship

    ### Process Improvements

    - W0.1 D2 iter 7 + W0.2 SIZE_LIMIT round 4 same-task pattern (CONTEXT #BA + #BS) efficient — 1 W0 task handles 2 carry-forward items
    - Planner-time assumption resolution (A1 9-line / A2 L42-44) reduces executor decision burden

    ### Carry-forward (Phase 6.x / v1.0 GA)

    - Phase 6.x discuss-phase: v1.0 GA detailed task spec (ROADMAP v1.0 chapter is canonical input)
    - #BJ #BK process.exit / writeFileSync LOW cosmetic → Phase 6.x evaluate
    - #BL #BM SDK coupling F40-2 → DEFER PERMANENT
    - #BC #BD #BE #BN sister conditional → Phase 6.x or v1.0 GA Phase signal eval
    - User push approval pending (10+ LOCAL tags + accumulated commits per CLAUDE.md commit safety)

    ### Cost Patterns

    - commit 数: Phase 5.3 = ~10-14 atomic commits (sister Phase 4.3 13 + close ceremony similar)
    - tests 增量: 756 → 756 stable (NO src/ change per M-01 CLOSE CEREMONY; 0 NEW tests)
    - CI runs: ~3-4 runs (W0 + W2 + verify)
    - SIZE_LIMIT round 4: STATE.md post-trim NL → [FILLED per Task 0.2 result: FLIPPED 150→140 OR DEFERRED #BA]
    ```

    Target: 60-80L for this section.

    **Anti-pattern guards**:
    - 7 sections REQUIRED (sister Phase 5.1+5.2 format reuse)
    - NO trend duplication from v0.5.0-MILESTONE-AUDIT § 7 (Pitfall #5)
    - Cost Patterns section MUST include actual Task 0.2 result (NOT placeholder text at ship)
  </action>
  <verify>
    <automated>grep -c "Phase 5.3 milestone retrospective" .planning/RETROSPECTIVE.md && grep -c "### What Went Well" .planning/RETROSPECTIVE.md && grep -c "### Cost Patterns" .planning/RETROSPECTIVE.md && [ "$(grep -A 60 'Phase 5.3 milestone retrospective' .planning/RETROSPECTIVE.md | grep -c '^### ')" -ge 7 ]</automated>
  </verify>
  <done>
    RETROSPECTIVE.md has Phase 5.3 milestone retrospective section with 7 ### subsections;
    Cost Patterns includes Task 0.2 actual result (not placeholder); NO § 7 trends duplication.
  </done>
</task>

<task type="auto">
  <name>Task 2.9: MODIFY .planning/STATE.md post-close update — LAST doc commit before tag create</name>
  <files>.planning/STATE.md</files>
  <action>
    **CRITICAL ORDERING per sister T-4.3-07 STRIDE mitigation**: STATE update is the LAST
    doc commit BEFORE Task 2.10 dual-tag create. All prior tasks (2.1-2.8) MUST commit before
    this task; this task commits MUST land before tag create. R-5 mitigation.

    Sister Phase 4.3 W2 T2.11 STATE update cadence 100% reuse.

    Edits (per PATTERNS.md verified format):

    **"当前位置" block updates** (STATE.md L36-40):
    - L36 GSD phase: append `✅ **Phase 5.3 SHIPPED** (2026-05-22) — 🎯 v0.5.0 milestone close + v1.0 GA prep; **Phase 6.x next** — v1.0 GA discuss-phase`
    - L37 当前里程碑: `**v0.5.0 v1.0-RC2 minor 3/3 COMPLETE** 🎯 SHIPPED & ARCHIVED 2026-05-22`
    - L38 下一 phase: `**Phase 6.x discuss-phase 启动** (v1.0 GA; window 2026-05-22~23)`
    - L39 状态: `✅ **Phase 5.3 SHIPPED 2026-05-22** — 3-file milestone archive + CHANGELOG v0.5.0 + dual tag v0.5.0-alpha.3-close + 🎯 v0.5.0 LOCAL CREATE; DOGFOOD PASS 3/3`
    - L40 进度: `20 / 20 phases 已完成 ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 100%`

    **里程碑表 row update** (STATE.md L50):
    - Row v0.5.0: `3/3 | 🎯 **SHIPPED & ARCHIVED** — Phase 5.1 ✅ + Phase 5.2 ✅ + Phase 5.3 ✅ SHIPPED; archive .planning/milestones/v0.5.0-*.md triplet | 2026-05-19 ~ 2026-05-22`

    **已完成 phase ship 历史 update** (STATE.md L60 area — Phase 5.2 entry already archived in Task 0.1):
    - Add new Phase 5.3 bullet: `- **Phase 5.3 shipped** ✅ (2026-05-22) — v0.5.0 milestone close + 3-file archive triplet + CHANGELOG v0.5.0 + ROADMAP v1.0 chapter NEW + dual tag LOCAL`

    **frontmatter status update** (STATE.md L1-12):
    - `milestone: v0.5.0` (update from v0.4.0)
    - `milestone_name: v1.0-RC2 minor (audit log consumer + backlog absorb)`
    - `status: shipped`
    - `last_updated: "2026-05-22T..."` (use current ISO timestamp)
    - `progress.total_phases: 3` (Phase 5.1+5.2+5.3)
    - `progress.completed_phases: 3`

    **P0 待办 update** (STATE.md L77 area):
    - Mark Phase 5.3 SHIPPED in item 1
    - Update item 2 push approval list to include `v0.5.0-alpha.3-close + 🎯 v0.5.0`

    **Verify post-edit**: STATE.md ≤ current SIZE_LIMIT (150 or 140 per Task 0.2 result).
    Run `node scripts/check-state-archive-stale.mjs` — must exit 0.

    **Anti-pattern guards**:
    - DO NOT exceed current SIZE_LIMIT (D3 gate will fail commit)
    - DO NOT remove "当前位置" block structure (transparency-verdicts gate dependency)
    - This is the LAST commit before Task 2.10 dual-tag — verify all prior tasks committed first
  </action>
  <verify>
    <automated>node scripts/check-state-archive-stale.mjs && node scripts/check-transparency-verdicts.mjs && grep -c "Phase 5.3 SHIPPED" .planning/STATE.md && grep -c "20 / 20 phases" .planning/STATE.md && grep -c "Phase 6.x discuss-phase" .planning/STATE.md</automated>
  </verify>
  <done>
    STATE.md frontmatter status=shipped milestone=v0.5.0; "当前位置" block updated (5 lines);
    里程碑表 v0.5.0 row 3/3 SHIPPED; 进度 20/20 100%; D3 gate + transparency-verdicts both PASS;
    LAST commit before Task 2.10 dual-tag create per sister T-4.3-07 STRIDE ordering.
  </done>
</task>

<task type="auto">
  <name>Task 2.10: LOCAL CREATE 2 tags ordered — v0.5.0-alpha.3-close + 🎯 v0.5.0 (D-08 + D-06)</name>
  <files>(git tag operations; no file modifications)</files>
  <action>
    **CRITICAL ORDERING per D-08 + sister T-4.3-07 STRIDE + RESEARCH Pitfall #4**:
    1. baseline tag FIRST (`v0.5.0-alpha.3-close`)
    2. milestone tag SECOND (`🎯 v0.5.0`)
    NO push (LOCAL CREATE only per CLAUDE.md commit safety).

    **Pre-check**: Verify all doc commits from Tasks 0.1-0.3 + 2.1-2.9 have landed:
    - `git log --oneline -20` (confirm Task 2.9 STATE update is HEAD)
    - `git status` (confirm clean working tree)

    **Step 1 — Baseline tag** (sister Phase 5.1 alpha.1-audit-lock + Phase 5.2 alpha.2-uninstall-security cadence):
    Command: `git tag -a v0.5.0-alpha.3-close -m "v0.5.0-alpha.3-close: Phase 5.3 close ceremony COMPLETE — 3-file archive triplet (v0.5.0-{ROADMAP,REQUIREMENTS,MILESTONE-AUDIT}.md) + CHANGELOG v0.5.0 stable + ROADMAP v1.0 chapter NEW + README/PROJECT-SPEC status update + STATE trim D2 iter7 + RETROSPECTIVE Phase 5.3 7-section + dual tag LOCAL"`

    **Step 2 — Milestone tag** (D-06 9-content-line format per A1 resolution):
    Use a multi-line heredoc message capturing 9 content lines. Author the message file
    `/tmp/v0.5.0-tag-msg.txt` with the following lines (one per logical bullet):

    ```
    🎯 v0.5.0 milestone close — v1.0-RC2 minor: audit log consumer + state lock + uninstall + path-guard (Phase 5.1+5.2+5.3)

    Phase 5.1 (2026-05-19): R10.1 audit-log --filter consumer + R10.2 state.ts concurrent write lock (ADR 0021; 8 D-decisions)
    Phase 5.2 (2026-05-19): R10.3 harnessed uninstall 14th subcommand 7 uninstallers + R10.4 path-guard.ts 5-vector OWASP A1 (ADR 0022; 8 D-decisions)
    Phase 5.3 (2026-05-22): close ceremony — 3-file archive triplet + CHANGELOG v0.5.0 stable + ROADMAP v1.0 chapter NEW + dual tag LOCAL (M-01 CLOSE CEREMONY; 8 D-decisions)
    D2 cadence iter 1→6 implicit-standing-process graduation (≥6-iter terminus confirmed; iter 7 REINFORCE Phase 5.3 W0.1)
    SIZE_LIMIT 200→175→165→150 progressive tightening (4 rounds; round 4 conditional Phase 5.3 W0.2)
    M2 backlog discharge pattern stable — Phase 2.3→5.2 共 10 cycle 'deferred → next W0 一次根治'
    Sister review tiering 4-cycle (1st absorb → 2nd errata → 3rd reinforce → 4th BB path strategic LOCK 2026-05-19)
    Tags: v0.5.0-alpha.1-audit-lock + v0.5.0-alpha.2-uninstall-security + v0.5.0-alpha.3-close → 🎯 v0.5.0
    Tests: 720 (v0.4.0 close) → 756 (v0.5.0 close) +36; CI 三平台全绿; 22 ADR (0001-0022) A7 守恒
    ```

    Then create the tag using `git tag -a "🎯 v0.5.0" -F /tmp/v0.5.0-tag-msg.txt`
    (the `-F` file form avoids shell-quoting complexity for the multi-line content).

    **Step 3 — Verify** (DO NOT PUSH):
    - `git tag -l "v0.5.0-alpha.3-close" "🎯 v0.5.0"` — both must appear
    - `git cat-file tag "🎯 v0.5.0" | tail -20` — verify multi-line annotation present (NOT 1-line)
    - `git for-each-ref --sort=taggerdate --format='%(refname:short) %(taggerdate:iso8601)' refs/tags/v0.5.0-alpha.3-close 'refs/tags/🎯 v0.5.0'` — ordering verify: alpha.3-close BEFORE 🎯 v0.5.0

    **Anti-pattern guards** (D-08 sneak-blocks + RESEARCH Pitfalls):
    - NO third tag (D-02 NO ADR 0023 → NO adr-0023-accepted tag; dual only)
    - NO push to remote (CLAUDE.md commit safety; user push approval pending P0 item 2)
    - 🎯 v0.5.0 annotation MUST be multi-line (~9 content lines per D-06; A1 resolution prescribes 9-line format despite observed v0.4.0 1-line precedent)
    - alpha.3-close tag committer-date MUST precede 🎯 v0.5.0 tag committer-date (R-5 STRIDE mitigation)
  </action>
  <verify>
    <automated>git tag -l "v0.5.0-alpha.3-close" | grep -c "v0.5.0-alpha.3-close" && git tag -l "🎯 v0.5.0" | grep -c "v0.5.0" && [ "$(git cat-file tag '🎯 v0.5.0' | wc -l)" -ge 9 ]</automated>
  </verify>
  <done>
    Two LOCAL tags exist: v0.5.0-alpha.3-close (baseline) + 🎯 v0.5.0 (milestone annotated multi-line);
    ordering verified alpha.3-close before 🎯 v0.5.0; NO push executed; annotation ≥9 content lines.
  </done>
</task>

<task type="auto">
  <name>Task 2.11: Final CI gates verify + DOGFOOD Axis C append + W2 SUMMARY commit</name>
  <files>.planning/phase-5.3/DOGFOOD-T2.X.md (Axis C append), .planning/phases/05.3-v0.5.0-milestone-close/05.3-01-SUMMARY.md (NEW)</files>
  <action>
    Final verify + summary commit.

    **Step 1 — Append DOGFOOD Axis C** (post-tag-creation tag annotation verify per Task 2.7 deferred):
    Update `.planning/phase-5.3/DOGFOOD-T2.X.md` Axis C section with actual evidence:
    - `git tag -l` output showing both tags present
    - `git cat-file tag "🎯 v0.5.0"` content (paste annotation lines, verify ≥9)
    - `git for-each-ref --sort=taggerdate` output proving ordering

    **Step 2 — CI gates final verify** (close ceremony all green):
    - `node scripts/check-state-archive-stale.mjs` (must exit 0)
    - `node scripts/check-transparency-verdicts.mjs` (must exit 0)
    - `corepack pnpm test --run` (756+ PASS; no regression NO src change)
    - `corepack pnpm typecheck` (exit 0)
    - biome NOT needed Phase 5.3 (NO TS/JS commit)

    **Step 3 — Create Phase 5.3 SUMMARY** at `.planning/phases/05.3-v0.5.0-milestone-close/05.3-01-SUMMARY.md` (sister cadence):
    Use $HOME/.claude/get-shit-done/templates/summary.md as base; otherwise minimal sister format:

    ```markdown
    # Phase 5.3 — SUMMARY

    **Ship date**: 2026-05-22
    **Status**: ✅ SHIPPED
    **Scope**: v0.5.0 milestone close ceremony

    ## Artifacts
    - 4 NEW files: .planning/milestones/v0.5.0-{ROADMAP,REQUIREMENTS,MILESTONE-AUDIT}.md + DOGFOOD-T2.X.md
    - 7 MODIFIED files: STATE.md, RETROSPECTIVE.md, ROADMAP.md, CHANGELOG.md, README.md, PROJECT-SPEC.md, scripts/check-state-archive-stale.mjs (conditional)
    - 2 LOCAL tags: v0.5.0-alpha.3-close + 🎯 v0.5.0

    ## Verification
    - DOGFOOD-T2.X.md PASS 3/3 axes
    - CI gates green (state-archive-stale + transparency-verdicts + tests + typecheck)
    - Tests 756 stable (NO src change; 0 NEW tests)
    - 22 ADR (0001-0022) A7 守恒 maintained

    ## Key decisions LOCKED Phase 5.3
    - D-01 仅 v0.5.0 close (NOT v1.0 GA tag)
    - D-02 NO new ADR
    - D-03 v1.0 chapter NEW in ROADMAP
    - D-04 README Status update + keep pre-launch badge
    - D-05 CHANGELOG v0.5.0 stable consolidate (preserve alpha)
    - D-06 milestone tag 9-line annotation
    - D-07 trends in v0.5.0-MILESTONE-AUDIT § 7
    - D-08 dual tag LOCAL CREATE

    ## Carry-forward (Phase 6.x)
    - [If Task 0.2 result was DEFER] #BA SIZE_LIMIT round 4 → Phase 6.x signal eval
    - #BJ #BK LOW cosmetic → Phase 6.x
    - #BC #BD #BE #BN sister conditional → Phase 6.x signal eval
    - User push approval pending (10+ LOCAL tags accumulated per P0 item 2)
    - v1.0 GA Phase 6.x discuss-phase (ROADMAP v1.0 chapter is canonical input)
    ```

    **Step 4 — Final commit** (sister cadence):
    `git add .planning/phase-5.3/DOGFOOD-T2.X.md .planning/phases/05.3-v0.5.0-milestone-close/05.3-01-SUMMARY.md`
    `git commit -m "docs(phase-5.3-w2): T2.11 — DOGFOOD Axis C post-tag verify + SUMMARY final ship 🎯 v0.5.0 close"`

    **NOTE**: Tag creation in Task 2.10 happened BETWEEN Task 2.9 STATE commit and Task 2.11
    SUMMARY commit. Tags annotate the post-STATE-update commit (correct anchor per sister cadence).

    **NEVER push** without user approval (per CLAUDE.md commit safety). All tags + commits remain
    LOCAL per P0 item 2 STATE.md.
  </action>
  <verify>
    <automated>node scripts/check-state-archive-stale.mjs && node scripts/check-transparency-verdicts.mjs && corepack pnpm test --run && corepack pnpm typecheck && test -f .planning/phases/05.3-v0.5.0-milestone-close/05.3-01-SUMMARY.md && grep -c "PASS 3/3" .planning/phase-5.3/DOGFOOD-T2.X.md</automated>
  </verify>
  <done>
    DOGFOOD-T2.X.md Axis C populated with post-tag evidence; SUMMARY file created;
    all 4 CI gates green; 756+ tests PASS no regression; NO push executed;
    Phase 5.3 W2 close ceremony COMPLETE.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Local git → remote origin | LOCAL CREATE tags + commits must NOT push without user approval (CLAUDE.md commit safety) |
| Planning docs SoT integrity | Single SoT discipline: trends in MILESTONE-AUDIT § 7 only (NOT RETROSPECTIVE); README references ROADMAP canonical |
| Karpathy ≤200L hard limit | v0.5.0-MILESTONE-AUDIT.md borderline; § content discipline boundary |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-5.3-01 | T (Tampering) | git tags v0.5.0-alpha.3-close + 🎯 v0.5.0 ordering | mitigate | Task 2.10 STRICT ordering — baseline FIRST, milestone SECOND; sister T-4.3-07 STRIDE precedent; verify via `git for-each-ref --sort=taggerdate` |
| T-5.3-02 | I (Information Disclosure) | LOCAL tag push without user approval | mitigate | NO push commands in any task; explicit "NEVER push" guard in Task 2.10 + Task 2.11; P0 item 2 STATE accumulates pending tags |
| T-5.3-03 | R (Repudiation) | Trend duplication across MILESTONE-AUDIT § 7 + RETROSPECTIVE | mitigate | D-07 LOCKED + RESEARCH Pitfall #5 + Task 2.8 anti-pattern guard; single SoT discipline (D-04 COLLAPSE 5-recurrence terminus lesson) |
| T-5.3-04 | D (Denial of Service) | v0.5.0-MILESTONE-AUDIT.md > 200L Karpathy violation | mitigate | Task 2.3 explicit budget 180-200L + split fallback (§ 6 prose OR § 7 trends → follow-on file); R-1 risk top mitigation |
| T-5.3-05 | E (Elevation) | Scope creep — v1.0 chapter includes Phase 6.x detailed task spec | mitigate | Task 2.4 anti-pattern guard + D-03 sneak-block + RESEARCH Pitfall #3; chapter ~70-100L outline only |
| T-5.3-06 | S (Spoofing) | CHANGELOG alpha entries deleted (sneak replace instead of append) | mitigate | Task 2.5 explicit preserve guard + RESEARCH Pitfall #2 + verify CHANGELOG.md grows from 79L (not shrinks) |
| T-5.3-07 | T (Tampering) | STATE.md SIZE_LIMIT flip without post-trim verify | mitigate | Task 0.2 decision tree explicit (CONDITIONAL not pre-decided) + RESEARCH Pitfall #6; verify wc -l after Task 0.1 BEFORE flip |
</threat_model>

<verification>
## Phase 5.3 Acceptance Criteria

### 3-file archive triplet
- [ ] `.planning/milestones/v0.5.0-ROADMAP.md` exists 50-70L sister v0.4.0 format match
- [ ] `.planning/milestones/v0.5.0-REQUIREMENTS.md` exists 55-75L R10.1-R10.4 all ✅ Done
- [ ] `.planning/milestones/v0.5.0-MILESTONE-AUDIT.md` exists 170-200L (Karpathy ≤200L PASS) + § 7 = 4 trends exactly

### ROADMAP + v1.0 chapter
- [ ] Phase 5.3 row marked ✅ SHIPPED (2026-05-22)
- [ ] v0.5.0 chapter has MILESTONE 3/3 SHIPPED & ARCHIVED note
- [ ] v1.0 chapter NEW present with Goal + 9 GA criteria + Phase 6.1 outline + scope freeze guard + 关键风险 (~70-100L)

### CHANGELOG
- [ ] `## [0.5.0] - 2026-05-22` release line present ABOVE alpha entries
- [ ] alpha.1 + alpha.2 entries PRESERVED (Keep-a-Changelog standard)
- [ ] CHANGELOG.md grows from 79L (NOT shrinks)

### User-facing docs
- [ ] README.md L42-43 Status section shows v0.5.0 SHIPPED + Phase 6.x Next
- [ ] pre-launch badge KEPT at README.md L7 area (D-04 sneak-block)
- [ ] PROJECT-SPEC.md L1 status header has v0.5.0 MILESTONE SHIPPED prepended

### State + retrospective
- [ ] STATE.md 当前里程碑 v0.5.0 100% CLOSE; 进度 20/20 100%; ≤ current SIZE_LIMIT
- [ ] STATE.md Phase 5.2 narrative archived (D2 iter 7) → RETROSPECTIVE
- [ ] RETROSPECTIVE.md Phase 5.3 section 7-section format
- [ ] NO trends duplicated between MILESTONE-AUDIT § 7 and RETROSPECTIVE

### Dual tag LOCAL
- [ ] `v0.5.0-alpha.3-close` tag exists (baseline; sister alpha.1+alpha.2 cadence)
- [ ] `🎯 v0.5.0` tag exists (milestone; annotated ~9 content lines per D-06)
- [ ] Ordering: alpha.3-close committer-date BEFORE 🎯 v0.5.0 committer-date
- [ ] NO push executed (LOCAL CREATE only per CLAUDE.md commit safety)

### CI + tests
- [ ] state-archive-stale gate exit 0
- [ ] transparency-verdicts gate exit 0
- [ ] Tests 756+ PASS no regression (NO src/ change expected)
- [ ] typecheck exit 0
- [ ] biome N/A (NO TS/JS commit per M-01 CLOSE CEREMONY)

### DOGFOOD
- [ ] `.planning/phase-5.3/DOGFOOD-T2.X.md` PASS 3/3 axes (A triplet + B v1.0 chapter + C tag annotation)
- [ ] `.planning/phases/05.3-v0.5.0-milestone-close/05.3-01-SUMMARY.md` final summary commit
</verification>

<success_criteria>
**Phase 5.3 CLOSE CEREMONY SHIPPED** when all of the following are TRUE:

1. **v0.5.0 milestone CLOSED** — 3-file archive triplet in `.planning/milestones/v0.5.0-*.md` + ROADMAP Phase 5.3 row ✅ SHIPPED + 当前里程碑 100%
2. **v1.0 GA prepared** — ROADMAP v1.0 chapter NEW (~70-100L outline) ready for Phase 6.x discuss-phase direct reuse
3. **Dual tag LOCAL** — `v0.5.0-alpha.3-close` + `🎯 v0.5.0` exist, ordered, annotated multi-line; NO push
4. **CHANGELOG v0.5.0 stable** — `## [0.5.0] - 2026-05-22` release line + alpha.1/alpha.2 preserved
5. **Karpathy ≤200L** — all NEW files comply (v0.5.0-MILESTONE-AUDIT borderline tightly budgeted)
6. **NO scope creep** — 0 src/ change + 0 new ADR + 0 ci.yml A7 iter + 0 triple-tag (M-01 + D-02 + D-08 SNEAK-BLOCKS enforced)
7. **CI green** — state-archive-stale + transparency-verdicts + 756+ tests + typecheck all PASS
8. **Cross-milestone trends institutionalized** — v0.5.0-MILESTONE-AUDIT § 7 exactly 4 trends (D-07 LOCKED Karpathy YAGNI limit)
9. **Cadence reuse 100%** — sister v0.3.0 + v0.4.0 close cadence延袭 (3-recurrence stable but NOT yet ADR-worthy per 5-recurrence terminus)

## Risk matrix (top 5)

| ID | Severity | Risk | Mitigation |
|----|----------|------|------------|
| R-1 | LOW | v0.5.0-MILESTONE-AUDIT.md > 200L Karpathy edge | Task 2.3 tight per-section budget; split § 6 prose OR § 7 trends to follow-on file if exceed |
| R-2 | LOW | Tag annotation A1: D-06 9-line vs observed v0.4.0 1-line | Planner prescribes 9 content lines per D-06 LOCKED; A1 resolved at planner time |
| R-3 | LOW | README L42-44 vs L46-48 A2 location mismatch | Planner verified actual L42-43; A2 resolved at planner time |
| R-4 | LOW | STATE post-trim size #BA flip conditional | Task 0.2 decision tree explicit (NOT pre-decide); 3 branches CONDITIONAL |
| R-5 | LOW | Dual-tag ordering load-bearing (sister T-4.3-07 STRIDE) | Task 2.9 STATE update LAST before Task 2.10 tag create; STRICT ordering documented |
</success_criteria>

<output>
After completion, create `.planning/phases/05.3-v0.5.0-milestone-close/05.3-01-SUMMARY.md` summarizing:
- All artifacts shipped (4 NEW + 7 MODIFIED + 2 LOCAL tags)
- DOGFOOD-T2.X.md PASS 3/3 verdict
- Task 0.2 SIZE_LIMIT round 4 actual decision (FLIPPED 150→140 OR DEFERRED #BA)
- Carry-forward to Phase 6.x
- User push approval pending (P0 item 2)

Sister Phase 4.3 W2 T2.11 SUMMARY cadence 100% reuse.
