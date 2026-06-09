# Phase 3.3: aliases.yaml + deprecation marker + known-good 版本组合 — Pattern Map

> **Mapped**: 2026-05-17
> **Mapper**: gsd-pattern-mapper (Claude Opus 4.7, 1M ctx)
> **Files analyzed**: 17 NEW / MODIFY targets (per CONTEXT.md 4 D-decisions + W0 backlog 3 项)
> **Analogs found**: 17 / 17 (100% — sister Phase 3.2 W1 probe-gstack + config.v1/governance.v1 + Phase 2.2 manifest/schema/spec.ts + Phase 3.1 state.ts 全覆盖)
> **Style**: 沿袭 Phase 3.2 PATTERNS.md (408L 17 targets 100% analog hit; § 1 table + § 2 concrete excerpts + § 3 cross-cutting + § 4 reuse summary + § 5 path dependency)

---

## § 1 NEW / MODIFY Targets → Existing Analog Mapping

| # | Target | Role | Data Flow | Closest Analog | Reuse % | Copy vs Adapt |
|---|--------|------|-----------|----------------|---------|---------------|
| **NEW infra (W1)** ||||||||
| 1 | `src/cli/lib/check-deprecations.ts` (~30-40L PRIMARY) | utility (helper) | request-response (read aliases.yaml → list deprecated map → `DeprecationEntry[]`) | `src/cli/lib/probe-gstack.ts` L1-49 (Phase 3.2 W1 T1.4 sister PRIMARY helper extract pattern + Karpathy ≤50L 守门 keep doctor.ts ≤200L) | **~90%** | **COPY** probe-gstack.ts header comment (Phase 3.2 W1 T1.4 sister-share extract rationale + Karpathy ≤50L hard limit守门) + interface `DeprecationEntry` shape sister `ProbeResult` (`status` enum + `detail` + optional `fix`); **ADAPT** core logic: replace `spawnSync(which/where)` with `readFileSync` + `yaml.parse` + branchOnSchemaVersion → walk `aliases:` record → emit list of `{old, new, since, date, reason}` entries; return `DeprecationEntry[]` (empty array if no aliases.yaml OR empty `aliases:` record → doctor 7th check `status: 'pass'`); fail-soft on file missing (sister `state.ts L24-29` try/catch null return); zero spawnSync (this helper is pure file read) |
| 2 | `src/manifest/aliases.ts` (~30-40L) | service (manifest loader + resolver) | request-response (yamlPath → `loadAliases()` returns map; `resolveAlias(name)` returns `string \| null`) | `src/checkpoint/state.ts` L23-41 `readCurrentWorkflow` (read JSON → branchOnSchemaVersion → Value.Check → fail-soft null) + yaml.parse (sister `src/workflow/loadPhases.ts` L23-30) | **~70%** | **COPY** state.ts L23-41 read 模式直接 analog (read file → try yaml.parse → branchOnSchemaVersion → v1 Value.Check → null on fail); **ADAPT** to yaml.load (sister loadPhases.ts) instead of JSON.parse; expose 2 fns: (a) `loadAliases(): Promise<AliasesV1Type \| null>` lazy 1-read no cache (Karpathy YAGNI), (b) `resolveAlias(name: string): Promise<string \| null>` thin wrap returns `aliases.aliases[name]?.redirect ?? null` for install.ts to use as `name = await resolveAlias(name) ?? name`; Karpathy hard limit ≤40L |
| 3 | `src/manifest/knownGood.ts` (~40-45L) | service (version lock loader) | request-response (version → `loadKnownGood(v)` returns lock; `getPinnedVersion(name, v)` returns pinned ver string) | 同 #2 `src/checkpoint/state.ts` L23-41 read 模式 + sister Phase 1.X `src/manifest/validate.ts` per-file load 范式 | **~65%** | **COPY** state.ts L23-41 fail-soft read + branchOnSchemaVersion → Value.Check;**ADAPT** path构造 `versions/${harnessedVer}-known-good.yaml` (sister `manifests/tools/${name}.yaml` install.ts L66 path 范式); expose 2 fns: (a) `loadKnownGood(harnessedVer: string)` → returns `KnownGoodV1Type \| null`; (b) `getPinnedVersion(upstreamName: string, harnessedVer: string)` → thin lookup `.upstreams.find(u => u.name === upstreamName)?.version ?? null`; CONTEXT Claude's Discretion: planner 决 lazy boot-time vs pre-resolution — 推荐 lazy (Karpathy YAGNI, only pay cost when --known-good detected per install.ts options L92-99 + L100); Karpathy hard limit ≤45L |
| 4 | `src/manifest/schema/aliases.v1.ts` (~30-40L) | schema (TypeBox RICH) | declarative | `src/workflow/schema/governance.ts` (Phase 3.2 W1 T1.3, 10th surface; TypeBox `Type.Object` strict + `Type.Optional` + ISO-date `pattern` Phase 3.2 W2 Rule 1 fix `format: 'date-time'` 不用) + `src/manifest/schema/spec.ts` L41-48 `Verify` sister manifest/schema/ colocation precedent | **~95%** | **COPY** governance.ts L11-33 TypeBox shape direct analog (import `Static, Type` + import SCHEMA_VERSIONS + `Type.Object({...}, { additionalProperties: false })` + `Static<typeof>` export); **ADAPT** field set per D-01 RICH lock + CONTEXT specifics L242-251: nested `AliasEntryV1Schema` (`redirect` + `reason` + `since_version` strict semver pattern + `deprecation_date` ISO-date pattern + `removal_date` optional ISO-date) + outer `AliasesV1Schema` Type.Object with `schemaVersion: Type.Literal(SCHEMA_VERSIONS.aliases)` + `aliases: Type.Record(Type.String({ minLength: 1 }), AliasEntryV1Schema)`; **ISO-date Phase 3.2 W2 Rule 1 lesson 锁**: 用 `pattern: '^\\d{4}-\\d{2}-\\d{2}$'` 不用 `format: 'date'` (FormatRegistry 未注册); Karpathy hard limit ≤40L; **Colocation**: manifest-domain schema → `src/manifest/schema/` (sister spec.ts/metadata.ts), NOT `src/workflow/schema/` (sister Phase 3.2 W0.3 doc § "Path divergence" colocation rule — schemas live with primary consumers; primary consumer is `src/manifest/aliases.ts` + `src/cli/install.ts`) |
| 5 | `src/manifest/schema/known-good.v1.ts` (~40L) | schema (TypeBox YAML manifest) | declarative | 同 #4 `src/workflow/schema/governance.ts` Phase 3.2 W1 T1.3 + `src/manifest/schema/spec.ts` L177-200 outer `SpecSchema` shape | **~92%** | **COPY** governance.ts/config.ts TypeBox shape + spec.ts strict pattern;**ADAPT** field set per D-03 lock + CONTEXT specifics L253-264: outer `KnownGoodV1Schema` Type.Object with `schemaVersion: Type.Literal(SCHEMA_VERSIONS.knownGood)` + `harnessed_version: Type.String({ pattern: '^\\d+\\.\\d+\\.\\d+$' })` strict semver + `e2e_verified_at: Type.String({ pattern: '^\\d{4}-\\d{2}-\\d{2}' })` ISO date prefix-only (allows datetime suffix) + `upstreams: Type.Array(Type.Object({ name: Type.String({minLength:1}), version: Type.String({minLength:1}), install_method: Type.String({minLength:1}) }))`; **install_method 字符串而非 enum**: 因 sister Phase 2.X 6 install method 可能继续扩 (Phase 2.4 cc-hook-add 第 7 method), 用宽 string + Phase 2.X spec.ts L26-31 + L110-117 已有 InstallType union 作 doc reference 不强 link (Karpathy YAGNI 防 schema drift 加耦); Karpathy hard limit ≤45L; **Colocation**: manifest-domain schema → `src/manifest/schema/` (sister #4) |
| **NEW config / seed (W1)** ||||||||
| 6 | `manifests/aliases.yaml` (NEW empty seed ~10L) | config (DSL) | declarative | `manifests/skill-packs/gstack.yaml` (L1-2 `yaml-language-server` schema comment + Phase 2.X manifest YAML convention) + `manifests/tools/ctx7.yaml` sister manifest yaml shape | **~70%** | **COPY** L1 `# yaml-language-server: $schema=../schemas/aliases.v1.schema.json` comment line (sister gstack.yaml L1 path-adjusted depth);**ADAPT** Phase 3.3 MVP empty seed shape per CONTEXT D-01 sample L242-251: 顶层 `schemaVersion: harnessed.aliases.v1` + `aliases: {}` 空 record (Phase 3.4+ dogfood 时填充 actual deprecation entries — sister Phase 3.3 own MVP scope per KICKOFF § 5);planner 决: empty `aliases: {}` map vs include 1 commented-out sample entry (推 empty + sample 沿入 docs/ instead, sister manifests/ no-comments convention) |
| 7 | `versions/0.3.0-known-good.yaml` (NEW initial seed ~10-15L) | config (DSL) | declarative | 同 #6 `manifests/skill-packs/gstack.yaml` yaml convention + CONTEXT D-03 sample L253-264 | **~75%** | **COPY** sister yaml convention (顶层 schemaVersion line + indent 2-space, sister manifests/ flat dir 平级 — versions/ 是新顶层 dir sister `manifests/`);**ADAPT** Phase 3.3 MVP seed per CONTEXT Claude's Discretion #4 hint: `schemaVersion: harnessed.known-good.v1` + `harnessed_version: 0.3.0` + `e2e_verified_at: '2026-05-17'` + `upstreams: []` (空 array, Phase 3.4 dogfood 时填 actual upstream pinned 3-5 entries); **planner 决**: empty upstreams `[]` + e2e_verified_at: '2026-05-17' MVP OR ship 1 known pinned entry (e.g. `claude-agent-sdk@0.3.142` Phase 2.2 已 lock-known-good) — 推 empty array MVP per KICKOFF § 5 "infra + seed empty/初版" |
| **MODIFY wire-in (W1)** ||||||||
| 8 | `src/cli/doctor.ts` 加 7th check `checkDeprecations` (~5-8L delta) | dispatch | declarative (register + dispatch) | 现 `src/cli/doctor.ts` L136-142 `checkGstackPrefix` 6th check Phase 3.2 W1 T1.5 + L150-157 results array 范式 + L147 description string ext | **~98%** | **COPY-additive** 直接 sister `checkGstackPrefix` L136-142 范式 1:1 replicate: `async function checkDeprecations(): Promise<CheckResult> { const { listDeprecations } = await import('./lib/check-deprecations.js'); const r = await listDeprecations(); return { name: 'deprecated manifests', status: r.length > 0 ? 'warn' : 'pass', message: r.length > 0 ? \`\${r.length} deprecated: \${r.map(d => d.summary).join('; ')}\` : 'no deprecated manifests', fix: r.length > 0 ? 'review manifests/aliases.yaml; plan migration to redirect target before removal_date' : undefined } }`; **ADD** L156 后加 `await checkDeprecations()` 进 results array; doctor.ts L147 description 串 加 'deprecations' → 'Preflight checks (Node / MCP scope / jq / Win bash / origin URL / gstack prefix / deprecations)'; **Karpathy 守门**: 7th check 主 logic 全在 helper (check-deprecations.ts ≤40L), doctor.ts delta ≤8L → 186→~193L 仍 Karpathy clean (sister Phase 3.2 6th check 186L baseline 仍 ≤200 hard limit, 不需 further extract); **planner 决** warning aggregation format: CONTEXT Claude's Discretion #3 推 table (sister Phase 2.4 doctor `--json` checks array 整体 output) — recommend single-line summary in human-readable + full structured `deprecations: DeprecationEntry[]` in `--json` mode (sister doctor.ts L160-167 dual output) |
| 9 | `src/cli/install.ts` 加 resolveAlias inject + `--known-good` flag (~6-10L delta) | CLI controller | request-response (commander option + pre-manifest-lookup wrap) | 现 `src/cli/install.ts` L46-65 commander register + L66-83 manifest lookup 范式 + L92-99 InstallOpts 范式 | **~85%** | **MINIMAL ADD ~6-10L**: (a) L51 后加 `.option('--known-good', 'use pinned upstream version from versions/<harnessed-ver>-known-good.yaml')` commander option (sister L52-55 `--dry-run`/`--system`/`--non-interactive` 4 options pattern); (b) L66 前加 `name = (await import('../manifest/aliases.js')).resolveAlias(name).then(r => r ?? name)` 1 行 (D-02 DOCTOR-ONLY-WARN locked — no console.warn here, sister Karpathy surgical + R7.5 验收"install 通过"语义对齐); **planner 决** install path resolveAlias 注入 location: CONTEXT Claude's Discretion #2 推 pre-manifest-lookup (predictable + 1 line) — recommend BEFORE L66 manifestPath construction (sister 1-line surgical edit); (c) `--known-good` consume: 在 L92-99 InstallOpts 后, 若 `raw.knownGood === true` → `import('../manifest/knownGood.js').getPinnedVersion(name, currentHarnessedVer)` → override `v.manifest.spec.install.npm_version` field (only npm-cli path; sister L107-110 version detection 反推 write path); Karpathy hard limit: install.ts 117L → ~127L (仍 ≤200 hard limit clean) |
| 10 | `src/types/schemaVersion.ts` 加 12th + 13th surface (~4-5L delta) | schema registry | declarative | 现 L40-51 SCHEMA_VERSIONS const 11 entry (Phase 3.2 W1 T1.1 加 config + governance 9th + 10th 后) + L55-66 SchemaVersionLiteral Union 11 entry + L11-26 11-surface JSDoc table | **~98%** | **COPY-additive** sister Phase 3.2 W1 T1.1 double-add 9th + 10th 范式直接 analog (PATTERNS.md sister 12+13 双加 sister 9+10 双加 cadence): L40-51 SCHEMA_VERSIONS const 加 `aliases: 'harnessed.aliases.v1'` + `knownGood: 'harnessed.known-good.v1'` 2 entry → 13 total; L55-66 SchemaVersionLiteral Union 加 2 Type.Literal entries → 13 total; L11-26 JSDoc table 加 2 行 "- aliases: manifests/aliases.yaml (upstream rename redirect) ← Phase 3.3 W1 T1.1 ADD (12th surface, D-01 RICH)" + "- known-good: versions/<harnessed-ver>-known-good.yaml (upstream version lock) ← Phase 3.3 W1 T1.1 ADD (13th surface, D-03 YAML manifest)"; **沿袭 CD-5** 单一兼容门 discipline + B-32 grep 验收 "≥ 11 → ≥ 13 `harnessed.\w+.v1` references in src/types/schemaVersion.ts" |
| **MODIFY W0 backlog (W0)** ||||||||
| 11 | `.planning/STATE.md` W0.1 删 L4 frontmatter Status: + L5 最后更新 (D-04 COLLAPSE) | docs | declarative | 现 `.planning/STATE.md` L4-5 frontmatter `> Status: ... > 最后更新：...` 5-recurrence dual-SSOT pattern + L21-25 "当前位置"块 single SSOT target | **~95%** | **MINIMAL DELETE** 2 行 (L4 整行 `> Status: ...` + L5 整行 `> 最后更新：...`) per D-04 COLLAPSE locked; **保留** L21-25 "当前位置"块 5 line items 作 single SSOT (含 "Phase X.Y SHIPPED" markers — freshness gate 12 节扩 scope target); **Acceptance**: `! grep -q "^> Status:" .planning/STATE.md` exit 0 + `grep -q "\*\*Phase 3\.2 SHIPPED\*\*" .planning/STATE.md` exit 0; **Sister 5-recurrence terminus 记录** in commit msg + L21 当前位置块 1 line note "(D-04 COLLAPSE 5-recurrence pattern terminus — frontmatter dual-SSOT 删, 当前位置块 single SSOT)"; **planner 决** dashboard.mjs parse impact: CONTEXT Claude's Discretion #5 推 spike 1h Wave 0 评估 (sister T4 dashboard observable); 若 dashboard 当前 parse "当前位置"块 行为 doesn't depend on L4 Status: 行 → safe COLLAPSE |
| 12 | `scripts/check-transparency-verdicts.mjs` W0.1 扩 STATE_POSITION_RE (~10L delta) | CI gate | batch (regex + check) | 现 `scripts/check-transparency-verdicts.mjs` L20 `STATUS_MARKER` + L25 `FRONT_MATTER_DOCS` + L53-92 `checkFreshness` function + L29 `STATE_LATEST_SUBPHASE_RE` (Phase 2.4 H2 fix 已加) | **~80%** | **COPY** existing freshness gate scaffold (Phase 2.2 T0.4 + Phase 2.4 H2 fix sister) + Phase 2.4 H2 sister `matchAll` + `last()` 模式;**ADAPT** add `STATE_POSITION_RE = /\*\*Phase [1-9]\.[0-9]+ SHIPPED\*\*/m` 新 regex 顶部 declare; modify `checkFreshness` 的 STATE.md branch 分支 (L57 loop within FRONT_MATTER_DOCS) — when file is `.planning/STATE.md`: skip first-50-lines STATUS_MARKER check (因 L4 Status 已 D-04 删) AND instead use `STATE_POSITION_RE.test(fullContent)` (扫全文 not first 50 lines, sister CONTEXT D-04 hint "至少 1 个 matches latest milestone subphase"); README.md + PROJECT-SPEC.md 仍走 existing STATUS_MARKER path (no behavior change); **OR-fallback logic**: 兼容期间 (W0.1 commit 后 README.md + PROJECT-SPEC.md 仍 dual-SSOT) → behavior: STATUS_MARKER OR STATE_POSITION_RE 任一 satisfy ↑ exit 0; sister Phase 2.4 H2 1-line bug fix 范式 + Phase 2.2 W2 T2.0 加 STATE.md 到 FRONT_MATTER_DOCS 范式;**planner 决** OR-fallback vs strict per-file path branch (推 per-file path: cleaner + sister Phase 2.4 H2 explicit branch precedent) |
| 13 | `tests/scripts/dashboard-sse.test.ts` W0.2 4 cell fix random port + retry (~20-30L delta) | unit test | request-response (mock http + assert SSE) | 现 `tests/scripts/dashboard-sse.test.ts` L8-13 imports + L18 `const PORT = 47180` hard-coded + L84-107 `beforeAll` setup (port probe → spawn dashboard) + L24-44 `httpGet` helper + L46-65 `sseConnect` helper + sister Node `net.createServer({ port: 0 })` Node built-in pattern (RESEARCH § standard ephemeral-port idiom) | **~50%** | **MINIMAL ADD** ~20-30L 沿袭 W0.2 root-cause fix path: (a) L18 改 `const PORT` from hard-coded `47180` → `let PORT: number` (mutable);(b) `beforeAll` (L84-107) 顶部加 `PORT = await getRandomPort()` helper inline call (sister Node `net.createServer({ port: 0 }, () => { /* listen → server.address().port → server.close() */ })` 5-line wrap, zero npm dep); (c) `spawn(process.execPath, [DASHBOARD, '--no-open', '--port', String(PORT)], ...)` (要求 dashboard.mjs 支持 `--port` flag, sister Phase 2.4 W3 dashboard.mjs check exists OR planner 加 ~3L `--port` flag); (d) `httpGet` + `sseConnect` close over PORT (因 mutable `let`); (e) retry loop in `waitFor` L67-79 加 max retries (sister 3-retry + 200ms backoff, sister Phase 2.4 W6 ralph-loop sentinel retry pattern); CONTEXT Claude's Discretion #6 fix path: 推 (a) random ephemeral port + retry sister Node best practice (RESEARCH § 8); **planner 决** dashboard.mjs `--port` flag 加 OR 用 env var `DASHBOARD_PORT=<random>` (test 已 hint env var, L3 comment); 推 env var (sister L3 comment 已 hint, ~1L delta vs `--port` flag 多 5L commander option); **Acceptance**: `corepack pnpm test -- --run tests/scripts/dashboard-sse.test.ts 2>&1 \| tail -3` 4/4 pass + skipIf bail eliminated |
| 14 | `.planning/phase-3.3/W0.3-schema-decision.md` NEW (~50-60L) | docs | declarative | `.planning/phase-3.2/W0.3-schema-decision.md` (Phase 3.2 W0.3 sister 76L 9th+10th double-add decision doc, planner-revision iter 1 W-03 path divergence section included) | **~90%** | **COPY** Phase 3.2 W0.3 sister 完整 doc 结构 (Decision + Rationale 4 子 + Path divergence section + Schema specs × 2 + Implementation order + Verification 5 节); **ADAPT** field substitutions: surface 9→12 + 10→13; surface keys `config + governance` → `aliases + knownGood`; path divergence section更新 — 本 phase WORKFLOW-domain → MANIFEST-domain reclassification: Phase 3.2 sister 改 `src/checkpoint/schema/` → `src/workflow/schema/` (workflow consumer); 本 phase aliases.v1 + known-good.v1 primary consumers 是 `src/manifest/aliases.ts` + `src/manifest/knownGood.ts` + `src/cli/install.ts` → place at `src/manifest/schema/` (sister `src/manifest/schema/spec.ts` 历史 colocation); Karpathy colocation rule consistent with sister Phase 3.2 W0.3 § "Path divergence" rationale; **Rationale 4 子 sister parallel**: (a) Karpathy single-responsibility — aliases manifest redirect 是独立 lifecycle不混 spec.ts; (b) yaml convention isolation — 2 file 独立 zero coupling; (c) sister Phase 3.2 W1 双 +2 precedent (9+10 → 12+13 sister cadence); (d) sister manifest/schema/ 5-file 模式延续 (spec.ts + metadata.ts + types.ts + index.ts + installMethods/) → 加 2 → 7-file natural ext |
| **NEW tests (W1+W2)** ||||||||
| 15 | `tests/cli/check-deprecations.test.ts` (~50L, 5 fixtures) | unit test | request-response | `tests/cli/doctor-fixtures.test.ts` (Phase 3.2 W1 sister 6 check fixtures pattern) + `tests/cli/doctor.test.ts` L6-8 三件套 mock (Phase 2.4 W1 baseline) | **~85%** | **COPY** doctor.test.ts L6-8 vi.mock 三件套 (`node:fs/promises` + `node:fs` + 可选 child_process) + sister Phase 3.2 W1 doctor-fixtures.test.ts 5-fixture per-check 范式;**ADAPT** 5 fixtures: cell 1 — aliases.yaml missing → `listDeprecations()` returns `[]` + doctor 7th check status='pass';cell 2 — aliases.yaml empty `aliases: {}` → returns `[]` + status='pass';cell 3 — 1 deprecation entry → returns 1-element array + status='warn' + message contains old/new name;cell 4 — 3 deprecation entries → returns 3-element array + aggregation format verify (table OR list per planner D-02);cell 5 — corrupt yaml (schema drift) → null fail-soft + status='pass' (sister Phase 3.1 state.test.ts L33-35 try/catch fail-soft 模式 — doctor 不 throw on corrupt aliases) |
| 16 | `tests/manifest/aliases.test.ts` (~50L, 5 fixtures) | unit test | request-response (mock fs + assert state) | `tests/checkpoint/state.test.ts` (Phase 3.1 W2 sister vi.mock('node:fs/promises') + Value.Check assert + branchOnSchemaVersion 4 fixture pattern) | **~85%** | **COPY** state.test.ts vi.mock + readFile fixture + Value.Check assert 模式 (sister Phase 3.1 W2 直接 analog);**ADAPT** 5 fixtures: cell 1 — `loadAliases()` file missing → null fail-soft;cell 2 — empty aliases → returns `{schemaVersion: ..., aliases: {}}` valid;cell 3 — 1-entry aliases → returns valid with `resolveAlias('old-name')` returns 'new-name';cell 4 — `resolveAlias` unknown name → returns null (caller `?? name` fallback);cell 5 — corrupt yaml OR schema drift → null fail-soft (sister state.ts L33-35 模式);**Karpathy 守门**: 不 mock yaml.parse (用真 yaml-lib + fixture string), 沿袭 manifest/validate.test.ts sister 范式 |
| 17 | `tests/manifest/knownGood.test.ts` (~50L, 5 fixtures) | unit test | request-response (mock fs + assert pinned version lookup) | 同 #16 `tests/checkpoint/state.test.ts` + sister `tests/manifest/validate.test.ts` per-field Value.Check 范式 | **~85%** | **COPY** state.test.ts vi.mock fixture 范式 + sister Phase 1.X validate.test.ts per-field Value.Check assert;**ADAPT** 5 fixtures: cell 1 — `loadKnownGood('0.3.0')` file missing → null fail-soft;cell 2 — empty `upstreams: []` → returns valid lock with empty array + `getPinnedVersion('any', '0.3.0')` returns null;cell 3 — 3-entry upstreams → returns valid + `getPinnedVersion('claude-agent-sdk', '0.3.0')` returns pinned version string;cell 4 — version not in lock → returns null (caller fallback to manifest default);cell 5 — schema drift (wrong harnessed_version semver) → null fail-soft + Value.Check fail branch; **planner 决** 是否 incl. install.ts `--known-good` flag integration cell (推 split 出 integration test `tests/integration/install-known-good.test.ts` Wave 2 add — 本 R1 unit-only scope sister W2 split) |

