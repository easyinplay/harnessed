import { execFile } from 'node:child_process'
import { lstat, mkdtemp, readdir, readFile, realpath, rm, stat } from 'node:fs/promises'
import { basename, dirname, isAbsolute, join } from 'node:path'
import { detectPlatform } from '../../platform/platform.js'
import { err } from './err.js'
import { resolveBash } from './resolveBash.js'
import type { InstallContext, InstallResult } from './types.js'

const SCRATCH_PREFIX = '.harnessed-gstack-lease-'
const TIMEOUT_MS = 10_000

function shellPath(path: string): string {
  return process.platform === 'win32' ? path.replace(/\\/g, '/') : path
}

function touch(binary: string, lease: string, source: string, scratch: string): Promise<void> {
  // Preserve native shell policy, but never forward credentials or startup hooks.
  const env: NodeJS.ProcessEnv = {}
  for (const key of [
    'PATH',
    'SystemRoot',
    'WINDIR',
    'HOME',
    'USERPROFILE',
    'TEMP',
    'TMP',
    'MSYS',
    'MSYS2',
    'CYGWIN',
  ]) {
    if (process.env[key] !== undefined) env[key] = process.env[key]
  }
  env.GSTACK_LEASE_DIR = shellPath(scratch)
  env.GSTACK_LEASE_LOCK_TRIES = '1'
  return new Promise((resolve, reject) => {
    const child = execFile(
      binary,
      [
        '--noprofile',
        '--norc',
        '-c',
        'exec "$BASH" --noprofile --norc "$1" touch --root "$2" --pid "$$"',
        'harnessed-gstack-lease',
        shellPath(lease),
        shellPath(source),
      ],
      {
        cwd: source,
        env,
        shell: false,
        windowsHide: true,
        timeout: TIMEOUT_MS,
        killSignal: 'SIGKILL',
        maxBuffer: 64 * 1024,
        encoding: 'utf8',
      },
      (error, _stdout, stderr) => {
        if (error)
          reject(
            new Error(
              `official lease touch exit ${error.code ?? 'unknown'}${error.killed ? ' (timeout or termination)' : ''}: ${stderr.trim() || error.message}`,
            ),
          )
        else resolve()
      },
    )
    child.stdin?.end()
  })
}

async function cleanupScratch(scratch: string, source: string | undefined): Promise<void> {
  const owned = await realpath(scratch)
  if (
    dirname(owned) !== source ||
    !basename(owned).startsWith(SCRATCH_PREFIX) ||
    (await lstat(scratch)).isSymbolicLink()
  ) {
    throw new Error('refusing cleanup outside the owned source-checkout scratch')
  }
  await rm(scratch, { recursive: true, force: true })
}

/** Capability check only: no preamble, repairs, receipts, or shared lease access. */
export async function verifyGstackLease(ctx: InstallContext): Promise<InstallResult | null> {
  if (ctx.opts.dryRun || ctx.manifest.metadata.name !== 'gstack') return null
  const platform = detectPlatform()
  if (platform.id !== 'codex') return null
  let scratch: string | undefined
  let source: string | undefined
  let problem: string | undefined
  try {
    const home =
      (ctx.manifest.spec.install.env?.CODEX_HOME ?? process.env.CODEX_HOME) || platform.homeDir
    if (!isAbsolute(home)) throw new Error('CODEX_HOME must be absolute')
    const runtime = await realpath(join(home, 'skills', 'gstack'))
    const lease = join(runtime, 'bin', 'gstack-lease')
    const script = await stat(lease)
    if (!script.isFile() || script.size === 0)
      throw new Error(`missing installed lease script: ${lease}`)
    const recordedSource = await readFile(join(runtime, '.source-path'), 'utf8').catch(
      (error: NodeJS.ErrnoException) => {
        if (error.code === 'ENOENT') return runtime
        throw error
      },
    )
    if (!isAbsolute(recordedSource.trim())) throw new Error('gstack .source-path must be absolute')
    source = await realpath(recordedSource.trim())
    const bash = process.platform === 'win32' ? resolveBash().path : 'bash'
    if (!bash) throw new Error('a usable Git Bash is required')
    // mkdtemp creates an owned directory on the source checkout's filesystem.
    scratch = await mkdtemp(join(source, SCRATCH_PREFIX))
    await touch(bash, lease, source, scratch)
    const entries = await readdir(scratch)
    const record = entries[0]
    if (
      entries.length !== 1 ||
      !record ||
      !/^\d+$/.test(record) ||
      !(await lstat(join(scratch, record))).isFile()
    ) {
      throw new Error(
        'official touch did not publish exactly one lease record and release its locks',
      )
    }
  } catch (error) {
    problem = error instanceof Error ? error.message : String(error)
  } finally {
    if (scratch) {
      try {
        await cleanupScratch(scratch, source)
      } catch (error) {
        problem = `${problem ? `${problem}; ` : ''}scratch cleanup failed: ${String(error)}`
      }
    }
  }
  if (!problem) return null
  return {
    ok: false,
    phase: 'verify',
    error: {
      ...err(
        ctx,
        '/spec/verify/cmd',
        `gstack Codex lease readiness unavailable (owned scratch: ${scratch ?? 'not created'}): ${problem}. Lock-primitive failure in a fresh scratch does not prove live-process contention. Upstream blocker; native security and shared user leases were not changed.`,
        'upstream-lease-unavailable',
      ),
      suggest:
        'Wait for an upstream lease compatibility fix and rerun verification. Do not bypass locking, change native symlink security, or treat skill-start exit 0 as lease readiness.',
    },
  }
}
