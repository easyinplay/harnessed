# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [3.0.0] - 2026-05-21 — v3.0 4-Stage Namespace-Layered Workflow Architecture (BREAKING)

**升级一行指令**: `npm install -g harnessed@3.0 && harnessed setup --apply`

**Trigger**: v2.0.0 GA post-ship architectural smell (2026-05-20 user catch) — `/plan-feature` 5-phase conflates 5 layer (Strategic + Phase + Subtask + Plan + Persist);心法招式 + planning-with-files 实为 cross-cutting NOT phase;subagent + Agent Teams orthogonal 但未 1st-class;CLAUDE.md routing rules 散在 prose 未机器化。

**Decision** (Phase v3.0-3.1 2026-05-20): Pure ship v3.0 deprecate v2.0 (release-notes-only migration per D-04) + 4-stage namespace-layered architecture (M-01) + L0 Discipline Substrate (D-09) + L5b Execution Mechanism Layer (D-10) + rules-based routing (D-11) + D-13 superset commitment。

### BREAKING CHANGES

**Alias map** (v2 slash cmd → v3 equivalent):

| v2 (DROPPED) | v3 master | v3 sub equivalents |
|---|---|---|
| `/plan-feature` | `/plan` | `/plan-architecture` + `/plan-phase` |
| `/execute-task` | `/task` | `/task-clarify` + `/task-code` + `/task-test` + `/task-deliver` |
| `/verify-work` | `/verify` | `/verify-progress` + `/verify-code-review` + `/verify-paranoid` + `/verify-qa` + `/verify-security` + `/verify-design` + `/verify-simplify` + `/verify-multispec` |

- **`/plan-feature` DROPPED** → use `/plan` master OR `/plan-phase` sub
- **`/execute-task` DROPPED** → use `/task` master OR `/task-{clarify,code,test,deliver}` 4 sub
- **`/verify-work` DROPPED** → use `/verify` master OR `/verify-{progress,code-review,paranoid,qa,security,design,simplify,multispec}` 8 sub
- **Workflow schema v2 → v3** — NEW fields: `disciplines_applied: [karpathy, output-style, language, operational, priority, protocols]` (6 Literal Union) + `tools_available: [...]` (cross-validate ⊂ capabilities) + `delegates_to: [{sub, gate?, mode, order?}]` (master only) + phase-level `invokes_tools: [{if?, tool}]`
- **capabilities.yaml v3** — 39 v2 entry backfill `category` field + 44 NEW entry (6 behavioral discipline-ref + 33 gstack optional NO prefix + 2 supplementary + 1 gsd-research-phase + 2 alias suffix) → total 83 entry
- **End-user 影响**: `harnessed setup --apply` 重装 bundled v3 workflows;v2 SKILL.md dirs (`~/.claude/skills/{plan-feature,execute-task,verify-work}`) 不 auto-remove 仅 deprecation warn (K12 mitigation) — 可手动 `rm -rf` 清理

### Added — v3.0 24 workflow 4-stage namespace-layered + L0 Discipline Substrate + L5b Execution Mechanism

- **4 master orchestrator** NEW (Phase 3.5): `workflows/{discuss,plan,task,verify}/auto/` — auto gate-route + delegates_to declarative + `masterOrchestrator.ts` (197L Hybrid Option C 5-phase logic + Path A SDK default + Path B sub-shell fallback + K8 ctx single snapshot)
- **18 sub-workflow** NEW (Phase 3.4): 3 discuss (strategic + phase + subtask) + 2 plan (architecture + phase) + 4 task (clarify + code + test + deliver) + 8 verify (progress + code-review + paranoid + qa + security + design + simplify + multispec) + 1 retro standalone NEW + research v2→v3 schema bump
- **L0 Discipline Substrate** (Phase 3.3 W0.4): `workflows/disciplines/` NEW 6 yaml — karpathy (code-writing) + output-style (output) + language (output) + operational (commit) + priority (workflow) + protocols (workflow);`disciplineLoader.ts` (73L sister judgmentResolver pattern) + 4 hook helper (before-phase-execute + before-spawn + before-commit + after-output 各 ≤80L)
- **L5b Execution Mechanism Layer** (Phase 3.3 W0.3): `workflows/judgments/` 4 NEW yaml — web-design-routing + web-testing-routing + web-search-routing + stage-routing (12 trigger covering 4 master delegation)
- **Pattern A vs B Master spawn** LOCKED (Phase 3.5 W2.1 dogfood Cycle 4): Path A SDK recursive default + Path B sub-shell fallback when SDK error
- **3 NEW ADR**: 0030 namespace policy bare slash cmd + 0031 4-stage namespace-layered architecture + 0032 cross-cutting disciplines + execution mechanism + D-13 1:1 mapping

