// v16.0 Phase 67 T4/T5 — `adoptSlot()`: the strictly read-only cross-root copy of
// ONE workflow slot from the other host's ledger into this host's ledger.
//
// TDD: written RED (src/checkpoint/adoptSlot.ts absent), driven to GREEN.
//
// SANDBOXING — two seams, and BOTH are mandatory (ADR 0043 / task_plan T9):
//   - the SOURCE root is reached through the descriptor `home` parameter, so the
//     tests pass an injected `home` (a tmpdir carrying a fake ~/.claude + ~/.codex).
//   - the DESTINATION root is reached through `getHarnessedRoot()` → the no-arg
//     `detectPlatform()`, so only `HARNESSED_ROOT_OVERRIDE` can redirect it.
//   `HARNESSED_ROOT_OVERRIDE` replaces ONLY the resolved host's own `stateRoot`, so
//   it cannot sandbox the OTHER host's root. Setting one and not the other reads or
//   writes the real user profile — and on CI (no ~/.claude, no ~/.codex) it passes
//   VACUOUSLY instead of failing.
//
// R2, the load-bearing invariant: after EVERY path, refusals included, the source
// root is byte-identical — content AND mtime. Seeds freeze mtime to a fixed past
// instant so any write at all is decisive.

import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  statSync,
  utimesSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { adoptSlot } from '../../src/checkpoint/adoptSlot.js'
import type { CurrentWorkflowV1Type } from '../../src/checkpoint/schema/currentWorkflow.v1.js'
import { readCurrentWorkflow } from '../../src/checkpoint/state.js'
import {
  readIntent,
  readStoreRaw,
  repoKey,
  type WorkflowStoreV1Type,
} from '../../src/checkpoint/workflowStore.js'
import { SCHEMA_VERSIONS } from '../../src/types/schemaVersion.js'

const HOST_ENV = [
  'HARNESSED_ROOT_OVERRIDE',
  'HARNESSED_PLATFORM',
  'CLAUDE_CODE_SESSION_ID',
  'CODEX_SESSION_ID',
] as const

const PAST = new Date('2020-01-01T00:00:00.000Z')
const DISPLACED = /::displaced-/

let home: string
let repo: string
let srcRoot: string
let destRoot: string
let key: string

type Store = Omit<WorkflowStoreV1Type, 'schemaVersion'>

function envelope(phase: string, over: Partial<CurrentWorkflowV1Type> = {}): CurrentWorkflowV1Type {
  return {
    schemaVersion: SCHEMA_VERSIONS.currentWorkflow,
    phase,
    status: 'active',
    last_checkpoint_path: '/fake/source-root/checkpoints/phase-7.json',
    started_at: '2026-10-01T00:00:00.000Z',
    updated_at: '2026-10-02T00:00:00.000Z',
    ...over,
  }
}

/** Recursively freeze every file's mtime so "did anything write here?" is decisive. */
function freeze(root: string): void {
  for (const e of readdirSync(root, { withFileTypes: true })) {
    const p = join(root, e.name)
    if (e.isDirectory()) freeze(p)
    else utimesSync(p, PAST, PAST)
  }
  utimesSync(root, PAST, PAST)
}

/** Content + mtime of every file under `root`, keyed by relative path. */
function snapshot(root: string): Record<string, string> {
  const out: Record<string, string> = {}
  const walk = (dir: string, rel: string): void => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name)
      const r = rel ? `${rel}/${e.name}` : e.name
      if (e.isDirectory()) walk(p, r)
      else out[r] = `${statSync(p).mtimeMs}|${readFileSync(p, 'utf8')}`
    }
  }
  walk(root, '')
  return out
}

function seedSource(store: Store): void {
  mkdirSync(srcRoot, { recursive: true })
  writeFileSync(
    join(srcRoot, 'workflows.json'),
    JSON.stringify({ schemaVersion: SCHEMA_VERSIONS.workflowStore, ...store }, null, 2),
    'utf8',
  )
  freeze(srcRoot)
}

