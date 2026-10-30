import { spawn } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { dirname, isAbsolute, posix, win32 } from 'node:path'
import type { SupportedLocale } from '../../i18n/index.js'
import {
  type AcquireUpdateLockOptions,
  type UpdateLockHandle,
  withUpdateLock,
} from './updateLock.js'
import type { UpdateMode } from './updateResult.js'

export const UPDATE_CONTINUATION_PROTOCOL_VERSION = 1 as const
const UPDATE_CONTINUATION_PROTOCOL = 'harnessed-update-continuation' as const
const MAX_CONTINUATION_BYTES = 8 * 1024

export interface UpdateContinuation {
  protocol: typeof UPDATE_CONTINUATION_PROTOCOL
  protocolVersion: typeof UPDATE_CONTINUATION_PROTOCOL_VERSION
  nonce: string
  targetKey: string
  channel: 'compiled' | 'package'
  mode: UpdateMode
  host: 'claude' | 'codex' | null
  lang?: SupportedLocale
  runtime: 'node' | 'bun' | 'compiled'
  scope: 'self' | 'all'
  nonInteractive: boolean
  json: boolean
  createdAt: number
}

export type UpdateContinuationInput = Omit<UpdateContinuation, 'protocol' | 'protocolVersion'>

export interface ContinuationRunOptions {
  cwd: string
  env: NodeJS.ProcessEnv
  shell: false
  windowsHide: true
  timeoutMs: number
  signal?: AbortSignal
}

export interface ContinuationRunResult {
  exitCode: number | null
  signal: NodeJS.Signals | null
}

export interface ContinuationLaunchDeps {
  run?: (
    executablePath: string,
    args: string[],
    options: ContinuationRunOptions,
  ) => Promise<ContinuationRunResult>
}

export interface ContinuationLaunchPlan {
  executablePath: string
  entryPath?: string
  continuation: UpdateContinuation
  env?: NodeJS.ProcessEnv
  timeoutMs?: number
  signal?: AbortSignal
}

export type ContinuationLaunchResult =
  | { status: 'completed'; exitCode: 0 }
  | {
      status: 'failed'
      reason: 'spawn-failed' | 'child-exit' | 'interrupted'
      exitCode: number | null
      signal: NodeJS.Signals | null
      message?: string
    }

export type PhaseOneSelfUpdateResult =
  | { status: 'current'; version: string }
  | { status: 'updated'; from: string; to: string }
  | { status: 'failed'; reason: string }

export interface RunUpdatePhaseOneInput {
  lock: Pick<AcquireUpdateLockOptions, 'stateRoot' | 'target'> &
    Partial<Omit<AcquireUpdateLockOptions, 'stateRoot' | 'target' | 'nonce'>>
  continuation: Omit<UpdateContinuationInput, 'nonce' | 'targetKey' | 'createdAt'>
  updateSelf: () => Promise<PhaseOneSelfUpdateResult>
  launch: (
    continuation: UpdateContinuation,
    lock: UpdateLockHandle,
  ) => Promise<ContinuationLaunchResult>
  finalizeSelfUpdate?: () => Promise<void>
  now?: () => number
  nonce?: string
}

export type RunUpdatePhaseOneResult =
  | {
      status: 'complete'
      selfUpdate: Exclude<PhaseOneSelfUpdateResult, { status: 'failed' }>
      continuation: ContinuationLaunchResult & { status: 'completed' }
    }
  | {
      status: 'partial'
      reason: 'handoff-failed'
      selfUpdate: Exclude<PhaseOneSelfUpdateResult, { status: 'failed' }>
      continuation: ContinuationLaunchResult & { status: 'failed' }
    }
  | {
      status: 'failed'
      reason: 'self-update-failed'
      selfUpdate: Extract<PhaseOneSelfUpdateResult, { status: 'failed' }>
    }
  | { status: 'busy'; targetKey: string; ownerPid: number | null }

const CONTINUATION_KEYS = new Set<keyof UpdateContinuation>([
  'protocol',
  'protocolVersion',
  'nonce',
  'targetKey',
  'channel',
  'mode',
  'host',
  'lang',
  'runtime',
  'scope',
  'nonInteractive',
  'json',
  'createdAt',
])

