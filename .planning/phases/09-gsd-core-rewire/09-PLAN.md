---
phase: 09-gsd-core-rewire
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - workflows/capabilities.yaml
  - workflows/judgments/stage-phase-gate.yaml
autonomous: true
requirements:
  - REQ-v51-gsd-rewire
  - REQ-v51-gsd-judgments
  - REQ-v51-validation
must_haves:
  truths:
    - "All 12 new GSD Core capabilities resolve from workflows/capabilities.yaml under schema harnessed.capabilities.v1"
    - "The 4 stage-phase capabilities (spec/ui/secure/ai-integration) are referenced by judgments triggers that cross-validate green against capabilities.yaml"
    - "gsd-execute-phase is NOT present anywhere (keystone: execute mechanism stays harnessed self-owned)"
    - "No pre-existing capabilities.yaml entry is mutated (additive only); 1158-test baseline holds with no regression"
  artifacts:
    - path: "workflows/capabilities.yaml"
      provides: "12 new gsd-* capability entries mirroring the gsd-discuss-phase shape (Bucket 10)"
      contains: "gsd-spec-phase:"
    - path: "workflows/judgments/stage-phase-gate.yaml"
      provides: "4 stage-gated triggers invoking the spec/ui/secure/ai-integration capabilities"
      contains: "schema_version: harnessed.judgment.v1"
  key_links:
    - from: "workflows/judgments/stage-phase-gate.yaml"
      to: "workflows/capabilities.yaml"
      via: "invokes[].capability cross-validation (check-workflow-schema Contract 3)"
      pattern: "capability: gsd-(spec|ui|secure|ai-integration)-phase"
---

<objective>
Additively wire 12 new GSD Core (@opengsd/gsd-core 1.4.1) capabilities into the harnessed
static capability manifest, and stage-gate the 4 design-contract phase capabilities via a new
parallel judgments trigger file. Pure composition-manifest config change: no runtime, resolver,
or architecture change.

Purpose: GSD upstream renamed to @opengsd/gsd-core and reorganized its skills. harnessed is the
composition orchestrator — its maintainer-curated manifest must describe the new upstream surface
so workflow.yaml templates and judgments gates can reference the 12 new GSD entry points.

KEYSTONE (do NOT violate): `gsd-execute-phase` is deliberately NOT wired. The execute mechanism
stays harnessed self-owned. No task in this plan may add it.

Output:
- 12 new entries in workflows/capabilities.yaml (Bucket 10 block)
- 1 new file workflows/judgments/stage-phase-gate.yaml (4 triggers)
- green gate: capability-resolver + check-workflow-schema + manifest-validate + biome + tsc + targeted vitest
</objective>

<execution_context>
@$HOME/.claude/gsd-core/workflows/execute-plan.md
@$HOME/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/ROADMAP.md
@.planning/REQUIREMENTS.md

# The canonical pattern every new entry MUST mirror (verbatim shape, gsd-discuss-phase L264-273):
@workflows/capabilities.yaml

# The schema contract the new judgments file MUST satisfy (JudgmentTriggersFile, additionalProperties:false):
@src/workflow/schema/judgment.ts

# The cross-validation the new judgments triggers MUST pass (Contract 3 cells 8/9):
@tests/scripts/check-workflow-schema.test.ts

# Existing trigger-file pattern to copy (root key `triggers`, per-trigger description/fires_when/skips_when/invokes):
@workflows/judgments/phase-gate.yaml
@workflows/judgments/strategic-gate.yaml
</context>

<reference_grounding>
All references below were grep/Read-verified on 2026-06-09 (per project CLAUDE.md spec-writing checklist):

