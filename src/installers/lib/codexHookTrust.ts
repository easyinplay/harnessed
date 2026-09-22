// v16.0 Phase 64 (ADR 0041) — codex hook trust over `codex app-server` JSON-RPC.
//
// codex silently skips an untrusted / modified hook (measured). Trust lives in
// config.toml `[hooks.state."<key>"].trusted_hash`, which harnessed never writes
// itself: codex writes it through `config/batchWrite` — the same RPC its own TUI
// hook-review uses (codex-rs tui/src/hooks_rpc.rs). Protocol, measured on
// codex-cli 0.155.1 against an isolated CODEX_HOME:
//   initialize → `initialized` notification → hooks/list {cwds:[cwd]}
//     → data[].hooks[] {key, eventName, trustStatus, currentHash, pluginId, …}
//   config/batchWrite {edits:[{keyPath:'hooks.state', value:{<key>:{trusted_hash}},
//                             mergeStrategy:'upsert'}], reloadUserConfig:true}
//   delete = {keyPath:'hooks.state."<key>"', value:null} (config_manager_service clear_path)
//   unknown method → error -32600 "unknown variant `…`" (older servers: -32601)
//
// Namespace guard: only `harnessed-*@harnessed-local:` keys are ever written or
// deleted — trusting a hook is a security decision the user made for harnessed's
// own plugins, never for anyone else's.

import { type ChildProcess, spawn as nodeSpawn } from 'node:child_process'
import { homedir } from 'node:os'
import type { Readable, Writable } from 'node:stream'
import { killProcessTree } from './killTree.js'
import { planWindowsSpawn, resolveWindowsBin } from './winSpawn.js'

export interface AppServerProcess {
  stdin: Writable
  stdout: Readable
  kill: () => unknown
  on(event: 'error', fn: (e: Error) => void): unknown
  on(event: 'exit', fn: () => void): unknown
}

export interface TrustDeps {
  spawn?: () => AppServerProcess
  /** cwd reported to hooks/list (plugin hooks are global; any cwd lists them). */
  cwd?: string
  timeoutMs?: number
}

export interface CodexHookEntry {
  key: string
  eventName: string
  trustStatus: string
  currentHash: string
  pluginId?: string
  command?: string
}

export type TrustFailure =
  | 'method-missing'
  | 'timeout'
  | 'bad-output'
  | 'spawn-failed'
  | 'rpc-error'

export type RpcOutcome<T> =
  | { ok: true; value: T }
  | { ok: false; failure: TrustFailure; detail: string }

const HARNESSED_KEY = /^harnessed-[a-z0-9][a-z0-9-]*@harnessed-local:[^"\\]+$/
const HARNESSED_PLUGIN = /^harnessed-[a-z0-9][a-z0-9-]*@harnessed-local$/

export function isHarnessedHookKey(key: string): boolean {
  return HARNESSED_KEY.test(key)
}

/** `codex app-server` over stdio; Windows via the shared shim-aware planner. */
export function spawnCodexAppServer(): AppServerProcess {
  const args = ['app-server']
  let child: ChildProcess
  if (process.platform === 'win32') {
    const plan = planWindowsSpawn('codex', args, resolveWindowsBin('codex'))
    child = nodeSpawn(plan.command, plan.args, {
      windowsHide: true,
      stdio: ['pipe', 'pipe', 'ignore'],
      windowsVerbatimArguments: plan.verbatim,
    })
  } else {
    child = nodeSpawn('codex', args, { stdio: ['pipe', 'pipe', 'ignore'] })
  }
  return {
    stdin: child.stdin as Writable,
    stdout: child.stdout as Readable,
    kill: () => killProcessTree(child),
    on: ((event: string, fn: (...a: unknown[]) => void) =>
      child.on(event, fn)) as AppServerProcess['on'],
  }
}

class RpcError extends Error {
  constructor(
    public failure: TrustFailure,
    detail: string,
  ) {
    super(detail)
  }
}

/** One app-server session: sequential calls, every call bounded by timeoutMs. */
async function withAppServer<T>(
  deps: TrustDeps,
  body: (call: (method: string, params: unknown) => Promise<unknown>) => Promise<T>,
): Promise<RpcOutcome<T>> {
  let proc: AppServerProcess
  try {
    proc = (deps.spawn ?? spawnCodexAppServer)()
  } catch (e) {
    return { ok: false, failure: 'spawn-failed', detail: (e as Error).message }
  }
  const timeoutMs = deps.timeoutMs ?? 15_000
  const pending = new Map<number, { resolve: (v: unknown) => void; reject: (e: Error) => void }>()
  let sawGarbage = false
  let closed: RpcError | null = null
  const failAll = (e: RpcError) => {
    closed = closed ?? e
    for (const p of pending.values()) p.reject(e)
    pending.clear()
  }
  let buf = ''
  proc.stdout.setEncoding('utf8')
  proc.stdout.on('data', (chunk: string) => {
    buf += chunk
    for (let i = buf.indexOf('\n'); i >= 0; i = buf.indexOf('\n')) {
      const line = buf.slice(0, i).trim()
      buf = buf.slice(i + 1)
      if (!line) continue
      let msg: {
        id?: number
        method?: string
        result?: unknown
        error?: { code?: number; message?: string }
      }
      try {
        msg = JSON.parse(line)
      } catch {
        sawGarbage = true
        continue
      }
      if (msg.id === undefined || msg.method !== undefined) continue // notification / server request
      const p = pending.get(msg.id)
      if (!p) continue
      pending.delete(msg.id)
      if (msg.error) {
        const text = String(msg.error.message ?? '')
        const missing = msg.error.code === -32601 || /unknown variant/i.test(text)
        p.reject(new RpcError(missing ? 'method-missing' : 'rpc-error', text.slice(0, 300)))
      } else p.resolve(msg.result)
    }
  })
  const onGone = () =>
    failAll(
      new RpcError(
        sawGarbage ? 'bad-output' : 'spawn-failed',
        sawGarbage ? 'codex app-server wrote non-JSON output' : 'codex app-server exited',
      ),
    )
  proc.stdout.on('end', onGone)
  proc.on('exit', onGone)
  proc.on('error', (e) => failAll(new RpcError('spawn-failed', e.message)))

  let nextId = 1
  const send = (msg: object) => proc.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', ...msg })}\n`)
  const call = (method: string, params: unknown): Promise<unknown> => {
    if (closed) return Promise.reject(closed)
    const id = nextId++
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        pending.delete(id)
        reject(new RpcError('timeout', `${method} timed out after ${timeoutMs}ms`))
      }, timeoutMs)
      pending.set(id, {
        resolve: (v) => {
          clearTimeout(timer)
          resolve(v)
        },
        reject: (e) => {
          clearTimeout(timer)
          reject(e)
        },
      })
      send({ id, method, params })
    })
  }
  try {
    await call('initialize', { clientInfo: { name: 'harnessed', version: '0' } })
    send({ method: 'initialized', params: {} })
    return { ok: true, value: await body(call) }
  } catch (e) {
    if (e instanceof RpcError) return { ok: false, failure: e.failure, detail: e.message }
    return { ok: false, failure: 'bad-output', detail: (e as Error).message }
  } finally {
    try {
      proc.kill()
    } catch {
      /* already gone */
    }
  }
}