function isAbsoluteForAnyPlatform(path: string): boolean {
  return isAbsolute(path) || win32.isAbsolute(path) || posix.isAbsolute(path)
}

function assertContinuation(value: unknown): asserts value is UpdateContinuation {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('update continuation must be an object')
  }
  const record = value as Record<string, unknown>
  for (const key of Object.keys(record)) {
    if (!CONTINUATION_KEYS.has(key as keyof UpdateContinuation)) {
      throw new Error(`update continuation contains unknown field: ${key}`)
    }
  }
  if (record.protocol !== UPDATE_CONTINUATION_PROTOCOL) {
    throw new Error('update continuation protocol mismatch')
  }
  if (record.protocolVersion !== UPDATE_CONTINUATION_PROTOCOL_VERSION) {
    throw new Error('update continuation protocol version mismatch')
  }
  if (typeof record.nonce !== 'string' || !/^[A-Za-z0-9_-]{24,128}$/.test(record.nonce)) {
    throw new Error('update continuation nonce is invalid')
  }
  if (
    typeof record.targetKey !== 'string' ||
    record.targetKey.length < 1 ||
    record.targetKey.length > 128
  ) {
    throw new Error('update continuation target key is invalid')
  }
  if (record.channel !== 'compiled' && record.channel !== 'package') {
    throw new Error('update continuation channel is invalid')
  }
  if (!['check', 'dry-run', 'apply'].includes(record.mode as string)) {
    throw new Error('update continuation mode is invalid')
  }
  if (record.host !== null && record.host !== 'claude' && record.host !== 'codex') {
    throw new Error('update continuation host is invalid')
  }
  if (record.lang !== undefined && record.lang !== 'en' && record.lang !== 'zh-Hans') {
    throw new Error('update continuation locale is invalid')
  }
  if (!['node', 'bun', 'compiled'].includes(record.runtime as string)) {
    throw new Error('update continuation runtime is invalid')
  }
  if (record.channel === 'compiled' && record.runtime !== 'compiled') {
    throw new Error('compiled continuation requires the compiled runtime')
  }
  if (record.channel === 'package' && record.runtime === 'compiled') {
    throw new Error('package continuation requires a package runtime')
  }
  if (record.scope !== 'self' && record.scope !== 'all') {
    throw new Error('update continuation scope is invalid')
  }
  if (typeof record.nonInteractive !== 'boolean' || typeof record.json !== 'boolean') {
    throw new Error('update continuation flags are invalid')
  }
  if (!Number.isSafeInteger(record.createdAt) || (record.createdAt as number) < 0) {
    throw new Error('update continuation timestamp is invalid')
  }
}

export function createUpdateContinuation(input: UpdateContinuationInput): UpdateContinuation {
  const continuation: UpdateContinuation = {
    protocol: UPDATE_CONTINUATION_PROTOCOL,
    protocolVersion: UPDATE_CONTINUATION_PROTOCOL_VERSION,
    nonce: input.nonce,
    targetKey: input.targetKey,
    channel: input.channel,
    mode: input.mode,
    host: input.host,
    ...(input.lang === undefined ? {} : { lang: input.lang }),
    runtime: input.runtime,
    scope: input.scope,
    nonInteractive: input.nonInteractive,
    json: input.json,
    createdAt: input.createdAt,
  }
  assertContinuation(continuation)
  return continuation
}

export function encodeUpdateContinuation(continuation: UpdateContinuation): string {
  assertContinuation(continuation)
  return Buffer.from(JSON.stringify(continuation), 'utf8').toString('base64url')
}

export function decodeUpdateContinuation(encoded: string): UpdateContinuation {
  if (!encoded || encoded.length > MAX_CONTINUATION_BYTES * 2) {
    throw new Error('update continuation payload size is invalid')
  }
  let decoded: Buffer
  try {
    decoded = Buffer.from(encoded, 'base64url')
  } catch {
    throw new Error('update continuation payload encoding is invalid')
  }
  if (decoded.byteLength > MAX_CONTINUATION_BYTES) {
    throw new Error('update continuation payload is too large')
  }
  let value: unknown
  try {
    value = JSON.parse(decoded.toString('utf8'))
  } catch {
    throw new Error('update continuation payload is not valid JSON')
  }
  assertContinuation(value)
  return value
}