---

## § 2 Per-target Concrete Code Excerpts

### 2.1 `src/cli/lib/check-deprecations.ts` (NEW ≤40L) — analog: `src/cli/lib/probe-gstack.ts` L1-49 sister PRIMARY helper

**COPY probe-gstack.ts header comment + 3-tier status pattern + Karpathy ≤40L hard limit守门** (sister Phase 3.2 W1 T1.4 sister-share extract rationale):

```ts
// src/cli/lib/check-deprecations.ts — Phase 3.3 W1 T1.4 — D-02 DOCTOR-ONLY-WARN
// PRIMARY helper (sister Phase 3.2 W1 T1.4 probe-gstack.ts sister-share extract
// pattern for Karpathy ≤200L 守门 — keeps doctor.ts ≤200L). Lists deprecated
// manifests by reading manifests/aliases.yaml (D-01 RICH schema) + Value.Check
// → emits DeprecationEntry[] for doctor 7th check warning output. Karpathy hard
// limit ≤40L per sister probe-gstack ≤49L precedent.
import { readFile } from 'node:fs/promises'
import { loadAliases } from '../../manifest/aliases.js'

export interface DeprecationEntry {
  old_name: string
  redirect: string
  reason: string
  since_version: string
  deprecation_date: string
  removal_date?: string
  summary: string  // pre-formatted human-readable single-line
}

/** List all deprecated manifests by reading manifests/aliases.yaml. Returns
 *  empty array if file missing OR aliases record empty (doctor 7th check
 *  → status='pass'). Returns array of entries with pre-formatted summary
 *  for doctor warning aggregation (D-02 DOCTOR-ONLY-WARN locked). */
export async function listDeprecations(): Promise<DeprecationEntry[]> {
  const aliases = await loadAliases()  // fail-soft null if missing
  if (!aliases || Object.keys(aliases.aliases).length === 0) return []
  return Object.entries(aliases.aliases).map(([old_name, entry]) => ({
    old_name,
    redirect: entry.redirect,
    reason: entry.reason,
    since_version: entry.since_version,
    deprecation_date: entry.deprecation_date,
    ...(entry.removal_date ? { removal_date: entry.removal_date } : {}),
    summary: `'${old_name}' deprecated since ${entry.since_version} (${entry.deprecation_date}) → '${entry.redirect}' (${entry.reason})`,
  }))
}
```

