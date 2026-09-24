// v16.0 Phase 65 T2 NEW — host-primitive render layer (pure functions).
//
// The SECOND placeholder family in workflows/**/SKILL.md bodies, sibling to
// `{{ capabilities.<x>.cmd }}` (./capabilityResolver.ts). Where the capability
// family answers "which slash command backs this step", this one answers
// "what does this harness CALL its version of this primitive" — so one
// SKILL.md source can install onto Claude Code or codex and name the right
// tool in the rendered artifact.
//
// Syntax (ASCII only; byte-identical in the en and zh-Hans yaml sources —
// only the rendered TEXT differs by locale):
//     {{ host.<primitive> }}              ≡ {{ host.<primitive>.default }}
//     {{ host.<primitive>.<variant> }}
//
// Deliberate divergence from renderSkillBody: this renderer THROWS on any
// unresolvable placeholder instead of preserving it verbatim with a warning.
// A silently-preserved `{{ host.* }}` — or a silent variant fallback — would
// ship a Claude-only primitive into a codex artifact with nothing downstream
// able to see it. Missing entries must fail at build time, loudly.
//
// Scope note (T2): this module is the mechanism only. Wiring it into the
// install path is a separate task; nothing here imports or mutates the
// existing renderer.

import { readFile } from 'node:fs/promises'
import { parse as parseYaml } from 'yaml'
import { getLocale, type SupportedLocale } from '../../i18n/index.js'
import { resolveLocaleYaml } from '../../i18n/localeYaml.js'
import type { PlatformDescriptor } from '../../platform/platform.js'

/**
 * The harnesses the primitive table covers. Derived from
 * `PlatformDescriptor['id']` (single source of truth) rather than re-declared,
 * and narrowed to the two ids that actually have SKILL.md install paths — a
 * descriptor id without a column in the table has no business being rendered.
 */
export type HostId = Extract<PlatformDescriptor['id'], 'claude' | 'codex'>

/**
 * Narrow a descriptor id to the table column that harness renders from.
 *
 * `PlatformDescriptor['id']` is a 6-member union, but only `claude` and `codex`
 * have descriptor implementations (`claudeDescriptor` / `codexDescriptor` in
 * src/platform/platform.ts) and `setup --platform` accepts only those two. The
 * remaining ids (`agents` / `cursor` / `gemini` / `copilot`) are reserved names
 * that no code path can produce today, so they render AS claude — the same
 * incumbent fallback `detectPlatform` itself takes at its level-5 branch. A
 * throw here would turn a forward-compat name into an install-time crash.
 */
export function toHostId(id: PlatformDescriptor['id']): HostId {
  return id === 'codex' ? 'codex' : 'claude'
}

/** Per-host text for one `<primitive>.<variant>` cell. Partial: the yaml is
 *  untrusted input, and a missing host column is a render-time error (not a
 *  parse-time one) so the message can name the placeholder site. */
export type HostPrimitiveEntry = Partial<Record<HostId, string>>

/** `<variant> → per-host text`. `default` is the bare-placeholder variant. */
export type HostPrimitiveVariants = Record<string, HostPrimitiveEntry>

/** `<primitive> → <variant> → per-host text` — the whole rendered table. */
export type HostPrimitiveTable = Record<string, HostPrimitiveVariants>

/** The `default` variant name — what a bare `{{ host.x }}` resolves to. */
export const DEFAULT_VARIANT = 'default'

/** Base name of the yaml surface (locale sibling: `<base>.<locale>.yaml`). */
const YAML_BASE = 'host-primitives'

/** Shape of the parsed yaml document. */
interface HostPrimitivesDoc {
  version?: number
  primitives?: HostPrimitiveTable
  /** Per-host caveats for the rendered host-map section — NOT a primitive table
   *  and deliberately NOT subject to the `default`/parity contracts. Only the
   *  hosts that need a section appear here (`claude` is absent by design). */
  host_map_notes?: Partial<Record<HostId, string[]>>
}