/** Seed the source ledger with raw bytes (corrupt-ledger cells). */
function seedSourceRaw(raw: string): void {
  mkdirSync(srcRoot, { recursive: true })
  writeFileSync(join(srcRoot, 'workflows.json'), raw, 'utf8')
  freeze(srcRoot)
}

function seedDest(store: Store): void {
  mkdirSync(destRoot, { recursive: true })
  writeFileSync(
    join(destRoot, 'workflows.json'),
    JSON.stringify({ schemaVersion: SCHEMA_VERSIONS.workflowStore, ...store }, null, 2),
    'utf8',
  )
}

/** T5 — what `harnessed setup --platform codex` leaves behind: a commandsDir
 *  carrying harnessed-generated command files. */
function setUpDestHost(): void {
  const prompts = join(home, '.codex', 'prompts')
  mkdirSync(prompts, { recursive: true })
  writeFileSync(
    join(prompts, 'task.md'),
    '---\ndescription: task\n---\n\nbody\n\n<!-- harnessed-generated:v3.4.4 -->\n',
    'utf8',
  )
}

function tearDownDestHost(): void {
  rmSync(join(home, '.codex', 'prompts'), { recursive: true, force: true })
}

beforeEach(() => {
  // realpath: on macOS tmpdir() sits under the /var → /private/var symlink, and the
  // repo key is derived from the resolved path.
  home = realpathSync(mkdtempSync(join(tmpdir(), 'adopt-home-')))
  repo = realpathSync(mkdtempSync(join(tmpdir(), 'adopt-repo-')))
  mkdirSync(join(repo, '.git'))
  srcRoot = join(home, '.claude', 'harnessed')
  destRoot = join(home, '.codex', 'harnessed')
  mkdirSync(destRoot, { recursive: true })
  key = repoKey(repo)

  for (const k of HOST_ENV) vi.stubEnv(k, undefined)
  // Destination = codex, pinned by env so the injected-home resolution and the
  // real-homedir `detectPlatform()` behind getHarnessedRoot() agree.
  vi.stubEnv('HARNESSED_PLATFORM', 'codex')
  // MANDATORY — never the real ~/.claude/harnessed or ~/.codex/harnessed.
  vi.stubEnv('HARNESSED_ROOT_OVERRIDE', destRoot)
  setUpDestHost()
})

afterEach(() => {
  vi.unstubAllEnvs()
  rmSync(home, { recursive: true, force: true })
  rmSync(repo, { recursive: true, force: true })
})

const run = (from?: string) => adoptSlot({ ...(from ? { from } : {}), home, cwd: repo })

// ── Refusals ─────────────────────────────────────────────────────────────────

