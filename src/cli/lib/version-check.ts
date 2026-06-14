// Phase 20 — version comparison for `harnessed update` + the update doctor check.
// No semver dependency: a minimal numeric-segment + prerelease compare. Network
// access is isolated behind an injectable runner so callers/tests stay fail-soft.

import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

export type VersionComparison = 'current' | 'behind' | 'ahead' | 'unknown'

interface Parsed {
  nums: [number, number, number]
  pre: string | null
}

function parse(v: string): Parsed | null {
  const m = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/.exec(v.trim())
  if (!m) return null
  return { nums: [Number(m[1]), Number(m[2]), Number(m[3])], pre: m[4] ?? null }
}

/** Pure — compare `installed` against `latest`. Malformed input → 'unknown'.
 *  A prerelease sorts BELOW its released version (4.5.0-rc.1 < 4.5.0). */
export function compareVersions(installed: string, latest: string): VersionComparison {
  const a = parse(installed)
  const b = parse(latest)
  if (!a || !b) return 'unknown'
  for (let i = 0; i < 3; i++) {
    const ai = a.nums[i] ?? 0
    const bi = b.nums[i] ?? 0
    if (ai < bi) return 'behind'
    if (ai > bi) return 'ahead'
  }
  // equal core: release > prerelease
  if (a.pre && !b.pre) return 'behind'
  if (!a.pre && b.pre) return 'ahead'
  if (a.pre && b.pre && a.pre !== b.pre) return a.pre < b.pre ? 'behind' : 'ahead'
  return 'current'
}

function npmExecutable(): string {
  return process.platform === 'win32' ? 'npm.cmd' : 'npm'
}

async function defaultRunner(): Promise<string> {
  const { stdout } = await execFileAsync(npmExecutable(), ['view', 'harnessed', 'version'], {
    timeout: 8000,
    windowsHide: true,
  })
  return stdout
}

/** Fail-soft — resolve the latest published harnessed version, or null on any
 *  failure (network, timeout, non-semver output). NEVER throws. The runner is
 *  injectable so unit tests do not spawn npm. */
export async function fetchLatestVersion(
  runner: () => Promise<string> = defaultRunner,
): Promise<string | null> {
  try {
    const out = (await runner()).trim()
    return /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(out) ? out : null
  } catch {
    return null
  }
}
