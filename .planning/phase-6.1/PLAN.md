---
phase: 6.1
plan: PLAN
type: execute
wave: 0
milestone: v1.0 GA
phase_class: PRODUCTION_RELEASE
window: 2026-05-22 ~ 2026-05-23
final_phase: true
created: 2026-05-22
total_tasks: 19
waves: 3
sister: phase-5.3/PLAN.md (close ceremony 14-task structure adapted production release +5 npm publish/release infra)
locked_decisions: [M-01, D-01, D-02, D-03, D-04, D-05, D-06, D-07, D-08]
requirements: [R8.1-R8.5, R10.1-R10.4, GA-1, GA-2, GA-3, GA-4, GA-5, GA-6, GA-7, GA-8, GA-9]
autonomous: false  # T1.0 PREREQ + T2.10 user push approval gates
files_modified:
  # Wave 0 (planning/verify, no src change)
  - .planning/STATE.md  # D2 iter 8 TERMINUS trim Phase 5.3 narrative
  - .planning/RETROSPECTIVE.md  # absorb Phase 5.3 archive from STATE
  # Wave 1 (config + infrastructure)
  - package.json  # D-05 private removal + 1.0.0 + author
  - .github/workflows/publish.yml  # D-02 NEW
  - docs/adr/0023-npm-publish-release-process.md  # NEW ADR 0023
  # Wave 2 (close cadence artifacts)
  - docs/adr/README.md  # +1 entry 0023
  - .github/workflows/ci.yml  # A7 iter 0022→0023
  - README.md  # D-03 badge swap + Status update
  - CHANGELOG.md  # D-06 [1.0.0] MAJOR
  - .planning/ROADMAP.md  # D-07 v1.0 SHIPPED + v1.0+ outline
  - docs/MAINTAINER-ONBOARDING.md  # D-08 NOTE forward
  - .planning/phase-6.1/DOGFOOD-T2.X.md  # NEW 3-axis verify
  # Wave 2 STATE.md FINAL update + 3 tags
must_haves:
  truths:
    - "package.json publishable (no `private: true`, version 1.0.0, author present)"
    - "publish.yml exists at .github/workflows/ with OIDC trusted publishing config"
    - "ADR 0023 accepted, A7 守恒 main body 0001-0022 unchanged"
    - "ci.yml A7 step iter 0022→0023 both loops L90+L101 + step name L87 + echo L112"
    - "README displays npm version badge (pre-launch removed); Status section v1.0 GA SHIPPED"
    - "CHANGELOG has [1.0.0] - 2026-05-22 MAJOR release entry above [0.5.0]"
    - "ROADMAP v1.0 chapter row 🎯 SHIPPED + v1.0+ Maintenance-Only Mode outline section"
    - "MAINTAINER-ONBOARDING.md has post-v1.0 forward visibility NOTE (no negative-framing)"
    - "DOGFOOD-T2.X.md 3-axis PASS empirical verify recorded"
    - "RETROSPECTIVE Phase 6.1 7-section + cross-milestone v0.5.0→v1.0 trends"
    - "STATE.md 進度 21/21 100% + 当前里程碑 🎯 v1.0 GA SHIPPED 2026-05-22 + maintenance-mode forward"
    - "3 tags LOCAL CREATE: adr-0023-accepted + v1.0.0-alpha.1-release-prep + 🎯 v1.0.0"
    - "Tests 756 PASS no regression; CI all green; biome lint clean (only package.json + workflow yml + docs touched)"
  artifacts:
    - path: ".github/workflows/publish.yml"
      provides: "OIDC trusted publishing pipeline tag-triggered v[0-9]+.[0-9]+.[0-9]+"
      min_lines: 45
      max_lines: 70
      contains: "id-token: write,npm publish --provenance --access public"
    - path: "docs/adr/0023-npm-publish-release-process.md"
      provides: "ADR 0023 9-section sister 0022 format"
      min_lines: 140
      max_lines: 200
      contains: "OIDC,Trusted Publishing,A7 Conservation,provenance,sigstore"
    - path: "package.json"
      provides: "publishable manifest 1.0.0"
      contains: "\"version\": \"1.0.0\",\"author\""
      excludes: "\"private\": true"
    - path: ".planning/phase-6.1/DOGFOOD-T2.X.md"
      provides: "3-axis empirical verify PASS (Axis A npm publish dry-run + Axis B v1.0 tag annotation + Axis C README/CHANGELOG/ROADMAP coherence)"
      min_lines: 50
      max_lines: 90
    - path: ".planning/STATE.md"
      provides: "post-v1.0 GA freeze position; 进度 21/21 100%"
      contains: "v1.0 GA SHIPPED,21 / 21 phases,100%,maintenance-only mode"
      max_lines: 145
  key_links:
    - from: ".github/workflows/publish.yml"
      to: "npm registry trusted publisher (easyinplay/harnessed/publish.yml)"
      via: "OIDC id-token + npm publish --provenance --access public"
      pattern: "id-token: write"
    - from: "package.json"
      to: "publish.yml build step (corepack pnpm build → npm publish)"
      via: "files array + version 1.0.0"
      pattern: "\"version\": \"1.0.0\""
    - from: "docs/adr/0023-npm-publish-release-process.md"
      to: ".github/workflows/ci.yml A7 step"
      via: "iter 0022→0023 both loops L90+L101 + name L87 + echo L112"
      pattern: "0001 0002.*0022 0023"
    - from: "README.md L7 npm badge"
      to: "https://shields.io/npm/v/harnessed"
      via: "shields.io auto-tracks npm registry version"
      pattern: "img.shields.io/npm/v/harnessed"
    - from: "🎯 v1.0.0 tag annotation"
      to: "tag push (manual user approval) → publish.yml trigger → npm publish"
      via: "v[0-9]+.[0-9]+.[0-9]+ regex match"
      pattern: "v1\\.0\\.0"
risks:
  R-1:
    level: HIGH
    summary: "npm publish irreversible (after 72h cannot unpublish)"
    mitigation: "T0.3 4-step rehearsal Wave 0 (npm pack + .npmignore review + npm publish --dry-run + npm view name claim) + T2.10 tag LOCAL CREATE only, user approval required for actual push trigger"
  R-2:
    level: MED
    summary: "OIDC Trusted Publishers UI config complexity (manual external prereq before tag push)"
    mitigation: "T1.0 PREREQ checkpoint blocking task — user manually configures npmjs.com Trusted Publisher (easyinplay/harnessed/publish.yml) + verifies before W1 starts. Fallback documented in ADR 0023: NPM_TOKEN granular access token secret path."
  R-3:
    level: LOW
    summary: "ADR 0023 ≤200L Karpathy budget (borderline; sister 0022 184L precedent)"
    mitigation: "Strict 9-section sister 0022 format reuse; A7 Conservation copy structure verbatim adapted; line count ≤184L (stay at-or-under sister precedent)"
  R-4:
    level: LOW
    summary: "🎯 v1.0 tag annotation 25-40L Karpathy budget (D-04 5 sections strict)"
    mitigation: "RESEARCH § 7 draft ~32L within budget; 5-section structure locked (intro 3L + milestones 5L + GA criteria 9L + stats 5L + forward 5L + signature 3-5L)"
  R-5:
    level: LOW
    summary: "STATE post-v1.0 maintenance freeze decision (D2 iter 8 = TERMINUS; explicit graduation needed)"
    mitigation: "T0.1 (W0) trim Phase 5.3 narrative → RETROSPECTIVE (iter 8 graduation); T2.9 explicit 'v1.0 SHIPPED frozen mode' + 'maintenance-only mode triggers ~2026-11' wording in STATE 当前位置"
karpathy_budget:
  publish.yml: "~50-70L (PASS 70% margin ≤200L)"
  ADR_0023: "~150-180L (BORDERLINE ≤184L sister precedent)"
  DOGFOOD-T2.X.md: "~60-80L (PASS)"
  v1.0_tag_annotation: "~30-35L (PASS within D-04 25-40L)"
  v1.0+_outline_ROADMAP: "~30-40L (PASS additive)"
  CHANGELOG_[1.0.0]: "~30-40L (PASS additive)"
  README_delta: "+5-8L (PASS surgical)"
  STATE.md: "≤130L (TARGET; D2 iter 8 trim Phase 5.3 narrative archive)"
  RETROSPECTIVE_Phase_6.1: "+80-110L (PASS additive 7-section + cross-milestone v0.5.0→v1.0 trends section)"
sister_cadence_reuse:
  format_100_percent:
    - "ADR 0023 ← ADR 0022 9-section format"
    - "DOGFOOD-T2.X.md ← Phase 5.3 DOGFOOD-T2.X.md 3-axis format"
    - "CHANGELOG [1.0.0] ← CHANGELOG [0.5.0] Keep-a-Changelog format"
    - "ROADMAP v1.0 SHIPPED row ← v0.5.0 SHIPPED row format"
    - "RETROSPECTIVE Phase 6.1 ← Phase 5.3 7-section format"
    - "publish.yml SHA-pin + corepack pnpm pattern ← ci.yml SHA-pin Phase 1.1.1 H1"
    - "tag adr-0023-accepted ← adr-0022-accepted annotation pattern"
    - "v1.0.0-alpha.1-release-prep ← v0.5.0-alpha.1-release-prep sister dual-tag延袭"
  delta_one_off:
    - "🎯 v1.0.0 tag annotation 25-40L MAJOR (NOT sister 9-line minor cadence — D-04 distinct)"
    - "v1.0+ Maintenance-Only Mode outline section NEW (no sister)"
---

<objective>
Phase 6.1 = 🎯 v1.0 GA PRODUCTION RELEASE — FINAL phase of harnessed project.

Ship npm publish stream live + README stable badge + CHANGELOG [1.0.0] MAJOR + ROADMAP v1.0 SHIPPED + ADR 0023 npm publish architecture + 3 LOCAL CREATE tags (adr-0023-accepted + v1.0.0-alpha.1-release-prep + 🎯 v1.0.0).

Purpose: First MAJOR release of harnessed. Establishes permanent OIDC trusted publishing pipeline (no NPM_TOKEN) via `.github/workflows/publish.yml` NEW. Locks 9 GA criteria all ✅ (R8.1-R8.5 + R10.1-R10.4 + organic clock OPENED). Marks 21/21 phases 100% complete. Opens 6-month organic co-maintainer clock per ADR 0020 D-04 HYBRID 2-clock; maintenance-only mode forward-signal (NOT immediate per D-08 sneak-block).

