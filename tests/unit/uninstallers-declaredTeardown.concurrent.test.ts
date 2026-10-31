import { access, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'

const readReceiptMock = vi.hoisted(() => vi.fn())
const removeOwnedSkillPathMock = vi.hoisted(() => vi.fn())
const removeReceiptMock = vi.hoisted(() => vi.fn())

vi.mock('../../src/installers/lib/skillOwnershipReceipt.js', () => ({
  isSkillOwnershipManaged: () => true,
  readSkillOwnershipReceipt: (...args: unknown[]) => readReceiptMock(...args),
  removeOwnedSkillPath: (...args: unknown[]) => removeOwnedSkillPathMock(...args),
  removeSkillOwnershipReceipt: (...args: unknown[]) => removeReceiptMock(...args),
  verifyOwnedSkillPath: async () => undefined,
}))

vi.mock('../../src/lib/quarantineDelete.js', () => ({
  withQuarantineTransaction: async (
    operation: () => Promise<unknown>,
    commit: () => Promise<void>,
  ) => {
    const value = await operation()
    await commit()
    return { value, cleanupFailures: [] }
  },
}))

import { withInstallOwnershipLock } from '../../src/installers/lib/installOwnershipLock.js'
import type { Manifest } from '../../src/manifest/schema/types.js'
import { createHostInstallContext } from '../../src/platform/hostInstallContext.js'
import { claudeDescriptor } from '../../src/platform/platform.js'
import { runDeclaredTeardown } from '../../src/uninstallers/lib/declaredTeardown.js'

const homes: string[] = []

afterEach(async () => {
  vi.clearAllMocks()
  await Promise.all(homes.splice(0).map((home) => rm(home, { recursive: true, force: true })))
})

describe('receipt-only teardown ownership lock', () => {
  it('serializes fresh install after receipt read through uninstall finalize', async () => {
    const home = await mkdtemp(join(tmpdir(), 'harnessed-uninstall-ownership-lock-'))
    homes.push(home)
    const descriptor = claudeDescriptor(home)
    const context = createHostInstallContext(descriptor, {
      os: process.platform,
      userHome: home,
      nativeHome: descriptor.homeDir,
    })
    const oldResource = join(context.platform.skillsDir, 'old-skill')
    const newResource = join(context.platform.skillsDir, 'new-skill')
    const receipt = join(context.platform.stateRoot, 'skill-ownership', 'fixture.json')
    await mkdir(oldResource, { recursive: true })
    await mkdir(join(receipt, '..'), { recursive: true })
    await writeFile(receipt, 'old receipt', 'utf8')

    let markReadStarted: (() => void) | undefined
    let releaseRead: (() => void) | undefined
    const readStarted = new Promise<void>((resolve) => {
      markReadStarted = resolve
    })
    const readGate = new Promise<void>((resolve) => {
      releaseRead = resolve
    })
    readReceiptMock.mockImplementation(async () => {
      markReadStarted?.()
      await readGate
      return { createdPaths: [oldResource], skillRoots: [context.platform.skillsDir] }
    })
    removeOwnedSkillPathMock.mockImplementation(async () => {
      await rm(oldResource, { recursive: true, force: true })
    })
    removeReceiptMock.mockImplementation(async () => {
      await rm(receipt, { force: true })
    })

    const manifest = {
      metadata: { name: 'fixture' },
      spec: {
        install: { method: 'npm-cli', cmd: 'true', installs_skills: ['old-skill'] },
        uninstall: { cmd: 'true', cleanup_paths: [] },
      },
    } as unknown as Manifest
    const uninstall = runDeclaredTeardown({
      manifest,
      opts: { apply: true, dryRun: false, yes: true },
      cwd: home,
      hostContext: context,
    })
    await readStarted

    let markFreshStarted: (() => void) | undefined
    const freshStarted = new Promise<void>((resolve) => {
      markFreshStarted = resolve
    })
    const fresh = withInstallOwnershipLock(context, async () => {
      markFreshStarted?.()
      await mkdir(newResource, { recursive: true })
      await writeFile(receipt, 'fresh receipt', 'utf8')
    })
    const serialized = await Promise.race([
      freshStarted.then(() => false),
      new Promise<true>((resolve) => setTimeout(() => resolve(true), 75)),
    ])
    releaseRead?.()

    const [result] = await Promise.all([uninstall, fresh])
    expect(serialized).toBe(true)
    expect(result).toEqual({ ok: true, removedPaths: [oldResource] })
    await expect(access(newResource)).resolves.toBeUndefined()
    await expect(readFile(receipt, 'utf8')).resolves.toBe('fresh receipt')
  })
})
