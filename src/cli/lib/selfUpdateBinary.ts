// 4.27.0 (B3 Slice 1, T2) — compiled-binary self-update engine for
// `harnessed update`. Spec SoT: CEO plan 2026-07-12-b5-phase3-slice1.md.
//
// Atomic sequence (any pre-swap failure leaves the original untouched; a
// failed temp→exec rename rolls back from the .bak; there is never a
// "no binary at exec path" window):
//   resolve latest (GitHub releases/latest OR HARNESSED_UPDATE_SOURCE_DIR
//   rehearsal seam — the seam skips the version compare: forced) →
//   download to a same-dir pid-unique temp (.exe suffix on win32 so the
//   smoke step can spawn it) → sha256 verify against the per-asset
//   `<asset>.sha256` (frozen public contract, publish.yml matrix uploads) →
//   chmod 755 (unix) → `--version` smoke → in-place rename exec →
//   `<exec>.bak-<oldver>` (same volume — cross-volume move of a running exe
//   dies on the file lock) → temp → exec → COPY (not move) the .bak to
//   `<stateRoot>/bin-backup/<oldver>/` (E4 rollback net) → delete .bak
//   fail-soft (Windows: the .bak IS the running image, delete = EPERM; and
//   when the bin-backup copy failed we deliberately KEEP the .bak — it is
//   the only rollback net left).
//
// New module (mock-export-gap 铁律); deps injected — tests drive real fs in
// tmpdirs and inject failures via fsOps.

import { createHash } from 'node:crypto'
import {
  access,
  chmod,
  copyFile as fsCopyFile,
  rename as fsRename,
  unlink as fsUnlink,
  mkdir,
  readFile,
  writeFile,
} from 'node:fs/promises'
import { basename, dirname, join } from 'node:path'
import pkg from '../../../package.json' with { type: 'json' }
import { detectPlatform } from '../../installers/lib/platform.js'
import { compareVersions } from './version-check.js'

const OWNER_REPO = 'easyinplay/harnessed'
export const RELEASES_LATEST_URL = `https://api.github.com/repos/${OWNER_REPO}/releases/latest`

/** Frozen asset-name contract (public API — changing it is a major). */
export function assetNameFor(platform: string, arch: string): string {
  const plat =
    ({ win32: 'windows', darwin: 'darwin', linux: 'linux' } as Record<string, string>)[platform] ??
    platform
  const ext = platform === 'win32' ? '.exe' : ''
  return `harnessed-${plat}-${arch}${ext}`
}

export interface ReleaseInfo {
  version: string
  assetUrl: string
  shaUrl: string
}

export interface SelfUpdateDeps {
  execPath: string
  platform: string
  arch: string
  currentVersion: string
  /** HARNESSED_UPDATE_SOURCE_DIR rehearsal/test seam — local dir with
   *  `<asset>` + `<asset>.sha256`; skips GitHub AND the version compare. */
  sourceDir: string | null
  /** GitHub mode: latest release info, null = unreachable, {error} = actionable
   *  (missing platform asset — publish window / failed matrix job). */
  resolveRelease: () => Promise<ReleaseInfo | { error: string } | null>
  downloadTo: (url: string, dest: string) => Promise<void>
  fetchShaText: (url: string) => Promise<string>
  /** Spawn `<bin> --version`, resolve its stdout. */
  smoke: (bin: string) => Promise<string>
  stateRoot: () => string
  log: (line: string) => void
  pid: number
  /** Failure-injection points (default: real fs). */
  fsOps?: {
    rename?: (from: string, to: string) => Promise<void>
    copyFile?: (from: string, to: string) => Promise<void>
    unlink?: (p: string) => Promise<void>
  }
}

export type SelfUpdateOutcome =
  | {
      status: 'updated'
      from: string
      to: string
      bakPath: string
      bakRemoved: boolean
      backupDir: string | null
    }
  | { status: 'current'; version: string }
  | { status: 'checked'; installed: string; latest: string; cmp: string }
  | { status: 'dry-run'; steps: string[] }
  | { status: 'refused'; reason: string }
  | { status: 'error'; message: string }

function normalized(p: string): string {
  return p.replace(/\\/g, '/')
}

async function sha256File(p: string): Promise<string> {
  const buf = await readFile(p)
  return createHash('sha256').update(buf).digest('hex')
}

/** First hex token of a sha256sum-format line (`<hex>  <filename>`). */
function parseShaText(text: string): string | null {
  const m = /^([0-9a-fA-F]{64})\b/.exec(text.trim())
  return m?.[1]?.toLowerCase() ?? null
}