Output: 19 tasks across 3 waves — Wave 0 (4 tasks: STATE D2 iter 8 trim + #BA SIZE_LIMIT round 5 + npm publish 4-step rehearsal + baseline gate) + Wave 1 (4 tasks: PREREQ external user setup + publish.yml NEW + package.json 3 surgical changes + ADR 0023 NEW) + Wave 2 (11 tasks: docs/adr/README +1 + ci.yml A7 iter + README badge swap + CHANGELOG [1.0.0] + ROADMAP v1.0 SHIPPED + MAINTAINER-ONBOARDING NOTE + DOGFOOD verify + RETROSPECTIVE Phase 6.1 + STATE post-v1.0 + 3 tags LOCAL CREATE + final commit + CI gates verify).

NEVER push without user approval. T2.10 tag LOCAL CREATE only; push approval gates v1.0 GA actual ship (R-1 mitigation).
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
@.planning/phase-6.1/6.1-CONTEXT.md
@.planning/phase-6.1/RESEARCH.md
@.planning/phase-6.1/6.1-PATTERNS.md
@.planning/phase-6.1/6.1-DISCUSSION-LOG.md
@.planning/phase-5.3/PLAN.md
@docs/adr/0020-active-development-window-binding.md
@docs/adr/0022-uninstall-and-path-traversal.md
@.github/workflows/ci.yml
@package.json
@README.md
@CHANGELOG.md
@docs/adr/README.md
@docs/MAINTAINER-ONBOARDING.md
</context>

---

## § 1 Wave Structure Overview

**Total**: 19 tasks across 3 waves (Wave 0: 4 + Wave 1: 4 + Wave 2: 11)

**Wave 0 (planning/verify/rehearsal)** — 4 tasks: T0.1 STATE D2 iter 8 TERMINUS trim Phase 5.3 narrative → RETROSPECTIVE; T0.2 #BA SIZE_LIMIT round 5 conditional final evaluate; T0.3 npm publish 4-step rehearsal (T3 absorb); T0.4 baseline gate verify (tsc + tests 756 + CI 2 gates).

**Wave 1 (infrastructure + config + ADR)** — 4 tasks: T1.0 PREREQ blocking external user setup (npm account claim + Trusted Publisher UI config); T1.1 `.github/workflows/publish.yml` NEW (~50-70L); T1.2 package.json 3 surgical changes (private removal + 1.0.0 + author); T1.3 docs/adr/0023 NEW (~150-180L sister 0022 9-section).

**Wave 2 (close cadence artifacts ship)** — 11 tasks T2.1-T2.11: docs/adr/README +1 + ci.yml A7 iter + README swap + CHANGELOG [1.0.0] + ROADMAP v1.0 SHIPPED + MAINTAINER-ONBOARDING NOTE + DOGFOOD-T2.X.md verify + RETROSPECTIVE + STATE FINAL + 3 tags LOCAL CREATE + final commit/CI verify.

**STRIDE ordering (T-4.3-07)**: All Wave 2 doc commits T2.1-T2.9 FIRST → T2.10 tags LOCAL CREATE LAST → user push approval gates actual v1.0 GA ship via publish.yml workflow trigger.

---

## § 2 Wave 0 — Planning / Verify / Rehearsal

<tasks>

<task type="auto" id="T0.1" wave="0">
  <name>T0.1: STATE.md D2 iter 8 TERMINUS — trim Phase 5.3 narrative → RETROSPECTIVE archive</name>
  <files>
    - .planning/STATE.md
    - .planning/RETROSPECTIVE.md
  </files>
  <action>
    Per D-01 + 6.1-CONTEXT.md #BA/#BS row (LINES 125-126): D2 cadence iter 8 = TERMINUS (8-iter graduation signal beyond 6-iter implicit graduation; sister Phase 5.1 iter 5 + Phase 5.2 iter 6 + Phase 5.3 iter 7 pattern stable).

    Step 1: Read current `.planning/STATE.md` (Phase 5.3 ship state 141L post-close per CONTEXT.md L125).
    Step 2: Identify Phase 5.3 narrative paragraphs in STATE.md (status + ship notes block beyond current position table; sister Phase 5.2 narrative trim pattern from STATE iter 7).
    Step 3: Append Phase 5.3 narrative paragraphs to `.planning/RETROSPECTIVE.md` under NEW section `## ARCHIVED FROM STATE — Phase 5.3 (archived 2026-05-22 Phase 6.1 W0 D2 iter 8 TERMINUS)` — sister Phase 5.2 archive pattern from RETROSPECTIVE.
    Step 4: Replace those paragraphs in STATE.md with archive comment block:
    ```
    <!-- Phase 5.3 narrative archived to RETROSPECTIVE.md § ARCHIVED FROM STATE — Phase 5.3 (2026-05-22 Phase 6.1 W0 D2 cadence iter 8 TERMINUS per standing process — 8-iter confirms implicit graduation; sister Phase 5.1 iter 5 + Phase 5.2 iter 6 + Phase 5.3 iter 7 pattern stable beyond 6-iter graduation) -->
    ```
    Step 5: Verify STATE.md line count post-trim → must input T0.2 #BA SIZE_LIMIT round 5 evaluate decision (≤130L FLIP / 131-145L ACCEPT terminus / >145L BLOCKED).

    DO NOT change current position table headers / 進度 / 当前里程碑 fields in this task (T2.9 handles post-v1.0 GA update); only narrative trim.
  </action>
  <verify>
    <automated>
      wc -l .planning/STATE.md
      grep -c "ARCHIVED FROM STATE — Phase 5.3" .planning/RETROSPECTIVE.md  # = 1
      grep -c "Phase 5.3 narrative archived to RETROSPECTIVE" .planning/STATE.md  # = 1
    </automated>
  </verify>
  <done>
    STATE.md narrative trimmed (Phase 5.3 paragraphs replaced by archive comment); RETROSPECTIVE.md has new `## ARCHIVED FROM STATE — Phase 5.3` section; line count recorded for T0.2 input.
  </done>
</task>

<task type="auto" id="T0.2" wave="0">
  <name>T0.2: #BA SIZE_LIMIT round 5 conditional final evaluate (PERMANENT RETIRE or BLOCKED)</name>
  <files>
    - .planning/phase-6.1/PLAN-NOTES.md  # NEW small ~10-20L note file recording decision
  </files>
  <action>
    Per CONTEXT.md L125 W0 backlog #BA row decision tree:
    - Post-T0.1 trim STATE.md line count IS:
      - **≤130L** → FLIP `check-state-archive-stale.mjs` SIZE_LIMIT 150 → 140 + #BA permanent retire
      - **131-145L** → ACCEPT terminus iter 8 graduation (no SIZE_LIMIT change) + #BA permanent retire
      - **>145L** → BLOCKED — escalate to user

    Step 1: Read current `scripts/check-state-archive-stale.mjs` and locate `SIZE_LIMIT` constant.
    Step 2: Apply tree decision per T0.1 wc -l output:
      - If ≤130L: `Edit` SIZE_LIMIT 150 → 140 in check-state-archive-stale.mjs;
      - Else (131-145L): NO file edit; ACCEPT terminus.
      - Else (>145L): STOP. Create `.planning/phase-6.1/PLAN-NOTES.md` with BLOCKED note; checkpoint to user.
    Step 3: Create `.planning/phase-6.1/PLAN-NOTES.md` (~10-20L) recording:
      - Decision: FLIP 150→140 / ACCEPT terminus / BLOCKED
      - STATE.md post-T0.1 line count
      - #BA permanent retire status (yes if FLIP or ACCEPT)
      - D2 cadence iter 8 = TERMINUS confirmed

    Sister cadence: Phase 5.1+5.2+5.3 W0 #BA/#BS evaluate format reuse (per CONTEXT.md L125 explicit "iter 8 = TERMINUS pattern stable beyond ≥6-iter graduation").
  </action>
  <verify>
    <automated>
      test -f .planning/phase-6.1/PLAN-NOTES.md
      grep -E "(FLIP|ACCEPT|BLOCKED)" .planning/phase-6.1/PLAN-NOTES.md  # exactly one decision line
      # If FLIP path was taken:
      grep "SIZE_LIMIT = 140" scripts/check-state-archive-stale.mjs  # exists only if FLIP path
      # CI gate verify NOT regressed:
      node scripts/check-state-archive-stale.mjs
    </automated>
  </verify>
  <done>
    PLAN-NOTES.md records decision; SIZE_LIMIT either flipped 150→140 OR accepted unchanged (per tree); #BA permanent retire signal recorded (NOT BLOCKED path); CI gate `check-state-archive-stale.mjs` PASS.
  </done>
</task>

<task type="auto" id="T0.3" wave="0">
  <name>T0.3: npm publish 4-step rehearsal (T3 absorb from sister Paranoid Review 5th-cycle)</name>
  <files>
    - .planning/phase-6.1/PLAN-NOTES.md  # append rehearsal evidence
  </files>
  <action>
    Per RESEARCH § 1 4-step rehearsal sequence + R-1 mitigation. Local verify BEFORE any commit/tag/push to prevent irreversibility surprise.

    Step 1 — npm pack dry-run:
      Run `npm pack --dry-run` in repo root. Verify output matches RESEARCH § 1 baseline:
      - Package: harnessed@<current> (0.3.0 NOW; will be 1.0.0 after T1.2)
      - Files: 51, ~210kB compressed, ~844kB unpacked
      - Includes: dist/, manifests/, workflows/, routing/, config-templates/, schemas/, README.md, LICENSE, NOTICE, package.json
      - Excludes (must): .planning/, tests/, src/, .github/, docs/adr/, scripts/, .harnessed/

    Step 2 — `.npmignore` review:
      Verify `.npmignore` NOT present (per RESEARCH § 1 Step 2 — `files` array whitelist sufficient; .npmignore redundant).
      Command: `test ! -f .npmignore` OR `ls .npmignore 2>&1 | grep -q "No such"`.

    Step 3 — npm publish --dry-run simulation:
      Run `npm publish --dry-run --access public` (will fail on private=true OR pass if removed; current state expects error/warning since private=true still set pre-T1.2 — record output to PLAN-NOTES.md regardless).
      Note: Does NOT test OIDC; only tarball assembly verify.

    Step 4 — Package name claim verification:
      Run `npm view harnessed 2>&1`. Expect 404 (unclaimed; RESEARCH § 1 Step 4 verified). Record version returned (none) + verdict ("unclaimed ✅").

    Step 5 — Append rehearsal evidence to `.planning/phase-6.1/PLAN-NOTES.md`:
      ```markdown
      ## T0.3 npm publish 4-step rehearsal evidence (2026-05-22)
      - Step 1 npm pack --dry-run: <N> files, <X>kB compressed → PASS (matches RESEARCH § 1)
      - Step 2 .npmignore: NOT PRESENT → PASS (files array whitelist sufficient)
      - Step 3 npm publish --dry-run: <output excerpt> → PASS / EXPECTED ERROR pre-T1.2
      - Step 4 npm view harnessed: 404 (unclaimed) → PASS (name available for v1.0.0 first publish)
      ```

    R-1 mitigation: this rehearsal MUST PASS before W1 starts (publish.yml + package.json changes).
  </action>
  <verify>
    <automated>
      npm pack --dry-run > /tmp/pack-out.txt 2>&1 && grep -c "harnessed-.*\.tgz" /tmp/pack-out.txt  # tarball name appears
      test ! -f .npmignore
      npm view harnessed 2>&1 | grep -q "404"  # 404 = unclaimed
      grep -c "T0.3 npm publish 4-step rehearsal evidence" .planning/phase-6.1/PLAN-NOTES.md  # = 1
    </automated>
  </verify>
  <done>
    4-step rehearsal complete; tarball clean ≤51 files ≤220kB compressed; .npmignore absent; harnessed npm name 404 unclaimed; PLAN-NOTES.md records all 4 steps with PASS/expected-error verdicts.
  </done>
</task>

<task type="auto" id="T0.4" wave="0">
  <name>T0.4: Baseline gate verify — tsc + tests 756 + CI 2 gates locally</name>
  <files>
    - (verify only, no file changes)
  </files>
  <action>
    Per RESEARCH § Validation Architecture + project memory `feedback_biome-preempt.md` (3 CI-red recurrences mitigation). Establish 0-regression baseline BEFORE Wave 1 changes.

    Step 1: `corepack pnpm install --frozen-lockfile` — confirm clean install.
    Step 2: `corepack pnpm test` — confirm 756 tests PASS (zero regression baseline established).
    Step 3: `node scripts/check-state-archive-stale.mjs` — confirm STATE.md size gate PASS post-T0.1+T0.2.
    Step 4: Optional `pnpm exec biome check .` — should be clean (no TS/JS src change in Phase 6.1; baseline check pre-W1).

    Record results in `.planning/phase-6.1/PLAN-NOTES.md`:
      ```
      ## T0.4 baseline gate verify (2026-05-22)
      - pnpm install: clean ✅
      - pnpm test: 756 PASS ✅ (baseline zero regression)
      - check-state-archive-stale.mjs: PASS ✅
      - biome check: clean ✅
      ```
  </action>
  <verify>
    <automated>
      corepack pnpm install --frozen-lockfile
      corepack pnpm test 2>&1 | tee /tmp/test-out.txt | tail -20
      grep -E "(756 passed|Tests:.*756)" /tmp/test-out.txt
      node scripts/check-state-archive-stale.mjs
    </automated>
  </verify>
  <done>
    pnpm test = 756 PASS recorded; pnpm install --frozen-lockfile clean; check-state-archive-stale.mjs PASS; PLAN-NOTES.md baseline section appended; ready for W1.
  </done>
</task>

</tasks>

### Wave 0 commit (after T0.1-T0.4)
```
git add .planning/STATE.md .planning/RETROSPECTIVE.md .planning/phase-6.1/PLAN-NOTES.md scripts/check-state-archive-stale.mjs
git commit -m "docs(phase-6.1-w0): T0.1-T0.4 — STATE D2 iter 8 TERMINUS trim + #BA SIZE_LIMIT round 5 final + npm publish 4-step rehearsal PASS + baseline 756 tests PASS"
```
(IF FLIP path: include scripts/check-state-archive-stale.mjs; ELSE omit.)

---

## § 3 Wave 1 — Infrastructure + Config + ADR

<tasks>

<task type="checkpoint:human-action" id="T1.0" wave="1" gate="blocking">
  <name>T1.0 PREREQ: External user manual setup — npm account + Trusted Publisher UI config</name>
  <what-needed>
    Per RESEARCH § 2 setup prerequisites. Must be COMPLETE before any tag push (R-2 mitigation). This is the ONLY truly unavoidable human step in Phase 6.1 — npm registry UI and account creation cannot be CLI/API automated for first-time package name claim + Trusted Publisher config.
  </what-needed>
  <how-to-perform>
    Step 1: User logs into https://www.npmjs.com (or creates account if needed).
    Step 2: First-publish manual claim path:
      - **OPTION A (recommended)**: Skip manual claim. The Trusted Publisher path below allows first publish via CI workflow on tag push. The package name claim happens automatically on first successful CI publish.
      - **OPTION B (fallback)**: Manually publish v1.0.0-rc.0 locally to claim name first, THEN configure Trusted Publisher. NOT recommended per D-05 (no rc.X intermediate).
    Step 3: Navigate to https://www.npmjs.com/settings/<your-username>/packages OR search for `harnessed` package (will show 404 until first publish).
    Step 4: After first publish: navigate to package settings → "Trusted Publishers" tab → "Add publisher" → enter:
      - Publisher: GitHub Actions
      - Organization or username: `easyinplay`
      - Repository: `harnessed`
      - Workflow filename: `publish.yml`
      - Environment name: (leave blank unless using GitHub Environments)
    Step 5 (alternative pre-publish path): If npm registry supports pre-publish Trusted Publisher config for unclaimed names (check registry UI), do that instead — then first tag push will auto-claim name via CI provenance publish.
    Step 6: Verify in npm UI: Trusted Publisher entry visible.

    **FALLBACK (if Trusted Publishing not available before tag push)**: Per RESEARCH § 2 fallback path — create granular access token (Tokens → Granular Access Token → scope to `harnessed` package publish + 90-day TTL) → add to GitHub repo settings → Secrets → `NPM_TOKEN`. Publish.yml will need `env: NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}` (alternate path documented in ADR 0023 § Decision fallback note).
  </how-to-perform>
  <verify>
    User confirms either:
    (a) "Trusted Publisher configured for easyinplay/harnessed/publish.yml" — PRIMARY PATH per D-02, OR
    (b) "NPM_TOKEN granular access token added to GitHub secrets" — FALLBACK
    Output decision in PLAN-NOTES.md under `## T1.0 npm registry setup status`.
  </verify>
  <resume-signal>
    Type "OIDC configured" OR "NPM_TOKEN configured (fallback)" OR "BLOCKED: <reason>".
  </resume-signal>
  <done>
    User confirms PREREQ resolved (OIDC primary OR NPM_TOKEN fallback documented); PLAN-NOTES.md records decision; W1 unblocked.
  </done>
</task>

<task type="auto" id="T1.1" wave="1" depends_on="T1.0">
  <name>T1.1: `.github/workflows/publish.yml` NEW (~50-70L OIDC trusted publishing)</name>
  <files>
    - .github/workflows/publish.yml  # NEW
  </files>
  <action>
    Per D-02 + RESEARCH § 2 + PATTERNS.md `.github/workflows/publish.yml` section. Sister `.github/workflows/ci.yml` SHA-pin pattern verbatim reuse.

    Step 1: Read `.github/workflows/ci.yml` to confirm SHA pins for `actions/checkout` + `actions/setup-node` (sister Phase 1.1.1 H1 hotfix pattern).
    Step 2: Create `.github/workflows/publish.yml` with this exact content (~52L target):

    ```yaml
    name: publish

    on:
      push:
        tags:
          - 'v[0-9]+.[0-9]+.[0-9]+'

    permissions:
      contents: read
      id-token: write   # REQUIRED for npm OIDC trusted publishing (D-02; ADR 0023)

    jobs:
      publish:
        name: npm publish
        runs-on: ubuntu-latest
        defaults:
          run:
            shell: bash
        steps:
          - uses: actions/checkout@34e114876b0b11c390a56381ad16ebd13914f8d5  # v4.3.1 (sister ci.yml SHA-pin)
          - uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020  # v4.4.0 (sister ci.yml SHA-pin)
            with:
              node-version: '22'
              registry-url: 'https://registry.npmjs.org'
          - run: corepack enable
          - run: corepack pnpm install --frozen-lockfile
          - run: corepack pnpm build
          - run: npm publish --provenance --access public
            # No NODE_AUTH_TOKEN needed — OIDC trusted publishing per D-02 (ADR 0023)
            # Fallback if Trusted Publisher not configured:
            #   env:
            #     NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
    ```

    Key constraints:
    - SHA pins exact match ci.yml (supply-chain hardening Phase 1.1.1 H1)
    - Tag trigger regex `v[0-9]+.[0-9]+.[0-9]+` (NOT `v*` — excludes alpha/rc tags from auto-publish)
    - `id-token: write` REQUIRED for OIDC
    - `registry-url` REQUIRED by setup-node to generate .npmrc
    - `npm publish` NOT `pnpm publish` (D-02 LOCK; npm CLI canonical for provenance)
    - `ubuntu-latest` only (publish is platform-agnostic; no matrix)
    - No A7 step, no test step (publish-only job per PATTERNS.md L75-82)
    - Fallback NODE_AUTH_TOKEN documented as comment, NOT active

    Step 3: Verify line count ≤70L; verify YAML syntax (yamllint or basic parse).
  </action>
  <verify>
    <automated>
      test -f .github/workflows/publish.yml
      wc -l .github/workflows/publish.yml  # ≤70L target
      grep -c "id-token: write" .github/workflows/publish.yml  # = 1
      grep -c "npm publish --provenance --access public" .github/workflows/publish.yml  # = 1
      grep -c "v\[0-9\]+\.\[0-9\]+\.\[0-9\]+" .github/workflows/publish.yml  # = 1
      grep -c "34e114876b0b11c390a56381ad16ebd13914f8d5" .github/workflows/publish.yml  # SHA-pinned checkout = 1
      grep -c "49933ea5288caeca8642d1e84afbd3f7d6820020" .github/workflows/publish.yml  # SHA-pinned setup-node = 1
      # YAML parse sanity:
      python3 -c "import yaml; yaml.safe_load(open('.github/workflows/publish.yml'))" 2>&1 | tee /tmp/yaml-parse.txt
      ! grep -q "Error\|error" /tmp/yaml-parse.txt
    </automated>
  </verify>
  <done>
    `.github/workflows/publish.yml` NEW exists; line count ≤70L; all 5 grep checks pass (id-token, provenance flag, tag regex, 2 SHA-pinned actions); YAML parses clean; sister ci.yml SHA-pin pattern verified.
  </done>
</task>

<task type="auto" id="T1.2" wave="1" depends_on="T1.0">
  <name>T1.2: package.json — 3 surgical changes (private removal + version 1.0.0 + author add)</name>
  <files>
    - package.json
  </files>
  <action>
    Per D-05 + RESEARCH § 3 audit. EXACTLY 3 surgical changes; all other metadata already correct (verified live).

    Step 1: Read current package.json. Confirm:
      - `"private": true` (present, line ~3-5)
      - `"version": "0.3.0"` (present)
      - `"author"` — MISSING

    Step 2: Apply 3 changes:
      - **REMOVE** entire `"private": true,` line (do NOT leave dangling comma)
      - **CHANGE** `"version": "0.3.0"` → `"version": "1.0.0"`
      - **ADD** `"author": "easyinplay"` field — place after `"license"` field for sister npm metadata canonical order

    Step 3: Verify (via direct `node -e 'JSON.parse(...)'` or grep):
      - `"private"` MUST be absent
      - `"version": "1.0.0"` MUST be present
      - `"author"` MUST be present with value `"easyinplay"`
      - All other fields unchanged (description, keywords, homepage, repository, bugs, license: Apache-2.0, engines, type, bin, files, main, exports)

    Step 4: Run `corepack pnpm install --frozen-lockfile` to confirm no lockfile drift (no dependency added; pure metadata change).

    Step 5: Re-run `npm pack --dry-run` — expect output now shows `harnessed@1.0.0` (was `harnessed@0.3.0` in T0.3).

    Constraints (sneak-block from D-05):
    - DO NOT bump to `1.0.0-rc.X` intermediate (direct 0.3.0 → 1.0.0)
    - DO NOT add custom registry URL (default npmjs.org)
    - DO NOT modify `files` array (already correct per RESEARCH § 1 verified clean)
    - DO NOT modify keywords/description/etc (already present per RESEARCH § 3 audit)
  </action>
  <verify>
    <automated>
      ! grep -q "\"private\": true" package.json
      grep -c "\"version\": \"1.0.0\"" package.json  # = 1
      grep -c "\"author\": \"easyinplay\"" package.json  # = 1
      grep -c "\"license\": \"Apache-2.0\"" package.json  # = 1 (unchanged)
      node -e "const p=require('./package.json'); console.log(p.name, p.version, p.author, p.private)"
      # Expect: harnessed 1.0.0 easyinplay undefined
      corepack pnpm install --frozen-lockfile
      npm pack --dry-run 2>&1 | grep -c "harnessed-1.0.0.tgz"  # = 1
    </automated>
  </verify>
  <done>
    package.json: private removed + version 1.0.0 + author easyinplay added; lockfile no drift; npm pack now shows harnessed-1.0.0.tgz; all other metadata unchanged; JSON parse valid.
  </done>
</task>

<task type="auto" id="T1.3" wave="1" depends_on="T1.1,T1.2">
  <name>T1.3: docs/adr/0023-npm-publish-release-process.md NEW (~150-180L sister 0022 9-section)</name>
  <files>
    - docs/adr/0023-npm-publish-release-process.md  # NEW
  </files>
  <action>
    Per RESEARCH § 4 + PATTERNS.md ADR 0023 section. Sister `docs/adr/0022-uninstall-and-path-traversal.md` 9-section format 100% reuse + R-5 NOT invoked (full ARCHITECTURAL ship cadence per Wave A finding). Karpathy ≤184L (sister 0022 precedent).

    Step 1: Read sister ADR 0022 for 9-section template structure (lines 1-184).
    Step 2: Create `docs/adr/0023-npm-publish-release-process.md` with these 9 sections (target ~150-180L):

    **Section 1: Title + Status** (~3L)
    ```markdown
    # ADR 0023: Phase 6.1 — npm publish release process (GitHub Actions OIDC trusted publishing + sigstore provenance)

    ## Status

    **Accepted (phase 6.1 W1 — 2026-05-22)** — Establishes permanent npm publish pipeline via OIDC trusted publishing (no NPM_TOKEN long-lived secret); locks v1.x future release cadence.
    ```

    **Section 2: Context** (~25-30L)
    - Phase 6.1 first MAJOR release (v1.0 GA)
    - 3 options: (a) npm token + 2FA local; (b) long-lived NPM_TOKEN in CI secret; (c) OIDC trusted publishing
    - D-02 LOCK selects (c) — sigstore-backed provenance is 2024+ industry standard
    - A7 守恒 paragraph (copy sister ADR 0022 L36-43 structure adapted)
    - Reference RESEARCH § 2 + RESEARCH § 4

    **Section 3: Decisions** (~25-35L)
    - `### 1. D-02 NpmPublishStrategy — OIDC trusted publishing + sigstore provenance (HIGH, deliberate)`
      - publish.yml `permissions: id-token: write` + `npm publish --provenance --access public`
      - Tag-triggered `v[0-9]+.[0-9]+.[0-9]+`
      - Sneak-blocks per D-02
    - `### 2. D-05 PackageJsonUpdate — private removal + 1.0.0 + author (MED, batch)`
      - 3 surgical changes only; all other metadata already present
    - `### 3. Fallback Path — NPM_TOKEN granular access token (documented inactive)`
      - If Trusted Publisher unavailable; env NODE_AUTH_TOKEN commented out in publish.yml

    **Section 4: A7 Conservation** (~12-18L) — copy sister ADR 0022 L104-122 verbatim adapted
    ```markdown
    ## A7 Conservation

    ADR 0001-0022 main body **untouched**; baseline tag iteration `adr-0001-accepted`…`adr-0022-accepted`
    (Phase 5.2 ship) → 加 `adr-0023-accepted` (Phase 6.1 W2 T2.10 LOCAL CREATE).

    ### CI A7 step

    `.github/workflows/ci.yml` A7 step 两处 `for n in ... 0022` → `for n in ... 0022 0023` (L90 + L101);
    step name L87 `ADR 0001-0022` → `ADR 0001-0023`; success echo L112 `0001-0022` → `0001-0023` (single extend NOT retroactive).
    ```

    **Section 5: Consequences table** (~10-15L) — sister ADR 0022 L126-136 format:
    | Capability | Delta | Verify |
    |------------|-------|--------|
    | npm publish stream | NEW `.github/workflows/publish.yml` 50-70L OIDC | tag v1.x.x push triggers `publish` workflow |
    | Provenance attestation | sigstore-backed via `--provenance` flag | npm registry shows `Provenance` badge on package page |
    | Supply-chain hardening | No long-lived NPM_TOKEN; OIDC scope per workflow run | npm registry trusted publisher entry visible |
    | Package metadata | `private: true` removed; version 1.0.0; author added | `npm view harnessed@1.0.0` returns metadata |
    | A7 守恒 | ADR 0001-0022 main body unchanged | CI A7 PASS post-tag |

    **Section 6: Compliance F-checklist** (~8-12L)
    - F1: ADR 0023 accepted (this file)
    - F2: publish.yml NEW (50-70L, SHA-pinned, OIDC)
    - F3: package.json private removal + version 1.0.0 + author
    - F4: ci.yml A7 iter 0022→0023 (both loops L90+L101 + name L87 + echo L112)
    - F5: DOGFOOD-T2.X.md PASS 3/3 axes
    - F6: RETROSPECTIVE Phase 6.1 7-section visible
    - F7: STATE.md updated 進度 21/21 100% + 当前里程碑 🎯 v1.0 GA SHIPPED + maintenance-only forward signal
    - F8: 🎯 v1.0.0 tag LOCAL CREATE (annotation 25-40L per D-04)

    **Section 7: Errata-path note** (~5-10L)
    - v1.1.0+ if continued active development: ADR 0024+ for new architectural decisions
    - If maintenance-only mode: ADR-only patches for security/critical fixes

    **Section 8: References** (~8-12L)
    - docs.npmjs.com/trusted-publishers
    - docs.npmjs.com/generating-provenance-statements
    - docs.github.com/actions/.../publishing-nodejs-packages
    - Phase 6.1 RESEARCH.md § 2 + § 4
    - Sister ADR 0020 (D-04 HYBRID 2-clock) + ADR 0022 (path-guard supply-chain context)

    **Section 9: Phase Cross-References** (~5-8L)
    - Phase 6.1 PLAN.md T1.1+T1.3+T2.2+T2.10
    - DOGFOOD-T2.X.md Axis A npm publish dry-run verify
    - ROADMAP v1.0 chapter SHIPPED row

    Step 3: Verify line count ≤184L (sister 0022 precedent). If overshoot, condense Section 2/5/6 (NOT decisions or A7).
    Step 4: Verify all 9 sections present + F1-F8 checklist enumerated.
  </action>
  <verify>
    <automated>
      test -f docs/adr/0023-npm-publish-release-process.md
      wc -l docs/adr/0023-npm-publish-release-process.md  # ≤184L Karpathy target
      grep -cE "^## (Status|Context|Decisions|A7 Conservation|Consequences|Compliance|Errata|References|Phase Cross)" docs/adr/0023-npm-publish-release-process.md  # = 9
      grep -c "OIDC" docs/adr/0023-npm-publish-release-process.md  # ≥3
      grep -c "Trusted Publish" docs/adr/0023-npm-publish-release-process.md  # ≥2
      grep -c "sigstore" docs/adr/0023-npm-publish-release-process.md  # ≥2
      grep -c "ADR 0001-0023 main body" docs/adr/0023-npm-publish-release-process.md  # ≥1 (A7 守恒)
      grep -cE "F[1-8]" docs/adr/0023-npm-publish-release-process.md  # F-checklist 8 entries
    </automated>
  </verify>
  <done>
    docs/adr/0023-npm-publish-release-process.md NEW exists; 9 sections present; line count ≤184L; OIDC + Trusted Publishing + sigstore + A7 守恒 + F1-F8 all referenced; sister 0022 format reuse verified.
  </done>
</task>

</tasks>

### Wave 1 commit (after T1.0→T1.3)
```
# T1.0 has no file artifact (external user action); commit T1.1-T1.3 together
git add package.json .github/workflows/publish.yml docs/adr/0023-npm-publish-release-process.md
git commit -m "feat(phase-6.1-w1): T1.1-T1.3 — publish.yml NEW (OIDC trusted publishing) + package.json 1.0.0 (private removal + author) + ADR 0023 NEW (npm publish release process) [D-02 + D-05]"
```

---

## § 4 Wave 2 — Close Cadence Artifacts Ship (T2.1 → T2.11)

<tasks>

<task type="auto" id="T2.1" wave="2" depends_on="T1.3">
  <name>T2.1: docs/adr/README.md — +1 entry ADR 0023 (6-line sister format)</name>
  <files>
    - docs/adr/README.md
  </files>
  <action>
    Per PATTERNS.md docs/adr/README.md section + sister existing row format. ADR 0023 added (Wave A finding YES invoke), so index table needs +1 row.

    Step 1: Read `docs/adr/README.md` to locate the index table (typically L40-63 area).
    Step 2: Append new row AFTER the existing last row (0022):
    ```markdown
    | [0023](./0023-npm-publish-release-process.md) | Phase 6.1 — npm publish release process (GitHub Actions OIDC trusted publishing + sigstore provenance + `private` removal + v1.0 GA tag) | Accepted | 2026-05-22 |
    ```
    Step 3: Update any header count text (e.g., "23 ADRs" if previously "22") if present.
    Step 4: Verify table syntax valid (column count matches header).
  </action>
  <verify>
    <automated>
      grep -c "0023-npm-publish-release-process.md" docs/adr/README.md  # = 1
      grep -c "OIDC trusted publishing" docs/adr/README.md  # ≥1
      grep -c "2026-05-22" docs/adr/README.md  # ≥1 (this row's date)
    </automated>
  </verify>
  <done>
    docs/adr/README.md has +1 row for ADR 0023; table column count valid; 0023 row references correct file + date 2026-05-22.
  </done>
</task>

<task type="auto" id="T2.2" wave="2" depends_on="T1.3">
  <name>T2.2: .github/workflows/ci.yml — A7 step iter 0022→0023 (both loops + name + echo)</name>
  <files>
    - .github/workflows/ci.yml
  </files>
  <action>
    Per RESEARCH § 5 + PATTERNS.md ci.yml section. 4 surgical edits all at A7 step (L87-112 area). Sister Phase 5.2 pattern延袭. Contingent on ADR 0023 ADDED (confirmed by T1.3).

    Step 1: Read `.github/workflows/ci.yml` to locate A7 step (search for "A7 acceptance bar" or "ADR 0001-").

    Step 2: Apply 4 edits:

    **Edit 1 (L87 step name)**:
    BEFORE: `- name: A7 acceptance bar — ADR 0001-0022 main body 守恒`
    AFTER:  `- name: A7 acceptance bar — ADR 0001-0023 main body 守恒`

    **Edit 2 (L90 first loop — missing_tags check)**:
    BEFORE: `for n in 0001 0002 0003 ... 0022; do`
    AFTER:  `for n in 0001 0002 0003 ... 0022 0023; do`
    (extend the loop list verbatim — append `0023` at end before `; do`)

    **Edit 3 (L101 second loop — diff check)**:
    BEFORE: `for n in 0001 0002 0003 ... 0022; do`
    AFTER:  `for n in 0001 0002 0003 ... 0022 0023; do`
    (identical extend; both loops must match)

    **Edit 4 (L112 success echo)**:
    BEFORE: `echo "A7 ✅ ADR 0001-0022 main body unchanged"`
    AFTER:  `echo "A7 ✅ ADR 0001-0023 main body unchanged"`

    Step 3: Verify NOT retroactive — main body of ADR 0001-0022 must remain unchanged (only loop bounds + echo strings change).

    Step 4: Verify YAML still parses + biome NOT applicable (workflow YAML; no JS lint).
  </action>
  <verify>
    <automated>
      grep -c "ADR 0001-0023 main body 守恒" .github/workflows/ci.yml  # = 1 (step name)
      grep -cE "for n in 0001.*0022 0023; do" .github/workflows/ci.yml  # = 2 (both loops)
      grep -c "A7 ✅ ADR 0001-0023 main body unchanged" .github/workflows/ci.yml  # = 1 (echo)
      ! grep -q "ADR 0001-0022 main body 守恒" .github/workflows/ci.yml  # NO old name reference
      ! grep -q "A7 ✅ ADR 0001-0022 main body unchanged" .github/workflows/ci.yml  # NO old echo
      python3 -c "import yaml; yaml.safe_load(open('.github/workflows/ci.yml'))"  # YAML parse OK
    </automated>
  </verify>
  <done>
    ci.yml A7 step: 4 edits applied (name + 2 loops + echo); all reference 0023; no stale 0022-only references at A7 step; YAML parses; ADR 0001-0022 main body untouched (only loop bounds + echo changed).
  </done>
</task>

<task type="auto" id="T2.3" wave="2" depends_on="T1.2">
  <name>T2.3: README.md — badge swap (pre-launch → npm version) + Status section update</name>
  <files>
    - README.md
  </files>
  <action>
    Per D-03 + RESEARCH § 8 + PATTERNS.md README section. Surgical update only (Karpathy minimal surface).

    Step 1: Read README.md to locate badge area (L6-8) and Status section (L40-48 area).

    Step 2: Badge area edit (L7):
    **REMOVE line 7**: `[![Status](https://img.shields.io/badge/status-pre--launch-orange)](./.planning/ROADMAP.md)`
    **REPLACE WITH**: `[![npm](https://img.shields.io/npm/v/harnessed?label=npm&color=blue)](https://npmjs.com/package/harnessed)`
    KEEP L6 (License Apache-2.0) and L8 (Sponsor) UNCHANGED.

    Step 3: Status section edit (L40-48 area — exact line numbers may have drifted, use grep to anchor):
    **REMOVE existing**:
    ```
    - **Current**: 🎯 **v0.5.0 SHIPPED 2026-05-22** (4/4 milestones close); v1.0 GA target window 2026-05-22~23 post-close per ROADMAP § v1.0
    - **Next**: Phase 6.x — v1.0 GA (🎯 v1.0 tag + npm publish + README "stable" badge; post-close independent window)
    ```
    **REPLACE WITH**:
    ```
    - **Current**: 🎯 **v1.0 GA SHIPPED 2026-05-22** (21/21 phases 100%); npm publish stream live; maintenance-only mode triggers ~2026-11 post organic clock end (per ADR 0020)
    - **Next**: v1.0+ — maintenance-only mode (~2026-11 per D-04 HYBRID 2-clock); co-maintainer organic clock running post-2026-05-22
    - **Full phase history + release plan + per-milestone audits**: [.planning/ROADMAP.md](./.planning/ROADMAP.md) / [CHANGELOG.md](./CHANGELOG.md)
    ```

    Step 4: Verify no other README sections touched (Karpathy YAGNI; D-03 LOCKED surgical only).
    Step 5: D-03 sneak-block enforcement: NO "frozen" or "abandoned" wording.
  </action>
  <verify>
    <automated>
      ! grep -q "status-pre--launch" README.md  # pre-launch badge removed
      grep -c "img.shields.io/npm/v/harnessed" README.md  # = 1 (npm version badge added)
      grep -c "v1.0 GA SHIPPED 2026-05-22" README.md  # ≥1 (Status updated)
      grep -c "21/21 phases 100%" README.md  # ≥1
      grep -c "maintenance-only mode triggers" README.md  # ≥1
      ! grep -qE "(frozen|abandoned)" README.md  # D-03 sneak-block enforce
      # License + Sponsor badges remain:
      grep -c "License-Apache_2.0-blue.svg" README.md  # = 1 (unchanged)
      grep -c "github.com/sponsors/easyinplay" README.md  # ≥1 (Sponsor unchanged)
    </automated>
  </verify>
  <done>
    README.md: pre-launch badge replaced with npm version badge (shields.io auto-tracks); Status section v1.0 GA SHIPPED + maintenance-only forward signal + ADR 0020 ref; License + Sponsor badges unchanged; D-03 sneak-block (no "frozen"/"abandoned") enforced.
  </done>
</task>

<task type="auto" id="T2.4" wave="2" depends_on="T1.2">
  <name>T2.4: CHANGELOG.md — [1.0.0] - 2026-05-22 MAJOR release entry above [0.5.0]</name>
  <files>
    - CHANGELOG.md
  </files>
  <action>
    Per D-06 + RESEARCH § 6 + PATTERNS.md CHANGELOG section. Sister Keep-a-Changelog format reuse. ADR 0023 added → ADR count = 23.

    Step 1: Read CHANGELOG.md to locate insertion point (above `## [0.5.0] - 2026-05-22`).

    Step 2: Insert new MAJOR release entry above [0.5.0]:
    ```markdown
    ## [1.0.0] - 2026-05-22

    ### Added
    - Released to npm registry — `npm install harnessed` or `npx harnessed@latest setup` now live
    - `.github/workflows/publish.yml` — tag-triggered OIDC trusted publishing + sigstore provenance (ADR 0023)
    - ADR 0023 — Phase 6.1 npm publish release process (OIDC trusted publishing + sigstore provenance architecture)
    - 21 phases complete (20/20 pre-GA + Phase 6.1 GA ship) — 23 ADRs (0001-0023)
    - 756 tests stable (CI 3-OS green: ubuntu / macOS / Windows native)

    ### Changed
    - `package.json` — `private: true` removed + version `0.3.0` → `1.0.0` + `author` field added (D-05)
    - `README.md` badge — pre-launch status badge replaced with npm version shield (auto-tracks; D-03)
    - `README.md` Status section — v1.0 GA SHIPPED 2026-05-22; npm publish stream live; maintenance-only mode forward
    - `.planning/ROADMAP.md` — Phase 6.1 row → 🎯 SHIPPED; v1.0+ Maintenance-Only Mode forward outline added (D-07)
    - `docs/MAINTAINER-ONBOARDING.md` — post-v1.0 forward visibility NOTE added (D-08)
    - `.github/workflows/ci.yml` — A7 step iter 0022→0023 (ADR 0023 baseline tag verify)

    ### Note
    - 6-month co-maintainer organic clock opened 2026-05-22 (closes ~2026-11 per ADR 0020 D-04 HYBRID 2-clock)
    - Post-clock decision: maintenance-only mode if no co-maintainer recruited; continued active if recruited + healthy
    - Forward visibility (not negative-framing): see ROADMAP.md § v1.0+ and MAINTAINER-ONBOARDING.md § Post-v1.0
    ```

    Step 3: Update footer compare link section, ADD:
    ```markdown
    [1.0.0]: https://github.com/easyinplay/harnessed/compare/v0.5.0...v1.0.0
    ```
    AND update [Unreleased] link to compare against `v1.0.0...HEAD` (was `v0.5.0...HEAD`).

    Step 4: D-06 sneak-block: NO "frozen"/"abandoned" wording (Note section explicit "Forward visibility").
  </action>
  <verify>
    <automated>
      grep -c "## \[1.0.0\] - 2026-05-22" CHANGELOG.md  # = 1
      grep -c "OIDC trusted publishing" CHANGELOG.md  # ≥1
      grep -c "23 ADRs" CHANGELOG.md  # ≥1 (ADR 0023 added)
      grep -c "6-month co-maintainer organic clock" CHANGELOG.md  # ≥1
      grep -c "\[1.0.0\]: https://github.com/easyinplay/harnessed/compare/v0.5.0...v1.0.0" CHANGELOG.md  # = 1
      grep -c "v1.0.0...HEAD" CHANGELOG.md  # = 1 (Unreleased compare updated)
      ! grep -qE "(frozen|abandoned)" CHANGELOG.md  # D-06 sneak-block
      # Order check: [1.0.0] appears BEFORE [0.5.0] (above):
      awk '/## \[1.0.0\]/{f1=NR} /## \[0.5.0\]/{f2=NR} END{exit (f1 && f2 && f1<f2) ? 0 : 1}' CHANGELOG.md
    </automated>
  </verify>
  <done>
    CHANGELOG.md: [1.0.0] - 2026-05-22 MAJOR entry inserted above [0.5.0]; Added/Changed/Note sections all present; footer compare link added + Unreleased link updated; 23 ADRs reference; D-06 sneak-block enforced.
  </done>
</task>

<task type="auto" id="T2.5" wave="2" depends_on="T2.3,T2.4">
  <name>T2.5: ROADMAP.md — v1.0 chapter row 🎯 SHIPPED + v1.0+ Maintenance-Only Mode outline (~30L)</name>
  <files>
    - .planning/ROADMAP.md
  </files>
  <action>
    Per D-07 + RESEARCH § 9 + PATTERNS.md ROADMAP section. 2 changes: update existing v1.0 chapter header to SHIPPED + ADD NEW v1.0+ outline section.

    Step 1: Read `.planning/ROADMAP.md` to locate v1.0 chapter (L289-321 per CONTEXT/RESEARCH; verify by grep).

    Step 2: Update v1.0 chapter header (sister v0.5.0 MILESTONE pattern):
    **BEFORE** (current outline-only header):
    ```markdown
    ## v1.0 — Production-ready GA + npm publish + README "stable" badge
    ```
    **AFTER**:
    ```markdown
    ## v1.0 — Production-ready GA + npm publish + README "stable" badge — 🎯 **SHIPPED 2026-05-22**

    > 🎯 **v1.0 MILESTONE 1/1 SHIPPED** (2026-05-22) — Phase 6.1 ship; 23 ADRs (0001-0023) + 23 routing rules + 18 install methods + 756 tests; npm publish stream live; README stable badge; 🎯 v1.0.0 LOCAL CREATE.

    > 9/9 GA criteria all ✅ (R8.1-R8.5 + R10.1-R10.4 verified + organic clock OPENED per ADR 0020 D-04 HYBRID)
    ```

    Step 3: Update Phase 6.1 row in v1.0 chapter table from PROGRESS (or outline) → SHIPPED with all 9 criteria ✅.

    Step 4: ADD NEW section AFTER v1.0 chapter (~30-40L):
    ```markdown
    ## v1.0+ — Maintenance-Only Mode (Forward Visibility)

    > **Note (D-04 HYBRID 2-clock per ADR 0020)**: v1.0 GA shipped 2026-05-22. External 6-month organic clock running. Post-clock decision point ~2026-11.

    ### Goal

    Operate in maintenance mode after organic clock ends. Decide continuation posture based on co-maintainer recruitment outcome.

    ### Trigger

    ~2026-11 (± buffer): organic clock end per ADR 0020 D-04 HYBRID 2-clock. Co-maintainer recruit window opened Phase 4.2 (2026-05-18); 6 months → ~2026-11-18 approximate target.

    ### Outcomes (two paths)

    **(a) Maintenance-only mode** (if no co-maintainer recruited by clock end):
    - Accept maintenance-only posture per MAINTAINER-ONBOARDING.md § Post-v1.0
    - Security patches and critical bug fixes only; no new R-series features; schema + workflow stability preserved
    - Avelino 36%/year bus factor acknowledged; honest stewardship, not negative-framing

    **(b) Continued active development** (if co-maintainer recruited + project healthy):
    - Discuss Phase 7.x scope via `/gsd-discuss-phase 7.x`
    - v1.1.x minor releases; community-driven feature roadmap
    - ADR 0024+ as needed for new architectural decisions

    ### Decision Quote

    Avelino et al.: single-maintainer projects 36%/year dropout rate. v1.0 GA is the commitment milestone; organic clock is the succession window.

    ### Scope Freeze Guard (v1.0+ rejects)

    - ❌ New workflow types beyond 3 MVP (research / execute-task / plan-feature)
    - ❌ Cloud manifest registry
    - ❌ Dashboard visualization
    - ❌ Cross-harness support (schema interface preserved, NOT implemented)
    - ❌ Detailed Phase 7.x task spec in this outline (NEW outline only per D-07; Phase 7.x discuss-phase if (b) outcome triggers)
    ```

    Step 5: D-07 sneak-block: NO detailed Phase 7.x task spec (outline-only). D-08 sneak-block: NO negative-framing (use "honest stewardship", NOT "frozen").
  </action>
  <verify>
    <automated>
      grep -c "v1.0 MILESTONE 1/1 SHIPPED" .planning/ROADMAP.md  # ≥1
      grep -c "🎯 \*\*SHIPPED 2026-05-22\*\*" .planning/ROADMAP.md  # ≥1
      grep -c "9/9 GA criteria all ✅" .planning/ROADMAP.md  # ≥1
      grep -c "## v1.0+ — Maintenance-Only Mode" .planning/ROADMAP.md  # = 1
      grep -c "Avelino" .planning/ROADMAP.md  # ≥1 (decision quote)
      grep -c "Scope Freeze Guard" .planning/ROADMAP.md  # ≥1
      ! grep -q "frozen" .planning/ROADMAP.md  # D-08 sneak-block (avoid "frozen" in v1.0+ section)
    </automated>
  </verify>
  <done>
    ROADMAP.md: v1.0 chapter header updated to SHIPPED 2026-05-22 + 9/9 criteria all ✅; NEW v1.0+ Maintenance-Only Mode outline section added (~30-40L); Avelino decision quote + Scope Freeze Guard reject list present; D-07 outline-only + D-08 no-negative-framing enforced.
  </done>
</task>

<task type="auto" id="T2.6" wave="2" depends_on="T2.5">
  <name>T2.6: docs/MAINTAINER-ONBOARDING.md — NOTE forward visibility (~5-10L)</name>
  <files>
    - docs/MAINTAINER-ONBOARDING.md
  </files>
  <action>
    Per D-08 + RESEARCH § 10 + PATTERNS.md MAINTAINER-ONBOARDING section. Additive NOTE section (~8-10L) for prospective co-maintainers.

    Step 1: Read MAINTAINER-ONBOARDING.md to locate insertion point (sister pattern: before § References section, OR end of file).

    Step 2: ADD new section:
    ```markdown
    ## Note: Post-v1.0 Maintenance-Only Mode (Forward Visibility)

    > Transparency note for prospective co-maintainers per ADR 0020 (D-04 HYBRID 2-clock).

    v1.0 GA shipped 2026-05-22. The **6-month organic co-maintainer clock is now running** (opened post-v0.4.0 per ADR 0020 D-04 HYBRID). After the recruit window closes (~2026-11), the project will enter one of two states:

    - **Co-maintainer recruited + healthy** → continued active development; Phase 7.x discuss-phase scope evaluate
    - **No co-maintainer recruited** → maintenance-only mode (security + critical bug fixes only; schema + workflow stability preserved; no new R-series features)

    This is honest project stewardship per Avelino et al. 36%/year bus factor — not negative-framing. The recruit window is **active now**. See § 招募窗口 above for the commitment level required.
    ```

    Step 3: D-08 sneak-block enforcement: NO "frozen"/"abandoned" wording. Use "honest stewardship" + "active now" forward-positive framing only.
  </action>
  <verify>
    <automated>
      grep -c "Post-v1.0 Maintenance-Only Mode" docs/MAINTAINER-ONBOARDING.md  # = 1
      grep -c "6-month organic co-maintainer clock" docs/MAINTAINER-ONBOARDING.md  # ≥1
      grep -c "Avelino" docs/MAINTAINER-ONBOARDING.md  # ≥1
      grep -c "honest project stewardship" docs/MAINTAINER-ONBOARDING.md  # ≥1
      ! grep -qE "(frozen|abandoned)" docs/MAINTAINER-ONBOARDING.md  # D-08 sneak-block enforce
    </automated>
  </verify>
  <done>
    MAINTAINER-ONBOARDING.md: NEW NOTE section added (~8-10L) referencing ADR 0020 D-04 HYBRID + 6-month clock + 2 outcome paths (recruited / not recruited) + Avelino reference; D-08 sneak-block (no "frozen"/"abandoned") enforced.
  </done>
</task>

<task type="auto" id="T2.7" wave="2" depends_on="T2.1,T2.2,T2.3,T2.4,T2.5,T2.6">
  <name>T2.7: NEW .planning/phase-6.1/DOGFOOD-T2.X.md — 3-axis empirical verify (~60-80L)</name>
  <files>
    - .planning/phase-6.1/DOGFOOD-T2.X.md  # NEW
  </files>
  <action>
    Per PATTERNS.md DOGFOOD-T*.md section + sister `.planning/phase-5.3/DOGFOOD-T2.X.md` 77L 3-axis format 100% reuse. Empirical verify post-T2.1-T2.6 commits.

    Step 1: Read sister `.planning/phase-5.3/DOGFOOD-T2.X.md` for exact format.

    Step 2: Create `.planning/phase-6.1/DOGFOOD-T2.X.md` with this structure (~60-80L target):

    ```markdown
    # DOGFOOD-T2.X — Phase 6.1 Wave 2 Empirical Verify
    # Sister: Phase 5.3 W2 DOGFOOD-T2.X.md 77L format 100% reuse adapted PRODUCTION RELEASE scope

    **Date**: 2026-05-22
    **Phase**: 6.1 Wave 2 (v1.0 GA production release)
    **Axes**: A (npm publish infra + package.json) / B (v1.0 tag annotation + release docs) / C (README + CHANGELOG + ROADMAP coherence)
    **Verdict**: PASS 3/3 axes

    ---

    ## Axis A — npm publish infra + package.json [PASS]

    | File | Lines | Sister Target | Karpathy ≤200L |
    |------|-------|---------------|----------------|
    | .github/workflows/publish.yml | <wc -l output> | ~50-70L | PASS |
    | package.json | <wc -l output> | <±5L delta> | PASS |
    | docs/adr/0023-npm-publish-release-process.md | <wc -l output> | ~150-180L (sister 0022 184L) | PASS |

    Sister format reuse verify:
    - publish.yml SHA-pinned actions ← ci.yml Phase 1.1.1 H1 pattern
    - publish.yml corepack pnpm install + build ← ci.yml standard pattern
    - publish.yml id-token: write + npm publish --provenance ← RESEARCH § 2 LOCK
    - package.json 3 surgical changes (private removal + 1.0.0 + author) ← D-05 LOCKED
    - ADR 0023 9-section ← ADR 0022 sister format 100% reuse

    Empirical run:
    - `npm pack --dry-run` → harnessed-1.0.0.tgz, <N> files, <X>kB compressed
    - `npm view harnessed` → 404 unclaimed (pre-publish) OR live (post-publish)
    - `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/publish.yml'))"` → parse OK

    ### Verdict: Axis A PASS — npm publish infra ship-ready

    ---

    ## Axis B — v1.0 tag annotation + release docs [PASS]

    | File | Lines | Sister Target | Karpathy ≤200L |
    |------|-------|---------------|----------------|
    | 🎯 v1.0.0 tag annotation (draft per RESEARCH § 7) | ~32L | D-04 25-40L | PASS |
    | CHANGELOG.md [1.0.0] entry | ~30-40L additive | D-06 sister [0.5.0] format | PASS |
    | docs/MAINTAINER-ONBOARDING.md NOTE | ~8-10L additive | D-08 ~5-10L target | PASS |

    Sister format reuse verify:
    - v1.0 tag annotation 5-section (intro + milestones + GA criteria + stats + forward) ← D-04 LOCKED structure
    - CHANGELOG [1.0.0] Added/Changed/Note ← Keep-a-Changelog [0.5.0] format
    - MAINTAINER-ONBOARDING NOTE forward visibility ← D-08 sneak-block (no "frozen"/"abandoned") enforced
    - All sneak-blocks verified clean (grep ! frozen, ! abandoned)

    ### Verdict: Axis B PASS — release docs coherent + sneak-blocks enforced

    ---

    ## Axis C — README + CHANGELOG + ROADMAP coherence [PASS]

    Cross-document coherence check:
    - README L7 npm badge URL → matches shields.io/npm/v/harnessed
    - README Status "v1.0 GA SHIPPED 2026-05-22" → matches CHANGELOG [1.0.0] - 2026-05-22 → matches ROADMAP v1.0 SHIPPED 2026-05-22 → matches STATE.md 当前里程碑 (post T2.9)
    - ADR 0020 ref in 3 docs (README Status, CHANGELOG Note, MAINTAINER-ONBOARDING NOTE) — all consistent
    - 23 ADRs count in 3 docs (CHANGELOG, ROADMAP, tag annotation) — all consistent post ADR 0023 add

    Empirical verify:
    - `grep -c "v1.0 GA SHIPPED 2026-05-22" README.md CHANGELOG.md .planning/ROADMAP.md` → ≥1 each
    - `grep -c "23 ADRs\|0001-0023" CHANGELOG.md .planning/ROADMAP.md` → consistent
    - `! grep -qE "(frozen|abandoned)" README.md CHANGELOG.md .planning/ROADMAP.md docs/MAINTAINER-ONBOARDING.md` → all clean (D-03 + D-06 + D-07 + D-08 sneak-blocks)

    ### Verdict: Axis C PASS — cross-document coherence verified

    ---

    ## Summary

    | Axis | Metric | Result |
    |------|--------|--------|
    | A | npm publish infra + package.json + ADR 0023 | PASS |
    | B | v1.0 tag annotation + release docs + sneak-blocks | PASS |
    | C | README + CHANGELOG + ROADMAP coherence | PASS |

    **Overall verdict**: PASS 3/3 — Phase 6.1 Wave 2 ship-ready; pending T2.9 STATE FINAL update + T2.10 3 tags LOCAL CREATE + user push approval.
    ```

    Step 3: Verify line count ≤90L (Karpathy ≤200L well within); 3 axes all PASS recorded; sister Phase 5.3 DOGFOOD format reuse documented.
  </action>
  <verify>
    <automated>
      test -f .planning/phase-6.1/DOGFOOD-T2.X.md
      wc -l .planning/phase-6.1/DOGFOOD-T2.X.md  # ≤90L Karpathy
      grep -c "## Axis A" .planning/phase-6.1/DOGFOOD-T2.X.md  # = 1
      grep -c "## Axis B" .planning/phase-6.1/DOGFOOD-T2.X.md  # = 1
      grep -c "## Axis C" .planning/phase-6.1/DOGFOOD-T2.X.md  # = 1
      grep -c "Verdict: Axis [ABC] PASS" .planning/phase-6.1/DOGFOOD-T2.X.md  # = 3
      grep -c "PASS 3/3" .planning/phase-6.1/DOGFOOD-T2.X.md  # ≥1
    </automated>
  </verify>
  <done>
    DOGFOOD-T2.X.md NEW: 3 axes A/B/C all PASS; line count ≤90L; sister Phase 5.3 DOGFOOD format reuse documented; cross-document coherence empirically verified.
  </done>
</task>

<task type="auto" id="T2.8" wave="2" depends_on="T2.7">
  <name>T2.8: .planning/RETROSPECTIVE.md — Phase 6.1 7-section + cross-milestone v0.5.0→v1.0 trends</name>
  <files>
    - .planning/RETROSPECTIVE.md
  </files>
  <action>
    Per sister `.planning/RETROSPECTIVE.md` Phase 5.3 7-section format (per CONTEXT.md + sister Phase 4.3 W2 T2.7 + Phase 5.3 W2 T2.8 cadence延袭).

    Step 1: Read existing RETROSPECTIVE.md to locate Phase 5.3 section + cross-milestone v0.4.0 close trends section.

    Step 2: Append NEW `## Phase 6.1 — v1.0 GA Production Release (2026-05-22)` section with 7 sub-sections (~80-100L total):

    1. **Phase Summary** (~5-8L) — v1.0 GA ship, 21/21 phases 100%, FINAL phase, scope/window, key deliverables (publish.yml + ADR 0023 + 3 tags)

    2. **What Worked** (~10-15L)
       - Wave A research SOTA — npm Trusted Publishing OIDC verified before plan-phase (eliminated NPM_TOKEN secret risk)
       - Sister cadence延袭 14 files 100% format reuse (PATTERNS.md mapped all 14)
       - 4 HIGH deliberate + 4 MED/LOW batch按推荐 discuss-phase (sister Phase 5.x cadence stable)
       - 3-layer stack methodology strict adherence per `feedback_three-layer-stack-strict.md`

    3. **What Was Inefficient** (~5-10L)
       - Wave 0 T0.1 STATE D2 iter 8 conditional (FLIP/ACCEPT/BLOCKED tree introduced complexity vs simple ACCEPT)
       - T0.3 npm publish 4-step rehearsal absorb from sister Paranoid Review (could have been Wave 0 by default not absorb)
       - npm registry external prereq (T1.0 PREREQ) unavoidable but adds blocking checkpoint

    4. **Patterns Established** (~8-12L)
       - OIDC trusted publishing pattern (publish.yml format) for future v1.x releases
       - 3 LOCAL CREATE tags ordering (ADR baseline tag + alpha.1 dual + 🎯 vN.0) for MAJOR releases
       - v1.0 tag annotation 25-40L 5-section format (intro + milestones + GA criteria + stats + forward) distinct from sister 9-line minor cadence
       - Sneak-block enforcement via grep negation patterns (! grep -q frozen|abandoned)

    5. **Key Lessons** (~5-10L)
       - npm publish is irreversible after 72h — 4-step rehearsal Wave 0 is mandatory (R-1 mitigation worked)
       - Trusted Publisher UI config is the only true human-action checkpoint (everything else CLI/API automatable)
       - Sister cadence延袭 + project memory dual-feedback strict adherence prevents methodology drift on FINAL phase

    6. **Cost Patterns** (~5-8L)
       - Plan-phase: 1 plan, 19 tasks, ~700-900L PLAN.md (sister Phase 5.3 14-task adapted +5 npm publish infra)
       - Execute-phase: 3 waves, ~50% context budget per wave estimate
       - No new src/ code (no biome lint needed; no TDD needed; pure release + infra phase)
       - 14 files modified + 2 NEW (publish.yml + ADR 0023) + 3 tags LOCAL CREATE

    7. **Cross-Milestone v0.5.0 → v1.0 Trends** (~15-20L) — NEW cross-milestone section
       - Milestone cadence: v0.1.0 → v1.0 = 10 days (2026-05-12 ~ 2026-05-22) sustained 1-day-per-milestone pace
       - ADR accumulation: 0001-0023 across 21 phases; ADR 0020 (HYBRID 2-clock) + 0022 (path-guard) + 0023 (npm OIDC) = security/governance triad
       - 9 GA criteria all ✅ first attempt (no defer; no re-scope)
       - Sister cadence延袭 ratio: 14/14 files 100% pattern reuse (highest in project history)
       - Bus factor: opening 6-month organic clock per ADR 0020 — first project to document succession window pre-actual-need
       - 三层栈 methodology: gstack governance + GSD orchestration + superpowers execution strictly held through FINAL phase

       **Trend insight**: harnessed achieved v1.0 GA via methodology rigor (PROJECT-SPEC + ROADMAP + REQUIREMENTS persistence; ADR 0001-0023 accumulation; sister cadence reuse) rather than speed-shortcuts. The 1-day-per-milestone pace was sustained by aggressive sister format reuse — NOT by skipping discovery/research/STRIDE/dogfood gates.

    Step 3: Verify section markers ## Phase 6.1 + 7 sub-sections all present; cross-milestone trends section added.
  </action>
  <verify>
    <automated>
      grep -c "## Phase 6.1 — v1.0 GA Production Release" .planning/RETROSPECTIVE.md  # = 1
      grep -cE "(Phase Summary|What Worked|What Was Inefficient|Patterns Established|Key Lessons|Cost Patterns|Cross-Milestone)" .planning/RETROSPECTIVE.md  # ≥7 (all sub-sections)
      grep -c "v0.5.0 → v1.0" .planning/RETROSPECTIVE.md  # ≥1 (cross-milestone trends section)
      grep -c "Trend insight" .planning/RETROSPECTIVE.md  # ≥1
      grep -c "0001-0023" .planning/RETROSPECTIVE.md  # ≥1 (ADR accumulation)
    </automated>
  </verify>
  <done>
    RETROSPECTIVE.md: NEW Phase 6.1 section with 7 sub-sections (Summary + Worked + Inefficient + Patterns + Lessons + Cost + Cross-Milestone Trends) all present; v0.5.0 → v1.0 trends section documents methodology rigor over speed-shortcuts; sister Phase 5.3 7-section format reused.
  </done>
</task>

<task type="auto" id="T2.9" wave="2" depends_on="T2.8">
  <name>T2.9: .planning/STATE.md — FINAL post-v1.0 GA update (進度 21/21 100% + 🎯 v1.0 GA SHIPPED + maintenance-mode forward)</name>
  <files>
    - .planning/STATE.md
  </files>
  <action>
    Per PATTERNS.md STATE.md section + STRIDE ordering (T-4.3-07): STATE.md update LAST among all artifact commits BEFORE T2.10 tags. R-5 mitigation: explicit "v1.0 SHIPPED frozen mode" graduation wording.

    Step 1: Read current STATE.md (post-T0.1 trim line count).

    Step 2: Update 当前位置 (Current Position) section:
    ```markdown
    ## 当前位置（Current Position）

    - **GSD phase**: ✅ **Phase 6.1 SHIPPED** (2026-05-22) — 🎯 v1.0 GA PRODUCTION RELEASE FINAL phase
    - **当前里程碑**: **🎯 v1.0 GA 1/1 SHIPPED & ARCHIVED** 2026-05-22 — npm publish stream live, README stable badge, CHANGELOG [1.0.0], ROADMAP v1.0 SHIPPED, ADR 0023 accepted, 3 tags LOCAL CREATE (adr-0023-accepted + v1.0.0-alpha.1-release-prep + 🎯 v1.0.0)
    - **下一 phase**: **v1.0+ Maintenance-Only Mode** — organic clock running 2026-05-22 ~ ~2026-11; post-clock decision (a) maintenance-only or (b) continued active per ADR 0020 D-04 HYBRID
    - **状態**: ✅ **Phase 6.1 SHIPPED 2026-05-22** — 21/21 phases 100%; FINAL phase per ROADMAP v1.0 chapter; v1.0 GA frozen mode (no R-series additions; security + critical patches only until co-maintainer recruited)
    - **進度**: 21 / 21 phases ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ **100%** (v0.1.0 + v0.2.0 + v0.3.0 + v0.4.0 + v0.5.0 + 🎯 **v1.0 GA** ALL SHIPPED & ARCHIVED)
    ```

    Step 3: Update milestone table (sister format) — add v1.0 GA row:
    ```markdown
    | v1.0 GA production release | 1/1 | 🎯 **SHIPPED & ARCHIVED** — Phase 6.1 ✅ (publish.yml NEW OIDC + package.json 1.0.0 + CHANGELOG [1.0.0] + README stable badge + ROADMAP v1.0 SHIPPED + ADR 0023 + 🎯 v1.0.0 tag) | 2026-05-22 |
    ```

    Step 4: Add R-5 explicit graduation signal block (sister Phase 5.3 cadence pattern):
    ```markdown
    <!-- v1.0 GA SHIPPED 2026-05-22 — Phase 6.1 W2 T2.9 STATE FINAL update + maintenance-mode forward signal recorded.
         D2 cadence iter 8 = TERMINUS (Phase 6.1 W0 T0.1; 8-iter graduation confirmed beyond ≥6-iter implicit graduation; #BS retire signal).
         Post-v1.0 STATE enters maintenance freeze: no more D2 iter cadence; maintenance-only mode wording per D-08 forward visibility (NOT immediate per sneak-block).
         Next STATE update: organic clock end (~2026-11) outcome decision (a) maintenance-only or (b) Phase 7.x discuss-phase. -->
    ```

    Step 5: Verify STATE.md line count ≤145L (Karpathy budget; T0.2 SIZE_LIMIT target satisfied).
    Step 6: D-08 sneak-block: NO "frozen"/"abandoned" wording in user-facing sections (use "frozen mode" inside an internal comment block ONLY if needed; otherwise prefer "maintenance-only mode" phrasing).
  </action>
  <verify>
    <automated>
      wc -l .planning/STATE.md  # ≤145L Karpathy
      grep -c "🎯 v1.0 GA 1/1 SHIPPED" .planning/STATE.md  # ≥1
      grep -c "21 / 21 phases" .planning/STATE.md  # ≥1
      grep -c "100%" .planning/STATE.md  # ≥1
      grep -c "v1.0+ Maintenance-Only Mode" .planning/STATE.md  # ≥1 (下一 phase)
      grep -c "ADR 0020" .planning/STATE.md  # ≥1 (HYBRID 2-clock ref)
      grep -c "D2 cadence iter 8 = TERMINUS" .planning/STATE.md  # ≥1 (R-5 graduation signal)
      # Sneak-block: user-facing sections must not contain "abandoned":
      ! grep -q "abandoned" .planning/STATE.md
      # YAML frontmatter still valid:
      head -10 .planning/STATE.md | grep -E "^---$" | wc -l  # = 1 (open) — close marker elsewhere
    </automated>
  </verify>
  <done>
    STATE.md FINAL: 進度 21/21 100% + 当前里程碑 🎯 v1.0 GA SHIPPED + 下一 phase maintenance-only mode + D2 iter 8 TERMINUS graduation signal + ADR 0020 reference; line count ≤145L; D-08 sneak-block enforced (no "abandoned" in user-facing); ready for T2.10 tags.
  </done>
</task>

<task type="checkpoint:human-verify" id="T2.10" wave="2" depends_on="T2.9" gate="blocking">
  <name>T2.10: 3 tags LOCAL CREATE (adr-0023-accepted + v1.0.0-alpha.1-release-prep + 🎯 v1.0.0) — LOCAL CREATE ONLY, NO PUSH</name>
  <what-built>
    Per PATTERNS.md tag sections + STRIDE ordering (T-4.3-07) + sister Phase 5.x dual-tag延袭 + ADR sister tag = 3 tags total. R-5 NOT invoked (Wave A finding) → full ARCHITECTURAL cadence applies → all 3 tags required.

    Tags to LOCAL CREATE (in this exact order):
    1. **adr-0023-accepted** (annotated, ~3L sister 0022 cadence)
    2. **v1.0.0-alpha.1-release-prep** (annotated, ~10-15L sister Phase 5.x dual-tag延袭 release prep tag)
    3. **🎯 v1.0.0** (annotated, ~30-35L D-04 LOCKED 25-40L 5-section structure per RESEARCH § 7 draft)

    Step 1: Verify ALL Wave 2 commits T2.1-T2.9 are COMPLETE on local branch (STATE.md FINAL committed last).

    Step 2: Tag 1 — adr-0023-accepted:
    ```bash
    git tag -a adr-0023-accepted -m "adr-0023-accepted baseline — ADR 0023 Phase 6.1 npm publish OIDC trusted publishing + sigstore provenance accepted
    Phase 6.1 W2 T2.10 LOCAL CREATE
    ci.yml A7 step iter 0022 → 0023 verified (both loops L90+L101 + name L87 + echo L112)"
    ```

    Step 3: Tag 2 — v1.0.0-alpha.1-release-prep (sister Phase 5.x release-prep dual-tag pattern):
    ```bash
    git tag -a v1.0.0-alpha.1-release-prep -m "v1.0.0-alpha.1 release prep — Phase 6.1 W2 T2.10 LOCAL CREATE
    Pre-release prep tag for v1.0 GA;NOT a publish trigger (regex v[0-9]+.[0-9]+.[0-9]+ in publish.yml excludes alpha suffix).
    Sister Phase 5.x dual-tag延袭: alpha.N release-prep tag created LOCAL → 🎯 vN.0 tag created LOCAL → user push approval gates actual ship.
    Phase 6.1 final ADR count: 23 (0001-0023). Tests: 756 PASS. CI 3-OS green."
    ```

    Step 4: Tag 3 — 🎯 v1.0.0 (D-04 LOCKED 25-40L annotation per RESEARCH § 7 draft, refined):
    ```bash
    git tag -a v1.0.0 -m "🎯 harnessed v1.0 GA — production-ready stable release — 2026-05-22
    AI coding harness package manager + composition orchestrator (Apache-2.0).
    First MAJOR release: npm publish stream live; README stable badge; 21/21 phases 100%.

    Milestone journey (5 milestones, 10 days 2026-05-12~22):
      v0.1.0 — manifest engine + research workflow + routing engine v1
      v0.2.0 — execute-task + ralph-loop + 4 extension installers
      v0.3.0 — plan-feature + checkpoint + gstack probe + aliases + routing ≥85%
      v0.4.0 — dogfooding benchmark + co-maintainer infra + ADR full set + audit log
      v0.5.0 — audit log consumer + state lock + uninstall CLI + path traversal hardening

    9 GA criteria all ✅:
      ✅ R8.1-R8.5 all SHIPPED (v0.4.0 MILESTONE 2026-05-19)
      ✅ R10.1-R10.4 all SHIPPED (v0.5.0 MILESTONE 2026-05-22)
      ✅ Organic co-maintainer clock OPENED 2026-05-22 (ADR 0020 D-04 HYBRID 2-clock; ~2026-11 close)
      ✅ Tests 756 PASS + CI 3-OS full green (ubuntu + macOS + Windows)
      ✅ Benchmark public (docs/benchmarks/v0.4.md 30-task full disclosure)
      ✅ Security audit (path-guard OWASP A1 5-vector ADR 0022; OIDC trusted publishing ADR 0023)
      ✅ Docs production-ready (README + PROJECT-SPEC + CONTRIBUTING + MAINTAINER-ONBOARDING)
      ✅ npm publish stream live (publish.yml OIDC + provenance + sigstore)
      ✅ README stable badge (pre-launch → npm version shield auto-tracks)

    Accumulated: 23 ADRs (0001-0023) | 21 phases | 23 routing rules | 18 install methods | 756 tests
    npm package live at https://npmjs.com/package/harnessed (post-tag-push)

    6-month organic clock open post-2026-05-22 (co-maintainer recruit window per ADR 0020 D-04 HYBRID);
    maintenance-only mode triggers ~2026-11 if no co-maintainer. Future v1.x releases auto-publish via this tag's workflow.

    \"Avelino et al.: single-maintainer 36%/year — we document the risk, not pretend it away.\"
    License: Apache-2.0 | Sponsor: https://github.com/sponsors/easyinplay
    Co-maintainer window open — see docs/MAINTAINER-ONBOARDING.md § Post-v1.0"
    ```

    Step 5: Verify tag annotation line counts:
    - adr-0023-accepted: ~3L ✅
    - v1.0.0-alpha.1-release-prep: ~6-8L (within sister Phase 5.x cadence) ✅
    - v1.0.0: 30-35L (within D-04 LOCKED 25-40L) ✅

    Step 6: List all 3 LOCAL tags created:
    ```bash
    git tag -l "adr-0023-accepted" "v1.0.0-alpha.1-release-prep" "v1.0.0" --format='%(refname:short) %(taggerdate:short) %(subject)' | head -10
    ```

    Step 7: **DO NOT PUSH** any of the 3 tags. R-1 mitigation: tag push (especially v1.0.0) triggers publish.yml workflow → actual irreversible npm publish. User approval REQUIRED.
  </what-built>
  <how-to-verify>
    1. Run locally: `git tag -l "adr-0023-accepted" "v1.0.0-alpha.1-release-prep" "v1.0.0"` — should list all 3 tags.
    2. Run: `git show v1.0.0` — verify annotation matches 5-section D-04 LOCKED structure (intro + milestones + GA criteria + stats + forward + signature).
    3. Run: `git show adr-0023-accepted` — verify A7 baseline annotation.
    4. Run: `git show v1.0.0-alpha.1-release-prep` — verify release prep annotation.
    5. Confirm NO push performed yet (`git push --dry-run --tags` — visualize what WOULD push without executing).

    **NEXT STEP after user approval**: User runs `git push origin v1.0.0` (or push all tags) → publish.yml workflow triggers → npm package `harnessed@1.0.0` LIVE on npmjs.com → README shields.io npm version badge auto-tracks → v1.0 GA actual ship complete.

    **R-1 mitigation reminder**: Once `git push origin v1.0.0` is executed AND publish.yml succeeds AND npm registry accepts publish, version 1.0.0 cannot be re-published. Treat as irreversible.
  </how-to-verify>
  <resume-signal>
    Type "tags verified, ready to push" → user manually pushes (Claude does NOT auto-push per CLAUDE.md commit safety).
    Type "tag annotation needs refinement: <details>" → revise per feedback.
    Type "BLOCKED: <reason>" → escalate.
  </resume-signal>
  <done>
    3 tags LOCAL CREATE complete: adr-0023-accepted (~3L) + v1.0.0-alpha.1-release-prep (~6-8L) + 🎯 v1.0.0 (30-35L D-04 5-section); STRIDE ordering enforced (all T2.1-T2.9 commits BEFORE tags); user notified push approval pending; R-1 irreversibility reminder issued.
  </done>
</task>

<task type="auto" id="T2.11" wave="2" depends_on="T2.10">
  <name>T2.11: Phase 6.1 W2 SUMMARY commit + final CI gates verify locally</name>
  <files>
    - .planning/phase-6.1/PHASE-6.1-SUMMARY.md  # NEW (sister phase summary cadence)
  </files>
  <action>
    Per sister phase SUMMARY cadence (each phase ships with SUMMARY.md per `<output>` field of standard PLAN.md template). Final commit closes Phase 6.1.

    Step 1: Create `.planning/phase-6.1/PHASE-6.1-SUMMARY.md` (~60-100L):
    ```markdown
    # Phase 6.1 SUMMARY — 🎯 v1.0 GA Production Release SHIPPED

    **Date**: 2026-05-22
    **Phase**: 6.1 (FINAL phase; v1.0 GA milestone 1/1)
    **Status**: ✅ SHIPPED — pending user push approval to trigger npm publish

    ## What Shipped (Wave 0 → Wave 1 → Wave 2)

    ### Wave 0 (planning/verify/rehearsal — 4 tasks)
    - T0.1 STATE D2 iter 8 TERMINUS trim Phase 5.3 narrative → RETROSPECTIVE archive ✅
    - T0.2 #BA SIZE_LIMIT round 5 conditional final (FLIP/ACCEPT/BLOCKED tree → <decision>) ✅
    - T0.3 npm publish 4-step rehearsal PASS (npm pack + .npmignore + npm publish --dry-run + npm view) ✅
    - T0.4 baseline gate verify 756 tests PASS ✅

    ### Wave 1 (infrastructure + config + ADR — 4 tasks)
    - T1.0 PREREQ external user setup verified (npm Trusted Publisher OR NPM_TOKEN fallback) ✅
    - T1.1 .github/workflows/publish.yml NEW <wc -l>L OIDC trusted publishing ✅
    - T1.2 package.json 3 surgical changes (private removal + version 1.0.0 + author easyinplay) ✅
    - T1.3 docs/adr/0023-npm-publish-release-process.md NEW <wc -l>L sister 0022 9-section ✅

    ### Wave 2 (close cadence — 11 tasks)
    - T2.1 docs/adr/README.md +1 entry ADR 0023 ✅
    - T2.2 ci.yml A7 step iter 0022→0023 (4 edits: name + 2 loops + echo) ✅
    - T2.3 README.md badge swap (pre-launch → npm version) + Status v1.0 GA SHIPPED ✅
    - T2.4 CHANGELOG.md [1.0.0] - 2026-05-22 MAJOR release entry ✅
    - T2.5 ROADMAP.md v1.0 chapter SHIPPED + v1.0+ Maintenance-Only Mode outline (~30-40L) ✅
    - T2.6 MAINTAINER-ONBOARDING.md NOTE forward visibility (~8-10L) ✅
    - T2.7 DOGFOOD-T2.X.md NEW 3-axis PASS empirical verify ✅
    - T2.8 RETROSPECTIVE.md Phase 6.1 7-section + cross-milestone v0.5.0→v1.0 trends ✅
    - T2.9 STATE.md FINAL post-v1.0 GA update (進度 21/21 100% + 🎯 v1.0 GA SHIPPED) ✅
    - T2.10 3 tags LOCAL CREATE (adr-0023-accepted + v1.0.0-alpha.1-release-prep + 🎯 v1.0.0) ✅
    - T2.11 SUMMARY + final CI gates verify (this task) ✅

    ## Karpathy Budget Verdict
    All files ≤200L hard limit; ADR 0023 ≤184L sister precedent; STATE.md ≤145L post-trim.

    ## Final CI gates verified locally
    - `corepack pnpm test`: 756 PASS ✅
    - `node scripts/check-state-archive-stale.mjs`: PASS ✅
    - `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/publish.yml'))"`: parse OK ✅
    - `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/ci.yml'))"`: parse OK ✅
    - All sneak-blocks verified (! grep -q "frozen|abandoned" across user-facing docs) ✅

    ## Pending User Action
    1. User reviews 3 LOCAL tags via `git show <tag>` for each
    2. User pushes when ready: `git push origin main && git push origin v1.0.0 adr-0023-accepted v1.0.0-alpha.1-release-prep`
    3. Tag push triggers `publish.yml` workflow → npm publish provenance → harnessed@1.0.0 live on npmjs.com
    4. CI 3-OS green verify post-push
    5. README npm version badge auto-tracks once registry index updates

    ## Cross-References
    - PLAN.md: this phase plan
    - PATTERNS.md: 14 files sister cadence map
    - RESEARCH.md: Wave A npm Trusted Publishing OIDC + ADR 0023 invoke YES
    - 6.1-CONTEXT.md: 8 D-decisions LOCKED
    - DOGFOOD-T2.X.md: 3-axis empirical PASS

    **End of harnessed v0.x → v1.0 GA build cycle. 21/21 phases 100%. Forward: maintenance-only mode or Phase 7.x discuss-phase per organic clock outcome (~2026-11).**
    ```

    Step 2: Final CI gates verify locally (idempotent re-run of T0.4 + new gates):
    ```bash
    corepack pnpm test
    node scripts/check-state-archive-stale.mjs
    python3 -c "import yaml; yaml.safe_load(open('.github/workflows/publish.yml'))"
    python3 -c "import yaml; yaml.safe_load(open('.github/workflows/ci.yml'))"
    pnpm exec biome check . 2>&1 | tail -10  # baseline — no TS/JS src changed
    ```

    Step 3: Final commit (sister cadence per request):
    ```bash
    git add .planning/phase-6.1/PHASE-6.1-SUMMARY.md
    git commit -m "docs(phase-6.1-plan): PLAN.md ship (Phase 6.1 v1.0 GA production release plan + SUMMARY)"
    ```
    (NOTE: The PLAN.md itself was committed at plan-phase write time per orchestrator cadence; T2.11 commit is the W2 close summary commit.)
  </action>
  <verify>
    <automated>
      test -f .planning/phase-6.1/PHASE-6.1-SUMMARY.md
      wc -l .planning/phase-6.1/PHASE-6.1-SUMMARY.md  # ≤120L Karpathy
      grep -c "Pending User Action" .planning/phase-6.1/PHASE-6.1-SUMMARY.md  # = 1
      grep -c "git push origin v1.0.0" .planning/phase-6.1/PHASE-6.1-SUMMARY.md  # ≥1
      grep -c "21/21 phases 100%" .planning/phase-6.1/PHASE-6.1-SUMMARY.md  # ≥1
      # Final CI gates re-run:
      corepack pnpm test 2>&1 | tail -5 | grep -E "(756 passed|Tests:.*756)"
      node scripts/check-state-archive-stale.mjs
      python3 -c "import yaml; yaml.safe_load(open('.github/workflows/publish.yml'))"
    </automated>
  </verify>
  <done>
    PHASE-6.1-SUMMARY.md NEW ≤120L; all 19 tasks across 3 waves recorded ✅; final CI gates locally PASS (756 tests + state archive + YAML parses); pending user push approval documented; Phase 6.1 W2 close commit applied.
  </done>
</task>

</tasks>

### Wave 2 commits (T2.1-T2.9, then T2.11)
```
# Sub-commit A (T2.1+T2.2 ADR index + ci.yml A7 iter):
git add docs/adr/README.md .github/workflows/ci.yml
git commit -m "docs(phase-6.1-w2): T2.1+T2.2 — docs/adr/README +1 entry 0023 + ci.yml A7 step iter 0022→0023 (sister Phase 5.2 cadence)"

# Sub-commit B (T2.3 README badge swap):
git add README.md
git commit -m "docs(phase-6.1-w2): T2.3 — README.md badge swap (pre-launch → npm version) + Status section v1.0 GA SHIPPED [D-03]"

# Sub-commit C (T2.4 CHANGELOG):
git add CHANGELOG.md
git commit -m "docs(phase-6.1-w2): T2.4 — CHANGELOG.md [1.0.0] - 2026-05-22 MAJOR release entry [D-06]"

# Sub-commit D (T2.5 ROADMAP):
git add .planning/ROADMAP.md
git commit -m "docs(phase-6.1-w2): T2.5 — ROADMAP.md v1.0 chapter SHIPPED + v1.0+ Maintenance-Only Mode outline NEW [D-07]"

# Sub-commit E (T2.6 MAINTAINER-ONBOARDING):
git add docs/MAINTAINER-ONBOARDING.md
git commit -m "docs(phase-6.1-w2): T2.6 — MAINTAINER-ONBOARDING.md Post-v1.0 NOTE forward visibility [D-08]"

# Sub-commit F (T2.7 DOGFOOD):
git add .planning/phase-6.1/DOGFOOD-T2.X.md
git commit -m "docs(phase-6.1-w2): T2.7 — DOGFOOD-T2.X.md NEW 3-axis PASS empirical verify (sister Phase 5.3 format)"

# Sub-commit G (T2.8 RETROSPECTIVE):
git add .planning/RETROSPECTIVE.md
git commit -m "docs(phase-6.1-w2): T2.8 — RETROSPECTIVE.md Phase 6.1 7-section + cross-milestone v0.5.0→v1.0 trends NEW"

# Sub-commit H (T2.9 STATE FINAL — STRIDE ordering LAST among doc commits):
git add .planning/STATE.md
git commit -m "docs(phase-6.1-w2): T2.9 — STATE.md FINAL post-v1.0 GA (進度 21/21 100% + 🎯 v1.0 GA SHIPPED + maintenance-only mode forward + D2 iter 8 TERMINUS graduation)"

# Sub-commit I (T2.11 SUMMARY):
git add .planning/phase-6.1/PHASE-6.1-SUMMARY.md
git commit -m "docs(phase-6.1-plan): PHASE-6.1-SUMMARY.md NEW — v1.0 GA W2 close + push approval pending"

# T2.10 tags LOCAL CREATE (NO PUSH per CLAUDE.md commit safety):
git tag -a adr-0023-accepted -m "..."
git tag -a v1.0.0-alpha.1-release-prep -m "..."
git tag -a v1.0.0 -m "..."

# User push approval required:
#   git push origin main
#   git push origin v1.0.0 adr-0023-accepted v1.0.0-alpha.1-release-prep
# Tag v1.0.0 push triggers publish.yml workflow → npm publish provenance → harnessed@1.0.0 live
```

---

## § 5 Verification + Acceptance Criteria (v1.0 GA SHIPPED definition)

<verification>
**v1.0 GA SHIPPED verify checklist** (all must PASS for phase ✅):

### Code/Config
- [ ] `package.json`: `private` absent + `version: "1.0.0"` + `author: "easyinplay"` present; lockfile no drift
- [ ] `.github/workflows/publish.yml` exists ≤70L; OIDC `id-token: write` + tag regex `v[0-9]+.[0-9]+.[0-9]+` + `npm publish --provenance --access public` + SHA-pinned actions; YAML parses
- [ ] `.github/workflows/ci.yml` A7 step: 4 edits applied (L87 name + L90 loop + L101 loop + L112 echo); reference `0001-0023`; YAML parses

### ADR & Docs
- [ ] `docs/adr/0023-npm-publish-release-process.md` NEW ≤184L; 9 sections present; OIDC + Trusted Publishing + sigstore + A7 Conservation + F1-F8 all referenced
- [ ] `docs/adr/README.md` index +1 row for ADR 0023 (Accepted 2026-05-22)
- [ ] `README.md`: pre-launch badge removed; npm version badge added; Status section v1.0 GA SHIPPED 2026-05-22 + maintenance-only mode forward; no "frozen"/"abandoned"
- [ ] `CHANGELOG.md`: [1.0.0] - 2026-05-22 entry above [0.5.0]; footer compare link; 23 ADRs; no sneak-block violations
- [ ] `.planning/ROADMAP.md`: v1.0 chapter header SHIPPED 2026-05-22 + 9/9 criteria ✅; NEW v1.0+ Maintenance-Only Mode outline section (~30-40L) with Avelino quote + Scope Freeze Guard
- [ ] `docs/MAINTAINER-ONBOARDING.md`: NEW Post-v1.0 NOTE section (~8-10L) referencing ADR 0020 D-04 HYBRID + 2-outcome paths; no negative-framing
- [ ] `.planning/phase-6.1/DOGFOOD-T2.X.md` NEW ≤90L; 3 axes A/B/C all PASS; cross-document coherence verified
- [ ] `.planning/RETROSPECTIVE.md`: NEW Phase 6.1 7-section + cross-milestone v0.5.0→v1.0 trends section; methodology rigor over speed-shortcuts insight
- [ ] `.planning/STATE.md` FINAL ≤145L: 進度 21/21 100% + 🎯 v1.0 GA SHIPPED + maintenance-only mode forward + D2 iter 8 TERMINUS graduation + ADR 0020 ref
- [ ] `.planning/phase-6.1/PHASE-6.1-SUMMARY.md` NEW ≤120L: all 19 tasks recorded + pending user push approval

### Tags & Release
- [ ] 3 tags LOCAL CREATE (NO PUSH yet): `adr-0023-accepted` (~3L) + `v1.0.0-alpha.1-release-prep` (~6-8L) + `🎯 v1.0.0` (30-35L per D-04 5-section)
- [ ] `git tag -l "adr-0023-accepted" "v1.0.0-alpha.1-release-prep" "v1.0.0"` lists all 3

### Gates
- [ ] `corepack pnpm test`: 756 PASS (zero regression — no src/ change in Phase 6.1)
- [ ] `node scripts/check-state-archive-stale.mjs`: PASS
- [ ] YAML parse both `publish.yml` + `ci.yml`: OK
- [ ] `pnpm exec biome check .`: clean (no TS/JS src changed; baseline)
- [ ] All sneak-blocks enforced via grep negation (no "frozen"/"abandoned" in user-facing docs)

### Post-push verification (deferred until user approves push)
- [ ] CI Win+Linux+macOS all green on `main` push (3-OS)
- [ ] `publish.yml` workflow triggered on `v1.0.0` tag push; npm publish provenance succeeds
- [ ] `npm view harnessed` returns `1.0.0` + provenance attestation visible
- [ ] README shields.io npm version badge auto-tracks (post-publish index refresh)
- [ ] Phase 6.1 SUMMARY.md "Pending User Action" all items checked
</verification>

<success_criteria>
**Phase 6.1 ✅ SHIPPED** when ALL of these are TRUE:

1. **All 19 tasks COMPLETE** (T0.1-T0.4 + T1.0-T1.3 + T2.1-T2.11), each `<done>` verified
2. **3 tags LOCAL CREATE** (NOT pushed; user approval gates push); annotations match D-04 5-section structure
3. **All ≤200L Karpathy budget** for all NEW/MODIFIED files (ADR 0023 ≤184L sister precedent; STATE.md ≤145L)
4. **Tests 756 PASS** (zero regression; pure release/infra phase no src change)
5. **All sneak-blocks enforced** (no "frozen"/"abandoned" in user-facing docs; D-03+D-06+D-07+D-08)
6. **Cross-document coherence**: README + CHANGELOG + ROADMAP + STATE + tag annotation all reference v1.0 GA SHIPPED 2026-05-22 + 23 ADRs + 21/21 phases + ADR 0020 D-04 HYBRID
7. **STRIDE ordering enforced**: T2.1-T2.9 all doc commits BEFORE T2.10 tag LOCAL CREATE; STATE.md FINAL last among doc commits
8. **User push approval pending** for actual v1.0 GA ship (R-1 irreversibility mitigation)
9. **9 GA criteria all ✅** documented in tag annotation + CHANGELOG + ROADMAP
10. **Phase 6.1 = FINAL phase** marked in STATE + RETROSPECTIVE + SUMMARY
</success_criteria>

---

## § 6 Risk Matrix R-1 to R-5

| Risk | Level | Description | Mitigation (Phase 6.1 Plan) |
|------|-------|-------------|-----------------------------|
| **R-1** | HIGH | npm publish irreversible (after 72h cannot unpublish; first publish of v1.0.0 claims package name permanently) | **T0.3 4-step rehearsal Wave 0** (npm pack dry-run + .npmignore review + npm publish --dry-run + npm view name claim 404 verify) + **T2.10 LOCAL CREATE only** (NO auto-push; user approval gates actual ship); R-1 reminder issued in T2.10 checkpoint |
| **R-2** | MED | OIDC Trusted Publishers UI config complexity (manual external prereq before tag push; if misconfigured, publish workflow fails) | **T1.0 PREREQ blocking checkpoint** — user manually configures npmjs.com Trusted Publisher (easyinplay/harnessed/publish.yml) OR fallback NPM_TOKEN secret BEFORE W1 starts; both paths documented in ADR 0023 § Decision |
| **R-3** | LOW | ADR 0023 ≤200L Karpathy budget (borderline; sister 0022 184L precedent) | **T1.3 strict 9-section sister 0022 format reuse**; A7 Conservation copy verbatim adapted; Karpathy target ≤184L (stay at-or-under sister precedent); condense Section 2/5/6 if overshoot (NOT Decisions/A7) |
| **R-4** | LOW | 🎯 v1.0 tag annotation 25-40L Karpathy budget (D-04 5 sections strict) | **T2.10 RESEARCH § 7 draft ~32L** within budget; 5-section structure locked (intro 3L + milestones 5L + GA criteria 9L + stats 5L + forward 5L + signature 3-5L); refine but preserve structure |
| **R-5** | LOW | STATE post-v1.0 maintenance freeze decision (D2 iter 8 = TERMINUS; explicit graduation signal needed; R-5 NOT invoked per Wave A means full ARCHITECTURAL cadence required — 3 tags + ADR 0023 + A7 iter all required) | **T0.1** trim Phase 5.3 narrative → RETROSPECTIVE (iter 8 graduation); **T2.9** explicit "maintenance-only mode forward signal" wording in STATE 当前位置 + D2 iter 8 TERMINUS comment block; **full ARCHITECTURAL cadence** confirmed (ADR 0023 + A7 iter + 3 tags all present) per Wave A finding "R-5 NOT invoked → full cadence applies" |

### Top 2 risks (per request)
1. **R-1 HIGH npm publish irreversible** — Mitigated by 4-step rehearsal Wave 0 + LOCAL CREATE only tags + user approval gate
2. **R-2 MED OIDC UI config** — Mitigated by T1.0 PREREQ blocking checkpoint + documented fallback NPM_TOKEN path

---

## § 7 Wave 0 Absorb Rationale (sister T3+T4+T5 absorb)

Per Wave A finding "R-5 NOT invoked → full ARCHITECTURAL cadence applies" + sister Paranoid Review 5th-cycle absorb:

| Sister Task | Origin | Phase 6.1 Plan Absorb Location | Rationale |
|-------------|--------|--------------------------------|-----------|
| T3 npm publish 4-step rehearsal | Sister Paranoid Review pattern | **T0.3** Wave 0 | Pre-W1 verification of tarball + name claim + dry-run before any package.json change; R-1 mitigation in earliest wave |
| T4 STATE post-v1.0 maintenance freeze | Sister Paranoid Review pattern | **T2.9** Wave 2 explicit wording | "v1.0 GA SHIPPED" + "maintenance-only mode forward" + "D2 iter 8 TERMINUS graduation" all in STATE 当前位置 + comment block |
| T5 R-5 invoke decision | Sister Paranoid Review pattern | **NOT invoked** per Wave A (RESEARCH § 4 + PATTERNS.md L539-549 confirm YES invoke ADR 0023 = full ARCHITECTURAL cadence required) | Full cadence = ADR 0023 + A7 iter + 3 tags (adr-0023-accepted + v1.0.0-alpha.1-release-prep + 🎯 v1.0.0) all present; T2 ABBREVIATED close cadence path NOT taken |

**Conclusion**: T3 absorbed Wave 0 (rehearsal); T4 absorbed Wave 2 (STATE explicit wording); T5 NOT invoked (full cadence applies per sister Paranoid Review 5th-cycle convergence with Wave A finding). 19 total tasks reflect full ARCHITECTURAL release cadence, not abbreviated close ceremony.

---

## Output

After Phase 6.1 W2 close commit (T2.11), create `.planning/phase-6.1/PHASE-6.1-SUMMARY.md` (handled by T2.11 itself).

After user push approval and successful npm publish trigger:
- Update STATE.md (post-push update — out of Phase 6.1 plan scope; that update is the FIRST maintenance-only mode entry).
- Verify CI 3-OS green + publish.yml run green + npm view harnessed = 1.0.0 + README shields.io npm badge auto-tracks.

**End of Phase 6.1 PLAN.md. FINAL phase of harnessed v0.x → v1.0 GA cycle.**
