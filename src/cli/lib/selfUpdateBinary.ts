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
import { createWriteStream } from 'node:fs'
import {
  access,
  chmod,
  copyFile as fsCopyFile,
  rename as fsRename,
  unlink as fsUnlink,
  mkdir,
  readdir,
  readFile,
} from 'node:fs/promises'
import { basename, dirname, join } from 'node:path'
import { Readable, Transform } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import pkg from '../../../package.json' with { type: 'json' }
import { withHostInstallEnv } from '../../installers/lib/runClaudeArgs.js'
import type { HostInstallContext } from '../../platform/hostInstallContext.js'
import { ensureProxyDispatcher } from './proxyDispatcher.js'
import { verifyShaSignature } from './updateSignature.js'
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
  /** Primary download URL — the `api.github.com` asset endpoint when available
   *  (same host as the metadata hop), else the `browser_download_url`. */
  assetUrl: string
  shaUrl: string
  /** Detached-signature URL. The `.sha256.sig` file is a SEPARATE release asset,
   *  so it has its own id/url — it is NOT `${shaUrl}.sig` (that derivation only
   *  works for the `browser_download_url` shape). */
  sigUrl?: string
  /** Alternate URLs tried when the primary host is unreachable (e.g. a network
   *  partition where `api.github.com` answers but `github.com` does not). */
  assetFallbackUrl?: string
  shaFallbackUrl?: string
  sigFallbackUrl?: string
}

/** Net-layer injection seam (tests inject a fake fetch + instant sleep). */
export interface SelfUpdateNetDeps {
  fetchImpl?: typeof fetch
  sleep?: (ms: number) => Promise<void>
  /** Test seam: shorten the asset stall guard so the failure path is reachable
   *  without waiting the production 120 s budget. */
  stallTimeoutMs?: number
  /** Test seam: shorten the progress cadence so the progress line is reachable
   *  without waiting the production 60 s cadence. */
  progressIntervalMs?: number
}

/**
 * Why the metadata hop failed. The stages are NOT interchangeable for the
 * user: a timeout needs patience (or a proxy), a bad HTTP status needs the
 * release looked at, and a missing asset is a publish-window fact. Before
 * this split every failure printed the same "could not reach GitHub" line,
 * which pointed the maintainer at the network for a slow link (2026-11-03).
 *
 * `kind` is optional: an injected `{ error }` without a kind means the
 * original "asset missing on the release" case, which is the ONLY one that
 * may carry the "may still be publishing" hint.
 */
export type ReleaseResolveFailureKind = 'network' | 'timeout' | 'http' | 'parse' | 'publishing'

