// v16.0 Phase 65 T3 — byte-exact golden for the CLAUDE-side install artifact.
//
// ─────────────────────────────────────────────────────────────────────────────
// READ THIS BEFORE RE-RECORDING.
//
// The claude golden is the PRE-REWRITE baseline. It was recorded on the tree as
// it stood before any `{{ host.* }}` placeholder entered a SKILL.md body, which
// makes it the reference for the one invariant Phase 65 is built around:
//
//     Rewriting prose into `{{ host.* }}` placeholders must leave the CLAUDE
//     artifact byte-identical. The claude column of host-primitives.yaml holds
//     the exact words the body already said.
//
// So if this test goes red during the bulk rewrite, the rewrite is wrong — a
// placeholder was introduced whose claude text does not restore the original
// wording (a stray space, a reflowed line, an "improved" phrasing). It is NOT a
// signal to re-record. Fix the yaml value or the body; leave the golden alone.
//
// Legitimate re-record reasons are limited to: intentional SKILL.md content
// edits, a new/removed workflow dir, or a change to the render pipeline itself.
// Then, and only then:
//
//     UPDATE_RENDER_GOLDEN=1 corepack pnpm exec vitest run tests/cli/renderGolden.test.ts
//
// and review the resulting JSON diff hash-by-hash in the commit.
// ─────────────────────────────────────────────────────────────────────────────
//
// Mechanism: replay the real install path (setup.ts Step A `cp` + Step A.5
// renderAllSkills) into a temp dir, then hash every produced file. A sha256
// manifest rather than stored bodies — the assertion is "nothing moved", and a
// diff of 90-odd hashes stays reviewable where 90 embedded markdown bodies
// would not. The `{relative path: sha256}` shape also catches added, removed
// and renamed artifacts, which a whole-tree digest would blur into one hash.
//
// codex gets a SANITY test, not a golden: its artifact is expected to change
// with every rewrite wave, so pinning bytes there would be pure churn. What is
// worth pinning is that codex renders at all and leaves nothing unresolved.

