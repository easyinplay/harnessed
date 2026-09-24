// v16.0 Phase 65 T10 — the host-map section (SPEC R4).
//
// What this file locks:
//   1. claude gets ZERO bytes — not even a strip of a pre-existing region.
//      (The byte-exact golden in renderGolden.test.ts is the other half of this;
//      here it is asserted directly on the unit so a failure names the cause.)
//   2. The section's bytes for a known table — the whole scaffold, not a substring.
//   3. Row selection is DERIVED (single-line, short `default` cells in both
//      columns), so paragraph-shaped C-class primitives stay out of the glossary.
//   4. Insertion lands after the frontmatter and leaves it parseable.
//   5. Idempotence — rendering an already-rendered body reproduces it byte-for-byte
//      instead of stacking a second region.
//   6. The real workflows/host-primitives*.yaml produces exactly one paired region
//      per installed SKILL.md on codex, and none on claude.

import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { parse as parseYaml } from 'yaml'
import {
  buildHostMapSection,
  HOST_MAP_END,
  HOST_MAP_START,
  type HostPrimitiveTable,
  hostMapRows,
  insertHostMapSection,
  loadHostMapNotes,
  loadHostPrimitives,
} from '../../src/cli/lib/hostPrimitives.js'
import { renderAllSkills } from '../../src/cli/lib/renderSkillTemplates.js'

const REPO_ROOT = resolve(__dirname, '..', '..')
const WORKFLOWS_DIR = join(REPO_ROOT, 'workflows')

/** Two term primitives (glossary material) + one paragraph primitive (not). */
const TABLE: HostPrimitiveTable = {
  skills_dir: { default: { claude: '~/.claude/skills', codex: '~/.agents/skills' } },
  send_message: { default: { claude: 'SendMessage', codex: 'send_input' } },
  team: { default: { claude: 'Agent Teams', codex: 'a formation (repeated `spawn_agent`)' } },
  long_note: {
    default: {
      claude: `x${'y'.repeat(80)}`,
      codex: `x${'z'.repeat(80)}`,
    },
  },
  block_note: { default: { claude: 'one\ntwo', codex: 'uno\ndos' } },
  half: { default: { claude: 'claude-only' } },
  no_default: { other: { claude: 'a', codex: 'b' } },
}

const NOTES = ['first caveat', 'second caveat']

describe('buildHostMapSection — claude emits nothing at all', () => {
  it('returns the empty string for claude, however rich the inputs', () => {
    expect(buildHostMapSection({ host: 'claude', table: TABLE, notes: NOTES })).toBe('')
  })

  it('returns the empty string when there is nothing to say', () => {
    expect(buildHostMapSection({ host: 'codex', table: {}, notes: [] })).toBe('')
    expect(buildHostMapSection({ host: 'codex', table: {} })).toBe('')
  })
})

describe('hostMapRows — derived glossary selection', () => {
  it('keeps single-line short `default` cells in both columns, sorted by primitive', () => {
    expect(hostMapRows(TABLE).map((r) => r.primitive)).toEqual([
      'send_message',
      'skills_dir',
      'team',
    ])
  })

  it('drops paragraph cells, multi-line cells, half-filled cells and defaultless primitives', () => {
    const kept = new Set(hostMapRows(TABLE).map((r) => r.primitive))
    for (const dropped of ['long_note', 'block_note', 'half', 'no_default']) {
      expect(kept.has(dropped), `${dropped} must not reach the glossary`).toBe(false)
    }
  })
})

