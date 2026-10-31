import { readFileSync } from 'node:fs'
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { parse } from 'yaml'
import {
  discoverDeclaredOwnership,
  snapshotDeclaredOwnership,
  writeDeclaredOwnershipReceipt,
} from '../../src/installers/lib/ownershipContract.js'
import { readSkillOwnershipReceipt } from '../../src/installers/lib/skillOwnershipReceipt.js'
import type { InstallContext } from '../../src/installers/lib/types.js'
import { createHostInstallContext } from '../../src/platform/hostInstallContext.js'
import { claudeDescriptor } from '../../src/platform/platform.js'

const homes: string[] = []

async function fixture(): Promise<InstallContext> {
  const home = await mkdtemp(join(tmpdir(), 'harnessed-ownership-contract-'))
  homes.push(home)
  const descriptor = claudeDescriptor(home)
  return {
    manifest: {
      metadata: { name: 'gsd' },
      spec: {
        install: { method: 'npm-cli', cmd: 'npx gsd' },
        ownership: {
          resources: [
            {
              root: 'platform-skills',
              kind: 'directory',
              selector: { prefix: 'gsd-' },
              marker: { path: 'SKILL.md', contains: 'gsd-core' },
            },
            {
              root: 'native-home',
              kind: 'directory',
              selector: { names: ['gsd-core'] },
              marker: { path: 'bin/gsd-tools.cjs', contains: 'GSD Tools' },
            },
            {
              root: 'host-agents',
              kind: 'file',
              selector: { prefix: 'gsd-' },
              marker: { contains: 'gsd-core' },
            },
            {
              root: 'host-commands',
              kind: 'file',
              selector: { names: ['gsd-run.md'] },
              marker: { contains: 'gsd-core' },
            },
          ],
        },
      },
    } as unknown as InstallContext['manifest'],
    opts: {
      apply: true,
      dryRun: false,
      system: false,
      nonInteractive: true,
      fullDiff: false,
      color: false,
    },
    level: 'L2',
    cwd: home,
    hostContext: createHostInstallContext(descriptor, {
      os: process.platform,
      userHome: home,
      nativeHome: descriptor.homeDir,
    }),
  }
}

afterEach(async () => {
  await Promise.all(homes.splice(0).map((home) => rm(home, { recursive: true, force: true })))
})

