// Unit coverage for the first-time CodeGraph bootstrap (src/checkpoint/codegraphInit.ts).
// Every subprocess is an INJECTED seam — `codegraph` is never actually executed.
// The re-entrancy test deliberately uses the REAL claim (the cross-process sentinel
// is the thing under test), redirected into a tmp harness root via
// HARNESSED_ROOT_OVERRIDE (house pattern: tests/cli/checkpoint-reminders.test.ts).

import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ensureCodegraphIgnored, maybeInitCodeGraph } from '../../src/checkpoint/codegraphInit.js'

let tmp: string
let originalOverride: string | undefined

beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), 'codegraph-init-'))
  originalOverride = process.env.HARNESSED_ROOT_OVERRIDE
  process.env.HARNESSED_ROOT_OVERRIDE = join(tmp, '.claude', 'harnessed')
  mkdirSync(join(tmp, 'repo'), { recursive: true })
})

afterEach(() => {
  if (originalOverride === undefined) delete process.env.HARNESSED_ROOT_OVERRIDE
  else process.env.HARNESSED_ROOT_OVERRIDE = originalOverride
  rmSync(tmp, { recursive: true, force: true })
})

function repo(): string {
  return join(tmp, 'repo')
}

describe('maybeInitCodeGraph — launch decision', () => {
  it('no binary → nothing happens (silent, no launch, no claim)', () => {
    const launch = vi.fn()
    const claim = vi.fn(() => true)
    const note = vi.fn()

    const out = maybeInitCodeGraph({
      cwd: repo(),
      hasIndex: () => false,
      hasBinary: () => false,
      claim,
      launch,
      note,
    })

    expect(out).toBe('no-binary')
    expect(launch).not.toHaveBeenCalled()
    expect(claim).not.toHaveBeenCalled()
    // Standing contract: absence of the opt-in tool is NEVER a nag.
    expect(note).not.toHaveBeenCalled()
  })

  it('binary present + no .codegraph/ → init launched in the project cwd', () => {
    const launch = vi.fn()
    const note = vi.fn()

    const out = maybeInitCodeGraph({
      cwd: repo(),
      hasIndex: () => false,
      hasBinary: () => true,
      claim: () => true,
      launch,
      note,
    })

    expect(out).toBe('launched')
    expect(launch).toHaveBeenCalledTimes(1)
    expect(launch).toHaveBeenCalledWith(repo())
    expect(note.mock.calls.flat().join('\n')).toContain('codegraph init')
  })

  it('.codegraph/ already present → NOT launched (watcher keeps it fresh)', () => {
    mkdirSync(join(repo(), '.codegraph'), { recursive: true })
    const launch = vi.fn()
    const hasBinary = vi.fn(() => true)
    const note = vi.fn()

    // Real hasIndex (existsSync) — the presence check itself is under test.
    const out = maybeInitCodeGraph({ cwd: repo(), hasBinary, launch, note })

    expect(out).toBe('index-present')
    expect(launch).not.toHaveBeenCalled()
    // Index-first ordering: the already-indexed case never pays for the PATH probe.
    expect(hasBinary).not.toHaveBeenCalled()
    expect(note).not.toHaveBeenCalled()
  })

  it('launch throws → fail-soft (noted, never rethrown)', () => {
    const note = vi.fn()
    const out = maybeInitCodeGraph({
      cwd: repo(),
      hasIndex: () => false,
      hasBinary: () => true,
      claim: () => true,
      launch: () => {
        throw new Error('spawn EACCES')
      },
      note,
    })

    expect(out).toBe('launch-failed')
    expect(note.mock.calls.flat().join('\n')).toContain('spawn EACCES')
  })
})

describe('maybeInitCodeGraph — re-entrancy (REAL cross-process claim)', () => {
  it('two completions in quick succession launch exactly one indexer', () => {
    const launch = vi.fn()
    const common = {
      cwd: repo(),
      hasIndex: () => false,
      hasBinary: () => true,
      launch,
      note: () => {},
    }

    expect(maybeInitCodeGraph(common)).toBe('launched')
    expect(maybeInitCodeGraph(common)).toBe('already-claimed')
    expect(launch).toHaveBeenCalledTimes(1)
  })

  it('claims are per-project (a different cwd is not blocked)', () => {
    const other = join(tmp, 'other-repo')
    mkdirSync(other, { recursive: true })
    const launch = vi.fn()
    const base = { hasIndex: () => false, hasBinary: () => true, launch, note: () => {} }

    expect(maybeInitCodeGraph({ ...base, cwd: repo() })).toBe('launched')
    expect(maybeInitCodeGraph({ ...base, cwd: other })).toBe('launched')
    expect(launch).toHaveBeenCalledTimes(2)
  })
})

describe('ensureCodegraphIgnored — .gitignore guard (append-only)', () => {
  it('absent .gitignore → created with the ignore line', () => {
    expect(ensureCodegraphIgnored(repo())).toBe('created')
    expect(readFileSync(join(repo(), '.gitignore'), 'utf8')).toBe('.codegraph/\n')
  })

  it('needs-append → appended, existing content preserved verbatim and in order', () => {
    const before = 'node_modules/\ndist/\n.env\n'
    writeFileSync(join(repo(), '.gitignore'), before)

    expect(ensureCodegraphIgnored(repo())).toBe('appended')

    const after = readFileSync(join(repo(), '.gitignore'), 'utf8')
    expect(after.startsWith(before)).toBe(true)
    expect(after).toBe(`${before}.codegraph/\n`)
  })

  it('appends a separating newline when the file lacks a trailing one', () => {
    writeFileSync(join(repo(), '.gitignore'), 'dist/')
    expect(ensureCodegraphIgnored(repo())).toBe('appended')
    expect(readFileSync(join(repo(), '.gitignore'), 'utf8')).toBe('dist/\n.codegraph/\n')
  })

  it.each([
    '.codegraph/',
    '.codegraph',
    '/.codegraph/',
    '  .codegraph/  ',
  ])('already ignored via %j → no second entry', (line) => {
    const before = `node_modules/\n${line}\ndist/\n`
    writeFileSync(join(repo(), '.gitignore'), before)

    expect(ensureCodegraphIgnored(repo())).toBe('already')
    expect(readFileSync(join(repo(), '.gitignore'), 'utf8')).toBe(before)
  })

  it('a commented-out or negated mention does NOT count as ignored', () => {
    writeFileSync(join(repo(), '.gitignore'), '# .codegraph/\n!.codegraph\n')
    expect(ensureCodegraphIgnored(repo())).toBe('appended')
    expect(readFileSync(join(repo(), '.gitignore'), 'utf8')).toContain('\n.codegraph/\n')
  })

  it('launched bootstrap wires the ignore guard (append happens once)', () => {
    writeFileSync(join(repo(), '.gitignore'), 'dist/\n')
    const notes: string[] = []
    maybeInitCodeGraph({
      cwd: repo(),
      hasIndex: () => false,
      hasBinary: () => true,
      claim: () => true,
      launch: () => {},
      note: (m) => notes.push(m),
    })

    expect(readFileSync(join(repo(), '.gitignore'), 'utf8')).toBe('dist/\n.codegraph/\n')
    expect(notes.join('\n')).toContain('.gitignore')
  })
})
