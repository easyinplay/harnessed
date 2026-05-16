// Phase 1.2 unit tests for src/cli/audit.ts.
//
// Covers (PLAN B4 候选 1 + R2.3):
//   - registers `audit` subcommand on Command
//   - empty manifests/* dirs → exit 0 (no errors)
//   - schema-valid manifest with bad git_ref (HEAD/main/master) → exit 1
//   - schema-valid manifest with placeholder signed_by → exit 0 (warn only)
//
// Mocks: fs/promises (readdir, readFile), validateManifestFile.

import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('node:fs/promises', () => ({ readdir: vi.fn(), readFile: vi.fn() }))
vi.mock('../../src/manifest/validate.js', () => ({ validateManifestFile: vi.fn() }))
// Phase 3.2 W0.1 fix (RESEARCH § 8.3 Path A LOCKED): mock runtime layer helpers
// so manifest-only tests don't accidentally trigger real git/provenance
// subprocesses (Phase 2.4 W4 added these as eager imports in src/cli/audit.ts L17-19).
vi.mock('../../src/cli/lib/audit-helpers.js', () => ({
  auditOriginIntegrity: vi.fn(() => []), // no findings = no exit-1 trigger
  auditInstallCmdIntegrity: vi.fn(() => []),
  auditProvenance: vi.fn(() => []),
}))

import { readdir, readFile } from 'node:fs/promises'
import { Command } from 'commander'
import { registerAudit } from '../../src/cli/audit.js'
import { validateManifestFile } from '../../src/manifest/validate.js'

const readdirMock = vi.mocked(readdir)
const readFileMock = vi.mocked(readFile)
const validateMock = vi.mocked(validateManifestFile)

class ExitError extends Error {
  constructor(public code: number) {
    super(`process.exit(${code})`)
  }
}

async function runCli(argv: string[]): Promise<number> {
  const exit = vi.spyOn(process, 'exit').mockImplementation((code?: number | string | null) => {
    throw new ExitError(typeof code === 'number' ? code : 0)
  })
  const log = vi.spyOn(console, 'log').mockImplementation(() => {})
  const err = vi.spyOn(console, 'error').mockImplementation(() => {})
  const program = new Command().exitOverride()
  registerAudit(program)
  try {
    await program.parseAsync(['node', 'harnessed', ...argv])
    return 0
  } catch (e) {
    if (e instanceof ExitError) return e.code
    throw e
  } finally {
    exit.mockRestore()
    log.mockRestore()
    err.mockRestore()
  }
}

function validManifest(over: Record<string, unknown> = {}) {
  return {
    ok: true,
    manifest: {
      metadata: {
        name: 'foo',
        upstream: { repository: 'https://github.com/example/foo.git' },
      },
      spec: {
        signed_by: 'easyinplay',
        install: { method: 'npm-cli' },
      },
      ...over,
    },
    // biome-ignore lint/suspicious/noExplicitAny: validateManifestFile result narrow
  } as any
}

describe('cli/audit', () => {
  beforeEach(() => {
    readdirMock.mockReset()
    readFileMock.mockReset()
    validateMock.mockReset()
  })

  it('registers `audit` subcommand on the program', () => {
    const program = new Command()
    registerAudit(program)
    const cmd = program.commands.find((c) => c.name() === 'audit')
    expect(cmd).toBeDefined()
  })

  it('empty manifest dirs → exit 0', async () => {
    readdirMock.mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }))
    const code = await runCli(['audit'])
    expect(code).toBe(0)
  })

  it('manifest with valid git_ref → exit 0', async () => {
    // biome-ignore lint/suspicious/noExplicitAny: readdir returns Dirent[] in some overloads
    readdirMock.mockResolvedValue(['ctx7.yaml'] as any)
    readFileMock.mockResolvedValue('apiVersion: harnessed/v1')
    validateMock.mockReturnValue(validManifest())
    const code = await runCli(['audit'])
    expect(code).toBe(0)
  })

  it('manifest with forbidden git_ref (HEAD) → exit 1', async () => {
    // biome-ignore lint/suspicious/noExplicitAny: readdir overload
    readdirMock.mockResolvedValue(['ghost.yaml'] as any)
    readFileMock.mockResolvedValue('apiVersion: harnessed/v1')
    validateMock.mockReturnValue(
      validManifest({
        spec: {
          signed_by: 'easyinplay',
          install: { method: 'git-clone-with-setup', git_ref: 'HEAD' },
        },
      }),
    )
    const code = await runCli(['audit'])
    expect(code).toBe(1)
  })
})
