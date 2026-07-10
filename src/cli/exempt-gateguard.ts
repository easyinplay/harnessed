// 4.23.0 (T8) — `harnessed exempt-gateguard`: the dual-guard conflict fix
// channel, now writing the upstream env exemption (GATEGUARD_EXEMPT_GLOBS)
// into the harness settings env. Supersedes the 4.22.2 `.gateguard.yml`
// append channel (removed — user decision 2026-07-10: single channel).
//
// Invocation IS the consent: this command is reached either through the doctor
// auto-install confirm (default YES, D1) or typed by the user from the refusal
// block / non-interactive advice — so it applies without another prompt, while
// keeping D2 transparency (exact env change + target + backup printed via the
// shared flow before the write).
//
// Exit codes: 0 = applied / already-exempt / advice-explained; 1 = write error
// (auto-install surfaces non-zero as a failed fix).

import type { Command } from 'commander'
import {
  applyEnvExemption,
  probeExemptCapability,
  readCurrentEnvValue,
  runExemptionFlow,
  upgradeAdviceLines,
} from './lib/guard-exemption.js'

export function registerExemptGateguard(program: Command): void {
  program
    .command('exempt-gateguard')
    .description(
      'Persist GATEGUARD_EXEMPT_GLOBS=".planning/**" into the harness settings env — resolves ' +
        'the dual-guard conflict with the harnessed evidence guard (backup-first, atomic write)',
    )
    .action(async () => {
      // Module exports passed explicitly as deps: keeps the flow's collaborators
      // factory-mockable in tests (same seam the checkpoint pre-check uses).
      const result = await runExemptionFlow({
        probe: () => probeExemptCapability(),
        readEnvValue: () => readCurrentEnvValue(),
        merge: (value) => applyEnvExemption(value),
        print: (line) => console.log(line),
        confirm: async () => true, // consent = invocation (see header)
      })
      if (result === 'already') {
        console.log(
          '✓ [harnessed] .planning/** is already listed in GATEGUARD_EXEMPT_GLOBS — nothing to do.',
        )
      }
      if (result === 'not-capable') {
        for (const line of upgradeAdviceLines()) console.log(line)
      }
      process.exit(result === 'error' ? 1 : 0)
    })
}