describe('adoptSlot — refusals', () => {
  it('unknown --from id', async () => {
    seedSource({ workflows: { [key]: envelope('phase-7') } })
    const r = await run('gemini')
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.refusal.kind).toBe('unknown-from')
    if (r.refusal.kind !== 'unknown-from') return
    expect(r.refusal.value).toBe('gemini')
    expect(r.refusal.known).toEqual(['claude', 'codex'])
  })

  it('D8 — --from names the host we already resolved to (env-platform)', async () => {
    seedSource({ workflows: { [key]: envelope('phase-7') } })
    const r = await run('codex')
    expect(r.ok).toBe(false)
    if (r.ok || r.refusal.kind !== 'same-host') throw new Error('expected same-host')
    expect(r.refusal.host).toBe('codex')
    expect(r.refusal.other).toBe('claude')
    expect(r.refusal.reason).toEqual({
      kind: 'env-platform',
      envVar: 'HARNESSED_PLATFORM',
      value: 'codex',
    })
  })

  it('D8 — the provenance tracks the host-session-env rule', async () => {
    vi.stubEnv('HARNESSED_PLATFORM', undefined)
    vi.stubEnv('CODEX_SESSION_ID', 'sess-codex')
    const r = await run('codex')
    if (r.ok || r.refusal.kind !== 'same-host') throw new Error('expected same-host')
    expect(r.refusal.reason).toEqual({ kind: 'host-session-env', envVar: 'CODEX_SESSION_ID' })
  })

  it('D8 — the provenance tracks the .platform pin rule', async () => {
    vi.stubEnv('HARNESSED_PLATFORM', undefined)
    const pinPath = join(destRoot, '.platform')
    writeFileSync(pinPath, 'codex\n', 'utf8')
    const r = await run('codex')
    if (r.ok || r.refusal.kind !== 'same-host') throw new Error('expected same-host')
    expect(r.refusal.reason).toEqual({ kind: 'platform-pin', pinPath, value: 'codex' })
  })

  it('D8 — the provenance tracks the directory-probe rule', async () => {
    vi.stubEnv('HARNESSED_PLATFORM', undefined)
    mkdirSync(join(home, '.claude'), { recursive: true })
    const r = await run('claude')
    if (r.ok || r.refusal.kind !== 'same-host') throw new Error('expected same-host')
    expect(r.refusal.host).toBe('claude')
    expect(r.refusal.reason).toEqual({
      kind: 'directory-probe',
      probedDir: join(home, '.claude'),
    })
  })

  it('D8 — the provenance tracks the no-signal fallback rule', async () => {
    vi.stubEnv('HARNESSED_PLATFORM', undefined)
    // no ~/.claude, no ~/.codex under the injected home at all
    rmSync(join(home, '.codex'), { recursive: true, force: true })
    const r = await run('claude')
    if (r.ok || r.refusal.kind !== 'same-host') throw new Error('expected same-host')
    expect(r.refusal.reason).toEqual({ kind: 'fallback' })
  })

  it('T5 — destination host was never set up (no harnessed-generated commands)', async () => {
    tearDownDestHost()
    seedSource({ workflows: { [key]: envelope('phase-7') } })
    const r = await run('claude')
    if (r.ok || r.refusal.kind !== 'dest-not-set-up') throw new Error('expected dest-not-set-up')
    expect(r.refusal.host).toBe('codex')
    expect(r.refusal.commandsDir).toBe(join(home, '.codex', 'prompts'))
  })

  it('T5 — a commandsDir holding only user-authored files does NOT count as set up', async () => {
    tearDownDestHost()
    const prompts = join(home, '.codex', 'prompts')
    mkdirSync(prompts, { recursive: true })
    writeFileSync(join(prompts, 'mine.md'), '# my own prompt\n', 'utf8')
    seedSource({ workflows: { [key]: envelope('phase-7') } })
    const r = await run('claude')
    if (r.ok || r.refusal.kind !== 'dest-not-set-up') throw new Error('expected dest-not-set-up')
    expect(r.refusal.commandsDir).toBe(prompts)
  })

  it('D14 — source host has NO ledger (file absent)', async () => {
    const r = await run('claude')
    if (r.ok || r.refusal.kind !== 'no-source-ledger') throw new Error('expected no-source-ledger')
    expect(r.refusal.from).toBe('claude')
    expect(r.refusal.path).toBe(join(srcRoot, 'workflows.json'))
  })

  it('D14 — source ledger is present but unreadable (invalid JSON)', async () => {
    seedSourceRaw('{ not json at all')
    const r = await run('claude')
    if (r.ok || r.refusal.kind !== 'source-ledger-unreadable') {
      throw new Error('expected source-ledger-unreadable')
    }
    expect(r.refusal.path).toBe(join(srcRoot, 'workflows.json'))
  })

  it('D14 — source ledger is present but fails schema validation', async () => {
    seedSourceRaw(JSON.stringify({ schemaVersion: 999, nope: true }))
    const r = await run('claude')
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.refusal.kind).toBe('source-ledger-unreadable')
  })

  it('D14 — a VALID but empty source ledger is "no candidate", not "corrupt"', async () => {
    seedSource({ workflows: {} })
    const r = await run('claude')
    if (r.ok || r.refusal.kind !== 'no-candidate') throw new Error('expected no-candidate')
    expect(r.refusal.sourceKeys).toEqual([])
  })

  it('D9 — zero candidates lists the source ledger keys', async () => {
    seedSource({ workflows: { '/some/other/repo': envelope('elsewhere') } })
    const r = await run('claude')
    if (r.ok || r.refusal.kind !== 'no-candidate') throw new Error('expected no-candidate')
    expect(r.refusal.repoKey).toBe(key)
    expect(r.refusal.sourceKeys).toEqual(['/some/other/repo'])
  })

  it('D10 — more than one candidate refuses and lists them all, never picks', async () => {
    seedSource({
      workflows: {
        [`${key}::sess-a`]: envelope('phase-a'),
        [`${key}::sess-b`]: envelope('phase-b'),
      },
    })
    const r = await run('claude')
    if (r.ok || r.refusal.kind !== 'ambiguous') throw new Error('expected ambiguous')
    expect(r.refusal.candidates.sort()).toEqual([`${key}::sess-a`, `${key}::sess-b`].sort())
    // nothing written
    expect((await readStoreRaw()).workflows[key]).toBeUndefined()
  })

  it('D11 — destination slot is `active` → refuse, naming both phases and the ledger shape', async () => {
    seedSource({ workflows: { [key]: envelope('phase-7') } })
    seedDest({
      workflows: {
        [key]: envelope('phase-9', {
          status: 'active',
          sub_progress: [
            { sub: 'a', status: 'done', gate_fired: true },
            { sub: 'b', status: 'done', gate_fired: true },
            { sub: 'c', status: 'done', gate_fired: true },
            { sub: 'd', status: 'pending', gate_fired: true },
            { sub: 'e', status: 'pending', gate_fired: true },
          ],
        }),
      },
    })
    const r = await run('claude')
    if (r.ok || r.refusal.kind !== 'dest-occupied') throw new Error('expected dest-occupied')
    expect(r.refusal.mine).toEqual({ phase: 'phase-9', status: 'active', done: 3, total: 5 })
    expect(r.refusal.theirs).toEqual({ phase: 'phase-7' })
    expect(r.refusal.from).toBe('claude')
    // TOCTOU-free: the refusal throws inside the lock, so writeStoreRaw never ran.
    const dest = await readStoreRaw()
    expect(dest.workflows[key]?.phase).toBe('phase-9')
    expect(Object.keys(dest.workflows)).toEqual([key])
  })
})

