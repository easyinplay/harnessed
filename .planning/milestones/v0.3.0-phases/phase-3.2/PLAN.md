---
phase: 3.2
plan: 1
type: execute
wave: 0
depends_on: []
files_modified:
  # W0 backlog absorb (3 项 + 1 prereq decision record)
  - tests/unit/cli-audit.test.ts                  # W0.1 必修 — Path A locked (RESEARCH § 8.3) — vi.mock audit-helpers ~10-15L delta (CI 3-OS green = first acceptance bar)
  - .planning/STATE.md                            # W0.2 — 加 "已完成 phase ship 历史" 节 (11 line-start markers, RESEARCH § 9.3 verbatim) + Phase 3.2 ship marker (W3 续编)
  - .github/workflows/ci.yml                      # W0.2 — README completeness ENFORCE flip (DELETE L201 continue-on-error: true + ::warning → ::error + exit 1) — Phase 3.1 W0.3 deferred #1 兑现
  - .planning/phase-3.2/W0.3-schema-decision.md   # W0.3 — schemaVersion 9th + 10th surface decision record (RESEARCH § 4.1 + § 10.1: NEW config.v1 + governance.v1 双独立, single-responsibility) — REVISED iter 1: W-03 path divergence section added
  # W1 — doctor + interpolate + governance + schemas (9th + 10th surface)
  - src/types/schemaVersion.ts                    # MODIFY 8 → 10 surface (+ config + governance, 4L delta) — sister Phase 3.1 W1 T1.1 8th surface 模式直接 analog
  - src/workflow/schema/config.ts                 # NEW ~15L — TypeBox ConfigV1 (D-01 gstack_prefix) — sister checkpoint/schema/currentWorkflow.v1.ts pattern
  - src/workflow/schema/governance.ts             # NEW ~25L — TypeBox GovernanceV1 (D-04 PUSH veto status, active/vetoed union) — sister checkpoint/schema/checkpoint.v1.ts pattern; W-03 planner-revision iter 1 path divergence (colocation rule: schemas live under workflow/schema/ since primary consumer is workflow/governance.ts + run.ts; PATTERNS.md § 2.4 sketch at checkpoint/schema/ was indicative-of-pattern not literal-path — documented in W0.3-schema-decision.md "Path divergence" section)
  - src/cli/lib/probe-gstack.ts                   # NEW ~40L PRIMARY helper — D-01 PROBE locked (sister origin-check.ts spawnSync wrap + Win finder switch `process.platform === 'win32' ? 'where' : 'which'`)
  - src/cli/doctor.ts                             # MODIFY +5L — 6th check `checkGstackPrefix` dispatch (sister `checkOriginUrl` L130-134 范式) — 175 → 180L ≤ 200L Karpathy clean
  - src/workflow/interpolate.ts                   # NEW ~25-30L — D-02 JINJA locked, zero-dep regex `/\{\{\s*(\w+)\s*\}\}/g` + throw InterpolationError on undefined (Karpathy fail-loud per RESEARCH § 3)
  - src/workflow/governance.ts                    # NEW ~25L — D-04 PUSH lazy-read (sister state.ts L23-41 readCurrentWorkflow 模式直接 analog); readGovernance + isVetoed
  # W1 tests
  - tests/cli/probe-gstack.test.ts                # NEW ~60L — 5 fixture PROBE 3 状态 + Win where/Linux which matrix + --json
  - tests/workflow/interpolate.test.ts            # NEW ~50L — 6 fixture (RESEARCH § 2.3 cells: happy / multi var / undefined throws / empty / nested throws / escape literal)
  - tests/workflow/schema/governance.test.ts      # NEW ~40L — 4 fixture TypeBox Value.Check happy / drift / extra field / huge reason maxLength
  - tests/workflow/schema/config.test.ts          # NEW ~40L — 4 fixture TypeBox config.v1 happy / drift / gstack_prefix Union enforce / extra field
  - tests/workflow/governance.test.ts             # NEW ~50L — 4 fixture (file missing → null+active / active / vetoed / corrupt JSON → null fail-soft)
  # W2 — workflow runner + plan-feature reference + 5 skill stubs
  - src/workflow/loadPhases.ts                    # MODIFY +5-8L — extend loadPhases sig (vars param) + interpolate invokes 1 step (per planner decision: explicit dependency injection)
  - src/workflow/schema/phases.ts                 # MODIFY +4L — W-02 planner-revision iter 1 UNCONDITIONAL extend: add `invokes?: string` to PhaseEntry + `on_veto?: 'halt_workflow'` to PhasesSchema top-level (Karpathy DRY: plan-feature workflow consumes same loader; extending parent schema cleaner than parallel; ~51→~54L ≤ 80L; both fields Optional → execute-task/phases.yaml backward-compat preserved)
  - src/workflow/schema/planFeature.ts            # NEW ~30L — TypeBox plan-feature DSL schema (`workflow / on_veto / phases[]` with optional invokes per phase, RESEARCH § 5.3 Path A single-responsibility)
  - src/workflow/run.ts                           # NEW ~78L — workflow runner (D-03 WIRED 5-phase 桩 + D-04 PUSH governance gate + Phase 3.1 engineHook 二代 consumer); REVISED iter 1: B-01 activatePhase-BEFORE-isVetoed reorder + W-01 sessionId dead-var dropped
  - workflows/plan-feature/workflow.yaml          # NEW ~40L — 5-phase DSL (gstack-decision → brainstorm → gsd-discuss → gsd-plan → persist) + JINJA `{{ gstack_prefix }}office-hours` + workflow-level on_veto:halt_workflow
  - skills/plan-feature-decision/SKILL.md         # NEW ~15L — stub (mock {status:ok, output, decision:mock-approved})
  - skills/plan-feature-brainstorm/SKILL.md       # NEW ~15L — stub
  - skills/plan-feature-discuss/SKILL.md          # NEW ~15L — stub
  - skills/plan-feature-plan/SKILL.md             # NEW ~15L — stub
  - skills/plan-feature-persist/SKILL.md          # NEW ~15L — stub
  # W2 tests
  - tests/workflow/run.test.ts                    # NEW ~60L — 3 fixture (5 phase happy / veto at phase 2 → paused-veto / dispatchSkillStub returns ok mock)
  - tests/workflow/loadPhases-interpolate.test.ts # NEW ~40L — 3 fixture (yaml + vars → invokes interpolated; undefined var throws; vars omitted → no interpolate path)
  - tests/workflow/schema/planFeature.test.ts     # NEW ~30L — 2 fixture (valid DSL parse + invalid extra field rejected)
  - tests/integration/plan-feature-wired.test.ts  # NEW ~110L — 3 fixture e2e (5 phase happy → 5 checkpoint entries + state.complete; veto at phase 2 → state.pause + halt + remaining phases 不执行; B-01 fixture 3 added: veto-at-i=0 → activatePhase writes 'active' THEN statePause transitions paused, consumable by Phase 3.1 resume.ts — planner-revision iter 1)
  # W3 — e2e dogfood + ADR + STATE/RETRO/ROADMAP + ship
  - tests/integration/plan-feature-prefix-e2e.test.ts  # NEW ~80L — 3 fixture (gstack-/'')/both/neither prefix matrix, full PROBE → JINJA interpolate → workflow run e2e
  - docs/adr/0015-gstack-probe-interpolate-plan-feature.md  # NEW ~150L — Phase 3.2 ADR 9 章节 (D-01 PROBE / D-02 JINJA / D-03 WIRED / D-04 PUSH / § 4 9th+10th surface / § 8 W0.1 fix path A / § 9 W0.2 README SSOT / § 10 双 .harnessed 文件 / § 12 4-wave topology)
  - .planning/RETROSPECTIVE.md                    # MODIFY — Phase 3.2 milestone retrospective (W0.1 cli-audit env-dep root-cause + W2 workflow runner 首消费者 governance + e2e prefix matrix lessons)
  - .planning/ROADMAP.md                          # MODIFY — Phase 3.2 ✅ SHIPPED marker + v0.3.0 2/4 进度 + Phase 3.3 启动 prereq

autonomous: true

requirements:
  - R7.1  # 5-phase 流水 reference implementation (gstack-decision → brainstorm → gsd-discuss → gsd-plan → persist); 验收 30 plan-feature 场景 + CEO veto halt_workflow
  - R7.4  # gstack 命令前缀探测 + workflow invokes 变量插值; 验收用户三种前缀场景任一都跑通

# user_setup: 无 — 本 phase 0 external service dependency (PROBE 探测目标 gstack CLI 缺失是 by-design fail-soft per RESEARCH § 16; harnessed 仅 reader of .harnessed/governance.json, gstack 自身职责写)

