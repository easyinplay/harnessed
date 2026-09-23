// v16.0 Phase 65 T2 — host-primitive render layer (TDD, pure functions).
//
// `{{ host.<primitive> }}` / `{{ host.<primitive>.<variant> }}` is the second
// placeholder family in SKILL.md bodies, sibling to the earlier
// `{{ capabilities.<x>.cmd }}` (src/cli/lib/capabilityResolver.ts).
//
// Contract locked here (deliberately STRICTER than the capability renderer,
// which leaves unknown refs verbatim + warns):
//   - unknown primitive                → THROW (key + position in message)
//   - known primitive, unknown variant → THROW (no silent fallback to default)
//   - missing host value on a matched entry → THROW
// Rationale: a silently-preserved `{{ host.* }}` would ship a Claude-only
// primitive into a codex artifact where no gate can see it. Build-time noise
// beats runtime drift.
//
// Locale policy is NOT re-implemented here — it reuses resolveLocaleYaml
// (src/i18n/localeYaml.ts): en → base, non-en → sibling if present else base.

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  collectHostPlaceholders,
  type HostPrimitiveTable,
  loadHostPrimitives,
  renderHostPrimitives,
} from '../../src/cli/lib/hostPrimitives.js'
import { __resetForTests } from '../../src/i18n/index.js'

const TABLE: HostPrimitiveTable = {
  spawn_subagent: {
    default: { claude: 'Task / Agent tool', codex: 'spawn_agent tool' },
    zh_tool: { claude: 'Task / Agent 工具', codex: 'spawn_agent 工具' },
  },
  send_message: {
    default: { claude: 'SendMessage', codex: 'send_input' },
  },
  block: {
    default: {
      claude: 'line one\nline two\nline three',
      codex: 'uno\ndos\ntres',
    },
  },
}

describe('renderHostPrimitives — hits', () => {
  it('default variant, host=claude', () => {
    expect(
      renderHostPrimitives('use the {{ host.spawn_subagent }} here', {
        host: 'claude',
        table: TABLE,
      }),
    ).toBe('use the Task / Agent tool here')
  })

  it('default variant, host=codex', () => {
    expect(
      renderHostPrimitives('use the {{ host.spawn_subagent }} here', {
        host: 'codex',
        table: TABLE,
      }),
    ).toBe('use the spawn_agent tool here')
  })

  it('explicit variant, both hosts', () => {
    const body = '调用 {{ host.spawn_subagent.zh_tool }}'
    expect(renderHostPrimitives(body, { host: 'claude', table: TABLE })).toBe(
      '调用 Task / Agent 工具',
    )
    expect(renderHostPrimitives(body, { host: 'codex', table: TABLE })).toBe(
      '调用 spawn_agent 工具',
    )
  })

  it('`{{ host.x }}` is exactly `{{ host.x.default }}`', () => {
    const bare = renderHostPrimitives('{{ host.send_message }}', { host: 'codex', table: TABLE })
    const explicit = renderHostPrimitives('{{ host.send_message.default }}', {
      host: 'codex',
      table: TABLE,
    })
    expect(bare).toBe('send_input')
    expect(explicit).toBe(bare)
  })

  it('tolerates whitespace variation inside the braces', () => {
    expect(renderHostPrimitives('{{host.send_message}}', { host: 'claude', table: TABLE })).toBe(
      'SendMessage',
    )
    expect(
      renderHostPrimitives('{{   host.send_message.default   }}', {
        host: 'claude',
        table: TABLE,
      }),
    ).toBe('SendMessage')
  })

  it('replaces EVERY occurrence, not just the first', () => {
    const body = 'a {{ host.send_message }} b {{ host.send_message }} c {{ host.spawn_subagent }}'
    expect(renderHostPrimitives(body, { host: 'claude', table: TABLE })).toBe(
      'a SendMessage b SendMessage c Task / Agent tool',
    )
  })

  it('inserts a multi-line value verbatim (no reindent, no escaping)', () => {
    expect(renderHostPrimitives('> {{ host.block }}\ntail', { host: 'claude', table: TABLE })).toBe(
      '> line one\nline two\nline three\ntail',
    )
  })

  it('does not treat `$&` / `$1` in table values as replacement patterns', () => {
    const table: HostPrimitiveTable = { d: { default: { claude: 'a$&b$1c', codex: 'x' } } }
    expect(renderHostPrimitives('[{{ host.d }}]', { host: 'claude', table })).toBe('[a$&b$1c]')
  })

  it('body with no placeholders is returned unchanged', () => {
    expect(
      renderHostPrimitives('plain text {{ capabilities.x.cmd }}', { host: 'claude', table: TABLE }),
    ).toBe('plain text {{ capabilities.x.cmd }}')
  })
})

