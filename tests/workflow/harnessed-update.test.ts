import { readFileSync } from 'node:fs'
import { readdir } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { Value } from '@sinclair/typebox/value'
import { describe, expect, it } from 'vitest'
import { parse as parseYaml } from 'yaml'
import { loadRolePrompts } from '../../src/workflow/rolePrompts.js'
import { scanWorkflowsNested } from '../../src/workflow/scan-nested.js'
import { WorkflowSchemaV3 } from '../../src/workflow/schema/workflow.js'

const ROOT = resolve(__dirname, '../..')
const WORKFLOWS = join(ROOT, 'workflows')
const NAME = 'harnessed-update'

describe('Phase 78 T7 deterministic update workflow', () => {
  it('ships a flat v3 workflow with the deterministic CLI and no retry budget', () => {
    const workflow = parseYaml(readFileSync(join(WORKFLOWS, NAME, 'workflow.yaml'), 'utf8'))
    expect(Value.Check(WorkflowSchemaV3, workflow)).toBe(true)
    expect(workflow.workflow).toBe(NAME)
    expect(workflow.tools_available).toEqual([])
    expect(workflow.phases).toEqual([
      expect.objectContaining({
        upstream: 'harnessed',
        capability: 'harnessed update --all --json',
        max_iterations: 1,
      }),
    ])
  })

  it('discovers workflow 30 and keeps the binary CI assertion and text in sync', async () => {
    const { workflows } = await scanWorkflowsNested(WORKFLOWS, await readdir(WORKFLOWS))
    expect(workflows).toContainEqual({ name: NAME, relPath: NAME, isMaster: false })
    expect(workflows).toHaveLength(30)
    const ci = parseYaml(readFileSync(join(ROOT, '.github/workflows/ci.yml'), 'utf8'))
    const smoke = ci.jobs['binary-smoke'].steps.find((step: { name?: string }) =>
      step.name?.includes('workflows from a foreign cwd'),
    )
    expect(smoke.name).toContain('30 workflows')
    expect(smoke.run).toContain('[ "$count" -eq 30 ]')
    expect(smoke.run).toContain('expected 30 workflows')
    expect(smoke.run).toContain('(30 workflows, idempotent unpack)')
  })

  it.each([
    'en',
    'zh-Hans',
  ] as const)('%s defines preview, confirmation, results and stop boundaries', async (locale) => {
    const prompt = (await loadRolePrompts(WORKFLOWS, locale))[NAME]
    expect(prompt).toBeDefined()
    const filename = locale === 'en' ? 'SKILL.md' : 'SKILL.zh-Hans.md'
    const skill = readFileSync(join(WORKFLOWS, NAME, filename), 'utf8')
    const role = [prompt?.responsibility, ...(prompt?.checklist ?? [])].join('\n')
    for (const body of [skill, role]) {
      const preview = body.indexOf('harnessed update --all --dry-run --json')
      const confirmation = body.indexOf('{{ host.ask_user }}')
      const apply = body.indexOf('harnessed update --all --json')
      expect(preview).toBeGreaterThanOrEqual(0)
      expect(confirmation).toBeGreaterThan(preview)
      expect(apply).toBeGreaterThan(confirmation)
      for (const token of [
        'schemaVersion',
        'components',
        'warnings',
        'error',
        'reasonCode',
        'restartRequired',
        'before',
        'target',
        'after',
        'verified',
        'unsupported',
        'retained',
        'partial',
        'not-installed',
        'handoff-failed',
        'invalid-continuation',
        'STOP',
        'Phase 79',
      ])
        expect(body).toContain(token)
      expect(body).toMatch(
        locale === 'en'
          ? /second proposal|second confirmation/
          : /第二份 repair proposal|第二次确认/,
      )
      expect(body).toContain('--repair --yes --json')
    }
    expect(prompt?.primary_cap).toBe('')
    expect(prompt?.severity).toContain('partial')
    expect(skill).toContain(`harnessed prompt ${NAME}`)
    expect(skill).toContain(`harnessed checkpoint complete ${NAME}`)
    expect(skill).toContain('<!-- harnessed-generated:v4.12.0 -->')
  })
})
