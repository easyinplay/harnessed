// v16.0 Phase 65 batch D — byte-exact golden for the CLAUDE-side S2 artifact.
//
// S2 = the generated slash-command bodies (`src/cli/lib/generateCommands.ts`),
// i.e. `~/.claude/commands/<x>.md` on claude and `~/.codex/prompts/<x>.md` on
// codex. Unlike S1 (workflows/**/SKILL.md, which is copied then rendered) this
// surface is SYNTHESISED from TypeScript template literals, so before batch D it
// had no byte lock at all — the sister gate for S1 is tests/cli/renderGolden.test.ts.
//
// ─────────────────────────────────────────────────────────────────────────────
// READ THIS BEFORE RE-RECORDING.
//
// The claude manifests below were recorded on the tree as it stood BEFORE any
// `{{ host.* }}` placeholder entered a command body. They are the pre-rewrite
// baseline for the invariant batch D is built around:
//
//     Rewriting command prose into `{{ host.* }}` placeholders must leave the
//     CLAUDE artifact byte-identical. The `claude` column of host-primitives.yaml
//     holds the exact words the body already said.
//
// So DURING THE PHASE 65 REWRITE the claude golden MUST NOT MOVE. If it goes red,
// the rewrite is wrong — a placeholder was introduced whose claude text does not
// restore the original wording (a stray space, a dropped comma, an "improved"
// phrasing). That is a bug, NOT a re-record signal. Fix the yaml value or the
// template literal; leave the golden alone.
//
// Legitimate re-record reasons are limited to: an intentional command-body content
// edit, a new/removed workflow dir, a role-prompts.yaml description change, or a
// change to the generator's own structure. Then, and only then:
//
//     UPDATE_RENDER_GOLDEN=1 corepack pnpm exec vitest run tests/cli/generateCommandsGolden.test.ts
//
// and review the resulting JSON diff hash-by-hash in the commit.
// ─────────────────────────────────────────────────────────────────────────────
//
// Mechanism: call `generateCommandFile` for every installed workflow that has a
// role-prompts entry (the exact set `writeAllCommands` renders in setup.ts Step
// A.6) and hash each body. A sha256 manifest rather than stored bodies — the
// assertion is "nothing moved", and a diff of ~60 hashes stays reviewable where
// ~60 embedded markdown bodies would not. The `{<name>.md: sha256}` shape also
// catches an added / removed / renamed command, which a whole-surface digest
// would blur into one hash.
//
// The claude side is generated through the FIVE-ARG call — the back-compat form
// whose host-primitive context defaults to (claude, packaged en table). Locking
// that path is deliberate: it is what every existing caller gets, so a default
// that silently stopped restoring the claude wording would surface here.
//
// codex gets a SANITY test, not a golden: its bodies are expected to change with
// every rewrite wave, so pinning bytes there would be pure churn. What is worth
// pinning is that codex renders at all, leaves nothing unresolved, and stops
// pointing at `~/.claude/` paths that do not exist on that host.

import { createHash } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { readdir } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { generateCommandFile } from '../../src/cli/lib/generateCommands.js'
import {
  type HostId,
  loadHostPrimitives,
  type RenderHostPrimitivesOptions,
} from '../../src/cli/lib/hostPrimitives.js'
import type { SupportedLocale } from '../../src/i18n/index.js'
import { loadRolePrompts } from '../../src/workflow/rolePrompts.js'
import { scanWorkflowsNested } from '../../src/workflow/scan-nested.js'

const REPO_ROOT = resolve(__dirname, '..', '..')
const WORKFLOWS_DIR = join(REPO_ROOT, 'workflows')
const GOLDEN_DIR = join(REPO_ROOT, 'tests', 'fixtures', 'render-golden')

const UPDATE = process.env.UPDATE_RENDER_GOLDEN === '1'

/** The command set setup.ts Step A.6 renders: every installed workflow that has a
 *  `role-prompts.yaml` entry, in sorted order. */
async function commandNames(): Promise<string[]> {
  const entries = await readdir(WORKFLOWS_DIR)
  const { workflows } = await scanWorkflowsNested(WORKFLOWS_DIR, entries)
  return workflows.map((w) => w.name).sort()
}

/**
 * `{<name>.md: full body}` for one locale.
 *
 * `hostRender` omitted → the 5-arg back-compat call, whose context defaults to
 * (claude, packaged en table). That is the path the claude golden locks.
 */
async function buildAll(
  locale: SupportedLocale,
  hostRender?: RenderHostPrimitivesOptions,
): Promise<Record<string, string>> {
  const prompts = await loadRolePrompts(WORKFLOWS_DIR, locale)
  const out: Record<string, string> = {}
  for (const name of await commandNames()) {
    const prompt = prompts[name]
    if (!prompt) continue
    const { content } = generateCommandFile(name, prompt, {}, new Set(), new Set(), hostRender)
    out[`${name}.md`] = content
  }
  return out
}

