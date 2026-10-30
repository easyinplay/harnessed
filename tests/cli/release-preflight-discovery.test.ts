import { execFileSync } from 'node:child_process'
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, relative } from 'node:path'
import { Command, CommanderError } from 'commander'
import { afterEach, describe, expect, it, vi } from 'vitest'
import pkg from '../../package.json' with { type: 'json' }
import { collectPreflight, defaultDeps } from '../../src/cli/lib/release-preflight.js'
import { registerReleasePreflight } from '../../src/cli/release-preflight.js'

const roots: string[] = []
const changelog = '# Changelog\n\n## [Unreleased]\n\n- release entry\n'

function git(root: string, ...args: string[]): string {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim()
}

function repo(files: Record<string, string> = {}): string {
  const root = mkdtempSync(join(tmpdir(), 'harnessed-preflight-'))
  roots.push(root)
  git(root, 'init', '--quiet')
  git(root, 'config', 'core.autocrlf', 'false')
  writeFileSync(join(root, 'CHANGELOG.md'), changelog)
  for (const [name, content] of Object.entries(files)) writeFileSync(join(root, name), content)
  git(root, 'add', '.')
  git(
    root,
    '-c',
    'user.name=Preflight Test',
    '-c',
    'user.email=test@example.invalid',
    'commit',
    '--quiet',
    '--no-verify',
    '-m',
    'fixture',
  )
  return root
}

function checks(root: string) {
  return collectPreflight(defaultDeps(root))
}

function snapshot(root: string): Record<string, string> {
  return Object.fromEntries(
    readdirSync(root, { recursive: true, withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => {
        const path = join(entry.parentPath, entry.name)
        return [relative(root, path), readFileSync(path).toString('base64')]
      }),
  )
}

async function runCli(root: string, args: string[]) {
  let stdout = ''
  let stderr = ''
  const program = new Command().name('harnessed').version(pkg.version).exitOverride()
  program.configureOutput({
    writeOut: (text) => {
      stdout += text
    },
    writeErr: (text) => {
      stderr += text
    },
  })
  registerReleasePreflight(program)
  vi.spyOn(process, 'cwd').mockReturnValue(root)
  vi.spyOn(console, 'log').mockImplementation((...values: unknown[]) => {
    stdout += `${values.map(String).join(' ')}\n`
  })
  vi.spyOn(process, 'exit').mockImplementation((code) => {
    throw new CommanderError(Number(code ?? 0), 'test.exit', 'exit')
  })
  let code = 0
  try {
    await program.parseAsync(args, { from: 'user' })
  } catch (error) {
    if (!(error instanceof CommanderError)) throw error
    code = error.exitCode
  } finally {
    vi.restoreAllMocks()
  }
  return { code, stdout, stderr }
}

afterEach(() => {
  vi.restoreAllMocks()
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true })
})

