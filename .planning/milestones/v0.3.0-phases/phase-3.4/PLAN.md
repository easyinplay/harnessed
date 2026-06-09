---
phase: 3.4
plan: 1
type: execute
wave: 0
depends_on: []
files_modified:
  # W0 backlog absorb (5 项 — W0.1 STRATEGIC STATE institutionalize / W0.2 #AD install pkg.json read + bonus version bump / W0.3 #AC R7.6 real seed fill (8 entries) / W0.4 #AE path traversal spike → DEFER doc / W0.5 SAMPLES.md 30-row matrix sourcing pre-flight)
  - .planning/STATE.md                                          # W0.1 D1 — trim ≤200L round 1 target (723L → archive ~500L prev-prev-phase narrative to RETROSPECTIVE per D2 ship-time T6.N cadence first-implementation; preserve "当前位置" L18-25 block single SoT)
  - scripts/check-state-archive-stale.mjs                       # W0.1 D3 — NEW ~55L (sister scripts/check-transparency-verdicts.mjs 130L 模板; ENFORCE=false warn-only round 1; flip Phase 3.5 OR v0.4.0; 3 rules: ≤200 size + ≤1 关键决议 ship 总结 section + W-N errata literal禁; RESEARCH § 11.2 verbatim recipe)
  - .github/workflows/ci.yml                                    # W0.1 D3 — CI step add `node scripts/check-state-archive-stale.mjs` warn-only round 1 (place after check-transparency-verdicts.mjs step; sister Phase 2.1 transparency gate cadence; W2 T2.7 A7 iter 1-0016→1-0017 同时同 file MODIFY)
  - src/cli/install.ts                                          # W0.2 #AD — MODIFY L114-116: replace `const harnessedVer = '0.3.0' // TODO Phase 3.4: read from package.json (DEFERRED #AD)` with Path A native ES2022 `import pkg from '../../package.json' with { type: 'json' }` at file top + `const harnessedVer = pkg.version` (RESEARCH § 6.2 Path A locked per Karpathy YAGNI; Path B readFileSync fallback if Node TS pipeline rejects `with` syntax)
  - package.json                                                # W0.2 bonus — bump `"version": "0.1.0-alpha.1"` → `"version": "0.3.0"` (RESEARCH § 6.4 Recommendation (i) — align package.json with shipped milestone tags so harnessedVer post-W0.2 reads '0.3.0' matching versions/0.3.0-known-good.yaml; 1-line edit, atomic with W0.2 version-read fix)
  - versions/0.3.0-known-good.yaml                              # W0.3 #AC — fill 8 real e2e-verified pinned entries replacing empty `upstreams: []` MVP seed (Phase 3.3 W1 T1.11 ship empty); per RESEARCH § 7.1 recommended 8 entries: claude-agent-sdk@0.3.142 npm-cli + gstack@SHA git-clone-with-setup (install.git_ref source-of-truth per R7.6 reproducible semantics, NOT last_known_good_version field) + gsd@1.41.2 npm-cli + superpowers@v5.1.0 cc-plugin-marketplace (path: manifests/tools/superpowers.yaml NOT skill-packs/) + planning-with-files@v2.37.0 cc-plugin-marketplace + mattpocock-skills@main-76-commits npx-skill-installer + karpathy-skills@skill-only-v1 git-clone-with-setup (last_known_good_version field per DI-1 hotfix local-copy fallback; install.git_ref zero-hash sentinel) + tavily-mcp@0.2.19 mcp-stdio-add; e2e_verified_at: '2026-05-17' (not 'TBD')
  - .planning/phase-3.4/SPIKE-W0.4-path-traversal.md            # W0.4 #AE — NEW ~30L rationale doc DEFER Phase 4.0 per RESEARCH § 8 spike outcome (install.ts L77-94 path.resolve absolute-safe + ENOENT graceful + TypeBox schema strict 双层 defense-in-depth verified; real attack surface = near-zero); sister Phase 3.3 § 10.4 STRIDE Tampering threat model 已 enumerated
  - tests/integration/install-path-traversal.test.ts            # W0.4 #AE — NEW ~40L 1 defense-in-depth fixture verifying `harnessed install "../../etc/passwd" --dry-run --non-interactive` exits 1 with 'manifest .* not found' (empirical proof of ENOENT graceful fallback; NO regex hardening per spike outcome DEFER lock)
  - .planning/phase-3.4/SAMPLES.md                              # W0.5 — NEW ~180L 30-row matrix (8-col table sister Phase 2.3 SAMPLES.md L1-80 format 100% reuse + D-01 schema 7-col simplified per CONTEXT § Specifics L213-222); REAL HISTORICAL mining `git log --since=2026-05-12 --until=2026-05-17 --no-merges` (331 commits verified) + `.planning/phase-{1.1..3.1}/task_plan.md` × 10 + `.planning/intel/*.md` × 2; distribution: 10 Haiku trivial + 10 Sonnet medium + 10 Opus complex; per-row manually-traced expected_decision against `routing/decision_rules.yaml` 12 rules (sister Phase 2.3 § 1.3 anchor/false-pos/CD-3 透明声明 pattern); frozen at plan-phase Wave B (R3 lock); Karpathy ≤200L hard

autonomous: true

requirements:
  - R7      # dogfooding scope: 30 真实任务 (model 分布达标) 路由命中率 ≥ 85%; Sonnet 100% / Haiku ≥ 84% 复现 (ROADMAP L149 verbatim) — W0.5 SAMPLES.md sourcing pre-flight gates W1 RUN ENGINE harness
  - R7.6    # known-good 版本组合 lock; 验收 harnessed install --known-good reproducible — W0.3 #AC real seed fill (Phase 3.3 W1 T1.11 empty seed → Phase 3.4 W0.3 fill)

