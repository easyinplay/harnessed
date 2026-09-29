#!/usr/bin/env node
// v16.0 Phase 65 T11 NEW — "zero Claude-Code primitive tokens in the CODEX artifact".
//
// Phase 65 rewrote the host-specific wording in the workflow prose into
// `{{ host.<primitive>[.<variant>] }}` placeholders resolved at install time from
// workflows/host-primitives{,.zh-Hans}.yaml. The claude column restores the
// pre-65 wording byte-for-byte (locked by three goldens); the codex column names
// the codex primitive. This gate is the machine that keeps the SECOND half true:
// after a codex render, no Claude-Code-only term may survive outside an
// explicitly allowlisted site.
//
// ─────────────────────────────────────────────────────────────────────────────
// THREE RULES OF ENGAGEMENT (inventory.md § "T11 门 allowlist 候选", group F)
//
//  1. The subject is the RENDERED ARTIFACT, never the source text. Source prose
//     is SUPPOSED to be full of `{{ host.team }}`; the contract is about what the
//     codex install actually receives. So every surface below is rendered through
//     the same two passes the installer runs (capabilities → host primitives)
//     before a single token is matched.
//  2. The host-map span (`<!-- harnessed:host-map:start -->` … `:end -->`) is
//     exempt WHOLESALE — it quotes Claude Code terms on purpose, that being its
//     entire job. The marker strings are READ OUT OF src/cli/lib/hostPrimitives.ts
//     rather than re-typed here, so the exemption can never drift from the
//     emitter. (This gate does not itself build the section, so the strip is
//     belt-and-braces: it also covers a source body that already carries one.)
//  3. A placeholder's OWN TEXT contains `teammate` / `team` / `Agent` substrings
//     (`{{ host.teammate }}`). Matching against source text would therefore be
//     ~100% false positives. Rule 1 already removes the hazard — placeholders are
//     gone by the time we scan — and there is deliberately no "scan the source"
//     mode to reintroduce it.
// ─────────────────────────────────────────────────────────────────────────────
//
// WHAT IS SCANNED
//   S1  workflows/**/SKILL.md and SKILL.zh-Hans.md — the whole rendered body.
//       ALL of them, including bodies with no placeholder at all: un-rewritten
//       prose is exactly where residue hides.
//   S3  the runtime-prompt yaml surfaces, field-selected (see YAML_SURFACES) so
//       the gate only ever judges scalars a production code path really renders.
//       YAML comments are dropped by the structural parse — an authoring comment
//       is not an artifact.
//
// WHAT IS NOT SCANNED, and why
//   * workflows/host-primitives{,.zh-Hans}.yaml — that IS the table. Its `claude`
//     column is Claude Code terms by definition.
//   * The CLAUDE render. It is supposed to say "SendMessage"; that is the whole
//     point of the claude column. (inventory group E documents the one known
//     line-wrapped cell that a claude-side audit regex would trip over. There is
//     no claude-side audit mode here, so that stays a non-issue.)
//   * S2, the generated command bodies (src/cli/lib/generateCommands.ts): they are
//     synthesised from TypeScript template literals, so reaching them needs a
//     build this dep-light gate deliberately does not take. They are covered by
//     the codex sanity block in tests/cli/generateCommandsGolden.test.ts.
//
// Uses the `yaml` package → runs AFTER `corepack pnpm install` in CI (sister
// scripts/check-yaml-i18n-parity.mjs), NOT before it. Exports `checkHostPrimitives`
// so vitest can import the pure fn; the hand-written sibling .d.mts gives it types
// (scripts/** is in tsconfig include with allowJs off → TS7016 otherwise). CLI
// main() is guarded by an import.meta.url entry check so importing never exits.

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { parseDocument, parse as parseYaml, visit } from 'yaml'

/** The host this gate judges. The claude column is out of scope by design. */
const HOST = 'codex'

/**
 * Claude-Code-only tokens. Case-sensitive literal substrings, NOT word-boundary
 * regexes: `Agent(` and `~/.claude/` are not words, and a JS `\b` does not fire
 * after a CJK character (project memory: ci-gate-scripts-preflight), so a
 * boundary-based matcher would silently skip every hit inside Chinese prose.
 *
 * Overlapping entries are intentional (`Agent Teams` ⊃ `Agent Team`); the scanner
 * keeps only the longest match starting at a given offset.
 */
