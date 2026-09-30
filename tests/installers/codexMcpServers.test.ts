// v16.0 post-close (ADR 0041) — codex "is this MCP server registered" probe via
// `codex mcp list --json`, replacing the `[mcp_servers.<name>]` header regex over
// ~/.codex/config.toml. Migrating it turned up a SECOND reader in the same pass —
// `probeSearchMcpKey` via `readUserClaudeJson` (asserted at the bottom of this file) —
// so "that was the last one" was only true after both were closed. With both closed,
// ADR 0041's "harnessed neither writes nor reads config.toml" holds with no exception
// clause, and `mcpConfigPath` is left as a diff-preview label only.
//
// Shape measured on codex-cli 0.155.1 (Windows) through an in-memory config override
// (`codex mcp list --json -c 'mcp_servers.<probe>={…}'` — touches no file, so no
// probe had to be written into the user's real config): a top-level ARRAY of
// {name, enabled, disabled_reason, transport{…}, …}. Note the array: the sister
// `codex plugin list --json` returns an OBJECT, and assuming that shape here would
// silently parse to "nothing registered".
//
// Sister harness: `codexPlugins.test.ts` (same decoy-config.toml fs assertion).

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

import { checkMcpAvailability } from '../../src/cli/lib/check-mcp-availability.js'
import { probeSearchMcpKey } from '../../src/cli/lib/search-mcp-keys.js'
import {
  invalidateCodexMcpCache,
  isCodexMcpServerRegistered,
  parseCodexMcpList,
} from '../../src/installers/lib/codexMcpServers.js'
import { isMcpServerRegistered } from '../../src/installers/lib/readClaudeConfig.js'

/** Verbatim shape from the 0.155.1 measurement, plus a disabled entry. */
const JSON_OUT = JSON.stringify([
  {
    name: 'tavily-mcp',
    enabled: true,
    disabled_reason: null,
    transport: {
      type: 'stdio',
      command: 'npx',
      args: ['--yes', 'tavily-mcp@^1.0.0'],
      env: null,
      env_vars: [],
      cwd: null,
    },
    startup_timeout_sec: null,
    tool_timeout_sec: null,
    auth_status: 'unsupported',
  },
  {
    name: 'exa-mcp-http',
    enabled: false,
    disabled_reason: 'disabled by user',
    transport: { type: 'streamable_http', url: 'https://exa.example.com/mcp' },
    startup_timeout_sec: null,
    tool_timeout_sec: null,
    auth_status: 'unsupported',
  },
])

describe('parseCodexMcpList', () => {
  it('extracts names from the measured array shape', () => {
    expect(parseCodexMcpList(JSON_OUT)).toEqual(new Set(['tavily-mcp', 'exa-mcp-http']))
  })

  it('`enabled: false` still counts as registered', () => {
    // Registration and enablement are different facts. The callers are install
    // idempotence and post-install verify: re-adding a server the user deliberately
    // disabled would undo their choice, and verify must not call the add a failure.
    expect(parseCodexMcpList(JSON_OUT)?.has('exa-mcp-http')).toBe(true)
  })

  it('empty listing → empty set, not null (that is a known-good "none registered")', () => {
    expect(parseCodexMcpList('[]')).toEqual(new Set())
  })

  it('an OBJECT payload is not silently accepted', () => {
    // Guards against porting the sister plugin probe's shape onto this one: an object
    // would otherwise parse to "nothing registered" and make every verify fail.
    expect(parseCodexMcpList(JSON.stringify({ servers: [{ name: 'tavily-mcp' }] }))).toBe(null)
  })

  it('malformed / non-JSON / nameless entries', () => {
    expect(parseCodexMcpList('[{oops')).toBe(null)
    expect(parseCodexMcpList('MCP servers:\n  tavily-mcp  stdio')).toBe(null)
    expect(parseCodexMcpList('')).toBe(null)
    expect(parseCodexMcpList('[{"enabled":true},{"name":""},{"name":"ok"}]')).toEqual(
      new Set(['ok']),
    )
  })
})

