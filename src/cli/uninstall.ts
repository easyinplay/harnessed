// Phase 5.2 W1 T1.1 — cli subcommand `uninstall` per R10.3 + ADR 0004.
// Phase v3.9.x — extended with unified uninstall (no-arg: remove harnessed own files).
//
// IMPL NOTE (v3.0.1 UX flip — apply-immediate default + --dry-run opt-in):
// `harnessed uninstall [name]` executes immediately by default (sister install.ts
// pattern verbatim). Interactive p.confirm() still protects destructive ops.
// `--dry-run` flag is opt-in preview.
//
// Two modes:
//   harnessed uninstall <name>  — per-manifest uninstall (existing, Phase 5.2)
//   harnessed uninstall          — unified uninstall: remove harnessed's own files
//                                  (workflows, commands, settings env vars, state dir),
//                                  upstream components NOT affected
//
// Exit code mapping (ADR 0004 contract 6):
//   0 → uninstall succeeded
//   1 → uninstall failed
//   2 → user-aborted / dry-run preview

import { readdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join, resolve as pathResolve, sep } from 'node:path'
import * as p from '@clack/prompts'
import type { Command } from 'commander'
import { t } from '../i18n/index.js'
import { getHarnessedRoot } from '../installers/lib/harnessedRoot.js'
import { detectPlatform } from '../installers/lib/platform.js'
import { checkPathSafe } from '../manifest/lib/path-guard.js'
import { validateManifestFile } from '../manifest/validate.js'
import { runUninstall } from '../uninstallers/index.js'
import { shouldOverwriteFile } from './lib/generateCommands.js'
import { getPackageRoot } from './lib/packagePath.js'
import { scanWorkflowsNested } from './lib/scan-nested.js'

interface RawOpts {
  dryRun?: boolean
}

// ── Unified uninstall helpers ──────────────────────────────────────

async function discoverCommandFiles(commandsDir: string): Promise<string[]> {
  const owned: string[] = []
  let entries: string[]
  try {
    entries = await readdir(commandsDir)
  } catch {
    return owned
  }
  for (const entry of entries) {
    if (!entry.endsWith('.md')) continue
    const p = join(commandsDir, entry)
    try {
      const content = await readFile(p, 'utf8')
      if (shouldOverwriteFile(content)) owned.push(p)
    } catch {
      // unreadable → skip
    }
  }
  return owned
}

async function checkSettingsEnv(settingsPath: string): Promise<{
  hasAgentTeams: boolean
  hasUserLang: boolean
}> {
  try {
    const raw = await readFile(settingsPath, 'utf8')
    const data = JSON.parse(raw) as Record<string, unknown>
    const env = (data.env ?? {}) as Record<string, unknown>
    return {
      hasAgentTeams: 'CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS' in env,
      hasUserLang: 'HARNESSED_USER_LANG' in env,
    }
  } catch {
    return { hasAgentTeams: false, hasUserLang: false }
  }
}

