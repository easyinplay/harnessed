import { ChildProcess, execFile, spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { parse as parseYaml } from 'yaml'
import {
  buildHostMapSection,
  loadHostMapNotes,
  loadHostPrimitives,
} from '../../src/cli/lib/hostPrimitives.js'
import { evalTestChain } from '../../src/installers/lib/nativeTest.js'
import { resolveBash } from '../../src/installers/lib/resolveBash.js'
import { verifySkillRuntime } from '../../src/installers/lib/skillRuntime.js'
import type { InstallContext, Manifest } from '../../src/installers/lib/types.js'
import { validateManifestFile } from '../../src/manifest/validate.js'

const host = vi.hoisted(() => ({ id: 'codex' as 'codex' | 'claude', home: '' }))
vi.mock('../../src/platform/platform.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/platform/platform.js')>()
  return { ...actual, detectPlatform: () => actual.descriptorFor(host.id, host.home) }
})
vi.mock('node:child_process', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:child_process')>()
  return { ...actual, execFile: vi.fn(actual.execFile) }
})
const { execFile: realExecFile } =
  await vi.importActual<typeof import('node:child_process')>('node:child_process')

let sandbox: string
let context: InstallContext

function put(path: string, contents = '# installed resource\n'): void {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, contents)
}

function runVerify(cmd: string, home: string, codexHome = ''): boolean {
  const native = evalTestChain(cmd, home)
  if (native !== null) return native
  const shell = process.platform === 'win32' ? resolveBash().path : '/bin/sh'
  if (!shell) throw new Error('A usable POSIX shell is required for manifest contract tests')
  const result = spawnSync(shell, ['-c', cmd], {
    cwd: sandbox,
    env: {
      PATH: process.env.PATH,
      SystemRoot: process.env.SystemRoot,
      HOME: home.replaceAll('\\', '/'),
      USERPROFILE: home,
      CODEX_HOME: codexHome.replaceAll('\\', '/'),
    },
    windowsHide: true,
    timeout: 5_000,
    encoding: 'utf8',
  })
  if (result.error) throw result.error
  return result.status === 0
}

function useManifest(name: string): void {
  const manifest = parseYaml(
    readFileSync(join(process.cwd(), 'manifests/skill-packs', `${name}.yaml`), 'utf8'),
  ) as Manifest
  const override = host.id === 'codex' ? manifest.spec.harness_overrides?.codex : undefined
  context = {
    manifest: override
      ? {
          ...manifest,
          spec: {
            ...manifest.spec,
            install: override.install,
            verify: override.verify ?? manifest.spec.verify,
          },
        }
      : manifest,
    cwd: sandbox,
    level: 'L2',
    opts: {
      apply: true,
      dryRun: false,
      system: false,
      nonInteractive: true,
      fullDiff: false,
      color: false,
    },
  }
}

function gsdFixture(root = join(host.home, `.${host.id}`)): string {
  const skills = host.id === 'codex' ? join(host.home, '.agents/skills') : join(root, 'skills')
  put(join(skills, 'gsd-plan-phase/SKILL.md'))
  for (const phase of ['discuss-phase', 'plan-phase', 'execute-phase', 'verify-work', 'progress']) {
    put(join(root, 'gsd-core/workflows', `${phase}.md`))
  }
  put(
    join(root, 'gsd-core/bin/identity.cjs'),
    'module.exports = {packageName:"@opengsd/gsd-core",version:"1.18.0"}\n',
  )
  put(
    join(root, 'gsd-core/bin/gsd-tools.cjs'),
    'const identity = require("./identity.cjs"); if (process.argv[2] !== "runtime-identity") process.exit(2); console.log(JSON.stringify(identity))\n',
  )
  put(join(root, 'gsd-core/references/ui-brand.md'))
  for (const role of ['phase-researcher', 'planner', 'plan-checker', 'executor', 'verifier']) {
    put(join(root, 'agents', `gsd-${role}.${host.id === 'codex' ? 'toml' : 'md'}`))
  }
  return root
}

beforeEach(() => {
  sandbox = mkdtempSync(join(tmpdir(), 'harnessed-helper-'))
  host.home = join(sandbox, 'home with spaces')
  host.id = 'codex'
  vi.stubEnv('CODEX_HOME', '')
  vi.stubEnv('CLAUDE_CONFIG_DIR', '')
  vi.mocked(execFile).mockReset().mockImplementation(realExecFile)
})

