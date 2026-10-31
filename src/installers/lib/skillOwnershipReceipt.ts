import { createHash } from 'node:crypto'
import type { BigIntStats } from 'node:fs'
import { lstat, mkdir, readdir, readFile, realpath, rename, rm, writeFile } from 'node:fs/promises'
import { basename, dirname, isAbsolute, join, relative, resolve } from 'node:path'
import {
  prepareOwnedPathRemoval,
  removeOwnedDirectoryViaQuarantine,
  removeOwnedFileViaQuarantine,
} from '../../lib/quarantineDelete.js'
import { detectPlatform } from '../../platform/platform.js'
import { skillRootsForContext } from './packSkillAudit.js'
import type { InstallContext } from './types.js'

export interface SkillOwnershipReceipt {
  version: 3
  component: string
  hostId: string
  nativeRoot: string
  manifestSha256: string
  skillRoots: string[]
  createdPaths: string[]
  contentSha256: Record<string, string>
  pathKinds: Record<string, 'file' | 'directory'>
}

interface ReceiptContext {
  component: string
  hostId: string
  nativeRoot: string
  stateRoot: string
}

export interface SkillOwnershipReceiptParentIdentity {
  path: string
  canonicalPath: string
  device: bigint
  inode: bigint
  type: 'directory'
}

interface ReceiptParentOptions {
  create?: boolean
}

function receiptParentFailure(reason: string): Error {
  return new Error(`skill ownership receipt parent ${reason}`)
}

export async function captureSkillOwnershipReceiptParent(
  receiptPath: string,
  options: ReceiptParentOptions = {},
): Promise<SkillOwnershipReceiptParentIdentity | null> {
  const parent = dirname(resolve(receiptPath))
  if (basename(parent) !== 'skill-ownership') {
    throw receiptParentFailure('has an unexpected path')
  }
  let info: BigIntStats
  try {
    info = await lstat(parent, { bigint: true })
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
    if (!options.create) return null
    await mkdir(parent, { recursive: true })
    info = await lstat(parent, { bigint: true })
  }
  if (info.isSymbolicLink() || !info.isDirectory()) {
    throw receiptParentFailure('is a symlink, junction, reparse redirect, or non-directory')
  }
  const [canonicalPath, canonicalStateRoot] = await Promise.all([
    realpath(parent),
    realpath(dirname(parent)),
  ])
  if (resolve(canonicalPath) !== resolve(canonicalStateRoot, basename(parent))) {
    throw receiptParentFailure('canonical path is redirected')
  }
  const canonicalInfo = await lstat(canonicalPath, { bigint: true })
  if (
    canonicalInfo.isSymbolicLink() ||
    !canonicalInfo.isDirectory() ||
    canonicalInfo.dev !== info.dev ||
    canonicalInfo.ino !== info.ino
  ) {
    throw receiptParentFailure('canonical identity is not a regular directory')
  }
  return {
    path: parent,
    canonicalPath: resolve(canonicalPath),
    device: info.dev,
    inode: info.ino,
    type: 'directory',
  }
}

export async function assertSkillOwnershipReceiptParent(
  expected: SkillOwnershipReceiptParentIdentity,
): Promise<void> {
  const current = await captureSkillOwnershipReceiptParent(join(expected.path, '.identity-check'))
  if (
    !current ||
    current.canonicalPath !== expected.canonicalPath ||
    current.device !== expected.device ||
    current.inode !== expected.inode ||
    current.type !== expected.type
  ) {
    throw receiptParentFailure('identity changed')
  }
}

function receiptContext(ctx: Pick<InstallContext, 'manifest' | 'hostContext'>): ReceiptContext {
  const platform = ctx.hostContext?.platform ?? detectPlatform()
  return {
    component: ctx.manifest.metadata.name,
    hostId: ctx.hostContext?.hostId ?? platform.id,
    nativeRoot: resolve(ctx.hostContext?.nativeHome ?? platform.homeDir),
    stateRoot: resolve(platform.stateRoot),
  }
}

export type SkillOwnershipReceiptErrorKind = 'missing' | 'legacy' | 'corrupt'

export class SkillOwnershipReceiptError extends Error {
  constructor(
    readonly kind: SkillOwnershipReceiptErrorKind,
    reason: string,
  ) {
    super(`skill ownership receipt ${reason}; run repair or reinstall before uninstalling`)
    this.name = 'SkillOwnershipReceiptError'
  }
}

