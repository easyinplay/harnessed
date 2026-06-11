// Phase v3.0-3.3 W0 T3.3.W0.9 — before-commit.ts hook fixture (6).
// Tests: biome-preempt auto-fix + no-skip-hooks halt + no-push-without-approval halt
// + non-TS files skip biome + git-push no biome + cache warm.
// Phase 11 T11.5 — doc-discipline state-digest-line-limit (tests 7-11).

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('node:child_process', () => ({ execSync: vi.fn() }))
vi.mock('node:fs', () => ({ readFileSync: vi.fn() }))

import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import {
  type CommitHookCtx,
  runBeforeCommitHook,
} from '../../../src/discipline/enforcement/before-commit.js'
import * as disciplineLoader from '../../../src/workflow/disciplineLoader.js'
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

// Minimal fake doc-discipline — satisfies the shape before-commit.ts needs for tests 7-11.
// Spy intercepts the 'doc-discipline' basename to give controlled rule fixtures (the real
// doc-discipline.yaml on disk works too, but the fake keeps the line-limit rule explicit);
// 'operational' falls through to the real loader which reads operational.yaml from disk.
const FAKE_DOC_DISCIPLINE = {
  schema_version: 'harnessed.discipline.v1' as const,
  discipline: 'doc',
  enforcement_layer: 'commit' as const,
  auto_enforce: true,
  rules: [
    {
      id: 'state-digest-line-limit',
      description: 'STATE.md >100 lines triggers halt',
      enforcement: 'halt' as const,
      trigger: "phase.type == 'commit' AND changed_files contains '.planning/STATE.md'",
      check_method: 'external-cmd' as const,
    },
  ],
}

describe('doc-discipline: state-digest-line-limit', () => {
  const readFileSyncMock = vi.mocked(readFileSync)
  const realLoadDiscipline = disciplineLoader.loadDiscipline

  beforeEach(() => {
    readFileSyncMock.mockReset()
    delete process.env.HARNESSED_ALLOW_LONG_STATE
    // Intercept only the 'doc-discipline' basename; delegate everything else to real loader
    vi.spyOn(disciplineLoader, 'loadDiscipline').mockImplementation(
      (basename: string, packageRoot: string) => {
        if (basename === 'doc-discipline') {
          // biome-ignore lint/suspicious/noExplicitAny: test fixture cast
          return Promise.resolve(FAKE_DOC_DISCIPLINE) as any
        }
        return realLoadDiscipline(basename, packageRoot)
      },
    )
  })

  afterEach(() => {
    delete process.env.HARNESSED_ALLOW_LONG_STATE
  })

  it('7. STATE.md not in changedFiles — doc rule not triggered, no exit', async () => {
    vi.spyOn(process, 'exit').mockImplementation((c?: number | string | null) => {
      throw new ExitError(typeof c === 'number' ? c : 0)
    })
    // ROADMAP.md changed — STATE.md not present; readFileSync must not be called
    await runBeforeCommitHook(baseCtx({ changedFiles: ['.planning/ROADMAP.md'] }))
    expect(readFileSyncMock).not.toHaveBeenCalled()
  })

  it('8. STATE.md in changedFiles, file has ≤100 lines — no exit', async () => {
    vi.spyOn(process, 'exit').mockImplementation((c?: number | string | null) => {
      throw new ExitError(typeof c === 'number' ? c : 0)
    })
    // 50 newlines → 50 non-empty lines (well under limit)
    readFileSyncMock.mockReturnValue('\n'.repeat(50))
    await runBeforeCommitHook(baseCtx({ changedFiles: ['.planning/STATE.md'] }))
    // Should complete without throwing
  })

  it('9. STATE.md in changedFiles, file has 101 lines — process.exit(2)', async () => {
    vi.spyOn(process, 'exit').mockImplementation((c?: number | string | null) => {
      throw new ExitError(typeof c === 'number' ? c : 0)
    })
    // 101 newlines → 101 lines
    readFileSyncMock.mockReturnValue('\n'.repeat(101))
    await expect(
      runBeforeCommitHook(baseCtx({ changedFiles: ['.planning/STATE.md'] })),
    ).rejects.toThrow(/exit\(2\)/)
  })

  it('10. STATE.md has 150 lines + HARNESSED_ALLOW_LONG_STATE=1 — no exit (override)', async () => {
    vi.spyOn(process, 'exit').mockImplementation((c?: number | string | null) => {
      throw new ExitError(typeof c === 'number' ? c : 0)
    })
    process.env.HARNESSED_ALLOW_LONG_STATE = '1'
    readFileSyncMock.mockReturnValue('\n'.repeat(150))
    // Override active — must NOT throw
    await runBeforeCommitHook(baseCtx({ changedFiles: ['.planning/STATE.md'] }))
    expect(readFileSyncMock).not.toHaveBeenCalled()
  })

  it('11. HARNESSED_ALLOW_LONG_STATE=true — override accepts any non-empty string', async () => {
    vi.spyOn(process, 'exit').mockImplementation((c?: number | string | null) => {
      throw new ExitError(typeof c === 'number' ? c : 0)
    })
    process.env.HARNESSED_ALLOW_LONG_STATE = 'true'
    readFileSyncMock.mockReturnValue('\n'.repeat(150))
    // Alternate truthy value — must NOT throw
    await runBeforeCommitHook(baseCtx({ changedFiles: ['.planning/STATE.md'] }))
    expect(readFileSyncMock).not.toHaveBeenCalled()
  })
})
