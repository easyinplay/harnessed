import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { findOwnershipRepairCandidates } from '../../src/cli/lib/ownershipAdoptionCandidate.js'
import { buildUpdateResult, createUpdateComponent } from '../../src/cli/lib/updateResult.js'
import { writeDeclaredOwnershipReceipt } from '../../src/installers/lib/ownershipContract.js'
import { skillOwnershipReceiptPath } from '../../src/installers/lib/skillOwnershipReceipt.js'
import {
  adoptionFixture,
  cleanupAdoptionFixtures,
  nonOwnershipManifest,
  ownershipManifest,
} from './fixtures/ownershipAdoption.js'

afterEach(async () => {
  await cleanupAdoptionFixtures()
})

describe('ownership receipt repair candidates', () => {
  it.each([
    ['missing', async () => undefined],
    [
      'legacy',
      async (path: string) => {
        await mkdir(dirname(path), { recursive: true })
        await writeFile(path, JSON.stringify({ version: 2 }), 'utf8')
      },
    ],
    [
      'corrupt',
      async (path: string) => {
        await mkdir(dirname(path), { recursive: true })
        await writeFile(path, '{', 'utf8')
      },
    ],
  ])('selects a current ownership component with a %s receipt', async (_case, arrange) => {
    const { context } = await adoptionFixture()
    const component = ownershipManifest('gsd')
    const path = skillOwnershipReceiptPath({ manifest: component, hostContext: context })
    await arrange(path)
    const result = buildUpdateResult({
      mode: 'apply',
      host: 'claude',
      runtime: 'node',
      components: [createUpdateComponent({ id: 'gsd', status: 'current', verified: true })],
    })

    await expect(
      findOwnershipRepairCandidates(result, context, {
        loadManifests: async () => [component],
      }),
    ).resolves.toEqual([
      { id: 'gsd', status: 'current', reasonCode: 'ownership-receipt-repair-required' },
    ])
  })

  it('excludes a current ownership component with a valid receipt', async () => {
    const { context } = await adoptionFixture()
    const component = ownershipManifest('gsd')
    const skill = join(context.platform.skillsDir, 'gsd-plan')
    await mkdir(skill, { recursive: true })
    await writeFile(join(skill, 'SKILL.md'), 'gsd marker', 'utf8')
    await writeDeclaredOwnershipReceipt(
      {
        manifest: component,
        hostContext: context,
        level: 'L4',
        cwd: context.userHome,
        opts: {
          apply: false,
          dryRun: false,
          system: false,
          nonInteractive: true,
          fullDiff: false,
          color: false,
        },
      },
      { roots: [context.platform.skillsDir], paths: [skill] },
    )
    const result = buildUpdateResult({
      mode: 'apply',
      host: 'claude',
      runtime: 'node',
      components: [createUpdateComponent({ id: 'gsd', status: 'current', verified: true })],
    })

    await expect(
      findOwnershipRepairCandidates(result, context, {
        loadManifests: async () => [component],
      }),
    ).resolves.toEqual([])
  })

  it('excludes current components without declared ownership', async () => {
    const { context } = await adoptionFixture('claude', ['gstack'])
    const component = nonOwnershipManifest('gstack')
    const result = buildUpdateResult({
      mode: 'apply',
      host: 'claude',
      runtime: 'node',
      components: [createUpdateComponent({ id: 'gstack', status: 'current', verified: true })],
    })

    await expect(
      findOwnershipRepairCandidates(result, context, {
        loadManifests: async () => [component],
      }),
    ).resolves.toEqual([])
  })
})
