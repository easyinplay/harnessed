#!/usr/bin/env node
// Phase 30 T30.1 — en↔zh-Hans SKILL.md sync-guard (CI hard gate, REQ-v100-sync-guard).
// Enforces STRUCTURAL PARITY between a SKILL.md and its SKILL.zh-Hans.md sibling.
//
// drift-only semantics: a sibling EXISTS → it MUST be in structural parity with
// SKILL.md; a sibling is ABSENT → OK (no must-exist). So the guard is green at
// Phase 30 land (26 SKILL.md, 0 siblings) and stays green as Phase 31 lands
// siblings in parity. An orphan SKILL.zh-Hans.md (no SKILL.md sibling) IS a
// violation.
//
// Structural parity = translation-invariant features only (OPEN-1 resolved =
// structural parity); NEVER compares translated prose / frontmatter values /
// heading text:
//   1. frontmatter KEY-set identical (top-level keys; values are translated)
//   2. {{ capabilities.X }} placeholder set exact-equal both directions
//      (placeholders are rendered, never translated)
//   3. heading LEVEL sequence identical (e.g. [1,2,2,3]; heading TEXT not compared)
//   4. no orphan zh
//   5. {{ host.<primitive>[.<variant>] }} PRIMITIVE set exact-equal both
//      directions — v16.0 Phase 65 T12. See the long note on hostPrimitiveSet for
//      why this compares primitives and NOT the `<primitive>.<variant>` keys.
//
// Dep-free by design: runs in CI BEFORE `corepack pnpm install` (sister
// scripts/check-provenance.mjs). MUST NOT import the `yaml` package — frontmatter
// keys are parsed by regex. Exports `checkSkillI18nParity` so vitest can import the
// pure fn directly; a hand-written sibling .d.mts gives it types (scripts/** is in
// tsconfig include with allowJs off, so the .ts test would otherwise raise TS7016).
// CLI main() is guarded by an import.meta.url entry check so importing never exits.

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const EN_NAME = 'SKILL.md'
const ZH_NAME = 'SKILL.zh-Hans.md'

/**
 * Top-level frontmatter keys (between the first two `---` fences).
 * Matches lines starting at column 0 with `key:` — indented continuation lines
 * (e.g. a `description: |` block body, or `- "..."` list items) are NOT keys.
 */
function frontmatterKeys(text) {
  const lines = text.split(/\r?\n/)
  if (lines[0] !== '---') return []
  const keys = []
  for (let i = 1; i < lines.length; i++) {
    if (lines[i] === '---') break
    const m = /^([A-Za-z_][\w-]*):/.exec(lines[i])
    if (m) keys.push(m[1])
  }
  return keys
}

/**
 * Set of `{{ capabilities.X }}` placeholder identifiers (the `capabilities.X`
 * body, whitespace-normalized). Non-greedy to the first closing `}}` so a line
 * with trailing `}]` etc. does not over-capture.
 */
function placeholderSet(text) {
  const set = new Set()
  const re = /\{\{\s*(capabilities\.[\w.-]+?)\s*\}\}/g
  let m
  // biome-ignore lint/suspicious/noAssignInExpressions: canonical regex-exec loop
  while ((m = re.exec(text)) !== null) {
    set.add(m[1])
  }
  return set
}

/**
 * Set of `{{ host.* }}` PRIMITIVE names — the `<primitive>` half only, with the
 * `<variant>` deliberately discarded (v16.0 Phase 65 T12).
 *
 * Why not the full `<primitive>.<variant>` key, the way check 2 compares full
 * capability ids: because en and zh legitimately reference DIFFERENT variants of
 * the same primitive. The table carries prose-shape variants — en bodies say
 * `{{ host.spawn_subagent.default }}` ("Task / Agent tool") and
 * `{{ host.spawn_subagent.plural }}`, where the zh body of the same skill says
 * `{{ host.spawn_subagent.zh_tool }}` ("Task / Agent 工具") — so a variant-level
 * comparison is red on 24 of the 26 pairs by DESIGN, not by drift.
 *
 * Occurrence COUNTS are discarded for the same reason, and that is measured, not
 * assumed: comparing per-primitive counts is red on verify/multispec today
 * (en references `teammate` 6× and `teams_cleanup_note` 3×, zh 5× and 2×) purely
 * because the Chinese sentences fold two mentions into one. A gate that fires on
 * ordinary translation shape is a gate people learn to ignore.
 *
 * The primitive SET is the part that must not drift: it says WHICH host-specific
 * facts a body talks about. A zh sibling that drops `teams_cleanup_note` entirely
 * has lost a contract; a zh sibling that says it once instead of twice has not.
 *
 * DEP-FREE NOTE: this duplicates the regex in src/cli/lib/hostPrimitives.ts
 * (`collectHostPlaceholders`) instead of importing it. That module is TypeScript
 * and this gate runs BEFORE `corepack pnpm install` in CI, with no build output
 * on disk — importing it is not merely undesirable here, it is impossible. The
 * duplicated pattern is the one thing to keep in sync if the placeholder syntax
 * ever changes; the charset (`[A-Za-z0-9_-]`) is asserted identical by
 * tests/scripts/skill-i18n-parity.test.ts.
 */
function hostPrimitiveSet(text) {
  const set = new Set()
  const re = /\{\{\s*host\.([A-Za-z0-9_-]+)(?:\.([A-Za-z0-9_-]+))?\s*\}\}/g
  let m
  // biome-ignore lint/suspicious/noAssignInExpressions: canonical regex-exec loop
  while ((m = re.exec(text)) !== null) {
    set.add(m[1])
  }
  return set
}

