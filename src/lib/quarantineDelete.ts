import { AsyncLocalStorage } from 'node:async_hooks'
import { createHash, randomBytes } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { lstat, realpath, rename, rm } from 'node:fs/promises'
import { dirname, isAbsolute, join, relative, resolve } from 'node:path'

export interface OwnedPathSnapshot {
  root: string
  target: string
  canonicalRoot: string
  canonicalTarget: string
  isDirectory: boolean
  device: number
  inode: number
  contentDigest: string | null
}

export interface QuarantineOptions {
  verify?: (quarantinePath: string) => Promise<void>
}

export interface QuarantineTransactionResult<T> {
  value: T
  cleanupFailures: string[]
}

interface QuarantinedPath {
  snapshot: OwnedPathSnapshot
  quarantinePath: string
  verify?: (quarantinePath: string) => Promise<void>
}

interface QuarantineTransaction {
  paths: QuarantinedPath[]
}

const quarantineTransactions = new AsyncLocalStorage<QuarantineTransaction>()

function isDirectChild(root: string, target: string): boolean {
  const rel = relative(root, target)
  return rel !== '' && !rel.startsWith('..') && !isAbsolute(rel) && dirname(target) === root
}

async function digestFile(path: string): Promise<string> {
  const hash = createHash('sha256')
  for await (const chunk of createReadStream(path)) hash.update(chunk)
  return hash.digest('hex')
}

async function inspectRoot(root: string): Promise<{ canonicalRoot: string }> {
  const info = await lstat(root)
  if (info.isSymbolicLink() || !info.isDirectory()) {
    throw new Error(`refusing symbolic link, junction, or non-directory root: ${root}`)
  }
  return { canonicalRoot: await realpath(root) }
}

export async function prepareOwnedPathRemoval(
  root: string,
  target: string,
): Promise<OwnedPathSnapshot> {
  const resolvedRoot = resolve(root)
  const resolvedTarget = resolve(target)
  if (!isDirectChild(resolvedRoot, resolvedTarget)) {
    throw new Error(`refusing path outside authorized direct-child root: ${target}`)
  }
  const [{ canonicalRoot }, targetInfo] = await Promise.all([
    inspectRoot(resolvedRoot),
    lstat(resolvedTarget),
  ])
  if (targetInfo.isSymbolicLink()) {
    throw new Error(`refusing symbolic link or junction path: ${target}`)
  }
  const canonicalTarget = await realpath(resolvedTarget)
  if (dirname(canonicalTarget) !== canonicalRoot) {
    throw new Error(`refusing canonical path outside authorized root: ${target}`)
  }
  const isDirectory = targetInfo.isDirectory()
  return {
    root: resolvedRoot,
    target: resolvedTarget,
    canonicalRoot,
    canonicalTarget,
    isDirectory,
    device: targetInfo.dev,
    inode: targetInfo.ino,
    contentDigest: isDirectory ? null : await digestFile(resolvedTarget),
  }
}

export async function assertOwnedPathUnchanged(snapshot: OwnedPathSnapshot): Promise<void> {
  const current = await prepareOwnedPathRemoval(snapshot.root, snapshot.target)
  if (
    current.canonicalRoot !== snapshot.canonicalRoot ||
    current.canonicalTarget !== snapshot.canonicalTarget ||
    current.device !== snapshot.device ||
    current.inode !== snapshot.inode ||
    current.isDirectory !== snapshot.isDirectory ||
    current.contentDigest !== snapshot.contentDigest
  ) {
    throw new Error(`refusing path changed after preflight: ${snapshot.target}`)
  }
}

async function restoreQuarantine(quarantinePath: string, target: string): Promise<string | null> {
  try {
    await lstat(target)
    return `original path is occupied: ${target}`
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') return (error as Error).message
  }
  try {
    await rename(quarantinePath, target)
    return null
  } catch (error) {
    return (error as Error).message
  }
}

