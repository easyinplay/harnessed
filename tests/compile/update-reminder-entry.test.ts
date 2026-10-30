import { spawnSync } from 'node:child_process'
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { build } from 'esbuild'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const api = await import('../../src/compile/updateReminderEntrypoint.js').catch(() => undefined)
let root: string
beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'harnessed-reminder-entry-'))
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

function snapshot(path: string): string[] {
  if (!existsSync(path)) return []
  return readdirSync(path, { recursive: true }).map(String).sort()
}

async function compiledFixture() {
  const outfile = join(root, 'compiled-entry.mjs')
  const marker = join(root, 'normal-cli-imported')
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
            contents: `import { writeFileSync } from 'node:fs'; writeFileSync(${JSON.stringify(marker)}, 'bad'); throw new Error('normal startup forbidden'); export const compiledAssetsDir = () => ''; export const unpackAssets = () => ({}); export default {version:'1.0.0'};`,
            loader: 'js',
          }))
        },
      },
    ],
  })
  return { outfile, marker }
}

describe('fixed pre-assets reminder dispatch', () => {
  it('uses an explicit custom Codex state root after ambient root env is unavailable', async () => {
    const { outfile } = await compiledFixture()
    const stateRoot = join(root, "custom state's root $;&")
    vi.stubEnv('HARNESSED_ROOT_OVERRIDE', stateRoot)
    const runtime = api?.resolveUpdateReminderRuntime({
      args: ['--platform', 'codex'],
      compiled: true,
    })
    expect(runtime).toBeDefined()
    if (!runtime) return
    mkdirSync(stateRoot, { recursive: true })
    writeFileSync(
      join(stateRoot, 'update-reminder-preferences.json'),
      '{"schemaVersion":1,"enabled":true}',
    )
    writeFileSync(
      join(stateRoot, 'update-reminder-codex.json'),
      JSON.stringify({
        schemaVersion: 1,
        identity: runtime.identity,
        installed: runtime.installed,
        latest: '99.99.99',
        state: 'behind',
        checkedAt: Date.now(),
        retryAfter: 0,
      }),
    )
    const env = { ...process.env }
    delete env.CODEX_HOME
    delete env.HARNESSED_ROOT_OVERRIDE
    const result = spawnSync(
      process.execPath,
      [outfile, 'update-reminder', '--platform', 'codex', '--state-root', stateRoot],
      { encoding: 'utf8', timeout: 5000, env },
    )
    expect(result.status).toBe(0)
    expect(result.stdout).toContain('Harnessed update available:')
    expect(result.stderr).toBe('')
    writeFileSync(
      join(stateRoot, 'update-reminder-preferences.json'),
      '{"schemaVersion":1,"enabled":false}',
    )
    const disabled = spawnSync(
      process.execPath,
      [outfile, 'update-reminder', '--platform', 'codex', '--state-root', stateRoot],
      { encoding: 'utf8', timeout: 5000, env },
    )
    expect(disabled.status).toBe(0)
    expect(disabled.stdout).toBe('')
    expect(disabled.stderr).toBe('')
  })

  it.each([
    'missing',
    'unwritable',
  ] as const)('bypasses assets and migrations with a %s assets root', async (kind) => {
    const { outfile, marker } = await compiledFixture()
    const assets = join(root, 'assets')
    if (kind === 'unwritable') writeFileSync(assets, 'not a directory')
    const before = snapshot(root)
    const result = spawnSync(
      process.execPath,
      [outfile, 'update-reminder', '--platform', 'codex'],
      {
        encoding: 'utf8',
        timeout: 5000,
        env: {
          ...process.env,
          HARNESSED_ASSETS_OVERRIDE: assets,
          HARNESSED_ROOT_OVERRIDE: join(assets, 'state'),
        },
      },
    )
    expect(result.status).toBe(0)
    expect(result.stdout).toBe('')
    expect(result.stderr).toBe('')
    expect(existsSync(marker)).toBe(false)
    expect(snapshot(root)).toEqual(before)
  })

  it('does not recognize an arbitrary internal operation or module path', async () => {
    const { outfile, marker } = await compiledFixture()
    const result = spawnSync(
      process.execPath,
      [outfile, 'update-reminder-other', '--entry', 'evil.mjs'],
      { encoding: 'utf8' },
    )
    expect(result.status).not.toBe(0)
    expect(existsSync(marker)).toBe(true)
  })

  it('fails softly for invalid arguments without entering normal startup', async () => {
    const { outfile, marker } = await compiledFixture()
    const result = spawnSync(
      process.execPath,
      [outfile, 'update-reminder', '--platform', 'other', '--entry', 'evil.mjs'],
      { encoding: 'utf8' },
    )
    expect(result.status).toBe(0)
    expect(result.stdout).toBe('')
    expect(result.stderr).toBe('')
    expect(existsSync(marker)).toBe(false)
  })
})

