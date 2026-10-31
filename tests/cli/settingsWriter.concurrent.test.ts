import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createHostInstallContext } from '../../src/platform/hostInstallContext.js'
import { claudeDescriptor } from '../../src/platform/platform.js'

const roots: string[] = []
const readGate = vi.hoisted(() => ({
  enabled: false,
  reads: 0,
  release: undefined as (() => void) | undefined,
}))

vi.mock('node:fs/promises', async () => {
  const actual = await vi.importActual<typeof import('node:fs/promises')>('node:fs/promises')
  return {
    ...actual,
    readFile: async (...args: Parameters<typeof actual.readFile>) => {
      const path = String(args[0])
      if (readGate.enabled && path.endsWith('settings.json')) {
        readGate.reads++
        if (readGate.reads === 1) {
          await new Promise<void>((resolve) => {
            const timer = setTimeout(resolve, 100)
            readGate.release = () => {
              clearTimeout(timer)
              resolve()
            }
          })
        } else if (readGate.reads === 2) {
          readGate.release?.()
        }
      }
      return actual.readFile(...args)
    },
  }
})

async function fixture() {
  const home = await mkdtemp(join(tmpdir(), 'harnessed-settings-concurrency-'))
  roots.push(home)
  const platform = claudeDescriptor(home)
  const context = createHostInstallContext(platform, {
    os: process.platform,
    userHome: home,
    nativeHome: platform.homeDir,
  })
  await mkdir(context.nativeHome, { recursive: true })
  await writeFile(join(context.nativeHome, 'settings.json'), '{"env":{"BASE":"keep"}}\n', 'utf8')
  return context
}

function withStateRoot(context: Awaited<ReturnType<typeof fixture>>, stateRoot: string) {
  return createHostInstallContext(
    { ...context.platform, stateRoot },
    {
      os: context.os,
      userHome: context.userHome,
      nativeHome: context.nativeHome,
    },
  )
}

afterEach(async () => {
  readGate.enabled = false
  readGate.reads = 0
  readGate.release = undefined
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })))
})

describe('settings writer transaction concurrency', () => {
  it('serializes concurrent settings and ownership receipt read-modify-writes', async () => {
    const context = await fixture()
    readGate.enabled = true
    const { mergeSettingsEnvKey } = await import('../../src/cli/lib/settingsWriter.js')
    const { loadSettingsOwnershipReceipt } = await import(
      '../../src/cli/lib/settingsOwnershipReceipt.js'
    )

    const results = await Promise.all([
      mergeSettingsEnvKey('HARNESSED_USER_LANG', 'zh-Hans', { hostContext: context }),
      mergeSettingsEnvKey('GATEGUARD_EXEMPT_GLOBS', 'dist/**', { hostContext: context }),
    ])

    expect(results.every((result) => result.outcome === 'merged')).toBe(true)
    const settings = JSON.parse(
      await readFile(join(context.nativeHome, 'settings.json'), 'utf8'),
    ) as { env: Record<string, string> }
    expect(settings.env).toEqual({
      BASE: 'keep',
      HARNESSED_USER_LANG: 'zh-Hans',
      GATEGUARD_EXEMPT_GLOBS: 'dist/**',
    })
    const receipt = await loadSettingsOwnershipReceipt(context)
    expect(receipt).toMatchObject({
      status: 'ok',
      receipt: {
        entries: {
          HARNESSED_USER_LANG: { installedValue: 'zh-Hans' },
          GATEGUARD_EXEMPT_GLOBS: { installedValue: 'dist/**' },
        },
      },
    })
  })

  it('serializes the same native settings home across different stateRoot overrides', async () => {
    const context = await fixture()
    const firstContext = withStateRoot(context, join(context.userHome, 'state-a'))
    const secondContext = withStateRoot(context, join(context.userHome, 'state-b'))
    readGate.enabled = true
    const { mergeSettingsEnvKey } = await import('../../src/cli/lib/settingsWriter.js')

    const results = await Promise.all([
      mergeSettingsEnvKey('HARNESSED_USER_LANG', 'zh-Hans', { hostContext: firstContext }),
      mergeSettingsEnvKey('GATEGUARD_EXEMPT_GLOBS', 'dist/**', { hostContext: secondContext }),
    ])

    expect(results.every((result) => result.outcome === 'merged')).toBe(true)
    const settings = JSON.parse(
      await readFile(join(context.nativeHome, 'settings.json'), 'utf8'),
    ) as { env: Record<string, string> }
    expect(settings.env).toEqual({
      BASE: 'keep',
      HARNESSED_USER_LANG: 'zh-Hans',
      GATEGUARD_EXEMPT_GLOBS: 'dist/**',
    })
  })
})
