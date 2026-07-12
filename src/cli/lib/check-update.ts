// Phase 20 — opt-in "update available" doctor check (GSD `/gsd-update`-style
// surface). 'warn' ONLY when genuinely behind the published version; 'pass' when
// current, ahead (local dev), or when the network is unreachable (fail-soft — a
// missing network is not a health failure and must not flip the doctor summary).
// The version fetcher is injectable for testing.
//
// 4.27.0 (B3 T4) — the default resolver is now the shared 24h cache with the
// compiled/npm source split (update-check-cache.ts): doctor previously ran an
// uncached `npm view` on every invocation, and on binary-only machines that
// source was permanently unreachable → the reminder was dead for exactly the
// users it exists for.

import pkg from '../../../package.json' with { type: 'json' }
import type { CheckResult } from './check-builtin.js'
import { compareVersions } from './version-check.js'

async function defaultResolver(): Promise<string | null> {
  const { resolveLatestCachedDefault } = await import('./update-check-cache.js')
  return resolveLatestCachedDefault()
}

export async function checkUpdate(
  installed: string = pkg.version,
  fetch: () => Promise<string | null> = defaultResolver,
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
