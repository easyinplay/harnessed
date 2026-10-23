import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const unreadable = vi.hoisted(() => new Set<string>())
vi.mock('node:fs/promises', async (importOriginal) => {
  const real = await importOriginal<typeof import('node:fs/promises')>()
  return {
    ...real,
    readFile: ((path: unknown, ...rest: unknown[]) => {
      if (unreadable.has(String(path))) {
        return Promise.reject(
          Object.assign(new Error('fixture permission denied'), { code: 'EACCES' }),
        )
      }
      return (real.readFile as (...args: unknown[]) => unknown)(path, ...rest)
    }) as typeof real.readFile,
  }
})

let home: string
let root: string
const skill = '2.34.0/skills/planning-with-files'

beforeEach(() => {
  home = mkdtempSync(join(tmpdir(), 'planning-content-'))
  root = join(home, '.claude/plugins/cache/planning-with-files/planning-with-files')
  vi.stubEnv('HOME', home)
  vi.stubEnv('USERPROFILE', home)
  vi.stubEnv('HARNESSED_PLATFORM', 'claude')
  vi.stubEnv('HARNESSED_ROOT_OVERRIDE', '')
  unreadable.clear()
  vi.resetModules()
})

afterEach(() => {
  vi.unstubAllEnvs()
  unreadable.clear()
  rmSync(home, { recursive: true, force: true })
})

function file(path: string, content = 'fixture content\n'): void {
  const target = join(root, path)
  mkdirSync(dirname(target), { recursive: true })
  writeFileSync(target, content, 'utf8')
}

function complete(candidate: string): void {
  file(`${candidate}/SKILL.md`, '# Planning With Files\n')
  file(`${candidate}/scripts/init.sh`, 'echo fixture\n')
  file(`${candidate}/templates/task_plan.md`, '# Task Plan\n')
}

interface InvalidFixture {
  label: string
  dirs?: string[]
  files?: Record<string, string>
  denied?: string
}

const invalid: InvalidFixture[] = [
  { label: 'missing cache root' },
  { label: 'empty cache root', dirs: ['.'] },
  { label: 'version name is a file', files: { '2.34.0': 'not a directory' } },
  { label: 'empty version directory', dirs: ['2.34.0'] },
  { label: 'SKILL missing', dirs: [`${skill}/scripts`, `${skill}/templates`] },
  { label: 'SKILL is a directory', dirs: [`${skill}/SKILL.md`] },
  { label: 'empty SKILL', files: { [`${skill}/SKILL.md`]: '' } },
  { label: 'whitespace SKILL', files: { [`${skill}/SKILL.md`]: ' \n\t ' } },
  {
    label: 'unreadable SKILL',
    files: { [`${skill}/SKILL.md`]: '# Planning' },
    denied: `${skill}/SKILL.md`,
  },
  { label: 'scripts and templates missing', files: { [`${skill}/SKILL.md`]: '# Planning' } },
  {
    label: 'scripts missing',
    files: { [`${skill}/SKILL.md`]: '# Planning', [`${skill}/templates/plan.md`]: '# Plan' },
  },
  {
    label: 'templates missing',
    files: { [`${skill}/SKILL.md`]: '# Planning', [`${skill}/scripts/init.sh`]: 'echo fixture' },
  },
  {
    label: 'empty scripts and templates folders',
    dirs: [`${skill}/scripts`, `${skill}/templates`],
    files: { [`${skill}/SKILL.md`]: '# Planning' },
  },
  {
    label: 'scripts and templates are files instead of resource directories',
    files: {
      [`${skill}/SKILL.md`]: '# Planning',
      [`${skill}/scripts`]: 'echo fixture',
      [`${skill}/templates`]: '# Plan',
    },
  },
  {
    label: 'resource file names are directories',
    dirs: [`${skill}/scripts/init.sh`, `${skill}/templates/plan.md`],
    files: { [`${skill}/SKILL.md`]: '# Planning' },
  },
  {
    label: 'blank script placeholder',
    files: {
      [`${skill}/SKILL.md`]: '# Planning',
      [`${skill}/scripts/init.sh`]: ' \n\t',
      [`${skill}/templates/plan.md`]: '# Plan',
    },
  },
  {
    label: 'empty template placeholder',
    files: {
      [`${skill}/SKILL.md`]: '# Planning',
      [`${skill}/scripts/init.sh`]: 'echo fixture',
      [`${skill}/templates/plan.md`]: '',
    },
  },
  ...['scripts/init.sh', 'templates/plan.md'].map((resource) => ({
    label: `unreadable ${resource}`,
    files: {
      [`${skill}/SKILL.md`]: '# Planning',
      [`${skill}/scripts/init.sh`]: 'echo fixture',
      [`${skill}/templates/plan.md`]: '# Plan',
    },
    denied: `${skill}/${resource}`,
  })),
  {
    label: 'SKILL and resources scattered between candidate roots',
    files: {
      [`${skill}/SKILL.md`]: '# Planning',
      '2.34.0/scripts/init.sh': 'echo fixture',
      '2.34.0/templates/plan.md': '# Plan',
    },
  },
  {
    label: 'root SKILL cannot borrow nested skill resources',
    files: {
      '2.34.0/SKILL.md': '# Planning',
      [`${skill}/scripts/init.sh`]: 'echo fixture',
      [`${skill}/templates/plan.md`]: '# Plan',
    },
  },
]

