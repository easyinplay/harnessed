# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [3.9.5] - 2026-05-25

### Fixed

3 inter-related bugs surfaced during v3.9.4 dogfood:

- **Bug A: Step B falsely reports 12+ manifests as "skipped"**. `install-base.ts:26-31` + `setup-helpers.ts:22-27` carried a hardcoded `PHASE_21` set marking 4 install methods (`cc-plugin-marketplace` / `git-clone-with-setup` / `npx-skill-installer` / `mcp-http-add`) as "deferred phase 2.1" — short-circuiting them as skipped before any installer ran. But `src/installers/index.ts:L1-2` notes "All 6 methods are now runtime-ready" — the deferred set was v1.0.2 placeholder code that was never cleaned up. User dogfood: `ralph-loop` / `superpowers` / `gstack` / `karpathy-skills` / `ui-ux-pro-max` / `frontend-design` / `mattpocock-skills` / `planning-with-files` / `anthropics-skills-*` / `playwright-test` all reported as "skipped" when in fact they were either already installed (most cases) or perfectly installable through the runtime-ready dispatchers.
- **Fix A**: removed `PHASE_21` set from both `install-base.ts` and `setup-helpers.ts`. All manifests now run through `runInstall(manifest, opts)` which dispatches by method; each installer's own `idempotent_check` (declared verbatim in each manifest yaml) decides already-installed vs install-now. i18n `step_b_complete` wording updated: `"skipped (deferred installer methods awaiting phase 2.1)"` → `"skipped (user-aborted prompt)"` — accurate semantics of what skipped now means.

- **Bug B: auto-install prompts only mattpocock-skills, ignores other missing plugins**. Side effect of Bug A — Step B was reporting most plugins as skipped, doctor checks didn't cover them, so auto-install dispatcher had nothing to prompt. With Bug A fixed, Step B now installs (or detects already-installed) all manifests directly; auto-install dispatcher no longer needs to re-prompt for the same items.

- **Bug C: 3 MCP servers reported already-installed by Step B, but doctor still prompts to install**. `check-mcp-availability.ts` was reading `~/.claude/settings.json` mcpServers — wrong file. Step B `mcpStdioAdd` writes to `~/.claude.json` (user-scope, sister `--scope user` per src/installers/ccPluginMarketplace.ts L4-5). Additionally, `TARGET_SERVERS` names were drifting across releases (v3.6.0 `tavily-mcp`/`exa-mcp`/`chrome-devtools` → v3.9.3 `tavily-remote-mcp`/`exa`/`chrome-devtools`) — none matched the manifest install.cmd actual register name.
- **Fix C**: `check-mcp-availability.ts` rewritten to use `isMcpServerRegistered` helper (sister `src/installers/lib/readClaudeConfig.ts:88` — reads `~/.claude.json` directly). `TARGET_SERVERS` aligned with manifest `install.cmd` register name verbatim: `['tavily-mcp', 'exa-mcp', 'chrome-devtools-mcp']` (the token immediately after `claude mcp add ... --transport stdio <name> --`). `install_commands` field removed from this check — Step B now owns MCP install path; doctor is detection-only.

### Tests

- 3 cells in `tests/cli/check-mcp-availability.test.ts` rewritten: mock now writes `~/.claude.json` (not `settings.json`); server names use manifest-cmd targets; assertions check that `install_commands` is undefined (Step B owns install).
- `tests/unit/cli-install-base.test.ts` cell 3 + cell 5: previously verified PHASE_21 short-circuit (skip without runInstall call); now verify runInstall IS called for all 6 methods.
- `tests/cli/setup.test.ts` cell 5 + cell 6: same — `npx-skill-installer` / `cc-plugin-marketplace` etc. now dispatch through runInstall; assertion counts + wording updated.
- Total: 1125 pass (unchanged baseline; behavior change + assertion refactor).

### Behavior change summary

Before v3.9.5 (dogfood report):
```
[B] installed          gsd
[B] already-installed  chrome-devtools-mcp / exa-mcp / tavily-mcp
[B] skipped            ctx7 / playwright-test / ralph-loop / superpowers / ...
                       (12+ items, all "deferred phase 2.1")
🔔 doctor still warns 3 MCP servers missing
🔔 auto-install prompts only mattpocock-skills
```

After v3.9.5:
```
[B] installed          gsd / (any genuinely missing manifests)
[B] already-installed  chrome-devtools-mcp / exa-mcp / tavily-mcp /
                       (anything detected via idempotent_check)
[B] skipped            (only items where user actively aborted a confirm prompt)
✓ doctor MCP check passes (reads same ~/.claude.json as installer writes)
✓ auto-install no longer re-prompts items Step B already handled
```

## [3.9.4] - 2026-05-25

### Fixed

- **auto-install best-effort continue on per-command failure**: v3.9.1 SPEC abort-on-fail was over-protection. In practice a check's `install_commands` chain often represents **independent** installs (e.g. 3 MCP servers — tavily / exa / chrome-devtools — each its own `claude mcp add`), not a marketplace-add → plugin-install dependency. One failure should not block the others.
- **Behavior change** (`src/cli/lib/auto-install.ts`):
  - Run ALL commands in `install_commands`; record per-command failures but do NOT abort the chain
  - Outcome reporting:
    - All succeeded → `installed` (was: same)
    - All failed → `failed` with reason "all commands failed (N)"
    - Mixed → `failed` with reason "partial: X/Y commands failed" + warning emoji (⚠) to distinguish from total failure
- **User benefit**: when tavily fails (e.g. "already exists" from prior install), exa + chrome-devtools still proceed. User re-runs setup to retry the failed ones (idempotent — `claude mcp add` re-fails cleanly without side effect).

## [3.9.3] - 2026-05-25

### Fixed

- **MCP doctor check false-missing detection**: `TARGET_SERVERS` in `src/cli/lib/check-mcp-availability.ts` used names that didn't match the actual server names registered by their install commands (e.g. `tavily-mcp` vs actual `tavily-remote-mcp` registered by `claude mcp add tavily-remote-mcp ...`). After install, doctor still reported the server missing → auto-install retried → `claude mcp add` exited 1 with "MCP server already exists in local config". Dogfood symptom:
  ```
  MCP server tavily-remote-mcp already exists in local config
  ✗ failed MCP servers (tavily/exa/chrome-devtools) — exit code 1
  ```
- **Fix**: align `TARGET_SERVERS` with install-command target names (`tavily-remote-mcp` / `exa` / `chrome-devtools`); switch substring-match to exact-match (was forgiving but caused false negatives when registered name diverged from target name). `SERVER_INSTALL_COMMANDS` map keys updated to match. Test fixtures updated to use the corrected names.
- **Note**: `tavily-mcp` / `exa-mcp` remain as `workflows/capabilities.yaml` capability entry names — those are harnessed-internal capability identifiers (consumed by workflow templates / routing yaml), independent of MCP server runtime names. No `capabilities.yaml` changes.

## [3.9.2] - 2026-05-25

### Fixed

- **chrome-devtools install command**: v3.9.1 SPEC assumed `npx chrome-devtools-mcp@latest` (empirical-pending). Dogfood confirmed actual install is official Claude marketplace direct: `claude plugin install chrome-devtools-mcp`. Updated `SERVER_INSTALL_COMMANDS['chrome-devtools']` in `src/cli/lib/check-mcp-availability.ts`. Test assertion unchanged (substring `chrome-devtools-mcp` still present in new command).

## [3.9.1] - 2026-05-25

### Fixed

- **setup (P4 auto-install command heterogeneity)**: v3.9.0 P4 hardcoded `claude plugin install <X>` for every missing plugin, but real install commands are heterogeneous across 4 patterns (default marketplace direct / 3rd-party marketplace 2-step / `claude mcp add --transport ...` per-server / upstream skill CLI like `npx skills@latest add owner/repo`). Discovered via dogfood: `claude plugin install mattpocock-skills` fails with "Plugin not found in any configured marketplace" because mattpocock lives in upstream `skills` npm package, not Claude marketplace.
- **Schema**: `CheckResult` interface (`src/cli/lib/check-builtin.ts`) adds optional `install_commands?: readonly string[]` field — structured machine-executable install sequence (distinct from free-text `fix` hint). Each entry is a single shell command; multiple entries run sequentially, any non-zero exit aborts the chain.
- **auto-install dispatcher** (`src/cli/lib/auto-install.ts`): rewritten to consume `install_commands` verbatim. Removed `extractPluginName` parser (no longer needed). UI now shows the full command list as `$ <cmd>` preview before the Clack confirm prompt (informed consent). `spawnSync` runs with `shell: true` for Windows `.cmd` shim resolution (`npx.cmd` / `claude.cmd`).
- **Per-check install_commands**:
  - `mattpocock-skills`: `['npx skills@latest add mattpocock/skills']`
  - `planning-with-files`: `['claude plugin marketplace add OthmanAdi/planning-with-files', 'claude plugin install planning-with-files']`
  - MCP availability (per missing server): `tavily-mcp` → `claude mcp add tavily-remote-mcp --transport http https://mcp.tavily.com/mcp/` / `exa-mcp` → `claude mcp add --transport http exa https://mcp.exa.ai/mcp` / `chrome-devtools` → `npx chrome-devtools-mcp@latest` (empirical-pending, awaiting dogfood verification)

### Tests

- `tests/cli/lib/auto-install.test.ts` rewritten — 3 cells (opt-out / nonInteractive skip / warn-without-install_commands filtered out).
- `tests/cli/check-mattpocock-skills.test.ts` cell 3 updated to assert `npx skills@latest add` wording + `install_commands` field.
- `tests/cli/check-mcp-availability.test.ts` cells 2+3 updated to assert per-server `install_commands` array (tavily / exa / chrome-devtools URLs / npx commands).
- Total: 1125 pass (unchanged from v3.9.0 baseline; refactor + 3 assertion updates).

## [3.9.0] - 2026-05-25

### Added

- **setup (P4 plugin auto-install)**: reverses v3.6.0 Phase 2 SPEC NO-auto-install decision per empirical sample-1 signal — `harnessed setup` now runs `doctor` checks at the end, filters `warn` entries whose `fix:` contains `claude plugin install <X>`, and prompts user via Clack `confirm()` per plugin. On consent, spawns `spawnSync('claude', ['plugin', 'install', plugin])` directly. Default opt-in. Three escape hatches: `--no-auto-install` (advisory-only, v3.8.x parity); `--non-interactive` (skip prompts for CI / scripts); non-TTY stdin/stdout auto-detected → fall back to advisory. New `src/cli/lib/auto-install.ts` (~110 LOC) reuses `@clack/prompts` v0.10 + `isCancel` guard pattern from `src/installers/lib/confirm.ts`. Real spawn integration deferred to manual dogfood post-ship.

### Tests

- 3 new cells in `tests/cli/lib/auto-install.test.ts`: extractPluginName parsing (plain / `@marketplace` suffix / embedded in REMEDIATION sentence / edge cases) + autoInstall:false opt-out + nonInteractive:true skip-without-spawn.
- 2 cells in `tests/cli/setup-agent-teams.test.ts` get `--no-auto-install` flag (avoids double-counting agent-teams check when auto-install re-runs the doctor registry).
- Total: 1125 pass (was 1122; +3 new, no regressions).

## [3.8.0] - 2026-05-25

### Added

- **workflow (P1 conditional RULES inject)**: `WorkflowPhaseV3` schema adds optional `injects_rules: Array(string)` field; `buildAgentDef` gains 5th param `injectsRules?: readonly string[]` and constructs `criticalSystemReminder_EXPERIMENTAL` dynamically via new `buildCriticalReminder()` function. Default (omitted / undefined) inject 2 RULES: `escalation` + `transparent-skip` (~470 tokens/spawn). Phases opting into Agent Teams escalation context — `task/deliver`, `task/test`, `verify/multispec` (both phases) — declare `injects_rules: [escalation, transparent-skip, agent-teams-prevention]` in their workflow.yaml to keep the full 670-token chain. Unknown rule names silently filtered (forward-compat). Weighted-avg across 24 sub-workflows: ~512 tokens/spawn (~24% reduction from v3.6.0 Phase 4 unconditional 670 tokens).
- **setup (P3 doctor advisory)**: `harnessed setup` now prints a final-line advisory hint pointing user to `harnessed doctor` (12 preflight checks). NOT auto-invoke per v3.6.0 Phase 2 NO-auto-install design; user opts in. New i18n key `setup.doctor_hint` in en.json + zh-Hans.json.
- **CLAUDE.md (P2 spec writing checklist)**: project-level discipline addendum capturing v3.6.0 cycle lessons — verify file paths / yaml entry names / TS function names / capability refs / plugin paths via grep before writing into a SPEC. Optional `verified_refs:` frontmatter field documents pre-commit verifications. Pure documentation; no runtime impact.

### Refactor

- **workflow**: removed `CRITICAL_SYSTEM_REMINDER` const (replaced by `RULES_MAP` lookup + `buildCriticalReminder(injects)` function). Existing callers continue to receive the same combined string when explicitly passing all 3 rule names.

### Tests

- 5 new cells in `tests/workflow/buildAgentDef.test.ts` (F9-F13): default 2-RULES / opt-in 3-RULES / single-rule / unknown-rule silent-skip / dispatchSkillStub passthrough.
- F7/F8 (v3.6.0 Phase 4 chain-order) updated to explicitly opt phase into 3 RULES, preserving original assertion semantics.
- Total: 1122 pass (was 1117; +5 cells, no regressions).

