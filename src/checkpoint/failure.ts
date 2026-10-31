import type { CheckpointV1Type } from './schema/checkpoint.v1.js'

const LEGACY_FAILED_PREFIX = 'FAILED:'

export function hasLegacyFailedTask(lastTask: string | undefined): boolean {
  return lastTask?.startsWith(LEGACY_FAILED_PREFIX) ?? false
}

export function isFailedCheckpoint(
  checkpoint: Pick<CheckpointV1Type, 'status' | 'last_task'>,
): boolean {
  return checkpoint.status === 'failed' || hasLegacyFailedTask(checkpoint.last_task)
}
