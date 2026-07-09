// 4.22.2 T2 — `harnessed exempt-gateguard`: the dual-guard conflict fix channel.
//
// Invocation IS the consent: this command is reached either through the doctor
// auto-install confirm (default YES, D1) or typed by the user from the refusal
// block / non-interactive advice — so it applies without another prompt, while
// keeping D2 transparency (exact diff line + target + backup printed via the
// shared flow before the write) and the D6 red line (backup-first, append-only).
//
// Exit codes: 0 = applied / already-exempt / no-yml-explained; 1 = write error
// (auto-install surfaces non-zero as a failed fix).

import type { Command } from 'commander'
import { runExemptionFlow } from './lib/guard-exemption.js'

export function registerExemptGateguard(program: Command): void {
  program
    .command('exempt-gateguard')
    .description(
      'Add ".planning/**" to GateGuard\'s ignore_paths (.gateguard.yml) — resolves the ' +
        'dual-guard filename conflict with the harnessed evidence guard (backup-first, append-only)',
    )
    .action(async () => {
      const result = await runExemptionFlow({
        print: (line) => console.log(line),
        confirm: async () => true, // consent = invocation (see header)
      })
      if (result === 'already') {
        console.log(
          '✓ [harnessed] .planning/** is already exempted in .gateguard.yml — nothing to do.',
        )
      }
      if (result === 'no-yml') {
        console.log(
          '[harnessed] no .gateguard.yml found (project cwd or home). Your GateGuard variant is ' +
            'likely the bundled ecc fact-forcing hook (no filename policy / no config file) or a ' +
            'custom hookify rule. If subagent Writes are being blocked: have the MAIN session ' +
            'perform the artifact writes, or set ECC_GATEGUARD=off for harnessed-orchestrated sessions.',
        )
      }
      process.exit(result === 'error' ? 1 : 0)
    })
}
