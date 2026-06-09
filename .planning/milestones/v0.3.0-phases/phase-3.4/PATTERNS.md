# Phase 3.4: 路由命中率 ≥ 85% 验收 + token budget 监控 + v0.3.0 close — Pattern Map

> **Mapped**: 2026-05-17
> **Mapper**: gsd-pattern-mapper (Claude Opus 4.7, 1M ctx)
> **Files analyzed**: 17 NEW / MODIFY targets (per 3.4-CONTEXT 4 D-decisions + W0 backlog 5 项 + W2 v0.3.0 close ship)
> **Analogs found**: 17 / 17 (100% — sister Phase 3.3 17/17 100% cadence延袭; sister Phase 3.1 D-01 estimateTokens + Phase 3.2 W1 PRIMARY helper + Phase 2.3 W4 30-sample harness + Phase 2.4 v0.2.0 close 全覆盖)
> **Style**: 沿袭 Phase 3.3 PATTERNS.md (450L 17 targets 100% analog hit; § 1 table + § 2 concrete excerpts + § 3 cross-cutting + § 4 reuse summary + § 5 path dependency)
> **Verified line counts (Bash 2026-05-17)**: doctor.ts=195L (5L headroom borderline), STATE.md=723L (W0.1 must trim ≤150L), probe-gstack=48L + check-deprecations=43L → check-token-budget target ~40-50L

---

## § 1 NEW / MODIFY Targets → Existing Analog Mapping

