import { existsSync } from 'node:fs'
import { chmod, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { binaryOnPath } from '../../src/installers/lib/binaryProbe.js'
import { isAlreadyInstalled } from '../../src/installers/lib/idempotent.js'
import { verifySkillRuntime } from '../../src/installers/lib/skillRuntime.js'
import { spawnCmd } from '../../src/installers/lib/spawn.js'
import type { InstallContext, Manifest } from '../../src/installers/lib/types.js'
import { descriptorFor } from '../../src/platform/platform.js'

describe.skipIf(process.platform !== 'linux')('Linux native runtime isolation', () => {
  let root: string
  let windows: string
  let native: string
  let trap: string

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'harnessed-native-runtime-'))
    windows = join(root, 'AppData', 'Roaming', 'npm')
    native = join(root, 'native')
    trap = join(root, 'windows-executed')
    await mkdir(windows, { recursive: true })
    await mkdir(native)
  })

  afterEach(async () => {
    vi.unstubAllEnvs()
    await rm(root, { recursive: true, force: true })
  })

  async function launcher(dir: string, name: string, body: string): Promise<string> {
    const path = join(dir, name)
    await writeFile(path, `#!/bin/sh\n${body}\n`)
    await chmod(path, 0o755)
    return path
  }

  async function windowsLauncher(name: string): Promise<string> {
    await writeFile(join(windows, `${name}.cmd`), '@echo off\r\n')
    return launcher(windows, name, `echo executed >> '${trap}'; echo Windows`)
  }

  function context(path: string): InstallContext {
    return {
      cwd: root,
      level: 'L4',
      opts: {
        apply: true,
        dryRun: false,
        system: false,
        nonInteractive: true,
        fullDiff: false,
        color: false,
      },
      manifest: {
        apiVersion: 'harnessed/v1',
        kind: 'Manifest',
        metadata: {
          name: 'ctx7',
          description: 'native runtime fixture',
          upstream: {
            source: 'ctx7',
            homepage: 'https://example.com',
            repository: 'https://example.com/ctx7',
            license: 'MIT',
            notice: 'fixture',
          },
        },
        spec: {
          type: 'cli-npm',
          component_type: 'cli-binary',
          category: 'search',
          install_type: 'npm',
          install: {
            method: 'npm-cli',
            cmd: 'npm install -g ctx7',
            npm_version: '^1.0.0',
            idempotent_check: 'command -v ctx7',
            env: { PATH: path },
          },
          verify: { cmd: 'ctx7 --version' },
          uninstall: { cmd: 'npm uninstall -g ctx7' },
          upstream_health: {
            stability: 'stable',
            last_check: '2026-10-29',
            last_known_good_version: '1.0.0',
            fallback_action: 'warn',
          },
          signed_by: 'fixture',
          platforms: ['linux'],
        },
      } as Manifest,
    }
  }

  it.each([
    'npm',
    'npx',
    'node',
    'ctx7',
    'ctx7.cmd',
    'ctx7.bat',
    'ctx7.exe',
  ])('rejects an only-Windows %s without executing its trap', async (name) => {
    await windowsLauncher(name)
    const result = await spawnCmd(context(windows), `${name} --version`, [])
    expect(result).toMatchObject({
      ok: false,
      phase: 'preflight',
      error: { keyword: 'native-tool-windows' },
    })
    expect(existsSync(trap)).toBe(false)
  })

  it('fails closed for Windows-first/native-later instead of skipping the first hit', async () => {
    await windowsLauncher('npm')
    await launcher(native, 'npm', 'echo native')
    await launcher(native, 'node', 'echo v22.0.0')
    const result = await spawnCmd(context(`${windows}:${native}`), 'npm --version', [])
    expect(result).toMatchObject({ ok: false, error: { keyword: 'native-tool-windows' } })
    expect(existsSync(trap)).toBe(false)
  })

  it('allows native-first execution and leaves the inherited PATH untouched', async () => {
    await windowsLauncher('npm')
    await launcher(native, 'npm', 'printf "%s" "$PATH"')
    await launcher(native, 'node', 'echo v22.0.0')
    const path = `${native}:${windows}:/mnt/c/unrelated-tools`
    const result = await spawnCmd(context(path), 'npm --version', [])
    expect(result).toMatchObject({ ok: true, exitCode: 0, stdout: path })
    expect(existsSync(trap)).toBe(false)
  })

  it('does not count a Windows ctx7 wrapper as installed', async () => {
    await windowsLauncher('ctx7')
    vi.stubEnv('PATH', windows)
    expect(binaryOnPath('ctx7')).toBe(false)
    expect(await isAlreadyInstalled(context(windows))).toBe(false)
    expect(existsSync(trap)).toBe(false)
  })

  it('does not require which to probe a native CLI', async () => {
    await launcher(native, 'ctx7', 'echo native')
    vi.stubEnv('PATH', `${native}:/mnt/c/unrelated-tools`)
    expect(binaryOnPath('ctx7')).toBe(true)
  })

  it('reports missing native Node separately from network failures', async () => {
    await launcher(native, 'npm', 'echo should-not-run')
    const result = await spawnCmd(context(native), 'npm --version', [])
    expect(result).toMatchObject({
      ok: false,
      phase: 'preflight',
      error: {
        keyword: 'native-runtime-missing',
        message: expect.stringMatching(/Linux.*Node.*22/),
      },
    })
    if ('error' in result) expect(result.error.message).not.toMatch(/GitHub|timed out/i)
  })

  it('does not accept a native Node CLI when its interpreter is a Windows shim', async () => {
    await windowsLauncher('node')
    await writeFile(join(native, 'ctx7'), '#!/usr/bin/env node\nconsole.log("native CLI")\n')
    await chmod(join(native, 'ctx7'), 0o755)
    vi.stubEnv('PATH', `${native}:${windows}`)
    expect(binaryOnPath('ctx7')).toBe(false)
    const result = await spawnCmd(context(process.env.PATH ?? ''), 'ctx7 --version', [])
    expect(result).toMatchObject({ ok: false, error: { keyword: 'native-tool-windows' } })
    expect(existsSync(trap)).toBe(false)
  })

  it.each([
    'PATH',
    'env PATH',
  ])('uses the effective inline %s instead of the inherited native PATH', async (prefix) => {
    await windowsLauncher('npm')
    const result = await spawnCmd(
      context('/usr/bin:/bin'),
      `${prefix}='${windows}' npm --version`,
      [],
    )
    expect(result).toMatchObject({ ok: false, error: { keyword: 'native-tool-windows' } })
    expect(existsSync(trap)).toBe(false)
  })

  it('allows an inline native PATH even when the parent PATH starts with Windows npm', async () => {
    await windowsLauncher('npm')
    await launcher(native, 'npm', 'printf "%s" "$PATH"')
    await launcher(native, 'node', 'echo v22.0.0')
    const result = await spawnCmd(context(windows), `PATH='${native}' npm --version`, [])
    expect(result).toMatchObject({ ok: true, exitCode: 0, stdout: native })
    expect(existsSync(trap)).toBe(false)
  })

  it('does not treat an argument mentioning npm as an invocation', async () => {
    await windowsLauncher('npm')
    const result = await spawnCmd(context(windows), 'echo "npm --version"', [])
    expect(result).toMatchObject({ ok: true, exitCode: 0, stdout: 'npm --version\n' })
    expect(existsSync(trap)).toBe(false)
  })

  it('keeps quoted shell operators as arguments', async () => {
    await windowsLauncher('npm')
    const result = await spawnCmd(context(windows), 'echo ";" npm', [])
    expect(result).toMatchObject({ ok: true, exitCode: 0, stdout: '; npm\n' })
    expect(existsSync(trap)).toBe(false)
  })

  it('does not inspect shell comments as commands', async () => {
    await windowsLauncher('npm')
    const result = await spawnCmd(context(windows), 'echo native # comment; npm --version', [])
    expect(result).toMatchObject({ ok: true, exitCode: 0, stdout: 'native\n' })
    expect(existsSync(trap)).toBe(false)
  })

  it.each([
    'echo start && npm --version',
    'set -eu\nnpx --version',
    'env CI=1 npm --version',
    'command npm --version',
    'if true; then npm --version; fi',
    'sh -c "npm --version"',
    'env -u CI npm --version',
    'command -- npm --version',
    '> output.log npm --version',
    '{ npm --version; }',
  ])('checks launchers behind shell syntax without executing a trap: %s', async (cmd) => {
    await windowsLauncher('npm')
    await windowsLauncher('npx')
    const result = await spawnCmd(context(`${windows}:/usr/bin:/bin`), cmd, [])
    expect(result).toMatchObject({ ok: false, error: { keyword: 'native-tool-windows' } })
    expect(existsSync(trap)).toBe(false)
  })

  it('tracks standalone PATH assignments before a later command', async () => {
    await windowsLauncher('npm')
    const result = await spawnCmd(context('/usr/bin:/bin'), `PATH='${windows}'; npm --version`, [])
    expect(result).toMatchObject({ ok: false, error: { keyword: 'native-tool-windows' } })
    expect(existsSync(trap)).toBe(false)
  })

  it('rejects an explicitly addressed Windows launcher', async () => {
    const path = await windowsLauncher('node')
    const result = await spawnCmd(context('/usr/bin:/bin'), `'${path}' --version`, [])
    expect(result).toMatchObject({ ok: false, error: { keyword: 'native-tool-windows' } })
    expect(existsSync(trap)).toBe(false)
  })

  it('rejects Windows external node before GSD runtime-identity executes', async () => {
    await windowsLauncher('node')
    vi.stubEnv('PATH', windows)
    const files = [
      'skills/gsd-plan-phase/SKILL.md',
      ...['discuss-phase', 'plan-phase', 'execute-phase', 'verify-work', 'progress'].map(
        (phase) => `gsd-core/workflows/${phase}.md`,
      ),
      'gsd-core/bin/gsd-tools.cjs',
      'gsd-core/references/ui-brand.md',
      ...['phase-researcher', 'planner', 'plan-checker', 'executor', 'verifier'].map(
        (role) => `agents/gsd-${role}.toml`,
      ),
    ]
    for (const file of files) {
      const path = join(root, file)
      await mkdir(join(path, '..'), { recursive: true })
      await writeFile(path, 'fixture')
    }
    const ctx = context(windows)
    ctx.manifest.metadata.name = 'gsd'
    ctx.hostContext = {
      hostId: 'codex',
      os: 'linux',
      userHome: root,
      nativeHome: root,
      platform: descriptorFor('codex', root),
    }
    const result = await verifySkillRuntime(ctx)
    expect(result).toMatchObject({
      ok: false,
      phase: 'verify',
      error: { message: expect.stringMatching(/Windows.*node|node.*Windows/i) },
    })
    expect(existsSync(trap)).toBe(false)
  })
})
