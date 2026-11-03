// 4.32.4 — cross-channel install detection unit tests. Pure logic via injected
// deps (no real fs / npm spawn). Covers the presence matrix that decides
// whether to warn about a dual npm + binary install.
//
// Channel presence follows what is on DISK, never which channel is running: a
// source checkout (`node dist/cli.mjs`) reports `running: 'npm'` while no
// npm-global shim exists — the old logic called that a dual install.
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  checkInstallChannels,
  detectInstallChannels,
  dualChannelLines,
} from '../../src/cli/lib/check-install-channels.js'

const WIN_BIN = 'C:\\Users\\u\\AppData\\Local\\harnessed\\bin\\harnessed.exe'
const WIN_NPM = 'C:\\Users\\u\\AppData\\Roaming\\npm\\harnessed.cmd'
const originalBun = Object.getOwnPropertyDescriptor(process.versions, 'bun')
const useBun = () =>
  Object.defineProperty(process.versions, 'bun', { configurable: true, value: '1.4.4' })

afterEach(() => {
  if (originalBun) Object.defineProperty(process.versions, 'bun', originalBun)
  else Reflect.deleteProperty(process.versions, 'bun')
})

function winDeps(over: Record<string, unknown>) {
  return {
    platform: 'win32' as const,
    home: 'C:\\Users\\u',
    env: { LOCALAPPDATA: 'C:\\Users\\u\\AppData\\Local' } as NodeJS.ProcessEnv,
    execPath: WIN_BIN,
    npmPrefix: () => 'C:\\Users\\u\\AppData\\Roaming\\npm',
    exists: () => false,
    running: 'npm' as const,
    ...over,
  }
}

/** exists() stub matching an explicit set of present paths. */
const present =
  (...paths: string[]) =>
  (p: string) =>
    paths.includes(p)

describe('detectInstallChannels — both-present matrix', () => {
  it('running npm + binary AND npm shim on disk → both=true', () => {
    const r = detectInstallChannels(winDeps({ running: 'npm', exists: present(WIN_BIN, WIN_NPM) }))
    expect(r.both).toBe(true)
    expect(r.binaryPath).toBe(WIN_BIN)
    expect(r.npmPath).toBe(WIN_NPM)
    expect(r.running).toBe('npm')
  })

  it('running binary + npm shim on disk → both=true, binaryPath = execPath', () => {
    const r = detectInstallChannels(
      winDeps({ running: 'binary', execPath: WIN_BIN, exists: present(WIN_NPM) }),
    )
    expect(r.both).toBe(true)
    expect(r.binaryPath).toBe(WIN_BIN) // running exe path, not a canonical guess
    expect(r.npmPath).toBe(WIN_NPM)
  })

  it('running npm, no binary on disk → both=false (single channel)', () => {
    const r = detectInstallChannels(winDeps({ running: 'npm', exists: () => false }))
    expect(r.both).toBe(false)
    expect(r.binaryPath).toBeNull()
  })

  it('running binary, npm prefix unresolved → both=false (npm not detected)', () => {
    const r = detectInstallChannels(
      winDeps({ running: 'binary', npmPrefix: () => null, exists: () => false }),
    )
    expect(r.both).toBe(false)
    expect(r.npmPath).toBeNull()
  })

  it('unix paths — running npm + ~/.local/bin/harnessed + npm shim present → both', () => {
    const UNIX_BIN = '/home/u/.local/bin/harnessed'
    const UNIX_NPM = '/usr/local/bin/harnessed'
    const r = detectInstallChannels({
      platform: 'linux',
      home: '/home/u',
      env: {} as NodeJS.ProcessEnv,
      execPath: '/usr/bin/node',
      npmPrefix: () => '/usr/local',
      exists: present(UNIX_BIN, UNIX_NPM),
      running: 'npm',
    })
    expect(r.both).toBe(true)
    expect(r.binaryPath).toBe(UNIX_BIN)
    expect(r.npmPath).toBe(UNIX_NPM)
  })
})

