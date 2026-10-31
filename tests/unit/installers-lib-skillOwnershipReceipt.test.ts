import { createHash } from 'node:crypto'
import { mkdir, mkdtemp, readdir, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  authorizedSkillNames,
  declaredSkillPaths,
  isSkillOwnershipManaged,
  readSkillOwnershipReceipt,
  removeOwnedSkillPath,
  removeSkillOwnershipReceipt,
  skillOwnershipReceiptPath,
  verifyOwnedSkillPath,
  writeSkillOwnershipReceipt,
} from '../../src/installers/lib/skillOwnershipReceipt.js'
import type { InstallContext } from '../../src/installers/lib/types.js'
import { createHostInstallContext } from '../../src/platform/hostInstallContext.js'
import { claudeDescriptor } from '../../src/platform/platform.js'

const roots: string[] = []

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`
  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => `${JSON.stringify(key)}:${canonicalJson(child)}`)
      .join(',')}}`
  }
  return JSON.stringify(value)
}

async function fixture(): Promise<{ ctx: InstallContext; root: string; stateRoot: string }> {
  const home = await mkdtemp(join(tmpdir(), 'harnessed-skill-receipt-'))
  roots.push(home)
  const descriptor = claudeDescriptor(home)
  const context = createHostInstallContext(descriptor, {
    os: process.platform,
    userHome: home,
    nativeHome: descriptor.homeDir,
  })
  return {
    ctx: {
      manifest: {
        metadata: { name: 'fixture-pack' },
        spec: {
          install: {
            method: 'npm-cli',
            cmd: 'npm install -g fixture-pack',
            installs_skills: ['new-skill', 'other-skill'],
          },
        },
      } as InstallContext['manifest'],
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
      hostContext: context,
    },
    root: descriptor.skillsDir,
    stateRoot: descriptor.stateRoot,
  }
}

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })))
})

