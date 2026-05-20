// Phase v3.0-3.3 W0 T3.3.W0.9 — before-commit.ts hook fixture (6).
// Tests: biome-preempt auto-fix + no-skip-hooks halt + no-push-without-approval halt
// + non-TS files skip biome + git-push no biome + cache warm.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('node:child_process', () => ({ execSync: vi.fn() }))

import { execSync } from 'node:child_process'
import {
  type CommitHookCtx,
  runBeforeCommitHook,
} from '../../../src/discipline/enforcement/before-commit.js'
import { _clearDisciplineCache } from '../../../src/workflow/disciplineLoader.js'

const PACKAGE_ROOT = process.cwd()
const execSyncMock = vi.mocked(execSync)

class ExitError extends Error {
  constructor(public code: number) {
    super(`exit(${code})`)
  }
}

beforeEach(() => {
  _clearDisciplineCache()
  execSyncMock.mockReset()
})

afterEach(() => vi.restoreAllMocks())

function baseCtx(overrides: Partial<CommitHookCtx> = {}): CommitHookCtx {
  return {
    changedFiles: [],
    cmdArgs: [],
    packageRoot: PACKAGE_ROOT,
    cmdType: 'git-commit',
    hasUserApproval: false,
    ...overrides,
  }
}

describe('discipline/enforcement/before-commit', () => {
  it('1. biome-preempt — TS file commit triggers auto-fix exec', async () => {
    await runBeforeCommitHook(baseCtx({ changedFiles: ['src/foo.ts'] }))
    expect(execSyncMock).toHaveBeenCalledOnce()
    const cmd = execSyncMock.mock.calls[0]?.[0]
    expect(String(cmd)).toContain('biome check --write')
  })

  it('2. biome-preempt skipped for non-TS files (md only)', async () => {
    await runBeforeCommitHook(baseCtx({ changedFiles: ['docs/README.md'] }))
    expect(execSyncMock).not.toHaveBeenCalled()
  })

  it('3. no-skip-hooks halt — --no-verify arg triggers process.exit(2)', async () => {
    vi.spyOn(process, 'exit').mockImplementation((c?: number | string | null) => {
      throw new ExitError(typeof c === 'number' ? c : 0)
    })
    await expect(runBeforeCommitHook(baseCtx({ cmdArgs: ['--no-verify'] }))).rejects.toThrow(
      /exit\(2\)/,
    )
  })

  it('4. no-push-without-approval halt — push + no approval → exit(2)', async () => {
    vi.spyOn(process, 'exit').mockImplementation((c?: number | string | null) => {
      throw new ExitError(typeof c === 'number' ? c : 0)
    })
    await expect(
      runBeforeCommitHook(baseCtx({ cmdType: 'git-push', hasUserApproval: false })),
    ).rejects.toThrow(/exit\(2\)/)
  })

  it('5. push with approval — no halt, no biome', async () => {
    await runBeforeCommitHook(baseCtx({ cmdType: 'git-push', hasUserApproval: true }))
    expect(execSyncMock).not.toHaveBeenCalled()
  })

  it('6. tsx + js mixed files — biome triggered (broader regex match)', async () => {
    await runBeforeCommitHook(baseCtx({ changedFiles: ['src/a.tsx', 'src/b.js', 'src/c.mjs'] }))
    expect(execSyncMock).toHaveBeenCalledOnce()
  })
})