- workflows/capabilities.yaml — ✓ existing, 1024 lines, schema_version: harnessed.capabilities.v1 (L29), buckets 1-9, tail is Bucket 9 gsd-explore. The 12 target keys grep to ZERO matches in workflows/ (additive confirmed; only comment-line mentions of gsd-new-project / gsd-execute-phase exist).
- gsd-discuss-phase entry shape — ✓ existing, capabilities.yaml L264-273: keys impl / install_type / skill_dir / cmd / since / category / description / fires_when (list).
- workflows/judgments/phase-gate.yaml — ✓ existing, schema_version: harnessed.judgment.v1, root key `triggers`, per-trigger description/fires_when/skips_when/invokes[].capability.
- src/workflow/schema/judgment.ts — ✓ existing, JudgmentTrigger allows only {description, fires_when, skips_when, invokes, requires, wraps} with additionalProperties:false; JudgmentTriggersFile = {schema_version literal, triggers record}.
- tests/scripts/check-workflow-schema.test.ts — ✓ existing, Contract 3 (cells 8/9): judgments invokes[].capability MUST be ⊂ capabilities.yaml or exit 1; cell 14 proves NEW judgment files ARE validated.
- tests/unit/capability-resolver.test.ts — ✓ existing, tmpdir-based, does NOT pin capabilities.yaml entry count (no fixture coupling to entry list).
- scripts/check-workflow-schema.mjs — ✓ existing (invoked by the schema test via HARNESSED_CHECK_ROOT).
- package.json script "validate:schema" → scripts/validate-schema.mjs — ✓ existing (L61).
- workflows/judgments/stage-phase-gate.yaml — NEW (this plan creates it).
- Bucket 10 comment block in capabilities.yaml — NEW (this plan appends it).
</reference_grounding>

<tasks>

<task type="auto">
  <name>Task 1: Append 12 GSD Core 1.4.1 capabilities to capabilities.yaml (Bucket 10)</name>
  <files>workflows/capabilities.yaml</files>
  <read_first>
    - workflows/capabilities.yaml L264-273 (gsd-discuss-phase — the EXACT shape to mirror) and L1-29 (header bucket-list comment convention)
    - workflows/capabilities.yaml tail (Bucket 9 gsd-explore, ~L1000-1024) — append AFTER it
  </read_first>
  <action>
    Append a new "Bucket 10 — GSD Core 1.4.1 additive rewire (v5.1)" comment-banner block (same
    `# ===...` banner style as existing buckets) to the END of the `capabilities:` map in
    workflows/capabilities.yaml, then add the 12 entries below. Each entry mirrors the
    gsd-discuss-phase shape verbatim: keys in order impl / install_type / skill_dir / cmd / since /
    category / description / fires_when. For ALL 12: impl: gsd, install_type: user-skill,
    category: tool-slash-cmd, since: v5.1. skill_dir == cmd basename (already verified to exist on
    disk at ~/.claude/skills/<skill_dir>/ on 2026-06-09). fires_when is a YAML list (one item)
    using the LOCKED expressions below (expr-eval 2.0.2 case-sensitive: keywords and/or/in all
    lowercase, consistent with existing entries).

    The 12 entries (key | skill_dir==cmd-basename | fires_when expr | description gist):
    1. gsd-spec-phase | gsd-spec-phase | "phase.stage == 'plan' and phase.requires_spec == true" | SDD spec lock (sister judgments/stage-phase-gate.yaml)
    2. gsd-ui-phase | gsd-ui-phase | "phase.has_ui_changes == true" | UI design contract (sister stage-phase-gate.yaml)
    3. gsd-secure-phase | gsd-secure-phase | "phase.has_auth_or_secrets == true" | security threat-model gate (sister stage-phase-gate.yaml)
    4. gsd-ai-integration-phase | gsd-ai-integration-phase | "phase.builds_ai_system == true" | AI-SPEC design contract (sister stage-phase-gate.yaml)
    5. gsd-ingest-docs | gsd-ingest-docs | "phase.type == 'onboarding'" | bootstrap .planning from existing docs (cc-handoff Ideation->Onboarding)
    6. gsd-new-project | gsd-new-project | "phase.type == 'new_project'" | greenfield project init
    7. gsd-new-milestone | gsd-new-milestone | "phase.type == 'new_milestone'" | brownfield milestone start
    8. gsd-extract-learnings | gsd-extract-learnings | "phase.is_milestone_close == true" | extract decisions/lessons from completed phase
    9. gsd-audit-milestone | gsd-audit-milestone | "phase.is_milestone_close == true" | milestone completion audit
    10. gsd-complete-milestone | gsd-complete-milestone | "phase.is_milestone_close == true" | archive completed milestone
    11. gsd-milestone-summary | gsd-milestone-summary | "phase.is_milestone_close == true" | milestone summary
    12. gsd-docs-update | gsd-docs-update | "phase.needs_doc_update == true" | post-ship doc update

    Use the cmd value `/<skill_dir>` for each (e.g. cmd: /gsd-spec-phase). Match the header
    bucket-count comment style only if you also update the count; if updating the L11 "Entry
    buckets" count comment risks drift, leave the header narrative untouched and ONLY add the new
    banner + entries (additive; do NOT rewrite the existing header enumeration — it already
    under-counts at "total 35" vs actual entries, so do not introduce a new inconsistency).

    KEYSTONE GUARD: do NOT add gsd-execute-phase. Do NOT mutate any existing entry.
  </action>
  <verify>
    <automated>node -e "const y=require('js-yaml');const c=y.load(require('fs').readFileSync('workflows/capabilities.yaml','utf8')).capabilities;const need=['gsd-spec-phase','gsd-ui-phase','gsd-secure-phase','gsd-ai-integration-phase','gsd-ingest-docs','gsd-new-project','gsd-new-milestone','gsd-extract-learnings','gsd-audit-milestone','gsd-complete-milestone','gsd-milestone-summary','gsd-docs-update'];const miss=need.filter(k=>!c[k]);if(miss.length)throw new Error('missing '+miss);if(c['gsd-execute-phase'])throw new Error('KEYSTONE VIOLATION: gsd-execute-phase present');for(const k of need){const e=c[k];if(e.impl!=='gsd'||e.install_type!=='user-skill'||e.skill_dir!==k||e.cmd!=='/'+k||e.since!=='v5.1'||e.category!=='tool-slash-cmd'||!e.description||!Array.isArray(e.fires_when))throw new Error('bad shape '+k)}console.log('T1 OK 12/12')"</automated>
  </verify>
  <acceptance_criteria>
    - `grep -c '^  gsd-spec-phase:' workflows/capabilities.yaml` == 1 (and same for each of the other 11 keys)
    - `grep -c '^  gsd-execute-phase:' workflows/capabilities.yaml` == 0 (keystone)
    - The T1 automated node assertion above prints "T1 OK 12/12"
    - `git diff workflows/capabilities.yaml` shows ONLY additions (no `-` lines on pre-existing entries)
  </acceptance_criteria>
  <done>All 12 keys present with correct mirrored shape, gsd-execute-phase absent, diff is purely additive.</done>
