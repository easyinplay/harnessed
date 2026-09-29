// v16.0 Phase 66 T2/T3 — `codex exec` subprocess spawn (the CI / headless face).
//
// Every test mocks the child process. `codex exec` is NEVER really run here: it
// costs quota and is nondeterministic. The measured contract this file encodes
// lives in .planning/phases/66-codex-spawn-agents-goal/findings.md F5-F8.
//
// The two load-bearing measurements:
//   F5 — Windows must spawn shell-less against an absolute path, and
//        `--skip-git-repo-check` is mandatory.
//   F6/F8 — exit code 0 does NOT mean success. A sandbox rejection and an
//        unknown agent role both exit 0. Success is judged from the `-o`
//        last-message file plus the JSONL event stream.

import { EventEmitter } from 'node:events'
import { readFileSync, writeFileSync } from 'node:fs'
import { PassThrough } from 'node:stream'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { AgentDefinition } from '../../src/workflow/lib/agentDefinition.js'
import {
  type CodexExecObservation,
  type CodexExecProcess,
  type CodexSpawnRequest,
  classifyCodexExec,
  codexExecSpawn,
  DEFAULT_CODEX_SANDBOX,
  HostNotCodexError,
} from '../../src/workflow/lib/codexExecSpawn.js'

// ---- fixtures -------------------------------------------------------------

const def: AgentDefinition = {
  description: 'phase expert',
  prompt: 'BASE PROMPT',
  maxTurns: 7,
}

const THREAD_ID = '01a0ed97-08d3-7462-923a-b3dedec05903'

const okEvents = (): string[] => [
  JSON.stringify({ type: 'thread.started', thread_id: THREAD_ID }),
  JSON.stringify({ type: 'turn.started' }),
  JSON.stringify({ type: 'item.completed', item: { id: 'item_0', type: 'agent_message' } }),
  JSON.stringify({ type: 'turn.completed' }),
]

const obs = (over: Partial<CodexExecObservation> = {}): CodexExecObservation => ({
  exitCode: 0,
  signal: null,
  events: okEvents().map((l) => JSON.parse(l)),
  garbageLines: 0,
  stderr: '',
  lastMessage: '<promise>COMPLETE</promise>',
  ...over,
})

// ---- fake child process ---------------------------------------------------

interface FakeOpts {
  stdout?: string[]
  stderr?: string
  exitCode?: number | null
  signal?: string | null
  /** written to the path that follows `-o` in argv; null → leave it absent. */
  outFile?: string | null
  /** never ends, never exits — exercises the wall-clock timeout. */
  hang?: boolean
  /** emit an 'error' event instead of running (ENOENT etc.). */
  spawnError?: string
}

let requests: CodexSpawnRequest[] = []
let killed = 0
let script: FakeOpts[] = []

function fakeSpawn(req: CodexSpawnRequest): CodexExecProcess {
  requests.push(req)
  const plan = script.shift() ?? {}
  const stdout = new PassThrough()
  const stderr = new PassThrough()
  const ev = new EventEmitter()
  const proc = {
    stdout,
    stderr,
    kill: () => {
      killed += 1
    },
    on: (e: string, fn: (...a: unknown[]) => void) => ev.on(e, fn),
  } as unknown as CodexExecProcess

  setTimeout(() => {
    if (plan.spawnError) {
      ev.emit('error', new Error(plan.spawnError))
      return
    }
    if (plan.hang) return
    if (plan.outFile != null) {
      const i = req.args.indexOf('-o')
      writeFileSync(req.args[i + 1] as string, plan.outFile, 'utf8')
    }
    for (const line of plan.stdout ?? []) stdout.write(`${line}\n`)
    if (plan.stderr) stderr.write(plan.stderr)
    stdout.end()
    stderr.end()
    ev.emit('exit', plan.exitCode === undefined ? 0 : plan.exitCode, plan.signal ?? null)
  }, 0)
  return proc
}

const happyScript = (): FakeOpts[] => [
  { stdout: okEvents(), outFile: '<promise>COMPLETE</promise>', exitCode: 0 },
]

let savedPlatform: string | undefined

beforeEach(() => {
  requests = []
  killed = 0
  script = []
  savedPlatform = process.env.HARNESSED_PLATFORM
  process.env.HARNESSED_PLATFORM = 'codex'
})
afterEach(() => {
  if (savedPlatform === undefined) delete process.env.HARNESSED_PLATFORM
  else process.env.HARNESSED_PLATFORM = savedPlatform
})

// ---- the outbound boundary ------------------------------------------------

describe('host guard — codex exec is reachable only from a codex host', () => {
  it('throws HostNotCodexError when this process is a claude host', async () => {
    process.env.HARNESSED_PLATFORM = 'claude'
    script = happyScript()
    await expect(
      codexExecSpawn(def, { expertName: 'x' }, { spawn: fakeSpawn }),
    ).rejects.toBeInstanceOf(HostNotCodexError)
    expect(requests).toHaveLength(0)
  })

  it('runs when this process is a codex host', async () => {
    script = happyScript()
    await codexExecSpawn(def, { expertName: 'x' }, { spawn: fakeSpawn })
    expect(requests).toHaveLength(1)
  })
})

