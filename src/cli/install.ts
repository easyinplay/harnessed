// Phase 1.2 cli subcommand `install` per ADR 0004 § 1 + § 6 + Pattern C narrow.
//
// IMPL NOTE (Rule 1 / ADR 0004 contract 1 — dry-run default + double flag):
// `harnessed install <name>` defaults to dry-run preview; explicit `--apply`
// or interactive `y/yes` is required to mutate. For automation (CI / scripts),
// callers MUST pass BOTH `--non-interactive --apply` (or `--non-interactive
// --dry-run`) — passing only `--apply` in non-TTY contexts is ambiguous, and
// passing only `--non-interactive` would block on @clack/prompts forever
// because stdin is not a TTY (Clack does not auto-decline).
//
// IMPL NOTE (H1 sister review fix — pre-action flag validation): we validate
// the flag combination BEFORE invoking the installer. `--non-interactive`
// without an explicit apply/dry-run choice would otherwise reach
// confirmAt() / spawnCmd() and deadlock waiting for a prompt response that
// will never arrive. Failing fast with exit 2 + actionable hint avoids the
// "harnessed hangs in CI" footgun.
//
// Exit code mapping (ADR 0004 contract 6 — no silent failure):
//   0 → install succeeded (ok: true)
//   1 → install failed (ok: false; print error.suggest if present)
//   2 → user-aborted / flag-missing / platform-mismatch (not an error)

import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import type { Command } from 'commander'
import { runInstall } from '../installers/index.js'
import type { InstallError, InstallOpts } from '../installers/lib/types.js'
import { validateManifestFile } from '../manifest/validate.js'

interface RawOpts {
  apply?: boolean
  dryRun?: boolean
  system?: boolean
  nonInteractive?: boolean
  fullDiff?: boolean
  color?: boolean // commander turns --no-color into color: false
}

function formatError(e: InstallError): string {
  const head = `error: ${e.message}`
  const where = e.path && e.path !== '/' ? `\n  at ${e.path}` : ''
  const tip = e.suggest ? `\n  fix:  ${e.suggest}` : ''
  return `${head}${where}${tip}`
}

export function registerInstall(program: Command): void {
  program
    .command('install <name>')
    .description('Install an upstream (dry-run by default — pass --apply to execute)')
    .option('--apply', 'execute the install (default: dry-run preview only)')
    .option('--dry-run', 'force dry-run (overrides --apply if both are set)')
    .option('--system', 'allow L4 system-wide install (e.g. global npm install)')
    .option('--non-interactive', 'skip all prompts (CI / scripts) — requires --apply or --dry-run')
    .option('--full-diff', 'expand diffs longer than 200 lines')
    .option('--no-color', 'disable ANSI colors (auto-detected when piped)')
    .action(async (name: string, raw: RawOpts) => {
      // H1 pre-action flag gate (see file header IMPL NOTE).
      if (raw.nonInteractive && !raw.apply && !raw.dryRun) {
        console.error(
          'error: --non-interactive requires an explicit --apply or --dry-run flag\n' +
            "  fix:  re-run as 'harnessed install <name> --non-interactive --dry-run' or '--apply'",
        )
        process.exit(2)
      }

      const manifestPath = resolve(process.cwd(), `manifests/tools/${name}.yaml`)
      const skillPackPath = resolve(process.cwd(), `manifests/skill-packs/${name}.yaml`)
      let yamlSrc: string
      let chosenPath = manifestPath
      try {
        yamlSrc = await readFile(manifestPath, 'utf8')
      } catch {
        try {
          yamlSrc = await readFile(skillPackPath, 'utf8')
          chosenPath = skillPackPath
        } catch {
          console.error(
            `error: manifest '${name}' not found\n` +
              `  fix:  ensure manifests/tools/${name}.yaml or manifests/skill-packs/${name}.yaml exists`,
          )
          process.exit(1)
        }
      }

      const v = validateManifestFile(yamlSrc, chosenPath)
      if (!v.ok) {
        for (const e of v.errors) console.error(`error: ${e.message} at ${e.path}`)
        console.error(`  fix:  run 'harnessed audit' to inspect manifest issues`)
        process.exit(1)
      }

      const opts: InstallOpts = {
        apply: raw.apply === true,
        dryRun: raw.dryRun === true,
        system: raw.system === true,
        nonInteractive: raw.nonInteractive === true,
        fullDiff: raw.fullDiff === true,
        color: raw.color === false ? false : 'auto',
      }
      const result = await runInstall(v.manifest, opts)

      if ('aborted' in result) {
        console.error(`aborted: ${result.reason}`)
        process.exit(2)
      }
      if (result.ok) {
        const version =
          v.manifest.spec.install.method === 'npm-cli' && 'npm_version' in v.manifest.spec.install
            ? v.manifest.spec.install.npm_version
            : ''
        console.log(`installed ${v.manifest.metadata.name}${version ? `@${version}` : ''}`)
        process.exit(0)
      }
      console.error(formatError(result.error))
      process.exit(1)
    })
}