describe('planning-with-files local content, not version-name presence', () => {
  it.each(invalid)('$label stays WARN with Claude remediation', async ({
    label,
    dirs,
    files,
    denied,
  }) => {
    for (const dir of dirs ?? []) mkdirSync(join(root, dir), { recursive: true })
    for (const [path, content] of Object.entries(files ?? {})) file(path, content)
    if (
      [
        'SKILL missing',
        'SKILL is a directory',
        'empty SKILL',
        'whitespace SKILL',
        'unreadable SKILL',
      ].includes(label)
    ) {
      file(`${skill}/scripts/init.sh`, 'echo fixture')
      file(`${skill}/templates/plan.md`, '# Plan')
    }
    if (denied) unreadable.add(join(root, denied))
    const { checkPlanningWithFiles } = await import(
      '../../src/cli/lib/check-planning-with-files.js'
    )
    const result = await checkPlanningWithFiles()
    expect(result.status).toBe('warn')
    expect(result.fix).toMatch(/claude plugin/)
    expect(result.install_commands).toEqual([
      'claude plugin marketplace add OthmanAdi/planning-with-files',
      'claude plugin install planning-with-files',
    ])
  })

  it('standard upstream layout detects only local content, not runtime execution', async () => {
    complete(skill)
    const { checkPlanningWithFiles } = await import(
      '../../src/cli/lib/check-planning-with-files.js'
    )
    const result = await checkPlanningWithFiles()
    expect(result.status).toBe('pass')
    expect(result.message).toMatch(/local[^;.]*content|content[^;.]*detect/i)
    expect(result.message).toMatch(/runtime[^;.]*(?:not verified|unverified)/i)
    expect(result.install_commands).toBeUndefined()
  })

  it('root-level layout is accepted only with its own scripts and templates', async () => {
    complete('2.34.0')
    const { checkPlanningWithFiles } = await import(
      '../../src/cli/lib/check-planning-with-files.js'
    )
    const result = await checkPlanningWithFiles()
    expect(result.status).toBe('pass')
    expect(result.message).toMatch(/local[^;.]*content|content[^;.]*detect/i)
    expect(result.message).toMatch(/runtime[^;.]*(?:not verified|unverified)/i)
  })

  it('a valid older version survives a broken newer version without endorsing the latter', async () => {
    complete('2.33.0/skills/planning-with-files')
    mkdirSync(join(root, '2.99.0'), { recursive: true })
    const { checkPlanningWithFiles } = await import(
      '../../src/cli/lib/check-planning-with-files.js'
    )
    const result = await checkPlanningWithFiles()
    expect(result.status).toBe('pass')
    expect(result.message).toContain('2.33.0')
    expect(result.message).not.toMatch(/version[^;.]*2\.99\.0/)
    expect(result.message).toMatch(/local[^;.]*content|content[^;.]*detect/i)
  })

  it('one readable nonblank resource in each directory suffices despite other placeholders', async () => {
    complete(skill)
    file(`${skill}/scripts/empty.sh`, '')
    file(`${skill}/templates/blank.md`, ' \n')
    const { checkPlanningWithFiles } = await import(
      '../../src/cli/lib/check-planning-with-files.js'
    )
    const result = await checkPlanningWithFiles()
    expect(result.status).toBe('pass')
    expect(result.message).toMatch(/local[^;.]*content|content[^;.]*detect/i)
  })

  it('Codex is SKIPPED and explicitly leaves its skills, content and runtime unverified', async () => {
    vi.stubEnv('HARNESSED_PLATFORM', 'codex')
    complete(skill)
    const { checkPlanningWithFiles } = await import(
      '../../src/cli/lib/check-planning-with-files.js'
    )
    const result = await checkPlanningWithFiles()
    expect(result.status).toBe('skipped')
    expect(result.message).toMatch(/skills/i)
    expect(result.message).toMatch(/content/i)
    expect(result.message).toMatch(/runtime/i)
    expect(result.message).toMatch(/not verified|unverified/i)
    expect(result.fix).toBeUndefined()
    expect(result.install_commands).toBeUndefined()
    expect(result.message).not.toMatch(/claude plugin install/)
  })
})
