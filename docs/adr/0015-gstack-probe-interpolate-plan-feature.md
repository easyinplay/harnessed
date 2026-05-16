# ADR 0015: Phase 3.2 — gstack 前缀探测 + workflow 变量插值 + plan-feature reference 实装 (WIRED) (9 章节 errata 合并)

## Status

**Accepted (phase 3.2 W3 — 2026-05-17)** — phase 3.2 plan-phase Wave 0 sketch (T0.3 9 章节 skeleton) → Wave 3 fill-out (T3.2 detailed expand) → Accepted at phase 3.2 ship.

> Phase 3.2 是 v0.3.0 milestone **第 2 phase (2/4)**, 把 v0.3.0 装配为 **gstack 命令前缀运行时探测 (doctor 6th check, D-01 PROBE) + workflow YAML 变量插值 (JINJA `{{ var }}` zero-dep, D-02) + plan-feature 5-phase 流水 reference 实装 (D-03 WIRED + Phase 3.1 engineHook 二代消费者) + governance veto PUSH 文件路径 (D-04 lazy-read, sister state.ts fail-soft) + W0 backlog 3 项一次根治 (W0.1 cli-audit env-dep CI red fix + W0.2 STATE/README format SSOT normalize + W0.3 schemaVersion 9th + 10th surface decision)**。 4 大主题 sister cluster 一次 ship — 沿袭 ADR 0008/0009/0010/0011/0012/0013/0014 多决策合并 errata 模式 (B-35 + B-36 lock)。

## Context

Phase 3.2 把 v0.3.0 milestone 第 2 phase 装配为 gstack 前缀探测 + workflow 变量插值 + plan-feature 5-phase reference 实装 + governance PUSH 文件路径 + W0 backlog 3 项 absorb。 4 大主题 sister cluster 一次 ship, 作为 v0.3.0 milestone 第 2 phase open — R7.1 (plan-feature workflow 跑通 + CEO veto halt_workflow) + R7.4 (用户三种前缀场景任一都跑通) ROADMAP 双 acceptance bar 锚定。

Phase 3.1 ship 后 T4.4 closure infra 三件套 1 milestone 闲置后**首消费者** activation 闭环 (D-04 WIRE-IN 实证 — Phase 2.2 ready → Phase 3.1 W3 activated); Phase 3.2 W2 T2.3 workflow.run.ts 作为 Phase 3.1 engineHook **二代消费者** (activatePhase + completePhase chain), 进一步验证 "closure infra forward-compat 1 milestone 后激活" pattern 跨 phase 复用 (Phase 3.1 RETRO Lesson 2 实证扩展)。

