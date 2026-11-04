// 4.27.0 (B3 Slice 1, T2) — compiled-binary self-update engine for
// `harnessed update`. Spec SoT: CEO plan 2026-07-12-b5-phase3-slice1.md.
//
// Atomic sequence (any pre-swap failure leaves the original untouched; a
// failed temp→exec rename rolls back from the .bak; there is never a
// "no binary at exec path" window):
//   resolve latest (GitHub releases/latest OR HARNESSED_UPDATE_SOURCE_DIR
//   rehearsal seam — the seam skips the version compare: forced) →
//   download into a same-dir RESUME FRAGMENT
//   (`.harnessed-update-<version>.part` — version-stable, NO pid, so a later
//   process can continue a dropped ~99 MB transfer instead of restarting it)
//   → sha256 verify against the per-asset `<asset>.sha256` (frozen public
//   contract, publish.yml matrix uploads) → rename the verified fragment to
//   the version-stable staging file `.harnessed-update-<version><ext>` (the
//   .exe suffix on win32 is what the smoke step can spawn) → chmod 755
//   (unix) → `--version` smoke → in-place rename exec →
//   `<exec>.bak-<oldver>` (same volume — cross-volume move of a running exe
//   dies on the file lock) → staging → exec → COPY (not move) the .bak to
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
  stat,
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
  /** Download the asset into `dest`. `dest` doubles as the RESUME FRAGMENT:
   *  whatever is already on disk is the resume point (the Range request asks
   *  for the remainder). The rehearsal seam never goes through here. */
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
  /** `critical` marks the ONE failure that leaves no binary at the exec path
   *  (the swap failed AND the rollback failed). The caller (the auto-update
   *  orchestration) must not treat it as an ordinary failure: it has to
   *  record it as CRITICAL, print the restore command and turn the consent
   *  off. Every other error leaves the original binary intact. */
  | { status: 'error'; message: string; critical?: boolean }

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
  // pid-unique + .exe suffix (win32 spawn) — the REHEARSAL SEAM's staging
  // file (a local copy is disposable, so it needs no version-stable name).
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

  // ── the two version-stable paths ──
  // Version-stable and PID-free on purpose: a LATER process must be able to
  // continue a dropped download (the measured link needs ~11 min for the
  // windows asset — restarting from zero is the expensive mistake). Two runs
  // for the SAME version are serialized by the update lock, not by these
  // names.
  // The rehearsal seam (sourceDir) bypasses both: a local copy has nothing to
  // resume and nothing to keep.
  const partPath = deps.sourceDir
    ? null
    : join(execDir, `.harnessed-update-${targetVersion ?? 'unknown'}.part`)
  // What the integrity check runs on: the fragment (GitHub) or the seam's copy.
  const verifyPath = partPath ?? tempPath
  // What the smoke step spawns and the swap moves. Version-stable (NOT
  // pid-scoped) so a smoke failure can rename it BACK to the fragment and the
  // bytes survive for the next attempt. The seam keeps the pid-scoped temp.
  const stagingPath = deps.sourceDir
    ? tempPath
    : join(execDir, `.harnessed-update-${targetVersion ?? 'unknown'}${ext}`)

  // ── dry-run: zero writes, human-readable step preview ──
  if (opts.dryRun) {
    const backupDir = 'bin-backup/<oldver>/ under the harnessed state root'
    const steps = [
      deps.sourceDir
        ? `copy ${sourceAsset} → ${stagingPath} (local source dir — rehearsal seam)`
        : `download ${assetUrl ?? `latest ${asset}`} → ${partPath} (resumable fragment)`,
      `verify sha256 against ${deps.sourceDir ? sourceSha : (shaUrl ?? `${asset}.sha256`)}`,
      ...(deps.sourceDir
        ? []
        : ['verify the ed25519 signature (.sha256.sig) against the embedded release public key']),
      ...(deps.platform === 'win32' ? [] : ['chmod 755 the downloaded binary']),
      'smoke: spawn `--version` on the new binary',
      `rename ${deps.execPath} → ${bakPath} (same-dir, same-volume)`,
      `rename ${stagingPath} → ${deps.execPath}`,
      `copy the .bak to ${backupDir} (rollback net)`,
      'delete the .bak (fail-soft — kept on Windows EPERM or when the backup copy failed)',
    ]
    return { status: 'dry-run', steps }
  }

  // ── fetch to the resume fragment (GitHub) / to the temp file (seam) ──
  try {
    if (deps.sourceDir && sourceAsset) {
      await fsCopyFile(sourceAsset, tempPath)
    } else if (assetUrl && partPath) {
      await deps.downloadTo(assetUrl, partPath, assetFallbackUrl)
    }
  } catch (e) {
    // A dropped transfer KEEPS the fragment: the bytes that did arrive are
    // the resume point for the next attempt. The rehearsal seam's copy is a
    // disposable local file → remove it.
    if (!partPath) await unlink(tempPath).catch(() => {})
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
  // The check runs ON the fragment — the file that will become the binary.
  try {
    const shaText = deps.sourceDir
      ? await readFile(sourceSha ?? '', 'utf8')
      : await deps.fetchShaText(shaUrl ?? '', shaFallbackUrl)
    const expected = parseShaText(shaText)
    if (!expected) throw new Error(`malformed .sha256 content`)
    const actual = await sha256File(verifyPath)
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
    // An integrity failure means the fragment is worthless → delete it.
    await unlink(verifyPath).catch(() => {})
    return {
      status: 'error',
      message: `integrity verification failed: ${(e as Error).message} — aborted; original binary untouched`,
    }
  }

  // ── stage: the verified fragment becomes the file the smoke step spawns ──
  if (partPath) {
    try {
      // win32's rename does NOT overwrite an existing target → drop the stale
      // staging file first (the fragment is the source, nothing is lost).
      await unlink(stagingPath).catch(() => {})
      await rename(partPath, stagingPath)
    } catch (e) {
      // KEEP the fragment: it is verified → the next attempt can go straight
      // to the smoke instead of re-downloading 99 MB.
      return {
        status: 'error',
        message:
          `could not stage the verified download: ${(e as Error).message} — ` +
          `the download was kept for the next attempt; original binary untouched`,
      }
    }
  }

  // ── chmod + smoke ──
  let smokeRan = false
  try {
    if (deps.platform !== 'win32') await chmod(stagingPath, 0o755)
    const out = (await deps.smoke(stagingPath)).trim()
    smokeRan = true
    const m = /^(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)/.exec(out)
    if (!m) throw new Error(`--version smoke returned unexpected output: ${out.slice(0, 80)}`)
    if (targetVersion !== null && out !== targetVersion) {
      throw new Error(`--version mismatch: expected ${targetVersion}, got ${out.slice(0, 80)}`)
    }
    targetVersion = targetVersion ?? m[1] ?? null
  } catch (e) {
    // A smoke failure KEEPS the bytes when the binary could not even RUN (an
    // environment problem): rename the staging file back to the fragment so
    // the next attempt re-verifies and re-smokes it without touching the
    // network. A binary that RAN and reported another version is the WRONG
    // asset → discard it (keeping it would fail the next attempt the same
    // way).
    if (partPath && !smokeRan) {
      await rename(stagingPath, partPath).catch(() => {})
    } else {
      await unlink(stagingPath).catch(() => {})
    }
    return {
      status: 'error',
      message: `new binary failed the --version smoke: ${(e as Error).message} — aborted; original binary untouched`,
    }
  }

  // ── swap: exec → .bak, staging → exec (rollback on failure) ──
  try {
    await rename(deps.execPath, bakPath)
  } catch (e) {
    // A rename failure KEEPS the fragment for the next attempt.
    if (partPath) await rename(stagingPath, partPath).catch(() => {})
    else await unlink(stagingPath).catch(() => {})
    return {
      status: 'error',
      message: `could not move the current binary aside: ${(e as Error).message} — original untouched`,
    }
  }
  try {
    await rename(stagingPath, deps.execPath)
  } catch (e) {
    try {
      await rename(bakPath, deps.execPath)
      if (partPath) await rename(stagingPath, partPath).catch(() => {})
      else await unlink(stagingPath).catch(() => {})
      return {
        status: 'error',
        message: `swap failed (${(e as Error).message}) — rolled back to the previous binary`,
      }
    } catch (rb) {
      if (partPath) await rename(stagingPath, partPath).catch(() => {})
      return {
        status: 'error',
        critical: true,
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
 *  transient blip — but the bytes that did arrive stay on disk, so the next
 *  attempt resumes from there. */
class TransferStalledError extends Error {}

/** The server answered 206 but its Content-Range start is NOT the offset we
 *  asked for → the two sides disagree about the asset → the fragment must be
 *  discarded and the download restarted from zero (splicing would corrupt
 *  the file). Distinct from a plain failure: it is retryable-after-reset. */
class RangeMismatchError extends Error {}

/** 416 — our Range start is at (or past) the asset size → the fragment on
 *  disk already IS the whole asset. Not a failure: the download is done. */
class RangeNotSatisfiableError extends Error {
  constructor(readonly total: number | null) {
    super('the requested range is not satisfiable')
  }
}

/** A response header, defensively — test doubles may omit the headers map. */
function headerOf(res: Response, name: string): string | null {
  const headers = (res as { headers?: Headers }).headers
  if (!headers || typeof headers.get !== 'function') return null
  return headers.get(name)
}

/** `bytes 100-199/200` → {start: 100, total: 200}; the 416 shape
 *  (`bytes <star>/200`) → {start: null, total: 200}. */
function parseContentRange(
  value: string | null | undefined,
): { start: number | null; total: number | null } | null {
  if (!value) return null
  const text = value.trim()
  const unsat = /^bytes\s+\*\/(\d+|\*)$/i.exec(text)
  if (unsat) return { start: null, total: unsat[1] === '*' ? null : Number(unsat[1]) }
  const m = /^bytes\s+(\d+)-(\d+)\/(\d+|\*)$/i.exec(text)
  if (!m) return null
  return { start: Number(m[1]), total: m[3] === '*' ? null : Number(m[3]) }
}

function numberOrUndefined(value: string | null): number | undefined {
  if (value === null) return undefined
  const n = Number(value)
  return Number.isFinite(n) ? n : undefined
}

/** Byte size of a file, 0 when it does not exist. */
async function fileSize(p: string): Promise<number> {
  try {
    return (await stat(p)).size
  } catch {
    return 0
  }
}

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
 * caller can report which URL failed. `consume` receives the response, the
 * controller of this attempt AND the byte offset the request asked for (the
 * resume point), so a consumer that reads the body can abort THIS attempt
 * (the asset path's stall guard) without touching the others.
 *
 * `extra.existingBytes` is the resume point: the bytes already on disk. It
 * is read ONCE per request and the SAME value is handed to `consume`, so the
 * Range header and the writer can never disagree about where the response
 * starts. A getter (not a number) because the retry loop re-reads it between
 * attempts: the previous attempt may have written bytes before it stalled.
 */
async function fetchAsset<T>(
  url: string,
  fallbackUrl: string | undefined,
  timeoutMs: number,
  net: SelfUpdateNetDeps,
  label: string,
  consume: (res: Response, attempt: AbortController, offset: number) => Promise<T>,
  extra?: {
    /** Extra request headers (merged over the default accept). */
    headers?: Record<string, string>
    /** The byte count already on disk → the Range offset. */
    existingBytes?: number | (() => number | Promise<number>)
  },
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
        const offset =
          extra?.existingBytes === undefined
            ? 0
            : await (typeof extra.existingBytes === 'function'
                ? extra.existingBytes()
                : extra.existingBytes)
        const headers: Record<string, string> = {
          accept: 'application/octet-stream',
          ...extra?.headers,
        }
        // The Range request is what turns a dropped ~99 MB transfer into a
        // resumable one instead of a restart from zero.
        if (offset > 0) headers.range = `bytes=${offset}-`
        const res = await fetchWithTimeout(candidate, timeoutMs, net, headers, ac)
        if (!res.ok) {
          if (res.status === 416) {
            // Our Range start is at (or past) the asset size → the fragment
            // on disk already IS the whole asset. The caller decides.
            throw new RangeNotSatisfiableError(
              parseContentRange(headerOf(res, 'content-range'))?.total ?? null,
            )
          }
          lastError = new Error(`HTTP ${res.status} downloading ${candidate}`)
          // 4xx is a verdict (asset gone) — retrying it is pointless.
          if (res.status < 500) break
        } else {
          return await consume(res, ac, offset)
        }
      } catch (error) {
        // 416 is not a failure — the caller decides (the fragment may be
        // complete already).
        if (error instanceof RangeNotSatisfiableError) throw error
        lastError = error
        // A Range mismatch is retryable-after-reset: the consumer dropped the
        // fragment and reset the offset, so the next attempt asks for the
        // whole asset. A stall is this attempt's verdict, but the bytes that
        // did arrive stay on disk → the next attempt resumes from there.
        const retryable =
          error instanceof RangeMismatchError ||
          error instanceof TransferStalledError ||
          isTransientNetworkError(error)
        if (!retryable) break
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
 *
 * `opts.append` turns `dest` into a RESUME fragment: a 206 answer is
 * appended to the bytes already on disk (flags 'a'), a 200 answer truncates
 * and rewrites them (flags 'w'). `opts.initialBytes` is the byte count that
 * was already there — the SAME value the Range header asked for — so the
 * received counter starts where the file does.
 */
async function streamAssetToFile(
  res: Response,
  dest: string,
  ac: AbortController,
  stallTimeoutMs: number,
  progressIntervalMs: number,
  log: (line: string) => void,
  opts?: {
    /** Append to the fragment instead of truncating it (a 206 answer). */
    append?: boolean
    /** Bytes already on disk → the counter starts here. */
    initialBytes?: number
    /** The asset's full size (Content-Length / Content-Range total). */
    totalBytes?: number
  },
): Promise<void> {
  if (!res.body) throw new Error('the release asset response carried no body')
  const started = Date.now()
  const initialBytes = opts?.initialBytes ?? 0
  let received = initialBytes
  let attemptBytes = 0
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
      attemptBytes += chunk.length
      const now = Date.now()
      if (now - lastProgressAt >= progressIntervalMs) {
        lastProgressAt = now
        const total = opts?.totalBytes
        const totalPart = total ? ` / ${formatBytes(total)}` : ''
        log(
          `downloading ${formatBytes(received)}${totalPart} ` +
            `(${formatRate(attemptBytes, now - started)})`,
        )
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
      // flags 'a' appends (a 206 continues the fragment); 'w' truncates (a
      // 200 rewrites it — a retried attempt must not append to the bytes a
      // previous attempt already wrote).
      createWriteStream(dest, { flags: opts?.append ? 'a' : 'w' }),
      { signal: ac.signal },
    )
  } catch (e) {
    if (stalled) {
      throw new TransferStalledError(
        `the download stalled — no data for ${Math.round(stallTimeoutMs / 1000)} s ` +
          `(${transferStats(attemptBytes, Date.now() - started)})`,
      )
    }
    throw e
  } finally {
    if (stallTimer) clearTimeout(stallTimer)
  }
}

/**
 * Download the release asset into `dest` — the RESUME FRAGMENT.
 *
 * The measured link carries the ~99 MB windows asset at ~157 KB/s (≈11 min),
 * so a dropped transfer must not restart from zero: whatever is already on
 * disk is the resume point (a Range request asks for the remainder).
 *
 * The Range contract:
 *   206 + Content-Range start == the fragment size → APPEND;
 *   206 + a different start → the server's Range semantics differ from ours
 *     → discard the fragment and download the whole asset again (splicing
 *     would corrupt it);
 *   200 → the server ignored the Range → truncate and rewrite;
 *   416 → the fragment already IS the whole asset → the download is done.
 */
async function downloadResumableAsset(
  url: string,
  fallbackUrl: string | undefined,
  dest: string,
  net: SelfUpdateNetDeps,
  log: (line: string) => void,
): Promise<void> {
  const stallTimeoutMs = net.stallTimeoutMs ?? ASSET_STALL_TIMEOUT_MS
  const progressIntervalMs = net.progressIntervalMs ?? ASSET_PROGRESS_INTERVAL_MS

  // The byte count already on disk — the resume point. It is read ONCE per
  // request and the SAME value feeds the Range header AND the writer (append
  // vs truncate + the received counter), so the two can never disagree.
  // `forceFullDownload` is the mismatch reset: the fragment was dropped, so
  // the next attempt asks for the whole asset.
  let forceFullDownload = false
  const offsetOf = async (): Promise<number> => {
    if (forceFullDownload) return 0
    return await fileSize(dest)
  }

  // Round 0 resumes; round 1 is the "the fragment was unusable" restart.
  for (let round = 0; round < 2; round++) {
    try {
      await fetchAsset(
        url,
        fallbackUrl,
        ASSET_HEADERS_TIMEOUT_MS,
        net,
        'binary',
        async (res, attempt, requested) => {
          const range = parseContentRange(headerOf(res, 'content-range'))
          const start = range ? range.start : null
          const totalBytes =
            res.status === 206
              ? (range?.total ?? undefined)
              : numberOrUndefined(headerOf(res, 'content-length'))
          if (res.status === 206) {
            if (start === null || start !== requested) {
              // The server's Range semantics differ from ours → the fragment
              // is unusable: drop it, reset the offset and let the next
              // attempt download the whole asset.
              await fsUnlink(dest).catch(() => {})
              forceFullDownload = true
              throw new RangeMismatchError(
                `the server answered 206 starting at ${start ?? '?'}, not ${requested}`,
              )
            }
            await streamAssetToFile(res, dest, attempt, stallTimeoutMs, progressIntervalMs, log, {
              append: true,
              initialBytes: requested,
              totalBytes,
            })
            return
          }
          // 200 → the server ignored the Range → truncate and rewrite.
          await streamAssetToFile(res, dest, attempt, stallTimeoutMs, progressIntervalMs, log, {
            append: false,
            initialBytes: 0,
            totalBytes,
          })
        },
        { existingBytes: offsetOf },
      )
      return
    } catch (e) {
      if (e instanceof RangeNotSatisfiableError) {
        // 416 → the fragment may already BE the complete asset → the download
        // is finished, verification takes it from here.
        const have = await fileSize(dest)
        if (e.total !== null && e.total === have) return
        // Not complete → drop it and download the whole thing (round 1).
        await fsUnlink(dest).catch(() => {})
        forceFullDownload = true
        continue
      }
      throw e
    }
  }
  throw new Error('the release asset could not be downloaded (the server ignored the resume range)')
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
  return {
    execPath: process.execPath,
    platform: process.platform,
    arch: process.arch,
    currentVersion: pkg.version,
    sourceDir: process.env.HARNESSED_UPDATE_SOURCE_DIR?.trim() || null,
    resolveRelease: () => resolveLatestRelease(process.platform, process.arch, net),
    downloadTo: async (url, dest, fallbackUrl) => {
      // Streamed, not buffered, and RESUMABLE: a ~99 MB asset buffered whole
      // sat in RAM and left no file on disk until the transfer ended, so an
      // 11-minute download on a ~157 KB/s link looked like a hang (2026-11-03).
      // `dest` doubles as the resume fragment — whatever is already on disk is
      // the resume point (a Range request asks for the remainder).
      await downloadResumableAsset(url, fallbackUrl, dest, net, log)
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
