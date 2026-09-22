// v16.0 Phase 63 T3 — codex has no JSON settings file (settingsPath === null).
//
// Every getSettingsPath() consumer must handle null explicitly: skip with a
// readable reason / pass-skip, never throw, and never fall back to another file.
// The load-bearing assertion is fs-level: with a decoy ~/.codex/config.toml in
// an injected home, none of these settings-chain paths ever opens config.toml.
// (MCP / plugin probes read config.toml through mcpConfigPath by design — F3 —
// so those are stubbed out here; they are not part of the settings chain.)

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const opened: string[] = []

vi.mock('node:fs', async (importOriginal) => {
  const real = await importOriginal<typeof import('node:fs')>()
  return {
    ...real,
    readFileSync: ((p: unknown, ...rest: unknown[]) => {
      opened.push(String(p))
      return (real.readFileSync as (...a: unknown[]) => unknown)(p, ...rest)
    }) as typeof real.readFileSync,
  }
})

vi.mock('node:fs/promises', async (importOriginal) => {
  const real = await importOriginal<typeof import('node:fs/promises')>()
  const rec =
    <F extends (...a: never[]) => unknown>(f: F) =>
    (p: unknown, ...rest: unknown[]) => {
      opened.push(String(p))
      return (f as unknown as (...a: unknown[]) => unknown)(p, ...rest)
    }
  return {
    ...real,
    readFile: rec(real.readFile),
    writeFile: rec(real.writeFile),
  }
})

// F3: plugin / MCP registration reads config.toml via mcpConfigPath on purpose.
vi.mock('../../src/installers/lib/readClaudeConfig.js', () => ({
  isPluginRegistered: vi.fn(async () => false),
  isMcpServerRegistered: vi.fn(async () => false),
  readUserClaudeJson: vi.fn(async () => ({})),
}))

import { detectGateGuardActive } from '../../src/cli/lib/check-guard-conflict.js'
import { checkInjectInvalidate } from '../../src/cli/lib/check-inject-invalidate.js'
import { checkStaleHooks } from '../../src/cli/lib/check-stale-hooks.js'
import { checkAgentTeams } from '../../src/cli/lib/checkAgentTeams.js'
import { previewLines, readCurrentEnvValue } from '../../src/cli/lib/guard-exemption.js'
import { probeSearchMcpKey } from '../../src/cli/lib/search-mcp-keys.js'
import { mergeSettingsEnvKey } from '../../src/cli/lib/settingsWriter.js'
import { getSettingsPath } from '../../src/platform/platform.js'

let home: string

beforeEach(() => {
  opened.length = 0
  home = mkdtempSync(join(tmpdir(), 'harnessed-nullsettings-'))
  mkdirSync(join(home, '.codex'), { recursive: true })
  writeFileSync(join(home, '.codex', 'config.toml'), '# decoy — must never be opened\n')
  vi.stubEnv('HOME', home)
  vi.stubEnv('USERPROFILE', home)
  vi.stubEnv('HARNESSED_ROOT_OVERRIDE', join(home, 'state'))
  vi.stubEnv('HARNESSED_PLATFORM', 'codex')
})

afterEach(() => {
  vi.unstubAllEnvs()
  rmSync(home, { recursive: true, force: true })
})

function openedConfigToml(): string[] {
  return opened.filter((p) => p.replace(/\\/g, '/').endsWith('config.toml'))
}

describe('settingsPath === null on codex (Phase 63 T3)', () => {
  it('getSettingsPath() is null under codex', () => {
    expect(getSettingsPath()).toBeNull()
  })

  it('checkAgentTeams → no settings read, env-only probe, no throw', async () => {
    const r = await checkAgentTeams()
    expect(r.detected.settingsJson).toBe(false)
    expect(openedConfigToml()).toEqual([])
  })

  it('detectGateGuardActive → inactive, no settings read', async () => {
    const r = await detectGateGuardActive({ env: {} })
    expect(r.active).toBe(false)
    expect(openedConfigToml()).toEqual([])
  })

  it('checkInjectInvalidate → pass with a readable skip reason', () => {
    const r = checkInjectInvalidate()
    expect(r.status).toBe('pass')
    expect(r.message).toMatch(/no settings file on codex/)
    expect(openedConfigToml()).toEqual([])
  })

  it('checkStaleHooks → pass with a readable skip reason', () => {
    const r = checkStaleHooks()
    expect(r.status).toBe('pass')
    expect(r.message).toMatch(/no settings file on codex/)
    expect(openedConfigToml()).toEqual([])
  })

  it('readCurrentEnvValue → undefined; previewLines names no file', async () => {
    await expect(readCurrentEnvValue()).resolves.toBeUndefined()
    expect(previewLines(undefined, 'x').join('\n')).not.toMatch(/null|config\.toml/)
    expect(openedConfigToml()).toEqual([])
  })

  it('probeSearchMcpKey → skips the settings source', async () => {
    const r = await probeSearchMcpKey('tavily-mcp')
    expect(r.source).not.toBe('settings-env')
    expect(openedConfigToml()).toEqual([])
  })

  it('mergeSettingsEnvKey → warn (never writes config.toml)', async () => {
    const r = await mergeSettingsEnvKey('K', 'V')
    expect(r.outcome).toBe('warn')
    if (r.outcome === 'warn') expect(r.message).toMatch(/no settings file on codex/)
    expect(openedConfigToml()).toEqual([])
  })
})