function parseHooks(result: unknown): CodexHookEntry[] {
  const data = (result as { data?: unknown } | null)?.data
  if (!Array.isArray(data)) throw new RpcError('bad-output', 'hooks/list: no data[]')
  const out: CodexHookEntry[] = []
  for (const d of data) {
    const hooks = (d as { hooks?: unknown } | null)?.hooks
    if (!Array.isArray(hooks)) continue
    for (const h of hooks as Record<string, unknown>[]) {
      if (typeof h?.key !== 'string') continue
      out.push({
        key: h.key,
        eventName: String(h.eventName ?? ''),
        trustStatus: String(h.trustStatus ?? 'unknown'),
        currentHash: String(h.currentHash ?? ''),
        ...(typeof h.pluginId === 'string' ? { pluginId: h.pluginId } : {}),
        ...(typeof h.command === 'string' ? { command: h.command } : {}),
      })
    }
  }
  return out
}

const listIn = (call: (m: string, p: unknown) => Promise<unknown>, cwd: string) =>
  call('hooks/list', { cwds: [cwd] }).then(parseHooks)

export function listCodexHooks(deps: TrustDeps = {}): Promise<RpcOutcome<CodexHookEntry[]>> {
  return withAppServer(deps, (call) => listIn(call, deps.cwd ?? homedir()))
}

/** Trust every not-yet-trusted hook of the given harnessed plugins (upsert). */
export async function trustCodexHooks(
  pluginIds: readonly string[],
  deps: TrustDeps = {},
): Promise<RpcOutcome<{ trusted: string[]; already: string[]; missing: string[] }>> {
  const foreign = pluginIds.filter((p) => !HARNESSED_PLUGIN.test(p))
  if (foreign.length > 0)
    return {
      ok: false,
      failure: 'rpc-error',
      detail: `refusing non-harnessed plugin(s): ${foreign.join(', ')}`,
    }
  return withAppServer(deps, async (call) => {
    const hooks = await listIn(call, deps.cwd ?? homedir())
    const ours = hooks.filter(
      (h) => isHarnessedHookKey(h.key) && pluginIds.some((p) => h.key.startsWith(`${p}:`)),
    )
    const todo = ours.filter((h) => h.trustStatus !== 'trusted' && h.currentHash)
    const missing = pluginIds.filter((p) => !ours.some((h) => h.key.startsWith(`${p}:`)))
    if (todo.length > 0) {
      await call('config/batchWrite', {
        edits: [
          {
            keyPath: 'hooks.state',
            value: Object.fromEntries(todo.map((h) => [h.key, { trusted_hash: h.currentHash }])),
            mergeStrategy: 'upsert',
          },
        ],
        reloadUserConfig: true,
      })
    }
    return {
      trusted: todo.map((h) => h.key),
      already: ours.filter((h) => h.trustStatus === 'trusted').map((h) => h.key),
      missing,
    }
  })
}

/** Remove harnessed trust entries (foreign keys are silently dropped from the set). */
export async function untrustCodexHooks(
  keys: readonly string[],
  deps: TrustDeps = {},
): Promise<RpcOutcome<{ removed: string[] }>> {
  const ours = [...new Set(keys.filter(isHarnessedHookKey))]
  if (ours.length === 0) return { ok: true, value: { removed: [] } }
  return withAppServer(deps, async (call) => {
    await call('config/batchWrite', {
      edits: ours.map((k) => ({
        keyPath: `hooks.state."${k}"`,
        value: null,
        mergeStrategy: 'replace',
      })),
      reloadUserConfig: true,
    })
    return { removed: ours }
  })
}