describe('renderHostPrimitives — strict failures', () => {
  it('unknown primitive throws, message carries the key', () => {
    let msg = ''
    try {
      renderHostPrimitives('x\ny {{ host.nope }}', { host: 'claude', table: TABLE })
    } catch (e) {
      msg = (e as Error).message
    }
    expect(msg).toContain('nope')
    expect(msg).toContain('host.nope')
    // position is reported so the SPEC author can find it
    expect(msg).toMatch(/line 2/)
  })

  it('known primitive + unknown variant throws (NO silent fallback to default)', () => {
    let msg = ''
    try {
      renderHostPrimitives('{{ host.send_message.zh_tool }}', { host: 'claude', table: TABLE })
    } catch (e) {
      msg = (e as Error).message
    }
    expect(msg).toContain('zh_tool')
    expect(msg).toContain('send_message')
    // guard against the tempting-but-wrong silent-fallback behavior
    expect(msg).not.toBe('SendMessage')
  })

  it('matched entry missing the active host value throws', () => {
    const table = { half: { default: { claude: 'only-claude' } } } as HostPrimitiveTable
    expect(() => renderHostPrimitives('{{ host.half }}', { host: 'codex', table })).toThrow(/codex/)
    expect(renderHostPrimitives('{{ host.half }}', { host: 'claude', table })).toBe('only-claude')
  })

  it('empty table + any placeholder throws (never silently passes through)', () => {
    expect(() =>
      renderHostPrimitives('{{ host.send_message }}', { host: 'claude', table: {} }),
    ).toThrow()
  })
})

describe('collectHostPlaceholders', () => {
  it('returns a deduped set of normalized `<primitive>.<variant>` keys', () => {
    const body = [
      '{{ host.send_message }}',
      '{{ host.send_message }}',
      '{{ host.send_message.default }}',
      '{{ host.spawn_subagent.zh_tool }}',
      '{{host.block}}',
    ].join('\n')
    const keys = collectHostPlaceholders(body)
    expect([...keys].sort()).toEqual([
      'block.default',
      'send_message.default',
      'spawn_subagent.zh_tool',
    ])
  })

  it('returns an empty set for a body with no host placeholders', () => {
    expect(collectHostPlaceholders('nothing {{ capabilities.a.cmd }} here').size).toBe(0)
  })

  it('does not require the key to exist in any table (pure scan, never throws)', () => {
    expect([...collectHostPlaceholders('{{ host.totally_unknown }}')]).toEqual([
      'totally_unknown.default',
    ])
  })
})