## [3.7.0] - 2026-05-25

### Refactor

- **doctor**: hoisted 12 preflight checks into `src/cli/lib/doctor-registry.ts` (single `CHECKS` array source of truth) + 4 built-in checks (Node ≥22 / MCP scope / jq presence / Win bash flavor) into `src/cli/lib/check-builtin.ts`. `src/cli/doctor.ts` shrunk from **247L → 47L** — now a thin dispatcher running `Promise.all(CHECKS.map(c => c()))` and rendering output. Resolves the v3.6.0 Phase 2 B-03 ≤225L hard limit exception accepted at ship time. Adding a new check is now one line in the CHECKS array + one assertion bump in `tests/cli/doctor.test.ts` cell 0 (`CHECKS.length === N`). Zero behavioral change: all 12 checks still fire in the same order, `--json` output shape identical, exit code policy unchanged. Tests: 1117 pass (+1 future-proof cell 0).

## [3.6.1] - 2026-05-25

### Fixed

- **setup**: dropped stale "⚠️ v3.0 BREAKING — v2 legacy slash cmd deprecated" block from `harnessed setup` output. `execute-task` / `plan-feature` / `verify-work` are active CLI subcommand aliases (`harnessed execute-task --task X` thin-shims into `runWorkflow`), not deprecated workflows. The v3.0 deprecation warning was a release-time misjudgement which emitted on every setup for 6 minor versions. Promoted to `FLAT_LEGACY_KEEP`; `harnessed setup` now installs them as standalone flat workflows alongside `research` / `retro` / `auto`. Dead code (`FLAT_LEGACY_DEPRECATED` set + `renderDeprecationBlock` function + `ScanResult.deprecated` field) removed.
- **i18n**: clarified meaning of `Step B 完成: ... {{skipped}} 跳过` count. Now reads `{{skipped}} 跳过 (待 phase 2.1 实装的安装方式)` / English `{{skipped}} skipped (deferred installer methods awaiting phase 2.1)`. The old wording made users suspect manifests were silently broken when in fact they declared `npx-skill-installer` / `mcp-http-add` / `cc-plugin-marketplace` / `git-clone-with-setup` installer methods that are deferred to phase 2.1 (D-11 policy: deferred ≠ failed).

## [3.6.0] - 2026-05-25

### Phase 1 — mattpocock methodology inline (sub-workflow role-prompt enrichment)