must_haves:
  truths:
    # R7.4 — gstack 前缀探测 + workflow 变量插值
    - "developer can run `harnessed doctor` on a machine with EXACTLY `gstack-office-hours` in PATH and see check #6 `gstack prefix — gstack-office-hours found at <path>` pass status; `.harnessed/config.json` written with `{schemaVersion:'harnessed.config.v1', gstack_prefix:'gstack-'}` (D-01 PROBE single-hit branch)"
    - "developer can run `harnessed doctor` on a machine with EXACTLY `office-hours` (no prefix) in PATH and see check #6 pass with prefix '' (--no-prefix mode); `.harnessed/config.json` written `gstack_prefix:''` (D-01 PROBE bare-only branch)"
    - "developer can run `harnessed doctor` on a machine with BOTH `gstack-office-hours` AND `office-hours` in PATH and see check #6 FAIL + fix hint `edit .harnessed/config.json manually: {gstack_prefix:'gstack-'} OR {gstack_prefix:''}`; exit 1 (Karpathy fail-loud, D-01 PROBE ambiguous branch)"
    - "developer can run `harnessed doctor` on a machine with NEITHER `gstack-office-hours` NOR `office-hours` in PATH and see check #6 FAIL + fix hint `install gstack: npm i -g @gstack/cli`; exit 1 (D-01 PROBE missing branch)"
    - "developer can run `harnessed doctor --json` and the JSON output `checks[]` array contains the 6th entry `{name:'gstack prefix', status:'pass'|'fail', message, fix?}` consumable by CI (sister doctor L141-172 --json pattern)"
    - "interpolate('{{ gstack_prefix }}office-hours', {gstack_prefix:'gstack-'}) returns 'gstack-office-hours'; interpolate('{{ gstack_prefix }}office-hours', {gstack_prefix:''}) returns 'office-hours' (--no-prefix scenario); interpolate('{{ unknown }}', {gstack_prefix:'gstack-'}) throws InterpolationError with template excerpt (Karpathy fail-loud, D-02 throw-on-missing per RESEARCH § 3)"
    - "loadPhases('workflows/plan-feature/workflow.yaml', {gstack_prefix:'gstack-'}) returns parsed phases array where phase 1 `invokes` field is the interpolated string 'gstack-office-hours' (not the literal '{{ gstack_prefix }}office-hours'); when called WITHOUT vars OR yaml has no `invokes` field, loadPhases returns unchanged phases (graceful pass-through); src/workflow/schema/phases.ts PhasesSchema extended (W-02 planner-revision iter 1 UNCONDITIONAL: invokes + on_veto Optional fields added) so Value.Check accepts plan-feature/workflow.yaml without rejection"

    # R7.1 — plan-feature 5-phase reference WIRED + governance veto halt
    - "runWorkflow('workflows/plan-feature/workflow.yaml', vars) iterates 5 phases (01-gstack-decision → 02-brainstorm → 03-gsd-discuss → 04-gsd-plan → 05-persist), dispatches each via dispatchSkillStub returning mock {status:'ok', output:'<stub for plan-feature-{phase}>', decision:'mock-approved'}, writes checkpoint after each phase via Phase 3.1 engineHook.completePhase (二代 consumer); WIRED mode (W-01 planner-revision iter 1) → completePhase consumes Phase 3.1 D-04 closure infra WITHOUT sessionId field (stub returns no sessionId per D-03; sessionId propagation deferred Phase 3.3+ dogfood true spawn); returns {status:'complete', phasesRun:5}"
    - "runWorkflow calls activatePhase(ph.id) FIRST inside each phase iter (B-01 planner-revision iter 1 reorder — guarantees current-workflow.json 'active' state exists for statePause to transition; covers veto-at-i=0 scenario where no prior phase seeded state), THEN performs lazy isVetoed() PUSH read (NOT polling timer per D-04); when governance.json contains {status:'vetoed', ...} at phase boundary, runWorkflow calls statePause() (Phase 3.1 D-02 KARPATHY 3-state reuse — transitions active→paused) + returns {status:'paused-veto', phasesRun:i, lastPhaseId:ph.id} + remaining phases do NOT execute (R7.1 acceptance 'CEO veto 时 halt_workflow 不再续'); paused state is consumable by Phase 3.1 resume.ts (R7.1 acceptance 'checkpoint paused 保留')"
    - "missing .harnessed/governance.json file → readGovernance() returns null → isVetoed() returns false (default active, fail-soft sister state.ts L33-35 模式); corrupt governance.json JSON → null fail-soft (no false halt from malicious tamper, RESEARCH § 11.4 threat node mitigation)"
    - "5 skill stub SKILL.md files exist at skills/plan-feature-{decision,brainstorm,discuss,plan,persist}/SKILL.md with frontmatter (name + description + allowed-tools) + body (minimal mock output spec); these are documentation + Phase 3.3 dogfood replacement anchors, NOT consumed by runtime (dispatchSkillStub returns hardcoded mock per RESEARCH § 6.3)"
    - "workflows/plan-feature/workflow.yaml has workflow-level `on_veto: halt_workflow` (NOT per-phase per RESEARCH § 5.2 DRY); JINJA `{{ gstack_prefix }}` placeholder appears in phase 1 invokes field; passes TypeBox validate against src/workflow/schema/planFeature.ts schema AND against the W-02-extended src/workflow/schema/phases.ts PhasesSchema (loadPhases happy-path validate, T2.6 fixture 1 verified)"

    # Schema discipline — 9th + 10th surface single 兼容门 (CD-5)
    - "every new schema (config.v1 + governance.v1) goes through src/types/schemaVersion.ts SCHEMA_VERSIONS const + SchemaVersionLiteral Union (8 → 10 surface registered, sister Phase 3.1 W1 T1.1 8th surface 模式 double-add); every consume site (governance.ts readGovernance) uses branchOnSchemaVersion<T>() helper (NOT bare string compare); `grep -r 'branchOnSchemaVersion' src/` ≥ 4 references (Phase 3.1 baseline ≥ 3 + governance consumer +1)"

    # Karpathy hard limit (B-06/B-26) per-file ≤ 200L
    - "every NEW src/ file fits Karpathy hard limit ≤ 200L: probe-gstack.ts ≤ 50L (PRIMARY helper split to keep doctor.ts ≤ 200L), interpolate.ts ≤ 30L (D-02 spec), governance.ts ≤ 25L (D-04 spec), run.ts ≤ 80L (D-03 spec via dispatchSkillStub extract if needed; revised iter 1 draft ~78L after B-01 reorder + W-01 dead-var drop), schemas ≤ 30L each, phases.ts MODIFY ~51→~54L (W-02 +2L extension); doctor.ts MODIFY → 175+5 = 180L ≤ 200L Karpathy clean (no B-03 5% tolerance needed per RESEARCH § 12.3 verified)"

    # W0 backlog absorb — 3 项 one-shot 根治
    - "Wave 0 3 项 backlog 一次根治: W0.1 cli-audit.test.ts env-dep CI red fix Path A LOCKED (vi.mock audit-helpers + ~10-15L delta, RESEARCH § 8.3 fix recipe verbatim) → CI 3-OS green + 596+ → 596+ tests / 0 fail = Phase 3.2 first acceptance bar; W0.2 STATE.md per-phase shipped markers (11 line-start markers added per RESEARCH § 9.3) + README SSOT (README.md format 不动 + STATE.md 改, Option A) + ci.yml ENFORCE flip (delete L201 continue-on-error + ::warning → ::error + exit 1, Phase 3.1 W0.3 deferred #1 兑现); W0.3 schema decision record (9th+10th surface double-add config.v1 + governance.v1 NEW, RESEARCH § 4.1 + § 10.1 Option B locked, W-03 path divergence section added per planner-revision iter 1)"

    # ADR 0015 + ship
    - "ADR 0015 errata accepted 9 章节 (1 D-01 PROBE doctor 6th + 2 D-02 JINJA throw-on-missing zero-dep + 3 D-03 WIRED 5-phase 桩 + 4 D-04 PUSH lazy-read governance + 5 § 4 9th+10th surface double-add config+governance + 6 § 8 W0.1 cli-audit fix Path A + 7 § 9 W0.2 README SSOT + STATE.md markers + 8 § 10 .harnessed/ 双独立文件 + 9 § 12 4-wave W0-W3 topology); ADR 0001-0014 main body 0 diff verify (A7 守恒 iter 1-0014 → 1-0015 sister Phase 3.1 T5.4 pattern)"
    - "Phase 3.2 self-dogfood prefix matrix pass: 3 fixture e2e (gstack- mode / bare '' mode / both/neither fail-loud mode) all reach workflow.run.ts → 5 phase stub dispatch + checkpoint write per phase; baseline tag adr-0015-accepted + milestone tag v0.3.0-alpha.2-plan-feature pushed"

  artifacts:
    # W0 artifacts
    - path: "tests/unit/cli-audit.test.ts"
      provides: "W0.1 fix — adds vi.mock('../../src/cli/lib/audit-helpers.js') with 3 audit fn returning [] (Path A locked per RESEARCH § 8.3); 2 prior fail (L87 + L96) PASS post-fix; src/cli/audit.ts unchanged"
      contains: "audit-helpers"
    - path: ".github/workflows/ci.yml"
      provides: "W0.2 ENFORCE flip — delete L201 `continue-on-error: true` + change `::warning::README completeness drift` → `::error::` + add `exit 1` after drift detect (sister Phase 3.1 W0.3 deferred #1 兑现)"
    - path: ".planning/STATE.md"
      provides: "W0.2 — NEW section `## 已完成 phase ship 历史 (W0.2 — README sync SSOT)` with 11 line-start markers `- **Phase X.Y SHIPPED**` (Phase 1.1 → Phase 3.1) matching README L46-56 count; ci.yml grep statistic now equal both sides"
      contains: "已完成 phase ship 历史"
    - path: ".planning/phase-3.2/W0.3-schema-decision.md"
      provides: "W0.3 schemaVersion decision record (RESEARCH § 4.1 + § 10.1): NEW 9th `harnessed.config.v1` (D-01 gstack_prefix) + 10th `harnessed.governance.v1` (D-04 veto status) Option B locked (single-responsibility 双独立文件); cost 2×~25L schemas + 4L SCHEMA_VERSIONS extend + 4L SchemaVersionLiteral extend; W-03 planner-revision iter 1: 'Path divergence from PATTERNS.md' section added — documents schemas placed under src/workflow/schema/ (consumer colocation per sister phases.ts precedent) instead of PATTERNS.md § 2.4 indicative src/checkpoint/schema/ sketch"
      contains: "config.v1"

    # W1 artifacts — schemas + probe + interpolate + governance + doctor
    - path: "src/types/schemaVersion.ts"
      provides: "9th + 10th surface registered: config = 'harnessed.config.v1' + governance = 'harnessed.governance.v1' (sister Phase 3.1 W1 T1.1 8th surface double-add); SCHEMA_VERSIONS const + SchemaVersionLiteral Union both extended +2 entries each; branchOnSchemaVersion<T> helper unchanged signature"
      contains: "harnessed.governance.v1"
    - path: "src/workflow/schema/config.ts"
      provides: "TypeBox ConfigV1 schema (D-01 PROBE result store): schemaVersion literal + gstack_prefix Union(Literal('gstack-'), Literal('')) — only 2 valid values, malicious tamper rejected by Value.Check (RESEARCH § 11.4 threat node); Static<typeof> export"
      exports: ["ConfigV1", "ConfigV1Type"]
    - path: "src/workflow/schema/governance.ts"
      provides: "TypeBox GovernanceV1 schema (D-04 PUSH veto): schemaVersion literal + status Union('active','vetoed') + reason Optional(String maxLength 500) + vetoed_at Optional(String format date-time) + vetoed_by Optional(String maxLength 100); gstack 写 / harnessed 读"
      exports: ["GovernanceV1", "GovernanceV1Type", "GovernanceStatus"]
    - path: "src/cli/lib/probe-gstack.ts"
      provides: "PROBE helper (D-01 PRIMARY split per Karpathy ≤200L 守门 sister origin-check.ts pattern): `probeGstackPrefix(): ProbeResult {status, prefix?, detail, fix?}`; uses `process.platform === 'win32' ? 'where' : 'which'` cross-Win-shell pattern (sister checkJq L79-95); 4 状态 (gstack-only / bare-only pass / both ambiguous fail / neither missing fail with fix hints)"
      exports: ["probeGstackPrefix", "ProbeResult", "GstackPrefix"]
    - path: "src/cli/doctor.ts"
      provides: "MODIFY +5L — 6th `checkGstackPrefix` dispatch (sister `checkOriginUrl` L130-134 dynamic import + delegate pattern); results array push 6th check; description string updated to include 'gstack prefix'; FINAL 175 → ~180L ≤ 200L Karpathy hard limit clean (no B-03 tolerance needed)"
      contains: "checkGstackPrefix"
    - path: "src/workflow/interpolate.ts"
      provides: "JINJA interpolation (D-02 LOCKED, zero-dep, ≤30L per spec): `interpolate(template, vars): string` regex `/\\{\\{\\s*(\\w+)\\s*\\}\\}/g` replace callback; throws InterpolationError on undefined var (Karpathy fail-loud, RESEARCH § 3); InterpolationError class with template excerpt (前 80 char) for debug locality"
      exports: ["interpolate", "InterpolationError"]
    - path: "src/workflow/governance.ts"
      provides: "PUSH veto reader (D-04 LOCKED, sister checkpoint/state.ts L23-41 fail-soft read 直接 analog): `readGovernance(): Promise<GovernanceV1Type | null>` reads .harnessed/governance.json → branchOnSchemaVersion → Value.Check → fail-soft null on missing/corrupt/drift; `isVetoed(): Promise<boolean>` wrap returns status === 'vetoed' (false default)"
      exports: ["readGovernance", "isVetoed"]

    # W2 artifacts — workflow runner + plan-feature reference
    - path: "src/workflow/loadPhases.ts"
      provides: "MODIFY +5-8L — extend sig `loadPhases(yamlPath, vars?: Record<string, string>): PhasesSchemaType` (explicit dependency injection per planner decision, Karpathy testability); after Value.Check pass, walk parsed.phases; if vars provided AND phase has `invokes` field, replace with `interpolate(invokes, vars)`; backward-compat (vars omitted → no interpolate step)"
      contains: "interpolate"
    - path: "src/workflow/schema/phases.ts"
      provides: "MODIFY +4L — W-02 planner-revision iter 1 UNCONDITIONAL extension: PhaseEntry adds `invokes: Type.Optional(Type.String())` (JINJA placeholder field, interpolated at loadPhases) + PhasesSchema top-level adds `on_veto: Type.Optional(Type.String({pattern:'^halt_workflow$'}))` (workflow-level veto policy per RESEARCH § 5.2 DRY); ~51→~54L ≤ 80L sister Phase 3.1 W1 schemas pattern; backward-compat: both Optional → existing workflows/execute-task/phases.yaml unchanged; enables happy-path Value.Check pass for plan-feature/workflow.yaml (T2.6 fixture 1)"
      contains: "invokes"
    - path: "src/workflow/schema/planFeature.ts"
      provides: "TypeBox plan-feature DSL schema (RESEARCH § 5.3 Path A single-responsibility): top-level Object {workflow: String, on_veto: Optional(Literal('halt_workflow')), phases: Array(Object{id, name, upstream, model, invokes?, skills, max_iterations})}; sister execute-task/phases.yaml structure but with optional `invokes` field + workflow-level `on_veto`"
      exports: ["PlanFeatureWorkflowV1", "PlanFeatureWorkflowV1Type"]
    - path: "src/workflow/run.ts"
      provides: "Workflow runner (D-03 WIRED LOCKED, ≤80L per spec; **B-01 + W-01 planner-revision iter 1 applied**): `runWorkflow(yamlPath, vars): Promise<{status, phasesRun, lastPhaseId?}>` — loadPhases (interpolates {{var}} per T2.1) → for phase: activatePhase(ph.id) FIRST (B-01 reorder writes 'active' current-workflow.json) → lazy isVetoed() PUSH gate → if vetoed call statePause (transitions active→paused, consumable by Phase 3.1 resume.ts) + return paused-veto / else dispatchSkillStub (返 mock D-03 WIRED) → completePhase WITHOUT sessionId (W-01 dead-var dropped per sister Phase 3.1 W-04 BLOCKER lesson; sessionId propagation deferred Phase 3.3+ dogfood) using Phase 3.1 engineHook 二代 consumer"
      exports: ["runWorkflow", "WorkflowRunResult"]
    - path: "workflows/plan-feature/workflow.yaml"
      provides: "5-phase DSL (R7.1 reference, sister execute-task/phases.yaml 28L → ~40L): workflow:plan-feature + on_veto:halt_workflow workflow-level (RESEARCH § 5.2 DRY) + 5 phases (01-gstack-decision opus / 02-brainstorm sonnet / 03-gsd-discuss sonnet / 04-gsd-plan sonnet / 05-persist haiku); phase 1 `invokes: '{{ gstack_prefix }}office-hours'` JINJA placeholder (R7.4 acceptance verify); other phases optional invokes"
      contains: "{{ gstack_prefix }}"
    - path: "skills/plan-feature-decision/SKILL.md"
      provides: "Skill stub (D-03 WIRED, RESEARCH § 6.1 minimal 3-field mock pattern): frontmatter (name + description + allowed-tools) + body documenting Phase 3.3 dogfood replacement target; NOT consumed by runtime (dispatchSkillStub returns hardcoded mock)"
      contains: "plan-feature-decision"
    - path: "skills/plan-feature-brainstorm/SKILL.md"
      provides: "Skill stub for phase 02 (execution + ui-ux-pro-max UI scenarios)"
      contains: "plan-feature-brainstorm"
    - path: "skills/plan-feature-discuss/SKILL.md"
      provides: "Skill stub for phase 03 (gsd-discuss orchestration)"
      contains: "plan-feature-discuss"
    - path: "skills/plan-feature-plan/SKILL.md"
      provides: "Skill stub for phase 04 (gsd-plan orchestration)"
      contains: "plan-feature-plan"
    - path: "skills/plan-feature-persist/SKILL.md"
      provides: "Skill stub for phase 05 (planning-with-files MD persistence)"
      contains: "plan-feature-persist"

    # W3 artifacts — ADR + ship
    - path: "docs/adr/0015-gstack-probe-interpolate-plan-feature.md"
      provides: "Phase 3.2 ADR 9 章节 errata (sister Phase 3.1 ADR 0014 模式): Wave 0 sketch L1-50 → Wave 3 fill L51-150; covers D-01 PROBE / D-02 JINJA / D-03 WIRED / D-04 PUSH + § 4 9th+10th double-add + § 8 W0.1 Path A + § 9 W0.2 SSOT + § 10 .harnessed/ 双独立 + § 12 4-wave topology"
      contains: "## Context"
    - path: ".planning/RETROSPECTIVE.md"
      provides: "Phase 3.2 milestone retrospective entry — W0.1 cli-audit env-dep root-cause (Phase 2.4 W4 eager import sync miss) + W2 workflow runner 首消费者 Phase 3.1 engineHook 二代 consumer 闭环 + 3-prefix-matrix e2e dogfood lessons"
    - path: ".planning/ROADMAP.md"
      provides: "Phase 3.2 ✅ SHIPPED 2026-MM-DD marker + v0.3.0 2/4 进度 + Phase 3.3 (aliases.yaml + deprecation + known-good) 启动 prereq"

  key_links:
    - from: "src/cli/doctor.ts checkGstackPrefix action"
      to: "src/cli/lib/probe-gstack.ts probeGstackPrefix"
      via: "dynamic import + delegate (sister doctor.ts L130-134 checkOriginUrl pattern) — `const { probeGstackPrefix } = await import('./lib/probe-gstack.js')`"
      pattern: "import.*probe-gstack|probeGstackPrefix"
    - from: "src/cli/lib/probe-gstack.ts probeGstackPrefix"
      to: "spawnSync (where|which)"
      via: "`process.platform === 'win32' ? 'where' : 'which'` cross-Win-shell pattern (sister doctor.ts L80 checkJq direct analog)"
      pattern: "process\\.platform.*win32.*where.*which|spawnSync"
    - from: "src/workflow/run.ts runWorkflow"
      to: "src/workflow/governance.ts isVetoed"
      via: "lazy `await isVetoed()` call inside each phase iter AFTER activatePhase (B-01 planner-revision iter 1 reorder — ensures current-workflow.json 'active' state exists before veto-check; D-04 PUSH 1 read per phase, NOT polling timer per RESEARCH § 7.1)"
      pattern: "isVetoed\\(\\)|await isVetoed"
    - from: "src/workflow/run.ts runWorkflow veto branch"
      to: "src/checkpoint/state.ts pause (Phase 3.1 D-02 reuse)"
      via: "`await activatePhase(ph.id); if (await isVetoed()) { await statePause(); return {status:'paused-veto', phasesRun:i, lastPhaseId:ph.id} }` (B-01 reorder: activate writes 'active' state FIRST, statePause transitions active→paused per Phase 3.1 D-02 contract; pre-revision ordering caused early-return-null no-op on veto-at-i=0); Phase 3.1 engineHook 二代 consumer + D-02 KARPATHY 3-state reuse"
      pattern: "statePause|pause.*paused-veto"
    - from: "src/workflow/run.ts runWorkflow phase iter"
      to: "src/checkpoint/engineHook.ts activatePhase + completePhase"
      via: "Phase 3.1 W1 T1.x engineHook PRIMARY extract 二代 consumer; **WIRED mode (W-01 planner-revision iter 1)**: `await activatePhase(ph.id)` FIRST inside loop body (B-01 reorder) + `await completePhase({phaseId, status:'complete', lastTask})` after dispatchSkillStub — NO sessionId field passed (stub returns no sessionId per D-03 WIRED; sessionId propagation deferred Phase 3.3+ dogfood true spawn when SDK session_id surfaces from real spawn)"
      pattern: "activatePhase|completePhase.*phase"
    - from: "src/workflow/governance.ts readGovernance"
      to: ".harnessed/governance.json"
      via: "readFile + JSON.parse + branchOnSchemaVersion + Value.Check(GovernanceV1, parsed) — sister state.ts L23-41 fail-soft read pattern (null on missing/corrupt/drift)"
      pattern: "governance\\.json|Value\\.Check.*Governance"
    - from: "src/workflow/loadPhases.ts loadPhases"
      to: "src/workflow/interpolate.ts interpolate"
      via: "after Value.Check pass, walk parsed.phases; if vars provided AND phase.invokes truthy, `phase.invokes = interpolate(phase.invokes, vars)` per-phase replace"
      pattern: "interpolate\\(.*invokes|invokes.*interpolate"
    - from: "src/workflow/interpolate.ts interpolate"
      to: "throw InterpolationError"
      via: "regex `/\\{\\{\\s*(\\w+)\\s*\\}\\}/g` replace callback; `if (!(name in vars)) throw new InterpolationError(...)` Karpathy fail-loud (RESEARCH § 3)"
      pattern: "InterpolationError|throw.*Interpolation"
    - from: "src/types/schemaVersion.ts SCHEMA_VERSIONS"
      to: "src/workflow/schema/config.ts ConfigV1 + governance.ts GovernanceV1"
      via: "Type.Literal(SCHEMA_VERSIONS.config) + Type.Literal(SCHEMA_VERSIONS.governance) — single 兼容门 CD-5 (sister Phase 3.1 W1 T1.1 8th surface 模式 double-add)"
      pattern: "SCHEMA_VERSIONS\\.(config|governance)"
    - from: "workflows/plan-feature/workflow.yaml phase 1 invokes field"
      to: "src/workflow/loadPhases.ts JINJA interpolate"
      via: "yaml `invokes: '{{ gstack_prefix }}office-hours'` literal → loadPhases reads + interpolate(invokes, {gstack_prefix:'gstack-'}) → 'gstack-office-hours' resolved"
      pattern: "\\{\\{ gstack_prefix \\}\\}|invokes.*gstack_prefix"
    - from: "src/workflow/schema/phases.ts PhasesSchema (W-02 extended)"
      to: "src/workflow/loadPhases.ts Value.Check happy-path"
      via: "PhasesSchema adds `invokes?: string` to PhaseEntry + `on_veto?: 'halt_workflow'` to top-level unconditionally (W-02 planner-revision iter 1); without this extension, additionalProperties: false rejects plan-feature/workflow.yaml fields → PhasesValidationError throw → T2.6 fixture 1 fails. Backward-compat preserved (both Optional)."
      pattern: "invokes:|on_veto:"