export interface ReleaseResolveFailure {
  /** Human-readable, already stage-specific. */
  error: string
  kind?: ReleaseResolveFailureKind
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
   *  (missing platform asset — publish window / failed matrix job; the
   *  `kind` says WHICH stage failed, so the caller can pick the right remedy). */
  resolveRelease: () => Promise<ReleaseInfo | ReleaseResolveFailure | null>
  downloadTo: (url: string, dest: string, fallbackUrl?: string) => Promise<void>
  fetchShaText: (url: string, fallbackUrl?: string) => Promise<string>
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
  /** #12 test seam — release signing public key override (default: the
   *  embedded HARNESSED_RELEASE_PUBKEY_PEM). */
  publicKeyPem?: string
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

/**
 * Issue #34 — a bare "socket connection was closed" tells the user nothing
 * actionable. Name the resolved version, the URL that was tried, and the two
 * ways out that do not depend on GitHub being reachable.
 */
function downloadFailureMessage(
  error: unknown,
  version: string | null,
  url: string | null,
): string {
  const detail = error instanceof Error ? error.message : String(error)
  const target = version ? ` for release v${version}` : ''
  return (
    `download failed${target}${url ? ` (tried ${url})` : ''}: ${detail} — ` +
    `the original binary was left untouched; if the network blocks GitHub, use the npm channel ` +
    `(\`npm i -g harnessed@latest\`) or a local build via \`HARNESSED_UPDATE_SOURCE_DIR=<dir> harnessed update\``
  )
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
  opts: { dryRun?: boolean; check?: boolean; retainBackupForContinuation?: boolean },
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
  let sigUrl: string | null = null
  let assetFallbackUrl: string | undefined
  let shaFallbackUrl: string | undefined
  let sigFallbackUrl: string | undefined
  let sourceAsset: string | null = null
  let sourceSha: string | null = null
  if (deps.sourceDir) {
    sourceAsset = join(deps.sourceDir, asset)
    sourceSha = join(deps.sourceDir, `${asset}.sha256`)
    if (opts.check) {
      try {
        const version = (await deps.smoke(sourceAsset)).trim()
        if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(version)) {
          throw new Error(`--version smoke returned unexpected output: ${version.slice(0, 80)}`)
        }
        return {
          status: 'checked',
          installed: deps.currentVersion,
          latest: version,
          cmp: compareVersions(deps.currentVersion, version),
        }
      } catch (e) {
        return {
          status: 'error',
          message: `could not check the local binary version: ${(e as Error).message}`,
        }
      }
    }
  } else {
    const rel = await deps.resolveRelease()
    if (rel === null) {
      return {
        status: 'error',
        message:
          'could not resolve the latest release from GitHub (no release information returned) — ' +
          'use the npm channel (`npm i -g harnessed@latest`), or point ' +
          '`HARNESSED_UPDATE_SOURCE_DIR=<dir>` at a local build and re-run `harnessed update`',
      }
    }
    if ('error' in rel) {
      // OV2: actionable error, original untouched, NO fallback to older releases.
      // The "may still be publishing" hint belongs to the ASSET-missing case
      // ONLY — attaching it to a timeout is what misled the maintainer into
      // blaming the publish window for a slow link (2026-11-03).
      const publishing = rel.kind === undefined || rel.kind === 'publishing'
      const remedy = publishing
        ? 'the release may still be publishing (retry in a few minutes) or use the npm channel (`npm i -g harnessed@latest`)'
        : 'the original binary was left untouched; use the npm channel (`npm i -g harnessed@latest`) or point `HARNESSED_UPDATE_SOURCE_DIR=<dir>` at a local build and re-run `harnessed update`'
      return { status: 'error', message: `${rel.error} — ${remedy}` }
    }
    targetVersion = rel.version
    assetUrl = rel.assetUrl
    shaUrl = rel.shaUrl
    sigUrl = rel.sigUrl ?? null
    assetFallbackUrl = rel.assetFallbackUrl
    shaFallbackUrl = rel.shaFallbackUrl
    sigFallbackUrl = rel.sigFallbackUrl
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
      ...(deps.sourceDir
        ? []
        : ['verify the ed25519 signature (.sha256.sig) against the embedded release public key']),
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
      await deps.downloadTo(assetUrl, tempPath, assetFallbackUrl)
    }
  } catch (e) {
    await unlink(tempPath).catch(() => {})
    return { status: 'error', message: downloadFailureMessage(e, targetVersion, assetUrl) }
  }

  // ── integrity (contractual — a missing .sha256 is a hard error). #12: in
  // GitHub mode the sha256 is same-origin with the asset (both live on the
  // release), so it only guards transport corruption; the ed25519 signature
  // over the .sha256 text (signed in CI, verified against the embedded public
  // key) is the cross-origin second factor, contractual since 4.32.19. The
  // sourceDir rehearsal seam is LOCAL TRUST (like rollback's bin-backup) and
  // skips the signature — the release channel is the attack surface, not a
  // local dir the operator staged. ──
  try {
    const shaText = deps.sourceDir
      ? await readFile(sourceSha ?? '', 'utf8')
      : await deps.fetchShaText(shaUrl ?? '', shaFallbackUrl)
    const expected = parseShaText(shaText)
    if (!expected) throw new Error(`malformed .sha256 content`)
    const actual = await sha256File(tempPath)
    if (actual !== expected) {
      throw new Error(
        `sha256 mismatch — expected ${expected.slice(0, 12)}…, got ${actual.slice(0, 12)}…`,
      )
    }
    if (!deps.sourceDir) {
      // The `.sha256.sig` is a SEPARATE release asset — resolved as its own
      // entry (with its own api id) rather than by suffixing the checksum URL.
      const sigText = await deps
        .fetchShaText(sigUrl ?? `${shaUrl ?? ''}.sig`, sigFallbackUrl)
        .catch(() => {
          throw new Error(`missing .sha256.sig (signature is contractual since 4.32.19)`)
        })
      if (!verifyShaSignature(shaText, sigText, deps.publicKeyPem)) {
        throw new Error(
          `ed25519 signature over .sha256 did not verify — the release assets may be tampered`,
        )
      }
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
    if (targetVersion !== null && out !== targetVersion) {
      throw new Error(`--version mismatch: expected ${targetVersion}, got ${out.slice(0, 80)}`)
    }
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
  if (copied && !opts.retainBackupForContinuation) {
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

export async function finalizeBinarySelfUpdate(
  deps: SelfUpdateDeps,
  outcome: Extract<SelfUpdateOutcome, { status: 'updated' }>,
): Promise<boolean> {
  if (outcome.bakRemoved || outcome.backupDir === null) return outcome.bakRemoved
  const unlink = deps.fsOps?.unlink ?? fsUnlink
  try {
    await unlink(outcome.bakPath)
    outcome.bakRemoved = true
    return true
  } catch {
    return false
  }
}

// ── TODOS 3 (4.32.20) — `harnessed update --rollback` ─────────────────────

export type RollbackOutcome =
  | { status: 'rolled-back'; from: string; to: string; backupUsed: string }
  | { status: 'refused'; reason: string }
  | { status: 'error'; message: string }

/** Restore a previous binary from `<stateRoot>/bin-backup/<ver>/<asset>` via the
 *  SAME same-dir rename dance as the update swap. `version` picks an exact
 *  backup; absent → the highest banked version. Local trust: the backup was
 *  integrity-verified when it was installed — `--version` smoke only (backups
 *  carry no .sha256/.sig). The replaced binary is banked under the CURRENT
 *  version first, so a rollback is itself reversible. */
export async function runBinaryRollback(
  deps: SelfUpdateDeps,
  opts: { version?: string },
): Promise<RollbackOutcome> {
  const rename = deps.fsOps?.rename ?? fsRename
  const copyFile = deps.fsOps?.copyFile ?? fsCopyFile
  const unlink = deps.fsOps?.unlink ?? fsUnlink

  if (normalized(deps.execPath).includes('/node_modules/')) {
    return { status: 'refused', reason: 'binary lives under node_modules (npm-managed)' }
  }

  const asset = assetNameFor(deps.platform, deps.arch)
  const backupsRoot = join(deps.stateRoot(), 'bin-backup')
  let versions: string[] = []
  try {
    const entries = await readdir(backupsRoot, { withFileTypes: true })
    for (const e of entries) {
      if (!e.isDirectory()) continue
      const has = await access(join(backupsRoot, e.name, asset)).then(
        () => true,
        () => false,
      )
      if (has) versions.push(e.name)
    }
  } catch {
    versions = []
  }
  if (versions.length === 0) {
    return {
      status: 'error',
      message: `no rollback candidates — ${backupsRoot} holds no banked ${asset}`,
    }
  }

  let target: string
  if (opts.version) {
    if (!versions.includes(opts.version)) {
      return {
        status: 'error',
        message: `no backup for version ${opts.version} — available: ${versions.sort().join(', ')}`,
      }
    }
    target = opts.version
  } else {
    // highest banked semver = the most recent pre-update image
    target = versions.reduce((a, b) => (compareVersions(a, b) === 'behind' ? b : a))
  }
  const backupBin = join(backupsRoot, target, asset)

  const execDir = dirname(deps.execPath)
  const execBase = basename(deps.execPath)
  const ext = deps.platform === 'win32' ? '.exe' : ''
  const tempPath = join(execDir, `.harnessed-rollback-${deps.pid}${ext}`)
  const bakPath = join(execDir, `${execBase}.bak-${deps.currentVersion}`)

  // ── stage + smoke (any failure: original untouched) ──
  try {
    await fsCopyFile(backupBin, tempPath)
    if (deps.platform !== 'win32') await chmod(tempPath, 0o755)
    const out = (await deps.smoke(tempPath)).trim()
    if (!/^\d+\.\d+\.\d+/.test(out)) {
      throw new Error(`--version smoke returned unexpected output: ${out.slice(0, 80)}`)
    }
  } catch (e) {
    await unlink(tempPath).catch(() => {})
    return {
      status: 'error',
      message: `rollback staging failed: ${(e as Error).message} — original binary untouched`,
    }
  }

  // ── swap (same dance as the update path; failed temp→exec restores .bak) ──
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
        message: `swap failed (${(e as Error).message}) — restored the previous binary`,
      }
    } catch (rb) {
      return {
        status: 'error',
        message:
          `CRITICAL: swap failed AND restore failed (${(rb as Error).message}). ` +
          `Restore manually: copy "${bakPath}" "${deps.execPath}"`,
      }
    }
  }

  // ── bank the replaced binary under the CURRENT version (reversible), then
  // delete the .bak fail-soft (Windows: running image → EPERM expected) ──
  let copied = false
  try {
    const dir = join(backupsRoot, deps.currentVersion)
    await mkdir(dir, { recursive: true })
    await copyFile(bakPath, join(dir, execBase))
    copied = true
  } catch (e) {
    deps.log(
      `warning: could not bank the replaced binary (${(e as Error).message}) — keeping ${bakPath}`,
    )
  }
  if (copied) await unlink(bakPath).catch(() => {})

  return { status: 'rolled-back', from: deps.currentVersion, to: target, backupUsed: backupBin }
}