export function isSkillOwnershipReceiptError(error: unknown): error is SkillOwnershipReceiptError {
  return error instanceof SkillOwnershipReceiptError
}

function fail(reason: string, kind: SkillOwnershipReceiptErrorKind = 'corrupt'): Error {
  return new SkillOwnershipReceiptError(kind, reason)
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`
  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => `${JSON.stringify(key)}:${canonicalJson(child)}`)
      .join(',')}}`
  }
  return JSON.stringify(value)
}

function ownershipFingerprint(ctx: Pick<InstallContext, 'manifest'>): string {
  const value = {
    metadata: ctx.manifest.metadata,
    install: ctx.manifest.spec.install,
    ...(((ctx.manifest.spec as unknown as { ownership?: unknown }).ownership !== undefined && {
      ownership: (ctx.manifest.spec as unknown as { ownership: unknown }).ownership,
    }) ||
      {}),
  }
  return createHash('sha256').update(canonicalJson(value)).digest('hex')
}

function pathInsideRoot(root: string, path: string): boolean {
  const rel = relative(root, path)
  return rel !== '' && !rel.startsWith('..') && !isAbsolute(rel)
}

function rootForPath(roots: readonly string[], path: string): string | undefined {
  return (
    roots.find((root) => dirname(path) === root) ?? roots.find((root) => pathInsideRoot(root, path))
  )
}

interface OwnershipResourceDeclaration {
  root: string
  kind: 'file' | 'directory'
  selector: { names?: string[]; prefix?: string }
  marker: { path?: string; contains: string }
}

function declaredRootPath(
  ctx: Pick<InstallContext, 'hostContext'>,
  root: string,
): string | undefined {
  const host = ctx.hostContext
  if (!host) return undefined
  const roots: Record<string, string> = {
    'platform-skills': host.platform.skillsDir,
    'native-home': host.nativeHome,
    'host-agents': join(host.nativeHome, 'agents'),
    'host-commands': host.platform.commandsDir,
  }
  return roots[root] ? resolve(roots[root]) : undefined
}

async function matchesDeclaredResource(
  ctx: Pick<InstallContext, 'manifest' | 'hostContext'>,
  path: string,
  kind: 'file' | 'directory',
  actualPath = path,
): Promise<boolean> {
  const ownership = (ctx.manifest.spec as unknown as { ownership?: { resources?: unknown } })
    .ownership
  if (ownership === undefined) {
    if (kind !== 'directory') return false
    const roots = skillRootsForContext(ctx as InstallContext).map((root) => resolve(root))
    return (
      roots.includes(resolve(dirname(path))) && authorizedSkillNames(ctx).includes(basename(path))
    )
  }
  const resources = ownership.resources
  if (!Array.isArray(resources)) return false
  if (resources.length === 0) return false
  for (const resource of resources as OwnershipResourceDeclaration[]) {
    const root = declaredRootPath(ctx, resource.root)
    if (!root || resource.kind !== kind || dirname(path) !== root) continue
    const name = path.slice(root.length + 1)
    const names = resource.selector?.names
    const prefix = resource.selector?.prefix
    if (!names?.includes(name) && !(prefix && name.startsWith(prefix))) continue
    const markerPath = resource.marker?.path ? join(actualPath, resource.marker.path) : actualPath
    if (kind === 'directory' && !pathInsideRoot(actualPath, markerPath)) continue
    try {
      const targetInfo = await lstat(actualPath)
      const markerInfo = await lstat(markerPath)
      if (
        targetInfo.isSymbolicLink() ||
        markerInfo.isSymbolicLink() ||
        !markerInfo.isFile() ||
        (kind === 'directory' && !targetInfo.isDirectory()) ||
        (kind === 'file' && !targetInfo.isFile())
      )
        continue
      if (kind === 'directory') {
        const [physicalPath, physicalMarker] = await Promise.all([
          realpath(actualPath),
          realpath(markerPath),
        ])
        if (!pathInsideRoot(physicalPath, physicalMarker)) continue
      }
      if ((await readFile(markerPath, 'utf8')).includes(resource.marker.contains)) return true
    } catch {}
  }
  return false
}