### 2.2 `src/manifest/aliases.ts` (NEW ≤40L) — analog: `src/checkpoint/state.ts` L23-41 readCurrentWorkflow

**COPY state.ts L23-41 read 模式直接 analog** (fail-soft null on file/parse/schema fail):

```ts
// src/manifest/aliases.ts — Phase 3.3 W1 T1.5 — D-01 RICH consumer.
// Sister src/checkpoint/state.ts:23-41 (fail-soft read + branchOnSchemaVersion).
// Lazy 1-read (no cache — Karpathy YAGNI, only pay cost on doctor 7th check OR
// install path resolveAlias call). yaml.load via existing project yaml lib
// (sister src/workflow/loadPhases.ts L23-30 parseYaml convention).
import { readFile } from 'node:fs/promises'
import { parse as parseYaml } from 'yaml'
import { Value } from '@sinclair/typebox/value'
import { branchOnSchemaVersion } from '../types/schemaVersion.js'
import { AliasesV1, type AliasesV1Type } from './schema/aliases.v1.js'

const ALIASES_PATH = 'manifests/aliases.yaml'

export async function loadAliases(): Promise<AliasesV1Type | null> {
  let raw: string
  try { raw = await readFile(ALIASES_PATH, 'utf8') } catch { return null }
  let parsed: unknown
  try { parsed = parseYaml(raw) } catch { return null }
  const v = (parsed as { schemaVersion?: string }).schemaVersion ?? ''
  return branchOnSchemaVersion(v, {
    v1: () => (Value.Check(AliasesV1, parsed) ? (parsed as AliasesV1Type) : null),
    unknown: () => null,
  })
}

/** Resolve old manifest name → new redirect target. Returns null if no
 *  alias registered (caller `?? name` fallback per install.ts pre-lookup). */
export async function resolveAlias(name: string): Promise<string | null> {
  const aliases = await loadAliases()
  return aliases?.aliases[name]?.redirect ?? null
}
```

