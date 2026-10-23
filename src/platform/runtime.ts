import { isCompiledRuntime } from './assetsRoot.js'

/** Runtime only, never evidence of which package manager installed harnessed. */
export function isBunRuntime(
  versions: Readonly<Record<string, string | undefined>> = process.versions,
  compiled?: boolean,
): boolean {
  return (
    typeof versions.bun === 'string' &&
    versions.bun.trim().length > 0 &&
    !(compiled ?? isCompiledRuntime())
  )
}

/** Reuse an explicitly running Bun; Node callers resolve the native executable on PATH. */
export function bunExecutable(): string {
  return isBunRuntime() ? process.execPath : process.platform === 'win32' ? 'bun.exe' : 'bun'
}