export function authorizedSkillNames(ctx: Pick<InstallContext, 'manifest'>): string[] {
  const install = ctx.manifest.spec.install
  const declared = (install as { installs_skills?: unknown }).installs_skills
  const names = Array.isArray(declared)
    ? declared.filter((name): name is string => typeof name === 'string' && name.length > 0)
    : []
  if (install.method === 'npx-skill-installer') {
    const selected = install.cmd.match(/(?:^|\s)--skill(?:=|\s+)([a-zA-Z0-9][a-zA-Z0-9._-]*)/)
    if (selected?.[1]) names.push(selected[1])
  }
  if (names.some((name) => !/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(name))) {
    throw fail('has an invalid declared skill name')
  }
  return [...new Set(names)].sort()
}

export async function declaredSkillPaths(
  ctx: Pick<InstallContext, 'manifest'>,
  skillRoots: readonly string[],
): Promise<string[]> {
  const roots = normalizeRoots(skillRoots)
  const paths: string[] = []
  for (const root of roots) {
    for (const name of authorizedSkillNames(ctx)) {
      const path = join(root, name)
      try {
        await lstat(path)
        paths.push(path)
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
      }
    }
  }
  return paths.sort()
}

async function hashSkillTree(path: string): Promise<string> {
  const hash = createHash('sha256')
  const visit = async (dir: string, prefix: string): Promise<void> => {
    const entries = await readdir(dir, { withFileTypes: true })
    entries.sort((left, right) => left.name.localeCompare(right.name))
    for (const entry of entries) {
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name
      const target = join(dir, entry.name)
      if (entry.isSymbolicLink()) throw fail(`target contains a symbolic link: ${rel}`)
      if (entry.isDirectory()) {
        hash.update(`d\0${rel}\0`)
        await visit(target, rel)
      } else if (entry.isFile()) {
        hash.update(`f\0${rel}\0`)
        hash.update(await readFile(target))
        hash.update('\0')
      } else {
        throw fail(`target contains an unsupported filesystem entry: ${rel}`)
      }
    }
  }
  await visit(path, '')
  return hash.digest('hex')
}

function normalizeRoots(skillRoots: readonly string[]): string[] {
  if (skillRoots.length === 0 || skillRoots.some((root) => !isAbsolute(root))) {
    throw fail('is corrupt')
  }
  return [...new Set(skillRoots.map((root) => resolve(root)))]
}

function validateCreatedPaths(
  skillRoots: readonly string[],
  createdPaths: readonly string[],
): string[] {
  const roots = normalizeRoots(skillRoots)
  if (createdPaths.some((path) => !isAbsolute(path))) {
    throw fail('contains a non-absolute path')
  }
  return [...new Set(createdPaths.map((path) => resolve(path)))].map((path) => {
    const root = rootForPath(roots, path)
    if (!root || dirname(path) !== root)
      throw new Error(`skill ownership path is outside an allowed skill root: ${path}`)
    return path
  })
}

function requireCreatedPaths(paths: readonly string[]): void {
  if (paths.length === 0) throw fail('is empty')
}

export function isSkillOwnershipManaged(
  ctx: Pick<InstallContext, 'manifest'>['manifest'],
): boolean {
  const install = ctx.spec.install
  const installsSkills = (install as { installs_skills?: unknown }).installs_skills
  const resources = (ctx.spec as unknown as { ownership?: { resources?: unknown } }).ownership
    ?.resources
  return (
    install.method === 'npx-skill-installer' ||
    (Array.isArray(resources) && resources.length > 0) ||
    (Array.isArray(installsSkills) && installsSkills.length > 0)
  )
}

export function skillOwnershipReceiptPath(
  ctx: Pick<InstallContext, 'manifest' | 'hostContext'>,
): string {
  const binding = receiptContext(ctx)
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(binding.component)) {
    throw fail('has an invalid component binding')
  }
  return join(binding.stateRoot, 'skill-ownership', `${binding.component}.json`)
}

