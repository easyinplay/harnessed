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
  listWorkflows,
  readStoreRaw,
  repoKey,
  WorkflowStoreV1,
  writeStoreRaw,
} from '../../src/checkpoint/workflowStore.js'
import { SCHEMA_VERSIONS } from '../../src/types/schemaVersion.js'

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
    expect(repoKey(deep)).toBe(resolve(tmp))
  })

  it('returns an ancestor-or-self; either a .git root or the cwd fallback', () => {
    // NOTE: cannot assume the test host lacks a .git ancestor (e.g. ~/.git
    // dotfiles repo), so assert the contract machine-independently.
    const deep = join(tmp, 'x', 'y')
    mkdirSync(deep, { recursive: true })
    const k = repoKey(deep)
    expect(resolve(deep).startsWith(k)).toBe(true) // ancestor-or-self of deep
    expect(existsSync(join(k, '.git')) || k === resolve(deep)).toBe(true)
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

  it('migration: legacy current-workflow.json surfaces in-memory under repoKey, WITHOUT writing', async () => {
    await writeFile(legacyFile(), JSON.stringify(envelope('legacy-phase')), 'utf8')
    const s = await readStoreRaw()
    expect(s.workflows[repoKey()]?.phase).toBe('legacy-phase')
    // read must be side-effect-free — no workflows.json materialized
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
