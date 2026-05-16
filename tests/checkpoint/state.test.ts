// Phase 3.1 W1 T1.4 — state.test.ts: 7 fixtures (7-13). vi.mock fs/promises
// sister Phase 2.2 sdk-spawn.test.ts pattern.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const fsState = new Map<string, string>()
const mkdirCalls: string[] = []

vi.mock('node:fs/promises', () => ({
  readFile: async (p: string) => {
    const v = fsState.get(p)
    if (v === undefined) throw new Error(`ENOENT: ${p}`)
    return v
  },
  writeFile: async (p: string, data: string) => void fsState.set(p, data),
  mkdir: async (p: string) => void mkdirCalls.push(p),
}))

import {
  activate,
  complete,
  pause,
  readCurrentWorkflow,
  WorkflowStateError,
  writeCurrentWorkflow,
} from '../../src/checkpoint/state.js'
import { SCHEMA_VERSIONS } from '../../src/types/schemaVersion.js'

const STATE_PATH = '.harnessed/current-workflow.json'

beforeEach(() => {
  fsState.clear()
  mkdirCalls.length = 0
})
afterEach(() => vi.clearAllMocks())

const parseState = () => JSON.parse(fsState.get(STATE_PATH) as string)

describe('state — 3-state machine (T1.4 fixtures 7-13)', () => {
  it('7. activate(phase, path) writes status=active + started_at + creates parent dir', async () => {
    await activate('3.1', '.harnessed/checkpoints/3.1.json')
    const s = parseState()
    expect(s.status).toBe('active')
    expect(s.phase).toBe('3.1')
    expect(s.started_at).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    expect(s.last_checkpoint_path).toBe('.harnessed/checkpoints/3.1.json')
    expect(s.schemaVersion).toBe(SCHEMA_VERSIONS.currentWorkflow)
    expect(mkdirCalls).toContain('.harnessed')
  })

  it('8. pause() writes status=paused + paused_at + preserves started_at', async () => {
    await activate('3.1', null)
    const startedAt = parseState().started_at
    await pause()
    const s = parseState()
    expect(s.status).toBe('paused')
    expect(s.paused_at).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    expect(s.started_at).toBe(startedAt)
  })

  it('9. complete() writes status=complete + completed_at + preserves started_at', async () => {
    await activate('3.1', '.harnessed/checkpoints/3.1.json')
    const startedAt = parseState().started_at
    await complete()
    const s = parseState()
    expect(s.status).toBe('complete')
    expect(s.completed_at).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    expect(s.started_at).toBe(startedAt)
  })

  it('10. readCurrentWorkflow returns null on missing file', async () => {
    expect(await readCurrentWorkflow()).toBeNull()
  })

  it('11. readCurrentWorkflow returns null on corrupt JSON', async () => {
    fsState.set(STATE_PATH, '{not json')
    expect(await readCurrentWorkflow()).toBeNull()
  })

  it('12. readCurrentWorkflow returns null on unknown schemaVersion (CD-5 b)', async () => {
    fsState.set(
      STATE_PATH,
      JSON.stringify({ schemaVersion: 'harnessed.future-thing.v9', phase: '3.1' }),
    )
    expect(await readCurrentWorkflow()).toBeNull()
  })

  it('13. writeCurrentWorkflow throws WorkflowStateError on invalid input (empty phase)', async () => {
    const invalid = {
      schemaVersion: SCHEMA_VERSIONS.currentWorkflow,
      phase: '', // fails minLength: 1
      status: 'active' as const,
      last_checkpoint_path: null,
      started_at: '2026-05-16T10:00:00.000Z',
    }
    await expect(writeCurrentWorkflow(invalid)).rejects.toThrow(WorkflowStateError)
  })
})
