import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import {
  closeSync,
  fsyncSync,
  mkdirSync,
  openSync,
  readFileSync,
  realpathSync,
  renameSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs'
import { basename, dirname, join, resolve } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import lockfile from 'proper-lockfile'

export const UPDATE_LOCK_PROTOCOL_VERSION = 1 as const
const DEFAULT_STALE_AFTER_MS = 5 * 60_000
const MAX_LOCK_BYTES = 16 * 1024

interface UpdateLockRecord {
  protocolVersion: typeof UPDATE_LOCK_PROTOCOL_VERSION
  target: string
  targetKey: string
  nonce: string
  ownerPid: number
  createdAt: number
  heartbeatAt: number
  consumedAt: number | null
}

export interface AcquireUpdateLockOptions {
  stateRoot: string
  target: string
  nonce?: string
  pid?: number
  now?: () => number
  staleAfterMs?: number
  maxStaleRecoveries?: number
  isProcessAlive?: (pid: number) => boolean
}

export type ConsumeContinuationResult =
  | { ok: true }
  | {
      ok: false
      reason: 'protocol-mismatch' | 'target-mismatch' | 'nonce-mismatch' | 'nonce-consumed'
    }

export interface ConsumeUpdateLockContinuationOptions {
  stateRoot: string
  target: string
  protocolVersion: number
  targetKey: string
  nonce: string
  pid?: number
  now?: () => number
}

export interface UpdateLockHandle {
  path: string
  target: string
  targetKey: string
  nonce: string
  refresh(): Promise<void>
  consumeContinuation(input: {
    protocolVersion: number
    targetKey: string
    nonce: string
  }): Promise<ConsumeContinuationResult>
  release(): Promise<void>
}

export type AcquireUpdateLockResult =
  | { status: 'acquired'; lock: UpdateLockHandle }
  | { status: 'busy'; targetKey: string; ownerPid: number | null }

export type UpdateLockRunResult<T> =
  | { status: 'completed'; value: T }
  | { status: 'busy'; targetKey: string; ownerPid: number | null }

function normalizeTarget(target: string): string {
  let candidate = resolve(target)
  const missing: string[] = []
  for (;;) {
    try {
      let canonical = resolve(realpathSync.native(candidate), ...missing)
      if (/\.(?:[cm]?js|ts)$/.test(canonical)) {
        for (let directory = dirname(canonical); ; ) {
          try {
            const manifest = JSON.parse(readFileSync(join(directory, 'package.json'), 'utf8'))
            if (manifest.name === 'harnessed') canonical = directory
            break
          } catch (error) {
            if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
          }
          const parent = dirname(directory)
          if (parent === directory) break
          directory = parent
        }
      }
      return process.platform === 'win32' ? canonical.toLowerCase() : canonical
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
      missing.unshift(basename(candidate))
      const parent = dirname(candidate)
      if (parent === candidate) throw error
      candidate = parent
    }
  }
}

export function updateTargetKey(target: string): string {
  return createHash('sha256').update(normalizeTarget(target), 'utf8').digest('hex')
}

function pathsFor(target: string): { anchor: string; path: string } {
  const anchor = `${target}.harnessed-update-anchor`
  return { anchor, path: `${anchor}.json` }
}

function ensureAnchor(anchor: string): void {
  mkdirSync(dirname(anchor), { recursive: true })
  const descriptor = openSync(anchor, 'a', 0o600)
  closeSync(descriptor)
}

function guarded<T>(anchor: string, work: () => T, recover = true): T {
  const release = lockfile.lockSync(anchor, {
    realpath: true,
    retries: 0,
    stale: recover ? 30_000 : Number.MAX_SAFE_INTEGER,
    update: 1000,
  })
  try {
    return work()
  } finally {
    release()
  }
}

function defaultIsProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0)
    return true
  } catch (error) {
    return (error as NodeJS.ErrnoException).code !== 'ESRCH'
  }
}

function sameSecret(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer)
}

function readLockRecord(path: string): UpdateLockRecord | null {
  try {
    if (statSync(path).size > MAX_LOCK_BYTES) return null
    const value = JSON.parse(readFileSync(path, 'utf8')) as Partial<UpdateLockRecord>
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null
    if (
      value.protocolVersion !== UPDATE_LOCK_PROTOCOL_VERSION ||
      typeof value.target !== 'string' ||
      typeof value.targetKey !== 'string' ||
      typeof value.nonce !== 'string' ||
      !Number.isInteger(value.ownerPid) ||
      (value.ownerPid ?? 0) <= 0 ||
      !Number.isFinite(value.createdAt) ||
      !Number.isFinite(value.heartbeatAt) ||
      (value.consumedAt !== null && !Number.isFinite(value.consumedAt))
    )
      return null
    return value as UpdateLockRecord
  } catch (error) {
    if (error instanceof SyntaxError || (error as NodeJS.ErrnoException).code === 'ENOENT')
      return null
    throw error
  }
}

function removeTemporaryLockRecord(path: string): void {
  try {
    unlinkSync(path)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
  }
}

