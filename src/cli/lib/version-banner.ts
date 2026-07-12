// Patch 4.11.1 — setup version banner (extracted to its own module so the
// setup-helpers mock in setup-locale/setup-platform tests no longer has to carry
// a versionBannerLines export). `harnessed setup` prints its own version + an
// npm-latest comparison at the very top of the run so users (and bug reports)
// unambiguously know which build ran — a stale log was mistaken for a new-version
// regression.

import pkg from '../../../package.json' with { type: 'json' }
import { isCompiledRuntime } from './assetsRoot.js'
import { compareVersions } from './version-check.js'

/** Build the banner lines for `harnessed setup`. Line 1 is always the installed
 *  version; line 2 (when determinable) is the latest-version verdict:
 *    behind  → `⚠ update available: <installed> → <latest> — <updateHint>`
 *    current → `✓ latest (v<latest>)`
 *    ahead   → `✓ latest (v<installed>)` (local/dev build newer than npm)
 *    offline → `  could not check latest version`
 *    unknown (malformed version) → no verdict line (no false claim).
 *  4.27.0 — updateHint is parameterized: compiled binaries point at
 *  `harnessed update` (npm command is meaningless there); default keeps the
 *  npm text byte-identical. */
export function versionBannerLines(
  installed: string,
  latest: string | null,
  updateHint = 'npm install -g harnessed@latest',
): string[] {
  const lines = [`harnessed setup v${installed}`]
  if (latest === null) {
    lines.push('  could not check latest version')
    return lines
  }
  const cmp = compareVersions(installed, latest)
  if (cmp === 'behind') {
    lines.push(`⚠ update available: ${installed} → ${latest} — ${updateHint}`)
  } else if (cmp === 'current') {
    lines.push(`✓ latest (v${latest})`)
  } else if (cmp === 'ahead') {
    lines.push(`✓ latest (v${installed})`)
  }
  return lines
}

/** ASCII wordmark printed atop `harnessed setup` (Calvin S box-drawing font) +
 *  a parrot tagline nodding to the README joke ("parrots mimic — we orchestrate"). */
const BANNER_ART = [
  '╦ ╦╔═╗╦═╗╔╗╔╔═╗╔═╗╔═╗╔═╗╔╦╗',
  '╠═╣╠═╣╠╦╝║║║║╣ ╚═╗╚═╗║╣  ║║',
  '╩ ╩╩ ╩╩╚═╝╚╝╚═╝╚═╝╚═╝╚═╝═╩╝',
  '🦜 parrots mimic — we orchestrate',
]

/** Impure — print the ASCII wordmark, then resolve this build's version +
 *  latest (4.27.0: through the shared 24h cache with the compiled/npm source
 *  split; fail-soft, offline → null, never blocks) and print the version
 *  banner. Printed in --dry-run too — the version is wanted regardless of mode. */
export async function printSetupVersionBanner(): Promise<void> {
  for (const line of BANNER_ART) console.log(line)
  const { resolveLatestCachedDefault } = await import('./update-check-cache.js')
  const latest = await resolveLatestCachedDefault()
  const hint = isCompiledRuntime() ? 'harnessed update' : undefined
  for (const line of versionBannerLines(pkg.version, latest, hint)) console.log(line)
}
