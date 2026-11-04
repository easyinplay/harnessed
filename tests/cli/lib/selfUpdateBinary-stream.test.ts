// 2026-11-03 — the compiled-binary self-update path on a SLOW link.
//
// Measured on the maintainer's Windows host: the release asset
// `harnessed-windows-x64.exe` is 103,795,200 bytes and the link carried it at
// ~157 KB/s (660 s with curl). Two defects fell out of that:
//
//   1. the metadata hop had a 10 s timeout and every failure mode printed the
//      SAME "could not reach GitHub releases" line — so a slow link was
//      reported as a network/proxy problem;
//   2. the asset was buffered whole (`res.arrayBuffer()`) before the temp file
//      was written: ~99 MB resident in RAM, nothing on disk, nothing printed
//      for ~11 minutes. The header timeout never covered the BODY, so a
//      stalled transfer hung forever.
//
// These tests pin the stage-specific metadata errors and the streamed,
// stall-guarded download.

import { mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  assetNameFor,
  type ReleaseResolveFailure,
  realSelfUpdateDeps,
  resolveLatestRelease,
  runBinarySelfUpdate,
  type SelfUpdateDeps,
  type SelfUpdateNetDeps,
} from '../../../src/cli/lib/selfUpdateBinary.js'
import { captureHostInstallContext } from '../../../src/platform/hostInstallContext.js'

const HOST_ASSET = assetNameFor(process.platform, process.arch)
const API = 'https://api.github.com/repos/easyinplay/harnessed/releases/assets'
const BROWSER = 'https://github.com/easyinplay/harnessed/releases/download/v9.9.9'

/** A Response stand-in with a real web ReadableStream body (the shape
 *  `Readable.fromWeb` needs). */
function fakeResponse(init: {
  body?: ReadableStream<Uint8Array> | null
  ok?: boolean
  status?: number
  json?: () => Promise<unknown>
  text?: () => Promise<string>
}): Response {
  return {
    ok: init.ok ?? true,
    status: init.status ?? 200,
    body: init.body ?? null,
    json: init.json ?? (async () => ({})),
    text: init.text ?? (async () => ''),
  } as unknown as Response
}

/** A body that emits `chunks` and then ends. */
function streamOf(chunks: Uint8Array[]): ReadableStream<Uint8Array> {
  let i = 0
  return new ReadableStream<Uint8Array>({
    pull(controller) {
      const next = chunks[i++]
      if (next) controller.enqueue(next)
      else controller.close()
    },
  })
}

/** A body that delivers `first` and then goes silent forever — the shape of
 *  a link that dies mid-transfer. */
function stallingStream(first: Uint8Array): ReadableStream<Uint8Array> {
  let sent = false
  return new ReadableStream<Uint8Array>({
    pull(controller) {
      if (!sent) {
        sent = true
        controller.enqueue(first)
        return
      }
      return new Promise<void>(() => {})
    },
  })
}

const enc = (s: string) => new TextEncoder().encode(s)

/** A release payload exposing both url forms, as api.github.com returns it. */
function releaseBody(tag = 'v9.9.9', asset = HOST_ASSET) {
  return {
    tag_name: tag,
    assets: [
      { name: asset, url: `${API}/1`, browser_download_url: `${BROWSER}/${asset}` },
      {
        name: `${asset}.sha256`,
        url: `${API}/2`,
        browser_download_url: `${BROWSER}/${asset}.sha256`,
      },
    ],
  }
}

/** Engine-level world: a fake binary plus a resolveRelease seam. */
function engineDeps(resolveRelease: SelfUpdateDeps['resolveRelease']): SelfUpdateDeps {
  const dir = mkdtempSync(join(tmpdir(), 'selfupd-stage-'))
  const execPath = join(dir, HOST_ASSET)
  writeFileSync(execPath, 'OLD-BINARY')
  return {
    execPath,
    platform: 'linux',
    arch: 'x64',
    currentVersion: '5.0.10',
    sourceDir: null,
    resolveRelease,
    downloadTo: async () => {
      throw new Error('network must not be touched')
    },
    fetchShaText: async () => {
      throw new Error('network must not be touched')
    },
    smoke: async () => '5.0.10',
    stateRoot: () => dir,
    log: () => {},
    pid: 4242,
  }
}

const failureOf = (info: unknown): ReleaseResolveFailure => {
  if (info === null || typeof info !== 'object' || !('error' in info)) {
    throw new Error(`expected a release failure, got ${JSON.stringify(info)}`)
  }
  return info as ReleaseResolveFailure
}

