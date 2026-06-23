// v3.4.2 redesign — Capability presence resolver for SKILL.md template rendering.
//
// Background (why v3.4.1 was wrong):
//   v3.4.1 assumed every external slash command came from a Claude Code marketplace
//   plugin and rendered as `/<plugin-name>:<bare>` (e.g. `/gstack:review`). User
//   dogfood install verified this is false on TWO fronts:
//     (a) gstack / mattpocock / gsd are user-skills (git clone into
//         ~/.claude/skills/<x>/), NOT plugins. They never appear in
//         installed_plugins.json.
//     (b) Claude Code plugin slash-commands themselves are bare too — a plugin's
//         `commands/<x>.md` file becomes `/<x>` directly with NO `<plugin>:`
//         prefix. (Verified against the real `code-review` plugin layout:
//         `~/.claude/plugins/cache/.../code-review/.../commands/code-review.md`
//         → slash `/code-review`, not `/code-review:code-review`.)
//   So v3.4.1's whole `/<ns>:<bare>` mutation was misguided. The cmd field in
//   capabilities.yaml already holds the actual invocable slash command verbatim.
//
// Design (v3.4.2):
//   The resolver no longer mutates cmd. It only PRESENCE-CHECKS the backing
//   capability and emits a warning when declared but missing. Two install paths:
//
//     install_type: plugin    → look up `plugin_id` in
//                                ~/.claude/plugins/installed_plugins.json
//                                (key prefix before `@`).
//     install_type: user-skill → look up `skill_dir` directory under
//                                ~/.claude/skills/<skill_dir>/.
//     install_type omitted    → no check (built-in / cli / mcp / sentinel /
//                                pre-namespaced superpowers cmds).
//
// Both `plugin_id` and `skill_dir` are explicit (no auto-derivation from capability
// key). Explicit > implicit when one capability key (e.g. `gstack-review`) maps to
// a different lookup id (`gstack` skill_dir). Karpathy simplicity: explicit fields
// avoid magic, schema stays additive, future capabilities are obvious.

import { readdirSync, readFileSync } from 'node:fs'
import { getPluginsRegistry, getSkillsDir } from '../../installers/lib/platform.js'

/** Minimal shape needed from capabilities.yaml — additive yaml-tolerant. */
export interface CapabilityEntry {
  cmd: string
  impl?: string
  /**
   * v3.4.2: which presence-check path(s) to run. Omit for no check.
   *
   * Single value (e.g. `'plugin'` or `'user-skill'`) → check that one path only.
   *
   * Array (e.g. `['plugin', 'user-skill']`) → "互为补充" dual-install support:
   * resolver tries each declared path; **any one detected = OK no warning**.
   * Only if ALL declared paths are missing does it emit a combined warning
   * listing every install method. Both `plugin_id` and `skill_dir` should be
   * populated when the array form is used so each path has a concrete lookup.
   */
  install_type?: 'plugin' | 'user-skill' | ReadonlyArray<'plugin' | 'user-skill'>
  /** v3.4.2: lookup key in installed_plugins.json (left side of `<name>@<marketplace>`). */
  plugin_id?: string
  /** v3.4.2: lookup directory under ~/.claude/skills/. */
  skill_dir?: string
}

/** Capabilities map keyed by capability name (e.g. `gstack-review` → entry). */
export type CapabilityMap = Record<string, CapabilityEntry>

/** Resolver result for a single capability cmd render. */
export interface ResolvedCmd {
  /** ALWAYS = cmd unchanged. Resolver never mutates the cmd. */
  renderedCmd: string
  /** Populated when install_type declared but capability not detected on disk. */
  warning?: string
}

/**
 * Parse `~/.claude/plugins/installed_plugins.json` → Set of installed plugin names.
 *
 * File shape (verified 2026-05-24 on user's machine):
 *   { version: 2, plugins: { "<pluginName>@<marketplaceId>": [{ ... }], ... } }
 *
 * The `<pluginName>` portion (left of `@`) is what we match against
 * `capability.plugin_id`. Tolerant of missing/malformed file — returns empty Set
 * so setup remains non-blocking on discovery failure (sister fallback 铁律 1).
 */
export function readInstalledPlugins(homedirOverride?: string): Set<string> {
  // D2: thread the test/override home through the resolver instead of
  // re-hardcoding `.claude`. `undefined` → resolver defaults to homedir().
  const path = getPluginsRegistry(homedirOverride)
  // Phase C / D4: a platform without a plugin registry (codex) returns null →
  // no plugins to enumerate. Return empty Set (no fs read).
  if (path === null) return new Set()
  let raw: string
  try {
    raw = readFileSync(path, 'utf8')
  } catch {
    return new Set()
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return new Set()
  }
  if (!parsed || typeof parsed !== 'object') return new Set()
  const plugins = (parsed as { plugins?: unknown }).plugins
  if (!plugins || typeof plugins !== 'object') return new Set()
  const out = new Set<string>()
  for (const key of Object.keys(plugins)) {
    const at = key.indexOf('@')
    if (at <= 0) continue // defensive: skip malformed keys without `@` separator
    out.add(key.slice(0, at))
  }
  return out
}

/**
 * List directories under `~/.claude/skills/` → Set of installed user-skill dir
 * names. Each directory represents one user-skill (whether single-skill flat
 * dir like `diagnose/SKILL.md`, or umbrella dir like `gstack/<sub>/SKILL.md`).
 *
 * Tolerant of missing skills dir (returns empty Set) — first-time users with no
 * user-skills installed simply see warnings for any user-skill capabilities.
 */
