# Phase 3.3 — task_plan.md

> **Authored**: 2026-05-17
> **Author**: gsd-planner (Wave B)
> **Sources**: CONTEXT.md D-01~D-04 + KICKOFF § 1-6 + PATTERNS § 1-5 (17 analog targets 100% hit) + RESEARCH § 1-17 (HIGH confidence, W0.1 fix + 12+13 surface decision + W0.2 fix path (a) verbatim recipe) + sister Phase 3.2 task_plan.md atomic structure
> **Style**: 沿袭 phase-3.2/task_plan.md per-task structure (files_modified / read_first / action concrete values / acceptance_criteria grep-verifiable / decision_source)
> **Task count**: 26 atomic tasks across 3 Waves (W0:5 / W1:12 / W2:9 / +biome lint preempt every commit) — W0:5 includes T0.5 schemaVersion 11th surface backfill (planFeature.v1 sister Phase 3.2 W2 T2.2 b875e21 stale claim fix, sister Phase 3.2 W2 T2.6 latent W1 c37ee29 Rule 1 pattern)
> **Hard limit verify**: every code-producing task 含 `wc -l ≤ N` acceptance criterion (Karpathy ≤200L hard limit B-06 / B-26)

> ⚠️ **Schema registration discipline (CD-5 sister Phase 2.2 W2 T2.0 + Phase 3.1 W1 T1.1 + Phase 3.2 W1 T1.1)**: 任何 NEW schema (planFeature.v1 T0.5 backfill + aliases.v1 + knownGood.v1) 必走 `src/types/schemaVersion.ts` 单一 SSOT — 加 SCHEMA_VERSIONS const + Type.Literal Union; 任何 consume site (aliases.ts loadAliases + knownGood.ts loadKnownGood + planFeature.ts already exists Phase 3.2 W2 — T0.5 swaps hard-coded literal for SCHEMA_VERSIONS.planFeature import if present) 用 Value.Check 直接 OR branchOnSchemaVersion<T>() helper (v1-only surfaces no version branching needed); Wave 验收 `grep -cE "harnessed\\.\\w+\\.v1" src/types/schemaVersion.ts` ≥ 13 (10 actual baseline → 11 T0.5 backfill → 13 W1 double-add).

> ⚠️ **TypeBox ISO-date pattern lesson 守门** (sister Phase 3.2 W2 Rule 1 — FormatRegistry not 注册 project-wide; `format: 'date'` silently passes garbage): aliases.v1 + known-good.v1 严格用 `pattern: '^\\d{4}-\\d{2}-\\d{2}$'` (verbatim); NEGATIVE守门 `! grep -E "FormatRegistry|format: 'date'|format: \"date\"" src/manifest/schema/aliases.v1.ts src/manifest/schema/known-good.v1.ts` exit 0.

> ⚠️ **Biome lint preempt before commit** (project memory `feedback_biome-preempt.md` 3 CI-red recurrences Phase 2.1.1 / 2.2 / 2.3): 任何 TS/JS commit 前必跑 `pnpm exec biome check --write`. CI biome step fail = 强制 rerun 3-OS 测试浪费.

> ⚠️ **D-decision 守门** (4 decisions LOCKED, executor 防 sneak-in per PATTERNS § 3):
> - **D-01 RICH** locked → FLAT (string-only map) or TIERED (string OR object union) 不可 sneak-in (CONTEXT L277-278 evaluated rejected)
> - **D-02 DOCTOR-ONLY-WARN** locked → INSTALL-WARN console.warn 不可 sneak-in (CI 噪声 + 重复警告); INSTALL-THROW + --force-deprecated flag 不可 sneak-in (太严苛 + R7.5 验收 "install 通过" 语义冲突); install path stdout/stderr observability test守门 NOT 含 'redirect|deprecated' substring
> - **D-03 YAML manifest** locked → JSON known-good (npm-lock style) 不可 sneak-in (项目未用 npm-lock + yaml convention sister); Embed-in-manifest yaml 不可 sneak-in (跨 manifest agg 难)
> - **D-04 (b) COLLAPSE** locked → (a) EXTEND freshness gate scope 保 dual 不可 sneak-in (over-engineering 不消除 root); (c) COLLAPSE INVERSE 删 "当前位置" 块 不可 sneak-in (损 human-readable + dashboard 可能 break)

---

## Resolved Blocks (executor fill in-place, sister Phase 3.2 task_plan precedent)

> Resolved blocks 用于 executor 在跑 wave 时 surface 实测结果 (spike outcome / split decision / dogfood 结果) 锚定后续 task。

> **Resolved (T0.1 STATE COLLAPSE outcome, PENDING)**: <PENDING — Wave 0 T0.1 fill: `node scripts/check-transparency-verdicts.mjs` post-fix outcome (expect exit 0); `! grep -q "^> Status:" .planning/STATE.md` exit code (expect 0); `grep -q "\*\*Phase 3\.2 SHIPPED\*\*" .planning/STATE.md` exit code (expect 0)>

> **Resolved (T0.2 dashboard-sse 4-cell pass outcome, PENDING)**: <PENDING — Wave 0 T0.2 fill: `corepack pnpm test -- --run tests/scripts/dashboard-sse.test.ts 2>&1 | tail -3` outcome (expect 4 pass 0 fail; first acceptance bar of Phase 3.3 = Win 3-OS green)>

> **Resolved (T1.7 doctor.ts wc gate, PENDING)**: <PENDING — Wave 1 T1.7 fill: `wc -l src/cli/doctor.ts` post-7th-check 实测 (expect 184 → ~189L ≤ 200L Karpathy clean; **no** existing-helper split needed per RESEARCH § 0.4 + § 12.3 verified baseline 184L)>

> **Resolved (T1.9 install.ts wc gate, PENDING)**: <PENDING — Wave 1 T1.9 fill: `wc -l src/cli/install.ts` post-resolveAlias-inject + --known-good 实测 (expect 117 → ~127L ≤ 200L)>

> **Resolved (T2.1 install-aliases e2e outcome, PENDING)**: <PENDING — Wave 2 T2.1 fill: 3-fixture install-aliases e2e outcome (fixture 1 rename redirect + fixture 2 unknown name fail-loud + fixture 3 alias-but-target-missing fail-loud); 写入 `.planning/phase-3.3/T2.1-install-aliases.md` if BLOCKER 发现>

> **Resolved (T2.9 A7 verify outcome, PENDING)**: <PENDING — Wave 2 T2.9 fill: `git diff adr-0015-accepted..HEAD -- docs/adr/000[1-9]-*.md docs/adr/001[0-5]-*.md | wc -l` outcome (expect == 0)>

---

## Deferred Items (Phase 3.3 carry-forward, will register at ship)

> **DEFERRED #X (Phase 3.3 prereq for Phase 3.4+)**: 路由命中率 ≥ 85% 验收 + token budget 监控 → Phase 3.4 (per ROADMAP L166-168)
> **DEFERRED #Y (Phase 3.3+ dogfood)**: plan-feature 真接外部 gsd-* spawn → Phase 3.3+ dogfood (Phase 3.2 D-03 WIRED stub mode, Phase 3.4 dogfood 时 transition)
> **DEFERRED #Z**: install --known-good 真 e2e 上游版本 lock seed data → Phase 3.4 dogfood 时填充 (本 phase MVP 仅 infra + 初版 empty/skeleton — versions/0.3.0-known-good.yaml upstreams: [])
> **DEFERRED #AA**: EE-4 BLOCKER auto-spawn rerun → Phase 3.4 后 evaluate
> **DEFERRED #AB**: userSpawn session_id capture → Phase 3.4+ (DEFERRED #2 Phase 3.1 carry; fresh-session fallback per B-02 acceptable)
> **DEFERRED #AC (Phase 3.3 own carry)**: aliases.yaml 真 deprecation entries seed → Phase 3.4 dogfood (本 phase MVP empty `aliases: {}` map)
> **DEFERRED #AD (Phase 3.3 own carry)**: install.ts harnessed_version source-of-truth — hardcoded '0.3.0' in T1.9; Phase 3.4 reads from package.json (TODO comment in code marks)
> **DEFERRED #AE (Phase 3.3 own carry)**: path traversal hardening for resolveAlias redirect (RESEARCH § 10.4 #1) — Phase 3.3 relies on git-tracked aliases.yaml + PR review gate; Phase 3.4 dogfood actual deprecations 时若 surface 实际 attack vector 再 add regex guard

---

## Wave 0 — Backlog 3 项 absorb + test infra setup (4 sub-tasks; T0.1 FIRST 必修 5-recurrence terminus)

### T0.1 — W0.1 D-04 STATE dual-SSOT 5-recurrence terminus COLLAPSE (LOCKED, FIRST TASK 必修)

- **files_modified**: `.planning/STATE.md` (DELETE 2 lines: L4 frontmatter `> Status:` + L5 `> 最后更新：`) + `scripts/check-transparency-verdicts.mjs` (MODIFY ~+10L: 加 STATE_POSITION_RE const + checkFreshness STATE.md OR-fallback branch)
- **read_first**:
  - `.planning/STATE.md` L1-30 (by Read — verify L4 `> Status:` + L5 `> 最后更新：` baseline pre-delete + L21-27 当前位置 block single SSOT contents)
  - `scripts/check-transparency-verdicts.mjs` L1-112 entire file (by Read — verify L20 STATUS_MARKER + L25 FRONT_MATTER_DOCS + L29-30 STATE_LATEST_SUBPHASE_RE existing baseline + L53-91 checkFreshness)
  - `.planning/phase-3.3/RESEARCH.md` § 6 (W0.1 STATE COLLAPSE + STATE_POSITION_RE OR-fallback recipe verbatim — offset 672 limit 100)
  - `.planning/phase-3.3/PATTERNS.md` § 1 row 11 + row 12 (STATE.md collapse + check-transparency-verdicts.mjs extend mappings)