describe('metadata hop — the failure modes are told apart', () => {
  it('a failed request names the failed/timed-out request, never the publish window', async () => {
    const info = await resolveLatestRelease('linux', 'x64', {
      fetchImpl: (async () => {
        throw new Error('fetch failed')
      }) as unknown as typeof fetch,
    })
    const failure = failureOf(info)
    expect(failure.error).toMatch(/failed or timed out/i)
    expect(failure.error).toContain('30 s')
    expect(failure.error).not.toMatch(/may still be publishing/i)
  })

  it('a non-OK response carries the status code', async () => {
    const info = await resolveLatestRelease('linux', 'x64', {
      fetchImpl: (async () => fakeResponse({ ok: false, status: 503 })) as unknown as typeof fetch,
    })
    const failure = failureOf(info)
    expect(failure.error).toContain('503')
    expect(failure.error).not.toMatch(/may still be publishing/i)
  })

  it('a malformed body says the response could not be parsed', async () => {
    const info = await resolveLatestRelease('linux', 'x64', {
      fetchImpl: (async () =>
        fakeResponse({
          json: async () => ({ tag_name: 'not-a-version' }),
        })) as unknown as typeof fetch,
    })
    const failure = failureOf(info)
    expect(failure.error).toMatch(/could not be parsed/i)
    expect(failure.error).not.toMatch(/may still be publishing/i)
  })

  it('an unparseable JSON body says the response could not be parsed', async () => {
    const info = await resolveLatestRelease('linux', 'x64', {
      fetchImpl: (async () =>
        fakeResponse({
          json: async () => {
            throw new Error('Unexpected token < in JSON at position 0')
          },
        })) as unknown as typeof fetch,
    })
    expect(failureOf(info).error).toMatch(/could not be parsed/i)
  })

  it('a missing platform asset names the asset and keeps the publish-window hint', async () => {
    const info = await resolveLatestRelease('linux', 'x64', {
      fetchImpl: (async () =>
        fakeResponse({
          json: async () => ({ tag_name: 'v9.9.9', assets: [] }),
        })) as unknown as typeof fetch,
    })
    const failure = failureOf(info)
    expect(failure.error).toContain('harnessed-linux-x64')
    expect(failure.kind).toBe('publishing')
  })
})

describe('engine — the metadata failure message keeps the escapes and drops the misleading hint', () => {
  it('a timed-out/failed hop: no "may still be publishing", both escapes named', async () => {
    const deps = engineDeps(async () => ({
      error:
        'the request to the GitHub releases API failed or timed out (30 s timeout budget): fetch failed',
      kind: 'network',
    }))
    const r = await runBinarySelfUpdate(deps, {})
    expect(r.status).toBe('error')
    if (r.status !== 'error') return
    expect(r.message).not.toMatch(/may still be publishing/i)
    expect(r.message).toContain('npm i -g harnessed@latest')
    expect(r.message).toContain('HARNESSED_UPDATE_SOURCE_DIR')
    expect(r.message).toMatch(/timed out/i)
  })

  it('a non-OK hop: the status code reaches the user', async () => {
    const deps = engineDeps(async () => ({
      error: 'the GitHub releases API returned HTTP 503',
      kind: 'http',
    }))
    const r = await runBinarySelfUpdate(deps, {})
    expect(r.status).toBe('error')
    if (r.status !== 'error') return
    expect(r.message).toContain('503')
    expect(r.message).not.toMatch(/may still be publishing/i)
  })

  it('a missing asset: the publish-window hint stays, the asset is named', async () => {
    const deps = engineDeps(async () => ({
      error: 'asset harnessed-linux-x64 not found on release v9.9.9',
      kind: 'publishing',
    }))
    const r = await runBinarySelfUpdate(deps, {})
    expect(r.status).toBe('error')
    if (r.status !== 'error') return
    expect(r.message).toContain('harnessed-linux-x64')
    expect(r.message).toMatch(/may still be publishing/i)
  })
})

