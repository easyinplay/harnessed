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
