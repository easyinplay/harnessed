// Phase v3.0-3.3 T3.3.W0.12 — Nested workflows/<stage>/<sub>/ 2-level scan helper.
//
// Contract:
//   Path A: flat top-level SKILL.md (research / retro / auto — standalone v3 workflows).
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

/** Flat top-level dirs that remain valid as standalone v3 workflows.
 *  research / retro / auto: native standalone v3 workflows. */
export const FLAT_LEGACY_KEEP = new Set(['research', 'retro', 'auto'])

/** v3.1.0 — Top-level standalone dirs that are super-masters (isMaster=true flag
 *  for setup.ts `(master)` tag rendering). Currently only `auto`; sister research /
 *  retro remain non-master standalone workflows. */
export const FLAT_TOP_LEVEL_MASTERS = new Set(['auto'])

/** Non-workflow manifest dirs to skip during nested scan (K10 mitigation). */
export const NON_WORKFLOW_DIRS = new Set(['disciplines', 'judgments'])

export interface ScanResult {
  workflows: NestedWorkflow[]
}

/** Nested 2-level scan: top-level + 1 nested depth. */
export async function scanWorkflowsNested(
  workflowsDir: string,
  entries: string[],
): Promise<ScanResult> {
  const workflows: NestedWorkflow[] = []

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
      if (FLAT_LEGACY_KEEP.has(entry)) {
        workflows.push({ name: entry, relPath: entry, isMaster: FLAT_TOP_LEVEL_MASTERS.has(entry) })
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

  return { workflows }
}
