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
const GATE_REF_PATTERN = /^judgments\.[a-z][a-z0-9-]*\.[a-z][a-z0-9-]*\.fires$/

async function findWorkflowYamls(dir: string, acc: string[] = []): Promise<string[]> {
  const entries = await readdir(dir)
  for (const e of entries) {
    if (e === 'disciplines' || e === 'judgments' || e === 'capabilities.yaml')
      continue
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
  phases?: { id?: string; gate?: string }[]
  delegates_to?: { sub?: string; gate?: string }[]
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
      const msg = offenders
        .map((o) => `  ${o.file} ${o.location}: '${o.gate}'`)
        .join('\n')
      throw new Error(
        `${offenders.length} malformed gate ref(s) — must match judgments.<file>.<trigger>.fires:\n${msg}`,
      )
    }
  })
})
