---
phase: 4.2
version: 1
status: ready
type: phase
plan: 1
wave: 0
depends_on: [phase-4.1]
gap_closure: false
autonomous: true

# Frontmatter sister Phase 4.1 PLAN.md 519L 100% template reuse — adapted Phase 4.2 community-infra publish scope
# Phase 4.2 = v0.4.0 milestone 2nd phase (R8.2 onboarding EXPAND + R8.3 stale-bot + R8.5 GitHub Sponsors; T3 external dependency真正 fires here per D-04 HYBRID 2-clock LOCK)
# 4 D-decisions LOCKED (CONTEXT 4.2-CONTEXT.md): D-01 EXPAND existing 50L stub → 100-150L production / D-02 90-day issue+PR / D-03 Single tier $1+ Karpathy YAGNI / D-04 HYBRID 2-week internal + 6-month organic external

requirements:
  - R8.2   # co-maintainer 招募窗口 — 6 月窗口 + docs/MAINTAINER-ONBOARDING.md; 验收 "外部新人 30 分钟可跑通 dev 环境"
  - R8.3   # stale-bot + issue templates — GitHub Action stale workflow 自动关闭 90 天无活动 issue; 验收 stale-bot 上线 + issue 模板使用率 ≥ 80%
  - R8.5   # GitHub Sponsors 启用 — Sponsors page + README badge; 验收 Sponsors 链接公开 + 可接受捐赠

files_modified:
  # ===== W0 backlog absorb (2 项 STRICT path dep T0.1 → T0.2; W0.1 trim creates W0.2 SIZE_LIMIT flip headroom) =====
  - .planning/STATE.md                                          # W0.1 D2 cadence iter 3 — trim Phase 4.1 narrative (~-12-18L expected) → RETROSPECTIVE.md § ARCHIVED FROM STATE — Phase 4.0+4.1 (section header literal preserved per sister Phase 4.1 W0 T0.1 cadence affirm L640; Phase 4.0 absence disambiguated in content body NOT header — sister R-4 cadence consistency mitigation)
  - .planning/RETROSPECTIVE.md                                  # W0.1 D2 cadence iter 3 — receive Phase 4.1 narrative section (verbatim relocate; sister Phase 4.1 W2 T2.2 step 3 2nd-iter institutionalize → Phase 4.2 W0.1 3rd-iter institutionalize verify ≥3-iter terminus pattern stable)
  - scripts/check-state-archive-stale.mjs                       # W0.2 CONDITIONAL D1 SIZE_LIMIT 200→150 flip IF post-W0.1 STATE ≤140L (1-line surgical L12 same file as Phase 4.1 W0.5 path); OTHERWISE DEFER #BA→Phase 4.3 W0 (sister Phase 4.1 W0.5 DEFER path precedent post-W0.3 STATE 143L exceeded 140L threshold)
  # ===== W1 main scope community infra (5 项 — Phase 4.2 anchors R8.2 + R8.3 + R8.5) =====
  - docs/MAINTAINER-ONBOARDING.md                              # W1 T1.1 EXPAND 50L → 100-150L additive (D-01 LOCKED preserve existing 6+2 sections verbatim + ADD 6 NEW sections covering R8.2 30-min quickstart spec); Karpathy hard cap ≤150L docs convention; sister 1-file precedent CONTRIBUTING.md+PROJECT-SPEC.md (NO split into multiple files D-01 sneak #1)
  - .github/workflows/stale.yml                                # W1 T1.2 NEW ~45L (D-02 LOCKED actions/stale@v10 recipe per R2 § 2 finding correction NOT @v9; 60+30 split 90-day total per R8.3 spec verbatim "mark stale at day 60 → close at day 90"; issue+PR scope per D-02 sneak block #3; cron daily 1:30 UTC actions/stale README default per planner Discretion #2)
  - .github/ISSUE_TEMPLATE/01-bug.yml                          # W1 T1.3a NEW ~55-60L form-based YAML (D-03 supporting infra per planner Discretion #3 yml NOT classical .md; OS/Node/harnessed version + reproduce + expected/actual; labels [bug, triage] auto-apply)
  - .github/ISSUE_TEMPLATE/02-feature.yml                      # W1 T1.3b NEW ~40-45L form-based YAML (R9.5 三问 checkboxes defend 范围蔓延 per RESEARCH § 6.3; labels [enhancement, triage])
  - .github/ISSUE_TEMPLATE/03-question.yml                     # W1 T1.3c NEW ~30-35L form-based YAML (header markdown redirect to MAINTAINER-ONBOARDING § Dev Quickstart; labels [question])
  - .github/ISSUE_TEMPLATE/config.yml                          # W1 T1.3d NEW ~12L blank_issues_enabled: false (R8.3 80% adoption defender; contact_links → MAINTAINER-ONBOARDING + ROADMAP v1.0 拒绝清单)
  - .github/FUNDING.yml                                        # W1 T1.4 NEW ~3-8L (D-03 LOCKED single-line `github: easyinplay` per [CITED: docs.github.com/sponsors] minimum example; NO multi-tier pricing per D-03 sneak block #1; NO custom: array URL per sneak #3)
  - README.md                                                  # W1 T1.4 + W2 T2.4 combined — L8 Sponsors badge insertion `[![Sponsor](https://img.shields.io/github/sponsors/easyinplay?logo=github&label=Sponsor)](https://github.com/sponsors/easyinplay)` (planner Discretion #1 TOP + FOOTER both per RESEARCH § 5.1) + L190-192 footer Sponsor section EXPAND (+3-4L) + W2 L9 Status freshness Phase 4.2 SHIPPED + v0.4.0 2/3 PROGRESS marker + Phase 4.2 row append (sister 5-recurrence terminus D-04 COLLAPSE STATUS_MARKER path延袭)
  # ===== W2 ship close (6 项 — sister Phase 4.1 W2 7-task subset; NO ADR 0018 + NO A7 iter + NO triple tag per PATTERNS § 5 risk #3 mitigation延袭) =====
  # NOTE: STATE.md + RETROSPECTIVE.md already listed above for W0.1 trim — W2 T2.1 ALSO touches STATE.md for Phase 4.2 SHIPPED 续编 (combined per sister § 8.2 D2 cadence iter 3 institutionalize at ship-time T6.N)
  - .planning/ROADMAP.md                                       # W2 T2.3 — Phase 4.2 ✅ SHIPPED marker + v0.4.0 2/3 PROGRESS (NOT yet 3/3 ARCHIVED — reserved Phase 4.3 close per sister L38 v0.1.0 + L58 v0.2.0 + L130 v0.3.0 SHIPPED ARCHIVED literal cadence延袭) + L185 v0.4.0 milestone block inline D-04 HYBRID 2-clock reconcile note (R-3 mitigation)
  - PROJECT-SPEC.md                                            # W2 T2.5 — L3 Status header Phase 4.2 SHIPPED literal + L6 下一步 Phase 4.3 candidate (sister Phase 4.1 W2 T2.5 + Phase 3.4 W2 T2.6 FRONT_MATTER_DOCS transparency gate pattern延袭)
  - .planning/phase-4.2/DOGFOOD-T2.X.md                        # W2 T2.7 NEW ~55-60L 3-axis empirical evidence: (A) MAINTAINER-ONBOARDING ≥100 ≤150 EXPAND + 6 NEW section presence verify (B) .github/ NEW infra cluster — FUNDING.yml + stale.yml actions/stale@v10 + 60+30 split + 4 ISSUE_TEMPLATE yml files + blank_issues_enabled false (C) README Sponsors badge URL valid + footer 2-cross-link verify + D-04 HYBRID 2-clock STATE.md L23 + RETRO § Cost patterns process-level verify (sister Phase 4.1 DOGFOOD-T2.X.md 58L format 100% reuse)

