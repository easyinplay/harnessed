// Phase 84 T3 — `harnessed auto-update on|off|status` unit tests.
//
// The files this command touches are the ones the BACKGROUND WORKER touches
// (R15): the preferences file and the status file both live in the host's
// state root. The tests therefore resolve the expected paths through the very
// same `resolveUpdateReminderRuntime` call the worker uses, so a drift between
// "the command writes here" and "the worker reads here" fails the suite
// instead of surfacing as "the user turned it on but it never fires".

import { readFileSync } from 'node:fs'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Command } from 'commander'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { registerAutoUpdate } from '../../src/cli/autoUpdateCmd.js'
import {
  type AutoUpdateStatus,
  autoUpdateStatusPath,
  writeAutoUpdateStatus,
} from '../../src/cli/lib/autoUpdateStatus.js'
import { resolveUpdateReminderRuntime } from '../../src/compile/updateReminderEntrypoint.js'

let root: string
let claudeHome: string
let codexHome: string

function runtimeFor(host: 'claude' | 'codex') {
  const runtime = resolveUpdateReminderRuntime({ args: ['--platform', host] })
  if (!runtime) throw new Error('missing reminder runtime')
  return runtime
}

/** The raw `console.log` calls of one invocation (one call per printed block). */
async function run(...args: string[]): Promise<string[]> {
  vi.mocked(console.log).mockClear()
  const program = new Command().exitOverride()
  registerAutoUpdate(program)
  await program.parseAsync(['node', 'harnessed', 'auto-update', ...args])
  return vi.mocked(console.log).mock.calls.map((call) => String(call[0]))
}

/** The printed lines of one invocation (a multi-line block counts as N lines). */
async function runLines(...args: string[]): Promise<string[]> {
  return (await run(...args)).flatMap((block) => block.split('\n'))
}

async function seedPreferences(text: string, host: 'claude' | 'codex' = 'claude'): Promise<string> {
  const { preferencesPath } = runtimeFor(host)
  await mkdir(join(preferencesPath, '..'), { recursive: true })
  await writeFile(preferencesPath, text)
  return preferencesPath
}

function readPreferences(host: 'claude' | 'codex' = 'claude'): Record<string, unknown> {
  return JSON.parse(readFileSync(runtimeFor(host).preferencesPath, 'utf8'))
}