并办 STATE.md L23a + Phase 3.1 carry-forward 3 项一次根治 — W0.1 cli-audit env-dep CI red Path A LOCKED 修 (RESEARCH § 8.3 vi.mock audit-helpers recipe verbatim) / W0.2 STATE.md 11 line-start markers 补 + ci.yml README completeness check ENFORCE flip (Phase 3.1 DEFERRED #1 兑现) / W0.3 schemaVersion 9th + 10th surface decision (config.v1 + governance.v1 NEW, Karpathy single-responsibility 双独立文件) — 沿袭 Phase 2.1/2.2/2.3/2.4/3.1 Wave 0 一次根治模式。

### A7 守恒约束 (ADR 0001-0014 main body 不可改)

phase 3.2 沿袭 ADR 0003/0005/0007/0008/0009/0010/0011/0012/0013/0014 errata 风格 — **不动 ADR 0001-0014 main body** (A7 守恒)。 baseline tag iterate 14 → 15 (Wave 3 T3.6 ship 时 push `adr-0015-accepted` tag, ci.yml A7 step iter `1-0014` → `1-0015` per W-02 orchestrator explicit literal fix sister Phase 3.1 W5 T5.4)。 本 ADR 0015 起 phase 3.2 ship 时刻 frozen; v0.3.1+ 演化走 ADR 0016+ errata。

## Decisions

### 1. D-01 PROBE — doctor 6th check (gstack 前缀运行时探测)

`src/cli/lib/probe-gstack.ts` 49L PRIMARY helper (sister Phase 2.4 W3 `origin-check.ts` 单一职责 helper extract pattern + Phase 3.1 W3 `engineHook.ts` 49L sister precedent); `src/cli/doctor.ts` 175→186L 加 `checkGstackPrefix()` 6th check (≤200L Karpathy clean — actual baseline 175L per RESEARCH § 1.4 实测，修正 KICKOFF stale 215L描述)。 4 outcome branches per RESEARCH § 1.4 message table verbatim — gstack-only (pass + `prefix='gstack-'`) / bare-only (pass + `prefix=''`) / both (fail + ambiguous detail + edit `.harnessed/config.json` fix hint) / neither (fail + install hint)。 Win shell flavor sister `doctor.ts` L80 checkJq pattern: Node `spawnSync('where' | 'which', cmd)` 跨 shell 唯一稳路径 — 不继承 user shell context (D-01 PROBE LOCKED, INTERACTIVE 一次性 prompt 推 v0.4 dogfooding 验证后决断)。

### 2. D-02 JINJA — `{{ var }}` 模板替换 zero-dep + throw-on-missing fail-loud

`src/workflow/interpolate.ts` 30L pure regex `/\{\{\s*(\w+)\s*\}\}/g` 替换 + `ANY_TEMPLATE = /\{\{[^}]*\}\}/` strict 二阶 verify 未支持 syntax 失败 (Karpathy YAGNI + RESEARCH § 3 jinja2 strict_variables=True 等效 + 0 npm template-lib dep — sister Phase 3.1 D-02 zero FSM-lib 精神)。 `InterpolationError` extends Error 类 throw on undefined var OR residual `{{ ... }}` (e.g. `{{ a.b }}` `\w+` 不命中 '.' 触发 fail-loud)。 行业 strict template recommended (sister 大 jinja2 / handlebars `strict` mode default); JINJA dot-path / nested context 推 v0.4 dogfooding 验证 (D-02 evaluated rejected)。 `src/workflow/loadPhases.ts` 接 `vars?: Record<string, string>` param 加 invokes / on_veto interpolation walk (W-02 unconditional extend `phases.ts` PhaseEntry + PhasesSchema)。

### 3. D-03 WIRED — plan-feature 5-phase reference 实装 (skill stub mock + governance gate 接 + Phase 3.3+ dogfood 换真)

`src/workflow/run.ts` 76L `runWorkflow(yamlPath, vars)` 5-phase 桩跑 governance + checkpoint 真 wire — 不接外部 spawn (Phase 3.3+ dogfood 时换真 gsd-discuss/plan/execute spawn)。 `dispatchSkillStub(skillName)` RESEARCH § 6.2 minimal 3-field mock (status / output / decision; elapsed_ms dropped per Karpathy YAGNI)。 `workflows/plan-feature/workflow.yaml` 40L 5 phase reference (01-gstack-decision / 02-brainstorm / 03-gsd-discuss / 04-gsd-plan / 05-persist) + `model: opus|sonnet|sonnet|sonnet|haiku` per-phase tier (sister Phase 2.2 CD-2)。 5 SKILL.md stubs (~18-20L each) cover plan-feature-{decision,brainstorm,discuss,plan,persist}。 中庸 SKELETON-vs-FULL trade-off: validated workflow runtime behavior without scope-creep to FULL real spawn (Phase 3.3+ prereq for plan-feature dogfood)。

### 4. D-04 PUSH — governance.json file-based lazy-read (NOT polling)

`src/workflow/governance.ts` 41L `readGovernance()` + `isVetoed()` — gstack 写 `.harnessed/governance.json` (NOT in harnessed scope per D-04 contract); harnessed lazy-once per workflow phase boundary read (1 read per phase 转换, NOT polling timer)。 sister `src/checkpoint/state.ts` L23-41 `readCurrentWorkflow` fail-soft pattern 70% reuse — missing/corrupt/drift → `null` fallback。 Phase 2.4 SSE polling anti-pattern lesson + D-04 anti-sneak guard `! grep -E "setInterval|setTimeout.*[Pp]oll|chokidar" src/workflow/governance.ts`。 `runWorkflow` per-phase boundary `if (await isVetoed()) { await statePause(); return paused-veto }` — B-01 planner-revision iter 1 fix: **activatePhase BEFORE isVetoed** (Phase 3.1 D-02 statePause 契约要求 'active' state to transition; veto-at-i=0 fixture 3 守门)。

### 5. § 4 + § 10 — schemaVersion 9th + 10th surface double-add (config.v1 + governance.v1, Option B Karpathy single-responsibility)

`src/types/schemaVersion.ts` 8 → 10 surface (additive extension, B-37 内部 0 修改): `harnessed.config.v1` (9th — `.harnessed/config.json` gstack_prefix store) + `harnessed.governance.v1` (10th — `.harnessed/governance.json` gstack veto status)。 W0.3 决: Option B 双独立 surface vs Option A 单 `.harnessed/state.json` umbrella — Karpathy single-responsibility per file (config 是 harnessed-internal write, governance 是 gstack-external write — race condition isolation; sister 5-path `.harnessed/` 已成 7-path)。 sister Phase 3.1 W1 T1.1 7→8 surface precedent extended 平滑; CD-5 single 兼容门 unchanged (`branchOnSchemaVersion` 一脉相承; T1.7 governance.ts consumer)。

### 6. § 8 — W0.1 cli-audit env-dep CI red Path A LOCKED fix (vi.mock helpers, src/ unchanged)

T0.1 W0.1 必修 — Phase 3.1 ship 后 cli-audit 2 pre-existing fail Path A 修 (RESEARCH § 8.3 recipe verbatim): `tests/unit/cli-audit.test.ts` 加 `vi.mock('../../src/cli/lib/audit-helpers')` ~10-15L mock origin-check + auditEnv runtime helpers (Phase 2.4 W4 audit runtime-layer 后 unit test mocks 未同步 root cause)。 `src/cli/audit.ts` unchanged (anti-scope-creep verify — 仅 test seam mock)。 CI 3-OS green achieved on first push (first acceptance bar, sister Phase 2.1 transparency CI gate W3 ENFORCE pattern)。 Phase 3.1 carry-forward "cli-audit Phase 3.2 fix session" PRIORITY BUMP 兑现。

### 7. § 9 — W0.2 STATE.md/README.md format SSOT normalize + ci.yml ENFORCE flip (Phase 3.1 W0.3 deferred #1 兑现)

T0.2 — STATE.md "已完成 phase ship 历史" 节加 11 line-start markers (`^- **Phase X.Y shipped** ✅` per shipped phase) + Option A README format SSOT (counter gate 11 → 12 consistent across STATE.md count vs README count)。 `.github/workflows/ci.yml` README completeness check 3-line semantic change: delete `WARN_ONLY=true` flag + `::warning` → `::error` + `exit 0` → `exit 1` (Phase 3.1 W0.3 W-warn-only round 1 → Phase 3.2 W0 ENFORCE flip per sister Phase 2.1 transparency 4-phase warn-only round 1 → ENFORCE 跨 milestone pattern)。 DEFERRED #1 兑现 = Phase 3.1 carry-forward 闭环。

### 8. § 10 — `.harnessed/` 双独立文件 (config.json + governance.json, sister 5-path → 7-path)

`.harnessed/config.json` (gstack_prefix store, harnessed-internal write) + `.harnessed/governance.json` (gstack veto status, gstack-external write) — single-responsibility per file 决断, sister `.harnessed/checkpoints/`, `.harnessed/current-workflow.json`, `.harnessed/state/`, `.harnessed/sessions/`, `.harnessed/route-logs/` 5-path 已成 7-path。 race condition isolation: harnessed-internal 写 config 不与 gstack-external 写 governance 抢锁; 单一 `state.json` umbrella 触发跨 writer 锁竞争 anti-pattern。 Phase 3.3+ aliases.yaml + deprecation marker prereq carry-forward — 可能 8th path `.harnessed/aliases-state.json` 同模式延伸。

### 9. § 12 — 4-wave topology rationale (W0-W3, sister Phase 3.1 6-wave 缩 2 因 WIRED scope 更小) + A7 conservation

W0 backlog 3 项 absorb + setup → W1 schema 9th+10th surface + probe-gstack + interpolate + governance (~8 task) → W2 loadPhases extend + planFeature schema + workflow runner + workflow.yaml + 5 SKILL.md stubs + integration tests (~6 task) → W3 e2e prefix matrix + ADR 0015 + STATE/RETRO/ROADMAP 续编 + A7 verify + baseline + milestone tags (~5 task)。 23 atomic task vs Phase 3.1 28 task (scope smaller — WIRED stub vs Phase 3.1 full checkpoint engine + resume CLI + compact); ~280L src delta vs Phase 3.1 ~370L (smaller)。 ADR 0001-0014 main body 0 diff verify (A7 守恒 sister Phase 3.1 T5.4); ci.yml A7 iter `1-0014` → `1-0015` per W-02 orchestrator explicit `ADR 0001-0015` literal (NOT naked `1-0015` substring); baseline tag `adr-0015-accepted` (W3 T3.6) + milestone tag `v0.3.0-alpha.2-plan-feature`。

## A7 Conservation

ADR 0001-0014 main body **untouched**; baseline tag iteration `adr-0001-accepted` ... `adr-0014-accepted` → 加 `adr-0015-accepted` (phase 3.2 Wave 3 T3.6 ship 打)。 `docs/AGENT-DEFINITION-FACTORY-CONTRACT.md` v1.1 + `docs/INSTALLER-CONTRACT.md` main body **不动**。 schemaVersion 8-surface → 10-surface = additive extension (新 `config.v1` + `governance.v1`), 无修改既有 8 surface 内部 (B-37, sister Phase 3.1 7→8 precedent extended)。

### A7 守恒验收命令 (phase 3.2 ship 后 0001-0015 iterate)

```bash
for n in 0001 0002 0003 0004 0005 0006 0007 0008 0009 0010 0011 0012 0013 0014 0015; do
  diff_out=$(git diff "adr-${n}-accepted" -- "docs/adr/${n}-*.md")
  [ -z "$diff_out" ] || { echo "A7 violated for ADR ${n}"; exit 1; }
done
echo "A7 ✅ ADR 0001-0015 main body unchanged"
```

phase 3.2 ship 前 A7 守恒 ADR 0001-0014 验收 (Wave 3 verify + T3.6 ship-time verify):

```bash
git diff adr-0014-accepted..HEAD -- "docs/adr/000[1-9]-*.md" "docs/adr/001[0-4]-*.md" | wc -l   # = 0
```

### CI A7 step

`.github/workflows/ci.yml` A7 step 两处 `for n in ... 0014` 加 `0015`; step name `ADR 0001-0014` → `ADR 0001-0015` (W-02 explicit literal fix, Wave 3 T3.6 落地)。

## Consequences

**Capability deltas (Phase 3.2 ship 后新增):**

| Capability | Delta | Verify |
|------------|-------|--------|
| gstack prefix probe (D-01) | NEW probe-gstack.ts 49L PRIMARY helper + doctor 6th check 175→186L | `tests/unit/probe-gstack.test.ts` 5 fixture + `tests/cli/doctor.test.ts` 5→6 surface bump |
| workflow JINJA interpolate (D-02) | NEW interpolate.ts 30L zero-dep + InterpolationError + loadPhases vars walk | `tests/unit/workflow-interpolate.test.ts` 7 fixture |
| plan-feature 5-phase WIRED runner (D-03) | NEW src/workflow/run.ts 76L + workflows/plan-feature/workflow.yaml 40L + 5 SKILL.md stubs | `tests/integration/plan-feature-wired.test.ts` 3 fixture + `tests/integration/plan-feature-prefix-e2e.test.ts` 3 fixture (R7.4 acceptance) |
| governance PUSH veto file-path (D-04) | NEW governance.ts 41L lazy-read + 10th schemaVersion surface | `tests/unit/governance.test.ts` 4 fixture |
| schemaVersion 9th + 10th surface | additive 8→10 (config.v1 + governance.v1) | `grep -cE "harnessed\.\w+\.v1" src/types/schemaVersion.ts` ≥ 10 |
| W0.1 cli-audit Path A fix | vi.mock audit-helpers ~10-15L; src/cli/audit.ts unchanged | CI 3-OS green achieved on first push (first acceptance bar) |
| W0.2 STATE.md 12 markers + README ENFORCE | STATE.md 11→12 line-start markers + ci.yml 3-line ENFORCE flip | `grep -cE "^[-*]?\s*\*?\*?Phase [1-9]\.[0-9]\*?\*?.*[Ss]hipped" .planning/STATE.md` == 12 |
| T4.4 closure infra 二代消费者 (D-04 WIRE-IN 实证) | workflow.run.ts = Phase 3.1 engineHook activatePhase + completePhase 二代消费者 | T2.6 11 fixture integration + T3.1 3 fixture prefix matrix |

**Negative consequence + mitigation**: DEFERRED #1 (dashboard-sse pre-existing env-dep flaky → Phase 3.3+ OR dedicated patch session, NOT W1+W2 caused per `0a8841f` log) + DEFERRED #W-01a (sessionId propagation → Phase 3.3+ dogfood 真 spawn 时 add session_id field, W-01 dead-var lesson sister Phase 3.1 W-04)。 mitigation: 2 sister deferred 均 documented + tracked + 触发条件 clear。

## Compliance

**F1-F8 8/8 acceptance bar verify evidence**:

- F1 ADR 0015 errata accepted — 本 ADR Status flip + 9 章节 fill (Wave 3 T3.2)
- F2 gstack prefix probe + doctor 6th check (R7.4 case 1+2+3) — Wave 1 T1.4 + T1.5 + T1.8 (PRIMARY helper + 5 fixture + doctor.ts 6 surface bump)
- F3 workflow JINJA interpolate + loadPhases vars walk (D-02) — Wave 1 T1.6 + Wave 2 T2.1 (7 fixture + UNCONDITIONAL phases.ts extend)
- F4 plan-feature 5-phase WIRED runner (D-03) — Wave 2 T2.2-T2.6 (5 task + 3 + 11 fixture)
- F5 governance PUSH veto file-path (D-04) — Wave 1 T1.7 + Wave 2 T2.6 fixture 3 (B-01 veto-at-i=0 + resume.ts integration proof)
- F6 e2e prefix matrix smoke (R7.4 acceptance) — Wave 3 T3.1 (3 fixture, gstack-/bare/ambiguous)
- F7 W0 backlog 3 项一次根治 — Wave 0 T0.1-T0.4 (cli-audit env-dep + STATE/README SSOT + schemaVersion 9th+10th decision + tests dirs scaffold)
- F8 SHIP — `adr-0015-accepted` baseline tag + `v0.3.0-alpha.2-plan-feature` (Wave 3 T3.6); ci.yml A7 step iter `1-0014` → `1-0015` (T3.6); A7 守恒 ADR 0001-0014 main body 0 diff verified

**3-OS CI 全绿 evidence**: Wave 0 W0.1 fix achieved CI 3-OS green on first push (first acceptance bar per RESEARCH § 8.3 Path A LOCKED recipe verified); Wave 1-3 ship per-task CI runs 3-OS green; Wave 3 ship final CI verify (T3.6 push 触发)。

**Karpathy hard limits met (all files ≤ budget)**:
- ADR 0015 ≤ 250L (本 fill-out 实占 ≈ 200L)
- doctor.ts 175→186L (≤200L hard limit clean — Karpathy R2 § 1.4 实测 175L baseline 修正 KICKOFF stale 215L描述)
- probe-gstack.ts 49L (≤50L PRIMARY helper, sister Phase 3.1 W3 engineHook.ts 49L + Phase 2.4 W3 origin-check.ts sister-share extract pattern)
- interpolate.ts 30L (≤35L D-02 zero-dep + strict)
- governance.ts 41L (≤50L D-04 PUSH lazy-read)
- workflow/run.ts 76L (≤80L D-03 WIRED 5-phase 桩 + B-01 activate-before-veto reorder)
- workflow/schema/config.ts ≤ 20L (9th surface TypeBox)
- workflow/schema/governance.ts ≤ 30L (10th surface TypeBox)
- workflow/schema/planFeature.ts ≤ 40L (plan-feature DSL)
- workflow/schema/phases.ts ~54L (W-02 UNCONDITIONAL +4L extend invokes + on_veto Optional fields ≤80L)
- 5 SKILL.md stubs ~18-20L each + plan-feature/workflow.yaml 40L

## Errata-path note

phase 3.2 走 ADR 0015 errata pattern (新决策 inline, ADR 0001-0014 0-diff preserved); future Phase 3.3+ 走 ADR 0016+ errata。 本 ADR 0015 起 phase 3.2 ship 时刻 frozen — 任何 v0.3.1+ 演化 (Phase 3.3 aliases.yaml + deprecation marker + known-good 版本组合 / Phase 3.4 路由命中率 ≥ 85% 验收 + token budget 监控 / sessionId propagation 加 W-01a deferred 兑现 → Phase 3.3+ dogfood 真 spawn 时 / dashboard-sse pre-existing flaky 修 → Phase 3.3+ 或 dedicated patch session) 必须开 ADR 0016+ errata; 本 ADR 0015 main body 不可改 (与 ADR 0001-0014 同等守恒规则)。

phase 3.2 ship 时 Wave 3 T3.6 (本 ADR `adr-0015-accepted` baseline tag push 前) ci.yml A7 step `for n in ... 0014` → `for n in ... 0014 0015` + step name `ADR 0001-0014` → `ADR 0001-0015` (baseline tag iteration `1-0014 → 1-0015` per W-02 orchestrator explicit literal fix sister Phase 3.1 W5 T5.4)。

## Adoption-confirmation

**v0.3.0 MILESTONE 2/4 PROGRESS** (sister Phase 3.1 v0.3.0 milestone 第 1 phase ship pattern — 第 2 phase ship 推进 milestone 一半):

- 2 phase ship: Phase 3.1 (checkpoint engine + harnessed resume + compact) + Phase 3.2 (gstack prefix probe + workflow interpolate + plan-feature 5-phase WIRED) = 2/4
- 15 ADR + 15 baseline tag accumulate (0001-0015)
- 11 milestone tag accumulate (sister v0.1.0+v0.2.0 9 个 + v0.3.0-alpha.1-checkpoint + v0.3.0-alpha.2-plan-feature)
- Tests baseline: 596 → ~626+ (W1+W2 +27 fixture probe + interpolate + governance + integration + W3 +3 fixture prefix matrix); 3-OS CI matrix 全绿
- W2 T2.3 wired (workflow.run.ts = Phase 3.1 engineHook 二代消费者) + W2 T2.6 11 fixture integration (含 B-01 fixture 3 + Phase 3.1 resume.ts integration proof) + W3 T3.1 3 fixture prefix matrix + W3 T3.6 baseline tag adr-0015-accepted push = "Adoption confirmed" 实证

**Deferred items disposition** (Wave 3 ship-time review):
- DEFERRED #1 (dashboard-sse pre-existing env-dep flaky) → Phase 3.3+ OR dedicated patch session (NOT W1+W2 caused per `0a8841f` log)
- DEFERRED #W-01a (sessionId propagation niche) → Phase 3.3+ dogfood true spawn 时 add session_id field (W-01 dead-var lesson sister Phase 3.1 W-04)
- Phase 3.1 carry-forward DEFERRED #1 (W0.3 ENFORCE flip) ✅ RESOLVED Phase 3.2 W0.2 (Option A README format SSOT + ci.yml 3-line ENFORCE flip)
- Phase 3.1 carry-forward cli-audit 2 pre-existing fail ✅ RESOLVED Phase 3.2 W0.1 (Path A vi.mock helpers ~10-15L verbatim RESEARCH § 8.3 recipe)
- EE-4 BLOCKER auto-spawn rerun → Phase 3.3 or Phase 3.4 plan-feature workflow w/ checkpoint 成熟后接入 (carry-forward unchanged)
- T4.4 Task Session 复用 完整版 ✅ RESOLVED Phase 3.1 W3 (D-04 WIRE-IN activated); Phase 3.2 W2 验证 closure infra 二代消费 (workflow.run.ts activatePhase + completePhase chain)

## Planner-revision iter 1 absorption footnote (BLOCKER + 3 WARNING fixes)

Phase 3.2 plan-phase Wave C iter 1 gsd-plan-checker 输出 1 BLOCKER + 3 WARNING; revision iter 1 4/4 fix per orchestrator tier-call decisions:

- **B-01 BLOCKER**: T2.3 run.ts activate-BEFORE-veto-check reorder + T2.6 fixture 3 (veto-at-i=0 + Phase 3.1 resume.ts integration proof) — sister Phase 3.1 D-02 state.ts contract preserved (pause transitions from 'active'); engineHook.ts:15 status enum is active/complete only (paused 走 sigintTrap per L17 comment), 走 activatePhase + statePause chain instead of engineCheckpointHook with paused status。 awk line-order guard added T2.3 acceptance + fixture 3 5 asserts (a-e) incl runResume integration。
- **W-01 WARNING**: T2.3 sessionId dead variable dropped at source (WIRED mode stub returns no sessionId per D-03); sessionId propagation deferred Phase 3.3+ dogfood 真 spawn (sister Phase 3.1 W-04 BLOCKER lesson — eliminate at source, don't introduce dead vars before the surface exists); DEFERRED #W-01a registered。
- **W-02 WARNING**: T2.1 src/workflow/schema/phases.ts UNCONDITIONAL +4L extend (invokes + on_veto Optional fields) — Karpathy DRY: extending parent schema cleaner than parallel schema; T2.6 fixture 1 PhasesSchema.Check(parsedYaml) returns true (happy-path validate 守门)。
- **W-03 WARNING**: T0.3 W0.3-schema-decision.md "Path divergence from PATTERNS.md" section added (~11L) — schemas live under src/workflow/schema/ per consumer colocation rule, PATTERNS.md § 2.4 indicative-of-pattern not literal-path mandate; reusable pattern for future PATTERNS.md analog interpretation across phases。

EE-4 4/4 PASS RELAX baseline held strong across both iters (iter 2 strengthened file_references_verified + reference_sources_real via +3 source-of-truth Grep verifies for engineHook.ts L15 + state.ts L65-75 + phases.ts L28-49)。 Notable strength: planner correctly adapted to source-of-truth technical constraint (engineHook.ts status enum is active/complete only — paused goes through sigintTrap.ts) by using activatePhase + statePause chain instead of orchestrator initial suggestion of engineCheckpointHook with paused status — deep contract-reading discipline。

## References

### 内部依据

- `docs/adr/0014-checkpoint-engine-resume-compact.md` (Phase 3.1 ship base — 9 章节 errata sister template direct analog)
- `docs/adr/0013-phase-2.4-doctor-ee4-dashboard-c-path.md` (Phase 2.4 ship — doctor 完整版 sister precedent)
- `docs/adr/0011-execute-task-sdk-ralph.md` (Phase 2.2 ship — T4.4 closure infra 三件套 ship 来源 + schemaVersion 7-surface single 兼容门 original; Phase 3.2 W2 二代消费实证)
- `docs/AGENT-DEFINITION-FACTORY-CONTRACT.md` v1.1 (main body **不动** A7 守恒)
- `src/cli/lib/probe-gstack.ts` (W1 T1.4 NEW 49L — D-01 PROBE PRIMARY helper; sister Phase 2.4 W3 origin-check.ts + Phase 3.1 W3 engineHook.ts 49L extraction precedent)
- `src/workflow/interpolate.ts` (W1 T1.6 NEW 30L — D-02 JINJA zero-dep + InterpolationError + strict mode)
- `src/workflow/governance.ts` (W1 T1.7 NEW 41L — D-04 PUSH lazy-read + sister state.ts fail-soft)
- `src/workflow/run.ts` (W2 T2.3 NEW 76L — D-03 WIRED 5-phase 桩 + B-01 activate-before-veto reorder + W-01 sessionId dead-var dropped)
- `src/workflow/schema/{config,governance,planFeature,phases}.ts` (W1 T1.2/T1.3 + W2 T2.1/T2.2 — 9th + 10th schemaVersion surface + W-02 phases.ts UNCONDITIONAL extend invokes + on_veto Optional)
- `src/types/schemaVersion.ts` (W1 T1.1 — 8 → 10 surface additive)
- `src/cli/doctor.ts` (W1 T1.8 — 175→186L 6th check checkGstackPrefix, ≤200L Karpathy clean)
- `workflows/plan-feature/workflow.yaml` (W2 T2.4 NEW 40L — 5 phase reference + JINJA placeholder + on_veto: halt_workflow)
- `workflows/plan-feature/{plan-feature-decision,brainstorm,discuss,plan,persist}/SKILL.md` (W2 T2.5 5 NEW stubs ~18-20L each)
- `tests/integration/plan-feature-wired.test.ts` (W2 T2.6 NEW 161L — 3 fixture D-03 WIRED + B-01 veto-at-i=0 + Phase 3.1 resume.ts integration proof)
- `tests/integration/plan-feature-prefix-e2e.test.ts` (W3 T3.1 NEW 138L — 3 fixture prefix matrix R7.4 acceptance + vi.mock spawnSync surface)
- `.github/workflows/ci.yml` (W0.2 README ENFORCE flip 3-line semantic change + W3 T3.6 A7 iter `1-0014` → `1-0015` per W-02 explicit literal fix)
- `.planning/phase-3.2/{3.2-KICKOFF, 3.2-CONTEXT, 3.2-DISCUSSION-LOG, PATTERNS, RESEARCH, ASSUMPTIONS, PLAN, task_plan, PLAN-CHECK, PLAN-CHECK-DELTA, AUDIT, deferred-items, progress, VERIFICATION, DOGFOOD-T3.5, W0.3-schema-decision}.md`

### 外部参考

- `.planning/intel/omc-comparison.md` § 0 SSOT 引用纪律
- `.planning/ROADMAP.md` L160-162 (Phase 3.2 验收: "用户 gstack 装哪种前缀都能跑通")
- `.planning/REQUIREMENTS.md` R7.1 + R7.4 (plan-feature workflow + 用户三种前缀场景任一都跑通)
- `docs/PROJECT-SPEC.md` § 5 (plan-feature workflow 立项参数)
- jinja2 docs strict_variables=True (D-02 reference convention)
- code.claude.com/docs/en/agent-sdk/sessions (Phase 3.3+ dogfood prereq for sessionId propagation 接入)
