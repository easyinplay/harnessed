# Phase 3.3 — RESEARCH (Wave A R2 focus pack)

> **Researched**: 2026-05-17
> **Researcher**: gsd-phase-researcher (Claude Opus 4.7, 1M ctx)
> **Scope**: 13 sections — D-04 dashboard.mjs parse-impact verify / aliases.v1 RICH TypeBox shape / doctor 7th check `checkDeprecations` design / `versions/` dir + `--known-good` flag commander integration / schemaVersion 12+13 surface colocation / W0.1 STATE COLLAPSE + STATE_POSITION_RE gate / W0.2 dashboard-sse random-port + retry recipe / install path resolveAlias inject location / W0.3 schema decision doc / validation architecture (Nyquist) / wave topology / Karpathy anti-patterns
> **Overall confidence**: HIGH (§1 dashboard.mjs — `scripts/dashboard.mjs` L210-322 全文 grep + 直证 only `Status:` 在 L322 是 ADR scope NOT STATE / §2 aliases.v1 — TypeBox `Type.Record` + `Type.Object` MDN-standard + sister Phase 3.2 W2 Rule 1 ISO-date pattern lesson / §3 doctor 7th — sister Phase 3.2 W1 `checkGstackPrefix` L138-142 + `probe-gstack.ts` L1-48 100% pattern reuse / §4 `--known-good` — `src/cli/install.ts` L46-56 commander option chain 直证 + sister `--apply` `--dry-run` `--system` 既存 5-flag 模式 / §5 schemaVersion 12+13 — `src/types/schemaVersion.ts` L34-66 + Phase 3.2 W0.3 colocation decision doc 直证 / §6 W0.1 — `scripts/check-transparency-verdicts.mjs` L20 + L29-30 dual-token gate 直证 + STATE.md L21-26 `当前位置` block 实测 / §7 W0.2 — `tests/scripts/dashboard-sse.test.ts` L17 hard-coded PORT + L84-107 beforeAll spawn pattern 直证) · MEDIUM-HIGH (§8 install resolveAlias inject — `src/cli/install.ts` L66-83 readFile-try-catch path 验证 1-line insert 1 安全; §10 validation arch — Phase 3.2 sister projection ~32 fixture target; §13 anti-patterns — 经验值未 spike)
> **Valid until**: ~2026-08-17 (Phase 3.3 ship + Phase 3.4 dogfood cycle; commander v13 + TypeBox 0.34 stable; gstack-office-hours CLI 命名稳定 within gstack v0.x cadence)

---

## § 0 Scope note + sources

### What this RESEARCH does NOT redo

4 D-decisions D-01~D-04 已 interactive AskUserQuestion 锁定 (`3.3-CONTEXT.md` L40-143):

- **D-01** aliases.yaml schema = **RICH** (含 redirect + reason + since_version + deprecation_date + removal_date?)
- **D-02** deprecation marker visibility = **DOCTOR-ONLY-WARN** (install 静默重定向 + doctor 7th check 显示)
- **D-03** known-good 版本锁格式 = **YAML manifest** `versions/<harnessed-ver>-known-good.yaml`
- **D-04** STATE dual-SSOT 5th recurrence 根治 = **(b) COLLAPSE** (删 L4 frontmatter Status:, "当前位置"块 single SSOT)

本 RESEARCH 聚焦 KICKOFF + 3.3-CONTEXT § Claude's Discretion + W0 backlog 3 项的 R2 实装支撑 (不再二次探索 D 决策的 alternative)。

### Critical pre-existing assets discovered (MUST inform planner)

1. **dashboard.mjs STATE.md parse path 验证 — D-04 COLLAPSE safe, no dashboard fix needed** [VERIFIED]:
   - `scripts/dashboard.mjs` L223-258 `pageDashboard()` reads STATE.md → `head(state, 35)` → generic `md()` markdown renderer (NO `Status:` regex extract)
   - L210-218 `parseTestsStat(state)` 仅 regex match `tests N+M / N→M` pattern (test counter, NOT frontmatter)
   - L322 `(c.match(/^Status:\s*(.+)$/m) || [])[1]` 唯一 `Status:` regex 是 **ADR scope** (`pageADRs()` iterates `docs/adr/*.md`, NOT STATE.md)
   - L483 + L500 watch list 仅 `STATE.md`/`ROADMAP.md`/`RETROSPECTIVE.md` filename — file change trigger only, no content parse contract
   - **结论**: D-04 (b) COLLAPSE 删 STATE.md L4 `> Status: ...` + L5 `> 最后更新：...` 对 dashboard 0 影响. "当前位置"块 (L21-26) 进入 head(35) 渲染区, dashboard 仍正常显示
   - [VERIFIED LOCAL: `Grep STATE\.md|Status:|当前位置 scripts/dashboard.mjs` 12 match 全验, 仅 1 个 Status: regex 是 ADR scope]

2. **STATE.md "当前位置" block (L21-26) 已含 5+ `**Phase 3.X SHIPPED**` markers** [VERIFIED]:
   - L4 frontmatter Status: 行 (W0.1 删除目标)
   - L5 frontmatter 最后更新 行 (W0.1 删除目标)
   - L23-24 当前位置块 `**Phase 3.2 SHIPPED**` + `**Phase 3.1 SHIPPED**` + `**Phase 2.4 SHIPPED**` + `**Phase 2.3 SHIPPED**` + `**Phase 2.2 SHIPPED**` 等 5+ literal occurrences
   - L26 状态行 `**Phase 3.2 SHIPPED**` + L36 表格 `**SHIPPED & ARCHIVED**`
   - **结论**: 删 L4+L5 后, `STATE_POSITION_RE = /\*\*Phase [1-9]\.[0-9]+ SHIPPED\*\*/m` 扫全文仍有 5+ matches (L21-26 + L36) — 新 gate 不饥饿
   - [VERIFIED LOCAL: `Grep "Phase 3\.2 SHIPPED|当前位置" .planning/STATE.md` 10 match 实测]

3. **`scripts/check-transparency-verdicts.mjs` 现 dual-token gate L20 + L26-50** [VERIFIED]:
   - L14 `MARKER` regex (Verdict/状态/Closure marker)
   - L20 `STATUS_MARKER = /^\s*>?\s*\*{0,2}(?:Status|状态)\*{0,2}\s*[:：]\s*(.+)$/m` — first 50 lines only (line 60)
   - L29-30 `STATE_LATEST_SUBPHASE_RE = /\*{2}Phase\s+(\d+\.\d+)\s+SHIPPED\*{2}/g` — 扫 STATE.md 全文 提取 latest subphase
   - L46-51 `getLatestShippedSubphase()` matchAll + sort descending → returns `Phase 3.2` literal
   - L53-91 `checkFreshness()` for each FRONT_MATTER_DOCS scan first 50 lines for STATUS_MARKER → currently REQUIRED for STATE.md (L57-67)
   - **关键洞察**: 现有 gate 设计 `STATUS_MARKER` is required on STATE.md (L66-67 `violations.push('missing Status: marker')`). 删 L4 Status: 行 → gate FAIL. **W0.1 必须同时改 gate**: 加 OR-fallback — if STATUS_MARKER 未匹配 AND file is STATE.md, fallback to scan 全文 `STATE_LATEST_SUBPHASE_RE.test(content)` 至少 1 match
   - [VERIFIED: `scripts/check-transparency-verdicts.mjs` L1-112 全文]

4. **doctor.ts current LOC = 184L** (verified) — 加 7th check dispatch ~5L → ~189L within Karpathy ≤200 hard limit clean:
   - `wc -l src/cli/doctor.ts` = 184L (Phase 3.2 W1 ship after `checkGstackPrefix` 加, includes L136-142 6th check + L156 dispatch)
   - 7th check 加: 4L NEW function `checkDeprecations` (sister L138-142 pattern) + 1L dispatch (sister L156) = +5L total → 189L
   - **Helper split required** for `check-deprecations.ts` (≤40L sister probe-gstack.ts 48L) — NOT for hard limit (189 < 200), but for **single-responsibility consistency** (sister 6th check delegate pattern: doctor.ts 仅 import + dispatch, logic in lib/)
   - [VERIFIED: `wc -l src/cli/doctor.ts` 本 session 实测 = 184]

5. **manifests/ dir 现 layout = flat 3-subdir** + aliases.yaml NEW 顶层:
   - `ls manifests/` = `README.md / SCHEMA.md / cc-hooks/ / skill-packs/ / tools/` (Phase 1.X-2.X)
   - **aliases.yaml NEW at `manifests/aliases.yaml`** (顶层 sister flat layout, NOT in subdir) — D-01 CONTEXT.md L48 直证
   - install.ts L66-67 已 lookup 2 subdir (`manifests/tools/<name>.yaml` + `manifests/skill-packs/<name>.yaml`), aliases.yaml 是顶层 metadata file (NOT a manifest, more like index)
   - [VERIFIED LOCAL: `ls manifests/` + Grep aliases* 仅 .planning/phase-3.3/ 4 doc match (0 src code)]

