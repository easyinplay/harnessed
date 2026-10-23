import { lstat, readFile, realpath, stat, symlink } from 'node:fs/promises'
import { isAbsolute, join } from 'node:path'
import type { HostInstallContext } from '../../platform/hostInstallContext.js'
import { detectPlatform } from '../../platform/platform.js'

export interface GstackCodexRuntimeRepairOptions {
  host: string
  sourceDir: string
  codexHome?: string
  confirmed: boolean
  hostContext?: HostInstallContext
}

export interface GstackCodexRuntimeRepairResult {
  status: 'created' | 'unchanged' | 'skipped'
  runtimeRoot?: string
}

/** Call only after L2 confirmation. Never refresh a checkout or replace an existing entry. */
export async function repairGstackCodexRuntimeAfterConfirm(
  options: GstackCodexRuntimeRepairOptions,
): Promise<GstackCodexRuntimeRepairResult> {
  if (options.host !== 'codex' || options.confirmed !== true) return { status: 'skipped' }
  const platform = options.hostContext?.platform ?? detectPlatform()
  if ((options.hostContext?.hostId ?? platform.id) !== 'codex')
    throw new Error('gstack runtime repair requires the active Codex host')
  // Official setup installs here, not getSkillsDir()'s shared .agents/skills directory.
  const codexHome =
    options.hostContext?.nativeHome ??
    ((options.codexHome ?? process.env.CODEX_HOME) || platform.homeDir)
  if (!isAbsolute(codexHome) || !isAbsolute(options.sourceDir)) {
    throw new Error('gstack runtime repair requires absolute CODEX_HOME and sourceDir paths')
  }
  const runtimeRoot = join(codexHome, 'skills', 'gstack')
  const rootEntry = await lstat(runtimeRoot)
  if (!rootEntry.isDirectory() || rootEntry.isSymbolicLink()) {
    throw new Error(`gstack runtime root must be an existing real directory: ${runtimeRoot}`)
  }

  const source = await realpath(options.sourceDir)
  const recordedSource = (await readFile(join(runtimeRoot, '.source-path'), 'utf8')).trim()
  if (!isAbsolute(recordedSource) || (await realpath(recordedSource)) !== source) {
    throw new Error(`gstack runtime .source-path does not match expected source: ${source}`)
  }
  const pkg = JSON.parse(await readFile(join(source, 'package.json'), 'utf8'))
  if (pkg.name !== 'gstack') throw new Error(`expected a gstack source checkout: ${source}`)
  const sourceModules = await realpath(join(source, 'node_modules'))
  if (
    !(await stat(sourceModules)).isDirectory() ||
    !(await stat(join(sourceModules, 'playwright'))).isDirectory()
  ) {
    throw new Error(`gstack source dependencies are unavailable: ${sourceModules}`)
  }

  const target = join(runtimeRoot, 'node_modules')
  const entry = await lstat(target).catch((error: NodeJS.ErrnoException) => {
    if (error.code === 'ENOENT') return undefined
    throw error
  })
  if (entry) {
    if (entry.isSymbolicLink()) {
      const actual = await realpath(target).catch(() => null)
      if (actual !== sourceModules) {
        throw new Error(`refusing to replace an existing gstack dependency link: ${target}`)
      }
    } else if (!entry.isDirectory()) {
      throw new Error(`refusing to replace an existing gstack dependency entry: ${target}`)
    }
    return { status: 'unchanged', runtimeRoot }
  }

  // symlink is create-only: a concurrent creator causes EEXIST, never replacement.
  await symlink(
    sourceModules,
    target,
    (options.hostContext?.os ?? process.platform) === 'win32' ? 'junction' : 'dir',
  )
  return { status: 'created', runtimeRoot }
}
