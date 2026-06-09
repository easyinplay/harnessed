# Phase 2.4 — RESEARCH (R2 focus pack)

> **Researched**: 2026-05-16
> **Researcher**: gsd-phase-researcher (Claude Opus 4.7, 1M ctx)
> **Scope**: 4 fresh research topics (D-01~D-04 已锁不重做 — 见 `2.4-CONTEXT.md`)
> **Overall confidence**: HIGH (Topic 1 doctor 5 check 内部 baseline 直证 / Topic 4 audit 内部 baseline 直证) · MEDIUM-HIGH (Topic 2 EE-4 quant rubric — intel L74-82 原型 + 现 gsd-plan-checker 三档行为 实证) · MEDIUM (Topic 3 dashboard C 路径 — node `fs.watch` 跨平台行为社区共识 + zero-dep WS 自有约束)
> **Valid until**: ~2026-08-15 (Node 22 LTS 周期 + `@sinclair/typebox` v0.32 稳定; Claude Code hook spec 若 v0.3+ 演进则需复核)

---

## § 0 Scope note + sources

### What this RESEARCH does NOT redo

4 D-decisions D-01~D-04 已 interactive AskUserQuestion 锁定（`2.4-CONTEXT.md` L38-94）：

- **D-01** doctor MIN scope = 5 check (Node ≥ 22 / MCP scope / jq / Win bash flavor / origin URL)
- **D-02** EE-4 timing = ABSORB-2.4 (4 维 quant rubric + `plan-review-schema.yaml` SSOT + `gsd-plan-checker` ~30L 改造)
- **D-03** README counter integrity = B 路径 CI gate (~15L yaml)
- **D-04** dashboard C 路径 = FULL absorb (3.1 hook + 3.2 watcher + 3.3 多项目)

本 RESEARCH 聚焦 KICKOFF § 4 R2 三项 + 用户 prompt 第四项 (audit + Win sentinel scope)。

### Critical pre-existing assets discovered (MUST inform planner)