describe('declared ownership discovery', () => {
  it('discovers direct marked resources and writes the legacy-compatible skill receipt', async () => {
    const ctx = await fixture()
    const host = ctx.hostContext
    if (!host) throw new Error('missing host context')
    const validSkill = join(host.platform.skillsDir, 'gsd-plan-phase')
    const prefixOnly = join(host.platform.skillsDir, 'gsd-user-copy')
    const core = join(host.nativeHome, 'gsd-core')
    const agent = join(host.nativeHome, 'agents', 'gsd-planner.md')
    const command = join(host.platform.commandsDir, 'gsd-run.md')
    await mkdir(validSkill, { recursive: true })
    await mkdir(prefixOnly, { recursive: true })
    await mkdir(join(core, 'bin'), { recursive: true })
    await mkdir(join(host.nativeHome, 'agents'), { recursive: true })
    await mkdir(host.platform.commandsDir, { recursive: true })
    await writeFile(join(validSkill, 'SKILL.md'), 'name: gsd-plan-phase\n@gsd-core\n')
    await writeFile(join(prefixOnly, 'SKILL.md'), 'name: gsd-user-copy\n')
    await writeFile(join(core, 'bin', 'gsd-tools.cjs'), '/** GSD Tools */\n')
    await writeFile(agent, 'load ~/.claude/gsd-core/workflows/plan-phase.md\n')
    await writeFile(command, 'load ~/.claude/gsd-core/workflows/run.md\n')

    const discovered = await discoverDeclaredOwnership(ctx)
    expect(discovered.paths).toEqual([validSkill, core, agent, command].sort())
    expect(discovered.resources).toEqual(
      expect.arrayContaining([
        { path: validSkill, root: host.platform.skillsDir, kind: 'directory' },
        { path: core, root: host.nativeHome, kind: 'directory' },
        { path: agent, root: join(host.nativeHome, 'agents'), kind: 'file' },
        { path: command, root: host.platform.commandsDir, kind: 'file' },
      ]),
    )

    await writeDeclaredOwnershipReceipt(ctx, {
      roots: discovered.roots,
      paths: discovered.paths,
    })
    const receipt = await readSkillOwnershipReceipt(ctx)
    expect(receipt.createdPaths).toEqual(discovered.paths)
    expect(await readFile(agent, 'utf8')).toContain('gsd-core')
  })

  it('rejects kind mismatches, nested matches, symlinks, and non-regular markers', async () => {
    const ctx = await fixture()
    const host = ctx.hostContext
    if (!host) throw new Error('missing host context')
    const skills = host.platform.skillsDir
    const external = join(ctx.cwd, 'external')
    const nested = join(skills, 'wrapper', 'gsd-nested')
    const linked = join(skills, 'gsd-linked')
    const linkedMarker = join(skills, 'gsd-linked-marker')
    const wrongKind = join(skills, 'gsd-file')
    const wrongMarker = join(skills, 'gsd-wrong-marker')
    await mkdir(join(external, 'skill'), { recursive: true })
    await mkdir(nested, { recursive: true })
    await mkdir(linkedMarker, { recursive: true })
    await mkdir(wrongMarker, { recursive: true })
    await writeFile(join(external, 'skill', 'SKILL.md'), '@gsd-core\n')
    await writeFile(join(nested, 'SKILL.md'), '@gsd-core\n')
    await writeFile(wrongKind, '@gsd-core\n')
    await writeFile(join(wrongMarker, 'SKILL.md'), 'user-owned\n')
    await symlink(
      join(external, 'skill'),
      linked,
      process.platform === 'win32' ? 'junction' : 'dir',
    )
    await symlink(
      join(external, 'skill'),
      join(linkedMarker, 'SKILL.md'),
      process.platform === 'win32' ? 'junction' : 'dir',
    )

    const discovered = await discoverDeclaredOwnership(ctx)
    expect(discovered.paths).toEqual([])
    expect(discovered.resources).toEqual([])
  })

  it('returns active declared roots before any matching resource exists', async () => {
    const ctx = await fixture()
    const host = ctx.hostContext
    if (!host) throw new Error('missing host context')

    const discovered = await discoverDeclaredOwnership(ctx)
    expect(discovered.roots).toEqual(
      [
        host.platform.skillsDir,
        host.nativeHome,
        join(host.nativeHome, 'agents'),
        host.platform.commandsDir,
      ].sort(),
    )
    expect(discovered.paths).toEqual([])
    expect(discovered.resources).toEqual([])
  })

  it('snapshots selector candidates before marker validation', async () => {
    const ctx = await fixture()
    const host = ctx.hostContext
    if (!host) throw new Error('missing host context')
    const candidate = join(host.platform.skillsDir, 'gsd-personal')
    await mkdir(candidate, { recursive: true })
    await writeFile(join(candidate, 'SKILL.md'), 'name: gsd-personal\n', 'utf8')

    await expect(discoverDeclaredOwnership(ctx)).resolves.toMatchObject({ paths: [] })
    await expect(snapshotDeclaredOwnership(ctx)).resolves.toMatchObject({ paths: [candidate] })
  })

  it('keeps pre-existing wrong-kind and symlink candidates out of fresh ownership', async () => {
    const ctx = await fixture()
    const host = ctx.hostContext
    if (!host) throw new Error('missing host context')
    const skills = host.platform.skillsDir
    const wrongKind = join(skills, 'gsd-wrong-kind')
    const linked = join(skills, 'gsd-linked')
    const external = join(ctx.cwd, 'external-skill')
    await mkdir(skills, { recursive: true })
    await mkdir(external, { recursive: true })
    await writeFile(wrongKind, 'pre-existing file\n', 'utf8')
    await symlink(external, linked, process.platform === 'win32' ? 'junction' : 'dir')

    const before = await snapshotDeclaredOwnership(ctx)
    expect(before.paths).toEqual([linked, wrongKind].sort())

    await rm(wrongKind, { force: true })
    await rm(linked, { recursive: true, force: true })
    for (const candidate of [wrongKind, linked]) {
      await mkdir(candidate, { recursive: true })
      await writeFile(join(candidate, 'SKILL.md'), '@gsd-core\n', 'utf8')
    }

    const after = await discoverDeclaredOwnership(ctx)
    expect(after.paths).toEqual([linked, wrongKind].sort())
    expect(after.paths.filter((path) => !before.paths.includes(path))).toEqual([])
  })

  it('rejects Windows drive absolute marker paths on every platform', async () => {
    const ctx = await fixture()
    const ownership = (
      ctx.manifest.spec as unknown as {
        ownership: { resources: Array<{ marker: { path?: string } }> }
      }
    ).ownership
    const resource = ownership.resources[0]
    if (!resource) throw new Error('missing ownership resource')
    resource.marker.path = 'C:/x'

    await expect(snapshotDeclaredOwnership(ctx)).rejects.toThrow(/invalid ownership declaration/i)
  })

  it('does not receipt an invalid-to-valid GSD candidate from the preinstall snapshot', async () => {
    const ctx = await fixture()
    const host = ctx.hostContext
    if (!host) throw new Error('missing host context')
    const candidate = join(host.platform.skillsDir, 'gsd-personal')
    await mkdir(candidate, { recursive: true })
    await writeFile(join(candidate, 'SKILL.md'), 'name: gsd-personal\n', 'utf8')

    const before = await snapshotDeclaredOwnership(ctx)
    expect((await discoverDeclaredOwnership(ctx)).paths).toEqual([])
    await writeFile(join(candidate, 'SKILL.md'), 'name: gsd-personal\n@gsd-core\n', 'utf8')
    const after = await discoverDeclaredOwnership(ctx)
    expect(after.paths).toEqual([candidate])
    await expect(
      writeDeclaredOwnershipReceipt(ctx, {
        roots: after.roots,
        paths: after.paths.filter((path) => !before.paths.includes(path)),
      }),
    ).rejects.toThrow(/empty/i)
  })

  it('does not receipt a pre-existing same-named mattpocock skill', async () => {
    const ctx = await fixture()
    ctx.manifest = parse(
      readFileSync('manifests/skill-packs/mattpocock-skills.yaml', 'utf8'),
    ) as never
    const host = ctx.hostContext
    if (!host) throw new Error('missing host context')
    const candidate = join(host.platform.skillsDir, 'tdd')
    await mkdir(candidate, { recursive: true })
    await writeFile(join(candidate, 'SKILL.md'), 'name: user-tdd\n', 'utf8')

    const before = await snapshotDeclaredOwnership(ctx)
    expect((await discoverDeclaredOwnership(ctx)).paths).toEqual([])
    await writeFile(join(candidate, 'SKILL.md'), 'name: tdd\n', 'utf8')
    const after = await discoverDeclaredOwnership(ctx)
    expect(after.paths).toEqual([candidate])
    await expect(
      writeDeclaredOwnershipReceipt(ctx, {
        roots: after.roots,
        paths: after.paths.filter((path) => !before.paths.includes(path)),
      }),
    ).rejects.toThrow(/empty/i)
  })

  it('writes a fresh receipt through the real GSD manifest contract', async () => {
    const ctx = await fixture()
    ctx.manifest = parse(readFileSync('manifests/skill-packs/gsd.yaml', 'utf8')) as never
    const host = ctx.hostContext
    if (!host) throw new Error('missing host context')
    const skill = join(host.platform.skillsDir, 'gsd-plan-phase')
    const core = join(host.nativeHome, 'gsd-core')
    const agent = join(host.nativeHome, 'agents', 'gsd-planner.md')
    await mkdir(skill, { recursive: true })
    await mkdir(join(core, 'bin'), { recursive: true })
    await mkdir(join(host.nativeHome, 'agents'), { recursive: true })
    await writeFile(join(skill, 'SKILL.md'), '@gsd-core\n', 'utf8')
    await writeFile(join(core, 'bin', 'gsd-tools.cjs'), 'GSD Tools\n', 'utf8')
    await writeFile(agent, 'load gsd-core workflow\n', 'utf8')

    const discovered = await discoverDeclaredOwnership(ctx)
    await writeDeclaredOwnershipReceipt(ctx, discovered)
    await expect(readSkillOwnershipReceipt(ctx)).resolves.toMatchObject({
      createdPaths: expect.arrayContaining([skill, core, agent]),
    })
  })

  it('writes a fresh receipt through the real mattpocock manifest contract', async () => {
    const ctx = await fixture()
    ctx.manifest = parse(
      readFileSync('manifests/skill-packs/mattpocock-skills.yaml', 'utf8'),
    ) as never
    const host = ctx.hostContext
    if (!host) throw new Error('missing host context')
    const names = (ctx.manifest.spec.install as { installs_skills: string[] }).installs_skills
    for (const name of names) {
      const skill = join(host.platform.skillsDir, name)
      await mkdir(skill, { recursive: true })
      await writeFile(join(skill, 'SKILL.md'), `name: ${name}\n`, 'utf8')
    }

    const discovered = await discoverDeclaredOwnership(ctx)
    await writeDeclaredOwnershipReceipt(ctx, discovered)
    await expect(readSkillOwnershipReceipt(ctx)).resolves.toMatchObject({
      createdPaths: expect.arrayContaining(
        names.map((name) => join(host.platform.skillsDir, name)),
      ),
    })
  })

  it('refuses a receipt whose directory marker escapes the owned path', async () => {
    const ctx = await fixture()
    const host = ctx.hostContext
    if (!host) throw new Error('missing host context')
    const skill = join(host.platform.skillsDir, 'gsd-plan-phase')
    await mkdir(skill, { recursive: true })
    await writeFile(join(host.platform.skillsDir, 'outside.md'), '@gsd-core\n')
    const ownership = (
      ctx.manifest.spec as unknown as {
        ownership: { resources: Array<{ marker: { path?: string } }> }
      }
    ).ownership
    const resource = ownership.resources[0]
    if (!resource) throw new Error('missing ownership resource')
    resource.marker.path = '../outside.md'

    await expect(
      writeDeclaredOwnershipReceipt(ctx, { roots: [host.platform.skillsDir], paths: [skill] }),
    ).rejects.toThrow(/declared ownership marker/i)
  })
})