### 2.3 `src/manifest/knownGood.ts` (NEW ≤45L) — analog: 同 #2 state.ts read 模式

**COPY same fail-soft read pattern + path构造 sister install.ts L66 `manifests/tools/${name}.yaml` precedent**:

```ts
// src/manifest/knownGood.ts — Phase 3.3 W1 T1.6 — D-03 YAML manifest consumer.
// Sister src/manifest/aliases.ts (fail-soft read + branchOnSchemaVersion +
// yaml.load). Path: versions/<harnessed-ver>-known-good.yaml (sister
// manifests/tools/<name>.yaml install.ts L66 path 范式). Lazy read 仅 --known-
// good flag consume 时 trigger (Karpathy YAGNI per planner CONTEXT decision).
import { readFile } from 'node:fs/promises'
import { parse as parseYaml } from 'yaml'
import { Value } from '@sinclair/typebox/value'
import { branchOnSchemaVersion } from '../types/schemaVersion.js'
import { KnownGoodV1, type KnownGoodV1Type } from './schema/known-good.v1.js'

export async function loadKnownGood(harnessedVer: string): Promise<KnownGoodV1Type | null> {
  const path = `versions/${harnessedVer}-known-good.yaml`
  let raw: string
  try { raw = await readFile(path, 'utf8') } catch { return null }
  let parsed: unknown
  try { parsed = parseYaml(raw) } catch { return null }
  const v = (parsed as { schemaVersion?: string }).schemaVersion ?? ''
  return branchOnSchemaVersion(v, {
    v1: () => (Value.Check(KnownGoodV1, parsed) ? (parsed as KnownGoodV1Type) : null),
    unknown: () => null,
  })
}

/** Lookup pinned upstream version. Returns null if no lock OR upstream not
 *  in lock (caller falls back to manifest default per install.ts override). */
export async function getPinnedVersion(
  upstreamName: string,
  harnessedVer: string,
): Promise<string | null> {
  const lock = await loadKnownGood(harnessedVer)
  return lock?.upstreams.find((u) => u.name === upstreamName)?.version ?? null
}
```

