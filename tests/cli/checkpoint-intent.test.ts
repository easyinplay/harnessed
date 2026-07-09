// 4.22.0 T1 — `harnessed checkpoint intent <master>` (TDD red-first).
//
// The intent marker is the L1 anti-freestyle layer: the generated `/auto` command
// (and master SKILL.md) pre-executes `harnessed checkpoint intent auto` via CC's
// `!`cmd`` preprocessing, so the engine registers the invocation BEFORE the model
// decides anything. `checkpoint start` absorbs (clears) the intent; `status
// --recover` reports a pending intent; the per-turn inject bin nags while an
// intent is fresh and the ledger is unseeded.
//
// REAL state layer (workflowStore/state.ts) against a tmp HARNESSED_ROOT_OVERRIDE
// — the sibling tests/cli/checkpoint.test.ts factory-mocks state.js and adding
// mutateStore there would be a mock-export-gap trap; this file exercises the real
// persistence instead. Only engineHook is mocked (start's activatePhase writes
// checkpoint files we don't care about here).

import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Command } from 'commander'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../src/checkpoint/engineHook.js', () => ({
  activatePhase: vi.fn(async () => ({ checkpointPath: '/fake/cp.json' })),
  completePhase: vi.fn(async () => undefined),
}))

import { readStoreRaw } from '../../src/checkpoint/workflowStore.js'
import { registerCheckpoint } from '../../src/cli/checkpoint.js'

class ExitError extends Error {
  constructor(public code: number) {
    super(`process.exit(${code})`)
  }
}

async function runCli(argv: string[]): Promise<{ code: number; stdout: string; stderr: string }> {
  let stdout = ''
  let stderr = ''
  const exit = vi.spyOn(process, 'exit').mockImplementation((code?: number | string | null) => {
    throw new ExitError(typeof code === 'number' ? code : 0)
  })
  const log = vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
    stdout += `${args.map(String).join(' ')}\n`
  })
  const err = vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
    stderr += `${args.map(String).join(' ')}\n`
  })
  const program = new Command().exitOverride()
  registerCheckpoint(program)
  let code = 0
  try {
    await program.parseAsync(['node', 'harnessed', ...argv])
  } catch (e) {
    if (e instanceof ExitError) code = e.code
    else {
      code = 1
      stderr += `${(e as Error).message}\n`
    }
  } finally {
    exit.mockRestore()
    log.mockRestore()
    err.mockRestore()
  }
  return { code, stdout, stderr }
}

describe('checkpoint intent <master> (4.22.0 L1 anti-freestyle)', () => {
  let tmp: string
  beforeEach(() => {
    tmp = mkdtempSync(join(tmpdir(), 'intent-'))
    vi.stubEnv('HARNESSED_ROOT_OVERRIDE', join(tmp, 'harnessed'))
    // Pin the session id so activeKey is deterministic (this test process may run
    // under a real CC session that already carries the env).
    vi.stubEnv('CLAUDE_CODE_SESSION_ID', 'intent-test-session')
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    rmSync(tmp, { recursive: true, force: true })
  })

  it('records the intent under the session-scoped key and prints the banner (exit 0)', async () => {
    const r = await runCli(['checkpoint', 'intent', 'auto'])
    expect(r.code).toBe(0)
    expect(r.stdout).toContain('engine engaged')
    expect(r.stdout).toContain('harnessed gates auto')
    const store = await readStoreRaw()
    const keys = Object.keys(store.intents ?? {})
    expect(keys.length).toBe(1)
    expect(keys[0]).toContain('::intent-test-session')
    const entry = store.intents?.[keys[0] ?? '']
    expect(entry?.master).toBe('auto')
    expect(typeof entry?.ts).toBe('string')
  })

  it('checkpoint start absorbs (clears) the pending intent', async () => {
    await runCli(['checkpoint', 'intent', 'auto'])
    const before = await readStoreRaw()
    expect(Object.keys(before.intents ?? {}).length).toBe(1)
    const r = await runCli(['checkpoint', 'start', 'auto', '--plan', '{"fire":[],"skip":[]}'])
    expect(r.code).toBe(0)
    const after = await readStoreRaw()
    expect(Object.keys(after.intents ?? {}).length).toBe(0)
  })

  it('is fail-soft: any internal error still exits 0 with no stderr (pre-exec surface)', async () => {
    // Force the store write to fail: point the root at a path whose parent is a FILE.
    vi.stubEnv('HARNESSED_ROOT_OVERRIDE', join(tmp, 'not-a-dir-file', 'nested'))
    const { writeFileSync } = await import('node:fs')
    writeFileSync(join(tmp, 'not-a-dir-file'), 'block', 'utf8')
    const r = await runCli(['checkpoint', 'intent', 'auto'])
    expect(r.code).toBe(0)
    expect(r.stderr).toBe('')
  })

  it('rejects nothing loudly on a traversal-shaped master — silent exit 0 (fail-soft)', async () => {
    const r = await runCli(['checkpoint', 'intent', '../evil'])
    expect(r.code).toBe(0)
    expect(r.stderr).toBe('')
    const store = await readStoreRaw()
    expect(Object.keys(store.intents ?? {}).length).toBe(0)
  })

  it('status --recover reports a pending intent when the ledger is unseeded', async () => {
    await runCli(['checkpoint', 'intent', 'auto'])
    const { registerStatus } = await import('../../src/cli/status.js')
    let stdout = ''
    const log = vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      stdout += `${args.map(String).join(' ')}\n`
    })
    const program = new Command().exitOverride()
    registerStatus(program)
    await program.parseAsync(['node', 'harnessed', 'status', '--recover'])
    log.mockRestore()
    expect(stdout).toContain('intent pending: /auto')
    expect(stdout).toContain('no ledger')
  })
})