describe('detectInstallChannels — presence follows DISK, not the running channel', () => {
  it('source checkout (running npm) + binary on disk, NO npm shim → both=false', () => {
    const r = detectInstallChannels(winDeps({ running: 'npm', exists: present(WIN_BIN) }))
    expect(r.both).toBe(false)
    expect(r.binaryPath).toBe(WIN_BIN)
    expect(r.npmPath).toBeNull()
    expect(r.running).toBe('npm')
  })

  it('source checkout + binary on disk → no dual-install advisory', () => {
    const r = detectInstallChannels(winDeps({ running: 'npm', exists: present(WIN_BIN) }))
    expect(dualChannelLines(r)).toEqual([])
  })

  it('running binary + npm shim absent → both=false', () => {
    const r = detectInstallChannels(
      winDeps({ running: 'binary', execPath: WIN_BIN, exists: present(WIN_BIN) }),
    )
    expect(r.both).toBe(false)
    expect(r.binaryPath).toBe(WIN_BIN)
    expect(r.npmPath).toBeNull()
  })

  it('npm shim present + binary absent → both=false', () => {
    const r = detectInstallChannels(winDeps({ running: 'npm', exists: present(WIN_NPM) }))
    expect(r.both).toBe(false)
    expect(r.binaryPath).toBeNull()
    expect(r.npmPath).toBe(WIN_NPM)
  })
})

describe('checkInstallChannels — CheckResult mapping', () => {
  it.each([
    true,
    false,
  ])('Bun reports only package runtime and the known binary path (binary=%s)', (binary) => {
    useBun()
    const npmPrefix = vi.fn(() => null)
    const res = checkInstallChannels(
      winDeps({
        exists: (p: string) => binary && p === WIN_BIN,
        npmPrefix,
      }),
    )
    expect(res.status).toBe(binary ? 'warn' : 'pass')
    expect(res.message).toContain('package install running on Bun; install manager not inferred')
    expect(res.message).toContain('not fully enumerated')
    expect(res.message).not.toMatch(/running (?:the )?npm|single channel|both npm-global/)
    expect(npmPrefix).not.toHaveBeenCalled()
    if (binary) expect(res.message).toContain(WIN_BIN)
  })

  it('no channel on disk → pass (source checkout, nothing installed)', () => {
    const res = checkInstallChannels(winDeps({ running: 'npm', exists: () => false }))
    expect(res.status).toBe('pass')
    expect(res.name).toBe('install channel')
    expect(res.message).toContain('no install channel on disk')
  })

  it('source checkout + binary only → pass (no false dual-install warning)', () => {
    const res = checkInstallChannels(winDeps({ running: 'npm', exists: present(WIN_BIN) }))
    expect(res.status).toBe('pass')
    expect(res.message).toContain('single channel (binary)')
    expect(res.fix).toBeUndefined()
  })

  it('npm shim only → names the npm channel', () => {
    const res = checkInstallChannels(winDeps({ running: 'npm', exists: present(WIN_NPM) }))
    expect(res.status).toBe('pass')
    expect(res.message).toContain('single channel (npm)')
  })

  it('both channels → warn + dual-choice fix', () => {
    const res = checkInstallChannels(winDeps({ running: 'npm', exists: present(WIN_BIN, WIN_NPM) }))
    expect(res.status).toBe('warn')
    expect(res.fix).toContain('npm uninstall -g harnessed')
    expect(res.fix).toContain('harnessed update')
  })
})

describe('dualChannelLines', () => {
  it('Bun setup advisory does not report an inferred npm source', () => {
    const result = detectInstallChannels(winDeps({ exists: present(WIN_BIN) }))
    useBun()
    const lines = dualChannelLines(result).join('\n')
    expect(lines).toContain('package install running on Bun; install manager not inferred')
    expect(lines).toContain(WIN_BIN)
    expect(lines).toContain('not fully enumerated')
    expect(lines).not.toContain('you are running the npm one')
    expect(lines).not.toContain('both harnessed install channels')
  })

  it('empty when single channel', () => {
    const r = detectInstallChannels(winDeps({ running: 'npm', exists: () => false }))
    expect(dualChannelLines(r)).toEqual([])
  })

  it('empty when the running channel has no npm-global shim on disk', () => {
    const r = detectInstallChannels(winDeps({ running: 'npm', exists: present(WIN_BIN) }))
    expect(dualChannelLines(r)).toEqual([])
  })

  it('names both paths + both update paths when dual', () => {
    const r = detectInstallChannels(winDeps({ running: 'npm', exists: present(WIN_BIN, WIN_NPM) }))
    const lines = dualChannelLines(r).join('\n')
    expect(lines).toContain(WIN_BIN)
    expect(lines).toContain(WIN_NPM)
    expect(lines).toContain('pick a single channel')
    expect(lines).toContain('npm install -g harnessed@latest')
    expect(lines).toContain('harnessed update')
  })

  it('shows the detected npm shim path, not the generic fallback', () => {
    const r = detectInstallChannels(winDeps({ running: 'npm', exists: present(WIN_BIN, WIN_NPM) }))
    const lines = dualChannelLines(r).join('\n')
    expect(lines).toContain(`npm:    ${WIN_NPM}`)
    expect(lines).not.toContain('the npm-global package')
  })
})
