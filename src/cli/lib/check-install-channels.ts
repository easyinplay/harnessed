// 4.32.4 — cross-channel install detection. harnessed ships two install
// channels (npm-global package + standalone binary). When BOTH are present the
// setup is ambiguous: a bare `harnessed` resolves to whichever dir is earlier
// on PATH, and updating one channel leaves the other stale. Detect it and
// advise picking a single channel (keep npm + delete binary, OR keep binary +
// npm uninstall). Warn-only — dual install is confusing, not broken.
//
// Surfaced at the two chokepoints both install flows pass through:
//   - `harnessed doctor` (checkInstallChannels, on-demand)
//   - end of `harnessed setup` (dualChannelLines, both flows run setup)
// and mirrored by install.ps1 / install.sh's shadow guard at binary-install time.

import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { posix, win32 } from 'node:path'
import { isCompiledRuntime } from './assetsRoot.js'
import type { CheckResult } from './check-builtin.js'

/** Platform-correct path.join regardless of the HOST os — the candidate paths
 *  describe the TARGET platform, not wherever this code happens to run. */
function joinFor(platform: NodeJS.Platform): (...parts: string[]) => string {
  return platform === 'win32' ? win32.join : posix.join
}

export type InstallChannel = 'binary' | 'npm'

export interface InstallChannelsResult {
  /** Filesystem path of the standalone binary, when detectable; null otherwise. */
  binaryPath: string | null
  /** Filesystem path of the npm-global shim, when detectable; null otherwise. */
  npmPath: string | null
  /** Which channel THIS process was launched from. */
  running: InstallChannel
  /** True when both channels are present — the only state worth warning about. */
  both: boolean
}

export interface DetectInstallChannelsDeps {
  platform: NodeJS.Platform
  home: string
  env: NodeJS.ProcessEnv
  execPath: string
  exists: (p: string) => boolean
  /** `npm prefix -g` output, or null when npm is missing / errored. */
  npmPrefix: () => string | null
  running: InstallChannel
}

/** `npm prefix -g` — fail-soft to null (npm missing, timeout, non-zero exit). */
function realNpmPrefix(): string | null {
  try {
    if (typeof spawnSync !== 'function') return null
    const r = spawnSync('npm', ['prefix', '-g'], { encoding: 'utf8', timeout: 5000 })
    if (!r || r.error || r.status !== 0) return null
    const out = (r.stdout ?? '').trim()
    return out.length > 0 ? out : null
  } catch {
    return null
  }
}

/** Canonical standalone-binary install location (matches install.ps1 / install.sh). */
function binaryCandidate(platform: NodeJS.Platform, home: string, env: NodeJS.ProcessEnv): string {
  const j = joinFor(platform)
  if (platform === 'win32') {
    const local = env.LOCALAPPDATA ?? j(home, 'AppData', 'Local')
    return j(local, 'harnessed', 'bin', 'harnessed.exe')
  }
  return j(home, '.local', 'bin', 'harnessed')
}

/** npm-global harnessed shim: Windows drops `.cmd` in the prefix root, unix uses prefix/bin. */
function npmCandidate(platform: NodeJS.Platform, prefix: string): string {
  const j = joinFor(platform)
  return platform === 'win32' ? j(prefix, 'harnessed.cmd') : j(prefix, 'bin', 'harnessed')
}

export function detectInstallChannels(
  deps?: Partial<DetectInstallChannelsDeps>,
): InstallChannelsResult {
  const platform = deps?.platform ?? process.platform
  const home = deps?.home ?? homedir()
  const env = deps?.env ?? process.env
  const execPath = deps?.execPath ?? process.execPath
  const exists = deps?.exists ?? existsSync
  const npmPrefix = deps?.npmPrefix ?? realNpmPrefix
  const running = deps?.running ?? (isCompiledRuntime() ? 'binary' : 'npm')

  // The channel we're running IS present by definition; detect the OTHER by path.
  const binCand = binaryCandidate(platform, home, env)
  const binaryPresent = running === 'binary' || exists(binCand)
  // Prefer the real running exe path when we ARE the binary (canonical may differ).
  const binaryPath = running === 'binary' ? execPath : binaryPresent ? binCand : null

  const prefix = npmPrefix()
  const npmCand = prefix ? npmCandidate(platform, prefix) : null
  const npmPresent = running === 'npm' || (npmCand != null && exists(npmCand))
  const npmPath = npmCand != null && exists(npmCand) ? npmCand : null

  return { binaryPath, npmPath, running, both: binaryPresent && npmPresent }
}

/** Advisory lines for the both-channels-present state (English; shared by
 *  doctor fix text + setup output). Empty when only one channel is present. */
export function dualChannelLines(r: InstallChannelsResult): string[] {
  if (!r.both) return []
  const bin = r.binaryPath ?? 'the standalone binary'
  const npm = r.npmPath ?? 'the npm-global package'
  return [
    'both harnessed install channels are present — a bare `harnessed` uses whichever',
    'is earlier on PATH, and updating one leaves the other stale:',
    `  binary: ${bin}`,
    `  npm:    ${npm}`,
    `you are running the ${r.running} one. pick a single channel:`,
    '  keep npm    → update with `npm install -g harnessed@latest`; delete the binary + remove its bin dir from PATH',
    '  keep binary → update with `harnessed update`; then `npm uninstall -g harnessed`',
  ]
}

export function checkInstallChannels(deps?: Partial<DetectInstallChannelsDeps>): CheckResult {
  const r = detectInstallChannels(deps)
  if (!r.both) {
    return {
      name: 'install channel',
      status: 'pass',
      message: `single channel (${r.running})`,
    }
  }
  return {
    name: 'install channel',
    status: 'warn',
    message: `both npm-global and standalone-binary harnessed are installed (running the ${r.running} one) — updating one leaves the other stale`,
    fix: `pick one: keep npm → 'npm install -g harnessed@latest' + delete ${r.binaryPath ?? 'the binary'} (and remove its bin dir from PATH); or keep binary → 'harnessed update' + 'npm uninstall -g harnessed'`,
  }
}
