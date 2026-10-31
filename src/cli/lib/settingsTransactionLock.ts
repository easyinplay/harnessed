import { AsyncLocalStorage } from 'node:async_hooks'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import lockfile from 'proper-lockfile'
import type { HostInstallContext } from '../../platform/hostInstallContext.js'
import { detectPlatform } from '../../platform/platform.js'

const heldLocks = new AsyncLocalStorage<Set<string>>()

function lockRoots(hostContext?: HostInstallContext): string[] {
  return [join(hostContext?.nativeHome ?? detectPlatform().homeDir, 'harnessed')]
}

export async function withSettingsTransactionLock<T>(
  hostContext: HostInstallContext | undefined,
  work: () => Promise<T>,
): Promise<T> {
  const active = heldLocks.getStore()
  const roots = lockRoots(hostContext)
  if (roots.every((root) => active?.has(root))) return work()

  const releases: Array<() => Promise<void>> = []
  const next = new Set(active)
  try {
    for (const root of roots) {
      if (next.has(root)) continue
      await mkdir(root, { recursive: true })
      releases.push(
        await lockfile.lock(root, {
          stale: 60_000,
          retries: {
            retries: 20,
            factor: 1.3,
            minTimeout: 50,
            maxTimeout: 250,
            randomize: true,
          },
          lockfilePath: join(root, '.settings-transaction.lock'),
        }),
      )
      next.add(root)
    }
    return await heldLocks.run(next, work)
  } finally {
    for (const release of releases.reverse()) await release()
  }
}