must_haves:
  truths:
    # W0.1 STRATEGIC (D1+D2+D3+D4 user-locked 4 D-decisions; paranoid 命名 architectural framing NOT cleanup per D-04 COLLAPSE 命名思路延袭)
    - "developer can read .planning/STATE.md and find it ≤ 200 lines round 1 target (was 723L; archive ~500L prev-prev-phase narrative L96-329 + L518-683 → RETROSPECTIVE.md Phase N-2 § ARCHIVED FROM STATE section per W0.1 D2 ship-time T6.N cadence first-implementation; preserve L18-25 当前位置 block as sole SSOT containing **Phase 3.3 SHIPPED** literal STATE_POSITION_RE anchor); v0.4+ tighten to ≤150L per D3 Rule 1 SIZE_LIMIT (warn-only round 1; ENFORCE flip Phase 3.5 OR v0.4.0 sister Phase 2.1 transparency gate cadence延袭)"
    - "developer can run `node scripts/check-state-archive-stale.mjs` and gate scans STATE.md against 3 rules: (Rule 1) line count ≤ 200 (round 1 target; tighten ≤150 v0.4); (Rule 2) `^##.*关键决议.*ship\\s*总结` section count ≤ 1 (防 H2 复发, sister Phase 3.3 sister review H2 absorb pattern); (Rule 3) `W-[1-9]\\s+errata|sister\\s+review\\s+M[1-9]\\s+修正` literal forbidden (防 H1 复发); on violation: console.warn each + exit `ENFORCE ? 1 : 0` (ENFORCE=false warn-only round 1; Phase 3.5 OR v0.4.0 flip true; sister scripts/check-transparency-verdicts.mjs L12 cadence verbatim)"
    - "developer can find `.github/workflows/ci.yml` step `node scripts/check-state-archive-stale.mjs` placed adjacent to `node scripts/check-transparency-verdicts.mjs` step (sister gate adjacency per RESEARCH § 11.3); warn-only round 1 round 1 (exit 0 with violations printed); ship process T6.N step (every Phase N ship from Phase 3.4+ onward) auto-trims prev-prev-phase narrative STATE→RETROSPECTIVE (D2 architectural cadence institutionalize, sister Phase 2.4 W6 T6.3 RETRO 续编 pattern; executor 不 SCOPE BOUNDARY 阻挡 archive per D4)"

    # W0.2 DEFERRED #AD (1-line surgical fix + bonus package.json version bump align shipped milestones)
    - "developer can run `harnessed install <name> --known-good` and `harnessedVer` is read from `package.json` (NOT hardcoded '0.3.0'); src/cli/install.ts L114-116 TODO marker removed; Path A `import pkg from '../../package.json' with { type: 'json' }` (Node 22 + TypeScript 5.6+ ES2022 import attributes native support); fallback Path B readFileSync + JSON.parse if Path A blocked by Node TS pipeline; acceptance per CONTEXT D-decisions L120 verbatim: `grep -q \"harnessedVer.*package\" src/cli/install.ts` exit 0 AND `! grep -q \"harnessedVer.*'0\\.3\\.0'\" src/cli/install.ts` exit 0"
    - "developer reads package.json and finds `\"version\": \"0.3.0\"` (was '0.1.0-alpha.1' — stale per RESEARCH § 6.4; bonus 1-line atomic with W0.2 version-read fix so post-W0.2 `harnessedVer` reads '0.3.0' matching versions/0.3.0-known-good.yaml; unblocks `harnessed install --known-good` post-W0.2 functional verify + aligns with v0.3.0 close phase scope)"

    # W0.3 DEFERRED #AC R7.6 real seed (8 entries verbatim locked per RESEARCH § 7.1 + orchestrator pre-planning decision #3)
    - "developer reads versions/0.3.0-known-good.yaml and finds `upstreams[]` length ≥ 5 (planned 8 real entries verified against actual manifest yaml: claude-agent-sdk@0.3.142 npm-cli + gstack@74895062fb8a3acbf9f66cd088a83359aaaa56cd git-clone-with-setup (gstack install.git_ref is source-of-truth for known-good lock per R7.6 reproducible semantics, NOT last_known_good_version which is health-stability hint) + gsd@1.41.2 npm-cli + superpowers@v5.1.0 cc-plugin-marketplace (read_first manifests/tools/superpowers.yaml — NOT skill-packs/; install.git_ref v5.1.0 source-of-truth) + planning-with-files@v2.37.0 cc-plugin-marketplace (install.git_ref v2.37.0 source-of-truth) + mattpocock-skills@main-76-commits npx-skill-installer (last_known_good_version field marks main-76-commits; install method is npx-skill-installer not cc-skill-pack) + karpathy-skills@skill-only-v1 git-clone-with-setup (mark explicitly as last_known_good_version field NOT install.git_ref; install.git_ref is zero-hash sentinel 0000...000 per DI-1 hotfix local-copy fallback semantic) + tavily-mcp@0.2.19 mcp-stdio-add) + `e2e_verified_at: '2026-05-17'` (not 'TBD' placeholder); each entry satisfies `PinnedUpstream` schema (`name` minLength 1 + `version` minLength 1 + `install_method` minLength 1 free-form string per Phase 3.3 W1 T1.3 anti-coupling design); `Value.Check(KnownGoodV1, parsed)` returns true"

    # W0.4 DEFERRED #AE path traversal spike outcome — DEFER Phase 4.0 + 30L rationale doc + 1 defense-in-depth fixture (orchestrator pre-planning decision #2 LOCKED)
    - "developer reads .planning/phase-3.4/SPIKE-W0.4-path-traversal.md (~30L NEW) documenting spike outcome: (a) install.ts L77-94 path.resolve absolute-safe behavior verified by code trace, (b) ENOENT graceful fallback for non-existent paths, (c) TypeBox schema strict (`apiVersion: harnessed/v1` + `kind: Manifest` required fields) rejects non-manifest YAML 99.9% of cases, (d) `tests/integration/install-path-traversal.test.ts` 1 fixture asserts `harnessed install \"../../etc/passwd\" --dry-run --non-interactive` exits 1 with 'manifest .* not found' (empirical proof of defense-in-depth), (e) DEFER explicit regex hardening to Phase 4.0 W0 when external user input arrives (currently sole consumer is project maintainer); sister Phase 3.3 § 10.4 STRIDE Tampering threat model already enumerated"

    # W0.5 SAMPLES.md sourcing pre-flight (critical path — gates W1 RUN ENGINE harness per orchestrator brief)
    - "developer reads .planning/phase-3.4/SAMPLES.md (NEW ~180L 30-row matrix) and finds: (a) § 1 Selection Rationale `Source: REAL HISTORICAL — mining git log --since=2026-05-12 --until=2026-05-17 --no-merges (331 commits verified) + .planning/phase-{1.1..3.1}/task_plan.md × 10 + .planning/intel/*.md × 2` (D-01 LOCKED, dogfood real not synthetic); (b) § 2 Sample Truth Table **7-col schema LOCKED** per CONTEXT D-01 + planner Discretion #1: `| # | task_id | model_expected | task_type | description | source_commit | expected_decision (yaml inline) |` (NOT sister Phase 2.3 8-col; 7-col simplifies via inline yaml decision per CONTEXT § Specifics L213-222 verbatim); **Row regex template** (referenced by T1.6 routing harness loadSamples parser): `/^\| (\d{2}) \| (T\d{2}) \| (haiku|sonnet|opus) \| (\w+) \| (.+?) \| ([0-9a-f]{7,10}) \| `\{(.+)\}` \|/` — captures: id, task_id, model_expected, task_type, description, source_commit (7-10 hex SHA), expected_decision yaml inline body; (c) distribution exactly 10 Haiku trivial + 10 Sonnet medium + 10 Opus complex per D-01 (10 chore/lint/typo + 10 fix/test/refactor single-file + 10 feat-multi-task batch / cross-phase wire / arch); (d) per-row manually-traced expected_decision against routing/decision_rules.yaml v2 12 rules + mattpocock_phases 23 招式 + 5 engineering category sub-rules (anti-cherry-pick sister Phase 2.3 § 1.3 anchor/false-pos/CD-3 透明声明 pattern); (e) § 3 Frozen Marker plan-phase Wave B lock + execute-phase 不允许改样本 (R3 lock); each row source_commit field non-empty (D-01 sneak block per PATTERNS § 3 D-01)"

  artifacts:
    # W0.1 STRATEGIC artifacts (D1+D2+D3+D4)
    - path: ".planning/STATE.md"
      provides: "W0.1 D1 single-SoT institutionalize: trim 723L → ≤200L round 1 target; archive L96-329 (Completed v0.1.0+v0.2.0 milestone narrative, 234L) + L518-624 (Phase 1.5+2.0 Prereq Notes, 107L) + L625-683 (Phase 2.3+2.4 Prereq Notes, 59L) → RETROSPECTIVE.md Phase N-2 § ARCHIVED FROM STATE Phase 1.X-3.2 subsection (~400L delta first ship-time T6.N implementation per W0.1 D2 cadence sister Phase 2.4 W6 T6.3 RETRO 续编 pattern 100% reuse); preserve L18-25 当前位置 block as sole SSOT (contains **Phase 3.3 SHIPPED** + **Phase 3.2 SHIPPED** literal markers, STATE_POSITION_RE anchor for D-04 COLLAPSE freshness gate); preserve L8-15 项目核心引用 (constant); preserve L684-723 v0.3.0 启动 prereq + 框架治理 (current milestone scope, ~40L KEEP)"
      contains: "当前位置"
    - path: "scripts/check-state-archive-stale.mjs"
      provides: "W0.1 D3 NEW ~55L (sister scripts/check-transparency-verdicts.mjs 130L 模板 + warn-only round 1 ENFORCE=false initial → flip true Phase 3.5 OR v0.4.0): import readFileSync + 3 const declarations (ENFORCE=false + STATE_PATH='.planning/STATE.md' + SIZE_LIMIT=200 + KEY_DECISIONS_SECTION_LIMIT=1 + HISTORICAL_ERRATA_RE=/W-[1-9]\\s+errata|sister\\s+review\\s+M[1-9]\\s+修正/g) + checkStateArchive() function (read STATE.md + split lines + 3 rules scan: Rule 1 lines.length > SIZE_LIMIT push violation / Rule 2 matchAll(/^##.*关键决议.*ship\\s*total/gm) count > KEY_DECISIONS_SECTION_LIMIT push violation / Rule 3 line-by-line matchAll(HISTORICAL_ERRATA_RE) per-line push violation with L{i+1} ref + literal excerpt slice(0,80)) + console.warn each violation + `process.exit(ENFORCE ? 1 : 0)` final; sister Phase 2.1 T1.7 transparency gate ENFORCE flip cadence (warn-only round 1 → ENFORCE round 2 Phase 2.2 W0 T0.6 precedent verified verbatim)"
      contains: "ENFORCE = false"
    - path: ".github/workflows/ci.yml"
      provides: "W0.1 D3 CI step add `node scripts/check-state-archive-stale.mjs` adjacent to existing `node scripts/check-transparency-verdicts.mjs` step (sister gate adjacency per RESEARCH § 11.3 verbatim); warn-only round 1 (exit 0 even with violations printed); W2 T2.7 A7 iter 1-0016→1-0017 同 file MODIFY (5 sed-replace sites: L34 errata header + L35 ADR range + L71 iter line + L74 step name + L99 echo string) — combined W0.1 + W2.T2.7 makes ci.yml the only file touched in both Wave 0 and Wave 2 (acceptable; no merge conflict because additive lines in W0.1 vs literal swaps in W2.T2.7)"
      contains: "check-state-archive-stale"

    # W0.2 #AD + bonus package.json version bump
    - path: "src/cli/install.ts"
      provides: "W0.2 #AD MODIFY 1-line surgical fix (Path A locked per RESEARCH § 6.2 + CONTEXT D-decisions L120 verbatim): L114-116 replace `const harnessedVer = '0.3.0' // TODO Phase 3.4: read from package.json (DEFERRED #AD)` with `const harnessedVer = pkg.version` + add file-top import `import pkg from '../../package.json' with { type: 'json' }` (ES2022 import attributes Node 22 + TypeScript 5.6+ native support per RESEARCH § 6.2 + A1 ASSUMED LOW risk); fallback Path B if Path A blocked: top `import { readFileSync } from 'node:fs'; import { fileURLToPath } from 'node:url'; import { dirname, join } from 'node:path'; const pkg = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../../package.json'), 'utf8'))` (+3L delta acceptable on any Node 22+ pipeline); 140 → 141L Path A / 144L Path B (Karpathy ≤200L hard)"
      contains: "pkg.version"
    - path: "package.json"
      provides: "W0.2 bonus 1-line atomic version bump (RESEARCH § 6.4 Recommendation (i)): L2 `\"version\": \"0.1.0-alpha.1\"` → `\"version\": \"0.3.0\"` (align with shipped milestone tags v0.3.0-alpha.1-checkpoint through v0.3.0-alpha.3-aliases-known-good; post-W0.2 `harnessedVer` reads '0.3.0' matching versions/0.3.0-known-good.yaml so `harnessed install --known-good` functional verify unblocked); commit msg note: 'package.json version bump aligns publish stream with shipped milestone tags (publish stream was stale at 0.1.0-alpha.1 despite v0.2.0+v0.3.0 milestones shipped via git tags only)'"
      contains: "\"version\": \"0.3.0\""

    # W0.3 #AC R7.6 real seed (8 entries locked per orchestrator brief pre-planning decision #3)
    - path: "versions/0.3.0-known-good.yaml"
      provides: "W0.3 #AC fill 8 real e2e-verified pinned upstream entries (replace Phase 3.3 W1 T1.11 empty `upstreams: []` MVP seed per RESEARCH § 7.2 + orchestrator pre-planning #3 verbatim): claude-agent-sdk @ 0.3.142 npm-cli (package.json L70 exact) + gstack @ 74895062fb8a3acbf9f66cd088a83359aaaa56cd git-clone-with-setup (install.git_ref source-of-truth per manifests/skill-packs/gstack.yaml L22 — NOT last_known_good_version which is L34 health-stability hint; R7.6 reproducible install requires install.git_ref pin for actual install reproducibility) + gsd @ 1.41.2 npm-cli (last_known_good_version per manifests/skill-packs/gsd.yaml L34) + superpowers @ v5.1.0 cc-plugin-marketplace (per manifests/tools/superpowers.yaml L24-26 actual path — NOT manifests/skill-packs/superpowers.yaml which does not exist; install.git_ref v5.1.0 source-of-truth) + planning-with-files @ v2.37.0 cc-plugin-marketplace (per manifests/skill-packs/planning-with-files.yaml L24-26 — install.method cc-plugin-marketplace NOT cc-skill-pack; install.git_ref v2.37.0 source-of-truth) + mattpocock-skills @ main-76-commits npx-skill-installer (per manifests/skill-packs/mattpocock-skills.yaml L20-22 — install.method npx-skill-installer NOT cc-skill-pack; last_known_good_version main-76-commits is the version field per manifest L34) + karpathy-skills @ skill-only-v1 git-clone-with-setup (last_known_good_version field per manifests/skill-packs/karpathy-skills.yaml L58 — explicitly mark as last_known_good_version NOT install.git_ref; install.git_ref is zero-hash sentinel 0000...000 per DI-1 hotfix local-copy fallback semantic L29-36 verbatim) + tavily-mcp @ 0.2.19 mcp-stdio-add (last_known_good_version per manifests/tools/tavily-mcp.yaml L33); MODIFY L8 `e2e_verified_at: '2026-05-17'` (replaces 'TBD' placeholder per CONTEXT § Decisions L121); cross-OS executor verify exact `install_method` field per actual manifest yaml ls (read each manifest before commit)"
      contains: "claude-agent-sdk"

    # W0.4 #AE path traversal spike outcome — DEFER Phase 4.0 (orchestrator pre-planning decision #2 LOCKED)
    - path: ".planning/phase-3.4/SPIKE-W0.4-path-traversal.md"
      provides: "W0.4 NEW ~30L rationale doc per RESEARCH § 8 + orchestrator pre-planning #2 LOCKED: documents (a) attack vector analysis (install.ts L77-78 `manifestPath = resolve(process.cwd(), \\`manifests/tools/${resolvedName}.yaml\\`)` with user-controlled `name` arg → `resolveAlias(name)` → `resolvedName` string interpolation), (b) spike outcome verified by code trace — `path.resolve` absolute-safe (Node MDN std) + ENOENT graceful (catch L86-94 + exits 1 with 'manifest not found') + TypeBox schema strict validate (`apiVersion: harnessed/v1` + `kind: Manifest` required fields rejects 99.9% non-manifest YAML), (c) RECOMMENDATION DEFER explicit regex hardening to Phase 4.0 W0 (when external user input arrives — currently sole consumer is project maintainer, attack surface near-zero), (d) sister Phase 3.3 RESEARCH § 10.4 STRIDE Tampering threat model already enumerated this exact threat ('Malicious aliases.yaml redirect path traversal' — mitigation: 'install.ts could regex-guard against /[/\\\\.]/ chars (Phase 3.4 hardening if real threat surfaces)' — Phase 3.4 confirms NOT real), (e) 1 defense-in-depth empirical fixture in tests/integration/install-path-traversal.test.ts (NO regex code change per spike DEFER lock)"
      contains: "DEFER Phase 4.0"
    - path: "tests/integration/install-path-traversal.test.ts"
      provides: "W0.4 NEW ~40L 1 defense-in-depth fixture (empirical proof of spike outcome per SPIKE-W0.4-path-traversal.md): seed minimal tmpdir + run `spawnSync(process.execPath, ['./dist/cli.js', 'install', '../../etc/passwd', '--dry-run', '--non-interactive'], {...})` + assert exit code 1 + assert stderr contains 'manifest .* not found' (ENOENT graceful fallback verified) + assert NOT exfiltrate (no leaked file content in stdout/stderr); sister Phase 3.3 tests/integration/install-aliases.test.ts spawn pattern + sister tests/scripts/dashboard-sse.test.ts tmpdir isolation pattern; NO regex code change in install.ts (DEFER lock per spike outcome — Phase 4.0 W0 add regex if external user demand arrives)"

    # W0.5 SAMPLES.md sourcing pre-flight (critical path - gates W1 routing harness)
    - path: ".planning/phase-3.4/SAMPLES.md"
      provides: "W0.5 NEW ~180L 30-row matrix (Karpathy ≤200L hard; sister Phase 2.3 SAMPLES.md L1-80 3-section format 100% template reuse + D-01 REAL HISTORICAL adapt per RESEARCH § 3 + PATTERNS § 2.3 verbatim): § 1 Selection Rationale (Source: REAL HISTORICAL mining `git log --since=2026-05-12 --until=2026-05-17 --no-merges` 331 commits verified + .planning/phase-{1.1..3.1}/task_plan.md × 10 + .planning/intel/{dashboard-handoff-2026-05-16,omc-comparison}.md × 2; 3 sources, no over-engineering, Karpathy YAGNI; REJECT STATE.md narrative + RETROSPECTIVE.md post-hoc + phase PLAN/CONTEXT.md too-wide-scope) + § 1.2 Distribution (exactly 10 Haiku trivial chore/lint/typo + 10 Sonnet medium fix/test/refactor single-file + 10 Opus complex feat-multi-task-batch/cross-phase-wire/arch-rework; bucket heuristic per conventional commit prefix per RESEARCH § 3.2 verified 7-bucket distribution feasible 100/165/65 candidates per tier) + § 1.3 Anti-cherry-pick (sister Phase 2.3 § 1.3 anchor/false-pos/CD-3 透明声明 pattern; per-row source_commit field non-empty; manually-traced expected_decision against routing/decision_rules.yaml v2 12 rules + 5 engineering sub-rules + mattpocock_phases 23 招式 per RESEARCH § 3.4) + § 2 Sample Truth Table 7-col `| # | task_id | model_expected | task_type | description (≤120 chars) | source_commit | expected_decision (yaml inline) |` × 30 rows (7-col schema LOCKED per CONTEXT § Specifics L213-222 verbatim + planner Discretion #1 — NOT sister Phase 2.3 8-col; row regex template ADAPTED from sister samples-30.test.ts L44-62 NOT 100% reuse: sister was 8-col, this phase 7-col with inline yaml decision body; regex: `/^\| (\d{2}) \| (T\d{2}) \| (haiku|sonnet|opus) \| (\w+) \| (.+?) \| ([0-9a-f]{7,10}) \| `\{(.+)\}` \|/`; frozen marker R3 lock) + § 3 Frozen Marker (sister Phase 2.3 § 1.4 cherry-pick 防御 — plan-phase Wave B lock + execute-phase ADR 0017 errata 触发 才可改样本)"
      contains: "REAL HISTORICAL"

    # W1 main scope artifacts (Plan 02 — extended 2026-05-17 per orchestrator W1+W2 append directive)
    - path: "src/cli/lib/check-token-budget.ts"
      provides: "W1 T1.1 NEW ~38L PRIMARY helper 4th member of sister probe-gstack.ts (48L Phase 3.2 W1 T1.4) + check-deprecations.ts (43L Phase 3.3 W1 T1.6) family per RESEARCH § 2.1 + PATTERNS § 2.1: BUFFER /4 estimateTokens imported from src/checkpoint/template.ts L34-36 (D-03 sister 1 precedent zero-dep; NO tiktoken dep per § 13.1 anti-pattern #4) + scanSkillsDir(homedir+/.claude/skills + cwd+/skills dev fallback) + 3-tier CheckResult ('pass'|'warn'|'fail') + thresholds CONTEXT_WINDOW_TOKENS=200_000 (Sonnet baseline) + TOTAL_THRESHOLD=2_000 (1% of 200k) + PER_SKILL_THRESHOLD=5_000 (sister Phase 3.1 D-01 1k checkpoint × 5 realistic); current 6 SKILL.md baseline ~308 tokens (0.15% of 200k) → status='pass' (RESEARCH § 2.3 verified); Karpathy ≤40L hard limit (CONTEXT D-04 spec)"
      contains: "estimateTokens"
    - path: "src/cli/doctor.ts"
      provides: "W1 T1.2 MODIFY +5L (post Option A inline shrink mitigation locked per orchestrator pre-planning #1 + #5 + RESEARCH § 1.2-1.3 + § 12.3): pre-flight gate `wc -l src/cli/doctor.ts == 195` BEFORE modify (no drift since RESEARCH § 1.1 baseline); ADD 8th check `checkTokenBudget` async function L147-150 sister-share 100% reuse pattern + Option A inline shrink to 3L (drop intermediate `runCheck` var) → 4L delegate (`return (await import('./lib/check-token-budget.js')).checkTokenBudget()`) saves 1L; ADD `await checkTokenBudget()` to results array L160-168 + APPEND 'token budget' to description string L156-157 ('Preflight checks (Node / MCP scope / jq / Win bash / origin URL / gstack prefix / deprecations / token budget)'); post-modify gate `wc -l src/cli/doctor.ts` ≤ 200 (sister Phase 3.3 W1 T1.7 cadence; Karpathy hard limit ≤200 容 biome 微 drift; if exact 200L cannot be hit, executor MAY ship 198-200L range — Option B helper extract still backup escalation if real >200L); D-04 DOCTOR WARN status='warn' when triggered (NOT 'fail', sister Phase 3.3 D-02 DOCTOR-ONLY-WARN cadence)"
      contains: "checkTokenBudget"
    - path: "tests/cli/check-token-budget.test.ts"
      provides: "W1 T1.3 NEW ~50L 5 fixture per RESEARCH § 10.1 + § 10.3 + PATTERNS § 1 row 9 (sister tests/cli/check-deprecations.test.ts 5-fixture pattern + tests/checkpoint/state.test.ts vi.mock('node:fs') three件套): fixture 1 skills/ dir missing → status='pass' message='no skills installed' + fixture 2 1 skill ~100 chars (~25 tokens) → status='pass' total ≤2000 + fixture 3 50 skills × 100 chars (~1250 tokens) → status='pass' under 2000 threshold + fixture 4 50 skills × 200 chars (~2500 tokens) → status='warn' with top_consumers list + '% of 200k window' format + fixture 5 1 skill with 6000 token description (>5k per-skill) → status='warn' + per-skill flag in detail; estimateTokens 不 mock (用真 Buffer.byteLength + fixture string per sister Phase 3.1 W2 enforceBudget.test.ts pattern)"
      contains: "checkTokenBudget"
    - path: "tests/cli/doctor.test.ts"
      provides: "W1 T1.4 MODIFY +~10L (sister Phase 3.3 W1 T1.12 W-04 7→8 check fixture update pattern延袭): add fixture asserts doctor results array has 8 entries (was 7); assert 8th entry name === 'token budget'; assert doctor exit code 0 when 8th status is 'warn' (B-06 warn ≠ fail per D-04 DOCTOR WARN lock); existing 7 check tests still pass post-MODIFY (baseline preserve)"
      contains: "token budget"
    - path: "tests/cli/doctor-fixtures.test.ts"
      provides: "W1 T1.4 MODIFY +~10L (sister Phase 3.3 W1 T1.12 7th check parametrize 加入 pattern延袭): add 8th check to parametrize array sister 7-check pattern; each fixture verifies CheckResult shape (name + status + message + fix?); cross 7→8 check baseline parametrize update"
    - path: "tests/routing/phase-3.4-routing-hit-rate.test.ts"
      provides: "W1 T1.5 NEW ~130L per D-02 RUN ENGINE + sister tests/routing/samples-30.test.ts L1-150 Phase 2.3 W4 T4.3 100% template reuse + RESEARCH § 4 + PATTERNS § 2.5: pre-compute SAMPLES + RESULTS (vitest parallel race avoidance sister L84-91) + per-sample `it()` cell loop with [MISS] console.error diff format (sister L100-110) + per-tier breakdown describe block (haiku/sonnet/opus replacing sister design/content/testing categories) + hard gate `expect(totalHit).toBeGreaterThanOrEqual(26)` (≥85% sister Phase 2.3 D-05 同阈值); per-tier acceptance per R7 ROADMAP L149 verbatim: Sonnet ≥ 8 hits 100% (perfection) + Haiku ≥ 8 hits ≥ 84% + Opus ≥ 8 hits ≥ 80% derived; production routing/decision_rules.yaml dispatch (NO mock per Discretion); consumes W0.5 SAMPLES.md 30-row matrix as primary input (critical path)"
      contains: "phase-3.4-routing-hit-rate"

    # W2 v0.3.0 close ship artifacts (Plan 03 — sister Phase 2.4 W6 v0.2.0 close template 100% reuse per RESEARCH § 9)
    - path: "docs/adr/0017-routing-hit-rate-token-budget.md"
      provides: "W2 T2.1 NEW ~150-200L ≤250L 9 章节 errata (sister docs/adr/0016-aliases-deprecation-known-good.md Phase 3.3 W2 T2.5 9-section template 100% reuse + sister 0014/0015 cadence): Header (Accepted YYYY-MM-DD) + § 1 D-01 REAL HISTORICAL 30 sample mining rationale + § 2 D-02 RUN ENGINE per-sample dispatch + actual vs expected + § 3 D-03 BUFFER /4 sister Phase 3.1 D-01 enforceBudget precedent zero-dep + § 4 D-04 DOCTOR WARN sister 7-check → 8-check UX 一致 + § 5 W0.1 STRATEGIC STATE.md institutionalize 4 D-decisions D1+D2+D3+D4 paranoid framing + § 6 schemaVersion 13-surface CD-5 single 兼容门 (consumer only; no NEW surface this phase) + § 7 v0.3.0 close milestone discipline (sister v0.2.0 single-day close cadence) + § 8 W0.4 path traversal spike DEFER Phase 4.0 cross-ref + § 9 ASR/ADR stats total 17 + cumulative milestone progress 4/4; Karpathy ≤250L hard limit (sister 0014/0015/0016 range)"
      contains: "0017"
    - path: ".planning/STATE.md (W2 T2.2 ship-time T6.N D2 cadence first-implementation)"
      provides: "W2 T2.2 续编 Phase 3.4 SHIPPED event log + 15th 历史 entry + 当前位置 块更新 to Phase 3.4 + v0.3.0 100% PROGRESS (4/4 phases ✅); W0.1 D2 ship-time T6.N cadence first-implementation: trim Phase 3.1 + 3.2 narrative → RETROSPECTIVE archive section (sister Phase 2.4 W6 T6.3 RETRO 续编 pattern; institutionalized per Phase 3.4+ onward); STATE.md ≤200L round 1 maintained post-续编 (auto-trim prev-prev-phase narrative compensates for new Phase 3.4 entry; D3 gate verifies)"
      contains: "Phase 3.4 SHIPPED"
    - path: ".planning/RETROSPECTIVE.md (W2 T2.3)"
      provides: "W2 T2.3 续编 Phase 3.4 milestone retrospective entry (sister Phase 3.3 W2 T2.7 6-section retro pattern延袭): W0.1 STATE.md institutionalize 4 D-decisions D1-D4 first-implementation lesson + W0.2 install.ts pkg.version Path A ES2022 import attributes + bonus package.json bump + W0.3 R7.6 8 real entries fill + W0.4 path traversal spike DEFER lesson + W0.5 SAMPLES.md REAL HISTORICAL mining 30 sample + W1 doctor 8th check Option A inline shrink (no helper extract) + W1 routing harness sister samples-30.test.ts 100% template + W2 v0.3.0 milestone close sister v0.2.0 100% template; ALSO receives W0.1 D2 auto-archive content (Phase 3.1+3.2 narrative section moved STATE→RETRO per D2 cadence first-implementation)"
      contains: "Phase 3.4"
    - path: ".planning/ROADMAP.md (W2 T2.4)"
      provides: "W2 T2.4 MODIFY: L167 Phase 3.4 entry add ✅ SHIPPED 2026-05-17 marker + L130 v0.3.0 milestone PROGRESS 3/4 → 4/4 SHIPPED & ARCHIVED marker (sister L38 v0.1.0 + L58 v0.2.0 SHIPPED & ARCHIVED literal pattern延袭); v0.3.0 milestone close marker added; v0.4.0 next milestone kickoff reference"
      contains: "Phase 3.4.*SHIPPED"
    - path: "README.md (W2 T2.5)"
      provides: "W2 T2.5 MODIFY: L9 Status freshness header update (sister 5-recurrence terminus D-04 COLLAPSE STATUS_MARKER path) + v0.3.0 MILESTONE row 3/4 → 4/4 SHIPPED & ARCHIVED + add Phase 3.4 entry to shipped phase list (L44 area); freshness gate `node scripts/check-transparency-verdicts.mjs` exit 0 post-MODIFY"
    - path: "PROJECT-SPEC.md (W2 T2.6)"
      provides: "W2 T2.6 MODIFY: L3 Status header add Phase 3.4 SHIPPED literal (sister Phase 3.3 W2 T2.6 FRONT_MATTER_DOCS transparency gate pattern); freshness gate post-MODIFY pass"
    - path: ".github/workflows/ci.yml (W2 T2.7 A7 守恒 iter)"
      provides: "W2 T2.7 MODIFY: A7 iter `ADR 0001-0016` → `ADR 0001-0017` (sister Phase 3.3 W2 T2.7 + Phase 3.2 W3 T3.4 + Phase 3.1 W5 T5.4 explicit literal sed-replace pattern延袭); 5 sites L34 errata header + L35 ADR range + L71 iter line + L74 step name + L99 echo string; combined with W0.1 D3 check-state-archive-stale.mjs CI step add (no merge conflict; additive lines in W0.1 vs literal swaps in W2.T2.7)"
      contains: "0001-0017"
    - path: ".planning/milestones/v0.3.0-ROADMAP.md"
      provides: "W2 T2.8 NEW archive (sister .planning/milestones/v0.2.0-ROADMAP.md 10.7k template per RESEARCH § 9.1 verbatim): copy v0.3.0 section from ROADMAP.md L130-178 + freeze at v0.3.0 milestone close (4 phase + Phase 3.1/3.2/3.3/3.4 SHIPPED markers); frozen-at-milestone-close pattern sister Phase 2.4 W6 T6.5 ship"
      contains: "v0.3.0"
    - path: ".planning/milestones/v0.3.0-REQUIREMENTS.md"
      provides: "W2 T2.9 NEW archive (sister .planning/milestones/v0.2.0-REQUIREMENTS.md 6.6k template per RESEARCH § 9.1 verbatim): copy R7 section from REQUIREMENTS.md L280-291 + freeze (R7.1-R7.6 v0.3.0 scope subset frozen)"
      contains: "R7"
    - path: ".planning/milestones/v0.3.0-MILESTONE-AUDIT.md"
      provides: "W2 T2.10 NEW INAUGURATE (sister .planning/v0.2.0-MILESTONE-AUDIT.md 150L 6-section format gold-standard 100% template reuse per RESEARCH § 9.2 + orchestrator pre-planning #4 LOCKED): YAML frontmatter (milestone + audited + status + scores + gaps + tech_debt) + TL;DR 2-3 paragraphs ship quality + key judgment + § 0.5 Line Budget Deviations Accepted table + § 1 Per-Phase Status 4-row table (Phase 3.1/3.2/3.3/3.4 / 自验状态 / Critical Gaps / Tech Debt) + § 2 Cross-Phase Integration seam matrix (N seams all ✅ OK with evidence) + § 3 E2E Flows flow matrix (5 flows wired with evidence) + § 4 Requirements Coverage R7.1-R7.6 × status × evidence × phase + § 5 v0.3.0 vs v0.2.0 8-dim comparison + § 6 Verdict PASSED + close + tag + next-milestone announcement (NB: v0.3.0 inaugurate NEW surface — v0.2.0 archive 仅 ROADMAP + REQUIREMENTS 2 files, MILESTONE-AUDIT was inline at .planning/ root; v0.3.0+ moves all 3 to .planning/milestones/ for consistency)"
      contains: "PASSED"
    - path: ".planning/phase-3.4/DOGFOOD-T2.X.md"
      provides: "W2 T2.11 NEW ~30-40L (sister .planning/phase-3.3/DOGFOOD-T2.8.md format verbatim per PATTERNS § 1 row 15): verify steps + command outputs + acceptance verify scope: (a) `harnessed doctor --json` 8-check output capture (含 token budget 字段) + (b) routing harness `pnpm test tests/routing/phase-3.4-routing-hit-rate.test.ts` 输出 (≥26/30) + (c) install --known-good real entries verify (`harnessed install claude-agent-sdk --known-good` dry-run output reflects pinned version); PASS N/N miss: none per transparency gate verify"
      contains: "PASS"

  key_links:
    # W0.1 D3 gate consumer chain
    - from: ".planning/STATE.md (post-W0.1 D1 trim ≤200L)"
      to: "scripts/check-state-archive-stale.mjs 3 rules"
      via: "warn-only round 1 ENFORCE=false initial; 3 rules scan: Rule 1 size ≤200 + Rule 2 关键决议 ship 总结 section ≤1 + Rule 3 W-N errata literal forbidden; flip ENFORCE Phase 3.5 OR v0.4.0 sister Phase 2.1 transparency cadence延袭; freshness gate scripts/check-transparency-verdicts.mjs (Phase 3.3 STATE_POSITION_RE OR-fallback) co-runs but unrelated check (transparency = Status: marker presence, archive-stale = STATE size + cadence)"
      pattern: "STATE_PATH|SIZE_LIMIT|HISTORICAL_ERRATA_RE"
    - from: ".github/workflows/ci.yml"
      to: "scripts/check-state-archive-stale.mjs invocation step"
      via: "CI step adjacency: `- name: Check STATE.md archive cadence (warn-only round 1)` + `run: node scripts/check-state-archive-stale.mjs` placed after existing `node scripts/check-transparency-verdicts.mjs` step (sister gate adjacency per RESEARCH § 11.3); warn-only round 1 (CI passes even with violations printed; flip ENFORCE Phase 3.5 OR v0.4.0)"
      pattern: "check-state-archive-stale"

    # W0.2 #AD + bonus package.json
    - from: "src/cli/install.ts L114-116 harnessedVer"
      to: "package.json L2 version field"
      via: "Path A `import pkg from '../../package.json' with { type: 'json' }` (Node 22 + TypeScript 5.6+ ES2022 import attributes native); fallback Path B `JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../../package.json'), 'utf8'))`; post-W0.2 + bonus version bump: harnessedVer reads '0.3.0' (was hardcoded '0.3.0' but package.json was stale '0.1.0-alpha.1' — bonus bump unblocks `harnessed install --known-good` functional verify per RESEARCH § 6.4 Recommendation (i))"
      pattern: "pkg\\.version|import pkg from"

    # W0.3 #AC + W0.5 SAMPLES.md
    - from: "versions/0.3.0-known-good.yaml"
      to: "src/manifest/knownGood.ts loadKnownGood + getPinnedVersion (Phase 3.3 W1 T1.5 existing)"
      via: "lazy load triggered by `harnessed install <name> --known-good` flag (Phase 3.3 W1 T1.9 lazy import 模式); 8 entries per Discretion locked entry list — claude-agent-sdk (npm-cli) + gstack (git-clone-with-setup, install.git_ref SoT) + gsd (npm-cli) + superpowers (cc-plugin-marketplace v5.1.0, manifests/tools/ path) + planning-with-files (cc-plugin-marketplace v2.37.0) + mattpocock-skills (npx-skill-installer main-76-commits) + karpathy-skills (git-clone-with-setup, last_known_good_version skill-only-v1 + zero-hash sentinel) + tavily-mcp (mcp-stdio-add); per-version Map memoize; consume site `src/cli/install.ts` L114-122 (post-W0.2 harnessedVer = pkg.version = '0.3.0' so lookup hits versions/0.3.0-known-good.yaml not '0.1.0-alpha.1-known-good.yaml' non-existent)"
      pattern: "upstreams|getPinnedVersion"
    - from: ".planning/phase-3.4/SAMPLES.md (W0.5 30-row matrix)"
      to: "tests/routing/phase-3.4-routing-hit-rate.test.ts (W1 Plan 02 NEW harness)"
      via: "markdown table parser sister `tests/routing/samples-30.test.ts` L44-62 rowRe pattern (NEW Plan 02 W1 consumer); R3 frozen lock — SAMPLES.md plan-phase Wave B locked, execute-phase 不允许改样本; critical path dependency W0.5 must ship before W1.T1.4 routing harness, otherwise test has no input"
      pattern: "SAMPLES\\.md|loadSamples"

    # W1 main scope key_links (Plan 02 — extended 2026-05-17 per orchestrator W1+W2 append directive)
    - from: "src/cli/lib/check-token-budget.ts"
      to: "src/checkpoint/template.ts L34-36 estimateTokens (Phase 3.1 D-01 sister 1 precedent)"
      via: "direct `import { estimateTokens } from '../../checkpoint/template.js'` — Karpathy YAGNI sister 1 precedent zero-dep (D-03 BUFFER /4 lock per CONTEXT + § 13.1 anti-pattern #4 sneak block: NO tiktoken npm dep, NO `import tiktoken` literal allowed); estimateTokens(s) = Math.ceil(Buffer.byteLength(s, 'utf8') / 4) heuristic"
      pattern: "estimateTokens"
    - from: "src/cli/doctor.ts 8th check `await checkTokenBudget()` results array"
      to: "src/cli/lib/check-token-budget.ts checkTokenBudget()"
      via: "Option A inline shrink delegate pattern (sister L147-150 checkDeprecations dispatch 100% reuse + 1L extra shrink to exact 200L hit per orchestrator pre-planning #1 + #5 LOCKED): `async function checkTokenBudget(): Promise<CheckResult> { return (await import('./lib/check-token-budget.js')).checkTokenBudget() }`; D-04 DOCTOR WARN: status='warn' when total > 2000 tokens OR per-skill > 5000 tokens (sister Phase 3.3 D-02 DOCTOR-ONLY-WARN cadence 延袭; B-06 warn ≠ fail exit code 0)"
      pattern: "checkTokenBudget"
    - from: "tests/routing/phase-3.4-routing-hit-rate.test.ts"
      to: "src/routing/decisionRules.ts L75-200 arbitrate(rules, task)"
      via: "D-02 RUN ENGINE per-sample call: `loadDecisionRules('routing/decision_rules.yaml').rules` (production NOT mock per Discretion) + `arbitrate(rules, buildTask(sample))` per-sample dispatch + compare actual matched rule id vs sample.expected_decision; pre-compute pattern (sister samples-30.test.ts L84-91 vitest parallel race avoidance); per-tier breakdown (haiku/sonnet/opus) defends mean; hard gate ≥26/30 (≥85% per D-02 + ROADMAP R7 L149 verbatim)"
      pattern: "arbitrate|dispatch"

    # W2 v0.3.0 close key_links (Plan 03 — sister Phase 2.4 W6 close pattern 100% reuse)
    - from: "Phase 3.4 W2 ship cycle"
      to: "v0.3.0 milestone close (sister v0.2.0 close 2026-05-16 single-day cadence per RESEARCH § 13.2)"
      via: "11 atomic task sequence (T2.1 ADR 0017 → T2.2-T2.6 5-doc 续编 STATE+RETRO+ROADMAP+README+SPEC → T2.7 ci.yml A7 iter → T2.8 v0.3.0-ROADMAP archive → T2.9 v0.3.0-REQUIREMENTS archive → T2.10 v0.3.0-MILESTONE-AUDIT NEW inaugurate → T2.11 DOGFOOD-T2.X verify → T2.12 triple tag adr-0017-accepted + v0.3.0-alpha.4-routing + 🎯 v0.3.0); single-day target (sister v0.2.0 evidence Phase 2.4 ship 2026-05-16 + milestone close 2026-05-16 same day)"
      pattern: "v0\\.3\\.0|adr-0017-accepted"
    - from: "docs/adr/0017-routing-hit-rate-token-budget.md"
      to: "A7 守恒 baseline tag adr-0017-accepted"
      via: "Phase 3.4 W2 ship-time T2.12 push `adr-0017-accepted` baseline tag (sister Phase 3.1 0014 + Phase 3.2 0015 + Phase 3.3 0016 cadence延袭); .github/workflows/ci.yml T2.7 A7 iter `ADR 0001-0016` → `ADR 0001-0017` ensures CI verifies ADR 0001-0017 main body 0 diff post-tag"
      pattern: "adr-0017-accepted"
    - from: ".planning/milestones/v0.3.0-MILESTONE-AUDIT.md (W2 T2.10 NEW inaugurate)"
      to: "Phase 3.4 W2 ship verify scope (PASSED verdict expected per RESEARCH § 13.2 4/4 phases × 8/8 acceptance bar precedent)"
      via: "sister v0.2.0-MILESTONE-AUDIT.md 150L 6-section format 100% template (TL;DR + § 0.5 Line Budget + § 1 Per-Phase Status + § 2 Cross-Phase Integration + § 3 E2E Flows + § 4 Requirements Coverage + § 5 v0.3.0 vs v0.2.0 + § 6 Verdict); inaugurate location at `.planning/milestones/v0.3.0-MILESTONE-AUDIT.md` (v0.2.0 was inline at .planning/v0.2.0-MILESTONE-AUDIT.md — v0.3.0+ moves to milestones/ subdir for consistency with -ROADMAP + -REQUIREMENTS sibling archives)"
      pattern: "PASSED|6-section"