describe('asset download — streamed to disk', () => {
  const net = (fetchImpl: unknown, extra?: Partial<SelfUpdateNetDeps>): SelfUpdateNetDeps => ({
    fetchImpl: fetchImpl as typeof fetch,
    sleep: async () => {},
    ...extra,
  })

  it('the destination file holds exactly the streamed bytes', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'selfupd-dl-'))
    const dest = join(dir, 'asset.bin')
    const context = captureHostInstallContext({ hostId: 'claude' })
    const deps = realSelfUpdateDeps(
      context,
      net(async () => fakeResponse({ body: streamOf([enc('PART-ONE-'), enc('PART-TWO')]) })),
    )
    await deps.downloadTo('https://gh/asset', dest)
    expect(readFileSync(dest).toString('utf8')).toBe('PART-ONE-PART-TWO')
  })

  it('a fallback URL replaces the primary attempt instead of appending to it', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'selfupd-fb-'))
    const dest = join(dir, 'asset.bin')
    const context = captureHostInstallContext({ hostId: 'claude' })
    const deps = realSelfUpdateDeps(
      context,
      net(async (url: string) => {
        if (url === 'https://gh/primary') return fakeResponse({ ok: false, status: 404 })
        return fakeResponse({ body: streamOf([enc('FALLBACK-BYTES')]) })
      }),
    )
    await deps.downloadTo('https://gh/primary', dest, 'https://gh/fallback')
    expect(readFileSync(dest).toString('utf8')).toBe('FALLBACK-BYTES')
  })

  it('a stalled transfer fails fast with the byte/rate evidence and keeps the resume point', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'selfupd-stall-'))
    const execPath = join(dir, HOST_ASSET)
    writeFileSync(execPath, 'OLD-BINARY')
    const context = captureHostInstallContext({ hostId: 'claude' })
    const deps = realSelfUpdateDeps(
      context,
      net(
        async (url: string) => {
          if (url.includes('releases/latest')) {
            return fakeResponse({ json: async () => releaseBody() })
          }
          return fakeResponse({ body: stallingStream(enc('PARTIAL')) })
        },
        { stallTimeoutMs: 50 },
      ),
    )
    deps.execPath = execPath
    deps.pid = 4242
    deps.currentVersion = '5.0.10'

    const r = await runBinarySelfUpdate(deps, {})
    expect(r.status).toBe('error')
    if (r.status !== 'error') return
    // bytes received + elapsed + average rate — a slow link must read as a
    // slow link, not as "broken".
    expect(r.message).toMatch(/stalled/i)
    expect(r.message).toMatch(/\d+ bytes received in [\d.]+ s/)
    expect(r.message).toMatch(/[\d.]+ KB\/s average/)
    expect(r.message).toMatch(/original binary was left untouched/)
    expect(r.message).toContain('npm i -g harnessed@latest')
    expect(r.message).toContain('HARNESSED_UPDATE_SOURCE_DIR')
    // The partial download STAYS on disk as the resume point (R4/R5): the
    // next attempt continues it instead of downloading the whole asset
    // again. The old binary is untouched.
    expect(readdirSync(dir).sort()).toEqual([`.harnessed-update-9.9.9.part`, HOST_ASSET].sort())
    expect(readFileSync(execPath, 'utf8')).toBe('OLD-BINARY')
  })

  it('the injected-deps path stays silent — no progress noise in unit tests', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'selfupd-quiet-'))
    const execPath = join(dir, HOST_ASSET)
    writeFileSync(execPath, 'OLD-BINARY')
    const logs: string[] = []
    const deps: SelfUpdateDeps = {
      ...engineDeps(async () => ({
        version: '9.9.9',
        assetUrl: 'https://gh/asset',
        shaUrl: 'https://gh/asset.sha256',
      })),
      execPath,
      currentVersion: '5.0.10',
      log: (l) => logs.push(l),
      downloadTo: async (_url, dest) => {
        writeFileSync(dest, 'NEW-BINARY')
      },
      fetchShaText: async () => {
        throw new Error('sha fetch is not part of this assertion')
      },
    }
    const r = await runBinarySelfUpdate(deps, {})
    expect(r.status).toBe('error')
    expect(logs).toEqual([])
  })

  it('the real implementation prints a short progress line while the asset streams', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'selfupd-progress-'))
    const dest = join(dir, 'asset.bin')
    const context = captureHostInstallContext({ hostId: 'claude' })
    const deps = realSelfUpdateDeps(
      context,
      net(async () => fakeResponse({ body: streamOf([enc('PROGRESS-BYTES')]) }), {
        progressIntervalMs: 0,
      }),
    )
    const lines: string[] = []
    const warn = console.warn
    console.warn = (l: string) => lines.push(String(l))
    try {
      await deps.downloadTo('https://gh/asset', dest)
    } finally {
      console.warn = warn
    }
    expect(lines.some((l) => /downloading .*KB\/s/.test(l))).toBe(true)
    expect(readFileSync(dest).toString('utf8')).toBe('PROGRESS-BYTES')
  })
})