function planningFixture(): string {
  const root = join(host.home, '.agents/skills/planning-with-files')
  put(join(root, 'SKILL.md'), '# Planning with native helper mapping\n')
  put(
    join(root, 'scripts/session-catchup.py'),
    'raise RuntimeError("Never run catchup during setup")\n',
  )
  for (const script of ['init-session', 'check-complete']) {
    put(join(root, 'scripts', `${script}.sh`), '#!/bin/sh\nexit 0\n')
    put(join(root, 'scripts', `${script}.ps1`), 'exit 0\n')
  }
  for (const template of ['task_plan', 'progress', 'findings']) {
    put(join(root, 'templates', `${template}.md`))
  }
  return root
}

function snapshot(root: string): Record<string, string> {
  return Object.fromEntries(
    readdirSync(root, { recursive: true, withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => {
        const path = join(entry.parentPath, entry.name)
        return [path, readFileSync(path, 'utf8')]
      }),
  )
}

describe('installed helper contracts: planning', () => {
  it('requires the resources even when the skill exists', async () => {
    useManifest('planning-with-files')
    put(join(host.home, '.agents/skills/planning-with-files/SKILL.md'))
    expect(await verifySkillRuntime(context)).toMatchObject({ ok: false, phase: 'verify' })
  })

  it('accepts native resources without running catchup or requiring orjson', async () => {
    useManifest('planning-with-files')
    const root = planningFixture()
    const before = snapshot(root)
    expect(await verifySkillRuntime(context)).toBeNull()
    expect(execFile).toHaveBeenCalled()
    expect(snapshot(root)).toEqual(before)
  })

  it('does not pass provider credentials to the helper process', async () => {
    useManifest('planning-with-files')
    planningFixture()
    vi.stubEnv('TAVILY_API_KEY', 'fixture-only-not-a-real-key')
    vi.stubEnv('EXA_API_KEY', 'fixture-only-not-a-real-key')
    expect(await verifySkillRuntime(context)).toBeNull()
    for (const call of vi.mocked(execFile).mock.calls) {
      const options = call[2] as { env?: NodeJS.ProcessEnv }
      expect(options.env?.TAVILY_API_KEY).toBeUndefined()
      expect(options.env?.EXA_API_KEY).toBeUndefined()
    }
  })

  it.each([
    'scripts/session-catchup.py',
    'templates/task_plan.md',
    'templates/findings.md',
    'templates/progress.md',
  ])('rejects missing %s', async (resource) => {
    useManifest('planning-with-files')
    const root = planningFixture()
    rmSync(join(root, resource))
    expect(await verifySkillRuntime(context)).toMatchObject({ ok: false, phase: 'verify' })
  })

  it('rejects an invalid Python helper without executing it', async () => {
    useManifest('planning-with-files')
    const root = planningFixture()
    put(join(root, 'scripts/session-catchup.py'), 'def broken(:\n')
    expect(await verifySkillRuntime(context)).toMatchObject({ ok: false, phase: 'verify' })
  })

  it('does not accept a Claude skill as a Codex helper install', async () => {
    useManifest('planning-with-files')
    put(join(host.home, '.claude/skills/planning-with-files/SKILL.md'))
    expect(await verifySkillRuntime(context)).toMatchObject({ ok: false, phase: 'verify' })
  })

  it('reports missing Python without attempting installation', async () => {
    useManifest('planning-with-files')
    planningFixture()
    vi.mocked(execFile).mockImplementation((...args) => {
      const callback = args.at(-1) as (error: Error, stdout: string, stderr: string) => void
      queueMicrotask(() => callback(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }), '', ''))
      return new ChildProcess()
    })
    expect(await verifySkillRuntime(context)).toMatchObject({
      ok: false,
      phase: 'verify',
      error: { message: expect.stringContaining('Python') },
    })
    expect(vi.mocked(execFile).mock.calls.map((call) => call[0])).not.toContain('pip')
  })
})

const uiData = [
  'styles',
  'prompts',
  'colors',
  'charts',
  'landing',
  'products',
  'ux-guidelines',
  'typography',
]