- **action**:
  1. Read `.planning/STATE.md` to confirm L4 starts with `> Status:` + L5 starts with `> 最后更新：` (Phase 3.2 ship event log inline)
  2. **DELETE L4 整行** `> Status: v0.1.0 SHIPPED & ARCHIVED · **🎯 v0.2.0 MILESTONE 4/4 SHIPPED & ARCHIVED** ... **Phase 3.2 SHIPPED** ... long event log ...`
  3. **DELETE L5 整行** `> 最后更新：2026-05-17（**Phase 3.2 SHIPPED** ... long event log ...）`
  4. Preserve L21-27 当前位置 block (含 `**Phase 3.2 SHIPPED**` literal in L23 GSD phase chain + L24 当前里程碑 + L25 下一 phase + L26 状态 + L27 进度) — this is the single SSOT post-COLLAPSE per D-04 (b) locked
  5. **MODIFY `scripts/check-transparency-verdicts.mjs`** per RESEARCH § 6.2 verbatim:
     - 加 `const STATE_POSITION_RE = /\*\*Phase [1-9]\.[0-9]+ SHIPPED\*\*/m` near L21 (sister STATUS_MARKER + STATE_LATEST_SUBPHASE_RE existing area)
     - Modify `checkFreshness` L53-91 — within the `for (const file of FRONT_MATTER_DOCS)` loop, when `head.match(STATUS_MARKER)` returns null:
       ```javascript
       if (!match) {
         // Phase 3.3 W0.1 ADD OR-fallback: for STATE.md specifically, fallback to STATE_POSITION_RE on FULL file
         if (file === '.planning/STATE.md') {
           const full = readFileSync(file, 'utf8')
           if (!STATE_POSITION_RE.test(full)) {
             violations.push(`${file}:1  missing both Status: marker (first 50L) AND STATE_POSITION_RE (full file)`)
           }
           continue  // STATE.md OK if EITHER pattern matches
         }
         violations.push(`${file}:1  missing Status: marker in first 50 lines`)
         continue
       }
       ```
     - README + PROJECT-SPEC unchanged behavior (still require STATUS_MARKER in first 50 lines — they're user-facing docs, Status: line is semantic anchor)
  6. **Recommended commit msg** (Karpathy why-not-what, sister Phase 3.2 commit msg pattern per RESEARCH § 6.4):
     ```
     fix(phase-3.3-w0): T0.1 — STATE dual-SSOT 5-recurrence terminus COLLAPSE (D-04 LOCKED)

     5th and final recurrence of the dual-SSOT anti-pattern in project memory (4 priors:
     README L9 / README L44 / PROJECT-SPEC / STATE freshness scope). Karpathy YAGNI single
     source of truth: delete STATE.md L4 frontmatter Status: + L5 最后更新 lines; "当前位置"
     block (L21-27) is now sole SSOT. Freshness gate extends with STATE_POSITION_RE OR-fallback
     (full-file scan) so STATE.md acceptance check still passes.

     Verified: dashboard.mjs parses no L4 frontmatter (RESEARCH § 1.1 12-match grep evidence)
     — D-04 (b) COLLAPSE safe; no dashboard fix needed.
     ```
  7. Run biome preempt: `pnpm exec biome check --write` (no .ts touched, harmless)
  8. Local verify per acceptance_criteria below
  9. **Update Resolved (T0.1)** block at task_plan.md top with outcome (PENDING → 实占 value: grep exit codes + transparency gate pass status)
- **acceptance_criteria**:
  - `! grep -q "^> Status:" .planning/STATE.md` exit 0 (L4 删除 verify)
  - `! grep -q "^> 最后更新：" .planning/STATE.md` exit 0 (L5 删除 verify)
  - `grep -q "\*\*Phase 3\.2 SHIPPED\*\*" .planning/STATE.md` exit 0 (当前位置块 literal preserved)
  - `grep -E "STATE_POSITION_RE" scripts/check-transparency-verdicts.mjs | wc -l` ≥ 2 (declare + check usage)
  - `grep -E "OR-fallback|fallback to" scripts/check-transparency-verdicts.mjs | wc -l` ≥ 1 (branch comment present)
  - `node scripts/check-transparency-verdicts.mjs` exit 0 (transparency gate pass post-W0.1)
  - **5-recurrence terminus 记录守门**: commit msg contains "5-recurrence" OR "5th recurrence" literal (verify via `git log -1 --pretty=%B | grep -E "5.recurrence|5th recurrence" | wc -l` ≥ 1)
- **decision_source**: KICKOFF § 4 W0.1 + CONTEXT § Decisions D-04 verbatim + RESEARCH § 6 verbatim recipe + § 1.1 dashboard verified safe (planner DROPS CONTEXT.md L160 "spike 1h 评估" sub-step) + PATTERNS § 1 row 11 + row 12

### T0.2 — W0.2 dashboard-sse 4 cell flaky 根治 (fix path (a) random ephemeral port + DASHBOARD_PORT env injection)

- **files_modified**: `scripts/dashboard.mjs` (MODIFY +1L L39 env-var additive) + `tests/scripts/dashboard-sse.test.ts` (MODIFY ~+12L net delta: import net + getEphemeralPort helper + let PORT mutable + beforeAll env injection + 8s waitFor + remove portTaken probe + remove 4 cell skip branches)
- **read_first**:
  - `scripts/dashboard.mjs` L30-50 (by Read — verify L39 `const PORT = 47180` baseline pre-modify)
  - `tests/scripts/dashboard-sse.test.ts` L1-156 entire file (by Read — verify L17 `const PORT = 47180` + L1-7 import block + L24-30 httpGet + L46-65 sseConnect + L67-79 waitFor + L84-107 beforeAll + L116-155 4 cells with portTaken.value skip pattern)
  - `.planning/phase-3.3/RESEARCH.md` § 7 (W0.2 fix path (a) recipe verbatim — offset 770 limit 100)
  - `.planning/phase-3.3/PATTERNS.md` § 1 row 13 (dashboard-sse fix path (a) sister Node net.createServer pattern)
- **action**:
  1. **Step 1 — MODIFY `scripts/dashboard.mjs` L39** per RESEARCH § 7.1 Step 1 verbatim (additive, prod default preserved zero behavior change):
     ```javascript
     // PRE:
     const PORT = 47180
     // POST (+1L delta — but actually 0 line count delta since same line replaced):
     const PORT = Number(process.env.DASHBOARD_PORT ?? 47180)
     ```
  2. **Step 2 — MODIFY `tests/scripts/dashboard-sse.test.ts`** per RESEARCH § 7.1 Step 2 verbatim:
     - Add to imports (after `import { request } from 'node:http'`):
       ```typescript
       import { createServer as createNetServer } from 'node:net'
       ```
     - L17 `const PORT = 47180` → `let PORT = 0  // populated in beforeAll via getEphemeralPort()`
     - Add helper after imports (before existing helpers):
       ```typescript
       /** Random ephemeral port helper (sister Node net.createServer best practice). */
       function getEphemeralPort(): Promise<number> {
         return new Promise((resolve, reject) => {
           const srv = createNetServer()
           srv.listen(0, '127.0.0.1', () => {
             const addr = srv.address()
             if (addr && typeof addr === 'object') {
               const port = addr.port
               srv.close(() => resolve(port))
             } else {
               srv.close(() => reject(new Error('failed to get ephemeral port')))
             }
           })
           srv.on('error', reject)
         })
       }
       ```
     - L67-79 `waitFor` — increase timeout to 8000ms (sister Phase 2.4 W4 Win 3-tier pattern):
       ```typescript
       async function waitFor(port: number, timeoutMs = 8000): Promise<void> {
         const start = Date.now()
         let lastErr: Error | null = null
         while (Date.now() - start < timeoutMs) {
           try {
             const r = await httpGet('/', 500)
             if (r.status === 200) return
           } catch (e) {
             lastErr = e as Error
           }
           await new Promise((r) => setTimeout(r, 100))
         }
         throw new Error(`dashboard did not start on :${port} within ${timeoutMs}ms (last: ${lastErr?.message})`)
       }
       ```
     - L84-107 `beforeAll` — replace portTaken probe with getEphemeralPort + env injection:
       ```typescript
       beforeAll(async () => {
         PORT = await getEphemeralPort()
         const tmpRoot = await mkdtemp(join(tmpdir(), 'dash-sse-'))
         await mkdir(join(tmpRoot, '.planning'), { recursive: true })
         await writeFile(join(tmpRoot, '.planning', 'STATE.md'), '# initial state\n')
         const proc = spawn(process.execPath, [DASHBOARD, '--no-open'], {
           cwd: tmpRoot,
           stdio: 'ignore',
           detached: false,
           env: { ...process.env, DASHBOARD_PORT: String(PORT) },  // ← inject env var (matches dashboard.mjs L39 additive override)
         })
         handle = { proc, tmpRoot }
         await waitFor(PORT, 8000)
       }, 15_000)
       ```
     - **DELETE** L84-94 `portTaken` probe lines (the `let portTaken = { value: false }` + first httpGet check)
     - **DELETE** L116-155 4 cell `if (portTaken.value) return` skip branches at top of each cell (always run cells now)
  3. Run biome preempt: `pnpm exec biome check --write tests/scripts/dashboard-sse.test.ts scripts/dashboard.mjs` (.mjs may not be biome-covered, harmless)
  4. Run local verify: `corepack pnpm test -- --run tests/scripts/dashboard-sse.test.ts 2>&1 | tail -10`
  5. **Update Resolved (T0.2)** block at task_plan.md top with outcome (PENDING → 实占 value: 4 pass 0 fail confirmation)
- **acceptance_criteria**:
  - `grep -E "DASHBOARD_PORT" scripts/dashboard.mjs | wc -l` ≥ 1 (env-var override present)
  - `grep -E "process\.env\.DASHBOARD_PORT" scripts/dashboard.mjs | wc -l` ≥ 1 (proper env access)
  - `grep -E "DASHBOARD_PORT.*String\(PORT" tests/scripts/dashboard-sse.test.ts | wc -l` ≥ 1 (env injection present in spawn)
  - `grep -E "createNetServer|net\.createServer" tests/scripts/dashboard-sse.test.ts | wc -l` ≥ 1 (random port helper present)
  - `grep -E "getEphemeralPort" tests/scripts/dashboard-sse.test.ts | wc -l` ≥ 2 (helper declared + called)
  - `! grep -E "portTaken" tests/scripts/dashboard-sse.test.ts` exit 0 (probe removed)
  - `corepack pnpm test -- --run tests/scripts/dashboard-sse.test.ts 2>&1 | tail -3 | grep -E "Tests.*4 passed"` exit 0 (4/4 cells pass — first acceptance bar of Phase 3.3)
  - `wc -l scripts/dashboard.mjs` ≤ 611 (was 610, +1L env-var; B-06 hard limit far from 200 but dashboard.mjs is a script not src/, no Karpathy ≤200 enforce)
- **decision_source**: KICKOFF § 4 W0.2 + CONTEXT § Decisions W0.2 + Claude's Discretion #6 推 (a) + RESEARCH § 7.1 Step 1+2 verbatim recipe + PATTERNS § 1 row 13 + sister Node `net.createServer({port:0})` MDN std + sister Phase 2.4 W4 Win 3-tier 8s waitFor pattern

### T0.3 — W0.3 schemaVersion 12+13 surface double-add decision record (manifest-domain colocation + Path divergence acknowledgment)

- **files_modified**: `.planning/phase-3.3/W0.3-schema-decision.md` (NEW ~60L decision record per sister Phase 3.2 W0.3 76L 模板)
- **read_first**:
  - `.planning/phase-3.2/W0.3-schema-decision.md` (by Read — sister Phase 3.2 W0.3 76L gold-standard 模板)
  - `src/types/schemaVersion.ts` L1-80 (by Read — verify 11 current surfaces post-Phase-3.2 + double-add precedent in JSDoc table)
  - `src/manifest/schema/` directory listing (by Bash `ls src/manifest/schema/`) — verify existing 4+ modules: spec.ts + metadata.ts + types.ts + index.ts + installMethods/ — sister manifest-domain colocation precedent
  - `.planning/phase-3.3/RESEARCH.md` § 9 (W0.3 decision doc structure + Path divergence rule reuse — offset 945 limit 40)
  - `.planning/phase-3.3/PATTERNS.md` § 1 row 14 (W0.3 decision doc sister Phase 3.2 W0.3 90% reuse mapping)
- **action**:
  1. Create NEW file `.planning/phase-3.3/W0.3-schema-decision.md` with structure per sister Phase 3.2 W0.3 模板:
     ```markdown
     # W0.3 schemaVersion 12th + 13th surface decision record

     **Phase**: 3.3 W0.3 prereq
     **Date**: 2026-05-17
     **Sources**: RESEARCH § 5 + § 9 + sister Phase 3.2 W0.3 76L 直接 model + sister Phase 3.2 W1 T1.1 9+10 双加 precedent

     ## Decision

     **NEW double-add 2 surfaces**: `harnessed.aliases.v1` (12th, D-01 RICH aliases.yaml redirect+metadata) + `harnessed.known-good.v1` (13th, D-03 YAML manifest version lock).

     ## Rationale

     1. **Karpathy single-responsibility**: aliases (upstream rename redirect) and known-good (per-harnessed-version pinned upstream version lock) are distinct manifest-domain concepts with independent lifecycles. Combining into one surface would muddy schema semantics and force Value.Check on unused fields.
     2. **Manifest-domain colocation** (per RESEARCH § 5.3 + § 9.2): both schemas placed at `src/manifest/schema/aliases.v1.ts` + `src/manifest/schema/known-good.v1.ts` because primary consumers are `src/manifest/aliases.ts` + `src/manifest/knownGood.ts` + `src/cli/install.ts` (all manifest-domain). Sister `src/manifest/schema/spec.ts` (Phase 1.X) established this colocation precedent.
     3. **Sister Phase 3.2 W1 T1.1 9+10 双加 precedent**: Phase 3.2 W1 T1.1 added config.v1 (9th) + governance.v1 (10th) as double-add (SCHEMA_VERSIONS const + SchemaVersionLiteral Union both extended +2 entries). 本 phase W1 T1.1 双 +2 仍同 pattern (11 post-T0.5-backfill → 13). Cost ~+4L cross 2 处 + 2 NEW schema files (acceptable trade-off). Note: T0.5 backfill (10 actual baseline → 11) is Phase 3.2 W2 T2.2 b875e21 stale "11th surface" commit msg claim surgical fix per sister Phase 3.2 W2 T2.6 latent W1 c37ee29 Rule 1 pattern.
     4. **Sister Phase 3.1 W1 T1.1 8th surface colocation 模式延续**: Phase 3.1 added currentWorkflow.v1 (8th) at `src/checkpoint/schema/` (checkpoint-domain consumer). Phase 3.2 added config + governance at `src/workflow/schema/` (workflow-domain). Phase 3.3 adds aliases + known-good at `src/manifest/schema/` (manifest-domain). Each surface lives with primary consumer = consistent Karpathy colocation rule across 3 phases.

     ## Path divergence from PATTERNS.md (acknowledged per sister Phase 3.2 W0.3 L19-29 pattern)

     **NOT divergent**: PATTERNS.md § 1 row 4 already places aliases.v1 at `src/manifest/schema/` (sister spec.ts/metadata.ts existing manifest-domain schemas). PATTERNS.md § 1 row 5 already places known-good.v1 at `src/manifest/schema/`. PATTERNS.md § 2.4 sketch and § 2.5 sketch are consistent with this plan.

     **Confirmation, NOT divergence** — unlike Phase 3.2 W0.3 which documented divergence from PATTERNS.md § 2.4 sketch (checkpoint/schema/ → workflow/schema/ reclassification), Phase 3.3 PATTERNS.md is already authored with the correct colocation. This decision doc confirms the colocation rule for the historical record + reinforces the Karpathy consumer-locality discipline for future phases.

     **Future colocation rule (cross-phase)**: schemas go where primary consumer lives.
     - manifest-domain (manifests/ yaml + install consumer) → `src/manifest/schema/`
     - workflow-domain (workflows/ yaml + run.ts/loadPhases.ts consumer) → `src/workflow/schema/`
     - checkpoint-domain (.harnessed/ runtime state + state.ts/engineHook.ts consumer) → `src/checkpoint/schema/`

     ## Schema specs

     ### `manifests/aliases.yaml` ↔ `src/manifest/schema/aliases.v1.ts` (12th surface)

     ```typescript
     export const AliasEntryV1 = Type.Object({
       redirect: Type.String({ minLength: 1 }),
       reason: Type.String({ minLength: 1, maxLength: 500 }),
       since_version: Type.String({ pattern: '^\\d+\\.\\d+\\.\\d+$' }),
       deprecation_date: Type.String({ pattern: '^\\d{4}-\\d{2}-\\d{2}$' }),  // ISO-date pattern (NOT FormatRegistry — sister Phase 3.2 W2 Rule 1 lesson)
       removal_date: Type.Optional(Type.String({ pattern: '^\\d{4}-\\d{2}-\\d{2}$' })),
     }, { additionalProperties: false })

     export const AliasesV1 = Type.Object({
       schemaVersion: Type.Literal(SCHEMA_VERSIONS.aliases),  // 'harnessed.aliases.v1'
       aliases: Type.Record(Type.String({ minLength: 1 }), AliasEntryV1),
     }, { additionalProperties: false })
     ```

     - Owner (writer): harnessed maintainer + PR review (git-tracked project metadata)
     - Reader: harnessed `src/manifest/aliases.ts` (loadAliases + resolveAlias + listDeprecations) + `src/cli/install.ts` (resolveAlias pre-manifest-lookup inject) + `src/cli/lib/check-deprecations.ts` (doctor 7th check)
     - LOC: ~35-40L NEW

     ### `versions/<harnessed-ver>-known-good.yaml` ↔ `src/manifest/schema/known-good.v1.ts` (13th surface)

     ```typescript
     export const PinnedUpstream = Type.Object({
       name: Type.String({ minLength: 1 }),
       version: Type.String({ minLength: 1 }),
       install_method: Type.String({ minLength: 1 }),  // free-form string (NOT InstallType enum) — avoids coupling drift with Phase 2.X 6+ install method registry
     }, { additionalProperties: false })

     export const KnownGoodV1 = Type.Object({
       schemaVersion: Type.Literal(SCHEMA_VERSIONS.knownGood),  // 'harnessed.known-good.v1'
       harnessed_version: Type.String({ pattern: '^\\d+\\.\\d+\\.\\d+$' }),
       e2e_verified_at: Type.String({ pattern: '^\\d{4}-\\d{2}-\\d{2}$' }),
       upstreams: Type.Array(PinnedUpstream),
     }, { additionalProperties: false })
     ```

     - Owner (writer): harnessed release process (git-tracked per-version lock file)
     - Reader: harnessed `src/manifest/knownGood.ts` (loadKnownGood + getPinnedVersion lazy) + `src/cli/install.ts --known-good` flag consume
     - LOC: ~40-45L NEW
     - Threat mitigation: TypeBox strict prevents schema drift; semver pattern prevents garbage harnessed_version; install_method free-form intentional (Phase 2.X 6+ install method may expand)

     ## Implementation order

     - W1 T1.1: `src/types/schemaVersion.ts` MODIFY +4L (SCHEMA_VERSIONS 加 aliases + knownGood; SchemaVersionLiteral Union 加 2 Type.Literal)
     - W1 T1.2: `src/manifest/schema/aliases.v1.ts` NEW ≤40L (12th surface)
     - W1 T1.3: `src/manifest/schema/known-good.v1.ts` NEW ≤45L (13th surface)
     - W1 T1.4: `src/manifest/aliases.ts` NEW ≤40L (consumer of aliases.v1 schema)
     - W1 T1.5: `src/manifest/knownGood.ts` NEW ≤45L (consumer of known-good.v1 schema)

     ## Verification

     - `grep -cE "harnessed\\.\\w+\\.v1" src/types/schemaVersion.ts` ≥ 13 post-W1 T1.1
     - `grep -E "harnessed\\.aliases\\.v1|harnessed\\.known-good\\.v1" src/types/schemaVersion.ts | wc -l` ≥ 2
     - `! grep -E "FormatRegistry|format: 'date'" src/manifest/schema/aliases.v1.ts src/manifest/schema/known-good.v1.ts` exit 0 (ISO-date pattern lesson 守门)
     - `grep -E "Path divergence|manifest-domain|src/manifest/schema/" .planning/phase-3.3/W0.3-schema-decision.md | wc -l` ≥ 3 (rationale captured)
     ```
- **acceptance_criteria**:
  - `test -f .planning/phase-3.3/W0.3-schema-decision.md` exit 0
  - `grep -E "aliases\.v1|known-good\.v1|knownGood" .planning/phase-3.3/W0.3-schema-decision.md | wc -l` ≥ 4 (both surfaces referenced multiple times)
  - `grep -E "Path divergence|manifest-domain|src/manifest/schema/" .planning/phase-3.3/W0.3-schema-decision.md | wc -l` ≥ 3 (rationale captured)
  - `grep -E "Confirmation, NOT divergence|colocation rule" .planning/phase-3.3/W0.3-schema-decision.md | wc -l` ≥ 1 (Phase 3.3-specific note vs Phase 3.2 divergence)
  - `wc -l .planning/phase-3.3/W0.3-schema-decision.md` ≥ 40 ≤ 120
- **decision_source**: KICKOFF § 4 W0.3 + CONTEXT § Decisions D-03 + RESEARCH § 5.3 + § 9 verbatim doc structure + sister Phase 3.2 W0.3 76L direct model + PATTERNS § 1 row 14

### T0.4 — Test dirs setup + vitest config positive verify (sister Phase 3.2 W0 T0.4)

- **files_modified**: `tests/manifest/schema/` + `tests/manifest/` + `tests/integration/` + `tests/cli/` (NEW directories via mkdir -p if not exists; tests/integration may exist from Phase 3.2)
- **read_first**:
  - `tests/` directory list (by Bash `ls tests/`) — verify pre-existing dirs not broken
  - `vitest.config.ts` (by Read — positive verify glob covers tests dirs recursively per sister Phase 3.2 W0 T0.4)
- **action**:
  1. Create test dirs (idempotent):
     ```bash
     mkdir -p tests/manifest/schema tests/manifest tests/integration tests/cli
     ```
  2. Positive verify vitest.config.ts include glob:
     ```bash
     grep -E "include:|tests/" vitest.config.ts
     ```
     - **Expected baseline**: include glob `tests/**/*.test.ts` (recursive **) — covers all NEW sub-dirs auto-discover
     - **Fallback** (if restrictive glob): add explicit globs (`tests/manifest/**/*.test.ts`)
  3. Smoke run: `corepack pnpm test -- --run --reporter=dot 2>&1 | tail -3` (no break to existing 623+ suite)
- **acceptance_criteria**:
  - `[ -d tests/manifest/schema ] && [ -d tests/manifest ] && [ -d tests/integration ] && [ -d tests/cli ]` exit 0
  - `grep -E "tests/" vitest.config.ts` exit 0 (glob references tests dir)
  - `corepack pnpm test -- --run --reporter=dot 2>&1 | tail -3 | grep -v "failed"` exit 0 (existing suite still passes)
- **decision_source**: sister Phase 3.2 W0 T0.4 mkdir + vitest positive verify pattern

---

### T0.5 — src/types/schemaVersion.ts MODIFY +4-5L (planFeature.v1 11th surface BACKFILL; sister Phase 3.2 W2 T2.2 b875e21 stale claim fix)

- **files_modified**: `src/types/schemaVersion.ts` (MODIFY +4-5L: SCHEMA_VERSIONS const +1 entry + SchemaVersionLiteral Union +1 Type.Literal + JSDoc surface enumeration +1 line) + `src/workflow/schema/planFeature.ts` (conditional MODIFY: IF currently hard-codes `'harnessed.plan-feature.v1'` literal anywhere, swap to `SCHEMA_VERSIONS.planFeature` import per sister Phase 3.1 W1 8th surface pattern; ELSE no-op — current state has no schemaVersion field on PlanFeatureWorkflowV1) + `tests/unit/types-schemaVersion.test.ts` (MODIFY 3 places: describe block 10→11 + .toHaveLength(10) → .toHaveLength(11) + expectedSurfaces array add 'plan-feature')
- **read_first**:
  - `src/types/schemaVersion.ts` L1-80 entire file (by Read — verify 10 actual baseline surfaces; `grep -cE "harnessed\\.\\w+\\.v1"` should return 10 BEFORE this task runs; if returns 11, T0.5 already executed — skip)
  - `src/workflow/schema/planFeature.ts` entire file (by Read — verify whether any hard-coded `'harnessed.plan-feature.v1'` literal exists; current snapshot has NO schemaVersion field on PlanFeatureWorkflowV1 — backfill is registry-only)
  - `tests/unit/types-schemaVersion.test.ts` (by Read — verify "10 surfaces" assertions at L13, L14-16, L29-46 baseline)
  - `.planning/phase-3.3/RESEARCH.md` § 5.2 (12+13 surface MODIFY recipe verbatim — though T0.5 is 10→11 prep, recipe shape applies)
  - `git log --oneline b875e21 -1` (by Bash — verify Phase 3.2 W2 T2.2 commit msg claim "11th surface" stale)
- **action**:
  1. Read `src/types/schemaVersion.ts` L1-80 + verify `grep -cE "harnessed\\.\\w+\\.v1" src/types/schemaVersion.ts` returns 10 (actual baseline; b875e21 commit msg claim was stale)
  2. Read `src/workflow/schema/planFeature.ts` + verify NO hard-coded `'harnessed.plan-feature.v1'` literal (current snapshot 2026-05-17: no schemaVersion field on PlanFeatureWorkflowV1 schema; backfill is registry-only)
  3. MODIFY `src/types/schemaVersion.ts` SCHEMA_VERSIONS const (~L40-51) — add 1 entry after `governance:` line (sister Phase 3.1 W1 T1.1 currentWorkflow add pattern):
     ```typescript
     export const SCHEMA_VERSIONS = {
       // ... existing 10 entries ending with governance: 'harnessed.governance.v1' ...
       planFeature: 'harnessed.plan-feature.v1', // ← Phase 3.3 W0 T0.5 BACKFILL 11th surface (sister Phase 3.2 W2 T2.2 b875e21 commit msg claim "11th surface" was LATENT STALE — never registered; T0.5 surgical fix per sister Phase 3.2 W2 T2.6 latent W1 c37ee29 Rule 1 pattern)
     } as const
     ```
  4. MODIFY SchemaVersionLiteral Union (~L55-66) — add 1 Type.Literal entry at end:
     ```typescript
     export const SchemaVersionLiteral = Type.Union([
       // ... existing 10 entries ...
       Type.Literal(SCHEMA_VERSIONS.planFeature), // ← Phase 3.3 W0 T0.5 BACKFILL 11th surface
     ])
     ```
  5. MODIFY JSDoc comment block (~L13-26) — add 1 line to surface enumeration AND update "The 10 surfaces" → "The 11 surfaces" in line L13:
     ```typescript
     //   - plan-feature: src/workflow/schema/planFeature.ts (plan-feature workflow DSL) ← Phase 3.3 W0 T0.5 BACKFILL 11th surface (sister Phase 3.2 W2 T2.2 b875e21 stale claim fix)
     ```
  6. IF step 2 found hard-coded literal in planFeature.ts: swap to `import { SCHEMA_VERSIONS } from '../../types/schemaVersion.js'` + `Type.Literal(SCHEMA_VERSIONS.planFeature)` reference (sister Phase 3.1 W1 8th surface pattern). ELSE: no-op (current snapshot — backfill is registry-only).
  7. MODIFY `tests/unit/types-schemaVersion.test.ts` 3 places (sister Phase 3.1 W1 T1.4 pattern):
     - L13 describe block name: "10 surfaces" → "11 surfaces (... + Phase 3.3 W0 T0.5 planFeature backfill)"
     - L14-16 `it('has exactly 10 surface entries')` + `toHaveLength(10)` → "11 surface entries" + `toHaveLength(11)`
     - L29 describe ('covers the 10 named surfaces') → "11 named surfaces"
     - L30-41 expectedSurfaces array add `'plan-feature', // ← Phase 3.3 W0 T0.5 11th surface`
  8. Run `corepack pnpm typecheck` — expect exit 0 (planFeature.ts compile clean post-backfill since current state has no schemaVersion field — no breakage)
  9. Run biome preempt: `pnpm exec biome check --write src/types/schemaVersion.ts tests/unit/types-schemaVersion.test.ts`
  10. Run `corepack pnpm test -- --run tests/unit/types-schemaVersion.test.ts` — expect 0 fail (test 10→11 assertion updates pass)
  11. **Recommended commit msg** (Karpathy why-not-what, sister c37ee29 Rule 1 surgical fix pattern延袭):
      ```
      fix(phase-3.3-w0): T0.5 — planFeature.v1 11th schemaVersion surface register backfill (sister Phase 3.2 W2 T2.2 b875e21 latent stale claim; orchestrator iter 1 B-1 fix path b)

      Root cause: Phase 3.2 W2 T2.2 b875e21 commit message claimed "11th surface"
      but planFeature.v1 was NEVER actually registered in SCHEMA_VERSIONS const.
      Latent stale claim — same shape as Phase 3.2 W2 T2.6 latent W1 governance.v1
      vetoed_at bug surfaced post-ship, fixed via c37ee29 Rule 1 surgical pattern.
      Phase 3.3 W3 plan-checker iter 1 surfaced as B-1 BLOCKER; orchestrator
      tier-call decision path (b): backfill 11th surface as Wave 0 prep so W1 T1.1
      double-add aliases + knownGood reaches 13 surface verbatim acceptance.

      Surgical: +4-5L to schemaVersion.ts only (SCHEMA_VERSIONS const +1 +
      SchemaVersionLiteral Union +1 + JSDoc +1 line). No planFeature.ts swap
      needed (current snapshot has no schemaVersion field on PlanFeatureWorkflowV1).
      Test assertion 10→11 update mirrors sister Phase 3.1 W1 T1.4 8th surface pattern.
      ```
- **acceptance_criteria**:
  - `grep -cE "harnessed\\.\\w+\\.v1" src/types/schemaVersion.ts` == 11 (was 10 actual baseline + 1 backfill = 11)
  - `grep -q "planFeature" src/types/schemaVersion.ts` exit 0 (SCHEMA_VERSIONS const entry exists)
  - `grep -q "harnessed\\.plan-feature\\.v1" src/types/schemaVersion.ts` exit 0 (literal added)
  - `grep -q "Type.Literal(SCHEMA_VERSIONS.planFeature)" src/types/schemaVersion.ts` exit 0 (Union extended)
  - `corepack pnpm typecheck` exit 0 (no type error; planFeature.ts compile clean)
  - `corepack pnpm test -- --run tests/unit/types-schemaVersion.test.ts 2>&1 | tail -3` 0 fail (10→11 surface assertion updated per sister Phase 3.1 W1 T1.4 pattern)
  - `wc -l src/types/schemaVersion.ts` ≤ 86 (was ~80, +~5L; Karpathy hard limit absolute ≤200L)
- **decision_source**: Phase 3.3 W3 plan-checker iter 1 B-1 BLOCKER orchestrator tier-call path (b) — backfill 11th surface as Wave 0 prep so W1 T1.1 double-add reaches 13 surface verbatim acceptance; sister Phase 3.2 W2 T2.6 latent W1 c37ee29 Rule 1 surgical fix pattern延袭

---

## Wave 1 — Schemas (12+13 surface) + manifest loaders + check-deprecations helper + doctor 7th + install integrate + 2 yaml seed + 8 test files

### T1.1 — src/types/schemaVersion.ts MODIFY 11 → 13 surface (double-add aliases + knownGood; post-W0-T0.5-backfill baseline is 11)

- **files_modified**: `src/types/schemaVersion.ts` (MODIFY +4L: 2 SCHEMA_VERSIONS entries + 2 SchemaVersionLiteral Type.Literal + JSDoc table 2 行)
- **read_first**:
  - `src/types/schemaVersion.ts` L1-80 entire file (by Read — post-W0-T0.5-backfill baseline is 11 surfaces: 10 actual original + planFeature.v1 added by T0.5; verify by `grep -cE "harnessed\.\w+\.v1"` returns 11 before this task runs)
  - `.planning/phase-3.3/W0.3-schema-decision.md` (decision record from T0.3)
  - `.planning/phase-3.3/RESEARCH.md` § 5.2 (12+13 surface MODIFY recipe verbatim — offset 632 limit 20)
  - `.planning/phase-3.3/PATTERNS.md` § 1 row 10 (sister Phase 3.2 W1 T1.1 9+10 双加 precedent + col # = 98% reuse)
- **action**:
  1. Read `src/types/schemaVersion.ts` to confirm current surface count = 11 post-W0-T0.5-backfill (10 actual original + planFeature.v1 added by T0.5; if grep returns ≠ 11, T0.5 backfill did NOT execute — block and escalate)
  2. SCHEMA_VERSIONS const (~L40-52) — add 2 entries at end (after `planFeature:` which is the 11th surface added by T0.5):
     ```typescript
     export const SCHEMA_VERSIONS = {
       // ... existing entries (10 or 11) ...
       aliases: 'harnessed.aliases.v1',          // ← Phase 3.3 W1 T1.1 ADD 12th surface (D-01 RICH aliases.yaml redirect+metadata)
       knownGood: 'harnessed.known-good.v1',     // ← Phase 3.3 W1 T1.1 ADD 13th surface (D-03 YAML manifest version lock)
     } as const
     ```
  3. SchemaVersionLiteral Union (~L55-66) — add 2 Type.Literal entries at end:
     ```typescript
     export const SchemaVersionLiteral = Type.Union([
       // ... existing entries ...
       Type.Literal(SCHEMA_VERSIONS.aliases),    // ← Phase 3.3 W1 T1.1 ADD 12th surface
       Type.Literal(SCHEMA_VERSIONS.knownGood),  // ← Phase 3.3 W1 T1.1 ADD 13th surface
     ])
     ```
  4. JSDoc comment block (~L13-26) — add 2 lines to surface enumeration table:
     ```typescript
     //   - aliases: manifests/aliases.yaml (upstream rename redirect) ← Phase 3.3 W1 T1.1 ADD (12th surface, D-01 RICH)
     //   - known-good: versions/<harnessed-ver>-known-good.yaml (upstream version lock) ← Phase 3.3 W1 T1.1 ADD (13th surface, D-03 YAML manifest)
     ```
  5. Run biome preempt: `pnpm exec biome check --write src/types/schemaVersion.ts`
  6. Run typecheck: `pnpm typecheck`
- **acceptance_criteria**:
  - `grep -cE "harnessed\\.\\w+\\.v1" src/types/schemaVersion.ts` ≥ 13 (was 11 post-W0-T0.5-backfill baseline + 2 W1 double-add = 13 final)
  - `grep -q "aliases: 'harnessed.aliases.v1'" src/types/schemaVersion.ts` exit 0
  - `grep -q "knownGood: 'harnessed.known-good.v1'" src/types/schemaVersion.ts` exit 0
  - `grep -E "Type\.Literal\(SCHEMA_VERSIONS\.aliases\)|Type\.Literal\(SCHEMA_VERSIONS\.knownGood\)" src/types/schemaVersion.ts | wc -l` ≥ 2
  - `wc -l src/types/schemaVersion.ts` ≤ 90 (was 80, +~6L)
  - `pnpm typecheck` exit 0 (no type error)
- **decision_source**: KICKOFF carry-forward + W0.3 decision doc + RESEARCH § 5.2 verbatim + PATTERNS § 1 row 10 + sister Phase 3.2 W1 T1.1 9+10 双加 precedent

### T1.2 — src/manifest/schema/aliases.v1.ts NEW ≤40L (D-01 RICH TypeBox 12th surface)

- **files_modified**: `src/manifest/schema/aliases.v1.ts` (NEW ~35-40L TypeBox AliasEntryV1 + AliasesV1 + Static export)
- **read_first**:
  - `src/workflow/schema/governance.ts` (by Read — sister Phase 3.2 W1 T1.3 10th surface TypeBox shape direct analog for AliasEntryV1)
  - `src/manifest/schema/spec.ts` L1-50 (by Read — sister manifest-domain TypeBox pattern + additionalProperties:false strict + pattern regex 范本)
  - `src/types/schemaVersion.ts` (by Read post-T1.1 — verify SCHEMA_VERSIONS.aliases entry exists)
  - `.planning/phase-3.3/RESEARCH.md` § 2.1 (TypeBox recipe verbatim — offset 273 limit 50)
  - `.planning/phase-3.3/PATTERNS.md` § 2.4 (concrete code excerpt verbatim)
  - `.planning/phase-3.3/CONTEXT.md` L48-66 (D-01 RICH schema spec verbatim from user decision)
- **action**:
  1. Create NEW file `src/manifest/schema/aliases.v1.ts` with content per PATTERNS § 2.4 verbatim + RESEARCH § 2.1 verbatim:
     ```typescript
     // src/manifest/schema/aliases.v1.ts — Phase 3.3 W1 T1.2 (D-01 RICH 12th surface).
     // Sister Phase 3.2 W1 T1.3 (governance.ts TypeBox shape direct analog).
     // RICH schema rejected FLAT (失 metadata) + TIERED (Karpathy YAGNI violation).
     // Manifest-domain colocation: src/manifest/schema/ (sister spec.ts + metadata.ts
     // existing manifest-domain schemas). Per W0.3 decision doc colocation rule.
     // ISO-date `pattern` NOT `format: 'date'` (Phase 3.2 W2 Rule 1 lesson:
     // FormatRegistry.Set not registered project-wide; `pattern` is zero-config
     // equivalent + sister governance.ts vetoed_at pattern precedent — but here
     // we use pattern instead of format because format requires FormatRegistry register).

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
  2. Run biome preempt + typecheck
- **acceptance_criteria**:
  - `test -f src/manifest/schema/aliases.v1.ts` exit 0
  - `wc -l src/manifest/schema/aliases.v1.ts` ≤ 40 (Karpathy hard limit per CONTEXT spec)
  - `grep -q "Type.Record" src/manifest/schema/aliases.v1.ts` exit 0
  - `grep -q "additionalProperties: false" src/manifest/schema/aliases.v1.ts` exit 0 (strict)
  - `grep -E "pattern: '\\^\\\\d\\{4\\}-\\\\d\\{2\\}-\\\\d\\{2\\}\\\$'" src/manifest/schema/aliases.v1.ts | wc -l` ≥ 2 (deprecation_date + removal_date ISO pattern)
  - `! grep -E "FormatRegistry|format: 'date'|format: \"date\"" src/manifest/schema/aliases.v1.ts` exit 0 (NEGATIVE — TypeBox W2 Rule 1 lesson 守门)
  - `grep -q "SCHEMA_VERSIONS.aliases" src/manifest/schema/aliases.v1.ts` exit 0 (CD-5 single 兼容门)
  - `grep -q "maxLength: 500" src/manifest/schema/aliases.v1.ts` exit 0 (reason DOS cap)
  - `pnpm typecheck` exit 0
- **decision_source**: D-01 RICH + RESEARCH § 2.1 verbatim + PATTERNS § 2.4 verbatim + sister Phase 3.2 W1 T1.3 governance.ts pattern

### T1.3 — src/manifest/schema/known-good.v1.ts NEW ≤45L (D-03 YAML manifest TypeBox 13th surface)

- **files_modified**: `src/manifest/schema/known-good.v1.ts` (NEW ~40-45L TypeBox PinnedUpstream + KnownGoodV1 + Static export)
- **read_first**:
  - `src/manifest/schema/aliases.v1.ts` (by Read — just-created sister 12th surface schema for pattern consistency)
  - `src/manifest/schema/spec.ts` L150-200 (by Read — sister outer SpecSchema strict pattern)
  - `.planning/phase-3.3/RESEARCH.md` § 4.2 (TypeBox recipe verbatim — offset 510 limit 30)
  - `.planning/phase-3.3/PATTERNS.md` § 2.5 (concrete code excerpt verbatim)
  - `.planning/phase-3.3/CONTEXT.md` L104-117 (D-03 schema spec verbatim from user decision)
- **action**:
  1. Create NEW file `src/manifest/schema/known-good.v1.ts` with content per PATTERNS § 2.5 verbatim + RESEARCH § 4.2 verbatim:
     ```typescript
     // src/manifest/schema/known-good.v1.ts — Phase 3.3 W1 T1.3 (D-03 YAML manifest 13th surface).
     // Sister Phase 3.2 W1 T1.3 (governance.ts) + sister T1.2 aliases.v1.ts shape.
     // YAML manifest rejected JSON (项目未用 npm-lock + yaml convention) + Embed-in-
     // manifest (跨 manifest agg 难, R7.6 "harnessed 版本冻结一组" scope mismatch).
     // Manifest-domain colocation: src/manifest/schema/. install_method 字符串非 enum
     // (Karpathy YAGNI 防 schema drift 加耦 — Phase 2.X 6 install method 可能继续扩;
     // sister spec.ts InstallType union 仅作 doc reference 不强 link).

     import { type Static, Type } from '@sinclair/typebox'
     import { SCHEMA_VERSIONS } from '../../types/schemaVersion.js'

     export const PinnedUpstream = Type.Object(
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
         e2e_verified_at: Type.String({ pattern: '^\\d{4}-\\d{2}-\\d{2}$' }), // ISO date pattern
         upstreams: Type.Array(PinnedUpstream),
       },
       { additionalProperties: false },
     )

     export type PinnedUpstreamType = Static<typeof PinnedUpstream>
     export type KnownGoodV1Type = Static<typeof KnownGoodV1>
     ```
  2. Run biome preempt + typecheck
- **acceptance_criteria**:
  - `test -f src/manifest/schema/known-good.v1.ts` exit 0
  - `wc -l src/manifest/schema/known-good.v1.ts` ≤ 45 (Karpathy hard limit per CONTEXT spec)
  - `grep -q "Type.Array(PinnedUpstream)" src/manifest/schema/known-good.v1.ts` exit 0
  - `grep -q "additionalProperties: false" src/manifest/schema/known-good.v1.ts` exit 0
  - `grep -q "SCHEMA_VERSIONS.knownGood" src/manifest/schema/known-good.v1.ts` exit 0
  - `! grep -E "FormatRegistry|format: 'date'|format: \"date\"" src/manifest/schema/known-good.v1.ts` exit 0 (NEGATIVE — W2 Rule 1 lesson)
  - `grep -E "pattern: '\\^\\\\d\\+\\\\\\.\\\\d\\+\\\\\\.\\\\d\\+\\\$'" src/manifest/schema/known-good.v1.ts | wc -l` ≥ 1 (semver pattern present)
  - `pnpm typecheck` exit 0
- **decision_source**: D-03 YAML manifest + RESEARCH § 4.2 verbatim + PATTERNS § 2.5 verbatim + sister T1.2 aliases.v1.ts pattern

### T1.4 — src/manifest/aliases.ts NEW ≤40L (loadAliases + resolveAlias + listDeprecations)

- **files_modified**: `src/manifest/aliases.ts` (NEW ~35-40L)
- **read_first**:
  - `src/checkpoint/state.ts` L23-41 (by Read — sister fail-soft read pattern 直接 analog)
  - `src/manifest/validate.ts` (by Read — sister yaml.parse + Value.Check pattern)
  - `src/manifest/schema/aliases.v1.ts` (by Read post-T1.2 — verify exports AliasesV1 + AliasesV1Type)
  - `.planning/phase-3.3/RESEARCH.md` § 2.3 (loader recipe verbatim — offset 333 limit 50)
  - `.planning/phase-3.3/PATTERNS.md` § 2.2 (concrete code excerpt verbatim — adapted: yaml.parse instead of JSON.parse)
- **action**:
  1. Create NEW file `src/manifest/aliases.ts` per RESEARCH § 2.3 verbatim:
     ```typescript
     // src/manifest/aliases.ts — Phase 3.3 W1 T1.4 — D-01 RICH consumer.
     // Sister src/manifest/validate.ts (yaml.parse + Value.Check) + sister
     // src/checkpoint/state.ts L23-41 (fail-soft read pattern).
     // Memoized 1-read per process (Karpathy YAGNI, only pay cost on doctor 7th
     // check OR install path resolveAlias call). yaml.parse via existing project
     // yaml lib (sister src/manifest/validate.ts convention).

     import { existsSync, readFileSync } from 'node:fs'
     import { join } from 'node:path'
     import { Value } from '@sinclair/typebox/value'
     import { parse } from 'yaml'
     import { AliasesV1, type AliasesV1Type } from './schema/aliases.v1.js'

     const ALIASES_PATH = join(process.cwd(), 'manifests', 'aliases.yaml')

     let _cached: AliasesV1Type | null = null

     /** Load aliases.yaml once per process (memoized). Returns null if file absent.
      *  Throws Karpathy fail-loud Error on schema invalid (debug locality). */
     export function loadAliases(): AliasesV1Type | null {
       if (_cached) return _cached
       if (!existsSync(ALIASES_PATH)) return null
       const raw = readFileSync(ALIASES_PATH, 'utf8')
       const parsed = parse(raw) as unknown
       if (!Value.Check(AliasesV1, parsed)) {
         const errs = [...Value.Errors(AliasesV1, parsed)].slice(0, 3)
         throw new Error(`aliases.yaml schema invalid: ${errs.map((e) => `${e.path} ${e.message}`).join('; ')}`)
       }
       _cached = parsed
       return parsed
     }

     /** Resolve old → new name redirect; returns null if no alias for the name. */
     export function resolveAlias(name: string): string | null {
       const a = loadAliases()
       return a?.aliases?.[name]?.redirect ?? null
     }

     /** List all deprecated entries (consumer: doctor 7th check). */
     export function listDeprecations(): Array<{ old: string; entry: AliasesV1Type['aliases'][string] }> {
       const a = loadAliases()
       if (!a) return []
       return Object.entries(a.aliases).map(([old, entry]) => ({ old, entry }))
     }
     ```
  2. Run biome preempt + typecheck
- **acceptance_criteria**:
  - `test -f src/manifest/aliases.ts` exit 0
  - `wc -l src/manifest/aliases.ts` ≤ 40 (Karpathy hard limit per CONTEXT spec)
  - `grep -E "export function (loadAliases|resolveAlias|listDeprecations)" src/manifest/aliases.ts | wc -l` ≥ 3 (3 exports)
  - `grep -q "ALIASES_PATH.*manifests.*aliases\.yaml" src/manifest/aliases.ts` exit 0 (path constant correct)
  - `grep -q "Value.Check(AliasesV1" src/manifest/aliases.ts` exit 0 (schema validate)
  - `grep -q "throw new Error" src/manifest/aliases.ts` exit 0 (Karpathy fail-loud on schema invalid)
  - `pnpm typecheck` exit 0
- **decision_source**: D-01 RICH + RESEARCH § 2.3 verbatim + PATTERNS § 2.2 verbatim + sister state.ts L23-41 fail-soft read pattern

### T1.5 — src/manifest/knownGood.ts NEW ≤45L (loadKnownGood + getPinnedVersion lazy per-version cache)

- **files_modified**: `src/manifest/knownGood.ts` (NEW ~40-45L)
- **read_first**:
  - `src/manifest/aliases.ts` (by Read post-T1.4 — sister pattern just created)
  - `src/manifest/schema/known-good.v1.ts` (by Read post-T1.3 — verify exports KnownGoodV1 + KnownGoodV1Type)
  - `.planning/phase-3.3/RESEARCH.md` § 4.4 (loader recipe verbatim — offset 575 limit 45)
  - `.planning/phase-3.3/PATTERNS.md` § 2.3 (concrete code excerpt verbatim)
- **action**:
  1. Create NEW file `src/manifest/knownGood.ts` per RESEARCH § 4.4 verbatim:
     ```typescript
     // src/manifest/knownGood.ts — Phase 3.3 W1 T1.5 — D-03 YAML manifest consumer.
     // Sister src/manifest/aliases.ts (fail-soft read + Value.Check + memoize).
     // Path: versions/<harnessed-ver>-known-good.yaml (sister manifests/tools/
     // <name>.yaml install.ts L66 path 范式). Lazy read per-harnessed-ver
     // (Karpathy YAGNI per planner CONTEXT Discretion lock — only pay cost when
     // --known-good flag triggers consume).

     import { existsSync, readFileSync } from 'node:fs'
     import { join } from 'node:path'
     import { Value } from '@sinclair/typebox/value'
     import { parse } from 'yaml'
     import { KnownGoodV1, type KnownGoodV1Type } from './schema/known-good.v1.js'

     const versionsDir = (): string => join(process.cwd(), 'versions')

     const _cache = new Map<string, KnownGoodV1Type | null>()

     /** Load versions/<harnessedVer>-known-good.yaml; memoized per harnessedVer.
      *  Returns null if file absent. Throws Karpathy fail-loud on schema invalid. */
     export function loadKnownGood(harnessedVer: string): KnownGoodV1Type | null {
       if (_cache.has(harnessedVer)) return _cache.get(harnessedVer) ?? null
       const path = join(versionsDir(), `${harnessedVer}-known-good.yaml`)
       if (!existsSync(path)) {
         _cache.set(harnessedVer, null)
         return null
       }
       const raw = readFileSync(path, 'utf8')
       const parsed = parse(raw) as unknown
       if (!Value.Check(KnownGoodV1, parsed)) {
         const errs = [...Value.Errors(KnownGoodV1, parsed)].slice(0, 3)
         throw new Error(`${path} schema invalid: ${errs.map((e) => `${e.path} ${e.message}`).join('; ')}`)
       }
       _cache.set(harnessedVer, parsed)
       return parsed
     }

     /** Get pinned version for an upstream name + harnessed version. */
     export function getPinnedVersion(upstreamName: string, harnessedVer: string): string | null {
       const kg = loadKnownGood(harnessedVer)
       if (!kg) return null
       const entry = kg.upstreams.find((u) => u.name === upstreamName)
       return entry?.version ?? null
     }
     ```
  2. Run biome preempt + typecheck
- **acceptance_criteria**:
  - `test -f src/manifest/knownGood.ts` exit 0
  - `wc -l src/manifest/knownGood.ts` ≤ 45 (Karpathy hard limit per CONTEXT spec)
  - `grep -E "export function (loadKnownGood|getPinnedVersion)" src/manifest/knownGood.ts | wc -l` ≥ 2 (2 exports)
  - `grep -q "new Map<string" src/manifest/knownGood.ts` exit 0 (per-version cache)
  - `grep -q "versions/" src/manifest/knownGood.ts` exit 0 OR `grep -q "versionsDir" src/manifest/knownGood.ts` exit 0 (path correct)
  - `grep -q "Value.Check(KnownGoodV1" src/manifest/knownGood.ts` exit 0
  - `pnpm typecheck` exit 0
- **decision_source**: D-03 YAML manifest + RESEARCH § 4.4 verbatim + PATTERNS § 2.3 verbatim + sister T1.4 aliases.ts pattern

### T1.6 — src/cli/lib/check-deprecations.ts NEW ≤40L PRIMARY helper (sister probe-gstack.ts pattern)

- **files_modified**: `src/cli/lib/check-deprecations.ts` (NEW ~35-40L PRIMARY helper)
- **read_first**:
  - `src/cli/lib/probe-gstack.ts` L1-48 (by Read — sister PRIMARY helper 100% pattern reuse)
  - `src/cli/doctor.ts` L1-30 (by Read — CheckResult interface definition source)
  - `src/manifest/aliases.ts` (by Read post-T1.4 — verify listDeprecations export available)
  - `.planning/phase-3.3/RESEARCH.md` § 3.2 (check-deprecations recipe verbatim — offset 415 limit 50)
  - `.planning/phase-3.3/PATTERNS.md` § 2.1 (concrete code excerpt verbatim — adapted)
- **action**:
  1. Create NEW file `src/cli/lib/check-deprecations.ts` per RESEARCH § 3.2 verbatim:
     ```typescript
     // src/cli/lib/check-deprecations.ts — Phase 3.3 W1 T1.6 — D-02 DOCTOR-ONLY-WARN
     // PRIMARY helper (sister Phase 3.2 W1 T1.4 probe-gstack.ts 48L sister-share
     // extract pattern for Karpathy ≤200L 守门 — keeps doctor.ts ≤200L). Lists
     // deprecated manifests by reading manifests/aliases.yaml (D-01 RICH schema)
     // + emits CheckResult for doctor 7th check warning output. Table format
     // multi-deprecation aggregation per Discretion locked (RESEARCH § 3.2 verbatim).
     // Karpathy hard limit ≤40L per sister probe-gstack ≤49L precedent.

     import { listDeprecations } from '../../manifest/aliases.js'

     export interface CheckResult {
       name: string
       status: 'pass' | 'warn' | 'fail'
       message: string
       fix?: string
     }

     /** Doctor 7th check: list deprecated manifests from aliases.yaml.
      *  D-02 DOCTOR-ONLY-WARN: status='warn' when deprecations exist (not 'fail')
      *  — install path silently redirects, doctor surface here is human-readable
      *  audit. Table format per RESEARCH § 3.3 (sister Phase 2.4 doctor --json
      *  checks array). */
     export function checkDeprecations(): CheckResult {
       try {
         const deprecations = listDeprecations()
         if (deprecations.length === 0) {
           return { name: 'deprecated manifests', status: 'pass', message: 'no deprecated manifests' }
         }
         const lines = deprecations.map(({ old, entry }) => {
           const removal = entry.removal_date ? `, removes ${entry.removal_date}` : ''
           return `  '${old}' → '${entry.redirect}' (since ${entry.since_version}, ${entry.deprecation_date}${removal}; ${entry.reason})`
         })
         return {
           name: 'deprecated manifests',
           status: 'warn',
           message: `${deprecations.length} deprecated manifest(s):\n${lines.join('\n')}`,
           fix: 'install paths auto-redirect; consider migrating manifest references to new names',
         }
       } catch (e) {
         return {
           name: 'deprecated manifests',
           status: 'fail',
           message: `aliases.yaml load error: ${(e as Error).message}`,
           fix: 'verify manifests/aliases.yaml schema (see docs/PROJECT-SPEC.md § R04 P2#13)',
         }
       }
     }
     ```
  2. Run biome preempt + typecheck
- **acceptance_criteria**:
  - `test -f src/cli/lib/check-deprecations.ts` exit 0
  - `wc -l src/cli/lib/check-deprecations.ts` ≤ 40 (Karpathy hard limit per CONTEXT spec)
  - `grep -q "export function checkDeprecations" src/cli/lib/check-deprecations.ts` exit 0
  - `grep -q "export interface CheckResult" src/cli/lib/check-deprecations.ts` exit 0
  - `grep -q "listDeprecations" src/cli/lib/check-deprecations.ts` exit 0 (consumer of aliases.ts)
  - `grep -E "'pass'|'warn'|'fail'" src/cli/lib/check-deprecations.ts | wc -l` ≥ 3 (3 status branches)
  - `grep -q "table\|lines.join" src/cli/lib/check-deprecations.ts` exit 0 (table format aggregation)
  - `grep -q "install paths auto-redirect" src/cli/lib/check-deprecations.ts` exit 0 (fix hint per RESEARCH verbatim)
  - `pnpm typecheck` exit 0
- **decision_source**: D-02 DOCTOR-ONLY-WARN + Discretion table aggregation locked + RESEARCH § 3.2 verbatim + PATTERNS § 2.1 verbatim + sister Phase 3.2 W1 T1.4 probe-gstack.ts PRIMARY helper extract pattern

### T1.7 — src/cli/doctor.ts MODIFY +5L (7th check checkDeprecations dispatch sister L138-142 100% reuse)

- **files_modified**: `src/cli/doctor.ts` (MODIFY +5L: NEW async function checkDeprecations dispatch +4L + results array push +1L + description string append +0L modify-in-place)
- **read_first**:
  - `src/cli/doctor.ts` L1-184 entire file (by Read — verify L138-142 checkGstackPrefix baseline + L150-157 results array + L139 description string)
  - `src/cli/lib/check-deprecations.ts` (by Read post-T1.6 — verify checkDeprecations export available)
  - `.planning/phase-3.3/RESEARCH.md` § 3.1 (doctor.ts MODIFY recipe verbatim — offset 384 limit 30)
  - `.planning/phase-3.3/PATTERNS.md` § 2.6 (doctor.ts MODIFY recipe verbatim)
- **action**:
  1. After `checkGstackPrefix` function (~L138-142), ADD NEW function `checkDeprecations` sister 100% reuse (~4L):
     ```typescript
     // Phase 3.3 W1 T1.7 ADD 7th check (D-02 DOCTOR-ONLY-WARN, sister L138-142 checkGstackPrefix 100% reuse):
     async function checkDeprecations(): Promise<CheckResult> {
       const { checkDeprecations: runCheck } = await import('./lib/check-deprecations.js')
       return runCheck()
     }
     ```
  2. Modify results array (~L150-157) — ADD 1 line at end (after `await checkGstackPrefix()`):
     ```typescript
     const results: CheckResult[] = [
       checkNodeVersion(),
       await checkMcpScope(),
       checkJq(),
       checkWinBash(),
       await checkOriginUrl(),
       await checkGstackPrefix(),
       await checkDeprecations(), // ← Phase 3.3 W1 T1.7 ADD 7th check (D-02 DOCTOR-ONLY-WARN)
     ]
     ```
  3. Update description string (~L139 area — search for "Preflight checks" string) to append 'deprecations':
     - PRE: `'Preflight checks (Node / MCP scope / jq / Win bash / origin URL / gstack prefix)'`
     - POST: `'Preflight checks (Node / MCP scope / jq / Win bash / origin URL / gstack prefix / deprecations)'`
  4. Run biome preempt + typecheck
  5. **Update Resolved (T1.7 doctor.ts wc gate)** block at task_plan.md top with outcome (PENDING → 实占: `wc -l src/cli/doctor.ts` = N value)
- **acceptance_criteria**:
  - `grep -q "checkDeprecations" src/cli/doctor.ts` exit 0
  - `grep -q "await checkDeprecations()" src/cli/doctor.ts` exit 0 (results array push)
  - `grep -q "deprecations" src/cli/doctor.ts` exit 0 (description string updated)
  - `wc -l src/cli/doctor.ts` ≤ 200 (Karpathy hard limit; expected 184 → ~189L)
  - `wc -l src/cli/doctor.ts | awk '{print $1}'` ≤ 195 (slightly stricter check — should NOT exceed +10L delta)
  - `pnpm typecheck` exit 0
  - `corepack pnpm test -- --run tests/cli/doctor.test.ts 2>&1 | tail -5 | grep -E "Tests.*passed"` exit 0 (existing doctor tests + 7th check additions pass)
- **decision_source**: D-02 DOCTOR-ONLY-WARN + RESEARCH § 3.1 verbatim + PATTERNS § 2.6 verbatim + sister Phase 3.2 W1 T1.5 6th check pattern

### T1.8 — src/cli/install.ts MODIFY +2L (resolveAlias pre-manifest-lookup 1-line surgical inject, D-02 silent redirect)

- **files_modified**: `src/cli/install.ts` (MODIFY +2L: BEFORE manifestPath resolve insert resolveAlias dynamic import + resolvedName assignment; REPLACE 5+ name → resolvedName references downstream)
- **read_first**:
  - `src/cli/install.ts` L46-117 (by Read — verify L46-56 commander option chain + L56 action handler + L57-64 H1 pre-action flag gate + L65-83 manifestPath resolve + chosenPath logic)
  - `src/manifest/aliases.ts` (by Read post-T1.4 — verify resolveAlias export available)
  - `.planning/phase-3.3/RESEARCH.md` § 8 (install resolveAlias inject location verbatim — offset 880 limit 60)
  - `.planning/phase-3.3/PATTERNS.md` § 2.7 (install.ts MODIFY recipe verbatim)
- **action**:
  1. After H1 pre-action flag gate (~L64), BEFORE L66 `const manifestPath = resolve(...)`, ADD 2 lines per RESEARCH § 8.1 verbatim:
     ```typescript
     // Phase 3.3 W1 T1.8 ADD — D-01 alias redirect (D-02 silent install, NO console output per R7.5 验收 "install 通过" 语义对齐)
     const { resolveAlias } = await import('../manifest/aliases.js')
     const resolvedName = resolveAlias(name) ?? name
     ```
  2. REPLACE ALL `name` → `resolvedName` in DOWNSTREAM references (L66+L67 path constructions + L74 readFile error path + L77-78 error message + L79 fix message):
     ```typescript
     const manifestPath = resolve(process.cwd(), `manifests/tools/${resolvedName}.yaml`)
     const skillPackPath = resolve(process.cwd(), `manifests/skill-packs/${resolvedName}.yaml`)
     // ... existing readFile try-catch ...
     console.error(
       `error: manifest '${resolvedName}' not found\n` +
         `  fix:  ensure manifests/tools/${resolvedName}.yaml or manifests/skill-packs/${resolvedName}.yaml exists`,
     )
     ```
  3. Keep the original `name` parameter intact in the action signature (it's the user input); `resolvedName` is the resolved value used internally
  4. **D-02 守门**: NO `console.warn` or `console.log` 含 'redirect|deprecated|warning' substring anywhere in install path (silent redirect locked)
  5. Run biome preempt + typecheck
- **acceptance_criteria**:
  - `grep -q "resolveAlias" src/cli/install.ts` exit 0
  - `grep -q "const resolvedName = resolveAlias" src/cli/install.ts` exit 0 (1-line surgical inject)
  - `grep -E "manifests/tools/\\\${resolvedName}|manifests/skill-packs/\\\${resolvedName}" src/cli/install.ts | wc -l` ≥ 2 (downstream replacement)
  - `! grep -E "console\.(warn|log).*(redirect|deprecated|warning)" src/cli/install.ts` exit 0 (D-02 silent redirect 守门)
  - `pnpm typecheck` exit 0
  - **D-02 守门 (early检测)**: `! grep -E "console\.warn.*name|console\.log.*redirect" src/cli/install.ts` exit 0
- **decision_source**: D-01 + D-02 DOCTOR-ONLY-WARN + RESEARCH § 8.1 verbatim pre-lookup 1-line surgical + PATTERNS § 2.7 verbatim

### T1.9 — src/cli/install.ts MODIFY +8L (--known-good commander option + RawOpts + lazy import + npm_version override)

- **files_modified**: `src/cli/install.ts` (MODIFY +8L: commander .option + RawOpts knownGood field + lazy import block + npm_version override)
- **read_first**:
  - `src/cli/install.ts` L46-117 (post-T1.8 — verify resolveAlias inject + L92-99 InstallOpts construction + L99 後 runInstall call site)
  - `src/manifest/knownGood.ts` (by Read post-T1.5 — verify getPinnedVersion export available)
  - `.planning/phase-3.3/RESEARCH.md` § 4.3 (--known-good flag commander integration verbatim — offset 542 limit 30)
  - `.planning/phase-3.3/PATTERNS.md` § 1 row 9 + § 2.7 (install.ts --known-good integration mapping)
- **action**:
  1. Add commander option (after L55 existing `--no-color` option line):
     ```typescript
     .option('--known-good', 'use known-good version lock from versions/<harnessed-ver>-known-good.yaml')
     ```
  2. Add field to RawOpts interface (L30-37):
     ```typescript
     interface RawOpts {
       apply?: boolean
       dryRun?: boolean
       system?: boolean
       nonInteractive?: boolean
       fullDiff?: boolean
       color?: boolean
       knownGood?: boolean  // ← Phase 3.3 W1 T1.9 ADD
     }
     ```
  3. After L99 (`const opts: InstallOpts = { ... }` complete) and BEFORE L100 `const result = await runInstall(v.manifest, opts)`, ADD lazy --known-good consume block per RESEARCH § 4.3 verbatim:
     ```typescript
     // Phase 3.3 W1 T1.9 ADD — D-03 known-good lock consume (lazy load only when flag set per Karpathy YAGNI Discretion lock)
     if (raw.knownGood) {
       const { getPinnedVersion } = await import('../manifest/knownGood.js')
       const harnessedVer = '0.3.0' // TODO Phase 3.4: read from package.json
       const pinned = getPinnedVersion(v.manifest.metadata.name, harnessedVer)
       if (pinned && v.manifest.spec.install.method === 'npm-cli') {
         ;(v.manifest.spec.install as { npm_version?: string }).npm_version = pinned
       }
     }
     ```
  4. Run biome preempt + typecheck
  5. **Update Resolved (T1.9 install.ts wc gate)** block at task_plan.md top with outcome (PENDING → 实占: `wc -l src/cli/install.ts` = N value)
- **acceptance_criteria**:
  - `grep -q "'--known-good'" src/cli/install.ts` exit 0 (commander option)
  - `grep -q "knownGood\?: boolean" src/cli/install.ts` exit 0 (RawOpts field)
  - `grep -q "if (raw.knownGood)" src/cli/install.ts` exit 0 (lazy gate)
  - `grep -q "getPinnedVersion" src/cli/install.ts` exit 0 (consume)
  - `grep -q "harnessedVer = '0.3.0'" src/cli/install.ts` exit 0 (hardcoded version per T1.9 spec — DEFERRED #AD Phase 3.4 reads from package.json)
  - `grep -q "npm_version = pinned" src/cli/install.ts` exit 0 (override field)
  - `wc -l src/cli/install.ts` ≤ 200 (Karpathy hard limit; expected 117 → ~127L post-T1.8+T1.9 combined)
  - `pnpm typecheck` exit 0
- **decision_source**: D-03 YAML manifest + Claude's Discretion #1 lazy load locked + RESEARCH § 4.3 verbatim + PATTERNS § 1 row 9 + § 2.7

### T1.10 — manifests/aliases.yaml NEW empty seed (D-01 MVP)

- **files_modified**: `manifests/aliases.yaml` (NEW ~10L empty seed)
- **read_first**:
  - `manifests/skill-packs/gstack.yaml` (by Read — sister yaml schema comment line + 2-space indent convention)
  - `manifests/tools/ctx7.yaml` (by Read — sister manifest yaml shape reference)
  - `.planning/phase-3.3/RESEARCH.md` § 2.2 (aliases.yaml MVP seed recipe verbatim — offset 316 limit 20)
  - `.planning/phase-3.3/PATTERNS.md` § 1 row 6 (yaml seed mapping)
- **action**:
  1. Create NEW file `manifests/aliases.yaml` per RESEARCH § 2.2 verbatim:
     ```yaml
     # manifests/aliases.yaml — Phase 3.3 R7.5 deprecation marker + upstream rename redirect
     # Phase 3.3 MVP empty seed; Phase 3.4 dogfood adds first actual deprecation entries.
     # Schema: src/manifest/schema/aliases.v1.ts (12th surface)
     #
     # Example entry shape (commented for reference, uncomment + populate when needed):
     # old-package-name:
     #   redirect: new-package-name
     #   reason: upstream renamed (v2.0 rebrand)
     #   since_version: '0.3.0'
     #   deprecation_date: '2026-05-17'
     #   removal_date: '2026-12-31'  # optional, 长尾窗口

     schemaVersion: harnessed.aliases.v1
     aliases: {}
     ```
- **acceptance_criteria**:
  - `test -f manifests/aliases.yaml` exit 0
  - `grep -q "harnessed.aliases.v1" manifests/aliases.yaml` exit 0
  - `grep -q "aliases: {}" manifests/aliases.yaml` exit 0 (empty Record MVP)
  - `wc -l manifests/aliases.yaml` ≥ 5 ≤ 25 (MVP seed range)
- **decision_source**: D-01 + Discretion 推 empty seed locked + RESEARCH § 2.2 verbatim

### T1.11 — versions/0.3.0-known-good.yaml NEW empty seed (D-03 MVP + NEW versions/ 顶层 dir)

- **files_modified**: `versions/0.3.0-known-good.yaml` (NEW ~10L empty seed) + NEW versions/ 顶层 dir
- **read_first**:
  - `manifests/skill-packs/gstack.yaml` (by Read — sister yaml convention)
  - `.planning/phase-3.3/RESEARCH.md` § 4.1 (known-good.yaml MVP seed recipe verbatim — offset 495 limit 15)
  - `.planning/phase-3.3/PATTERNS.md` § 1 row 7 (yaml seed mapping)
- **action**:
  1. Create NEW directory `versions/` (顶层 sister manifests/ 平级):
     ```bash
     mkdir -p versions
     ```
  2. Create NEW file `versions/0.3.0-known-good.yaml` per RESEARCH § 4.1 verbatim:
     ```yaml
     # versions/0.3.0-known-good.yaml — Phase 3.3 R7.6 MVP seed
     # Phase 3.4 dogfood fills upstreams with actual e2e-verified pinned versions
     # (e.g., claude-agent-sdk@0.3.142, gstack@1.5.0, etc).
     # Schema: src/manifest/schema/known-good.v1.ts (13th surface)

     schemaVersion: harnessed.known-good.v1
     harnessed_version: '0.3.0'
     e2e_verified_at: '2026-05-17'  # placeholder; Phase 3.4 updates with actual e2e date
     upstreams: []  # Phase 3.4 dogfood adds: [{name: 'claude-agent-sdk', version: '...', install_method: 'npm-cli'}, ...]
     ```
- **acceptance_criteria**:
  - `test -d versions` exit 0 (NEW dir)
  - `test -f versions/0.3.0-known-good.yaml` exit 0
  - `grep -q "harnessed.known-good.v1" versions/0.3.0-known-good.yaml` exit 0
  - `grep -q "harnessed_version: '0.3.0'" versions/0.3.0-known-good.yaml` exit 0
  - `grep -q "upstreams: \\[\\]" versions/0.3.0-known-good.yaml` exit 0 (empty Array MVP)
  - `wc -l versions/0.3.0-known-good.yaml` ≥ 5 ≤ 20
- **decision_source**: D-03 YAML manifest + Discretion #4 推 ship 1 file empty + RESEARCH § 4.1 verbatim

### T1.12 — Wave 1 test files NEW × 5 + MODIFY × 3 (~38 NEW fixture)

- **files_modified**:
  - `tests/manifest/schema/aliases-v1.test.ts` NEW ~50L (4 fixture contract)
  - `tests/manifest/schema/known-good-v1.test.ts` NEW ~50L (4 fixture contract)
  - `tests/manifest/aliases.test.ts` NEW ~60L (5 fixture functional + failure-mode)
  - `tests/manifest/knownGood.test.ts` NEW ~60L (5 fixture functional + failure-mode)
  - `tests/cli/check-deprecations.test.ts` NEW ~50L (5 fixture functional)
  - `tests/unit/types-schemaVersion.test.ts` MODIFY +~5L (2 new fixture: 13-surface count + 2 new register aliases + knownGood)
  - `tests/cli/doctor.test.ts` MODIFY +~10L (1 new fixture: 7th check dispatch returns CheckResult name='deprecated manifests')
  - `tests/cli/doctor-fixtures.test.ts` MODIFY +~10L (1 new fixture: 7th check parametrize 加入 6-check fixtures)
- **read_first**:
  - `tests/checkpoint/state.test.ts` (by Read — sister vi.mock('node:fs/promises') + Value.Check assert pattern for aliases.test.ts + knownGood.test.ts)
  - `tests/cli/doctor.test.ts` L1-50 (by Read — verify mock setup baseline)
  - `tests/cli/doctor-fixtures.test.ts` (by Read — sister 6-check parametrize pattern)
  - `tests/unit/types-schemaVersion.test.ts` (by Read — verify surface count assertion pattern)
  - `.planning/phase-3.3/RESEARCH.md` § 10.1 + § 10.3 (test count target per dimension + Wave 0 gaps)
  - `.planning/phase-3.3/PATTERNS.md` § 1 row 15 + 16 + 17 (test sister mappings)
- **action**:
  1. **tests/manifest/schema/aliases-v1.test.ts NEW** — 4 fixture per RESEARCH § 10.1 contractual dimension:
     - fixture 1: valid AliasesV1 with 1 entry → Value.Check returns true
     - fixture 2: missing required field (e.g. `since_version` absent) → Value.Check returns false
     - fixture 3: extra field (e.g. `random_field: '...'`) → Value.Check returns false (additionalProperties:false strict)
     - fixture 4: invalid ISO-date pattern (`deprecation_date: 'not-a-date'`) → Value.Check returns false
  2. **tests/manifest/schema/known-good-v1.test.ts NEW** — 4 fixture: valid / missing required / extra field reject / invalid semver harnessed_version reject
  3. **tests/manifest/aliases.test.ts NEW** — 5 fixture per RESEARCH § 10.3:
     - fixture 1: file missing → loadAliases returns null fail-soft
     - fixture 2: empty `aliases: {}` record → loadAliases returns valid + resolveAlias('any') returns null
     - fixture 3: 1-entry aliases → loadAliases returns valid + resolveAlias('old-name') returns 'new-name'
     - fixture 4: resolveAlias unknown name → returns null (caller `?? name` fallback)
     - fixture 5: corrupt yaml OR schema drift → loadAliases throws fail-loud Error (含 Value.Errors path excerpt)
  4. **tests/manifest/knownGood.test.ts NEW** — 5 fixture: file missing → null / empty upstreams:[] → null pinned / 3-entry getPinnedVersion hit / unknown upstream → null / schema drift → throw
  5. **tests/cli/check-deprecations.test.ts NEW** — 5 fixture (vi.mock listDeprecations OR seed real aliases.yaml fixture file): missing → pass / empty → pass / 1 deprecation → warn + message contains old/new / 3 deprecations → warn + table multi-line / load error → fail + fix hint
  6. **tests/unit/types-schemaVersion.test.ts MODIFY** — add fixture: assert SCHEMA_VERSIONS has 'aliases' + 'knownGood' keys; assert Value.Check on test object with `schemaVersion: 'harnessed.aliases.v1'` passes SchemaVersionLiteral validation; `grep -cE "harnessed\\.\\w+\\.v1"` returns count ≥ 13
  7. **tests/cli/doctor.test.ts MODIFY** — add fixture: assert doctor results array has 7 entries (was 6); assert 7th entry name === 'deprecated manifests'; assert doctor exit code 0 when 7th status is 'warn' (B-06 warn ≠ fail)
  8. **tests/cli/doctor-fixtures.test.ts MODIFY** — add 7th check to parametrize array (sister 6-check pattern)
  9. Run biome preempt + run all new tests:
     ```bash
     pnpm exec biome check --write tests/manifest/ tests/cli/check-deprecations.test.ts tests/cli/doctor.test.ts tests/cli/doctor-fixtures.test.ts tests/unit/types-schemaVersion.test.ts
     corepack pnpm test -- --run tests/manifest/ tests/cli/check-deprecations.test.ts tests/cli/doctor.test.ts tests/cli/doctor-fixtures.test.ts tests/unit/types-schemaVersion.test.ts 2>&1 | tail -10
     ```
- **acceptance_criteria**:
  - `test -f tests/manifest/schema/aliases-v1.test.ts && test -f tests/manifest/schema/known-good-v1.test.ts && test -f tests/manifest/aliases.test.ts && test -f tests/manifest/knownGood.test.ts && test -f tests/cli/check-deprecations.test.ts` exit 0 (5 NEW files)
  - `corepack pnpm test -- --run tests/manifest/ tests/cli/check-deprecations.test.ts 2>&1 | tail -3 | grep -E "Tests.*passed"` exit 0 (all 5 NEW test files pass)
  - `corepack pnpm test -- --run tests/cli/doctor.test.ts tests/cli/doctor-fixtures.test.ts tests/unit/types-schemaVersion.test.ts 2>&1 | tail -3 | grep -E "Tests.*passed"` exit 0 (MODIFY tests pass with new fixtures)
  - `corepack pnpm test 2>&1 | tail -5 | grep -E "Tests.*passed.*0 failed"` exit 0 OR full suite green
  - `grep -cE "it\\(.*aliases\\.v1|it\\(.*AliasesV1" tests/manifest/schema/aliases-v1.test.ts` ≥ 4 (4 fixtures)
  - `grep -cE "it\\(.*known-good|it\\(.*KnownGoodV1" tests/manifest/schema/known-good-v1.test.ts` ≥ 4 (4 fixtures)
- **decision_source**: RESEARCH § 10.1 + § 10.3 verbatim + PATTERNS § 1 row 15-17 + sister Phase 3.2 W1 T1.8 5-test-file pattern

---

## Wave 2 — E2E integration (R7.5 + R7.6 acceptance) + observability + security + ADR + STATE/RETRO/ROADMAP + A7 + ship tags (9 sub-tasks)

### T2.1 — tests/integration/install-aliases.test.ts NEW 3 fixture e2e (R7.5 验收 "模拟上游改名场景 install 通过")

- **files_modified**: `tests/integration/install-aliases.test.ts` (NEW ~80L 3 fixture)
- **read_first**:
  - `tests/cli/install.test.ts` (by Read — sister CLI test pattern + spawnSync exec invocation)
  - `manifests/tools/ctx7.yaml` (by Read — sister real manifest for redirect target fixture)
  - `.planning/phase-3.3/RESEARCH.md` § 10 (integration test count target + R7.5 acceptance fixture design)
- **action**:
  1. Create NEW file `tests/integration/install-aliases.test.ts` with 3 fixture per W2 § T2.1:
     - **fixture 1 rename redirect e2e** — setup: write fixture `manifests/aliases.yaml` containing `{old-package-name: {redirect: 'ctx7', reason: 'rename test', since_version: '0.3.0', deprecation_date: '2026-05-17'}}` (real existing manifest ctx7.yaml = redirect target); run via `spawnSync(process.execPath, ['./dist/cli.js', 'install', 'old-package-name', '--dry-run', '--non-interactive'], {...})`; assert exit code 0; assert stdout/stderr combined references 'ctx7' (the redirect target) NOT 'old-package-name' in path output
     - **fixture 2 unknown name + no alias** — setup: write fixture aliases.yaml with empty `aliases: {}`; run install with 'nonexistent-name --dry-run --non-interactive'; assert exit code 1; assert stderr contains 'manifest .* not found' (Karpathy fail-loud)
     - **fixture 3 alias 存在但 redirect target manifest 缺** — setup: write fixture aliases.yaml `{some-old: {redirect: 'missing-manifest-xyz', ...}}`; run install with 'some-old --dry-run --non-interactive'; assert exit code 1; assert stderr contains 'manifest .* not found' (fail-loud NOT crash)
  2. Use tmpdir + cwd isolation pattern (sister Phase 3.2 integration tests + tests/scripts/dashboard-sse.test.ts beforeAll tmpRoot pattern)
  3. Run biome preempt + run test
  4. **Update Resolved (T2.1)** block with outcome
- **acceptance_criteria**:
  - `test -f tests/integration/install-aliases.test.ts` exit 0
  - `corepack pnpm test -- --run tests/integration/install-aliases.test.ts 2>&1 | tail -3 | grep -E "Tests.*3 passed"` exit 0 (3 fixture pass)
  - `grep -cE "it\\(|test\\(" tests/integration/install-aliases.test.ts` ≥ 3 (3 fixtures)
  - `grep -q "old-package-name\\|missing-manifest" tests/integration/install-aliases.test.ts` exit 0 (fixture names)
- **decision_source**: R7.5 验收 "模拟上游改名场景 install 通过" + RESEARCH § 10.1 integration dimension

### T2.2 — tests/integration/install-known-good.test.ts NEW 2 fixture e2e (R7.6 验收 "harnessed install --known-good reproducible")

- **files_modified**: `tests/integration/install-known-good.test.ts` (NEW ~70L 2 fixture)
- **read_first**:
  - `tests/integration/install-aliases.test.ts` (post-T2.1 — sister integration test pattern)
  - `manifests/tools/ctx7.yaml` (by Read — verify npm-cli install method for fixture 1 override target)
  - `.planning/phase-3.3/RESEARCH.md` § 10.1 integration dimension
- **action**:
  1. Create NEW file `tests/integration/install-known-good.test.ts` with 2 fixture:
     - **fixture 1 lock hit** — setup: write fixture `versions/0.3.0-known-good.yaml` `{upstreams: [{name: 'ctx7', version: '99.99.99', install_method: 'npm-cli'}]}` (deliberately exotic version to distinguish from manifest default); run `spawnSync` install ctx7 --known-good --dry-run --non-interactive; assert exit code 0; assert stdout shows npm_version=99.99.99 OR references the pinned version override (not the manifest default version)
     - **fixture 2 lock miss** — setup: write fixture lock with `upstreams: []` empty; run install ctx7 --known-good --dry-run --non-interactive; assert exit code 0; assert stdout falls back to manifest default version (graceful, no error)
  2. Use tmpdir + cwd isolation pattern
  3. Run biome preempt + run test
- **acceptance_criteria**:
  - `test -f tests/integration/install-known-good.test.ts` exit 0
  - `corepack pnpm test -- --run tests/integration/install-known-good.test.ts 2>&1 | tail -3 | grep -E "Tests.*2 passed"` exit 0
  - `grep -cE "it\\(|test\\(" tests/integration/install-known-good.test.ts` ≥ 2
  - `grep -q "known-good\\|--known-good" tests/integration/install-known-good.test.ts` exit 0
- **decision_source**: R7.6 验收 "harnessed install --known-good reproducible" + RESEARCH § 10.1

### T2.3 — tests/integration/install-silent-redirect.test.ts NEW 1 fixture observability (D-02 守门)

- **files_modified**: `tests/integration/install-silent-redirect.test.ts` (NEW ~50L 1 fixture)
- **read_first**:
  - `tests/integration/install-aliases.test.ts` (post-T2.1 — sister fixture setup pattern)
- **action**:
  1. Create NEW file `tests/integration/install-silent-redirect.test.ts` with 1 fixture (D-02 守门):
     - setup: write fixture aliases.yaml `{old-name: {redirect: 'ctx7', reason: 'rename test', since_version: '0.3.0', deprecation_date: '2026-05-17'}}`
     - run: `spawnSync(process.execPath, ['./dist/cli.js', 'install', 'old-name', '--dry-run', '--non-interactive'], { ...captureStdout, captureStderr })`
     - assert exit code 0 (install succeeded silently with redirect)
     - **assert NOT 'redirect' substring** in combined stdout + stderr (case-insensitive)
     - **assert NOT 'deprecated' substring** in combined stdout + stderr
     - **assert NOT 'warning' substring** in combined stdout + stderr
     - assert stdout references 'ctx7' (redirect target installed successfully)
  2. Run biome preempt + run test
- **acceptance_criteria**:
  - `test -f tests/integration/install-silent-redirect.test.ts` exit 0
  - `corepack pnpm test -- --run tests/integration/install-silent-redirect.test.ts 2>&1 | tail -3 | grep -E "Tests.*1 passed"` exit 0
  - `grep -q "expect.*not\\..*toContain\\(.*redirect" tests/integration/install-silent-redirect.test.ts` exit 0 (negative assertion present)
  - `grep -q "expect.*not\\..*toContain\\(.*deprecated" tests/integration/install-silent-redirect.test.ts` exit 0
- **decision_source**: D-02 DOCTOR-ONLY-WARN install silent 守门 + RESEARCH § 10.1 observability dimension

### T2.4 — tests/manifest/aliases-security.test.ts + knownGood-security.test.ts NEW 3 fixture combined (STRIDE T-3.3-01 + T-3.3-03 + T-3.3-05)

- **files_modified**: `tests/manifest/aliases-security.test.ts` (NEW ~50L 2 fixture) + `tests/manifest/knownGood-security.test.ts` (NEW ~30L 1 fixture)
- **read_first**:
  - `.planning/phase-3.3/RESEARCH.md` § 10.4 (threat model fixture design verbatim)
  - PLAN.md `<threat_model>` section (T-3.3-01 path traversal + T-3.3-03 schema drift + T-3.3-05 injection)
- **action**:
  1. **aliases-security.test.ts** — 2 fixture per RESEARCH § 10.4 verbatim:
     - **fixture A1 path traversal redirect** — write aliases.yaml `{harmful: {redirect: '../../../etc/passwd', reason, since_version, deprecation_date}}` → Value.Check returns true (TypeBox 仅 length validate); BUT install.ts path resolve: assert Node `path.resolve('manifests/tools/${resolvedName}.yaml')` returns absolute path within cwd (not leak to /etc); test via direct call to install path resolution OR resolveAlias return value test (verify behavior even if not blocked at schema layer)
     - **fixture A2 schema drift extra field tampering** — aliases.yaml entry `{redirect, reason, since_version, deprecation_date, EXTRA_FIELD: 'malicious'}` → Value.Check returns false (additionalProperties:false strict reject) → loadAliases throws fail-loud
  2. **knownGood-security.test.ts** — 1 fixture:
     - **fixture K1 malicious harnessed_version** — known-good.yaml `{harnessed_version: 'rm -rf /'}` OR `'9.9.9.invalid'` → Value.Check semver pattern `^\\d+\\.\\d+\\.\\d+$` fail → loadKnownGood throws
  3. Run biome preempt + run tests
- **acceptance_criteria**:
  - `test -f tests/manifest/aliases-security.test.ts && test -f tests/manifest/knownGood-security.test.ts` exit 0
  - `corepack pnpm test -- --run tests/manifest/aliases-security.test.ts tests/manifest/knownGood-security.test.ts 2>&1 | tail -3 | grep -E "Tests.*3 passed"` exit 0 (3 fixture combined pass)
  - `grep -q "etc/passwd\\|path traversal" tests/manifest/aliases-security.test.ts` exit 0 (T-3.3-01)
  - `grep -q "EXTRA_FIELD\\|additionalProperties" tests/manifest/aliases-security.test.ts` exit 0 (T-3.3-03)
  - `grep -q "rm -rf\\|9\\.9\\.9\\.invalid" tests/manifest/knownGood-security.test.ts` exit 0 (T-3.3-05 pattern variant)
- **decision_source**: RESEARCH § 10.4 threat model fixture design + PLAN.md STRIDE threat register T-3.3-01 + T-3.3-03 + T-3.3-05

### T2.5 — docs/adr/0016-aliases-deprecation-known-good.md NEW 9 章节 errata (sister Phase 3.2 ADR 0015)

- **files_modified**: `docs/adr/0016-aliases-deprecation-known-good.md` (NEW ~150L 9 章节)
- **read_first**:
  - `docs/adr/0015-gstack-probe-interpolate-plan-feature.md` (by Read — sister Phase 3.2 ADR 9 章节 gold-standard 模板)
  - `docs/adr/0014-phase-3.1-checkpoint-engine.md` (by Read — sister 2nd 9 章节 ADR pattern)
  - All Wave 0+1+2 outputs (CONTEXT.md + RESEARCH.md + PATTERNS.md + STATE.md current + all 9 src files just created/modified)
- **action**:
  1. Create NEW file `docs/adr/0016-aliases-deprecation-known-good.md` with 9 章节 errata sister Phase 3.2 ADR 0015 模式:
     - **Header**: ADR 0016 - Phase 3.3 aliases.yaml + deprecation marker + known-good 版本组合 (Accepted YYYY-MM-DD)
     - **§ 1 D-01 RICH aliases**: 5 fields TypeBox schema + reason maxLength 500 DOS cap + ISO-date pattern lesson (NOT FormatRegistry)
     - **§ 2 D-02 DOCTOR-ONLY-WARN**: install silent redirect + doctor 7th check table format + R7.5 验收 "install 通过 + 提示" 两 surface 共同达成
     - **§ 3 D-03 YAML manifest known-good**: versions/0.3.0-known-good.yaml + lazy load Karpathy YAGNI + per-version cache
     - **§ 4 D-04 STATE COLLAPSE 5-recurrence terminus**: 4 prior recurrences (README L9 / L44 / PROJECT-SPEC / STATE freshness scope) + STATE_POSITION_RE OR-fallback gate extend
     - **§ 5 schemaVersion 12+13 surface manifest-domain colocation**: sister Phase 3.2 W0.3 workflow-domain + Phase 3.3 W0.3 manifest-domain colocation rule延续
     - **§ 6 install resolveAlias 1-line surgical pre-manifest-lookup**: Karpathy surgical exemplar per RESEARCH § 8.1
     - **§ 7 W0.2 dashboard-sse fix path (a) random port + DASHBOARD_PORT env**: sister Node `net.createServer({port:0})` MDN std + sister Phase 2.4 W4 Win 3-tier 8s waitFor
     - **§ 8 § 12 3-wave W0-W2 topology**: 25 atomic task + ~38 NEW fixture (sister Phase 3.2 4-wave 缩 1 因 scope 更小)
     - **§ 9 ASR/ADR-stats**: total ADRs 16 + this phase ASR count + cumulative milestone progress 3/4
- **acceptance_criteria**:
  - `test -f docs/adr/0016-aliases-deprecation-known-good.md` exit 0
  - `wc -l docs/adr/0016-aliases-deprecation-known-good.md` ≥ 100
  - `grep -cE "^## " docs/adr/0016-aliases-deprecation-known-good.md` ≥ 9 (9 章节 verify)
  - `grep -q "Accepted" docs/adr/0016-aliases-deprecation-known-good.md` exit 0 (status field)
- **decision_source**: sister Phase 3.2 ADR 0015 9 章节 format gold-standard

### T2.6 — .planning/STATE.md append Phase 3.3 SHIPPED event log + 12th 历史 entry + 当前位置 块更新

- **files_modified**: `.planning/STATE.md` (MODIFY — append to "已完成 phase ship 历史" section Phase 3.3 entry + update L21-27 当前位置 block to reflect Phase 3.3 SHIPPED)
- **read_first**:
  - `.planning/STATE.md` (post-T0.1 — verify L21-27 当前位置 block structure)
  - existing "已完成 phase ship 历史" section added by Phase 3.2 W0.2
- **action**:
  1. Append to "已完成 phase ship 历史" section as 12th entry:
     ```markdown
     - **Phase 3.3 SHIPPED** ✅ (2026-05-MM) — aliases.yaml RICH + DOCTOR-ONLY-WARN deprecation marker + known-good 版本组合 lock + W0 backlog 3 项一次根治 (D-04 5-recurrence terminus + dashboard-sse fix path a + schemaVersion 12+13 surface)
     ```
  2. Update L21-27 当前位置 block:
     - L23 GSD phase chain — prepend `✅ **Phase 3.3 SHIPPED** (2026-05-MM — ...)` BEFORE existing `**Phase 3.2 SHIPPED**`
     - L24 当前里程碑 — update to "v0.3.0 plan-feature workflow + checkpoint (**Phase 3.1 + Phase 3.2 + Phase 3.3 SHIPPED 3/4**) — next: Phase 3.4 路由命中率 ≥ 85% + token budget"
     - L25 下一 phase — update to "Phase 3.4 discuss-phase 启动"
     - L26 状态 — update to "✅ **Phase 3.3 SHIPPED** — Wave 0+1+2 全 ship YYYY-MM-DD"
     - L27 进度 — update to "13 / 17 phases 已完成 ▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░ 76.5% (v0.3.0 里程碑 75% — Phase 3.1 + 3.2 + 3.3 ✅)"
- **acceptance_criteria**:
  - `grep -cE "^[-*]?\\s*\\*?\\*?Phase [1-9]\\.[0-9]\\*?\\*?.*[Ss]hipped" .planning/STATE.md` ≥ 12 (was 11 post-Phase-3.2 + 1 new = 12)
  - `grep -q "Phase 3\\.3.*SHIPPED" .planning/STATE.md` exit 0
  - `grep -q "v0\\.3\\.0.*3/4" .planning/STATE.md` exit 0
  - `node scripts/check-transparency-verdicts.mjs` exit 0 (transparency gate still pass with new entry)
- **decision_source**: sister Phase 3.2 W2 STATE.md 续编 pattern

### T2.7 — .planning/RETROSPECTIVE.md Phase 3.3 milestone retro entry

- **files_modified**: `.planning/RETROSPECTIVE.md` (MODIFY append Phase 3.3 milestone retrospective entry)
- **read_first**:
  - `.planning/RETROSPECTIVE.md` (by Read tail 100 lines — verify Phase 3.2 retro pattern)
- **action**:
  1. Append Phase 3.3 milestone retrospective entry covering:
     - W0.1 D-04 5-recurrence pattern terminus lesson (4 prior recurrences identified + COLLAPSE single SSOT 根治)
     - W0.2 dashboard-sse fix path (a) lesson (RESEARCH-guided recipe verbatim + sister Phase 2.4 W4 Win 3-tier 复用)
     - W1 manifest-domain schema colocation 3rd consumer pattern (Phase 1.X + Phase 3.2 + Phase 3.3 = 3 domain colocation cycle)
     - W2 install resolveAlias 1-line surgical pre-lookup (Karpathy surgical exemplar — 1 line not 6)
     - D-02 silent install observability test lesson (stdout NOT 'redirect|deprecated' substring 守门)
     - TypeBox ISO-date pattern lesson reuse (sister Phase 3.2 W2 Rule 1 — pattern not FormatRegistry)
- **acceptance_criteria**:
  - `grep -q "Phase 3.3" .planning/RETROSPECTIVE.md` exit 0
  - `grep -q "5-recurrence\\|5 prior\\|colocation 3rd" .planning/RETROSPECTIVE.md` exit 0 (key lessons captured)
- **decision_source**: sister Phase 3.2 RETROSPECTIVE.md 续编 pattern

### T2.8 — .planning/ROADMAP.md Phase 3.3 ✅ + v0.3.0 3/4 + Phase 3.4 prereq

- **files_modified**: `.planning/ROADMAP.md` (MODIFY — mark Phase 3.3 ✅ SHIPPED + update v0.3.0 progress 3/4 + carry-forward Phase 3.4 prereq)
- **read_first**:
  - `.planning/ROADMAP.md` L130-175 (by Read — verify Phase 3.3 + Phase 3.4 entry structure)
- **action**:
  1. Mark Phase 3.3 entry as ✅ SHIPPED (YYYY-MM-DD)
  2. Update v0.3.0 milestone progress 2/4 → 3/4
  3. Add Phase 3.4 prereq carry-forward note (路由命中率 ≥ 85% + token budget 监控 + plan-feature dogfood seed actual upstream pinned versions to versions/0.3.0-known-good.yaml + EE-4 BLOCKER auto-spawn rerun + userSpawn session_id capture)
- **acceptance_criteria**:
  - `grep -q "Phase 3.3.*✅" .planning/ROADMAP.md` exit 0
  - `grep -q "v0\\.3\\.0.*3/4" .planning/ROADMAP.md` exit 0
  - `grep -q "路由命中率\\|token budget" .planning/ROADMAP.md` exit 0 (Phase 3.4 prereq)
- **decision_source**: sister Phase 3.2 ROADMAP.md 续编 pattern

### T2.9 — A7 守恒 verify (git diff adr-0015-accepted..HEAD ADR 0001-0015 main body 0 diff)

- **files_modified**: 无 (verify-only step)
- **read_first**: 无
- **action**:
  1. Run A7 verification command:
     ```bash
     git diff adr-0015-accepted..HEAD -- docs/adr/000[1-9]-*.md docs/adr/001[0-5]-*.md | wc -l
     ```
  2. If output != 0, investigate which ADR was modified + restore from baseline tag
  3. **Update Resolved (T2.9)** block with outcome
- **acceptance_criteria**:
  - `git diff adr-0015-accepted..HEAD -- docs/adr/000[1-9]-*.md docs/adr/001[0-5]-*.md | wc -l` == 0 (A7 守恒 — only ADR 0016 NEW, 0001-0015 不动)
- **decision_source**: sister Phase 3.2 T3.6 A7 verify pattern

### T2.10 — Baseline tag adr-0016-accepted + milestone tag v0.3.0-alpha.3-aliases-known-good push

- **files_modified**: git tags (no file change)
- **read_first**: 无
- **action**:
  1. Verify all preceding Wave 2 tasks complete + full test suite green + CI 3-OS green
  2. Verify A7 守恒 0 diff (T2.9 outcome)
  3. Tag baseline:
     ```bash
     git tag adr-0016-accepted
     ```
  4. Tag milestone:
     ```bash
     git tag v0.3.0-alpha.3-aliases-known-good
     ```
  5. Optionally push tags to remote (per user preference): `git push origin --tags` (or wait for user explicit request per CLAUDE.md commit safety protocol — NEVER push without user request)
- **acceptance_criteria**:
  - `git tag --list | grep -E "adr-0016-accepted|v0\\.3\\.0-alpha\\.3-aliases-known-good" | wc -l` == 2 (both tags created)
- **decision_source**: sister Phase 3.2 T3.7 tag pattern + project tag cadence

---

## Phase 3.3 — done

All 25 atomic tasks across 3 Waves complete. Phase 3.3 SHIPPED criteria all satisfied per PLAN.md <success_criteria>. v0.3.0 milestone 3/4 progress (Phase 3.1 + Phase 3.2 + Phase 3.3 shipped; Phase 3.4 路由命中率 + token budget pending).