export async function writeSkillOwnershipReceipt(
  ctx: Pick<InstallContext, 'manifest' | 'hostContext'>,
  skillRoots: readonly string[],
  createdPaths: readonly string[],
): Promise<void> {
  const binding = receiptContext(ctx)
  const roots = normalizeRoots(skillRoots).sort()
  const paths = validateCreatedPaths(roots, createdPaths).sort()
  requireCreatedPaths(paths)
  const contentSha256: Record<string, string> = {}
  const pathKinds: Record<string, 'file' | 'directory'> = {}
  for (const path of paths) {
    const root = rootForPath(roots, path)
    if (!root) throw fail(`contains a path outside an allowed skill root: ${path}`)
    if (dirname(path) !== root)
      throw fail(`target is not a direct child of its captured root: ${path}`)
    const info = await lstat(path)
    if (info.isSymbolicLink()) throw fail(`target is a symbolic link: ${path}`)
    if (!info.isDirectory() && !info.isFile()) throw fail(`target is not a regular path: ${path}`)
    const [physicalRoot, physicalPath] = await Promise.all([realpath(root), realpath(path)])
    if (!pathInsideRoot(physicalRoot, physicalPath))
      throw fail(`target escapes its captured skill root: ${path}`)
    contentSha256[path] = info.isDirectory()
      ? await hashSkillTree(path)
      : createHash('sha256')
          .update(await readFile(path))
          .digest('hex')
    pathKinds[path] = info.isDirectory() ? 'directory' : 'file'
    if (!(await matchesDeclaredResource(ctx, path, pathKinds[path]))) {
      throw fail('contains a path without a declared ownership marker')
    }
  }
  const receipt: SkillOwnershipReceipt = {
    version: 3,
    component: binding.component,
    hostId: binding.hostId,
    nativeRoot: binding.nativeRoot,
    manifestSha256: ownershipFingerprint(ctx),
    skillRoots: roots,
    createdPaths: paths,
    contentSha256,
    pathKinds,
  }
  const path = skillOwnershipReceiptPath(ctx)
  const parent = await captureSkillOwnershipReceiptParent(path, { create: true })
  if (!parent) throw receiptParentFailure('could not be created')
  const tmpPath = `${path}.${process.pid}.${Date.now()}.tmp`
  await assertSkillOwnershipReceiptParent(parent)
  await writeFile(tmpPath, `${JSON.stringify(receipt, null, 2)}\n`, 'utf8')
  await assertSkillOwnershipReceiptParent(parent)
  await rename(tmpPath, path)
  await assertSkillOwnershipReceiptParent(parent)
}

export async function readSkillOwnershipReceipt(
  ctx: Pick<InstallContext, 'manifest' | 'hostContext'>,
): Promise<SkillOwnershipReceipt> {
  const path = skillOwnershipReceiptPath(ctx)
  const parent = await captureSkillOwnershipReceiptParent(path)
  if (!parent) throw fail('is missing', 'missing')
  let value: unknown
  try {
    const bytes = await readFile(path, 'utf8')
    await assertSkillOwnershipReceiptParent(parent)
    value = JSON.parse(bytes)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') throw fail('is missing', 'missing')
    throw fail('is corrupt')
  }
  if (!value || typeof value !== 'object') throw fail('is corrupt')
  const receipt = value as Partial<SkillOwnershipReceipt>
  if (receipt.version !== 3) throw fail('is legacy or unsupported', 'legacy')
  if (
    typeof receipt.component !== 'string' ||
    typeof receipt.hostId !== 'string' ||
    typeof receipt.nativeRoot !== 'string' ||
    typeof receipt.manifestSha256 !== 'string' ||
    !Array.isArray(receipt.skillRoots) ||
    !receipt.skillRoots.every((root) => typeof root === 'string') ||
    !Array.isArray(receipt.createdPaths) ||
    !receipt.createdPaths.every((path) => typeof path === 'string') ||
    !receipt.contentSha256 ||
    typeof receipt.contentSha256 !== 'object' ||
    Array.isArray(receipt.contentSha256) ||
    !receipt.pathKinds ||
    typeof receipt.pathKinds !== 'object' ||
    Array.isArray(receipt.pathKinds)
  ) {
    throw fail('is corrupt')
  }
  requireCreatedPaths(receipt.createdPaths)
  const binding = receiptContext(ctx)
  if (
    receipt.component !== binding.component ||
    receipt.hostId !== binding.hostId ||
    resolve(receipt.nativeRoot) !== binding.nativeRoot
  ) {
    throw fail('binding does not match the active component and host root')
  }
  if (receipt.manifestSha256 !== ownershipFingerprint(ctx)) throw fail('manifest identity changed')
  const currentRoots = new Set(
    [
      ...skillRootsForContext(ctx as InstallContext),
      ...(ctx.hostContext
        ? [
            ctx.hostContext.nativeHome,
            join(ctx.hostContext.nativeHome, 'agents'),
            ctx.hostContext.platform.commandsDir,
          ]
        : []),
    ].map((root) => resolve(root)),
  )
  const normalizedReceiptRoots = normalizeRoots(receipt.skillRoots)
  if (normalizedReceiptRoots.some((root) => !currentRoots.has(root))) {
    throw fail('contains an unknown or inactive root')
  }
  const skillRoots = normalizedReceiptRoots
  let createdPaths: string[]
  try {
    createdPaths = validateCreatedPaths(skillRoots, receipt.createdPaths)
  } catch {
    throw fail('contains a path outside the active captured skill roots')
  }
  for (const path of createdPaths) {
    const digest = receipt.contentSha256[path]
    const kind = receipt.pathKinds[path]
    const root = rootForPath(skillRoots, path)
    if (
      !root ||
      dirname(path) !== root ||
      (kind !== 'file' && kind !== 'directory') ||
      typeof digest !== 'string' ||
      !/^[a-f0-9]{64}$/.test(digest)
    ) {
      throw fail('contains an invalid or undeclared owned skill path')
    }
    if (!(await matchesDeclaredResource(ctx, path, kind))) {
      throw fail('contains a path without a declared ownership marker')
    }
  }
  if (
    Object.keys(receipt.contentSha256).length !== createdPaths.length ||
    Object.keys(receipt.contentSha256).some((path) => !createdPaths.includes(path))
  ) {
    throw fail('contains undeclared content digests')
  }
  return {
    version: 3,
    component: receipt.component,
    hostId: receipt.hostId,
    nativeRoot: binding.nativeRoot,
    manifestSha256: receipt.manifestSha256,
    skillRoots,
    createdPaths,
    contentSha256: receipt.contentSha256,
    pathKinds: receipt.pathKinds,
  }
}

