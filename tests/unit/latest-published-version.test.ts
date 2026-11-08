import { describe, expect, it, vi } from 'vitest'
import { probeLatestPublishedVersion } from '../../src/cli/lib/latestPublishedVersion.js'

const NPM_URL = 'https://registry.npmjs.org/harnessed/latest'

const ok = (body: unknown, headers: Record<string, string> = {}) => ({
  ok: true,
  status: 200,
  headers,
  json: async () => body,
})

const httpError = (status: number, headers: Record<string, string> = {}, body?: unknown) => ({
  ok: false,
  status,
  headers,
  json: async () => {
    if (body === undefined) throw new Error('no body')
    return body
  },
})

const noProxy = async () => 'no-proxy-env'

describe('binary channel version probe', () => {
  it('reads the GitHub release and never asks the npm registry', async () => {
    const fetchJson = vi.fn(async (_url: string) => ok({ tag_name: 'v9.9.9' }))
    const result = await probeLatestPublishedVersion({ fetchJson, ensureProxy: noProxy })
    expect(result.latest).toBe('9.9.9')
    expect(result.source).toBe('github')
    expect(result.reason).toBeNull()
    expect(result.npm).toBeNull()
    expect(fetchJson).toHaveBeenCalledTimes(1)
    expect(fetchJson.mock.calls[0]?.[0]).toContain('api.github.com')
  })

  it('falls back to the npm registry when GitHub fails', async () => {
    const fetchJson = vi.fn(async (url: string) =>
      url.includes('api.github.com') ? httpError(500) : ok({ version: '9.9.9' }),
    )
    const result = await probeLatestPublishedVersion({ fetchJson, ensureProxy: noProxy })
    expect(result.latest).toBe('9.9.9')
    expect(result.source).toBe('npm')
    expect(result.reason).toBeNull()
    expect(result.github.reason).toBe('github-unavailable')
    expect(result.npm?.version).toBe('9.9.9')
    expect(fetchJson).toHaveBeenCalledTimes(2)
    expect(fetchJson.mock.calls[1]?.[0]).toBe(NPM_URL)
  })

  it('returns null and a reason when every source fails', async () => {
    const fetchJson = vi.fn(async () => httpError(500))
    const result = await probeLatestPublishedVersion({ fetchJson, ensureProxy: noProxy })
    expect(result.latest).toBeNull()
    expect(result.source).toBeNull()
    expect(result.reason).toBe('github-unavailable')
  })

  it('classifies an exhausted GitHub rate limit', async () => {
    const fetchJson = vi.fn(async (url: string) =>
      url.includes('api.github.com')
        ? httpError(403, { 'x-ratelimit-remaining': '0' })
        : httpError(500),
    )
    const result = await probeLatestPublishedVersion({ fetchJson, ensureProxy: noProxy })
    expect(result.latest).toBeNull()
    expect(result.reason).toBe('github-rate-limited')
    expect(result.github.reason).toBe('github-rate-limited')
  })

  it('classifies a rate limit announced in the response body', async () => {
    const fetchJson = vi.fn(async (url: string) =>
      url.includes('api.github.com')
        ? httpError(403, {}, { message: 'API rate limit exceeded for 1.2.3.4' })
        : httpError(500),
    )
    const result = await probeLatestPublishedVersion({ fetchJson, ensureProxy: noProxy })
    expect(result.reason).toBe('github-rate-limited')
  })

  it('classifies a probe that never answers as a timeout', async () => {
    const fetchJson = vi.fn(async () => new Promise<never>(() => {}))
    const result = await probeLatestPublishedVersion({
      fetchJson,
      ensureProxy: noProxy,
      timeoutMs: 20,
    })
    expect(result.latest).toBeNull()
    expect(result.reason).toBe('github-timeout')
    expect(result.github.reason).toBe('github-timeout')
  })

  it('classifies an answer without a usable version', async () => {
    const fetchJson = vi.fn(async () => ok({ tag_name: 'not-a-version' }))
    const result = await probeLatestPublishedVersion({ fetchJson, ensureProxy: noProxy })
    expect(result.latest).toBeNull()
    expect(result.reason).toBe('invalid-version')
    expect(result.github.reason).toBe('invalid-version')
    expect(result.npm?.reason).toBe('invalid-version')
  })

  it('reports the npm fallback failure when GitHub answered with garbage', async () => {
    const fetchJson = vi.fn(async (url: string) =>
      url.includes('api.github.com') ? ok({ tag_name: 'nope' }) : httpError(503),
    )
    const result = await probeLatestPublishedVersion({ fetchJson, ensureProxy: noProxy })
    expect(result.latest).toBeNull()
    expect(result.reason).toBe('npm-unavailable')
  })

  it('dispatches the proxy before every outbound call', async () => {
    const ensureProxy = vi.fn(async () => 'installed')
    const fetchJson = vi.fn(async (url: string) =>
      url.includes('api.github.com') ? httpError(500) : ok({ version: '1.2.3' }),
    )
    await probeLatestPublishedVersion({ fetchJson, ensureProxy })
    expect(ensureProxy).toHaveBeenCalledTimes(2)
  })

  it('never throws when the proxy setup fails', async () => {
    const ensureProxy = vi.fn(async () => {
      throw new Error('proxy exploded')
    })
    const fetchJson = vi.fn(async () => ok({ tag_name: '1.2.3' }))
    const result = await probeLatestPublishedVersion({ fetchJson, ensureProxy })
    expect(result.latest).toBe('1.2.3')
  })
})
