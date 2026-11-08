// Version discovery for the update reminder's BINARY channel.
//
// Why a separate module: the repository forbids adding exports to modules that
// tests mock through a `vi.mock` factory (src/cli/lib/version-check.js is
// mocked in tests/cli/update.test.ts), so the probe lives in its own file and
// no existing mock covers it.
//
// Two sources, in this order:
//
//   1. GitHub `releases/latest` — the authoritative source for the binary
//      assets. `harnessed update` downloads the asset from the GitHub release.
//   2. The npm registry (`https://registry.npmjs.org/harnessed/latest`) — the
//      fallback for machines where `api.github.com` is unreachable. Measured
//      on the maintainer's box (2026-11-09): `api.github.com` answered in 1.7 s
//      while `github.com` itself timed out after 20 s, and
//      `registry.npmjs.org` answered in 0.79 s.
//
// The fallback is plain HTTP, NOT `npm view`: a binary-channel machine may not
// have npm installed at all, and `npm view` would follow npm's own registry
// configuration instead of the one we want here.
//
// Window note: `publish.yml` runs `npm publish` BEFORE `gh release create`, so
// for 1-3 minutes the npm version can lead the GitHub release tag. A fallback
// hit on such a version makes the reminder point at a release whose assets do
// not exist yet. That is transient, retryable and self-explaining — and it is
// strictly better than staying silent about a known new version. GitHub stays
// primary because the GitHub release is the authoritative asset source.
//
// Every failure is classified into a CLOSED set of reasons, so a caller can
// record WHY a probe failed without storing free-form text in the cache.
//
// Timeouts: each source gets its own short budget (PROBE_TIMEOUT_MS). The
// detached worker races the whole probe against an 8 s ceiling, so the two
// budgets must stay well below it.

import pkg from '../../../package.json' with { type: 'json' }
import { ensureProxyDispatcher } from './proxyDispatcher.js'
import type { ReminderProbeFailure } from './updateReminderCache.js'

export const PROBE_TIMEOUT_MS = 3000

const GITHUB_LATEST_URL = 'https://api.github.com/repos/easyinplay/harnessed/releases/latest'
const NPM_LATEST_URL = 'https://registry.npmjs.org/harnessed/latest'

const VERSION_PATTERN = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/

/** The minimal shape of a fetch response the probe needs. */
export interface ProbeFetchResponse {
  ok: boolean
  status: number
  headers?: Record<string, string>
  json: () => Promise<unknown>
}

export interface LatestPublishedVersionDeps {
  /** Injectable JSON fetch — the tests never touch the network. */
  fetchJson?: (
    url: string,
    init: { signal: AbortSignal; headers: Record<string, string> },
  ) => Promise<ProbeFetchResponse>
  /** Injectable proxy setup — defaults to the repo's `ensureProxyDispatcher`. */
  ensureProxy?: () => Promise<unknown>
  /** Per-source timeout budget. */
  timeoutMs?: number
  githubUrl?: string
  npmUrl?: string
  /** The worker's outer abort signal (the 8 s race). */
  signal?: AbortSignal
}

export interface ProbeSourceOutcome {
  source: 'github' | 'npm'
  /** The version this source reported, or null when it did not report one. */
  version: string | null
  /** Why this source failed — null when it succeeded. */
  reason: ReminderProbeFailure | null
}

export interface VersionProbeResult {
  /** The newest known version, or null when no source could report one. */
  latest: string | null
  /** Which source reported `latest` — null when none did. */
  source: 'github' | 'npm' | null
  /** Why the probe as a whole failed — null when a version was found. */
  reason: ReminderProbeFailure | null
  /** The GitHub attempt (always made). */
  github: ProbeSourceOutcome
  /** The npm attempt — null when GitHub succeeded and no fallback was needed. */
  npm: ProbeSourceOutcome | null
}

function isVersion(value: unknown): value is string {
  return typeof value === 'string' && VERSION_PATTERN.test(value)
}

async function defaultFetchJson(
  url: string,
  init: { signal: AbortSignal; headers: Record<string, string> },
): Promise<ProbeFetchResponse> {
  const response = await fetch(url, init)
  const headers: Record<string, string> = {}
  response.headers?.forEach((value, key) => {
    headers[key.toLowerCase()] = value
  })
  return {
    ok: response.ok,
    status: response.status,
    headers,
    json: () => response.json(),
  }
}

/** The sentinel that separates "our timeout fired" from any other rejection. */
class ProbeTimeout extends Error {}

async function fetchJsonWithTimeout(
  fetchJson: (
    url: string,
    init: { signal: AbortSignal; headers: Record<string, string> },
  ) => Promise<ProbeFetchResponse>,
  url: string,
  timeoutMs: number,
  signal: AbortSignal | undefined,
): Promise<{ response?: ProbeFetchResponse; timedOut: boolean }> {
  const controller = new AbortController()
  let timedOut = false
  let timer: ReturnType<typeof setTimeout> | undefined
  const onExternalAbort = () => controller.abort()
  if (signal) {
    if (signal.aborted) controller.abort()
    else signal.addEventListener('abort', onExternalAbort, { once: true })
  }
  try {
    const response = await Promise.race([
      fetchJson(url, {
        signal: controller.signal,
        headers: { 'user-agent': `harnessed/${pkg.version}` },
      }),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          timedOut = true
          controller.abort()
          reject(new ProbeTimeout())
        }, timeoutMs)
      }),
    ])
    return { response, timedOut }
  } catch {
    // A timeout is the only rejection we classify separately; every other
    // failure (DNS, TLS, proxy refusal, abort) is "unavailable".
    return { timedOut }
  } finally {
    if (timer) clearTimeout(timer)
    if (signal) signal.removeEventListener('abort', onExternalAbort)
  }
}

