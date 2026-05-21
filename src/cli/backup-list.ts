// Phase 1.2 cli subcommand `backup list` per ADR 0004 § 3.
//
// Lists all backup snapshots under .harnessed-backup/<timestamp>/metadata.json
// with installer / manifest / timestamp / file-count summary. Sister to
// gc.ts (which deletes old snapshots) and rollback.ts (which restores from
// a chosen timestamp).

import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { Command } from 'commander'
import { t } from '../i18n/index.js'
import { getBackupRoot } from '../installers/lib/backup.js'

interface BackupMetadata {
  installer: string
  manifest: string
  timestamp: string
  files: Array<{ target: string }>
}

export function registerBackupList(program: Command): void {
  const backup = program.command('backup').description('Backup snapshot operations')
  backup
    .command('list')
    .description('List backup snapshots under .harnessed-backup/')
    .action(async () => {
      const root = getBackupRoot()
      let dirs: string[]
      try {
        dirs = (await readdir(root, { withFileTypes: true }))
          .filter((e) => e.isDirectory())
          .map((e) => e.name)
          .sort()
      } catch {
        console.log(t('backup.no_backups', { root }))
        return
      }
      if (dirs.length === 0) {
        console.log(t('backup.no_backups_empty', { root }))
        return
      }
      for (const ts of dirs) {
        try {
          const meta = JSON.parse(
            await readFile(join(root, ts, 'metadata.json'), 'utf8'),
          ) as BackupMetadata
          console.log(
            `${ts}  ${meta.manifest}  (${meta.files.length} file${meta.files.length === 1 ? '' : 's'})`,
          )
        } catch {
          console.log(`${ts}  (metadata.json missing or unreadable)`)
        }
      }
      console.log(t('backup.total_snapshots', { count: dirs.length }))
    })
}