export async function runBinarySelfUpdate(
  deps: SelfUpdateDeps,
  opts: { dryRun?: boolean; check?: boolean },
): Promise<SelfUpdateOutcome> {
  const rename = deps.fsOps?.rename ?? fsRename
  const copyFile = deps.fsOps?.copyFile ?? fsCopyFile
  const unlink = deps.fsOps?.unlink ?? fsUnlink

  // ── safety valve: npm-managed binaries never self-replace ──
  if (normalized(deps.execPath).includes('/node_modules/')) {
    return { status: 'refused', reason: 'binary lives under node_modules (npm-managed)' }
  }

  const asset = assetNameFor(deps.platform, deps.arch)
  const execDir = dirname(deps.execPath)
  const execBase = basename(deps.execPath)
  const ext = deps.platform === 'win32' ? '.exe' : ''
  // pid-unique (F2 用户裁决: no lockfile, last-wins) + .exe suffix (win32 spawn).
  const tempPath = join(execDir, `.harnessed-update-${deps.pid}${ext}`)
  const bakPath = join(execDir, `${execBase}.bak-${deps.currentVersion}`)

  // ── resolve the target ──
  let targetVersion: string | null = null
  let assetUrl: string | null = null
  let shaUrl: string | null = null
  let sourceAsset: string | null = null
  let sourceSha: string | null = null
  if (deps.sourceDir) {
    sourceAsset = join(deps.sourceDir, asset)
    sourceSha = join(deps.sourceDir, `${asset}.sha256`)
  } else {
    const rel = await deps.resolveRelease()
    if (rel === null) {
      return {
        status: 'error',
        message:
          'could not reach GitHub releases to resolve the latest binary — check the network ' +
          'or use the npm channel (`npm i -g harnessed@latest`)',
      }
    }
    if ('error' in rel) {
      // OV2: actionable error, original untouched, NO fallback to older releases.
      return {
        status: 'error',
        message: `${rel.error} — the release may still be publishing (retry in a few minutes) or use the npm channel (\`npm i -g harnessed@latest\`)`,
      }
    }
    targetVersion = rel.version
    assetUrl = rel.assetUrl
    shaUrl = rel.shaUrl
    if (opts.check) {
      return {
        status: 'checked',
        installed: deps.currentVersion,
        latest: rel.version,
        cmp: compareVersions(deps.currentVersion, rel.version),
      }
    }
    const cmp = compareVersions(deps.currentVersion, rel.version)
    if (cmp !== 'behind') {
      return { status: 'current', version: deps.currentVersion }
    }
  }

  // ── dry-run: zero writes, human-readable step preview ──
  if (opts.dryRun) {
    const backupDir = 'bin-backup/<oldver>/ under the harnessed state root'
    const steps = [
      deps.sourceDir
        ? `copy ${sourceAsset} → ${tempPath} (local source dir — rehearsal seam)`
        : `download ${assetUrl ?? `latest ${asset}`} → ${tempPath}`,
      `verify sha256 against ${deps.sourceDir ? sourceSha : (shaUrl ?? `${asset}.sha256`)}`,
      ...(deps.platform === 'win32' ? [] : ['chmod 755 the downloaded binary']),
      'smoke: spawn `--version` on the new binary',
      `rename ${deps.execPath} → ${bakPath} (same-dir, same-volume)`,
      `rename ${tempPath} → ${deps.execPath}`,
      `copy the .bak to ${backupDir} (rollback net)`,
      'delete the .bak (fail-soft — kept on Windows EPERM or when the backup copy failed)',
    ]
    return { status: 'dry-run', steps }
  }

  // ── fetch to temp ──
  try {
    if (deps.sourceDir && sourceAsset) {
      await fsCopyFile(sourceAsset, tempPath)
    } else if (assetUrl) {
      await deps.downloadTo(assetUrl, tempPath)
    }
  } catch (e) {
    await unlink(tempPath).catch(() => {})
    return { status: 'error', message: `download failed: ${(e as Error).message}` }
  }

  // ── integrity (contractual — a missing .sha256 is a hard error) ──
  try {
    const shaText = deps.sourceDir
      ? await readFile(sourceSha ?? '', 'utf8')
      : await deps.fetchShaText(shaUrl ?? '')
    const expected = parseShaText(shaText)
    if (!expected) throw new Error(`malformed .sha256 content`)
    const actual = await sha256File(tempPath)
    if (actual !== expected) {
      throw new Error(
        `sha256 mismatch — expected ${expected.slice(0, 12)}…, got ${actual.slice(0, 12)}…`,
      )
    }
  } catch (e) {
    await unlink(tempPath).catch(() => {})
    return {
      status: 'error',
      message: `integrity verification failed: ${(e as Error).message} — aborted; original binary untouched`,
    }
  }

  // ── chmod + smoke ──
  try {
    if (deps.platform !== 'win32') await chmod(tempPath, 0o755)
    const out = (await deps.smoke(tempPath)).trim()
    const m = /^(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)/.exec(out)
    if (!m) throw new Error(`--version smoke returned unexpected output: ${out.slice(0, 80)}`)
    targetVersion = targetVersion ?? m[1] ?? null
  } catch (e) {
    await unlink(tempPath).catch(() => {})
    return {
      status: 'error',
      message: `new binary failed the --version smoke: ${(e as Error).message} — aborted; original binary untouched`,
    }
  }

  // ── swap: exec → .bak, temp → exec (rollback on failure) ──
  try {
    await rename(deps.execPath, bakPath)
  } catch (e) {
    await unlink(tempPath).catch(() => {})
    return {
      status: 'error',
      message: `could not move the current binary aside: ${(e as Error).message} — original untouched`,
    }
  }
  try {
    await rename(tempPath, deps.execPath)
  } catch (e) {
    try {
      await rename(bakPath, deps.execPath)
      return {
        status: 'error',
        message: `swap failed (${(e as Error).message}) — rolled back to the previous binary`,
      }
    } catch (rb) {
      return {
        status: 'error',
        message:
          `CRITICAL: swap failed AND rollback failed (${(rb as Error).message}). ` +
          `Restore manually: copy "${bakPath}" "${deps.execPath}"`,
      }
    }
  }

  // ── post-swap: bin-backup copy (E4), then delete .bak fail-soft ──
  let backupDir: string | null = null
  let copied = false
  try {
    const dir = join(deps.stateRoot(), 'bin-backup', deps.currentVersion)
    await mkdir(dir, { recursive: true })
    await copyFile(bakPath, join(dir, execBase))
    backupDir = dir
    copied = true
  } catch (e) {
    deps.log(
      `warning: could not copy the previous binary to bin-backup (${(e as Error).message}) — ` +
        `keeping ${bakPath} as the rollback net`,
    )
  }
  let bakRemoved = false
  if (copied) {
    try {
      await unlink(bakPath)
      bakRemoved = true
    } catch {
      // Windows: the .bak is the running process image — EPERM is expected.
      // gc sweeps same-dir .bak-* later.
    }
  }

  return {
    status: 'updated',
    from: deps.currentVersion,
    to: targetVersion ?? '(unknown)',
    bakPath,
    bakRemoved,
    backupDir,
  }
}

