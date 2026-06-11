#!/usr/bin/env node
// scripts/check-workflow-schema.mjs — Phase v2.0-2.3 W0 T2.3.W0.6 (R20.2 + R20.4)
//                                    — Phase v2.0-2.4 W0 T2.4.W0.1 (R20.1 + R20.9 workflow.v2 extension)
//                                    — Phase v3.0-3.3 W0 T3.3.W0.10 (R30.9 cross-validate + Discipline schema).
// CI gate validating:
//   1. workflows/capabilities.yaml against Capabilities TypeBox schema (SSOT mirror)
//   2. workflows/judgments/*.yaml (6 file: 5 triggers + 1 rules) against Judgment schemas
//   3. workflows/disciplines/*.yaml (6 file ship v3.0) against Discipline TypeBox schema (NEW W0.10)
//   4. workflows/{stage}/{sub}/workflow.yaml + flat workflows/{research,retro}/workflow.yaml
//      against WorkflowSchemaV2 / V3 (grace period v1 skip)
// + cross-validate contracts (NEW Phase 3.3 per RESEARCH-workflows Pattern A C.2):
//   C1. workflow.yaml `tools_available[]` ⊂ capabilities.yaml entry name set (K2 + R3 + Pitfall 4)
//   C2. workflow.yaml `disciplines_applied[]` ⊂ 6 discipline basename set
//   C3. judgments/*.yaml triggers.*.invokes[].capability ⊂ capabilities.yaml entry name set
// + invariant K9: master workflow delegates_to[] serial mode 必带 order
// + tolerance: Phase 3.3 W0 末 0 workflow yaml exist 时仍 exit 0 (仅 capabilities + disciplines + judgments validate)
//
// SSOT: TS schema files in src/workflow/schema/ are the source of truth; this
// .mjs inlines equivalent schemas because Node runtime cannot import TS modules
// directly (NodeNext + verbatimModuleSyntax + noEmit). Sister pattern:
// scripts/check-provenance.mjs branchOnSchemaVersion inline-port (Phase 2.2 T4.0).
// Drift between TS and .mjs schemas surfaces in tests/workflow/schema*.test.ts.
//
// CI wire .github/workflows/ci.yml — sister Phase 2.3 W0.6 L141 已 wire,Phase 3.3 不变。

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Type } from '@sinclair/typebox'
import { Value } from '@sinclair/typebox/value'
import { parse as parseYaml } from 'yaml'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DEFAULT_ROOT = resolve(__dirname, '..')
const ROOT = process.env.HARNESSED_CHECK_ROOT
  ? resolve(process.env.HARNESSED_CHECK_ROOT)
  : DEFAULT_ROOT