// ── Successes ────────────────────────────────────────────────────────────────

describe('adoptSlot — success variants', () => {
  it('no destination slot → the source slot lands at the BARE repoKey (D4)', async () => {
    const slot = envelope('phase-7')
    seedSource({ workflows: { [key]: slot } })
    const r = await run('claude')
    if (!r.ok) throw new Error(`expected success, got ${r.refusal.kind}`)
    expect(r.from).toBe('claude')
    expect(r.to).toBe('codex')
    expect(r.key).toBe(key)
    expect(r.sourceKey).toBe(key)
    expect(r.phase).toBe('phase-7')
    const dest = await readStoreRaw()
    expect(Object.keys(dest.workflows)).toEqual([key])
    expect(dest.workflows[key]?.phase).toBe('phase-7')
  })

  it('the source slot may be session-composite; the destination key is still bare', async () => {
    seedSource({ workflows: { [`${key}::sess-claude-1`]: envelope('phase-7') } })
    const r = await run('claude')
    if (!r.ok) throw new Error(`expected success, got ${r.refusal.kind}`)
    expect(r.sourceKey).toBe(`${key}::sess-claude-1`)
    expect(r.key).toBe(key)
    expect(Object.keys((await readStoreRaw()).workflows)).toEqual([key])
  })

  it('--from omitted → the other host id is inferred from the exported list', async () => {
    seedSource({ workflows: { [key]: envelope('phase-7') } })
    const r = await run()
    if (!r.ok) throw new Error(`expected success, got ${r.refusal.kind}`)
    expect(r.from).toBe('claude')
  })

  it('destination slot `complete` → overwritten directly, no archive key', async () => {
    seedSource({ workflows: { [key]: envelope('phase-7') } })
    seedDest({ workflows: { [key]: envelope('phase-6', { status: 'complete' }) } })
    const r = await run('claude')
    if (!r.ok) throw new Error(`expected success, got ${r.refusal.kind}`)
    expect(r.archivedKey).toBeUndefined()
    const dest = await readStoreRaw()
    expect(Object.keys(dest.workflows)).toEqual([key])
    expect(dest.workflows[key]?.phase).toBe('phase-7')
  })

  it('destination slot `paused` → archived verbatim under ::displaced-<ts>, then written', async () => {
    const displacedSlot = envelope('phase-6', {
      status: 'paused',
      paused_at: '2026-10-03T00:00:00.000Z',
    })
    seedSource({ workflows: { [key]: envelope('phase-7') } })
    seedDest({ workflows: { [key]: displacedSlot } })
    const r = await run('claude')
    if (!r.ok) throw new Error(`expected success, got ${r.refusal.kind}`)
    expect(r.archivedKey).toBeDefined()
    expect(r.archivedKey?.startsWith(`${key}::displaced-`)).toBe(true)
    const dest = await readStoreRaw()
    expect(dest.workflows[key]?.phase).toBe('phase-7')
    // verbatim: the displaced slot is preserved exactly, updated_at included
    expect(dest.workflows[r.archivedKey as string]).toEqual(displacedSlot)
  })

  it('D7 — updated_at is the DESTINATION write time, not the source value', async () => {
    const before = Date.now()
    seedSource({
      workflows: { [key]: envelope('phase-7', { updated_at: '2020-05-05T00:00:00.000Z' }) },
    })
    const r = await run('claude')
    if (!r.ok) throw new Error(`expected success, got ${r.refusal.kind}`)
    const stamped = (await readStoreRaw()).workflows[key]?.updated_at as string
    expect(stamped).not.toBe('2020-05-05T00:00:00.000Z')
    expect(Date.parse(stamped)).toBeGreaterThanOrEqual(before)
    expect(r.updatedAt).toBe(stamped)
  })

  it('D12 — last_checkpoint_path is carried over VERBATIM (the evidence file is not moved)', async () => {
    seedSource({
      workflows: {
        [key]: envelope('phase-7', { last_checkpoint_path: '/src/root/checkpoints/phase-7.json' }),
      },
    })
    const r = await run('claude')
    if (!r.ok) throw new Error(`expected success, got ${r.refusal.kind}`)
    expect(r.evidencePath).toBe('/src/root/checkpoints/phase-7.json')
    expect((await readStoreRaw()).workflows[key]?.last_checkpoint_path).toBe(
      '/src/root/checkpoints/phase-7.json',
    )
  })

  it('D9 — ::displaced-* and ::premigrate-* archive keys are NOT candidates', async () => {
    seedSource({
      workflows: {
        [key]: envelope('phase-7'),
        [`${key}::displaced-2026-10-01T00:00:00.000Z`]: envelope('old-displaced'),
        [`${key}::premigrate-abc123`]: envelope('old-premigrate'),
      },
    })
    // Loose prefix matching would see 3 candidates and dead-lock on the >1 refusal.
    const r = await run('claude')
    if (!r.ok) throw new Error(`expected success, got ${r.refusal.kind}`)
    expect(r.sourceKey).toBe(key)
    expect(r.phase).toBe('phase-7')
  })

  it('D9 — a three-segment key is not a candidate either', async () => {
    seedSource({ workflows: { [`${key}::sess-a::extra`]: envelope('weird') } })
    const r = await run('claude')
    if (r.ok || r.refusal.kind !== 'no-candidate') throw new Error('expected no-candidate')
  })

  it('a longer repo key that merely STARTS WITH ours is not a candidate', async () => {
    seedSource({ workflows: { [`${key}-sibling`]: envelope('sibling') } })
    const r = await run('claude')
    if (r.ok || r.refusal.kind !== 'no-candidate') throw new Error('expected no-candidate')
  })
})

