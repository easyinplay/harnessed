// v3.4.1 hotfix — Capability namespace resolver for SKILL.md template rendering.
//
// Problem (v3.4.0 ship bug):
//   Sub-workflow SKILL.md sources contain `{{ capabilities.<name>.cmd }}` Jinja-style
//   placeholders that were never rendered at install time. End users see literal
//   template strings in their installed `~/.claude/skills/<x>/SKILL.md`, so the
//   "actual gstack /review" intent never reaches Claude Code as an invocable slash
//   command. Worse, gstack ships as a Claude Code plugin under namespace `gstack:`,
//   so even the bare `/review` would not resolve — the real cmd is `/gstack:review`.
//
// Fix (option 3 high-delivery, LOCKED by user 2026-05-24):
//   1. Setup-time resolver reads `~/.claude/plugins/installed_plugins.json`,
//      derives plugin → namespace map (e.g. `gstack` → `gstack:` prefix).
//   2. capabilities.yaml entries gain optional `plugin_namespace: <name>` field
//      (additive — old consumers ignore unknown key).
//   3. SKILL.md install pipeline (setup-helpers.ts) regex-replaces
//      `{{ capabilities.<name>.cmd }}` with the resolved namespaced cmd
//      (`/gstack:review`) when plugin installed, OR with a `⚠️ not installed`
//      placeholder + warning when plugin absent.
//   4. Warnings collected and emitted as summary block at end of setup with
//      actionable install hints.
//
// Karpathy simplicity: ≤200 LOC, zero new npm deps (regex template replace inline).

import { readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

/** Minimal shape needed from capabilities.yaml — keep flexible for additive yaml evolution. */
export interface CapabilityEntry {
  cmd: string
  impl?: string
  plugin_namespace?: string
}

/** Capabilities map keyed by capability name (e.g. `gstack-review` → entry). */
export type CapabilityMap = Record<string, CapabilityEntry>

/** Resolver result for a single capability cmd render. */
export interface ResolvedCmd {
  /** Fully rendered cmd string to splice into SKILL.md (e.g. `/gstack:review`). */
  renderedCmd: string
  /** Warning when plugin_namespace declared but plugin not installed. */
  warning?: string
}

/**
 * Read `~/.claude/plugins/installed_plugins.json` and derive plugin → namespace map.
 *
 * installed_plugins.json structure (verified 2026-05-24):
 *   { version: 2, plugins: { "<pluginName>@<marketplaceId>": [{ ... }], ... } }
 *
 * The `<pluginName>` (left of `@`) is the Claude Code plugin slash-cmd namespace
 * prefix. e.g. `gstack@gstack-dev/marketplace` → namespace `gstack` →
 * slash-cmd form `/gstack:<bareCmd>`. Returns a Set<string> of installed plugin
 * names for O(1) presence checks. Tolerant of missing/malformed file (returns
 * empty Set) — Setup remains non-blocking on plugin-discovery failure (sister
 * fallback 铁律 1: warn + skip, never abort).
 */
export function readInstalledPlugins(homedirOverride?: string): Set<string> {
  const home = homedirOverride ?? homedir()
  const path = join(home, '.claude', 'plugins', 'installed_plugins.json')
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
    // `<pluginName>@<marketplaceId>` — split on first `@`. Defensive: skip keys
    // missing `@` (forward-compat with any future format change).
    const at = key.indexOf('@')
    if (at <= 0) continue
    out.add(key.slice(0, at))
  }
  return out
}

/**
 * Resolve a single capability cmd to its rendered form.
 *
 * Rules:
 *   1. No `plugin_namespace` field → return cmd unchanged (works for `superpowers:*`
 *      cmds already pre-namespaced, behavioral sentinels, CLI tool names, etc).
 *   2. `plugin_namespace` declared AND plugin installed → strip leading `/` from
 *      cmd, prepend `/<namespace>:`. e.g. `/review` + ns=`gstack` → `/gstack:review`.
 *   3. `plugin_namespace` declared AND plugin NOT installed → return original cmd
 *      + warning (so SKILL.md still has SOMETHING resolvable, with `⚠️` flag).
 *
 * Edge cases handled:
 *   - cmd that already contains `:` (already namespaced e.g. `superpowers:tdd`):
 *     pass-through unchanged regardless of plugin_namespace (avoid double-prefix).
 *   - cmd without leading `/` (rare bare cmd / sentinel `<not-applicable-behavioral>`):
 *     leave as-is.
 */
export function resolveCapabilityCmd(
  capability: CapabilityEntry,
  installedPlugins: Set<string>,
): ResolvedCmd {
  const { cmd, plugin_namespace } = capability

  // Rule 1 — no namespace declared: unchanged
  if (!plugin_namespace) return { renderedCmd: cmd }

  // Edge — cmd already contains `:` (pre-namespaced e.g. `superpowers:tdd`):
  // do not double-prefix; trust the cmd field source-of-truth.
  if (cmd.includes(':')) return { renderedCmd: cmd }

  // Edge — sentinel / bare non-slash cmd (behavioral / cli tool name): pass-through.
  if (!cmd.startsWith('/')) return { renderedCmd: cmd }

  // Rule 3 — namespace declared but plugin not installed: warn + return bare cmd.
  if (!installedPlugins.has(plugin_namespace)) {
    return {
      renderedCmd: cmd,
      warning: `plugin '${plugin_namespace}' not installed — '${cmd}' will not resolve via Claude Code. install: 'claude plugin install ${plugin_namespace}' or see plugin docs.`,
    }
  }

  // Rule 2 — namespace declared AND installed: render full namespaced form.
  const bare = cmd.slice(1) // strip leading `/`
  return { renderedCmd: `/${plugin_namespace}:${bare}` }
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
 *   broken refs are visible in output AND surfaced in setup summary).
 * - Resolver warnings (plugin missing) deduplicated across multiple references.
 */
export function renderSkillBody(
  body: string,
  capabilities: CapabilityMap,
  installedPlugins: Set<string>,
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
    const { renderedCmd, warning } = resolveCapabilityCmd(cap, installedPlugins)
    if (warning) warningsSet.add(warning)
    return renderedCmd
  })
  return { body: out, warnings: [...warningsSet] }
}
