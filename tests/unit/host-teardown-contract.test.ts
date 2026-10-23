import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { parse } from 'yaml'
import type { SpawnOk } from '../../src/installers/lib/spawn.js'
import type { InstallResult } from '../../src/installers/lib/types.js'

const boundary = vi.hoisted(() => ({
  home: '',
  spawn: vi.fn(
    async (..._args: unknown[]): Promise<SpawnOk | InstallResult> => ({
      ok: true,
      exitCode: 0,
      stdout: '',
      stderr: '',
    }),
  ),
  native: vi.fn(async (..._args: unknown[]) => ({ exitCode: 0, stdout: '', stderr: '' })),
  hook: vi.fn(
    async (
      ..._args: unknown[]
    ): Promise<
      { ok: true; removedPaths: string[] } | { ok: false; error: string; phase?: 'preflight' }
    > => ({ ok: true, removedPaths: [] }),
  ),
}))
vi.mock('node:os', async (actual) => ({
  ...(await actual<typeof import('node:os')>()),
  homedir: () => boundary.home,
}))
vi.mock('../../src/installers/lib/spawn.js', () => ({
  spawnCmd: boundary.spawn,
  DEFAULT_INSTALL_TIMEOUT_MS: 300_000,
}))
vi.mock('../../src/installers/lib/runClaudeArgs.js', () => ({
  runHarnessArgs: boundary.native,
  runArgs: (...args: unknown[]) => boundary.native(...args),
}))
vi.mock('../../src/installers/codexHookAdd.js', () => ({ removeCodexHook: boundary.hook }))
vi.mock('../../src/platform/hostInstallContext.js', async (actual) => {
  const mod = await actual<typeof import('../../src/platform/hostInstallContext.js')>()
  return { ...mod, captureHostInstallContext: vi.fn(mod.captureHostInstallContext) }
})

import { resolveComponentPlan } from '../../src/installers/lib/componentPlan.js'
import type { Manifest } from '../../src/manifest/schema/types.js'
import {
  captureHostInstallContext,
  createHostInstallContext,
  type HostInstallContext,
} from '../../src/platform/hostInstallContext.js'
import { claudeDescriptor, codexDescriptor } from '../../src/platform/platform.js'
import { runUninstall } from '../../src/uninstallers/index.js'

const apply = { apply: true, dryRun: false, yes: true }
let home: string
let codex: HostInstallContext
let claude: HostInstallContext
function manifest(
  name = 'fixture',
  method: Manifest['spec']['install']['method'] = 'npm-cli',
): Manifest {
  return {
    apiVersion: 'harnessed/v1',
    kind: 'Manifest',
    metadata: {
      name,
      description: 'fixture',
      upstream: {
        source: name,
        homepage: 'https://example.com',
        repository: 'https://example.com/fixture',
        license: 'MIT',
        notice: 'fixture',
      },
    },
    spec: {
      type: 'cli-npm',
      component_type: 'cli-binary',
      category: 'engineering',
      install_type: 'npm',
      install: {
        method,
        cmd: 'npm install -g fixture',
        npm_version: '^1',
        idempotent_check: 'true',
      },
      verify: { cmd: 'true' },
      uninstall: { cmd: 'base-remove --claude', cleanup_paths: ['~/.claude/fixture'] },
      platforms: ['linux', 'darwin', 'win32'],
      signed_by: 'fixture',
      upstream_health: {
        stability: 'stable',
        last_check: '2026-10-23',
        last_known_good_version: '1',
        fallback_action: 'warn',
      },
    },
  } as Manifest
}
function explicit() {
  const m = manifest('ctx7')
  return {
    ...m,
    spec: {
      ...m.spec,
      harness_overrides: {
        codex: {
          install: structuredClone(m.spec.install),
          uninstall: {
            cmd: 'npm uninstall -g ctx7',
            cleanup_paths: [],
          } as Manifest['spec']['uninstall'],
        },
      },
    },
  }
}
beforeEach(() => {
  vi.clearAllMocks()
  home = mkdtempSync(join(tmpdir(), 'harnessed-teardown-'))
  boundary.home = home
  codex = createHostInstallContext(codexDescriptor(home), {
    userHome: home,
    os: process.platform,
    nativeHome: join(home, 'native-codex'),
  })
  claude = createHostInstallContext(claudeDescriptor(home), {
    userHome: home,
    os: process.platform,
    nativeHome: join(home, 'native-claude'),
  })
  vi.mocked(captureHostInstallContext).mockReturnValue(codex)
})
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
  rmSync(home, { recursive: true, force: true })
})

