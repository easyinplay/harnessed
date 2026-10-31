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

import { readdir, readFile, rm } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import * as p from '@clack/prompts'
import type { Command } from 'commander'
import { t } from '../i18n/index.js'
import { resolveComponentPlan } from '../installers/lib/componentPlan.js'
import {
  countHarnessedHooks,
  stripHarnessedHooks,
} from '../installers/lib/harnessedHookTeardown.js'
import {
  assertOwnedPathUnchanged,
  type OwnedPathSnapshot,
  prepareOwnedPathRemoval,
  removeOwnedDirectoryViaQuarantine,
  removeOwnedFileViaQuarantine,
} from '../lib/quarantineDelete.js'
import { checkPathSafe } from '../manifest/lib/path-guard.js'
import { validateManifestFile } from '../manifest/validate.js'
import { getAssetsRoot, isCompiledRuntime } from '../platform/assetsRoot.js'
import {
  captureHostInstallContext,
  type HostInstallContext,
} from '../platform/hostInstallContext.js'
import { HOST_IDS } from '../platform/platform.js'
import { isBunRuntime } from '../platform/runtime.js'
import { runUninstall } from '../uninstallers/index.js'
import { shouldOverwriteFile } from './lib/generateCommands.js'
import {
  loadSettingsOwnershipReceipt,
  restoreOwnedSettingsEnv,
  type SettingsOwnershipReceipt,
  settingsOwnershipReceiptPath,
} from './lib/settingsOwnershipReceipt.js'
import { withSettingsTransactionLock } from './lib/settingsTransactionLock.js'
import { atomicWrite } from './lib/settingsWriter.js'
import { readHashLedger, sha256Of } from './lib/skillIntegrity.js'

interface RawOpts {
  dryRun?: boolean
  platform?: string
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

/** Harnessed-owned codex agent roles, or `[]` when anything about that surface
 *  is unavailable (uninstall must never fail over an advisory inventory). */
async function discoverCodexAgentRoles(context: HostInstallContext): Promise<string[]> {
  try {
    const m = await import('../installers/lib/codexAgentRoles.js')
    return await m.discoverCodexAgentRoleFiles(m.codexAgentsDir(context.nativeHome))
  } catch {
    return []
  }
}

async function discoverOwnedSkillDirs(
  skillsDir: string,
  stateRoot: string,
): Promise<{ dirs: string[]; failures: string[]; expectedHashes: Map<string, string> }> {
  const ledger = await readHashLedger(join(stateRoot, 'skill-hashes.json'))
  if (ledger === null) return { dirs: [], failures: [], expectedHashes: new Map() }
  const dirs: string[] = []
  const failures: string[] = []
  const expectedHashes = new Map<string, string>()
  for (const [name, record] of Object.entries(ledger)) {
    if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(name)) {
      failures.push(`invalid owned skill name in skill-hashes.json: ${name}`)
      continue
    }
    const dir = join(skillsDir, name)
    try {
      const body = await readFile(join(dir, 'SKILL.md'), 'utf8')
      if (sha256Of(body) !== record.sha256) {
        failures.push(`${dir}: installed skill differs from the ownership ledger; repair first`)
        continue
      }
      dirs.push(dir)
      expectedHashes.set(dir, record.sha256)
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        failures.push(`${dir}: ${(error as Error).message}`)
      }
    }
  }
  return { dirs, failures, expectedHashes }
}

type SettingsInspection =
  | { status: 'absent'; hasOwnedEnv: false; staleHooks: 0 }
  | { status: 'ok'; hasOwnedEnv: boolean; staleHooks: number }
  | { status: 'error'; error: string; hasOwnedEnv: false; staleHooks: 0 }

