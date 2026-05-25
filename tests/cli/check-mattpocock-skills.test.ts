// v3.6.0 Phase 2 Wave 3 — checkMattpocockSkills helper PRIMARY coverage.
// Sister Phase 3.4 W1 T1.3 check-token-budget.test.ts tmpdir + HOME redirect
// + vi.resetModules per-cell isolation pattern (real fs, NOT global mock).

import { mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

let tmpRoot: string
let origHome: string | undefined
let origUserprofile: string | undefined

beforeEach(() => {
  origHome = process.env.HOME
  origUserprofile = process.env.USERPROFILE
  tmpRoot = mkdtempSync(join(tmpdir(), 'check-matt-'))
  // Redirect homedir() lookup to tmp via HOME (POSIX) + USERPROFILE (Windows)
  process.env.HOME = tmpRoot
  process.env.USERPROFILE = tmpRoot
  vi.resetModules()
})

afterEach(() => {
  if (origHome === undefined) delete process.env.HOME
  else process.env.HOME = origHome
  if (origUserprofile === undefined) delete process.env.USERPROFILE
  else process.env.USERPROFILE = origUserprofile
  rmSync(tmpRoot, { recursive: true, force: true })
})

describe('checkMattpocockSkills — v3.6.0 Phase 2 Wave 3 (plugin / user-skill / missing)', () => {
  it('1. plugin form present (~/.claude/plugins/cache/.../1.2.0/) → status=pass + version message', async () => {
    mkdirSync(
      join(
        tmpRoot,
        '.claude',
        'plugins',
        'cache',
        'mattpocock-skills',
        'mattpocock-skills',
        '1.2.0',
      ),
      { recursive: true },
    )
    const { checkMattpocockSkills } = await import('../../src/cli/lib/check-mattpocock-skills.js')
    const r = await checkMattpocockSkills()
    expect(r.status).toBe('pass')
    expect(r.message).toMatch(/installed as plugin/)
    expect(r.message).toMatch(/1\.2\.0/)
  })

  it('2. user-skill form present (~/.claude/skills/mattpocock-skills/) → status=pass + user-skill message', async () => {
    mkdirSync(join(tmpRoot, '.claude', 'skills', 'mattpocock-skills'), { recursive: true })
    const { checkMattpocockSkills } = await import('../../src/cli/lib/check-mattpocock-skills.js')
    const r = await checkMattpocockSkills()
    expect(r.status).toBe('pass')
    expect(r.message).toMatch(/installed as user-skill/)
  })

  it('3. both forms missing → status=warn + REMEDIATION fix (non-blocking per R2.4.1)', async () => {
    // tmpRoot is empty — no .claude/ tree at all
    const { checkMattpocockSkills } = await import('../../src/cli/lib/check-mattpocock-skills.js')
    const r = await checkMattpocockSkills()
    expect(r.status).toBe('warn')
    expect(r.message).toMatch(/not installed/)
    // v3.9.1 — switched from `claude plugin install` (default marketplace miss)
    // to upstream `skills` CLI per dogfood discovery.
    expect(r.fix).toMatch(/npx skills@latest add mattpocock\/skills/)
    expect(r.fix).toMatch(/role-prompts\.yaml/)
    expect(r.install_commands).toEqual(['npx skills@latest add mattpocock/skills'])
  })
})
