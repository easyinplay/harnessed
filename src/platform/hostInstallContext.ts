import { homedir } from 'node:os'
import type { HostId, PlatformDescriptor } from './platform.js'
import { descriptorForConfiguredHome, detectPlatform, isHostId } from './platform.js'

export interface HostInstallContext {
  readonly hostId: HostId
  readonly os: NodeJS.Platform
  readonly userHome: string
  readonly platform: Readonly<PlatformDescriptor>
  readonly nativeHome: string
  readonly neutralSpawnCwd?: string
}

export interface HostInstallSelection {
  readonly os: NodeJS.Platform
  readonly userHome: string
  readonly nativeHome?: string
  readonly neutralSpawnCwd?: string
}

export interface CaptureHostInstallOptions {
  readonly hostId?: string
  readonly os?: NodeJS.Platform
  readonly userHome?: string
}

export function createHostInstallContext(
  platform: Readonly<PlatformDescriptor>,
  selection: HostInstallSelection,
): HostInstallContext {
  if (platform.id !== 'claude' && platform.id !== 'codex') {
    throw new Error(`unsupported host: ${platform.id}`)
  }
  const nativeHome = platform.id === 'codex' ? selection.nativeHome?.trim() : selection.nativeHome
  const neutralSpawnCwd = selection.neutralSpawnCwd?.trim()
  return Object.freeze({
    hostId: platform.id,
    os: selection.os,
    userHome: selection.userHome,
    platform: Object.freeze({ ...platform }),
    nativeHome: nativeHome || platform.homeDir,
    ...(neutralSpawnCwd ? { neutralSpawnCwd } : {}),
  })
}

/** Capture selection only. Native operations still need explicit context threading. */
export function captureHostInstallContext(
  options: CaptureHostInstallOptions = {},
): HostInstallContext {
  if (options.hostId !== undefined && !isHostId(options.hostId)) {
    throw new Error(`unsupported host: ${options.hostId}`)
  }
  const userHome = options.userHome ?? homedir()
  const platformEnv = process.env.HARNESSED_PLATFORM?.trim()
  const explicitHost =
    options.hostId ?? (platformEnv !== undefined && isHostId(platformEnv) ? platformEnv : undefined)
  const hostId = explicitHost ?? detectPlatform(userHome).id
  if (!isHostId(hostId)) throw new Error(`unsupported host: ${hostId}`)
  const platform: PlatformDescriptor = descriptorForConfiguredHome(hostId, userHome)
  const rootKey = platform.id === 'codex' ? 'CODEX_HOME' : 'CLAUDE_CONFIG_DIR'
  const nativeHome = process.env[rootKey]?.trim() || platform.homeDir
  return createHostInstallContext(platform, {
    os: options.os ?? process.platform,
    userHome,
    nativeHome,
    neutralSpawnCwd: process.env.HARNESSED_SPAWN_CWD,
  })
}
