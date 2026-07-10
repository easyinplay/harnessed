// 4.23.0 (issue #3) — pack skill-name audit around flat-namespace installs.
//
// `~/.claude/skills/` is flat and unnamespaced; skill packs (npx-skill /
// git-clone / npm-cli installers) copy their upstream's skills wholesale into
// it, so a pack skill named like a harnessed workflow (mattpocock `research`,
// gstack `retro`) silently clobbers the engine's file — the observed issue #3
// failure. The external writers (skills CLI, gstack ./setup, gsd-core installer)
// cannot be intercepted, so the defense is:
//   - PRE-install: warn when the manifest's declared `installs_skills` intersects
//     the shipped workflow names (collision is knowable before the write);
//   - POST-install: snapshot-diff the skills dir — warn on collisions AND on new
//     names the manifest did NOT declare (upstream drift detector, requested
//     change 5).
// Setup's end-of-run integrity pass (skillIntegrity.ts) is the self-heal
// backstop regardless of what these warnings caught.
//
// Everything here is advisory + fail-soft: an unreadable dir or missing
// workflows tree must never fail an install.

import { readdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { getAssetsRoot } from '../../cli/lib/assetsRoot.js'
import { scanWorkflowsNested } from '../../cli/lib/scan-nested.js'
import { getSkillsDir } from './platform.js'
import type { InstallContext } from './types.js'

/** Names currently present in the flat skills dir (empty set on any error). */
export async function snapshotSkillNames(skillsDir: string = getSkillsDir()): Promise<Set<string>> {
  try {
    const entries = await readdir(skillsDir, { withFileTypes: true })
    return new Set(entries.filter((e) => e.isDirectory()).map((e) => e.name))
  } catch {
    return new Set()
  }
}

let workflowNamesCache: Set<string> | null = null

/** Flat names of every shipped harnessed workflow (memoized; empty on error). */
export async function shippedWorkflowNames(): Promise<Set<string>> {
  if (workflowNamesCache) return workflowNamesCache
  try {
    const workflowsDir = resolve(getAssetsRoot(), 'workflows')
    const entries = await readdir(workflowsDir)
    const { workflows } = await scanWorkflowsNested(workflowsDir, entries)
    workflowNamesCache = new Set(workflows.map((w) => w.name))
  } catch {
    workflowNamesCache = new Set()
  }
  return workflowNamesCache
}

/** Test hook — reset the memoized workflow-name set. */
export function resetShippedWorkflowNamesCache(): void {
  workflowNamesCache = null
}

function declaredSkills(ctx: InstallContext): string[] {
  const declared = (ctx.manifest.spec.install as { installs_skills?: unknown }).installs_skills
  return Array.isArray(declared) ? declared.filter((s): s is string => typeof s === 'string') : []
}

/** PRE-install: declared-name ∩ shipped-workflow-name collisions → warn. */
export async function warnDeclaredCollisions(ctx: InstallContext): Promise<void> {
  try {
    const declared = declaredSkills(ctx)
    if (declared.length === 0) return
    const workflows = await shippedWorkflowNames()
    const collisions = declared.filter((s) => workflows.has(s))
    if (collisions.length === 0) return
    console.warn(
      `⚠ [${ctx.manifest.metadata.name}] declares skill name(s) colliding with harnessed workflows: ${collisions.join(', ')} — the pack copy would shadow the engine workflow. Setup's integrity pass will restore the harnessed version; the pack's same-named skill will not be reachable.`,
    )
  } catch {
    /* advisory only */
  }
}

/** POST-install: snapshot-diff → warn on undeclared new names + collisions. */
export async function auditPostInstall(
  ctx: InstallContext,
  before: Set<string>,
  skillsDir: string = getSkillsDir(),
): Promise<void> {
  try {
    const after = await snapshotSkillNames(skillsDir)
    const added = [...after].filter((n) => !before.has(n))
    if (added.length === 0) return
    const declared = new Set(declaredSkills(ctx))
    const pack = ctx.manifest.metadata.name

    const undeclared = added.filter((n) => !declared.has(n))
    if (declared.size > 0 && undeclared.length > 0) {
      console.warn(
        `⚠ [${pack}] installed skill name(s) not declared in installs_skills: ${undeclared.join(', ')} — upstream added skills; update the manifest declaration so collisions stay detectable.`,
      )
    }

    const workflows = await shippedWorkflowNames()
    const collisions = added.filter((n) => workflows.has(n))
    if (collisions.length > 0) {
      console.warn(
        `⚠ [${pack}] overwrote harnessed workflow skill(s): ${collisions.join(', ')} — the engine workflow at that name is now shadowed. Setup's end-of-run integrity pass restores it; re-run \`harnessed setup\` if you installed this pack standalone.`,
      )
    }
  } catch {
    /* advisory only */
  }
}
