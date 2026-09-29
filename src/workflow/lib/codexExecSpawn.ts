// v16.0 Phase 66 T2 — spawn a subagent through `codex exec`.
//
// This is NOT "sdkSpawn with a codex branch". The two are different mechanisms
// that share only their two ends (task_plan R2):
//
//   claude  in-process  `query()` from @anthropic-ai/claude-agent-sdk
//   codex   subprocess  `codex exec --ephemeral --json -o <file> …`
//
// Shared input  : `AgentDefinition` (+ the same 9 prompt-inject fields).
// Shared output : the `SdkResultEnvelope` JSON string that
//                 `lib/ralphLoop.ts#isComplete` consumes. `structured_output`
//                 is simply absent on this path unless the model happened to
//                 answer in the completion schema — codex exec has no
//                 `outputFormat`, so layer 2 (`<promise>COMPLETE</promise>`)
//                 is the normal signal here.
//
// WHAT THIS PATH IS FOR (task_plan R3): the CI / headless face. `harnessed run`
// inside a live host session is already gated off by `isNestedHarnessContext()`
// (src/cli/run.ts). The interactive face was covered in Phase 65 by rendering
// the host's own spawn primitive into the SKILL.md body. Do not wire this into
// an interactive path.
//
// MEASURED CONTRACT (codex-cli 0.155.1, Windows — findings.md F5-F8):
//   * `shell: false` + an absolute path. With a shell the prompt is re-split on
//     spaces and codex answers `error: unexpected argument 'with' found`.
//   * `--skip-git-repo-check` is mandatory outside a git worktree.
//   * `--ephemeral` instead of an isolated CODEX_HOME: isolating the home means
//     no auth.json, which means not authenticated. Never move CODEX_HOME here.
//   * default sandbox is `workspace-write`: leaf subtasks write files, and
//     `read-only` turns every one of them into a SpawnRefused.
//   * exit code 0 proves NOTHING. A sandbox rejection (F6) and an unknown agent
//     role (F8) both exit 0. Success is judged from the `-o` last message plus
//     the JSONL event stream — see `classifyCodexExec`.
//   * stderr prints `Reading additional input from stdin...` even with stdin
//     ignored. It is noise, not an error.

import { type ChildProcess, spawn as nodeSpawn } from 'node:child_process'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { Readable } from 'node:stream'
import { toHostId } from '../../cli/lib/hostPrimitives.js'
import { killProcessTree } from '../../installers/lib/killTree.js'
import { planWindowsSpawn, resolveWindowsBin } from '../../installers/lib/winSpawn.js'
import { detectPlatform } from '../../platform/platform.js'
import type { AgentDefinition } from './agentDefinition.js'
import type { CompletionStatus, SdkResultEnvelope } from './completionSchema.js'
import { injectFactoryInternalFields } from './sdkReconcile.js'
import {
  isRetryableSpawnFailure,
  type SpawnFailure,
  SpawnFailureError,
  type SpawnOutcome,
} from './spawnFailure.js'
import { envSpawnTimeoutMs } from './spawnTimeout.js'

// ---------------------------------------------------------------- public API

export type CodexSandbox = 'read-only' | 'workspace-write' | 'danger-full-access'

/** F6: leaf subtasks write files, so `read-only` would refuse all of them.
 *  Callers can override per spawn; the override is part of the public API on
 *  purpose (a caller that only reads should pin `read-only`). */
export const DEFAULT_CODEX_SANDBOX: CodexSandbox = 'workspace-write'