export const CC_TOKENS = [
  'Task tool',
  'Task / Agent',
  'SendMessage',
  'TeamCreate',
  'TeamDelete',
  'Agent(',
  'run_in_background',
  'Agent Teams',
  'Agent Team',
  'subagent_type',
  'CC-native',
  'teammate',
  'AskUserQuestion',
  'Claude Code',
  '~/.claude/',
]

/**
 * PHRASE masks — text blanked out before token matching, because at these sites
 * the Claude Code wording is deliberate and correct on codex too.
 *
 * Phrases, never whole words: `Claude Code plugin` is exempt (D5 — it is an
 * upstream component's real distribution-channel name, and "Codex plugin
 * marketplace" does not exist) while a bare `Claude Code` stays a violation.
 *
 * A mask that matches NOTHING is an error, not a shrug: the allowlist is a list
 * of live sites, and a stale entry is exactly how an allowlist rots into a
 * blanket exemption. When one goes stale the fix is to delete it, or to re-derive
 * it from whatever the site now says.
 */
export const MASKS = [
  {
    phrase: 'Claude Code plugin',
    why: 'inventory group B / D5 — upstream distribution-channel name, not a host primitive',
  },
  {
    phrase: 'Claude Code 插件',
    why: 'inventory group B / D5 — zh form of the same distribution-channel name',
  },
  {
    phrase: 'teammate_send_message_needed',
    why: 'inventory group C — a parallelism-gate.yaml trigger KEY; renaming it breaks the ref',
  },
  {
    phrase: '"4-specialist Agent Team"',
    why:
      'inventory group D — a frontmatter trigger_phrases MATCH KEY (what the user says), ' +
      'quoted form only; the same words unquoted in prose stay a violation',
  },
  // inventory group A — the multispec "Capability refs" list verbatim-quotes
  // capabilities.yaml's impl/cmd fields. Masked as whole LINES, so that if the
  // registry entry ever changes the quote stops matching and this gate demands a
  // re-review instead of silently covering the new text.
  {
    phrase:
      '- `agent-teams-create` — Bucket 5 Agent Teams (impl: claude-platform, cmd: `Agent(name, run_in_background=true)`)',
    why: 'inventory group A — verbatim capabilities.yaml quote (registry fact, not prose)',
  },
  {
    phrase:
      '- `agent-teams-send-message` — Bucket 5 Agent Teams (impl: claude-platform, cmd: SendMessage)',
    why: 'inventory group A — verbatim capabilities.yaml quote (registry fact, not prose)',
  },
  {
    phrase:
      '- `agent-teams-shutdown` — Bucket 5 Agent Teams (impl: claude-platform, cmd: `ask the <teammate-name> teammate to shut down`)',
    why: 'inventory group A — verbatim capabilities.yaml quote (registry fact, not prose)',
  },
]

/**
 * The yaml surfaces and the exact fields on each that a production path renders.
 *
 * Field-selected rather than whole-file, because a yaml file is not an artifact:
 * only some of its scalars reach a rendered product. `disciplines/language.yaml`
 * is the sharp case — the file's own comment records that
 * `buildDisciplinesSection` skips the whole `language` discipline, so ONLY the
 * `preserve-english-categories` rule (parsed by `buildLanguageSection` into the
 * spawn prompt's `## Language` section) is a rendered surface. Its neighbours'
 * descriptions are dead text as far as any artifact is concerned.
 */
export const YAML_SURFACES = [
  {
    file: 'role-prompts.yaml',
    // specialist / responsibility / checklist / severity = mapRolePromptText's
    // prompt-body fields (the S3 spawn prompt). `description` is included too:
    // it is the slot generateCommands.ts emits as the generated command's yaml
    // frontmatter, so its text reaches a codex artifact as surely as the others.
    fields: ['specialist', 'responsibility', 'checklist', 'severity', 'description'],
  },
  {
    file: 'role-prompts.zh-Hans.yaml',
    fields: ['specialist', 'responsibility', 'checklist', 'severity', 'description'],
  },
  {
    file: join('disciplines', 'language.yaml'),
    fields: ['description'],
    // Only rules whose `id` is listed here are a rendered surface.
    ruleIds: ['preserve-english-categories'],
  },
]

