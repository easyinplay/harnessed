# Phase 4.2 — deferred-items.md

> **Authored**: 2026-05-18 (Phase 4.2 W0 T0.2 Branch B DEFER PATH active per § 8.2 decision tree)
> **Author**: gsd-executor (Phase 4.2 W0.2 conditional)
> **Sources**: task_plan.md § Resolved (T0.2) Branch B DEFER outcome + RESEARCH.md § 8.2 decision tree + PATTERNS.md § 5 R-5 conditional path uncertainty
> **Style**: 沿袭 sister Phase 4.1 deferred-items.md (NEW file precedent per Phase 4.2 W0 first-time inhabitant — Phase 4.1 W0.5 DEFER path created sister deferred-items.md as carry-forward register)

> **Purpose**: Phase 4.2-specific register for items deferred at ship-time per W0/W1/W2 task outcomes. Items registered here flow into next-phase STATE.md 待办 P1 + RETROSPECTIVE.md § Cost Patterns DEFERRED carry-forward inventory at Phase 4.2 ship close (W2 T2.1/T2.2).

---

## DEFERRED items registered at Phase 4.2 W0 (2026-05-18)

### #BA — D1 SIZE_LIMIT round 2 tighten 200→150 (carry-forward Phase 4.3 W0 LOW priority defensive)

**Status**: DEFERRED (Phase 4.2 W0.2 Branch B DEFER PATH active per § 8.2 decision tree)
**Origin**: Phase 4.1 W0 T0.3 (W0.5 conditional DEFER path active 2026-05-18; sister precedent post-Phase-4.1-W0.3 STATE 143L > 140L threshold → DEFER path active; carried forward to Phase 4.2 W0.2 conditional)
**Phase 4.2 W0.2 outcome**: post-T0.1 STATE 150L falls in 141-150L range (≥10L headroom threshold NOT met for round 2 tighten); insufficient safe margin for `SIZE_LIMIT = 200 → 150` flip — flipping at 150L baseline would leave 0L headroom for W2 T2.1 STATE 续编 Phase 4.2 SHIPPED event log delta (+5-10L expected per sister Phase 4.1 W2 T2.1 +3L precedent) → post-W2 续编 STATE would exceed SIZE_LIMIT=150 trigger CI fail.

