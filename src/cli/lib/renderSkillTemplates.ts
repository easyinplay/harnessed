// v3.4.1 hotfix — Render capability template placeholders in installed SKILL.md.
//
// Setup pipeline:
//   1. `cp` recursively copies workflows/<x>/ → ~/.claude/skills/<x>/ (existing).
//   2. THIS module post-processes copied SKILL.md files: regex-replace
//      `{{ capabilities.<name>.cmd }}` placeholders with resolver output.
//   3. Warnings collected per skill, returned to setup.ts for end-of-run summary.
//
// Karpathy simplicity: file ≤ 200 LOC; no new deps; reads capabilities.yaml once.

import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { parse as parseYaml } from 'yaml'
import { type CapabilityMap, readInstalledPlugins, renderSkillBody } from './capabilityResolver.js'

/** Per-skill render outcome — passed back to setup.ts for log emission. */
export interface SkillRenderResult {
  /** Skill name (e.g. `verify-paranoid`). */
  name: string
  /** Skill SKILL.md absolute path that was rewritten (or attempted). */
  skillPath: string
  /** True when at least one placeholder was substituted. */
  rendered: boolean
  /** Resolver warnings (plugin missing, unknown capability ref, etc). */
  warnings: string[]
  /** Hard error (read/parse/write failure) — caller emits warn and continues. */
  error?: string
}

/** Load + parse `<workflowsDir>/capabilities.yaml` → CapabilityMap. */
export async function loadCapabilities(workflowsDir: string): Promise<CapabilityMap> {
  const path = join(workflowsDir, 'capabilities.yaml')
  const raw = await readFile(path, 'utf8')
  const doc = parseYaml(raw) as { capabilities?: CapabilityMap }
  return doc?.capabilities ?? {}
}

/**
 * Render `{{ capabilities.<name>.cmd }}` placeholders in a single installed
 * `~/.claude/skills/<name>/SKILL.md` file in-place.
 *
 * Non-fatal: any read/write/parse error returns a result with `error` set so
 * caller (setup.ts) can warn-and-continue (sister fallback 铁律 1).
 */
export async function renderSkillFile(
  skillName: string,
  skillsBase: string,
  capabilities: CapabilityMap,
  installedPlugins: Set<string>,
): Promise<SkillRenderResult> {
  const skillPath = join(skillsBase, skillName, 'SKILL.md')
  const result: SkillRenderResult = {
    name: skillName,
    skillPath,
    rendered: false,
    warnings: [],
  }
  let body: string
  try {
    body = await readFile(skillPath, 'utf8')
  } catch (e) {
    result.error = `read failed: ${(e as Error).message}`
    return result
  }
  const rendered = renderSkillBody(body, capabilities, installedPlugins)
  if (rendered.body === body) {
    // No placeholders found — no-op (e.g. research/SKILL.md has none).
    result.warnings = rendered.warnings
    return result
  }
  try {
    await writeFile(skillPath, rendered.body, 'utf8')
    result.rendered = true
    result.warnings = rendered.warnings
  } catch (e) {
    result.error = `write failed: ${(e as Error).message}`
  }
  return result
}

/**
 * Render placeholders for many installed skills in sequence (small N — 25 skills).
 * Serial avoids fs write contention; total cost is <100ms in practice.
 */
export async function renderAllSkills(
  skillNames: string[],
  skillsBase: string,
  workflowsDir: string,
  homedirOverride?: string,
): Promise<{ results: SkillRenderResult[]; aggregatedWarnings: string[] }> {
  let capabilities: CapabilityMap = {}
  try {
    capabilities = await loadCapabilities(workflowsDir)
  } catch (e) {
    // capabilities.yaml unreadable → return all-skipped result with a single
    // aggregated warning. Setup remains non-blocking.
    return {
      results: skillNames.map((name) => ({
        name,
        skillPath: join(skillsBase, name, 'SKILL.md'),
        rendered: false,
        warnings: [],
        error: `capabilities.yaml load failed: ${(e as Error).message}`,
      })),
      aggregatedWarnings: [
        `capabilities.yaml unreadable — SKILL.md placeholders left verbatim (${(e as Error).message})`,
      ],
    }
  }
  const installedPlugins = readInstalledPlugins(homedirOverride)
  const results: SkillRenderResult[] = []
  const warningSet = new Set<string>()
  for (const name of skillNames) {
    const r = await renderSkillFile(name, skillsBase, capabilities, installedPlugins)
    results.push(r)
    for (const w of r.warnings) warningSet.add(w)
    if (r.error) warningSet.add(`${name}: ${r.error}`)
  }
  return { results, aggregatedWarnings: [...warningSet] }
}
