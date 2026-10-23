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
  listCodexMcpServerMetadata,
  listCodexMcpServers,
  parseCodexMcpList,
  parseCodexMcpMetadata,
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

describe('sanitized Codex MCP metadata parser', () => {
  it.each([
    [true, true],
    [false, false],
    [undefined, null],
    [null, null],
    ['false', null],
    [0, null],
    [{ enabled: true }, null],
  ])('normalizes enabled=%j to %j without exporting sensitive fields', (enabled, expected) => {
    const stdout = JSON.stringify([
      {
        name: 'fixture-mcp',
        enabled,
        transport: { env: { SECRET: 'fixture-env-secret' }, bearer_token: 'fixture-token-secret' },
        disabled_reason: 'fixture-reason-secret',
        auth_status: 'fixture-auth-secret',
      },
    ])
    const metadata = parseCodexMcpMetadata(stdout)
    expect(metadata).toEqual([{ name: 'fixture-mcp', enabled: expected }])
    expect(JSON.stringify(metadata)).not.toMatch(/secret|transport|disabled_reason|auth_status/)
  })

  it.each(['', '[{oops', '{}', 'null', 'MCP servers: fixture-mcp'])('%j is unknown', (stdout) => {
    expect(parseCodexMcpMetadata(stdout)).toBeNull()
  })

  it('empty listing is known empty, while invalid entries expose no extra fields', () => {
    expect(parseCodexMcpMetadata('[]')).toEqual([])
    expect(parseCodexMcpMetadata('[null,{},1,{"name":""},{"name":"ok"}]')).toEqual([
      { name: 'ok', enabled: null },
    ])
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
    vi.stubEnv('TAVILY_API_KEY', '')
    vi.stubEnv('EXA_API_KEY', '')
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

  it('disabled stays registered through both installer APIs without an add or enable command', async () => {
    runHarnessArgs.mockResolvedValue({ exitCode: 0, stdout: JSON_OUT, stderr: '' })
    expect(await isCodexMcpServerRegistered('exa-mcp-http')).toBe(true)
    expect(await isMcpServerRegistered('exa-mcp-http')).toBe(true)
    expect(await listCodexMcpServers()).toEqual(new Set(['tavily-mcp', 'exa-mcp-http']))
    expect(runHarnessArgs).toHaveBeenCalledTimes(1)
    expect(runHarnessArgs.mock.calls[0]?.slice(0, 2)).toEqual(['codex', ['mcp', 'list', '--json']])
  })

  it.each([
    ['true', { enabled: true }, /enabled/i],
    ['false', { enabled: false }, /disabled/i],
    ['absent', {}, /enablement[^;.]*(?:unknown|not verified)/i],
    ['null', { enabled: null }, /enablement[^;.]*(?:unknown|not verified)/i],
    ['nonboolean', { enabled: 'false' }, /enablement[^;.]*(?:unknown|not verified)/i],
  ])('doctor preserves %s enablement metadata instead of reducing it to registration', async (_label, fields, state) => {
    vi.stubEnv('TAVILY_API_KEY', 'fixture-key-tavily')
    vi.stubEnv('EXA_API_KEY', 'fixture-key-exa')
    runHarnessArgs.mockResolvedValue({
      exitCode: 0,
      stdout: JSON.stringify([
        { name: 'tavily-mcp', ...fields },
        { name: 'exa-mcp', ...fields },
      ]),
      stderr: '',
    })
    const r = await checkMcpAvailability()
    expect.soft(r.status).toBe('warn')
    expect.soft(r.message).toMatch(/registered[^;]*tavily-mcp/)
    expect.soft(r.message).toMatch(state)
    expect(r.fix ?? '').not.toMatch(/harnessed setup|mcp add|install/i)
    expect(await isMcpServerRegistered('exa-mcp')).toBe(true)
    expect(runHarnessArgs).toHaveBeenCalledTimes(1)
  })

  it('doctor and legacy set/boolean consumers share one concurrent cached listing', async () => {
    runHarnessArgs.mockResolvedValue({ exitCode: 0, stdout: JSON_OUT, stderr: '' })
    const [names, registered, doctor, metadata] = await Promise.all([
      listCodexMcpServers(),
      isCodexMcpServerRegistered('exa-mcp-http'),
      checkMcpAvailability(),
      listCodexMcpServerMetadata(),
    ])
    expect(names).toEqual(new Set(['tavily-mcp', 'exa-mcp-http']))
    expect(metadata).toEqual([
      { name: 'tavily-mcp', enabled: true },
      { name: 'exa-mcp-http', enabled: false },
    ])
    expect(registered).toBe(true)
    expect(doctor.status).toBe('warn')
    expect(runHarnessArgs).toHaveBeenCalledTimes(1)
    expect(runHarnessArgs.mock.calls[0]?.slice(0, 2)).toEqual(['codex', ['mcp', 'list', '--json']])
  })

  it('cache invalidation refreshes enablement and registration together', async () => {
    runHarnessArgs.mockResolvedValueOnce({
      exitCode: 0,
      stdout: '[{"name":"tavily-mcp","enabled":false},{"name":"exa-mcp","enabled":false}]',
      stderr: '',
    })
    runHarnessArgs.mockResolvedValueOnce({
      exitCode: 0,
      stdout: '[{"name":"tavily-mcp","enabled":true}]',
      stderr: '',
    })
    const before = await checkMcpAvailability()
    expect.soft(before.message).toMatch(/disabled/i)
    expect(await listCodexMcpServerMetadata()).toEqual([
      { name: 'tavily-mcp', enabled: false },
      { name: 'exa-mcp', enabled: false },
    ])
    expect(await isCodexMcpServerRegistered('exa-mcp')).toBe(true)
    expect(runHarnessArgs).toHaveBeenCalledTimes(1)
    invalidateCodexMcpCache()
    const after = await checkMcpAvailability()
    expect.soft(after.message).toMatch(/enabled/i)
    expect(after.message).toMatch(/not registered[^;]*exa-mcp/)
    expect(await listCodexMcpServers()).toEqual(new Set(['tavily-mcp']))
    expect(await listCodexMcpServerMetadata()).toEqual([{ name: 'tavily-mcp', enabled: true }])
    expect(runHarnessArgs).toHaveBeenCalledTimes(2)
  })

  it('transport, env, auth status and disabled reason never escape into doctor or legacy names', async () => {
    const sensitive = {
      transport: {
        type: 'streamable_http',
        url: 'https://fixture.invalid/?token=fixture-url-secret',
        env: { TAVILY_API_KEY: 'fixture-env-secret' },
        bearer_token: 'fixture-bearer-secret',
      },
      disabled_reason: 'fixture-reason-secret',
      auth_status: 'fixture-auth-secret',
    }
    runHarnessArgs.mockResolvedValue({
      exitCode: 0,
      stdout: JSON.stringify([
        { name: 'tavily-mcp', enabled: false, ...sensitive },
        { name: 'exa-mcp', enabled: true, ...sensitive },
      ]),
      stderr: 'fixture-stderr-secret',
    })
    const r = await checkMcpAvailability()
    const names = await listCodexMcpServers()
    const metadata = await listCodexMcpServerMetadata()
    expect(names).toEqual(new Set(['tavily-mcp', 'exa-mcp']))
    expect(metadata).toEqual([
      { name: 'tavily-mcp', enabled: false },
      { name: 'exa-mcp', enabled: true },
    ])
    const rendered = JSON.stringify({ doctor: r, names: [...(names ?? [])], metadata })
    expect(rendered).not.toMatch(/fixture-(?:url|env|bearer|reason|auth|stderr)-secret/)
    expect(rendered).not.toMatch(/transport|disabled_reason|auth_status|bearer_token/)
    expect.soft(r.message).toMatch(/disabled/i)
    expect.soft(r.message).toMatch(/authentication[^;.]*(?:not verified|unverified)/i)
    expect.soft(r.message).toMatch(/approval[^;.]*(?:not probed|unknown)/i)
    expect.soft(r.message).toMatch(/runtime availability[^;.]*(?:not verified|unverified)/i)
    expect(opened.filter((p) => /(?:config\.toml|auth\.json)$/.test(p))).toEqual([])
  })

  it.each([
    ['missing CLI', -1, ''],
    ['malformed listing', 0, '[fixture-json-secret'],
    ['object listing', 0, '{"servers":[]}'],
  ])('%s keeps legacy null/false but doctor registration unknown without setup advice', async (_label, exitCode, stdout) => {
    runHarnessArgs.mockResolvedValue({ exitCode, stdout, stderr: 'fixture-error-secret' })
    expect(await listCodexMcpServerMetadata()).toBeNull()
    expect(await listCodexMcpServers()).toBeNull()
    expect(await isCodexMcpServerRegistered('tavily-mcp')).toBe(false)
    const r = await checkMcpAvailability()
    expect(r.status).toBe('warn')
    expect.soft(r.message).toMatch(/registration[^;.]*(?:unknown|not verified)/i)
    expect.soft(r.message).not.toMatch(/not registered/i)
    expect.soft(r.fix ?? '').not.toMatch(/harnessed setup|install|mcp add/i)
    expect(JSON.stringify(r)).not.toMatch(/fixture-(?:json|error)-secret/)
    expect(runHarnessArgs).toHaveBeenCalledTimes(1)
    expect(opened.filter((p) => /(?:config\.toml|auth\.json)$/.test(p))).toEqual([])
  })

  it('a rejected listing stays unknown and cached without leaking the error', async () => {
    runHarnessArgs.mockRejectedValue(new Error('fixture-runtime-secret'))
    const [metadata, names, doctor] = await Promise.all([
      listCodexMcpServerMetadata(),
      listCodexMcpServers(),
      checkMcpAvailability(),
    ])
    expect(metadata).toBeNull()
    expect(names).toBeNull()
    expect(doctor.status).toBe('warn')
    expect(doctor.message).toMatch(/registration unknown/)
    expect(doctor.fix).toBeUndefined()
    expect(JSON.stringify(doctor)).not.toContain('fixture-runtime-secret')
    expect(runHarnessArgs).toHaveBeenCalledTimes(1)
  })
})