// ── Capabilities schema — mirrors src/workflow/schema/capabilities.ts ─────────
const RequiresShape = Type.Object(
  {
    plugin: Type.Optional(Type.String()),
    settings_env_var: Type.Optional(Type.String()),
    cc_version: Type.Optional(Type.String()),
    capabilities: Type.Optional(Type.Array(Type.String())),
  },
  { additionalProperties: false },
)
const AliasShape = Type.Object(
  { impl: Type.String(), cmd: Type.String() },
  { additionalProperties: false },
)
// D-08 + Pattern A B.3 — discriminated union: behavioral has discipline_ref, tool categories
// have no discipline_ref (mirror src/workflow/schema/capabilities.ts SSOT).
const ToolCategoryEnum = Type.Union([
  Type.Literal('tool-slash-cmd'),
  Type.Literal('tool-mcp'),
  Type.Literal('tool-cli'),
  Type.Literal('tool-plugin'),
  Type.Literal('tool-bundled-skill'),
  Type.Literal('agent-platform'),
])
const CapabilityEntryBase = Type.Object(
  {
    impl: Type.String(),
    cmd: Type.String(),
    since: Type.String(),
    description: Type.Optional(Type.String()),
    fires_when: Type.Optional(Type.Array(Type.String())),
    requires: Type.Optional(RequiresShape),
    plugin_path: Type.Optional(Type.String()),
    // v3.4.1/v3.4.2 presence-check fields — mirror src/workflow/schema/capabilities.ts
    // SSOT (was missing here; their absence made additionalProperties:false reject
    // every entry carrying skill_dir/install_type/plugin_id since v5.1).
    plugin_namespace: Type.Optional(Type.String()),
    install_type: Type.Optional(
      Type.Union([
        Type.Literal('plugin'),
        Type.Literal('user-skill'),
        Type.Array(Type.Union([Type.Literal('plugin'), Type.Literal('user-skill')]), {
          minItems: 1,
        }),
      ]),
    ),
    plugin_id: Type.Optional(Type.String()),
    skill_dir: Type.Optional(Type.String()),
    outputs: Type.Optional(Type.Array(Type.String())),
    aliases: Type.Optional(Type.Array(AliasShape)),
    sdk_ref: Type.Optional(Type.String()),
  },
  { additionalProperties: false },
)
const DisciplineCapabilityEntry = Type.Composite(
  [
    CapabilityEntryBase,
    Type.Object({
      category: Type.Literal('behavioral'),
      discipline_ref: Type.String({ pattern: '^workflows/disciplines/[a-z-]+\\.yaml$' }),
    }),
  ],
  { additionalProperties: false },
)
const ToolCapabilityEntry = Type.Composite(
  [CapabilityEntryBase, Type.Object({ category: ToolCategoryEnum })],
  { additionalProperties: false },
)
const LegacyCapabilityEntry = Type.Composite([CapabilityEntryBase], {
  additionalProperties: false,
})
const CapabilityEntry = Type.Union([
  DisciplineCapabilityEntry,
  ToolCapabilityEntry,
  LegacyCapabilityEntry,
])
const Capabilities = Type.Object(
  {
    schema_version: Type.Literal('harnessed.capabilities.v1'),
    capabilities: Type.Record(Type.String(), CapabilityEntry),
  },
  { additionalProperties: false },
)

// ── Judgment schemas ──────────────────────────────────────────────────────────
const TriggerInvocation = Type.Object(
  { capability: Type.String() },
  { additionalProperties: false },
)
const RequiresCapabilities = Type.Object(
  { capabilities: Type.Array(Type.String()) },
  { additionalProperties: false },
)
const JudgmentTrigger = Type.Object(
  {
    description: Type.Optional(Type.String()),
    fires_when: Type.Optional(Type.String()),
    skips_when: Type.Optional(Type.String()),
    invokes: Type.Optional(Type.Array(TriggerInvocation)),
    requires: Type.Optional(RequiresCapabilities),
    wraps: Type.Optional(Type.Array(Type.String())),
  },
  { additionalProperties: false },
)
const FallbackRule = Type.Object(
  {
    description: Type.Optional(Type.String()),
    fallback_action: Type.Optional(Type.String()),
    message_template: Type.Optional(Type.String()),
    override_signal: Type.Optional(Type.Array(Type.String())),
    chain_isolation: Type.Optional(Type.Boolean()),
  },
  { additionalProperties: false },
)
const JudgmentTriggersFile = Type.Object(
  {
    schema_version: Type.Literal('harnessed.judgment.v1'),
    triggers: Type.Record(Type.String(), JudgmentTrigger),
  },
  { additionalProperties: false },
)
const JudgmentRulesFile = Type.Object(
  {
    schema_version: Type.Literal('harnessed.judgment.v1'),
    rules: Type.Record(Type.String(), FallbackRule),
  },
  { additionalProperties: false },
)
// user-overrides.yaml — distinct schema (harnessed.user-overrides.v1); mirror
// src/workflow/schema/judgment.ts SSOT. Was validated as a triggers file before
// (wrong) → schema mismatch since v3.6.0.
const UserOverrideEntry = Type.Object(
  {
    id: Type.String({ minLength: 1 }),
    keywords: Type.Array(Type.String({ minLength: 1 }), { minItems: 1 }),
    triggers: Type.Array(Type.String({ minLength: 1 }), { minItems: 1 }),
  },
  { additionalProperties: false },
)
const UserOverridesFile = Type.Object(
  {
    schema_version: Type.Literal('harnessed.user-overrides.v1'),
    overrides: Type.Array(UserOverrideEntry, { minItems: 1 }),
  },
  { additionalProperties: false },
)

