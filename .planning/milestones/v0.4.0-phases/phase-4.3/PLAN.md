---
phase: 4.3
version: 1
status: ready
type: phase
plan: 1
wave: 0
depends_on: [phase-4.2]
gap_closure: false
autonomous: true

# Frontmatter sister Phase 4.2 PLAN.md 522L 100% template reuse — adapted Phase 4.3 architectural + milestone close scope
# Phase 4.3 = v0.4.0 milestone 3/3 CLOSE (M-01 ARCHITECTURAL phase class LOCK NOT R-5 publish-only sister Phase 4.1+4.2)
# 4 D-decisions LOCKED (CONTEXT 4.3-CONTEXT.md L28-99): D-01 JSONL append-only + 11-field routing-decision schema / D-02 NEW forward-only from Phase 4.3 ship (NOT backfill Phase 1-4 history) / D-03 ADR 0018 PRIMARY + ADR 0019-0020 institutional pattern lock backfill (+ optional 0021) / D-04 CHANGELOG.md + triple tag sister v0.3.0 close cadence延袭
# M-01 LOCKED (CONTEXT L18-25): PhaseClass ARCHITECTURAL — full ship cadence ADR 0018 + ci.yml A7 step iter 0017→0018 + triple tag (sister v0.3.0 close NOT Phase 4.1/4.2 single-baseline-only)

requirements:
  - R8.1   # 路由透明度日志 — `.harnessed/audit.log` records each routing decision; user 可 grep 排错; 100% routing decisions traceable (forward-only from Phase 4.3 ship per D-02)
  - R8.4   # 公开 ADR 全集 — all 非常规决策 ADR 入仓; docs/adr/ ≥ 5 entries (current 17→20 after Phase 4.3 ship; 0018 PRIMARY + 0019-0020 backfill); index.md lists full collection

files_modified:
  # ===== W0 cadence absorb (2 项 STRICT path dep T0.1 → T0.2; W0.1 trim creates W0.2 SIZE_LIMIT flip headroom; sister Phase 4.2 W0 cadence延袭 — Phase 4.3 specifically tightens 200→175 NOT 200→150 per CONTEXT #BA round 2 relax) =====
  - .planning/STATE.md                                          # W0.1 D2 cadence iter 4 — trim Phase 4.2 narrative (~-15-22L expected) → RETROSPECTIVE.md § ARCHIVED FROM STATE — Phase 4.2 (single-phase archive consistent with Phase 4.1 solo archive precedent per CONTEXT W0.1 sister Phase 4.0+4.1 disambiguation R-4 mitigation precedent); sister Phase 4.2 W0.1 3rd-iter terminus → Phase 4.3 W0.1 4th-iter REINFORCE stable signal beyond ≥3-iter (sister 5-recurrence terminus heuristic confirmed pattern)
  - .planning/RETROSPECTIVE.md                                  # W0.1 D2 cadence iter 4 — receive Phase 4.2 narrative section (verbatim relocate sister Phase 4.2 W0.1 step 3 cadence延袭; ALSO W2 T2.6 Phase 4.3 milestone retrospective 7-section append)
  - scripts/check-state-archive-stale.mjs                       # W0.2 CONDITIONAL D1 SIZE_LIMIT 200→175 round 2 tighten (relax from sister Phase 4.1+4.2 200→150 target per CONTEXT #BA "relax target post-2nd-cycle sister H2 AA"): IF post-W0.1 STATE ≤165L → FLIP 200→175 (10L safety headroom) / 166-175L → DEFER #BA carry-forward Phase 4.4+ W0 (3rd consecutive DEFER signal) / >175L → BLOCKED escalate
  # ===== W1 R8.1 NEW infrastructure (5 项 — Phase 4.3 architectural PRIMARY anchor) =====
  - src/audit/log.ts                                            # W1 T1.1 NEW ≤80L — JSONL append-only writer + AuditRecordSchema TypeBox + buildAuditRecord(task,decision,matched,ctx) + emitAuditRecord(record); appendFileSync('.harnessed/audit.log', JSON.stringify(record)+'\n') sister checkpoint/state.ts writeFile pattern (sync sister mkdirSync recursive parent dir guard for case audit.log first .harnessed/ write); 11 字段 schema per D-01 LOCKED (ts/phase/task_excerpt≤200char/task_sha1/matched_rule_id/primary_expert/secondary_expert/category/route_layer/outcome/session_id/iter_count); node:crypto sha1 for task_sha1 zero-dep
  - src/audit/hook.ts                                           # W1 T1.2 NEW ≤50L — thin engine integration wrapper emitAudit(task,decision,matched,ctx) calls buildAuditRecord + emitAuditRecord (sister src/checkpoint/engineHook.ts 49L PRIMARY helper extract pattern延袭; single-responsibility bridge engine.ts outcome → audit log emit); sync (NOT async — fail-soft logging path NO throw); routeLayer/outcome/sessionId/iterCount=null context
  - src/routing/engine.ts                                       # W1 T1.3 MODIFY (~+5-7L NET — surgical 2L shrink L120-122 FIRST creating budget headroom + import emitAudit from '../audit/hook.js' +1L + routeLayer determination line +1L + 4 emitAudit call sites (1 success path L189-190 + 3 error paths L193+L196+L198) +4L; ALTERNATIVE consolidation pass auditCtx single-arg via hook.ts wrapper IF budget tight); MUST verify post-MODIFY `wc -l src/routing/engine.ts` ≤ 200 Karpathy hard limit per CLAUDE.md key reminder #4 (B-06 + Phase 3.4 D-04 explicit "no B-03 5% tolerance")
  - tests/audit/log.test.ts                                     # W1 T1.4 NEW — 7 fixture cells per RESEARCH § 2.8: (1) emitAudit writes valid JSONL line Value.Check passes / (2) emitAudit appends NOT overwrites on 2nd call / (3) all 11 fields present / (4) task_sha1 40-char hex / (5) task_excerpt truncated 200 chars / (6) outcome 'complete' + 'spawn-err' map correctly / (7) mkdirSync called with dirname; sister tests/checkpoint/state.test.ts 98L vi.mock node:fs/promises pattern延袭 (adapt for sync node:fs)
  - tests/audit/hook.test.ts                                    # W1 T1.5 NEW — hook integration tests (sister tests/checkpoint/sdk-wire.test.ts engine integration test structure analog): emitAudit composes buildAuditRecord + emitAuditRecord correctly; routeLayer 'L1-keyword' when matched non-null vs 'L3-fallback' when null; outcome enum values pass through unmodified
  - docs/adr/0018-routing-audit-log.md                          # W1 T1.6 NEW ~180-200L — PRIMARY ADR 9-section errata format sister docs/adr/0017-routing-hit-rate-token-budget.md 204L 100% reuse: Status (Accepted phase 4.3 W1/W2 — 2026-05-19) + Context (R8.1 spec + R9.2 transparency + dogfood traceability) + Decisions (D-01 JSONL 11-field + D-02 forward-only + hook extract pattern + src/audit/ NEW module) + A7 Conservation (ADR 0001-0017 main body untouched; baseline tag iter 17→18 Wave 2 T2.4 落地 sister Phase 3.4 W2 T2.7) + Consequences (capability delta table NEW src/audit/log.ts + hook.ts + tests/audit/) + Compliance (F1-F8 evidence; R8.1 acceptance "100% 路由决策可追溯" satisfied from Phase 4.3 ship forward) + Errata-path note (frozen Phase 4.3; v0.5+ goes ADR 0022+ NOT 0019 which is backfill) + Adoption-confirmation + References (cross-ref ADR 0019 STATE COLLAPSE for D-02 forward-only rationale; cross-ref D-04 STATE COLLAPSE 5-recurrence terminus heuristic)
  # ===== W2 R8.4 backfill + CHANGELOG + milestone close (12 项 sister Phase 3.4 W2 11-task milestone close cadence延袭) =====
  - docs/adr/0019-state-dual-ssot-collapse-pattern.md           # W2 T2.1 NEW backfill (Phase 3.3 D-04 source) — simplified 5-section format per RESEARCH § 3.3: Status + Context (5 dual-SoT recurrences README L9/L44 + PROJECT-SPEC + STATE freshness scope + STATE 当前位置 block) + Decision (COLLAPSE pattern + single-SoT institutionalize) + Consequences (STATE.md single SoT; check-state-archive-stale.mjs 3-rules gate + check-transparency-verdicts.mjs STATE_POSITION_RE OR-fallback) + References (3.3-CONTEXT.md D-04 + RETROSPECTIVE.md § ARCHIVED FROM STATE — Phase 3.3+3.4)
  - docs/adr/0020-hybrid-2clock-disambiguation.md               # W2 T2.2 NEW backfill (Phase 4.2 D-04 source) — same simplified 5-section format: Status + Context (ROADMAP "2-3 weeks" v0.4.0 vs R8.2 "6-month co-maintainer window") + Decision (HYBRID — internal ship clock vs external organic co-maintainer clock SEPARATE; conflating would either freeze v0.4.0 6-month or prematurely close recruitment window) + Consequences (STATE.md L23 + RETROSPECTIVE § Cost patterns explicit 2-clock language; standing process for future external-dependency phases) + References (4.2-CONTEXT.md D-04 + .planning/STATE.md current L24)
  - docs/adr/README.md                                          # W2 T2.3 MODIFY ~+3 rows — append index entries 0018/0019/0020 after existing L49 row (sister Phase 3.4 ADR 0017 single-add cadence延袭 NOT triple-add 之前一次性 per CONTEXT D-03 L78); gap catchup 0009-0017 optional bonus per RESEARCH § 7 Q3 (low-effort high-transparency value but NOT required by D-03 scope — recommend ship if Wave 2 time allows)
  - .github/workflows/ci.yml                                    # W2 T2.4 MODIFY — A7 step iter 0017→0018 (RESEARCH § 3.7 + § 4.5 exact 4 surgical edits): Line 82 step name `ADR 0001-0017 main body 守恒` → `ADR 0001-0018 main body 守恒` + Line 85 first for loop add `0018` at end + Line 96 second for loop add `0018` at end + Line 107 echo `A7 ✅ ADR 0001-0017 main body unchanged` → `ADR 0001-0018`; ordering constraint per RESEARCH § 4.4: commit + push BEFORE `adr-0018-accepted` tag creation
  - CHANGELOG.md                                                # W2 T2.5 NEW ~30L Keep-a-Changelog format per RESEARCH § 4.1 + PATTERNS § 4: `# Changelog` + `[Keep a Changelog](https://keepachangelog.com/en/1.0.0/)` + `[Semantic Versioning](https://semver.org/spec/v2.0.0.html)` reference + `## [Unreleased]` + `## [0.4.0] - 2026-05-19` + `### Added` (Routing audit log R8.1 + ADR 0018/0019/0020 + CHANGELOG.md + v0.4.0 milestone archive triplet) + `### Changed` (ci.yml A7 step ADR 0001-0017→0001-0018) + GitHub release link footer; root-level NOT docs/CHANGELOG.md per Keep-a-Changelog convention + D-04 LOCK
  - .planning/STATE.md                                          # W2 T2.6 (ALREADY listed above for W0.1 trim) — ALSO touches STATE.md for Phase 4.3 SHIPPED 续编 + 当前位置 update + v0.4.0 milestone 3/3 ARCHIVED close marker + 进度 16/17 → 17/17 100% close
  - .planning/RETROSPECTIVE.md                                  # W2 T2.7 (ALREADY listed above for W0.1 archive) — ALSO append Phase 4.3 milestone retrospective 7-section sister Phase 4.2 W2 T2.2 7-section format 100% reuse + ALSO append cross-milestone v0.4.0 close trends section
  - .planning/ROADMAP.md                                        # W2 T2.8 MODIFY — Phase 4.3 ✅ SHIPPED + v0.4.0 🎯 SHIPPED ARCHIVED literal cadence延袭 (sister L38 v0.1.0 + L58 v0.2.0 + L130 v0.3.0 SHIPPED ARCHIVED literal cadence; v0.4.0 transitions 2/3 PROGRESS → 3/3 SHIPPED ARCHIVED close)
  - PROJECT-SPEC.md                                             # W2 T2.9 MODIFY — L3 Status header add Phase 4.3 SHIPPED literal + v0.4.0 milestone close marker (sister Phase 4.2 W2 T2.5 + Phase 3.4 W2 T2.6 FRONT_MATTER_DOCS transparency gate pattern延袭)
  - README.md                                                   # W2 T2.10 MODIFY — L9 Status freshness Phase 4.3 SHIPPED + v0.4.0 🎯 milestone close marker + Phase 4.3 row append shipped phase list (sister cadence延袭)
  - .planning/milestones/v0.4.0-ROADMAP.md                      # W2 T2.11 NEW — v0.4.0 chapter snapshot from .planning/ROADMAP.md L185-227 sister `.planning/milestones/v0.3.0-ROADMAP.md` format 100% reuse (Header: `# Milestone v0.4.0: dogfooding benchmark + 稳定期` + `**Status:** 🎯 SHIPPED & ARCHIVED 2026-05-19` + `**Phases:** 4.1 / 4.2 / 4.3 (3 phases)` + `**Timeline:** 2026-05-18 → 2026-05-19` + `**Git range:** v0.3.0 tag → v0.4.0 tag` + `**Milestone tags:** v0.4.0-alpha.1-benchmark / v0.4.0-alpha.2-community / v0.4.0-alpha.3-audit → 🎯 v0.4.0` + `**Audit:** .planning/milestones/v0.4.0-MILESTONE-AUDIT.md` + `## Overview` paragraph + `## Phases` with per-phase subsections)
  - .planning/milestones/v0.4.0-REQUIREMENTS.md                 # W2 T2.12 NEW — v0.4.0 requirements snapshot from .planning/REQUIREMENTS.md R8.1-R8.5 sister `.planning/milestones/v0.3.0-REQUIREMENTS.md` format 100% reuse (frozen snapshot of v0.4.0 chapter)
  - .planning/milestones/v0.4.0-MILESTONE-AUDIT.md              # W2 T2.13 NEW — milestone audit sister `.planning/milestones/v0.3.0-MILESTONE-AUDIT.md` 139L format 100% reuse + ADD § 7 R-5 mitigation rationale "Cadence Patterns" section at BOTTOM per CONTEXT #BO + RESEARCH § 4.2 (explain Phase 4.1+4.2 R-5 publish-only NO architectural decision vs Phase 4.3 ARCHITECTURAL; avoid reader misreading "v0.4.0 决策力下降"); YAML front-matter milestone 0.4.0 + 3-phase scores + tech_debt
  - .planning/phase-4.3/DOGFOOD-T2.X.md                         # W2 T2.14 NEW ~55-60L 3-axis empirical evidence sister Phase 4.2 DOGFOOD-T2.X.md 58L format 100% reuse: (A) R8.1 audit log infra — src/audit/log.ts ≤80L + hook.ts ≤50L + engine.ts ≤200L Karpathy hard + tests/audit/ 7+ fixtures pass + manual emit smoke test verify .harnessed/audit.log created + JSON.parse 11-field schema validate (B) ADR backfill cluster — docs/adr/0018-0020 NEW 3 files present + 9-section format 0018 + 5-section format 0019/0020 + README.md index +3 rows + ci.yml A7 step iter 0017→0018 verify grep `0018` in both for loops (C) v0.4.0 milestone close cluster — CHANGELOG.md NEW Keep-a-Changelog format + 3-file milestone archive triplet + ROADMAP Phase 4.3 ✅ SHIPPED + v0.4.0 3/3 ARCHIVED close marker + triple tag LOCAL CREATE (adr-0018-accepted + v0.4.0-alpha.3-audit + 🎯 v0.4.0)
  # ===== W2 tag creation (LOCAL CREATE ONLY per CLAUDE.md commit safety; user controls all push) =====
  # NOTE: Tags are NOT files but listed here for completeness; W2 T2.15 triple-tag LOCAL CREATE only sister Phase 3.4 W2 T2.12 cadence延袭

