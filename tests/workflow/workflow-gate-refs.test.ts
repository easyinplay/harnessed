// v3.9.25 — TDD: every `gate:` field in workflows/**/workflow.yaml must be a
// valid 4-part judgments ref (judgments.<file>.<trigger>.fires). Literal expr
// fragments like `phase.is_complex_architecture == true` get rejected by
// judgmentResolver at runtime and only survive via ADR 0029 fail-soft to
// fires=true — which hides intent. Static validation catches malformed refs
// at test-time so they're flagged before ship.

import { readdir, readFile, stat } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parse as parseYaml } from 'yaml'

const WORKFLOWS_DIR = resolve(__dirname, '..', '..', 'workflows')
const JUDGMENTS_DIR = join(WORKFLOWS_DIR, 'judgments')
const GATE_REF_PATTERN = /^judgments\.[a-z][a-z0-9-]*\.[a-z][a-z0-9-]*\.fires$/

// T2.3 — the 3 bundled routing judgments were runtime orphans (12 triggers, zero
// `gate:` reference) since ADR-0032 L81 described the wiring but never landed:
// resolveJudgmentGate is purely ref-driven, so an unreferenced trigger file is
// never even loaded, let alone evaluated. Users without the author's private
// ~/.claude/CLAUDE.md therefore never received these routing rules.
const ROUTING_JUDGMENT_FILES = [
  'web-search-routing',
  'web-testing-routing',
  'web-design-routing',
] as const

async function findWorkflowYamls(dir: string, acc: string[] = []): Promise<string[]> {
  const entries = await readdir(dir)
  for (const e of entries) {
    if (e === 'disciplines' || e === 'judgments' || e === 'capabilities.yaml') continue
    const p = join(dir, e)
    const s = await stat(p).catch(() => null)
    if (s?.isDirectory()) {
      await findWorkflowYamls(p, acc)
    } else if (e === 'workflow.yaml') {
      acc.push(p)
    }
  }
  return acc
}

interface ParsedYaml {
  phases?: { id?: string; gate?: string; parallelism?: string; skip_gate?: string }[]
  delegates_to?: { sub?: string; gate?: string; skip_gate?: string }[]
}

/** Every `judgments.<file>.<trigger>.<field>` ref reachable from a gate-bearing
 *  field across all workflow yamls (`gate:` / `parallelism:` / forward-compatible
 *  `skip_gate:`), normalized to `<file>.<trigger>`. */
async function collectReferencedTriggers(): Promise<Set<string>> {
  const refs = new Set<string>()
  const add = (v: unknown) => {
    if (typeof v !== 'string') return
    const parts = v.split('.')
    if (parts.length === 4 && parts[0] === 'judgments') refs.add(`${parts[1]}.${parts[2]}`)
  }
  for (const path of await findWorkflowYamls(WORKFLOWS_DIR)) {
    const parsed = parseYaml(await readFile(path, 'utf8')) as ParsedYaml
    for (const ph of parsed.phases ?? []) {
      add(ph.gate)
      add(ph.parallelism)
      add(ph.skip_gate)
    }
    for (const d of parsed.delegates_to ?? []) {
      add(d.gate)
      add(d.skip_gate)
    }
  }
  return refs
}

describe('workflow yaml gate refs — must be judgments.<file>.<trigger>.fires', () => {
  it('all gates across all workflow.yaml files match valid 4-part judgments ref pattern', async () => {
    const yamls = await findWorkflowYamls(WORKFLOWS_DIR)
    expect(yamls.length).toBeGreaterThan(20) // sanity: at least the 24 workflows
    const offenders: { file: string; location: string; gate: string }[] = []
    for (const path of yamls) {
      const raw = await readFile(path, 'utf8')
      const parsed = parseYaml(raw) as ParsedYaml
      // phases[].gate
      for (const ph of parsed.phases ?? []) {
        if (typeof ph.gate === 'string' && !GATE_REF_PATTERN.test(ph.gate)) {
          offenders.push({
            file: path.replace(WORKFLOWS_DIR, 'workflows'),
            location: `phases[id=${ph.id}].gate`,
            gate: ph.gate,
          })
        }
      }
      // delegates_to[].gate (master orchestrators)
      for (const d of parsed.delegates_to ?? []) {
        if (typeof d.gate === 'string' && !GATE_REF_PATTERN.test(d.gate)) {
          offenders.push({
            file: path.replace(WORKFLOWS_DIR, 'workflows'),
            location: `delegates_to[sub=${d.sub}].gate`,
            gate: d.gate,
          })
        }
      }
    }
    if (offenders.length > 0) {
      const msg = offenders.map((o) => `  ${o.file} ${o.location}: '${o.gate}'`).join('\n')
      throw new Error(
        `${offenders.length} malformed gate ref(s) — must match judgments.<file>.<trigger>.fires:\n${msg}`,
      )
    }
  })
})

describe('T2.3 — bundled routing judgments are wired (no runtime orphans)', () => {
  it('every trigger in the 3 web-*-routing.yaml files is referenced by a workflow gate', async () => {
    const referenced = await collectReferencedTriggers()
    const orphans: string[] = []
    let total = 0
    for (const file of ROUTING_JUDGMENT_FILES) {
      const parsed = parseYaml(
        await readFile(join(JUDGMENTS_DIR, `${file}.yaml`), 'utf8'),
      ) as Record<string, unknown>
      const triggers = (parsed.triggers ?? {}) as Record<string, unknown>
      const names = Object.keys(triggers)
      expect(names.length, `${file}.yaml has no triggers`).toBeGreaterThan(0)
      for (const name of names) {
        total++
        if (!referenced.has(`${file}.${name}`)) orphans.push(`judgments.${file}.${name}`)
      }
    }
    // 12 triggers at T2.3 (5 web-search + 4 web-testing + 3 web-design).
    expect(total).toBe(12)
    expect(
      orphans,
      `routing triggers never referenced by any workflow gate: / parallelism: / skip_gate: —\n` +
        `${orphans.join('\n')}`,
    ).toEqual([])
  })
})
