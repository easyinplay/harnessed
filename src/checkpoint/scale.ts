// src/checkpoint/scale.ts — G1 scale-adaptive verify strength. Pure assessScale
// (schema-type-only, zero I/O — sister of ledger.ts purity); collectScaleMetrics
// is the impure git/.planning collector, fail-soft per design (absent signal -> 0).

import { exec } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { promisify } from 'node:util'
import type { SubProgressEntryType } from './schema/currentWorkflow.v1.js'

const execp = promisify(exec)

export interface ScaleMetrics {
  changedFiles: number
  firedSubs: number
  requirements: number
}

/** Pure decision: 'full' verify when ANY signal exceeds its threshold, else 'light'. */
export function assessScale(m: ScaleMetrics): 'light' | 'full' {
  return m.changedFiles > 5 || m.firedSubs > 4 || m.requirements > 3 ? 'full' : 'light'
}

/** Impure collector. All three signals fail-soft to 0 (git absent / no merge-base /
 *  no .planning) so a non-GSD repo with no git still yields a deterministic 'light'. */
export async function collectScaleMetrics(
  cwd: string,
  ledger: SubProgressEntryType[],
): Promise<ScaleMetrics> {
  const firedSubs = ledger.filter((e) => e.status !== 'skipped').length
  return {
    changedFiles: await countChangedFiles(cwd),
    firedSubs,
    requirements: await countRequirements(cwd),
  }
}

async function countChangedFiles(cwd: string): Promise<number> {
  try {
    const { stdout: base } = await execp('git merge-base HEAD origin/main', { cwd })
    const ref = base.trim()
    if (!ref) return 0
    const { stdout } = await execp(`git diff --name-only ${ref}`, { cwd })
    return stdout.split('\n').filter((l) => l.trim() !== '').length
  } catch {
    return 0
  }
}

async function countRequirements(cwd: string): Promise<number> {
  try {
    const text = await readFile(resolve(cwd, '.planning', 'REQUIREMENTS.md'), 'utf8')
    // Acceptance items are markdown list lines (`- ` / `* ` / `1. `).
    return text.split('\n').filter((l) => /^\s*([-*]|\d+\.)\s+/.test(l)).length
  } catch {
    return 0
  }
}
