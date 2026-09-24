// src/workflow/rolePrompts.ts — the workflows/role-prompts.yaml registry loader.
//
// architecture review #7 (slice 2b) — extracted from cli/lib/generateCommands.ts:
// the registry is workflow-domain data (per-sub specialist/checklist metadata the
// spawn path injects), consumed by workflow/run (SDK spawn), cli/prompt,
// cli/setup, and the command generator — a core module had to import UP into
// cli/lib to reach it. Now it lives beside its domain; generateCommands imports
// down like everyone else.

import { readFile } from 'node:fs/promises'
import { parse as parseYaml } from 'yaml'
import { getLocale, type SupportedLocale } from '../i18n/index.js'
import { resolveLocaleYaml } from '../i18n/localeYaml.js'

/** Per-sub-workflow metadata from `workflows/role-prompts.yaml`. */
export interface RolePrompt {
  /** Capability key whose `.cmd` is the preferred slash command. Empty for masters. */
  primary_cap: string
  /** Title of the expert persona used in the fallback Task-spawn prompt. */
  specialist: string
  /** One-line job description (string with leading verb). */
  responsibility: string
  /** Checklist items (5-10) — skipped for masters (empty array). */
  checklist: string[]
  /** Severity scale label rendered in report-format section. */
  severity: string
  /** YAML frontmatter `description` field for the generated commands/<x>.md. */
  description: string
  /** Master orchestrators are pure dispatchers (no role-prompt fallback). */
  is_master?: boolean
}

/** Full registry shape — `{ prompts: { <slash-name>: RolePrompt, ... } }`. */
interface RolePromptsDoc {
  prompts?: Record<string, RolePrompt>
}

/** Load and parse `<workflowsDir>/role-prompts.yaml` (or its locale sibling).
 *  Tolerant of missing file. Phase 33: `locale` (default `getLocale()`) selects
 *  `role-prompts.<locale>.yaml` when present — en serves the byte-identical base. */
export async function loadRolePrompts(
  workflowsDir: string,
  locale: SupportedLocale = getLocale(),
): Promise<Record<string, RolePrompt>> {
  const path = resolveLocaleYaml(workflowsDir, 'role-prompts', locale)
  let raw: string
  try {
    raw = await readFile(path, 'utf8')
  } catch {
    return {}
  }
  const doc = parseYaml(raw) as RolePromptsDoc | null
  return doc?.prompts ?? {}
}

/**
 * Apply `render` to the RolePrompt fields that end up in a spawned agent's
 * PROMPT BODY — `specialist` / `responsibility` / `checklist` / `severity`, i.e.
 * exactly what `buildAgentDef` (src/workflow/run.ts) splices into `prompt`.
 *
 * v16.0 Phase 65 T8 — the runtime hook for the `{{ host.* }}` family. Callers
 * pass a renderer bound to the host they are running UNDER (not an install
 * target); see src/cli/prompt.ts `buildPromptText` and run.ts.
 *
 * `description` is deliberately NOT rendered. It is the one field this registry
 * feeds to the INSTALL surface, where `src/cli/lib/generateCommands.ts` emits it
 * as the generated command's yaml frontmatter `description:` — a slot that is
 * explicitly held out of that file's host pass ("prompt.description is yaml
 * content, not a template"). A placeholder there would ship verbatim into
 * `<claude-home>/commands/<x>.md`. `primary_cap` / `is_master` are keys, not prose.
 *
 * The renderer is INJECTED rather than imported so this module stays free of
 * `src/cli/lib` (architecture review #7 — role-prompts is workflow-domain data
 * and should not import up into the CLI layer).
 */
export function mapRolePromptText(rp: RolePrompt, render: (body: string) => string): RolePrompt {
  // The yaml is untrusted input and this runs over EVERY entry before any single
  // one is used, so a malformed neighbour must not take the whole registry down
  // (it still reaches `buildAgentDef` exactly as malformed as it was).
  const s = (v: unknown): string => (typeof v === 'string' ? render(v) : (v as string))
  return {
    ...rp,
    specialist: s(rp.specialist),
    responsibility: s(rp.responsibility),
    checklist: Array.isArray(rp.checklist) ? rp.checklist.map((c) => s(c)) : rp.checklist,
    severity: s(rp.severity),
  }
}

/** {@link mapRolePromptText} across a whole registry (new object; input untouched). */
export function mapRolePromptsText(
  prompts: Record<string, RolePrompt>,
  render: (body: string) => string,
): Record<string, RolePrompt> {
  const out: Record<string, RolePrompt> = {}
  for (const [name, rp] of Object.entries(prompts)) out[name] = mapRolePromptText(rp, render)
  return out
}
