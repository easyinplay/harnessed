// 4.23.0 (issue #3, T1) — installed-skill integrity audit (TDD).
//
// Baseline = the INSTALL-TIME HASH LEDGER (user decision 2026-07-10): Step A.5
// renders capability-cmd + locale substitutions into the installed SKILL.md, so
// installed ≠ bundled source is LEGAL — a naive source-hash comparison would
// flag every workflow. The ledger pins the rendered state; divergence from the
// LEDGER is what the audit catches. Four bad states + ok:
//   ok / foreign (marker gone — the issue #3 pack-clobber class) /
//   tampered (marker kept, hash diverged) / stale (older marker version or no
//   ledger record — non-accusatory) / missing (skill deleted).

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  attachCulprits,
  auditInstalledSkills,
  buildCulpritIndex,
  integrityReportLines,
  readHashLedger,
  recordSkillHashes,
  type SkillHashLedger,
  sha256Of,
} from '../../../src/cli/lib/skillIntegrity.js'

const V = '9.9.9' // marker version used for both source + installed fixtures
const marked = (body: string, version = V) =>
  `---\nname: x\n---\n<!-- harnessed-generated:v${version} -->\n${body}\n`

let skillsBase: string
let workflowsBase: string

function installSkill(name: string, content: string): void {
  mkdirSync(join(skillsBase, name), { recursive: true })
  writeFileSync(join(skillsBase, name, 'SKILL.md'), content, 'utf8')
}

// Bundled source counterpart — every real shipped SKILL.md carries the marker;
// the audit's degraded-env gate skips names whose source it cannot verify.
function installSource(name: string, content = marked('bundled source body')): void {
  mkdirSync(join(workflowsBase, name), { recursive: true })
  writeFileSync(join(workflowsBase, name, 'SKILL.md'), content, 'utf8')
}

beforeEach(() => {
  skillsBase = mkdtempSync(join(tmpdir(), 'harnessed-integ-'))
  workflowsBase = mkdtempSync(join(tmpdir(), 'harnessed-integ-src-'))
})
afterEach(() => {
  rmSync(skillsBase, { recursive: true, force: true })
  rmSync(workflowsBase, { recursive: true, force: true })
})

const wf = (name: string) => ({ name, relPath: name })

describe('auditInstalledSkills (ledger-based, four bad states)', () => {
  it('ok — installed hash matches the ledger entry', async () => {
    const text = marked('engine body')
    installSource('research')
    installSkill('research', text)
    const ledger: SkillHashLedger = {
      research: { sha256: sha256Of(text), version: V, rendered_at: 't' },
    }
    const audit = await auditInstalledSkills([wf('research')], skillsBase, workflowsBase, {
      ledger,
    })
    expect(audit).toEqual([{ name: 'research', status: 'ok' }])
  })

  it('foreign — no harnessed marker (pack clobber, the issue #3 class)', async () => {
    installSource('research')
    installSkill('research', '---\nname: research\n---\nDeep research skill (mattpocock)\n')
    const audit = await auditInstalledSkills([wf('research')], skillsBase, workflowsBase, {
      ledger: {},
    })
    expect(audit).toEqual([{ name: 'research', status: 'foreign' }])
  })

  it('tampered — marker kept but hash diverged from the ledger', async () => {
    const original = marked('engine body')
    installSource('retro')
    installSkill('retro', `${original}\n<!-- hand edit that keeps the marker -->\n`)
    const ledger: SkillHashLedger = {
      retro: { sha256: sha256Of(original), version: V, rendered_at: 't' },
    }
    const audit = await auditInstalledSkills([wf('retro')], skillsBase, workflowsBase, {
      ledger,
    })
    expect(audit).toEqual([{ name: 'retro', status: 'tampered' }])
  })

  it('stale — ledger has no record for the name (pre-4.23.0 install)', async () => {
    installSource('ship')
    installSkill('ship', marked('engine body'))
    const audit = await auditInstalledSkills([wf('ship')], skillsBase, workflowsBase, {
      ledger: {},
    })
    expect(audit).toEqual([{ name: 'ship', status: 'stale' }])
  })

  it('stale — ledger absent entirely (null), never misreports tampered', async () => {
    installSource('ship')
    installSkill('ship', marked('engine body'))
    const audit = await auditInstalledSkills([wf('ship')], skillsBase, workflowsBase, {
      ledger: null,
    })
    expect(audit).toEqual([{ name: 'ship', status: 'stale' }])
  })

  it('stale — installed marker older than the bundled SOURCE marker (even with a ledger hit)', async () => {
    const text = marked('engine body', '9.9.8')
    installSource('auto')
    installSkill('auto', text)
    const ledger: SkillHashLedger = {
      auto: { sha256: sha256Of(text), version: '9.9.8', rendered_at: 't' },
    }
    const audit = await auditInstalledSkills([wf('auto')], skillsBase, workflowsBase, {
      ledger,
    })
    expect(audit).toEqual([{ name: 'auto', status: 'stale' }])
  })

  it('missing — no installed SKILL.md at all', async () => {
    installSource('gone')
    const audit = await auditInstalledSkills([wf('gone')], skillsBase, workflowsBase, {
      ledger: {},
    })
    expect(audit).toEqual([{ name: 'gone', status: 'missing' }])
  })

  it('degraded env — unreadable/unmarked SOURCE → name skipped entirely (no misreport)', async () => {
    installSkill('mystery', 'no marker anywhere') // installed, but source unverifiable
    installSource('unmarked', 'source without a marker')
    installSkill('unmarked', 'whatever')
    const audit = await auditInstalledSkills(
      [wf('mystery'), wf('unmarked')],
      skillsBase,
      workflowsBase,
      { ledger: {} },
    )
    expect(audit).toEqual([])
  })
})

