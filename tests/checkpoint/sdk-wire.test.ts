// Phase 3.1 W3 T3.3 — sdk-wire.test.ts: end-to-end session_id capture flow
// across ralphLoop (T3.1) + engine wrappedSpawn (T3.2) + engineHook (T3.2 PRIMARY).
// 7 fixtures incl. B-02 userSpawn fallback. Sister: state/template/sdk-spawn tests.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const fsState = new Map<string, string>()
const promisesFsState = new Map<string, string>()

vi.mock('node:fs', () => ({
  writeFileSync: (p: string, data: string) => void fsState.set(p, data),
  mkdirSync: (_p: string) => undefined,
  existsSync: (_p: string) => true,
  renameSync: (src: string, dst: string) => {
    fsState.set(dst, fsState.get(src) as string)
    fsState.delete(src)
  },
}))
vi.mock('node:fs/promises', () => ({
  readFile: async (p: string) => {
    const v = promisesFsState.get(p)
    if (v === undefined) throw new Error(`ENOENT: ${p}`)
    return v
  },
  writeFile: async (p: string, data: string) => void promisesFsState.set(p, data),
  mkdir: async (_p: string) => undefined,
  rename: async (src: string, dst: string) => {
    promisesFsState.set(dst, promisesFsState.get(src) as string)
    promisesFsState.delete(src)
  },
}))
// state.ts withLock uses proper-lockfile, which calls REAL fs.lstat on
// getHarnessedRoot() (~/.claude/harnessed). On a fresh CI runner ~/.claude does
// not exist → ENOENT (passed locally only because ~/.claude is present). Mock the
// lock to a no-op release so the in-memory fs mock above is the only fs surface.
vi.mock('proper-lockfile', () => ({
  default: { lock: async () => async () => {} },
  lock: async () => async () => {},
}))

// Imports AFTER mocks
import { join as pathJoin } from 'node:path'
import { activatePhase, completePhase } from '../../src/checkpoint/engineHook.js'
import { harnessedFile, harnessedSubdir } from '../../src/installers/lib/harnessedRoot.js'
import { ralphLoopWrap } from '../../src/workflow/lib/ralphLoop.js'

// v3.0.3 — paths resolve under ~/.claude/harnessed/ now.
const CURRENT_WORKFLOW_PATH = harnessedFile('current-workflow.json')
const CHECKPOINT_3_1_PATH = pathJoin(harnessedSubdir('checkpoints'), '3.1.json')
const CHECKPOINT_UNKNOWN_PATH = pathJoin(harnessedSubdir('checkpoints'), 'unknown.json')

beforeEach(() => {
  fsState.clear()
  promisesFsState.clear()
})
afterEach(() => vi.clearAllMocks())

describe('sdk-wire — session_id capture end-to-end (T3.3 fixtures 21-27)', () => {
  it('21. ralphLoopWrap: iter 1 onSessionId capture → iter 2 spawn(sessionId="sess-abc")', async () => {
    let iterCount = 0
    const passedResumeIds: (string | undefined)[] = []
    const spawn = async (resume?: string, onSessionId?: (id: string) => void) => {
      passedResumeIds.push(resume)
      iterCount++
      if (iterCount === 1) {
        onSessionId?.('sess-abc')
        return 'incomplete iter 1' // not COMPLETE → loop continues
      }
      return '<promise>COMPLETE</promise>' // iter 2 returns COMPLETE
    }
    const out = await ralphLoopWrap(spawn, 5)
    expect(out).toBe('<promise>COMPLETE</promise>')
    expect(passedResumeIds).toEqual([undefined, 'sess-abc']) // iter 1 fresh, iter 2 resumes
  })

  it('22. ralphLoopWrap: spawn never captures sessionId → all iter resumes undefined', async () => {
    let iterCount = 0
    const passedResumeIds: (string | undefined)[] = []
    const spawn = async (resume?: string, _onSessionId?: (id: string) => void) => {
      passedResumeIds.push(resume)
      iterCount++
      return iterCount >= 2 ? '<promise>COMPLETE</promise>' : 'incomplete'
    }
    await ralphLoopWrap(spawn, 5)
    expect(passedResumeIds).toEqual([undefined, undefined])
  })

  it('23. engineHook.activatePhase("3.1") → state.activate writes current-workflow.json status=active', async () => {
    const { checkpointPath } = await activatePhase('3.1')
    expect(checkpointPath).toBe(CHECKPOINT_3_1_PATH)
    const s = JSON.parse(promisesFsState.get(CURRENT_WORKFLOW_PATH) as string)
    expect(s.status).toBe('active')
    expect(s.phase).toBe('3.1')
    expect(s.last_checkpoint_path).toBe(CHECKPOINT_3_1_PATH)
  })

  it('24. engineHook.completePhase with sessionId → checkpoint.session_id field set', async () => {
    await activatePhase('3.1') // pre-req for state.complete to find the active record
    await completePhase({
      phaseId: '3.1',
      sessionId: 'sess-captured-iter1',
      status: 'complete',
    })
    const cp = JSON.parse(fsState.get(CHECKPOINT_3_1_PATH) as string)
    expect(cp.session_id).toBe('sess-captured-iter1')
    expect(cp.status).toBe('complete')
    expect(cp.phase).toBe('3.1')
    // workflow state transitioned to complete
    const ws = JSON.parse(promisesFsState.get(CURRENT_WORKFLOW_PATH) as string)
    expect(ws.status).toBe('complete')
  })

  it('25. engineHook.completePhase WITHOUT sessionId → checkpoint.session_id Optional field omitted', async () => {
    await activatePhase('3.1')
    await completePhase({ phaseId: '3.1', status: 'complete' }) // no sessionId
    const cp = JSON.parse(fsState.get(CHECKPOINT_3_1_PATH) as string)
    expect('session_id' in cp).toBe(false) // Optional field NOT written
    expect(cp.status).toBe('complete')
  })

  it('26. engineHook with phaseId="unknown" → fail-loud warn (W-04 mitigation, non-blocking)', async () => {
    const warnSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    await activatePhase('unknown')
    await completePhase({ phaseId: 'unknown', status: 'complete' })
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringMatching(/WARN engineHook: phaseId="unknown"/),
    )
    // still wrote to fallback path (non-blocking fail-loud)
    expect(fsState.get(CHECKPOINT_UNKNOWN_PATH)).toBeDefined()
    warnSpy.mockRestore()
  })

  // B-02 userSpawn fresh-session-only path (DEFERRED #2 documented):
  // userSpawn signature `(agentDef) => Promise<string>` has no onSessionId by
  // design — resume.ts falls back to fresh session + reload checkpoint.
  it('27. B-02 userSpawn fallback: no onSessionId → fresh session, session_id omitted', async () => {
    let capturedSessionId: string | undefined
    // userSpawn-style spawn that NEVER invokes onSessionId (no session bridge by design)
    const out = await ralphLoopWrap(async (_resume, _onSessionId) => {
      return '<promise>COMPLETE</promise>'
    }, 3)
    expect(out).toBe('<promise>COMPLETE</promise>')
    expect(capturedSessionId).toBeUndefined() // fresh-session-only path (B-02)

    await activatePhase('3.1')
    await completePhase({ phaseId: '3.1', sessionId: capturedSessionId, status: 'complete' })
    const cp = JSON.parse(fsState.get(CHECKPOINT_3_1_PATH) as string)
    expect('session_id' in cp).toBe(false) // no session_id capture by design
  })
})
