# Phase 4.1 T2.7 — Dogfood Report (3-axis empirical evidence: docs/benchmarks/v0.4.md FULL D-02 + docs/benchmarks/v0.4-upgrade-e2e.log 4-section D-03 + W0.1 D3 ENFORCE + W0.3 D2 cadence iter 2 institutionalize verify)

**Date**: 2026-05-18
**Verdict:** **PASS** (3/3 dogfood axes verified, miss: none)

---

## Axis A — `docs/benchmarks/v0.4.md` NEW 30-task FULL per-task disclosure (D-01 REUSE + D-02 FULL)

**Setup**: docs/benchmarks/v0.4.md NEW 302L W1 T1.1 inaugurates `docs/benchmarks/` NEW surface (was empty .gitkeep only); D-01 LOCKED REUSE `.planning/phase-3.4/SAMPLES.md` 30-row REAL HISTORICAL single SoT (NO new mining sneak block); D-02 LOCKED FULL per-task 5-element schema (raw_prompt verbatim + routing_decision rule_id+tier+skill + actual_command_executed + manual_review_verdict + recovery_path).
**Action**: `wc -l docs/benchmarks/v0.4.md` (302 ≤400) + `grep -c "^### T[0-9][0-9]" docs/benchmarks/v0.4.md` (≥30) + `grep -c "Raw prompt\|Routing decision\|Manual review verdict" docs/benchmarks/v0.4.md` (≥90).
**Acceptance**: ≤400L hard cap (planner Discretion #1 LOCK; R-01 mitigation) + 30 task sections + 30 × 5-field schema verified; cross-link SAMPLES.md ≥2 occurrences (D-01 single SoT sneak block守门); §3 footer 30/30 100% Total + §3 per-tier breakdown Sonnet/Haiku/Opus 10/10 each (sister Phase 3.4 W1 T1.6 routing harness verbatim cite); §4 anti-vanity footer 反"美化"声明 anchored ROADMAP L222.
**Status**: ✅ PASS (covered by W1 T1.1 manual review + T1.6 integrity verify commit 375b1eb)

## Axis B — `docs/benchmarks/v0.4-upgrade-e2e.log` NEW 4-section text log (D-03 TEXT LOG zero-dep + planner Discretion #5 ctx7 + gstack install_method 多样性)

**Setup**: docs/benchmarks/v0.4-upgrade-e2e.log NEW 122L W1 T1.4 D-03 LOCKED zero-dep plain text 4-section log (sister Karpathy precedent NO asciinema npm dep + NO mp4/gif/png > 100KB sneak block); planner Discretion #5 picks ctx7 (npm-cli install_method) + gstack (git-clone-with-setup install_method) install_method 多样性 covering main install method spectrum.
**Action**: `wc -l docs/benchmarks/v0.4-upgrade-e2e.log` (122 ≤150) + `file docs/benchmarks/v0.4-upgrade-e2e.log` (ASCII text) + `wc -c docs/benchmarks/v0.4-upgrade-e2e.log` (<102400) + `grep -c "^=== " docs/benchmarks/v0.4-upgrade-e2e.log` (≥4) + `grep -c "asciinema" package.json` (=0).
**Acceptance**: ≤150L Karpathy hard + ASCII text (no binary D-03 sneak block) + < 100KB D-03 sneak block + ≥4 `=== § N` section headers per manifest (4-section per D-03 × 2 manifests) + 0 asciinema npm dep (D-03 sneak block守门).
**Status**: ✅ PASS (covered by W1 T1.3 + T1.4 manual review + T1.6 integrity verify commit 375b1eb + d7ca6fe)

## Axis C — W0.1 D3 ENFORCE flip + W0.3 D2 cadence iter 2 institutionalize verify (DEFERRED #AF resolved + #AG partial resolve)

**Setup**: W0 backlog 3 项一次根治 STRICT path dep W0.3 → W0.1 → W0.5: T0.1 W0.3 D2 cadence iter 2 trim Phase 3.3+3.4 narrative → RETROSPECTIVE.md `## § ARCHIVED FROM STATE — Phase 3.3+3.4` section (sister M2 backlog discharge institutionalize verify 2nd-iter beyond 1st-implementation pattern stable) + T0.2 W0.1 D3 ENFORCE flip `const ENFORCE = false` → `const ENFORCE = true` (DEFERRED #AF RESOLVED; sister Phase 2.1 → 2.2 1-phase cadence延袭) + T0.3 W0.5 CONDITIONAL D1 SIZE_LIMIT 200→150 DEFER path active per § 7.1 decision tree (post-W0.3 STATE 143L insufficient ≥10L headroom; DEFERRED #BA carry-forward Phase 4.2 W0).
**Action**: `node scripts/check-state-archive-stale.mjs` (exit 0 with ENFORCE=true post-flip) + `grep -q "ARCHIVED FROM STATE — Phase 3.3" .planning/RETROSPECTIVE.md` (PASS) + `wc -l .planning/STATE.md` (151L ≤200L) + `grep -q "const ENFORCE = true" scripts/check-state-archive-stale.mjs` (PASS).
**Acceptance**: ENFORCE=true gate exit 0 PASS round 2 (3 rules: STATE ≤200L round 1 path + 0 关键决议 ship 总结 sections + 0 W-N errata literals) + RETROSPECTIVE.md ARCHIVED FROM STATE — Phase 3.3+3.4 section present (W0.3 D2 cadence 2nd-iter institutionalize verify M2 backlog discharge pattern stable) + ENFORCE=true literal verified at scripts/check-state-archive-stale.mjs.
**Status**: ✅ PASS (W0.1 ENFORCE flip + W0.3 archive section verified post-T0.1 + T0.2 + T0.3; DEFERRED #AF RESOLVED + #AG partial resolve DEFER path #BA carry)

---

## Aggregate verification

- **R8.1 acceptance "原始数据公开任何人可复现"**: ✅ Axis A (302L FULL 30-task 5-field schema + cross-link SAMPLES.md + 反"美化"声明 footer) + Axis B (122L 4-section TEXT LOG D-03 zero-dep cross-OS portable grep-able)
- **D-04 MANUAL re-run cadence (R9.4 上游升级 cadence)**: ✅ docs/CONTRIBUTING-BENCHMARK.md NEW 30L W1 T1.5 manual re-run instructions (planner Discretion #4 separate NEW file LOCK; sister Phase 3.4 D-02 install path 安静 一致 NO 新 CI 表面)
- **W0.1 D3 gate ENFORCE flip cadence**: ✅ Axis C (DEFERRED #AF RESOLVED; sister Phase 2.1 → 2.2 1-phase cadence延袭 verified Phase 3.4 → Phase 4.1)
- **W0.3 D2 cadence iter 2 M2 backlog discharge institutionalize**: ✅ Axis C (RETROSPECTIVE.md ARCHIVED FROM STATE — Phase 3.3+3.4 section + W0.1 ENFORCE=true gate post-archive PASS — pattern stable 2nd-iter beyond 1st-implementation)
- **T2.6 ci.yml VERIFY 0 diff (no A7 iter Phase 4.1)**: ✅ `git diff HEAD .github/workflows/ci.yml | wc -l = 0` + `grep -c "benchmark" .github/workflows/ci.yml = 0` + `ls .github/workflows/ | grep -c benchmark = 0` (all 3 sneak-block守门 PASS; PATTERNS § 5 risk #3 mitigation活用)
- **Full test suite gate**: ✅ 709 passed / 4 skipped / 0 failed (vitest direct invoke run; sister W1 T1.6 integrity test +8 cells / W0.2 ENFORCE flip downstream regression fix bundled R-02 over-tighten brittle mitigation)

---

## Disposition

- ✅ T2.7 dogfood PASS 3/3 axes verified
- ✅ R8.1 + R9.2 + R9.4 acceptance criteria 全 verified (3 REQ-ID confirmed)
- ✅ Phase 4.1 ship-readiness 4 D-decisions 全 activated 闭环 (D-01 REUSE Phase 3.4 SAMPLES.md / D-02 FULL per-task disclosure / D-03 TEXT LOG zero-dep / D-04 MANUAL on-demand)
- ✅ DEFERRED #AF ✅ RESOLVED Phase 4.1 W0 (T0.2 W0.1)
- ✅ DEFERRED #AG ✅ partially RESOLVED Phase 4.1 W0 (T0.3 W0.5 DEFER path active → #BA carry-forward Phase 4.2 W0 LOW priority)
- ✅ W0 backlog 3 项一次根治 + W0.3 D2 cadence iter 2 M2 backlog discharge institutionalize verify pattern stable
- ✅ PATTERNS § 5 risk #3 mitigation活用 3 NO 守门 (NO ADR 0018 + NO ci.yml A7 iter + NO triple tag — single baseline tag `v0.4.0-alpha.1-benchmark` LOCAL CREATE only)
- ✅ v0.4.0 milestone 1/3 PROGRESS (NOT yet 3/3 ARCHIVED — reserved Phase 4.3 close per sister L130 v0.3.0 SHIPPED ARCHIVED literal cadence延袭)

**Note**: Phase 4.1 = v0.4.0 milestone 1st phase = R8.1 anchor only; R8.2-R8.5 (co-maintainer 招募 + stale-bot + ADR 全集 + GitHub Sponsors) → Phase 4.2 + Phase 4.3 explicit out-of-scope per CONTEXT Deferred Ideas; v1.0-RC 收尾 → Phase 4.3 per ROADMAP v0.4.0 必含 6 项 carry. Single baseline tag `v0.4.0-alpha.1-benchmark` LOCAL CREATE only (NO push per CLAUDE.md commit safety; user controls all commit + tag push).

---

*Phase 4.1 W2 T2.7 — dogfood report*
*Run: 2026-05-18*
