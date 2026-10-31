import { resolveComponentPlan } from '../../installers/lib/componentPlan.js'
import {
  isSkillOwnershipReceiptError,
  readSkillOwnershipReceipt,
} from '../../installers/lib/skillOwnershipReceipt.js'
import type { InstallContext, Manifest } from '../../installers/lib/types.js'
import type { HostInstallContext } from '../../platform/hostInstallContext.js'
import { REVIEWED_REPAIR_COMPONENTS, type RepairComponentRequest } from './agentRepair.js'
import { loadRequestedOwnershipManifests } from './ownershipAdoptionPlan.js'
import type { UpdateResult } from './updateResult.js'

export interface OwnershipRepairCandidateDependencies {
  loadManifests?: (componentIds: readonly string[]) => Promise<Manifest[]>
  resolvePlan?: typeof resolveComponentPlan
  readReceipt?: typeof readSkillOwnershipReceipt
}

function declaresOwnership(manifest: Manifest): boolean {
  const resources = (manifest.spec as unknown as { ownership?: { resources?: unknown } }).ownership
    ?.resources
  return Array.isArray(resources) && resources.length > 0
}

function installContext(manifest: Manifest, context: HostInstallContext): InstallContext {
  return {
    manifest,
    hostContext: context,
    level: 'L4',
    cwd: context.neutralSpawnCwd ?? context.userHome,
    opts: {
      apply: false,
      dryRun: false,
      system: false,
      nonInteractive: true,
      fullDiff: false,
      color: false,
    },
  }
}

export async function findOwnershipRepairCandidates(
  result: UpdateResult,
  context: HostInstallContext,
  dependencies: OwnershipRepairCandidateDependencies = {},
): Promise<RepairComponentRequest[]> {
  const ids = result.components
    .filter(
      (component) => component.status === 'current' && REVIEWED_REPAIR_COMPONENTS.has(component.id),
    )
    .map(({ id }) => id)
  if (ids.length === 0) return []

  const manifests = await (dependencies.loadManifests ?? loadRequestedOwnershipManifests)(ids)
  const resolvePlan = dependencies.resolvePlan ?? resolveComponentPlan
  const readReceipt = dependencies.readReceipt ?? readSkillOwnershipReceipt
  const candidates: RepairComponentRequest[] = []
  for (const id of ids) {
    const matches = manifests.filter((manifest) => manifest.metadata.name === id)
    if (matches.length !== 1) throw new Error(`ownership repair manifest count mismatch: ${id}`)
    const source = matches[0]
    if (!source) throw new Error(`ownership repair manifest missing: ${id}`)
    const plan = resolvePlan(source, context, 'install')
    if (plan.status !== 'supported' || !declaresOwnership(plan.manifest as Manifest)) continue
    try {
      await readReceipt(installContext(structuredClone(plan.manifest) as Manifest, plan.context))
    } catch (error) {
      if (!isSkillOwnershipReceiptError(error)) throw error
      candidates.push({
        id,
        status: 'current',
        reasonCode: 'ownership-receipt-repair-required',
      })
    }
  }
  return candidates
}