threats_open:
  # STRIDE per RESEARCH § 8 (R-1 audit log + R-2 ADR backfill semantic + R-3 STATE size unreachable + R-4 2-day estimate; ADD Phase 4.3 specific audit.log file-write threats per <security_threat_model> requirement)
  - threat: audit.log file write — path traversal via task.task content containing `..\..\.harnessed\audit.log` escape attempt
    stride: T  # Tampering
    mitigation: AUDIT_PATH hardcoded string constant in src/audit/log.ts (NOT derived from task input); `.harnessed/audit.log` literal; task.task value only enters `task_excerpt` and `task_sha1` fields (data only, NOT path components); planner T1.1 acceptance grep `const AUDIT_PATH = '.harnessed/audit.log'` exact match + `! grep "AUDIT_PATH.*join\|AUDIT_PATH.*concat"` exit 0 (no path manipulation from task input)
  - threat: audit.log symlink swap (attacker pre-creates `.harnessed/audit.log` as symlink to `/etc/passwd` or `~/.ssh/authorized_keys` before harnessed first run)
    stride: T  # Tampering
    mitigation: appendFileSync follows symlink per POSIX semantics — DEFENSE-IN-DEPTH NOT applicable Phase 4.3 (single-maintainer dogfood + .harnessed/ user-controlled dir; NOT externally writable surface); ADR 0018 documents "No symlink defense; .harnessed/ assumed user-controlled; multi-user scenarios deferred v0.5+ if signal arrives"; sister #BU state lock defer rationale延袭
  - threat: audit.log concurrent write race (two simultaneous harnessed runs interleave JSONL lines)
    stride: T  # Tampering
    mitigation: appendFileSync OS-level atomic for writes < PIPE_BUF (~4KB on Linux/Win NTFS via O_APPEND); audit records ~200-400 bytes well within atomic range; ADR 0018 documents "No explicit lock mechanism; atomic append via O_APPEND sufficient for single-maintainer phase; multi-process concurrent access deferred v0.5+" sister #BU defer rationale (RESEARCH § 8 R-1); planner T1.1 acceptance verify `appendFileSync` used (NOT createWriteStream which buffers); NO concurrent test Phase 4.3 (deferred per #BU)
  - threat: audit.log content — PII/secret leak via task_excerpt or matched_rule_id containing user data
    stride: I  # Info Disclosure
    mitigation: D-01 LOCKED sneak-blocks PRE-MITIGATE: NO full agentDef 14-field dump (敏感 path 用户名 leak) + NO subagent text/result body (sensitive code leak) + NO MCP secrets / env vars; task_excerpt truncated 200 char limits exposure surface; task_sha1 is one-way hash (NOT reversible); matched_rule_id/primary_expert/category are routing metadata NOT user content; planner T1.1 acceptance grep verify schema definition does NOT include `agentDef\|result\|subagent\|env\|secret` fields; tests verify 11 fields exact (no extra fields per `additionalProperties: false` TypeBox)
  - threat: audit.log log injection — attacker crafts task.task with literal `\n{"ts":"FAKE",...}` to inject fake JSONL records
    stride: T  # Tampering
    mitigation: JSON.stringify() ENCODES newlines as `\n` literal (not raw newline) — built-in protection; tests/audit/log.test.ts fixture 8 (NEW per planner discretion add) verifies task.task containing raw `\n` results in encoded `\\n` in audit.log line + only 1 line appended (not 2); RESEARCH § 8 R-1 implicit but explicit grep verify post-write `wc -l .harnessed/audit.log` matches expected emit count
  - threat: ADR backfill A7 守恒 violation (executor accidentally edits ADR 0001-0017 main body during 0018/0019/0020 NEW file creation)
    stride: T  # Tampering
    mitigation: A7 CI gate is HARD CI gate (RESEARCH § 8 R-2); executor MUST verify `git diff docs/adr/000[1-9]-*.md docs/adr/001[0-7]-*.md | wc -l` == 0 BEFORE `adr-0018-accepted` tag creation (W2 T2.15 acceptance); README.md update is SAFE (not numbered file pattern); NEW files 0018/0019/0020 not in A7 gate until tag pushed
  - threat: ci.yml A7 iter ordering — `adr-0018-accepted` tag pushed BEFORE ci.yml A7 step updated to include 0018 → A7 gate fails on next CI run
    stride: D  # Denial of Service (workflow block)
    mitigation: STRICT ordering constraint per RESEARCH § 4.4: ci.yml A7 update commit + push MUST precede `adr-0018-accepted` tag creation; W2 task ordering enforces T2.4 (ci.yml A7 iter) → T2.15 (triple tag LOCAL CREATE); planner T2.15 acceptance verify `git log .github/workflows/ci.yml` shows commit ≥1 BEFORE tag timestamp; reviewer manual check W2 T2.4 commit hash < W2 T2.15 tag annotation timestamp
  - threat: triple tag premature push (user attempts push BEFORE Phase 4.3 ship + DOGFOOD verify)
    stride: R  # Repudiation (audit trail integrity)
    mitigation: CLAUDE.md commit safety NEVER push without user explicit approval (sister Phase 4.1+4.2 LOCAL CREATE 待 push 模式延袭 per CONTEXT D-04 sneak block #3); W2 T2.15 LOCAL CREATE only `git tag -a` (NO `git push --tags`); planner T2.15 acceptance `git ls-remote origin refs/tags/v0.4.0-alpha.3-audit` returns empty (verify NO push); user-controlled push timing post-DOGFOOD verify

must_haves:
  # ===== 4 D-decisions verbatim (CONTEXT 4.3-CONTEXT.md L28-99 LOCKED — 0 sneak tolerance) =====
  decisions:
    - id: D-01
      lock: AuditFormat JSONL append-only + 11-field routing-decision schema (.harnessed/audit.log)
      sneak-block: |
        planner / executor MUST NOT use JSON array (rewrite-overhead append-unsafe under concurrent write)
        planner / executor MUST NOT do multi-format dual-write (维护 2x; JSONL 双兼 machine + human)
        planner / executor MUST NOT dump full agentDef 14-field (敏感 path 用户名 leak + 体积爆炸)
        planner / executor MUST NOT log subagent text/result body (sensitive code leak + 体积)
        planner / executor MUST NOT log MCP secrets / env vars
        planner / executor MUST use 11 fields exact per CONTEXT L34-43 (ts/phase/task_excerpt/task_sha1/matched_rule_id/primary_expert/secondary_expert/category/route_layer/outcome/session_id/iter_count); additionalProperties:false enforce
        planner / executor MUST use src/audit/log.ts NEW module (NOT src/cli/audit.ts which is manifest audit naming conflict per RESEARCH § 2.2 + CONTEXT § Code Context)
    - id: D-02
      lock: BackfillScope NEW forward-only from Phase 4.3 ship (NOT backfill Phase 1-4 history)
      sneak-block: |
        planner / executor MUST NOT do git log reconstruction (commit msg ≠ routing decision; routing didn't exist as logged event Pre-Phase-4.3)
        planner / executor MUST NOT manually backfill PLAN D-* (semantic mismatch — PLAN D-* = implementation decision; audit.log = routing decision)
        planner / executor MUST NOT do partial Phase 4.x only retrofit (split history confusing + arbitrary cutoff)
        ADR 0018 MUST explicit include "audit.log starts forward; prior decisions remain in PLAN.md / CONTEXT.md / RETROSPECTIVE.md SoT" section (cross-ref ADR 0019 STATE COLLAPSE lesson per CONTEXT D-02 L63)
        守 single-SoT institutionalize per Phase 3.3 D-04 COLLAPSE 5-recurrence terminus 教训; audit.log = NEW SoT for routing-decision dimension NOT 重复 implementation-decision SoT
    - id: D-03
      lock: ADRBackfillScope ADR 0018 PRIMARY + ADR 0019 STATE COLLAPSE + ADR 0020 HYBRID 2-clock backfill (+ optional ADR 0021 D2 cadence iter institutionalize)
      sneak-block: |
        planner / executor MUST NOT do 全 D-decision audit (Phase 1-4 共 ~50+ D-decisions; 多数 implementation detail 不值 ADR 化)
        planner / executor MUST NOT do publish-only mode (违 R8.4 verbatim "全集" 含 backfill 隐含 per CONTEXT D-03 L77)
        planner / executor MUST NOT retroactive sneak-rewrite existing 0001-0017 (sister ADR A7 main body 永久守恒 ci.yml gate 强制 per A7 acceptance bar)
        planner / executor MUST use NEW sequential numbers 0019/0020 (NOT retro-inject 0014.x or alike — sister sequential numbering convention延袭)
        docs/adr/README.md index update sister Phase 3.4 ADR 0017 single-add cadence延袭 NOT triple-add 之前一次性 (CONTEXT D-03 L78)
        ADR 0021 OPTIONAL — ship 3 mandatory (0018+0019+0020) first; 0021 bonus IF Wave 2 time allows
    - id: D-04
      lock: ReleaseCadence CHANGELOG.md + GitHub release + triple tag sister v0.3.0 close cadence延袭
      sneak-block: |
        planner / executor MUST NOT add docs/RELEASES.md (重复 CHANGELOG SoT — Karpathy single-SoT principle per CONTEXT D-04 L95)
        planner / executor MUST NOT do single-baseline-only tag (违 M-01 ARCHITECTURAL phase class lock — full ship cadence triple tag required)
        planner / executor MUST NOT auto-push triple tag (CLAUDE.md commit safety: NEVER push without user explicit approval — sister Phase 4.1+4.2 LOCAL CREATE 待 push 模式延袭)
        Triple tag order STRICT: (1) adr-0018-accepted (PRIMARY ADR lock; ci.yml A7 ref pinpoint) → (2) v0.4.0-alpha.3-audit (Phase 4.3 single baseline tag) → (3) 🎯 v0.4.0 (milestone close tag) per RESEARCH § 4.4
        CHANGELOG.md Keep-a-Changelog manual init NOT Conventional Changelog auto-gen (no changelog-cli dep YAGNI per CONTEXT § Open Q + RESEARCH § 4.1)
        3-file milestone close archive triplet MANDATORY (v0.4.0-ROADMAP.md + v0.4.0-REQUIREMENTS.md + v0.4.0-MILESTONE-AUDIT.md) sister v0.3.0 close cadence延袭

  # ===== M-01 meta-decision verbatim (CONTEXT L18-25 LOCKED — 0 sneak tolerance) =====
  meta_decisions:
    - id: M-01
      lock: PhaseClass ARCHITECTURAL (NOT R-5 publish-only sister Phase 4.1+4.2)
      sneak-block: |
        planner / executor MUST NOT treat Phase 4.3 as R-5 publish-only (sister Phase 4.1+4.2 mode); Phase 4.3 = ARCHITECTURAL phase NEW src/ + ADR + tag triple per M-01 LOCK
        Full ship cadence applies: ADR 0018 PRIMARY + ci.yml A7 step iter 0017→0018 + triple tag (NOT Phase 4.1/4.2 single-baseline-only pattern)
        Sister v0.3.0 close cadence延袭 (NOT sister Phase 4.1/4.2 single-baseline cadence); Phase 4.3 = 1-phase milestone close NOT 4-phase v0.3.0 parallel

  # ===== W0 cadence absorb 2 项 (sister Phase 4.2 W0 cadence延袭; #BA round 2 relax 200→175 NOT 200→150 per CONTEXT) =====
  w0_backlog:
    - id: W0.1 (sister M2 D2 cadence iter 4 verify — REINFORCE ≥3-iter terminus stable signal post-Phase-4.2 3rd-iter)
      action: trim Phase 4.2 narrative → RETROSPECTIVE.md § ARCHIVED FROM STATE — Phase 4.2 (single-phase archive consistent with Phase 4.1 solo archive precedent — Phase 4.2 single-phase same rationale per R-4 cadence consistency; sister Phase 4.2 W0.1 3rd-iter terminus → Phase 4.3 W0.1 4th-iter REINFORCE pattern beyond 3-iter signal; sister 5-recurrence terminus heuristic confirmed)
      priority: HIGH
      path-dep: FIRST (reduces STATE.md size — creates W0.2 SIZE_LIMIT flip headroom per CONTEXT #BA decision tree; sister Phase 4.2 W0.1 cadence延袭)
    - id: W0.2 (DEFERRED #BA D1 SIZE_LIMIT 200→175 conditional flip — round 2 RELAX from sister 200→150 target post-2nd-cycle sister H2 AA)
      action: CONDITIONAL — IF post-W0.1 STATE ≤165L → flip 1-line surgical L12 `const SIZE_LIMIT = 200` → `const SIZE_LIMIT = 175` (10L safety headroom NOT 50L sister); 166-175L → DEFER #BA carry-forward Phase 4.4+ W0 LOW priority (3rd consecutive DEFER signal per sister Phase 4.1 + 4.2 2-iter defer chain); >175L → BLOCKED escalate
      priority: MED conditional
      path-dep: AFTER W0.1 (conditional decision tree per CONTEXT W0 backlog #BA: ≤165L → FLIP 175 / 166-175L → DEFER #BA carry Phase 4.4+ / >175L → BLOCKED)

  # ===== Observable truths (R8.1 + R8.4 goal-backward decomposition; M-01 ARCHITECTURAL full ship cadence) =====
  truths:
    # W0 truths (2 cadence)
    - "developer reads `.planning/RETROSPECTIVE.md` and finds `## § ARCHIVED FROM STATE — Phase 4.2 (Phase 4.3 W0.1 D2 cadence iter 4, 2026-05-19)` section containing verbatim relocated Phase 4.2 narrative from STATE.md (single-phase archive consistent with Phase 4.1 solo archive precedent per sister R-4 cadence consistency mitigation); HTML-comment archive marker pointer left in STATE.md trim site per sister L42 format; D2 standing process fires 4th-iter REINFORCE beyond 3rd-iter terminus stable signal (sister 5-recurrence terminus heuristic confirmed pattern stable)"
    - "developer can run `node scripts/check-state-archive-stale.mjs` post-W0.2-flip (IF flip path: SIZE_LIMIT=175 + STATE ≤165L baseline + ≤175L tolerance) and gate passes (3 rules: STATE ≤175L + 0 关键决议 ship 总结 sections + 0 W-N errata literals) — OR W0.2 defer path STATE remains ≤200L baseline with SIZE_LIMIT=200 unchanged + DEFERRED #BA carry-forward Phase 4.4+ W0 LOW priority (3rd consecutive DEFER per sister Phase 4.1 W0.5 + Phase 4.2 W0.2 cadence延袭); decision tree per CONTEXT #BA: post-W0.1 STATE ≤165L → flip safe (10L headroom) / 166-175L → defer / >175L → BLOCKED investigate W0.1 trim sufficiency"

    # W1 R8.1 NEW infrastructure truths (5 main scope artifacts — Phase 4.3 ARCHITECTURAL anchor R8.1 + ADR 0018 PRIMARY)
    - "developer reads `src/audit/log.ts` (NEW ≤80L per RESEARCH § 2.1) and finds: (a) AuditRecordSchema TypeBox per PATTERNS § 2.1 — `Type.Object({ ts, phase, task_excerpt, task_sha1, matched_rule_id, primary_expert, secondary_expert, category, route_layer, outcome, session_id, iter_count }, { additionalProperties: false })` exact 11 fields per D-01 LOCKED; (b) `export type AuditRecord = Static<typeof AuditRecordSchema>`; (c) `const AUDIT_PATH = '.harnessed/audit.log'` hardcoded literal (NOT derived from task input — STRIDE T mitigation); (d) `buildAuditRecord(task, decision, matched, ctx)` constructs record with `task_sha1 = createHash('sha1').update(task.task).digest('hex')` (node:crypto zero-dep) + `task_excerpt = task.task.slice(0, 200)` truncation + ts = new Date().toISOString(); (e) `emitAuditRecord(record)` calls `mkdirSync(dirname(AUDIT_PATH), { recursive: true })` (parent dir guard for case audit.log first .harnessed/ write) + `appendFileSync(AUDIT_PATH, JSON.stringify(record) + '\\n')` (sync atomic append per RESEARCH § 2.3 PIPE_BUF rationale); (f) sister src/checkpoint/state.ts pattern延袭 (NOT async writeFile sister — sync append for logging path NO need to await per PATTERNS § 2.1 difference); (g) wc -l ≤ 80 Karpathy hard cap"
    - "developer reads `src/audit/hook.ts` (NEW ≤50L per RESEARCH § 2.7) and finds: (a) header comment Phase 4.3 W1 T1.2 + sister engineHook.ts ≤50L extract pattern延袭 + single-responsibility bridge engine.ts outcome → audit log emit; (b) `import type { ArbitrateResult, TaskContext } from '../routing/agentDefinition.js'` + `import type { Rule } from '../routing/decisionRules.js'` + `import { buildAuditRecord, emitAuditRecord } from './log.js'`; (c) `export interface AuditHookCtx { outcome: 'complete' | 'max-iter' | 'verbatim-fail' | 'spawn-err' | 'install-err' | 'arbitrate-err'; routeLayer: 'L1-keyword' | 'L2-semantic-stub' | 'L3-fallback'; sessionId?: string; iterCount: null }` discriminated union per RESEARCH § 2.6 + PATTERNS § 2.2 (iterCount=null Phase 4.3 per RESEARCH § 7 Q2 YAGNI — ralphLoopWrap returns string only; defer iter_count v0.5+ if consumer demands); (d) `export function emitAudit(task, decision, matched, ctx): void` sync composes buildAuditRecord + emitAuditRecord; NO try-catch (fail-soft logging path); (e) wc -l ≤ 50 Karpathy hard cap sister engineHook.ts 48L precedent"
    - "developer reads `src/routing/engine.ts` (MODIFY) and finds: (a) surgical 2L shrink at L120-122 (collapse `void semantic.rule // v0.2+ feeds...` standalone noop line into prior `const semantic = await semanticMatch(...)` comment trailer OR consolidate Step 1c comment per PATTERNS § 2.3 + § 3.1 — creates +2L budget headroom); (b) ADD `import { emitAudit } from '../audit/hook.js'` after L13 existing engineHook import; (c) ADD routeLayer determination line before Step 4 spawn block: `const routeLayer: 'L1-keyword' | 'L3-fallback' = matched ? 'L1-keyword' : 'L3-fallback'` (L2 semanticRouter stub always L3 fallback per RESEARCH § 2.6); (d) ADD `emitAudit(task, decision, matched, { outcome: 'complete', routeLayer, sessionId: capturedSessionId, iterCount: null })` AFTER `await completePhase(...)` L189 BEFORE `return { ok: true, ...}` L190; (e) ADD emitAudit calls in 3 catch error paths (L193 max-iter + L196 verbatim-fail + L198 spawn-err) BEFORE each return statement per PATTERNS § 2.3 error path pattern; (f) post-MODIFY `wc -l src/routing/engine.ts` ≤ 200 Karpathy hard limit per CLAUDE.md key reminder #4 + B-06 + Phase 3.4 D-04 explicit no B-03 5% tolerance (CRITICAL — if exceeded use alternative consolidation pass auditCtx single-arg via hook.ts wrapper to reduce call-site footprint)"
    - "developer reads `tests/audit/log.test.ts` (NEW per RESEARCH § 2.8 + PATTERNS § 2.4) and finds: (a) `vi.mock('node:fs', () => ({ appendFileSync, mkdirSync }))` sync FS mock per PATTERNS § 3.4 (adapt sister node:fs/promises pattern for sync node:fs surface); (b) `const appendedLines: string[] = []` + `const mkdirSyncCalls: string[] = []` in-memory fixtures + beforeEach clear + afterEach vi.clearAllMocks(); (c) 7+ fixture cells per RESEARCH § 2.8 — (1) emitAudit writes valid JSONL line Value.Check passes / (2) emitAudit appends NOT overwrites on 2nd call / (3) all 11 fields present in emitted record / (4) task_sha1 is 40-char hex / (5) task_excerpt truncated 200 chars / (6) outcome 'complete' + 'spawn-err' map correctly / (7) mkdirSync called with dirname(.harnessed/audit.log); BONUS (8) log injection test — task.task containing literal `\\n` results in encoded `\\\\n` in JSONL line + only 1 line appended (STRIDE T mitigation per <threats_open>); `corepack pnpm test -- tests/audit/log.test.ts --run` exit 0"
    - "developer reads `tests/audit/hook.test.ts` (NEW per RESEARCH § 2.8 supplement) and finds 3+ fixture cells: (a) emitAudit composes buildAuditRecord + emitAuditRecord correctly (smoke test); (b) routeLayer 'L1-keyword' when matched non-null vs 'L3-fallback' when null; (c) outcome enum values pass through unmodified (6-value discriminated union); `corepack pnpm test -- tests/audit/hook.test.ts --run` exit 0"
    - "developer reads `docs/adr/0018-routing-audit-log.md` (NEW ~180-200L PRIMARY 9-section errata format per RESEARCH § 3.2 + PATTERNS § 2.5 sister docs/adr/0017-routing-hit-rate-token-budget.md 204L 100% reuse) and finds: (a) Status — `**Accepted (phase 4.3 W1/W2 — 2026-05-19)**` + implementation summary (NEW src/audit/log.ts ≤80L + hook.ts ≤50L + tests/audit/ 8+ fixtures + ADR 0019/0020 backfill + ci.yml A7 iter 17→18 + triple tag sister v0.3.0 close cadence延袭); (b) Context — R8.1 spec + R9.2 transparency + dogfood traceability + sister D-04 STATE COLLAPSE 5-recurrence terminus 教训 cross-ref; (c) Decisions § 1 D-01 JSONL 11-field schema + § 2 D-02 forward-only rationale + § 3 hook extract pattern + § 4 src/audit/ NEW module naming (NOT src/cli/audit.ts manifest audit collision); (d) A7 Conservation — ADR 0001-0017 main body untouched verify command + ci.yml A7 step iter 17→18 + baseline tag adr-0018-accepted Phase 4.3 W2 落地 sister Phase 3.4 W2 T2.7 cadence延袭; (e) Consequences — capability delta table (NEW src/audit/log.ts + hook.ts + tests/audit/ + .harnessed/audit.log forward-only); (f) Compliance — F1-F8 evidence (R8.1 100% 路由决策可追溯 from Phase 4.3 ship forward; NOT historical backfill per D-02); (g) Errata-path note — frozen Phase 4.3; v0.5+ goes ADR 0022+ NOTE 0019/0020 backfill so future audit sub-command goes 0022; (h) Adoption-confirmation — Phase 4.3 ship evidence + deferred items disposition; (i) References — internal (CONTEXT.md D-01-04 + ADR 0019 cross-ref + sister ADR 0017) + external (Keep-a-Changelog spec); (j) D-02 forward-only rationale section EXPLICIT 'audit.log starts forward from Phase 4.3 ship; prior decisions remain in PLAN.md / CONTEXT.md / RETROSPECTIVE.md SoT — see ADR 0019 for STATE COLLAPSE dual-SoT lesson' per CONTEXT D-02 L63"

    # W2 R8.4 backfill + CHANGELOG + milestone close truths (10 main scope)
    - "developer reads `docs/adr/0019-state-dual-ssot-collapse-pattern.md` (NEW backfill simplified 5-section format per RESEARCH § 3.3) and finds: (a) Status `**Accepted (backfill — Phase 3.3 source, ratified Phase 4.3 W2 — 2026-05-19)**`; (b) Context — 5 dual-SoT recurrences enumerated (README L9 / README L44 / PROJECT-SPEC / STATE freshness scope / STATE 当前位置 block) per Phase 3.3 D-04 source; (c) Decision — COLLAPSE pattern delete L4 frontmatter `> Status:` line + 当前位置 block becomes single SoT + scripts/check-transparency-verdicts.mjs extended STATE_POSITION_RE OR-fallback + single-SoT institutionalize standing process; (d) Consequences — STATE.md single SoT for last 2 phases + check-state-archive-stale.mjs 3-rules gate + check-transparency-verdicts.mjs STATE_POSITION_RE OR-fallback + sister M2 D2 cadence standing process iter 1→2→3→4 verified pattern stable; (e) References — `.planning/phase-3.3/3.3-CONTEXT.md` D-04 + `.planning/RETROSPECTIVE.md § ARCHIVED FROM STATE — Phase 3.3+3.4`"
    - "developer reads `docs/adr/0020-hybrid-2clock-disambiguation.md` (NEW backfill same simplified 5-section format) and finds: (a) Status `**Accepted (backfill — Phase 4.2 source, ratified Phase 4.3 W2 — 2026-05-19)**`; (b) Context — ROADMAP says `2-3 weeks` v0.4.0 vs R8.2 says `6-month co-maintainer window` semantic conflict source per Phase 4.2 D-04; (c) Decision — HYBRID two separate clocks: internal ship clock (1 phase/day verified Phase 4.1+4.2+4.3) vs external organic co-maintainer clock (6-month organic SEPARATE); conflating would either freeze v0.4.0 for 6-month OR prematurely close recruitment window per RESEARCH § 3.4; standing process for future external-dependency phases sister T3 DEFERRED #BB resolve; (d) Consequences — STATE.md L23 + RETROSPECTIVE.md § Cost patterns explicit 2-clock language ('Internal infra ship clock' + 'External co-maintainer organic clock' both literal phrases); standing process for future v0.5+ external-dependency phases; (e) References — `.planning/phase-4.2/4.2-CONTEXT.md` D-04 + `.planning/STATE.md` L24 current 2-clock disambiguation note"
    - "developer reads `docs/adr/README.md` and finds index +3 rows appended after L49 (sister Phase 3.4 ADR 0017 single-add cadence延袭 NOT triple-add 之前一次性 per CONTEXT D-03 L78): (a) `| [0018](./0018-routing-audit-log.md) | Routing Audit Log (JSONL append-only + 11-field schema + forward-only from Phase 4.3) | Accepted | 2026-05-19 |`; (b) `| [0019](./0019-state-dual-ssot-collapse-pattern.md) | STATE dual-SoT COLLAPSE Pattern (5-recurrence terminus — Phase 3.3 D-04 backfill) | Accepted | 2026-05-19 |`; (c) `| [0020](./0020-hybrid-2clock-disambiguation.md) | HYBRID 2-clock Disambiguation (internal ship vs external organic co-maintainer — Phase 4.2 D-04 backfill) | Accepted | 2026-05-19 |`; OPTIONAL bonus per RESEARCH § 7 Q3 — fill gap 0009-0017 rows IF Wave 2 time allows (low-effort high-transparency value but NOT required by D-03 scope)"
    - "developer reads `.github/workflows/ci.yml` and finds A7 step iter 0017→0018 (4 surgical edits per RESEARCH § 3.7 + § 4.5 exact line refs): (a) Line 82 step name `ADR 0001-0017 main body 守恒` → `ADR 0001-0018 main body 守恒`; (b) Line 85 first for loop add `0018` at end: `for n in 0001 0002 ... 0017 0018; do`; (c) Line 96 second for loop add `0018` at end (same addition); (d) Line 107 echo `A7 ✅ ADR 0001-0017 main body unchanged` → `A7 ✅ ADR 0001-0018 main body unchanged`; OPTIONAL Line 34 comment block ADD `Phase 4.3 ADR 0018 errata` sister Phase 3.4 cadence延袭; STRICT ordering constraint: commit + push BEFORE `adr-0018-accepted` tag creation per RESEARCH § 4.4 + STRIDE D mitigation"
    - "developer reads `CHANGELOG.md` (NEW root-level ~30L Keep-a-Changelog format per RESEARCH § 4.1 + PATTERNS § 4) and finds: (a) `# Changelog` header + `[Keep a Changelog](https://keepachangelog.com/en/1.0.0/)` + `[Semantic Versioning](https://semver.org/spec/v2.0.0.html)` reference; (b) `## [Unreleased]` empty section (forward-compat); (c) `## [0.4.0] - 2026-05-19` section; (d) `### Added` 6 bullets — Routing audit log (`.harnessed/audit.log`) JSONL append-only 11-field schema (R8.1) + ADR 0018 routing audit log architecture + ADR 0019 STATE dual-SoT collapse pattern backfill Phase 3.3 + ADR 0020 HYBRID 2-clock disambiguation backfill Phase 4.2 + CHANGELOG.md (this file) + v0.4.0 milestone archive triplet; (e) `### Changed` 1 bullet — ci.yml A7 step ADR 0001-0017 → ADR 0001-0018 integrity gate; (f) GitHub release link footer `[0.4.0]: https://github.com/easyinplay/harnessed/releases/tag/v0.4.0`; (g) NO Conventional Changelog auto-gen dep (Karpathy YAGNI no changelog-cli per RESEARCH § 4.1)"
    - "developer reads `.planning/STATE.md` (post-W0.1 D2 cadence iter 4 trim Phase 4.2 → RETROSPECTIVE + W2 T2.6 Phase 4.3 SHIPPED 续编) and finds: 当前位置 block updated with Phase 4.3 SHIPPED marker (preserve `**Phase 3.4 SHIPPED**` + `**Phase 4.2 SHIPPED**` literal STATE_POSITION_RE anchors for D-04 COLLAPSE freshness gate; ADD `✅ **Phase 4.3 SHIPPED**` prepend); 当前里程碑 v0.4.0 milestone 2/3 PROGRESS → 3/3 🎯 SHIPPED ARCHIVED close (sister Phase 3.4 W2 T2.1 cadence延袭); 下一 phase v0.5/v1.0 discuss-phase 启动 (post-milestone close); 已完成 phase ship 历史 17th entry Phase 4.3 shipped ✅ (2026-05-19); 进度 16/17 → 17/17 100% close 🎯 v0.4.0 milestone close; STATE.md size ≤175L IF W0.2 flip / ≤200L IF W0.2 defer"
    - "developer reads `.planning/RETROSPECTIVE.md` and finds Phase 4.3 milestone retrospective 7-section entry appended (sister Phase 4.2 W2 T2.2 7-section format 100% reuse): § What worked (4 D-decisions activated 闭环 + M-01 ARCHITECTURAL full ship cadence + W0.1 D2 cadence iter 4 REINFORCE ≥3-iter terminus stable signal + R8.1 NEW src/ infra ship + R8.4 ADR backfill 3-pattern lock + v0.4.0 milestone close 1-day cadence延袭) + § What was inefficient (R8.1 NEW src/ + ADR backfill + milestone close 同 phase scope inflation per CONTEXT #BR 1.5-2 day estimate; first-time NEW src/audit/ surface ~30% W1 reuse vs Phase 4.2 W1 ~78% reuse) + § Patterns established (M-01 PhaseClass ARCHITECTURAL vs R-5 publish-only meta-disambiguation pattern institutionalize standing for future external-dependency phases + ADR backfill institutional pattern lock 3-cohort precedent NEW + sister 5-recurrence terminus heuristic confirmed pattern stable beyond ≥4-iter D2 cadence) + § Cost patterns (Phase 4.3 内部 phase 1.5-2 day cadence per CONTEXT #BR — scope inflation tolerable single-phase milestone close; T3 external 6-month organic clock SEPARATE per D-04 HYBRID 仍 runs through v0.5/v1.0) + § Key lessons ((i) ARCHITECTURAL phase class requires full ship cadence ADR + A7 iter + triple tag NOT R-5 publish-only sister Phase 4.1/4.2 single-baseline; (ii) ADR backfill scope discipline 3-pattern lock NOT 全 D-decision audit; (iii) JSONL append-only forward-only single-SoT discipline per sister Phase 3.3 D-04 COLLAPSE 5-recurrence terminus 教训; (iv) engine.ts 200L hard limit surgical shrink-first pattern for code addition that would breach budget — institutionalize for future engine.ts modifications; (v) D-04 triple tag LOCAL CREATE 待 user push 模式 sister Phase 4.1+4.2+v0.3.0 close 5-tag consecutive cadence延袭) + § Cross-milestone trends (v0.4.0 milestone close 1-day cadence Phase 4.3 ship → 🎯 v0.4.0 close same day; 17/17 100% phase ship; sister v0.3.0 close 2-day cadence 比较 — v0.4.0 close more efficient single-day 3-phase milestone) + § Next Phase Prep Notes (v0.5+ discuss-phase 启动 — harnessed audit log --filter CLI subcommand consumer + DEFERRED #BU state lock + #BV uninstall command + #AH path traversal regex + benchmark expand evaluation per DEFERRED #BC); ALSO receives W0.1 D2 auto-archive Phase 4.2 narrative section"
    - "developer reads `.planning/ROADMAP.md` and finds: (a) Phase 4.3 entry L224-226 marked ✅ SHIPPED (2026-05-19) + brief outcome summary (sister Phase 4.2 L218-223 verbose 5-bullet format延袭); (b) v0.4.0 milestone progress 2/3 PROGRESS → 3/3 🎯 SHIPPED ARCHIVED close (sister L38 v0.1.0 + L58 v0.2.0 + L130 v0.3.0 SHIPPED ARCHIVED literal cadence延袭); (c) v0.5/v1.0 next milestone kickoff reference; (d) L185 v0.4.0 milestone block update Status header SHIPPED ARCHIVED + add triple tag references + audit cross-link `.planning/milestones/v0.4.0-MILESTONE-AUDIT.md`"
    - "developer reads `PROJECT-SPEC.md` L3 Status header and finds Phase 4.3 SHIPPED literal added + 🎯 v0.4.0 milestone close marker (sister Phase 4.2 W2 T2.5 + Phase 3.4 W2 T2.6 FRONT_MATTER_DOCS transparency gate pattern延袭); freshness gate post-MODIFY pass"
    - "developer reads `README.md` and finds: (a) L9 Status freshness header updated Phase 4.3 SHIPPED + 🎯 v0.4.0 milestone close marker (sister 5-recurrence terminus D-04 COLLAPSE STATUS_MARKER path延袭 — preserve single SoT L9 freshness pattern); (b) v0.4.0 row MILESTONE updated 2/3 → 3/3 🎯 SHIPPED ARCHIVED; (c) Phase 4.3 entry appended to shipped phase list; (d) freshness gate `node scripts/check-transparency-verdicts.mjs` exit 0 post-MODIFY pass (STATE_POSITION_RE OR-fallback matches Phase 4.3 SHIPPED literal)"
    - "developer reads `.planning/milestones/v0.4.0-ROADMAP.md` (NEW snapshot per RESEARCH § 4.3 + PATTERNS § 2.8 + sister v0.3.0-ROADMAP.md format 100% reuse) and finds: (a) Header `# Milestone v0.4.0: dogfooding benchmark + 稳定期`; (b) `**Status:** 🎯 SHIPPED & ARCHIVED 2026-05-19 (Frozen at v0.4.0 milestone close 2026-05-19)`; (c) `**Phases:** 4.1 / 4.2 / 4.3 (3 phases)`; (d) `**Timeline:** 2026-05-18 → 2026-05-19 (2 days, back-to-back ship sister v0.3.0 cadence)`; (e) `**Git range:** v0.3.0 tag → v0.4.0 tag`; (f) `**Milestone tags:** v0.4.0-alpha.1-benchmark / v0.4.0-alpha.2-community / v0.4.0-alpha.3-audit → 🎯 v0.4.0`; (g) `**Audit:** .planning/milestones/v0.4.0-MILESTONE-AUDIT.md — PASSED (3/3 phase verified)`; (h) `## Overview` paragraph + `## Phases` with per-phase subsections Phase 4.1/4.2/4.3 each with Goal + Plans + ship outcome + ADR ref"
    - "developer reads `.planning/milestones/v0.4.0-REQUIREMENTS.md` (NEW snapshot from REQUIREMENTS.md R8.1-R8.5 v0.4-tagged section frozen sister v0.3.0-REQUIREMENTS.md format 100% reuse) and finds all 5 v0.4-tagged requirements (R8.1 audit log + R8.2 co-maintainer + R8.3 stale-bot + R8.4 ADR 全集 + R8.5 GitHub Sponsors) verbatim with status Done frozen at v0.4.0 milestone close"
    - "developer reads `.planning/milestones/v0.4.0-MILESTONE-AUDIT.md` (NEW per RESEARCH § 4.2 + PATTERNS § 2.8 sister v0.3.0-MILESTONE-AUDIT.md 139L format 100% reuse) and finds: (a) YAML front-matter `milestone: 0.4.0` + `audited: 2026-05-19` + `status: passed` + scores `requirements: 5/5 (R8.1-R8.5 all Done; 0 partial; 0 unsatisfied)` + `phases: 3/3 self-report passed (acceptance bar F1-F8 8/8 each)` + tech_debt array; (b) markdown body sections `# v0.4.0 Milestone Audit — PASSED` + TL;DR + `## § 0.5 Line Budget Deviations Accepted` (Phase 4.3 src/audit/log.ts ≤80L + hook.ts ≤50L + engine.ts ≤200L + ADR 0018 ≤200L all within budget — 0 deviations) + `## § 1 Per-Phase Status` 3-phase table (4.1+4.2+4.3) + `## § 2 Cross-Phase Integration` seam table (audit log hook + ADR backfill A7 守恒 + milestone close 3-file archive) + `## § 3 E2E Flows` flow table + `## § 4 Requirements Coverage` REQ table (R8.1-R8.5) + `## § 5 v0.4.0 vs v0.3.0 对比` (3-phase 1-day cadence vs 4-phase 2-day cadence; PRIMARY helper family extension; ADR cohort 17→20) + `## § 6 Verdict PASSED` (triple tag + next milestone v0.5/v1.0); (c) `## § 7 Cadence Patterns — R-5 Publish-Only vs Architectural Phase Disambiguation` NEW v0.4.0 specific section at BOTTOM per CONTEXT #BO + RESEARCH § 4.2: Phase 4.1+4.2 R-5 publish-only NO architectural change (docs/community infra publish) vs Phase 4.3 ARCHITECTURAL NEW src/audit/ module + ADR 0018 + ci.yml A7 iter + triple tag — full ship cadence; M-01 PhaseClass meta-disambiguation pattern; NOT 'v0.4.0 决策力下降' but tier区分 explicit; reader 应 compare Phase 4.3 单 phase architectural delta vs v0.3.0 4-phase parallel NOT v0.4.0 整 milestone 3-phase 对比"
    - "developer reads `.planning/phase-4.3/DOGFOOD-T2.X.md` (NEW ~55-60L PASS 3/3 axes sister Phase 4.2 DOGFOOD 58L format 100% reuse) and finds: Date 2026-05-19 + Verdict PASS 3/3 axes verified miss: none + 3 Axis sections + Aggregate verification + Disposition; (Axis A) R8.1 audit log infra verify — `wc -l src/audit/log.ts` ≤80 + `wc -l src/audit/hook.ts` ≤50 + `wc -l src/routing/engine.ts` ≤200 Karpathy hard + `corepack pnpm test -- tests/audit/log.test.ts tests/audit/hook.test.ts --run` exit 0 + manual emit smoke `node -e \"import('./dist/audit/hook.js').then(...)\"` verify .harnessed/audit.log created + `jq '.' .harnessed/audit.log | head -1` 11-field schema valid; (Axis B) ADR backfill cluster verify — `ls docs/adr/{0018,0019,0020}-*.md | wc -l` == 3 + 9-section 0018 grep + 5-section 0019/0020 grep + `grep -c '| \\[001[8-9]' docs/adr/README.md` ≥ 2 + `grep '0018' .github/workflows/ci.yml | wc -l` ≥ 2 (both for loops) + `git diff docs/adr/000[1-9]-*.md docs/adr/001[0-7]-*.md | wc -l` == 0 (A7 守恒 verify pre-tag); (Axis C) v0.4.0 milestone close cluster verify — `test -f CHANGELOG.md` + `grep '## \\[0.4.0\\] - 2026-05-19' CHANGELOG.md` + `ls .planning/milestones/v0.4.0-{ROADMAP,REQUIREMENTS,MILESTONE-AUDIT}.md | wc -l` == 3 + `grep -q 'v0.4.0.*🎯 SHIPPED ARCHIVED\\|SHIPPED & ARCHIVED 2026-05-19' .planning/ROADMAP.md` + `git tag --list 'adr-0018-accepted' | wc -l` == 1 + `git tag --list 'v0.4.0-alpha.3-audit' | wc -l` == 1 + `git tag --list 'v0.4.0' | wc -l` == 1 + `git ls-remote origin refs/tags/v0.4.0' returns empty (verify NO push); PASS verdict header `PASS 3/3 dogfood axes verified, miss: none`"

  artifacts:
    # W0 artifacts (2 cadence sister Phase 4.2 W0 cadence延袭)
    - path: ".planning/STATE.md (W0.1 + W2 T2.6)"
      provides: "W0.1 D2 cadence iter 4 trim Phase 4.2 narrative → RETROSPECTIVE.md § ARCHIVED FROM STATE — Phase 4.2 (single-phase archive consistent with Phase 4.1 solo archive precedent per R-4 cadence consistency mitigation; trim verbose Phase 4.2 entry L44 ~5-bullet + 当前位置 L22-26 long inline narrative condense to 1-line pointer + 关键决策 records area Phase 4.2 D-decision rows IF present → verbatim relocate; preserve recent Phase 4.2 + Phase 3.4 SHIPPED pointers; insert HTML-comment archive marker per sister L42 format; expected post-trim ~134-141L per RESEARCH § 5.2 estimate); ALSO W2 T2.6 Phase 4.3 SHIPPED 续编 append (~+10-15L delta — 当前位置 update v0.4.0 2/3 → 3/3 🎯 SHIPPED ARCHIVED + 17th entry Phase 4.3 shipped ✅ + 进度 100% close); STATE.md size ≤175L IF W0.2 flip path (10L safety headroom 165 baseline + 10L churn budget) OR ≤200L IF W0.2 defer path (3rd consecutive DEFER sister cadence)"
      contains: "Phase 4.3 SHIPPED"
    - path: ".planning/RETROSPECTIVE.md (W0.1 + W2 T2.7)"
      provides: "W0.1 D2 cadence iter 4 receive — accept Phase 4.2 narrative verbatim relocation `## § ARCHIVED FROM STATE — Phase 4.2 (Phase 4.3 W0.1 D2 cadence iter 4, 2026-05-19)` subsection containing Phase 4.2 SHIPPED narrative archived from STATE.md (single-phase archive consistent with Phase 4.1 solo archive precedent; R-4 cadence consistency mitigation); LOC delta ≈ +15-22L (trimmed lines from STATE.md verbatim relocation); ALSO W2 T2.7 Phase 4.3 milestone retrospective 7-section append (~+35-45L delta — sister Phase 4.2 W2 T2.2 7-section format 100% reuse; What worked / What was inefficient / Patterns established / Cost patterns / Key lessons / Cross-milestone trends / Next Phase Prep Notes); ALSO ADD cross-milestone v0.4.0 close trends section explicit (3-phase 1-day cadence vs v0.3.0 4-phase 2-day cadence; 17/17 100% close)"
      contains: "Phase 4.2"
    - path: "scripts/check-state-archive-stale.mjs (W0.2)"
      provides: "W0.2 CONDITIONAL D1 SIZE_LIMIT 200→175 round 2 tighten (1-line surgical L12 same file as Phase 4.1 W0.1 ENFORCE flip + Phase 4.2 W0.2 unchanged-defer): IF post-W0.1 STATE ≤165L → flip `const SIZE_LIMIT = 200 // round 1; tighten to 150 v0.4 per DEFERRED #AG → Phase 4.2 W0.1 re-eval per #BA carry → Phase 4.3 W0 relax 175 round 2 per CONTEXT #BA` → `const SIZE_LIMIT = 175 // Phase 4.3 W0.2 round 2 tighten — sister DEFERRED #BA resolve round 2 RELAX (W0.1 trim outcome STATE post-trim ≤165L verified pre-flip; 10L safety headroom; relaxed from 200→150 sister target per CONTEXT #BA round 2 relax)`; OTHERWISE DEFER #BA carry-forward Phase 4.4+ W0 LOW priority (3rd consecutive DEFER signal); pre-flight verify `node scripts/check-state-archive-stale.mjs` exit 0 with ENFORCE=true (already shipped Phase 4.1 W0.1) + new SIZE_LIMIT=175 baseline post-flip"
      contains: "SIZE_LIMIT = 175"

    # W1 R8.1 NEW infrastructure artifacts (6 NEW — Phase 4.3 ARCHITECTURAL PRIMARY anchor)
    - path: "src/audit/log.ts (W1 T1.1 NEW)"
      provides: "NEW ≤80L JSONL append-only writer + 11-field AuditRecordSchema TypeBox + buildAuditRecord(task,decision,matched,ctx) + emitAuditRecord(record) sync; AUDIT_PATH = '.harnessed/audit.log' hardcoded literal; node:crypto sha1 zero-dep; sister src/checkpoint/state.ts writeCurrentWorkflow async pattern (BUT sync sister mkdirSync + appendFileSync for logging path — RESEARCH § 2.3 atomic O_APPEND PIPE_BUF rationale); 11 字段 exact per D-01 LOCKED (additionalProperties:false TypeBox enforce); Karpathy hard cap ≤80L per RESEARCH § 2.7 estimate (sister engineHook.ts 48L + room for 11-field schema build)"
      contains: "AUDIT_PATH"
    - path: "src/audit/hook.ts (W1 T1.2 NEW)"
      provides: "NEW ≤50L thin engine integration wrapper emitAudit(task,decision,matched,ctx) calls buildAuditRecord + emitAuditRecord; sister src/checkpoint/engineHook.ts 48L PRIMARY helper extract pattern延袭 (single-responsibility bridge engine.ts outcome → audit log emit); AuditHookCtx discriminated union outcome + routeLayer + sessionId + iterCount=null; sync (NOT async — fail-soft logging path NO throw); Karpathy hard cap ≤50L sister engineHook.ts precedent"
      contains: "emitAudit"
    - path: "src/routing/engine.ts (W1 T1.3 MODIFY)"
      provides: "MODIFY ~+5-7L NET (surgical 2L shrink L120-122 FIRST + import +1L + routeLayer determination +1L + 4 emitAudit call sites +4L); CRITICAL post-MODIFY `wc -l src/routing/engine.ts` ≤ 200 Karpathy hard limit per CLAUDE.md key reminder #4 + B-06 + Phase 3.4 D-04 explicit no B-03 5% tolerance; surgical 2L shrink target L120-122 collapse `void semantic.rule // v0.2+ feeds...` standalone noop line into prior `const semantic = await semanticMatch(...)` comment trailer creating +2L budget headroom; IF post-MODIFY exceeds 200L use alternative consolidation pass auditCtx single-arg via hook.ts wrapper to reduce call-site footprint per PATTERNS § 2.3 alternative"
      contains: "emitAudit"
    - path: "tests/audit/log.test.ts (W1 T1.4 NEW)"
      provides: "NEW 7-8+ fixture cells per RESEARCH § 2.8 + PATTERNS § 2.4: vi.mock('node:fs', { appendFileSync, mkdirSync }) sync FS mock pattern (sister tests/checkpoint/state.test.ts 98L vi.mock node:fs/promises adapted for sync surface); in-memory fixtures appendedLines[] + mkdirSyncCalls[]; beforeEach clear + afterEach vi.clearAllMocks; 7 cells (valid JSONL + append-not-overwrite + 11 fields + sha1 hex + excerpt truncate + outcome map + mkdirSync called) + BONUS cell 8 log injection (STRIDE T mitigation `\\n` encoding verify)"
      contains: "emitAuditRecord"
    - path: "tests/audit/hook.test.ts (W1 T1.5 NEW)"
      provides: "NEW 3+ fixture cells per RESEARCH § 2.8 supplement: emitAudit composes correctly smoke test + routeLayer 'L1-keyword' vs 'L3-fallback' branch + outcome enum 6-value discriminated union pass-through"
      contains: "emitAudit"
    - path: "docs/adr/0018-routing-audit-log.md (W1 T1.6 NEW)"
      provides: "NEW ~180-200L PRIMARY ADR 9-section errata format sister docs/adr/0017-routing-hit-rate-token-budget.md 204L 100% reuse: Status + Context + Decisions (D-01 + D-02 + hook extract + src/audit/ naming) + A7 Conservation (ADR 0001-0017 unchanged + baseline tag iter 17→18 Wave 2 T2.4 落地) + Consequences (capability delta table) + Compliance (F1-F8 evidence R8.1 satisfied) + Errata-path (frozen Phase 4.3; v0.5+ goes 0022+ NOTE 0019/0020 backfill) + Adoption-confirmation + References; D-02 forward-only rationale EXPLICIT cross-ref ADR 0019 STATE COLLAPSE per CONTEXT D-02 L63"
      contains: "phase 4.3"

    # W2 R8.4 backfill + CHANGELOG + milestone close artifacts (sister Phase 3.4 W2 11-task milestone close cadence延袭)
    - path: "docs/adr/0019-state-dual-ssot-collapse-pattern.md (W2 T2.1 NEW)"
      provides: "NEW backfill simplified 5-section format per RESEARCH § 3.3: Status + Context (5 dual-SoT recurrences) + Decision (COLLAPSE pattern + single-SoT institutionalize) + Consequences (STATE.md single SoT + 3-rules gate + STATE_POSITION_RE OR-fallback + sister M2 D2 standing process) + References (.planning/phase-3.3/3.3-CONTEXT.md D-04 + RETROSPECTIVE.md § ARCHIVED FROM STATE — Phase 3.3+3.4); shorter than 9-section since pattern lock NOT implementation phase ADR"
      contains: "STATE dual-SoT COLLAPSE"
    - path: "docs/adr/0020-hybrid-2clock-disambiguation.md (W2 T2.2 NEW)"
      provides: "NEW backfill same simplified 5-section format: Status + Context (ROADMAP 2-3 weeks vs R8.2 6-month semantic conflict) + Decision (HYBRID 2-clock SEPARATE) + Consequences (STATE.md L23 + RETRO § Cost patterns explicit 2-clock language + standing process for v0.5+ external-dependency phases) + References (.planning/phase-4.2/4.2-CONTEXT.md D-04 + .planning/STATE.md L24)"
      contains: "HYBRID 2-clock"
    - path: "docs/adr/README.md (W2 T2.3 MODIFY)"
      provides: "MODIFY +3 rows append after existing L49 row (sister Phase 3.4 ADR 0017 single-add cadence延袭 NOT triple-add 之前一次性 per CONTEXT D-03 L78); index entries 0018/0019/0020 each with `| [NNNN](./NNNN-title.md) | Title | Accepted | 2026-05-19 |` pipe-delimited format; OPTIONAL bonus 0009-0017 gap catchup IF Wave 2 time allows per RESEARCH § 7 Q3 (low-effort high-transparency value but NOT required by D-03 scope)"
      contains: "[0018]"
    - path: ".github/workflows/ci.yml (W2 T2.4 MODIFY)"
      provides: "MODIFY A7 step iter 0017→0018 (4 surgical edits per RESEARCH § 3.7 + § 4.5 exact line refs): Line 82 step name + Line 85 first for loop + Line 96 second for loop + Line 107 echo all `0017` → `0018`; STRICT ordering: commit + push BEFORE `adr-0018-accepted` tag creation per RESEARCH § 4.4 (STRIDE D mitigation A7 gate workflow block)"
      contains: "0018"
    - path: "CHANGELOG.md (W2 T2.5 NEW root-level)"
      provides: "NEW ~30L Keep-a-Changelog format per RESEARCH § 4.1 + PATTERNS § 4: header + Keep-a-Changelog + Semantic Versioning reference + [Unreleased] empty + [0.4.0] - 2026-05-19 + Added 6 bullets (audit log R8.1 + ADR 0018/0019/0020 + CHANGELOG + milestone archive triplet) + Changed 1 bullet (ci.yml A7 step) + GitHub release link footer; NO Conventional Changelog auto-gen dep (Karpathy YAGNI per CONTEXT § Open Q L141); root-level placement per Keep-a-Changelog convention + D-04 LOCK"
      contains: "## [0.4.0]"
    - path: ".planning/ROADMAP.md (W2 T2.8 MODIFY)"
      provides: "MODIFY: Phase 4.3 ✅ SHIPPED + v0.4.0 milestone progress 2/3 PROGRESS → 3/3 🎯 SHIPPED ARCHIVED close (sister L38 v0.1.0 + L58 v0.2.0 + L130 v0.3.0 SHIPPED ARCHIVED literal cadence延袭); L224-226 Phase 4.3 entry verbose ship outcome summary; L185 v0.4.0 milestone block Status header update + triple tag references + audit cross-link; add v0.5/v1.0 next milestone kickoff reference"
      contains: "v0.4.0.*SHIPPED ARCHIVED"
    - path: "PROJECT-SPEC.md (W2 T2.9 MODIFY)"
      provides: "MODIFY: L3 Status header add Phase 4.3 SHIPPED literal + 🎯 v0.4.0 milestone close marker (sister Phase 4.2 W2 T2.5 + Phase 3.4 W2 T2.6 FRONT_MATTER_DOCS transparency gate pattern延袭); freshness gate post-MODIFY pass"
      contains: "Phase 4.3 SHIPPED"
    - path: "README.md (W2 T2.10 MODIFY)"
      provides: "MODIFY: L9 Status freshness Phase 4.3 SHIPPED + 🎯 v0.4.0 milestone close marker (sister 5-recurrence terminus D-04 COLLAPSE STATUS_MARKER path延袭 — preserve single SoT L9 freshness pattern); v0.4.0 MILESTONE row updated 2/3 → 3/3 🎯 SHIPPED ARCHIVED; Phase 4.3 entry appended shipped phase list (sister Phase 4.2+4.1+3.4+3.3+3.2+3.1 row pattern延袭); freshness gate `node scripts/check-transparency-verdicts.mjs` exit 0 post-MODIFY pass"
      contains: "Phase 4.3 SHIPPED"
    - path: ".planning/milestones/v0.4.0-ROADMAP.md (W2 T2.11 NEW)"
      provides: "NEW snapshot per RESEARCH § 4.3 + PATTERNS § 2.8 sister `.planning/milestones/v0.3.0-ROADMAP.md` format 100% reuse: Header + Status SHIPPED & ARCHIVED + Phases (4.1/4.2/4.3 3 phases) + Timeline + Git range (v0.3.0 → v0.4.0) + Milestone tags (3 alpha + 🎯 v0.4.0) + Audit cross-link + Overview + Phases subsections each with Goal + Plans + ship outcome + ADR ref"
      contains: "Milestone v0.4.0"
    - path: ".planning/milestones/v0.4.0-REQUIREMENTS.md (W2 T2.12 NEW)"
      provides: "NEW snapshot from REQUIREMENTS.md R8.1-R8.5 v0.4-tagged section frozen sister `.planning/milestones/v0.3.0-REQUIREMENTS.md` format 100% reuse; 5 v0.4 requirements verbatim copy + status Done frozen at v0.4.0 milestone close"
      contains: "R8.1"
    - path: ".planning/milestones/v0.4.0-MILESTONE-AUDIT.md (W2 T2.13 NEW)"
      provides: "NEW per RESEARCH § 4.2 + PATTERNS § 2.8 sister `.planning/milestones/v0.3.0-MILESTONE-AUDIT.md` 139L format 100% reuse: YAML front-matter milestone 0.4.0 + 3-phase scores + tech_debt + markdown body sections § 0.5 Line Budget Deviations Accepted (0 deviations Phase 4.3) + § 1 Per-Phase Status 3-phase table + § 2 Cross-Phase Integration seam table + § 3 E2E Flows + § 4 Requirements Coverage (R8.1-R8.5) + § 5 v0.4.0 vs v0.3.0 对比 + § 6 Verdict PASSED + triple tag + next milestone; **§ 7 Cadence Patterns NEW v0.4.0 specific section at BOTTOM** per CONTEXT #BO + RESEARCH § 4.2 — R-5 publish-only vs Architectural phase disambiguation pattern + M-01 PhaseClass meta-disambiguation explicit (avoid reader misreading 'v0.4.0 决策力下降')"
      contains: "v0.4.0 Milestone Audit"
    - path: ".planning/phase-4.3/DOGFOOD-T2.X.md (W2 T2.14 NEW)"
      provides: "NEW ~55-60L PASS 3/3 axes sister Phase 4.2 DOGFOOD 58L format 100% reuse (Date + Verdict + 3 Axis sections + Aggregate verification + Disposition): Axis A R8.1 audit log infra (src/audit/log.ts ≤80 + hook.ts ≤50 + engine.ts ≤200 + tests pass + manual emit smoke + jq 11-field schema valid) + Axis B ADR backfill cluster (0018/0019/0020 + index +3 rows + ci.yml A7 iter + A7 守恒 verify 0 diff pre-tag) + Axis C v0.4.0 milestone close (CHANGELOG + 3-file archive triplet + ROADMAP SHIPPED ARCHIVED + triple tag LOCAL CREATE 3 tags + NO push verify); PASS verdict header `PASS 3/3 dogfood axes verified, miss: none`"
      contains: "PASS 3/3"

  key_links:
    # W0 path dep chain (W0.1 → W0.2)
    - from: ".planning/STATE.md (post-W0.1 trim ≤165L expected per RESEARCH § 5.2 projection ~134-141L well below threshold)"
      to: "scripts/check-state-archive-stale.mjs L12 SIZE_LIMIT 200→175 round 2 conditional flip (RELAX from sister 200→150 target per CONTEXT #BA)"
      via: "Decision tree per CONTEXT #BA: post-trim STATE ≤165L → flip safe (10L headroom maintained for Phase 4.3 ship 续编 + future churn); 166-175L → defer flip (insufficient headroom; DEFERRED #BA carry-forward Phase 4.4+ W0 LOW priority — 3rd consecutive DEFER signal sister Phase 4.1 W0.5 + Phase 4.2 W0.2 chain); >175L → flip blocked + investigate W0.1 trim sufficiency (re-evaluate D2 cadence pattern adequacy)"
      pattern: "SIZE_LIMIT = 175"

    # W1 R8.1 NEW infrastructure key_links (D-01 JSONL + D-02 forward-only + hook extract pattern + engine.ts surgical shrink)
    - from: "src/audit/log.ts JSON.stringify(record) + '\\n' (sync append)"
      to: ".harnessed/audit.log file (OS-level atomic O_APPEND for writes < PIPE_BUF ~4KB; records ~200-400 bytes well within atomic range)"
      via: "appendFileSync POSIX O_APPEND semantics atomic for small writes (NTFS atomic on Windows via SetFilePointer + WriteFile per RESEARCH § 2.3); ADR 0018 documents 'No explicit lock mechanism; atomic append sufficient for single-maintainer phase; multi-process concurrent deferred v0.5+' per #BU defer rationale; STRIDE T mitigation via D-01 sneak-block 11-field exact + additionalProperties:false TypeBox enforce + JSON.stringify newline encoding (log injection mitigation)"
      pattern: "appendFileSync.*JSON.stringify"
    - from: "src/audit/hook.ts emitAudit(task, decision, matched, ctx)"
      to: "src/routing/engine.ts MODIFY (4 call sites: 1 success path L189-190 + 3 error paths L193+L196+L198) BEFORE each return"
      via: "engine.ts surgical 2L shrink L120-122 FIRST creates +2L budget headroom; import emitAudit + routeLayer determination + 4 call sites = +5-7L NET; CRITICAL post-MODIFY `wc -l src/routing/engine.ts` ≤ 200 Karpathy hard per CLAUDE.md key reminder #4; IF exceeded use alternative consolidation pass auditCtx single-arg per PATTERNS § 2.3 alternative; reviewer pre-commit verify wc -l ≤ 200"
      pattern: "emitAudit\\(task, decision, matched"
    - from: "docs/adr/0018-routing-audit-log.md D-02 forward-only rationale section"
      to: "docs/adr/0019-state-dual-ssot-collapse-pattern.md (NEW backfill cross-ref source for forward-only single-SoT institutionalize)"
      via: "ADR 0018 § Decisions § 2 EXPLICIT 'audit.log starts forward from Phase 4.3 ship; prior decisions remain in PLAN.md / CONTEXT.md / RETROSPECTIVE.md SoT — see ADR 0019 for STATE COLLAPSE dual-SoT lesson' per CONTEXT D-02 L63; ADR 0019 backfill explains 5-recurrence terminus heuristic that justifies forward-only D-02 lock"
      pattern: "ADR 0019.*STATE COLLAPSE"

    # W2 R8.4 backfill + milestone close key_links
    - from: ".github/workflows/ci.yml A7 step iter 0017→0018 (W2 T2.4)"
      to: "`adr-0018-accepted` tag LOCAL CREATE (W2 T2.15 triple tag)"
      via: "STRICT ordering constraint per RESEARCH § 4.4: ci.yml A7 update commit MUST precede `adr-0018-accepted` tag creation timestamp; otherwise A7 gate would attempt to check ADR 0018 baseline tag missing from loop and produce incorrect behavior on next CI run (STRIDE D mitigation workflow block); reviewer manual check W2 T2.4 commit hash < W2 T2.15 tag annotation timestamp; planner T2.15 acceptance `git log --pretty=format:'%H %ct' .github/workflows/ci.yml | head -1 < $(git for-each-ref --format='%(creatordate:unix)' refs/tags/adr-0018-accepted)` verify ordering"
      pattern: "0018.*ci.yml.*adr-0018-accepted"
    - from: "Phase 4.3 W2 ship cycle (12 atomic tasks + DOGFOOD + triple tag)"
      to: "v0.4.0 milestone 3/3 🎯 SHIPPED ARCHIVED CLOSE (sister v0.3.0 close cadence延袭)"
      via: "M-01 ARCHITECTURAL phase class LOCK → full ship cadence ADR 0018 PRIMARY + ci.yml A7 iter 17→18 + triple tag (adr-0018-accepted + v0.4.0-alpha.3-audit + 🎯 v0.4.0); 3-file milestone close archive triplet (v0.4.0-ROADMAP + v0.4.0-REQUIREMENTS + v0.4.0-MILESTONE-AUDIT) sister `.planning/milestones/v0.3.0-*.md` format 100% reuse; CHANGELOG.md NEW Keep-a-Changelog v0.4.0 entry root-level (NOT docs/CHANGELOG.md); ROADMAP Phase 4.3 ✅ SHIPPED + v0.4.0 🎯 SHIPPED ARCHIVED close marker; 17/17 100% phase ship close"
      pattern: "🎯 v0.4.0"
    - from: ".planning/phase-4.3/DOGFOOD-T2.X.md (W2 T2.14 NEW)"
      to: "3-axis empirical evidence PASS 3/3 + R8.1/R8.4 acceptance bar"
      via: "Sister Phase 4.2 DOGFOOD-T2.X.md 58L 3-axis format 100% reuse; axes ADAPT Phase 4.3 ARCHITECTURAL scope: (A) R8.1 audit log infra wc -l + tests + manual emit smoke + jq schema valid (B) ADR backfill cluster 3 NEW files + index +3 + ci.yml A7 iter + A7 守恒 verify pre-tag (C) v0.4.0 milestone close CHANGELOG + 3-file archive triplet + ROADMAP SHIPPED ARCHIVED + triple tag LOCAL CREATE + NO push verify; verify ALL 3 axes PASS pre-tag-create; Karpathy ≤60L sister precedent"
      pattern: "PASS 3/3"

risk_notes:
  # 5 latent risks acknowledged + accepted per RESEARCH § 8 + CONTEXT § Discretion (Phase 4.3 ARCHITECTURAL scope larger than sister Phase 4.1/4.2)
  - id: R-1
    risk: src/routing/engine.ts +2L budget breach risk — engine.ts at 200L exact; adding `import { emitAudit }` (1L) + routeLayer determination (1L) + 4 emitAudit call sites (4L) = +6L total → 206L violates Karpathy hard limit per CLAUDE.md key reminder #4 (NO B-03 5% tolerance per Phase 3.4 D-04 explicit)
    severity: HIGH
    mitigation: per RESEARCH § 2.1 Option A + PATTERNS § 2.3: surgical 2L shrink L120-122 FIRST (collapse `void semantic.rule // v0.2+ feeds...` standalone noop line into prior `const semantic = await semanticMatch(...)` comment trailer creating +2L budget headroom net 204L → 198L → post-add 198L + 6L = 204L STILL exceeds); ALTERNATIVE consolidation pass auditCtx single-arg via hook.ts wrapper to reduce call-site footprint (4 sites × 1L vs 4 sites × 0.5L wrapper) net 198L + 5L = 203L STILL marginal; OPTION C find 4-line shrink elsewhere in engine.ts (W-04 phaseId comment block L162-163 + 1 more shrink target) → 196L + 6L = 202L; **executor MUST iterate shrink targets until post-MODIFY wc -l ≤ 200 verify** OR escalate W1 T1.3 BLOCKED + replan (extract additional helper from engine.ts to reduce baseline below 198L); planner T1.3 explicit acceptance `wc -l src/routing/engine.ts` ≤ 200 hard gate
    acceptance: documented inline + task T1.3 acceptance `wc -l src/routing/engine.ts` ≤ 200 strict hard gate + iterate shrink targets until verified
  - id: R-2
    risk: ADR backfill A7 守恒 violation risk — executor accidentally edits ADR 0001-0017 main body during 0018/0019/0020 NEW file creation; A7 CI gate fails on next push
    severity: MED
    mitigation: per RESEARCH § 8 R-2: executor ADD new files only (0018+0019+0020); README.md is NOT covered by A7 gate (not numbered file pattern `NNNN-*.md`); NEW files not in A7 gate until `adr-0018-accepted` tag pushed (post-W2 T2.4 ci.yml A7 iter); planner W2 T2.15 PRE-TAG acceptance `git diff docs/adr/000[1-9]-*.md docs/adr/001[0-7]-*.md | wc -l` == 0 (must be 0 BEFORE tag creation); reviewer manual diff check before each adr-0018-accepted tag annotation
    acceptance: documented inline + task T2.15 PRE-TAG `git diff docs/adr/000[1-9]-*.md docs/adr/001[0-7]-*.md | wc -l` == 0 verify
  - id: R-3
    risk: ci.yml A7 iter ordering violation — `adr-0018-accepted` tag created BEFORE ci.yml A7 step updated to include 0018 in loop → A7 gate fails on next CI run (STRIDE D workflow block)
    severity: MED
    mitigation: per RESEARCH § 4.4 STRICT ordering constraint: W2 T2.4 (ci.yml A7 iter 0017→0018 commit + push) MUST precede W2 T2.15 (triple tag LOCAL CREATE adr-0018-accepted); planner T2.15 acceptance `git log --pretty=format:'%H %ct' .github/workflows/ci.yml | head -1` timestamp < `git for-each-ref --format='%(creatordate:unix)' refs/tags/adr-0018-accepted` timestamp ordering verify; reviewer manual check W2 T2.4 commit hash < W2 T2.15 tag annotation timestamp
    acceptance: documented inline + task T2.15 ordering verify
  - id: R-4
    risk: Phase 4.3 scope inflation 1.5-2 day estimate underestimate (NEW src/ + 3 ADRs + CHANGELOG + milestone close significantly more complex than sister Phase 4.1+4.2 ~4h each); timeline pressure
    severity: MED
    mitigation: per RESEARCH § 8 R-4: ADR 0018 PRIMARY ship Wave 1 early (even if Wave 2 ADR backfill in progress); ADR 0019/0020 backfill SIMPLIFIED 5-section format (NOT 9-section reduces authoring time); ADR 0021 EXPLICITLY OPTIONAL drop if Wave 2 runs long; CHANGELOG.md ~30L minimal time investment; Wave 2 PARALLELIZABLE — ADR authoring while milestone archive snapshots written (different file domains no conflicts); CONTEXT § Open Q L141 recommend 3-wave structure realistic for sister 1.5-2 day estimate; acceptance Phase 4.3 may extend 2 days vs sister 1-day Phase 4.1/4.2 — acknowledge in retrospective Cost patterns
    acceptance: documented inline + retrospective Cost patterns acknowledge 1.5-2 day cadence
  - id: R-5
    risk: STATE.md ≤175L unreachable post-trim risk — IF post-W0.1 STATE ends in 166-175L range → DEFER #BA again (3rd consecutive defer); SIZE_LIMIT=175 flip never happens (carry Phase 4.4+ W0 LOW priority)
    severity: LOW
    mitigation: per RESEARCH § 8 R-3 + CONTEXT #BA decision tree: current STATE.md = 156L baseline (RESEARCH § 5.1 verified `wc -l`); Phase 4.2 narrative estimate ~15-25L; post-trim estimate ~131-141L safely below 165L threshold; contingency 166-175L → accept 3rd defer carry-forward Phase 4.4+ W0 LOW priority (SIZE_LIMIT=200 round 1 still enforced ENFORCE=true since Phase 4.1 W0.1; gate not broken just not tightened yet); >175L BLOCKED scenario very unlikely unless W0.1 trim fails — escalate emergency trim
    acceptance: documented inline + task T0.2 decision tree branches A/B/C explicit

acceptance_criteria:
  # F1-F8 per sister Phase 4.2 cadence — Phase 4.3 acceptance bar
  F1: "src/audit/log.ts NEW ≤80L D-01 LOCKED 11-field schema TypeBox (ts/phase/task_excerpt/task_sha1/matched_rule_id/primary_expert/secondary_expert/category/route_layer/outcome/session_id/iter_count exact 11 fields per D-01 LOCKED) + AUDIT_PATH = '.harnessed/audit.log' hardcoded literal (STRIDE T mitigation NOT derived from task input) + buildAuditRecord + emitAuditRecord sync + sister checkpoint/state.ts writeFile pattern延袭 adapt for sync append + node:crypto sha1 zero-dep + Karpathy hard cap ≤80L sister engineHook.ts 48L precedent + 0 sneak (NO full agentDef + NO subagent body + NO MCP secrets per D-01 sneak-block enforcement)"
  F2: "src/audit/hook.ts NEW ≤50L thin engine integration wrapper emitAudit(task,decision,matched,ctx) calls buildAuditRecord + emitAuditRecord sync + AuditHookCtx discriminated union (outcome 6-value enum + routeLayer 3-value enum + sessionId? + iterCount=null Phase 4.3) + sister src/checkpoint/engineHook.ts 48L PRIMARY helper extract pattern延袭 single-responsibility bridge + Karpathy hard cap ≤50L sister precedent"
  F3: "src/routing/engine.ts MODIFY surgical 2L shrink L120-122 + import emitAudit + routeLayer determination + 4 emitAudit call sites (1 success path L189-190 + 3 error paths L193+L196+L198) BEFORE each return; CRITICAL post-MODIFY `wc -l src/routing/engine.ts` ≤ 200 Karpathy hard limit per CLAUDE.md key reminder #4 + B-06 + Phase 3.4 D-04 explicit no B-03 5% tolerance (HIGH RISK R-1 — iterate shrink targets until verified OR escalate)"
  F4: "tests/audit/log.test.ts NEW 7-8+ fixture cells vi.mock node:fs sync pattern (sister tests/checkpoint/state.test.ts 98L pattern延袭 adapted sync FS surface) + 7 cells per RESEARCH § 2.8 (valid JSONL + append-not-overwrite + 11 fields + sha1 hex + excerpt truncate + outcome map + mkdirSync called) + BONUS cell 8 log injection STRIDE T mitigation + tests/audit/hook.test.ts NEW 3+ cells (compose + routeLayer + outcome enum); `corepack pnpm test -- tests/audit/ --run` exit 0"
  F5: "docs/adr/0018-routing-audit-log.md NEW ~180-200L PRIMARY 9-section errata format sister docs/adr/0017-routing-hit-rate-token-budget.md 204L 100% reuse + D-02 forward-only rationale section EXPLICIT cross-ref ADR 0019 STATE COLLAPSE per CONTEXT D-02 L63 + A7 Conservation iter 17→18 baseline tag Wave 2 T2.4 落地 sister Phase 3.4 W2 T2.7 cadence延袭"
  F6: "docs/adr/0019-state-dual-ssot-collapse-pattern.md + docs/adr/0020-hybrid-2clock-disambiguation.md NEW backfill simplified 5-section format per RESEARCH § 3.3 + § 3.4 (Status + Context + Decision + Consequences + References); docs/adr/README.md MODIFY +3 rows index entries 0018/0019/0020 sister Phase 3.4 ADR 0017 single-add cadence延袭; OPTIONAL ADR 0021 bonus IF Wave 2 time allows per D-03 sneak-block; OPTIONAL 0009-0017 gap catchup IF Wave 2 time allows per RESEARCH § 7 Q3"
  F7: ".github/workflows/ci.yml MODIFY A7 step iter 0017→0018 (4 surgical edits Line 82 name + L85 first loop + L96 second loop + L107 echo all `0017`→`0018`); STRICT ordering commit + push BEFORE adr-0018-accepted tag creation per RESEARCH § 4.4 (STRIDE D mitigation A7 gate workflow block) + CHANGELOG.md NEW ~30L Keep-a-Changelog format root-level v0.4.0 entry per RESEARCH § 4.1 + D-04 LOCK"
  F8: "v0.4.0 milestone close cadence: 3-file archive triplet NEW (.planning/milestones/v0.4.0-{ROADMAP,REQUIREMENTS,MILESTONE-AUDIT}.md sister v0.3.0 100% format reuse + MILESTONE-AUDIT § 7 NEW R-5 mitigation 'Cadence Patterns' section at BOTTOM per CONTEXT #BO) + STATE.md + ROADMAP + PROJECT-SPEC + README all v0.4.0 🎯 SHIPPED ARCHIVED close marker + DOGFOOD-T2.X.md NEW PASS 3/3 axes + Triple tag LOCAL CREATE 3 tags (adr-0018-accepted + v0.4.0-alpha.3-audit + 🎯 v0.4.0) sister v0.3.0 close cadence延袭 STRICT ORDER per RESEARCH § 4.4; NO push per CLAUDE.md commit safety (user controls all push); 17/17 100% phase ship close"
---

<objective>
Phase 4.3 ship **v0.4.0 milestone 3/3 CLOSE — R8.1 audit log NEW infra + R8.4 ADR backfill (0018 PRIMARY + 0019-0020 institutional pattern lock) + v1.0-RC CHANGELOG.md + 🎯 v0.4.0 milestone close (3-file archive triplet + triple tag sister v0.3.0 cadence延袭)** — single PLAN.md + single task_plan.md ~19-21 atomic tasks across W0 (2 cadence) + W1 (6 R8.1 NEW infra) + W2 (12-13 backfill + CHANGELOG + milestone close + triple tag) per sister Phase 4.2 PLAN/task_plan format 100% reuse (adapted Phase 4.3 ARCHITECTURAL + milestone close scope; significantly larger than sister Phase 4.1/4.2 R-5 publish-only mode per M-01 LOCK + CONTEXT #BR 1.5-2 day estimate per RESEARCH § 5.4).

## Wave 0 — Cadence absorb (2 atomic; STRICT path dep W0.1 → W0.2 per CONTEXT #BA decision tree):

**9-phase 连续 "deferred-items → next phase W0 一次根治" cadence 9th phase 沿袭** (Phase 2.3 → 2.4 → 3.1 → 3.2 → 3.3 → 3.4 → 4.1 → 4.2 → 4.3): **T0.1 W0.1 D2 cadence iter 4 REINFORCE trim Phase 4.2 narrative → RETROSPECTIVE.md § ARCHIVED FROM STATE — Phase 4.2** (sister Phase 4.2 W0.1 3rd-iter terminus stable signal → Phase 4.3 W0.1 4th-iter REINFORCE pattern beyond ≥3-iter signal; single-phase archive consistent with Phase 4.1 solo archive precedent per R-4 cadence consistency mitigation; FIRST per path dep — reduces STATE.md 156L → ~134-141L expected creating SIZE_LIMIT=175 round 2 RELAX headroom for W0.2 conditional flip) + **T0.2 W0.2 CONDITIONAL D1 SIZE_LIMIT 200→175 round 2 tighten RELAX** (1-line surgical `scripts/check-state-archive-stale.mjs` L12 IF W0.1 trim outcome holds STATE ≤165L; RELAX from sister Phase 4.1+4.2 200→150 target per CONTEXT #BA "relax target post-2nd-cycle sister H2 AA"; OTHERWISE DEFER #BA carry-forward Phase 4.4+ W0 LOW priority 3rd consecutive DEFER signal per § decision tree).

## Wave 1 — R8.1 NEW infrastructure (6 atomic — Phase 4.3 ARCHITECTURAL PRIMARY anchor):

**`src/audit/` NEW surface inauguration + engine.ts surgical MODIFY + ADR 0018 PRIMARY** (2 NEW src/ + 1 MODIFY src/ + 2 NEW tests + 1 NEW ADR): **T1.1 `src/audit/log.ts` NEW ≤80L D-01 LOCKED JSONL append-only + 11-field AuditRecordSchema TypeBox** (sister src/checkpoint/state.ts writeFile pattern延袭 adapt sync appendFileSync atomic O_APPEND per RESEARCH § 2.3; node:crypto sha1 zero-dep; AUDIT_PATH hardcoded literal STRIDE T mitigation) + **T1.2 `src/audit/hook.ts` NEW ≤50L thin engine integration wrapper** (sister src/checkpoint/engineHook.ts 48L PRIMARY helper extract pattern延袭 single-responsibility bridge engine.ts outcome → audit log emit; AuditHookCtx discriminated union; sync fail-soft NO throw) + **T1.3 `src/routing/engine.ts` MODIFY surgical 2L shrink L120-122 + import emitAudit + 4 call sites** (HIGH RISK R-1 — CRITICAL post-MODIFY `wc -l src/routing/engine.ts` ≤ 200 Karpathy hard limit per CLAUDE.md key reminder #4; iterate shrink targets until verified OR escalate W1 T1.3 BLOCKED + replan) + **T1.4 `tests/audit/log.test.ts` NEW 7-8+ fixture cells** (sister tests/checkpoint/state.test.ts 98L vi.mock pattern延袭 adapt sync node:fs surface; 7 cells per RESEARCH § 2.8 + BONUS log injection STRIDE T mitigation) + **T1.5 `tests/audit/hook.test.ts` NEW 3+ fixture cells** (compose + routeLayer + outcome enum) + **T1.6 `docs/adr/0018-routing-audit-log.md` NEW ~180-200L PRIMARY ADR 9-section errata format** (sister docs/adr/0017-routing-hit-rate-token-budget.md 204L 100% reuse; D-02 forward-only rationale EXPLICIT cross-ref ADR 0019 STATE COLLAPSE per CONTEXT D-02 L63).

## Wave 2 — R8.4 backfill + CHANGELOG + 🎯 v0.4.0 milestone close (12-13 atomic; sister Phase 3.4 W2 11-task milestone close cadence延袭):

**ADR backfill 2-3 NEW + ci.yml A7 iter + CHANGELOG NEW + 3-file milestone archive triplet NEW + 5 ship-close docs MODIFY + DOGFOOD + triple tag LOCAL CREATE**: **T2.1 `docs/adr/0019-state-dual-ssot-collapse-pattern.md` NEW backfill simplified 5-section format** (Phase 3.3 D-04 STATE COLLAPSE 5-recurrence terminus source per RESEARCH § 3.3) + **T2.2 `docs/adr/0020-hybrid-2clock-disambiguation.md` NEW backfill same 5-section format** (Phase 4.2 D-04 HYBRID 2-clock disambiguation source per RESEARCH § 3.4) + **T2.3 `docs/adr/README.md` MODIFY +3 rows index entries 0018/0019/0020** (sister Phase 3.4 ADR 0017 single-add cadence延袭) + **T2.4 `.github/workflows/ci.yml` MODIFY A7 step iter 0017→0018** (4 surgical edits per RESEARCH § 3.7 + § 4.5; STRICT ordering commit + push BEFORE adr-0018-accepted tag creation per RESEARCH § 4.4 STRIDE D mitigation) + **T2.5 `CHANGELOG.md` NEW ~30L Keep-a-Changelog format root-level v0.4.0 entry** (per RESEARCH § 4.1 + D-04 LOCK; NO Conventional Changelog auto-gen dep Karpathy YAGNI) + **T2.6 `.planning/STATE.md` 续编 Phase 4.3 SHIPPED + 当前位置 v0.4.0 3/3 🎯 SHIPPED ARCHIVED close** (combined W0.1 D2 cadence iter 4 archive sub-step per sister § cadence) + **T2.7 `.planning/RETROSPECTIVE.md` 续编 Phase 4.3 milestone retrospective 7-section + receive W0.1 D2 auto-archive Phase 4.2** (sister Phase 4.2 W2 T2.2 7-section format 100% reuse + cross-milestone v0.4.0 close trends) + **T2.8 `.planning/ROADMAP.md` Phase 4.3 ✅ SHIPPED + v0.4.0 🎯 SHIPPED ARCHIVED close marker** (sister L38 v0.1.0 + L58 v0.2.0 + L130 v0.3.0 SHIPPED ARCHIVED literal cadence延袭 + v0.5/v1.0 next milestone kickoff reference) + **T2.9 `PROJECT-SPEC.md` L3 Status header Phase 4.3 SHIPPED + 🎯 v0.4.0 close marker** + **T2.10 `README.md` L9 Status freshness + v0.4.0 3/3 🎯 marker + Phase 4.3 row append** + **T2.11 `.planning/milestones/v0.4.0-ROADMAP.md` NEW snapshot** (sister `.planning/milestones/v0.3.0-ROADMAP.md` format 100% reuse) + **T2.12 `.planning/milestones/v0.4.0-REQUIREMENTS.md` NEW snapshot** (sister format 100% reuse) + **T2.13 `.planning/milestones/v0.4.0-MILESTONE-AUDIT.md` NEW + § 7 R-5 mitigation 'Cadence Patterns' section at BOTTOM** (sister v0.3.0-MILESTONE-AUDIT.md 139L format 100% reuse + CONTEXT #BO + RESEARCH § 4.2) + **T2.14 `.planning/phase-4.3/DOGFOOD-T2.X.md` NEW PASS 3/3 axes** (sister Phase 4.2 DOGFOOD 58L format 100% reuse adapted Phase 4.3 ARCHITECTURAL scope: A R8.1 audit log infra + B ADR backfill cluster + C v0.4.0 milestone close) + **T2.15 Triple tag LOCAL CREATE** (adr-0018-accepted + v0.4.0-alpha.3-audit + 🎯 v0.4.0 STRICT ORDER per RESEARCH § 4.4; sister Phase 3.4 W2 T2.12 cadence延袭; NO push per CLAUDE.md commit safety). **OPTIONAL** ADR 0021 D2 cadence iter standing process backfill IF Wave 2 time allows per D-03 sneak-block + RESEARCH § 3.5.

**Purpose**: Phase 4.3 = v0.4.0 milestone 3/3 CLOSE (last phase milestone close — M-01 ARCHITECTURAL phase class LOCK NOT sister Phase 4.1/4.2 R-5 publish-only mode); R8.1 NEW src/audit/ surface PRIMARY anchor (first NEW src/ surface since Phase 3.4 check-token-budget.ts helper extract) + R8.4 ADR backfill 3-pattern institutional lock (0018 audit log PRIMARY + 0019 STATE COLLAPSE backfill + 0020 HYBRID 2-clock backfill — addresses CONTEXT D-03 "选 3 个最重要 pattern lock backfill 已远足非常规决策 coverage"); CHANGELOG.md NEW Keep-a-Changelog root-level + 3-file milestone close archive triplet (sister v0.3.0 close cadence延袭) + triple tag LOCAL CREATE (sister v0.3.0 close 5-tag consecutive cadence subset Phase 4.3 specific 3-tag). W0 9-phase consecutive backlog absorb cadence 一次根治 (#BA conditional resolve 200→175 round 2 RELAX + sister M2 D2 institutionalize 4th-iter REINFORCE ≥3-iter terminus stable signal). 17/17 100% phase ship close.

**Output**: 19-21 atomic task across 3 wave (2 + 6 + 12-13 = 20-21 sister Phase 4.2 12 atomic ~166% scope factor per CONTEXT #BR 1.5-2 day estimate + RESEARCH § 5.4) — task_plan.md 含完整 per-task 三件套 `<read_first>` + `<acceptance_criteria>` + `<action>` + `<decision_source>` blocks; sister Phase 4.2 task_plan.md 861L 12-atomic structure 100% template reuse + adapt per W0/W1/W2 Phase 4.3 ARCHITECTURAL + milestone close scope.

> **Critical findings absorbed**: (1) **engine.ts at 200L exact** (RESEARCH § 2.1 + § 7 Q1 [VERIFIED: wc -l src/routing/engine.ts] — adding even 1 import + 1 call breaches Karpathy hard limit; W1 T1.3 surgical shrink-first MANDATORY HIGH RISK R-1; iterate shrink targets until verified ≤200L); (2) **STATE.md 156L baseline pre-W0.1** (RESEARCH § 5.1 [VERIFIED: wc -l .planning/STATE.md] — W0.1 trim expected ~134-141L → W0.2 FLIP 200→175 round 2 RELAX path safe HIGH confidence per RESEARCH § 5.2 ≤165L threshold + CONTEXT #BA decision tree); (3) **ADR README.md index incomplete 0001-0008 only** (RESEARCH § 3.6 [VERIFIED: docs/adr/README.md read] — ADRs 0009-0017 exist on disk NOT in index; Phase 4.3 D-03 scope MANDATES 0018-0020 entries + OPTIONAL 0009-0017 gap catchup bonus per RESEARCH § 7 Q3 low-effort high-transparency value); (4) **ci.yml A7 step exact 4 surgical edits** (RESEARCH § 3.7 + § 4.5 [VERIFIED: .github/workflows/ci.yml L82-107 read] — Line 82 step name + L85 first loop + L96 second loop + L107 echo all `0017`→`0018`; STRICT ordering commit BEFORE adr-0018-accepted tag per § 4.4); (5) **iter_count=null Phase 4.3** (RESEARCH § 2.6 + § 7 Q2 — ralphLoopWrap returns Promise<string> only NO iter count exposed; YAGNI defer actual iter tracking to when audit log consumer is built; ADR 0018 documents intentional deferral).

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
@.planning/phase-4.3/4.3-CONTEXT.md
@.planning/phase-4.3/4.3-RESEARCH.md
@.planning/phase-4.3/4.3-PATTERNS.md

# Frozen interface contracts (本 phase Wave 0+1+2 consume + MODIFY 来源)
@src/routing/engine.ts
@src/routing/agentDefinition.ts
@src/routing/decisionRules.ts
@src/routing/lib/ralphLoop.ts
@src/routing/lib/sdkSpawn.ts
@src/checkpoint/engineHook.ts
@src/checkpoint/state.ts
@src/manifest/schema/aliases.v1.ts
@tests/checkpoint/state.test.ts
@docs/adr/0017-routing-hit-rate-token-budget.md
@docs/adr/README.md
@.github/workflows/ci.yml
@scripts/check-state-archive-stale.mjs
@scripts/check-transparency-verdicts.mjs

# Sister precedent (format gold-standard)
@.planning/phase-4.2/PLAN.md
@.planning/phase-4.2/task_plan.md
@.planning/phase-4.2/DOGFOOD-T2.X.md
@.planning/phase-3.4/PLAN.md
@.planning/milestones/v0.3.0-MILESTONE-AUDIT.md
@.planning/milestones/v0.3.0-ROADMAP.md
@.planning/milestones/v0.3.0-REQUIREMENTS.md

# Backfill ADR source (R8.4 D-03 scope)
@.planning/phase-3.3/3.3-CONTEXT.md
@.planning/phase-4.2/4.2-CONTEXT.md
</context>

<interfaces>
<!-- Key types/contracts the executor needs (extracted from codebase per planner-format) -->

From src/routing/engine.ts L1-200 (W1 T1.3 MODIFY target — at 200L exact; HIGH RISK R-1 surgical shrink-first MANDATORY):
```typescript
// L11-13 existing imports (W1 T1.3 ADD `import { emitAudit } from '../audit/hook.js'` after L13):
import { homedir } from 'node:os'
import { join } from 'node:path'
import { activatePhase, completePhase } from '../checkpoint/engineHook.js'

// L120-122 surgical 2L shrink target (collapse standalone noop comment line):
    const semantic = await semanticMatch(task.task, opts.semanticThreshold)
    void semantic.rule // v0.2+ feeds a matched rule into install + factory.
    // Step 1c — L3 fallback_supervisor LLM (phase 1.4 三层兜底 contract).

// AFTER shrink target (-2L; consolidate void noop into prior line + drop Step 1c comment as redundant):
    const semantic = await semanticMatch(task.task, opts.semanticThreshold) // void semantic.rule for v0.2+ install+factory feed

// L162-163 phaseId via TaskContext typed field:
  const phaseId = task.phaseId ?? 'unknown'
  await activatePhase(phaseId)

// L171 expertName + L172-186 wrappedSpawn closure (sessionId capture site):
  const expertName = (matched.decision.primary_expert as string | null) ?? 'unknown'
  let capturedSessionId: string | undefined
  // ... wrappedSpawn closure with onSessionId callback

// L187-199 success + error paths (W1 T1.3 ADD emitAudit BEFORE each return):
  try {
    const result = await ralphLoopWrap(wrappedSpawn, maxIter)
    await completePhase({ phaseId, sessionId: capturedSessionId, status: 'complete' })
    // NEW: emitAudit(task, decision, matched, { outcome: 'complete', routeLayer, sessionId: capturedSessionId, iterCount: null })
    return { ok: true, result, matchedRule: matched }
  } catch (error) {
    if (error instanceof MaxIterationsExceededError) {
      // NEW: emitAudit(task, decision, matched, { outcome: 'max-iter', routeLayer, sessionId: capturedSessionId, iterCount: null })
      return { aborted: true, reason: error.message }
    }
    if (error instanceof VerbatimCompleteFailError) {
      // NEW: emitAudit(task, decision, matched, { outcome: 'verbatim-fail', routeLayer, sessionId: capturedSessionId, iterCount: null })
      return { ok: false, phase: 'verbatim', error }
    }
    // NEW: emitAudit(task, decision, matched, { outcome: 'spawn-err', routeLayer, sessionId: capturedSessionId, iterCount: null })
    return { ok: false, phase: 'spawn', error: error as Error }
  }
```

routeLayer determination (W1 T1.3 ADD before Step 4 spawn block):
```typescript
// Determine route_layer for audit (L1 = matched rule; L3 = fallback; L2 = stub future)
const routeLayer: 'L1-keyword' | 'L3-fallback' = matched ? 'L1-keyword' : 'L3-fallback'
```

From src/checkpoint/engineHook.ts L1-48 (W1 T1.2 sister extract pattern延袭 — exact structural match):
```typescript
// src/checkpoint/engineHook.ts — Phase 3.1 W3 T3.2 (W-01 orchestrator promote PRIMARY).
// Extracted from engine.ts to keep engine.ts ≤200L Karpathy hard limit clean.
// Single responsibility: bridge engine.ts events → current-workflow.json + checkpoint.json double-write.
import { SCHEMA_VERSIONS } from '../types/schemaVersion.js'
import { activate as stateActivate, complete as stateComplete } from './state.js'
import { writeCheckpoint } from './template.js'

export interface EngineCheckpointHookCtx {
  phaseId: string
  sessionId?: string
  status: 'active' | 'complete'
  lastTask?: string
  keyDecisions?: string[]
  canonicalRefs?: string[]
}

export async function activatePhase(phaseId: string): Promise<{ checkpointPath: string }> {
  const checkpointPath = `.harnessed/checkpoints/${phaseId}.json`
  await stateActivate(phaseId, checkpointPath)
  return { checkpointPath }
}

export async function completePhase(ctx: EngineCheckpointHookCtx): Promise<void> {
  if (ctx.phaseId === 'unknown') {
    console.error('[harnessed] WARN engineHook: ...')
  }
  writeCheckpoint({ /* ... ctx fields ... */ })
  await stateComplete()
}
```

W1 T1.2 src/audit/hook.ts mirror structure target:
```typescript
// src/audit/hook.ts — Phase 4.3 W1 T1.2 (sister engineHook.ts ≤50L extract pattern延袭).
// Extracted thin wrapper keeps engine.ts ≤200L Karpathy hard limit clean.
// Single responsibility: bridge engine.ts outcome → audit log emit (fail-soft sync).
import type { ArbitrateResult, TaskContext } from '../routing/agentDefinition.js'
import type { Rule } from '../routing/decisionRules.js'
import { buildAuditRecord, emitAuditRecord } from './log.js'

export interface AuditHookCtx {
  outcome: 'complete' | 'max-iter' | 'verbatim-fail' | 'spawn-err' | 'install-err' | 'arbitrate-err'
  routeLayer: 'L1-keyword' | 'L2-semantic-stub' | 'L3-fallback'
  sessionId?: string
  iterCount: null  // Phase 4.3: null (ralphLoopWrap returns string only; defer v0.5+)
}

export function emitAudit(
  task: TaskContext,
  decision: ArbitrateResult,
  matched: Rule | null,
  ctx: AuditHookCtx,
): void {
  const record = buildAuditRecord(task, decision, matched, ctx)
  emitAuditRecord(record)
}
```

From src/checkpoint/state.ts L1-50 (W1 T1.1 sister writeFile pattern延袭 — adapt sync appendFileSync):
```typescript
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { Value } from '@sinclair/typebox/value'
// ...
export async function writeCurrentWorkflow(s: CurrentWorkflowV1Type): Promise<void> {
  if (!Value.Check(CurrentWorkflowV1, s)) {
    const errs = [...Value.Errors(CurrentWorkflowV1, s)].map((e) => e.message).join('; ')
    throw new WorkflowStateError(`current-workflow schema validation failed: ${errs}`)
  }
  await mkdir(dirname(STATE_PATH), { recursive: true })
  await writeFile(STATE_PATH, JSON.stringify(s, null, 2), 'utf8')
}
```

W1 T1.1 src/audit/log.ts adapt sync target:
```typescript
// src/audit/log.ts — Phase 4.3 W1 T1.1 (R8.1 audit log NEW infra).
// JSONL append-only writer + 11-field schema per D-01 LOCKED.
// Sync (NOT async sister state.ts): logging path no-await + atomic O_APPEND.
import { appendFileSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { createHash } from 'node:crypto'
import { type Static, Type } from '@sinclair/typebox'
import { Value } from '@sinclair/typebox/value'
import type { ArbitrateResult, TaskContext } from '../routing/agentDefinition.js'
import type { Rule } from '../routing/decisionRules.js'

const AUDIT_PATH = '.harnessed/audit.log'

export const AuditRecordSchema = Type.Object(
  {
    ts: Type.String(),
    phase: Type.String(),
    task_excerpt: Type.String(),
    task_sha1: Type.String(),
    matched_rule_id: Type.Union([Type.String(), Type.Null()]),
    primary_expert: Type.Union([Type.String(), Type.Null()]),
    secondary_expert: Type.Union([Type.String(), Type.Null()]),
    category: Type.String(),
    route_layer: Type.String(),
    outcome: Type.String(),
    session_id: Type.Union([Type.String(), Type.Null()]),
    iter_count: Type.Union([Type.Number(), Type.Null()]),
  },
  { additionalProperties: false },
)
export type AuditRecord = Static<typeof AuditRecordSchema>

export function buildAuditRecord(
  task: TaskContext,
  decision: ArbitrateResult,
  matched: Rule | null,
  ctx: { outcome: string; routeLayer: string; sessionId?: string; iterCount: number | null },
): AuditRecord {
  return {
    ts: new Date().toISOString(),
    phase: task.phaseId ?? 'unknown',
    task_excerpt: task.task.slice(0, 200),
    task_sha1: createHash('sha1').update(task.task).digest('hex'),
    matched_rule_id: matched?.id ?? null,
    primary_expert: decision.primary_expert ?? null,
    secondary_expert: decision.secondary_expert ?? null,
    category: decision.category,
    route_layer: ctx.routeLayer,
    outcome: ctx.outcome,
    session_id: ctx.sessionId ?? null,
    iter_count: ctx.iterCount,
  }
}

export function emitAuditRecord(record: AuditRecord): void {
  mkdirSync(dirname(AUDIT_PATH), { recursive: true })
  appendFileSync(AUDIT_PATH, JSON.stringify(record) + '\n')
}
```

From tests/checkpoint/state.test.ts L1-37 (W1 T1.4 sister vi.mock pattern延袭 — adapt sync node:fs):
```typescript
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const fsState = new Map<string, string>()
const mkdirCalls: string[] = []

vi.mock('node:fs/promises', () => ({
  readFile: async (p: string) => { /* ... */ },
  writeFile: async (p: string, data: string) => void fsState.set(p, data),
  mkdir: async (p: string) => void mkdirCalls.push(p),
}))
```

W1 T1.4 tests/audit/log.test.ts adapt sync target:
```typescript
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const appendedLines: string[] = []
const mkdirSyncCalls: string[] = []

vi.mock('node:fs', () => ({
  appendFileSync: (_p: string, data: string) => void appendedLines.push(data),
  mkdirSync: (_p: string, _opts?: unknown) => void mkdirSyncCalls.push(String(_p)),
}))

import { buildAuditRecord, emitAuditRecord, AuditRecordSchema } from '../../src/audit/log.js'
import { Value } from '@sinclair/typebox/value'

beforeEach(() => {
  appendedLines.length = 0
  mkdirSyncCalls.length = 0
})
afterEach(() => vi.clearAllMocks())
```

From .github/workflows/ci.yml L82-107 (W2 T2.4 MODIFY target — 4 surgical edits per RESEARCH § 4.5):
```yaml
# Line 82 step name:
- name: A7 acceptance bar — ADR 0001-0017 main body 守恒
# Line 85 first for loop:
          for n in 0001 0002 0003 0004 0005 0006 0007 0008 0009 0010 0011 0012 0013 0014 0015 0016 0017; do
# Line 96 second for loop (same):
          for n in 0001 0002 0003 0004 0005 0006 0007 0008 0009 0010 0011 0012 0013 0014 0015 0016 0017; do
# Line 107 echo:
          echo "A7 ✅ ADR 0001-0017 main body unchanged"
```

W2 T2.4 ADD `0018` to both loops + update step name + echo:
```yaml
# Line 82:
- name: A7 acceptance bar — ADR 0001-0018 main body 守恒
# Line 85:
          for n in 0001 0002 0003 0004 0005 0006 0007 0008 0009 0010 0011 0012 0013 0014 0015 0016 0017 0018; do
# Line 96 (same addition):
          for n in 0001 0002 0003 0004 0005 0006 0007 0008 0009 0010 0011 0012 0013 0014 0015 0016 0017 0018; do
# Line 107:
          echo "A7 ✅ ADR 0001-0018 main body unchanged"
```

From docs/adr/README.md L42-49 (W2 T2.3 MODIFY target — index entry format):
```markdown
| [0001](./0001-manifest-schema-v1.md) | Manifest Schema v1 (see ADR 0005 ...) | Accepted | 2026-05-11 |
| [0002](./0002-repo-structure-toolchain-v0.1.md) | Repository Structure and Toolchain v0.1 | Accepted | 2026-05-11 |
| [0003](./0003-install-method-count-errata.md) | Install Method Count Errata (5 → 6) | Accepted | 2026-05-12 |
| ... (0004-0008 entries) ...
```

W2 T2.3 ADD 3 NEW rows after L49 last existing entry (sister Phase 3.4 ADR 0017 single-add cadence延袭):
```markdown
| [0018](./0018-routing-audit-log.md) | Routing Audit Log (JSONL append-only + 11-field schema + forward-only from Phase 4.3) | Accepted | 2026-05-19 |
| [0019](./0019-state-dual-ssot-collapse-pattern.md) | STATE dual-SoT COLLAPSE Pattern (5-recurrence terminus — Phase 3.3 D-04 backfill) | Accepted | 2026-05-19 |
| [0020](./0020-hybrid-2clock-disambiguation.md) | HYBRID 2-clock Disambiguation (internal ship vs external organic co-maintainer — Phase 4.2 D-04 backfill) | Accepted | 2026-05-19 |
```

From scripts/check-state-archive-stale.mjs L10-14 (W0.2 conditional flip target per CONTEXT #BA round 2 RELAX):
```javascript
const ENFORCE = true // Phase 4.1 W0.1 flip round 2 — sister transparency gate cadence
const STATE_PATH = '.planning/STATE.md'
const SIZE_LIMIT = 200 // round 1; tighten 150 v0.4 per #AG → Phase 4.2 W0.1 re-eval per #BA carry
```

W0.2 CONDITIONAL flip target (Phase 4.3 1-line surgical IF post-W0.1 STATE ≤165L; otherwise defer #BA carry Phase 4.4+ W0):
```javascript
const SIZE_LIMIT = 175 // Phase 4.3 W0.2 round 2 tighten — sister DEFERRED #BA resolve round 2 RELAX (W0.1 trim outcome STATE post-trim ≤165L verified pre-flip; 10L safety headroom; relaxed from 200→150 sister target per CONTEXT #BA round 2 relax post-2nd-cycle sister H2 AA)
```

From sister .planning/phase-4.2/DOGFOOD-T2.X.md 58L format (W2 T2.14 gold-standard 100% reuse target):
```markdown
# Phase 4.2 T2.7 — Dogfood Report (3-axis empirical evidence: ...)

**Date**: 2026-05-18
**Verdict:** **PASS** (3/3 dogfood axes verified, miss: none)

## Axis A — ...
## Axis B — ...
## Axis C — ...
## Aggregate verification
## Disposition
```

W2 T2.14 mirror — 3 axes ADAPT per Phase 4.3 ARCHITECTURAL + milestone close scope:
- Axis A: R8.1 audit log infra — wc -l src/audit/log.ts ≤80 + hook.ts ≤50 + engine.ts ≤200 Karpathy hard + tests pass + manual emit smoke + jq 11-field schema valid
- Axis B: ADR backfill cluster — 0018/0019/0020 NEW + README +3 rows + ci.yml A7 iter 17→18 + A7 守恒 verify 0 diff pre-tag
- Axis C: v0.4.0 milestone close cluster — CHANGELOG + 3-file milestone archive triplet + ROADMAP SHIPPED ARCHIVED + triple tag LOCAL CREATE 3 tags + NO push verify

</interfaces>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| task.task input → src/audit/log.ts | untrusted task content crosses boundary into JSON serialization + sha1 hash (mitigated by D-01 sneak-block 11-field exact + additionalProperties:false TypeBox enforce; task.task only enters task_excerpt + task_sha1 fields data-only NOT path components) |
| src/audit/log.ts → `.harnessed/audit.log` filesystem | sync appendFileSync OS-level atomic O_APPEND for writes <PIPE_BUF ~4KB; single-maintainer dogfood phase + .harnessed/ user-controlled dir |
| docs/adr/0018-0020 NEW files → A7 CI gate (post-tag baseline) | A7 守恒 enforced after `adr-0018-accepted` tag push; PRE-tag executor MUST verify 0 diff on existing 0001-0017 main body |
| ci.yml A7 step iter 0017→0018 commit → `adr-0018-accepted` tag creation | STRICT ordering: commit + push BEFORE tag annotation timestamp; otherwise A7 gate fails on next CI run (STRIDE D workflow block) |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-4.3-01 | T (Tampering) | src/audit/log.ts AUDIT_PATH | mitigate | hardcoded string literal `'.harnessed/audit.log'` (NOT derived from task input); task.task only enters task_excerpt + task_sha1 data fields NOT path components; planner T1.1 acceptance `grep -q "const AUDIT_PATH = '.harnessed/audit.log'"` exit 0 + `! grep -qE "AUDIT_PATH.*join\|AUDIT_PATH.*concat\|AUDIT_PATH.*\\+"` exit 0 |
| T-4.3-02 | T (Tampering) | src/audit/log.ts appendFileSync symlink follow | accept | appendFileSync follows symlink per POSIX; single-maintainer dogfood + .harnessed/ user-controlled dir NOT externally writable surface; ADR 0018 documents "No symlink defense; multi-user deferred v0.5+ if signal" sister #BU defer rationale延袭 |
| T-4.3-03 | T (Tampering) | src/audit/log.ts concurrent write race | accept | appendFileSync OS-level atomic O_APPEND for writes <PIPE_BUF ~4KB; records ~200-400 bytes well within range; single-maintainer dogfood concurrent harnessed runs near-zero; ADR 0018 documents "No explicit lock; multi-process concurrent deferred v0.5+" sister #BU defer rationale |
| T-4.3-04 | I (Info Disclosure) | src/audit/log.ts record content | mitigate | D-01 LOCKED sneak-blocks PRE-MITIGATE: NO full agentDef 14-field dump (敏感 path 用户名 leak) + NO subagent text/result body (sensitive code leak) + NO MCP secrets / env vars; task_excerpt truncated 200 char limits exposure surface; task_sha1 one-way hash NOT reversible; matched_rule_id/primary_expert/category routing metadata NOT user content; planner T1.1 acceptance schema definition does NOT include `agentDef\|result\|subagent\|env\|secret` fields; additionalProperties:false TypeBox enforce 11 fields exact |
| T-4.3-05 | T (Tampering) | src/audit/log.ts log injection | mitigate | JSON.stringify() ENCODES newlines as `\\n` literal (not raw newline) — built-in protection; tests/audit/log.test.ts fixture 8 (BONUS) verifies task.task containing raw `\\n` results in encoded `\\\\n` in audit.log line + only 1 line appended NOT 2; planner T1.4 BONUS cell 8 explicit log injection test |
| T-4.3-06 | T (Tampering) | docs/adr/0001-0017 A7 守恒 violation | mitigate | A7 CI gate HARD enforce on push; executor MUST verify `git diff docs/adr/000[1-9]-*.md docs/adr/001[0-7]-*.md \| wc -l` == 0 BEFORE `adr-0018-accepted` tag creation (W2 T2.15 PRE-TAG acceptance); README.md NOT covered by A7 gate (not numbered pattern); NEW 0018/0019/0020 not in A7 gate until tag pushed; reviewer manual diff check before each tag annotation |
| T-4.3-07 | D (Denial of Service) | ci.yml A7 step iter ordering | mitigate | STRICT ordering per RESEARCH § 4.4: W2 T2.4 (ci.yml A7 iter 0017→0018 commit + push) MUST precede W2 T2.15 (adr-0018-accepted tag creation timestamp); planner T2.15 acceptance `git log --pretty=format:'%ct' .github/workflows/ci.yml \| head -1` < `git for-each-ref --format='%(creatordate:unix)' refs/tags/adr-0018-accepted` ordering verify; otherwise A7 gate fails on next CI run blocking all PRs (workflow DoS) |
| T-4.3-08 | R (Repudiation) | triple tag push premature | mitigate | CLAUDE.md commit safety NEVER push without user explicit approval (sister Phase 4.1+4.2 LOCAL CREATE 待 push 模式延袭 per CONTEXT D-04 sneak block #3); W2 T2.15 LOCAL CREATE only `git tag -a` (NO `git push --tags`); planner T2.15 acceptance `git ls-remote origin refs/tags/{adr-0018-accepted,v0.4.0-alpha.3-audit,v0.4.0}` all return empty (verify NO push); user-controlled push timing post-DOGFOOD verify; audit trail integrity preserved (no premature tag-then-rollback) |

ASVS L1 baseline: All threats either mitigated with specific implementation references (T-4.3-01/04/05/06/07/08) or accepted with documented rationale + future defer signal (T-4.3-02/03). No `high` severity unmitigated threats. STRIDE 8 nodes covered (S not applicable Phase 4.3 — internal trust boundary only; E not applicable — no privilege escalation surface).
</threat_model>

<verification>
# Overall Phase 4.3 checks (executed at W2 ship gate pre-triple-tag)

# === W0 cadence absorb verification ===
- `wc -l .planning/STATE.md` ≤ 175 (W0.2 flip path) OR ≤ 200 (W0.2 defer path)
- `grep -q "ARCHIVED FROM STATE — Phase 4.2" .planning/RETROSPECTIVE.md` exit 0 (W0.1 D2 cadence iter 4 archive section)
- `grep -q "Phase 4.3 W0.1 D2 cadence iter 4" .planning/RETROSPECTIVE.md` exit 0 (section header attribution)
- `node scripts/check-state-archive-stale.mjs` exit 0 with ENFORCE=true (post-W0.1 archive + post-W2 续编; SIZE_LIMIT=175 IF W0.2 flip OR =200 IF W0.2 defer)
- `node scripts/check-transparency-verdicts.mjs` exit 0 (regression — STATE_POSITION_RE OR-fallback matches Phase 4.3 SHIPPED literal)

# === W1 R8.1 NEW infrastructure verification ===
- `test -f src/audit/log.ts` exit 0 (NEW file present)
- `wc -l src/audit/log.ts` ≤ 80 (Karpathy hard cap; F1)
- `grep -q "const AUDIT_PATH = '.harnessed/audit.log'" src/audit/log.ts` exit 0 (D-01 + STRIDE T-4.3-01 mitigation hardcoded literal)
- `! grep -qE "AUDIT_PATH.*join|AUDIT_PATH.*concat|AUDIT_PATH.*\\+" src/audit/log.ts` exit 0 (NO path manipulation from task input — STRIDE T-4.3-01)
- `grep -q "AuditRecordSchema" src/audit/log.ts` exit 0 (TypeBox schema export)
- `grep -q "additionalProperties: false" src/audit/log.ts` exit 0 (D-01 + STRIDE T-4.3-04 mitigation 11 fields exact)
- `grep -c "Type\\.String\\|Type\\.Union\\|Type\\.Number" src/audit/log.ts` ≥ 12 (11 fields TypeBox count)
- `! grep -qE "agentDef|result_body|subagent|env_var|secret" src/audit/log.ts` exit 0 (D-01 sneak-block + STRIDE T-4.3-04 NO sensitive field leak)
- `grep -q "appendFileSync" src/audit/log.ts` exit 0 (sync atomic O_APPEND per RESEARCH § 2.3)
- `grep -q "createHash.*sha1" src/audit/log.ts` exit 0 (node:crypto zero-dep task_sha1)
- `test -f src/audit/hook.ts` exit 0 (NEW file present)
- `wc -l src/audit/hook.ts` ≤ 50 (Karpathy hard cap sister engineHook.ts; F2)
- `grep -q "export function emitAudit" src/audit/hook.ts` exit 0 (entry point export)
- `grep -q "AuditHookCtx" src/audit/hook.ts` exit 0 (discriminated union ctx interface)
- `wc -l src/routing/engine.ts` ≤ 200 (Karpathy hard limit per CLAUDE.md key reminder #4; HIGH RISK R-1 strict gate; F3)
- `grep -q "import.*emitAudit.*from.*'../audit/hook.js'" src/routing/engine.ts` exit 0 (W1 T1.3 import added)
- `grep -c "emitAudit(task, decision, matched" src/routing/engine.ts` == 4 (4 call sites — 1 success + 3 error paths)
- `grep -q "routeLayer" src/routing/engine.ts` exit 0 (routeLayer determination line added)
- `test -f tests/audit/log.test.ts` exit 0 (NEW file present)
- `corepack pnpm test -- tests/audit/log.test.ts --run` exit 0 (7-8 fixtures pass; F4)
- `test -f tests/audit/hook.test.ts` exit 0 (NEW file present)
- `corepack pnpm test -- tests/audit/hook.test.ts --run` exit 0 (3+ fixtures pass)
- `test -f docs/adr/0018-routing-audit-log.md` exit 0 (NEW PRIMARY ADR; F5)
- `grep -q "ADR 0018" docs/adr/0018-routing-audit-log.md` exit 0
- `grep -c "^## " docs/adr/0018-routing-audit-log.md` ≥ 9 (9-section errata format sister ADR 0017)
- `grep -q "Accepted (phase 4.3" docs/adr/0018-routing-audit-log.md` exit 0 (Status section)
- `grep -q "A7 Conservation\\|A7 守恒" docs/adr/0018-routing-audit-log.md` exit 0 (A7 section)
- `grep -q "see ADR 0019\\|ADR 0019.*STATE COLLAPSE" docs/adr/0018-routing-audit-log.md` exit 0 (D-02 forward-only cross-ref per CONTEXT D-02 L63)
- `wc -l docs/adr/0018-routing-audit-log.md` ≤ 250 (sister ADR 0017 204L precedent + buffer)

# === W2 R8.4 backfill verification ===
- `test -f docs/adr/0019-state-dual-ssot-collapse-pattern.md` exit 0 (NEW backfill; F6)
- `grep -c "^## " docs/adr/0019-state-dual-ssot-collapse-pattern.md` ≥ 5 (simplified 5-section format)
- `grep -q "5-recurrence\\|dual-SoT\\|COLLAPSE" docs/adr/0019-state-dual-ssot-collapse-pattern.md` exit 0 (Decision content)
- `test -f docs/adr/0020-hybrid-2clock-disambiguation.md` exit 0 (NEW backfill)
- `grep -c "^## " docs/adr/0020-hybrid-2clock-disambiguation.md` ≥ 5 (simplified 5-section format)
- `grep -q "HYBRID\\|2-clock\\|internal ship.*external" docs/adr/0020-hybrid-2clock-disambiguation.md` exit 0 (Decision content)
- `grep -c "| \\[0018\\]\\|| \\[0019\\]\\|| \\[0020\\]" docs/adr/README.md` == 3 (W2 T2.3 index +3 rows)
- `git diff docs/adr/000[1-9]-*.md docs/adr/001[0-7]-*.md | wc -l` == 0 (A7 守恒 PRE-TAG verify per STRIDE T-4.3-06)

# === W2 ci.yml A7 iter verification ===
- `grep -q "ADR 0001-0018 main body 守恒" .github/workflows/ci.yml` exit 0 (W2 T2.4 step name update)
- `grep -c "0001 0002 0003 0004 0005 0006 0007 0008 0009 0010 0011 0012 0013 0014 0015 0016 0017 0018" .github/workflows/ci.yml` == 2 (both for loops updated)
- `grep -q "A7 ✅ ADR 0001-0018 main body unchanged" .github/workflows/ci.yml` exit 0 (echo updated)

# === W2 CHANGELOG.md verification (F7) ===
- `test -f CHANGELOG.md` exit 0 (NEW root-level file)
- `wc -l CHANGELOG.md` ≤ 50 (Karpathy YAGNI ~30L estimate)
- `grep -q "Keep a Changelog\\|keepachangelog" CHANGELOG.md` exit 0 (Keep-a-Changelog format reference)
- `grep -q "## \\[0.4.0\\] - 2026-05-19" CHANGELOG.md` exit 0 (v0.4.0 section header)
- `grep -q "### Added" CHANGELOG.md` exit 0 (Added section)
- `grep -q "audit log\\|Routing audit log" CHANGELOG.md` exit 0 (R8.1 mention)
- `grep -q "ADR 0018\\|ADR 0019\\|ADR 0020" CHANGELOG.md` exit 0 (ADR backfill mention)
- `! grep -q "docs/RELEASES.md" CHANGELOG.md` exit 0 (D-04 sneak-block #1 no duplicate SoT)

# === W2 ship close docs verification ===
- `grep -q "Phase 4.3.*✅ SHIPPED\\|Phase 4.3 shipped ✅" .planning/ROADMAP.md` exit 0 (W2 T2.8)
- `grep -q "v0.4.0.*SHIPPED ARCHIVED\\|v0.4.0.*🎯 SHIPPED ARCHIVED" .planning/ROADMAP.md` exit 0 (v0.4.0 milestone close marker — NOT 2/3 PROGRESS anymore)
- `grep -q "Phase 4.3 SHIPPED" .planning/STATE.md` exit 0 (W2 T2.6 当前位置 update)
- `grep -q "Phase 4.3" PROJECT-SPEC.md` exit 0 (W2 T2.9 L3 Status)
- `grep -q "Phase 4.3" README.md` exit 0 (W2 T2.10 L9 + row append)

# === W2 milestone close 3-file archive verification (F8) ===
- `test -f .planning/milestones/v0.4.0-ROADMAP.md` exit 0 (W2 T2.11 NEW snapshot)
- `grep -q "Milestone v0.4.0" .planning/milestones/v0.4.0-ROADMAP.md` exit 0
- `grep -q "SHIPPED & ARCHIVED 2026-05-19" .planning/milestones/v0.4.0-ROADMAP.md` exit 0
- `test -f .planning/milestones/v0.4.0-REQUIREMENTS.md` exit 0 (W2 T2.12 NEW snapshot)
- `grep -q "R8.1\\|R8.2\\|R8.3\\|R8.4\\|R8.5" .planning/milestones/v0.4.0-REQUIREMENTS.md` exit 0 (5 v0.4 requirements verbatim)
- `test -f .planning/milestones/v0.4.0-MILESTONE-AUDIT.md` exit 0 (W2 T2.13 NEW)
- `grep -q "milestone: 0.4.0" .planning/milestones/v0.4.0-MILESTONE-AUDIT.md` exit 0 (YAML front-matter)
- `grep -q "v0.4.0 Milestone Audit" .planning/milestones/v0.4.0-MILESTONE-AUDIT.md` exit 0
- `grep -q "Cadence Patterns\\|§ 7 Cadence" .planning/milestones/v0.4.0-MILESTONE-AUDIT.md` exit 0 (§ 7 R-5 mitigation NEW section per CONTEXT #BO)
- `grep -q "R-5 publish-only\\|Architectural" .planning/milestones/v0.4.0-MILESTONE-AUDIT.md` exit 0 (§ 7 content reader misreading prevention)

# === W2 DOGFOOD verification ===
- `test -f .planning/phase-4.3/DOGFOOD-T2.X.md` exit 0 (NEW)
- `wc -l .planning/phase-4.3/DOGFOOD-T2.X.md` ≤ 60 (sister Phase 4.2 DOGFOOD 58L precedent)
- `grep -q "PASS" .planning/phase-4.3/DOGFOOD-T2.X.md` exit 0 (W2 T2.14 verdict)
- `grep -q "Axis A\\|Axis B\\|Axis C" .planning/phase-4.3/DOGFOOD-T2.X.md` exit 0 (3-axis present)

# === W2 triple tag LOCAL CREATE verification (F8) ===
- `git tag --list 'adr-0018-accepted' | wc -l` == 1 (W2 T2.15 tag 1 LOCAL CREATE)
- `git tag --list 'v0.4.0-alpha.3-audit' | wc -l` == 1 (W2 T2.15 tag 2)
- `git tag --list 'v0.4.0' | wc -l` == 1 (W2 T2.15 tag 3 — 🎯 milestone close)
- `git ls-remote origin refs/tags/adr-0018-accepted` returns empty (verify NO push — user controls)
- `git ls-remote origin refs/tags/v0.4.0-alpha.3-audit` returns empty
- `git ls-remote origin refs/tags/v0.4.0` returns empty
- **Triple tag ordering verify (STRIDE T-4.3-07 + STRIDE T-4.3-08)**: ci.yml A7 iter commit timestamp BEFORE adr-0018-accepted tag annotation timestamp (W2 T2.4 commit hash < W2 T2.15 tag creator timestamp)

# === Phase 4.3 tests overall verification ===
- `corepack pnpm typecheck` exit 0 (TypeScript clean post-W1 NEW src/audit/ + engine.ts MODIFY)
- `corepack pnpm lint` exit 0 (biome clean post-W1 NEW src/audit/ + engine.ts MODIFY; preempt mandatory pre-W1 commits per project memory feedback_biome-preempt.md)
- `corepack pnpm test` exit 0 (full suite 700+ pass — Phase 4.2 baseline + W1 NEW 10+ audit fixtures + 0 regression)

# === Biome lint preempt MANDATORY (per project memory feedback_biome-preempt.md 3 CI-red recurrences) ===
- `corepack pnpm exec biome check --write` exit 0 (pre-commit MANDATORY for W1 .ts touches src/audit/log.ts + src/audit/hook.ts + src/routing/engine.ts + tests/audit/*.test.ts + W0.2 IF FLIP path .mjs scripts/check-state-archive-stale.mjs; W2 .md + .yml NOT biome scope)
</verification>

<success_criteria>
Phase 4.3 SHIPPED when ALL of:

1. **W0 cadence absorb complete** (2 项 path dep STRICT):
   - W0.1 D2 cadence iter 4 REINFORCE: STATE.md Phase 4.2 narrative → RETROSPECTIVE.md verbatim (single-phase archive consistent with Phase 4.1 solo archive precedent per R-4 cadence consistency mitigation; ≥3-iter terminus stable signal pattern stable beyond 3rd-iter)
   - W0.2 CONDITIONAL D1 SIZE_LIMIT round 2 RELAX 200→175: IF STATE post-W0.1 ≤165L → flip 200→175 (10L safety headroom) / OTHERWISE DEFER #BA carry Phase 4.4+ W0 LOW priority (3rd consecutive DEFER per CONTEXT #BA decision tree)

2. **W1 R8.1 NEW infrastructure complete** (6 atomic — Phase 4.3 ARCHITECTURAL PRIMARY anchor):
   - src/audit/log.ts NEW ≤80L D-01 LOCKED 11-field schema TypeBox + AUDIT_PATH hardcoded literal + buildAuditRecord + emitAuditRecord sync + node:crypto sha1 zero-dep
   - src/audit/hook.ts NEW ≤50L sister engineHook.ts ≤50L PRIMARY helper extract pattern延袭 + AuditHookCtx discriminated union + emitAudit sync fail-soft
   - src/routing/engine.ts MODIFY surgical 2L shrink L120-122 + import emitAudit + routeLayer determination + 4 emitAudit call sites; CRITICAL post-MODIFY `wc -l src/routing/engine.ts` ≤ 200 Karpathy hard limit (HIGH RISK R-1)
   - tests/audit/log.test.ts NEW 7-8+ fixture cells vi.mock node:fs sync pattern + tests/audit/hook.test.ts NEW 3+ fixture cells
   - docs/adr/0018-routing-audit-log.md NEW ~180-200L PRIMARY 9-section errata format sister ADR 0017 100% reuse + D-02 forward-only cross-ref ADR 0019

3. **W2 R8.4 backfill + CHANGELOG + 🎯 v0.4.0 milestone close complete** (12-13 atomic):
   - docs/adr/0019-state-dual-ssot-collapse-pattern.md NEW backfill simplified 5-section format (Phase 3.3 D-04 source)
   - docs/adr/0020-hybrid-2clock-disambiguation.md NEW backfill same 5-section format (Phase 4.2 D-04 source)
   - docs/adr/README.md MODIFY +3 rows index entries 0018/0019/0020 (sister Phase 3.4 single-add cadence延袭)
   - .github/workflows/ci.yml MODIFY A7 step iter 0017→0018 (4 surgical edits; STRICT ordering before tag)
   - CHANGELOG.md NEW ~30L Keep-a-Changelog format root-level v0.4.0 entry
   - STATE.md + RETROSPECTIVE.md + ROADMAP.md + PROJECT-SPEC.md + README.md all v0.4.0 🎯 SHIPPED ARCHIVED close marker
   - 3-file milestone close archive triplet NEW (.planning/milestones/v0.4.0-{ROADMAP,REQUIREMENTS,MILESTONE-AUDIT}.md sister v0.3.0 100% reuse + MILESTONE-AUDIT § 7 NEW Cadence Patterns R-5 mitigation per CONTEXT #BO)
   - DOGFOOD-T2.X.md NEW PASS 3/3 axes (A R8.1 audit log infra + B ADR backfill cluster + C v0.4.0 milestone close)
   - Triple tag LOCAL CREATE 3 tags STRICT ORDER (adr-0018-accepted → v0.4.0-alpha.3-audit → 🎯 v0.4.0); NO push per CLAUDE.md commit safety

4. **All acceptance criteria F1-F8 verified** (per <verification> block above)

5. **All 4 D-decisions activated 闭环** (D-01 JSONL append-only 11-field + D-02 forward-only NOT backfill + D-03 ADR 0018 PRIMARY + 0019-0020 backfill + D-04 CHANGELOG + triple tag sister v0.3.0 cadence)

6. **M-01 ARCHITECTURAL phase class LOCK activated** (full ship cadence ADR 0018 + ci.yml A7 step iter 0017→0018 + triple tag — NOT R-5 publish-only sister Phase 4.1/4.2 single-baseline-only)

7. **DEFERRED #BA conditional RESOLVED Phase 4.3 W0.2** (FLIP 200→175 round 2 RELAX path) OR carry-forward Phase 4.4+ W0 (3rd consecutive DEFER path); #BU + #BV + #1/#BL + #5/#BM permanent defers unchanged; #BC + #BD + #BE + #BF + #BG + #BH + #BI + #BJ + #BK + #AH carry-forward unchanged

8. **STRIDE threat model 8 nodes mitigated** (per `<threat_model>` block above — T-4.3-01-08 all mitigations referenced specific D-decision sneak block守门 + STRIDE category + ASVS L1 baseline; 0 `high` severity unmitigated; T-4.3-02 + T-4.3-03 accepted with defer rationale single-maintainer dogfood scope)

9. **biome preempt verified pre-W1 commit MANDATORY** for .ts touches (src/audit/log.ts + hook.ts + src/routing/engine.ts + tests/audit/*.test.ts; mandatory per project memory `feedback_biome-preempt.md` 3 CI-red recurrences terminus续延); pre-W0.2 commit IF FLIP path for .mjs touches (scripts/check-state-archive-stale.mjs); W2 all .yml + .md (biome NOT scope, no-op)

10. **17/17 100% phase ship close** (16 → 17 phases shipped — Phase 4.3 close 🎯 v0.4.0 milestone close; next milestone v0.5/v1.0)

</success_criteria>

<output>
After completion:
1. Each task commits atomically per task_plan.md `Recommended commit msg` blocks (Karpathy why-not-what; sister Phase 4.2 W0+W1+W2 commit msg pattern延袭)
2. Resolved blocks in task_plan.md updated in-place per executor wave outcomes (PENDING → 实占 values)
3. `.planning/phase-4.3/DOGFOOD-T2.X.md` NEW W2 T2.14 PASS 3/3 axes empirical evidence
4. Triple tag LOCAL CREATE 3 tags STRICT ORDER (adr-0018-accepted + v0.4.0-alpha.3-audit + 🎯 v0.4.0) annotated NO push per CLAUDE.md commit safety
5. Phase 4.3 ship summary in `.planning/phase-4.3/` consistent with sister artifacts layout
6. v0.4.0 milestone progress: 2/3 PROGRESS → 3/3 🎯 SHIPPED ARCHIVED CLOSE (17/17 100% phase ship close)
7. 3-file milestone close archive triplet NEW at `.planning/milestones/v0.4.0-{ROADMAP,REQUIREMENTS,MILESTONE-AUDIT}.md` sister v0.3.0 close cadence延袭
8. DEFERRED carry items: #BA conditional RESOLVED FLIP 200→175 round 2 RELAX OR carry Phase 4.4+ W0 DEFER (3rd consecutive); #BU + #BV + #1/#BL + #5/#BM permanent defers unchanged; #BC + #BD + #BE + #BF + #BG + #BH + #BI + #BJ + #BK + #AH carry-forward unchanged; sister M+T tier carry to Phase 4.4+ W0 backlog if any new emerges
9. v0.5/v1.0 next milestone kickoff reference noted (post-v0.4.0 close — harnessed audit log --filter CLI subcommand consumer + DEFERRED #BU state lock + #BV uninstall command + #AH path traversal regex + benchmark expand evaluation per DEFERRED #BC)
</output>
</content>
</invoke>