// ── Discipline schema — mirrors src/workflow/schema/discipline.ts (NEW W0.10) ─
const DEnforcementLayer = Type.Union([
  Type.Literal('code-writing'),
  Type.Literal('output'),
  Type.Literal('commit'),
  Type.Literal('workflow'),
  Type.Literal('tool'),
])
const DEnforcement = Type.Union([
  Type.Literal('halt'),
  Type.Literal('warn'),
  Type.Literal('auto-fix'),
  Type.Literal('info'),
])
const DisciplineRule = Type.Object(
  {
    id: Type.String({ minLength: 1 }),
    description: Type.String(),
    enforcement: DEnforcement,
    trigger: Type.Union([Type.String(), Type.Array(Type.String())]),
    check_method: Type.String(),
    auto_fix_cmd: Type.Optional(Type.String()),
  },
  { additionalProperties: false },
)
const ProtocolShape = Type.Object(
  {
    description: Type.String(),
    required_fields: Type.Optional(Type.Array(Type.String())),
    forbidden_phrases: Type.Optional(Type.Array(Type.String())),
    file_ownership: Type.Optional(Type.Record(Type.String(), Type.Array(Type.String()))),
    rules: Type.Optional(Type.Array(DisciplineRule)),
  },
  { additionalProperties: false },
)
const Discipline = Type.Object(
  {
    schema_version: Type.Literal('harnessed.discipline.v1'),
    discipline: Type.String({ minLength: 1 }),
    enforcement_layer: DEnforcementLayer,
    auto_enforce: Type.Boolean(),
    rules: Type.Array(DisciplineRule),
    priority_hierarchy: Type.Optional(Type.Array(Type.String(), { minItems: 1 })),
    protocols: Type.Optional(Type.Record(Type.String(), ProtocolShape)),
  },
  { additionalProperties: false },
)

// ── Workflow v2 / v3 schemas ──────────────────────────────────────────────────
const ModelTier = Type.Union([Type.Literal('haiku'), Type.Literal('sonnet'), Type.Literal('opus')])
const OnAction = Type.Union([Type.Literal('skip'), Type.Literal('invoke')])
const OnClause = Type.Object(
  {
    if: Type.String(),
    invoke: Type.Optional(Type.String()),
    action: Type.Optional(OnAction),
  },
  { additionalProperties: false },
)
const FallbackMaxIterationsExceeded = Type.Object(
  {
    action: Type.Literal('emit_warning_and_halt'),
    message: Type.String(),
    exit_code: Type.Number(),
  },
  { additionalProperties: false },
)
const PhaseFallback = Type.Object(
  { max_iterations_exceeded: Type.Optional(FallbackMaxIterationsExceeded) },
  { additionalProperties: false },
)
const WorkflowPhaseV2 = Type.Object(
  {
    id: Type.String({ minLength: 1 }),
    name: Type.Optional(Type.String()),
    upstream: Type.Optional(Type.String()),
    capability: Type.Optional(Type.String()),
    model: Type.Optional(ModelTier),
    invokes: Type.Optional(Type.String()),
    args: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
    gate: Type.Optional(Type.String()),
    on: Type.Optional(Type.Array(OnClause)),
    parallelism: Type.Optional(Type.String()),
    fallback: Type.Optional(PhaseFallback),
    max_iterations: Type.Optional(Type.Union([Type.Number(), Type.String()])),
    artifacts_expected: Type.Optional(Type.Array(Type.String())),
    tools_available: Type.Optional(Type.Array(Type.String())),
  },
  { additionalProperties: false },
)
const WorkflowSchemaV2 = Type.Object(
  {
    schema_version: Type.Literal('harnessed.workflow.v2'),
    workflow: Type.String({ minLength: 1 }),
    description: Type.Optional(Type.String()),
    phases: Type.Array(WorkflowPhaseV2, { minItems: 1 }),
  },
  { additionalProperties: false },
)