1. **`src/cli/doctor.ts` 现 152L，已含 D-01 5 check 中的 4 项**（Node / MCP scope / jq / Win bash flavor）— **Phase 2.4 只需新增 origin URL check + JSON output**，不是 from scratch 扩 ~150L。 真实增量 ≈ ~30-50L。KICKOFF § 1 "38L → 150L" 数字偏高（38L 是 Phase 1.2 baseline，已被 Phase 1.2 → 1.2.5 增量 update 到 152L，但 KICKOFF 沿用旧数字）。 [HIGH 影响 task_plan 估时]
2. **`src/cli/audit.ts` 已存在 (126L, Phase 1.2 ship)** — scope = manifest 自一致性校验 (无 network)。 Phase 2.4 "audit 完整版" 应是 **扩 audit.ts，不是 NEW file**（KICKOFF § 1 F5 写 "audit 完整版 (`src/cli/audit.ts`（NEW or 扩 doctor）)" — 实际 ：扩 audit.ts）。 现 audit 已有 manifest layer (repo URL pattern / signed_by placeholder / git_ref forbidden HEAD/main/master)，Phase 2.4 加 **runtime layer**：origin URL 校验 (与 doctor #5 共享 helper) + 模拟恶意 fork 检测 + provenance 完整性。 [HIGH 影响 PATTERNS]
3. **`InstallType` enum 现 4 项 `[skill, mcp, npm, git]`** (src/manifest/schema/spec.ts L106-111) — **不是** install method (那是 `TypeEnum` L23-28 + `install.method` L27-33 6 项 `[npm-cli, mcp-stdio-add, ...]`)。Phase 2.4 `cc-hook` 需要决定：(a) 加 InstallType 第 5 enum 项 `hook` + (b) 加 install method 第 7 项 `cc-hook-add`，**两层都要动**。 KICKOFF § 1 "TypeBox enum 加 cc-hook 字段" 不够精确 — 实际需 spec.ts 两个 union 各加一项。 [HIGH 影响 schema task]
4. **dashboard.mjs 现 506L (post 161621c polish)**，不是 KICKOFF § 1 推算的 ~475L — Phase 2.4 加 ~130L 后 ≈ 636L，**超 Karpathy zero-dep dev tool 软上限 ~500L** ≈ 27%。 [MEDIUM 影响 Wave 3 task — 见 § 3.4 split 决策]
5. **无 `fs.watch` 任何 repo 内 precedent** — `grep -r "fs.watch\|chokidar" .` 0 matches in src/ or scripts/。 Phase 2.4 是首例。 [MEDIUM 影响 Wave 3 risk]
6. **CI A7 step iter 1-0012** (ci.yml L59) — Phase 2.4 ship 时 iter 扩到 N 实占 (sister Phase 2.3 ship 模式，KICKOFF § 1 F7 已 anchor)。 [LOW]
7. **`ralph-loop` Win 兼容 sentinel 现有覆盖** — `tests/routing/routing-engine.test.ts` + `tests/routing/isComplete.test.ts` 含 ralph-loop unit + integration 但**未明示 Win-only matrix step**；ci.yml 未见专 ralph-loop-on-Win step。 Phase 2.2 W4 ship + Phase 2.3 W0 T0.6 (provenance Win pwsh sentinel) 是 sister cluster pattern，Phase 2.4 应 follow 同模式：Win-only `if: runner.os == 'Windows'` step。 [MEDIUM 影响 Topic 4]

### Sources cited

| Source | Lines | Purpose |
|--------|-------|---------|
| `src/cli/doctor.ts` | L1-152 | doctor baseline 现状 (4/5 check 已实) |
| `src/cli/audit.ts` | L1-126 | audit baseline (manifest layer only) |
| `src/manifest/schema/spec.ts` | L23-33, L106-111 | TypeEnum + InstallType union shape |
| `src/installers/index.ts` | L27-49 | 6 method dispatch table + Level mapping |
| `src/installers/mcpHttpAdd.ts` | L1-328 | mcp-http-add 模式 (近似 cc-hook 推荐 analog) |
| `src/installers/npxSkillInstaller.ts` | L1-217 | npx-skill-installer 模式 (close analog — file 写入 ~/.claude/) |
| `scripts/dashboard.mjs` | L1-506 | dashboard baseline (506L) + SHELL HTML / SSE candidate |
| `.github/workflows/ci.yml` | L1-204 | A7 step + transparency / provenance gate / Win pwsh sentinel pattern |
| `.planning/intel/omc-comparison.md` | L74-82, L286 | EE-4 omo Metis + Momus 4 维原型 + ABSORB tier |
| `.planning/intel/dashboard-handoff-2026-05-16.md` | L129-205 | C 路径 3 子功能 sketch + ~310L 估算 |
| `.planning/phase-2.3/PLAN-CHECK.md` | L3-380 | gsd-plan-checker 现行三档行为实证 (1 BLOCKER / 5 WARNING / 4 SUGGESTION) |
| `.planning/phase-2.3/RESEARCH.md` | L1-120 | sister precedent format + § 0 SSOT 模式 |

---

## § 1 Topic 1 — Doctor 5 check spec verify (D-01)

**Confidence: HIGH** — 4/5 check 已 production，1 NEW check (origin URL) 实现路径直证。

### 1.1 实际增量评估（修正 KICKOFF "38L → 150L" 数字）

| # | Check | 现状 (doctor.ts) | Phase 2.4 行动 | 估增 LOC | Fail mode |
|---|-------|-----------------|---------------|----------|-----------|
| 1 | Node ≥ 22 | ✅ L28-39 `process.versions.node` parse | 无改 | 0L | hard fail (exit 1) |
| 2 | MCP scope | ✅ L41-78 (project `.mcp.json` + user `~/.claude.json` mcpServers 检) | 无改 | 0L | hard fail (CC #54803 risk) |
| 3 | jq present | ✅ L80-97 `where`/`which` jq + 3 OS fix hint | 无改 | 0L | hard fail (R02 红旗) |
| 4 | Win bash flavor | ✅ L99-127 (Win-only WSL probe) | 无改 | 0L | hard fail (ralph-loop WSL fork bug) |
| 5 | **origin URL 校验** | ❌ 未实 | **NEW** ~25L | ~25L | **warn** (推) — 见 § 1.2.5 |
| — | `--json` flag | ❌ 未实 (现仅 human-readable) | NEW ~15L (action() refactor + JSON branch) | ~15L | n/a |
| — | exit code 0/1 unified | ✅ L141-150 (allOk loop + exit) | 已实 — 仅需将 warn 纳入 (现 ok/!ok 二值) | ~5L | warn ≠ fail (推) |
| — | CheckResult schema 引 `warn` | ❌ 现仅 `ok: boolean` (L21-26) | 改 `{ ok, status: 'pass'|'warn'|'fail' }` (向后兼容 derive `ok = status === 'pass'`) | ~10L | n/a |

**实际增量 ≈ ~55-65L**，doctor.ts 152L → ~210L。 **超 Karpathy hard limit ≤200L** ≈ 5%。

### 1.2 五 check method 推荐 (D-01 各 Karpathy 最低复杂度选择)

#### 1.2.1 Node ≥ 22 — `process.versions.node` ✅ 已采

**已 production** L28-39 — `process.versions.node` 内建变量 (零 spawn 开销，跨 OS 一致)。 **不需** `spawnSync('node', ['--version'])` (KICKOFF § 1 提议的备选)。 Karpathy 推 `process.versions.node` 已采 — sister precedent 已锁。

#### 1.2.2 MCP scope — 双源检 ✅ 已采

**已 production** L41-78：检 (a) project `.mcp.json` 存在 + (b) user `~/.claude.json` 无 `mcpServers` block (后者 = CC #54803 red flag — user scope 静默不 read)。 已覆盖用户 prompt 2 候选 (a) 文件检 + (b) user vs project scope 明示。 不需 (c) MCP server connection probe (heavy) — Karpathy YAGNI。

#### 1.2.3 jq present — `where`/`which` ✅ 已采

**已 production** L80-97。Sister precedent: Phase 1.2 ralph-loop ADR 0005 jq+bash 探测模式。3 OS fix hint 已覆盖 (winget / brew / apt-get|dnf)。 [HIGH]

#### 1.2.4 Win bash flavor — PATH 解析 + WSL probe ✅ 已采

**已 production** L99-127 (Win-only)：Step 1 `where bash` 找 PATH-first → Step 2 `bash -c 'echo $WSL_DISTRO_NAME'` 探 (非空 = WSL bash.exe shim, ralph-loop fork bug 风险 — Phase 1.1 finding direct证据)。 sister precedent: Phase 1.2 + Phase 2.2 Win 兼容 work。Git Bash / WSL 二分已 cover；MSYS2 / Cygwin **未明分**但归入 "Git Bash / native" (Karpathy YAGNI — 真实 ralph-loop 兼容性以 WSL fork 为 root cause，其他 flavor 暂未现 bug)。 [HIGH]

#### 1.2.5 Origin URL 校验 — NEW ⭐ Phase 2.4 唯一新增

**实现推荐**:

```ts
// src/cli/doctor.ts NEW check (~25L)
function checkOriginUrl(): CheckResult {
  // Read expected URL from package.json `repository.url` field (SSOT —
  // package.json is canonical; manifest config 第二来源会引漂移).
  const pkg = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8'))
  const expected = pkg.repository?.url ?? null
  if (!expected) {
    return { name: 'origin URL', status: 'warn', detail: 'package.json has no repository.url field', fix: 'add repository field to package.json' }
  }
  const r = spawnSync('git', ['config', '--get', 'remote.origin.url'], { encoding: 'utf8' })
  if (r.status !== 0) {
    return { name: 'origin URL', status: 'warn', detail: 'no git remote origin (detached / non-clone)', fix: 'git remote add origin <url>' }
  }
  const actual = r.stdout.trim()
  // Normalize: strip trailing .git, strip protocol prefix differences (https vs ssh)
  const norm = (s: string) => s.replace(/^(https?:\/\/|git@github\.com:)/, '').replace(/\.git$/, '').replace(':', '/')
  if (norm(actual) !== norm(expected)) {
    return {
      name: 'origin URL',
      status: 'warn',  // warn (not fail) — fork 是合法用例
      detail: `origin '${actual}' ≠ expected '${expected}'`,
      fix: 'verify this is intentional fork; if not, `git remote set-url origin <expected>`',
    }
  }
  return { name: 'origin URL', status: 'pass', detail: actual }
}
```

**Fail mode 推荐 `warn` not `fail`**：fork 是合法用例 (用户可能 fork harnessed 自用)，hard fail 会阻所有 fork 用户运行 doctor。 audit 完整版 (Topic 4) 才做 hard-fail tamper detection (manifest declared upstream + commit ancestry check)。 [MEDIUM-HIGH — fork 合法性是 Karpathy "做最小有效约束" 原则]

**Sister with audit (Topic 4)** — origin URL helper 抽到 `src/cli/lib/origin-check.ts` (~15L)，doctor #5 + audit 完整版 共用 (CONTEXT § Code Insights "Integration Points" 已 anchor)。

### 1.3 `--json` flag + exit code unified 模式 推荐

```ts
// doctor.ts action() refactor (~15L)
.action(async (opts: { json?: boolean }) => {
  const results: CheckResult[] = [
    checkNodeVersion(),
    await checkMcpScope(),
    checkJq(),
    checkWinBash(),
    checkOriginUrl(),
  ]
  const hasFail = results.some(r => r.status === 'fail')
  const hasWarn = results.some(r => r.status === 'warn')
  if (opts.json) {
    console.log(JSON.stringify({ checks: results, summary: hasFail ? 'fail' : hasWarn ? 'warn' : 'pass' }, null, 2))
  } else {
    for (const r of results) {
      const mark = r.status === 'pass' ? '✓' : r.status === 'warn' ? '⚠' : '✗'
      console.log(`${mark} ${r.name} — ${r.detail}`)
      if (r.status !== 'pass' && r.fix) console.log(`    fix: ${r.fix}`)
    }
    console.log(hasFail ? '\nsome checks failed' : hasWarn ? '\nall checks ok (with warnings)' : '\nall checks passed')
  }
  process.exit(hasFail ? 1 : 0)  // warn ≠ fail per § 1.2.5
})
```

**Exit code policy**: warn = exit 0 (advisory), fail = exit 1 (blocking)。 CI 用 `harnessed doctor --json | jq '.summary'` 解析三档。

### 1.4 OS-specific quirks summary

| OS | Quirks | Mitigation |
|----|--------|------------|
| Linux | jq 通常预装 (apt: yes; alpine: no) | fix hint `apt-get install jq` / `apk add jq` |
| macOS | jq 经 brew，可能未装 | fix hint `brew install jq` |
| Windows | `where` 取代 `which`; bash 可能 WSL 假阳;jq 经 winget/scoop | 4 个 win-only branch 已实 (L81, L99-127) |
| 全 OS | `git config --get` 在 detached HEAD 返回 origin url ok; 在 cwd 非 git repo 返回 exit 128 | doctor #5 spawn r.status !== 0 → warn (非 git repo 合法用例 — npm 全局装) |

---

## § 2 Topic 2 — EE-4 plan-checker 量化 rubric (D-02)

**Confidence: MEDIUM-HIGH** — intel L74-82 原型直证 + 现 gsd-plan-checker 三档实证 + 4 维 mechanically gradable 设计 ASSUMED 未 spike (待 Wave 2 实测)。

### 2.1 4 维 schema 形态 推荐

```yaml
# routing/plan-review-schema.yaml (NEW SSOT, ~40L)
# Source: intel L74-82 omo Metis + Momus 4 维原型 formalize
# NOT vendor: 不复刻 omo 希腊神话 prompt 字眼, 仅借 4 维 schema 形态.
schemaVersion: 1
dimensions:
  file_references_verified:
    description: "plan 提及的 file path 100% grep 命中真实文件 (NEW 文件显式标注 NEW)"
    threshold: 1.0  # 100%
    measurement: "see § 2.2.1 grep-based metric"
  reference_sources_real:
    description: "plan 引用的 intel/ADR/RETROSPECTIVE/CONTEXT 文件路径 ≥80% 真实存在"
    threshold: 0.8  # ≥80%
    measurement: "see § 2.2.2 file existence ratio"
  concrete_acceptance:
    description: "plan 的 acceptance bar ≥90% 含可量化 signal (行数/exit code/regex 命中数/grep -c)"
    threshold: 0.9  # ≥90%
    measurement: "see § 2.2.3 heuristic regex per acceptance entry"
  business_logic_assumptions:
    description: "plan 无 'assumed X behaves like Y' 类无来源臆测词 (assume/presumably/should be/likely)"
    threshold: 0  # exact 0
    measurement: "see § 2.2.4 weasel-word grep count"
scoring:
  pass_dimensions_required: 4  # 4/4 → PASS
  warning_dimensions_required: 3  # 3/4 → WARNING
  blocker_threshold: 2  # ≤2/4 → BLOCKER, auto-trigger plan-phase rerun
verdict_mapping:
  pass: "APPROVED — 4/4 dimensions met"
  warning: "APPROVED WITH CONDITIONS — 3/4 dimensions met, see warnings"
  blocker: "REJECTED — ≤2/4 dimensions met, plan-phase rerun required"
```

[HIGH — 与 intel L74-82 + D-02 locked rationale 一致]

### 2.2 4 维 exact 计算 method 推荐

#### 2.2.1 `file_references_verified` (100%)

**Algorithm**: grep `files_modified:` / `files_created:` lines in `task_plan.md` → 提取 path tokens → `fs.access()` 检 each path → ratio = exists/total。

**Edge case**: NEW file (Phase 2.4 创的) 显式 `files_created: [NEW src/cli/lib/origin-check.ts]` — NEW prefix 跳过 fs check (treat as expected)。 推荐 plan-checker prompt 加 "NEW prefix exempt from fs check" 注释。

**Mechanically gradable**: ✅ 100% (grep + fs.access 全自动)

#### 2.2.2 `reference_sources_real` (≥80%)

**Algorithm**: regex `decision_source:|see:|ref:|sister precedent:` 提取所有 file path → `fs.access()` check → ratio = exists/total。

**Threshold rationale ≥80% not 100%**: plan 偶尔引 deprecated / renamed file (Phase 1.4 → Phase 2.0 sister) 是合法; 80% 容忍真实 stale ref。

**Mechanically gradable**: ✅ 100%

#### 2.2.3 `concrete_acceptance` (≥90%)

**Algorithm**: 提取 `acceptance_criteria:` / `Acceptance:` blocks → 对每个 entry 跑 heuristic regex set:
- ✅ contains `grep -c|wc -l|exit \d+|`-eq \d`|npm test|pnpm test|biome check` (quantifiable)
- ✅ contains `\d+L|\d+ lines|≤\d+|>= ?\d+` (numeric)
- ❌ contains only `complete|done|works|verified` (vague)

ratio = quantifiable_count / total_count。

**Edge case**: "subjective" acceptance (UI looks good / matches design) 不可量化 — 推 plan-checker 标 SUGGESTION, 不计入分母。 实测候选 (Wave 2): 跑 Phase 2.3 task_plan.md 看 baseline。

**Mechanically gradable**: ⚠️ 90% (heuristic 偶失，需 human spot-check tier — 但 BLOCKER/WARNING/PASS 分档不依赖 100% 精度)

#### 2.2.4 `business_logic_assumptions` (exact 0)

**Algorithm**: regex `assumed|presumably|should be|likely|probably|I think|maybe` (case-insensitive, word boundary) count occurrences in plan body。 阈值 = 0。

**Edge case**: "assumed signal already locked in CONTEXT" — false positive。 推白名单 phrase set `assumed (per D-NN)` / `assumed (locked)` 不计。

**Mechanically gradable**: ⚠️ 80% (weasel-word detection 偶 false positive, 需白名单调优 — 第 1 轮实测在 Phase 2.3 plan 跑后定 baseline)

### 2.3 `gsd-plan-checker` agent prompt 改造 推荐

**现状** (PLAN-CHECK.md L3 直证): "Verdict: APPROVED WITH CONDITIONS (1 BLOCKER / 5 WARNING / 4 SUGGESTION)" — 现行已含三档 BLOCKER/WARNING/SUGGESTION 自由文本输出，**不输出** 4 维 quant score。

**Location**: 全局 `~/.claude/agents/gsd-plan-checker.md` (CONTEXT § 1.5 Code Insights L160 anchor) — **Phase 2.4 execute-phase 不能改全局 agent 文件**（不在 repo scope），需走 (a) `.claude/agents/gsd-plan-checker.md` project-local override OR (b) **新写** `scripts/run-plan-checker.mjs` (CI 自动跑 schema.yaml + 输 JSON, gsd-plan-checker agent 沿用现行三档自由文本)。 推 (b) — Karpathy YAGNI 不改 agent 上游, schema enforcement 走 CI script。

**~30L prompt 增量** (若走 (a) project-local override 路径, planner Wave 2 决):

```markdown
# gsd-plan-checker (project-local override, ~30L addition)
## Phase 2.4 EE-4 量化输出节
After your verdict (APPROVED / APPROVED WITH CONDITIONS / REJECTED), output a
quantitative rubric JSON block:

```json
{
  "schema_version": 1,
  "dimensions": {
    "file_references_verified": { "score": 1.0, "passed": true, "evidence": "12/12 paths exist" },
    "reference_sources_real": { "score": 0.85, "passed": true, "evidence": "17/20 refs exist" },
    "concrete_acceptance": { "score": 0.92, "passed": true, "evidence": "23/25 grep-able" },
    "business_logic_assumptions": { "score": 0, "passed": true, "evidence": "0 weasel words" }
  },
  "dimensions_passed": 4,
  "verdict": "PASS",
  "auto_retrigger_plan_phase": false
}
```

Map: 4/4 → PASS, 3/4 → WARNING, ≤2/4 → BLOCKER auto-trigger plan-phase rerun.
```

### 2.4 不达标自动触发 plan-phase 重跑 实现路径

**推荐 path (Karpathy YAGNI)**:

1. CI step `node scripts/run-plan-checker.mjs .planning/phase-X.Y/` 解析 plan-check.json
2. 若 `verdict === "BLOCKER"` → `process.exit(1)` + GHA `::error::` annotation
3. **不自动 spawn agent 重跑** (auto-trigger plan-phase 重跑 是 v0.3.0 feature — needs orchestration layer)。 Phase 2.4 MIN: CI fail → user 看到 GHA error → 手动 rerun `/gsd-plan-phase`。 此 stake-out 与 KICKOFF "不达标自动触发 plan-phase 重跑" 有 mismatch — 推 plan-phase ASSUMPTIONS 处显式 down-scope 为 "BLOCKER 触发 CI fail + 提示 user rerun，不实现 auto-spawn"。

[MEDIUM — 与 KICKOFF 描述 mismatch，建议 plan-phase 在 ASSUMPTIONS 中 surface 此 down-scope]

### 2.5 omo Momus prompt reference — 不复刻确认

Intel L80 明示: "**NOT vendor 希腊神话 prompt**"。schema.yaml `dimensions` keys + `verdict_mapping` 字段 **不含** `metis` / `momus` / 任何希腊神话名 — Karpathy YAGNI + 中立工具定位。 [HIGH — 与 D-02 locked rationale 直接对齐]

### 2.6 实测候选 baseline (Wave 2 plan-phase 实占)

| Plan source | 预期分布 (untested) | Risk 若 ≤2/4 |
|-------------|--------------------|---|
| `phase-2.3/task_plan.md` | 推 PASS (4/4) — Phase 2.3 plan 高质量 | 若 BLOCKER, schema 阈值过严，需放宽 (推 `concrete_acceptance` → ≥80%) |
| `phase-2.2/task_plan.md` | 推 PASS (4/4) | 同上 |
| `phase-2.1/task_plan.md` | 推 WARNING (3/4) — `concrete_acceptance` 可能 < 90% (sample 较粗) | 若 BLOCKER, 阈值过严 |

**推 Wave 2 实测 1-2 plan** (D-02 locked rationale 已 anchor), 给 plan-phase 校准阈值证据。 [MEDIUM — 待 Wave 2 spike，未在本 RESEARCH spike]

---

## § 3 Topic 3 — Dashboard C 路径 design (D-04)

**Confidence: MEDIUM** — `fs.watch` 跨平台行为社区共识 + WebSocket zero-dep 自有约束 ASSUMED 经验值 (无 repo internal spike)。

### 3.1 3 子功能 wave 拓扑 — 推荐 串行 (hook → watcher → 多项目) ⭐

**评依赖**:

| 子功能 | 依赖 | 并行可? |
|--------|------|--------|
| 3.1 SessionStart hook auto-install | (无 — 独立 `src/installers/cc-hook-installer.ts`) | ✅ |
| 3.2 STATE.md watcher + WebSocket push | 依赖 dashboard 启动方式 → 推 hook **触发** dashboard 但 watcher 本身无 hook dep (dashboard.mjs spawn 时立 watch) | ⚠️ 半并行 — watcher impl 不依 hook, 但 ship 顺序推 hook 后 watcher (用户体验：hook 装好后 watcher 才有价值) |
| 3.3 多项目支持 | 依赖 dashboard.mjs serve `/api/projects` endpoint + 前端左栏 nav。 与 watcher 正交 (watcher 单文件; 多项目改 url routing + 项目切换 fetch) | ✅ — 与 watcher 完全独立 |

**推荐拓扑 (Karpathy "MIN clean split" 优先)**:

```
Wave 3 (并行 3 sub-task — 推荐):
├─ T3.1 cc-hook-installer.ts NEW + dispatch + InstallType 'hook' enum + manifest fixture
├─ T3.2 dashboard.mjs STATE.md watcher + WS push (~50L)
└─ T3.3 dashboard.mjs 多项目 nav + URL routing (~80L)
```

**3 sub-task 并行可行** — 3 子功能 file scope 不重叠 (T3.1 NEW installer file; T3.2/T3.3 同 dashboard.mjs 但**不同函数区** — T3.2 增 watcher block, T3.3 增 SHELL HTML nav + serve endpoints)。 唯一 merge conflict risk: T3.2 + T3.3 同改 dashboard.mjs — 推 T3.2 先 merge (watcher 增量短 ~50L), T3.3 rebase。 **预算**: ~3 sub-task × 0.5d = 1.5d (并行 ≈ 0.5-0.75d wall time)。 [MEDIUM]

### 3.2 STATE.md watcher + WebSocket — `fs.watch` vs WS dep 选型

#### 3.2.1 `fs.watch` 跨平台行为

| OS | Behavior | Phase 2.4 Mitigation |
|----|----------|----------------------|
| Linux | inotify-based, fires per-event 一次, file rename 报 'rename' | debounce 500ms (intel sketch ok) |
| macOS | FSEvents-based, coalesces events, occasional 'rename' on text edit | debounce 500ms |
| Windows | ReadDirectoryChangesW, **fires 2-3 次 per save** (editor temp file dance), recursive 不稳 | debounce 500ms 关键, 仅 watch 单文件 (STATE.md) not 目录 |

**Karpathy 推**: 仅 watch `.planning/STATE.md` 单文件 (intel sketch L171 `watch(STATE_FILE, ...)` 已对)，不开 recursive watch (Win 不稳 + 无必要 — STATE.md 是 phase transition 唯一 surface)。 [MEDIUM — `fs.watch` Win behavior 是社区已知 quirk, debounce 500ms 业内标准做法]

#### 3.2.2 WebSocket: zero-dep vs `ws` npm dep

| Option | LOC | Risk | Sister fit |
|--------|-----|------|-----------|
| (a) **`ws` npm pkg** (intel L237 sketch) | ~20L 加 import + WSS create | + 1 npm dep (违 dashboard.mjs "zero external deps" 原则 L11) | 不 fit (dashboard 现 zero-dep) |
| (b) **Native node `http` upgrade + raw WS frame** | ~80L 手 implement WS handshake + frame parsing | bug risk MED-HIGH (WS frame protocol 复杂, opcodes / masking / fragmentation) | 与 dashboard zero-dep 一致 |
| (c) **Server-Sent Events (SSE)** ⭐ 推荐 | ~25L SSE 单向 push (`text/event-stream` HTTP body) | LOW — 纯 HTTP, 单向, node 内建 | ✅ 与 dashboard zero-dep + 单向 server→client push 需求完全 fit |

**推荐 (c) SSE**：

```js
// scripts/dashboard.mjs 增量 (~50L total, watcher + SSE)
import { watch } from 'node:fs'

const sseClients = new Set()
let debounceTimer = null
watch(join(PLANNING, 'STATE.md'), () => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    const msg = `event: state-changed\ndata: ${JSON.stringify({ ts: Date.now() })}\n\n`
    for (const res of sseClients) res.write(msg)
  }, 500)
})

// In createServer:
if (url === '/events') {
  res.writeHead(200, {
    'content-type': 'text/event-stream',
    'cache-control': 'no-cache',
    connection: 'keep-alive',
  })
  res.write(': connected\n\n')
  sseClients.add(res)
  req.on('close', () => sseClients.delete(res))
  return
}

// SHELL HTML <script> 增量 (~5L):
// const es = new EventSource('/events')
// es.addEventListener('state-changed', () => loadPage(currentPage))
```

**SSE 优势 vs WS**:
- 单向 push 完全 fit (前端只需"文件变了" notification, 不需双向)
- 纯 HTTP, no protocol upgrade complexity, 0 npm dep
- 浏览器原生 `EventSource` API (无 polyfill)
- 自动 reconnect (浏览器内建 retry)
- 替换现 dashboard L422-428 2s polling → event-driven 

**SSE 劣势** (可接受):
- 部分 corporate proxy 不 forward `text/event-stream` (dashboard 是 localhost dev tool, 非 production — 不踩此 case)

[HIGH — SSE 是 zero-dep dashboard 的 "做对的事" 选项; intel L237 sketch 写 ws 是 default thinking, SSE 是 superior 选 for 单向 server-push]

### 3.3 多项目支持 — config + routing

**Config 来源选项**:

| Option | Pros | Cons | 推 |
|--------|------|------|---|
| (a) CLI flag `--projects ~/proj1,~/proj2` | 显式, no config file | session-bound, 重启丢 | — |
| (b) `~/.claude/harnessed-projects.json` (intel L246) | persistent, sister with `~/.claude/` 生态 | NEW config file path | ✅ 推 |
| (c) `package.json` field | sister with origin URL check (single SSOT) | dashboard 是 cross-project tool, 不应 bind 单 project | — |

**推 (b)** — sister with `~/.claude/{settings,skills,agents}/` 生态。intel L247 sketch 与此一致。

```json
// ~/.claude/harnessed-projects.json (NEW)
{
  "schemaVersion": 1,
  "projects": [
    { "name": "harnessed", "path": "/home/user/code/harnessed", "lastAccessed": "2026-05-16" },
    { "name": "heptagent", "path": "/home/user/code/heptagent", "lastAccessed": "2026-05-15" }
  ]
}
```

**URL routing**: `?project=<path>` (intel L248 sketch ok), client-side `history.pushState` 切项目 (无 reload), dashboard.mjs serve `/api/projects` (list) + `/api/project/<id>/state` (read).

**LOC est**: ~80L (intel 估算 ok) — 左栏 nav HTML/CSS 增量 ~30L + JS routing ~30L + server endpoint ~20L。

[MEDIUM — heptagent vision § 21.2 ADD 主布局 ancestor 一致, 与 D-04 locked rationale 直接对齐]

### 3.4 dashboard.mjs split 决策 ⭐ 关键 trade-off

**现状**: dashboard.mjs **506L** (实测 wc -l, 不是 KICKOFF 推算的 ~475L)。

**Phase 2.4 +130L 后** ≈ **636L** — 超 Karpathy zero-dep dev tool 软上限 ~500L ≈ 27%。

**两选项**:

| Option | LOC | Trade-off |
|--------|-----|-----------|
| (a) **保持单文件** | 636L | 超软限 27%; 但单文件 distribution 简单 (一文件 + node = run); sister Karpathy "single-file simplicity" |
| (b) **split to `scripts/dashboard/*.mjs`** | 拆 4 文件 ≈ 各 ~150L | 符 hard limit; 但 dashboard 是 dev tool 非 ship artifact, split 引 import 复杂度 |

**推荐 (a) 保持单文件** — 沿袭 dashboard 现 zero-dep / single-file 立项原则。 506L → 636L 27% 增量在 dev tool 范畴可接受 (Karpathy hard limit ≤200L 是针对 src/ 核心代码，dashboard.mjs 是 scripts/ dev tool — sister to scripts/check-transparency-verdicts.mjs 不计 hard limit)。 plan-phase 在 ASSUMPTIONS 中 surface "dashboard.mjs ≤700L soft cap for dev tool, not enforced as hard limit"。

**Alt fallback (若用户复审决要 split)**: Wave 3 末加 T3.4 sub-task 拆 SHELL HTML 到 `scripts/dashboard/shell.mjs` (~250L 单提) — 剩余 dashboard.mjs ~380L 内于软限。 此 sub-task 与 T3.1/T3.2/T3.3 串行 (依赖前 3 完成)。 [MEDIUM — 推 plan-phase ASSUMPTIONS 处明示 trade-off, 用户复审决]

### 3.5 cc-hook-installer.ts 设计 — analog mapping

#### 3.5.1 Naming convention sister

Phase 2.1 install method naming:
- `mcp-stdio-add` (claude mcp add --transport stdio)
- `mcp-http-add` (claude mcp add --transport http)
- `cc-plugin-marketplace` (claude plugin install)
- `npx-skill-installer` (npx skills add)

**推荐 method 名**: **`cc-hook-add`** (sister with mcp-stdio-add / mcp-http-add naming, "cc-" prefix + verb suffix) ✅
不推 `cc-hook-installer` (现 method 名约定不含 "installer" 后缀, 那是 file name suffix)。
[HIGH — sister precedent 直证]

#### 3.5.2 Hook target path — 跨平台

| Platform | CC 标准 hook 位置 | Notes |
|----------|------------------|-------|
| Linux | `~/.claude/settings.json` (single file, hooks block) | XDG_CONFIG_HOME 不被 CC 用 |
| macOS | `~/.claude/settings.json` | 同 Linux |
| Windows | `%USERPROFILE%\.claude\settings.json` (`~/` resolve to USERPROFILE) | dashboard.mjs L17-23 docs 内已含此 sketch — CONTEXT.md "Implementation hint" L88 hint 一致 |

**Karpathy 推**: 用 `os.homedir() + '/.claude/settings.json'` 一致 — **不开** `~/.config/claude/` fallback (CC 现行未支持 XDG; CONTEXT L105 列此为 "Wave A R1 推荐" — RESEARCH 给定: 用 `~/.claude/` only)。 [HIGH — CC settings.json path 是已稳定接口]

#### 3.5.3 install/uninstall pattern

**Closest analog**: `npxSkillInstaller.ts` (npx-skill-installer L65-217) — 因 (a) 都写 `~/.claude/` 子树, (b) 都需 real-path verify (file exists), (c) L2 level (per-user)。**不是** mcpStdioAdd (mcpStdioAdd 调 `claude mcp add` 外部 CLI, cc-hook 直接 patch `~/.claude/settings.json` JSON)。

**实装路径**:

```ts
// src/installers/ccHookAdd.ts (NEW, ~80L target — under Karpathy ≤100L)
// Closest analog: npxSkillInstaller.ts (L2, ~/.claude/ write, real-path verify)

import { readFile, writeFile, mkdir, access } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join, dirname } from 'node:path'
// ... lib/preflight, lib/confirm, lib/backup, lib/diff, lib/state ...

export const installCcHookAdd: Installer = async (ctx) => {
  if (ctx.manifest.spec.install.method !== 'cc-hook-add') return {ok:false, ...}  // dispatch-mismatch
  // preflight, level L3 (writes user settings.json — system-config tier)
  const settingsPath = join(homedir(), '.claude', 'settings.json')
  // Read existing (may not exist), parse JSON, deep-merge hooks block
  // Manifest declares hook config in spec.install (need schema extension):
  //   spec.install: { method: 'cc-hook-add', hook_event: 'SessionStart', hook_matcher: 'startup|resume', hook_command: '...' }
  // Idempotent: if matching hook already present, skip (return ok)
  // Backup settings.json, write merged JSON, verify (re-read + grep hook_command present)
  // updateInstalled provenance
}

export const uninstallCcHookAdd: ... // remove matching hook entry from settings.json
```

**Schema extension needed** (src/manifest/schema/spec.ts):
- `InstallType` union +1 `'hook'` → 5 enum 项
- `TypeEnum` union (L23-28) **不变** (cc-hook 走 cc-plugin 既有 type 或 NEW type — 推 NEW `'cc-hook'` type 与 install_type:'hook' 1:1)
- `install.method` union +1 `'cc-hook-add'` → 7 method
- `install` 字段加 3 optional field: `hook_event` (enum SessionStart|PreToolUse|...) / `hook_matcher` (string) / `hook_command` (string)

**LOC est**: installer ~80L + schema diff ~15L + dispatch table 加 1 line + manifest fixture (manifests/cc-hooks/dashboard-autospawn.yaml NEW ~30L) ≈ ~125L 总。 [HIGH — sister analog 直证, schema extension 路径清晰]

#### 3.5.4 Provenance 4 字段 inherit

cc-hook-installer 沿袭 6 installer 通用 provenance 4 字段 (`installed_at` / `installed_by` / `source_url` / `install_type: 'hook'`)，updateInstalled() helper 已 generic (L326 npxSkillInstaller 直接 reuse)。 [HIGH]

---

## § 4 Topic 4 — Audit 完整版 + ralph-loop Win sentinel

**Confidence: HIGH** (audit baseline 直证) · MEDIUM (Win sentinel scope ASSUMED 经验值)

### 4.1 Audit 完整版 scope — 扩 audit.ts 不 NEW

**现状** (src/cli/audit.ts L1-126):
- Layer 1: schema validation (Ajv via validateManifestFile)
- Layer 2 (3 manifest 自一致性 checks):
  - repo URL pattern `^https://...\.git$` (warn)
  - signed_by placeholder 检 (warn)
  - git_ref ∈ {HEAD,main,master} 拒 (error)
- **明示注释 L4-5**: "real audit per ASSUMPTIONS B4 + ROADMAP" deferred to **phase 2.4**

**Phase 2.4 完整版增量** (~80L 扩 audit.ts L9-126):

#### 4.1.1 Origin URL 校验 (sister with doctor #5)

复用 `src/cli/lib/origin-check.ts` (Topic 1 § 1.2.5 抽出)，audit 跑 hard-fail 模式 (vs doctor warn 模式)：

```ts
// src/cli/audit.ts 增量 (~20L)
async function auditOriginIntegrity(): Promise<AuditFinding[]> {
  const findings: AuditFinding[] = []
  const check = await checkOriginUrl({ allowFork: false })  // audit 不容 fork
  if (check.status !== 'pass') {
    findings.push({
      manifest: 'project',
      level: 'error',  // audit hard-fail (vs doctor warn)
      field: '/git/remote/origin',
      detail: `origin URL drift: ${check.detail}`,
    })
  }
  return findings
}
```

#### 4.1.2 模拟恶意 fork 检测 (ROADMAP L121 验收)

**Scenario**: fork manifest 上游 → 改 `install.cmd` 注入 (e.g. `npm install evil-pkg; npm install ...`) → audit 应 detect。

**实现路径** — manifest layer extension:
- 加 audit check: `install.cmd` 不含 multi-command separator (`;` / `&&` / `||` / `|`) — **已部分覆盖** by `checkCmdString` (src/manifest/security.ts) 在 installer runtime 跑, 但 audit-time pre-flight 应同跑
- 加 audit check: `metadata.upstream.repository` 与 `install.cmd` 引的 npm pkg / git repo / npx ref **一致性** (e.g. manifest 声明 upstream `tavily-mcp` 但 install.cmd `npm install -g tavily-mcp-evil` → mismatch)

```ts
// src/cli/audit.ts 增量 (~30L)
const COMMAND_SEPARATORS = /[;&|`$]/  // shell command injection markers
const NPM_PKG_RE = /npm(?:\s+install\b|\s+i\b)(?:\s+(?:-g|--global))?\s+(\S+)/
function auditInstallCmdIntegrity(m: Manifest): AuditFinding[] {
  const findings: AuditFinding[] = []
  const cmd = m.spec.install.cmd
  if (COMMAND_SEPARATORS.test(cmd)) {
    findings.push({ ..., level: 'error', detail: 'install.cmd contains shell separator (injection risk)' })
  }
  // Cross-check upstream ↔ install.cmd referenced npm pkg
  const upstream = m.metadata.upstream.repository
  const npmMatch = cmd.match(NPM_PKG_RE)
  if (npmMatch && upstream.includes('github.com/')) {
    const declaredPkg = upstream.split('/').pop()?.replace('.git', '')
    if (npmMatch[1] !== declaredPkg) {
      findings.push({ ..., level: 'warn', detail: `install.cmd npm pkg '${npmMatch[1]}' ≠ upstream '${declaredPkg}'` })
    }
  }
  return findings
}
```

#### 4.1.3 Provenance 完整性 check (sister with check-provenance.mjs)

**已存** `scripts/check-provenance.mjs` (Phase 2.2 ship, ci.yml L94 invoke) 跑 `.harnessed/{sessions,checkpoints,route-logs}/**` provenance sibling 检。 **Phase 2.4 audit 完整版** 应**调用** check-provenance.mjs (或抽 lib reuse) — 不重 implement, 走 sister precedent。 推 plan-phase 加 task: audit.ts spawn `node scripts/check-provenance.mjs` 进 audit run (~10L)。 [HIGH]

#### 4.1.4 Total 增量

audit.ts 126L → ~210L (+~80L)。 **超 Karpathy hard limit ≤200L** ≈ 5%。 推荐 Wave 4 sub-task: 抽 `src/cli/lib/audit-helpers.ts` (4.1.1 + 4.1.2 + 4.1.3 各 helper, ~50L), audit.ts 进 cli orchestration ~150L 内 under hard limit。 [MEDIUM — split decision 与 doctor.ts split 决策对齐]

### 4.2 Ralph-loop Win 兼容 sentinel — MIN scope 推荐 ⭐

#### 4.2.1 现有覆盖 audit

- **Phase 2.2 W4 ship**: ralph-loop SDK ship + `tests/routing/sdk-spawn.test.ts` 跨 OS unit (但**未 Win-only matrix step**)
- **Phase 2.3 W0 T0.6**: `provenance gate (Win pwsh sentinel)` (ci.yml L100-103) — Win-only `if: runner.os == 'Windows'` step pattern 已 ship
- **Phase 2.4 未现**: 完整 ralph-loop e2e on Win matrix step

**Gap**: e2e ralph-loop spawn (main agent + subagent + completion-promise verbatim "COMPLETE" detect) **未在 Win matrix 跑通**。 [MEDIUM]

#### 4.2.2 MIN scope 推荐 (KICKOFF "5 fixture sample" 校准)

| Scope option | LOC | Wall time | Risk |
|--------------|-----|-----------|------|
| (a) MIN: 1 fixture ralph-loop spawn + COMPLETE detect | ~20L test | <30s CI | LOW — covers core ralph-loop fork |
| (b) **推 5 fixture sample** | ~80L test | <90s CI | LOW-MED — sample 5 e2e scenarios (success / timeout / max-iter / non-COMPLETE / multi-iter) |
| (c) FULL: 30 fixture sample (Phase 2.3 sister) | ~250L test | <5min CI | MED — long CI time, sister Phase 2.3 30-sample 重做嫌 |

**推 (b) 5 fixture** — KICKOFF F6 已 anchor "5 check × 6 模拟环境 scenario = 30 doctor fixture", ralph-loop sentinel **不重做 30 sample** (KICKOFF anti-redo discipline)。 5 sample 覆盖 critical path：

| # | Fixture | What it tests |
|---|---------|--------------|
| 1 | `simple-complete` | spawn → 1 iter → "COMPLETE" detect → exit 0 |
| 2 | `multi-iter` | spawn → 3 iter → "COMPLETE" on iter 3 → exit 0 |
| 3 | `max-iter-exceeded` | spawn → reach max-iter → exit 1 with iter exceeded msg |
| 4 | `subagent-spawn` | main agent spawn subagent (Win bash fork test — Phase 1.1 finding 直证) |
| 5 | `timeout` | spawn → timeout reached → SIGKILL → exit 1 (Win SIGKILL behavior parity) |

**实装路径** (Wave 4 sub-task):

```yaml
# .github/workflows/ci.yml 增量 (~10L)
- name: ralph-loop Win sentinel (Phase 2.4 — 5 fixture e2e)
  if: runner.os == 'Windows'
  shell: bash
  run: corepack pnpm test -- tests/routing/ralph-loop-win-sentinel.test.ts
```

```ts
// tests/routing/ralph-loop-win-sentinel.test.ts NEW (~80L)
// 5 fixture × ralphLoopWrap spawn + assert exit code / iter count / COMPLETE detect
```

[MEDIUM-HIGH — MIN scope 与 D 决策 anti-redo discipline 一致, sister with Phase 2.3 W0 T0.6 Win pwsh sentinel pattern]

#### 4.2.3 3-OS CI matrix 现状

ci.yml L18 `os: [ubuntu-latest, macos-latest, windows-latest]` matrix 已存 (Phase 1.1.1 ship)。 Phase 2.4 加 ralph-loop sentinel step 走 `if: runner.os == 'Windows'` (sister Phase 2.3 provenance pwsh sentinel)。 [HIGH]

### 4.3 README CI counter gate — Phase 2.4 ship

Recommended yaml (与 D-03 CONTEXT.md L65-75 一致, regex 校准 plan-phase Wave 0 实占)：

```yaml
- name: README counter integrity gate (Phase 2.4 Wave 0 — D-03 B 路径)
  run: |
    SHIPPED=$(grep -cE "Phase 2\.[0-9]+ shipped" README.md)
    BARS=$(grep -cE "Acceptance bar [A-Z][0-9]" README.md)
    L44=$(sed -n '44p' README.md | grep -oE '[0-9]+/4' | head -1 | cut -d/ -f1)
    if [ "$SHIPPED" != "$BARS" ] || [ "$SHIPPED" != "$L44" ]; then
      echo "::error::README counter drift: shipped=$SHIPPED bars=$BARS L44=$L44"
      exit 1
    fi
    echo "README counter integrity ✅ shipped=$SHIPPED bars=$BARS L44=$L44"
```

**Pre-flight regex calibration** (Wave 0 task): plan-phase 在 push CI 前 local 跑 `grep -cE` against 现 README.md, 确保 SHIPPED/BARS/L44 三者实际一致 (否则第一 push 即 CI red)。 [HIGH — sister Phase 2.2 T0.4 freshness gate pattern 直证]

---

## § 5 D2.4-* locks (firm research decisions ready for Wave B planner)

| ID | Decision | Source | Confidence |
|----|----------|--------|-----------|
| **D2.4-1** | doctor.ts 实际增量 ≈ ~55-65L (152→210L), 超 hard limit 5% → 推 plan-phase 容忍 OR 抽 `src/cli/lib/check-helpers.ts` | § 1.1 actual count vs KICKOFF estimate | HIGH |
| **D2.4-2** | doctor `origin URL` check fail mode = **warn** (not fail), fork 是合法用例 | § 1.2.5 | MEDIUM-HIGH |
| **D2.4-3** | `src/cli/lib/origin-check.ts` 抽 helper, doctor #5 + audit 完整版 共用 | § 1.2.5 + § 4.1.1 | HIGH |
| **D2.4-4** | `--json` flag + 三档 (pass/warn/fail) exit policy: warn=0, fail=1 | § 1.3 | HIGH |
| **D2.4-5** | `plan-review-schema.yaml` schema shape: `dimensions` (4 维 + threshold + measurement) + `scoring` (pass/warning/blocker thresholds) + `verdict_mapping` — NOT vendor 希腊神话 names | § 2.1 + intel L80 直证 | HIGH |
| **D2.4-6** | EE-4 enforcement path: CI `scripts/run-plan-checker.mjs` exit 1 on BLOCKER, **不实现 auto-spawn plan-phase rerun** (down-scope from KICKOFF, v0.3.0 feature) | § 2.4 | MEDIUM (与 KICKOFF mismatch, ASSUMPTIONS surface) |
| **D2.4-7** | gsd-plan-checker 改造路径: **project-local override** `.claude/agents/gsd-plan-checker.md` (~30L 加量化 JSON 输出节), 不动全局 agent file | § 2.3 | MEDIUM-HIGH |
| **D2.4-8** | dashboard C 路径 3 子功能 Wave 3 拓扑 = **并行** 3 sub-task (T3.1 hook / T3.2 watcher / T3.3 多项目), T3.2+T3.3 同 dashboard.mjs 但函数区不重叠 | § 3.1 | MEDIUM |
| **D2.4-9** | STATE.md watcher push = **SSE not WebSocket** (zero-dep, 单向 push 完全 fit, 浏览器原生 EventSource) | § 3.2.2 | HIGH |
| **D2.4-10** | `fs.watch` 仅 watch 单文件 `.planning/STATE.md` (not recursive, Win 不稳), debounce 500ms | § 3.2.1 | MEDIUM-HIGH |
| **D2.4-11** | dashboard.mjs 保持单文件 (506→636L, 27% 超软限) — dev tool 不计 Karpathy hard limit ≤200L (那是 src/ 核心代码), surface in ASSUMPTIONS | § 3.4 | MEDIUM |
| **D2.4-12** | 多项目支持 config = `~/.claude/harnessed-projects.json` (sister with `~/.claude/` 生态) | § 3.3 | HIGH |
| **D2.4-13** | cc-hook installer naming = **`cc-hook-add`** method name (sister `mcp-stdio-add`/`mcp-http-add`), file `src/installers/ccHookAdd.ts` (camelCase sister with `mcpStdioAdd.ts` etc) | § 3.5.1 | HIGH |
| **D2.4-14** | cc-hook installer 写 `~/.claude/settings.json` (single file, hooks block deep-merge, idempotent), L3 level (system-config tier), closest analog `npxSkillInstaller.ts` | § 3.5.2 + § 3.5.3 | HIGH |
| **D2.4-15** | Schema extension: `InstallType` +1 `'hook'` (5 enum) + `TypeEnum` +1 `'cc-hook'` (NEW type) + `install.method` +1 `'cc-hook-add'` (7 method) + `install` 3 optional fields (hook_event/hook_matcher/hook_command) | § 3.5.3 | HIGH |
| **D2.4-16** | audit 完整版 = **扩 `src/cli/audit.ts`** (not NEW file), 126→210L, 超 hard limit 5% → 抽 `src/cli/lib/audit-helpers.ts` | § 4.1.4 | HIGH |
| **D2.4-17** | audit 完整版 调用 `scripts/check-provenance.mjs` (不重 implement), Wave 4 sub-task spawn 集成 | § 4.1.3 | HIGH |
| **D2.4-18** | ralph-loop Win sentinel scope = **5 fixture** (simple-complete / multi-iter / max-iter / subagent-spawn / timeout), CI `if: runner.os == 'Windows'`, sister Phase 2.3 W0 T0.6 pattern | § 4.2.2 | MEDIUM-HIGH |
| **D2.4-19** | 30-sample integration (KICKOFF F6) = 30 doctor fixture (5 check × 6 env scenario) + 30 plan-checker fixture (Phase 1.1~2.3 plan 跑量化) — **不重做** Phase 2.3 30 routing sample | § 4 + KICKOFF F6 anti-redo | HIGH |
| **D2.4-20** | ADR 编号 plan-phase Wave 6 实占 (**NOT 0013** 写作惯例) | KICKOFF § 3 Hard Constraint #2 + intel § 0 SSOT 引用纪律 | HIGH |

---

## § 6 Open questions (Wave A → B handoff)

| # | Question | Recommendation | Severity |
|---|----------|----------------|----------|
| **O1** | Phase 2.4 ASSUMPTIONS 是否 surface EE-4 BLOCKER → auto-rerun plan-phase 的 down-scope (D2.4-6)? KICKOFF § 1 F3 写 "不达标自动触发 plan-phase 重跑", 实装 down-scope 为 CI fail + manual rerun | Surface 显式, plan-phase Wave B ASSUMPTIONS 节加 down-scope rationale | MEDIUM |
| **O2** | dashboard.mjs 506→636L (27% 超软限) 用户复审接受? OR Wave 3 末加 T3.4 split 子任务? | 推默认接受 (dev tool 不计 hard limit), surface ASSUMPTIONS 让 plan-checker 实占决 | MEDIUM |
| **O3** | EE-4 4 维阈值实测 baseline 在 Wave 2 spike (跑 Phase 2.3/2.2 task_plan.md) — 若现存 plan 普遍 ≤2/4 落 BLOCKER, 阈值放宽候选 (e.g. concrete_acceptance ≥90% → ≥80%) | Wave 2 plan-phase 加 spike sub-task, post-spike 阈值校准 | MEDIUM |
| **O4** | `cc-hook-add` schema extension 多 3 字段 (hook_event/hook_matcher/hook_command), 是否需要 weight 4th `hook_type` (script/inline)? Phase 2.4 MIN: 仅 `type: 'command'` (intel dashboard handoff L19 sketch) | MIN scope: 仅 `type: 'command'`, 不加 inline hook_type 第 4 字段 (v0.3+ 评估) | LOW |
| **O5** | 5 fixture ralph-loop Win sentinel **subagent-spawn fixture** 设计细节: 需 mock subagent OR real CC SDK spawn? | 推 mock subagent (real SDK 需 ANTHROPIC_API_KEY, Phase 2.4 OOS 推 v0.3.0 prep T1.1 sister) | MEDIUM |
| **O6** | dashboard SSE migration 影响现 2s polling 客户端 (dashboard.mjs L422-428): 移除 polling? OR SSE + polling 双轨 fallback? | MIN: SSE 替换 polling 完全 (浏览器 EventSource 内建 reconnect 兜底), 不双轨 (Karpathy YAGNI) | LOW-MED |
| **O7** | `~/.claude/harnessed-projects.json` 首次创建 trigger 何处: dashboard 启动检无则 auto-init? OR `harnessed dashboard --add-project` CLI? | MIN: dashboard 启动检无则 auto-init (默认列 cwd as first project), CLI add-project v0.3.0 enhancement | LOW |

---

## § 7 ## Project Constraints (from CLAUDE.md)

(本 phase 工作目录 `D:\GitCode\harnessed\` **未含项目级 CLAUDE.md**, 仅有 `C:\Users\easyi\.claude\CLAUDE.md` 用户级全局 — 全局规则不进 plan-checker scope, 仅用于 RESEARCH 工作流路由。) 关键 routing rule 已 implicit followed:

- **GSD 工作流** (Discuss → Plan → Execute → Verify) — 当前在 Wave A R2 (本 RESEARCH)
- **Tavily/Exa MCP** 优先于 WebSearch/WebFetch — 本 RESEARCH 全 internal 源 (无需 web 查)
- **gh CLI** 优先于 GitHub MCP — 本 phase 无 GitHub 操作
- **Karpathy simplicity** + small surgical changes — 本 RESEARCH 推荐全部基于此原则

---

## § 8 Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| doctor 5 check | CLI (src/cli) | lib helpers (src/cli/lib/) | 用户面 health check, CLI subcommand 一致 sister Phase 1.2 pattern |
| audit 完整版 | CLI (src/cli) | lib helpers + scripts/ reuse | 同上 + script reuse (check-provenance.mjs) |
| EE-4 plan-checker schema | Routing config (routing/) | Agent prompt + CI script (scripts/) | yaml SSOT + agent project-local override + CI enforcement |
| dashboard 3 子功能 | Dev tool (scripts/dashboard.mjs) | NEW installer (src/installers/) for hook | Dev tool single-file + cc-hook installer 走 src/installers sister 6 method dispatch |
| README CI counter gate | CI (.github/workflows/ci.yml) | — | CI 单 step ~15L yaml, sister Phase 2.2 T0.4 |
| Win sentinel | CI (.github/workflows/ci.yml) | NEW test file (tests/routing/) | CI `if: runner.os == 'Windows'` step, sister Phase 2.3 W0 T0.6 |

---

## § 9 Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|--------------|
| A1 | dashboard SSE 在 localhost dev tool 场景 100% 可用 (无 proxy 阻 `text/event-stream`) | § 3.2.2 | LOW — fallback 2s polling 已 production, 可保留 |
| A2 | `fs.watch` Win debounce 500ms 足够吸收 ReadDirectoryChangesW 重复 fire | § 3.2.1 | MEDIUM — Win editor temp file dance 偶 fire >500ms, 加 hash check 兜 |
| A3 | EE-4 4 维 weasel-word grep (`assume|presumably|...`) 不产生 >2 false positive per plan | § 2.2.4 | MEDIUM-HIGH — Wave 2 实测 1-2 plan 校准白名单 |
| A4 | `~/.claude/settings.json` JSON deep-merge 在所有 CC version 安全 (不破现 hooks 块) | § 3.5.3 | MEDIUM — 用户已有 hooks 块需 idempotent 检 |
| A5 | ralph-loop Win sentinel 5 fixture MIN scope 覆盖核心 ralph-loop fork bug (Phase 1.1 finding) | § 4.2.2 | LOW-MED — 30 sample 是 superset, 5 fixture 是 critical path |
| A6 | cc-hook installer manifest 仅需 `type: 'command'` (v0.3+ 评估 inline script type) | O4 | LOW — MIN scope discipline |
| A7 | Wave 3 T3.2 + T3.3 同改 dashboard.mjs 但函数区不重叠, merge conflict 可控 (T3.2 先 merge, T3.3 rebase) | § 3.1 | LOW-MED — git merge convention sister phase 2.1 多 sub-task 并行先例 |

---

## § 10 Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest (existing, Phase 1.x ship) |
| Config file | `vitest.config.ts` (existing) |
| Quick run command | `corepack pnpm test -- <test-pattern>` |
| Full suite command | `corepack pnpm test` |

### Phase Requirements → Test Map (preview, Wave B planner formalize)

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| F2 doctor 5 check | `harnessed doctor` 5 check 输出 + exit code | unit + integration | `pnpm test -- tests/cli/doctor.test.ts` | ❌ Wave 1 NEW |
| F2 origin URL | check 5 detect drift | unit | `pnpm test -- tests/cli/doctor.test.ts -t "origin URL"` | ❌ Wave 1 NEW |
| F3 plan-checker schema | yaml SSOT + TypeBox runtime validate | unit | `pnpm test -- tests/routing/plan-review-schema.test.ts` | ❌ Wave 2 NEW |
| F3 EE-4 4 维 quant output | scripts/run-plan-checker.mjs 输 JSON + exit code 1 on BLOCKER | integration | `pnpm test -- tests/integration/plan-checker-quant.test.ts` | ❌ Wave 2 NEW |
| F4 cc-hook installer | ccHookAdd dispatch + install/uninstall + provenance | unit + contract | `pnpm test -- tests/installers/ccHookAdd.test.ts` + `tests/integration/installer-contract.test.ts` | ❌ Wave 3 NEW (contract existing) |
| F4 STATE watcher SSE | dashboard.mjs SSE /events endpoint + state-changed event | integration | `pnpm test -- tests/scripts/dashboard-sse.test.ts` | ❌ Wave 3 NEW |
| F4 多项目 | dashboard.mjs `/api/projects` + nav HTML | integration | `pnpm test -- tests/scripts/dashboard-multi-project.test.ts` | ❌ Wave 3 NEW |
| F5 README counter gate | CI yaml step exits 1 on counter drift | CI-only | `.github/workflows/ci.yml` (runs in PR) | ❌ Wave 0 NEW |
| F5 audit 完整版 | audit detect origin drift + 模拟 fork tamper | unit + integration | `pnpm test -- tests/cli/audit.test.ts` | ✅ existing extend |
| F5 ralph-loop Win sentinel | 5 fixture e2e on Win matrix | integration (Win-only) | CI step `tests/routing/ralph-loop-win-sentinel.test.ts` | ❌ Wave 4 NEW |

### Sampling Rate
- **Per task commit**: `pnpm test -- <changed-test-pattern>` (focused, <10s)
- **Per wave merge**: `pnpm test` (full suite, <60s on local; CI runs 3-OS matrix)
- **Phase gate**: 3-OS CI 全绿 + Win sentinel 跑通 + 30-sample integration 完成

### Wave 0 Gaps
- [ ] `routing/plan-review-schema.yaml` NEW (~40L) — covers F3
- [ ] `scripts/run-plan-checker.mjs` NEW (~50L CI runner) — covers F3
- [ ] `tests/cli/doctor.test.ts` NEW (~80L unit + integration) — covers F2
- [ ] `tests/cli/audit.test.ts` NEW (~60L unit) — covers F5 audit
- [ ] `tests/installers/ccHookAdd.test.ts` NEW (~50L) — covers F4 installer
- [ ] `tests/integration/installer-contract.test.ts` EXTEND (~15L 加 cc-hook-add row) — covers F4 dispatch
- [ ] `tests/routing/ralph-loop-win-sentinel.test.ts` NEW (~80L, Win-only via `it.skipIf`) — covers F5 Win sentinel
- [ ] `tests/scripts/dashboard-sse.test.ts` NEW (~40L) — covers F4 SSE
- [ ] `tests/scripts/dashboard-multi-project.test.ts` NEW (~40L) — covers F4 多项目
- Framework install: N/A (vitest existing)

---

## § 11 Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Phase 2.4 不引 auth |
| V3 Session Management | no | dashboard 是 local read-only |
| V4 Access Control | partial | doctor #5 origin URL drift detect (audit hard-fail), cc-hook L3 level confirmAt() |
| V5 Input Validation | yes | TypeBox runtime validate (plan-review-schema.yaml + schema extension 4 字段); manifest `checkCmdString` (audit install.cmd injection check) |
| V6 Cryptography | n/a | Phase 2.4 不引 crypto (signed_by audit 已 deferred per ASSUMPTIONS B4) |

### Known Threat Patterns for Phase 2.4 stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| 恶意 fork 注入 install.cmd (multi-command separator) | Tampering | audit COMMAND_SEPARATORS regex (§ 4.1.2) — already covered by `checkCmdString` at install runtime, audit-time pre-flight 同跑 |
| Origin URL drift (无声 fork) | Tampering / Spoofing | doctor #5 warn + audit hard-fail (§ 1.2.5 + § 4.1.1) |
| cc-hook 写 `~/.claude/settings.json` 覆盖现 hooks 块 | Tampering (用户配置丢) | deep-merge + idempotent check + backup() (sister 6 installer 模式, A4 assumption) |
| EE-4 plan-checker false positive triggers spurious BLOCKER | DoS (CI 阻 ship) | weasel-word 白名单 + Wave 2 实测 baseline 校准 (O3) |
| SSE endpoint 被恶意 client 大量 connect (resource exhaustion) | DoS | localhost-only bind (现 dashboard L478 listen(PORT) 默认 IPv4 0.0.0.0, **应改 '127.0.0.1' bind**) — Wave 3 sub-task 显式 |

---

## § 12 Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node ≥ 22 | ALL Phase 2.4 work | ✓ | 22.x (Phase 1.2 doctor check enforces) | — |
| pnpm (corepack) | test/build/lint | ✓ | corepack-managed (ci.yml L110) | — |
| jq | doctor #3 check + audit script | ✓ on dev / ⚠️ CI Win 需 `winget install jqlang.jq` | varies | doctor warn surface, dev runner installs |
| Git ≥ 2.x | doctor #5 + audit origin check | ✓ | system git | — |
| Claude Code SDK | gsd-plan-checker agent | ✓ | (global ~/.claude) | project-local override path (D2.4-7) |
| `@sinclair/typebox` | plan-review-schema.yaml TypeBox validate + spec.ts schema extension | ✓ | existing dep | — |
| `commander` | doctor / audit / cli registerXxx | ✓ | existing dep | — |
| `ws` npm pkg (optional) | NOT NEEDED — SSE 替换 (D2.4-9) | n/a | — | — |
| GitHub Actions windows-latest runner | ralph-loop Win sentinel (§ 4.2.2) | ✓ | existing matrix (ci.yml L18) | — |

**Missing dependencies with no fallback**: NONE
**Missing dependencies with fallback**: jq on Win CI (winget install in step OR skip check ON-OFF)

---

## § 13 Metadata

**Confidence breakdown**:
- doctor 5 check (Topic 1): **HIGH** — 4/5 check 已 production, 1 NEW check 路径直证, OS quirk 内部记录
- EE-4 plan-checker quant (Topic 2): **MEDIUM-HIGH** — intel L74-82 原型 + 现 gsd-plan-checker 三档实证 + 4 维 mechanically gradable; A3 (weasel-word false positive) MEDIUM, Wave 2 实测 baseline 需校
- Dashboard C 路径 (Topic 3): **MEDIUM** — `fs.watch` Win 行为 + SSE 选型基于业内共识 (无 repo internal spike), 7 子点全 sister precedent 直证
- Audit + Win sentinel (Topic 4): **HIGH** (audit) · **MEDIUM-HIGH** (Win sentinel — sister Phase 2.3 W0 T0.6 pattern 直证, 5 fixture scope 经验值)

**Pre-Submission Checklist**:
- [x] All 4 R2 topics investigated (+ Topic 4 audit + Win sentinel)
- [x] Internal sources cited (file:line); intel cited (file:line); no external WebSearch needed
- [x] Negative claims verified (e.g. "无 fs.watch repo precedent" — grep 直证)
- [x] Multiple sources cross-referenced (doctor现状 + KICKOFF + CONTEXT 三处 reconcile)
- [x] Confidence levels assigned per § 0 + § 13
- [x] "What might I have missed?" — surfaced O1-O7 open questions
- [x] Runtime State Inventory n/a (Phase 2.4 是 greenfield 加新 check + 新 installer, 无 rename/refactor scope)
- [x] Security domain included (§ 11) with 5 threat patterns
- [x] ASVS categories verified against Phase 2.4 tech stack
- [x] 20 D2.4-* locks ready for Wave B planner consumption
- [x] 7 open questions surface for Wave B → Wave C handoff

**Research date**: 2026-05-16
**Valid until**: ~2026-08-15 (Node 22 LTS 周期 + CC hook spec stable + `@sinclair/typebox` v0.32 stable)

---

*Phase 2.4 RESEARCH complete — Wave B planner ready to consume D2.4-1~20 locks + 7 open questions handoff*
