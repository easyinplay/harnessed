import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

const cli = resolve('dist/cli.mjs')
const roots: string[] = []

afterEach(async () => {
  for (const root of roots.splice(0)) await rm(root, { recursive: true, force: true })
})

describe('legacy migration under HARNESSED_ROOT_OVERRIDE (real CLI --version)', () => {
  it.each([
    ['claude', false],
    ['claude', true],
    ['codex', false],
    ['codex', true],
  ] as const)('leaves native home untouched (%s, native=%s)', async (host, nativePresent) => {
    const root = await mkdtemp(join(tmpdir(), 'legacy-override-cli-'))
    roots.push(root)
    const home = join(root, 'home')
    const override = join(root, 'isolated-state')
    const hostConfDir = join(home, host === 'claude' ? '.claude' : '.codex')
    const nativeKeep = join(hostConfDir, 'harnessed', 'keep')
    await mkdir(join(home, '.harnessed'), { recursive: true })
    await mkdir(hostConfDir, { recursive: true })
    await writeFile(join(home, '.harnessed', 'keep'), 'legacy must stay')
    const legacyMtime = statSync(join(home, '.harnessed', 'keep')).mtimeMs
    let nativeMtime = -1
    if (nativePresent) {
      await mkdir(join(hostConfDir, 'harnessed'), { recursive: true })
      await writeFile(nativeKeep, 'native must stay')
      nativeMtime = statSync(nativeKeep).mtimeMs
    }

    const env = { ...process.env }
    delete env.NODE_OPTIONS
    delete env.CLAUDE_CODE_SESSION_ID
    delete env.CODEX_SESSION_ID
    Object.assign(env, {
      HOME: home,
      USERPROFILE: home,
      HOMEDRIVE: '',
      HOMEPATH: '',
      CLAUDE_CONFIG_DIR: join(home, '.claude'),
      CODEX_HOME: join(home, '.codex'),
      HARNESSED_PLATFORM: host,
      HARNESSED_ROOT_OVERRIDE: override,
      HARNESSED_SPAWN_CWD: home,
    })

    const child = spawnSync(process.execPath, [cli, '--version'], {
      cwd: home,
      env,
      encoding: 'utf8',
      timeout: 30_000,
      windowsHide: true,
    })

    expect(child.status).toBe(0)
    expect(child.stdout.trim()).toMatch(/^\d+\.\d+\.\d+/)
    expect(child.stderr).not.toMatch(/migrated legacy state|legacy-bak|both .* existed/)
    expect(readFileSync(join(home, '.harnessed', 'keep'), 'utf8')).toBe('legacy must stay')
    expect(statSync(join(home, '.harnessed', 'keep')).mtimeMs).toBe(legacyMtime)
    expect(existsSync(join(home, '.harnessed.legacy-bak'))).toBe(false)
    if (nativePresent) {
      expect(readFileSync(nativeKeep, 'utf8')).toBe('native must stay')
      expect(statSync(nativeKeep).mtimeMs).toBe(nativeMtime)
    } else {
      expect(existsSync(join(hostConfDir, 'harnessed'))).toBe(false)
    }
  })
})
