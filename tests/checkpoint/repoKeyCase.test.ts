// v16.0 Phase 67 T1 — win32 repo-key case folding + one-time ledger key migration.
// TDD: written RED (normalizeRepoKey / migrateRepoKeyCase absent), driven to GREEN.
//
// The defect: `path.resolve` preserves case COMPLETELY, including the drive letter
// (measured on win32: resolve('d:/gitcode/harnessed') === 'd:\\gitcode\\harnessed'
// while resolve('D:/GitCode/harnessed') === 'D:\\GitCode\\harnessed'). On Windows
// both name the SAME directory, so entering a repo with different casing minted two
// independent ledger slots and an in-flight workflow silently vanished from view.
//
// SANDBOX (mandatory): every cell that touches the ledger on disk redirects the
// harness root with HARNESSED_ROOT_OVERRIDE into a per-test tmpdir. Writing the real
// `~/.claude/harnessed/` or `~/.codex/harnessed/` is a defect, and on CI (where
// neither exists) it can create a directory that flips detectPlatform() and breaks
// unrelated suites.
//
// PLATFORM is injected (not `process.platform`-stubbed) so the win32 folding paths
// are exercised identically on all three CI runners.

import { execFileSync } from 'node:child_process'
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  statSync,
  utimesSync,
  writeFileSync,
} from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { CurrentWorkflowV1Type } from '../../src/checkpoint/schema/currentWorkflow.v1.js'
import { readCurrentWorkflow } from '../../src/checkpoint/state.js'
import {
  type IntentEntryType,
  migrateRepoKeyCase,
  normalizeRepoKey,
  type RetroMetaEntryType,
  readIntent,
  readStoreRaw,
  repoKey,
  type WorkflowStoreV1Type,
} from '../../src/checkpoint/workflowStore.js'
import { SCHEMA_VERSIONS } from '../../src/types/schemaVersion.js'

// ── normalizeRepoKey (pure; platform injected) ───────────────────────────────

