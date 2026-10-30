import { isAbsolute, resolve } from 'node:path'
import type { HostInstallContext } from '../../platform/hostInstallContext.js'
import type { UpdateComponentResult, UpdateResult } from './updateResult.js'

export type AgentRepairHost = 'claude' | 'codex'
export type AgentRepairRuntime = 'node' | 'bun' | 'compiled'
export type AgentRepairStatus =
  | 'not-requested'
  | 'not-authorized'
  | 'deferred'
  | 'running'
  | 'completed'
  | 'failed'
  | 'verification-failed'

export interface RepairComponentRequest {
  id: string
  status: Extract<UpdateComponentResult['status'], 'failed' | 'unsupported' | 'retained'>
  reasonCode: string | null
}

export interface RepairAuthorization {
  confirmed: boolean
  mode: 'interactive' | 'explicit-yes' | 'none'
  components: string[]
  grantedAt: string | null
}

export interface RepairRequest {
  host: AgentRepairHost
  runtime: AgentRepairRuntime
  components: RepairComponentRequest[]
  deterministicResult: UpdateResult
  authorization: RepairAuthorization
  hostRoot: string
  allowedRoots: string[]
}

export interface RepairProposal {
  components: string[]
  executionHost: AgentRepairHost
  commandPreview: string[]
  risks: string[]
  writes: string[]
}

export interface AgentRepairResult {
  requested: boolean
  authorized: boolean
  components: string[]
  execution: AgentRepairHost | null
  status: AgentRepairStatus
  verified: boolean
  reasonCode: string | null
  proposal?: RepairProposal
}

export const REVIEWED_REPAIR_COMPONENTS = new Set([
  'ctx7',
  'design-taste-frontend',
  'gstack',
  'gsd',
  'mattpocock-skills',
  'playwright-cli',
  'playwright-test',
  'planning-with-files',
  'superpowers',
  'ui-ux-pro-max',
  'webapp-testing',
])

export function repairableComponents(result: UpdateResult): RepairComponentRequest[] {
  return result.components
    .filter(
      (component): component is UpdateComponentResult & RepairComponentRequest =>
        REVIEWED_REPAIR_COMPONENTS.has(component.id) &&
        ['failed', 'unsupported', 'retained'].includes(component.status),
    )
    .map(({ id, status, reasonCode }) => ({ id, status, reasonCode }))
}

export function validateRepairAuthorization(
  authorization: RepairAuthorization,
  components: RepairComponentRequest[],
): string | null {
  const requested = components.map((component) => component.id).sort()
  const granted = [...new Set(authorization.components)].sort()
  if (!authorization.confirmed) return 'repair-not-confirmed'
  if (authorization.mode === 'none') return 'repair-authorization-mode-missing'
  if (requested.length !== granted.length || requested.some((id, index) => id !== granted[index]))
    return 'repair-component-scope-mismatch'
  if (!authorization.grantedAt || Number.isNaN(Date.parse(authorization.grantedAt)))
    return 'repair-authorization-timestamp-missing'
  return null
}

export function assertRepairRoots(hostRoot: string, allowedRoots: string[]): void {
  if (!isAbsolute(hostRoot)) throw new Error('repair host root must be absolute')
  const root = resolve(hostRoot)
  if (allowedRoots.length === 0) throw new Error('repair allowed roots are missing')
  if (!allowedRoots.some((allowed) => resolve(allowed) === root))
    throw new Error('repair host root is outside the allowed roots')
}

export function createRepairProposal(request: RepairRequest): RepairProposal {
  const components = request.components.map((component) => component.id)
  assertRepairRoots(request.hostRoot, request.allowedRoots)
  return {
    components,
    executionHost: request.host,
    commandPreview:
      request.host === 'claude'
        ? ['claude', '-p', '<bounded repair prompt>']
        : ['codex', 'exec', '--ephemeral', '--json', '<bounded repair prompt>'],
    risks: [
      'Third-party installers or verification commands may execute.',
      'The repair may modify only the listed skill, plugin, or host targets.',
      'The repair never grants plugin or MCP trust and never reads credentials.',
    ],
    writes: request.allowedRoots,
  }
}

export function createAgentRepairResult(
  input: Partial<AgentRepairResult> & Pick<AgentRepairResult, 'status'>,
): AgentRepairResult {
  return {
    requested: input.requested ?? false,
    authorized: input.authorized ?? false,
    components: input.components ?? [],
    execution: input.execution ?? null,
    status: input.status,
    verified: input.verified ?? false,
    reasonCode: input.reasonCode ?? null,
    ...(input.proposal ? { proposal: input.proposal } : {}),
  }
}

export function defaultRepairAuthorization(): RepairAuthorization {
  return { confirmed: false, mode: 'none', components: [], grantedAt: null }
}

export function createRepairRequest(
  result: UpdateResult,
  context: HostInstallContext,
  authorization: RepairAuthorization,
): RepairRequest {
  const components = repairableComponents(result)
  return {
    host: context.hostId,
    runtime: result.runtime,
    components,
    deterministicResult: result,
    authorization,
    hostRoot: context.nativeHome,
    allowedRoots: [context.nativeHome, context.platform.stateRoot],
  }
}
