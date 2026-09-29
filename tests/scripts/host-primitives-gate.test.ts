// v16.0 Phase 65 T11 — tests for the host-primitive residue gate.
//
// Imports the pure fn from the .mjs; the hand-written sibling .d.mts gives it
// types (scripts/** is in tsconfig include with allowJs off), and vitest
// transforms the .mjs at runtime via esbuild. Sister:
// tests/scripts/skill-i18n-parity.test.ts.
//
// Two layers:
//   * one integration case against the REAL tree — the contract Phase 65 signed
//     ("the codex render names no Claude Code primitive") is only meaningful as a
//     statement about this repo, and a fixture cannot make that statement;
//   * fixture cases for each rule of the mechanism, so a regression names the
//     rule it broke instead of dumping the whole workflows tree.
//
// Fixture repos write a STUB src/cli/lib/hostPrimitives.ts carrying only the two
// marker exports — which also exercises the "read the markers from the emitter"
// contract in hostMapMarkers.

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  CC_TOKENS,
  checkHostPrimitives,
  hostMapMarkers,
  MASKS,
  maskPhrase,
  scanCcTokens,
} from '../../scripts/check-host-primitives.mjs'

const REPO_ROOT = resolve(__dirname, '..', '..')

let tmp = ''

beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), 'host-primitives-gate-'))
})

afterEach(() => {
  if (tmp) rmSync(tmp, { recursive: true, force: true })
})

function write(rel: string, content: string): void {
  const path = join(tmp, rel)
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, content, 'utf8')
}

/** Minimal primitives table: one token swap plus one whose codex column is clean. */
const PRIMITIVES = `version: 1
primitives:
  teammate:
    default:
      claude: "teammate"
      codex: "agent"
  send_message:
    default:
      claude: "SendMessage"
      codex: "send_input"
`

const CAPABILITIES = `capabilities:
  agent-teams-create:
    cmd: 'Agent(name, run_in_background=true)'
    by_host:
      codex:
        cmd: 'spawn_agent(agent_type, message)'
  legacy-no-codex:
    cmd: 'SendMessage'
`

/**
 * A SKILL.md that quotes every MASK phrase verbatim, so fixture runs do not
 * collect a stale-mask violation for masks the fixture has no other reason to
 * exercise. The phrases are blanked before scanning, so this body contributes no
 * token hits of its own.
 */
function maskAnchor(): string {
  return `---\nname: anchor\n---\n\n# Anchor\n\n${MASKS.map((m) => m.phrase).join('\n\n')}\n`
}

/** Lay down a fixture repo: stub emitter + tables + the given SKILL bodies. */
function fixture(skills: Record<string, string>, extra: Record<string, string> = {}): string {
  write(
    'src/cli/lib/hostPrimitives.ts',
    [
      "export const HOST_MAP_START = '<!-- harnessed:host-map:start -->'",
      "export const HOST_MAP_END = '<!-- harnessed:host-map:end -->'",
      '',
    ].join('\n'),
  )
  write('workflows/host-primitives.yaml', PRIMITIVES)
  write('workflows/host-primitives.zh-Hans.yaml', PRIMITIVES)
  write('workflows/capabilities.yaml', CAPABILITIES)
  write('workflows/_anchor/SKILL.md', maskAnchor())
  for (const [slug, body] of Object.entries(skills)) write(`workflows/${slug}/SKILL.md`, body)
  for (const [rel, body] of Object.entries(extra)) write(rel, body)
  return tmp
}

/** Tokens only — drops the allowlist-hygiene pseudo-violations. */
function tokens(res: { violations: Array<{ token: string }> }): string[] {
  return res.violations.filter((v) => !v.token.startsWith('(')).map((v) => v.token)
}

describe('checkHostPrimitives — the real tree', () => {
  it('the codex render of this repo carries no Claude-Code primitive tokens', () => {
    const res = checkHostPrimitives(REPO_ROOT)
    // Print the sites, not just a count — a bare `false` here is unactionable.
    expect(res.violations.map((v) => `${v.file}:${v.line} ${v.token} — ${v.detail}`)).toEqual([])
    expect(res.ok).toBe(true)
  })
})

describe('checkHostPrimitives — what counts as a violation', () => {
  it('a raw CC token in a SKILL body is a violation, located by line', () => {
    const root = fixture({
      demo: '---\nname: demo\n---\n\n# Demo\n\nAsk with AskUserQuestion first.\n',
    })
    const res = checkHostPrimitives(root)
    expect(res.ok).toBe(false)
    const hit = res.violations.find((v) => v.token === 'AskUserQuestion')
    expect(hit?.file).toBe('workflows/demo/SKILL.md')
    expect(hit?.line).toBe(7)
    expect(hit?.detail).toContain('Ask with AskUserQuestion first.')
  })

  it('a placeholder is NOT a false positive, even though its own text says "teammate"', () => {
    // Rule 3: `{{ host.teammate }}` contains the literal `teammate`. Scanning the
    // SOURCE would flag every rewritten site; scanning the RENDER sees "agent".
    const root = fixture({
      demo: '---\nname: demo\n---\n\n# Demo\n\nBrief each {{ host.teammate }} yourself.\n',
    })
    expect(tokens(checkHostPrimitives(root))).toEqual([])
  })

  it('a capability with no by_host.codex leaks its claude cmd — and is caught', () => {
    const root = fixture({
      demo: '---\nname: demo\n---\n\n# Demo\n\nUse {{ capabilities.legacy-no-codex.cmd }} here.\n',
    })
    expect(tokens(checkHostPrimitives(root))).toEqual(['SendMessage'])
  })

  it('a capability WITH by_host.codex renders the codex cmd and passes', () => {
    const root = fixture({
      demo: '---\nname: demo\n---\n\n# Demo\n\nUse {{ capabilities.agent-teams-create.cmd }} here.\n',
    })
    expect(tokens(checkHostPrimitives(root))).toEqual([])
  })

  it('an unresolvable placeholder fails the gate as a render error', () => {
    const root = fixture({
      demo: '---\nname: demo\n---\n\n# Demo\n\n{{ host.nope }}\n',
    })
    const res = checkHostPrimitives(root)
    expect(res.ok).toBe(false)
    expect(res.violations.some((v) => v.token === '(render)')).toBe(true)
  })
})

