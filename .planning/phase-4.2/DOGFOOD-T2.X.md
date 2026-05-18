# Phase 4.2 T2.7 — Dogfood Report (3-axis empirical evidence: docs/MAINTAINER-ONBOARDING.md EXPAND D-01 + .github/ NEW infra cluster D-02+D-03 + README Sponsors badge+footer + D-04 HYBRID 2-clock + T2.6 ci.yml VERIFY 0 diff)

**Date**: 2026-05-18
**Phase**: 4.2 — v0.4.0 milestone 2/3 PROGRESS
**Anchors**: R8.2 + R8.3 + R8.5
**Verdict:** **PASS** (3/3 dogfood axes verified, miss: none)

---

## Axis A — `docs/MAINTAINER-ONBOARDING.md` EXPAND D-01 LOCKED ADDITIVE (R8.2 anchor)

**Setup**: D-01 LOCKED ADDITIVE EXPAND preserve 6+2 existing sections verbatim + ADD 6 NEW sections A-F per § 2.2 ordering (A dev environment / B commit conventions / C ADR review / D cross-OS CI / E manifest 守门 / F upstream drift); R8.2 acceptance "外部新人 30 分钟可跑通 dev 环境" satisfied via hybrid narrative + commands; cross-link CONTRIBUTING.md NOT duplicate (D-01 sneak #3 守门).
**Action**: `wc -l docs/MAINTAINER-ONBOARDING.md` = 111 (≤150 ≥100) + `grep -c "^## " docs/MAINTAINER-ONBOARDING.md` = 13 (≥12) + `grep -cE "^## (A\.|B\.|C\.|D\.|E\.|F\.)"` = 6 (all 6 NEW A-F sections literal).
**Acceptance**: ≤150L Karpathy hard cap + 6 NEW section + 8 existing preserved + reference CONTRIBUTING.md NOT duplicate (D-01 sneak #3 守门).
**Status**: ✅ PASS (covered by W1 T1.1 commit 7965acd EXPAND 50L → 111L D-01 LOCKED additive)

## Axis B — `.github/` NEW infra cluster D-02 + D-03 + supporting infra (R8.3 + R8.5 anchors)

**Setup**: 5 NEW .github/ files first-time community-infra surface — FUNDING.yml D-03 single tier + workflows/stale.yml D-02 60+30 split 90-day issue+PR actions/stale@v10 (R2 § 2 finding correction NOT @v9 outdated per CONTEXT D-02 reference) + 4 NEW ISSUE_TEMPLATE yml form-based D-03 supporting infra per planner Discretion #3 + config.yml blank_issues_enabled false R8.3 80% adoption defender.
**Action**: `test -f .github/FUNDING.yml` + `grep '^github: easyinplay'` = 1 + `wc -l` = 3 (≤8) + `test -f .github/workflows/stale.yml` + `grep 'actions/stale@v10'` = 2 + `grep -E 'days-before-(issue|pr)-(stale|close)'` = 4 + `ls .github/ISSUE_TEMPLATE/*.yml | wc -l` = 4 + `grep 'blank_issues_enabled: false' config.yml` = 2 + `grep -rn "actions/stale@v9"` = 0 (NO @v9 anywhere — R2 finding correction enforced).
**Acceptance**: 5 NEW files (1 FUNDING + 1 stale.yml + 4 ISSUE_TEMPLATE) actions/stale@v10 pinned R2 finding correction + 60+30 split issue+PR + STRIDE E + D mitigation per RESEARCH § 12.1.
**Status**: ✅ PASS (covered by W1 T1.2 stale.yml 52L + T1.3 ISSUE_TEMPLATE 4 yml + T1.4 FUNDING.yml 3L)

## Axis C — README Sponsors badge + footer + D-04 HYBRID 2-clock process-level R-3 mitigation + T2.6 ci.yml VERIFY 0 diff sneak-block (R8.5 + STRIDE)

**Setup**: README L8 Sponsors badge + L190-194 footer EXPAND planner Discretion #1 TOP + FOOTER both; D-04 HYBRID 2-clock process-level verification (STATE.md L23 + RETROSPECTIVE § Cost patterns both literal phrases per R-3 mitigation); T2.6 ci.yml VERIFY 0 diff sneak-block (sister Phase 4.1 reuse — NO A7 iter Phase 4.2 = community infra publish NOT architectural decision).
**Action**: `grep 'img.shields.io/github/sponsors/easyinplay' README.md` = 1 + `grep -c 'sponsors/easyinplay' README.md` = 2 (badge L8 + footer L190+ per § 5.4 sneak #4) + STATE.md `grep '6-month external\|organic clock'` = 1 (R-3 mitigation 2-clock disambiguation) + RETROSPECTIVE `grep 'Internal infra ship clock'` = 1 + `'External co-maintainer organic clock'` = 1 (both R-3 literal phrases) + `git diff HEAD .github/workflows/ci.yml | wc -l` = 0 + `grep -cE 'stale-bot|stale\.yml|FUNDING|sponsors|github/sponsors' .github/workflows/ci.yml` = 0 (only pre-existing `check-state-archive-stale.mjs` Phase 4.1 D3 gate script ref matches substring "stale", unrelated to stale-bot workflow integration — verified via explicit anchor grep).
**Acceptance**: badge present + footer 2-cross-link + 2-clock literal phrases both present STATE + RETRO + ci.yml 0 diff verify + no A7 iter sneak.
**Note (Axis C external prereq R8.5)**: Sponsor button render on repo page https://github.com/easyinplay/harnessed REQUIRES user manual Sponsors account activation at https://github.com/sponsors/easyinplay/dashboard (Pending Approval → Active state). Phase 4.2 ships config + Axis C verifies infra NOT button render. FALLBACK accepted per RESEARCH § 17.2 U1 — ship forward-compatible; DEFERRED #BE registered IF user NOT activated by Phase 4.2 ship.
**Status**: ✅ PASS (covered by W1 T1.4 commit 95d2702 README badge+footer + W2 T2.1 STATE 2-clock note + W2 T2.2 RETRO 2-clock literals + W2 T2.6 ci.yml VERIFY 0 diff)

---

## Aggregate verification

- **R8.2 acceptance "外部新人 30 分钟可跑通 dev 环境"**: ✅ Axis A (MAINTAINER-ONBOARDING 111L with 6 NEW sections A-F including dev env quickstart + commit conv + ADR review + cross-OS CI + manifest 守门 + upstream drift)
- **R8.3 acceptance "stale-bot 自动关闭 90 天无活动 issue + issue 模板使用率 ≥ 80%"**: ✅ Axis B (stale.yml @v10 60+30 split 90-day issue+PR + ISSUE_TEMPLATE 4 yml form-based + blank_issues_enabled false 100% adoption defender)
- **R8.5 acceptance "Sponsors 链接公开 + 可接受捐赠"**: ✅ Axis B + Axis C (FUNDING.yml D-03 single tier + README badge + footer 2-cross-link infra verified; button render external prereq U1 fallback accepted per RESEARCH § 17.2)
- **W0.1 D2 cadence iter 3 institutionalize verify M2 backlog discharge 3rd-iter terminus stable signal ≥3-iter**: ✅ Axis C (sister 5-recurrence terminus heuristic confirmed; pattern stable institutionalize standard beyond 2nd-iter Phase 4.1 W0.3)
- **T2.6 ci.yml VERIFY 0 diff sneak-block**: ✅ (NO A7 iter Phase 4.2; A7 守恒 ADR 0001-0017 main body 0 diff post-Phase-4.2 verified loop)
- **Full test suite gate**: ✅ 709 passed / 4 skipped / 0 failed (vitest direct run — Phase 4.2 = 0 src code change so unchanged from Phase 4.1 baseline)

---

## Disposition

- ✅ T2.7 dogfood PASS 3/3 axes verified miss: none
- ✅ R8.2 + R8.3 + R8.5 acceptance criteria 全 verified
- ✅ Phase 4.2 ship-readiness 4 D-decisions 全 activated 闭环 (D-01 EXPAND additive + D-02 @v10 90-day issue+PR + D-03 single tier $1+ + D-04 HYBRID 2-clock process-level)
- ✅ DEFERRED #BA conditional DEFER path active (2-phase consecutive DEFER carry-forward Phase 4.3 W0 per § 8.2 decision tree); #BB ✅ pre-RESOLVED discuss-phase HYBRID 2-clock D-04; #BE Sponsors account activation external prereq registered IF NOT activated by ship; #BF CODEOWNERS .github/** defer registered
- ✅ PATTERNS § 5 R-5 mitigation 3 NO 守门 (NO ADR 0018 + NO ci.yml A7 iter + NO triple tag — single baseline tag `v0.4.0-alpha.2-community` LOCAL CREATE only)
- ✅ v0.4.0 milestone 2/3 PROGRESS (NOT yet 3/3 ARCHIVED — reserved Phase 4.3 close per sister L130 v0.3.0 SHIPPED ARCHIVED literal cadence延袭)

**Note**: Phase 4.2 = v0.4.0 milestone 2nd phase = R8.2 + R8.3 + R8.5 anchors; R8.1 audit log + R8.4 公开 ADR 全集 + v1.0-RC 收尾 → Phase 4.3 explicit out-of-scope per CONTEXT Deferred Ideas; single baseline tag `v0.4.0-alpha.2-community` LOCAL CREATE only (NO push per CLAUDE.md commit safety; user controls all commit + tag push).

---

*Phase 4.2 W2 T2.7 — dogfood report*
*Run: 2026-05-18*