function uiFixture(): string {
  const root = join(host.home, '.agents/skills/ui-ux-pro-max')
  put(join(root, 'SKILL.md'))
  put(
    join(root, 'scripts/core.py'),
    [
      'from pathlib import Path',
      'def data_file(domain, stack):',
      '    name = "stacks/" + stack if stack else "styles"',
      '    return Path(__file__).parent.parent / "data" / (name + ".csv")',
    ].join('\n'),
  )
  put(
    join(root, 'scripts/search.py'),
    [
      'import argparse, csv, json',
      'from core import data_file',
      'parser = argparse.ArgumentParser()',
      'parser.add_argument("query")',
      'parser.add_argument("--domain", default="style")',
      'parser.add_argument("--stack")',
      'parser.add_argument("--json", action="store_true")',
      'parser.add_argument("--max-results", type=int, default=1)',
      'args = parser.parse_args()',
      'with data_file(args.domain, args.stack).open() as source:',
      '    rows = [row for row in csv.DictReader(source) if args.query.lower() in " ".join(row.values()).lower()][:args.max_results]',
      'print(json.dumps({"count": len(rows), "results": rows}))',
    ].join('\n'),
  )
  for (const name of [...uiData, 'stacks/html-tailwind']) {
    put(
      join(root, 'data', `${name}.csv`),
      name.startsWith('stacks/')
        ? 'Category,Guideline\nLayout,Responsive padding\n'
        : 'Name,Keywords\nDashboard,dashboard\n',
    )
  }
  return root
}

describe('installed helper contracts: UI', () => {
  it('requires the helper even when the skill exists', async () => {
    useManifest('ui-ux-pro-max')
    put(join(host.home, '.agents/skills/ui-ux-pro-max/SKILL.md'))
    expect(await verifySkillRuntime(context)).toMatchObject({ ok: false, phase: 'verify' })
  })

  it('runs real Python domain and stack queries from an unrelated cwd without writes', async () => {
    useManifest('ui-ux-pro-max')
    const root = uiFixture()
    const before = snapshot(root)
    expect(await verifySkillRuntime(context)).toBeNull()
    const calls = vi.mocked(execFile).mock.calls.map((call) => JSON.stringify(call[1]))
    expect(calls.some((args) => args.includes('--domain'))).toBe(true)
    expect(calls.some((args) => args.includes('--stack'))).toBe(true)
    expect(snapshot(root)).toEqual(before)
  })

  it('accepts a healthy stack with responsive results but no dashboard matches', async () => {
    useManifest('ui-ux-pro-max')
    uiFixture()
    expect(await verifySkillRuntime(context)).toBeNull()
  })

  it.each([
    '{}',
    'null',
    '"responsive"',
  ])('rejects a nonempty results array with invalid row content: %s', async (row) => {
    useManifest('ui-ux-pro-max')
    const root = uiFixture()
    put(join(root, 'scripts/search.py'), `print('{"count":1,"results":[${row}]}')\n`)
    expect(await verifySkillRuntime(context)).toMatchObject({ ok: false, phase: 'verify' })
  })

  it.each([
    'scripts/core.py',
    'scripts/search.py',
    'data/colors.csv',
    'data/stacks/html-tailwind.csv',
  ])('rejects missing %s', async (resource) => {
    useManifest('ui-ux-pro-max')
    const root = uiFixture()
    rmSync(join(root, resource))
    expect(await verifySkillRuntime(context)).toMatchObject({ ok: false, phase: 'verify' })
  })

  it('rejects exit zero with an error result rather than search results', async () => {
    useManifest('ui-ux-pro-max')
    const root = uiFixture()
    put(join(root, 'scripts/search.py'), 'print(\'{"error":"missing data"}\')\n')
    expect(await verifySkillRuntime(context)).toMatchObject({ ok: false, phase: 'verify' })
  })

  it('rejects a header-only data file', async () => {
    useManifest('ui-ux-pro-max')
    const root = uiFixture()
    put(join(root, 'data/colors.csv'), 'Name,Keywords\n')
    expect(await verifySkillRuntime(context)).toMatchObject({ ok: false, phase: 'verify' })
  })
})

describe('installed helper contract boundaries', () => {
  it.each([
    'gsd',
    'planning-with-files',
    'ui-ux-pro-max',
  ])('%s still verifies resources with apply:false', async (name) => {
    useManifest(name)
    context.opts.apply = false
    const skill = name === 'gsd' ? 'gsd-plan-phase' : name
    put(join(host.home, '.agents/skills', skill, 'SKILL.md'))
    const before = snapshot(host.home)
    expect(await verifySkillRuntime(context)).toMatchObject({ ok: false, phase: 'verify' })
    expect(snapshot(host.home)).toEqual(before)
  })

  it.each([
    'planning-with-files',
    'ui-ux-pro-max',
  ])('%s probes do not import project-local Python modules', async (name) => {
    useManifest(name)
    if (name === 'planning-with-files') planningFixture()
    else uiFixture()
    put(join(context.cwd, 'ast.py'), 'raise RuntimeError("Untrusted project ast was imported")\n')
    put(join(context.cwd, 'csv.py'), 'raise RuntimeError("Untrusted project csv was imported")\n')
    expect(await verifySkillRuntime(context)).toBeNull()
  })

  it.each([
    'planning-with-files',
    'ui-ux-pro-max',
  ])('leaves the %s Claude plugin channel unchanged', async (name) => {
    host.id = 'claude'
    useManifest(name)
    expect(await verifySkillRuntime(context)).toBeNull()
    expect(execFile).not.toHaveBeenCalled()
  })

  it('does not probe during a preview', async () => {
    useManifest('gsd')
    context.opts.dryRun = true
    expect(await verifySkillRuntime(context)).toBeNull()
    expect(execFile).not.toHaveBeenCalled()
  })
})