describe('isMcpServerRegistered on codex', () => {
  let home: string
  beforeEach(() => {
    opened.length = 0
    runHarnessArgs.mockReset()
    invalidateCodexMcpCache()
    home = mkdtempSync(join(tmpdir(), 'harnessed-codexmcp-'))
    mkdirSync(join(home, '.codex'), { recursive: true })
    writeFileSync(
      join(home, '.codex', 'config.toml'),
      [
        '[mcp_servers.ghost-mcp]',
        'command = "npx"',
        'experimental_bearer_token = "decoy-credential-must-never-be-read"',
        '# decoy — must never be opened',
        '',
      ].join('\n'),
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

  it('answers from `codex mcp list --json` and NEVER opens config.toml', async () => {
    runHarnessArgs.mockResolvedValue({ exitCode: 0, stdout: JSON_OUT, stderr: '' })
    // The decoy TOML declares `ghost-mcp` and nothing else. The CLI says otherwise.
    // Both directions are asserted, so a lingering file read cannot hide behind an
    // answer that happens to agree.
    expect(await isMcpServerRegistered('ghost-mcp')).toBe(false)
    expect(await isMcpServerRegistered('tavily-mcp')).toBe(true)
    expect(opened.filter((p) => p.replace(/\\/g, '/').endsWith('config.toml'))).toEqual([])
    expect(runHarnessArgs.mock.calls[0]?.[1]).toEqual(['mcp', 'list', '--json'])
  })

  it('one spawn serves many probes (setup asks per manifest)', async () => {
    runHarnessArgs.mockResolvedValue({ exitCode: 0, stdout: JSON_OUT, stderr: '' })
    await isCodexMcpServerRegistered('tavily-mcp')
    await isCodexMcpServerRegistered('exa-mcp-http')
    await isCodexMcpServerRegistered('nope')
    expect(runHarnessArgs).toHaveBeenCalledTimes(1)
  })

  it('invalidate → next probe re-lists (post-add verify must see fresh state)', async () => {
    // Without this, the idempotence pre-check's memo — taken BEFORE the add — would be
    // what verify consults, and it can never contain the just-added name.
    runHarnessArgs.mockResolvedValue({ exitCode: 0, stdout: JSON_OUT, stderr: '' })
    await isCodexMcpServerRegistered('tavily-mcp')
    invalidateCodexMcpCache()
    await isCodexMcpServerRegistered('tavily-mcp')
    expect(runHarnessArgs).toHaveBeenCalledTimes(2)
  })

  it('the search-key probe no longer opens config.toml either (whole-mechanism guard)', async () => {
    // `probeSearchMcpKey` (doctor `check-mcp-availability` + setup tail hint) went
    // through `readUserClaudeJson`, whose path on codex IS config.toml. It read the
    // credential file only to let JSON.parse fail. The guard sits in
    // `readUserClaudeJson` so future callers inherit it; this asserts the outcome is
    // unchanged (process-env remains the only source that can answer on codex).
    process.env.TAVILY_API_KEY = 'probe-value'
    try {
      const probe = await probeSearchMcpKey('tavily-mcp')
      expect(probe).toMatchObject({ present: true, source: 'process-env' })
    } finally {
      delete process.env.TAVILY_API_KEY
    }
    expect(opened.filter((p) => p.endsWith('config.toml'))).toEqual([])
  })

  it('the doctor API-key hint stops naming claude-only files on codex', async () => {
    // Same root cause as the probe itself: on codex `settingsPath` is null and the MCP
    // config is TOML, so process env is the only source that can answer. The old hint
    // told the user to edit `~/.claude/settings.json` / `~/.claude.json` — two files
    // that have no effect on a codex setup.
    const both = JSON.stringify([{ name: 'tavily-mcp' }, { name: 'exa-mcp' }])
    runHarnessArgs.mockResolvedValue({ exitCode: 0, stdout: both, stderr: '' })
    const savedTavily = process.env.TAVILY_API_KEY
    const savedExa = process.env.EXA_API_KEY
    delete process.env.TAVILY_API_KEY
    delete process.env.EXA_API_KEY
    try {
      const r = await checkMcpAvailability()
      expect(r.fix).toMatch(/export/)
      expect(r.fix).not.toMatch(/settings\.json/)
      expect(r.fix).not.toMatch(/claude\.json/)
    } finally {
      if (savedTavily !== undefined) process.env.TAVILY_API_KEY = savedTavily
      if (savedExa !== undefined) process.env.EXA_API_KEY = savedExa
    }
  })

  it('codex missing / listing unparseable → false, no throw, still no file read', async () => {
    runHarnessArgs.mockResolvedValue({ exitCode: -1, stdout: '', stderr: 'codex CLI not found' })
    expect(await isMcpServerRegistered('tavily-mcp')).toBe(false)
    expect(opened.filter((p) => p.replace(/\\/g, '/').endsWith('config.toml'))).toEqual([])
  })
})
