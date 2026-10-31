import { createHash } from 'node:crypto'
import { join } from 'node:path'
import { harnessedSubdir } from '../platform/harnessedRoot.js'
import { activeKey } from './workflowStore.js'

export type OwnerPathArea = 'checkpoints' | 'archive'

export function ownerHash(ownerKey: string = activeKey()): string {
  return createHash('sha256').update(ownerKey).digest('hex').slice(0, 16)
}

export function ownerPath(
  area: OwnerPathArea,
  segments: string[],
  ownerKey: string = activeKey(),
): string {
  return join(harnessedSubdir(area), ownerHash(ownerKey), ...segments)
}
