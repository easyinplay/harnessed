#!/usr/bin/env node
// No build/install side effects. Use explicit, already-built artifacts.
// node scripts/benchmark-runtime.mjs --node-cli dist/cli.mjs --binary dist-bin/harnessed.exe [--bun /path/to/bun]
import { spawn, spawnSync } from 'node:child_process'
import {
  lstatSync,
  mkdirSync,
  mkdtempSync,
  realpathSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import { performance } from 'node:perf_hooks'
import { StringDecoder } from 'node:string_decoder'
import { fileURLToPath } from 'node:url'

const owned = new Map()
const DEFAULT_TIMEOUT = 10_000
const DEFAULT_OUTPUT = 1_048_576
const TASK = 'Inspect a local fixture; do not spawn, install, or use the network.'
export const CASES = [
  { id: 'version', args: ['--version'] },
  { id: 'gates', args: ['gates', 'task', '--task', TASK] },
  { id: 'prompt', args: ['prompt', 'task-code', '--task', TASK, '--json'] },
  { id: 'checkpoint-intent', args: ['checkpoint', 'intent', 'task'] },
  { id: 'status-recover', args: ['status', '--recover'] },
]

export function parseOptions(argv) {
  const paths = new Set(['node-cli', 'binary', 'bun', 'node'])
  const budgets = {
    samples: [10, 10, 1000],
    trials: [1, 1, 100],
    'timeout-ms': [DEFAULT_TIMEOUT, 1, 120_000],
    'max-output-bytes': [DEFAULT_OUTPUT, 1, 8_388_608],
  }
  const values = {}
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i]?.replace(/^--/, '')
    const value = argv[i + 1]
    if (
      !argv[i]?.startsWith('--') ||
      (!paths.has(key) && !budgets[key]) ||
      key in values ||
      !value ||
      value.startsWith('--')
    )
      throw new Error(`Invalid argument: ${argv[i]}`)
    values[key] = value
  }
  for (const key of ['node-cli', 'binary'])
    if (!values[key]) throw new Error(`Required: --${key} <path>`)
  for (const [key, [fallback, min, max]] of Object.entries(budgets)) {
    const raw = values[key] ?? String(fallback)
    if (!/^\d+$/.test(raw) || Number(raw) < min || Number(raw) > max)
      throw new Error(`--${key} must be an integer in ${min}..${max}`)
    values[key] = Number(raw)
  }
  values.node ??= process.execPath
  for (const key of paths) {
    if (!values[key]) continue
    values[key] = realpathSync(resolve(values[key]))
    if (!statSync(values[key]).isFile()) throw new Error(`--${key} must be a file`)
  }
  return {
    nodeCli: values['node-cli'],
    binary: values.binary,
    bun: values.bun ?? null,
    node: values.node,
    samples: values.samples,
    trials: values.trials,
    timeoutMs: values['timeout-ms'],
    maxOutputBytes: values['max-output-bytes'],
  }
}

export function percentile(values, percent) {
  if (
    !values.length ||
    values.some((v) => !Number.isFinite(v) || v < 0) ||
    !Number.isFinite(percent) ||
    percent < 0 ||
    percent > 100
  )
    throw new Error('Invalid percentile observations')
  return [...values].sort((a, b) => a - b)[
    Math.max(0, Math.ceil((values.length * percent) / 100) - 1)
  ]
}

export function createFixture(parentEnv = process.env) {
  const base = realpathSync(tmpdir())
  const root = mkdtempSync(join(base, 'harnessed-runtime-'))
  const dirs = {
    home: 'home',
    cwd: 'repo',
    state: 'state',
    codex: 'codex',
    temp: 'tmp',
    config: 'config',
    cache: 'cache',
    appdata: 'appdata',
    localappdata: 'localappdata',
  }
  for (const key of Object.keys(dirs)) {
    dirs[key] = join(root, dirs[key])
    mkdirSync(dirs[key], { recursive: true })
  }
  mkdirSync(join(dirs.home, '.claude'))
  // Stop repo-root walk-up even when the caller's TEMP lives inside a checkout.
  mkdirSync(join(dirs.cwd, '.git'))
  const env = {}
  for (const [key, value] of Object.entries(parentEnv)) {
    if (/^(PATH|PATHEXT|SystemRoot|WINDIR|COMSPEC|SystemDrive)$/i.test(key) && value !== undefined)
      env[key.toUpperCase() === 'PATH' ? 'PATH' : key] = value
  }
  Object.assign(env, {
    HOME: dirs.home,
    USERPROFILE: dirs.home,
    CODEX_HOME: dirs.codex,
    CLAUDE_CONFIG_DIR: join(dirs.home, '.claude'),
    HARNESSED_PLATFORM: 'claude',
    HARNESSED_ROOT_OVERRIDE: dirs.state,
    HARNESSED_SPAWN_CWD: dirs.cwd,
    APPDATA: dirs.appdata,
    LOCALAPPDATA: dirs.localappdata,
    XDG_CONFIG_HOME: dirs.config,
    XDG_CACHE_HOME: dirs.cache,
    XDG_DATA_HOME: join(root, 'data'),
    XDG_STATE_HOME: dirs.state,
    TEMP: dirs.temp,
    TMP: dirs.temp,
    TMPDIR: dirs.temp,
    BUN_INSTALL: join(root, 'bun'),
    BUN_INSTALL_CACHE_DIR: dirs.cache,
    npm_config_cache: dirs.cache,
    npm_config_userconfig: join(root, 'empty.npmrc'),
    npm_config_globalconfig: join(root, 'empty-global.npmrc'),
    npm_config_offline: 'true',
    GIT_CONFIG_NOSYSTEM: '1',
    GIT_CONFIG_GLOBAL: join(root, 'empty.gitconfig'),
    CI: '1',
    NO_COLOR: '1',
    LANG: 'en_US.UTF-8',
    LC_ALL: 'C',
    TZ: 'UTC',
  })
  writeFileSync(join(root, 'empty.npmrc'), '')
  writeFileSync(join(root, 'empty-global.npmrc'), '')
  writeFileSync(join(root, 'empty.gitconfig'), '')
  const fixture = { root, ...dirs, env }
  owned.set(fixture, { root, base, canonical: realpathSync(root) })
  return fixture
}

