import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { build } from 'esbuild'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import pkg from '../../package.json' with { type: 'json' }

describe('compiled update pre-assets contract', () => {
  let root: string
  let entry: string
  let marker: string

  beforeEach(async () => {
    root = mkdtempSync(join(tmpdir(), 'harnessed-update-entry-'))
    entry = join(root, 'entry.mjs')
    marker = join(root, 'normal-startup')
    await build({
      entryPoints: ['src/compile/entry.ts'],
      outfile: entry,
      bundle: true,
      format: 'esm',
      platform: 'node',
      plugins: [
        {
          name: 'asset-failure',
          setup(builder) {
            builder.onResolve({ filter: /assets-bundle\.gen\.json$/ }, () => ({
              path: 'bundle',
              namespace: 'fixture',
            }))
            builder.onResolve({ filter: /(?:assetsRoot|unpackAssets|\/cli)\.js$/ }, (args) => {
              if (!args.importer.replaceAll('\\', '/').endsWith('/compile/entry.ts'))
                return undefined
              return { path: args.path, namespace: 'fixture' }
            })
            builder.onLoad({ filter: /.*/, namespace: 'fixture' }, () => ({
              loader: 'js',
              contents: `import { writeFileSync } from 'node:fs'; writeFileSync(${JSON.stringify(marker)}, 'entered'); export const compiledAssetsDir = () => { throw new Error('fixture assets denied') }; export const unpackAssets = () => ({}); export default { version: '1.0.0' };`,
            }))
          },
        },
      ],
    })
  })

  afterEach(() => rmSync(root, { recursive: true, force: true }))

  function run(args: string[]) {
    return spawnSync(process.execPath, [entry, ...args], {
      encoding: 'utf8',
      windowsHide: true,
      env: { ...process.env, HOME: root, USERPROFILE: root, HARNESSED_PLATFORM: 'claude' },
    })
  }

  it.each([
    ['update', '--json', '--platform', 'codex'],
    ['--lang', 'en', 'update', '--json', '--platform=codex'],
    ['update', '--update-continuation', 'invalid'],
  ])('asset failure %j emits one failed envelope and exit 1', (...args) => {
    const result = run(args)
    expect(result.status).toBe(1)
    expect(result.stdout.trim().split('\n')).toHaveLength(1)
    expect(JSON.parse(result.stdout)).toMatchObject({
      schemaVersion: 1,
      operation: 'update',
      runtime: 'compiled',
      status: 'failed',
      components: [],
      error: { kind: 'fatal', reasonCode: 'asset-preflight-failed' },
    })
    expect(JSON.parse(result.stdout).host).toBe(
      args.includes('--update-continuation') ? 'claude' : 'codex',
    )
    expect(result.stderr).toContain('fixture assets denied')
  })

  it('internal identity probe skips assets and migrations without writing state', () => {
    mkdirSync(join(root, '.harnessed'))
    writeFileSync(join(root, '.harnessed', 'keep'), 'legacy')
    const before = readdirSync(root, { recursive: true })
    const result = run(['--internal-update-identity'])
    expect(result.status).toBe(0)
    expect(result.stdout).toBe(`${pkg.version}\n`)
    expect(result.stderr).toBe('')
    expect(existsSync(marker)).toBe(false)
    expect(readdirSync(root, { recursive: true })).toEqual(before)
  })
})
