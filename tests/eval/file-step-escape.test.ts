// External review L15 — a scenario `file` step resolved its path against the temp
// repo without a containment check, so `../x` wrote outside it; and the runner's
// cwd / env overrides were applied before its try/finally.

import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { runScenarioDir } from '../../src/eval/runner.js'

const made: string[] = []
afterEach(() => {
  for (const d of made.splice(0)) rmSync(d, { recursive: true, force: true })
})

function scenario(filePath: string): string {
  const dir = mkdtempSync(join(tmpdir(), 'eval-escape-'))
  made.push(dir)
  mkdirSync(dir, { recursive: true })
  writeFileSync(
    join(dir, 'scenario.yaml'),
    [
      'name: file-step-escape',
      'description: file step containment',
      'steps:',
      '  - file:',
      `      path: ${JSON.stringify(filePath)}`,
      '      content: "escaped"',
      '',
    ].join('\n'),
  )
  return dir
}

describe('eval runner — file steps stay inside the scenario repo (L15)', () => {
  it('`../<name>` is an ERROR and nothing is written next to the temp repo', async () => {
    const marker = `harnessed-l15-escape-${process.pid}-${Date.now()}.txt`
    const escaped = join(tmpdir(), marker)
    rmSync(escaped, { force: true })
    const prevCwd = process.cwd()
    const prevRoot = process.env.HARNESSED_ROOT_OVERRIDE

    const r = await runScenarioDir(scenario(`../${marker}`), {})

    expect(r.status).toBe('ERROR')
    expect((r.detail ?? []).join(' ')).toMatch(/escapes the scenario repo/)
    expect(existsSync(escaped)).toBe(false)
    // and the runner restored the process state
    expect(process.cwd()).toBe(prevCwd)
    expect(process.env.HARNESSED_ROOT_OVERRIDE).toBe(prevRoot)
    rmSync(escaped, { force: true })
  })

  it('an ordinary nested path is still written', async () => {
    const r = await runScenarioDir(scenario('.planning/STATE.md'), {})
    expect(r.status).not.toBe('ERROR')
  })
})
