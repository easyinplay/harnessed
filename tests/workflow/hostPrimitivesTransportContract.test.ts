// Phase 86 — the orchestrator wording must carry the result-file contract.
//
// Upstream open-gsd/gsd-core#1355: claude-code's agent-teams re-parents a newly
// spawned named subagent under a still-living teammate, so its completion
// notification never reaches the orchestrator → the run hangs. GSD 1.18.0's fix
// is "background spawn + explicit reaping from the artifact file + bounded
// wait"; the notification is demoted to a fast-path wake-up.
//
// So the two cells that describe the parallel transport have to say it: the
// completion signal is the RESULT FILE, and the notification is only an early
// wake-up. This test pins that wording in BOTH locales and keeps the codex
// column free of Claude-Code-only nouns (the codex host has no agent-teams).

import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parse as parseYaml } from 'yaml'

const ROOT = resolve(process.cwd())

interface PrimitiveCell {
  claude: string
  codex: string
}
interface Primitive {
  [variant: string]: PrimitiveCell | string
}

function table(file: string): Record<string, Primitive> {
  const doc = parseYaml(readFileSync(join(ROOT, 'workflows', file), 'utf8')) as {
    primitives?: Record<string, Primitive>
  }
  return doc.primitives ?? {}
}

const en = table('host-primitives.yaml')
const zh = table('host-primitives.zh-Hans.yaml')

function cell(table: Record<string, Primitive>, primitive: string, variant: string): PrimitiveCell {
  const value = table[primitive]?.[variant]
  if (!value || typeof value === 'string') throw new Error(`missing cell: ${primitive}.${variant}`)
  return value as PrimitiveCell
}

/** Claude-Code-only nouns — they must not survive into the codex column. */
const CC_ONLY = ['teammate', 'SendMessage', 'Agent(', 'Agent Team', 'run_in_background']

describe('Phase 86 — teams_step_note carries the result-file completion contract', () => {
  it('en claude cell names the result file as the completion signal', () => {
    const c = cell(en, 'teams_step_note', 'default').claude
    expect(c).toMatch(/RESULT FILE/)
    expect(c).toMatch(/`harnessed prompt <sub>`/)
    expect(c).toMatch(/--result-file <path>/)
    expect(c).toMatch(/--wait <seconds>/)
    // The notification is a fast-path wake-up, never the completion proof.
    expect(c).toMatch(/notification only wakes you up early/)
    expect(c).toMatch(/never the completion proof/)
  })

  it('en codex cell states the same contract in codex terms', () => {
    const c = cell(en, 'teams_step_note', 'default').codex
    expect(c).toMatch(/RESULT FILE/)
    expect(c).toMatch(/--result-file <path>/)
    expect(c).toMatch(/`wait_agent`/)
    for (const token of CC_ONLY) expect(c).not.toContain(token)
  })

  it('zh claude cell mirrors the en contract', () => {
    const c = cell(zh, 'teams_step_note', 'default').claude
    expect(c).toMatch(/结果文件/)
    expect(c).toMatch(/--result-file <path>/)
    expect(c).toMatch(/有界等待/)
    expect(c).toMatch(/永远不是完成凭据/)
  })

  it('zh codex cell mirrors the en contract', () => {
    const c = cell(zh, 'teams_step_note', 'default').codex
    expect(c).toMatch(/结果文件/)
    expect(c).toMatch(/--result-file <path>/)
    for (const token of CC_ONLY) expect(c).not.toContain(token)
  })

  it('the command variant states the same contract (the generated command surface)', () => {
    expect(cell(en, 'teams_step_note', 'command').claude).toMatch(/RESULT FILE/)
    expect(cell(en, 'teams_step_note', 'command').codex).toMatch(/RESULT FILE/)
    expect(cell(zh, 'teams_step_note', 'command').claude).toMatch(/RESULT FILE/)
    expect(cell(zh, 'teams_step_note', 'command').codex).toMatch(/RESULT FILE/)
  })
})

describe('Phase 86 — delivery_contract_note points at the result file', () => {
  it('en keeps the "final message is discarded" fact and adds the result file', () => {
    const c = cell(en, 'delivery_contract_note', 'default').claude
    expect(c).toMatch(/DISCARDED by the platform/)
    expect(c).toMatch(/completion credential is the result file/)
    expect(c).toMatch(/--result-file|result file/)
  })

  it('en checklist states the result file as the credential', () => {
    const c = cell(en, 'delivery_contract_note', 'checklist').claude
    expect(c).toMatch(/completion credential is that result file/)
  })

  it('codex cells keep the result-file credential without Claude-only nouns', () => {
    const def = cell(en, 'delivery_contract_note', 'default').codex
    expect(def).toMatch(/completion credential is the result file/)
    for (const token of CC_ONLY) expect(def).not.toContain(token)
    const checklist = cell(en, 'delivery_contract_note', 'checklist').codex
    expect(checklist).toMatch(/completion credential is that result file/)
    for (const token of CC_ONLY) expect(checklist).not.toContain(token)
  })

  it('zh cells mirror the en contract', () => {
    expect(cell(zh, 'delivery_contract_note', 'default').claude).toMatch(/完成凭据是结果文件/)
    expect(cell(zh, 'delivery_contract_note', 'default').codex).toMatch(/完成凭据是结果文件/)
    expect(cell(zh, 'delivery_contract_note', 'checklist').claude).toMatch(/完成凭据是那个结果文件/)
    expect(cell(zh, 'delivery_contract_note', 'checklist').codex).toMatch(/完成凭据是那个结果文件/)
  })
})

describe('Phase 86 — the two locales keep the same primitive/variant/host shape', () => {
  it('teams_step_note + delivery_contract_note variants and hosts match', () => {
    for (const primitive of ['teams_step_note', 'delivery_contract_note']) {
      const enVariants = Object.keys(en[primitive] ?? {}).sort()
      const zhVariants = Object.keys(zh[primitive] ?? {}).sort()
      expect(zhVariants).toEqual(enVariants)
      for (const variant of enVariants) {
        const enCell = cell(en, primitive, variant)
        const zhCell = cell(zh, primitive, variant)
        expect(Object.keys(zhCell).sort()).toEqual(Object.keys(enCell).sort())
      }
    }
  })

  it('no deleted-tool literal anywhere in the two cells', () => {
    for (const primitive of ['teams_step_note', 'delivery_contract_note']) {
      for (const variant of Object.keys(en[primitive] ?? {})) {
        for (const host of ['claude', 'codex'] as const) {
          const text = cell(en, primitive, variant)[host]
          expect(text).not.toContain('TeamCreate')
          expect(text).not.toContain('TeamDelete')
        }
      }
    }
  })
})
