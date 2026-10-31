import type { AgentRepairResult, RepairRequest } from './agentRepair.js'

export function isVerifiedRepairCompletion(
  repair: AgentRepairResult,
  request: RepairRequest,
): boolean {
  const expected = request.components.map(({ id }) => id).sort()
  const actual = [...new Set(repair.components)].sort()
  return (
    repair.status === 'completed' &&
    repair.verified &&
    repair.authorized &&
    repair.execution === request.host &&
    expected.length === actual.length &&
    expected.every((id, index) => id === actual[index])
  )
}