export interface CodexExecSpawnOpts {
  /** Subagent / phase name. Carried for parity with SdkSpawnOpts and used in
   *  failure details; `codex exec` cannot select an agent role (F2), the role
   *  lives in the prompt text. */
  expertName: string
  /** Wall-clock cap for ONE attempt. Defaults to HARNESSED_SPAWN_TIMEOUT_MS or
   *  DEFAULT_SPAWN_TIMEOUT_MS; 0 disables. */
  timeoutMs?: number
  sandbox?: CodexSandbox
  cwd?: string
  /** `-m` model override; omitted → codex's own default. */
  model?: string
  /** Extra environment for the child. F7 measured that variables injected here
   *  reach the sub-session's hook processes verbatim, which is how harnessed
   *  recognises "this hook event came from a session I spawned". */
  env?: Record<string, string>
  /** Fired with `thread.started.thread_id`, the FIRST event of the `--json`
   *  stream, so the caller has the id before the sub-session finishes.
   *
   *  F7 measured it equal to the `session_id` on that sub-session's hook stdin.
   *  Deliberately NOT named `onSessionId` like the claude path: `--ephemeral`
   *  persists no session, so this id can never be fed back as a resume token. */
  onThreadId?: (threadId: string) => void
}

/** The subset of ChildProcess this module uses — the test seam. */
export interface CodexExecProcess {
  stdout: Readable
  stderr: Readable
  kill: () => unknown
  on(event: 'error', fn: (e: Error) => void): unknown
  on(event: 'exit', fn: (code: number | null, signal: string | null) => void): unknown
}

/** One planned spawn. A single object so a test can assert argv, cwd and env
 *  without re-deriving the platform-specific call shape. */
export interface CodexSpawnRequest {
  command: string
  args: string[]
  cwd?: string
  env: NodeJS.ProcessEnv
  /** Windows-only: args are pre-escaped for a .cmd shim and must not be requoted. */
  windowsVerbatimArguments: boolean
}

export interface CodexExecDeps {
  spawn?: (req: CodexSpawnRequest) => CodexExecProcess
}

/** Raised when a non-codex host reaches this module. Not one of the five spawn
 *  failures: it is a wiring bug, not a run that went wrong. */
export class HostNotCodexError extends Error {
  constructor(hostId: string) {
    super(
      `codexExecSpawn is reachable only from a codex host (this process resolved to '${hostId}'). ` +
        'A claude host never launches codex on its own — that is the v16.0 outbound boundary.',
    )
    this.name = 'HostNotCodexError'
  }
}

// ------------------------------------------------------------ the judge (T3)

/** One codex JSONL event. Only the fields the judge reads are named. */
export interface CodexEvent {
  type?: string
  thread_id?: string
  item?: { id?: string; type?: string; status?: string }
}

/** Everything observable about one finished `codex exec`, with the process
 *  handling already done. Kept separate from the runner so the five-way
 *  classification is a pure function with pure tests. */
export interface CodexExecObservation {
  exitCode: number | null
  signal: string | null
  /** Parsed JSONL events in arrival order. */
  events: CodexEvent[]
  /** stdout lines that were not parseable JSON. */
  garbageLines: number
  stderr: string
  /** Contents of the `-o` file; null when it was never written. */
  lastMessage: string | null
}

const AUTH_PATTERNS: RegExp[] = [
  /not logged in/i,
  /\bunauthorized\b/i,
  /\b401\b/,
  /authentication (?:failed|required)/i,
  /\bcodex login\b/i,
  /auth\.json/i,
  /no (?:valid )?credentials/i,
]

/** Refusal signals are TOOL-LEVEL and structural on purpose. Model prose is
 *  never one: "blocked" in an answer is the completion gate's business
 *  (`isComplete` → PARTIAL/BLOCKED), not a spawn failure, and matching prose
 *  would misclassify any subagent that merely discusses blockers. */
