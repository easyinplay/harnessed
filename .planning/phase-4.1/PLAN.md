---
phase: 4.1
version: 1
status: ready
type: phase
plan: 1
wave: 0
depends_on: []
gap_closure: false
autonomous: true

# Frontmatter sister Phase 3.4 PLAN.md 100% template reuse (624L gold-standard) — adapted Phase 4.1 docs-publish scope
# Phase 4.1 = v0.4.0 milestone 1st phase (R8.1 dogfooding benchmark anchor; 内部 phase, T3 risk surface Phase 4.2)
# 4 D-decisions LOCKED (CONTEXT 4.1-CONTEXT.md): D-01 REUSE Phase 3.4 SAMPLES.md / D-02 FULL per-task disclosure / D-03 TEXT LOG zero-dep / D-04 MANUAL on-demand CI

requirements:
  - R8.1   # dogfooding benchmark 公开 — 30 真实任务 + 路由决策 + 命中正误 + 上游升级 e2e → docs/benchmarks/v0.4.md; 验收 "原始数据公开任何人可复现"
  - R9.2   # 路由透明度 — 决策 100% 可追溯 (D-02 FULL per-task disclosure 反"美化诱惑")
  - R9.4   # 上游升级 cadence — e2e 录像 / TEXT LOG D-03 zero-dep

files_modified:
  # ===== W0 backlog absorb (3 项 STRICT path dep W0.3 → W0.1 → W0.5; per PATTERNS § 5 critical path) =====
  - .planning/STATE.md                                          # W0.3 D2 cadence iter 2 — trim Phase 3.3+3.4 narrative (~-18L expected) → RETROSPECTIVE.md § ARCHIVED FROM STATE — Phase 3.3+3.4 (FIRST per path dep — creates ENFORCE=true headroom for W0.2 flip pre-flight)
  - .planning/RETROSPECTIVE.md                                  # W0.3 D2 cadence iter 2 — receive Phase 3.3+3.4 narrative section (verbatim relocate; sister Phase 3.4 W2 T2.2 step 3 1st-implementation 2nd-iter institutionalize verify per M2 backlog discharge)
  - scripts/check-state-archive-stale.mjs                       # W0.1 D3 ENFORCE flip (1-line: L10 `const ENFORCE = false` → `const ENFORCE = true`; sister scripts/check-transparency-verdicts.mjs L12 Phase 2.1→2.2 1-phase cadence延袭) + W0.5 conditional D1 SIZE_LIMIT flip (1-line: L12 `SIZE_LIMIT = 200` → `SIZE_LIMIT = 150` IF post-W0.3 STATE ≤140L)
  # ===== W1 main scope benchmark publish (6 项 — Phase 4.1 anchor R8.1) =====
  - docs/benchmarks/v0.4.md                                     # W1 T1.1 NEW ~300-400L D-02 FULL per-task disclosure (30 row × ~10L + header ~50L + footer 反"美化"声明 ~10L); planner Discretion #1 hard cap ≤400L LOCK; sister Phase 3.4 SAMPLES.md frame + DOGFOOD verdict header pattern reuse
  - docs/benchmarks/v0.4-upgrade-e2e.log                        # W1 T1.4 NEW ~50-150L plain text 4-section log (D-03 LOCKED; pre-state / upgrade command / diff / post-state) covering ctx7 + gstack picks (planner Discretion #5 install_method 多样性: npm-cli + git-clone-with-setup)
  - docs/CONTRIBUTING-BENCHMARK.md                              # W1 T1.5 NEW ≤30L MANUAL re-run instructions (D-04 LOCKED; planner Discretion #4 separate NEW file per Karpathy single-purpose; CONTRIBUTING.md 200L existing — fold-in REJECTED per § 5.1 evaluation)
  # ===== W2 ship close (5 项 — sister Phase 3.4 W2 cadence subset; NO ADR 0018 + NO A7 iter + NO triple tag per PATTERNS § 5 latent risk #3 mitigation) =====
  # NOTE: STATE.md + RETROSPECTIVE.md already listed above for W0.3 trim — W2 T2.1 ALSO touches them for Phase 4.1 SHIPPED 续编 (combined per § 8.2 D2 cadence iter 2 institutionalize at ship-time T6.N)
  - .planning/ROADMAP.md                                        # W2 T2.3 — Phase 4.1 ✅ SHIPPED marker + v0.4.0 1/3 PROGRESS (NOT yet 3/3 ARCHIVED — reserved Phase 4.3 close per sister L38 v0.1.0 + L58 v0.2.0 + L130 v0.3.0 SHIPPED ARCHIVED literal cadence延袭)
  - README.md                                                   # W2 T2.4 — L9 Status freshness + v0.4.0 0/3 → 1/3 marker + Phase 4.1 row append (sister 5-recurrence terminus D-04 COLLAPSE STATUS_MARKER path延袭)
  - PROJECT-SPEC.md                                             # W2 T2.5 — L3 Status header Phase 4.1 SHIPPED literal (sister Phase 3.4 W2 T2.6 FRONT_MATTER_DOCS transparency gate pattern延袭)
  - .planning/phase-4.1/DOGFOOD-T2.X.md                         # W2 T2.6 NEW ~30-60L 3-axis empirical evidence: (A) docs/benchmarks/v0.4.md 30 task FULL D-02 disclosure + ≤400L verify (B) docs/benchmarks/v0.4-upgrade-e2e.log 4-section text log integrity (C) W0.1 ENFORCE=true + W0.3 D2 cadence iter 2 institutionalize verify (sister Phase 3.3 DOGFOOD-T2.8 + Phase 3.4 DOGFOOD-T2.X 55L format 100% reuse)

