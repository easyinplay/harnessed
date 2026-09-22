// v16.0 Phase 64 T3 — codex hook trust client (app-server JSON-RPC).
//
// Protocol measured on codex-cli 0.155.1 (isolated CODEX_HOME): initialize →
// `initialized` notification → hooks/list {cwds} → config/batchWrite
// {edits:[{keyPath:'hooks.state', value:{<key>:{trusted_hash}}, mergeStrategy:'upsert'}]}.
// Deletion = value null on the quoted key path `hooks.state."<key>"` (codex-rs
// app-server config_manager_service clear_path). An unknown method answers
// -32600 "unknown variant" (not -32601). Four outcome states are asserted with a
// mock process: success / method missing / timeout / non-JSON output. Only
// `harnessed-*@harnessed-local` keys may ever be touched.

import { EventEmitter } from 'node:events'
import { PassThrough } from 'node:stream'
import { describe, expect, it } from 'vitest'
import {
  type AppServerProcess,
  isHarnessedHookKey,
  listCodexHooks,
  trustCodexHooks,
  untrustCodexHooks,
} from '../../src/installers/lib/codexHookTrust.js'

type Handler = (
  method: string,
  params: unknown,
) => unknown | { __error: { code: number; message: string } } | 'hang'

/** A fake `codex app-server`: newline-delimited JSON-RPC over stdio. */
function fakeServer(handler: Handler, opts: { garbage?: boolean } = {}) {
  const calls: { method: string; params: unknown }[] = []
  const spawn = (): AppServerProcess => {
    const stdin = new PassThrough()
    const stdout = new PassThrough()
    const proc = Object.assign(new EventEmitter(), {
      stdin,
      stdout,
      kill: () => {
        stdout.end()
        return true
      },
    })
    let buf = ''
    stdin.setEncoding('utf8')
    stdin.on('data', (chunk: string) => {
      buf += chunk
      let i = buf.indexOf('\n')
      while (i >= 0) {
        const line = buf.slice(0, i)
        buf = buf.slice(i + 1)
        i = buf.indexOf('\n')
        const msg = JSON.parse(line) as { id?: number; method: string; params: unknown }
        calls.push({ method: msg.method, params: msg.params })
        if (msg.id === undefined) continue // notification
        if (opts.garbage) {
          stdout.write('not json at all\n')
          stdout.end()
          continue
        }
        const r = handler(msg.method, msg.params)
        if (r === 'hang') continue
        const body =
          r && typeof r === 'object' && '__error' in (r as object)
            ? { error: (r as { __error: unknown }).__error }
            : { result: r }
        stdout.write(`${JSON.stringify({ jsonrpc: '2.0', id: msg.id, ...body })}\n`)
      }
    })
    return proc as unknown as AppServerProcess
  }
  return { spawn, calls }
}

const HOOK = (key: string, trustStatus: string) => ({
  key,
  eventName: 'userPromptSubmit',
  trustStatus,
  currentHash: `sha256:${key.length}`,
  pluginId: key.split(':')[0],
  command: 'node "x/hook.cjs" inject-state --platform codex',
})

const OURS = 'harnessed-perturn-inject@harnessed-local:hooks/hooks.json:user_prompt_submit:0:0'
const OURS2 = 'harnessed-doc-discipline-gate@harnessed-local:hooks/hooks.json:pre_tool_use:0:0'
const THEIRS = 'warp@codex-warp:hooks/hooks.json:session_start:0:0'

function standard(hooks: unknown[]) {
  return (method: string) => {
    if (method === 'initialize') return { userAgent: 'x' }
    if (method === 'hooks/list') return { data: [{ cwd: '/', hooks, warnings: [], errors: [] }] }
    if (method === 'config/batchWrite') return { status: 'ok' }
    return { __error: { code: -32600, message: `Invalid request: unknown variant \`${method}\`` } }
  }
}

describe('isHarnessedHookKey — namespace guard', () => {
  it.each([
    [OURS, true],
    [OURS2, true],
    [THEIRS, false],
    ['harnessed-x@other-mkt:hooks/hooks.json:stop:0:0', false],
    ['evil@harnessed-local:hooks/hooks.json:stop:0:0', false],
    ['/home/u/.codex/hooks.json:stop:0:0', false],
  ])('%s → %s', (key, ok) => {
    expect(isHarnessedHookKey(key)).toBe(ok)
  })
})

