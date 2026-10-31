import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { cp, mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve, sep } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { parse, stringify } from 'yaml'
import { refreshOwnedUpdate } from '../../src/cli/lib/refreshOwnedUpdate.js'
import { readHashLedger, recordSkillHashes } from '../../src/cli/lib/skillIntegrity.js'
import { setLocale } from '../../src/i18n/index.js'
import { runInstall } from '../../src/installers/index.js'
import { captureHostInstallContext } from '../../src/platform/hostInstallContext.js'
import { claudeDescriptor, codexDescriptor, type HostId } from '../../src/platform/platform.js'

const fixture = vi.hoisted(() => ({ assets: '', deniedPath: '' }))
vi.mock('../../src/platform/assetsRoot.js', () => ({ getAssetsRoot: () => fixture.assets }))
vi.mock('../../src/installers/index.js', () => ({ runInstall: vi.fn() }))
vi.mock('node:fs/promises', async (original) => {
  const actual = await original<typeof import('node:fs/promises')>()
  return {
    ...actual,
    writeFile: vi.fn(async (...args: Parameters<typeof actual.writeFile>) => {
      if (fixture.deniedPath && args[0] === fixture.deniedPath) {
        throw Object.assign(new Error(`EACCES: permission denied, open '${args[0]}'`), {
          code: 'EACCES',
        })
      }
      return actual.writeFile(...args)
    }),
  }
})

let root: string
const skillBody = '<!-- harnessed-generated:v5.0.5 -->\n# Discuss\n'
const bundledDefinition = 'name: discuss\n'

function contextFor(host: HostId, stateRoot?: string) {
  vi.stubEnv('HARNESSED_PLATFORM', host)
  vi.stubEnv('HARNESSED_ROOT_OVERRIDE', stateRoot ?? '')
  return captureHostInstallContext({ hostId: host, userHome: root })
}

function skillsBase(context: ReturnType<typeof contextFor>) {
  return context.hostId === 'codex'
    ? context.platform.skillsDir
    : join(context.nativeHome, 'skills')
}

async function seedPreferences(stateRoot: string, enabled: boolean) {
  await mkdir(stateRoot, { recursive: true })
  const path = join(stateRoot, 'update-reminder-preferences.json')
  await writeFile(path, JSON.stringify({ schemaVersion: 1, enabled }))
  return path
}

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'harnessed-refresh-owned-'))
  fixture.assets = join(root, 'assets')
  fixture.deniedPath = ''
  vi.stubEnv('HOME', root)
  vi.stubEnv('USERPROFILE', root)
  vi.stubEnv('CODEX_HOME', join(root, 'custom codex home'))
  vi.stubEnv('CLAUDE_CONFIG_DIR', join(root, 'custom claude home'))
  vi.stubEnv('HARNESSED_ROOT_OVERRIDE', '')
  setLocale('en')
  vi.mocked(runInstall).mockReset()
  vi.mocked(runInstall).mockResolvedValue({ ok: true, backupId: '', appliedFiles: [] })
  vi.spyOn(console, 'error').mockImplementation(() => {})
  const workflows = join(fixture.assets, 'workflows')
  await mkdir(join(workflows, 'discuss'), { recursive: true })
  await writeFile(join(workflows, 'discuss', 'SKILL.md'), skillBody)
  await writeFile(join(workflows, 'discuss', 'workflow.yaml'), bundledDefinition)
  await writeFile(join(workflows, 'capabilities.yaml'), 'capabilities: {}\n')
  await writeFile(
    join(workflows, 'role-prompts.yaml'),
    [
      'prompts:',
      '  discuss:',
      '    primary_cap: ""',
      '    specialist: Reviewer',
      '    responsibility: Review scope',
      '    checklist: []',
      '    severity: blocker',
      '    description: Discuss scope',
      '',
    ].join('\n'),
  )
  await cp(resolve('workflows/host-primitives.yaml'), join(workflows, 'host-primitives.yaml'))
  await mkdir(join(fixture.assets, 'manifests', 'cc-hooks'), { recursive: true })
  await cp(
    resolve('manifests/cc-hooks/update-reminder.yaml'),
    join(fixture.assets, 'manifests', 'cc-hooks', 'update-reminder.yaml'),
  )
})

