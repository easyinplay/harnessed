// Phase 1.2 unit tests for src/installers/lib/backup.ts.
//
// Covers (ADR 0004 § 3 + ASSUMPTIONS C3):
//   - backupId is ISO timestamp with `:` replaced (Win-safe filename)
//   - mkdir for .harnessed-backup/<id>/ called with recursive:true
//   - per-file readFile + writeFile to mirror path
//   - sha1 computed for each backed-up file
//   - metadata.json written with per-file eol field ('lf' | 'crlf' from
//     content detection)
//   - ENOENT on pure-create (oldText==='') yields sentinel entry, no abort
//   - mkdir / read / write failures yield InstallResult ok:false (no throw)
//
// Mocks: node:fs/promises (no real disk I/O — C6 mitigation).

import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('node:fs/promises', () => ({
  mkdir: vi.fn(),
  readFile: vi.fn(),
  writeFile: vi.fn(),
}))

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { backup } from '../../src/installers/lib/backup.js'
import type {
  DiffPlan,
  InstallContext,
  InstallOpts,
  Manifest,
} from '../../src/installers/lib/types.js'

const mkdirMock = vi.mocked(mkdir)
const readFileMock = vi.mocked(readFile)
const writeFileMock = vi.mocked(writeFile)

const BASE_OPTS: InstallOpts = {
  apply: true,
  dryRun: false,
  system: false,
  nonInteractive: false,
  fullDiff: false,
  color: 'auto',
}

function baseManifest(): Manifest {
  return {
    apiVersion: 'harnessed/v1',
    kind: 'Manifest',
    metadata: {
      name: 'bk-test',
      display_name: 'Backup Test',
      description: 'fixture',
      upstream: {
        source: 'bk-test',
        homepage: 'https://example.com',
        repository: 'https://github.com/example/bk-test.git',
        license: 'MIT',
        notice: 'fixture',
      },
    },
    spec: {
      type: 'cli-npm',
      component_type: 'cli-binary',
      install: {
        method: 'npm-cli',
        cmd: 'npm install -g bk-test',
        npm_version: '^1.0.0',
        idempotent_check: 'which bk-test',
      },
      verify: { cmd: 'bk-test --version', timeout_ms: 5000, expected_exit_code: 0 },
      uninstall: { cmd: 'npm uninstall -g bk-test' },
      upstream_health: {
        stability: 'stable',
        last_check: '2026-05-12',
        last_known_good_version: '1.0.0',
        fallback_action: 'warn',
      },
      signed_by: 'easyinplay',
      platforms: ['linux', 'darwin', 'win32'],
    },
  } as Manifest
}

function ctx(): InstallContext {
  return { manifest: baseManifest(), opts: BASE_OPTS, level: 'L2', cwd: '/tmp/proj' }
}

// Find writeFile call whose first arg matches a pattern.
function writeCallMatching(pattern: RegExp): [string, unknown, ...unknown[]] | undefined {
  return writeFileMock.mock.calls.find((c) => pattern.test(String(c[0]))) as
    | [string, unknown, ...unknown[]]
    | undefined
}

