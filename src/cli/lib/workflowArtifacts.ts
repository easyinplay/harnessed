import { cp, lstat, mkdir, readdir, realpath } from 'node:fs/promises'
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import { skillBodyFilename } from './resolveSkillBody.js'

/** Copy-stage declarations for ONE selected bundled workflow, never an inventory
 * of the destination directory. Backup/ledger files and upstream skills are not
 * part of this surface. Locale inputs are removed by renderSkillFile afterwards. */
export interface WorkflowArtifact {
  source: string
  path: string
  classification: 'payload' | 'locale-input'
}

export async function enumerateWorkflowArtifacts(
  sourceDir: string,
  destinationDir: string,
): Promise<WorkflowArtifact[]> {
  const artifacts: WorkflowArtifact[] = []
  async function walk(source: string, destination: string): Promise<void> {
    const entries = await readdir(source, { withFileTypes: true })
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      const from = join(source, entry.name)
      const path = join(destination, entry.name)
      if (entry.isDirectory()) await walk(from, path)
      else
        artifacts.push({
          source: from,
          path,
          classification:
            source === sourceDir && entry.name === skillBodyFilename('zh-Hans')
              ? 'locale-input'
              : 'payload',
        })
    }
  }
  await walk(sourceDir, destinationDir)
  return artifacts
}

/** Project missing descendants from the nearest existing canonical ancestor. */
async function canonicalDestination(path: string): Promise<string> {
  let candidate = path
  const missing: string[] = []
  for (;;) {
    try {
      return resolve(await realpath(candidate), ...missing)
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
      const parent = dirname(candidate)
      if (parent === candidate) throw error
      missing.unshift(basename(candidate))
      candidate = parent
    }
  }
}

async function preflightDestinations(
  destinationDir: string,
  artifacts: readonly WorkflowArtifact[],
): Promise<void> {
  const root = resolve(destinationDir)
  // Aliases at skillsBase/home are trusted; links at/under the workflow are not.
  const canonicalRoot = join(await canonicalDestination(dirname(root)), basename(root))
  const directories = new Set([root])
  const targets = new Set([root])
  for (const artifact of artifacts) {
    const target = resolve(artifact.path)
    const rel = relative(root, target)
    if (rel === '' || rel === '..' || rel.startsWith(`..${sep}`) || isAbsolute(rel)) {
      throw new Error(`workflow artifact escapes destination: ${artifact.path}`)
    }
    targets.add(target)
    for (let parent = dirname(target); parent !== root; parent = dirname(parent)) {
      directories.add(parent)
      targets.add(parent)
    }
  }
  // Preflight the WHOLE write set before creating even the first directory.
  for (const path of targets) {
    try {
      const entry = await lstat(path)
      if (entry.isSymbolicLink()) throw new Error(`refusing workflow destination link: ${path}`)
      if (directories.has(path) && !entry.isDirectory()) {
        throw new Error(`workflow destination is not a directory: ${path}`)
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
    }
    const projected = resolve(canonicalRoot, relative(root, path))
    if (relative(projected, await canonicalDestination(path)) !== '') {
      throw new Error(`workflow destination escapes canonical target: ${path}`)
    }
  }
}

/** Step A's copy only: its caller still owns backup/warn/overwrite policy, and
 * Step A.5 still owns locale/host rendering. Every copied file is declared. */
export async function copyWorkflowArtifacts(
  sourceDir: string,
  destinationDir: string,
): Promise<void> {
  const artifacts = await enumerateWorkflowArtifacts(sourceDir, destinationDir)
  await preflightDestinations(destinationDir, artifacts)
  for (const artifact of artifacts) {
    await mkdir(dirname(artifact.path), { recursive: true })
    await cp(artifact.source, artifact.path, { force: true })
  }
}