describe('buildHostMapSection — byte shape for a known table', () => {
  it('renders the full scaffold, markers included', () => {
    expect(buildHostMapSection({ host: 'codex', table: TABLE, notes: NOTES })).toBe(
      [
        '<!-- harnessed:host-map:start -->',
        '## Host map — codex',
        '',
        'harnessed rendered this artifact for the **codex** harness and installed it under ' +
          '`~/.agents/skills`. The workflow prose was authored against Claude Code, so where a ' +
          'step names a tool it names the codex one. Use the table to decode any instruction ' +
          'that still reads as Claude-Code-shaped; do not substitute the Claude Code names back.',
        '',
        '| primitive | Claude Code | codex |',
        '| --- | --- | --- |',
        '| `send_message` | `SendMessage` | `send_input` |',
        '| `skills_dir` | `~/.claude/skills` | `~/.agents/skills` |',
        '| `team` | `Agent Teams` | a formation (repeated `spawn_agent`) |',
        '',
        'Caveats — these hold for the whole artifact:',
        '',
        '- first caveat',
        '- second caveat',
        '<!-- harnessed:host-map:end -->',
      ].join('\n'),
    )
  })

  it('omits the caveat block when there are no notes, and still pairs the markers', () => {
    const s = buildHostMapSection({ host: 'codex', table: TABLE })
    expect(s).not.toContain('Caveats')
    expect(s.startsWith(HOST_MAP_START)).toBe(true)
    expect(s.endsWith(HOST_MAP_END)).toBe(true)
  })

  it('a value carrying its own backticks is not double-fenced; a pipe is escaped', () => {
    const s = buildHostMapSection({
      host: 'codex',
      table: { p: { default: { claude: 'a|b', codex: 'has `code`' } } },
    })
    expect(s).toContain('| `p` | `a\\|b` | has `code` |')
  })
})

describe('insertHostMapSection — position and frontmatter safety', () => {
  const FM = '---\nname: demo\ndescription: d\n---\n'
  const BODY = `${FM}\n# Heading\n\ntext\n`

  it('splices after the frontmatter, leaving `---` on line 1 and the block parseable', () => {
    const out = insertHostMapSection(BODY, buildHostMapSection({ host: 'codex', table: TABLE }))
    expect(out.startsWith('---\n')).toBe(true)
    const fm = /^---\n([\s\S]*?)\n---\n/.exec(out)
    expect(fm).not.toBeNull()
    expect(parseYaml(fm?.[1] ?? '')).toEqual({ name: 'demo', description: 'd' })
    // and the region sits between the frontmatter and the first body heading
    expect(out.indexOf(HOST_MAP_START)).toBeGreaterThan(out.indexOf('\n---\n'))
    expect(out.indexOf(HOST_MAP_END)).toBeLessThan(out.indexOf('# Heading'))
  })

  it('normalizes the surrounding blank lines to exactly one on each side', () => {
    const out = insertHostMapSection(BODY, buildHostMapSection({ host: 'codex', table: TABLE }))
    expect(out).toContain(`---\n\n${HOST_MAP_START}`)
    expect(out).toContain(`${HOST_MAP_END}\n\n# Heading`)
  })

  it('a body with no frontmatter takes offset 0 with no leading blank line', () => {
    const out = insertHostMapSection(
      'plain body\n',
      buildHostMapSection({ host: 'codex', table: TABLE }),
    )
    expect(out.startsWith(HOST_MAP_START)).toBe(true)
    expect(out.endsWith('plain body\n')).toBe(true)
  })

  it('an empty section returns the body byte-identically — even with a stale region', () => {
    const stale = `${FM}\n${HOST_MAP_START}\nold\n${HOST_MAP_END}\n\nbody\n`
    expect(insertHostMapSection(stale, '')).toBe(stale)
    expect(insertHostMapSection(BODY, '')).toBe(BODY)
  })
})

describe('insertHostMapSection — idempotence', () => {
  const FM = '---\nname: demo\n---\n'
  const BODY = `${FM}\n# Heading\n\ntext\n`
  const SECTION = buildHostMapSection({ host: 'codex', table: TABLE, notes: NOTES })

  it('inserting twice yields the same bytes as inserting once', () => {
    const once = insertHostMapSection(BODY, SECTION)
    expect(insertHostMapSection(once, SECTION)).toBe(once)
    expect(insertHostMapSection(insertHostMapSection(once, SECTION), SECTION)).toBe(once)
  })

  it('exactly one marker pair survives repeated inserts', () => {
    let body = BODY
    for (let i = 0; i < 3; i++) body = insertHostMapSection(body, SECTION)
    expect(body.split(HOST_MAP_START)).toHaveLength(2)
    expect(body.split(HOST_MAP_END)).toHaveLength(2)
  })

  it('a region that drifted (different content) is replaced, not appended to', () => {
    const stale = `${FM}\n${HOST_MAP_START}\nOLD CONTENT\n${HOST_MAP_END}\n\n# Heading\n`
    const out = insertHostMapSection(stale, SECTION)
    expect(out).not.toContain('OLD CONTENT')
    expect(out.split(HOST_MAP_START)).toHaveLength(2)
  })
})

