import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { delimiter, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { parse as parseYaml } from 'yaml'

interface PackageJson {
  files: string[]
  scripts: Record<string, string | undefined>
}

interface PackResult {
  filename: string
  files: { path: string }[]
}
interface WorkflowStep {
  name?: string
  if?: string
  run?: string
  uses?: string
  env?: Record<string, unknown>
}

interface WorkflowJob {
  if?: string
  steps: WorkflowStep[]
}

interface PublishWorkflow {
  jobs: Record<string, WorkflowJob>
}

const root = fileURLToPath(new URL('../..', import.meta.url))
const packageJson = JSON.parse(
  readFileSync(new URL('../../package.json', import.meta.url), 'utf8'),
) as PackageJson
const publishWorkflow = parseYaml(
  readFileSync(new URL('../../.github/workflows/publish.yml', import.meta.url), 'utf8'),
) as PublishWorkflow

function resolveNpmCli(): string {
  const nodeDir = dirname(process.execPath)
  const pathDirs = (process.env.PATH ?? '').split(delimiter).filter(Boolean)
  const npmCli =
    (process.env.npm_execpath?.endsWith('npm-cli.js') ? process.env.npm_execpath : undefined) ??
    [
      join(nodeDir, 'node_modules', 'npm', 'bin', 'npm-cli.js'),
      join(nodeDir, '..', 'lib', 'node_modules', 'npm', 'bin', 'npm-cli.js'),
      ...pathDirs.flatMap((pathDir) => [
        join(pathDir, 'node_modules', 'npm', 'bin', 'npm-cli.js'),
        join(pathDir, '..', 'lib', 'node_modules', 'npm', 'bin', 'npm-cli.js'),
      ]),
    ].find(existsSync)
  if (!npmCli) throw new Error('npm-cli.js not found for package contract')
  return npmCli
}

function npmPack(cwd: string, args: string[]): PackResult {
  const output = execFileSync(process.execPath, [resolveNpmCli(), 'pack', '--json', ...args], {
    cwd,
    encoding: 'utf8',
    windowsHide: true,
  })
  const [packed] = JSON.parse(output) as PackResult[]
  if (!packed) throw new Error('npm pack returned no package result')
  return packed
}

describe('npm publish contract', () => {
  it('validates the checked-out package version before release side effects', () => {
    const publish = publishWorkflow.jobs.publish
    if (!publish) throw new Error('missing publish workflow job')

    const checkoutIndex = publish.steps.findIndex((step) =>
      step.uses?.startsWith('actions/checkout@'),
    )
    const resolveCommitIndex = publish.steps.findIndex(
      (step) => step.name === 'Resolve immutable release commit',
    )
    const validationIndex = publish.steps.findIndex(
      (step) => step.name === 'Validate checked-out package version',
    )
    const resolveCommit = publish.steps[resolveCommitIndex]
    const validation = publish.steps[validationIndex]
    const sideEffectIndexes = publish.steps
      .map((step, index) => ({ index, run: step.run ?? '', name: step.name ?? '' }))
      .filter(
        ({ run, name }) =>
          run.includes('pnpm install') ||
          run.includes('pnpm build') ||
          run.includes('npm publish') ||
          run.includes('npm dist-tag add') ||
          name === 'GitHub release',
      )
      .map(({ index }) => index)

    expect(checkoutIndex).toBeGreaterThanOrEqual(0)
    expect(resolveCommit).toMatchObject({
      name: 'Resolve immutable release commit',
      run: `printf 'commit_sha=%s\\n' "$(git rev-parse HEAD)" >> "$GITHUB_OUTPUT"`,
    })
    expect(validation).toMatchObject({
      name: 'Validate checked-out package version',
      env: { TAG_VERSION: `\${{ steps.release.outputs.package_version }}` },
    })
    expect(validation?.if).toBeUndefined()
    expect(validation?.run).toContain(
      `PACKAGE_VERSION=$(node -p "require('./package.json').version")`,
    )
    expect(validation?.run).toContain('if [ "$PACKAGE_VERSION" != "$TAG_VERSION" ]; then')
    expect(validation?.run).toContain('exit 1')
    expect(checkoutIndex).toBeLessThan(resolveCommitIndex)
    expect(resolveCommitIndex).toBeLessThan(validationIndex)
    expect(sideEffectIndexes.every((index) => index > validationIndex)).toBe(true)
  })

  it('keeps dist-tag-fix limited to the validated exact package version', () => {
    const publish = publishWorkflow.jobs.publish
    const binaries = publishWorkflow.jobs.binaries
    if (!publish || !binaries) throw new Error('missing publish workflow jobs')

    const distTag = publish.steps.find((step) => step.run?.includes('npm dist-tag add'))
    const skippedRuns = publish.steps.filter((step) =>
      ['pnpm install', 'pnpm build', 'npm publish'].some((command) => step.run?.includes(command)),
    )
    const release = publish.steps.find((step) => step.name === 'GitHub release')

    expect(distTag?.if).toBeUndefined()
    expect(distTag).toMatchObject({
      run: 'npm dist-tag add "harnessed@$PACKAGE_VERSION" latest',
      env: { PACKAGE_VERSION: `\${{ steps.release.outputs.package_version }}` },
    })
    expect(skippedRuns.every((step) => step.if === "inputs.mode != 'dist-tag-fix'")).toBe(true)
    expect(release?.if).toBe("inputs.mode != 'dist-tag-fix'")
    expect(binaries.if).toBe("inputs.mode != 'dist-tag-fix'")
  })

  it('declares the release assets and build lifecycle', () => {
    expect(packageJson.files).toContain('CHANGELOG.md')
    expect(packageJson.files.some((path) => path === 'skills' || path.startsWith('skills/'))).toBe(
      false,
    )
    expect(packageJson.scripts.prepack).toContain('npm run build')
  })

  it('packs CHANGELOG.md without the skills tree', () => {
    const packed = npmPack(root, ['--dry-run', '--ignore-scripts'])
    const paths = packed.files.map((file) => file.path)

    expect(paths).toContain('CHANGELOG.md')
    expect(paths.some((path) => path === 'skills' || path.startsWith('skills/'))).toBe(false)
  })

  it('runs prepack before packing generated dist files', () => {
    const fixtureRoot = mkdtempSync(join(tmpdir(), 'harnessed-prepack-'))
    const packDir = join(fixtureRoot, 'packed')
    try {
      mkdirSync(packDir)
      writeFileSync(
        join(fixtureRoot, 'package.json'),
        JSON.stringify({
          name: 'harnessed-prepack-fixture',
          version: '1.0.0',
          files: ['dist'],
          scripts: { prepack: 'node build.mjs' },
        }),
      )
      writeFileSync(
        join(fixtureRoot, 'build.mjs'),
        "import { mkdirSync, writeFileSync } from 'node:fs'; mkdirSync('dist', { recursive: true }); writeFileSync('dist/generated.txt', 'built by prepack');\n",
      )

      expect(existsSync(join(fixtureRoot, 'dist'))).toBe(false)
      const packed = npmPack(fixtureRoot, ['--pack-destination', packDir, '--ignore-scripts=false'])

      expect(readFileSync(join(fixtureRoot, 'dist/generated.txt'), 'utf8')).toBe('built by prepack')
      expect(packed.files.map((file) => file.path)).toContain('dist/generated.txt')
      expect(existsSync(join(packDir, packed.filename))).toBe(true)
    } finally {
      rmSync(fixtureRoot, { recursive: true, force: true })
    }
  })
})
