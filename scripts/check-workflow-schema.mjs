#!/usr/bin/env node
// scripts/check-workflow-schema.mjs — Phase v2.0-2.3 W0 T2.3.W0.6 (R20.2 + R20.4).
// CI gate validating workflows/capabilities.yaml + workflows/judgments/*.yaml
// against TypeBox schemas (src/workflow/schema/{capabilities,judgment}.ts).
//
// SSOT: TS schema files in src/workflow/schema/ are the source of truth; this
// .mjs inlines equivalent schemas because Node runtime cannot import TS modules
// directly (NodeNext + verbatimModuleSyntax + noEmit). Sister pattern:
// scripts/check-provenance.mjs branchOnSchemaVersion inline-port (Phase 2.2 T4.0).
// Drift between TS and .mjs schemas surfaces in tests/workflow/schema/*.test.ts
// (which import the TS modules directly — any structural delta fails fixture
// parity).
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

if (failed > 0) {
  console.error(`\n${failed} workflow yaml file(s) failed schema validation`)
  process.exit(1)
}
console.log('Workflow schema validation passed (capabilities + judgments/)')
