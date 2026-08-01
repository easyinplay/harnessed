// 4.32.22 — 20th doctor check: ECC per-harness install detect.
//
// ECC (manifests/optional/ecc.yaml — BONUS TIER; the 4.32.22 interim
// base-promotion was withdrawn after empirical study) is multi-harness:
//   - CC side: plugin marketplace install (`claude plugin install ecc@ecc`) →
//     `ecc@ecc` key in ~/.claude/plugins/installed_plugins.json. Probed via the
//     shared fs-based isPluginRegistered helper (NO `claude` CLI spawn —
//     sister check-mattpocock-skills.ts file-probe convention + its legacy
//     settings.json enabledPlugins fallbacks).
//   - codex side: README-recommended sync flow (clone kept at
//     ~/.codex/.cache/ecc + scripts/sync-ecc-to-codex.sh) → probe
//     `~/.codex/.cache/ecc/.git` (same detection as the manifest's
//     harness_overrides.codex verify cmd). `~/.codex/config.toml` absent →
//     the codex HARNESS is not present — report codex-not-present, never
//     "ecc missing" (an orphan clone cache without a codex install does not
//     count as installed).
// The two sides are detected INDEPENDENTLY — a user may have either, both, or
// neither; one side is never inferred from the other.
//
// Status semantics (4.32.22 final — ecc is BONUS TIER, chrome-devtools is
// either/or between ecc and the optional self-install manifest):
//   - installed on ≥1 side → pass (chrome-devtools connector comes with it)
//   - missing on both     → pass-INFORMATIONAL (sister check-codegraph:
//     absence of an optional tool is not a health failure) — note the value
//     (finer-grained orchestration) AND the honest cost (~20k+ tokens/session
//     static listing, ECC-side) so opting in is an informed choice, AND (new)
//     whether chrome-devtools is left with ZERO providers, since this is the
//     only branch where that can happen
//   - dual-install leftovers (CC side, ecc present): the official
//     chrome-devtools-mcp@claude-plugins-official plugin still enabled
//     (4.32.21 interim scheme) OR a chrome-devtools-mcp stdio entry still in
//     ~/.claude.json mcpServers (pre-4.32.21 install or the optional
//     chrome-devtools-mcp.yaml fallback — either/or with ecc) →
//     warn: same-name dual-prefix ambiguity; remove the leftover, keep ecc.
// All three registration probes (ecc plugin / official chrome-devtools plugin /
// chrome-devtools stdio entry) come from the SHARED
// src/cli/lib/probe-chrome-devtools.ts, which is also what the
// `chrome_devtools_available` gate fact reads — one definition, so the doctor
// report and the runtime gate cannot drift apart.

import { stat } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import type { CheckResult } from './check-builtin.js'
import { CHROME_DEVTOOLS_ENABLE_PATHS, probeChromeDevtools } from './probe-chrome-devtools.js'

const NAME = 'ecc'

async function pathExists(p: string): Promise<boolean> {
  try {
    await stat(p)
    return true
  } catch {
    return false
  }
}

export async function checkEcc(): Promise<CheckResult> {
  // CC side — plugin registry probe (pure fs; marketplace key is `ecc@ecc`).
  // Shared with the chrome_devtools_available gate fact so the doctor report and
  // the runtime gate can never disagree (src/cli/lib/probe-chrome-devtools.ts).
  const cdt = await probeChromeDevtools()
  const ccInstalled = cdt.ecc

  // codex side — platform marker first, THEN the sync-clone probe.
  const codexHome = join(homedir(), '.codex')
  const codexPresent = await pathExists(join(codexHome, 'config.toml'))
  const codexInstalled =
    codexPresent && (await pathExists(join(codexHome, '.cache', 'ecc', '.git')))

  const ccPart = ccInstalled ? 'CC: installed (plugin ecc@ecc)' : 'CC: not installed'
  const codexPart = codexPresent
    ? codexInstalled
      ? 'codex: installed (~/.codex/.cache/ecc sync clone)'
      : 'codex: not installed'
    : 'codex: not present (no ~/.codex/config.toml)'

  // Dual-install leftover detect (CC side, only meaningful when ecc is there):
  // ECC's only default MCP connector IS chrome-devtools, so any other
  // chrome-devtools channel alongside it duplicates the connector.
  if (ccInstalled) {
    const leftovers: string[] = []
    const fixes: string[] = []
    if (cdt.standalonePlugin) {
      leftovers.push('official chrome-devtools-mcp@claude-plugins-official plugin still enabled')
      fixes.push('`claude plugin uninstall chrome-devtools-mcp@claude-plugins-official`')
    }
    if (cdt.standaloneStdio) {
      leftovers.push('chrome-devtools-mcp stdio entry still registered in mcpServers')
      fixes.push('`claude mcp remove chrome-devtools-mcp`')
    }
    if (leftovers.length > 0) {
      return {
        name: NAME,
        status: 'warn',
        message:
          `${ccPart}; ${codexPart}; chrome-devtools dual-install — ECC already bundles the ` +
          `chrome-devtools connector (its only default MCP), but: ${leftovers.join('; ')} ` +
          '(same-name dual-prefix tool-call ambiguity)',
        fix: `remove the leftover, keep ecc: ${fixes.join(' and ')}`,
      }
    }
  }

  if (!ccInstalled && !codexInstalled) {
    // 4.32.22 final — ecc is BONUS TIER: absence is informational, never a
    // health gap (sister check-codegraph). Sell the value, be honest about the
    // ECC-side token cost so opting in is an informed choice.
    //
    // This is ALSO the only branch where chrome-devtools can end up with ZERO
    // providers: ecc is absent, so the connector is only there if the user
    // self-installed the standalone server. Pre-fix this branch said nothing
    // about that, and the perf / a11y / memory diagnostic lane went quiet with
    // no report anywhere. Status stays `pass` — an absent optional tool is
    // informational, not a health failure (sister check-codegraph); the gap was
    // the message being incomplete, not the severity.
    const cdtPart = cdt.unknown
      ? ' Separately, the chrome-devtools provider probe FAULTED (unreadable plugin registry / MCP config) — availability unknown, so the perf / a11y / memory diagnostic lane is left ON (fail-soft).'
      : cdt.providers.length > 0
        ? ` chrome-devtools is still covered by the standalone provider (${cdt.providers.join(' + ')}).`
        : ' NOTE: chrome-devtools now has ZERO providers, so the perf / a11y / memory diagnostic lane ' +
          '(verify-qa `05-perf-a11y-diagnostic`) will not run — ' +
          `${CHROME_DEVTOOLS_ENABLE_PATHS}`
    return {
      name: NAME,
      status: 'pass',
      message:
        `not installed (${ccPart}; ${codexPart}) — optional enhancement: ` +
        '`harnessed install ecc` unlocks finer-grained orchestration ' +
        '(per-language review/build expert routing etc.) at a ~20k+ tokens/session ' +
        `static-listing cost (ECC-side scale, not harnessed).${cdtPart}`,
    }
  }

  return {
    name: NAME,
    status: 'pass',
    message: `${ccPart}; ${codexPart} — chrome-devtools connector provided by ECC`,
  }
}