// ── T7 / F10 — stale session slots are not candidates ────────────────────────

describe('adoptSlot — stale complete session slots are ignored as candidates (F10)', () => {
  const stale = (phase: string, over: Partial<CurrentWorkflowV1Type> = {}) =>
    envelope(phase, {
      status: 'complete',
      started_at: '2020-01-01T00:00:00.000Z',
      updated_at: '2020-01-02T00:00:00.000Z',
      ...over,
    })
  const fresh = (phase: string, over: Partial<CurrentWorkflowV1Type> = {}) =>
    envelope(phase, { status: 'complete', updated_at: new Date().toISOString(), ...over })

  it('a stale complete session slot beside a live one no longer makes the adopt ambiguous', async () => {
    seedSource({
      workflows: {
        [`${key}::dead`]: stale('phase-old'),
        [`${key}::live`]: fresh('phase-live'),
      },
    })
    const r = await run('claude')
    if (!r.ok) throw new Error(`expected success, got ${r.refusal.kind}`)
    expect(r.sourceKey).toBe(`${key}::live`)
    expect(r.phase).toBe('phase-live')
  })

  it('a fresh complete session slot is still a candidate (two fresh -> ambiguous)', async () => {
    seedSource({
      workflows: {
        [`${key}::a`]: fresh('phase-a'),
        [`${key}::b`]: fresh('phase-b'),
      },
    })
    const r = await run('claude')
    if (r.ok || r.refusal.kind !== 'ambiguous') throw new Error('expected ambiguous')
  })

  it('stale active and stale paused session slots are STILL candidates', async () => {
    seedSource({
      workflows: {
        [`${key}::act`]: stale('phase-act', { status: 'active' }),
        [`${key}::pau`]: stale('phase-pau', { status: 'paused' }),
      },
    })
    const r = await run('claude')
    if (r.ok || r.refusal.kind !== 'ambiguous') throw new Error('expected ambiguous')
    expect(r.refusal.candidates.sort()).toEqual([`${key}::act`, `${key}::pau`].sort())
  })

  it('the only candidate being stale-complete empties the set -> no-candidate', async () => {
    seedSource({ workflows: { [`${key}::dead`]: stale('phase-old') } })
    const r = await run('claude')
    if (r.ok || r.refusal.kind !== 'no-candidate') throw new Error('expected no-candidate')
    // the evidence still lists every source key, stale ones included
    expect(r.refusal.sourceKeys).toEqual([`${key}::dead`])
  })

  it('a stale complete BARE slot is still a candidate (only session slots are ignored)', async () => {
    seedSource({ workflows: { [key]: stale('phase-bare') } })
    const r = await run('claude')
    if (!r.ok) throw new Error(`expected success, got ${r.refusal.kind}`)
    expect(r.sourceKey).toBe(key)
  })
})