| # | Target | Role | Data Flow | Closest Analog | Reuse % | Copy vs Adapt |
|---|--------|------|-----------|----------------|---------|---------------|
| **W0 backlog (5 项)** ||||||||
| 1 | `scripts/check-state-archive-stale.mjs` NEW (~60L W0.1 D3) | CI gate / utility | batch (read STATE.md → 3 rules check → exit 0/1) | `scripts/check-transparency-verdicts.mjs` L9-44 (130L; ENFORCE flag L12 + STATE_POSITION_RE L35 + readFileSync + violations array + exit code pattern) | **~75%** | **COPY** L9-12 imports + `ENFORCE = false` (warn-only round 1 sister Phase 2.1 transparency gate cadence) + violations array + L122-129 print + `process.exit(ENFORCE ? 1 : 0)` 末尾; **ADAPT** 3 rules: (Rule 1) `lines.length > 150` → push `STATE.md ${len} lines (limit 150)`; (Rule 2) 全文 `matchAll(/^##.*关键决议.*ship\s*总结/gm)` count > 1 → push `${count} 'ship 总结' sections (limit 1)`; (Rule 3) `matchAll(/W-?[0-9]+\s*errata|sister review M\d/gm)` length > 0 → push 每个 line ref; **OUTPUT**: `[state-archive] N violation(s):` + `for v of violations console.warn(...)`; warn-only round 1 → ENFORCE flip Phase 3.5 OR v0.4.0 |
| 2 | `.planning/STATE.md` W0.1 D1 单 SoT trim (723L → ≤150L) | docs | declarative (delete + restructure) | 现 `.planning/STATE.md` L18-25 "当前位置" block + L11 当前关注 + 历史 phase 累积段落 (Phase 1.X-3.3 全 8-phase 0 删) | **~30%** | **MASSIVE DELETE + restructure** per D1 single-SoT lock + sample CONTEXT § Specifics L226: 留 50L (当前位置 + 当前关注 + 引用) + 50L (last shipped phase=Phase 3.4 narrative only) + 20L (引用 + 链接); 删: prev-prev phase 历史 (Phase 1.X-3.2 全 archive → RETROSPECTIVE) + W-N errata 字面 (D3 Rule 3 violation) + 关键决议总结重复 (D3 Rule 2 violation 仅留 ≤1 节); **保留** L18-25 "当前位置"块 sole SSOT marker (Phase 3.3 D-04 COLLAPSE 后 freshness gate STATE_POSITION_RE 单源 scan target); **Acceptance**: `wc -l .planning/STATE.md` ≤150 + `node scripts/check-state-archive-stale.mjs` exit 0 (warn-only round 1 → 0 violation 验) |
| 3 | ship process T6.N step W0.1 D2 archive cadence integrate (documented in PLAN.md ship section) | process / docs | declarative | Phase 2.4 W6 v0.2.0 close T6.3 RETROSPECTIVE 续编 pattern (sister `.planning/RETROSPECTIVE.md` Phase 2.4 milestone section 318L 已 H2 absorb sister) + Phase 3.3 ship sister review absorb commit | **~80%** | **ADAPT** ship process: Phase N ship 时, 在 T6.N (RETRO 续编 + STATE update step) 加 sub-step "trim STATE prev-prev-phase narrative → RETROSPECTIVE.md Phase N-2 § ARCHIVED FROM STATE 节"; sister Phase 3.3 sister review H2 absorb (Phase 2.4 关键决议 9-item content moved STATE→RETRO) 1-shot precedent → institutionalize 进每 phase ship; **D4 lock**: executor 不 SCOPE BOUNDARY 阻挡 archive (gate D3 make GC visible); documented in `.planning/phase-3.4/PLAN.md` W2 ship section "ship-time T6.N archive cadence" + commit msg footer |
| 4 | `src/cli/install.ts` W0.2 #AD MODIFY (~3L delta) | CLI controller | request-response (import package.json + use version) | 现 `src/cli/install.ts` L116 `const harnessedVer = '0.3.0' // TODO Phase 3.4: read from package.json (DEFERRED #AD)` + sister TS Node import attribute pattern | **~95%** | **MINIMAL ADD ~3L** surgical 1-line fix: L116 `const harnessedVer = '0.3.0'` → `const { version: harnessedVer } = await import('../../package.json', { with: { type: 'json' } })` (Node 22 native import attribute); **fallback** if assert syntax dep issue → `import { readFileSync } from 'node:fs'; const harnessedVer = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')).version` (~3L sister `manifest/validate.ts` readFileSync pattern); **Acceptance** per CONTEXT § decisions L120: `grep -q "harnessedVer.*package" src/cli/install.ts` + `! grep -q "harnessedVer.*'0\\.3\\.0'" src/cli/install.ts`; 删 TODO comment |
| 5 | `versions/0.3.0-known-good.yaml` W0.3 #AC fill (~10-20L entries) | config (DSL) | declarative | 现 `versions/0.3.0-known-good.yaml` 9L empty seed (Phase 3.3 W1 T1.10 ship 空 upstreams: []) + `manifests/tools/*.yaml` 现有 6+ tool manifests metadata 来源 | **~70%** | **REPLACE** L9 `upstreams: []` → fill 6-10 actual e2e-verified pinned entries per CONTEXT § decisions L121 + § Claude's Discretion L132 hint: `claude-agent-sdk@0.3.142` (Phase 2.2 lock) + `gstack@<ver>` + `GSD@<ver>` + `superpowers@<ver>` + key MCP servers (`@modelcontextprotocol/server-*`) + key skills; entry shape per `KnownGoodV1Schema` (sister `src/manifest/schema/known-good.v1.ts` L221-228): `{ name: 'claude-agent-sdk', version: '0.3.142', install_method: 'npm-cli' }`; **UPDATE** L8 `e2e_verified_at: '2026-05-17'` (placeholder → actual ship date); **Acceptance**: `upstreams[]` length ≥5 + `e2e_verified_at != 'TBD'` + Value.Check(KnownGoodV1) passes; **planner 决** exact 6-10 entry list (cross-ref package.json deps + Phase 2.X manifest install history) |
| 6 | `.planning/phase-3.4/SAMPLES.md` NEW W0.5 30-row matrix (~150-200L) | docs / test fixture | declarative (markdown table → test parser) | `.planning/phase-2.3/SAMPLES.md` (260L 30-row § 2 table + § 1 selection rationale + § 3 frozen marker; sister Phase 2.3 W4 100% routing harness consumer) | **~85%** | **REUSE FRAME** Phase 2.3 SAMPLES.md § 1+2+3 section structure (Selection Rationale + Sample Truth Table + Frozen Marker); column schema § 2 ADAPTED per D-01 + planner Discretion #1 7-col NOT sister 8-col; **ADAPT** content per D-01 REAL HISTORICAL lock: (a) § 1 来源约束改为 `mining .planning/{phase-X.Y,intel,STATE.md} + git log --since=2026-05-12 --until=2026-05-17 --pretty=format:"%h %s"`; (b) § 1.2 分布 10 Haiku trivial + 10 Sonnet medium + 10 Opus complex (替 Phase 2.3 design/content/testing 三段); (c) § 2 row format per CONTEXT § Specifics L213-222: `| # | task_id | model_expected | description | source_commit | expected_decision (yaml inline) |` OR 完整 8 col sister Phase 2.3 (planner 决 schema yaml inline vs table format per Discretion #1); **Karpathy hard limit**: ≤200L (30 row × 5-7L each = 150-210L acceptable); **Frozen marker** (沿袭 Phase 2.3 § 1.4 cherry-pick 防御): plan-phase Wave A lock, execute-phase 不允许改样本 |
| **W1 main scope (4 项)** ||||||||
| 7 | `src/cli/lib/check-token-budget.ts` NEW (~30-40L PRIMARY helper) | utility (helper) | request-response (scan skills/ → estimateTokens loop → CheckResult) | `src/cli/lib/probe-gstack.ts` L1-49 (Phase 3.2 W1 T1.4 sister) + `src/cli/lib/check-deprecations.ts` L1-43 (Phase 3.3 W1 T1.6 sister) — 4th member of PRIMARY helper family; `src/checkpoint/template.ts` L32-36 `estimateTokens(s)` BUFFER /4 sister 1 precedent | **~90%** | **COPY** check-deprecations.ts L1-14 header comment + `CheckResult` interface L9-14 (status enum 3-tier) + try/catch L19-42 sister scaffold; **COPY** `estimateTokens` 1-line `Math.ceil(Buffer.byteLength(s, 'utf8') / 4)` 直接 inline OR import from `src/checkpoint/template.ts` L34-36 (sister 1 precedent, Karpathy YAGNI zero-dep); **ADAPT** core: replace listDeprecations with `readdirSync('skills/*/SKILL.md').map(p => readFileSync(p, 'utf8'))` → parse frontmatter `description` field → sum tokens + per-skill 5k threshold check + 1% context window threshold (200000 × 0.01 = 2000 tokens); **OUTPUT**: status='warn' if total > 2000 OR any skill > 5000; message: `"${total} tokens (${pct}% of 200k window)" + top consumers list`; **Karpathy hard limit ≤40L** per CONTEXT § Implementation hint L92 (sister probe-gstack 48L + check-deprecations 43L precedent range) |
| 8 | `src/cli/doctor.ts` MODIFY 加 8th check (~5L delta) | dispatch | declarative (register + dispatch) | 现 `src/cli/doctor.ts` L147-150 `checkDeprecations` 7th check (Phase 3.3 W1 T1.7) + L167 results array + L156-157 description string ext | **~98%** | **COPY-additive** 直接 sister `checkDeprecations` L147-150 范式 1:1 replicate: `async function checkTokenBudget(): Promise<CheckResult> { const { checkTokenBudget: runCheck } = await import('./lib/check-token-budget.js'); return runCheck() }`; **ADD** L167 后加 `await checkTokenBudget()` 进 results array; L156 description 串加 'token budget' → `'Preflight checks (Node / MCP scope / jq / Win bash / origin URL / gstack prefix / deprecations / token budget)'`; **BORDERLINE 守门**: doctor.ts 195→~200L (5L delta = 200L hard); pre-flight `wc -l src/cli/doctor.ts` BEFORE commit; **if real >200L** → split helper extract 既存 check 1 个 (sister Phase 3.1 W-01 engineHook PRIMARY pattern + Phase 3.3 W1 T1.6 check-deprecations 既已 extract — recommend extract `checkOriginUrl` body to `src/cli/lib/check-origin-url.ts` OR `checkMcpScope` 沿袭 PRIMARY helper family pattern, sister cadence 5th helper); **CONTEXT § Claude's Discretion 已 flag** Karpathy hard limit ≤200L no B-03 5% tolerance |
| 9 | `tests/cli/check-token-budget.test.ts` NEW (~50L, 5 fixtures) | unit test | request-response (mock fs + assert state) | `tests/cli/doctor-fixtures.test.ts` (Phase 3.2 W1 sister 6-fixture per-check pattern) + `tests/cli/doctor.test.ts` L6-8 `vi.mock('node:fs/promises')` + `node:fs` 三件套 (Phase 2.4 W1 baseline) + sister Phase 3.3 `tests/cli/check-deprecations.test.ts` (W1 sister 5-fixture pattern) | **~85%** | **COPY** doctor.test.ts L6-8 vi.mock 三件套 + sister check-deprecations.test.ts 5-fixture per-check skeleton; **ADAPT** 5 fixtures: cell 1 — skills/ dir missing → returns status='pass' + message='no skills installed'; cell 2 — 1 skill, description ~100 chars (~25 tokens) → status='pass' total ≤2000; cell 3 — 50 skills × 100 chars each (~1250 tokens) → status='pass' (under 2000 threshold); cell 4 — 50 skills × 200 chars each (~2500 tokens) → status='warn' with `top_consumers` list + "% of 200k window" format; cell 5 — 1 skill with 6000 token description (>5k per-skill threshold) → status='warn' + per-skill flag in detail; **Karpathy 守门**: estimateTokens 不 mock (用真 Buffer.byteLength + fixture string) sister Phase 3.1 W2 enforceBudget.test.ts 模式 |
| 10 | `tests/routing/phase-3.4-routing-hit-rate.test.ts` NEW (~120L, harness) | integration test | request-response (read SAMPLES.md → routing.dispatch per-sample → hit/total ≥ 0.85) | `tests/routing/samples-30.test.ts` (Phase 2.3 W4 T4.3 ship, 151L 30-sample 100% pattern; `loadSamples()` L44-62 markdown parser + `RESULTS` pre-compute L88-91 race avoidance + per-category breakdown L116-144 + hard gate L143 `expect(totalHit).toBeGreaterThanOrEqual(26)`) | **~90%** | **COPY** samples-30.test.ts 完整 skeleton 直接 reuse (sister Phase 2.3 100% pass 1-shot precedent + D-02 RUN ENGINE sister cadence): (a) L20-22 imports + L86 `SAMPLES = loadSamples(SAMPLES_PATH)` pre-compute (vitest parallel race fix) + L100-110 per-sample `it()` cell loop + L116-144 per-category breakdown + L143 hard gate; **ADAPT**: (a) `SAMPLES_PATH = '.planning/phase-3.4/SAMPLES.md'` (替 phase-2.3); (b) `loadSamples` row regex 改 per D-01 schema (yaml inline OR 8-col table per planner Discretion #4); (c) per-sample call `routing.dispatch(task)` (Phase 1.4 R1) 替 `arbitrateWithRedirect()` — 沿袭 D-02 RUN ENGINE production routing/decision_rules.yaml (no mock per Discretion #5); (d) hard gate `≥26/30` (≥85%, sister Phase 2.3 D-05 同阈值); (e) per-model (haiku/sonnet/opus) breakdown 替 per-category (design/content/testing); **Acceptance**: 1 spawn × 30 sample × ~100ms dispatch ≈ ~3s test runtime |
| **W2 v0.3.0 close ship (5 项)** ||||||||
| 11 | `docs/adr/0017-routing-hit-rate-token-budget.md` NEW (~150-200L ≤250L) | docs (ADR) | declarative | `docs/adr/0016-aliases-deprecation-known-good.md` (Phase 3.3 W2 sister, 9 章节 errata pattern: Status + Context + A7 守恒约束 + Decisions § 1-4 4 D-decisions + § 5 schemaVersion surface + Consequences) | **~90%** | **COPY** ADR 0016 完整 9 章节 skeleton 1:1 replicate (Status + Context + A7 守恒 + Decisions § 1-4 4 D-decision per Phase 3.4 D-01~D-04 + § 5 cross-cutting + Consequences); **ADAPT** content: (§ 1 D-01 REAL HISTORICAL 30 sample mining rationale); (§ 2 D-02 RUN ENGINE per-sample dispatch + actual vs expected); (§ 3 D-03 BUFFER /4 sister Phase 3.1 D-01 enforceBudget precedent zero-dep); (§ 4 D-04 DOCTOR WARN sister 7-check 8-check UX 一致); (§ 5 W0.1 STRATEGIC STATE.md institutionalize D1-D4 paranoid framing); **A7 守恒** baseline tag iterate `1-0016 → 1-0017` (Phase 3.4 W2 ship-time T2.X push `adr-0017-accepted` tag); **Karpathy hard limit ≤250L** (sister 0014/0015/0016 范围内) |
| 12 | `.planning/milestones/v0.3.0-{ROADMAP,REQUIREMENTS,MILESTONE-AUDIT}.md` NEW (sister v0.2.0 close) | docs (archive) | declarative | `.planning/milestones/v0.2.0-{ROADMAP,REQUIREMENTS}.md` (Phase 2.4 v0.2.0 close 2-file archive — Glob 已验); **NOTE**: v0.2.0 archive 仅 ROADMAP + REQUIREMENTS 2 file (无 MILESTONE-AUDIT.md sister precedent — kickoff § 3 triple pattern 中 MILESTONE-AUDIT.md 是新 surface) | **~70%** | **COPY** v0.2.0-ROADMAP.md + v0.2.0-REQUIREMENTS.md 完整结构 (frozen-at-milestone-close pattern); **ADAPT** v0.3.0 specific content: ROADMAP frozen at v0.3.0 milestone 4 phase + Phase 3.1/3.2/3.3/3.4 SHIPPED markers; REQUIREMENTS frozen R7.1-R7.6 (Phase 3.X scope); **NEW MILESTONE-AUDIT.md** (~100-150L): sister Phase 2.4 final audit format extend — § 4 phase SHIPPED 总结 + acceptance bar verify table + 验收报告 (per CONTEXT § Claude's Discretion #6 hint v0.3.0 close prep); **planner 决** MILESTONE-AUDIT.md 是否 v0.3.0 inaugurate (sister v0.2.0 缺 → v0.3.0 是新 pattern 引入) OR defer v0.4.0 cadence (推 inaugurate per kickoff § 3 explicit lock) |
| 13 | `.planning/STATE.md` + `RETROSPECTIVE.md` + `ROADMAP.md` + `README.md` + `PROJECT-SPEC.md` 续编 Phase 3.4 SHIPPED + v0.3.0 close (~50-80L total delta cross-file) | docs | declarative | Phase 3.3 ship commit sister precedent (5-doc 续编 cross-ref pattern: STATE 当前位置 update + RETROSPECTIVE Phase 3.3 milestone retrospective insert + ROADMAP Phase 3.3 → ✅ SHIPPED marker + README/PROJECT-SPEC freshness Status line update) | **~95%** | **COPY-additive** sister Phase 3.3 ship 5-doc 续编 pattern 1:1: (a) STATE.md L11 当前关注 改 v0.3.0 SHIPPED 4/4 + next: v0.4.0 milestone kickoff; L23 状态 改 Phase 3.4 SHIPPED + A7 0001-0017 verify; (b) RETROSPECTIVE.md Phase 3.4 milestone retrospective 节 insert (sister 318L Phase 2.4 + Phase 3.3 sister) + **Phase 3.1/3.2 narrative archive from STATE per W0.1 D2 ship-time cadence** § "ARCHIVED FROM STATE Phase 3.1+3.2" subsection; (c) ROADMAP.md L167-170 Phase 3.4 → `✅ SHIPPED` marker; (d) README.md L9+L44 freshness Status: line update (sister 5-recurrence terminus D-04 COLLAPSE 仅 README + PROJECT-SPEC 走 STATUS_MARKER path); (e) PROJECT-SPEC.md L3 同; **freshness gate verify**: `node scripts/check-transparency-verdicts.mjs` exit 0 post-commit |
| 14 | `.github/workflows/ci.yml` A7 iter 1-0016 → 1-0017 (~5 sed-replace sites) | CI gate | batch (literal version bump) | 现 `.github/workflows/ci.yml` L34 line literal `Phase 3.3 ADR 0016 errata:` + L35 `ADR 0001-0016` + L71 `1-0015 → 1-0016` + L74 step name `ADR 0001-0016` + L99 echo string `ADR 0001-0016 main body unchanged` (Phase 3.3 W2 T2.7 explicit literal pattern sister Phase 3.2 W3 T3.4 + Phase 3.1 W5 T5.4) | **~98%** | **COPY-mechanical** sister Phase 3.3 W2 T2.7 explicit literal sed-replace: 5 sites L34 (加 `+ Phase 3.4 ADR 0017 errata:`) + L35 (`0001-0016` → `0001-0017`) + L71 (`1-0015 → 1-0016` → `1-0016 → 1-0017`) + L74 step name (`0001-0016` → `0001-0017`) + L99 echo (`0001-0016` → `0001-0017`); **Acceptance**: `grep -c '0001-0017' .github/workflows/ci.yml` = 3+ + `grep -c '0001-0016' .github/workflows/ci.yml` = 0 (除非 errata 注释 backward refs 保留); **A7 守恒 baseline tag**: Phase 3.4 W2 ship-time push `adr-0017-accepted` tag (sister 0014/0015/0016 push timing 沿袭) |
| 15 | `.planning/phase-3.4/DOGFOOD-T2.X.md` NEW (sister Phase 3.3 DOGFOOD-T2.8 format) | docs (dogfood log) | declarative | `.planning/phase-3.3/DOGFOOD-T2.8.md` (Phase 3.3 W2 T2.8 dogfood verify log sister precedent format) | **~90%** | **COPY** Phase 3.3 DOGFOOD-T2.8.md 完整 format (verify steps + command outputs + acceptance verify); **ADAPT** Phase 3.4 dogfood scope: (a) `harnessed doctor --json` 8-check output capture (含 token budget 字段); (b) routing harness `pnpm test tests/routing/phase-3.4-routing-hit-rate.test.ts` 输出 (≥26/30); (c) install --known-good real entries verify (`harnessed install claude-agent-sdk --known-good` dry-run output); **Karpathy hard limit ≤200L** sister Phase 3.3 DOGFOOD 长度 |
| 16 | baseline tag `adr-0017-accepted` + milestone tag `v0.3.0-alpha.4-routing` + 🎯 `v0.3.0` 大 tag triple push | git tag | git op | sister Phase 2.4 v0.2.0 close triple push pattern + Phase 3.3 ship single tag (`adr-0016-accepted`) | **~95%** | **COPY** sister v0.2.0 close triple push pattern per KICKOFF § 3 explicit: `git tag -a adr-0017-accepted -m "ADR 0017 accepted (Phase 3.4 4 D-decisions + W0.1 STATE institutionalize)"` + `git tag -a v0.3.0-alpha.4-routing -m "Phase 3.4 SHIPPED (routing hit-rate ≥85% + token budget doctor 8th check)"` + `git tag -a v0.3.0 -m "🎯 v0.3.0 milestone close (plan-feature + checkpoint + aliases + routing acceptance)"`; **ADAPT** push order: tag create local → CI green verify → push all 3 (sister v0.2.0 close cadence); **Acceptance**: `git tag -l 'v0.3.0*'` = 4 tags (alpha.1-alpha.4 + v0.3.0) + `git tag -l 'adr-001[4-7]-accepted'` = 4 tags (4 ADR per v0.3.0 4 phase) |
| 17 | (consolidation row) — W0.4 path traversal spike outcome documented inline (defer Phase 4.0 OR add 1-line install path validate) | docs (decision) | declarative | sister Phase 3.2 DEFERRED #2 dashboard-sse spike→absorb pattern (W0.4 30min spike → outcome decision) | **~80%** | **ADAPT-spike**: 30min spike per CONTEXT W0.4 — regex `/\.\.[\\/\\\\]/.test(name)` + grep manifest `name` field corpus 评估 attack vector reality; **outcome 分支**: (a) **real** → 加 1-line install.ts L77 前 path validate `if (/\.\.[\\/\\\\]/.test(name)) throw new Error('manifest name path traversal rejected')` + 1 fixture in `tests/cli/install.test.ts`; (b) **not real** → defer Phase 4.0 with rationale doc inline in `.planning/phase-3.4/PLAN.md` (sister Phase 3.2 DEFERRED #2 RESOLVED pattern); **No separate file** — outcome documented inline PLAN.md W0.4 section per kickoff § 4 W0.4 |

---

## § 2 Per-target Concrete Code Excerpts (5 most critical)

### 2.1 `src/cli/lib/check-token-budget.ts` (NEW ≤40L) — analog: `src/cli/lib/check-deprecations.ts` L1-43 sister PRIMARY helper + `src/checkpoint/template.ts` L34-36 estimateTokens BUFFER /4 precedent

**COPY check-deprecations.ts header + 3-tier status pattern + BUFFER /4 inline from template.ts L34-36** (sister Phase 3.2/3.3 helper family 4th member; Karpathy hard limit ≤40L; D-03 + D-04 LOCKED):

```ts
// src/cli/lib/check-token-budget.ts — Phase 3.4 W1 T1.1 — D-03 BUFFER /4 +
// D-04 DOCTOR WARN PRIMARY helper (sister Phase 3.2 W1 T1.4 probe-gstack.ts
// 48L + Phase 3.3 W1 T1.6 check-deprecations.ts 43L sister-share extract
// pattern for Karpathy ≤200L 守门 — keeps doctor.ts ≤200L). Aggregates
// skills/*/SKILL.md description token estimate (Buffer.byteLength / 4 sister
// Phase 3.1 D-01 enforceBudget precedent zero-dep). Per-skill > 5k OR total
// > 1% context window (2000 tokens) → status='warn'.
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

export interface CheckResult {
  name: string
  status: 'pass' | 'warn' | 'fail'
  message: string
  fix?: string
}

const SKILLS_DIR = 'skills'
const CONTEXT_WINDOW = 200_000  // Sonnet default; Opus 1M not used for threshold
const PER_SKILL_MAX = 5_000
const TOTAL_THRESHOLD = Math.floor(CONTEXT_WINDOW * 0.01)  // 2000

/** BUFFER /4 heuristic — sister src/checkpoint/template.ts L34-36 (Phase 3.1 D-01). */
const estimateTokens = (s: string): number => Math.ceil(Buffer.byteLength(s, 'utf8') / 4)

export function checkTokenBudget(): CheckResult {
  if (!existsSync(SKILLS_DIR)) return { name: 'token budget', status: 'pass', message: 'no skills installed' }
  const skills = readdirSync(SKILLS_DIR).flatMap((name) => {
    const skillPath = join(SKILLS_DIR, name, 'SKILL.md')
    if (!existsSync(skillPath)) return []
    const content = readFileSync(skillPath, 'utf8')
    const descMatch = content.match(/^description:\s*(.+)$/m)
    return [{ name, tokens: estimateTokens(descMatch?.[1] ?? '') }]
  })
  const total = skills.reduce((s, x) => s + x.tokens, 0)
  const overSkill = skills.filter((s) => s.tokens > PER_SKILL_MAX)
  if (total > TOTAL_THRESHOLD || overSkill.length > 0) {
    const pct = ((total / CONTEXT_WINDOW) * 100).toFixed(2)
    return { name: 'token budget', status: 'warn', message: `${total} tokens (${pct}% of ${CONTEXT_WINDOW}; threshold ${TOTAL_THRESHOLD})`, fix: 'review skills/ description size; consider trimming verbose descriptions' }
  }
  return { name: 'token budget', status: 'pass', message: `${total} tokens (${skills.length} skills under threshold)` }
}
```

### 2.2 `src/cli/doctor.ts` MODIFY 加 8th check (~5L delta) — analog: 现 L147-150 sister `checkDeprecations` Phase 3.3 W1 T1.7

**COPY-additive 直接 sister `checkDeprecations` L147-150 范式 1:1 replicate** (doctor.ts 195→~200L 严格 borderline pre-flight wc -l verify):

```ts
// 现 L147-150 sister checkDeprecations (Phase 3.3 W1 T1.7):
async function checkDeprecations(): Promise<CheckResult> {
  const { checkDeprecations: runCheck } = await import('./lib/check-deprecations.js')
  return runCheck()
}

// Phase 3.4 W1 T1.2 — 8th check: skill description token budget (D-03 BUFFER /4
// + D-04 DOCTOR WARN LOCKED). Sister L147-150 checkDeprecations 100% reuse.
async function checkTokenBudget(): Promise<CheckResult> {
  const { checkTokenBudget: runCheck } = await import('./lib/check-token-budget.js')
  return runCheck()
}

// 现 L156-157 description string ext (加 'token budget' segment):
.description(
  'Preflight checks (Node / MCP scope / jq / Win bash / origin URL / gstack prefix / deprecations / token budget)',
)

// 现 L160-168 results array (加 8th call):
const results: CheckResult[] = [
  checkNodeVersion(),
  await checkMcpScope(),
  checkJq(),
  checkWinBash(),
  await checkOriginUrl(),
  await checkGstackPrefix(),
  await checkDeprecations(),
  await checkTokenBudget(),  // ← Phase 3.4 W1 T1.2 ADD 8th check (D-03 BUFFER /4 + D-04 DOCTOR WARN)
]
```

**BORDERLINE 守门 pre-flight verify** (CONTEXT § Implementation hint L108): `wc -l src/cli/doctor.ts` BEFORE commit. If >200L → extract `checkOriginUrl` body to `src/cli/lib/check-origin-url.ts` (sister Phase 3.1 W-01 engineHook PRIMARY pattern + 5th member of helper family); doctor.ts L130-134 becomes 1-line delegate sister L147-150 pattern → reclaim ~25L headroom.

### 2.3 `.planning/phase-3.4/SAMPLES.md` NEW W0.5 30-row matrix — analog: `.planning/phase-2.3/SAMPLES.md` 260L 3-section format

**REUSE Phase 2.3 SAMPLES.md frame** — § 1+2+3 section structure 100% reuse + § 2 column schema **ADAPTED** per CONTEXT D-01 + planner Discretion #1 7-col (NOT sister 8-col); ADAPT § 1 content per D-01 REAL HISTORICAL (W-5 orchestrator iter-1 tone-down — was 'COPY 完整文档结构' which implied 100% incl. column schema; column schema is in fact adapted not copied):

```markdown
# Phase 3.4 — 30 真实历史任务样本 (Routing Accuracy v0.3 dogfood — haiku/sonnet/opus 三段)

> **Status**: frozen at phase 3.4 plan-phase Wave A / **execute-phase 不允许改样本** (sister Phase 2.3 R3 frozen 模式延袭)
> **Trigger**: Phase 3.4 KICKOFF § 4 D-02 RUN ENGINE — 30 sample × routing.dispatch → ≥85% (≥26/30) hit rate
> **Test consumer**: `tests/routing/phase-3.4-routing-hit-rate.test.ts` (T1.4 — markdown table parser 1:1 对应 § 2)
> **Source**: REAL HISTORICAL — mining `.planning/{phase-X.Y,intel,STATE.md}` + `git log --since=2026-05-12 --until=2026-05-17 --pretty=format:"%h %s"` (D-01 LOCKED, dogfood real not synthetic)

## § 1 Selection Rationale (B-21 sister phase 2.3 § 1)

### 1.1 来源约束 (REAL HISTORICAL, 不复用 phase 1.4 / 2.2 / 2.3 任一 sample)
... (mining 路径 + 3 约束 — sister Phase 2.3 § 1.1 改写)

### 1.2 分布 (10 Haiku trivial + 10 Sonnet medium + 10 Opus complex — D-02 + frozen)

## § 2 Sample Truth Table (30 sample — REAL HISTORICAL)

| #  | task_id | model_expected | description | source_commit | expected_decision |
|----|---------|----------------|-------------|---------------|-------------------|
| 01 | T01     | haiku          | fix typo in CLAUDE.md routing prefix rule | abc1234 | `{router: B, reason: "trivial single-file markdown edit"}` |
| 02 | T02     | haiku          | lint --fix biome warnings src/cli/install.ts | def5678 | `{router: B, reason: "single-file lint auto-fix"}` |
...
| 30 | T30     | opus           | Phase 3.3 ADR 0016 9-section errata authoring | xyz9012 | `{router: A, reason: "multi-file architectural ADR + cross-phase carry"}` |

## § 3 Frozen Marker (沿袭 Phase 2.3 § 1.4)
- SAMPLES.md plan-phase Wave A 锁定, execute-phase **不允许改样本**
- per-model breakdown (T1.4 输出) 防止单 model 拉高 mean
```

### 2.4 `scripts/check-state-archive-stale.mjs` NEW (~60L W0.1 D3 warn-only round 1) — analog: `scripts/check-transparency-verdicts.mjs` L9-44 + ENFORCE pattern

**COPY transparency-verdicts skeleton + ENFORCE=false (warn-only round 1 sister Phase 2.1 transparency gate cadence flip-Phase-3.5)**:

```js
#!/usr/bin/env node
// Phase 3.4 W0.1 D3 — STATE.md archive cadence gate (3 rules, warn-only round 1).
// Sister scripts/check-transparency-verdicts.mjs L9-44 (Phase 2.1 T1.7 + Phase 2.2
// T0.4 freshness ext); ENFORCE=false initial → flip true Phase 3.5 OR v0.4.0
// (sister transparency W3 warn-only round 1 → ENFORCE round 2 cadence延袭).
// 3 rules per D-04 paranoid architectural framing (NOT cleanup):
//   Rule 1: STATE.md 总行数 ≤150 (Karpathy hard limit sister 200L file 守门)
//   Rule 2: '关键决议 ship 总结' section ≤1 occurrence (防 H2 复发)
//   Rule 3: 'W-N errata' / 'sister review M[1-9] 修正' 字面禁 (防 H1 复发)
import { readFileSync } from 'node:fs'

const ENFORCE = false  // warn-only round 1; flip true Phase 3.5 (sister Phase 2.1 transparency gate cadence)
const STATE_PATH = '.planning/STATE.md'
const LIMIT_LINES = 150
const SHIP_SUMMARY_RE = /^##.*关键决议.*ship\s*总结/gm
const ERRATA_RE = /W-?[0-9]+\s*errata|sister review M\d+/g

const content = readFileSync(STATE_PATH, 'utf8')
const lines = content.split(/\r?\n/)
const violations = []

// Rule 1
if (lines.length > LIMIT_LINES) {
  violations.push(`Rule 1: STATE.md ${lines.length} lines (limit ${LIMIT_LINES})`)
}
// Rule 2
const shipSummaries = [...content.matchAll(SHIP_SUMMARY_RE)]
if (shipSummaries.length > 1) {
  violations.push(`Rule 2: ${shipSummaries.length} '关键决议 ship 总结' sections (limit 1)`)
}
// Rule 3
const errataHits = [...content.matchAll(ERRATA_RE)]
for (const m of errataHits) {
  const lineNum = content.substring(0, m.index).split('\n').length
  violations.push(`Rule 3: STATE.md:${lineNum} '${m[0]}' errata-literal (archive to RETROSPECTIVE)`)
}

if (violations.length > 0) {
  console.warn(`[state-archive] ${violations.length} violation(s):`)
  for (const v of violations) console.warn(`  ${v}`)
  console.warn(`Per D2 ship-time T6.N archive cadence: trim narrative to RETROSPECTIVE.md`)
  process.exit(ENFORCE ? 1 : 0)
}
console.log('[state-archive] STATE.md archive cadence compliant.')
```

### 2.5 `tests/routing/phase-3.4-routing-hit-rate.test.ts` NEW (~120L) — analog: `tests/routing/samples-30.test.ts` 151L Phase 2.3 W4 100% precedent

**COPY samples-30.test.ts 完整 skeleton** (sister D-02 RUN ENGINE per-sample dispatch + pre-compute race avoidance):

```ts
// Phase 3.4 W1 T1.4 — 30-sample routing.dispatch hit-rate harness (D-02 RUN ENGINE).
// Sister tests/routing/samples-30.test.ts (Phase 2.3 W4 T4.3, 151L, 30/30 100%
// 1-shot precedent). REAL HISTORICAL input per D-01 (mining .planning/ + git log);
// production routing/decision_rules.yaml dispatch per D-02 (no mock).
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { dispatch } from '../../src/routing/engine.js'  // Phase 1.4 R1 routing engine v1

interface Sample {
  task_id: string
  model_expected: 'haiku' | 'sonnet' | 'opus'
  description: string
  source_commit: string
  expected_decision: { router: string; reason: string }
}

const SAMPLES_PATH = join(process.cwd(), '.planning', 'phase-3.4', 'SAMPLES.md')

function loadSamples(path: string): Sample[] {
  // parse § 2 markdown table (sister samples-30.test.ts L44-62 rowRe pattern + D-01 schema)
  // ... ~25L parser per planner D-01 schema decision (yaml inline vs 8-col table)
}

// Pre-compute (sister samples-30.test.ts L84-91 vitest parallel race avoidance):
const SAMPLES = loadSamples(SAMPLES_PATH)
const RESULTS = SAMPLES.map((s) => {
  const actual = dispatch({ task: s.description, model_hint: s.model_expected })
  return { sample: s, actual, hit: actual.router === s.expected_decision.router }
})

describe('Phase 3.4 30-sample routing.dispatch harness (D-02 RUN ENGINE ≥85%)', () => {
  it('parses exactly 30 samples from SAMPLES.md', () => {
    expect(SAMPLES.length).toBe(30)
  })
  for (const { sample, actual, hit } of RESULTS) {
    it(`#${sample.task_id} ${sample.model_expected} — expected ${sample.expected_decision.router} actual ${actual.router}`, () => {
      if (!hit) console.error(`[MISS] #${sample.task_id} (${sample.model_expected}): expected=${sample.expected_decision.router} actual=${actual.router} desc="${sample.description}"`)
      expect(actual.router).toBe(sample.expected_decision.router)
    })
  }
})

