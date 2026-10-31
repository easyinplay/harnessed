import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  loadSettingsOwnershipReceipt,
  recordSettingsEnvOwnership,
  restoreOwnedSettingsEnv,
  settingsOwnershipReceiptPath,
} from '../../src/cli/lib/settingsOwnershipReceipt.js'
import { createHostInstallContext } from '../../src/platform/hostInstallContext.js'
import { claudeDescriptor } from '../../src/platform/platform.js'

const roots: string[] = []

async function fixture() {
  const home = await mkdtemp(join(tmpdir(), 'harnessed-settings-receipt-'))
  roots.push(home)
  const platform = claudeDescriptor(home)
  return createHostInstallContext(platform, {
    os: process.platform,
    userHome: home,
    nativeHome: platform.homeDir,
  })
}

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })))
})

describe('settings ownership receipt', () => {
  it('distinguishes an absent receipt from a loaded receipt', async () => {
    const context = await fixture()
    const absent = await loadSettingsOwnershipReceipt(context)
    expect(absent).toEqual({ status: 'absent' })

    await mkdir(context.platform.stateRoot, { recursive: true })
    await writeFile(
      settingsOwnershipReceiptPath(context),
      JSON.stringify({
        version: 1,
        entries: {
          HARNESSED_USER_LANG: {
            installedValue: 'zh-Hans',
            previous: { present: false },
          },
        },
      }),
      'utf8',
    )
    const loaded = await loadSettingsOwnershipReceipt(context)
    expect(loaded).toMatchObject({ status: 'ok' })
    if (loaded.status === 'ok') expect(loaded.receipt.entries.HARNESSED_USER_LANG).toBeDefined()
  })

  it('restores prior values and deletes keys that were originally absent', () => {
    const data = {
      env: {
        CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS: '1',
        HARNESSED_USER_LANG: 'zh-Hans',
        OTHER_VAR: 'keep',
      },
    }
    const result = restoreOwnedSettingsEnv(data, {
      version: 1,
      entries: {
        CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS: {
          installedValue: '1',
          previous: { present: false },
        },
        HARNESSED_USER_LANG: {
          installedValue: 'zh-Hans',
          previous: { present: true, value: 'en' },
        },
      },
    })
    expect(result.changed).toBe(true)
    expect(data.env).toEqual({ HARNESSED_USER_LANG: 'en', OTHER_VAR: 'keep' })
  })

  it('preserves a value changed by the user after setup', () => {
    const data = { env: { HARNESSED_USER_LANG: 'fr' } }
    const result = restoreOwnedSettingsEnv(data, {
      version: 1,
      entries: {
        HARNESSED_USER_LANG: {
          installedValue: 'zh-Hans',
          previous: { present: false },
        },
      },
    })
    expect(result.changed).toBe(false)
    expect(data.env.HARNESSED_USER_LANG).toBe('fr')
  })

  it.each([
    ['array', []],
    ['string', 'bad'],
    ['null', null],
  ])('fails closed when settings env is %s', (_label, env) => {
    expect(() =>
      restoreOwnedSettingsEnv(
        { env },
        {
          version: 1,
          entries: {
            HARNESSED_USER_LANG: {
              installedValue: 'zh-Hans',
              previous: { present: false },
            },
          },
        },
      ),
    ).toThrow(/env.*JSON object/i)
  })

  it('rejects unsupported keys and present previous values without strings', async () => {
    const context = await fixture()
    await expect(
      recordSettingsEnvOwnership('UNTRUSTED_KEY', 'owned', { present: false }, context),
    ).rejects.toThrow(/unsupported managed settings env key/i)
    await expect(
      recordSettingsEnvOwnership(
        'HARNESSED_USER_LANG',
        'zh-Hans',
        { present: true, value: undefined },
        context,
      ),
    ).rejects.toThrow(/invalid previous value/i)
  })

  it('distinguishes corrupt receipts from absent receipts', async () => {
    const context = await fixture()
    const path = settingsOwnershipReceiptPath(context)
    await mkdir(context.platform.stateRoot, { recursive: true })
    for (const entries of [
      {
        UNTRUSTED_KEY: { installedValue: 'owned', previous: { present: false } },
      },
      {
        HARNESSED_USER_LANG: { installedValue: 'zh-Hans', previous: { present: true } },
      },
    ]) {
      await writeFile(path, JSON.stringify({ version: 1, entries }), 'utf8')
      await expect(loadSettingsOwnershipReceipt(context)).resolves.toMatchObject({
        status: 'corrupt',
      })
    }
  })

  it('reports an unreadable receipt as an error', async () => {
    const home = await mkdtemp(join(tmpdir(), 'harnessed-settings-receipt-file-'))
    roots.push(home)
    const platform = claudeDescriptor(home)
    const stateFile = join(home, 'state-file')
    await writeFile(stateFile, 'not a directory', 'utf8')
    const context = createHostInstallContext(
      { ...platform, stateRoot: stateFile },
      { os: process.platform, userHome: home, nativeHome: platform.homeDir },
    )

    await expect(loadSettingsOwnershipReceipt(context)).resolves.toMatchObject({ status: 'error' })
  })

  it('serializes concurrent receipt updates without losing either entry', async () => {
    const context = await fixture()

    await Promise.all([
      recordSettingsEnvOwnership('HARNESSED_USER_LANG', 'zh-Hans', { present: false }, context),
      recordSettingsEnvOwnership('GATEGUARD_EXEMPT_GLOBS', 'dist/**', { present: false }, context),
    ])

    await expect(loadSettingsOwnershipReceipt(context)).resolves.toMatchObject({
      status: 'ok',
      receipt: {
        entries: {
          HARNESSED_USER_LANG: { installedValue: 'zh-Hans' },
          GATEGUARD_EXEMPT_GLOBS: { installedValue: 'dist/**' },
        },
      },
    })
  })
})