// ── real deps (impure; update.ts wires these) ─────────────────────────────

/**
 * The releases/latest hop asks for ONE small JSON document. The maintainer's
 * link measured ~157 KB/s end-to-end on 2026-11-03 and the old 10 s budget
 * turned a slow-but-working link into a false "GitHub unreachable" verdict.
 * 30 s leaves room for a slow TLS handshake + RTT without turning a dead
 * socket into a long wait.
 */
const RELEASE_METADATA_TIMEOUT_MS = 30_000

/**
 * The asset hop's HEADER budget. The BODY is deliberately NOT covered by it:
 * the header timer is cleared once the response resolves, so a body that
 * stops mid-transfer used to hang forever. The body gets its own stall guard
 * (ASSET_STALL_TIMEOUT_MS) instead.
 */
const ASSET_HEADERS_TIMEOUT_MS = 120_000

/** The `.sha256` / `.sha256.sig` text hops are tiny; 30 s is generous. */
const CHECKSUM_TIMEOUT_MS = 30_000

/**
 * Stall guard: abort the transfer when NO chunk arrives for this long. The
 * measured transfer is slow (103,795,200 bytes @ ~157 KB/s ≈ 11 min) but
 * never silent for minutes, so 120 s of silence means the link died — not
 * that it is slow. Without this the old code waited forever.
 */
