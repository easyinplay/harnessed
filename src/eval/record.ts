// src/eval/record.ts — eval Slice C (4.32.0): record a REAL checkpoint
// trajectory into a replayable Slice A scenario.
//
// `harnessed eval record --from <dir>` reads a real run's current-workflow
// envelope (`<dir>/current-workflow.json`) and reconstructs the checkpoint
// action sequence that reproduces its final ledger — a `file` skeleton +
// `checkpoint start <phase>` (plan from sub_progress mode/order + skips) +
// one `checkpoint complete|fail <sub>` per resolved sub, emitted in
// serial-valid order so the 4.26.0 serial-order guard does not BLOCK.
//
// The golden is NOT hand-derived: the command replays the reconstructed
// scenario through the SAME runner with updateGolden, so round-trip
// (record → replay → PASS) holds by construction.
//
// Privacy (user ruling 2026-07-15 — default redact, opt-in --include-text):
// a trap asserts the ENGINE BEHAVIOR sequence, not real business content.
// summary/reason text → placeholders; credential shapes → scrubbed; paths are
// already normalized to <TMP>/<STATE> by the runner's normalizeGolden.
//
// Known boundaries (recorded in the scenario description): evidence artifacts
// (a real `verified` posture is not reconstructed — no artifacts_expected
// files are recreated, so the replay yields `none_declared`); real spawn /
// external side effects are not replayed (the trap layer is engine behavior).

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { stringify as stringifyYaml } from 'yaml'
import type {
  CurrentWorkflowV1Type,
  SubProgressEntryType,
} from '../checkpoint/schema/currentWorkflow.v1.js'
import type { EvalScenarioType } from './schema.js'

const SUMMARY_PLACEHOLDER = '<SUMMARY-REDACTED>'

/** parallel subs without an explicit order sort to the mid anchor (mirrors
 *  masterOrchestrator's PARALLEL_MID_ANCHOR) so the reconstructed complete
 *  order clears the serial-order guard. */
const PARALLEL_MID_ANCHOR = 50

/** Redact credential shapes + secret-named env assignments (same shapes as the
 *  evidence-pack scrubber; inlined to avoid a src→scripts import). Idempotent. */