const REFUSAL_PATTERNS: RegExp[] = [
  /Rejected\(/,
  /exec_command failed/i,
  /unknown agent_type/i,
  /sandbox (?:denied|rejected)/i,
]

function firstMatch(text: string, patterns: RegExp[]): RegExp | undefined {
  return patterns.find((p) => p.test(text))
}

/** An `item.started` with no matching `item.completed` — the measured shape of
 *  an unknown agent role (F8), on a turn that still exits 0. */
function hasDanglingItem(events: CodexEvent[]): boolean {
  const started = new Set<string>()
  for (const e of events) {
    const id = e.item?.id
    if (!id) continue
    if (e.type === 'item.started') started.add(id)
    if (e.type === 'item.completed') started.delete(id)
  }
  return started.size > 0
}

/**
 * The five-way verdict. Order is the whole design:
 *
 *   1. auth   — outranks the exit code, because it also exits non-zero.
 *   2. exit   — a non-zero exit or a signal is unambiguous failure.
 *   3. refused— a well-formed "cannot / will not", though exit was 0.
 *   4. malformed — structure missing AND no refusal to explain it.
 *
 * Steps 3 and 4 are mutually exclusive by construction, which is what makes
 * Refused and Malformed separable: Malformed is only ever reported when no
 * refusal signal was found.
 */
export function classifyCodexExec(o: CodexExecObservation): SpawnOutcome<string> {
  const corpus = [o.stderr, o.lastMessage ?? '', JSON.stringify(o.events)].join('\n')

  const auth = firstMatch(corpus, AUTH_PATTERNS)
  if (auth) {
    return {
      ok: false,
      failure: 'SpawnAuthFailed',
      detail: `codex exec is not authenticated (matched ${auth.source}). Run \`codex login\`.`,
    }
  }

  if (o.signal) {
    return { ok: false, failure: 'SpawnExitNonZero', detail: `killed by signal ${o.signal}` }
  }
  if (o.exitCode !== 0) {
    return {
      ok: false,
      failure: 'SpawnExitNonZero',
      detail: `codex exec exited ${o.exitCode}: ${o.stderr.trim().slice(0, 300)}`,
    }
  }

  const refusal = firstMatch(corpus, REFUSAL_PATTERNS)
  if (refusal) {
    return {
      ok: false,
      failure: 'SpawnRefused',
      detail: `codex exec refused the work (matched ${refusal.source}) — exit code was still 0`,
    }
  }
  if (o.events.some((e) => e.type === 'turn.failed')) {
    return { ok: false, failure: 'SpawnRefused', detail: 'codex reported turn.failed' }
  }
  if (hasDanglingItem(o.events)) {
    return {
      ok: false,
      failure: 'SpawnRefused',
      detail: 'an item.started never completed — the tool call was rejected (F8)',
    }
  }

  if (!o.events.some((e) => e.type === 'turn.completed')) {
    return {
      ok: false,
      failure: 'SpawnOutputMalformed',
      detail:
        o.events.length === 0 && o.garbageLines > 0
          ? `stdout was not JSONL (${o.garbageLines} unparseable lines)`
          : 'the JSONL stream never reached turn.completed',
    }
  }
  if (o.lastMessage === null || o.lastMessage.trim() === '') {
    return {
      ok: false,
      failure: 'SpawnOutputMalformed',
      detail: 'the -o last-message file was never written',
    }
  }

  return { ok: true, value: o.lastMessage }
}

// ------------------------------------------------------------------- runner

const COMPLETION_STATUSES: readonly string[] = ['COMPLETE', 'PARTIAL', 'BLOCKED']

/** `codex exec` has no `outputFormat`, so structured output is normally absent.
 *  When the model DID answer in the completion schema, promote it — that keeps
 *  the PRIMARY signal of `isComplete` reachable on this path instead of dead. */
function promoteStructuredOutput(lastMessage: string): SdkResultEnvelope['structured_output'] {
  const trimmed = lastMessage.trim()
  if (!trimmed.startsWith('{')) return undefined
  let parsed: unknown
  try {
    parsed = JSON.parse(trimmed)
  } catch {
    return undefined
  }
  const status = (parsed as { status?: unknown } | null)?.status
  if (typeof status !== 'string' || !COMPLETION_STATUSES.includes(status)) return undefined
  return { status: status as CompletionStatus }
}

function buildArgs(outPath: string, prompt: string, opts: CodexExecSpawnOpts): string[] {
  return [
    'exec',
    '--ephemeral',
    '--json',
    '-o',
    outPath,
    '-s',
    opts.sandbox ?? DEFAULT_CODEX_SANDBOX,
    ...(opts.model ? ['-m', opts.model] : []),
    '--skip-git-repo-check',
    prompt,
  ]
}

/** Windows resolves the absolute path and never goes through a shell (F5); a
 *  .cmd shim is the one case that must, and `planWindowsSpawn` handles it. */
function planRequest(args: string[], opts: CodexExecSpawnOpts): CodexSpawnRequest {
  const env = { ...process.env, ...(opts.env ?? {}) }
  if (process.platform === 'win32') {
    const plan = planWindowsSpawn('codex', args, resolveWindowsBin('codex'))
    return {
      command: plan.command,
      args: plan.args,
      env,
      windowsVerbatimArguments: plan.verbatim,
      ...(opts.cwd ? { cwd: opts.cwd } : {}),
    }
  }
  return {
    command: 'codex',
    args,
    env,
    windowsVerbatimArguments: false,
    ...(opts.cwd ? { cwd: opts.cwd } : {}),
  }
}

function realSpawn(req: CodexSpawnRequest): CodexExecProcess {
  const child: ChildProcess = nodeSpawn(req.command, req.args, {
    // `shell: false` is the default and must stay that way (F5 pitfall 1).
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: req.env,
    windowsVerbatimArguments: req.windowsVerbatimArguments,
    ...(req.cwd ? { cwd: req.cwd } : {}),
  })
  return {
    stdout: child.stdout as Readable,
    stderr: child.stderr as Readable,
    kill: () => killProcessTree(child),
    on: ((event: string, fn: (...a: unknown[]) => void) =>
      child.on(event, fn)) as CodexExecProcess['on'],
  }
}

/** Run the child to completion and report everything the judge needs. Resolves
 *  on process exit; rejects only on a spawn-level error or the wall clock. */
function runOnce(
  req: CodexSpawnRequest,
  spawnFn: (r: CodexSpawnRequest) => CodexExecProcess,
  timeoutMs: number,
  onThreadId?: (id: string) => void,
): Promise<Omit<CodexExecObservation, 'lastMessage'>> {
  return new Promise((resolve, reject) => {
    const events: CodexEvent[] = []
    let garbageLines = 0
    let stderr = ''
    let stdoutBuf = ''
    let threadSeen = false
    let settled = false
    let exited: { code: number | null; signal: string | null } | undefined
    let openStreams = 2
    let timer: ReturnType<typeof setTimeout> | undefined

    let proc: CodexExecProcess
    try {
      proc = spawnFn(req)
    } catch (e) {
      reject(new SpawnFailureError('SpawnExitNonZero', `spawn error: ${(e as Error).message}`))
      return
    }

    const finish = () => {
      if (settled || !exited || openStreams > 0) return
      settled = true
      clearTimeout(timer)
      resolve({ exitCode: exited.code, signal: exited.signal, events, garbageLines, stderr })
    }
    const fail = (err: Error) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      try {
        proc.kill()
      } catch {
        /* already gone */
      }
      reject(err)
    }

    proc.stdout.setEncoding('utf8')
    proc.stdout.on('data', (chunk: string) => {
      stdoutBuf += chunk
      for (let i = stdoutBuf.indexOf('\n'); i >= 0; i = stdoutBuf.indexOf('\n')) {
        const line = stdoutBuf.slice(0, i).trim()
        stdoutBuf = stdoutBuf.slice(i + 1)
        if (!line) continue
        let ev: CodexEvent
        try {
          ev = JSON.parse(line) as CodexEvent
        } catch {
          garbageLines += 1
          continue
        }
        events.push(ev)
        // First event of the stream — hand the id up before the run finishes.
        if (!threadSeen && ev.type === 'thread.started' && typeof ev.thread_id === 'string') {
          threadSeen = true
          onThreadId?.(ev.thread_id)
        }
      }
    })
    proc.stdout.on('end', () => {
      openStreams -= 1
      finish()
    })
    proc.stderr.setEncoding('utf8')
    proc.stderr.on('data', (chunk: string) => {
      stderr += chunk
    })
    proc.stderr.on('end', () => {
      openStreams -= 1
      finish()
    })
    proc.on('error', (e) =>
      fail(new SpawnFailureError('SpawnExitNonZero', `spawn error: ${e.message}`)),
    )
    proc.on('exit', (code, signal) => {
      exited = { code, signal }
      finish()
    })

    if (timeoutMs > 0) {
      timer = setTimeout(
        () =>
          fail(
            new SpawnFailureError(
              'SpawnTimeout',
              `codex exec exceeded its ${timeoutMs}ms wall-clock timeout (HARNESSED_SPAWN_TIMEOUT_MS)`,
            ),
          ),
        timeoutMs,
      )
    }
  })
}