// ── D15 sidecars ─────────────────────────────────────────────────────────────

describe('adoptSlot — D15 sidecars (retro_meta carried as max, intents NOT carried)', () => {
  it('carries retro_meta when the destination has none', async () => {
    seedSource({
      workflows: { [key]: envelope('phase-7') },
      retro_meta: { [key]: { phases_since_retro: 4, last_retro_at: '2026-09-01T00:00:00.000Z' } },
    })
    const r = await run('claude')
    if (!r.ok) throw new Error(`expected success, got ${r.refusal.kind}`)
    expect(r.retroMeta).toEqual({
      phases_since_retro: 4,
      last_retro_at: '2026-09-01T00:00:00.000Z',
    })
    expect((await readStoreRaw()).retro_meta?.[key]?.phases_since_retro).toBe(4)
  })

  it('takes the MAX when the source is further along', async () => {
    seedSource({
      workflows: { [key]: envelope('phase-7') },
      retro_meta: { [key]: { phases_since_retro: 9 } },
    })
    seedDest({ workflows: {}, retro_meta: { [key]: { phases_since_retro: 2 } } })
    const r = await run('claude')
    if (!r.ok) throw new Error(`expected success, got ${r.refusal.kind}`)
    expect((await readStoreRaw()).retro_meta?.[key]?.phases_since_retro).toBe(9)
  })

  it('takes the MAX when the DESTINATION is further along (no silent reset)', async () => {
    seedSource({
      workflows: { [key]: envelope('phase-7') },
      retro_meta: { [key]: { phases_since_retro: 1 } },
    })
    seedDest({ workflows: {}, retro_meta: { [key]: { phases_since_retro: 7 } } })
    const r = await run('claude')
    if (!r.ok) throw new Error(`expected success, got ${r.refusal.kind}`)
    expect((await readStoreRaw()).retro_meta?.[key]?.phases_since_retro).toBe(7)
  })

  it('keeps the NEWER last_retro_at', async () => {
    seedSource({
      workflows: { [key]: envelope('phase-7') },
      retro_meta: { [key]: { phases_since_retro: 3, last_retro_at: '2026-09-20T00:00:00.000Z' } },
    })
    seedDest({
      workflows: {},
      retro_meta: { [key]: { phases_since_retro: 3, last_retro_at: '2026-08-01T00:00:00.000Z' } },
    })
    const r = await run('claude')
    if (!r.ok) throw new Error(`expected success, got ${r.refusal.kind}`)
    expect((await readStoreRaw()).retro_meta?.[key]?.last_retro_at).toBe('2026-09-20T00:00:00.000Z')
  })

  it("leaves other repos' retro_meta entries alone", async () => {
    seedSource({
      workflows: { [key]: envelope('phase-7') },
      retro_meta: { [key]: { phases_since_retro: 5 }, '/other/repo': { phases_since_retro: 99 } },
    })
    seedDest({ workflows: {}, retro_meta: { '/dest/other': { phases_since_retro: 1 } } })
    const r = await run('claude')
    if (!r.ok) throw new Error(`expected success, got ${r.refusal.kind}`)
    const meta = (await readStoreRaw()).retro_meta ?? {}
    expect(meta['/other/repo']).toBeUndefined()
    expect(meta['/dest/other']?.phases_since_retro).toBe(1)
    expect(meta[key]?.phases_since_retro).toBe(5)
  })

  it('does NOT carry intents (single-turn breadcrumbs belong to the source session)', async () => {
    seedSource({
      workflows: { [key]: envelope('phase-7') },
      intents: { [key]: { master: 'auto', ts: '2026-10-02T00:00:00.000Z' } },
    })
    const r = await run('claude')
    if (!r.ok) throw new Error(`expected success, got ${r.refusal.kind}`)
    expect(r.retroMeta).toBeUndefined()
    expect((await readStoreRaw()).intents?.[key]).toBeUndefined()
  })

  it('no retro_meta for this repo on either side → the sidecar is left absent', async () => {
    seedSource({ workflows: { [key]: envelope('phase-7') } })
    const r = await run('claude')
    if (!r.ok) throw new Error(`expected success, got ${r.refusal.kind}`)
    expect(r.retroMeta).toBeUndefined()
    expect((await readStoreRaw()).retro_meta).toBeUndefined()
  })
})

