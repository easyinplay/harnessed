import { execFileSync } from 'node:child_process'
import { accessSync, constants, lstatSync, readFileSync, realpathSync, statSync } from 'node:fs'
import { dirname, isAbsolute, join, relative, resolve } from 'node:path'
import { requireNativeTool } from '../../installers/lib/nativeToolResolver.js'
import { planWindowsSpawn, resolveWindowsBin } from '../../installers/lib/winSpawn.js'
import { updateTargetKey } from './updateLock.js'

type PackageTargetReason =
  | 'package-target-unproven'
  | 'package-target-mismatch'
  | 'package-layout-unsupported'

export type PackageUpdatePlan =
  | { ok: false; reasonCode: PackageTargetReason; message: string }
  | {
      ok: true
      command: string
      args: string[]
      options: {
        cwd: string
        env: NodeJS.ProcessEnv
        shell: false
        windowsHide: true
        windowsVerbatimArguments: boolean
      }
    }

function packageRootForEntry(entry: string): string {
  for (let directory = dirname(entry); ; directory = dirname(directory)) {
    let manifest: { name?: unknown; bin?: string | { harnessed?: unknown } }
    try {
      manifest = JSON.parse(readFileSync(join(directory, 'package.json'), 'utf8'))
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
      if (dirname(directory) === directory) throw new Error('No package manifest for entry')
      continue
    }
    const bin = typeof manifest?.bin === 'string' ? manifest.bin : manifest?.bin?.harnessed
    if (manifest?.name !== 'harnessed' || typeof bin !== 'string' || isAbsolute(bin))
      throw new Error('Current entry is not a declared harnessed package binary')
    const declared = resolve(directory, bin)
    const inside = relative(directory, declared)
    if (
      inside === '..' ||
      inside.startsWith(`..${process.platform === 'win32' ? '\\' : '/'}`) ||
      isAbsolute(inside) ||
      realpathSync.native(declared) !== entry
    )
      throw new Error('Current entry does not match bin.harnessed')
    return directory
  }
}

function npmPath(env: NodeJS.ProcessEnv, cwd: string): string {
  let executable: string | null = null
  if (process.platform === 'win32') {
    executable = resolveWindowsBin('npm', env)
  } else if (process.platform === 'linux') {
    executable = requireNativeTool('npm', { env, cwd })
  } else {
    for (const directory of (env.PATH ?? '').split(':')) {
      const candidate = resolve(cwd, directory || '.', 'npm')
      try {
        accessSync(candidate, constants.X_OK)
        if (statSync(candidate).isFile()) {
          executable = candidate
          break
        }
      } catch {}
    }
  }
  if (!executable || !isAbsolute(executable))
    throw new Error('Selected npm executable is unresolved')
  return realpathSync.native(executable)
}

function absoluteProbePath(output: string): string {
  const path = output.trim()
  if (!path || /[\r\n\0]/.test(path) || !isAbsolute(path))
    throw new Error('Invalid npm path probe output')
  return path
}

export function preparePackageUpdate(
  manager: 'npm' | 'bun',
  target: { entryPath?: string; targetKey: string },
  context: { env?: NodeJS.ProcessEnv; cwd?: string } = {},
): PackageUpdatePlan {
  if (manager === 'bun')
    return {
      ok: false,
      reasonCode: 'package-target-unproven',
      message:
        'Bun global package target cannot be proven; no update performed and no npm fallback.',
    }
  try {
    if (!target.entryPath) throw new Error('Package entry path is missing')
    const entry = realpathSync.native(target.entryPath)
    const packageRoot = packageRootForEntry(entry)
    if (
      updateTargetKey(packageRoot) !== target.targetKey ||
      updateTargetKey(entry) !== target.targetKey
    )
      return {
        ok: false,
        reasonCode: 'package-target-mismatch',
        message: 'Current harnessed package does not match the locked target.',
      }
    const env = { ...(context.env ?? process.env) }
    const cwd = context.cwd ?? process.cwd()
    const executable = npmPath(env, cwd)
    const plan = (args: string[]) => {
      const spawn =
        process.platform === 'win32'
          ? planWindowsSpawn('npm', args, executable)
          : { command: executable, args, verbatim: false }
      const command = spawn.verbatim ? resolveWindowsBin('cmd.exe', env) : spawn.command
      if (!command || !isAbsolute(command)) throw new Error('Selected npm launcher is unresolved')
      return {
        command,
        args: spawn.args,
        options: {
          cwd,
          env,
          shell: false as const,
          windowsHide: true as const,
          windowsVerbatimArguments: spawn.verbatim,
        },
      }
    }
    const probe = (args: string[]) => {
      const command = plan(args)
      return absoluteProbePath(
        execFileSync(command.command, command.args, {
          ...command.options,
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'pipe'],
          timeout: 15_000,
          maxBuffer: 16 * 1024,
        }),
      )
    }
    const prefix = probe(['prefix', '-g'])
    const modulesRoot = probe(['root', '-g', '--prefix', prefix])
    const slot = join(modulesRoot, 'harnessed')
    const stat = lstatSync(slot)
    if (stat.isSymbolicLink() || !stat.isDirectory())
      return {
        ok: false,
        reasonCode: 'package-layout-unsupported',
        message: 'Linked or non-directory global package slots cannot be updated.',
      }
    const canonicalSlot = realpathSync.native(slot)
    if (canonicalSlot !== packageRoot || updateTargetKey(canonicalSlot) !== target.targetKey)
      return {
        ok: false,
        reasonCode: 'package-target-mismatch',
        message: 'Selected npm global package target differs from the locked harnessed package.',
      }
    return { ok: true, ...plan(['i', '-g', '--prefix', prefix, 'harnessed@latest']) }
  } catch (error) {
    return {
      ok: false,
      reasonCode: 'package-target-unproven',
      message: error instanceof Error ? error.message : 'Cannot prove npm global package target.',
    }
  }
}