describe('release-preflight static manifest discovery', () => {
  it.each([
    ['package.json', '{"version":"1.2.3"}', 'package.json'],
    ['pyproject.toml', '[project]\nversion = "1.2.3"\n', 'project'],
    ['pyproject.toml', '[tool.poetry]\nversion = "1.2.3"\n', 'tool.poetry'],
    ['Cargo.toml', '[package]\nversion = "1.2.3"\n', 'package'],
    ['pyproject.toml', 'project = { version = "1.2.3" }\n', 'project'],
    ['pyproject.toml', '["tool"."poetry"]\nversion = \'1.2.3\' # comment\n', 'tool.poetry'],
    ['Cargo.toml', 'package.version = "1.2.3"\n', 'package'],
  ])('reads %s (%s)', (name, content, source) => {
    const result = checks(repo({ [name]: content }))
    expect(result.every((check) => check.status === 'pass')).toBe(true)
    expect(result.find((check) => check.name === 'version')?.message).toContain('1.2.3')
    expect(result.find((check) => check.name === 'version')?.message).toContain(source)
  })

  it('accepts the same version across all four sources', () => {
    const result = checks(
      repo({
        'package.json': '{"version":"1.2.3"}',
        'pyproject.toml': '[project]\nversion = "1.2.3"\n[tool.poetry]\nversion = "1.2.3"\n',
        'Cargo.toml': '[package]\nversion = "1.2.3"\n',
      }),
    )
    expect(result.every((check) => check.status === 'pass')).toBe(true)
  })

  it.each<Record<string, string>>([
    { 'package.json': '{"version":"1.2.3"}', 'Cargo.toml': '[package]\nversion = "2.0.0"\n' },
    { 'pyproject.toml': '[project]\nversion = "1.2.3"\n[tool.poetry]\nversion = "2.0.0"\n' },
  ])('fails closed on conflicting valid sources: %j', (files) => {
    const result = checks(repo(files))
    expect(result.find((check) => check.name === 'version')).toMatchObject({ status: 'fail' })
    expect(result.find((check) => check.name === 'version')?.message).toMatch(/conflict/i)
    expect(result.find((check) => check.name === 'version')?.fix).toContain('--release-version')
    expect(result.find((check) => check.name === 'tag-absent')?.status).toBe('warn')
  })

  it.each<Record<string, string>>([
    {},
    { 'package.json': '{}' },
    { 'package.json': '{broken' },
    { 'package.json': '{"version":123}' },
    { 'package.json': '{"version":"1.0.0garbage"}' },
    { 'pyproject.toml': '[project]\ndynamic = ["version"]\n' },
    { 'pyproject.toml': '[project]\nversion = "1.2.3"\ndynamic = ["version"]\n' },
    { 'pyproject.toml': '[tool.poetry]\nname = "dynamic"\n' },
    { 'pyproject.toml': '[project]\nversion = "1.2.3"\nversion = "2.0.0"\n' },
    { 'pyproject.toml': '[project\nversion = "1.2.3"\n' },
    {
      'Cargo.toml': '[package]\nversion.workspace = true\n[workspace.package]\nversion = "1.2.3"\n',
    },
    { 'Cargo.toml': '[workspace.package]\nversion = "1.2.3"\n' },
    { 'Cargo.toml': '[package]\nversion = "1.0.0garbage"\n' },
    { 'Cargo.toml': '[package]\nversion = "unterminated\n' },
  ])('fails without a static SemVer and does not infer from tags: %j', (files) => {
    const root = repo(files)
    git(root, 'tag', 'v9.9.9')
    git(root, 'tag', 'v')
    const result = checks(root)
    expect(result.find((check) => check.name === 'version')).toMatchObject({ status: 'fail' })
    expect(result.find((check) => check.name === 'version')?.fix).toContain('--release-version')
    expect(result.find((check) => check.name === 'tag-absent')).toMatchObject({ status: 'warn' })
    expect(result.find((check) => check.name === 'tag-absent')?.message).toMatch(/not run|skipped/i)
    expect(result.find((check) => check.name === 'changelog')?.status).toBe('pass')
  })

  it('reports an existing tag for a discovered Cargo version', () => {
    const root = repo({ 'Cargo.toml': '[package]\nversion = "1.2.3"\n' })
    git(root, 'tag', 'v1.2.3')
    expect(checks(root).find((check) => check.name === 'tag-absent')).toMatchObject({
      status: 'fail',
      message: 'v1.2.3 already exists',
    })
  })

  it('matches a post-cut CHANGELOG section for a discovered Python version', () => {
    const root = repo({
      'pyproject.toml': '[project]\nversion = "1.2.3"\n',
      'CHANGELOG.md': '# Changelog\n\n## [Unreleased]\n\n## [1.2.3]\n- shipped\n',
    })
    expect(checks(root).find((check) => check.name === 'changelog')?.status).toBe('pass')
  })
})

describe('release-preflight CLI', () => {
  it('uses --release-version over conflicting manifests and remains read-only', async () => {
    const root = repo({
      'package.json': '{"version":"1.0.0"}',
      'Cargo.toml': '[package]\nversion = "2.0.0"\n',
    })
    git(root, 'tag', 'v1.0.0')
    const before = snapshot(root)
    const result = await runCli(root, [
      'release-preflight',
      '--release-version',
      '3.0.0-rc.1+build.1',
    ])
    expect(result.code).toBe(0)
    expect(result.stdout).toContain('3.0.0-rc.1+build.1')
    expect(result.stdout).toContain('--release-version')
    expect(snapshot(root)).toEqual(before)
  })

  it('allows an override when all manifests are missing or malformed', async () => {
    const root = repo({ 'pyproject.toml': '[broken' })
    const result = await runCli(root, ['release-preflight', '--release-version', '3.0.0'])
    expect(result.code).toBe(0)
    expect(result.stdout).toContain('v3.0.0 not yet tagged')
  })

  it.each([
    '1.0.0garbage',
    '',
  ])('rejects invalid explicit override %j without fallback', async (version) => {
    const root = repo({ 'package.json': '{"version":"1.2.3"}' })
    const before = snapshot(root)
    const result = await runCli(root, ['release-preflight', '--release-version', version])
    expect(result.code).toBe(1)
    expect(result.stdout).toMatch(/not run|skipped/i)
    expect(snapshot(root)).toEqual(before)
  })

  it('fails when the explicit release version is already tagged', async () => {
    const root = repo()
    git(root, 'tag', 'v3.0.0')
    const result = await runCli(root, ['release-preflight', '--release-version', '3.0.0'])
    expect(result.code).toBe(1)
    expect(result.stdout).toContain('v3.0.0 already exists')
  })

  it('fails without an override on conflicts and keeps all repository bytes unchanged', async () => {
    const root = repo({
      'package.json': '{"version":"1.0.0"}',
      'Cargo.toml': '[package]\nversion = "2.0.0"\n',
    })
    const before = snapshot(root)
    const result = await runCli(root, ['release-preflight'])
    expect(result.code).toBe(1)
    expect(result.stdout).toContain('--release-version')
    expect(snapshot(root)).toEqual(before)
  })

  it('keeps root --version separate from the target release flag', async () => {
    const root = repo()
    const result = await runCli(root, ['--version'])
    expect(result).toEqual({ code: 0, stdout: `${pkg.version}\n`, stderr: '' })
  })
})
