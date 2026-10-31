import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { resolveComponentPlan } from '../../installers/lib/componentPlan.js'
import type { InstallContext, Manifest } from '../../installers/lib/types.js'
import { validateManifestFile } from '../../manifest/validate.js'
import { getAssetsRoot } from '../../platform/assetsRoot.js'
import type { HostInstallContext } from '../../platform/hostInstallContext.js'
import type { RepairRequest } from './agentRepair.js'

export interface OwnershipAdoptionPlan {
  ctx: InstallContext
}

export async function loadRequestedOwnershipManifests(
  componentIds: readonly string[],
): Promise<Manifest[]> {
  const requested = new Set(componentIds)
  const found: Manifest[] = []
  for (const directory of ['tools', 'skill-packs']) {
    const root = join(getAssetsRoot(), 'manifests', directory)
    for (const name of await readdir(root)) {
      if (!name.endsWith('.yaml')) continue
      const path = join(root, name)
      const validated = validateManifestFile(await readFile(path, 'utf8'), path)
      if (validated.ok && requested.has(validated.manifest.metadata.name)) {
        found.push(validated.manifest)
      } else if (!validated.ok && requested.has(name.slice(0, -5))) {
        throw new Error(`invalid ownership adoption manifest: ${name}`)
      }
    }
  }
  return found
}

function declaresOwnership(manifest: Manifest): boolean {
  const resources = (manifest.spec as unknown as { ownership?: { resources?: unknown } }).ownership
    ?.resources
  return Array.isArray(resources) && resources.length > 0
}

export function buildOwnershipAdoptionPlans(
  request: RepairRequest,
  context: HostInstallContext,
  manifests: Manifest[],
  resolvePlan: typeof resolveComponentPlan,
): OwnershipAdoptionPlan[] {
  return request.components
    .map(({ id }) => {
      const matches = manifests.filter((manifest) => manifest.metadata.name === id)
      if (matches.length !== 1) throw new Error(`ownership adoption manifest count mismatch: ${id}`)
      const manifest = matches[0]
      if (!manifest) throw new Error(`ownership adoption manifest missing: ${id}`)
      const plan = resolvePlan(manifest, context, 'install')
      if (
        plan.status !== 'supported' ||
        plan.componentId !== id ||
        plan.manifest.metadata.name !== id
      ) {
        throw new Error(`ownership adoption plan mismatch: ${id}`)
      }
      return {
        ctx: {
          manifest: structuredClone(plan.manifest) as Manifest,
          hostContext: plan.context,
          level: 'L4' as const,
          cwd: plan.context.neutralSpawnCwd ?? plan.context.userHome,
          opts: {
            apply: false,
            dryRun: false,
            system: false,
            nonInteractive: true,
            fullDiff: false,
            color: false,
          },
        },
      }
    })
    .filter(({ ctx }) => declaresOwnership(ctx.manifest))
}