### 2.4 `src/manifest/schema/aliases.v1.ts` (NEW ≤40L) — analog: `src/workflow/schema/governance.ts` Phase 3.2 W1 T1.3 (10th surface)

**COPY governance.ts TypeBox shape direct analog + ISO-date pattern Phase 3.2 W2 Rule 1 lesson 锁**:

```ts
// src/manifest/schema/aliases.v1.ts — Phase 3.3 W1 T1.2 (D-01 RICH 12th surface).
// Sister Phase 3.2 W1 T1.3 (governance.ts TypeBox shape direct analog).
// RICH schema rejected FLAT (失 metadata) + TIERED (Karpathy YAGNI violation).
// Manifest-domain colocation: src/manifest/schema/ (sister spec.ts + metadata.ts
// existing manifest-domain schemas). NOT src/workflow/schema/ (workflow-domain
// per sister Phase 3.2 W0.3 colocation rule). Path divergence from PATTERNS
// § 2.4 sketch documented in W0.3-schema-decision.md (Karpathy colocation).
// ISO-date `pattern` NOT `format: 'date'` (Phase 3.2 W2 Rule 1 lesson:
// FormatRegistry.Set not registered project-wide; `pattern` is zero-config
// equivalent + sister governance.ts vetoed_at pattern precedent).

import { type Static, Type } from '@sinclair/typebox'
import { SCHEMA_VERSIONS } from '../../types/schemaVersion.js'

export const AliasEntryV1 = Type.Object(
  {
    redirect: Type.String({ minLength: 1 }),
    reason: Type.String({ minLength: 1, maxLength: 500 }), // DOS cap sister governance.ts L21
    since_version: Type.String({ pattern: '^\\d+\\.\\d+\\.\\d+$' }), // semver strict
    deprecation_date: Type.String({ pattern: '^\\d{4}-\\d{2}-\\d{2}$' }), // ISO-date Phase 3.2 W2 Rule 1
    removal_date: Type.Optional(Type.String({ pattern: '^\\d{4}-\\d{2}-\\d{2}$' })), // optional long-tail window
  },
  { additionalProperties: false },
)

export const AliasesV1 = Type.Object(
  {
    schemaVersion: Type.Literal(SCHEMA_VERSIONS.aliases), // 'harnessed.aliases.v1'
    aliases: Type.Record(Type.String({ minLength: 1 }), AliasEntryV1),
  },
  { additionalProperties: false },
)

export type AliasEntryV1Type = Static<typeof AliasEntryV1>
export type AliasesV1Type = Static<typeof AliasesV1>
```

### 2.5 `src/manifest/schema/known-good.v1.ts` (NEW ≤45L) — analog: 同 #4 governance.ts + spec.ts outer Type.Object

**COPY same TypeBox shape + spec.ts L177-200 outer SpecSchema strict pattern**:

```ts
// src/manifest/schema/known-good.v1.ts — Phase 3.3 W1 T1.3 (D-03 YAML manifest 13th surface).
// Sister Phase 3.2 W1 T1.3 (governance.ts) + sister #4 aliases.v1.ts shape.
// YAML manifest rejected JSON (项目未用 npm-lock + yaml convention) + Embed-in-
// manifest (跨 manifest agg 难, R7.6 "harnessed 版本冻结一组" scope mismatch).
// Manifest-domain colocation: src/manifest/schema/. install_method 字符串非 enum
// (Karpathy YAGNI 防 schema drift 加耦 — Phase 2.X 6 install method 可能继续扩;
// sister spec.ts InstallType union 仅作 doc reference 不强 link).

import { type Static, Type } from '@sinclair/typebox'
import { SCHEMA_VERSIONS } from '../../types/schemaVersion.js'

export const KnownGoodUpstream = Type.Object(
  {
    name: Type.String({ minLength: 1 }),
    version: Type.String({ minLength: 1 }),
    install_method: Type.String({ minLength: 1 }), // npm-cli / mcp-stdio-add / etc per Phase 2.X
  },
  { additionalProperties: false },
)

export const KnownGoodV1 = Type.Object(
  {
    schemaVersion: Type.Literal(SCHEMA_VERSIONS.knownGood), // 'harnessed.known-good.v1'
    harnessed_version: Type.String({ pattern: '^\\d+\\.\\d+\\.\\d+$' }), // semver strict
    e2e_verified_at: Type.String({ pattern: '^\\d{4}-\\d{2}-\\d{2}' }), // ISO date prefix (allows datetime suffix)
    upstreams: Type.Array(KnownGoodUpstream),
  },
  { additionalProperties: false },
)

export type KnownGoodUpstreamType = Static<typeof KnownGoodUpstream>
export type KnownGoodV1Type = Static<typeof KnownGoodV1>
```

### 2.6 `src/cli/doctor.ts` MODIFY (加 7th check `checkDeprecations`) — analog: 现 L136-142 + L150-157 sister `checkGstackPrefix` Phase 3.2 W1 T1.5

**MINIMAL ADD ~6-8L 直接 sister `checkGstackPrefix` 1:1 replicate** (doctor.ts 186 → ~193L 仍 Karpathy clean):

```ts
// 现 L136-142 (checkGstackPrefix sister, Phase 3.2 W1 T1.5):
async function checkGstackPrefix(): Promise<CheckResult> {
  const { probeGstackPrefix } = await import('./lib/probe-gstack.js')
  const r = probeGstackPrefix()
  return { name: 'gstack prefix', status: r.status, message: r.detail, fix: r.fix }
}

// Phase 3.3 W1 ADD ~8L (7th check, D-02 DOCTOR-ONLY-WARN):
async function checkDeprecations(): Promise<CheckResult> {
  const { listDeprecations } = await import('./lib/check-deprecations.js')
  const r = await listDeprecations()
  if (r.length === 0) return { name: 'deprecated manifests', status: 'pass', message: 'no deprecated manifests' }
  return {
    name: 'deprecated manifests',
    status: 'warn',
    message: `${r.length} deprecated: ${r.map((d) => d.summary).join('; ')}`,
    fix: 'review manifests/aliases.yaml; plan migration to redirect target before removal_date',
  }
}

// 现 L150-157 (results array — ADD 1 行 push):
const results: CheckResult[] = [
  checkNodeVersion(),
  await checkMcpScope(),
  checkJq(),
  checkWinBash(),
  await checkOriginUrl(),
  await checkGstackPrefix(),
  await checkDeprecations(), // ← Phase 3.3 W1 ADD 7th check (D-02 DOCTOR-ONLY-WARN)
]
// description 串 L147 加 'deprecations' (e.g. 'Preflight checks (Node / MCP / jq / Win bash / origin / gstack / deprecations)')
```

### 2.7 `src/cli/install.ts` MODIFY (resolveAlias inject + `--known-good` flag) — analog: 现 L46-65 commander register + L66-83 manifest lookup

**MINIMAL ADD ~6-10L** (sister commander option pattern + Karpathy 1-line surgical pre-lookup):

