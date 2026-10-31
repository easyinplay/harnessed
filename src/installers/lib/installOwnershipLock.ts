import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import lockfile from 'proper-lockfile'
import type { HostInstallContext } from '../../platform/hostInstallContext.js'

export async function withInstallOwnershipLock<T>(
  context: HostInstallContext,
  work: () => Promise<T>,
): Promise<T> {
  const root = context.platform.stateRoot
  await mkdir(root, { recursive: true })
  const release = await lockfile.lock(root, {
    lockfilePath: join(root, '.ownership.lock'),
    realpath: false,
    stale: 10 * 60 * 1000,
    retries: { retries: 5, minTimeout: 25, maxTimeout: 250 },
  })
  try {
    return await work()
  } finally {
    await release()
  }
}