describe('reviewed Codex teardown policy', () => {
  it.each([
    'npm-cli',
    'npx-skill-installer',
    'git-clone-with-setup',
    'cc-plugin-marketplace',
  ] as const)('refuses base %s before every mutation', async (method) => {
    expect(await runUninstall(manifest('fixture', method), apply, codex)).toMatchObject({
      ok: false,
      phase: 'preflight',
    })
    expect(boundary.spawn).not.toHaveBeenCalled()
    expect(boundary.native).not.toHaveBeenCalled()
    expect(boundary.hook).not.toHaveBeenCalled()
  })

  it.each([
    'ctx7',
    'playwright-cli',
  ] as const)('allows only the reviewed neutral npm command for %s', async (name) => {
    const m = manifest(name)
    m.spec.uninstall = {
      cmd: name === 'ctx7' ? 'npm uninstall -g ctx7' : 'npm uninstall -g @playwright/cli',
      cleanup_paths: [],
    }
    const plan = resolveComponentPlan(m, codex, 'uninstall')
    expect(plan.status).toBe('supported')
    expect(await runUninstall(m, apply, codex)).toMatchObject({ ok: true })
    expect(boundary.spawn.mock.calls[0]?.[1]).toBe(m.spec.uninstall.cmd)
  })

  it.each([
    'cmd',
    'paths',
    'unknown',
    'method',
    'invalid-npm',
    'identity',
  ] as const)('does not broaden neutral exception: %s', async (change) => {
    const m = manifest('ctx7')
    m.spec.uninstall = { cmd: 'npm uninstall -g ctx7' }
    if (change === 'cmd') m.spec.uninstall.cmd += ' && echo unsafe'
    if (change === 'paths') m.spec.uninstall.cleanup_paths = ['~/.agents/skills/ctx7']
    if (change === 'unknown') m.metadata.name = 'unknown'
    if (change === 'method')
      m.spec.install = { ...m.spec.install, method: 'mcp-stdio-add' } as Manifest['spec']['install']
    if (change === 'invalid-npm') delete (m.spec.install as { npm_version?: string }).npm_version
    if (change === 'identity') m.spec.type = 'cc-skill-pack'
    const result = await runUninstall(m, apply, codex)
    expect(result).toMatchObject({ ok: false, phase: 'preflight' })
    expect(boundary.spawn).not.toHaveBeenCalled()
  })

  it.each([
    'tools/superpowers',
    'skill-packs/gsd',
    'skill-packs/gstack',
    'skill-packs/planning-with-files',
    'skill-packs/ui-ux-pro-max',
    'optional/ecc',
  ])('keeps unsafe shipped override %s unsupported', async (file) => {
    const m = parse(readFileSync(`manifests/${file}.yaml`, 'utf8')) as Manifest
    expect(resolveComponentPlan(m, codex, 'uninstall').status).toBe('unsupported')
    expect(await runUninstall(m, apply, codex)).toMatchObject({ ok: false, phase: 'preflight' })
    expect(boundary.spawn).not.toHaveBeenCalled()
    expect(boundary.native).not.toHaveBeenCalled()
    expect(boundary.hook).not.toHaveBeenCalled()
  })

  it('replaces uninstall wholesale and consumes the schema field without mutating the input', async () => {
    const m = explicit()
    const before = structuredClone(m)
    const plan = resolveComponentPlan(m, codex, 'uninstall')
    expect(plan.sources.uninstall).toBe('host-override')
    expect(plan.manifest.spec.uninstall).toEqual(m.spec.harness_overrides.codex.uninstall)
    expect(await runUninstall(m, apply, codex)).toEqual({ ok: true, removedPaths: [] })
    expect(boundary.spawn.mock.calls[0]?.[1]).toBe('npm uninstall -g ctx7')
    expect(boundary.spawn.mock.calls[0]?.[0]).toMatchObject({ hostContext: codex })
    expect(m).toEqual(before)
  })

  describe.each(['ctx7', 'playwright-cli'] as const)('reviewed neutral failures: %s', (name) => {
    function neutral() {
      if (name === 'ctx7') return explicit()
      const m = manifest(name)
      m.spec.uninstall = { cmd: 'npm uninstall -g @playwright/cli', cleanup_paths: [] }
      return m
    }

    it.each([
      'stderr',
      'stdout',
    ] as const)('does not report success on nonzero exit and preserves full %s', async (output) => {
      vi.spyOn(console, 'warn').mockImplementation(() => {})
      const message = `  npm uninstall failed\n${'diagnostic '.repeat(30)}\n`
      boundary.spawn.mockResolvedValueOnce({
        ok: true,
        exitCode: 7,
        stderr: output === 'stderr' ? message : '',
        stdout: output === 'stdout' ? message : 'secondary output',
      })
      expect(await runUninstall(neutral(), apply, codex)).toEqual({
        ok: false,
        phase: 'spawn',
        error: message,
      })
      expect(boundary.spawn).toHaveBeenCalledTimes(1)
      expect(boundary.native).not.toHaveBeenCalled()
      expect(boundary.hook).not.toHaveBeenCalled()
    })

    it.each([
      'preflight',
      'spawn',
    ] as const)('preserves %s phase and exact spawn failure message', async (phase) => {
      vi.spyOn(console, 'warn').mockImplementation(() => {})
      const message = '  original spawn failure\nfull diagnostic\n'
      boundary.spawn.mockResolvedValueOnce({
        ok: false,
        phase,
        error: {
          file: name,
          path: '/spec/install/cmd',
          message,
          line: null,
          column: null,
          keyword: 'spawn-error',
        },
      })
      expect(await runUninstall(neutral(), apply, codex)).toEqual({
        ok: false,
        phase,
        error: message,
      })
      expect(boundary.spawn).toHaveBeenCalledTimes(1)
    })

    it('returns a failed spawn result when the spawn boundary throws', async () => {
      const message = 'spawn failed: ENOENT\noriginal detail'
      boundary.spawn.mockRejectedValueOnce(new Error(message))
      expect(await runUninstall(neutral(), apply, codex)).toEqual({
        ok: false,
        phase: 'spawn',
        error: message,
      })
    })
  })

  it('preserves existing Claude fail-soft behavior for a failed declared command', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    boundary.spawn.mockResolvedValueOnce({
      ok: true,
      exitCode: 7,
      stderr: 'npm failed',
      stdout: '',
    })
    expect(await runUninstall(manifest(), apply, claude)).toMatchObject({ ok: true })
    expect(warn).toHaveBeenCalled()
  })

  it('keeps effective cc-plugin unsupported even with explicit uninstall', async () => {
    const m = explicit()
    m.spec.harness_overrides.codex.install = {
      method: 'cc-plugin-marketplace',
      cmd: 'codex plugin add fixture@market',
      git_ref: 'v1',
      idempotent_check: 'true',
    }
    expect(await runUninstall(m, apply, codex)).toMatchObject({ ok: false, phase: 'preflight' })
    expect(boundary.spawn).not.toHaveBeenCalled()
  })

  it('does not authorize an unknown cmd-only explicit teardown', async () => {
    const m = explicit()
    m.metadata.name = 'unknown'
    m.spec.harness_overrides.codex.uninstall = { cmd: 'rm -rf ~/.agents/skills/user-skill' }
    expect(await runUninstall(m, apply, codex)).toMatchObject({ ok: false, phase: 'preflight' })
    expect(boundary.spawn).not.toHaveBeenCalled()
  })

  it('does not infer shared skill ownership from declared cleanup', async () => {
    const m = explicit()
    const target = join(home, '.agents/skills/fixture')
    mkdirSync(target, { recursive: true })
    writeFileSync(join(target, 'owned.txt'), 'user content')
    m.spec.harness_overrides.codex.uninstall.cleanup_paths = ['~/.agents/skills/fixture']
    expect(await runUninstall(m, apply, codex)).toMatchObject({ ok: false, phase: 'preflight' })
    expect(boundary.spawn).not.toHaveBeenCalled()
    expect(readFileSync(join(target, 'owned.txt'), 'utf8')).toBe('user content')
  })
})