describe('reminder runtime contract', () => {
  it.each([
    false,
    true,
  ])('forwards the fixed state root to the worker (compiled=%s)', (compiled) => {
    const stateRoot = join(root, 'fixed state')
    const runtime = api?.resolveUpdateReminderRuntime({
      args: ['--platform', 'codex', '--state-root', stateRoot],
      compiled,
    })
    expect(runtime?.worker.args.slice(-2)).toEqual(['--state-root', stateRoot])
    vi.stubEnv('CODEX_HOME', join(root, 'wrong native home'))
    vi.stubEnv('HARNESSED_ROOT_OVERRIDE', join(root, 'wrong state'))
    const worker = api?.resolveUpdateReminderRuntime({
      args: runtime?.worker.args.slice(1),
      compiled,
    })
    expect(worker?.cachePath).toBe(join(stateRoot, 'update-reminder-codex.json'))
    expect(worker?.identity).toEqual(runtime?.identity)
  })

  it.each([
    ['--state-root'],
    ['--state-root', 'relative'],
    ['--platform', 'claude', '--platform', 'codex'],
    ['--platform', 'codex', '--entry', 'evil.mjs'],
    ['--state-root', '/', '--state-root', '/'],
    ['--state-root', '/bad\nroot'],
    ['--state-root', '/bad\0root'],
  ])('rejects malformed or duplicate root arguments: %j', (...args) => {
    expect(api?.resolveUpdateReminderRuntime({ args })).toBeNull()
  })

  it('resolves cache and preferences under each custom native home', () => {
    const runtime = api?.resolveUpdateReminderRuntime({ args: ['--platform', 'claude'] })
    const other = api?.resolveUpdateReminderRuntime({ args: ['--platform', 'codex'] })
    expect(runtime?.cachePath).toBe(
      join(root, 'claude-custom', 'harnessed', 'update-reminder-claude.json'),
    )
    expect(other?.cachePath).toBe(
      join(root, 'codex-custom', 'harnessed', 'update-reminder-codex.json'),
    )
    expect(runtime?.identity.fingerprint).not.toBe(other?.identity.fingerprint)
  })

  it('only reads bounded preferences and honors a persisted opt-out', async () => {
    const runtime = api?.resolveUpdateReminderRuntime({ args: ['--platform', 'claude'] })
    expect(runtime).toBeDefined()
    if (!runtime) return
    mkdirSync(dirname(runtime.preferencesPath), { recursive: true })
    writeFileSync(runtime.preferencesPath, JSON.stringify({ schemaVersion: 1, enabled: false }))
    const before = snapshot(root)
    expect(await api?.runUpdateReminderEntrypoint({ args: ['--platform', 'claude'] })).toBe(0)
    expect(snapshot(root)).toEqual(before)
  })
})

describe('standalone reminder artifacts', () => {
  it.each([
    'harnessed-update-reminder.mjs',
    'harnessed-update-reminder-worker.mjs',
  ])('%s is a runnable self-contained bin', (name) => {
    const bin = resolve('bin', name)
    expect(existsSync(bin)).toBe(true)
    if (!existsSync(bin)) return
    expect(readFileSync(bin, 'utf8')).not.toMatch(/from ['"](?:\.\.?\/|proper-lockfile)/)
    const result = spawnSync(process.execPath, [bin, '--platform', 'invalid'], {
      encoding: 'utf8',
      cwd: root,
      timeout: 5000,
    })
    expect(result.status).toBe(0)
    expect(result.stdout).toBe('')
    expect(result.stderr).toBe('')
  })
})
