// Phase 20 — read-only stale-state inventory for `harnessed update --migration-report`
// (borrowed from Chachamaru127/claude-code-harness `doctor --migration-report`).
// existsSync ONLY — this module deletes nothing. `not_observed != absent`: a
// missing item means "not found here", reported as present:false, never removed.

import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

export interface MigrationItem {
  name: string
  present: boolean
  path: string
  hint: string
}

/** Inventory stale harnessed state. Read-only — never deletes. `cwd` is the repo,
 *  `root` is the harnessed root (`~/.claude/harnessed`). */
export function collectMigrationReport(cwd: string, root: string): MigrationItem[] {
  const candidates: Omit<MigrationItem, 'present'>[] = [
    {
      name: 'legacy current-workflow.json',
      path: join(root, 'current-workflow.json'),
      hint: 'post-Phase-15 multi-workflow this is only the dual-write rollback anchor — removable once workflows.json is proven',
    },
    {
      name: 'legacy backup dir (.harnessed-backup)',
      path: join(cwd, '.harnessed-backup'),
      hint: 'pre-v2 in-repo backup dir — safe to remove if migrated to ~/.harnessed/backups',
    },
    {
      name: 'home backups (~/.harnessed/backups)',
      path: join(homedir(), '.harnessed', 'backups'),
      hint: 'accumulated setup backups — prune old entries manually if large',
    },
    {
      name: 'rogue impl reference',
      path: join(cwd, '.planning', 'phases', '_rogue-impl-reference'),
      hint: 'local known-defective reference patches — remove once no longer needed (untracked)',
    },
  ]
  return candidates.map((c) => ({ ...c, present: existsSync(c.path) }))
}
