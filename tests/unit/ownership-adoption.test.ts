import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { runOwnershipAdoption } from '../../src/cli/lib/ownershipAdoption.js'
import {
  adoptionDependencies,
  adoptionFixture,
  cleanupAdoptionFixtures,
  declaredOwnership,
  nonOwnershipManifest,
  ownershipManifest,
  repairResult,
} from './fixtures/ownershipAdoption.js'

afterEach(async () => {
  await cleanupAdoptionFixtures()
})

describe('confirmed repair ownership adoption', () => {
  it.each([
    ['unauthorized', { confirmed: false, mode: 'none' as const, components: [], grantedAt: null }],
    [
      'scope mismatch',
      {
        confirmed: true,
        mode: 'explicit-yes' as const,
        components: ['gsd', 'other'],
        grantedAt: new Date().toISOString(),
      },
    ],
  ])('%s never plans, spawns, or adopts', async (_name, authorization) => {
    const { context, request } = await adoptionFixture()
    request.authorization = authorization
    const runRepair = vi.fn(async () => repairResult('completed', true))
    const loadManifests = vi.fn(async () => [ownershipManifest('gsd')])
    const writeReceipt = vi.fn()
    const result = await runOwnershipAdoption(
      { context, request, runRepair },
      { loadManifests, writeReceipt },
    )
    expect(result.status).toBe('not-authorized')
    expect(runRepair).not.toHaveBeenCalled()
    expect(loadManifests).not.toHaveBeenCalled()
    expect(writeReceipt).not.toHaveBeenCalled()
  })

  it.each([
    ['agent failure', repairResult('failed')],
    ['verification failure', repairResult('verification-failed')],
  ])('%s restores receipts without adoption', async (_name, outcome) => {
    const { context, request } = await adoptionFixture()
    const root = context.platform.skillsDir
    const discover = vi.fn(async () => declaredOwnership(root, [['gsd-plan', 'directory']]))
    const writeReceipt = vi.fn()
    const result = await runOwnershipAdoption(
      { context, request, runRepair: async () => outcome },
      adoptionDependencies([ownershipManifest('gsd')], discover, writeReceipt),
    )
    expect(result).toBe(outcome)
    expect(discover).toHaveBeenCalledOnce()
    expect(writeReceipt).not.toHaveBeenCalled()
  })

  it('verifies before adopting only the exact pre/post path-root-kind intersection', async () => {
    const { context, request } = await adoptionFixture()
    const root = context.platform.skillsDir
    const before = declaredOwnership(root, [['gsd-plan', 'directory']])
    const after = declaredOwnership(root, [
      ['gsd-plan', 'directory'],
      ['gsd-agent-created', 'directory'],
    ])
    const events: string[] = []
    const discover = vi
      .fn()
      .mockImplementationOnce(async () => {
        events.push('snapshot')
        return before
      })
      .mockImplementationOnce(async () => {
        events.push('post')
        return after
      })
    const writeReceipt = vi.fn(async (_ctx, adopted) => {
      events.push('writer')
      expect(adopted).toEqual({ roots: [root], paths: [join(root, 'gsd-plan')] })
    })
    const result = await runOwnershipAdoption(
      {
        context,
        request,
        runRepair: async () => {
          events.push('agent')
          events.push('verify')
          return repairResult('completed', true)
        },
      },
      adoptionDependencies([ownershipManifest('gsd')], discover, writeReceipt),
    )
    expect(result).toMatchObject({ status: 'completed', verified: true })
    expect(events).toEqual(['snapshot', 'agent', 'verify', 'post', 'writer'])
  })

  it.each([
    ['kind change', 'file' as const, 'directory' as const],
    ['root change', 'directory' as const, 'directory' as const],
    ['marker or symlink exclusion', 'directory' as const, null],
  ])('%s fails closed with no empty receipt', async (name, beforeKind, afterKind) => {
    const { context, request, home } = await adoptionFixture()
    const beforeRoot = context.platform.skillsDir
    const afterRoot = name === 'root change' ? join(home, 'other-skills') : beforeRoot
    const before = beforeKind
      ? declaredOwnership(beforeRoot, [['gsd-plan', beforeKind]])
      : declaredOwnership(beforeRoot, [])
    const after = afterKind
      ? declaredOwnership(afterRoot, [['gsd-plan', afterKind]])
      : declaredOwnership(beforeRoot, [])
    const discover = vi.fn().mockResolvedValueOnce(before).mockResolvedValueOnce(after)
    const writeReceipt = vi.fn()
    const result = await runOwnershipAdoption(
      { context, request, runRepair: async () => repairResult('completed', true) },
      adoptionDependencies([ownershipManifest('gsd')], discover, writeReceipt),
    )
    expect(result).toMatchObject({ status: 'failed', verified: false })
    expect(writeReceipt).not.toHaveBeenCalled()
  })

  it.each([
    { authorized: false },
    { components: ['other'] },
    { execution: 'codex' as const },
  ])('rejects a completed repair identity mismatch: %j', async (override) => {
    const { context, request } = await adoptionFixture()
    const root = context.platform.skillsDir
    const discovered = declaredOwnership(root, [['gsd-plan', 'directory']])
    const writeReceipt = vi.fn()
    const result = await runOwnershipAdoption(
      {
        context,
        request,
        runRepair: async () => ({ ...repairResult('completed', true), ...override }),
      },
      adoptionDependencies([ownershipManifest('gsd')], async () => discovered, writeReceipt),
    )
    expect(result).toMatchObject({ status: 'failed', verified: false })
    expect(writeReceipt).not.toHaveBeenCalled()
  })

  it('adopts only authorized components even when another manifest is available', async () => {
    const { context, request } = await adoptionFixture('claude', ['gsd'])
    const root = context.platform.skillsDir
    const seen: string[] = []
    const discover = vi.fn(async (ctx) => {
      seen.push(ctx.manifest.metadata.name)
      return declaredOwnership(root, [['gsd-plan', 'directory']])
    })
    const writeReceipt = vi.fn(async (ctx) => {
      seen.push(`write:${ctx.manifest.metadata.name}`)
    })
    await runOwnershipAdoption(
      { context, request, runRepair: async () => repairResult('completed', true) },
      adoptionDependencies(
        [ownershipManifest('gsd'), ownershipManifest('mattpocock-skills')],
        discover,
        writeReceipt,
      ),
    )
    expect(seen).toEqual(['gsd', 'gsd', 'write:gsd'])
  })

  it('runs a verified non-ownership repair without receipt work', async () => {
    const { context, request } = await adoptionFixture('claude', ['gstack'])
    const completed = repairResult('completed', true, ['gstack'])
    const runRepair = vi.fn(async () => completed)
    const discover = vi.fn()
    const writeReceipt = vi.fn()
    const withLock = vi.fn()
    const result = await runOwnershipAdoption(
      { context, request, runRepair },
      {
        loadManifests: async () => [nonOwnershipManifest('gstack')],
        discover,
        writeReceipt,
        withLock,
      },
    )
    expect(result).toBe(completed)
    expect(runRepair).toHaveBeenCalledOnce()
    expect(discover).not.toHaveBeenCalled()
    expect(writeReceipt).not.toHaveBeenCalled()
    expect(withLock).not.toHaveBeenCalled()
  })

  it('adopts only ownership components while binding repair to the full mixed scope', async () => {
    const ids = ['gsd', 'gstack']
    const { context, request } = await adoptionFixture('claude', ids)
    const root = context.platform.skillsDir
    const discovered = declaredOwnership(root, [['gsd-plan', 'directory']])
    const seen: string[] = []
    const result = await runOwnershipAdoption(
      { context, request, runRepair: async () => repairResult('completed', true, ids) },
      adoptionDependencies(
        [ownershipManifest('gsd'), nonOwnershipManifest('gstack')],
        async (ctx) => {
          seen.push(ctx.manifest.metadata.name)
          return discovered
        },
        async (ctx) => {
          seen.push(`write:${ctx.manifest.metadata.name}`)
        },
      ),
    )
    expect(result).toMatchObject({ status: 'completed', components: ids, verified: true })
    expect(seen).toEqual(['gsd', 'gsd', 'write:gsd'])
  })
})