beforeEach(async () => {
  vi.clearAllMocks()
  root = await mkdtemp(join(tmpdir(), 'harnessed-auto-update-'))
  claudeHome = join(root, 'claude home')
  codexHome = join(root, 'codex home')
  vi.stubEnv('HARNESSED_ROOT_OVERRIDE', '')
  vi.stubEnv('HARNESSED_PLATFORM', 'claude')
  vi.stubEnv('CLAUDE_CONFIG_DIR', claudeHome)
  vi.stubEnv('CODEX_HOME', codexHome)
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(async () => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
  process.exitCode = 0
  await rm(root, { recursive: true, force: true })
})

describe('harnessed auto-update consent', () => {
  it('creates the preferences file when it does not exist yet', async () => {
    const lines = await run('on')
    expect(readPreferences()).toEqual({ schemaVersion: 1, enabled: true, autoUpdate: true })
    expect(lines.join('\n')).toContain(runtimeFor('claude').preferencesPath)
  })

  it('keeps every unrelated key when turning auto-update on', async () => {
    await seedPreferences('{"schemaVersion":1,"enabled":true,"custom":"keep"}')
    await run('on')
    expect(readPreferences()).toEqual({
      schemaVersion: 1,
      enabled: true,
      custom: 'keep',
      autoUpdate: true,
    })
  })

  it('turns auto-update off and keeps the rest of the document', async () => {
    await seedPreferences('{"schemaVersion":1,"enabled":true,"autoUpdate":true,"custom":"keep"}')
    await run('off')
    expect(readPreferences()).toEqual({
      schemaVersion: 1,
      enabled: true,
      autoUpdate: false,
      custom: 'keep',
    })
  })

  it('creates the preferences file with auto-update off when it does not exist', async () => {
    await run('off')
    expect(readPreferences()).toEqual({ schemaVersion: 1, enabled: true, autoUpdate: false })
  })

  it('replaces a corrupt preferences file and says so', async () => {
    await seedPreferences('not-json')
    const lines = await run('on')
    expect(readPreferences()).toEqual({ schemaVersion: 1, enabled: true, autoUpdate: true })
    expect(lines.join('\n')).toMatch(/replaced/i)
  })

  it('warns that the update notice stays silent when the reminder consent is off', async () => {
    await seedPreferences('{"schemaVersion":1,"enabled":false}')
    const lines = await run('on')
    expect(lines.join('\n')).toMatch(/reminder is off/i)
    expect(lines.join('\n')).toContain('harnessed auto-update status')
  })
})

describe('harnessed auto-update status', () => {
  it('prints the minimal two-line view when there is no status file', async () => {
    const lines = await runLines('status')
    expect(lines[0]).toMatch(/^auto-update: (on|off)$/)
    expect(lines[1]).toMatch(/^installed: \S+ {3}latest: unknown {3}state: idle$/)
  })

  it('prints the three-line view when a status file exists', async () => {
    const status: AutoUpdateStatus = {
      schemaVersion: 1,
      consent: { autoUpdate: false, enabled: true },
      channel: 'binary',
      installed: '5.0.12',
      latest: '5.0.13',
      state: 'failed',
      progress: { received: 0, total: 0, updatedAt: 0 },
      lastResult: {
        version: '5.0.13',
        status: 'failed',
        reason: 'network',
        message: '',
        at: Date.UTC(2026, 10, 4, 3, 12, 0),
      },
      history: [],
      notice: null,
    }
    writeAutoUpdateStatus(autoUpdateStatusPath(runtimeFor('claude').stateRoot), status)
    const lines = await runLines('status')
    expect(lines[0]).toBe('auto-update: off')
    expect(lines[1]).toBe('installed: 5.0.12   latest: 5.0.13   state: failed')
    expect(lines[2]).toMatch(/^last: failed 5\.0\.13 \(network\) at /)
  })

  it('emits one JSON object with --json', async () => {
    const lines = await run('status', '--json')
    expect(lines).toHaveLength(1)
    const parsed = JSON.parse(lines[0] ?? '{}') as Record<string, unknown>
    expect(parsed.consent).toEqual({ autoUpdate: false, enabled: true })
    expect(parsed.state).toBe('idle')
    expect(parsed.host).toBe('claude')
    expect(parsed.preferencesPath).toBe(runtimeFor('claude').preferencesPath)
    expect(parsed.statusPath).toBe(autoUpdateStatusPath(runtimeFor('claude').stateRoot))
  })

  it('prints the resolved host, preferences path and status path', async () => {
    const lines = await run('status')
    const output = lines.join('\n')
    expect(output).toContain('host:        claude')
    expect(output).toContain(runtimeFor('claude').preferencesPath)
    expect(output).toContain(autoUpdateStatusPath(runtimeFor('claude').stateRoot))
  })
})

describe('harnessed auto-update --platform', () => {
  it('defaults to the DETECTED host, not a hardcoded claude', async () => {
    // A codex-only machine: CLAUDE_CONFIG_DIR unset, CODEX_HOME configured.
    vi.stubEnv('HARNESSED_PLATFORM', '')
    vi.stubEnv('CLAUDE_CONFIG_DIR', '')
    const lines = await run('on')
    const codex = runtimeFor('codex')
    expect(lines.join('\n')).toContain('host:        codex')
    expect(lines.join('\n')).toContain(codex.preferencesPath)
    expect(JSON.parse(readFileSync(codex.preferencesPath, 'utf8'))).toEqual({
      schemaVersion: 1,
      enabled: true,
      autoUpdate: true,
    })
  })

  it('refuses to guess when both host homes are configured', async () => {
    vi.stubEnv('HARNESSED_PLATFORM', '')
    const lines = await run('status')
    const warnings = vi
      .mocked(console.warn)
      .mock.calls.map((call) => String(call[0]))
      .join('\n')
    expect(lines.join('\n')).not.toContain('auto-update:')
    expect(warnings).toContain('--platform')
    expect(process.exitCode).toBe(1)
  })

  it('resolves a different state root per host', async () => {
    const claude = runtimeFor('claude')
    const codex = runtimeFor('codex')
    expect(claude.preferencesPath).not.toBe(codex.preferencesPath)

    const claudeLines = await run('status', '--platform', 'claude')
    const codexLines = await run('status', '--platform', 'codex')
    expect(claudeLines.join('\n')).toContain(claude.preferencesPath)
    expect(codexLines.join('\n')).toContain(codex.preferencesPath)
    expect(codexLines.join('\n')).not.toContain(claude.preferencesPath)
  })

  it('writes the consent into the selected host root only', async () => {
    await run('on', '--platform', 'codex')
    expect(readPreferences('codex')).toEqual({
      schemaVersion: 1,
      enabled: true,
      autoUpdate: true,
    })
    expect(() => readPreferences('claude')).toThrow()
  })
})
