// Phase 3.3 W2 T2.3 — D-02 DOCTOR-ONLY-WARN install silent observability gate (1 fixture).
//
// D-02 LOCKED contract: install path redirects silently — NO 'redirect',
// 'deprecated', or 'warning' substring in stdout/stderr. The human-readable
// deprecation audit surface is `harnessed doctor` (7th check); install just
// delivers the user-requested capability via the redirect target without
// console noise (sister Unix tool conventions — ls / cp don't warn on
// argument aliases). This fixture守门 future code from sneaking in
// console.warn() during install (CI noise + duplicated warning regression).

import { spawnSync } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const REPO_ROOT = resolve(process.cwd())
const CLI = resolve(REPO_ROOT, 'dist', 'cli.mjs')
const REAL_MANIFESTS = resolve(REPO_ROOT, 'manifests', 'tools')

function setupFixtureCwd(): string {
  const cwd = mkdtempSync(join(tmpdir(), 'phase-3.3-w2-silent-redirect-'))
  mkdirSync(join(cwd, 'manifests', 'tools'), { recursive: true })
  cpSync(REAL_MANIFESTS, join(cwd, 'manifests', 'tools'), { recursive: true })
  writeFileSync(
    join(cwd, 'manifests', 'aliases.yaml'),
    `schemaVersion: harnessed.aliases.v1
aliases:
  old-name:
    redirect: ctx7
    reason: rename test fixture (silent redirect gate)
    since_version: '0.3.0'
    deprecation_date: '2026-05-17'
`,
  )
  return cwd
}

describe('Phase 3.3 W2 T2.3 — install silent redirect observability gate (D-02)', () => {
  it('redirect resolves silently: no redirect/deprecated/warning substring in install output', () => {
    const cwd = setupFixtureCwd()
    const r = spawnSync(
      process.execPath,
      [CLI, 'install', 'old-name', '--dry-run', '--non-interactive', '--system'],
      { cwd, encoding: 'utf8', env: { ...process.env, NO_COLOR: '1' } },
    )
    const stdout = r.stdout ?? ''
    const stderr = r.stderr ?? ''
    const combined = stdout + stderr

    // (1) Install dispatched cleanly via redirect (dry-run --system → user-cancel abort)
    expect(r.status, `expected exit 2 (silent redirect dispatched), got ${r.status}`).toBe(2)
    expect(stderr).toMatch(/aborted: user-cancel/)

    // (2) D-02 silence守门: NO 'redirect' substring (case-insensitive)
    expect(combined.toLowerCase()).not.toContain('redirect')

    // (3) D-02 silence守门: NO 'deprecated' substring (case-insensitive)
    expect(combined.toLowerCase()).not.toContain('deprecated')

    // (4) D-02 silence守门: NO 'warning' substring (case-insensitive — excludes
    // the @clack/prompts 'warn' style words too)
    expect(combined.toLowerCase()).not.toContain('warning')

    // (5) Original alias name does NOT appear in any error trail
    // (proves resolveAlias intercepted before manifest lookup)
    expect(stderr).not.toMatch(/old-name/)
  })
})
