import { existsSync, readFileSync } from 'node:fs'
import {
  cp,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  readlink,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, relative, resolve, sep } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { parse as parseYaml } from 'yaml'
import { renderSkillBody } from '../../src/cli/lib/capabilityResolver.js'
import * as commands from '../../src/cli/lib/generateCommands.js'
import {
  buildHostMapSection,
  insertHostMapSection,
  loadHostMapNotes,
  loadHostPrimitives,
  renderHostPrimitives,
} from '../../src/cli/lib/hostPrimitives.js'
import { loadCapabilities, renderAllSkills } from '../../src/cli/lib/renderSkillTemplates.js'
import { renderRolePromptsForHost } from '../../src/cli/lib/rolePromptHostRender.js'
import { backupSkillDir, skillContentMatchesLedger } from '../../src/cli/lib/skillBackup.js'
import { readHashLedger, recordSkillHashes } from '../../src/cli/lib/skillIntegrity.js'
import { setLocale } from '../../src/i18n/index.js'
import * as agentRoles from '../../src/installers/lib/codexAgentRoles.js'
import { renderCodexHookPlugin } from '../../src/installers/lib/codexHookPlugin.js'
import { createHostInstallContext } from '../../src/platform/hostInstallContext.js'
import { claudeDescriptor, codexDescriptor } from '../../src/platform/platform.js'
import { loadRolePrompts } from '../../src/workflow/rolePrompts.js'
import { scanWorkflowsNested } from '../../src/workflow/scan-nested.js'

// Keep real payload/backup/receipt writers. Native processes and trust are never
// allowed out of this fixture; no setup/native config/credentials are used.
const native = vi.hoisted(() => ({ installed: new Set<string>(), binary: false }))
vi.mock('node:fs/promises', async (original) => {
  const actual = await original<typeof import('node:fs/promises')>()
  return { ...actual, cp: vi.fn(actual.cp), mkdir: vi.fn(actual.mkdir) }
})
vi.mock('../../src/platform/assetsRoot.js', async (original) => ({
  ...(await original<typeof import('../../src/platform/assetsRoot.js')>()),
  isCompiledRuntime: () => native.binary,
}))
vi.mock('../../src/installers/lib/runClaudeArgs.js', () => ({
  runArgs: () => {
    throw new Error('unexpected external process')
  },
  runHarnessArgs: async (_bin: string, args: string[]) => {
    if (args[0] !== 'plugin') throw new Error(`unexpected external command: ${args}`)
    if (args[1] === 'add') native.installed.add(args[2] ?? '')
    return {
      exitCode: 0,
      stdout:
        args[1] === 'list'
          ? JSON.stringify({
              installed: [...native.installed].map((pluginId) => ({ pluginId, installed: true })),
            })
          : '',
      stderr: '',
    }
  },
}))
vi.mock('../../src/installers/lib/codexHookTrust.js', () => ({
  listCodexHooks: async () => ({ ok: true, value: [] }),
  trustCodexHooks: () => {
    throw new Error('fixture must not grant native trust')
  },
}))

const workflowsDir = resolve(__dirname, '../../workflows')

let root: string
beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'harnessed-owned-artifacts-'))
  vi.stubEnv('HOME', root)
  vi.stubEnv('USERPROFILE', root)
  vi.stubEnv('CODEX_HOME', join(root, 'codex'))
  vi.stubEnv('CLAUDE_CONFIG_DIR', join(root, 'claude'))
  vi.stubEnv('HARNESSED_ROOT_OVERRIDE', join(root, 'state'))
  vi.stubEnv('HARNESSED_PLATFORM', 'codex')
  native.installed.clear()
  native.binary = false
})
afterEach(async () => {
  vi.unstubAllEnvs()
  setLocale('en')
  const target = resolve(root)
  if (!target.startsWith(resolve(tmpdir()) + sep)) throw new Error('unsafe fixture cleanup')
  await rm(target, { recursive: true, force: true })
})