---

<objective>
Phase 3.2 把 **v0.3.0 milestone 第 2 phase** (4 phase 中第 2, plan-feature reference 装配) 装配为 **gstack 命令前缀 doctor 6th check PROBE + workflow.yaml `invokes` JINJA 变量插值 + plan-feature 5-phase WIRED reference (governance gate + checkpoint engine 二代消费) + PUSH 文件 veto mechanism + W0 backlog 3 项一次根治**。

**核心 4 子功能** (D-01~D-04 + 3 项 W0):

1. **D-01 PROBE doctor 6th check** (R7.4) — `src/cli/doctor.ts` 加第 6 check `checkGstackPrefix` (~5L dispatch) + `src/cli/lib/probe-gstack.ts` (~40L PRIMARY helper, sister origin-check.ts 80L pattern); spawnSync `where`/`which` cross-Win-shell 探 `gstack-office-hours` + `office-hours` 三选一; 4 状态分支 (gstack-only pass / bare-only pass / both ambiguous fail-loud / neither missing fail-loud); 单一命中 → 自动写 `.harnessed/config.json {schemaVersion:'harnessed.config.v1', gstack_prefix:'gstack-'|''}` (TypeBox + 9th surface); `--json` flag CI-friendly 输出 (sister doctor L141-172 pattern)。

