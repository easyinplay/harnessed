---
phase: 5.1
version: 1
status: ready
type: phase
plan: 1
wave: 0
depends_on: [phase-4.3]
gap_closure: false
autonomous: true

# Frontmatter sister Phase 4.3 PLAN.md 100% template reuse — adapted Phase 5.1 ARCHITECTURAL scope
# Phase 5.1 = v0.5.0 milestone 1/3 STARTING (M-01 ARCHITECTURAL phase class LOCK NOT R-5 publish-only sister Phase 4.3延袭)
# 8 D-decisions LOCKED (CONTEXT 5.1-CONTEXT.md L28-115): R10.1 D-01 jq subprocess + D-02 dual format + D-03 3-flag MVP + D-04 2-layer redact 5 patterns / R10.2 D-05 proper-lockfile + D-06 retry policy + D-07 NO --force + D-08 dir-level lock
# M-01 LOCKED (CONTEXT L18-25): PhaseClass ARCHITECTURAL — full ship cadence ADR 0021 + ci.yml A7 step iter 0018→0021 (RETROACTIVE FIX 0019+0020) + triple tag (sister v0.4.0 close cadence延袭)

requirements:
  - R10.1  # audit log --filter consumer — `harnessed audit-log --filter <jq-expr>` CLI subcommand consume `.harnessed/audit.log` JSONL producer (Phase 4.3 R8.1)
  - R10.2  # state.ts concurrent write lock #BU — `writeCurrentWorkflow` + engineHook activate/complete lockfile protection multi-maintainer prerequisite

files_modified:
  # ===== W0 cadence absorb + sub-batch (4 项 STRICT path-dep T0.1 → T0.2 → T0.3 + T0.4; sister Phase 4.3 W0 cadence延袭) =====
  - .planning/STATE.md                                          # T0.1 D2 cadence iter 5 — trim Phase 4.3 narrative (~-18-25L expected) → RETROSPECTIVE.md § ARCHIVED FROM STATE — Phase 4.3; sister Phase 4.3 W0.1 4th-iter REINFORCE → Phase 5.1 W0 T0.1 5th-iter terminus (5-recurrence terminus heuristic confirmed pattern stable)
  - .planning/RETROSPECTIVE.md                                  # T0.1 — receive Phase 4.3 narrative section (verbatim relocate); ALSO W2 T2.7 Phase 5.1 milestone retrospective append (NOT milestone close; v0.5.0 milestone close 留 Phase 5.3)
  - scripts/check-state-archive-stale.mjs                       # T0.2 CONDITIONAL D1 SIZE_LIMIT 175→? round 3 decision: IF post-T0.1 STATE ≤150L → tighten 175→150 (15L headroom carry-forward decision tree per CONTEXT #BA) / 151-160L → DEFER #BA Phase 5.2+ (4th DEFER signal terminus reassess) / >160L → BLOCKED escalate W0.1 trim sufficiency investigation
  # ===== W0 sub-batch absorb (#BF + #BG; sister #BQ planner Wave B discretion per Phase 4.3 cadence) =====
  - src/installers/lib/runClaudeArgs.ts                         # T0.3 NEW ~25-35L (sub-batch #BF MED) — extract `function runArgs(claudeArgs, cwd, timeoutMs=15_000): Promise<ProcResult>` identical 3-installer duplicate (mcpStdioAdd.ts L40 + mcpHttpAdd.ts L47 + ccPluginMarketplace.ts L49); Win cmd.exe /c claude.cmd shim + Unix spawn direct binary; export ProcResult interface
  - src/installers/lib/err.ts                                   # T0.3 NEW ~8-15L (sub-batch #BG MED) — extract `function err(ctx, path, message, keyword): InstallError` identical 7-installer duplicate (ccHookAdd.ts L18 + ccPluginMarketplace.ts L40 + gitCloneWithSetup.ts L43 + mcpHttpAdd.ts L38 + mcpStdioAdd.ts L31 + npmCli.ts L35 + npxSkillInstaller.ts L49 — RESEARCH § 4 confirmed 7 NOT 8 sister review verbatim correction); import InstallError + InstallContext types from existing shared location
  - src/installers/mcpStdioAdd.ts                               # T0.3 MODIFY ~-15L net — remove local runArgs + err fns; import from ./lib/runClaudeArgs.js + ./lib/err.js
  - src/installers/mcpHttpAdd.ts                                # T0.3 MODIFY ~-15L net — remove local runArgs + err fns; import from ./lib/
  - src/installers/ccPluginMarketplace.ts                       # T0.3 MODIFY ~-15L net — remove local runArgs + err fns; import from ./lib/
  - src/installers/ccHookAdd.ts                                 # T0.3 MODIFY ~-5L net — remove local err fn; import from ./lib/err.js
  - src/installers/gitCloneWithSetup.ts                         # T0.3 MODIFY ~-5L net — remove local err fn
  - src/installers/npmCli.ts                                    # T0.3 MODIFY ~-5L net — remove local err fn
  - src/installers/npxSkillInstaller.ts                         # T0.3 MODIFY ~-5L net — remove local err fn

  # ===== W1 R10.1 audit-log consumer NEW (7 项 — Phase 5.1 architectural anchor #1) =====
  - src/cli/audit-log.ts                                        # T1.1 NEW ~140-160L (≤200L Karpathy PASS with 40-60L headroom per PATTERNS § Karpathy table) — Phase 5.1 R10.1 D-01 jq subprocess + D-02 dual format + D-03 3-flag MVP + D-04 2-layer redact 5 patterns; sister src/cli/doctor.ts 210L register pattern延袭; exports `registerAuditLog(program: Command): void` 13th subcommand top-level `harnessed audit-log` (NOT nested under audit per CONTEXT § Open Q + sister naming separate semantic domain manifest yaml audit ≠ routing audit log)
  - tests/cli/audit-log.test.ts                                 # T1.2 NEW ~120-150L (≤200L PASS) — TDD RED-GREEN-REFACTOR per CLAUDE.md "核心业务逻辑/算法/高可靠性场景强制 TDD" (5-pattern redact security boundary core logic + jq pipe smoke); sister tests/cli/doctor.test.ts 149L ExitError + runCli helper pattern延袭 100% reuse; 7+ fixture cells per PATTERNS § cell pattern (1) no audit.log → exit 0 empty / (2) 3 records human table 5-col / (3) --filter '.category=="engineering"' jq spawn / (4) --json full 12-field / (5) redact api_key= → [REDACTED] / (6) redact Authorization: Bearer → [REDACTED] / (7) --tail 2 limits + redact-pattern-coverage 8+ cell for sk-/pk-/gh_/ghp_/ya29./AIza key prefixes
  - src/cli.ts                                                  # T1.3 MODIFY ~+2L — add `import { registerAuditLog } from './cli/audit-log.js'` (alphabetical insert) + `registerAuditLog(program)` 13th register call after registerAudit (sister L34 register pattern延袭)
  - .planning/phase-5.1/DOGFOOD-T1.X.md                         # T1.4 NEW ~30-40L W1 R10.1 mid-wave empirical evidence (sister Phase 4.3 DOGFOOD-T2.X.md 60L format adapted W1 scope only — final 3-axis DOGFOOD in W2): (A) audit-log.ts ≤200L Karpathy verify + tests/cli/audit-log.test.ts ≥7 cells pass (B) jq subprocess smoke manual run `harnessed audit-log --filter '.outcome=="complete"' --tail 5` exit 0 (C) redact verify all 5 patterns map to [REDACTED] in output

  # ===== W2 R10.2 state lock + ADR 0021 + ci.yml A7 + milestone artifacts (11 项 — Phase 5.1 architectural anchor #2 + ship cadence) =====
  - package.json                                                # T2.1 MODIFY ~+1L `dependencies` — add `"proper-lockfile": "^4.1.2"` (D-05 LOCKED runtime dep NOT devDependencies per CONTEXT § Open Q + RESEARCH § 3.1); alphabetical insert between picocolors + yaml
  - pnpm-lock.yaml                                              # T2.1 MODIFY — auto-regenerate via `pnpm install` (NO manual edit; commit lockfile per project convention)
  - src/checkpoint/state.ts                                     # T2.2 MODIFY ~+30L (post 77L→100-120L ≤200L PASS) — add LockHeldError class extend Error + module-level `withLock<T>(fn): Promise<T>` helper per RESEARCH § 3.2 + PATTERNS § state.ts target; `lockfile.lock('.harnessed', { stale: 10_000, retries: { retries: 3, factor: 2, minTimeout: 100 }, lockfilePath: '.harnessed/.lock' })` D-05+D-06+D-08 LOCKED; release() in finally; `code === 'ELOCKED'` catch → throw LockHeldError actionable hint "another harnessed process holds the lock at .harnessed/.lock — wait or kill stale process (try: harnessed status)" per D-06; PRESERVE writeCurrentWorkflow body wrapped in withLock; export withLock + LockHeldError for engineHook.ts consumption
  - src/checkpoint/engineHook.ts                                # T2.3 MODIFY ~+2-5L (48L→~50-55L ≤200L PASS) — engineHook-level lock acquire ONLY (NOT both engineHook + writeCurrentWorkflow to avoid double-lock deadlock per RESEARCH § 3.3 + Pitfall 1); decision: lock at engineHook level (compound op) — writeCurrentWorkflow self-lock pattern OK because engineHook serializes through it transitively; verify NO direct writeCurrentWorkflow callers outside engineHook.ts per RESEARCH § A4 ASSUMPTION (grep src/ for direct call); if direct callers exist (resume.ts likely), wrap at engineHook level + drop inner lock in state.ts via reentrant guard OR lock at one level (chose engineHook per RESEARCH § 7 Q1)
  - tests/checkpoint/state-lock.test.ts                         # T2.4 NEW ~80-100L (≤200L PASS) — TDD RED-GREEN-REFACTOR R10.2 lock core logic (sister CLAUDE.md core algorithm 强制 TDD); sister tests/checkpoint/state.test.ts 98L vi.mock node:fs/promises pattern延袭; vi.mock proper-lockfile { lock: vi.fn() } returns release fn; 4-5 cells: (1) serial sequential writes complete (2) concurrent two activate() calls — second waits for first via lock mock setTimeout 50ms simulate (3) lock rejected with 'Lock file is already being held' → LockHeldError thrown with actionable message containing "another harnessed process holds the lock" + "harnessed status" hint (4) release() called in finally even on throw (5) cross-OS Win+Linux+macOS CI green Day 1 verify (CI matrix not test-internal)
  - src/cli/status.ts                                           # T2.5 MODIFY ~+20-25L (31L→~55-60L ≤200L PASS) — D-07 LOCKED display lock holder; sister PATTERNS § status.ts pattern — `import lockfile from 'proper-lockfile'` + `await lockfile.check('.harnessed', { lockfilePath: '.harnessed/.lock', stale: 10_000 })`; IF held → stat('.harnessed/.lock') mtime → console.log("lock: held (since <ISO>) — stale after 10s" + hint "to release: wait for process or delete .harnessed/.lock"); IF stale (mtime > 10s ago) → log "STALE" suffix; PID display via reading `.harnessed/.lock/pid` if exists (RESEARCH § 1 D-07 note — write process.pid post-acquire optional; PID write-after-acquire = 1 line in withLock); silent on missing lock dir (try-catch)
  - docs/adr/0021-state-lock-and-audit-consumer.md              # T2.6 NEW ~120-160L PRIMARY ADR 9-section format sister docs/adr/0018-routing-audit-log.md 218L 100% reuse adapted: Status (Accepted phase 5.1 W1/W2 — 2026-05-20) + Context (R10.1 gap Phase 4.3 R8.1 consumer half-complete + R10.2 #BU 4th-cycle carry concurrent race + single→multi maintainer recruit window prerequisite) + Decisions (8 D-decisions § 1-8 verbatim D-01 jq subprocess + D-02 dual format + D-03 3-flag MVP + D-04 2-layer redact 5 patterns + D-05 proper-lockfile@4.1.2 + D-06 bounded retry 3×100ms exp backoff + D-07 NO --force + status display + D-08 dir-level .harnessed/.lock) + A7 Conservation (ADR 0001-0020 main body 0 diff verified; ci.yml A7 iter 0018→0021 RETROACTIVE FIX 0019+0020 RESEARCH § 5 critical finding) + Consequences (R10.1 100% R8.1 acceptance fulfilled + R10.2 race eliminated v1.0 GA co-maintainer prerequisite + proper-lockfile supply-chain surface +1 dep mitigated by pnpm audit + dir-level coarse granularity op-level defer v0.6+) + Compliance (R10.1 + R10.2 acceptance verbatim cite) + Errata-path (frozen Phase 5.1; v0.6+ ADR 0022+) + Adoption-confirmation (Phase 5.1 ship evidence DOGFOOD 3/3) + References (CONTEXT D-01-08 + sister ADR 0018 producer + ADR 0019/0020 backfill cross-ref + sister Win corepack ACL educational link)
  - docs/adr/README.md                                          # T2.7 MODIFY ~+1 row — append `| [0021](./0021-state-lock-and-audit-consumer.md) | Phase 5.1 — R10.2 state.ts concurrent write lock (proper-lockfile) + R10.1 audit log --filter CLI consumer | Accepted | 2026-05-20 |` after ADR 0020 entry (sister Phase 3.4 ADR 0017 single-add cadence延袭)
  - .github/workflows/ci.yml                                    # T2.8 MODIFY **CRITICAL RETROACTIVE FIX** per RESEARCH § 5 + § Pitfall 6 — A7 step iter 0018 → 0018 0019 0020 0021 (4 surgical edits): Line 82 step name `ADR 0001-0018 main body 守恒` → `ADR 0001-0021 main body 守恒` + Line 85 first for loop append `0019 0020 0021` after `0018` + Line 96 second for loop append same + Line 107 echo `A7 ✅ ADR 0001-0018` → `ADR 0001-0021`; **STRICT ordering**: ci.yml commit + push BEFORE adr-0021-accepted tag creation per STRIDE D mitigation; ADDRESSES Phase 4.3 W2 T2.4 ship gap (only iterated 0017→0018; ADR 0019+0020 backfilled but NOT protected by A7 gate) — Phase 5.1 retroactively closes the gap
  - CHANGELOG.md                                                # T2.9 MODIFY ~+8-12L — add `## [0.5.0-alpha.1] - 2026-05-20` section + `### Added` (R10.1 audit log --filter consumer CLI subcommand + R10.2 concurrent write lock proper-lockfile + ADR 0021 + W0 sub-batch installers/lib/{runClaudeArgs,err}.ts dedup) + `### Changed` (ci.yml A7 step ADR 0001-0018 → 0001-0021 RETROACTIVE FIX 0019+0020) + Keep-a-Changelog format sister Phase 4.3 W2 T2.5 cadence延袭; root-level CHANGELOG.md NOT docs/CHANGELOG.md
  - .planning/STATE.md                                          # T2.10 (ALREADY listed above for T0.1 trim) — ALSO Phase 5.1 SHIPPED 续编 + 当前位置 update + v0.5.0 milestone 1/3 PROGRESS marker (NOT close — v0.5.0 close 留 Phase 5.3) + 进度 17/20 → 18/20 90%
  - .planning/RETROSPECTIVE.md                                  # T2.11 (ALREADY listed above for T0.1 archive) — ALSO append Phase 5.1 milestone retrospective 7-section sister Phase 4.3 W2 T2.7 format 100% reuse (NOT cross-milestone — v0.5.0 cross-milestone close section 留 Phase 5.3)
  - .planning/ROADMAP.md                                        # T2.12 MODIFY — Phase 5.1 ✅ SHIPPED literal cadence延袭 (sister L130 v0.3.0 + L185 v0.4.0 SHIPPED literal cadence); v0.5.0 transitions 0/3 STARTING → 1/3 PROGRESS
  - PROJECT-SPEC.md                                             # T2.13 MODIFY — L3 Status header add Phase 5.1 SHIPPED literal (sister Phase 4.3 W2 T2.9 FRONT_MATTER_DOCS transparency gate pattern延袭)
  - README.md                                                   # T2.14 MODIFY — L9 Status freshness Phase 5.1 SHIPPED + Phase 5.1 row append shipped phase list
  - .planning/phase-5.1/DOGFOOD-T2.X.md                         # T2.15 NEW ~60-70L 3-axis empirical evidence sister Phase 4.3 DOGFOOD-T2.X.md 60L format 100% reuse: (A) R10.1 audit-log.ts ≤200L Karpathy + 7+ cells TDD pass + manual `harnessed audit-log --filter '.category=="engineering"' --tail 10` exit 0 + redact 5 patterns verify in output (B) R10.2 state.ts ≤120L + tests/checkpoint/state-lock.test.ts 4-5 cells pass + 2-process concurrent simulation LockHeldError after 3 retries (~700ms) verify + status.ts lock holder display verify (C) ADR 0021 + ci.yml A7 iter 0018→0021 grep both for loops contain `0019 0020 0021` + 0001-0020 main body 0 diff `git diff docs/adr/000[1-9]-*.md docs/adr/001[0-9]-*.md docs/adr/0020-*.md | wc -l` == 0 + CHANGELOG.md v0.5.0-alpha.1 entry + W0 sub-batch installers/lib/ extract verify 3+7=10 import line changes
  # ===== W2 tag creation (LOCAL CREATE per CLAUDE.md commit safety; user controls all push) =====
  # NOTE: Tags NOT files but listed for completeness; W2 T2.16 dual-tag LOCAL CREATE adr-0021-accepted + v0.5.0-alpha.1-audit-lock (NOT 🎯 v0.5.0 milestone tag — v0.5.0 milestone close 留 Phase 5.3 per ROADMAP v0.5.0 3-phase split L266-277); ALSO RETROACTIVE LOCAL CREATE adr-0019-accepted + adr-0020-accepted (Phase 4.3 ship gap retroactive fix per CONTEXT critical finding)

