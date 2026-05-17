// Phase 3.4 W0.4 — defense-in-depth empirical proof per SPIKE-W0.4-path-traversal.md.
// NO regex code change to install.ts (DEFER lock per DEFERRED #AH); this fixture
// verifies existing path.resolve + ENOENT graceful + TypeBox strict 双层 defense
// by spawning install.ts. Sister Phase 3.3 tests/integration/install-aliases.test.ts
// spawn + tmpdir cwd isolation pattern.
import { spawnSync } from 'node:child_process'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const REPO_ROOT = resolve(process.cwd())
const CLI = resolve(REPO_ROOT, 'dist', 'cli.mjs')

describe('Phase 3.4 W0.4 install.ts path traversal defense-in-depth (DEFER Phase 4.0)', () => {
  it('exits 1 with manifest not found on path traversal attempt (../../etc/passwd) + no exfiltration', () => {
    // Spawn in fresh tmpdir cwd (no manifests/ dir) so the existing ENOENT
    // graceful fallback path is exercised end-to-end. The path-traversal
    // target `../../etc/passwd.yaml` is resolved by path.resolve to an
    // absolute /etc/passwd.yaml that does not exist (or is not a valid
    // manifest YAML if it did) → both readFile attempts ENOENT → exit 1.
    const cwd = mkdtempSync(join(tmpdir(), 'install-path-traversal-'))
    const r = spawnSync(
      process.execPath,
      [CLI, 'install', '../../etc/passwd', '--dry-run', '--non-interactive', '--system'],
      { cwd, encoding: 'utf8' },
    )
    // ENOENT graceful fallback verified (exit 1 = error path per install.ts L97)
    expect(r.status).toBe(1)
    expect(r.stderr).toMatch(/manifest .* not found/)
    // No exfiltration — assert no /etc/passwd shadow content leak in stdout/stderr
    // (Linux passwd file lines like 'root:x:0:0:...'). Cross-OS safe: pattern won't
    // false-positive on Windows where the file doesn't exist; just verifies absence.
    const combined = (r.stdout ?? '') + (r.stderr ?? '')
    expect(combined).not.toMatch(/root:.*:0:0:/)
  })
})
