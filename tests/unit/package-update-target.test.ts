import { execFileSync } from 'node:child_process'
import { chmod, mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { delimiter, join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { preparePackageUpdate } from '../../src/cli/lib/packageUpdateTarget.js'
import { updateTargetKey } from '../../src/cli/lib/updateLock.js'
import { planWindowsSpawn } from '../../src/installers/lib/winSpawn.js'

vi.mock('node:child_process', () => ({ execFileSync: vi.fn() }))

describe('package self-update target binding', () => {
  let root: string
  let prefix: string
  let modules: string
  let packageRoot: string
  let entryPath: string
  let tools: string
  let npm: string
  let env: NodeJS.ProcessEnv

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'harnessed-package-target-'))
    prefix = join(root, 'prefix space & 100% ^ ! (global)')
    modules = join(prefix, ...(process.platform === 'win32' ? [] : ['lib']), 'node_modules')
    packageRoot = join(modules, 'harnessed')
    entryPath = join(packageRoot, 'dist', 'cli.mjs')
    tools = join(root, 'tools')
    await mkdir(join(packageRoot, 'dist'), { recursive: true })
    await mkdir(tools)
    await writeFile(
      join(packageRoot, 'package.json'),
      JSON.stringify({ name: 'harnessed', bin: { harnessed: 'dist/cli.mjs' } }),
    )
    await writeFile(entryPath, '')
    npm = join(tools, process.platform === 'win32' ? 'npm.exe' : 'npm')
    await writeFile(npm, '#!/bin/sh\n')
    await chmod(npm, 0o755)
    env = {
      ...process.env,
      PATH: `${tools}${delimiter}${process.env.PATH ?? ''}`,
      PATHEXT: '.EXE;.CMD',
    }
    vi.mocked(execFileSync)
      .mockReset()
      .mockImplementation((_command, args) =>
        args?.[0] === 'prefix' ? `${prefix}\n` : `${modules}\n`,
      )
  })

  afterEach(async () => {
    await rm(root, { recursive: true, force: true })
    vi.restoreAllMocks()
  })

  function prepare(manager: 'npm' | 'bun' = 'npm', key = updateTargetKey(entryPath)) {
    return preparePackageUpdate(manager, { entryPath, targetKey: key }, { env, cwd: root })
  }

  it('binds the fixed executable, cwd, env and explicit prefix after matching canonical package roots', () => {
    const result = prepare()
    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error(result.message)
    expect(result.command).toBe(npm)
    expect(result.args).toEqual(['i', '-g', '--prefix', prefix, 'harnessed@latest'])
    expect(result.options).toMatchObject({ cwd: root, env, shell: false, windowsHide: true })
    expect(execFileSync).toHaveBeenNthCalledWith(
      1,
      npm,
      ['prefix', '-g'],
      expect.objectContaining({ cwd: root, env, shell: false, timeout: 15_000 }),
    )
    expect(execFileSync).toHaveBeenNthCalledWith(
      2,
      npm,
      ['root', '-g', '--prefix', prefix],
      expect.objectContaining({ cwd: root, env, shell: false }),
    )
    expect(vi.mocked(execFileSync).mock.calls[0]?.[2]?.env).toBe(result.options.env)
    expect(vi.mocked(execFileSync).mock.calls[1]?.[2]?.env).toBe(result.options.env)
  })

  it('rejects a different global package target before producing an installer plan', async () => {
    const other = join(root, 'other', 'node_modules')
    await mkdir(join(other, 'harnessed'), { recursive: true })
    vi.mocked(execFileSync).mockImplementation((_command, args) =>
      args?.[0] === 'prefix' ? prefix : other,
    )
    expect(prepare()).toMatchObject({ ok: false, reasonCode: 'package-target-mismatch' })
  })

  it('rejects a captured entry whose current package no longer matches the locked identity', () => {
    expect(prepare('npm', updateTargetKey(root))).toMatchObject({
      ok: false,
      reasonCode: 'package-target-mismatch',
    })
  })

  it.each([
    '',
    'relative/path',
    '/first\n/second',
    'null\u0000path',
  ])('rejects malformed prefix probe output %j', (output) => {
    vi.mocked(execFileSync).mockReturnValue(output)
    expect(prepare()).toMatchObject({ ok: false, reasonCode: 'package-target-unproven' })
    expect(execFileSync).toHaveBeenCalledTimes(1)
  })

  it.each([1, 2])('rejects a failed or timed-out probe %i', (probe) => {
    vi.mocked(execFileSync).mockImplementation((_command, args) => {
      if (args?.[0] === (probe === 1 ? 'prefix' : 'root')) throw new Error('probe timeout')
      return prefix
    })
    expect(prepare()).toMatchObject({ ok: false, reasonCode: 'package-target-unproven' })
    expect(execFileSync).toHaveBeenCalledTimes(probe)
  })

  it.each([
    '',
    'relative/path',
    '/first\n/second',
  ])('rejects malformed modules root probe output %j', (output) => {
    vi.mocked(execFileSync).mockReturnValueOnce(prefix).mockReturnValueOnce(output)
    expect(prepare()).toMatchObject({ ok: false, reasonCode: 'package-target-unproven' })
    expect(execFileSync).toHaveBeenCalledTimes(2)
  })

  it('rejects missing manager without falling back to a bare executable', () => {
    env.PATH = tools
    env.PATHEXT = '.MISSING'
    if (process.platform !== 'win32') env.PATH = join(root, 'missing')
    expect(prepare()).toMatchObject({ ok: false, reasonCode: 'package-target-unproven' })
    expect(execFileSync).not.toHaveBeenCalled()
  })

  it.each([
    'other-name',
    'bad-json',
    'other-bin',
    'nested-manifest',
  ])('rejects unproven current package identity: %s', async (mode) => {
    const manifest =
      mode === 'nested-manifest'
        ? join(packageRoot, 'dist', 'package.json')
        : join(packageRoot, 'package.json')
    await writeFile(
      manifest,
      mode === 'bad-json'
        ? '{'
        : JSON.stringify({
            name: mode === 'other-name' || mode === 'nested-manifest' ? 'other' : 'harnessed',
            bin: { harnessed: 'other.mjs' },
          }),
    )
    const result = preparePackageUpdate(
      'npm',
      { entryPath, targetKey: 'captured-key' },
      { env, cwd: root },
    )
    expect(result).toMatchObject({ ok: false, reasonCode: 'package-target-unproven' })
    expect(execFileSync).not.toHaveBeenCalled()
  })

  it('rejects linked global package slots even when their realpath matches the running package', async () => {
    const linkedModules = join(root, 'linked', 'node_modules')
    await mkdir(linkedModules, { recursive: true })
    await symlink(
      packageRoot,
      join(linkedModules, 'harnessed'),
      process.platform === 'win32' ? 'junction' : 'dir',
    )
    vi.mocked(execFileSync).mockImplementation((_command, args) =>
      args?.[0] === 'prefix' ? prefix : linkedModules,
    )
    expect(prepare()).toMatchObject({ ok: false, reasonCode: 'package-layout-unsupported' })
  })

  it('accepts a canonical parent alias without treating the package slot as a link', async () => {
    const alias = join(root, 'alias')
    await symlink(prefix, alias, process.platform === 'win32' ? 'junction' : 'dir')
    const aliasModules = join(
      alias,
      ...(process.platform === 'win32' ? [] : ['lib']),
      'node_modules',
    )
    vi.mocked(execFileSync).mockImplementation((_command, args) =>
      args?.[0] === 'prefix' ? alias : aliasModules,
    )
    expect(prepare()).toMatchObject({
      ok: true,
      args: ['i', '-g', '--prefix', alias, 'harnessed@latest'],
    })
  })

  it('refuses Bun apply without probing npm or inferring a global layout', () => {
    expect(prepare('bun')).toMatchObject({ ok: false, reasonCode: 'package-target-unproven' })
    expect(execFileSync).not.toHaveBeenCalled()
  })

  it.skipIf(process.platform !== 'win32')(
    'escapes Windows shim arguments with special prefix characters for probes and apply',
    async () => {
      await rm(npm)
      const shim = join(tools, 'npm.cmd')
      await writeFile(shim, '@echo off\n')
      vi.mocked(execFileSync).mockReturnValueOnce(prefix).mockReturnValueOnce(modules)
      const result = prepare()
      expect(result.ok).toBe(true)
      if (!result.ok) throw new Error(result.message)
      const planned = planWindowsSpawn(
        'npm',
        ['i', '-g', '--prefix', prefix, 'harnessed@latest'],
        shim,
      )
      expect(result.args).toEqual(planned.args)
      expect(result.options).toMatchObject({ shell: false, windowsVerbatimArguments: true })
      expect(result.command).toMatch(/^[a-z]:\\.*cmd\.exe$/i)
      expect(vi.mocked(execFileSync).mock.calls[1]?.[1]).toEqual(
        planWindowsSpawn('npm', ['root', '-g', '--prefix', prefix], shim).args,
      )
    },
  )
})