// ---- argv (F5) ------------------------------------------------------------

describe('argv', () => {
  it('uses the measured flag set with the prompt last', async () => {
    script = happyScript()
    await codexExecSpawn(def, { expertName: 'x' }, { spawn: fakeSpawn })
    const { args } = requests[0] as CodexSpawnRequest
    expect(args[0]).toBe('exec')
    expect(args).toContain('--ephemeral')
    expect(args).toContain('--json')
    expect(args).toContain('--skip-git-repo-check')
    expect(args).toContain('-o')
    expect(args[args.indexOf('-s') + 1]).toBe(DEFAULT_CODEX_SANDBOX)
    // F6 — leaf subtasks write files, so read-only would refuse every one of them.
    expect(DEFAULT_CODEX_SANDBOX).toBe('workspace-write')
    // The prompt is one argv token, never shell-split (F5 pitfall 1).
    expect(args[args.length - 1]).toContain('BASE PROMPT')
  })

  it('carries the 9 prompt-inject fields, same as the claude path', async () => {
    script = happyScript()
    await codexExecSpawn(def, { expertName: 'x' }, { spawn: fakeSpawn })
    const prompt = (requests[0] as CodexSpawnRequest).args.at(-1) as string
    expect(prompt).toContain('## Turn budget')
  })

  it('honours an explicit sandbox override and forwards cwd + env', async () => {
    script = happyScript()
    await codexExecSpawn(
      def,
      { expertName: 'x', sandbox: 'read-only', cwd: '/w', env: { HARNESSED_SUBSESSION: 'sub-1' } },
      { spawn: fakeSpawn },
    )
    const req = requests[0] as CodexSpawnRequest
    expect(req.args[req.args.indexOf('-s') + 1]).toBe('read-only')
    expect(req.cwd).toBe('/w')
    expect(req.env.HARNESSED_SUBSESSION).toBe('sub-1')
  })
})

// ---- envelope + thread id -------------------------------------------------

describe('envelope', () => {
  it('is the same shape sdkSpawn returns', async () => {
    script = happyScript()
    const raw = await codexExecSpawn(def, { expertName: 'x' }, { spawn: fakeSpawn })
    expect(JSON.parse(raw)).toEqual({
      subtype: 'success',
      text: '<promise>COMPLETE</promise>',
      result: '<promise>COMPLETE</promise>',
    })
  })

  it('promotes a schema-shaped last message into structured_output', async () => {
    const msg = JSON.stringify({ status: 'COMPLETE', summary: 'done' })
    script = [{ stdout: okEvents(), outFile: msg, exitCode: 0 }]
    const env = JSON.parse(await codexExecSpawn(def, { expertName: 'x' }, { spawn: fakeSpawn }))
    expect(env.structured_output).toEqual({ status: 'COMPLETE' })
    expect(env.subtype).toBe('success')
  })

  it('exposes thread.started.thread_id to the caller (F7)', async () => {
    script = happyScript()
    const seen: string[] = []
    await codexExecSpawn(
      def,
      { expertName: 'x', onThreadId: (id) => seen.push(id) },
      { spawn: fakeSpawn },
    )
    expect(seen).toEqual([THREAD_ID])
  })

  it('removes the temp output file when it is done', async () => {
    script = happyScript()
    await codexExecSpawn(def, { expertName: 'x' }, { spawn: fakeSpawn })
    const req = requests[0] as CodexSpawnRequest
    const outPath = req.args[req.args.indexOf('-o') + 1] as string
    expect(() => readFileSync(outPath, 'utf8')).toThrow()
  })
})

// ---- the five named failures ---------------------------------------------

