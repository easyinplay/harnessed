// checkSafeSegment + the three CLI entry points that joined a user argument into
// a path without it (external review M9 / M10 / M11).
//
// checkPathSafe catches `../` and `..\` but not a bare `..`, and a bare `..` is
// enough whenever the value is used as ONE path segment.

import { Command } from 'commander'
import { describe, expect, it, vi } from 'vitest'
import { checkSafeSegment, PathTraversalError } from '../../src/manifest/lib/path-guard.js'

describe('checkSafeSegment', () => {
  it.each([
    'task-code',
    '2026-05-12T00-00-00.000Z',
    'skill-packs',
    'my.adapter',
  ])('accepts the real single-segment value %j', (v) => {
    expect(() => checkSafeSegment(v)).not.toThrow()
  })

  it.each([
    '..',
    '.',
    '',
    '../x',
    '..\\x',
    'a/b',
    'a\\b',
    '/etc',
    'C:\\evil',
    'x\u0000y',
    '%2e%2e',
  ])('rejects %j', (v) => {
    expect(() => checkSafeSegment(v)).toThrow(PathTraversalError)
  })

  it('the bare ".." case is exactly what checkPathSafe alone let through', async () => {
    const { checkPathSafe } = await import('../../src/manifest/lib/path-guard.js')
    expect(() => checkPathSafe('..')).not.toThrow()
    expect(() => checkSafeSegment('..')).toThrow(PathTraversalError)
  })
})

class ExitError extends Error {
  constructor(public code: number) {
    super(`exit(${code})`)
  }
}

async function exitCodeOf(register: (p: Command) => void, argv: string[]): Promise<number> {
  const exit = vi.spyOn(process, 'exit').mockImplementation((c?: number | string | null) => {
    throw new ExitError(typeof c === 'number' ? c : 0)
  })
  const err = vi.spyOn(console, 'error').mockImplementation(() => {})
  const log = vi.spyOn(console, 'log').mockImplementation(() => {})
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  const program = new Command().exitOverride()
  register(program)
  try {
    await program.parseAsync(['node', 'harnessed', ...argv])
    return 0
  } catch (e) {
    return e instanceof ExitError ? e.code : -1
  } finally {
    exit.mockRestore()
    err.mockRestore()
    log.mockRestore()
    warn.mockRestore()
  }
}

describe('CLI entry points reject traversal before touching the filesystem', () => {
  it('M9 — `prompt ../../x` exits 2', async () => {
    const { registerPrompt } = await import('../../src/cli/prompt.js')
    expect(await exitCodeOf(registerPrompt, ['prompt', '../../x'])).toBe(2)
  })

  it('M10 — `rollback ..` exits 2', async () => {
    const { registerRollback } = await import('../../src/cli/rollback.js')
    expect(await exitCodeOf(registerRollback, ['rollback', '..'])).toBe(2)
  })

  it('M11 — `manifest-add --category ../../..` exits 2 (before any prompt or write)', async () => {
    const { registerManifestAdd } = await import('../../src/cli/manifest-add.js')
    expect(
      await exitCodeOf(registerManifestAdd, [
        'manifest-add',
        'owner/repo',
        '--category',
        '../../..',
        '--non-interactive',
      ]),
    ).toBe(2)
  })
})
