import { randomUUID } from 'node:crypto'
import { lstat, readFile, rename, rm, writeFile } from 'node:fs/promises'
import type {
  DeclaredOwnership,
  DeclaredOwnershipResource,
} from '../../installers/lib/ownershipContract.js'
import {
  assertSkillOwnershipReceiptParent,
  captureSkillOwnershipReceiptParent,
  type SkillOwnershipReceiptParentIdentity,
} from '../../installers/lib/skillOwnershipReceipt.js'

export interface OwnershipReceiptSnapshot {
  path: string
  bytes: Buffer | null
  mode: number | null
  parentIdentity: SkillOwnershipReceiptParentIdentity | null
}

export async function snapshotOwnershipReceipt(path: string): Promise<OwnershipReceiptSnapshot> {
  const parentIdentity = await captureSkillOwnershipReceiptParent(path)
  if (!parentIdentity) return { path, bytes: null, mode: null, parentIdentity: null }
  try {
    const info = await lstat(path)
    if (info.isSymbolicLink() || !info.isFile()) throw new Error('receipt is not a regular file')
    const bytes = await readFile(path)
    await assertSkillOwnershipReceiptParent(parentIdentity)
    return { path, bytes, mode: info.mode, parentIdentity }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      await assertSkillOwnershipReceiptParent(parentIdentity)
      return { path, bytes: null, mode: null, parentIdentity }
    }
    throw error
  }
}

async function restoreOwnershipReceipt(snapshot: OwnershipReceiptSnapshot): Promise<void> {
  const parentIdentity = snapshot.parentIdentity
    ? snapshot.parentIdentity
    : await captureSkillOwnershipReceiptParent(snapshot.path, { create: snapshot.bytes !== null })
  if (!parentIdentity) return
  await assertSkillOwnershipReceiptParent(parentIdentity)
  await rm(snapshot.path, { force: true })
  if (!snapshot.bytes) {
    await assertSkillOwnershipReceiptParent(parentIdentity)
    return
  }
  const temp = `${snapshot.path}.${process.pid}.${randomUUID()}.restore.tmp`
  await assertSkillOwnershipReceiptParent(parentIdentity)
  await writeFile(temp, snapshot.bytes, { mode: snapshot.mode ?? undefined })
  await assertSkillOwnershipReceiptParent(parentIdentity)
  await rename(temp, snapshot.path)
  await assertSkillOwnershipReceiptParent(parentIdentity)
}

export async function restoreOwnershipReceipts(
  snapshots: OwnershipReceiptSnapshot[],
): Promise<void> {
  const restored = await Promise.allSettled(snapshots.map(restoreOwnershipReceipt))
  const failure = restored.find((result) => result.status === 'rejected')
  if (failure?.status === 'rejected') throw failure.reason
}

function resourceKey(resource: DeclaredOwnershipResource): string {
  return JSON.stringify([resource.path, resource.root, resource.kind])
}

export function intersectDeclaredOwnership(
  before: DeclaredOwnership,
  after: DeclaredOwnership,
): DeclaredOwnership {
  const beforeKeys = new Set(before.resources.map(resourceKey))
  const resources = after.resources
    .filter((resource) => beforeKeys.has(resourceKey(resource)))
    .sort((left, right) => left.path.localeCompare(right.path))
  return {
    resources,
    roots: [...new Set(resources.map(({ root }) => root))].sort(),
    paths: resources.map(({ path }) => path),
  }
}
