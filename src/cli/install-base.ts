// Phase 1.3 cli subcommand `install-base` per ADR 0007 + R1 D-9 + D-11.
//
// IMPL NOTE (D-9 独立子命令 / D-11 三态 / Rule 1 H1 gate):
// - D-9: 不在 `install <name>` 上加 `--base` flag, 避免 H1 gate 冲突. Auto-glob
//   `manifests/{tools,skill-packs}/*.yaml`.
// - D-11: phase 2.1 placeholder method (cc-plugin-marketplace / git-clone-with-setup
//   / npx-skill-installer / mcp-http-add) 不算 failure 计入 skipped (沿袭
//   INSTALLER-CONTRACT 契约 6 放宽 "deferred ≠ failure").
//   exit: 0 if installed > 0 + failed === 0; 1 if failed > 0; 2 if 全 skipped.
// - v3.3.0: `--apply` backward-compat alias removed; default is apply-immediate.

import { readdir, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import type { Command } from 'commander'
import { runInstall } from '../installers/index.js'
import type { InstallOpts } from '../installers/lib/types.js'
import { validateManifestFile } from '../manifest/validate.js'
import { getPackageRoot } from './lib/packagePath.js'
import { validateNonInteractiveFlags } from './lib/validateFlags.js'

interface RawOpts {
  dryRun?: boolean
  nonInteractive?: boolean
}

const PHASE_21 = new Set([
  'cc-plugin-marketplace',
  'git-clone-with-setup',
  'npx-skill-installer',
  'mcp-http-add',
])

async function listBaseManifests(cwd: string): Promise<string[]> {
  const out: string[] = []
  for (const d of ['manifests/tools', 'manifests/skill-packs']) {
    try {
      const entries = await readdir(resolve(cwd, d))
      for (const f of entries.sort()) if (f.endsWith('.yaml')) out.push(resolve(cwd, d, f))
    } catch {}
  }
  return out
}

export function registerInstallBase(program: Command): void {
  program
    .command('install-base')
    .description(
      'Install the phase 1.3 base profile (immediate by default — use --dry-run for preview)',
    )
    .option('--dry-run', 'preview only — do not write to disk (opt-in for advanced users)')
    .option('--non-interactive', 'skip all prompts (CI / scripts)')
    .action(async (raw: RawOpts) => {
      validateNonInteractiveFlags(raw, 'install-base')
      // v3.0.1 UX flip — apply-immediate default + --dry-run opt-in。
      const dryRun = raw.dryRun === true
      const opts: InstallOpts = {
        apply: !dryRun,
        dryRun,
        system: false,
        nonInteractive: raw.nonInteractive === true,
        fullDiff: false,
        color: 'auto',
      }
      const installed: string[] = []
      const alreadyInstalled: string[] = []
      const skipped: { name: string; reason: string }[] = []
      const failed: { name: string; reason: string }[] = []
      for (const path of await listBaseManifests(getPackageRoot())) {
        let yamlSrc: string
        try {
          yamlSrc = await readFile(path, 'utf8')
        } catch (e) {
          failed.push({ name: path, reason: `read: ${(e as Error).message}` })
          continue
        }
        const v = validateManifestFile(yamlSrc, path)
        if (!v.ok) {
          failed.push({ name: path, reason: `validate: ${v.errors[0]?.message ?? 'unknown'}` })
          continue
        }
        const name = v.manifest.metadata.name
        const method = v.manifest.spec.install.method
        if (PHASE_21.has(method)) {
          skipped.push({ name, reason: `deferred phase 2.1 (${method})` })
          continue
        }
        const r = await runInstall(v.manifest, opts)
        if ('aborted' in r) skipped.push({ name, reason: `aborted: ${r.reason}` })
        else if (r.ok && 'alreadyInstalled' in r && r.alreadyInstalled) alreadyInstalled.push(name)
        else if (r.ok) installed.push(name)
        else failed.push({ name, reason: r.error.message })
      }
      console.log(
        `\n  installed: ${installed.length} / already-installed: ${alreadyInstalled.length} / skipped (deferred phase 2.1): ${skipped.length} / failed: ${failed.length}`,
      )
      for (const i of installed) console.log(`  installed          ${i}`)
      for (const a of alreadyInstalled)
        console.log(`  already-installed  ${a} — run \`/mcp\` in Claude Code to verify connection`)
      for (const s of skipped) console.log(`  skipped            ${s.name} — ${s.reason}`)
      for (const f of failed) console.error(`  failed             ${f.name} — ${f.reason}`)
      if (failed.length > 0) process.exit(1)
      if (installed.length === 0 && alreadyInstalled.length === 0) process.exit(2)
      process.exit(0)
    })
}
