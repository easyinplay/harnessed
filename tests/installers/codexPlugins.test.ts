// v16.0 Phase 64 T5 (R6) — codex "installed plugin" probe via `codex plugin list`,
// replacing the config.toml `[plugins."<p>@<m>"]` header regex (the ADR boundary:
// harnessed code never reads config.toml, which also carries credentials).
//
// Measured on codex-cli 0.155.1: `codex plugin list --json` → {installed:[{pluginId,
// installed, enabled, …}], available:[…]}; `available` (and "not installed" table
// rows) must never count. The plain table is the fallback for a codex without --json.
// The fs-level assertion: with a decoy config.toml present, nothing opens it.

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const opened: string[] = []
vi.mock('node:fs/promises', async (importOriginal) => {
  const real = await importOriginal<typeof import('node:fs/promises')>()
  return {
    ...real,
    readFile: ((p: unknown, ...rest: unknown[]) => {
      opened.push(String(p))
      return (real.readFile as (...a: unknown[]) => unknown)(p, ...rest)
    }) as typeof real.readFile,
  }
})
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

const runHarnessArgs = vi.fn()
vi.mock('../../src/installers/lib/runClaudeArgs.js', () => ({
  runHarnessArgs: (...a: unknown[]) => runHarnessArgs(...a),
  runArgs: vi.fn(),
}))

import {
  invalidateCodexPluginCache,
  isCodexPluginInstalled,
  parseCodexPluginList,
} from '../../src/installers/lib/codexPlugins.js'
import { isPluginRegistered } from '../../src/installers/lib/readClaudeConfig.js'

const JSON_OUT = JSON.stringify({
  installed: [
    { pluginId: 'warp@codex-warp', installed: true, enabled: true },
    { pluginId: 'harnessed-perturn-inject@harnessed-local', installed: true, enabled: true },
    { pluginId: 'ghost@m', installed: false, enabled: false },
  ],
  available: [{ pluginId: 'superpowers@openai-api-curated', installed: false }],
})

const TABLE_OUT = [
  'Marketplace `codex-warp`',
  'C:\\x\\marketplace.json',
  '',
  'PLUGIN                    STATUS              VERSION  SOURCE',
  'warp@codex-warp           installed, enabled  0.4.1    C:\\x\\warp',
  'orchestration@codex-warp  not installed                C:\\x\\orchestration',
].join('\n')

describe('parseCodexPluginList', () => {
  it('JSON: installed[] with installed:true only; available never counts', () => {
    expect([...(parseCodexPluginList(JSON_OUT) ?? [])].sort()).toEqual([
      'harnessed-perturn-inject@harnessed-local',
      'warp@codex-warp',
    ])
  })
  it('table fallback: "installed…" rows only, never "not installed"', () => {
    expect([...(parseCodexPluginList(TABLE_OUT) ?? [])]).toEqual(['warp@codex-warp'])
  })
  it('unrecognizable output → null (unknown, not "none installed")', () => {
    expect(parseCodexPluginList('')).toBeNull()
    expect(parseCodexPluginList('error: boom')).toBeNull()
  })
})

describe('isCodexPluginInstalled / isPluginRegistered on codex', () => {
  let home: string
  beforeEach(() => {
    opened.length = 0
    runHarnessArgs.mockReset()
    invalidateCodexPluginCache()
    home = mkdtempSync(join(tmpdir(), 'harnessed-codexplugins-'))
    mkdirSync(join(home, '.codex'), { recursive: true })
    writeFileSync(
      join(home, '.codex', 'config.toml'),
      '[plugins."superpowers@openai-api-curated"]\nenabled = true\n# decoy — must never be opened\n',
    )
    vi.stubEnv('HOME', home)
    vi.stubEnv('USERPROFILE', home)
    vi.stubEnv('HARNESSED_ROOT_OVERRIDE', '')
    vi.stubEnv('HARNESSED_PLATFORM', 'codex')
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    rmSync(home, { recursive: true, force: true })
  })

  it('bare and qualified names; one spawn serves many probes (cached)', async () => {
    runHarnessArgs.mockResolvedValue({ exitCode: 0, stdout: JSON_OUT, stderr: '' })
    expect(await isCodexPluginInstalled('warp')).toBe(true)
    expect(await isCodexPluginInstalled('warp@codex-warp')).toBe(true)
    expect(await isCodexPluginInstalled('warp@other')).toBe(false)
    expect(await isCodexPluginInstalled('superpowers')).toBe(false)
    expect(runHarnessArgs).toHaveBeenCalledTimes(1)
    expect(runHarnessArgs.mock.calls[0]?.[1]).toEqual(['plugin', 'list', '--json'])
  })

  it('--json unsupported → falls back to the table form', async () => {
    runHarnessArgs
      .mockResolvedValueOnce({ exitCode: 2, stdout: '', stderr: "unexpected argument '--json'" })
      .mockResolvedValueOnce({ exitCode: 0, stdout: TABLE_OUT, stderr: '' })
    expect(await isCodexPluginInstalled('warp')).toBe(true)
    expect(runHarnessArgs.mock.calls[1]?.[1]).toEqual(['plugin', 'list'])
  })

  it('codex missing → false, no throw', async () => {
    runHarnessArgs.mockResolvedValue({ exitCode: -1, stdout: '', stderr: 'codex CLI not found' })
    expect(await isCodexPluginInstalled('warp')).toBe(false)
  })

  it('invalidate → next probe re-lists (post-install verify sees fresh state)', async () => {
    runHarnessArgs.mockResolvedValue({ exitCode: 0, stdout: JSON_OUT, stderr: '' })
    await isCodexPluginInstalled('warp')
    invalidateCodexPluginCache()
    await isCodexPluginInstalled('warp')
    expect(runHarnessArgs).toHaveBeenCalledTimes(2)
  })

  it('isPluginRegistered (codex) answers from `codex plugin list` and NEVER opens config.toml', async () => {
    runHarnessArgs.mockResolvedValue({ exitCode: 0, stdout: JSON_OUT, stderr: '' })
    // the decoy TOML claims superpowers is installed — the CLI says it is not.
    expect(await isPluginRegistered('superpowers')).toBe(false)
    expect(await isPluginRegistered('warp')).toBe(true)
    expect(opened.filter((p) => p.replace(/\\/g, '/').endsWith('config.toml'))).toEqual([])
  })
})
