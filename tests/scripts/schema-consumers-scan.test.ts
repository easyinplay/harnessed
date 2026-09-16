// scripts/lib/schema-consumers-scan.mjs — the text transforms the
// "declared but never evaluated" gate searches through. Each cell pins a way the
// gate was once wrong without anyone noticing.

import { describe, expect, it } from 'vitest'
import {
  stripComments,
  stripTypeboxDeclarations,
  stripYamlKeys,
} from '../../scripts/lib/schema-consumers-scan.mjs'

describe('stripComments (JS / TS)', () => {
  it('a block-comment opener INSIDE A STRING is not a comment', () => {
    // The glob in scripts/check-workflow-schema.mjs made the old regex swallow 13k
    // of its 23k characters, up to the next closer.
    const src = [
      "const glob = 'workflows/judgments/*.yaml'",
      'const kept = rule.auto_fix_cmd',
      '/* a real comment */',
    ].join('\n')
    const out = stripComments(src)
    expect(out).toContain('rule.auto_fix_cmd')
    expect(out).not.toContain('a real comment')
  })

  it('removes line and block comments, keeps `//` inside strings and after a colon', () => {
    const src = [
      'const a = x.live_field // x.comment_field',
      "const url = 'https://example.com//path'",
      "const s = 'a // not a comment'",
      '/** x.doc_field */',
    ].join('\n')
    const out = stripComments(src)
    expect(out).toContain('live_field')
    expect(out).not.toContain('comment_field')
    expect(out).toContain('https://example.com//path')
    expect(out).toContain('a // not a comment')
    expect(out).not.toContain('doc_field')
  })

  it('preserves line count (a stripped block leaves its newlines)', () => {
    const src = 'a\n/*\nb\nc\n*/\nd'
    expect(stripComments(src).split('\n')).toHaveLength(src.split('\n').length)
  })
})

describe('stripComments (yaml)', () => {
  it('yaml is NOT run through the JS scanner — an unquoted glob in prose deletes nothing', () => {
    // Running the JS scanner over capabilities.yaml hid five facts that its prose
    // plainly referenced.
    const src = [
      'description: reads workflows/*.yaml at startup',
      '  - phase.requires_peer_review == true',
      '# a comment naming ghost_field',
    ].join('\n')
    const out = stripComments(src, true)
    expect(out).toContain('requires_peer_review')
    expect(out).not.toContain('ghost_field')
  })
})

describe('stripYamlKeys', () => {
  it('a mapping key is where a field is WRITTEN, so it is removed; values stay', () => {
    const src = [
      'rules:',
      '  - id: biome-preempt',
      "    auto_fix_cmd: 'corepack pnpm exec biome check --write'",
      'triggers:',
      '  second-opinion:',
      '    fires: requires_second_opinion == true',
    ].join('\n')
    const out = stripYamlKeys(src)
    expect(out).not.toMatch(/\bauto_fix_cmd\b/)
    expect(out).toContain('requires_second_opinion == true')
    expect(out).toContain('biome-preempt')
  })

  it('quoted keys and list-item keys are keys too', () => {
    const out = stripYamlKeys(`"quoted_field": 1\n- listed_field: 2\n`)
    expect(out).not.toContain('quoted_field')
    expect(out).not.toContain('listed_field')
  })

  it('a colon inside a value is not a key', () => {
    const out = stripYamlKeys('note: see https://x.example/a:b and phase.real_fact\n')
    expect(out).toContain('phase.real_fact')
  })
})

describe('stripTypeboxDeclarations', () => {
  it('a mirrored `name: Type.X(...)` line is a declaration, not a read', () => {
    // scripts/check-workflow-schema.mjs mirrors the workflow schema line for line.
    const src = [
      '    settings_env_var: Type.Optional(Type.String()),',
      '    const v = entry.settings_env_var',
    ].join('\n')
    const out = stripTypeboxDeclarations(src)
    expect(out.split('\n')[0]).not.toContain('settings_env_var')
    expect(out).toContain('entry.settings_env_var')
  })
})