/**
 * GitHub signals an exhausted anonymous quota with 403 plus either an
 * exhausted `x-ratelimit-remaining` header or a "rate limit" message body.
 * The distinction matters: a rate-limited probe should back off for an hour
 * instead of being read as "the network is down".
 */
async function isRateLimited(response: ProbeFetchResponse): Promise<boolean> {
  if (response.headers?.['x-ratelimit-remaining'] === '0') return true
  try {
    const body = (await response.json()) as { message?: unknown }
    const message = typeof body?.message === 'string' ? body.message.toLowerCase() : ''
    return message.includes('rate limit')
  } catch {
    return false
  }
}

async function probeGitHub(
  fetchJson: (
    url: string,
    init: { signal: AbortSignal; headers: Record<string, string> },
  ) => Promise<ProbeFetchResponse>,
  url: string,
  timeoutMs: number,
  signal: AbortSignal | undefined,
): Promise<ProbeSourceOutcome> {
  if (signal?.aborted) {
    return { source: 'github', version: null, reason: 'github-unavailable' }
  }
  const { response, timedOut } = await fetchJsonWithTimeout(fetchJson, url, timeoutMs, signal)
  if (!response) {
    return {
      source: 'github',
      version: null,
      reason: timedOut ? 'github-timeout' : 'github-unavailable',
    }
  }
  if (!response.ok) {
    const rateLimited = await isRateLimited(response)
    return {
      source: 'github',
      version: null,
      reason: rateLimited ? 'github-rate-limited' : 'github-unavailable',
    }
  }
  let body: unknown
  try {
    body = await response.json()
  } catch {
    return { source: 'github', version: null, reason: 'invalid-version' }
  }
  const tag = (body as { tag_name?: unknown } | null)?.tag_name
  const version = typeof tag === 'string' ? tag.replace(/^v/, '') : ''
  if (!isVersion(version)) {
    return { source: 'github', version: null, reason: 'invalid-version' }
  }
  return { source: 'github', version, reason: null }
}

async function probeNpm(
  fetchJson: (
    url: string,
    init: { signal: AbortSignal; headers: Record<string, string> },
  ) => Promise<ProbeFetchResponse>,
  url: string,
  timeoutMs: number,
  signal: AbortSignal | undefined,
): Promise<ProbeSourceOutcome> {
  if (signal?.aborted) {
    return { source: 'npm', version: null, reason: 'npm-unavailable' }
  }
  const { response } = await fetchJsonWithTimeout(fetchJson, url, timeoutMs, signal)
  if (!response) {
    return { source: 'npm', version: null, reason: 'npm-unavailable' }
  }
  if (!response.ok) {
    return { source: 'npm', version: null, reason: 'npm-unavailable' }
  }
  let body: unknown
  try {
    body = await response.json()
  } catch {
    return { source: 'npm', version: null, reason: 'invalid-version' }
  }
  const version = (body as { version?: unknown } | null)?.version
  if (!isVersion(version)) {
    return { source: 'npm', version: null, reason: 'invalid-version' }
  }
  return { source: 'npm', version, reason: null }
}

/**
 * The overall diagnosis when every source failed.
 *
 * The GitHub-specific reasons win over the npm one: a rate-limited or timed
 * out GitHub probe explains the outage better than "the fallback also
 * failed", and it is the actionable one (wait out the quota). `npm-unavailable`
 * is reported when the GitHub probe at least reached the server but returned
 * nothing usable, so the npm fallback was the last word.
 */
function pickReason(
  github: ReminderProbeFailure | null,
  npm: ReminderProbeFailure | null,
): ReminderProbeFailure {
  if (github === 'github-rate-limited') return 'github-rate-limited'
  if (github === 'github-timeout') return 'github-timeout'
  if (github === 'github-unavailable') return 'github-unavailable'
  if (npm === 'npm-unavailable') return 'npm-unavailable'
  return 'invalid-version'
}

/**
 * Resolve the newest published harnessed version for the binary channel.
 *
 * GitHub first, npm registry as the fallback. Fail-soft on every edge: the
 * result is `latest: null` plus a classified reason, never a thrown error.
 */
export async function probeLatestPublishedVersion(
  deps: LatestPublishedVersionDeps = {},
): Promise<VersionProbeResult> {
  const fetchJson = deps.fetchJson ?? defaultFetchJson
  const ensureProxy = deps.ensureProxy ?? (() => ensureProxyDispatcher())
  const timeoutMs = deps.timeoutMs ?? PROBE_TIMEOUT_MS
  const githubUrl = deps.githubUrl ?? GITHUB_LATEST_URL
  const npmUrl = deps.npmUrl ?? NPM_LATEST_URL
  const signal = deps.signal

  // The repo's outbound-network discipline: Node ignores HTTP_PROXY unless a
  // dispatcher is installed, so every GitHub call goes through this first.
  // It is idempotent and never throws.
  try {
    await ensureProxy()
  } catch {}

  const github = await probeGitHub(fetchJson, githubUrl, timeoutMs, signal)
  if (github.version !== null) {
    return { latest: github.version, source: 'github', reason: null, github, npm: null }
  }

  // The GitHub source failed — fall back to the npm registry, which is the
  // only source that stays reachable when github.com itself is blocked.
  try {
    await ensureProxy()
  } catch {}
  const npm = await probeNpm(fetchJson, npmUrl, timeoutMs, signal)
  if (npm.version !== null) {
    return { latest: npm.version, source: 'npm', reason: null, github, npm }
  }

  return { latest: null, source: null, reason: pickReason(github.reason, npm.reason), github, npm }
}
