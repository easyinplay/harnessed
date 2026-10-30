import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { build } from 'esbuild'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

describe('compiled pre-assets platform hint', () => {
  let root: string
  let entry: string
  let marker: string

  beforeEach(async () => {
    root = mkdtempSync(join(tmpdir(), 'harnessed platform entry '))
    entry = join(root, 'entry.mjs')
    marker = join(root, 'cli-started.json')
    await build({
      entryPoints: ['src/compile/entry.ts'],
      outfile: entry,
      bundle: true,
      format: 'esm',
      platform: 'node',
      plugins: [
        {
          name: 'platform-assets-fixture',
          setup(builder) {
            builder.onResolve({ filter: /assets-bundle\.gen\.json$/ }, () => ({
              path: 'bundle',
              namespace: 'platform-fixture',
            }))
            builder.onResolve({ filter: /\/cli\.js$/ }, (args) => {
              if (!args.importer.replaceAll('\\', '/').endsWith('/compile/entry.ts'))
                return undefined
              return { path: args.path, namespace: 'platform-fixture' }
            })
            builder.onLoad({ filter: /.*/, namespace: 'platform-fixture' }, (args) => ({
              loader: 'js',
              contents:
                args.path === 'bundle'
                  ? `export default { schema: 'harnessed.assets-bundle.v1', version: 'fixture', fileCount: 1, files: { 'workflows/probe/SKILL.md': 'cHJvYmU=' } };`
                  : `import { writeFileSync } from 'node:fs'; writeFileSync(${JSON.stringify(marker)}, JSON.stringify({ host: process.env.HARNESSED_PLATFORM, args: process.argv.slice(2) }));`,
            }))
          },
        },
      ],
    })
  })

  afterEach(() => rmSync(root, { recursive: true, force: true }))

  function run(args: string[], ambient = 'claude', stateRoot = '') {
    return spawnSync(process.execPath, [entry, ...args], {
      encoding: 'utf8',
      windowsHide: true,
      env: {
        ...process.env,
        HOME: root,
        USERPROFILE: root,
        HARNESSED_PLATFORM: ambient,
        HARNESSED_ROOT_OVERRIDE: stateRoot,
        HARNESSED_ASSETS_OVERRIDE: '',
        CLAUDE_CODE_SESSION_ID: 'ambient-session',
        CODEX_SESSION_ID: '',
      },
    })
  }

  it.each([
    { ambient: 'claude', host: 'codex', flag: ['--platform', 'codex'] },
    { ambient: 'claude', host: 'codex', flag: ['--platform=codex'] },
    { ambient: 'codex', host: 'claude', flag: ['--platform', 'claude'] },
    { ambient: 'codex', host: 'claude', flag: ['--platform=claude'] },
  ])('unpacks for $host instead of ambient $ambient with $flag', ({ ambient, host, flag }) => {
    const args = ['update', '--json', ...flag]
    const result = run(args, ambient)
    expect(result.status).toBe(0)
    expect(
      readFileSync(
        join(root, `.${host}`, 'harnessed/assets/fixture/workflows/probe/SKILL.md'),
        'utf8',
      ),
    ).toBe('probe')
    expect(existsSync(join(root, `.${ambient}`, 'harnessed/assets'))).toBe(false)
    expect(JSON.parse(readFileSync(marker, 'utf8'))).toEqual({ host, args })
  })

  it.each(['claude', 'codex'])('preserves ambient %s without a platform option', (ambient) => {
    const result = run(['setup'], ambient)
    expect(result.status).toBe(0)
    expect(existsSync(join(root, `.${ambient}`, 'harnessed/assets/fixture/workflows'))).toBe(true)
    expect(JSON.parse(readFileSync(marker, 'utf8')).host).toBe(ambient)
  })

  it('preserves an explicit state root containing spaces', () => {
    const stateRoot = join(root, 'selected state root')
    const result = run(['setup', '--platform=codex'], 'claude', stateRoot)
    expect(result.status).toBe(0)
    expect(existsSync(join(stateRoot, 'assets/fixture/workflows'))).toBe(true)
    expect(existsSync(join(root, '.claude'))).toBe(false)
    expect(existsSync(join(root, '.codex'))).toBe(false)
    expect(JSON.parse(readFileSync(marker, 'utf8')).host).toBe('codex')
  })

  it.each([
    ['--platform'],
    ['--platform='],
    ['--platform', '--json'],
    ['--platform', 'other'],
    ['--platform=CODEX'],
    ['--platform= codex'],
    ['--platform=codex=claude'],
    ['--platform', 'codex', '--platform', 'claude'],
    ['--platform=codex', '--platform=codex'],
    ['--platform=codex', '--platform=other'],
  ])('rejects invalid hints before unpacking: %j', (...flags) => {
    const result = run(['update', '--json', ...flags])
    expect(result.status).toBe(1)
    expect(JSON.parse(result.stdout)).toMatchObject({
      host: null,
      status: 'failed',
      error: { reasonCode: 'asset-preflight-failed' },
    })
    expect(result.stderr).toContain('--platform')
    expect(existsSync(join(root, '.claude'))).toBe(false)
    expect(existsSync(join(root, '.codex'))).toBe(false)
    expect(existsSync(marker)).toBe(false)
  })

  it.each([
    ['setup', '--', '--platform', 'codex'],
    ['setup', '--platform-extra=codex'],
    ['setup', '--plat', 'codex'],
  ])('leaves non-hints unchanged for final CLI validation: %j', (...args) => {
    const result = run(args)
    expect(result.status).toBe(0)
    expect(existsSync(join(root, '.claude/harnessed/assets/fixture/workflows'))).toBe(true)
    expect(JSON.parse(readFileSync(marker, 'utf8'))).toEqual({ host: 'claude', args })
  })

  it.each([
    'update-reminder',
    'update-reminder-worker',
  ])('keeps %s before hint validation and assets', (operation) => {
    const result = run([operation, '--platform', 'other'])
    expect(result.status).toBe(0)
    expect(result.stdout).toBe('')
    expect(result.stderr).toBe('')
    expect(existsSync(join(root, '.claude'))).toBe(false)
    expect(existsSync(join(root, '.codex'))).toBe(false)
    expect(existsSync(marker)).toBe(false)
  })
})