```ts
// 现 L46-65 commander register (ADD 1 行 .option):
program
  .command('install <name>')
  .description('Install an upstream (dry-run by default — pass --apply to execute)')
  .option('--apply', 'execute the install (default: dry-run preview only)')
  .option('--dry-run', 'force dry-run (overrides --apply if both are set)')
  .option('--system', 'allow L4 system-wide install (e.g. global npm install)')
  .option('--non-interactive', 'skip all prompts (CI / scripts) — requires --apply or --dry-run')
  .option('--full-diff', 'expand diffs longer than 200 lines')
  .option('--no-color', 'disable ANSI colors (auto-detected when piped)')
  .option('--known-good', 'use pinned upstream version from versions/<harnessed-ver>-known-good.yaml') // ← Phase 3.3 W1 ADD
  .action(async (name: string, raw: RawOpts) => {
    // ... existing H1 pre-action flag gate L57-64 ...

    // Phase 3.3 W1 ADD ~1L — D-02 DOCTOR-ONLY-WARN: silent redirect (no console.warn)
    name = (await import('../manifest/aliases.js').then((m) => m.resolveAlias(name))) ?? name

    const manifestPath = resolve(process.cwd(), `manifests/tools/${name}.yaml`)
    // ... existing manifest lookup L66-83 ...

    // Phase 3.3 W1 ADD ~5L — D-03 YAML manifest --known-good override (only npm-cli path):
    if (raw.knownGood === true && v.manifest.spec.install.method === 'npm-cli') {
      const { getPinnedVersion } = await import('../manifest/knownGood.js')
      const pinned = await getPinnedVersion(name, currentHarnessedVer) // currentHarnessedVer from package.json or const
      if (pinned) (v.manifest.spec.install as { npm_version: string }).npm_version = pinned
    }
    // ... existing runInstall path L92-116 ...
  })
```

### 2.8 `src/types/schemaVersion.ts` MODIFY (12th + 13th surface) — analog: 现 L40-66 Phase 3.2 W1 T1.1 9th+10th double-add

**COPY-additive sister double-add 范式直接 analog** (CD-5 单一兼容门 discipline):

```ts
// 现 L40-51 SCHEMA_VERSIONS const, 11 entry (Phase 3.2 W1 T1.1 加 config + governance):
export const SCHEMA_VERSIONS = {
  routingSnapshot: 'harnessed.routing-snapshot.v1',
  handoffDoc: 'harnessed.handoff-doc.v1',
  phasesYaml: 'harnessed.phases-yaml.v1',
  manifestState: 'harnessed.manifest-state.v1',
  installerState: 'harnessed.installer-state.v1',
  routeDecisionLog: 'harnessed.route-decision-log.v1',
  checkpoint: 'harnessed.checkpoint.v1',
  currentWorkflow: 'harnessed.current-workflow.v1',  // 8th Phase 3.1
  config: 'harnessed.config.v1',                      // 9th Phase 3.2
  governance: 'harnessed.governance.v1',              // 10th Phase 3.2
  aliases: 'harnessed.aliases.v1',                    // ← Phase 3.3 W1 ADD 12th surface (D-01 RICH)
  knownGood: 'harnessed.known-good.v1',               // ← Phase 3.3 W1 ADD 13th surface (D-03 YAML manifest)
} as const

// 现 L55-66 SchemaVersionLiteral Union, 11 entry — ADD 2 entries:
export const SchemaVersionLiteral = Type.Union([
  // ... 11 existing ...
  Type.Literal(SCHEMA_VERSIONS.aliases),    // ← Phase 3.3 W1 ADD 12th
  Type.Literal(SCHEMA_VERSIONS.knownGood),  // ← Phase 3.3 W1 ADD 13th
])
// JSDoc table L11-26 加 2 行: aliases + knownGood (sister 11→13 double-add cadence)
```

### 2.9 `scripts/check-transparency-verdicts.mjs` W0.1 扩 STATE_POSITION_RE — analog: 现 L20 STATUS_MARKER + L29 STATE_LATEST_SUBPHASE_RE + L53-92 checkFreshness

**ADD ~10L per-file branch in checkFreshness** (sister Phase 2.4 H2 fix 1-line bug fix 范式 + per-file path branch):

```js
// 现 L20-29 顶部 regex constants — ADD 1 new regex per D-04:
const STATUS_MARKER = /^\s*>?\s*\*{0,2}(?:Status|状态)\*{0,2}\s*[:：]\s*(.+)$/m
// Phase 3.3 W0.1 ADD — D-04 COLLAPSE 5-recurrence terminus: STATE.md L4 frontmatter
// Status: 已删, 当前位置块 (L21-25) 5 line items 作 single SSOT. STATE_POSITION_RE
// 扫全文 (NOT first 50 lines like STATUS_MARKER) — sister Phase 2.4 H2 fix matchAll precedent.
const STATE_POSITION_RE = /\*\*Phase [1-9]\.[0-9]+ SHIPPED\*\*/m

// 现 L53-92 checkFreshness — ADD per-file branch:
function checkFreshness(violations) {
  const milestone = getLatestShippedToken()
  const subphase = getLatestShippedSubphase()
  if (!milestone && !subphase) return
  for (const file of FRONT_MATTER_DOCS) {
    let content   // ← rename head → content (扫全文 not first 50 lines for STATE.md)
    try {
      content = readFileSync(file, 'utf8')
    } catch {
      violations.push(`${file}:0  front-matter doc missing`)
      continue
    }
    // Phase 3.3 W0.1 ADD — per-file branch: STATE.md uses STATE_POSITION_RE
    // (full content scan); README.md + PROJECT-SPEC.md use STATUS_MARKER (first 50 lines).
    if (file === '.planning/STATE.md') {
      if (!STATE_POSITION_RE.test(content)) {
        violations.push(`${file}:1  missing **Phase X.Y SHIPPED** marker (D-04 COLLAPSE single SSOT)`)
      }
      continue  // STATE.md only validates POSITION marker — frontmatter Status: removed
    }
    // ... existing STATUS_MARKER + milestone + subphase logic 仅 README.md + PROJECT-SPEC.md ...
    const head = content.split(/\r?\n/).slice(0, 50).join('\n')
    const match = head.match(STATUS_MARKER)
    // ... 既有 logic 不动 ...
  }
}
```

### 2.10 `tests/scripts/dashboard-sse.test.ts` W0.2 fix random port + retry — analog: 现 L18 PORT hard-coded + L84-107 beforeAll

