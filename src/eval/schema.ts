// src/eval/schema.ts — eval scenario typebox schema (4.31.0 Slice A, T2).
//
// In-process runtime validation only (like checkpoint/schema/currentWorkflow.v1):
// build:schema exports ManifestSchema alone, so this schema does NOT enter the
// schemas/ artifact set — verified against scripts/build-schema.mjs.
//
// Locked semantics (CEO plan): scenario = {name, description?(which incident
// this trap catches), assets_dir?(fixture assets tree → HARNESSED_ASSETS_OVERRIDE,
// for doctored judgments yaml seeds), seed_context?(deep-merged into every gates
// step context; `$unset: [bare keys]` removes keys from the composed payload —
// note the engine re-adds defaults, so reproducing a MISSING bare identifier is
// done via assets_dir doctoring, $unset covers scenario-composed keys),
// steps[](gates | checkpoint | file(+mtime — multi-base evidence resolution is
// mtime-decided)), expect.golden (default golden.json, scenario-dir relative).

import { type Static, Type } from '@sinclair/typebox'
import { Value } from '@sinclair/typebox/value'

const GatesStep = Type.Object(
  {
    gates: Type.Object(
      {
        master: Type.String({ minLength: 1 }),
        task: Type.Optional(Type.String()),
        skip_sub: Type.Optional(Type.Array(Type.String())),
        context: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
      },
      { additionalProperties: false },
    ),
  },
  { additionalProperties: false },
)

const CheckpointStep = Type.Object(
  {
    checkpoint: Type.Object(
      {
        action: Type.Union([Type.Literal('start'), Type.Literal('complete'), Type.Literal('fail')]),
        sub: Type.String({ minLength: 1 }),
        // start-only: gates plan (object form; runner serializes to --plan JSON).
        plan: Type.Optional(Type.Unknown()),
        summary: Type.Optional(Type.String()),
        force: Type.Optional(Type.Boolean()),
        tokens: Type.Optional(Type.String()),
      },
      { additionalProperties: false },
    ),
  },
  { additionalProperties: false },
)

const FileStep = Type.Object(
  {
    file: Type.Object(
      {
        // Relative to the scenario's temp repo dir (the runner chdir target).
        path: Type.String({ minLength: 1 }),
        content: Type.Optional(Type.String()),
        // ISO-8601; applied via utimes — evidence multi-base resolution picks
        // the newest mtime, scenarios must control it explicitly.
        mtime: Type.Optional(Type.String()),
      },
      { additionalProperties: false },
    ),
  },
  { additionalProperties: false },
)

export const EvalStep = Type.Union([GatesStep, CheckpointStep, FileStep])

export const EvalScenario = Type.Object(
  {
    name: Type.String({ minLength: 1 }),
    description: Type.Optional(Type.String()),
    assets_dir: Type.Optional(Type.String({ minLength: 1 })),
    seed_context: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
    steps: Type.Array(EvalStep, { minItems: 1 }),
    expect: Type.Optional(
      Type.Object({ golden: Type.Optional(Type.String()) }, { additionalProperties: false }),
    ),
  },
  { additionalProperties: false },
)

export type EvalScenarioType = Static<typeof EvalScenario>
export type EvalStepType = Static<typeof EvalStep>

export type ValidateResult =
  | { ok: true; scenario: EvalScenarioType }
  | { ok: false; errors: string[] }

/** Validate a parsed scenario document. Never throws — malformed input is a
 *  CONFIG-ERROR at the runner layer, not an exception. */
export function validateScenario(parsed: unknown): ValidateResult {
  if (Value.Check(EvalScenario, parsed)) {
    return { ok: true, scenario: parsed }
  }
  const errors = [...Value.Errors(EvalScenario, parsed)].map(
    (e) => `${e.path || '/'}: ${e.message}`,
  )
  return { ok: false, errors: errors.length > 0 ? errors : ['invalid scenario'] }
}
