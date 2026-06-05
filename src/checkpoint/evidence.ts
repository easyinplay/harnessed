// v5.0 Spec 1 (ADR-0033 D2/D4) — fail-closed evidence guard primitives.
//
// The only fs/crypto touch of the state-machine core (design §9 component isolation).
// Three pure-ish functions, no state-file I/O (the caller in checkpoint.ts owns that):
//   - hashFile         : sha256 hex of a file's bytes.
//   - checkArtifacts   : locate a sub's leaf workflow.yaml, read declared
//                        `phases[].artifacts_expected`, stat + hash each. Three-state
//                        outcome (none_declared / verified / partial-with-missing).
//   - detectDrift      : re-hash stored evidence refs, list path/was/now mismatches
//                        (cross-CC handoff drift — warn, not block, per ADR-0033 D4).

import { createHash } from 'node:crypto'
import { readFile, stat } from 'node:fs/promises'
import { resolve } from 'node:path'
import { parse as parseYaml } from 'yaml'
import { resolveWorkflowYaml } from '../cli/run.js'
import type { EvidenceRefType } from './schema/currentWorkflow.v1.js'

/** sha256 hex digest of a file's bytes. */
export async function hashFile(path: string): Promise<string> {
  const buf = await readFile(path)
  return createHash('sha256').update(buf).digest('hex')
}

export interface CheckArtifactsResult {
  /** 'verified' — all declared artifacts present (sha256 recorded).
   *  'none_declared' — leaf declares no artifacts_expected → guard N/A (NOT a pass). */
  status: 'verified' | 'none_declared'
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
 *  - some missing → `{ status: 'none_declared'-NO; missing populated }`: the caller
 *    blocks on `missing.length > 0`. `found` still carries the present artifacts.
 *
 *  Artifact paths are resolved relative to `packageRoot` (cwd-independent). */
export async function checkArtifacts(
  sub: string,
  packageRoot: string,
): Promise<CheckArtifactsResult> {
  const yamlPath = await resolveWorkflowYaml(sub, resolve(packageRoot, 'workflows'))
  if (!yamlPath) return { status: 'none_declared', found: [], missing: [] }

  const parsed = parseYaml(await readFile(yamlPath, 'utf8'))
  const declared = collectDeclared(parsed)
  if (declared.length === 0) return { status: 'none_declared', found: [], missing: [] }

  const found: EvidenceRefType[] = []
  const missing: string[] = []
  for (const rel of declared) {
    const abs = resolve(packageRoot, rel)
    const present = await stat(abs)
      .then((s) => s.isFile())
      .catch(() => false)
    if (present) found.push({ path: rel, sha256: await hashFile(abs) })
    else missing.push(rel)
  }
  // 'verified' only when nothing is missing; otherwise the caller blocks on `missing`.
  return { status: missing.length === 0 ? 'verified' : 'none_declared', found, missing }
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