async function checkSettingsEnv(
  settingsPath: string | null,
  receipt: SettingsOwnershipReceipt | null,
): Promise<SettingsInspection> {
  // v16.0 Phase 63 — no JSON settings file (codex) → no settings footprint to remove.
  if (settingsPath === null) return { status: 'absent', hasOwnedEnv: false, staleHooks: 0 }
  try {
    const raw = await readFile(settingsPath, 'utf8')
    const data = JSON.parse(raw) as Record<string, unknown>
    const hooks = data.hooks
    return {
      status: 'ok',
      hasOwnedEnv: receipt ? restoreOwnedSettingsEnv(data, receipt).changed : false,
      // issue #8 — count orphaned harnessed-owned Stop/UserPromptSubmit hooks.
      staleHooks: hooks && typeof hooks === 'object' ? countHarnessedHooks(hooks as never) : 0,
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return { status: 'absent', hasOwnedEnv: false, staleHooks: 0 }
    }
    return {
      status: 'error',
      error: error instanceof Error ? error.message : String(error),
      hasOwnedEnv: false,
      staleHooks: 0,
    }
  }
}

/** Single read-modify-write of ~/.claude/settings.json: drop harnessed env vars
 *  AND strip first-party harnessed hook registrations (issue #8). Returns what
 *  actually changed so the caller can report each independently. */
async function removeSettingsFootprint(
  settingsPath: string,
  context: HostInstallContext,
): Promise<{ envRemoved: boolean; hooksRemoved: number }> {
  return withSettingsTransactionLock(context, async () => {
    const receiptResult = await loadSettingsOwnershipReceipt(context)
    if (receiptResult.status === 'corrupt' || receiptResult.status === 'error') {
      throw new Error(receiptResult.error)
    }
    const receipt = receiptResult.status === 'ok' ? receiptResult.receipt : null
    const raw = await readFile(settingsPath, 'utf8')
    const data = JSON.parse(raw) as Record<string, unknown>
    if (data === null || typeof data !== 'object' || Array.isArray(data)) {
      throw new Error('settings.json top-level value must be a JSON object')
    }
    const envRemoved = receipt ? restoreOwnedSettingsEnv(data, receipt).changed : false

    let hooksRemoved = 0
    const hooks = data.hooks
    if (hooks && typeof hooks === 'object' && !Array.isArray(hooks)) {
      hooksRemoved = stripHarnessedHooks(hooks as never).removed
      if (Object.keys(hooks as object).length === 0) delete data.hooks
    }

    if (envRemoved || hooksRemoved > 0) {
      const writeError = await atomicWrite(settingsPath, `${JSON.stringify(data, null, 2)}\n`)
      if (writeError) throw new Error(writeError)
    }
    if (receipt !== null) await rm(settingsOwnershipReceiptPath(context), { force: true })
    return { envRemoved, hooksRemoved }
  })
}

/** Unified uninstall only tears down the setup footprint (skills/commands/
 *  settings/state), never the CLI executable itself — and removing that is
 *  channel-specific (npm global vs standalone binary). Print the exact last
 *  step for the channel this process was launched from, plus a dual-install
 *  caution. Closes the "two install methods → uninstall not unified" gap
 *  without a risky self-delete (a running exe is locked on Windows). */
function printCliRemovalHint(): void {
  console.log(t('uninstall.unified.cli_hint_header'))
  if (isCompiledRuntime()) {
    console.log(
      t('uninstall.unified.cli_hint_binary', {
        path: process.execPath,
        dir: dirname(process.execPath),
      }),
    )
  } else if (isBunRuntime()) {
    console.log(
      '  install manager not inferred from Bun runtime; choose the command for the actual install source:',
    )
    console.log(t('uninstall.unified.cli_hint_npm'))
    console.log('  Bun: bun remove --global harnessed')
    console.log('  Other installs may remain; review PATH separately.')
    return
  } else {
    console.log(t('uninstall.unified.cli_hint_npm'))
  }
  console.log(t('uninstall.unified.cli_hint_other'))
}