async function removeSettingsEnv(settingsPath: string): Promise<boolean> {
  const raw = await readFile(settingsPath, 'utf8')
  const data = JSON.parse(raw) as Record<string, unknown>
  const env = (data.env ?? {}) as Record<string, unknown>
  let changed = false
  if ('CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS' in env) {
    delete env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS
    changed = true
  }
  if ('HARNESSED_USER_LANG' in env) {
    delete env.HARNESSED_USER_LANG
    changed = true
  }
  if (!changed) return false
  if (Object.keys(env).length === 0) delete data.env
  else data.env = env
  await writeFile(settingsPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
  return true
}

async function runUnifiedUninstall(home: string, dryRun: boolean): Promise<void> {
  // v4.14.0 — dirs via the active PlatformDescriptor (claude byte-identical:
  // commandsDir/skillsDir/settingsPath resolve to the pre-4.14.0 ~/.claude paths).
  const platform = detectPlatform(home)
  const commandsDir = platform.commandsDir
  const skillsDir = platform.skillsDir
  const settingsPath = platform.settingsPath
  const harnessedRoot = getHarnessedRoot()

  // Discover workflow names from bundled workflows/
  const pkgRoot = getPackageRoot()
  let workflowNames: string[] = []
  try {
    const wfEntries = await readdir(pathResolve(pkgRoot, 'workflows'))
    const scanResult = await scanWorkflowsNested(pathResolve(pkgRoot, 'workflows'), wfEntries)
    workflowNames = scanResult.workflows.map((w) => w.name)
  } catch {
    // workflows dir missing → skip skill discovery
  }

  const commandFiles = await discoverCommandFiles(commandsDir)
  const settingsEnv = await checkSettingsEnv(settingsPath)
  const hasSettingsChanges = settingsEnv.hasAgentTeams || settingsEnv.hasUserLang

  // Verify skill dirs exist before counting
  const skillDirs: string[] = []
  for (const name of workflowNames) {
    const dir = join(skillsDir, name)
    try {
      await stat(dir)
      skillDirs.push(dir)
    } catch {
      // not installed → skip
    }
  }

  // ── Summary ─────────────────────────────────────────────────
  const discoverable = commandFiles.length + skillDirs.length + (hasSettingsChanges ? 1 : 0)
  if (discoverable === 0) {
    console.log(t('uninstall.unified.nothing'))
    process.exit(0)
  }

  console.log(t('uninstall.unified.header'))
  if (commandFiles.length > 0)
    console.log(t('uninstall.unified.commands', { count: commandFiles.length }))
  if (skillDirs.length > 0) console.log(t('uninstall.unified.skills', { count: skillDirs.length }))
  if (hasSettingsChanges) console.log(t('uninstall.unified.settings'))
  console.log(t('uninstall.unified.state_dir'))
  console.log(t('uninstall.unified.upstream_note'))

  if (dryRun) {
    console.log(t('uninstall.unified.dry_run_hint'))
    process.exit(2)
  }

  // ── Confirmation ────────────────────────────────────────────
  const answer = await p.confirm({
    message: t('uninstall.unified.confirm'),
    initialValue: false,
  })
  if (p.isCancel(answer) || answer === false) {
    console.error(t('uninstall.cancelled'))
    process.exit(2)
  }

  // ── Removal (ordered: commands → skills → settings → state dir) ──
  console.log(t('uninstall.unified.removing'))
  const failures: string[] = []

  let removedCommands = 0
  for (const path of commandFiles) {
    try {
      await rm(path, { force: true })
      removedCommands++
    } catch (e) {
      failures.push(`${path}: ${(e as Error).message}`)
    }
  }

  let removedSkills = 0
  for (const dir of skillDirs) {
    try {
      await rm(dir, { recursive: true, force: true })
      removedSkills++
    } catch (e) {
      failures.push(`${dir}: ${(e as Error).message}`)
    }
  }

  let removedSettings = false
  if (hasSettingsChanges) {
    try {
      removedSettings = await removeSettingsEnv(settingsPath)
    } catch (e) {
      failures.push(`${settingsPath}: ${(e as Error).message}`)
    }
  }

  // Defense-in-depth: validate state dir is under the platform home dir
  // (~/.claude or ~/.codex) before recursive rm. Claude behavior unchanged.
  const normalizedRoot = pathResolve(harnessedRoot)
  const platformHome = platform.homeDir
  if (!normalizedRoot.startsWith(pathResolve(platformHome) + sep)) {
    console.error(`error: state dir ${harnessedRoot} is not under ${platformHome} — refusing`)
    process.exit(1)
  }
  let removedStateDir = false
  try {
    await rm(harnessedRoot, { recursive: true, force: true })
    removedStateDir = true
  } catch (e) {
    failures.push(`${harnessedRoot}: ${(e as Error).message}`)
  }

  // ── Completion ──────────────────────────────────────────────
  if (removedCommands > 0)
    console.log(t('uninstall.unified.removed_commands', { count: removedCommands }))
  if (removedSkills > 0)
    console.log(t('uninstall.unified.removed_skills', { count: removedSkills }))
  if (removedSettings) console.log(t('uninstall.unified.removed_settings'))
  if (removedStateDir) console.log(t('uninstall.unified.removed_state_dir'))
  if (failures.length > 0) {
    console.error(t('uninstall.unified.partial_failure', { count: failures.length }))
    for (const f of failures) console.error(`  ${f}`)
  }
  console.log(t('uninstall.unified.complete'))
  process.exit(0)
}

// ── CLI registration ──────────────────────────────────────────────

export function registerUninstall(program: Command): void {
  program
    .command('uninstall [name]')
    .description(
      'Uninstall an upstream by name, or remove all harnessed own files when no name given',
    )
    .option('--dry-run', 'preview only — do not delete files')
    .action(async (name: string | undefined, raw: RawOpts) => {
      const dryRun = raw.dryRun === true

      // ── Unified uninstall (no name argument) ──
      if (!name) {
        await runUnifiedUninstall(homedir(), dryRun)
        return
      }

      // ── Per-manifest uninstall (<name> provided) ──
      const { resolveAlias } = await import('../manifest/aliases.js')
      const resolvedName = resolveAlias(name) ?? name
      checkPathSafe(resolvedName)

      const manifestPath = pathResolve(getPackageRoot(), `manifests/tools/${resolvedName}.yaml`)
      const skillPackPath = pathResolve(
        getPackageRoot(),
        `manifests/skill-packs/${resolvedName}.yaml`,
      )
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
            `${t('install.manifest_not_found', { name: resolvedName })}\n${t('install.manifest_not_found.fix', { name: resolvedName })}`,
          )
          process.exit(1)
        }
      }

      const v = validateManifestFile(yamlSrc, chosenPath)
      if (!v.ok) {
        for (const e of v.errors) console.error(`error: ${e.message} at ${e.path}`)
        process.exit(1)
      }

      if (dryRun) {
        console.log(
          t('uninstall.dry_run.preview', {
            name: resolvedName,
            method: v.manifest.spec.install.method,
          }),
        )
        console.log(t('uninstall.dry_run.run_hint'))
        process.exit(2)
      }

      const answer = await p.confirm({
        message: t('uninstall.confirm.prompt', { name: resolvedName }),
        initialValue: false,
      })
      if (p.isCancel(answer) || answer === false) {
        console.error(t('uninstall.cancelled'))
        process.exit(2)
      }

      const result = await runUninstall(v.manifest, { apply: true, dryRun: false, yes: true })

      if ('aborted' in result) {
        console.error(t('install.aborted', { reason: result.reason }))
        process.exit(2)
      }
      if (result.ok) {
        console.log(t('uninstall.completed', { name: resolvedName }))
        process.exit(0)
      }
      console.error(`error: ${result.error}`)
      process.exit(1)
    })
}