describe('loadHostPrimitives — locale selection (resolveLocaleYaml policy)', () => {
  let dir: string

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'harnessed-hostprim-'))
    mkdirSync(dir, { recursive: true })
    __resetForTests()
  })

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
    delete process.env.HARNESSED_LANG
    __resetForTests()
  })

  const BASE = [
    'version: 1',
    'primitives:',
    '  send_message:',
    '    default:',
    '      claude: "BASE-claude"',
    '      codex: "BASE-codex"',
    '',
  ].join('\n')

  const ZH = BASE.replaceAll('BASE', 'ZH')

  it('en reads the base file even when a zh-Hans sibling exists', async () => {
    writeFileSync(join(dir, 'host-primitives.yaml'), BASE, 'utf8')
    writeFileSync(join(dir, 'host-primitives.zh-Hans.yaml'), ZH, 'utf8')
    const table = await loadHostPrimitives({ workflowsDir: dir, locale: 'en' })
    expect(table.send_message?.default?.claude).toBe('BASE-claude')
  })

  it('zh-Hans reads the sibling when present', async () => {
    writeFileSync(join(dir, 'host-primitives.yaml'), BASE, 'utf8')
    writeFileSync(join(dir, 'host-primitives.zh-Hans.yaml'), ZH, 'utf8')
    const table = await loadHostPrimitives({ workflowsDir: dir, locale: 'zh-Hans' })
    expect(table.send_message?.default?.codex).toBe('ZH-codex')
  })

  it('zh-Hans with NO sibling falls back to the base (drift-only, not an error)', async () => {
    writeFileSync(join(dir, 'host-primitives.yaml'), BASE, 'utf8')
    const table = await loadHostPrimitives({ workflowsDir: dir, locale: 'zh-Hans' })
    expect(table.send_message?.default?.claude).toBe('BASE-claude')
  })

  it('omitted locale follows getLocale() (HARNESSED_LANG)', async () => {
    writeFileSync(join(dir, 'host-primitives.yaml'), BASE, 'utf8')
    writeFileSync(join(dir, 'host-primitives.zh-Hans.yaml'), ZH, 'utf8')
    process.env.HARNESSED_LANG = 'zh-Hans'
    __resetForTests()
    expect((await loadHostPrimitives({ workflowsDir: dir })).send_message?.default?.claude).toBe(
      'ZH-claude',
    )
    process.env.HARNESSED_LANG = 'en'
    __resetForTests()
    expect((await loadHostPrimitives({ workflowsDir: dir })).send_message?.default?.claude).toBe(
      'BASE-claude',
    )
  })

  it('missing base file yields an empty table (tolerant load, strict render)', async () => {
    const table = await loadHostPrimitives({ workflowsDir: dir, locale: 'en' })
    expect(table).toEqual({})
    // the strictness lives in the renderer, not the loader
    expect(() =>
      renderHostPrimitives('{{ host.send_message }}', { host: 'claude', table }),
    ).toThrow()
  })

  it('a file with no `primitives:` key yields an empty table', async () => {
    writeFileSync(join(dir, 'host-primitives.yaml'), 'version: 1\n', 'utf8')
    expect(await loadHostPrimitives({ workflowsDir: dir, locale: 'en' })).toEqual({})
  })
})

describe('shipped workflows/host-primitives*.yaml', () => {
  const WORKFLOWS_DIR = join(process.cwd(), 'workflows')

  it('base file carries the Phase 65 skeleton entries verbatim', async () => {
    const t = await loadHostPrimitives({ workflowsDir: WORKFLOWS_DIR, locale: 'en' })
    expect(t.spawn_subagent?.default).toEqual({
      claude: 'Task / Agent tool',
      codex: 'spawn_agent tool',
    })
    expect(t.spawn_subagent?.zh_tool).toEqual({
      claude: 'Task / Agent 工具',
      codex: 'spawn_agent 工具',
    })
    expect(t.send_message?.default).toEqual({ claude: 'SendMessage', codex: 'send_input' })
  })

  it('en and zh-Hans files are in full structural parity (primitive/variant/host keys)', async () => {
    const en = await loadHostPrimitives({ workflowsDir: WORKFLOWS_DIR, locale: 'en' })
    const zh = await loadHostPrimitives({ workflowsDir: WORKFLOWS_DIR, locale: 'zh-Hans' })
    const shape = (t: HostPrimitiveTable) =>
      Object.entries(t)
        .flatMap(([p, variants]) =>
          Object.entries(variants).flatMap(([v, hosts]) =>
            Object.keys(hosts).map((h) => `${p}.${v}.${h}`),
          ),
        )
        .sort()
    expect(shape(zh)).toEqual(shape(en))
    expect(shape(en).length).toBeGreaterThan(0)
  })

  it('every shipped value is populated for BOTH hosts', async () => {
    for (const locale of ['en', 'zh-Hans'] as const) {
      const t = await loadHostPrimitives({ workflowsDir: WORKFLOWS_DIR, locale })
      for (const [p, variants] of Object.entries(t)) {
        for (const [v, hosts] of Object.entries(variants)) {
          expect(hosts.claude, `${locale} ${p}.${v}.claude`).toBeTruthy()
          expect(hosts.codex, `${locale} ${p}.${v}.codex`).toBeTruthy()
        }
      }
    }
  })

  it('every primitive declares a `default` variant (the bare-placeholder contract)', async () => {
    const t = await loadHostPrimitives({ workflowsDir: WORKFLOWS_DIR, locale: 'en' })
    for (const [p, variants] of Object.entries(t)) {
      expect(Object.keys(variants), `${p} must declare default`).toContain('default')
    }
  })
})