// ── R2 — the load-bearing invariant: the source root is never written ────────

describe('adoptSlot — R2: the source root is byte-identical (content AND mtime) after every path', () => {
  it('after a SUCCESS', async () => {
    seedSource({
      workflows: { [key]: envelope('phase-7') },
      retro_meta: { [key]: { phases_since_retro: 3 } },
      intents: { [key]: { master: 'auto', ts: '2026-10-02T00:00:00.000Z' } },
    })
    const before = snapshot(srcRoot)
    const r = await run('claude')
    expect(r.ok).toBe(true)
    expect(snapshot(srcRoot)).toEqual(before)
  })

  it('after the `active` destination refusal (the throw happens inside the lock)', async () => {
    seedSource({ workflows: { [key]: envelope('phase-7') } })
    seedDest({ workflows: { [key]: envelope('phase-9', { status: 'active' }) } })
    const before = snapshot(srcRoot)
    const r = await run('claude')
    expect(r.ok).toBe(false)
    expect(snapshot(srcRoot)).toEqual(before)
  })

  it('after the corrupt-ledger refusal (no auto-repair)', async () => {
    seedSourceRaw('{ broken')
    const before = snapshot(srcRoot)
    const r = await run('claude')
    expect(r.ok).toBe(false)
    expect(snapshot(srcRoot)).toEqual(before)
  })

  it('after the ambiguous refusal', async () => {
    seedSource({
      workflows: {
        [`${key}::sess-a`]: envelope('a'),
        [`${key}::sess-b`]: envelope('b'),
      },
    })
    const before = snapshot(srcRoot)
    expect((await run('claude')).ok).toBe(false)
    expect(snapshot(srcRoot)).toEqual(before)
  })

  it('after the same-host refusal', async () => {
    seedSource({ workflows: { [key]: envelope('phase-7') } })
    const before = snapshot(srcRoot)
    expect((await run('codex')).ok).toBe(false)
    expect(snapshot(srcRoot)).toEqual(before)
  })

  it('after the dest-not-set-up refusal', async () => {
    tearDownDestHost()
    seedSource({ workflows: { [key]: envelope('phase-7') } })
    const before = snapshot(srcRoot)
    expect((await run('claude')).ok).toBe(false)
    expect(snapshot(srcRoot)).toEqual(before)
  })

  it('after the no-candidate refusal', async () => {
    seedSource({ workflows: { '/elsewhere': envelope('x') } })
    const before = snapshot(srcRoot)
    expect((await run('claude')).ok).toBe(false)
    expect(snapshot(srcRoot)).toEqual(before)
  })

  it('after the unknown --from refusal', async () => {
    seedSource({ workflows: { [key]: envelope('phase-7') } })
    const before = snapshot(srcRoot)
    expect((await run('gemini')).ok).toBe(false)
    expect(snapshot(srcRoot)).toEqual(before)
  })

  it('never creates a source root that did not exist', async () => {
    expect((await run('claude')).ok).toBe(false)
    expect(() => statSync(srcRoot)).toThrow()
  })
})