async function runUnifiedUninstall(context: HostInstallContext, dryRun: boolean): Promise<void> {
  // v4.14.0 — dirs via the active PlatformDescriptor (claude byte-identical:
  // commandsDir/skillsDir/settingsPath resolve to the pre-4.14.0 ~/.claude paths).
  const platform = context.platform
  const commandsDir = platform.commandsDir
  const skillsDir = platform.skillsDir
  const settingsPath = platform.settingsPath
  const harnessedRoot = platform.stateRoot
  const ownershipReceiptResult = await loadSettingsOwnershipReceipt(context)
  if (ownershipReceiptResult.status === 'corrupt' || ownershipReceiptResult.status === 'error') {
    console.error(`settings ownership receipt preflight failed: ${ownershipReceiptResult.error}`)
    process.exit(1)
  }
  const ownershipReceipt =
    ownershipReceiptResult.status === 'ok' ? ownershipReceiptResult.receipt : null
  const inventoryFailures: string[] = []
  let stateEntries: string[] = []
  try {
    stateEntries = (await readdir(harnessedRoot))
      .filter((entry) => entry !== 'backups')
      .map((entry) => join(harnessedRoot, entry))
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      inventoryFailures.push(`${harnessedRoot}: ${(error as Error).message}`)
    }
  }

  const commandFiles = await discoverCommandFiles(commandsDir)
  // v16.0 Phase 66 T1 — codex-only second command-like surface:
  // `<CODEX_HOME>/agents/harnessed-<sub>.toml`. Only files carrying BOTH the
  // `harnessed-` prefix and the generated-by marker are claimed, so the roles
  // other tools put in that directory (33 GSD ones on a typical host) are never
  // listed and never removed. Dynamic import mirrors setup's Step A.7.
  const agentRoleFiles = platform.id === 'codex' ? await discoverCodexAgentRoles(context) : []
  const settingsEnv = await checkSettingsEnv(settingsPath, ownershipReceipt)
  if (settingsEnv.status === 'error' && settingsPath !== null) {
    inventoryFailures.push(`${settingsPath}: ${settingsEnv.error}`)
  }
  const hasSettingsChanges = settingsEnv.hasOwnedEnv
  const staleHooks = settingsEnv.staleHooks
  const settingsRemovalPath =
    settingsPath !== null &&
    settingsEnv.status === 'ok' &&
    (ownershipReceipt !== null || hasSettingsChanges || staleHooks > 0)
      ? settingsPath
      : null

  const ownedSkills = await discoverOwnedSkillDirs(skillsDir, harnessedRoot)
  const skillDirs = ownedSkills.dirs
  inventoryFailures.push(...ownedSkills.failures)

  let agentsMdUpdate: { path: string; body: string } | null = null
  if (platform.id === 'codex') {
    const { agentsMdPath, stripAgentsMdSection } = await import('./lib/agentsMd.js')
    const path = agentsMdPath(context)
    try {
      const before = await readFile(path, 'utf8')
      const after = stripAgentsMdSection(before)
      if (after !== before) agentsMdUpdate = { path, body: after }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        inventoryFailures.push(`${path}: ${(error as Error).message}`)
      }
    }
  }

  const destructivePaths = [
    ...commandFiles.map((target) => ({ root: commandsDir, target })),
    ...agentRoleFiles.map((target) => ({ root: join(context.nativeHome, 'agents'), target })),
    ...skillDirs.map((target) => ({ root: skillsDir, target })),
    ...(agentsMdUpdate ? [{ root: context.nativeHome, target: agentsMdUpdate.path }] : []),
    ...(settingsRemovalPath !== null
      ? [{ root: context.nativeHome, target: settingsRemovalPath }]
      : []),
    ...stateEntries.map((target) => ({ root: harnessedRoot, target })),
  ]
  const canonicalPaths = new Map<string, OwnedPathSnapshot>()
  for (const item of destructivePaths) {
    try {
      canonicalPaths.set(item.target, await prepareOwnedPathRemoval(item.root, item.target))
    } catch (error) {
      inventoryFailures.push(`${item.target}: ${(error as Error).message}`)
    }
  }

  if (inventoryFailures.length > 0) {
    console.error(t('uninstall.unified.partial_failure', { count: inventoryFailures.length }))
    for (const failure of inventoryFailures) console.error(`  ${failure}`)
    process.exit(1)
  }

  // ── Summary ─────────────────────────────────────────────────
  const discoverable =
    commandFiles.length +
    agentRoleFiles.length +
    skillDirs.length +
    (hasSettingsChanges ? 1 : 0) +
    (staleHooks > 0 ? 1 : 0) +
    stateEntries.length
  if (discoverable === 0) {
    console.log(t('uninstall.unified.nothing'))
    printCliRemovalHint()
    process.exit(0)
  }

  console.log(t('uninstall.unified.header'))
  if (commandFiles.length > 0)
    console.log(t('uninstall.unified.commands', { count: commandFiles.length }))
  if (agentRoleFiles.length > 0)
    console.log(t('uninstall.unified.agent_roles', { count: agentRoleFiles.length }))
  if (skillDirs.length > 0) console.log(t('uninstall.unified.skills', { count: skillDirs.length }))
  if (hasSettingsChanges) console.log(t('uninstall.unified.settings'))
  if (staleHooks > 0) console.log(t('uninstall.unified.hooks', { count: staleHooks }))
  console.log(t('uninstall.unified.state_dir'))
  console.log(t('uninstall.unified.upstream_note'))

  if (dryRun) {
    console.log(t('uninstall.unified.dry_run_hint'))
    printCliRemovalHint()
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
  const revalidate = async (path: string): Promise<boolean> => {
    const snapshot = canonicalPaths.get(path)
    if (!snapshot) {
      failures.push(`${path}: missing canonical preflight`)
      return false
    }
    try {
      await assertOwnedPathUnchanged(snapshot)
      return true
    } catch (error) {
      failures.push(`${path}: ${(error as Error).message}`)
      return false
    }
  }

  let removedCommands = 0
  for (const path of commandFiles) {
    try {
      if (!(await revalidate(path))) continue
      const snapshot = canonicalPaths.get(path)
      if (!snapshot) throw new Error('missing canonical preflight')
      await removeOwnedFileViaQuarantine(snapshot)
      removedCommands++
    } catch (e) {
      failures.push(`${path}: ${(e as Error).message}`)
    }
  }

  let removedAgentsMdBlock = false
  if (agentsMdUpdate) {
    try {
      if (await revalidate(agentsMdUpdate.path)) {
        const writeError = await atomicWrite(agentsMdUpdate.path, agentsMdUpdate.body)
        if (writeError) throw new Error(writeError)
        removedAgentsMdBlock = true
      }
    } catch (error) {
      failures.push(`${agentsMdUpdate.path}: ${(error as Error).message}`)
    }
  }

  let removedAgentRoles = 0
  for (const path of agentRoleFiles) {
    try {
      if (!(await revalidate(path))) continue
      const snapshot = canonicalPaths.get(path)
      if (!snapshot) throw new Error('missing canonical preflight')
      await removeOwnedFileViaQuarantine(snapshot)
      removedAgentRoles++
    } catch (e) {
      failures.push(`${path}: ${(e as Error).message}`)
    }
  }

  if (removedAgentsMdBlock) console.log(`  AGENTS.md: harnessed block removed`)

  let removedSkills = 0
  for (const dir of skillDirs) {
    try {
      const snapshot = canonicalPaths.get(dir)
      const expectedHash = ownedSkills.expectedHashes.get(dir)
      if (!snapshot || !expectedHash) throw new Error('missing owned skill preflight')
      await removeOwnedDirectoryViaQuarantine(snapshot, {
        verify: async (quarantinePath) => {
          const body = await readFile(join(quarantinePath, 'SKILL.md'), 'utf8')
          if (sha256Of(body) !== expectedHash) {
            throw new Error('installed skill differs from the ownership ledger; repair first')
          }
        },
      })
      removedSkills++
    } catch (e) {
      failures.push(`${dir}: ${(e as Error).message}`)
    }
  }

  let removedSettings = false
  let removedHooks = 0
  let settingsRemovalSucceeded = false
  let settingsWriteFailed = false
  if (settingsRemovalPath !== null) {
    try {
      if (await revalidate(settingsRemovalPath)) {
        const r = await removeSettingsFootprint(settingsRemovalPath, context)
        removedSettings = r.envRemoved
        removedHooks = r.hooksRemoved
        settingsRemovalSucceeded = true
      } else {
        settingsWriteFailed = true
      }
    } catch (e) {
      settingsWriteFailed = true
      failures.push(`${settingsRemovalPath}: ${(e as Error).message}`)
    }
  }

  const receiptPath = settingsOwnershipReceiptPath(context)
  let removedStateEntries = 0
  for (const path of stateEntries) {
    if (settingsRemovalSucceeded && path === receiptPath) continue
    if (failures.length > 0 || (settingsWriteFailed && path === receiptPath)) continue
    try {
      const snapshot = canonicalPaths.get(path)
      if (!snapshot) throw new Error('missing canonical preflight')
      if (snapshot.isDirectory) await removeOwnedDirectoryViaQuarantine(snapshot)
      else {
        if (!(await revalidate(path))) continue
        await removeOwnedFileViaQuarantine(snapshot)
      }
      removedStateEntries++
    } catch (e) {
      failures.push(`${path}: ${(e as Error).message}`)
    }
  }

  // ── Completion ──────────────────────────────────────────────
  if (removedCommands > 0)
    console.log(t('uninstall.unified.removed_commands', { count: removedCommands }))
  if (removedAgentRoles > 0)
    console.log(t('uninstall.unified.removed_agent_roles', { count: removedAgentRoles }))
  if (removedSkills > 0)
    console.log(t('uninstall.unified.removed_skills', { count: removedSkills }))
  if (removedSettings) console.log(t('uninstall.unified.removed_settings'))
  if (removedHooks > 0) console.log(t('uninstall.unified.removed_hooks', { count: removedHooks }))
  if (removedStateEntries > 0) console.log(t('uninstall.unified.removed_state_dir'))
  if (failures.length > 0) {
    console.error(t('uninstall.unified.partial_failure', { count: failures.length }))
    for (const f of failures) console.error(`  ${f}`)
    printCliRemovalHint()
    process.exit(1)
  }
  console.log(t('uninstall.unified.complete'))
  printCliRemovalHint()
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
    .option('--platform <id>', 'target harness platform (claude | codex)')
    .action(async (name: string | undefined, raw: RawOpts) => {
      const dryRun = raw.dryRun === true

      if (raw.platform !== undefined && !(HOST_IDS as readonly string[]).includes(raw.platform)) {
        console.error(
          `--platform: unknown id '${raw.platform}' (expected one of: ${HOST_IDS.join(' | ')})`,
        )
        process.exit(1)
      }

      let context: HostInstallContext
      try {
        context = captureHostInstallContext(
          raw.platform === undefined ? {} : { hostId: raw.platform },
        )
      } catch (error) {
        console.error(`error: invalid uninstall context: ${(error as Error).message}`)
        process.exit(1)
      }

      // ── Unified uninstall (no name argument) ──
      if (!name) {
        await runUnifiedUninstall(context, dryRun)
        return
      }

      // ── Per-manifest uninstall (<name> provided) ──
      const { resolveAlias } = await import('../manifest/aliases.js')
      const resolvedName = resolveAlias(name) ?? name
      checkPathSafe(resolvedName)

      // Same three tiers as `harnessed install` (tools → skill-packs → optional).
      // v16.0 Phase 64 R7 — optional/ was missing here, so no optional component
      // (perturn-inject, doc-discipline-gate, ecc …) could be uninstalled by name.
      let yamlSrc: string | undefined
      let chosenPath: string | undefined
      for (const dir of ['tools', 'skill-packs', 'optional']) {
        const candidate = join(getAssetsRoot(), `manifests/${dir}/${resolvedName}.yaml`)
        try {
          yamlSrc = await readFile(candidate, 'utf8')
          chosenPath = candidate
          break
        } catch {
          // try next tier
        }
      }
      if (yamlSrc === undefined || chosenPath === undefined) {
        console.error(
          `${t('install.manifest_not_found', { name: resolvedName })}\n${t('install.manifest_not_found.fix', { name: resolvedName })}`,
        )
        process.exit(1)
      }

      const v = validateManifestFile(yamlSrc, chosenPath)
      if (!v.ok) {
        for (const e of v.errors) console.error(`error: ${e.message} at ${e.path}`)
        process.exit(1)
      }

      const plan = resolveComponentPlan(v.manifest, context, 'uninstall')
      if (plan.status === 'unsupported') {
        console.error(
          `error: ${plan.reason}: ${plan.detail ?? `no safe ${context.hostId} uninstall contract for '${plan.componentId}'`}`,
        )
        process.exit(1)
      }

      if (dryRun) {
        console.log(
          t('uninstall.dry_run.preview', {
            name: resolvedName,
            method: plan.manifest.spec.install.method,
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

      const result = await runUninstall(
        v.manifest,
        { apply: true, dryRun: false, yes: true },
        context,
      )

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
