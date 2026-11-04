import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { getLocale } from '../../i18n/index.js'
import { runInstall } from '../../installers/index.js'
import { resolveComponentPlan } from '../../installers/lib/componentPlan.js'
import { harnessedHookRegistrations } from '../../installers/lib/harnessedHookTeardown.js'
import { isAlreadyInstalled } from '../../installers/lib/idempotent.js'
import type { InstallOpts, Manifest } from '../../installers/lib/types.js'
import { validateManifestFile } from '../../manifest/validate.js'
import { getAssetsRoot } from '../../platform/assetsRoot.js'
import type { HostInstallContext } from '../../platform/hostInstallContext.js'
import { loadRolePrompts } from '../../workflow/rolePrompts.js'
import { scanWorkflowsNested } from '../../workflow/scan-nested.js'
import { readInstalledPlugins, readInstalledUserSkills } from './capabilityResolver.js'
import { type CommandWriteResult, writeAllCommands } from './generateCommands.js'
import { loadHostPrimitives } from './hostPrimitives.js'
import { removeLegacyClaudeCommands } from './legacyCommandCleanup.js'
import { loadCapabilities, renderAllSkills } from './renderSkillTemplates.js'
import { backupSkillDir, newBackupSessionDir } from './skillBackup.js'
import { recordSkillHashes } from './skillIntegrity.js'
import { readUpdateReminderPreferencesFile } from './updateReminderPreferences.js'
import { createUpdateComponent, type UpdateComponentResult } from './updateResult.js'
import { copyWorkflowArtifacts } from './workflowArtifacts.js'

const OWNED_HOOKS = [
  ['cc-hooks', 'update-reminder'],
  ['optional', 'perturn-inject'],
  ['optional', 'perturn-inject-invalidate'],
  ['cc-hooks', 'dashboard-autospawn'],
] as const

function isExpectedCommandSkip(
  result: CommandWriteResult,
  rolePrompts: Awaited<ReturnType<typeof loadRolePrompts>>,
): boolean {
  return (
    !result.written &&
    (!rolePrompts[result.name] || result.warning?.includes('is user-authored') === true)
  )
}

async function refreshWorkflows(context: HostInstallContext, assets: string): Promise<void> {
  const workflowsDir = join(assets, 'workflows')
  const { workflows } = await scanWorkflowsNested(workflowsDir, await readdir(workflowsDir))
  if (!workflows.length) throw new Error('No bundled workflows to refresh')
  const skillsBase =
    context.hostId === 'codex' ? context.platform.skillsDir : join(context.nativeHome, 'skills')
  const ledgerPath = join(context.platform.stateRoot, 'skill-hashes.json')
  const backups = newBackupSessionDir('update', join(context.platform.stateRoot, 'backups'))
  for (const workflow of workflows) {
    const backup = await backupSkillDir(workflow.name, skillsBase, backups)
    if (!backup.ok && backup.code !== 'ENOENT') throw new Error(backup.message)
    await copyWorkflowArtifacts(
      join(workflowsDir, workflow.relPath),
      join(skillsBase, workflow.name),
    )
  }
  const names = workflows.map((workflow) => workflow.name)
  const rendered = await renderAllSkills(
    names,
    skillsBase,
    workflowsDir,
    undefined,
    getLocale(),
    context.hostId,
    context,
  )
  const failed = rendered.results.find((result) => result.error)
  if (failed) throw new Error(failed.error)
  await mkdir(context.platform.stateRoot, { recursive: true })
  await recordSkillHashes(names, skillsBase, ledgerPath)
  if (context.hostId === 'claude') {
    const cleanup = await removeLegacyClaudeCommands(join(context.nativeHome, 'commands'))
    if (cleanup.warnings.length) throw new Error(cleanup.warnings.join('; '))
    return
  }
  const commandsBase = join(context.nativeHome, 'prompts')
  await mkdir(commandsBase, { recursive: true })
  const rolePrompts = await loadRolePrompts(workflowsDir)
  const commands = await writeAllCommands(
    names,
    commandsBase,
    rolePrompts,
    await loadCapabilities(workflowsDir),
    readInstalledPlugins(undefined, context),
    readInstalledUserSkills(undefined, context),
    (path, content) => writeFile(path, content, 'utf8'),
    undefined,
    undefined,
    {
      host: context.hostId,
      table: await loadHostPrimitives({ workflowsDir, locale: 'en' }),
      descriptionTable: await loadHostPrimitives({ workflowsDir, locale: getLocale() }),
    },
  )
  const failedCommand = commands.results.find(
    (result) => !result.written && !isExpectedCommandSkip(result, rolePrompts),
  )
  if (failedCommand)
    throw new Error(failedCommand.warning ?? `Command refresh failed: ${failedCommand.path}`)
}

