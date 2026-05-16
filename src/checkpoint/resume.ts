// Phase 3.1 W4 T4.3 — resume logic (D-03 RELOAD locked: stdout output, no spawn).
// Sister: src/cli/doctor.ts --json flag + src/workflow/loadPhases.ts TypeBox validate.
// CD-5 single 兼容门: branchOnSchemaVersion delegates unknown-version graceful degrade.
// § 1.3 cwd guard: warn if checkpoint.cwd !== process.cwd() (SDK session resume may fail).

import { readFile } from 'node:fs/promises'
import { Value } from '@sinclair/typebox/value'
import { branchOnSchemaVersion } from '../types/schemaVersion.js'
import { CheckpointV1, type CheckpointV1Type } from './schema/index.js'
import { readCurrentWorkflow } from './state.js'

export type ResumeResult =
  | { status: 'no-paused-phase'; error: string }
  | { status: 'corrupt'; error: string; path: string }
  | { status: 'ok'; checkpoint: CheckpointV1Type; cwdWarn?: string; resumeHint: string }

export async function runResume(): Promise<ResumeResult> {
  const current = await readCurrentWorkflow()
  if (!current) {
    return { status: 'no-paused-phase', error: 'no .harnessed/current-workflow.json found' }
  }
  if (current.status !== 'paused') {
    return {
      status: 'no-paused-phase',
      error: `workflow status is '${current.status}', not 'paused'`,
    }
  }
  if (!current.last_checkpoint_path) {
    return { status: 'corrupt', error: 'last_checkpoint_path missing', path: '' }
  }
  const path = current.last_checkpoint_path
  let raw: string
  try {
    raw = await readFile(path, 'utf8')
  } catch (e) {
    return { status: 'corrupt', error: `checkpoint missing: ${(e as Error).message}`, path }
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch (e) {
    return {
      status: 'corrupt',
      error: `checkpoint JSON parse failed: ${(e as Error).message}`,
      path,
    }
  }
  const v = (parsed as { schemaVersion?: string }).schemaVersion ?? ''
  const validated = branchOnSchemaVersion<CheckpointV1Type | null>(v, {
    v1: () => (Value.Check(CheckpointV1, parsed) ? (parsed as CheckpointV1Type) : null),
    unknown: () => null,
  })
  if (!validated) {
    const errs = [...Value.Errors(CheckpointV1, parsed)].map((e) => e.message).join('; ')
    return { status: 'corrupt', error: `checkpoint schema validation failed: ${errs}`, path }
  }
  const cwd = process.cwd()
  const cwdWarn =
    validated.cwd !== cwd
      ? `⚠ checkpoint cwd '${validated.cwd}' ≠ current cwd '${cwd}' — SDK session resume may fail (§ 1.3); fresh-session fallback`
      : undefined
  const sidHint = validated.session_id
    ? ` (session_id: ${validated.session_id} — SDK will redirect to original session)`
    : ' (fresh session — context reloaded from checkpoint)'
  const resumeHint = `→ in Claude Code: /gsd-execute-phase ${validated.phase}${sidHint}`
  return { status: 'ok', checkpoint: validated, ...(cwdWarn ? { cwdWarn } : {}), resumeHint }
}
