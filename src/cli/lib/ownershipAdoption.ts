import { resolveComponentPlan } from '../../installers/lib/componentPlan.js'
import {
  type DeclaredOwnership,
  discoverDeclaredOwnership,
  writeDeclaredOwnershipReceipt,
} from '../../installers/lib/ownershipContract.js'
import { skillOwnershipReceiptPath } from '../../installers/lib/skillOwnershipReceipt.js'
import type { Manifest } from '../../installers/lib/types.js'
import type { HostInstallContext } from '../../platform/hostInstallContext.js'
import {
  type AgentRepairResult,
  createAgentRepairResult,
  type RepairRequest,
  validateRepairAuthorization,
} from './agentRepair.js'
import { withOwnershipAdoptionLock } from './ownershipAdoptionLock.js'
import {
  buildOwnershipAdoptionPlans,
  loadRequestedOwnershipManifests,
  type OwnershipAdoptionPlan,
} from './ownershipAdoptionPlan.js'
import {
  intersectDeclaredOwnership,
  restoreOwnershipReceipts,
  snapshotOwnershipReceipt,
} from './ownershipAdoptionReceipt.js'
import { isVerifiedRepairCompletion } from './ownershipAdoptionResult.js'

interface AdoptionInput {
  context: HostInstallContext
  request: RepairRequest
  runRepair: () => Promise<AgentRepairResult>
}

type AdoptionWork = () => Promise<AgentRepairResult>

export interface OwnershipAdoptionDependencies {
  loadManifests?: (componentIds: readonly string[]) => Promise<Manifest[]>
  resolvePlan?: typeof resolveComponentPlan
  discover?: typeof discoverDeclaredOwnership
  writeReceipt?: typeof writeDeclaredOwnershipReceipt
  receiptPath?: typeof skillOwnershipReceiptPath
  restoreReceipts?: typeof restoreOwnershipReceipts
  withLock?: (context: HostInstallContext, work: AdoptionWork) => Promise<AgentRepairResult>
}

function failed(request: RepairRequest, reasonCode = 'ownership-adoption-failed') {
  return createAgentRepairResult({
    requested: true,
    authorized: true,
    components: request.components.map(({ id }) => id),
    execution: request.host,
    status: 'failed',
    verified: false,
    reasonCode,
  })
}

async function invokeRepair(
  request: RepairRequest,
  runRepair: () => Promise<AgentRepairResult>,
): Promise<AgentRepairResult> {
  try {
    return await runRepair()
  } catch {
    return failed(request, 'agent-repair-threw')
  }
}

export async function runOwnershipAdoption(
  input: AdoptionInput,
  dependencies: OwnershipAdoptionDependencies = {},
): Promise<AgentRepairResult> {
  const { context, request, runRepair } = input
  const authorizationError = validateRepairAuthorization(request.authorization, request.components)
  if (authorizationError) {
    return createAgentRepairResult({
      requested: true,
      authorized: false,
      components: request.components.map(({ id }) => id),
      execution: request.host,
      status: 'not-authorized',
      reasonCode: authorizationError,
    })
  }
  let plans: OwnershipAdoptionPlan[]
  try {
    const manifests = await (dependencies.loadManifests ?? loadRequestedOwnershipManifests)(
      request.components.map(({ id }) => id),
    )
    plans = buildOwnershipAdoptionPlans(
      request,
      context,
      manifests,
      dependencies.resolvePlan ?? resolveComponentPlan,
    )
  } catch {
    return failed(request, 'ownership-adoption-plan-failed')
  }
  if (plans.length === 0) {
    const repair = await invokeRepair(request, runRepair)
    if (
      repair.status === 'completed' &&
      repair.verified &&
      !isVerifiedRepairCompletion(repair, request)
    ) {
      return failed(request, 'agent-repair-result-mismatch')
    }
    return repair
  }
  const discover = dependencies.discover ?? discoverDeclaredOwnership
  const writeReceipt = dependencies.writeReceipt ?? writeDeclaredOwnershipReceipt
  const receiptPath = dependencies.receiptPath ?? skillOwnershipReceiptPath
  const restoreReceipts = dependencies.restoreReceipts ?? restoreOwnershipReceipts
  const withLock = dependencies.withLock ?? withOwnershipAdoptionLock
  try {
    return await withLock(context, async () => {
      const before = await Promise.all(plans.map(({ ctx }) => discover(ctx)))
      const receipts = await Promise.all(
        plans.map(({ ctx }) => snapshotOwnershipReceipt(receiptPath(ctx))),
      )
      const repair = await invokeRepair(request, runRepair)
      try {
        await restoreReceipts(receipts)
      } catch {
        return failed(request, 'ownership-receipt-restore-failed')
      }
      if (repair.status !== 'completed' || !repair.verified) return repair
      if (!isVerifiedRepairCompletion(repair, request)) {
        return failed(request, 'agent-repair-result-mismatch')
      }
      let adopted: DeclaredOwnership[]
      try {
        const after = await Promise.all(plans.map(({ ctx }) => discover(ctx)))
        adopted = after.map((value, index) =>
          intersectDeclaredOwnership(before[index] as DeclaredOwnership, value),
        )
        if (adopted.some(({ paths }) => paths.length === 0)) {
          return failed(request, 'ownership-adoption-empty')
        }
        for (const [index, plan] of plans.entries()) {
          const ownership = adopted[index] as DeclaredOwnership
          await writeReceipt(plan.ctx, { roots: ownership.roots, paths: ownership.paths })
        }
      } catch {
        try {
          await restoreReceipts(receipts)
        } catch {
          return failed(request, 'ownership-adoption-rollback-failed')
        }
        return failed(request, 'ownership-adoption-writer-failed')
      }
      return repair
    })
  } catch {
    return failed(request)
  }
}
