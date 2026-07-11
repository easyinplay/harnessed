// 4.24.0 (intel gap-close G1/G2, TDD red-first) — backup-before-overwrite for
// installed skill dirs.
//
// Intel provenance (.planning/intel/omc-comparison.md § issue #3/#4/#5 对照 +
// 增补 2): Trellis backs up + hash-classifies before update ("assume it's
// modified (conservative)" when no hash is recorded); comet refuses to take
// over dirs with unmanaged entries. harnessed ADAPTS: engine names belong to
// the engine (4.23.0 last-writer design) so we never refuse — we back up the
// content being replaced and overwrite loudly.
//
// Real-tmpdir pattern per tests/cli/lib/skillIntegrity.test.ts.

import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  backupSkillDir,
  newBackupSessionDir,
  skillContentMatchesLedger,
} from '../../../src/cli/lib/skillBackup.js'
import { type SkillHashLedger, sha256Of } from '../../../src/cli/lib/skillIntegrity.js'

let skillsBase: string
let backupRoot: string

function installSkill(name: string, body: string, extras: Record<string, string> = {}): void {
  mkdirSync(join(skillsBase, name), { recursive: true })
  writeFileSync(join(skillsBase, name, 'SKILL.md'), body, 'utf8')
  for (const [rel, content] of Object.entries(extras)) {
    mkdirSync(join(skillsBase, name, ...rel.split('/').slice(0, -1)), { recursive: true })
    writeFileSync(join(skillsBase, name, ...rel.split('/')), content, 'utf8')
  }
}

beforeEach(() => {
  skillsBase = mkdtempSync(join(tmpdir(), 'harnessed-skb-skills-'))
  backupRoot = mkdtempSync(join(tmpdir(), 'harnessed-skb-bak-'))
})
afterEach(() => {
  rmSync(skillsBase, { recursive: true, force: true })
  rmSync(backupRoot, { recursive: true, force: true })
})

describe('newBackupSessionDir', () => {
  it('composes <root>/<ts>-<label> with a Windows-safe timestamp (no colons)', () => {
    const dir = newBackupSessionDir('step-a', backupRoot)
    expect(dir.startsWith(backupRoot)).toBe(true)
    const leaf = basename(dir)
    expect(leaf).toMatch(/-step-a$/)
    expect(leaf).not.toContain(':')
  })
})

describe('backupSkillDir', () => {
  it('copies the skill dir tree into <session>/<name> and returns ok + dir', async () => {
    installSkill('research', 'engine body', { 'references/notes.md': 'notes' })
    const session = newBackupSessionDir('step-a', backupRoot)
    const r = await backupSkillDir('research', skillsBase, session)
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(readFileSync(join(r.dir, 'SKILL.md'), 'utf8')).toBe('engine body')
      expect(readFileSync(join(r.dir, 'references', 'notes.md'), 'utf8')).toBe('notes')
    }
  })

  it('missing skill dir → { ok:false, code:ENOENT } and no session-dir litter (fresh install)', async () => {
    const session = newBackupSessionDir('step-a', backupRoot)
    const r = await backupSkillDir('absent', skillsBase, session)
    expect(r).toMatchObject({ ok: false, code: 'ENOENT' })
    // stat-before-mkdir: a fresh install must not leave empty session dirs behind.
    expect(() => readFileSync(join(session, 'README.txt'))).toThrow()
  })

  it('writes a one-line README.txt restore hint into the session dir', async () => {
    installSkill('retro', 'retro body')
    const session = newBackupSessionDir('skill-heal', backupRoot)
    const r = await backupSkillDir('retro', skillsBase, session)
    expect(r.ok).toBe(true)
    const readme = readFileSync(join(session, 'README.txt'), 'utf8')
    expect(readme).toMatch(/harnessed setup/)
    expect(readme).toMatch(/copy/i)
  })
})

describe('skillContentMatchesLedger (Trellis conservative semantics)', () => {
  const ledgerFor = (name: string, text: string): SkillHashLedger => ({
    [name]: { sha256: sha256Of(text), version: '9.9.9', rendered_at: 'now' },
  })

  it('true — installed SKILL.md sha256 equals the ledger record (pristine, skip backup)', async () => {
    installSkill('research', 'rendered body')
    const r = await skillContentMatchesLedger(
      'research',
      skillsBase,
      ledgerFor('research', 'rendered body'),
    )
    expect(r).toBe(true)
  })

  it('false — content diverged from the ledger record (back up before overwrite)', async () => {
    installSkill('research', 'externally overwritten body')
    const r = await skillContentMatchesLedger(
      'research',
      skillsBase,
      ledgerFor('research', 'rendered body'),
    )
    expect(r).toBe(false)
  })

  it('null (conservative = assume modified) — ledger null / entry absent / SKILL.md unreadable', async () => {
    installSkill('research', 'body')
    expect(await skillContentMatchesLedger('research', skillsBase, null)).toBeNull()
    expect(
      await skillContentMatchesLedger('research', skillsBase, ledgerFor('other', 'x')),
    ).toBeNull()
    expect(
      await skillContentMatchesLedger(
        'no-skill-on-disk',
        skillsBase,
        ledgerFor('no-skill-on-disk', 'x'),
      ),
    ).toBeNull()
  })
})