threats_open:
  # STRIDE per RESEARCH § 12 (7 nodes — Phase 4.2 docs/infra narrow attack surface community-facing)
  - threat: FUNDING.yml repo permission tamper (attacker PR adding their own `github: attacker` key)
    stride: S  # Spoofing
    mitigation: Branch protection on main (already in place per repo settings) + reviewer MUST verify `github:` key matches `easyinplay` post-merge (planner W1 T1.4 acceptance grep `^github: easyinplay`); CODEOWNERS `.github/**` rule DEFERRED v0.4.3+ if real attack surface arrives (sister #AH defer pattern延袭 per RESEARCH § 15.1 SR-6)
  - threat: Issue template form-based YAML injection (attacker submits malformed YAML breaking template chooser)
    stride: T  # Tampering
    mitigation: GitHub server-side validates ISSUE_TEMPLATE YAML on PR; CI no separate gate needed (GitHub-native); reviewer manual verify rendered template via PR preview pre-merge (planner W1 T1.3 acceptance — verify YAML parses via local `yq eval` check)
  - threat: Sponsors transparency repudiation (sponsor claims donation, account denies receipt)
    stride: R  # Repudiation
    mitigation: GitHub Sponsors built-in receipt + transaction log (Sponsors dashboard); no harnessed-side mitigation needed (GitHub trusted infra); public Sponsors page lists active sponsors per platform default
  - threat: Information Disclosure via issue template (PII leak in bug report — user pastes API keys/credentials in `additional context` textarea)
    stride: I  # Info Disclosure
    mitigation: bug.yml markdown intro explicit "DO NOT include API keys/credentials/secrets" warning (planner W1 T1.3a acceptance — grep `DO NOT.*credentials` 01-bug.yml); reviewer triage scrub before label per sister CLAUDE.md MEMORY pattern延袭
  - threat: Stale-bot bulk-close DoS (attacker spams 1000 stale issues to trigger 1000 close operations → API rate limit exhaustion)
    stride: D  # Denial of Service
    mitigation: `operations-per-run: 30` actions/stale default rate limit (planner W1 T1.2 acceptance — grep `operations-per-run` stale.yml); `exempt-issue-labels: pinned,security,good-first-issue,help wanted` prevents bulk-close of important issues; daily cron 1:30 UTC amortizes load over time
  - threat: Stale-bot permissions over-scope (workflow has broader perms than needed — e.g., `contents: write` would allow code tampering)
    stride: E  # Elevation
    mitigation: `permissions:` block in stale.yml scoped to ONLY `issues: write` + `pull-requests: write` (NOT `contents: write` or `actions: write`); planner W1 T1.2 acceptance — grep `permissions:` block + verify NO `contents` key; GitHub minimal-perms convention per actions/stale README
  - threat: R8.2 + R8.3 + R8.5 acceptance verify gaps (compliance meta-STRIDE — ship config without verifying it works)
    stride: C  # Compliance (meta-STRIDE)
    mitigation: DOGFOOD-T2.X.md 3-axis verify (per RESEARCH § 13): Axis A MAINTAINER-ONBOARDING 100-150L EXPAND verify + Axis B stale.yml YAML lints + 4 ISSUE_TEMPLATE files + Axis C Sponsors badge link integrity + footer 2-occurrence cross-link; W2 T2.7 PASS 3/3 gate

must_haves:
  # ===== 4 D-decisions verbatim (CONTEXT 4.2-CONTEXT.md L10-37 LOCKED — 0 sneak tolerance) =====
  decisions:
    - id: D-01
      lock: OnboardScope EXPAND existing 50L stub → 100-150L production-ready (additive preserve)
      sneak-block: |
        planner / executor MUST NOT split into multiple files (single ONBOARDING.md SoT; sister CONTRIBUTING.md + PROJECT-SPEC.md 1-file precedent)
        planner / executor MUST NOT use checklist-only format (lose narrative context for 新人; R8.2 30-min quickstart spec requires hybrid commands + narrative)
        planner / executor MUST preserve existing 6+2 sections verbatim (Status / 目标 / 招募窗口 / Co-maintainer 角色定位 / 必读文档 / v0.4 启动前 TODO / 风险 / References); additive expand NOT full rewrite
        planner / executor MUST cap ≤150L hard per CLAUDE.md docs convention (50L stub + ~75L NEW sections = ~125L within); if breach drop section F (Upstream Drift Monitoring) FIRST per § 2.2 mitigation hierarchy
    - id: D-02
      lock: StaleBotPolicy 90-day default + issue+PR scope (60+30 split: mark stale day 60 + close day 90)
      sneak-block: |
        planner / executor MUST NOT use 60-day stricter total (risks 埋没 new contributor issues; T3 external dependency 不利)
        planner / executor MUST NOT use 120-day lenient total (违 R8.3 90-day spec verbatim)
        planner / executor MUST cover BOTH issue + PR scope (avoid zombie PRs blocking maintainer attention)
        planner / executor MUST pin `actions/stale@v10` (NOT @v9 outdated per R2 finding correction; NOT @main floating risk)
        planner / executor MUST include `exempt-issue-labels: 'pinned,security,good first issue,help wanted'` defensive list per actions/stale README recommendation
    - id: D-03
      lock: SponsorsTier Single tier $1+ minimal Karpathy YAGNI (`github: easyinplay` single-line FUNDING.yml)
      sneak-block: |
        planner / executor MUST NOT define multi-tier 3-level ($5/$25/$100) pricing in repo config (Patreon-style pricing-design overhead pre-v1.0; tier definition lives in Sponsors dashboard UI per RESEARCH § 4.3)
        planner / executor MUST NOT use link-only no-tier (违反 "可接受捐赠" verb literal — R8.5 acceptance requires actionable sponsor button)
        planner / executor MUST NOT add `custom:` array URL (sister Karpathy YAGNI — defer until community signal post-launch)
        planner / executor MUST update README badge + footer Sponsors section (planner Discretion #1 TOP + FOOTER both per RESEARCH § 5.1; shields.io standard URL)
    - id: D-04
      lock: CadenceExpect HYBRID 2-week internal launch + 6-month organic external clock (sister T3 DEFERRED #BB resolve)
      sneak-block: |
        planner / executor MUST NOT use FROZEN 6-month total (violates ROADMAP L185 v0.4.0 2-3 周 total internal cadence)
        planner / executor MUST NOT use ACCELERATED "招到 1 个外部 PR within 2 weeks" expect (忽视 T3 external time 不可控 per Avelino 36% 长期工程)
        planner / executor MUST treat 6-month co-maintainer recruitment as SEPARATE clock NOT counted in v0.4.0 ship timeline
        verification at process-level NOT artifact-level: STATE.md L23 + RETROSPECTIVE.md § Cost patterns explicit 2-clock language ("Internal infra ship clock" + "External co-maintainer organic clock" both literal phrases present per RESEARCH § 7.3 enforcement)

  # ===== W0 backlog 1 项 conditional absorbed (#BA conditional carry; 4 项 DEFER unchanged per CONTEXT § W0 backlog) =====
  w0_backlog:
    - id: W0.1 (sister M2 D2 cadence iter 3 verify — institutionalize ≥3-iter terminus stable signal)
      action: trim Phase 4.1 narrative → RETROSPECTIVE.md § ARCHIVED FROM STATE — Phase 4.0+4.1 (section header literal preserved per sister Phase 4.1 W0 T0.1 cadence affirm L640; content body single-phase Phase 4.1 — Phase 4.0 absence disambiguated per R-4 mitigation; sister Phase 4.1 W0.3 1st-implementation → Phase 4.1 2nd-iter institutionalize → Phase 4.2 3rd-iter terminus stable per ≥3-iter pattern signal heuristic)
      priority: HIGH
      path-dep: FIRST (reduces STATE.md size — creates W0.2 SIZE_LIMIT flip headroom per § 8.2 decision tree; sister Phase 4.1 W0.3 cadence延袭)
    - id: W0.2 (DEFERRED #BA D1 SIZE_LIMIT 200→150 conditional flip)
      action: CONDITIONAL — IF post-W0.1 STATE.md ≤140L → flip 1-line surgical L12 `const SIZE_LIMIT = 200` → `const SIZE_LIMIT = 150` (sister Phase 4.1 W0.5 1-line cadence延袭; same file as Phase 4.1 W0.1 ENFORCE flip); OTHERWISE DEFER #BA carry-forward Phase 4.3 W0 LOW priority defensive (sister Phase 4.1 W0.5 DEFER path precedent active)
      priority: MED conditional
      path-dep: AFTER W0.1 (conditional decision tree per § 8.2: ≤140L → FLIP / 141-150L → DEFER #BA / >150L → BLOCKED + investigate)

  # ===== Observable truths (R8.2 + R8.3 + R8.5 goal-backward decomposition) =====
  truths:
    # W0 truths (2 absorbed conditional)
    - "developer reads `.planning/RETROSPECTIVE.md` and finds `## § ARCHIVED FROM STATE — Phase 4.0+4.1 (Phase 4.2 W0.1 D2 cadence iter 3, 2026-05-18)` section containing verbatim relocated Phase 4.1 narrative from STATE.md (single-phase due to Phase 4.0 absence; section header literal preserved per sister Phase 4.1 W0 T0.1 cadence affirm L640 — R-4 cadence consistency mitigation); HTML-comment archive marker pointer left in STATE.md trim site per sister L27 format; D2 standing process fires 3rd-iter beyond 2nd-iter institutionalize verify (≥3-iter terminus pattern stable signal per sister 5-recurrence terminus heuristic)"
    - "developer can run `node scripts/check-state-archive-stale.mjs` post-W0.2-flip (IF flip path) and gate passes with SIZE_LIMIT=150 (3 rules: STATE ≤150L + 0 关键决议 ship 总结 sections + 0 W-N errata literals) — OR W0.2 defer path STATE remains ≤200L baseline with SIZE_LIMIT=200 unchanged + DEFERRED #BA carry-forward Phase 4.3 W0 LOW priority (sister Phase 4.1 W0.5 DEFER path precedent active); decision tree per § 8.2: post-W0.1 STATE ≤140L → flip safe (10L headroom) / 141-150L → defer / >150L → BLOCKED investigate W0.1 trim sufficiency"
    # W1 truths (5 main scope artifacts — Phase 4.2 anchors)
    - "developer reads `docs/MAINTAINER-ONBOARDING.md` (post-EXPAND ~125-145L ≤ 150L hard cap) and finds: (a) existing 6+2 sections preserved verbatim (Status / 目标 / 招募窗口 / Co-maintainer 角色定位 / 必读文档 with ADR list updated 0001/0002/0003 + ADD 0014-0017 / v0.4 启动前 TODO with ✓ check-off for Sponsors + stale-bot + issue template / 风险 / References) per D-01 sneak block #3; (b) 6 NEW sections ADDED between 必读文档 and v0.4 启动前 TODO per § 2.2 ordering (A Dev Environment 30-min Quickstart ~18L cross-link CONTRIBUTING.md Setup + Win Workaround NOT duplicate per Karpathy DRY + B Commit Convention Reference ~10L cross-link CONTRIBUTING + phase-N.M T<N>.<M> format + biome preempt warning + C ADR Review Checklist ~15L 5-point list cross-ref 0005 errata precedent + D Cross-OS CI Maintenance Playbook ~10L sister Phase 3.4 build-before-test hotfix 554b82b cross-link + E Manifest Schema 守门 SOP ~10L ADR 0001 + 0003 cross-ref + F Upstream Drift Monitoring ~12L `harnessed doctor` + monthly version diff procedure); (c) Karpathy hard cap ≤ 150L per CLAUDE.md docs convention satisfied; R8.2 acceptance '外部新人 30 分钟可跑通 dev 环境' satisfied via hybrid narrative + commands"
    - "developer reads `.github/workflows/stale.yml` (NEW ~45L) and finds: (a) `uses: actions/stale@v10` pin per R2 § 2 verified current v10.2.0 Feb 2026 (NOT @v9 outdated per CONTEXT D-02 reference; NOT @main floating risk); (b) `days-before-issue-stale: 60` + `days-before-issue-close: 30` + `days-before-pr-stale: 60` + `days-before-pr-close: 30` (60+30 split = 90-day total per CONTEXT D-02 'mark stale at day 60 → close at day 90' verbatim; issue+PR scope per D-02 sneak block #3); (c) `permissions: { issues: write, pull-requests: write }` minimal scope (NOT contents/actions — STRIDE E mitigation); (d) `exempt-issue-labels: 'pinned,security,good first issue,help wanted'` defensive list per actions/stale README recommendation; (e) `operations-per-run: 30` rate limit default (STRIDE D mitigation); (f) cron `30 1 * * *` daily 1:30 UTC reuse actions/stale README default (planner Discretion #2); (g) workflow_dispatch manual trigger for testing"
    - "developer reads `.github/ISSUE_TEMPLATE/` directory and finds 4 NEW yml files: (a) `01-bug.yml` ~55-60L form-based with OS dropdown + Node version + harnessed version + reproduce/expected/actual textareas + DO NOT include credentials warning (STRIDE I mitigation) + labels [bug, triage] auto-apply; (b) `02-feature.yml` ~40-45L with problem/proposal/alternatives + R9.5 三问 checkboxes defending 范围蔓延 per RESEARCH § 6.3 + labels [enhancement, triage]; (c) `03-question.yml` ~30-35L with header markdown redirect to MAINTAINER-ONBOARDING § Dev Quickstart + labels [question]; (d) `config.yml` ~12L `blank_issues_enabled: false` (R8.3 80% adoption defender — enforce template usage 100%) + 2 contact_links (MAINTAINER-ONBOARDING + ROADMAP v1.0 拒绝清单); per planner Discretion #3 yml form-based per [CITED: docs.github.com/communities] 2026 best practice (NOT classical .md)"
    - "developer reads `.github/FUNDING.yml` (NEW ~3-8L) and finds: `github: easyinplay` single-line config per [CITED: docs.github.com/sponsors] minimum example + 2-3 header comment lines explaining D-03 LOCKED rationale (single tier $1+ Karpathy YAGNI; defer multi-tier pricing v0.5+); NO `patreon:` / `open_collective:` / `ko_fi:` / `custom:` keys (D-03 sneak block #1 + #3 enforcement); developer also notes user manual prerequisite per RESEARCH § 4.2 — Sponsors button render on repo page requires Sponsors account activation at github.com/sponsors/easyinplay/dashboard (Pending Approval → Active state); FALLBACK accepted: ship FUNDING.yml + badge forward-compatible per RESEARCH § 17.2 U1"
    - "developer reads `README.md` and finds: (a) L8 Sponsors badge appended to L6-7 badge cluster: `[![Sponsor](https://img.shields.io/github/sponsors/easyinplay?logo=github&label=Sponsor)](https://github.com/sponsors/easyinplay)` (planner Discretion #1 TOP + FOOTER both per RESEARCH § 5.1; shields.io standard auto-pulls dynamic count); (b) L190-192 footer Sponsor section EXPANDED ~3L → ~7L with `已启用` literal + badge inline + Sponsors URL link + Co-maintainer 6 月窗口 cross-link to MAINTAINER-ONBOARDING + stale-bot operational note; (c) README total 196 → 200-201L approaches ≤200L hard cap per CLAUDE.md sister 6-phase 连续 hold; mitigation hierarchy explicit per RESEARCH § 5.2 (condense footer 7L → 6L IF breach); cross-link count: footer 2 occurrences of `sponsors/easyinplay` (badge + Sponsors URL) per § 5.4 sneak block enforcement"
    # W2 truths (6 ship close — sister Phase 4.1 W2 cluster延袭)
    - "developer reads `.planning/STATE.md` (post-W0.1 D2 cadence iter 3 trim Phase 4.1 → RETROSPECTIVE + W2 T2.1 Phase 4.2 SHIPPED 续编) and finds: 当前位置 block updated with Phase 4.2 SHIPPED marker (preserve `**Phase 3.4 SHIPPED**` literal STATE_POSITION_RE anchor for D-04 COLLAPSE freshness gate; ADD `✅ **Phase 4.2 SHIPPED**` prepend); 当前里程碑 v0.4.0 milestone 1/3 → 2/3 PROGRESS (NOT yet 3/3 ARCHIVED — reserved Phase 4.3 close per sister cadence); 下一 phase Phase 4.3 plan-phase 启动 (v0.4.0 milestone close + R8.4 ADR 全集 + 路由透明度日志 audit.log); 已完成 phase ship 历史 16th entry Phase 4.2 shipped ✅ (2026-05-18); STATE.md L23 explicit 2-clock disambiguation note '6-month external co-maintainer recruitment window opens post-v0.4.0 ship (organic clock per D-04 HYBRID)' per R-3 mitigation"
    - "developer reads `.planning/RETROSPECTIVE.md` and finds Phase 4.2 milestone retrospective 7-section entry appended (sister Phase 4.1 W2 T2.2 6-section + bonus Next Phase Prep Notes = 7-section format 100% reuse): § What worked (4 D-decisions activated 闭环 + W0.1 D2 cadence iter 3 stable ≥3-iter terminus) + § What was inefficient (3 NEW `.github/` first-time community-infra surface ~42% weighted avg W1 reuse) + § Patterns established (8-phase consecutive deferred-items cadence + D2 cadence iter 3 stable 3rd-iter institutionalize confirm) + § Cost patterns (Phase 4.2 内部 phase 1 day cadence延袭; T3 external dependency = co-maintainer 招募 6-month 真正 clock SEPARATE per D-04 HYBRID — DOES NOT count v0.4.0 ship timeline) + § Key lessons (i D-01 ADDITIVE EXPAND > FULL REWRITE; ii D-03 single tier $1+ Karpathy YAGNI > multi-tier pre-v1.0; iii D-04 HYBRID 2-clock reconcile pattern for external-dependency phase + U1 Sponsors account external prereq capture lesson) + § Cross-milestone trends (v0.4.0 第 2 phase 续延 Phase 4.1 同日 1-day cadence; W0.1 D2 cadence iter 3 verify stable ≥3-iter terminus signal pattern) + § Next Phase Prep Notes (Phase 4.3 v1.0-RC close phase R8.1 audit log + R8.4 ADR 全集 + milestone close 3-file archive triplet + 🎯 v0.4.0 milestone close triple tag); ALSO receives W0.1 D2 auto-archive Phase 4.0+4.1 narrative section"
    - "developer reads `.planning/ROADMAP.md` and finds: (a) Phase 4.2 entry L216-218 area marked ✅ SHIPPED (2026-05-18) + brief outcome summary (sister Phase 4.1 L210-215 verbose 5-bullet format延袭); (b) v0.4.0 milestone progress 1/3 → 2/3 PROGRESS (NOT yet 3/3 ARCHIVED — reserved Phase 4.3 close per sister L38 v0.1.0 + L58 v0.2.0 + L130 v0.3.0 SHIPPED ARCHIVED literal cadence延袭); (c) Phase 4.3 next phase kickoff reference (R8.1 audit log + R8.4 ADR 全集 + v1.0-RC close); (d) L185 v0.4.0 milestone block inline D-04 HYBRID 2-clock note added '(2-3 周 internal ship clock 已验证 Phase 4.1+4.2 ≤1 day each; external co-maintainer 6-month organic clock SEPARATE per D-04 HYBRID — runs Phase 4.3 close through v0.5)' per R-3 mitigation"
    - "developer reads `README.md` and finds: (a) L9 Status freshness header updated Phase 4.2 SHIPPED + v0.4.0 2/3 PROGRESS (sister 5-recurrence terminus D-04 COLLAPSE STATUS_MARKER path延袭 — preserve single SoT L9 freshness pattern); (b) L48 area MILESTONE row v0.4.0 1/3 → 2/3 (NOT yet 3/3 ARCHIVED); (c) Phase 4.2 entry appended to shipped phase list (sister Phase 4.1+3.4+3.3+3.2+3.1 row pattern延袭); (d) L8 Sponsors badge insertion combined per W1 T1.4 deliverable + L190-192 footer Sponsor section EXPAND combined; (e) freshness gate `node scripts/check-transparency-verdicts.mjs` exit 0 post-MODIFY pass (STATE_POSITION_RE OR-fallback matches Phase 4.2 SHIPPED literal)"
    - "developer reads `PROJECT-SPEC.md` L3 Status header and finds Phase 4.2 SHIPPED literal added + L6 下一步 Phase 4.3 candidate (sister Phase 4.1 W2 T2.5 + Phase 3.4 W2 T2.6 FRONT_MATTER_DOCS transparency gate pattern延袭); freshness gate post-MODIFY pass"
    - "developer reads `.planning/phase-4.2/DOGFOOD-T2.X.md` (NEW ~55-60L PASS 3/3 axes) and finds 3-axis empirical evidence per sister Phase 4.1 DOGFOOD-T2.X.md 58L format 100% reuse: (Axis A) MAINTAINER-ONBOARDING.md EXPAND verify — `wc -l` ≥100 ≤150 + `grep -c '^## '` ≥ 12 (preserve 8 + add 6) + 6 NEW section literal grep (Dev environment + Commit conventions + ADR review + Cross-OS CI + Manifest schema + Upstream drift); (Axis B) `.github/` NEW infra cluster verify — `test -f FUNDING.yml` + `grep '^github: easyinplay'` + `test -f workflows/stale.yml` + `grep 'actions/stale@v10'` (NOT @v9 per R2 finding) + `grep -E 'days-before-(issue|pr)-(stale|close)'` 4 matches + `ls ISSUE_TEMPLATE/*.yml | wc -l` ≥ 4 + `grep 'blank_issues_enabled: false' config.yml`; (Axis C) Sponsors badge + footer + D-04 HYBRID 2-clock process verify — `grep 'img.shields.io/github/sponsors/easyinplay' README.md` + `grep -c 'sponsors/easyinplay' README.md` ≥ 2 + STATE.md L23 grep '6-month external' literal + RETRO § Cost patterns grep 'Internal infra ship clock' + 'External co-maintainer organic clock' both literal; PASS verdict header `PASS 3/3 dogfood axes verified, miss: none`; Karpathy ≤60L sister Phase 4.1 DOGFOOD 58L precedent; explicit external prereq note Axis C 'Sponsors button render on repo page requires user manual Sponsors account activation (Pending Approval → Active state); Phase 4.2 ships config + DOGFOOD verifies infra NOT button render'"

  artifacts:
    # W0 artifacts (2 absorbed conditional — path dep STRICT W0.1 → W0.2)
    - path: ".planning/STATE.md"
      provides: "W0.1 D2 cadence iter 3 trim — sister Phase 4.1 W0.3 step verbatim pattern reuse: Identify Phase 4.1 entries in 已完成 phase ship 历史 section L43 (post-Phase 4.1 ship 1 long verbose entry) + 关键决策 records L116-122 area (Phase 4.1 D-01/D-02/D-03/D-04 + W0.x rows IF present) + 当前位置 L22-26 long inline narrative → archive verbatim to RETROSPECTIVE.md new section `## § ARCHIVED FROM STATE — Phase 4.0+4.1 (Phase 4.2 W0.1 D2 cadence iter 3, 2026-05-18)`; section header literal preserved per sister Phase 4.1 W0 T0.1 cadence affirm L640 (Phase 4.0 absence disambiguated in content body NOT header — R-4 cadence consistency mitigation); preserve recent Phase 4.1 SHIPPED + Phase 3.4 SHIPPED pointers (1-line each); 当前位置 long inline narratives condense to 1-line pointers; estimated trim delta ~-12-18L (151L → ~135-140L expected); leaves HTML-comment archive marker pointer per sister L27 format; W2 T2.1 续编 appends Phase 4.2 SHIPPED entry (~+5-10L delta) → final STATE.md ≤150L IF W0.2 flip / ≤200L IF W0.2 defer (sister Phase 4.1 round 1 151L baseline); ALSO W2 T2.1 adds L23 explicit 2-clock disambiguation note '6-month external co-maintainer recruitment window opens post-v0.4.0 ship (organic clock per D-04 HYBRID)' per R-3 mitigation"
      contains: "ARCHIVED FROM STATE — Phase 4.0+4.1"
    - path: ".planning/RETROSPECTIVE.md"
      provides: "W0.1 D2 cadence iter 3 receive — accept Phase 4.1 narrative verbatim relocation (sister Phase 4.1 W2 T2.2 step 3 RETROSPECTIVE.md absorb section structure verbatim): `## § ARCHIVED FROM STATE — Phase 4.0+4.1 (Phase 4.2 W0.1 D2 cadence iter 3, 2026-05-18)` subsection containing Phase 4.1 SHIPPED narrative archived from STATE.md (single-phase due to Phase 4.0 absence — disambiguated in content body footer note per R-4 mitigation 'Phase 4.0 was a numeric placeholder NOT a real shipped phase; Phase 4.1 narrative archived solo per single-phase iter 3 archive'); verbatim relocation (NO content rewriting per sister § 8.5 sneak-block); LOC delta ≈ +15-20L (trimmed lines from STATE.md verbatim relocation); reviewer diff verify additions = deletions 1:1; ALSO receives W2 T2.2 Phase 4.2 milestone retrospective 7-section append"
      contains: "Phase 4.0+4.1"
    - path: "scripts/check-state-archive-stale.mjs"
      provides: "W0.2 CONDITIONAL D1 SIZE_LIMIT 200→150 flip (1-line surgical L12 same file as Phase 4.1 W0.1 ENFORCE flip): IF post-W0.1 STATE ≤140L → flip `const SIZE_LIMIT = 200 // round 1; tighten to 150 v0.4 per DEFERRED #AG → Phase 4.2 W0.1 re-eval per #BA carry` → `const SIZE_LIMIT = 150 // Phase 4.2 W0.2 round 2 tighten — sister DEFERRED #BA resolve (W0.1 trim outcome STATE post-trim ≤140L verified pre-flip; Phase 4.1 W0.5 DEFER path resolved)`; file size 54L → 54L unchanged (1-line value flip zero size delta; ≤60L Karpathy hard); OTHERWISE DEFER #BA carry-forward Phase 4.3 W0 LOW priority (sister Phase 4.1 W0.5 DEFER path precedent active); pre-flight verify `node scripts/check-state-archive-stale.mjs` exit 0 with ENFORCE=true (already shipped Phase 4.1 W0.1) + new SIZE_LIMIT=150 baseline post-flip"
      contains: "SIZE_LIMIT = 150"

    # W1 main scope artifacts (Phase 4.2 anchors R8.2 + R8.3 + R8.5; 6 NEW/MODIFY)
    - path: "docs/MAINTAINER-ONBOARDING.md"
      provides: "W1 T1.1 EXPAND 50L → ~125-145L additive per D-01 LOCKED preserve all 6+2 existing sections verbatim (Status L1-4 update v0.1 → v0.4 activated + 目标 L6-8 + 招募窗口 L10-14 update 启动 v0.4 ship 实际 + Co-maintainer 角色定位 L16-20 + 必读文档 L22-31 ADD 0014-0017 cross-link + DOGFOOD docs cross-link + v0.4 启动前 TODO L33-39 check off Sponsors ✓ + stale-bot ✓ + issue template ✓ + 风险 L41-45 + References L47-49) + ADD 6 NEW sections per § 2.2 ordering (A Dev Environment 30-min Quickstart ~18L cross-link CONTRIBUTING.md Setup + Win Workaround NOT duplicate per Karpathy DRY + B Commit Convention Reference ~10L cross-link CONTRIBUTING + phase-N.M T<N>.<M> format + biome preempt warning + C ADR Review Checklist ~15L 5-point list + D Cross-OS CI Maintenance Playbook ~10L sister Phase 3.4 build-before-test hotfix 554b82b cross-link + E Manifest Schema 守门 SOP ~10L ADR 0001 + 0003 cross-ref + F Upstream Drift Monitoring ~12L `harnessed doctor` + monthly version diff); inserted between 必读文档 (L31) and v0.4 启动前 TODO (L33) — section count post-expand 8 existing + 6 NEW = 14 sections; Karpathy hard cap ≤150L docs convention; if breach drop section F FIRST (Upstream Drift lowest acceptance value per § 2.2 mitigation hierarchy) → ~113L OR drop section E (Manifest Schema SOP) → ~115L (keep A+B+C+D essential R8.2 verbs)"
      contains: "Dev environment"
    - path: ".github/workflows/stale.yml"
      provides: "W1 T1.2 NEW ~45L per D-02 LOCKED actions/stale@v10 recipe per R2 § 2 verified current (NOT @v9 per CONTEXT D-02 reference outdated; finding correction critical): name: 'Close stale issues and PRs' + on: schedule cron '30 1 * * *' daily 1:30 UTC + workflow_dispatch manual trigger + permissions { issues: write, pull-requests: write } minimal scope (STRIDE E mitigation NOT contents/actions) + jobs.stale.runs-on: ubuntu-latest + uses: actions/stale@v10 + with-block: days-before-issue-stale 60 + days-before-issue-close 30 + days-before-pr-stale 60 + days-before-pr-close 30 (60+30 split = 90-day total per R8.3 spec verbatim) + stale-issue-label 'stale' + stale-pr-label 'stale' + stale-issue-message friendly + stale-pr-message + close-issue-message + close-pr-message + exempt-issue-labels 'pinned,security,good first issue,help wanted' (STRIDE D mitigation defensive list per actions/stale README) + exempt-pr-labels 'pinned,security,blocked' + operations-per-run 30 (STRIDE D rate limit default); Karpathy hard ≤60L"
      contains: "actions/stale@v10"
    - path: ".github/ISSUE_TEMPLATE/01-bug.yml"
      provides: "W1 T1.3a NEW ~55-60L form-based YAML per planner Discretion #3 yml (NOT classical .md) per [CITED: docs.github.com/communities] 2026 best practice: name: 'Bug Report' + description + title prefix '[Bug]: ' + labels [bug, triage] + body markdown intro 'Thanks for taking the time to fill out a bug report. **DO NOT include API keys/credentials/secrets in any field** (STRIDE I mitigation). For questions, see [docs/MAINTAINER-ONBOARDING.md](../../docs/MAINTAINER-ONBOARDING.md)' + body input id harnessed-version (required) + dropdown id os (Windows/macOS/Linux Ubuntu/Linux other/WSL2) required + input id node-version (required, ≥22) + textarea id reproduce (required) + textarea id expected (required) + textarea id actual (required) + textarea id additional (optional, routing decision context + harnessed doctor output + audit.log v0.4.3+); filename prefix `01-` ensures bug listed first in template chooser per [CITED: docs.github.com/communities] alphanumeric sort"
      contains: "Bug Report"
    - path: ".github/ISSUE_TEMPLATE/02-feature.yml"
      provides: "W1 T1.3b NEW ~40-45L form-based YAML per RESEARCH § 6.3 verbatim: name: 'Feature Request' + description + title prefix '[Feature]: ' + labels [enhancement, triage] + body markdown header 'Before submitting, please check R9.5 范围蔓延防御 三问 below. See [.planning/ROADMAP.md](../../.planning/ROADMAP.md) for v1.0 拒绝清单' + textarea id problem (required) + textarea id proposal (required) + textarea id alternatives (optional) + checkboxes id r95-triage 'R9.5 范围蔓延防御 三问 (required)' 3 boxes all required (packaging vs PM problem / NOT wrap of upstream API / NOT one-time escape hatch sufficient) per R9.5 defense against scope creep"
      contains: "Feature Request"
    - path: ".github/ISSUE_TEMPLATE/03-question.yml"
      provides: "W1 T1.3c NEW ~30-35L form-based YAML per RESEARCH § 6.4 verbatim: name: 'Question' + description + title prefix '[Question]: ' + labels [question] + body markdown header 'For getting started, see [docs/MAINTAINER-ONBOARDING.md](../../docs/MAINTAINER-ONBOARDING.md) 30-min Quickstart first' + textarea id question (required) + textarea id tried (optional) + input id harnessed-version (optional placeholder e.g. 0.4.0)"
      contains: "Question"
    - path: ".github/ISSUE_TEMPLATE/config.yml"
      provides: "W1 T1.3d NEW ~12L per RESEARCH § 6.5 verbatim: `blank_issues_enabled: false` (R8.3 80% adoption defender — enforce template usage 100% per § 6.6 sneak block #2) + contact_links [2 entries: (a) name 'Documentation (Onboarding + 30-min Quickstart)' url MAINTAINER-ONBOARDING + about description; (b) name 'Roadmap + v1.0 拒绝清单' url ROADMAP + about description]; cross-link MAINTAINER-ONBOARDING per § 6.6 sneak block #4 enforcement"
      contains: "blank_issues_enabled: false"
    - path: ".github/FUNDING.yml"
      provides: "W1 T1.4a NEW ~3-8L per D-03 LOCKED single tier $1+ Karpathy YAGNI per [CITED: docs.github.com/sponsors] minimum example: 3 lines (2-line header comment Phase 4.2 W1 D-03 LOCKED + minimum example reference + `github: easyinplay` 1-line directive); NO `patreon:` / `open_collective:` / `ko_fi:` / `custom:` keys (D-03 sneak block #1 + #3 enforcement); user manual prerequisite per RESEARCH § 4.2 — Sponsors account activation at github.com/sponsors/easyinplay/dashboard (Pending Approval → Active state; FALLBACK ship FUNDING.yml + badge forward-compatible per RESEARCH § 17.2 U1)"
      contains: "github: easyinplay"
    - path: "README.md (W1 T1.4b + W2 T2.4 combined)"
      provides: "W1 T1.4b L8 Sponsors badge insertion + L190-192 footer Sponsor section EXPAND (combined with W2 T2.4 deliverable per single commit deliverable per RESEARCH § 9.1 W2.T2.4): (a) L8 ADD `[![Sponsor](https://img.shields.io/github/sponsors/easyinplay?logo=github&label=Sponsor)](https://github.com/sponsors/easyinplay)` (planner Discretion #1 TOP + FOOTER both per RESEARCH § 5.1 — shields.io standard dynamic count badge); (b) L190-192 footer Sponsor section EXPAND ~3L → ~7L per RESEARCH § 5.2 verbatim: `已启用 (Phase 4.2 SHIPPED v0.4.0)` literal + badge inline + Sponsors URL link + Co-maintainer 6 月窗口 cross-link to MAINTAINER-ONBOARDING (30 分钟可跑通 dev 环境 per R8.2 验收) + stale-bot 操作 note (90 天无活动 issue/PR 自动关闭) + issue 模板见 .github/ISSUE_TEMPLATE/; (c) W2 T2.4 deliverable: L9 Status freshness Phase 4.2 SHIPPED + v0.4.0 2/3 PROGRESS marker + L48 area MILESTONE row 1/3 → 2/3 + Phase 4.2 row append (sister 5-recurrence terminus D-04 COLLAPSE STATUS_MARKER path延袭); cross-link count: footer 2 occurrences of `sponsors/easyinplay` (badge + Sponsors URL) per § 5.4 sneak block enforcement; Karpathy hard cap ≤200L — README total 196 → 200-201L approaches cap; mitigation hierarchy condense footer 7L → 6L IF breach"
      contains: "sponsors/easyinplay"

    # W2 ship close artifacts (6 项 — sister Phase 4.1 W2 7-task subset; NO ADR + NO A7 iter + NO triple tag)
    - path: ".planning/STATE.md (W2 T2.1)"
      provides: "W2 T2.1 续编 Phase 4.2 SHIPPED event log + 当前位置 块 v0.4.0 2/3 PROGRESS + COMBINED with W0.1 D2 cadence iter 3 (per sister § 8.2): append 已完成 phase ship 历史 16th entry `Phase 4.2 shipped ✅ (2026-05-18) — co-maintainer onboarding + stale-bot + GitHub Sponsors R8.2 + R8.3 + R8.5 anchors (docs/MAINTAINER-ONBOARDING.md EXPAND 50L → ~125-145L D-01 LOCKED additive + .github/FUNDING.yml NEW D-03 single tier + .github/workflows/stale.yml NEW D-02 90-day issue+PR actions/stale@v10 + .github/ISSUE_TEMPLATE/{01-bug,02-feature,03-question}.yml + config.yml 4 NEW form-based + README L8 Sponsors badge + L190-192 footer EXPAND + W0.1 D2 cadence iter 3 institutionalize Phase 4.0+4.1 → RETROSPECTIVE 3rd-iter terminus stable signal + W0.2 conditional SIZE_LIMIT {200→150 FLIP OR 200 DEFER #BA carry Phase 4.3 W0} per § 8.2 decision tree); v0.4.0 milestone 2/3 PROGRESS (next: Phase 4.3 v1.0-RC close R8.1 audit log + R8.4 ADR 全集)`; update 当前位置 block GSD phase chain prepend Phase 4.2 SHIPPED marker (preserve `**Phase 3.4 SHIPPED**` + `**Phase 4.1 SHIPPED**` literal STATE_POSITION_RE anchors for D-04 COLLAPSE freshness gate) + 当前里程碑 v0.4.0 milestone 1/3 → 2/3 PROGRESS + 下一 phase Phase 4.3 plan-phase candidate + 状态 Phase 4.2 SHIPPED + Wave 0+1+2 ship + baseline tag v0.4.0-alpha.2-community LOCAL CREATE (NO push per CLAUDE.md commit safety; user controls); L23 ADD explicit 2-clock disambiguation note '6-month external co-maintainer recruitment window opens post-v0.4.0 ship (organic clock per D-04 HYBRID — SEPARATE from v0.4.0 internal ship timeline)' per R-3 mitigation; STATE.md ≤150L IF W0.2 flip / ≤200L IF W0.2 defer; sister Phase 4.1 W2 T2.1 full 5-step structure 1:1 replicate with content swap"
      contains: "Phase 4.2 shipped"
    - path: ".planning/RETROSPECTIVE.md (W2 T2.2)"
      provides: "W2 T2.2 续编 Phase 4.2 milestone retrospective entry 7-section sister Phase 4.1 W2 T2.2 6-section + bonus Next Phase Prep Notes format 100% reuse (~+30-35L append): § What worked (D-01 EXPAND 50L stub additive preserve 0-rewrite-risk + D-02 90-day issue+PR sister GitHub default convention + D-03 single tier $1+ Karpathy YAGNI 反 pricing-design overhead 诱惑 + D-04 HYBRID 2-clock reconcile pattern for external-dependency phase + W0.1 D2 cadence iter 3 stable 3rd-iter institutionalize terminus signal pattern ≥3-iter) + § What was inefficient (3 NEW .github/ files first-time community-infra surface ~42% weighted avg W1 reuse vs Phase 4.1 W1 ~60% — first community-infra publication phase in project history) + § Patterns established (8-phase 连续 deferred-items → next phase W0 一次根治 cadence + D2 cadence 3rd-iter fires institutionalize confirm ≥3-iter terminus per sister 5-recurrence terminus heuristic) + § Cost patterns (Phase 4.2 内部 phase 1 day cadence延袭 — T3 external dependency = co-maintainer 招募 6-month 真正 clock SEPARATE per D-04 HYBRID — DOES NOT count v0.4.0 ship timeline; **Internal infra ship clock** + **External co-maintainer organic clock** both literal phrases per RESEARCH § 7.3 R-3 mitigation) + § Key lessons ((i) D-01 ADDITIVE EXPAND > FULL REWRITE when stub content quality acceptable; (ii) D-03 single tier $1+ Karpathy YAGNI > multi-tier pre-v1.0 pricing-design overhead; (iii) D-04 HYBRID 2-clock reconcile pattern用于 external-dependency phase institutionalized for v0.5+; (iv) U1 Sponsors account external prereq capture lesson — ship config forward-compatible NOT block on bureaucracy) + § Cross-milestone trends (v0.4.0 第 2 phase 续延 Phase 4.1 同日 1-day cadence延袭 sister 5-phase consecutive 1-day ship streak; W0.1 D2 cadence iter 3 verify stable ≥3-iter terminus signal pattern) + § Next Phase Prep Notes (Phase 4.3 = v1.0-RC close phase R8.1 audit log + R8.4 ADR 全集 + milestone close 3-file archive triplet + 🎯 v0.4.0 milestone close triple tag adr-NNNN-accepted + v0.4.0-alpha.3-audit + 🎯 v0.4.0 sister v0.3.0 close cadence延袭); ALSO receives W0.1 D2 auto-archive Phase 4.0+4.1 narrative section (combined per sister § 8.2)"
      contains: "Phase 4.2"
    - path: ".planning/ROADMAP.md (W2 T2.3)"
      provides: "W2 T2.3 MODIFY: L216-218 area Phase 4.2 entry mark ✅ SHIPPED (2026-05-18) + brief outcome summary (sister Phase 4.1 L210-215 verbose 5-bullet format延袭 — 4 D-decisions activated 闭环 + R8.2/R8.3/R8.5 acceptance bar satisfied + W0 backlog 1 项 conditional + 4 D-decisions LOCKED); update v0.4.0 milestone progress L185 1/3 → 2/3 PROGRESS (NOT yet 3/3 ARCHIVED — reserved Phase 4.3 close per sister L38 v0.1.0 + L58 v0.2.0 + L130 v0.3.0 SHIPPED ARCHIVED literal cadence延袭); add inline note L185 area '(2-3 周 internal ship clock 已验证 Phase 4.1+4.2 ≤1 day each; external co-maintainer 6-month organic clock SEPARATE per D-04 HYBRID — runs Phase 4.3 close through v0.5)' per R-3 mitigation; add Phase 4.3 next phase kickoff reference (R8.1 audit log + R8.4 ADR 全集 + v1.0-RC close per CONTEXT carry); sister Phase 4.1 W2 T2.3 1:1 replicate with content swap"
      contains: "Phase 4.2.*SHIPPED"
    - path: "README.md (W2 T2.4 — combined with W1 T1.4b Sponsors badge + footer)"
      provides: "W2 T2.4 MODIFY: L9 Status freshness header update Phase 4.2 SHIPPED + v0.4.0 2/3 PROGRESS (sister 5-recurrence terminus D-04 COLLAPSE STATUS_MARKER path延袭); L48 area MILESTONE row v0.4.0 1/3 → 2/3 (NOT yet 3/3 ARCHIVED); add Phase 4.2 entry to shipped phase list (sister Phase 4.1+3.4+3.3+3.2+3.1 row pattern延袭); COMBINED with W1 T1.4b deliverable: L8 Sponsors badge insertion + L190-192 footer Sponsor section EXPAND per single commit deliverable; freshness gate post-MODIFY pass (node scripts/check-transparency-verdicts.mjs exit 0 — STATE_POSITION_RE OR-fallback for Phase 4.2 SHIPPED literal); sister Phase 4.1 W2 T2.4 1:1 replicate; README total 196 → 200-201L approaches ≤200L hard cap; mitigation condense footer IF breach"
      contains: "Phase 4.2"
    - path: "PROJECT-SPEC.md (W2 T2.5)"
      provides: "W2 T2.5 MODIFY: L3 Status header add Phase 4.2 SHIPPED literal (sister Phase 4.1 W2 T2.5 + Phase 3.4 W2 T2.6 FRONT_MATTER_DOCS transparency gate pattern延袭) + L6 area 下一步 Phase 4.3 candidate; freshness gate post-MODIFY pass"
      contains: "Phase 4.2"
    - path: ".planning/phase-4.2/DOGFOOD-T2.X.md (W2 T2.7)"
      provides: "W2 T2.7 NEW ~55-60L 3-axis empirical evidence sister Phase 4.1 DOGFOOD-T2.X.md 58L format 100% reuse (Date + Verdict header + 3 Axis sections + Aggregate verification + Disposition): Axis A docs/MAINTAINER-ONBOARDING.md EXPAND verify D-01 — `wc -l` ≥100 ≤150 + `grep -c '^## '` ≥ 12 (preserve 8 + add 6) + 6 NEW section literal grep (Dev environment + Commit conventions + ADR review + Cross-OS CI + Manifest schema + Upstream drift); Axis B `.github/` NEW infra cluster verify D-02 + D-03 + supporting infra — `test -f .github/FUNDING.yml` + `grep '^github: easyinplay'` + `test -f .github/workflows/stale.yml` + `grep 'actions/stale@v10'` (NOT @v9 per R2 finding) + `grep -E 'days-before-(issue|pr)-(stale|close)'` 4 matches + `ls .github/ISSUE_TEMPLATE/*.yml | wc -l` ≥ 4 + `grep 'blank_issues_enabled: false' config.yml`; Axis C README Sponsors badge + footer + D-04 HYBRID 2-clock process verify R-3 mitigation — `grep 'img.shields.io/github/sponsors/easyinplay' README.md` + `grep -c 'sponsors/easyinplay' README.md` ≥ 2 + STATE.md L23 grep '6-month external' literal + RETRO § Cost patterns grep 'Internal infra ship clock' + 'External co-maintainer organic clock' both literal; PLUS T2.6 ci.yml VERIFY 0 diff sneak-block — `git diff HEAD .github/workflows/ci.yml | wc -l = 0` + `grep -c 'stale|FUNDING|sponsors' .github/workflows/ci.yml = 0` (NO A7 iter Phase 4.2 = community infra publish NOT architectural decision; .github/workflows/stale.yml is SEPARATE new workflow file NOT ci.yml step insert); PASS verdict header `PASS 3/3 dogfood axes verified, miss: none`; Axis C explicit external prereq note 'Sponsors button render on repo page requires user manual Sponsors account activation at github.com/sponsors/easyinplay/dashboard (Pending Approval → Active state); Phase 4.2 ships config + DOGFOOD verifies infra NOT button render' per RESEARCH § 4.2 + § 13.2; Karpathy ≤60L sister Phase 4.1 DOGFOOD 58L precedent"
      contains: "PASS"

  key_links:
    # W0 path dep chain (W0.1 → W0.2)
    - from: ".planning/STATE.md (post-W0.1 trim ≤140L expected ~135-140L per § 8.3 projection)"
      to: "scripts/check-state-archive-stale.mjs L12 SIZE_LIMIT 200→150 conditional flip"
      via: "Decision tree per sister § 8.2: post-trim STATE ≤140L → flip safe (10L headroom maintained for Phase 4.2 ship 续编 + future churn); 141-150L → defer flip (insufficient headroom; DEFERRED #BA carry-forward Phase 4.3 W0 LOW priority — sister Phase 4.1 W0.5 DEFER path precedent active); >150L → flip blocked + investigate W0.1 trim sufficiency (re-evaluate D2 cadence pattern adequacy)"
      pattern: "SIZE_LIMIT = 150"
    - from: ".planning/RETROSPECTIVE.md (W0.1 archive section)"
      to: ".planning/STATE.md (post-trim HTML-comment archive marker pointer)"
      via: "Sister L27 verified format `<!-- Phase X.Y + Z.A narrative archived to RETROSPECTIVE.md § ARCHIVED FROM STATE — Phase X.Y+Z.A (... timestamp ...) -->` left in STATE.md trim site; reviewer grep verify pointer present + RETROSPECTIVE additions match STATE deletions 1:1 verbatim (sister § 8.5 sneak block: MUST verbatim relocate NO content rewriting); section header literal preserves Phase 4.0+4.1 per sister Phase 4.1 W0 T0.1 cadence affirm L640 (R-4 cadence consistency mitigation; Phase 4.0 absence disambiguated in content body footer note)"
      pattern: "ARCHIVED FROM STATE — Phase 4.0+4.1"

    # W1 main scope key_links (D-01 EXPAND + D-02 stale-bot + D-03 Sponsors infra + D-04 process-level)
    - from: "docs/MAINTAINER-ONBOARDING.md 6 NEW sections"
      to: "CONTRIBUTING.md L1-200 existing dev-setup precedent"
      via: "D-01 sneak block #3 Karpathy DRY 'reference don't duplicate' — Section A Dev Environment Quickstart cross-link `[CONTRIBUTING.md](../CONTRIBUTING.md) § Prerequisites + § Setup` NOT recopy; Section B Commit Convention Reference cross-link CONTRIBUTING.md Commit Message 格式 NOT recopy; Section C ADR Review Checklist cross-link CONTRIBUTING.md ADR 写作规则 NOT recopy; planner W1 T1.1 grep verify 'CONTRIBUTING.md' occurrence count ≥ 3 in NEW sections; reviewer audit no full prose duplication"
      pattern: "CONTRIBUTING.md"
    - from: ".github/workflows/stale.yml actions/stale@v10 pin"
      to: "R8.3 spec verbatim '90 天无活动 issue auto-close' + CONTEXT D-02 'mark stale at day 60 → close at day 90'"
      via: "D-02 LOCKED 60+30 split semantic: `days-before-issue-stale: 60` (day 60 mark stale + warning comment) + `days-before-issue-close: 30` (30 more days = day 90 close) → net 90-day total matches R8.3 spec; `days-before-pr-stale: 60` + `days-before-pr-close: 30` parallel for PR scope per D-02 sneak block #3 BOTH issue + PR scope; R2 § 2 finding correction MANDATORY: pin `actions/stale@v10` (v10.2.0 Feb 2026 current per [VERIFIED: github.com/actions/stale README]) NOT `@v9` outdated per CONTEXT D-02 reference; reviewer grep `actions/stale@v10` exit 0 + `! grep 'actions/stale@v9'` (no @v9 sneak)"
      pattern: "actions/stale@v10"
    - from: ".github/FUNDING.yml `github: easyinplay`"
      to: "README.md L8 Sponsors badge URL `https://github.com/sponsors/easyinplay`"
      via: "D-03 LOCKED single-line config; badge shields.io URL `https://img.shields.io/github/sponsors/easyinplay?logo=github&label=Sponsor` auto-pulls dynamic count from FUNDING.yml `github:` key (zero maintenance per Karpathy YAGNI); user manual prerequisite per RESEARCH § 4.2 (Sponsors account activation Pending Approval → Active state at github.com/sponsors/easyinplay/dashboard); planner W1 T1.4 acceptance grep `^github: easyinplay` exit 0 + `grep 'sponsors/easyinplay' README.md` ≥ 2 (badge + footer); FALLBACK accepted per RESEARCH § 17.2 U1 ship FUNDING.yml + badge forward-compatible IF user account NOT yet Active by Phase 4.2 ship"
      pattern: "github: easyinplay"
    - from: "Phase 4.2 ship process semantics (D-04 HYBRID 2-clock)"
      to: ".planning/STATE.md L23 + .planning/RETROSPECTIVE.md § Cost patterns explicit 2-clock language"
      via: "D-04 verification at process-level NOT artifact-level per CONTEXT D-04 L37 + RESEARCH § 7.3 R-3 mitigation: STATE.md L23 ADD explicit '6-month external co-maintainer recruitment window opens post-v0.4.0 ship (organic clock per D-04 HYBRID — SEPARATE from v0.4.0 internal ship timeline)' + RETROSPECTIVE.md § Cost patterns L4 ADD '**Internal infra ship clock** 1 phase/day verified Phase 4.1 + Phase 4.2; **External co-maintainer organic clock** 6-month organic — OPENS post-v0.4.0 close runs through v0.5/v1.0' both literal phrases per § 7.3 enforcement; planner W2 T2.1 + T2.2 explicit language template; reviewer grep both literal phrases pre-commit; sneak block守门: NO 'FROZEN 6-month' literal + NO 'ACCELERATED 2-week external PR expect' literal"
      pattern: "External co-maintainer organic clock"

    # W2 ship close key_links (sister Phase 4.1 W2 5-doc 续编 + DOGFOOD + tag cadence)
    - from: "Phase 4.2 W2 ship cycle (6 atomic tasks + DOGFOOD + single baseline tag)"
      to: "v0.4.0 milestone 2/3 PROGRESS (NOT close — Phase 4.3 reserved)"
      via: "Sister Phase 4.1 W2 T2.1-T2.5 + T2.7 cadence subset (NO ADR 0018 + NO A7 iter ci.yml + NO milestone close — 4-doc 续编 + DOGFOOD + 1-tag subset); 6 atomic + 1 DOGFOOD vs sister 7 task; NO 🎯 v0.4.0 milestone tag (reserved Phase 4.3 close per sister v0.3.0 close cadence延袭 — 3 alpha tags + final milestone tag triple-push); single baseline tag `v0.4.0-alpha.2-community` LOCAL CREATE only (NO push per CLAUDE.md commit safety; user controls all commit + tag push)"
      pattern: "v0.4.0-alpha.2-community"
    - from: ".planning/phase-4.2/DOGFOOD-T2.X.md (W2 T2.7 NEW)"
      to: "3-axis empirical evidence PASS 3/3 + R8.2/R8.3/R8.5 acceptance bar"
      via: "Sister Phase 4.1 DOGFOOD-T2.X.md 58L 3-axis format 100% reuse (Date + Verdict + 3 Axis sections + Aggregate verification + Disposition); axes ADAPT: (A) MAINTAINER-ONBOARDING.md EXPAND 100-150L + 6 NEW section literal verify (B) .github/ NEW infra cluster — FUNDING.yml + stale.yml actions/stale@v10 60+30 split + 4 ISSUE_TEMPLATE yml files + blank_issues_enabled false (C) README Sponsors badge URL valid + footer 2-cross-link + D-04 HYBRID 2-clock STATE.md L23 + RETRO § Cost patterns process-level verify + T2.6 ci.yml VERIFY 0 diff sneak-block + external prereq note (Sponsors account activation user manual); verify ALL 3 axes PASS pre-ship; Karpathy ≤60L sister Phase 4.1 DOGFOOD 58L precedent"
      pattern: "PASS 3/3"

risk_notes:
  # 5 latent risks acknowledged + accepted per PATTERNS § 5 R-1~R-5 (CONTEXT § Discretion + path dep)
  - id: R-1
    risk: D-01 EXPAND content quality risk — existing 50L stub is "v0.1 placeholder" quality (per stub L2 explicit marker); D-01 sneak block #1 "preserve existing 6+2 sections verbatim" may force-preserve sub-optimal v0.1 phrasing in §「目标」+ §「招募窗口」+ §「Co-maintainer 角色定位」
    severity: MED
    mitigation: per RESEARCH § 2.1 minor wording polish allowed within D-01 ADDITIVE EXPAND scope NOT full rewrite (Status L1-4 update v0.1 → v0.4 activated marker + 招募窗口 L10-14 update 启动 v0.4 ship 实际 NOT future + v0.4 启动前 TODO L33-39 check off Sponsors ✓ + stale-bot ✓ + issue template ✓ delivered Phase 4.2 W1); planner Discretion #5 (CONTEXT § Open Q L59) explicit verify v0.1 stub quality + decide section reorder
    acceptance: documented inline + task T1.1 ADDITIVE EXPAND acceptance criterion `git diff docs/MAINTAINER-ONBOARDING.md` shows existing sections L1-50 with minimal updates ONLY (TODO check-off + Status version bump + 招募窗口 启动 marker)
  - id: R-2
    risk: NEW `.github/` surface no project precedent (3 NEW yml files first-time community-infra inhabitants); schema validation surface untested (GitHub Issue Forms schema may evolve + actions/stale schema may differ from documented)
    severity: LOW
    mitigation: per RESEARCH § 1.1 + § 3.1 + § 6.1-6.5 + § 4.1 — schemas verified via [CITED: docs.github.com/sponsors] + [CITED: docs.github.com/communities] + [VERIFIED: github.com/actions/stale README v10.2.0 Feb 2026]; planner W1 T1.2 + T1.3 + T1.4 acceptance — verify YAML parses via local `yq eval` check pre-commit OR review PR preview render; FALLBACK ship config + GitHub server-side validation catches malformed YAML at PR-time
    acceptance: documented inline + task T1.2 + T1.3 + T1.4 schema verify per file
  - id: R-3
    risk: D-04 HYBRID 2-clock semantics in ship docs (process-level invariant verify) — ship docs may inadvertently conflate "Phase 4.2 ship completes 6-month external clock start" or "v0.4.0 milestone close requires external PR within 6-month"; both would violate D-04 sneak blocks
    severity: MED
    mitigation: per RESEARCH § 7.3 + PATTERNS § 5 R-3 — explicit 2-clock reconcile language MUST appear in STATE.md L23 'Internal infra ship clock' + 'External co-maintainer organic clock' both literal + RETROSPECTIVE.md § Cost patterns L4 both literal phrases + ROADMAP.md L185 inline note '2-3 周 internal ship clock 已验证 Phase 4.1+4.2 ≤1 day each; external co-maintainer 6-month organic clock SEPARATE per D-04 HYBRID — runs Phase 4.3 close through v0.5'; planner W2 T2.1 + T2.2 + T2.3 explicit language template; DOGFOOD W2 T2.7 Axis C process-level verify
    acceptance: documented inline + task T2.1 + T2.2 + T2.7 explicit grep verify both literal phrases
  - id: R-4
    risk: Phase 4.0 absence in D2 cadence section header (cadence consistency vs literal accuracy tension) — sister Phase 4.1 W0 T0.1 cadence affirm L640 explicitly states "Next § ARCHIVED FROM STATE — Phase 4.0+4.1 will be created by Phase 4.2 ship-time per D2 standing process cadence iter 3" but Phase 4.0 doesn't exist (Phase numbering skip from Phase 3.4 → Phase 4.1)
    severity: LOW
    mitigation: per PATTERNS § 5 R-4 + § 1 row 1 — section header literal preserves "Phase 4.0+4.1" per sister cadence affirm (cadence consistency); content body single-phase Phase 4.1 + explicit footer note "Phase 4.0 was a numeric placeholder NOT a real shipped phase; Phase 4.1 narrative archived solo per single-phase iter 3 archive" — preserves D2 cadence naming convention without literal accuracy compromise; planner W0 T0.1 + W2 T2.1 explicit footer disambiguation note
    acceptance: documented inline + task T0.1 acceptance — grep `ARCHIVED FROM STATE — Phase 4.0+4.1` section header AND content body footer "Phase 4.0 was a numeric placeholder" both present
  - id: R-5
    risk: PATTERNS § 5 latent risk #3 — triple tag sneak (Phase 4.2 NOT milestone close phase; ONLY single baseline tag `v0.4.0-alpha.2-community` per CONTEXT § Discretion #4 explicit; sister Phase 3.4 W2 T2.12 triple-tag = milestone close pattern NOT applicable Phase 4.2)
    severity: LOW
    mitigation: PLAN.md frontmatter explicit single tag only; W2 T2.7 DOGFOOD axis verify `git tag --list 'v0.4.0-alpha.2-community' | wc -l` == 1 (NOT 3); reviewer grep verify no `🎯` milestone close tag (reserved Phase 4.3); NO ADR 0018 (R8.4 ADR 全集 deferred Phase 4.3 per Deferred Ideas); NO ci.yml A7 iter (ADR count unchanged Phase 4.2)
    acceptance: task T2.7 single tag creation only (LOCAL no push per CLAUDE.md); 3 NO 守门 (NO ADR 0018 + NO ci.yml A7 iter + NO triple tag)

acceptance_criteria:
  # F1-F8 per sister Phase 4.1 cadence — Phase 4.2 acceptance bar
  F1: "docs/MAINTAINER-ONBOARDING.md EXPAND ~125-145L D-01 LOCKED additive (≥100L AND ≤150L hard cap per CLAUDE.md docs convention); preserve existing 6+2 sections verbatim per D-01 sneak block #3 (Status / 目标 / 招募窗口 / Co-maintainer 角色定位 / 必读文档 / v0.4 启动前 TODO / 风险 / References); 6 NEW sections ADDED (A Dev environment + B Commit conventions + C ADR review + D Cross-OS CI + E Manifest schema + F Upstream drift) inserted between 必读文档 (L31) and v0.4 启动前 TODO (L33); section count post-expand ≥ 12 (8 existing + 6 NEW = 14); NO split into multiple files (single SoT D-01 sneak #1 enforcement)"
  F2: ".github/workflows/stale.yml NEW ~45L D-02 LOCKED actions/stale@v10 recipe (NOT @v9 per R2 § 2 finding correction); 60+30 split semantic 90-day total (days-before-issue-stale 60 + days-before-issue-close 30 + days-before-pr-stale 60 + days-before-pr-close 30 — issue+PR scope per D-02 sneak block #3); permissions block scoped issues:write + pull-requests:write minimal (STRIDE E mitigation); exempt-issue-labels defensive list (STRIDE D mitigation); operations-per-run 30 rate limit (STRIDE D mitigation); cron daily 1:30 UTC actions/stale README default (planner Discretion #2); NO @v9 sneak (R2 finding correction)"
  F3: ".github/ISSUE_TEMPLATE/ 4 NEW yml files D-03 supporting infra per planner Discretion #3 yml form-based (NOT classical .md per [CITED: docs.github.com/communities] 2026 best practice): 01-bug.yml ~55-60L (OS dropdown + Node version + harnessed version + reproduce/expected/actual + DO NOT credentials warning STRIDE I mitigation + labels [bug, triage]) + 02-feature.yml ~40-45L (problem/proposal/alternatives + R9.5 三问 checkboxes 范围蔓延 defense + labels [enhancement, triage]) + 03-question.yml ~30-35L (header redirect MAINTAINER-ONBOARDING + labels [question]) + config.yml ~12L (blank_issues_enabled: false R8.3 80% adoption defender + 2 contact_links MAINTAINER-ONBOARDING + ROADMAP)"
  F4: ".github/FUNDING.yml NEW ~3-8L D-03 LOCKED `github: easyinplay` single-line per [CITED: docs.github.com/sponsors] minimum example; NO multi-tier pricing (D-03 sneak block #1) + NO `custom:` array URL (D-03 sneak block #3); ≤8L Karpathy YAGNI hard; user manual prerequisite acknowledged per RESEARCH § 4.2 (Sponsors account activation external; FALLBACK ship config forward-compatible per RESEARCH § 17.2 U1)"
  F5: "README.md MODIFY (combined W1 T1.4b + W2 T2.4): L8 Sponsors badge `[![Sponsor](https://img.shields.io/github/sponsors/easyinplay?logo=github&label=Sponsor)](https://github.com/sponsors/easyinplay)` insertion + L190-192 footer Sponsor section EXPAND ~7L (D-03 sneak block enforcement footer 2-cross-link); L9 Status freshness Phase 4.2 SHIPPED + v0.4.0 2/3 + L48 area MILESTONE row 1/3 → 2/3 + Phase 4.2 row append (sister 5-recurrence terminus D-04 COLLAPSE STATUS_MARKER path延袭); README total ≤ 200L hard cap (per CLAUDE.md sister 6-phase 连续 hold; mitigation hierarchy condense footer IF breach); freshness gate `node scripts/check-transparency-verdicts.mjs` exit 0 post-MODIFY"
  F6: "W0 absorb complete: W0.1 D2 cadence iter 3 STATE.md Phase 4.1 narrative → RETROSPECTIVE.md verbatim (institutionalize verify 3rd-iter terminus stable signal ≥3-iter per sister 5-recurrence terminus heuristic) + W0.2 CONDITIONAL D1 SIZE_LIMIT tighten — IF STATE post-W0.1 ≤140L → flip 200→150 / OTHERWISE DEFER #BA carry Phase 4.3 W0 LOW priority (sister Phase 4.1 W0.5 DEFER path precedent); pre-flight `node scripts/check-state-archive-stale.mjs` exit 0 with ENFORCE=true (Phase 4.1 already shipped) + new SIZE_LIMIT baseline post-flip; STATE.md post-W0.1-trim + W2 T2.1 续编 final ≤150L (W0.2 flip path) OR ≤200L (W0.2 defer path); L23 explicit 2-clock disambiguation note per R-3 mitigation; 4 W2 docs sync: ROADMAP L216-218 Phase 4.2 ✅ SHIPPED + L185 v0.4.0 2/3 + D-04 HYBRID inline note + Phase 4.3 next reference + README L9 + L48 + PROJECT-SPEC L3 + L6 all docs sync"
  F7: ".planning/phase-4.2/DOGFOOD-T2.X.md NEW ~55-60L PASS 3/3 axes verified (Axis A MAINTAINER-ONBOARDING EXPAND 100-150L + 6 NEW section literal grep + Axis B `.github/` NEW infra cluster 5+ files actions/stale@v10 pinned + blank_issues_enabled false + Axis C README Sponsors badge URL valid + footer 2-cross-link + D-04 HYBRID 2-clock process-level grep STATE.md L23 + RETRO § Cost patterns both literal phrases + T2.6 ci.yml VERIFY 0 diff sneak-block); sister Phase 4.1 DOGFOOD-T2.X.md 58L format 100% reuse; explicit external prereq note Axis C (Sponsors account activation user manual; Phase 4.2 ships config + DOGFOOD verifies infra NOT button render per RESEARCH § 4.2)"
  F8: "Single baseline tag `v0.4.0-alpha.2-community` LOCAL CREATE only (NO push per CLAUDE.md commit safety; user controls all commit + tag push); NO 🎯 v0.4.0 milestone close tag (reserved Phase 4.3); NO ADR 0018 / NO A7 iter ci.yml (PATTERNS § 5 R-5 mitigation; sister Phase 4.1 cadence延袭 NO triple tag); STRIDE 7-node threats all mitigated per `<threats_open>` block above; biome preempt verified pre-W0.2 commit IF FLIP path active (scripts/check-state-archive-stale.mjs `.mjs` touched per project memory `feedback_biome-preempt.md`)"
---

<objective>
Phase 4.2 ship **v0.4.0 milestone 2nd phase / R8.2 + R8.3 + R8.5 community infra anchor** — single PLAN.md + single task_plan.md ~12-14 atomic tasks across W0 (2 backlog absorb conditional) + W1 (5-6 main scope community infra) + W2 (6 ship close + DOGFOOD + tag) per sister Phase 4.1 1116L task_plan + 519L PLAN structure 100% template reuse (adapted Phase 4.2 community-infra-publish scope; 78% reuse weighted ~7-point lower vs Phase 4.1 due 3 NEW `.github/` first-time community-infra surface).

## Wave 0 — Backlog 2 项 absorb conditional (path dep STRICT W0.1 → W0.2):

**8-phase 连续 "deferred-items → next phase W0 一次根治" cadence 8th phase 沿袭** (Phase 2.3 → 2.4 → 3.1 → 3.2 → 3.3 → 3.4 → 4.1 → 4.2): **T0.1 W0.1 D2 cadence iter 3 trim Phase 4.1 narrative → RETROSPECTIVE.md § ARCHIVED FROM STATE — Phase 4.0+4.1** (sister Phase 4.1 W0.3 1st-implementation → 2nd-iter institutionalize → Phase 4.2 3rd-iter terminus stable signal pattern per ≥3-iter heuristic; section header literal preserved per sister cadence affirm L640 + content body Phase 4.1 single-phase disambiguation per R-4 mitigation; FIRST per path dep — reduces STATE.md 151L → ~135-140L expected creating SIZE_LIMIT=150 headroom for W0.2 conditional flip) + **T0.2 W0.2 CONDITIONAL D1 SIZE_LIMIT 200→150 round 2 tighten** (1-line surgical `scripts/check-state-archive-stale.mjs` L12 IF W0.1 trim outcome holds STATE ≤140L; OTHERWISE DEFER #BA carry-forward Phase 4.3 W0 LOW priority per § 8.2 decision tree; sister Phase 4.1 W0.5 DEFER path precedent active — Phase 4.2 may FLIP if W0.1 trim provides ≥10L headroom).

## Wave 1 — Main scope community infra (5-6 atomic — Phase 4.2 anchors R8.2 + R8.3 + R8.5):

**`.github/` NEW surface inauguration + docs/MAINTAINER-ONBOARDING EXPAND** (3 NEW `.github/` infra + 1 EXPAND docs + 1 README badge+footer): **T1.1 `docs/MAINTAINER-ONBOARDING.md` EXPAND 50L → ~125-145L D-01 LOCKED additive** (preserve existing 6+2 sections verbatim per D-01 sneak block #3 + ADD 6 NEW sections A-F per § 2.2 ordering R8.2 30-min quickstart spec; Karpathy hard cap ≤150L docs convention) + **T1.2 `.github/workflows/stale.yml` NEW ~45L D-02 LOCKED actions/stale@v10 recipe** (per R2 § 2 finding correction NOT @v9 outdated; 60+30 split 90-day total per R8.3 spec; issue+PR scope; STRIDE E + D mitigation) + **T1.3 `.github/ISSUE_TEMPLATE/` 4 NEW yml files** (01-bug.yml + 02-feature.yml + 03-question.yml + config.yml per planner Discretion #3 yml form-based per [CITED: docs.github.com/communities] 2026 best practice; R9.5 三问 范围蔓延 defense + STRIDE I mitigation) + **T1.4 `.github/FUNDING.yml` NEW ~3-8L D-03 LOCKED + README L8 Sponsors badge + L190-192 footer EXPAND** (planner Discretion #1 TOP + FOOTER both per RESEARCH § 5.1; single tier $1+ Karpathy YAGNI; user manual prereq Sponsors account activation per RESEARCH § 4.2 — FALLBACK forward-compatible).

## Wave 2 — Ship close (5-6 atomic + DOGFOOD + tag — sister Phase 4.1 W2 cadence subset; NO ADR + NO A7 iter + NO triple tag per PATTERNS § 5 R-5 mitigation):

**sister Phase 4.1 W2 T2.1-T2.5 + T2.7 cadence 6-task subset (NO milestone close)**: **T2.1 STATE.md 续编 Phase 4.2 SHIPPED + 当前位置 update + L23 2-clock disambiguation note** (combined with W0.1 D2 cadence iter 3 archive sub-step per sister § 8.2 + R-3 mitigation explicit 'Internal infra ship clock' + 'External co-maintainer organic clock' literal) + **T2.2 RETROSPECTIVE.md 续编 Phase 4.2 milestone retrospective 7-section + receive W0.1 D2 auto-archive** (sister Phase 4.1 W2 T2.2 6-section + bonus Next Phase Prep Notes format 100% reuse; include D-04 HYBRID 2-clock lesson + U1 Sponsors account external prereq capture) + **T2.3 ROADMAP.md L216-218 Phase 4.2 ✅ SHIPPED + v0.4.0 2/3 PROGRESS marker + L185 inline 2-clock note** + **T2.4 README.md L9 Status freshness + L48 MILESTONE row v0.4.0 2/3 + Phase 4.2 row append + L8 Sponsors badge + L190-192 footer EXPAND** (combined per single commit deliverable) + **T2.5 PROJECT-SPEC.md L3 Status header Phase 4.2 SHIPPED literal + L6 下一步 Phase 4.3** + **T2.6 ci.yml VERIFY 0 diff sneak-block + grep stale|FUNDING|sponsors = 0** (sister Phase 4.1 W2 T2.6 reuse — verify-only NO commit; NO A7 iter Phase 4.2 = community infra publish NOT architectural decision) + **T2.7 `.planning/phase-4.2/DOGFOOD-T2.X.md` NEW PASS 3/3 axes + single baseline tag `v0.4.0-alpha.2-community` LOCAL CREATE** (sister Phase 4.1 DOGFOOD-T2.X.md 58L format 100% reuse; NO push per CLAUDE.md commit safety; user controls). **N/A** sister Phase 3.4 W2 T2.1 ADR / T2.2 ci.yml A7 iter / T2.8 milestones/v0.4.0-ROADMAP archive / T2.9 milestones/v0.4.0-REQUIREMENTS archive / T2.10 milestones/v0.4.0-MILESTONE-AUDIT inaugurate / T2.12 triple tag push (Phase 4.2 single tag local-only per PATTERNS § 5 R-5).

**Purpose**: Phase 4.2 = v0.4.0 milestone 2nd of 3 phases (Phase 4.3 R8.4 ADR 全集 + 路由透明度日志 audit.log + v1.0-RC 收尾 + milestone close in scope; Phase 4.2 R8.2 + R8.3 + R8.5 anchors only per CONTEXT scope); W0 8-phase consecutive backlog absorb cadence 一次根治 (DEFERRED #BA conditional resolve + sister M2 D2 institutionalize verify 3rd-iter terminus stable ≥3-iter); W1 main scope inaugurates `.github/` NEW surface (was only `workflows/ci.yml + perf-bench.yml`) with 3 NEW community-infra yml files + 4 NEW issue templates + docs/MAINTAINER-ONBOARDING.md EXPAND additive preserving v0.1 stub; W2 narrower 5-task subset vs sister Phase 3.4 W2 11-task (no NEW ADR + no milestone close + no architectural surface change — pure community-infra publish phase).

**Output**: 12-14 atomic task across 3 wave (2 + 5-6 + 6-7 = 12-14; sister Phase 4.1 14 atomic 85-100% scope factor per RESEARCH § 16) — task_plan.md 含完整 per-task 三件套 `<read_first>` + `<acceptance_criteria>` + `<action>` + `<decision_source>` blocks; sister Phase 4.1 task_plan.md 1116L 14-atomic structure 100% template reuse + adapt per W0/W1/W2 community-infra-publish scope.

> **R2 critical finding absorbed** (4 项): (1) **`actions/stale@v10` current MANDATORY** (RESEARCH § 0 + § 3.1 [VERIFIED: github.com/actions/stale README v10.2.0 Feb 2026] — CONTEXT D-02 `@v9` reference OUTDATED; planner LOCK `@v10` in T1.2 acceptance + DOGFOOD Axis B verify); (2) **`.github/` baseline empty community-infra** (RESEARCH § 1.1 + bash ls verified — Phase 4.2 W1 inaugurates 5 NEW files NEW surface; only `workflows/ci.yml + perf-bench.yml` exist pre-Phase-4.2); (3) **MAINTAINER-ONBOARDING.md 50L 8-section verified verbatim** (RESEARCH § 1.2 + bash wc -l + L1-50 verbatim — D-01 ADDITIVE EXPAND target preserves all 8 sections; § 2.1 section preservation map explicit); (4) **STATE.md 151L baseline (#BA conditional flip pre-trim)** (RESEARCH § 1.3 + bash wc -l — W0.1 trim expected ~135-140L → W0.2 FLIP safe HIGH confidence per § 8.3 projection ≤140L threshold).

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
@.planning/phase-4.2/4.2-KICKOFF.md
@.planning/phase-4.2/4.2-CONTEXT.md
@.planning/phase-4.2/PATTERNS.md
@.planning/phase-4.2/RESEARCH.md

# Frozen interface contracts (本 phase Wave 0+1+2 consume + MODIFY 来源)
@docs/MAINTAINER-ONBOARDING.md
@scripts/check-state-archive-stale.mjs
@scripts/check-transparency-verdicts.mjs
@.github/workflows/ci.yml
@CONTRIBUTING.md
@README.md
@PROJECT-SPEC.md

# Sister precedent (format gold-standard)
@.planning/phase-4.1/PLAN.md
@.planning/phase-4.1/task_plan.md
@.planning/phase-4.1/deferred-items.md
@.planning/phase-4.1/DOGFOOD-T2.X.md
@.planning/phase-3.4/PLAN.md
@.planning/phase-3.4/DOGFOOD-T2.X.md
@.planning/milestones/v0.3.0-MILESTONE-AUDIT.md
</context>

<interfaces>
<!-- Key types/contracts the executor needs (extracted from codebase per planner-format) -->

From scripts/check-state-archive-stale.mjs L10-14 (Phase 4.1 W0.1 ship ENFORCE=true round 2; Phase 4.2 W0.2 CONDITIONAL SIZE_LIMIT flip target):
```javascript
const ENFORCE = true // Phase 4.1 W0.1 flip round 2 — sister transparency gate Phase 2.2 W0 cadence延袭 (DEFERRED #AF RESOLVED 2026-05-18)
const STATE_PATH = '.planning/STATE.md'
const SIZE_LIMIT = 200 // round 1; tighten to 150 v0.4 per DEFERRED #AG → Phase 4.2 W0.1 re-eval per #BA carry
const KEY_DECISIONS_SECTION_LIMIT = 1
const HISTORICAL_ERRATA_RE = /W-[1-9]\s+errata|sister\s+review\s+M[1-9]\s+修正/
```

W0.2 conditional flip target (Phase 4.2 1-line surgical IF post-W0.1 STATE ≤140L; otherwise defer #BA carry Phase 4.3 W0):
```javascript
const SIZE_LIMIT = 150 // Phase 4.2 W0.2 round 2 tighten — sister DEFERRED #BA resolve (W0.1 trim outcome STATE post-trim ≤140L verified pre-flip; Phase 4.1 W0.5 DEFER path resolved)
```

From .planning/STATE.md L22-43 + L42 archive marker pointer (W0.1 trim targets — Phase 4.1 narrative scope):
```markdown
- **GSD phase**: ✅ **Phase 4.1 SHIPPED**（2026-05-18 — ...）+ 前置 ✅ **Phase 3.4 SHIPPED**（2026-05-17 ...）— ...
- **当前里程碑**：**v0.4.0 dogfooding benchmark + 稳定期 1/3 PROGRESS**...
- **下一 phase**：**Phase 4.2 plan-phase 启动**...
- **状态**：✅ **Phase 4.1 SHIPPED — Wave 0+1+2 全 ship 2026-05-18** — docs/benchmarks/v0.4.md NEW 302L D-02 FULL ...
- **进度**：15 / 17 phases 已完成 ... 88.2%（... v0.4.0 里程碑 1/3 PROGRESS — Phase 4.1 ✅）

<!-- Phase 3.3 + 3.4 narrative archived to RETROSPECTIVE.md § ARCHIVED FROM STATE — Phase 3.3+3.4 (2026-05-18 Phase 4.1 W0.3 D2 cadence iter 2 ...) -->
- **Phase 4.1 shipped** ✅ (2026-05-18) — dogfooding benchmark 数据采集 ... (Phase 4.2 W0.1 trim target — verbatim relocate)
- **Phase 3.4 shipped** ✅ (2026-05-17) — ... (sister 1-line pointer; preserve)
```

W0.1 Phase 4.2 mirror format (insert at trimmed sites per sister Phase 4.1 W0 T0.1 L27 verbatim):
```markdown
<!-- Phase 4.0 + 4.1 narrative archived to RETROSPECTIVE.md § ARCHIVED FROM STATE — Phase 4.0+4.1 (2026-05-18 Phase 4.2 W0.1 D2 cadence iter 3 per standing process — M2 backlog discharge institutionalize verify 3rd-iter terminus stable ≥3-iter pattern signal beyond 2nd-iter; Phase 4.0 was numeric placeholder NOT real shipped phase — Phase 4.1 single-phase archive per R-4 cadence consistency mitigation) -->
```

From docs/MAINTAINER-ONBOARDING.md L1-50 baseline (50L 8-section stub; W1 T1.1 ADDITIVE EXPAND target):
```markdown
# Maintainer Onboarding (Stub)
> **Status**：占位文档（v0.1）— 实际启用于 v0.4 co-maintainer 招募窗口
> **决策来源**：[ROADMAP § v0.4 Goal](../.planning/ROADMAP.md) + R04 失败模式 3...

## 目标 ... (L6-8)
## 招募窗口 ... (L10-14)
## Co-maintainer 角色定位 ... (L16-20)
## 必读文档（窗口启动前固定） ... (L22-31; 8-doc list)
## v0.4 启动前 TODO（占位） ... (L33-39; 5 TODO checkboxes)
## 风险（提前 awareness） ... (L41-45)
## References ... (L47-49)
```

W1 T1.1 EXPAND target — preserve all 8 sections verbatim (Status update v0.1 → v0.4 activated + 招募窗口 update 启动 实际 NOT future + v0.4 TODO check off Sponsors+stale-bot+issue-template ✓) + ADD 6 NEW sections (A-F) inserted between 必读文档 L31 and v0.4 启动前 TODO L33 per § 2.2 ordering.

From README.md L1-12 baseline (W1 T1.4b + W2 T2.4 combined MODIFY targets):
```markdown
# harnessed
> **完整三层栈方法论的可执行 engine** ...
> 在装配主义 base 之上...

[![License: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](./LICENSE)
[![Status](https://img.shields.io/badge/status-pre--launch-orange)](./.planning/ROADMAP.md)

> **Status:** 🎯 **v0.2.0 MILESTONE 4/4 SHIPPED & ARCHIVED 2026-05-16** ... · **Phase 4.1 SHIPPED 2026-05-18** — dogfooding benchmark ... Next: Phase 4.2 ...
```

W1 T1.4b ADD L8 badge between L7 Status badge and L9 Status block:
```markdown
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](./LICENSE)
[![Status](https://img.shields.io/badge/status-pre--launch-orange)](./.planning/ROADMAP.md)
[![Sponsor](https://img.shields.io/github/sponsors/easyinplay?logo=github&label=Sponsor)](https://github.com/sponsors/easyinplay)
```

W2 T2.4 UPDATE L9 Status freshness to Phase 4.2 SHIPPED + v0.4.0 2/3 PROGRESS (preserve previous Phase 4.1 SHIPPED context per sister cadence延袭).

From .github/ directory baseline (Phase 4.2 W1 NEW surface area; bash ls verified):
```
.github/
└── workflows/
    ├── ci.yml          (309L; A7 守恒 + 3 transparency gates; T2.6 verify 0 diff target)
    └── perf-bench.yml  (1339 bytes; nightly cron precedent for stale.yml cron pattern reference)
```

Phase 4.2 W1 NEW files (5):
- `.github/FUNDING.yml` NEW ~3-8L (D-03 single-line `github: easyinplay`)
- `.github/workflows/stale.yml` NEW ~45L (D-02 actions/stale@v10 recipe)
- `.github/ISSUE_TEMPLATE/01-bug.yml` NEW ~55-60L (form-based)
- `.github/ISSUE_TEMPLATE/02-feature.yml` NEW ~40-45L (R9.5 三问)
- `.github/ISSUE_TEMPLATE/03-question.yml` NEW ~30-35L (redirect MAINTAINER-ONBOARDING)
- `.github/ISSUE_TEMPLATE/config.yml` NEW ~12L (blank_issues_enabled false)

From sister .planning/phase-4.1/DOGFOOD-T2.X.md 58L format (W2 T2.7 gold-standard 100% reuse target):
```markdown
# Phase 4.1 T2.6 — Dogfood Report (3-axis empirical evidence: ...)

**Date**: 2026-05-18
**Verdict:** **PASS** (3/3 dogfood axes verified, miss: none)

## Axis A — ...
## Axis B — ...
## Axis C — ...
## Aggregate verification
## Disposition
```

Phase 4.2 W2 T2.7 mirror — 3 axes ADAPT per Phase 4.2 community-infra publish scope:
- Axis A: docs/MAINTAINER-ONBOARDING.md EXPAND ≥100 ≤150 + 6 NEW section literal verify
- Axis B: `.github/` NEW infra cluster (FUNDING + stale.yml @v10 + 4 ISSUE_TEMPLATE + blank_issues_enabled false)
- Axis C: README Sponsors badge + footer 2-cross-link + D-04 HYBRID 2-clock STATE.md L23 + RETRO § Cost patterns process-level grep + T2.6 ci.yml VERIFY 0 diff

</interfaces>

<verification>
# Overall Phase 4.2 checks (executed at W2 ship gate pre-tag)
- `wc -l docs/MAINTAINER-ONBOARDING.md` ≥ 100 AND ≤ 150 (D-01 hard cap LOCK; F1)
- `grep -c '^## ' docs/MAINTAINER-ONBOARDING.md` ≥ 12 (8 existing + 6 NEW per § 2.2)
- `grep -q "Dev environment\|Commit conventions\|ADR review\|Cross-OS CI\|Manifest schema\|Upstream drift" docs/MAINTAINER-ONBOARDING.md` exit 0 (6 NEW sections present)
- `wc -l .github/workflows/stale.yml` ≤ 60 (Karpathy hard; F2)
- `grep -q "actions/stale@v10" .github/workflows/stale.yml` exit 0 (R2 finding correction; NOT @v9)
- `! grep -q "actions/stale@v9" .github/workflows/stale.yml` exit 0 (no @v9 sneak per R2)
- `grep -E "days-before-(issue|pr)-(stale|close)" .github/workflows/stale.yml | wc -l` == 4 (60+30 split issue+PR per D-02 sneak block #3)
- `grep -q "days-before-issue-stale: 60" .github/workflows/stale.yml` exit 0 (60+30 split)
- `grep -q "days-before-issue-close: 30" .github/workflows/stale.yml` exit 0 (60+30 split)
- `grep -q "exempt-issue-labels" .github/workflows/stale.yml` exit 0 (STRIDE D defensive list)
- `grep -q "operations-per-run" .github/workflows/stale.yml` exit 0 (STRIDE D rate limit)
- `ls .github/ISSUE_TEMPLATE/*.yml | wc -l` == 4 (3 templates + config.yml; F3)
- `grep -q "blank_issues_enabled: false" .github/ISSUE_TEMPLATE/config.yml` exit 0 (R8.3 80% adoption defender)
- `wc -l .github/FUNDING.yml` ≤ 8 (Karpathy YAGNI hard; F4)
- `grep -q "^github: easyinplay" .github/FUNDING.yml` exit 0 (D-03 LOCKED single-line)
- `! grep -qE "patreon|open_collective|ko_fi|custom" .github/FUNDING.yml` exit 0 (D-03 sneak block #1 + #3)
- `grep -q "img.shields.io/github/sponsors/easyinplay" README.md` exit 0 (Sponsors badge insertion; F5)
- `grep -c "sponsors/easyinplay" README.md` ≥ 2 (badge + footer per § 5.4 sneak block)
- `wc -l README.md` ≤ 200 (Karpathy hard sister 6-phase 连续 hold)
- `wc -l .planning/STATE.md` ≤ 150 (W0.2 flip path) OR ≤ 200 (W0.2 defer path)
- `wc -l .planning/phase-4.2/DOGFOOD-T2.X.md` ≤ 60 (sister Phase 4.1 DOGFOOD 58L precedent; F7)
- `grep -q "ARCHIVED FROM STATE — Phase 4.0+4.1" .planning/RETROSPECTIVE.md` exit 0 (W0.1 D2 cadence iter 3 archive)
- `grep -q "Phase 4.0 was a numeric placeholder\|Phase 4.0 was numeric placeholder" .planning/RETROSPECTIVE.md` exit 0 (R-4 mitigation footer disambiguation)
- `grep -q "Phase 4.2.*✅ SHIPPED\|Phase 4.2 shipped ✅" .planning/ROADMAP.md` exit 0 (W2 T2.3)
- `grep -q "v0.4.0.*2/3" .planning/ROADMAP.md` exit 0 (milestone progress)
- `! grep -q "v0.4.0.*SHIPPED ARCHIVED" .planning/ROADMAP.md` exit 0 (NOT 3/3 ARCHIVED — reserved Phase 4.3)
- `grep -q "Phase 4.2" README.md` exit 0 (W2 T2.4)
- `grep -q "Phase 4.2" PROJECT-SPEC.md` exit 0 (W2 T2.5)
- `grep -q "Internal infra ship clock" .planning/RETROSPECTIVE.md` exit 0 (R-3 mitigation 2-clock literal)
- `grep -q "External co-maintainer organic clock" .planning/RETROSPECTIVE.md` exit 0 (R-3 mitigation 2-clock literal)
- `grep -q "6-month external" .planning/STATE.md` exit 0 (R-3 STATE L23 explicit)
- `grep -q "PASS" .planning/phase-4.2/DOGFOOD-T2.X.md` exit 0 (W2 T2.7)
- `git diff HEAD .github/workflows/ci.yml | wc -l` == 0 (T2.6 verify 0 diff sneak-block — NO A7 iter Phase 4.2)
- `grep -c "stale\|FUNDING\|sponsors" .github/workflows/ci.yml` == 0 (T2.6 stale.yml is SEPARATE file NOT ci.yml step insert)
- `node scripts/check-state-archive-stale.mjs` exit 0 with ENFORCE=true (post-W0.1 archive + post-W2 续编; SIZE_LIMIT=150 IF W0.2 flip OR =200 IF W0.2 defer)
- `node scripts/check-transparency-verdicts.mjs` exit 0 (regression: existing transparency gate still passes post-W2 docs 续编 — STATE_POSITION_RE OR-fallback matches Phase 4.2 SHIPPED literal)
- `git tag --list 'v0.4.0-alpha.2-community' | wc -l` == 1 (W2 T2.7 LOCAL CREATE only; F8)
- `! git tag --list 'adr-0018-accepted'` (NO new ADR Phase 4.2 — R-5 mitigation)
- `! git tag --list '🎯 v0.4.0\|v0.4.0$'` (NO 🎯 milestone close tag — reserved Phase 4.3)
- `git ls-remote origin refs/tags/v0.4.0-alpha.2-community` returns empty (verify NO push — user controls)
</verification>

<success_criteria>
Phase 4.2 SHIPPED when ALL of:

1. **W0 absorb complete** (2 项 path dep STRICT):
   - W0.1 D2 cadence iter 3: STATE.md Phase 4.1 narrative → RETROSPECTIVE.md verbatim (M2 backlog discharge institutionalize verify 3rd-iter terminus stable signal ≥3-iter)
   - W0.2 CONDITIONAL D1 SIZE_LIMIT tighten: IF STATE post-W0.1 ≤140L → flip 200→150 / OTHERWISE defer #BA carry Phase 4.3 W0 (per § 8.2 decision tree)

2. **W1 main scope complete** (5-6 atomic — Phase 4.2 anchors R8.2 + R8.3 + R8.5):
   - docs/MAINTAINER-ONBOARDING.md EXPAND ~125-145L D-01 LOCKED additive preserve 6+2 sections verbatim + 6 NEW sections A-F
   - .github/workflows/stale.yml NEW ~45L D-02 LOCKED actions/stale@v10 (NOT @v9 per R2 finding) + 60+30 split issue+PR + minimal permissions + defensive exempt list
   - .github/ISSUE_TEMPLATE/ 4 NEW yml files (01-bug + 02-feature R9.5 三问 + 03-question + config blank_issues_enabled false)
   - .github/FUNDING.yml NEW ~3-8L D-03 LOCKED `github: easyinplay` single-line
   - README L8 Sponsors badge + L190-192 footer EXPAND (combined per planner Discretion #1 TOP + FOOTER both)

3. **W2 ship close complete** (5 + DOGFOOD + tag = 7 atomic; sister Phase 4.1 W2 7-task subset reuse):
   - STATE.md 续编 Phase 4.2 SHIPPED + 当前位置 v0.4.0 2/3 + L23 2-clock disambiguation note (combined W0.1 archive sub-step)
   - RETROSPECTIVE.md 续编 7-section + receive W0.1 D2 auto-archive Phase 4.0+4.1 + 2-clock literal phrases
   - ROADMAP.md L216-218 Phase 4.2 ✅ SHIPPED + v0.4.0 2/3 PROGRESS (NOT 3/3 ARCHIVED reserved Phase 4.3) + L185 inline 2-clock note
   - README.md L9 Status + L48 v0.4.0 2/3 + Phase 4.2 row + L8 Sponsors badge + L190-192 footer EXPAND (combined W1+W2)
   - PROJECT-SPEC.md L3 Status Phase 4.2 SHIPPED literal + L6 下一步 Phase 4.3
   - ci.yml VERIFY 0 diff sneak-block (T2.6 verify-only NO commit; NO A7 iter)
   - DOGFOOD-T2.X.md NEW PASS 3/3 axes (A MAINTAINER-ONBOARDING + B `.github/` infra cluster + C README Sponsors + D-04 2-clock + T2.6 ci.yml verify)
   - Single baseline tag `v0.4.0-alpha.2-community` LOCAL CREATE only (NO push)

4. **All acceptance criteria F1-F8 verified** (per <verification> block above)

5. **All 4 D-decisions activated 闭环** (D-01 EXPAND additive + D-02 90-day issue+PR @v10 + D-03 single tier $1+ + D-04 HYBRID 2-clock process-level)

6. **DEFERRED #BA conditional RESOLVED Phase 4.2 W0.2** (FLIP path) OR carry-forward Phase 4.3 W0 (DEFER path); #BB ✅ pre-RESOLVED at discuss-phase (HYBRID 2-clock LOCKED D-04); #BC + #BD + #AH unchanged

7. **STRIDE threat model 7 nodes mitigated** (per `<threats_open>` block above — all mitigations referenced specific D-decision sneak block守门 + STRIDE category)

8. **biome preempt verified pre-W0.2 commit IF FLIP path** for .mjs touches (scripts/check-state-archive-stale.mjs mandatory per project memory `feedback_biome-preempt.md` 3 CI-red recurrences terminus续延); W1 W2 all .yml + .md (biome NOT scope, no-op)

</success_criteria>

<output>
After completion:
1. Each task commits atomically per task_plan.md `Recommended commit msg` blocks (Karpathy why-not-what; sister Phase 4.1 W0 commit msg pattern延袭)
2. Resolved blocks in task_plan.md updated in-place per executor wave outcomes (PENDING → 实占 values)
3. `.planning/phase-4.2/DOGFOOD-T2.X.md` NEW W2 T2.7 PASS 3/3 axes empirical evidence
4. Single baseline tag `v0.4.0-alpha.2-community` LOCAL CREATE only (annotated, no push per CLAUDE.md commit safety)
5. Phase 4.2 ship summary in `.planning/phase-4.2/` consistent with sister artifacts layout
6. v0.4.0 milestone progress: 1/3 → 2/3 PROGRESS (NOT yet 3/3 ARCHIVED — reserved Phase 4.3 close)
7. DEFERRED carry items: #BA conditional RESOLVED FLIP OR carry Phase 4.3 W0 DEFER; #AH path traversal regex hardening still Phase 4.0+ conditional; sister M+T tier carry to Phase 4.3 W0 backlog if any new emerges
</output>