import { createHash } from 'node:crypto'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { cp, mkdir, readdir, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import type { HostId } from '../../src/cli/lib/hostPrimitives.js'
import { renderAllSkills } from '../../src/cli/lib/renderSkillTemplates.js'
import type { SupportedLocale } from '../../src/i18n/index.js'
import { scanWorkflowsNested } from '../../src/workflow/scan-nested.js'

const REPO_ROOT = resolve(__dirname, '..', '..')
const WORKFLOWS_DIR = join(REPO_ROOT, 'workflows')
const GOLDEN_DIR = join(REPO_ROOT, 'tests', 'fixtures', 'render-golden')

const UPDATE = process.env.UPDATE_RENDER_GOLDEN === '1'

const tempDirs: string[] = []

afterEach(() => {
  while (tempDirs.length > 0) {
    const d = tempDirs.pop()
    if (d) rmSync(d, { recursive: true, force: true })
  }
})

/** `{relative posix path: sha256}` for every file under `root`, keys sorted. */
async function hashTree(root: string): Promise<Record<string, string>> {
  const out: Record<string, string> = {}
  async function walk(dir: string, prefix: string): Promise<void> {
    const entries = await readdir(dir, { withFileTypes: true })
    for (const e of [...entries].sort((a, b) => (a.name < b.name ? -1 : 1))) {
      const rel = prefix === '' ? e.name : `${prefix}/${e.name}`
      if (e.isDirectory()) await walk(join(dir, e.name), rel)
      else
        out[rel] = createHash('sha256')
          .update(await readFile(join(dir, e.name)))
          .digest('hex')
    }
  }
  await walk(root, '')
  return Object.fromEntries(
    Object.keys(out)
      .sort()
      .map((k) => [k, out[k] as string]),
  )
}

/**
 * Replay setup.ts Step A + A.5 for one (locale, host) pair into a temp skills dir.
 *
 * `homedirOverride` points at an empty temp home so the capability resolver sees
 * no installed plugins / user skills — the rendered BODY does not depend on them
 * (resolveCapabilityCmd never mutates cmd, only warns), but pinning the input
 * keeps the run hermetic on any developer machine.
 */
async function renderTree(
  locale: SupportedLocale,
  host: HostId,
): Promise<{ skillsBase: string; warnings: string[] }> {
  const root = mkdtempSync(join(tmpdir(), `render-golden-${host}-`))
  tempDirs.push(root)
  const skillsBase = join(root, 'skills')
  const fakeHome = join(root, 'home')
  await mkdir(skillsBase, { recursive: true })
  await mkdir(fakeHome, { recursive: true })

  const entries = await readdir(WORKFLOWS_DIR)
  const { workflows } = await scanWorkflowsNested(WORKFLOWS_DIR, entries)
  for (const wf of workflows) {
    await cp(join(WORKFLOWS_DIR, wf.relPath), join(skillsBase, wf.name), {
      recursive: true,
      force: true,
    })
  }
  const { aggregatedWarnings } = await renderAllSkills(
    workflows.map((w) => w.name),
    skillsBase,
    WORKFLOWS_DIR,
    fakeHome,
    locale,
    host,
  )
  return { skillsBase, warnings: aggregatedWarnings }
}

/** Stable on-disk form: sorted keys, 2-space indent, trailing newline. */
function serialize(manifest: Record<string, string>): string {
  return `${JSON.stringify(manifest, null, 2)}\n`
}

describe('claude install artifact — byte-exact golden', () => {
  for (const locale of ['en', 'zh-Hans'] as const) {
    it(`claude x ${locale} matches tests/fixtures/render-golden/claude-${locale}.json`, async () => {
      const { skillsBase } = await renderTree(locale, 'claude')
      const actual = await hashTree(skillsBase)
      const goldenPath = join(GOLDEN_DIR, `claude-${locale}.json`)

      if (UPDATE) {
        writeFileSync(goldenPath, serialize(actual), 'utf8')
      }
      expect(existsSync(goldenPath), `missing golden — record it with UPDATE_RENDER_GOLDEN=1`).toBe(
        true,
      )

      const expected = JSON.parse(readFileSync(goldenPath, 'utf8')) as Record<string, string>
      // Compare the key SET first: a file that appeared or vanished is a clearer
      // failure than 90 hash mismatches.
      expect(Object.keys(actual).sort()).toEqual(Object.keys(expected).sort())
      expect(actual).toEqual(expected)
    })
  }

  it('the golden is non-trivial (every installed skill contributes a SKILL.md)', async () => {
    const expected = JSON.parse(readFileSync(join(GOLDEN_DIR, 'claude-en.json'), 'utf8')) as Record<
      string,
      string
    >
    const skillMds = Object.keys(expected).filter((k) => k.endsWith('/SKILL.md'))
    const entries = await readdir(WORKFLOWS_DIR)
    const { workflows } = await scanWorkflowsNested(WORKFLOWS_DIR, entries)
    expect(skillMds).toHaveLength(workflows.length)
    expect(workflows.length).toBeGreaterThan(20)
  })

  it('zh-Hans install strips the SKILL.zh-Hans.md siblings the en install keeps', async () => {
    const en = Object.keys(
      JSON.parse(readFileSync(join(GOLDEN_DIR, 'claude-en.json'), 'utf8')) as object,
    )
    const zh = Object.keys(
      JSON.parse(readFileSync(join(GOLDEN_DIR, 'claude-zh-Hans.json'), 'utf8')) as object,
    )
    expect(en.some((k) => k.endsWith('/SKILL.zh-Hans.md'))).toBe(true)
    expect(zh.some((k) => k.endsWith('/SKILL.zh-Hans.md'))).toBe(false)
  })
})

describe('codex install artifact — sanity only (bodies change per rewrite wave)', () => {
  for (const locale of ['en', 'zh-Hans'] as const) {
    it(`codex x ${locale} renders with no unresolved \`{{ host.\` left behind`, async () => {
      const { skillsBase, warnings } = await renderTree(locale, 'codex')
      // A throwing host render surfaces as an aggregated per-skill warning, never
      // as a thrown error — assert the clean run explicitly.
      expect(warnings.filter((w) => w.includes('host-primitive'))).toEqual([])

      const manifest = await hashTree(skillsBase)
      const skillMds = Object.keys(manifest).filter((k) => k.endsWith('SKILL.md'))
      expect(skillMds.length).toBeGreaterThan(20)
      for (const rel of skillMds) {
        const body = readFileSync(join(skillsBase, rel), 'utf8')
        expect(body, `${rel} still carries an unrendered host placeholder`).not.toContain(
          '{{ host.',
        )
        expect(body, `${rel} still carries an unrendered host placeholder`).not.toContain('{{host.')
      }
    })
  }
})
