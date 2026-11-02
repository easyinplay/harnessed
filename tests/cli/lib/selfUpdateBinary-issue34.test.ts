// Issue #34 — self-update download must not depend on `github.com` being
// reachable, and a failed download must say what to do next.
//
// Root cause under test: the metadata hop reads `api.github.com/repos/.../releases/latest`
// while the asset download read `browser_download_url` — a DIFFERENT host
// (`github.com`, different CDN). In a network partition where api.github.com
// answers but github.com:443 times out, the metadata resolves and the asset
// download cannot.
//
// The fix pins the download to the API asset endpoint (`asset.url`, same host as
// the metadata hop, 302 → release-assets.githubusercontent.com) with the
// `browser_download_url` kept as a fallback, resolves the `.sha256.sig` as its
// OWN release asset (it is not `${shaUrl}.sig` once the API form is used),
// retries transient network failures, and reports an actionable message.

import { createHash, sign as edSign, generateKeyPairSync } from 'node:crypto'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  assetNameFor,
  type ReleaseInfo,
  resolveLatestRelease,
  runBinarySelfUpdate,
  type SelfUpdateDeps,
} from '../../../src/cli/lib/selfUpdateBinary.js'

const sha256 = (s: string) => createHash('sha256').update(s).digest('hex')
const TEST_KEYS = generateKeyPairSync('ed25519')
const TEST_PUBKEY_PEM = TEST_KEYS.publicKey.export({ type: 'spki', format: 'pem' }).toString()
const signSha = (shaText: string) =>
  edSign(null, Buffer.from(shaText, 'utf8'), TEST_KEYS.privateKey).toString('base64')

const ASSET = assetNameFor('linux', 'x64')
const API = 'https://api.github.com/repos/easyinplay/harnessed/releases/assets'
const BROWSER = 'https://github.com/easyinplay/harnessed/releases/download/v5.0.8'

/** A release payload with BOTH url forms, exactly as api.github.com returns it. */
function releaseBody() {
  return {
    tag_name: 'v5.0.8',
    assets: [
      { name: ASSET, url: `${API}/1`, browser_download_url: `${BROWSER}/${ASSET}` },
      {
        name: `${ASSET}.sha256`,
        url: `${API}/2`,
        browser_download_url: `${BROWSER}/${ASSET}.sha256`,
      },
      {
        name: `${ASSET}.sha256.sig`,
        url: `${API}/3`,
        browser_download_url: `${BROWSER}/${ASSET}.sha256.sig`,
      },
    ],
  }
}

