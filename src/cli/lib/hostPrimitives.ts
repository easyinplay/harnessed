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
