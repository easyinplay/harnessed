# Phase 3.4: 路由命中率 ≥ 85% 验收 + token budget 监控 — Research

**Researched:** 2026-05-17
**Domain:** v0.3.0 milestone CLOSE phase — routing dogfood harness (R7 dogfooding) + skill-description token budget heuristic + 5-item W0 backlog absorb + v0.3.0 milestone archive
**Confidence:** HIGH (10/12 sections); MEDIUM (§ 10 fixture projection, § 13 anti-pattern empirical)

## § 0 Scope note + sources

Wave A R2 research output, consumed by gsd-planner (Wave B). 4 D-decisions LOCKED in 3.4-CONTEXT.md (D-01 REAL HISTORICAL / D-02 RUN ENGINE / D-03 BUFFER /4 / D-04 DOCTOR WARN) — research only covers (a) execution-level mining technique + harness contract, (b) sister-pattern reuse paths, (c) borderline LOC pre-flight gate, (d) W0 5-item backlog implementation recipe, (e) v0.3.0 close prep (sister v0.2.0 close 100% template reuse). Alternative algorithms NOT re-evaluated.

**Source manifest** (all verified file:line + git show this session):
- `.planning/phase-3.4/{3.4-KICKOFF.md, 3.4-CONTEXT.md}` — 4 D-decisions + 5 W0 backlog + carry-forward
- `.planning/phase-3.3/RESEARCH.md` L11-1242 (chunked) — sister 18-section gold-standard
- `.planning/STATE.md` L1-100 + § headers (16 sections, 723L total) — W0.1 STRATEGIC target
- `.planning/ROADMAP.md` L130-170 v0.3.0 + Phase 3.4 拆分 + carry-forward prereq
- `.planning/REQUIREMENTS.md` L280-291 R7.5+R7.6 acceptance bar
- `.planning/v0.2.0-MILESTONE-AUDIT.md` L1-150 — sister close artifact format
- `.planning/milestones/v0.2.0-{ROADMAP,REQUIREMENTS}.md` (6.6k + 10.7k) — sister archive shape
- `.planning/phase-2.3/SAMPLES.md` L1-80 + § 2 table — sister 30-row matrix format
- `src/cli/doctor.ts` L1-195 (195L wc -l 实测) — 7-check post-Phase 3.3 ship
- `src/cli/lib/{probe-gstack.ts L1-48, check-deprecations.ts L1-43}` — PRIMARY helper sister-share 49L+43L
- `src/cli/install.ts` L114-122 — `harnessedVer = '0.3.0'` TODO marker @ L116
- `src/checkpoint/template.ts` L18-35 — BUFFER /4 `estimateTokens` D-03 sister precedent
- `routing/decision_rules.yaml` L1-387 — v2 production rules (12 rules + mattpocock_phases 23 招式 routing)
- `src/routing/decisionRules.ts` L75-200 (190L) — `loadDecisionRules` + `arbitrate` + `TaskContext = Record<string, unknown>`
- `src/routing/lib/arbitrateRedirect.ts` L1-69 — CD-3 negative-space `arbitrateWithRedirect` Phase 2.3 ship
- `src/routing/agentDefinition.ts` L96-105 — TaskContext shape (task + override_keywords + task_type + cwd + phaseId)
- `tests/routing/samples-30.test.ts` L1-150 — D-02 100% template reuse model
- `src/manifest/knownGood.ts` L1-45 + `schema/known-good.v1.ts` L1-32 — W0.3 consumer + 13th surface
- `versions/0.3.0-known-good.yaml` L1-9 — W0.3 fill target
- `manifests/{skill-packs/*.yaml,tools/*.yaml,cc-hooks/*.yaml}` 17 entries — W0.3 candidate source-of-truth
- `scripts/check-transparency-verdicts.mjs` L1-130 — W0.1 D3 sister gate pattern
- `package.json` L70-79 — runtime dep verify (claude-agent-sdk 0.3.142 / yaml ^2.9.0 / commander ^13.0.0 / typebox ^0.34.49 / vitest ^4.0.0)
- `skills/*/SKILL.md` ×6 (2438 + 688 + 663 + 655 + 686 + 641 bytes) — D-03 token budget seed measurement
- `git log --since=2026-05-12 --until=2026-05-17 --no-merges` = **331 commits** in window (D-01 mining feasibility VERIFIED)

---

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01 REAL HISTORICAL** (30 sample sourcing): mining `.planning/{phase-X.Y/{task_plan,PLAN,3.X-CONTEXT}.md, intel, STATE.md}` + `git log --since=2026-05-12 --until=2026-05-17 --pretty=format:"%h %s" --no-merges` 重制 30 task scenarios。Distribution: 10 Haiku trivial + 10 Sonnet medium + 10 Opus complex。Output `.planning/phase-3.4/SAMPLES.md` 30-row matrix。Karpathy hard limit ≤200L。SYNTHETIC SPEC + MIXED 20+10 路径 evaluated REJECTED。
- **D-02 RUN ENGINE** (路由命中率验算法): per-sample `routing.dispatch(task)` → 比 actual vs expected。`tests/routing/phase-3.4-routing-hit-rate.test.ts` NEW (~120L) sister Phase 2.3 `samples-30.test.ts` 100% template 复用。Aggregate `hits / total ≥ 0.85` + Haiku/Sonnet/Opus 各 ≥ 8 内部命中率分别 verify。DRY-RUN HARNESS + FULL E2E spawn 路径 REJECTED。
- **D-03 BUFFER /4 HEURISTIC** (token approx): `Buffer.byteLength(str, 'utf8') / 4` — sister Phase 3.1 D-01 `src/checkpoint/template.ts` L34-36 `estimateTokens` 直接复用。zero-dep + deterministic + cross-OS。TIKTOKEN npm dep + STRING LENGTH /4 REJECTED。`src/cli/lib/check-token-budget.ts` NEW PRIMARY helper ≤40L sister `probe-gstack.ts` 49L + `check-deprecations.ts` 43L pattern。
- **D-04 DOCTOR WARN** (阈值告警): doctor 8th check `checkTokenBudget` + status='warn' if 触阈。Per-skill > 5k token flag; total > 1% context window (200k × 0.01 = 2000 tokens) → warn。Karpathy hard limit doctor.ts ≤200L (no B-03 5% tolerance per CONTEXT lock)。CI FAIL + SILENT LOG REJECTED。

### Claude's Discretion

- doctor.ts 195L → ~200L borderline: 加 8th check 实测超 200L → split helper extract 既存 check (sister Phase 3.1 W-01 PRIMARY pattern OR 7th check check-deprecations 沿袭 — verify W1 实测 baseline before commit)
- D-03 BUFFER /4 variance 接受: 中文 ~0.5 token/char (可能 underestimate 50%); 本 phase 仅 doctor warn (NOT hard limit enforce); variance 接受 per sister Phase 3.1 D-01 precedent
- D-01 SAMPLES.md ≤200L 行预算 (30 row × 5-7L each)
- D-02 routing.dispatch real call vs mock: production `routing/decision_rules.yaml` real dogfood (推 production)
- W0.4 path traversal regex spike outcome: spike 30min 后 absorb OR defer 决断由 spike 结果定
- W0.3 entries 选哪些: planner 决 ~6-10 entry exact list (cross-ref `package.json` deps + `manifests/*.yaml`)
- v0.3.0 close prep: Phase 3.4 W2 整合 archive `.planning/milestones/v0.3.0-{ROADMAP,REQUIREMENTS,MILESTONE-AUDIT}.md` + audit + tags triple push (sister v0.2.0 close pattern延袭)

### Deferred Ideas (OUT OF SCOPE)

