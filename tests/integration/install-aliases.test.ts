// Phase 3.3 W2 T2.1 — R7.5 验收 "模拟上游改名场景 install 通过" e2e (3 fixture).
//
// 3 fixture scope:
//   1. rename redirect e2e — aliases.yaml maps 'old-package-name' → 'ctx7'
//      (real ctx7 manifest exists); install with old name succeeds via redirect
//   2. unknown name + no alias — install with nonexistent name + empty
//      aliases.yaml fails loud (exit 1 + 'manifest not found' stderr)
//   3. alias exists but redirect target missing — aliases.yaml maps to a
//      nonexistent target manifest; install fails loud (not crash)
//
// Strategy: tmpdir per-fixture cwd isolation (sister Phase 3.2 integration
// tests + tests/scripts/dashboard-sse.test.ts tmpRoot pattern). Each fixture
// writes a fixture aliases.yaml + symlinks/copies real manifests/tools/ dir
// so the redirect target resolves naturally. spawnSync invokes the real
// dist/cli.mjs in --dry-run --non-interactive mode (no mutation, no prompt).
//
// D-02 silent install: stdout MAY reference the resolved redirect target
// ('ctx7') but per D-02 DOCTOR-ONLY-WARN locked, NO 'redirect' / 'deprecated'
// substring in stdout/stderr (silent — doctor 7th check is the human-readable
// surface; observability守门 in T2.3 dedicated fixture).

import { spawnSync } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

const REPO_ROOT = resolve(process.cwd())
const CLI = resolve(REPO_ROOT, 'dist', 'cli.mjs')
const REAL_MANIFESTS = resolve(REPO_ROOT, 'manifests', 'tools')

interface Fixture {
  cwd: string
}

function setupFixtureCwd(): Fixture {
  const cwd = mkdtempSync(join(tmpdir(), 'phase-3.3-w2-aliases-'))
  mkdirSync(join(cwd, 'manifests'), { recursive: true })
  // Copy real manifests/tools/ so redirect target (ctx7) resolves to a real
  // schema-valid manifest. Cheaper than symlink (cross-OS reliable on Win).
  cpSync(REAL_MANIFESTS, join(cwd, 'manifests', 'tools'), { recursive: true })
  return { cwd }
}

function runInstall(
  cwd: string,
  name: string,
  extraArgs: string[] = [],
): { code: number; stdout: string; stderr: string } {
  // --system: ctx7 is npm-cli L4 (global install). Pass --system so the L4
  // security gate doesn't short-circuit to 'level-flag-missing' before the
  // installer's dry-run preview confirms the redirect target resolved.
  // dry-run + non-interactive + --system → installer returns
  // { aborted: true, reason: 'user-cancel' } per npmCli.ts L92 → exit 2,
  // proving (a) alias resolved (b) target manifest schema valid (c) installer
  // dispatched (d) no side effects.
  const args = [CLI, 'install', name, '--dry-run', '--non-interactive', '--system', ...extraArgs]
  const r = spawnSync(process.execPath, args, {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, NO_COLOR: '1', HARNESSED_LANG: 'en' },
  })
  return { code: r.status ?? -1, stdout: r.stdout ?? '', stderr: r.stderr ?? '' }
}

describe('Phase 3.3 W2 T2.1 — install-aliases e2e (R7.5 验收)', () => {
  let fx: Fixture

  beforeEach(() => {
    fx = setupFixtureCwd()
  })

  afterEach(() => {
    // tmpdir auto-cleanup on process exit; skip explicit rm for test speed
  })

  it('fixture 1 — rename redirect e2e: old-package-name → ctx7 install 通过 (R7.5)', () => {
    // aliases.yaml maps old-package-name → ctx7 (real manifest exists post-cpSync)
    writeFileSync(
      join(fx.cwd, 'manifests', 'aliases.yaml'),
      `schemaVersion: harnessed.aliases.v1
aliases:
  old-package-name:
    redirect: ctx7
    reason: upstream rename test fixture
    since_version: '0.3.0'
    deprecation_date: '2026-05-17'
`,
    )

    const { code, stdout, stderr } = runInstall(fx.cwd, 'old-package-name')
    // dry-run --system --non-interactive on resolved ctx7 (npm-cli L4) → installer
    // returns { aborted: true, reason: 'user-cancel' } per npmCli.ts L97 dry-run
    // short-circuit → exit 2. This proves: (a) alias old-package-name → ctx7
    // resolved (b) target manifest schema validated (c) installer dispatched
    // cleanly. R7.5 "install 通过" semantic: pipeline reached installer via redirect.
    // npm-cli L4 renderDiff is "(no file changes)" + cmd not in stdout (PATH-only
    // mutation, not a file diff) — so we assert on the SEMANTIC redirect-worked
    // proof (clean user-cancel abort), NOT a 'ctx7' literal in stdout.
    expect(code, `expected exit 2 (dry-run aborted), got ${code}; stderr=${stderr}`).toBe(2)
    // Original alias name does NOT appear as a manifest lookup failure
    expect(stderr).not.toMatch(/manifest .* not found/)
    // No reference to original alias name in error output (proves resolveAlias ran)
    expect(stderr).not.toMatch(/old-package-name/)
    // Aborted cleanly via the L4 system path (proves L4 install dispatched after redirect)
    expect(stderr).toMatch(/aborted: user-cancel/)
    expect(stdout).toMatch(/L4 system install/)
  })

  it('fixture 2 — unknown name + no alias: install 失败 fail-loud (Karpathy)', () => {
    writeFileSync(
      join(fx.cwd, 'manifests', 'aliases.yaml'),
      `schemaVersion: harnessed.aliases.v1
aliases: {}
`,
    )

    const { code, stderr } = runInstall(fx.cwd, 'nonexistent-name-xyz')
    expect(code, 'expected exit 1 for unknown name').toBe(1)
    expect(stderr).toMatch(/manifest .* not found/)
  })

  it('fixture 3 — alias 存在但 redirect target missing: install 失败 fail-loud (not crash)', () => {
    writeFileSync(
      join(fx.cwd, 'manifests', 'aliases.yaml'),
      `schemaVersion: harnessed.aliases.v1
aliases:
  some-old:
    redirect: missing-manifest-xyz
    reason: target deliberately missing for fail-loud test
    since_version: '0.3.0'
    deprecation_date: '2026-05-17'
`,
    )

    const { code, stderr } = runInstall(fx.cwd, 'some-old')
    expect(code, 'expected exit 1 when redirect target manifest missing').toBe(1)
    expect(stderr).toMatch(/manifest .* not found/)
    // Fail-loud, not crash — stderr is a clean error message, not a stack trace
    expect(stderr).not.toMatch(/TypeError|undefined is not a function|Cannot read prop/)
  })
})