describe('classifyCodexExec — the five named failures', () => {
  it('ok when the stream terminates and the last message is there', () => {
    expect(classifyCodexExec(obs())).toEqual({ ok: true, value: '<promise>COMPLETE</promise>' })
  })

  it('SpawnAuthFailed outranks the exit code', () => {
    const r = classifyCodexExec(obs({ exitCode: 1, stderr: 'ERROR: not logged in' }))
    expect(r).toMatchObject({ ok: false, failure: 'SpawnAuthFailed' })
  })

  it('SpawnExitNonZero for a plain non-zero exit', () => {
    const r = classifyCodexExec(obs({ exitCode: 2, stderr: 'usage: codex exec' }))
    expect(r).toMatchObject({ ok: false, failure: 'SpawnExitNonZero' })
  })

  it('SpawnExitNonZero for a signalled death', () => {
    const r = classifyCodexExec(obs({ exitCode: null, signal: 'SIGKILL' }))
    expect(r).toMatchObject({ ok: false, failure: 'SpawnExitNonZero' })
  })

  it('SpawnRefused when the sandbox rejects a tool call, though exit is 0 (F6)', () => {
    const r = classifyCodexExec(
      obs({
        exitCode: 0,
        stderr: 'error=exec_command failed: CreateProcess { message: "Rejected(\\"...',
        lastMessage: 'BLOCKED',
      }),
    )
    expect(r).toMatchObject({ ok: false, failure: 'SpawnRefused' })
  })

  it('SpawnRefused on an unknown agent role, though exit is 0 (F8)', () => {
    const events = [
      { type: 'thread.started', thread_id: THREAD_ID },
      { type: 'turn.started' },
      { type: 'item.started', item: { id: 'item_1', type: 'collab_tool_call' } },
      { type: 'turn.completed' },
    ]
    const r = classifyCodexExec(
      obs({ events, stderr: "unknown agent_type 'harnessed-missing'", lastMessage: 'sorry' }),
    )
    expect(r).toMatchObject({ ok: false, failure: 'SpawnRefused' })
  })

  it('SpawnRefused on an item that started and never completed (F8 event shape)', () => {
    const events = [
      { type: 'thread.started', thread_id: THREAD_ID },
      { type: 'turn.started' },
      { type: 'item.started', item: { id: 'item_1' } },
      { type: 'turn.completed' },
    ]
    const r = classifyCodexExec(obs({ events, lastMessage: 'partial' }))
    expect(r).toMatchObject({ ok: false, failure: 'SpawnRefused' })
  })

  it('SpawnOutputMalformed when the `-o` last message never appeared', () => {
    const r = classifyCodexExec(obs({ lastMessage: null }))
    expect(r).toMatchObject({ ok: false, failure: 'SpawnOutputMalformed' })
  })

  it('SpawnOutputMalformed when the event stream never terminated', () => {
    const events = [{ type: 'thread.started', thread_id: THREAD_ID }, { type: 'turn.started' }]
    const r = classifyCodexExec(obs({ events }))
    expect(r).toMatchObject({ ok: false, failure: 'SpawnOutputMalformed' })
  })

  it('SpawnOutputMalformed when stdout was not JSONL at all', () => {
    const r = classifyCodexExec(obs({ events: [], garbageLines: 3 }))
    expect(r).toMatchObject({ ok: false, failure: 'SpawnOutputMalformed' })
  })

  it('keeps Refused and Malformed separable — a refusal is never reported as malformed', () => {
    // structure broken AND a refusal signal present: the refusal is the more
    // informative verdict, so it wins. Malformed only fires with no refusal.
    const events = [{ type: 'thread.started', thread_id: THREAD_ID }, { type: 'turn.failed' }]
    const r = classifyCodexExec(obs({ events, lastMessage: null }))
    expect(r).toMatchObject({ ok: false, failure: 'SpawnRefused' })
  })
})

describe('codexExecSpawn failure propagation', () => {
  it('throws a classified error rather than a flattened string', async () => {
    script = [{ stdout: okEvents(), outFile: null, exitCode: 0 }]
    await expect(
      codexExecSpawn(def, { expertName: 'x' }, { spawn: fakeSpawn }),
    ).rejects.toMatchObject({ failure: 'SpawnOutputMalformed' })
  })

  it('reports a failed spawn (codex not on PATH) as SpawnExitNonZero', async () => {
    script = [{ spawnError: 'spawn codex ENOENT' }]
    await expect(
      codexExecSpawn(def, { expertName: 'x' }, { spawn: fakeSpawn }),
    ).rejects.toMatchObject({ failure: 'SpawnExitNonZero' })
  })
})

// ---- timeout + one retry --------------------------------------------------

describe('wall-clock timeout', () => {
  it('retries exactly once and then reports SpawnTimeout', async () => {
    script = [{ hang: true }, { hang: true }]
    await expect(
      codexExecSpawn(def, { expertName: 'x', timeoutMs: 25 }, { spawn: fakeSpawn }),
    ).rejects.toMatchObject({ failure: 'SpawnTimeout' })
    expect(requests).toHaveLength(2)
    expect(killed).toBe(2)
  })

  it('succeeds on the retry when the first attempt hangs', async () => {
    script = [{ hang: true }, ...happyScript()]
    const env = JSON.parse(
      await codexExecSpawn(def, { expertName: 'x', timeoutMs: 25 }, { spawn: fakeSpawn }),
    )
    expect(env.subtype).toBe('success')
    expect(requests).toHaveLength(2)
  })

  it('does not retry a non-timeout failure', async () => {
    script = [{ stdout: okEvents(), outFile: null, exitCode: 0 }, ...happyScript()]
    await expect(
      codexExecSpawn(def, { expertName: 'x', timeoutMs: 5_000 }, { spawn: fakeSpawn }),
    ).rejects.toMatchObject({ failure: 'SpawnOutputMalformed' })
    expect(requests).toHaveLength(1)
  })
})