// ── Error reporting helpers ───────────────────────────────────────────────────
let failed = 0
function reportErrors(label, schema, parsed) {
  console.error(`::error::FAIL ${label} — schema mismatch`)
  for (const err of Value.Errors(schema, parsed)) {
    console.error(`  ${err.path || '<root>'}: ${err.message}`)
  }
}

// ── Step 1: Capabilities ──────────────────────────────────────────────────────
const capPath = resolve(ROOT, 'workflows/capabilities.yaml')
let capNames = new Set()
if (!existsSync(capPath)) {
  console.error(`::error::workflows/capabilities.yaml missing at ${capPath}`)
  failed++
} else {
  const capParsed = parseYaml(readFileSync(capPath, 'utf8'))
  if (!Value.Check(Capabilities, capParsed)) {
    reportErrors('workflows/capabilities.yaml', Capabilities, capParsed)
    failed++
  } else {
    capNames = new Set(Object.keys(capParsed.capabilities))
  }
}

// ── Step 2: Disciplines (NEW W0.10) ───────────────────────────────────────────
const disciplinesDir = resolve(ROOT, 'workflows/disciplines')
const discBasenames = new Set()
if (existsSync(disciplinesDir)) {
  const yamlFiles = readdirSync(disciplinesDir).filter((f) => f.endsWith('.yaml'))
  for (const f of yamlFiles) {
    const parsed = parseYaml(readFileSync(resolve(disciplinesDir, f), 'utf8'))
    const label = `workflows/disciplines/${f}`
    if (!Value.Check(Discipline, parsed)) {
      reportErrors(label, Discipline, parsed)
      failed++
    } else {
      discBasenames.add(basename(f, '.yaml'))
    }
  }
}

// ── Step 3: Judgments + Contract 3 (invokes capability ⊂ capabilities set) ────
const judgmentsDir = resolve(ROOT, 'workflows/judgments')
if (existsSync(judgmentsDir)) {
  const yamlFiles = readdirSync(judgmentsDir).filter((f) => f.endsWith('.yaml'))
  for (const f of yamlFiles) {
    const parsed = parseYaml(readFileSync(resolve(judgmentsDir, f), 'utf8'))
    const base = basename(f, '.yaml')
    const isFallback = base === 'fallback'
    const isUserOverrides = base === 'user-overrides'
    const schema = isFallback
      ? JudgmentRulesFile
      : isUserOverrides
        ? UserOverridesFile
        : JudgmentTriggersFile
    const label = `workflows/judgments/${f}`
    if (!Value.Check(schema, parsed)) {
      reportErrors(label, schema, parsed)
      failed++
      continue
    }
    // C3 cross-validate (skip fallback rules + user-overrides — no triggers[].invokes)
    if (isFallback || isUserOverrides) continue
    for (const [trigName, trig] of Object.entries(parsed.triggers ?? {})) {
      for (const inv of trig.invokes ?? []) {
        if (capNames.size > 0 && !capNames.has(inv.capability)) {
          console.error(
            `::error::FAIL ${label} — triggers.${trigName}.invokes[].capability '${inv.capability}' not in capabilities.yaml`,
          )
          failed++
        }
      }
    }
  }
}

// ── Step 4: Workflow yaml scan (flat + nested) + Contracts C1 + C2 + K9 ───────
const workflowsRoot = resolve(ROOT, 'workflows')
let v2Validated = 0
let v3Validated = 0
let v1Skipped = 0

const SKIP_DIRS = new Set(['disciplines', 'judgments', 'manifests'])