describe('the REAL workflows/host-primitives*.yaml', () => {
  for (const locale of ['en', 'zh-Hans'] as const) {
    it(`codex x ${locale}: the section carries every caveat verbatim and a paired marker`, async () => {
      const table = await loadHostPrimitives({ workflowsDir: WORKFLOWS_DIR, locale })
      const notes = await loadHostMapNotes({ workflowsDir: WORKFLOWS_DIR, locale, host: 'codex' })
      expect(notes.length).toBeGreaterThanOrEqual(3)
      const s = buildHostMapSection({ host: 'codex', table, notes })
      expect(s.startsWith(HOST_MAP_START)).toBe(true)
      expect(s.endsWith(HOST_MAP_END)).toBe(true)
      for (const n of notes) expect(s).toContain(`- ${n}`)
      // The glossary is the A-class term set; the C-class paragraph primitives
      // must not have leaked into it.
      const prims = hostMapRows(table).map((r) => r.primitive)
      expect(prims).toContain('ask_user')
      expect(prims).toContain('skills_dir')
      expect(prims).not.toContain('teams_step_note')
      expect(prims).not.toContain('teams_teardown_note')
    })

    it(`claude x ${locale}: no notes are read and no section is produced`, async () => {
      const table = await loadHostPrimitives({ workflowsDir: WORKFLOWS_DIR, locale })
      const notes = await loadHostMapNotes({ workflowsDir: WORKFLOWS_DIR, locale, host: 'claude' })
      expect(notes).toEqual([])
      expect(buildHostMapSection({ host: 'claude', table, notes })).toBe('')
    })
  }
})

describe('install path — exactly one region per rendered SKILL.md', () => {
  let tmpRoot: string

  beforeEach(() => {
    tmpRoot = mkdtempSync(join(tmpdir(), 'host-map-'))
    writeFileSync(join(tmpRoot, 'capabilities.yaml'), 'capabilities: {}\n', 'utf8')
    writeFileSync(
      join(tmpRoot, 'host-primitives.yaml'),
      [
        'version: 1',
        'primitives:',
        '  send_message:',
        '    default:',
        '      claude: "SendMessage"',
        '      codex: "send_input"',
        'host_map_notes:',
        '  codex:',
        '    - "a caveat"',
        '',
      ].join('\n'),
      'utf8',
    )
  })

  afterEach(() => rmSync(tmpRoot, { recursive: true, force: true }))

  function makeSkill(name: string, body: string): void {
    mkdirSync(join(tmpRoot, name), { recursive: true })
    writeFileSync(join(tmpRoot, name, 'SKILL.md'), body, 'utf8')
  }
  const read = (name: string) => readFileSync(join(tmpRoot, name, 'SKILL.md'), 'utf8')

  const SRC = '---\nname: demo\n---\n\n# Demo\n\nuse {{ host.send_message }}\n'

  it('codex: one paired region, the caveat present, the body still rendered', async () => {
    makeSkill('demo', SRC)
    await renderAllSkills(['demo'], tmpRoot, tmpRoot, tmpRoot, 'en', 'codex')
    const out = read('demo')
    expect(out.split(HOST_MAP_START)).toHaveLength(2)
    expect(out.split(HOST_MAP_END)).toHaveLength(2)
    expect(out).toContain('- a caveat')
    expect(out).toContain('use send_input')
    expect(out.startsWith('---\nname: demo\n---\n\n<!--')).toBe(true)
  })

  it('codex: re-running the install over its own output does not stack a second region', async () => {
    makeSkill('demo', SRC)
    await renderAllSkills(['demo'], tmpRoot, tmpRoot, tmpRoot, 'en', 'codex')
    const first = read('demo')
    // No re-`cp`: render straight over the already-rendered dest, the worst case
    // for idempotence (the placeholders are gone, the region is not).
    await renderAllSkills(['demo'], tmpRoot, tmpRoot, tmpRoot, 'en', 'codex')
    expect(read('demo')).toBe(first)
    expect(read('demo').split(HOST_MAP_START)).toHaveLength(2)
  })

  it('claude: the rendered artifact carries no marker at all', async () => {
    makeSkill('demo', SRC)
    await renderAllSkills(['demo'], tmpRoot, tmpRoot, tmpRoot, 'en', 'claude')
    const out = read('demo')
    expect(out).not.toContain('harnessed:host-map')
    expect(out).toBe('---\nname: demo\n---\n\n# Demo\n\nuse SendMessage\n')
  })
})
