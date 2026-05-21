// Phase 5.2 W1 T1.1 — cli subcommand `uninstall` per R10.3 + ADR 0004.
//
// IMPL NOTE (v3.0.1 UX flip — apply-immediate default + --dry-run opt-in):
// `harnessed uninstall <name>` executes immediately by default (sister install.ts
// pattern verbatim). Interactive p.confirm() 仍 protect destructive op (user
// 必须显式 y/yes 才真正删除)。`--dry-run` flag opt-in 高级用户预览, `--apply`
// 保留 backward-compat no-op alias (旧脚本仍 work)。`--yes` skip interactive
// confirm 仍 require user 显式 opt-in (CI / scripts)。
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
    .description('Uninstall an upstream (immediate by default — use --dry-run for preview)')
    .option('--apply', '(deprecated; kept for backward compat — uninstall is immediate by default)')
    .option('--dry-run', 'preview only — do not delete files (opt-in for advanced users)')
    .option('--yes', 'skip interactive confirm (CI / scripts) — fatal with --dry-run')
    .option('--non-interactive', 'alias for --yes (CI compat)')
    .action(async (name: string, raw: RawOpts) => {
      // v3.0.1 UX flip — apply-immediate default。dryRun=true → preview only。
      // dryRun=false → immediate execute (无论 --apply 是否传入)。`--yes` 仍可
      // skip interactive confirm prompt (用户显式 opt-in CI / scripts)。
      // H1 gate: --yes + --dry-run 互斥 (dry-run 不 mutate, --yes 无意义)。
      const yes = raw.yes === true || raw.nonInteractive === true
      if (yes && raw.dryRun) {
        console.error(
          `error: --yes is incompatible with --dry-run (dry-run does not mutate)\n` +
            `  fix:  harnessed uninstall ${name} --yes  (immediate) ` +
            `OR harnessed uninstall ${name} --dry-run  (preview)`,
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
      // v3.0.1 UX flip — dry-run is opt-in only (raw.dryRun === true)。
      // apply-immediate by default;legacy --apply is no-op alias。
      const dryRun = raw.dryRun === true

      // Dry-run preview path (opt-in --dry-run only).
      if (dryRun) {
        console.log(`[dry-run] would uninstall '${resolvedName}' via method '${method}'`)
        console.log(`  run without --dry-run to execute`)
        process.exit(2)
      }

      // Interactive confirm protects destructive op (skip only with --yes).
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