2. **D-02 JINJA `{{ var }}` 模板替换** (R7.4) — `src/workflow/interpolate.ts` (~25-30L, ≤30L spec) 纯 fn zero-dep regex `/\{\{\s*(\w+)\s*\}\}/g` replace callback; 未定义 var → throw `InterpolationError` (Karpathy fail-loud per RESEARCH § 3 行业 strict 推荐); `src/workflow/loadPhases.ts` extend sig `loadPhases(yamlPath, vars?)` (+5-8L, explicit dependency injection); **W-02 planner-revision iter 1**: `src/workflow/schema/phases.ts` UNCONDITIONAL +4L extend (add `invokes?: string` to PhaseEntry + `on_veto?: 'halt_workflow'` to PhasesSchema top-level) — Karpathy DRY: plan-feature workflow consumes same loader, extending parent schema cleaner than parallel; vars 来源 `.harnessed/config.json` `gstack_prefix` field; 6 unit fixture cover (happy / multi / undefined throw / empty string / nested throw / escape literal)。

3. **D-03 WIRED plan-feature 5-phase reference 实装** (R7.1) — `workflows/plan-feature/` NEW (workflow.yaml ~40L 5-phase DSL + 5 skill stub MD ~15L each) + `src/workflow/run.ts` (~78L workflow runner D-03 WIRED 中庸: 5 phase iter + dispatchSkillStub 返 mock + governance gate + checkpoint write per phase 用 Phase 3.1 engineHook 二代消费); 5 phase model_tier `[opus, sonnet, sonnet, sonnet, haiku]` (sister Phase 2.2 CD-2); workflow-level `on_veto:halt_workflow` (RESEARCH § 5.2 DRY); 5 phase stub 返 `{status:'ok', output:'<stub>', decision:'mock-approved'}` (Phase 3.3+ dogfood 时换真 spawn)。**B-01 + W-01 planner-revision iter 1 applied**: activatePhase BEFORE isVetoed (per-phase reorder fixes veto-at-i=0 scenario; statePause now finds valid 'active' state to transition to 'paused'); sessionId dead variable removed (sister Phase 3.1 W-04 BLOCKER lesson — WIRED stub returns no sessionId; Phase 3.3+ dogfood true spawn 时 sessionId propagation 加).

4. **D-04 PUSH governance.json veto mechanism** (R7.1) — `src/workflow/schema/governance.ts` (~25L TypeBox GovernanceV1, 10th surface) + `src/workflow/governance.ts` (~25L `readGovernance` sister state.ts L23-41 fail-soft + `isVetoed` wrap); `src/workflow/run.ts` 每 phase 转换前 1 行 lazy `if (await isVetoed()) { await statePause(); return paused-veto }` (NOT polling timer per D-04 + RESEARCH § 7 lazy read overhead ~10ms total 可忽略); gstack 写 governance.json 不在本 phase scope (gstack 自身职责; harnessed 只 reader)。

