import type {
  CommandResult,
  RuntimeChannel,
  RuntimeFixture,
  RuntimeOptions,
} from './benchmark-runtime.mjs'

export interface HookInvocation {
  executable: string
  args: string[]
}

export interface RuntimeTraps {
  logPath: string
  tools: string
  probes: Array<HookInvocation & { name: string }>
  policy: string
}

export interface SmokeChannelResult {
  channel: RuntimeChannel['id']
  ok: boolean
  error: string | null
  fixture: { root: string; cleanup: string }
  traps: null | {
    blocked: string[]
    policy: string
    probes: Array<CommandResult & { name: string }>
    unexpectedCalls?: string[]
  }
  steps: Array<CommandResult & { label: string; args: string[] }>
  hooks: Array<{
    event: string
    identity: string
    command: string
    invocation: HookInvocation
    result: CommandResult
    retryResults?: CommandResult[]
  }>
}

export function parseOwnedHook(
  command: string,
  identity: string,
  channel: Pick<RuntimeChannel, 'id'> & Partial<Pick<RuntimeChannel, 'packageRoot' | 'executable'>>,
): HookInvocation
export function createRuntimeTraps(
  fixture: RuntimeFixture,
  blocked: string[],
  nodeExecutable?: string,
  bunExecutable?: string | null,
): Promise<RuntimeTraps>
export function smokeChannel(
  channel: RuntimeChannel,
  options: RuntimeOptions,
): Promise<SmokeChannelResult>
export function smoke(options: RuntimeOptions): Promise<{
  schemaVersion: number
  kind: string
  timestamp: string
  platform: NodeJS.Platform
  results: SmokeChannelResult[]
  scope: string
  limitations: string[]
  ok: boolean
}>