const ASSET_STALL_TIMEOUT_MS = 120_000

/**
 * Progress cadence for the streamed download. 60 s keeps the measured
 * 11-minute download down to ~11 lines (the ~12-line budget) and still
 * reports well inside the 120 s stall window, so a live transfer always
 * shows progress before the guard can fire.
 */
const ASSET_PROGRESS_INTERVAL_MS = 60_000

/** "The hop ran out of time" — distinct from "the network failed": the
 *  remedy differs (a slow link needs patience, a blocked host needs a proxy). */
class RequestTimeoutError extends Error {}

/** A stalled transfer is a verdict on THIS attempt (the link is dead), not a
 *  transient blip — retrying would only buy another 120 s of silence. */
class TransferStalledError extends Error {}

async function fetchWithTimeout(
  url: string,
  timeoutMs: number,
  net: SelfUpdateNetDeps = {},
  headers: Record<string, string> = {},
  controller?: AbortController,
): Promise<Response> {
  // 受限网络:Node 默认**忽略** HTTP_PROXY(实测 2026-10-14,见 proxyDispatcher.ts 的表),
  // 所以在第一次出网前把 EnvHttpProxyAgent 装成全局 dispatcher。幂等、fail-soft,
  // 编译二进制(bun 原生认代理)那条会自己 return,不做任何事。
  // 装在这里是因为本函数是**本模块**唯一的出网收口点 —— 新增下载路径自动继承。
  // 全功能共三处出网:本处、`update-check-cache.ts` 的 GitHub API(同样已接),
  // 以及 npm 版本检查 —— 那条走子进程 `npm view`,代理由 npm 自己处理,不经这里。
  await ensureProxyDispatcher()
  const doFetch = net.fetchImpl ?? fetch
  // The caller may own the controller: the asset path needs to abort the
  // BODY mid-transfer (stall guard), which a controller created here could
  // not reach — the header timer below is cleared as soon as the response
  // resolves.
  const ac = controller ?? new AbortController()
  const timer = setTimeout(() => {
    ac.abort(new RequestTimeoutError(`the request to ${url} timed out after ${timeoutMs} ms`))
  }, timeoutMs)
  try {
    return await doFetch(url, {
      signal: ac.signal,
      headers: { 'user-agent': `harnessed/${pkg.version}`, ...headers },
      // GitHub's asset endpoint answers 302 → release-assets.githubusercontent.com
      // only when the Accept header asks for the raw bytes; without it the API
      // returns asset METADATA JSON instead of the file.
      redirect: 'follow',
    })
  } finally {
    clearTimeout(timer)
  }
}

