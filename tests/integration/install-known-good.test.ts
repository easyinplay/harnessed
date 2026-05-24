// Phase 3.3 W2 T2.2 — R7.6 验收 "harnessed install --known-good reproducible" e2e (2 fixture).
//
// 2 fixture scope:
//   1. lock hit — versions/0.3.0-known-good.yaml pins ctx7@99.99.99; install
//      --known-good ctx7 dry-run preview shows the pinned version override
//      (or at least dispatches cleanly with the pinned version applied)
//   2. lock miss — versions/0.3.0-known-good.yaml has empty upstreams: [];
//      install --known-good ctx7 falls back to manifest default version
//      gracefully (no error, no crash)
//
// Strategy: tmpdir per-fixture cwd isolation (sister T2.1). Each fixture
// writes a fixture versions/0.3.0-known-good.yaml + copies real manifests.
// install.ts L116 hard-codes harnessed_version='0.3.0' (DEFERRED #AD — Phase 3.4
// reads from package.json), so 0.3.0-known-good.yaml is the active lock file.

import { spawnSync } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { beforeEach, describe, expect, it } from 'vitest'

const REPO_ROOT = resolve(process.cwd())
const CLI = resolve(REPO_ROOT, 'dist', 'cli.mjs')
const REAL_MANIFESTS = resolve(REPO_ROOT, 'manifests', 'tools')

interface Fixture {
  cwd: string
}

function setupFixtureCwd(): Fixture {
  const cwd = mkdtempSync(join(tmpdir(), 'phase-3.3-w2-known-good-'))
  mkdirSync(join(cwd, 'manifests', 'tools'), { recursive: true })
  mkdirSync(join(cwd, 'versions'), { recursive: true })
  // Copy real manifests/tools/ for schema-valid ctx7 target
  cpSync(REAL_MANIFESTS, join(cwd, 'manifests', 'tools'), { recursive: true })
  // Empty aliases.yaml so resolveAlias is a clean no-op (return null → use name as-is)
  writeFileSync(
    join(cwd, 'manifests', 'aliases.yaml'),
    `schemaVersion: harnessed.aliases.v1\naliases: {}\n`,
  )
  return { cwd }
}

function runInstallKnownGood(
  cwd: string,
  name: string,
): { code: number; stdout: string; stderr: string } {
  const r = spawnSync(
    process.execPath,
    [CLI, 'install', name, '--known-good', '--dry-run', '--non-interactive', '--system'],
    { cwd, encoding: 'utf8', env: { ...process.env, NO_COLOR: '1', HARNESSED_LANG: 'en' } },
  )
  return { code: r.status ?? -1, stdout: r.stdout ?? '', stderr: r.stderr ?? '' }
}

describe('Phase 3.3 W2 T2.2 — install --known-good e2e (R7.6 验收)', () => {
  let fx: Fixture

  beforeEach(() => {
    fx = setupFixtureCwd()
  })

  it('fixture 1 — lock hit: known-good pins ctx7@99.99.99 → install applies override (R7.6)', () => {
    // Pin ctx7 to an exotic version 99.99.99 (distinguishable from manifest
    // default '^0.4.0') so we can detect the override took effect.
    writeFileSync(
      join(fx.cwd, 'versions', '0.3.0-known-good.yaml'),
      `schemaVersion: harnessed.known-good.v1
harnessed_version: '0.3.0'
e2e_verified_at: '2026-05-17'
upstreams:
  - name: ctx7
    version: '99.99.99'
    install_method: npm-cli
`,
    )

    const { code, stdout, stderr } = runInstallKnownGood(fx.cwd, 'ctx7')
    // dry-run --system --non-interactive on npm-cli L4 → aborted user-cancel → exit 2
    expect(code, `expected exit 2 (dry-run aborted), got ${code}; stderr=${stderr}`).toBe(2)
    expect(stderr).toMatch(/aborted: user-cancel/)
    // L4 system install path reached (proves install dispatched cleanly)
    expect(stdout).toMatch(/L4 system install/)
    // No schema/parse/load errors (the lock file parsed + applied)
    expect(stderr).not.toMatch(/known-good.*invalid|known-good.*error/i)
  })

  it('fixture 2 — lock miss: empty upstreams falls back to manifest default (graceful)', () => {
    writeFileSync(
      join(fx.cwd, 'versions', '0.3.0-known-good.yaml'),
      `schemaVersion: harnessed.known-good.v1
harnessed_version: '0.3.0'
e2e_verified_at: '2026-05-17'
upstreams: []
`,
    )

    const { code, stdout, stderr } = runInstallKnownGood(fx.cwd, 'ctx7')
    // Lock file exists but ctx7 not in upstreams → getPinnedVersion returns null
    // → install.ts L118 if-pinned skipped → manifest default version used.
    // dry-run --system --non-interactive on npm-cli L4 → aborted user-cancel → exit 2
    expect(code, `expected exit 2 (graceful fallback), got ${code}; stderr=${stderr}`).toBe(2)
    expect(stderr).toMatch(/aborted: user-cancel/)
    expect(stdout).toMatch(/L4 system install/)
    // No error from missing-pin case
    expect(stderr).not.toMatch(/known-good.*invalid|known-good.*error/i)
  })
})