/** Options for {@link loadHostPrimitives}. */
export interface LoadHostPrimitivesOptions {
  /** Directory holding `host-primitives.yaml` (the `workflows/` tree). */
  workflowsDir: string
  /** Defaults to `getLocale()` so `--lang` / env flows through unchanged. */
  locale?: SupportedLocale
}

/**
 * Load `<workflowsDir>/host-primitives.yaml` (or its locale sibling).
 *
 * Locale selection is NOT re-implemented here — it delegates to
 * `resolveLocaleYaml`, so the policy is identical to role-prompts and
 * disciplines: `en` always reads the base file; a non-en locale reads
 * `host-primitives.<locale>.yaml` when it exists and otherwise falls back to
 * the base (drift-only — an absent sibling is never an error).
 *
 * Tolerant like `loadRolePrompts`: an unreadable / empty / `primitives`-less
 * file yields `{}`. All strictness lives in {@link renderHostPrimitives}, so a
 * missing table surfaces as a precise per-placeholder error rather than a
 * whole-file load failure.
 */
export async function loadHostPrimitives(
  opts: LoadHostPrimitivesOptions,
): Promise<HostPrimitiveTable> {
  const path = resolveLocaleYaml(opts.workflowsDir, YAML_BASE, opts.locale ?? getLocale())
  let raw: string
  try {
    raw = await readFile(path, 'utf8')
  } catch {
    return {}
  }
  const doc = parseYaml(raw) as HostPrimitivesDoc | null
  return doc?.primitives ?? {}
}

/**
 * Load `host_map_notes.<host>` from the same (locale-selected) yaml file.
 *
 * A SEPARATE read rather than a widened {@link loadHostPrimitives} return type:
 * every existing caller wants the table and nothing else, and the notes are read
 * once per `renderAllSkills` run (not once per skill), so the second parse of a
 * ~10 KB file is not worth a breaking signature change.
 *
 * Same tolerance as the table load — unreadable file, absent key, or a non-array
 * value all yield `[]`. The notes are prose the section embeds verbatim; there is
 * nothing to resolve and therefore nothing to fail loudly about.
 *
 * Locale note: the zh-Hans sibling carries zh prose here, so a zh install renders
 * zh caveats inside an en scaffold. That is deliberate — the scaffold names tools
 * and columns (proper nouns), the notes are explanation.
 */
export async function loadHostMapNotes(
  opts: LoadHostPrimitivesOptions & { host: HostId },
): Promise<string[]> {
  const path = resolveLocaleYaml(opts.workflowsDir, YAML_BASE, opts.locale ?? getLocale())
  let raw: string
  try {
    raw = await readFile(path, 'utf8')
  } catch {
    return []
  }
  const doc = parseYaml(raw) as HostPrimitivesDoc | null
  const notes = doc?.host_map_notes?.[opts.host]
  return Array.isArray(notes) ? notes.filter((n): n is string => typeof n === 'string') : []
}

/** Memo for {@link loadHostPrimitivesCached}, keyed by `<workflowsDir>|<locale>`.
 *  Promises (not resolved tables) so concurrent callers share one read. */
const _tableCache = new Map<string, Promise<HostPrimitiveTable>>()

/**
 * {@link loadHostPrimitives} with a process-lifetime memo.
 *
 * For the install surfaces one load per run falls out of the call graph, but the
 * RUNTIME surfaces (`harnessed prompt`, `harnessed run`) resolve the table on a
 * path that can be entered repeatedly — per sub-workflow, per phase, and per test
 * case. The table is immutable packaged data, so re-reading and re-parsing it is
 * pure waste; this keeps it to one read per (dir, locale).
 */
export function loadHostPrimitivesCached(
  opts: LoadHostPrimitivesOptions,
): Promise<HostPrimitiveTable> {
  const locale = opts.locale ?? getLocale()
  const key = `${opts.workflowsDir}|${locale}`
  const hit = _tableCache.get(key)
  if (hit) return hit
  const p = loadHostPrimitives({ workflowsDir: opts.workflowsDir, locale })
  _tableCache.set(key, p)
  return p
}

