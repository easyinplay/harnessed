// 4.24.0 (intel gap-close G1/G2) — backup-before-overwrite for installed skill dirs.
//
// Intel provenance (.planning/intel/omc-comparison.md § issue #3/#4/#5 对照 +
// 增补 2): Trellis hash-classifies before update and treats "no hash recorded"
// as modified ("assume it's modified (conservative)"); comet refuses to take
// over dirs containing unmanaged entries. harnessed ADAPTS rather than adopts:
// engine names contractually belong to the engine (4.23.0 last-writer design),
// so we never refuse — we back up the content being replaced (it may be a
// pack's only copy of a skill, or a user edit) and overwrite loudly.
//
// Consumers: setup Step A (pre-overwrite, only when the installed content is
// not the pristine install-time ledger state) and the end-of-run self-heal
// (always — the content being healed away is foreign/tampered by definition).
// All paths fail-soft: a failed backup warns but never blocks install/heal —
// engine integrity outranks the backup (task_plan 4.24.0 G1 decision).
//
// New module on purpose (mock-export-gap 铁律): setup test suites factory-mock
// several sibling modules; adding exports there breaks their factories.

import { cp, mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { getBackupRoot } from '../../installers/lib/backup.js'
import { type SkillHashLedger, sha256Of } from './skillIntegrity.js'

export type SkillBackupResult =
  | { ok: true; dir: string }
  | { ok: false; code: 'ENOENT' | 'ERR'; message: string }

/** One session dir groups every skill backup of a single setup run:
 *  `<backupRoot>/<ISO-ts>-<label>/` (ISO `:` → `-`, Windows filename safety —
 *  sister backup.ts convention). Pure path composition, no fs side effects. */
export function newBackupSessionDir(label: string, root: string = getBackupRoot()): string {
  const ts = new Date().toISOString().replace(/:/g, '-')
  return join(root, `${ts}-${label}`)
}

/** Copy `<skillsBase>/<name>` into `<sessionDir>/<name>`. A missing source dir
 *  returns the distinct ENOENT non-error (fresh install — nothing to back up,
 *  callers stay silent and no session-dir litter is created); every other
 *  failure carries its message for a loud warn at the call site. */
export async function backupSkillDir(
  name: string,
  skillsBase: string,
  sessionDir: string,
): Promise<SkillBackupResult> {
  const src = join(skillsBase, name)
  // stat BEFORE mkdir so a fresh install leaves no empty session dirs behind.
  try {
    await stat(src)
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code
    if (code === 'ENOENT') return { ok: false, code: 'ENOENT', message: 'nothing on disk' }
    return { ok: false, code: 'ERR', message: (err as Error).message }
  }
  const dest = join(sessionDir, name)
  try {
    await mkdir(sessionDir, { recursive: true })
    await cp(src, dest, { recursive: true, force: true })
  } catch (err) {
    return { ok: false, code: 'ERR', message: (err as Error).message }
  }
  // One-line human hint. Skill sessions are plain dir mirrors (restore = copy
  // back), unlike manifest backups whose metadata.json feeds `rollback`.
  try {
    await writeFile(
      join(sessionDir, 'README.txt'),
      'Pre-overwrite copies of installed skill dirs, taken by `harnessed setup` before replacing them. Restore = copy a dir back into ~/.claude/skills/.\n',
      'utf8',
    )
  } catch {
    /* hint only — never fails the backup */
  }
  return { ok: true, dir: dest }
}

/** Is the installed `<skillsBase>/<name>/SKILL.md` byte-identical (sha256) to
 *  what setup last wrote per the install-time ledger?
 *    true  — pristine ours; overwrite silently, no backup needed.
 *    false — diverged from the ledger record; back up before overwriting.
 *    null  — no usable baseline (ledger absent/entry missing/file unreadable):
 *            conservative = treat as modified (Trellis "assume it's modified"). */
export async function skillContentMatchesLedger(
  name: string,
  skillsBase: string,
  ledger: SkillHashLedger | null,
): Promise<boolean | null> {
  const record = ledger?.[name]
  if (!record) return null
  let text: unknown
  try {
    text = await readFile(join(skillsBase, name, 'SKILL.md'), 'utf8')
  } catch {
    return null
  }
  if (typeof text !== 'string') return null
  try {
    return sha256Of(text) === record.sha256
  } catch {
    return null
  }
}