const HOST_TEMPLATE = /\{\{\s*host\.([A-Za-z0-9_-]+)(?:\.([A-Za-z0-9_-]+))?\s*\}\}/g
const CAP_TEMPLATE = /\{\{\s*capabilities\.([A-Za-z0-9_-]+)\.cmd\s*\}\}/g

/** Fresh regex per scan — a module-level `g` regex carries `lastIndex` state. */
function re(source) {
  return new RegExp(source, 'g')
}

/**
 * Read `HOST_MAP_START` / `HOST_MAP_END` out of src/cli/lib/hostPrimitives.ts.
 *
 * Deliberately not re-typed as literals here: the markers delimit an exemption,
 * and an exemption whose delimiter has drifted from the emitter is worse than no
 * exemption at all. Throws when either declaration cannot be found, so a rename
 * upstream fails loudly instead of quietly narrowing what this gate skips.
 */
export function hostMapMarkers(repoRoot) {
  const src = join(repoRoot, 'src', 'cli', 'lib', 'hostPrimitives.ts')
  const text = readFileSync(src, 'utf8')
  const pick = (name) => {
    const m = new RegExp(`export const ${name} = '([^']+)'`).exec(text)
    if (!m) {
      throw new Error(
        `cannot read ${name} from ${src} — the host-map exemption must track the emitter`,
      )
    }
    return m[1]
  }
  return { start: pick('HOST_MAP_START'), end: pick('HOST_MAP_END') }
}

/** Blank `[from, to)` while preserving newlines, so offsets and line numbers of
 *  everything after a mask stay exactly where they were. */
function blank(text, from, to) {
  let out = ''
  for (let i = from; i < to; i++) out += text[i] === '\n' ? '\n' : ' '
  return out
}

/** Replace every occurrence of `phrase` with same-shape blanks. Returns the new
 *  text and how many occurrences were masked. */
export function maskPhrase(text, phrase) {
  let out = ''
  let cursor = 0
  let count = 0
  for (;;) {
    const at = text.indexOf(phrase, cursor)
    if (at === -1) break
    out += text.slice(cursor, at) + blank(text, at, at + phrase.length)
    cursor = at + phrase.length
    count++
  }
  return { text: out + text.slice(cursor), count }
}

/** Blank every `start … end` span (the host-map section — rule 2). */
function maskSpans(text, start, end) {
  let out = ''
  let cursor = 0
  for (;;) {
    const a = text.indexOf(start, cursor)
    if (a === -1) break
    const b = text.indexOf(end, a)
    if (b === -1) break
    const stop = b + end.length
    out += text.slice(cursor, a) + blank(text, a, stop)
    cursor = stop
  }
  return out + text.slice(cursor)
}

/** 1-based line number of `offset`. */
function lineOf(text, offset) {
  let line = 1
  for (let i = 0; i < offset && i < text.length; i++) if (text[i] === '\n') line++
  return line
}

/** The full line containing `offset`, trimmed for a one-line error message. */
function lineAt(text, offset) {
  const from = text.lastIndexOf('\n', offset) + 1
  const to = text.indexOf('\n', offset)
  return text.slice(from, to === -1 ? text.length : to).trim()
}

/**
 * Find every CC token in ALREADY-MASKED, ALREADY-RENDERED text.
 * Keeps only the longest token starting at a given offset, so `Agent Teams`
 * reports once rather than twice.
 */
export function scanCcTokens(text) {
  /** @type {Map<number, {token: string, at: number}>} */
  const byOffset = new Map()
  for (const token of CC_TOKENS) {
    let at = text.indexOf(token)
    while (at !== -1) {
      const prev = byOffset.get(at)
      if (!prev || prev.token.length < token.length) byOffset.set(at, { token, at })
      at = text.indexOf(token, at + 1)
    }
  }
  return [...byOffset.values()].sort((a, b) => a.at - b.at)
}

/** Load `<workflowsDir>/host-primitives[.<locale>].yaml` → the primitives table. */
function loadTable(workflowsDir, locale) {
  const name = locale === 'en' ? 'host-primitives.yaml' : `host-primitives.${locale}.yaml`
  const doc = parseYaml(readFileSync(join(workflowsDir, name), 'utf8'))
  return doc?.primitives ?? {}
}