/** Test-only — drops the memo so a fixture that rewrites its yaml between cases
 *  is re-read. Production callers should never need this (sister
 *  `_clearDisciplineCache` in src/workflow/disciplineLoader.ts). */
export function _clearHostPrimitivesCache(): void {
  _tableCache.clear()
}

/**
 * Matches `{{ host.<primitive> }}` and `{{ host.<primitive>.<variant> }}`.
 * Whitespace inside the braces is flexible (sister
 * `CAPABILITY_CMD_TEMPLATE`); names use the same `[A-Za-z0-9_-]` charset.
 */
const HOST_PRIMITIVE_TEMPLATE = /\{\{\s*host\.([A-Za-z0-9_-]+)(?:\.([A-Za-z0-9_-]+))?\s*\}\}/g

/** Fresh regex per scan — a module-level `g` regex carries `lastIndex` state. */
function templateRe(): RegExp {
  return new RegExp(HOST_PRIMITIVE_TEMPLATE.source, 'g')
}

/** 1-based line number of `offset` within `body` (for error messages). */
function lineOf(body: string, offset: number): number {
  let line = 1
  for (let i = 0; i < offset && i < body.length; i++) if (body[i] === '\n') line++
  return line
}

/** Options for {@link renderHostPrimitives}. */
export interface RenderHostPrimitivesOptions {
  /** The harness the artifact is being rendered FOR. */
  host: HostId
  /** Table from {@link loadHostPrimitives} (already locale-selected). */
  table: HostPrimitiveTable
}

/**
 * Replace every `{{ host.* }}` placeholder in `body` with the active host's text.
 *
 * Substitution is a plain string splice: the table value goes in exactly as
 * written (multi-line YAML block scalars included), with no re-indentation and
 * no `$&`/`$1` replacement-pattern interpretation. Callers keep a multi-line
 * primitive on its own line if they want block semantics.
 *
 * Throws (never silently preserves) when the placeholder cannot be resolved:
 *   - unknown primitive
 *   - known primitive but unknown variant — NO fallback to `default`, so a
 *     half-translated table fails the build instead of quietly degrading
 *   - matched cell with no text for `host`
 * Each message carries the full key and the line/offset of the occurrence.
 */
export function renderHostPrimitives(body: string, opts: RenderHostPrimitivesOptions): string {
  const { host, table } = opts
  return body.replace(
    templateRe(),
    (match, primitive: string, variant: string | undefined, offset: number) => {
      const name = variant ?? DEFAULT_VARIANT
      const where = `'${match}' at line ${lineOf(body, offset)} (offset ${offset})`

      const variants = table[primitive]
      if (!variants) {
        throw new Error(
          `unknown host primitive 'host.${primitive}' — ${where}; ` +
            `not defined in host-primitives.yaml`,
        )
      }
      const entry = variants[name]
      if (!entry) {
        throw new Error(
          `unknown variant '${name}' for host primitive '${primitive}' — ${where}; ` +
            `defined variants: ${Object.keys(variants).sort().join(', ') || '(none)'}`,
        )
      }
      const text = entry[host]
      if (text === undefined) {
        throw new Error(
          `host primitive '${primitive}.${name}' has no text for host '${host}' — ${where}; ` +
            `defined hosts: ${Object.keys(entry).sort().join(', ') || '(none)'}`,
        )
      }
      return text
    },
  )
}

/**
 * Collect every `{{ host.* }}` key referenced by `body`, normalized to
 * `<primitive>.<variant>` with the bare form expanded to `.default` — so
 * `{{ host.x }}` and `{{ host.x.default }}` collapse to one entry, matching
 * what {@link renderHostPrimitives} looks up.
 *
 * Pure scan: it never consults a table and never throws, which is what lets
 * the en↔zh-Hans parity gate compare two SKILL.md bodies' placeholder sets
 * without loading either locale's table.
 */
