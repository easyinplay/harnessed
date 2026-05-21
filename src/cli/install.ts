// Phase 1.2 cli subcommand `install` per ADR 0004 § 1 + § 6 + Pattern C narrow.
//
// IMPL NOTE (v3.0.1 UX flip — apply-immediate default + --dry-run opt-in):
// `harnessed install <name>` executes immediately by default (non-expert UX;
// v3.0.1 user feedback — dry-run 是高级用户概念,默认应 apply)。`--dry-run` flag
// is opt-in 高级用户预览。`--apply` flag 保留 backward-compat no-op alias (旧
// 脚本仍 work, 不破)。Sister setup.ts pattern verbatim (L5-7 IMPL NOTE).
// For automation (CI / scripts), `--non-interactive` 仍 require `--apply` or
// `--dry-run` (H1 gate) 以避免 @clack/prompts deadlock 当 stdin 非 TTY。
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
// Phase 3.4 W0.2 #AD — Path A LOCKED per RESEARCH § 6.2 A1 ASSUMED LOW risk
// (Node 22 + TypeScript 5.6+ supports `with { type: 'json' }` native ES2022
// import attributes per ECMAScript 2025 stage 4). Replaces hardcoded '0.3.0'
// literal at L116 with pkg.version (single source of truth = package.json L3).
import pkg from '../../package.json' with { type: 'json' }
import { runInstall } from '../installers/index.js'
import type { InstallError, InstallOpts } from '../installers/lib/types.js'
import { checkPathSafe } from '../manifest/lib/path-guard.js'
import { validateManifestFile } from '../manifest/validate.js'
import { getPackageRoot } from './lib/packagePath.js'
import { validateNonInteractiveFlags } from './lib/validateFlags.js'

interface RawOpts {
  apply?: boolean
  dryRun?: boolean
  system?: boolean
  nonInteractive?: boolean
  fullDiff?: boolean
  color?: boolean // commander turns --no-color into color: false
  knownGood?: boolean // ← Phase 3.3 W1 T1.9 ADD (D-03 YAML version lock consume)
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
    .description('Install an upstream (immediate by default — use --dry-run for preview)')
    .option('--apply', '(deprecated; kept for backward compat — install is immediate by default)')
    .option('--dry-run', 'preview only — do not write to disk (opt-in for advanced users)')
    .option('--system', 'allow L4 system-wide install (e.g. global npm install)')
    .option('--non-interactive', 'skip all prompts (CI / scripts) — requires --apply or --dry-run')
    .option('--full-diff', 'expand diffs longer than 200 lines')
    .option('--no-color', 'disable ANSI colors (auto-detected when piped)')
    .option(
      '--known-good',
      'use known-good version lock from versions/<harnessed-ver>-known-good.yaml',
    )
    .action(async (name: string, raw: RawOpts) => {
      // H1 pre-action flag gate (see file header IMPL NOTE).
      validateNonInteractiveFlags(raw, 'install <name>')

      // Phase 3.3 W1 T1.8 ADD — D-01 alias redirect (D-02 silent install,
      // NO console output per R7.5 验收 "install 通过" 语义对齐; doctor 7th
      // check is the human-readable deprecation audit surface).
      const { resolveAlias } = await import('../manifest/aliases.js')
      const resolvedName = resolveAlias(name) ?? name
      // R10.4 D-04 hardening site 2 — screen resolved alias redirect (defense-in-depth).
      checkPathSafe(resolvedName)

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
        console.error(`  fix:  run 'harnessed audit' to inspect manifest issues`)
        process.exit(1)
      }

      // v3.0.1 UX flip — apply-immediate default + --dry-run opt-in。
      // `--apply` 旧 flag 保留 no-op alias (向后兼容)。dryRun=true → preview only。
      // dryRun=false → immediate execute (无论 --apply 是否传入,默认 apply 为 true)。
      const dryRun = raw.dryRun === true
      const opts: InstallOpts = {
        apply: !dryRun,
        dryRun,
        system: raw.system === true,
        nonInteractive: raw.nonInteractive === true,
        fullDiff: raw.fullDiff === true,
        color: raw.color === false ? false : 'auto',
      }

      // Phase 3.3 W1 T1.9 ADD — D-03 known-good lock consume (lazy load only
      // when flag set per Karpathy YAGNI Discretion lock).
      if (raw.knownGood) {
        const { getPinnedVersion } = await import('../manifest/knownGood.js')
        const harnessedVer = pkg.version
        const pinned = getPinnedVersion(v.manifest.metadata.name, harnessedVer)
        if (pinned && v.manifest.spec.install.method === 'npm-cli') {
          ;(v.manifest.spec.install as { npm_version?: string }).npm_version = pinned
        }
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
