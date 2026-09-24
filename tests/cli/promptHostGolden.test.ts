// v16.0 Phase 65 T8 — byte-exact golden for the CLAUDE-side S3 artifact.
//
// S3 = the RUNTIME prompt: the text `harnessed prompt <sub>` prints and the main
// session feeds into a native subagent spawn. Its sources are
// `workflows/role-prompts{,.zh-Hans}.yaml` (via `buildAgentDef`),
// `workflows/disciplines/*.yaml`, `workflows/capabilities.yaml` and
// `workflows/defaults.yaml`. Sister gates: tests/cli/renderGolden.test.ts (S1,
// the installed SKILL.md bodies) and tests/cli/generateCommandsGolden.test.ts
// (S2, the generated slash-command bodies).
//
// ─────────────────────────────────────────────────────────────────────────────
// READ THIS BEFORE RE-RECORDING.
//
// The claude manifests below were recorded on the tree as it stood BEFORE any
// `{{ host.* }}` placeholder entered a role-prompt or a discipline rule. They
// are the pre-rewrite baseline for the invariant T8 is built around:
//
//     Rewriting runtime prose into `{{ host.* }}` placeholders must leave the
//     CLAUDE prompt byte-identical. The `claude` column of host-primitives.yaml
//     holds the exact words the yaml already said.
//
// So DURING THE PHASE 65 REWRITE the claude golden MUST NOT MOVE. If it goes red,
// the rewrite is wrong — a placeholder was introduced whose claude text does not
// restore the original wording (a stray space, a dropped comma, an "improved"
// phrasing). That is a bug, NOT a re-record signal. Fix the yaml value; leave the
// golden alone.
//
// Legitimate re-record reasons are limited to: an intentional role-prompt /
// discipline content edit, a new/removed workflow dir, or a change to the
// prompt assembly itself. Then, and only then:
//
//     UPDATE_RENDER_GOLDEN=1 corepack pnpm exec vitest run tests/cli/promptHostGolden.test.ts
//
// and review the resulting JSON diff hash-by-hash in the commit.
// ─────────────────────────────────────────────────────────────────────────────
//
// Mechanism mirrors the S2 golden: a sha256 manifest keyed by sub-workflow, for
// both locales, with `HARNESSED_USER_LANG` pinned so the `## Language` section
// (which carries the `preserve-english-categories` lines out of
// disciplines/language.yaml) is always present rather than env-dependent.
//
// codex gets a SANITY test, not a golden: its text is expected to change with
// every rewrite wave, so pinning bytes there would be pure churn. What is worth
// pinning is that codex renders at all and leaves NOTHING unresolved — a literal
// `{{ host.* }}` reaching a spawned subagent is the exact failure this task
// exists to prevent.

import { createHash } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { readdir } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { HostId } from '../../src/cli/lib/hostPrimitives.js'
import { buildPromptText } from '../../src/cli/prompt.js'
import type { SupportedLocale } from '../../src/i18n/index.js'
import { scanWorkflowsNested } from '../../src/workflow/scan-nested.js'

const REPO_ROOT = resolve(__dirname, '..', '..')
const WORKFLOWS_DIR = join(REPO_ROOT, 'workflows')
const GOLDEN_DIR = join(REPO_ROOT, 'tests', 'fixtures', 'render-golden')

const UPDATE = process.env.UPDATE_RENDER_GOLDEN === '1'

/** `HARNESSED_USER_LANG` gates the whole `## Language` section on/off. Pin it so
 *  the golden covers that section instead of depending on the runner's env. */
const PINNED_USER_LANG = 'zh-Hans'
let savedUserLang: string | undefined

beforeAll(() => {
  savedUserLang = process.env.HARNESSED_USER_LANG
  process.env.HARNESSED_USER_LANG = PINNED_USER_LANG
})
afterAll(() => {
  if (savedUserLang === undefined) delete process.env.HARNESSED_USER_LANG
  else process.env.HARNESSED_USER_LANG = savedUserLang
})

/** Every installed workflow dir, sorted — the same set the S2 golden walks. */
async function subNames(): Promise<string[]> {
  const entries = await readdir(WORKFLOWS_DIR)
  const { workflows } = await scanWorkflowsNested(WORKFLOWS_DIR, entries)
  return workflows.map((w) => w.name).sort()
}