describe('normalizeRepoKey', () => {
  it('lowercases on win32 (drive letter included)', () => {
    expect(normalizeRepoKey('D:\\GitCode\\harnessed', 'win32')).toBe('d:\\gitcode\\harnessed')
    expect(normalizeRepoKey('d:\\gitcode\\harnessed', 'win32')).toBe('d:\\gitcode\\harnessed')
  })

  it('collapses two differently-cased spellings onto one key on win32', () => {
    expect(normalizeRepoKey('D:\\GitCode\\harnessed', 'win32')).toBe(
      normalizeRepoKey('d:/gitcode/harnessed'.replace(/\//g, '\\'), 'win32'),
    )
  })

  it('is the identity on linux (a case-SENSITIVE fs — folding would merge two real dirs)', () => {
    expect(normalizeRepoKey('/home/Me/Repo', 'linux')).toBe('/home/Me/Repo')
  })

  it('is the identity on darwin', () => {
    expect(normalizeRepoKey('/Users/Me/Repo', 'darwin')).toBe('/Users/Me/Repo')
  })

  it('is idempotent', () => {
    for (const p of ['win32', 'linux', 'darwin']) {
      const once = normalizeRepoKey('D:\\GitCode\\Harnessed', p)
      expect(normalizeRepoKey(once, p)).toBe(once)
    }
  })

  it('defaults the platform to process.platform', () => {
    const k = 'D:\\GitCode\\Harnessed'
    expect(normalizeRepoKey(k)).toBe(normalizeRepoKey(k, process.platform))
  })
})

// ── repoKey() inherits the folding (win32 only — a real case-insensitive fs) ──

describe('repoKey case folding on a real filesystem', () => {
  const notWin = process.platform !== 'win32'
  let tmp: string

  beforeEach(() => {
    tmp = mkdtempSync(join(tmpdir(), 'RepoKeyCase-'))
  })
  afterEach(() => rmSync(tmp, { recursive: true, force: true }))

  it.skipIf(notWin)('returns the same key for two differently-cased spellings', () => {
    mkdirSync(join(tmp, '.git'))
    const mixed = join(tmp, 'Src', 'Deep')
    mkdirSync(mixed, { recursive: true })
    // On win32 the lowercase spelling names the same directory, so the walk-up
    // finds the same `.git` — only the preserved casing used to differ.
    expect(repoKey(mixed)).toBe(repoKey(mixed.toLowerCase()))
  })

  it.skipIf(notWin)('returns an already-normalized (lowercase) key', () => {
    mkdirSync(join(tmp, '.git'))
    expect(repoKey(tmp)).toBe(resolve(tmp).toLowerCase())
  })

  it.skipIf(notWin)('normalizes the cwd fallback too (no .git ancestor reachable)', () => {
    // Walk-up may legitimately find an ancestor .git on the host; either way the
    // returned key must be normalized.
    const k = repoKey(join(tmp, 'A', 'B'))
    expect(k).toBe(k.toLowerCase())
  })
})

// ── migrateRepoKeyCase (one-time ledger key migration) ───────────────────────

const envelope = (phase: string, updated_at?: string): CurrentWorkflowV1Type => ({
  schemaVersion: SCHEMA_VERSIONS.currentWorkflow,
  phase,
  status: 'active',
  last_checkpoint_path: null,
  started_at: '2026-10-01T00:00:00.000Z',
  ...(updated_at ? { updated_at } : {}),
})

const retro = (n: number, last?: string): RetroMetaEntryType => ({
  phases_since_retro: n,
  ...(last ? { last_retro_at: last } : {}),
})

const intent = (master: string, ts: string): IntentEntryType => ({ master, ts })

const PAST = new Date('2020-01-01T00:00:00.000Z')
const PREMIGRATE = /::premigrate-[0-9a-f]{6}$/

describe('migrateRepoKeyCase', () => {
  let tmp: string
  let root: string
  const saved: Record<string, string | undefined> = {}
  const ENVS = [
    'HARNESSED_ROOT_OVERRIDE',
    'HARNESSED_PLATFORM',
    'CLAUDE_CODE_SESSION_ID',
    'CODEX_SESSION_ID',
  ]
  let errSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    tmp = mkdtempSync(join(tmpdir(), 'repokeymig-'))
    root = join(tmp, 'root', '.claude', 'harnessed')
    mkdirSync(root, { recursive: true })
    for (const k of ENVS) {
      saved[k] = process.env[k]
      delete process.env[k]
    }
    // MANDATORY sandbox — never the real ~/.claude/harnessed or ~/.codex/harnessed.
    process.env.HARNESSED_ROOT_OVERRIDE = root
    errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => {
    errSpy.mockRestore()
    for (const k of ENVS) {
      if (saved[k] === undefined) delete process.env[k]
      else process.env[k] = saved[k]
    }
    rmSync(tmp, { recursive: true, force: true })
  })

  const storeFile = () => join(root, 'workflows.json')

  /** Seed the ledger with COMPACT json + a frozen mtime. Any write by the
   *  migration both re-indents the file (writeStoreRaw uses 2-space json) and
   *  bumps mtime — two independent, decisive "did it write?" signals. */
  async function seed(store: WorkflowStoreV1Type): Promise<string> {
    const raw = JSON.stringify(store)
    await writeFile(storeFile(), raw, 'utf8')
    utimesSync(storeFile(), PAST, PAST)
    return raw
  }
  const bytes = () => readFileSync(storeFile(), 'utf8')
  const wrote = () => statSync(storeFile()).mtimeMs !== PAST.getTime()

  it('folds keys in all three maps (workflows / retro_meta / intents)', async () => {
    await seed({
      schemaVersion: SCHEMA_VERSIONS.workflowStore,
      workflows: { 'D:\\GitCode\\Harnessed': envelope('p-wf') },
      retro_meta: { 'D:\\GitCode\\Harnessed': retro(3) },
      intents: { 'D:\\GitCode\\Harnessed': intent('auto', '2026-10-01T00:00:00.000Z') },
    })

    await migrateRepoKeyCase('win32')

    const s = await readStoreRaw()
    expect(Object.keys(s.workflows)).toEqual(['d:\\gitcode\\harnessed'])
    expect(Object.keys(s.retro_meta ?? {})).toEqual(['d:\\gitcode\\harnessed'])
    expect(Object.keys(s.intents ?? {})).toEqual(['d:\\gitcode\\harnessed'])
    expect(s.workflows['d:\\gitcode\\harnessed']?.phase).toBe('p-wf')
    expect(s.retro_meta?.['d:\\gitcode\\harnessed']?.phases_since_retro).toBe(3)
    expect(s.intents?.['d:\\gitcode\\harnessed']?.master).toBe('auto')
  })

  it('prints exactly one stderr summary line when it did something', async () => {
    await seed({
      schemaVersion: SCHEMA_VERSIONS.workflowStore,
      workflows: { 'D:\\A': envelope('p') },
    })
    await migrateRepoKeyCase('win32')
    expect(errSpy).toHaveBeenCalledTimes(1)
    expect(String(errSpy.mock.calls[0]?.[0])).toContain('harnessed')
  })

  it('collision in workflows: newer updated_at kept, older archived verbatim, nothing dropped', async () => {
    const older = envelope('old-phase', '2026-10-01T00:00:00.000Z')
    const newer = envelope('new-phase', '2026-10-09T00:00:00.000Z')
    await seed({
      schemaVersion: SCHEMA_VERSIONS.workflowStore,
      // both fold to 'd:\\a' — the older one is first so "keep newer" is a real choice
      workflows: { 'D:\\A': older, 'd:\\A': newer },
    })

    await migrateRepoKeyCase('win32')

    const s = await readStoreRaw()
    const keys = Object.keys(s.workflows)
    expect(keys).toHaveLength(2) // nothing dropped
    expect(s.workflows['d:\\a']).toEqual(newer)
    const archived = keys.filter((k) => PREMIGRATE.test(k))
    expect(archived).toHaveLength(1)
    expect(archived[0]?.startsWith('d:\\a::premigrate-')).toBe(true)
    // the archived content is the ORIGINAL loser entry, byte-for-byte
    expect(s.workflows[archived[0] as string]).toEqual(older)
  })

  it('collision: an entry WITHOUT updated_at loses to one that has it', async () => {
    const stamped = envelope('stamped', '2026-10-02T00:00:00.000Z')
    const unstamped = envelope('unstamped')
    await seed({
      schemaVersion: SCHEMA_VERSIONS.workflowStore,
      workflows: { 'D:\\B': unstamped, 'd:\\B': stamped },
    })
    await migrateRepoKeyCase('win32')
    const s = await readStoreRaw()
    expect(s.workflows['d:\\b']).toEqual(stamped)
    expect(Object.values(s.workflows)).toContainEqual(unstamped)
  })

  it('3-way collision: one winner + two DISTINCT archive keys, nothing dropped', async () => {
    await seed({
      schemaVersion: SCHEMA_VERSIONS.workflowStore,
      workflows: {
        'D:\\C': envelope('a', '2026-10-01T00:00:00.000Z'),
        'd:\\C': envelope('b', '2026-10-05T00:00:00.000Z'),
        'D:\\c': envelope('c', '2026-10-03T00:00:00.000Z'),
      },
    })
    await migrateRepoKeyCase('win32')
    const s = await readStoreRaw()
    const keys = Object.keys(s.workflows)
    expect(keys).toHaveLength(3)
    expect(s.workflows['d:\\c']?.phase).toBe('b')
    const archived = keys.filter((k) => PREMIGRATE.test(k))
    expect(archived).toHaveLength(2)
    expect(new Set(archived).size).toBe(2) // distinct — hash is of the ORIGINAL key
    expect(archived.map((k) => s.workflows[k]?.phase).sort()).toEqual(['a', 'c'])
  })

  it('collision in retro_meta: larger phases_since_retro kept (no updated_at exists there)', async () => {
    const small = retro(1)
    const big = retro(7, '2026-09-01T00:00:00.000Z')
    await seed({
      schemaVersion: SCHEMA_VERSIONS.workflowStore,
      workflows: {},
      retro_meta: { 'D:\\D': small, 'd:\\D': big },
    })
    await migrateRepoKeyCase('win32')
    const s = await readStoreRaw()
    expect(s.retro_meta?.['d:\\d']).toEqual(big)
    expect(Object.keys(s.retro_meta ?? {})).toHaveLength(2)
    expect(Object.values(s.retro_meta ?? {})).toContainEqual(small)
  })

  it('collision in retro_meta tie on count: newer last_retro_at wins', async () => {
    const old = retro(4, '2026-08-01T00:00:00.000Z')
    const fresh = retro(4, '2026-09-20T00:00:00.000Z')
    await seed({
      schemaVersion: SCHEMA_VERSIONS.workflowStore,
      workflows: {},
      retro_meta: { 'D:\\E': old, 'd:\\E': fresh },
    })
    await migrateRepoKeyCase('win32')
    const s = await readStoreRaw()
    expect(s.retro_meta?.['d:\\e']).toEqual(fresh)
  })

  it('collision in intents: newer ts kept, older archived', async () => {
    const old = intent('auto', '2026-10-01T00:00:00.000Z')
    const fresh = intent('task', '2026-10-08T00:00:00.000Z')
    await seed({
      schemaVersion: SCHEMA_VERSIONS.workflowStore,
      workflows: {},
      intents: { 'D:\\F': old, 'd:\\F': fresh },
    })
    await migrateRepoKeyCase('win32')
    const s = await readStoreRaw()
    expect(s.intents?.['d:\\f']).toEqual(fresh)
    expect(Object.keys(s.intents ?? {})).toHaveLength(2)
    expect(Object.values(s.intents ?? {})).toContainEqual(old)
  })

  it('folds ONLY the repoKey prefix of a session-composite key (session id casing preserved)', async () => {
    // workflows/intents are keyed by activeKey() = `${repoKey}::${sessionId}`.
    // Lowercasing the whole string would fold the session id too and reintroduce
    // the exact "key no longer matches what activeKey() builds" defect.
    await seed({
      schemaVersion: SCHEMA_VERSIONS.workflowStore,
      workflows: { 'D:\\GitCode\\X::Sess-ABC': envelope('composite') },
    })
    await migrateRepoKeyCase('win32')
    const s = await readStoreRaw()
    expect(Object.keys(s.workflows)).toEqual(['d:\\gitcode\\x::Sess-ABC'])
  })

  it('is idempotent: a second run is byte-identical AND performs no write', async () => {
    await seed({
      schemaVersion: SCHEMA_VERSIONS.workflowStore,
      workflows: { 'D:\\G': envelope('a', '2026-10-01T00:00:00.000Z'), 'd:\\G': envelope('b') },
      retro_meta: { 'D:\\G': retro(2) },
      intents: { 'D:\\G': intent('auto', '2026-10-01T00:00:00.000Z') },
    })

    await migrateRepoKeyCase('win32')
    const after1 = bytes()
    utimesSync(storeFile(), PAST, PAST)
    errSpy.mockClear()

    await migrateRepoKeyCase('win32')
    expect(bytes()).toBe(after1) // byte-identical
    expect(wrote()).toBe(false) // and it never took the lock / wrote
    expect(errSpy).not.toHaveBeenCalled() // silent on a no-op
  })

  it('is a no-op on non-win32 (byte-identical, no write, silent)', async () => {
    const raw = await seed({
      schemaVersion: SCHEMA_VERSIONS.workflowStore,
      workflows: { 'D:\\GitCode\\Harnessed': envelope('p') },
      retro_meta: { 'D:\\GitCode\\Harnessed': retro(1) },
    })
    for (const p of ['linux', 'darwin']) {
      const r = await migrateRepoKeyCase(p)
      expect(r).toEqual({ folded: 0, archived: 0 })
    }
    expect(bytes()).toBe(raw)
    expect(wrote()).toBe(false)
    expect(errSpy).not.toHaveBeenCalled()
  })

  it('a store needing no folding is left byte-identical with no write and no output', async () => {
    const raw = await seed({
      schemaVersion: SCHEMA_VERSIONS.workflowStore,
      workflows: { 'd:\\gitcode\\harnessed': envelope('p') },
      retro_meta: { 'd:\\gitcode\\harnessed': retro(1) },
      intents: { 'd:\\gitcode\\harnessed': intent('auto', '2026-10-01T00:00:00.000Z') },
    })
    const r = await migrateRepoKeyCase('win32')
    expect(r).toEqual({ folded: 0, archived: 0 })
    expect(bytes()).toBe(raw)
    expect(wrote()).toBe(false)
    expect(errSpy).not.toHaveBeenCalled()
  })

  it('leaves pre-existing ::premigrate-* archive keys untouched', async () => {
    const archivedEntry = envelope('archived-long-ago')
    await seed({
      schemaVersion: SCHEMA_VERSIONS.workflowStore,
      workflows: {
        'd:\\h': envelope('live'),
        'd:\\h::premigrate-abc123': archivedEntry,
      },
    })
    const r = await migrateRepoKeyCase('win32')
    expect(r).toEqual({ folded: 0, archived: 0 })
    const s = await readStoreRaw()
    expect(s.workflows['d:\\h::premigrate-abc123']).toEqual(archivedEntry)
  })

  it('no store at all → silent no-op, nothing created', async () => {
    const r = await migrateRepoKeyCase('win32')
    expect(r).toEqual({ folded: 0, archived: 0 })
    expect(errSpy).not.toHaveBeenCalled()
    expect(() => statSync(storeFile())).toThrow()
  })
})

// ── ::premigrate-* is ARCHIVE-ONLY — no read path may surface it ─────────────

describe('::premigrate-* keys are not reachable from any read path', () => {
  let tmp: string
  let root: string
  let originalCwd: string
  const saved: Record<string, string | undefined> = {}
  const ENVS = [
    'HARNESSED_ROOT_OVERRIDE',
    'HARNESSED_PLATFORM',
    'CLAUDE_CODE_SESSION_ID',
    'CODEX_SESSION_ID',
  ]

  beforeEach(async () => {
    tmp = mkdtempSync(join(tmpdir(), 'premigread-'))
    root = join(tmp, 'root', '.claude', 'harnessed')
    mkdirSync(root, { recursive: true })
    for (const k of ENVS) {
      saved[k] = process.env[k]
      delete process.env[k]
    }
    process.env.HARNESSED_ROOT_OVERRIDE = root
    // a repo dir to chdir into so repoKey()/activeKey() resolve deterministically
    mkdirSync(join(tmp, 'repo', '.git'), { recursive: true })
    originalCwd = process.cwd()
    process.chdir(join(tmp, 'repo'))

    const key = repoKey()
    await writeFile(
      join(root, 'workflows.json'),
      JSON.stringify({
        schemaVersion: SCHEMA_VERSIONS.workflowStore,
        workflows: { [`${key}::premigrate-abc123`]: envelope('archived') },
        intents: { [`${key}::premigrate-abc123`]: intent('auto', '2026-10-01T00:00:00.000Z') },
      }),
      'utf8',
    )
  })
  afterEach(() => {
    process.chdir(originalCwd)
    for (const k of ENVS) {
      if (saved[k] === undefined) delete process.env[k]
      else process.env[k] = saved[k]
    }
    rmSync(tmp, { recursive: true, force: true })
  })

  it('readCurrentWorkflow() does not surface an archived slot', async () => {
    expect(await readCurrentWorkflow()).toBeNull()
  })

  it('readIntent() does not surface an archived intent', async () => {
    expect(await readIntent()).toBeNull()
  })
})

// ── replica parity: bin/harnessed-inject-state.mjs ≡ workflowStore.repoKey ───
//
// `src/checkpoint/injectStateMain.ts` carries a DELIBERATE dep-free replica of
// repoKey (importing the real one would pull typebox onto the per-turn hot path),
// esbuild-bundled into bin/harnessed-inject-state.mjs. Nothing locked the two
// together, so T1's fold landed on one side only and the per-turn injector looked
// up a key the CLI never wrote — on win32, on essentially every invocation, since
// `process.cwd()` there returns the casing used to ENTER the directory.
//
// Driving the SHIPPED bin (sister: staleLedgerPerSlot.test.ts) rather than
// importing the replica: the module ends in `void main()`, and the bundle is what
// actually runs as the hook — an unrebuilt bin means the fix is not deployed.

describe('repoKey parity — shipped inject bin vs workflowStore.repoKey', () => {
  const BIN = join(process.cwd(), 'bin', 'harnessed-inject-state.mjs')
  const made: string[] = []
  afterEach(() => {
    for (const d of made.splice(0)) rmSync(d, { recursive: true, force: true })
  })

  /** Seed a ledger slot under `workflowStore.repoKey(repo)` — the key the CLI
   *  writes — then run the bin from `cwd`. Non-empty output ⇔ the bin computed
   *  the SAME key. */
  function injectFrom(repo: string, cwd: string): string {
    const root = mkdtempSync(join(tmpdir(), 'parity-root-'))
    made.push(root)
    const slot = {
      ...envelope('task'),
      sub_progress: [{ sub: 'task-code', status: 'pending', gate_fired: true }],
    }
    // repoKey() — NOT the raw path. That is the whole point of the assertion.
    writeFileSync(
      join(root, 'workflows.json'),
      JSON.stringify({
        schemaVersion: SCHEMA_VERSIONS.workflowStore,
        workflows: { [repoKey(repo)]: slot },
      }),
    )
    const env: Record<string, string | undefined> = {
      ...process.env,
      HARNESSED_ROOT_OVERRIDE: root,
    }
    delete env.CLAUDE_CODE_SESSION_ID
    delete env.CODEX_SESSION_ID
    delete env.HARNESSED_OFF
    return execFileSync('node', [BIN], { cwd, encoding: 'utf8', env })
  }

  function makeRepo(prefix: string): string {
    // realpath: on macOS tmpdir() sits under the /var → /private/var symlink and
    // the bin keys by the child's realpath cwd (sister staleLedgerPerSlot).
    const repo = realpathSync(mkdtempSync(join(tmpdir(), prefix)))
    made.push(repo)
    mkdirSync(join(repo, '.git'))
    return repo
  }

  it('the bin finds a slot keyed by workflowStore.repoKey (identical output for identical input)', () => {
    const repo = makeRepo('Parity-Repo-')
    expect(injectFrom(repo, repo)).toMatch(/workflow-state/)
  })

  // The divergence only EXISTS on a case-insensitive fs: off win32 the lowercase
  // spelling is a different (nonexistent) directory, so there is nothing to assert.
  it.skipIf(process.platform !== 'win32')(
    'a differently-cased cwd reaches the SAME slot (the fold is in the shipped bundle)',
    () => {
      const repo = makeRepo('Parity-Case-')
      // Entered lowercase, so process.cwd() inside the bin is lowercase; the slot
      // was keyed from the mixed-case spelling. Pre-fold this returned ''.
      expect(injectFrom(repo, repo.toLowerCase())).toMatch(/workflow-state/)
      expect(injectFrom(repo, repo.toUpperCase())).toMatch(/workflow-state/)
    },
  )

  it('the bin still reads .planning/ from the real (unfolded) repo path', () => {
    // The two-variable split: slotKey is folded, the disk path is not. A folded
    // path would still resolve on win32, but this pins the intended wiring — the
    // .planning/ read must keep using the cwd-derived root.
    const repo = makeRepo('Parity-Planning-')
    mkdirSync(join(repo, '.planning'))
    // Phase 16 LEARNINGS.md shape (parseLearnings splits on `### ` blocks and
    // filterRelevantLearnings matches the slot's phase); sister fixture:
    // tests/checkpoint/injectState.test.ts LEARNINGS_MD.
    writeFileSync(
      join(repo, '.planning', 'LEARNINGS.md'),
      [
        '# Learnings',
        '',
        '### 2026-10-01T00:00:00.000Z — phase task',
        '- looped: task-code (×3)',
        '',
      ].join('\n'),
      'utf8',
    )
    expect(injectFrom(repo, repo)).toContain('looped: task-code')
  })
})