describe('manifest resource floors', () => {
  it.each([
    'shared',
    'legacy',
  ])('GSD uses the custom CODEX_HOME with a %s skill, never default-only resources', (location) => {
    useManifest('gsd')
    const root = join(host.home, 'custom Codex home')
    gsdFixture(root)
    if (location === 'legacy') {
      rmSync(join(host.home, '.agents/skills/gsd-plan-phase/SKILL.md'))
      put(join(root, 'skills/gsd-plan-phase/SKILL.md'))
    }
    expect(runVerify(context.manifest.spec.verify.cmd, host.home, root)).toBe(true)
    gsdFixture()
    rmSync(join(root, 'gsd-core/bin/gsd-tools.cjs'))
    expect(runVerify(context.manifest.spec.verify.cmd, host.home, root)).toBe(false)
  })

  it.each(['codex', 'claude'] as const)('GSD %s verify rejects skill-only installs', (id) => {
    host.id = id
    useManifest('gsd')
    const skills = id === 'codex' ? '.agents/skills' : '.claude/skills'
    put(join(host.home, skills, 'gsd-plan-phase/SKILL.md'))
    expect(runVerify(context.manifest.spec.verify.cmd, host.home)).toBe(false)
    gsdFixture()
    expect(runVerify(context.manifest.spec.verify.cmd, host.home)).toBe(true)
  })

  it('GSD verify preserves its legacy Codex skill root', () => {
    useManifest('gsd')
    const root = gsdFixture()
    rmSync(join(host.home, '.agents/skills/gsd-plan-phase/SKILL.md'))
    put(join(root, 'skills/gsd-plan-phase/SKILL.md'))
    expect(runVerify(context.manifest.spec.verify.cmd, host.home)).toBe(true)
    rmSync(join(root, 'gsd-core/bin/gsd-tools.cjs'))
    expect(runVerify(context.manifest.spec.verify.cmd, host.home)).toBe(false)
  })

  it.each([
    'planning-with-files',
    'ui-ux-pro-max',
  ])('%s verify requires helper payloads', (name) => {
    useManifest(name)
    put(join(host.home, '.agents/skills', name, 'SKILL.md'))
    expect(evalTestChain(context.manifest.spec.verify.cmd, host.home)).toBe(false)
    const root = name === 'planning-with-files' ? planningFixture() : uiFixture()
    expect(evalTestChain(context.manifest.spec.verify.cmd, host.home)).toBe(true)
    rmSync(join(root, name === 'planning-with-files' ? 'templates/findings.md' : 'data/colors.csv'))
    expect(evalTestChain(context.manifest.spec.verify.cmd, host.home)).toBe(false)
  })

  it.each([
    'gsd',
    'planning-with-files',
    'ui-ux-pro-max',
  ])('%s remains a valid manifest', (name) => {
    const path = join(process.cwd(), 'manifests/skill-packs', `${name}.yaml`)
    const result = validateManifestFile(readFileSync(path, 'utf8'), path)
    expect(result.ok, JSON.stringify(result)).toBe(true)
  })
})

describe('native helper host notes', () => {
  it.each([
    'en',
    'zh-Hans',
  ] as const)('%s renders installed helper paths without changing skill mappings', async (locale) => {
    const workflowsDir = join(process.cwd(), 'workflows')
    const notes = await loadHostMapNotes({ workflowsDir, host: 'codex', locale })
    const table = await loadHostPrimitives({ workflowsDir, locale })
    const section = buildHostMapSection({ host: 'codex', table, notes })
    for (const path of [
      '~/.agents/skills/planning-with-files/scripts/session-catchup.py',
      '~/.agents/skills/planning-with-files/templates/',
      '~/.agents/skills/ui-ux-pro-max/scripts/search.py',
    ])
      expect(section).toContain(path)
    expect(section).toContain('$planning-with-files')
    expect(section).toContain('$ui-ux-pro-max')
    expect(section).toContain('init-session.ps1')
    expect(section).toContain('check-complete.ps1')
    expect(section).toContain('.shared/ui-ux-pro-max')
    expect(buildHostMapSection({ host: 'claude', table, notes })).toBe('')
  })
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
  const target = resolve(sandbox)
  if (dirname(target) !== resolve(tmpdir()) || !target.includes('harnessed-helper-')) {
    throw new Error(`Refusing to remove unexpected test root: ${target}`)
  }
  rmSync(target, { recursive: true, force: true })
})