</task>

<task type="auto">
  <name>Task 2: Create stage-phase-gate.yaml judgments triggers for the 4 design-contract capabilities</name>
  <files>workflows/judgments/stage-phase-gate.yaml</files>
  <read_first>
    - workflows/judgments/phase-gate.yaml (whole file — copy this trigger-file shape exactly)
    - workflows/judgments/strategic-gate.yaml (multi-trigger example with skips_when)
    - src/workflow/schema/judgment.ts L36-67 (JudgmentTrigger allows ONLY description/fires_when/skips_when/invokes/requires/wraps; additionalProperties:false)
  </read_first>
  <action>
    Create NEW file workflows/judgments/stage-phase-gate.yaml. Root: `schema_version:
    harnessed.judgment.v1` then `triggers:` map. Add exactly 4 triggers, one per design-contract
    capability, replicating the gsd-discuss-phase dual-pattern (capabilities fires_when + sister
    judgments trigger) ONLY for these 4 where it genuinely fits (these are stage/condition-gated
    design contracts, parallel to phase-gate.yaml's gsd-discuss-phase). Each trigger uses ONLY the
    schema-allowed keys: description (multiline ok), fires_when (string expr — MUST match the
    capabilities.yaml fires_when expression for the same capability verbatim), and invokes (list of
    {capability: <key>}).

    The 4 triggers:
    - gsd-spec-phase: fires_when "phase.stage == 'plan' and phase.requires_spec == true" → invokes capability gsd-spec-phase
    - gsd-ui-phase: fires_when "phase.has_ui_changes == true" → invokes capability gsd-ui-phase
    - gsd-secure-phase: fires_when "phase.has_auth_or_secrets == true" → invokes capability gsd-secure-phase
    - gsd-ai-integration-phase: fires_when "phase.builds_ai_system == true" → invokes capability gsd-ai-integration-phase

    DO NOT add triggers for the other 8 capabilities (ingest/new-project/new-milestone/milestone-close
    cluster/docs-update): their capabilities.yaml fires_when suffices and there is no existing
    stage-gate schema slot that fits them without inventing one (locked decision: do not invent
    triggers that don't fit the existing schema). DO NOT modify any of the existing 11 judgments
    files — this is a new parallel file only. Header comment: brief, mirror phase-gate.yaml's header
    style (file path + one-line purpose + "Pairs with: GSD design-contract phase skills").

    This task depends on T1 (the 4 capability keys must already exist in capabilities.yaml, else
    check-workflow-schema Contract 3 fails). Run T1 first.
  </action>
  <verify>
    <automated>node -e "const y=require('js-yaml');const j=y.load(require('fs').readFileSync('workflows/judgments/stage-phase-gate.yaml','utf8'));if(j.schema_version!=='harnessed.judgment.v1')throw new Error('schema_version');const t=j.triggers;const need=['gsd-spec-phase','gsd-ui-phase','gsd-secure-phase','gsd-ai-integration-phase'];if(Object.keys(t).length!==4)throw new Error('expected 4 triggers got '+Object.keys(t).length);for(const k of need){const tr=t[k];if(!tr)throw new Error('missing '+k);if(!Array.isArray(tr.invokes)||tr.invokes[0].capability!==k)throw new Error('bad invoke '+k);if(typeof tr.fires_when!=='string')throw new Error('fires_when '+k);for(const key of Object.keys(tr))if(!['description','fires_when','skips_when','invokes','requires','wraps'].includes(key))throw new Error('illegal key '+key+' in '+k)}console.log('T2 OK 4/4')"</automated>
  </verify>
  <acceptance_criteria>
    - File workflows/judgments/stage-phase-gate.yaml exists with schema_version: harnessed.judgment.v1
    - Exactly 4 triggers, each invoking its matching capability key; no extra/illegal keys (additionalProperties:false honored)
    - The T2 automated node assertion prints "T2 OK 4/4"
    - No other workflows/judgments/*.yaml file is modified (git status shows only the new file added)
  </acceptance_criteria>
  <done>New stage-phase-gate.yaml validates against JudgmentTriggersFile and references the 4 new capabilities verbatim.</done>
</task>

<task type="auto">
  <name>Task 3: Green gate — schema cross-validate + manifest-validate + biome + tsc + targeted vitest</name>
  <files>(no source files modified — verification only)</files>
  <read_first>
    - package.json scripts (validate:schema → scripts/validate-schema.mjs; lint/typecheck/test scripts)
  </read_first>
  <action>
    Run the full green gate proving the additive change is consistent and regression-free. Fix any
    failure by correcting T1/T2 output (NOT by mutating tests or pre-existing entries). Specifically:
    1. check-workflow-schema cross-validation (Contract 3: every new judgments invokes[].capability ∈ capabilities.yaml).
    2. manifest schema validate (capabilities.yaml still parses under harnessed.capabilities.v1).
    3. capability-resolver unit tests green (no fixture coupling, should pass unchanged).
    4. biome check (TS/JS none changed but run repo-wide per project memory — yaml not biome-scoped, so expect clean).
    5. tsc / typecheck clean (no .ts changed; must stay green).
    6. Full vitest run: 1158-test baseline holds, zero regressions, zero new failures.

    If tests/fixtures contain a capabilities snapshot/fixture that pins the entry list (grep
    tests/fixtures for capabilities), sync it; the reference grounding found NO such fixture, so this
    is expected to be a no-op — but verify before declaring done.
  </action>
  <verify>
    <automated>pnpm exec vitest run tests/unit/capability-resolver.test.ts tests/scripts/check-workflow-schema.test.ts</automated>
  </verify>
  <acceptance_criteria>
    - `pnpm exec vitest run tests/unit/capability-resolver.test.ts tests/scripts/check-workflow-schema.test.ts` → all green
    - `node scripts/validate-schema.mjs` (or `pnpm run validate:schema`) → exit 0
    - `pnpm exec biome check` → clean (no new diagnostics)
    - `pnpm exec tsc --noEmit` → exit 0
    - `pnpm exec vitest run` → full suite green, total >= 1158 passing, 0 failures (baseline + this phase's new schema assertions, if any test counts them)
    - `grep -rl 'gsd-spec-phase\|gsd-execute-phase' tests/fixtures` → no fixture needs gsd-execute-phase; any capabilities fixture (if found) synced
  </acceptance_criteria>
  <done>All gates green; 1158-test baseline preserved with zero regression; manifest + judgments cross-validate exit 0.</done>
</task>

</tasks>

<verification>
Phase-level checks (run after all 3 tasks):
- `pnpm exec vitest run` → full suite green (>= 1158 pass, 0 fail).
- `node scripts/validate-schema.mjs` → exit 0 (capabilities + disciplines + judgments validate).
- `pnpm exec biome check && pnpm exec tsc --noEmit` → both exit 0.
- `git diff --stat` → only workflows/capabilities.yaml (additions) + workflows/judgments/stage-phase-gate.yaml (new file).
- Keystone: `grep -rc 'gsd-execute-phase:' workflows/capabilities.yaml` == 0.
</verification>

<success_criteria>
- 12 new GSD Core 1.4.1 capabilities resolvable from capabilities.yaml, each mirroring the gsd-discuss-phase shape, all 3 req IDs satisfied (REQ-v51-gsd-rewire = the 12 entries; REQ-v51-gsd-judgments = the 4 stage-phase-gate triggers; REQ-v51-validation = the green gate).
- 4 stage-phase-gate.yaml triggers cross-validate green against capabilities.yaml (Contract 3).
- Additive only: no existing entry mutated, no existing judgments file touched, gsd-execute-phase absent (keystone).
- Test baseline (1158) preserved, biome + tsc clean, Windows CI stays green.
</success_criteria>

<artifacts_this_phase_produces>
New capability keys (workflows/capabilities.yaml, Bucket 10):
- gsd-spec-phase, gsd-ui-phase, gsd-secure-phase, gsd-ai-integration-phase
- gsd-ingest-docs, gsd-new-project, gsd-new-milestone
- gsd-extract-learnings, gsd-audit-milestone, gsd-complete-milestone, gsd-milestone-summary
- gsd-docs-update

New judgments trigger names (workflows/judgments/stage-phase-gate.yaml — NEW FILE):
- gsd-spec-phase, gsd-ui-phase, gsd-secure-phase, gsd-ai-integration-phase

Explicitly NOT produced (keystone): gsd-execute-phase (execute mechanism stays harnessed self-owned).
</artifacts_this_phase_produces>

<source_audit>
GOAL (ROADMAP Phase 9): additively wire ~12 new GSD Core capabilities + stage-gate triggers, no runtime change → COVERED (T1 + T2).
REQ-v51-gsd-rewire: 12 capabilities added mirroring existing pattern → COVERED (T1).
REQ-v51-gsd-judgments: 4 stage-phase capabilities referenced from judgments triggers → COVERED (T2).
REQ-v51-validation: capability-resolver + check-workflow-schema + manifest-validate green, biome + tsc clean, fixtures synced → COVERED (T3).
CONTEXT: none (discuss-phase intentionally skipped; scope locked in planning_context + REQUIREMENTS/ROADMAP).
Keystone constraint (gsd-execute-phase NOT wired): enforced by T1 verify + phase-level grep gate.
No unplanned items. No phase split needed (small additive config; single wave, sequential tasks within one PLAN per atomic-commit boundary: capabilities-then-judgments-then-gate).
</source_audit>

<output>
Create `.planning/phases/09-gsd-core-rewire/09-01-SUMMARY.md` when done.
</output>