export function scrubSecretShapes(text: string): string {
  return text
    .replace(
      /\b(gh[opusr]_[A-Za-z0-9]{16,}|github_pat_[A-Za-z0-9_]{20,}|sk-[A-Za-z0-9-]{20,}|xox[bap]-[A-Za-z0-9-]{10,}|AKIA[A-Z0-9]{16})\b/g,
      (m) => `[REDACTED-${m.slice(0, 4)}]`,
    )
    .replace(
      /([A-Z0-9_]*(?:TOKEN|SECRET|KEY|PASSWORD|CREDENTIAL|AUTH)[A-Z0-9_]*)=([^\s\\"']{8,})/g,
      (m, k: string, v: string) => (/REDACTED/.test(v) ? m : `${k}=[REDACTED-ENV]`),
    )
}

/** Redact free-text (summary/reason/task) unless includeText. Even with
 *  includeText, credential shapes are always scrubbed. */
export function redactText(
  text: string | undefined,
  placeholder: string,
  includeText: boolean,
): string | undefined {
  if (text === undefined) return undefined
  if (!includeText) return placeholder
  return scrubSecretShapes(text)
}

/** effective order for the serial-order guard (serial→order, parallel/unknown→mid). */
function effectiveOrder(e: SubProgressEntryType): number {
  if (e.mode === 'serial' && typeof e.order === 'number') return e.order
  return PARALLEL_MID_ANCHOR
}

/** Pure — reconstruct a replayable scenario from a real envelope. */
export function buildScenarioFromEnvelope(
  wf: CurrentWorkflowV1Type,
  opts: { includeText?: boolean; name?: string } = {},
): EvalScenarioType {
  const includeText = opts.includeText === true
  const subs = wf.sub_progress ?? []

  const fired = subs.filter((e) => e.status !== 'skipped')
  const skipped = subs.filter((e) => e.status === 'skipped')

  // seed plan: fire[] preserves mode/order; skip[] preserves reason (redacted).
  const plan = {
    fire: fired.map((e) => ({
      sub: e.sub,
      ...(e.mode !== undefined ? { mode: e.mode } : {}),
      ...(e.order !== undefined ? { order: e.order } : {}),
    })),
    skip: skipped.map((e) => ({
      sub: e.sub,
      // skip reason is engine-generated metadata ("gate <ref> = false" / "skipped
      // via skip_subs"), not user free-text — keep it (only scrub secret shapes),
      // it makes the trap meaningful and carries no business content.
      reason: e.reason ? scrubSecretShapes(e.reason) : 'skipped',
    })),
  }

  const steps: EvalScenarioType['steps'] = [
    // skeleton so the planning-sync gate does not warn/block during replay.
    { file: { path: '.planning/ROADMAP.md', content: '# Roadmap\n' } },
    { file: { path: '.planning/STATE.md', content: '# STATE\n' } },
    { checkpoint: { action: 'start', sub: wf.phase, plan } },
  ]

  // resolve each fired sub in serial-valid order; pending subs stay pending
  // (their absence of a resolve step reproduces the real pending state).
  const resolveOrder = [...fired]
    .filter((e) => e.status === 'done' || e.status === 'failed' || e.status === 'rejected')
    .sort((a, b) => effectiveOrder(a) - effectiveOrder(b))

  for (const e of resolveOrder) {
    // The v1 envelope ledger does not carry per-sub summary text (it lives in
    // the individual checkpoint files); read defensively so a future schema
    // that adds it is picked up. undefined → placeholder.
    const summaryText = (e as { summary_text?: string }).summary_text
    const summary = redactText(summaryText, SUMMARY_PLACEHOLDER, includeText)
    if (e.status === 'done') {
      steps.push({
        checkpoint: {
          action: 'complete',
          sub: e.sub,
          ...(summary !== undefined ? { summary } : { summary: SUMMARY_PLACEHOLDER }),
          // a real `overridden` posture came from --force; reproduce it.
          ...(e.evidence_status === 'overridden' ? { force: true } : {}),
        },
      })
    } else {
      steps.push({
        checkpoint: {
          action: 'fail',
          sub: e.sub,
          ...(summary !== undefined ? { summary } : { summary: SUMMARY_PLACEHOLDER }),
        },
      })
    }
  }

  const hasVerified = fired.some((e) => e.evidence_status === 'verified')
  const desc =
    `auto-recorded from a real ${wf.phase} run (eval Slice C). ` +
    `${includeText ? 'original text preserved (--include-text)' : 'free text redacted'}.` +
    (hasVerified
      ? ' KNOWN BOUNDARY: a real `verified` evidence posture is not reconstructed (no artifacts recreated) → replay yields `none_declared`.'
      : '')

  return {
    name: opts.name ?? `recorded-${wf.phase}`,
    description: desc,
    steps,
  }
}

/** Impure — read `<dir>/current-workflow.json` (or a file path) and build the
 *  scenario. Throws a clear error when the envelope is absent/malformed. */
export function recordScenario(
  from: string,
  opts: { includeText?: boolean; name?: string } = {},
): { scenario: EvalScenarioType; scenarioYaml: string } {
  const path = from.endsWith('.json') ? from : join(from, 'current-workflow.json')
  let raw: string
  try {
    raw = readFileSync(path, 'utf8')
  } catch {
    throw new Error(
      `no current-workflow envelope at ${path} — point --from at a harnessed root (or a real run's checkpoint dir) that contains current-workflow.json`,
    )
  }
  let wf: CurrentWorkflowV1Type
  try {
    wf = JSON.parse(raw) as CurrentWorkflowV1Type
  } catch (e) {
    throw new Error(
      `current-workflow envelope at ${path} is not valid JSON: ${(e as Error).message}`,
    )
  }
  if (!wf || typeof wf.phase !== 'string' || wf.phase.length === 0) {
    throw new Error(`current-workflow envelope at ${path} has no 'phase' — not a recordable run`)
  }
  const scenario = buildScenarioFromEnvelope(wf, opts)
  const header =
    `# AUTO-RECORDED trap (eval Slice C, 4.32.0) — do not hand-edit; re-record via\n` +
    `# \`harnessed eval record --from <run>\`. golden.json is replay-generated.\n`
  const scenarioYaml = header + stringifyYaml(scenario)
  return { scenario, scenarioYaml }
}