---

<objective>
Phase 3.4 装配 **v0.3.0 milestone 第 4 phase / final close phase** 全 3 wave 24 atomic task (W0 5 backlog + W1 6 main + W2 11 v0.3.0 close ship) sister Phase 3.3 3-wave 25 atomic 模板延袭.

## Wave 0 — Backlog 5 项 absorb (Plan 01 this PLAN.md):

**5-phase 连续 "deferred-items → next phase W0 一次根治" cadence 6th phase 沿袭**: **W0.1 STRATEGIC "STATE.md role + archive cadence institutionalize" (4 D-decisions D1+D2+D3+D4 user-locked + paranoid 命名 architectural framing NOT cleanup per D-04 COLLAPSE 命名思路延袭) + W0.2 DEFERRED #AD install.ts package.json version read 1-line surgical (Path A ES2022 import attributes locked + bonus package.json version bump 0.1.0-alpha.1 → 0.3.0 align with shipped milestone tags per RESEARCH § 6.4 Recommendation (i)) + W0.3 DEFERRED #AC R7.6 real seed fill 8 entries verified against real manifests (claude-agent-sdk@0.3.142 npm-cli + gstack@SHA git-clone-with-setup install.git_ref SoT + gsd@1.41.2 npm-cli + superpowers@v5.1.0 cc-plugin-marketplace from manifests/tools/superpowers.yaml + planning-with-files@v2.37.0 cc-plugin-marketplace + mattpocock-skills@main-76-commits npx-skill-installer + karpathy-skills@skill-only-v1 git-clone-with-setup last_known_good_version field + tavily-mcp@0.2.19 mcp-stdio-add per RESEARCH § 7.1 + orchestrator pre-planning #3 verbatim locked) + W0.4 DEFERRED #AE path traversal spike outcome DEFER Phase 4.0 + 30L rationale doc + 1 defense-in-depth fixture (per RESEARCH § 8 + orchestrator pre-planning #2 LOCKED — install.ts L77-94 path.resolve + ENOENT + TypeBox strict 双层 defense verified, real attack surface near-zero) + W0.5 30 sample sourcing pre-flight SAMPLES.md NEW ~180L 30-row matrix (REAL HISTORICAL D-01 LOCKED; gates W1 RUN ENGINE harness Plan 02 — critical path)**.