function collectWorkflowYamls() {
  const out = []
  if (!existsSync(workflowsRoot)) return out
  for (const entry of readdirSync(workflowsRoot)) {
    if (SKIP_DIRS.has(entry)) continue
    const p = join(workflowsRoot, entry)
    let s
    try {
      s = statSync(p)
    } catch {
      continue
    }
    if (!s.isDirectory()) continue
    // Path A: flat top-level workflow.yaml OR phases.yaml
    for (const candidate of ['workflow.yaml', 'phases.yaml']) {
      const fp = join(p, candidate)
      if (existsSync(fp)) out.push({ relPath: `${entry}/${candidate}`, path: fp })
    }
    // Path B: nested 2-level workflows/<stage>/<sub>/workflow.yaml
    let subs
    try {
      subs = readdirSync(p)
    } catch {
      continue
    }
    for (const sub of subs) {
      const subDir = join(p, sub)
      let ss
      try {
        ss = statSync(subDir)
      } catch {
        continue
      }
      if (!ss.isDirectory()) continue
      const fp = join(subDir, 'workflow.yaml')
      if (existsSync(fp)) out.push({ relPath: `${entry}/${sub}/workflow.yaml`, path: fp })
    }
  }
  return out
}

for (const { relPath, path } of collectWorkflowYamls()) {
  const parsed = parseYaml(readFileSync(path, 'utf8'))
  const label = `workflows/${relPath}`
  const version = parsed?.schema_version

  if (version === 'harnessed.workflow.v3') {
    // V3 — light validate fields + cross-deps + K9 invariant
    // (Full V3 TypeBox not inlined since schema-teammate ships ST validation
    // upstream; .mjs only does cross-validate + invariant per Wave A reconcile)
    v3Validated++
    // C2: disciplines_applied[] ⊂ 6 discipline basename set
    if (Array.isArray(parsed.disciplines_applied) && discBasenames.size > 0) {
      for (const d of parsed.disciplines_applied) {
        if (!discBasenames.has(d)) {
          console.error(`::error::FAIL ${label} — disciplines_applied[] '${d}' not in disciplines/`)
          failed++
        }
      }
    }
    // C1: phases[].tools_available[] ⊂ capabilities entry name set
    if (capNames.size > 0 && Array.isArray(parsed.phases)) {
      for (const ph of parsed.phases) {
        for (const tool of ph.tools_available ?? []) {
          if (!capNames.has(tool)) {
            console.error(
              `::error::FAIL ${label} — phases[${ph.id}].tools_available[] '${tool}' not in capabilities.yaml`,
            )
            failed++
          }
        }
      }
    }
    // K9 invariant: delegates_to[] serial mode 必带 order (master workflows only)
    if (Array.isArray(parsed.delegates_to)) {
      for (const [i, clause] of parsed.delegates_to.entries()) {
        if (clause?.mode === 'serial' && clause?.order === undefined) {
          console.error(
            `::error::FAIL ${label} — delegates_to[${i}] serial mode requires explicit order`,
          )
          failed++
        }
      }
    }
  } else if (version === 'harnessed.workflow.v2') {
    if (!Value.Check(WorkflowSchemaV2, parsed)) {
      reportErrors(label, WorkflowSchemaV2, parsed)
      failed++
    } else {
      v2Validated++
      // C1 also applies to v2 phases[].tools_available[]
      if (capNames.size > 0) {
        for (const ph of parsed.phases ?? []) {
          for (const tool of ph.tools_available ?? []) {
            if (!capNames.has(tool)) {
              console.error(
                `::error::FAIL ${label} — phases[${ph.id}].tools_available[] '${tool}' not in capabilities.yaml`,
              )
              failed++
            }
          }
        }
      }
    }
  } else {
    console.warn(
      `::warning::${label} — skipped (no schema_version OR unrecognized; treat as legacy v1)`,
    )
    v1Skipped++
  }
}

if (failed > 0) {
  console.error(`\n${failed} workflow yaml file(s) failed schema validation`)
  process.exit(1)
}
console.log(
  `Workflow schema validation passed (capabilities + ${discBasenames.size} disciplines + judgments cross-validated + workflow v2=${v2Validated} / v3=${v3Validated}, legacy v1 skipped=${v1Skipped})`,
)