export function collectHostPlaceholders(body: string): Set<string> {
  const keys = new Set<string>()
  for (const m of body.matchAll(templateRe())) {
    keys.add(`${m[1]}.${m[2] ?? DEFAULT_VARIANT}`)
  }
  return keys
}

// ─────────────────────────────────────────────────────────────────────────────
// Host-map section (v16.0 Phase 65 T10 / SPEC R4).
//
// Pass 3 of the install render, after capabilities and after host primitives.
// Non-claude artifacts get ONE block, right after the frontmatter, stating which
// harness they were rendered for and how to decode Claude-Code-authored prose.
//
// Why it exists: the rewrite swaps CC terms for codex ones INSIDE the prose, so
// the artifact stops saying "Claude Code" — but a model reading it can still meet
// a step whose shape only makes sense against the CC original (and, per F3, can
// meet the artifact through a directory shared with other tools). One block that
// names the mapping and the known caveats beats smearing the same hedge across
// ~74 prose sites.
//
// The claude artifact gets ZERO bytes from this pass — byte-exact golden
// (tests/fixtures/render-golden/claude-{en,zh-Hans}.json). That is enforced by
// `buildHostMapSection` returning '' for claude AND by `insertHostMapSection`
// treating an empty section as "do not touch the body at all".
// ─────────────────────────────────────────────────────────────────────────────

/** Opening marker. Stable and exempt from the Phase 65 T11 CC-token gate — the
 *  section quotes Claude Code terms ON PURPOSE, so the gate skips this span. */
export const HOST_MAP_START = '<!-- harnessed:host-map:start -->'

/** Closing marker. Always emitted paired with {@link HOST_MAP_START}. */
export const HOST_MAP_END = '<!-- harnessed:host-map:end -->'

/**
 * Longest `default` cell (either column) still treated as a TERM worth tabulating.
 *
 * The table mixes two populations: short term swaps (`SendMessage` → `send_input`)
 * and whole C-class paragraphs that exist because a sentence asserts a host-specific
 * fact. Only the first kind belongs in a glossary. The measured gap is wide — today
 * the longest term cell is 48 chars and the shortest paragraph cell is 99 — so a
 * cutoff here is a classifier, not a truncation risk. Multi-line cells are excluded
 * regardless of length (a block scalar is never a term).
 */
const TERM_MAX_LEN = 64

/** One glossary row: `<primitive>` and the two hosts' `default` text. */
interface HostMapRow {
  primitive: string
  claude: string
  codex: string
}

/** Escape the one character that would break out of a markdown table cell. */
function cell(text: string): string {
  return text.replaceAll('|', '\\|')
}

/** Inline-code a value, unless it already carries its own backticks. */
function code(text: string): string {
  return text.includes('`') ? text : `\`${text}\``
}

/**
 * The glossary rows, derived from the table rather than hand-listed: every
 * primitive whose `default` variant is a single-line term in BOTH columns, sorted
 * by primitive name so the section is byte-stable across yaml reorderings.
 */
export function hostMapRows(table: HostPrimitiveTable): HostMapRow[] {
  const rows: HostMapRow[] = []
  for (const primitive of Object.keys(table).sort()) {
    const entry = table[primitive]?.[DEFAULT_VARIANT]
    const claude = entry?.claude
    const codex = entry?.codex
    if (claude === undefined || codex === undefined) continue
    if (claude.includes('\n') || codex.includes('\n')) continue
    if (claude.length > TERM_MAX_LEN || codex.length > TERM_MAX_LEN) continue
    rows.push({ primitive, claude, codex })
  }
  return rows
}

/** Options for {@link buildHostMapSection}. */
export interface HostMapSectionOptions {
  /** The harness the artifact is being rendered FOR. `claude` yields ''. */
  host: HostId
  /** Table from {@link loadHostPrimitives} (already locale-selected). */
  table: HostPrimitiveTable
  /** Caveats from {@link loadHostMapNotes}; omitted/empty drops the block. */
  notes?: readonly string[]
}