export async function verifyOwnedSkillPath(
  receipt: SkillOwnershipReceipt,
  path: string,
  actualPath = path,
): Promise<void> {
  const root = receipt.skillRoots.find((candidate) => dirname(path) === candidate)
  if (!root) throw fail('contains an owned path outside its captured roots')
  const [rootInfo, targetInfo] = await Promise.all([lstat(root), lstat(actualPath)])
  if (rootInfo.isSymbolicLink() || targetInfo.isSymbolicLink() || !rootInfo.isDirectory()) {
    throw fail('target is a symbolic link, junction, or non-directory')
  }
  const expectedKind = receipt.pathKinds[path]
  if (expectedKind !== (targetInfo.isDirectory() ? 'directory' : 'file')) {
    throw fail('target type changed after installation')
  }
  const [physicalRoot, physicalPath] = await Promise.all([realpath(root), realpath(actualPath)])
  if (dirname(physicalPath) !== physicalRoot) throw fail('target escapes its captured skill root')
  const digest = targetInfo.isDirectory()
    ? await hashSkillTree(actualPath)
    : createHash('sha256')
        .update(await readFile(actualPath))
        .digest('hex')
  if (digest !== receipt.contentSha256[path]) {
    throw fail('target content changed after installation')
  }
}

export async function removeOwnedSkillPath(
  receipt: SkillOwnershipReceipt,
  path: string,
  ctx?: Pick<InstallContext, 'manifest' | 'hostContext'>,
): Promise<void> {
  const root = receipt.skillRoots.find((candidate) => dirname(path) === candidate)
  if (!root) throw fail('contains an owned path outside its captured roots')
  await verifyOwnedSkillPath(receipt, path)
  const snapshot = await prepareOwnedPathRemoval(root, path)
  const verifyQuarantinedOwnership = async (quarantinePath: string): Promise<void> => {
    await verifyOwnedSkillPath(receipt, path, quarantinePath)
    if (
      ctx &&
      !(await matchesDeclaredResource(
        ctx,
        path,
        receipt.pathKinds[path] as 'file' | 'directory',
        quarantinePath,
      ))
    ) {
      throw fail('target no longer matches its declared ownership marker')
    }
  }
  if (snapshot.isDirectory) {
    await removeOwnedDirectoryViaQuarantine(snapshot, {
      verify: verifyQuarantinedOwnership,
    })
  } else {
    await removeOwnedFileViaQuarantine(snapshot, {
      verify: verifyQuarantinedOwnership,
    })
  }
}

export async function removeSkillOwnershipReceipt(
  ctx: Pick<InstallContext, 'manifest' | 'hostContext'>,
): Promise<void> {
  const path = skillOwnershipReceiptPath(ctx)
  const parent = await captureSkillOwnershipReceiptParent(path)
  if (!parent) return
  await assertSkillOwnershipReceiptParent(parent)
  await rm(path, { force: true })
  await assertSkillOwnershipReceiptParent(parent)
}