export function readInstalledUserSkills(homedirOverride?: string): Set<string> {
  // D2: resolver threads the optional home; default → homedir().
  const skillsRoot = getSkillsDir(homedirOverride)
  try {
    const entries = readdirSync(skillsRoot, { withFileTypes: true })
    const out = new Set<string>()
    for (const e of entries) if (e.isDirectory()) out.add(e.name)
    return out
  } catch {
    return new Set()
  }
}

/**
 * Resolve a single capability presence + return cmd UNCHANGED + optional warning.
 *
 * - install_type omitted → return cmd unchanged, no check, no warning.
 * - install_type: plugin AND plugin_id present in installedPlugins → cmd
 *   unchanged, no warning.
 * - install_type: plugin AND plugin_id MISSING → cmd unchanged, warning with
 *   plugin install hint.
 * - install_type: user-skill AND skill_dir present in installedUserSkills →
 *   cmd unchanged, no warning.
 * - install_type: user-skill AND skill_dir MISSING → cmd unchanged, warning
 *   with git-clone install hint.
 *
 * Missing `plugin_id` / `skill_dir` for the corresponding install_type emits
 * a schema-level warning (config bug — capability misdeclared).
 */
export function resolveCapabilityCmd(
  capability: CapabilityEntry,
  installedPlugins: Set<string>,
  installedUserSkills: Set<string>,
): ResolvedCmd {
  const { cmd, install_type, plugin_id, skill_dir } = capability

  if (!install_type) return { renderedCmd: cmd }

  // Normalize single string → array. Array form ("互为补充" dual-install):
  // any one path detected = OK no warning; ALL missing = combined warning.
  const types = Array.isArray(install_type) ? install_type : [install_type]

  // De-dupe + preserve declared order (stable for consistent warning text).
  const uniqueTypes = [...new Set(types)]

  // Per-path probe; collect missing hints + detect any hit.
  const missingHints: string[] = []
  let anyDetected = false

  for (const t of uniqueTypes) {
    if (t === 'plugin') {
      if (!plugin_id) {
        missingHints.push(
          `install_type=plugin declared but no plugin_id (capabilities.yaml schema bug)`,
        )
        continue
      }
      if (installedPlugins.has(plugin_id)) {
        anyDetected = true
        break // short-circuit on first hit
      }
      missingHints.push(`plugin '${plugin_id}' (\`claude plugin install ${plugin_id}\`)`)
    } else {
      // 'user-skill'
      if (!skill_dir) {
        missingHints.push(
          `install_type=user-skill declared but no skill_dir (capabilities.yaml schema bug)`,
        )
        continue
      }
      if (installedUserSkills.has(skill_dir)) {
        anyDetected = true
        break
      }
      missingHints.push(
        `user-skill '${skill_dir}' under ~/.claude/skills/ (git clone the official repo; e.g. gstack: \`git clone https://github.com/garrytan/gstack.git ~/.claude/skills/gstack && cd ~/.claude/skills/gstack && ./setup\`)`,
      )
    }
  }

  if (anyDetected) return { renderedCmd: cmd }

  // All declared paths missing. Combined warning lists every install method.
  const prefix = uniqueTypes.length > 1 ? '[multi]' : `[${uniqueTypes[0]}]`
  const joined = missingHints.join(' OR ')
  return {
    renderedCmd: cmd,
    warning: `${prefix} '${cmd}' backing missing — install either: ${joined}.`,
  }
}

/** Regex matches `{{ capabilities.<name>.cmd }}` allowing flexible whitespace. */
const CAPABILITY_CMD_TEMPLATE = /\{\{\s*capabilities\.([a-zA-Z0-9_-]+)\.cmd\s*\}\}/g

/** Result of rendering a SKILL.md body. */
export interface RenderedSkill {
  /** SKILL.md body with all `{{ capabilities.*.cmd }}` placeholders replaced. */
  body: string
  /** Unique warning lines collected (deduped) — caller emits as summary block. */
  warnings: string[]
}

/**
 * Render all `{{ capabilities.<name>.cmd }}` placeholders in a SKILL.md body.
 *
 * - Unknown capability name → leave placeholder verbatim + emit warning (so
 *   broken refs are visible in the rendered file AND in the setup summary).
 * - Per-capability resolver warnings (plugin/user-skill missing) deduplicated
 *   across multiple references within and across files.
 */
export function renderSkillBody(
  body: string,
  capabilities: CapabilityMap,
  installedPlugins: Set<string>,
  installedUserSkills: Set<string>,
): RenderedSkill {
  const warningsSet = new Set<string>()
  const out = body.replace(CAPABILITY_CMD_TEMPLATE, (match, name: string) => {
    const cap = capabilities[name]
    if (!cap) {
      warningsSet.add(
        `capability '${name}' referenced in SKILL.md but not defined in capabilities.yaml`,
      )
      return match // preserve literal so issue is visible to skill consumer
    }
    const { renderedCmd, warning } = resolveCapabilityCmd(
      cap,
      installedPlugins,
      installedUserSkills,
    )
    if (warning) warningsSet.add(warning)
    return renderedCmd
  })
  return { body: out, warnings: [...warningsSet] }
}