/** Load `<workflowsDir>/capabilities.yaml` → the capability map. */
function loadCapabilities(workflowsDir) {
  const doc = parseYaml(readFileSync(join(workflowsDir, 'capabilities.yaml'), 'utf8'))
  return doc?.capabilities ?? {}
}

/**
 * Pass 1 of the install render — `{{ capabilities.<x>.cmd }}` with the host's
 * `by_host` override applied (mirrors capabilityResolver.pickHostValues).
 *
 * This pass is not optional decoration: a capability with no `by_host.codex`
 * entry renders its CLAUDE cmd into the codex artifact, which is precisely the
 * kind of leak this gate exists to catch.
 */
function renderCapabilities(body, capabilities, host) {
  return body.replace(re(CAP_TEMPLATE.source), (match, name) => {
    const entry = capabilities[name]
    if (!entry) return match
    return entry.by_host?.[host]?.cmd ?? entry.cmd ?? match
  })
}

/** Pass 2 — `{{ host.* }}`. Throws on an unresolvable key, exactly as
 *  src/cli/lib/hostPrimitives.ts renderHostPrimitives does at install time. */
function renderHost(body, table, host) {
  return body.replace(re(HOST_TEMPLATE.source), (match, primitive, variant) => {
    const cell = table[primitive]?.[variant ?? 'default']
    if (!cell) throw new Error(`unresolvable placeholder ${match}`)
    const text = cell[host]
    if (text === undefined) throw new Error(`${match} has no '${host}' column`)
    return text
  })
}

/** Every file under `root`, recursively. */
function walkFiles(root, out = []) {
  if (!existsSync(root)) return out
  for (const name of readdirSync(root)) {
    const p = join(root, name)
    if (statSync(p).isDirectory()) walkFiles(p, out)
    else out.push(p)
  }
  return out
}

/** Ancestor-aware field pick for a yaml surface: returns the scalars to scan as
 *  `{ value, line, path }`, honouring `fields` and the optional `ruleIds` filter. */
function selectYamlScalars(text, surface) {
  const doc = parseDocument(text)
  const picked = []
  const wanted = new Set(surface.fields)
  const ruleIds = surface.ruleIds ? new Set(surface.ruleIds) : null

  /** The key of the Pair a node sits under, plus the enclosing map's `id`. */
  const context = (path) => {
    let field = null
    let ruleId = null
    for (let i = path.length - 1; i >= 0; i--) {
      const node = path[i]
      if (field === null && node?.key?.value !== undefined && wanted.has(node.key.value)) {
        field = node.key.value
      }
      if (ruleId === null && typeof node?.get === 'function') {
        const id = node.get('id')
        if (typeof id === 'string') ruleId = id
      }
    }
    return { field, ruleId }
  }

  visit(doc, {
    Scalar(_key, node, path) {
      if (typeof node.value !== 'string') return
      const { field, ruleId } = context(path)
      if (field === null) return
      if (ruleIds && !ruleIds.has(ruleId)) return
      picked.push({
        value: node.value,
        field,
        line: lineOf(text, node.range?.[0] ?? 0),
      })
    },
  })
  return picked
}

/**
 * Run the gate over a repo checkout.
 *
 * @param {string} repoRoot repo root (the dir holding `workflows/`)
 * @returns {{ ok: boolean, violations: Array<{file: string, line: number, token: string, detail: string}>, warnings: string[] }}
 */