describe('backup', () => {
  beforeEach(() => {
    mkdirMock.mockReset()
    readFileMock.mockReset()
    writeFileMock.mockReset()
    mkdirMock.mockResolvedValue(undefined)
    writeFileMock.mockResolvedValue(undefined)
  })

  it('generates ISO timestamp backupId with `:` replaced for Win safety', async () => {
    const plan: DiffPlan = { files: [] } // empty plan → only metadata.json written
    const r = await backup(plan, ctx())
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.backupId).not.toContain(':')
      expect(r.backupId).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}/)
    }
  })

  it('creates backup dir with recursive mkdir', async () => {
    const plan: DiffPlan = { files: [] }
    await backup(plan, ctx())
    const firstMkdir = mkdirMock.mock.calls[0]
    // v3.0.3: backup root under ~/.claude/harnessed/backups (was ~/.harnessed/backups in v2.0.1).
    expect(String(firstMkdir?.[0])).toMatch(/\.claude[/\\]harnessed[/\\]backups/)
    expect(firstMkdir?.[1]).toEqual({ recursive: true })
  })

  it('v3.0.3 regression — backup root resolves under ~/.claude/harnessed NOT ctx.cwd (EPERM fix when CWD is read-only like Program Files)', async () => {
    const plan: DiffPlan = { files: [] }
    // ctx.cwd intentionally set to a path that should NOT appear in backup dir
    // (sister user repro: CWD = C:\Program Files\Warp\ → EPERM on mkdir)
    const readOnlyCtx: InstallContext = { ...ctx(), cwd: 'C:\\Program Files\\Warp' }
    await backup(plan, readOnlyCtx)
    const firstMkdir = mkdirMock.mock.calls[0]?.[0] as string
    expect(firstMkdir).toBeTruthy()
    expect(firstMkdir).not.toContain('Program Files')
    expect(firstMkdir).not.toContain('C:\\Program')
    // Path should reference ~/.claude/harnessed/backups (v3.0.3 path migration).
    expect(firstMkdir).toMatch(/\.claude[/\\]harnessed[/\\]backups/)
  })

  it('writes metadata.json with installer name + timestamp + files[]', async () => {
    const plan: DiffPlan = { files: [] }
    const r = await backup(plan, ctx())
    expect(r.ok).toBe(true)
    const metaCall = writeCallMatching(/metadata\.json$/)
    expect(metaCall).toBeDefined()
    if (metaCall) {
      const meta = JSON.parse(metaCall[1] as string)
      expect(meta.installer).toBe('bk-test')
      expect(meta.manifest).toBe('bk-test')
      expect(meta.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/)
      expect(Array.isArray(meta.files)).toBe(true)
      expect(meta.files).toEqual([])
    }
  })

  it('detects LF EOL from buffer (per-file eol field)', async () => {
    readFileMock.mockResolvedValueOnce(Buffer.from('line a\nline b\n'))
    const plan: DiffPlan = {
      files: [{ target: '/tmp/proj/.mcp.json', scope: 'PROJECT', oldText: 'x', newText: 'y' }],
    }
    const r = await backup(plan, ctx())
    expect(r.ok).toBe(true)
    const metaCall = writeCallMatching(/metadata\.json$/)
    const meta = JSON.parse(metaCall?.[1] as string)
    expect(meta.files[0].eol).toBe('lf')
  })

  it('detects CRLF EOL from buffer', async () => {
    readFileMock.mockResolvedValueOnce(Buffer.from('line a\r\nline b\r\n'))
    const plan: DiffPlan = {
      files: [{ target: '/tmp/proj/.mcp.json', scope: 'PROJECT', oldText: 'x', newText: 'y' }],
    }
    const r = await backup(plan, ctx())
    expect(r.ok).toBe(true)
    const metaCall = writeCallMatching(/metadata\.json$/)
    const meta = JSON.parse(metaCall?.[1] as string)
    expect(meta.files[0].eol).toBe('crlf')
  })

  it('computes sha1 hex (40 chars) for each backed-up file', async () => {
    readFileMock.mockResolvedValueOnce(Buffer.from('hello'))
    const plan: DiffPlan = {
      files: [{ target: '/tmp/proj/.mcp.json', scope: 'PROJECT', oldText: 'x', newText: 'y' }],
    }
    const r = await backup(plan, ctx())
    expect(r.ok).toBe(true)
    const metaCall = writeCallMatching(/metadata\.json$/)
    const meta = JSON.parse(metaCall?.[1] as string)
    expect(meta.files[0].sha1).toMatch(/^[a-f0-9]{40}$/)
    // sha1('hello') = aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d
    expect(meta.files[0].sha1).toBe('aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d')
  })

  it('records sentinel entry (backup="") on ENOENT for pure-create plans', async () => {
    const enoent = new Error('ENOENT') as NodeJS.ErrnoException
    enoent.code = 'ENOENT'
    readFileMock.mockRejectedValueOnce(enoent)
    const plan: DiffPlan = {
      files: [
        // oldText='' is the pure-create signal
        { target: '/tmp/proj/.mcp.json', scope: 'PROJECT', oldText: '', newText: 'new content' },
      ],
    }
    const r = await backup(plan, ctx())
    expect(r.ok).toBe(true)
    const metaCall = writeCallMatching(/metadata\.json$/)
    const meta = JSON.parse(metaCall?.[1] as string)
    expect(meta.files[0].backup).toBe('')
    expect(meta.files[0].sha1).toBe('')
  })

  it('returns ok=false with backup-mkdir-failed when mkdir throws', async () => {
    mkdirMock.mockRejectedValueOnce(new Error('disk full'))
    const plan: DiffPlan = { files: [] }
    const r = await backup(plan, ctx())
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.error.keyword).toBe('backup-mkdir-failed')
    }
  })

  it('returns ok=false with backup-read-failed for non-ENOENT read errors', async () => {
    readFileMock.mockRejectedValueOnce(new Error('EACCES'))
    const plan: DiffPlan = {
      files: [{ target: '/tmp/proj/.mcp.json', scope: 'PROJECT', oldText: 'x', newText: 'y' }],
    }
    const r = await backup(plan, ctx())
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.error.keyword).toBe('backup-read-failed')
    }
  })

  it('returns ok=false with backup-write-failed when copy write fails', async () => {
    readFileMock.mockResolvedValueOnce(Buffer.from('content'))
    // First mkdir for backup root succeeds; second mkdir (file dir) succeeds;
    // writeFile for the copy fails (next call after metadata is not reached).
    writeFileMock.mockRejectedValueOnce(new Error('disk full'))
    const plan: DiffPlan = {
      files: [{ target: '/tmp/proj/.mcp.json', scope: 'PROJECT', oldText: 'x', newText: 'y' }],
    }
    const r = await backup(plan, ctx())
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.error.keyword).toBe('backup-write-failed')
    }
  })
})
