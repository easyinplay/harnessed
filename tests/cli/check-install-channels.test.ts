// 4.32.4 — cross-channel install detection unit tests. Pure logic via injected
// deps (no real fs / npm spawn). Covers the 2×2×presence matrix that decides
// whether to warn about a dual npm + binary install.
import { describe, expect, it } from 'vitest'
import {
  checkInstallChannels,
  detectInstallChannels,
  dualChannelLines,
} from '../../src/cli/lib/check-install-channels.js'

const WIN_BIN = 'C:\\Users\\u\\AppData\\Local\\harnessed\\bin\\harnessed.exe'
const WIN_NPM = 'C:\\Users\\u\\AppData\\Roaming\\npm\\harnessed.cmd'

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

describe('detectInstallChannels — both-present matrix', () => {
  it('running npm + binary on disk → both=true', () => {
    const r = detectInstallChannels(
      winDeps({ running: 'npm', exists: (p: string) => p === WIN_BIN }),
    )
    expect(r.both).toBe(true)
    expect(r.binaryPath).toBe(WIN_BIN)
    expect(r.running).toBe('npm')
  })

  it('running binary + npm shim on disk → both=true, binaryPath = execPath', () => {
    const r = detectInstallChannels(
      winDeps({ running: 'binary', execPath: WIN_BIN, exists: (p: string) => p === WIN_NPM }),
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

  it('unix paths — running npm + ~/.local/bin/harnessed present → both', () => {
    const UNIX_BIN = '/home/u/.local/bin/harnessed'
    const r = detectInstallChannels({
      platform: 'linux',
      home: '/home/u',
      env: {} as NodeJS.ProcessEnv,
      execPath: '/usr/bin/node',
      npmPrefix: () => '/usr/local',
      exists: (p: string) => p === UNIX_BIN,
      running: 'npm',
    })
    expect(r.both).toBe(true)
    expect(r.binaryPath).toBe(UNIX_BIN)
  })
})

describe('checkInstallChannels — CheckResult mapping', () => {
  it('single channel → pass', () => {
    const res = checkInstallChannels(winDeps({ running: 'npm', exists: () => false }))
    expect(res.status).toBe('pass')
    expect(res.name).toBe('install channel')
  })

  it('both channels → warn + dual-choice fix', () => {
    const res = checkInstallChannels(
      winDeps({ running: 'npm', exists: (p: string) => p === WIN_BIN }),
    )
    expect(res.status).toBe('warn')
    expect(res.fix).toContain('npm uninstall -g harnessed')
    expect(res.fix).toContain('harnessed update')
  })
})

describe('dualChannelLines', () => {
  it('empty when single channel', () => {
    const r = detectInstallChannels(winDeps({ running: 'npm', exists: () => false }))
    expect(dualChannelLines(r)).toEqual([])
  })

  it('names both paths + both update paths when dual', () => {
    const r = detectInstallChannels(
      winDeps({ running: 'npm', exists: (p: string) => p === WIN_BIN }),
    )
    const lines = dualChannelLines(r).join('\n')
    expect(lines).toContain(WIN_BIN)
    expect(lines).toContain('npm install -g harnessed@latest')
    expect(lines).toContain('harnessed update')
  })
})