- **role-prompts**: inlined paraphrased methodology excerpts from [mattpocock/skills](https://github.com/mattpocock/skills) (MIT, commit `b8be62ffacb0118fa3eaa29a0923c87c8c11985c`) into 3 sub-workflow entries in `workflows/role-prompts.yaml`, so spawned subagents inherit the methodology even when the upstream mattpocock plugin is absent. Pattern matches v3.5.0 Phase 2 `ESCALATION_RULES` inject (reuses the existing `buildAgentDef` splice pipeline in `src/workflow/run.ts` L94-103; **zero `src/` change** for Phase 1).
  - `task-clarify` (primary_cap `superpowers-brainstorming`): `+grill-with-docs` in `responsibility` (CONTEXT.md pressure-test, sharpen terminology, update ADRs inline) + 4 checklist items (cross-ref CONTEXT.md, sharpen vague terms, draft ADR inline, output doc-diff). Checklist count 6→10.
  - `task-code` (primary_cap `planning-with-files`): `+zoom-out` + `+improve-codebase-architecture` in checklist (5 new items — abstraction-layer mapping; shallow→deep deepening; deletion test; CONTEXT.md naming; before/after report). Checklist count 7→12.
  - `discuss-subtask` (primary_cap `superpowers-brainstorming`): `+grill-me` in `responsibility` (relentless branch-by-branch interview, ONE at a time, prefer codebase exploration over asking) + 2 checklist items. Checklist count 6→8.
- **attribution**: 3-layer MIT compliance — (a) yaml header block in `workflows/role-prompts.yaml` naming source URL + pinned SHA + license + cross-ref to `THIRD-PARTY-NOTICES.md`; (b) inline `# … paraphrased from mattpocock/skills (MIT, b8be62f)` comment block above each enriched `responsibility` / `checklist` group with source SKILL.md path; (c) new `THIRD-PARTY-NOTICES.md` at repo root with per-source attribution table + scope-of-redistribution disclosure. Full upstream LICENSE text + vendored SKILL.md sources + provenance metadata preserved at `.planning/v3.6.0/mattpocock-source/` (audit trail; **not shipped** in the npm tarball).
- **tests**: 5 new cells in `tests/workflow/rolePromptsMattpocock.test.ts` (regression guard for license + methodology integrity). Cells read the shipped `workflows/role-prompts.yaml` via `loadRolePrompts` (sister pattern to `tests/workflow/disciplineLoader.test.ts`) and assert: (1-2) task-clarify grill-with-docs methodology + checklist items; (3) task-code zoom-out + improve-arch checklist items; (4) discuss-subtask grill-me methodology; (5) yaml header carries the attribution comment block with pinned SHA (raw-file regex check, since `loadRolePrompts` strips comments). Total suite: 1092 → 1097 pass.
- **regression**: Zero runtime behavior change — yaml schema unchanged, `loadRolePrompts` consumer unchanged, all v3.5.0 cells preserved. `pnpm build` 0 errors, `pnpm test` 1097 pass / 5 skipped / 1 todo, `pnpm pack` tarball 362 KB (was ~360 KB pre-Phase-1).
- **deferred to Phase 5 Wave 0**: shipping `THIRD-PARTY-NOTICES.md` inside the npm tarball requires adding it to `package.json` `"files"` array (currently `dist / manifests / workflows / routing / config-templates / schemas / README.md / LICENSE / NOTICE` only). MIT-compliance shipped attribution is already satisfied through `workflows/role-prompts.yaml` (header block + 3 inline comment groups with pinned SHA — all in the tarball). The repo-root `THIRD-PARTY-NOTICES.md` aggregator file currently ships only via Git, not npm. Per Phase 1 `NEEDS_CLARIFICATION` resolution, this packaging fix is deferred to **Phase 5 Wave 0 "Packaging fix"** (no scope drift into Phase 1; `package.json` is out of Phase 1's scope per spec).

### Phase 2 — setup-time third-party doctor (mattpocock + MCP availability)

- **doctor**: expanded `harnessed doctor` from 10 → 12 checks per user reframe ("setup 时检测 mattpocock-skills 并安装") + `audit-harnessed-vs-user-rules-2026-05-25.md` P1a ("MCP 自动探测 + fallback hint"). Both checks are advisory `warn` (NOT `fail`) when missing — non-blocking per R2.4.1 (`warn ≠ fail / exit 0`). No auto-install (user explicit exclusion); checks surface REMEDIATION hints only.
  - **11th check — `mattpocock-skills` install probe** (`src/cli/lib/check-mattpocock-skills.ts`, new ~75 LOC): file-based probe of two dual-support locations — `~/.claude/plugins/cache/mattpocock-skills/mattpocock-skills/<version>/` (Claude Code plugin form) **or** `~/.claude/skills/mattpocock-skills/` (user-skill form). Either present → `pass`. Both missing → `warn` with REMEDIATION pointing to `claude plugin install mattpocock-skills` (or `git clone`) and a reminder that methodology fallback is already inline in `workflows/role-prompts.yaml` per Phase 1 — install is **optional**, but enables `/grill-with-docs` / `/zoom-out` / `/improve-codebase-architecture` SlashCommand acceleration.
  - **12th check — MCP servers availability** (`src/cli/lib/check-mcp-availability.ts`, new ~75 LOC): reads `~/.claude/settings.json` `mcpServers` block, checks for `tavily-mcp` / `exa-mcp` / `chrome-devtools` (substring match accepts forks/aliases). Distinct from existing `checkMcpScope` (scope-hygiene layer per CC #54803); this is the server-by-server availability layer. All 3 → `pass`. Partial → `warn` listing installed + missing. None → `warn` with REMEDIATION pointing to `claude mcp add <name>` and noting that harnessed web-search routing (`workflows/judgments/web-search-routing.yaml`) gracefully degrades to built-in `WebFetch` / `WebSearch` when tavily/exa absent.
  - **`doctor.ts` integration**: 100% delegate-helper pattern (sister `checkAgentTeamsEnv` / `checkPlanningPlugin` L161-166); +2 `Promise.all` entries + +2 `results` entries + description string `+1 + 1` surface mentions. Net: `doctor.ts` 226 → 247 LOC. B-03 `≤225L` hard limit **exception accepted** per PHASE-2-SPEC.md D3 option A: 12 checks all delegate to thin `check-*.ts` helpers; doctor.ts remains a thin dispatcher; refactor to `check-registry.ts` deferred to v3.7+ when checks reach ~14+ (karpathy YAGNI).
- **tests**: 6 new PRIMARY-helper cells (`tests/cli/check-mattpocock-skills.test.ts` 3 cells + `tests/cli/check-mcp-availability.test.ts` 3 cells) using sister Phase 3.4 W1 T1.3 tmpdir + `HOME`/`USERPROFILE` redirect + `vi.resetModules` per-cell isolation pattern (real fs, NOT global mock). Existing dispatch tests updated 10 → 12: `tests/cli/doctor.test.ts` cell 1 + cell 5 + 2 new `toContain` assertions; `tests/cli/doctor-fixtures.test.ts` 6 scenarios × `toHaveLength(12)` + 2 new `arrayContaining` entries. Total suite: 1097 → **1103 pass** / 5 skipped / 1 todo / 0 fail.
- **reality verification** (Wave 4): `node dist/cli.mjs doctor` output shows 12 checks human-readable; `node dist/cli.mjs doctor --json | .checks.length` = `12` machine-readable; real-env `mattpocock-skills = warn` + `MCP servers = warn` (both REMEDIATION-only, non-blocking exit 0 modulo unrelated pre-existing `mcp scope` + `gstack prefix` fail states that pre-date Phase 2).
- **regression**: Zero functional change to existing 10 checks (Node / mcp-scope / jq / win-bash / origin / gstack-prefix / deprecations / token-budget / Agent Teams / planning-with-files). Phase 1 mattpocock methodology inline is preserved verbatim — Phase 2 only adds install-time advisory layer.

### Phase 3 — Clarification runtime detection (user-override + transparent skip)

- **user-override** (P0b 上半, Audit § fallback 三条铁律 "用户明示 → 覆盖判据"): new `workflows/judgments/user-overrides.yaml` (80 LOC) declares 6 override entries (`brainstorm` / `strategic-review` / `arch-review` / `phase-discuss` / `paranoid-review` / `tdd`) mapping keyword phrases (中英 2 语言) → trigger gate refs[]. CLI (`src/cli/run.ts`) extracts matched triggers from `--task <text>` via case-insensitive substring match (`src/cli/lib/extract-user-overrides.ts`, 76 LOC) and injects them into `gateContext.user_overrides[]`. `src/workflow/judgmentResolver.ts` checks the array at function entry — if `gateRef` present, bypasses expression evaluation and returns `fires=true`. Stderr emits `ℹ user-override detected: N trigger(s) ...` for transparency.
- **transparent-skip** (P0b 下半, Audit § fallback 三条铁律 "拿不准 → 倾向跳过 + 透明声明"): new `transparent-skip-on-low-confidence` rule in `workflows/disciplines/operational.yaml` (`check_method: prompt-inject`); new `TRANSPARENT_SKIP_RULES` const in `src/workflow/run.ts` appended to `CRITICAL_SYSTEM_REMINDER = ${ESCALATION_RULES}\n\n${TRANSPARENT_SKIP_RULES}`. `buildAgentDef` both code paths (rolePrompt found + conservative fallback) swap `criticalSystemReminder_EXPERIMENTAL` from bare `ESCALATION_RULES` to combined `CRITICAL_SYSTEM_REMINDER`. Spawned subagent reads the rule + emits verbatim skip message ("Skipped <phase>, because <reason>. Tell me if you actually need it.") when gate context is ambiguous instead of silent execution. Phase 2 escalation rules preserved verbatim (append only, not modified).
- **schema**: new `UserOverridesFile` + `UserOverrideEntry` TypeBox schemas (`src/workflow/schema/judgment.ts`, additive only — NOT in `JudgmentFile` union per Risk 3 mitigation). `schema_version: harnessed.user-overrides.v1` (15th surface; single-file consumer, not yet wired into `SCHEMA_VERSIONS`).
- **灰区 resolutions** (per user ack 2026-05-25, sister v3.5.0 Phase 2 hotfix-transparent pattern): (a) 灰区 #2 Option C — `arch-review.triggers[0]` points to existing `judgments.stage-routing.plan-architecture-delegate.fires` (no `architecture-gate.yaml` exists; semantically nearest entry, no scope creep); (b) 灰区 #1/#3 Option A — `phase-discuss.triggers[0]` points to existing `judgments.phase-gate.gsd-discuss-phase.fires` (no `gray-areas` entry exists; naming drift fix). Cross-validation: 10/10 trigger refs across 6 overrides verified against shipped judgment yamls.
- **tests**: 13 new/updated cells across 5 files. (a) NEW `tests/workflow/user-override-resolver.test.ts` (5 cells — bypass match / fall-through / empty / multi-trigger union / file-name independence). (b) NEW `tests/cli/lib/extract-user-overrides.test.ts` (5 cells — Chinese substring / English case-insensitive / multi-entry union dedupe / empty no-op / real shipped yaml load + cross-validation echo). (c) `tests/workflow/buildAgentDef.test.ts` +2 cells (F5/F6 — both code paths inject combined `CRITICAL_SYSTEM_REMINDER`). (d) Sister cell updates: `disciplineLoader.test.ts` 6→7 rules; `before-phase-execute.test.ts` 6→7 rules; `schema.test.ts` 10→11 yaml + new B3 cell for `UserOverridesFile` schema; `run.test.ts` cell 20 strict `.toBe(ESCALATION_RULES)` replaced with substring assertions on BOTH escalation triggers AND transparent-skip rule. Total suite: 1103 → **1116 pass** / 5 skipped / 1 todo / 0 fail.
- **reality verification** (Wave 4): `corepack pnpm build` 0 红 (DTS + ESM both green); cross-validation script (parse `user-overrides.yaml` → grep target yaml entries) 10/10 PASS; dry-run smoke `node dist/cli.mjs run discuss --task "先 brainstorm 这个算法" --dry-run` emits stderr `ℹ user-override detected: 2 trigger(s) ...` + `gateContext.user_overrides` correctly populated with both `subtask-gate.brainstorming.fires` + `stage-routing.discuss-subtask-delegate.fires`.
- **regression**: Zero functional change to existing judgment / discipline mechanisms. user-override bypass is additive (fail-soft per ADR 0029: empty/missing yaml → empty array → existing eval path); transparent-skip rule is prompt-inject only (no runtime gate change). v3.5.0 Phase 2 ESCALATION_RULES preserved byte-for-byte.

### Phase 4 — Agent Teams prevention discipline inject (P1b)

- **runtime**: spawned subagents now also carry the 4 Agent Teams 防呆 rules in their critical-system-reminder, so when they signal `needs_teams_escalation=true` they ALSO advise the user (via `escalation_reason` / summary) of the prevention checklist that gates Team API usage. Source: `~/.claude/rules/agent-teams.md` "防呆清单" — paraphrased for prompt injection (not verbatim user-private file). Per `audit-harnessed-vs-user-rules-2026-05-25.md` P1b. Like Phase 3, this is an inject-only advisory layer — harnessed runtime cannot itself enforce cleanup because Team APIs (`TeamCreate` / `SendMessage` / `TeamDelete`) are not exposed via SDK v0.3.142; the main session is the final backstop.
- **runtime**: new `AGENT_TEAMS_PREVENTION_RULES` const in `src/workflow/run.ts` (~25 LOC, ~200 tokens) covers the 4 防呆 items: (1) **session-scoped** (teams die on `/resume`); (2) **cleanup mandatory** (send `shutdown_request` to each teammate + `TeamDelete` before session ends); (3) **token-cost estimation** (`team_cost ≈ N_teammates × N_rounds × avg_tokens_per_round + N_teammates × initial_brief_tokens`; prefer subagent fan-out unless `team_cost < 2 × subagent_cost`); (4) **brief must be self-contained** (each teammate launches WITHOUT main-session context). `CRITICAL_SYSTEM_REMINDER` composition extended to chain `ESCALATION_RULES` (Phase 2) → `TRANSPARENT_SKIP_RULES` (Phase 3) → `AGENT_TEAMS_PREVENTION_RULES` (Phase 4). Both `buildAgentDef` code paths (rolePrompt-found + conservative fallback) unchanged — they reference the `CRITICAL_SYSTEM_REMINDER` variable directly (Phase 3 indirection), so the new chain link propagates automatically.
- **prompt budget**: total `criticalSystemReminder_EXPERIMENTAL` now ~670 tokens/spawn (v3.5.0 Phase 2 ESCALATION_RULES ~320 + v3.6.0 Phase 3 TRANSPARENT_SKIP_RULES ~150 + v3.6.0 Phase 4 AGENT_TEAMS_PREVENTION_RULES ~200). ~13% of a typical 5000-token spawn budget — acceptable per PHASE-4-SPEC § D4; v3.7+ candidate to conditionally inject Phase 4 block only when multi-spec / fullstack-three-way trigger context is detected.
- **tests**: 2 new cells in `tests/workflow/buildAgentDef.test.ts` (sister Phase 3 F5/F6 location — buildAgentDef is private so exercised indirectly via `_dispatchSkillStub.fn` with `sdkSpawn` `vi.mock` capturing the `AgentDefinition`). (F7) all 4 prevention-rule key phrases verbatim present (`'Session-scoped'` / `'shutdown_request'` + `'TeamDelete'` / `'team_cost'` + `'subagent_cost'` / `'self-contained'`) + escalation-hint anchor `'needs_teams_escalation=true'`. (F8) chain order assertion via strict substring-index inequality: `'teammate_send_message_needed'` (ESCALATION anchor) < `'Chain-isolation rule'` (TRANSPARENT_SKIP anchor) < `'Session-scoped'` (PREVENTION anchor). Total suite: 1116 → **1118 pass** / 5 skipped / 1 todo / 0 fail.
- **reality verification** (Wave 3): `corepack pnpm build` 0 红 (DTS + ESM both green); byte-level grep of `dist/cli.mjs` confirms all 6 anchor phrases shipped (Phase 2 + Phase 3 + Phase 4 each contribute 2 unique strings — 6/6 present). dry-run runtime spawn deferred (`sdkSpawn` requires `ANTHROPIC_API_KEY` to exercise end-to-end; reality verified via build-artifact byte-level inspection equivalent to runtime injection per the same template-literal path).
- **regression**: Zero functional change to existing escalation / transparent-skip / judgment / discipline mechanisms. Phase 4 inject is additive (append-only chain extension); Phase 2 + Phase 3 const bodies preserved byte-for-byte. `runWorkflow` escalation hint (Phase 2 D4 `console.error`) unchanged — Phase 4 only enriches the advisory text the spawned subagent itself emits.

## 3.5.0 (Unreleased)

### Phase 1 — P0 private-file reference sweep

- **workflows**: stripped all `~/.claude/CLAUDE.md` / `~/.claude/rules/*.md` / `~/.claude/plugins/cache/.../X.Y.Z` / `~/.claude/settings.json` references from `workflows/` (65 files, ~150 hits across `capabilities.yaml` + 7 disciplines yaml + 8 judgments yaml + 25 sub-workflow `SKILL.md` + `workflow.yaml` + `role-prompts.yaml`). `npm install harnessed` now ships a self-contained package with zero references to maintainer's private home-directory files. **Net delta**: -48 LOC (mainly References-bullet deletions in `SKILL.md`). **Hard gate verified**: `grep -r "~/.claude" workflows/` = 0 hits.
- **capabilities**: dropped `planning-with-files.plugin_path` field (runtime not consumed; environment-specific). Description fields cleaned of `(per ~/.claude/rules/X.md L*)` source-citation tails (maintainer index belongs in ADRs, not shipped yaml).
- **disciplines + judgments**: yaml header comments rewritten to self-contained descriptions (no `~/.claude/CLAUDE.md` 节 references). `language.yaml` `check_method` field switched from `~/.claude/settings.json` path to `env.HARNESSED_USER_LANG` (env-var consistency).
- **SKILL.md**: References sections stripped of `~/.claude/*` bullets (~30 occurrences across 25 sub-workflows). Plugin-path mentions replaced with install guidance ("Requires X plugin via Claude Code plugin marketplace"). `harnessed setup` slash-command sister references rewritten with `<claude-home>/commands/<x>.md` placeholders.
- **regression**: Zero user-facing — yaml schema unchanged, runtime dispatcher unchanged, all 1087 tests pass. v3.4.4 capability cmd resolution paths preserved verbatim (only descriptive metadata stripped).

### Phase 2 — Option 1-Lite signal-driven Agent Teams escalation

- **runtime**: spawned-via-SDK subagents now identify Agent Teams upgrade triggers and signal back through `structured_output.needs_teams_escalation` (+ `escalation_reason`); `harnessed` runtime emits a one-line stderr hint after the phase completes so the user can decide whether to open a team in their main Claude Code session (`TeamCreate` is not exposed to spawned subagents via SDK v0.3.142 — this is a deliberate signal-only design). The 5 trigger names are transcribed verbatim from `workflows/judgments/parallelism-gate.yaml` (`teammate_send_message_needed` / `subagent_context_overflow` / `shared_task_list` / `opposing_hypothesis_debate` / `fullstack_three_way`).
- **schema**: `COMPLETION_SCHEMA` extended with optional `needs_teams_escalation` (boolean) + `escalation_reason` (string) fields; absent fields default to no-op so existing phases are unaffected.
- **runtime**: `buildAgentDef` now injects `criticalSystemReminder_EXPERIMENTAL = ESCALATION_RULES` on both code paths (rolePrompt-found + fallback stub), so escalation rules reach every spawned subagent uniformly via the existing `sdkReconcile` injection pipeline. ESCALATION_RULES (~1300 chars / ~320 tokens) explicitly tells the spawned subagent NOT to attempt calling Team APIs itself.
- **runtime**: `DispatchStubResult` extended with `needsTeamsEscalation?` + `escalationReason?` (camel-renamed from envelope snake_case); `_dispatchSkillStub.fn` parses the new fields when present and `runWorkflow` emits `console.error` hint with trigger name + `parallelism-gate.yaml` reference. Non-blocking — phase still proceeds normally.

### Phase 3 — Verify + ship

- **release**: Tag `v3.5.0` pushed; GitHub Actions `publish.yml` auto-triggered npm publish with `--provenance` (sigstore rekor TLOG attestation per supply-chain hardening pattern延袭 since v3.4.x).
- **package**: tarball verified `~/.claude` 0 hits in `workflows/` after pack; net package size delta ~-2 KB from Phase 1 deletions.
- **CHANGELOG**: this entry + retroactive `## [3.4.4] - 2026-05-24` header backfill (release-time omission fixed; v3.4.4 release commit `650b7f6` only bumped `package.json` and left CHANGELOG header as `(Unreleased)`).

## [3.4.4] - 2026-05-24

- **runtime**: `harnessed run <name>` now drives real Claude subagent spawns (was placeholder `<stub for X>` in v3.4.3). 24 v3 workflow yamls load + execute through `loadPhases` + `runWorkflow` + `runMasterOrchestrator` end-to-end. `--dry-run` still bypasses spawn (Phase 1 behavior preserved).
- **schema**: v3 dispatch arm added to `loadPhases` — yamls with `schema_version: harnessed.workflow.v3` validate against `WorkflowSchemaV3` (master shape with `delegates_to` + no phases supported).
- **refactor**: `sdkSpawn` driver moved from `src/routing/lib/` to `src/workflow/lib/` (single SoT, prep for Phase 6 routing deletion).
- **runtime**: `harnessed run <name>` now honors `--max-iterations <n>` end-to-end (Phase 1 stub fully wired). Resolution chain: CLI flag → `phase.max_iterations` → hardcoded 20, clamped at `hard_upper_limit = 100`.
- **runtime**: phases with `max_iterations` / `fallback.max_iterations_exceeded` / `upstream: ralph-loop` yaml signals now spawn under `ralphLoopWrap` (retry until verbatim `COMPLETE` signal OR max-iter hit). Phases without these signals continue single-shot per Phase 2 (no behavior change).
- **refactor**: `ralphLoop` driver moved from `src/routing/lib/` to `src/workflow/lib/` (single SoT, sister Phase 2 sdkSpawn pattern; `promiseExtract` + `fallbackHandlers` deferred to Phase 6 hoist).
- **runtime**: on `MaxIterationsExceededError`, phases with `fallback.max_iterations_exceeded` config dispatch `handleMaxIterationsExceeded` (R20.10 c — `process.exit(exit_code)` + UX text), NOT silent abort.

### Phase 4 — research + execute-task migrate to harnessed run (Path A)

- **cli**: `harnessed research` + `harnessed execute-task` subcommands are now thin aliases that invoke `runWorkflow` (the Phase 1-3 universal runtime); `src/routing/runRouting` is no longer called from the CLI surface (Phase 6 will delete `src/routing/` + v2 `workflows/execute-task/phases.yaml`). Subcommand flags + exit codes + K5 before-commit hook unchanged → zero user-visible regression.
- **workflow**: NEW `workflows/execute-task/workflow.yaml` v3 (mirrors v2 `phases.yaml` 4-phase chain: brainstorming → karpathy + mattpocock route → TDD + diagnose → ralph-loop COMPLETE; per-phase models opus/sonnet/sonnet/haiku per intel CD-2 § 第 4 条). V2 `phases.yaml` preserved through Phase 5.
- **runtime**: `buildAgentDef` enriched with `workflows/role-prompts.yaml` lookup chain (`rolePrompts[skillName]` → `rolePrompts[workflowName]` → conservative 2-field stub). Resolved entries splice `responsibility` + `checklist` + `severity` + `specialist` into the AgentDefinition prompt. `gateContext.modelTierOverride` (`--model-tier inherit` B-10 escape hatch) consumed.
- **runtime**: `MaxIterFallbackCtx.workflowName` plumbed end-to-end (`parsed.workflow` → `_dispatchSkillStub.fn` opts → `handleMaxIterationsExceeded`). Stderr UX text on max-iter halt now shows actual workflow name (e.g. `execute-task`, `verify-paranoid`) instead of hardcoded `'harnessed-run'`.

### Phase 5 — real getNextHint + formatted stderr stage hint

- **cli**: `getNextHint(workflowName)` replaced the Phase 1 stub: reads `workflows/auto/workflow.yaml` `delegates_to[]` (6 stages: research → discuss → plan → task → verify → retro) with lazy module-level cache (1 load per process).
- **cli**: Sub-workflow parent-stage fallback (D-1 Option C): `verify-paranoid` → parent `verify` → hints `retro`; sister for `discuss-strategic` (→ plan) / `task-clarify` (→ verify) / `plan-architecture` (→ task).
- **cli**: Stderr emits 3-line stage-complete envelope after every `harnessed run <name>` apply-path invocation: `[stage <name> complete]` + `Next stage: harnessed run <next>` + `(In Claude Code: /<next>)`. `--dry-run` path unchanged (exits before hint per Phase 1 behavior — keeps stdout JSON envelope machine-parseable).
- **runtime**: ADR 0029 fail-soft preserved — yaml read / parse error returns null + 1-line stderr warn `⚠️ getNextHint failed (...); skipping hint.`, never crashes the run loop.

### Phase 6 — FINAL cleanup (delete `src/routing/` + hoist 5 deps + i18n & doc-path cleanup)

- **refactor**: Hoisted 5 cross-package dependency files from `src/routing/` to `src/workflow/lib/` (single SoT for workflow runtime extras): `agentDefinition.ts` (195L → 92L after zombie trim of `createAgent` + 4 error classes + 2 dead consts) + `completionSchema.ts` (33L) + `sdkReconcile.ts` (56L) + `promiseExtract.ts` (32L) + `fallbackHandlers.ts` (92L). `COMPLETE_INSTRUCTION` const + minimal `Rule` interface inlined into hoisted `agentDefinition.ts`.
- **cleanup**: Deleted `src/routing/` (9 remaining files, 839 LOC) + `src/routing-engine/` (empty `.gitkeep`) + 4 `tests/routing/` engine-coupled tests + 6 `tests/unit/routing-*.test.ts` + 2 `tests/integration/routing-*.test.ts` + 2 legacy v2-specific test files (`load-phases.test.ts` + `execute-task-v2.test.ts`, superseded by Phase 2 + 4 v3 equivalents). Net **~3500 LOC dead-code removal**.
- **tests**: Relocated 4 `tests/routing/` workflow-tier tests to `tests/workflow/` (`isComplete` + `ralph-loop-win-sentinel` + `sdk-spawn` + `sdk-reconcile`) with import path updates. 2 dogfood tests pivoted from v2 `phases.yaml` to v3 `workflow.yaml` (surgical cell-level).
- **workflows**: Deleted `workflows/execute-task/phases.yaml` (v2 legacy SoT — Phase 4 v3 `workflow.yaml` is single dispatcher). Updated `workflows/execute-task/SKILL.md` + `workflows/execute-task/workflow.yaml` narrative + fixed 4 stale `src/routing/lib/` doc-path references in shipped yaml/md (post-Phase-2 doc-rot).
- **i18n**: Removed 4 stale keys (`research.dry_run.matched_rule` + `research.dry_run.query` + `research.dry_run.run_hint` + `research.install_fix_hint`) from `messages/{en,zh-Hans}.json`. `install.aborted` PRESERVED (still live in `install.ts` + `uninstall.ts`).
- **regression**: Zero user-facing — `harnessed run` / `harnessed research` / `harnessed execute-task` CLI surface + exit-code semantics + Phase 5 stage-complete envelope all preserved. Phase 4 alias migration leaves no `runRouting` consumer in production CLI.

## [3.4.3] - 2026-05-24 — Dual-source slash commands: `~/.claude/commands/<x>.md` + `~/.claude/skills/<x>/SKILL.md` (Option I); vapor CLI subcommand claims removed

**升级一行指令**: `npm install -g harnessed && harnessed setup` (重跑 setup 触发 commands/ 生成 + SKILL.md 重新渲染)

**Trigger**: 用户 dogfood v3.4.2 后 cross-session 反复报告 `/verify-paranoid` 仍不可用。另一 CC 实例诊断 (verbatim) 给出 root cause:

1. SKILL.md 里 `harnessed verify-paranoid --apply` **是 vapor** — `harnessed --help` 实际只有 `install / install-base / research / execute-task / manifest-add / doctor / audit / audit-log / rollback / status / backup`,**13+ sub-workflow CLI 子命令完全没实现**。
2. SKILL.md 让 Claude 用 `SlashCommand /review` 来路由,但 gstack `/review` 是 user-skill subdir (`~/.claude/skills/gstack/review/SKILL.md`),**Claude Code 不 register subdir SKILL.md 为顶层 slash command** — 仅通过 CLAUDE.md 描述的 model-driven 路由间接调用。
3. 同样 `/verify-paranoid` 本身的 `~/.claude/skills/verify-paranoid/SKILL.md` 只是 Skill 工具可加载入口,**不是 SlashCommand 工具可触发** 的真 slash command — 平台层 slash command 必须在 `~/.claude/commands/<x>.md` 才注册。

### Fixed

- **NEW `~/.claude/commands/<x>.md` generation (Step A.6)** — `harnessed setup` 现在 dual-source 输出:每个 sub-workflow 同时写两个文件,语义同源:
  - `~/.claude/skills/<x>/SKILL.md` — Skill 工具加载入口 (Claude 主动判断 `trigger_phrases:` 匹配时加载),既有路径。
  - `~/.claude/commands/<x>.md` — 平台 user-defined slash command 真注册 (filename = `/x`),用户输入 `/verify-paranoid` 时 SlashCommand 工具直接找到。Filename = bare slash name (e.g. `verify-paranoid.md` → `/verify-paranoid`,无 `harnessed-` 前缀,符合 D-02 bare cmd 政策)。
- **Dual-path 内容同源**:两文件 body 都含同一段 `## How to invoke`:
  - **Preferred path** — `Use the SlashCommand tool to run \`{{ capabilities.<x>.cmd }}\`` — 通过 capabilityResolver 渲染成真 cmd (e.g. `/review` 当 gstack 已装)。
  - **Fallback path** — `Use the Task tool to spawn a general-purpose subagent with this prompt: ...` — self-contained role-prompt,从 gstack 上游专家提示词移植 (如 verify-paranoid 的 Pass 1 CRITICAL 9-item 清单,源 `~/.claude/skills/gstack/review/checklist.md`)。装了 plugin 走 preferred,没装走 fallback,**互不依赖**。
- **NEW `workflows/role-prompts.yaml`** (~480 LOC) — 24 sub-workflow 的 role-prompt registry:`specialist` (专家头衔) + `responsibility` (一句话使命) + `checklist` (5-10 项审查清单) + `severity` (报告 severity 标签) + `description` (commands/ frontmatter)。Karpathy: 一个 yaml 比 24 处硬编码 TS 强。
- **NEW `src/cli/lib/generateCommands.ts`** (~205 LOC,karpathy ≤200L 边界) — `loadRolePrompts` / `generateCommandFile` / `writeAllCommands`。复用 `renderSkillBody` 渲染 capability cmd 占位符;**`fileExists` 守门:已存在 user 写的 `~/.claude/commands/<x>.md` 则 skip + warn,绝不 overwrite** (additive only)。
- **24 个 SKILL.md `## How to invoke` 段全重写** — `workflows/<stage>/<sub>/SKILL.md` (含 `auto` / `discuss/auto` / `plan/auto` / `task/auto` / `verify/auto` / `research` / `retro` 等 master + standalone) 通过 `scripts/rewrite-skill-invoke-sections.mjs` 一次性 idempotent 重写。
- **Vapor CLI 字样全部清除** — 删除每个 SKILL.md 里的 `## CLI invocation` shell block (claim `harnessed verify-paranoid --apply` 等),以及 `## Invocation` bullet list 里的 `- CLI: \`harnessed ...\`` 行,以及 frontmatter `description:` 里的 `Triggered by harnessed CLI \`harnessed <x> ...\` or slash command` 字样改成 `Triggered by slash command`。**CLI 没动** — 那些 subcommand 至始至终不存在,这次只删除虚假广告,未来 v3.5+ 如要实装可走另一个 PR。

### Why

v3.4.0 / v3.4.1 / v3.4.2 反复 patch 都没解决问题,因为它们都假设 SKILL.md 改一下就能让 `/verify-paranoid` 出现。这次定位 root cause:**Claude Code 平台层 slash command 必须有 `~/.claude/commands/<x>.md` 文件才 register**,SKILL.md 只是 Skill 工具加载入口。两类文件性质不同,缺一不可。

### Added

- `src/cli/lib/generateCommands.ts` — NEW (~205 LOC)
- `workflows/role-prompts.yaml` — NEW (~480 LOC, 24 entry)
- `tests/unit/generate-commands.test.ts` — NEW (12 cell:loadRolePrompts 解析 / generateCommandFile body shape 含 master vs sub variant / writeAllCommands skip+warn 路径 / bare filename 验证)
- `scripts/rewrite-skill-invoke-sections.mjs` — NEW (一次性 idempotent 重写器,标记 `<!-- v3.4.3-dual-path-invocation -->` 防重跑;后续可删,留作 audit trail)

### Changed

- `src/cli/setup.ts` — NEW Step A.6 between A.5 render placeholders 和 C Agent Teams enable;读 capabilities.yaml + role-prompts.yaml + installed plugins/user-skills,把 24 个 commands/<x>.md 写到 `~/.claude/commands/`。文件名 collision 时 skip + warn,绝不覆盖 user 文件。
- `package.json` — version 3.4.2 → 3.4.3

### Files changed

- `src/cli/lib/generateCommands.ts` — ADDED
- `src/cli/setup.ts` — Step A.6 wiring
- `workflows/role-prompts.yaml` — ADDED
- `workflows/<stage>/<sub>/SKILL.md` × 24 — `## How to invoke` 段 + vapor CLI claims 全重写
- `tests/unit/generate-commands.test.ts` — ADDED (12 cell)
- `scripts/rewrite-skill-invoke-sections.mjs` — ADDED (one-shot rewriter)
- `package.json` — version bump 3.4.2 → 3.4.3
- `CHANGELOG.md` — this entry

### Verification snippet for users

After `npm install -g harnessed@3.4.3 && harnessed setup`:

```bash
# 1. 24 commands/<x>.md 已写入
ls ~/.claude/commands/verify-paranoid.md ~/.claude/commands/verify.md ~/.claude/commands/auto.md

# 2. 在 Claude Code session 里直接试
/verify-paranoid     # SlashCommand 工具直接找到 (NOT model-driven 间接路由)
/discuss             # 同上
/auto                # 同上

# 3. 文件内容含双路径:
head -50 ~/.claude/commands/verify-paranoid.md
#   ---
#   description: "Paranoid Staff Engineer pre-landing review ..."
#   ---
#   # /verify-paranoid
#   ## How to invoke
#   **Preferred path**: use the SlashCommand tool to run `/review` ...
#   **Fallback path**: use the Task tool to spawn ... You are a **Paranoid Staff Engineer** ...
```

如已有 `~/.claude/commands/<x>.md` (e.g. 用户自己写过 `/verify-paranoid`),`harnessed setup` skip 并 warn,不会 overwrite。

### Plugin path future-proofing

每个 commands/<x>.md 的 body 都已 self-contained:**preferred path 调用上游 plugin / user-skill (若装了),fallback path 直接 spawn Task with role prompt (永远 work)**。这意味着用户:

- 装了 gstack / mattpocock / 其他 plugin → 走 preferred,gstack `/review` 等专家工具接管。
- 没装 → 走 fallback,role prompt 是从 gstack 上游 checklist 移植的 self-contained 版本。
- 未来 plugin API 变更或某 plugin 失效 → fallback 保护,workflow 永远不会因 plugin 失效而完全无法运行。

## [3.4.2] - 2026-05-24 — Resolver redesign: drop namespace prefix mutation; presence-check via install_type (plugin | user-skill)

**升级一行指令**: `npm install -g harnessed && harnessed setup` (重跑 setup 触发 SKILL.md 模板重新渲染)

**Trigger**: 用户 dogfood 安装 v3.4.1 后纠正,v3.4.1 的两条核心假设全错:

1. v3.4.1 假设 gstack / mattpocock / gsd 都是 Claude Code **plugin** (marketplace 安装),实际是 **user-skill** (git clone 进 `~/.claude/skills/<x>/`),从不出现在 `installed_plugins.json`。
2. v3.4.1 假设 Claude Code plugin 的 slash command 形式是 `/<plugin>:<bare>`,实际是裸 `/x` —— plugin 的 `commands/<x>.md` 直接映射到 `/x`,无 `<plugin>:` 前缀 (实证: `code-review` plugin 的 `commands/code-review.md` → `/code-review`)。

因此 v3.4.1 整套 `/<ns>:<bare>` 渲染逻辑全错向。v3.4.2 重新设计 resolver: **不再 mutate cmd**,改成对 capability 做 presence-check,缺装就 emit warning。同时修 v3.4.1 引入的 5 个 mapping 错误 (`code-review` / `code-simplifier` / `frontend-design` / `ui-ux-pro-max` / `ralph-loop` 标错 impl)。

### Fixed

- **Resolver 不再 mutate cmd** — `resolveCapabilityCmd()` 返回 `{ renderedCmd: cmd 不变, warning?: 缺装提示 }`。capabilities.yaml 里 `cmd` 字段就是 verbatim 可调 slash command。
- **NEW `install_type` 字段** (`'plugin' | 'user-skill'`) — 与 `plugin_id` (plugin lookup) 或 `skill_dir` (user-skill lookup) 配对。omit `install_type` 跳过检查 (built-in / cli / mcp / sentinel)。
- **NEW `readInstalledUserSkills()`** — 扫 `~/.claude/skills/` 下 dir 名,返回 Set 用于 user-skill 检查。
- **`workflows/capabilities.yaml` 全面更正**:
  - 移除所有 `plugin_namespace` 字段 (60+ entry)。
  - mattpocock-skills 系列 (`grill-with-docs` / `zoom-out` / `diagnose` / `caveman` / `grill-me` / `to-prd` / `to-issues` / `improve-codebase-architecture` / `investigate`) → `install_type: user-skill, skill_dir: <bare cmd>` (每个是独立 dir)。
  - gstack 治理系列 (35+ entry) → `install_type: user-skill, skill_dir: gstack` (gstack 一个 umbrella skill,内部 subdir 提供各 slash command)。
  - gsd-* 系列 → `install_type: user-skill, skill_dir: gsd-<x>` (每个是独立 dir)。
  - **mapping 错误修正** (5 处 v3.4.1 写错):
    - `code-review` impl 改 `mattpocock-skills` → `plugin` (实际 `code-review@claude-plugins-official`)
    - `code-simplifier` impl 改 `mattpocock-skills` → `plugin` (实际 `code-simplifier@claude-plugins-official`)
    - `frontend-design` impl 改 `gstack` → `plugin` (实际 `frontend-design@claude-plugins-official`)
    - `ui-ux-pro-max` impl 改 `gstack` → `plugin` (实际 `ui-ux-pro-max@ui-ux-pro-max-skill`)
    - `ralph-loop` impl 改 `bundled-skill` → `plugin` + cmd 改 `ralph-loop` → `/ralph-loop` (实际 `ralph-loop@claude-plugins-official`)
- **18 sub-workflow SKILL.md `## How to invoke` 段重写** — 老 v3.4.1 段说 "install missing plugin... namespaced cmd" 全错。新版讲清两种 install path (`claude plugin install <name>` for plugins / git clone for user-skills)。
- **`src/workflow/schema/capabilities.ts`** — 新增 Optional `install_type` (Union literal) + `plugin_id` + `skill_dir`;`plugin_namespace` 保留为 deprecated Optional (向后兼容,resolver 已不读)。

### Why

v3.4.1 用户实际 dogfood 测试发现两条核心架构假设错误。装 gstack 的官方方式是 `git clone https://github.com/garrytan/gstack.git ~/.claude/skills/gstack`,产生 user-skill 而非 plugin,故 v3.4.1 看不到 gstack 装了,把可正常调用的 `/review` 误写成不存在的 `/gstack:review`。同样错误也影响 mattpocock skills (`/diagnose` / `/zoom-out` 等)。

### Changed

- `src/cli/lib/capabilityResolver.ts` — 完全重写;新 API `resolveCapabilityCmd(cap, plugins, userSkills)` 三参,`readInstalledUserSkills()` 新增。
- `src/cli/lib/renderSkillTemplates.ts` — `renderSkillFile()` 和 `renderAllSkills()` 都接 user-skill set 透传。
- `tests/unit/capability-resolver.test.ts` — 重写 (21 cell,涵盖 plugin/user-skill 检测 + cmd 不变断言 + dedup warning + mixed install types)。

### Dual-install support ("互为补充" — same-release increment)

- **`install_type` 字段接受 string 或 array**(schema + resolver + 5 新 test cell)。
  - 单值(原行为):`install_type: plugin` 或 `install_type: user-skill` — 只检查那一条 path。
  - 数组形式:`install_type: [user-skill, plugin]` + 同时填 `plugin_id` 和 `skill_dir`。Resolver 探测每条 declared path,**任一 detected 即 OK 无 warning**;**仅当 ALL declared paths 全 miss 时 emit 合并 warning**,以 `[multi]` 前缀 + ` OR ` 连接每条 install hint。
  - 同一 capability 重复 type 自动 dedup(防 `['plugin','plugin']` 生成重复 hint)。
- **首个示范 entry**: `caveman`(`workflows/capabilities.yaml:71`)— caveman 同时以 user-skill (git clone repo 到 `~/.claude/skills/caveman/`) 和 plugin (`caveman@caveman`) 两种方式发布,resolver 任一 detected 即 OK。
- **未来扩展**:其他同时支持 plugin + user-skill 两种安装的 capability(如可能的 superpowers / planning-with-files / ralph-loop)由 future PR 按需添加 array `install_type`。Schema 已 ready。
- **Schema change**:`install_type` 类型从 `Type.Union([plugin, user-skill])` 扩展为 `Type.Union([plugin, user-skill, Type.Array(...)])`,additive、backward-compat(老 single-value entry 行为零变化)。

### Migration

旧 v3.4.1 用户重跑:

```bash
npm install -g harnessed@3.4.2 && harnessed setup
# 输出含: [A.5] rendered capability placeholders in 18/25 SKILL.md file(s)
# 若 gstack / mattpocock skills / gsd / 各 plugin 未装会输出 [plugin]/[user-skill] warning + 对应 install 提示
# 已装的会渲染裸 cmd (e.g. /review for gstack), 无 warning
```

### Verification snippet for users

After re-running `harnessed setup` post-v3.4.2:

- **若 gstack user-skill 已装** (`ls ~/.claude/skills/gstack/` exists) → SKILL.md 内 `## How to invoke` 渲染裸 `/review` (NOT `/gstack:review`),无 warning。
- **若 code-review plugin 已装** (`installed_plugins.json` 有 `code-review@*`) → 渲染裸 `/code-review`,无 warning。
- **若都未装** → 渲染裸 cmd + warning prefix `[plugin]` 或 `[user-skill]` 提示对应 install 方式。

### Files changed

- `src/cli/lib/capabilityResolver.ts` — REWRITTEN (presence-check, no cmd mutation)
- `src/cli/lib/renderSkillTemplates.ts` — signature accepts user-skill set
- `src/workflow/schema/capabilities.ts` — add `install_type` / `plugin_id` / `skill_dir` Optional
- `workflows/capabilities.yaml` — remove `plugin_namespace`, add `install_type` discriminator, fix 5 mapping errors
- 18 `workflows/<stage>/<sub>/SKILL.md` — `## How to invoke` section rewritten
- `tests/unit/capability-resolver.test.ts` — REWRITTEN (21 cell coverage)
- `package.json` — version 3.4.1 → 3.4.2
- `CHANGELOG.md` — this entry

## [3.4.1] - 2026-05-24 — Setup hotfix: capability namespace resolver + sub-workflow SKILL.md imperative invoke step

**升级一行指令**: `npm install -g harnessed && harnessed setup` (重跑 setup 触发 SKILL.md 模板渲染)

**Trigger**: user 反馈 v3.4.0 ship 后两个 bug — (1) `/verify-paranoid` 等 sub-workflow SKILL.md 加载后不真正 invoke gstack `/review`,源文件 `{{ capabilities.gstack-review.cmd }}` 字面模板从未在 install 时渲染。(2) gstack 实际以 Claude Code plugin 形式安装 (`gstack@<marketplace>`),真正可调 slash-cmd 是 `/gstack:review` 而非裸 `/review`,所以即便没模板 bug 静态 `/review` 也 resolve 不了。

### Fixed

- **`harnessed setup` 渲染 SKILL.md capability 占位符** — NEW Step A.5 在 Step A (cp workflow skills) 之后 Step C (Agent Teams enable) 之前,扫描每个安装好的 `~/.claude/skills/<x>/SKILL.md`, 正则替换 `{{ capabilities.<name>.cmd }}` 为 resolver 输出 (e.g. `/gstack:review` 当 plugin 已装, `/review` + warning 当未装)
- **NEW `src/cli/lib/capabilityResolver.ts`** (≤ 200L per karpathy hard limit) — `readInstalledPlugins()` 读 `~/.claude/plugins/installed_plugins.json` 解析 `<pluginName>@<marketplaceId>` 提取 namespace prefix Set; `resolveCapabilityCmd()` 5-rule 单 capability 渲染 (no_namespace / installed → namespaced / not_installed → bare + warn / already_namespaced / sentinel); `renderSkillBody()` 全 body 多 placeholder 渲染 + 警告去重
- **NEW `src/cli/lib/renderSkillTemplates.ts`** (~120L) — `loadCapabilities()` 解析 `workflows/capabilities.yaml` → CapabilityMap; `renderSkillFile()` 单文件 in-place 替换 + non-fatal error 处理; `renderAllSkills()` 顺序处理 25 skills + warning 聚合
- **`workflows/capabilities.yaml` Optional `plugin_namespace` 字段** (additive — 旧 consumer 忽略未知 key, schema v1 in-place extend NOT bump per Pattern A B.1) — 64 entry 加 field (impl=gstack / gsd / mattpocock-skills / claude-code-plugin / bundled-skill); 19 entry 不加 (impl=mcp / cli / npm-cli / claude-platform / harnessed-bundled / superpowers 已 pre-namespaced)
- **17 sub-workflow SKILL.md 加 `## How to invoke` section** — 模板 `Use the SlashCommand tool to run: \`{{ capabilities.<X>.cmd }}\`` 配 install-time 渲染,LLM 看到具体可执行 slash cmd 不再只看 declarative description
- `src/workflow/schema/capabilities.ts` — Optional `plugin_namespace` 字段加入 `CapabilityEntryBase` shape, 沿用 Pattern A B.1 in-place extend 不 bump schema version

### Why

v3.4.0 ship 时 setup 仅 `cp -r` 拷贝 workflow 目录到 `~/.claude/skills/`, 完全没渲染 SKILL.md 内的 Jinja-style 模板。LLM 加载 `verify-paranoid/SKILL.md` 看到 `{{ capabilities.gstack-review.cmd }}` 字面字符串,无法识别为 invocable slash cmd。即便修了模板渲染, gstack 是 Claude Code plugin 真正 cmd 是 `/<namespace>:<cmd>` 形式 (`gstack:review` 而非 `review`),所以需要双修。

### Changed

- `src/cli/setup.ts` — NEW Step A.5 `renderAllSkills()` invoke + i18n log line (`setup.step_a_render.complete` + `.warnings_header`); 17 sub-workflow SKILL.md (verify/{paranoid,code-review,qa,security,design,simplify,multispec,progress} + discuss/{strategic,phase,subtask} + plan/{architecture,phase} + task/{clarify,code,test,deliver} + retro) 加 `## How to invoke` section
- `messages/en.json` + `messages/zh-Hans.json` — 2 NEW key (`setup.step_a_render.complete` / `.warnings_header`)
- `tests/unit/capability-resolver.test.ts` NEW (16 cell): plugin file parsing (5 cell) + single resolve (5 cell) + body render (6 cell)

### Migration

旧 v3.4.0 user 重跑 `harnessed setup`:

```bash
npm install -g harnessed@3.4.1 && harnessed setup
# 输出含: [A.5] rendered capability placeholders in 17/25 SKILL.md file(s)
# 若 plugin 未装会输出 warnings + suggested install cmd
```

### Tests

- 1180 pass / 4 skip / 2 pre-existing baseline fail (research-v2 + special-purpose-fallback, 与本 hotfix 无关 — 早于 v3.4.0)
- baseline v3.4.0 1153 → +16 NEW capability-resolver + 11 modified existing SKILL.md fixture re-validate
- biome clean (3 pre-existing infos, capabilities literal key — 与本 hotfix 无关)
- tsc --noEmit: 0 error
- build success (cli.mjs 200KB)

### Files changed

- `src/cli/lib/capabilityResolver.ts` NEW
- `src/cli/lib/renderSkillTemplates.ts` NEW
- `src/cli/setup.ts` — Step A.5 wired
- `src/workflow/schema/capabilities.ts` — `plugin_namespace` optional field
- `workflows/capabilities.yaml` — 64 entry 加 `plugin_namespace`
- 17 `workflows/<stage>/<sub>/SKILL.md` — `## How to invoke` section
- `messages/en.json` + `messages/zh-Hans.json` — 2 NEW key
- `tests/unit/capability-resolver.test.ts` NEW (16 cell)
- `package.json` — version 3.4.0 → 3.4.1
- `CHANGELOG.md` — this entry

## [3.4.0] - 2026-05-21 — NEW CLI i18n (en + zh-Hans) + setup writes user lang + universal language discipline

**升级一行指令**: `npm install -g harnessed && harnessed setup` (重跑 setup auto-write user lang config)

**Trigger**: user 反馈 — "harnessed CLI 应该跨语言友好;workflow artifacts 也应根据 user 系统语言"。v3.0+ 一直是 zh-first,英文 user 终端 experience 弱。

### Added

- **CLI i18n stage 1** — harnessed setup/install/uninstall/doctor/backup/rollback/audit-log/research/execute-task/manifest-add/gc/status/resume 等 user-facing strings 双语 (en + zh-Hans);auto-detect via `process.env.LANG` / `Intl.DateTimeFormat`;`--lang en|zh-Hans` flag override;**未来加 ko / ja / fr 等只需 NEW `messages/<code>.json` + `detectLocale()` 加 1 行**
- **locale matching policy**: `zh-*` → `zh-Hans` (CN / TW / Hans 等);其他 (en / ko / ja / fr / 等) → `en` universal default
- NEW `src/i18n/index.ts` lightweight loader (~50L) + `messages/{en,zh-Hans}.json` string table (~80+ keys)
- NEW `src/cli/lib/enableUserLangInSettings.ts` (~80L) — setup 阶段写 `env.HARNESSED_USER_LANG` 到 `~/.claude/settings.json` (sister Q-AUDIT-5b root-level env.* schema + sister v3.3.1 Agent Teams enable pattern)
- `harnessed setup --user-lang en|zh-Hans` flag — 显式 override OS locale detect
- **NEW `README.md` = English default** (英文受众广), `README-cn.md` = 中文版本;两 README 顶部 language switcher (`English | 中文` toggle)
- ≥7 NEW regression fixture (zh-CN / zh-TW / ko / ja / fr / en / undefined locale detect + enableUserLang idempotent / backup / malformed JSON)

### Changed

- `workflows/disciplines/language.yaml` — "zh-Hans default" → **"follow `env.HARNESSED_USER_LANG`, fallback to user's current conversation language"** (universal, Claude Code naturally mirrors user input lang);technical jargon English-preserve sub-rule 保留;NEW cross-cultural humor adaptation sub-rule
- Sweep 13 CLI cmd + installer module console.log/error → `t(key, params)` 调用
- `setup` 加 Step D "User language preference detection + write env.HARNESSED_USER_LANG" (sister Step C Agent Teams enable pattern)

### Architecture: 加新语言扩展成本

- 加 Korean / Japanese / French / etc. 翻译只需:
  1. NEW `messages/<code>.json` (~80 key 翻译, ~2-3h)
  2. `detectLocale()` 加 1 行 regex (e.g., `if (/^ko\b/i.test(raw)) return 'ko'`)
  3. TS union type extend
  4. Tests fixture
  Total ~3-4h per language
- Workflow artifacts (findings.md / task_plan.md 等) 自动适配 — Claude polyglot 看 `env.HARNESSED_USER_LANG` 生成对应语言,**不需翻译 25 个 SKILL.md**

### Tests

- 1153 pass / 4 skip / 2 pre-existing baseline fail (research-v2 + special-purpose-fallback)
- baseline 1122 → +31 NEW i18n + enableUserLang fixture
- biome clean + tsc 0 error

### Migration

无 breaking — 旧 user 不带 flag → auto-detect OS locale 仍 work;CLI 输出可能从 zh 变 en (en 受众广 default),user 可:
1. 接受 default (en if non-zh locale)
2. 重跑 `harnessed setup` 让 detect locale 写 config
3. 手动 `--lang zh-Hans` 或改 settings.json 显式指定

## [3.3.1] - 2026-05-21 — Setup hotfix: auto-enable Agent Teams in ~/.claude/settings.json

**升级一行指令**: `npm install -g harnessed && harnessed setup` (重跑 setup auto-apply Agent Teams config)

**Trigger**: user 反馈 — "setup 检查 ~/.claude/settings.json 吗? 没有 CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1 需要添加或启用"。Agent Teams 是 Pattern A 3-teammate (Phase 3.3/3.4/3.5 ship 7 次用) + `/verify-multispec` 4-specialist Agent Teams Pattern C + masterOrchestrator delegates_to recursive 等关键 workflow 的前提, setup 不 auto-configure 导致 user 跑这些 workflow 时哑火 (TeamCreate / Agent Teams API 不可用)。

### Fixed

- **`harnessed setup` 自动 enable Agent Teams** — NEW Step C 在 Step A (workflow skills install) 之后 Step B (manifest install) 之前, 在 `~/.claude/settings.json` 写入 `env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS: "1"` (sister Q-AUDIT-5b root-level env.* schema LOCKED Phase 2.3 W0.5)
- 3 case 处理: (a) file 不存在 → create with key (b) file exists + key=1 → idempotent no-op (c) file exists 缺 key OR key !== "1" → backup original + merge add/update key
- backup 走 `~/.claude/harnessed/backups/settings.json.{ISO-ts}.bak` (sister v3.0.3 `getHarnessedRoot()` + `harnessedSubdir('backups')` SoT, `:` → `-` for Win filename safety verbatim sister backup.ts)
- atomic write 通过 `writeFile(tmpPath) + rename(tmpPath, realPath)` 防 partial write
- Non-destructive merge — 不动 file 其他 env / hooks / 其他 top-level key (sister 现有 config preserve)
- 任何 error (read/parse/write/backup fail) → warn + skip,**不阻断 setup** (sister fallback 铁律 1 透明声明)

### Why

Agent Teams Pattern A / Pattern C workflow (Phase 3.3/3.4/3.5 大量使用, masterOrchestrator delegates_to recursive + verify-multispec 4-specialist) 需 `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`。v3.3.0 ship 的 setup 仅 detect + warn (sister `warnIfAgentTeamsMissing`) 不 auto-enable, user 手动配置门槛过高。

### Changed

- `src/cli/lib/enableAgentTeamsInSettings.ts` NEW (≤80L per karpathy hard limit) — `enableAgentTeamsInSettings()` helper + 3 case branch + atomic write + backup
- `src/cli/setup.ts` — Step C invoke `enableAgentTeamsInSettings()` 在 Step A 后 Step B 前; 4 status log line (created / already-enabled / enabled+backup / warn skipped)
- `tests/unit/cli-lib-enableAgentTeams.test.ts` NEW (6 fixture): file-missing create / idempotent no-op / key=0 backup+flip / missing-key non-destructive merge / malformed JSON warn / write fail warn
- `tests/cli/setup.test.ts` — vi.mock fs/promises 加 `writeFile` / `rename` / `mkdir`; NEW cell 8 — Step C log line + A→C→B sequence assertion

### Migration

旧 v3.x user 重跑 `harnessed setup` 即可:

```bash
npm install -g harnessed && harnessed setup
# 输出含: [C] enabled Agent Teams in ~/.claude/settings.json (backup saved → ...)
# 或      [C] Agent Teams already enabled (~/.claude/settings.json) — 若已手动配置 idempotent no-op
# 或      [C] created ~/.claude/settings.json + enabled Agent Teams — 若 settings.json 不存在
```

如果你已手动配置 → idempotent no-op,不会重复写。如果 settings.json 已有其他 env key → non-destructive merge 不破坏。

### Tests

- 1122 pass / 5 skip / 2 pre-existing baseline fail (`research-v2` + `special-purpose-fallback` dogfood, baseline 同 v3.3.0 main, 与本 hotfix 无关)
- biome check: clean (3 pre-existing infos, capabilities literal key — 与本 hotfix 无关)
- tsc --noEmit: 0 error
- `node scripts/check-workflow-schema.mjs`: exit 0
- 新增 7 test (6 unit + 1 cell 8): baseline v3.3.0 1115 → v3.3.1 1122

### Files changed

- `src/cli/lib/enableAgentTeamsInSettings.ts` NEW
- `src/cli/setup.ts` — Step C wired
- `tests/unit/cli-lib-enableAgentTeams.test.ts` NEW
- `tests/cli/setup.test.ts` — vi.mock extend + cell 8
- `package.json` — version 3.3.0 → 3.3.1
- `CHANGELOG.md` — this entry

## [3.3.0] - 2026-05-21 — Cleanup: remove backward-compat flag aliases (BREAKING)

**升级一行指令**: `npm install -g harnessed` (无需重跑 setup)

**Trigger**: user 反馈 — "2 个 backward-compat alias 都是 24h 内 ship + 几乎无生产 user 在用, 清理 cost 0"。v3.0.1 `--apply` no-op alias + v3.1.0/3.2.0 `--pause-between-stages` 过渡完成, CLI surface 统一 single flag。

### BREAKING

- **Removed `--apply`** (v3.0.1 introduced as no-op backward-compat alias)。All CLI cmds (`install` / `uninstall` / `install-base` / `gc` / `manifest-add` / `research` / `execute-task`) 默认即 apply, 不需 flag。旧脚本 `harnessed install foo --apply` 改 `harnessed install foo`。
- **Removed `--pause-between-stages`** (v3.1.0 introduced, v3.2.0 renamed to `--staged`)。`/auto --staged` 唯一 stage-gate flag。
- **`validateNonInteractiveFlags` simplified to no-op** — `--non-interactive` 与 apply-immediate default 完全 compatible, 无需 `--apply` 或 `--dry-run` 显式;`--dry-run` 仍 opt-in preview。

### Changed

- 7 CLI cmd 删除 `--apply` flag declaration (sister setup.ts no-flag pattern 统一)
- `workflows/auto/{workflow.yaml,SKILL.md}` 删除 4 处 `--pause-between-stages` mention
- `masterOrchestrator.ts` + `masterOrchestrator-helpers.ts` 删除 alias parse logic + JSDoc 标 v3.3.0 cleanup
- README sweep — 删除 25 workflow 总览表 `/auto` Brief 中 `--pause-between-stages` alias mention
- Tests:删除 4 个 obsolete H1 gate test (gate now no-op) + 21 处 `--apply` test arg

### Migration

```bash
# v3.2.x (旧) — 仍 work as backward-compat alias
harnessed install foo --apply
/auto "需求" --pause-between-stages

# v3.3.0+ (新, 旧 flag 报 unknown option)
harnessed install foo                # default apply, 无需 flag
/auto "需求" --staged                 # 唯一 stage-gate flag
```

### Tests

- 1115 pass / 4 skip / 2 pre-existing baseline fail (`research-v2` + `special-purpose-fallback`, 与本次 cleanup 无关)
- biome clean + tsc 0 error
- 21 处 `--apply` arg + 4 obsolete H1 gate test 删除 (sed sweep batch + Edit per-file)

## [3.2.0] - 2026-05-21 — /auto enhancement: complexity gate + research/retro flow + flag rename

**升级一行指令**: `npm install -g harnessed` (无需重跑 setup, `--staged` 是 NEW flag alias; `--pause-between-stages` 仍 work as backward-compat alias)

**Trigger**: user 测试 v3.1.0 `/auto` 反馈 — 大需求自动 bail 进 discuss 但 UX 不够 explicit; auto mode user hands-off 没明示理解度 / 结束总结。v3.2.0 强化 super-master:complexity gate 1-shot judge + understanding check 强制 prompt + retro mandatory 强制总结。

### Added

- **`/auto` Phase 0 complexity assessment** — AI 1-shot judge 需求 size (small / medium / large)。large → prompt user 切换 `--staged` 模式 (每 stage 完停 review) or abort 建议手动 `/discuss`; small/medium 自动 continue default 模式
- **`/auto` Phase 0.5 understanding check** — complexity gate 后 prompt "对需求有清晰认知吗? [Y/n]"。n → 强制 spawn `/research` 多源调研 先,再 chain 进 `/discuss`; y → skip research 直接 `/discuss`
- **`/auto` Phase 5 `/retro` mandatory** — `/verify` 完成后 auto mode 末尾强制 spawn `/retro` (sister CLAUDE.md "项目 / 里程碑结束:可选跑 /retro" 但 auto hands-off scenario mandatory — 无 opt-out flag)
- **`--staged` flag** — short alias for `--pause-between-stages` (sister "staged rollout" 工程界熟概念,8 字符 ergonomic); `--pause-between-stages` 保留 backward-compat alias 不破旧脚本
- **6-stage cadence**: research (conditional gate) → discuss → plan → task → verify → retro (mandatory)
- **NEW `MasterRunOpts.assessComplexity` + `promptUserUnderstanding` + `prompter`** hooks — DI override 友好 (test fixture pattern verbatim); default impls in `masterOrchestrator-helpers.ts`
- **NEW `workflows/judgments/stage-routing.yaml` trigger** `auto-research-unclear` — gate ref for research conditional spawn (`fires_when: user_understanding_unclear == true`)
- 8 NEW regression fixture in `tests/workflow/masterOrchestrator.test.ts` (#32-39): complexity small/medium no-prompt / complexity large → staged switch on y / complexity large → abort on n / understanding y skip research / understanding n spawn research / retro mandatory 末尾 spawn / `--staged` flag alias works / `--pause-between-stages` alias backward-compat

### Changed

- `workflows/auto/workflow.yaml` delegates_to 加 2 row (research order 0 conditional gate + retro order 5 unconditional mandatory); 6-stage 总规模
- `workflows/auto/SKILL.md` — 反映 6-stage cadence + complexity gate + understanding check + retro mandatory + `--staged` rename
- `src/workflow/masterOrchestrator.ts` — extend `MasterRunOpts` 加 3 hook (assessComplexity + promptUserUnderstanding + prompter alias); pre-flight invoke `runAutoPreFlight()` before spawn loop (super-master `/auto` only); karpathy ≤200L hard limit hold via helpers.ts split
- `src/workflow/masterOrchestrator-helpers.ts` — 加 `defaultAssessComplexity` + `defaultPromptUserUnderstanding` + `runAutoPreFlight` (super-master pre-spawn hook)
- README.md — `/auto` 行 Brief 反映 6-stage; 🚀 快捷使用 加 `--staged` example; complexity gate 行加进抉择路由矩阵

### Migration

无 breaking — `--pause-between-stages` 仍 work as alias for `--staged`; default `/auto` 加 prompt 是 NEW interactive behavior 但不破 existing yaml/test。`--staged` 是 NEW shorter alias,8 字符 ergonomic。

### Tests

- Full suite 1119 pass / 4 skip / 2 pre-existing fail (research-v2 + special-purpose-fallback dogfood, baseline 与 NEW feature 无关)
- biome check: clean
- tsc --noEmit: 0 error
- `node scripts/check-workflow-schema.mjs`: exit 0
- masterOrchestrator.ts ≤200L hard limit hold via helpers split

### Files changed

- `workflows/auto/workflow.yaml` — delegates_to 4 → 6 row (research conditional + retro mandatory)
- `workflows/auto/SKILL.md` — 6-stage + complexity gate + understanding check + retro mandatory + `--staged` rename
- `workflows/judgments/stage-routing.yaml` — 加 `auto-research-unclear` trigger
- `src/workflow/masterOrchestrator.ts` — `MasterRunOpts` extend + pre-flight hook invoke
- `src/workflow/masterOrchestrator-helpers.ts` — defaults + runAutoPreFlight
- `tests/workflow/masterOrchestrator.test.ts` — 8 NEW fixture (#32-39)
- `README.md` — `/auto` Brief update + `--staged` example + complexity gate row
- `package.json` — version 3.1.0 → 3.2.0
- `CHANGELOG.md` — this entry

## [3.1.0] - 2026-05-21 — NEW /auto super-master orchestrator (4-stage continuous chain)

**升级一行指令**: `npm install -g harnessed` (v3.1.0 LATEST tag, 无需重跑 setup — setup --apply re-install bundled workflow 含 /auto)

**Trigger**: user 反馈 — "stage 内自动路由 + 整体 super-master 也自动"。v3.0.x 4 个 master `/discuss /plan /task /verify` 跨 stage 需手动串, 不便 trivial feature 开发场景。

### Added

- **NEW `/auto` super-master** (`workflows/auto/`) — 一行 `/auto` 自动 chain 4 stage (discuss → plan → task → verify serial order 1-4), 适合 trivial / well-defined feature OR hands-off use case
- `workflows/auto/workflow.yaml` (54L) + `workflows/auto/SKILL.md` — top-level standalone (sister `workflows/research/` + `workflows/retro/` layout) per ADR 0030 namespace policy D-02 LOCK bare slash cmd `/auto`
- `src/workflow/masterOrchestrator.ts` extend — 5th master `'auto'` literal + recursive spawn pattern (sister Phase 3.5 W0.1 verbatim); top-level invoke `/auto` spawn 4 stage-master `workflows/<sub>/auto/workflow.yaml` (一层抽象 verbatim — super-master → stage-master → sub-workflow)
- **NEW `MasterRunOpts`** interface (`pauseBetweenStages` boolean + `pauseFn` test DI override)
- **NEW `src/workflow/masterOrchestrator-helpers.ts`** (68L) — split per karpathy ≤200L hard limit; houses `resolveMasterYamlPath` + `resolveSubYamlPath` + `defaultSpawnDriver` + `defaultPauseFn` (readline stdin prompt)
- `--pause-between-stages` opt-in flag — 重现 v3.0.x stage gate UX (每 stage 完成停, 等用户 review/confirm 后跑下 stage); default 缺省 fail-fast continuous chain
- Fail-fast default — 任一 stage spawn throw 立即停 (NOT silent skip), `harnessed resume` 续
- K8 ctx single snapshot — top-level invoke 1 snapshot, 跨 4 stage-master spawn 同 reference (NOT re-snapshot per stage) — sister Phase 3.5 W0.1 pattern verbatim
- 6 NEW regression fixture in `tests/workflow/masterOrchestrator.test.ts` (#26-31): 4-stage serial spawn order / --pause-between-stages 4 calls / fail-fast halt / K8 ctx invariant / pause default off / top-level yaml path resolve
- `FLAT_TOP_LEVEL_MASTERS` set in `src/cli/lib/scan-nested.ts` — `'auto'` flagged isMaster=true (cosmetic `(master)` tag in setup output); `FLAT_LEGACY_KEEP` 加 `'auto'`
- `MASTER_NAMES` in `src/workflow/run.ts` 加 `'auto'` 让 master-detect 识别 super-master invoke

### Changed

- `src/workflow/masterOrchestrator.ts` — 197L → 199L (karpathy ≤200L hard limit hold)
- `tests/dogfood/cycle-4-verify.dogfood.test.ts` F9 — Path B contract static-verify 扫源码并 concat `masterOrchestrator.ts` + `masterOrchestrator-helpers.ts` (karpathy split 是 implementation detail not contract)
- workflow schema validation: workflow v3 count 23 → 24 (`/auto` cross-validate `delegates_to[].sub` ⊂ {discuss, plan, task, verify})

### Migration

无 breaking change。已有 4 master `/discuss /plan /task /verify` 不动 — 仍可独立 invoke。新增 `/auto` 是 opt-in NEW workflow。已有用户 `npm install -g harnessed@3.1.0` 即可,无需重跑 setup (re-run `harnessed setup` 才会 install `/auto` skill 到 `~/.claude/skills/auto/`)。

### Tests

- Full suite 1111 pass / 4 skip / 2 pre-existing fail (research-v2 + special-purpose-fallback dogfood, baseline v3.0.3 main 同 fail, 与此 NEW feature 无关)
- biome check: clean (0 errors, 3 unrelated infos in test files)
- tsc --noEmit: 0 error
- `node scripts/check-workflow-schema.mjs`: exit 0 (workflow v2=3 / v3=24 cross-validated)
- masterOrchestrator.ts 199L (karpathy ≤200L hard limit hold via helpers split)

### Files changed

- `workflows/auto/workflow.yaml` NEW (54L)
- `workflows/auto/SKILL.md` NEW (~95L)
- `src/workflow/masterOrchestrator.ts` — 5th master 'auto' literal + MasterRunOpts + pause hook fire (3 surgical edit, 199L hold)
- `src/workflow/masterOrchestrator-helpers.ts` NEW (68L) — split per karpathy ≤200L hard limit
- `src/workflow/run.ts` — `MASTER_NAMES` 加 `'auto'`
- `src/cli/lib/scan-nested.ts` — `FLAT_LEGACY_KEEP` 加 `'auto'` + NEW `FLAT_TOP_LEVEL_MASTERS` set
- `tests/workflow/masterOrchestrator.test.ts` — 6 NEW fixture (#26-31)
- `tests/dogfood/cycle-4-verify.dogfood.test.ts` — F9 static-scan concat helpers file
- `package.json` — version 3.0.3 → 3.1.0
- `CHANGELOG.md` — this entry

## [3.0.3] - 2026-05-21 — Setup hotfix part 2: `.harnessed/` → `~/.claude/harnessed/` + MCP verify fs-based

**升级一行指令**: `npm install -g harnessed@3.0.3` (无需重跑 setup;v2.0.1+ 用户 `~/.harnessed/` 自动 migrate 到 `~/.claude/harnessed/`)

**Trigger**: 2026-05-21 user report v3.0.2 ship 后 setup 仍 hit 2 类 fail (`PS C:\Program Files\Warp\> harnessed setup`):
- `chrome-devtools-mcp` / `exa-mcp` / `tavily-mcp` verify timeout — `verify exit -1 or '<name>' not in mcp list stdout: [timeout]` (v3.0.2 spawn-based verify 在 Windows 上 3 个 sequential `claude mcp add` 后冷启动超 15s 预算)
- `[B] failed  ?:` anonymous mkdir EPERM — `Error: EPERM: operation not permitted, mkdir 'C:\Program Files\Warp\.harnessed'` (state.json / checkpoints / audit.log 等仍 CWD-rooted,只有 backups v2.0.1 已 migrate)

### Fixed

- **Bug 1 (`.harnessed/` 主目录 EPERM in read-only CWD)** — 所有 harness-owned 状态目录从 `<cwd>/.harnessed/` 迁到 `~/.claude/harnessed/` (co-located with Claude Code state dir, sister `~/.claude/skills/` + `~/.claude.json`)。
  - **Root cause**: pre-v3.0.3 用 literal `.harnessed/...` 拼接 cwd-relative path。`updateInstalled(ctx.cwd, ...)` 在 verify 通过后写 `<cwd>/.harnessed/state.json` → 当 user CWD 是只读 (`C:\Program Files\Warp\`) mkdir 失败 → Promise.allSettled rejection 落到 `name: '?'` fallback。
  - **Fix**: NEW `src/installers/lib/harnessedRoot.ts` SoT helper `getHarnessedRoot()` + `harnessedSubdir(name)` + `harnessedFile(name)` 返回 `~/.claude/harnessed/...`。Sister v2.0.1 `getBackupRoot()` pattern verbatim,扩展到 8 surface (state.json + checkpoints/ + current-workflow.json + audit.log + governance.json + archive/ + .lock + backups/)。
  - **Migration** (auto): NEW `migrateLegacyHarnessedRoot()` 在 `src/cli.ts` startup 调用,detect `~/.harnessed/` (v2.0.1~v3.0.2 用户) 后 atomic rename 到 `~/.claude/harnessed/`。若 both exist,legacy → `~/.harnessed.legacy-bak/` 保留 + stderr warn (无数据丢失)。Idempotent 跨 CLI invocation。
- **Bug 2 (MCP verify spawn timeout)** — 3 处 `mcpStdioAdd.ts` / `mcpHttpAdd.ts` / `ccPluginMarketplace.ts` verify 步骤从 `spawn('claude', ['mcp', 'list'])` + stdout match 改用 fs-based check 直读 `~/.claude.json`。
  - **Root cause**: v3.0.2 已 fix Windows `grep` 不可用,但用 native spawn `claude mcp list` 仍超 15s 冷启动预算 (3 个 sequential MCP installer 后 process pool 耗尽)。实际 `claude mcp add --scope user` 已成功写 `~/.claude.json`,verify 只是 timeout 误报 fail。
  - **Fix**: NEW `src/installers/lib/readClaudeConfig.ts` — `readUserClaudeJson()` + `isMcpServerRegistered(name)` + `isPluginRegistered(name)`。fs.readFile + JSON.parse + check `mcpServers[name]` / `enabledPlugins[name]`。跨平台、即时、无 timeout 风险,ENOENT + malformed JSON 优雅返回 `{}`,EACCES 等其他错误 propagate (karpathy fail-loud)。

### Changed

- `src/installers/lib/harnessedRoot.ts` NEW — `getHarnessedRoot()` (返回 `~/.claude/harnessed`) + `harnessedSubdir(name)` + `harnessedFile(name)` + `migrateLegacyHarnessedRoot()` + `HARNESSED_ROOT_OVERRIDE` env var (test-only isolation)
- `src/installers/lib/readClaudeConfig.ts` NEW — `readUserClaudeJson()` + `isMcpServerRegistered()` + `isPluginRegistered()` (sister fs-based verify pattern)
- `src/installers/lib/backup.ts` — `getBackupRoot()` 路由通过 `harnessedSubdir('backups')` SoT (path 从 `~/.harnessed/backups/` 迁到 `~/.claude/harnessed/backups/`)
- `src/installers/lib/state.ts` — `statePath()` 用 `harnessedFile('state.json')` (cwd param 保留 signature backward-compat,但 ignore for path 计算)
- `src/checkpoint/state.ts` — STATE_PATH + LOCK_TARGET + lockfilePath 全部 lazy resolve 通过 `harnessedRoot` SoT (e2e test override 友好);`withLock()` 加 `mkdir(target, { recursive: true })` 确保 lock parent 存在
- `src/checkpoint/{engineHook,sigintTrap,template,archive,resume}.ts` — 全部 checkpoint / archive path 路由 `harnessedSubdir('checkpoints' / 'archive')` SoT
- `src/audit/log.ts` + `src/cli/audit-log.ts` — audit.log path 用 `harnessedFile('audit.log')` (lazy 函数 wrap)
- `src/cli/status.ts` — state.json + lock 路径用 `harnessedRoot` SoT
- `src/workflow/governance.ts` — governance.json path 用 `harnessedFile('governance.json')`
- `src/installers/mcpStdioAdd.ts` + `mcpHttpAdd.ts` + `ccPluginMarketplace.ts` — verify spawn 移除,改用 `isMcpServerRegistered()` / `isPluginRegistered()` fs check;error message 升级到 `not found in mcpServers map of ~/.claude.json` / `not found in enabledPlugins map`
- `src/cli.ts` — startup 显式调用 `migrateLegacyHarnessedRoot()` (legacy `~/.harnessed/` auto-migrate)

### Migration (auto)

v2.0.1~v3.0.2 用户已有 `~/.harnessed/` 目录 (`backups/` 等)。v3.0.3 ship 后 first `harnessed <any-cmd>` 触发 `migrateLegacyHarnessedRoot()`:

- **Case 1 (常见)**: 仅 `~/.harnessed/` 存在 → `fs.renameSync(~/.harnessed, ~/.claude/harnessed)` atomic move
- **Case 2**: 仅 `~/.claude/harnessed/` 存在 → no-op (fresh install)
- **Case 3 (rare)**: both exist → legacy → `~/.harnessed.legacy-bak/` 保留 + stderr warn (review manually if needed)
- **Case 4**: neither → no-op (fresh install,正常 first run 创建)

Filesystem error 不 catch-swallow (karpathy fail-loud),用户立刻看到 + 可手动修复。

### Tests

- **6 NEW regression fixture** for v3.0.3 contract:
  - `tests/unit/installers-lib-state.test.ts` + 1 cell — state path under `~/.claude/harnessed` NOT ctx.cwd (sister v2.0.1 backup regression)
  - `tests/unit/installers-mcpStdioAdd.test.ts` + 3 cells — fs-based verify (default valid mcpServers map / server missing / ENOENT graceful / malformed JSON graceful)
  - `tests/unit/installers-mcpHttpAdd.test.ts` + 2 cells — sister fs-based verify
  - `tests/unit/installers-ccPluginMarketplace.test.ts` + 1 cell — `enabledPlugins` map check
- **20 test fixture path updates** — assertion 全 cross-platform path regex (`\.claude[/\\]harnessed`) + `HARNESSED_ROOT_OVERRIDE` env-var isolation for e2e integration tests (`phase-3.1-e2e` / `plan-feature-wired` / `plan-feature-prefix-e2e`)
- Full suite 1105 pass / 4 skip / 2 pre-existing fail (research-v2 + special-purpose-fallback dogfood,baseline v3.0.2 main 同 fail,与 hotfix 无关)
- biome check: clean
- tsc --noEmit: 0 error
- `node scripts/check-workflow-schema.mjs`: exit 0

### Files changed

- `src/installers/lib/harnessedRoot.ts` NEW (149L)
- `src/installers/lib/readClaudeConfig.ts` NEW (101L)
- `src/installers/lib/backup.ts` — `getBackupRoot()` 路由 SoT
- `src/installers/lib/state.ts` — `statePath()` 用 SoT
- `src/checkpoint/{state,engineHook,sigintTrap,template,archive,resume}.ts` — 6 file path SoT 迁移
- `src/audit/log.ts` + `src/cli/audit-log.ts` + `src/cli/status.ts` + `src/workflow/governance.ts` — 4 file SoT 迁移
- `src/installers/{mcpStdioAdd,mcpHttpAdd,ccPluginMarketplace}.ts` — 3 file verify fs-based
- `src/cli.ts` — startup migration trigger
- `tests/unit/{installers-lib-state,installers-mcpStdioAdd,installers-mcpHttpAdd,installers-ccPluginMarketplace,installers-lib-backup}.test.ts` — 5 unit test fixture refresh
- `tests/{audit,checkpoint,workflow,cli}/...` — 8 test file path update
- `tests/integration/{installer-contract,phase-3.1-e2e,plan-feature-wired,plan-feature-prefix-e2e}.test.ts` — 4 e2e test HARNESSED_ROOT_OVERRIDE isolation
- `package.json` — version 3.0.2 → 3.0.3
- `CHANGELOG.md` — this entry

## [3.0.2] - 2026-05-21 — Setup hotfix: MCP scope + grep verify + install timeout + stale v2.0 strings

**升级一行指令**: `npm install -g harnessed@3.0.2` (无需重跑 setup;若之前 MCP install fail 可手动重跑 `harnessed setup`)

**Trigger**: 2026-05-21 user-reported `harnessed setup` 4 失败 (`PS C:\Windows\System32> npm install -g harnessed && harnessed setup`):
- `chrome-devtools-mcp` / `exa-mcp` failed: `claude mcp add exited 1: EPERM rename 'C:\Windows\System32\.mcp.json.tmp...' -> 'C:\Windows\System32\.mcp.json'`
- `tavily-mcp` failed: `verify exit 255 'grep' is not recognized as an internal or external command`
- `gsd` failed: `spawn timed out after 10000ms (cmd: npx --yes get-shit-done-cc@^1.41.0 install)`
- 末尾输出 STALE `harnessed v2.0 三层栈方法论 bundled — 4 workflows + 6 judgments + 37 capabilities ready` (v3.0 已 ship 23 workflows / 6 disciplines / 10 judgments / 83 capabilities)

### Fixed

- **Bug 1 (MCP EPERM in read-only CWD)** — `mcpStdioAdd.ts` / `mcpHttpAdd.ts` / `ccPluginMarketplace.ts` 3 处 `claude mcp add` / `claude plugin install` 从 `--scope project` flip 到 `--scope user`。
  - **Root cause**: `--scope project` 写 `<cwd>/.mcp.json` 到 spawn cwd;user 在 `C:\Windows\System32` 跑 `harnessed setup` → EPERM。pre-v3.0.2 `CC #54803` "user scope broken" 注释假设已过时 (CC team 已修复 user scope read-back;verified via `claude mcp add --help` 2026-05-21)。
  - **Fix**: `--scope user` 写 `~/.claude.json` user-global config — CWD-independent + cross-project shared (harnessed setup 是 onboarding 命令,MCP 应该跨项目可用,不该 scope 到 ephemeral CWD)。
- **Bug 2 (Windows `grep` not found)** — 3 处 installer verify step 从 `claude mcp list | grep -q <name>` shell pipe 改用 `spawn('claude', ['mcp', 'list'])` + Node `stdout.includes(name)`。
  - **Root cause**: `grep` 在 Windows cmd.exe / PowerShell 默认不可用 (只 Git-Bash/WSL/MSYS2 有);verify exit 255 `'grep' is not recognized`。
  - **Fix**: Node 内置 string-contains,跨平台,无 extra shell fork。`ccPluginMarketplace` verify 改用 `claude plugin list --json` + `stdout.includes(pluginName)`。
- **Bug 3 (install spawn 10s timeout)** — `src/installers/lib/spawn.ts` `spawnCmd` 新增 explicit `timeoutMs` 参数;3 个 installer (`npmCli` / `gitCloneWithSetup` / `npxSkillInstaller`) 显式传 `DEFAULT_INSTALL_TIMEOUT_MS = 60_000ms` (install) 和 `verify.timeout_ms ?? DEFAULT_VERIFY_TIMEOUT_MS = 15_000ms` (verify)。
  - **Root cause**: pre-v3.0.2 `spawnCmd` 用 `spec.verify.timeout_ms ?? 15000ms` for BOTH install + verify。gsd manifest verify.timeout_ms=10000ms 是 `npx --version` fast verify 用,但被 install spawn 错读 → 10s 不够 Windows cold npm/npx 装 `get-shit-done-cc` (实测 30-45s)。
  - **Fix**: install + verify 用 separate timeout default (install 60s / verify 15s);manifest authors 仍可 override verify.timeout_ms。
- **Bug 4 (STALE v2.0 strings + private rules ref)** — 4 处 user-visible message:
  - `src/cli/setup.ts:142` `harnessed v2.0 三层栈方法论 bundled — 4 workflows + 6 judgments + 37 capabilities ready` → `harnessed v3.0 ... — 23 workflows (4 master + 18 sub + 1 standalone) + 6 disciplines + 10 judgments + ~83 capabilities ready`
  - `src/cli/lib/setup-helpers.ts:41` `harnessed v2.0 ... (sister ~/.claude/rules/agent-teams.md)` → `harnessed v3.0 ...` 删除 maintainer-private rules ref (用户不知道作者 `~/.claude/rules/` 内容)
  - `workflows/defaults.yaml:1` + `workflows/capabilities.yaml:1` yaml header `harnessed v2.0` → `harnessed v3.0`

### Changed

- `src/installers/lib/spawn.ts` — `spawnCmd(ctx, cmd, args, timeoutMs?)` 新 4th 参数;`DEFAULT_INSTALL_TIMEOUT_MS = 60_000` + `DEFAULT_VERIFY_TIMEOUT_MS = 15_000` exported
- `src/installers/lib/safeCwd.ts` NEW — `getMcpSpawnCwd()` returns `homedir()` (sister v2.0.1 `getBackupRoot()` 单一 SoT pattern);MCP installer spawn cwd 用它避免 read-only CWD EPERM
- `src/installers/mcpStdioAdd.ts` / `mcpHttpAdd.ts` / `ccPluginMarketplace.ts` — 3 处 `--scope project` → `--scope user`;diff plan target 从 `<cwd>/.mcp.json` (PROJECT) / `<cwd>/.claude/settings.json` 改成 `<homedir>/.claude.json` (HOME);verify shell-grep-pipe 改用 native spawn + Node stdout match;idempotent error string check 从 `'already exists in .mcp.json'` 放宽到 `'already exists'`
- `src/installers/npmCli.ts` / `gitCloneWithSetup.ts` / `npxSkillInstaller.ts` — spawnCmd 调用显式传 install timeout 60s + verify timeout 15s
- `tests/unit/installers-mcpStdioAdd.test.ts` / `installers-mcpHttpAdd.test.ts` / `installers-ccPluginMarketplace.test.ts` — assertion flip `'project'` → `'user'` + explicit `not.toContain('--scope project')` + `appliedFiles endsWith '.claude.json'` + `not.toContain('grep')` regression fixture
- `tests/unit/installers-lib-spawn.test.ts` — 2 NEW regression fixture (timeoutMs override honored + default 60s not 15s)

### Migration

旧用户升级仅 `npm install -g harnessed@3.0.2` 即可,无 schema 变更。若之前 `harnessed setup` Step B fail,可手动重跑;`harnessed install <name>` 单 manifest 重装也可。MCP 注册位置从 project-local `.mcp.json` 迁到 user-global `~/.claude.json` — Claude Code 跨项目自动读到 (不需手动迁移 .mcp.json)。

### Files changed

- `src/installers/lib/spawn.ts` — explicit `timeoutMs` 4th arg + 2 exported default const
- `src/installers/lib/safeCwd.ts` NEW — `getMcpSpawnCwd()` (sister `backup.ts` `getBackupRoot()` pattern)
- `src/installers/mcpStdioAdd.ts` / `mcpHttpAdd.ts` / `ccPluginMarketplace.ts` — `--scope user` + native verify + homedir spawn cwd
- `src/installers/npmCli.ts` / `gitCloneWithSetup.ts` / `npxSkillInstaller.ts` — explicit timeout caller args
- `src/cli/setup.ts` + `src/cli/lib/setup-helpers.ts` — v2.0 → v3.0 string update + remove private rules ref
- `workflows/defaults.yaml` + `workflows/capabilities.yaml` — yaml header v2.0 → v3.0
- `tests/unit/installers-{mcpStdioAdd,mcpHttpAdd,ccPluginMarketplace,lib-spawn}.test.ts` — fixture flip + NEW regression cells
- `package.json` — version 3.0.1 → 3.0.2

## [3.0.1] - 2026-05-21 — Default behavior unified to apply-immediate (UX hotfix)

**升级一行指令**: `npm install -g harnessed@3.0.1` (无需重跑 `setup`,纯 CLI behavior flip)

**Trigger**: 2026-05-21 终端用户反馈 — "dry-run 是高级用户概念,默认应 apply"。v3.0.0 ship < 1 hour ago 全 CLI command 默认 dry-run + `--apply` opt-in 与 `setup` (v1.0.2 apply-immediate redesign 沿袭) 不一致。Sister `setup.ts` pattern (L5-7 IMPL NOTE) 验证 apply-immediate 是正确 default。

### Changed

- **`harnessed install` / `uninstall` / `install-base` / `gc` / `manifest-add` / `research` / `execute-task` 默认从 dry-run 改 apply (immediate write)** — sister `setup.ts` pattern verbatim,跨命令统一 setup-first UX
- **`--dry-run` flag 仍 opt-in** 高级用户预览
- **`--apply` 保留 backward-compat no-op alias** — 旧脚本仍 work (不破)
- **`uninstall --yes + --dry-run` 互斥** — 新 H1 gate 替代旧 "--yes requires --apply" 检查 (semantic clearer: `--yes` skip prompt 与 `--dry-run` preview-only 互不兼容)
- **`harnessed uninstall <name>` no-flag 仍 protect destructive op** — interactive p.confirm() default No,user 必须 y/yes 才真删

### Why

- 终端用户反馈 — "dry-run 是高级用户概念,默认应 apply"
- `setup-first UX` 跨命令统一 (sister setup.ts v1.0.2 redesign 沿袭 verbatim)
- destructive op safety contract 不变 (uninstall confirm prompt + gc keepLast + backup 机制全保留)

### Migration

旧脚本如 `harnessed install foo --apply` 仍 work (no-op alias);新脚本无需 `--apply`;需 preview 用 `--dry-run`:

```bash
# v3.0.0 (旧)
harnessed install foo --apply        # 必须传 --apply 才真装
harnessed install foo                # dry-run preview 默认

# v3.0.1 (新)
harnessed install foo                # 默认立即装 (NEW default)
harnessed install foo --dry-run      # opt-in preview
harnessed install foo --apply        # 仍 work (legacy no-op alias)
```

### Tests

- **6 NEW regression fixture** verify flipped default behavior + backward-compat `--apply` alias:
  - `tests/unit/cli-install.test.ts` + 2 cells (immediate default + --dry-run opt-in)
  - `tests/cli/uninstall.test.ts` Cell 1+3 flipped + Cell 15-16 NEW (no-flag immediate + legacy --apply alias)
  - `tests/cli/manifest-add-ee5.test.ts` + Cell 7 (no-flag immediate persist)
  - `tests/cli/execute-task.test.ts` + Cell 9 (legacy --apply alias still wires through hook)

### Files changed

- `src/cli/install.ts` + `uninstall.ts` + `install-base.ts` + `gc.ts` + `manifest-add.ts` + `research.ts` + `execute-task.ts` — 7 CLI cmd flipped
- `src/cli/lib/validateFlags.ts` — H1 gate 注释 v3.0.1 update
- `tests/{unit,cli}/*.test.ts` — 6 NEW regression fixture
- `package.json` — version 3.0.0 → 3.0.1
- `CHANGELOG.md` — this entry

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