async function tree(dir: string): Promise<Record<string, Buffer>> {
  const files: Record<string, Buffer> = {}
  async function walk(at: string): Promise<void> {
    for (const entry of await readdir(at, { withFileTypes: true })) {
      const path = join(at, entry.name)
      if (entry.isDirectory()) await walk(path)
      else files[relative(dir, path).replaceAll('\\', '/')] = await readFile(path)
    }
  }
  if (existsSync(dir)) await walk(dir)
  return files
}
function assertPayloads(actual: Record<string, Buffer>, declared: Record<string, Buffer>): void {
  expect(Object.keys(actual).sort(), 'written -> declared').toEqual(Object.keys(declared).sort())
  for (const [path, bytes] of Object.entries(declared)) {
    expect(actual[path], `declared -> written: ${path}`).toEqual(bytes)
  }
}
async function snapshot(dir: string): Promise<Record<string, Buffer | string>> {
  const files: Record<string, Buffer | string> = {}
  async function walk(at: string): Promise<void> {
    for (const entry of await readdir(at, { withFileTypes: true })) {
      const path = join(at, entry.name)
      const key = relative(dir, path).replaceAll('\\', '/')
      if (entry.isSymbolicLink()) files[key] = `link:${await readlink(path)}`
      else if (entry.isDirectory()) {
        files[`${key}/`] = 'directory'
        await walk(path)
      } else files[key] = await readFile(path)
    }
  }
  await walk(dir)
  return files
}
async function workflowApi() {
  const api = await import('../../src/cli/lib/workflowArtifacts.js').catch(() => null)
  expect(api, 'production workflow artifact declaration/copy API').not.toBeNull()
  if (!api) throw new Error('missing workflow artifact API')
  return api
}