threats_open:
  # STRIDE per RESEARCH § 6 (R-1 ESM compat + R-2 jq Win + R-3 lock scope + R-4 audit-log.ts 200L + R-5 A7 retroactive) + Phase 5.1 specific
  - threat: audit.log read — same path traversal threat as Phase 4.3 producer (task content `..\` escape)
    stride: T  # Tampering
    mitigation: Consumer reads HARDCODED `AUDIT_PATH = '.harnessed/audit.log'` literal (NOT derived from task input); same producer-side defense applied to consumer-side read; planner T1.1 acceptance grep `const AUDIT_PATH = '.harnessed/audit.log'` exact match + no `path.join(AUDIT_PATH, ...)` derivation
  - threat: jq subprocess command injection — attacker crafts --filter expr containing shell metachar `; rm -rf /` to escape jq context
    stride: T  # Tampering / E  # EoP
    mitigation: `spawn('jq', [filterExpr], { stdio: ['pipe', 'pipe', 'pipe'] })` NO shell:true (default false per Node spawn docs); filterExpr passed as argv array element NOT concatenated into shell string — Node.js spawn argv mode immune to shell escape (verified RESEARCH § 1 D-01); planner T1.1 acceptance grep `spawn\(.jq.,` + NO `shell:\s*true` in audit-log.ts
  - threat: redact regex bypass — attacker concatenates secret with non-matching prefix (e.g. `mykey=sk-VALUE`) to evade pattern
    stride: I  # Info Disclosure
    mitigation: 5 patterns cover api_key=/token=/password=/Authorization Bearer/key prefixes (sk-/pk-/gh_/ghp_/ya29./AIza); D-04 LOCKED defense-in-depth = consumer 2nd-layer (producer Phase 4.3 1st-layer); residual surface = uncommon secret formats (custom prefix); tests/cli/audit-log.test.ts MUST include 5-pattern coverage matrix per RESEARCH § 1 D-04 + 1 clean-text-passthrough verify; ACCEPTED residual risk LOW (single-maintainer dogfood; multi-user 留 v0.6+ if signal)
  - threat: redact applied AFTER jq filter — jq output containing parsed-extract secret value (e.g. `.task_excerpt | sub("api_key=", "k=")`) bypasses pre-jq redact
    stride: I  # Info Disclosure
    mitigation: Redact applied LAST in pipeline (paginate → jq → redact → render) per RESEARCH § 2.2 + Pitfall 3; even if jq strips redact-trigger context, redact regex re-scans output; planner T1.1 acceptance verify `redact(output)` called AFTER `pipeToJq()` resolves
  - threat: proper-lockfile ESM/CJS compat with `"type":"module"` tsup build — default import fails at runtime
    stride: D  # Denial of Service (CLI startup crash)
    mitigation: RESEARCH § A1 [ASSUMED] — Wave 1 build verify step required; fallback `createRequire(import.meta.url)('proper-lockfile')` ~5L wrapper if default import fails; planner T2.1 acceptance `pnpm build` exit 0 + `node dist/cli.js audit-log --help` exit 0 (smoke import test)
  - threat: jq absent on Windows CI runner — R10.1 tests fail Win matrix per RESEARCH § A5 + R-2
    stride: D  # Denial of Service (CI Win matrix red)
    mitigation: 2 paths — (a) add CI step `if: runner.os == 'Windows'` `winget install jqlang.jq` OR `choco install jq` before pnpm test (sister Win corepack ACL workaround precedent); (b) tests use spawnSync mock NOT real jq invocation (PATTERNS § cell pattern vi.mock node:child_process) — preferred per RESEARCH § A5; planner T1.2 acceptance vi.mock spawn so jq absence doesn't fail tests
  - threat: lock holder pid spoofing — attacker writes fake `.harnessed/.lock/pid` file with arbitrary PID
    stride: R  # Repudiation
    mitigation: D-07 status display is INFORMATIONAL only (not security-critical); attacker controlling `.harnessed/` already controls entire workflow state (higher-privilege attack surface); .harnessed/.lock atomic mkdir prevents single-process race but does NOT prevent already-escalated attacker; ACCEPTED — proper-lockfile threat model assumes filesystem trust
  - threat: A7 retroactive iter — ADR 0019+0020 main body diff between Phase 4.3 ship and Phase 5.1 A7 iter (history shifted underneath the gate)
    stride: T  # Tampering (CI gate integrity)
    mitigation: **CRITICAL** Wave 2 T2.8 BEFORE iter, MUST verify `git diff $(git log --diff-filter=A --pretty=format:"%H" -- docs/adr/0019-*.md docs/adr/0020-*.md | tail -1)..HEAD -- docs/adr/0019-*.md docs/adr/0020-*.md | wc -l` == 0 (initial commit → HEAD diff zero); if non-zero → investigate before iter (sister Phase 4.3 W2 T2.4 acceptance bar); ALSO LOCAL CREATE retroactive baseline tags `adr-0019-accepted` + `adr-0020-accepted` pinned to initial-commit hash NOT HEAD (per Phase 4.3 ship intent reconstruction)
  - threat: A7 iter ordering — `adr-0021-accepted` tag pushed BEFORE ci.yml A7 step iter → A7 gate fails next CI run
    stride: D  # DoS (workflow block)
    mitigation: STRICT ordering per RESEARCH § 5 + sister Phase 4.3 T2.4 pattern; W2 task ordering enforces T2.8 (ci.yml A7 iter commit + push) → T2.16 (triple tag LOCAL CREATE); planner T2.16 acceptance verify `git log .github/workflows/ci.yml` shows commit timestamp < tag annotation timestamp
  - threat: triple tag premature push (user attempts push BEFORE Phase 5.1 ship + DOGFOOD verify)
    stride: R  # Repudiation (audit trail integrity)
    mitigation: CLAUDE.md commit safety NEVER push without user explicit approval (sister Phase 4.3 LOCAL CREATE 待 push 模式延袭); W2 T2.16 LOCAL CREATE only `git tag -a` (NO `git push --tags`); planner T2.16 acceptance `git ls-remote origin refs/tags/v0.5.0-alpha.1-audit-lock` returns empty (verify NO push)

must_haves:
  # ===== 8 D-decisions + M-01 verbatim (CONTEXT 5.1-CONTEXT.md L28-115 LOCKED — 0 sneak tolerance) =====
  decisions:
    - id: D-01
      lock: FilterSyntax jq pipe 内嵌 invocation — `spawn('jq', [filterExpr], { stdio: ['pipe', 'pipe', 'pipe'] })` async
      sneak-block: |
        planner / executor MUST NOT add jsonpath-plus / JSONPath npm dep (~30KB维护负担 + Python familiar non-fit harnessed TS/JS 受众)
        planner / executor MUST NOT self-roll DSL parser (表达力弱OR/AND/range缺 + Karpathy YAGNI violate)
        planner / executor MUST NOT do raw JSONL + 用户自 pipe `harnessed audit | jq` (UX 差 + Win CMD 无 jq 时降级失败)
        planner / executor MUST verify jq present via existing doctor.ts 3rd check pattern delegate (NOT new check); jq absent → console.error('jq not found — run: harnessed doctor') + process.exit(1)
        planner / executor MUST use `shell:false` (default) — Node spawn argv mode immune to shell escape; STRIDE T mitigation
    - id: D-02
      lock: OutputFormat dual format default human table 5 cols (ts/phase/category/matched_rule_id/outcome) + --json flag opt-in 12-field
      sneak-block: |
        planner / executor MUST NOT default --json (UX 弱 12 字段 wall of text)
        planner / executor MUST NOT default --table only (pipe-unfriendly 工业标准 violate)
        planner / executor MUST NOT add cli-table3 npm dep (Karpathy YAGNI; doctor.ts 已用 manual padEnd alignment 类比延袭)
        Human table 5 cols width: ts(24) phase(10) category(14) matched_rule_id(22) outcome(12); `padEnd` zero-dep manual align per RESEARCH § 1 D-02
    - id: D-03
      lock: PaginationFlags minimal MVP 3 flag --tail N (default 50) + --head N + --reverse
      sneak-block: |
        planner / executor MUST NOT add --since <ISO> / --until <ISO> / --sort <field> (over-engineering Phase 5.1 YAGNI; defer v0.6+ if signal)
        planner / executor MUST NOT do无 pagination全输出 (UX 弱 audit.log长期生长 thousands of records)
        Flag conflict: --tail + --head 同时 → --head 优先 (RESEARCH § 1 D-03; document in help text)
        Pagination order: filter (jq) FIRST → paginate AFTER for UX correctness (filter then take last 50 matching; RESEARCH § 7 Q3)
    - id: D-04
      lock: SecurityRedact consumer 2重 redact 5 patterns regex match + replace `[REDACTED]` (defense-in-depth CSO defense)
      sneak-block: |
        planner / executor MUST NOT rely仅 producer (Phase 4.3 src/audit/log.ts; coverage unverified spec 未 verbatim 要求sanitize → risk gap)
        planner / executor MUST NOT defer redact 到 Phase 5.2 (audit log = security boundary; CSO Paranoid Staff Eng veto-or-accept gate 不批准延迟)
        planner / executor MUST NOT FIX-FORWARD producer Phase 4.3 (scope creep risk > 1-day target window; producer verify-only NOT fix-forward)
        5 patterns exact (RESEARCH § 1 D-04 + PATTERNS § audit-log.ts):
          1. `/api[_-]?key\s*[:=]\s*\S+/gi` → 'api_key=[REDACTED]'
          2. `/\btoken\s*[:=]\s*\S+/gi` → 'token=[REDACTED]'
          3. `/\bpassword\s*[:=]\s*\S+/gi` → 'password=[REDACTED]'
          4. `/Authorization:\s*Bearer\s+\S+/gi` → 'Authorization: Bearer [REDACTED]'
          5. `/\b(sk-|pk-|gh_|ghp_|ya29\.|AIza)[A-Za-z0-9_\-]{6,}/g` → '[REDACTED]' (key prefixes)
        Pre-compile at module load (NOT inside loop); apply to `task_excerpt` field only (other 11 fields structured IDs/enums/timestamps); apply LAST in pipeline (paginate → jq → redact → render) per RESEARCH § 2.2 + Pitfall 3
        TDD red-green-refactor REQUIRED (sister CLAUDE.md "核心业务逻辑/算法/高可靠性场景强制 TDD"); 7-cell fixture coverage matrix tests/cli/audit-log.test.ts cells 5-7 + supplemental 8 for key-prefix pattern
    - id: D-05
      lock: LockImpl proper-lockfile@^4.1.2 npm dep (runtime NOT devDep) — `lockfile.lock('.harnessed', { lockfilePath: '.harnessed/.lock', stale: 10_000, retries: { retries: 3, factor: 2, minTimeout: 100 } })`
      sneak-block: |
        planner / executor MUST NOT self-roll `fs.open(wx)` exclusive create + retry (race window minimal but exists + cleanup process crash leftover lock file 手处理 footgun)
        planner / executor MUST NOT use OS flock (Win 不支持 — cross-OS Day 1 ci.yml gate 强制)
        planner / executor MUST NOT defer Phase 5.2+ (sister 4th-cycle BB path 已 lock 4 项 carry-forward; Phase 5.1 必须兑现 R10.2 推 v1.0 GA)
        planner / executor MUST add to `dependencies` NOT `devDependencies` (runtime CLI path: writeCurrentWorkflow + activatePhase + completePhase) per CONTEXT § Open Q
        ESM compat verify Wave 1 build (RESEARCH § A1): `pnpm build` exit 0 + `node dist/cli.js audit-log --help` smoke import; if default import fails → createRequire(import.meta.url) wrapper ~5L
        lockfilePath option `.harnessed/.lock` places lock inside gitignored .harnessed/ dir per RESEARCH § 1 D-05 + § 7 Q6; NOT default `.harnessed.lock` adjacent
    - id: D-06
      lock: RetryPolicy bounded { retries: 3, factor: 2, minTimeout: 100 } ~700ms total (100+200+400) → throw LockHeldError actionable hint
      sneak-block: |
        planner / executor MUST NOT do unbounded retry wait forever (死锁风险 leftover lock)
        planner / executor MUST NOT fail-fast NO retry throw immediately (UX 弱 transient lock window 立即 fail)
        LockHeldError message verbatim: `"another harnessed process holds the lock at .harnessed/.lock — wait or kill stale process (try: harnessed status)"` per CONTEXT D-06 L90
        Object.setPrototypeOf for TS class extend Error (per RESEARCH § 1 D-06 L245); name property 'LockHeldError'
        catch `code === 'ELOCKED'` re-throw as LockHeldError; other errors re-throw unchanged per RESEARCH § 3.2
    - id: D-07
      lock: ForceFlag NO --force + harnessed status displays lock holder pid + timestamp + stale auto-detect
      sneak-block: |
        planner / executor MUST NOT provide --force flag bypass lock (race condition risk: lock 被真活着 process 持有 --force 会损坏 state)
        planner / executor MUST NOT do用户必须kill stale process (--force 缺失 + status display + stale auto-detect = 完整 UX 但无危险)
        Stale auto-detect via proper-lockfile 10s stale option (D-05); status.ts displays `since <ISO>` from stat('.harnessed/.lock').mtime + 'STALE' suffix if mtime > 10s ago per RESEARCH § 3.4 + PATTERNS § status.ts
        PID display optional — recommend write `.harnessed/.lock/pid` post-acquire 1-line in withLock (RESEARCH § 1 D-07); status reads PID file if exists; YAGNI-acceptable defer if Wave 2 tight per RESEARCH § 3.4 recommended-for-YAGNI
    - id: D-08
      lock: LockScope dir-level lock `.harnessed/.lock` via lockfilePath option (protects entire .harnessed/* writes)
      sneak-block: |
        planner / executor MUST NOT use single-file lock current-workflow.json (engineHook write其他 checkpoint files仍 race — 不足)
        planner / executor MUST NOT use operation-level lock 7 fn 各锁自己 (Karpathy YAGNI 5x 复杂度 + Phase 5.1 NEW infra 不需)
        planner / executor MUST NOT use process-level lock (harnessed status + resume 不能并行 UX 太强)
        Lock site placement: engineHook level only (NOT both engineHook + writeCurrentWorkflow → double-lock deadlock per RESEARCH § 3.3 + Pitfall 1)
        writeCurrentWorkflow self-locks (called transitively by engineHook); state.ts withLock helper exported; engineHook imports + uses (compound op serialized through transitive call chain)
        Refine deferred v0.6+ if signal — op-level lock if NEW concurrent read pattern triggers contention measurement per CONTEXT D-08 L114

  # ===== M-01 meta-decision verbatim (CONTEXT L18-25 LOCKED — 0 sneak tolerance) =====
  meta_decisions:
    - id: M-01
      lock: PhaseClass ARCHITECTURAL (NOT R-5 publish-only sister Phase 4.1+4.2 mode); full ship cadence ADR 0021 + ci.yml A7 step iter 0018→0021 + triple tag (sister v0.4.0 Phase 4.3 close cadence延袭)
      sneak-block: |
        planner / executor MUST NOT treat Phase 5.1 as R-5 publish-only; NEW src/cli/audit-log.ts + NEW dep proper-lockfile + MODIFY src/checkpoint/state.ts = architectural change
        Full ship cadence applies: ADR 0021 PRIMARY + ci.yml A7 step iter 0018→0021 (RETROACTIVE FIX 0019+0020 per RESEARCH § 5 critical finding) + dual tag adr-0021-accepted + v0.5.0-alpha.1-audit-lock (NOT triple tag 🎯 v0.5.0 — v0.5.0 milestone close 留 Phase 5.3 per ROADMAP v0.5.0 3-phase split L266-277)
        Phase 5.1 = 1-of-3 milestone progress NOT close; sister Phase 4.1+4.2 = milestone progress + Phase 4.3 = milestone close; Phase 5.1 = Phase 4.1+4.2 analog progress phase (NOT Phase 4.3 close analog despite ARCHITECTURAL class shared)
        ALSO RETROACTIVE LOCAL CREATE adr-0019-accepted + adr-0020-accepted (Phase 4.3 ship gap retroactive fix — ADR 0019+0020 backfilled Phase 4.3 but baseline tags NEVER pushed per RESEARCH § Pitfall 6 + CONTEXT critical finding)

  # ===== W0 cadence absorb 4 项 (sister Phase 4.3 W0 cadence延袭; #BA round 3 conditional decision tree per CONTEXT L123) =====
  w0_backlog:
    - id: T0.1 (sister M2 D2 cadence iter 5 — terminus verify ≥5-iter sister 5-recurrence terminus heuristic)
      action: trim Phase 4.3 narrative → RETROSPECTIVE.md § ARCHIVED FROM STATE — Phase 4.3 (single-phase archive sister Phase 4.3 W0.1 4th-iter REINFORCE → Phase 5.1 W0 T0.1 5th-iter terminus per sister 5-recurrence terminus heuristic; if patterns confirmed stable at 5-iter, D2 cadence formally institutionalized + reassess if 6th iter Phase 5.2 should continue or graduate to "implicit-standing-process"); HTML-comment archive marker pointer left in STATE.md trim site per sister L42 format
      priority: HIGH
      path-dep: FIRST (reduces STATE.md size — creates T0.2 SIZE_LIMIT flip headroom per CONTEXT #BA decision tree)
    - id: T0.2 (DEFERRED #BA D1 SIZE_LIMIT 175→? round 3 conditional flip per CONTEXT #BA L123 decision tree)
      action: CONDITIONAL — IF post-T0.1 STATE ≤150L → flip 1-line surgical L12 `const SIZE_LIMIT = 175` → `const SIZE_LIMIT = 150` (15L safety headroom; sister Phase 4.3 W0.2 200→175 10L headroom延袭 tighter as more confidence in trim cadence) / 151-160L → DEFER #BA carry-forward Phase 5.2+ W0 LOW priority (4th consecutive DEFER signal terminus — reassess if Phase 5.2 should formally close #BA disposition vs continue defer) / >160L → BLOCKED escalate investigate W0.1 trim sufficiency
      priority: MED conditional
      path-dep: AFTER T0.1 (conditional decision tree per CONTEXT W0 backlog #BA — current STATE ~160L post-Phase-4.3-ship; T0.1 expected -18-25L → ~135-145L → FLIP path likely active)
    - id: T0.3 (sub-batch #BF MED + #BG MED absorb — sister #BQ planner Wave B discretion per Phase 4.3 cadence)
      action: extract installers/lib/{runClaudeArgs,err}.ts NEW + MODIFY 7 installer files (mcpStdioAdd/mcpHttpAdd/ccPluginMarketplace/ccHookAdd/gitCloneWithSetup/npmCli/npxSkillInstaller) replace local fn with import; pure refactor NO behavior change; Biome preempt `pnpm exec biome check --write` MANDATORY pre-commit per project memory `feedback_biome-preempt.md` (3 CI-red recurrences Phase 2.1.1/2.2/2.3 sister precedent); full test suite green gate post-extract verify
      priority: MED carry-forward 4-phase
      path-dep: PARALLEL with T0.1+T0.2 (different files NO conflict; can run same Wave 0 commit batch OR separate atomic commits per `feedback_biome-preempt.md` "small atomic commits" preference)
    - id: T0.4 (Phase 4.3 ship gap retroactive fix — LOCAL CREATE adr-0019-accepted + adr-0020-accepted baseline tags)
      action: `git tag -a adr-0019-accepted <0019-initial-commit-hash> -m "Phase 4.3 W2 T2.1 backfill — STATE dual-SoT COLLAPSE pattern"` + same for adr-0020 — LOCAL CREATE ONLY NEVER PUSH per CLAUDE.md commit safety; pinned to initial-commit hash NOT HEAD (Phase 4.3 ship intent reconstruction); BLOCKER for W2 T2.8 ci.yml A7 iter (gate references both tags via `git rev-parse refs/tags/adr-001N-accepted` lookup; missing tags → warning-skip but breaks intent)
      priority: HIGH (BLOCKER for clean ci.yml A7 iter Wave 2 — sister Phase 4.3 ship gap closure)
      path-dep: BEFORE Wave 2 T2.8 (ordering critical per STRIDE T threat — tags must exist when A7 iter expands 0018→0021)

  # ===== Observable truths (R10.1 + R10.2 goal-backward decomposition; M-01 ARCHITECTURAL full ship cadence — sister Phase 4.3 truths section延袭) =====
  truths:
    # W0 truths (4 cadence + sub-batch)
    - "developer reads `.planning/RETROSPECTIVE.md` and finds `## § ARCHIVED FROM STATE — Phase 4.3 (Phase 5.1 W0 T0.1 D2 cadence iter 5, 2026-05-20)` section containing verbatim relocated Phase 4.3 narrative from STATE.md; HTML-comment archive marker pointer left in STATE.md trim site; D2 standing process fires 5th-iter terminus signal confirms ≥5-iter sister 5-recurrence terminus heuristic — formal institutionalization checkpoint or graduate to implicit standing process Phase 5.2+ disposition"
    - "developer can run `node scripts/check-state-archive-stale.mjs` post-T0.2-flip (IF flip path: SIZE_LIMIT=150 + STATE ≤150L baseline + 15L safety headroom) and gate passes (3 rules: STATE ≤150L + 0 关键决议 ship 总结 sections + 0 W-N errata literals) — OR T0.2 defer path STATE remains ≤175L baseline with SIZE_LIMIT=175 unchanged + DEFERRED #BA carry-forward Phase 5.2+ W0 LOW priority (4th consecutive DEFER per sister Phase 4.1+4.2+4.3 3-iter defer chain — reassess if formal close vs continue defer)"
    - "developer reads `src/installers/lib/runClaudeArgs.ts` (NEW ~25-35L) and finds `export interface ProcResult { exitCode: number; stderr: string }` + `export function runArgs(claudeArgs: string[], cwd: string, timeoutMs = 15_000): Promise<ProcResult>` extracting identical 3-installer body (Win cmd.exe /c claude.cmd shim + Unix spawn direct binary); developer reads `src/installers/lib/err.ts` (NEW ~8-15L) and finds `export function err(ctx: InstallContext, path: string, message: string, keyword: string): InstallError` extracting identical 7-installer body; developer reads 7 installer files (mcpStdioAdd/mcpHttpAdd/ccPluginMarketplace/ccHookAdd/gitCloneWithSetup/npmCli/npxSkillInstaller) and confirms local `function runArgs`/`function err` DELETED + replaced with `import` from './lib/' (3 imports for runArgs + 7 imports for err = 10 import line changes total); Biome preempt verified `pnpm exec biome check --write src/installers/` exit 0; full test suite `pnpm test --run` green NO regression"
    - "developer runs `git tag -l adr-0019-accepted adr-0020-accepted` and sees both tags LOCAL CREATE present (pinned to initial-commit hash of docs/adr/0019-*.md + docs/adr/0020-*.md per Phase 4.3 ship intent reconstruction); developer runs `git ls-remote origin refs/tags/adr-0019-accepted` returns empty (NO push per CLAUDE.md commit safety); BLOCKER for W2 T2.8 ci.yml A7 iter expansion 0018→0021 cleared"

    # W1 R10.1 audit-log consumer truths (4 main scope artifacts — Phase 5.1 ARCHITECTURAL anchor #1)
    - "developer reads `src/cli/audit-log.ts` (NEW ~140-160L ≤200L Karpathy PASS) and finds: (a) `import { spawn } from 'node:child_process'` + `import { readFileSync, existsSync } from 'node:fs'` + `import type { Command } from 'commander'` + `import type { AuditRecord } from '../audit/log.js'` (re-use Phase 4.3 producer schema); (b) `const AUDIT_PATH = '.harnessed/audit.log'` hardcoded literal (STRIDE T mitigation per <threats_open>); (c) `const DEFAULT_TAIL = 50` per D-03; (d) module-level pre-compiled REDACT_PATTERNS Array<[RegExp,string]> 5 patterns exact per D-04 LOCKED L82-86; (e) `function redact(text: string): string` reduce REDACT_PATTERNS replace; (f) `function readLines(): string[]` readFileSync split '\\n' empty-array on ENOENT; (g) `function paginate(lines, opts: {tail?,head?})` non-empty filter + tail/head/reverse slice per D-03 LOCKED + flag conflict --head precedence; (h) `function parseRecord(line)` JSON.parse try-catch null on fail; (i) `function renderTable(records)` 5-col manual padEnd width [24,10,14,22,12] human format per D-02 LOCKED zero-dep NO cli-table3; (j) `function pipeToJq(jsonl, filter): Promise<string>` async spawn('jq', ['-c', filter], stdio:['pipe','pipe','pipe']) write stdin + collect stdout + close-event resolve/reject; shell:false default verify per D-01 STRIDE mitigation; (k) `export function registerAuditLog(program: Command): void` 13th subcommand top-level `audit-log` (NOT nested) per CONTEXT § Open Q + naming separate semantic; flags --filter <expr> + --tail <n> default 50 + --head <n> + --reverse + --json; .action(async opts => pipeline read → paginate → jq? → redact → render); jq absent → console.error('jq not found — run: harnessed doctor') + process.exit(1); ENOENT → console.error('no audit log at .harnessed/audit.log — run harnessed first') + process.exit(0); empty → console.log('no records') + exit(0); (l) `wc -l src/cli/audit-log.ts` ≤ 200 Karpathy hard limit per CLAUDE.md key reminder #4"
    - "developer reads `tests/cli/audit-log.test.ts` (NEW ~120-150L ≤200L PASS) and finds: (a) TDD red-green-refactor structure per CLAUDE.md `核心业务逻辑/算法/高可靠性场景强制 TDD` (5-pattern redact security boundary + jq pipe smoke); (b) `vi.mock('node:child_process', () => ({ spawn: vi.fn(), spawnSync: vi.fn() }))` + `vi.mock('node:fs', () => ({ existsSync: vi.fn(), readFileSync: vi.fn() }))` sister tests/cli/doctor.test.ts pattern延袭; (c) `class ExitError extends Error { constructor(public code: number) }` + `async function runCli(argv: string[]): Promise<{ code, stdout, stderr }>` helper per PATTERNS § 2.4 100% reuse; (d) 8+ fixture cells: cell 1 no audit.log → exit 0 + 'no audit log' message / cell 2 3 records no filter → human table 5-col with padEnd alignment / cell 3 --filter '.category==\"engineering\"' → spawn jq with ['-c', filter] argv array shell:false / cell 4 --json → full 12-field JSON output / cell 5 redact api_key=abc123 → [REDACTED] / cell 6 redact Authorization: Bearer eyJhbGc → [REDACTED] / cell 7 redact sk-1234567890abcdef + ghp_aBcDeFgHiJkL1234 → [REDACTED] (key-prefix pattern coverage) / cell 8 --tail 2 → only 2 records + redact still applied last + clean-text-passthrough unchanged; (e) `corepack pnpm test -- tests/cli/audit-log.test.ts --run` exit 0 8/8 fixtures pass"
    - "developer reads `src/cli.ts` (MODIFY) and finds: (a) `import { registerAuditLog } from './cli/audit-log.js'` alphabetical insert; (b) `registerAuditLog(program)` 13th register call after registerAudit line (sister L34 register pattern延袭); (c) `wc -l src/cli.ts` ~43L ≤200L Karpathy PASS"
    - "developer reads `.planning/phase-5.1/DOGFOOD-T1.X.md` (NEW ~30-40L W1 mid-wave evidence sister Phase 4.3 DOGFOOD-T2.X.md adapt W1 scope) and finds 3-axis verify: (A) audit-log.ts ≤200L Karpathy + tests/cli/audit-log.test.ts ≥8 cells pass (B) manual smoke `harnessed audit-log --filter '.outcome==\"complete\"' --tail 5` exit 0 output 5 records JSON-pretty-printable via stdout pipe (C) redact verify all 5 patterns map to [REDACTED] in output — task.task with `api_key=test123` + `Authorization: Bearer eyTOKEN` + `sk-PROD1234567890ab` all redacted in render"

    # W2 R10.2 state lock truths (3 main scope artifacts — Phase 5.1 ARCHITECTURAL anchor #2)
    - "developer reads `package.json` (MODIFY) and finds: (a) `dependencies` block contains `\"proper-lockfile\": \"^4.1.2\"` alphabetical between picocolors + yaml; (b) `pnpm-lock.yaml` updated via `pnpm install` auto-regenerate (committed); (c) `node -e \"console.log(Object.keys(require('proper-lockfile')))\"` exit 0 OR ESM `import('proper-lockfile').then(m => console.log(Object.keys(m)))` exit 0 — verify ESM/CJS compat at runtime per RESEARCH § A1 ASSUMPTION; (d) `pnpm build` + `node dist/cli.js audit-log --help` smoke import test exit 0"
    - "developer reads `src/checkpoint/state.ts` (MODIFY ~77L→100-120L ≤200L PASS) and finds: (a) `import lockfile from 'proper-lockfile'` (or createRequire wrapper if ESM fails); (b) `export class LockHeldError extends Error` with verbatim message per D-06 LOCKED + Object.setPrototypeOf for TS class extend Error + name='LockHeldError'; (c) `const LOCK_OPTS = { stale: 10_000, retries: { retries: 3, factor: 2, minTimeout: 100 }, lockfilePath: '.harnessed/.lock' }` per D-05+D-06+D-08 LOCKED; (d) `export async function withLock<T>(fn: () => Promise<T>): Promise<T>` — `await mkdir('.harnessed', { recursive: true })` ensure dir before lock + `release = await lockfile.lock('.harnessed', LOCK_OPTS)` + try/finally release() + catch `code === 'ELOCKED'` throw LockHeldError other re-throw; (e) `writeCurrentWorkflow` body wrapped: validate → mkdir parent → withLock(async () => writeFile JSON content); (f) `wc -l src/checkpoint/state.ts` ≤ 200 Karpathy hard limit"
    - "developer reads `src/checkpoint/engineHook.ts` (MODIFY ~48L→50-55L ≤200L PASS) and finds: (a) engineHook-level lock acquire ONLY (NOT both engineHook + writeCurrentWorkflow → double-lock deadlock per RESEARCH § Pitfall 1); (b) writeCurrentWorkflow self-locks via state.ts withLock — engineHook activatePhase/completePhase serialize through transitive call chain (no direct lockfile import in engineHook.ts); (c) verify NO direct writeCurrentWorkflow callers outside engineHook per RESEARCH § A4 — grep src/ for `writeCurrentWorkflow(` non-engineHook callers; if direct callers exist (resume.ts likely), update engineHook to import withLock + wrap compound op directly; OR resume.ts also imports withLock + wraps same; (d) `wc -l src/checkpoint/engineHook.ts` ≤ 200 Karpathy hard limit"
    - "developer reads `tests/checkpoint/state-lock.test.ts` (NEW ~80-100L ≤200L PASS) and finds: (a) TDD red-green-refactor R10.2 lock core logic; (b) `vi.mock('proper-lockfile', () => ({ default: { lock: vi.fn().mockResolvedValue(vi.fn()), check: vi.fn() } }))` + `vi.mock('node:fs/promises', ...)` sister tests/checkpoint/state.test.ts pattern延袭; (c) 5 cells: cell 1 serial sequential writes complete via writeCurrentWorkflow / cell 2 concurrent two-call simulation — lock mock setTimeout 50ms first-acquire delay verify second waits via order array [1,2,3] / cell 3 lock rejected with `code='ELOCKED'` → LockHeldError thrown with verbatim message containing 'another harnessed process holds the lock' + 'harnessed status' hint / cell 4 release() called in finally even on writeFile throw (mock writeFile reject + verify release.calls.length==1) / cell 5 mkdir('.harnessed', {recursive:true}) called before lock acquire; (d) `corepack pnpm test -- tests/checkpoint/state-lock.test.ts --run` exit 0 5/5 fixtures pass; (e) CI matrix Win+Linux+macOS Day 1 green (test-internal mock NOT real lockfile so cross-OS test-side safe; real-lockfile cross-OS verified at integration via DOGFOOD-T2.X.md manual smoke W2)"
    - "developer reads `src/cli/status.ts` (MODIFY ~31L→55-70L ≤200L PASS) and finds: (a) `import lockfile from 'proper-lockfile'` + `import { stat } from 'node:fs/promises'`; (b) after existing readState output, try-block: `const isLocked = await lockfile.check('.harnessed', { lockfilePath: '.harnessed/.lock', stale: 10_000 })`; IF held → `const s = await stat('.harnessed/.lock')` → log 'lock: held (since <ISO mtime>) — stale after 10s' + IF mtime ageMs > 10_000 → ' — STALE' suffix + hint 'to release: wait for process or delete .harnessed/.lock'; IF not held → 'lock: free'; silent on `.harnessed/` missing (try-catch); (c) PID display optional 1-line `readFile('.harnessed/.lock/pid')` if PID file exists per RESEARCH § 1 D-07 (recommend ship; YAGNI-acceptable defer if Wave 2 tight); (d) `wc -l src/cli/status.ts` ≤ 200 Karpathy hard limit"

    # W2 ADR 0021 + ci.yml A7 + milestone artifacts truths (8 main scope artifacts — full ship cadence sister Phase 4.3 close pattern adapted Phase 5.1 progress)
    - "developer reads `docs/adr/0021-state-lock-and-audit-consumer.md` (NEW ~120-160L PRIMARY 9-section sister docs/adr/0018-routing-audit-log.md 100% reuse adapted Phase 5.1 scope) and finds: (a) Status — `**Accepted (phase 5.1 W1/W2 — 2026-05-20)**` + implementation summary; (b) Context — R10.1 gap Phase 4.3 R8.1 consumer half-complete + R10.2 #BU 4th-cycle carry concurrent race + single→multi maintainer recruit window prerequisite; (c) Decisions § 1-8 verbatim 8 D-decisions D-01 through D-08; (d) A7 Conservation — ADR 0001-0020 main body 0 diff verified; ci.yml A7 iter 0018→0021 RETROACTIVE FIX 0019+0020 per RESEARCH § 5 critical finding; baseline tag adr-0021-accepted Phase 5.1 W2 落地 sister Phase 4.3 W2 T2.4 cadence延袭; (e) Consequences — capability delta table (NEW src/cli/audit-log.ts + state.ts withLock + tests/cli/audit-log.test.ts + tests/checkpoint/state-lock.test.ts + proper-lockfile dep +1); (f) Compliance — R10.1 'harnessed audit-log --filter exit 0 + engineering records output' + R10.2 '2-process concurrent harnessed resume second throws LockHeldError after 3 retry'; (g) Errata-path note — frozen Phase 5.1; v0.6+ goes ADR 0022+; (h) Adoption-confirmation — Phase 5.1 ship evidence + deferred items v0.6+ disposition; (i) References — CONTEXT D-01-08 + sister ADR 0018 producer + ADR 0019/0020 backfill cross-ref + sister Win corepack ACL educational link educational"
    - "developer reads `docs/adr/README.md` (MODIFY ~+1 row) and finds 0021 entry appended after ADR 0020 entry: `| [0021](./0021-state-lock-and-audit-consumer.md) | Phase 5.1 — R10.2 state.ts concurrent write lock (proper-lockfile) + R10.1 audit log --filter CLI consumer | Accepted | 2026-05-20 |` (sister Phase 3.4 ADR 0017 single-add cadence延袭 NOT triple-add per CONTEXT D-03 L78 from Phase 4.3)"
    - "developer reads `.github/workflows/ci.yml` (MODIFY) and finds A7 step iterated **CRITICAL RETROACTIVE FIX**: (a) Line 82 step name `ADR 0001-0018 main body 守恒` → `ADR 0001-0021 main body 守恒`; (b) Line 85 first for loop `for n in 0001 ... 0017 0018` → `for n in 0001 ... 0017 0018 0019 0020 0021` (append 3 ADR numbers); (c) Line 96 second for loop same append; (d) Line 107 echo `A7 ✅ ADR 0001-0018 main body unchanged` → `ADR 0001-0021`; (e) STRICT ordering — commit + push BEFORE adr-0021-accepted tag creation per STRIDE D mitigation + RESEARCH § 5; (f) ADDRESSES Phase 4.3 W2 T2.4 ship gap (only iterated 0017→0018; ADR 0019+0020 backfilled but NOT protected by A7 gate per RESEARCH § Pitfall 6 + RESEARCH § 5 critical finding); Phase 5.1 retroactively closes gap by adding 0019+0020+0021 simultaneously; baseline tags adr-0019-accepted + adr-0020-accepted MUST exist BEFORE A7 iter (T0.4 BLOCKER precedence)"
    - "developer reads `CHANGELOG.md` (MODIFY ~+8-12L) and finds `## [0.5.0-alpha.1] - 2026-05-20` section after [Unreleased]: `### Added` (R10.1 audit log --filter consumer CLI subcommand + R10.2 concurrent write lock proper-lockfile@^4.1.2 + LockHeldError class + ADR 0021 PRIMARY + W0 sub-batch installers/lib/{runClaudeArgs,err}.ts dedup #BF+#BG) + `### Changed` (ci.yml A7 step ADR 0001-0018 → 0001-0021 RETROACTIVE FIX 0019+0020 backfill protect + harnessed status enhanced lock holder display); Keep-a-Changelog format sister Phase 4.3 W2 T2.5 cadence延袭 100% reuse; root-level CHANGELOG.md NOT docs/CHANGELOG.md"
    - "developer reads `.planning/STATE.md` Phase 5.1 SHIPPED 续编 and finds: (a) 当前位置 block update to `Phase 5.1 SHIPPED (2026-05-20)`; (b) 进度 17/20 → 18/20 90% (v0.5.0 milestone 1/3 PROGRESS NOT close); (c) v0.5.0 milestone table row updated 0/3 STARTING → 1/3 PROGRESS; (d) next: Phase 5.2 discuss-phase entry — R10.3 uninstall + R10.4 path traversal hardening; (e) STATE size ≤175L (sister Phase 4.3 W0.2 200→175 baseline OR ≤150L if T0.2 flip activated); (f) all decisions D-01 through D-08 recorded in 关键决策记录 table"
    - "developer reads `.planning/RETROSPECTIVE.md` Phase 5.1 retrospective section and finds 7-section milestone retrospective sister Phase 4.3 W2 T2.7 format 100% reuse: (1) What Worked (jq subprocess zero-new-dep + proper-lockfile@4.1.2 battle-tested + dual-format default+--json industrial pattern + W0 sub-batch #BF+#BG MED carry-forward resolve + RETROACTIVE A7 fix close Phase 4.3 ship gap) (2) What Was Inefficient (none expected — clean execution) (3) Key Lessons (sister 5-recurrence terminus D2 cadence iter 5 + Karpathy single-SoT R8.1 producer reuse consumer NO new SoT + A7 gate retroactive miss caught Phase 5.1 valuable defense-in-depth lesson) (4) Patterns Established (proper-lockfile dir-level pattern + jq subprocess pipe pattern + consumer 2nd-layer redact pattern + ARCHITECTURAL phase progress cadence (Phase 4.3 close cadence延袭 adapted 1-of-3 progress)) (5) Tech Debt (residual: cli-table3 alternative if 200L pressure surfaces v0.6+; op-level lock if contention measurement surfaces v0.6+) (6) Cost Patterns (1-day actual vs 1-1.5 day estimate per CONTEXT sister #BR ARCHITECTURAL allowance) (7) Disposition (DEFER #BA round 3 OR FLIP per T0.2 decision tree + 5-recurrence terminus assess Phase 5.2)"
    - "developer reads `.planning/ROADMAP.md` Phase 5.1 SHIPPED section and finds literal cadence延袭 (sister L130 v0.3.0 + L185 v0.4.0 + L223 Phase 4.3 SHIPPED literal pattern): Phase 5.1 SHIPPED 2026-05-20 + R10.1 audit-log consumer NEW + R10.2 state.ts lock + ADR 0021 + ci.yml A7 iter 0018→0021 RETROACTIVE 0019+0020 + W0 sub-batch installers/lib/ extract + dual baseline tag adr-0021-accepted + v0.5.0-alpha.1-audit-lock LOCAL CREATE; v0.5.0 milestone row updated 0/3 STARTING → 1/3 PROGRESS"
    - "developer reads `.planning/phase-5.1/DOGFOOD-T2.X.md` (NEW ~60-70L 3-axis sister Phase 4.3 DOGFOOD-T2.X.md 60L format 100% reuse): (A) R10.1 — audit-log.ts ≤200L Karpathy + tests ≥8 cells TDD pass + manual `harnessed audit-log --filter '.category==\"engineering\"' --tail 10` exit 0 output engineering records + 5-redact-pattern verify (api_key=/token=/password=/Bearer/key-prefix) all map [REDACTED]; (B) R10.2 — state.ts ≤120L + tests/checkpoint/state-lock.test.ts 5 cells TDD pass + 2-process concurrent simulation `harnessed resume × 2` second throws LockHeldError after ~700ms (3 retries 100+200+400) + status.ts lock holder display since-timestamp + STALE suffix when artificially aged; (C) Ship cadence — ADR 0021 9-section + ci.yml A7 iter `grep -E '0019.*0020.*0021' .github/workflows/ci.yml` returns 2 hits (both for loops); 0001-0020 main body 0 diff `git diff <initial-commit-of-each-ADR>..HEAD docs/adr/000[1-9]-*.md docs/adr/001[0-9]-*.md docs/adr/0020-*.md | wc -l` == 0; CHANGELOG v0.5.0-alpha.1 entry; W0 sub-batch installers/lib/{runClaudeArgs.ts,err.ts} NEW + 10 import-line changes; dual baseline tag LOCAL CREATE adr-0021-accepted + v0.5.0-alpha.1-audit-lock present + NO push verified `git ls-remote origin refs/tags/v0.5.0-alpha.1-audit-lock` empty"

  # ===== Artifacts contract (sister Phase 4.3 artifacts shape延袭) =====
  artifacts:
    # W0 cadence absorb (4 tasks)
    - path: .planning/STATE.md
      provides: "STATE size ≤175L (or ≤150L T0.2 flip) + Phase 4.3 narrative trimmed → RETROSPECTIVE + Phase 5.1 SHIPPED 续编 W2 ship"
    - path: .planning/RETROSPECTIVE.md
      provides: "§ ARCHIVED FROM STATE — Phase 4.3 receives Phase 4.3 narrative verbatim + Phase 5.1 retrospective 7-section W2 append"
    - path: scripts/check-state-archive-stale.mjs
      provides: "SIZE_LIMIT 175 (current) OR 150 (T0.2 flip path conditional) 1-line surgical L12 update OR unchanged"
    - path: src/installers/lib/runClaudeArgs.ts
      provides: "NEW ~25-35L extract function runArgs(claudeArgs,cwd,timeoutMs=15_000):Promise<ProcResult> + export ProcResult interface; 3-installer duplicate consolidate (#BF)"
    - path: src/installers/lib/err.ts
      provides: "NEW ~8-15L extract function err(ctx,path,message,keyword):InstallError; 7-installer duplicate consolidate (#BG)"
    - path: src/installers/mcpStdioAdd.ts
      provides: "MODIFY ~-15L delete local runArgs+err import from ./lib/ (sub-batch consumer)"
    - path: src/installers/mcpHttpAdd.ts
      provides: "MODIFY ~-15L delete local runArgs+err import from ./lib/"
    - path: src/installers/ccPluginMarketplace.ts
      provides: "MODIFY ~-15L delete local runArgs+err import from ./lib/"
    - path: src/installers/ccHookAdd.ts
      provides: "MODIFY ~-5L delete local err import from ./lib/err.js"
    - path: src/installers/gitCloneWithSetup.ts
      provides: "MODIFY ~-5L delete local err import"
    - path: src/installers/npmCli.ts
      provides: "MODIFY ~-5L delete local err import"
    - path: src/installers/npxSkillInstaller.ts
      provides: "MODIFY ~-5L delete local err import"

    # W1 R10.1 audit-log NEW (4 tasks)
    - path: src/cli/audit-log.ts
      provides: "NEW ~140-160L registerAuditLog(program) 13th subcommand + jq spawn + 5-pattern redact + dual format + 3-flag pagination + AUDIT_PATH hardcoded literal STRIDE T mitigation"
    - path: tests/cli/audit-log.test.ts
      provides: "NEW ~120-150L TDD red-green-refactor 8+ cells: redact 5 patterns + jq subprocess + dual format + 3 pagination flags + clean-text-passthrough; ExitError+runCli helper sister doctor.test.ts pattern延袭"
    - path: src/cli.ts
      provides: "MODIFY ~+2L import registerAuditLog + register call 13th subcommand alphabetical after registerAudit"
    - path: .planning/phase-5.1/DOGFOOD-T1.X.md
      provides: "NEW ~30-40L W1 mid-wave 3-axis verify audit-log.ts Karpathy + jq smoke + redact 5-pattern verify"

    # W2 R10.2 state lock + ADR + ship (15 tasks)
    - path: package.json
      provides: "MODIFY ~+1L dependencies block add proper-lockfile@^4.1.2 alphabetical insert"
    - path: pnpm-lock.yaml
      provides: "MODIFY auto-regenerate via pnpm install committed (no manual edit)"
    - path: src/checkpoint/state.ts
      provides: "MODIFY ~+30L (77L→100-120L) export LockHeldError + withLock<T> helper + writeCurrentWorkflow wrapped; LOCK_OPTS verbatim per D-05+D-06+D-08 LOCKED; ELOCKED → LockHeldError actionable hint"
    - path: src/checkpoint/engineHook.ts
      provides: "MODIFY ~+2-5L engineHook-level lock via transitive state.ts withLock; NO double-lock; verify NO direct writeCurrentWorkflow callers outside engineHook"
    - path: tests/checkpoint/state-lock.test.ts
      provides: "NEW ~80-100L TDD red-green-refactor R10.2 lock core; vi.mock proper-lockfile + node:fs/promises sister state.test.ts pattern; 5 cells serial+concurrent+LockHeldError+release-finally+mkdir-pre-acquire"
    - path: src/cli/status.ts
      provides: "MODIFY ~+20-25L (31L→55-70L) D-07 lock holder display via lockfile.check + stat mtime since-timestamp + STALE auto-detect + actionable hint"
    - path: docs/adr/0021-state-lock-and-audit-consumer.md
      provides: "NEW ~120-160L PRIMARY ADR 9-section format sister ADR 0018 100% reuse adapted Phase 5.1 scope; 8 D-decisions § 1-8 verbatim + A7 conservation 0001-0020 + Consequences + Compliance + Errata-path + Adoption-confirmation + References"
    - path: docs/adr/README.md
      provides: "MODIFY ~+1 row ADR 0021 entry append after 0020 sister Phase 3.4 single-add cadence延袭"
    - path: .github/workflows/ci.yml
      provides: "MODIFY **CRITICAL RETROACTIVE FIX** A7 step iter 0018→0021 (4 surgical edits L82+L85+L96+L107); RETROACTIVE 0019+0020 close Phase 4.3 ship gap per RESEARCH § 5 critical finding"
    - path: CHANGELOG.md
      provides: "MODIFY ~+8-12L `## [0.5.0-alpha.1] - 2026-05-20` section Added/Changed Keep-a-Changelog format sister Phase 4.3 W2 T2.5 cadence延袭"
    - path: .planning/ROADMAP.md
      provides: "MODIFY Phase 5.1 SHIPPED literal cadence延袭 + v0.5.0 milestone row 0/3 → 1/3 PROGRESS (NOT close — Phase 5.3 close)"
    - path: PROJECT-SPEC.md
      provides: "MODIFY L3 Status header Phase 5.1 SHIPPED literal sister FRONT_MATTER_DOCS transparency gate pattern延袭"
    - path: README.md
      provides: "MODIFY L9 Status freshness + Phase 5.1 row append shipped phase list"
    - path: .planning/phase-5.1/DOGFOOD-T2.X.md
      provides: "NEW ~60-70L 3-axis empirical evidence sister Phase 4.3 DOGFOOD-T2.X.md 60L format 100% reuse: (A) R10.1 + (B) R10.2 + (C) ship cadence verify"

  # ===== Key links (R10.1 + R10.2 dependency wiring per goal-backward methodology) =====
  key_links:
    - from: src/cli/audit-log.ts
      to: .harnessed/audit.log
      via: readFileSync(AUDIT_PATH, 'utf8').split('\\n')
      pattern: "const AUDIT_PATH = '\\.harnessed/audit\\.log'"
    - from: src/cli/audit-log.ts
      to: jq subprocess
      via: spawn('jq', [filterExpr], { stdio: ['pipe','pipe','pipe'] })
      pattern: "spawn\\(.jq.,\\s*\\[.*filter.*\\]"
    - from: src/cli/audit-log.ts
      to: src/audit/log.ts (Phase 4.3 producer)
      via: "import type { AuditRecord } from '../audit/log.js'"
      pattern: "import type \\{ AuditRecord \\} from"
    - from: src/cli.ts
      to: src/cli/audit-log.ts
      via: registerAuditLog(program) 13th subcommand register
      pattern: "registerAuditLog\\(program\\)"
    - from: src/checkpoint/state.ts
      to: proper-lockfile npm dep
      via: "import lockfile from 'proper-lockfile' + lockfile.lock('.harnessed', LOCK_OPTS)"
      pattern: "lockfile\\.lock\\(.\\.harnessed."
    - from: src/checkpoint/state.ts
      to: LockHeldError class
      via: "export class LockHeldError extends Error + ELOCKED catch → throw new LockHeldError()"
      pattern: "throw new LockHeldError"
    - from: src/checkpoint/engineHook.ts
      to: src/checkpoint/state.ts withLock
      via: transitive lock via writeCurrentWorkflow self-lock (NOT double-lock per Pitfall 1)
      pattern: "writeCurrentWorkflow|stateActivate|stateComplete"
    - from: src/cli/status.ts
      to: .harnessed/.lock
      via: "lockfile.check('.harnessed', { lockfilePath: '.harnessed/.lock' }) + stat for mtime"
      pattern: "lockfile\\.check"
    - from: docs/adr/0021-state-lock-and-audit-consumer.md
      to: 8 D-decisions LOCKED CONTEXT.md
      via: "§ Decisions § 1-8 D-01 through D-08 verbatim source citation"
      pattern: "D-0[1-8]"
    - from: .github/workflows/ci.yml
      to: docs/adr/0019/0020/0021-*.md
      via: A7 step iter for loop expand to include 0019 0020 0021 (RETROACTIVE FIX)
      pattern: "for n in 0001.*0019 0020 0021"
---

# Phase 5.1 PLAN — R10.1 audit-log consumer + R10.2 state.ts concurrent write lock #BU

> **🔒 PLANNING SCOPE LOCK**: PLAN drives execution. Execute agents MUST NOT deviate from frontmatter `must_haves` + `files_modified` + `threats_open` — sister Phase 4.3 PLAN.md template format 100% reuse adapted Phase 5.1 ARCHITECTURAL scope. 8 D-decisions LOCKED (CONTEXT.md L28-115 + RESEARCH.md § 1) + M-01 ARCHITECTURAL phase class LOCK + W0 backlog 4 items (T0.1 D2 cadence iter 5 + T0.2 SIZE_LIMIT conditional + T0.3 sub-batch #BF+#BG + T0.4 retroactive baseline tags) = 0 sneak tolerance.
>
> **🔴 CRITICAL FINDING (RESEARCH § 5)**: Phase 4.3 W2 T2.4 ship gap — ci.yml A7 step only iterated 0017→0018 but ADR 0019+0020 were backfilled. Phase 5.1 RETROACTIVELY closes this gap by iterating 0018→0021 (adds 0019+0020+0021 simultaneously) + LOCAL CREATE baseline tags adr-0019-accepted + adr-0020-accepted (pinned to initial-commit hash per Phase 4.3 ship intent reconstruction).

---

## § 1 — Phase 5.1 Task Breakdown (3 Waves)

Sister Phase 4.3 PLAN.md 3-wave cadence延袭 adapted Phase 5.1 scope:

| Wave | Scope | Tasks | Files | Est. Time |
|------|-------|-------|-------|-----------|
| **Wave 0** | W0 cadence absorb + sub-batch #BF+#BG + retroactive baseline tags | T0.1 → T0.4 (4 tasks, sub-batch parallel-able) | STATE + RETROSPECTIVE + check-script + installers/lib/* + 7 installer MODIFY + 2 retroactive tags | ~2-3 hours |
| **Wave 1** | R10.1 audit-log consumer NEW (architectural anchor #1) | T1.1 → T1.4 (4 tasks) | src/cli/audit-log.ts + tests + src/cli.ts + DOGFOOD-T1.X.md | ~3-4 hours |
| **Wave 2** | R10.2 state lock + ADR 0021 + ci.yml A7 iter + milestone artifacts (architectural anchor #2 + ship cadence) | T2.1 → T2.16 (16 tasks; tag LOCAL CREATE NO push) | package.json + state.ts + engineHook.ts + status.ts + tests + ADR 0021 + README + ci.yml + CHANGELOG + STATE + RETROSPECTIVE + ROADMAP + PROJECT-SPEC + README + DOGFOOD-T2.X.md | ~5-6 hours |

**Total estimate**: ~10-13 hours actual / 1-1.5 day target window per CONTEXT sister #BR ARCHITECTURAL allowance (M-01 architectural phases allowed 1.5-day extend beyond strict 1-day target).

---

## § 2 — Wave 0: Cadence Absorb + Sub-batch + Retroactive Fix

### T0.1 — D2 cadence iter 5 trim Phase 4.3 narrative → RETROSPECTIVE (HIGH path-dep FIRST)

**Action**: Trim Phase 4.3 narrative section from STATE.md → RETROSPECTIVE.md § ARCHIVED FROM STATE — Phase 4.3. Sister Phase 4.3 W0.1 4th-iter REINFORCE → Phase 5.1 W0 T0.1 5th-iter terminus per sister 5-recurrence terminus heuristic confirmed pattern. HTML-comment archive marker pointer left in STATE.md trim site per sister L42 format.

**Sneak-block**: MUST NOT trim Phase 4.2 or earlier narratives (already archived per Phase 4.3 W0.1 4th-iter). MUST NOT delete `当前位置` block (currently L21-27 SoT per D-04 (b) COLLAPSE LOCKED). MUST preserve all 关键决议 ship 总结 narrative line-by-line verbatim relocate.

**Acceptance**:
- `wc -l .planning/STATE.md` post-trim ≤165L (creates T0.2 flip headroom — sister Phase 4.3 W0.1 trim metrics延袭)
- `grep '§ ARCHIVED FROM STATE — Phase 4.3' .planning/RETROSPECTIVE.md` returns 1 hit
- `grep '<!-- Phase 4.3 narrative archived' .planning/STATE.md` returns 1 hit (HTML-comment pointer)
- `node scripts/check-state-archive-stale.mjs` exit 0

### T0.2 — DEFERRED #BA D1 SIZE_LIMIT 175→? round 3 conditional flip (MED conditional path-dep AFTER T0.1)

**Action**: CONDITIONAL decision tree per CONTEXT #BA L123:
- IF post-T0.1 STATE ≤150L → flip 1-line surgical L12 `const SIZE_LIMIT = 175` → `const SIZE_LIMIT = 150` (15L safety headroom; sister Phase 4.3 W0.2 200→175 10L headroom延袭 tighter as more confidence in trim cadence)
- 151-160L → DEFER #BA carry-forward Phase 5.2+ W0 LOW priority (4th consecutive DEFER signal terminus — reassess Phase 5.2 if formal close vs continue defer)
- >160L → BLOCKED escalate investigate W0.1 trim sufficiency

**Sneak-block**: MUST NOT flip 175→100 / 175→125 / 175→200 (only 150 per decision tree OR DEFER unchanged); MUST NOT lower SIZE_LIMIT without verifying STATE ≤ flip-target-15L headroom; MUST NOT skip post-T0.1 size measurement before deciding.

**Acceptance**:
- IF flip path: `grep 'const SIZE_LIMIT = 150' scripts/check-state-archive-stale.mjs` returns 1 hit; `node scripts/check-state-archive-stale.mjs` exit 0
- IF defer path: scripts/check-state-archive-stale.mjs unchanged + STATE.md `关键提醒` block notes `DEFERRED #BA carry Phase 5.2+ W0 4th consecutive defer`
- IF blocked path: HALT W2 — escalate user T0.1 trim sufficiency

### T0.3 — W0 sub-batch #BF + #BG ABSORB atomic refactor (MED parallel-able with T0.1+T0.2)

**Action**: Extract 2 NEW files + MODIFY 7 installer files (pure refactor NO behavior change):

1. **NEW `src/installers/lib/runClaudeArgs.ts`** (~25-35L) — extract identical 3-installer `function runArgs(claudeArgs, cwd, timeoutMs = 15_000): Promise<ProcResult>` (mcpStdioAdd.ts L40 + mcpHttpAdd.ts L47 + ccPluginMarketplace.ts L49). Export `ProcResult` interface + `runArgs` function. Win cmd.exe /c claude.cmd shim + Unix spawn direct binary verbatim copy.

2. **NEW `src/installers/lib/err.ts`** (~8-15L) — extract identical 7-installer `function err(ctx, path, message, keyword): InstallError` (ccHookAdd.ts L18 + ccPluginMarketplace.ts L40 + gitCloneWithSetup.ts L43 + mcpHttpAdd.ts L38 + mcpStdioAdd.ts L31 + npmCli.ts L35 + npxSkillInstaller.ts L49). Per RESEARCH § 4: 7 NOT 8 (sister review verbatim correction). Import `InstallContext` + `InstallError` types from existing shared location.

3. **MODIFY 7 installer files** — Replace local `function runArgs` (3 files) + `function err` (7 files) with `import { runArgs } from './lib/runClaudeArgs.js'` + `import { err } from './lib/err.js'`. Total 10 import-line changes.

**Sneak-block**: MUST NOT change function signatures/behaviors during extract (pure refactor); MUST NOT add additional logic during extract; MUST run Biome preempt `pnpm exec biome check --write src/installers/` BEFORE commit per project memory `feedback_biome-preempt.md` (3 CI-red recurrences Phase 2.1.1/2.2/2.3 sister precedent); MUST run full test suite `pnpm test --run` post-extract verify 0 regression.

**Acceptance**:
- `wc -l src/installers/lib/runClaudeArgs.ts` ≤ 35
- `wc -l src/installers/lib/err.ts` ≤ 15
- `grep -c 'function runArgs' src/installers/*.ts` returns 0 (all extracted)
- `grep -c 'function err(' src/installers/*.ts` returns 0 (all extracted; lib/err.ts excluded)
- `grep -c "from './lib/runClaudeArgs.js'" src/installers/*.ts` returns 3
- `grep -c "from './lib/err.js'" src/installers/*.ts` returns 7
- `pnpm exec biome check src/installers/` exit 0
- `corepack pnpm test --run` exit 0 (full suite green)

### T0.4 — Retroactive LOCAL CREATE baseline tags adr-0019-accepted + adr-0020-accepted (HIGH BLOCKER for T2.8)

**Action**: LOCAL CREATE 2 baseline tags pinned to initial-commit hash of each ADR file (Phase 4.3 ship intent reconstruction). LOCAL CREATE ONLY NEVER PUSH per CLAUDE.md commit safety. Sister Phase 4.3 W2 T2.15 tag creation pattern延袭.

**Commands**:
```bash
# Find initial-commit hash of each ADR file
HASH_0019=$(git log --diff-filter=A --pretty=format:"%H" -- docs/adr/0019-state-dual-ssot-collapse-pattern.md | tail -1)
HASH_0020=$(git log --diff-filter=A --pretty=format:"%H" -- docs/adr/0020-hybrid-2clock-disambiguation.md | tail -1)

# LOCAL CREATE only NO push
git tag -a adr-0019-accepted "$HASH_0019" -m "Phase 4.3 W2 T2.1 backfill — STATE dual-SoT COLLAPSE pattern (retroactive LOCAL CREATE Phase 5.1 W0 T0.4 close Phase 4.3 ship gap per RESEARCH § 5)"
git tag -a adr-0020-accepted "$HASH_0020" -m "Phase 4.3 W2 T2.2 backfill — HYBRID 2-clock disambiguation (retroactive LOCAL CREATE Phase 5.1 W0 T0.4 close Phase 4.3 ship gap per RESEARCH § 5)"

# Verify NO push
git ls-remote origin refs/tags/adr-0019-accepted  # MUST return empty
git ls-remote origin refs/tags/adr-0020-accepted  # MUST return empty
```

**Sneak-block**: MUST NOT push tags (`git push --tags` PROHIBITED per CLAUDE.md commit safety); MUST NOT pin tags to HEAD (tags must reflect Phase 4.3 ship intent at initial-commit timestamp); MUST verify tag annotations include `(retroactive LOCAL CREATE Phase 5.1 W0 T0.4 ...)` message for audit trail.

**Acceptance**:
- `git tag -l adr-0019-accepted adr-0020-accepted` returns both tags
- `git rev-parse adr-0019-accepted` matches `git log --diff-filter=A --pretty=format:"%H" -- docs/adr/0019-*.md | tail -1`
- Same for adr-0020-accepted
- `git ls-remote origin refs/tags/adr-0019-accepted` returns empty (NO push)
- BLOCKER cleared for W2 T2.8 ci.yml A7 iter expansion

---

## § 3 — Wave 1: R10.1 Audit-log Consumer NEW (Architectural Anchor #1)

### T1.1 — NEW `src/cli/audit-log.ts` (~140-160L; D-01 + D-02 + D-03 + D-04 LOCKED)

**Action**: Create new CLI subcommand module per PATTERNS § audit-log.ts + RESEARCH § 2.1 skeleton:

```typescript
// src/cli/audit-log.ts — Phase 5.1 R10.1 NEW (≤200L Karpathy)
import { spawn } from 'node:child_process'
import { readFileSync, existsSync } from 'node:fs'
import type { Command } from 'commander'
import type { AuditRecord } from '../audit/log.js'

const AUDIT_PATH = '.harnessed/audit.log'  // hardcoded literal — STRIDE T mitigation
const DEFAULT_TAIL = 50

// D-04 LOCKED 5 redact patterns — pre-compiled at module load (NOT inside loop)
const REDACT_PATTERNS: Array<[RegExp, string]> = [
  [/api[_-]?key\s*[:=]\s*\S+/gi, 'api_key=[REDACTED]'],
  [/\btoken\s*[:=]\s*\S+/gi, 'token=[REDACTED]'],
  [/\bpassword\s*[:=]\s*\S+/gi, 'password=[REDACTED]'],
  [/Authorization:\s*Bearer\s+\S+/gi, 'Authorization: Bearer [REDACTED]'],
  [/\b(sk-|pk-|gh_|ghp_|ya29\.|AIza)[A-Za-z0-9_\-]{6,}/g, '[REDACTED]'],
]

function redact(text: string): string {
  return REDACT_PATTERNS.reduce((acc, [re, rep]) => acc.replace(re, rep), text)
}

function readLines(): string[] {
  if (!existsSync(AUDIT_PATH)) return []
  return readFileSync(AUDIT_PATH, 'utf8').split('\n')
}

function paginate(lines: string[], opts: { tail?: number; head?: number; reverse?: boolean }): string[] {
  let result = lines.filter(l => l.trim().length > 0)
  if (opts.head !== undefined) result = result.slice(0, opts.head)
  else if (opts.tail !== undefined) result = result.slice(-opts.tail)
  else result = result.slice(-DEFAULT_TAIL)
  if (opts.reverse) result = [...result].reverse()
  return result
}

function parseRecord(line: string): AuditRecord | null {
  try { return JSON.parse(line) as AuditRecord } catch { return null }
}

function pipeToJq(jsonl: string, filter: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn('jq', ['-c', filter], { stdio: ['pipe', 'pipe', 'pipe'] })
    let out = ''
    let err = ''
    child.stdout.on('data', (d: Buffer) => { out += d.toString() })
    child.stderr.on('data', (d: Buffer) => { err += d.toString() })
    child.on('error', (e: NodeJS.ErrnoException) => {
      if (e.code === 'ENOENT') reject(new Error('jq not found — run: harnessed doctor'))
      else reject(e)
    })
    child.on('close', (code) => {
      if (code !== 0) reject(new Error(`jq exit ${code}: ${err.trim()}`))
      else resolve(out)
    })
    child.stdin.write(jsonl)
    child.stdin.end()
  })
}

function renderTable(records: AuditRecord[]): void {
  const COLS = ['ts', 'phase', 'category', 'matched_rule_id', 'outcome'] as const
  const WIDTHS = [24, 10, 14, 22, 12]
  console.log(COLS.map((c, i) => c.padEnd(WIDTHS[i]!)).join(' | '))
  console.log(WIDTHS.map(w => '-'.repeat(w)).join('-+-'))
  for (const r of records) {
    const row = COLS.map((c, i) => String(r[c] ?? '').slice(0, WIDTHS[i]).padEnd(WIDTHS[i]!)).join(' | ')
    console.log(row)
  }
}

export function registerAuditLog(program: Command): void {
  program
    .command('audit-log')
    .description('Query routing audit log (.harnessed/audit.log) with optional jq filter')
    .option('--filter <expr>', 'jq filter expression (e.g. \'.category=="engineering"\')')
    .option('--tail <n>', 'show N most recent records', String(DEFAULT_TAIL))
    .option('--head <n>', 'show N oldest records (takes precedence over --tail)')
    .option('--reverse', 'flip output order')
    .option('--json', 'output full 12-field JSON instead of human table')
    .action(async (opts: { filter?: string; tail?: string; head?: string; reverse?: boolean; json?: boolean }) => {
      const tail = opts.tail ? Number(opts.tail) : DEFAULT_TAIL
      const head = opts.head ? Number(opts.head) : undefined
      if (Number.isNaN(tail) || tail < 1) { console.error('✗ --tail must be a positive integer'); process.exit(2) }
      if (head !== undefined && (Number.isNaN(head) || head < 1)) { console.error('✗ --head must be a positive integer'); process.exit(2) }

      const lines = readLines()
      if (lines.length === 0) { console.error('no audit log at .harnessed/audit.log — run harnessed first'); process.exit(0) }

      const paged = paginate(lines, { tail, head, reverse: opts.reverse })
      let final: string[]
      if (opts.filter) {
        try {
          const filtered = await pipeToJq(paged.join('\n'), opts.filter)
          final = filtered.split('\n').filter(Boolean)
        } catch (e) { console.error(`✗ ${(e as Error).message}`); process.exit(1) }
      } else { final = paged }

      const records = final.map(parseRecord).filter((r): r is AuditRecord => r !== null)
      if (records.length === 0) { console.log('no records'); process.exit(0) }

      // Apply redact LAST (paginate → jq → redact → render) per RESEARCH § 2.2
      const redacted = records.map(r => ({ ...r, task_excerpt: redact(r.task_excerpt) }))

      if (opts.json) console.log(JSON.stringify(redacted, null, 2))
      else renderTable(redacted)
      process.exit(0)
    })
}
```

**Sneak-block**: MUST NOT exceed 200L (Karpathy hard limit; if pressure surfaces extract `redact.ts` helper); MUST use `shell:false` default for spawn (STRIDE T mitigation); MUST apply redact LAST in pipeline (RESEARCH § 2.2 + Pitfall 3); MUST NOT add cli-table3 npm dep (D-02 LOCKED Karpathy YAGNI); MUST use top-level `audit-log` subcommand NOT nested under `audit` (manifest yaml audit ≠ routing audit log per CONTEXT § Open Q).

**Acceptance**:
- `wc -l src/cli/audit-log.ts` ≤ 200
- `grep "const AUDIT_PATH = '.harnessed/audit.log'" src/cli/audit-log.ts` returns 1 hit
- `grep -E "shell\s*:\s*true" src/cli/audit-log.ts` returns 0 hits (default false)
- `grep -E "REDACT_PATTERNS.*5|\[/api|\\\\btoken|\\\\bpassword|Bearer|sk-|gh_" src/cli/audit-log.ts` returns ≥ 5 patterns
- `pnpm exec biome check src/cli/audit-log.ts` exit 0
- `pnpm build` exit 0

### T1.2 — NEW `tests/cli/audit-log.test.ts` (~120-150L; TDD red-green-refactor)

**Action**: Create test file FIRST (RED) before T1.1 implementation per TDD discipline. Sister tests/cli/doctor.test.ts 149L ExitError + runCli helper pattern 100% reuse. 8+ fixture cells covering all 8 D-decisions:

```typescript
// tests/cli/audit-log.test.ts — Phase 5.1 R10.1 TDD red-green-refactor
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Command } from 'commander'

// ... full vi.mock setup + ExitError + runCli helper per PATTERNS § 2.4 100% reuse ...

describe('R10.1 audit-log consumer', () => {
  it('cell 1 — no audit.log → exit 0 with empty message', async () => { /* ... */ })
  it('cell 2 — 3 records no filter → human table 5-col with padEnd alignment', async () => { /* ... */ })
  it('cell 3 — --filter \'.category=="engineering"\' → spawn jq with [-c, filter] argv', async () => { /* verify spawn call args + shell:false */ })
  it('cell 4 — --json → full 12-field JSON output array', async () => { /* ... */ })
  it('cell 5 — redact api_key=abc123 → [REDACTED]', async () => { /* ... */ })
  it('cell 6 — redact Authorization: Bearer eyJhbGc → [REDACTED]', async () => { /* ... */ })
  it('cell 7 — redact sk-1234567890abcdef + ghp_aBcDeFgHiJkL1234 → [REDACTED] (key-prefix)', async () => { /* ... */ })
  it('cell 8 — --tail 2 → only 2 records + redact still applied last + clean-text-passthrough unchanged', async () => { /* ... */ })
})
```

**Sneak-block**: MUST write tests BEFORE T1.1 implementation (RED state verify); MUST mock `node:child_process` spawn (NOT real jq invocation — Win CI jq absence per RESEARCH § A5 + R-2); MUST cover all 5 redact patterns in cells 5-7 + clean-text-passthrough; MUST verify spawn argv array `['-c', filter]` NOT shell-concatenated string.

**Acceptance**:
- `corepack pnpm test -- tests/cli/audit-log.test.ts --run` exit 0
- 8+ cells PASS
- `wc -l tests/cli/audit-log.test.ts` ≤ 200

### T1.3 — MODIFY `src/cli.ts` register 13th subcommand (~+2L)

**Action**: Add import + register call per PATTERNS § cli.ts:

```typescript
// src/cli.ts — MODIFY ~+2L
import { registerAuditLog } from './cli/audit-log.js'   // alphabetical insert
// ... existing registers ...
registerAuditLog(program)   // 13th subcommand Phase 5.1 R10.1 D-01 jq filter consumer
```

**Sneak-block**: MUST NOT nest under `audit` (top-level `audit-log` per CONTEXT § Open Q); MUST keep alphabetical import order.

**Acceptance**:
- `wc -l src/cli.ts` ≤ 50 (currently 41L + 2L = ~43L)
- `grep "registerAuditLog(program)" src/cli.ts` returns 1 hit
- `pnpm build && node dist/cli.js audit-log --help` exit 0 + help text shows --filter/--tail/--head/--reverse/--json flags

### T1.4 — NEW `.planning/phase-5.1/DOGFOOD-T1.X.md` (~30-40L W1 mid-wave evidence)

**Action**: 3-axis empirical evidence sister Phase 4.3 DOGFOOD-T2.X.md adapted W1 scope:

- **(A) Karpathy + TDD verify**: `wc -l src/cli/audit-log.ts` ≤ 200 + `corepack pnpm test -- tests/cli/audit-log.test.ts --run` 8+ cells PASS
- **(B) jq subprocess smoke**: Manual `harnessed audit-log --filter '.outcome=="complete"' --tail 5` exit 0 + output 5 JSON-pretty records via stdout (or fall-back if Phase 4.3 audit.log empty: pre-seed with 5 mock records)
- **(C) Redact 5-pattern verify**: Task with `api_key=test123` + `Authorization: Bearer eyTOKEN` + `sk-PROD1234567890ab` all map [REDACTED] in render

**Acceptance**: File present ~30-40L; 3 axes documented PASS.

---

## § 4 — Wave 2: R10.2 State Lock + ADR 0021 + ci.yml A7 + Milestone Artifacts

### T2.1 — MODIFY `package.json` + `pnpm-lock.yaml` (proper-lockfile@^4.1.2 dependency)

**Action**: Add `"proper-lockfile": "^4.1.2"` to `dependencies` block (NOT devDependencies per D-05 LOCKED runtime dep + CONTEXT § Open Q). Run `pnpm install` to update `pnpm-lock.yaml`. Verify ESM/CJS compat per RESEARCH § A1: `pnpm build && node dist/cli.js audit-log --help` smoke import exit 0. If default import fails → fallback `createRequire(import.meta.url)('proper-lockfile')` wrapper ~5L in state.ts.

**Acceptance**:
- `grep '"proper-lockfile":' package.json` returns 1 hit in `dependencies` section
- `pnpm install` updates `pnpm-lock.yaml` (committed)
- `pnpm build` exit 0
- `node dist/cli.js audit-log --help` exit 0

### T2.2 — MODIFY `src/checkpoint/state.ts` (LockHeldError + withLock helper + writeCurrentWorkflow wrap)

**Action**: Add LockHeldError class + withLock helper + wrap writeCurrentWorkflow body per PATTERNS § state.ts + RESEARCH § 3.2:

```typescript
// src/checkpoint/state.ts — Phase 5.1 R10.2 MODIFY (~77L→100-120L ≤200L)
import lockfile from 'proper-lockfile'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
// ... existing imports ...

const LOCK_TARGET = '.harnessed'
const LOCK_OPTS = {
  stale: 10_000,
  retries: { retries: 3, factor: 2, minTimeout: 100 },
  lockfilePath: '.harnessed/.lock',
}

export class LockHeldError extends Error {
  constructor() {
    super('another harnessed process holds the lock at .harnessed/.lock — wait or kill stale process (try: harnessed status)')
    this.name = 'LockHeldError'
    Object.setPrototypeOf(this, LockHeldError.prototype)
  }
}

export async function withLock<T>(fn: () => Promise<T>): Promise<T> {
  await mkdir(LOCK_TARGET, { recursive: true })
  let release: (() => Promise<void>) | undefined
  try {
    release = await lockfile.lock(LOCK_TARGET, LOCK_OPTS)
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ELOCKED') throw new LockHeldError()
    throw e
  }
  try { return await fn() } finally { await release?.() }
}

export async function writeCurrentWorkflow(s: CurrentWorkflowV1Type): Promise<void> {
  if (!Value.Check(CurrentWorkflowV1, s)) { /* existing validation throw */ }
  await mkdir(dirname(STATE_PATH), { recursive: true })
  await withLock(async () => {
    await writeFile(STATE_PATH, JSON.stringify(s, null, 2), 'utf8')
  })
}
```

**Sneak-block**: MUST use `Object.setPrototypeOf` for TS class extend Error (RESEARCH § 1 D-06 L245); MUST NOT lock without ensuring `.harnessed/` dir exists (mkdir before lock per RESEARCH § 3.2 L445); MUST NOT use OS flock (Win incompat per D-05); MUST NOT use unbounded retry (D-06 LOCKED 3-retry exp-backoff).

**Acceptance**:
- `wc -l src/checkpoint/state.ts` ≤ 200 (current 77L + ~30L = ~100-120L)
- `grep 'class LockHeldError extends Error' src/checkpoint/state.ts` returns 1 hit
- `grep "lockfilePath:\s*'\.harnessed/\.lock'" src/checkpoint/state.ts` returns 1 hit
- `grep -E 'retries:\s*\{\s*retries:\s*3' src/checkpoint/state.ts` returns 1 hit (D-06 verbatim)
- `pnpm exec biome check src/checkpoint/state.ts` exit 0
- `pnpm build` exit 0

### T2.3 — MODIFY `src/checkpoint/engineHook.ts` (~+2-5L; transitive lock no double-lock)

**Action**: Verify NO direct `writeCurrentWorkflow` callers outside engineHook.ts per RESEARCH § A4. If grep reveals direct callers (e.g. resume.ts), 2 paths:

- **Path A (preferred)**: Keep state.ts self-locking (writeCurrentWorkflow internal withLock); engineHook + resume both call writeCurrentWorkflow transitively. No engineHook code change.
- **Path B (if compound op needed)**: Lift lock to engineHook level (engineHook.ts imports withLock); writeCurrentWorkflow drops inner lock OR add reentrant guard. Requires more change.

**Recommended**: Path A — minimal blast radius. Per RESEARCH § 3.3, `completePhase` calls `writeCheckpoint` (sync) + `stateComplete` (async writeCurrentWorkflow). The compound op is NOT atomic across both writes BUT acceptable because (a) writeCheckpoint is append-only to `.harnessed/checkpoints/<id>.json` (different file from current-workflow.json) and (b) audit.log append is exempt per ADR 0018. The race window is only for writeCurrentWorkflow which IS locked.

**Sneak-block**: MUST NOT double-lock (engineHook calls withLock AND writeCurrentWorkflow self-locks → deadlock per Pitfall 1); MUST verify A4 ASSUMPTION via `grep -r "writeCurrentWorkflow\b" src/ | grep -v 'state.ts\|engineHook.ts'` returns 0 OR document any direct callers found.

**Acceptance**:
- `wc -l src/checkpoint/engineHook.ts` ≤ 60
- `grep -r 'writeCurrentWorkflow' src/checkpoint/ src/cli/ | grep -v 'import\|state.ts'` returns expected call sites only (engineHook.ts + state.ts test imports)
- `pnpm exec biome check src/checkpoint/engineHook.ts` exit 0

### T2.4 — NEW `tests/checkpoint/state-lock.test.ts` (~80-100L; TDD R10.2 lock core)

**Action**: Create TDD test file BEFORE T2.2 implementation. Sister tests/checkpoint/state.test.ts vi.mock node:fs/promises pattern延袭 + add vi.mock proper-lockfile. 5 cells:

```typescript
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const lockMock = vi.fn()
const releaseMock = vi.fn()
vi.mock('proper-lockfile', () => ({ default: { lock: lockMock, check: vi.fn() } }))
// ... existing fs/promises mock ...

describe('R10.2 concurrent write lock', () => {
  beforeEach(() => { lockMock.mockReset(); releaseMock.mockReset(); lockMock.mockResolvedValue(releaseMock) })
  afterEach(() => vi.clearAllMocks())

  it('cell 1 — serial writes complete via writeCurrentWorkflow', async () => { /* ... */ })
  it('cell 2 — concurrent two writeCurrentWorkflow calls serialize via lock mock setTimeout 50ms', async () => {
    const order: number[] = []
    lockMock.mockImplementation(async () => {
      order.push(1)
      await new Promise(r => setTimeout(r, 50))
      order.push(2)
      return releaseMock
    })
    // ... await Promise.all([write1, write2]) ... expect(order).toContain(1) ...
  })
  it('cell 3 — lock rejected ELOCKED → LockHeldError with verbatim message', async () => {
    const e: NodeJS.ErrnoException = new Error('Lock file is already being held'); e.code = 'ELOCKED'
    lockMock.mockRejectedValue(e)
    await expect(writeCurrentWorkflow(/* ... */)).rejects.toThrow(/another harnessed process holds the lock/)
    await expect(writeCurrentWorkflow(/* ... */)).rejects.toThrow(/harnessed status/)
  })
  it('cell 4 — release() called in finally even on writeFile throw', async () => { /* ... */ })
  it('cell 5 — mkdir(.harnessed, recursive) called BEFORE lock acquire', async () => { /* ... */ })
})
```

**Sneak-block**: MUST write tests BEFORE T2.2 implementation (RED state); MUST mock proper-lockfile (NOT real lockfile — test isolation + CI matrix safety); MUST verify LockHeldError message contains both 'another harnessed process' AND 'harnessed status' substrings.

**Acceptance**:
- `corepack pnpm test -- tests/checkpoint/state-lock.test.ts --run` exit 0
- 5 cells PASS
- `wc -l tests/checkpoint/state-lock.test.ts` ≤ 200

### T2.5 — MODIFY `src/cli/status.ts` (~+20-25L; D-07 lock holder display)

**Action**: Append lock status section after existing readState output per PATTERNS § status.ts + RESEARCH § 3.4:

```typescript
// src/cli/status.ts — MODIFY (31L→55-70L ≤200L)
import lockfile from 'proper-lockfile'
import { stat } from 'node:fs/promises'
// ... existing imports ...

// Inside action() after existing readState output:
try {
  const isLocked = await lockfile.check('.harnessed', { lockfilePath: '.harnessed/.lock', stale: 10_000 })
  if (isLocked) {
    const s = await stat('.harnessed/.lock')
    const ageMs = Date.now() - s.mtime.getTime()
    const stale = ageMs > 10_000
    console.log(`\nlock: held (since ${s.mtime.toISOString()})${stale ? ' — STALE' : ''}`)
    console.log('  to release: wait for process to finish or delete .harnessed/.lock')
  } else { console.log('\nlock: free') }
} catch { /* .harnessed absent = no lock; silent */ }
```

**Sneak-block**: MUST NOT add --force flag (D-07 LOCKED reject); MUST silently handle missing `.harnessed/` (no error log); MUST display 'STALE' suffix when mtime > 10s.

**Acceptance**:
- `wc -l src/cli/status.ts` ≤ 200
- `grep "lockfile.check" src/cli/status.ts` returns 1 hit
- `grep -E "STALE|stale\?:" src/cli/status.ts` returns ≥1 hit
- `pnpm build && node dist/cli.js status` runs without crash

### T2.6 — NEW `docs/adr/0021-state-lock-and-audit-consumer.md` (~120-160L PRIMARY 9-section ADR)

**Action**: Create 9-section ADR sister docs/adr/0018-routing-audit-log.md 218L 100% reuse adapted Phase 5.1 scope. Sections per PATTERNS § ADR 0021 outline.

**Sneak-block**: MUST NOT split into multiple ADRs (single PRIMARY for both R10.1 + R10.2 — coherent architectural decision); MUST cross-reference ADR 0018 producer + ADR 0019/0020 backfill; MUST include `## A7 Conservation` section with verify command verbatim.

**Acceptance**:
- `wc -l docs/adr/0021-state-lock-and-audit-consumer.md` between 120-200
- All 9 sections present (grep 'Status|Context|Decisions|A7 Conservation|Consequences|Compliance|Errata|Adoption|References')
- 8 D-decisions § 1-8 verbatim present
- `pnpm exec biome check docs/adr/0021-*.md` skipped (markdown — N/A)

### T2.7 — MODIFY `docs/adr/README.md` (~+1 row index)

**Action**: Append ADR 0021 entry after 0020 row per sister Phase 3.4 single-add cadence延袭.

**Acceptance**:
- `grep '\[0021\].*Phase 5.1' docs/adr/README.md` returns 1 hit

### T2.8 — MODIFY `.github/workflows/ci.yml` (**CRITICAL RETROACTIVE FIX** A7 iter 0018→0021)

**Action**: 4 surgical edits per RESEARCH § 5 critical finding:

```yaml
# Line 82: step name
# OLD: name: A7 守恒 — ADR 0001-0018 main body 守恒
# NEW: name: A7 守恒 — ADR 0001-0021 main body 守恒

# Line 85: first for loop
# OLD: for n in 0001 0002 ... 0017 0018; do
# NEW: for n in 0001 0002 ... 0017 0018 0019 0020 0021; do

# Line 96: second for loop — same expansion

# Line 107: echo
# OLD: echo "A7 ✅ ADR 0001-0018 main body unchanged"
# NEW: echo "A7 ✅ ADR 0001-0021 main body unchanged"
```

**STRICT ordering**: ci.yml commit + push BEFORE adr-0021-accepted tag creation per STRIDE D mitigation + sister Phase 4.3 T2.4 pattern. Tags adr-0019-accepted + adr-0020-accepted MUST exist (T0.4 BLOCKER cleared) BEFORE A7 iter expansion.

**Sneak-block**: MUST verify 0001-0020 main body 0 diff BEFORE iter (`git diff <initial-commits>..HEAD docs/adr/000[1-9]-*.md docs/adr/001[0-9]-*.md docs/adr/0020-*.md | wc -l` == 0); MUST NOT push tags before this commit.

**Acceptance**:
- `grep -E '0019.*0020.*0021' .github/workflows/ci.yml` returns 2 hits (both for loops)
- `grep 'ADR 0001-0021' .github/workflows/ci.yml` returns ≥ 2 hits (step name + echo)
- 0001-0020 main body 0 diff verified pre-iter
- T0.4 baseline tags exist BEFORE this commit

### T2.9 — MODIFY `CHANGELOG.md` (~+8-12L; v0.5.0-alpha.1 entry)

**Action**: Add `## [0.5.0-alpha.1] - 2026-05-20` section after [Unreleased] per Keep-a-Changelog format sister Phase 4.3 W2 T2.5 cadence延袭.

**Acceptance**:
- `grep '\[0.5.0-alpha.1\]' CHANGELOG.md` returns ≥ 1 hit
- Sections `### Added` + `### Changed` present

### T2.10 — MODIFY `.planning/STATE.md` (Phase 5.1 SHIPPED 续编 + v0.5.0 1/3 PROGRESS)

**Action**: Update 当前位置 block + 进度 17/20→18/20 + v0.5.0 milestone row 0/3→1/3 PROGRESS + 关键决策记录 add D-01 through D-08 entries.

**Acceptance**:
- `grep 'Phase 5.1 SHIPPED' .planning/STATE.md` returns ≥ 1 hit
- `grep 'v0.5.0.*1/3.*PROGRESS' .planning/STATE.md` returns ≥ 1 hit
- `wc -l .planning/STATE.md` ≤ SIZE_LIMIT (175 or 150 per T0.2 path)

### T2.11 — MODIFY `.planning/RETROSPECTIVE.md` (Phase 5.1 retrospective 7-section append)

**Action**: Append Phase 5.1 retrospective 7-section sister Phase 4.3 W2 T2.7 format 100% reuse (NOT cross-milestone — v0.5.0 cross-milestone close 留 Phase 5.3).

**Acceptance**:
- `grep '## Phase 5.1 Retrospective' .planning/RETROSPECTIVE.md` returns 1 hit
- 7 sections present (What Worked / Inefficient / Key Lessons / Patterns Established / Tech Debt / Cost Patterns / Disposition)

### T2.12 — MODIFY `.planning/ROADMAP.md` (Phase 5.1 SHIPPED literal + v0.5.0 1/3 PROGRESS)

**Action**: Add Phase 5.1 SHIPPED bullet per sister L130 v0.3.0 + L185 v0.4.0 + L223 Phase 4.3 SHIPPED literal cadence延袭. Update v0.5.0 milestone row.

**Acceptance**:
- `grep 'Phase 5.1.*SHIPPED' .planning/ROADMAP.md` returns ≥ 1 hit

### T2.13 — MODIFY `PROJECT-SPEC.md` (Status header Phase 5.1 SHIPPED)

**Action**: L3 Status header add Phase 5.1 SHIPPED literal sister FRONT_MATTER_DOCS pattern延袭.

**Acceptance**:
- `grep 'Phase 5.1.*SHIPPED' PROJECT-SPEC.md` returns ≥ 1 hit

### T2.14 — MODIFY `README.md` (L9 Status + shipped phase list row)

**Action**: L9 Status freshness + Phase 5.1 row append shipped phase list.

**Acceptance**:
- `grep 'Phase 5.1' README.md` returns ≥ 1 hit

### T2.15 — NEW `.planning/phase-5.1/DOGFOOD-T2.X.md` (~60-70L 3-axis empirical evidence)

**Action**: 3-axis verify sister Phase 4.3 DOGFOOD-T2.X.md 60L format 100% reuse adapted Phase 5.1 scope: (A) R10.1 + (B) R10.2 + (C) Ship cadence.

**Acceptance**:
- File present ~60-70L
- 3 axes documented PASS
- All verify commands cited (wc -l + grep + manual smoke + git diff)

### T2.16 — LOCAL CREATE dual baseline tag adr-0021-accepted + v0.5.0-alpha.1-audit-lock (NO push)

**Action**:
```bash
git tag -a adr-0021-accepted HEAD -m "Phase 5.1 W2 — ADR 0021 PRIMARY (R10.1 audit-log consumer + R10.2 state.ts lock + ci.yml A7 iter 0018→0021 retroactive 0019+0020 close Phase 4.3 ship gap)"
git tag -a v0.5.0-alpha.1-audit-lock HEAD -m "Phase 5.1 baseline tag — R10.1 + R10.2 + ADR 0021 + W0 sub-batch #BF+#BG (LOCAL CREATE NO push per CLAUDE.md commit safety)"

# Verify NO push
git ls-remote origin refs/tags/adr-0021-accepted   # MUST return empty
git ls-remote origin refs/tags/v0.5.0-alpha.1-audit-lock   # MUST return empty
```

**Sneak-block**: MUST NOT push tags (CLAUDE.md commit safety); MUST NOT create 🎯 v0.5.0 milestone tag (留 Phase 5.3 milestone close); STRICT ordering — tags created AFTER T2.8 ci.yml A7 iter commit.

**Acceptance**:
- `git tag -l | grep -E 'adr-0021-accepted|v0.5.0-alpha.1-audit-lock'` returns both
- `git ls-remote origin refs/tags/v0.5.0-alpha.1-audit-lock` returns empty
- NO `🎯 v0.5.0` tag created (verify `git tag -l 'v0.5.0' | wc -l` == 0)

---

## § 5 — Verification + Acceptance Criteria (R10.1 + R10.2 verbatim)

### R10.1 verbatim acceptance (per ROADMAP L259)
```bash
# 1. harnessed audit-log --filter exit 0 + outputs engineering records
harnessed audit-log --filter '.category=="engineering"' --tail 10
# Expected: exit 0 + output contains engineering routing records (or empty if Phase 4.3 audit.log empty — fall-back seed)

# 2. --tail N flag
harnessed audit-log --tail 5
# Expected: exit 0 + 5 records max

# 3. --json full 12-field output
harnessed audit-log --tail 1 --json
# Expected: exit 0 + JSON pretty-print with all 12 fields

# 4. Redact verify all 5 patterns map [REDACTED]
# (manual: seed audit.log with task_excerpt containing each pattern; verify output)
```

### R10.2 verbatim acceptance (per ROADMAP L260)
```bash
# Concurrent harnessed resume × 2 — second throws LockHeldError after 3 retry
(harnessed resume &) ; sleep 0.05 ; harnessed resume
# Expected: first proceeds; second throws LockHeldError after ~700ms (100+200+400 retries)
# Error message: "another harnessed process holds the lock at .harnessed/.lock — wait or kill stale process (try: harnessed status)"

# harnessed status displays lock holder
harnessed status
# Expected: lock: held (since <ISO timestamp>) OR lock: free
```

### CI + cross-OS verification
```bash
# Win + Linux + macOS CI matrix
git push -u origin main   # User-controlled per CLAUDE.md commit safety
# CI matrix MUST run 3-OS green Day 1

# A7 守恒 verify
git diff <initial-commits>..HEAD docs/adr/000[1-9]-*.md docs/adr/001[0-9]-*.md docs/adr/0020-*.md | wc -l
# Expected: 0

# Test suite growth
corepack pnpm test --run
# Expected: 720+ → 730+ tests (R10.1 +8 cells + R10.2 +5 cells = +13 expected)
```

---

## § 6 — Risk Matrix (sister RESEARCH § 6 + Phase 5.1 specific)

| # | Risk | Severity | Probability | Mitigation |
|---|------|----------|-------------|------------|
| **R-01** | **ci.yml A7 retroactive fix — 0019/0020 main body history diff between Phase 4.3 ship and Phase 5.1 A7 iter** | **HIGH** | LOW | T0.4 BLOCKER precedence + pre-iter verify `git diff <initial>..HEAD docs/adr/0019-*.md docs/adr/0020-*.md | wc -l` == 0 + baseline tags pinned to initial-commit hash (NOT HEAD) per Phase 4.3 ship intent reconstruction; if diff non-zero → HALT investigate before iter |
| **R-02** | **proper-lockfile ESM compat with tsup build (`"type":"module"`)** | MED | MED | RESEARCH § A1 ASSUMPTION; T2.1 acceptance `pnpm build && node dist/cli.js audit-log --help` smoke import; fallback `createRequire(import.meta.url)` wrapper ~5L if default import fails |
| **R-03** | **jq absent on Win CI runner — R10.1 tests fail Win matrix** | MED | MED | T1.2 vi.mock spawn (NOT real jq) per RESEARCH § A5 preferred path; CI step `winget install jqlang.jq` optional for integration smoke (DOGFOOD-T2.X.md manual axis only) |
| R-04 | W0 sub-batch #BF+#BG scope creep beyond pure refactor | LOW | LOW | T0.3 sneak-block "pure refactor NO behavior change"; Biome preempt + full test suite green gate post-extract |
| R-05 | audit-log.ts exceeds 200L Karpathy hard limit | MED | MED | T1.1 acceptance `wc -l ≤ 200`; if pressure → extract `src/cli/lib/audit-redact.ts` helper (~30L) keeping audit-log.ts as orchestrator |
| R-06 | Double-lock deadlock state.ts withLock + engineHook withLock | HIGH | LOW | T2.3 sneak-block "engineHook-level lock OR state.ts self-lock, NOT both"; verify A4 ASSUMPTION via grep direct callers |
| R-07 | Triple tag premature push | MED | LOW | T2.16 sneak-block "NEVER push" + `git ls-remote` verify empty + CLAUDE.md commit safety |
| R-08 | STATE size flip T0.2 fails (>160L blocked path) | LOW | LOW | T0.2 decision tree HALT escalate; sister Phase 4.3 W0.1 trim 25-22L estimate provides margin |

**Top 2 HIGH risks**: R-01 ci.yml A7 retroactive (T0.4 BLOCKER + pre-iter diff verify) + R-06 double-lock deadlock (T2.3 single-level lock decision).

---

## § 7 — W0 Sub-batch ABSORB Rationale (#BF + #BG, sister #BQ Phase 4.3 planner discretion)

**Decision**: ABSORB both #BF (runArgs 3-installer) + #BG (err() 7-file) in Phase 5.1 W0 T0.3.

**Rationale**:
1. **4-phase carry-forward**: Both items carried Phase 2.2 → 4.2 → 4.3 → 5.1 (4-phase carry-forward = longest pending MED items)
2. **Phase 5.1 NEW src/installers/ work bypass**: Phase 5.1 NEW src/cli/audit-log.ts + state.ts MODIFY but installer files untouched → atomic refactor in installer-adjacent W0 sub-batch
3. **Pure refactor LOW risk**: Identical 3 + 7 file duplicates extract NO logic change; Biome preempt + full test suite green gate
4. **Karpathy single-SoT principle**: Eliminates future divergence risk (7 separate err() fns could drift; 3 separate runArgs() too)
5. **Sister Phase 4.3 W0 cadence延袭**: Phase 4.3 W0.2 SIZE_LIMIT FLIP + W0.1 D2 trim absorb compound; Phase 5.1 W0 expands sub-batch scope per sister #BQ planner discretion

**ALTERNATIVE rejected**:
- Defer to Phase 5.2 — 5th-phase carry-forward starts looking like indefinite defer
- Single absorb (only #BG NOT #BF) — both same nature + same cost both ABSORB
- Wave B separate atomic refactor — Wave B doesn't exist Phase 5.1 (3-wave structure Wave 0 + 1 + 2)

**Risk monitor**: Wave B scope creep — T0.3 sneak-block "pure refactor NO behavior change" + Biome preempt gate + full test suite green gate guard.

---

## § 8 — Architectural Responsibility Map (sister RESEARCH § Map)

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| R10.1 audit-log read + render | CLI (src/cli/audit-log.ts) | — | Consumer of JSONL SoT; no engine involvement |
| R10.1 jq filter invoke | CLI subprocess | OS jq binary | doctor 3rd check verifies jq present |
| R10.1 redact 5 patterns | CLI (pre-render) | — | Defense-in-depth; output boundary |
| R10.2 lock acquire/release | Checkpoint layer (state.ts withLock) | engineHook transitive | All .harnessed/* writes go through state.ts |
| R10.2 lock holder display | CLI (status.ts enhance) | proper-lockfile check | D-07: UX display of held lock + stale auto-detect |
| W0 #BF runArgs extract | Installer lib (new lib/runClaudeArgs.ts) | 3 installer files | Dedup 3 identical private fns |
| W0 #BG err() extract | Installer lib (new lib/err.ts) | 7 installer files | Dedup 7 identical private fns |
| W2 T0.4 retroactive baseline tags | Git tags (local) | docs/adr/0019/0020-*.md initial-commit hash | Close Phase 4.3 ship gap; BLOCKER for ci.yml A7 iter |

---

## § 9 — Success Criteria (Phase 5.1 ship complete when)

- [ ] Wave 0: T0.1-T0.4 complete (cadence iter 5 trim + conditional flip + sub-batch absorb + retroactive baseline tags)
- [ ] Wave 1: T1.1-T1.4 complete (audit-log.ts ≤200L + tests 8+ cells TDD pass + cli.ts register + DOGFOOD-T1.X.md)
- [ ] Wave 2: T2.1-T2.16 complete (proper-lockfile dep + state.ts withLock + engineHook + tests 5 cells + status.ts + ADR 0021 + README + ci.yml A7 iter + CHANGELOG + STATE + RETROSPECTIVE + ROADMAP + PROJECT-SPEC + README + DOGFOOD-T2.X.md + dual tag LOCAL CREATE)
- [ ] R10.1 acceptance: `harnessed audit-log --filter '.category=="engineering"' --tail 10` exit 0 + output contains engineering records
- [ ] R10.2 acceptance: 2-process concurrent `harnessed resume` second throws LockHeldError after 3 retry (~700ms total)
- [ ] CI Win+Linux+macOS green Day 1
- [ ] Tests baseline 720+ → 730+ (R10.1 +8 + R10.2 +5)
- [ ] 0001-0020 main body 0 diff verified (`git diff <initial>..HEAD ... | wc -l` == 0)
- [ ] ci.yml A7 iter 0018→0021 (both for loops include `0019 0020 0021`)
- [ ] All 8 D-decisions implemented per LOCKED spec (D-01 through D-08)
- [ ] M-01 ARCHITECTURAL phase class full ship cadence applied (ADR 0021 + ci.yml A7 + dual tag)
- [ ] DOGFOOD 3/3 axes PASS (DOGFOOD-T2.X.md)
- [ ] Biome preempt verified all TS commits
- [ ] NO push (all tags LOCAL CREATE; user controls per CLAUDE.md commit safety)
- [ ] v0.5.0 milestone row 0/3 STARTING → 1/3 PROGRESS (NOT close — Phase 5.3 close)

---

## § 10 — Output Contract

After ship, create `.planning/phases/5.1/5.1-01-SUMMARY.md` (sister Phase 4.3 SUMMARY cadence延袭) documenting:
- Atomic commits actual count vs estimate
- Wave timing actual vs target (1-1.5 day window)
- DEFERRED carry-forward Phase 5.2+ (if T0.2 defer path active: #BA round 4)
- Tests baseline final count
- All 8 D-decisions activation evidence + sneak-block enforcement
- M-01 ARCHITECTURAL phase class full ship cadence evidence
- Critical retroactive A7 fix verification