/**
 * Build the marker-delimited host-map block, or '' when there is nothing to say.
 *
 * Returns '' for `claude` (the artifact IS the Claude Code original — a map from
 * CC to CC is noise, and the byte-exact golden forbids it) and for any host with
 * neither glossary rows nor notes.
 *
 * The scaffold (heading, lead sentence, column headers, "Caveats") is English in
 * every locale: its payload is tool and column names, which the project's language
 * rules keep untranslated. Only `notes` is locale-sourced.
 */
export function buildHostMapSection(opts: HostMapSectionOptions): string {
  const { host, table } = opts
  if (host === 'claude') return ''
  const rows = hostMapRows(table)
  const notes = opts.notes ?? []
  if (rows.length === 0 && notes.length === 0) return ''

  const skillsDir = table.skills_dir?.[DEFAULT_VARIANT]?.[host]
  const where = skillsDir ? ` and installed it under ${code(skillsDir)}` : ''
  const lines: string[] = [
    HOST_MAP_START,
    `## Host map — ${host}`,
    '',
    `harnessed rendered this artifact for the **${host}** harness${where}. The workflow prose ` +
      'was authored against Claude Code, so where a step names a tool it names the ' +
      `${host} one. Use the table to decode any instruction that still reads as ` +
      'Claude-Code-shaped; do not substitute the Claude Code names back.',
  ]
  if (rows.length > 0) {
    lines.push(
      '',
      `| primitive | Claude Code | ${host} |`,
      '| --- | --- | --- |',
      ...rows.map(
        (r) => `| \`${r.primitive}\` | ${cell(code(r.claude))} | ${cell(code(r.codex))} |`,
      ),
    )
  }
  if (notes.length > 0) {
    lines.push('', 'Caveats — these hold for the whole artifact:', '')
    for (const n of notes) lines.push(`- ${n}`)
  }
  lines.push(HOST_MAP_END)
  return lines.join('\n')
}

/** Matches a previously inserted block plus any blank lines trailing it. */
function regionRe(): RegExp {
  const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`${esc(HOST_MAP_START)}[\\s\\S]*?${esc(HOST_MAP_END)}\\n*`, 'g')
}

/** Frontmatter block at the very top (`---` … `---`), if the body opens with one. */
const FRONTMATTER_RX = /^---[ \t]*\r?\n[\s\S]*?\r?\n---[ \t]*(\r?\n|$)/

/**
 * Splice `section` into `body` immediately after the YAML frontmatter.
 *
 * Position rationale: after the frontmatter is the only offset that is both
 * stable (every workflow body opens with one, and its end is unambiguous) and
 * safe (inserting BEFORE it would push `---` off line 1 and break every
 * frontmatter parser, including the host's own skill loader). It is also the
 * first thing read after the metadata, which is where an orientation note earns
 * its tokens. A body with no frontmatter takes offset 0.
 *
 * IDEMPOTENT by construction: any existing marker region is stripped first, then
 * exactly one is re-inserted with normalized surrounding blank lines — so
 * rendering an already-rendered body reproduces it byte-for-byte instead of
 * stacking a second copy.
 *
 * An empty `section` (i.e. host === 'claude') returns `body` UNCHANGED — not even
 * a strip — so the claude path can never move a byte.
 */
export function insertHostMapSection(body: string, section: string): string {
  if (section === '') return body
  const stripped = body.replace(regionRe(), '')
  const fm = FRONTMATTER_RX.exec(stripped)
  const offset = fm ? fm[0].length : 0
  const before = stripped.slice(0, offset)
  const after = stripped.slice(offset).replace(/^\n+/, '')
  const lead = offset === 0 ? '' : '\n'
  return `${before}${lead}${section}\n\n${after}`
}
