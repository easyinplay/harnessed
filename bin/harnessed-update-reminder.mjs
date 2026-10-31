#!/usr/bin/env node
// biome-ignore-all format: esbuild-generated (hook drift gate owns this file)
// biome-ignore-all lint: esbuild-generated
// biome-ignore-all assist/source/organizeImports: esbuild-generated
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) =>
  function __init() {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])((fn = 0))), res
  }

// package.json
var package_default
var init_package = __esm({
  'package.json'() {
    package_default = {
      name: 'harnessed',
      version: '5.0.7',
      description: 'AI coding harness package manager + composition orchestrator',
      type: 'module',
      license: 'Apache-2.0',
      author: 'easyinplay',
      repository: {
        type: 'git',
        url: 'https://github.com/easyinplay/harnessed.git',
      },
      homepage: 'https://github.com/easyinplay/harnessed#readme',
      bugs: 'https://github.com/easyinplay/harnessed/issues',
      keywords: [
        'claude-code',
        'ai-harness',
        'package-manager',
        'composition',
        'skill-pack',
        'mcp',
        'orchestrator',
      ],
      engines: {
        node: '>=22.0.0',
      },
      packageManager: 'pnpm@10.12.0',
      bin: {
        harnessed: './dist/cli.mjs',
        'harnessed-inject-state': './bin/harnessed-inject-state.mjs',
      },
      main: './dist/index.mjs',
      types: './dist/index.d.ts',
      exports: {
        '.': {
          types: './dist/index.d.ts',
          import: './dist/index.mjs',
          default: './dist/index.mjs',
        },
        './schemas': {
          types: './dist/schemas/index.d.ts',
          import: './dist/schemas/index.mjs',
        },
        './package.json': './package.json',
      },
      files: [
        'dist',
        'bin',
        'manifests',
        'messages',
        'workflows',
        'routing',
        'config-templates',
        'schemas',
        'CHANGELOG.md',
        'README.md',
        'README-en.md',
        'README-zh.md',
        'LICENSE',
        'NOTICE',
        'THIRD-PARTY-NOTICES.md',
      ],
      scripts: {
        dev: 'tsup --watch',
        build: 'tsc --noEmit && tsup && node ./scripts/build-hooks.mjs',
        prepack: 'npm run build',
        'build:hooks': 'node ./scripts/build-hooks.mjs',
        'build:schema': 'node ./scripts/build-schema.mjs',
        'validate:schema': 'node ./scripts/validate-schema.mjs',
        typecheck: 'tsc --noEmit',
        test: 'vitest run --passWithNoTests',
        'test:watch': 'vitest',
        'test:coverage': 'vitest run --coverage --passWithNoTests',
        'test:codex-live': 'node ./scripts/codex-live/run.mjs',
        bench: 'vitest bench --run',
        'bench:runtime': 'node scripts/benchmark-runtime.mjs',
        'test:runtime-channels': 'node scripts/runtime-channel-smoke.mjs',
        'test:docs': 'node --test tests/docs/install-channels.contract.mjs',
        lint: 'biome check .',
        'lint:fix': 'biome check --write .',
        format: 'biome format --write .',
        'build:binary': 'bun scripts/build-binary.mjs',
      },
      dependencies: {
        '@anthropic-ai/claude-agent-sdk': '0.3.142',
        '@clack/prompts': '^0.10.1',
        '@sinclair/typebox': '^0.34.49',
        ajv: '^8.20.0',
        'ajv-errors': '^3.0.0',
        'ajv-formats': '^3.0.1',
        commander: '^13.0.0',
        diff: '^9.0.0',
        'expr-eval': '^2.0.2',
        picocolors: '^1.1.1',
        'proper-lockfile': '^4.1.2',
        'smol-toml': '^1.9.1',
        undici: '^8.12.1',
        yaml: '^2.9.0',
      },
      devDependencies: {
        '@biomejs/biome': '^2.0.0',
        '@types/node': '^22.10.0',
        '@types/proper-lockfile': '^4.1.4',
        '@vitest/coverage-v8': '^4.0.0',
        esbuild: '0.27.7',
        tsup: '^8.3.0',
        typescript: '^5.6.0',
        vitest: '^4.0.0',
      },
      pnpm: {
        onlyBuiltDependencies: ['esbuild'],
      },
    }
  },
})