### Changed

- **workflow.yaml schema** harnessed.workflow.v2 → v3 (18 schema_version surface: 16 v2 + workflow.v3 + discipline.v1)
- **capabilities.ts** v1 in-place extend (discriminated union DisciplineCapabilityEntry vs ToolCapabilityEntry, additive Optional `category` per D-16 rule c, NOT bump)
- **phaseFactContext** 13 NEW field MIN scope (K3 mitigation, defer gstack optional 35 fires_when v3.x)
- **check-workflow-schema.mjs** extend 3 strict cross-validate contract (C1 tools_available + C2 disciplines_applied + C3 judgments invokes capability) + K9 master serial mode order invariant
- **setup-helpers.ts** nested 2-level scan + flat name flatten (`workflows/discuss/strategic/` → `discuss-strategic` bare slash) + v2 legacy deprecation warn block (K12 mitigation NOT auto-remove)
- **defaults.yaml** 36L → 103L extend ~26 NEW ralph_max_iterations entry (research v3 + retro 2 + discuss 4 + plan 3 + task 4 + verify 11)

### Tests

- **76 NEW fixture Phase 3.5** (22 masterOrchestrator + 14 hook + 40 dogfood 4-cycle × 10) sister Phase 2.5 46 fixture scope expanded
- **54 NEW fixture Phase 3.3** (schema-v3 10 + discipline 15 + capabilities 6 + phaseFactContext 5 + disciplineLoader 10 + hook helper 25 + cross-validate 14)
- **20 NEW fixture Phase 3.4** (schema-v3 10 + defaults 3 + setup-helpers nested 7)
- **R8.1 dogfood-first methodology proven** (sister Phase 2.5 uppercase OR/AND benchmark verbatim) — Phase 3.5 W2.1 Cycle 4 caught masterOrchestrator spawn order divergence (serial order=99 末尾被一次跑完违反 yaml intent) + inline fix split serialLeading + serialTrailing via PARALLEL_MID_ANCHOR=50 阈值
- Full suite 1087+ pass / 4 skip / 0 fail (was 900 baseline Phase 2.6, +150+ Phase 3.3-3.5 ship)

### Architecture Decisions (3 NEW ADR)

- **ADR 0030** [namespace policy bare slash cmd](docs/adr/0030-namespace-policy-bare-slash-cmd.md) — D-02 LOCK bare `/discuss-strategic` NOT `/discuss:strategic` NOT `/harnessed:discuss:strategic` (sister ADR 0009 v1.0.2 LOCK 沿袭)
- **ADR 0031** [4-stage namespace-layered architecture](docs/adr/0031-4-stage-namespace-layered-architecture.md) — M-01 + D-03 + D-07 LOCK;23 v3 workflow (4 master + 18 sub + 2 standalone) + 3 v2 legacy keep release-notes-only
- **ADR 0032** [cross-cutting disciplines and execution mechanism](docs/adr/0032-cross-cutting-disciplines-and-execution-mechanism.md) — D-05 + D-09 + D-10 + D-11 LOCK + D-13 superset 1:1 mapping table (CLAUDE.md 13 节 → L0 6 yaml + judgments 10 yaml + capabilities 83 entry + 20 workflow)

### Migration note

v2.0.0 / v2.0.1 用户升级:
```bash
npm install -g harnessed@3.0
harnessed setup --apply
# Optional: manually remove v2 skill dirs
rm -rf ~/.claude/skills/{plan-feature,execute-task,verify-work}
```

v2 SKILL.md dirs 不 auto-remove (K12 mitigation — `setup-helpers.ts` 仅 emit deprecation warn);v2 workflows/{plan-feature,execute-task,verify-work}/ in repo 保留 (legacy keep) per D-04 release-notes-only migration。

### Deferred to v3.x patch (拒绝清单 12 项, see PLAN.md L819-836)