describe('installed helper contracts: GSD', () => {
  it('loads the shim through external node and rejects a missing adjacent module', async () => {
    useManifest('gsd')
    const root = gsdFixture()
    expect(await verifySkillRuntime(context)).toBeNull()
    rmSync(join(root, 'gsd-core/bin/identity.cjs'))
    expect(await verifySkillRuntime(context)).toMatchObject({ ok: false, phase: 'verify' })
    expect(
      vi
        .mocked(execFile)
        .mock.calls.some(
          (call) => call[0] === 'node' && JSON.stringify(call[1]).includes('runtime-identity'),
        ),
    ).toBe(true)
  })

  it.each([
    'not-json',
    '{"packageName":"another-gsd","version":"1.18.0"}',
    '{"packageName":"@opengsd/gsd-core","version":""}',
    '{"packageName":"@opengsd/gsd-core","version":"   "}',
    '{"packageName":"@opengsd/gsd-core","version":118}',
  ])('rejects an invalid GSD runtime identity: %s', async (output) => {
    useManifest('gsd')
    const root = gsdFixture()
    put(join(root, 'gsd-core/bin/gsd-tools.cjs'), `console.log(${JSON.stringify(output)})\n`)
    expect(await verifySkillRuntime(context)).toMatchObject({ ok: false, phase: 'verify' })
  })

  it.each([
    'codex',
    'claude',
  ] as const)('%s: install.env root takes precedence over the parent environment', async (id) => {
    host.id = id
    useManifest('gsd')
    const key = id === 'codex' ? 'CODEX_HOME' : 'CLAUDE_CONFIG_DIR'
    const installedHome = join(host.home, 'install target')
    const parentHome = join(host.home, 'parent target')
    vi.stubEnv(key, parentHome)
    context.manifest.spec.install.env = { [key]: installedHome }
    gsdFixture(installedHome)
    expect(await verifySkillRuntime(context)).toBeNull()
    gsdFixture(parentHome)
    rmSync(join(installedHome, 'gsd-core/bin/gsd-tools.cjs'))
    expect(await verifySkillRuntime(context)).toMatchObject({ ok: false, phase: 'verify' })
  })

  it.each([
    'codex',
    'claude',
  ] as const)('%s: an explicitly empty install.env root clears the parent override', async (id) => {
    host.id = id
    useManifest('gsd')
    const key = id === 'codex' ? 'CODEX_HOME' : 'CLAUDE_CONFIG_DIR'
    vi.stubEnv(key, join(host.home, 'wrong parent home'))
    context.manifest.spec.install.env = { [key]: '' }
    gsdFixture()
    expect(await verifySkillRuntime(context)).toBeNull()
  })

  it.each([
    'codex',
    'claude',
  ] as const)('%s: a skill alone is not an installed runtime', async (id) => {
    host.id = id
    useManifest('gsd')
    const skills = id === 'codex' ? '.agents/skills' : '.claude/skills'
    put(join(host.home, skills, 'gsd-plan-phase/SKILL.md'))
    expect(await verifySkillRuntime(context)).toMatchObject({ ok: false, phase: 'verify' })
  })

  it.each([
    'codex',
    'claude',
  ] as const)('%s: accepts the core resources without optional roles', async (id) => {
    host.id = id
    useManifest('gsd')
    gsdFixture()
    expect(await verifySkillRuntime(context)).toBeNull()
  })

  it.each([
    'gsd-core/workflows/plan-phase.md',
    'gsd-core/workflows/execute-phase.md',
    'gsd-core/bin/gsd-tools.cjs',
    'gsd-core/references/ui-brand.md',
    'agents/gsd-planner.toml',
    'agents/gsd-verifier.toml',
  ])('rejects a missing required resource: %s', async (resource) => {
    useManifest('gsd')
    const root = gsdFixture()
    rmSync(join(root, resource))
    expect(await verifySkillRuntime(context)).toMatchObject({
      ok: false,
      phase: 'verify',
      error: {
        message: expect.stringContaining(
          resource.replaceAll('/', process.platform === 'win32' ? '\\' : '/'),
        ),
      },
    })
  })
})
