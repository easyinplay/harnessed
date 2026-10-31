import type { Dirent } from 'node:fs'
import { lstat, readdir, readFile, realpath } from 'node:fs/promises'
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import { writeSkillOwnershipReceipt } from './skillOwnershipReceipt.js'
import type { InstallContext } from './types.js'

type OwnershipKind = 'file' | 'directory'
type OwnershipRoot = 'platform-skills' | 'native-home' | 'host-agents' | 'host-commands'

export interface DeclaredOwnershipResource {
  path: string
  root: string
  kind: OwnershipKind
}

export interface DeclaredOwnership {
  resources: DeclaredOwnershipResource[]
  roots: string[]
  paths: string[]
}

interface OwnershipResource {
  root: OwnershipRoot
  kind: OwnershipKind
  selector: { names?: string[]; prefix?: string }
  marker: { path?: string; contains: string }
}

function isResource(value: unknown): value is OwnershipResource {
  if (!value || typeof value !== 'object') return false
  const resource = value as Partial<OwnershipResource>
  const selector = resource.selector
  const marker = resource.marker
  const roots: OwnershipRoot[] = ['platform-skills', 'native-home', 'host-agents', 'host-commands']
  const hasNames =
    Array.isArray(selector?.names) &&
    selector.names.length > 0 &&
    new Set(selector.names).size === selector.names.length &&
    selector.names.every((name) => typeof name === 'string' && name.length > 0)
  const hasPrefix = typeof selector?.prefix === 'string' && selector.prefix.length > 0
  return (
    roots.includes(resource.root as OwnershipRoot) &&
    (resource.kind === 'file' || resource.kind === 'directory') &&
    Boolean(hasNames) !== Boolean(hasPrefix) &&
    typeof marker?.contains === 'string' &&
    marker.contains.length > 0 &&
    (resource.kind === 'file'
      ? marker.path === undefined || isSafeMarkerPath(marker.path)
      : typeof marker.path === 'string' && isSafeMarkerPath(marker.path))
  )
}

function isSafeMarkerPath(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    !value.startsWith('/') &&
    !/^[A-Za-z]:\//.test(value) &&
    !value.includes('\\') &&
    value.split('/').every((part) => part.length > 0 && part !== '.' && part !== '..')
  )
}

function resourcesFor(ctx: InstallContext): OwnershipResource[] {
  const ownership = (ctx.manifest.spec as unknown as { ownership?: { resources?: unknown } })
    .ownership
  if (!Array.isArray(ownership?.resources)) return []
  if (!ownership.resources.every(isResource)) throw new Error('invalid ownership declaration')
  return ownership.resources
}

function rootPath(ctx: InstallContext, root: OwnershipRoot): string | null {
  const host = ctx.hostContext
  if (!host) return null
  const roots: Record<OwnershipRoot, string> = {
    'platform-skills': host.platform.skillsDir,
    'native-home': host.nativeHome,
    'host-agents': join(host.nativeHome, 'agents'),
    'host-commands': host.platform.commandsDir,
  }
  return resolve(roots[root])
}

function isInside(root: string, path: string): boolean {
  const rel = relative(root, path)
  return rel !== '' && !rel.startsWith('..') && !isAbsolute(rel)
}

function selected(resource: OwnershipResource, name: string): boolean {
  const { names, prefix } = resource.selector
  return Boolean(names?.includes(name) || (prefix?.length && name.startsWith(prefix)))
}

async function regularMarker(
  candidate: string,
  canonicalCandidate: string,
  resource: OwnershipResource,
): Promise<boolean> {
  const markerRelativePath = resource.marker.path
  if (resource.kind === 'directory' && !markerRelativePath) return false
  const markerPath =
    resource.kind === 'file' ? candidate : resolve(candidate, markerRelativePath as string)
  if (resource.kind === 'directory' && !isInside(candidate, markerPath)) return false
  try {
    if (resource.kind === 'directory') {
      const parts = relative(candidate, markerPath).split(sep)
      let current = candidate
      for (const [index, part] of parts.entries()) {
        current = join(current, part)
        const info = await lstat(current)
        if (info.isSymbolicLink()) return false
        if (index < parts.length - 1 && !info.isDirectory()) return false
        if (index === parts.length - 1 && !info.isFile()) return false
      }
      if (!isInside(canonicalCandidate, await realpath(markerPath))) return false
    }
    return (await readFile(markerPath, 'utf8')).includes(resource.marker.contains)
  } catch {
    return false
  }
}

