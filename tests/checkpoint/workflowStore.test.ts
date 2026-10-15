// Phase 15 — per-repo multi-workflow store. TDD: written RED (functions absent),
// driven to GREEN. repoKey is a pure fs walk-up; readStoreRaw/writeStoreRaw are
// lock-free kernels (locking stays in state.ts). Migration fallback surfaces the
// legacy singleton in-memory without writing (reads are side-effect-free).

import { existsSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { Value } from '@sinclair/typebox/value'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { CurrentWorkflowV1Type } from '../../src/checkpoint/schema/currentWorkflow.v1.js'
import {
  activeKey,
  listWorkflows,
  normalizeRepoKey,
  readStoreAt,
  readStoreRaw,
  repoKey,
  WorkflowStoreV1,
  writeStoreRaw,
} from '../../src/checkpoint/workflowStore.js'
import { getHarnessedRoot } from '../../src/platform/harnessedRoot.js'
import { SCHEMA_VERSIONS } from '../../src/types/schemaVersion.js'

// v16.0 Phase 67 T1 — repoKey() now case-folds on win32, so the expected key is
// `normalizeRepoKey(resolve(...))`, not raw `resolve(...)`. Identity off win32, so
// these assertions stay byte-identical on linux/darwin.
const expectedKey = (p: string): string => normalizeRepoKey(resolve(p))

const envelope = (phase: string): CurrentWorkflowV1Type => ({
  schemaVersion: SCHEMA_VERSIONS.currentWorkflow,
  phase,
  status: 'active',
  last_checkpoint_path: null,
  started_at: '2026-06-13T00:00:00.000Z',
})

// ── repoKey (pure fs walk-up) ──

describe('repoKey', () => {
  let tmp: string
  beforeEach(() => {
    tmp = mkdtempSync(join(tmpdir(), 'repokey-'))
  })
  afterEach(() => rmSync(tmp, { recursive: true, force: true }))

  it('returns the nearest ancestor containing .git', () => {
    mkdirSync(join(tmp, '.git'))
    const deep = join(tmp, 'a', 'b', 'c')
    mkdirSync(deep, { recursive: true })
    expect(repoKey(deep)).toBe(expectedKey(tmp))
  })

  it('returns an ancestor-or-self; either a .git root or the cwd fallback', () => {
    // NOTE: cannot assume the test host lacks a .git ancestor (e.g. ~/.git
    // dotfiles repo), so assert the contract machine-independently.
    const deep = join(tmp, 'x', 'y')
    mkdirSync(deep, { recursive: true })
    const k = repoKey(deep)
    expect(expectedKey(deep).startsWith(k)).toBe(true) // ancestor-or-self of deep
    expect(existsSync(join(k, '.git')) || k === expectedKey(deep)).toBe(true)
  })
})

// ── activeKey (Phase 34 — session-scoped composite key) ──

describe('activeKey', () => {
  let tmp: string
  const saved: Record<string, string | undefined> = {}
  const ENVS = ['CLAUDE_CODE_SESSION_ID', 'HARNESSED_PLATFORM', 'HARNESSED_ROOT_OVERRIDE']
  beforeEach(() => {
    tmp = mkdtempSync(join(tmpdir(), 'activekey-'))
    mkdirSync(join(tmp, '.git'))
    // Deterministic platform resolution: clear the env signals so detectPlatform
    // resolves to the claude default (sessionIdEnv='CLAUDE_CODE_SESSION_ID') unless
    // a cell sets HARNESSED_PLATFORM explicitly.
    for (const k of ENVS) {
      saved[k] = process.env[k]
      delete process.env[k]
    }
  })
  afterEach(() => {
    for (const k of ENVS) {
      if (saved[k] === undefined) delete process.env[k]
      else process.env[k] = saved[k]
    }
    rmSync(tmp, { recursive: true, force: true })
  })

  it('appends ::<sid> when CLAUDE_CODE_SESSION_ID is set', () => {
    process.env.CLAUDE_CODE_SESSION_ID = 'sess-abc'
    expect(activeKey(tmp)).toBe(`${expectedKey(tmp)}::sess-abc`)
  })

  it('is the bare repoKey when no session id (byte-identical single-session path)', () => {
    delete process.env.CLAUDE_CODE_SESSION_ID
    expect(activeKey(tmp)).toBe(repoKey(tmp))
    expect(activeKey(tmp)).toBe(expectedKey(tmp))
  })

  it('is the bare repoKey when session id is empty or whitespace', () => {
    process.env.CLAUDE_CODE_SESSION_ID = '   '
    expect(activeKey(tmp)).toBe(repoKey(tmp))
    process.env.CLAUDE_CODE_SESSION_ID = ''
    expect(activeKey(tmp)).toBe(repoKey(tmp))
  })

  it('trims surrounding whitespace from the session id', () => {
    process.env.CLAUDE_CODE_SESSION_ID = '  sess-xyz  '
    expect(activeKey(tmp)).toBe(`${expectedKey(tmp)}::sess-xyz`)
  })

  it('threads cwd through to repoKey (composite built on the resolved repo root)', () => {
    process.env.CLAUDE_CODE_SESSION_ID = 'sess-deep'
    const deep = join(tmp, 'a', 'b')
    mkdirSync(deep, { recursive: true })
    expect(activeKey(deep)).toBe(`${expectedKey(tmp)}::sess-deep`)
  })

  // Phase 35 — session env resolved via PlatformDescriptor.sessionIdEnv, NOT a
  // hardcoded CLAUDE_CODE_SESSION_ID. A platform with no session env (codex →
  // null) stays single-session even when CC's env happens to be set.
  it('on a platform with sessionIdEnv=null (codex), is the bare repoKey even if CLAUDE_CODE_SESSION_ID is set', () => {
    process.env.HARNESSED_PLATFORM = 'codex'
    process.env.CLAUDE_CODE_SESSION_ID = 'sess-should-be-ignored'
    expect(activeKey(tmp)).toBe(repoKey(tmp))
    expect(activeKey(tmp)).toBe(expectedKey(tmp))
  })
})

// ── WorkflowStoreV1 schema ──

describe('WorkflowStoreV1 schema', () => {
  it('accepts a store with one repo slot', () => {
    expect(
      Value.Check(WorkflowStoreV1, {
        schemaVersion: SCHEMA_VERSIONS.workflowStore,
        workflows: { '/repo/a': envelope('task') },
      }),
    ).toBe(true)
  })
  it('rejects a store missing workflows', () => {
    expect(Value.Check(WorkflowStoreV1, { schemaVersion: SCHEMA_VERSIONS.workflowStore })).toBe(
      false,
    )
  })
})

// ── readStoreRaw / writeStoreRaw / migration / listWorkflows ──

describe('store kernels + migration', () => {
  let tmp: string
  let original: string | undefined
  let originalCwd: string
  beforeEach(async () => {
    tmp = mkdtempSync(join(tmpdir(), 'wfstore-'))
    original = process.env.HARNESSED_ROOT_OVERRIDE
    process.env.HARNESSED_ROOT_OVERRIDE = join(tmp, 'root', '.claude', 'harnessed')
    await mkdir(join(tmp, 'root', '.claude', 'harnessed'), { recursive: true })
    // a repo dir we can chdir into so repoKey() resolves deterministically
    originalCwd = process.cwd()
    mkdirSync(join(tmp, 'repo', '.git'), { recursive: true })
    process.chdir(join(tmp, 'repo'))
  })
  afterEach(() => {
    process.chdir(originalCwd)
    if (original === undefined) delete process.env.HARNESSED_ROOT_OVERRIDE
    else process.env.HARNESSED_ROOT_OVERRIDE = original
    rmSync(tmp, { recursive: true, force: true })
  })

  const storeFile = () => join(tmp, 'root', '.claude', 'harnessed', 'workflows.json')
  const legacyFile = () => join(tmp, 'root', '.claude', 'harnessed', 'current-workflow.json')

  it('readStoreRaw returns empty store when nothing exists', async () => {
    const s = await readStoreRaw()
    expect(s.workflows).toEqual({})
  })

  it('writeStoreRaw round-trips', async () => {
    await writeStoreRaw({
      schemaVersion: SCHEMA_VERSIONS.workflowStore,
      workflows: { [repoKey()]: envelope('task') },
    })
    const s = await readStoreRaw()
    expect(s.workflows[repoKey()]?.phase).toBe('task')
  })

  it('issue #10: legacy current-workflow.json is IGNORED (unkeyed global singleton must not surface under repoKey → cross-repo leak)', async () => {
    await writeFile(legacyFile(), JSON.stringify(envelope('legacy-phase')), 'utf8')
    const s = await readStoreRaw()
    // the unkeyed singleton is never attributed to a repo — empty store, not a
    // phantom slot holding another repo's workflow.
    expect(s.workflows).toEqual({})
    expect(existsSync(storeFile())).toBe(false)
  })

  it('idempotent: once workflows.json exists, legacy is ignored', async () => {
    await writeFile(legacyFile(), JSON.stringify(envelope('legacy-phase')), 'utf8')
    await writeStoreRaw({
      schemaVersion: SCHEMA_VERSIONS.workflowStore,
      workflows: { [repoKey()]: envelope('store-phase') },
    })
    const s = await readStoreRaw()
    expect(s.workflows[repoKey()]?.phase).toBe('store-phase') // not 'legacy-phase'
  })

  it('listWorkflows reports each slot', async () => {
    await writeStoreRaw({
      schemaVersion: SCHEMA_VERSIONS.workflowStore,
      workflows: { '/repo/a': envelope('p1'), '/repo/b': envelope('p2') },
    })
    const ws = await listWorkflows()
    expect(ws.map((w) => w.phase).sort()).toEqual(['p1', 'p2'])
    expect(ws[0]).toHaveProperty('key')
    expect(ws[0]).toHaveProperty('status')
  })
})

// ── v16.0 Phase 67 T2 — readStoreAt(root) extraction (R1 regression) ─────────
//
// `readStoreRaw()` became a one-line delegation to `readStoreAt(getHarnessedRoot())`
// so a cross-root reader (Phase 67 `checkpoint adopt`) can read ANOTHER host's
// ledger without hand-copying a fourth validate-and-fail-soft reader (there are
// already three: this one, the deliberate dep-free replica in
// bin/harnessed-inject-state.mjs, and its TS source injectStateMain.ts).
//
// The first describe below was written GREEN against the PRE-refactor
// `readStoreRaw` — it pins the behavior the delegation has to preserve verbatim:
// the path it reads, and fail-soft-to-empty-store on absent / malformed /
// schema-invalid. The second describe is the new seam.
//
// Both sandbox the ACTIVE root via HARNESSED_ROOT_OVERRIDE into a per-test tmpdir.
// A test that writes the real ~/.claude/harnessed/ or ~/.codex/harnessed/ is a
// defect: besides polluting the developer's home, on CI (where neither exists)
// creating one flips detectPlatform()'s directory probe and breaks later suites.

describe('readStoreRaw — path + fail-soft contract (Phase 67 T2 / R1)', () => {
  let tmp: string
  let savedOverride: string | undefined
  let activeRoot: string

  beforeEach(async () => {
    tmp = mkdtempSync(join(tmpdir(), 'readstoreat-'))
    activeRoot = join(tmp, 'active-root')
    savedOverride = process.env.HARNESSED_ROOT_OVERRIDE
    process.env.HARNESSED_ROOT_OVERRIDE = activeRoot
    await mkdir(activeRoot, { recursive: true })
  })

  afterEach(() => {
    if (savedOverride === undefined) delete process.env.HARNESSED_ROOT_OVERRIDE
    else process.env.HARNESSED_ROOT_OVERRIDE = savedOverride
    rmSync(tmp, { recursive: true, force: true })
  })

  const activeFile = () => join(activeRoot, 'workflows.json')

  it('reads getHarnessedRoot()/workflows.json', async () => {
    expect(getHarnessedRoot()).toBe(activeRoot)
    await writeFile(
      activeFile(),
      JSON.stringify({
        schemaVersion: SCHEMA_VERSIONS.workflowStore,
        workflows: { '/repo/active': envelope('from-active-root') },
      }),
      'utf8',
    )
    const s = await readStoreRaw()
    expect(s.workflows['/repo/active']?.phase).toBe('from-active-root')
  })

  it('fail-softs to an empty store when workflows.json is missing', async () => {
    expect(existsSync(activeFile())).toBe(false)
    expect(await readStoreRaw()).toEqual({
      schemaVersion: SCHEMA_VERSIONS.workflowStore,
      workflows: {},
    })
  })

  it('fail-softs to an empty store when the JSON is malformed', async () => {
    await writeFile(activeFile(), '{ "workflows": ', 'utf8')
    expect(await readStoreRaw()).toEqual({
      schemaVersion: SCHEMA_VERSIONS.workflowStore,
      workflows: {},
    })
  })

  it('fail-softs to an empty store when valid JSON fails Value.Check', async () => {
    // parses fine, but `workflows` is missing → schema-invalid (the schema case the
    // `WorkflowStoreV1 schema` describe above pins as a Value.Check reject).
    const bad = { schemaVersion: SCHEMA_VERSIONS.workflowStore }
    expect(Value.Check(WorkflowStoreV1, bad)).toBe(false)
    await writeFile(activeFile(), JSON.stringify(bad), 'utf8')
    expect(await readStoreRaw()).toEqual({
      schemaVersion: SCHEMA_VERSIONS.workflowStore,
      workflows: {},
    })
  })

  // ── the new seam: the same read against an arbitrary root ──

  describe('readStoreAt(root)', () => {
    /** A second root standing in for ANOTHER harness's state root (the
     *  cross-host read Phase 67 needs). Deliberately NOT the active root and
     *  NOT reachable through HARNESSED_ROOT_OVERRIDE, which only ever replaces
     *  the stateRoot of the host that was already resolved. */
    let otherRoot: string

    beforeEach(async () => {
      otherRoot = join(tmp, 'other-root')
      await mkdir(otherRoot, { recursive: true })
    })

    const seed = (root: string, phase: string) =>
      writeFile(
        join(root, 'workflows.json'),
        JSON.stringify({
          schemaVersion: SCHEMA_VERSIONS.workflowStore,
          workflows: { '/repo/x': envelope(phase) },
        }),
        'utf8',
      )

    it('reads the root it is given, NOT the active root', async () => {
      await seed(activeRoot, 'active-phase')
      await seed(otherRoot, 'other-phase')

      // each call sees its own root — proves the isolation, not just that one of
      // them happened to resolve.
      expect((await readStoreAt(otherRoot)).workflows['/repo/x']?.phase).toBe('other-phase')
      expect((await readStoreAt(activeRoot)).workflows['/repo/x']?.phase).toBe('active-phase')
      expect((await readStoreRaw()).workflows['/repo/x']?.phase).toBe('active-phase')
    })

    it('reads the other root even when the active root has no ledger at all', async () => {
      await seed(otherRoot, 'other-phase')
      expect(existsSync(activeFile())).toBe(false)
      expect((await readStoreAt(otherRoot)).workflows['/repo/x']?.phase).toBe('other-phase')
      expect((await readStoreRaw()).workflows).toEqual({})
    })

    it('fail-softs identically on a root with no / malformed / schema-invalid ledger', async () => {
      const empty = { schemaVersion: SCHEMA_VERSIONS.workflowStore, workflows: {} }
      expect(await readStoreAt(join(tmp, 'nonexistent-root'))).toEqual(empty)

      await writeFile(join(otherRoot, 'workflows.json'), '{ "workflows": ', 'utf8')
      expect(await readStoreAt(otherRoot)).toEqual(empty)

      await writeFile(
        join(otherRoot, 'workflows.json'),
        JSON.stringify({ schemaVersion: SCHEMA_VERSIONS.workflowStore }),
        'utf8',
      )
      expect(await readStoreAt(otherRoot)).toEqual(empty)
    })

    it('is strictly read-only: creates nothing under a root that does not exist', async () => {
      const missing = join(tmp, 'nonexistent-root')
      await readStoreAt(missing)
      expect(existsSync(missing)).toBe(false)
    })

    it('readStoreRaw() is readStoreAt() applied to the active root', async () => {
      await seed(activeRoot, 'active-phase')
      expect(await readStoreRaw()).toEqual(await readStoreAt(getHarnessedRoot()))
    })
  })
})
