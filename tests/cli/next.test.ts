import { Command } from 'commander'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { registerNext } from '../../src/cli/next.js'

// Mock the state read to control the workflow (mirror tests/cli/resume.test.ts).
vi.mock('../../src/checkpoint/state.js', () => ({
  readCurrentWorkflow: vi.fn(async () => null),
}))

describe('harnessed next CLI', () => {
  let log: string[]
  beforeEach(() => {
    log = []
    vi.spyOn(console, 'log').mockImplementation((m: string) => void log.push(m))
    vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)
  })
  afterEach(() => vi.restoreAllMocks())

  it('prints NEXT: done when no active workflow', async () => {
    const program = new Command()
    registerNext(program)
    await program.parseAsync(['node', 'h', 'next'])
    expect(log.join('\n')).toContain('NEXT: done')
  })
})
