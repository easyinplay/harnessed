import { describe, expect, it } from 'vitest'
import { verificationEnv } from '../../src/installers/lib/verificationEnv.js'

describe('verificationEnv', () => {
  const safe = {
    PATH: '/fixture/bin',
    PATHEXT: '.EXE;.CMD',
    COMSPEC: '/fixture/cmd.exe',
    SystemRoot: '/fixture/windows',
    WINDIR: '/fixture/windows',
    HOME: '/fixture/home',
    USERPROFILE: '/fixture/home',
    APPDATA: '/fixture/roaming',
    LOCALAPPDATA: '/fixture/local',
    TEMP: '/fixture/temp',
    TMP: '/fixture/tmp',
    TMPDIR: '/fixture/tmpdir',
    CODEX_HOME: '/fixture/codex',
    CLAUDE_CONFIG_DIR: '/fixture/claude',
    HARNESSED_PLATFORM: 'codex',
    PLAYWRIGHT_BROWSERS_PATH: '/fixture/browsers',
    MSYS: 'existing-msys-policy',
    CYGWIN: 'existing-cygwin-policy',
    MSYS2: 'existing-msys2-policy',
    MSYS2_ARG_CONV_EXCL: 'existing-arg-policy',
    MSYS_NO_PATHCONV: 'existing-path-policy',
  }
  const unsafe = {
    ANTHROPIC_API_KEY: 'fixture-provider-key',
    OPENAI_API_KEY: 'fixture-other-provider-key',
    OPENAI_AUTH_TOKEN: 'fixture-provider-auth',
    NPM_TOKEN: 'fixture-npm-token',
    NODE_AUTH_TOKEN: 'fixture-node-auth',
    npm_config_token: 'fixture-npm-config-token',
    BASH_ENV: 'fixture-bash-hook',
    ENV: 'fixture-shell-hook',
    NODE_OPTIONS: 'fixture-node-hook',
    NODE_PATH: 'fixture-node-path',
    PYTHONSTARTUP: 'fixture-python-hook',
    PYTHONPATH: 'fixture-python-path',
    SHELLOPTS: 'fixture-shell-options',
    BASHOPTS: 'fixture-bash-options',
    LD_PRELOAD: 'fixture-loader-hook',
    DYLD_INSERT_LIBRARIES: 'fixture-dyld-hook',
    GSTACK_AUTH_TOKEN: 'fixture-gstack-auth',
    PLAYWRIGHT_AUTH_TOKEN: 'fixture-playwright-auth',
    GSTACK_UNREVIEWED_PATH: '/fixture/unapproved',
    PLAYWRIGHT_UNREVIEWED_PATH: '/fixture/unapproved',
  }

  it.each([
    'linux',
    'win32',
  ] as const)('uses an exact allowlist for parent and install overrides on %s', (platform) => {
    const parent = { ...safe, ...unsafe }
    const overrides = { ...unsafe, HOME: '/fixture/override-home', CODEX_HOME: '' }

    expect(verificationEnv(parent, overrides, platform)).toEqual({
      ...safe,
      HOME: '/fixture/override-home',
      CODEX_HOME: '',
    })
    expect(parent.CODEX_HOME).toBe('/fixture/codex')
    expect(overrides.CODEX_HOME).toBe('')
  })

  it('deduplicates Windows key casing with install overrides taking precedence', () => {
    expect(
      verificationEnv(
        {
          PATH: 'parent-path',
          Path: 'other-parent-path',
          CODEX_HOME: 'parent-home',
          SystemRoot: 'parent-root',
        },
        {
          pAtH: 'install-path',
          codex_home: '',
          SYSTEMROOT: 'install-root',
          openai_api_key: 'fixture-secret',
          node_options: 'fixture-hook',
        },
        'win32',
      ),
    ).toEqual({ PATH: 'install-path', CODEX_HOME: '', SystemRoot: 'install-root' })
  })

  it('keeps POSIX names case sensitive', () => {
    expect(
      verificationEnv(
        { PATH: 'parent-path' },
        { Path: 'wrong-case', codex_home: 'wrong-case' },
        'linux',
      ),
    ).toEqual({ PATH: 'parent-path' })
  })

  it('never synthesizes shell policy or missing path values', () => {
    expect(verificationEnv({}, { CODEX_HOME: '' }, 'win32')).toEqual({ CODEX_HOME: '' })
  })
})