## Wave 1 — Main scope (Plan 02 ref task_plan.md T1.1-T1.6 — 6 atomic):

**check-token-budget.ts NEW PRIMARY helper + doctor 8th check + routing harness + tests + D3 gate test + 7→8 check fixture update**: (T1.1) `src/cli/lib/check-token-budget.ts` NEW ~38L PRIMARY helper 4th member of probe-gstack/check-deprecations sister family (D-03 BUFFER /4 estimateTokens import + D-04 DOCTOR WARN 3-tier CheckResult); (T1.2) `src/cli/doctor.ts` MODIFY +5L 8th check Option A inline shrink locked per orchestrator pre-planning #1 + #5 LOCKED (pre-flight `wc -l == 195` + post-modify `wc -l == 200` exact Karpathy NO B-03 tolerance per D-04 lock); (T1.3) `tests/cli/check-token-budget.test.ts` NEW ~50L 5 fixture sister Phase 3.3 check-deprecations.test.ts 5-fixture pattern; (T1.4) `tests/cli/doctor.test.ts` + `tests/cli/doctor-fixtures.test.ts` MODIFY 7→8 check baseline update + new 8th check fixture (sister Phase 3.3 W1 T1.12 W-04 fix pattern延袭); (T1.5) `scripts/check-state-archive-stale.mjs` D3 gate test `tests/scripts/check-state-archive-stale.test.ts` NEW ~50L 3 rules verify (sister scripts/check-transparency-verdicts.mjs sister test pattern延袭, warn-only round 1 verify exit 0 with violations printed); (T1.6) `tests/routing/phase-3.4-routing-hit-rate.test.ts` NEW ~130L D-02 RUN ENGINE per-sample dispatch sister tests/routing/samples-30.test.ts 151L Phase 2.3 W4 T4.3 100% template 复用 (consume W0.5 SAMPLES.md 30-row matrix; per-tier breakdown haiku/sonnet/opus; hard gate ≥26/30 per ROADMAP R7).

## Wave 2 — v0.3.0 close ship (Plan 03 ref task_plan.md T2.1-T2.12 — 11+1 atomic):

