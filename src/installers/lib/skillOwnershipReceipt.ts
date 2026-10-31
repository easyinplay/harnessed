import { createHash } from 'node:crypto'
import { lstat, mkdir, readdir, readFile, realpath, rename, rm, writeFile } from 'node:fs/promises'
import { dirname, isAbsolute, join, relative, resolve } from 'node:path'
import {
  prepareOwnedPathRemoval,
  removeOwnedDirectoryViaQuarantine,
} from '../../lib/quarantineDelete.js'
import { detectPlatform } from '../../platform/platform.js'
import { skillRootsForContext } from './packSkillAudit.js'
import type { InstallContext } from './types.js'

export interface SkillOwnershipReceipt {
  version: 2
  component: string
  hostId: string
  nativeRoot: string
  manifestSha256: string
  skillRoots: string[]
  createdPaths: string[]
  contentSha256: Record<string, string>
}

interface ReceiptContext {
  component: string
  hostId: string
  nativeRoot: string
  stateRoot: string
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

function fail(reason: string): Error {
  return new Error(`skill ownership receipt ${reason}; run repair or reinstall before uninstalling`)
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
  }
  return createHash('sha256').update(canonicalJson(value)).digest('hex')
}

function pathInsideRoot(root: string, path: string): boolean {
  const rel = relative(root, path)
  return rel !== '' && !rel.startsWith('..') && !isAbsolute(rel)
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
    const root = roots.find((candidate) => {
      return pathInsideRoot(candidate, path)
    })
    if (!root) throw new Error(`skill ownership path is outside an allowed skill root: ${path}`)
    return path
  })
}

export function isSkillOwnershipManaged(
  ctx: Pick<InstallContext, 'manifest'>['manifest'],
): boolean {
  const install = ctx.spec.install
  const installsSkills = (install as { installs_skills?: unknown }).installs_skills
  return (
    install.method === 'npx-skill-installer' ||
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
  const contentSha256: Record<string, string> = {}
  for (const path of paths) {
    const root = roots.find((candidate) => pathInsideRoot(candidate, path))
    if (!root) throw fail(`contains a path outside an allowed skill root: ${path}`)
    const info = await lstat(path)
    if (info.isSymbolicLink()) throw fail(`target is a symbolic link: ${path}`)
    if (!info.isDirectory()) throw fail(`target is not a real directory: ${path}`)
    const [physicalRoot, physicalPath] = await Promise.all([realpath(root), realpath(path)])
    if (!pathInsideRoot(physicalRoot, physicalPath))
      throw fail(`target escapes its captured skill root: ${path}`)
    contentSha256[path] = await hashSkillTree(path)
  }
  const receipt: SkillOwnershipReceipt = {
    version: 2,
    component: binding.component,
    hostId: binding.hostId,
    nativeRoot: binding.nativeRoot,
    manifestSha256: ownershipFingerprint(ctx),
    skillRoots: roots,
    createdPaths: paths,
    contentSha256,
  }
  const path = skillOwnershipReceiptPath(ctx)
  await mkdir(dirname(path), { recursive: true })
  const tmpPath = `${path}.${process.pid}.${Date.now()}.tmp`
  await writeFile(tmpPath, `${JSON.stringify(receipt, null, 2)}\n`, 'utf8')
  await rename(tmpPath, path)
}

export async function readSkillOwnershipReceipt(
  ctx: Pick<InstallContext, 'manifest' | 'hostContext'>,
): Promise<SkillOwnershipReceipt> {
  const path = skillOwnershipReceiptPath(ctx)
  let value: unknown
  try {
    value = JSON.parse(await readFile(path, 'utf8'))
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') throw fail('is missing')
    throw fail('is corrupt')
  }
  if (!value || typeof value !== 'object') throw fail('is corrupt')
  const receipt = value as Partial<SkillOwnershipReceipt>
  if (receipt.version !== 2) throw fail('is legacy or unsupported')
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
    typeof receipt.contentSha256 !== 'object'
  ) {
    throw fail('is corrupt')
  }
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
    skillRootsForContext(ctx as InstallContext).map((root) => resolve(root)),
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
    if (typeof digest !== 'string' || !/^[a-f0-9]{64}$/.test(digest)) {
      throw fail('contains an invalid or undeclared owned skill path')
    }
  }
  return {
    version: receipt.version,
    component: receipt.component,
    hostId: receipt.hostId,
    nativeRoot: binding.nativeRoot,
    manifestSha256: receipt.manifestSha256,
    skillRoots,
    createdPaths,
    contentSha256: receipt.contentSha256,
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
  if (
    rootInfo.isSymbolicLink() ||
    targetInfo.isSymbolicLink() ||
    !rootInfo.isDirectory() ||
    !targetInfo.isDirectory()
  ) {
    throw fail('target is a symbolic link, junction, or non-directory')
  }
  const [physicalRoot, physicalPath] = await Promise.all([realpath(root), realpath(actualPath)])
  if (dirname(physicalPath) !== physicalRoot) throw fail('target escapes its captured skill root')
  if ((await hashSkillTree(actualPath)) !== receipt.contentSha256[path]) {
    throw fail('target content changed after installation')
  }
}

export async function removeOwnedSkillPath(
  receipt: SkillOwnershipReceipt,
  path: string,
): Promise<void> {
  const root = receipt.skillRoots.find((candidate) => dirname(path) === candidate)
  if (!root) throw fail('contains an owned path outside its captured roots')
  const snapshot = await prepareOwnedPathRemoval(root, path)
  await removeOwnedDirectoryViaQuarantine(snapshot, {
    verify: async (quarantinePath) => verifyOwnedSkillPath(receipt, path, quarantinePath),
  })
}

export async function removeSkillOwnershipReceipt(
  ctx: Pick<InstallContext, 'manifest' | 'hostContext'>,
): Promise<void> {
  await rm(skillOwnershipReceiptPath(ctx), { force: true })
}