afterEach(async () => {
  fixture.deniedPath = ''
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
  setLocale('en')
  if (!resolve(root).startsWith(resolve(tmpdir()) + sep)) throw new Error('unsafe cleanup')
  await rm(root, { recursive: true, force: true })
})

describe('refreshOwnedUpdate reminder opt-out', () => {
  it.each([
    'claude',
    'codex',
  ] as const)('%s honors opt-out under the captured custom native home rather than the descriptor default', async (host) => {
    const context = contextFor(host)
    const preferences = await seedPreferences(context.platform.stateRoot, false)
    const before = await readFile(preferences, 'utf8')
    const descriptor = host === 'codex' ? codexDescriptor(root) : claudeDescriptor(root)
    await seedPreferences(descriptor.stateRoot, true)
    vi.mocked(runInstall).mockResolvedValue({
      ok: true,
      backupId: '',
      appliedFiles: [],
      trustPending: 'fixture requires --trust-codex-hooks',
    })

    const results = await refreshOwnedUpdate(context)

    expect(results).toEqual([
      expect.objectContaining({ id: 'harnessed-workflows', status: 'updated', verified: true }),
    ])
    expect(runInstall).not.toHaveBeenCalled()
    expect(await readFile(preferences, 'utf8')).toBe(before)
    expect(context.nativeHome).toBe(join(root, `custom ${host} home`))
    expect(context.platform.stateRoot).toBe(join(context.nativeHome, 'harnessed'))
  })

  it.each([
    'claude',
    'codex',
  ] as const)('%s ignores an explicit root override and preserves native-home opt-out after environment drift', async (host) => {
    const override = join(root, 'explicit state root')
    const context = contextFor(host, override)
    await seedPreferences(override, true)
    const preferences = await seedPreferences(context.platform.stateRoot, false)
    vi.stubEnv('HARNESSED_ROOT_OVERRIDE', join(root, 'unrelated environment root'))
    vi.stubEnv(
      host === 'codex' ? 'CODEX_HOME' : 'CLAUDE_CONFIG_DIR',
      join(root, 'unrelated native home'),
    )

    const results = await refreshOwnedUpdate(context)

    expect(results).toEqual([
      expect.objectContaining({ id: 'harnessed-workflows', status: 'updated', verified: true }),
    ])
    expect(runInstall).not.toHaveBeenCalled()
    expect(context.platform.stateRoot).toBe(join(context.nativeHome, 'harnessed'))
    expect(context.platform.stateRoot).not.toBe(override)
    expect(JSON.parse(await readFile(preferences, 'utf8'))).toEqual({
      schemaVersion: 1,
      enabled: false,
    })
  })
})