/** Transient network failures worth one more attempt (issue #34). A reset
 *  connection or a closed socket is not a verdict on the release. */
function isTransientNetworkError(error: unknown): boolean {
  const code = (error as NodeJS.ErrnoException | undefined)?.code
  if (code && ['ECONNRESET', 'ECONNREFUSED', 'ETIMEDOUT', 'EPIPE', 'EAI_AGAIN'].includes(code)) {
    return true
  }
  const message = error instanceof Error ? error.message : String(error)
  return /socket connection was closed|ECONNRESET|ETIMEDOUT|network|terminated|fetch failed/i.test(
    message,
  )
}

const DOWNLOAD_ATTEMPTS = 3

/**
 * Fetch with exponential backoff, then try the fallback URL when the primary
 * host is unreachable. `label` names the artifact in the thrown error so the
 * caller can report which URL failed. `consume` receives the response AND the
 * controller of this attempt, so a consumer that reads the body can abort
 * THIS attempt (the asset path's stall guard) without touching the others.
 */
async function fetchAsset<T>(
  url: string,
  fallbackUrl: string | undefined,
  timeoutMs: number,
  net: SelfUpdateNetDeps,
  label: string,
  consume: (res: Response, attempt: AbortController) => Promise<T>,
): Promise<T> {
  const sleep = net.sleep ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)))
  const attempts: string[] = []
  let lastError: unknown
  for (const candidate of [url, fallbackUrl].filter((u): u is string => !!u)) {
    for (let attempt = 1; attempt <= DOWNLOAD_ATTEMPTS; attempt++) {
      // One controller per attempt: the header timeout AND the body stall
      // guard abort THIS attempt only.
      const ac = new AbortController()
      try {
        const res = await fetchWithTimeout(
          candidate,
          timeoutMs,
          net,
          {
            accept: 'application/octet-stream',
          },
          ac,
        )
        if (!res.ok) {
          lastError = new Error(`HTTP ${res.status} downloading ${candidate}`)
          // 4xx is a verdict (asset gone) — retrying it is pointless.
          if (res.status < 500) break
        } else {
          return await consume(res, ac)
        }
      } catch (error) {
        // A stalled transfer is a verdict, not a blip: surface it verbatim so
        // the byte/rate evidence survives the generic wrapper.
        if (error instanceof TransferStalledError) throw error
        lastError = error
        if (!isTransientNetworkError(error)) break
      }
      attempts.push(candidate)
      if (attempt < DOWNLOAD_ATTEMPTS) await sleep(250 * attempt)
    }
  }
  throw new Error(
    `${label} download failed (${attempts.length} attempt(s) over ${[url, fallbackUrl]
      .filter(Boolean)
      .join(', ')}): ${lastError instanceof Error ? lastError.message : String(lastError)}`,
  )
}