/**
 * Sequence of heading levels (1–6) in document order, ignoring lines inside
 * fenced code blocks (``` / ~~~) so a `#`-comment in a bash block is not counted.
 * Heading TEXT is intentionally discarded — only the level shape is compared.
 */
function headingShape(text) {
  const lines = text.split(/\r?\n/)
  const levels = []
  let fence = null
  for (const line of lines) {
    const f = /^(```+|~~~+)/.exec(line)
    if (f) {
      if (fence === null) fence = f[1][0]
      else if (line.trimStart().startsWith(fence)) fence = null
      continue
    }
    if (fence !== null) continue
    const h = /^(#{1,6})\s/.exec(line)
    if (h) levels.push(h[1].length)
  }
  return levels
}

function setEqual(a, b) {
  if (a.size !== b.size) return false
  for (const x of a) if (!b.has(x)) return false
  return true
}

function arrayEqual(a, b) {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false
  return true
}

/** Recursively collect every directory under `root` (inclusive). */
function walkDirs(root, out = []) {
  if (!existsSync(root)) return out
  out.push(root)
  for (const name of readdirSync(root)) {
    const p = join(root, name)
    if (statSync(p).isDirectory()) walkDirs(p, out)
  }
  return out
}

/**
 * Check en↔zh-Hans SKILL.md structural parity across `workflowsDir`.
 * @param {string} workflowsDir path to a `workflows/` tree
 * @returns {{ ok: boolean, violations: Array<{file: string, kind: string, detail: string}> }}
 */
export function checkSkillI18nParity(workflowsDir) {
  const violations = []
  for (const dir of walkDirs(workflowsDir)) {
    const enPath = join(dir, EN_NAME)
    const zhPath = join(dir, ZH_NAME)
    const hasEn = existsSync(enPath)
    const hasZh = existsSync(zhPath)

    // Orphan zh: a translation with no source.
    if (hasZh && !hasEn) {
      violations.push({
        file: zhPath,
        kind: 'orphan',
        detail: `${ZH_NAME} has no ${EN_NAME} sibling`,
      })
      continue
    }
    // drift-only: en alone (or neither) is fine.
    if (!hasZh || !hasEn) continue

    const en = readFileSync(enPath, 'utf8')
    const zh = readFileSync(zhPath, 'utf8')

    // 1. frontmatter key-set (order-insensitive).
    const enKeys = new Set(frontmatterKeys(en))
    const zhKeys = new Set(frontmatterKeys(zh))
    if (!setEqual(enKeys, zhKeys)) {
      violations.push({
        file: zhPath,
        kind: 'frontmatter',
        detail: `frontmatter keys differ — en={${[...enKeys].sort().join(',')}} zh={${[...zhKeys].sort().join(',')}}`,
      })
    }

    // 2. placeholder set (exact-equal both directions).
    const enPh = placeholderSet(en)
    const zhPh = placeholderSet(zh)
    if (!setEqual(enPh, zhPh)) {
      violations.push({
        file: zhPath,
        kind: 'placeholder',
        detail: `placeholder set differs — en={${[...enPh].sort().join(',')}} zh={${[...zhPh].sort().join(',')}}`,
      })
    }

    // 5. host-primitive set (primitives only — see hostPrimitiveSet).
    const enHost = hostPrimitiveSet(en)
    const zhHost = hostPrimitiveSet(zh)
    if (!setEqual(enHost, zhHost)) {
      const only = (a, b) => [...a].filter((x) => !b.has(x)).sort()
      violations.push({
        file: zhPath,
        kind: 'host-primitive',
        detail:
          `host primitive set differs — en-only={${only(enHost, zhHost).join(',')}} ` +
          `zh-only={${only(zhHost, enHost).join(',')}}`,
      })
    }

    // 3. heading level sequence.
    const enShape = headingShape(en)
    const zhShape = headingShape(zh)
    if (!arrayEqual(enShape, zhShape)) {
      violations.push({
        file: zhPath,
        kind: 'heading-shape',
        detail: `heading level sequence differs — en=[${enShape.join(',')}] zh=[${zhShape.join(',')}]`,
      })
    }
  }
  return { ok: violations.length === 0, violations }
}

// CLI main — guarded so `import` never exits the process (vitest imports the fn).
if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const here = fileURLToPath(new URL('.', import.meta.url))
  const workflowsDir = join(here, '..', 'workflows')
  const { ok, violations } = checkSkillI18nParity(workflowsDir)
  if (!ok) {
    for (const v of violations) {
      // GitHub Actions annotation — surfaces the offending file in the PR.
      console.error(`::error file=${v.file}::[skill-i18n-parity] ${v.kind}: ${v.detail}`)
    }
    console.error(
      `[skill-i18n-parity] ${violations.length} structural-parity violation(s). ` +
        'A SKILL.zh-Hans.md sibling must match its SKILL.md in frontmatter keys, ' +
        '{{ capabilities.X }} placeholders, {{ host.* }} primitives, and heading-level ' +
        'shape (drift-only — absence of a sibling is OK).',
    )
    process.exit(1)
  }
  console.log(
    '[skill-i18n-parity] all en↔zh-Hans SKILL.md pairs in structural parity (drift-only).',
  )
  process.exit(0)
}
