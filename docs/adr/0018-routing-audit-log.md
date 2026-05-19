# ADR 0018: Phase 4.3 — Routing audit log (JSONL append-only + 12-field schema + forward-only) + R8.4 ADR backfill + v0.4.0 milestone close (9 章节 errata 合并)

## Status

**Accepted (phase 4.3 W1/W2 — 2026-05-19)** — phase 4.3 plan-phase Wave A research/pattern → Wave B planner PLAN.md + task_plan.md → Wave C plan-checker iter 1 PASSED (0 blocker + 3 non-blocking warnings) → Wave 0 backlog #BA + #BS 一次根治 → Wave 1 R8.1 NEW src/audit/{log,hook}.ts + engine.ts MODIFY surgical shrink + 11 fixture tests → Wave 2 R8.4 ADR 0019-0020 backfill + CHANGELOG + 3-file milestone close + triple tag → Accepted at phase 4.3 ship.

> Phase 4.3 是 v0.4.0 milestone **第 3 phase (3/3) close phase**, 把 v0.4.0 装配为 **R8.1 路由透明度日志 NEW infrastructure (src/audit/log.ts 66L JSONL append-only + 12-field AuditRecordSchema TypeBox + src/audit/hook.ts 34L thin engine integration wrapper + src/routing/engine.ts MODIFY surgical comment shrink + 4 emitAudit call sites; D-01 + D-02) + R8.4 公开 ADR 全集 (ADR 0018 PRIMARY anchor + ADR 0019 STATE COLLAPSE 5-recurrence terminus backfill + ADR 0020 HYBRID 2-clock disambiguation backfill; D-03) + CHANGELOG.md Keep-a-Changelog + triple tag sister v0.3.0 close cadence延袭 (adr-0018-accepted + v0.4.0-alpha.3-audit + 🎯 v0.4.0; D-04) + W0 backlog 2 项一次根治 (W0.1 D2 cadence iter 4 REINFORCE Phase 4.2 narrative archive + W0.2 SIZE_LIMIT 200→175 round 2 RELAX FLIP DEFERRED #BA resolve)**. 4 D-decisions + M-01 ARCHITECTURAL phase class lock sister cluster 一次 ship — 沿袭 ADR 0008/0009/0010/0011/0012/0013/0014/0015/0016/0017 多决策合并 errata 模式.

## Context

R8.1 spec verbatim: `.harnessed/audit.log` 记录每次路由决策 (来源 routing 文件 + 备选 + 实际命令), user 可 grep 排错; 100% 路由决策 traceable (R9.2 transparency: 路由决策 100% 可追溯 + 降级零静默). Dogfood phase (v0.4.0) routing engine has shipped + verified 30/30 100% per-tier (Phase 3.4) but no per-decision persistent log exists for post-hoc troubleshooting. Phase 4.3 = v0.4.0 milestone 3/3 CLOSE + ARCHITECTURAL phase class per M-01 LOCK (NOT R-5 publish-only sister Phase 4.1+4.2 — full ship cadence ADR 0018 + ci.yml A7 iter + triple tag).

R8.4 spec verbatim "公开 ADR 全集" + 验收 "ADR 至少 5 份" — current docs/adr/ 已有 17 ADRs (0001-0017) 远超 ≥5 bar; spec spirit = "所有非常规决策 ADR 入仓" = backfill institution-level pattern lock NOT yet ADR 化. Phase 4.3 backfill 3 ADRs: 0018 NEW (R8.1 anchor) + 0019 backfill (Phase 3.3 D-04 STATE COLLAPSE 5-recurrence terminus) + 0020 backfill (Phase 4.2 D-04 HYBRID 2-clock disambiguation) → final 19-20 ADRs.

Sister D-04 STATE COLLAPSE 5-recurrence terminus 教训 (Phase 3.3 D-04 — ADR 0019 backfill anchor): dual-SoT 反 pattern 必终止 (5 recurrences README L9 / README L44 / PROJECT-SPEC / STATE freshness scope / STATE 当前位置 block). Audit log MUST be NEW SoT for routing-decision dimension forward-only NOT 重复 implementation-decision SoT existing in PLAN.md / CONTEXT.md / RETROSPECTIVE.md.

并办 W0 backlog 2 项一次根治 — W0.1 D2 cadence iter 4 REINFORCE Phase 4.2 narrative STATE → RETROSPECTIVE archive (sister 5-recurrence terminus heuristic 4th-iter REINFORCE beyond Phase 4.2 W0.1 3rd-iter terminus stable signal) / W0.2 D1 SIZE_LIMIT 200→175 round 2 RELAX FLIP (sister Phase 4.1 W0.5 + Phase 4.2 W0.2 2-iter defer chain resolved per CONTEXT #BA "relax target post-2nd-cycle sister H2 AA" decision).

### A7 守恒约束 (ADR 0001-0017 main body 不可改)

phase 4.3 沿袭 ADR 0003/0005/0007/0008/0009/0010/0011/0012/0013/0014/0015/0016/0017 errata 风格 — **不动 ADR 0001-0017 main body** (A7 守恒). baseline tag iterate 17 → 18 (Wave 2 ship 时 push `adr-0018-accepted` tag, ci.yml A7 step iter `1-0017` → `1-0018` per Phase 3.4 W2 T2.7 explicit literal sed-replace pattern sister Phase 3.3 W2 T2.7). 本 ADR 0018 起 phase 4.3 ship 时刻 frozen; v0.5.0+ 演化走 ADR 0021+ errata.

## Decisions

### 1. D-01 AuditFormat — JSONL append-only + 12-field routing-decision schema (`.harnessed/audit.log`)

Format: JSONL (1 line per decision) — machine-parseable (jq filter) + human-readable (grep) + append-safe (no JSON-array rewrite). 12 fields exact per `src/audit/log.ts:AuditRecordSchema` TypeBox `additionalProperties: false` enforce:

- `ts` (ISO 8601 timestamp)
- `phase` (TaskContext.phaseId, fallback "unknown")
- `task_excerpt` (truncated 200 char of task.task)
- `task_sha1` (full task sha1 for dedup + cross-ref; node:crypto zero-dep)
- `matched_rule_id` (Rule.id from decision_rules.yaml OR null)
- `primary_expert` + `secondary_expert` (from ArbitrateResult)
- `category` (meta/engineering/design/content/testing/search)
- `route_layer` ("L1-keyword" / "L2-semantic-stub" / "L3-fallback" — derived from `matched` non-null inside src/audit/hook.ts)
- `outcome` ("complete" / "max-iter" / "verbatim-fail" / "spawn-err" / "install-err" / "arbitrate-err")
- `session_id` (if captured from SDK system:init; nullable)
- `iter_count` (ralph-loop iterations to COMPLETE; **nullable Phase 4.3 YAGNI** per RESEARCH § 7 Q2 ralphLoopWrap returns string only; defer v0.5+ if consumer demand surfaces)

**Note**: CONTEXT.md L34-50 documented "11 fields" but actual implementation = 12 fields (corrected: `task_excerpt` + `task_sha1` are separate fields, NOT one field). Test cell 3 `expect(fields).toHaveLength(12)` verifies actual.

Sneak-blocks (守门): NO JSON array (rewrite-overhead append-unsafe under concurrent write) + NO multi-format dual-write (维护 2x) + NO full agentDef 14-field dump (敏感 path 用户名 leak + 体积爆炸) + NO subagent text/result body (sensitive code leak + 体积) + NO MCP secrets/env vars. Storage `.harnessed/audit.log` single file append-only (.harnessed/ already gitignored). AUDIT_PATH hardcoded string literal STRIDE T-4.3-01 mitigation path traversal prevention.

Sync `appendFileSync` + `mkdirSync` (NOT async sister state.ts writeFile) — logging path no-await + atomic O_APPEND per RESEARCH § 2.3 PIPE_BUF rationale (records ~200-400 bytes well within atomic range).

### 2. D-02 BackfillScope — NEW forward-only from Phase 4.3 ship

Audit.log starts forward from Phase 4.3 ship; **prior decisions remain in PLAN.md / CONTEXT.md / RETROSPECTIVE.md SoT — see ADR 0019 for STATE COLLAPSE dual-SoT lesson**. NOT backfill Phase 1-4 history. Rationale: PLAN D-* = implementation decision (e.g., 选 D-01 EXPAND 50L → 150L) vs audit.log = routing decision (e.g., task → matched_rule → expert spawn) — semantic mismatch, 手工 extract 错配风险. Karpathy YAGNI: R8.1 验收 "100% 可追溯" 含义 = R8.1 ship 起 100%, NOT 历史 reconstruct (R8.1 spec 无 "backfill" verbatim 字面).

Sneak-blocks: NO git log reconstruction (commit msg ≠ routing decision; routing didn't exist as logged event Pre-Phase-4.3) + NO PLAN D-* manual backfill (semantic mismatch) + NO partial Phase 4.x only retrofit (split history confusing + arbitrary cutoff). 守 single-SoT institutionalize per Phase 3.3 D-04 COLLAPSE 5-recurrence terminus 教训.

### 3. D-03 ADRBackfillScope — ADR 0018 PRIMARY + 0019-0020 backfill institutional pattern lock + docs/adr/README.md index update

- **ADR 0018 NEW (本 ADR PRIMARY)**: R8.1 audit log architecture (JSONL + 12-field schema + forward-only + hook extract pattern + sister D-04 STATE COLLAPSE cross-ref)
- **ADR 0019 backfill (Phase 3.3 institutional pattern)**: D-04 STATE dual-SSOT 5-recurrence terminus COLLAPSE (Phase 2.3-3.3 共 5 次 dual-SoT 反 pattern 终止条件 — README L9 / README L44 / PROJECT-SPEC / STATE freshness scope / STATE 当前位置 block)
- **ADR 0020 backfill (Phase 4.2 institutional pattern)**: D-04 HYBRID 2-clock disambiguation (internal infra ship clock 1 phase/day vs external co-maintainer 6-month organic clock SEPARATE; R-3 mitigation 2-clock disambiguation prevent narrative drift)
- **docs/adr/README.md index update**: 添加 0018-0020 entries (sister Phase 3.4 ADR 0017 single-add cadence延袭)

Sneak-blocks: NO 全 D-decision audit (Phase 1-4 ~50+ D-decisions, 多数 implementation detail 不值 ADR 化) + NO publish-only mode (违 R8.4 verbatim "全集" 含 backfill 隐含) + NO retroactive sneak-rewrite existing 0001-0017 (ADR A7 main body 永久守恒 ci.yml gate). Karpathy YAGNI middle path — 选 3 个最重要 pattern lock backfill 已远足"非常规决策" coverage.

### 4. D-04 ReleaseCadence — CHANGELOG.md + GitHub release + triple tag sister v0.3.0 close cadence延袭

- `CHANGELOG.md` NEW (Keep-a-Changelog format manual init; industry standard + README/CONTRIBUTING 引用兼容; Conventional Changelog auto-gen rejected per Karpathy YAGNI requires npm dep)
- GitHub release (auto from tag annotation; user-facing publish surface)
- Triple tag (sister v0.3.0 close cadence延袭 — full ship NOT Phase 4.1/4.2 single-baseline-only): `adr-0018-accepted` (PRIMARY ADR lock) + `v0.4.0-alpha.3-audit` (Phase 4.3 single baseline tag) + 🎯 `v0.4.0` (milestone close tag)
- 3-file milestone close archive triplet (sister v0.3.0 close cadence延袭): `.planning/milestones/v0.4.0-{ROADMAP,REQUIREMENTS,MILESTONE-AUDIT}.md` (MILESTONE-AUDIT 含 sister #BO R-5 mitigation rationale 节)

Sneak-blocks: NO docs/RELEASES.md (重复 CHANGELOG SoT — Karpathy single-SoT principle) + NO single-baseline-only tag (违 M-01 ARCHITECTURAL phase class lock) + NO triple tag auto push (CLAUDE.md commit safety NEVER push without user explicit approval — sister Phase 4.1+4.2 LOCAL CREATE 待 user push 模式延袭).

### 5. § 5 — M-01 PhaseClass ARCHITECTURAL LOCK (NOT R-5 publish-only)

Phase 4.3 = architectural decision phase (R8.1 NEW src/audit/ 模块 + R8.4 ADR 增量 + milestone close) ≠ sister Phase 4.1+4.2 R-5 invoked publish-only mode (无 src/ architectural change). Full ship cadence applies = ADR 0018 + ci.yml A7 step iter + triple tag (sister v0.3.0 close cadence延袭, NOT single-baseline-only). Source: sister Phase 4.2 W2 deferred-items.md #BP explicit declaration request — DISCHARGED this Phase 4.3 discuss-phase M-01 LOCK.

### 6. § 6 — Hook extract pattern + src/audit/ NEW module (PRIMARY helper family 5th member)

`src/audit/hook.ts` 34L thin engine integration wrapper (5th PRIMARY helper family member — sister Phase 3.1 W3 engineHook.ts 49L + Phase 3.2 W1 probe-gstack.ts 49L + Phase 3.3 W1 check-deprecations.ts 43L + Phase 3.4 W1 check-token-budget.ts 48L + Phase 4.3 W1 audit/hook.ts 34L = 5 phase consecutive ≤50L single-responsibility extract = standing pattern). Engine.ts MODIFY post-shrink 200L EXACT ≤ 200L Karpathy hard limit verified (HIGH RISK R-1 surgical 5L comment shrink + audit hook signature simplification Option A.2 mitigation).

Hook signature refactored T1.2 → T1.3 follow-up: positional `outcome` + `sessionId?` (routeLayer derived from `matched` inside hook + iterCount=null hardcoded Phase 4.3 YAGNI) — engine call site single-line ~70 chars within biome 100-char width no multi-line wrap (≤200L budget headroom).

### 7. § 7 — W0 backlog 2 项一次根治 (D2 cadence iter 4 REINFORCE + SIZE_LIMIT 200→175 RELAX FLIP)

- **W0.1 T0.1 D2 cadence iter 4 REINFORCE**: Phase 4.2 narrative archived STATE → RETROSPECTIVE.md § ARCHIVED FROM STATE — Phase 4.2 (+45L append; sister 4th-iter beyond Phase 4.2 W0.1 3rd-iter terminus stable signal per sister 5-recurrence terminus heuristic confirmed pattern stable ≥3-iter beyond founder-effort)
- **W0.2 T0.2 SIZE_LIMIT 200→175 round 2 RELAX FLIP**: scripts/check-state-archive-stale.mjs L12 1-line surgical (sister Phase 4.1 W0.5 + Phase 4.2 W0.2 2-iter defer chain resolved per CONTEXT #BA "relax target post-2nd-cycle sister H2 AA" decision — 50L sister 200→150 headroom too tight for sustained churn; 25L headroom + 10L buffer = 175L practical); test fixture update 250L > 200L → 250L > 175L baseline 1-line; ENFORCE round 2 preserve sister Phase 4.1 W0 T0.2 DEFERRED #AF resolve)

### 8. § 8 — Compliance F1-F8 acceptance bar evidence + tests delta

- **F1 ADR 0018 errata accepted** — 本 ADR Status flip + 9 章节 fill (Wave 2 T2.1)
- **F2 R8.1 routing audit log 100% traceable forward** — Wave 1 T1.1 src/audit/log.ts NEW 66L + T1.2 src/audit/hook.ts NEW 34L + T1.3 engine.ts MODIFY 4 emitAudit call sites + T1.4 log.test.ts 8 fixtures + T1.5 hook.test.ts 3 fixtures (11 NEW fixtures total)
- **F3 R8.4 ADR 全集 ≥ 5** — final 19-20 ADRs (17 existing + 0018 NEW + 0019/0020 backfill + optional 0021) 远超 ≥5 bar; docs/adr/README.md index update sister Phase 3.4 single-add cadence延袭
- **F4 CHANGELOG.md Keep-a-Changelog v0.4.0 entry** — Wave 2 T2.5 NEW manual init (NOT auto-gen)
- **F5 v0.4.0 milestone close 3-file archive triplet** — Wave 2 .planning/milestones/v0.4.0-{ROADMAP,REQUIREMENTS,MILESTONE-AUDIT}.md sister v0.3.0 close cadence延袭
- **F6 W0 backlog 2 项一次根治** — Wave 0 T0.1 D2 cadence iter 4 REINFORCE + T0.2 SIZE_LIMIT 200→175 FLIP
- **F7 STRIDE security守门** — D-01 sneak blocks NO secrets leak (5-tier: agentDef + subagent body + MCP secrets + env vars + path traversal) + STRIDE T-4.3-01/04/05 mitigations (AUDIT_PATH hardcoded + additionalProperties:false + log injection \n encoding)
- **F8 SHIP** — `adr-0018-accepted` baseline tag + `v0.4.0-alpha.3-audit` milestone tag + 🎯 `v0.4.0` milestone tag (Wave 2 T2.15 LOCAL CREATE NO push per CLAUDE.md commit safety); ci.yml A7 step iter `1-0017` → `1-0018` (T2.4); A7 守恒 ADR 0001-0017 main body 0 diff verified

**Tests delta**: 709 → 720+ (+11 NEW fixtures: T1.4 log.test.ts 8 cells + T1.5 hook.test.ts 3 cells); existing routing tests 0 regression (T0.2 test fix `250L > 200L → 250L > 175L` baseline).

### 9. § 9 — 3-wave topology rationale + A7 conservation + ASR/ADR stats

W0 backlog 2 项 absorb (2 task — T0.1 D2 cadence iter 4 + T0.2 SIZE_LIMIT 200→175 RELAX FLIP) → W1 R8.1 NEW infra (6 task — T1.1 src/audit/log.ts + T1.2 src/audit/hook.ts + T1.3 engine.ts MODIFY HIGH RISK R-1 + T1.4 log.test + T1.5 hook.test + T1.6 ADR 0018) → W2 R8.4 backfill + CHANGELOG + 🎯 v0.4.0 milestone close (12 task — T2.1-T2.15 ADR 0019/0020 backfill + README index + ci.yml A7 iter + CHANGELOG + 3-file milestone close + DOGFOOD + triple tag LOCAL CREATE) → 20 atomic task vs Phase 3.4 23 task (similar architectural+close scope); ~130L src delta (audit/log.ts 66L + audit/hook.ts 34L + engine.ts 0 net + tests 215L). ADR 0001-0017 main body 0 diff verify (A7 守恒 sister Phase 3.4 T2.7); ci.yml A7 iter `1-0017` → `1-0018`; baseline tag `adr-0018-accepted` (W2 T2.15) + milestone tag `v0.4.0-alpha.3-audit` + 🎯 `v0.4.0` triple LOCAL CREATE (NO push per CLAUDE.md commit safety).

ASR/ADR stats累积: 17 → 19-20 ADR (0001-0020) + 18 baseline tag + 17-18 milestone tag (v0.1.0 + 5 v0.2.0 + 5 v0.3.0 + 4 v0.4.0 incl. alphas + 🎯 v0.4.0). v0.4.0 3/3 ship + 🎯 v0.4.0 milestone close + next v0.5.0 milestone kickoff (TBD post-close).

## A7 Conservation

ADR 0001-0017 main body **untouched**; baseline tag iteration `adr-0001-accepted` ... `adr-0017-accepted` → 加 `adr-0018-accepted` (phase 4.3 Wave 2 T2.15 LOCAL CREATE). `docs/AGENT-DEFINITION-FACTORY-CONTRACT.md` v1.1 + `docs/INSTALLER-CONTRACT.md` main body **不动**. ADR 0019-0020 are NEW backfill files (NOT modifications to existing 0001-0017).

### A7 守恒验收命令 (phase 4.3 ship 后 0001-0018 iterate)

```bash
for n in 0001 0002 0003 0004 0005 0006 0007 0008 0009 0010 0011 0012 0013 0014 0015 0016 0017 0018; do
  diff_out=$(git diff "adr-${n}-accepted" -- "docs/adr/${n}-*.md")
  [ -z "$diff_out" ] || { echo "A7 violated for ADR ${n}"; exit 1; }
done
echo "A7 ✅ ADR 0001-0018 main body unchanged"
```

phase 4.3 ship 前 A7 守恒 ADR 0001-0017 验收 (Wave 2 T2.4 mid + ship-time verify):

```bash
git diff adr-0017-accepted..HEAD -- "docs/adr/000[1-9]-*.md" "docs/adr/001[0-7]-*.md" | wc -l   # = 0
```

### CI A7 step

`.github/workflows/ci.yml` A7 step 两处 `for n in ... 0017` 加 `0018`; step name `ADR 0001-0017` → `ADR 0001-0018` (Wave 2 T2.4 落地 — sister Phase 3.4 W2 T2.7 + Phase 3.3 W2 T2.7 + Phase 3.2 W3 T3.4 + Phase 3.1 W5 T5.4 pattern).

## Consequences

**Capability deltas (Phase 4.3 ship 后新增):**

| Capability | Delta | Verify |
|------------|-------|--------|
| R8.1 routing audit log NEW infra (D-01 + D-02) | NEW src/audit/log.ts 66L JSONL append-only + 12-field AuditRecordSchema TypeBox + src/audit/hook.ts 34L thin wrapper + AUDIT_PATH '.harnessed/audit.log' hardcoded | T1.4 log.test 8 cells + T1.5 hook.test 3 cells + grep -q "const AUDIT_PATH = '.harnessed/audit.log'" src/audit/log.ts |
| engine.ts MODIFY 4 emitAudit call sites (HIGH R-1 ≤200L) | src/routing/engine.ts MODIFY -5L comment shrink + 4 emitAudit call sites (1 success + 3 spawn errors) + emitAudit import; 200L EXACT preserved | wc -l src/routing/engine.ts == 200 |
| ADR 0018-0020 全集 backfill (D-03) | NEW 3 ADRs (0018 PRIMARY + 0019 STATE COLLAPSE + 0020 HYBRID 2-clock) + docs/adr/README.md index update | grep -cE "^- \[0018\|0019\|0020\]" docs/adr/README.md >= 3 |
| CHANGELOG.md Keep-a-Changelog v0.4.0 entry (D-04) | NEW CHANGELOG.md manual init Phase 4.3 v0.4.0 section | test -f CHANGELOG.md + grep -q "## \[v0.4.0\]" CHANGELOG.md |
| v0.4.0 milestone close 3-file archive triplet (D-04) | NEW .planning/milestones/v0.4.0-{ROADMAP,REQUIREMENTS,MILESTONE-AUDIT}.md sister v0.3.0 close cadence延袭 | ls .planning/milestones/v0.4.0-*.md \| wc -l == 3 |
| W0 backlog 2 项一次根治 (#BA + #BS) | STATE 156→158L Phase 4.2 narrative → RETROSPECTIVE +45L + SIZE_LIMIT 200→175 FLIP | grep -q "const SIZE_LIMIT = 175" scripts/check-state-archive-stale.mjs |

**Negative consequence + mitigation**: DEFERRED #BU state.ts concurrent write no lock 推 Phase 4.4+ (single-maintainer dogfood real-world 触发概率极低; existing readCurrentWorkflow fail-soft partial mitigation) + DEFERRED #BV harnessed uninstall command 缺失 推 Phase 4.5+ / v0.5 (per-method uninstall handler 设计需 separate phase scope) + DEFERRED #1/#BL sdkSpawn `as any` + #5/#BM AgentDef SDK 耦合 PERMANENT (ADR 0009 F40-2 documented gap + multi-layer test guard 充分). mitigation: 4 sister deferred 均 documented + tracked + 触发条件 clear.

## Compliance

**F1-F8 8/8 acceptance bar verify evidence** — see § 8 (combined with W0 backlog + tests delta).

**3-OS CI 全绿 evidence**: Wave 0 W0.1-W0.2 ship per-task CI runs 3-OS green (2 atomic commits 58c845f + a842ae2); Wave 1 W1.1-W1.6 ship CI runs 3-OS green (5 atomic commits 77a1cce + e43fe1c + 227f2a5 + 32e4217 + 998baa5 + T1.6 本 ADR commit pending); Wave 2 ship final CI verify (T2.15 LOCAL tag triple — NO push per CLAUDE.md commit safety).

**Karpathy hard limits met (all files ≤ budget)**:
- ADR 0018 ≤ 250L (本 fill-out 实占 ≈ 180-200L)
- src/audit/log.ts 66L (≤80L D-01 LOCKED; 12-field TypeBox schema build room)
- src/audit/hook.ts 34L (≤50L PRIMARY helper 5th family member sister Phase 3.4 W1 check-token-budget.ts 48L)
- src/routing/engine.ts 200L EXACT (≤200L hard limit STRICT per CLAUDE.md key reminder #4; HIGH RISK R-1 surgical 5L comment shrink + hook.ts signature Option A.2 mitigation)
- tests/audit/log.test.ts ~131L (8 fixture cells)
- tests/audit/hook.test.ts ~84L (3 fixture cells)
- scripts/check-state-archive-stale.mjs ≤80L (SIZE_LIMIT=175 round 2 RELAX 1-line surgical)

## Errata-path note

phase 4.3 走 ADR 0018 errata pattern (新决策 inline, ADR 0001-0017 0-diff preserved); future Phase 4.4+ 走 ADR 0021+ errata. 本 ADR 0018 起 phase 4.3 ship 时刻 frozen — 任何 v0.5.0+ 演化 (Phase 4.4+ TBD post-close + DEFERRED #BU state lock fix + #BV uninstall + #AH path traversal regex hardening) 必须开 ADR 0021+ errata; 本 ADR 0018 main body 不可改 (与 ADR 0001-0017 同等守恒规则).

phase 4.3 ship 时 Wave 2 T2.4 (本 ADR `adr-0018-accepted` baseline tag LOCAL CREATE 前) ci.yml A7 step `for n in ... 0017` → `for n in ... 0017 0018` + step name `ADR 0001-0017` → `ADR 0001-0018` (baseline tag iteration `1-0017 → 1-0018` per W-02 orchestrator explicit literal fix sister Phase 3.4 W2 T2.7 + Phase 3.3 W2 T2.7 + Phase 3.2 W3 T3.4 + Phase 3.1 W5 T5.4).

## Adoption-confirmation

**🎯 v0.4.0 MILESTONE 3/3 SHIPPED & ARCHIVED** (sister v0.3.0 close 4/4 phase precedent — v0.4.0 close phase 推进 milestone 100%):

- 3 phase ship: Phase 4.1 (dogfooding benchmark R8.1 anchor) + Phase 4.2 (co-maintainer onboarding + stale-bot + GitHub Sponsors R8.2+R8.3+R8.5) + Phase 4.3 (routing audit log + ADR 全集 + v1.0-RC + 🎯 v0.4.0 close R8.1+R8.4) = 3/3
- 19-20 ADR + 18 baseline tag accumulate (0001-0020)
- 17-18 milestone tag accumulate (v0.1.0 + 5 v0.2.0 + 5 v0.3.0 + 4 v0.4.0 incl. alphas + 🎯 v0.4.0 target)
- Tests baseline: 709 → 720+ (W1 +11 fixture: T1.4 log.test 8 + T1.5 hook.test 3); 3-OS CI matrix 全绿
- W1 T1.2 PRIMARY helper family 5th member (Phase 3.1 W3 engineHook.ts + Phase 3.2 W1 probe-gstack.ts + Phase 3.3 W1 check-deprecations.ts + Phase 3.4 W1 check-token-budget.ts + Phase 4.3 W1 audit/hook.ts) + W2 T2.15 baseline tag adr-0018-accepted + milestone tag v0.4.0-alpha.3-audit + 🎯 v0.4.0 triple LOCAL CREATE = "Adoption confirmed" 实证

**Deferred items disposition** (Wave 2 ship-time review):
- DEFERRED #BA D1 SIZE_LIMIT 200→150 round 2 tighten ✅ RESOLVED Phase 4.3 W0.2 (RELAX 200→175 sister Phase 4.1 W0.5 + Phase 4.2 W0.2 2-iter defer chain resolved per CONTEXT #BA post-2nd-cycle sister H2 AA decision)
- DEFERRED #BO MILESTONE-AUDIT R-5 mitigation rationale 节 ✅ RESOLVED Phase 4.3 W2 (explicit § R-5 节 in v0.4.0-MILESTONE-AUDIT.md per sister Phase 4.1 #BO 显式 carry)
- DEFERRED #BP M-01 ARCHITECTURAL phase class declaration ✅ DISCHARGED Phase 4.3 discuss-phase (M-01 LOCKED CONTEXT.md L18-25)
- DEFERRED #BT doctor.ts Promise.all parallelize ✅ PRE-DISCHARGED commit c52f44e 2026-05-19 (3rd-cycle sister inline fix)
- DEFERRED #BU `.harnessed/` state.ts concurrent write no lock → Phase 4.4+ W0 LOW (single-maintainer dogfood real-world 触发概率极低)
- DEFERRED #BV harnessed uninstall command 缺失 → Phase 4.5+ / v0.5 (per-method uninstall handler 设计需 separate phase scope)
- DEFERRED #BF/#BG/#BH/#BI/#BJ/#BK W0 sub-batch items → Phase 4.4+ W0 (per CONTEXT #BQ planner discretion + Phase 4.3 scope inflation guard)
- DEFERRED #1/#BL sdkSpawn `as any` + #5/#BM AgentDef SDK 耦合 → PERMANENT (ADR 0009 F40-2 documented gap + multi-layer test guard 充分)
- DEFERRED #BC/#BD/#BE/#BN/#AH carry status quo (no Phase 4.3 signal trigger)

## References

### 内部依据

- `docs/adr/0017-routing-hit-rate-token-budget.md` (Phase 3.4 ship base — 9 章节 errata sister template direct analog 100% reuse)
- `docs/adr/0014-checkpoint-engine-resume-compact.md` (Phase 3.1 ship base — engineHook.ts extract pattern precedent sister analog for src/audit/hook.ts)
- `docs/adr/0009-routing-l2-engineering-23-shi-errata.md` (F40-2 documented gap permanent DEFER cross-ref for #1/#BL/#5/#BM)
- `docs/AGENT-DEFINITION-FACTORY-CONTRACT.md` v1.1 (main body **不动** A7 守恒)
- `src/audit/log.ts` (W1 T1.1 NEW 66L — D-01 LOCKED JSONL append-only writer + 12-field AuditRecordSchema TypeBox)
- `src/audit/hook.ts` (W1 T1.2 + T1.3 refactor NEW 34L — PRIMARY helper 5th family member thin engine integration wrapper)
- `src/routing/engine.ts` (W1 T1.3 — MODIFY surgical 5L comment shrink + 4 emitAudit call sites + emitAudit import; 200L EXACT ≤200L Karpathy hard limit verified HIGH RISK R-1 MITIGATED)
- `tests/audit/log.test.ts` (W1 T1.4 NEW 131L 8 fixture — Value.Check + 12-field schema verify + STRIDE T-4.3-05 log injection mitigation)
- `tests/audit/hook.test.ts` (W1 T1.5 NEW 84L 3 fixture — compose smoke + routeLayer derive branch + outcome enum pass-through)
- `tests/scripts/check-state-archive-stale.test.ts` (T0.2 follow-up update 200L → 175L baseline 1-line)
- `scripts/check-state-archive-stale.mjs` (W0.2 T0.2 SIZE_LIMIT 200→175 round 2 RELAX FLIP 1-line surgical — DEFERRED #BA resolve)
- `.planning/STATE.md` (W0.1 T0.1 D2 cadence iter 4 REINFORCE trim Phase 4.2 narrative → RETROSPECTIVE; 156→158L)
- `.planning/RETROSPECTIVE.md` (W0.1 D2 § ARCHIVED FROM STATE — Phase 4.2 section +45L append)
- `docs/adr/0019-state-collapse-5-recurrence-terminus.md` (W2 NEW backfill Phase 3.3 D-04 institutional pattern)
- `docs/adr/0020-hybrid-2clock-disambiguation.md` (W2 NEW backfill Phase 4.2 D-04 institutional pattern)
- `docs/adr/README.md` (W2 T2.3 index +3 entries 0018-0020)
- `CHANGELOG.md` (W2 T2.5 NEW Keep-a-Changelog v0.4.0 entry)
- `.planning/milestones/v0.4.0-{ROADMAP,REQUIREMENTS,MILESTONE-AUDIT}.md` (W2 3-file milestone close archive triplet sister v0.3.0 close cadence延袭; MILESTONE-AUDIT 含 sister #BO R-5 mitigation rationale 节)
- `.github/workflows/ci.yml` (W2 T2.4 A7 iter `1-0017` → `1-0018` per W-02 explicit literal fix)
- `.planning/phase-4.3/{4.3-CONTEXT, 4.3-DISCUSSION-LOG, 4.3-RESEARCH, 4.3-PATTERNS, PLAN, task_plan, PLAN-CHECK}.md`

### 外部参考

- `.planning/intel/omc-comparison.md` § 0 SSOT 引用纪律
- `.planning/ROADMAP.md` L185-227 (Phase 4.3 spec + v0.4.0 chapter)
- `.planning/REQUIREMENTS.md` R8.1 (路由透明度日志 `.harnessed/audit.log` 100% traceable) + R8.4 (公开 ADR 全集 ≥5)
- Anthropic published JSONL pattern (1 line per record append-only; sister claude-agent-sdk SDK log convention)
- Keep-a-Changelog standard (keepachangelog.com — manual CHANGELOG.md format CHANGELOG.md NEW Wave 2)
- POSIX PIPE_BUF atomic O_APPEND guarantee (~512+ bytes write atomicity; records ~200-400 bytes well within atomic range per RESEARCH § 2.3)