/** Explicit render context for one host, from the real en table. */
async function hostRenderFor(host: HostId): Promise<RenderHostPrimitivesOptions> {
  return { host, table: await loadHostPrimitives({ workflowsDir: WORKFLOWS_DIR, locale: 'en' }) }
}

/** `{<name>.md: sha256}`, keys sorted. */
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

describe('claude command bodies (S2) — byte-exact golden', () => {
  for (const locale of ['en', 'zh-Hans'] as const) {
    it(`claude x ${locale} matches tests/fixtures/render-golden/commands-claude-${locale}.json`, async () => {
      const actual = manifest(await buildAll(locale))
      const goldenPath = join(GOLDEN_DIR, `commands-claude-${locale}.json`)

      if (UPDATE) writeFileSync(goldenPath, serialize(actual), 'utf8')
      expect(existsSync(goldenPath), `missing golden — record it with UPDATE_RENDER_GOLDEN=1`).toBe(
        true,
      )

      const expected = JSON.parse(readFileSync(goldenPath, 'utf8')) as Record<string, string>
      // Key SET first: a command that appeared or vanished is a clearer failure
      // than N hash mismatches.
      expect(Object.keys(actual).sort()).toEqual(Object.keys(expected).sort())
      expect(actual).toEqual(expected)
    })
  }

  it('the golden covers every installed workflow except the pinned prompt-less ones', async () => {
    const names = await commandNames()
    const prompts = await loadRolePrompts(WORKFLOWS_DIR, 'en')
    // Pre-existing gap, NOT introduced here: these three workflow dirs ship a
    // SKILL.md but no `role-prompts.yaml` entry, so setup.ts Step A.6 skips them
    // with a warning and no command file is written. Pinned rather than asserted
    // away so the golden cannot silently shrink by losing a role-prompt entry.
    expect(names.filter((n) => !prompts[n])).toEqual([
      'verify-eval-review',
      'verify-second-opinion',
      'verify-validate-phase',
    ])
    const expected = JSON.parse(
      readFileSync(join(GOLDEN_DIR, 'commands-claude-en.json'), 'utf8'),
    ) as Record<string, string>
    expect(Object.keys(expected)).toHaveLength(names.filter((n) => prompts[n]).length)
    expect(Object.keys(expected).length).toBeGreaterThan(20)
  })
})

describe('codex command bodies (S2) — sanity only (bodies change per rewrite wave)', () => {
  it('renders with no unresolved `{{ host.` left behind', async () => {
    const bodies = await buildAll('en', await hostRenderFor('codex'))
    expect(Object.keys(bodies).length).toBeGreaterThan(20)
    for (const [file, body] of Object.entries(bodies)) {
      expect(body, `${file} still carries an unrendered host placeholder`).not.toContain('{{ host.')
      expect(body, `${file} still carries an unrendered host placeholder`).not.toContain('{{host.')
    }
  })

  it('names no `~/.claude/` path — the codex host has none of them', async () => {
    // The two that shipped pre-Phase-65: `~/.claude/rules/agent-teams.md` (a
    // user-private CC rules file with no codex counterpart, dropped by the codex
    // column of `teams_step_note.command`) and `~/.claude/skills/<name>/SKILL.md`
    // (now descriptor-derived → `~/.agents/skills/...`).
    const bodies = await buildAll('en', await hostRenderFor('codex'))
    for (const [file, body] of Object.entries(bodies)) {
      expect(body, `${file} still points at a claude-only path`).not.toContain('~/.claude/')
    }
  })

  it('the claude side still names the CC primitives (the branch is real, not a blanket drop)', async () => {
    const claude = await buildAll('en', await hostRenderFor('claude'))
    const codex = await buildAll('en', await hostRenderFor('codex'))
    const claudeAuto = claude['auto.md'] as string
    const codexAuto = codex['auto.md'] as string
    expect(claudeAuto).toContain('CC-native Task / Agent tools')
    expect(claudeAuto).toContain('~/.claude/rules/agent-teams.md')
    expect(codexAuto).toContain('codex-native spawn_agent tools')
    expect(codexAuto).toContain('spawn_agent(task_name:')
    expect(codexAuto).not.toContain('CC-native')
    expect(codexAuto).not.toContain('AskUserQuestion')

    const claudeExec = claude['verify-paranoid.md'] as string
    const codexExec = codex['verify-paranoid.md'] as string
    expect(claudeExec).toContain('~/.claude/skills/verify-paranoid/SKILL.md')
    expect(claudeExec).toContain('(Claude loads it when triggers match)')
    expect(codexExec).toContain('~/.agents/skills/verify-paranoid/SKILL.md')
    expect(codexExec).toContain('(Codex loads it when triggers match)')
    expect(codexExec).toContain('request_user_input')
  })
})