**sister Phase 2.4 W6 v0.2.0 close 100% template per RESEARCH § 9.3 verbatim**: (T2.1) `docs/adr/0017-routing-hit-rate-token-budget.md` NEW ~150-200L ≤250L 9 章节 errata (sister ADR 0016 9-section template) + (T2.2) `.planning/STATE.md` 续编 Phase 3.4 SHIPPED + W0.1 D2 ship-time T6.N archive cadence first-implementation (Phase 3.1+3.2 narrative trim → RETROSPECTIVE) + (T2.3) `.planning/RETROSPECTIVE.md` 续编 Phase 3.4 milestone retro 6-section sister Phase 3.3 format + 接收 STATE D2 auto-archive + (T2.4) `.planning/ROADMAP.md` L167 Phase 3.4 ✅ SHIPPED + L130 v0.3.0 4/4 SHIPPED & ARCHIVED + (T2.5) `README.md` L9 + L44 freshness Status + v0.3.0 4/4 + Phase 3.4 row + (T2.6) `PROJECT-SPEC.md` L3 Status header Phase 3.4 SHIPPED literal + (T2.7) `.github/workflows/ci.yml` A7 iter `0001-0016` → `0001-0017` (5 sed-replace sites sister Phase 3.3 W2 T2.7 explicit literal pattern) + (T2.8) `.planning/milestones/v0.3.0-ROADMAP.md` NEW archive (copy v0.3.0 section + freeze sister v0.2.0-ROADMAP.md 10.7k template) + (T2.9) `.planning/milestones/v0.3.0-REQUIREMENTS.md` NEW archive (copy R7 section + freeze sister v0.2.0-REQUIREMENTS.md 6.6k template) + (T2.10) `.planning/milestones/v0.3.0-MILESTONE-AUDIT.md` NEW INAUGURATE 150L 6-section (sister v0.2.0-MILESTONE-AUDIT.md gold-standard 100% template per orchestrator pre-planning #4 LOCKED — TL;DR + § 0.5 Line Budget + § 1 Per-Phase + § 2 Cross-Phase + § 3 E2E Flows + § 4 Requirements + § 5 v0.3.0 vs v0.2.0 + § 6 PASSED Verdict expected per RESEARCH § 13.2) + (T2.11) `.planning/phase-3.4/DOGFOOD-T2.X.md` NEW ~30-40L PASS N/N (sister Phase 3.3 DOGFOOD-T2.8.md format) + (T2.12) triple tag push `adr-0017-accepted` + `v0.3.0-alpha.4-routing` + 🎯 `v0.3.0` (sister v0.2.0 close 2026-05-16 single-day cadence per § 13.2 + § 9.4 tag naming convention).

**Purpose**: Phase 3.4 是 v0.3.0 milestone 第 4/4 phase / final close phase — Phase 3.1 plan-feature workflow + checkpoint ✅ + Phase 3.2 gstack 前缀探测 ✅ + Phase 3.3 aliases + known-good schema ✅ + Phase 3.4 routing hit-rate ≥ 85% + token budget + v0.3.0 close → 完整 v0.3.0 milestone ship. W0.1 STRATEGIC institutionalize Phase 3.3 sister review 4 D-decisions D1-D4 first-implementation; W0.2-W0.5 兑现 Phase 3.3 deferred-items #AC/#AD/#AE + 新 W0.5 SAMPLES.md sourcing; W1 主线 装 token budget doctor 8th check + 30 sample routing dispatch hit rate harness; W2 v0.3.0 close 11+1 task sister v0.2.0 100% template (ADR 0017 + 5-doc 续编 + 3-file milestone archive + audit inaugurate + triple tag push).

**Output**: 全 24 atomic task across 3 wave (5 + 6 + 11+1) — task_plan.md 含完整 per-task 三件套 `<read_first>` + `<acceptance_criteria>` + `<action>` + `<decision_source>` blocks; sister Phase 3.3 task_plan.md 1234L 25 atomic structure 直接复刻 + adapt per W0/W1/W2 scope.

> **R1+R2 critical findings absorbed** (4 项): (1) **doctor.ts wc -l 实测 195L NOT 184L stale claim** (RESEARCH § 1.1 + bash 实测 — Phase 3.3 W1 T1.7 ship landed at 195L not 189L projection; +6L 8th check = 201L breach → mitigation Option A inline shrink delegate to 3L exact 200L hit per W1 T1.2 orchestrator pre-planning #1 LOCKED); (2) **30-sample mining feasibility VERIFIED** (RESEARCH § 3 + bash `git log --since=2026-05-12 --until=2026-05-17 --no-merges` = 331 commits in window; 7-bucket commit prefix distribution feasible 10/10/10 selection per RESEARCH § 3.2); (3) **W0.4 path traversal NOT real attack vector** (RESEARCH § 8.2 + install.ts L77-94 code trace + ENOENT + TypeBox strict 双层 defense; DEFER Phase 4.0 + 30L rationale doc + 1 fixture LOCKED per orchestrator pre-planning #2); (4) **STATE.md 实测 723L NOT ≤150L straight target** (RESEARCH § 5.1 + bash `wc -l` — archive ~400L → ~323L round 1, additional collapse → ≤200L target round 1 warn-only; v0.4+ tighten to ≤150L per D3 Rule 1 SIZE_LIMIT future flip; orchestrator pre-planning #7 LOCKED).

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
@.planning/phase-3.4/3.4-KICKOFF.md
@.planning/phase-3.4/3.4-CONTEXT.md
@.planning/phase-3.4/PATTERNS.md
@.planning/phase-3.4/RESEARCH.md
@.planning/phase-3.4/task_plan.md

# Frozen interface contracts (本 phase Wave 0+1+2 consume + MODIFY 来源)
@src/cli/install.ts
@src/cli/doctor.ts
@src/cli/lib/probe-gstack.ts
@src/cli/lib/check-deprecations.ts
@src/checkpoint/template.ts
@src/routing/decisionRules.ts
@src/routing/lib/arbitrateRedirect.ts
@src/manifest/knownGood.ts
@package.json
@scripts/check-transparency-verdicts.mjs
@versions/0.3.0-known-good.yaml
@manifests/skill-packs/gstack.yaml
@manifests/skill-packs/gsd.yaml
@manifests/skill-packs/karpathy-skills.yaml
@manifests/tools/tavily-mcp.yaml
@manifests/tools/ctx7.yaml
@routing/decision_rules.yaml
@tests/routing/samples-30.test.ts
@tests/cli/doctor.test.ts
@tests/cli/doctor-fixtures.test.ts
@tests/cli/check-deprecations.test.ts

# Sister precedent (format gold-standard)
@.planning/phase-3.3/PLAN.md
@.planning/phase-3.3/task_plan.md
@.planning/phase-3.3/deferred-items.md
@.planning/phase-3.3/DOGFOOD-T2.8.md
@.planning/phase-2.3/SAMPLES.md
@.planning/v0.2.0-MILESTONE-AUDIT.md
@.planning/milestones/v0.2.0-ROADMAP.md
@.planning/milestones/v0.2.0-REQUIREMENTS.md
@docs/adr/0016-aliases-deprecation-known-good.md
</context>

<interfaces>
<!-- Key types/contracts the executor needs (extracted from codebase per planner-format) -->

From src/cli/install.ts L114-122 (Phase 3.3 W1 T1.9 ship; W0.2 #AD MODIFY target):
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

W0.2 Path A target (Node 22 + TypeScript 5.6+ ES2022 import attributes native):
```typescript
// at file top:
import pkg from '../../package.json' with { type: 'json' }
// at L116 replace:
const harnessedVer = pkg.version
```

From src/cli/doctor.ts L130-195 baseline (Phase 3.3 W1 T1.7 ship 195L; W1 T1.2 MODIFY target):
```typescript
async function checkOriginUrl(): Promise<CheckResult> { /* L130-134 ~5L delegate */ }
async function checkGstackPrefix(): Promise<CheckResult> { /* L138-142 ~5L delegate */ }
async function checkDeprecations(): Promise<CheckResult> { /* L147-150 ~4L delegate */ }
// ... commander wire + run + format output (L152-195 = 44L)
```

W1 T1.2 Option A target (sister L147-150 pattern + 1L extra shrink to 3L delegate per orchestrator pre-planning #1 LOCKED):
```typescript
// Phase 3.4 W1 T1.2 — 8th check: skill description token budget (D-04 DOCTOR WARN).
async function checkTokenBudget(): Promise<CheckResult> {
  return (await import('./lib/check-token-budget.js')).checkTokenBudget()
}
```

From src/checkpoint/template.ts L34-36 (Phase 3.1 D-01 sister 1 precedent for D-03 BUFFER /4):
```typescript
export function estimateTokens(s: string): number {
  return Math.ceil(Buffer.byteLength(s, 'utf8') / 4)
}
```

From scripts/check-transparency-verdicts.mjs L1-30 + L53-91 (W0.1 D3 sister gate 100% pattern model for check-state-archive-stale.mjs NEW):
```javascript
#!/usr/bin/env node
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
const ENFORCE = true  // Phase 2.2 W0 T0.6 ship-time flip (warn-only round 1 → ENFORCE round 2)
// ... scan + violations + console.warn + exit ENFORCE ? 1 : 0 pattern
```

From src/manifest/schema/known-good.v1.ts (Phase 3.3 W1 T1.3 ship; W0.3 fill schema consumer):
```typescript
export const PinnedUpstream = Type.Object({
  name: Type.String({ minLength: 1 }),
  version: Type.String({ minLength: 1 }),
  install_method: Type.String({ minLength: 1 }),  // free-form (NOT InstallType enum)
}, { additionalProperties: false })
export const KnownGoodV1 = Type.Object({
  schemaVersion: Type.Literal(SCHEMA_VERSIONS.knownGood),
  harnessed_version: Type.String({ pattern: '^\\d+\\.\\d+\\.\\d+$' }),
  e2e_verified_at: Type.String({ pattern: '^\\d{4}-\\d{2}-\\d{2}$' }),
  upstreams: Type.Array(PinnedUpstream),
}, { additionalProperties: false })
```

From src/routing/decisionRules.ts L75-200 (W1 T1.6 routing harness API contract):
```typescript
export type TaskContext = Record<string, unknown>
export function loadDecisionRules(yamlPath: string): DecisionRulesFile
export function arbitrate(rules: Rule[], task: TaskContext): Rule | null
```

From tests/routing/samples-30.test.ts L20-110 (sister harness 100% template for W1 T1.6 phase-3.4-routing-hit-rate.test.ts):
```typescript
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { arbitrateWithRedirect, loadDecisionRules, type Rule, type TaskContext } from '../../src/routing/decisionRules.js'

const SAMPLES = loadSamples(SAMPLES_PATH)  // markdown table parser; row regex 7-col vs 8-col per planner D-01 schema decision
const RULES: Rule[] = loadDecisionRules(RULES_PATH).rules
const RESULTS = SAMPLES.map((s) => {
  const matched = arbitrate(RULES, buildTask(s))  // Phase 3.4 D-02 RUN ENGINE per-sample dispatch
  return { sample: s, matched, hit: deriveHit(matched, s.expected_decision) }
})

describe('Phase 3.4 30-sample routing.arbitrate harness (D-02 RUN ENGINE ≥85%)', () => {
  it('parses exactly 30 samples from SAMPLES.md § 2', () => { expect(SAMPLES.length).toBe(30) })
  for (const { sample, matched, hit } of RESULTS) {
    it(`#${sample.task_id} ${sample.model_expected} ${sample.task_type} — expected ${sample.expected_decision.router ?? '<null>'} actual ${matched?.id ?? '<null>'}`, () => {
      if (!hit) console.error(`[MISS] #${sample.task_id} (${sample.model_expected}): expected=${sample.expected_decision.router} actual=${matched?.id ?? 'null'} desc="${sample.description}"`)
      expect(hit).toBe(true)
    })
  }
})
// Per-tier breakdown — R7 dogfooding scope ROADMAP L149 verbatim Sonnet 100% / Haiku ≥84% / Opus ≥80% derived
```

From manifests/skill-packs/gsd.yaml L34 (W0.3 entry value source for last-known-good gsd version):
```yaml
last_known_good_version: 1.41.2
```

From manifests/skill-packs/karpathy-skills.yaml L58 (W0.3 entry value source for karpathy-skills last-known-good):
```yaml
last_known_good_version: skill-only-v1
```

From package.json L2 (W0.2 bonus version bump target):
```json
"version": "0.1.0-alpha.1"   // ← W0.2 bonus bump → "0.3.0"
```

From docs/adr/0016-aliases-deprecation-known-good.md (Phase 3.3 W2 T2.5 ship; W2 T2.1 ADR 0017 9-section template gold-standard sister):
```markdown
# ADR 0016 - Phase 3.3 aliases.yaml + deprecation marker + known-good 版本组合
**Status**: Accepted YYYY-MM-DD
## § 1 D-01 RICH aliases
## § 2 D-02 DOCTOR-ONLY-WARN
## § 3 D-03 YAML manifest known-good
## § 4 D-04 STATE COLLAPSE 5-recurrence terminus
## § 5 schemaVersion 12+13 surface manifest-domain colocation
## § 6 install resolveAlias 1-line surgical pre-manifest-lookup
## § 7 W0.2 dashboard-sse fix path (a) random port + DASHBOARD_PORT env
## § 8 § 12 3-wave W0-W2 topology
## § 9 ASR/ADR-stats: total ADRs 16 + cumulative milestone progress 3/4
```

From .planning/v0.2.0-MILESTONE-AUDIT.md L1-150 (W2 T2.10 milestone audit 6-section template gold-standard):
```yaml
---
milestone: 0.2.0
audited: 2026-05-16
status: passed
scores:
  requirements: 13/13
  phases: 4/4
  integration: 6/6
  flows: 3/3
