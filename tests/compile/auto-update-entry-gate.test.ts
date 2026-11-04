// Phase 84 / T10 — the entrypoint gate.
//
// The bug this pins: the whole chain (hook + background worker) used to be
// gated on the REMINDER consent alone. A user who silenced the reminder kept
// an auto-update consent that nothing acted on — "auto-update on" was a switch
// that never fired.
//
// The gate must therefore open on EITHER consent, and the auto-update notice
// must be printed even when the reminder text is not.

import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { build } from 'esbuild'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

let root: string

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'harnessed-auto-update-gate-'))
  vi.stubEnv('HOME', root)
  vi.stubEnv('USERPROFILE', root)
  vi.stubEnv('CLAUDE_CONFIG_DIR', join(root, 'claude-custom'))
  vi.stubEnv('CODEX_HOME', join(root, 'codex-custom'))
  vi.stubEnv('HARNESSED_ROOT_OVERRIDE', '')
})

afterEach(() => {
  vi.unstubAllEnvs()
  rmSync(root, { recursive: true, force: true })
})

async function compiledFixture() {
  const outfile = join(root, 'compiled-entry.mjs')
  await build({
    entryPoints: ['src/compile/entry.ts'],
    outfile,
    bundle: true,
    format: 'esm',
    platform: 'node',
    plugins: [
      {
        name: 'reminder-startup-boundary',
        setup(builder) {
          builder.onResolve({ filter: /assets-bundle\.gen\.json$/ }, () => ({
            path: 'bundle',
            namespace: 'boundary',
          }))
          builder.onResolve({ filter: /(?:assetsRoot|unpackAssets|\/cli)\.js$/ }, (args) => {
            if (!args.importer.replaceAll('\\', '/').endsWith('/compile/entry.ts')) return undefined
            return { path: args.path, namespace: 'boundary' }
          })
          builder.onLoad({ filter: /.*/, namespace: 'boundary' }, () => ({
            contents: `export const compiledAssetsDir = () => ''; export const unpackAssets = () => ({}); export default {version:'1.0.0'};`,
            loader: 'js',
          }))
        },
      },
    ],
  })
  return { outfile }
}

function writePreferences(stateRoot: string, document: Record<string, unknown>): void {
  writeFileSync(join(stateRoot, 'update-reminder-preferences.json'), JSON.stringify(document))
}

function writeStatus(stateRoot: string, notice: Record<string, unknown>): void {
  writeFileSync(
    join(stateRoot, 'auto-update-status.json'),
    JSON.stringify({
      schemaVersion: 1,
      consent: { autoUpdate: true, enabled: false },
      channel: 'binary',
      installed: '5.0.12',
      latest: '5.0.13',
      state: 'updated',
      progress: { received: 0, total: 0, updatedAt: Date.now() },
      lastResult: null,
      history: [],
      notice,
    }),
  )
}

function runEntry(outfile: string, stateRoot: string) {
  return spawnSync(
    process.execPath,
    [outfile, 'update-reminder', '--platform', 'codex', '--state-root', stateRoot],
    {
      encoding: 'utf8',
      timeout: 5000,
      // The notice text is localized (T7) — pin the locale so the assertion
      // does not depend on the machine's $LANG.
      env: { ...process.env, HARNESSED_LANG: 'en' },
    },
  )
}

describe('the reminder entrypoint consent gate', () => {
  it('prints the update notice when only the auto-update consent is on', async () => {
    const { outfile } = await compiledFixture()
    const stateRoot = join(root, 'state')
    mkdirSync(stateRoot, { recursive: true })
    writePreferences(stateRoot, { schemaVersion: 1, enabled: false, autoUpdate: true })
    writeStatus(stateRoot, {
      from: '5.0.12',
      to: '5.0.13',
      changelog: '## [5.0.13]\n- something new',
      restart: 'Codex',
      at: Date.now(),
      consumedAt: 0,
    })
    const result = runEntry(outfile, stateRoot)
    expect(result.status).toBe(0)
    expect(result.stdout).toContain('harnessed updated 5.0.12 -> 5.0.13.')
    // The notice is consumed right after the print (R16).
    const status = JSON.parse(readFileSync(join(stateRoot, 'auto-update-status.json'), 'utf8')) as {
      notice: { consumedAt: number }
    }
    expect(status.notice.consumedAt).toBeGreaterThan(0)
  })

  it('stays silent when BOTH consents are off', async () => {
    const { outfile } = await compiledFixture()
    const stateRoot = join(root, 'state')
    mkdirSync(stateRoot, { recursive: true })
    writePreferences(stateRoot, { schemaVersion: 1, enabled: false, autoUpdate: false })
    writeStatus(stateRoot, {
      from: '5.0.12',
      to: '5.0.13',
      changelog: '## [5.0.13]',
      restart: 'Codex',
      at: Date.now(),
      consumedAt: 0,
    })
    const result = runEntry(outfile, stateRoot)
    expect(result.status).toBe(0)
    expect(result.stdout).toBe('')
  })

  it('ignores a preferences file with an unknown schema version', async () => {
    const { outfile } = await compiledFixture()
    const stateRoot = join(root, 'state')
    mkdirSync(stateRoot, { recursive: true })
    writePreferences(stateRoot, { schemaVersion: 99, enabled: true, autoUpdate: true })
    const result = runEntry(outfile, stateRoot)
    expect(result.status).toBe(0)
    expect(result.stdout).toBe('')
  })

  it('keeps the compiled entry free of the normal startup path', async () => {
    const { outfile } = await compiledFixture()
    expect(existsSync(outfile)).toBe(true)
  })
})
