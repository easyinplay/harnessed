import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  effectiveInstallMethod,
  installGroupForPlan,
  resolveComponentPlan,
} from '../../src/installers/lib/componentPlan.js'
import type { Manifest } from '../../src/installers/lib/types.js'
import { createHostInstallContext } from '../../src/platform/hostInstallContext.js'
import { claudeDescriptor, codexDescriptor } from '../../src/platform/platform.js'

function fixture(): Manifest {
  return {
    apiVersion: 'harnessed/v1',
    kind: 'Manifest',
    metadata: {
      name: 'fixture',
      description: 'fixture',
      upstream: {
        source: 'fixture',
        homepage: 'https://example.com',
        repository: 'https://github.com/example/fixture.git',
        license: 'MIT',
        notice: 'fixture',
      },
    },
    spec: {
      type: 'cc-plugin',
      component_type: 'command',
      category: 'engineering',
      install_type: 'skill',
      signed_by: 'fixture',
      platforms: ['linux'],
      upstream_health: {
        stability: 'stable',
        last_check: '2026-10-23',
        last_known_good_version: '1.0.0',
        fallback_action: 'warn',
      },
      install: {
        method: 'cc-plugin-marketplace',
        cmd: '/plugin install fixture@fixture',
        git_ref: 'v1',
        env: { BASE: 'base' },
        idempotent_check: 'base check',
      },
      verify: { cmd: 'base verify', timeout_ms: 1000 },
      uninstall: { cmd: '/plugin uninstall fixture@fixture', cleanup_paths: ['~/.claude/fixture'] },
      harness_overrides: {
        codex: {
          install: {
            method: 'npx-skill-installer',
            cmd: 'npx skills add fixture',
            npm_version: '^1',
            idempotent_check: 'override check',
          },
          verify: { cmd: 'codex verify', timeout_ms: 2000 },
        },
      },
    },
  } as Manifest
}

function codexOverride(manifest: Manifest) {
  const override = manifest.spec.harness_overrides?.codex
  if (!override) throw new Error('fixture requires Codex override')
  return override
}

const claude = createHostInstallContext(claudeDescriptor('/fixture'), {
  userHome: '/fixture',
  os: 'linux',
})
const codex = createHostInstallContext(codexDescriptor('/fixture'), {
  userHome: '/fixture',
  os: 'linux',
  nativeHome: '/ambient-native',
})

afterEach(() => vi.unstubAllEnvs())

