export interface RuntimeOptions {
  nodeCli: string
  binary: string
  node: string
  bun: string | null
  samples: number
  trials: number
  timeoutMs: number
  maxOutputBytes: number
}

export interface RuntimeChannel {
  id: 'node-npm' | 'bun-compiled' | 'bun-explicit'
  executable: string
  prefix: string[]
  artifact: string
  packageRoot?: string
}

export interface RuntimeFixture {
  root: string
  home: string
  cwd: string
  state: string
  codex: string
  temp: string
  config: string
  cache: string
  appdata: string
  localappdata: string
  env: NodeJS.ProcessEnv
}

export interface CommandResult {
  durationMs: number
  exitCode: number | null
  signal: NodeJS.Signals | null
  timedOut: boolean
  /** True when raw capture or decoded UTF-8 text exceeded the shared byte cap. */
  outputLimitExceeded: boolean
  error: string | null
  stdout: string
  stderr: string
  /** Observed bytes across original stdout/stderr chunks, including dropped bytes. */
  rawOutputBytes: number
  /** UTF-8 encoded length of returned stdout + stderr, at most maxOutputBytes. */
  returnedOutputBytes: number
  rssBytes: null
  rssStatus: 'unsupported'
}

export interface CommandSamples {
  id: string
  args: string[]
  warmup: CommandResult
  samples: CommandResult[]
  exitCodes: Record<string, number>
  successfulSamples: number
  p50Ms: number | null
  p95Ms: number | null
}

export interface BenchmarkChannelResult {
  channel: RuntimeChannel['id']
  trial: number
  invocation: { executable: string; prefix: string[] }
  artifact: { path: string; sizeBytes: number; scope: string }
  fixture: { root: string; home: string; state: string; cwd: string; cleanup: string }
  firstInvocation: CommandResult
  commands: CommandSamples[]
  ok: boolean
}

export interface BenchmarkReport {
  schemaVersion: number
  kind: string
  timestamp: string
  platform: NodeJS.Platform
  arch: string
  driverNode: string
  options: RuntimeOptions
  methodology: {
    firstInvocation: string
    steady: string
    percentiles: string
    network: string
    rssBytes: null
    rssStatus: 'unsupported'
  }
  results: BenchmarkChannelResult[]
  ok: boolean
}

export const CASES: Array<{ id: string; args: string[] }>
export function parseOptions(argv: string[]): RuntimeOptions
export function percentile(values: number[], percent: number): number
export function createFixture(parentEnv?: NodeJS.ProcessEnv): RuntimeFixture
export function cleanupFixture(fixture: Pick<RuntimeFixture, 'root'>): void
export function runCommand(
  executable: string,
  args: string[],
  fixture: RuntimeFixture,
  options?: Partial<Pick<RuntimeOptions, 'timeoutMs' | 'maxOutputBytes'>> & { stdin?: string },
): Promise<CommandResult>
export function succeeded(result: CommandResult): boolean
export function channelsFor(options: RuntimeOptions): RuntimeChannel[]
export function benchmarkChannel(
  channel: RuntimeChannel,
  options: RuntimeOptions,
  trial: number,
): Promise<BenchmarkChannelResult>
export function benchmark(options: RuntimeOptions): Promise<BenchmarkReport>
export function runMain(
  kind: string,
  operation: (options: RuntimeOptions) => Promise<{ ok: boolean }>,
): Promise<void>