// src/cli/lib/updateReminderCache.ts
import fs from 'node:fs'
function isReminderVersion(value) {
  return (
    typeof value === 'string' &&
    value.length <= 128 &&
    /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(value)
  )
}
function parseCache(text, identity, now) {
  const cache = JSON.parse(text)
  if (!cache || cache.schemaVersion !== 1 || !cache.identity) return null
  const keys = ['host', 'runtime', 'channel', 'source', 'fingerprint']
  if (identity.host !== 'claude' && identity.host !== 'codex') return null
  for (const key of keys) {
    const value = cache.identity[key]
    if (
      typeof value !== 'string' ||
      !value.length ||
      value.length > 512 ||
      value !== identity[key]
    ) {
      return null
    }
  }
  const { installed, latest, state, checkedAt, retryAfter } = cache
  if (
    !isReminderVersion(installed) ||
    typeof checkedAt !== 'number' ||
    !Number.isSafeInteger(checkedAt) ||
    checkedAt < 0 ||
    checkedAt > now ||
    typeof retryAfter !== 'number' ||
    !Number.isSafeInteger(retryAfter) ||
    retryAfter < 0
  )
    return null
  if (state === 'unknown') {
    if (latest !== null || retryAfter !== checkedAt + REMINDER_RETRY_MS) return null
  } else if (
    !['behind', 'current', 'ahead'].includes(state ?? '') ||
    !isReminderVersion(latest) ||
    retryAfter !== 0
  )
    return null
  return {
    schemaVersion: 1,
    identity: { ...identity },
    installed,
    latest: latest ?? null,
    state,
    checkedAt,
    retryAfter,
  }
}
function readReminderCache(cachePath, identity, now = Date.now()) {
  let descriptor
  try {
    descriptor = fs.openSync(cachePath, fs.constants.O_RDONLY | fs.constants.O_NONBLOCK)
    const stat = fs.fstatSync(descriptor)
    if (!stat.isFile() || stat.size > REMINDER_MAX_BYTES) return null
    const buffer = Buffer.alloc(REMINDER_MAX_BYTES + 1)
    const bytes = fs.readSync(descriptor, buffer, 0, buffer.length, 0)
    if (bytes > REMINDER_MAX_BYTES || bytes < stat.size) return null
    return parseCache(buffer.toString('utf8', 0, bytes), identity, now)
  } catch {
    return null
  } finally {
    if (descriptor !== void 0) {
      try {
        fs.closeSync(descriptor)
      } catch {}
    }
  }
}
function shouldRefreshReminder(cache, now) {
  if (!cache) return true
  if (cache.retryAfter > now) return false
  return cache.state === 'unknown' || now - cache.checkedAt >= REMINDER_TTL_MS
}
function isReminderWorkerActive(cachePath, now) {
  try {
    const lock = fs.statSync(`${cachePath}.lock`)
    return now - lock.mtimeMs < REMINDER_LOCK_STALE_MS
  } catch {
    return false
  }
}
var REMINDER_TTL_MS, REMINDER_RETRY_MS, REMINDER_MAX_BYTES, REMINDER_LOCK_STALE_MS
var init_updateReminderCache = __esm({
  'src/cli/lib/updateReminderCache.ts'() {
    'use strict'
    REMINDER_TTL_MS = 24 * 60 * 60 * 1e3
    REMINDER_RETRY_MS = 60 * 60 * 1e3
    REMINDER_MAX_BYTES = 16 * 1024
    REMINDER_LOCK_STALE_MS = 3e4
  },
})

