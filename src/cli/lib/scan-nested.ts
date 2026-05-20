// Phase v3.0-3.3 T3.3.W0.12 — Nested workflows/<stage>/<sub>/ 2-level scan helper.
// Split from setup-helpers.ts to keep both files within karpathy ≤200L limit
// (sister src/routing/lib/fallbackHandlers.ts ≤80L split pattern).
//
// Contract per RESEARCH-workflows § Area 4 (verbatim transcription):
//   Path A: flat top-level SKILL.md (research / retro keep; v2 legacy 3 cmd emit
//           deprecation warn + skip install per D-04).
//   Path B: nested 2-level workflows/<stage>/<sub>/SKILL.md
//           - sub === 'auto'  → master, slash-cmd flatten to bare `<stage>`
//           - sub !== 'auto'  → sub-stage, slash-cmd flatten to `<stage>-<sub>`
//   Skip:   disciplines/ + judgments/ (K10 — non-workflow manifest dirs).

import { readdir, stat } from 'node:fs/promises'
import { join } from 'node:path'

export interface NestedWorkflow {
  /** Slash-cmd name (flat) — e.g. "discuss-strategic" or "discuss" (master). */
  name: string
  /** Source dir relative to workflowsDir — e.g. "discuss/strategic" or "research". */
  relPath: string
  /** Whether this is a master (nested at <stage>/auto/SKILL.md). */
  isMaster: boolean
}

/** v2 → v3 deprecation map per D-04 (alias map). Flat top-level dirs that should
 *  be skipped install but emit warn; CHANGELOG [3.0.0] documents migration. */
export const FLAT_LEGACY_DEPRECATED = new Set(['plan-feature', 'execute-task', 'verify-work'])

/** Flat top-level dirs that remain valid as standalone v3 workflows (KEEP). */
export const FLAT_LEGACY_KEEP = new Set(['research', 'retro'])

/** Non-workflow manifest dirs to skip during nested scan (K10 mitigation). */
export const NON_WORKFLOW_DIRS = new Set(['disciplines', 'judgments'])

/** Collected deprecation warn lines — caller emits as a single block at end of scan
 *  per RESEARCH-workflows § Area 4 末段 (5L console block + CHANGELOG ref). */
export interface ScanResult {
  workflows: NestedWorkflow[]
  deprecated: string[]
}

/** Nested 2-level scan: top-level + 1 nested depth. */
export async function scanWorkflowsNested(
  workflowsDir: string,
  entries: string[],
): Promise<ScanResult> {
  const workflows: NestedWorkflow[] = []
  const deprecated: string[] = []

  for (const entry of entries.sort()) {
    if (NON_WORKFLOW_DIRS.has(entry)) continue // K10 — skip disciplines/ + judgments/

    const src = join(workflowsDir, entry)
    let s: { isDirectory: () => boolean }
    try {
      s = await stat(src)
    } catch {
      continue
    }
    if (!s.isDirectory()) continue

    // Path A: flat top-level SKILL.md (v2 legacy OR standalone v3 keep).
    let hasFlatSkill = false
    try {
      await stat(join(src, 'SKILL.md'))
      hasFlatSkill = true
    } catch {
      hasFlatSkill = false
    }

    if (hasFlatSkill) {
      if (FLAT_LEGACY_DEPRECATED.has(entry)) {
        deprecated.push(entry) // skip install — pure deprecate per D-04
        continue
      }
      if (FLAT_LEGACY_KEEP.has(entry)) {
        workflows.push({ name: entry, relPath: entry, isMaster: false })
        continue
      }
      // Unknown flat top-level with SKILL.md — install as-is (forward compat).
      workflows.push({ name: entry, relPath: entry, isMaster: false })
      continue
    }

    // Path B: nested 2-level — workflows/<stage>/<sub>/SKILL.md
    let subEntries: string[]
    try {
      subEntries = await readdir(src)
    } catch {
      continue
    }
    for (const sub of subEntries.sort()) {
      const subDir = join(src, sub)
      let ss: { isDirectory: () => boolean }
      try {
        ss = await stat(subDir)
      } catch {
        continue
      }
      if (!ss.isDirectory()) continue
      try {
        await stat(join(subDir, 'SKILL.md'))
      } catch {
        continue
      }
      // Flatten to slash-cmd name (per D-02 bare cmd):
      //   workflows/discuss/auto/      → /discuss          (master)
      //   workflows/discuss/strategic/ → /discuss-strategic (sub-stage)
      const name = sub === 'auto' ? entry : `${entry}-${sub}`
      workflows.push({ name, relPath: `${entry}/${sub}`, isMaster: sub === 'auto' })
    }
  }

  return { workflows, deprecated }
}

/** Render deprecation block per RESEARCH-workflows § Area 4 末段 verbatim text. */
export function renderDeprecationBlock(deprecated: string[]): string {
  if (deprecated.length === 0) return ''
  return [
    '⚠️ v3.0 BREAKING — v2 legacy slash cmd deprecated:',
    '  /plan-feature   → /plan (master) | /plan-phase (sub)',
    '  /execute-task   → /task (master) | /task-{clarify,code,test,deliver} (sub)',
    '  /verify-work    → /verify (master) | /verify-{progress,paranoid,qa,security,design,simplify,multispec} (sub)',
    '  /research, /retro 不变',
    '  详见 CHANGELOG [3.0.0]',
    `  skipped install: ${deprecated.sort().join(', ')}`,
    '',
  ].join('\n')
}