describe('refreshOwnedUpdate workflow closure', () => {
  it.each([
    'claude',
    'codex',
  ] as const)('%s refreshes owned skills and records the rendered ledger', async (host) => {
    const context = contextFor(host)
    const results = await refreshOwnedUpdate(context)
    expect(results).toEqual([
      expect.objectContaining({ id: 'harnessed-workflows', status: 'updated', verified: true }),
      expect.objectContaining({ id: 'update-reminder', status: 'updated', verified: true }),
    ])
    expect(await readFile(join(skillsBase(context), 'discuss', 'SKILL.md'), 'utf8')).toContain(
      '# Discuss',
    )
    if (host === 'codex') {
      expect(context.platform.skillsDir).toBe(join(root, '.agents', 'skills'))
      expect(existsSync(join(context.nativeHome, 'skills', 'discuss'))).toBe(false)
    }
    const ledger = await readHashLedger(join(context.platform.stateRoot, 'skill-hashes.json'))
    expect(ledger?.discuss?.sha256).toMatch(/^[a-f0-9]{64}$/)
    expect(existsSync(join(context.platform.stateRoot, 'backups'))).toBe(false)
    const prompt = join(context.nativeHome, 'prompts', 'discuss.md')
    expect(existsSync(prompt)).toBe(host === 'codex')
    if (host === 'codex') expect(await readFile(prompt, 'utf8')).toContain('Discuss scope')
  })

  it.each([
    'claude',
    'codex',
  ] as const)('%s backs up an edited workflow.yaml even when SKILL.md still matches the ledger', async (host) => {
    const context = contextFor(host)
    const installed = join(skillsBase(context), 'discuss')
    await mkdir(installed, { recursive: true })
    await mkdir(context.platform.stateRoot, { recursive: true })
    await writeFile(join(installed, 'SKILL.md'), skillBody)
    await writeFile(join(installed, 'workflow.yaml'), 'name: user-customized\n')
    await writeFile(join(installed, 'user.txt'), 'keep user extra')
    const ledgerPath = join(context.platform.stateRoot, 'skill-hashes.json')
    await recordSkillHashes(['discuss'], skillsBase(context), ledgerPath)
    const ledgerBefore = await readHashLedger(ledgerPath)
    expect(ledgerBefore?.discuss?.sha256).toBe(createHash('sha256').update(skillBody).digest('hex'))

    const results = await refreshOwnedUpdate(context)

    expect(results[0]).toMatchObject({ status: 'updated', verified: true })
    const backupRoot = join(context.platform.stateRoot, 'backups')
    expect(existsSync(backupRoot)).toBe(true)
    const sessions = await readdir(backupRoot)
    expect(sessions).toHaveLength(1)
    const session = join(backupRoot, sessions[0] ?? '')
    expect(sessions[0]).toMatch(/-update$/)
    expect(await readFile(join(session, 'discuss', 'workflow.yaml'), 'utf8')).toBe(
      'name: user-customized\n',
    )
    expect(await readFile(join(session, 'discuss', 'SKILL.md'), 'utf8')).toBe(skillBody)
    expect(await readFile(join(session, 'discuss', 'user.txt'), 'utf8')).toBe('keep user extra')
    expect(existsSync(join(session, 'README.txt'))).toBe(true)
    expect(await readFile(join(installed, 'workflow.yaml'), 'utf8')).toBe(bundledDefinition)
    expect(await readFile(join(installed, 'user.txt'), 'utf8')).toBe('keep user extra')
    const ledgerAfter = await readHashLedger(ledgerPath)
    expect(ledgerAfter?.discuss?.sha256).toBe(
      createHash('sha256')
        .update(await readFile(join(installed, 'SKILL.md')))
        .digest('hex'),
    )
  })

  it('fails closed when a Codex prompt write receives EACCES', async () => {
    const context = contextFor('codex')
    const workflows = join(fixture.assets, 'workflows')
    await cp(join(workflows, 'discuss'), join(workflows, 'research'), { recursive: true })
    const promptsPath = join(workflows, 'role-prompts.yaml')
    const prompts = parse(await readFile(promptsPath, 'utf8'))
    prompts.prompts.research = { ...prompts.prompts.discuss }
    await writeFile(promptsPath, stringify(prompts))
    fixture.deniedPath = join(context.nativeHome, 'prompts', 'research.md')

    const results = await refreshOwnedUpdate(context)

    expect(results).toEqual([
      expect.objectContaining({
        id: 'harnessed-workflows',
        status: 'failed',
        verified: false,
        reasonCode: 'owned-refresh-failed',
      }),
    ])
    expect(existsSync(fixture.deniedPath)).toBe(false)
    expect(existsSync(join(context.nativeHome, 'prompts', 'discuss.md'))).toBe(true)
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('EACCES'))
    expect(runInstall).not.toHaveBeenCalled()
  })

  it('does not overwrite the installed workflow if its backup fails', async () => {
    const context = contextFor('claude')
    const installed = join(skillsBase(context), 'discuss')
    await mkdir(installed, { recursive: true })
    await mkdir(context.platform.stateRoot, { recursive: true })
    await writeFile(join(installed, 'SKILL.md'), skillBody)
    await writeFile(join(installed, 'workflow.yaml'), 'name: user-customized\n')
    const ledgerPath = join(context.platform.stateRoot, 'skill-hashes.json')
    await recordSkillHashes(['discuss'], skillsBase(context), ledgerPath)
    const ledgerBefore = await readFile(ledgerPath, 'utf8')
    await writeFile(join(context.platform.stateRoot, 'backups'), 'block directory creation')

    const results = await refreshOwnedUpdate(context)

    expect(results[0]).toMatchObject({ status: 'failed', verified: false })
    expect(await readFile(join(installed, 'workflow.yaml'), 'utf8')).toBe('name: user-customized\n')
    expect(await readFile(join(installed, 'SKILL.md'), 'utf8')).toBe(skillBody)
    expect(await readFile(ledgerPath, 'utf8')).toBe(ledgerBefore)
    expect(runInstall).not.toHaveBeenCalled()
  })

  it('preserves a user-authored Codex prompt without failing the workflow refresh', async () => {
    const context = contextFor('codex')
    const prompt = join(context.nativeHome, 'prompts', 'discuss.md')
    await mkdir(join(context.nativeHome, 'prompts'), { recursive: true })
    await writeFile(prompt, 'user-authored prompt\n')

    const results = await refreshOwnedUpdate(context)

    expect(results).toEqual([
      expect.objectContaining({ id: 'harnessed-workflows', status: 'updated', verified: true }),
      expect.objectContaining({ id: 'update-reminder', status: 'updated', verified: true }),
    ])
    expect(await readFile(prompt, 'utf8')).toBe('user-authored prompt\n')
    expect(console.error).not.toHaveBeenCalled()
  })

  it('allows verify-eval-review to omit its optional role prompt without claiming a prompt write', async () => {
    const context = contextFor('codex')
    const workflows = join(fixture.assets, 'workflows')
    await cp(join(workflows, 'discuss'), join(workflows, 'verify-eval-review'), {
      recursive: true,
    })

    const results = await refreshOwnedUpdate(context)

    expect(results).toEqual([
      expect.objectContaining({ id: 'harnessed-workflows', status: 'updated', verified: true }),
      expect.objectContaining({ id: 'update-reminder', status: 'updated', verified: true }),
    ])
    expect(existsSync(join(context.nativeHome, 'prompts', 'verify-eval-review.md'))).toBe(false)
    expect(existsSync(join(context.nativeHome, 'prompts', 'discuss.md'))).toBe(true)
    expect(console.error).not.toHaveBeenCalled()
  })

  it('fails closed when a Codex prompt cannot render host primitives', async () => {
    const context = contextFor('codex')
    const promptsPath = join(fixture.assets, 'workflows', 'role-prompts.yaml')
    const prompts = parse(await readFile(promptsPath, 'utf8'))
    prompts.prompts.discuss.description = '{{ host.not-a-real-primitive }}'
    await writeFile(promptsPath, stringify(prompts))

    const results = await refreshOwnedUpdate(context)

    expect(results).toEqual([
      expect.objectContaining({
        id: 'harnessed-workflows',
        status: 'failed',
        verified: false,
        reasonCode: 'owned-refresh-failed',
      }),
    ])
    expect(existsSync(join(context.nativeHome, 'prompts', 'discuss.md'))).toBe(false)
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('host-primitive render failed'),
    )
    expect(runInstall).not.toHaveBeenCalled()
  })
})
