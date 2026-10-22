import { readFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { resolveCapabilityCmd } from '../../src/cli/lib/capabilityResolver.js'
import {
  buildHostMapSection,
  loadHostMapNotes,
  loadHostPrimitives,
  renderHostPrimitives,
} from '../../src/cli/lib/hostPrimitives.js'
import { loadCapabilities } from '../../src/cli/lib/renderSkillTemplates.js'
import { renderRolePromptsForHost } from '../../src/cli/lib/rolePromptHostRender.js'
import { buildPromptText } from '../../src/cli/prompt.js'
import { buildCodexAgentRoles } from '../../src/installers/lib/codexAgentRoles.js'
import { loadRolePrompts } from '../../src/workflow/rolePrompts.js'

const ROOT = resolve(__dirname, '../..')
const WORKFLOWS = join(ROOT, 'workflows')
const GOLDENS = join(ROOT, 'tests/fixtures/render-golden')
const SUBS = ['task-code', 'plan-phase'] as const

describe('planning command and legacy plugin prose follow the Codex user-skill contract', () => {
  for (const locale of ['en', 'zh-Hans'] as const) {
    it(`${locale}: one planning primitive agrees with capability commands on both hosts`, async () => {
      const table = await loadHostPrimitives({ workflowsDir: WORKFLOWS, locale })
      expect(table.planning_command?.default).toEqual({
        claude: '/plan',
        codex: '$planning-with-files',
      })
      const caps = await loadCapabilities(WORKFLOWS)
      const cap = caps['planning-with-files']
      if (!cap) throw new Error('planning-with-files capability missing')
      for (const host of ['claude', 'codex'] as const) {
        const command = renderHostPrimitives('{{ host.planning_command }}', { host, table })
        const resolved = resolveCapabilityCmd(
          cap,
          new Set(['planning-with-files']),
          new Set(['planning-with-files']),
          host,
        )
        expect(command).toBe(resolved.renderedCmd)
      }
    })

    it(`${locale}: only the three planning role-prompt command sites use the primitive`, async () => {
      const filename = locale === 'en' ? 'role-prompts.yaml' : `role-prompts.${locale}.yaml`
      const source = await readFile(join(WORKFLOWS, filename), 'utf8')
      expect(source.match(/\{\{ host\.planning_command \}\}/g)).toHaveLength(3)
      expect(source).not.toContain('planning-with-files `/plan`')
    })

    for (const sub of SUBS) {
      it(`${locale}: real ${sub} Codex runtime prompt invokes the upstream planning skill`, async () => {
        const { prompt } = await buildPromptText(sub, ROOT, { host: 'codex', locale })
        expect(prompt).toContain('planning-with-files `$planning-with-files`')
        expect(prompt).not.toContain('planning-with-files `/plan`')
        expect(prompt).toContain('Invoke `$planning-with-files` (planning-with-files, user-skill)')
        expect(prompt).not.toContain('Invoke `/plan` (planning-with-files')
      })
    }

    it(`${locale}: generated Codex agent roles also invoke the upstream planning skill`, async () => {
      const table = await loadHostPrimitives({ workflowsDir: WORKFLOWS, locale })
      const prompts = await renderRolePromptsForHost(await loadRolePrompts(WORKFLOWS, locale), {
        workflowsDir: WORKFLOWS,
        host: 'codex',
        locale,
      })
      const roles = buildCodexAgentRoles(prompts, SUBS, {
        renderDescription: (body) => renderHostPrimitives(body, { host: 'codex', table }),
      })
      expect(roles).toHaveLength(2)
      for (const role of roles) {
        expect(role.toml).toContain('planning-with-files `$planning-with-files`')
        expect(role.toml).not.toContain('planning-with-files `/plan`')
        expect(role.toml).not.toContain('{{ host.planning_command }}')
      }
    })

    it(`${locale}: Codex host-map maps installed skills and limits unsupported plugins`, async () => {
      const table = await loadHostPrimitives({ workflowsDir: WORKFLOWS, locale })
      const notes = await loadHostMapNotes({ workflowsDir: WORKFLOWS, locale, host: 'codex' })
      const section = buildHostMapSection({ host: 'codex', table, notes })
      await expect(section).toMatchFileSnapshot(join(GOLDENS, `host-map-codex-${locale}.md`))
      const supported = notes.find(
        (note) => note.includes('planning-with-files') && note.includes('ui-ux-pro-max'),
      )
      expect(supported).toBeDefined()
      for (const expected of [
        '~/.agents/skills/planning-with-files/SKILL.md',
        '~/.agents/skills/ui-ux-pro-max/SKILL.md',
        '`$planning-with-files`',
        '`$ui-ux-pro-max`',
        'task_plan.md',
        'progress.md',
        'findings.md',
        'harnessed',
        '`/plan`',
      ])
        expect(supported).toContain(expected)
      expect(supported).toMatch(/never|绝不/)
      const unsupported = notes.find(
        (note) => note.includes('code-review') && note.includes('code-simplifier'),
      )
      expect(unsupported).toMatch(/unavailable|不可用/)
      expect(unsupported).not.toContain('planning-with-files')
      expect(unsupported).not.toContain('ui-ux-pro-max')
      expect(section).not.toContain('those components are NOT installed')
      expect(section).not.toContain('在本宿主上这些组件并未安装')
      expect(buildHostMapSection({ host: 'claude', table, notes })).toBe('')
    })
  }
})
