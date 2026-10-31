import { withInstallOwnershipLock } from '../../installers/lib/installOwnershipLock.js'
import type { HostInstallContext } from '../../platform/hostInstallContext.js'

export async function withOwnershipAdoptionLock<T>(
  context: HostInstallContext,
  work: () => Promise<T>,
): Promise<T> {
  return withInstallOwnershipLock(context, work)
}
