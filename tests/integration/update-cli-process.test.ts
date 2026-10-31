import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import {
  chmod,
  copyFile,
  cp,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { delimiter, dirname, isAbsolute, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import pkg from '../../package.json' with { type: 'json' }
import {
  createUpdateContinuation,
  encodeUpdateContinuation,
} from '../../src/cli/lib/updateContinuation.js'
import { acquireUpdateLock } from '../../src/cli/lib/updateLock.js'
import type { UpdateResult } from '../../src/cli/lib/updateResult.js'

const builtCli = resolve('dist/cli.mjs')
const preloadSource = `
import cp from 'node:child_process'
import { appendFileSync, writeFileSync } from 'node:fs'
import { syncBuiltinESMExports } from 'node:module'
import { join } from 'node:path'
import { promisify } from 'node:util'
const realSpawn = cp.spawn
const realSpawnSync = cp.spawnSync
const realExecFile = cp.execFile
const mode = process.env.UPDATE_FIXTURE_MODE
const version = process.env.UPDATE_FIXTURE_VERSION
const record = (kind, args) => appendFileSync(process.env.UPDATE_FIXTURE_CALLS, JSON.stringify({kind, args}) + '\\n')
const query = async (...args) => {
  record('query', args.slice(0, 2))
  if (mode === 'offline') throw new Error('fixture offline')
  const value = Array.isArray(args[1]) && args[1][0] === 'info' ? JSON.stringify(version) : version
  return { stdout: value + '\\n', stderr: '' }
}
cp.exec = Object.assign(() => { throw new Error('unexpected callback exec') }, { [promisify.custom]: query })
cp.execFile = Object.assign((file, args, options, callback) => {
  if (args.includes('runtime-identity')) return realExecFile(file, args, options, callback)
  throw new Error('unexpected callback execFile')
}, { [promisify.custom]: query })
cp.execFileSync = (file, args, options) => {
  record('sync', [file, args, options])
  if (args.includes('--version')) return version + '\\n'
  if (args.includes('--internal-update-identity')) return version
  const command = args.join(' ')
  if (!command.includes('harnessed@latest')) {
    if (mode === 'probe-fail') throw new Error('fixture npm probe timeout')
    if (mode === 'probe-malformed') return 'relative/global/root'
    return command.includes('root') ? process.env.UPDATE_FIXTURE_MODULES : process.env.UPDATE_FIXTURE_PREFIX
  }
  if (mode === 'fatal') throw new Error('fixture fatal self-update')
  realSpawnSync(process.execPath, ['-e', 'console.log("fixture child stdout"); console.error("fixture child stderr")'], { stdio: options.stdio })
  return ''
}
cp.spawn = (file, args, options) => {
  record('spawn', [file, args, { cwd: options.cwd, shell: options.shell }])
  if (mode.startsWith('gsd-')) {
    const command = args.join(' ')
    if (command.includes('app-server')) throw new Error('fixture hook trust unavailable')
    if (command.includes('plugin')) {
      const output = command.includes('list')
        ? JSON.stringify({ installed: [{ pluginId: 'harnessed-update-reminder@harnessed-local', installed: true, enabled: true }] })
        : ''
      return realSpawn(process.execPath, ['-e', 'process.stdout.write(process.env.UPDATE_FIXTURE_OUTPUT)'], {
        ...options, windowsVerbatimArguments: false, env: { ...options.env, UPDATE_FIXTURE_OUTPUT: output },
      })
    }
    if (command.includes('@opengsd/gsd-core@latest')) {
      writeFileSync(join(options.env.CODEX_HOME, 'gsd-core', 'bin', 'version'), mode === 'gsd-updated' ? '1.1.0' : '1.0.0')
      return realSpawn(process.execPath, ['-e', 'console.error("fixture GSD installed")'], options)
    }
  }
  if (!args.includes('--update-continuation')) throw new Error('unexpected adapter installer')
  if (mode === 'spawn-fail') throw new Error('fixture P2 spawn failed')
  if (['unsupported', 'retained', 'malformed', 'multiple', 'identity-mismatch'].includes(mode)) {
    const continuation = JSON.parse(Buffer.from(args.at(-1), 'base64url').toString('utf8'))
    const result = {
      schemaVersion: 1, operation: 'update', mode: 'apply', host: continuation.host, runtime: continuation.runtime,
      status: 'partial', components: [{ id: 'gsd', status: mode === 'retained' ? 'retained' : 'unsupported', before: '1.0.0', target: null, after: '1.0.0', reasonCode: 'fixture-upstream', verified: true, restartRequired: false }], warnings: [], error: null,
    }
    if (mode === 'identity-mismatch') result.host = 'claude'
    const text = mode === 'malformed' ? 'not-json' : JSON.stringify(result) + (mode === 'multiple' ? '\\n{}' : '')
    return realSpawn(process.execPath, ['-e', 'process.stderr.write("fixture P2 log\\\\n"); process.stdout.write(process.env.UPDATE_FIXTURE_OUTPUT); process.exitCode = 1'], { ...options, env: { ...options.env, UPDATE_FIXTURE_OUTPUT: text } })
  }
  return realSpawn(file, args, options)
}
if (process.argv.includes('--update-continuation')) process.stderr.write('fixture fresh P2 log\\n')
syncBuiltinESMExports()
`

describe('built update CLI process contract', () => {
  let cli: string
  let root: string
  let home: string
  let calls: string
  let env: NodeJS.ProcessEnv

  beforeEach(async () => {
    expect(existsSync(builtCli), 'Run corepack pnpm build before process tests').toBe(true)
    root = await mkdtemp(join(tmpdir(), 'harnessed-update-process-'))
    home = join(root, 'home')
    calls = join(root, 'calls.jsonl')
    const prefix = join(root, 'prefix space & 100% (global)')
    const modules = join(prefix, ...(process.platform === 'win32' ? [] : ['lib']), 'node_modules')
    const packageRoot = join(modules, 'harnessed')
    await mkdir(packageRoot, { recursive: true })
    await cp(resolve('dist'), join(packageRoot, 'dist'), { recursive: true })
    await symlink(
      resolve('node_modules'),
      join(packageRoot, 'node_modules'),
      process.platform === 'win32' ? 'junction' : 'dir',
    )
    await writeFile(
      join(packageRoot, 'package.json'),
      JSON.stringify({ ...pkg, bin: { harnessed: './dist/cli.mjs' } }),
    )
    cli = join(packageRoot, 'dist', 'cli.mjs')
    const tools = join(root, 'tools')
    await mkdir(tools)
    const manager = join(tools, process.platform === 'win32' ? 'npm.cmd' : 'npm')
    await writeFile(manager, process.platform === 'win32' ? '@echo off\n' : '#!/bin/sh\n')
    await chmod(manager, 0o755)
    const assets = join(root, 'assets')
    await mkdir(join(home, '.harnessed'), { recursive: true })
    await writeFile(join(home, '.harnessed', 'keep'), 'legacy state must not migrate')
    await mkdir(join(assets, 'manifests', 'tools'), { recursive: true })
    await mkdir(join(assets, 'manifests', 'skill-packs'), { recursive: true })
    await cp(resolve('workflows'), join(assets, 'workflows'), { recursive: true })
    await copyFile(
      resolve('manifests/skill-packs/gsd.yaml'),
      join(assets, 'manifests', 'skill-packs', 'gsd.yaml'),
    )
    const preload = join(root, 'fixture.mjs')
    await writeFile(preload, preloadSource)
    env = {
      ...process.env,
      PATH: `${tools}${delimiter}${process.env.PATH ?? ''}`,
      HOME: home,
      USERPROFILE: home,
      CODEX_HOME: join(home, '.codex'),
      CLAUDE_CONFIG_DIR: join(home, '.claude'),
      HARNESSED_PLATFORM: 'codex',
      HARNESSED_ROOT_OVERRIDE: join(home, 'state'),
      HARNESSED_SPAWN_CWD: home,
      HARNESSED_ASSETS_OVERRIDE: assets,
      NODE_OPTIONS: `--import=${pathToFileURL(preload).href}`,
      UPDATE_FIXTURE_MODE: 'current',
      UPDATE_FIXTURE_VERSION: pkg.version,
      UPDATE_FIXTURE_CALLS: calls,
      UPDATE_FIXTURE_PREFIX: prefix,
      UPDATE_FIXTURE_MODULES: modules,
    }
  })

  afterEach(async () => {
    await rm(root, { recursive: true, force: true })
  })

  function run(args: string[], overrides: NodeJS.ProcessEnv = {}) {
    const child = spawnSync(process.execPath, [cli, 'update', ...args], {
      cwd: home,
      env: { ...env, ...overrides },
      encoding: 'utf8',
      timeout: 30_000,
      windowsHide: true,
    })
    expect(child.error).toBeUndefined()
    expect(child.signal).toBeNull()
    expect(child.stdout, child.stderr).not.toBe('')
    const result = JSON.parse(child.stdout) as UpdateResult
    expect(child.stdout.trim().split('\n')).toHaveLength(1)
    expect(result).toMatchObject({ schemaVersion: 1, operation: 'update' })
    return { ...child, result }
  }

  async function recordedCalls() {
    try {
      return (await readFile(calls, 'utf8'))
        .trim()
        .split('\n')
        .filter(Boolean)
        .map((line) => JSON.parse(line))
    } catch {
      return []
    }
  }

  it.each([
    true,
    false,
  ])('matching npm global target pins prefix for mutation in JSON=%s entry', async (json) => {
    const child = spawnSync(process.execPath, [cli, 'update', ...(json ? ['--json'] : [])], {
      cwd: home,
      env: { ...env, UPDATE_FIXTURE_VERSION: '99.0.0' },
      encoding: 'utf8',
      timeout: 30_000,
      windowsHide: true,
    })
    expect(child.status).toBe(0)
    if (json)
      expect(JSON.parse(child.stdout).components[0]).toMatchObject({
        status: 'updated',
        after: '99.0.0',
      })
    else expect(child.stdout).toContain('Restart Codex')
    const synced = (await recordedCalls()).filter((call) => call.kind === 'sync')
    expect(synced).toHaveLength(json ? 4 : 3)
    expect(synced[0].args[0]).toBe(synced[1].args[0])
    expect(synced[1].args[0]).toBe(synced[2].args[0])
    expect(synced[2].args[1].join(' ')).toContain('--prefix')
    expect(synced[2].args[1].join(' ')).toContain(process.platform === 'win32' ? '100^^^%' : '100%')
    expect(synced[2].args[2]).toMatchObject({ shell: false, cwd: home })
    if (json) expect(synced[3].args[1]).toEqual([cli, '--internal-update-identity'])
  })

  describe.each([true, false])('target binding in JSON=%s entry', (json) => {
    it.each([
      ['mismatch', 'package-target-mismatch'],
      ['probe-fail', 'package-target-unproven'],
      ['probe-malformed', 'package-target-unproven'],
      ['linked', 'package-layout-unsupported'],
      ['bun', 'package-target-unproven'],
    ])('rejects %s without installer, P2, upstream mutation or host writes', async (mode, reason) => {
      const before = await readdir(home, { recursive: true })
      const overrides: NodeJS.ProcessEnv = {
        UPDATE_FIXTURE_VERSION: '99.0.0',
        UPDATE_FIXTURE_MODE: mode,
      }
      if (mode === 'mismatch' || mode === 'linked') {
        const other = join(root, 'other', 'node_modules')
        await mkdir(other, { recursive: true })
        if (mode === 'linked')
          await symlink(
            resolve(cli, '..', '..'),
            join(other, 'harnessed'),
            process.platform === 'win32' ? 'junction' : 'dir',
          )
        else await mkdir(join(other, 'harnessed'))
        overrides.UPDATE_FIXTURE_MODULES = other
      }
      const args = [
        ...(json ? ['--all', '--json'] : []),
        ...(mode === 'bun' ? ['--package-manager', 'bun'] : []),
      ]
      const child = spawnSync(process.execPath, [cli, 'update', ...args], {
        cwd: home,
        env: { ...env, ...overrides },
        encoding: 'utf8',
        timeout: 30_000,
        windowsHide: true,
      })
      expect(child.status, child.stderr + child.stdout).toBe(1)
      if (json) {
        expect(child.stdout.trim().split('\n')).toHaveLength(1)
        expect(JSON.parse(child.stdout).components).toEqual([
          expect.objectContaining({
            id: 'harnessed',
            status: 'failed',
            verified: false,
            reasonCode: reason,
          }),
        ])
      } else expect(child.stderr).toContain(reason)
      const recorded = await recordedCalls()
      expect(recorded.some((call) => call.kind === 'spawn')).toBe(false)
      expect(
        recorded.some(
          (call) => call.kind === 'sync' && call.args[1].join(' ').includes('harnessed@latest'),
        ),
      ).toBe(false)
      expect(await readdir(home, { recursive: true })).toEqual(before)
    })
  })

  it.each([
    ['--json', '--platform', 'other'],
    ['--json', '--unknown'],
    ['--json', '--package-manager', 'yarn'],
    ['--json', '--package-manager'],
    ['--json', '--check', '--dry-run'],
    ['--json', '--all', '--rollback'],
  ])('argument error %j returns one envelope and exit 2 before execution', async (...args) => {
    const child = run(args)
    expect(child.status).toBe(2)
    expect(child.result.error?.kind).toBe('arguments')
    expect(await recordedCalls()).toEqual([])
    expect(existsSync(join(home, '.harnessed', 'keep'))).toBe(true)
  })

  it.each([
    '--check',
    '--dry-run',
  ])('%s --all never installs, locks, migrates or writes the host target', async (flag) => {
    const before = await readdir(home, { recursive: true })
    const child = run(['--json', '--all', flag], { UPDATE_FIXTURE_VERSION: '99.0.0' })
    expect(child.status).toBe(0)
    expect(child.result.status).toBe('planned')
    expect(child.result.components.find((entry) => entry.id === 'gsd')?.status).toBe(
      'not-installed',
    )
    expect((await recordedCalls()).map((call) => call.kind)).toEqual(['query'])
    expect(await readdir(home, { recursive: true })).toEqual(before)
  })

  it('current --all executes fresh absolute P2, missing GSD is never installed, child logs stay on stderr', async () => {
    const child = run(['--all', '--json', '--non-interactive', '--platform', 'codex'])
    expect(child.status).toBe(0)
    expect(child.result.status).toBe('complete')
    expect(child.result.components.find((entry) => entry.id === 'gsd')?.status).toBe(
      'not-installed',
    )
    expect(child.stderr).toContain('fixture fresh P2 log')
    const spawned = (await recordedCalls()).filter((call) => call.kind === 'spawn')
    expect(spawned).toHaveLength(1)
    expect(isAbsolute(spawned[0].args[0])).toBe(true)
    expect(spawned[0].args[1][0]).toBe(cli)
    expect(spawned[0].args[2].shell).toBe(false)
    expect(existsSync(join(home, '.agents', 'skills', 'harnessed-update', 'SKILL.md'))).toBe(true)
    expect(existsSync(join(home, '.codex', 'prompts', 'harnessed-update.md'))).toBe(true)
    expect(existsSync(join(home, '.harnessed', 'keep'))).toBe(true)
    expect(existsSync(join(home, '.codex', 'gsd-core'))).toBe(false)
  })

  it.each([
    ['en', 'zh-Hans', 'en', '## Overview'],
    ['zh-CN', 'en', 'zh-Hans', '## 概述'],
  ])('explicit --lang %s survives fresh P2 against ambient %s', async (lang, ambient, canonical, heading) => {
    const assets = join(root, 'language-assets')
    const workflows = join(assets, 'workflows')
    await mkdir(workflows, { recursive: true })
    await cp(join(root, 'assets', 'manifests'), join(assets, 'manifests'), { recursive: true })
    const source = join(root, 'assets', 'workflows')
    for (const entry of await readdir(source, { withFileTypes: true })) {
      if (entry.isFile() || ['harnessed-update', 'disciplines', 'judgments'].includes(entry.name))
        await cp(join(source, entry.name), join(workflows, entry.name), { recursive: true })
    }
    const child = run(['--all', '--json', '--lang', lang], {
      HARNESSED_LANG: ambient,
      HARNESSED_ASSETS_OVERRIDE: assets,
    })
    expect(child.status, `${child.stderr}${child.stdout}`).toBe(0)
    expect(child.result.status).toBe('complete')
    expect(child.stderr).toContain('fixture fresh P2 log')
    const spawned = (await recordedCalls()).filter((call) => call.kind === 'spawn')
    expect(spawned).toHaveLength(1)
    const args = spawned[0].args[1] as string[]
    expect(args.slice(1, 5)).toEqual(['--lang', canonical, 'update', '--update-continuation'])
    expect(JSON.parse(Buffer.from(args.at(-1) ?? '', 'base64url').toString('utf8')).lang).toBe(
      canonical,
    )
    expect(spawned[0].args[2].shell).toBe(false)
    expect(
      await readFile(join(home, '.agents', 'skills', 'harnessed-update', 'SKILL.md'), 'utf8'),
    ).toContain(heading)
    expect(
      await readFile(join(home, '.codex', 'prompts', 'harnessed-update.md'), 'utf8'),
    ).toContain(canonical === 'en' ? 'Preview, confirm' : '预览、确认')
  })

  it('P2 refreshes first-party workflows and Claude hooks before reporting success', async () => {
    const assets = join(root, 'assets')
    await mkdir(join(assets, 'manifests', 'cc-hooks'), { recursive: true })
    await mkdir(join(assets, 'bin'))
    await copyFile(
      resolve('manifests/cc-hooks/update-reminder.yaml'),
      join(assets, 'manifests', 'cc-hooks', 'update-reminder.yaml'),
    )
    await copyFile(
      resolve('bin/harnessed-update-reminder.mjs'),
      join(assets, 'bin', 'harnessed-update-reminder.mjs'),
    )
    const child = run(['--all', '--json', '--platform', 'claude'])
    expect(child.status).toBe(0)
    expect(
      await readFile(join(home, '.claude', 'skills', 'harnessed-update', 'SKILL.md'), 'utf8'),
    ).toContain('harnessed update')
    expect(await readFile(join(home, '.claude', 'settings.json'), 'utf8')).toContain(
      'harnessed-update-reminder',
    )
    expect(
      child.result.components.some((entry) => entry.id === 'harnessed-workflows' && entry.verified),
    ).toBe(true)
    expect(existsSync(join(home, '.harnessed', 'keep'))).toBe(true)
    expect(existsSync(join(home, '.claude', 'gsd-core'))).toBe(false)
  })

  it('P2 preserves reminder opt-out and never invokes the base profile for missing third parties', async () => {
    await mkdir(join(home, 'state'))
    await writeFile(
      join(home, 'state', 'update-reminder-preferences.json'),
      JSON.stringify({ schemaVersion: 1, enabled: false }),
    )
    const child = run(['--all', '--json', '--platform', 'claude'])
    expect(child.status).toBe(0)
    expect(existsSync(join(home, '.claude', 'settings.json'))).toBe(false)
    expect(
      JSON.parse(await readFile(join(home, 'state', 'update-reminder-preferences.json'), 'utf8'))
        .enabled,
    ).toBe(false)
    expect(existsSync(join(home, '.claude', 'skills', 'harnessed-update', 'SKILL.md'))).toBe(true)
    expect(
      (await recordedCalls())
        .filter((call) => call.kind === 'sync')
        .every((call) => !call.args[1].includes('harnessed@latest')),
    ).toBe(true)
  })

  it.each([
    'current',
    'updated',
  ] as const)('P2 retains an untrusted reminder while GSD is %s and exits partial 1', async (status) => {
    const hooks = join(root, 'assets', 'manifests', 'cc-hooks')
    await mkdir(hooks, { recursive: true })
    await copyFile(
      resolve('manifests/cc-hooks/update-reminder.yaml'),
      join(hooks, 'update-reminder.yaml'),
    )
    const nativeHome = join(home, '.codex')
    const runtime = join(nativeHome, 'gsd-core', 'bin')
    await mkdir(runtime, { recursive: true })
    await writeFile(join(runtime, 'version'), '1.0.0')
    await writeFile(
      join(runtime, 'gsd-tools.cjs'),
      `
if (process.argv[2] !== 'runtime-identity') process.exit(2)
console.log(JSON.stringify({ packageName: '@opengsd/gsd-core', version: require('node:fs').readFileSync(require('node:path').join(__dirname, 'version'), 'utf8') }))
`,
    )
    for (const resource of [
      'skills/gsd-plan-phase/SKILL.md',
      'gsd-core/workflows/discuss-phase.md',
      'gsd-core/workflows/plan-phase.md',
      'gsd-core/workflows/execute-phase.md',
      'gsd-core/workflows/verify-work.md',
      'gsd-core/workflows/progress.md',
      'gsd-core/references/ui-brand.md',
      'agents/gsd-phase-researcher.toml',
      'agents/gsd-planner.toml',
      'agents/gsd-plan-checker.toml',
      'agents/gsd-executor.toml',
      'agents/gsd-verifier.toml',
    ]) {
      const path = join(nativeHome, resource)
      await mkdir(dirname(path), { recursive: true })
      await writeFile(path, 'fixture = "GSD runtime resource"\n')
    }
    const child = run(['--all', '--json', '--non-interactive', '--platform', 'codex'], {
      UPDATE_FIXTURE_MODE: `gsd-${status}`,
    })
    expect(child.status).toBe(1)
    expect(child.result.status).toBe('partial')
    expect(child.result.error).toBeNull()
    expect(child.result.components).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'update-reminder',
          status: 'retained',
          reasonCode: 'hook-trust-pending',
          verified: false,
        }),
        expect.objectContaining({
          id: 'gsd',
          status,
          before: '1.0.0',
          after: status === 'updated' ? '1.1.0' : '1.0.0',
          verified: true,
        }),
      ]),
    )
    expect(await readFile(join(runtime, 'version'), 'utf8')).toBe(
      status === 'updated' ? '1.1.0' : '1.0.0',
    )
    const installers = (await recordedCalls()).filter(
      (call) =>
        call.kind === 'spawn' && call.args[1].join(' ').includes('@opengsd/gsd-core@latest'),
    )
    expect(installers).toHaveLength(1)
    expect(installers[0].args[1].join(' ')).toContain('--codex --global')
    expect(child.stderr).toContain('fixture GSD installed')
  })

  it('refresh failure fails closed before any adapter mutation', async () => {
    await mkdir(join(home, '.agents', 'skills'), { recursive: true })
    await writeFile(join(home, '.agents', 'skills', 'harnessed-update'), 'not a directory')
    const child = run(['--all', '--json'])
    expect(child.status).toBe(1)
    expect(child.result.components.some((entry) => entry.id === 'gsd')).toBe(false)
    expect(
      child.result.components.some(
        (entry) => entry.id === 'harnessed-workflows' && entry.status === 'failed',
      ),
    ).toBe(true)
  })

  it.each([
    'unsupported',
    'retained',
  ])('%s P2 returns partial exit 1, not a handoff error', (mode) => {
    const child = run(['--all', '--json'], { UPDATE_FIXTURE_MODE: mode })
    expect(child.status).toBe(1)
    expect(child.result.status).toBe('partial')
    expect(child.result.error).toBeNull()
    expect(child.result.components.at(-1)?.status).toBe(mode)
    expect(child.stderr).toContain('fixture P2 log')
  })

  it('fatal self exception emits one failed envelope and never starts P2', async () => {
    const child = run(['--all', '--json'], {
      UPDATE_FIXTURE_MODE: 'fatal',
      UPDATE_FIXTURE_VERSION: '99.0.0',
    })
    expect(child.status).toBe(1)
    expect(child.result.error).toMatchObject({
      kind: 'fatal',
      message: 'fixture fatal self-update',
    })
    expect((await recordedCalls()).some((call) => call.kind === 'spawn')).toBe(false)
  })

  it('P2 spawn failure preserves updated self and reports partial exit 1', () => {
    const child = run(['--all', '--json'], {
      UPDATE_FIXTURE_MODE: 'spawn-fail',
      UPDATE_FIXTURE_VERSION: '99.0.0',
    })
    expect(child.status).toBe(1)
    expect(child.result.status).toBe('partial')
    expect(child.result.components[0]).toMatchObject({ status: 'updated', after: '99.0.0' })
    expect(child.result.components[1]?.reasonCode).toBe('handoff-failed')
    expect(child.stderr).toContain('fixture child stdout')
    expect(child.stderr).toContain('fixture child stderr')
  })

  it.each([
    'malformed',
    'multiple',
    'identity-mismatch',
  ])('%s P2 envelope fails protocol with exit 2', (mode) => {
    const child = run(['--all', '--json'], { UPDATE_FIXTURE_MODE: mode })
    expect(child.status).toBe(2)
    expect(child.result.error?.kind).toBe('protocol')
  })

  it('hidden continuation refuses malformed data before querying or installing', async () => {
    const child = run(['--update-continuation', 'invalid'])
    expect(child.status).toBe(2)
    expect(child.result.error?.kind).toBe('protocol')
    expect(await recordedCalls()).toEqual([])
  })

  it('package internal identity probe is read-only even with legacy state present', async () => {
    const before = await readdir(home, { recursive: true })
    const child = spawnSync(process.execPath, [cli, '--internal-update-identity'], {
      cwd: home,
      env: { ...env, NODE_OPTIONS: '', HARNESSED_ASSETS_OVERRIDE: join(root, 'missing-assets') },
      encoding: 'utf8',
      windowsHide: true,
    })
    expect(child.status).toBe(0)
    expect(child.stdout).toBe(`${pkg.version}\n`)
    expect(child.stderr).toBe('')
    expect(await readdir(home, { recursive: true })).toEqual(before)
  })

  it('identity verification uses the internal no-migration probe and captured host context', async () => {
    const child = run(['--json', '--all', '--platform', 'codex'], { HARNESSED_PLATFORM: 'claude' })
    expect(child.status).toBe(0)
    const probes = (await recordedCalls()).filter((call) => call.kind === 'sync')
    expect(probes).toHaveLength(1)
    expect(probes[0].args[1]).toEqual([cli, '--internal-update-identity'])
    expect(probes[0].args[2].env).toMatchObject({
      HARNESSED_PLATFORM: 'codex',
      CODEX_HOME: join(home, '.codex'),
      HARNESSED_ROOT_OVERRIDE: join(home, '.codex', 'harnessed'),
    })
  })

  it('hidden continuation consumes its locked nonce once and refuses replay', async () => {
    const acquired = await acquireUpdateLock({ stateRoot: join(home, 'state'), target: cli })
    expect(acquired.status).toBe('acquired')
    if (acquired.status !== 'acquired') throw new Error('fixture lock missing')
    try {
      const encoded = encodeUpdateContinuation(
        createUpdateContinuation({
          nonce: acquired.lock.nonce,
          targetKey: acquired.lock.targetKey,
          channel: 'package',
          mode: 'apply',
          host: 'codex',
          runtime: 'node',
          scope: 'all',
          nonInteractive: true,
          json: true,
          createdAt: Date.now(),
        }),
      )
      expect(run(['--update-continuation', encoded]).status).toBe(0)
      const replayed = run(['--update-continuation', encoded])
      expect(replayed.status).toBe(2)
      expect(replayed.result.error?.message).toContain('nonce-consumed')
    } finally {
      await acquired.lock.release()
    }
  })
})