**Decision rationale** (defensive against over-tighten brittle per R-02 mitigation):
- Sister Phase 4.1 W0.5 DEFER path precedent延袭 (post-W0.3 trim STATE 143L > 140L threshold same rationale)
- W0.1 D2 cadence iter 3 trim under § 8.3 ~14L projection (only -1L net; 关键决策 area lacked Phase 4.1 D-decision rows ready to delete — sister Phase 4.1 W0.3 had 7 ready-to-archive rows whereas Phase 4.2 baseline already condensed by Phase 4.1 W2 T2.1)
- R-02 over-tighten brittle pattern: flip ENFORCE flags / tighten gates should have safety margin — flipping at 150L baseline (0 headroom) would trigger CI fail on first content addition (sister Phase 4.1 W0.2 ENFORCE flip downstream test regression lesson — atomic test fix bundle T1.6 mitigated; principle: don't flip at exact threshold)
- Karpathy YAGNI: SIZE_LIMIT=200 round 1 sufficient for current STATE.md role (post-trim 150L well under 200L; round 2 tighten 150 is "nice to have" NOT mission-critical)

**Carry-forward target**: Phase 4.3 W0 LOW priority defensive
- **Conditions for FLIP at Phase 4.3 W0**: post-Phase-4.2-ship STATE size + Phase 4.3 W0 D2 cadence iter 4 trim Phase 4.2 narrative outcome — IF post-iter-4 STATE ≤140L → FLIP safe / IF 141-150L → DEFER again #BA carry Phase 4.4+ (assuming v0.4.0 close at Phase 4.3 reserves milestone tag delta evaluation)
- **Alternative**: SIZE_LIMIT=200 round 1 may remain permanent if v0.4.0 close + v0.5+ project growth absorbs SIZE_LIMIT headroom — Karpathy YAGNI reassess at v0.5+ benchmark trigger

**Sister cross-reference**: Phase 4.1 W0.5 conditional task DEFER path → registered as #BA carry-forward Phase 4.2 W0 → Phase 4.2 W0.2 conditional task DEFER path → registered as #BA carry-forward Phase 4.3 W0 (2-iter defer chain; sister 5-recurrence terminus heuristic suggests reassess at iter 3 IF defer continues — i.e. Phase 4.4+ if Phase 4.3 W0.2 also defers, reassess D-decision necessity)

---

## Notes (cadence verification)

- **Phase 4.2 W0 backlog absorb**: 1 项 #BA conditional (carry from Phase 4.1) — RESOLVED via DEFER branch (NOT FLIP); #BB ✅ pre-RESOLVED Phase 4.2 discuss-phase 2026-05-18 (HYBRID 2-clock LOCKED D-04); #BC defer no signal (currently 30/30 100% routing PASS); #BD ADVISORY plan-checker future iterations; #BE R1+R2 cross-validation lesson registered Phase 4.2 plan-phase Wave C orchestrator FIX (institutional carry); #AH defer Phase 4.0+ conditional unchanged
- **#BE bonus** (Phase 4.2 plan-phase Wave C orchestrator FIX institutional lesson registered as DEFERRED carry — sister Phase 4.1 #BD regex 2-pass validation pattern lock precedent延袭; future plan-checker iterations adopt R1+R2 cross-validation as standing process)

*Phase 4.2 W0 deferred-items.md complete — DEFERRED #BA carry-forward Phase 4.3 W0 registered + #BE institutional lesson registered. Next-phase carry-forward inventory flows into Phase 4.2 W2 T2.2 RETROSPECTIVE.md § Cost patterns DEFERRED section at ship close.*

---

## Phase 4.2 ship sister review absorb (2026-05-18, post-W2 ship)

Sister review surfaced 2 H + 7 M + 4 L = 13 observations (10 REAL + 3 unverified/intentional). Tiered absorb per established cadence — H inline this cycle / M+L → Phase 4.3 W0 prereq backlog.

### H-tier inline absorbed (this commit cycle)

- **H1 version sync drift** ✅ FIXED 2026-05-18 (3-source drift: src/index.ts L4 `0.1.0-alpha.1` / src/cli.ts L21 `0.1.0-alpha.2-installer-runtime` / package.json L3 `0.3.0`). Both files now `import pkg from '../package.json' with { type: 'json' }` reading `pkg.version` — sister Phase 3.4 W0 T0.2 #AD install.ts pattern延袭. Post-fix `node dist/cli.mjs --version` → `0.3.0` (was stuck on baked-in alpha.2 literal across all CLI invocations); typecheck PASS + 709 tests PASS.
- **H2 audit N+1 file read** ✅ FIXED 2026-05-18 (src/cli/audit.ts L116-121: per yaml `readFile` once for validateManifests AND auditOne internally reads again at L37). Refactored `auditOne(yamlPath, preReadSrc?)` to accept optional pre-read src + `auditOne(y, src)` at call site — eliminates double-read while preserving auditOne standalone usability.

### Phase 4.3 W0 prereq backlog (sister M+L tier carry-forward)

| # | Severity | Item | Disposition |
|---|----------|------|-------------|
| #BF | M | `runArgs` 3-installer duplicate (ccPluginMarketplace L49 + mcpHttpAdd L47 + mcpStdioAdd L40) → extract `src/installers/lib/runClaudeArgs.ts` | Phase 4.3 W0 MED |
| #BG | M | `err()` helper 8-file duplicate (7 installers + manifest/security.ts) → extract `src/installers/lib/err.ts` OR `src/manifest/lib/err.ts` | Phase 4.3 W0 MED |
| #BH | M | H1 gate校验 duplicate in CLI files → extract `src/cli/lib/validateFlags.ts` (need verify file count first; sister review said 5) | Phase 4.3 W0 LOW (verify scope first) |
| #BI | M | dry-run/abort/result pattern 5+ sites → abstract common result handler | Phase 4.3 W0 LOW (verify scope first) |
| #BJ | M (cosmetic) | `process.exit() + return` unreachable code (rollback.ts L55+L68+L80 / resume.ts L19 / gc.ts L80) → remove redundant returns OR throw + top catch | Phase 4.3 W0 LOW (cosmetic, biome won't catch) |
| #BK | M | `writeFileSync` no try-catch (manifest-add.ts L70) → wrap with friendly error | Phase 4.3 W0 LOW (rare scenario; only on permission/RO FS) |
| #BL | L | `as unknown as` double cast (validate.ts L22+L39) → add type-safe adapter OR explicit comment for Ajv/TypeBox gap | Phase 4.3 W0 DEFER (already pattern-known gap) |
| #BM | L | Semantic router v0.1 stub (engine.ts L117-122) — **NOT absorb**: intentional ADR 0009 errata F40-2 forward-compat lock for v0.2+ activation; removing breaks design intent | DEFER PERMANENT (annotate ADR cross-ref in code if not present) |
| #BN | L | 中英混写注释 — **NOT absorb**: project by-design bilingual (用户 native 中文 + CLAUDE.md 全中文规则); surface only when R8.2 external contributor onboarding triggers signal | DEFER conditional (R8.2 6-month organic window + Sponsors community signal) |

### Sister review WRONG path note

- M7 review said `void isMap` at `src/cli/security.ts:160` — actual file is `src/manifest/security.ts:160` (no `src/cli/security.ts` exists). Pattern is intentional `void <import>` suppress-unused-warning idiom; isMap is imported but only used conditionally. Recommend keep as-is.

### Sister cadence iter

Phase 4.2 ship sister = 8th "deferred → next phase W0 一次根治" cadence iter (Phase 2.3 → 2.4 → 3.1 → 3.2 → 3.3 → 3.4 → 4.1 → 4.2 → next 4.3). H absorb same-cycle + M+L → next phase W0 pattern stable 6 phase 连续.

---

## Phase 4.2 ship sister 2nd-cycle absorb (2026-05-18, post-5996ea1 re-review)

2nd-cycle sister review (post-fix verify) surfaced 2 H + 3 M + 4 T = 9 observations:

### H-tier 2nd cycle inline absorbed

- **H1 (2nd cycle) 5996ea1 transparency** ✅ FIXED — NEW `SISTER-REVIEW-FINDINGS.md` redirect doc (Option BB) pointing to deferred-items.md L40-72 SoT; sister reviewer 习惯位置 + Karpathy minimal surface
- **H2 (2nd cycle) D1 round 2 target relax ≤150L → ≤175L** ✅ DECIDED (Option AA) — math unreachable proof: 156L baseline + 8L D2 trim - 10L Phase 4.3 narrative = 158L always > 150L; relax target to ≤175L gives 19L headroom; D2 cadence trim still applied (no放弃); Phase 4.3 W0.1 conditional re-evaluate uses new ≤175L threshold; #BA disposition UPDATED below

### #BA disposition UPDATE (post-2nd-cycle H2 AA decision)

**STATUS UPDATE**: Original "round 2 tighten 200→150" target RELAXED to "round 2 tighten 200→175" per Option AA decision (2026-05-18 2nd-cycle sister review absorb).

**New decision tree** (Phase 4.3 W0 conditional re-evaluate):
- IF post-Phase-4.3-W0.1 D2 trim STATE ≤165L → FLIP `SIZE_LIMIT = 175` (10L safety headroom)
- IF 166-175L → DEFER #BA carry Phase 4.4+ (3rd consecutive DEFER signal)
- IF >175L → BLOCKED + escalate (insufficient even at relaxed target — D2 cadence改进 needed)

**Rationale for relax (NOT 放弃)**: Karpathy YAGNI — target ≤150L was Phase 3.4 D3 design-time guess; production reality shows 156L baseline 不可达 with 2-phase narrative preservation policy; relax to ≤175L preserves "tighter than round 1 ≤200L" intent + achievable + D2 cadence still discipline.

### Phase 4.3 W0/discuss-phase backlog 2nd-cycle additions

| # | Severity | Item | Disposition |
|---|----------|------|-------------|
| #BO | M | v0.4.0-MILESTONE-AUDIT.md 加 R-5 mitigation rationale 节 explain "Phase 4.1+4.2 = publish-only NO architectural decision per R-5" (sister M1 — 避免误读 "v0.4.0 决策力下降") | Phase 4.3 W2 ship MILESTONE-AUDIT authoring |
| #BP | M | Phase 4.3 discuss-phase explicit "R-5 NOT invoked, full ship cadence ADR 0018 + ci.yml A7 iter + triple tag" 声明 (sister M2) | Phase 4.3 discuss-phase 4.3-CONTEXT.md meta-decision lock |
| #BQ | T | Phase 4.3 W0 backlog 14+ items 分批策略 (sister T1) — sub-batch NOT atomic; planner Wave B verify scope risk | Phase 4.3 plan-phase Wave B (planner discretion 2-3 wave 拆) |
| #BR | T | Phase 4.3 ship 时长预估 1.5-2 day (sister T2 — R8.1 audit log 新功能 + R8.4 ADR 全集 + milestone close 同时) | Phase 4.3 discuss-phase 4.3-KICKOFF scope estimate |
| #BS | T (info) | D2 cadence iter 4 evaluation (sister T4 — iter 3 标 "terminus stable signal") | Phase 4.3 W0.1 conditional (与 #BA re-evaluate 同一 task) |

### Sister review M3 WRONG claim correction

- **M3 claim**: "2 alpha tags pending push" → **WRONG** ❌ — both `v0.4.0-alpha.1-benchmark` (origin `23f417d`) + `v0.4.0-alpha.2-community` (origin `e500756`) ARE already on origin per `git ls-remote origin refs/tags/`. Reviewer info stale.

### 2nd-cycle cadence

9 observations / 8 actionable (M3 WRONG corrected); 2 H inline same-cycle + 5 M+T → Phase 4.3 W0/discuss-phase. Sister cadence ≥3-iter terminus signal proves sister review cadence has become self-correcting (post-fix re-verify surfaces meta-issues like commit msg transparency + math-unreachable targets).