async function reminderEnabled(context: HostInstallContext): Promise<boolean> {
  // The root comes from the CAPTURED install context, not from the ambient
  // environment: the refresh acts on the install it was given, and the
  // environment may have drifted since the context was captured (a v16.0-era
  // guarantee, locked by tests/unit/refresh-owned-update.test.ts).
  //
  // This is the one place that deliberately does NOT use
  // `canonicalStateRoot()` (R15): the auto-update CONSENT path (command →
  // hook → worker) is canonical, and this reader only decides whether the
  // reminder hook is re-registered — a decision about the captured install.
  const defaultRoot = join(context.platform.homeDir, 'harnessed')
  const stateRoot = resolve(
    context.platform.stateRoot !== defaultRoot
      ? context.platform.stateRoot
      : join(context.nativeHome, 'harnessed'),
  )
  // Same canonical reader as the compiled reminder entrypoint — only the
  // stateRoot derivation above is specific to this call site.
  const { preferences, missing, document } = readUpdateReminderPreferencesFile(
    join(stateRoot, 'update-reminder-preferences.json'),
  )
  if (preferences.unreadable) return false
  // No preferences file at all → the reminder is opt-out, so it stays on.
  if (missing) return true
  return document?.schemaVersion === 1 && preferences.enabled
}

/** Does the host settings.json still carry a FIRST-PARTY registration of this
 *  hook — in any form, including the stale `assets/<oldVersion>/…` shape a
 *  self-update leaves behind (issue #36)?
 *
 *  The stale shape makes the idempotency probe fail (the recorded command no
 *  longer matches the current one), so the refresh used to SKIP the hook and
 *  the broken registration survived every update. The EVENT discriminates two
 *  hooks that share a script (per-turn injection vs its cache invalidation). */
async function hasFirstPartyRegistration(
  context: HostInstallContext,
  hookEvent: string,
  hookCommand: string,
): Promise<boolean> {
  let raw: string
  try {
    raw = await readFile(join(context.nativeHome, 'settings.json'), 'utf8')
  } catch {
    return false // no settings.json (or unreadable) → nothing registered
  }
  let parsed: { hooks?: Record<string, unknown> }
  try {
    parsed = JSON.parse(raw) as typeof parsed
  } catch {
    return false
  }
  const hooks = parsed.hooks
  if (!hooks || typeof hooks !== 'object') return false
  try {
    return harnessedHookRegistrations(hooks, hookCommand).some(
      (registration) => registration.event === hookEvent,
    )
  } catch {
    return false
  }
}

export async function refreshOwnedUpdate(
  context: HostInstallContext,
): Promise<UpdateComponentResult[]> {
  const assets = getAssetsRoot()
  const results: UpdateComponentResult[] = []
  try {
    await refreshWorkflows(context, assets)
    results.push(
      createUpdateComponent({
        id: 'harnessed-workflows',
        status: 'updated',
        verified: true,
        restartRequired: true,
      }),
    )
  } catch (error) {
    console.error(
      `[harnessed] workflow refresh failed: ${error instanceof Error ? error.message : String(error)}`,
    )
    return [
      createUpdateComponent({
        id: 'harnessed-workflows',
        status: 'failed',
        reasonCode: 'owned-refresh-failed',
      }),
    ]
  }
  const opts: InstallOpts = {
    apply: true,
    dryRun: false,
    system: false,
    nonInteractive: true,
    fullDiff: false,
    color: false,
    quiet: true,
    updateInstalled: true,
    codexHookTrust: 'deny',
  }
  for (const [directory, name] of OWNED_HOOKS) {
    if (name === 'update-reminder' && !(await reminderEnabled(context))) continue
    const path = join(assets, 'manifests', directory, `${name}.yaml`)
    try {
      let source: string
      try {
        source = await readFile(path, 'utf8')
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') continue
        throw error
      }
      const validated = validateManifestFile(source, path)
      if (
        !validated.ok ||
        validated.manifest.metadata.name !== name ||
        validated.manifest.metadata.upstream?.repository !==
          'https://github.com/easyinplay/harnessed.git' ||
        validated.manifest.spec.install.method !== 'cc-hook-add'
      )
        throw new Error(`Invalid first-party hook: ${name}`)
      const plan = resolveComponentPlan(validated.manifest, context, 'install')
      if (name !== 'update-reminder') {
        // issue #36 — skip ONLY when there is no first-party registration of
        // this hook at all (the user never opted in). A STALE registration
        // (still ours, wrong version) must be re-installed so the migration
        // replaces it instead of leaving it broken.
        const installed = await isAlreadyInstalled(
          {
            manifest: structuredClone(plan.manifest) as Manifest,
            opts,
            level: 'L3',
            cwd: context.neutralSpawnCwd ?? context.userHome,
            hostContext: context,
          },
          { honorUpdateFlag: false },
        )
        if (!installed) {
          const registered = await hasFirstPartyRegistration(
            context,
            validated.manifest.spec.install.hook_event,
            validated.manifest.spec.install.hook_command,
          )
          if (!registered) continue
        }
      }
      const result = await runInstall(validated.manifest, opts, context)
      results.push(
        createUpdateComponent({
          id: name,
          status:
            'aborted' in result || !result.ok
              ? 'failed'
              : result.trustPending
                ? 'retained'
                : 'updated',
          verified: 'ok' in result && result.ok && !result.trustPending,
          reasonCode:
            'aborted' in result || !result.ok
              ? 'owned-hook-refresh-failed'
              : result.trustPending
                ? 'hook-trust-pending'
                : null,
          restartRequired: true,
        }),
      )
    } catch (error) {
      console.error(
        `[harnessed] hook refresh failed: ${error instanceof Error ? error.message : String(error)}`,
      )
      results.push(
        createUpdateComponent({
          id: name,
          status: 'failed',
          reasonCode: 'owned-hook-refresh-failed',
        }),
      )
    }
  }
  return results
}
