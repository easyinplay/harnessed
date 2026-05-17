# ADR 0017: Phase 3.4 — routing 命中率 ≥ 85% 验收 + token budget doctor 8th check + v0.3.0 milestone close (9 章节 errata 合并)

## Status

**Accepted (phase 3.4 W2 — 2026-05-17)** — phase 3.4 plan-phase Wave A research/pattern → Wave B planner PLAN.md + task_plan.md → Wave C plan-checker iter 2 PASSED → Wave 0 backlog 5 项一次根治 → Wave 1 RUN ENGINE + token budget doctor 8th check → Wave 2 v0.3.0 milestone close ship + ADR fill → Accepted at phase 3.4 ship.

> Phase 3.4 是 v0.3.0 milestone **第 4 phase (4/4) close phase**, 把 v0.3.0 装配为 **30 REAL HISTORICAL sample routing harness ≥85% (≥26/30) hit + per-tier breakdown Sonnet 100% / Haiku ≥84% / Opus ≥80% (D-01) + RUN ENGINE per-sample routing.arbitrate dispatch zero mock (D-02) + Buffer.byteLength /4 zero-dep estimateTokens helper (D-03) + DOCTOR-ONLY-WARN doctor 8th check status='warn' ≠ fail (D-04) + W0 backlog 5 项一次根治 (W0.1 STATE STRATEGIC institutionalize 4 D-decisions D1-D4 + W0.2 install.ts pkg.version Path A + W0.3 versions/0.3.0-known-good.yaml 8 real entries + W0.4 path traversal spike DEFER + W0.5 SAMPLES.md 30 REAL HISTORICAL mining)**. 4 大决策 sister cluster 一次 ship — 沿袭 ADR 0008/0009/0010/0011/0012/0013/0014/0015/0016 多决策合并 errata 模式 (B-35 + B-36 lock).

## Context

