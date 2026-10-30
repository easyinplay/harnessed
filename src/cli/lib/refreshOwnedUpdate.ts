import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { getLocale } from '../../i18n/index.js'
import { runInstall } from '../../installers/index.js'
import { resolveComponentPlan } from '../../installers/lib/componentPlan.js'
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
import { createUpdateComponent, type UpdateComponentResult } from './updateResult.js'
import { copyWorkflowArtifacts } from './workflowArtifacts.js'

const OWNED_HOOKS = [
  ['cc-hooks', 'update-reminder'],
  ['optional', 'perturn-inject'],
  ['optional', 'perturn-inject-invalidate'],
  ['optional', 'stop-hook-recover'],
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
  const defaultRoot = join(context.platform.homeDir, 'harnessed')
  const stateRoot = resolve(
    context.platform.stateRoot !== defaultRoot
      ? context.platform.stateRoot
      : join(context.nativeHome, 'harnessed'),
  )
  try {
    const value = JSON.parse(
      await readFile(join(stateRoot, 'update-reminder-preferences.json'), 'utf8'),
    )
    return value.schemaVersion === 1 && value.enabled === true
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === 'ENOENT'
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
      if (
        name !== 'update-reminder' &&
        !(await isAlreadyInstalled(
          {
            manifest: structuredClone(plan.manifest) as Manifest,
            opts,
            level: 'L3',
            cwd: context.neutralSpawnCwd ?? context.userHome,
            hostContext: context,
          },
          { honorUpdateFlag: false },
        ))
      )
        continue
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
