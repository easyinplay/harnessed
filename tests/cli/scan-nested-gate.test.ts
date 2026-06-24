// Phase 29 T29.4 — scan-nested install-gate invariant (ASSERT-ONLY, no prod change).
//
// The install gate is `stat(join(dir, 'SKILL.md'))`: zh-Hans is bonus cargo, NEVER
// the gate. A dir carrying only SKILL.zh-Hans.md and NO SKILL.md must still be
// skipped (no zh-only skills install). This test pins that semantics so a future
// edit that accidentally treats .zh-Hans.md as an install trigger fails loudly.

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { scanWorkflowsNested } from '../../src/cli/lib/scan-nested.js'

let tmpRoot: string

beforeEach(() => {
  tmpRoot = mkdtempSync(join(tmpdir(), 'scan-gate-'))
})

afterEach(() => {
  rmSync(tmpRoot, { recursive: true, force: true })
})

function mkdir(...parts: string[]): string {
  const p = join(tmpRoot, ...parts)
  mkdirSync(p, { recursive: true })
  return p
}

describe('scan-nested install gate — SKILL.md presence, not .zh-Hans.md', () => {
  it('flat dir with ONLY SKILL.zh-Hans.md (no SKILL.md) → omitted', async () => {
    const dir = mkdir('zh-only')
    writeFileSync(join(dir, 'SKILL.zh-Hans.md'), 'zh body', 'utf8')
    const { workflows } = await scanWorkflowsNested(tmpRoot, ['zh-only'])
    expect(workflows.find((w) => w.name === 'zh-only')).toBeUndefined()
  })

  it('flat dir WITH SKILL.md (+ optional zh sibling) → installed', async () => {
    const dir = mkdir('demo')
    writeFileSync(join(dir, 'SKILL.md'), 'en body', 'utf8')
    writeFileSync(join(dir, 'SKILL.zh-Hans.md'), 'zh body', 'utf8')
    const { workflows } = await scanWorkflowsNested(tmpRoot, ['demo'])
    expect(workflows.find((w) => w.name === 'demo')).toBeDefined()
  })

  it('nested <stage>/<sub> with ONLY .zh-Hans.md → sub omitted', async () => {
    const sub = mkdir('stage', 'sub')
    writeFileSync(join(sub, 'SKILL.zh-Hans.md'), 'zh body', 'utf8')
    const { workflows } = await scanWorkflowsNested(tmpRoot, ['stage'])
    expect(workflows.find((w) => w.name === 'stage-sub')).toBeUndefined()
  })

  it('nested <stage>/<sub> WITH SKILL.md → sub installed (gate unchanged)', async () => {
    const sub = mkdir('stage', 'sub')
    writeFileSync(join(sub, 'SKILL.md'), 'en body', 'utf8')
    writeFileSync(join(sub, 'SKILL.zh-Hans.md'), 'zh body', 'utf8')
    const { workflows } = await scanWorkflowsNested(tmpRoot, ['stage'])
    expect(workflows.find((w) => w.name === 'stage-sub')).toBeDefined()
  })
})
