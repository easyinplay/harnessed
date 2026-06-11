// v5.0 Spec 1 (ADR-0033 D2/D4) — fail-closed evidence guard primitives.
//
// The only fs/crypto touch of the state-machine core (design §9 component isolation).
// Three pure-ish functions, no state-file I/O (the caller in checkpoint.ts owns that):
//   - hashFile         : sha256 hex of a file's bytes.
//   - checkArtifacts   : locate a sub's leaf workflow.yaml (under packageRoot), read
//                        declared `phases[].artifacts_expected`, stat + hash each
//                        relative to process.cwd() (artifacts live in the user
//                        project). Three-state outcome (none_declared / verified /
//                        missing). `found[].path` is absolute (drift re-hash base).
//   - detectDrift      : re-hash stored evidence refs, list path/was/now mismatches
//                        (cross-CC handoff drift — warn, not block, per ADR-0033 D4).

import { createHash } from 'node:crypto'
import { readFile, stat } from 'node:fs/promises'
import { resolve } from 'node:path'
import { parse as parseYaml } from 'yaml'
import { resolveWorkflowYaml } from '../cli/run.js'
import type { CurrentWorkflowV1Type, EvidenceRefType } from './schema/currentWorkflow.v1.js'

/** sha256 hex digest of a file's bytes. */
export async function hashFile(path: string): Promise<string> {
  const buf = await readFile(path)
  return createHash('sha256').update(buf).digest('hex')
}

export interface CheckArtifactsResult {
  /** 'verified'      — declared artifacts present (sha256 recorded).
   *  'missing'       — some declared artifact is absent (caller blocks on `missing`).
   *  'none_declared' — leaf declares no artifacts_expected → guard N/A (NOT a pass). */
  status: 'verified' | 'missing' | 'none_declared'
  found: EvidenceRefType[]
  missing: string[]
}

/** Collect every `artifacts_expected` path declared across all phases of a leaf
 *  workflow.yaml, flattened in declaration order. */
function collectDeclared(parsed: unknown): string[] {
  const phases = (parsed as { phases?: unknown })?.phases
  if (!Array.isArray(phases)) return []
  const declared: string[] = []
  for (const ph of phases) {
    const arts = (ph as { artifacts_expected?: unknown })?.artifacts_expected
    if (Array.isArray(arts)) {
      for (const a of arts) if (typeof a === 'string') declared.push(a)
    }
  }
  return declared
}

/** Read the flattened sub's leaf `phases[].artifacts_expected`, stat + hash each.
 *  - no declared artifacts → `{ status: 'none_declared', found: [], missing: [] }`
 *    (guard N/A — NOT a pass; the three-state ledger marks it distinctly).
 *  - all present → `{ status: 'verified', found: [{path, sha256}], missing: [] }`.
 *  - some missing → `{ status: 'missing', missing populated }`: the caller blocks on
 *    `missing.length > 0`. `found` still carries the present artifacts.
 *
 *  TWO BASES (P0-A): the leaf workflow.yaml is located under `packageRoot`
 *  (harnessed install dir — `resolveWorkflowYaml` resolves against it, unchanged),
 *  but the declared ARTIFACTS are produced by the agent in the user PROJECT cwd, so
 *  they are stat'd/hashed relative to `process.cwd()`. `found[].path` stores the
 *  ABSOLUTE artifact path so `detectDrift` re-hashes the same file regardless of the
 *  later cwd (complete and drift share one base — no cwd漂移). `missing[]` keeps the
 *  declared relative path (human-readable in the block message). */
export async function checkArtifacts(
  sub: string,
  packageRoot: string,
): Promise<CheckArtifactsResult> {
  const yamlPath = await resolveWorkflowYaml(sub, resolve(packageRoot, 'workflows'))
  if (!yamlPath) return { status: 'none_declared', found: [], missing: [] }

  const parsed = parseYaml(await readFile(yamlPath, 'utf8'))
  const declared = collectDeclared(parsed)
  if (declared.length === 0) return { status: 'none_declared', found: [], missing: [] }

  const cwd = process.cwd()
  const found: EvidenceRefType[] = []
  const missing: string[] = []
  for (const rel of declared) {
    const abs = resolve(cwd, rel)
    const present = await stat(abs)
      .then((s) => s.isFile())
      .catch(() => false)
    // Store the ABSOLUTE path so detectDrift re-hashes the same file later (P0-A).
    if (present) found.push({ path: abs, sha256: await hashFile(abs) })
    else missing.push(rel)
  }
  // P1-3 three-state honesty: 'verified' when nothing missing; 'missing' when a
  // declared artifact is absent (caller still gates on `missing.length`).
  return { status: missing.length === 0 ? 'verified' : 'missing', found, missing }
}

export interface CheckPlanningSyncResult {
  /** 'verified'      — .planning/STATE.md is present (hard gate satisfied).
   *  'missing'       — .planning/ dir exists but STATE.md is absent (caller blocks).
   *  'none_declared' — no .planning/ dir in cwd → non-GSD user; guard N/A (NOT a pass). */
  status: 'verified' | 'missing' | 'none_declared'
  missing: string[]
}

/** Check whether the GSD .planning/ progress doc is in sync (Phase 12 强制执行哨兵 G2).
 *  Hard gate: .planning/STATE.md existence only. workflowState is accepted for future
 *  mtime-warn extension (locked decision D5) but unused in the predicate.
 *
 *  Three-state outcome:
 *  - no .planning/ dir → none_declared (non-GSD user; no block)
 *  - .planning/ present, STATE.md absent → missing (caller blocks on missing[])
 *  - .planning/STATE.md present → verified */
export async function checkPlanningSync(
  cwd: string,
  // Reserved for future mtime-warn extension (D5); unused in the hard-gate predicate.
  _workflowState: CurrentWorkflowV1Type | null,
): Promise<CheckPlanningSyncResult> {
  const planningDir = resolve(cwd, '.planning')
  const hasPlanningDir = await stat(planningDir)
    .then((s) => s.isDirectory())
    .catch(() => false)
  if (!hasPlanningDir) return { status: 'none_declared', missing: [] }

  const stateFile = resolve(cwd, '.planning', 'STATE.md')
  const hasStateFile = await stat(stateFile)
    .then((s) => s.isFile())
    .catch(() => false)
  if (!hasStateFile) return { status: 'missing', missing: ['.planning/STATE.md'] }

  return { status: 'verified', missing: [] }
}

export interface DriftEntry {
  path: string
  /** stored sha256 at completion. */
  was: string
  /** current sha256; '' when the file no longer exists. */
  now: string
}

/** Re-hash each stored evidence ref; list mismatches (handoff drift). A deleted/
 *  unreadable file counts as drift with `now: ''`. ADR-0033 D4: warn, not block. */
export async function detectDrift(evidence: EvidenceRefType[]): Promise<DriftEntry[]> {
  const drift: DriftEntry[] = []
  for (const ref of evidence) {
    const now = await hashFile(ref.path).catch(() => '')
    if (now !== ref.sha256) drift.push({ path: ref.path, was: ref.sha256, now })
  }
  return drift
}
