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

import { cp, mkdir, readdir, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'
import type { Command } from 'commander'
import { t } from '../i18n/index.js'
import { readInstalledPlugins, readInstalledUserSkills } from './lib/capabilityResolver.js'
import { enableAgentTeamsInSettings } from './lib/enableAgentTeamsInSettings.js'
import { enableUserLangInSettings } from './lib/enableUserLangInSettings.js'
import { loadRolePrompts, writeAllCommands } from './lib/generateCommands.js'
import { getPackageRoot } from './lib/packagePath.js'
import { loadCapabilities, renderAllSkills } from './lib/renderSkillTemplates.js'
import {
  runStepBInstall,
  scanWorkflowsWithSkill,
  warnIfAgentTeamsMissing,
} from './lib/setup-helpers.js'

interface RawOpts {
  dryRun?: boolean
  userLang?: string
  nonInteractive?: boolean
  autoInstall?: boolean // v3.9.0 P4 — commander `--no-auto-install` flag flips this to false
  updateInstalled?: boolean // v3.9.6 — force re-install for already-installed plugins (excludes MCP)
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
    .option(
      '--user-lang <code>',
      'override detected OS locale for env.HARNESSED_USER_LANG (en | zh-Hans / zh-CN / zh-TW)',
    )
    // v3.9.0 P4 — auto-install third-party plugins via Clack confirm prompt
    // (default opt-in). `--non-interactive` skips prompts for CI/scripts;
    // `--no-auto-install` keeps v3.8.x advisory-only behavior.
    .option('--non-interactive', 'skip all confirm prompts (CI / scripted setup)')
    .option('--no-auto-install', 'do not prompt to auto-install missing plugins (advisory only)')
    // v3.9.6 — force re-install for already-installed third-party plugins
    // (skip idempotent_check probe). MCP installers ignore this flag —
    // existing mcpServers config is never overwritten unconditionally.
    .option(
      '--update-installed',
      'force re-install already-installed plugins (excludes MCP servers); default: skip if installed',
    )
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
        console.error(t('setup.workflows_not_found', { path: workflowsDir }))
        process.exit(1)
      }

      const { workflows: toInstall } = await scanWorkflowsWithSkill(workflowsDir, entries)

      if (toInstall.length === 0) {
        console.log(t('setup.nothing_to_install'))
        process.exit(2)
      }

      if (dryRun) {
        console.log(t('setup.dry_run.header', { count: toInstall.length, path: skillsBase }))
        for (const wf of toInstall) {
          const masterTag = wf.isMaster ? ' (master)' : ''
          console.log(`  ${wf.name}  →  ${join(skillsBase, wf.name)}${masterTag}`)
        }
        console.log(t('setup.dry_run.run_hint'))
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
          console.error(t('setup.copy_failed', { name: wf.name, message: (e as Error).message }))
          process.exit(1)
        }
      }

      console.log(t('setup.step_a_complete', { count: skillsInstalled, path: skillsBase }))

      // ── Step A.5: Render `{{ capabilities.<name>.cmd }}` placeholders ───────
      // v3.4.1 hotfix — sub-workflow SKILL.md files contain Jinja-style template
      // refs that were never substituted at install time; end users saw literal
      // `{{ capabilities.gstack-review.cmd }}` strings in installed skills so
      // `/verify-paranoid` (and 20+ siblings) never invoked the real plugin cmd.
      // Resolver reads ~/.claude/plugins/installed_plugins.json + capabilities.yaml,
      // renders to namespaced form (`/gstack:review`) when plugin installed, OR
      // leaves bare cmd + emits warning when plugin missing. Non-blocking — any
      // unexpected error reduces to per-skill warn-and-continue (sister fallback
      // 铁律 1).
      const skillNames = toInstall.map((wf) => wf.name)
      const rendered = await renderAllSkills(skillNames, skillsBase, workflowsDir)
      const renderedCount = rendered.results.filter((r) => r.rendered).length
      console.log(
        t('setup.step_a_render.complete', {
          count: renderedCount,
          total: skillsInstalled,
        }),
      )
      if (rendered.aggregatedWarnings.length > 0) {
        console.warn(t('setup.step_a_render.warnings_header'))
        for (const w of rendered.aggregatedWarnings) {
          console.warn(`    - ${w}`)
        }
      }

      // ── Step A.6: Generate ~/.claude/commands/<x>.md (v3.4.3) ───────────────
      // v3.4.3 — SKILL.md alone does NOT register a slash command. Claude Code
      // platform-level slash commands require `~/.claude/commands/<x>.md`
      // (filename = slash name; YAML frontmatter + body = prompt). This step
      // writes one per installed sub-workflow, with a dual-path body: preferred
      // (upstream slash cmd) + fallback (Task-spawn self-contained role prompt
      // adapted from gstack expert prompts). Skip + warn if user already has
      // a same-named commands/ file (additive only — never overwrite).
      const commandsBase = resolve(homedir(), '.claude', 'commands')
      try {
        await mkdir(commandsBase, { recursive: true })
      } catch (e) {
        console.warn(
          `  [A.6] could not create ${commandsBase} — skipping commands/ generation (${(e as Error).message})`,
        )
      }
      let capabilitiesMap = {}
      try {
        capabilitiesMap = await loadCapabilities(workflowsDir)
      } catch (e) {
        console.warn(
          `  [A.6] capabilities.yaml unreadable — skipping commands/ generation (${(e as Error).message})`,
        )
      }
      const rolePrompts = await loadRolePrompts(workflowsDir)
      const installedPlugins = readInstalledPlugins()
      const installedUserSkills = readInstalledUserSkills()
      const cmdResult = await writeAllCommands(
        skillNames,
        commandsBase,
        rolePrompts,
        capabilitiesMap,
        installedPlugins,
        installedUserSkills,
        async (p, c) => writeFile(p, c, 'utf8'),
      )
      const writtenCount = cmdResult.results.filter((r) => r.written).length
      const skippedCount = cmdResult.results.filter((r) => !r.written && r.warning).length
      console.log(
        `  [A.6] generated ${writtenCount} commands/<x>.md file(s) (${skippedCount} skipped — existing user file or schema warn)`,
      )
      for (const r of cmdResult.results) {
        if (r.written) {
          console.log(`  [A.6] wrote /${r.name}  →  ${r.path}`)
        } else if (r.warning) {
          console.warn(`  [A.6] skipped /${r.name}: ${r.warning}`)
        }
      }

      // ── Step C: Agent Teams auto-enable in ~/.claude/settings.json ──────────
      // v3.3.1 hotfix — Q-AUDIT-5b LOCKED root-level env.* schema. Pattern A
      // 3-teammate + /verify-multispec 4-specialist + masterOrchestrator
      // delegates_to recursive workflow 的前提。Non-destructive merge with
      // backup; warn + skip on any error (sister fallback 铁律 1).
      const cResult = await enableAgentTeamsInSettings()
      if (cResult.status === 'created') {
        console.log(t('setup.step_c.created', { path: cResult.path }))
      } else if (cResult.status === 'already-enabled') {
        console.log(t('setup.step_c.already_enabled', { path: cResult.path }))
      } else if (cResult.status === 'enabled') {
        console.log(
          t('setup.step_c.enabled_backup', {
            path: cResult.path,
            backupPath: cResult.backupPath,
          }),
        )
      } else {
        console.warn(t('setup.step_c.skipped', { message: cResult.message }))
      }

      // ── Step D: User language preference write (v3.4.0) ─────────────────────
      // Detect OS locale → write env.HARNESSED_USER_LANG ('en' | 'zh-Hans').
      // Honors `--user-lang` override + existing setting respect (idempotent).
      // Sister Step C non-destructive merge + warn-skip pattern.
      const dResult = await enableUserLangInSettings(raw.userLang)
      if (dResult.status === 'created') {
        console.log(t('setup.step_d.created', { path: dResult.path, lang: dResult.detected }))
      } else if (dResult.status === 'already-set') {
        console.log(t('setup.step_d.already_set', { path: dResult.path, lang: dResult.existing }))
      } else if (dResult.status === 'enabled') {
        console.log(
          t('setup.step_d.enabled_backup', {
            path: dResult.path,
            lang: dResult.detected,
            backupPath: dResult.backupPath,
          }),
        )
      } else {
        console.warn(t('setup.step_d.skipped', { message: dResult.message }))
      }

      // ── Step B: install-base auto-glob chain (parallel) ─────────────────────
      // v3.9.7 — flow corrected per user UX feedback. First pass: default
      // (updateInstalled=false) — idempotent_check probes short-circuit
      // already-installed entries. AFTER summary prints, prompt user with
      // the concrete already-installed list so they can decide informed.
      // CLI flag `--update-installed` skips the prompt and forces from the
      // first pass (CI / scripted use).
      const manifestPaths = await listBaseManifests(pkgRoot)
      const forceFirstPass = raw.updateInstalled === true
      const b = await runStepBInstall(manifestPaths, { updateInstalled: forceFirstPass })
      const stepBMs = (b.elapsedMs / 1000).toFixed(1)
      console.log(
        t('setup.step_b_complete', {
          installed: b.installed.length,
          already: b.alreadyInstalled.length,
          skipped: b.skipped.length,
          failed: b.failed.length,
          seconds: stepBMs,
        }),
      )
      for (const n of b.installed) console.log(`  [B] installed          ${n}`)
      for (const n of b.alreadyInstalled)
        console.log(
          `  [B] already-installed  ${n} — run \`/mcp\` in Claude Code to verify connection`,
        )
      for (const n of b.skipped) console.log(`  [B] skipped            ${n}`)
      for (const n of b.failed) console.error(`  [B] failed             ${n}`)

      // v3.9.7 — Post-summary force-update prompt. Shows concrete list of
      // already-installed third-party plugins so user can make informed
      // decision. MCP installers (mcpStdioAdd / mcpHttpAdd) ignore the
      // updateInstalled flag — existing mcpServers config is never
      // overwritten by force-update.
      if (
        !forceFirstPass &&
        !dryRun &&
        raw.nonInteractive !== true &&
        b.alreadyInstalled.length > 0
      ) {
        const isTty = process.stdin.isTTY === true && process.stdout.isTTY === true
        if (isTty) {
          const { confirm, isCancel } = await import('@clack/prompts')
          const ans = await confirm({
            message: `Update ${b.alreadyInstalled.length} already-installed plugin(s) listed above? (MCP servers excluded — they ignore force-update)`,
            initialValue: false,
          })
          if (!isCancel(ans) && ans === true) {
            // Second pass: force-update path. runInstall sees
            // opts.updateInstalled=true → bypasses idempotent_check probe →
            // runs install command. MCP installers ignore the flag per design.
            const b2 = await runStepBInstall(manifestPaths, { updateInstalled: true })
            const stepB2Ms = (b2.elapsedMs / 1000).toFixed(1)
            console.log(
              `\nForce-update pass complete: ${b2.installed.length} installed / ${b2.alreadyInstalled.length} still-already-installed (MCP) / ${b2.skipped.length} skipped / ${b2.failed.length} failed [parallel ${stepB2Ms}s]`,
            )
            for (const n of b2.installed) console.log(`  [B*] installed          ${n}`)
            for (const n of b2.alreadyInstalled)
              console.log(`  [B*] already-installed  ${n} (MCP / no force-update)`)
            for (const n of b2.skipped) console.log(`  [B*] skipped            ${n}`)
            for (const n of b2.failed) console.error(`  [B*] failed             ${n}`)
          }
        }
      }

      console.log(
        t('setup.complete', {
          skills: skillsInstalled,
          manifests: b.installed.length + b.alreadyInstalled.length,
        }),
      )
      if (b.alreadyInstalled.length > 0 || b.installed.length > 0) {
        console.log(t('setup.mcp_hint'))
      }

      // ── Phase v2.0-2.3 W1.1: Pure bundled distribution highlight (D-01) ───
      // workflows live in <packageRoot>/workflows/ — share-only readonly,
      // NOT user-dir override (~/.harnessed/ NOT used per D-01 LOCKED).
      console.log(t('setup.bundled_summary'))
      console.log(t('setup.bundled_location'))
      // v3.8.0 P3 — advisory doctor hint (NO auto-invoke to avoid CLI subprocess
      // complexity + scope creep; user opts in by running `harnessed doctor`).
      console.log(t('setup.doctor_hint'))

      // v3.9.0 P4 — auto-install missing third-party plugins (default opt-in,
      // confirm prompt per plugin). Skips on --non-interactive, --no-auto-install,
      // dry-run path (no side effects per Phase 1 dry-run contract), or non-TTY
      // stdin (CI / piped invocation — can't prompt anyway, fall back to advisory).
      if (!dryRun) {
        const isTty = process.stdin.isTTY === true && process.stdout.isTTY === true
        const { runAutoInstall } = await import('./lib/auto-install.js')
        await runAutoInstall({
          nonInteractive: raw.nonInteractive === true || !isTty,
          autoInstall: raw.autoInstall !== false, // commander default = true; --no-auto-install flips
        })
      }
      process.exit(0)
    })
}
