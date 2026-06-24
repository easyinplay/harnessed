// Phase 29 T29.3 — setup --lang zh-Hans threads locale into render; dest SKILL.md
// carries the zh body, no .zh-Hans.md sibling left in the install dir. en default
// (no --lang, en env) → en body byte-identical.
//
// Strategy: REAL fs for the skill cp + render path (the behavior under test), with
// the heavy side-effect steps (Step B install, auto-install, commands gen) mocked
// to no-ops. getPackageRoot is mocked to a tmp fixture pkg carrying a fixture
// workflows/demo/{SKILL.md,SKILL.zh-Hans.md} + capabilities.yaml. The dest skills
// dir is redirected via HOME/USERPROFILE → tmp (getSkillsDir reads homedir).
//
// Locale is driven via setLocale()/HARNESSED_LANG (the bin pre-parse of --lang in
// src/cli.ts is bypassed when registerSetup is exercised directly).

import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Heavy / side-effecting steps mocked to no-ops; scanWorkflowsWithSkill returns
// our single fixture workflow so the real cp + renderAllSkills path executes.
vi.mock('../../src/cli/lib/setup-helpers.js', () => ({
  runStepBInstall: vi.fn(async () => ({
    installed: [],
    alreadyInstalled: [],
    skipped: [],
    failed: [],
    componentTypes: {},
    elapsedMs: 0,
  })),
  scanWorkflowsWithSkill: vi.fn(async () => ({
    workflows: [{ name: 'demo', relPath: 'demo', isMaster: false }],
  })),
  warnIfAgentTeamsMissing: vi.fn(),
}))
vi.mock('../../src/cli/lib/auto-install.js', () => ({ runAutoInstall: vi.fn() }))
vi.mock('../../src/cli/lib/generateCommands.js', () => ({
  loadRolePrompts: vi.fn(async () => ({})),
  writeAllCommands: vi.fn(async () => ({ results: [] })),
}))
vi.mock('../../src/cli/lib/enableAgentTeamsInSettings.js', () => ({
  enableAgentTeamsInSettings: vi.fn(),
}))
vi.mock('../../src/cli/lib/enableUserLangInSettings.js', () => ({
  enableUserLangInSettings: vi.fn(),
}))

// getPackageRoot → tmp fixture pkg (set per-test via the holder below).
const pkgRootHolder = { value: '' }
vi.mock('../../src/cli/lib/packagePath.js', () => ({
  getPackageRoot: () => pkgRootHolder.value,
}))

import { Command } from 'commander'
import { registerSetup } from '../../src/cli/setup.js'
import { __resetForTests, setLocale } from '../../src/i18n/index.js'

let tmpRoot: string
let savedHome: string | undefined
let savedUserProfile: string | undefined
const LOCALE_KEYS = ['HARNESSED_LANG', 'LC_ALL', 'LANG', 'LANGUAGE']
let savedLocaleEnv: Record<string, string | undefined>

class ExitError extends Error {
  constructor(public code: number) {
    super(`exit(${code})`)
  }
}

/** Build the fixture pkg: <pkg>/workflows/demo/{SKILL.md,SKILL.zh-Hans.md} + capabilities.yaml + manifests dirs. */
function buildFixturePkg(): string {
  const pkg = join(tmpRoot, 'pkg')
  const demo = join(pkg, 'workflows', 'demo')
  mkdirSync(demo, { recursive: true })
  writeFileSync(join(demo, 'SKILL.md'), 'EN BODY', 'utf8')
  writeFileSync(join(demo, 'SKILL.zh-Hans.md'), 'ZH BODY', 'utf8')
  writeFileSync(join(pkg, 'workflows', 'capabilities.yaml'), 'capabilities: {}\n', 'utf8')
  // empty manifest dirs so listBaseManifests doesn't throw
  mkdirSync(join(pkg, 'manifests', 'tools'), { recursive: true })
  mkdirSync(join(pkg, 'manifests', 'skill-packs'), { recursive: true })
  return pkg
}

async function runSetup(argv: string[]): Promise<number> {
  vi.spyOn(process, 'exit').mockImplementation((c?: number | string | null) => {
    throw new ExitError(typeof c === 'number' ? c : 0)
  })
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
  const program = new Command().exitOverride()
  registerSetup(program)
  try {
    await program.parseAsync(['node', 'harnessed', 'setup', ...argv])
    return 0
  } catch (e) {
    if (e instanceof ExitError) return e.code
    throw e
  }
}

beforeEach(() => {
  tmpRoot = mkdtempSync(join(tmpdir(), 'setup-locale-'))
  pkgRootHolder.value = buildFixturePkg()
  // Redirect dest skills dir (getSkillsDir → homedir) to tmp home.
  savedHome = process.env.HOME
  savedUserProfile = process.env.USERPROFILE
  const home = join(tmpRoot, 'home')
  mkdirSync(join(home, '.claude', 'skills'), { recursive: true })
  mkdirSync(join(home, '.claude', 'commands'), { recursive: true })
  process.env.HOME = home
  process.env.USERPROFILE = home
  savedLocaleEnv = {}
  for (const k of LOCALE_KEYS) {
    savedLocaleEnv[k] = process.env[k]
    delete process.env[k]
  }
  __resetForTests()
})

afterEach(() => {
  vi.restoreAllMocks()
  rmSync(tmpRoot, { recursive: true, force: true })
  if (savedHome === undefined) delete process.env.HOME
  else process.env.HOME = savedHome
  if (savedUserProfile === undefined) delete process.env.USERPROFILE
  else process.env.USERPROFILE = savedUserProfile
  for (const k of LOCALE_KEYS) {
    if (savedLocaleEnv[k] === undefined) delete process.env[k]
    else process.env[k] = savedLocaleEnv[k]
  }
  __resetForTests()
})

function destSkillDir(): string {
  return join(tmpRoot, 'home', '.claude', 'skills', 'demo')
}

describe('setup locale threading (T29.3)', () => {
  it('zh-Hans locale → installed SKILL.md == zh body; no .zh-Hans.md in dest', async () => {
    setLocale('zh-Hans')
    const code = await runSetup(['--non-interactive'])
    expect(code).toBe(0)
    const dir = destSkillDir()
    expect(readFileSync(join(dir, 'SKILL.md'), 'utf8')).toBe('ZH BODY')
    expect(existsSync(join(dir, 'SKILL.zh-Hans.md'))).toBe(false)
  })

  it('zh auto-detect via HARNESSED_LANG env (no setLocale) → installed SKILL.md == zh body', async () => {
    // Proves setup honors the AUTO-DETECTED locale end-to-end (getLocale() chain),
    // not just an explicit setLocale — guards against a render path hardwired to en.
    process.env.HARNESSED_LANG = 'zh-CN'
    __resetForTests()
    const code = await runSetup(['--non-interactive'])
    expect(code).toBe(0)
    const dir = destSkillDir()
    expect(readFileSync(join(dir, 'SKILL.md'), 'utf8')).toBe('ZH BODY')
    expect(existsSync(join(dir, 'SKILL.zh-Hans.md'))).toBe(false)
  })

  it('en default (no --lang, en env) → installed SKILL.md byte-identical en body', async () => {
    process.env.HARNESSED_LANG = 'en-US'
    __resetForTests()
    const code = await runSetup(['--non-interactive'])
    expect(code).toBe(0)
    const dir = destSkillDir()
    expect(readFileSync(join(dir, 'SKILL.md'), 'utf8')).toBe('EN BODY')
    // en path must not consume the zh sibling cp'd into the dest.
    expect(existsSync(join(dir, 'SKILL.zh-Hans.md'))).toBe(true)
  })
})
