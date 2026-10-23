import { homedir } from 'node:os'
import type { HostId, PlatformDescriptor } from './platform.js'
import { descriptorFor, detectPlatform, isHostId } from './platform.js'

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
  let platform: PlatformDescriptor
  if (options.hostId === undefined) {
    platform = detectPlatform(userHome)
  } else {
    platform = descriptorFor(options.hostId as HostId, userHome)
    const stateRoot = process.env.HARNESSED_ROOT_OVERRIDE
    if (stateRoot !== undefined && stateRoot !== '') platform = { ...platform, stateRoot }
  }
  const rootKey = platform.id === 'codex' ? 'CODEX_HOME' : 'CLAUDE_CONFIG_DIR'
  return createHostInstallContext(platform, {
    os: options.os ?? process.platform,
    userHome,
    nativeHome: process.env[rootKey],
    neutralSpawnCwd: process.env.HARNESSED_SPAWN_CWD,
  })
}
