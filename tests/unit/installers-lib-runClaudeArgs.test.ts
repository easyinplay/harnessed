// v4.14.0 T1 — runHarnessArgs: harness-CLI spawn 泛化 (claude | codex).
//
// Covers:
//   - runArgs (back-compat wrapper) spawns `claude` — Win via cmd.exe /c claude,
//     Unix direct binary
//   - runHarnessArgs('codex', ...) spawns `codex` with the same cross-OS shape
//   - codex ENOENT ('error' event, code ENOENT) → stderr carries the clear
//     "codex CLI not found on PATH" message (fail-loud per findings.md 锁定决策)
//   - stdin stays 'ignore' (v4.13.0 anti-hang posture preserved)

import { EventEmitter } from 'node:events'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('node:child_process', () => ({ spawn: vi.fn() }))

import { spawn } from 'node:child_process'
import { runArgs, runHarnessArgs } from '../../src/installers/lib/runClaudeArgs.js'

const spawnMock = vi.mocked(spawn)

interface FakeChild extends EventEmitter {
  stderr: EventEmitter & { setEncoding: (e: string) => unknown }
  kill: (sig: NodeJS.Signals) => void
}
function makeChild(opts: { exitCode?: number; errorCode?: string }): FakeChild {
  const child = new EventEmitter() as FakeChild
  const stderr = new EventEmitter() as FakeChild['stderr']
  stderr.setEncoding = () => stderr
  child.stderr = stderr
  child.kill = vi.fn() as unknown as FakeChild['kill']
  setImmediate(() => {
    if (opts.errorCode) {
      const e = new Error(`spawn ENOENT`) as NodeJS.ErrnoException
      e.code = opts.errorCode
      child.emit('error', e)
    } else {
      child.emit('close', opts.exitCode ?? 0)
    }
  })
  return child
}

describe('runHarnessArgs', () => {
  beforeEach(() => {
    spawnMock.mockReset()
  })

  it("runArgs spawns 'claude' (back-compat wrapper unchanged)", async () => {
    spawnMock.mockImplementation(
      () => makeChild({ exitCode: 0 }) as unknown as ReturnType<typeof spawn>,
    )
    const r = await runArgs(['mcp', 'list'], '/tmp')
    expect(r.exitCode).toBe(0)
    const flat = spawnMock.mock.calls
      .map((c) => `${String(c[0])} ${((c[1] ?? []) as string[]).join(' ')}`)
      .join('\n')
    expect(flat).toContain('claude')
    expect(flat).not.toContain('codex')
  })

  it("runHarnessArgs('codex') spawns 'codex' not 'claude'", async () => {
    spawnMock.mockImplementation(
      () => makeChild({ exitCode: 0 }) as unknown as ReturnType<typeof spawn>,
    )
    const r = await runHarnessArgs(
      'codex',
      ['mcp', 'add', 'x', '--', 'npx', '--yes', 'x@1'],
      '/tmp',
    )
    expect(r.exitCode).toBe(0)
    const flat = spawnMock.mock.calls
      .map((c) => `${String(c[0])} ${((c[1] ?? []) as string[]).join(' ')}`)
      .join('\n')
    expect(flat).toContain('codex')
    expect(flat).not.toContain('claude')
  })

  it('codex spawn ENOENT → clear "codex CLI not found on PATH" stderr message', async () => {
    spawnMock.mockImplementation(
      () => makeChild({ errorCode: 'ENOENT' }) as unknown as ReturnType<typeof spawn>,
    )
    const r = await runHarnessArgs('codex', ['mcp', 'list'], '/tmp')
    expect(r.exitCode).toBe(-1)
    expect(r.stderr).toContain('codex CLI not found on PATH')
  })

  it("stdin is 'ignore' for both bins (v4.13.0 anti-hang preserved)", async () => {
    spawnMock.mockImplementation(
      () => makeChild({ exitCode: 0 }) as unknown as ReturnType<typeof spawn>,
    )
    await runHarnessArgs('codex', ['mcp', 'list'], '/tmp')
    await runArgs(['mcp', 'list'], '/tmp')
    for (const call of spawnMock.mock.calls) {
      const opts = call[2] as { stdio?: string[] }
      expect(opts.stdio?.[0]).toBe('ignore')
    }
  })
})
