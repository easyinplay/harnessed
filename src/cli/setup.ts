// v1.0.3 T1.1 — Step B serial → parallel Promise.allSettled (~75% speedup; 16 manifests 30-50s → 5-10s).
// v1.0.2 T1.3+T1.4 — cli subcommand `setup` full one-shot onboarding (UX redesign post-v1.0.1).
// Phase v2.0-2.6 W0 close cleanup — Karpathy ≤200L split: helpers moved to ./lib/setup-helpers.ts (CK deferred).
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

import { cp, readdir } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'
import type { Command } from 'commander'
import { enableAgentTeamsInSettings } from './lib/enableAgentTeamsInSettings.js'
import { getPackageRoot } from './lib/packagePath.js'
import {
  renderDeprecationBlock,
  runStepBInstall,
  scanWorkflowsWithSkill,
  warnIfAgentTeamsMissing,
} from './lib/setup-helpers.js'

interface RawOpts {
  dryRun?: boolean
}

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

      // Agent Teams env probe (non-blocking warn) — sister R20.11 acceptance e.
      await warnIfAgentTeamsMissing()

      // ── Step A: workflow SKILL.md scan ──────────────────────────────────────
      let entries: string[]
      try {
        entries = await readdir(workflowsDir)
      } catch {
        console.error(`error: workflows directory not found at ${workflowsDir}`)
        process.exit(1)
      }

      const { workflows: toInstall, deprecated } = await scanWorkflowsWithSkill(
        workflowsDir,
        entries,
      )

      // Emit v2 → v3 deprecation block (Area 4 末段) BEFORE install summary.
      const depBlock = renderDeprecationBlock(deprecated)
      if (depBlock) console.log(depBlock)

      if (toInstall.length === 0) {
        console.log('setup: no workflow directories with SKILL.md found — nothing to install')
        process.exit(2)
      }

      if (dryRun) {
        console.log(
          `[dry-run] setup would install ${toInstall.length} workflow(s) to ${skillsBase}:`,
        )
        for (const wf of toInstall) {
          const masterTag = wf.isMaster ? ' (master)' : ''
          console.log(`  ${wf.name}  →  ${join(skillsBase, wf.name)}${masterTag}`)
        }
        console.log(`  run without --dry-run to execute`)
        process.exit(0)
      }

      let skillsInstalled = 0
      for (const wf of toInstall) {
        const src = join(workflowsDir, wf.relPath)
        const dst = join(skillsBase, wf.name)
        try {
          await cp(src, dst, { recursive: true, force: true })
          const masterTag = wf.isMaster ? ' (master)' : ''
          console.log(`  [A] installed  ${wf.name}  →  ${dst}${masterTag}`)
          skillsInstalled++
        } catch (e) {
          console.error(`  error: failed to copy ${wf.name}: ${(e as Error).message}`)
          process.exit(1)
        }
      }

      console.log(
        `\nStep A complete: ${skillsInstalled} workflow skill(s) installed to ${skillsBase}`,
      )

      // ── Step C: Agent Teams auto-enable in ~/.claude/settings.json ──────────
      // v3.3.1 hotfix — Q-AUDIT-5b LOCKED root-level env.* schema. Pattern A
      // 3-teammate + /verify-multispec 4-specialist + masterOrchestrator
      // delegates_to recursive workflow 的前提。Non-destructive merge with
      // backup; warn + skip on any error (sister fallback 铁律 1).
      const cResult = await enableAgentTeamsInSettings()
      if (cResult.status === 'created') {
        console.log(`  [C] created ${cResult.path} + enabled Agent Teams`)
      } else if (cResult.status === 'already-enabled') {
        console.log(`  [C] Agent Teams already enabled (${cResult.path})`)
      } else if (cResult.status === 'enabled') {
        console.log(
          `  [C] enabled Agent Teams in ${cResult.path} (backup saved → ${cResult.backupPath})`,
        )
      } else {
        console.warn(`  [C] Agent Teams enable skipped: ${cResult.message}`)
      }

      // ── Step B: install-base auto-glob chain (parallel) ─────────────────────
      const manifestPaths = await listBaseManifests(pkgRoot)
      const b = await runStepBInstall(manifestPaths)
      const stepBMs = (b.elapsedMs / 1000).toFixed(1)
      console.log(
        `Step B complete: ${b.installed.length} manifest(s) installed / ${b.alreadyInstalled.length} already-installed / ${b.skipped.length} skipped / ${b.failed.length} failed [parallel ${stepBMs}s]`,
      )
      for (const n of b.installed) console.log(`  [B] installed          ${n}`)
      for (const n of b.alreadyInstalled)
        console.log(
          `  [B] already-installed  ${n} — run \`/mcp\` in Claude Code to verify connection`,
        )
      for (const n of b.skipped) console.log(`  [B] skipped            ${n}`)
      for (const n of b.failed) console.error(`  [B] failed             ${n}`)

      console.log(
        `\nsetup complete: ${skillsInstalled} workflow skill(s) + ${b.installed.length + b.alreadyInstalled.length} base manifest(s) configured`,
      )
      if (b.alreadyInstalled.length > 0 || b.installed.length > 0) {
        console.log(
          `\nMCP servers configured. Run \`/mcp\` in Claude Code to verify each server's connection status. If a server shows disconnected, restart Claude Code or check the MCP command spec.`,
        )
      }

      // ── Phase v2.0-2.3 W1.1: Pure bundled distribution highlight (D-01) ───
      // workflows live in <packageRoot>/workflows/ — share-only readonly,
      // NOT user-dir override (~/.harnessed/ NOT used per D-01 LOCKED).
      console.log(
        '\n✓ harnessed v3.0 三层栈方法论 bundled — 23 workflows (4 master + 18 sub + 1 standalone) + 6 disciplines + 10 judgments + ~83 capabilities ready',
      )
      console.log(
        '  workflows in <packageRoot>/workflows/ (Pure bundled, NOT user-dir override per D-01)',
      )
      process.exit(0)
    })
}
