import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  captureHostInstallContext,
  createHostInstallContext,
} from '../../src/platform/hostInstallContext.js'
import { claudeDescriptor, codexDescriptor } from '../../src/platform/platform.js'

afterEach(() => vi.unstubAllEnvs())

describe('HostInstallContext', () => {
  it('captures a trimmed neutral spawn override once without retaining blank overrides', () => {
    vi.stubEnv('HARNESSED_PLATFORM', 'codex')
    vi.stubEnv('HARNESSED_SPAWN_CWD', '  /neutral  ')
    const context = captureHostInstallContext({ userHome: '/fixture' })
    vi.stubEnv('HARNESSED_SPAWN_CWD', '/later')
    expect(context.neutralSpawnCwd).toBe('/neutral')
    vi.stubEnv('HARNESSED_SPAWN_CWD', '   ')
    expect(captureHostInstallContext({ userHome: '/fixture' })).not.toHaveProperty(
      'neutralSpawnCwd',
    )
    expect(
      createHostInstallContext(codexDescriptor('/fixture'), {
        userHome: '/fixture',
        os: 'linux',
        neutralSpawnCwd: ' /provided ',
      }).neutralSpawnCwd,
    ).toBe('/provided')
  })

  it.each([
    '',
    '   ',
    ' /custom-native  ',
  ])('preserves Codex native-home trim/fallback for %j', (value) => {
    vi.stubEnv('HARNESSED_PLATFORM', 'codex')
    vi.stubEnv('CODEX_HOME', value)
    const expected = value.trim() || join('/fixture', '.codex')
    expect(captureHostInstallContext({ userHome: '/fixture' }).nativeHome).toBe(expected)
    expect(
      createHostInstallContext(codexDescriptor('/fixture'), {
        userHome: '/fixture',
        os: 'linux',
        nativeHome: value,
      }).nativeHome,
    ).toBe(expected)
  })

  it('creates an immutable fixture from a descriptor without ambient selection', () => {
    vi.stubEnv('HARNESSED_PLATFORM', 'claude')
    vi.stubEnv('CODEX_HOME', '/ambient-secret-home')
    const descriptor = codexDescriptor('/fixture')
    const context = createHostInstallContext(descriptor, {
      os: 'linux',
      userHome: '/fixture',
      nativeHome: '/native',
    })
    descriptor.stateRoot = '/changed'
    expect(context).toEqual({
      hostId: 'codex',
      os: 'linux',
      userHome: '/fixture',
      platform: codexDescriptor('/fixture'),
      nativeHome: '/native',
    })
    expect(Object.isFrozen(context)).toBe(true)
    expect(Object.isFrozen(context.platform)).toBe(true)
    expect(() => {
      ;(context.platform as { stateRoot: string }).stateRoot = '/mutated'
    }).toThrow()
  })

  it('captures existing precedence without retaining session ids or secrets', () => {
    vi.stubEnv('HARNESSED_SPAWN_CWD', '')
    vi.stubEnv('HARNESSED_PLATFORM', 'codex')
    vi.stubEnv('CLAUDE_CODE_SESSION_ID', 'private-session')
    vi.stubEnv('HARNESSED_ROOT_OVERRIDE', '/state')
    vi.stubEnv('CODEX_HOME', '/native')
    vi.stubEnv('API_TOKEN', 'private-token')
    const context = captureHostInstallContext({ userHome: '/fixture', os: 'linux' })
    vi.stubEnv('HARNESSED_PLATFORM', 'claude')
    vi.stubEnv('CODEX_HOME', '/later')
    vi.stubEnv('HARNESSED_ROOT_OVERRIDE', '/later-state')
    expect(context.hostId).toBe('codex')
    expect(context.nativeHome).toBe('/native')
    expect(context.platform.stateRoot).toBe('/state')
    expect(JSON.stringify(context)).not.toMatch(/private-session|private-token|API_TOKEN/)
    expect(Object.keys(context).sort()).toEqual([
      'hostId',
      'nativeHome',
      'os',
      'platform',
      'userHome',
    ])
  })

  it('preserves session-env precedence without an explicit target', () => {
    vi.stubEnv('HARNESSED_PLATFORM', '')
    vi.stubEnv('CLAUDE_CODE_SESSION_ID', '')
    vi.stubEnv('CODEX_SESSION_ID', 'session')
    expect(captureHostInstallContext({ userHome: '/fixture' }).hostId).toBe('codex')
  })

  it('honors an explicit host and keeps stateRoot independent of native home', () => {
    vi.stubEnv('HARNESSED_PLATFORM', 'codex')
    vi.stubEnv('HARNESSED_ROOT_OVERRIDE', '/state')
    vi.stubEnv('CLAUDE_CONFIG_DIR', '/claude-native')
    const context = captureHostInstallContext({ hostId: 'claude', userHome: '/fixture' })
    expect(context.hostId).toBe('claude')
    expect(context.nativeHome).toBe('/claude-native')
    expect(context.platform.stateRoot).toBe('/state')
    expect(context.platform.homeDir).toBe(join('/fixture', '.claude'))
  })

  it.each(['cursor', 'agents', 'unknown', ''])('refuses explicit unsupported host %j', (hostId) => {
    expect(() => captureHostInstallContext({ hostId })).toThrow(/unsupported host/)
  })

  it('refuses a provided unsupported descriptor', () => {
    expect(() =>
      createHostInstallContext(
        { ...claudeDescriptor('/fixture'), id: 'cursor' },
        {
          userHome: '/fixture',
          os: 'linux',
        },
      ),
    ).toThrow(/unsupported host/)
  })

  it.each([
    'claude',
    'codex',
  ] as const)('uses descriptor home for an explicitly empty %s root', (hostId) => {
    vi.stubEnv('HARNESSED_PLATFORM', hostId)
    vi.stubEnv('HARNESSED_ROOT_OVERRIDE', '')
    vi.stubEnv(hostId === 'codex' ? 'CODEX_HOME' : 'CLAUDE_CONFIG_DIR', '')
    const context = captureHostInstallContext({ userHome: '/fixture' })
    expect(context.nativeHome).toBe(join('/fixture', `.${hostId}`))
    expect(context.platform.stateRoot).toBe(join('/fixture', `.${hostId}`, 'harnessed'))
  })
})