**W0 backlog 3 项 absorb** (沿袭 Phase 2.4 W0 5 项 + Phase 3.1 W0 4 项 cluster pattern):
- **W0.1 (必修 first task)**: `tests/unit/cli-audit.test.ts` env-dep CI red fix — Path A LOCKED per RESEARCH § 8.3 verbatim: vi.mock('../../src/cli/lib/audit-helpers.js', () => ({ auditOriginIntegrity:vi.fn(()=>[]), auditInstallCmdIntegrity:vi.fn(()=>[]), auditProvenance:vi.fn(()=>[]) })) — ~10-15L delta + src/cli/audit.ts 不动. **Acceptance**: local `corepack pnpm test -- --run tests/unit/cli-audit.test.ts` 0 fail + full suite 596+ pass / 0 fail + CI 3-OS green. **CI 3-OS green is first acceptance bar of Phase 3.2.**
- **W0.2 (Phase 3.1 W0.3 deferred #1 兑现)**: STATE.md per-phase shipped marker format normalize — Option A LOCKED per RESEARCH § 9.1: README format `- **Phase X.Y shipped** ✅` line-start 作 SSOT (visibility + grep-friendly), STATE.md 加 NEW section `## 已完成 phase ship 历史` with 11 line-start markers (Phase 1.1 → Phase 3.1) per RESEARCH § 9.3 verbatim; ci.yml L201 DELETE `continue-on-error: true` + change `::warning::` → `::error::` + add `exit 1` (ENFORCE flip); Phase 3.2 ship 后 STATE.md grep count = README count = 12 (11 历史 + Phase 3.2 new entry)。
- **W0.3 (Phase 3.2 own prereq schema 决议 record)**: `.planning/phase-3.2/W0.3-schema-decision.md` NEW ~30L docs — record 9th + 10th surface double-add 决策 per RESEARCH § 4.1 Option B + § 10.1 Option B: NEW `harnessed.config.v1` (D-01 gstack_prefix store) + NEW `harnessed.governance.v1` (D-04 veto status) 双独立文件 + single-responsibility (避免 race: gstack 写 governance 不动 harnessed config); 沿袭 Phase 3.1 W1 T1.1 7→8 surface sister precedent。**W-03 planner-revision iter 1**: 新加 "Path divergence from PATTERNS.md" section — documents schemas placed under `src/workflow/schema/` (consumer colocation per sister phases.ts precedent) instead of PATTERNS.md § 2.4 indicative `src/checkpoint/schema/` sketch (Karpathy-aligned, no move-to-checkpoint/ required).

**Wave 拓扑** (RESEARCH § 12 recommended 4-wave W0-W3, sister Phase 3.1 6 wave 缩 2 因 plan-feature WIRED scope 更小):

```
Wave 0 — backlog 3 项 absorb + test infra setup (并行 4 sub-tasks)
  ├─ T0.1 W0.1 cli-audit.test.ts Path A fix (FIRST TASK 必修, CI green = first acceptance bar)
  ├─ T0.2 W0.2 STATE.md 11 line-start markers + ci.yml ENFORCE flip
  ├─ T0.3 W0.3 .planning/phase-3.2/W0.3-schema-decision.md schema decision record (W-03 path divergence section added)
  └─ T0.4 tests/workflow/ + tests/workflow/schema/ + tests/integration/ dirs setup
       ↓
Wave 1 — schemas + probe + interpolate + governance + doctor 6th check
  ├─ T1.1 src/types/schemaVersion.ts MODIFY 8 → 10 surface (+4L double-add)
  ├─ T1.2 src/workflow/schema/config.ts NEW ~15L (D-01 ConfigV1)
  ├─ T1.3 src/workflow/schema/governance.ts NEW ~25L (D-04 GovernanceV1)
  ├─ T1.4 src/cli/lib/probe-gstack.ts NEW ~40L (D-01 PRIMARY helper, sister origin-check.ts)
  ├─ T1.5 src/cli/doctor.ts MODIFY +5L (6th check dispatch, 175 → 180L Karpathy clean)
  ├─ T1.6 src/workflow/interpolate.ts NEW ~25-30L (D-02 JINJA, zero-dep, throw on missing)
  ├─ T1.7 src/workflow/governance.ts NEW ~25L (D-04 lazy read, sister state.ts)
  └─ T1.8 tests Wave 1 (probe-gstack.test 5 fixture + interpolate.test 6 + schema/config.test 4 + schema/governance.test 4 + governance.test 4 = 23 fixture)
       ↓
Wave 2 — workflow runner + plan-feature reference + 5 skill stubs + loadPhases extend + integration
  ├─ T2.1 src/workflow/loadPhases.ts MODIFY +5-8L + src/workflow/schema/phases.ts MODIFY +4L (W-02 unconditional extend: invokes + on_veto Optional fields per planner-revision iter 1)
  ├─ T2.2 src/workflow/schema/planFeature.ts NEW ~30L (TypeBox plan-feature DSL)
  ├─ T2.3 src/workflow/run.ts NEW ~78L (D-03 WIRED + D-04 PUSH gate + Phase 3.1 engineHook 二代; B-01 activate-before-veto reorder + W-01 sessionId dead-var dropped per planner-revision iter 1)
  ├─ T2.4 workflows/plan-feature/workflow.yaml NEW ~40L (5-phase DSL + JINJA + on_veto)
  ├─ T2.5 skills/plan-feature-{decision,brainstorm,discuss,plan,persist}/SKILL.md NEW 5×15=75L
  └─ T2.6 tests Wave 2 (run.test 3 fixture + loadPhases-interpolate.test 3 + schema/planFeature.test 2 + integration/plan-feature-wired.test 3 fixture incl B-01 fixture 3 veto-at-i=0 per planner-revision iter 1 = 11 fixture)
       ↓
Wave 3 — e2e prefix matrix dogfood + ADR + STATE/RETRO/ROADMAP + ship + v0.3.0 alpha.2 close
  ├─ T3.1 tests/integration/plan-feature-prefix-e2e.test.ts NEW ~80L (3 prefix matrix fixture: gstack- / '' / both/neither fail-loud)
  ├─ T3.2 docs/adr/0015-gstack-probe-interpolate-plan-feature.md NEW 9 章节 finalize
  ├─ T3.3 .planning/STATE.md MODIFY 续编 Phase 3.2 SHIPPED entry (12th 历史 marker)
  ├─ T3.4 .planning/RETROSPECTIVE.md MODIFY Phase 3.2 milestone retro
  ├─ T3.5 .planning/ROADMAP.md MODIFY Phase 3.2 ✅ + v0.3.0 2/4 + Phase 3.3 prereq
  ├─ T3.6 A7 守恒 verify (`git diff adr-0014-accepted..HEAD -- docs/adr/000[1-9]-*.md docs/adr/001[0-4]-*.md | wc -l == 0`)
  └─ T3.7 baseline tag adr-0015-accepted + milestone tag v0.3.0-alpha.2-plan-feature push
```

**Purpose**: R7.1 (5-phase 流水 reference 30 plan-feature 场景跑通 + CEO veto halt_workflow) + R7.4 (gstack 命令前缀探测 + workflow `invokes` 变量插值 三种 prefix 场景任一跑通) + 3 项 W0 backlog cleanup + Phase 3.1 checkpoint engine 二代消费者闭环 + v0.3.0 milestone 第 2 phase ship。

**Output**: 4 Wave × 23 atomic task (per task_plan.md) + 单 ADR 0015 errata 9 章节 + `adr-0015-accepted` baseline tag + `v0.3.0-alpha.2-plan-feature` milestone tag。

> **R1+R2 critical findings absorbed** (5 项): (1) doctor.ts 175L baseline (NOT KICKOFF "215L" stale) — 加 6th check 175→180L ≤ 200L Karpathy clean, **不需要** split 既存 helper (RESEARCH § 1.4 实测 verified — orchestrator pre-planning decision #1 修正); (2) schemaVersion 9th + 10th surface double-add (RESEARCH § 10.1 Option B Karpathy single-responsibility 双独立文件); (3) W0.1 Path A locked verbatim (RESEARCH § 8.3 fix recipe, vi.mock audit-helpers ~10-15L delta, src/ 不动); (4) loadPhases sig change explicit vars 参数 (planner decision #4 explicit dependency injection over lazy-read, Karpathy testability); (5) Win shell flavor 沿袭 sister checkJq pattern `process.platform === 'win32' ? 'where' : 'which'` (RESEARCH § 1.1 Node cross-Win-shell 唯一稳路径)。

> **Planner-revision iter 1 (1 BLOCKER + 3 WARNING fixes applied)**:
> - **B-01 (BLOCKER)** — T2.3 run.ts veto ordering: activatePhase BEFORE isVetoed inside for-loop guarantees 'active' state exists for statePause to transition; +T2.6 fixture 3 (veto-at-i=0) added to test plan-feature-wired.test.ts with Phase 3.1 resume.ts integration assertion. Source: `.planning/phase-3.2/PLAN-CHECK.md` L66-96.
> - **W-01 (WARNING)** — T2.3 sessionId dead variable: dropped per sister Phase 3.1 W-04 BLOCKER lesson; engineCheckpointHook called without sessionId field in WIRED mode (D-03 stub returns no sessionId); Phase 3.3+ dogfood真 spawn 时 sessionId propagation 加. Must_haves L132 + key_link L184-186 wording updated accordingly. Source: `.planning/phase-3.2/PLAN-CHECK.md` L97-111.
> - **W-02 (WARNING)** — T2.1 PhaseEntry schema-extension gap: extended `src/workflow/schema/phases.ts` PhasesSchema UNCONDITIONALLY (added `invokes?: string` to PhaseEntry + `on_veto?: 'halt_workflow'` to PhasesSchema top-level); Karpathy DRY — plan-feature workflow consumes same loadPhases loader per CONTEXT D-03 WIRED + R2 § 5 yaml DSL recommendation; extending parent schema cleaner than parallel. ~51→~54L ≤ 80L. files_modified updated. Source: `.planning/phase-3.2/PLAN-CHECK.md` L113-132.
> - **W-03 (WARNING)** — PATTERNS.md § 2.4 schema path divergence: 1-line note added to W0.3-schema-decision.md ("Path divergence from PATTERNS.md" section) documenting colocation rule (schemas live under src/workflow/schema/ per sister phases.ts precedent; PATTERNS.md § 2.4 sketch at src/checkpoint/schema/ was indicative-of-pattern not literal-path; no schema move required). Source: `.planning/phase-3.2/PLAN-CHECK.md` L134-148.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/REQUIREMENTS.md
@.planning/phase-3.2/3.2-KICKOFF.md
@.planning/phase-3.2/3.2-CONTEXT.md
@.planning/phase-3.2/PATTERNS.md
@.planning/phase-3.2/RESEARCH.md
@.planning/phase-3.2/task_plan.md
@.planning/phase-3.2/PLAN-CHECK.md
@.planning/RETROSPECTIVE.md

# Frozen interface contracts (本 phase 消费 — Phase 3.1 ship 三件套)
@src/types/schemaVersion.ts
@src/cli/doctor.ts
@src/cli/lib/origin-check.ts
@src/workflow/loadPhases.ts
@src/workflow/schema/phases.ts
@src/checkpoint/state.ts
@src/checkpoint/engineHook.ts
@src/checkpoint/schema/checkpoint.v1.ts
@src/checkpoint/schema/currentWorkflow.v1.ts
@workflows/execute-task/phases.yaml
@tests/unit/cli-audit.test.ts
@tests/cli/doctor.test.ts

# Sister precedent (format gold-standard)
@.planning/phase-3.1/PLAN.md
@.planning/phase-3.1/task_plan.md
@.planning/phase-3.1/3.1-CONTEXT.md
</context>

<interfaces>
<!-- Key types/contracts the executor needs (extracted from codebase per planner-format) -->

From src/types/schemaVersion.ts (8 surface baseline; Phase 3.2 W1 加 9th + 10th):
```typescript
export const SCHEMA_VERSIONS = {
  routingSnapshot: 'harnessed.routing-snapshot.v1',
  handoffDoc: 'harnessed.handoff-doc.v1',
  phasesYaml: 'harnessed.phases-yaml.v1',
  manifestState: 'harnessed.manifest-state.v1',
  installerState: 'harnessed.installer-state.v1',
  routeDecisionLog: 'harnessed.route-decision-log.v1',
  checkpoint: 'harnessed.checkpoint.v1',
  currentWorkflow: 'harnessed.current-workflow.v1', // ← Phase 3.1 W1 T1.1 ADD 8th surface
  // Phase 3.2 W1 T1.1 ADD: config: 'harnessed.config.v1', governance: 'harnessed.governance.v1'
} as const

export function branchOnSchemaVersion<T>(
  v: string,
  handlers: { v1: () => T; unknown: () => T }
): T
```

From src/cli/doctor.ts L130-148 (sister `checkOriginUrl` dispatch pattern — direct analog for `checkGstackPrefix`):
```typescript
async function checkOriginUrl(): Promise<CheckResult> {
  const { checkOrigin } = await import('./lib/origin-check.js')
  const r = checkOrigin(process.cwd(), { allowFork: true })
  return { name: 'origin URL', status: r.status, message: r.detail, fix: r.fix }
}
// Phase 3.2 W1 T1.5 加 6th check:
async function checkGstackPrefix(): Promise<CheckResult> {
  const { probeGstackPrefix } = await import('./lib/probe-gstack.js')
  const r = probeGstackPrefix()
  return { name: 'gstack prefix', status: r.status, message: r.detail, fix: r.fix }
}
// L142-148 results array push 6th:
const results: CheckResult[] = [
  checkNodeVersion(), await checkMcpScope(), checkJq(), checkWinBash(),
  await checkOriginUrl(), await checkGstackPrefix(),  // ← Phase 3.2 W1 ADD
]
```

From src/cli/doctor.ts L79-95 (sister `checkJq` Win shell flavor pattern — direct analog for `probeGstackPrefix`):
```typescript
function checkJq(): CheckResult {
  const finder = process.platform === 'win32' ? 'where' : 'which'
  const r = spawnSync(finder, ['jq'], { encoding: 'utf8' })
  if (r.status === 0 && r.stdout.trim().length > 0) { /* pass */ }
  // ...fail branch with fix hint
}
```

From src/checkpoint/state.ts L23-41 + L65-75 (sister fail-soft read + pause/complete pattern — Phase 3.1 D-02 KARPATHY 3-state):
```typescript
export async function readCurrentWorkflow(): Promise<CurrentWorkflowV1Type | null> {
  // ... fail-soft pattern Phase 3.2 governance.ts readGovernance 直接复刻 ...
}
// CRITICAL CONTRACT (drives B-01 ordering): pause() early-returns null no-op
// if state missing — sister Phase 3.1 D-02 "pause is transition from active not
// from complete". B-01 fix: run.ts calls activatePhase BEFORE isVetoed so paused
// transition always has 'active' state to transition from.
export async function pause(): Promise<void> {
  const s = await readCurrentWorkflow()
  if (!s) return  // ← drives B-01 ordering requirement
  await writeCurrentWorkflow({ ...s, status: 'paused', paused_at: new Date().toISOString() })
}
export async function complete(): Promise<void> { /* status='complete' + completed_at */ }
```

From src/checkpoint/engineHook.ts L12-29 (Phase 3.1 PRIMARY extract — workflow.run.ts 二代消费者; W-01 hygiene: stale interface contract corrected per planner-revision iter 1):
```typescript
export interface EngineCheckpointHookCtx {
  phaseId: string
  sessionId?: string
  status: 'active' | 'complete' // ← actual Phase 3.1 surface; 'paused' goes through sigintTrap.ts (W4) NOT this hook
  lastTask?: string
  keyDecisions?: string[]
  canonicalRefs?: string[]
}
export async function activatePhase(phaseId: string): Promise<{ checkpointPath: string }> { ... }
export async function completePhase(ctx: EngineCheckpointHookCtx): Promise<void> { ... }
// W-01 (planner-revision iter 1): WIRED mode run.ts calls completePhase WITHOUT
// sessionId field (stub returns no sessionId per D-03); paused state in run.ts
// veto path is written via statePause() (Phase 3.1 D-02 reuse), NOT through this hook.
```

From src/workflow/loadPhases.ts L15-30 (sister custom error class + Value.Check pattern; Phase 3.2 W2 T2.1 extend sig):
```typescript
export class PhasesValidationError extends Error { ... }
export function loadPhases(yamlPath: string): PhasesSchemaType { ... }
// Phase 3.2 W2 T2.1 extend sig:
//   export function loadPhases(yamlPath: string, vars?: Record<string, string>): PhasesSchemaType
//   ... after Value.Check pass, walk parsed.phases; if vars && phase.invokes → phase.invokes = interpolate(phase.invokes, vars)
```

From src/workflow/schema/phases.ts L28-46 (Phase 2.2 baseline; W-02 planner-revision iter 1 UNCONDITIONAL extends here):
```typescript
// BASELINE (Phase 2.2 W3 verified):
export const PhaseEntry = Type.Object({
  id: Type.String({ minLength: 1 }),
  name: Type.String({ minLength: 1 }),
  upstream: Type.String({ minLength: 1 }),
  model: ModelTier,
  skills: Type.Optional(Type.Array(Type.String())),
  max_iterations: Type.Optional(Type.Integer({ minimum: 1, maximum: 100 })),
}, { additionalProperties: false })  // ← strict-reject baseline
export const PhasesSchema = Type.Object({
  workflow: Type.String({ minLength: 1 }),
  phases: Type.Array(PhaseEntry, { minItems: 1 }),
}, { additionalProperties: false })  // ← strict-reject baseline

// PHASE 3.2 W2 T2.1 EXTEND (W-02 planner-revision iter 1 UNCONDITIONAL):
// PhaseEntry add:
//   invokes: Type.Optional(Type.String()),  // JINJA placeholder, interpolated at loadPhases
// PhasesSchema top-level add:
//   on_veto: Type.Optional(Type.String({ pattern: '^halt_workflow$' })),  // workflow-level veto policy
// Both Optional → backward-compat: execute-task/phases.yaml unchanged.
// Reason for unconditional: plan-feature/workflow.yaml consumes same loadPhases loader
// per CONTEXT D-03 WIRED; without extension, additionalProperties: false rejects
// the new fields → PhasesValidationError throw → T2.6 fixture 1 fails.
```

From workflows/execute-task/phases.yaml L1-28 (sister DSL — Phase 3.2 W2 T2.4 plan-feature/workflow.yaml 沿袭):
```yaml
workflow: execute-task
phases:
  - id: 01-clarify
    name: ...
    upstream: ...
    model: opus
    skills: ['brainstorming']
    max_iterations: 5
  # ... 4-phase pattern; Phase 3.2 plan-feature 是 5-phase + 加 invokes + workflow-level on_veto
```

From tests/unit/cli-audit.test.ts L13-14 (W0.1 baseline mock — Phase 3.2 W0.1 加 audit-helpers vi.mock):
```typescript
vi.mock('node:fs/promises', () => ({ readdir: vi.fn(), readFile: vi.fn() }))
vi.mock('../../src/manifest/validate.js', () => ({ validateManifestFile: vi.fn() }))
// Phase 3.2 W0.1 ADD (Path A LOCKED per RESEARCH § 8.3):
// vi.mock('../../src/cli/lib/audit-helpers.js', () => ({
//   auditOriginIntegrity: vi.fn(() => []),
//   auditInstallCmdIntegrity: vi.fn(() => []),
//   auditProvenance: vi.fn(() => []),
// }))
```
</interfaces>

<tasks>

<!-- Each Wave delegates to atomic task_plan.md task IDs (T0.x / T1.x / T2.x / T3.x).
     task_plan.md contains <read_first> / <acceptance_criteria> / <action> with concrete values per task. -->

<task type="auto">
  <name>Wave 0 — Backlog 3 项 absorb (W0.1 first 必修)</name>
  <files>tests/unit/cli-audit.test.ts, .planning/STATE.md, .github/workflows/ci.yml, .planning/phase-3.2/W0.3-schema-decision.md, tests/workflow/, tests/workflow/schema/, tests/integration/</files>
  <action>Run T0.1 → T0.2 → T0.3 → T0.4 per task_plan.md (W0.1 first 必修, others may parallelize). **T0.1 W0.1 cli-audit fix Path A LOCKED** per RESEARCH § 8.3 verbatim — add 1 vi.mock block (`vi.mock('../../src/cli/lib/audit-helpers.js', () => ({ auditOriginIntegrity:vi.fn(()=>[]), auditInstallCmdIntegrity:vi.fn(()=>[]), auditProvenance:vi.fn(()=>[]) }))`) to tests/unit/cli-audit.test.ts after L14; ~10-15L delta total; src/cli/audit.ts 不动. **T0.2** add NEW section `## 已完成 phase ship 历史 (W0.2 — README sync SSOT)` to .planning/STATE.md with 11 line-start markers per RESEARCH § 9.3 verbatim (Phase 1.1 → Phase 3.1); modify .github/workflows/ci.yml L201 (DELETE `continue-on-error: true` + change `::warning::` → `::error::` + add `exit 1`); **T0.3** create .planning/phase-3.2/W0.3-schema-decision.md ~30L recording 9th + 10th surface double-add decision (Option B per RESEARCH § 4.1 + § 10.1 verbatim) + **W-03 planner-revision iter 1**: append "Path divergence from PATTERNS.md" section documenting colocation rule (schemas under workflow/schema/ per sister phases.ts precedent, not PATTERNS.md § 2.4 indicative checkpoint/schema/ sketch). **T0.4** mkdir -p test dirs (tests/workflow, tests/workflow/schema, tests/integration).</action>
  <verify>
    <automated>corepack pnpm test -- --run tests/unit/cli-audit.test.ts 2>&1 | tail -5 # 0 fail; corepack pnpm test 2>&1 | tail -10 # 596+ pass / 0 fail (CI 3-OS green = first acceptance bar); grep -cE "^[-*]?\s*\*?\*?Phase [1-9]\.[0-9]\*?\*?.*[Ss]hipped" .planning/STATE.md # ≥ 11; ! grep -E "continue-on-error: true" .github/workflows/ci.yml | grep -E "README completeness" # ENFORCE flip 验证; test -f .planning/phase-3.2/W0.3-schema-decision.md; grep -E "Path divergence from PATTERNS" .planning/phase-3.2/W0.3-schema-decision.md | wc -l # ≥ 1 (W-03 守门); [ -d tests/workflow/schema ] && [ -d tests/integration ]</automated>
  </verify>
  <done>cli-audit.test.ts 2 fail → 0 fail; full suite 596+ → 596+ pass / 0 fail; CI 3-OS green; STATE.md 11+ line-start markers; ci.yml ENFORCE flip; W0.3 decision record + W-03 path divergence section; test dirs ready for W1+W2 NEW fixture</done>
</task>

<task type="auto">
  <name>Wave 1 — Schemas (9th+10th surface) + probe + interpolate + governance + doctor 6th check</name>
  <files>src/types/schemaVersion.ts, src/workflow/schema/config.ts, src/workflow/schema/governance.ts, src/cli/lib/probe-gstack.ts, src/cli/doctor.ts, src/workflow/interpolate.ts, src/workflow/governance.ts, tests/cli/probe-gstack.test.ts, tests/workflow/interpolate.test.ts, tests/workflow/schema/governance.test.ts, tests/workflow/schema/config.test.ts, tests/workflow/governance.test.ts</files>
  <action>Run T1.1 → T1.8 per task_plan.md (T1.1 schemaVersion 8→10 surface 先 → T1.2/T1.3 schemas 并行 → T1.4 probe-gstack helper → T1.5 doctor 6th dispatch → T1.6 interpolate + T1.7 governance 并行 → T1.8 5 test files). **T1.1 sig**: SCHEMA_VERSIONS 加 `config: 'harnessed.config.v1'` + `governance: 'harnessed.governance.v1'`; SchemaVersionLiteral Union 加 2 Type.Literal; JSDoc comment block 加 surfaces 9-10 描述. **T1.4 probe-gstack.ts sig**: `export interface ProbeResult { status: 'pass'|'fail', prefix?: 'gstack-'|'', detail: string, fix?: string }`; `export function probeGstackPrefix(): ProbeResult`; cross-Win-shell `process.platform === 'win32' ? 'where' : 'which'` sister checkJq L80 直接 analog; 4 状态 (gstack-only / bare-only / both ambiguous fail-loud / neither missing fail-loud per RESEARCH § 1.4 message table verbatim). **T1.5 doctor.ts MODIFY**: 加 async `checkGstackPrefix()` dispatch (sister checkOriginUrl L130-134 pattern direct copy) + push 进 results array L147 之后; description string L139 加 'gstack prefix'; FINAL `wc -l src/cli/doctor.ts` ≤ 200 Karpathy clean. **T1.6 interpolate.ts**: regex `/\{\{\s*(\w+)\s*\}\}/g` + replace callback + `if (!(name in vars)) throw new InterpolationError(...)` per RESEARCH § 2.2 verbatim, `wc -l` ≤ 30. **T1.7 governance.ts**: `readGovernance` sister state.ts L23-41 fail-soft 直接复刻 + `isVetoed` 1-line wrap, `wc -l` ≤ 30.</action>
  <verify>
    <automated>grep -cE "harnessed\.\w+\.v1" src/types/schemaVersion.ts # ≥ 10 (8 → 10 double-add); corepack pnpm test -- --run tests/cli/probe-gstack.test.ts tests/workflow/ 2>&1 | tail -5 # all pass; wc -l src/cli/doctor.ts # ≤ 200; wc -l src/cli/lib/probe-gstack.ts # ≤ 50; wc -l src/workflow/interpolate.ts # ≤ 30; wc -l src/workflow/governance.ts # ≤ 30; grep -r "branchOnSchemaVersion" src/ | wc -l # ≥ 4 (Phase 3.1 baseline 3 + governance.ts +1); pnpm typecheck # 0 error</automated>
  </verify>
  <done>10-surface registered + ConfigV1 + GovernanceV1 schemas pass roundtrip; probeGstackPrefix 4 状态 unit test pass; doctor 6th check dispatch works (--json output includes 'gstack prefix' entry); interpolate 6 fixture pass (happy + multi + undefined throw + empty + nested throw + escape); governance 4 fixture pass (missing → null+active, active, vetoed, corrupt → null fail-soft); all NEW files ≤ Karpathy hard limit; typecheck clean</done>
</task>

<task type="auto">
  <name>Wave 2 — Workflow runner + plan-feature reference + 5 skill stubs + loadPhases extend + integration (B-01 + W-01 + W-02 planner-revision iter 1)</name>
  <files>src/workflow/loadPhases.ts, src/workflow/schema/phases.ts, src/workflow/schema/planFeature.ts, src/workflow/run.ts, workflows/plan-feature/workflow.yaml, skills/plan-feature-decision/SKILL.md, skills/plan-feature-brainstorm/SKILL.md, skills/plan-feature-discuss/SKILL.md, skills/plan-feature-plan/SKILL.md, skills/plan-feature-persist/SKILL.md, tests/workflow/run.test.ts, tests/workflow/loadPhases-interpolate.test.ts, tests/workflow/schema/planFeature.test.ts, tests/integration/plan-feature-wired.test.ts</files>
  <action>Run T2.1 → T2.6 per task_plan.md (T2.1 loadPhases + phases.ts unconditional extend → T2.2 planFeature schema → T2.3 workflow runner → T2.4 yaml → T2.5 5 skill stubs 并行 → T2.6 4 test files incl 11 fixture). **T2.1 loadPhases sig change + W-02 phases.ts unconditional extend**: `export function loadPhases(yamlPath: string, vars?: Record<string, string>): PhasesSchemaType`; after Value.Check pass, `if (vars) for (const ph of parsed.phases) if (ph.invokes) ph.invokes = interpolate(ph.invokes, vars)` (5-8L delta); AND extend `src/workflow/schema/phases.ts` UNCONDITIONALLY (W-02 planner-revision iter 1) — PhaseEntry add `invokes: Type.Optional(Type.String())` + PhasesSchema top-level add `on_veto: Type.Optional(Type.String({ pattern: '^halt_workflow$' }))` (~51→~54L ≤ 80L; both Optional → execute-task/phases.yaml backward-compat preserved). **T2.3 run.ts sig**: `export async function runWorkflow(yamlPath: string, vars: Record<string, string>): Promise<WorkflowRunResult>` where `WorkflowRunResult = {status: 'complete'|'paused-veto'|'failed', phasesRun: number, lastPhaseId?: string}`; for-each phase iter: **B-01 planner-revision iter 1 ORDERING — activatePhase BEFORE isVetoed**: `await activatePhase(ph.id)` FIRST (writes 'active' current-workflow.json) → lazy `if (await isVetoed()) { await statePause(); return paused-veto }` (statePause now finds valid 'active' state to transition to 'paused', consumable by Phase 3.1 resume.ts; covers veto-at-i=0 scenario) → `dispatchSkillStub(phase.skills[0])` returns `{status:'ok', output:'<stub for X>', decision:'mock-approved'}` (RESEARCH § 6.3 hardcoded mock) → `await completePhase({phaseId, status:'complete', lastTask})` **W-01 planner-revision iter 1 NO sessionId field passed** (dead var dropped — stub returns no sessionId per D-03 WIRED; sister Phase 3.1 W-04 BLOCKER lesson — eliminate at source; Phase 3.3+ dogfood真 spawn 时 sessionId propagation 加); `wc -l` ≤ 80 (~78L draft). **T2.4 yaml**: workflow:plan-feature + workflow-level `on_veto: halt_workflow` (NOT per-phase per RESEARCH § 5.2) + 5 phases (model_tier `[opus, sonnet, sonnet, sonnet, haiku]` per CD-2) + phase 1 `invokes: '{{ gstack_prefix }}office-hours'` JINJA placeholder. **T2.5 5 SKILL.md**: per RESEARCH § 6.1 frontmatter (name + description + allowed-tools:['Read','Edit','Bash']) + body mock spec ≤ 15L each. **T2.6 integration test**: 3 fixture e2e per RESEARCH § 11 + B-01 planner-revision iter 1 fixture 3: (1) 5 phase happy → 5 checkpoint entries + state.complete + W-02 Value.Check(PhasesSchema, parsedYaml) returns true; (2) veto at phase 2 → state.pause + halt + remaining phases 不执行; (3) **B-01 守门 veto-at-i=0**: pre-write `.harnessed/governance.json` {status:'vetoed', ...} + remove `.harnessed/current-workflow.json` + remove `.harnessed/checkpoints/` (clean slate); runWorkflow returns {status:'paused-veto', phasesRun:0, lastPhaseId:'01-gstack-decision'}; assert `readCurrentWorkflow()` returns valid paused state (status:'paused', phase:'01-gstack-decision', paused_at:<ISO>); assert Phase 3.1 `runResume()` from `src/checkpoint/resume.ts` returns resumeCtx where phase='01-gstack-decision' + status='paused' (R7.1 acceptance proof "checkpoint paused 保留" satisfied); dispatchSkillStub called 0 times (veto hit before dispatch).</action>
  <verify>
    <automated>corepack pnpm test -- --run tests/workflow/ tests/integration/plan-feature-wired.test.ts 2>&1 | tail -10 # all pass; wc -l src/workflow/run.ts # ≤ 80 (~78); wc -l src/workflow/loadPhases.ts # ≤ 40 (30 + 5-8L delta); wc -l src/workflow/schema/phases.ts # ≤ 80 (~51 + 2L W-02 extension = ~54L); grep -q "invokes" src/workflow/schema/phases.ts && grep -q "on_veto" src/workflow/schema/phases.ts # W-02 UNCONDITIONAL extension 守门; test -f workflows/plan-feature/workflow.yaml && grep -q "on_veto: halt_workflow" workflows/plan-feature/workflow.yaml; grep -q "{{ gstack_prefix }}" workflows/plan-feature/workflow.yaml; ls skills/plan-feature-*/SKILL.md | wc -l # == 5; awk '/await activatePhase\(ph\.id\)/{a=NR} /if \(await isVetoed\(\)\)/{v=NR} END{exit !(a>0 && v>0 && a<v)}' src/workflow/run.ts # B-01 ordering 守门 (activate BEFORE veto); ! grep -E "let sessionId" src/workflow/run.ts # W-01 dead var 守门; corepack pnpm test -- --run tests/integration/plan-feature-wired.test.ts 2>&1 | tail -5 | grep -E "Tests.*3 passed" # 3 fixtures pass (B-01 fixture 3 added); grep -E "runResume|resumeCtx" tests/integration/plan-feature-wired.test.ts | wc -l # ≥ 1 (B-01 resume proof 守门); corepack pnpm test 2>&1 | tail -10 # full suite green</automated>
  </verify>
  <done>runWorkflow 5-phase happy path completes + writes 5 checkpoints via engineHook 二代消费 + state.complete; **B-01 reorder**: veto at phase boundary triggers activatePhase-first + statePause + paused-veto status + phases skip + paused state consumable by Phase 3.1 resume.ts (fixture 3 veto-at-i=0 proves this); **W-01 sessionId dropped**: completePhase called without sessionId field per WIRED stub mode; **W-02 phases.ts unconditional extension**: PhasesSchema accepts plan-feature/workflow.yaml unconditionally (T2.6 fixture 1 Value.Check pass); loadPhases extended sig backward-compat (vars omitted → no interpolate); 5 SKILL.md stubs exist with frontmatter; plan-feature/workflow.yaml passes planFeature TypeBox schema AND extended PhasesSchema; all files ≤ Karpathy hard limit (run.ts ~78L, phases.ts ~54L)</done>
</task>

<task type="auto">
  <name>Wave 3 — E2E prefix matrix dogfood + ADR 0015 + STATE/RETRO/ROADMAP 续编 + A7 + ship tags</name>
  <files>tests/integration/plan-feature-prefix-e2e.test.ts, docs/adr/0015-gstack-probe-interpolate-plan-feature.md, .planning/STATE.md, .planning/RETROSPECTIVE.md, .planning/ROADMAP.md</files>
  <action>Run T3.1 → T3.7 per task_plan.md (sequential, ship cadence). **T3.1 e2e**: 3 fixture prefix matrix (gstack- only / bare '' only / both ambiguous fail-loud) — each fixture mocks spawnSync responses + writes .harnessed/config.json → loads workflows/plan-feature/workflow.yaml with interpolated vars → runs runWorkflow → asserts phase 1 invokes resolved correctly + workflow completes (gstack-/bare) OR doctor fails (both/neither). **T3.2 ADR 0015**: 9 章节 errata per Phase 3.1 ADR 0014 sister pattern (header + 1 D-01 PROBE doctor 6th + 2 D-02 JINJA throw-on-missing zero-dep + 3 D-03 WIRED 5-phase 桩 + 4 D-04 PUSH lazy-read governance + 5 § 4 9th+10th surface double-add + 6 § 8 W0.1 cli-audit Path A + 7 § 9 W0.2 README SSOT + 8 § 10 .harnessed/ 双独立 + 9 § 12 4-wave topology + footnote: planner-revision iter 1 B-01 reorder + W-01 dead-var + W-02 unconditional extend + W-03 path divergence absorbed). **T3.3 STATE.md**: append `- **Phase 3.2 SHIPPED** ✅ (2026-MM-DD) — gstack 前缀探测 + workflow 变量插值 + plan-feature 5-phase WIRED + governance PUSH veto` to existing W0.2 历史 section (12th entry); add event log entry. **T3.4 RETROSPECTIVE.md**: Phase 3.2 milestone retro entry (W0.1 cli-audit env-dep lesson + W2 workflow runner 二代消费 Phase 3.1 engineHook 闭环 + 3-prefix-matrix e2e dogfood lessons + planner-revision iter 1 B-01 activate-before-veto ordering insight + W-01 dead-var elimination at source). **T3.5 ROADMAP.md**: Phase 3.2 `✅ SHIPPED` marker + v0.3.0 2/4 进度 + Phase 3.3 prereq. **T3.6 A7**: `git diff adr-0014-accepted..HEAD -- docs/adr/000[1-9]-*.md docs/adr/001[0-4]-*.md | wc -l` == 0. **T3.7 tags**: `git tag adr-0015-accepted` + `git tag v0.3.0-alpha.2-plan-feature`.</action>
  <verify>
    <automated>corepack pnpm test -- --run tests/integration/plan-feature-prefix-e2e.test.ts 2>&1 | tail -5 # 3 fixture pass; test -f docs/adr/0015-gstack-probe-interpolate-plan-feature.md && wc -l docs/adr/0015-gstack-probe-interpolate-plan-feature.md # ≥ 100; git diff adr-0014-accepted..HEAD -- docs/adr/000[1-9]-*.md docs/adr/001[0-4]-*.md | wc -l # == 0 (A7 守恒); git tag --list | grep -E "adr-0015-accepted|v0\.3\.0-alpha\.2-plan-feature" | wc -l # == 2; grep -E "Phase 3\.2.*SHIPPED" .planning/STATE.md | wc -l # ≥ 1; grep -E "Phase 3\.2.*✅" .planning/ROADMAP.md | wc -l # ≥ 1</automated>
  </verify>
  <done>3-prefix-matrix e2e all pass (R7.4 acceptance "用户三种前缀场景任一都跑通" satisfied); ADR 0015 9 章节 finalized + A7 守恒 0 diff verified (sister Phase 3.1 T5.4 pattern); STATE.md/RETROSPECTIVE.md/ROADMAP.md 续编 (12th 历史 entry + Phase 3.2 ✅ + v0.3.0 2/4); adr-0015-accepted + v0.3.0-alpha.2-plan-feature tags pushed; Phase 3.2 SHIPPED</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| **gstack process → harnessed reader** | gstack writes `.harnessed/governance.json` (external untrusted-from-harnessed perspective); harnessed reads via TypeBox Value.Check + branchOnSchemaVersion fail-soft (D-04 lock) |
| **user PATH → doctor PROBE** | PROBE探测 `which`/`where` `gstack-office-hours` + `office-hours`; PATH 可被用户/installer 修改; PROBE 仅 detect 存在性 (sister doctor checkJq) |
| **user-editable `.harnessed/config.json`** | doctor writes `gstack_prefix`; user 可手动 edit (D-01 fallback for both/neither hits ambiguous case); TypeBox Union enforce only 2 valid values ('gstack-' \| '') |
| **workflow.yaml authored content → JINJA interpolate** | workflow.yaml 是 author-controlled (harnessed maintainer); JINJA `{{ var }}` 替换后是 spawn cmd 字面参数 (Phase 3.2 WIRED 不真 spawn; Phase 3.3+ dogfood 时 review) |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-3.2-01 | Tampering | `.harnessed/governance.json` malicious schemaVersion drift (e.g., `malicious.surface.v1`) | mitigate | branchOnSchemaVersion `unknown` branch → null → isVetoed false (graceful, no false halt per RESEARCH § 11.4) |
| T-3.2-02 | DoS | governance.json huge `reason` field memory exhaustion | mitigate | TypeBox `maxLength: 500` cap on reason + `maxLength: 100` on vetoed_by (§ 4.2) |
| T-3.2-03 | Tampering | Path traversal via fixed `.harnessed/governance.json` literal | accept | Fixed path literal in code (no user-controlled path); sister state.ts `.harnessed/current-workflow.json` pattern |
| T-3.2-04 | Injection | workflow.yaml `invokes: '{{ var }}; rm -rf /'` JINJA injection attempt | mitigate | vars 来自 `.harnessed/config.json` (TypeBox Union enforce only 2 literal values 'gstack-' / ''); 替换后字符串作 spawn cmd 字面参数, NOT shell (D-03 WIRED stub 不真 spawn 子进程; Phase 3.3+ dogfood 时 review) |
| T-3.2-05 | Injection | User manually tampers `.harnessed/config.json` `gstack_prefix: '$(rm -rf /)'` | mitigate | TypeBox `Type.Union([Type.Literal('gstack-'), Type.Literal('')])` 仅 2 合法值; tamper → Value.Check fail → readConfig null → fail-loud |
| T-3.2-06 | Repudiation | governance veto without audit trail | accept | gstack 自身 responsibility (vetoed_at + vetoed_by optional fields provide audit pointer; harnessed 仅 reader) |
| T-3.2-07 | Spoofing | Malicious user writes governance.json forced veto to halt others' workflow | accept | local .harnessed/ file = same-user trust boundary (no cross-user attack vector in single-developer scope); CI/multi-user → Phase 3.4+ evaluate |
| T-3.2-08 | Information Disclosure | doctor `--json` output exposes PATH binary locations | accept | PATH detection is intentional doctor health check (sister checkJq existing behavior); no secrets exposed |
</threat_model>

<verification>
**Phase-level verification gates (all must pass before T3.7 ship tags):**

1. **Full test suite green** (every Wave 内): `corepack pnpm test` → 596+ → ~640+ tests / 0 fail (Phase 3.1 baseline 596 + Phase 3.2 ~44 NEW fixture per RESEARCH § 11.1 target + planner-revision iter 1 B-01 fixture 3 +1 = ~44)
2. **CI 3-OS green** (W0.1 first acceptance bar): GitHub Actions all 3 OS (Linux/macOS/Win) green; tests/unit/cli-audit.test.ts 0 fail
3. **Karpathy hard limit per-file** (Wave 1+2 完成时): all NEW src/ files ≤ 200L (probe-gstack ≤ 50 + interpolate ≤ 30 + governance ≤ 30 + run ≤ 80 (~78 post-revision) + schemas ≤ 30 each); MODIFY doctor.ts ≤ 200 + loadPhases.ts ≤ 40 + phases.ts ≤ 80 (~54 post-W-02-extension)
4. **Schema discipline CD-5**: `grep -cE "harnessed\.\w+\.v1" src/types/schemaVersion.ts` ≥ 10 (8 → 10 surface); `grep -r "branchOnSchemaVersion" src/ | wc -l` ≥ 4 (Phase 3.1 baseline 3 + governance.ts consumer +1)
5. **Biome lint preempt** (project memory feedback_biome-preempt.md, 3 CI-red recurrences): `pnpm exec biome check --write` 每 commit 前本地必跑
6. **R7.4 acceptance** (3-prefix-matrix e2e): T3.1 3 fixture all pass (gstack- mode + bare mode + ambiguous fail-loud); doctor 6th check 4 状态 unit test pass
7. **R7.1 acceptance** (plan-feature 5-phase + CEO veto halt): T2.6 integration test 3 fixture pass (5-phase happy + veto at phase 2 halt + remaining phases skipped + **B-01 fixture 3 veto-at-i=0 + paused state consumable by Phase 3.1 resume.ts per planner-revision iter 1**)
8. **A7 ADR conservation** (T3.6): `git diff adr-0014-accepted..HEAD -- docs/adr/000[1-9]-*.md docs/adr/001[0-4]-*.md | wc -l` == 0 (only ADR 0015 NEW; 0014 不动)
9. **README completeness ENFORCE** (W0.2 兑现): post-T0.2 + T3.3 — `grep -cE "^[-*]?\s*\*?\*?Phase [1-9]\.[0-9]\*?\*?.*[Ss]hipped" .planning/STATE.md` == README.md count (12 = 11 历史 + Phase 3.2)
10. **Planner-revision iter 1 守门** (NEW): B-01 activatePhase-before-isVetoed ordering verified via `awk` line-order check on src/workflow/run.ts; W-01 `! grep "let sessionId"` dead-var守门; W-02 `grep -q "invokes" src/workflow/schema/phases.ts && grep -q "on_veto" src/workflow/schema/phases.ts` unconditional extension守门; W-03 `grep -E "Path divergence from PATTERNS" .planning/phase-3.2/W0.3-schema-decision.md` divergence note守门

**Per-task acceptance**: each task in task_plan.md carries grep-verifiable `<acceptance_criteria>` block; executor runs verify per task before commit.
</verification>

<success_criteria>
**Phase 3.2 SHIPPED criteria (all must hold):**

- [ ] Wave 0 W0.1 cli-audit.test.ts 2 fail → 0 fail; full suite + CI 3-OS green (first acceptance bar)
- [ ] Wave 0 W0.2 STATE.md 11+ line-start markers + ci.yml ENFORCE flip + Phase 3.1 deferred #1 兑现
- [ ] Wave 0 W0.3 schema decision record (9th + 10th surface double-add) + W-03 Path divergence section (planner-revision iter 1)
- [ ] Wave 1 doctor 6th check `gstack prefix` 4 状态 + --json + probe-gstack helper ≤ 50L + doctor.ts ≤ 200L
- [ ] Wave 1 interpolate JINJA 6 fixture pass (zero-dep + throw on missing) + governance lazy-read 4 fixture pass
- [ ] Wave 1 schemaVersion 8 → 10 surface (config.v1 + governance.v1 double-add) + `grep "branchOnSchemaVersion" src/` ≥ 4 references
- [ ] Wave 2 plan-feature/workflow.yaml 5-phase + JINJA `{{ gstack_prefix }}` placeholder + on_veto:halt_workflow workflow-level
- [ ] Wave 2 workflow runner ≤ 80L (~78L) runs 5-phase happy + governance veto halt + checkpoint write per phase (Phase 3.1 engineHook 二代消费); **B-01 activatePhase-BEFORE-isVetoed ordering verified** (planner-revision iter 1)
- [ ] Wave 2 **W-01 sessionId dead variable removed** from src/workflow/run.ts (planner-revision iter 1; sister Phase 3.1 W-04 BLOCKER lesson eliminate at source)
- [ ] Wave 2 **W-02 src/workflow/schema/phases.ts UNCONDITIONALLY extended** (`invokes?: string` + `on_veto?: 'halt_workflow'` Optional fields; ~51→~54L ≤ 80L; loadPhases happy-path validate passes for plan-feature/workflow.yaml per T2.6 fixture 1; planner-revision iter 1)
- [ ] Wave 2 5 skill stub SKILL.md files exist with frontmatter + body
- [ ] Wave 2 integration test 3 fixture pass (happy + veto at phase 2 halt + **B-01 fixture 3 veto-at-i=0 with Phase 3.1 resume.ts proof of paused state consumption** per planner-revision iter 1)
- [ ] Wave 3 prefix matrix e2e 3 fixture pass (R7.4 acceptance "用户三种前缀场景任一都跑通")
- [ ] Wave 3 ADR 0015 9 章节 + A7 守恒 0 diff (sister Phase 3.1 T5.4 pattern) + planner-revision iter 1 absorption footnote
- [ ] Wave 3 STATE.md (12th 历史 entry) + RETROSPECTIVE.md + ROADMAP.md 续编 Phase 3.2 ✅
- [ ] Wave 3 baseline tag `adr-0015-accepted` + milestone tag `v0.3.0-alpha.2-plan-feature` pushed
- [ ] v0.3.0 milestone 2/4 progress (Phase 3.1 + Phase 3.2 shipped; Phase 3.3 + Phase 3.4 pending)
</success_criteria>

<output>
After completion, create `.planning/phases/3.2-gstack-probe-interpolate-plan-feature/3.2-01-SUMMARY.md` (OR `.planning/phase-3.2/3.2-01-SUMMARY.md` matching project's actual phase-dir convention) per `$HOME/.claude/get-shit-done/templates/summary.md` template.

Summary must cover:
- Phase 3.2 D-01~D-04 lock implementation outcomes (PROBE / JINJA / WIRED / PUSH)
- 4 Wave × 23 atomic task ship cadence
- W0.1 cli-audit.test.ts fix Path A applied + CI 3-OS green achieved (first acceptance bar)
- W0.2 STATE.md README SSOT normalize + ci.yml ENFORCE flip (Phase 3.1 deferred #1 兑现)
- W0.3 schemaVersion 9th + 10th surface double-add (config.v1 + governance.v1) + W-03 Path divergence section
- Phase 3.1 engineHook 二代消费 闭环 (workflow.run.ts 首消费者外 plan-feature 是第二个 consumer)
- ADR 0015 9 章节 + A7 守恒 verify outcome
- 3-prefix-matrix e2e dogfood lessons (gstack- / '' / both/neither)
- Phase 3.3 prereq carry-forward (aliases.yaml + deprecation marker + known-good 版本)
- v0.3.0 2/4 milestone progress + remaining Phase 3.3 + Phase 3.4 scope
- **Planner-revision iter 1 absorption** (1 BLOCKER + 3 WARNING fixed): B-01 activate-before-veto reorder + T2.6 fixture 3; W-01 sessionId dead-var dropped at source; W-02 phases.ts unconditional Optional extension; W-03 PATTERNS path divergence documented
</output>