export function cleanupFixture(fixture) {
  const record = owned.get(fixture)
  if (!record || fixture.root !== record.root)
    throw new Error('Refusing cleanup of unowned fixture')
  const rel = relative(record.base, record.root)
  if (
    !rel ||
    isAbsolute(rel) ||
    rel.startsWith(`..${sep}`) ||
    dirname(record.root) !== record.base ||
    !basename(record.root).startsWith('harnessed-runtime-') ||
    lstatSync(record.root).isSymbolicLink() ||
    realpathSync(record.root) !== record.canonical
  )
    throw new Error('Unsafe owned fixture path')
  rmSync(record.root, { recursive: true, force: false })
  owned.delete(fixture)
}

function utf8Prefix(text, maxBytes) {
  const encoded = Buffer.from(text, 'utf8')
  if (encoded.length <= maxBytes) return text
  // Input is already decoded; omit an incomplete trailing character, not .end()
  // which would insert another replacement character beyond the byte budget.
  return new StringDecoder('utf8').write(encoded.subarray(0, maxBytes))
}

export function runCommand(executable, args, fixture, options = {}) {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT
  const maxOutputBytes = options.maxOutputBytes ?? DEFAULT_OUTPUT
  if (
    !Number.isInteger(timeoutMs) ||
    timeoutMs < 1 ||
    timeoutMs > 120_000 ||
    !Number.isInteger(maxOutputBytes) ||
    maxOutputBytes < 1 ||
    maxOutputBytes > 8_388_608
  )
    throw new Error('Invalid subprocess budget')
  return new Promise((done) => {
    const started = performance.now()
    let timedOut = false
    let outputLimitExceeded = false
    let bytes = 0
    let error = null
    const stdout = [],
      stderr = []
    const child = spawn(executable, args, {
      cwd: fixture.cwd,
      env: fixture.env,
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true,
      detached: process.platform !== 'win32',
      shell: false,
    })
    let stopped = false
    const stop = () => {
      if (stopped) return
      stopped = true
      if (child.pid && process.platform === 'win32') {
        const systemRoot = fixture.env.SystemRoot ?? fixture.env.SYSTEMROOT ?? 'C:\\Windows'
        const killed = spawnSync(
          join(systemRoot, 'System32', 'taskkill.exe'),
          ['/pid', String(child.pid), '/T', '/F'],
          { windowsHide: true, timeout: 2000, stdio: 'ignore' },
        )
        if (killed.error || killed.status !== 0) {
          error = `killTree failed: ${killed.error?.message ?? `exit ${killed.status}, signal ${killed.signal}`}`
        }
      } else if (child.pid) {
        try {
          process.kill(-child.pid, 'SIGKILL')
        } catch {
          child.kill('SIGKILL')
        }
      }
      child.kill('SIGKILL')
    }
    const timer = setTimeout(() => {
      timedOut = true
      stop()
    }, timeoutMs)
    const capture = (chunks) => (chunk) => {
      const remaining = Math.max(0, maxOutputBytes - bytes)
      chunks.push(chunk.subarray(0, remaining))
      bytes += chunk.length
      if (bytes > maxOutputBytes) {
        outputLimitExceeded = true
        stop()
      }
    }
    child.stdout.on('data', capture(stdout))
    child.stderr.on('data', capture(stderr))
    child.stdin.on('error', () => {})
    child.stdin.end(options.stdin ?? '')
    child.on('error', (e) => {
      error = e.message
    })
    child.on('close', (exitCode, signal) => {
      clearTimeout(timer)
      const decodedOut = Buffer.concat(stdout).toString('utf8')
      const decodedErr = Buffer.concat(stderr).toString('utf8')
      // Raw capture and decoded UTF-8 text share the same numeric cap. Invalid
      // bytes can expand to U+FFFD; allocate the returned-text budget stdout first.
      if (Buffer.byteLength(decodedOut) + Buffer.byteLength(decodedErr) > maxOutputBytes)
        outputLimitExceeded = true
      const out = utf8Prefix(decodedOut, maxOutputBytes)
      const err = utf8Prefix(decodedErr, maxOutputBytes - Buffer.byteLength(out))
      done({
        durationMs: performance.now() - started,
        exitCode,
        signal,
        timedOut,
        outputLimitExceeded,
        error,
        stdout: out,
        stderr: err,
        rawOutputBytes: bytes,
        returnedOutputBytes: Buffer.byteLength(out) + Buffer.byteLength(err),
        rssBytes: null,
        rssStatus: 'unsupported',
      })
    })
  })
}