---
# v0.2.0 Milestone Audit — PASSED
## TL;DR
## § 0.5 Line Budget Deviations Accepted
## § 1 Per-Phase Status
## § 2 Cross-Phase Integration
## § 3 E2E Flows
## § 4 Requirements Coverage
## § 5 v0.2.0 vs v0.1.0 对比
## § 6 Verdict — PASSED
```
</interfaces>

<tasks>

<!-- Wave 0 single grouped task delegates to atomic task_plan.md task IDs T0.1-T0.5.
     task_plan.md contains <read_first> / <acceptance_criteria> / <action> with concrete values per task.
     Wave 1 (T1.1-T1.6) and Wave 2 (T2.1-T2.12) ALSO in task_plan.md per orchestrator W1+W2 append directive 2026-05-17. -->

<task type="auto">
  <name>Wave 0 — Backlog 5 项 absorb (T0.1 W0.1 STRATEGIC STATE institutionalize 4 D-decisions D1+D2+D3+D4 + T0.2 W0.2 #AD install pkg.json read + bonus package.json bump + T0.3 W0.3 #AC R7.6 real seed 8 entries fill + T0.4 W0.4 #AE path traversal spike DEFER + T0.5 W0.5 SAMPLES.md 30-row matrix sourcing pre-flight)</name>
  <files>.planning/STATE.md, scripts/check-state-archive-stale.mjs, .github/workflows/ci.yml, src/cli/install.ts, package.json, versions/0.3.0-known-good.yaml, .planning/phase-3.4/SPIKE-W0.4-path-traversal.md, tests/integration/install-path-traversal.test.ts, .planning/phase-3.4/SAMPLES.md, .planning/RETROSPECTIVE.md</files>
  <action>Run T0.1 → T0.2 → T0.3 → T0.4 → T0.5 per task_plan.md (T0.1 FIRST 必修 STRATEGIC D1+D2+D3+D4 institutionalize 30min; T0.2 + T0.3 + T0.4 + T0.5 may parallelize after T0.1 establishes archive cadence + gate infra; T0.5 SAMPLES.md gates Plan 02 W1 routing harness critical path so MUST ship before Wave 1 starts). Per-task `<read_first>` / `<acceptance_criteria>` / `<action>` / `<decision_source>` 三件套 in task_plan.md T0.1-T0.5 blocks (sister Phase 3.3 task_plan.md 25-atomic format 100% reuse).</action>
  <verify>
    <automated>wc -l .planning/STATE.md # ≤ 200 (round 1 target); node scripts/check-state-archive-stale.mjs # exit 0 (warn-only round 1); grep -q "ENFORCE = false" scripts/check-state-archive-stale.mjs # exit 0; wc -l scripts/check-state-archive-stale.mjs # ≤ 60; grep -q "check-state-archive-stale" .github/workflows/ci.yml # exit 0; grep -q "ARCHIVED FROM STATE" .planning/RETROSPECTIVE.md # exit 0 (D2 cadence first ship); grep -q "\\*\\*Phase 3\\.3 SHIPPED\\*\\*" .planning/STATE.md # exit 0 (SSOT preserved); grep -q "pkg.version\\|harnessedVer.*package" src/cli/install.ts # exit 0; ! grep -q "harnessedVer.*'0\\.3\\.0'" src/cli/install.ts # exit 0; ! grep -q "TODO Phase 3.4: read from package.json" src/cli/install.ts # exit 0; grep -q '"version": "0.3.0"' package.json # exit 0; wc -l src/cli/install.ts # ≤ 200; pnpm typecheck # exit 0; grep -c "^  - name:" versions/0.3.0-known-good.yaml # ≥ 5 (8 planned); grep -q "e2e_verified_at: '2026-05-17'" versions/0.3.0-known-good.yaml # exit 0; pnpm test -- --run tests/manifest/knownGood.test.ts 2>&1 | tail -3 | grep -E "Tests.*passed" # exit 0; test -f .planning/phase-3.4/SPIKE-W0.4-path-traversal.md; grep -q "DEFER Phase 4.0" .planning/phase-3.4/SPIKE-W0.4-path-traversal.md; test -f tests/integration/install-path-traversal.test.ts; pnpm test -- --run tests/integration/install-path-traversal.test.ts 2>&1 | tail -3 | grep -E "Tests.*1 passed" # exit 0; test -f .planning/phase-3.4/SAMPLES.md; wc -l .planning/phase-3.4/SAMPLES.md # ≤ 200; grep -cE "^\\| 0[1-9] \\|| [12][0-9] \\|| 30 \\|" .planning/phase-3.4/SAMPLES.md # == 30; grep -E "REAL HISTORICAL|source_commit" .planning/phase-3.4/SAMPLES.md | wc -l # ≥ 3 (D-01 sneak block); node scripts/check-transparency-verdicts.mjs # exit 0 (regression守门)</automated>
  </verify>
  <done>Wave 0 complete per Wave 0 success_criteria block below; SAMPLES.md frozen R3 lock; W1 + W2 prereq carry satisfied.</done>
</task>

<task type="auto">
  <name>Wave 1 — Main scope 6 atomic (T1.1 check-token-budget.ts NEW PRIMARY helper + T1.2 doctor.ts 8th check Option A inline shrink locked + T1.3 check-token-budget.test.ts NEW 5 fixture + T1.4 doctor.test.ts + doctor-fixtures.test.ts MODIFY 7→8 check baseline + T1.5 check-state-archive-stale.mjs gate test NEW + T1.6 phase-3.4-routing-hit-rate.test.ts NEW 30+per-tier harness)</name>
  <files>src/cli/lib/check-token-budget.ts, src/cli/doctor.ts, tests/cli/check-token-budget.test.ts, tests/cli/doctor.test.ts, tests/cli/doctor-fixtures.test.ts, tests/scripts/check-state-archive-stale.test.ts, tests/routing/phase-3.4-routing-hit-rate.test.ts</files>
  <action>Run T1.1 → T1.2 → T1.3 (T1.2 pre-flight `wc -l doctor.ts == 195` gate first; T1.2 post-modify `wc -l doctor.ts == 200` hard fail if >200 per Karpathy NO B-03 tolerance D-04 lock) → T1.4 → T1.5 → T1.6 per task_plan.md T1.1-T1.6 blocks (sister Phase 3.3 W1 T1.6+T1.7+T1.12 helper+doctor+tests 三件套 100% template reuse). T1.6 routing harness MUST consume W0.5 SAMPLES.md (frozen R3 lock); per-tier breakdown haiku/sonnet/opus ≥ 8 each + hard gate ≥26/30 per ROADMAP R7 L149 verbatim.</action>
  <verify>
    <automated>test -f src/cli/lib/check-token-budget.ts; wc -l src/cli/lib/check-token-budget.ts # ≤ 40 (Karpathy spec); grep -q "estimateTokens" src/cli/lib/check-token-budget.ts # exit 0 (D-03 sister precedent); grep -q "checkTokenBudget" src/cli/doctor.ts; wc -l src/cli/doctor.ts # ≤ 200 (sister Phase 3.3 W1 T1.7 cadence; Karpathy hard limit ≤200; Option B helper extract escalation if >200); pnpm test -- --run tests/cli/check-token-budget.test.ts 2>&1 | tail -3 | grep -E "Tests.*5 passed"; pnpm test -- --run tests/cli/doctor.test.ts tests/cli/doctor-fixtures.test.ts 2>&1 | tail -3 | grep -E "Tests.*passed" # 7→8 check baseline pass; test -f tests/scripts/check-state-archive-stale.test.ts; pnpm test -- --run tests/scripts/check-state-archive-stale.test.ts 2>&1 | tail -3 | grep -E "Tests.*passed"; test -f tests/routing/phase-3.4-routing-hit-rate.test.ts; pnpm test -- --run tests/routing/phase-3.4-routing-hit-rate.test.ts 2>&1 | tail -5 | grep -E "30 passed|Tests.*passed"; pnpm typecheck; ! grep -E "import tiktoken|require\\('tiktoken'\\)" src/cli/lib/check-token-budget.ts # § 13.1 anti-pattern #4 sneak block守门</automated>
  </verify>
  <done>Wave 1 complete per Wave 1 success_criteria block below; routing harness ≥26/30 hard gate pass + per-tier acceptance R7 verbatim Sonnet 100% / Haiku ≥ 84% / Opus ≥ 80% derived; doctor.ts ≤200L Karpathy hard limit hit exact; check-token-budget.ts ≤40L Karpathy spec.</done>
</task>

<task type="auto">
  <name>Wave 2 — v0.3.0 close ship 11+1 atomic (T2.1 ADR 0017 9 章节 NEW + T2.2-T2.6 5-doc 续编 STATE+RETRO+ROADMAP+README+SPEC + T2.7 ci.yml A7 iter 0001-0017 + T2.8-T2.9 v0.3.0-{ROADMAP,REQUIREMENTS} archive + T2.10 v0.3.0-MILESTONE-AUDIT INAUGURATE 150L 6-section + T2.11 DOGFOOD-T2.X PASS verify + T2.12 triple tag adr-0017-accepted + v0.3.0-alpha.4-routing + 🎯 v0.3.0)</name>
  <files>docs/adr/0017-routing-hit-rate-token-budget.md, .planning/STATE.md, .planning/RETROSPECTIVE.md, .planning/ROADMAP.md, README.md, PROJECT-SPEC.md, .github/workflows/ci.yml, .planning/milestones/v0.3.0-ROADMAP.md, .planning/milestones/v0.3.0-REQUIREMENTS.md, .planning/milestones/v0.3.0-MILESTONE-AUDIT.md, .planning/phase-3.4/DOGFOOD-T2.X.md, git tags</files>
  <action>Run T2.1 → T2.2 → T2.3 → T2.4 → T2.5 → T2.6 → T2.7 → T2.8 → T2.9 → T2.10 → T2.11 → T2.12 per task_plan.md T2.1-T2.12 blocks (全串行 sister Phase 2.4 W6 T6.1-T6.5 cadence + Phase 3.3 W2 T2.1-T2.10 9 sub-task pattern 100% reuse). T2.10 MILESTONE-AUDIT.md NEW inaugurate at `.planning/milestones/` subdir (sister v0.2.0 was inline `.planning/v0.2.0-MILESTONE-AUDIT.md` 150L 6-section gold-standard format — v0.3.0+ moves to milestones/ for consistency with sibling -ROADMAP + -REQUIREMENTS archives). T2.12 triple tag MUST WAIT for user explicit push approval per CLAUDE.md commit safety protocol — NEVER push without user request.</action>
  <verify>
    <automated>test -f docs/adr/0017-routing-hit-rate-token-budget.md; wc -l docs/adr/0017-routing-hit-rate-token-budget.md # ≤ 250 (Karpathy ADR hard); grep -cE "^## §" docs/adr/0017-routing-hit-rate-token-budget.md # ≥ 9 (9 章节); grep -q "Accepted" docs/adr/0017-routing-hit-rate-token-budget.md; grep -q "Phase 3.4.*SHIPPED" .planning/STATE.md; grep -q "Phase 3.4" .planning/RETROSPECTIVE.md; grep -q "Phase 3.4.*✅" .planning/ROADMAP.md; grep -q "v0\\.3\\.0.*4/4" .planning/ROADMAP.md; grep -q "v0\\.3\\.0.*SHIPPED & ARCHIVED" .planning/ROADMAP.md; grep -q "Phase 3.4" README.md; grep -q "Phase 3.4" PROJECT-SPEC.md; grep -c "0001-0017" .github/workflows/ci.yml # ≥ 3; ! grep -q "0001-0016" .github/workflows/ci.yml # (除非 errata 注释 backward refs); test -f .planning/milestones/v0.3.0-ROADMAP.md; test -f .planning/milestones/v0.3.0-REQUIREMENTS.md; test -f .planning/milestones/v0.3.0-MILESTONE-AUDIT.md; wc -l .planning/milestones/v0.3.0-MILESTONE-AUDIT.md # ≥ 120 ≤ 200 (sister 150L 6-section); grep -cE "^## " .planning/milestones/v0.3.0-MILESTONE-AUDIT.md # ≥ 6 (TL;DR + § 0.5 + § 1-6); grep -q "PASSED" .planning/milestones/v0.3.0-MILESTONE-AUDIT.md; test -f .planning/phase-3.4/DOGFOOD-T2.X.md; grep -q "PASS" .planning/phase-3.4/DOGFOOD-T2.X.md; git tag --list 'adr-0017-accepted' | wc -l # == 1; git tag --list 'v0.3.0-alpha.4-routing' | wc -l # == 1; git tag --list 'v0.3.0' | wc -l # == 1; git diff adr-0016-accepted..HEAD -- docs/adr/000[1-9]-*.md docs/adr/001[0-6]-*.md | wc -l # == 0 (A7 守恒 — only ADR 0017 NEW, 0001-0016 不动); pnpm test 2>&1 | tail -5 | grep -E "Tests.*passed.*0 failed" # full suite green pre-tag; node scripts/check-transparency-verdicts.mjs # exit 0 (freshness gate post-续编)</automated>
  </verify>
  <done>Wave 2 complete per Wave 2 success_criteria block below; v0.3.0 milestone close (4/4 phases ✅; .planning/milestones/v0.3.0-{ROADMAP,REQUIREMENTS,MILESTONE-AUDIT}.md NEW archive triplet; triple tag push 仅在 user 明确 push 同意后 push origin --tags); A7 守恒 adr-0001-0017 main body 0 diff verified; Phase 3.4 SHIPPED 完整 v0.3.0 ship.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| **versions/0.3.0-known-good.yaml authored content → loadKnownGood → install npm_version override** | versions/ yaml is project-tracked + release-process-managed via git PR; getPinnedVersion returns pinned version for npm-cli installer parameter; sister Phase 3.3 T-3.3-04+T-3.3-05 threat enumerated (accept disposition); W0.3 fill 8 real entries inherits same defense (TypeBox semver pattern + git-blame audit trail) |
| **SAMPLES.md authored content → routing harness 30-sample input** | SAMPLES.md is plan-phase Wave 0 frozen + execute-phase 不允许改样本 (R3 lock sister Phase 2.3 § 1.4 cherry-pick 防御); per-row source_commit field non-empty (D-01 sneak block); manually-traced expected_decision against routing/decision_rules.yaml v2 12 rules; per-tier breakdown defends mean (cherry-pick warn) |
| **scripts/check-state-archive-stale.mjs gate execution → STATE.md scan** | gate is project-tracked + git-managed (PR review gate); 3 rules scan STATE.md content; warn-only round 1 (no enforcement); flip ENFORCE Phase 3.5/v0.4.0 (sister Phase 2.1 transparency gate cadence); NO secrets exposure (STATE.md is git-tracked, no PII) |
| **install.ts user input `name` arg → path interpolation (W0.4 spike)** | path.resolve absolute-safe (Node MDN std) + ENOENT graceful + TypeBox schema strict validate 双层 defense; W0.4 spike outcome verified by code trace; DEFER explicit regex hardening Phase 4.0 (sister Phase 3.3 § 10.4 STRIDE Tampering already enumerated) |
| **skills/<name>/SKILL.md authored content → check-token-budget.ts fs scan + estimateTokens** | skills/ is git-tracked + 1 maintainer-managed; check-token-budget.ts pure fs.readFile + Buffer.byteLength (NO shell exec / eval primitive per § 13.1 anti-pattern #4 sneak block; W1 T1.5 verify `! grep -E "execSync|spawnSync\\|require\\('tiktoken'\\)" src/cli/lib/check-token-budget.ts`); D-04 DOCTOR WARN status='warn' = visibility NOT enforcement (B-06 warn ≠ fail exit code 0) |
| **routing/decision_rules.yaml v2 → arbitrate(rules, task) production dispatch (W1 T1.6 harness)** | routing/decision_rules.yaml is git-tracked + 1 maintainer-managed; harness uses production rules (NOT mock per D-02 Discretion); 30 sample × <10ms arbitrate = <1s test runtime; per-tier breakdown defends single-tier cherry-pick (Sonnet 100% / Haiku ≥ 84% / Opus ≥ 80% derived per R7 ROADMAP L149 verbatim) |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-3.4w0-01 | Tampering | path traversal via `harnessed install "../../etc/passwd"` filesystem exfiltration attempt | mitigate | install.ts L77-94 path.resolve cwd-bound absolute-safe + ENOENT graceful catch L86-94 + TypeBox schema strict validate (`apiVersion: harnessed/v1` + `kind: Manifest` required) rejects 99.9% non-manifest YAML; W0.4 spike outcome verified by code trace; `tests/integration/install-path-traversal.test.ts` 1 defense-in-depth empirical fixture; DEFER explicit regex hardening Phase 4.0 W0 (when external user input arrives — currently sole consumer is project maintainer, near-zero attack surface); sister Phase 3.3 RESEARCH § 10.4 already enumerated this exact threat (mitigation: 'install.ts could regex-guard against `/[/\\.]/` chars (Phase 3.4 hardening if real threat surfaces)' — Phase 3.4 confirms NOT real surface) |
| T-3.4w0-02 | Tampering | malicious SAMPLES.md cherry-pick (executor picks easy samples to inflate hit rate post-plan-phase) | mitigate | SAMPLES.md frozen at plan-phase Wave 0 (R3 lock sister Phase 2.3 § 1.4 cherry-pick 防御 pattern); per-row source_commit field non-empty (D-01 sneak block per PATTERNS § 3 D-01); manually-traced expected_decision against routing/decision_rules.yaml v2 12 rules (sister Phase 2.3 § 1.3 anchor/false-pos/CD-3 透明声明 pattern); per-tier breakdown defends mean (single tier < 60% cherry-pick warn per Plan 02 W1 harness); execute-phase 不允许改样本 (W1 T1.6 routing harness consumes frozen SAMPLES.md as input — ADR 0017 errata 触发 才可改样本) |
| T-3.4w0-03 | Tampering | malicious versions/0.3.0-known-good.yaml fake `name: 'evil-package'` injection during W0.3 fill | accept | versions/ yaml is git-tracked + release-process-managed (PR review gate); W0.3 fill 8 entries are pre-vetted candidate list per RESEARCH § 7.1 (claude-agent-sdk@0.3.142 from package.json L70 exact + gstack git SHA from manifests/skill-packs/gstack.yaml L22 + ...); planner-verify each manifest yaml install_method field before commit (executor read each manifest pre-commit); content audit is process-level not code-level; schema accepts any non-empty string for name/version/install_method (intentional anti-coupling per RESEARCH § 4.2) |
| T-3.4w0-04 | DoS | massive STATE.md growth → archive-stale gate slow scan (3 rules × 200L target × 1000+ violations on cold-start project) | accept | gate is single-pass scan (`readFileSync` + `split('\n')` + 3 RegExp); SIZE_LIMIT=200L hard cap on input size; round 1 warn-only (NO enforcement); ENFORCE flip Phase 3.5/v0.4.0 only after STATE.md normalized within limits (sister Phase 2.1 transparency gate ENFORCE flip cadence 1-phase warn-only → ENFORCE round 2 precedent verified) |
| T-3.4w0-05 | Repudiation | Phase 3.4 W0.1 archive moved content (STATE→RETROSPECTIVE) cannot be reverse-traced if RETROSPECTIVE later edited | mitigate | git-tracked archive moves (commit msg explicit "T0.1 D1 trim + D2 archive cadence first-implementation: L96-329 + L518-683 → RETROSPECTIVE Phase N-2 § ARCHIVED FROM STATE"); `git blame` + `git log -p --follow .planning/RETROSPECTIVE.md` provides full audit trail; D3 gate Rule 3 forbids W-N errata literal in STATE.md going forward (防 H1 复发 — sister Phase 3.3 sister review H1 pollution prior 6-phase) |
| T-3.4w0-06 | Tampering | `with { type: 'json' }` import attribute syntax injection via malicious package.json (W0.2 #AD Path A) | accept | package.json is git-tracked + 1 file per project + PR review gate; ES2022 import attributes is parser-level (NOT runtime eval); harnessedVer reads pkg.version field only (NOT executes arbitrary JS); Path B fallback `JSON.parse` also parser-level (Node JSON parser hardened against injection per V8 specifications) |
| T-3.4w1-01 | DoS | Verbose skill description bloat → context window exhaustion (DoS via legitimate skill but bad budget; e.g. 50 skills × 6000 token description = 300k tokens > 200k window) | mitigate | doctor 8th check `checkTokenBudget` D-04 DOCTOR WARN status='warn' visibility (NOT enforcement — sister Phase 3.3 D-02 DOCTOR-ONLY-WARN cadence); per-skill > 5000 + total > 2000 token thresholds; top-3 consumers list in warn message; fix hint "consider shortening verbose skill descriptions"; current 6 SKILL.md baseline ~308 tokens (0.15% of 200k) — well within budget |
| T-3.4w1-02 | Tampering | check-token-budget.ts shell-exec injection via skill description content (e.g. malicious SKILL.md `description: $(rm -rf /)`) | accept | check-token-budget.ts pure fs.readFile + Buffer.byteLength NO shell exec / eval / template literal interpolation primitives (verified W1 T1.3 `tests/cli/check-token-budget-no-injection.test.ts` 1 fixture per RESEARCH § 10.1 security dimension); description is plain string read + token estimate only (no parse / eval / spawn); sister Phase 3.1 D-01 estimateTokens precedent same primitive baseline; § 13.1 anti-pattern #4 sneak block: NO tiktoken npm dep (zero-dep precedent + no native bindings) |
| T-3.4w1-03 | Tampering | malicious routing/decision_rules.yaml fake rule injection (e.g. `id: malicious, priority: 999, router: A`) during W1 T1.6 production dispatch | accept | routing/decision_rules.yaml is git-tracked + 1 maintainer-managed (PR review gate); harness uses production rules per D-02 Discretion (NOT mock — real dogfood value); TypeBox schema validate via loadDecisionRules() pre-dispatch (sister Phase 1.4 R1 ship; schema strict validate rejects malformed); SAMPLES.md frozen R3 lock prevents test-input cherry-pick to mask malicious rule effect |
| T-3.4w2-01 | Repudiation | Phase 3.4 W2 ship commits cannot be reverse-traced if RETROSPECTIVE later edited / ADR 0017 retroactively modified | mitigate | git-tracked W2 commits (commit msg explicit per-task footer "T2.X — sister Phase 3.3 W2 T2.X pattern"); `git blame` + `git log -p --follow` provides full audit trail; A7 守恒 baseline tag `adr-0017-accepted` (T2.12) freezes ADR 0001-0017 main body 0 diff post-tag; sister Phase 3.3 W2 T2.9 A7 verify cadence延袭 |
| T-3.4w2-RISK | Operational | Wave 2 12-task + 13-file scope borderline Dim 5 gate (single-day cadence cherry-pick risk) | accept | sister Phase 2.4 W6 11-task single-day proven; Phase 3.4 +1 task scope marginal increment; mitigation = sister cadence + executor anti-stall protocol 50 tool use budget extended; W-7 orchestrator REJECT split decision (v0.3.0 close 同日 ship sister cadence延袭); if real stall observed mid-Wave 2 → escalate planner for mid-wave split into W2a (T2.1-T2.7 5-doc 续编 + ADR + ci.yml) + W2b (T2.8-T2.12 milestone archive triplet + DOGFOOD + tag) |
| T-3.4w2-02 | Tampering | milestone audit verdict inflation (T2.10 author claims PASSED when 1+ phase or 1+ acceptance bar partial) | mitigate | sister v0.2.0-MILESTONE-AUDIT.md 6-section template § 4 Requirements Coverage forces per-REQ status table with evidence + phase ref (NOT free-form prose); § 1 Per-Phase Status forces per-phase "自验状态 / Critical Gaps / Tech Debt" 3-col table; partial items MUST 明确 v0.4.0+ 去向 (NOT 隐瞒 — sister v0.2.0 audit § 4 R3.4 v0.2 portion partial → v0.3.0+ 去向 transparency pattern延袭); audit ship-time pre-tag verify: `pnpm test` full suite green + 4/4 phase self-report pass + 0 unsatisfied residual; T2.11 DOGFOOD-T2.X PASS verify provides 3-axis empirical evidence (doctor 8th check + routing harness ≥26/30 + install --known-good real entries) |

</threat_model>

<verification>
**All wave-level verification gates (all must pass before ship):**

## Wave 0 gates (T0.1-T0.5)

1. **STATE.md trim ≤200L round 1 target** (W0.1 D1): `wc -l .planning/STATE.md` ≤ 200 (was 723L; archive ~400L → ~323L → additional collapse → ≤200L per RESEARCH § 5.1 + orchestrator pre-planning #7 LOCKED)
2. **当前位置 SSOT preserved** (W0.1 D1): `grep -q "\\*\\*Phase 3\\.3 SHIPPED\\*\\*" .planning/STATE.md` exit 0 (STATE_POSITION_RE anchor for D-04 COLLAPSE freshness gate)
3. **RETROSPECTIVE.md archive section first ship** (W0.1 D2): `grep -q "ARCHIVED FROM STATE" .planning/RETROSPECTIVE.md` exit 0 (first-implementation of ship-time T6.N archive cadence per sister Phase 2.4 W6 T6.3 RETRO 续编 pattern)
4. **check-state-archive-stale.mjs NEW gate warn-only round 1** (W0.1 D3): `test -f scripts/check-state-archive-stale.mjs` AND `grep -q "ENFORCE = false" scripts/check-state-archive-stale.mjs` exit 0 AND `wc -l scripts/check-state-archive-stale.mjs` ≤ 60 (Karpathy spec) AND `node scripts/check-state-archive-stale.mjs` exit 0 (warn-only round 1)
5. **ci.yml gate CI step adjacency** (W0.1 D3): `grep -q "check-state-archive-stale" .github/workflows/ci.yml` exit 0 (sister gate adjacency with transparency-verdicts step)
6. **install.ts pkg.version read** (W0.2 #AD): `grep -q "pkg.version\\|harnessedVer.*package" src/cli/install.ts` exit 0 AND `! grep -q "harnessedVer.*'0\\.3\\.0'" src/cli/install.ts` exit 0 AND `! grep -q "TODO Phase 3.4: read from package.json" src/cli/install.ts` exit 0 (Path A ES2022 import attributes OR Path B readFileSync fallback)
7. **package.json bonus version bump** (W0.2): `grep -q '"version": "0.3.0"' package.json` exit 0 (align shipped milestone tags)
8. **versions/0.3.0-known-good.yaml 8 entries fill** (W0.3 #AC): `grep -c "^  - name:" versions/0.3.0-known-good.yaml` ≥ 5 (planned 8) AND `grep -q "e2e_verified_at: '2026-05-17'" versions/0.3.0-known-good.yaml` exit 0 (not 'TBD') AND `grep -q "claude-agent-sdk" versions/0.3.0-known-good.yaml` exit 0 AND `grep -q "0.3.142" versions/0.3.0-known-good.yaml` exit 0 AND `pnpm test -- --run tests/manifest/knownGood.test.ts` exit 0 (Phase 3.3 W1 T1.12 5 fixture pass on filled seed)
9. **SPIKE-W0.4-path-traversal.md NEW doc + 1 defense-in-depth fixture** (W0.4 #AE DEFER): `test -f .planning/phase-3.4/SPIKE-W0.4-path-traversal.md` AND `wc -l .planning/phase-3.4/SPIKE-W0.4-path-traversal.md` ≥ 20 ≤ 60 AND `grep -q "DEFER Phase 4.0" .planning/phase-3.4/SPIKE-W0.4-path-traversal.md` exit 0 AND `test -f tests/integration/install-path-traversal.test.ts` AND `pnpm test -- --run tests/integration/install-path-traversal.test.ts` 1 pass
10. **SAMPLES.md 30-row matrix REAL HISTORICAL** (W0.5): `test -f .planning/phase-3.4/SAMPLES.md` AND `wc -l .planning/phase-3.4/SAMPLES.md` ≤ 200 (Karpathy hard) AND row count == 30 (regex match strict) AND `grep -E "REAL HISTORICAL|source_commit" .planning/phase-3.4/SAMPLES.md | wc -l` ≥ 3 (D-01 sneak block守门) AND `grep -E "frozen|Frozen Marker" .planning/phase-3.4/SAMPLES.md | wc -l` ≥ 1 (R3 lock)

## Wave 1 gates (T1.1-T1.6)

11. **check-token-budget.ts NEW ≤40L PRIMARY helper** (T1.1): `test -f src/cli/lib/check-token-budget.ts` AND `wc -l src/cli/lib/check-token-budget.ts` ≤ 40 (Karpathy CONTEXT D-04 spec) AND `grep -q "estimateTokens" src/cli/lib/check-token-budget.ts` (D-03 sister 1 precedent zero-dep import) AND `! grep -q "tiktoken" src/cli/lib/check-token-budget.ts` (§ 13.1 anti-pattern #4 sneak block)
12. **doctor.ts 8th check Option A inline shrink hits exact 200L** (T1.2): pre-flight `wc -l src/cli/doctor.ts == 195` (baseline preserve, no drift since RESEARCH § 1.1) AND post-modify `wc -l src/cli/doctor.ts` ≤ 200 (sister Phase 3.3 W1 T1.7 cadence; Karpathy hard limit ≤200 容 biome 微 drift; if 201L breach, executor MUST extract additional helper sister Phase 3.1 W-01 engineHook PRIMARY pattern as Option B escalation) AND `grep -q "await checkTokenBudget()" src/cli/doctor.ts` (results array push) AND `grep -q "token budget" src/cli/doctor.ts` (description string updated)
13. **check-token-budget.test.ts 5 fixture pass** (T1.3): `test -f tests/cli/check-token-budget.test.ts` AND `pnpm test -- --run tests/cli/check-token-budget.test.ts 2>&1 | tail -3 | grep -E "Tests.*5 passed"` exit 0
14. **doctor.test.ts + doctor-fixtures.test.ts 7→8 check baseline pass** (T1.4): `pnpm test -- --run tests/cli/doctor.test.ts tests/cli/doctor-fixtures.test.ts 2>&1 | tail -3 | grep -E "Tests.*passed"` exit 0 (existing 7-check tests + new 8th check fixture all pass; sister Phase 3.3 W1 T1.12 W-04 pattern)
15. **check-state-archive-stale.mjs gate test 3 rules verify** (T1.5): `test -f tests/scripts/check-state-archive-stale.test.ts` AND `pnpm test -- --run tests/scripts/check-state-archive-stale.test.ts 2>&1 | tail -3 | grep -E "Tests.*passed"` exit 0 (Rule 1 size + Rule 2 关键决议 ship 总结 + Rule 3 errata literal forbidden — warn-only round 1 verify exit 0)
16. **phase-3.4-routing-hit-rate.test.ts ≥26/30 hard gate pass** (T1.6): `test -f tests/routing/phase-3.4-routing-hit-rate.test.ts` AND `pnpm test -- --run tests/routing/phase-3.4-routing-hit-rate.test.ts 2>&1 | tail -5` shows TOTAL ≥ 26/30 hit + per-tier breakdown Sonnet 100% / Haiku ≥ 84% / Opus ≥ 80% derived per ROADMAP R7 L149 verbatim acceptance bar. **USER-ESCALATION CONTRACT (3-option fail-path)**: If totalHit < 26/30 OR sonnetAcc < 1.0 → escalate to user with 3 options: (a) accept R3 freeze + ship Phase 3.4 with documented routing gap as v0.4.0 carry-forward backlog; (b) re-mine SAMPLES.md (breaks R3 lock — requires ADR 0017 errata addendum); (c) tune decision_rules.yaml (out of v0.3.0 scope — defer v0.4.0 R8.1 dogfooding benchmark publication). Executor MUST NOT silently retune or recompose samples without user-explicit option selection.

## Wave 2 gates (T2.1-T2.12)

17. **ADR 0017 NEW 9 章节 ≤250L** (T2.1): `test -f docs/adr/0017-routing-hit-rate-token-budget.md` AND `wc -l docs/adr/0017-routing-hit-rate-token-budget.md` ≥ 100 ≤ 250 AND `grep -cE "^## §" docs/adr/0017-routing-hit-rate-token-budget.md` ≥ 9 AND `grep -q "Accepted" docs/adr/0017-routing-hit-rate-token-budget.md`
18. **5-doc 续编 STATE + RETRO + ROADMAP + README + SPEC** (T2.2-T2.6): `grep -q "Phase 3.4.*SHIPPED" .planning/STATE.md` + `grep -q "Phase 3.4" .planning/RETROSPECTIVE.md` + `grep -q "Phase 3.4.*✅" .planning/ROADMAP.md` + `grep -q "v0\\.3\\.0.*4/4" .planning/ROADMAP.md` + `grep -q "SHIPPED & ARCHIVED" .planning/ROADMAP.md` + `grep -q "Phase 3.4" README.md` + `grep -q "Phase 3.4" PROJECT-SPEC.md` (sister Phase 3.3 W2 5-doc 续编 cross-ref pattern)
19. **ci.yml A7 iter 0001-0017** (T2.7): `grep -c "0001-0017" .github/workflows/ci.yml` ≥ 3 (5 sed-replace sites L34+L35+L71+L74+L99) AND `! grep -q "0001-0016" .github/workflows/ci.yml` (除非 errata 注释 backward refs — verify A7 baseline ref allowed in errata blocks)
20. **3-file milestone archive triplet NEW** (T2.8-T2.10): `test -f .planning/milestones/v0.3.0-ROADMAP.md` AND `test -f .planning/milestones/v0.3.0-REQUIREMENTS.md` AND `test -f .planning/milestones/v0.3.0-MILESTONE-AUDIT.md` (NEW inaugurate location sister v0.2.0 inline 升级 to milestones/ subdir)
21. **MILESTONE-AUDIT 6-section + PASSED verdict** (T2.10): `wc -l .planning/milestones/v0.3.0-MILESTONE-AUDIT.md` ≥ 120 ≤ 200 (sister v0.2.0 150L) AND `grep -cE "^## " .planning/milestones/v0.3.0-MILESTONE-AUDIT.md` ≥ 6 (TL;DR + § 0.5 + § 1 Per-Phase + § 2 Cross-Phase + § 3 E2E Flows + § 4 Requirements + § 5 v0.3.0 vs v0.2.0 + § 6 Verdict) AND `grep -q "PASSED" .planning/milestones/v0.3.0-MILESTONE-AUDIT.md` (verdict expected PASS per RESEARCH § 13.2 4/4 phase × 8/8 acceptance bar precedent)
22. **DOGFOOD-T2.X PASS verify 3-axis empirical evidence** (T2.11): `test -f .planning/phase-3.4/DOGFOOD-T2.X.md` AND `grep -q "PASS" .planning/phase-3.4/DOGFOOD-T2.X.md` (doctor --json 8-check + routing harness ≥26/30 + install --known-good real entries)
23. **A7 守恒 0 diff post-tag** (T2.12 pre-tag): `git diff adr-0016-accepted..HEAD -- docs/adr/000[1-9]-*.md docs/adr/001[0-6]-*.md | wc -l` == 0 (only ADR 0017 NEW, 0001-0016 不动)
24. **triple tag created (push pending user explicit approval)** (T2.12): `git tag --list 'adr-0017-accepted' | wc -l` == 1 AND `git tag --list 'v0.3.0-alpha.4-routing' | wc -l` == 1 AND `git tag --list 'v0.3.0' | wc -l` == 1; **DO NOT push tags without user explicit request per CLAUDE.md commit safety protocol**

## Cross-wave regression gates (every commit)

25. **typecheck + biome preempt clean** (every commit): `pnpm typecheck` exit 0 + `pnpm exec biome check --write` clean before each commit (project memory `feedback_biome-preempt.md` 3 CI-red recurrences Phase 2.1.1 / 2.2 / 2.3 — preempt now cadence)
26. **transparency gate still passes** (regression守门): `node scripts/check-transparency-verdicts.mjs` exit 0 (Phase 3.3 W0.1 STATE_POSITION_RE OR-fallback still matches **Phase 3.3 SHIPPED** preserved in 当前位置 SSOT; post-W2 T2.2 Phase 3.4 SHIPPED literal append still satisfies marker)
27. **full test suite green pre-tag** (T2.12 pre-tag): `pnpm test 2>&1 | tail -5 | grep -E "Tests.*passed.*0 failed"` exit 0 OR equivalent green signal — gates triple tag push

**Per-task acceptance**: each task in task_plan.md carries grep-verifiable `<acceptance_criteria>` block; executor runs verify per task before commit.
</verification>

<success_criteria>

## Wave 0 SHIPPED criteria

**Phase 3.4 Wave 0 SHIPPED criteria (all must hold; gates Wave 1 + Wave 2 sequential dependencies):**

- [ ] W0.1 STRATEGIC STATE.md role + archive cadence institutionalize (4 D-decisions D1+D2+D3+D4 user-locked + paranoid 命名 architectural framing NOT cleanup per D-04 COLLAPSE 命名思路延袭)
  - [ ] D1 single-SoT: STATE.md ≤200L round 1 target (was 723L; ~400L prev-prev-phase narrative archived to RETROSPECTIVE Phase N-2 § ARCHIVED FROM STATE)
  - [ ] D2 ship-time T6.N cadence first-implementation (sister Phase 2.4 W6 T6.3 RETRO 续编 pattern; W2 T2.2 ship section integrates as standing process Phase 3.4+ onward)
  - [ ] D3 scripts/check-state-archive-stale.mjs NEW ≤60L warn-only round 1 (ENFORCE=false; 3 rules; flip Phase 3.5/v0.4.0) + ci.yml CI step adjacency
  - [ ] D4 ship-process integrate doc (executor 不 SCOPE BOUNDARY 阻挡 archive — gate make GC visible)
- [ ] W0.2 DEFERRED #AD install.ts package.json version read 1-line surgical (Path A ES2022 import attributes locked + bonus package.json version bump 0.1.0-alpha.1 → 0.3.0 align shipped milestone tags per RESEARCH § 6.4 Recommendation (i))
- [ ] W0.3 DEFERRED #AC R7.6 real seed fill 8 entries verified against real manifests (claude-agent-sdk@0.3.142 npm-cli + gstack@SHA git-clone-with-setup install.git_ref SoT + gsd@1.41.2 npm-cli + superpowers@v5.1.0 cc-plugin-marketplace manifests/tools/ + planning-with-files@v2.37.0 cc-plugin-marketplace + mattpocock-skills@main-76-commits npx-skill-installer + karpathy-skills@skill-only-v1 git-clone-with-setup last_known_good_version field + tavily-mcp@0.2.19 mcp-stdio-add; e2e_verified_at: '2026-05-17' not 'TBD'; Value.Check(KnownGoodV1, parsed) pass; Phase 3.3 W1 T1.12 5 fixture still pass on filled seed)
- [ ] W0.4 DEFERRED #AE path traversal spike outcome DEFER Phase 4.0 + 30L rationale doc + 1 defense-in-depth fixture (orchestrator pre-planning #2 LOCKED — install.ts L77-94 path.resolve + ENOENT + TypeBox strict 双层 defense verified, real attack surface near-zero; sister Phase 3.3 § 10.4 STRIDE Tampering already enumerated)
- [ ] W0.5 30 sample sourcing pre-flight SAMPLES.md NEW ~180L 30-row matrix REAL HISTORICAL (D-01 LOCKED; mining git log 331 commits + .planning/phase-{1.1..3.1}/task_plan × 10 + intel × 2; 10 Haiku trivial + 10 Sonnet medium + 10 Opus complex per ROADMAP R7; per-row source_commit non-empty + manually-traced expected_decision; frozen at plan-phase Wave 0 R3 lock; gates Plan 02 W1 RUN ENGINE harness critical path)

## Wave 1 SHIPPED criteria

**Phase 3.4 Wave 1 SHIPPED criteria (all must hold; gates Wave 2 v0.3.0 close ship sequential dependency):**

- [ ] T1.1 src/cli/lib/check-token-budget.ts NEW ≤40L PRIMARY helper (4th member of probe-gstack + check-deprecations sister family; D-03 BUFFER /4 estimateTokens import from src/checkpoint/template.ts sister 1 precedent zero-dep; D-04 DOCTOR WARN 3-tier CheckResult; thresholds CONTEXT_WINDOW=200_000 / TOTAL=2_000 / PER_SKILL=5_000 per RESEARCH § 2.2 grounded; § 13.1 anti-pattern #4 sneak block: NO tiktoken npm dep)
- [ ] T1.2 src/cli/doctor.ts MODIFY +5L 8th check Option A inline shrink locked (pre-flight wc -l == 195 + post-modify wc -l ≤ 200; sister Phase 3.3 W1 T1.7 cadence; Karpathy hard limit ≤200 容 biome 微 drift; Option B helper extract escalation backup if real >200L; sister L147-150 checkDeprecations pattern 100% reuse + 1L extra shrink to 3L delegate per orchestrator pre-planning #1 + #5)
- [ ] T1.3 tests/cli/check-token-budget.test.ts NEW 5 fixture pass (sister Phase 3.3 check-deprecations.test.ts 5-fixture pattern; estimateTokens 不 mock 用真 Buffer.byteLength + fixture string per sister Phase 3.1 W2 enforceBudget.test.ts)
- [ ] T1.4 tests/cli/doctor.test.ts + tests/cli/doctor-fixtures.test.ts MODIFY 7→8 check baseline update + new 8th check fixture (sister Phase 3.3 W1 T1.12 W-04 7→8 parametrize update pattern延袭; existing 7 check tests still pass post-MODIFY)
- [ ] T1.5 tests/scripts/check-state-archive-stale.test.ts NEW gate test 3 rules verify (sister scripts/check-transparency-verdicts.mjs sister test pattern; Rule 1 size + Rule 2 关键决议 ship 总结 + Rule 3 errata literal forbidden; warn-only round 1 verify exit 0 with violations printed)
- [ ] T1.6 tests/routing/phase-3.4-routing-hit-rate.test.ts NEW ~130L sister samples-30.test.ts 100% template (D-02 RUN ENGINE per-sample arbitrate dispatch + production routing/decision_rules.yaml NOT mock per D-02 Discretion; per-tier breakdown haiku/sonnet/opus + hard gate ≥26/30 per ROADMAP R7 L149 verbatim Sonnet 100% / Haiku ≥ 84% / Opus ≥ 80% derived; consumes W0.5 SAMPLES.md frozen 30-row matrix as primary input — critical path)
- [ ] typecheck clean + biome preempt clean + full Wave 1 fixture suite green + tiktoken dep negative守门

## Wave 2 SHIPPED criteria (v0.3.0 milestone close)

**Phase 3.4 Wave 2 + v0.3.0 milestone close SHIPPED criteria (all must hold for v0.3.0 close 完成 ship):**

- [ ] T2.1 docs/adr/0017-routing-hit-rate-token-budget.md NEW ~150-200L ≤250L 9 章节 errata (sister ADR 0016 9-section template 100% reuse + sister 0014/0015 cadence; Accepted YYYY-MM-DD status; § 1 D-01 REAL HISTORICAL + § 2 D-02 RUN ENGINE + § 3 D-03 BUFFER /4 + § 4 D-04 DOCTOR WARN + § 5 W0.1 STRATEGIC STATE institutionalize + § 6 schemaVersion 13-surface consumer + § 7 v0.3.0 close milestone discipline + § 8 W0.4 path traversal spike DEFER cross-ref + § 9 ASR/ADR stats total 17 + milestone progress 4/4)
- [ ] T2.2 .planning/STATE.md 续编 Phase 3.4 SHIPPED entry + 当前位置 v0.3.0 100% PROGRESS + W0.1 D2 ship-time T6.N cadence first-implementation (Phase 3.1+3.2 narrative trim → RETROSPECTIVE per D2)
- [ ] T2.3 .planning/RETROSPECTIVE.md 续编 Phase 3.4 milestone retro 6-section + receive W0.1 D2 auto-archive Phase 3.1+3.2 narrative section (institutionalize first-implementation)
- [ ] T2.4 .planning/ROADMAP.md Phase 3.4 ✅ SHIPPED + v0.3.0 4/4 SHIPPED & ARCHIVED marker (sister L38 v0.1.0 + L58 v0.2.0 pattern)
- [ ] T2.5 README.md L9 Status freshness + v0.3.0 4/4 SHIPPED & ARCHIVED + Phase 3.4 row append
- [ ] T2.6 PROJECT-SPEC.md L3 Status Phase 3.4 SHIPPED literal (FRONT_MATTER_DOCS transparency gate)
- [ ] T2.7 .github/workflows/ci.yml A7 iter `ADR 0001-0016` → `ADR 0001-0017` (5 sed-replace sites L34+L35+L71+L74+L99 sister Phase 3.3 W2 T2.7 explicit literal pattern)
- [ ] T2.8 .planning/milestones/v0.3.0-ROADMAP.md NEW archive (copy v0.3.0 section + freeze sister v0.2.0-ROADMAP.md 10.7k template)
- [ ] T2.9 .planning/milestones/v0.3.0-REQUIREMENTS.md NEW archive (copy R7 section + freeze sister v0.2.0-REQUIREMENTS.md 6.6k template)
- [ ] T2.10 .planning/milestones/v0.3.0-MILESTONE-AUDIT.md NEW INAUGURATE 150L 6-section (sister v0.2.0-MILESTONE-AUDIT.md gold-standard 100% template per orchestrator pre-planning #4 LOCKED; PASSED verdict expected per RESEARCH § 13.2 — 4/4 phases × 8/8 acceptance bar precedent)
- [ ] T2.11 .planning/phase-3.4/DOGFOOD-T2.X.md NEW ~30-40L PASS N/N miss: none (sister Phase 3.3 DOGFOOD-T2.8.md format; 3-axis empirical evidence — doctor --json 8-check + routing harness ≥26/30 + install --known-good real entries)
- [ ] T2.12 triple tag created `adr-0017-accepted` + `v0.3.0-alpha.4-routing` + 🎯 `v0.3.0` (sister v0.2.0 close 2026-05-16 single-day cadence per RESEARCH § 13.2 + § 9.4 tag naming convention; **push pending user explicit approval per CLAUDE.md commit safety protocol — NEVER push without user request**)
- [ ] A7 守恒 verified post-tag (ADR 0001-0016 main body 0 diff vs adr-0016-accepted baseline)
- [ ] full pnpm test suite green pre-tag (gates triple tag push)
- [ ] CI 3-OS green pre-push (Win + macOS + Linux all pass per sister v0.2.0 close ship cadence)
- [ ] D3 ENFORCE flip timing — Phase 3.5 W0 first task OR v0.4.0 W0 first task per CONTEXT DEFERRED #AF (NOT this phase — Phase 3.4 ships warn-only round 1)

</success_criteria>

<output>
After each Wave completion, create wave summary per `$HOME/.claude/get-shit-done/templates/summary.md` template:

- Wave 0 → `.planning/phase-3.4/3.4-01-SUMMARY.md`
- Wave 1 → `.planning/phase-3.4/3.4-02-SUMMARY.md`
- Wave 2 + v0.3.0 close → `.planning/phase-3.4/3.4-03-SUMMARY.md`

Summary must cover:

**Wave 0 SUMMARY (3.4-01)**:
- W0.1 STRATEGIC STATE institutionalize 4 D-decisions D1+D2+D3+D4 first-implementation outcomes (STATE.md trim 723→≤200L round 1 + scripts/check-state-archive-stale.mjs warn-only round 1 + ci.yml CI step adjacency + ship-time T6.N archive cadence integrated)
- W0.2 #AD install.ts pkg.version Path A ES2022 import attributes (OR Path B fallback if Node TS pipeline blocked) + bonus package.json 0.3.0 bump
- W0.3 #AC R7.6 real seed 8 entries fill (Karpathy YAGNI hard cap 10; cross-ref package.json deps + manifests/*.yaml; e2e_verified_at '2026-05-17' not 'TBD' placeholder)
- W0.4 #AE path traversal spike outcome DEFER Phase 4.0 (real attack surface near-zero verified by code trace + 1 defense-in-depth empirical fixture; sister Phase 3.3 § 10.4 STRIDE Tampering already enumerated cross-ref)
- W0.5 SAMPLES.md 30-row matrix REAL HISTORICAL (mining git log 331 commits + .planning/phase-{1.1..3.1}/task_plan × 10 + intel × 2; per-tier 10/10/10 distribution; per-row source_commit non-empty + manually-traced expected_decision; frozen R3 lock; gates Wave 1 RUN ENGINE harness critical path)
- 5-phase 连续 "deferred-items → next phase W0 一次根治" cadence 6th phase 沿袭 (Phase 2.3/2.4/3.1/3.2/3.3 → Phase 3.4 = 6th phase)
- Wave 1 prereq satisfied (SAMPLES.md frozen ready; doctor.ts 195L baseline preserved → Option A inline shrink ready)

**Wave 1 SUMMARY (3.4-02)**:
- T1.1 check-token-budget.ts NEW ≤40L PRIMARY helper (4th sister-family member; estimateTokens import zero-dep; thresholds CONTEXT_WINDOW=200_000 + TOTAL=2_000 + PER_SKILL=5_000)
- T1.2 doctor.ts MODIFY 8th check Option A inline shrink (pre-flight 195L → post-modify 200L exact; Karpathy NO B-03 tolerance verified)
- T1.3 check-token-budget.test.ts NEW 5 fixture pass (mock skills dir + fixture content)
- T1.4 doctor.test.ts + doctor-fixtures.test.ts MODIFY 7→8 check baseline (sister Phase 3.3 W1 T1.12 W-04 pattern)
- T1.5 check-state-archive-stale.test.ts NEW gate test 3 rules
- T1.6 phase-3.4-routing-hit-rate.test.ts NEW ≥26/30 hard gate pass + per-tier R7 acceptance Sonnet 100% / Haiku ≥ 84% / Opus ≥ 80%
- Wave 2 prereq satisfied (full suite green pre-W2 ADR + audit)

**Wave 2 + v0.3.0 close SUMMARY (3.4-03)**:
- T2.1 ADR 0017 9 章节 NEW
- T2.2-T2.6 5-doc 续编 (STATE + RETRO + ROADMAP + README + PROJECT-SPEC) + W0.1 D2 first-implementation ship-time T6.N cadence (Phase 3.1+3.2 narrative auto-trim → RETRO archive section)
- T2.7 ci.yml A7 iter 0001-0017 (5 sed-replace sites sister Phase 3.3 W2 T2.7 explicit literal)
- T2.8-T2.10 milestone 3-file archive triplet NEW at .planning/milestones/ (v0.3.0-ROADMAP + v0.3.0-REQUIREMENTS + v0.3.0-MILESTONE-AUDIT inaugurate sister v0.2.0 150L 6-section format gold-standard per orchestrator pre-planning #4)
- T2.11 DOGFOOD-T2.X PASS verify 3-axis empirical evidence
- T2.12 triple tag created adr-0017-accepted + v0.3.0-alpha.4-routing + 🎯 v0.3.0 (push pending user explicit approval per CLAUDE.md commit safety protocol)
- v0.3.0 milestone close 完成 (Phase 3.1 + 3.2 + 3.3 + 3.4 all SHIPPED; 4/4 phases ✅; sister v0.2.0 close single-day cadence target)
- D3 gate ENFORCE flip carry → Phase 3.5 OR v0.4.0 (DEFERRED #AF per CONTEXT)
- Next: v0.4.0 discuss-phase 启动 (dogfooding benchmark + co-maintainer 招募 + plan-feature 真接外部 gsd-* spawn dogfood)
</invoke>