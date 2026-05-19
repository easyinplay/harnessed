// v1.0.3 T1.1 — Step B serial → parallel Promise.allSettled (~75% speedup; 16 manifests 30-50s → 5-10s).
// v1.0.2 T1.3+T1.4 — cli subcommand `setup` full one-shot onboarding (UX redesign post-v1.0.1).
//
// IMPL NOTE (immediate-install default + --dry-run opt-in, non-expert UX):
// `harnessed setup` executes immediately by default (non-expert UX; v1.0.2 user feedback).
// `--dry-run` flag opt-in for advanced preview. Sister install.ts pattern REVERSED.
// Step A: copies each workflows/<name>/ dir with SKILL.md to ~/.claude/skills/<name>/.
// Step B: chains install-base auto-glob (installs all manifests/{tools,skill-packs}/*.yaml).
// Workflows without SKILL.md are skipped in Step A.
//
// Exit codes:
//   0 → at least 1 workflow installed + base manifests processed
//   1 → fs.cp failed
//   2 → no SKILL.md workflows found (nothing to install)

import { cp, readdir, readFile, stat } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'
import type { Command } from 'commander'
import { runInstall } from '../installers/index.js'
import type { InstallOpts } from '../installers/lib/types.js'
import { validateManifestFile } from '../manifest/validate.js'
import { getPackageRoot } from './lib/packagePath.js'

interface RawOpts {
  dryRun?: boolean
}

// Phase 2.1 deferred installer methods — counted as skipped, not failed (D-11).
const PHASE_21 = new Set([
  'cc-plugin-marketplace',
  'git-clone-with-setup',
  'npx-skill-installer',
  'mcp-http-add',
])

async function listBaseManifests(pkgRoot: string): Promise<string[]> {
  const out: string[] = []
  for (const d of ['manifests/tools', 'manifests/skill-packs']) {
    try {
      const entries = await readdir(resolve(pkgRoot, d))
      for (const f of entries.sort()) if (f.endsWith('.yaml')) out.push(resolve(pkgRoot, d, f))
    } catch {}
  }
  return out
}

export function registerSetup(program: Command): void {
  program
    .command('setup')
    .description(
      'One-shot onboarding: install workflow skills + base manifests to ~/.claude/ (immediate by default — use --dry-run for preview)',
    )
    .option('--dry-run', 'preview only — do not write to disk (opt-in for advanced users)')
    .action(async (raw: RawOpts) => {
      const dryRun = raw.dryRun === true
      const pkgRoot = getPackageRoot()
      const workflowsDir = resolve(pkgRoot, 'workflows')
      const skillsBase = resolve(homedir(), '.claude', 'skills')

      // ── Step A: workflow SKILL.md copy ──────────────────────────────────────
      let entries: string[]
      try {
        entries = await readdir(workflowsDir)
      } catch {
        console.error(`error: workflows directory not found at ${workflowsDir}`)
        process.exit(1)
      }

      const toInstall: string[] = []
      for (const entry of entries.sort()) {
        const src = join(workflowsDir, entry)
        try {
          const s = await stat(src)
          if (!s.isDirectory()) continue
          await stat(join(src, 'SKILL.md')) // throws if missing
          toInstall.push(entry)
        } catch {
          // no SKILL.md — skip
        }
      }

      if (toInstall.length === 0) {
        console.log('setup: no workflow directories with SKILL.md found — nothing to install')
        process.exit(2)
      }

      if (dryRun) {
        console.log(
          `[dry-run] setup would install ${toInstall.length} workflow(s) to ${skillsBase}:`,
        )
        for (const name of toInstall) {
          console.log(`  ${name}  →  ${join(skillsBase, name)}`)
        }
        console.log(`  run without --dry-run to execute`)
        process.exit(0)
      }

      let skillsInstalled = 0
      for (const name of toInstall) {
        const src = join(workflowsDir, name)
        const dst = join(skillsBase, name)
        try {
          await cp(src, dst, { recursive: true, force: true })
          console.log(`  [A] installed  ${name}  →  ${dst}`)
          skillsInstalled++
        } catch (e) {
          console.error(`  error: failed to copy ${name}: ${(e as Error).message}`)
          process.exit(1)
        }
      }

      console.log(
        `\nStep A complete: ${skillsInstalled} workflow skill(s) installed to ${skillsBase}`,
      )

      // ── Step B: install-base auto-glob chain (parallel) ─────────────────────
      const opts: InstallOpts = {
        apply: true,
        dryRun: false,
        system: false,
        nonInteractive: true,
        fullDiff: false,
        color: 'auto',
      }
      const manifestPaths = await listBaseManifests(pkgRoot)
      const stepBStart = Date.now()

      const settled = await Promise.allSettled(
        manifestPaths.map(async (path) => {
          let yamlSrc: string
          try {
            yamlSrc = await readFile(path, 'utf8')
          } catch (e) {
            return {
              status: 'failed' as const,
              name: path,
              reason: `read: ${(e as Error).message}`,
            }
          }
          const v = validateManifestFile(yamlSrc, path)
          if (!v.ok) {
            return {
              status: 'failed' as const,
              name: path,
              reason: `validate: ${v.errors[0]?.message ?? 'unknown'}`,
            }
          }
          const name = v.manifest.metadata.name
          const method = v.manifest.spec.install.method
          if (PHASE_21.has(method)) {
            return { status: 'skipped' as const, name }
          }
          const r = await runInstall(v.manifest, opts)
          if ('aborted' in r) return { status: 'skipped' as const, name }
          if (r.ok) return { status: 'installed' as const, name }
          return { status: 'failed' as const, name, reason: r.error.message }
        }),
      )

      const baseInstalled: string[] = []
      const baseSkipped: string[] = []
      const baseFailed: string[] = []
      for (const s of settled) {
        const v =
          s.status === 'fulfilled'
            ? s.value
            : {
                status: 'failed' as const,
                name: '?',
                reason: String((s as PromiseRejectedResult).reason),
              }
        if (v.status === 'installed') baseInstalled.push(v.name)
        else if (v.status === 'skipped') baseSkipped.push(v.name)
        else
          baseFailed.push(
            `${v.name}: ${(v as { status: 'failed'; name: string; reason: string }).reason}`,
          )
      }

      const stepBMs = ((Date.now() - stepBStart) / 1000).toFixed(1)
      console.log(
        `Step B complete: ${baseInstalled.length} manifest(s) installed / ${baseSkipped.length} skipped / ${baseFailed.length} failed [parallel ${stepBMs}s]`,
      )
      for (const n of baseInstalled) console.log(`  [B] installed  ${n}`)
      for (const n of baseSkipped) console.log(`  [B] skipped    ${n}`)
      for (const n of baseFailed) console.error(`  [B] failed     ${n}`)

      console.log(
        `\nsetup complete: ${skillsInstalled} workflow skill(s) + ${baseInstalled.length} base manifest(s) installed`,
      )
      process.exit(0)
    })
}
