// v16.0 Phase 65 — read a `workflows/**/SKILL{,.zh-Hans}.md` SOURCE body and
// return it as the ACTIVE HOST actually receives it.
//
// Why this exists: from Phase 65 on, the host-specific wording in those bodies is
// a `{{ host.<primitive>[.<variant>] }}` placeholder resolved at install time from
// `workflows/host-primitives.yaml` (+ its `.zh-Hans` sibling). A content gate that
// greps the raw source therefore stops seeing the very sentence it guards — not
// because the contract was dropped, but because it moved one indirection away.
//
// The fix is to assert on the RENDERED artifact, which is strictly stronger than
// the old source grep: it proves both that the placeholder resolves AND that the
// resolved text still carries the contract. Re-grepping the source would only
// prove the second for whichever locale/host happened to be inlined.
//
// Uses the production renderer (src/cli/lib/hostPrimitives.ts), so an unknown
// primitive / variant / missing host column throws here exactly as it would
// during `harnessed setup`.

import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { parse as parseYaml } from 'yaml'
import {
  type HostId,
  type HostPrimitiveTable,
  renderHostPrimitives,
} from '../../src/cli/lib/hostPrimitives.js'
import {
  loadRolePrompts,
  mapRolePromptsText,
  type RolePrompt,
} from '../../src/workflow/rolePrompts.js'

const WORKFLOWS = resolve(process.cwd(), 'workflows')

/** Locale tables, memoized — these gates read many files per run. */
const tables = new Map<string, HostPrimitiveTable>()

/** Mirrors `resolveLocaleYaml`: `en` reads the base file, other locales read
 *  `host-primitives.<locale>.yaml`. */
function tableFor(locale: 'en' | 'zh-Hans'): HostPrimitiveTable {
  const cached = tables.get(locale)
  if (cached) return cached
  const file = locale === 'en' ? 'host-primitives.yaml' : `host-primitives.${locale}.yaml`
  const doc = parseYaml(readFileSync(join(WORKFLOWS, file), 'utf8')) as {
    primitives?: HostPrimitiveTable
  }
  const table = doc?.primitives ?? {}
  tables.set(locale, table)
  return table
}

/**
 * Read `workflows/<...segs>` and render its `{{ host.* }}` placeholders for
 * `host` (default `claude` — the byte-for-byte pre-Phase-65 wording).
 *
 * The locale table is picked from the filename, so `SKILL.zh-Hans.md` renders
 * against the zh-Hans table, exactly as the installer does.
 */
export function readRenderedSkill(segs: string[], host: HostId = 'claude'): string {
  const rel = segs.join('/')
  const body = readFileSync(join(WORKFLOWS, ...segs), 'utf8')
  const locale = rel.endsWith('.zh-Hans.md') ? 'zh-Hans' : 'en'
  return renderHostPrimitives(body, { host, table: tableFor(locale) })
}

/**
 * Same idea for a `workflows/**\/*.yaml` SOURCE — v16.0 Phase 65 T8 extended the
 * `{{ host.* }}` family to the RUNTIME surface (`role-prompts{,.zh-Hans}.yaml`,
 * `disciplines/language.yaml`), so content gates that grep those files need the
 * rendered text for the same reason the SKILL gates do.
 *
 * Renders the WHOLE file text rather than parsing first: placeholders only ever
 * occur inside scalar values, and a gate that greps raw source wants raw source
 * back — just with the indirection resolved. The locale table is picked from the
 * filename (`<base>.zh-Hans.yaml` → zh-Hans), mirroring `resolveLocaleYaml`.
 */
export function readRenderedWorkflowYaml(segs: string[], host: HostId = 'claude'): string {
  const rel = segs.join('/')
  const body = readFileSync(join(WORKFLOWS, ...segs), 'utf8')
  const locale = rel.endsWith('.zh-Hans.yaml') ? 'zh-Hans' : 'en'
  return renderHostPrimitives(body, { host, table: tableFor(locale) })
}

/**
 * The role-prompt registry as `buildAgentDef` will see it — i.e. what a spawned
 * subagent's prompt is built from, `{{ host.* }}` resolved (v16.0 Phase 65 T8).
 *
 * Renders exactly the prompt-body fields the production path renders
 * (`mapRolePromptsText`), so a gate asserting on `checklist` / `responsibility`
 * matches the runtime text. `description` stays raw here too — it is the one
 * field that reaches the install surface un-rendered.
 */
export async function readRenderedRolePrompts(
  locale: 'en' | 'zh-Hans' = 'en',
  host: HostId = 'claude',
): Promise<Record<string, RolePrompt>> {
  const table = tableFor(locale)
  return mapRolePromptsText(await loadRolePrompts(WORKFLOWS, locale), (body) =>
    renderHostPrimitives(body, { host, table }),
  )
}