async function discoverResource(
  ctx: InstallContext,
  resource: OwnershipResource,
): Promise<DeclaredOwnershipResource[]> {
  const root = rootPath(ctx, resource.root)
  if (!root) return []
  let canonicalRoot: string
  let entries: Dirent[]
  try {
    const rootInfo = await lstat(root)
    if (rootInfo.isSymbolicLink() || !rootInfo.isDirectory()) return []
    ;[canonicalRoot, entries] = await Promise.all([
      realpath(root),
      readdir(root, { withFileTypes: true }),
    ])
  } catch {
    return []
  }
  const resources: DeclaredOwnershipResource[] = []
  for (const entry of entries) {
    if (!selected(resource, entry.name)) continue
    const path = resolve(root, entry.name)
    try {
      const info = await lstat(path)
      if (info.isSymbolicLink()) continue
      if (resource.kind === 'directory' ? !info.isDirectory() : !info.isFile()) continue
      const canonicalPath = await realpath(path)
      if (dirname(canonicalPath) !== canonicalRoot) continue
      if (!(await regularMarker(path, canonicalPath, resource))) continue
      resources.push({ path, root, kind: resource.kind })
    } catch {}
  }
  return resources
}

async function snapshotResource(
  ctx: InstallContext,
  resource: OwnershipResource,
): Promise<DeclaredOwnershipResource[]> {
  const root = rootPath(ctx, resource.root)
  if (!root) return []
  let entries: Dirent[]
  try {
    const rootInfo = await lstat(root)
    if (rootInfo.isSymbolicLink() || !rootInfo.isDirectory()) return []
    entries = await readdir(root, { withFileTypes: true })
  } catch {
    return []
  }
  const resources: DeclaredOwnershipResource[] = []
  for (const entry of entries) {
    if (!selected(resource, entry.name)) continue
    const path = resolve(root, entry.name)
    resources.push({ path, root, kind: resource.kind })
  }
  return resources
}

export async function discoverDeclaredOwnership(ctx: InstallContext): Promise<DeclaredOwnership> {
  const declarations = resourcesFor(ctx)
  const discovered = (
    await Promise.all(declarations.map((resource) => discoverResource(ctx, resource)))
  )
    .flat()
    .sort((left, right) => left.path.localeCompare(right.path))
  const resources = [...new Map(discovered.map((resource) => [resource.path, resource])).values()]
  return {
    resources,
    roots: [
      ...new Set(
        declarations
          .map((resource) => rootPath(ctx, resource.root))
          .filter((root): root is string => root !== null),
      ),
    ].sort(),
    paths: resources.map((resource) => resource.path).sort(),
  }
}

export async function snapshotDeclaredOwnership(ctx: InstallContext): Promise<DeclaredOwnership> {
  const declarations = resourcesFor(ctx)
  const discovered = (
    await Promise.all(declarations.map((resource) => snapshotResource(ctx, resource)))
  )
    .flat()
    .sort((left, right) => left.path.localeCompare(right.path))
  const resources = [...new Map(discovered.map((resource) => [resource.path, resource])).values()]
  return {
    resources,
    roots: [
      ...new Set(
        declarations
          .map((resource) => rootPath(ctx, resource.root))
          .filter((root): root is string => root !== null),
      ),
    ].sort(),
    paths: resources.map((resource) => resource.path).sort(),
  }
}

export async function writeDeclaredOwnershipReceipt(
  ctx: InstallContext,
  ownership: Pick<DeclaredOwnership, 'roots' | 'paths'>,
): Promise<void> {
  await writeSkillOwnershipReceipt(ctx, ownership.roots, ownership.paths)
}