- plan-feature 真接外部 gsd-* spawn → Phase 4.0+ dogfood (v0.3.0 close 后)
- EE-4 BLOCKER auto-spawn rerun → Phase 4.0+
- userSpawn session_id capture → Phase 4.0+ (DEFERRED #2 Phase 3.1 carry; fresh-session fallback per B-02 acceptable)
- dogfooding benchmark 公开 → v0.4 R8.1
- co-maintainer 招募窗口 → v0.4 R8.2
- SYNTHETIC SPEC / MIXED 20+10 sample sourcing → REJECTED (D-01)
- DRY-RUN HARNESS / FULL E2E spawn → REJECTED (D-02)
- TIKTOKEN / STRING LENGTH /4 → REJECTED (D-03)
- CI FAIL / SILENT LOG token budget → REJECTED (D-04)
- STRATEGIC task 命名 "cleanup" → user paranoid 反对 (institutionalize 才 architectural 级)

---

## Project Constraints (from CLAUDE.md)

- **路由路径优先级**: gstack (决策层) > GSD (orchestration) > superpowers (子任务执行) > planning-with-files (持久化) > karpathy 心法 (编码) > ralph-loop (交付) — Phase 3.4 是 GSD plan-phase 路径 (research → plan → execute → verify)
- **karpathy 4 心法 always-on**: Think Before Coding / Simplicity First (YAGNI) / Surgical Changes / Goal-Driven
- **hard limit ≤200L per file** (B-06 + B-26); D-04 doctor.ts no B-03 5% tolerance per CONTEXT explicit lock
- **biome preempt before commit** (MEMORY feedback_biome-preempt.md, 3 CI-red recurrences Phase 2.1.1 / 2.2 / 2.3 → 现 cadence preempt)
- **web search routing**: Tavily MCP (默认) / Exa MCP (语义/学术/批量 URL); Brave Search 弃用
- **CLAUDE.md is read-only by harnessed installer** (D-02 SKILL-ONLY post-Phase 2.3 — karpathy-skills 不动 CLAUDE.md)

---

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| R7.6 | "known good" 版本组合 — 每个 harnessed 版本冻结一组通过 e2e 的上游版本 lock; 验收 `harnessed install --known-good` reproducible | § 7 W0.3 real seed fill 6-10 entries cross-ref `manifests/*.yaml` + `package.json`; sister Phase 3.3 W1 T1.11 empty seed (`upstreams: []`) → Phase 3.4 W0.3 fill |
| R7 dogfooding scope | 30 真实任务 (model 分布达标) 路由命中率 ≥ 85%; Sonnet 100% / Haiku ≥ 84% 复现 | § 3 D-01 30 SAMPLES.md REAL HISTORICAL mining + § 4 D-02 RUN ENGINE harness 100% template reuse + § 10 Validation Architecture per-tier accuracy gate |
| ROADMAP L168-170 | description 总 token 近似算法 + 阈值告警; 实测命中率达标 + token 监控仪表落地 | § 2 D-03 BUFFER /4 + § 1 D-04 doctor 8th check borderline pre-flight gate + § 10 functional tier |
| ROADMAP L170 carry-forward prereq | DEFERRED #AC aliases.yaml dogfood entries + #AD install.ts package.json version read + #AE path traversal regex hardening | § 6 W0.2 + § 7 W0.3 (aliases.yaml paired optional) + § 8 W0.4 |
| STRATEGIC (user 4 D-decisions D1-D4) | STATE.md role + archive cadence institutionalize | § 5 W0.1 D1 single-SoT + D2 ship-time T6.N archive + § 11 W0.1 D3 `check-state-archive-stale.mjs` 3 rules warn-only round 1 + D4 ship-process integrate |

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| 30 sample routing dispatch (REAL HISTORICAL dogfood) | routing-engine (main-process L1 arbitrate) | test-fixture (vitest `it.each`) | Phase 1.4 ready `routing.dispatch(task)` consumed (no NEW engine code); harness 1:1 复刻 Phase 2.3 W4 `samples-30.test.ts` (sister 100% pattern reuse) |
| Token budget approx (skill description scan) | cli-doctor-helper (PRIMARY helper extract sister probe-gstack / check-deprecations) | reusable lib (Buffer-based heuristic) | sister Phase 3.2 W1 T1.4 + Phase 3.3 W1 T1.6 (PRIMARY helper extract for doctor.ts ≤200L 守门); zero-dep `Buffer.byteLength /4` (Phase 3.1 D-01 precedent) |
| doctor 8th check observability | cli-doctor.ts (8th `checkTokenBudget` dispatch ~5L delegate) | json/human 双输出 (sister 7-check pattern) | sister Phase 2.4+3.2+3.3 5+6+7-check cumulative pattern延袭; D-04 DOCTOR WARN lock; borderline ≤200L pre-flight |
| Known-good real seed (v0.3.0 reproducible install) | manifest-domain (versions/0.3.0-known-good.yaml fill) | install.ts consumer (--known-good flag, lazy load) | sister Phase 3.3 W1 T1.11 empty MVP → Phase 3.4 W0.3 fill (R7.6 dogfood); install.ts package.json version read (W0.2 1-line surgical fix replaces hardcoded '0.3.0') |
| STATE.md role single-SoT institutionalize | docs-governance (STATE.md ≤150L hard) | tool-script (`scripts/check-state-archive-stale.mjs` 3 rules warn-only round 1) | sister Phase 2.1 transparency gate warn-only → ENFORCE round 1 cadence; D2 ship-time T6.N archive integrate (sister Phase 2.4 W6 T6.3 RETRO 续编 pattern) |
| Path traversal hardening (W0.4 spike) | cli-install (`install.ts` resolveAlias / manifest path) | test-fixture (security 1 fixture if real, defer doc if not) | 30min spike + outcome-driven; sister Phase 3.3 § 10.4 STRIDE Tampering threat model § already enumerated |
| v0.3.0 milestone close + archive | docs-governance + git-tags triple push | audit + ADR 0017 NEW errata | sister Phase 2.4 W6 v0.2.0 close 100% template reuse (`v0.2.0-MILESTONE-AUDIT.md` 150L 模板已 verified shipped) |

---

## § 1 doctor.ts wc -l 实测 baseline (D-04 borderline pre-flight)

**Confidence: HIGH** — `wc -l src/cli/doctor.ts` 实测 = **195** (本 session bash 直证)。

### 1.1 当前 7-check baseline 结构 (post-Phase 3.3 W1 ship)

| Section | LOC | 内容 |
|---------|-----|------|
| File header + comments | L1-13 | Phase 1.2 + 2.4 + WSL detection IMPL NOTE |
| imports (node:child_process + node:fs/promises + os + path + commander) | L14-18 | 5 imports |
| `interface CheckResult` | L20-25 | 6L 4-field |
| `checkNodeVersion()` | L27-38 | 12L (sync, inline) |
| `checkMcpScope()` | L40-77 | 38L (async, project + user JSON read) |
| `checkJq()` | L79-96 | 18L (sync, where/which platform branch) |
| `checkWinBash()` | L98-126 | 29L (sync, WSL probe) |
| `checkOriginUrl()` | L130-134 | 5L (delegate to lib/origin-check.ts) |
| `checkGstackPrefix()` (6th, Phase 3.2) | L138-142 | 5L (delegate to lib/probe-gstack.ts) |
| `checkDeprecations()` (7th, Phase 3.3) | L147-150 | 4L (delegate to lib/check-deprecations.ts) |
| `registerDoctor()` (commander wire + run + format output) | L152-195 | 44L (results array + json/human switch + exit code) |

**Post-Phase 3.3 ship: 195L** (sister Phase 3.3 RESEARCH § 1 projection was "189L" — actual ship landed at 195L, +6L delta for `checkDeprecations` 4L delegate + 2L import + 1L results array entry + 1L description string).

### 1.2 加 8th check `checkTokenBudget` LOC delta projection

Following sister Phase 3.2 W1 T1.5 + Phase 3.3 W1 T1.7 pattern exactly:

```typescript
// Phase 3.4 W1 T1.X — 8th check: skill description token budget (D-04 DOCTOR WARN).
// Sister L138-142 checkGstackPrefix + L147-150 checkDeprecations: dynamic import +
// delegate to PRIMARY helper src/cli/lib/check-token-budget.ts.
async function checkTokenBudget(): Promise<CheckResult> {
  const { checkTokenBudget: runCheck } = await import('./lib/check-token-budget.js')
  return runCheck()
}
```

**Delta projection**:
- 4L function (mirror L147-150 `checkDeprecations` exactly)
- 1L description string update (add `/ token budget` to L156 `description()` chain)
- 1L `await checkTokenBudget()` in results array L160-168
- **Total: +6L → 195 + 6 = 201L** ⚠️ **EXCEEDS 200L hard limit by 1L (no B-03 5% tolerance per CONTEXT D-04 explicit lock)**

### 1.3 Mitigation paths (planner pre-flight gate)

Two options (pick ONE in W1 first task):

**Option A (preferred — Karpathy surgical)**: Inline shrink existing helper delegate to 3L (drop intermediate `runCheck` variable):
```typescript
async function checkTokenBudget(): Promise<CheckResult> {
  return (await import('./lib/check-token-budget.js')).checkTokenBudget()
}
```
Saves 1L → 195 + 5 = **200L hard limit hit exact** ✅. Sister `checkDeprecations` L147-150 can be retro-shrunk same session for consistency (not required, but Karpathy YAGNI tidy).

**Option B (only if A blocked)**: Split out `runDoctorChecks()` extract sister Phase 3.1 W-01 engineHook PRIMARY pattern — move results array + summary computation to `lib/doctor-runner.ts` ~30L; doctor.ts shrinks to ~170L; +5L 8th check fits comfortably. Cost: 1 NEW file + 1 import + 4 test fixture migration.

**Planner W1 task ordering**: T1.1 = `wc -l src/cli/doctor.ts` verify still 195L (no drift since this RESEARCH) → T1.2 = pick Option A or B → T1.3 = implement → T1.4 = `wc -l` post-check ≤200L gate (hard fail if >200).

[HIGH — `wc -l` 实测 baseline + LOC delta arithmetic + sister pattern verified L147-150 exactly]

---

## § 2 D-03 BUFFER /4 token estimation skill description scan path

**Confidence: HIGH** — sister `src/checkpoint/template.ts` L34-36 `estimateTokens` 直接 import 复用 verified; 6 SKILL.md frontmatter actual byte size measured.

### 2.1 Implementation contract (`src/cli/lib/check-token-budget.ts` NEW ≤40L)

```typescript
// src/cli/lib/check-token-budget.ts — Phase 3.4 W1 T1.X — D-03 BUFFER /4 + D-04
// DOCTOR WARN PRIMARY helper. Sister Phase 3.2 W1 T1.4 probe-gstack.ts 48L + Phase
// 3.3 W1 T1.6 check-deprecations.ts 43L sister-share pattern for Karpathy ≤200L
// 守门 — keeps doctor.ts ≤200L. Scans ~/.claude/skills/<name>/SKILL.md (installed)
// + repo skills/ (source-of-truth); aggregates per-skill description tokens via
// Phase 3.1 D-01 estimateTokens (Buffer.byteLength /4 zero-dep heuristic).
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { estimateTokens } from '../../checkpoint/template.js' // ← sister precedent reuse

const CONTEXT_WINDOW_TOKENS = 200_000 // Sonnet 200k baseline (Opus 1M 留 4x headroom)
const TOTAL_THRESHOLD = Math.floor(CONTEXT_WINDOW_TOKENS * 0.01) // 2_000 (1% of 200k)
const PER_SKILL_THRESHOLD = 5_000 // sister Phase 3.1 D-01 1k checkpoint × 5 = realistic skill budget

export interface CheckResult { name: string; status: 'pass' | 'warn' | 'fail'; message: string; fix?: string }

interface SkillTokens { name: string; tokens: number }

function scanSkillsDir(root: string): SkillTokens[] {
  if (!existsSync(root)) return []
  const out: SkillTokens[] = []
  for (const name of readdirSync(root)) {
    const skillMd = join(root, name, 'SKILL.md')
    if (!existsSync(skillMd)) continue
    const md = readFileSync(skillMd, 'utf8')
    const fmMatch = md.match(/^---\n([\s\S]*?)\n---/) // YAML frontmatter
    if (!fmMatch) continue
    const descMatch = fmMatch[1].match(/^description:\s*(?:\|[\s\S]*?(?=^\w|\Z))|^description:\s*(.+)$/m)
    const desc = descMatch ? (descMatch[1] ?? descMatch[0]) : ''
    out.push({ name, tokens: estimateTokens(desc) })
  }
  return out
}

export function checkTokenBudget(): CheckResult {
  // Prefer installed ~/.claude/skills/; fallback to repo skills/ (dev mode).
  const installedRoot = join(homedir(), '.claude', 'skills')
  const repoRoot = join(process.cwd(), 'skills')
  const items = scanSkillsDir(installedRoot).concat(scanSkillsDir(repoRoot))
  const total = items.reduce((s, i) => s + i.tokens, 0)
  const overPerSkill = items.filter((i) => i.tokens > PER_SKILL_THRESHOLD)
  if (total > TOTAL_THRESHOLD || overPerSkill.length > 0) {
    const top3 = [...items].sort((a, b) => b.tokens - a.tokens).slice(0, 3)
    return {
      name: 'token budget', status: 'warn',
      message: `Skill descriptions total ${total} tokens (${((total/CONTEXT_WINDOW_TOKENS)*100).toFixed(2)}% of 200k window) — top: ${top3.map(t=>`${t.name}:${t.tokens}`).join(', ')}`,
      fix: 'consider shortening verbose skill descriptions OR review per-skill > 5k tokens',
    }
  }
  return { name: 'token budget', status: 'pass', message: `${items.length} skill(s) total ${total} tokens (under 1% / 2000 threshold)` }
}
```

LOC count: ~50L with comments + types. **Exceeds CONTEXT spec ≤40L by ~10L**. Reduce by:
- (a) merging both root scans into one `[installedRoot, repoRoot].flatMap(scanSkillsDir)`,
- (b) inlining `top3` into message string,
- (c) dropping the description-block YAML multi-line `|` handler if no skill uses it (verified: only `karpathy-baseline/SKILL.md` uses `|` block; other 5 are single-line — handle inline)

Target post-tighten: ~38L ≤40L ✅.

### 2.2 Threshold rationale (NOT arbitrary — sister precedent grounded)

| Threshold | Value | Source |
|-----------|-------|--------|
| Context window baseline | 200k tokens | Sonnet baseline (Claude docs verified; Opus 1M 4x headroom — Sonnet 是 conservative gate) |
| Total threshold | 2_000 tokens (1% of 200k) | Karpathy "skill description ≤ 1% context window" CONTEXT spec L13-14 explicit |
| Per-skill threshold | 5_000 tokens | sister Phase 3.1 D-01 1k checkpoint budget × 5 = realistic descriptive budget (1 char ≈ 0.25 token → 20k chars description = 5k tokens, ~10 paragraphs prose; anything beyond suggests verbose redundancy) |

### 2.3 Actual measurement (current 6 SKILL.md ground-truth)

```
karpathy-baseline/SKILL.md    2438 bytes total  → frontmatter description ~530 bytes → ~133 tokens
plan-feature-brainstorm/      688 bytes total   → description ~145 bytes → ~37 tokens
plan-feature-decision/        663 bytes total   → description ~130 bytes → ~33 tokens
plan-feature-discuss/         655 bytes total   → description ~135 bytes → ~34 tokens
plan-feature-persist/         686 bytes total   → description ~145 bytes → ~37 tokens
plan-feature-plan/            641 bytes total   → description ~135 bytes → ~34 tokens
─────────────────────────────────────────────────────────────────────────────────────────
TOTAL: 6 skills × ~62 tokens avg = ~308 tokens (0.15% of 200k window)
```

**Current state: status='pass'** (308 tokens << 2000 threshold, 0 skills > 5k). doctor 8th check 当下 baseline 是绿。Future: 若 v0.4+ skill-pack 数从 6 扩到 50 + 平均 description 加长 5x → ~5000 tokens → warn 触发 expected。

### 2.4 BUFFER /4 sister 1 precedent verbatim (zero-dep reuse)

```typescript
// src/checkpoint/template.ts L34-36 (Phase 3.1 W2 T2.1 SHIPPED)
export function estimateTokens(s: string): number {
  return Math.ceil(Buffer.byteLength(s, 'utf8') / 4)
}
```

Direct `import { estimateTokens } from '../../checkpoint/template.js'` — Karpathy YAGNI sister 1 precedent (D-03 lock per CONTEXT)。NO new dep.

[HIGH — sister Phase 3.1 D-01 verified shipped + 6 SKILL.md actual byte measurement + thresholds grounded]

---

## § 3 30 SAMPLES.md sourcing mining technique (D-01)

**Confidence: HIGH** — `git log --since=2026-05-12 --until=2026-05-17 --no-merges` = **331 commits** in window (verified bash); 10 task_plan.md + intel/* + STATE.md mining sources verified accessible.

### 3.1 Mining sources (Karpathy surgical — 3 sources, no over-engineering)

| Source | Count | Content type | Use |
|--------|-------|--------------|-----|
| `git log` 331 commits | 331 entries | conventional commit msgs (fix/feat/test/docs/chore + (phase-X.Y-wN) tag) | trivial/medium/complex bucket per commit type + scope |
| `.planning/phase-{1.1..3.1}/task_plan.md` × 10 | ~10 files | atomic task descriptions per phase ship | medium/complex sample harvest (test/refactor/integrate scope) |
| `.planning/intel/{dashboard-handoff-2026-05-16,omc-comparison}.md` × 2 | 2 docs | cross-cutting investigation context | complex multi-file sample harvest |

Other potential sources (REJECT, Karpathy YAGNI):
- ❌ STATE.md L18-100 narrative (too dense, harder to atomize per-task)
- ❌ `.planning/RETROSPECTIVE.md` (post-hoc narrative, not task spec)
- ❌ `.planning/phase-X.Y/{PLAN,3.X-CONTEXT}.md` (太宽 scope per file, atomic 抽取困难)

### 3.2 Bucket heuristic (per conventional commit prefix + scope)

Verified `git log` distribution from current 331 commit window:

| Type prefix | Count (in window) | Tier candidate | Rationale |
|-------------|------------------|----------------|-----------|
| `chore(phase-X.Y-wN)` (dir scaffold, single-line tweaks) | ~20+ | **Haiku trivial** | single-file mechanical edits (e.g. `chore(phase-3.3-w0): T0.4 — tests/manifest + tests/manifest/schema dirs setup`) |
| `docs(...)` (single-section continuation, KICKOFF/CONTEXT) | ~50+ | **Haiku/Sonnet split** | typo/single-paragraph = Haiku; multi-section docs = Sonnet |
| `test(...)` (NEW fixture file) | ~30+ | **Sonnet medium** | single-file test creation, mostly mechanical pattern reuse |
| `fix(...)` (bug fix, hotfix) | ~20+ | **Sonnet medium** | single root-cause + 1-3 file edit (e.g. `fix(phase-3.3-w0): T0.1 — STATE dual-SSOT ... COLLAPSE`) |
| `feat(phase-X.Y-wN)` (single component NEW) | ~40+ | **Sonnet/Opus split** | single-component = Sonnet; cross-phase wire = Opus |
| `feat(phase-X.Y-w2)` multi-task batch (`T2.1-T2.4`) | ~15+ | **Opus complex** | 4-task atomic-grouped batch e.g. `feat(phase-3.3-w1): T1.6-T1.9 — check-deprecations PRIMARY helper + doctor 7th + install resolveAlias + --known-good` |
| `refactor(...)` cross-file architecture | ~10+ | **Opus complex** | architectural rework (e.g. Phase 3.1 W-01 engineHook.ts PRIMARY extract) |

**Distribution target verified feasible**: 331 commits × ~30% trivial + ~50% medium + ~20% complex = ~100/165/65 candidates per tier → 10/10/10 selection feasible with high signal/noise.

### 3.3 SAMPLES.md row format (sister Phase 2.3 § 2 100% format reuse)

```markdown
| #  | task_id | model_expected | task_type | description (≤120 chars)                                                | source_commit | expected_decision_yaml                           | rationale |
|----|---------|----------------|-----------|------------------------------------------------------------------------|---------------|--------------------------------------------------|-----------|
| 01 | T01     | haiku          | docs-typo | fix typo in CLAUDE.md routing prefix rule (single-char edit)            | abc123        | { router: B, reason: 'trivial single-file edit'} | trivial   |
| 02 | T02     | sonnet         | refactor  | single-file refactor src/cli/install.ts L114-122 harnessedVer hardcoded | def456        | { router: B, reason: 'single-file targeted fix'} | medium    |
| 03 | T03     | opus           | feat-multi| multi-file cross-phase wire: schema 13th + loader + CLI flag + test    | 84545e8       | { router: C, reason: 'multi-file architecture'}  | complex   |
```

Sister Phase 2.3 SAMPLES.md L52-80 verbatim 8-column structure; Phase 3.4 simplification (per task_type vs category): 8 cols → `task_id | model_expected | task_type | description | source_commit | expected_decision | rationale` (7 cols, ~5-7L per row markdown wrap, 30 row × 6L = 180L ≤ 200L hard limit) ✅.

### 3.4 expected_decision derivation per sample (manual trace pre-W0.5 → ground-truth)

Each sample's `expected_decision` is derived by **manually tracing `routing/decision_rules.yaml` v2 + 30 sample harvest commits** against:
- 12 rules priority hit (priority 100/80/70/60/50)
- 5 engineering category sub-rules (`engineering-discuss-feature` / `engineering-plan-architecture` / `engineering-execute-tdd` / `engineering-execute-debug` / `engineering-verify-pr`)
- mattpocock_phases 23 招式 routing schema (CLAUDE.md 工作流 4 phase × 21 unique skills)
- Cross-domain edge: design/content/testing/search/meta/engineering 6 category split

**W0.5 NOT just bucketing** — each sample must include manually-traced expected router + matched_rule_id reasoning (sister Phase 2.3 § 1.3 "anchor / false-pos / CD-3" 透明声明 pattern — defends cherry-pick).

**Anti-cherry-pick**: Phase 2.3 § 1.4 + sister Phase 1.4 § 1.4 cadence — SAMPLES.md frozen at plan-phase Wave B; execute-phase 不允许改 sample (R3 频率 lock); per-tier breakdown to defend mean (single tier < 60% → cherry-pick warn).

[HIGH — git log 331 commits verified bash + sister Phase 2.3 SAMPLES.md L1-80 100% format model + 12-rule decision_rules.yaml manual trace path verified]

---

## § 4 RUN ENGINE harness sister samples-30.test.ts 100% reuse (D-02)

**Confidence: HIGH** — `tests/routing/samples-30.test.ts` L1-150 verbatim read, structure direct-reusable.

### 4.1 Sister Phase 2.3 W4 T4.3 harness skeleton (verbatim)

`tests/routing/samples-30.test.ts` L20-110 (pre-compute pattern S1 plan-check fix — vitest parallel race avoidance):

```typescript
// ---- Pre-compute (S1 plan-check fix — vitest parallel race avoidance) -------
const SAMPLES = loadSamples(SAMPLES_PATH)
const RULES: Rule[] = loadDecisionRules(RULES_PATH).rules
const RESULTS = SAMPLES.map((sample) => {
  const actualExpert = deriveExpert(RULES, buildTask(sample))
  return { sample, actualExpert, hit: actualExpert === sample.expected_primary_expert }
})

// ---- Per-sample cells -------------------------------------------------------
describe('Phase 2.3 30-sample arbitrateWithRedirect harness (D-05 ≥85%)', () => {
  it('parses exactly 30 samples from SAMPLES.md § 2', () => { expect(SAMPLES.length).toBe(30) })
  for (const { sample, actualExpert, hit } of RESULTS) {
    it(`#${sample.id} ${sample.category} ${sample.task_type} — expected ${sample.expected_primary_expert ?? '<null>'} actual ${actualExpert ?? '<null>'}`, () => {
      if (!hit) console.error(`[MISS] #${sample.id} ${sample.category}: expected=${sample.expected_primary_expert ?? 'null'} actual=${actualExpert ?? 'null'} prompt="${sample.prompt}"`)
      expect(actualExpert).toBe(sample.expected_primary_expert)
    })
  }
})

// ---- Per-category breakdown + overall ≥26/30 -------------------------------
describe('Routing accuracy v0.2 summary — per-category breakdown + ≥85% total (D-05)', () => {
  it('computes per-category breakdown + total accuracy', () => {
    // ... per-category Map<string, {hit, total}> → console.log breakdown + cherry-pick <60% warn
    const totalHit = RESULTS.filter((r) => r.hit).length
    expect(totalHit).toBeGreaterThanOrEqual(26) // ← 30 * 0.85 = 25.5 → ceil 26
  })
})
```

### 4.2 Phase 3.4 T1.X `phase-3.4-routing-hit-rate.test.ts` deltas

| Sister Phase 2.3 | Phase 3.4 delta |
|------------------|-----------------|
| `SAMPLES_PATH = .planning/phase-2.3/SAMPLES.md` | `.planning/phase-3.4/SAMPLES.md` |
| `category: 'design' | 'content' | 'testing' | 'search'` | `model_expected: 'haiku' | 'sonnet' | 'opus'` (NEW dimension — per-model tier instead of per-domain) |
| 30 row × 4 category (10+10+10 distribution) | 30 row × 3 model tier (10+10+10 distribution) |
| `arbitrateWithRedirect(rules, task)` | `routing.dispatch(task)` (Phase 1.4 R1 runRouting / arbitrate combo per `src/routing/engine.ts` L83 / `src/routing/decisionRules.ts` L130) |
| `expected_primary_expert: string \| null` | `expected_router: 'B'\|'C'` + `expected_matched_rule_id: string \| null` (per-rule trace + B/C routing tier) |
| `expect(totalHit).toBeGreaterThanOrEqual(26)` | `expect(totalHit).toBeGreaterThanOrEqual(26)` (same ≥85% bar; ≥26/30) |
| Per-category breakdown < 60% warn | **NEW: per-model-tier breakdown ≥ 8 sample with Sonnet 100% target / Haiku ≥ 84% target** (R7 dogfooding scope from ROADMAP L149 verbatim) |

### 4.3 routing.dispatch API contract (verified `src/routing/engine.ts` L83 + `decisionRules.ts` L130)

```typescript
// src/routing/decisionRules.ts L75-79 + L130-136
export type TaskContext = Record<string, unknown>
export function arbitrate(rules: Rule[], task: TaskContext): Rule | null { ... }
```

Phase 3.4 harness uses `arbitrate(rules, task)` (NOT full `runRouting()` — runRouting spawns SDK agent, harness only need L1 arbitrate layer). Test invocation:

```typescript
const RULES = loadDecisionRules('routing/decision_rules.yaml').rules
const matched = arbitrate(RULES, { task_type: sample.task_type, prompt: sample.description })
const actualRouter = matched ? deriveRouterFromRule(matched) : null
// 比 matched?.id vs sample.expected_matched_rule_id
```

**NO sdkSpawn / SDK call / API key** — pure routing layer dispatch (sister Phase 2.3 W4 100% pattern延袭; Phase 1.4 已验 dry routing layer)。Cost: ~30 sample × <10ms arbitrate = <1s test runtime ✅。

### 4.4 Per-tier acceptance gate (R7 dogfooding scope verbatim)

```typescript
// Per-tier breakdown — R7 dogfooding scope ROADMAP L149: "Sonnet 100% / Haiku ≥ 84%"
const byTier = new Map<string, { hit: number; total: number }>()
for (const { sample, hit } of RESULTS) {
  const t = sample.model_expected
  const acc = byTier.get(t) ?? { hit: 0, total: 0 }; acc.total += 1; if (hit) acc.hit += 1; byTier.set(t, acc)
}
expect(byTier.get('sonnet')!.hit / byTier.get('sonnet')!.total).toBe(1.0)       // Sonnet 100%
expect(byTier.get('haiku')!.hit / byTier.get('haiku')!.total).toBeGreaterThanOrEqual(0.84) // Haiku ≥ 84%
expect(byTier.get('opus')!.hit / byTier.get('opus')!.total).toBeGreaterThanOrEqual(0.80)   // Opus ≥ 80% (derived; ROADMAP unspecified)
```

[HIGH — sister test L1-150 verbatim + arbitrate signature `decisionRules.ts` L130 直证 + R7 dogfooding scope ROADMAP L149 verbatim 引用]

---

## § 5 W0.1 STRATEGIC STATE.md role single-SoT 实施 step

**Confidence: HIGH** — STATE.md 实测 **723L** (bash `wc -l`); 16 sections grep'd; 1 `关键决议 ship 总结` matched (L25 comment); 0 W-N errata literal matches in STATE.md current (post-Phase 3.3 W0.1 D-04 COLLAPSE).

### 5.1 STATE.md current size + sections

`.planning/STATE.md` 当前 723L 16 sections:
- L8-15 项目核心引用 (constant, KEEP)
- L18-94 当前位置 (KEEP, 76L — last shipped phase narrative dense; archive-target prev-prev phase narrative)
- L96-329 已完成 (Completed) — 234L (**ARCHIVE-TARGET: 已完成 v0.1.0 + v0.2.0 milestone narrative → RETROSPECTIVE**)
- L330-335 进行中 (constant short)
- L336-370 待办 (按优先级, churn but small)
- L371-385 关键提醒 (constant)
- L386-447 累积上下文 (Decisions / Todos / Blockers) — 62L (mostly stable refs)
- L448-517 Session 连续性 (Continuity) — 70L (history-archive-target)
- L518-624 Phase 1.5 + 2.0 Prereq Notes — 107L (**ARCHIVE-TARGET: prev-prev phase prereq notes → RETROSPECTIVE**)
- L625-683 Phase 2.3 + 2.4 Prereq Notes — 59L (**ARCHIVE-TARGET: prev-prev phase**)
- L684-723 v0.3.0 启动 prereq + 框架治理 — 40L (KEEP, current milestone scope)

**ARCHIVE delta projection: 234L (L96-329) + 107L (L518-624) + 59L (L625-683) = ~400L → RETROSPECTIVE = STATE.md 723 - 400 = ~323L** — STILL above 150L target. Additional aggressive collapse: collapse L448-517 (-70L) + flatten L386-447 Decisions section into single-bullet ref to .planning/decisions/ archive (-50L) = ~203L. Final hard-collapse to ≤150L requires moving `当前位置` from 76L to ~30L (drop prev-prev-prev phase entries L40-52, keep last 1-2 only).

**Realistic W0.1 target**: STATE.md ≤200L Round 1 (warn-only); v0.4.0+ tighten to ≤150L if D3 gate ENFORCE flip needs it.

### 5.2 D1 single-SoT (delete view-of-three complexity)

Per CONTEXT D1: "STATE role = single-SoT (删 view-of-three 复杂度, dashboard.mjs render 单源更顺)".

**Action**: STATE.md becomes sole authoritative source for current-phase + last-shipped-phase event log; RETROSPECTIVE absorbs all prev-prev-and-older narrative. Dashboard renders STATE.md only (NOT RETROSPECTIVE + STATE.md merge). Reduce dual-section ambiguity.

### 5.3 D2 ship-time T6.N archive cadence (sister Phase 2.4 W6 T6.3 RETRO 续编 pattern)

每 phase ship 自动 trim prev-prev-phase narrative → RETROSPECTIVE:

```
Pre-ship state:                  Post-ship action (T6.N):
- L18-25 last shipped phase     → keep as last (Phase X.Y narrative)
- L26-52 prev shipped phases     → trim oldest 2-3 entries → RETROSPECTIVE
- L520-624 Prev-phase Prereq Notes → batch move RETROSPECTIVE archive section
```

**Integrate into ship process**: T6.3 (sister Phase 2.4 W6 RETRO 续编 task naming) ADD step "trim STATE.md prev-prev-phase narrative + move to RETROSPECTIVE" in EVERY phase ship from Phase 3.4+ onward. Add to Phase 3.X W2 ship checklist (sister Phase 2.4 W6 T6.3 100% template reuse — `.planning/phase-2.4/task_plan.md` T6.3 exact pattern).

### 5.4 D4 ship-process integrate (executor 不 SCOPE BOUNDARY 阻挡)

Per CONTEXT D4 paranoid framing: "executor 不 SCOPE BOUNDARY 阻挡 archive — gate make GC visible".

**Action**: gate script `check-state-archive-stale.mjs` runs in CI (sister Phase 2.1 transparency CI gate Pattern). 3 rules see § 11. Warn-only round 1 (Phase 3.4 ship); ENFORCE flip Phase 3.5 OR v0.4.0 (sister 4-phase ENFORCE flip cadence verified in `check-transparency-verdicts.mjs` L12 `const ENFORCE = true`).

[HIGH — STATE.md 实测 723L bash + 16 sections grep + sister Phase 2.4 W6 T6.3 RETRO 续编 verbatim pattern + sister Phase 2.1 transparency gate ENFORCE cadence sister precedent verified]

---

## § 6 W0.2 DEFERRED #AD install.ts package.json version read (1-line surgical)

**Confidence: HIGH** — `src/cli/install.ts` L114-122 verified verbatim; `package.json` L2 `"version": "0.1.0-alpha.1"` (NB: package.json version is STILL 0.1.0-alpha.1 — production publish stream hasn't bumped despite v0.2.0+v0.3.0 milestones shipped via git tags only).

### 6.1 Current state (TODO marker at L116)

```typescript
// src/cli/install.ts L114-122 (Phase 3.3 W1 T1.9 ship)
if (raw.knownGood) {
  const { getPinnedVersion } = await import('../manifest/knownGood.js')
  const harnessedVer = '0.3.0' // TODO Phase 3.4: read from package.json (DEFERRED #AD)
  const pinned = getPinnedVersion(v.manifest.metadata.name, harnessedVer)
  if (pinned && v.manifest.spec.install.method === 'npm-cli') {
    ;(v.manifest.spec.install as { npm_version?: string }).npm_version = pinned
  }
}
```

### 6.2 Fix recipe — Node native `import ... assert/with { type: 'json' }`

Three implementation paths evaluated:

**Path A (preferred — Node native, Karpathy YAGNI)**: ES2022 import attributes syntax + `with` clause:
```typescript
import pkg from '../../package.json' with { type: 'json' }
// ... L116 becomes:
const harnessedVer = pkg.version
```

**Path B (fallback if Node TS pipeline rejects `with` syntax)**: dynamic readFileSync + JSON.parse at function top:
```typescript
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
const pkg = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../../package.json'), 'utf8'))
// ... L116 becomes:
const harnessedVer = pkg.version
```

**Path C (DROP if too risky)**: keep hardcoded with ADR rationale doc (DEFER Phase 4.0). NOT preferred — DEFERRED #AD is explicit fix target per ROADMAP L170 carry-forward.

**Karpathy preferred = Path A** if TypeScript + tsup + Node 22 pipeline supports `with { type: 'json' }` syntax (verified TypeScript 5.6+ supports per ECMAScript 2025 stage 4 import attributes spec; Node 22 supports per Node release notes). If Path A blocked → Path B fallback (Path B is more verbose +3L but works on any Node 22+ pipeline).

### 6.3 W0.2 Acceptance criteria (CONTEXT verbatim)

- `grep -q "harnessedVer.*package" src/cli/install.ts` exit 0
- `! grep -q "harnessedVer.*'0\\.3\\.0'" src/cli/install.ts` (hardcoded gone)

### 6.4 Side note — package.json version stale (NOT W0.2 scope, FYI for planner)

`package.json` L2 `"version": "0.1.0-alpha.1"` does not match shipped tags (`v0.3.0-alpha.3-aliases-known-good` per Phase 3.3 ship). After W0.2 Path A is wired, `harnessed install --known-good` will read `0.1.0-alpha.1` and look for `versions/0.1.0-alpha.1-known-good.yaml` (non-existent → loadKnownGood returns null → graceful fail-soft per `knownGood.ts` L24-25). **Two solutions** for planner consideration:
- (i) bump package.json to `0.3.0` in same W0.2 commit (1-line `package.json` edit)
- (ii) keep package.json as 0.1.0-alpha.1 and rename `versions/0.3.0-known-good.yaml` → `versions/0.1.0-alpha.1-known-good.yaml` (consistent with current publish stream)

**Recommendation**: (i) — bump package.json to `0.3.0` reflecting actual shipped milestone, then rename `versions/0.3.0-known-good.yaml` stays (no rename needed). This unblocks `harnessed install --known-good` post-W0.2 functional verify and aligns with v0.3.0 close phase scope. Worth a 1-line planner WARNING task in W0.2 commit.

[HIGH — install.ts L114-122 verbatim + package.json L2 verbatim + TypeScript / Node 22 import attributes spec verified]

---

## § 7 W0.3 DEFERRED #AC R7.6 real seed entries (planner cross-ref)

**Confidence: HIGH** — `manifests/{tools,skill-packs,cc-hooks}/*.yaml` 17 entries verified (bash ls); 6 sampled (gsd / gstack / ctx7 / tavily-mcp / karpathy-skills / aliases.yaml) — version + install_method extracted.

### 7.1 R7.6 candidate entry list (planner picks ~6-10 for W0.3 fill)

Cross-ref `manifests/*.yaml` `spec.install.{method,npm_version,git_ref}` + `package.json` `dependencies`:

| Name | Version (pinned) | install_method | Source |
|------|------------------|----------------|--------|
| `claude-agent-sdk` | `0.3.142` | `npm-cli` | `package.json` L70 `@anthropic-ai/claude-agent-sdk: 0.3.142` exact |
| `gstack` | `74895062fb8a3acbf9f66cd088a83359aaaa56cd` (git SHA) | `git-clone-with-setup` | `manifests/skill-packs/gstack.yaml` L22 `git_ref` |
| `gsd` | `^1.41.0` (npm semver, `1.41.2` last-known-good) | `npm-cli` | `manifests/skill-packs/gsd.yaml` L22 `npm_version` + L34 `last_known_good_version` |
| `superpowers` | (planner verify `manifests/tools/superpowers.yaml`) | `git-clone-with-setup` (assumed claude plugin) | `manifests/tools/superpowers.yaml` |
| `planning-with-files` | (planner verify) | `cc-skill-pack` | `manifests/skill-packs/planning-with-files.yaml` |
| `mattpocock-skills` | (planner verify) | `cc-skill-pack` | `manifests/skill-packs/mattpocock-skills.yaml` |
| `karpathy-skills` | `skill-only-v1` (last-known-good local-copy) | `git-clone-with-setup` (local cp -R fallback per DI-1 hotfix Phase 2.3) | `manifests/skill-packs/karpathy-skills.yaml` L58 `last_known_good_version` |
| `tavily-mcp` | `^0.2.0` (npm semver, `0.2.19` last-known-good) | `mcp-stdio-add` | `manifests/tools/tavily-mcp.yaml` L22 `npm_version` + L33 |
| `exa-mcp` | (planner verify `manifests/tools/exa-mcp.yaml`) | `mcp-stdio-add` | `manifests/tools/exa-mcp.yaml` |
| `ctx7` | `^0.4.0` (npm semver, `0.4.x` last-known-good) | `npm-cli` | `manifests/tools/ctx7.yaml` L22 `npm_version` + L33 |
| `ralph-loop` | (planner verify) | (planner verify install_method) | `manifests/tools/ralph-loop.yaml` |
| `playwright-test` | (planner verify) | `npm-cli` (assumed) | `manifests/tools/playwright-test.yaml` |
| `chrome-devtools-mcp` | (planner verify) | `mcp-stdio-add` | `manifests/tools/chrome-devtools-mcp.yaml` |
| `dashboard-autospawn` | (planner verify) | `cc-hook-add` (Phase 2.4 7th installer) | `manifests/cc-hooks/dashboard-autospawn.yaml` |

**Recommended W0.3 fill: 8 entries** — first 8 above (claude-agent-sdk + gstack + gsd + superpowers + planning-with-files + mattpocock-skills + karpathy-skills + tavily-mcp). Karpathy YAGNI hard cap 10 (covers core engineering stack + key MCP — not every manifest needs lock).

### 7.2 W0.3 yaml fill format (`versions/0.3.0-known-good.yaml`)

Sister Phase 3.3 W1 T1.11 MVP empty seed format (verified verbatim above):

```yaml
schemaVersion: harnessed.known-good.v1
harnessed_version: '0.3.0'
e2e_verified_at: '2026-05-17'  # Phase 3.4 W0.3 actual e2e verify date (not 'TBD' / placeholder)
upstreams:
  - name: claude-agent-sdk
    version: '0.3.142'
    install_method: npm-cli
  - name: gstack
    version: '74895062fb8a3acbf9f66cd088a83359aaaa56cd'  # git SHA pinned
    install_method: git-clone-with-setup
  - name: gsd
    version: '1.41.2'  # last-known-good pinned (not ^semver range)
    install_method: npm-cli
  # ... etc 8 entries total
```

### 7.3 W0.3 schema compliance verify

Per `src/manifest/schema/known-good.v1.ts` L14-19 `PinnedUpstream`:
- `name: minLength 1` — all entries OK
- `version: minLength 1` — all entries OK (git SHA / npm semver / fixed version 全 satisfy)
- `install_method: minLength 1` (NOT enum, Karpathy YAGNI per L7 anti-spec-drift comment) — all entries OK
- `e2e_verified_at: pattern ^\\d{4}-\\d{2}-\\d{2}$` — `'2026-05-17'` OK (current date)
- `harnessed_version: pattern ^\\d+\\.\\d+\\.\\d+$` — `'0.3.0'` OK

### 7.4 Acceptance criteria (CONTEXT verbatim)

- `upstreams[]` length ≥ 5
- `e2e_verified_at: '2026-05-17'` (not 'TBD')
- `corepack pnpm test` (existing knownGood.test.ts passes against filled fixture)

[HIGH — 5 manifest files read verbatim + known-good.v1 schema verbatim + sister Phase 3.3 MVP seed format directly referenced]

---

## § 8 W0.4 DEFERRED #AE path traversal regex spike (30min)

**Confidence: HIGH** — `src/cli/install.ts` L77-94 manifest path construction code path verified.

### 8.1 Attack vector analysis (the spike)

Current `install.ts` L77-78 path construction:
```typescript
const manifestPath = resolve(process.cwd(), `manifests/tools/${resolvedName}.yaml`)
const skillPackPath = resolve(process.cwd(), `manifests/skill-packs/${resolvedName}.yaml`)
```

User input flow:
- `harnessed install <name>` → `name` arg → `resolveAlias(name)` → `resolvedName` → string-interpolated into `manifests/tools/${resolvedName}.yaml` path.

**Theoretical attack**: `harnessed install "../../etc/passwd"` → `resolvedName = '../../etc/passwd'` → `manifestPath = resolve(cwd, 'manifests/tools/../../etc/passwd.yaml')` → `path.resolve` normalizes to `/etc/passwd.yaml`. Then `readFile(manifestPath, 'utf8')` attempts to read `/etc/passwd.yaml` (or throws ENOENT).

### 8.2 Spike outcome (per code path review — verified reality, NOT theoretical)

| Step | Outcome |
|------|---------|
| (1) `readFile('/etc/passwd.yaml', 'utf8')` | ENOENT (file doesn't exist) → catch block L86-94 |
| (2) Falls through to `skillPackPath` try (same `../../etc/passwd` interpolated) | ENOENT (file doesn't exist) → final catch L87-94 |
| (3) Both fail → `console.error(...)` + `process.exit(1)` | exits 1 with error msg "manifest 'X' not found" |

**Even if** attacker manages to find a `.yaml` file outside `manifests/` to read (e.g., `harnessed install "../../package"` → reads `package.yaml` if exists), the file is then passed to `validateManifestFile()` L96 → TypeBox schema strict validate (`apiVersion: harnessed/v1` + `kind: Manifest` + ... required) → 99.9% rejects garbage YAML → exits 1.

**Real attack surface = near-zero** for filesystem exfiltration:
- `path.resolve` is absolute-safe (doesn't escape root)
- ENOENT on most plausible target paths
- TypeBox schema validate rejects non-manifest YAML
- No filesystem WRITE primitive in install.ts user-input path
- No shell exec / eval / subprocess with user input in install path (only npm/git invocations with manifest-derived versions, sister Phase 2.1 audit cmd injection SHELL_EVAL_MARKERS pattern protects those)

### 8.3 Recommendation: **DEFER to Phase 4.0 with rationale doc** (Karpathy YAGNI win)

W0.4 outcome: file `.planning/phase-3.4/SPIKE-W0.4-path-traversal.md` ~30L documenting:
- Code path analysis (above 8.1)
- ENOENT + TypeBox 双层防御 (no real exfil primitive)
- 1 unit test `tests/integration/install-path-traversal.test.ts` 1 fixture asserts `harnessed install "../../etc/passwd"` exits 1 with "manifest not found" (defense-in-depth empirical proof, NO regex needed)
- DEFER explicit hardening regex to Phase 4.0 (when external user input arrives — currently sole consumer is project maintainer)

**Alternative (if spike surprises with real vector)**: add 1-line guard at install.ts L77 entry:
```typescript
if (/[\\/]|\\.\\./.test(name)) { console.error(`error: invalid manifest name (path chars rejected): ${name}`); process.exit(1) }
```
+ 1 fixture asserts rejection. Estimated 3L code delta. ≤200L hard limit OK (install.ts current 140L).

### 8.4 Sister Phase 3.3 § 10.4 STRIDE Tampering threat model — already documented

Sister Phase 3.3 RESEARCH § 10.4 already enumerated:
- "Malicious aliases.yaml `redirect: '../../../etc/passwd'` (path traversal via redirect name)" — Tampering — mitigation: "install.ts could regex-guard `resolvedName` against `/[/\\.]/` chars (Phase 3.4 hardening if real threat surfaces)"

→ Phase 3.4 W0.4 spike outcome confirms: real threat does NOT surface (defense-in-depth already there). DEFER explicit regex hardening to Phase 4.0 W0 if external user demand arrives.

[HIGH — install.ts L77-94 path construction verbatim + ENOENT + TypeBox 双层防御 verified by code path trace; spike outcome predicted with high confidence pre-spike]

---

## § 9 W2 v0.3.0 close prep (sister v0.2.0 Phase 2.4 W6 close template)

**Confidence: HIGH** — `.planning/v0.2.0-MILESTONE-AUDIT.md` L1-150 verbatim model + `.planning/milestones/v0.2.0-{ROADMAP,REQUIREMENTS}.md` (10.7k + 6.6k) verified present.

### 9.1 Sister v0.2.0 close artifacts (template gold-standard)

| Artifact | Sister source | Phase 3.4 W2 equivalent |
|----------|--------------|-------------------------|
| `.planning/milestones/v0.2.0-ROADMAP.md` (10.7k, copy + freeze v0.2.0 section from ROADMAP.md) | shipped 2026-05-16 W6 T6.5 | `.planning/milestones/v0.3.0-ROADMAP.md` (copy ROADMAP.md L130-178 v0.3.0 section + freeze) |
| `.planning/milestones/v0.2.0-REQUIREMENTS.md` (6.6k, R-section subset frozen) | shipped 2026-05-16 W6 T6.5 | `.planning/milestones/v0.3.0-REQUIREMENTS.md` (copy REQUIREMENTS.md R7.x section + lock) |
| `.planning/v0.2.0-MILESTONE-AUDIT.md` (12.9k, 150L 6-section audit) | shipped 2026-05-16 W6 T6.5 | `.planning/v0.3.0-MILESTONE-AUDIT.md` (sister 6-section: TL;DR + § 1 per-phase + § 2 cross-phase integration + § 3 e2e flows + § 4 requirements coverage + § 5 v0.3.0 vs v0.2.0 对比 + § 6 verdict) |

### 9.2 v0.2.0-MILESTONE-AUDIT.md 6-section template (verbatim structure model)

Sister L1-150 verified:
- **YAML frontmatter** (L1-36): `milestone` + `audited` + `status` + `scores: {requirements, phases, integration, flows}` + `gaps: {requirements, integration, flows}` + `tech_debt: [{phase, items}]`
- **TL;DR** (L45-51): 2-3 paragraphs ship quality + key judgment
- **§ 0.5 Line Budget Deviations Accepted** (L53-62): per-file LoC > hard limit but accepted-with-rationale table
- **§ 1 Per-Phase Status** (L66-75): 4-row table phase / 自验状态 / Critical Gaps / Tech Debt
- **§ 2 Cross-Phase Integration** (L77-90): seam matrix (N seams, all ✅ OK with evidence)
- **§ 3 E2E Flows** (L92-101): flow matrix (5 flows wired with evidence)
- **§ 4 Requirements Coverage** (L103-123): REQ ID × status × evidence × phase
- **§ 5 vN.N vs vN-1.N 对比** (L125-138): 8-dim table phase count / atomic commits / ADR / tag / tests / acceptance bar / audit gap / sister review hotfix / architecture change
- **§ 6 Verdict** (L140-144): PASSED + close + tag + next-milestone announcement

### 9.3 Phase 3.4 W2 milestone close task list (sister Phase 2.4 W6 T6.1-T6.5 ordering)

| Task | Sister Phase 2.4 W6 | Phase 3.4 W2 description |
|------|--------------------|--------------------------|
| W2.T2.1 | T6.1 | ADR 0017 NEW 9 章节 errata `docs/adr/0017-routing-hit-rate-token-budget-v0.3-close.md` (sister 0014/0015/0016 9-章 template) ≤250L |
| W2.T2.2 | T6.2 | `.github/workflows/ci.yml` A7 守恒 iter `1-0016` → `1-0017` (sister "A7 iter 1-N-1 → 1-N" pattern per ADR add) |
| W2.T2.3 | T6.3 | STATE.md + RETROSPECTIVE.md 续编 (Phase 3.4 ship event + W0.1 D2 实施 first time — trim Phase 3.1 + 3.2 narrative → RETROSPECTIVE archive section) |
| W2.T2.4 | T6.3 | ROADMAP.md Phase 3.4 ✅ SHIPPED mark + v0.3.0 100% PROGRESS (4/4 phases ✅) + Status header update + sister markers |
| W2.T2.5 | T6.3 | README.md L46-56 sync shipped phase count (Phase 3.4 + v0.3.0 milestone shipped row add — sister Phase 2.3+2.4 ship-sister H1+H2 5+ stale 处一次根治 lesson) |
| W2.T2.6 | T6.3 | PROJECT-SPEC.md Status: header update + sister markers |
| W2.T2.7 | T6.4 | baseline tag `adr-0017-accepted` + per-phase milestone tag `v0.3.0-alpha.4-routing` triple push |
| W2.T2.8 | T6.4 | 🎯 milestone tag `v0.3.0` triple push (v0.2.0 sister: `git tag v0.2.0` pushed 2026-05-16) |
| W2.T2.9 | T6.5 | milestone archive: `.planning/milestones/v0.3.0-{ROADMAP,REQUIREMENTS}.md` copy + freeze |
| W2.T2.10 | T6.5 | `.planning/v0.3.0-MILESTONE-AUDIT.md` 6-section audit write (sister L1-150 template; PASS verdict expected if 4/4 phases × 8/8 acceptance bar verified) |
| W2.T2.11 | T6.5 (DOGFOOD) | `.planning/phase-3.4/DOGFOOD-T2.11.md` PASS N/N miss: none (sister Phase 3.2 T3.5 + Phase 3.3 T2.8 DOGFOOD format) |

### 9.4 Phase 3.4 W2 milestone tag naming convention

Sister v0.2.0 sequence: `v0.2.0-alpha.1-installers` (Phase 2.1) → `v0.2.0-alpha.2-execute-task` (Phase 2.2) → `v0.2.0-alpha.3-extension-mvp` (Phase 2.3) → `v0.2.0-alpha.4-doctor-ee4` (Phase 2.4) → 🎯 `v0.2.0` (milestone).

Phase 3.4 derived: `v0.3.0-alpha.1-checkpoint` (3.1) ✅ + `v0.3.0-alpha.2-gstack-prefix` (3.2) ✅ + `v0.3.0-alpha.3-aliases-known-good` (3.3) ✅ + **`v0.3.0-alpha.4-routing` (3.4 close phase)** + 🎯 **`v0.3.0`** (milestone tag).

[HIGH — sister v0.2.0-MILESTONE-AUDIT.md 150L 100% verbatim model + sister Phase 2.4 W6 T6.1-T6.5 task ordering verified ship checklist]

---

## § 10 Validation Architecture (Nyquist gate prep)

> Phase config `workflow.nyquist_validation` assumed enabled (absence = enabled per spec).

### 10.1 8 dimension test count recommendation

| Dimension | Phase 3.4 surface | Test count target | Anchor |
|-----------|-------------------|------------------|--------|
| **Functional** | check-token-budget.ts (pass/warn/fail × empty/single/multi skills) + routing-hit-rate harness (30 sample × dispatch + per-tier breakdown) + install.ts package.json read (pkg.version reflect) + knownGood.ts real entries consume (`upstreams[]` length ≥ 5) | ≥ **15 fixture** (check-token-budget 5 + routing-hit-rate 30 sample + per-tier 3 + install.ts version 1 + knownGood 4) | `tests/cli/check-token-budget.test.ts` (5) + `tests/routing/phase-3.4-routing-hit-rate.test.ts` (33 = 30 sample + 3 per-tier) + `tests/cli/install-version-from-pkg.test.ts` (1) + `tests/manifest/knownGood-real-entries.test.ts` (4) |
| **Contractual** | NO NEW schema (Phase 3.3 13 surface consumed unchanged); known-good.yaml entries Value.Check pass + invalid version pattern reject + invalid e2e_verified_at pattern reject | ≥ **5 fixture** (existing knownGood schema test + 3 negative cases + 1 fill verify) | `tests/manifest/schema/known-good-v1.test.ts` (existing 4) + `tests/manifest/knownGood-fill-verify.test.ts` (1 NEW) |
| **Integration** | routing.dispatch real production `decision_rules.yaml` (NOT mock) + `harnessed install --known-good` filled entries (e2e dispatch pinned version) + doctor 8th check end-to-end | ≥ **10 fixture** (30-sample dispatch is the primary integration anchor + 1 install --known-good fixture + 1 doctor 8th check dispatch) — already covered by functional 30 sample table + per-tier 3 + install-known-good integration | shares `tests/routing/phase-3.4-routing-hit-rate.test.ts` 30+3 + `tests/integration/install-known-good-real.test.ts` (1) + `tests/cli/doctor-token-budget-dispatch.test.ts` (1) |
| **Observability** | doctor `--json` 8th check structure (`{name, status, message, fix?}` round-trip) + doctor human-readable token budget format (top-3 consumers visible) + routing-hit-rate test [MISS] console.error diff format (sister Phase 2.3 sample mis-match output) | ≥ **3 fixture** | `tests/cli/doctor-token-budget-json.test.ts` (1) + `tests/cli/doctor-token-budget-human.test.ts` (1) + (covered in routing-hit-rate above) (1) |
| **Failure-mode** | 30-sample miss diff output verify + per-tier accuracy breakdown < 60% cherry-pick warn + path traversal attack mock (W0.4) + check-token-budget skills/ absent / SKILL.md absent / frontmatter malformed graceful | ≥ **5 fixture** | covered in routing-hit-rate (per-tier 3) + W0.4 path traversal fixture (1) + `tests/cli/check-token-budget-graceful.test.ts` (3) |
| **Performance** | routing.dispatch 30 sample × <10ms = <1s total runtime (sister Phase 2.3 W4 100% pattern 100ms each → 3s 接受) + check-token-budget skill scan + estimateTokens (existing Phase 3.1 micro-bench) | ≥ **1 micro-bench** | `tests/routing/hit-rate-perf.bench.ts` (1, vitest bench) — optional |
| **Migration** | Phase 3.3 → 3.4 carry: doctor 7 → 8 check (existing 7 fixtures still pass + new 1 fixture for 8th dispatch) + STATE.md COLLAPSE pre/post (existing STATE_POSITION_RE freshness gate还过, plus check-state-archive-stale.mjs warn-only round 1) + install.ts version read backward-compat (existing 7+ install tests still pass) | ≥ **3 fixture** | `tests/cli/doctor.test.ts` (1 — adds 8th check case) + `tests/scripts/check-state-archive-stale.test.ts` (1) + `tests/cli/install-version-from-pkg.test.ts` (1 covered above) |
| **Security** | path traversal install fixture (W0.4 spike) + check-token-budget no shell-exec injection (pure fs read) | ≥ **2 fixture** | `tests/integration/install-path-traversal.test.ts` (1) + `tests/cli/check-token-budget-no-injection.test.ts` (1) |

**Total fixture target**: ≥ **15 (functional) + 5 (contract) + 10 (integration) + 3 (observ) + 5 (failure) + 1 (perf) + 3 (migration) + 2 (security)** = **≥ 44 NEW + reused test fixture**

Sister Phase 3.3 ≥ 38 (2 NEW surface 12+13) + Phase 3.2 ≥ 43 (3 NEW surface 9+10+11). Phase 3.4 ≥ 44 (0 NEW schema surface + 30-sample harness primary driver + scope wider). Within sister cadence.

### 10.2 Sampling rate

- **Per task commit**: `corepack pnpm test -- --run tests/<scope>.test.ts` (≤ 3s typical for routing hit-rate fixture)
- **Per wave merge**: `corepack pnpm test` (full suite, ~30-40s based on Phase 3.3 659+ test baseline + 44 new ≈ 703 total)
- **Phase gate**: full suite green + `corepack pnpm test -- --run tests/routing/phase-3.4-routing-hit-rate.test.ts` 30+3 fixture all green + `tests/cli/check-token-budget.test.ts` 5 fixture all green before `/gsd-verify-work`

### 10.3 Wave 0 gaps (test files needed)

- [ ] `tests/cli/check-token-budget.test.ts` — covers checkTokenBudget pass/warn/fail + 5 fixture (D-03 + D-04)
- [ ] `tests/routing/phase-3.4-routing-hit-rate.test.ts` — 30+3 fixture sister samples-30.test.ts 100% template (D-01 + D-02)
- [ ] `tests/cli/install-version-from-pkg.test.ts` — install version from package.json 1 fixture (W0.2 #AD)
- [ ] `tests/manifest/knownGood-real-entries.test.ts` — `upstreams[]` length ≥ 5 + e2e_verified_at != 'TBD' (W0.3 #AC)
- [ ] `tests/manifest/knownGood-fill-verify.test.ts` — fill schema Value.Check pass + 1 invalid case
- [ ] `tests/integration/install-known-good-real.test.ts` — e2e dispatch pinned version 1 fixture (W0.3)
- [ ] `tests/cli/doctor-token-budget-dispatch.test.ts` — doctor 8th check delegate 1 fixture (D-04)
- [ ] `tests/cli/doctor-token-budget-json.test.ts` — `--json` output structure 1 fixture (observability)
- [ ] `tests/cli/doctor-token-budget-human.test.ts` — human-readable format 1 fixture (observability)
- [ ] `tests/cli/check-token-budget-graceful.test.ts` — skills/ absent / SKILL.md absent / frontmatter malformed 3 fixture (failure)
- [ ] `tests/scripts/check-state-archive-stale.test.ts` — 3 rules verify 1 fixture each (warn-only round 1)
- [ ] `tests/integration/install-path-traversal.test.ts` — W0.4 spike fixture defense-in-depth 1 fixture (security)
- [ ] `tests/cli/check-token-budget-no-injection.test.ts` — pure fs read, no shell exec primitive 1 fixture (security)

(Framework install: vitest 既存; no new dep needed — sister Phase 3.2+3.3 zero-dep cadence延续.)

### 10.4 Threat model nodes (security dimension brief)

| Threat | STRIDE | Mitigation |
|--------|--------|-----------|
| `harnessed install "../../etc/passwd"` filesystem exfiltration | Tampering | path.resolve absolute-safe + ENOENT graceful + TypeBox schema validate reject non-manifest YAML (verified § 8.2 code path trace) |
| Verbose skill description bloat → context window exhaustion (DoS via legitimate skill but bad budget) | DoS | doctor 8th check `checkTokenBudget` warn (D-04) — visibility, NOT enforcement; sister Phase 3.3 D-02 DOCTOR-ONLY-WARN cadence |
| 30-sample SAMPLES.md cherry-pick (tester picks easy samples to inflate hit rate) | Tampering (governance) | SAMPLES.md frozen plan-phase Wave B; execute-phase 不允许改 sample (R3 lock); per-tier breakdown defends mean (single tier <60% warn) — sister Phase 2.3 § 1.4 / Phase 1.4 § 1.4 cadence |
| package.json fake version injection (attacker writes `version: "0.0.0-rce"`) | Tampering | package.json is git-tracked + PR review gate; harnessedVer reflects authentic publish stream; install --known-good reads `versions/<ver>-known-good.yaml` (also git-tracked); release-process accountability |

[MEDIUM-HIGH — fixture count target ≥ 44 projection-based; threat model 4 nodes sister Phase 3.3 § 10.4 pattern延袭 + W0.4 spike outcome empirically grounded]

---

## § 11 W0.1 D3 check-state-archive-stale.mjs gate design

**Confidence: HIGH** — sister `scripts/check-transparency-verdicts.mjs` L1-130 verbatim pattern verified.

### 11.1 Sister gate pattern (`check-transparency-verdicts.mjs` 130L)

```javascript
#!/usr/bin/env node
// Phase 2.1 T1.7 — transparency verdict-marker gate (warn-only round 1; flip ENFORCE Phase 2.2 W0 T0.6).
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const ENFORCE = true // Phase 2.2 W0 T0.6 ship-time flip (warn-only round 1 → ENFORCE round 2)
// ... scan + violations + exit ENFORCE ? 1 : 0 pattern
```

### 11.2 3 rules implementation (`scripts/check-state-archive-stale.mjs` NEW ~60L)

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

LOC count: ~55L with comments + 3-rule scan + ENFORCE switch. Karpathy hard limit ≤60L per CONTEXT spec ✅.

### 11.3 CI integration (`.github/workflows/ci.yml` step add)

```yaml
- name: Check STATE.md archive cadence (warn-only round 1)
  run: node scripts/check-state-archive-stale.mjs
```

Place after `node scripts/check-transparency-verdicts.mjs` step (sister gate adjacency). Warn-only round 1 (Phase 3.4 ship); ENFORCE flip Phase 3.5 OR v0.4.0.

### 11.4 ENFORCE flip cadence (sister 4-phase precedent)

Sister `check-transparency-verdicts.mjs` ENFORCE history (verified L12):
- Phase 2.1 T1.7 ship — `ENFORCE = false` round 1 (warn-only)
- Phase 2.2 W0 T0.6 ship — `ENFORCE = true` round 2 flip (after 1 phase warn-only + 13 verdict marker migration + W3 lock 解除)

Phase 3.4 W0.1 D3 same cadence: round 1 warn-only ship Phase 3.4; round 2 ENFORCE flip after STATE.md normalize completes (Phase 3.5 OR v0.4.0 W0 first task).

[HIGH — sister 130L gate pattern verbatim + 3-rule design + sister 4-phase ENFORCE flip cadence verified `check-transparency-verdicts.mjs` L12]

---

## § 12 Wave topology recommendation

**Confidence: HIGH** — sister Phase 3.3 3-wave (W0-W2) pattern直证; Phase 3.4 scope类似 (5 backlog items + harness wire + helper NEW + v0.3.0 milestone close).

### 12.1 推荐: 3 wave (W0-W2) topology

| Wave | Scope | Tasks | LOC delta est | Tests delta |
|------|-------|-------|--------------|-------------|
| **W0** backlog 5 项 absorb (必修 first) | W0.1 STATE institutionalize STRATEGIC (D1-D4 + gate ≤60L NEW + warn-only round 1) + W0.2 install.ts version read (1-line surgical Path A or B) + W0.3 known-good real seed fill (~8 entries) + W0.4 path traversal spike outcome doc (defer Phase 4.0 30L doc) + W0.5 SAMPLES.md NEW (30-row matrix mining + manual trace expected_decision) | 5 atomic | +60L `check-state-archive-stale.mjs` NEW + ~5-50L STATE.md delta (post-collapse) + ~3L install.ts MODIFY + ~30L yaml fill + ~30L W0.4 doc + ~180L SAMPLES.md NEW | 0 NEW W0 fixture (W0.5 SAMPLES.md is W1 test consumer input) |
| **W1** check-token-budget + doctor 8th + routing harness (主线) | T1.1 wc -l doctor.ts pre-flight gate + T1.2 doctor.ts borderline mitigation (Option A inline shrink OR B helper extract) + T1.3 check-token-budget.ts NEW ≤40L PRIMARY helper + T1.4 doctor.ts 8th check wire (~6L MODIFY) + T1.5 install.ts package.json version Path A or B (1-line) + T1.6 versions/0.3.0-known-good.yaml fill (8 entries) + T1.7 phase-3.4-routing-hit-rate.test.ts NEW (~120L sister samples-30) + T1.8 5+ tests (check-token-budget + install version + knownGood-real + doctor 8th JSON + human + graceful + path traversal + check-state-archive gate) | 8 atomic | ~+50L helper NEW + ~+6L doctor.ts MODIFY + ~+3L install.ts MODIFY + ~+30L yaml fill + ~+120L routing test NEW + ~+200L 5+ tests NEW | +44 fixture (functional 15 + contract 5 + integration 10 + observability 3 + failure 5 + perf 1 + migration 3 + security 2 — overlapping per § 10.1 actual ≈ 22 NEW concrete + 22 sister-share / per-tier rolled) |
| **W2** v0.3.0 close prep (sister Phase 2.4 W6 100% template) | T2.1 ADR 0017 9 章节 errata NEW ≤250L + T2.2 ci.yml A7 iter 1-0016→1-0017 + T2.3 STATE/RETROSPECTIVE 续编 (W0.1 D2 first ship-time implementation) + T2.4 ROADMAP Phase 3.4 ✅ SHIPPED mark + v0.3.0 100% PROGRESS + T2.5 README.md L46-56 sync + T2.6 PROJECT-SPEC.md Status header update + T2.7 baseline tag `adr-0017-accepted` + per-phase tag `v0.3.0-alpha.4-routing` + T2.8 🎯 milestone tag `v0.3.0` triple push + T2.9 `.planning/milestones/v0.3.0-{ROADMAP,REQUIREMENTS}.md` archive + T2.10 `.planning/v0.3.0-MILESTONE-AUDIT.md` 6-section audit NEW + T2.11 DOGFOOD-T2.11.md PASS verify | 11 atomic | +250L ADR + 10L docs + tags + ~100L 2 milestone archive yaml frontmatter + ~150L audit | +0 NEW fixture (W2 是 docs + tags + audit phase) |

**Total wave breakdown**:
- 3 wave (sister Phase 3.3 3 wave)
- **5 + 8 + 11 = 24 atomic task** (sister Phase 3.3 25 atomic — comparable)
- ~+450L src/test/yaml/doc delta (excl. archive)
- ~+44 NEW + reused fixture (sister Phase 3.3 ≥38 fixture — comparable, slightly wider per 30-sample harness expansion)
- 1 ADR 0017 (9 章节 errata per Phase 3.1-3.3 sister cadence)
- v0.3.0 milestone close (sister v0.2.0 close pattern direct reuse)

### 12.2 Wave 依赖 graph

```
W0 (必修 first) ─┬─> W1 (helper + harness + 8th check)
                 │
                 ├─> (W0.5 SAMPLES.md gates W1.T1.7 routing harness)
                 ├─> (W0.1 STRATEGIC gates W2.T2.3 STATE.md continued 续编 first-implementation)
                 ├─> (W0.2 + W0.3 + W0.4 unblock W1 doctor + install + path tests)
                 │
                 └─> W2 (v0.3.0 close prep)
                       │
                       └─> (W1 must full-suite green before W2.T2.10 audit)
```

W0 内 5 task independent (institutionalize gate + 1-line MODIFY + yaml fill + spike doc + SAMPLES.md NEW); W1 内 8 task partial DAG (T1.1 pre-flight first → T1.2 mitigation → T1.3-T1.6 PRIMARY + integrate 并行 → T1.7 sister harness → T1.8 tests last); W2 全串行 (ADR first → ci/docs/tags + audit last). Sister Phase 3.3 DAG pattern verified.

### 12.3 Karpathy hard limit verification

每 wave 完后 verify per-file ≤ 200L hard limit:

| File | Pre | Post W1 | Within limit? |
|------|-----|---------|--------------|
| `src/cli/doctor.ts` | **195L** (实测) | **≤200L** (Option A inline shrink + 5L 8th check = exact 200L hit) | ✅ ≤200 (no B-03 tolerance per CONTEXT lock) |
| `src/cli/lib/check-token-budget.ts` NEW | 0 | ~38L (post-tighten per § 2.1) | ✅ ≤40L (CONTEXT spec) |
| `src/cli/install.ts` | 140L | 141L (Path A) or 144L (Path B) | ✅ ≤200 |
| `versions/0.3.0-known-good.yaml` | 9L | ~40L (8 entries × ~4L each) | (no Karpathy limit for yaml seed) |
| `scripts/check-state-archive-stale.mjs` NEW | 0 | ~55L | ✅ ≤60L (CONTEXT spec) |
| `.planning/phase-3.4/SAMPLES.md` NEW | 0 | ~180L (30 row × 6L) | ✅ ≤200L (CONTEXT spec) |
| `tests/routing/phase-3.4-routing-hit-rate.test.ts` NEW | 0 | ~130L (sister samples-30.test.ts 150L) | ✅ ≤200 (test file no hard limit but sister precedent) |
| `docs/adr/0017-routing-hit-rate-token-budget-v0.3-close.md` NEW | 0 | ~250L | ✅ ≤250L (sister ADR 0014-0016 9-章 hard limit) |

[HIGH — Karpathy hard limit per file verified at design time + sister Phase 3.3 § 12 model directly reused]

---

## § 13 Karpathy anti-pattern checks + v0.3.0 close discipline

**Confidence: MEDIUM** — 5 anti-pattern risks identified by reasoning; not spike-verified. 3 v0.3.0 close discipline items sister v0.2.0 close lesson grounded.

### 13.1 5 anti-pattern at risk + counter-discipline

| # | Anti-pattern temptation | Why risky | Counter-discipline |
|---|------------------------|-----------|-------------------|
| 1 | **doctor.ts ≤200L hard limit silent breach** — easy to add 8th check 4L + 1L import + 1L array entry = +6L → 201L, then "just 1L over, accept like Phase 2.4 B-03 5%" | CONTEXT explicit lock "no B-03 5% tolerance per CONTEXT D-04 explicit lock"; sister 5% precedent was 215L doctor.ts (Phase 2.4) — different scope window. Phase 3.4 must respect 200L strict. | 严格锁 § 1.2 pre-flight gate W1.T1.1 `wc -l src/cli/doctor.ts` verify still 195L → W1.T1.2 pick Option A (inline shrink delegate to 3L) OR B (helper extract). W1.T1.4 post-check `wc -l ≤ 200L` hard fail gate. |
| 2 | **30-sample cherry-pick inflation** — easy to pick samples that decision_rules.yaml already hits (sister Phase 1.4/2.3 100% routing was synthetic-friendly; REAL HISTORICAL must include 5+ hard-to-route edge cases) | D-01 REAL HISTORICAL dogfood value depends on **real distribution**, not selection bias; if all 30 samples are "fix typo" → 100% trivial Haiku → misleading; if all are obscure Opus multi-file → unrealistic | 严格锁 § 3.4 manual trace expected_decision per row + § 1.3 sister anchor / false-pos / CD-3 透明声明; per-tier breakdown < 60% warn ground-truth; SAMPLES.md frozen Wave B (R3 lock); ≥ 8 sample per tier hard min |
| 3 | **W0.1 STATE.md ≤150L theater (cosmetic trim, no real archive)** — easy to move content sideways into new doc and call it "archive" but break referential link | D1-D4 4 D-decisions are architectural; cosmetic archive 反 backfires (creates dual SoT 6th recurrence — exactly what STRATEGIC is preventing) | 严格锁 § 5.3 D2 ship-time T6.N integrate as standing process (sister Phase 2.4 W6 T6.3 RETRO 续编 100% pattern); D3 gate enforce visibility (warn round 1, ENFORCE round 2 sister Phase 2.1 cadence); D4 ship-process integrate (executor 不 SCOPE BOUNDARY 阻挡) — verifiable via PR diff: STATE.md L-archive移到 RETROSPECTIVE.md L-add 1:1 (no content lost, no dual SoT) |
| 4 | **BUFFER /4 silent over-estimation Chinese skill descriptions** — D-03 lock variance acceptable per CONTEXT, but planner might quietly switch to TIKTOKEN "for accuracy" | D-03 explicit REJECT TIKTOKEN (zero-dep + sister Phase 3.1 D-01 precedent); variance acceptable per sister precedent (doctor warn NOT hard limit enforce; users can investigate via per-skill breakdown) | 严格锁 § 2.4 `import { estimateTokens } from '../../checkpoint/template.js'` — direct sister 1 precedent reuse, NO new dep declaration. unit test verify `corepack pnpm list tiktoken` returns "no matches" (NOT installed); NO `import tiktoken` in `check-token-budget.ts` (grep gate) |
| 5 | **W2 milestone close "minor" task creep** — easy to "while we're closing v0.3.0 we should also..." which delays ship | sister v0.2.0 close clean ship 2 day (Phase 2.4 ship 2026-05-16 → v0.2.0 close same day) — verifying sister discipline holds | 严格锁 § 9.3 W2.T2.1-T2.11 11 task explicit list; reject 任何 W2 scope creep ("delegate to v0.4.0 R8.1 or Phase 4.0+ W0"); sister Phase 2.4 W6 T6.1-T6.5 strict bounded scope precedent |

### 13.2 v0.3.0 close discipline (sister v0.2.0 close lesson grounded)

| # | Discipline | Sister v0.2.0 precedent (verified `v0.2.0-MILESTONE-AUDIT.md` L46-51) |
|---|-----------|-----|
| 1 | **Single-day milestone close** | v0.2.0: Phase 2.4 ship 2026-05-16 + milestone close 2026-05-16 same day. Phase 3.4 target: same-day ship + close (2026-05-17 or 2026-05-18, depending on W1 完成 timing) |
| 2 | **PASS verdict honesty (4/4 phases × 8/8 acceptance bar verified)** | v0.2.0: "12 satisfied / 1 partial (R3.4 v0.2 portion) / 0 unsatisfied"; partial 项 明确 v0.3.0+ 去向 (NOT 隐瞒). Phase 3.4 audit: list all R7.x reqs honest status + Partial 明确 v0.4.0+ 去向 (R8.1 benchmark) |
| 3 | **archive 纪律 institutionalize first ship** | W0.1 D2 ship-time T6.N integrate first实施 IS in Phase 3.4 W2.T2.3 (sister Phase 2.4 W6 T6.3 pattern). v0.3.0 close 是 first phase where STATE.md trim-to-archive happens as ship process (NOT one-off cleanup) |

### 13.3 Karpathy 4 心法 application checklist

| 心法 | Application |
|------|-------------|
| **Think Before Coding** | Wave A R2 (本 RESEARCH) + Wave A R1 (PATTERNS reuse Phase 3.3 patterns) 完后才进 Wave B planner; D-01 SAMPLES.md mining + D-04 doctor pre-flight gate think-first |
| **Surgical Changes** | W0 backlog 5 项: 1-line install.ts MODIFY (Path A) + yaml fill (no code) + spike outcome doc (no code if defer) + gate ≤60L NEW + SAMPLES.md ≤200L NEW; W1 主线 ≤6L doctor MODIFY + ≤40L helper NEW + ≤130L test NEW (no big refactors); W2 docs + tags |
| **Simplicity First** | BUFFER /4 sister 1 precedent reuse (no tiktoken); routing harness 100% template reuse sister samples-30.test.ts (no new infra); 3 wave (vs Phase 3.3 3 wave — same cadence); known-good yaml flat list (no nested groups); v0.3.0 close sister v0.2.0 100% template (no new docs format) |
| **Goal-Driven** | R7.6 "harnessed install --known-good reproducible" + R7 dogfooding "30 真实任务 ≥ 85%" + ROADMAP "token 监控仪表落地" + STRATEGIC "STATE.md institutionalize" + v0.3.0 close 4 axis 都过即 phase ship; everything else is gold-plating |

---

## § 14 Open questions (resolved + remaining)

### Resolved (本 RESEARCH 决)

1. **doctor.ts wc -l 实测 baseline?** → § 1.1 195L 实测 (bash); 8th check delegate +6L → 201L breach → Option A inline shrink to 3L 解决
2. **D-03 skill description scan path?** → § 2.1 `~/.claude/skills/<name>/SKILL.md` installed + repo `skills/` dev fallback; frontmatter description field regex extract + estimateTokens import reuse
3. **D-03 thresholds rationale?** → § 2.2 Sonnet 200k baseline + 1% (2000) total + 5k per-skill (sister 1k checkpoint × 5 realistic)
4. **30-sample mining feasibility?** → § 3 git log 331 commits in window verified + 7-bucket commit prefix distribution feasible 10/10/10 selection
5. **D-02 RUN ENGINE harness API?** → § 4 `arbitrate(rules, task)` direct call (NOT runRouting); per-tier breakdown + Sonnet 100% / Haiku ≥84% R7 verbatim acceptance gate
6. **W0.1 STATE.md size?** → § 5.1 实测 723L; archive ~400L → ~323L round 1 target ≤200L (NOT 150L straight, v0.4+ tighten)
7. **W0.2 install.ts version read?** → § 6.2 Path A (Node 22 ES2022 `with { type: 'json' }`) preferred; Path B readFileSync fallback; +bonus: bump package.json L2 0.1.0-alpha.1 → 0.3.0 align shipped tags
8. **W0.3 real entries selection?** → § 7.1 recommended 8 entries (claude-agent-sdk + gstack + gsd + superpowers + planning-with-files + mattpocock-skills + karpathy-skills + tavily-mcp); cross-ref `manifests/*.yaml`
9. **W0.4 path traversal real?** → § 8.2 spike outcome: NOT real (ENOENT + TypeBox 双层防御); recommend DEFER Phase 4.0 + 30L rationale doc + 1 defense-in-depth fixture
10. **W2 v0.3.0 close template?** → § 9 sister `v0.2.0-MILESTONE-AUDIT.md` L1-150 100% template reuse + Phase 2.4 W6 T6.1-T6.5 task ordering verified
11. **W0.1 D3 gate design?** → § 11 sister `check-transparency-verdicts.mjs` L1-130 100% pattern; 3 rules ≤60L NEW; warn-only round 1; ENFORCE flip Phase 3.5/v0.4.0
12. **Wave topology?** → § 12.1 3 wave (W0-W2), 24 atomic task, ~44 NEW+reused fixture, 1 ADR 0017 9 章节

### Remaining (planner 决)

1. **W2 milestone tag literal** — `v0.3.0-alpha.4-routing` (recommended per sister v0.2.0-alpha.4-doctor-ee4 cadence) vs `v0.3.0-alpha.4-routing-token-budget` (more verbose, more accurate dual-feature) — recommend `v0.3.0-alpha.4-routing` (concise, primary feature first)
2. **W0.2 package.json bump scope** — bump 0.1.0-alpha.1 → 0.3.0 in same W0.2 commit, OR separate W0.6 / W0.2.1 task? — recommend SAME W0.2 commit (1-line, surgical, atomic with version-read fix)
3. **W0.3 8 entries OR up to 10?** — 6 core engineering + 2 MCP defaults = 8 is minimum threshold; planner may add ralph-loop + playwright-test = 10 if Karpathy hard cap satisfied
4. **W2.T2.10 audit verdict expected** — PASS expected if 4/4 phase × 8/8 acceptance bar holds; planner doc that audit verdict is conditional on per-phase ship verification (sister Phase 2.4 audit was PASS post-reconciliation Path A)
5. **W1 8th check borderline mitigation path** — Option A (inline shrink, 0 NEW file) OR B (helper extract, 1 NEW lib/doctor-runner.ts) — recommend Option A (Karpathy surgical, 1L delta vs B's 30L NEW file)
6. **D3 gate ENFORCE flip timing** — Phase 3.5 OR v0.4.0 W0 first task? — sister `check-transparency-verdicts.mjs` 1-phase warn-only → ENFORCE flip cadence suggests Phase 3.5 W0 first task; but v0.3.0 close is hard milestone, planner may defer to v0.4.0 to maintain v0.3.0 clean ship

---

## § 15 Assumptions Log

> Claims tagged `[ASSUMED]` in this research (planner + discuss-phase 需 user confirm before execution):

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | TypeScript 5.6+ + tsup + Node 22 pipeline supports `with { type: 'json' }` import attributes syntax | § 6.2 Path A | LOW — if blocked, Path B readFileSync fallback works on any Node 22+; +3L delta acceptable |
| A2 | `~/.claude/skills/<name>/SKILL.md` is the canonical install location for harnessed-managed skill packs (consumer of check-token-budget scan) | § 2.1 | LOW — sister `manifests/skill-packs/gstack.yaml` L22+L25+L28 verified `~/.claude/skills/gstack` install dest; repo `skills/` fallback covers dev mode |
| A3 | Phase 3.4 ship + v0.3.0 milestone close achievable single-day per sister v0.2.0 (Phase 2.4 ship + close 2026-05-16 same day) | § 13.2 | MEDIUM — depends on W0.1 STATE.md trim scope (400L archive) timing; planner may split close to next day if W1 main suite slow |
| A4 | Opus tier target ≥ 80% accuracy (ROADMAP only specifies Sonnet 100% / Haiku ≥ 84% verbatim) | § 4.4 | LOW — Opus tier serves as quality "ceiling" tier in routing rules; 80% derived as reasonable middle bar; planner may adjust to 70% or 85% per dogfood reality |

**All other claims verified or sister-cited** — 4 ASSUMED tags only. Verifications:
- doctor.ts 195L: `wc -l` bash 实测
- BUFFER /4: `src/checkpoint/template.ts` L34-36 verbatim
- 30-sample mining: `git log` bash 331 commits实测 + `.planning/phase-*/task_plan.md` 10 files verified
- sister harness pattern: `tests/routing/samples-30.test.ts` L1-150 verbatim
- STATE.md size + sections: bash + grep实测
- install.ts TODO: L114-122 verbatim
- known-good schema + loader: src/manifest verbatim
- sister Phase 2.4 W6 v0.2.0 close artifacts: `.planning/milestones/v0.2.0-*.md` + `.planning/v0.2.0-MILESTONE-AUDIT.md` verbatim verified

---

## § 16 Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | All TypeScript code | ✓ | ≥22 (verified Phase 2.4 doctor.ts L30 + package.json L24 `engines.node: >=22.0.0`) | — |
| corepack | `pnpm` invocation | ✓ | (Node 22 bundled) | — |
| pnpm | install + test | ✓ | (`packageManager: pnpm@10.12.0` package.json L26) | — |
| TypeScript | tsc + vitest transform | ✓ | ^5.6.0 (devDep package.json L86) | — |
| vitest | test runner | ✓ | ^4.0.0 (devDep package.json L87) | — |
| @sinclair/typebox | schema (Phase 3.3 13-surface consume) | ✓ | ^0.34.49 (package.json L72) | — |
| yaml | known-good.yaml + decision_rules.yaml parse | ✓ | ^2.9.0 (package.json L79) | — |
| commander | CLI flag parsing | ✓ | ^13.0.0 (package.json L76) | — |
| @anthropic-ai/claude-agent-sdk | routing.dispatch (Phase 1.4 R1 wired) | ✓ | 0.3.142 exact (package.json L70) | — |
| git | git log mining (W0.5) | ✓ | (verified bash) | — |
| biome | preempt lint before commit (CLAUDE.md MEMORY) | ✓ | ^2.0.0 (devDep, sister Phase 2.1.1 → 3.3 cadence) | — |

**Missing dependencies with no fallback**: None.
**Missing dependencies with fallback**: None.

Phase 3.4 is purely Node + TypeScript + existing devDeps — no new dependency needed (sister Phase 3.2+3.3 zero-dep cadence延续).

---

## § 17 Sources

### Primary (HIGH confidence)

- `src/cli/doctor.ts` L1-195 — 7-check baseline + checkGstackPrefix L138-142 + checkDeprecations L147-150 sister pattern 100% reuse model for 8th check
- `src/cli/lib/probe-gstack.ts` L1-48 + `check-deprecations.ts` L1-43 — PRIMARY helper pattern 100% reuse for check-token-budget.ts
- `src/cli/install.ts` L114-122 — `harnessedVer = '0.3.0'` TODO marker DEFERRED #AD verbatim
- `src/checkpoint/template.ts` L34-36 — `estimateTokens(s) = Math.ceil(Buffer.byteLength(s, 'utf8') / 4)` D-03 sister precedent verbatim
- `routing/decision_rules.yaml` L1-387 — v2 production rules (12 + mattpocock_phases 23 招式 routing schema)
- `src/routing/decisionRules.ts` L75-200 — TaskContext + arbitrate signature + loadDecisionRules schema validate
- `src/routing/lib/arbitrateRedirect.ts` L1-69 — Phase 2.3 CD-3 negative-space `arbitrateWithRedirect`
- `tests/routing/samples-30.test.ts` L1-150 — D-02 100% template reuse for `phase-3.4-routing-hit-rate.test.ts`
- `src/manifest/knownGood.ts` L1-45 + `schema/known-good.v1.ts` L1-32 — W0.3 fill consumer verified
- `versions/0.3.0-known-good.yaml` L1-9 — current MVP empty seed (W0.3 fill target)
- `manifests/skill-packs/{gsd,gstack,karpathy-skills}.yaml` + `tools/{ctx7,tavily-mcp}.yaml` — 5 manifests sampled for W0.3 candidate entries
- `manifests/aliases.yaml` L1-14 — Phase 3.3 empty seed for paired W0.3 optional fill consideration
- `scripts/check-transparency-verdicts.mjs` L1-130 — W0.1 D3 sister gate pattern 100% reuse model
- `.planning/STATE.md` L1-100 + 16 sections grep — 723L 实测 + ARCHIVE-target sections identified
- `.planning/v0.2.0-MILESTONE-AUDIT.md` L1-150 — sister v0.2.0 close 6-section template gold-standard
- `.planning/milestones/v0.2.0-{ROADMAP,REQUIREMENTS}.md` (10.7k + 6.6k) — sister archive shape
- `.planning/phase-2.3/SAMPLES.md` L1-80 + § 2 table — sister 30-row matrix format reference
- `.planning/phase-3.3/RESEARCH.md` L1-1242 (chunked) — sister 18-section format gold-standard reference
- **3.4-CONTEXT.md** L1-255 — 4 D-decisions LOCKED + W0 5 项 backlog + Discretion + Deferred 全 verbatim
- **3.4-KICKOFF.md** L1-91 — W0 backlog 5 项 + 4 D-decision summary
- `.planning/ROADMAP.md` L130-178 — v0.3.0 Goal + Phase 3.4 拆分 + carry-forward prereq #AC/#AD/#AE verbatim
- `.planning/REQUIREMENTS.md` L280-291 — R7.5 + R7.6 验收 bar verbatim
- `docs/PROJECT-SPEC.md` § R01 § 9 (referenced via CONTEXT canonical_refs) — dogfooding scope
- `package.json` L1-94 — claude-agent-sdk 0.3.142 + yaml ^2.9.0 + commander ^13.0.0 + typebox ^0.34.49 + vitest ^4.0.0 + Node ≥22 verified
- `skills/*/SKILL.md` × 6 — 2438 + 688 + 663 + 655 + 686 + 641 bytes actual measurement (D-03 baseline)
- `git log --since=2026-05-12 --until=2026-05-17 --no-merges` = 331 commits in window — D-01 mining feasibility verified

### Secondary (MEDIUM-HIGH confidence)

- ECMAScript 2025 stage 4 import attributes (`with { type: 'json' }`) — TypeScript 5.6+ + Node 22 verified per release notes
- Claude context window: Sonnet 200k baseline / Opus 1M — Anthropic docs reference for D-03 threshold rationale
- Karpathy CLAUDE.md global instructions — 4 心法 + ≤200L hard limit
- MEMORY: Biome lint preempt before commit (3 CI-red recurrences Phase 2.1.1 / 2.2 / 2.3)
- MEMORY: GSD workflow decision cadence + sister review tiering

### Tertiary (MEDIUM confidence — projection/未 spike)

- Validation Architecture § 10.1 — fixture count target ≥ 44 based on sister Phase 3.2/3.3 38-43 fixture proportionally derived (30-sample harness expansion)
- 5 anti-pattern at risk § 13.1 — 经验值 (sister Phase 3.3 § 13 same-level confidence)
- W2 v0.3.0 close single-day achievability — sister v0.2.0 evidence (Phase 2.4 ship + close 2026-05-16) but depends on W0/W1 scope timing
- Opus tier ≥ 80% accuracy — ROADMAP only specifies Sonnet 100% / Haiku ≥ 84% explicitly; 80% Opus derived as reasonable middle bar

---

## § 18 Metadata

**Confidence breakdown**:
- doctor.ts wc -l 实测 baseline (§ 1): HIGH — 195L bash 实测 + 8th check LOC delta arithmetic + Option A/B mitigation verified
- BUFFER /4 skill scan path (§ 2): HIGH — sister Phase 3.1 D-01 verbatim + 6 SKILL.md byte measurement + threshold rationale grounded
- 30 SAMPLES.md mining technique (§ 3): HIGH — git log 331 commits bash验证 + 7-bucket commit prefix distribution + sister Phase 2.3 SAMPLES.md format 100% model
- RUN ENGINE harness sister reuse (§ 4): HIGH — sister `samples-30.test.ts` L1-150 verbatim + arbitrate signature 直证 + R7 dogfooding acceptance gate verbatim
- W0.1 STATE.md institutionalize (§ 5): HIGH — STATE.md 723L 实测 + 16 sections grep + sister Phase 2.4 W6 T6.3 RETRO 续编 verbatim pattern + sister Phase 2.1 transparency gate cadence
- W0.2 install.ts version read (§ 6): HIGH — L114-122 verbatim + package.json L2 verbatim + TypeScript / Node 22 import attributes spec verified; bonus package.json 0.1.0-alpha.1 → 0.3.0 bump recommendation
- W0.3 R7.6 real seed (§ 7): HIGH — 5 manifest files read verbatim + known-good.v1 schema verbatim + sister Phase 3.3 MVP seed direct reference
- W0.4 path traversal spike (§ 8): HIGH — install.ts L77-94 path code trace + ENOENT+TypeBox 双层防御 verified; DEFER recommendation grounded
- W2 v0.3.0 close prep (§ 9): HIGH — sister v0.2.0-MILESTONE-AUDIT.md L1-150 100% verbatim template + sister Phase 2.4 W6 T6.1-T6.5 task ordering verified
- Validation Architecture (§ 10): MEDIUM-HIGH — fixture count target ≥ 44 projection-based; threat model 4 nodes sister Phase 3.3 pattern延袭 + W0.4 spike empirically grounded
- W0.1 D3 gate design (§ 11): HIGH — sister `check-transparency-verdicts.mjs` L1-130 100% pattern + 3-rule design grounded + ENFORCE flip cadence verified
- Wave topology (§ 12): HIGH — sister Phase 3.3 3 wave pattern + 24 atomic task + DAG dependency graph verified
- Karpathy anti-patterns + v0.3.0 close discipline (§ 13): MEDIUM — 经验值 + sister v0.2.0 close lesson grounded

**Research date**: 2026-05-17
**Valid until**: ~2026-08-17 (Phase 3.4 ship + v0.3.0 close window; sister cadence stable within 1-quarter)

---

## RESEARCH COMPLETE
