// T2.1 D-5 — `skip_gate` veto resolution unit tests.
//
// Semantics under test (spec D-5, deliberately asymmetric with ADR-0038):
//   - `skips_when` true  → veto (a fired sub is suppressed, reason recorded)
//   - `skips_when` false → no veto
//   - ANY eval/config fault (undefined variable, missing trigger, missing file,
//     trigger without a `skips_when`) → NO veto.
//
// The fail direction is intentional. ADR-0038's fail-CLOSED ("undefined variable
// → treat gate as NOT fired") and this fail-OPEN ("undefined variable → do not
// veto") are the SAME invariant seen from two sides: when the config is broken,
// harnessed does not do MORE work than the operator asked for, and it never
// silently REMOVES a governance step either. A veto that fired on a typo would
// silently delete a gate the user believes is active — the worst outcome of all.

import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { beforeEach, describe, expect, it } from 'vitest'
import { _clearJudgmentCache } from '../../src/workflow/judgmentResolver.js'
import { resolveSkipVeto } from '../../src/workflow/skipGate.js'

let root: string
let seq = 0

function writeJudgment(fileBase: string, body: string): void {
  const dir = join(root, 'workflows', 'judgments')
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, `${fileBase}.yaml`), body, 'utf8')
}

/** Unique judgment basename per case — judgmentResolver caches parsed files by
 *  basename in a module-level Map, so reusing one name across cases would serve
 *  a stale fixture. */
function nextName(): string {
  seq += 1
  return `t21-skipgate-${seq}`
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'harnessed-skipgate-'))
  _clearJudgmentCache()
})

describe('resolveSkipVeto', () => {
  it('returns a reason when skips_when evaluates true (veto)', async () => {
    const name = nextName()
    writeJudgment(
      name,
      `schema_version: harnessed.judgment.v1
triggers:
  demo:
    skips_when: "subtask.type in ['crud'] or subtask.lines < 20"
`,
    )
    const veto = await resolveSkipVeto(
      `judgments.${name}.demo.skips`,
      { subtask: { type: 'crud', lines: 500 } },
      root,
    )
    expect(veto).not.toBeNull()
    expect(veto as string).toContain(`judgments.${name}.demo.skips`)
  })

  it('returns null when skips_when evaluates false (no veto)', async () => {
    const name = nextName()
    writeJudgment(
      name,
      `schema_version: harnessed.judgment.v1
triggers:
  demo:
    skips_when: "subtask.type in ['crud'] or subtask.lines < 20"
`,
    )
    const veto = await resolveSkipVeto(
      `judgments.${name}.demo.skips`,
      { subtask: { type: 'core_logic', lines: 500 } },
      root,
    )
    expect(veto).toBeNull()
  })

  it('undefined BARE variable → NO veto (conservative, keeps the gate decision)', async () => {
    const name = nextName()
    writeJudgment(
      name,
      `schema_version: harnessed.judgment.v1
triggers:
  demo:
    skips_when: "never_declared_flag == true"
`,
    )
    const veto = await resolveSkipVeto(`judgments.${name}.demo.skips`, { subtask: {} }, root)
    expect(veto).toBeNull()
  })

  it('trigger without a skips_when expression → NO veto', async () => {
    const name = nextName()
    writeJudgment(
      name,
      `schema_version: harnessed.judgment.v1
triggers:
  demo:
    fires_when: "subtask.lines > 1"
`,
    )
    const veto = await resolveSkipVeto(`judgments.${name}.demo.skips`, { subtask: {} }, root)
    expect(veto).toBeNull()
  })

  it('missing judgment file / unknown trigger → NO veto', async () => {
    const veto = await resolveSkipVeto(
      'judgments.t21-does-not-exist.demo.skips',
      { subtask: {} },
      root,
    )
    expect(veto).toBeNull()
  })

  it('absent ref → NO veto (no yaml read at all)', async () => {
    expect(await resolveSkipVeto(undefined, {}, root)).toBeNull()
    expect(await resolveSkipVeto('', {}, root)).toBeNull()
  })
})