**MINIMAL ADD ~20L random ephemeral port + retry** (CONTEXT Claude's Discretion #6 fix path (a) recommended):

```ts
// 现 L18 hard-coded port → mutable + helper:
// const PORT = 47180  // ← DELETE
let PORT: number  // ← ADD mutable

// Phase 3.3 W0.2 ADD — helper to find random ephemeral port (Node native, zero npm dep):
async function getRandomPort(): Promise<number> {
  const { createServer } = await import('node:net')
  return new Promise((resolve) => {
    const server = createServer()
    server.listen(0, () => {
      const port = (server.address() as { port: number }).port
      server.close(() => resolve(port))
    })
  })
}

// 现 L84-107 beforeAll — ADD PORT init + env var pass:
beforeAll(async () => {
  PORT = await getRandomPort()  // ← Phase 3.3 W0.2 ADD ephemeral port (eliminates 47180 collision)
  // ... existing port probe (skip path removed — random port should never collide) ...
  const tmpRoot = await mkdtemp(join(tmpdir(), 'dash-sse-'))
  // ...
  const proc = spawn(process.execPath, [DASHBOARD, '--no-open'], {
    cwd: tmpRoot,
    stdio: 'ignore',
    detached: false,
    env: { ...process.env, DASHBOARD_PORT: String(PORT) },  // ← ADD env var (sister L3 comment hint)
  })
  // ...
  await waitFor(PORT)  // already PORT-aware (sister L106)
}, 15_000)

// Phase 3.3 W0.2 ADD — dashboard.mjs read DASHBOARD_PORT env var (~1L delta, sister Node env convention).
// In scripts/dashboard.mjs: const PORT = Number(process.env.DASHBOARD_PORT) || 47180  (preserves prod default)
```

---

## § 3 Cross-cutting Patterns (apply across all NEW files)

### 3.1 D-decision 守门 (4 decisions LOCKED, executor 防 sneak-in)

| ID | Locked Decision | Anti-pattern to Guard |
|----|------------------|------------------------|
| **D-01 RICH** | aliases.yaml RICH schema (含 reason + since_version + deprecation_date + removal_date?) | FLAT (`old: new` 简单 map) 失 metadata 不符 R7.5 显示提示 sneak-in; TIERED string-OR-object union Karpathy YAGNI 违反 sneak-in (CONTEXT deferred) |
| **D-02 DOCTOR-ONLY-WARN** | doctor 7th check 显 warning + install 静默重定向 (no console.warn) | INSTALL-WARN console output sneak-in (CI 噪声 + 重复警告); INSTALL-THROW + --force-deprecated flag sneak-in (太严苛, R7.5 验收"install 通过"语义冲突) |
| **D-03 YAML manifest known-good** | `versions/<harnessed-ver>-known-good.yaml` sister manifests/ yaml convention | JSON known-good (npm-lock style) sneak-in (项目未用 npm-lock + yaml convention sister); Embed-in-manifest yaml sneak-in (跨 manifest agg 难, R7.6 scope mismatch) |
| **D-04 COLLAPSE** | 删 STATE.md L4 frontmatter Status: + L5 最后更新; "当前位置"块 single SSOT | (a) EXTEND freshness gate scope 保 dual SSOT sneak-in (over-engineering, 不消除 root); (c) COLLAPSE INVERSE 删 "当前位置"块 sneak-in (损 human-readable + dashboard 可能 break) |

### 3.2 Karpathy hard limit ≤200L/file (B-06 + B-26)

**Source**: `src/routing/engine.ts` 200L (≤200 hard cap) + `src/cli/doctor.ts` 186L (Phase 3.2 W1 6th check 后, 仍 ≤200 hard limit)
**Apply to**:
- `src/cli/lib/check-deprecations.ts` ≤40L (PRIMARY helper sister probe-gstack.ts ≤49L precedent)
- `src/manifest/aliases.ts` ≤40L (sister state.ts read 模式紧凑)
- `src/manifest/knownGood.ts` ≤45L
- `src/manifest/schema/aliases.v1.ts` ≤40L
- `src/manifest/schema/known-good.v1.ts` ≤45L
- `src/cli/doctor.ts` 加 7th check 后 ~193L (仍 ≤200 hard limit Karpathy clean — 不需 further extract; sister Phase 3.2 W1 6th check 186L baseline 后仍 clean)
- `src/cli/install.ts` 117 → ~127L (仍 ≤200 hard limit clean)

### 3.3 Schema registration discipline (Phase 2.2 CD-5 + Phase 3.2 W1 sister double-add)

**Source**: `src/types/schemaVersion.ts` L40-66 (SCHEMA_VERSIONS const + SchemaVersionLiteral Union + branchOnSchemaVersion helper, 11 surface post-Phase-3.2)
**Apply to**: aliases.v1 schema (#4) + known-good.v1 schema (#5) + aliases.ts consumer (#2) + knownGood.ts consumer (#3) + check-deprecations.ts indirect consumer via aliases.ts (#1)
**Rule**: 新 schema 必 (a) 注册到 SCHEMA_VERSIONS, (b) 加 Type.Literal 到 SchemaVersionLiteral Union, (c) 所有 consume 走 `branchOnSchemaVersion<T>(v, { v1: ..., unknown: ... })` (不裸 string 比对); Wave 验收 `grep -cE "harnessed\.\w+\.v1" src/types/schemaVersion.ts` ≥ 13 (Phase 3.2 baseline 11 + 本 phase +2) + `grep -r "branchOnSchemaVersion" src/ | wc -l` ≥ 6 (Phase 3.2 baseline 4 + aliases.ts + knownGood.ts consumers)

### 3.4 TypeBox + Value.Check runtime validate (Phase 2.2 loadPhases sister + Phase 3.1 state.ts read 范式)

**Source**: `src/checkpoint/state.ts` L23-41 readCurrentWorkflow (read JSON → branchOnSchemaVersion → Value.Check → fail-soft null)
**Apply to**: aliases.ts load (#2) + knownGood.ts load (#3) + 所有 schema v1 file (#4, #5)
**Rule**: read file → try/catch → parseYaml try/catch → `branchOnSchemaVersion` → `Value.Check(Schema, parsed)` → false → null fail-soft (state.ts L33-35 模式); 不抛 unless self-validate write 前 (sister loadPhases write path L23-30); doctor 7th check fail-soft means "no aliases.yaml" 等于 "no deprecations" (status='pass')

### 3.5 TypeBox ISO-date `pattern` NOT `format: 'date-time'` (Phase 3.2 W2 Rule 1 lesson)

**Source**: `src/workflow/schema/governance.ts` L22-29 (vetoed_at uses `pattern: '^\\d{4}-\\d{2}-\\d{2}T...'` ISO-8601 regex, NOT `Type.String({ format: 'date-time' })`)
**Apply to**: aliases.v1 deprecation_date + removal_date (#4) + known-good.v1 e2e_verified_at (#5)
**Rule**: 用 `pattern: '^\\d{4}-\\d{2}-\\d{2}$'` for date-only OR `pattern: '^\\d{4}-\\d{2}-\\d{2}'` for date-prefix-allows-suffix (per #5 e2e_verified_at allows datetime suffix), 不用 `format: 'date'` / `format: 'date-time'` — 因 TypeBox FormatRegistry.Set 未注册项目级, `pattern` 是 zero-config equivalent (sister governance.ts L22 注释精读 lesson 锁)

### 3.6 Sister manifest/schema/ colocation rule (Karpathy single-responsibility per consumer)

**Source**: sister Phase 3.2 W0.3 § "Path divergence" rule (schemas live with primary consumers; workflow-domain → workflow/schema/, manifest-domain → manifest/schema/)
**Apply to**: aliases.v1.ts (#4) + known-good.v1.ts (#5) → `src/manifest/schema/` NOT `src/workflow/schema/` (primary consumers `src/manifest/aliases.ts` + `src/manifest/knownGood.ts` + `src/cli/install.ts` all in manifest/cli domain)
**Sister precedent**: `src/manifest/schema/spec.ts` + `metadata.ts` + `types.ts` + `index.ts` + `installMethods/` (Phase 1.X-2.X 5-file manifest-domain schema colocation pattern) → 加 2 → 7-file natural ext; sister W0.3-schema-decision.md Phase 3.3 own doc (#14) 应 explicit document path divergence section 同 Phase 3.2 W0.3 sister cadence

### 3.7 W0 absorb cadence 5-phase 连续 → 本 phase 6-phase mark

**Source**: Phase 2.3 + 2.4 + 3.1 + 3.2 W0 4-phase 连续 "deferred → next phase W0 一次根治" cadence
**Apply to**: 本 phase 3.3 W0.1 + W0.2 + W0.3 三件套绝对优先 Wave 0 ship
**Rule**: W0 first (CI green prereq) before W1 NEW infra (#1-#7) + W1 wire-in (#8-#10);W0.1 (D-04 COLLAPSE STATE single-SSOT 5-recurrence terminus) + W0.2 (Phase 3.2 deferred #2 dashboard-sse 4 cell flaky 一次根治) + W0.3 (schemaVersion 12+13 surface decision doc Phase 3.3 own prereq) all 3 ship 前于 W1 infra; sister Phase 3.2 4-phase cadence → 本 phase 5-phase mark = sister continuity

### 3.8 biome preempt before commit (MEMORY 全局 rule)

**Source**: `~/.claude/projects/D--GitCode-harnessed/memory/feedback_biome-preempt.md` (Phase 2.1.1 / 2.2 / 2.3 3 次 CI-red recurrences)
**Apply to**: ALL NEW .ts files (check-deprecations / aliases / knownGood / aliases.v1 / known-good.v1 / 3 test files)
**Rule**: 每次 TS/JS commit 前 local 跑 `pnpm exec biome check --write` (sister Win bash flavor compat — 4th CI-red recurrence forbidden)

### 3.9 CLI exit code map (Phase 2.2 B-10) + 3-tier status (Phase 2.4 W1 B-06)

**Source**: `src/cli/doctor.ts` L20-25 CheckResult interface (pass/warn/fail) + L150-182 dispatch + warn ≠ fail exit policy
**Apply to**: doctor.ts 7th check (#8) 沿袭 pass/warn/fail 3-tier + warn ≠ fail exit policy (B-06) — `checkDeprecations` returns 'warn' if deprecations present (not 'fail' — D-02 DOCTOR-ONLY-WARN locked, exit 0 not 1)

---

## § 4 Reuse Pct Summary

| Category | Reuse % | Detail |
|----------|---------|--------|
| `src/cli/lib/check-deprecations.ts` NEW | **~90%** | probe-gstack.ts sister PRIMARY helper extract 范式 + header rationale 直接 analog |
| `src/manifest/aliases.ts` NEW | **~70%** | state.ts L23-41 fail-soft read + branchOnSchemaVersion 直接 analog (yaml.load 替 JSON.parse) |
| `src/manifest/knownGood.ts` NEW | **~65%** | sister #2 + sister install.ts L66 path 构造范式 |
| `src/manifest/schema/aliases.v1.ts` NEW | **~95%** | governance.ts TypeBox shape 直接复刻 + ISO-date pattern sister |
| `src/manifest/schema/known-good.v1.ts` NEW | **~92%** | governance.ts + spec.ts outer Type.Object 沿袭 |
| `manifests/aliases.yaml` NEW seed | **~70%** | sister gstack.yaml + manifests/ yaml convention 沿袭 |
| `versions/0.3.0-known-good.yaml` NEW seed | **~75%** | sister manifests/ yaml convention + CONTEXT D-03 sample 模板 |
| `src/cli/doctor.ts` 加 7th check | **~98%** | sister `checkGstackPrefix` L136-142 范式 1:1 replicate |
| `src/cli/install.ts` resolveAlias + --known-good | **~85%** | sister commander option pattern + Karpathy 1-line surgical pre-lookup |
| `src/types/schemaVersion.ts` 12+13 surface | **~98%** | sister Phase 3.2 W1 T1.1 9+10 double-add 范式直接 analog |
| `.planning/STATE.md` W0.1 collapse | **~95%** | sister 2-line delete + 当前位置块 single SSOT preserve |
| `scripts/check-transparency-verdicts.mjs` W0.1 扩 | **~80%** | sister Phase 2.4 H2 fix 1-line bug + matchAll + per-file branch 范式 |
| `tests/scripts/dashboard-sse.test.ts` W0.2 fix | **~50%** | sister 既有 test scaffold + Node `net.createServer({port:0})` ephemeral port 新机制 |
| `.planning/phase-3.3/W0.3-schema-decision.md` NEW | **~90%** | sister Phase 3.2 W0.3 完整 doc 结构直接 analog (Decision + Rationale + Path divergence + Schema specs + Implementation order + Verification) |
| `tests/cli/check-deprecations.test.ts` NEW | **~85%** | sister doctor.test.ts L6-8 mock 三件套 + Phase 3.2 W1 doctor-fixtures.test.ts 5-fixture per-check 范式 |
| `tests/manifest/aliases.test.ts` NEW | **~85%** | sister Phase 3.1 W2 state.test.ts vi.mock + Value.Check + branchOnSchemaVersion 4-fixture 模式 |
| `tests/manifest/knownGood.test.ts` NEW | **~85%** | sister #16 + sister Phase 1.X validate.test.ts per-field Value.Check assert |

**总 reuse %**: **~84%** (17 target average; 高 reuse 因 Phase 3.2 W1 probe-gstack/config/governance schema 三件套 100% sister analog ready + Phase 3.1 state.ts read pattern + sister manifest/schema/spec.ts colocation precedent 已建)

**对比 Phase 3.2**: ~83%; 本 Phase 3.3 ~84% 反映 manifest-domain phase 高度沿用 Phase 3.2 W1 probe-gstack + governance schema sister 范式 + Phase 3.1 state.ts fail-soft read 模式. Karpathy "small step, sister 95% 门槛 met" continued. 1 真新机制: random ephemeral port (~50% NEW — sister Node best practice 但 dashboard-sse test 之前未用过该范式)

---

## § 5 Path Dependency (Wave 0 → W1 → W2 ship)

**W0 first (must-fix CI green prereq, 3 项并行)**:
1. **W0.1** `.planning/STATE.md` L4-5 删 (~2L delete) → `scripts/check-transparency-verdicts.mjs` 扩 STATE_POSITION_RE (~10L add) → freshness gate 5-recurrence terminus 验收 `! grep "^> Status:" .planning/STATE.md` + `grep "\*\*Phase 3\.2 SHIPPED\*\*" .planning/STATE.md` exit 0 + CI transparency gate green
2. **W0.2** `tests/scripts/dashboard-sse.test.ts` random port + retry (~20L delta) → `scripts/dashboard.mjs` DASHBOARD_PORT env var (~1L delta) → Acceptance `corepack pnpm test -- --run tests/scripts/dashboard-sse.test.ts 2>&1 | tail -3` 4/4 pass
3. **W0.3** `.planning/phase-3.3/W0.3-schema-decision.md` NEW (~50-60L decision doc, sister Phase 3.2 W0.3 完整 ship 模板) → 12+13 surface lock + manifest/schema/ colocation rationale 锁

**W1 infra (schema + helpers + wire-in, 6 task 顺序)**:
4. `src/types/schemaVersion.ts` 加 12+13 surface (~4-5L delta) — depends on W0.3 decision doc lock
5. `src/manifest/schema/aliases.v1.ts` NEW (~30-40L) — depends on #4 SCHEMA_VERSIONS register
6. `src/manifest/schema/known-good.v1.ts` NEW (~40L) — depends on #4
7. `src/manifest/aliases.ts` NEW (~30-40L) — depends on #5 schema
8. `src/manifest/knownGood.ts` NEW (~40-45L) — depends on #6 schema
9. `src/cli/lib/check-deprecations.ts` NEW (~30-40L) — depends on #7 aliases.ts loader

**W1 wire-in (3 task 顺序)**:
10. `src/cli/doctor.ts` 加 7th check (~8L delta) — depends on #9 check-deprecations helper
11. `src/cli/install.ts` 加 resolveAlias + --known-good (~10L delta) — depends on #7 aliases.ts + #8 knownGood.ts
12. `manifests/aliases.yaml` NEW empty seed (~10L) + `versions/0.3.0-known-good.yaml` NEW empty seed (~10L) — depends on #5+#6 schemas (sister yaml-language-server schema-comment validation)

**W1 tests (3 task 并行, depend on infra)**:
13. `tests/cli/check-deprecations.test.ts` NEW (~50L 5 fixtures) — depends on #9
14. `tests/manifest/aliases.test.ts` NEW (~50L 5 fixtures) — depends on #7
15. `tests/manifest/knownGood.test.ts` NEW (~50L 5 fixtures) — depends on #8

**W2 e2e + ship**:
16. ADR 0016 errata (aliases.yaml + deprecation marker + known-good 12+13 surface lock) — sister Phase 3.2 ADR 0015 9 章节 errata format
17. STATE.md per-phase entry add (Phase 3.3 SHIPPED marker line-start sister Phase 3.2 cadence) + README.md `- **Phase 3.3 shipped** ✅` line — sister Phase 3.2 ship cadence + W0.1 D-04 COLLAPSE post-state new SSOT location ("当前位置"块 + L43 ship history table)

**Wave A R1+R2 并行 deliverables (本 R1 + 已 ship R2)**:
- R1 (本 PATTERNS.md): 17 target analog mapping + reuse % + cross-cutting D-decision 守门 + Karpathy 守门
- R2 (RESEARCH.md sister-ship if needed): 12+13 surface decision (manifest-domain colocation) + dashboard-sse random port fix path validation + dashboard.mjs --port/env-var convention 决

**Wave B planner 输入**: 同时消费 R1 (本文档) + R2 (RESEARCH.md if any) 生成 PLAN.md (4 wave 拆分 W0.1 → W0.2 → W0.3 → W1 schema + helper + wire-in → W1 tests → W2 e2e + ADR + ship tags)

---

**PATTERN MAPPING COMPLETE** — Wave B (planner) 启动准备;Wave A R2 RESEARCH 可并行进行 / 已 ship。
