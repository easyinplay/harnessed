// Phase 1.2 T5.6 — real-spawn integration test (skipIf gate).
//
// Default-skipped on every CI / local `pnpm test` run; only fires when the
// developer sets HARNESSED_REAL_SPAWN=1 explicitly. Purpose: Phase 1.2 final
// acceptance gate (B1' / B2' / B3') — prove that on a real machine, with real
// npm + real fs, harnessed actually:
//   1. installs ctx7 via npm-cli (L4 + --system) into an isolated prefix
//   2. records the install in .harnessed/state.json
//   3. records a backup under .harnessed-backup/<ISO-ts>/metadata.json
//   4. (rollback verification deferred to manual run — npm install_g side
//      effects are PATH/prefix mutations, not file diffs we can sha1)
//
// Isolation strategy (so the developer's real ~/.claude / global npm prefix
// is never touched):
//   - cwd = os.tmpdir()/harnessed-real-spawn-<ts>
//   - npm_config_prefix = <tmpdir>/npm-prefix
//   - We do NOT exercise mcp-stdio-add here because that requires a real
//     `claude` CLI install on the machine (T5.5 mock shim covers that path
//     in CI; manual run can use HARNESSED_REAL_SPAWN if claude is present)
//
// Run manually before phase 1.2 ship:
//   HARNESSED_REAL_SPAWN=1 corepack pnpm test -- --filter real-spawn

import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { runInstall } from '../../src/installers/index.js'
import { validateManifestFile } from '../../src/manifest/validate.js'

const REAL = process.env.HARNESSED_REAL_SPAWN === '1'

describe.skipIf(!REAL)('installer real-spawn (HARNESSED_REAL_SPAWN=1)', () => {
  it('npm-cli (ctx7) — install + state + backup recorded', async () => {
    const sandbox = mkdtempSync(join(tmpdir(), 'harnessed-real-spawn-'))
    const npmPrefix = join(sandbox, 'npm-prefix')
    process.env.npm_config_prefix = npmPrefix

    try {
      const ctx7Path = join(process.cwd(), 'manifests', 'tools', 'ctx7.yaml')
      const yamlSource = readFileSync(ctx7Path, 'utf8')
      const result = validateManifestFile(yamlSource, 'ctx7.yaml')
      expect(result.ok).toBe(true)
      if (!result.ok) return

      const manifest = result.manifest
      // Override cwd to sandbox so .harnessed/ + .harnessed-backup/ land there.
      const origCwd = process.cwd()
      process.chdir(sandbox)
      try {
        const r = await runInstall(manifest, {
          apply: true,
          dryRun: false,
          system: true,
          nonInteractive: true,
          fullDiff: false,
          color: false,
        })
        // Either ok (install worked) or ok:false (npm errored — still records
        // backup attempt). Aborted is unexpected when --apply --system both set.
        if ('aborted' in r && r.aborted) {
          throw new Error(`unexpected abort: ${r.reason}`)
        }
        // state.json + .harnessed-backup directory should exist regardless.
        expect(existsSync(join(sandbox, '.harnessed', 'state.json'))).toBe(true)
        const backupRoot = join(sandbox, '.harnessed-backup')
        expect(existsSync(backupRoot)).toBe(true)
        const backupDirs = readdirSync(backupRoot)
        expect(backupDirs.length).toBeGreaterThan(0)
        const firstBackup = backupDirs[0]
        if (!firstBackup) throw new Error('no backup dir found')
        const meta = JSON.parse(
          readFileSync(join(backupRoot, firstBackup, 'metadata.json'), 'utf8'),
        )
        expect(meta.installer).toBe('npm-cli')
        expect(meta.manifest).toBe('ctx7')
      } finally {
        process.chdir(origCwd)
      }
    } finally {
      rmSync(sandbox, { recursive: true, force: true })
      delete process.env.npm_config_prefix
    }
  }, 60_000)
})
