// v3.4.2 redesign — Render capability template placeholders in installed SKILL.md.
//
// Setup pipeline:
//   1. `cp` recursively copies workflows/<x>/ → ~/.claude/skills/<x>/ (existing).
//   2. THIS module post-processes copied SKILL.md files: regex-replace
//      `{{ capabilities.<name>.cmd }}` placeholders with resolver output.
//   3. Warnings collected per skill, returned to setup.ts for end-of-run summary.
//
// v3.4.2 change vs v3.4.1: resolver now receives BOTH installed plugin set AND
// installed user-skill set, so it can presence-check capabilities backed by either
// install path. The resolver never mutates cmd — it only emits warnings when
// install_type is declared and the backing capability is absent on disk.
//
// Karpathy simplicity: file ≤ 200 LOC; no new deps; reads capabilities.yaml once.

import { readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { parse as parseYaml } from 'yaml'
import { getLocale, type SupportedLocale } from '../../i18n/index.js'
import {
  type CapabilityMap,
  readInstalledPlugins,
  readInstalledUserSkills,
  renderSkillBody,
} from './capabilityResolver.js'
import { resolveSkillBodyFilename, skillBodyFilename } from './resolveSkillBody.js'

/** Locale body siblings to strip from the dest dir after the locale pick, so the
 *  install dir holds a single locale-correct SKILL.md (the exact name CC reads).
 *  Today only zh-Hans ships; extend when ja/ko/etc. tables land. */
const LOCALE_SIBLINGS: readonly SupportedLocale[] = ['zh-Hans']

/** Per-skill render outcome — passed back to setup.ts for log emission. */
export interface SkillRenderResult {
  /** Skill name (e.g. `verify-paranoid`). */
  name: string
  /** Skill SKILL.md absolute path that was rewritten (or attempted). */
  skillPath: string
  /** True when at least one placeholder was substituted. */
  rendered: boolean
  /** Resolver warnings (plugin / user-skill missing, unknown capability ref). */
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
  installedUserSkills: Set<string>,
  locale?: SupportedLocale,
): Promise<SkillRenderResult> {
  const dir = join(skillsBase, skillName)
  // Phase 29: dest holds a single SKILL.md (the exact name CC reads). The SOURCE
  // body is locale-picked (zh-Hans sibling when present + locale=zh), but the
  // rendered result is ALWAYS written to dest SKILL.md. en (or no sibling) →
  // srcName === 'SKILL.md' → byte-identical to pre-29 behavior (landmine 3).
  const resolved = locale ?? getLocale()
  const srcName = resolveSkillBodyFilename(dir, resolved)
  const srcPath = join(dir, srcName)
  const destPath = join(dir, 'SKILL.md')
  const result: SkillRenderResult = {
    name: skillName,
    skillPath: destPath,
    rendered: false,
    warnings: [],
  }
  let body: string
  try {
    body = await readFile(srcPath, 'utf8')
  } catch (e) {
    result.error = `read failed: ${(e as Error).message}`
    return result
  }
  const rendered = renderSkillBody(body, capabilities, installedPlugins, installedUserSkills)
  // Did the source differ from the dest SKILL.md? (Always true when a zh sibling
  // was selected — even if no placeholders changed — because the dest currently
  // carries the en body and must be overwritten with the zh body.)
  const localeBodySelected = srcName !== 'SKILL.md'
  const needsWrite = localeBodySelected || rendered.body !== body
  if (!needsWrite) {
    // No placeholders AND no locale switch — no-op (e.g. research/SKILL.md has none).
    result.warnings = rendered.warnings
    return result
  }
  try {
    await writeFile(destPath, rendered.body, 'utf8')
    result.rendered = rendered.body !== body
    result.warnings = rendered.warnings
  } catch (e) {
    result.error = `write failed: ${(e as Error).message}`
    return result
  }
  // Strip any locale-body siblings from the dest so the install dir holds a single
  // SKILL.md. ONLY runs when a locale body was actually selected — en path performs
  // no deletes, keeping the en install byte-for-byte identical (landmine 3).
  if (localeBodySelected) {
    for (const loc of LOCALE_SIBLINGS) {
      const sibling = skillBodyFilename(loc)
      if (sibling === 'SKILL.md') continue
      try {
        await rm(join(dir, sibling), { force: true })
      } catch {
        // non-fatal: leftover sibling is harmless (CC reads SKILL.md only).
      }
    }
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
  locale?: SupportedLocale,
): Promise<{ results: SkillRenderResult[]; aggregatedWarnings: string[] }> {
  // Resolve locale ONCE for the whole loop (don't make each renderSkillFile
  // re-detect — landmine 6 robust path). Caller (setup.ts) may also pass it.
  const resolvedLocale = locale ?? getLocale()
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
  const installedUserSkills = readInstalledUserSkills(homedirOverride)
  const results: SkillRenderResult[] = []
  const warningSet = new Set<string>()
  for (const name of skillNames) {
    const r = await renderSkillFile(
      name,
      skillsBase,
      capabilities,
      installedPlugins,
      installedUserSkills,
      resolvedLocale,
    )
    results.push(r)
    for (const w of r.warnings) warningSet.add(w)
    if (r.error) warningSet.add(`${name}: ${r.error}`)
  }
  return { results, aggregatedWarnings: [...warningSet] }
}