/** `{<sub>: full prompt text}` for one (host, locale). */
async function buildAll(host: HostId, locale: SupportedLocale): Promise<Record<string, string>> {
  const out: Record<string, string> = {}
  for (const sub of await subNames()) {
    const { prompt } = await buildPromptText(sub, REPO_ROOT, { host, locale })
    out[sub] = prompt
  }
  return out
}

/** `{<sub>: sha256}`, keys sorted. */
function manifest(bodies: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.keys(bodies)
      .sort()
      .map((k) => [
        k,
        createHash('sha256')
          .update(bodies[k] as string, 'utf8')
          .digest('hex'),
      ]),
  )
}

/** Stable on-disk form: sorted keys, 2-space indent, trailing newline. */
function serialize(m: Record<string, string>): string {
  return `${JSON.stringify(m, null, 2)}\n`
}

describe('claude runtime prompts (S3) — byte-exact golden', () => {
  for (const locale of ['en', 'zh-Hans'] as const) {
    it(`claude x ${locale} matches tests/fixtures/render-golden/prompts-claude-${locale}.json`, async () => {
      const actual = manifest(await buildAll('claude', locale))
      const goldenPath = join(GOLDEN_DIR, `prompts-claude-${locale}.json`)

      if (UPDATE) writeFileSync(goldenPath, serialize(actual), 'utf8')
      expect(existsSync(goldenPath), 'missing golden — record it with UPDATE_RENDER_GOLDEN=1').toBe(
        true,
      )

      const expected = JSON.parse(readFileSync(goldenPath, 'utf8')) as Record<string, string>
      // Key SET first: a sub that appeared or vanished is a clearer failure than
      // N hash mismatches.
      expect(Object.keys(actual).sort()).toEqual(Object.keys(expected).sort())
      expect(actual).toEqual(expected)
    })
  }

  it('the golden covers every installed workflow', async () => {
    const expected = JSON.parse(
      readFileSync(join(GOLDEN_DIR, 'prompts-claude-en.json'), 'utf8'),
    ) as Record<string, string>
    expect(Object.keys(expected).sort()).toEqual(await subNames())
  })
})

describe('codex runtime prompts (S3) — sanity, not a golden', () => {
  for (const locale of ['en', 'zh-Hans'] as const) {
    it(`codex x ${locale} resolves every placeholder`, async () => {
      const bodies = await buildAll('codex', locale)
      const offenders = Object.entries(bodies)
        .filter(([, text]) => /\{\{\s*host\./.test(text))
        .map(([sub]) => sub)
      expect(offenders, 'unresolved {{ host.* }} reached a runtime prompt').toEqual([])
    })
  }

  // The real assertion: no Claude-only primitive survives into a codex prompt.
  // `team` is deliberately absent from this list — "the team forms implicitly on
  // the first spawn" / `team_cost` / `team_name` are generic words in that prose,
  // not the branded `Agent Teams` noun, and only the branded form is a primitive.
  const CLAUDE_ONLY = ['SendMessage', 'Agent Team', 'teammate', 'AskUserQuestion', 'Claude Code']

  for (const locale of ['en', 'zh-Hans'] as const) {
    it(`codex x ${locale} names no Claude-only primitive`, async () => {
      const bodies = await buildAll('codex', locale)
      const hits: string[] = []
      for (const [sub, text] of Object.entries(bodies)) {
        for (const needle of CLAUDE_ONLY) if (text.includes(needle)) hits.push(`${sub}: ${needle}`)
      }
      expect(hits).toEqual([])
    })
  }

  it('the codex vocabulary actually landed', async () => {
    const claude = await buildAll('claude', 'en')
    const codex = await buildAll('codex', 'en')
    // task-deliver + verify-multispec are the two subs whose role-prompt prose
    // names Claude-only primitives (Agent Teams / SendMessage / teammate).
    for (const sub of ['task-deliver', 'verify-multispec']) {
      expect(codex[sub], `${sub} missing`).toBeDefined()
      expect(codex[sub]).not.toBe(claude[sub])
    }
    // Spot-check both placeholder classes: a token swap and a whole-line C-class
    // note whose codex wording drops the Claude-only claim entirely.
    expect(codex['verify-multispec']).toContain('cross-question findings via send_input')
    expect(codex['verify-multispec']).toContain('`close_agent` for each of the 4 agents')
    // ...and that the discipline surface followed, not just role-prompts.
    expect(claude['verify-multispec']).toContain('(e.g. Claude Code, GSD, subagent')
    expect(codex['verify-multispec']).toContain('(e.g. Codex, GSD, subagent')
  })
})
