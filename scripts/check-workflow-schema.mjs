#!/usr/bin/env node
// scripts/check-workflow-schema.mjs — Phase v2.0-2.3 W0 T2.3.W0.6 (R20.2 + R20.4)
//                                    — Phase v2.0-2.4 W0 T2.4.W0.1 (R20.1 + R20.9 workflow.v2 extension).
// CI gate validating workflows/capabilities.yaml + workflows/judgments/*.yaml
// + workflows/{plan-feature,execute-task,research,verify-work}/workflow.yaml
// against TypeBox schemas (src/workflow/schema/{capabilities,judgment,workflow}.ts).
//
// SSOT: TS schema files in src/workflow/schema/ are the source of truth; this
// .mjs inlines equivalent schemas because Node runtime cannot import TS modules
// directly (NodeNext + verbatimModuleSyntax + noEmit). Sister pattern:
// scripts/check-provenance.mjs branchOnSchemaVersion inline-port (Phase 2.2 T4.0).
// Drift between TS and .mjs schemas surfaces in tests/workflow/schema*.test.ts
// (which import the TS modules directly — any structural delta fails fixture
// parity).
//
// v2 grace period (Phase v2.0-2.4 W0 → W1): legacy workflow.yaml files lacking
// `schema_version: harnessed.workflow.v2` are SKIPPED with a warning until
// Phase 2.4 W1 upgrades them. After W1 ship, the skip branch becomes a hard fail
// (T2.4.W1.x will tighten this gate).
//
// Sister CI step "Workflow schema validate (v2.0 NEW)" wires after the
// transparency gate per .github/workflows/ci.yml (Phase 2.1 W3 warn-only round 1
// position precedent).

import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { basename, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Type } from '@sinclair/typebox'
import { Value } from '@sinclair/typebox/value'
import { parse as parseYaml } from 'yaml'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

// Capabilities schema — mirrors src/workflow/schema/capabilities.ts (SSOT).
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
const CapabilityEntry = Type.Object(
  {
    impl: Type.String(),
    cmd: Type.String(),
    since: Type.String(),
    description: Type.Optional(Type.String()),
    fires_when: Type.Optional(Type.Array(Type.String())),
    requires: Type.Optional(RequiresShape),
    plugin_path: Type.Optional(Type.String()),
    outputs: Type.Optional(Type.Array(Type.String())),
    aliases: Type.Optional(Type.Array(AliasShape)),
    sdk_ref: Type.Optional(Type.String()),
  },
  { additionalProperties: false },
)
const Capabilities = Type.Object(
  {
    schema_version: Type.Literal('harnessed.capabilities.v1'),
    capabilities: Type.Record(Type.String(), CapabilityEntry),
  },
  { additionalProperties: false },
)

// Judgment schemas — mirror src/workflow/schema/judgment.ts (SSOT).
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

let failed = 0
function reportErrors(label, schema, parsed) {
  console.error(`::error::FAIL ${label} — schema mismatch`)
  for (const err of Value.Errors(schema, parsed)) {
    console.error(`  ${err.path || '<root>'}: ${err.message}`)
  }
}

// Check workflows/capabilities.yaml.
const capPath = resolve(ROOT, 'workflows/capabilities.yaml')
if (!existsSync(capPath)) {
  console.error(`::error::workflows/capabilities.yaml missing at ${capPath}`)
  failed++
} else {
  const capParsed = parseYaml(readFileSync(capPath, 'utf8'))
  if (!Value.Check(Capabilities, capParsed)) {
    reportErrors('workflows/capabilities.yaml', Capabilities, capParsed)
    failed++
  }
}

// Check workflows/judgments/*.yaml (6 file: 5 triggers + 1 rules).
const judgmentsDir = resolve(ROOT, 'workflows/judgments')
if (existsSync(judgmentsDir)) {
  const yamlFiles = readdirSync(judgmentsDir).filter((f) => f.endsWith('.yaml'))
  for (const f of yamlFiles) {
    const parsed = parseYaml(readFileSync(resolve(judgmentsDir, f), 'utf8'))
    const isFallback = basename(f, '.yaml') === 'fallback'
    const schema = isFallback ? JudgmentRulesFile : JudgmentTriggersFile
    const label = `workflows/judgments/${f}`
    if (!Value.Check(schema, parsed)) {
      reportErrors(label, schema, parsed)
      failed++
    }
  }
}

// Workflow v2 schema — mirrors src/workflow/schema/workflow.ts (SSOT) — Phase v2.0-2.4 W0 T2.4.W0.1.
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

// Scan workflows/*/{workflow.yaml,phases.yaml} (Phase 2.4 W0 grace period: skip
// legacy v1 files lacking `schema_version: harnessed.workflow.v2` — W1 will
// upgrade them, then this gate tightens). Sister naming: plan-feature uses
// `workflow.yaml`, execute-task uses `phases.yaml` (legacy v1 name).
const workflowDirs = ['plan-feature', 'execute-task', 'research', 'verify-work']
let v2Validated = 0
let v1Skipped = 0
for (const wfName of workflowDirs) {
  const dir = resolve(ROOT, 'workflows', wfName)
  if (!existsSync(dir)) continue
  for (const candidate of ['workflow.yaml', 'phases.yaml']) {
    const path = resolve(dir, candidate)
    if (!existsSync(path)) continue
    const parsed = parseYaml(readFileSync(path, 'utf8'))
    if (parsed?.schema_version !== 'harnessed.workflow.v2') {
      console.warn(
        `::warning::workflows/${wfName}/${candidate} — skipped (legacy v1, no schema_version; Phase 2.4 W1 will upgrade)`,
      )
      v1Skipped++
      continue
    }
    const label = `workflows/${wfName}/${candidate}`
    if (!Value.Check(WorkflowSchemaV2, parsed)) {
      reportErrors(label, WorkflowSchemaV2, parsed)
      failed++
    } else {
      v2Validated++
    }
  }
}

if (failed > 0) {
  console.error(`\n${failed} workflow yaml file(s) failed schema validation`)
  process.exit(1)
}
console.log(
  `Workflow schema validation passed (capabilities + judgments/ + workflow.v2 validated=${v2Validated}, legacy v1 skipped=${v1Skipped})`,
)
