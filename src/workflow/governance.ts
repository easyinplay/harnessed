// src/workflow/governance.ts — Phase 3.2 W1 T1.7 (D-04 PUSH LOCKED).
// Sister src/checkpoint/state.ts L23-41 readCurrentWorkflow fail-soft pattern
// (direct analog). gstack writes .harnessed/governance.json (NOT in harnessed
// scope per D-04); harnessed reads lazy-once per workflow phase boundary
// (NOT polling per Phase 2.4 SSE anti-pattern lesson + D-04 anti-pattern guard).

import { readFile } from 'node:fs/promises'
import { Value } from '@sinclair/typebox/value'
import { branchOnSchemaVersion } from '../types/schemaVersion.js'
import { GovernanceV1, type GovernanceV1Type } from './schema/governance.js'

const GOV_PATH = '.harnessed/governance.json'

/** Read .harnessed/governance.json with fail-soft null on missing/corrupt/drift.
 *  Sister state.ts:23-41. Missing file = active (no veto) by design — D-04 PUSH
 *  default is active unless gstack explicitly writes vetoed state. */
export async function readGovernance(): Promise<GovernanceV1Type | null> {
  let raw: string
  try {
    raw = await readFile(GOV_PATH, 'utf8')
  } catch {
    return null
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }
  const v = (parsed as { schemaVersion?: string }).schemaVersion ?? ''
  return branchOnSchemaVersion(v, {
    v1: () => (Value.Check(GovernanceV1, parsed) ? (parsed as GovernanceV1Type) : null),
    unknown: () => null,
  })
}

/** Lazy check whether workflow execution should halt due to gstack veto.
 *  Called from runWorkflow BEFORE each phase transition (NOT polling timer). */
export async function isVetoed(): Promise<boolean> {
  return (await readGovernance())?.status === 'vetoed'
}