// ── R3 — the six bare-key read fallbacks still behave as before ──────────────
//
// Characterization, not a refactor guard: the point is that `state.ts`'s
// `store.workflows[activeKey()] ?? store.workflows[repoKey()]` fallback is the ONLY
// path by which an adopted slot is reachable from a LATER session, so a future
// change that quietly gates it on the host would break the relay it enables
// (ADR 0043 — the original proposal's Decision #3, found harmful).

describe('adoptSlot — R3: the adopted bare slot stays reachable through the bare-key fallback', () => {
  let originalCwd: string

  beforeEach(() => {
    originalCwd = process.cwd()
    process.chdir(repo)
  })
  afterEach(() => {
    process.chdir(originalCwd)
  })

  it('a session with NO session id reads the adopted slot (activeKey === repoKey)', async () => {
    seedSource({ workflows: { [key]: envelope('phase-7') } })
    expect((await run('claude')).ok).toBe(true)
    expect((await readCurrentWorkflow())?.phase).toBe('phase-7')
  })

  it('a LATER session (composite key misses) still reads it via the bare-key fallback', async () => {
    seedSource({ workflows: { [key]: envelope('phase-7') } })
    expect((await run('claude')).ok).toBe(true)
    // A fresh codex session: activeKey() = `${repoKey}::sess-later` — absent from
    // the store. Only the bare fallback makes the relay survive the session.
    vi.stubEnv('CODEX_SESSION_ID', 'sess-later')
    expect((await readCurrentWorkflow())?.phase).toBe('phase-7')
  })

  it('the archive key is NOT reachable from any read path', async () => {
    seedSource({ workflows: { [key]: envelope('phase-7') } })
    seedDest({ workflows: { [key]: envelope('phase-6', { status: 'paused' }) } })
    const r = await run('claude')
    if (!r.ok) throw new Error('expected success')
    const archived = r.archivedKey as string
    expect(DISPLACED.test(archived)).toBe(true)
    // readCurrentWorkflow surfaces the live slot, never the displaced one.
    expect((await readCurrentWorkflow())?.phase).toBe('phase-7')
    expect((await readStoreRaw()).workflows[archived]?.phase).toBe('phase-6')
  })

  it('adopt does not plant an intent, so readIntent stays null', async () => {
    seedSource({
      workflows: { [key]: envelope('phase-7') },
      intents: { [key]: { master: 'auto', ts: '2026-10-02T00:00:00.000Z' } },
    })
    expect((await run('claude')).ok).toBe(true)
    expect(await readIntent()).toBeNull()
  })
})