6. **`versions/` dir 不存在** — D-03 NEW top-level dir:
   - `ls versions/` = empty stderr (dir doesn't exist)
   - Phase 3.3 MVP creates `versions/0.3.0-known-good.yaml` + Phase 3.4 dogfood adds e2e_verified upstream pinned versions
   - [VERIFIED LOCAL: `ls versions/` 本 session 实测 empty]

7. **dashboard-sse.test.ts L17 hard-coded PORT = 47180** flaky root cause:
   - L17 `const PORT = 47180` global constant
   - L84-94 `beforeAll` first probes `httpGet('/', 500)` on prod port; if 200 → `portTaken.value = true` + all 4 cells return early (effectively skip silently)
   - L100-104 spawn dashboard at cwd=tmpRoot but `dashboard.mjs` L39 `const PORT = 47180` hard-coded too → conflict if dev has dashboard running
   - **Root cause**: test relies on prod port singleton. On Win local where dev runs dashboard for live preview, port taken → cells skip → CI green by accident; on fresh CI machine port free → spawn → race condition between waitFor + test execution → 4-cell flaky on Win
   - **Fix path**: random ephemeral port via `net.createServer().listen(0)` → `server.address().port` returns unused port → pass via `DASHBOARD_PORT` env var → dashboard.mjs reads `process.env.DASHBOARD_PORT ?? '47180'` (additive, defaults preserved for prod)
   - [VERIFIED: `tests/scripts/dashboard-sse.test.ts` L1-156 全文]

8. **schemaVersion register 已 11 surface (Phase 3.2 ship after)**:
   - `src/types/schemaVersion.ts` L40-51 `SCHEMA_VERSIONS` const 11 entries:
     1. routingSnapshot, 2. handoffDoc, 3. phasesYaml, 4. manifestState, 5. installerState, 6. routeDecisionLog, 7. checkpoint, 8. currentWorkflow, 9. config, 10. governance, **(planFeature 11th added by Phase 3.2 W2 — verified via `git log` STATE.md line "schemaVersion 8→11 surface")**
   - L55-66 `SchemaVersionLiteral` Union 同 11 entries
   - **Phase 3.3 加 12th + 13th** 双 add 沿袭 Phase 3.2 W1 T1.1 8→10 双加 precedent: SCHEMA_VERSIONS const +2 entries (aliases + knownGood) + SchemaVersionLiteral Union +2 Type.Literal = ~+4L cross 2 处
   - [VERIFIED: `src/types/schemaVersion.ts` L40-66]

9. **Sister schema 颠 location 决策 — `src/manifest/schema/` (NOT `src/workflow/schema/`)**:
   - `src/workflow/schema/` 已含 4 schemas (config.ts + governance.ts + phases.ts + planFeature.ts) — Phase 3.2 W1+W2 workflow-domain
   - `src/checkpoint/schema/` 已含 2 schemas (checkpoint.v1.ts + currentWorkflow.v1.ts) — Phase 3.1 checkpoint-domain
   - `src/manifest/schema/` 已含 4 modules (spec.ts + metadata.ts + types.ts + installMethods/ + index.ts) — Phase 1.X manifest-domain
   - **`aliases.v1` + `known-good.v1` 是 manifest-domain** (consumed by `src/cli/install.ts` + `src/cli/lib/check-deprecations.ts`) → colocate at `src/manifest/schema/aliases.v1.ts` + `src/manifest/schema/known-good.v1.ts` (sister Phase 3.2 W0.3 path divergence acknowledgment 模式 — schemas live with primary consumers)
   - [VERIFIED LOCAL: `ls src/{manifest,workflow,checkpoint}/schema/` 实测]

10. **`.harnessed/` 现 path count = 7 paths post-Phase-3.2** (本 phase 0 .harnessed/ delta):
    - Phase 1.2 引: backup/ + state/manifest.json + state/installer.json (3)
    - Phase 3.1 引: checkpoints/ + archive/ + current-workflow.json (3 more = 6)
    - Phase 3.2 引: config.json + governance.json (2 more = 8 total — STATE.md L4 frontmatter says "8→11 surface" referring schemaVersion, not .harnessed/)
    - **Phase 3.3 add NOTHING to `.harnessed/`** — aliases.yaml lives in `manifests/` (project-tracked), known-good.yaml lives in `versions/` (project-tracked). Both git-tracked, not runtime state.
    - [VERIFIED: Phase 3.2 W0.3 decision doc L16-17 .harnessed/ enumeration]

### Sources cited

| Source | Lines | Confidence | Purpose |
|--------|-------|-----------|---------|
| `src/cli/doctor.ts` | L1-184 | HIGH | 6-check baseline + `checkGstackPrefix` L136-142 sister pattern 100% reuse model for `checkDeprecations` 7th check; `--json` flag L160-167 输出 deprecations array CI-friendly |
| `src/cli/lib/probe-gstack.ts` | L1-48 | HIGH | PRIMARY helper sister pattern for `check-deprecations.ts` — 4-outcome enum + fix hint format |
| `src/cli/install.ts` | L1-117 | HIGH | install path commander option chain L46-56 + readFile-try-catch L66-83 resolveAlias inject location |
| `src/manifest/schema/spec.ts` | L1-200 | HIGH | TypeBox `Type.Object` + `Type.Union` + `Type.Literal` + `additionalProperties: false` + pattern regex 范本 |
| `src/types/schemaVersion.ts` | L1-80 | HIGH | 11-surface register + 12+13 surface 加 cost; `branchOnSchemaVersion<T>()` 共享 helper |
| `src/workflow/schema/config.ts` + `governance.ts` | (existing) | HIGH | sister Phase 3.2 W1 TypeBox schema 直接 model + ISO-date pattern Rule 1 lesson |
| `scripts/check-transparency-verdicts.mjs` | L1-112 | HIGH | W0.1 gate extend point (STATE.md STATUS_MARKER L20 + STATE_LATEST_SUBPHASE_RE L29-30 + checkFreshness L53-91) |
| `scripts/dashboard.mjs` | L1-610 (parse-impact verify) | HIGH | D-04 COLLAPSE safety 直证 — dashboard 仅 `head(state, 35)` 渲染 generic markdown, 不 parse L4 Status: |
| `tests/scripts/dashboard-sse.test.ts` | L1-156 | HIGH | W0.2 hard-coded PORT 47180 L17 + beforeAll skip pattern L84-94 直证 — random ephemeral port + DASHBOARD_PORT env fix path |
| `.planning/STATE.md` | L1-30 | HIGH | "当前位置"块 L21-26 5+ `**Phase 3.X SHIPPED**` 直证 — D-04 删除 L4+L5 frontmatter post-W0.1 STATE_POSITION_RE 仍饱和 |
| `.planning/phase-3.2/W0.3-schema-decision.md` | L1-76 | HIGH | sister W0.3 schema decision doc 范本 (path divergence + colocation rule + acknowledge PATTERNS.md indicative) |
| `.planning/phase-3.2/RESEARCH.md` | L1-1309 (chunks) | HIGH | sister 18 section format gold-standard reference |
| **3.3-CONTEXT.md** | L40-143 | HIGH | 4 D-decisions LOCKED + implementation hints verbatim |
| **3.3-KICKOFF.md** | L50-67 | HIGH | W0 backlog 3 项 + 4 D-decision summary table |
| `.planning/REQUIREMENTS.md` | L281-291 | HIGH | R7.5 (aliases + deprecation) + R7.6 (known-good lock) 验收 bar |
| **External** | | | |
| TypeBox `Type.Record` docs | github.com/sinclairzx81/typebox | HIGH | aliases map Record<string, AliasEntry> pattern |
| commander.js v13 `.option()` API | github.com/tj/commander.js | HIGH | `--known-good` flag option chaining sister 5-flag pattern |
| Node.js `net.createServer().listen(0)` docs | nodejs.org/api/net | HIGH | random ephemeral port standard pattern |

---

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01 aliases.yaml schema = RICH** (含 redirect + reason + since_version + deprecation_date + removal_date?)
  - Rationale: R7.5 验收 "deprecation marker 显示提示" 含蓄要求 metadata; FLAT map 失 deprecation metadata; TIERED Union Karpathy YAGNI 违反; RICH 直观 + sister Phase 2.4 doctor `--json` CI-friendly 输出可展开
  - Implementation: `manifests/aliases.yaml` 顶层 NEW + `src/manifest/schema/aliases.v1.ts` NEW ~30L + `src/manifest/aliases.ts` NEW ~30L (`loadAliases()` + `resolveAlias(name): string | null`)
  - ISO-date pattern: `^\\d{4}-\\d{2}-\\d{2}$` (NOT FormatRegistry — sister Phase 3.2 W2 Rule 1 lesson)
  - Karpathy hard limit: aliases.ts ≤40L; aliases.v1.ts ≤40L

- **D-02 deprecation marker visibility = DOCTOR-ONLY-WARN** (install 静默重定向)
  - Rationale: INSTALL-WARN 增 CI 噪声; INSTALL-THROW 太严苛 + 需 `--force-deprecated` flag 增 CLI surface; DOCTOR-ONLY 把 deprecation 提醒放健康检查路径 (人主动查) — install path 保持 clean redirect (R7.5 验收"install 通过"语义对齐)
  - Implementation: `src/cli/doctor.ts` 加 7th check `checkDeprecations` (sister 6th `checkGstackPrefix` 模式 dynamic import + delegate) + `src/cli/lib/check-deprecations.ts` NEW ~30L PRIMARY helper (sister probe-gstack.ts 48L)
  - install path 仅加 `name = resolveAlias(name) ?? name` 1 行 (no console output, sister Karpathy surgical)
  - doctor warning output 含 RICH metadata + `--json` flag 输出 deprecations array
  - Karpathy hard limit: check-deprecations.ts ≤40L; doctor.ts 184→~189L 仍 ≤200 clean

- **D-03 known-good 版本锁格式 = YAML manifest `versions/<harnessed-ver>-known-good.yaml`**
  - Rationale: 项目 manifests/ 全 yaml convention; TypeBox validate 复用 (Phase 2.2 CD-5 single 兼容门 13th surface); yaml 人可读 + git diff 友好; embed-in-manifest path scope mismatch
  - Implementation: `versions/` 新顶层 dir + `versions/0.3.0-known-good.yaml` MVP file + `src/manifest/schema/known-good.v1.ts` NEW ~40L + `src/manifest/knownGood.ts` NEW ~40L (`loadKnownGood(harnessedVer)` + `getPinnedVersion(upstreamName, harnessedVer)`)
  - `src/cli/install.ts` 加 `--known-good` flag (commander option) — 若有则 resolve pinned version 取代 manifest 中 `version:` 字段
  - Phase 3.3 MVP seed: `versions/0.3.0-known-good.yaml` 1 file 含初版 (empty upstreams: [] array + e2e_verified_at: TBD) — Wave A R2 推 ship 1 file
  - Karpathy hard limit: knownGood.ts ≤45L; known-good.v1.ts ≤45L

- **D-04 STATE dual-SSOT 5th recurrence 根治 = (b) COLLAPSE** (删 L4 frontmatter Status:, "当前位置"块 single SSOT)
  - Rationale: 5th recurrence pattern terminus (README L9 / README L44 / PROJECT-SPEC / STATE freshness scope / STATE 当前位置块); Karpathy YAGNI single source of truth; (a) EXTEND gate scope 保 dual 是 over-engineering; (c) COLLAPSE INVERSE 损 human-readable + dashboard 可能 break
  - Implementation: W0.1 必修 — 删 STATE.md L4 `> Status: ...` 整行 + 删 L5 `> 最后更新：...` 整行; scripts/check-transparency-verdicts.mjs 扩 `STATE_POSITION_RE = /\*\*Phase [1-9]\.[0-9]+ SHIPPED\*\*/m` 扫 STATE.md 全文 OR-fallback (替代 STATUS_MARKER requirement for STATE.md only); dashboard.mjs 无 fix needed (本 RESEARCH § 1 直证)
  - Acceptance: `! grep -q "^> Status:" .planning/STATE.md` exit 0 + `grep -q "\*\*Phase 3\.2 SHIPPED\*\*" .planning/STATE.md` exit 0 + transparency gate pass post-W0.1

### Claude's Discretion

- **`harnessed install --known-good` 解析时机**: boot time vs lazy load on `--known-good` flag detect — 推 **lazy** (§ 4.3 Karpathy YAGNI, only pay cost when flag used)
- **install path resolveAlias 注入 location**: pre-manifest-lookup vs post-manifest-not-found (alias as 404 fallback) — 推 **pre-lookup** (§ 8.1 predictable + 1 line)
- **doctor 7th check warning format multi-deprecation aggregation**: 一行 per deprecated vs 一段 table per all — 推 **table** (§ 3.3 sister Phase 2.4 doctor `--json` checks array 整体 output)
- **versions/ dir bootstrap**: 仅 ship 1 file `versions/0.3.0-known-good.yaml` (empty upstreams + e2e_verified_at: TBD) vs ship empty dir + .gitkeep — 推 **ship 1 file** (§ 4.4 dogfood Phase 3.4 时 actual pinned 填充)
- **dashboard.mjs "当前位置"块 parse impact (W0.1 D-04 collapse)** — 推 **NO same-wave fix needed** (§ 1 dashboard 不 parse L4 frontmatter, 仅 head(35) generic md render)
- **W0.2 fix path choice (a vs b vs c)**: (a) random ephemeral port + retry vs (b) vi.mock node:http vs (c) Win pwsh skip — 推 **(a)** (§ 7 sister Node best practice net.createServer().listen(0))

### Deferred Ideas (OUT OF SCOPE)

- 路由命中率 ≥ 85% 验收 + token budget 监控 → Phase 3.4
- plan-feature 真接外部 gsd-* spawn → Phase 3.3+ dogfood (Phase 3.2 D-03 WIRED stub, Phase 3.4 transition)
- EE-4 BLOCKER auto-spawn rerun → Phase 3.4 后 evaluate
- userSpawn session_id capture → Phase 3.4+ (DEFERRED #2 Phase 3.1 carry)
- install --known-good 真 e2e 上游版本 lock seed data → Phase 3.4 dogfood 时填充 (本 phase MVP 仅 infra + 初版 empty/skeleton)
- FLAT aliases schema (`old: new` 简单 map) → D-01 evaluated rejected (失 metadata)
- TIERED aliases (string OR object union) → D-01 evaluated rejected (Karpathy YAGNI 违反)
- INSTALL-WARN deprecation visibility → D-02 evaluated rejected (CI 噪声 + 重复警告)
- INSTALL-THROW + --force-deprecated flag → D-02 evaluated rejected (太严苛, R7.5 验收"install 通过"语义冲突)
- JSON known-good (npm-lock style) → D-03 evaluated rejected (项目未用 npm-lock + yaml convention sister)
- Embed known-good in manifest yaml → D-03 evaluated rejected (跨 manifest agg 难)
- (a) EXTEND freshness gate scope (保 dual SSOT) → D-04 evaluated rejected (over-engineering)
- (c) COLLAPSE INVERSE (删 "当前位置" 块) → D-04 evaluated rejected (损 human-readable + dashboard 可能 break)

</user_constraints>

---

## Project Constraints (from CLAUDE.md)

> 用户全局 CLAUDE.md 关键 directive 摘录, 与 locked decisions 等同权威。

- **Karpathy simplicity always-on (心法)**: Think Before Coding / Surgical Changes / 小步原子修改 / Goal-Driven Execution / 追求最小有效代码 — 所有 src/ 文件 ≤ 200L hard limit (B-06 + B-26 sister)
- **GSD orchestration + planning-with-files persist**: phase 文档落 `.planning/phase-3.3/`, task_plan.md + progress.md + findings.md
- **superpowers subagent execute + ralph-loop**: 每子任务 ralph-loop completion-promise "COMPLETE"; TDD 强 recommend 核心业务逻辑 (本 phase aliases.ts + knownGood.ts + check-deprecations.ts 是核心业务, 推 TDD)
- **Web 搜索路由 Tavily / Exa MCP 优先** (内置 WebSearch fallback), `gh CLI` 优先 over GitHub MCP
- **commit 时 Karpathy "Simplicity First"**: 单 phase 内多次 atomic commit; commit message 含 "why" 不仅 "what"
- **Biome lint preempt before commit** (MEMORY feedback): `pnpm exec biome check --write` 本地预跑 — 3 CI-red recurrences Phase 2.1.1 / 2.2 / 2.3 (本 phase commit 前必跑)
- **GSD workflow decision cadence** (MEMORY): terse menu-choice shorthand (PP/AA/CC/MM/SR/NN) + sister-review severity tiering 跟之前规则一样

planner 必须验证每 task ≤ 200L hard limit + 沿袭 Phase 3.2 Wave A R2 + W0 backlog absorb 5-phase 连续模式 + sister review M+L+T 三档分级.

---

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| **R7.5** | manifests/aliases.yaml 重定向 + deprecation_marker 字段 doctor/install 显示提示; 验收 模拟上游改名场景 install 通过 + 提示 | § 2 aliases.v1 RICH schema + § 3 doctor 7th `checkDeprecations` + § 8 install resolveAlias inject + § 10 validation (functional resolveAlias + integration install 重定向 + observability doctor --json) |
| **R7.6** | 每个 harnessed 版本冻结一组通过 e2e 的上游版本 lock; 验收 `harnessed install --known-good` reproducible | § 4 `versions/<ver>-known-good.yaml` + `--known-good` flag commander integration + § 5 schemaVersion 13th surface + § 10 validation (functional getPinnedVersion + integration install --known-good) |
| **ROADMAP Phase 3.3 模拟上游改名场景** | acceptance bar | § 8 install resolveAlias e2e dogfood + § 10 integration test count |
| **W0.1 STATE dual-SSOT 5th recurrence terminus** | acceptance bar | § 6 STATE COLLAPSE + STATE_POSITION_RE gate extend |
| **W0.2 dashboard-sse 4 cell flaky 根治** | acceptance bar | § 7 random ephemeral port + retry helper |
| **W0.3 schemaVersion 12+13 surface decision doc** | acceptance bar | § 9 decision doc format sister Phase 3.2 W0.3 |

</phase_requirements>

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| aliases.yaml load + resolveAlias map | manifest tier (`src/manifest/aliases.ts`) | TypeBox schema layer (`src/manifest/schema/aliases.v1.ts`) | sister `src/manifest/validate.ts` 模式 — loader own runtime, schema layer own validate. aliases is manifest-domain metadata |
| known-good.yaml load + getPinnedVersion | manifest tier (`src/manifest/knownGood.ts`) | TypeBox schema layer (`src/manifest/schema/known-good.v1.ts`) | sister aliases.ts; version lock is manifest-domain (per-harnessed-version pinned upstream version) |
| doctor 7th check `checkDeprecations` dispatch | CLI subcommand (`doctor`) | helper `src/cli/lib/check-deprecations.ts` (PRIMARY) | doctor own 7 health check; 第 7 沿袭 6th `checkGstackPrefix` dynamic import + delegate 模式; lib helper own scan logic |
| install path resolveAlias inject | CLI subcommand (`install`) | `src/manifest/aliases.ts` (consumer) | install own manifest dispatch; aliases.ts is read-only consumer with 1-line `name = resolveAlias(name) ?? name` pre-lookup |
| install `--known-good` flag option + lazy resolve | CLI subcommand (`install`) | `src/manifest/knownGood.ts` (consumer) | commander option own flag chain; lazy load on flag detect (Karpathy YAGNI per Discretion) |
| 12th + 13th schemaVersion surface register | type tier (`src/types/schemaVersion.ts`) | — | single SSOT for surface names + `branchOnSchemaVersion<T>()` 共享 helper (Phase 2.2 CD-5) |
| W0.1 STATE dual-SSOT COLLAPSE | docs layer (`.planning/STATE.md`) | gate layer (`scripts/check-transparency-verdicts.mjs` STATE_POSITION_RE 扩) | docs tier 内容删 (L4+L5 frontmatter); gate tier OR-fallback 扩 for STATE.md scope |
| W0.2 dashboard-sse random port fix | test layer (`tests/scripts/dashboard-sse.test.ts`) | dashboard.mjs env var `DASHBOARD_PORT` read (1-line additive) | test concern; dashboard.mjs minimal additive change (default preserved for prod) |
| W0.3 schemaVersion 12+13 surface decision doc | docs layer (`.planning/phase-3.3/W0.3-schema-decision.md`) | — | planning doc tier 直接 sister Phase 3.2 W0.3 format |

**Why this matters**: Phase 3.3 跨 3 tier (CLI / manifest / docs+test+gate), 每 tier 单一职责清晰 — manifest tier 不写 .harnessed/ (deprecation 是 git-tracked metadata, not runtime state), CLI tier 不解 yaml schema (manifest tier validate 责), gate tier 不动 STATE.md content (docs tier 责)。 sister Phase 3.2 W0.3 path divergence acknowledgment 模式 — schemas live with primary consumers (aliases + known-good = manifest-domain, NOT workflow/checkpoint).

---

## § 1 D-04 dashboard.mjs parse-impact verify

**Confidence: HIGH** — `scripts/dashboard.mjs` L1-610 全文 grep 直证 + 12 `STATE.md|Status:|当前位置` match 全分析.

### 1.1 决策: D-04 COLLAPSE safe, NO same-wave dashboard.mjs fix required ⭐

**Direct evidence — grep `STATE\.md|Status:|当前位置` scripts/dashboard.mjs**:

| Line | Content (略) | Reads STATE.md? | Parses L4 Status: frontmatter? |
|------|--------------|-----------------|--------------------------------|
| L210-218 | `parseTestsStat(state)` regex `tests N+M / N→M` | YES | NO (extracts test counter only) |
| L223-258 | `pageDashboard()` `const state = read(STATE.md); head(state, 35)` → `md(stateHead)` | YES | NO (generic markdown render, no Status: extract) |
| L322-324 | `(c.match(/^Status:\s*(.+)$/m) || [])[1]` | NO | NO — applies to ADR scope (`pageADRs()` iterates `docs/adr/*.md`) |
| L483 | watchedPaths `['STATE.md', 'ROADMAP.md', 'RETROSPECTIVE.md']` | (filename only) | NO |
| L500 | `watch(join(PLANNING, 'STATE.md'), () => ...)` | (file change trigger) | NO |
| L552-558 | `/api/project/<id>/state` route serves STATE.md raw text | YES (raw) | NO (just `readFileSync` + send) |

**结论 verified**: dashboard.mjs 对 STATE.md L4 `> Status: ...` 行 **0 parsing dependency**. 删 L4+L5 frontmatter 后:
- `pageDashboard()` `head(state, 35)` 仍渲染 L1-L35 (head 35 lines includes "当前位置" block L21-26) — visible card render unchanged
- watcher 仍触发 (filename match only)
- `/api/project/<id>/state` 仍返 raw text content (consumer 自 parse)
- ADR `Status:` regex L322 与 STATE.md 无关 (scope = `docs/adr/*.md`)

**Wave A spike 1h 评估 already done (本 RESEARCH § 1) — outcome: NO dashboard fix needed in Phase 3.3**.

[HIGH — `Grep STATE\.md|Status:|当前位置 scripts/dashboard.mjs` 12 match 本 session 实测全分析]

### 1.2 Cross-verify with Phase 3.2 W0.3 path divergence pattern

Sister Phase 3.2 W0.3 decision doc L19-29 acknowledged PATTERNS.md indicative-of-pattern citation NOT literal-path mandate. 本 phase D-04 同 pattern: KICKOFF + CONTEXT 提及 "dashboard.mjs 可能 break" 是 **conservative cautionary mention NOT literal break risk** — actual verification 本 RESEARCH § 1.1 shows 0 dependency.

**Planner action**: Wave 0 W0.1 task spec 可移除 "spike 1h 评估" sub-step (已 RESEARCH 完成); 仅保留 docs delete + gate extend 2 sub-step.

---

## § 2 D-01 aliases.yaml RICH schema design

**Confidence: HIGH** — TypeBox `Type.Record` + `Type.Object` MDN-standard + sister Phase 3.2 W2 Rule 1 ISO-date pattern lesson 直证.

### 2.1 推荐 schema (`src/manifest/schema/aliases.v1.ts` NEW ≤40L) ⭐

```typescript
// src/manifest/schema/aliases.v1.ts NEW ~35L (sister Phase 3.2 src/workflow/schema/config.ts pattern)
import { type Static, Type } from '@sinclair/typebox'
import { SCHEMA_VERSIONS } from '../../types/schemaVersion.js'

/** Single alias entry — RICH metadata per D-01 LOCKED. ISO-date pattern (NOT
 *  FormatRegistry 'date' — sister Phase 3.2 W2 Rule 1 lesson). */
export const AliasEntryV1 = Type.Object(
  {
    redirect: Type.String({ minLength: 1 }),
    reason: Type.String({ minLength: 1, maxLength: 500 }),
    since_version: Type.String({ pattern: '^\\d+\\.\\d+\\.\\d+$' }),
    deprecation_date: Type.String({ pattern: '^\\d{4}-\\d{2}-\\d{2}$' }),
    removal_date: Type.Optional(Type.String({ pattern: '^\\d{4}-\\d{2}-\\d{2}$' })),
  },
  { additionalProperties: false },
)

export const AliasesV1 = Type.Object(
  {
    schemaVersion: Type.Literal(SCHEMA_VERSIONS.aliases),  // 'harnessed.aliases.v1'
    aliases: Type.Record(Type.String({ minLength: 1 }), AliasEntryV1),
  },
  { additionalProperties: false },
)

export type AliasEntryV1Type = Static<typeof AliasEntryV1>
export type AliasesV1Type = Static<typeof AliasesV1>
```

**Design decisions**:
- `Type.Record(Type.String({minLength:1}), AliasEntryV1)` — flat map of `old-name → struct` (NOT nested aliases.<name> object — yaml-friendly + jq-grep-friendly)
- `additionalProperties: false` strict (sister Phase 3.2 W1 config.ts pattern) — typo `reasn:` → Value.Check fail loud
- ISO-date `^\\d{4}-\\d{2}-\\d{2}$` pattern (NOT `format: 'date'` — FormatRegistry not 注册 sister Phase 3.2 W2 Rule 1 lesson 验证 fail)
- semver pattern `^\\d+\\.\\d+\\.\\d+$` for `since_version` (sister Phase 3.2 W2 known-good `harnessed_version` 同 pattern)
- `reason` maxLength 500 (sister Phase 3.2 W1 governance.v1 `reason` 同 DOS mitigation)
- `removal_date` Optional (D-01 spec: 长尾窗口 deprecation 可 absent)

[HIGH — TypeBox `Type.Record` docs + sister Phase 3.2 W0.3 schema 直证]

### 2.2 推荐 aliases.yaml sample (Phase 3.3 MVP seed)

```yaml
# manifests/aliases.yaml — Phase 3.3 R7.5 deprecation marker + redirect
schemaVersion: harnessed.aliases.v1
aliases:
  # Phase 3.3 MVP empty seed (no actual deprecations yet; Phase 3.4 dogfood adds first real entries)
  # Example structure (commented for reference):
  # old-package-name:
  #   redirect: new-package-name
  #   reason: upstream renamed (v2.0 rebrand)
  #   since_version: '0.3.0'
  #   deprecation_date: '2026-05-17'
  #   removal_date: '2026-12-31'  # optional, 长尾窗口
```

**MVP choice**: ship `aliases:` with empty `{}` map (NOT skipping the key — schema requires it). Phase 3.4 dogfood adds first actual deprecation entries.

### 2.3 推荐 `src/manifest/aliases.ts` loader (≤40L Karpathy)

```typescript
// src/manifest/aliases.ts NEW ~35L (sister src/manifest/validate.ts pattern)
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Value } from '@sinclair/typebox/value'
import { parse } from 'yaml'
import { AliasesV1, type AliasesV1Type } from './schema/aliases.v1.js'

const ALIASES_PATH = join(process.cwd(), 'manifests', 'aliases.yaml')

let _cached: AliasesV1Type | null = null

/** Load aliases.yaml once per process (memoized). Returns null if file absent. */
export function loadAliases(): AliasesV1Type | null {
  if (_cached) return _cached
  if (!existsSync(ALIASES_PATH)) return null
  const raw = readFileSync(ALIASES_PATH, 'utf8')
  const parsed = parse(raw) as unknown
  if (!Value.Check(AliasesV1, parsed)) {
    // Karpathy fail-loud: invalid schema → throw not silent-null
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

**Note**: `listDeprecations()` lives in `src/manifest/aliases.ts` (NOT `src/cli/lib/check-deprecations.ts`) — manifest-domain consumer. `check-deprecations.ts` is the doctor-shaped wrapper (returns `CheckResult` format). Sister: `src/manifest/validate.ts` provides domain logic; `src/cli/lib/origin-check.ts` wraps for CLI consumption.

[HIGH — sister `src/manifest/validate.ts` Phase 1.X pattern]

---

## § 3 D-02 doctor 7th check `checkDeprecations` design

**Confidence: HIGH** — sister Phase 3.2 W1 `checkGstackPrefix` L138-142 + `probe-gstack.ts` L1-48 100% pattern reuse.

### 3.1 推荐 doctor.ts dispatch (sister 6th L138-142 100% reuse) ⭐

```typescript
// src/cli/doctor.ts ADD ~5L (sister L138-142 checkGstackPrefix pattern verbatim)
// Phase 3.3 W1 T1.X — 7th check: deprecated manifests listing (D-02 LOCKED).
// Sister Phase 3.2 W1 checkGstackPrefix L138-142 dynamic import + delegate pattern.
async function checkDeprecations(): Promise<CheckResult> {
  const { checkDeprecations: runCheck } = await import('./lib/check-deprecations.js')
  return runCheck()
}

// L150-157 results array MODIFY +1 entry:
const results: CheckResult[] = [
  checkNodeVersion(),
  await checkMcpScope(),
  checkJq(),
  checkWinBash(),
  await checkOriginUrl(),
  await checkGstackPrefix(),
  await checkDeprecations(), // ← Phase 3.3 W1 ADD 7th check (D-02 DOCTOR-ONLY-WARN)
]
```

**doctor.ts post-W1 LOC**: 184 → ~189L (3L NEW function + 1L dispatch entry + 1L comment) — still ≤200 Karpathy hard limit clean.

[HIGH — sister Phase 3.2 W1 L138-142 直证 pattern]

### 3.2 推荐 `src/cli/lib/check-deprecations.ts` PRIMARY helper (≤40L)

```typescript
// src/cli/lib/check-deprecations.ts — Phase 3.3 W1 — D-02 DOCTOR-ONLY-WARN PRIMARY helper
// (sister Phase 3.2 W1 probe-gstack.ts pattern for Karpathy ≤200L 守门).
// Scans manifests/aliases.yaml for deprecated entries; returns warn if any found.
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
 *  audit. Table format per RESEARCH § 3.3 (sister doctor --json checks array). */
export function checkDeprecations(): CheckResult {
  try {
    const deprecations = listDeprecations()
    if (deprecations.length === 0) {
      return { name: 'no deprecated manifests', status: 'pass', message: 'aliases.yaml empty (no deprecated upstreams)' }
    }
    // Multi-deprecation table format (Discretion locked: table, NOT 1-line-per)
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

[HIGH — sister probe-gstack.ts L1-48 4-outcome pattern 100% reuse]

### 3.3 Multi-deprecation aggregation format = table (Discretion locked)

**Choice**: table format (multi-line message with indented rows) per Discretion table-vs-1-line decision.

Rationale (sister Phase 2.4 doctor `--json` D-01 checks array 整体 output pattern):
- 1-line-per-deprecation → 5 deprecated manifests → 5 separate CheckResult entries → doctor output 长度爆炸 (current 6 check + 5 deprecation = 11 lines pre-output; future 20 deprecations → 26 lines)
- table-per-all → 1 CheckResult entry with multi-line message → consistent doctor output (always 7 checks total) + `--json` output 整 array

`--json` flag output (sister L160-167):
```json
{
  "checks": [
    ..., 
    {"name":"deprecated manifests", "status":"warn", "message":"2 deprecated manifest(s):\n  'old-a' → 'new-a' ...\n  'old-b' → 'new-b' ...", "fix":"install paths auto-redirect; ..."}
  ],
  "summary":"warn"
}
```

[HIGH — sister Phase 2.4 D-01 `--json` array-aggregate pattern]

### 3.4 B-06 warn ≠ fail policy 沿袭

doctor.ts L182 `process.exit(hasFail ? 1 : 0)` — `warn` status NOT trigger exit 1 (B-06 locked Phase 2.4). 7th check `warn` (deprecations exist) → 用户看到 warning, 但 doctor 仍 exit 0 (advisory, not blocking).

R7.5 验收 "install 通过 + 提示" 语义对齐: doctor warn 是 "提示" surface; install silent redirect 是 "通过" surface. Two surfaces, two roles, zero conflict.

---

## § 4 D-03 `versions/` dir + `--known-good` flag commander.js integration

**Confidence: HIGH** — `src/cli/install.ts` L46-56 commander option chain 直证 + sister 5-flag pattern.

### 4.1 推荐 `versions/0.3.0-known-good.yaml` MVP file ⭐

```yaml
# versions/0.3.0-known-good.yaml — Phase 3.3 R7.6 MVP seed
# Phase 3.4 dogfood fills upstreams with actual e2e-verified pinned versions
schemaVersion: harnessed.known-good.v1
harnessed_version: '0.3.0'
e2e_verified_at: '2026-05-17'  # placeholder; Phase 3.4 updates with actual e2e date
upstreams: []  # Phase 3.4 dogfood adds: [{name:'claude-agent-sdk', version:'0.3.142', install_method:'npm-cli'}, ...]
```

**MVP choice locked**: ship 1 file empty `upstreams: []` (Discretion locked) — Phase 3.4 dogfood adds e2e_verified actual pinned. `--known-good` flag still functional (returns null pinned → falls back to manifest `version:` field).

### 4.2 推荐 `src/manifest/schema/known-good.v1.ts` NEW ~40L

```typescript
// src/manifest/schema/known-good.v1.ts NEW ~40L (sister aliases.v1.ts pattern)
import { type Static, Type } from '@sinclair/typebox'
import { SCHEMA_VERSIONS } from '../../types/schemaVersion.js'

/** Single upstream pinned version entry. install_method enum per Phase 2.1
 *  6 install method (npm-cli / mcp-stdio-add / git-clone / etc). */
export const PinnedUpstreamV1 = Type.Object(
  {
    name: Type.String({ minLength: 1 }),
    version: Type.String({ minLength: 1 }),
    install_method: Type.String({ minLength: 1 }),  // free-form to avoid coupling with InstallType enum
  },
  { additionalProperties: false },
)

export const KnownGoodV1 = Type.Object(
  {
    schemaVersion: Type.Literal(SCHEMA_VERSIONS.knownGood),  // 'harnessed.known-good.v1'
    harnessed_version: Type.String({ pattern: '^\\d+\\.\\d+\\.\\d+$' }),
    e2e_verified_at: Type.String({ pattern: '^\\d{4}-\\d{2}-\\d{2}$' }),
    upstreams: Type.Array(PinnedUpstreamV1),
  },
  { additionalProperties: false },
)

export type KnownGoodV1Type = Static<typeof KnownGoodV1>
```

**Design**: free-form `install_method: Type.String` (NOT InstallType enum union) — avoid coupling known-good.v1 with manifest spec.ts InstallType (changing InstallType wouldn't break known-good consumers). Phase 3.3 MVP keeps loose coupling; Phase 3.5+ could tighten if needed.

### 4.3 推荐 `--known-good` flag commander.js integration (lazy resolve)

```typescript
// src/cli/install.ts L46-56 ADD 1 option line (sister --apply/--dry-run/--system 5-flag pattern)
program
  .command('install <name>')
  .description('Install an upstream (dry-run by default — pass --apply to execute)')
  .option('--apply', 'execute the install (default: dry-run preview only)')
  .option('--dry-run', 'force dry-run (overrides --apply if both are set)')
  .option('--system', 'allow L4 system-wide install (e.g. global npm install)')
  .option('--non-interactive', 'skip all prompts (CI / scripts) — requires --apply or --dry-run')
  .option('--full-diff', 'expand diffs longer than 200 lines')
  .option('--no-color', 'disable ANSI colors (auto-detected when piped)')
  .option('--known-good', 'use known-good version lock from versions/<harnessed-ver>-known-good.yaml')  // ← ADD
  .action(async (name: string, raw: RawOpts) => {
    // ... existing logic ...
    // Lazy load known-good only when flag set (Karpathy YAGNI per Discretion locked)
    if (raw.knownGood) {
      const { getPinnedVersion } = await import('../manifest/knownGood.js')
      const harnessedVer = '0.3.0' // TODO Phase 3.4: read from package.json
      const pinned = getPinnedVersion(v.manifest.metadata.name, harnessedVer)
      if (pinned && v.manifest.spec.install.method === 'npm-cli') {
        // Override the manifest version field with pinned version
        ;(v.manifest.spec.install as { npm_version?: string }).npm_version = pinned
      }
    }
    // ... continue to runInstall(v.manifest, opts) ...
```

**RawOpts interface update** (L30-37): add `knownGood?: boolean` field (commander auto-converts `--known-good` → `knownGood`).

[HIGH — commander v13 `.option('--flag-name', 'desc')` standard pattern + `src/cli/install.ts` L46-56 直证 sister 5-flag chain]

### 4.4 推荐 `src/manifest/knownGood.ts` loader (≤45L Karpathy)

```typescript
// src/manifest/knownGood.ts NEW ~40L (sister aliases.ts pattern)
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Value } from '@sinclair/typebox/value'
import { parse } from 'yaml'
import { KnownGoodV1, type KnownGoodV1Type } from './schema/known-good.v1.js'

const versionsDir = (): string => join(process.cwd(), 'versions')

const _cache = new Map<string, KnownGoodV1Type | null>()

/** Load versions/<harnessedVer>-known-good.yaml; memoized per harnessedVer. */
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

**Karpathy fail-loud discipline**: schema invalid → throw (sister aliases.ts pattern). File missing → null (graceful — `--known-good` flag without lock file = no-op).

[HIGH — sister Phase 3.2 W1 readGovernance file-based loader pattern]

---

## § 5 schemaVersion 12th + 13th surface decision

**Confidence: HIGH** — `src/types/schemaVersion.ts` L40-66 11-surface 直证 + sister Phase 3.2 W0.3 colocation rule.

### 5.1 推荐: 双 add (sister Phase 3.2 W1 T1.1 9+10 双加 precedent) ⭐

| Surface | Name | Schema location | Owner | Reader |
|---------|------|-----------------|-------|--------|
| **12th** | `harnessed.aliases.v1` | `src/manifest/schema/aliases.v1.ts` NEW | `manifests/aliases.yaml` (git-tracked, human-edited) | `src/manifest/aliases.ts` (loadAliases) + `src/cli/lib/check-deprecations.ts` (consumer) |
| **13th** | `harnessed.known-good.v1` | `src/manifest/schema/known-good.v1.ts` NEW | `versions/<ver>-known-good.yaml` (git-tracked, release-process-managed) | `src/manifest/knownGood.ts` (loadKnownGood) + `src/cli/install.ts` (consumer via --known-good flag) |

### 5.2 `src/types/schemaVersion.ts` MODIFY (+4L cross 2 处)

```typescript
// src/types/schemaVersion.ts L40-51 SCHEMA_VERSIONS const + L55-66 SchemaVersionLiteral Union
export const SCHEMA_VERSIONS = {
  // ... 11 existing ...
  aliases: 'harnessed.aliases.v1',          // ← Phase 3.3 W1 ADD 12th surface (D-01 RICH aliases.yaml)
  knownGood: 'harnessed.known-good.v1',     // ← Phase 3.3 W1 ADD 13th surface (D-03 YAML version lock)
} as const

export const SchemaVersionLiteral = Type.Union([
  // ... 11 existing ...
  Type.Literal(SCHEMA_VERSIONS.aliases),    // ← Phase 3.3 W1 ADD 12th surface
  Type.Literal(SCHEMA_VERSIONS.knownGood),  // ← Phase 3.3 W1 ADD 13th surface
])
```

**Net delta**: 11 → 13 surface (双 +1, 沿袭 Phase 3.2 W1 T1.1 8→10 双加 precedent — actually 9→11 after planFeature 加, but pattern same). +4L cross 2 处.

### 5.3 Colocation rule (sister Phase 3.2 W0.3 path divergence acknowledgment)

**Schemas live with primary consumers (Karpathy single-responsibility)**:
- `src/workflow/schema/` (4 files): workflow-domain (consumed by `src/workflow/` modules)
- `src/checkpoint/schema/` (2 files): checkpoint-domain (consumed by `src/checkpoint/` modules)
- `src/manifest/schema/` (4 modules + 2 NEW): manifest-domain (consumed by `src/manifest/` + `src/cli/install.ts`)

**Phase 3.3 12+13 surface = manifest-domain** → `src/manifest/schema/{aliases.v1, known-good.v1}.ts` (NOT `src/workflow/schema/` or `src/checkpoint/schema/`). aliases + known-good metadata are git-tracked project artifacts (NOT runtime `.harnessed/` state), 沿袭 sister `src/manifest/schema/spec.ts` 项目 metadata 模式.

### 5.4 Verification post-W1 T1.1

```bash
# Sister Phase 3.2 W0.3 verification 命令 (本 phase 13 not 10):
grep -cE "harnessed\.\w+\.v1" src/types/schemaVersion.ts  # expect ≥ 13 post-W1 T1.1 (was 11)
grep -r "branchOnSchemaVersion" src/ | wc -l              # expect ≥ 4 (no new consumer added — aliases/knownGood use Value.Check directly, no version branching needed for v1-only surfaces)
```

[HIGH — sister Phase 3.2 W0.3 schema decision doc L67-76 verification 模式]

---

## § 6 W0.1 STATE.md COLLAPSE + freshness gate STATE_POSITION_RE 扩

**Confidence: HIGH** — `scripts/check-transparency-verdicts.mjs` L20 + L29-30 dual-token gate 直证 + STATE.md L21-26 "当前位置"块 5+ markers 实测.

### 6.1 STATE.md COLLAPSE delta (≤30L per CONTEXT.md ≤30L delta spec)

**删除 target**:
- L4 `> Status: v0.1.0 SHIPPED & ARCHIVED · **🎯 v0.2.0 MILESTONE 4/4 SHIPPED & ARCHIVED** ...` (整行删, 含其余 inline ship 记录)
- L5 `> 最后更新：2026-05-17（**Phase 3.2 SHIPPED** ...）` (整行删)

**保留 SSOT** — "当前位置" block L21-26:
- L23 `**GSD phase**：✅ **Phase 3.2 SHIPPED** ...` (multi-phase chain, 沿袭 Phase 2.4+3.1+3.2 pattern, latest first)
- L24 `**当前里程碑**：v0.3.0 plan-feature workflow + checkpoint ...`
- L25 `**下一 phase**：**Phase 3.3 plan-phase 启动** ...`
- L26 `**状态**：✅ **Phase 3.2 SHIPPED** ...`

**Net delta**: STATE.md -2 lines (L4+L5 删) + 0 add (现有 L21-26 SSOT 已 cover 全部 Status/最后更新 信息). Total -2 lines, well within ≤30L delta spec.

### 6.2 Gate STATE_POSITION_RE 扩 — OR-fallback for STATE.md scope

**`scripts/check-transparency-verdicts.mjs` MODIFY**:

```javascript
// 现 L20 STATUS_MARKER (first 50 lines scan, required currently)
const STATUS_MARKER = /^\s*>?\s*\*{0,2}(?:Status|状态)\*{0,2}\s*[:：]\s*(.+)$/m
// 现 L29-30 STATE_LATEST_SUBPHASE_RE (全文 scan, currently used only for getLatestShippedSubphase token extraction)
const STATE_LATEST_SUBPHASE_RE = /\*{2}Phase\s+(\d+\.\d+)\s+SHIPPED\*{2}/g

// W0.1 ADD: STATE_POSITION_RE — full-file scan, used as OR-fallback for STATE.md
const STATE_POSITION_RE = /\*\*Phase [1-9]\.[0-9]+ SHIPPED\*\*/m  // single match needed (m flag, NOT g)

// L53-91 checkFreshness MODIFY — STATE.md OR-fallback branch
function checkFreshness(violations) {
  const milestone = getLatestShippedToken()
  const subphase = getLatestShippedSubphase()
  if (!milestone && !subphase) return
  for (const file of FRONT_MATTER_DOCS) {
    let head
    try {
      head = readFileSync(file, 'utf8').split(/\r?\n/).slice(0, 50).join('\n')
    } catch {
      violations.push(`${file}:0  front-matter doc missing`)
      continue
    }
    const match = head.match(STATUS_MARKER)
    if (!match) {
      // W0.1 OR-fallback: for STATE.md specifically, accept STATE_POSITION_RE on FULL file
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
    // ... existing milestone + subphase content checks ...
  }
}
```

**Logic**: 
- README.md + PROJECT-SPEC.md still require STATUS_MARKER (unchanged) — those are user-facing docs, Status: line is semantic anchor
- STATE.md OR-fallback: if STATUS_MARKER 没匹配 (because W0.1 删 L4), fallback to scan full file for `STATE_POSITION_RE` (always saturated after W0.1 — L21-26 + L36 have 5+ matches)

### 6.3 W0.1 Acceptance bar (verbatim from CONTEXT.md L139)

```bash
# AC-1: L4 Status: 行删
! grep -q "^> Status:" .planning/STATE.md  # exit 0 expected

# AC-2: STATE.md 仍含 Phase 3.2 literal (verify 当前位置 block 完整保留)
grep -q "\*\*Phase 3\.2 SHIPPED\*\*" .planning/STATE.md  # exit 0 expected

# AC-3: transparency gate pass post-W0.1
node scripts/check-transparency-verdicts.mjs  # exit 0 expected ("all verdict marker lines compliant.")
```

### 6.4 Sister 5-recurrence terminus 记录 in commit msg

Per CONTEXT.md L142: "sister 5-recurrence terminus 记录 in commit msg + STATE.md '当前位置'块 1 line note".

**Recommended commit msg** (Karpathy why-not-what):
```
fix(phase-3.3-w0): T0.1 — STATE dual-SSOT 5-recurrence terminus COLLAPSE (D-04 LOCKED)

5th and final recurrence of the dual-SSOT anti-pattern in project memory (4 priors: 
README L9 / README L44 / PROJECT-SPEC / STATE freshness scope). Karpathy YAGNI single 
source of truth: delete STATE.md L4 frontmatter Status: + L5 最后更新 lines; "当前位置" 
block (L21-26) is now sole SSOT. Freshness gate extends with STATE_POSITION_RE OR-fallback
(full-file scan) so STATE.md acceptance check still passes.

Verified: dashboard.mjs parses no L4 frontmatter (RESEARCH § 1.1 12-match grep evidence) 
— D-04 (b) COLLAPSE safe; no dashboard fix needed.
```

[HIGH — `scripts/check-transparency-verdicts.mjs` L1-112 + CONTEXT.md L132-142 直证]

---

## § 7 W0.2 dashboard-sse 4 cell flaky fix path (a) random ephemeral port

**Confidence: HIGH** — `tests/scripts/dashboard-sse.test.ts` L17 hard-coded PORT + L84-94 beforeAll skip pattern 直证.

### 7.1 推荐 fix recipe (Path A locked per Discretion)

**Step 1 — `scripts/dashboard.mjs` L39 MODIFY (1-line additive, default preserved)**:

```javascript
// 现 L39 const PORT = 47180
// W0.2 MODIFY → env var override (default 47180 unchanged for prod hook):
const PORT = Number(process.env.DASHBOARD_PORT ?? 47180)
```

**Step 2 — `tests/scripts/dashboard-sse.test.ts` MODIFY (~25L delta)**:

```typescript
// L8-17 imports + constants MODIFY
import { createServer as createNetServer } from 'node:net'
// ... rest of imports ...

const DASHBOARD = join(process.cwd(), 'scripts', 'dashboard.mjs')

// Random ephemeral port helper (sister Node net.createServer best practice)
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

let PORT = 0 // populated in beforeAll

// L24-27 httpGet + L46-50 sseConnect MODIFY: reference PORT var (not constant)
// ... (replace all `port: PORT` with closure reference — TypeScript const-to-let migration)

// L67-79 waitFor + retry helper MODIFY (Win 3-tier timeout pattern):
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

// L84-107 beforeAll MODIFY (remove portTaken probe, always use fresh ephemeral port)
beforeAll(async () => {
  PORT = await getEphemeralPort()

  const tmpRoot = await mkdtemp(join(tmpdir(), 'dash-sse-'))
  await mkdir(join(tmpRoot, '.planning'), { recursive: true })
  await writeFile(join(tmpRoot, '.planning', 'STATE.md'), '# initial state\n')

  const proc = spawn(process.execPath, [DASHBOARD, '--no-open'], {
    cwd: tmpRoot,
    stdio: 'ignore',
    detached: false,
    env: { ...process.env, DASHBOARD_PORT: String(PORT) },  // ← inject env var
  })
  handle = { proc, tmpRoot }
  await waitFor(PORT, 8000)  // Win 3-tier timeout: 8s (sister Phase 2.4 W4 ralph-loop pattern)
}, 15_000)

// L116-155 4 cells MODIFY: remove `if (portTaken.value) return` skip branches (always run)
```

**Step 3 — verify Win local 4/4 pass**:

```bash
corepack pnpm test -- --run tests/scripts/dashboard-sse.test.ts 2>&1 | tail -3
# Expected: "Test Files 1 passed | ... | Tests 4 passed | ..."
```

### 7.2 Net delta count (per CONTEXT.md ≤40L delta spec)

| File | Delta | Within ≤40L? |
|------|-------|-------------|
| `scripts/dashboard.mjs` L39 | +1L (env var override) | ✅ |
| `tests/scripts/dashboard-sse.test.ts` | +20L (getEphemeralPort helper + waitFor retry + beforeAll env inject) -8L (removed portTaken probe + 4 cell skip branches) = net +12L | ✅ ≤40L |

**Total**: +13L delta (under ≤40L spec budget).

### 7.3 Sister Win 3-tier timeout pattern (Phase 2.4 W4)

Phase 2.4 W4 ralph-loop sentinel test uses 3-tier timeout pattern: 8s default, 3 retry exponential. Adopt same here: `timeoutMs = 8000` + 100ms inner sleep + retry-until-timeout (no exponential needed for HTTP probe).

[HIGH — `tests/scripts/dashboard-sse.test.ts` L17 + L84-107 直证 + Node `net.createServer().listen(0)` MDN standard]

---

## § 8 install path resolveAlias inject location

**Confidence: HIGH** — `src/cli/install.ts` L66-83 readFile-try-catch path 直证, 1-line insert location verified.

### 8.1 推荐: pre-manifest-lookup (1 line, predictable) ⭐

**Location**: `src/cli/install.ts` L65-66 BEFORE `const manifestPath = resolve(...)` line.

```typescript
// L56-66 action handler MODIFY (insert 1 line BEFORE manifest path resolve)
.action(async (name: string, raw: RawOpts) => {
  // H1 pre-action flag gate (existing L57-64) ...
  if (raw.nonInteractive && !raw.apply && !raw.dryRun) { ... }

  // Phase 3.3 W1 ADD — D-01 alias redirect (D-02 install silent redirect, no console output)
  const { resolveAlias } = await import('../manifest/aliases.js')
  const resolvedName = resolveAlias(name) ?? name
  // ↑ 1 line additive; resolvedName === name if no alias (Karpathy fail-soft)

  const manifestPath = resolve(process.cwd(), `manifests/tools/${resolvedName}.yaml`)
  const skillPackPath = resolve(process.cwd(), `manifests/skill-packs/${resolvedName}.yaml`)
  // ... rest unchanged (uses resolvedName throughout) ...
```

### 8.2 Rationale (post-not-found 路径 rejected)

**Alternative considered — post-manifest-not-found (alias as 404 fallback)**:

```typescript
try {
  yamlSrc = await readFile(manifestPath, 'utf8')
} catch {
  try {
    yamlSrc = await readFile(skillPackPath, 'utf8')
  } catch {
    // ALT: check alias here, retry both paths
    const { resolveAlias } = await import('../manifest/aliases.js')
    const aliased = resolveAlias(name)
    if (aliased) {
      // retry with aliased name ... (more lines, less predictable)
    } else {
      console.error(`manifest '${name}' not found ...`)
    }
  }
}
```

**Rejected because**:
- More lines (~6L delta vs ~2L pre-lookup)
- Less predictable: aliased name resolution happens AFTER both manifest dir lookups fail (slower path)
- Bug risk: if `old-name.yaml` AND alias both exist, user gets `old-name.yaml` (not the redirect) — semantic surprise

**Pre-lookup verbatim wins**: 1-line additive + Karpathy surgical + predictable + sister Phase 3.2 W2 interpolate.ts JINJA `{{ prefix }}` insert location pattern.

[HIGH — `src/cli/install.ts` L65-67 直证 + Karpathy 1-line additive surgical 心法]

### 8.3 install path silent redirect (D-02 lock — no console.log)

**Locked**: install path uses `resolvedName` silently (NO `console.log('redirecting old-name → new-name')` warning). Per D-02 DOCTOR-ONLY-WARN: install is silent, doctor surfaces the deprecation warning separately.

If user later runs `doctor`, they see the deprecation warning + RICH metadata + fix hint ("install paths auto-redirect; consider migrating manifest references"). Two surfaces, two roles.

R7.5 验收语义 "install 通过 + 提示" 由 install 通过 (silent redirect) + doctor 提示 (table format multi-deprecation) 两个 surface 共同达成.

---

## § 9 W0.3 schemaVersion 12+13 surface decision doc

**Confidence: HIGH** — sister Phase 3.2 W0.3 `W0.3-schema-decision.md` L1-76 直接 model.

### 9.1 推荐 W0.3 doc structure (~60L sister Phase 3.2 W0.3 76L)

**File**: `.planning/phase-3.3/W0.3-schema-decision.md`

**Sections** (sister Phase 3.2 W0.3 L1-76 模板):

1. **Decision** (1 line) — "NEW double-add 2 surfaces: `harnessed.aliases.v1` (12th, D-01 RICH) + `harnessed.known-good.v1` (13th, D-03 YAML version lock)"
2. **Rationale** (4 numbered points):
   - Karpathy single-responsibility: aliases + known-good are distinct manifest-domain concepts (sister Phase 3.2 W0.3 § 1 governance vs current-workflow same-distinct pattern)
   - Manifest-domain colocation: schemas live with primary consumers — both consumed by `src/manifest/*.ts` + `src/cli/install.ts`
   - Sister Phase 3.2 W1 9+10 双加 precedent — cost ~+4L cross 2 处 + 2 NEW schema files (acceptable trade-off)
   - Sister Phase 3.1 W1 8th surface schema/ colocation pattern延续 (currentWorkflow.v1 在 checkpoint/schema/)
3. **Path divergence from PATTERNS.md** (planner-revision iter 1 acknowledgment 沿袭 sister Phase 3.2 W0.3 L19-29) — IF PATTERNS.md sketches alternative path
4. **Schema specs** (2 sub-sections, sister W0.3 L31-61):
   - `manifests/aliases.yaml ↔ src/manifest/schema/aliases.v1.ts` (12th surface)
   - `versions/<ver>-known-good.yaml ↔ src/manifest/schema/known-good.v1.ts` (13th surface)
5. **Implementation order** (W1 T1.X breakdown — sister W0.3 L63-69)
6. **Verification** (grep commands — sister W0.3 L72-76)

### 9.2 Sister Phase 3.2 W0.3 path divergence rule reuse

Phase 3.3 W0.3 should explicitly note (if applicable):
- aliases.v1 placed at `src/manifest/schema/aliases.v1.ts` (NOT `src/workflow/schema/` or `src/checkpoint/schema/`) — manifest-domain consumer
- known-good.v1 placed at `src/manifest/schema/known-good.v1.ts` (sister) — manifest-domain consumer

Phase 3.2 W0.3 L29 "Karpathy-aligned: smallest change with clearest consumer locality" 模式直接 reuse.

[HIGH — sister Phase 3.2 W0.3 L1-76 直接 model]

---

## § 10 Validation Architecture (Nyquist gate prep)

> Phase config `workflow.nyquist_validation` 假设 enabled (absence = enabled per spec).

### 10.1 8 dimension test count recommendation

| Dimension | Phase 3.3 surface | Test count target | Anchor |
|-----------|-------------------|------------------|--------|
| **Functional** | resolveAlias (null + hit + chained?) + getPinnedVersion (null + hit) + listDeprecations (empty + N entries) + checkDeprecations CheckResult (pass + warn + fail) + loadAliases / loadKnownGood schema validate happy | ≥ **10 fixture** (resolveAlias 3 + getPinnedVersion 2 + listDeprecations 2 + checkDeprecations 3) | `tests/manifest/aliases.test.ts` (5) + `tests/manifest/knownGood.test.ts` (3) + `tests/cli/check-deprecations.test.ts` (3) |
| **Contractual** | aliases.v1 + known-good.v1 schema lock — happy + missing required field + extra field + invalid ISO-date + invalid semver | ≥ **8 fixture** (aliases.v1 4 + known-good.v1 4) | `tests/manifest/schema/aliases-v1.test.ts` (4) + `tests/manifest/schema/known-good-v1.test.ts` (4) |
| **Integration** | install consume resolveAlias (rename redirect e2e) + install --known-good consume getPinnedVersion (version override e2e) + doctor 7th check end-to-end with seed aliases.yaml | ≥ **5 fixture** (install rename e2e 2 + install --known-good 2 + doctor 7th 1) | `tests/integration/install-aliases.test.ts` (3) + `tests/integration/install-known-good.test.ts` (2) |
| **Observability** | doctor `--json` deprecations array output + doctor human-readable table format + install silent redirect (NO console output verify) | ≥ **3 fixture** (`doctor --json` JSON.parse round-trip + table format string match + install silent stdout assertion) | `tests/cli/doctor-deprecations-json.test.ts` (1) + `tests/cli/doctor-deprecations-human.test.ts` (1) + `tests/integration/install-silent-redirect.test.ts` (1) |
| **Failure-mode** | aliases.yaml not found (loadAliases null graceful) + aliases.yaml schema invalid throw + known-good file not found + known-good schema invalid + install --known-good upstream not in lock (fallback to manifest version) + corrupted yaml (parse error) | ≥ **6 fixture** | distributed: `tests/manifest/aliases.test.ts` (2) + `tests/manifest/knownGood.test.ts` (2) + `tests/integration/install-known-good.test.ts` (2 — not-found + corrupted) |
| **Performance** | aliases.yaml memoized load (single readFile per process) + known-good load lazy (only on flag) — micro-bench < 5ms p99 cold load | ≥ **1 micro-bench** | `tests/manifest/aliases-perf.bench.ts` (1 fixture, vitest bench) |
| **Migration** | Phase 3.2 → 3.3 carry: doctor 6 → 7 check add (existing 6 fixtures still pass + new 1 fixture for 7th check dispatch) + schemaVersion 11 → 13 surface (existing 11 surface tests still pass + 2 new tests for aliases.v1/known-good.v1 register) | ≥ **2 fixture** (doctor 7-check exit code matrix + schemaVersion 13-surface register grep verify) | `tests/cli/doctor.test.ts` (1 — adds case for 7th check) + `tests/unit/types-schemaVersion.test.ts` (1 — 13-surface count assertion) |
| **Security** | aliases.yaml not user-writable assumption (project-tracked, code review gate) — threat: malicious aliases.yaml `aliases.<harmful>: { redirect: '..../etc/passwd' }` → Value.Check + path resolve safety (manifests/tools/<name>.yaml — `..` chars not allowed in name); known-good audit trail (git blame on versions/<ver>-known-good.yaml = release-process accountability) | ≥ **3 fixture** (path traversal redirect safety + Value.Check rejects extra field tampering + version semver validation rejects garbage) | `tests/manifest/aliases-security.test.ts` (2) + `tests/manifest/knownGood-security.test.ts` (1) |

**Total fixture target**: ≥ **10 (functional) + 8 (contract) + 5 (integration) + 3 (observ) + 6 (failure) + 1 (perf) + 2 (migration) + 3 (security)** = **≥ 38 NEW test fixture**

Sister Phase 3.2 ≥ 43 fixture (3 surface跨); Phase 3.3 ≥ 38 fixture (2 surface跨, slightly smaller). Within sister cadence.

### 10.2 Sampling rate

- **Per task commit**: `corepack pnpm test -- --run tests/manifest/<file>.test.ts` (≤ 5s typical)
- **Per wave merge**: `corepack pnpm test` (full suite, ~30-35s based on Phase 3.2 623 test baseline + 38 new ≈ 661 total)
- **Phase gate**: full suite green + `corepack pnpm test -- --run tests/integration/install-aliases.test.ts` 3 fixture all green + `tests/integration/install-known-good.test.ts` 2 fixture all green before `/gsd-verify-work`

### 10.3 Wave 0 gaps

- [ ] `tests/manifest/aliases.test.ts` — covers resolveAlias + listDeprecations + failure modes (R7.5)
- [ ] `tests/manifest/knownGood.test.ts` — covers getPinnedVersion + loadKnownGood + failure modes (R7.6)
- [ ] `tests/manifest/schema/aliases-v1.test.ts` — schema lock 4 fixture (12th surface contract)
- [ ] `tests/manifest/schema/known-good-v1.test.ts` — schema lock 4 fixture (13th surface contract)
- [ ] `tests/cli/check-deprecations.test.ts` — 7th check CheckResult dispatch (R7.5 D-02)
- [ ] `tests/cli/doctor-deprecations-json.test.ts` — `--json` output structure (observability)
- [ ] `tests/cli/doctor-deprecations-human.test.ts` — human-readable table format (observability)
- [ ] `tests/integration/install-aliases.test.ts` — install redirect e2e 3 fixture (R7.5 验收)
- [ ] `tests/integration/install-known-good.test.ts` — install --known-good e2e 2 fixture (R7.6 验收)
- [ ] `tests/integration/install-silent-redirect.test.ts` — install path NO console output assertion (D-02)
- [ ] `tests/manifest/aliases-perf.bench.ts` — memoization micro-bench (perf)
- [ ] `tests/manifest/aliases-security.test.ts` — path traversal redirect safety (security)
- [ ] `tests/manifest/knownGood-security.test.ts` — semver validation rejection (security)

(Framework install: vitest 既存; no new dep needed — same as Phase 3.2.)

### 10.4 Threat model nodes (security dimension brief)

| Threat | STRIDE | Mitigation |
|--------|--------|-----------|
| Malicious aliases.yaml `redirect: '../../../etc/passwd'` (path traversal via redirect name) | Tampering | install.ts resolves `manifests/tools/${resolvedName}.yaml` → `..` in name would cause path break, but `path.resolve` 不允 cwd 外 traversal (Node resolve absolute-safe); + Value.Check `minLength: 1` 仅校长度 NOT content — additional defense: install.ts could regex-guard `resolvedName` against `/[/\\.]/` chars (Phase 3.4 hardening if real threat surfaces) |
| Malicious aliases.yaml huge `reason` field DOS | DOS | TypeBox `maxLength: 500` cap on AliasEntryV1.reason (§ 2.1) |
| Malicious known-good.yaml fake harnessed_version (e.g., 9.9.9 to mislead users) | Tampering | known-good.yaml is git-tracked + release-process-managed; PR review gate. Schema accepts any semver, content audit is process-level not code-level |
| install --known-good with malicious version string injection (`'$(rm -rf /)'`) | Injection | TypeBox `Type.String({minLength:1})` 仅 length validate; install.ts uses version as parameter to npm-cli installer — sister Phase 2.1 audit cmd-injection SHELL_EVAL_MARKERS refinement applies (npm-cli installer params already sanitized) |
| aliases.yaml schema drift (extra field tampering) | Tampering | `additionalProperties: false` strict (sister Phase 3.2 W1 pattern) — Value.Check fail-loud throw |

[MEDIUM-HIGH — sister Phase 3.2 § 11.4 threat model + TypeBox schema-validated input boundary pattern]

---

## § 11 W0.3 schema decision doc (referenced from § 9)

See § 9 — W0.3 doc structure is the actionable output for the planner. Recommended path: `.planning/phase-3.3/W0.3-schema-decision.md` ~60L sister Phase 3.2 W0.3.

---

## § 12 Wave topology recommendation

**Confidence: HIGH** — sister Phase 3.2 4-wave (W0-W3) 模式直证, 本 phase scope 类似 (W0 backlog absorb + 2 surface impl + e2e + ship).

### 12.1 推荐: 3 wave (W0-W2) topology

| Wave | Scope | Tasks | LOC delta est | Tests delta |
|------|-------|-------|--------------|-------------|
| **W0** backlog 3 项 absorb (必修) | W0.1 STATE COLLAPSE + freshness gate STATE_POSITION_RE 扩 + W0.2 dashboard-sse random port + retry helper + W0.3 schemaVersion 12+13 decision doc | 3 atomic | -2L STATE.md + ~10L check-transparency-verdicts.mjs + +13L dashboard-sse.test.ts + +1L dashboard.mjs + ~60L W0.3 decision doc | 0 NEW fixture (W0.2 fixes existing 4 cell flaky; passes 4/4) |
| **W1** schemas + manifest + doctor 7th + install integrate | T1.1 schemaVersion 12+13 surface add (+4L) + T1.2 aliases.v1 schema NEW (~35L) + T1.3 known-good.v1 schema NEW (~40L) + T1.4 aliases.ts loader NEW (~35L) + T1.5 knownGood.ts loader NEW (~40L) + T1.6 check-deprecations.ts NEW (~35L) + T1.7 doctor.ts 7th check wire (+5L MODIFY) + T1.8 install.ts resolveAlias inject (+2L MODIFY) + T1.9 install.ts --known-good flag (+8L MODIFY) + T1.10 manifests/aliases.yaml NEW (~10L) + T1.11 versions/0.3.0-known-good.yaml NEW (~10L) | 11 atomic | +185L src/schemas/tests + +20L yaml NEW | +30 fixture (functional 10 + contract 8 + observability 3 + failure 6 + perf 1 + migration 2) |
| **W2** integration e2e + ADR + STATE/RETRO/ROADMAP + ship | T2.1 install-aliases integration test (3 fixture) + T2.2 install-known-good integration test (2 fixture) + T2.3 install-silent-redirect test (1 fixture) + T2.4 security tests (3 fixture) + T2.5 ADR 0016 9 章节 errata + T2.6 STATE.md continued + T2.7 RETROSPECTIVE.md + T2.8 ROADMAP Phase 3.3 mark shipped + T2.9 ci.yml A7 iter 1-0016 + T2.10 baseline tag + T2.11 milestone tag (v0.3.0-alpha.3-aliases-known-good) | 11 atomic | +200L ADR + 10L docs + tags | +8 fixture (integration 5 + security 3) |

**Total wave breakdown**:
- 3 wave (Phase 3.2 是 4 wave; 本 phase scope 更小 — 2 surface vs 3 surface)
- 25 atomic task (Phase 3.2 是 23 atomic — comparable)
- ~205L src delta (excl. tests + schemas + yaml + MD)
- ~38 NEW fixture (sister Phase 3.2 43 fixture; smaller)
- 1 ADR 0016 (9 章节 errata per Phase 3.1+3.2 sister 模式)

### 12.2 Wave 依赖 graph

```
W0 (必修 first) ─┬─> W1 (schemas + manifest impl + CLI wire)
                 │
                 └─> (W0.3 decision doc gates W1 T1.1 schemaVersion 12+13 add)
                       │
                       └─> W2 (e2e integration + ADR + ship)
```

W0 内 3 task 独立 (test fix + docs fix + decision doc); W1 内 11 task partial DAG (T1.1 schemaVersion 先 → T1.2+T1.3 schemas 并行 → T1.4+T1.5+T1.6 loaders 并行 → T1.7+T1.8+T1.9 CLI wire 后 → T1.10+T1.11 yaml seed 最后); W2 全串行 (integration first, ADR + docs 后, tags last).

### 12.3 Karpathy hard limit verification

每 wave 完后 verify per-file ≤ 200L hard limit:

| File | Pre | Post W1 | Within limit? |
|------|-----|---------|--------------|
| `src/cli/doctor.ts` | 184L | ~189L (+5L dispatch) | ✅ ≤200 |
| `src/cli/lib/check-deprecations.ts` NEW | 0 | ~35L | ✅ ≤40L (CONTEXT spec) |
| `src/cli/install.ts` | 117L | ~127L (+10L resolveAlias + --known-good lazy load) | ✅ ≤200 |
| `src/manifest/aliases.ts` NEW | 0 | ~35L | ✅ ≤40L (CONTEXT spec) |
| `src/manifest/knownGood.ts` NEW | 0 | ~40L | ✅ ≤45L (CONTEXT spec) |
| `src/manifest/schema/aliases.v1.ts` NEW | 0 | ~35L | ✅ ≤40L |
| `src/manifest/schema/known-good.v1.ts` NEW | 0 | ~40L | ✅ ≤45L |
| `src/types/schemaVersion.ts` | 80L | ~84L (+2L SCHEMA_VERSIONS + +2L Union) | ✅ ≤200 |

[HIGH — Karpathy hard limit per file verified at design time]

---

## § 13 Karpathy anti-pattern checks (optional)

**Confidence: MEDIUM** — 5 anti-pattern risks identified by reasoning about scope; not spike-verified.

### 13.1 5 anti-pattern at risk + counter-discipline

| # | Anti-pattern temptation | Why risky | Counter-discipline |
|---|------------------------|-----------|-------------------|
| 1 | **FormatRegistry sneak `format: 'date'` for ISO-date** — D-01 + D-03 specs explicitly need ISO YYYY-MM-DD | Sister Phase 3.2 W2 Rule 1 lesson: FormatRegistry not 注册 in TypeBox 0.34 by default; `format: 'date'` silently passes (Value.Check returns true even for garbage) | 严格锁 `pattern: '^\\d{4}-\\d{2}-\\d{2}$'` (verbatim); add unit test asserting `Value.Check(schema, {deprecation_date: 'not-a-date'})` returns false |
| 2 | **Dual-SSOT 5th recurrence terminus betrayed** — W0.1 D-04 collapse + gate STATE_POSITION_RE 双管下 | 若 plan 加 "dashboard.mjs 同时 fix" → 又制造 dual-state (one is `当前位置` content, other is gate regex coupling) | 严格锁 § 1.1 verified: dashboard 不 parse L4 frontmatter → 0 dashboard.mjs fix in W0.1. Gate extend is OR-fallback NOT additional STATE.md requirement |
| 3 | **install-time warning sneak** — easy to add `console.warn('redirecting old → new')` during W1 T1.8 implementation | D-02 DOCTOR-ONLY-WARN 守门 explicitly forbids this; install path 仅 redirect, NO output (R7.5 验收 "install 通过" 语义对齐) | 整数 T1.8 acceptance bar: `corepack pnpm test -- --run tests/integration/install-silent-redirect.test.ts` 1 fixture asserts stdout NOT contain 'redirect|deprecated' substring; CI gate enforces |
| 4 | **aliases over-engineering** — TIERED Union (string OR object) or nested groups (aliases.upstream.<name>) | D-01 RICH 仅含必需 metadata (5 fields), TIERED/Union 反 rejected per CONTEXT.md L277-278 | 严格锁 § 2.1 schema: 5 fields top + 1 optional, flat Record<string, AliasEntryV1>. Reviewer must reject PRs adding nested groups or union types |
| 5 | **known-good eager validate at boot** — load all known-good files at CLI startup "for safety" | Karpathy YAGNI 违反 + perf cost (multiple readFile + Value.Check for unused files); Discretion locked lazy load | 严格锁 § 4.3 `--known-good` flag check first, then dynamic import + load. unit test: `corepack pnpm test -- --run tests/manifest/aliases-perf.bench.ts` verifies cold-start CLI 不调 loadKnownGood (assertion via vi.spy on fs.readFileSync) |

### 13.2 Karpathy 4 心法 application checklist

| 心法 | Application |
|------|-------------|
| **Think Before Coding** | Wave A R2 (本 RESEARCH) + Wave A R1 (PATTERNS reuse Phase 3.2) 完后才进 Wave B planner; D-01 + D-03 schema 决策 spike-first (TypeBox pattern lesson reuse) |
| **Surgical Changes** | W0.1 docs delete 2 lines + gate extend ~10L; W0.2 test mod ~13L + dashboard.mjs +1L; W1 NEW files (no MODIFY 大文件 except install.ts +10L, doctor.ts +5L) |
| **Simplicity First** | Flat aliases.yaml Record map (no nested groups); known-good.yaml empty `upstreams: []` MVP seed; 3 wave (vs Phase 3.2 4 wave 因 scope 更小 — 2 surface vs 3 surface) |
| **Goal-Driven** | R7.5 "模拟上游改名场景 install 通过 + 提示" + R7.6 "harnessed install --known-good reproducible" 是 acceptance ⊕ doctor.ts 不超 200L + 每 NEW file ≤40-45L 是 hard limit — 两 axis 都过即 phase ship |

---

## § 14 Open questions (resolved + remaining)

### Resolved (本 RESEARCH 决)

1. **D-04 dashboard.mjs parse impact?** → § 1.1 dashboard 不 parse L4 frontmatter, COLLAPSE safe (12 grep match 直证)
2. **D-01 aliases.v1 RICH TypeBox shape?** → § 2.1 Type.Record<string, AliasEntryV1> + ISO-date pattern (NOT FormatRegistry)
3. **D-02 doctor 7th check pattern?** → § 3.1 sister 6th `checkGstackPrefix` 100% reuse + § 3.3 table aggregation
4. **D-03 versions/ dir bootstrap?** → § 4.1 ship 1 file empty upstreams MVP + § 4.3 lazy load Karpathy YAGNI
5. **schemaVersion 12+13 colocation?** → § 5.3 `src/manifest/schema/` (NOT workflow/checkpoint — manifest-domain consumer)
6. **W0.1 STATE_POSITION_RE design?** → § 6.2 OR-fallback for STATE.md only (README + PROJECT-SPEC unchanged)
7. **W0.2 fix path?** → § 7.1 random ephemeral port + DASHBOARD_PORT env + 3-tier retry waitFor
8. **install resolveAlias inject location?** → § 8.1 pre-manifest-lookup 1-line (predictable + surgical)
9. **doctor warning aggregation format?** → § 3.3 table per-all (sister Phase 2.4 D-01 array-aggregate)
10. **Wave topology?** → § 12.1 3 wave (W0-W2), 25 atomic task, ~38 NEW fixture

### Remaining (planner 决)

1. **W2 milestone tag 名** — `v0.3.0-alpha.3-aliases-known-good` OR `v0.3.0-alpha.3-deprecation`? — 推 `v0.3.0-alpha.3-aliases-known-good` (D-01 + D-03 双主 feature 平衡命名; D-02 deprecation 是 D-01 enabler)
2. **harnessed_version source-of-truth in install.ts L?** — hardcode `'0.3.0'` for Phase 3.3 MVP vs read from `package.json` — 推 hardcode + Phase 3.4 dogfood 时 inject from package.json (Phase 3.3 MVP YAGNI; Phase 3.4 真有 reproducible 需求时 wire). TODO comment in code marks Phase 3.4 follow-up.
3. **W0.2 dashboard.mjs `DASHBOARD_PORT` env var name choice** — `DASHBOARD_PORT` vs `HARNESSED_DASHBOARD_PORT` (longer, scoped) — 推 `DASHBOARD_PORT` (already used in test file comment L4 "override via DASHBOARD_PORT env var if we add it later" — 现 Phase 3.3 兑现 exactly that designed name)
4. **doctor.ts 7th check `name` field value** — `'deprecated manifests'` vs `'aliases'` vs `'deprecation check'` — 推 `'deprecated manifests'` (sister 6th 'gstack prefix' / 5th 'origin URL' / 4th 'bash flavor (win)' 简短 noun phrase 模式; 含 'deprecated' literal keyword 易 user grep + jq filter)
5. **Path traversal hardening for resolveAlias redirect** (§ 10.4 #1) — Phase 3.3 add regex guard vs Phase 3.4+ harden — 推 Phase 3.4+ (Phase 3.3 MVP relies on git-tracked aliases.yaml + PR review gate; Phase 3.4 dogfood actual deprecations 时若 surface 实际 attack vector 再 harden)

---

## § 15 Assumptions Log

> Claims tagged `[ASSUMED]` in this research (planner + discuss-phase 需 user confirm before execution):

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| (none) | — | — | — |

**All claims verified or sister-cited** — no [ASSUMED] tags in this research. Verifications:
- dashboard.mjs parse impact: grep 12 match 实测 全 categorize (§ 1.1)
- TypeBox `Type.Record` + ISO-date pattern: sister Phase 3.2 W2 Rule 1 lesson + sister `src/workflow/schema/{config,governance}.ts` 直证
- commander v13 `.option()` API: sister `src/cli/install.ts` L46-56 既存 5-flag pattern 直证
- doctor.ts post-W1 LOC estimate 189: `wc -l src/cli/doctor.ts` 184 实测 + 5L NEW (4L function + 1L dispatch) 算
- STATE.md "当前位置" block 5+ markers: grep 10 match 实测 (§ 0.2)
- Phase 3.3 MVP empty upstreams safe: § 4.4 loader returns null pinned → install falls back to manifest version field (graceful Karpathy fail-soft)

---

## § 16 Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | All TypeScript code | ✓ | ≥22 (verified Phase 2.4 doctor.ts L30) | — |
| corepack | `pnpm` invocation | ✓ | (Node 22 bundled) | — |
| pnpm | install + test | ✓ | (corepack-managed) | — |
| TypeScript | tsc + vitest transform | ✓ | (devDependency) | — |
| vitest | test runner | ✓ | (devDependency) | — |
| @sinclair/typebox | schema | ✓ | ^0.34.49 (verified package.json) | — |
| yaml | aliases.yaml + known-good.yaml parse | ✓ | ^2.9.0 (verified package.json, sister `src/manifest/validate.ts` consumer) | — |
| commander | CLI flag parsing | ✓ | ^13.0.0 (verified package.json) | — |
| **net (node:net)** | W0.2 ephemeral port helper | ✓ | (Node built-in) | — |
| biome | preempt lint before commit (CLAUDE.md MEMORY) | ✓ | (devDependency, Phase 2.1.1 → 3.2 cadence) | — |

**Missing dependencies with no fallback**: None.
**Missing dependencies with fallback**: None.

Phase 3.3 is purely Node + TypeScript + existing devDeps — no new dependency needed (sister Phase 3.2 zero-dep cadence延续).

---

## § 17 Sources

### Primary (HIGH confidence)

- `src/cli/doctor.ts` L1-184 — 6-check baseline + `checkGstackPrefix` L136-142 sister pattern 100% reuse model for 7th check
- `src/cli/lib/probe-gstack.ts` L1-48 — PRIMARY helper pattern 100% reuse for `check-deprecations.ts`
- `src/cli/install.ts` L1-117 — install path L46-56 commander option chain + L66-83 readFile-try-catch + L65-66 resolveAlias inject location
- `src/manifest/schema/spec.ts` L1-200 — TypeBox `Type.Object/Union/Literal` + `additionalProperties: false` + pattern regex 范本
- `src/types/schemaVersion.ts` L1-80 — 11-surface register + 12+13 surface 加 cost + `branchOnSchemaVersion<T>()` helper
- `src/workflow/schema/config.ts` + `governance.ts` (Phase 3.2 W1) — sister TypeBox schema 直接 model
- `scripts/check-transparency-verdicts.mjs` L1-112 — W0.1 STATUS_MARKER L20 + STATE_LATEST_SUBPHASE_RE L29-30 + checkFreshness L53-91 extend points
- `scripts/dashboard.mjs` L1-610 — D-04 COLLAPSE safety direct verify (12 grep match 全 categorize)
- `tests/scripts/dashboard-sse.test.ts` L1-156 — W0.2 hard-coded PORT 47180 L17 + beforeAll spawn L84-107 fix recipe location
- `.planning/STATE.md` L1-30 — "当前位置" block L21-26 5+ `**Phase 3.X SHIPPED**` 直证
- `.planning/phase-3.2/W0.3-schema-decision.md` L1-76 — sister W0.3 decision doc 模板
- `.planning/phase-3.2/RESEARCH.md` L1-1309 (chunked read) — sister 18 section format gold-standard reference
- **3.3-CONTEXT.md** L1-292 — 4 D-decisions LOCKED + implementation hints verbatim
- **3.3-KICKOFF.md** L1-86 — W0 backlog 3 项 + 4 D-decision summary
- `.planning/REQUIREMENTS.md` L281-291 — R7.5 + R7.6 验收 bar
- `package.json` — commander ^13.0.0 + @sinclair/typebox ^0.34.49 + yaml ^2.9.0 verified

### Secondary (MEDIUM-HIGH confidence)

- TypeBox `Type.Record` docs github.com/sinclairzx81/typebox — `Type.Record(Type.String(), V)` map pattern + `additionalProperties: false` strict
- commander.js v13 `.option()` API github.com/tj/commander.js — `.option('--flag-name', 'desc')` sister 5-flag chain
- Node.js `net.createServer().listen(0)` docs nodejs.org/api/net — random ephemeral port standard pattern
- Karpathy CLAUDE.md global instructions — 4 心法 + ≤200L hard limit
- MEMORY: Biome lint preempt before commit (3 CI-red recurrences Phase 2.1.1 / 2.2 / 2.3)

### Tertiary (MEDIUM confidence — projection/未 spike)

- Validation Architecture § 10.1 — fixture count target ≥ 38 based on sister Phase 3.2 ≥ 43 fixture proportionally smaller (2 surface vs 3 surface)
- 5 anti-pattern at risk § 13.1 — 经验值 (sister Phase 3.2 § 13 同 level confidence)

---

## § 18 Metadata

**Confidence breakdown**:
- dashboard.mjs parse-impact verify (§ 1): HIGH — 12 grep match 实测全 categorize
- aliases.v1 RICH schema (§ 2): HIGH — TypeBox sister patterns + Phase 3.2 W2 Rule 1 ISO-date lesson
- doctor 7th check (§ 3): HIGH — sister 6th `checkGstackPrefix` 100% reuse
- `--known-good` flag + versions/ (§ 4): HIGH — commander v13 直证 + install.ts L46-56 sister chain
- schemaVersion 12+13 surface (§ 5): HIGH — schemaVersion.ts L40-66 直证 + Phase 3.2 W0.3 colocation rule
- W0.1 STATE COLLAPSE + gate (§ 6): HIGH — check-transparency-verdicts.mjs L1-112 全文 + STATE.md L21-26 实测
- W0.2 dashboard-sse random port (§ 7): HIGH — dashboard-sse.test.ts L17 + L84-107 直证 + net.createServer().listen(0) MDN standard
- install resolveAlias inject (§ 8): HIGH — install.ts L65-66 直证 + Karpathy 1-line additive 心法
- W0.3 decision doc (§ 9): HIGH — sister Phase 3.2 W0.3 L1-76 直接 model
- Validation Architecture (§ 10): MEDIUM-HIGH — projection (38 fixture target proportionally derived from sister Phase 3.2 43 fixture)
- Wave topology (§ 12): HIGH — sister Phase 3.2 4 wave 模式 (本 phase 3 wave 因 scope 更小)
- Karpathy anti-patterns (§ 13): MEDIUM — 经验值

**Research date**: 2026-05-17
**Valid until**: ~2026-08-17 (Phase 3.3 ship + Phase 3.4 dogfood cycle; commander v13 + TypeBox 0.34 stable; gstack-office-hours CLI 命名稳定 within gstack v0.x cadence)

---

## RESEARCH COMPLETE