// src/compile/updateReminderEntrypoint.ts
init_package()
import { createHash } from 'node:crypto'
import { closeSync, constants, fstatSync, openSync, readSync, statSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, isAbsolute, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// src/cli/updateReminderHookMain.ts
init_updateReminderCache()
import childProcess from 'node:child_process'
async function runUpdateReminderHook(options) {
  try {
    if (!options.enabled) return 0
    const now = (options.now ?? Date.now)()
    const cache = readReminderCache(options.cachePath, options.identity, now)
    if (cache?.state === 'behind') {
      try {
        const write =
          options.write ??
          ((text) => {
            process.stdout.write(text)
          })
        write(
          `Harnessed update available: ${cache.installed} -> ${cache.latest}. Run /harnessed-update.
`,
        )
      } catch {}
    }
    if (shouldRefreshReminder(cache, now) && !isReminderWorkerActive(options.cachePath, now)) {
      const spawn = options.spawn ?? childProcess.spawn
      const child = spawn(options.worker.executable, options.worker.args, {
        detached: true,
        stdio: 'ignore',
        windowsHide: true,
        shell: false,
      })
      child.once('error', () => {})
      child.unref()
    }
  } catch {}
  return 0
}

// src/compile/updateReminderEntrypoint.ts
var UPDATE_REMINDER_OPERATION = 'update-reminder'
var UPDATE_REMINDER_WORKER_OPERATION = 'update-reminder-worker'
var UPDATE_REMINDER_PREFERENCES_FILE = 'update-reminder-preferences.json'
var BINARY_SOURCE = 'https://api.github.com/repos/easyinplay/harnessed/releases/latest'
function resolveUpdateReminderRuntime(options = {}) {
  const args = [...(options.args ?? process.argv.slice(2))]
  if (args[0] === UPDATE_REMINDER_OPERATION || args[0] === UPDATE_REMINDER_WORKER_OPERATION)
    args.shift()
  let host = 'claude'
  let explicitStateRoot
  let platformSpecified = false
  for (let index = 0; index < args.length; index += 2) {
    const flag = args[index]
    const value = args[index + 1]
    if (
      !flag ||
      value === void 0 ||
      [flag, value].some((argument) =>
        Array.from(argument).some((character) => character < ' ' || character === '\x7F'),
      )
    )
      return null
    if (flag === '--platform') {
      if (platformSpecified || (value !== 'claude' && value !== 'codex')) return null
      platformSpecified = true
      host = value
    } else if (flag === '--state-root') {
      if (explicitStateRoot !== void 0 || !isAbsolute(value)) return null
      explicitStateRoot = resolve(value)
    } else return null
  }
  const nativeHome = resolve(
    (host === 'codex' ? process.env.CODEX_HOME?.trim() : process.env.CLAUDE_CONFIG_DIR) ||
      join(homedir(), host === 'codex' ? '.codex' : '.claude'),
  )
  const stateRoot =
    explicitStateRoot ??
    resolve(process.env.HARNESSED_ROOT_OVERRIDE || join(nativeHome, 'harnessed'))
  const channel = options.compiled ? 'binary' : process.versions.bun ? 'bun' : 'npm'
  const source = channel === 'binary' ? BINARY_SOURCE : `${channel}:harnessed`
  const fingerprint = createHash('sha256')
    .update(
      JSON.stringify([
        host === 'codex' ? stateRoot : nativeHome,
        process.execPath,
        package_default.version,
        source,
      ]),
    )
    .digest('hex')
  return {
    stateRoot,
    nativeHome,
    cachePath: join(stateRoot, `update-reminder-${host}.json`),
    preferencesPath: join(stateRoot, UPDATE_REMINDER_PREFERENCES_FILE),
    installed: package_default.version,
    identity: {
      host,
      runtime: options.compiled ? 'binary' : process.versions.bun ? 'bun' : 'node',
      channel,
      source,
      fingerprint,
    },
    worker: {
      executable: process.execPath,
      args: [
        options.compiled
          ? UPDATE_REMINDER_WORKER_OPERATION
          : join(dirname(fileURLToPath(import.meta.url)), 'harnessed-update-reminder-worker.mjs'),
        '--platform',
        host,
        ...(explicitStateRoot ? ['--state-root', explicitStateRoot] : []),
      ],
    },
  }
}
function reminderEnabled(path) {
  let descriptor
  try {
    descriptor = openSync(path, constants.O_RDONLY | constants.O_NONBLOCK)
    const info = fstatSync(descriptor)
    if (!info.isFile() || info.size > 1024) return false
    const buffer = Buffer.alloc(1025)
    const bytes = readSync(descriptor, buffer, 0, buffer.length, 0)
    if (bytes > 1024 || bytes < info.size) return false
    const value = JSON.parse(buffer.toString('utf8', 0, bytes))
    return (
      typeof value === 'object' &&
      value !== null &&
      'schemaVersion' in value &&
      value.schemaVersion === 1 &&
      'enabled' in value &&
      value.enabled === true
    )
  } catch (error) {
    return error.code === 'ENOENT'
  } finally {
    if (descriptor !== void 0) {
      try {
        closeSync(descriptor)
      } catch {}
    }
  }
}
async function runUpdateReminderEntrypoint(options = {}) {
  try {
    const runtime = resolveUpdateReminderRuntime(options)
    if (!runtime || !reminderEnabled(runtime.preferencesPath)) return 0
    if (!statSync(runtime.stateRoot).isDirectory()) return 0
    return await runUpdateReminderHook({ ...runtime, enabled: true })
  } catch {}
  return 0
}

// bin/harnessed-update-reminder.mjs.entry.ts
await runUpdateReminderEntrypoint()