describe('resolveComponentPlan', () => {
  it('replaces install and verify wholesale, without inheriting base env/ref', () => {
    const manifest = fixture()
    const before = structuredClone(manifest)
    const plan = resolveComponentPlan(manifest, codex, 'install')
    expect(plan.status).toBe('supported')
    expect(plan.componentId).toBe('fixture')
    expect(plan.manifest.spec.install).toEqual({
      method: 'npx-skill-installer',
      cmd: 'npx skills add fixture',
      npm_version: '^1',
      idempotent_check: 'override check',
    })
    expect(plan.manifest.spec.verify).toEqual({ cmd: 'codex verify', timeout_ms: 2000 })
    expect(plan.sources).toMatchObject({ install: 'host-override', verify: 'host-override' })
    expect(effectiveInstallMethod(plan)).toBe('npx-skill-installer')
    expect(installGroupForPlan(plan)).toBe('command')
    expect(manifest).toEqual(before)
  })

  it('falls back to base verify when the override does not declare verify', () => {
    const manifest = fixture()
    delete codexOverride(manifest).verify
    const plan = resolveComponentPlan(manifest, codex, 'inspect')
    expect(plan.manifest.spec.verify).toEqual({ cmd: 'base verify', timeout_ms: 1000 })
    expect(plan.sources).toMatchObject({ install: 'host-override', verify: 'base' })
  })

  it('returns a deeply readonly clone even for the base Claude declaration', () => {
    const manifest = fixture()
    const plan = resolveComponentPlan(manifest, claude, 'install')
    expect(plan.manifest).toEqual(manifest)
    expect(plan.manifest).not.toBe(manifest)
    manifest.spec.platforms.push('win32')
    expect(plan.manifest.spec.platforms).toEqual(['linux'])
    expect(() => {
      ;(plan.manifest.spec.platforms as string[]).push('darwin')
    }).toThrow()
    expect(Object.isFrozen(plan.manifest.spec.harness_overrides?.codex?.install)).toBe(true)
    expect(plan.sources).toMatchObject({ install: 'base', verify: 'base' })
    expect(plan).not.toHaveProperty('ownership')
    expect(plan).not.toHaveProperty('receipt')
  })

  it.each([
    'install',
    'inspect',
    'update',
  ] as const)('preserves the Claude-only gate for Codex %s', (operation) => {
    const manifest = fixture()
    delete manifest.spec.harness_overrides
    const plan = resolveComponentPlan(manifest, codex, operation)
    expect(plan).toMatchObject({ status: 'unsupported', reason: 'harness-mismatch', operation })
  })

  it('allows the existing Codex hook adapter without a plugin-registry gate', () => {
    const manifest = fixture()
    delete manifest.spec.harness_overrides
    manifest.spec.install.method = 'cc-hook-add'
    const plan = resolveComponentPlan(manifest, codex, 'install')
    expect(plan.status).toBe('supported')
    expect(plan.context.platform.pluginsRegistry).toBeNull()
    expect(plan.sources.install).toBe('native-adapter')
  })

  it('refuses Codex teardown even when install is supported and base uninstall exists', () => {
    const plan = resolveComponentPlan(fixture(), codex, 'uninstall')
    expect(plan).toMatchObject({
      status: 'unsupported',
      reason: 'unsupported-operation',
      operation: 'uninstall',
    })
    expect(resolveComponentPlan(fixture(), claude, 'uninstall').status).toBe('supported')
  })

  it.each([
    ['npm-cli', 'cli-binary'],
    ['mcp-stdio-add', 'mcp-tool'],
    ['mcp-http-add', 'mcp-tool'],
    ['cc-plugin-marketplace', 'command'],
    ['git-clone-with-setup', 'command'],
    ['npx-skill-installer', 'command'],
    ['cc-hook-add', 'command'],
  ] as const)('derives %s grouping from the effective declaration', (method, group) => {
    const manifest = fixture()
    codexOverride(manifest).install.method = method
    const plan = resolveComponentPlan(manifest, codex, 'install')
    expect(effectiveInstallMethod(plan)).toBe(method)
    expect(installGroupForPlan(plan)).toBe(group)
  })

  it.each([
    'claude',
    'codex',
  ] as const)('honors install.env root and explicit empty for %s without changing state', (hostId) => {
    const context = hostId === 'codex' ? codex : claude
    const manifest = fixture()
    const install = hostId === 'codex' ? codexOverride(manifest).install : manifest.spec.install
    const rootKey = hostId === 'codex' ? 'CODEX_HOME' : 'CLAUDE_CONFIG_DIR'
    install.env = { [rootKey]: '/manifest-native', SECRET: 'not-a-selection-field' }
    const plan = resolveComponentPlan(manifest, context, 'install')
    expect(plan.context.nativeHome).toBe('/manifest-native')
    expect(plan.context.platform.stateRoot).toBe(context.platform.stateRoot)
    expect(JSON.stringify(plan.context)).not.toContain('not-a-selection-field')
    install.env[rootKey] = ''
    expect(resolveComponentPlan(manifest, context, 'install').context.nativeHome).toBe(
      context.platform.homeDir,
    )
    expect(context.nativeHome).toBe(
      hostId === 'codex' ? '/ambient-native' : claude.platform.homeDir,
    )
  })

  it('ignores replaced base install.env and never reselects from ambient env', () => {
    const manifest = fixture()
    manifest.spec.install.env = { CODEX_HOME: '/base-must-not-leak' }
    vi.stubEnv('HARNESSED_PLATFORM', 'claude')
    vi.stubEnv('CODEX_HOME', '/later-native')
    vi.stubEnv('HARNESSED_ROOT_OVERRIDE', '/later-state')
    const plan = resolveComponentPlan(manifest, codex, 'update')
    expect(plan.context).toEqual(codex)
    expect(plan.context.nativeHome).toBe('/ambient-native')
    expect(plan.manifest.spec.install.env).toBeUndefined()
  })

  it.each([
    ['  /codex-native  ', '/codex-native'],
    ['   ', codex.platform.homeDir],
    ['', codex.platform.homeDir],
  ])('trims Codex native root %j without changing stateRoot', (value, expected) => {
    const manifest = fixture()
    codexOverride(manifest).install.env = { CODEX_HOME: value }
    const plan = resolveComponentPlan(manifest, codex, 'uninstall')
    expect(plan.context.nativeHome).toBe(expected)
    expect(plan.context.platform.stateRoot).toBe(codex.platform.stateRoot)
  })

  it('keeps Claude native root whitespace semantics unchanged', () => {
    const manifest = fixture()
    manifest.spec.install.env = { CLAUDE_CONFIG_DIR: '   ' }
    expect(resolveComponentPlan(manifest, claude, 'uninstall').context.nativeHome).toBe('   ')
  })

  it('treats an unvalidated hook without hook_command as unsupported teardown, not a throw', () => {
    const manifest = fixture()
    delete manifest.spec.harness_overrides
    manifest.spec.install.method = 'cc-hook-add'
    expect(resolveComponentPlan(manifest, codex, 'uninstall')).toMatchObject({
      status: 'unsupported',
      reason: 'unsupported-operation',
    })
    expect(resolveComponentPlan(manifest, codex, 'install').status).toBe('supported')
    expect(resolveComponentPlan(manifest, codex, 'inspect').status).toBe('supported')
  })

  it.each([
    [{ codex_home: '/lower-native' }, '/lower-native'],
    [{ CODEX_HOME: '/first', codex_home: '/last' }, '/last'],
    [{ codex_home: '/first', CODEX_HOME: '/last' }, '/last'],
    [{ CODEX_HOME: '/first', CoDeX_HoMe: '' }, codex.platform.homeDir],
    [{ CODEX_HOME: '/first', CoDeX_HoMe: '   ' }, codex.platform.homeDir],
  ] as const)('uses Windows case-insensitive last-declared-wins native root: %j', (env, expected) => {
    const manifest = fixture()
    codexOverride(manifest).install.env = env
    const context = { ...codex, os: 'win32' as const }
    const plan = resolveComponentPlan(manifest, context, 'uninstall')
    expect(plan.context.nativeHome).toBe(expected)
    expect(plan.context.platform.stateRoot).toBe(context.platform.stateRoot)
    expect(context.nativeHome).toBe('/ambient-native')
  })

  it('keeps POSIX env keys case-sensitive', () => {
    const manifest = fixture()
    codexOverride(manifest).install.env = { codex_home: '/not-a-posix-override' }
    expect(resolveComponentPlan(manifest, codex, 'install').context.nativeHome).toBe(
      '/ambient-native',
    )
  })

  it('does not leak a Windows mixed-case base root through wholesale override replacement', () => {
    const manifest = fixture()
    manifest.spec.install.env = { codex_home: '/base-must-not-leak' }
    const context = { ...codex, os: 'win32' as const }
    expect(resolveComponentPlan(manifest, context, 'install').context.nativeHome).toBe(
      '/ambient-native',
    )
    codexOverride(manifest).install.env = { CoDeX_HoMe: '/override-native' }
    const plan = resolveComponentPlan(manifest, context, 'install')
    expect(plan.context.nativeHome).toBe('/override-native')
    expect(plan.context.platform.stateRoot).toBe(context.platform.stateRoot)
  })

  it('uses Windows env key case rules for Claude without trimming its value', () => {
    const manifest = fixture()
    manifest.spec.install.env = { CLAUDE_CONFIG_DIR: '/first', claude_config_dir: '   ' }
    const context = { ...claude, os: 'win32' as const }
    const plan = resolveComponentPlan(manifest, context, 'uninstall')
    expect(plan.context.nativeHome).toBe('   ')
    expect(plan.context.platform.stateRoot).toBe(context.platform.stateRoot)
  })
})