// ── real deps (impure; update.ts wires these) ─────────────────────────────

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const ac = new AbortController()
  const timer = setTimeout(() => ac.abort(), timeoutMs)
  try {
    return await fetch(url, {
      signal: ac.signal,
      headers: { 'user-agent': `harnessed/${pkg.version}` },
    })
  } finally {
    clearTimeout(timer)
  }
}

/** GitHub releases/latest → ReleaseInfo for THIS platform's asset (or an
 *  actionable {error} when the asset/sha is missing — OV2), null when
 *  unreachable. */
export async function resolveLatestRelease(
  platform: string = process.platform,
  arch: string = process.arch,
): Promise<ReleaseInfo | { error: string } | null> {
  try {
    const res = await fetchWithTimeout(RELEASES_LATEST_URL, 10_000)
    if (!res.ok) return null
    const body = (await res.json()) as {
      tag_name?: string
      assets?: { name?: string; browser_download_url?: string }[]
    }
    const version = (body.tag_name ?? '').replace(/^v/, '')
    if (!/^\d+\.\d+\.\d+/.test(version)) return null
    const asset = assetNameFor(platform, arch)
    const found = body.assets?.find((a) => a.name === asset)
    const sha = body.assets?.find((a) => a.name === `${asset}.sha256`)
    if (!found?.browser_download_url) {
      return { error: `asset ${asset} not found on release v${version}` }
    }
    if (!sha?.browser_download_url) {
      return { error: `asset ${asset}.sha256 not found on release v${version}` }
    }
    return { version, assetUrl: found.browser_download_url, shaUrl: sha.browser_download_url }
  } catch {
    return null
  }
}

/** Production deps for update.ts. stateRoot is lazy (detectPlatform is only
 *  touched on the compiled path — same discipline as assetsRoot). */
export function realSelfUpdateDeps(): SelfUpdateDeps {
  return {
    execPath: process.execPath,
    platform: process.platform,
    arch: process.arch,
    currentVersion: pkg.version,
    sourceDir: process.env.HARNESSED_UPDATE_SOURCE_DIR?.trim() || null,
    resolveRelease: () => resolveLatestRelease(),
    downloadTo: async (url, dest) => {
      const res = await fetchWithTimeout(url, 120_000)
      if (!res.ok) throw new Error(`HTTP ${res.status} downloading ${url}`)
      const buf = Buffer.from(await res.arrayBuffer())
      await writeFile(dest, buf)
    },
    fetchShaText: async (url) => {
      const res = await fetchWithTimeout(url, 30_000)
      if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`)
      return res.text()
    },
    smoke: async (bin) => {
      const { execFile } = await import('node:child_process')
      const { promisify } = await import('node:util')
      const { stdout } = await promisify(execFile)(bin, ['--version'], {
        timeout: 30_000,
        windowsHide: true,
      })
      return stdout
    },
    // Lazy thunk — detectPlatform() only runs when the compiled path actually
    // reaches the bin-backup step (assetsRoot.ts:31-33 discipline).
    stateRoot: () => detectPlatform().stateRoot,
    log: (l) => console.warn(l),
    pid: process.pid,
  }
}

/** Writability probe for the safety valve (dir of the exec must be writable). */
export async function execDirWritable(execPath: string): Promise<boolean> {
  try {
    await access(dirname(execPath), 2 /* W_OK */)
    return true
  } catch {
    return false
  }
}