describe('listCodexHooks', () => {
  it('success: initialize → initialized → hooks/list; entries flattened', async () => {
    const s = fakeServer(standard([HOOK(OURS, 'untrusted'), HOOK(THEIRS, 'modified')]))
    const r = await listCodexHooks({ spawn: s.spawn, cwd: '/tmp' })
    expect(r).toMatchObject({ ok: true })
    if (!r.ok) return
    expect(r.value.map((h) => [h.key, h.trustStatus])).toEqual([
      [OURS, 'untrusted'],
      [THEIRS, 'modified'],
    ])
    expect(s.calls.map((c) => c.method)).toEqual(['initialize', 'initialized', 'hooks/list'])
    expect(s.calls[2]?.params).toEqual({ cwds: ['/tmp'] })
  })

  it('method missing (older codex: -32600 unknown variant) → failure method-missing', async () => {
    const s = fakeServer((m) =>
      m === 'initialize'
        ? {}
        : { __error: { code: -32600, message: 'Invalid request: unknown variant `hooks/list`' } },
    )
    const r = await listCodexHooks({ spawn: s.spawn, cwd: '/' })
    expect(r).toMatchObject({ ok: false, failure: 'method-missing' })
  })

  it('-32601 is method-missing too', async () => {
    const s = fakeServer((m) =>
      m === 'initialize' ? {} : { __error: { code: -32601, message: 'Method not found' } },
    )
    expect(await listCodexHooks({ spawn: s.spawn, cwd: '/' })).toMatchObject({
      ok: false,
      failure: 'method-missing',
    })
  })

  it('timeout → failure timeout', async () => {
    const s = fakeServer((m) => (m === 'initialize' ? {} : 'hang'))
    const r = await listCodexHooks({ spawn: s.spawn, cwd: '/', timeoutMs: 50 })
    expect(r).toMatchObject({ ok: false, failure: 'timeout' })
  })

  it('non-JSON output → failure bad-output', async () => {
    const s = fakeServer(() => ({}), { garbage: true })
    const r = await listCodexHooks({ spawn: s.spawn, cwd: '/', timeoutMs: 2000 })
    expect(r).toMatchObject({ ok: false, failure: 'bad-output' })
  })

  it('spawn throws (codex missing) → failure spawn-failed', async () => {
    const r = await listCodexHooks({
      spawn: () => {
        throw new Error('ENOENT')
      },
      cwd: '/',
    })
    expect(r).toMatchObject({ ok: false, failure: 'spawn-failed' })
  })
})

describe('trustCodexHooks', () => {
  it('upserts ONLY untrusted/modified harnessed hooks of the requested plugins', async () => {
    const s = fakeServer(
      standard([HOOK(OURS, 'untrusted'), HOOK(OURS2, 'trusted'), HOOK(THEIRS, 'untrusted')]),
    )
    const r = await trustCodexHooks(
      ['harnessed-perturn-inject@harnessed-local', 'harnessed-doc-discipline-gate@harnessed-local'],
      { spawn: s.spawn, cwd: '/' },
    )
    expect(r).toEqual({ ok: true, value: { trusted: [OURS], already: [OURS2], missing: [] } })
    const write = s.calls.find((c) => c.method === 'config/batchWrite')
    expect(write?.params).toEqual({
      edits: [
        {
          keyPath: 'hooks.state',
          value: { [OURS]: { trusted_hash: `sha256:${OURS.length}` } },
          mergeStrategy: 'upsert',
        },
      ],
      reloadUserConfig: true,
    })
  })

  it('refuses a non-harnessed plugin id outright (never writes)', async () => {
    const s = fakeServer(standard([HOOK(THEIRS, 'untrusted')]))
    const r = await trustCodexHooks(['warp@codex-warp'], { spawn: s.spawn, cwd: '/' })
    expect(r).toMatchObject({ ok: false, failure: 'rpc-error' })
    expect(s.calls.some((c) => c.method === 'config/batchWrite')).toBe(false)
  })

  it('requested plugin has no listed hook → reported missing, nothing written', async () => {
    const s = fakeServer(standard([]))
    const r = await trustCodexHooks(['harnessed-perturn-inject@harnessed-local'], {
      spawn: s.spawn,
      cwd: '/',
    })
    expect(r).toEqual({
      ok: true,
      value: { trusted: [], already: [], missing: ['harnessed-perturn-inject@harnessed-local'] },
    })
    expect(s.calls.some((c) => c.method === 'config/batchWrite')).toBe(false)
  })

  it('batchWrite method missing → method-missing (caller reports hooks pending trust)', async () => {
    const s = fakeServer((m) => {
      if (m === 'initialize') return {}
      if (m === 'hooks/list') return { data: [{ hooks: [HOOK(OURS, 'untrusted')] }] }
      return { __error: { code: -32600, message: 'unknown variant `config/batchWrite`' } }
    })
    const r = await trustCodexHooks(['harnessed-perturn-inject@harnessed-local'], {
      spawn: s.spawn,
      cwd: '/',
    })
    expect(r).toMatchObject({ ok: false, failure: 'method-missing' })
  })
})

describe('untrustCodexHooks', () => {
  it('deletes each harnessed key via null on the quoted key path', async () => {
    const s = fakeServer(standard([]))
    const r = await untrustCodexHooks([OURS], { spawn: s.spawn, cwd: '/' })
    expect(r).toEqual({ ok: true, value: { removed: [OURS] } })
    const write = s.calls.find((c) => c.method === 'config/batchWrite')
    expect(write?.params).toEqual({
      edits: [{ keyPath: `hooks.state."${OURS}"`, value: null, mergeStrategy: 'replace' }],
      reloadUserConfig: true,
    })
  })

  it('filters out foreign keys (never deletes another tool’s trust)', async () => {
    const s = fakeServer(standard([]))
    const r = await untrustCodexHooks([THEIRS], { spawn: s.spawn, cwd: '/' })
    expect(r).toEqual({ ok: true, value: { removed: [] } })
    expect(s.calls.some((c) => c.method === 'config/batchWrite')).toBe(false)
  })
})