function jsonResponse(body: unknown): Response {
  return {
    ok: true,
    status: 200,
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as unknown as Response
}

describe('issue #34 — resolveLatestRelease prefers the API asset endpoint', () => {
  it('returns the api.github.com asset url as primary, browser url as fallback', async () => {
    const seen: string[] = []
    const info = await resolveLatestRelease('linux', 'x64', {
      fetchImpl: (async (url: string) => {
        seen.push(url)
        return jsonResponse(releaseBody())
      }) as unknown as typeof fetch,
    })
    expect(info).not.toBeNull()
    if (info === null || 'error' in info) return
    expect(seen[0]).toContain('api.github.com')
    // Primary = api endpoint (same host as the metadata hop).
    expect(info.assetUrl).toBe(`${API}/1`)
    expect(info.shaUrl).toBe(`${API}/2`)
    // Fallback = the browser form, kept for a github.com-reachable network.
    expect(info.assetFallbackUrl).toBe(`${BROWSER}/${ASSET}`)
    expect(info.shaFallbackUrl).toBe(`${BROWSER}/${ASSET}.sha256`)
  })

  it('resolves the .sha256.sig as its OWN asset, not a suffix of the checksum url', async () => {
    const info = await resolveLatestRelease('linux', 'x64', {
      fetchImpl: (async () => jsonResponse(releaseBody())) as unknown as typeof fetch,
    })
    if (info === null || 'error' in info) throw new Error('expected release info')
    expect(info.sigUrl).toBe(`${API}/3`)
    expect(info.sigFallbackUrl).toBe(`${BROWSER}/${ASSET}.sha256.sig`)
    // The bug this pins: the sig is NOT `${shaUrl}.sig` in the API form.
    expect(info.sigUrl).not.toBe(`${info.shaUrl}.sig`)
  })

  it('falls back to the browser url when the release exposes no api asset url', async () => {
    const body = {
      tag_name: 'v5.0.8',
      assets: [
        { name: ASSET, browser_download_url: `${BROWSER}/${ASSET}` },
        { name: `${ASSET}.sha256`, browser_download_url: `${BROWSER}/${ASSET}.sha256` },
      ],
    }
    const info = await resolveLatestRelease('linux', 'x64', {
      fetchImpl: (async () => jsonResponse(body)) as unknown as typeof fetch,
    })
    if (info === null || 'error' in info) throw new Error('expected release info')
    expect(info.assetUrl).toBe(`${BROWSER}/${ASSET}`)
    expect(info.assetFallbackUrl).toBeUndefined()
  })
})

/** Engine-level world: a fake binary + the release info under test. */
function world(release: ReleaseInfo) {
  const dir = mkdtempSync(join(tmpdir(), 'i34-exec-'))
  const execPath = join(dir, ASSET)
  writeFileSync(execPath, 'OLD-BINARY')
  const NEW = 'NEW-BINARY'
  const shaText = `${sha256(NEW)}  ${ASSET}\n`
  const deps: SelfUpdateDeps = {
    execPath,
    platform: 'linux',
    arch: 'x64',
    currentVersion: '5.0.7',
    sourceDir: null,
    resolveRelease: async () => release,
    downloadTo: async (_url, dest) => {
      writeFileSync(dest, NEW)
    },
    fetchShaText: async (url) => (url === release.sigUrl ? signSha(shaText) : shaText),
    smoke: async () => release.version,
    stateRoot: () => mkdtempSync(join(tmpdir(), 'i34-state-')),
    log: () => {},
    pid: 4242,
    publicKeyPem: TEST_PUBKEY_PEM,
  }
  return { dir, execPath, deps, NEW, shaText }
}

describe('issue #34 — the engine passes the fallback url through to the net layer', () => {
  it('downloads the binary from the api endpoint and keeps the browser url as fallback', async () => {
    const w = world({
      version: '5.0.8',
      assetUrl: `${API}/1`,
      shaUrl: `${API}/2`,
      sigUrl: `${API}/3`,
      assetFallbackUrl: `${BROWSER}/${ASSET}`,
      shaFallbackUrl: `${BROWSER}/${ASSET}.sha256`,
      sigFallbackUrl: `${BROWSER}/${ASSET}.sha256.sig`,
    })
    const downloads: { url: string; fallback?: string }[] = []
    const r = await runBinarySelfUpdate(
      {
        ...w.deps,
        downloadTo: async (url, dest, fallback) => {
          downloads.push({ url, fallback })
          writeFileSync(dest, w.NEW)
        },
      },
      {},
    )
    expect(r.status).toBe('updated')
    expect(downloads).toEqual([{ url: `${API}/1`, fallback: `${BROWSER}/${ASSET}` }])
  })

  it('fetches the signature from its own asset url', async () => {
    const w = world({
      version: '5.0.8',
      assetUrl: `${API}/1`,
      shaUrl: `${API}/2`,
      sigUrl: `${API}/3`,
    })
    const fetched: string[] = []
    const r = await runBinarySelfUpdate(
      {
        ...w.deps,
        fetchShaText: async (url) => {
          fetched.push(url)
          return url === `${API}/3` ? signSha(w.shaText) : w.shaText
        },
      },
      {},
    )
    expect(r.status).toBe('updated')
    expect(fetched).toContain(`${API}/3`)
    expect(fetched).not.toContain(`${API}/2.sig`)
  })
})

describe('issue #34 — a failed download says what to do next', () => {
  it('names the release, the tried url, and both escapes', async () => {
    const w = world({ version: '5.0.8', assetUrl: `${API}/1`, shaUrl: `${API}/2` })
    const r = await runBinarySelfUpdate(
      {
        ...w.deps,
        downloadTo: async () => {
          throw new Error('The socket connection was closed unexpectedly.')
        },
      },
      {},
    )
    expect(r.status).toBe('error')
    if (r.status !== 'error') return
    expect(r.message).toContain('5.0.8')
    expect(r.message).toContain(`${API}/1`)
    expect(r.message).toContain('npm i -g harnessed@latest')
    expect(r.message).toContain('HARNESSED_UPDATE_SOURCE_DIR')
  })

  it('the unreachable-release error also names the local-source escape', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'i34-exec-'))
    const execPath = join(dir, ASSET)
    writeFileSync(execPath, 'OLD-BINARY')
    const r = await runBinarySelfUpdate(
      {
        execPath,
        platform: 'linux',
        arch: 'x64',
        currentVersion: '5.0.7',
        sourceDir: null,
        resolveRelease: async () => null,
        downloadTo: async () => {
          throw new Error('network must not be touched')
        },
        fetchShaText: async () => {
          throw new Error('network must not be touched')
        },
        smoke: async () => '5.0.7',
        stateRoot: () => dir,
        log: () => {},
        pid: 1,
      },
      {},
    )
    expect(r.status).toBe('error')
    if (r.status !== 'error') return
    expect(r.message).toContain('npm i -g harnessed@latest')
    expect(r.message).toContain('HARNESSED_UPDATE_SOURCE_DIR')
  })
})
