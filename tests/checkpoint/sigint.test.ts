// Phase 3.1 W4 T4.5 — sigint.test.ts: 5 fixtures (T4.1 SIGINT trap behavior).
// vi.mock template + state to isolate side effects. process.emit('SIGINT') drives handler.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// vi.mock is hoisted to top of file — use vi.hoisted() so mock fns init before mock factories run.
const { writeCheckpointMock, pauseMock } = vi.hoisted(() => ({
  writeCheckpointMock: vi.fn(),
  pauseMock: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../../src/checkpoint/template.js', () => ({
  writeCheckpoint: writeCheckpointMock,
}))
vi.mock('../../src/checkpoint/state.js', () => ({
  pause: pauseMock,
}))

import { registerSigintTrap, resetSigintTrap } from '../../src/checkpoint/sigintTrap.js'

class ExitError extends Error {
  constructor(public code: number) {
    super(`exit(${code})`)
  }
}

let stderrSpy: ReturnType<typeof vi.spyOn>
let exitCalls: number[]

// Swallow ExitError thrown by mocked process.exit in async .then/.catch chains — these
// trigger unhandledRejection after the test body returns even though the sync caller
// (the test) already captured the first throw. Logging-only filter to keep noise out.
function swallowExitErrorUnhandled(reason: unknown): void {
  if (reason instanceof ExitError) return
  // Re-throw non-ExitError as-is so genuine bugs still surface.
  throw reason
}

// Throw on EVERY exit (sync caller catches via try/catch). Async leftovers are
// drained + caught by the unhandledRejection swallower above.
function installExitSpy(): void {
  exitCalls = []
  vi.spyOn(process, 'exit').mockImplementation((c?: number | string | null) => {
    const code = typeof c === 'number' ? c : 0
    exitCalls.push(code)
    throw new ExitError(code)
  })
}

beforeEach(() => {
  resetSigintTrap()
  writeCheckpointMock.mockReset()
  pauseMock.mockReset().mockResolvedValue(undefined)
  // Remove pre-existing SIGINT listeners to isolate (avoid double-fire from prior test register).
  process.removeAllListeners('SIGINT')
  process.on('unhandledRejection', swallowExitErrorUnhandled)
  installExitSpy()
  stderrSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
})
afterEach(async () => {
  // Drain any pending microtasks from sigintTrap async chain before restoring mocks.
  await new Promise((r) => setImmediate(r))
  await new Promise((r) => setImmediate(r))
  process.off('unhandledRejection', swallowExitErrorUnhandled)
  vi.restoreAllMocks()
  process.removeAllListeners('SIGINT')
})

describe('sigintTrap — Phase 3.1 W4 T4.5 (fixtures 19-23)', () => {
  it('19. SIGINT → writeCheckpoint called with status="paused" + pause() called', async () => {
    registerSigintTrap(() => ({ phase: '3.1', sessionId: 'sess-1', lastTask: 'T4.1 ship' }))
    try {
      process.emit('SIGINT' as never)
    } catch (e) {
      if (!(e instanceof ExitError)) throw e
    }
    // async checkpoint write needs tick to resolve Promise.all
    await new Promise((r) => setImmediate(r))
    expect(writeCheckpointMock).toHaveBeenCalledTimes(1)
    const arg = writeCheckpointMock.mock.calls[0]?.[0]
    expect(arg).toBeDefined()
    expect(arg.status).toBe('paused')
    expect(arg.phase).toBe('3.1')
    expect(arg.session_id).toBe('sess-1')
    expect(arg.last_task).toBe('T4.1 ship')
    expect(pauseMock).toHaveBeenCalledTimes(1)
  })

  it('20. double SIGINT (isShuttingDown guard) → 2nd fire force-exits 130 without 2nd writeCheckpoint', async () => {
    registerSigintTrap(() => ({ phase: '3.1', lastTask: 'T4.x' }))
    // 1st SIGINT — sets isShuttingDown=true, schedules async write
    try {
      process.emit('SIGINT' as never)
    } catch (e) {
      if (!(e instanceof ExitError)) throw e
    }
    // 2nd SIGINT — should hit isShuttingDown guard + force exit 130
    let exitCode2 = -1
    try {
      process.emit('SIGINT' as never)
    } catch (e) {
      if (e instanceof ExitError) exitCode2 = e.code
    }
    expect(exitCode2).toBe(130)
    // confirm at least 1 force-quit error message logged
    expect(stderrSpy.mock.calls.flat().join('\n')).toMatch(/force quit/)
  })

  it('21. getActiveContext returns null → exits 130 silently without checkpoint write', () => {
    registerSigintTrap(() => null)
    let exitCode = -1
    try {
      process.emit('SIGINT' as never)
    } catch (e) {
      if (e instanceof ExitError) exitCode = e.code
    }
    expect(exitCode).toBe(130)
    expect(writeCheckpointMock).not.toHaveBeenCalled()
    expect(pauseMock).not.toHaveBeenCalled()
  })

  it('22. checkpoint write rejects → exits 1 + logs failure (fail-loud)', async () => {
    writeCheckpointMock.mockImplementationOnce(() => {
      throw new Error('disk full')
    })
    registerSigintTrap(() => ({ phase: '3.1', lastTask: 'T4.x' }))
    try {
      process.emit('SIGINT' as never)
    } catch (e) {
      if (!(e instanceof ExitError)) throw e
    }
    // wait for .catch to fire
    await new Promise((r) => setImmediate(r))
    await new Promise((r) => setImmediate(r))
    expect(stderrSpy.mock.calls.flat().join('\n')).toMatch(/checkpoint write failed/)
  })

  it('23. session_id absent → writeCheckpoint payload omits session_id key', async () => {
    registerSigintTrap(() => ({ phase: '3.1', lastTask: 'no-sid' }))
    try {
      process.emit('SIGINT' as never)
    } catch (e) {
      if (!(e instanceof ExitError)) throw e
    }
    await new Promise((r) => setImmediate(r))
    expect(writeCheckpointMock).toHaveBeenCalledTimes(1)
    const arg = writeCheckpointMock.mock.calls[0]?.[0]
    expect(arg).toBeDefined()
    expect('session_id' in arg).toBe(false)
  })
})