async function rollbackQuarantines(transaction: QuarantineTransaction): Promise<string[]> {
  const failures: string[] = []
  for (const quarantined of [...transaction.paths].reverse()) {
    const { snapshot, quarantinePath } = quarantined
    try {
      await reverifyQuarantinedPath(quarantined)
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error)
      failures.push(
        `rollback reverify failed for ${snapshot.target}: ${detail}; retained at ${quarantinePath}`,
      )
      continue
    }
    const restoreError = await restoreQuarantine(quarantinePath, snapshot.target)
    if (restoreError !== null) {
      failures.push(
        `rollback failed for ${snapshot.target}: ${restoreError}; retained at ${quarantinePath}`,
      )
    }
  }
  return failures
}

async function finalizeQuarantines(transaction: QuarantineTransaction): Promise<string[]> {
  const failures: string[] = []
  for (const quarantined of transaction.paths) {
    const { snapshot, quarantinePath } = quarantined
    try {
      await reverifyQuarantinedPath(quarantined)
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error)
      failures.push(
        `cleanup reverify failed for ${snapshot.target}: ${detail}; retained at ${quarantinePath}`,
      )
      continue
    }
    try {
      await rm(
        quarantinePath,
        snapshot.isDirectory ? { recursive: true, force: true, maxRetries: 3 } : { force: true },
      )
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error)
      failures.push(
        `cleanup failed for ${snapshot.target}: ${detail}; retained at ${quarantinePath}`,
      )
    }
  }
  return failures
}

export async function withQuarantineTransaction<T>(
  operation: () => Promise<T>,
  commit: () => Promise<void>,
): Promise<QuarantineTransactionResult<T>> {
  if (quarantineTransactions.getStore()) {
    throw new Error('nested quarantine transactions are not supported')
  }
  const transaction: QuarantineTransaction = { paths: [] }
  let value: T
  try {
    value = await quarantineTransactions.run(transaction, operation)
    await commit()
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    const rollbackFailures = await rollbackQuarantines(transaction)
    throw new Error(
      rollbackFailures.length === 0 ? detail : `${detail}; ${rollbackFailures.join('; ')}`,
    )
  }
  return { value, cleanupFailures: await finalizeQuarantines(transaction) }
}

async function verifyQuarantine(
  snapshot: OwnedPathSnapshot,
  quarantinePath: string,
  verify?: (quarantinePath: string) => Promise<void>,
): Promise<void> {
  const [{ canonicalRoot }, info] = await Promise.all([
    inspectRoot(snapshot.root),
    lstat(quarantinePath),
  ])
  if (canonicalRoot !== snapshot.canonicalRoot) {
    throw new Error(`refusing root changed after preflight: ${snapshot.root}`)
  }
  if (info.isSymbolicLink() || !info.isDirectory()) {
    throw new Error(
      `refusing quarantined symbolic link, junction, or non-directory: ${snapshot.target}`,
    )
  }
  if (info.dev !== snapshot.device || info.ino !== snapshot.inode) {
    throw new Error(
      `refusing quarantined path identity changed after preflight: ${snapshot.target}`,
    )
  }
  const canonicalQuarantine = await realpath(quarantinePath)
  if (dirname(canonicalQuarantine) !== canonicalRoot) {
    throw new Error(`refusing quarantined path outside authorized root: ${snapshot.target}`)
  }
  await verify?.(quarantinePath)
}