describe('captured teardown context and zero-side-effect preflight', () => {
  it.each([
    '--all',
    '../fixture',
    'fixture;whoami',
    'fixture$(whoami)',
    'fixture name',
  ])('rejects unvalidated native identity %s before any native call', async (name) => {
    expect(await runUninstall(manifest(name, 'mcp-stdio-add'), apply, codex)).toMatchObject({
      ok: false,
      phase: 'preflight',
    })
    expect(boundary.native).not.toHaveBeenCalled()
    expect(boundary.hook).not.toHaveBeenCalled()
  })

  it.each([
    'mcp-stdio-add',
    'mcp-http-add',
  ] as const)('keeps %s declaration source but rejects unproven identity in the pure plan', async (method) => {
    vi.stubEnv('HARNESSED_PLATFORM', 'claude')
    vi.stubEnv('CODEX_HOME', join(home, 'wrong-native'))
    vi.stubEnv('HARNESSED_ROOT_OVERRIDE', join(home, 'wrong-state'))
    expect(resolveComponentPlan(manifest('fixture', method), codex, 'uninstall')).toMatchObject({
      status: 'unsupported',
      reason: 'unsupported-operation',
      sources: { uninstall: 'native-adapter' },
    })
    const result = await runUninstall(manifest('fixture', method), apply, codex)
    expect(result).toMatchObject({
      ok: false,
      phase: 'preflight',
      error: expect.stringContaining('identity'),
    })
    expect(boundary.native).not.toHaveBeenCalled()
    expect(captureHostInstallContext).not.toHaveBeenCalled()
  })

  it.each([
    'mcp-stdio-add',
    'mcp-http-add',
  ] as const)('threads captured Claude context through %s', async (method) => {
    vi.stubEnv('HARNESSED_PLATFORM', 'codex')
    expect(await runUninstall(manifest('fixture', method), apply, claude)).toMatchObject({
      ok: true,
    })
    expect(boundary.native).toHaveBeenCalledWith(
      'claude',
      ['mcp', 'remove', 'fixture'],
      home,
      expect.any(Number),
      claude,
    )
  })

  it('captures only once when no explicit context is supplied', async () => {
    expect(await runUninstall(explicit(), apply)).toMatchObject({
      ok: true,
    })
    expect(captureHostInstallContext).toHaveBeenCalledTimes(1)
  })

  it('threads native hook teardown context', async () => {
    const m = manifest('inject-state', 'cc-hook-add')
    m.spec.install = {
      method: 'cc-hook-add',
      cmd: 'true',
      idempotent_check: 'true',
      hook_event: 'SessionStart',
      hook_command: 'node bin/harnessed-inject-state.mjs',
    }
    expect(await runUninstall(m, apply, codex)).toMatchObject({ ok: true })
    expect(boundary.hook).toHaveBeenCalledWith('inject-state', 'SessionStart', codex)
  })

  it.each([
    undefined,
    'preflight',
  ] as const)('preserves native hook failure phase %s with legacy spawn fallback', async (phase) => {
    const m = manifest('inject-state', 'cc-hook-add')
    m.spec.install = {
      method: 'cc-hook-add',
      cmd: 'true',
      idempotent_check: 'true',
      hook_event: 'SessionStart',
      hook_command: 'node bin/harnessed-inject-state.mjs',
    }
    const error = 'hook ownership/confinement blocked\noriginal detail'
    boundary.hook.mockResolvedValueOnce({ ok: false, error, ...(phase ? { phase } : {}) })
    expect(await runUninstall(m, apply, codex)).toEqual({
      ok: false,
      phase: phase ?? 'spawn',
      error,
    })
  })

  it.each([
    'cmd',
    'paths',
  ] as const)('rejects explicit Codex Claude host %s before spawn or cleanup', async (field) => {
    const m = explicit()
    const uninstall = m.spec.harness_overrides.codex.uninstall
    if (field === 'cmd') uninstall.cmd = 'rm -rf ~/.claude/fixture'
    else uninstall.cleanup_paths = ['~/.claude/fixture']
    expect(await runUninstall(m, apply, codex)).toMatchObject({ ok: false, phase: 'preflight' })
    expect(boundary.spawn).not.toHaveBeenCalled()
  })

  it('confines symlink ancestors before the declared command', async () => {
    const m = manifest()
    m.spec.uninstall.cleanup_paths = ['~/.agents/skills/fixture']
    const outside = mkdtempSync(join(tmpdir(), 'harnessed-teardown-outside-'))
    try {
      mkdirSync(join(home, '.agents'), { recursive: true })
      symlinkSync(
        outside,
        join(home, '.agents/skills'),
        process.platform === 'win32' ? 'junction' : 'dir',
      )
      writeFileSync(join(outside, 'keep.txt'), 'external')
      expect(await runUninstall(m, apply, claude)).toMatchObject({ ok: false, phase: 'preflight' })
      expect(boundary.spawn).not.toHaveBeenCalled()
      expect(readFileSync(join(outside, 'keep.txt'), 'utf8')).toBe('external')
    } finally {
      rmSync(outside, { recursive: true, force: true })
    }
  })

  it('rechecks confinement after the declared command changes a cleanup ancestor', async () => {
    const m = manifest()
    m.spec.uninstall.cleanup_paths = ['~/.claude/skills/fixture']
    const skills = join(home, '.claude/skills')
    const outside = mkdtempSync(join(tmpdir(), 'harnessed-teardown-race-'))
    mkdirSync(skills, { recursive: true })
    mkdirSync(join(outside, 'fixture'))
    writeFileSync(join(outside, 'fixture/keep.txt'), 'external')
    boundary.spawn.mockImplementationOnce(async () => {
      rmSync(skills, { recursive: true, force: true })
      symlinkSync(outside, skills, process.platform === 'win32' ? 'junction' : 'dir')
      return { ok: true, exitCode: 0, stdout: '', stderr: '' }
    })
    try {
      expect(await runUninstall(m, apply, claude)).toMatchObject({ ok: false })
      expect(readFileSync(join(outside, 'fixture/keep.txt'), 'utf8')).toBe('external')
    } finally {
      rmSync(outside, { recursive: true, force: true })
    }
  })

  it('preserves dry-run without command/native/cleanup mutation', async () => {
    expect(await runUninstall(explicit(), { ...apply, apply: false, dryRun: true }, codex)).toEqual(
      { aborted: true, reason: 'dry-run' },
    )
    expect(boundary.spawn).not.toHaveBeenCalled()
    expect(boundary.native).not.toHaveBeenCalled()
    expect(boundary.hook).not.toHaveBeenCalled()
  })

  it('treats apply:false as preview even without dryRun:true at the public boundary', async () => {
    for (const context of [codex, claude]) {
      expect(
        await runUninstall(explicit(), { apply: false, dryRun: false, yes: true }, context),
      ).toEqual({
        aborted: true,
        reason: 'dry-run',
      })
    }
    expect(boundary.spawn).not.toHaveBeenCalled()
    expect(boundary.native).not.toHaveBeenCalled()
    expect(boundary.hook).not.toHaveBeenCalled()
  })

  it('keeps Claude declared teardown and pins its context', async () => {
    vi.stubEnv('HARNESSED_PLATFORM', 'codex')
    expect(await runUninstall(manifest(), apply, claude)).toMatchObject({ ok: true })
    expect(boundary.spawn.mock.calls[0]?.[1]).toBe('base-remove --claude')
    expect(boundary.spawn.mock.calls[0]?.[0]).toMatchObject({ hostContext: claude })
  })
})
