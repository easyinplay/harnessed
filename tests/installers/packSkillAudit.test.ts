// 4.23.0 (issue #3, T3) — pack skill-name audit (pre-warn + post snapshot-diff).
//
// Flat ~/.claude/skills namespace: a pack skill named like a shipped workflow
// clobbers the engine file (observed: mattpocock research, gstack retro/ship).
// External writers can't be intercepted — the audit warns pre-install off the
// manifest's `installs_skills` declaration and post-install off a dir diff
// (undeclared new names = upstream drift detector). Advisory + fail-soft.

import { mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  auditPostInstall,
  resetShippedWorkflowNamesCache,
  snapshotSkillNames,
  warnDeclaredCollisions,
} from '../../src/installers/lib/packSkillAudit.js'
import type { InstallContext } from '../../src/installers/lib/types.js'

let skillsDir: string
let warned: string[]
let warnSpy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  skillsDir = mkdtempSync(join(tmpdir(), 'harnessed-packaudit-'))
  warned = []
  warnSpy = vi.spyOn(console, 'warn').mockImplementation((...args: unknown[]) => {
    warned.push(args.map(String).join(' '))
  })
  resetShippedWorkflowNamesCache()
})
afterEach(() => {
  warnSpy.mockRestore()
  rmSync(skillsDir, { recursive: true, force: true })
  resetShippedWorkflowNamesCache()
})

function ctxWith(declared: string[] | undefined, pack = 'test-pack'): InstallContext {
  return {
    manifest: {
      metadata: { name: pack },
      spec: { install: declared ? { installs_skills: declared } : {} },
    },
  } as unknown as InstallContext
}

describe('snapshotSkillNames', () => {
  it('lists skill DIRECTORIES only; empty set on unreadable dir (fail-soft)', async () => {
    mkdirSync(join(skillsDir, 'research'))
    mkdirSync(join(skillsDir, 'retro'))
    expect(await snapshotSkillNames(skillsDir)).toEqual(new Set(['research', 'retro']))
    expect(await snapshotSkillNames(join(skillsDir, 'nope'))).toEqual(new Set())
  })
})

describe('warnDeclaredCollisions (pre-install)', () => {
  // Real shipped-workflow scan (repo assets): research / retro / ship ARE
  // shipped workflow names — the实测 collision set of issue #3.
  it('warns when declared names collide with shipped workflows', async () => {
    await warnDeclaredCollisions(ctxWith(['research', 'totally-unique-name'], 'mattpocock-skills'))
    const out = warned.join('\n')
    expect(out).toContain('mattpocock-skills')
    expect(out).toContain('research')
    expect(out).not.toContain('totally-unique-name')
  })

  it('silent when nothing declared or no collision', async () => {
    await warnDeclaredCollisions(ctxWith(undefined))
    await warnDeclaredCollisions(ctxWith(['no-such-workflow-name']))
    expect(warned).toEqual([])
  })
})

describe('auditPostInstall (snapshot-diff)', () => {
  it('warns on new names the manifest did NOT declare (upstream drift)', async () => {
    const before = await snapshotSkillNames(skillsDir)
    mkdirSync(join(skillsDir, 'declared-skill'))
    mkdirSync(join(skillsDir, 'surprise-skill'))
    await auditPostInstall(ctxWith(['declared-skill']), before, skillsDir)
    const out = warned.join('\n')
    expect(out).toContain('surprise-skill')
    expect(out).toContain('not declared in installs_skills')
    expect(out).not.toMatch(/declared-skill.*not declared/)
  })

  it('warns on collision with a shipped workflow name (post-write detection)', async () => {
    const before = await snapshotSkillNames(skillsDir)
    mkdirSync(join(skillsDir, 'retro'))
    await auditPostInstall(ctxWith(['retro'], 'gstack'), before, skillsDir)
    const out = warned.join('\n')
    expect(out).toContain('overwrote harnessed workflow skill')
    expect(out).toContain('retro')
  })

  it('silent when the install added nothing', async () => {
    mkdirSync(join(skillsDir, 'pre-existing'))
    const before = await snapshotSkillNames(skillsDir)
    await auditPostInstall(ctxWith(['pre-existing']), before, skillsDir)
    expect(warned).toEqual([])
  })

  it('undeclared-name warning only fires for packs that DO declare (opt-in contract)', async () => {
    const before = await snapshotSkillNames(skillsDir)
    mkdirSync(join(skillsDir, 'anything'))
    await auditPostInstall(ctxWith(undefined), before, skillsDir)
    expect(warned.join('\n')).not.toContain('not declared')
  })
})