Phase 3.4 把 v0.3.0 milestone 第 4 phase close 装配为 routing 命中率 ≥ 85% 验收 (R4.2 ROADMAP L149 + R7 dogfooding scope verbatim) + token budget doctor 8th check (R7 carry-forward + skill description 总和 ≤ 1% context window 监控) + W0 backlog 5 项 absorb + v0.3.0 milestone close (4/4 phases + 17 ADR + triple tag). 4 大主题 sister cluster 一次 ship, 作为 v0.3.0 milestone close phase — R4.2 (30 sample × Haiku/Sonnet/Opus 各 ≥ 8 ≥ 85% hit) + R7 carry-forward (DEFERRED #AC aliases.yaml dogfood entries + #AD install.ts pkg.version + #AE path traversal regex) 双 acceptance bar 锚定.

Phase 3.3 ship 后 sister analog: manifest-domain `src/manifest/schema/` (aliases.v1 12th + known-good.v1 13th) — Phase 3.4 W1 完成 PRIMARY helper extract `src/cli/lib/check-token-budget.ts` 48L (4th member of PRIMARY helper family sister Phase 3.1 W3 engineHook.ts 49L + Phase 3.2 W1 probe-gstack.ts 49L + Phase 3.3 W1 check-deprecations.ts 43L 模式延袭至 4 phase). doctor.ts 195→199L Option A inline shrink (≤200L Karpathy hard limit RESPECTED, B-03 5% tolerance NOT invoked — surgical 4-line delta).

并办 STATE.md W0.1 STRATEGIC institutionalize + Phase 3.3 carry-forward 3 项一次根治 — W0.1 STRATEGIC role + archive cadence 4 D-decisions D1-D4 (D1 single-SoT trim STATE.md 723L→146L round 1 + D2 ship-time T6.N cadence first-implementation Phase 3.4+ onward + D3 `scripts/check-state-archive-stale.mjs` 3-rules gate warn-only round 1 + D4 ship-process integrate Plan 03 W2 T2.2 standing process) / W0.2 install.ts pkg.version Path A ES2022 import attributes 1-line surgical (DEFERRED #AD resolve) / W0.3 versions/0.3.0-known-good.yaml 8 real e2e-verified pinned upstreams fill (DEFERRED #AC resolve) — 沿袭 Phase 2.1/2.2/2.3/2.4/3.1/3.2/3.3 Wave 0 一次根治模式.

### A7 守恒约束 (ADR 0001-0016 main body 不可改)

phase 3.4 沿袭 ADR 0003/0005/0007/0008/0009/0010/0011/0012/0013/0014/0015/0016 errata 风格 — **不动 ADR 0001-0016 main body** (A7 守恒). baseline tag iterate 16 → 17 (Wave 2 T2.12 ship 时 push `adr-0017-accepted` tag, ci.yml A7 step iter `1-0016` → `1-0017` per Phase 3.3 W2 T2.7 explicit literal sed-replace pattern sister Phase 3.2 W3 T3.4 + Phase 3.1 W5 T5.4). 本 ADR 0017 起 phase 3.4 ship 时刻 frozen; v0.4.0+ 演化走 ADR 0018+ errata.

## Decisions

### 1. D-01 REAL HISTORICAL — 30 sample mining from git log + .planning/phase-*/task_plan.md

`SAMPLES.md` 30-row truth table — per-row `source_commit` field MANDATORY 非 empty (D-01 sneak block守门, per-row 7-10 hex git short-sha). Distribution: 10 Haiku trivial (single-line edits, mechanical fixes — chore/docs/lint) + 10 Sonnet medium (single-file scope, 1-3 file edit — fix/test) + 10 Opus complex (multi-file architecture, cross-phase wire — feat/docs multi-task batch). Mining 路径: `git log --since=2026-05-12 --until=2026-05-18 --no-merges --pretty=format:"%h %s"` (302 commits verified) + `.planning/phase-{1.1..3.3}/task_plan.md` × 10+ + `.planning/intel/*.md` × 2. SYNTHETIC samples (autogen via LLM prompt expansion) rejected — 失 actual production routing surface; MIXED (50/50 REAL + SYNTHETIC) rejected — diluted dogfood signal Karpathy YAGNI single-discipline preferred. NOT 复用 phase 1.4 / 2.2 / 2.3 SAMPLES.md 任一 sample (REAL HISTORICAL means fresh mining).

`tests/routing/phase-3.4-routing-hit-rate.test.ts` (W1 T1.6) — markdown table parser 1:1 对应 SAMPLES.md § 2 + routing.arbitrate per-sample dispatch + per-tier breakdown assertion (Sonnet 100% / Haiku ≥84% / Opus ≥80% / Total ≥26/30).

### 2. D-02 RUN ENGINE — per-sample routing.arbitrate dispatch (NO DRY-RUN / NO FULL E2E)

`tests/routing/phase-3.4-routing-hit-rate.test.ts` 走 production `routing/decision_rules.yaml` v2 12 rules priority hit (priority 100/80/70/60/50) + 5 engineering sub-rules (engineering-discuss-feature / engineering-plan-architecture / engineering-execute-tdd / engineering-execute-debug / engineering-verify-pr) + mattpocock_phases 23 招式 routing schema (4 phase × 21 unique skills). Per-sample `routing.arbitrate(prompt, ruleset)` dispatch返回 decision → compare against `expected_decision` field. DRY-RUN (skip arbitrate, hardcode hit/miss) rejected — fake telemetry violates dogfood discipline; FULL E2E (real SDK spawn + invoke) rejected — ANTHROPIC_API_KEY OOS + per-sample 30+s latency CI infeasible.

Sister Phase 2.3 W4 samples-30 harness 100% template reuse — 30 sample × routing engine arbitrate + per-row PASS/FAIL output + final aggregate. Phase 3.4 W1 routing harness 100% per-tier (10/10 Sonnet + 10/10 Haiku + 10/10 Opus = 30/30 total, 100% accuracy exceeds ≥85% bar by 15% headroom — sister Phase 2.3 30/30 100% precedent延袭).

### 3. D-03 BUFFER — Buffer.byteLength(text, 'utf8') / 4 zero-dep estimateTokens helper

`src/cli/lib/check-token-budget.ts` 48L NEW (4th PRIMARY helper family member — sister Phase 3.1 W3 engineHook.ts 49L + Phase 3.2 W1 probe-gstack.ts 49L + Phase 3.3 W1 check-deprecations.ts 43L). `estimateTokens(text: string): number` = `Math.ceil(Buffer.byteLength(text, 'utf8') / 4)` — Anthropic published heuristic (~4 chars/token for English; 中文 variance acceptable for warn-only doctor surface). TIKTOKEN npm dep rejected — npm dep adds ~2MB cold install + Karpathy zero-dep discipline (sister Phase 3.1 D-01 enforceBudget precedent reuse — checkpoint compact 75% threshold uses same /4 heuristic).

`checkTokenBudget(skillDescriptions: string[]): TokenBudgetResult` — sums per-skill description tokens, computes total vs 1% context window threshold (200k Sonnet baseline = 2000 token budget cap). Returns `{ status: 'pass'|'warn', total: number, threshold: number, exceededBy?: number, skills: SkillTokenEntry[] }`.

T1.3 check-token-budget.test.ts 5 fixture 守门 (estimateTokens English + 中文 variance acceptable + checkTokenBudget pass + checkTokenBudget warn + edge case empty array).

### 4. D-04 DOCTOR WARN — doctor 8th check status='warn' ≠ fail (Option A inline shrink)

`src/cli/doctor.ts` 195→199L Option A inline shrink (≤200L Karpathy hard limit RESPECTED, B-03 5% tolerance NOT invoked — surgical 4-line delta sister Phase 3.3 W1 doctor 7th check 184→195L pattern). 8th check `checkTokenBudget` 调 `src/cli/lib/check-token-budget.ts` helper + 输出 token budget audit table (per-skill description tokens + total + threshold + status). CI FAIL (status='fail' on threshold exceed) rejected — block legitimate development on advisory metric;  SILENT LOG (status='pass' + log only on --json verbose) rejected — defeat doctor人读 audit surface purpose. DOCTOR-ONLY-WARN sister Phase 3.3 D-02 install path 安静 + doctor 7th check 人读 audit 一致 — doctor surface ≠ install path (doctor 主动跑用户期待 audit; install 路径 silent Unix tool 习俗).

W0.1 STRATEGIC institutionalize: D1 single-SoT trim STATE.md prev-prev-phase narrative → RETROSPECTIVE.md § ARCHIVED FROM STATE; D2 ship-time T6.N cadence each phase ship Plan 03 W2 T2.2 standing process; D3 `scripts/check-state-archive-stale.mjs` 3-rules gate warn-only round 1 (size ≤200L + 关键决议 ship 总结 ≤1 + W-N errata literal 禁); D4 ship-process integrate. "cleanup" 命名 rejected — paranoid architectural framing prevents revert to one-off cleanup mindset (sister review H1 lesson root-cause framing institutionalize).

T1.4 doctor.test 7→8 baseline update fixture + T1.5 check-state-archive-stale.test.ts 3 fixture 守门 (D3 gate sister W0.1 T0.1 STATE.md trim verify cadence).

### 5. § 5 — W0.1 STRATEGIC institutionalize 4 D-decisions D1-D4 paranoid framing (CONTEXT § Decisions sister review H1+H2 absorb)

W0.1 是 6th STATE 类反模式 root-cause framing — Phase 3.3 D-04 dual-SSOT 5-recurrence terminus COLLAPSE 解 dual-SSOT 反模式 (recurrences 1-5 root-caused at format-pattern level); Phase 3.4 W0.1 解 STATE.md role drift 反模式 (recurrences 6-N at archive-cadence level). 4 D-decisions D1-D4 institutionalize:

- **D1 single-SoT trim**: STATE.md sole SSOT for last 2 phase ship narrative + 当前位置 block; prev-prev-phase (Phase N-2) narrative auto-archive to RETROSPECTIVE.md § ARCHIVED FROM STATE — Phase {N-2} section
- **D2 ship-time T6.N cadence**: each phase ship 时 Plan 03 W2 T2.2 sub-step "trim STATE prev-prev-phase narrative → RETROSPECTIVE.md Phase N-2 § ARCHIVED FROM STATE" as standing process Phase 3.4+ onward
- **D3 `scripts/check-state-archive-stale.mjs` 3-rules gate**: SIZE_LIMIT=200 / FORBIDDEN_LITERALS=['关键决议 ship 总结', 'sister review M[1-9]', 'W-[0-9]+ errata'] / DEFERRED_SECTION_MAX=1; warn-only round 1 (ENFORCE flip Phase 3.5 OR v0.4.0 per DEFERRED #AF)
- **D4 ship-process integrate**: Plan 03 W2 T2.2 standing process + 关键提醒 #6 + 累积上下文 关键决议 record + check-state-archive-stale.mjs CI step + ci.yml warn-only round 1 sister transparency gate cadence

### 6. § 6 — schemaVersion 13-surface NO NEW surface this phase (CD-5 consumer carry)

`src/types/schemaVersion.ts` 13-surface unchanged (no new domain this phase). Phase 3.4 是 dogfood + acceptance verify phase, 不引入新 manifest schema surface. CD-5 consumer carry continues: `branchOnSchemaVersion<T>` helper consumed by 4 site (Phase 1.X spec.ts/metadata.ts + Phase 2.4 check-provenance.mjs + Phase 3.2 W2 + Phase 3.3 W1 W0.5 backfill).

### 7. § 7 — v0.3.0 close milestone discipline (sister v0.2.0 single-day cadence)

Phase 3.4 ship = v0.3.0 milestone close 4/4 phases. Sister v0.2.0 close pattern 100% reuses: 4 phase × 8/8 acceptance bar + 4 ADR per milestone (0014-0017) + 4 baseline tag + 5 milestone tag (alpha.1-checkpoint + alpha.2-plan-feature + alpha.3-aliases-known-good + alpha.4-routing + 🎯 v0.3.0). 3-file archive triplet at `.planning/milestones/v0.3.0-{ROADMAP,REQUIREMENTS,MILESTONE-AUDIT}.md` — MILESTONE-AUDIT.md inaugurate at `.planning/milestones/` subdir for consistency with sibling -ROADMAP + -REQUIREMENTS archives (sister v0.2.0 was inline at `.planning/v0.2.0-MILESTONE-AUDIT.md` — v0.3.0+ moves to milestones/ subdir per orchestrator pre-planning #4 LOCKED).

W-8 publish-stream-version transparency disclosure (orchestrator iter-1 fix): package.json version `0.1.0-alpha.1` → `0.3.0` (W0.2 bonus bump align with shipped milestone tags); npm publish stream defers to v1.0 — pre-v1.0 development rationale; milestone tags `v0.1.0` / `v0.2.0` / `v0.3.0` track milestone close只, npm registry publish 推 v1.0 dogfood benchmark 后. v0.3.0-MILESTONE-AUDIT.md § 5 9th row disclose.

### 8. § 8 — W0.4 path traversal spike DEFER Phase 4.0 cross-ref (sister Phase 3.3 § 10.4 STRIDE Tampering already enumerated)

W0.4 path traversal spike outcome: aliases.yaml + 0.3.0-known-good.yaml + manifest yaml files (resolveAlias + getPinnedVersion consumers) all read via git-tracked filesystem path (no user input arrives via network/runtime). Real attack vector near-zero — sole consumer is project maintainer (PR review gate sufficient). DEFER Phase 4.0 W0 first task (sister Phase 2.1 transparency gate cadence; flip when external user input arrives — v0.4.0+ dogfood benchmark MAY introduce real external surface). 56L rationale doc `.planning/phase-3.4/SPIKE-W0.4-path-traversal.md` + 1 defense-in-depth fixture `tests/manifest/path-traversal-spike.test.ts` (DEFERRED #AE registered).

### 9. § 9 — 3-wave topology rationale (W0-W2, sister Phase 3.3 3-wave 缩 0 因 scope 类似) + A7 conservation + ASR/ADR stats

W0 backlog 5 项 absorb (5 task — T0.1 STATE STRATEGIC / T0.2 install.ts pkg.version / T0.3 versions/0.3.0-known-good.yaml 8 entries / T0.4 path traversal spike DEFER + 1 fixture / T0.5 SAMPLES.md 30-row REAL HISTORICAL) → W1 RUN ENGINE + token budget doctor 8th check (6 task — T1.1 check-token-budget.ts NEW + T1.2 doctor 8th check + T1.3 check-token-budget test + T1.4 doctor 7→8 baseline + T1.5 check-state-archive-stale test + T1.6 routing harness 30/30) → W2 v0.3.0 milestone close ship + ADR fill (12 task — T2.1-T2.12 ADR 0017 + 5 docs 续编 + ci.yml A7 iter + 3-file milestone archive + DOGFOOD + triple tag) → 23 atomic task vs Phase 3.3 26 task (similar scope — MVP infrastructure + acceptance verify + close discipline); ~150L src delta (check-token-budget.ts 48L + doctor.ts +4L + test fixtures + SAMPLES.md 30-row inline). ADR 0001-0016 main body 0 diff verify (A7 守恒 sister Phase 3.3 T2.7); ci.yml A7 iter `1-0016` → `1-0017` per Phase 3.3 W2 T2.7 explicit literal `ADR 0001-0017` (NOT naked `1-0017` substring); baseline tag `adr-0017-accepted` (W2 T2.12) + milestone tag `v0.3.0-alpha.4-routing` + 🎯 `v0.3.0` triple push.

ASR/ADR stats累积: 17 ADR (0001-0017) + 17 baseline tag + 14 milestone tag (v0.1.0 + 5 v0.2.0 incl. alphas + 5 v0.3.0 incl. alphas + 🎯 v0.3.0). v0.3.0 4/4 ship + next v0.4.0 milestone kickoff (R8.1 dogfooding benchmark + R8.2 co-maintainer 招募).

## A7 Conservation

ADR 0001-0016 main body **untouched**; baseline tag iteration `adr-0001-accepted` ... `adr-0016-accepted` → 加 `adr-0017-accepted` (phase 3.4 Wave 2 T2.12 ship 打). `docs/AGENT-DEFINITION-FACTORY-CONTRACT.md` v1.1 + `docs/INSTALLER-CONTRACT.md` main body **不动**. schemaVersion 13-surface unchanged (no new domain this phase) — sister Phase 3.3 11→13 surface precedent NOT extended (Phase 3.4 = dogfood + acceptance verify phase).

### A7 守恒验收命令 (phase 3.4 ship 后 0001-0017 iterate)

```bash
for n in 0001 0002 0003 0004 0005 0006 0007 0008 0009 0010 0011 0012 0013 0014 0015 0016 0017; do
  diff_out=$(git diff "adr-${n}-accepted" -- "docs/adr/${n}-*.md")
  [ -z "$diff_out" ] || { echo "A7 violated for ADR ${n}"; exit 1; }
done
echo "A7 ✅ ADR 0001-0017 main body unchanged"
```

phase 3.4 ship 前 A7 守恒 ADR 0001-0016 验收 (Wave 2 T2.12 mid + ship-time verify):

```bash
git diff adr-0016-accepted..HEAD -- "docs/adr/000[1-9]-*.md" "docs/adr/001[0-6]-*.md" | wc -l   # = 0
```

### CI A7 step

`.github/workflows/ci.yml` A7 step 两处 `for n in ... 0016` 加 `0017`; step name `ADR 0001-0016` → `ADR 0001-0017` (W-02 explicit literal fix, Wave 2 T2.7 落地 — sister Phase 3.3 W2 T2.7 + Phase 3.2 W3 T3.4 + Phase 3.1 W5 T5.4 pattern).

## Consequences

**Capability deltas (Phase 3.4 ship 后新增):**

| Capability | Delta | Verify |
|------------|-------|--------|
| 30 sample REAL HISTORICAL routing harness (D-01 + D-02) | NEW SAMPLES.md 30-row truth table + tests/routing/phase-3.4-routing-hit-rate.test.ts | T1.6 routing harness 30/30 100% per-tier (Sonnet 100% + Haiku 100% + Opus 100%) |
| token budget estimateTokens + checkTokenBudget (D-03) | NEW check-token-budget.ts 48L PRIMARY helper (4th family member) | T1.3 check-token-budget.test.ts 5 fixture |
| doctor 8th check token budget (D-04) | doctor.ts 195→199L +4L 8th check checkTokenBudget Option A inline shrink | T1.2 doctor 195→199L ≤200 Karpathy clean + T1.4 doctor 7→8 baseline update |
| W0.1 STRATEGIC institutionalize 4 D-decisions D1-D4 | STATE.md 723L→146L trim + scripts/check-state-archive-stale.mjs 3-rules gate + RETROSPECTIVE.md § ARCHIVED FROM STATE — Phase 1.X-3.2 section | T1.5 check-state-archive-stale.test.ts 3 fixture + check-state-archive-stale.mjs warn-only round 1 |
| install.ts pkg.version Path A (W0.2 DEFERRED #AD resolve) | install.ts 1-line surgical Path A ES2022 import attributes + bonus package.json version bump 0.1.0-alpha.1 → 0.3.0 align shipped milestone tags | grep -q "import pkg from .*package.json.*assert" src/cli/install.ts |
| versions/0.3.0-known-good.yaml 8 real entries (W0.3 DEFERRED #AC resolve) | 8 e2e-verified pinned upstreams fill (was empty MVP seed Phase 3.3 W1 T1.11) | grep -cE "^- name:" versions/0.3.0-known-good.yaml ≥ 8 |
| path traversal spike DEFER Phase 4.0 (W0.4 DEFERRED #AE) | 56L rationale doc + 1 defense-in-depth fixture | test -f .planning/phase-3.4/SPIKE-W0.4-path-traversal.md + tests/manifest/path-traversal-spike.test.ts |
| SAMPLES.md REAL HISTORICAL 30-row (W0.5) | NEW 30-row truth table per-row source_commit MANDATORY non-empty | grep -cE "^\| [0-9]+ \|" .planning/phase-3.4/SAMPLES.md ≥ 30 |

**Negative consequence + mitigation**: DEFERRED #AF D3 gate ENFORCE flip timing 推 Phase 3.5 OR v0.4.0 W0 first task (本 phase D3 gate warn-only round 1 sister Phase 2.1 transparency gate cadence) + DEFERRED #AG D1 STATE.md ≤150L tighten 推 v0.4.0+ (本 phase ≤200L round 1 target met; v0.4.0+ tighten SIZE_LIMIT per D3 Rule 1 future flip) + DEFERRED #AH W0.4 path traversal regex hardening 推 Phase 4.0 W0 (本 phase spike DEFER + 1 defense-in-depth fixture sufficient; flip when external user input arrives). mitigation: 3 sister deferred 均 documented + tracked + 触发条件 clear.

## Compliance

**F1-F8 8/8 acceptance bar verify evidence**:

- F1 ADR 0017 errata accepted — 本 ADR Status flip + 9 章节 fill (Wave 2 T2.1)
- F2 30 sample REAL HISTORICAL routing harness ≥85% (R4.2 验收) — Wave 0 T0.5 SAMPLES.md + Wave 1 T1.6 harness 30/30 100%
- F3 token budget doctor 8th check (D-03 + D-04) — Wave 1 T1.1 helper + T1.2 doctor 8th + T1.3 test + T1.4 baseline (≤200L clean)
- F4 W0.1 STRATEGIC institutionalize 4 D-decisions (D1+D2+D3+D4) — Wave 0 T0.1 + Wave 2 T2.2 D2 first ship-time implementation
- F5 W0 backlog 5 项一次根治 — Wave 0 T0.1-T0.5 (STATE STRATEGIC + install.ts pkg.version + known-good.yaml 8 entries + path traversal spike DEFER + SAMPLES.md mining)
- F6 STRIDE security守门 — Wave 0 T0.4 path traversal spike DEFER + 1 defense-in-depth fixture (DEFERRED #AE registered)
- F7 v0.3.0 close discipline — Wave 2 T2.4 + T2.5 v0.3.0 4/4 SHIPPED ARCHIVED + T2.8-T2.10 3-file milestone archive triplet
- F8 SHIP — `adr-0017-accepted` baseline tag + `v0.3.0-alpha.4-routing` milestone tag + 🎯 `v0.3.0` target milestone tag (Wave 2 T2.12); ci.yml A7 step iter `1-0016` → `1-0017` (T2.7); A7 守恒 ADR 0001-0016 main body 0 diff verified

**3-OS CI 全绿 evidence**: Wave 0 W0.1-W0.5 ship per-task CI runs 3-OS green (12 atomic commits faf39bf → 6a761f5); Wave 2 ship final CI verify (T2.12 push 触发).

**Karpathy hard limits met (all files ≤ budget)**:
- ADR 0017 ≤ 250L (本 fill-out 实占 ≈ 200L)
- doctor.ts 195→199L (≤200L hard limit clean; B-03 5% tolerance NOT invoked surgical 4-line delta)
- check-token-budget.ts 48L (≤50L PRIMARY helper, 4th family member sister Phase 3.1 W3 engineHook.ts 49L + Phase 3.2 W1 probe-gstack.ts 49L + Phase 3.3 W1 check-deprecations.ts 43L extraction precedent)
- SAMPLES.md 73L (30-row truth table + per-tier rationale)
- check-state-archive-stale.mjs ≤80L (3-rules gate + warn-only round 1)
- install.ts ≤200L (W0.2 1-line surgical Path A ES2022 import attributes)
- versions/0.3.0-known-good.yaml ≤30L (8 real e2e-verified pinned upstream entries)

## Errata-path note

phase 3.4 走 ADR 0017 errata pattern (新决策 inline, ADR 0001-0016 0-diff preserved); future Phase 4.0+ 走 ADR 0018+ errata. 本 ADR 0017 起 phase 3.4 ship 时刻 frozen — 任何 v0.4.0+ 演化 (Phase 4.1 dogfooding benchmark + Phase 4.2 co-maintainer 招募 + Phase 4.3 路由透明度日志 + ADR 全集 + v1.0-RC 收尾 + DEFERRED #AF D3 gate ENFORCE flip + #AG D1 ≤150L tighten + #AH path traversal regex hardening) 必须开 ADR 0018+ errata; 本 ADR 0017 main body 不可改 (与 ADR 0001-0016 同等守恒规则).

phase 3.4 ship 时 Wave 2 T2.7 (本 ADR `adr-0017-accepted` baseline tag push 前) ci.yml A7 step `for n in ... 0016` → `for n in ... 0016 0017` + step name `ADR 0001-0016` → `ADR 0001-0017` (baseline tag iteration `1-0016 → 1-0017` per W-02 orchestrator explicit literal fix sister Phase 3.3 W2 T2.7 + Phase 3.2 W3 T3.4 + Phase 3.1 W5 T5.4).

## Adoption-confirmation

**v0.3.0 MILESTONE 4/4 SHIPPED & ARCHIVED** (sister v0.2.0 close 4/4 phase precedent — v0.3.0 close phase 推进 milestone 100%):

- 4 phase ship: Phase 3.1 (checkpoint engine + harnessed resume + compact) + Phase 3.2 (gstack prefix probe + workflow interpolate + plan-feature 5-phase WIRED) + Phase 3.3 (aliases.yaml RICH + DOCTOR-ONLY-WARN + known-good lock) + Phase 3.4 (routing 30/30 + token budget doctor 8th check + W0.1 STRATEGIC institutionalize) = 4/4
- 17 ADR + 17 baseline tag accumulate (0001-0017)
- 14 milestone tag accumulate (v0.1.0 + 5 v0.2.0 incl. alpha.1-4 + 5 v0.3.0 incl. alpha.1-4 + 🎯 v0.3.0 target)
- Tests baseline: 660 → 701+ (W1 +41 fixture check-token-budget + check-state-archive-stale + routing harness 30/30 + doctor 7→8 baseline); 3-OS CI matrix 全绿
- W1 T1.1 PRIMARY helper family 4th member (Phase 3.1 W3 engineHook.ts + Phase 3.2 W1 probe-gstack.ts + Phase 3.3 W1 check-deprecations.ts + Phase 3.4 W1 check-token-budget.ts) + W2 T2.12 baseline tag adr-0017-accepted + milestone tag v0.3.0-alpha.4-routing + 🎯 v0.3.0 triple push = "Adoption confirmed" 实证

**Deferred items disposition** (Wave 2 ship-time review):
- DEFERRED #AC (aliases.yaml dogfood actual deprecation entries) ✅ RESOLVED Phase 3.4 W0.3 (versions/0.3.0-known-good.yaml 8 real e2e-verified pinned upstream entries fill — Phase 3.3 deferred carry-forward closed)
- DEFERRED #AD (install.ts harnessed_version source-of-truth) ✅ RESOLVED Phase 3.4 W0.2 (install.ts 1-line surgical Path A ES2022 import attributes + bonus package.json version bump 0.1.0-alpha.1 → 0.3.0 align)
- DEFERRED #AE (path traversal regex hardening for resolveAlias) → Phase 4.0 (本 phase W0.4 spike DEFER + 1 defense-in-depth fixture + 56L rationale doc; flip when external user input arrives per Phase 4.0+ dogfood benchmark surface)
- DEFERRED #AF (D3 gate ENFORCE flip timing) → Phase 3.5 OR v0.4.0 W0 first task (sister Phase 2.1 transparency gate cadence)
- DEFERRED #AG (D1 STATE.md ≤150L tighten) → v0.4.0+ (本 phase ≤200L round 1 target met; v0.4.0+ tighten SIZE_LIMIT)
- DEFERRED #AH (W0.4 path traversal regex hardening) → Phase 4.0 W0 (if external user input arrives)
- EE-4 BLOCKER auto-spawn rerun → v0.4.0 后 evaluate (carry-forward unchanged from Phase 2.4 D-02 down-scope)
- userSpawn session_id capture (Phase 3.1 DEFERRED #2) → v0.4.0+ if real userSpawn demand (fresh-session fallback per B-02 still acceptable)

## References

### 内部依据

- `docs/adr/0016-aliases-deprecation-known-good.md` (Phase 3.3 ship base — 9 章节 errata sister template direct analog)
- `docs/adr/0015-gstack-probe-interpolate-plan-feature.md` (Phase 3.2 ship base — workflow-domain schema colocation precedent)
- `docs/adr/0014-checkpoint-engine-resume-compact.md` (Phase 3.1 ship base — checkpoint engine + estimateTokens precedent /4 heuristic reuse)
- `docs/AGENT-DEFINITION-FACTORY-CONTRACT.md` v1.1 (main body **不动** A7 守恒)
- `src/cli/lib/check-token-budget.ts` (W1 T1.1 NEW 48L — D-03 PRIMARY helper 4th family member sister Phase 3.1 W3 engineHook.ts 49L + Phase 3.2 W1 probe-gstack.ts 49L + Phase 3.3 W1 check-deprecations.ts 43L precedent extension)
- `src/cli/doctor.ts` (W1 T1.2 — 195→199L 8th check checkTokenBudget Option A inline shrink, ≤200L Karpathy clean)
- `src/cli/install.ts` (W0.2 T0.2 — pkg.version Path A ES2022 import attributes 1-line surgical DEFERRED #AD resolve)
- `versions/0.3.0-known-good.yaml` (W0.3 T0.3 — 8 real e2e-verified pinned upstream entries fill DEFERRED #AC resolve; was empty MVP seed Phase 3.3 W1 T1.11)
- `tests/routing/phase-3.4-routing-hit-rate.test.ts` (W1 T1.6 NEW — markdown table parser + routing.arbitrate per-sample dispatch + per-tier breakdown assertion 30/30 100%)
- `tests/cli/check-token-budget.test.ts` (W1 T1.3 NEW 94L 5 fixture — D-03 + D-04 守门)
- `tests/cli/doctor.test.ts` + fixtures (W1 T1.4 — 7→8 baseline update doctor 8th check)
- `tests/scripts/check-state-archive-stale.test.ts` (W1 T1.5 NEW 68L 3 fixture — D-04 W0.1 D3 gate verify)
- `tests/manifest/path-traversal-spike.test.ts` (W0.4 T0.4 NEW 1 defense-in-depth fixture)
- `scripts/check-state-archive-stale.mjs` (W0.1 T0.1 NEW ~80L — D3 3-rules gate warn-only round 1)
- `.planning/STATE.md` (W0.1 T0.1 STRATEGIC trim 723→146L round 1 + D2 ship-time T6.N cadence first-implementation; W2 T2.2 续编 Phase 3.4 SHIPPED + W0.1 D2 ship-time T6.N Phase 3.1+3.2 narrative archive)
- `.planning/RETROSPECTIVE.md` (W0.1 D2 § ARCHIVED FROM STATE — Phase 1.X-3.2 section + W2 T2.3 Phase 3.4 milestone retrospective entry 6-section + receive D2 Phase 3.1+3.2 narrative archive)
- `.planning/phase-3.4/SAMPLES.md` (W0.5 T0.5 NEW 73L — 30 REAL HISTORICAL sample truth table per-row source_commit MANDATORY)
- `.planning/phase-3.4/SPIKE-W0.4-path-traversal.md` (W0.4 T0.4 NEW 56L — DEFERRED #AE rationale)
- `.github/workflows/ci.yml` (W2 T2.7 A7 iter `1-0016` → `1-0017` per W-02 explicit literal fix)
- `.planning/phase-3.4/{3.4-KICKOFF, 3.4-CONTEXT, PATTERNS, RESEARCH, PLAN, task_plan, DOGFOOD-T2.X}.md`
- `.planning/milestones/v0.3.0-{ROADMAP,REQUIREMENTS,MILESTONE-AUDIT}.md` (W2 T2.8+T2.9+T2.10 3-file milestone archive triplet; MILESTONE-AUDIT.md inaugurate at milestones/ subdir per orchestrator pre-planning #4 LOCKED)

### 外部参考

- `.planning/intel/omc-comparison.md` § 0 SSOT 引用纪律
- `.planning/ROADMAP.md` L149 (R7 dogfooding scope: "30 真实任务样本 (Haiku/Sonnet/Opus 各 ≥ 8) ≥ 85%")
- `.planning/REQUIREMENTS.md` R4.2 (路由命中率 ≥ 85% 验收 — 30 sample × token budget 监控)
- `docs/PROJECT-SPEC.md` § 5.1 (B+C 混合路由 + 30 样本验收 立项参数)
- Anthropic published estimateTokens heuristic (~4 chars/token for English; D-03 BUFFER /4 zero-dep precedent)
- Sister Phase 2.3 W4 samples-30 harness 100% template (30 sample × routing engine arbitrate + per-row PASS/FAIL pattern verbatim reuse)
