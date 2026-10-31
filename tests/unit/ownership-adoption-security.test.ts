import { mkdir, readFile, rename, symlink, writeFile } from 'node:fs/promises'
import { basename, dirname, join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { runOwnershipAdoption } from '../../src/cli/lib/ownershipAdoption.js'
import {
  restoreOwnershipReceipts,
  snapshotOwnershipReceipt,
} from '../../src/cli/lib/ownershipAdoptionReceipt.js'
import { writeDeclaredOwnershipReceipt } from '../../src/installers/lib/ownershipContract.js'
import {
  readSkillOwnershipReceipt,
  skillOwnershipReceiptPath,
} from '../../src/installers/lib/skillOwnershipReceipt.js'
import type { InstallContext } from '../../src/installers/lib/types.js'
import {
  adoptionFixture,
  cleanupAdoptionFixtures,
  declaredOwnership,
  ownershipManifest,
  repairResult,
} from './fixtures/ownershipAdoption.js'

afterEach(async () => {
  await cleanupAdoptionFixtures()
})

describe('ownership adoption security boundaries', () => {
  it('restores fake agent receipt absence before the production writer', async () => {
    const { context, request } = await adoptionFixture()
    const component = ownershipManifest('gsd')
    const ctx = { manifest: component, hostContext: context }
    const path = skillOwnershipReceiptPath(ctx)
    const discovered = declaredOwnership(context.platform.skillsDir, [['gsd-plan', 'directory']])
    await mkdir(discovered.paths[0] as string, { recursive: true })
    await writeFile(join(discovered.paths[0] as string, 'SKILL.md'), 'gsd marker', 'utf8')
    const writeReceipt = vi.fn(async (installCtx, adopted) => {
      await expect(readFile(path, 'utf8')).rejects.toMatchObject({ code: 'ENOENT' })
      await writeDeclaredOwnershipReceipt(installCtx, adopted)
    })
    const result = await runOwnershipAdoption(
      {
        context,
        request,
        runRepair: async () => {
          await mkdir(join(path, '..'), { recursive: true })
          await writeFile(path, 'fake agent receipt', 'utf8')
          return repairResult('completed', true)
        },
      },
      {
        loadManifests: async () => [component],
        discover: async () => discovered,
        writeReceipt,
        withLock: async (_context, work) => work(),
      },
    )
    expect(result.status).toBe('completed')
    await expect(readSkillOwnershipReceipt(ctx)).resolves.toMatchObject({
      component: 'gsd',
      createdPaths: discovered.paths,
    })
  })

  it('snapshots and restores every authorized component receipt', async () => {
    const ids = ['gsd', 'mattpocock-skills']
    const { context, request } = await adoptionFixture('claude', ids)
    const manifests = ids.map(ownershipManifest)
    const paths = manifests.map((component) =>
      skillOwnershipReceiptPath({ manifest: component, hostContext: context }),
    )
    await Promise.all(
      paths.map(async (path, index) => {
        await mkdir(join(path, '..'), { recursive: true })
        await writeFile(path, `original-${index}`, 'utf8')
      }),
    )
    const result = await runOwnershipAdoption(
      {
        context,
        request,
        runRepair: async () => {
          await Promise.all(paths.map((path) => writeFile(path, 'tampered', 'utf8')))
          return { ...repairResult('completed', true, ids), status: 'failed', verified: false }
        },
      },
      {
        loadManifests: async () => manifests,
        discover: async (ctx) =>
          declaredOwnership(context.platform.skillsDir, [
            [`${ctx.manifest.metadata.name}-owned`, 'directory'],
          ]),
        withLock: async (_context, work) => work(),
      },
    )
    expect(result.status).toBe('failed')
    await expect(Promise.all(paths.map((path) => readFile(path, 'utf8')))).resolves.toEqual([
      'original-0',
      'original-1',
    ])
  })

  it('uses the effective Codex platform skills root instead of nativeHome', async () => {
    const { context, request } = await adoptionFixture('codex')
    const component = ownershipManifest('gsd')
    const skill = join(context.platform.skillsDir, 'gsd-plan')
    await mkdir(skill, { recursive: true })
    await writeFile(join(skill, 'SKILL.md'), 'gsd marker', 'utf8')
    const result = await runOwnershipAdoption(
      {
        context,
        request,
        runRepair: async () => repairResult('completed', true, ['gsd'], 'codex'),
      },
      {
        loadManifests: async () => [component],
        withLock: async (_context, work) => work(),
      },
    )
    const ctx = { manifest: component, hostContext: context } as Pick<
      InstallContext,
      'manifest' | 'hostContext'
    >
    expect(result.status).toBe('completed')
    expect(context.platform.skillsDir).toBe(join(context.userHome, '.agents', 'skills'))
    expect(context.platform.skillsDir.startsWith(context.nativeHome)).toBe(false)
    await expect(readSkillOwnershipReceipt(ctx)).resolves.toMatchObject({ createdPaths: [skill] })
  })

  it.each([
    'missing',
    'duplicate',
    'unsupported',
  ] as const)('%s effective manifest or plan fails before the agent', async (mode) => {
    const { context, request } = await adoptionFixture()
    const component = ownershipManifest('gsd')
    const runRepair = vi.fn(async () => repairResult('completed', true))
    const manifests =
      mode === 'missing' ? [] : mode === 'duplicate' ? [component, component] : [component]
    const result = await runOwnershipAdoption(
      { context, request, runRepair },
      {
        loadManifests: async () => manifests,
        ...(mode === 'unsupported'
          ? { resolvePlan: () => ({ status: 'unsupported', reason: 'harness-mismatch' }) as never }
          : {}),
        withLock: async (_context, work) => work(),
      },
    )
    expect(result).toMatchObject({ status: 'failed', verified: false })
    expect(runRepair).not.toHaveBeenCalled()
  })

  it('writer failure rolls back every receipt and downgrades the repair', async () => {
    const { context, request } = await adoptionFixture()
    const component = ownershipManifest('gsd')
    const path = skillOwnershipReceiptPath({ manifest: component, hostContext: context })
    const discovered = declaredOwnership(context.platform.skillsDir, [['gsd-plan', 'directory']])
    const result = await runOwnershipAdoption(
      { context, request, runRepair: async () => repairResult('completed', true) },
      {
        loadManifests: async () => [component],
        discover: async () => discovered,
        writeReceipt: async () => {
          await mkdir(join(path, '..'), { recursive: true })
          await writeFile(path, 'partial receipt', 'utf8')
          throw new Error('writer failed')
        },
        withLock: async (_context, work) => work(),
      },
    )
    expect(result).toMatchObject({ status: 'failed', verified: false })
    await expect(readFile(path, 'utf8')).rejects.toMatchObject({ code: 'ENOENT' })
  })

  it('reports rollback failure distinctly after a writer failure', async () => {
    const { context, request } = await adoptionFixture()
    const component = ownershipManifest('gsd')
    const discovered = declaredOwnership(context.platform.skillsDir, [['gsd-plan', 'directory']])
    const restoreReceipts = vi
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('rollback failed'))

    const result = await runOwnershipAdoption(
      { context, request, runRepair: async () => repairResult('completed', true) },
      {
        loadManifests: async () => [component],
        discover: async () => discovered,
        writeReceipt: async () => {
          throw new Error('writer failed')
        },
        restoreReceipts,
        withLock: async (_context, work) => work(),
      },
    )

    expect(result).toMatchObject({
      status: 'failed',
      verified: false,
      reasonCode: 'ownership-adoption-rollback-failed',
    })
    expect(restoreReceipts).toHaveBeenCalledTimes(2)
  })

  it(`rejects a ${process.platform === 'win32' ? 'junction' : 'symlink'} receipt parent during adoption snapshot`, async () => {
    const { context } = await adoptionFixture()
    const component = ownershipManifest('gsd')
    const path = skillOwnershipReceiptPath({ manifest: component, hostContext: context })
    const parent = dirname(path)
    const external = join(context.platform.stateRoot, 'external-receipts')
    const externalReceipt = join(external, basename(path))
    await mkdir(external, { recursive: true })
    await writeFile(externalReceipt, 'external sentinel', 'utf8')
    await symlink(external, parent, process.platform === 'win32' ? 'junction' : 'dir')

    await expect(snapshotOwnershipReceipt(path)).rejects.toThrow(/receipt parent/i)
    await expect(readFile(externalReceipt, 'utf8')).resolves.toBe('external sentinel')
  })

  it('fails closed when the captured receipt parent identity is replaced before restore', async () => {
    const { context } = await adoptionFixture()
    const component = ownershipManifest('gsd')
    const path = skillOwnershipReceiptPath({ manifest: component, hostContext: context })
    const parent = dirname(path)
    const displaced = `${parent}.original`
    const external = join(context.platform.stateRoot, 'external-receipts')
    const externalReceipt = join(external, basename(path))
    await mkdir(parent, { recursive: true })
    await writeFile(path, 'original receipt', 'utf8')
    const snapshot = await snapshotOwnershipReceipt(path)
    await rename(parent, displaced)
    await mkdir(external, { recursive: true })
    await writeFile(externalReceipt, 'external sentinel', 'utf8')
    await symlink(external, parent, process.platform === 'win32' ? 'junction' : 'dir')

    await expect(restoreOwnershipReceipts([snapshot])).rejects.toThrow(/receipt parent/i)
    await expect(readFile(externalReceipt, 'utf8')).resolves.toBe('external sentinel')
    await expect(readFile(join(displaced, basename(path)), 'utf8')).resolves.toBe(
      'original receipt',
    )
  })
})
