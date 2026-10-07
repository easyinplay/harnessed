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

/**
 * A locale body sibling (`SKILL.zh-Hans.md`, and any future `SKILL.<locale>.md`)
 * as it sits in the install dir — NOT the rendered `SKILL.md`.
 *
 * SCOPE RULING (v16.0 Phase 65). These files are excluded from the byte lock, on
 * both the claude golden and the codex sanity check, so the two gates share one
 * scope. Rationale: what this suite locks is the bytes THE HOST ACTUALLY READS,
 * and Claude Code's skill-loading contract reads `SKILL.md` only. On an en
 * install `renderSkillFile` picks `SKILL.md` as the source, so `localeBodySelected`
 * is false and the zh sibling is neither rendered nor stripped — it is a dead `cp`
 * leftover nothing consumes. (On a zh install it IS the source and IS stripped, so
 * it never reaches the manifest there anyway.)
 *
 * Including it would make every legitimate edit to a zh SOURCE body read as a
 * regression: from Phase 65 on those bodies carry `{{ host.* }}` placeholders by
 * design, so the dead copy's bytes MUST move while the rendered artifact does not.
 * That is the opposite of what this golden is for.
 *
 * The product behaviour is unchanged and deliberately still asserted below ("the
 * en install keeps the sibling, the zh install strips it"); that an en install
 * therefore ships one file with unresolved placeholders in it is a pre-existing
 * side effect recorded in the Phase 65 findings / TODOS, not a Phase 65 change.
 */
const LOCALE_SIBLING_RX = /(^|\/)SKILL\.[A-Za-z][A-Za-z-]*\.md$/

/** `{relative posix path: sha256}` for every byte-locked file under `root`,
 *  keys sorted. Locale body siblings are out of scope — see LOCALE_SIBLING_RX. */
async function hashTree(root: string): Promise<Record<string, string>> {
  const out: Record<string, string> = {}
  for (const rel of await listTree(root)) {
    if (LOCALE_SIBLING_RX.test(rel)) continue
    out[rel] = createHash('sha256')
      .update(await readFile(join(root, rel)))
      .digest('hex')
  }
  return Object.fromEntries(
    Object.keys(out)
      .sort()
      .map((k) => [k, out[k] as string]),
  )
}

/** Every relative posix path under `root`, sorted — presence, not bytes. */
async function listTree(root: string): Promise<string[]> {
  const out: string[] = []
  async function walk(dir: string, prefix: string): Promise<void> {
    const entries = await readdir(dir, { withFileTypes: true })
    for (const e of [...entries].sort((a, b) => (a.name < b.name ? -1 : 1))) {
      const rel = prefix === '' ? e.name : `${prefix}/${e.name}`
      if (e.isDirectory()) await walk(join(dir, e.name), rel)
      else out.push(rel)
    }
  }
  await walk(root, '')
  return out.sort()
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

  // Product behaviour, asserted on the real install trees rather than on the golden
  // manifests: the siblings are out of the BYTE lock (LOCALE_SIBLING_RX), but whether
  // they EXIST is a contract of its own and stays pinned here.
  //
  // v16.0 post-close — this used to pin "zh strips, en keeps". The en half was not a
  // contract worth keeping: it left `SKILL.zh-Hans.md` in the install dir with its
  // `{{ … }}` placeholders unresolved. Nothing reads it (the host loads `SKILL.md`
  // only), so it was never dangerous, only misleading to whoever opened it — and on
  // codex the skills dir is a SHARED convention dir. Both locales now strip.
  it('neither install leaves a SKILL.zh-Hans.md behind — one rendered SKILL.md per dir', async () => {
    const en = await listTree((await renderTree('en', 'claude')).skillsBase)
    const zh = await listTree((await renderTree('zh-Hans', 'claude')).skillsBase)
    expect(en.some((k) => k.endsWith('/SKILL.zh-Hans.md'))).toBe(false)
    expect(zh.some((k) => k.endsWith('/SKILL.zh-Hans.md'))).toBe(false)
    // Sanity: the trees are not empty, so the two assertions above mean something.
    expect(en.filter((k) => k.endsWith('/SKILL.md')).length).toBeGreaterThan(20)
  })
})

describe('codex install artifact — sanity only (bodies change per rewrite wave)', () => {
  for (const locale of ['en', 'zh-Hans'] as const) {
    it(`codex x ${locale} renders with no unresolved \`{{ host.\` left behind`, async () => {
      const { skillsBase, warnings } = await renderTree(locale, 'codex')
      // A throwing host render surfaces as an aggregated per-skill warning, never
      // as a thrown error — assert the clean run explicitly.
      expect(warnings.filter((w) => w.includes('host-primitive'))).toEqual([])

      // SAME SCOPE as the claude golden above (LOCALE_SIBLING_RX): the files under
      // test are the rendered `SKILL.md` bodies the host reads.
      //
      // v16.0 post-close — that filter used to be load-bearing, because an en install
      // left an unrendered `SKILL.*.md` sibling in the dest and asserting "no
      // `{{ host.`" over it would fail by construction. Both locales now strip, so the
      // filter is belt-and-braces: the cell above asserts no sibling survives either
      // install, which is what makes it redundant. Keeping it (rather than deleting it)
      // means a regression that starts leaving siblings again does not also silently
      // widen this gate's scope — the sibling-absence cell fails first and names the
      // real problem. The scopes of the two gates stay symmetric either way.
      const manifest = await hashTree(skillsBase)
      const skillMds = Object.keys(manifest).filter((k) => k.endsWith('/SKILL.md'))
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
