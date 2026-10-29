import type { HostInstallContext } from '../../platform/hostInstallContext.js'
import { runHarnessArgs } from './runClaudeArgs.js'
import { getMcpSpawnCwd } from './safeCwd.js'

export interface ClaudePluginMetadata {
  readonly id: string
  readonly enabled: boolean | null
  readonly installPath: string | null
}

export async function listClaudePluginMetadata(
  context: HostInstallContext,
): Promise<readonly ClaudePluginMetadata[] | null> {
  if (context.hostId !== 'claude') return null
  try {
    const result = await runHarnessArgs(
      'claude',
      ['plugin', 'list', '--json'],
      getMcpSpawnCwd(context),
      15_000,
      context,
    )
    if (result.exitCode !== 0) return null
    const parsed: unknown = JSON.parse(result.stdout)
    if (!Array.isArray(parsed)) return null
    const entries: ClaudePluginMetadata[] = []
    for (const entry of parsed as { id?: unknown; enabled?: unknown; installPath?: unknown }[]) {
      if (typeof entry?.id !== 'string' || !entry.id) continue
      entries.push({
        id: entry.id,
        enabled: typeof entry.enabled === 'boolean' ? entry.enabled : null,
        installPath: typeof entry.installPath === 'string' ? entry.installPath : null,
      })
    }
    return entries
  } catch {
    return null
  }
}