function formatBytes(n: number): string {
  if (n >= 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`
  if (n >= 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${n} B`
}

function formatRate(received: number, elapsedMs: number): string {
  if (received <= 0 || elapsedMs <= 0) return '0 KB/s'
  return `${(received / 1024 / (elapsedMs / 1000)).toFixed(1)} KB/s`
}

/** The evidence a slow link needs: how much arrived, how long it took, and
 *  the average rate — so "slow link" reads as slow link, not as "broken". */
function transferStats(received: number, elapsedMs: number): string {
  const seconds = (elapsedMs / 1000).toFixed(1)
  const rate = received > 0 ? `, ${formatRate(received, elapsedMs)} average` : ''
  return `${received} bytes received in ${seconds} s${rate}`
}

/**
 * Stream the release asset to `dest`.
 *
 * Why streamed: the windows asset is 103,795,200 bytes (measured 2026-11-03)
 * and the old implementation buffered it whole with `res.arrayBuffer()` — the
 * entire asset sat in RAM and the temp file did not exist until the transfer
 * ended, so an 11-minute download looked exactly like a hang. Streaming keeps
 * memory flat and puts the temp file on disk while the bytes arrive.
 *
 * The stall guard aborts the transfer when no chunk arrives for
 * `stallTimeoutMs`; the header timeout never covered the body.
 */
async function streamAssetToFile(
  res: Response,
  dest: string,
  ac: AbortController,
  stallTimeoutMs: number,
  progressIntervalMs: number,
  log: (line: string) => void,
): Promise<void> {
  if (!res.body) throw new Error('the release asset response carried no body')
  const started = Date.now()
  let received = 0
  let lastProgressAt = started
  let stalled = false
  let stallTimer: NodeJS.Timeout | undefined

  const resetStall = () => {
    if (stallTimer) clearTimeout(stallTimer)
    stallTimer = setTimeout(() => {
      stalled = true
      ac.abort(
        new TransferStalledError(`no data received for ${Math.round(stallTimeoutMs / 1000)} s`),
      )
    }, stallTimeoutMs)
  }

  const meter = new Transform({
    transform(chunk: Buffer, _encoding, callback) {
      received += chunk.length
      const now = Date.now()
      if (now - lastProgressAt >= progressIntervalMs) {
        lastProgressAt = now
        log(`downloading ${formatBytes(received)} (${formatRate(received, now - started)})`)
      }
      resetStall()
      callback(null, chunk)
    },
  })

  resetStall()
  try {
    await pipeline(
      // undici types the body as a DOM-ish ReadableStream; node:stream/web's
      // class is the one Readable.fromWeb accepts.
      Readable.fromWeb(res.body as unknown as import('node:stream/web').ReadableStream<Uint8Array>),
      meter,
      // flags 'w' truncates: a retried attempt must not append to the bytes
      // a previous attempt already wrote.
      createWriteStream(dest),
      { signal: ac.signal },
    )
  } catch (e) {
    if (stalled) {
      throw new TransferStalledError(
        `the download stalled — no data for ${Math.round(stallTimeoutMs / 1000)} s ` +
          `(${transferStats(received, Date.now() - started)})`,
      )
    }
    throw e
  } finally {
    if (stallTimer) clearTimeout(stallTimer)
  }
}

/** GitHub releases/latest → ReleaseInfo for THIS platform's asset.
 *
 *  Failures are STAGE-SPECIFIC ({error, kind}): a timed-out/failed request, a
 *  non-OK HTTP status, an unparseable body, and a missing asset are four
 *  different user stories and used to collapse into one "could not reach
 *  GitHub" line (2026-11-03). `null` is only returned when a caller injected
 *  a resolver that had nothing to say.
 *
 *  #34 — the API asset endpoint (`asset.url`, `api.github.com/repos/.../releases/assets/{id}`)
 *  is the PRIMARY download form: same host as the metadata hop, and it 302s to
 *  `release-assets.githubusercontent.com`. The `browser_download_url` form points at
 *  `github.com` — a DIFFERENT host with a different CDN, unreachable in some
 *  network partitions (China mainland: api.github.com answers, github.com:443
 *  times out). So: primary = api endpoint, fallback = browser url.
 *
 *  The `.sha256.sig` is a SEPARATE release asset with its own id — deriving it as
 *  `${shaUrl}.sig` is only correct for the `browser_download_url` shape, so it is
 *  resolved as its own asset entry here. */
export async function resolveLatestRelease(
  platform: string = process.platform,
  arch: string = process.arch,
  net: SelfUpdateNetDeps = {},
): Promise<ReleaseInfo | ReleaseResolveFailure | null> {
  let res: Response
  try {
    res = await fetchWithTimeout(RELEASES_LATEST_URL, RELEASE_METADATA_TIMEOUT_MS, net)
  } catch (e) {
    const budget = `${RELEASE_METADATA_TIMEOUT_MS / 1000} s timeout budget`
    return {
      error:
        e instanceof RequestTimeoutError
          ? `the request to the GitHub releases API timed out (${budget})`
          : `the request to the GitHub releases API failed or timed out (${budget}): ${e instanceof Error ? e.message : String(e)}`,
      kind: e instanceof RequestTimeoutError ? 'timeout' : 'network',
    }
  }
  if (!res.ok) {
    return { error: `the GitHub releases API returned HTTP ${res.status}`, kind: 'http' }
  }
  let body: {
    tag_name?: string
    assets?: { name?: string; url?: string; browser_download_url?: string }[]
  }
  try {
    body = (await res.json()) as typeof body
  } catch (e) {
    return {
      error: `the GitHub releases API response could not be parsed: ${e instanceof Error ? e.message : String(e)}`,
      kind: 'parse',
    }
  }
  const version = (body.tag_name ?? '').replace(/^v/, '')
  if (!/^\d+\.\d+\.\d+/.test(version)) {
    return {
      error: `the GitHub releases API response could not be parsed: unexpected tag_name "${body.tag_name ?? ''}"`,
      kind: 'parse',
    }
  }
  const asset = assetNameFor(platform, arch)
  const pick = (name: string) => body.assets?.find((a) => a.name === name)
  const found = pick(asset)
  const sha = pick(`${asset}.sha256`)
  const sig = pick(`${asset}.sha256.sig`)
  if (!found?.browser_download_url && !found?.url) {
    return { error: `asset ${asset} not found on release v${version}`, kind: 'publishing' }
  }
  if (!sha?.browser_download_url && !sha?.url) {
    return { error: `asset ${asset}.sha256 not found on release v${version}`, kind: 'publishing' }
  }
  // Primary = api endpoint when the release exposes one; the browser url
  // becomes the fallback (and vice versa when the api url is absent).
  const pair = (a: { url?: string; browser_download_url?: string } | undefined) => {
    const api = a?.url
    const browser = a?.browser_download_url
    return api && browser
      ? { primary: api, fallback: browser }
      : { primary: api ?? browser ?? '', fallback: undefined }
  }
  const assetPair = pair(found)
  const shaPair = pair(sha)
  const sigPair = pair(sig)
  return {
    version,
    assetUrl: assetPair.primary,
    shaUrl: shaPair.primary,
    sigUrl: sigPair.primary || undefined,
    assetFallbackUrl: assetPair.fallback,
    shaFallbackUrl: shaPair.fallback,
    sigFallbackUrl: sigPair.fallback,
  }
}

export function realSelfUpdateDeps(
  context: HostInstallContext,
  net: SelfUpdateNetDeps = {},
): SelfUpdateDeps {
  const log = (line: string) => console.warn(line)
  const stallTimeoutMs = net.stallTimeoutMs ?? ASSET_STALL_TIMEOUT_MS
  const progressIntervalMs = net.progressIntervalMs ?? ASSET_PROGRESS_INTERVAL_MS
  return {
    execPath: process.execPath,
    platform: process.platform,
    arch: process.arch,
    currentVersion: pkg.version,
    sourceDir: process.env.HARNESSED_UPDATE_SOURCE_DIR?.trim() || null,
    resolveRelease: () => resolveLatestRelease(process.platform, process.arch, net),
    downloadTo: async (url, dest, fallbackUrl) => {
      // Streamed, not buffered: a ~99 MB asset buffered whole sat in RAM and
      // left no temp file on disk until the transfer ended, so an 11-minute
      // download on a ~157 KB/s link looked like a hang (2026-11-03).
      await fetchAsset(url, fallbackUrl, ASSET_HEADERS_TIMEOUT_MS, net, 'binary', (res, attempt) =>
        streamAssetToFile(res, dest, attempt, stallTimeoutMs, progressIntervalMs, log),
      )
    },
    fetchShaText: async (url, fallbackUrl) => {
      return fetchAsset(url, fallbackUrl, CHECKSUM_TIMEOUT_MS, net, 'checksum', (res) => res.text())
    },
    smoke: async (bin) => {
      const { execFile } = await import('node:child_process')
      const { promisify } = await import('node:util')
      const { stdout } = await promisify(execFile)(bin, ['--version'], {
        timeout: 30_000,
        windowsHide: true,
        shell: false,
        env: withHostInstallEnv(process.env, context),
      })
      return stdout
    },
    stateRoot: () => context.platform.stateRoot,
    log,
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
