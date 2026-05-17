# Phase 3.4 — task_plan.md

> **Authored**: 2026-05-17
> **Author**: gsd-planner (Wave B)
> **Sources**: CONTEXT.md D-01~D-04 + W0 5 项 backlog + KICKOFF § 1-6 + PATTERNS § 1-5 (17 analog targets 100% sister hit) + RESEARCH § 1-17 (HIGH confidence; doctor.ts 195L 实测 + 30-sample mining git log 331 commits feasibility verified + W0.4 path traversal NOT real verified + sister v0.2.0-MILESTONE-AUDIT.md 150L 6-section template gold-standard) + sister phase-3.3/task_plan.md atomic structure
> **Style**: 沿袭 phase-3.3/task_plan.md per-task structure (files_modified / read_first / action concrete values / acceptance_criteria grep-verifiable / decision_source)
> **Task count**: 5 atomic tasks Wave 0 (T0.1 STRATEGIC FIRST 必修 + T0.2 #AD + T0.3 #AC + T0.4 #AE + T0.5 SAMPLES.md) — Plan 02 covers W1 6-task (helper + doctor + harness + tests) and Plan 03 covers W2 11-task (ADR + milestone close + tags); total Phase 3.4 = 5 + 6 + 11 = 22 atomic tasks across 3 Wave/3 Plan per orchestrator brief budget
> **Hard limit verify**: every code-producing task 含 `wc -l ≤ N` acceptance criterion (Karpathy ≤200L hard limit B-06 / B-26)

> ⚠️ **D-decision 守门** (4 decisions LOCKED, executor 防 sneak-in per PATTERNS § 3):
> - **D-01 REAL HISTORICAL** locked → SYNTHETIC SPEC + MIXED 20+10 不可 sneak-in (CONTEXT L239-240 evaluated rejected); per-row source_commit field non-empty MANDATORY
> - **D-02 RUN ENGINE** locked → DRY-RUN HARNESS + FULL E2E spawn 不可 sneak-in (CONTEXT L241-242 evaluated rejected); Plan 02 harness MUST call production `routing/decision_rules.yaml` (NOT mock)
> - **D-03 BUFFER /4** locked → TIKTOKEN npm dep + STRING LENGTH /4 不可 sneak-in (CONTEXT L243-244 evaluated rejected); Plan 02 helper MUST import estimateTokens from src/checkpoint/template.ts L34-36 (sister Phase 3.1 precedent reuse)
> - **D-04 DOCTOR WARN** locked → CI FAIL hard gate + SILENT LOG 不可 sneak-in (CONTEXT L245-246 evaluated rejected); Plan 02 doctor 8th check MUST status=warn ≠ fail (B-06 sister Phase 2.4 W3 exit code policy)

> ⚠️ **Karpathy hard limit ≤200L per file守门** (B-06 + B-26 + CONTEXT D-04 explicit "no B-03 5% tolerance"): every code-producing task 含 `wc -l ≤ N` acceptance criterion; Plan 02 W1 doctor.ts mitigation Option A inline shrink delegate to 3L locked per orchestrator pre-planning #1 + #5 (RESEARCH § 1.2 + § 1.3 + RESEARCH § 12.3 verbatim)

> ⚠️ **Biome lint preempt before commit** (project memory `feedback_biome-preempt.md` 3 CI-red recurrences Phase 2.1.1 / 2.2 / 2.3): 任何 TS/JS commit 前必跑 `pnpm exec biome check --write`. CI biome step fail = 强制 rerun 3-OS 测试浪费.

---

## Resolved Blocks (executor fill in-place, sister Phase 3.3 task_plan precedent)

> Resolved blocks 用于 executor 在跑 wave 时 surface 实测结果 (spike outcome / split decision / dogfood 结果) 锚定后续 task。

> **Resolved (T0.1 STATE trim outcome, SHIPPED 2026-05-17 commit `faf39bf`)**: STATE.md 723L → **146L** (well under ≤200L round 1 target; 54L headroom for future ship event log churn — no escalation L448-517 OR L386-447 collapse needed); `node scripts/check-state-archive-stale.mjs` exit 0 ("STATE.md within archive cadence limits" — clean PASS, 0 violations); 4 files changed +143/-627; `**Phase 3.3 SHIPPED**` SSOT preserved (2x literal matches, STATE_POSITION_RE OR-fallback satisfied); RETROSPECTIVE.md `## § ARCHIVED FROM STATE — Phase 1.X-3.2` section appended with full recovery instructions + git history pointer to `f8033e2:.planning/STATE.md` pre-archive baseline; scripts/check-state-archive-stale.mjs 54L ≤60 hard + ENFORCE=false warn-only round 1 + 3 rules const declarations (STATE_PATH/SIZE_LIMIT/HISTORICAL_ERRATA_RE); ci.yml step added adjacent to transparency-verdicts gate; transparency gate regression PASS (exit 0 "all verdict marker lines compliant").

> **Resolved (T0.2 install.ts Path A vs B outcome, SHIPPED 2026-05-17 commit `bdce440`)**: **Path A LOCKED CHOSEN** — `import pkg from '../../package.json' with { type: 'json' }` typecheck exit 0 + build exit 0 (tsup/esbuild + tsc both accept ES2022 import attributes natively; no Path B fallback needed). `wc -l src/cli/install.ts` post-modify = **145L** (+5L vs predicted +1L due to biome alphabetical reorder + 4L rationale comment block; well under ≤200L Karpathy hard). Bonus package.json L3 version bump `0.1.0-alpha.1` → `0.3.0` verified live (`harnessed@0.3.0` echoed in pnpm script output). Full vitest suite 659 passed / 4 skipped / 0 failed post-modify (48/48 install-related integration tests PASS).

> **Resolved (T0.3 versions/0.3.0-known-good.yaml fill outcome, SHIPPED 2026-05-17 commit `0801b9d`)**: 8 entries filled per RESEARCH § 7.1 verbatim candidate list — claude-agent-sdk@0.3.142 (npm-cli) + gstack@74895062fb8a3acbf9f66cd088a83359aaaa56cd (git-clone-with-setup) + gsd@1.41.2 (npm-cli) + superpowers@v5.1.0 (cc-plugin-marketplace, manifests/tools/ path) + planning-with-files@v2.37.0 (cc-plugin-marketplace) + mattpocock-skills@main-76-commits (npx-skill-installer) + karpathy-skills@skill-only-v1 (git-clone-with-setup, last_known_good_version field per DI-1 hotfix) + tavily-mcp@0.2.19 (mcp-stdio-add). Acceptance 13/13 PASS — file exists + 8 entries (≥5 minimum bar) + e2e_verified_at '2026-05-17' + all 5 anchor greps + all 5 install_method verification greps + no `<planner-verify>` placeholders. Phase 3.3 W1 T1.12 knownGood.test.ts **5/5 fixture pass** on filled seed (Value.Check(KnownGoodV1, parsed) returns true for all 8 entries).

> **Resolved (T0.4 path traversal spike outcome, RESOLVED PRE-PLAN)**: <RESOLVED 2026-05-17 by RESEARCH § 8.2 verbatim — install.ts L77-94 path.resolve absolute-safe + ENOENT graceful + TypeBox schema strict validate 双层 defense verified by code trace; real attack surface = near-zero; DEFER explicit regex hardening to Phase 4.0 W0; T0.4 ship action = 30L rationale doc + 1 defense-in-depth empirical fixture (NO regex code change to install.ts)>

> **Resolved (T0.5 SAMPLES.md mining outcome, SHIPPED 2026-05-17 commit `3b6817e`)**: 30 sample selection exact 10/10/10 tier balance per ROADMAP R7 ≥8/tier MIN — T01-T10 Haiku (chore + docs single-file + transparency flag + EE-4 yaml tune; SHAs 43ce181/aafab30/b96133e/9ec6e9a/2cfbc24/524eeb2/4804e60/15b1321/0a8841f/c8e4147) + T11-T20 Sonnet (fix + test single-file root-cause + NEW fixture; SHAs bdce440/077d679/a590cb0/8aaa90f/c37ee29/b41a84a/5428a42/4e40afb/fcec6bf/4e9c4ef) + T21-T30 Opus (feat multi-task batch + cross-phase PRIMARY extract + ADR 9 章节 + plan-phase ship Wave A+B+C; SHAs 84545e8/a6e16c9/6fc2d84/002cc4b/5c1f024/7254f75/5debde2/ae53b0e/e6dbf6d/b6a0feb). `wc -l .planning/phase-3.4/SAMPLES.md` = **73L** (well under ≤200L Karpathy hard — strong headroom). Per-row source_commit field non-empty verify PASS (D-01 sneak block守门 — all 30 SHAs resolve to real commits via `git cat-file -e`; PASS=30/0 FAIL). Mining feasibility verified: 302 commits in 6-day window (vs RESEARCH § 0 estimate 331; close).

---

## Deferred Items (Phase 3.4 carry-forward, will register at ship)

> **DEFERRED #AF (Phase 3.4 own carry)**: D3 gate ENFORCE flip timing — Phase 3.5 W0 first task OR v0.4.0 W0 first task (sister `check-transparency-verdicts.mjs` 1-phase warn-only → ENFORCE flip cadence suggests Phase 3.5 W0; but v0.3.0 close is hard milestone, planner may defer to v0.4.0 to maintain v0.3.0 clean ship per orchestrator pre-planning #6 LOCKED Phase 3.5 OR v0.4.0)
> **DEFERRED #AG (Phase 3.4 own carry)**: D1 STATE.md ≤150L tighten — round 1 target ≤200L (warn-only round 1); v0.4.0+ tighten SIZE_LIMIT to 150L per D3 Rule 1 future flip
> **DEFERRED #AH (Phase 3.4 own carry)**: W0.4 path traversal regex hardening → Phase 4.0 W0 (if external user input arrives — currently sole consumer is project maintainer, real attack surface near-zero per spike outcome)

---

## Wave 0 — Backlog 5 项 absorb (5 sub-tasks; T0.1 FIRST 必修 STRATEGIC institutionalize)

### T0.1 — W0.1 STRATEGIC "STATE.md role + archive cadence institutionalize" (D1+D2+D3+D4 user-locked 4 D-decisions; paranoid 命名 architectural framing NOT cleanup; FIRST TASK 必修)

- **files_modified**:
  - `.planning/STATE.md` (DELETE/RESTRUCTURE ~400L: archive L96-329 Completed milestone narrative + L518-624 Phase 1.5+2.0 Prereq Notes + L625-683 Phase 2.3+2.4 Prereq Notes → RETROSPECTIVE.md; preserve L8-15 项目核心引用 + L18-25 当前位置 block SSOT + L684-723 current milestone scope; FINAL ≤200L round 1)
  - `.planning/RETROSPECTIVE.md` (APPEND new section "ARCHIVED FROM STATE Phase 1.X-3.2 § ARCHIVED FROM STATE" containing trimmed narrative; D2 ship-time T6.N cadence first-implementation per W2 ship section)
  - `scripts/check-state-archive-stale.mjs` (NEW ~55L per RESEARCH § 11.2 verbatim recipe: ENFORCE=false warn-only round 1 + 3 rules scan + console.warn + process.exit(ENFORCE ? 1 : 0))
  - `.github/workflows/ci.yml` (MODIFY +3L: CI step add `- name: Check STATE.md archive cadence (warn-only round 1)` + `run: node scripts/check-state-archive-stale.mjs` adjacent to existing transparency-verdicts step per RESEARCH § 11.3 verbatim)
- **read_first**:
  - `.planning/STATE.md` entire file (by Read — verify 723L baseline + identify archive section line ranges: L96-329 + L518-624 + L625-683)
  - `.planning/RETROSPECTIVE.md` tail 50 lines (by Read — verify existing Phase 3.3 milestone retrospective section format pre-append; sister Phase 2.4 retro § "Key Decisions Shipped" pattern from sister Phase 3.3 H2 absorb)
  - `scripts/check-transparency-verdicts.mjs` L1-130 entire file (by Read — sister gate 100% pattern model for check-state-archive-stale.mjs NEW; verify ENFORCE flag at L12 + readFileSync + violations array + exit code pattern)
  - `.github/workflows/ci.yml` L30-100 (by Read — locate existing `node scripts/check-transparency-verdicts.mjs` step for adjacency placement)
  - `.planning/phase-3.4/RESEARCH.md` § 5 + § 11 (W0.1 D1+D2+D3+D4 implementation steps + 3 rules gate design verbatim — offset 426 limit 50 + offset 773 limit 90)
  - `.planning/phase-3.4/PATTERNS.md` § 1 row 1 + 2 + 3 (W0.1 mapping reuse rationale 75% + 30% + 80%) + § 2.4 (check-state-archive-stale.mjs verbatim code excerpt)
- **action**:
  1. **D1 single-SoT trim STATE.md 723L → ≤200L round 1 target** per RESEARCH § 5.1+§ 5.2 + orchestrator pre-planning #7 LOCKED:
     - Read `.planning/STATE.md` to confirm baseline 723L (`wc -l .planning/STATE.md` expect 723) + identify archive sections by section header grep
     - Archive L96-329 (已完成 Completed v0.1.0+v0.2.0 milestone narrative, ~234L delta) → move verbatim to RETROSPECTIVE.md
     - Archive L518-624 (Phase 1.5+2.0 Prereq Notes, ~107L delta) → move verbatim to RETROSPECTIVE.md
     - Archive L625-683 (Phase 2.3+2.4 Prereq Notes, ~59L delta) → move verbatim to RETROSPECTIVE.md
     - PRESERVE L8-15 项目核心引用 (constant 8L KEEP)
     - PRESERVE L18-25 当前位置 block (sole SSOT 8L; contains **Phase 3.3 SHIPPED** + **Phase 3.2 SHIPPED** literal markers, STATE_POSITION_RE anchor)
     - PRESERVE L26-95 进行中 + 待办 + 关键提醒 + 累积上下文 Decisions (current churn ~70L KEEP)
     - PRESERVE L684-723 v0.3.0 启动 prereq + 框架治理 (current milestone scope ~40L KEEP)
     - FINAL projection: 8 + 8 + 70 + 40 = ~126L round 1 (well within ≤200L target; future v0.4+ tighten ≤150L per D3 Rule 1 SIZE_LIMIT)
     - **IF post-trim STATE.md > 200L** (escalation): additional collapse L448-517 Session 连续性 (-70L) OR L386-447 Decisions section flatten into single-bullet ref to .planning/decisions/ archive (-50L); update Resolved (T0.1) block at task_plan.md top with outcome (PENDING → 实占 value: `wc -l .planning/STATE.md` post-trim)
  2. **D2 ship-time T6.N archive cadence integrate** (institutionalize per Phase 3.4+ onward):
     - APPEND to `.planning/RETROSPECTIVE.md` new section header `## § ARCHIVED FROM STATE — Phase 1.X-3.2 (first ship-time T6.N implementation per Phase 3.4 W0.1 D2)` containing trimmed STATE.md content from step 1
     - Document W2 ship integration: Plan 03 W2 T2.3 "STATE/RETRO/ROADMAP 续编" task MUST include sub-step "trim STATE prev-prev-phase narrative → RETROSPECTIVE.md Phase N-2 § ARCHIVED FROM STATE" as standing process every Phase ship from Phase 3.4+ onward (sister Phase 2.4 W6 T6.3 RETRO 续编 pattern 100% reuse)
  3. **D3 `scripts/check-state-archive-stale.mjs` NEW ~55L** per RESEARCH § 11.2 verbatim recipe:
     ```javascript
     #!/usr/bin/env node
     // Phase 3.4 W0.1 D3 — STATE.md role + archive cadence institutionalize gate.
     // Sister scripts/check-transparency-verdicts.mjs 130L warn-only round 1 → ENFORCE Phase 3.5+ pattern.
     // 3 rules: (1) size ≤200L (round 1 target; ≤150 v0.4 tighten); (2) 关键决议总结节 ≤1; (3) no W-N errata literal.
     import { readFileSync } from 'node:fs'

     const ENFORCE = false // Phase 3.4 ship round 1 warn-only; flip Phase 3.5 OR v0.4.0
     const STATE_PATH = '.planning/STATE.md'
     const SIZE_LIMIT = 200 // round 1; tighten to 150 v0.4
     const KEY_DECISIONS_SECTION_LIMIT = 1
     const HISTORICAL_ERRATA_RE = /W-[1-9]\s+errata|sister\s+review\s+M[1-9]\s+修正/

     function checkStateArchive() {
       const violations = []
       const content = readFileSync(STATE_PATH, 'utf8')
       const lines = content.split(/\r?\n/)

       // Rule 1: wc -l ≤ 200 (warn-only round 1; ENFORCE round 2 = strict gate)
       if (lines.length > SIZE_LIMIT) {
         violations.push(`Rule 1 (size): STATE.md ${lines.length}L > ${SIZE_LIMIT}L (archive prev-prev-phase narrative to RETROSPECTIVE)`)
       }

       // Rule 2: "关键决议 ship 总结" section count (HTML-comment archive marker matches OK)
       const keyDecisionsMatches = content.match(/^##\s+.*关键决议\s*ship\s*总结/gm) ?? []
       if (keyDecisionsMatches.length > KEY_DECISIONS_SECTION_LIMIT) {
         violations.push(`Rule 2 (key decisions): ${keyDecisionsMatches.length} '关键决议 ship 总结' section(s) > ${KEY_DECISIONS_SECTION_LIMIT} (move to RETROSPECTIVE; only HTML-comment archive marker remains in STATE.md)`)
       }

       // Rule 3: historical errata literal禁字面 (W-N errata / sister review M-N 修正)
       for (let i = 0; i < lines.length; i++) {
         if (HISTORICAL_ERRATA_RE.test(lines[i])) {
           violations.push(`Rule 3 (errata): L${i+1} historical commentary literal '${lines[i].trim().slice(0, 80)}...' (move to RETROSPECTIVE)`)
         }
       }
       return violations
     }

     const violations = checkStateArchive()
     if (violations.length > 0) {
       console.warn(`[state-archive-stale] ${violations.length} violation(s):`)
       for (const v of violations) console.warn(`  ${v}`)
       console.warn('See Phase 3.4 W0.1 STRATEGIC institutionalize doc for archive cadence.')
       process.exit(ENFORCE ? 1 : 0)
     }
     console.log('[state-archive-stale] STATE.md within archive cadence limits.')
     ```
     - Karpathy hard limit ≤60L (CONTEXT spec)
     - sister `scripts/check-transparency-verdicts.mjs` L12 ENFORCE flip cadence verified (Phase 2.1 T1.7 ship `ENFORCE = false` round 1 → Phase 2.2 W0 T0.6 ship-time flip `ENFORCE = true` round 2)
  4. **D3 CI step add** to `.github/workflows/ci.yml` adjacent to existing transparency-verdicts step:
     ```yaml
     - name: Check STATE.md archive cadence (warn-only round 1)
       run: node scripts/check-state-archive-stale.mjs
     ```
     Place AFTER the existing `- name: ... transparency verdict ...` + `run: node scripts/check-transparency-verdicts.mjs` step (sister gate adjacency per RESEARCH § 11.3 verbatim).
  5. **D4 ship-process integrate doc** (institutionalize):
     - Document in T0.1 commit msg footer: "D4 ship-process integrate — Plan 03 W2 T2.3 includes 'trim STATE prev-prev-phase narrative → RETROSPECTIVE.md Phase N-2 § ARCHIVED FROM STATE' sub-step as standing process Phase 3.4+ onward; executor 不 SCOPE BOUNDARY 阻挡 archive per D4 paranoid framing"
  6. Run biome preempt: `pnpm exec biome check --write` (only .ts/.js/.mjs touched if any; mjs and md unaffected by biome — harmless idempotent)
  7. Local verify per acceptance_criteria below
  8. **Recommended commit msg** (Karpathy why-not-what, sister Phase 3.3 W0.1 commit msg pattern延袭):
     ```
     fix(phase-3.4-w0): T0.1 — STATE.md role + archive cadence institutionalize STRATEGIC (D1+D2+D3+D4 user-locked 4 D-decisions)

     6th phase of "deferred-items → next phase W0 一次根治" cadence (sister Phase
     2.3/2.4/3.1/3.2/3.3 → Phase 3.4). Paranoid 命名 architectural framing NOT
     cleanup — "institutionalize" 才是 architectural 级 (sister D-04 COLLAPSE 命名思路延袭).

     D1 single-SoT: STATE.md 723L → ≤200L round 1 target (was bloated 8-phase
     累积 0 删 root cause). ~400L prev-prev-phase narrative L96-329 + L518-683
     archived to RETROSPECTIVE.md Phase N-2 § ARCHIVED FROM STATE (first
     ship-time T6.N implementation per D2 cadence sister Phase 2.4 W6 T6.3 RETRO
     续编 pattern). Preserve L18-25 当前位置 block as sole SSOT.

     D2 ship-time T6.N integrate: Plan 03 W2 T2.3 includes 'trim STATE prev-prev
     -phase narrative → RETROSPECTIVE.md' as standing process Phase 3.4+ onward.
     D3 scripts/check-state-archive-stale.mjs NEW ~55L 3 rules warn-only round 1
     (ENFORCE=false; flip Phase 3.5/v0.4.0 sister Phase 2.1 transparency gate
     cadence). D4 executor 不 SCOPE BOUNDARY 阻挡 archive (gate make GC visible).
     ```
  9. **Update Resolved (T0.1)** block at task_plan.md top with outcome (PENDING → 实占 value: `wc -l .planning/STATE.md` post-trim + `node scripts/check-state-archive-stale.mjs` exit code)
- **acceptance_criteria**:
  - `wc -l .planning/STATE.md` ≤ 200 (D1 round 1 target)
  - `grep -q "\\*\\*Phase 3\\.3 SHIPPED\\*\\*" .planning/STATE.md` exit 0 (当前位置 SSOT preserved with STATE_POSITION_RE anchor)
  - `grep -q "ARCHIVED FROM STATE" .planning/RETROSPECTIVE.md` exit 0 (D2 first ship-time archive section)
  - `test -f scripts/check-state-archive-stale.mjs` exit 0
  - `wc -l scripts/check-state-archive-stale.mjs` ≤ 60 (Karpathy spec)
  - `grep -q "ENFORCE = false" scripts/check-state-archive-stale.mjs` exit 0 (warn-only round 1 lock)
  - `grep -E "STATE_PATH|SIZE_LIMIT|HISTORICAL_ERRATA_RE" scripts/check-state-archive-stale.mjs | wc -l` ≥ 3 (3 rules const declarations)
  - `node scripts/check-state-archive-stale.mjs` exit 0 (warn-only round 1; may print violations but exit 0)
  - `grep -q "check-state-archive-stale" .github/workflows/ci.yml` exit 0 (CI step added)
  - `grep -q "STATE.md archive cadence" .github/workflows/ci.yml` exit 0 (CI step name verbatim)
  - `node scripts/check-transparency-verdicts.mjs` exit 0 (regression: existing transparency gate still passes post-W0.1 trim — STATE_POSITION_RE OR-fallback still matches preserved 当前位置 SSOT)
- **decision_source**: KICKOFF § 4 W0.1 STRATEGIC + CONTEXT § Decisions W0.1 + RESEARCH § 5 + § 11 verbatim implementation + PATTERNS § 1 row 1-3 + § 2.4 verbatim code + sister Phase 3.3 deferred-items.md "Phase 3.4 W0 STRATEGIC task lock" 4 D-decisions D1-D4 user-locked + orchestrator pre-planning #6 + #7 LOCKED (D3 ENFORCE flip Phase 3.5/v0.4.0; STATE.md ≤200L round 1)

---

### T0.2 — W0.2 DEFERRED #AD install.ts package.json version read (Path A ES2022 import attributes locked) + bonus package.json version bump 0.1.0-alpha.1 → 0.3.0

- **files_modified**:
  - `src/cli/install.ts` (MODIFY ~+2L Path A or ~+5L Path B fallback): file-top import attribute OR readFileSync block + L116 hardcoded swap
  - `package.json` (MODIFY 1-line: L2 `"version": "0.1.0-alpha.1"` → `"version": "0.3.0"` bonus version bump per RESEARCH § 6.4 Recommendation (i))
- **read_first**:
  - `src/cli/install.ts` L114-122 (by Read — verify L116 hardcoded `const harnessedVer = '0.3.0' // TODO Phase 3.4: read from package.json (DEFERRED #AD)` baseline pre-modify)
  - `src/cli/install.ts` L1-30 (by Read — verify existing imports for proper insertion position of new import attribute statement OR readFileSync imports)
  - `package.json` L1-15 (by Read — verify L2 `"version": "0.1.0-alpha.1"` baseline pre-bump + L24 `engines.node: >=22.0.0` verify Node 22 support for ES2022 import attributes)
  - `.planning/phase-3.4/RESEARCH.md` § 6 (W0.2 implementation Path A vs B recipe + § 6.4 bonus version bump rationale — offset 478 limit 60)
  - `.planning/phase-3.4/PATTERNS.md` § 1 row 4 (W0.2 #AD mapping reuse 95%)
- **action**:
  1. Read `src/cli/install.ts` L114-122 to verify baseline:
     ```typescript
     if (raw.knownGood) {
       const { getPinnedVersion } = await import('../manifest/knownGood.js')
       const harnessedVer = '0.3.0' // TODO Phase 3.4: read from package.json (DEFERRED #AD)
       const pinned = getPinnedVersion(v.manifest.metadata.name, harnessedVer)
       if (pinned && v.manifest.spec.install.method === 'npm-cli') {
         ;(v.manifest.spec.install as { npm_version?: string }).npm_version = pinned
       }
     }
     ```
  2. Read `package.json` L1-15 to verify L2 `"version": "0.1.0-alpha.1"` baseline pre-bump.
  3. **Path A LOCKED** (per RESEARCH § 6.2 A1 ASSUMED LOW risk; Node 22 + TypeScript 5.6+ supports `with { type: 'json' }` native ES2022 import attributes per ECMAScript 2025 stage 4):
     - Add file-top import (AFTER existing imports, before commander.js types):
       ```typescript
       import pkg from '../../package.json' with { type: 'json' }
       ```
     - Replace L116 `const harnessedVer = '0.3.0' // TODO Phase 3.4: read from package.json (DEFERRED #AD)` with:
       ```typescript
       const harnessedVer = pkg.version
       ```
     - Net delta: +1L import + 0L replace = +1L total (was 140L → 141L Path A)
  4. **Run typecheck + build pre-flight gate** (W-4 mitigation per orchestrator iter-1 fix): After Path A code edit, run BOTH `pnpm typecheck 2>&1 | tail -3` AND `pnpm build 2>&1 | tail -5` pre-commit; only commit if both green. If either fails → revert + Path B fallback before commit. (Rationale: typecheck alone does not catch tsup/esbuild bundle-time `with { type: 'json' }` rejection; build catches the actual ship-time failure mode.)
  5. **IF Path A blocked by TS pipeline OR bundle pipeline `with` syntax** (Resolved (T0.2) outcome PENDING — executor revert + Path B fallback if EITHER typecheck OR build fails):
     - Path B fallback (works on any Node 22+ pipeline; +3L delta acceptable):
       - Add file-top imports (AFTER existing imports):
         ```typescript
         import { readFileSync } from 'node:fs'
         import { fileURLToPath } from 'node:url'
         import { dirname, join } from 'node:path'
         ```
       - Add module-level (before `registerInstall` function declaration):
         ```typescript
         const pkg = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../../package.json'), 'utf8'))
         ```
       - Replace L116 same as Path A: `const harnessedVer = pkg.version`
     - Net delta: +3L imports + 1L pkg + 0L replace = +4L total (was 140L → 144L Path B)
  6. **Bonus package.json version bump** (RESEARCH § 6.4 Recommendation (i); 1-line atomic with W0.2 version-read fix):
     - Edit `package.json` L2:
       ```json
       "version": "0.1.0-alpha.1"   →   "version": "0.3.0"
       ```
     - Atomic with W0.2 fix because post-W0.2 `harnessedVer = pkg.version` reads `'0.3.0'` matching `versions/0.3.0-known-good.yaml` (unblocks `harnessed install --known-good` post-W0.2 functional verify; align publish stream with shipped milestone tags v0.3.0-alpha.1-checkpoint through v0.3.0-alpha.3-aliases-known-good)
  7. Run biome preempt: `pnpm exec biome check --write src/cli/install.ts package.json`
  8. Run typecheck + local install test verify (existing `tests/cli/install.test.ts` regression):
     ```bash
     pnpm typecheck 2>&1 | tail -3
     pnpm test -- --run tests/cli/install.test.ts 2>&1 | tail -3
     ```
  9. **Recommended commit msg**:
     ```
     fix(phase-3.4-w0): T0.2 — install.ts harnessedVer from package.json (DEFERRED #AD 1-line surgical Path A ES2022 import attributes) + bonus package.json version bump 0.1.0-alpha.1 → 0.3.0 align shipped milestone tags

     Path A LOCKED per RESEARCH § 6.2 A1 ASSUMED LOW risk (Node 22 + TypeScript
     5.6+ supports `with { type: 'json' }` native ES2022 import attributes per
     ECMAScript 2025 stage 4). Bonus version bump per RESEARCH § 6.4 Recommendation
     (i) — atomic with W0.2 fix so post-W0.2 harnessedVer reads '0.3.0' matching
     versions/0.3.0-known-good.yaml (unblocks `harnessed install --known-good`
     functional verify + aligns publish stream with shipped milestone tags).
     ```
  10. **Update Resolved (T0.2)** block at task_plan.md top with outcome (Path A vs B chosen + `wc -l src/cli/install.ts` post-modify)
- **acceptance_criteria**:
  - `grep -q "pkg.version" src/cli/install.ts` exit 0 (harnessedVer reads from pkg.version)
  - `grep -E "import pkg from.*package.json|JSON.parse.*readFileSync.*package.json" src/cli/install.ts | wc -l` ≥ 1 (Path A OR Path B import present)
  - `! grep -q "harnessedVer.*'0\\.3\\.0'" src/cli/install.ts` exit 0 (hardcoded literal removed)
  - `! grep -q "TODO Phase 3.4: read from package.json" src/cli/install.ts` exit 0 (TODO comment removed)
  - `grep -q '"version": "0.3.0"' package.json` exit 0 (bonus bump verified)
  - `wc -l src/cli/install.ts` ≤ 200 (Karpathy hard limit; expected 140 → 141L Path A / 144L Path B)
  - `pnpm typecheck 2>&1 | tail -3` exit 0 (no TS error)
  - `pnpm build 2>&1 | tail -5` exit 0 (W-4 bundle pre-flight — catches tsup/esbuild `with` syntax rejection that typecheck alone misses; Path B fallback if either typecheck OR build fails)
  - `pnpm test -- --run tests/cli/install.test.ts 2>&1 | tail -3 | grep -E "Tests.*passed"` exit 0 (existing install.ts regression test still pass)
- **decision_source**: KICKOFF § 4 W0.2 + CONTEXT § Decisions W0.2 + Phase 3.3 deferred-items #AD verbatim + RESEARCH § 6 (Path A vs B + bonus version bump) + PATTERNS § 1 row 4 + orchestrator pre-planning #5 LOCKED (Option A inline shrink is for doctor.ts Plan 02; Path A locked for install.ts W0.2 per RESEARCH § 6.2)

---

### T0.3 — W0.3 DEFERRED #AC R7.6 real seed fill 8 entries (claude-agent-sdk + gstack + gsd + superpowers + planning-with-files + mattpocock-skills + karpathy-skills + tavily-mcp)

- **files_modified**: `versions/0.3.0-known-good.yaml` (MODIFY +30L: replace `upstreams: []` empty seed with 8 real e2e-verified pinned entries + update `e2e_verified_at: '2026-05-17'` from placeholder)
- **read_first**:
  - `versions/0.3.0-known-good.yaml` current state (by Read — verify Phase 3.3 W1 T1.11 ship empty MVP seed: schemaVersion + harnessed_version: '0.3.0' + e2e_verified_at: '2026-05-17' placeholder + `upstreams: []`)
  - `package.json` L70-80 (by Read — verify `@anthropic-ai/claude-agent-sdk` exact version 0.3.142 + `yaml ^2.9.0` + other runtime deps)
  - `manifests/skill-packs/gstack.yaml` L20-30 (by Read — verify git_ref SHA `74895062fb8a3acbf9f66cd088a83359aaaa56cd` per RESEARCH § 7.1)
  - `manifests/skill-packs/gsd.yaml` L20-40 (by Read — verify `npm_version` + L34 `last_known_good_version: 1.41.2`)
  - `manifests/skill-packs/karpathy-skills.yaml` L50-60 (by Read — verify L58 `last_known_good_version: skill-only-v1`)
  - `manifests/tools/tavily-mcp.yaml` L20-40 (by Read — verify L33 `last_known_good_version: 0.2.19`)
  - `manifests/tools/superpowers.yaml` L18-26 (by Read — actual path NOT manifests/skill-packs/; install.method = `cc-plugin-marketplace`, install.git_ref = `v5.1.0` source-of-truth)
  - `manifests/skill-packs/planning-with-files.yaml` L18-30 (by Read — install.method = `cc-plugin-marketplace`, install.git_ref = `v2.37.0` source-of-truth)
  - `manifests/skill-packs/mattpocock-skills.yaml` L18-26 (by Read — install.method = `npx-skill-installer`, last_known_good_version L34 = `main-76-commits`)
  - `manifests/skill-packs/karpathy-skills.yaml` L20-58 (by Read — install.method = `git-clone-with-setup`, install.git_ref L45 = zero-hash sentinel `0000000000000000000000000000000000000000`, last_known_good_version L58 = `skill-only-v1` — use last_known_good_version for upstreams entry NOT install.git_ref per DI-1 hotfix local-copy fallback semantic)
  - `manifests/skill-packs/gstack.yaml` L20-22 (by Read — install.git_ref L22 = `74895062fb8a3acbf9f66cd088a83359aaaa56cd` source-of-truth for known-good lock per R7.6 reproducible semantics; last_known_good_version L34 = `main-269-commits` is health-stability hint NOT install reproducibility anchor — USE install.git_ref for upstreams entry)
  - `src/manifest/schema/known-good.v1.ts` (by Read — verify PinnedUpstream + KnownGoodV1 schema shape for Value.Check pass)
  - `tests/manifest/knownGood.test.ts` (by Read — verify Phase 3.3 W1 T1.12 5 fixture still pass post-fill)
  - `.planning/phase-3.4/RESEARCH.md` § 7 (W0.3 real seed candidate list + yaml fill format verbatim — offset 539 limit 65)
  - `.planning/phase-3.4/PATTERNS.md` § 1 row 5 (W0.3 #AC mapping reuse 70%)
- **action**:
  1. Read `versions/0.3.0-known-good.yaml` to verify current empty MVP seed state:
     ```yaml
     schemaVersion: harnessed.known-good.v1
     harnessed_version: '0.3.0'
     e2e_verified_at: '2026-05-17'  # placeholder; Phase 3.4 updates with actual e2e date
     upstreams: []
     ```
  2. Read each candidate manifest yaml to extract exact install_method field per RESEARCH § 7.1 verified candidate list (8 entries planned):
     - `claude-agent-sdk` version `0.3.142` install_method `npm-cli` (from `package.json` L70 `@anthropic-ai/claude-agent-sdk: 0.3.142` exact)
     - `gstack` version `74895062fb8a3acbf9f66cd088a83359aaaa56cd` install_method `git-clone-with-setup` (from `manifests/skill-packs/gstack.yaml` L22 `install.git_ref` — source-of-truth for known-good lock per R7.6 reproducible install semantics; NOT `last_known_good_version` L34 which is health-stability hint only)
     - `gsd` version `1.41.2` install_method `npm-cli` (from `manifests/skill-packs/gsd.yaml` L34 `last_known_good_version`)
     - `superpowers` version `v5.1.0` install_method `cc-plugin-marketplace` (from `manifests/tools/superpowers.yaml` L26 `install.git_ref: v5.1.0` + L24 `method: cc-plugin-marketplace`; NOTE: actual path is `manifests/tools/superpowers.yaml` — `manifests/skill-packs/superpowers.yaml` does NOT exist)
     - `planning-with-files` version `v2.37.0` install_method `cc-plugin-marketplace` (from `manifests/skill-packs/planning-with-files.yaml` L24 `method: cc-plugin-marketplace` + L26 `install.git_ref: v2.37.0` source-of-truth)
     - `mattpocock-skills` version `main-76-commits` install_method `npx-skill-installer` (from `manifests/skill-packs/mattpocock-skills.yaml` L20 `method: npx-skill-installer` + L34 `last_known_good_version: main-76-commits` — NOTE: install method is `npx-skill-installer` NOT `cc-skill-pack`; spec.type is `cc-skill-pack` which is a different field — anti-coupling per Phase 3.3 W1 T1.3 design)
     - `karpathy-skills` version `skill-only-v1` install_method `git-clone-with-setup` (from `manifests/skill-packs/karpathy-skills.yaml` L37 `method: git-clone-with-setup` + L58 `last_known_good_version: skill-only-v1` — explicitly use `last_known_good_version` field NOT `install.git_ref` L45 which is zero-hash sentinel `0000000000000000000000000000000000000000` placeholder per DI-1 hotfix local-copy fallback semantic L29-36 verbatim)
     - `tavily-mcp` version `0.2.19` install_method `mcp-stdio-add` (from `manifests/tools/tavily-mcp.yaml` L33 `last_known_good_version`)
  3. Replace `upstreams: []` with 8 real entries (sister Phase 3.3 W1 T1.10 manifests/aliases.yaml yaml indentation style):
     ```yaml
     # versions/0.3.0-known-good.yaml — Phase 3.4 W0.3 R7.6 dogfood seed fill
     # Phase 3.3 W1 T1.11 shipped empty MVP; Phase 3.4 W0.3 fills 8 e2e-verified pinned entries.
     # Schema: src/manifest/schema/known-good.v1.ts (13th surface)

     schemaVersion: harnessed.known-good.v1
     harnessed_version: '0.3.0'
     e2e_verified_at: '2026-05-17'  # Phase 3.4 W0.3 actual e2e verify date (not 'TBD' placeholder)
     upstreams:
       - name: claude-agent-sdk
         version: '0.3.142'
         install_method: npm-cli
       - name: gstack
         version: '74895062fb8a3acbf9f66cd088a83359aaaa56cd'  # git SHA pinned per manifests/skill-packs/gstack.yaml L22
         install_method: git-clone-with-setup
       - name: gsd
         version: '1.41.2'  # last-known-good per manifests/skill-packs/gsd.yaml L34
         install_method: npm-cli
       - name: superpowers
         version: 'v5.1.0'  # install.git_ref per manifests/tools/superpowers.yaml L26 — NOTE actual path is manifests/tools/ NOT skill-packs/
         install_method: cc-plugin-marketplace
       - name: planning-with-files
         version: 'v2.37.0'  # install.git_ref per manifests/skill-packs/planning-with-files.yaml L26 source-of-truth
         install_method: cc-plugin-marketplace
       - name: mattpocock-skills
         version: 'main-76-commits'  # last_known_good_version per manifests/skill-packs/mattpocock-skills.yaml L34
         install_method: npx-skill-installer  # NOTE: install.method is npx-skill-installer NOT cc-skill-pack (which is spec.type, different field per anti-coupling Phase 3.3 W1 T1.3)
       - name: karpathy-skills
         version: 'skill-only-v1'  # last-known-good per manifests/skill-packs/karpathy-skills.yaml L58 + DI-1 hotfix local-copy
         install_method: git-clone-with-setup
       - name: tavily-mcp
         version: '0.2.19'  # last-known-good per manifests/tools/tavily-mcp.yaml L33
         install_method: mcp-stdio-add
     ```
  4. **Planner has resolved all 8 entries with verified install_method + version from real manifest yaml** (no `<planner-verify>` placeholders remain in yaml above). Executor MUST cross-verify by re-reading the cited manifest files before commit (planner-verify is sister Phase 3.3 W1 T1.10 cadence). If any manifest field changed since planning, executor MUST surface delta in Resolved (T0.3) block and downgrade to ≥5 entry minimum (acceptance bar `upstreams[]` length ≥ 5 per CONTEXT D-decisions L121).
  5. Run biome preempt (yaml unaffected by biome — harmless)
  6. Run Phase 3.3 W1 T1.12 knownGood.test.ts regression verify: `pnpm test -- --run tests/manifest/knownGood.test.ts 2>&1 | tail -3` (expect 5 fixture pass on filled seed; Value.Check(KnownGoodV1, parsed) returns true for all 8 entries)
  7. **Recommended commit msg**:
     ```
     feat(phase-3.4-w0): T0.3 — versions/0.3.0-known-good.yaml 8 real e2e-verified pinned upstreams fill (DEFERRED #AC R7.6 dogfood seed)

     Sister Phase 3.3 W1 T1.11 ship empty MVP seed → Phase 3.4 W0.3 fills 8
     e2e-verified pinned entries per RESEARCH § 7.1 verbatim candidate list:
     claude-agent-sdk@0.3.142 (npm-cli) + gstack@SHA (git-clone-with-setup,
     install.git_ref SoT per R7.6) + gsd@1.41.2 (npm-cli) + superpowers@v5.1.0
     (cc-plugin-marketplace, manifests/tools/ path) + planning-with-files@v2.37.0
     (cc-plugin-marketplace) + mattpocock-skills@main-76-commits (npx-skill-installer)
     + karpathy-skills@skill-only-v1 (git-clone-with-setup, last_known_good_version
     field per DI-1 hotfix local-copy fallback) + tavily-mcp@0.2.19 (mcp-stdio-add).
     e2e_verified_at '2026-05-17' (not 'TBD'
     placeholder). Karpathy YAGNI hard cap 10 (planner picked 8 covering core
     engineering stack + key MCP — not every manifest needs lock).

     Acceptance R7.6 "harnessed install --known-good reproducible" achievable
     post-T0.2 (W0.2 #AD harnessedVer reads pkg.version = '0.3.0' matching
     versions/0.3.0-known-good.yaml).
     ```
  8. **Update Resolved (T0.3)** block at task_plan.md top with outcome (8 entries actual install_method values + Value.Check pass status)
- **acceptance_criteria**:
  - `test -f versions/0.3.0-known-good.yaml` exit 0
  - `grep -c "^  - name:" versions/0.3.0-known-good.yaml` ≥ 5 (planned 8 per CONTEXT acceptance L121 ≥5 minimum)
  - `grep -q "e2e_verified_at: '2026-05-17'" versions/0.3.0-known-good.yaml` exit 0 (not 'TBD' placeholder)
  - `grep -q "claude-agent-sdk" versions/0.3.0-known-good.yaml` exit 0 (anchor entry)
  - `grep -q "0.3.142" versions/0.3.0-known-good.yaml` exit 0 (exact version)
  - `grep -q "74895062fb8a3acbf9f66cd088a83359aaaa56cd" versions/0.3.0-known-good.yaml` exit 0 (gstack git SHA)
  - `grep -q "karpathy-skills" versions/0.3.0-known-good.yaml` exit 0 (DI-1 hotfix coverage)
  - `! grep -q "<planner-verify>" versions/0.3.0-known-good.yaml` exit 0 (no placeholder unresolved — planner pre-filled all 8 entries with verified values from real manifests)
  - `grep -q "v5.1.0" versions/0.3.0-known-good.yaml` exit 0 (superpowers install.git_ref verified)
  - `grep -q "v2.37.0" versions/0.3.0-known-good.yaml` exit 0 (planning-with-files install.git_ref verified)
  - `grep -q "main-76-commits" versions/0.3.0-known-good.yaml` exit 0 (mattpocock-skills last_known_good_version verified)
  - `grep -q "cc-plugin-marketplace" versions/0.3.0-known-good.yaml` exit 0 (superpowers + planning-with-files install_method verified)
  - `grep -q "npx-skill-installer" versions/0.3.0-known-good.yaml` exit 0 (mattpocock-skills install_method verified — NOT cc-skill-pack)
  - `pnpm test -- --run tests/manifest/knownGood.test.ts 2>&1 | tail -3 | grep -E "Tests.*passed"` exit 0 (Phase 3.3 W1 T1.12 5 fixture pass on filled seed)
- **decision_source**: KICKOFF § 4 W0.3 + CONTEXT § Decisions W0.3 + Phase 3.3 deferred-items #AC verbatim + RESEARCH § 7 verbatim candidate list + PATTERNS § 1 row 5 + orchestrator pre-planning #3 LOCKED (8 entries verbatim list)

---

### T0.4 — W0.4 DEFERRED #AE path traversal spike outcome DEFER Phase 4.0 + 30L rationale doc + 1 defense-in-depth fixture

- **files_modified**:
  - `.planning/phase-3.4/SPIKE-W0.4-path-traversal.md` (NEW ~30L rationale doc per RESEARCH § 8 verbatim)
  - `tests/integration/install-path-traversal.test.ts` (NEW ~40L 1 defense-in-depth empirical fixture; sister Phase 3.3 tests/integration/install-aliases.test.ts spawn pattern)
- **read_first**:
  - `src/cli/install.ts` L77-94 (by Read — verify path construction baseline: `manifestPath = resolve(process.cwd(), \`manifests/tools/${resolvedName}.yaml\`)` + ENOENT catch + error message)
  - `.planning/phase-3.3/RESEARCH.md` § 10.4 (by Read — verify sister Phase 3.3 STRIDE Tampering threat already enumerated this exact threat; cross-ref for SPIKE doc § 4)
  - `tests/integration/install-aliases.test.ts` (by Read — sister Phase 3.3 W2 T2.1 spawn + tmpdir isolation pattern for fixture)
  - `tests/scripts/dashboard-sse.test.ts` (by Read — sister beforeAll tmpRoot + mkdtemp pattern)
  - `.planning/phase-3.4/RESEARCH.md` § 8 (W0.4 spike outcome + DEFER rationale + 1 fixture design verbatim — offset 605 limit 60)
  - `.planning/phase-3.4/PATTERNS.md` § 1 row 17 (W0.4 mapping reuse 80%; sister Phase 3.2 DEFERRED #2 spike→absorb/defer pattern)
- **action**:
  1. Create NEW file `.planning/phase-3.4/SPIKE-W0.4-path-traversal.md` ~30L per RESEARCH § 8 verbatim 5-section structure:
     ```markdown
     # W0.4 path traversal spike outcome — DEFER Phase 4.0

     **Phase**: 3.4 W0.4 (DEFERRED #AE 兑现 outcome)
     **Date**: 2026-05-17
     **Sources**: RESEARCH § 8.1-8.4 verbatim + sister Phase 3.3 RESEARCH § 10.4 STRIDE Tampering threat model cross-ref

     ## § 1 Attack vector analysis

     Current `install.ts` L77-78 path construction:
     ```typescript
     const manifestPath = resolve(process.cwd(), `manifests/tools/${resolvedName}.yaml`)
     const skillPackPath = resolve(process.cwd(), `manifests/skill-packs/${resolvedName}.yaml`)
     ```

     User input flow:
     - `harnessed install <name>` → `name` arg → `resolveAlias(name)` → `resolvedName` → string-interpolated into `manifests/tools/${resolvedName}.yaml` path.

     **Theoretical attack**: `harnessed install "../../etc/passwd"` → `resolvedName = '../../etc/passwd'` → `manifestPath = resolve(cwd, 'manifests/tools/../../etc/passwd.yaml')` → `path.resolve` normalizes to `/etc/passwd.yaml`. Then `readFile(manifestPath, 'utf8')` attempts to read `/etc/passwd.yaml` (or throws ENOENT).

     ## § 2 Spike outcome (verified reality, NOT theoretical)

     | Step | Outcome |
     |------|---------|
     | (1) `readFile('/etc/passwd.yaml', 'utf8')` | ENOENT (file doesn't exist) → catch block L86-94 |
     | (2) Falls through to `skillPackPath` try | ENOENT (file doesn't exist) → final catch L87-94 |
     | (3) Both fail → `console.error(...)` + `process.exit(1)` | exits 1 with error msg "manifest 'X' not found" |

     Even if attacker finds a `.yaml` file outside `manifests/` to read, the file is passed to `validateManifestFile()` L96 → TypeBox schema strict validate (`apiVersion: harnessed/v1` + `kind: Manifest` + ... required) → 99.9% rejects garbage YAML → exits 1.

     **Real attack surface = near-zero** for filesystem exfiltration:
     - `path.resolve` is absolute-safe (doesn't escape root)
     - ENOENT on most plausible target paths
     - TypeBox schema validate rejects non-manifest YAML
     - No filesystem WRITE primitive in install.ts user-input path
     - No shell exec / eval / subprocess with user input in install path (only npm/git invocations with manifest-derived versions; sister Phase 2.1 audit cmd injection SHELL_EVAL_MARKERS pattern protects those)

     ## § 3 RECOMMENDATION: DEFER explicit regex hardening to Phase 4.0 W0

     Karpathy YAGNI win. Currently sole consumer is project maintainer (no external user input arrives via untrusted source). Phase 4.0 W0 add regex if external user demand arrives:
     ```typescript
     // Phase 4.0 W0 (if external user input arrives — currently DEFER):
     if (/[\\/]|\\.\\./.test(name)) { console.error(`error: invalid manifest name (path chars rejected): ${name}`); process.exit(1) }
     ```
     Estimated 3L code delta. ≤200L hard limit OK (install.ts current 141L post-W0.2 Path A).

     ## § 4 Sister Phase 3.3 § 10.4 STRIDE Tampering already enumerated

     Sister Phase 3.3 RESEARCH § 10.4 already enumerated:
     - "Malicious aliases.yaml `redirect: '../../../etc/passwd'` (path traversal via redirect name)" — Tampering — mitigation: "install.ts could regex-guard `resolvedName` against `/[/\\.]/` chars (Phase 3.4 hardening if real threat surfaces)"

     → Phase 3.4 W0.4 spike outcome confirms: real threat does NOT surface (defense-in-depth already there). DEFER explicit regex hardening to Phase 4.0 W0 if external user demand arrives.

     ## § 5 Defense-in-depth empirical fixture

     `tests/integration/install-path-traversal.test.ts` (NEW ~40L 1 fixture) asserts `harnessed install "../../etc/passwd" --dry-run --non-interactive` exits 1 with 'manifest .* not found' (empirical proof of ENOENT graceful fallback; NO regex code change to install.ts per DEFER lock).
     ```
  2. Create NEW file `tests/integration/install-path-traversal.test.ts` ~40L 1 fixture per RESEARCH § 8.3 + sister Phase 3.3 tests/integration/install-aliases.test.ts spawn pattern:
     ```typescript
     // Phase 3.4 W0.4 — defense-in-depth empirical proof per SPIKE-W0.4-path-traversal.md.
     // NO regex code change to install.ts (DEFER lock); this fixture verifies existing
     // path.resolve + ENOENT graceful + TypeBox strict 双层 defense by spawning install.ts.
     // Sister Phase 3.3 tests/integration/install-aliases.test.ts spawn pattern.
     import { spawnSync } from 'node:child_process'
     import { mkdtemp, rm } from 'node:fs/promises'
     import { tmpdir } from 'node:os'
     import { join } from 'node:path'
     import { afterAll, beforeAll, describe, expect, it } from 'vitest'

     const CLI = join(process.cwd(), 'dist', 'cli.js')
     let tmpRoot: string

     beforeAll(async () => {
       tmpRoot = await mkdtemp(join(tmpdir(), 'install-path-traversal-'))
     })

     afterAll(async () => {
       await rm(tmpRoot, { recursive: true, force: true })
     })

     describe('Phase 3.4 W0.4 install.ts path traversal defense-in-depth (DEFER Phase 4.0)', () => {
       it('exits 1 with manifest not found on path traversal attempt (../../etc/passwd)', () => {
         const r = spawnSync(process.execPath, [CLI, 'install', '../../etc/passwd', '--dry-run', '--non-interactive'], {
           cwd: tmpRoot,
           encoding: 'utf8',
         })
         // ENOENT graceful fallback verified
         expect(r.status).toBe(1)
         expect(r.stderr).toMatch(/manifest .* not found/)
         // No exfiltration — assert no /etc/passwd content leak in stdout/stderr
         expect((r.stdout ?? '') + (r.stderr ?? '')).not.toMatch(/root:.*:0:0:/)
       })
     })
     ```
  3. Run biome preempt: `pnpm exec biome check --write tests/integration/install-path-traversal.test.ts`
  4. Run test: `pnpm test -- --run tests/integration/install-path-traversal.test.ts 2>&1 | tail -5` (expect 1/1 pass)
  5. **Recommended commit msg**:
     ```
     docs(phase-3.4-w0): T0.4 — W0.4 path traversal spike DEFER Phase 4.0 + 30L rationale doc + 1 defense-in-depth fixture (DEFERRED #AE)

     Spike outcome verified by code trace (RESEARCH § 8.2): install.ts L77-94
     path.resolve absolute-safe + ENOENT graceful + TypeBox schema strict validate
     双层 defense; real attack surface = near-zero. Sister Phase 3.3 § 10.4 STRIDE
     Tampering already enumerated this exact threat (mitigation: 'install.ts could
     regex-guard against `/[/\\.]/` chars (Phase 3.4 hardening if real threat
     surfaces)' — Phase 3.4 confirms NOT real).

     SPIKE-W0.4-path-traversal.md (~30L) 5-section rationale + 1 defense-in-depth
     empirical fixture (tests/integration/install-path-traversal.test.ts asserts
     'manifest .* not found' exit 1 + no /etc/passwd exfiltration). NO regex code
     change to install.ts per DEFER lock. Phase 4.0 W0 add regex if external user
     demand arrives.
     ```
  6. **Update Resolved (T0.4)** block at task_plan.md top — already RESOLVED PRE-PLAN per RESEARCH § 8.2, just confirm `pnpm test` 1 fixture pass
- **acceptance_criteria**:
  - `test -f .planning/phase-3.4/SPIKE-W0.4-path-traversal.md` exit 0
  - `wc -l .planning/phase-3.4/SPIKE-W0.4-path-traversal.md` ≥ 20 ≤ 60 (rationale doc spec)
  - `grep -q "DEFER Phase 4.0" .planning/phase-3.4/SPIKE-W0.4-path-traversal.md` exit 0 (DEFER lock literal)
  - `grep -E "ENOENT|path.resolve|TypeBox" .planning/phase-3.4/SPIKE-W0.4-path-traversal.md | wc -l` ≥ 3 (双层 defense verbiage)
  - `test -f tests/integration/install-path-traversal.test.ts` exit 0
  - `wc -l tests/integration/install-path-traversal.test.ts` ≤ 60 (CONTEXT spec ~40L)
  - `grep -q "etc/passwd" tests/integration/install-path-traversal.test.ts` exit 0 (test name verbatim)
  - `pnpm test -- --run tests/integration/install-path-traversal.test.ts 2>&1 | tail -3 | grep -E "Tests.*1 passed"` exit 0 (1 defense-in-depth fixture pass)
  - **NEGATIVE守门** — NO install.ts code change per DEFER lock: `git diff --stat src/cli/install.ts` from T0.2 baseline shows ≤2 line delta (Path A 1L import + 1L replace; NO additional regex guard added)
- **decision_source**: KICKOFF § 4 W0.4 + CONTEXT § Decisions W0.4 + Phase 3.3 deferred-items #AE verbatim + RESEARCH § 8 verbatim spike outcome + PATTERNS § 1 row 17 + orchestrator pre-planning #2 LOCKED (DEFER Phase 4.0 + 30L doc + 1 fixture; NOT inline regex hardening) + sister Phase 3.3 RESEARCH § 10.4 STRIDE Tampering cross-ref

---

### T0.5 — W0.5 30 sample sourcing pre-flight SAMPLES.md NEW ~180L 30-row matrix REAL HISTORICAL (gates Plan 02 W1 RUN ENGINE harness critical path)

- **files_modified**: `.planning/phase-3.4/SAMPLES.md` (NEW ~180L 30-row matrix; sister Phase 2.3 SAMPLES.md L1-80 § 1+2+3 frame 100% reuse + § 2 column schema ADAPTED per CONTEXT D-01 + planner Discretion #1 7-col (NOT sister 8-col) + D-01 REAL HISTORICAL content adapt per RESEARCH § 3 + PATTERNS § 2.3 verbatim)
- **read_first**:
  - `.planning/phase-2.3/SAMPLES.md` L1-100 (by Read — sister 3-section format 100% template reference: § 1 Selection Rationale + § 1.2 Distribution + § 1.3 Anti-cherry-pick + § 2 Sample Truth Table 8-col + § 3 Frozen Marker)
  - `tests/routing/samples-30.test.ts` L40-100 (by Read — sister markdown table parser pattern + rowRe regex; Plan 02 W1 routing harness MUST consume SAMPLES.md via same parser, so SAMPLES.md row format MUST match planner Discretion #1 7-col OR 8-col decision)
  - `routing/decision_rules.yaml` L1-50 + L100-200 (by Read — verify v2 production rules 12 rules + 5 engineering sub-rules + mattpocock_phases 23 招式 for per-row expected_decision manual trace per RESEARCH § 3.4)
  - `git log --since=2026-05-12 --until=2026-05-17 --no-merges --pretty=format:"%h %s"` (by Bash — verify 331 commits in window for D-01 mining feasibility per RESEARCH § 0)
  - `ls .planning/phase-*/task_plan.md` (by Bash — verify ~10 phase task_plan.md files exist for medium/complex sample harvest)
  - `ls .planning/intel/*.md` (by Bash — verify 2 intel docs exist: dashboard-handoff-2026-05-16.md + omc-comparison.md per RESEARCH § 3.1)
  - `.planning/phase-3.4/RESEARCH.md` § 3 (W0.5 mining technique + 7-bucket commit prefix distribution + SAMPLES.md row format verbatim — offset 278 limit 60)
  - `.planning/phase-3.4/PATTERNS.md` § 1 row 6 + § 2.3 (W0.5 SAMPLES.md mapping reuse 85% + concrete code excerpt verbatim)
  - `.planning/phase-3.4/CONTEXT.md` § Specifics L213-222 (D-01 SAMPLES.md row format yaml inline schema 7-col verbatim — planner Discretion #1)
- **action**:
  1. Run mining commands to gather sources (RESEARCH § 3.1 verified 3 sources, no over-engineering):
     ```bash
     git log --since=2026-05-12 --until=2026-05-17 --no-merges --pretty=format:"%h %s" > /tmp/3.4-commits.txt
     wc -l /tmp/3.4-commits.txt  # expect ~331 commits per RESEARCH § 0
     ls .planning/phase-*/task_plan.md  # expect ~10 files
     ls .planning/intel/*.md  # expect 2 files
     ```
  2. Bucket commits per RESEARCH § 3.2 7-bucket heuristic:
     ```bash
     grep -cE "^[a-f0-9]+ chore\\(phase-" /tmp/3.4-commits.txt  # ~20+ Haiku candidates
     grep -cE "^[a-f0-9]+ docs\\(" /tmp/3.4-commits.txt  # ~50+ Haiku/Sonnet candidates
     grep -cE "^[a-f0-9]+ test\\(" /tmp/3.4-commits.txt  # ~30+ Sonnet candidates
     grep -cE "^[a-f0-9]+ fix\\(" /tmp/3.4-commits.txt  # ~20+ Sonnet candidates
     grep -cE "^[a-f0-9]+ feat\\(phase-[0-9.]+-w[0-9]+\\):.*T[0-9]+\\.[0-9]+-T[0-9]+\\.[0-9]+" /tmp/3.4-commits.txt  # ~15+ Opus multi-task batch
     grep -cE "^[a-f0-9]+ refactor\\(" /tmp/3.4-commits.txt  # ~10+ Opus arch
     ```
     Select 10 + 10 + 10 high-signal samples per tier (≥ 8 each tier MIN per ROADMAP R7 dogfooding scope).
  3. Create NEW file `.planning/phase-3.4/SAMPLES.md` per PATTERNS § 2.3 verbatim 3-section format (sister Phase 2.3 SAMPLES.md L1-80 frame reuse — § 1+2+3 section structure 100% reuse + § 2 column schema ADAPTED per CONTEXT D-01 + planner Discretion #1 7-col, NOT sister 8-col). **7-col schema LOCKED** (CONTEXT § Specifics L213-222 verbatim, planner Discretion #1):
     - Columns: `| # | task_id | model_expected | task_type | description | source_commit | expected_decision (yaml inline) |`
     - **Row regex template (T1.6 routing harness loadSamples parser MUST consume this format)**: `/^\| (\d{2}) \| (T\d{2}) \| (haiku|sonnet|opus) \| (\w+) \| (.+?) \| ([0-9a-f]{7,10}) \| `\{(.+)\}` \|/`
     - Captures (named for executor clarity): id (2-digit zero-padded) / task_id (T01-T30) / model_expected (haiku|sonnet|opus enum) / task_type (\w+ slug) / description (non-greedy any) / source_commit (7-10 hex SHA) / expected_decision yaml inline body (parsed by yaml.parse in T1.6 harness)
     ```markdown
     # Phase 3.4 — 30 真实历史任务样本 (Routing Accuracy v0.3 dogfood — haiku/sonnet/opus 三段)

     > **Status**: frozen at phase 3.4 plan-phase Wave 0 / **execute-phase 不允许改样本** (sister Phase 2.3 R3 frozen 模式延袭)
     > **Trigger**: Phase 3.4 KICKOFF § 4 D-02 RUN ENGINE — 30 sample × routing.arbitrate → ≥85% (≥26/30) hit rate
     > **Test consumer**: `tests/routing/phase-3.4-routing-hit-rate.test.ts` (Plan 02 W1 T1.4 — markdown table parser 1:1 对应 § 2)
     > **Source**: REAL HISTORICAL — mining `git log --since=2026-05-12 --until=2026-05-17 --no-merges --pretty=format:"%h %s"` (331 commits verified) + `.planning/phase-{1.1..3.1}/task_plan.md` × 10 + `.planning/intel/{dashboard-handoff-2026-05-16,omc-comparison}.md` × 2 (D-01 LOCKED, dogfood real not synthetic)

     ## § 1 Selection Rationale (sister Phase 2.3 § 1)

     ### 1.1 来源约束 (REAL HISTORICAL, 不复用 phase 1.4 / 2.2 / 2.3 任一 sample)

     mining 路径 + 3 约束 — sister Phase 2.3 § 1.1 改写 per D-01:
     - 约束 1: 每 row source_commit field MANDATORY 非 empty (D-01 sneak block per PATTERNS § 3 D-01)
     - 约束 2: distribution 10 Haiku + 10 Sonnet + 10 Opus (D-01 + ROADMAP R7 ≥ 8 per tier MIN)
     - 约束 3: NOT 复用 phase 1.4 / 2.2 / 2.3 SAMPLES.md 任一 sample (REAL HISTORICAL means fresh mining, sister precedent samples excluded as synthetic)

     ### 1.2 分布 (10 Haiku trivial + 10 Sonnet medium + 10 Opus complex — D-01 + frozen)

     - **10 Haiku trivial** (single-line edits, mechanical fixes): chore(phase-X.Y-wN) dir scaffold + docs() typo single-paragraph + lint --fix biome warnings + simple comment update
     - **10 Sonnet medium** (single-file scope, 1-3 file edit): fix() bug fix single root-cause + test() NEW fixture file + feat() single component NEW + refactor() single file
     - **10 Opus complex** (multi-file architecture, cross-phase wire): feat(phase-X.Y-wN) multi-task batch T2.1-T2.4 + refactor() cross-file architecture (Phase 3.1 W-01 engineHook.ts PRIMARY extract) + ADR errata 9-section authoring + cross-phase schema migration

     ### 1.3 Anti-cherry-pick declaration (sister Phase 2.3 § 1.3 anchor / false-pos / CD-3 透明声明 pattern)

     - per-row source_commit field non-empty (D-01 sneak block守门)
     - manually-traced expected_decision against `routing/decision_rules.yaml` v2 12 rules priority hit (priority 100/80/70/60/50) + 5 engineering category sub-rules (engineering-discuss-feature / engineering-plan-architecture / engineering-execute-tdd / engineering-execute-debug / engineering-verify-pr) + mattpocock_phases 23 招式 routing schema (CLAUDE.md 工作流 4 phase × 21 unique skills)
     - per-tier breakdown defends mean (single tier < 60% cherry-pick warn per Plan 02 W1 harness; sister Phase 2.3 § 1.3 CD-3 disqualify edges 模式延袭)
     - ≥ 8 sample per tier hard min (R7 dogfooding scope ROADMAP L149 verbatim — Sonnet 100% / Haiku ≥ 84% bar requires ≥ 8 per tier for statistically meaningful)

     ## § 2 Sample Truth Table (30 sample — REAL HISTORICAL)

     | #  | task_id | model_expected | task_type | description (≤120 chars)                                                | source_commit | expected_decision (yaml inline)                              |
     |----|---------|----------------|-----------|------------------------------------------------------------------------|---------------|--------------------------------------------------------------|
     | 01 | T01     | haiku          | docs-typo | fix typo in CLAUDE.md routing prefix rule (single-char edit)            | <sha>         | `{router: B, reason: 'trivial single-file edit'}`            |
     | 02 | T02     | haiku          | lint      | lint --fix biome warnings src/cli/install.ts                            | <sha>         | `{router: B, reason: 'single-file lint auto-fix'}`           |
     | 03 | T03     | haiku          | chore     | chore(phase-3.3-w0) tests/manifest + tests/manifest/schema dirs setup   | <sha>         | `{router: B, reason: 'single-file scaffold'}`                |
     ... (executor mines exact source_commit shas + manually traces expected_decision per row, 30 rows total) ...
     | 30 | T30     | opus           | arch      | Phase 3.3 ADR 0016 9-section errata authoring + manifest-domain colocation 3rd consumer cycle | <sha>         | `{router: A, reason: 'multi-file architectural ADR + cross-phase carry'}` |

     ## § 3 Frozen Marker (sister Phase 2.3 § 1.4)

     - SAMPLES.md plan-phase Wave 0 锁定, execute-phase **不允许改样本** (R3 lock; Plan 02 W1 routing harness consumes frozen SAMPLES.md as input)
     - per-tier breakdown (Plan 02 W1 T1.4 输出) 防止单 model 拉高 mean
     - per-tier acceptance bar (R7 dogfooding scope ROADMAP L149 verbatim):
       - Sonnet ≥ 8 sample 内部命中率 ≥ 100% (perfection expected)
       - Haiku ≥ 8 sample 内部命中率 ≥ 84% (ROADMAP explicit lower bound)
       - Opus ≥ 8 sample 内部命中率 ≥ 80% (derived middle bar per RESEARCH § 4.4 A4 ASSUMED LOW risk)
     - Total ≥ 26/30 hit (≥ 85% sister Phase 2.3 D-05 同阈值; ADR 0017 errata 触发 才可改样本)
     ```
  4. **Per-row expected_decision derivation** — executor manually traces each of 30 samples against `routing/decision_rules.yaml` v2 12 rules + 5 engineering sub-rules + mattpocock_phases 23 招式 per RESEARCH § 3.4 verbatim
  5. **Per-row source_commit field MUST be non-empty** (D-01 sneak block per PATTERNS § 3 D-01 守门; executor verify via `grep -c "| <sha>" .planning/phase-3.4/SAMPLES.md` == 0 post-fill — all `<sha>` placeholders MUST be replaced with actual git short-shas)
  6. Karpathy ≤200L hard limit — 30 row × 6L avg = 180L ≤ 200L (per RESEARCH § 3.3 + PATTERNS § 1 row 6)
  7. **Recommended commit msg**:
     ```
     feat(phase-3.4-w0): T0.5 — SAMPLES.md 30 真实历史任务 sourcing pre-flight (W1 RUN ENGINE harness 前置)

     D-01 REAL HISTORICAL LOCKED — mining git log --since=2026-05-12 --until=
     2026-05-17 --no-merges (331 commits verified per RESEARCH § 0) + .planning/
     phase-{1.1..3.1}/task_plan.md × 10 + .planning/intel/{dashboard-handoff,omc-
     comparison}.md × 2 (3 sources, Karpathy YAGNI; REJECT STATE.md narrative +
     RETROSPECTIVE post-hoc + phase PLAN/CONTEXT too-wide-scope).

     Distribution: 10 Haiku trivial (chore/lint/typo) + 10 Sonnet medium (fix/
     test/refactor single-file) + 10 Opus complex (feat multi-task batch / cross
     -phase wire / arch rework) per ROADMAP R7 ≥ 8 per tier MIN. Per-row source
     _commit field non-empty + manually-traced expected_decision against routing
     /decision_rules.yaml v2 12 rules + 5 engineering sub-rules + mattpocock_
     phases 23 招式 (sister Phase 2.3 § 1.3 anchor / false-pos / CD-3 透明声明
     pattern). Sister Phase 2.3 SAMPLES.md 3-section format 100% template reuse.

     Frozen at plan-phase Wave 0 R3 lock — execute-phase 不允许改样本; Plan 02 W1
     routing harness consumes frozen SAMPLES.md as input (critical path
     dependency — W0.5 MUST ship before Plan 02 starts).
     ```
  8. **Update Resolved (T0.5)** block at task_plan.md top with outcome (30 sample task_id list T01-T30 + per-tier distribution verify 10/10/10)
- **acceptance_criteria**:
  - `test -f .planning/phase-3.4/SAMPLES.md` exit 0
  - `wc -l .planning/phase-3.4/SAMPLES.md` ≤ 200 (Karpathy hard limit)
  - `grep -cE "^\\| 0[1-9] \\|| [12][0-9] \\|| 30 \\|" .planning/phase-3.4/SAMPLES.md` == 30 (30 row count strict; row regex matches sister samples-30.test.ts L47 rowRe with 2-digit zero-padded id)
  - `grep -cE "haiku" .planning/phase-3.4/SAMPLES.md` ≥ 10 (10 Haiku per tier distribution)
  - `grep -cE "sonnet" .planning/phase-3.4/SAMPLES.md` ≥ 10 (10 Sonnet per tier distribution)
  - `grep -cE "opus" .planning/phase-3.4/SAMPLES.md` ≥ 10 (10 Opus per tier distribution)
  - `grep -E "REAL HISTORICAL|source_commit" .planning/phase-3.4/SAMPLES.md | wc -l` ≥ 3 (D-01 sneak block守门 — Source declaration + source_commit column header + per-row references)
  - `grep -E "frozen|Frozen Marker" .planning/phase-3.4/SAMPLES.md | wc -l` ≥ 1 (R3 lock)
  - `! grep -E "\\| <sha> \\|" .planning/phase-3.4/SAMPLES.md` exit 0 (no `<sha>` placeholder unresolved — all 30 rows have actual git short-shas)
  - `! grep -E "\\| T0[1-9] \\| sonnet \\|.*\\| haiku \\|" .planning/phase-3.4/SAMPLES.md` exit 0 (no mixed-tier row drift; executor sanity check tier-task_id consistency)
- **decision_source**: KICKOFF § 4 W0.5 + CONTEXT § Decisions D-01 verbatim REAL HISTORICAL + RESEARCH § 3 verbatim mining technique + PATTERNS § 1 row 6 + § 2.3 verbatim concrete code + sister Phase 2.3 SAMPLES.md 3-section format 100% template + planner Discretion #1 (7-col schema simplified per CONTEXT § Specifics L213-222 vs sister 8-col)

---

## Wave 0 done

All 5 atomic tasks complete. Plan 01 (Wave 0) SHIPPED criteria all satisfied per PLAN.md `<success_criteria>`. **Next**: Plan 02 (Wave 1) — check-token-budget.ts NEW ≤40L PRIMARY helper + doctor.ts MODIFY 8th check Option A inline shrink locked (195L → exact 200L hit) + tests/routing/phase-3.4-routing-hit-rate.test.ts NEW ~120L sister samples-30.test.ts 100% template + 5 unit/integration tests. Then Plan 03 (Wave 2) — ADR 0017 9 章节 + v0.3.0 milestone close 11 atomic tasks (sister Phase 2.4 W6 v0.2.0 close 100% template) + triple tag adr-0017-accepted + v0.3.0-alpha.4-routing + 🎯 v0.3.0.

> **Critical path reminder**: SAMPLES.md (T0.5) MUST ship before Plan 02 starts; Plan 02 W1 routing harness has no input without W0.5 frozen sample matrix.

> **Plan 02 W1 prereq from Wave 0 outputs**:
> - W0.1 STATE.md ≤200L trim + ship-time T6.N cadence integrated (D2 first-implementation in Plan 03 W2 T2.3)
> - W0.2 install.ts pkg.version + package.json 0.3.0 (unblocks `harnessed install --known-good` functional verify; Plan 02 W1 doctor 8th check unaffected)
> - W0.3 versions/0.3.0-known-good.yaml 8 entries (Plan 02 W1 integration test consumer)
> - W0.4 path traversal spike DEFER + 1 fixture (Plan 02 W1 unaffected; W0 closure complete)
> - W0.5 SAMPLES.md 30-row frozen matrix (Plan 02 W1 T1.4 routing harness primary consumer — critical path)

> **Plan 03 W2 v0.3.0 close prereq from Wave 0 outputs**:
> - W0.1 D2 ship-time T6.N cadence integrated → Plan 03 W2 T2.3 STATE/RETRO 续编 IS the first-implementation of this cadence (sister Phase 2.4 W6 T6.3 RETRO 续编 pattern 100% reuse)
> - W0.1 D3 ci.yml CI step adjacency → Plan 03 W2 T2.7 A7 iter 1-0016→1-0017 同 file (5 sed-replace sites: L34 + L35 + L71 + L74 + L99) MODIFY combined acceptable (additive W0.1 vs literal swaps W2.T2.7, no merge conflict)
> - W0.4 SPIKE-W0.4-path-traversal.md → Plan 03 W2 T2.1 ADR 0017 § 6 cross-ref (sister Phase 3.3 ADR 0016 9-section errata pattern)
> - W0.5 SAMPLES.md frozen → Plan 03 W2 T2.10 .planning/v0.3.0-MILESTONE-AUDIT.md § 1 Per-Phase Status row Phase 3.4 evidence reference (sister v0.2.0-MILESTONE-AUDIT.md 150L 6-section template gold-standard inaugurate v0.3.0 NEW surface per orchestrator pre-planning #4)

---

## Wave 1 — Main scope (6 atomic; check-token-budget + doctor 8th + tests + routing harness) — appended 2026-05-17 per orchestrator W1+W2 extend directive

### T1.1 — src/cli/lib/check-token-budget.ts NEW ≤40L PRIMARY helper (D-03 BUFFER /4 + D-04 DOCTOR WARN; 4th sister family member)

- **files_modified**: `src/cli/lib/check-token-budget.ts` (NEW ~38L PRIMARY helper per RESEARCH § 2.1 + PATTERNS § 2.1 + CONTEXT D-03+D-04 LOCKED)
- **read_first**:
  - `src/cli/lib/probe-gstack.ts` L1-48 (sister Phase 3.2 W1 T1.4 PRIMARY helper 100% pattern reuse model)
  - `src/cli/lib/check-deprecations.ts` L1-43 (sister Phase 3.3 W1 T1.6 PRIMARY helper sister-family pattern; CheckResult export + try/catch 3-tier status pattern)
  - `src/checkpoint/template.ts` L34-36 (verify `estimateTokens(s) = Math.ceil(Buffer.byteLength(s, 'utf8') / 4)` D-03 sister 1 precedent import target)
  - `.planning/phase-3.4/RESEARCH.md` § 2 verbatim recipe + PATTERNS § 2.1 concrete code excerpt
- **action**:
  1. Create NEW file per RESEARCH § 2.1 verbatim ≤40L: imports from node:fs + node:os + node:path + estimateTokens from src/checkpoint/template; const CONTEXT_WINDOW_TOKENS=200_000 + TOTAL_THRESHOLD=2_000 + PER_SKILL_THRESHOLD=5_000; scanSkillsDir(root) helper; export checkTokenBudget(): CheckResult — scans homedir+/.claude/skills + cwd+/skills via flatMap, computes total + overSkill filter, returns warn if total>2000 OR any skill>5000 with top-3 consumers msg + fix hint; else returns pass.
  2. Run biome preempt + typecheck
  3. Update Resolved (T1.1 wc gate) block at task_plan.md top
- **acceptance_criteria**:
  - `test -f src/cli/lib/check-token-budget.ts` exit 0
  - `wc -l src/cli/lib/check-token-budget.ts` ≤ 40 (Karpathy CONTEXT D-04 spec)
  - `grep -q "export function checkTokenBudget" src/cli/lib/check-token-budget.ts` exit 0
  - `grep -q "import { estimateTokens } from '../../checkpoint/template" src/cli/lib/check-token-budget.ts` exit 0 (D-03 sister 1 precedent zero-dep import)
  - `! grep -E "import.*tiktoken|require\(.tiktoken.\)" src/cli/lib/check-token-budget.ts` exit 0 (§ 13.1 anti-pattern #4 sneak block)
  - `! grep -E "execSync|spawnSync" src/cli/lib/check-token-budget.ts` exit 0 (T-3.4w1-02 security mitigation)
  - `grep -q "CONTEXT_WINDOW_TOKENS = 200_000" src/cli/lib/check-token-budget.ts` exit 0
  - `pnpm typecheck 2>&1 | tail -3` exit 0
- **decision_source**: CONTEXT D-03 BUFFER /4 + D-04 DOCTOR WARN LOCKED + RESEARCH § 2 verbatim + PATTERNS § 2.1 + sister Phase 3.2 W1 T1.4 + Phase 3.3 W1 T1.6 PRIMARY helper family + § 13.1 anti-pattern #4 sneak block (NO tiktoken)

---

### T1.2 — src/cli/doctor.ts MODIFY +5L 8th check Option A inline shrink (pre-flight wc -l == 195 + post-modify wc -l == 200 exact; Karpathy NO B-03 tolerance per D-04 lock)

- **files_modified**: `src/cli/doctor.ts` (MODIFY +5L: NEW async function checkTokenBudget Option A inline shrink 3L delegate + results array push +1L + description string append +1L)
- **read_first**:
  - `src/cli/doctor.ts` L1-195 entire file — VERIFY 195L baseline preserved no drift; identify L138-142 checkGstackPrefix + L147-150 checkDeprecations + L152-195 registerDoctor area
  - `src/cli/lib/check-token-budget.ts` post-T1.1 — verify export
  - `.planning/phase-3.4/RESEARCH.md` § 1 (W1 T1.2 195→200L borderline + Option A inline shrink verbatim — offset 110 limit 60)
  - `.planning/phase-3.4/PATTERNS.md` § 2.2 verbatim
- **action**:
  1. **PRE-FLIGHT GATE** (CRITICAL): `wc -l src/cli/doctor.ts` MUST == 195; if != 195 → escalate to planner before proceeding (mitigation Option B helper extract sister Phase 3.1 W-01 engineHook PRIMARY pattern may be needed)
  2. After `checkDeprecations` (~L147-150), ADD NEW function Option A inline shrink (3L delegate; sister L147-150 pattern + 1L extra shrink per orchestrator pre-planning #1 + #5):
     ```typescript
     async function checkTokenBudget(): Promise<CheckResult> {
       return (await import('./lib/check-token-budget.js')).checkTokenBudget()
     }
     ```
  3. Modify results array (~L160-168): ADD `await checkTokenBudget()` 行 at end after `await checkDeprecations()` 行
  4. Update description string (~L156-157): append `/ token budget` → `'Preflight checks (Node / MCP scope / jq / Win bash / origin URL / gstack prefix / deprecations / token budget)'`
  5. **POST-MODIFY GATE** (W-6 orchestrator iter-1 fix — sister Phase 3.3 W1 T1.7 cadence; Karpathy hard limit ≤200 容 biome 微 drift NOT exact-200 strict): `wc -l src/cli/doctor.ts` MUST be ≤ 200; acceptable range 198-200L (Option A inline shrink + biome formatter may leave 199L instead of exact 200L — both ship-OK). HARD FAIL only if > 200 → executor MUST revert + escalate to planner for **Option B helper extract** (move checkOriginUrl body → src/cli/lib/check-origin-url.ts reclaims ~25L headroom). Option B remains backup escalation per orchestrator pre-planning #1 + #5 LOCKED.
  6. Run biome preempt + typecheck
  7. Update Resolved (T1.2 doctor.ts wc gate) block with outcome (Option A vs B chosen)
- **acceptance_criteria**:
  - `grep -q "checkTokenBudget" src/cli/doctor.ts` exit 0
  - `grep -q "await checkTokenBudget()" src/cli/doctor.ts` exit 0
  - `grep -q "token budget" src/cli/doctor.ts` exit 0 (description string updated)
  - `wc -l src/cli/doctor.ts` ≤ 200 (sister Phase 3.3 W1 T1.7 cadence; Karpathy hard limit ≤200 容 biome 微 drift; Option A shrink target 198-200L acceptable; Option B helper extract escalation backup if >200L)
  - `pnpm typecheck 2>&1 | tail -3` exit 0
  - `pnpm test -- --run tests/cli/doctor.test.ts 2>&1 | tail -5 | grep -E "Tests.*passed"` exit 0
- **decision_source**: D-04 DOCTOR WARN + RESEARCH § 1.2-1.3 Option A inline shrink verbatim + PATTERNS § 2.2 + sister Phase 3.3 W1 T1.7 7th check pattern + orchestrator pre-planning #1 + #5 LOCKED

---

### T1.3 — tests/cli/check-token-budget.test.ts NEW ~50L 5 fixture (sister Phase 3.3 check-deprecations.test.ts 5-fixture pattern)

- **files_modified**: `tests/cli/check-token-budget.test.ts` (NEW ~50L 5 fixture per RESEARCH § 10.1 functional + § 10.3 Wave 0 gaps)
- **read_first**:
  - `tests/cli/check-deprecations.test.ts` (sister Phase 3.3 W1 T1.12 5-fixture per-check pattern model)
  - `src/cli/lib/check-token-budget.ts` post-T1.1 — verify export signature
  - `tests/checkpoint/state.test.ts` (sister vi.mock('node:fs') three件套 pattern for skills dir mocking)
- **action**:
  1. Create NEW file ~50L: imports vitest + checkTokenBudget from src/cli/lib/check-token-budget; vi.mock('node:fs') + vi.mock('node:os'); 5 fixture (fix 1: skills/ dir missing → status='pass' message contains '0 tokens'; fix 2: 1 skill ~100 chars → status='pass' total ≤2000; fix 3: 50 skills × 100 chars → status='pass' under threshold; fix 4: 50 skills × 200 chars (~2500 tokens) → status='warn' with top consumers + '% of 200000' format; fix 5: 1 skill with 6000 token description (>5k per-skill) → status='warn' + per-skill flag).
  2. estimateTokens 不 mock — 用真 Buffer.byteLength + fixture string per sister Phase 3.1 W2 enforceBudget.test.ts pattern (D-03 sister 1 precedent zero-dep verify)
  3. Run biome preempt + run test
- **acceptance_criteria**:
  - `test -f tests/cli/check-token-budget.test.ts` exit 0
  - `wc -l tests/cli/check-token-budget.test.ts` ≥ 30 ≤ 80
  - `grep -cE "it\(.*pass|it\(.*warn|it\(.*threshold|it\(.*per-skill" tests/cli/check-token-budget.test.ts` ≥ 5 (5 fixtures)
  - `pnpm test -- --run tests/cli/check-token-budget.test.ts 2>&1 | tail -3 | grep -E "Tests.*5 passed"` exit 0
  - `! grep -E "import.*tiktoken" tests/cli/check-token-budget.test.ts` exit 0 (anti-pattern #4 sneak block)
- **decision_source**: RESEARCH § 10.1 functional + PATTERNS § 1 row 9 + sister Phase 3.3 W1 T1.12 check-deprecations.test.ts 5-fixture per-check pattern + § 13.1 anti-pattern #4 sneak block verify

---

### T1.4 — tests/cli/doctor.test.ts + tests/cli/doctor-fixtures.test.ts MODIFY 7→8 check baseline update (sister Phase 3.3 W1 T1.12 W-04 7→8 parametrize update pattern)

- **files_modified**: `tests/cli/doctor.test.ts` (MODIFY +~10L: 1 new fixture asserts 8 entries + 8th name === 'token budget' + warn-not-fail exit 0) + `tests/cli/doctor-fixtures.test.ts` (MODIFY +~10L: add 8th check to parametrize array sister 7-check pattern)
- **read_first**:
  - `tests/cli/doctor.test.ts` — verify Phase 3.3 W1 T1.12 W-04 7th check fixture pattern post-Phase 3.3 ship; mock setup + results array assertion baseline
  - `tests/cli/doctor-fixtures.test.ts` — verify Phase 3.3 W1 T1.12 W-04 7-check parametrize pattern
  - `src/cli/doctor.ts` post-T1.2 — verify 8th check `await checkTokenBudget()` results array push
- **action**:
  1. **doctor.test.ts MODIFY** — add 8th check fixture sister Phase 3.3 W1 T1.12 W-04 pattern:
     ```typescript
     it('doctor 8th check token budget — status warn does NOT fail exit code (B-06 warn ≠ fail per D-04 DOCTOR WARN)', async () => {
       const result = await runDoctor()
       expect(result.results.length).toBe(8) // was 7 post-Phase 3.3
       expect(result.results[7].name).toBe('token budget')
       expect(['pass', 'warn']).toContain(result.results[7].status)
       expect(result.exitCode).toBe(0) // warn ≠ fail per D-04 + B-06
     })
     ```
  2. **doctor-fixtures.test.ts MODIFY** — add 'token budget' to parametrize array (sister 7-check pattern):
     ```typescript
     const CHECK_NAMES = ['Node version', 'MCP scope', 'jq', 'Win bash', 'origin URL', 'gstack prefix', 'deprecated manifests', 'token budget'] // 7 → 8
     ```
  3. Run biome preempt + run tests
- **acceptance_criteria**:
  - `grep -q "token budget" tests/cli/doctor.test.ts` exit 0 (8th check fixture added)
  - `grep -q "token budget" tests/cli/doctor-fixtures.test.ts` exit 0 (parametrize updated)
  - `grep -cE "Node version|MCP scope|jq|Win bash|origin URL|gstack prefix|deprecated manifests|token budget" tests/cli/doctor-fixtures.test.ts` ≥ 8 (8 check names in parametrize)
  - `pnpm test -- --run tests/cli/doctor.test.ts tests/cli/doctor-fixtures.test.ts 2>&1 | tail -3 | grep -E "Tests.*passed"` exit 0 (existing 7 check + new 8th check fixtures all pass)
- **decision_source**: RESEARCH § 10.3 Wave 0 gaps doctor 8th dispatch + sister Phase 3.3 W1 T1.12 W-04 7→8 baseline update pattern 100% reuse + D-04 DOCTOR WARN B-06 warn ≠ fail exit code lock

---

### T1.5 — tests/scripts/check-state-archive-stale.test.ts NEW ~50L gate test 3 rules verify (warn-only round 1 verify exit 0 with violations printed)

- **files_modified**: `tests/scripts/check-state-archive-stale.test.ts` (NEW ~50L 3 fixture per RESEARCH § 10.3 Wave 0 gaps + sister scripts/check-transparency-verdicts test pattern)
- **read_first**:
  - `tests/scripts/dashboard-sse.test.ts` (sister scripts/ test pattern model; tmpdir isolation + spawnSync pattern)
  - `scripts/check-state-archive-stale.mjs` post-T0.1 — verify 3 rules + ENFORCE=false warn-only round 1
- **action**:
  1. Create NEW file ~50L 3 fixture using spawnSync gate test pattern: beforeEach mkdtemp tmpRoot + afterEach rm; fixture 1: STATE.md ≤200L + no violations → exit 0 + stdout contains 'compliant'; fixture 2: STATE.md 250L (Rule 1 violation) → exit 0 (warn-only round 1) + stderr contains 'Rule 1 (size)'; fixture 3: STATE.md with `W-1 errata` literal (Rule 3 violation) → exit 0 + stderr contains 'Rule 3 (errata)'.
  2. Run biome preempt + run test
- **acceptance_criteria**:
  - `test -f tests/scripts/check-state-archive-stale.test.ts` exit 0
  - `grep -cE "it\(.*Rule|it\(.*violat|it\(.*comp" tests/scripts/check-state-archive-stale.test.ts` ≥ 3 (3 fixtures)
  - `pnpm test -- --run tests/scripts/check-state-archive-stale.test.ts 2>&1 | tail -3 | grep -E "Tests.*passed"` exit 0
  - `grep -q "ENFORCE.*false|warn-only" tests/scripts/check-state-archive-stale.test.ts` exit 0 (warn-only round 1 verify)
- **decision_source**: RESEARCH § 10.3 Wave 0 gaps check-state-archive-stale 1 fixture + § 11.2 gate design + PATTERNS § 1 row 1 sister transparency-verdicts pattern + warn-only round 1 verify

---

### T1.6 — tests/routing/phase-3.4-routing-hit-rate.test.ts NEW ~130L sister samples-30.test.ts 100% template (D-02 RUN ENGINE + per-tier breakdown + ≥26/30 hard gate)

- **files_modified**: tests/routing/phase-3.4-routing-hit-rate.test.ts (NEW ~130L sister tests/routing/samples-30.test.ts L1-150 Phase 2.3 W4 T4.3 100% template per RESEARCH § 4 + PATTERNS § 2.5 + D-02 LOCKED)
- **read_first**:
  - tests/routing/samples-30.test.ts L1-150 entire file (sister harness 100% template; verify pre-compute SAMPLES + RESULTS race avoidance pattern L84-91 + per-sample it() loop L100-110 + per-category breakdown L116-144 + hard gate L143 expect totalHit ≥ 26)
  - .planning/phase-3.4/SAMPLES.md post-T0.5 — verify frozen R3 lock 30-row matrix + row regex format
  - routing/decision_rules.yaml L1-50 — verify v2 production rules ready for arbitrate dispatch
  - src/routing/decisionRules.ts L75-200 — verify arbitrate(rules, task) signature + loadDecisionRules(yamlPath) API
  - .planning/phase-3.4/RESEARCH.md § 4 (D-02 RUN ENGINE harness verbatim — offset 339 limit 90)
  - .planning/phase-3.4/PATTERNS.md § 1 row 10 + § 2.5 (W1 T1.6 mapping reuse 90% + concrete code excerpt verbatim)
- **action**:
  1. Create NEW file ~130L per RESEARCH § 4 verbatim — **harness skeleton + describe block structure 100% reuse from sister samples-30.test.ts L1-150** + per-tier breakdown adapt (haiku/sonnet/opus replacing design/content/testing categories):
     - imports vitest + arbitrate/loadDecisionRules/Rule/TaskContext from src/routing/decisionRules
     - Sample interface (task_id + model_expected union haiku/sonnet/opus + task_type + description + source_commit + expected_decision router+reason)
     - SAMPLES_PATH .planning/phase-3.4/SAMPLES.md + RULES_PATH routing/decision_rules.yaml
     - loadSamples(path) markdown table parser. **rowRe ADAPTED from sister samples-30.test.ts L44-62 (NOT 100% reuse as PATTERNS may imply — sister was 8-col; this phase 7-col per CONTEXT D-01 + planner Discretion #1)**. Use exact regex template from T0.5 step 3: `/^\| (\d{2}) \| (T\d{2}) \| (haiku|sonnet|opus) \| (\w+) \| (.+?) \| ([0-9a-f]{7,10}) \| `\{(.+)\}` \|/`. Parse expected_decision yaml inline body via yaml.parse() (sister uses JSON.parse — adapted because 7-col schema uses yaml inline body NOT JSON)
     - buildTask(s) returns TaskContext with task description + task_type + model_hint fields
     - PRE-COMPUTE SAMPLES + RULES + RESULTS at top-level (sister L84-91 vitest parallel race avoidance)
     - describe block 1: Phase 3.4 30-sample routing.arbitrate harness D-02 RUN ENGINE ≥85% — parses exactly 30 samples + per-sample it() cells with MISS console.error diff
     - describe block 2: Routing accuracy v0.3 summary — per-tier breakdown haiku/sonnet/opus byTier Map + cherry-pick warn < 60% + hard gates expect sonnetAcc toBe 1.0 + expect haikuAcc toBeGreaterThanOrEqual 0.84 + expect opusAcc toBeGreaterThanOrEqual 0.80 + expect totalHit toBeGreaterThanOrEqual 26
  2. Run biome preempt + run test
  3. **USER-ESCALATION CONTRACT (3-option fail-path) — B-2 orchestrator iter-1 fix**: If `totalHit < 26/30` OR `sonnetAcc < 1.0` (per-tier Sonnet 100% required) → **executor MUST NOT silently retune or recompose samples**. Escalate to user with these 3 options verbatim:
     - **(a) accept R3 freeze + ship Phase 3.4 with documented routing gap**: log gap in DOGFOOD-T2.X.md as v0.4.0 carry-forward backlog (DEFERRED #AI new); MILESTONE-AUDIT § 4 Requirements Coverage R7 row marked "partial — gap documented Phase 3.4 v0.4.0 carry"; v0.3.0 ship proceeds with PASSED verdict bracketed.
     - **(b) re-mine SAMPLES.md (breaks R3 frozen lock)**: requires ADR 0017 errata addendum justifying re-mine (sister Phase 2.3 § 1.4 cherry-pick 防御 explicit override path); adds ~2h delay; v0.3.0 ship-day risk.
     - **(c) tune decision_rules.yaml v2** (out of v0.3.0 scope): defer to v0.4.0 R8.1 dogfooding benchmark publication phase; reject in this phase per scope discipline.
     - Executor presents 3 options to user via checkpoint + waits for user-explicit option ID before proceeding (do NOT proceed silently with any option).
- **acceptance_criteria**:
  - test -f tests/routing/phase-3.4-routing-hit-rate.test.ts exit 0
  - wc -l tests/routing/phase-3.4-routing-hit-rate.test.ts ≥ 100 ≤ 200 (sister samples-30.test.ts 150L target range)
  - grep -q SAMPLES.md tests/routing/phase-3.4-routing-hit-rate.test.ts exit 0 (consumes W0.5 SAMPLES.md)
  - grep -q loadDecisionRules tests/routing/phase-3.4-routing-hit-rate.test.ts exit 0 (production routing rules NOT mock per D-02 Discretion)
  - grep -q arbitrate tests/routing/phase-3.4-routing-hit-rate.test.ts exit 0 (D-02 RUN ENGINE per-sample dispatch)
  - grep -q toBeGreaterThanOrEqual.26. tests/routing/phase-3.4-routing-hit-rate.test.ts exit 0 (≥26/30 hard gate sister Phase 2.3 D-05 同阈值)
  - grep -q sonnetAcc tests/routing/phase-3.4-routing-hit-rate.test.ts exit 0 (Sonnet 100% per R7 ROADMAP L149)
  - grep -q haikuAcc tests/routing/phase-3.4-routing-hit-rate.test.ts exit 0 (Haiku ≥ 84% per R7)
  - pnpm test -- --run tests/routing/phase-3.4-routing-hit-rate.test.ts 2>&1 | tail -10 shows TOTAL ≥ 26/30 hit + per-tier breakdown line
- **decision_source**: D-02 RUN ENGINE LOCKED + RESEARCH § 4 verbatim sister samples-30.test.ts 100% template + PATTERNS § 2.5 verbatim concrete code + ROADMAP R7 L149 verbatim per-tier acceptance bar (Sonnet 100% / Haiku ≥ 84% / Opus ≥ 80% derived) + sister Phase 2.3 W4 T4.3 30/30 100% 1-shot precedent

---

## Wave 1 done

All 6 atomic tasks complete. Plan 02 (Wave 1) SHIPPED criteria all satisfied per PLAN.md Wave 1 success_criteria block. **Next**: Plan 03 (Wave 2) — ADR 0017 9 章节 + v0.3.0 milestone close 11+1 atomic tasks (sister Phase 2.4 W6 v0.2.0 close 100% template + sister Phase 3.3 W2 T2.1-T2.10 cross-ref) + triple tag adr-0017-accepted + v0.3.0-alpha.4-routing + 🎯 v0.3.0.

> **Critical path verify**: T1.6 routing harness ≥26/30 hard gate PASS (consumes W0.5 SAMPLES.md frozen 30-row matrix; per-tier breakdown Sonnet 100% / Haiku ≥ 84% / Opus ≥ 80% derived per R7 ROADMAP L149); if FAIL → escalate to planner for SAMPLES.md re-verify OR decision_rules.yaml v2 routing tune (NOT modify samples per R3 frozen lock — sister Phase 2.3 W4 T4.3 cherry-pick 防御 cadence).

> **Plan 03 W2 v0.3.0 close prereq from Wave 1 outputs**:
> - W1 T1.1 check-token-budget.ts NEW ≤40L (Plan 03 W2 T2.1 ADR 0017 § 3 D-03 BUFFER /4 reference)
> - W1 T1.2 doctor.ts 8th check ≤200L exact (Plan 03 W2 T2.1 ADR 0017 § 4 D-04 DOCTOR WARN reference)
> - W1 T1.6 routing harness ≥26/30 (Plan 03 W2 T2.10 v0.3.0-MILESTONE-AUDIT § 4 Requirements Coverage R7 evidence)
> - Full suite green pre-W2 (Plan 03 W2 T2.12 triple tag push gating)


---

## Wave 2 — v0.3.0 close ship 11+1 atomic (sister Phase 2.4 W6 v0.2.0 close 100% template + Phase 3.3 W2 T2.1-T2.10 9-task cadence延袭)

### T2.1 — docs/adr/0017-routing-hit-rate-token-budget.md NEW ~150-200L ≤250L 9 章节 errata (sister ADR 0016 9-section template 100% reuse)

- **files_modified**: docs/adr/0017-routing-hit-rate-token-budget.md (NEW ~180L 9 章节 per RESEARCH § 9.3 W2.T2.1 + sister Phase 3.3 W2 T2.5 ADR 0016 9-section gold-standard 100% template)
- **read_first**:
  - docs/adr/0016-aliases-deprecation-known-good.md entire — sister Phase 3.3 W2 9-section template 100% gold-standard model
  - docs/adr/0015-gstack-probe-interpolate-plan-feature.md — sister Phase 3.2 ADR 9 章节 cadence reference
  - docs/adr/0014-checkpoint-engine-resume-compact.md — sister Phase 3.1 9 章节 cadence reference
  - All Wave 0+1 outputs (CONTEXT + RESEARCH + PATTERNS + SAMPLES + STATE current + all 8 src/test files just created/modified post-W0+W1)
- **action**:
  1. Create NEW file ~180L 9 章节 errata sister ADR 0016 100% pattern:
     - Header: ADR 0017 - Phase 3.4 routing hit-rate ≥ 85% + token budget doctor 8th check + v0.3.0 milestone close (Accepted YYYY-MM-DD)
     - § 1 D-01 REAL HISTORICAL 30 sample mining rationale (SYNTHETIC vs MIXED rejected)
     - § 2 D-02 RUN ENGINE per-sample arbitrate dispatch (DRY-RUN + FULL E2E rejected; sister Phase 2.3 W4 100% template; production routing/decision_rules.yaml v2)
     - § 3 D-03 BUFFER /4 sister Phase 3.1 D-01 enforceBudget precedent zero-dep (TIKTOKEN rejected; estimateTokens import; 中文 variance acceptable)
     - § 4 D-04 DOCTOR WARN sister 7→8 check UX (CI FAIL + SILENT LOG rejected; Option A inline shrink doctor.ts 200L exact)
     - § 5 W0.1 STRATEGIC STATE.md institutionalize 4 D-decisions D1-D4 paranoid framing (cleanup命名 rejected)
     - § 6 schemaVersion 13-surface CD-5 consumer (NO NEW surface this phase)
     - § 7 v0.3.0 close milestone discipline (sister v0.2.0 single-day cadence; 3-file archive triplet)
     - § 8 W0.4 path traversal spike DEFER Phase 4.0 cross-ref (sister Phase 3.3 § 10.4 STRIDE Tampering already enumerated)
     - § 9 ASR/ADR-stats total 17 + cumulative milestone progress 4/4 + triple tag push
  2. Karpathy hard limit ≤250L (sister 0014/0015/0016 范围)
- **acceptance_criteria**:
  - test -f docs/adr/0017-routing-hit-rate-token-budget.md exit 0
  - wc -l docs/adr/0017-routing-hit-rate-token-budget.md min 100 max 250 (sister 0014/0015/0016 range; Karpathy hard limit)
  - grep -cE pattern-hash-hash-section docs/adr/0017-routing-hit-rate-token-budget.md ≥ 9 (9 章节 verify per sister cadence)
  - grep -q Accepted docs/adr/0017-routing-hit-rate-token-budget.md exit 0 (status field)
  - grep -q REAL-HISTORICAL docs/adr/0017-routing-hit-rate-token-budget.md exit 0 (§ 1)
  - grep -q RUN-ENGINE docs/adr/0017-routing-hit-rate-token-budget.md exit 0 (§ 2)
  - grep -q estimateTokens-or-BUFFER docs/adr/0017-routing-hit-rate-token-budget.md exit 0 (§ 3)
  - grep -q DOCTOR-WARN-or-D-04 docs/adr/0017-routing-hit-rate-token-budget.md exit 0 (§ 4)
- **decision_source**: sister Phase 3.3 W2 T2.5 ADR 0016 9-section template gold-standard 100% reuse + sister Phase 3.1+3.2 ADR 0014+0015 cadence + RESEARCH § 9.3 W2.T2.1 verbatim

---

### T2.2 — .planning/STATE.md 续编 Phase 3.4 SHIPPED event log + 当前位置 块 v0.3.0 4/4 SHIPPED + W0.1 D2 ship-time T6.N cadence first-implementation (Phase 3.1+3.2 narrative trim → RETROSPECTIVE)

- **files_modified**: .planning/STATE.md (MODIFY: append Phase 3.4 SHIPPED entry to 已完成 phase ship 历史 + update 当前位置 block to reflect v0.3.0 4/4 SHIPPED + W0.1 D2 ship-time T6.N cadence first-implementation auto-trim Phase 3.1+3.2 narrative section to RETROSPECTIVE.md Phase N-2 § ARCHIVED FROM STATE)
- **read_first**:
  - .planning/STATE.md post-W0.1 trim — verify ≤200L baseline + 当前位置 SSOT preserved
  - .planning/RETROSPECTIVE.md tail 100 lines — verify W0.1 D2 first ship-time ARCHIVED FROM STATE section + Phase 3.3 sister review absorb section
  - existing 已完成 phase ship 历史 section (added by Phase 3.2 W0.2 + extended Phase 3.3 W2 T2.6)
  - .planning/phase-3.4/RESEARCH.md § 9.3 W2.T2.3 (STATE/RETRO 续编 D2 first-implementation verbatim)
- **action**:
  1. Append to 已完成 phase ship 历史 section as 15th entry (post-Phase 3.3 was 12th, +W0.1+W0.2+W0.3 natural 14th, Phase 3.4 ship = 15th): Phase 3.4 SHIPPED ✅ (2026-05-17) — 路由命中率 ≥ 85% 验收 (30 sample REAL HISTORICAL dogfood + per-sample arbitrate dispatch ≥26/30 hit) + token budget doctor 8th check (check-token-budget.ts NEW ≤40L PRIMARY helper sister probe-gstack/check-deprecations family + Buffer.byteLength /4 zero-dep estimateTokens sister Phase 3.1 D-01 precedent reuse + doctor.ts Option A inline shrink hits exact 200L Karpathy hard limit) + W0 backlog 5 项一次根治 + v0.3.0 milestone close 4/4 phases ✅
  2. Update 当前位置 block: GSD phase chain prepend Phase 3.4 SHIPPED marker; 当前里程碑 update v0.3.0 milestone SHIPPED ARCHIVED (4/4 phases) — next v0.4.0 milestone kickoff; 下一 phase v0.4.0 discuss-phase 启动 (R8.1 dogfooding benchmark + R8.2 co-maintainer 招募); 状态 Phase 3.4 SHIPPED + v0.3.0 milestone CLOSE 完成 Wave 0+1+2 ship + triple tag adr-0017-accepted + v0.3.0-alpha.4-routing + 🎯 v0.3.0
  3. W0.1 D2 ship-time T6.N cadence FIRST-IMPLEMENTATION (institutionalize per Phase 3.4+ onward): Identify Phase 3.1 + Phase 3.2 entries in 已完成 phase ship 历史 section (prev-prev-phase beyond last 2 = Phase 3.3 + Phase 3.4); Move Phase 3.1 + Phase 3.2 entry verbatim to .planning/RETROSPECTIVE.md new section ## § ARCHIVED FROM STATE — Phase 3.1+3.2 (2nd ship-time T6.N implementation per Phase 3.4 W0.1 D2 cadence); Verify post-archive STATE.md still ≤200L
  4. Update Resolved (T2.2 STATE.md post-续编+D2 archive wc) block with outcome
- **acceptance_criteria**:
  - grep -q Phase-3.4-SHIPPED .planning/STATE.md exit 0 (event log entry)
  - grep -q v0.3.0-4/4-or-SHIPPED-ARCHIVED .planning/STATE.md exit 0 (milestone block updated)
  - grep -q Phase-3.1-SHIPPED-or-Phase-3.2-SHIPPED .planning/RETROSPECTIVE.md exit 0 (W0.1 D2 cadence 2nd-implementation — Phase 3.1+3.2 narrative archived to RETROSPECTIVE)
  - wc -l .planning/STATE.md ≤ 200 (D3 Rule 1 size still satisfied post-续编 + D2 archive)
  - node scripts/check-transparency-verdicts.mjs exit 0 (freshness gate post-续编)
  - node scripts/check-state-archive-stale.mjs exit 0 (D3 gate warn-only round 1 still pass)
- **decision_source**: sister Phase 3.3 W2 T2.6 STATE.md 续编 pattern 100% reuse + CONTEXT D2 ship-time T6.N cadence institutionalize first-implementation per Phase 3.4 W0.1 + RESEARCH § 9.3 W2.T2.3 verbatim

---

### T2.3 — .planning/RETROSPECTIVE.md 续编 Phase 3.4 milestone retrospective entry 6-section sister Phase 3.3 W2 T2.7 + receive D2 auto-archive Phase 3.1+3.2 narrative section

- **files_modified**: .planning/RETROSPECTIVE.md (MODIFY append Phase 3.4 milestone retrospective entry + accept W0.1 D2 auto-archive content per T2.2)
- **read_first**:
  - .planning/RETROSPECTIVE.md tail 200 lines — verify Phase 3.3 retro 6-section pattern + sister Phase 2.4 retro 318L gold-standard reference
  - .planning/phase-3.4/RESEARCH.md § 9.3 W2.T2.3 + § 13 (5 anti-pattern lessons + v0.3.0 close discipline)
- **action**:
  1. Append Phase 3.4 milestone retrospective entry covering 6 section sister Phase 3.3 W2 T2.7 format:
     - § What worked: W0.1 STRATEGIC institutionalize 4 D-decisions + Option A inline shrink saves 1L Karpathy surgical + sister samples-30.test.ts 100% template reuse + sister v0.2.0 close 100% template single-day close target
     - § What was inefficient: doctor.ts 195L borderline (Option A pre-flight gate process overhead but Karpathy hard limit ≤200L NO tolerance ABSOLUTE) + SAMPLES.md manual trace expected_decision per row (1h investment but dogfood REAL HISTORICAL value > effort)
     - § Patterns established: 6-phase 连续 deferred-items → next phase W0 一次根治 cadence + PRIMARY helper family 4-member延袭 + sister samples-XX.test.ts harness 100% template reuse (3-phase same pattern) + W0.1 D2 ship-time T6.N archive cadence institutionalize as standing process
     - § Cost patterns: Sonnet routing 100% accuracy maintained + Haiku ≥84% achievable + Opus tier ≥80% derived baseline acceptable
     - § Key lessons: (1) D-04 paranoid 命名 institutionalize vs cleanup architectural framing prevents revert to one-off cleanup mindset; (2) Option A inline shrink Karpathy surgical 1L delta vs Option B helper extract 30L NEW file → favor surgical when single-task scope; (3) BUFFER /4 heuristic acceptable variance for warn-only doctor surface
     - § Cross-milestone trends (v0.3.0 vs v0.2.0): v0.3.0 close pattern 100% reuses v0.2.0 close template (sister Phase 2.4 W6 T6.1-T6.5 5-doc 续编 + 2-file archive → v0.3.0 5-doc 续编 + 3-file archive incl. NEW MILESTONE-AUDIT inaugurate at milestones/ subdir consistency upgrade); ADR cadence 13 → 17 (4 ADR per milestone steady); 3-OS CI green stable since v0.2.0 ship
  2. Receive W0.1 D2 auto-archive content per T2.2 (Phase 3.1+3.2 narrative section moved STATE → RETRO per D2 cadence first-implementation as ## § ARCHIVED FROM STATE — Phase 3.1+3.2 section)
- **acceptance_criteria**:
  - grep -q Phase-3.4 .planning/RETROSPECTIVE.md exit 0
  - grep -cE section-headers .planning/RETROSPECTIVE.md ≥ 6 NEW sections added (6-section retro pattern)
  - grep -q What-worked-or-Patterns-established-or-Key-lessons .planning/RETROSPECTIVE.md exit 0 (6-section sister Phase 3.3 format)
  - grep -q ARCHIVED-FROM-STATE-Phase-3.1-or-Phase-3.2 .planning/RETROSPECTIVE.md exit 0 (W0.1 D2 cadence 2nd-implementation receive auto-archive)
- **decision_source**: sister Phase 3.3 W2 T2.7 RETROSPECTIVE.md 6-section format + sister Phase 2.4 retro 318L gold-standard reference + RESEARCH § 9.3 W2.T2.3 + § 13 5 anti-pattern lessons

---

### T2.4 — .planning/ROADMAP.md Phase 3.4 ✅ SHIPPED + v0.3.0 milestone 4/4 SHIPPED ARCHIVED marker (sister L38 v0.1.0 + L58 v0.2.0 pattern)

- **files_modified**: .planning/ROADMAP.md (MODIFY L167 Phase 3.4 entry add ✅ SHIPPED 2026-05-17 + L130 v0.3.0 milestone 3/4 → 4/4 SHIPPED ARCHIVED marker)
- **read_first**:
  - .planning/ROADMAP.md L130-178 — verify v0.3.0 milestone block + Phase 3.4 entry + sister L38 v0.1.0 + L58 v0.2.0 SHIPPED ARCHIVED literal pattern
- **action**:
  1. Mark Phase 3.4 entry as ✅ SHIPPED (2026-05-17) + brief outcome summary
  2. Update v0.3.0 milestone progress 3/4 → 4/4 SHIPPED ARCHIVED marker (sister L38 v0.1.0 + L58 v0.2.0 literal pattern)
  3. Add v0.4.0 next milestone kickoff reference (R8.1 dogfooding benchmark + R8.2 co-maintainer 招募 per CONTEXT carry)
- **acceptance_criteria**:
  - grep -q Phase-3.4-checkmark .planning/ROADMAP.md exit 0
  - grep -q v0.3.0-4/4 .planning/ROADMAP.md exit 0
  - grep -q v0.3.0-SHIPPED-ARCHIVED .planning/ROADMAP.md exit 0 (sister L38 + L58 literal pattern)
- **decision_source**: sister Phase 3.3 W2 T2.8 ROADMAP.md 续编 pattern + sister L38 v0.1.0 + L58 v0.2.0 SHIPPED ARCHIVED literal cadence延袭

---

### T2.5 — README.md L9 Status freshness + v0.3.0 4/4 SHIPPED ARCHIVED + Phase 3.4 row append

- **files_modified**: README.md (MODIFY L9 Status freshness header + L44 area MILESTONE row v0.3.0 3/4 → 4/4 SHIPPED ARCHIVED + add Phase 3.4 entry to shipped phase list)
- **read_first**:
  - README.md L1-60 — verify L9 Status header + L44 MILESTONE row pattern post-Phase 3.3 ship; sister 5-recurrence terminus D-04 COLLAPSE STATUS_MARKER path
- **action**:
  1. Update L9 Status freshness header to reflect Phase 3.4 + v0.3.0 SHIPPED (sister Phase 3.3 W2 STATUS_MARKER path pattern)
  2. Update L44 area MILESTONE row v0.3.0 3/4 → 4/4 SHIPPED ARCHIVED
  3. Add Phase 3.4 entry to shipped phase list (sister Phase 3.3 + 3.2 + 3.1 row pattern延袭)
- **acceptance_criteria**:
  - grep -q Phase-3.4 README.md exit 0
  - grep -q v0.3.0-4/4-or-v0.3.0-SHIPPED README.md exit 0
  - node scripts/check-transparency-verdicts.mjs exit 0 (freshness gate post-MODIFY pass)
- **decision_source**: sister Phase 3.3 W2 STATUS_MARKER path + 5-recurrence terminus D-04 COLLAPSE pattern延袭

---

### T2.6 — PROJECT-SPEC.md L3 Status header add Phase 3.4 SHIPPED literal (FRONT_MATTER_DOCS transparency gate)

- **files_modified**: PROJECT-SPEC.md (MODIFY L3 Status header add Phase 3.4 SHIPPED literal sister Phase 3.3 W2 T2.6 pattern)
- **read_first**:
  - PROJECT-SPEC.md L1-15 — verify L3 Status header structure post-Phase 3.3 ship
- **action**:
  1. Add Phase 3.4 SHIPPED literal to L3 Status header (sister Phase 3.3 W2 T2.6 FRONT_MATTER_DOCS transparency gate pattern)
- **acceptance_criteria**:
  - grep -q Phase-3.4 PROJECT-SPEC.md exit 0
  - node scripts/check-transparency-verdicts.mjs exit 0 (FRONT_MATTER_DOCS transparency gate pass)
- **decision_source**: sister Phase 3.3 W2 T2.6 FRONT_MATTER_DOCS transparency gate pattern延袭

---

### T2.7 — .github/workflows/ci.yml A7 iter ADR 0001-0016 → ADR 0001-0017 (5 sed-replace sites sister Phase 3.3 W2 T2.7 explicit literal pattern)

- **files_modified**: .github/workflows/ci.yml (MODIFY 5 sed-replace sites: L34 errata header + L35 ADR range + L71 iter line + L74 step name + L99 echo string sister Phase 3.3 W2 T2.7 + Phase 3.2 W3 T3.4 + Phase 3.1 W5 T5.4 explicit literal pattern)
- **read_first**:
  - .github/workflows/ci.yml L30-100 — verify 5 sites: L34 Phase-3.3-ADR-0016-errata + L35 ADR-0001-0016 + L71 1-0015-to-1-0016 + L74 step-name-ADR-0001-0016 + L99 echo-ADR-0001-0016-main-body-unchanged
- **action**:
  1. 5 sed-replace sites (mechanical literal swap):
     - L34: add Phase 3.4 ADR 0017 errata entry
     - L35: 0001-0016 → 0001-0017
     - L71: 1-0016 → 1-0017
     - L74 step name: 0001-0016 → 0001-0017
     - L99 echo: 0001-0016 main body unchanged → 0001-0017 main body unchanged
- **acceptance_criteria**:
  - grep -c 0001-0017 .github/workflows/ci.yml ≥ 3 (Phase 3.3 had ≥3 matches, Phase 3.4 same minimum)
  - grep -q 0001-0016 .github/workflows/ci.yml exit 1 (NO remaining 0001-0016 except errata注释 backward refs allowed in errata blocks)
  - grep -q Phase-3.4-ADR-0017-errata .github/workflows/ci.yml exit 0 (errata header entry added)
- **decision_source**: sister Phase 3.3 W2 T2.7 + Phase 3.2 W3 T3.4 + Phase 3.1 W5 T5.4 explicit literal sed-replace pattern 100% reuse

---

### T2.8 — .planning/milestones/v0.3.0-ROADMAP.md NEW archive (copy v0.3.0 section from ROADMAP.md + freeze sister v0.2.0-ROADMAP.md 10.7k template)

- **files_modified**: .planning/milestones/v0.3.0-ROADMAP.md (NEW archive ~10k template per RESEARCH § 9.1 sister v0.2.0-ROADMAP.md 10.7k 100% template + freeze)
- **read_first**:
  - .planning/milestones/v0.2.0-ROADMAP.md entire — sister 10.7k template 100% pattern model
  - .planning/ROADMAP.md L130-178 — copy source for v0.3.0 section verbatim
- **action**:
  1. Copy .planning/ROADMAP.md L130-178 v0.3.0 section verbatim to NEW .planning/milestones/v0.3.0-ROADMAP.md
  2. Add freeze marker header Frozen at v0.3.0 milestone close 2026-05-17
  3. Add 4 phase SHIPPED markers (Phase 3.1 + 3.2 + 3.3 + 3.4 all ✅) per RESEARCH § 9.1
- **acceptance_criteria**:
  - test -f .planning/milestones/v0.3.0-ROADMAP.md exit 0
  - grep -q Frozen-at-v0.3.0-or-frozen .planning/milestones/v0.3.0-ROADMAP.md exit 0
  - grep -cE Phase-3-checkmark-or-Phase-3-SHIPPED .planning/milestones/v0.3.0-ROADMAP.md ≥ 4 (4/4 phases marked SHIPPED)
- **decision_source**: sister v0.2.0-ROADMAP.md 10.7k template 100% reuse + RESEARCH § 9.1 verbatim

---

### T2.9 — .planning/milestones/v0.3.0-REQUIREMENTS.md NEW archive (copy R7 section from REQUIREMENTS.md + freeze sister v0.2.0-REQUIREMENTS.md 6.6k template)

- **files_modified**: .planning/milestones/v0.3.0-REQUIREMENTS.md (NEW archive ~6k template per RESEARCH § 9.1 sister v0.2.0-REQUIREMENTS.md 6.6k 100% template + freeze R7.1-R7.6 v0.3.0 scope subset)
- **read_first**:
  - .planning/milestones/v0.2.0-REQUIREMENTS.md entire — sister 6.6k template 100% pattern model
  - .planning/REQUIREMENTS.md L280-291 + R7 area — copy source for R7 section verbatim
- **action**:
  1. Copy .planning/REQUIREMENTS.md R7 section (R7.1-R7.6 v0.3.0 scope subset) verbatim to NEW .planning/milestones/v0.3.0-REQUIREMENTS.md
  2. Add freeze marker header Frozen at v0.3.0 milestone close 2026-05-17
  3. Add per-req status (satisfied / partial / deferred with phase ref)
- **acceptance_criteria**:
  - test -f .planning/milestones/v0.3.0-REQUIREMENTS.md exit 0
  - grep -q Frozen-at-v0.3.0-or-frozen .planning/milestones/v0.3.0-REQUIREMENTS.md exit 0
  - grep -cE R7-dot-1-through-6 .planning/milestones/v0.3.0-REQUIREMENTS.md ≥ 4 (R7.1-R7.6 subset)
- **decision_source**: sister v0.2.0-REQUIREMENTS.md 6.6k template 100% reuse + RESEARCH § 9.1 verbatim

---

### T2.10 — .planning/milestones/v0.3.0-MILESTONE-AUDIT.md NEW INAUGURATE 150L 6-section (sister v0.2.0-MILESTONE-AUDIT.md gold-standard format per orchestrator pre-planning #4 LOCKED)

- **files_modified**: .planning/milestones/v0.3.0-MILESTONE-AUDIT.md (NEW INAUGURATE ~150L 6-section per RESEARCH § 9.2 + sister .planning/v0.2.0-MILESTONE-AUDIT.md 150L 6-section gold-standard 100% template per orchestrator pre-planning #4 LOCKED)
- **read_first**:
  - .planning/v0.2.0-MILESTONE-AUDIT.md L1-150 entire file — sister 6-section format gold-standard 100% template model + YAML frontmatter shape
  - All 4 phase ship summaries (Phase 3.1 + 3.2 + 3.3 + 3.4 W0+W1 outputs) for evidence collection
  - .planning/REQUIREMENTS.md R7 section — per-REQ status table source
- **action**:
  1. Create NEW file .planning/milestones/v0.3.0-MILESTONE-AUDIT.md ~150L 6-section per sister v0.2.0-MILESTONE-AUDIT.md format 100% reuse:
     - YAML frontmatter (L1-30): milestone 0.3.0 + audited 2026-05-17 + status passed + scores requirements/phases/integration/flows + gaps + tech_debt
     - TL;DR (L40-50): 2-3 paragraphs ship quality + key judgment (sister v0.2.0 § v0.2.0 工程质量高 4/4 phase 自验 8/8 acceptance bar 全 passed 模式)
     - § 0.5 Line Budget Deviations Accepted (L52-62): per-file LoC over hard limit accepted table (e.g. doctor.ts 200L exact post-Option A shrink — no deviation; check-token-budget.ts ≤40L; ADR 0017 ≤250L)
     - § 1 Per-Phase Status (L66-75): 4-row table Phase 3.1 / 3.2 / 3.3 / 3.4 × 自验状态 / Critical Gaps / Tech Debt
     - § 2 Cross-Phase Integration (L77-90): seam matrix (N seams all checkmark OK with evidence — schemaVersion 13-surface + plan-feature workflow + checkpoint engine + gstack probe + aliases redirect + known-good lock + routing dispatch)
     - § 3 E2E Flows (L92-101): flow matrix (5 flows wired with evidence — install --known-good real entries + doctor 8-check + routing hit-rate dispatch + dashboard SSE + plan-feature)
     - § 4 Requirements Coverage (L103-123): R7.1-R7.6 × status × evidence × phase (per-REQ table sister v0.2.0 § 4 format)
     - § 5 v0.3.0 vs v0.2.0 对比 (L125-138): 9-dim table phase count / atomic commits / ADR (13 to 17 plus 4) / tag / tests / acceptance bar / audit gap / sister review hotfix / architecture change / **publish stream version (W-8 row — orchestrator iter-1 fix; MUST disclose 0.1.0-alpha.1 → 0.3.0 skip of v0.2.0 published artifact with rationale "milestone tags track v0.2.0 + v0.3.0; npm publish stream defers to v1.0 — pre-v1.0 development; W0.2 bonus bump aligns package.json with shipped milestone tags but publish remains deferred")**
     - § 6 Verdict (L140-148): PASSED — 4/4 phases × 8/8 bars + ≥44 NEW fixture + 17 ADR A7 守恒 + v0.3.0 milestone close + target v0.3.0 大 tag + next v0.4.0 discuss-phase 启动
  2. Inaugurate at .planning/milestones/v0.3.0-MILESTONE-AUDIT.md (sister v0.2.0 was inline at .planning/v0.2.0-MILESTONE-AUDIT.md — v0.3.0+ moves to milestones/ subdir for consistency with sibling -ROADMAP + -REQUIREMENTS archives per orchestrator pre-planning #4 LOCKED)
- **acceptance_criteria**:
  - test -f .planning/milestones/v0.3.0-MILESTONE-AUDIT.md exit 0
  - wc -l .planning/milestones/v0.3.0-MILESTONE-AUDIT.md min 120 max 200 (sister v0.2.0-MILESTONE-AUDIT.md 150L range)
  - grep -cE section-headers .planning/milestones/v0.3.0-MILESTONE-AUDIT.md ≥ 6 (TL;DR + § 0.5 + § 1 Per-Phase + § 2 Cross-Phase + § 3 E2E Flows + § 4 Requirements + § 5 v0.3.0 vs v0.2.0 + § 6 Verdict)
  - grep -q PASSED .planning/milestones/v0.3.0-MILESTONE-AUDIT.md exit 0 (verdict expected PASS per RESEARCH § 13.2)
  - grep -q milestone-0.3.0 .planning/milestones/v0.3.0-MILESTONE-AUDIT.md exit 0 (YAML frontmatter)
  - grep -cE R7-dot-1-through-6 .planning/milestones/v0.3.0-MILESTONE-AUDIT.md ≥ 4 (§ 4 Requirements Coverage R7.1-R7.6 table)
  - grep -qE "publish.stream|0.1.0-alpha.1.*0.3.0|npm.publish.*v1.0" .planning/milestones/v0.3.0-MILESTONE-AUDIT.md exit 0 (W-8 § 5 publish stream version skip disclosure — verify transparency row present per orchestrator iter-1 fix)
  - grep -q Phase-3-dot-1-through-4 .planning/milestones/v0.3.0-MILESTONE-AUDIT.md exit 0 (§ 1 Per-Phase Status 4-row table)
- **decision_source**: sister .planning/v0.2.0-MILESTONE-AUDIT.md L1-150 100% verbatim template + RESEARCH § 9.2 6-section verbatim structure + orchestrator pre-planning #4 LOCKED (MILESTONE-AUDIT.md inaugurate at .planning/milestones/ subdir for consistency with sibling -ROADMAP + -REQUIREMENTS archives)

---

### T2.11 — .planning/phase-3.4/DOGFOOD-T2.X.md NEW ~30-40L PASS N/N (sister Phase 3.3 DOGFOOD-T2.8.md format; 3-axis empirical evidence)

- **files_modified**: .planning/phase-3.4/DOGFOOD-T2.X.md (NEW ~30-40L per RESEARCH § 9.3 W2.T2.11 + sister Phase 3.3 DOGFOOD-T2.8.md format 100% reuse)
- **read_first**:
  - .planning/phase-3.3/DOGFOOD-T2.8.md entire — sister DOGFOOD format model + PASS verdict shape
- **action**:
  1. Create NEW file .planning/phase-3.4/DOGFOOD-T2.X.md ~30-40L 3-axis empirical evidence:
     - (a) harnessed doctor --json 8-check output capture (含 token budget 字段; verify 8 entries + 8th = token budget status pass or warn)
     - (b) routing harness pnpm test tests/routing/phase-3.4-routing-hit-rate.test.ts 输出 (≥26/30 hit + per-tier breakdown line: Sonnet 100% / Haiku ≥ 84% / Opus ≥ 80%)
     - (c) install --known-good real entries verify (harnessed install claude-agent-sdk --known-good --dry-run --non-interactive output reflects pinned 0.3.142 version)
  2. PASS verdict header PASS N/N miss none per transparency gate verify (sister Phase 3.3 DOGFOOD-T2.8 format)
- **acceptance_criteria**:
  - test -f .planning/phase-3.4/DOGFOOD-T2.X.md exit 0
  - wc -l .planning/phase-3.4/DOGFOOD-T2.X.md min 20 max 60
  - grep -q PASS .planning/phase-3.4/DOGFOOD-T2.X.md exit 0
  - grep -q doctor-or-token-budget .planning/phase-3.4/DOGFOOD-T2.X.md exit 0 (axis a)
  - grep -q routing-hit-rate-or-26-of-30 .planning/phase-3.4/DOGFOOD-T2.X.md exit 0 (axis b)
  - grep -q known-good-or-0.3.142 .planning/phase-3.4/DOGFOOD-T2.X.md exit 0 (axis c)
- **decision_source**: sister Phase 3.3 DOGFOOD-T2.8.md format 100% reuse + RESEARCH § 9.3 W2.T2.11 3-axis empirical evidence

---

### T2.12 — Triple tag baseline + milestone + target (adr-0017-accepted + v0.3.0-alpha.4-routing + target v0.3.0; push pending user explicit approval per CLAUDE.md commit safety protocol)

- **files_modified**: git tags (no file change; tag creation + optional push pending user explicit request)
- **read_first**: 无
- **action**:
  1. PRE-TAG VERIFY GATES (all must pass before tag creation):
     - All preceding W2 tasks T2.1-T2.11 complete
     - Full test suite green: pnpm test 2>&1 | tail -5 | grep -E Tests-passed-0-failed exit 0
     - A7 守恒 0 diff: git diff adr-0016-accepted..HEAD against ADR 0001-0016 main body | wc -l == 0 (only ADR 0017 NEW, 0001-0016 不动)
     - CI 3-OS green: verify CI run green on Win + macOS + Linux (sister v0.2.0 close ship cadence per RESEARCH § 9.4)
     - freshness gate post-W2: node scripts/check-transparency-verdicts.mjs exit 0
  2. Tag baseline (sister Phase 3.1 0014 + Phase 3.2 0015 + Phase 3.3 0016 cadence延袭):
     - git tag -a adr-0017-accepted -m "ADR 0017 accepted (Phase 3.4 4 D-decisions D-01 REAL HISTORICAL + D-02 RUN ENGINE + D-03 BUFFER /4 + D-04 DOCTOR WARN + W0.1 STRATEGIC STATE institutionalize D1-D4 + v0.3.0 milestone close)"
  3. Tag milestone (sister v0.2.0-alpha.4-doctor-ee4 to v0.3.0-alpha.4-routing per RESEARCH § 9.4 naming convention):
     - git tag -a v0.3.0-alpha.4-routing -m "Phase 3.4 SHIPPED (routing hit-rate over 85% + token budget doctor 8th check + W0 backlog 5 项 absorb)"
  4. Tag target milestone (sister v0.2.0 close 2026-05-16 single-day cadence):
     - git tag -a v0.3.0 -m "v0.3.0 milestone close (4/4 phases SHIPPED — Phase 3.1 checkpoint + Phase 3.2 gstack-prefix + Phase 3.3 aliases-known-good + Phase 3.4 routing-token-budget)"
  5. DO NOT PUSH WITHOUT USER EXPLICIT APPROVAL per CLAUDE.md commit safety protocol — wait for user explicit git push origin --tags request OR per-tag push request; warn user if force-push requested on tags pointing to main
- **acceptance_criteria**:
  - git tag --list adr-0017-accepted | wc -l == 1 (baseline tag created)
  - git tag --list v0.3.0-alpha.4-routing | wc -l == 1 (milestone tag created)
  - git tag --list v0.3.0 | wc -l == 1 (target milestone tag created)
  - git tag --list v0.3.0-star | wc -l ≥ 4 (alpha.1 + alpha.2 + alpha.3 + alpha.4 + v0.3.0 = 5 tags incl. all alpha; minimum 4 per sister v0.2.0 close)
  - git tag --list adr-001-4-through-7-accepted | wc -l == 4 (4 ADR per v0.3.0 4 phase)
  - git diff adr-0016-accepted..HEAD against ADR 0001-0016 main body | wc -l == 0 (A7 守恒 — only ADR 0017 NEW post-tag)
  - pnpm test 2>&1 | tail -5 | grep -E Tests-passed-0-failed exit 0 (full suite green pre-push)
- **decision_source**: sister Phase 3.3 W2 T2.10 baseline + milestone tag pattern + sister v0.2.0 close triple push pattern per RESEARCH § 9.4 verbatim tag naming convention + orchestrator pre-planning triple tag explicit + CLAUDE.md commit safety protocol NEVER push without user explicit request

---

## Wave 2 done

All 12 atomic tasks complete. Plan 03 (Wave 2 + v0.3.0 milestone close) SHIPPED criteria all satisfied per PLAN.md Wave 2 success_criteria block.

**v0.3.0 milestone CLOSE 完成**: 4/4 phases checkmark (Phase 3.1 checkpoint + Phase 3.2 gstack-prefix + Phase 3.3 aliases-known-good + Phase 3.4 routing-token-budget) + 17 ADR累积 baseline tag A7 守恒 + triple tag push (pending user approval) + 3-file milestone archive triplet at .planning/milestones/v0.3.0-{ROADMAP,REQUIREMENTS,MILESTONE-AUDIT}.md (MILESTONE-AUDIT.md inaugurate location upgrade vs sister v0.2.0 inline).

**Next**: v0.4.0 discuss-phase 启动 (dogfooding benchmark + co-maintainer 招募 + plan-feature 真接外部 gsd-* spawn dogfood per ROADMAP R8.1+R8.2 carry).

> **DEFERRED carry items**:
> - **DEFERRED #AF**: D3 gate ENFORCE flip timing → Phase 3.5 W0 OR v0.4.0 W0 first task (sister Phase 2.1 transparency gate ENFORCE flip cadence延袭; Phase 3.4 ship round 1 warn-only complete)
> - **DEFERRED #AG**: D1 STATE.md ≤150L tighten → v0.4.0+ (round 1 target ≤200L warn-only complete; v0.4.0+ tighten SIZE_LIMIT to 150L per D3 Rule 1 future flip)
> - **DEFERRED #AH**: W0.4 path traversal regex hardening → Phase 4.0 W0 (if external user input arrives — currently sole consumer is project maintainer, real attack surface near-zero per spike outcome)
