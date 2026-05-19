// v1.0.1 T1.5 — cli subcommand `setup` one-time onboarding per v1.0.1 critical fix.
//
// IMPL NOTE (dry-run default + --apply execute, sister install.ts pattern):
// `harnessed setup` defaults to dry-run preview; explicit `--apply` executes.
// Copies each workflows/<name>/ dir that contains a SKILL.md to ~/.claude/skills/<name>/.
// Workflows without SKILL.md (e.g. plan-feature which has only workflow.yaml) are skipped.
//
// Exit codes:
//   0 → at least 1 workflow installed (or previewed in dry-run)
//   1 → fs.cp failed
//   2 → no SKILL.md workflows found (nothing to install)

import { cp, readdir, stat } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'
import type { Command } from 'commander'
import { getPackageRoot } from './lib/packagePath.js'

interface RawOpts {
  apply?: boolean
}

export function registerSetup(program: Command): void {
  program
    .command('setup')
    .description(
      'One-time onboarding: copy workflows/*/SKILL.md dirs to ~/.claude/skills/ (dry-run by default — pass --apply to execute)',
    )
    .option('--apply', 'execute the copy (default: dry-run preview only)')
    .action(async (raw: RawOpts) => {
      const dryRun = raw.apply !== true
      const workflowsDir = resolve(getPackageRoot(), 'workflows')
      const skillsBase = resolve(homedir(), '.claude', 'skills')

      // Find all workflow dirs that contain a SKILL.md
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
        console.log(`  run with --apply to execute`)
        process.exit(0)
      }

      let installed = 0
      for (const name of toInstall) {
        const src = join(workflowsDir, name)
        const dst = join(skillsBase, name)
        try {
          await cp(src, dst, { recursive: true, force: true })
          console.log(`  installed  ${name}  →  ${dst}`)
          installed++
        } catch (e) {
          console.error(`  error: failed to copy ${name}: ${(e as Error).message}`)
          process.exit(1)
        }
      }

      console.log(`\nsetup complete: ${installed} workflow(s) installed to ${skillsBase}`)
      process.exit(0)
    })
}
