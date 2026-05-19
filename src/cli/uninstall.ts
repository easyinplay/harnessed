// Phase 5.2 W1 T1.1 — cli subcommand `uninstall` per R10.3 + ADR 0004.
//
// IMPL NOTE (D-05 dry-run default): `harnessed uninstall <name>` defaults to
// dry-run preview; explicit `--apply` required to mutate. Sister install.ts pattern.
//
// IMPL NOTE (D-06 --yes bypass): when --apply AND NOT --yes, interactive
// p.confirm() default No. --yes without --apply → exit 2 H1 gate.
//
// IMPL NOTE (D-07 NO --keep-backup): RawOpts explicitly omits keepBackup.
//
// Exit code mapping (ADR 0004 contract 6):
//   0 → uninstall succeeded (ok: true or ephemeral no-op)
//   1 → uninstall failed (ok: false)
//   2 → user-aborted / flag-missing / dry-run preview

import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import * as p from '@clack/prompts'
import type { Command } from 'commander'
import { checkPathSafe } from '../manifest/lib/path-guard.js'
import { validateManifestFile } from '../manifest/validate.js'
import { runUninstall } from '../uninstallers/index.js'
import { getPackageRoot } from './lib/packagePath.js'

interface RawOpts {
  apply?: boolean
  dryRun?: boolean
  yes?: boolean
  nonInteractive?: boolean
}

export function registerUninstall(program: Command): void {
  program
    .command('uninstall <name>')
    .description('Uninstall an upstream (dry-run by default — pass --apply to execute)')
    .option('--apply', 'execute the uninstall (default: dry-run preview only)')
    .option('--dry-run', 'force dry-run (overrides --apply if both are set)')
    .option('--yes', 'skip interactive confirm — requires --apply (CI / scripts)')
    .option('--non-interactive', 'alias for --yes (CI compat)')
    .action(async (name: string, raw: RawOpts) => {
      // H1 pre-action gate (D-06): --yes without --apply → exit 2.
      const yes = raw.yes === true || raw.nonInteractive === true
      if (yes && !raw.apply) {
        console.error(
          `error: --yes requires --apply to execute\n` +
            `  fix:  harnessed uninstall ${name} --yes --apply`,
        )
        process.exit(2)
      }

      // Alias resolution (sister install.ts pattern).
      const { resolveAlias } = await import('../manifest/aliases.js')
      const resolvedName = resolveAlias(name) ?? name
      // R10.4 D-04 hardening site 2 — screen resolved alias redirect (defense-in-depth).
      checkPathSafe(resolvedName)

      // Manifest lookup (tools/ first, skill-packs/ fallback).
      const manifestPath = resolve(getPackageRoot(), `manifests/tools/${resolvedName}.yaml`)
      const skillPackPath = resolve(getPackageRoot(), `manifests/skill-packs/${resolvedName}.yaml`)
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
            `error: manifest '${resolvedName}' not found\n` +
              `  fix:  ensure manifests/tools/${resolvedName}.yaml or manifests/skill-packs/${resolvedName}.yaml exists`,
          )
          process.exit(1)
        }
      }

      const v = validateManifestFile(yamlSrc, chosenPath)
      if (!v.ok) {
        for (const e of v.errors) console.error(`error: ${e.message} at ${e.path}`)
        process.exit(1)
      }

      const method = v.manifest.spec.install.method
      const dryRun = raw.dryRun === true || !raw.apply

      // D-05 dry-run preview (default when no --apply).
      if (dryRun) {
        console.log(`[dry-run] would uninstall '${resolvedName}' via method '${method}'`)
        console.log(`  run with --apply to execute`)
        process.exit(2)
      }

      // D-06 interactive confirm (--apply without --yes).
      if (!yes) {
        const answer = await p.confirm({
          message: `Uninstall '${resolvedName}'? This cannot be undone.`,
          initialValue: false,
        })
        if (p.isCancel(answer) || answer === false) {
          console.error(`aborted: user cancelled`)
          process.exit(2)
        }
      }

      const opts = { apply: true, dryRun: false, yes }
      const result = await runUninstall(v.manifest, opts)

      if ('aborted' in result) {
        console.error(`aborted: ${result.reason}`)
        process.exit(2)
      }
      if (result.ok) {
        console.log(`uninstalled ${resolvedName}`)
        process.exit(0)
      }
      console.error(`error: ${result.error}`)
      process.exit(1)
    })
}