function writeLockRecord(path: string, record: UpdateLockRecord): void {
  const temporary = `${path}.${randomBytes(12).toString('hex')}.tmp`
  try {
    const descriptor = openSync(temporary, 'wx', 0o600)
    try {
      writeFileSync(descriptor, `${JSON.stringify(record)}\n`, 'utf8')
      fsyncSync(descriptor)
    } finally {
      closeSync(descriptor)
    }
    renameSync(temporary, path)
  } finally {
    removeTemporaryLockRecord(temporary)
  }
}

export async function consumeUpdateLockContinuation(
  options: ConsumeUpdateLockContinuationOptions,
): Promise<ConsumeContinuationResult> {
  if (options.protocolVersion !== UPDATE_LOCK_PROTOCOL_VERSION)
    return { ok: false, reason: 'protocol-mismatch' }
  const target = normalizeTarget(options.target)
  const targetKey = updateTargetKey(target)
  if (options.targetKey !== targetKey) return { ok: false, reason: 'target-mismatch' }
  const { anchor, path } = pathsFor(target)
  ensureAnchor(anchor)
  return guarded(anchor, () => {
    const current = readLockRecord(path)
    if (!current || current.target !== target || current.targetKey !== targetKey) {
      return { ok: false, reason: 'target-mismatch' }
    }
    if (!sameSecret(options.nonce, current.nonce)) return { ok: false, reason: 'nonce-mismatch' }
    if (current.consumedAt !== null) return { ok: false, reason: 'nonce-consumed' }
    if (!defaultIsProcessAlive(current.ownerPid)) return { ok: false, reason: 'target-mismatch' }
    const timestamp = (options.now ?? Date.now)()
    writeLockRecord(path, {
      ...current,
      ownerPid: options.pid ?? process.pid,
      heartbeatAt: timestamp,
      consumedAt: timestamp,
    })
    return { ok: true }
  })
}

export async function acquireUpdateLock(
  options: AcquireUpdateLockOptions,
): Promise<AcquireUpdateLockResult> {
  const now = options.now ?? Date.now
  const target = normalizeTarget(options.target)
  const targetKey = updateTargetKey(target)
  const { anchor, path } = pathsFor(target)
  const nonce = options.nonce ?? randomBytes(24).toString('base64url')
  const busy = (ownerPid: number | null = null): AcquireUpdateLockResult => ({
    status: 'busy',
    targetKey,
    ownerPid,
  })
  ensureAnchor(anchor)
  try {
    return guarded(
      anchor,
      () => {
        const current = readLockRecord(path)
        let modified: number | null = null
        try {
          modified = statSync(path).mtimeMs
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
        }
        if (modified !== null) {
          const stale =
            now() - (current?.heartbeatAt ?? modified) >
            Math.max(1000, options.staleAfterMs ?? DEFAULT_STALE_AFTER_MS)
          if (
            !stale ||
            (options.maxStaleRecoveries ?? 1) <= 0 ||
            (current && (options.isProcessAlive ?? defaultIsProcessAlive)(current.ownerPid))
          )
            return busy(current?.ownerPid)
        }
        const timestamp = now()
        writeLockRecord(path, {
          protocolVersion: UPDATE_LOCK_PROTOCOL_VERSION,
          target,
          targetKey,
          nonce,
          ownerPid: options.pid ?? process.pid,
          createdAt: timestamp,
          heartbeatAt: timestamp,
          consumedAt: null,
        })
        const handle: UpdateLockHandle = {
          path,
          target,
          targetKey,
          nonce,
          async refresh() {
            try {
              guarded(anchor, () => {
                const current = readLockRecord(path)
                if (current && sameSecret(current.nonce, nonce))
                  writeLockRecord(path, { ...current, heartbeatAt: now() })
              })
            } catch (error) {
              if ((error as NodeJS.ErrnoException).code !== 'ELOCKED') throw error
            }
          },
          consumeContinuation: (input) =>
            consumeUpdateLockContinuation({ stateRoot: options.stateRoot, target, ...input, now }),
          async release() {
            for (let attempt = 0; attempt < 10; attempt++) {
              try {
                guarded(anchor, () => {
                  const current = readLockRecord(path)
                  if (current && sameSecret(current.nonce, nonce)) unlinkSync(path)
                })
                return
              } catch (error) {
                if ((error as NodeJS.ErrnoException).code !== 'ELOCKED') throw error
                await delay(20)
              }
            }
            throw new Error('Update lock release guard remained busy')
          },
        }
        return { status: 'acquired', lock: handle }
      },
      (options.maxStaleRecoveries ?? 1) > 0,
    )
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ELOCKED') return busy()
    throw error
  }
}

export async function withUpdateLock<T>(
  options: AcquireUpdateLockOptions,
  work: (lock: UpdateLockHandle) => Promise<T>,
): Promise<UpdateLockRunResult<T>> {
  const acquired = await acquireUpdateLock(options)
  if (acquired.status === 'busy') return acquired
  const heartbeat = setInterval(
    () => void acquired.lock.refresh().catch(() => {}),
    Math.max(
      1000,
      Math.min(30_000, Math.floor((options.staleAfterMs ?? DEFAULT_STALE_AFTER_MS) / 3)),
    ),
  )
  heartbeat.unref()
  try {
    return { status: 'completed', value: await work(acquired.lock) }
  } finally {
    clearInterval(heartbeat)
    await acquired.lock.release()
  }
}