describe('owned payload declarations consumed by production writers', () => {
  it.each([
    'root-junction',
    'nested-assets-link',
  ] as const)('rejects destination %s before any payload write and preserves external bytes', async (kind) => {
    const api = await workflowApi()
    const source = join(root, 'package', 'demo')
    const skills = join(root, 'skills')
    const dest = join(skills, 'demo')
    const outside = join(root, 'external')
    await mkdir(join(source, '000-safe'), { recursive: true })
    await mkdir(join(source, 'assets', 'nested'), { recursive: true })
    await mkdir(outside, { recursive: true })
    await mkdir(skills, { recursive: true })
    await writeFile(join(source, '000-safe', 'first.txt'), 'would be written before assets')
    await writeFile(join(source, 'SKILL.md'), 'new workflow')
    await writeFile(join(source, 'assets', 'nested', 'sentinel.bin'), Buffer.from([0, 255, 12]))
    if (kind === 'root-junction') {
      await writeFile(join(outside, 'SKILL.md'), 'external root sentinel')
      await symlink(outside, dest, process.platform === 'win32' ? 'junction' : 'dir')
    } else {
      await mkdir(dest, { recursive: true })
      await mkdir(join(outside, 'nested'), { recursive: true })
      await writeFile(join(dest, 'SKILL.md'), 'existing workflow')
      await writeFile(join(outside, 'nested', 'sentinel.bin'), 'external assets sentinel')
      await symlink(
        outside,
        join(dest, 'assets'),
        process.platform === 'win32' ? 'junction' : 'dir',
      )
    }
    const baseline = await snapshot(root)
    vi.mocked(cp).mockClear()
    vi.mocked(mkdir).mockClear()
    const result = await api.copyWorkflowArtifacts(source, dest).then(
      () => ({ rejected: false }),
      () => ({ rejected: true }),
    )
    expect(await snapshot(root)).toEqual(baseline)
    expect(result.rejected).toBe(true)
    expect(cp).not.toHaveBeenCalled()
    expect(mkdir).not.toHaveBeenCalled()
  })

  it('preserves the trusted skillsBase alias above the protected workflow root', async () => {
    const api = await workflowApi()
    const source = join(root, 'package', 'demo')
    const trusted = join(root, 'trusted-skills')
    const skills = join(root, 'skills-alias')
    await mkdir(source, { recursive: true })
    await mkdir(trusted, { recursive: true })
    await writeFile(join(source, 'SKILL.md'), 'trusted alias payload')
    await symlink(trusted, skills, process.platform === 'win32' ? 'junction' : 'dir')
    await api.copyWorkflowArtifacts(source, join(skills, 'demo'))
    assertPayloads(await tree(join(trusted, 'demo')), await tree(source))
  })

  for (const locale of ['en', 'zh-Hans'] as const) {
    it.each([
      undefined,
      'claude',
    ] as const)(`${locale}: captured Codex host wins over sixth parameter %s and ambient Claude`, async (host) => {
      vi.stubEnv('HARNESSED_PLATFORM', 'claude')
      const source = join(root, 'fixture-workflows')
      const skills = join(root, 'rendered-skills')
      await mkdir(source, { recursive: true })
      await mkdir(join(skills, 'demo'), { recursive: true })
      await writeFile(
        join(source, 'capabilities.yaml'),
        [
          'capabilities:',
          '  demo:',
          '    cmd: /claude',
          '    by_host:',
          '      codex:',
          '        cmd: $codex',
        ].join('\n'),
      )
      for (const tableLocale of ['en', 'zh-Hans'] as const) {
        await writeFile(
          join(
            source,
            tableLocale === 'en' ? 'host-primitives.yaml' : 'host-primitives.zh-Hans.yaml',
          ),
          [
            'primitives:',
            '  fixture:',
            '    default:',
            `      claude: CLAUDE-${tableLocale}-BYTES`,
            `      codex: CODEX-${tableLocale}-BYTES`,
          ].join('\n'),
        )
      }
      await writeFile(
        join(skills, 'demo', 'SKILL.md'),
        '{{ host.fixture }} {{ capabilities.demo.cmd }}',
      )
      const context = createHostInstallContext(codexDescriptor(root), {
        os: process.platform,
        userHome: root,
      })
      const result = await renderAllSkills(['demo'], skills, source, root, locale, host, context)
      expect(result.results.filter((r) => r.error)).toEqual([])
      expect(
        (await readFile(join(skills, 'demo', 'SKILL.md'), 'utf8')).endsWith(
          `CODEX-${locale}-BYTES $codex`,
        ),
      ).toBe(true)
    })
  }
  it('pins capability presence to the optional captured context, not the ambient host', async () => {
    const source = join(root, 'fixture-workflows')
    const target = join(root, 'rendered-skills')
    const selectedHome = join(root, 'selected-native')
    const selectedSkills = join(selectedHome, 'skills')
    const selectedRegistry = join(selectedHome, 'plugins', 'installed_plugins.json')
    await mkdir(source, { recursive: true })
    await mkdir(join(target, 'demo'), { recursive: true })
    await mkdir(join(selectedSkills, 'present-skill'), { recursive: true })
    await mkdir(join(selectedHome, 'plugins'), { recursive: true })
    await writeFile(selectedRegistry, JSON.stringify({ plugins: { 'present-plugin@fixture': [] } }))
    await writeFile(
      join(source, 'capabilities.yaml'),
      [
        'capabilities:',
        '  skill:',
        '    cmd: /skill',
        '    install_type: user-skill',
        '    skill_dir: present-skill',
        '  plugin:',
        '    cmd: /plugin',
        '    install_type: plugin',
        '    plugin_id: present-plugin',
      ].join('\n'),
    )
    await writeFile(
      join(target, 'demo', 'SKILL.md'),
      '{{ capabilities.skill.cmd }} {{ capabilities.plugin.cmd }}',
    )
    const context = createHostInstallContext(claudeDescriptor(root), {
      os: process.platform,
      userHome: root,
      nativeHome: selectedHome,
    })
    // beforeEach has selected ambient Codex, whose paths lack both capabilities.
    const result = await renderAllSkills(['demo'], target, source, root, 'en', 'claude', context)
    expect(result.aggregatedWarnings).toEqual([])
    expect(await readFile(join(target, 'demo', 'SKILL.md'), 'utf8')).toBe('/skill /plugin')
  })
  for (const mode of ['npm', 'binary'] as const) {
    for (const locale of ['en', 'zh-Hans'] as const) {
      it(`codex/${locale}/${mode}: first-party hook declarations feed the real writer twice`, async () => {
        setLocale(locale)
        native.binary = mode === 'binary'
        const { installCodexHook } = await import('../../src/installers/codexHookAdd.js')
        const { invalidateCodexPluginCache } = await import(
          '../../src/installers/lib/codexPlugins.js'
        )
        invalidateCodexPluginCache()
        const marketplace = join(root, 'codex', 'harnessed', 'marketplace')
        const expected: Record<string, Buffer> = {}
        const metadata = new Set([
          'state/state.json',
          'codex/harnessed/marketplace/.agents/plugins/marketplace.json',
        ])
        const manifests: Parameters<typeof installCodexHook>[0]['manifest'][] = []
        const exceptions = new Set<string>()
        const sources = await tree(resolve(workflowsDir, '../manifests'))
        for (const [filename, bytes] of Object.entries(sources)) {
          if (!filename.endsWith('.yaml')) continue
          const manifest = parseYaml(bytes.toString('utf8')) as Parameters<
            typeof installCodexHook
          >[0]['manifest']
          if (manifest.spec?.install?.method !== 'cc-hook-add') continue
          const block = manifest.spec.install
          const rendered = renderCodexHookPlugin(
            {
              manifestName: manifest.metadata.name,
              event: block.hook_event,
              matcher: block.hook_matcher,
              hookCommand: block.hook_command,
              ...(manifest.metadata.name === 'update-reminder'
                ? { reminderStateRoot: resolve(root, 'state') }
                : {}),
            },
            mode,
          )
          if (!rendered) {
            expect(['stop-hook-recover', 'dashboard-autospawn']).toContain(manifest.metadata.name)
            exceptions.add(manifest.metadata.name)
            continue
          }
          manifests.push(manifest)
          expect(rendered.files.map((f) => f.path).sort()).toEqual([
            `plugins/${rendered.pluginName}/.codex-plugin/plugin.json`,
            ...(mode === 'npm' ? [`plugins/${rendered.pluginName}/hook.cjs`] : []),
            `plugins/${rendered.pluginName}/hooks/hooks.json`,
          ])
          for (const f of rendered.files) expected[f.path] = Buffer.from(f.content)
          metadata.add(`codex/harnessed/marketplace/plugins/${rendered.pluginName}/install.json`)
          metadata.add(`codex/plugins/data/${rendered.pluginName}-harnessed-local/install.json`)
        }
        expect(exceptions).toEqual(new Set(['stop-hook-recover', 'dashboard-autospawn']))
        expect(manifests.length).toBeGreaterThan(0)
        for (let pass = 0; pass < 2; pass++) {
          for (const manifest of manifests) {
            const result = await installCodexHook({
              manifest,
              cwd: root,
              level: 'L3',
              opts: {
                apply: true,
                dryRun: false,
                nonInteractive: true,
                quiet: true,
                system: false,
                fullDiff: false,
                color: false,
              },
            })
            expect(result).toMatchObject({ ok: true })
          }
          const actual = await tree(marketplace)
          for (const path of metadata) {
            const prefix = 'codex/harnessed/marketplace/'
            if (path.startsWith(prefix)) {
              expect(actual[path.slice(prefix.length)]).toBeDefined()
              delete actual[path.slice(prefix.length)]
            }
          }
          assertPayloads(actual, expected)
          for (const path of Object.keys(await tree(root))) {
            const prefix = 'codex/harnessed/marketplace/'
            const payload =
              path.startsWith(prefix) && Object.hasOwn(expected, path.slice(prefix.length))
            // Existing backup engine may mirror prior marketplace.json versions.
            const backup =
              /^state\/backups\/[^/]+\/(metadata\.json|HOME\/(codex\/harnessed\/marketplace\/\.agents\/plugins\/marketplace\.json|[a-f0-9]{16}))$/.test(
                path,
              )
            expect(
              payload || metadata.has(path) || backup,
              `unclassified hook write: ${path}`,
            ).toBe(true)
          }
        }
        expect(
          renderCodexHookPlugin(
            {
              manifestName: 'stop-hook-recover',
              event: 'Stop',
              hookCommand: 'node bin/harnessed-stop-hook.mjs',
            },
            mode,
          ),
        ).toBeNull()
        expect(
          renderCodexHookPlugin(
            {
              manifestName: 'dashboard-autospawn',
              event: 'SessionStart',
              hookCommand: 'node scripts/dashboard.mjs --no-open',
            },
            mode,
          ),
        ).toBeNull()
        // Claude registers native entries; no standalone hook wrapper is emitted.
        invalidateCodexPluginCache()
      })
    }
  }
  it('preserves command/role refusal and reports missing commands and master-role exclusions', async () => {
    const commandDir = join(root, 'commands')
    const agents = join(root, 'agents')
    await mkdir(commandDir, { recursive: true })
    await mkdir(agents, { recursive: true })
    const prompts = await loadRolePrompts(workflowsDir, 'en')
    await writeFile(join(commandDir, 'task-code.md'), 'user command')
    await writeFile(join(agents, 'harnessed-task-code.toml'), 'user role')
    const result = await commands.writeAllCommands(
      ['task-code', 'missing'],
      commandDir,
      prompts,
      {},
      new Set(),
      new Set(),
      async (p, c) => {
        await writeFile(p, c)
      },
    )
    expect(result.results.map((r) => r.written)).toEqual([false, false])
    expect(result.results[0]?.warning).toContain('user-authored')
    expect(result.results[1]?.warning).toContain('no role-prompts.yaml entry')
    const roles = agentRoles.buildCodexAgentRoles(prompts, ['task-code', 'auto'])
    expect(roles.map((r) => r.sub)).toEqual(['task-code'])
    expect((await agentRoles.writeCodexAgentRoles(agents, roles)).written).toEqual([])
    expect(await readFile(join(commandDir, 'task-code.md'), 'utf8')).toBe('user command')
    expect(await readFile(join(agents, 'harnessed-task-code.toml'), 'utf8')).toBe('user role')
  })

  it('retains namespace backup/overwrite and the existing rendered hash ledger', async () => {
    const api = await workflowApi()
    const skills = join(root, 'skills')
    const installed = join(skills, 'research')
    const session = join(root, 'backups', 'step-a')
    const ledgerPath = join(root, 'skill-hashes.json')
    await mkdir(installed, { recursive: true })
    await writeFile(join(installed, 'SKILL.md'), 'user workflow')
    expect(await skillContentMatchesLedger('research', skills, null)).toBeNull()
    expect((await backupSkillDir('research', skills, session)).ok).toBe(true)
    await api.copyWorkflowArtifacts(join(workflowsDir, 'research'), installed)
    await renderAllSkills(['research'], skills, workflowsDir, root, 'en', 'claude')
    expect(await readFile(join(session, 'research', 'SKILL.md'), 'utf8')).toBe('user workflow')
    expect(await readFile(join(installed, 'SKILL.md'), 'utf8')).not.toBe('user workflow')
    await recordSkillHashes(['research'], skills, ledgerPath)
    const ledger = await readHashLedger(ledgerPath)
    expect(await skillContentMatchesLedger('research', skills, ledger)).toBe(true)
    await writeFile(join(installed, 'SKILL.md'), 'modified managed workflow')
    expect(await skillContentMatchesLedger('research', skills, ledger)).toBe(false)
    expect(
      (await api.enumerateWorkflowArtifacts(join(workflowsDir, 'research'), installed)).some(
        (f) => f.path.includes('skill-hashes') || f.path.includes('backups'),
      ),
    ).toBe(false)
  })
  for (const host of ['claude', 'codex'] as const) {
    for (const locale of ['en', 'zh-Hans'] as const) {
      it(`${host}/${locale}: complete workflow trees, commands and host-specific roles agree twice`, async () => {
        const api = await workflowApi()
        const { workflows } = await scanWorkflowsNested(workflowsDir, await readdir(workflowsDir))
        const names = workflows.map((wf) => wf.name)
        const home = join(root, host)
        const skills = join(home, 'skills')
        const commandDir = join(home, 'commands')
        const agents = join(home, 'agents')
        await mkdir(commandDir, { recursive: true })
        const capabilities = await loadCapabilities(workflowsDir)
        const prompts = await loadRolePrompts(workflowsDir, locale)
        const table = await loadHostPrimitives({ workflowsDir, locale })
        const hostRender = {
          host,
          table,
          notes: host === 'claude' ? [] : await loadHostMapNotes({ workflowsDir, locale, host }),
        }
        const commandRender = {
          host,
          table: await loadHostPrimitives({ workflowsDir, locale: 'en' }),
          descriptionTable: table,
        }
        const expectedSkills: Record<string, Buffer> = {}
        for (const wf of workflows) {
          const source = join(workflowsDir, wf.relPath)
          const sourceFiles = await tree(source)
          const declared = await api.enumerateWorkflowArtifacts(source, join(skills, wf.name))
          expect(
            declared
              .map((f) => relative(join(skills, wf.name), f.path).replaceAll('\\', '/'))
              .sort(),
          ).toEqual(Object.keys(sourceFiles).sort())
          for (const [path, bytes] of Object.entries(sourceFiles)) {
            if (path === 'SKILL.zh-Hans.md') {
              expect(
                declared.find((f) => f.path === join(skills, wf.name, path))?.classification,
              ).toBe('locale-input')
              continue
            }
            if (path === 'SKILL.md') {
              const body = (
                locale === 'zh-Hans' ? (sourceFiles['SKILL.zh-Hans.md'] ?? bytes) : bytes
              ).toString('utf8')
              const rendered = renderSkillBody(body, capabilities, new Set(), new Set(), host).body
              expectedSkills[`${wf.name}/${path}`] = Buffer.from(
                insertHostMapSection(
                  renderHostPrimitives(rendered, hostRender),
                  buildHostMapSection(hostRender),
                ),
              )
            } else expectedSkills[`${wf.name}/${path}`] = bytes
          }
        }
        expect(
          Object.keys(expectedSkills).filter((p) => p.endsWith('/workflow.yaml')).length,
        ).toBeGreaterThan(20)
        const expectedCommands: Record<string, Buffer> = {}
        for (const name of names) {
          const prompt = prompts[name]
          if (!prompt) continue // Explicit optional exception reported by the production writer.
          const declared = commands.generateCommandArtifact(
            name,
            commandDir,
            prompt,
            capabilities,
            new Set(),
            new Set(),
            commandRender,
          )
          expect(declared.path).toBe(join(commandDir, `${name}.md`))
          expectedCommands[`${name}.md`] = Buffer.from(declared.content)
        }
        const renderedPrompts = await renderRolePromptsForHost(prompts, {
          workflowsDir,
          host,
          locale,
        })
        const roles =
          host === 'codex'
            ? agentRoles.buildCodexAgentRoles(renderedPrompts, names, {
                renderDescription: (body) => renderHostPrimitives(body, { host, table }),
              })
            : [] // Claude has no standalone harnessed role-file surface.
        const roleDeclarations = agentRoles.codexAgentRoleArtifacts(agents, roles)
        const expectedRoles = Object.fromEntries(
          roleDeclarations.map((f) => [
            relative(agents, f.path).replaceAll('\\', '/'),
            Buffer.from(f.content),
          ]),
        )
        for (let pass = 0; pass < 2; pass++) {
          for (const wf of workflows)
            await api.copyWorkflowArtifacts(join(workflowsDir, wf.relPath), join(skills, wf.name))
          const render = await renderAllSkills(names, skills, workflowsDir, root, locale, host)
          expect(render.results.filter((r) => r.error)).toEqual([])
          const written = await commands.writeAllCommands(
            names,
            commandDir,
            prompts,
            capabilities,
            new Set(),
            new Set(),
            async (p, c) => {
              await writeFile(p, c)
            },
            existsSync,
            (p) => readFileSync(p, 'utf8'),
            commandRender,
          )
          expect(
            written.results
              .filter((r) => r.written)
              .map((r) => relative(commandDir, r.path))
              .sort(),
          ).toEqual(Object.keys(expectedCommands).sort())
          expect((await agentRoles.writeCodexAgentRoles(agents, roles)).skipped).toEqual([])
          assertPayloads(await tree(skills), expectedSkills)
          assertPayloads(await tree(commandDir), expectedCommands)
          assertPayloads(await tree(agents), expectedRoles)
          const entireWriteSet = Object.fromEntries([
            ...Object.entries(expectedSkills).map(([p, bytes]) => [`${host}/skills/${p}`, bytes]),
            ...Object.entries(expectedCommands).map(([p, bytes]) => [
              `${host}/commands/${p}`,
              bytes,
            ]),
            ...Object.entries(expectedRoles).map(([p, bytes]) => [`${host}/agents/${p}`, bytes]),
          ])
          assertPayloads(await tree(root), entireWriteSet)
        }
      })
    }
  }
  it('detects undeclared writes, missing writes and wrong bytes independently', () => {
    const payload = { 'demo/SKILL.md': Buffer.from('rendered') }
    expect(() =>
      assertPayloads({ ...payload, 'extra.txt': Buffer.from('extra') }, payload),
    ).toThrow()
    expect(() => assertPayloads({}, payload)).toThrow()
    expect(() => assertPayloads({ 'demo/SKILL.md': Buffer.from('wrong') }, payload)).toThrow()
  })

  it('copies nested assets and definition bytes but never claims pre-existing user extras', async () => {
    const api = await workflowApi()
    const source = join(root, 'package', 'demo')
    const dest = join(root, 'skills', 'demo')
    await mkdir(join(source, 'assets', 'nested'), { recursive: true })
    await mkdir(dest, { recursive: true })
    await writeFile(join(source, 'SKILL.md'), '<!-- harnessed-generated:v1.0.0 -->\nfixture\n')
    await writeFile(join(source, 'workflow.yaml'), 'name: demo\n')
    await writeFile(join(source, 'assets', 'nested', 'sample.bin'), Buffer.from([0, 255, 13, 10]))
    await writeFile(join(dest, 'user.txt'), 'user sentinel')
    const declared = await api.enumerateWorkflowArtifacts(source, dest)
    expect(declared.map((f) => relative(dest, f.path).replaceAll('\\', '/')).sort()).toEqual([
      'SKILL.md',
      'assets/nested/sample.bin',
      'workflow.yaml',
    ])
    for (let pass = 0; pass < 2; pass++) {
      await api.copyWorkflowArtifacts(source, dest)
      const actual = await tree(dest)
      expect(actual['user.txt']?.toString()).toBe('user sentinel')
      delete actual['user.txt'] // Preserved user data is not an owned payload declaration.
      assertPayloads(actual, await tree(source))
    }
  })
})