threats_open:
  # STRIDE per RESEARCH § 16 (7 nodes — Phase 4.1 docs phase narrow attack surface)
  - threat: benchmark "美化" suppression (planner removes miss cases for vanity stat)
    stride: T  # Tampering (governance)
    mitigation: D-02 FULL disclosure sneak-block (raw prompt + decision + verdict verbatim; recovery_path column reserved for miss); single SoT D-01 (SAMPLES.md is frozen, can't selectively omit). Reviewer grep verify each T## section has "verbatim from .planning/phase-X.X/" attribution.
  - threat: benchmark drift (SAMPLES.md mutated post-publish, v0.4.md not re-rendered)
    stride: T
    mitigation: D-04 MANUAL cadence + CONTRIBUTING-BENCHMARK.md ≤30L explicit re-run procedure; SAMPLES.md frozen by Phase 3.4 R3 lock (cross-link in v0.4.md header §).
  - threat: e2e log binary file injection (mp4/gif >100KB committed bypassing intent)
    stride: D  # DoS (repo bloat)
    mitigation: D-03 sneak-block `git ls-files docs/benchmarks/ | xargs wc -c` < 100KB per file + `file docs/benchmarks/*` returns "ASCII text" only (reviewer grep gate W2 T2.6 DOGFOOD axis B).
  - threat: asciinema npm dep sneak-add
    stride: S  # Supply-chain
    mitigation: D-03 sneak-block `grep -q "asciinema" package.json` returns false (pre-commit grep gate planner W1 verify).
  - threat: benchmark CI cron sneak-add (REJECTED D-04)
    stride: D  # Resource exhaustion (CI minutes)
    mitigation: D-04 sneak-block `ls .github/workflows/ | grep -c benchmark` = 0; `grep -c "benchmark" .github/workflows/ci.yml` = 0 NEW additions.
  - threat: W0.1 ENFORCE flip when STATE.md violations exist (would break CI on flip commit)
    stride: D  # CI red
    mitigation: Pre-flight § 6.2 3 rules verify green BEFORE flip (sister Phase 2.1 cadence pattern verified); MANDATORY dry-run `sed 's/const ENFORCE = false/const ENFORCE = true/' scripts/check-state-archive-stale.mjs | node /dev/stdin` exit 0; W0.3 trim FIRST per path dep.
  - threat: W0.3 D2 trim losing audit content (paraphrasing instead of verbatim relocation)
    stride: T  # history paraphrasing
    mitigation: § 8.5 sneak-block MUST verbatim relocate; reviewer diff RETROSPECTIVE additions = STATE.md deletions 1:1 (acceptance criteria W0.3 T0.1).

must_haves:
  # ===== 4 D-decisions verbatim (CONTEXT 4.1-CONTEXT.md L13-67 LOCKED — 0 sneak tolerance) =====
  decisions:
    - id: D-01
      lock: REUSE Phase 3.4 SAMPLES.md (REAL HISTORICAL 30 row)
      sneak-block: |
        planner / executor MUST NOT add synthetic miss cases beyond Phase 3.4 SAMPLES 30 row
        planner / executor MUST NOT re-mine git log for new samples
        benchmark consumer `docs/benchmarks/v0.4.md` reads 30 row directly from SAMPLES.md (single SoT)
    - id: D-02
      lock: FULL per-task disclosure (raw prompt + decisions + miss reasons + recovery path)
      sneak-block: |
        planner / executor MUST publish raw prompt (NOT sanitized/paraphrased)
        planner / executor MUST publish actual decision_rules.yaml routing path (rule_id + tier + skill)
        planner / executor MUST NOT suppress miss cases (current 30/30; schema 保留 recovery_path column for v0.5+)
    - id: D-03
      lock: TEXT LOG plain `.log` (grep-able / reproducible / zero-dep)
      sneak-block: |
        planner / executor MUST NOT add asciinema npm dep (违 zero-dep)
        planner / executor MUST NOT commit binary mp4/gif/png files >100KB
        planner / executor MUST capture 4-section: pre-upgrade state + upgrade command + diff output + post-upgrade state
    - id: D-04
      lock: MANUAL on-demand (Karpathy YAGNI; 0 infra)
      sneak-block: |
        planner / executor MUST NOT add `.github/workflows/benchmark.yml` cron file
        planner / executor MUST NOT add benchmark step to existing `ci.yml`
        planner SHOULD add `docs/CONTRIBUTING-BENCHMARK.md` ≤30L (or fold into existing CONTRIBUTING.md per Discretion #4 → planner picks NEW separate per § 5.1)

  # ===== W0 backlog 3 项 absorbed (W0.4 + W0.1-sister-H1 OUT per CONTEXT §; 2 项 advisory carry; 3 项 ABSORBED) =====
  w0_backlog:
    - id: W0.3 (sister M2 D2 cadence iter 2 verify)
      action: trim Phase 3.3+3.4 narrative → RETROSPECTIVE.md § ARCHIVED FROM STATE — Phase 3.3+3.4 (sister Phase 3.4 W2 T2.2 step 3 verbatim pattern reuse — verify D2 standing process fires beyond 1st-implementation; M2 backlog discharge)
      priority: HIGH
      path-dep: FIRST (reduces STATE.md size to create ENFORCE=true headroom — gates W0.1)
    - id: W0.1 (DEFERRED #AF D3 gate ENFORCE flip)
      action: scripts/check-state-archive-stale.mjs L10 `ENFORCE = false` → `true` (sister Phase 2.1 transparency gate Phase 2.2 W0 T0.6 1-phase cadence延袭)
      priority: HIGH
      path-dep: AFTER W0.3 (pre-flight dry-run with ENFORCE=true sim MANDATORY; if exit 1 → revert + escalate)
    - id: W0.5 (DEFERRED #AG D1 STATE ≤150L round 2 conditional tighten)
      action: IF W0.3 trim outcome holds STATE ≤140L → flip D3 L12 `SIZE_LIMIT = 200` → `SIZE_LIMIT = 150` (1-line surgical; same file as W0.1); OTHERWISE DEFER Phase 4.2 W0 carry-forward (LOW priority — defensive against over-tighten brittle)
      priority: MED conditional
      path-dep: AFTER W0.3 + W0.1 (conditional on observed STATE post-trim line count)

  # ===== Observable truths (R8.1 goal-backward decomposition) =====
  truths:
    # W0 truths (3 absorbed)
    - "developer can run `node scripts/check-state-archive-stale.mjs` post-W0.1-flip and gate ENFORCEs (exit 1 on violation, not just warn); sister scripts/check-transparency-verdicts.mjs L12 `ENFORCE = true` 1-phase cadence延袭 (Phase 2.1 W3 warn-only → Phase 2.2 W0 ENFORCE; Phase 3.4 W0.1 ship → Phase 4.1 W0.1 flip — identical cadence); pre-flight verify STATE.md passes 3 rules (size ≤200L / 关键决议 ship 总结 ≤1 / W-N errata literal 禁) BEFORE flip commit (all 3 currently green per § 6.2 verify)"
    - "developer reads `.planning/RETROSPECTIVE.md` and finds `## § ARCHIVED FROM STATE — Phase 3.3+3.4 (Phase 4.1 W0.3 D2 cadence iter 2, 2026-05-18)` section containing verbatim relocated Phase 3.3 + Phase 3.4 narrative from STATE.md; HTML-comment archive marker pointer left in STATE.md trim site (sister L27 format `<!-- ... archived to RETROSPECTIVE.md § ARCHIVED FROM STATE ... -->`); D2 standing process fires 2nd-iter beyond 1st-implementation (sister M2 backlog discharge verify)"
    - "developer reads `.planning/STATE.md` post-W0.3-trim + post-W2-续编 and finds ≤150L IF W0.5 conditional flip path active (W0.3 trim outcome holds STATE ≤140L pre-Phase-4.1-ship-续编 + ~5-10L 续编 delta ≤150 final); OR ≤200L IF W0.5 deferred (defensive)"
    # W1 truths (3 main scope artifacts)
    - "developer reads `docs/benchmarks/v0.4.md` (NEW ~300-400L) and finds: (a) header with D-01~D-04 LOCKED status + source data cross-link to `.planning/phase-3.4/SAMPLES.md` 30-row REAL HISTORICAL; (b) § 1 Selection Rationale reusing Phase 3.4 SAMPLES § 1.1+1.2+1.3 verbatim block (D-01 REUSE single SoT); (c) § 2 Per-Task FULL Disclosure (30 sections × 6-field schema: raw_prompt verbatim + routing_decision rule_id+tier+skill + actual_command_executed + manual_review_verdict + recovery_path + source_commit) per D-02 FULL — Karpathy ≤400L hard cap (~350L estimate); (d) § 3 Aggregate Summary inline footer (30/30 = 100% + per-tier 10/10/10 verbatim from Phase 3.4 W1 T1.6 routing harness result; HYBRID inline NOT separate aggregate header per D-02 rationale 微 over-engineering); (e) § 4 反\"数据美化诱惑\"声明 anchored to ROADMAP L222 verbatim risk + § 5 Frozen Marker sister SAMPLES.md § 3 cherry-pick 防御 cadence延袭"
    - "developer reads `docs/benchmarks/v0.4-upgrade-e2e.log` (NEW ~50-150L plain text) and finds 4-section structure per D-03 (pre-upgrade state + upgrade command + diff output + post-upgrade state) covering planner-picked ctx7 (npm-cli install_method) + gstack (git-clone-with-setup install_method) — install_method 多样性 covering Phase 4.1 main install method spectrum per planner Discretion #5 § 4.2; text-only grep-able cross-OS portable; ≤150L Karpathy hard limit (4 section × ~20-40L each × 1-2 manifests)"
    - "developer reads `docs/CONTRIBUTING-BENCHMARK.md` (NEW ≤30L hard) and finds 4-section manual re-run instructions per D-04 sneak-block L67 verbatim: (1) When to re-run (SAMPLES.md churn / decision_rules.yaml v3 / upstream major version bump) + (2) Pre-flight (`pnpm install` + `pnpm build` per Phase 3.4 CI hotfix 554b82b lesson) + (3) Step 1 routing harness re-run `pnpm test tests/routing/phase-3.4-routing-hit-rate.test.ts` + (4) Step 2 e2e log re-capture + Step 3 update docs/benchmarks/v0.4.md if verdict changed + Step 4 commit + push (NO CI gate fires per D-04 MANUAL)"
    # W2 truths (5 ship close)
    - "developer reads `.planning/STATE.md` (post-W0.3 D2 cadence iter 2 trim Phase 3.3+3.4 → RETROSPECTIVE + W2 T2.1 Phase 4.1 SHIPPED 续编) and finds: 当前位置 block updated with Phase 4.1 SHIPPED marker + v0.4.0 milestone 1/3 PROGRESS (Phase 4.1 of 3 phases — next Phase 4.2 co-maintainer onboarding R8.2-R8.5); 已完成 phase ship 历史 section appends Phase 4.1 SHIPPED ✅ (2026-05-18) entry (15th post-Phase 3.4 14th)"
    - "developer reads `.planning/ROADMAP.md` and finds L210-212 Phase 4.1 entry marked ✅ SHIPPED (2026-05-18) + v0.4.0 milestone PROGRESS 0/3 → 1/3 (NOT yet 3/3 ARCHIVED — reserved Phase 4.3 close per sister L38 v0.1.0 + L58 v0.2.0 + L130 v0.3.0 SHIPPED ARCHIVED literal cadence延袭) + Phase 4.2 next phase kickoff reference (R8.2 co-maintainer 招募 per CONTEXT carry)"
    - "developer reads `README.md` and finds L9 Status freshness header updated to reflect Phase 4.1 SHIPPED + v0.4.0 1/3 (sister 5-recurrence terminus D-04 COLLAPSE STATUS_MARKER path延袭); L44 area MILESTONE row v0.4.0 0/3 → 1/3 (NOT yet 3/3 ARCHIVED); Phase 4.1 entry appended to shipped phase list (sister Phase 3.4+3.3+3.2+3.1 row pattern延袭); freshness gate `node scripts/check-transparency-verdicts.mjs` exit 0 post-MODIFY"
    - "developer reads `PROJECT-SPEC.md` L3 Status header and finds Phase 4.1 SHIPPED literal added (sister Phase 3.4 W2 T2.6 FRONT_MATTER_DOCS transparency gate pattern延袭); freshness gate post-MODIFY pass"
    - "developer reads `.planning/phase-4.1/DOGFOOD-T2.X.md` (NEW ~30-60L PASS N/N) and finds 3-axis empirical evidence per sister Phase 3.3+3.4 DOGFOOD format: (Axis A) `docs/benchmarks/v0.4.md` NEW 30-task FULL per-task disclosure D-02 — verify 30 section count via `grep -c \"^### \" docs/benchmarks/v0.4.md` ≥ 30 + each section has 5-field schema (raw_prompt + routing_decision + actual_command + hit_verdict + recovery_path); (Axis B) `docs/benchmarks/v0.4-upgrade-e2e.log` NEW 4-section text log D-03 — verify 4 sections via `grep -c \"^=== \" docs/benchmarks/v0.4-upgrade-e2e.log` ≥ 4 + plain text grep-able cross-OS + `file docs/benchmarks/*.log` returns 'ASCII text' + `wc -c docs/benchmarks/*.log` < 102400 per file; (Axis C) W0.1 D3 ENFORCE flip + W0.3 D2 cadence iter 2 verify — `node scripts/check-state-archive-stale.mjs` exit 0 with ENFORCE=true + `grep -q \"ARCHIVED FROM STATE — Phase 3.3\\|Phase 3.4\" .planning/RETROSPECTIVE.md` exit 0 (W0.3 D2 cadence 2nd-iter institutionalized)"

  artifacts:
    # W0 artifacts (3 absorbed — path dep STRICT W0.3 → W0.1 → W0.5)
    - path: ".planning/STATE.md"
      provides: "W0.3 D2 cadence iter 2 trim — sister Phase 3.4 W2 T2.2 step 3 verbatim pattern reuse: Identify Phase 3.3 + Phase 3.4 entries in 已完成 phase ship 历史 section L40-43 (prev-prev-phase beyond Phase 3.4 + Phase 4.1 = trim target this iter); 关键决策记录 L107-117 5 rows Phase 3.4 D-01/D-02/D-03/D-04 + W0.1 STRATEGIC row + Phase 3.3 D-04 + schemaVersion 13-surface 2 rows → archive verbatim to RETROSPECTIVE.md new section `## § ARCHIVED FROM STATE — Phase 3.3+3.4 (Phase 4.1 W0.3 D2 cadence iter 2, 2026-05-18)`; preserve recent Phase 3.4 SHIPPED + Phase 3.3 SHIPPED pointers (1-line each); 当前位置 long inline narratives condense to 1-line pointers; estimated trim delta ~-15-20L (148L → ~130L expected); leaves HTML-comment archive marker pointer per sister L27 format; W2 T2.1 续编 appends Phase 4.1 SHIPPED entry (~+5-10L delta) → final STATE.md ≤150L IF W0.5 flip / ≤200L IF W0.5 defer (sister Phase 3.4 round 1 148L baseline)"
      contains: "ARCHIVED FROM STATE — Phase 3.3"
    - path: ".planning/RETROSPECTIVE.md"
      provides: "W0.3 D2 cadence iter 2 receive — accept Phase 3.3 + Phase 3.4 narrative verbatim relocation (sister L8.3 RETROSPECTIVE.md absorb section structure verbatim): `## § ARCHIVED FROM STATE — Phase 3.3+3.4 (Phase 4.1 W0.3 D2 cadence iter 2, 2026-05-18)` subsection containing Phase 3.3 SHIPPED narrative + Phase 3.4 SHIPPED narrative archived from STATE.md 当前位置 + 关键决策 + 已完成 phase ship 历史; verbatim relocation (NO content rewriting per § 8.5 sneak-block); LOC delta ≈ +20-25L (trimmed lines from STATE.md verbatim relocation); reviewer diff verify additions = deletions 1:1; ALSO receives W2 T2.2 Phase 4.1 milestone retrospective 6-section append"
      contains: "Phase 3.3+3.4"
    - path: "scripts/check-state-archive-stale.mjs"
      provides: "W0.1 D3 ENFORCE flip (1-line surgical L10 `const ENFORCE = false // Phase 3.4 ship round 1 warn-only; flip Phase 3.5 OR v0.4.0 per DEFERRED #AF` → `const ENFORCE = true // Phase 4.1 W0.1 flip round 2 — sister transparency gate Phase 2.2 W0 cadence延袭 (DEFERRED #AF RESOLVED 2026-05-18)`); file size 54L → 54L unchanged (1-line value flip zero size delta; ≤60L Karpathy hard); sister Phase 2.1 W3 ENFORCE=false ship → Phase 2.2 W0 T0.6 ENFORCE=true flip 1-phase cadence verbatim verified (commit history); pre-flight dry-run with ENFORCE=true sim MANDATORY per § 6.2 (all 3 rules currently green: 148L ≤ 200L + 0 关键决议 ship 总结 sections + 0 W-N errata literals). W0.5 CONDITIONAL same-file ALSO flip L12 `const SIZE_LIMIT = 200 // round 1; tighten to 150 v0.4 per DEFERRED #AG` → `const SIZE_LIMIT = 150 // Phase 4.1 W0.5 round 2 tighten — DEFERRED #AG resolve (W0.3 trim outcome STATE ≤140L pre-verified)` IF post-W0.3 STATE ≤140L; OTHERWISE defer (LOW priority Phase 4.2 W0 carry-forward)"
      contains: "ENFORCE = true"

    # W1 main scope artifacts (Phase 4.1 anchor R8.1; 3 NEW docs)
    - path: "docs/benchmarks/v0.4.md"
      provides: "W1 T1.1 NEW ~300-400L D-02 FULL per-task disclosure (planner Discretion #1 hard cap ≤400L LOCK; sister Phase 3.4 SAMPLES.md § 1+2+3 frame REUSE + DOGFOOD-T2.X verdict header pattern): header section (YAML frontmatter ~10L + TL;DR header ~20L + D-01~D-04 LOCKED status declaration) + § 1 Selection Rationale REUSE Phase 3.4 SAMPLES.md § 1.1+1.2+1.3 verbatim 30-row REAL HISTORICAL distribution 10 Haiku trivial + 10 Sonnet medium + 10 Opus complex per D-01 single SoT (NO new mining sneak block) + § 2 Per-Task FULL Disclosure (30 sections × 6-field schema: raw_prompt verbatim NOT sanitized per D-02 sneak block + routing_decision rule_id+tier+skill from production routing/decision_rules.yaml v2 12-rule + actual_command_executed derived from source_commit git show + manual_review_verdict 'hit' for 30/30 100% per Phase 3.4 W1 T1.6 routing harness + recovery_path 'N/A (hit)' schema reserved for v0.5+ miss case per D-02 sneak block NO suppress miss cases + source_commit) — ~10L per task × 30 = ~300L core body + § 3 Aggregate Summary inline footer (HYBRID inline NOT separate aggregate header per D-02 rationale: Total 30/30 = 100% + per-tier Haiku 10/10 / Sonnet 10/10 / Opus 10/10 远超 R7 ROADMAP L149 ≥84%/100%/≥80% bars) + § 4 反\"数据美化诱惑\"声明 footer anchored ROADMAP L222 verbatim risk + § 5 Frozen Marker (ADR-needed-to-amend cherry-pick 防御 sister SAMPLES.md § 3 + D-01 single SoT lock) + § 6 Upgrade e2e log cross-link to docs/benchmarks/v0.4-upgrade-e2e.log; cross-link `.planning/phase-3.4/SAMPLES.md` source ≥ 2 occurrences (header + § 5 attribution per D-01 sneak block); 8-col schema (drop `task_type` + `tier` from public table; tier already in routing_decision; 7→8 col forward-compat per planner Discretion #2 § 2.2)"
      contains: ".planning/phase-3.4/SAMPLES.md"
    - path: "docs/benchmarks/v0.4-upgrade-e2e.log"
      provides: "W1 T1.4 NEW ~50-150L plain text 4-section log per D-03 LOCKED (zero-dep sister Karpathy precedent; NO asciinema npm dep / NO mp4/gif/png > 100KB per D-03 sneak block; 4-section CONTEXT L53 verbatim): § 1 Pre-Upgrade State (manifest version reading + doctor 8-check baseline + routing test fixture 30/30 baseline) + § 2 Upgrade Command (verbatim install/upgrade invocation + line-by-line installer output) + § 3 Diff Output (`git diff --stat` + before/after manifest version diff verbatim) + § 4 Post-Upgrade State (re-verified post-upgrade + e2e smoke test); planner Discretion #5 LOCK picks ctx7 + gstack (install_method 多样性 covering npm-cli + git-clone-with-setup per § 4.2; SKIP tavily-mcp 3rd manifest = +50L bloat marginal value, defer v0.5+); single file with 2 manifest sections recommended (or split 2 files per planner W1 execution — both viable per § 18 U6); each manifest demo ~50-80L (ctx7 npm-cli compact) + ~80-100L (gstack git-clone-with-setup multi-step); Karpathy hard limit ≤150L total per file"
      contains: "=== "
    - path: "docs/CONTRIBUTING-BENCHMARK.md"
      provides: "W1 T1.5 NEW ≤30L hard per CONTEXT D-04 sneak block L67 verbatim (Karpathy single-purpose doc; planner Discretion #4 separate NEW file LOCK — fold into 200L CONTRIBUTING.md REJECTED per § 5.1 evaluation pollutes core CONTRIBUTING.md): 4-section ultra-minimal structure: H1 Benchmark Re-run Instructions + blockquote intro (D-04 LOCKED cadence note) + ## When to re-run (SAMPLES.md churn OR routing/decision_rules.yaml v3 OR upstream major version bump per § 5.2 template L308-312) + ## Pre-flight (pnpm install + pnpm build clean per Phase 3.4 CI hotfix 554b82b lesson) + ## How to re-run (Step 1 routing harness `pnpm test tests/routing/phase-3.4-routing-hit-rate.test.ts` expected 30/30 + Step 2 e2e log re-capture text-only 4-section + Step 3 manual re-render docs/benchmarks/vN.M.md per D-02 FULL + Step 4 commit + push NO CI gate) + ## Acceptance (3 grep verifiers); LOC ~28L ≤30L target verified; cross-refs: SAMPLES.md + routing/decision_rules.yaml + phase-3.4-routing-hit-rate.test.ts + docs/benchmarks/v0.4.md + docs/benchmarks/v0.4-upgrade-e2e.log (5 cross-links)"
      contains: "benchmark"

    # W2 ship close artifacts (5 项 — sister Phase 3.4 W2 cadence subset; NO ADR + NO A7 iter + NO triple tag)
    - path: ".planning/STATE.md (W2 T2.1)"
      provides: "W2 T2.1 续编 Phase 4.1 SHIPPED event log + 当前位置 块 v0.4.0 1/3 SHIPPED + COMBINED with W0.3 D2 cadence iter 2 (per § 8.2): append 已完成 phase ship 历史 15th entry `Phase 4.1 shipped ✅ (2026-05-18) — dogfooding benchmark 数据采集 + 公开格式定义 (docs/benchmarks/v0.4.md NEW 30-task FULL per-task disclosure D-02 + docs/benchmarks/v0.4-upgrade-e2e.log NEW D-03 TEXT LOG zero-dep + W0 backlog 3 项一次根治 W0.1 D3 ENFORCE flip + W0.3 D2 iter 2 + W0.5 conditional D1 round 2) + v0.4.0 milestone 1/3 SHIPPED (next: Phase 4.2 co-maintainer onboarding R8.2-R8.5)`; update 当前位置 block GSD phase chain prepend Phase 4.1 SHIPPED marker + 当前里程碑 update v0.4.0 milestone 1/3 (next Phase 4.2) + 状态 Phase 4.1 SHIPPED + Wave 0+1+2 ship + baseline tag v0.4.0-alpha.1-benchmark LOCAL CREATE (NO push per CLAUDE.md commit safety); STATE.md ≤150L IF W0.5 flip / ≤200L IF W0.5 defer (sister Phase 3.4 round 1 148L baseline); sister Phase 3.4 W2 T2.2 full 4-step structure 1:1 replicate with content swap"
      contains: "Phase 4.1 shipped"
    - path: ".planning/RETROSPECTIVE.md (W2 T2.2)"
      provides: "W2 T2.2 续编 Phase 4.1 milestone retrospective entry 6-section sister Phase 3.4 W2 T2.3 + Phase 3.3 W2 T2.7 format 1:1 replicate (~+25-30L append): § What worked (D-01 REUSE Phase 3.4 SAMPLES.md 0 day overhead + D-02 FULL per-task disclosure 反\"数据美化\"诱惑 + D-03 TEXT LOG zero-dep sister Karpathy precedent + D-04 MANUAL 0 infra) + § What was inefficient (docs/benchmarks/v0.4.md 30-task FULL section authoring ~300L manual transcription effort raw_prompt verbatim NO sanitize per D-02 sneak block discipline) + § Patterns established (7-phase 连续 deferred-items → next phase W0 一次根治 cadence + D2 D1+D2+D3 institutionalize 2nd-iter verify M2 backlog discharge — pattern stable + benchmark publish artifact 30-row REAL HISTORICAL single SoT REUSE D-01 NOT re-mine) + § Cost patterns (Phase 4.1 内部 phase 1 day cadence延袭 — T3 risk surface Phase 4.2 co-maintainer 外部依赖) + § Key lessons ((i) D-01 single SoT REUSE > EXPAND fresh mining 0 day overhead + 一致性 + frozen lock sister cherry-pick 防御; (ii) D-02 FULL per-task 反\"美化\"诱惑兜底 30/30 100% 不需 EXPAND fake-miss-cases; (iii) D-04 MANUAL cadence sister Karpathy YAGNI > weekly cron sister Phase 3.4 D-02 install path 安静 一致 不增 CI 表面) + § Cross-milestone trends (v0.4.0 第 1 phase 续延 v0.3.0 close 1-day cadence sister 4-phase consecutive 1-day ship cadence延袭; W0.3 D2 cadence iter 2 verify sister M2 backlog discharge); ALSO receives W0.3 D2 auto-archive Phase 3.3+3.4 narrative section (combined per § 8.2)"
      contains: "Phase 4.1"
    - path: ".planning/ROADMAP.md (W2 T2.3)"
      provides: "W2 T2.3 MODIFY: L210-212 Phase 4.1 entry mark ✅ SHIPPED (2026-05-18) + brief outcome summary; update v0.4.0 milestone progress 0/3 → 1/3 (NOT yet 3/3 ARCHIVED — reserved Phase 4.3 close per sister L38 v0.1.0 + L58 v0.2.0 + L130 v0.3.0 SHIPPED ARCHIVED literal cadence延袭); add Phase 4.2 next phase kickoff reference (R8.2 co-maintainer 招募 per CONTEXT carry); sister Phase 3.4 W2 T2.4 1:1 replicate with content swap"
      contains: "Phase 4.1.*SHIPPED"
    - path: "README.md (W2 T2.4)"
      provides: "W2 T2.4 MODIFY: L9 Status freshness header update Phase 4.1 SHIPPED + v0.4.0 1/3 (sister 5-recurrence terminus D-04 COLLAPSE STATUS_MARKER path延袭); L44 area MILESTONE row v0.4.0 0/3 → 1/3 (NOT yet 3/3 ARCHIVED); add Phase 4.1 entry to shipped phase list (sister Phase 3.4+3.3+3.2+3.1 row pattern延袭); freshness gate post-MODIFY pass (node scripts/check-transparency-verdicts.mjs exit 0 — STATE_POSITION_RE OR-fallback for Phase 4.1 SHIPPED literal); sister Phase 3.4 W2 T2.5 1:1 replicate"
      contains: "Phase 4.1"
    - path: "PROJECT-SPEC.md (W2 T2.5)"
      provides: "W2 T2.5 MODIFY: L3 Status header add Phase 4.1 SHIPPED literal (sister Phase 3.4 W2 T2.6 FRONT_MATTER_DOCS transparency gate pattern延袭); freshness gate post-MODIFY pass"
      contains: "Phase 4.1"
    - path: ".planning/phase-4.1/DOGFOOD-T2.X.md (W2 T2.6)"
      provides: "W2 T2.6 NEW ~30-60L PASS N/N (sister Phase 3.3 DOGFOOD-T2.8.md 55L + Phase 3.4 DOGFOOD-T2.X.md 55L format 100% reuse; 3-axis empirical evidence + Date/Verdict header + Aggregate verification + Disposition): Axis A docs/benchmarks/v0.4.md NEW 30-task FULL per-task disclosure D-02 — verify 30 section count + each section has 5-field schema; Axis B docs/benchmarks/v0.4-upgrade-e2e.log NEW 4-section text log D-03 — verify 4 sections + plain text grep-able cross-OS + < 100KB binary check; Axis C W0.1 D3 ENFORCE flip + W0.3 D2 cadence iter 2 institutionalize verify — `node scripts/check-state-archive-stale.mjs` exit 0 with ENFORCE=true + grep RETROSPECTIVE archive section exit 0; PASS verdict header `PASS 3/3 dogfood axes verified, miss: none`; Karpathy ≤60L sister DOGFOOD precedent"
      contains: "PASS"

  key_links:
    # W0 path dep chain (W0.3 → W0.1 → W0.5)
    - from: ".planning/STATE.md (post-W0.3 trim ≤140L expected)"
      to: "scripts/check-state-archive-stale.mjs L10 ENFORCE=true flip pre-flight verify"
      via: "Pre-flight `sed 's/const ENFORCE = false/const ENFORCE = true/' scripts/check-state-archive-stale.mjs | node /dev/stdin` MUST exit 0 (sister Phase 2.1 transparency gate ENFORCE flip cadence verbatim verified Phase 2.1 W3 ship → Phase 2.2 W0 T0.6 1-phase precedent; Phase 3.4 W0.1 ship → Phase 4.1 W0.1 flip identical cadence); if exit 1 → revert + investigate (path dep STRICT W0.3 → W0.1 — NOT bypass-able per PATTERNS § 5 critical path)"
      pattern: "ENFORCE = true"
    - from: ".planning/STATE.md (post-W0.3 trim line count)"
      to: "scripts/check-state-archive-stale.mjs L12 SIZE_LIMIT 200→150 conditional flip"
      via: "Decision tree per § 7.1: post-trim STATE ≤140L → flip safe (10L headroom maintained for Phase 4.1 ship 续编 + future churn); 141-150L → defer flip (insufficient headroom; sister DEFERRED #AG carry-forward Phase 4.2 W0 LOW priority); >150L → flip blocked + investigate W0.3 trim sufficiency (re-evaluate D2 cadence pattern adequacy)"
      pattern: "SIZE_LIMIT = 150"
    - from: ".planning/RETROSPECTIVE.md (W0.3 archive section)"
      to: ".planning/STATE.md (post-trim HTML-comment archive marker pointer)"
      via: "Sister L27 verified format `<!-- Phase X.Y + Z.A narrative archived to RETROSPECTIVE.md § ARCHIVED FROM STATE — Phase X.Y+Z.A (... timestamp ...) -->` left in STATE.md trim site; reviewer grep verify pointer present + RETROSPECTIVE additions match STATE deletions 1:1 verbatim (§ 8.5 sneak block: MUST verbatim relocate NO content rewriting)"
      pattern: "ARCHIVED FROM STATE"

    # W1 main scope key_links (D-01 single SoT + D-02 FULL + D-03 4-section + D-04 MANUAL)
    - from: "docs/benchmarks/v0.4.md § 2 30 per-task sections"
      to: ".planning/phase-3.4/SAMPLES.md 30-row REAL HISTORICAL truth table (single SoT D-01 LOCKED)"
      via: "D-01 REUSE source consumer: docs/benchmarks/v0.4.md reads 30 row directly from SAMPLES.md (NO new mining per sneak block); cross-link in v0.4.md header section + § 5 attribution (`Source data: .planning/phase-3.4/SAMPLES.md 30-row REAL HISTORICAL mining 302 commits Phase 3.4 W0.5`); reviewer grep `SAMPLES.md` docs/benchmarks/v0.4.md ≥ 2 occurrences (header + § 5 attribution per D-01 sneak block enforcement); anti-drift gate: planner adds 1-line manual reminder `If SAMPLES.md updated, re-render this file manually per CONTRIBUTING-BENCHMARK.md (D-04 MANUAL cadence)`"
      pattern: ".planning/phase-3.4/SAMPLES.md"
    - from: "docs/benchmarks/v0.4.md per-task routing_decision field"
      to: "routing/decision_rules.yaml v2 12-rule production routing path"
      via: "D-02 FULL per-task disclosure sneak block: MUST publish actual decision_rules.yaml routing path (rule_id + tier + skill) — planner manually trace routing/decision_rules.yaml v2 per row; rule_id field explicit (e.g., `engineering-execute-tdd`, OR explicit `none (router=B fallback)`); cross-reference Phase 3.4 W1 T1.6 routing harness 30/30 PASS result per `tests/routing/phase-3.4-routing-hit-rate.test.ts` L176-181 hard gates (Sonnet 10/10 = 100% + Haiku 10/10 = 100% + Opus 10/10 = 100%)"
      pattern: "routing_decision"
    - from: "docs/benchmarks/v0.4-upgrade-e2e.log 4-section text log"
      to: "manifests/tools/ctx7.yaml + manifests/skill-packs/gstack.yaml install_method 多样性 demo source"
      via: "D-03 TEXT LOG plain `.log` planner Discretion #5 LOCK picks: ctx7 (install_method=npm-cli per manifests/tools/ctx7.yaml — single-file npm dep, fast upgrade, deterministic version pinning) + gstack (install_method=git-clone-with-setup per manifests/skill-packs/gstack.yaml L22 git_ref SHA-pinned — multi-step git clone + setup script covering git_ref SHA upgrade flow per Phase 3.4 RESEARCH § 7.1 SHA `74895062fb8a3acbf9f66cd088a83359aaaa56cd`); SKIP tavily-mcp (mcp-stdio-add already covered Phase 2.2/2.3 install dogfood, +50L docs bloat marginal value per § 12.2 skip rationale)"
      pattern: "ctx7|gstack"
    - from: "docs/CONTRIBUTING-BENCHMARK.md re-run instructions"
      to: "tests/routing/phase-3.4-routing-hit-rate.test.ts per-PR gate (post-554b82b CI hotfix verified)"
      via: "D-04 MANUAL cadence: sister Phase 3.4 routing harness already gates per-PR via existing `pnpm test` step (post-554b82b CI hotfix 保障); benchmark CI 重复 redundant; CONTRIBUTING-BENCHMARK.md Step 1 cites `pnpm test tests/routing/phase-3.4-routing-hit-rate.test.ts` verbatim as primary verification (expected 30/30 = 100% hit rate maintained); D-04 sneak block: planner / executor MUST NOT add `.github/workflows/benchmark.yml` cron file + MUST NOT add benchmark step to existing `ci.yml` (reviewer grep `ls .github/workflows/ | grep -c benchmark` = 0 + `grep -c benchmark .github/workflows/ci.yml` = 0 NEW additions)"
      pattern: "phase-3.4-routing-hit-rate"

    # W2 ship close key_links (sister Phase 3.4 W2 5-doc 续编 + DOGFOOD + tag cadence)
    - from: "Phase 4.1 W2 ship cycle (5 atomic tasks + DOGFOOD)"
      to: "v0.4.0 milestone 1/3 PROGRESS (NOT close — Phase 4.3 reserved)"
      via: "Sister Phase 3.4 W2 T2.3-T2.6 + T2.11 cadence subset (NO ADR 0018 + NO A7 iter ci.yml + NO milestone close 4-task subset); 5 atomic + 1 DOGFOOD vs sister 11+1 task (Phase 4.1 ~55% W2 task subset due to docs-only + no architectural surface change); NO 🎯 v0.4.0 milestone tag (reserved Phase 4.3 close per sister v0.3.0 close cadence延袭 — 3 alpha tags + final milestone tag triple-push); single baseline tag `v0.4.0-alpha.1-benchmark` LOCAL CREATE only (NO push per CLAUDE.md commit safety; user controls all commit + tag push)"
      pattern: "v0.4.0-alpha.1-benchmark"
    - from: ".planning/phase-4.1/DOGFOOD-T2.X.md (W2 T2.6 NEW)"
      to: "3-axis empirical evidence PASS 3/3"
      via: "Sister Phase 3.4 DOGFOOD-T2.X.md 55L 3-axis format 100% reuse (Date + Verdict + 3 Axis sections + Aggregate verification + Disposition); axes ADAPT: (A) benchmark v0.4.md 30-task FULL D-02 + ≤400L verify (B) e2e log 4-section + binary safety + grep-able (C) W0.1 ENFORCE=true + W0.3 archive institutionalize; verify ALL 3 axes PASS pre-ship; Karpathy ≤60L sister precedent"
      pattern: "PASS 3/3"

risk_notes:
  # 3 latent risks acknowledged + accepted per PATTERNS 3 risk surface (CONTEXT § Discretion + § 5 path dep)
  - id: R-01
    risk: docs/benchmarks/v0.4.md ≤400L hard cap may be breached if D-02 FULL per-task disclosure verbose padding accumulates (estimate ~350-400L at ceiling per § 10.1)
    severity: MED
    mitigation: § 10.1 mitigation hierarchy explicit — IF post-write `wc -l` > 400 → (1) drop per-task `description` column save ~30L (lowest D-02 disclosure value); (2) compress 5-element labels save ~60L (drop blank lines); (3) aggregate-only REJECTED per D-02 sneak block discipline. Planner LOCK explicit ≤400L hard cap in task T1.1 acceptance + DOGFOOD axis A re-verify
    acceptance: documented inline + task T1.1 hard cap acceptance criterion `wc -l docs/benchmarks/v0.4.md ≤ 400`
  - id: R-02
    risk: W0.5 conditional D1 SIZE_LIMIT 200→150 flip may be over-tighten brittle (sister Phase 3.4 W0.1 round 1 ≤200L precedent established headroom; round 2 ≤150L only if ≥10L headroom maintained post-archive)
    severity: LOW
    mitigation: Per § 7.4 sneak block + § 7.1 decision tree — IF post-W0.3 STATE >140L → DEFER flip + register DEFERRED #AG carry-forward Phase 4.2 W0 (LOW priority); MUST NOT skip W0.3 trim to game W0.2 condition (W0.3 trim is HIGH priority standing process D2 cadence iter 2 verify institutionalization)
    acceptance: documented inline + task T0.3 conditional acceptance criterion
  - id: R-03
    risk: PATTERNS § 5 latent risk #3 — triple tag sneak (Phase 4.1 NOT milestone close phase; ONLY single baseline tag `v0.4.0-alpha.1-benchmark` per CONTEXT L70 explicit; sister Phase 3.4 W2 T2.12 triple-tag = milestone close pattern NOT applicable Phase 4.1)
    severity: LOW
    mitigation: PLAN.md frontmatter explicit single tag only; W2 T2.6 DOGFOOD axis C verify `git tag --list 'v0.4.0-alpha.1-benchmark' | wc -l` == 1 (NOT 3); reviewer grep verify no `🎯` milestone close tag (reserved Phase 4.3); NO ADR 0018 (R8.4 ADR 全集 deferred Phase 4.3 per Deferred Ideas); NO ci.yml A7 iter (ADR count unchanged Phase 4.1)
    acceptance: task T2.7 single tag creation only (LOCAL no push per CLAUDE.md)

acceptance_criteria:
  # F1-F8 per sister Phase 3.4 cadence — Phase 4.1 acceptance bar
  F1: "docs/benchmarks/v0.4.md NEW ≤400L D-02 FULL per-task disclosure 30 sections × 6-field schema (raw_prompt + routing_decision + actual_command + verdict + recovery_path + source_commit); cross-link SAMPLES.md ≥ 2 occurrences (single SoT D-01 sneak block守门)"
  F2: "docs/benchmarks/v0.4-upgrade-e2e.log NEW ≤150L 4-section plain text per D-03 (pre-state + upgrade command + diff + post-state); ctx7 + gstack picks (install_method 多样性 npm-cli + git-clone-with-setup per planner Discretion #5); NO asciinema npm dep + NO binary >100KB (D-03 sneak block守门)"
  F3: "docs/CONTRIBUTING-BENCHMARK.md NEW ≤30L 4-section manual re-run instructions per D-04 MANUAL on-demand; NO benchmark.yml cron + NO ci.yml benchmark step (D-04 sneak block守门)"
  F4: "scripts/check-state-archive-stale.mjs L10 `ENFORCE = true` post-W0.1 flip; pre-flight 3 rules verify green BEFORE flip commit (sister Phase 2.1 W3 → Phase 2.2 W0 1-phase cadence延袭); `node scripts/check-state-archive-stale.mjs` exit 0 post-flip"
  F5: ".planning/RETROSPECTIVE.md § ARCHIVED FROM STATE — Phase 3.3+3.4 NEW subsection (W0.3 D2 cadence iter 2 institutionalize verify M2 backlog discharge); verbatim relocate NO content rewriting (§ 8.5 sneak block); reviewer diff RETROSPECTIVE additions = STATE.md deletions 1:1"
  F6: "STATE.md post-W0.3-trim + W2 T2.1 续编 final ≤150L (W0.5 flip path) OR ≤200L (W0.5 defer path); W2 ship cluster updates: 当前位置 Phase 4.1 SHIPPED + v0.4.0 1/3 + ROADMAP L210-212 ✅ SHIPPED + README L9 Status + PROJECT-SPEC L3 Status all 4 docs sync"
  F7: ".planning/phase-4.1/DOGFOOD-T2.X.md NEW ≤60L PASS 3/3 axes verified (Axis A benchmark v0.4.md FULL D-02 + ≤400L / Axis B e2e log 4-section + binary safety + grep-able / Axis C W0.1 ENFORCE + W0.3 D2 institutionalize); sister Phase 3.4 DOGFOOD-T2.X.md format 100% reuse"
  F8: "Single baseline tag `v0.4.0-alpha.1-benchmark` LOCAL CREATE only (NO push per CLAUDE.md commit safety; user controls all commit + tag push); NO 🎯 v0.4.0 milestone close tag (reserved Phase 4.3); NO ADR 0018 / NO A7 iter ci.yml (PATTERNS § 5 latent risk #3 mitigation)"
---

<objective>
Phase 4.1 ship **v0.4.0 milestone 1st phase / R8.1 dogfooding benchmark anchor** — single PLAN.md + single task_plan.md ~14 atomic tasks across W0 (3 backlog absorb) + W1 (6 main scope benchmark publish) + W2 (5 ship close + DOGFOOD) per sister Phase 3.4 1132L task_plan + 624L PLAN structure 100% template reuse (adapted Phase 4.1 docs-publish narrower scope).

## Wave 0 — Backlog 3 项 absorb (path dep STRICT W0.3 → W0.1 → W0.5):

**7-phase 连续 "deferred-items → next phase W0 一次根治" cadence 7th phase 沿袭** (Phase 2.3 → 2.4 → 3.1 → 3.2 → 3.3 → 3.4 → 4.1): **T0.1 W0.3 D2 cadence iter 2 trim Phase 3.3+3.4 narrative → RETROSPECTIVE.md § ARCHIVED FROM STATE — Phase 3.3+3.4** (sister M2 backlog discharge verify D2 standing process fires 2nd-iter beyond 1st-implementation; sister Phase 3.4 W2 T2.2 step 3 verbatim pattern reuse; FIRST per path dep — reduces STATE.md 148L → ~130L expected creating ENFORCE=true headroom for W0.1 pre-flight) + **T0.2 W0.1 D3 ENFORCE flip** (1-line surgical `scripts/check-state-archive-stale.mjs` L10 `const ENFORCE = false` → `const ENFORCE = true`; sister Phase 2.1 W3 ship round 1 warn-only → Phase 2.2 W0 T0.6 ENFORCE=true 1-phase cadence延袭; pre-flight dry-run with ENFORCE=true sim MANDATORY before commit — if exit 1 revert + escalate per § 6.2 守门) + **T0.3 W0.5 CONDITIONAL D1 SIZE_LIMIT 200→150 round 2 tighten** (1-line same-file `scripts/check-state-archive-stale.mjs` L12 IF W0.3 trim outcome holds STATE ≤140L; OTHERWISE DEFER Phase 4.2 W0 carry-forward LOW priority per § 7.1 decision tree).

## Wave 1 — Main scope benchmark publish (6 atomic — Phase 4.1 anchor R8.1):

**docs/benchmarks/ NEW surface inauguration** (3 docs + 1 transformer step + 1 e2e run + 1 integrity test): **T1.1 `docs/benchmarks/v0.4.md` NEW ~300-400L D-02 FULL per-task disclosure** (30 task × ~10L 6-field schema + header ~50L + footer ~10L; planner Discretion #1 hard cap ≤400L LOCK; sister Phase 3.4 SAMPLES.md § 1+2+3 frame REUSE + DOGFOOD verdict header pattern) + **T1.2 SAMPLES.md → benchmark transformer** (D-01 REUSE; planner-derived 8-col rendering of frozen 30-row SAMPLES.md 7-col via expansion: `description` + `routing_decision` rule_id+tier+skill + `actual_command_executed` from git show + `manual_review_verdict` 'hit' for 30/30 + `recovery_path` 'N/A' schema reserved; verify forward-compat lossless projection per planner Discretion #2 § 2.2) + **T1.3 e2e upgrade text log script** (planner-picked ctx7 + gstack manifest per planner Discretion #5 § 4.2 install_method 多样性: npm-cli + git-clone-with-setup; SKIP tavily-mcp per § 12.2 defer v0.5+; 4-section text log capture per D-03 LOCKED) + **T1.4 `docs/benchmarks/v0.4-upgrade-e2e.log` NEW** (~50-150L plain text artifact from T1.3 capture; 4-section per manifest demo) + **T1.5 `docs/CONTRIBUTING-BENCHMARK.md` NEW ≤30L** (planner Discretion #4 separate NEW file LOCK per § 5.1; fold-in REJECTED — pollutes CONTRIBUTING.md 200L core) + **T1.6 benchmark integrity manual review pass** (planner verify v0.4.md row count = 30 + per-row source_commit non-empty + per-tier breakdown matches SAMPLES.md per D-01 sneak-block).

## Wave 2 — Ship close (5 atomic + DOGFOOD + tag — sister Phase 3.4 W2 cadence subset; NO ADR + NO A7 iter + NO triple tag per PATTERNS § 5 latent risk #3):

**sister Phase 3.4 W2 T2.3-T2.6 + T2.11 cadence 5-task subset (NO milestone close 4-task subset T2.7-T2.10 + NO T2.1 ADR + NO T2.2 A7 iter)**: **T2.1 STATE.md 续编 Phase 4.1 SHIPPED + 当前位置 update** (combined with W0.3 D2 cadence iter 2 archive sub-step per § 8.2) + **T2.2 RETROSPECTIVE.md 续编 Phase 4.1 milestone retrospective 6-section + receive W0.3 D2 auto-archive** + **T2.3 ROADMAP.md L210-212 Phase 4.1 ✅ SHIPPED + v0.4.0 1/3 PROGRESS marker** + **T2.4 README.md L9 Status freshness + L44 MILESTONE row v0.4.0 1/3 + Phase 4.1 row append** + **T2.5 PROJECT-SPEC.md L3 Status header Phase 4.1 SHIPPED literal** + **T2.6 `.planning/phase-4.1/DOGFOOD-T2.X.md` NEW PASS 3/3 axes** (sister Phase 3.4 DOGFOOD format) + **T2.7 single baseline tag `v0.4.0-alpha.1-benchmark` LOCAL CREATE** (NO push per CLAUDE.md commit safety; user controls). **N/A** sister T2.1 ADR 0018 (R8.4 deferred Phase 4.3) / sister T2.2 ci.yml A7 iter (no NEW ADR Phase 4.1) / sister T2.8 .planning/milestones/v0.4.0-ROADMAP archive (v0.4.0 close = Phase 4.3) / sister T2.9 milestones/v0.4.0-REQUIREMENTS archive / sister T2.10 milestones/v0.4.0-MILESTONE-AUDIT inaugurate / sister T2.12 triple tag push (Phase 4.1 single tag local-only).

**Purpose**: Phase 4.1 = v0.4.0 milestone 1st of 3 phases (Phase 4.2 R8.2 co-maintainer onboarding + Phase 4.3 R8.3-R8.5 + audit log + ADR 全集 + v1.0-RC 收尾 in scope; Phase 4.1 R8.1 anchor only per CONTEXT scope); W0 7-phase consecutive backlog absorb cadence 一次根治 (DEFERRED #AF + #AG resolve + sister M2 D2 institutionalize verify); W1 main scope inaugurates `docs/benchmarks/` NEW surface (was `.gitkeep` only) with D-02 FULL per-task transparency (反"美化诱惑" ROADMAP L222 anchor) + D-03 TEXT LOG zero-dep (sister Karpathy precedent) + D-04 MANUAL on-demand (sister Phase 3.4 D-02 install path 安静 一致); W2 narrower 5-task subset vs sister Phase 3.4 W2 11-task (no NEW ADR + no milestone close + no architectural surface change — pure docs publish phase).

**Output**: 14 atomic task across 3 wave (3 + 6 + 5+DOGFOOD+tag = 14; sister Phase 3.4 24 atomic 60% scope factor per RESEARCH § 17.1) — task_plan.md 含完整 per-task 三件套 `<read_first>` + `<acceptance_criteria>` + `<action>` + `<decision_source>` blocks; sister Phase 3.4 task_plan.md 1132L 23-atomic structure 100% template reuse + adapt per W0/W1/W2 docs-only scope.

> **R1+R2 critical findings absorbed** (4 项): (1) **docs/benchmarks/ baseline empty .gitkeep only** (RESEARCH § 1.1 + bash ls verified — Phase 4.1 W1 inaugurates `docs/benchmarks/v0.4.md` + `v0.4-upgrade-e2e.log` NEW surface; .gitkeep removable OR retained per Karpathy YAGNI); (2) **Phase 3.4 SAMPLES.md frozen 73L 30-row 7-col schema** (RESEARCH § 1.2 + bash wc -l + grep verified; D-01 LOCKED single SoT; benchmark v0.4.md 8-col expansion is RENDERED VIEW not mutation — `tests/routing/phase-3.4-routing-hit-rate.test.ts` L48+L56-57 7-col parser forward-compat verified); (3) **W0.1 ENFORCE flip pre-flight all 3 rules currently green** (RESEARCH § 6.2 + bash grep 0/0/0 verified — 148L ≤ 200L + 0 关键决议 ship 总结 sections + 0 W-N errata literals → flip safe); (4) **T4 CI ordering bug spike outcome no latent bug found** (RESEARCH § 9.2 + ci.yml L120-190 step-by-step ordering verified — build/test, build:schema/validate:schema, ralph-loop sentinel all verified ordered correct → no W0/W1 fix task escalation needed).

</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/REQUIREMENTS.md
@.planning/RETROSPECTIVE.md
@.planning/phase-4.1/4.1-KICKOFF.md
@.planning/phase-4.1/4.1-CONTEXT.md
@.planning/phase-4.1/4.1-DISCUSSION-LOG.md
@.planning/phase-4.1/PATTERNS.md
@.planning/phase-4.1/RESEARCH.md
@.planning/phase-4.1/task_plan.md

# Frozen interface contracts (本 phase Wave 0+1+2 consume + MODIFY 来源)
@.planning/phase-3.4/SAMPLES.md
@scripts/check-state-archive-stale.mjs
@scripts/check-transparency-verdicts.mjs
@.github/workflows/ci.yml
@CONTRIBUTING.md
@tests/routing/phase-3.4-routing-hit-rate.test.ts
@routing/decision_rules.yaml
@manifests/tools/ctx7.yaml
@manifests/skill-packs/gstack.yaml
@versions/0.3.0-known-good.yaml
@README.md
@PROJECT-SPEC.md

# Sister precedent (format gold-standard)
@.planning/phase-3.4/PLAN.md
@.planning/phase-3.4/task_plan.md
@.planning/phase-3.4/deferred-items.md
@.planning/phase-3.4/DOGFOOD-T2.X.md
@.planning/phase-3.3/DOGFOOD-T2.8.md
@.planning/milestones/v0.3.0-MILESTONE-AUDIT.md
</context>

<interfaces>
<!-- Key types/contracts the executor needs (extracted from codebase per planner-format) -->

From scripts/check-state-archive-stale.mjs L10-14 (Phase 3.4 W0.1 ship round 1 warn-only; Phase 4.1 W0.1 + W0.5 MODIFY target):
```javascript
const ENFORCE = false // Phase 3.4 ship round 1 warn-only; flip Phase 3.5 OR v0.4.0 per DEFERRED #AF
const STATE_PATH = '.planning/STATE.md'
const SIZE_LIMIT = 200 // round 1; tighten to 150 v0.4 per DEFERRED #AG
const KEY_DECISIONS_SECTION_LIMIT = 1
const HISTORICAL_ERRATA_RE = /W-[1-9]\s+errata|sister\s+review\s+M[1-9]\s+修正/
```

W0.1 flip target (Phase 4.1 1-line surgical sister Phase 2.2 W0 ENFORCE=true cadence):
```javascript
const ENFORCE = true // Phase 4.1 W0.1 flip round 2 — sister transparency gate Phase 2.2 W0 cadence延袭 (DEFERRED #AF RESOLVED 2026-05-18)
```

W0.5 conditional flip target (Phase 4.1 1-line same-file IF STATE post-W0.3 ≤140L; otherwise defer):
```javascript
const SIZE_LIMIT = 150 // Phase 4.1 W0.5 round 2 tighten — DEFERRED #AG resolve (W0.3 trim outcome STATE ≤140L pre-verified)
```

From scripts/check-transparency-verdicts.mjs L12 (sister Phase 2.1 → 2.2 ENFORCE flip cadence verbatim verified):
```javascript
const ENFORCE = true  // Phase 2.2 W0 T0.6 ship-time flip (warn-only round 1 → ENFORCE round 2)
```

From .planning/STATE.md L40-43 + L107-117 (W0.3 trim targets):
```markdown
## 已完成 phase ship 历史 (W0.2 — README sync SSOT)
- **Phase 3.4 shipped** ✅ (2026-05-17) — routing 命中率 ≥ 85% 验收 ... + W0 backlog 5 项一次根治
- **Phase 3.3 shipped** ✅ (2026-05-17) — aliases.yaml RICH 5-field redirect + ...

## 关键决策记录
| Phase 3.4 D-01 REAL HISTORICAL 30 sample mining ✅ ship | Phase 3.4 W0.5 SAMPLES.md | ... |
| Phase 3.4 D-02 RUN ENGINE per-sample arbitrate dispatch ✅ ship | Phase 3.4 W1 T1.6 | ... |
| Phase 3.4 D-03 BUFFER /4 estimateTokens zero-dep ✅ ship | Phase 3.4 W1 T1.1 | ... |
| Phase 3.4 D-04 DOCTOR WARN (status='warn' ≠ fail) ✅ ship | Phase 3.4 W1 T1.2 | ... |
| Phase 3.4 W0.1 STRATEGIC institutionalize 4 D-decisions ✅ ship | Phase 3.4 W0.1 | ... |
| Phase 3.3 D-04 (b) COLLAPSE STATE dual-SSOT 5-recurrence terminus | Phase 3.3 W0.1 | ... |
| schemaVersion 13-surface manifest-domain colocation 3rd consumer | Phase 3.3 D-03 + W0.3 | ... |
```

W0.3 trim target — verbatim relocate ALL Phase 3.3 + Phase 3.4 rows above + 已完成 phase ship 历史 Phase 3.3 + Phase 3.4 entries to RETROSPECTIVE.md new section.

From .planning/STATE.md L27 (sister HTML-comment archive marker pointer format verbatim verified):
```markdown
<!-- Phase 3.1 + 3.2 narrative archived to RETROSPECTIVE.md § ARCHIVED FROM STATE — Phase 3.1+3.2 (2026-05-17 W0.1 D2 ship-time T6.N first-implementation per Phase 3.4 W2 T2.2 standing process — sister Phase 1.X-3.2 second-pass cadence延袭) -->
```

W0.3 Phase 4.1 mirror format (insert at trimmed sites):
```markdown
<!-- Phase 3.3 + 3.4 narrative archived to RETROSPECTIVE.md § ARCHIVED FROM STATE — Phase 3.3+3.4 (2026-05-18 Phase 4.1 W0.3 D2 cadence iter 2 per standing process — M2 backlog discharge institutionalize verify 2nd-iter beyond 1st-implementation) -->
```

From .planning/phase-3.4/SAMPLES.md L1-73 (D-01 LOCKED single SoT; W1 T1.1 + T1.2 consumer):
```markdown
# Phase 3.4 — 30 真实历史任务样本 (Routing Accuracy v0.3 dogfood — haiku/sonnet/opus 三段)
> **Status**: frozen at phase 3.4 plan-phase Wave 0 / **execute-phase 不允许改样本** (sister Phase 2.3 R3 frozen 模式延袭)
> **Source**: REAL HISTORICAL — mining git log 302 commits + .planning/phase-{1.1..3.3}/task_plan.md × 10+ (D-01 LOCKED)

## § 2 Sample Truth Table (30 sample — REAL HISTORICAL)

| #  | task_id | model_expected | task_type | description (≤120 chars)                | source_commit | expected_decision (yaml inline)             |
| 01 | T01     | haiku          | chore     | tests/manifest + tests/manifest/schema   | `43ce181`     | `{router: B, reason: 'single-file dir scaffold chore'}` |
... (30 rows total)
```

W1 T1.1 + T1.2 transformer — derive 8-col schema (drop task_type + tier, add task_description_human_readable + routing_decision + actual_command_executed + manual_review_verdict + recovery_path) per planner Discretion #2 § 2.2.

From docs/benchmarks/ (W1 T1.1 + T1.4 NEW target surface; baseline empty):
```
docs/benchmarks/
└── .gitkeep   (0 bytes; placeholder only, Phase 1.X seed)
```

W1 T1.1 NEW: `docs/benchmarks/v0.4.md` ~300-400L per-task FULL D-02 disclosure
W1 T1.4 NEW: `docs/benchmarks/v0.4-upgrade-e2e.log` ~50-150L 4-section text log D-03

From CONTRIBUTING.md L1-200 baseline (existing 200L 8-section dev setup + commit + ADR rules; W1 T1.5 separate NEW per planner Discretion #4 fold-in REJECTED § 5.1):
```markdown
# Contributing to harnessed
... existing 200L dev setup + commit + ADR rules ...
```

W1 T1.5 NEW: `docs/CONTRIBUTING-BENCHMARK.md` ≤30L per CONTEXT D-04 sneak block (separate single-purpose doc Karpathy YAGNI; cross-link from CONTRIBUTING.md 1-line reference 选)

From manifests/tools/ctx7.yaml (planner Discretion #5 e2e pick #1 — install_method=npm-cli):
```yaml
metadata:
  name: ctx7
spec:
  install:
    method: npm-cli
    npm_package: '@upstash/context7-mcp'
```

From manifests/skill-packs/gstack.yaml L20-22 (planner Discretion #5 e2e pick #2 — install_method=git-clone-with-setup git_ref SHA-pinned):
```yaml
spec:
  install:
    method: git-clone-with-setup
    git_ref: 74895062fb8a3acbf9f66cd088a83359aaaa56cd  # SHA-pinned per R7.6
```

From routing/decision_rules.yaml v2 12-rule + 5 engineering sub-rule + mattpocock_phases 23 招式 (W1 T1.1 + T1.2 routing_decision derive source; D-02 sneak block "actual decision_rules.yaml routing path"):
```yaml
# 12 priority rules + 5 engineering category sub-rules + 23 招式 routing schema (4 phase × 21 unique skills)
# Per-row routing_decision: rule_id + tier (Haiku/Sonnet/Opus) + skill (e.g., karpathy-baseline, engineering-execute-tdd)
```

From tests/routing/phase-3.4-routing-hit-rate.test.ts L48 + L56-57 (sister consumer of SAMPLES.md; D-04 per-PR gate via pnpm test post-554b82b CI hotfix):
```typescript
const SAMPLES_PATH = '.planning/phase-3.4/SAMPLES.md'
// L56-57: rowRe parses exactly 7 cols
const rowRe = /^\| (\d{2}) \| (T\d{2}) \| (haiku|sonnet|opus) \| (\w+) \| (.+?) \| `([0-9a-f]{7,10})` \| `\{(.+)\}` \|/
```

D-04 MANUAL cadence: sister already gates per-PR via `pnpm test`; CONTRIBUTING-BENCHMARK.md Step 1 cites this verbatim.

From sister .planning/phase-3.4/DOGFOOD-T2.X.md 55L format (W2 T2.6 gold-standard 100% reuse):
```markdown
# Phase 3.4 T2.11 — Dogfood Report (3-axis empirical evidence: doctor 8-check + routing harness 30/30 + install --known-good real entries)

**Date**: 2026-05-17
**Verdict:** **PASS** (3/3 dogfood axes verified, miss: none)

## Axis A — `harnessed doctor --json` 8-check output capture (D-03 + D-04 token budget DOCTOR-ONLY-WARN)
...
## Axis B — routing harness 30/30 = 100% per-tier breakdown (D-01 + D-02)
...
## Axis C — `harnessed install --known-good` real entries verify (R7.6 + W0.3 DEFERRED #AC resolve)
...
## Aggregate verification
...
## Disposition
- ✅ T2.11 dogfood PASS 3/3 axes verified
```

Phase 4.1 W2 T2.6 mirror — 3 axes ADAPT per Phase 4.1 docs publish scope:
- Axis A: docs/benchmarks/v0.4.md 30-task FULL D-02 + ≤400L verify
- Axis B: docs/benchmarks/v0.4-upgrade-e2e.log 4-section + binary safety + grep-able
- Axis C: W0.1 ENFORCE=true + W0.3 D2 cadence iter 2 archive institutionalize verify

</interfaces>

<verification>
# Overall Phase 4.1 checks (executed at W2 ship gate pre-tag)
- `wc -l docs/benchmarks/v0.4.md` ≤ 400 (planner Discretion #1 hard cap LOCK; R-01 mitigation)
- `wc -l docs/benchmarks/v0.4-upgrade-e2e.log` ≤ 150 (4-section × ~20-40L × 1-2 manifests)
- `wc -l docs/CONTRIBUTING-BENCHMARK.md` ≤ 30 (CONTEXT D-04 explicit lock)
- `wc -l .planning/STATE.md` ≤ 150 (W0.5 flip path) OR ≤ 200 (W0.5 defer path)
- `wc -l .planning/phase-4.1/DOGFOOD-T2.X.md` ≤ 60 (sister Phase 3.4 DOGFOOD precedent)
- `wc -l scripts/check-state-archive-stale.mjs` ≤ 60 (Karpathy spec unchanged 54L)
- `grep -q "ENFORCE = true" scripts/check-state-archive-stale.mjs` exit 0 (W0.1 flip)
- `grep -q "ARCHIVED FROM STATE — Phase 3.3" .planning/RETROSPECTIVE.md` exit 0 (W0.3 D2 cadence iter 2)
- `grep -q "Phase 4.1.*✅ SHIPPED\|Phase 4.1 shipped ✅" .planning/ROADMAP.md` exit 0 (W2 T2.3)
- `grep -q "Phase 4.1" README.md` exit 0 (W2 T2.4)
- `grep -q "Phase 4.1" PROJECT-SPEC.md` exit 0 (W2 T2.5)
- `grep -q "PASS" .planning/phase-4.1/DOGFOOD-T2.X.md` exit 0 (W2 T2.6)
- `grep -c "^### " docs/benchmarks/v0.4.md` ≥ 30 (30 task sections D-02 FULL — Axis A)
- `grep -c "^=== " docs/benchmarks/v0.4-upgrade-e2e.log` ≥ 4 (4-section per D-03 — Axis B)
- `file docs/benchmarks/*.log` returns 'ASCII text' (D-03 sneak block — no binary)
- `wc -c docs/benchmarks/*.log` < 102400 per file (D-03 sneak block — < 100KB)
- `grep -c "asciinema" package.json` = 0 (D-03 sneak block — no npm dep)
- `ls .github/workflows/ | grep -c benchmark` = 0 (D-04 sneak block — no cron)
- `grep -c "benchmark" .github/workflows/ci.yml` = 0 (baseline disk-verified 2026-05-18 `grep -c` = 0; D-04 sneak block — no NEW step)
- `node scripts/check-state-archive-stale.mjs` exit 0 with ENFORCE=true (post-W0.1 flip + post-W0.3 archive + post-W2 续编 ALL pass)
- `node scripts/check-transparency-verdicts.mjs` exit 0 (regression: existing transparency gate still passes post-W2 docs 续编 — STATE_POSITION_RE OR-fallback matches Phase 4.1 SHIPPED literal)
- `git tag --list 'v0.4.0-alpha.1-benchmark' | wc -l` == 1 (W2 T2.7 LOCAL CREATE only; NO push per CLAUDE.md commit safety)
- `git ls-remote origin refs/tags/v0.4.0-alpha.1-benchmark` returns empty (verify NO push — user controls)
</verification>

<success_criteria>
Phase 4.1 SHIPPED when ALL of:

1. **W0 absorb complete** (3 项 path dep STRICT):
   - W0.3 D2 cadence iter 2: STATE.md Phase 3.3+3.4 narrative → RETROSPECTIVE.md verbatim (M2 backlog discharge verify D2 institutionalized 2nd-iter)
   - W0.1 D3 ENFORCE flip: `const ENFORCE = true` post-flip + pre-flight 3 rules verify green + `node scripts/check-state-archive-stale.mjs` exit 0
   - W0.5 CONDITIONAL D1 SIZE_LIMIT tighten: IF STATE post-W0.3 ≤140L → flip 200→150 / OTHERWISE defer Phase 4.2 W0 (per § 7.1 decision tree)

2. **W1 main scope complete** (6 atomic — Phase 4.1 anchor R8.1):
   - docs/benchmarks/v0.4.md NEW ≤400L D-02 FULL per-task disclosure 30 sections × 6-field schema
   - docs/benchmarks/v0.4-upgrade-e2e.log NEW ≤150L 4-section D-03 text log ctx7 + gstack picks
   - docs/CONTRIBUTING-BENCHMARK.md NEW ≤30L D-04 MANUAL re-run instructions
   - Cross-link SAMPLES.md ≥ 2 occurrences in v0.4.md (D-01 single SoT sneak block)
   - Integrity verify: 30 task sections + 4 log sections + each task has 5-field schema

3. **W2 ship close complete** (5 + DOGFOOD + tag = 7 atomic; sister Phase 3.4 W2 11+1 task ~55% subset):
   - STATE.md 续编 Phase 4.1 SHIPPED + 当前位置 v0.4.0 1/3 (combined W0.3 archive sub-step)
   - RETROSPECTIVE.md 续编 6-section + receive W0.3 D2 auto-archive
   - ROADMAP.md L210-212 Phase 4.1 ✅ SHIPPED + v0.4.0 1/3 PROGRESS (NOT 3/3 ARCHIVED reserved Phase 4.3)
   - README.md L9 Status + L44 v0.4.0 1/3 + Phase 4.1 row
   - PROJECT-SPEC.md L3 Status Phase 4.1 SHIPPED literal
   - DOGFOOD-T2.X.md NEW PASS 3/3 axes (A benchmark + B e2e log + C W0.1+W0.3 institutionalize)
   - Single baseline tag `v0.4.0-alpha.1-benchmark` LOCAL CREATE only (NO push)

4. **All acceptance criteria F1-F8 verified** (per <verification> block above)

5. **All 4 D-decisions activated 闭环** (D-01 REUSE SAMPLES + D-02 FULL disclosure + D-03 TEXT LOG zero-dep + D-04 MANUAL on-demand)

6. **DEFERRED #AF + #AG RESOLVED Phase 4.1 W0** (sister cadence delivery); #AH (path traversal) carry-forward Phase 4.0+ LOW priority unchanged

7. **STRIDE threat model 7 nodes mitigated** (per `<threat_model>` block above — all mitigations referenced specific D-decision sneak block守门)

8. **biome preempt verified pre-every-commit** for .ts/.js/.mjs touches (W0.1 + W0.5 `.mjs` mandatory per project memory `feedback_biome-preempt.md` 3 CI-red recurrences terminus续延)

</success_criteria>

<output>
After completion:
1. Each task commits atomically per task_plan.md `Recommended commit msg` blocks (Karpathy why-not-what; sister Phase 3.4 W0 commit msg pattern延袭)
2. Resolved blocks in task_plan.md updated in-place per executor wave outcomes (PENDING → 实占 values)
3. `.planning/phase-4.1/DOGFOOD-T2.X.md` NEW W2 T2.6 PASS 3/3 axes empirical evidence
4. Single baseline tag `v0.4.0-alpha.1-benchmark` LOCAL CREATE only (annotated, no push per CLAUDE.md commit safety)
5. Phase 4.1 ship summary at `.planning/phases/04-dogfooding-benchmark/04.1-01-SUMMARY.md` (NOTE: custom layout per orchestrator — use `.planning/phase-4.1/` consistent with existing artifacts)
6. v0.4.0 milestone progress: 0/3 → 1/3 SHIPPED (NOT yet 3/3 ARCHIVED — reserved Phase 4.3 close)
7. DEFERRED carry items: #AH path traversal regex hardening still Phase 4.0+ conditional; sister M+T tier carry to Phase 4.2 W0 backlog (T3 risk surface real Phase 4.2 co-maintainer 外部依赖)
</output>
