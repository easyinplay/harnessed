// Phase 20 — opt-in "update available" doctor check (GSD `/gsd-update`-style
// surface). 'warn' ONLY when genuinely behind the published version; 'pass' when
// current, ahead (local dev), or when npm is unreachable (fail-soft — a missing
// network is not a health failure and must not flip the doctor summary). The
// version fetcher is injectable for testing.

import pkg from '../../../package.json' with { type: 'json' }
import type { CheckResult } from './check-builtin.js'
import { compareVersions, fetchLatestVersion } from './version-check.js'

export async function checkUpdate(
  installed: string = pkg.version,
  fetch: () => Promise<string | null> = fetchLatestVersion,
): Promise<CheckResult> {
  const latest = await fetch()
  if (!latest) {
    return { name: 'update', status: 'pass', message: 'update check skipped (npm unreachable)' }
  }
  if (compareVersions(installed, latest) === 'behind') {
    return {
      name: 'update',
      status: 'warn',
      message: `update available: ${installed} → ${latest}`,
      fix: 'run `harnessed update`',
    }
  }
  return { name: 'update', status: 'pass', message: `up to date (${installed})` }
}
