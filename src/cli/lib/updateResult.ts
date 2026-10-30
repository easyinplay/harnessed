export type UpdateComponentStatus =
  | 'current'
  | 'updated'
  | 'planned'
  | 'unsupported'
  | 'failed'
  | 'retained'
  | 'not-installed'

export type UpdateStatus = 'complete' | 'planned' | 'partial' | 'failed'
export type UpdateMode = 'check' | 'dry-run' | 'apply'
export type UpdateErrorKind = 'arguments' | 'protocol' | 'fatal'

export interface UpdateComponentResult {
  id: string
  status: UpdateComponentStatus
  before: string | null
  target: string | null
  after: string | null
  reasonCode: string | null
  verified: boolean
  restartRequired: boolean
}

export interface UpdateError {
  kind: UpdateErrorKind
  reasonCode: string
  message: string
}

export interface AgentRepairSummary {
  requested: boolean
  authorized: boolean
  components: string[]
  execution: 'claude' | 'codex' | null
  status:
    | 'not-requested'
    | 'not-authorized'
    | 'deferred'
    | 'running'
    | 'completed'
    | 'failed'
    | 'verification-failed'
  verified: boolean
  reasonCode: string | null
}

export interface UpdateResult {
  schemaVersion: 1
  operation: 'update'
  mode: UpdateMode
  host: 'claude' | 'codex' | null
  runtime: 'node' | 'bun' | 'compiled'
  status: UpdateStatus
  components: UpdateComponentResult[]
  warnings: string[]
  error: UpdateError | null
  agentRepair?: AgentRepairSummary
}

export function createUpdateComponent(
  input: Pick<UpdateComponentResult, 'id' | 'status'> & Partial<UpdateComponentResult>,
): UpdateComponentResult {
  return {
    id: input.id,
    status: input.status,
    before: input.before ?? null,
    target: input.target ?? null,
    after: input.after ?? null,
    reasonCode: input.reasonCode ?? null,
    verified: input.verified ?? false,
    restartRequired: input.restartRequired ?? false,
  }
}

export function createUpdateError(
  cause: unknown,
  kind: UpdateErrorKind = 'fatal',
  reasonCode = 'update-failed',
): UpdateError {
  let message: unknown
  try {
    message = cause instanceof Error ? cause.message : cause
  } catch {
    message = undefined
  }
  return {
    kind,
    reasonCode,
    message: typeof message === 'string' ? message : 'Unknown update error',
  }
}

export function buildUpdateResult(
  input: Pick<UpdateResult, 'mode' | 'host' | 'runtime' | 'components'> & {
    warnings?: string[]
    error?: UpdateError | null
  },
): UpdateResult {
  const { components } = input
  const error =
    input.error ??
    (components.length === 0
      ? createUpdateError('No components requested', 'fatal', 'no-components')
      : null)
  let status: UpdateStatus = 'complete'
  if (error || components.every((component) => component.status === 'failed')) {
    status = 'failed'
  } else if (
    components.some((component) => ['failed', 'unsupported', 'retained'].includes(component.status))
  ) {
    status = 'partial'
  } else if (components.some((component) => component.status === 'planned')) {
    status = 'planned'
  }
  return {
    schemaVersion: 1,
    operation: 'update',
    mode: input.mode,
    host: input.host,
    runtime: input.runtime,
    status,
    components,
    warnings: input.warnings ?? [],
    error,
  }
}

export function getUpdateExitCode(result: UpdateResult): 0 | 1 | 2 {
  if (result.error?.kind === 'arguments' || result.error?.kind === 'protocol') return 2
  return result.status === 'complete' || result.status === 'planned' ? 0 : 1
}