- RX-3.1 余 11 mattpocock 全集 wire (12 高频已 ship, 余 v3.x)
- RX-3.2 47 phaseFactContext FULL field set (gstack optional 35 fires_when)
- RX-3.3 Cross-CC handoff Option B auto-hook
- RX-3.4 `scripts/check-discipline-drift.mjs` CLAUDE.md sync diff
- RX-3.5 Hierarchical 3-level slash cmd (取决于 Claude Code 平台 native)
- RX-3.6 Plugin version-check + update semantic (UX redesign)
- RX-3.7 Master orchestrator interactive mode toggle
- RX-3.8 `/retro` complex cross-milestone trend analysis
- RX-3.10 playwright-cli + webapp-testing reclass long-term evaluate
- RX-3.11 biome preempt user 主 session enforcement (Option B harness commit wrapper)
- RX-3.12 priority hierarchy pick-highest mode (token-saving arbitration)
- RX-3.9 gstack 30+ optional wrap 为 sub-workflow — **NEVER** per D-12 LOCK

## [2.0.1] - 2026-05-20 — backup path EPERM patch

### Fixed
- **P0 backup dir EPERM fix**: backup root migrated from `<process.cwd()>/.harnessed-backup/` → `<homedir()>/.harnessed/backups/`. User-reported v2.0.0 ship bug: `harnessed setup --apply` failed with `EPERM: operation not permitted, mkdir 'C:\Program Files\Warp\.harnessed-backup'` when user launched harness from Warp terminal (CWD = read-only `C:\Program Files\Warp\`). All MCP/plugin installs blocked because backup mkdir failure precedes idempotent skip check in `mcpStdioAdd.ts:122` (sister v1.0.4 idempotent contract bypassed at backup-fail). Fix migrates 4 file (`src/installers/lib/backup.ts` + `src/cli/{backup-list,gc,rollback}.ts`) to shared `getBackupRoot()` helper (new export from `backup.ts`).
- Side benefit: backup snapshots now persist across project directories (no per-project `.harnessed-backup/` folder pollution); `harnessed backup list` / `gc` / `rollback` 全部跨项目 shared snapshot pool。

### Changed
- `src/installers/lib/backup.ts`: NEW `getBackupRoot()` export (sister Phase 2.6 ADR 0024 capability abstraction single-source-of-truth pattern); `backup()` writer 用 homedir-based root NOT ctx.cwd
- `src/cli/backup-list.ts` + `src/cli/gc.ts` + `src/cli/rollback.ts`: import + 用 `getBackupRoot()` (3 file)

### Tests
- `tests/unit/installers-lib-backup.test.ts`: regex tighten `/.harnessed-backup/` → `/\.harnessed[/\\]backups/` (cross-platform path sep) + NEW v2.0.1 regression fixture (ctx.cwd = `C:\Program Files\Warp` should NOT appear in backup mkdir path)
- `tests/integration/installer-contract.test.ts`: same regex tighten — 7 installer × 1 fixture each (npm-cli + mcp-stdio-add + mcp-http-add + git-clone-with-setup + cc-plugin-marketplace + npx-skill-installer + cc-hook-add)
- Full suite 900 pass / 4 skip / 0 fail (was 899 baseline, +1 NEW regression fixture)

### Migration note
Existing v1.0.x / v2.0.0 users with `<project>/.harnessed-backup/` directories: new install uses `~/.harnessed/backups/` instead. Old per-project directories remain on disk (harmless artifact); manually delete if desired. No data migration needed — backup snapshots are reproducible from manifest install.

### Deferred (sister deferred-items v2.x backlog)
- **Plugin version-check + update semantic** (user feedback v2.0.0): non-MCP installer (e.g. gsd skills) currently install unconditionally OR skip-silent on existing dir; user expectation = version-check + update if newer available. Requires per-installer version-comparison logic (gstack via npm has version, GSD via git-clone has commit SHA, etc.) — defer to v2.1 minor patch (substantial UX redesign, sister ADR 0004 idempotent contract extension required).

## [2.0.0] - 2026-05-20 — v2.0 Architecture Refactor

**Trigger**: v1.0.0~v1.0.4 ship cycle 暴露 fundamental architectural flaw — workflow.yaml 是 build-artifact NOT runtime config; 上游 / Claude Code 平台 / 优秀新组件升级时调整需 1-2 day full npm release cycle (user catch 2026-05-22 post v1.0.4 ship)。

**Decision (user authorized 2026-05-22)**: 跳 v1.0.5 incremental → 直接 v2.0 大重构 + Pure bundled SoT mode + 完整三层栈方法论机器化 ship 给其他 user (per Phase v2.0-2.1 reframe 2026-05-20)。

### BREAKING CHANGES

升级一行指令: `npm install -g harnessed@2.0 && harnessed setup --apply`

- **workflow.yaml schema v1 → v2** — 全部 4 workflows (`plan-feature` / `execute-task` / `research` NEW / `verify-work` NEW) 升级 v2 schema; NEW fields: `schema_version: harnessed.workflow.v2` + `capability` (template interpolation) + `gate` (judgments 4-level ref) + `on[]` (conditional invoke) + `args` + `parallelism` + `fallback.max_iterations_exceeded`
- **End-user 影响**: Pure bundled mode — user 不 customize yaml, 升级 = `harnessed setup --apply` 重新装 bundled defaults (NO migrate CLI 需要 per D-05; user v1.x 没 custom yaml 可 migrate)
- **Maintainer 影响**: schema v1 PhasesSchema legacy 仍 supported (loadPhases.ts ifelse dispatch per Option A++); v2 path 主要走

### Added — 4 workflows 完整 4-stage 三层栈机器化

- `workflows/research/workflow.yaml` NEW (Stage ① Discuss 独立) — Tavily/Exa/ctx7 多源 fan-out + GSD discuss synth aggregate; sister ~/.claude/rules/web-search.md + context7.md routing 机器化 (R20.7)
- `workflows/verify-work/workflow.yaml` NEW (Stage ④ Verify 9-phase) — gsd-verify-work + gsd-progress + code-review (并行) + gstack /review (关键模块强制) + 可选 /qa /cso /design-review + code-simplifier + 4-specialist Agent Team Pattern C 升级 conditional; sister CLAUDE.md Stage ④ verbatim 机器化 (R20.12)
- `workflows/plan-feature/workflow.yaml` v2 — planning-with-files Claude Code plugin slash cmd `/plan` 真接 (Q-AUDIT-5a reframe; NOT npm SDK)
- `workflows/execute-task/phases.yaml` v2 — ralph-loop completion-promise 真接 + tdd-gate conditional + mattpocock route by condition (R20.10 + R20.13 + R20.8)

### Added — Capability + Judgment SoT 机器化

- `workflows/capabilities.yaml` NEW 39 entry flat yaml map (D-02) — mattpocock 11 + special-purpose 13 + gstack 6 + core 4 + agent-teams 3 + gsd 2
- `workflows/judgments/` NEW 6 file rule-style 分类 (D-04 + D-16) — strategic-gate / phase-gate / subtask-gate / parallelism-gate / tdd-gate / fallback
- `workflows/defaults.yaml` NEW ralph_max_iterations 4 workflow × 14 entry + hard_upper_limit 100
- 6 NEW src lib file: `exprBuilder.ts` (expr-eval Parser singleton) / `judgmentResolver.ts` (4-level ref dispatch) / `checkAgentTeams.ts` (Q-AUDIT-5b root-level env probe) / `fallbackHandlers.ts` (R20.10 explicit halt path) / `check-agent-teams-doctor.ts` (doctor wrapper) / `check-planning-with-files.ts` (doctor wrapper + real probe v2.34.0)
- 4 NEW TypeBox schema surface (workflow.v2 + capabilities.v1 + judgment.v1 + defaults.v1)

### Added — Three-layer-stack methodology ship

v2.0 reframe (2026-05-20): 项目最终目的 = maintainer 三层栈方法论 ship 给其他 user via bundled defaults (NOT parse 其他 user CLAUDE.md)。其他 user `npm install -g harnessed@2.0` + `harnessed setup --apply` 后立即享用 maintainer 三层栈完整流程, 无需自己写 CLAUDE.md prose。

- 4-stage CLAUDE.md cadence 完整机器化: Discuss research + Plan plan-feature + Execute execute-task + Verify verify-work
- 16 D-decision + 3 Q-AUDIT-5 schema fix LOCKED + 实装 (Phase v2.0-2.1 discuss-phase)
- Pattern A 全栈三路 Agent Teams 升级 first-use validated (Phase v2.0-2.4 W1 `phase24-w1-execute-team` 3 teammate + 4 SendMessage round-trip + 2 architectural arbitration)
- Pattern C 多维度 4-specialist verify-work 升级 conditional (sister ~/.claude/rules/agent-teams.md L52)

### Added — Dogfood-first methodology proven (R8.1)

- 46 NEW dogfood fixture across 5 cycle: parallelism-gate + Agent Teams (5) / verify-work 9-phase + Pattern C (6) / TDD + planning-with-files + ralph-loop (20) / mattpocock + special-purpose + fallback 3 铁律 (15)
- 1 production bug caught via dogfood-first (NOT pass-by schema-shape regex test): 3 处 uppercase OR/AND in workflow.yaml runtime fail (expr-eval 2.0.2 case-sensitive) — fixed inline
- 13/15 active R20.x inline dogfood-verified (R20.5 + R20.9 operational deferred ship verification)
- `tests/dogfood/` NEW directory 4 file 46 fixture

### Added — Doctor MIN 8→10

- `harnessed doctor` 新增 2 check: Agent Teams env (root-level `env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS == "1"` per Q-AUDIT-5b schema fix) + planning-with-files plugin presence (real probe `~/.claude/plugins/cache/planning-with-files/planning-with-files/<version>/` v2.34.0 verified ≥ 2.2.0)
- 2 NEW helper sister probe-gstack.ts pattern: `check-agent-teams-doctor.ts` (34L) + `check-planning-with-files.ts` (58L)

### Changed — Karpathy ≤200L hard limit cleanup (CK deferred resolved)

- `src/cli/setup.ts` 235L → 139L via split helper `src/cli/lib/setup-helpers.ts` NEW 128L (3 helper)
- sister Phase 3.4 W1 doctor.ts inline shrink pattern follow

### Fixed — Q-AUDIT-5 post-LOCK schema corrections

- **Q-AUDIT-5a**: planning-with-files SDK → plugin terminology drift fix — capabilities.yaml entry impl=claude-code-plugin (NOT npm-sdk) + workflow.yaml 05-persist `invokes: '/plan'` literal
- **Q-AUDIT-5b**: Agent Teams settings.json schema fix — root-level `env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` (NOT nested `experimental.*`); applied **before** v2.0 GA ship (0 user impact)
- **Q-AUDIT-5c**: judgments/ multi-file 缺 judgmentResolver.ts → ship NEW 98L resolver + 12 fixture
- **NS resolved**: capabilities.yaml add gsd-discuss-phase + gsd-plan-phase entries (37→39 entry)

### Removed

- R20.6 manifest user-dir hot-reload — DROPPED per Q-AUDIT-1 Q5b (Pure bundled mode supersede)

### ADR

ADR 0024-0029 全 6 NEW (backfill per ADR 0011 9-section pattern); ci.yml A7 step iter 0023→0029 sister F26 + Phase 5.2 W2 T2.7 pattern。

### Verification metrics

- Full test suite: **899 pass / 4 skip / 0 fail** (123 file pass + 1 skipped)
- biome check: clean across all 52+ touched file
- pnpm exec tsc --noEmit: 0 error
- node scripts/check-workflow-schema.mjs: exit 0 (workflow.v2 validated=4)
- Triple LOCAL tag: `v2.0.0-alpha.0-schema` (Phase 2.3) + `v2.0.0-alpha.1-workflows` (Phase 2.4) + `v2.0.0-rc.1` (Phase 2.5) + `v2.0.0` (Phase 2.6 close, GA target)

## [1.0.4] - 2026-05-20

### Fixed
- MCP installer idempotent semantic — already-existing MCP servers (exit=1 + "already exists in .mcp.json" stderr) are no longer reported as failures; they return `ok: true, alreadyInstalled: true` per ADR 0004 contract (user v1.0.3 ship feedback: chrome-devtools-mcp / exa-mcp / tavily-mcp showing `[B] failed` on repeat `harnessed setup`)

### Changed
- `src/cli/install-base.ts` + `src/cli/setup.ts` Step B output now uses 4-category format: `installed / already-installed / skipped / failed`; already-installed items print `[B] already-installed <name> — run /mcp in Claude Code to verify connection` instead of `[B] failed`
- `src/installers/lib/types.ts` — `InstallResult` union extended with `{ ok: true; alreadyInstalled: true; backupId: string }` discriminant (ADR 0004 idempotent sub-state of success)

### Added
- Post-setup hint message: "MCP servers configured. Run `/mcp` in Claude Code to verify each server's connection status. If a server shows disconnected, restart Claude Code or check the MCP command spec." — shown when any MCP server is installed or already-installed

## [1.0.3] - 2026-05-20

### Performance
- `harnessed setup` Step B (install-base auto-glob) serial → parallel via `Promise.allSettled` (~75% speedup; 16 manifests 30-50 sec → 5-10 sec total; user feedback v1.0.2 ship)

### Changed
- `src/cli/setup.ts` Step B — replaced serial for-loop with `Promise.allSettled` concurrent manifest install; per-manifest error isolation (allSettled never short-circuits); timing logged in summary line (`[parallel X.Xs]`)

## [1.0.2] - 2026-05-20

### Added
- `workflows/plan-feature/SKILL.md` NEW — Claude Code slash command `/plan-feature` now available after `harnessed setup` (Gap B fix; previously only `workflow.yaml` existed, CC could not load the slash command)

### Changed
- `harnessed setup` default behavior — now executes immediately (one-shot onboarding for non-expert users); `--dry-run` flag opt-in for advanced preview (previously dry-run was the default, `--apply` was required)
- `harnessed setup` now chains `install-base` auto-glob after workflow skill copy (Step A: copy SKILL.md dirs → Step B: install all `manifests/{tools,skill-packs}/*.yaml`); single command installs complete three-layer-stack profile

### Fixed
- README + `docs/WORKFLOW.md` namespace claim — `/harnessed:plan-feature` → `/plan-feature` to align with actual `SKILL.md` `name:` field (Gap A fix; Claude Code loads bare names, not namespaced)

## [1.0.1] - 2026-05-22

### Fixed
- `install.ts` — manifest path resolution via `getPackageRoot()` instead of `process.cwd()` (global install users now work)
- `install-base.ts` — `listBaseManifests` root via `getPackageRoot()` instead of `process.cwd()`
- `uninstall.ts` — manifest path resolution via `getPackageRoot()` instead of `process.cwd()`

### Added
- `harnessed setup` — new one-time onboarding command; copies `workflows/*/SKILL.md` directories to `~/.claude/skills/<name>/` (dry-run by default, `--apply` to execute); fixes critical gap where README documented `setup` but command was never implemented
- `src/cli/lib/packagePath.ts` — `getPackageRoot()` helper; single source of truth for package root resolution via `import.meta.url` (bundler-safe ESM)
- 8 new tests (764 total): `packagePath` 3 cells + `setup` 5 cells

## [1.0.0] - 2026-05-22

### Added
- Released to npm registry — `npm install harnessed` or `npx harnessed@latest setup` now live
- `.github/workflows/publish.yml` — tag-triggered OIDC trusted publishing + sigstore provenance (ADR 0023)
- ADR 0023 — Phase 6.1 npm publish release process (OIDC trusted publishing + sigstore provenance architecture)
- 21 phases complete (20/20 pre-GA + Phase 6.1 GA ship) — 23 ADRs (0001-0023)
- 756 tests stable (CI 3-OS green: ubuntu / macOS / Windows native)

### Changed
- `package.json` — `private: true` removed + version `0.3.0` → `1.0.0` + `author` field added (D-05)
- `README.md` badge — pre-launch status badge replaced with npm version shield (auto-tracks; D-03)
- `README.md` Status section — v1.0 GA SHIPPED 2026-05-22; npm publish stream live; maintenance-only mode forward
- `.planning/ROADMAP.md` — Phase 6.1 row → 🎯 SHIPPED; v1.0+ Maintenance-Only Mode forward outline added (D-07)
- `docs/MAINTAINER-ONBOARDING.md` — post-v1.0 forward visibility NOTE added (D-08)
- `.github/workflows/ci.yml` — A7 step iter 0022→0023 (ADR 0023 baseline tag verify)

### Note
- 6-month co-maintainer organic clock opened 2026-05-22 (closes ~2026-11 per ADR 0020 D-04 HYBRID 2-clock)
- Post-clock decision: maintenance-only mode if no co-maintainer recruited; continued active if recruited + healthy
- Forward visibility (not negative-framing): see ROADMAP.md § v1.0+ and MAINTAINER-ONBOARDING.md § Post-v1.0

## [0.5.0] - 2026-05-22

### Added
- R10.1 `harnessed audit-log` CLI subcommand — `--filter <jq-expr>` + dual format + 3 pagination flags (ADR 0021 D-01~D-04)
- R10.2 `src/checkpoint/state.ts` LockHeldError + `withLock<T>()` — `proper-lockfile@4.1.2` concurrent write lock (ADR 0021 D-05~D-08)
- R10.3 `harnessed uninstall <name>` CLI subcommand — 14th subcommand, dry-run default (ADR 0022 D-01~D-07)
- R10.4 `src/manifest/lib/path-guard.ts` — 5 OWASP A1 vectors pre-compiled RegExp + `PathTraversalError` (ADR 0022 D-03/D-04/D-08)
- v0.5.0 milestone archive triplet — `.planning/milestones/v0.5.0-{ROADMAP,REQUIREMENTS,MILESTONE-AUDIT}.md`
- ROADMAP.md v1.0 chapter NEW — 9 GA criteria + Phase 6.1 outline + scope freeze guard (D-03 v1.0ChapterTiming)

### Changed
- `scripts/check-state-archive-stale.mjs` — SIZE_LIMIT 200→175→165→150 progressive tightening (4 rounds: Phase 4.3 RELAX + Phase 5.1 FLIP + Phase 5.2 FLIP + Phase 5.3 DEFER)
- `.planning/STATE.md` — D2 cadence iter 5+6+7 GRADUATION; Phase 5.1+5.2 narratives archived to RETROSPECTIVE.md
- ADR family 0017→0022 (ADR 0021+0022 NEW across v0.5.0)

### Fixed
- `.github/workflows/ci.yml` — A7 step retroactive iter 0018→0021 (ADR 0019+0020 retroactive fix; Phase 5.1)
- `.github/workflows/ci.yml` — A7 step iter 0021→0022 (Phase 5.2)

## [0.5.0-alpha.2] - 2026-05-19

### Added
- `harnessed uninstall <name>` CLI subcommand — 14th subcommand, dry-run default (R10.3; ADR 0022 D-01 through D-07)
- `src/cli/uninstall.ts` — 115L uninstall CLI register (D-05 --dry-run default + D-06 --yes bypass + D-07 NO --keep-backup)
- `src/uninstallers/` — 7 per-method uninstallers symmetric inverse of `src/installers/` (npmCli / mcpStdioAdd / mcpHttpAdd / ccPluginMarketplace / gitCloneWithSetup / npxSkillInstaller / ccHookAdd)
- `src/manifest/lib/path-guard.ts` — NEW 36L path traversal guard: 5 OWASP A1 vectors pre-compiled RegExp + `PathTraversalError` D-08 + `checkPathSafe()` (R10.4; ADR 0022 D-03/D-04/D-08)
- `src/cli/lib/validateFlags.ts` — NEW 27L extract: `validateNonInteractiveFlags()` dedup 5-site H1 gate (W0 #BH absorb)
- `src/uninstallers/lib/runOrPreview.ts` — NEW dry-run gate helper for uninstaller dispatch (W0 #BI absorb)
- ADR 0022 — Phase 5.2 R10.3 uninstall + R10.4 path traversal hardening (9-section format sister ADR 0021延袭)
- `tests/manifest/lib/path-guard.test.ts` — 9 TDD cells (5 OWASP A1 vectors + D-08 safe-message + 3 negative controls)
- `tests/cli/uninstall.test.ts` — 14 TDD cells (7-method dispatch + ephemeral + --yes + --apply matrix)

### Changed
- `src/manifest/aliases.ts` `resolveAlias()` — +`checkPathSafe(name)` R10.4 D-04 site 1 (guard before yaml lookup)
- `src/cli/install.ts` — +`checkPathSafe(resolvedName)` R10.4 D-04 site 2 (alias redirect defense-in-depth)
- `src/cli/uninstall.ts` — +`checkPathSafe(resolvedName)` R10.4 D-04 site 2 (symmetric install.ts hardening)
- `scripts/check-state-archive-stale.mjs` — SIZE_LIMIT 165→150 round 3 FLIP (W0 #BA resolve; 15L headroom)
- `.github/workflows/ci.yml` — A7 step iter ADR 0001-0021 → ADR 0001-0022 single extend (NOT retroactive)
- `src/cli/install.ts` + `install-base.ts` + `research.ts` + `manifest-add.ts` + `execute-task.ts` — H1 gate replaced with `validateNonInteractiveFlags()` import (#BH dedup)
- `.planning/STATE.md` — D2 cadence iter 6 REINFORCE: Phase 5.1 narrative archived (141L ≤150L PASS)

## [0.5.0-alpha.1] - 2026-05-19

### Added
- `harnessed audit-log` CLI subcommand — 13th subcommand, `--filter <jq-expr>` + dual format + 3 pagination flags (R10.1; ADR 0021 D-01 through D-04)
- `src/cli/audit-log.ts` — 162L audit log consumer (D-01 jq subprocess + D-04 5-pattern redact + D-02 dual format)
- `src/checkpoint/state.ts` LockHeldError + `withLock<T>()` + `writeCurrentWorkflow` wrap — proper-lockfile dir-level concurrent write lock (R10.2; ADR 0021 D-05 through D-08)
- `proper-lockfile@4.1.2` runtime dependency — MIT, 5M weekly downloads, cross-OS
- `src/cli/status.ts` — lockfile.check + mtime + STALE indicator (D-07 lock holder display)
- ADR 0021 — Phase 5.1 R10.2 state lock + R10.1 audit consumer (9-section format)
- `src/installers/lib/runClaudeArgs.ts` — reusable CC CLI spawn helper extract (W0 #BF absorb)
- `src/installers/lib/err.ts` — reusable error constructor helper extract (W0 #BG absorb)

### Changed
- `.github/workflows/ci.yml` — A7 step retroactive iter 0018→0021 (ADR 0019+0020 retroactive fix)
- `scripts/check-state-archive-stale.mjs` — SIZE_LIMIT 175→165 round 2 (W0 #BA Phase 5.1 resolve)

## [0.4.0] - 2026-05-19

### Added
- Routing audit log (`.harnessed/audit.log`) — JSONL append-only, 12-field schema, forward-only (R8.1)
- `src/audit/log.ts` — JSONL append-only writer + AuditRecordSchema TypeBox (D-01)
- `src/audit/hook.ts` — thin engine integration wrapper (5th PRIMARY helper family member)
- ADR 0018 — routing audit log architecture (Phase 4.3 PRIMARY)
- ADR 0019 — STATE dual-SoT 5-recurrence terminus COLLAPSE pattern (Phase 3.3 backfill)
- ADR 0020 — HYBRID 2-clock disambiguation pattern (Phase 4.2 backfill)
- `CHANGELOG.md` (this file) — Keep-a-Changelog format
- v0.4.0 milestone archive triplet — `.planning/milestones/v0.4.0-{ROADMAP,REQUIREMENTS,MILESTONE-AUDIT}.md`
- `docs/MAINTAINER-ONBOARDING.md` expanded — 50L → 111L additive (Phase 4.2; R8.2)
- `.github/workflows/stale.yml` — 60-day mark + 90-day close on issue+PR (Phase 4.2; R8.3)
- `.github/ISSUE_TEMPLATE/{01-bug,02-feature,03-question}.yml` + `config.yml` — yml form-based (Phase 4.2; R8.3)
- `.github/FUNDING.yml` — single tier $1+ Karpathy YAGNI (Phase 4.2; R8.5)
- GitHub Sponsors badge in README (Phase 4.2; R8.5)
- `docs/benchmarks/v0.4.md` — 30-row dogfooding benchmark FULL per-task disclosure (Phase 4.1; R8.1 anchor)
- `docs/benchmarks/v0.4-upgrade-e2e.log` — TEXT LOG zero-dep portable (Phase 4.1)
- `docs/CONTRIBUTING-BENCHMARK.md` — MANUAL re-run cadence (Phase 4.1)

### Changed
- `src/routing/engine.ts` — 4 `emitAudit` call sites + surgical comment shrink (200L EXACT ≤200L Karpathy hard limit; Phase 4.3 W1 T1.3)
- `src/cli/doctor.ts` — 5 async checks parallelized via `Promise.all` (Phase 4.2 sister 3rd-cycle absorb #BT)
- `scripts/check-state-archive-stale.mjs` — SIZE_LIMIT 200→175 round 2 RELAX (Phase 4.3 W0.2 #BA resolve)
- `.github/workflows/ci.yml` — A7 step iter ADR 0001-0017 → ADR 0001-0018 integrity gate

### Fixed
- Version sync drift across `src/index.ts` + `src/cli.ts` + `package.json` — both files now import `pkg.version` from package.json single SoT (Phase 4.2 ship sister H1 5996ea1)
- `src/cli/audit.ts` N+1 file read in `auditOne` — refactored to accept optional pre-read src (Phase 4.2 ship sister H2 5996ea1)

[Unreleased]: https://github.com/easyinplay/harnessed/compare/v1.0.3...HEAD
[1.0.3]: https://github.com/easyinplay/harnessed/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/easyinplay/harnessed/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/easyinplay/harnessed/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/easyinplay/harnessed/compare/v0.5.0...v1.0.0
[0.5.0]: https://github.com/easyinplay/harnessed/releases/tag/v0.5.0
[0.5.0-alpha.2]: https://github.com/easyinplay/harnessed/releases/tag/v0.5.0-alpha.2
[0.5.0-alpha.1]: https://github.com/easyinplay/harnessed/releases/tag/v0.5.0-alpha.1
[0.4.0]: https://github.com/easyinplay/harnessed/releases/tag/v0.4.0