async function verifyQuarantinedFile(
  snapshot: OwnedPathSnapshot,
  quarantinePath: string,
): Promise<void> {
  const [{ canonicalRoot }, info] = await Promise.all([
    inspectRoot(snapshot.root),
    lstat(quarantinePath),
  ])
  if (canonicalRoot !== snapshot.canonicalRoot) {
    throw new Error(`refusing root changed after preflight: ${snapshot.root}`)
  }
  if (info.isSymbolicLink() || info.isDirectory()) {
    throw new Error(
      `refusing quarantined symbolic link, junction, or directory: ${snapshot.target}`,
    )
  }
  if (info.dev !== snapshot.device || info.ino !== snapshot.inode) {
    throw new Error(
      `refusing quarantined path identity changed after preflight: ${snapshot.target}`,
    )
  }
  if ((await digestFile(quarantinePath)) !== snapshot.contentDigest) {
    throw new Error(`refusing quarantined path content changed after preflight: ${snapshot.target}`)
  }
  const canonicalQuarantine = await realpath(quarantinePath)
  if (dirname(canonicalQuarantine) !== canonicalRoot) {
    throw new Error(`refusing quarantined path outside authorized root: ${snapshot.target}`)
  }
}

async function reverifyQuarantinedPath(quarantined: QuarantinedPath): Promise<void> {
  const { snapshot, quarantinePath, verify } = quarantined
  if (snapshot.isDirectory) {
    await verifyQuarantine(snapshot, quarantinePath, verify)
    return
  }
  await verifyQuarantinedFile(snapshot, quarantinePath)
  await verify?.(quarantinePath)
}

export async function removeOwnedFileViaQuarantine(
  snapshot: OwnedPathSnapshot,
  options: QuarantineOptions = {},
): Promise<void> {
  if (snapshot.isDirectory) {
    throw new Error(`refusing non-recursive removal of directory: ${snapshot.target}`)
  }

  const currentRoot = await inspectRoot(snapshot.root)
  if (currentRoot.canonicalRoot !== snapshot.canonicalRoot) {
    throw new Error(`refusing root changed after preflight: ${snapshot.root}`)
  }

  const quarantinePath = join(
    snapshot.root,
    `.harnessed-quarantine-${process.pid}-${randomBytes(16).toString('hex')}`,
  )
  await rename(snapshot.target, quarantinePath)

  try {
    await verifyQuarantinedFile(snapshot, quarantinePath)
    await options.verify?.(quarantinePath)
  } catch (error) {
    const restoreError = await restoreQuarantine(quarantinePath, snapshot.target)
    const detail = error instanceof Error ? error.message : String(error)
    throw new Error(
      restoreError === null
        ? detail
        : `${detail}; quarantine restore failed: ${restoreError}; retained at ${quarantinePath}`,
    )
  }

  const transaction = quarantineTransactions.getStore()
  if (transaction) {
    transaction.paths.push({ snapshot, quarantinePath, verify: options.verify })
    return
  }
  await rm(quarantinePath, { force: true })
}

export async function removeOwnedDirectoryViaQuarantine(
  snapshot: OwnedPathSnapshot,
  options: QuarantineOptions = {},
): Promise<void> {
  if (!snapshot.isDirectory) {
    throw new Error(`refusing recursive removal of non-directory: ${snapshot.target}`)
  }

  const currentRoot = await inspectRoot(snapshot.root)
  if (currentRoot.canonicalRoot !== snapshot.canonicalRoot) {
    throw new Error(`refusing root changed after preflight: ${snapshot.root}`)
  }

  const quarantinePath = join(
    snapshot.root,
    `.harnessed-quarantine-${process.pid}-${randomBytes(16).toString('hex')}`,
  )
  await rename(snapshot.target, quarantinePath)

  try {
    await verifyQuarantine(snapshot, quarantinePath, options.verify)
  } catch (error) {
    const restoreError = await restoreQuarantine(quarantinePath, snapshot.target)
    const detail = error instanceof Error ? error.message : String(error)
    throw new Error(
      restoreError === null
        ? detail
        : `${detail}; quarantine restore failed: ${restoreError}; retained at ${quarantinePath}`,
    )
  }

  const transaction = quarantineTransactions.getStore()
  if (transaction) {
    transaction.paths.push({ snapshot, quarantinePath, verify: options.verify })
    return
  }
  await rm(quarantinePath, { recursive: true, force: true, maxRetries: 3 })
}
