import { buildUpdateResult, createUpdateComponent } from '../updateResult.js'
import { gsdUpdateAdapter } from './gsd.js'
import type { UpdateAdapter, UpdateAdapterDependencies, UpdateAdapterPlan } from './types.js'

export const updateAdapterRegistry = {
  gsd: gsdUpdateAdapter,
} satisfies Record<'gsd', UpdateAdapter>

export function getUpdateAdapter(componentId: string): UpdateAdapter | undefined {
  return componentId === 'gsd' ? updateAdapterRegistry.gsd : undefined
}

export async function executeRegisteredUpdate(
  plan: UpdateAdapterPlan,
  dependencies: UpdateAdapterDependencies,
) {
  const adapter = getUpdateAdapter(plan.componentId)
  const component = adapter
    ? await adapter.execute(plan, dependencies)
    : createUpdateComponent({
        id: plan.componentId,
        status: 'unsupported',
        reasonCode: 'adapter-not-reviewed',
      })
  return buildUpdateResult({
    mode: plan.mode,
    host: plan.host,
    runtime: plan.runtime,
    components: [component],
  })
}
