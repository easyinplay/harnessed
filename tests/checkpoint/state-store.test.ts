// Phase 15 — state.ts rewired to the per-repo multi-workflow store (behind-API).
// Verifies the anti-clobber isolation, null semantics, legacy migration
// persistence, single-lock RMW preservation, and the dual-write rollback anchor.
// Real fs + real proper-lockfile under tmpdir (sister: ledger-state.test.ts).

import { existsSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { CurrentWorkflowV1Type } from '../../src/checkpoint/schema/currentWorkflow.v1.js'
import {
  mutateSubProgress,
  readCurrentWorkflow,
  writeCurrentWorkflow,
} from '../../src/checkpoint/state.js'
import { repoKey } from '../../src/checkpoint/workflowStore.js'
import { SCHEMA_VERSIONS } from '../../src/types/schemaVersion.js'

const env = (
  phase: string,
  sub_progress?: CurrentWorkflowV1Type['sub_progress'],
): CurrentWorkflowV1Type => ({
  schemaVersion: SCHEMA_VERSIONS.currentWorkflow,
  phase,
  status: 'active',
  last_checkpoint_path: null,
  started_at: '2026-06-13T00:00:00.000Z',
  ...(sub_progress ? { sub_progress } : {}),
})

let tmp: string
let originalRoot: string | undefined
let originalCwd: string

beforeEach(async () => {
  tmp = mkdtempSync(join(tmpdir(), 'state-store-'))
  originalRoot = process.env.HARNESSED_ROOT_OVERRIDE
  process.env.HARNESSED_ROOT_OVERRIDE = join(tmp, 'root', '.claude', 'harnessed')
  await mkdir(join(tmp, 'root', '.claude', 'harnessed'), { recursive: true })
  originalCwd = process.cwd()
  mkdirSync(join(tmp, 'repoA', '.git'), { recursive: true })
  mkdirSync(join(tmp, 'repoB', '.git'), { recursive: true })
})
afterEach(() => {
  process.chdir(originalCwd)
  if (originalRoot === undefined) delete process.env.HARNESSED_ROOT_OVERRIDE
  else process.env.HARNESSED_ROOT_OVERRIDE = originalRoot
  rmSync(tmp, { recursive: true, force: true })
})

const storeFile = () => join(tmp, 'root', '.claude', 'harnessed', 'workflows.json')
const legacyFile = () => join(tmp, 'root', '.claude', 'harnessed', 'current-workflow.json')

describe('state.ts per-repo store (Phase 15)', () => {
  it('per-repo isolation — two repos coexist, neither clobbers the other', async () => {
    process.chdir(join(tmp, 'repoA'))
    await writeCurrentWorkflow(env('phaseA'))
    process.chdir(join(tmp, 'repoB'))
    await writeCurrentWorkflow(env('phaseB'))

    process.chdir(join(tmp, 'repoA'))
    expect((await readCurrentWorkflow())?.phase).toBe('phaseA')
    process.chdir(join(tmp, 'repoB'))
    expect((await readCurrentWorkflow())?.phase).toBe('phaseB')

    const store = JSON.parse(await readFile(storeFile(), 'utf8')) as {
      workflows: Record<string, { phase: string }>
    }
    expect(
      Object.values(store.workflows)
        .map((w) => w.phase)
        .sort(),
    ).toEqual(['phaseA', 'phaseB'])
  })

  it('null when the current repo has no slot', async () => {
    process.chdir(join(tmp, 'repoA'))
    expect(await readCurrentWorkflow()).toBeNull()
  })

  it('migration — legacy current-workflow.json read verbatim, persisted on first write, legacy retained', async () => {
    process.chdir(join(tmp, 'repoA'))
    await writeFile(legacyFile(), JSON.stringify(env('legacy-phase')), 'utf8')
    // read sees the legacy envelope (no store yet)
    expect((await readCurrentWorkflow())?.phase).toBe('legacy-phase')
    expect(existsSync(storeFile())).toBe(false)
    // first write persists the store under this repo's key
    await writeCurrentWorkflow(env('legacy-phase'))
    expect(existsSync(storeFile())).toBe(true)
    expect((await readCurrentWorkflow())?.phase).toBe('legacy-phase')
    // legacy file retained (rollback anchor)
    expect(existsSync(legacyFile())).toBe(true)
  })

  it('mutateSubProgress — single-lock RMW over the slot; no-op when unseeded', async () => {
    process.chdir(join(tmp, 'repoA'))
    // unseeded slot → no-op (no throw, stays null)
    await mutateSubProgress((e) => [...e, { sub: 'x', status: 'pending', gate_fired: true }])
    expect(await readCurrentWorkflow()).toBeNull()
    // seed then mutate
    await writeCurrentWorkflow(env('p', [{ sub: 'task-a', status: 'pending', gate_fired: true }]))
    await mutateSubProgress((e) =>
      e.map((x) => (x.sub === 'task-a' ? { ...x, status: 'done' as const } : x)),
    )
    const wf = await readCurrentWorkflow()
    expect(wf?.sub_progress?.[0]?.status).toBe('done')
  })

  it('dual-write — legacy current-workflow.json mirrors the current repo envelope (rollback anchor)', async () => {
    process.chdir(join(tmp, 'repoA'))
    await writeCurrentWorkflow(env('anchored'))
    const legacy = JSON.parse(await readFile(legacyFile(), 'utf8'))
    expect(legacy.phase).toBe('anchored')
  })
})

describe('state.ts session-scoped slot (Phase 34 — composite key)', () => {
  let originalSid: string | undefined
  beforeEach(() => {
    originalSid = process.env.CLAUDE_CODE_SESSION_ID
  })
  afterEach(() => {
    if (originalSid === undefined) delete process.env.CLAUDE_CODE_SESSION_ID
    else process.env.CLAUDE_CODE_SESSION_ID = originalSid
  })

  const readKeys = async () => {
    const store = JSON.parse(await readFile(storeFile(), 'utf8')) as {
      workflows: Record<string, unknown>
    }
    return Object.keys(store.workflows)
  }

  it('with a session id, read/write land in the <repoKey>::<sid> slot', async () => {
    process.chdir(join(tmp, 'repoA'))
    process.env.CLAUDE_CODE_SESSION_ID = 's1'
    await writeCurrentWorkflow(env('p-s1'))
    expect((await readCurrentWorkflow())?.phase).toBe('p-s1')
    expect(await readKeys()).toContain(`${repoKey()}::s1`)
  })

  it('without a session id, uses the bare repoKey slot (single-session path unchanged)', async () => {
    process.chdir(join(tmp, 'repoA'))
    delete process.env.CLAUDE_CODE_SESSION_ID
    await writeCurrentWorkflow(env('bare'))
    expect((await readCurrentWorkflow())?.phase).toBe('bare')
    expect(await readKeys()).toEqual([repoKey()]) // exactly the bare key, no composite
  })

  it('read fallback — an in-flight bare-repoKey workflow stays visible once the session gets an id', async () => {
    process.chdir(join(tmp, 'repoA'))
    delete process.env.CLAUDE_CODE_SESSION_ID
    await writeCurrentWorkflow(env('inflight'))
    // session acquires an id mid-flight; no session-keyed slot exists yet → bare fallback
    process.env.CLAUDE_CODE_SESSION_ID = 'late'
    expect((await readCurrentWorkflow())?.phase).toBe('inflight')
  })

  it('two concurrent sessions in one repo hold independent slots (no collision)', async () => {
    process.chdir(join(tmp, 'repoA'))
    process.env.CLAUDE_CODE_SESSION_ID = 'sX'
    await writeCurrentWorkflow(env('px'))
    process.env.CLAUDE_CODE_SESSION_ID = 'sY'
    await writeCurrentWorkflow(env('py'))

    process.env.CLAUDE_CODE_SESSION_ID = 'sX'
    expect((await readCurrentWorkflow())?.phase).toBe('px')
    process.env.CLAUDE_CODE_SESSION_ID = 'sY'
    expect((await readCurrentWorkflow())?.phase).toBe('py')

    const keys = await readKeys()
    expect(keys).toContain(`${repoKey()}::sX`)
    expect(keys).toContain(`${repoKey()}::sY`)
  })

  it('a session-keyed slot shadows the bare slot (read prefers the session match)', async () => {
    process.chdir(join(tmp, 'repoA'))
    delete process.env.CLAUDE_CODE_SESSION_ID
    await writeCurrentWorkflow(env('bare-old'))
    process.env.CLAUDE_CODE_SESSION_ID = 'sNew'
    await writeCurrentWorkflow(env('session-new'))
    // read under sNew prefers the session slot, not the bare fallback
    expect((await readCurrentWorkflow())?.phase).toBe('session-new')
  })
})