describe('checkHostPrimitives — exemptions', () => {
  it('the host-map span is exempt wholesale (rule 2)', () => {
    const root = fixture({
      demo: [
        '---',
        'name: demo',
        '---',
        '',
        '<!-- harnessed:host-map:start -->',
        '| send_message | SendMessage | send_input |',
        'Claude Code authored this prose; AskUserQuestion has no codex twin.',
        '<!-- harnessed:host-map:end -->',
        '',
        '# Demo',
        '',
      ].join('\n'),
    })
    expect(tokens(checkHostPrimitives(root))).toEqual([])
  })

  it('masks are PHRASES: `Claude Code plugin` is exempt, a bare `Claude Code` is not', () => {
    const root = fixture({
      demo: [
        '---',
        'name: demo',
        '---',
        '',
        '# Demo',
        '',
        'Install the planning-with-files Claude Code plugin first.',
        'Then let Claude Code drive the rest.',
      ].join('\n'),
    })
    const res = checkHostPrimitives(root)
    const hits = res.violations.filter((v) => v.token === 'Claude Code')
    expect(hits).toHaveLength(1)
    expect(hits[0]?.detail).toContain('Then let Claude Code drive the rest.')
  })

  it('a mask that matches nothing is itself a violation (allowlist anti-rot)', () => {
    // No anchor file this time, so every mask goes stale.
    write(
      'src/cli/lib/hostPrimitives.ts',
      [
        "export const HOST_MAP_START = '<!-- harnessed:host-map:start -->'",
        "export const HOST_MAP_END = '<!-- harnessed:host-map:end -->'",
        '',
      ].join('\n'),
    )
    write('workflows/host-primitives.yaml', PRIMITIVES)
    write('workflows/host-primitives.zh-Hans.yaml', PRIMITIVES)
    write('workflows/capabilities.yaml', CAPABILITIES)
    write('workflows/demo/SKILL.md', '---\nname: demo\n---\n\n# Demo\n')
    const res = checkHostPrimitives(tmp)
    expect(res.ok).toBe(false)
    expect(res.violations.filter((v) => v.token === '(stale-mask)')).toHaveLength(MASKS.length)
  })
})

describe('checkHostPrimitives — yaml surfaces are FIELD-selected', () => {
  const LANGUAGE = `schema_version: harnessed.discipline.v1
discipline: language
rules:
  - id: preserve-english-categories
    description: |-
      Keep AskUserQuestion in its original form.
    enforcement: warn
  - id: follow-user-language
    description: |-
      Not a rendered surface — buildDisciplinesSection skips this discipline,
      so naming Claude Code here reaches no artifact.
    enforcement: info
`

  it('a token in a rendered rule is a violation; the same token in a dead rule is not', () => {
    const root = fixture({}, { 'workflows/disciplines/language.yaml': LANGUAGE })
    const res = checkHostPrimitives(root)
    expect(tokens(res)).toEqual(['AskUserQuestion'])
    const hit = res.violations.find((v) => v.token === 'AskUserQuestion')
    expect(hit?.file).toBe('workflows/disciplines/language.yaml')
    expect(hit?.field).toBe('description')
  })

  it('a missing declared surface warns rather than failing', () => {
    const res = checkHostPrimitives(fixture({}))
    expect(res.warnings.some((w) => w.includes('role-prompts.yaml'))).toBe(true)
    expect(tokens(res)).toEqual([])
  })
})

describe('the scanning primitives', () => {
  it('scanCcTokens keeps the longest token at an offset (Agent Teams, not Agent Team)', () => {
    expect(scanCcTokens('escalate to Agent Teams now')).toEqual([{ token: 'Agent Teams', at: 12 }])
  })

  it('maskPhrase preserves length and newlines so later line numbers do not move', () => {
    const { text, count } = maskPhrase('a\nClaude Code plugin\nb', 'Claude Code plugin')
    expect(count).toBe(1)
    expect(text).toBe('a\n                  \nb')
    expect(text.split('\n')).toHaveLength(3)
  })

  it('every mask phrase actually contains a CC token (otherwise it exempts nothing)', () => {
    for (const mask of MASKS) {
      expect(
        CC_TOKENS.some((t) => mask.phrase.includes(t)),
        `mask ${JSON.stringify(mask.phrase)} masks no CC token`,
      ).toBe(true)
      expect(mask.why.length).toBeGreaterThan(20)
    }
  })

  it('hostMapMarkers throws when the emitter no longer declares the constant', () => {
    write('src/cli/lib/hostPrimitives.ts', 'export const SOMETHING_ELSE = 1\n')
    expect(() => hostMapMarkers(tmp)).toThrow(/HOST_MAP_START/)
  })

  it('hostMapMarkers reads the real emitter constants', () => {
    expect(hostMapMarkers(REPO_ROOT)).toEqual({
      start: '<!-- harnessed:host-map:start -->',
      end: '<!-- harnessed:host-map:end -->',
    })
  })
})