export function checkHostPrimitives(repoRoot) {
  const workflowsDir = join(repoRoot, 'workflows')
  const violations = []
  const warnings = []
  const maskHits = new Map(MASKS.map((m) => [m.phrase, 0]))
  const { start, end } = hostMapMarkers(repoRoot)
  const capabilities = loadCapabilities(workflowsDir)
  const tables = {
    en: loadTable(workflowsDir, 'en'),
    'zh-Hans': loadTable(workflowsDir, 'zh-Hans'),
  }

  /** Mask + scan one rendered chunk; `locate` maps a hit to its report site. */
  const judge = (rendered, locate) => {
    let text = maskSpans(rendered, start, end)
    for (const mask of MASKS) {
      const { text: next, count } = maskPhrase(text, mask.phrase)
      text = next
      if (count > 0) maskHits.set(mask.phrase, (maskHits.get(mask.phrase) ?? 0) + count)
    }
    for (const hit of scanCcTokens(text)) {
      violations.push({ ...locate(text, hit), token: hit.token })
    }
  }

  // ── S1: every workflows/**/SKILL{,.zh-Hans}.md, whole rendered body ─────────
  for (const path of walkFiles(workflowsDir)) {
    const base = path.split(/[/\\]/).pop()
    if (base !== 'SKILL.md' && base !== 'SKILL.zh-Hans.md') continue
    const rel = relative(repoRoot, path).replaceAll('\\', '/')
    const locale = base === 'SKILL.zh-Hans.md' ? 'zh-Hans' : 'en'
    const source = readFileSync(path, 'utf8')
    let rendered
    try {
      rendered = renderHost(renderCapabilities(source, capabilities, HOST), tables[locale], HOST)
      // Render for claude too: an unresolvable key or a missing column is a
      // build-time crash on EITHER host, and catching it here beats catching it
      // during someone's `harnessed setup`.
      renderHost(renderCapabilities(source, capabilities, 'claude'), tables[locale], 'claude')
    } catch (err) {
      violations.push({ file: rel, line: 0, token: '(render)', detail: String(err.message ?? err) })
      continue
    }
    judge(rendered, (text, hit) => ({
      file: rel,
      line: lineOf(text, hit.at),
      detail: lineAt(text, hit.at),
    }))
  }

  // ── S3: the runtime-prompt yaml surfaces, field-selected ────────────────────
  for (const surface of YAML_SURFACES) {
    const path = join(workflowsDir, surface.file)
    if (!existsSync(path)) {
      warnings.push(`declared yaml surface is missing: ${surface.file}`)
      continue
    }
    const rel = relative(repoRoot, path).replaceAll('\\', '/')
    const locale = surface.file.includes('.zh-Hans.') ? 'zh-Hans' : 'en'
    const text = readFileSync(path, 'utf8')
    for (const scalar of selectYamlScalars(text, surface)) {
      let rendered
      try {
        rendered = renderHost(scalar.value, tables[locale], HOST)
        renderHost(scalar.value, tables[locale], 'claude')
      } catch (err) {
        violations.push({
          file: rel,
          line: scalar.line,
          token: '(render)',
          detail: String(err.message ?? err),
        })
        continue
      }
      judge(rendered, () => ({
        file: rel,
        line: scalar.line,
        field: scalar.field,
        detail: `${scalar.field}: ${rendered.split('\n')[0].slice(0, 140)}`,
      }))
    }
  }

  // ── allowlist hygiene ───────────────────────────────────────────────────────
  for (const mask of MASKS) {
    if ((maskHits.get(mask.phrase) ?? 0) === 0) {
      violations.push({
        file: 'scripts/check-host-primitives.mjs',
        line: 0,
        token: '(stale-mask)',
        detail: `mask never matched: ${JSON.stringify(mask.phrase)} — delete it or re-derive it from the site it was written for`,
      })
    }
  }

  return { ok: violations.length === 0, violations, warnings }
}

// CLI main — guarded so `import` never exits the process (vitest imports the fn).
if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const here = fileURLToPath(new URL('.', import.meta.url))
  const repoRoot = join(here, '..')
  const { ok, violations, warnings } = checkHostPrimitives(repoRoot)

  for (const w of warnings) console.error(`::warning::[host-primitives] ${w}`)
  if (!ok) {
    for (const v of violations) {
      console.error(
        `::error file=${v.file},line=${v.line}::[host-primitives] ${v.token} survives the codex render — ${v.detail}`,
      )
    }
    console.error(
      `[host-primitives] ${violations.length} Claude-Code primitive token(s) survive the ${HOST} render. ` +
        'Rewrite the site into a `{{ host.* }}` placeholder (workflows/host-primitives.yaml), ' +
        'or — if the CC wording is correct on codex too — add a narrow PHRASE mask to MASKS ' +
        'in scripts/check-host-primitives.mjs with the reason.',
    )
    process.exit(1)
  }
  console.log(
    `[host-primitives] ${HOST} render carries no Claude-Code primitive tokens ` +
      `(${MASKS.length} allowlisted phrase(s), all live).`,
  )
  process.exit(0)
}