export function succeeded(result) {
  return result.exitCode === 0 && !result.error && !result.timedOut && !result.outputLimitExceeded
}

export function channelsFor(options) {
  const packageRoot = dirname(dirname(options.nodeCli))
  return [
    {
      id: 'node-npm',
      executable: options.node,
      prefix: [options.nodeCli],
      artifact: options.nodeCli,
      packageRoot,
    },
    { id: 'bun-compiled', executable: options.binary, prefix: [], artifact: options.binary },
    ...(options.bun
      ? [
          {
            id: 'bun-explicit',
            executable: options.bun,
            prefix: [options.nodeCli],
            artifact: options.nodeCli,
            packageRoot,
          },
        ]
      : []),
  ]
}

export async function benchmarkChannel(channel, options, trial) {
  const fixture = createFixture()
  try {
    const run = (args) =>
      runCommand(channel.executable, [...channel.prefix, ...args], fixture, options)
    const firstInvocation = await run(['--version'])
    const commands = []
    for (const entry of CASES) {
      const warmup = await run(entry.args)
      const samples = []
      for (let i = 0; i < options.samples; i++) samples.push(await run(entry.args))
      const exitCodes = {}
      for (const sample of samples) {
        const key = String(sample.exitCode)
        exitCodes[key] = (exitCodes[key] ?? 0) + 1
      }
      const successful = samples.filter(succeeded).map((s) => s.durationMs)
      commands.push({
        ...entry,
        warmup,
        samples,
        exitCodes,
        successfulSamples: successful.length,
        p50Ms: successful.length ? percentile(successful, 50) : null,
        p95Ms: successful.length ? percentile(successful, 95) : null,
      })
    }
    return {
      channel: channel.id,
      trial,
      invocation: { executable: channel.executable, prefix: channel.prefix },
      artifact: {
        path: channel.artifact,
        sizeBytes: statSync(channel.artifact).size,
        scope: 'entry-file-only; excludes dependencies/assets/external runtime',
      },
      fixture: {
        root: fixture.root,
        home: fixture.home,
        state: fixture.state,
        cwd: fixture.cwd,
        cleanup: 'finally',
      },
      firstInvocation,
      commands,
      ok:
        succeeded(firstInvocation) &&
        commands.every((c) => succeeded(c.warmup) && c.samples.every(succeeded)),
    }
  } finally {
    cleanupFixture(fixture)
  }
}

export async function benchmark(options) {
  const results = []
  for (let trial = 1; trial <= options.trials; trial++) {
    // Rotate channel order to reduce fixed-order drift; runs remain serial.
    const channels = channelsFor(options)
    const offset = (trial - 1) % channels.length
    for (const channel of [...channels.slice(offset), ...channels.slice(0, offset)])
      results.push(await benchmarkChannel(channel, options, trial))
  }
  return {
    schemaVersion: 1,
    kind: 'runtime-benchmark',
    timestamp: new Date().toISOString(),
    platform: process.platform,
    arch: process.arch,
    driverNode: process.version,
    options,
    methodology: {
      firstInvocation:
        'fresh state/HOME; --version includes compiled asset bootstrap, not OS-cold cache',
      steady: 'fresh subprocess each sample; shared trial state; one warmup per command',
      percentiles: 'nearest-rank, successful samples only; inspect exitCodes and ok',
      network: 'selected local-only commands; no OS network sandbox',
      rssBytes: null,
      rssStatus: 'unsupported',
    },
    results,
    ok: results.every((r) => r.ok),
  }
}

export async function runMain(kind, operation) {
  try {
    if (process.argv.includes('--help')) {
      console.log(
        `Usage: node scripts/${kind}.mjs --node-cli <built dist/cli.mjs> --binary <compiled binary> [--node <node executable>] [--bun <bun executable>] [--samples 10] [--trials 1] [--timeout-ms 10000] [--max-output-bytes 1048576]\nPaths are explicit files. JSON goes to stdout; no build, download or global installation. Smoke only installs owned local hooks. RSS is unsupported.`,
      )
      return
    }
    const report = await operation(parseOptions(process.argv.slice(2)))
    console.log(JSON.stringify(report, null, 2))
    process.exitCode = report.ok ? 0 : 1
  } catch (error) {
    console.log(JSON.stringify({ schemaVersion: 1, kind, ok: false, error: error.message }))
    process.exitCode = 1
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  await runMain('benchmark-runtime', benchmark)