/**
 * Spawn one subagent through `codex exec` and return the same JSON envelope
 * string `sdkSpawn` returns.
 *
 * Throws `SpawnFailureError` carrying one of the five named kinds; a timeout is
 * retried exactly once before it is reported (the only retryable kind, see
 * `isRetryableSpawnFailure`).
 *
 * The host guard sits HERE, at the module entry, rather than at a call site:
 * every future caller (a dispatcher, a test, a script) inherits it, and
 * "a claude host never launches codex" stops being something a caller can
 * forget. `detectPlatform()` honours `HARNESSED_PLATFORM`, which is also how a
 * test pins the host.
 */
export async function codexExecSpawn(
  def: AgentDefinition,
  opts: CodexExecSpawnOpts,
  deps: CodexExecDeps = {},
): Promise<string> {
  const hostId = toHostId(detectPlatform().id)
  if (hostId !== 'codex') throw new HostNotCodexError(hostId)

  const spawnFn = deps.spawn ?? realSpawn
  const timeoutMs = opts.timeoutMs ?? envSpawnTimeoutMs()
  // Same base + same 9 prompt-inject fields as the claude path: the two spawns
  // must be fed identically or the envelope parity is cosmetic.
  const prompt = injectFactoryInternalFields(def, def.prompt)

  const dir = await mkdtemp(join(tmpdir(), 'harnessed-codex-exec-'))
  try {
    let last: SpawnFailureError | undefined
    for (let attempt = 1; attempt <= 2; attempt++) {
      const outPath = join(dir, `last-message-${attempt}.txt`)
      const req = planRequest(buildArgs(outPath, prompt, opts), opts)
      let failure: SpawnFailure
      let detail: string
      try {
        const run = await runOnce(req, spawnFn, timeoutMs, opts.onThreadId)
        const verdict = classifyCodexExec({
          ...run,
          lastMessage: await readIfPresent(outPath),
        })
        if (verdict.ok) return toEnvelope(verdict.value)
        failure = verdict.failure
        detail = verdict.detail
      } catch (e) {
        if (!(e instanceof SpawnFailureError)) throw e
        failure = e.failure
        detail = e.message
      }
      last = new SpawnFailureError(failure, `${detail} [phase ${opts.expertName}]`)
      if (attempt === 2 || !isRetryableSpawnFailure(failure)) break
    }
    throw last as SpawnFailureError
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {})
  }
}

async function readIfPresent(path: string): Promise<string | null> {
  try {
    return await readFile(path, 'utf8')
  } catch {
    return null
  }
}

function toEnvelope(lastMessage: string): string {
  const structured = promoteStructuredOutput(lastMessage)
  const envelope: SdkResultEnvelope = {
    subtype: 'success',
    ...(structured ? { structured_output: structured } : {}),
    text: lastMessage,
    result: lastMessage,
  }
  return JSON.stringify(envelope)
}