describe('recordSkillHashes → readHashLedger round-trip', () => {
  it('pins the CURRENT on-disk (rendered) state and merges into an existing ledger', async () => {
    const text = marked('rendered body with /gstack:review substituted')
    installSource('verify-paranoid')
    installSkill('verify-paranoid', text)
    const ledgerFile = join(skillsBase, 'skill-hashes.json')
    writeFileSync(
      ledgerFile,
      JSON.stringify({ other: { sha256: 'x', version: '1.0.0', rendered_at: 't' } }),
      'utf8',
    )
    await recordSkillHashes(['verify-paranoid', 'not-on-disk'], skillsBase, ledgerFile, V)
    const ledger = await readHashLedger(ledgerFile)
    expect(ledger?.['verify-paranoid']?.sha256).toBe(sha256Of(text))
    expect(ledger?.['verify-paranoid']?.version).toBe(V)
    expect(ledger?.other?.sha256).toBe('x') // merge, not clobber
    expect(ledger?.['not-on-disk']).toBeUndefined() // absent skill → no entry
    // the recorded audit closes the loop: rendered state now reads ok
    const audit = await auditInstalledSkills([wf('verify-paranoid')], skillsBase, workflowsBase, {
      ledger,
    })
    expect(audit[0]?.status).toBe('ok')
  })

  it('readHashLedger → null on absent/corrupt file (fail-soft)', async () => {
    expect(await readHashLedger(join(skillsBase, 'nope.json'))).toBeNull()
    const bad = join(skillsBase, 'bad.json')
    writeFileSync(bad, '{oops', 'utf8')
    expect(await readHashLedger(bad)).toBeNull()
  })
})

describe('buildCulpritIndex + attachCulprits (installs_skills declarations)', () => {
  it('maps declared skill names to their pack; only FOREIGN entries get attributed', async () => {
    const m1 = join(skillsBase, 'mattpocock-skills.yaml')
    writeFileSync(
      m1,
      'metadata:\n  name: mattpocock-skills\nspec:\n  install:\n    installs_skills:\n      - research\n      - tdd\n',
      'utf8',
    )
    const index = await buildCulpritIndex([m1, join(skillsBase, 'unreadable.yaml')])
    expect(index.get('research')).toBe('mattpocock-skills')
    const out = attachCulprits(
      [
        { name: 'research', status: 'foreign' },
        { name: 'tdd', status: 'stale' }, // stale is NOT a pack accusation
        { name: 'auto', status: 'ok' },
      ],
      index,
    )
    expect(out[0]?.culprit).toBe('mattpocock-skills')
    expect(out[1]?.culprit).toBeUndefined()
    expect(out[2]?.culprit).toBeUndefined()
  })
})

describe('integrityReportLines', () => {
  it('empty for a clean audit; names per-state reasons + culprit otherwise', () => {
    expect(integrityReportLines([{ name: 'a', status: 'ok' }])).toEqual([])
    const lines = integrityReportLines([
      { name: 'research', status: 'foreign', culprit: 'mattpocock-skills' },
      { name: 'retro', status: 'tampered' },
      { name: 'ship', status: 'stale' },
    ]).join('\n')
    expect(lines).toMatch(/3 harnessed workflow skill/)
    expect(lines).toContain("likely overwritten by pack 'mattpocock-skills'")
    expect(lines).toMatch(/modified since install/)
    expect(lines).toMatch(/re-run `harnessed setup`/)
  })
})
