import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Command } from 'commander'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { registerNext } from '../../src/cli/next.js'

// Mock the state read to control the workflow (mirror tests/cli/resume.test.ts).
vi.mock('../../src/checkpoint/state.js', () => ({
  readCurrentWorkflow: vi.fn(async () => null),
}))

describe('harnessed next CLI', () => {
  let log: string[]
  let tmp: string
  beforeEach(() => {
    log = []
    // No active workflow → resolveNext returns `done`, which now falls through to
    // the cross-unit scan (v12.0 D3). Pin cwd to an empty dir (no .planning) so the
    // scan resolves to `done` rather than scanning the real repo's phases.
    tmp = mkdtempSync(join(tmpdir(), 'next-cli-'))
    vi.spyOn(process, 'cwd').mockReturnValue(tmp)
    vi.spyOn(console, 'log').mockImplementation((m: string) => void log.push(m))
    vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)
  })
  afterEach(() => {
    rmSync(tmp, { recursive: true, force: true })
    vi.restoreAllMocks()
  })

  it('prints NEXT: done when no active workflow and nothing to advance', async () => {
    const program = new Command()
    registerNext(program)
    await program.parseAsync(['node', 'h', 'next'])
    expect(log.join('\n')).toContain('NEXT: done')
  })
})