describe('Routing accuracy v0.3 summary — per-model breakdown + ≥85% total (D-02)', () => {
  it('computes per-model breakdown + total accuracy', () => {
    const byModel = new Map<string, { hit: number; total: number }>()
    for (const { sample, hit } of RESULTS) {
      const m = sample.model_expected
      const acc = byModel.get(m) ?? { hit: 0, total: 0 }
      acc.total += 1
      if (hit) acc.hit += 1
      byModel.set(m, acc)
    }
    console.log('\n  === Routing Accuracy v0.3 (30 sample dogfood baseline) ===')
    for (const [m, { hit, total }] of byModel) {
      const pct = ((hit / total) * 100).toFixed(1)
      console.log(`  ${m.padEnd(8)} ${hit}/${total}  (${pct}%)`)
      if (hit / total < 0.6) console.warn(`  WARN: model '${m}' below 60% — cherry-pick risk`)
    }
    const totalHit = RESULTS.filter((r) => r.hit).length
    console.log(`  TOTAL    ${totalHit}/${RESULTS.length}  (${((totalHit / RESULTS.length) * 100).toFixed(1)}%)`)
    // Hard gate — D-02 acceptance bar ≥85% (≥26/30) sister Phase 2.3 D-05 同阈值
    expect(totalHit).toBeGreaterThanOrEqual(26)
  })
})
```

---

## § 3 Cross-cutting Patterns (D-decisions + Karpathy 守门)

### D-01 REAL HISTORICAL (防御 SYNTHETIC sneak)
- **Sneak block**: 不允许 SYNTHETIC SPEC sample sourcing (mining real, no 手设 synthetic 充数). SAMPLES.md § 1 必含 `Source: REAL HISTORICAL` declaration + per-row `source_commit` field.
- **Pre-flight verify**: SAMPLES.md row regex 必须 captures `source_commit` field (sha or .planning/ path); empty source_commit row → reject.
- **Frozen marker**: sister Phase 2.3 § 1.4 cherry-pick 防御 — plan-phase Wave A lock, execute-phase ADR 0017 errata 触发 才可改样本.

### D-02 RUN ENGINE (防御 DRY-RUN / FULL-E2E sneak)
- **Sneak block**: 不允许 DRY-RUN HARNESS (Phase 1.4 R1 已验 dry routing layer) OR FULL E2E spawn 真 SDK (cost + cross-OS slow). 必须 per-sample call production `routing.dispatch()` + production `routing/decision_rules.yaml` (no mock).
- **Sister cadence**: Phase 2.3 W4 30-sample harness 100% 1-shot 模板直接复刻 (`tests/routing/samples-30.test.ts` skeleton).
- **Hard gate**: `expect(totalHit).toBeGreaterThanOrEqual(26)` per D-02 + sister D-05 同 ≥85% 阈值.

### D-03 BUFFER /4 (防御 TIKTOKEN npm dep sneak)
- **Sneak block**: 不允许 `tiktoken` / `@anthropic-ai/tokenizer` npm dep (bundle 肥 + cross-OS 不保证 + sister Phase 3.1 D-01 enforceBudget zero-dep precedent 直接复用).
- **Sister precedent**: `src/checkpoint/template.ts` L34-36 `estimateTokens(s) = Math.ceil(Buffer.byteLength(s, 'utf8') / 4)` — 直接 inline copy OR import (planner 决, 推 inline per Karpathy YAGNI 1-line dup vs import dep).
- **Variance accepted**: 1 char ≈ 0.25 token English-dominant; 中文 ~0.5 token/char (可能 underestimate 50%). 本 phase 仅 doctor warn (NOT hard limit enforce); variance 接受.

### D-04 DOCTOR WARN (防御 CI FAIL / SILENT LOG sneak)
- **Sneak block**: 不允许 CI FAIL hard gate (太严苛, sister Phase 3.3 D-02 DOCTOR-ONLY-WARN install path 不 console 一致) OR SILENT LOG (反 Karpathy 透明 fail-loud).
- **Sister cadence**: doctor 7-check pattern延袭 (Phase 2.4 5 + Phase 3.2 6th + Phase 3.3 7th → 本 phase 8th 完整一致 8-check UX).
- **status='warn'** trigger: total > 2000 tokens (1% of 200k context window) OR per-skill > 5000 tokens.

### W0.1 STRATEGIC (防御 "cleanup" 命名 sneak)
- **Sneak block**: 不允许 task 命名 "STATE.md cleanup" (cleanup 暗示一次性) — 必须 **"STATE.md role + archive cadence institutionalize"** (architectural framing per D-04 COLLAPSE 命名思路延袭).
- **paranoid framing 4 D-decisions** (D1-D4 user-locked):
  - **D1 single-SoT** (删 view-of-three 复杂度)
  - **D2 archive cadence 进 ship T6.N step** (每 phase ship 自动 trim prev-prev-phase narrative → RETROSPECTIVE)
  - **D3 `scripts/check-state-archive-stale.mjs` 3 rules** (≤150 行 / 关键决议总结 ≤1 节 / W-N errata 禁字面 — warn-only round 1 sister transparency gate cadence)
  - **D4 ship-process integrate** (executor 不 SCOPE BOUNDARY 阻挡 archive — gate make GC visible)

### Karpathy hard limit ≤200L/file (B-06+B-26)
- **doctor.ts 195L → ~200L borderline** (5L delta). Pre-flight `wc -l src/cli/doctor.ts` BEFORE commit. **If real >200L** → split helper extract 既存 check 1 个 (sister Phase 3.1 W-01 engineHook PRIMARY pattern + Phase 3.3 W1 T1.6 check-deprecations 既已 extract) — recommend extract `checkOriginUrl` body OR `checkMcpScope` to `src/cli/lib/check-*.ts` (5th helper family member).
- **check-token-budget.ts ≤40L hard** (sister probe-gstack 48L + check-deprecations 43L precedent).
- **SAMPLES.md ≤200L hard** (30 row × 5-7L each = 150-210L acceptable, planner 决 schema yaml inline vs 8-col table per Discretion #4).

### biome preempt + ralph-loop discipline (5-recurrence terminus 续)
- TS/JS commits 必跑 `pnpm exec biome check --write` before commit (3 CI-red recurrences Phase 2.1.1 / 2.2 / 2.3 + memory MEMORY.md feedback_biome-preempt.md user lock).
- ralph-loop Win sentinel 继承 (Phase 2.4 ship sister precedent).

---

## § 4 Reuse Pct Summary

| Category | Reuse % | Detail |
|----------|---------|--------|
| **W0 (5 项)** | | |
| `scripts/check-state-archive-stale.mjs` NEW | **~75%** | transparency-verdicts skeleton + ENFORCE warn-only round 1 sister 直接复刻 |
| `.planning/STATE.md` W0.1 D1 trim | **~30%** | massive restructure (723L → ≤150L); reuse "当前位置"块 layout only |
| ship process T6.N archive cadence | **~80%** | Phase 2.4 W6 + Phase 3.3 H2 absorb sister institutionalize |
| `src/cli/install.ts` W0.2 #AD MODIFY | **~95%** | 1-line surgical (sister L116 TODO replace) |
| `versions/0.3.0-known-good.yaml` W0.3 #AC fill | **~70%** | sister yaml schema KnownGoodV1 Value.Check pass; 6-10 real entries fill |
| `.planning/phase-3.4/SAMPLES.md` NEW W0.5 | **~75%** | § 1+2+3 frame 100% reuse + § 2 column schema ADAPTED per D-01 + Discretion #1 7-col (NOT sister 8-col) + REAL HISTORICAL content ADAPT (W-5 honest reuse % — was inflated 85% claim) |
| **W1 main (4 项)** | | |
| `src/cli/lib/check-token-budget.ts` NEW | **~90%** | sister probe-gstack + check-deprecations 4th member helper family + estimateTokens precedent |
| `src/cli/doctor.ts` 加 8th check | **~98%** | additive sister `checkDeprecations` L147-150 1:1 (borderline ≤200L pre-flight) |
| `tests/cli/check-token-budget.test.ts` NEW | **~85%** | sister check-deprecations.test.ts 5-fixture pattern |
| `tests/routing/phase-3.4-routing-hit-rate.test.ts` NEW | **~90%** | samples-30.test.ts 151L 完整 skeleton 直接复刻 (D-02 RUN ENGINE) |
| **W2 ship (5 项)** | | |
| `docs/adr/0017-routing-hit-rate-token-budget.md` NEW | **~90%** | ADR 0016 9-section skeleton 直接复刻 |
| `.planning/milestones/v0.3.0-{ROADMAP,REQUIREMENTS,MILESTONE-AUDIT}.md` | **~70%** | v0.2.0 close 2-file precedent + MILESTONE-AUDIT.md NEW surface inaugurate |
| 5-doc 续编 (STATE+RETRO+ROADMAP+README+SPEC) | **~95%** | sister Phase 3.3 ship 5-doc 续编 cross-ref pattern 1:1 |
| `.github/workflows/ci.yml` A7 iter 1-0017 | **~98%** | 5 sed-replace sites (sister Phase 3.3 W2 T2.7 explicit literal) |
| `.planning/phase-3.4/DOGFOOD-T2.X.md` NEW | **~90%** | Phase 3.3 DOGFOOD-T2.8.md format sister 直接复刻 |
| baseline + milestone + 大 tag triple push | **~95%** | sister v0.2.0 close triple push pattern |
| W0.4 path traversal spike outcome | **~80%** | sister Phase 3.2 DEFERRED #2 spike→absorb/defer pattern (inline PLAN.md) |

**总 reuse %**: **~83%** (17 target weighted average; sister Phase 3.3 100% + Phase 2.4 ~76% + Phase 2.3 ~86% range 中等)
- 拉低因素: W0.1 STATE.md restructure (30% — massive delete + redesign) + W0.3 fill real entries (70% — real upstream specifics新)
- 拉高因素: 8 sister direct copy (≥90% reuse — doctor 8th + ci A7 iter + 5-doc 续编 + ADR 0017 skeleton + samples-30 harness + check-token-budget 4th helper + tag triple + DOGFOOD format)

**对比 Phase 3.3**: 100% 1-shot 17/17 vs Phase 3.4 ~83% — 因 Phase 3.4 是 v0.3.0 close phase, 含 milestone archive NEW surface (MILESTONE-AUDIT.md inaugurate) + STATE.md institutionalize restructure (not direct copy from analog) + path traversal spike outcome (inline decision). 仍属高 reuse, 因 W1 main 4-target 全 ≥85% sister 直接复刻.

---

## § 5 Path Dependency (Wave A R1 → Wave B planner → Wave C execute)

```
W0.1 STRATEGIC (STATE institutionalize 30min) ──┐
W0.2 #AD install.ts package.json read (1-line)   │
W0.3 #AC versions yaml fill (~10-20L)             ├──► W1 main scope (4 项)
W0.4 path traversal spike (30min outcome inline)  │     ├── check-token-budget.ts helper (40L sister probe-gstack)
W0.5 SAMPLES.md sourcing (30 row REAL HIST)       │     ├── doctor.ts 8th check (5L delta, borderline ≤200L)
                                                  │     ├── tests/cli/check-token-budget.test.ts (5 fixtures)
                                                  │     └── tests/routing/phase-3.4-routing-hit-rate.test.ts (~120L sister samples-30 harness)
                                                  │              │
                                                  │              ▼
                                                  └──► W2 v0.3.0 close ship (5 项 + triple tag)
                                                         ├── ADR 0017 (sister 0016 9 sections)
                                                         ├── .planning/milestones/v0.3.0-{ROADMAP,REQUIREMENTS,MILESTONE-AUDIT}.md NEW archive
                                                         ├── 5-doc 续编 (STATE+RETRO+ROADMAP+README+SPEC)
                                                         ├── .github/workflows/ci.yml A7 iter 1-0017 (5 sites)
                                                         ├── DOGFOOD-T2.X.md (sister Phase 3.3)
                                                         └── triple tag: adr-0017-accepted + v0.3.0-alpha.4-routing + 🎯 v0.3.0
```

**Critical path** (W0.5 SAMPLES.md sourcing → W1 routing harness): W0.5 必须 W1 T1.4 routing harness 前 ship, 否则 T1.4 test 无 input. 推 W0.5 单独 Wave A 末步 ship (~1h mining work).

**Borderline 守门** (W1 T1.2 doctor.ts 8th check): pre-flight `wc -l src/cli/doctor.ts` BEFORE commit; if real >200L → helper extract 5th member (sister Phase 3.1 W-01 engineHook precedent).

**v0.3.0 close prep** (W2 sister v0.2.0 close pattern): W2 必须最后 ship; ADR 0017 + milestone archive + 5-doc 续编 + ci A7 iter + DOGFOOD + tag triple 6-step sequence 1 commit cycle close. sister Phase 2.4 W6 close cadence direct precedent.

**Wave A R1+R2 并行可行性**: ✅ R1 (本文档 PATTERNS.md) 与 R2 (RESEARCH.md fresh research) 独立 — R1 mapping analog reuse %, R2 验 dispatch real call + BUFFER /4 variance baseline + W0.5 mining tool 选 (git log vs phase-mining script). Wave B planner 同时消费 R1+R2 输出生成 PLAN.md.

---

## PATTERN MAPPING COMPLETE