async function runContinuationProcess(
  executablePath: string,
  args: string[],
  options: ContinuationRunOptions,
): Promise<ContinuationRunResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(executablePath, args, {
      cwd: options.cwd,
      env: options.env,
      shell: false,
      windowsHide: true,
      stdio: 'inherit',
      signal: options.signal,
    })
    const timer = setTimeout(() => child.kill(), options.timeoutMs)
    timer.unref()
    child.once('error', reject)
    child.once('close', (exitCode, signal) => {
      clearTimeout(timer)
      resolve({ exitCode, signal })
    })
  })
}

export async function launchUpdateContinuation(
  plan: ContinuationLaunchPlan,
  deps: ContinuationLaunchDeps = {},
): Promise<ContinuationLaunchResult> {
  const { continuation } = plan
  assertContinuation(continuation)
  if (!isAbsoluteForAnyPlatform(plan.executablePath)) {
    throw new Error('update continuation executable path must be absolute')
  }
  if (continuation.channel === 'package') {
    if (!plan.entryPath || !isAbsoluteForAnyPlatform(plan.entryPath)) {
      throw new Error('package update continuation entry path must be absolute')
    }
  } else if (plan.entryPath) {
    throw new Error('compiled update continuation cannot include a package entry path')
  }

  const args = [
    ...(plan.entryPath ? [plan.entryPath] : []),
    ...(continuation.lang === undefined ? [] : ['--lang', continuation.lang]),
    'update',
    '--update-continuation',
    encodeUpdateContinuation(continuation),
  ]
  const run = deps.run ?? runContinuationProcess
  try {
    const result = await run(plan.executablePath, args, {
      cwd: dirname(plan.entryPath ?? plan.executablePath),
      env: plan.env ?? process.env,
      shell: false,
      windowsHide: true,
      timeoutMs: plan.timeoutMs ?? 15 * 60_000,
      signal: plan.signal,
    })
    if (result.exitCode === 0) return { status: 'completed', exitCode: 0 }
    return {
      status: 'failed',
      reason: result.signal ? 'interrupted' : 'child-exit',
      exitCode: result.exitCode,
      signal: result.signal,
    }
  } catch (error) {
    const interrupted =
      plan.signal?.aborted || (error instanceof Error && error.name === 'AbortError')
    return {
      status: 'failed',
      reason: interrupted ? 'interrupted' : 'spawn-failed',
      exitCode: null,
      signal: null,
      message: error instanceof Error ? error.message : String(error),
    }
  }
}

export async function runUpdatePhaseOne(
  input: RunUpdatePhaseOneInput,
): Promise<RunUpdatePhaseOneResult> {
  const nonce = input.nonce ?? randomContinuationNonce()
  const locked = await withUpdateLock({ ...input.lock, nonce }, async (lock) => {
    const selfUpdate = await input.updateSelf()
    if (selfUpdate.status === 'failed') {
      return { status: 'failed', reason: 'self-update-failed', selfUpdate } as const
    }

    const continuation = createUpdateContinuation({
      ...input.continuation,
      nonce: lock.nonce,
      targetKey: lock.targetKey,
      createdAt: (input.now ?? Date.now)(),
    })
    const handoff = await input.launch(continuation, lock)
    if (selfUpdate.status === 'updated' && input.finalizeSelfUpdate) {
      await input.finalizeSelfUpdate().catch(() => {})
    }
    if (handoff.status === 'failed') {
      return {
        status: 'partial',
        reason: 'handoff-failed',
        selfUpdate,
        continuation: handoff,
      } as const
    }
    return { status: 'complete', selfUpdate, continuation: handoff } as const
  })
  return locked.status === 'busy' ? locked : locked.value
}

function randomContinuationNonce(): string {
  return randomBytes(24).toString('base64url')
}
