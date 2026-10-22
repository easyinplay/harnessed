import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  readInstalledPlugins,
  readInstalledUserSkills,
  resolveCapabilityCmd,
} from '../../src/cli/lib/capabilityResolver.js'
import { loadCapabilities, renderAllSkills } from '../../src/cli/lib/renderSkillTemplates.js'
import { buildPromptText } from '../../src/cli/prompt.js'

const ROOT = resolve(__dirname, '../..')
const WORKFLOWS = join(ROOT, 'workflows')
let home: string

beforeEach(async () => {
  home = await mkdtemp(join(tmpdir(), 'capability-codex-presence-'))
  vi.stubEnv('HARNESSED_PLATFORM', 'codex')
})

afterEach(async () => {
  vi.unstubAllEnvs()
  await rm(home, { recursive: true, force: true })
})

describe('resolveCapabilityCmd host-specific presence metadata', () => {
  const capability = {
    cmd: '/plan',
    install_type: 'plugin' as const,
    plugin_id: 'planning-with-files',
    by_host: {
      codex: {
        cmd: '$planning-with-files',
        install_type: 'user-skill' as const,
        skill_dir: 'planning-with-files',
      },
    },
  }

  it('checks the Codex user-skill instead of the top-level Claude plugin', () => {
    expect(
      resolveCapabilityCmd(capability, new Set(), new Set(['planning-with-files']), 'codex'),
    ).toEqual({ renderedCmd: '$planning-with-files' })
  })

  it('a missing Codex user-skill is missing, not an unsupported Claude plugin', () => {
    const result = resolveCapabilityCmd(capability, new Set(), new Set(), 'codex')
    expect(result.warning).toContain("user-skill 'planning-with-files'")
    expect(result.warning).not.toContain('unavailable here')
  })

  it('Claude still requires the plugin even if the same-named user-skill is installed', () => {
    const result = resolveCapabilityCmd(capability, new Set(), new Set(['planning-with-files']))
    expect(result.renderedCmd).toBe('/plan')
    expect(result.warning).toContain('claude plugin install planning-with-files')
    expect(resolveCapabilityCmd(capability, new Set(['planning-with-files']), new Set())).toEqual({
      renderedCmd: '/plan',
    })
  })

  it('cmd-only overrides still inherit the top-level presence contract', () => {
    const cmdOnly = { ...capability, by_host: { codex: { cmd: '/codex-command' } } }
    const result = resolveCapabilityCmd(
      cmdOnly,
      new Set(),
      new Set(['planning-with-files']),
      'codex',
    )
    expect(result.renderedCmd).toBe('/codex-command')
    expect(result.warning).toContain('unavailable here')
  })

  it('partial presence overrides inherit fields that are not declared', () => {
    const skillDirOnly = {
      cmd: '/skill',
      install_type: 'user-skill' as const,
      skill_dir: 'claude-skill',
      by_host: { codex: { skill_dir: 'codex-skill' } },
    }
    expect(
      resolveCapabilityCmd(skillDirOnly, new Set(), new Set(['codex-skill']), 'codex'),
    ).toEqual({
      renderedCmd: '/skill',
    })
    const installTypeOnly = {
      ...capability,
      skill_dir: 'planning-with-files',
      by_host: { codex: { install_type: 'user-skill' as const } },
    }
    expect(
      resolveCapabilityCmd(installTypeOnly, new Set(), new Set(['planning-with-files']), 'codex'),
    ).toEqual({
      renderedCmd: '/plan',
    })
  })
})

describe('shipped Codex capabilities match the manifest user-skill install paths', () => {
  it.each([
    'planning-with-files',
    'ui-ux-pro-max',
  ])('%s resolves an installed shared skill', async (name) => {
    const caps = await loadCapabilities(WORKFLOWS)
    const cap = caps[name]
    if (!cap) throw new Error(`missing capability ${name}`)
    expect(resolveCapabilityCmd(cap, new Set(), new Set([name]), 'codex')).toEqual({
      renderedCmd: `$${name}`,
    })
  })

  it.each(['code-review', 'code-simplifier'])('%s stays unsupported on Codex', async (name) => {
    const caps = await loadCapabilities(WORKFLOWS)
    const cap = caps[name]
    if (!cap) throw new Error(`missing capability ${name}`)
    expect(resolveCapabilityCmd(cap, new Set(), new Set([name]), 'codex').warning).toContain(
      'unavailable here',
    )
    expect(cap.by_host?.codex).toBeUndefined()
  })

  it.each([
    ['planning-with-files', '/plan', 'claude-code-plugin'],
    ['ui-ux-pro-max', '/ui-ux-pro-max', 'plugin'],
  ])('%s retains the Claude declaration and command', async (name, cmd, impl) => {
    const caps = await loadCapabilities(WORKFLOWS)
    const cap = caps[name]
    if (!cap) throw new Error(`missing capability ${name}`)
    expect(cap).toMatchObject({ cmd, impl, install_type: 'plugin', plugin_id: name })
    expect(resolveCapabilityCmd(cap, new Set([name]), new Set(), 'claude')).toEqual({
      renderedCmd: cmd,
    })
  })

  it.each([
    'en',
    'zh-Hans',
  ] as const)('real %s Codex render discovers installed skills without plugin-skip warnings', async (locale) => {
    const skillsBase = join(home, '.agents', 'skills')
    for (const name of ['planning-with-files', 'ui-ux-pro-max']) {
      const dir = join(skillsBase, name)
      await mkdir(dir, { recursive: true })
      await writeFile(join(dir, 'SKILL.md'), `---\nname: ${name}\n---\n# ${name}\n`)
    }
    expect(readInstalledPlugins(home)).toEqual(new Set())
    expect(readInstalledUserSkills(home)).toEqual(new Set(['planning-with-files', 'ui-ux-pro-max']))
    for (const [name, relPath] of [
      ['plan-phase', 'plan/phase'],
      ['verify-design', 'verify/design'],
    ]) {
      await cp(join(WORKFLOWS, relPath as string), join(skillsBase, name as string), {
        recursive: true,
      })
    }
    const result = await renderAllSkills(
      ['plan-phase', 'verify-design'],
      skillsBase,
      WORKFLOWS,
      home,
      locale,
      'codex',
    )
    expect(result.results.every((r) => !r.error)).toBe(true)
    expect(
      result.aggregatedWarnings.filter((w) => /planning-with-files|ui-ux-pro-max/.test(w)),
    ).toEqual([])
    expect(await readFile(join(skillsBase, 'plan-phase', 'SKILL.md'), 'utf8')).toContain(
      '| `02-persist` | planning-with-files | haiku | `$planning-with-files`',
    )
    expect(await readFile(join(skillsBase, 'verify-design', 'SKILL.md'), 'utf8')).toContain(
      '| `02-ui-ux-structure` | ui-ux-pro-max | sonnet | `$ui-ux-pro-max`',
    )
  })

  it('the runtime Codex Tools section names the upstream skill, not the /plan master', async () => {
    const { prompt } = await buildPromptText('plan-phase', ROOT, { host: 'codex', locale: 'en' })
    expect(prompt).toContain('Invoke `$planning-with-files` (planning-with-files, user-skill)')
    expect(prompt).not.toContain('Invoke `/plan` (planning-with-files')
  })
})
