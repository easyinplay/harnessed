import { access, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Command } from 'commander'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { registerUninstall } from '../../src/cli/uninstall.js'

vi.mock('@clack/prompts', () => ({
  confirm: vi.fn(async () => true),
  isCancel: () => false,
}))

class ExitError extends Error {
  constructor(readonly code: number) {
    super(`exit:${code}`)
  }
}

async function createFixture(root: string) {
  const claudeHome = join(root, '.claude')
  const stateRoot = join(claudeHome, 'harnessed')
  const settingsPath = join(claudeHome, 'settings.json')
  const receiptPath = join(stateRoot, 'settings-env-ownership.json')
  const statePath = join(stateRoot, 'state.json')
  await mkdir(stateRoot, { recursive: true })
  await mkdir(claudeHome, { recursive: true })
  await writeFile(
    settingsPath,
    `${JSON.stringify({ env: { HARNESSED_USER_LANG: 'zh-Hans' } }, null, 2)}\n`,
    'utf8',
  )
  await writeFile(
    receiptPath,
    `${JSON.stringify(
      {
        version: 1,
        entries: {
          HARNESSED_USER_LANG: {
            installedValue: 'zh-Hans',
            previous: { present: false },
          },
        },
      },
      null,
      2,
    )}\n`,
    'utf8',
  )
  await writeFile(statePath, '{}\n', 'utf8')
  return { claudeHome, stateRoot, settingsPath, receiptPath, statePath }
}

async function runCli(claudeHome: string, stateRoot: string) {
  vi.stubEnv('HARNESSED_PLATFORM', 'claude')
  vi.stubEnv('CLAUDE_CONFIG_DIR', claudeHome)
  vi.stubEnv('HARNESSED_ROOT_OVERRIDE', stateRoot)
  const stdout: string[] = []
  const stderr: string[] = []
  vi.spyOn(console, 'log').mockImplementation((...args) => stdout.push(args.join(' ')))
  vi.spyOn(console, 'error').mockImplementation((...args) => stderr.push(args.join(' ')))
  vi.spyOn(process, 'exit').mockImplementation((code) => {
    throw new ExitError(Number(code ?? 0))
  })

  const program = new Command().exitOverride()
  registerUninstall(program)
  try {
    await program.parseAsync(['node', 'harnessed', 'uninstall'])
  } catch (error) {
    if (!(error instanceof ExitError)) throw error
    return { code: error.code, stdout: stdout.join('\n'), stderr: stderr.join('\n') }
  }
  throw new Error('CLI did not exit')
}

describe('cli/uninstall real filesystem', () => {
  let root: string

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'harnessed-uninstall-real-fs-'))
  })

  afterEach(async () => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
    await rm(root, { recursive: true, force: true })
  })

  it('completes after settings cleanup removes its ownership receipt', async () => {
    const { claudeHome, stateRoot, settingsPath, receiptPath, statePath } =
      await createFixture(root)
    const result = await runCli(claudeHome, stateRoot)

    expect(result.code).toBe(0)
    expect(result.stdout).toContain('uninstall complete')
    expect(result.stderr).not.toContain('partially failed')
    await expect(access(receiptPath)).rejects.toMatchObject({ code: 'ENOENT' })
    await expect(access(statePath)).rejects.toMatchObject({ code: 'ENOENT' })
    expect(JSON.parse(await readFile(settingsPath, 'utf8'))).toEqual({})
  })

  it('preserves the ownership receipt and state when the settings write fails', async () => {
    const { claudeHome, stateRoot, settingsPath, receiptPath, statePath } =
      await createFixture(root)
    const now = 1_800_000_000_000
    vi.spyOn(Date, 'now').mockReturnValue(now)
    await mkdir(`${settingsPath}.tmp-${process.pid}-${now}`)

    const result = await runCli(claudeHome, stateRoot)

    expect(result.code).toBe(1)
    expect(result.stderr).toContain(settingsPath)
    expect(result.stdout).not.toContain('uninstall complete')
    await expect(access(receiptPath)).resolves.toBeUndefined()
    await expect(access(statePath)).resolves.toBeUndefined()
    expect(JSON.parse(await readFile(settingsPath, 'utf8'))).toEqual({
      env: { HARNESSED_USER_LANG: 'zh-Hans' },
    })
  })
})
