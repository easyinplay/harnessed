// Phase 3.4 W0.4 — defense-in-depth empirical proof per SPIKE-W0.4-path-traversal.md.
// Phase 5.2 W2 update: R10.4 (#AH DEFERRED Phase 3.4 → DELIVERED Phase 5.2) now throws
// PathTraversalError in resolveAlias() BEFORE manifest path resolve. Updated expectations
// to reflect the new (stronger) guard behavior: exit 1 + PathTraversalError + D-08 generic
// message (no path echo). Sister Phase 3.3 tests/integration/install-aliases.test.ts
// spawn + tmpdir cwd isolation pattern.
import { spawnSync } from 'node:child_process'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const REPO_ROOT = resolve(process.cwd())
const CLI = resolve(REPO_ROOT, 'dist', 'cli.mjs')

describe('Phase 3.4 W0.4 install.ts path traversal defense-in-depth (R10.4 DELIVERED Phase 5.2)', () => {
  it('exits 1 with PathTraversalError on path traversal attempt (../../etc/passwd) + D-08 generic message + no exfiltration', () => {
    // Phase 5.2 R10.4: checkPathSafe() called in resolveAlias() before manifest lookup.
    // Path traversal attempt now throws PathTraversalError with generic D-08 message
    // ('path traversal attempt detected') — NOT echo back attempted path (CSO veto).
    // Exit 1 via unhandled throw (consistent with prior ENOENT error path behavior).
    const cwd = mkdtempSync(join(tmpdir(), 'install-path-traversal-'))
    const r = spawnSync(
      process.execPath,
      [CLI, 'install', '../../etc/passwd', '--dry-run', '--non-interactive', '--system'],
      { cwd, encoding: 'utf8' },
    )
    // PathTraversalError thrown → process exits non-0 (1 or uncaught = depends on Node)
    expect(r.status).not.toBe(0)
    // D-08: generic message present — does NOT contain attempted path
    const combined = (r.stdout ?? '') + (r.stderr ?? '')
    expect(combined).toMatch(/path traversal attempt detected/)
    // D-08: attempted path NOT echoed back (CSO veto — no reconnaissance leakage)
    expect(combined).not.toContain('../../etc/passwd')
    // No exfiltration — assert no /etc/passwd shadow content leak in stdout/stderr
    expect(combined).not.toMatch(/root:.*:0:0:/)
  })
})
