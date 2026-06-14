// Phase 21 Wave 1 — release-preflight machine gate. collectPreflight is pure over
// injected deps (changelog/version/gitStatus/gitTags) so the unit test touches no
// real git or fs. The gate is READ-ONLY: it inspects state, never mutates.

import { describe, expect, it } from 'vitest'
import {
  anyFailed,
  collectPreflight,
  type PreflightDeps,
} from '../../src/cli/lib/release-preflight.js'

const ready: PreflightDeps = {
  changelog:
    '# Changelog\n\n## [Unreleased]\n\n### Added\n- the new thing\n\n## [4.4.0] - 2026-06-11\n',
  version: '4.5.0',
  gitStatus: '',
  gitTags: ['v4.4.0', 'v4.3.0'],
}

const check = (checks: ReturnType<typeof collectPreflight>, name: string) =>
  checks.find((c) => c.name === name)

describe('collectPreflight', () => {
  it('all green when changelog has Unreleased entries, version set, tree clean, tag absent', () => {
    const checks = collectPreflight(ready)
    expect(checks.every((c) => c.status === 'pass')).toBe(true)
    expect(anyFailed(checks)).toBe(false)
  })

  it('empty [Unreleased] → changelog check fails', () => {
    const checks = collectPreflight({
      ...ready,
      changelog: '# Changelog\n\n## [Unreleased]\n\n## [4.4.0] - 2026-06-11\n\n### Added\n- old\n',
    })
    expect(check(checks, 'changelog')?.status).toBe('fail')
    expect(anyFailed(checks)).toBe(true)
  })

  it('dirty working tree → git-clean check fails', () => {
    const checks = collectPreflight({ ...ready, gitStatus: ' M src/foo.ts\n' })
    expect(check(checks, 'git-clean')?.status).toBe('fail')
  })

  it('a tag for the current version already exists → tag-absent check fails', () => {
    const checks = collectPreflight({ ...ready, version: '4.4.0' }) // v4.4.0 already in tags
    expect(check(checks, 'tag-absent')?.status).toBe('fail')
  })

  it('missing version → version check fails', () => {
    const checks = collectPreflight({ ...ready, version: '' })
    expect(check(checks, 'version')?.status).toBe('fail')
  })
})