describe('skill ownership receipt', () => {
  it('authorizes only non-empty installs_skills and an explicit npx --skill selection', async () => {
    const { ctx } = await fixture()
    const install = ctx.manifest.spec.install as {
      method: string
      cmd: string
      installs_skills?: string[]
    }

    ctx.manifest.metadata.name = 'GSD'
    install.installs_skills = []
    expect(authorizedSkillNames(ctx)).toEqual([])
    expect(isSkillOwnershipManaged(ctx.manifest)).toBe(false)

    ctx.manifest.metadata.name = 'mattpocock'
    install.installs_skills = ['', 'new-skill']
    expect(authorizedSkillNames(ctx)).toEqual(['new-skill'])
    expect(isSkillOwnershipManaged(ctx.manifest)).toBe(true)

    install.method = 'npx-skill-installer'
    install.cmd = 'npx skills add fixture --skill selected-skill --copy'
    install.installs_skills = []
    expect(authorizedSkillNames(ctx)).toEqual(['selected-skill'])
    expect(isSkillOwnershipManaged(ctx.manifest)).toBe(true)
  })

  it('persists absolute created paths bound to component, host, and native root', async () => {
    const { ctx, root } = await fixture()
    const created = join(root, 'new-skill')
    await mkdir(created, { recursive: true })
    await writeFile(join(created, 'SKILL.md'), '# fixture\n', 'utf8')

    await writeSkillOwnershipReceipt(ctx, [root], [created])

    await expect(readSkillOwnershipReceipt(ctx)).resolves.toMatchObject({
      version: 3,
      component: 'fixture-pack',
      hostId: 'claude',
      nativeRoot: ctx.hostContext?.nativeHome,
      skillRoots: [root],
      createdPaths: [created],
    })
    const receipt = JSON.parse(await readFile(skillOwnershipReceiptPath(ctx), 'utf8'))
    const fingerprint = createHash('sha256')
      .update(
        canonicalJson({
          metadata: ctx.manifest.metadata,
          install: ctx.manifest.spec.install,
        }),
      )
      .digest('hex')
    expect(receipt.manifestSha256).toBe(fingerprint)
    expect(await readdir(dirname(skillOwnershipReceiptPath(ctx)))).toEqual(['fixture-pack.json'])
  })

  it('rejects an arbitrary direct child when ownership is not declared', async () => {
    const { ctx, root } = await fixture()
    const created = join(root, 'undeclared-skill')
    await mkdir(created, { recursive: true })
    await writeFile(join(created, 'SKILL.md'), '# fixture\n', 'utf8')

    await expect(writeSkillOwnershipReceipt(ctx, [root], [created])).rejects.toThrow(
      /declared ownership marker/i,
    )
  })

  it('replaces stale paths instead of merging an older receipt', async () => {
    const { ctx, root } = await fixture()
    const stale = join(root, 'new-skill')
    const current = join(root, 'other-skill')
    for (const path of [stale, current]) {
      await mkdir(path, { recursive: true })
      await writeFile(join(path, 'SKILL.md'), `# ${path}\n`, 'utf8')
    }

    await writeSkillOwnershipReceipt(ctx, [root], [stale])
    await writeSkillOwnershipReceipt(ctx, [root], [current])

    await expect(readSkillOwnershipReceipt(ctx)).resolves.toMatchObject({
      createdPaths: [current],
      contentSha256: { [current]: expect.stringMatching(/^[a-f0-9]{64}$/) },
    })
    expect((await readSkillOwnershipReceipt(ctx)).contentSha256).not.toHaveProperty(stale)
    expect(await readdir(dirname(skillOwnershipReceiptPath(ctx)))).toEqual(['fixture-pack.json'])
  })

  it('fails closed for missing, corrupt, legacy, and binding-mismatched receipts', async () => {
    const { ctx, stateRoot } = await fixture()
    const hostContext = ctx.hostContext
    if (!hostContext) throw new Error('fixture host context missing')
    await expect(readSkillOwnershipReceipt(ctx)).rejects.toThrow(/repair or reinstall/i)

    const path = skillOwnershipReceiptPath(ctx)
    await mkdir(join(stateRoot, 'skill-ownership'), { recursive: true })
    await writeFile(path, '{bad json', 'utf8')
    await expect(readSkillOwnershipReceipt(ctx)).rejects.toThrow(/repair or reinstall/i)

    await writeFile(path, JSON.stringify({ version: 0 }), 'utf8')
    await expect(readSkillOwnershipReceipt(ctx)).rejects.toThrow(/legacy.*repair or reinstall/i)

    await expect(
      writeSkillOwnershipReceipt(ctx, [hostContext.platform.skillsDir], []),
    ).rejects.toThrow(/empty/i)
    await writeFile(
      path,
      JSON.stringify({
        version: 3,
        component: 'fixture-pack',
        hostId: hostContext.hostId,
        nativeRoot: hostContext.nativeHome,
        manifestSha256: '0'.repeat(64),
        skillRoots: [hostContext.platform.skillsDir],
        createdPaths: [],
        contentSha256: {},
        pathKinds: {},
      }),
      'utf8',
    )
    await expect(readSkillOwnershipReceipt(ctx)).rejects.toThrow(/empty/i)
    const owned = join(hostContext.platform.skillsDir, 'new-skill')
    await mkdir(owned, { recursive: true })
    await writeFile(join(owned, 'SKILL.md'), 'owned\n', 'utf8')
    await writeSkillOwnershipReceipt(ctx, [hostContext.platform.skillsDir], [owned])
    const receipt = JSON.parse(await readFile(path, 'utf8'))
    receipt.nativeRoot = join(hostContext.userHome, '.other')
    await writeFile(path, JSON.stringify(receipt), 'utf8')
    await expect(readSkillOwnershipReceipt(ctx)).rejects.toThrow(/binding.*repair or reinstall/i)
  })

  it('refuses to persist paths outside the captured skill roots', async () => {
    const { ctx, root } = await fixture()
    const hostContext = ctx.hostContext
    if (!hostContext) throw new Error('fixture host context missing')
    await expect(
      writeSkillOwnershipReceipt(ctx, [root], [join(hostContext.userHome, 'outside')]),
    ).rejects.toThrow(/allowed skill root/i)
  })

  it('rejects receipt roots not captured by the active host', async () => {
    const { ctx, root } = await fixture()
    const hostContext = ctx.hostContext
    if (!hostContext) throw new Error('fixture host context missing')
    ;(ctx.manifest.spec.install as { installs_skills: string[] }).installs_skills.push(
      'owned-skill',
    )
    const created = join(root, 'owned-skill')
    await mkdir(created, { recursive: true })
    await writeFile(join(created, 'SKILL.md'), '# fixture\n', 'utf8')
    await writeSkillOwnershipReceipt(ctx, [root], [created])
    const path = skillOwnershipReceiptPath(ctx)
    const receipt = JSON.parse(await readFile(path, 'utf8'))
    receipt.skillRoots.push(join(hostContext.userHome, 'external-skills'))
    await writeFile(path, JSON.stringify(receipt), 'utf8')

    await expect(readSkillOwnershipReceipt(ctx)).rejects.toThrow(/unknown or inactive root/i)
  })

  it('rejects created paths authorized only by an externally injected receipt root', async () => {
    const { ctx, root } = await fixture()
    const hostContext = ctx.hostContext
    if (!hostContext) throw new Error('fixture host context missing')
    const created = join(root, 'new-skill')
    await mkdir(created, { recursive: true })
    await writeFile(join(created, 'SKILL.md'), '# fixture\n', 'utf8')
    await writeSkillOwnershipReceipt(ctx, [root], [created])
    const path = skillOwnershipReceiptPath(ctx)
    const receipt = JSON.parse(await readFile(path, 'utf8'))
    const injectedRoot = join(hostContext.userHome, 'external-skills')
    const forgedPath = join(injectedRoot, 'new-skill')
    receipt.skillRoots.push(injectedRoot)
    receipt.createdPaths = [forgedPath]
    receipt.contentSha256 = { [forgedPath]: '0'.repeat(64) }
    await writeFile(path, JSON.stringify(receipt), 'utf8')

    await expect(readSkillOwnershipReceipt(ctx)).rejects.toThrow(/repair or reinstall/i)
  })

  it('records only declared skill paths and ignores concurrent undeclared directories', async () => {
    const { ctx, root } = await fixture()
    const declared = join(root, 'new-skill')
    const concurrent = join(root, 'concurrent-skill')
    await mkdir(declared, { recursive: true })
    await mkdir(concurrent, { recursive: true })
    await writeFile(join(declared, 'SKILL.md'), '# declared\n', 'utf8')
    await writeFile(join(concurrent, 'SKILL.md'), '# concurrent\n', 'utf8')

    await expect(declaredSkillPaths(ctx, [root])).resolves.toEqual([declared])
  })

  it('binds the fingerprint to the complete install declaration', async () => {
    const { ctx, root } = await fixture()
    const created = join(root, 'new-skill')
    await mkdir(created, { recursive: true })
    await writeFile(join(created, 'SKILL.md'), '# fixture\n', 'utf8')
    await writeSkillOwnershipReceipt(ctx, [root], [created])
    ;(ctx.manifest.spec.install as { idempotent_check?: string }).idempotent_check = 'which changed'

    await expect(readSkillOwnershipReceipt(ctx)).rejects.toThrow(/manifest identity changed/i)
  })

  it('verifies the created path hash and removes the receipt', async () => {
    const { ctx, root } = await fixture()
    const created = join(root, 'new-skill')
    await mkdir(created, { recursive: true })
    await writeFile(join(created, 'SKILL.md'), '# fixture\n', 'utf8')
    await writeSkillOwnershipReceipt(ctx, [root], [created])
    const receipt = await readSkillOwnershipReceipt(ctx)
    await expect(verifyOwnedSkillPath(receipt, created)).resolves.toBeUndefined()
    await writeFile(join(created, 'SKILL.md'), '# changed\n', 'utf8')
    await expect(verifyOwnedSkillPath(receipt, created)).rejects.toThrow(/content changed/i)

    await removeSkillOwnershipReceipt(ctx)
    await expect(readSkillOwnershipReceipt(ctx)).rejects.toThrow(/is missing/i)
  })

  it('records and removes an owned file with its receipt digest', async () => {
    const { ctx, root } = await fixture()
    const created = join(root, 'owned-marker.txt')
    ctx.manifest.spec.ownership = {
      resources: [
        {
          root: 'platform-skills',
          kind: 'file',
          selector: { names: ['owned-marker.txt'] },
          marker: { contains: 'owned' },
        },
      ],
    } as never
    await mkdir(root, { recursive: true })
    await writeFile(created, 'owned\n', 'utf8')
    await writeSkillOwnershipReceipt(ctx, [root], [created])

    const receipt = await readSkillOwnershipReceipt(ctx)
    expect(receipt.pathKinds[created]).toBe('file')
    await removeOwnedSkillPath(receipt, created)
    await expect(readFile(created, 'utf8')).rejects.toMatchObject({ code: 'ENOENT' })
  })

  it('restores an owned file when its declared marker fails after quarantine', async () => {
    const { ctx, root } = await fixture()
    const created = join(root, 'owned-marker.txt')
    ctx.manifest.spec.ownership = {
      resources: [
        {
          root: 'platform-skills',
          kind: 'file',
          selector: { names: ['owned-marker.txt'] },
          marker: { contains: 'owned' },
        },
      ],
    } as never
    await mkdir(root, { recursive: true })
    await writeFile(created, 'owned\n', 'utf8')
    await writeSkillOwnershipReceipt(ctx, [root], [created])
    const receipt = await readSkillOwnershipReceipt(ctx)
    const ownership = ctx.manifest.spec.ownership as unknown as {
      resources: Array<{ marker: { contains: string } }>
    }
    const resource = ownership.resources[0]
    if (!resource) throw new Error('missing ownership resource')
    resource.marker.contains = 'different marker'

    await expect(removeOwnedSkillPath(receipt, created, ctx)).rejects.toThrow(
      /declared ownership marker/i,
    )
    await expect(readFile(created, 'utf8')).resolves.toBe('owned\n')
  })

  it('rejects symlinked skill targets', async () => {
    const { ctx, root } = await fixture()
    const target = join(root, 'target')
    const linked = join(root, 'new-skill')
    await mkdir(target, { recursive: true })
    await writeFile(join(target, 'SKILL.md'), '# target\n', 'utf8')
    await symlink(target, linked, 'junction')

    await expect(writeSkillOwnershipReceipt(ctx, [root], [linked])).rejects.toThrow(
      /symbolic link|real directory/i,
    )
  })

  it(`rejects a ${process.platform === 'win32' ? 'junction' : 'symlink'} receipt parent without touching its target`, async () => {
    const { ctx, root, stateRoot } = await fixture()
    const created = join(root, 'new-skill')
    const parent = join(stateRoot, 'skill-ownership')
    const external = join(stateRoot, 'external-receipts')
    const externalReceipt = join(external, 'fixture-pack.json')
    await mkdir(created, { recursive: true })
    await writeFile(join(created, 'SKILL.md'), '# fixture\n', 'utf8')
    await mkdir(external, { recursive: true })
    await writeFile(externalReceipt, 'external sentinel', 'utf8')
    await symlink(external, parent, process.platform === 'win32' ? 'junction' : 'dir')

    await expect(writeSkillOwnershipReceipt(ctx, [root], [created])).rejects.toThrow(
      /receipt parent/i,
    )
    await expect(readSkillOwnershipReceipt(ctx)).rejects.toThrow(/receipt parent/i)
    await expect(removeSkillOwnershipReceipt(ctx)).rejects.toThrow(/receipt parent/i)
    await expect(readFile(externalReceipt, 'utf8')).resolves.toBe('external sentinel')
    await expect(readdir(external)).resolves.toEqual(['fixture-pack.json'])
  })
})
