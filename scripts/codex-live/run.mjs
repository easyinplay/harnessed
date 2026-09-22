#!/usr/bin/env node
// v16.0 Phase 64 T10 — `pnpm test:codex-live`: codex hook plugins against a REAL codex.
// Manual, pre-release (needs the codex CLI; stage B also spends one model turn).
//
// Stage A — isolated CODEX_HOME (no model): the real install path (esbuild-bundled
//   from src/, so no `pnpm build` needed) installs perturn-inject,
//   perturn-inject-invalidate and doc-discipline-gate with --trust-codex-hooks
//   semantics; app-server hooks/list must show all three trusted with the
//   hash-stable literals; each generated command is timed through the host shell
//   (Windows: pwsh as codex runs it, plus explicit `cmd /c`); uninstall must leave
//   no plugin and no hook listed. The temp home is deleted afterwards.
// The check-docs hook runs dist/cli.mjs through the shim: run `pnpm build` first.
//
// Stage B — the user's real ~/.codex (skip with --isolated-only): a
//   `harnessed-probe-live@harnessed-probe-live-mkt` plugin carrying the SAME
//   generated commands (shim → this checkout) runs one real turn; the injected
//   <workflow-state> must come back as a hook `context` entry, and every hook's
//   durationMs is recorded (budget: p95 < 1 s). The probe plugin, its marketplace,
//   its trust entries, the empty cache dir and its data dir are removed at the end
//   — even on failure. The user's other plugins and hooks are never touched; this
//   script never opens ~/.codex/config.toml.
//
// Also prints a fixture-drift notice when the codex MINOR version differs from the
// newest tests/fixtures/codex-hooks/<version>/ capture.

import { spawn, spawnSync } from 'node:child_process'
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { homedir, tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { build } from 'esbuild'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const isWin = process.platform === 'win32'
const isolatedOnly = process.argv.includes('--isolated-only')
const HOOK_MANIFESTS = ['perturn-inject', 'perturn-inject-invalidate', 'doc-discipline-gate']
const results = []
const log = (...a) => console.log('[codex-live]', ...a)
function check(name, ok, detail = '') {
  results.push({ name, ok })
  log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`)
}

// ── helpers ──────────────────────────────────────────────────────────────────

function codex(args, env) {
  const r = spawnSync('codex', args, { env, encoding: 'utf8', shell: isWin, timeout: 120_000 })
  return { code: r.status, out: `${r.stdout ?? ''}${r.stderr ?? ''}` }
}

/** Temp-dir cleanup that never throws: codex keeps background git work under
 *  CODEX_HOME/.tmp for a moment after exit (Windows EPERM, measured). */
function cleanup(dir) {
  try {
    rmSync(dir, { recursive: true, force: true, maxRetries: 20, retryDelay: 250 })
  } catch (e) {
    log(`WARN could not remove ${dir} yet (${e.code}); delete it manually`)
  }
}

function p95(xs) {
  const s = [...xs].sort((a, b) => a - b)
  return s[Math.min(s.length - 1, Math.ceil(0.95 * s.length) - 1)]
}

/** newline-delimited JSON-RPC session with `codex app-server`. */
function appServer(env) {
  const child = spawn('codex', ['app-server'], {
    env,
    shell: isWin,
    stdio: ['pipe', 'pipe', 'ignore'],
  })
  const pending = new Map()
  let onNote = () => {}
  let buf = ''
  let id = 1
  child.stdout.setEncoding('utf8')
  child.stdout.on('data', (d) => {
    buf += d
    for (let i = buf.indexOf('\n'); i >= 0; i = buf.indexOf('\n')) {
      const line = buf.slice(0, i).trim()
      buf = buf.slice(i + 1)
      let msg
      try {
        msg = JSON.parse(line)
      } catch {
        continue
      }
      if (msg.id !== undefined && msg.method === undefined && pending.has(msg.id)) {
        pending.get(msg.id)(msg)
        pending.delete(msg.id)
      } else if (msg.method) onNote(msg)
    }
  })
  const call = (method, params) =>
    new Promise((res) => {
      const n = id++
      pending.set(n, res)
      child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id: n, method, params })}\n`)
      setTimeout(() => res({ error: { message: `${method} timeout` } }), 60_000)
    })
  const start = async () => {
    await call('initialize', { clientInfo: { name: 'harnessed-codex-live', version: '0' } })
    child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', method: 'initialized', params: {} })}\n`)
  }
  // stdin EOF first: with shell:true on Windows kill() only reaches the cmd.exe wrapper
  const kill = () => {
    child.stdin.end()
    child.kill()
  }
  return { call, start, setOnNote: (f) => (onNote = f), kill }
}

async function loadSrc() {
  const bundleDir = mkdtempSync(join(tmpdir(), 'harnessed-codex-live-bundle-'))
  process.on('exit', () => rmSync(bundleDir, { recursive: true, force: true }))
  const out = join(bundleDir, 'lib.mjs')
  await build({
    stdin: {
      contents: [
        "export { installCcHookAdd } from './src/installers/ccHookAdd.ts'",
        "export { uninstallCcHookAdd } from './src/uninstallers/ccHookAdd.ts'",
        "export { validateManifestFile } from './src/manifest/validate.ts'",
        "export { CODEX_HOOK_SHIM, codexHookCommand, parseHookIdentity } from './src/installers/lib/codexHookPlugin.ts'",
      ].join('\n'),
      resolveDir: ROOT,
      loader: 'ts',
    },
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'node22',
    outfile: out,
    banner: {
      js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);",
    },
    logLevel: 'error',
  })
  return import(pathToFileURL(out).href)
}

function fixtureDrift() {
  const v = codex(['--version'], process.env).out.match(/(\d+)\.(\d+)\.\d+/)
  if (!v) return log('codex not found on PATH — aborting')
  const dirs = readdirSync(join(ROOT, 'tests', 'fixtures', 'codex-hooks'))
  const newest = dirs.sort().at(-1) ?? ''
  const [maj, min] = newest.split('.')
  log(`codex ${v[0]}; newest payload fixtures: ${newest}`)
  if (maj !== v[1] || min !== v[2])
    log(
      `NOTE fixture drift: codex minor ${v[1]}.${v[2]} ≠ fixtures ${newest} — re-capture tests/fixtures/codex-hooks/`,
    )
  return v[0]
}

// ── stage A: isolated CODEX_HOME ────────────────────────────────────────────

async function stageA(lib) {
  const home = mkdtempSync(join(tmpdir(), 'harnessed-codex-live-home-'))
  const env = {
    ...process.env,
    CODEX_HOME: home,
    HARNESSED_PLATFORM: 'codex',
    HARNESSED_ROOT_OVERRIDE: join(home, 'harnessed-state'),
  }
  const saved = { ...process.env }
  Object.assign(process.env, env)
  try {
    const manifests = HOOK_MANIFESTS.map((name) => {
      const path = join(ROOT, 'manifests', 'optional', `${name}.yaml`)
      const v = lib.validateManifestFile(readFileSync(path, 'utf8'), path)
      if (!v.ok) throw new Error(`${name}: ${v.errors[0]?.message}`)
      return v.manifest
    })
    const opts = {
      apply: true,
      dryRun: false,
      system: false,
      nonInteractive: true,
      fullDiff: false,
      color: false,
      quiet: true,
      codexHookTrust: 'grant',
    }
    for (const m of manifests) {
      const r = await lib.installCcHookAdd({ manifest: m, opts, level: 'L3', cwd: home })
      check(
        `A install ${m.metadata.name}`,
        r.ok === true && !r.trustPending,
        JSON.stringify(r).slice(0, 200),
      )
    }
    const a = appServer(env)
    await a.start()
    const listed = await a.call('hooks/list', { cwds: [home] })
    const hooks = (listed.result?.data ?? []).flatMap((d) => d.hooks ?? [])
    for (const m of manifests) {
      const pid = `harnessed-${m.metadata.name}@harnessed-local`
      const h = hooks.find((x) => x.key.startsWith(`${pid}:`))
      check(
        `A hooks/list ${pid} trusted`,
        h?.trustStatus === 'trusted',
        h ? h.trustStatus : 'not listed',
      )
    }
    a.kill()
    for (const m of manifests) {
      const r = await lib.uninstallCcHookAdd({
        manifest: m,
        opts: { apply: true, dryRun: false, yes: true },
        cwd: home,
      })
      check(`A uninstall ${m.metadata.name}`, r.ok === true, JSON.stringify(r).slice(0, 200))
    }
    const b = appServer(env)
    await b.start()
    const after = await b.call('hooks/list', { cwds: [home] })
    b.kill()
    const left = (after.result?.data ?? [])
      .flatMap((d) => d.hooks ?? [])
      .filter((h) => h.key.includes('@harnessed-local:'))
    check('A no harnessed hook listed after uninstall', left.length === 0, `${left.length} left`)
    const plist = codex(['plugin', 'list', '--json'], env).out
    check('A no harnessed plugin installed after uninstall', !plist.includes('@harnessed-local'))
    check(
      'A marketplace + cache dirs removed',
      !existsSync(join(home, 'harnessed', 'marketplace')) &&
        !existsSync(join(home, 'plugins', 'cache', 'harnessed-local')),
    )
  } finally {
    for (const k of Object.keys(process.env)) if (!(k in saved)) delete process.env[k]
    Object.assign(process.env, saved)
    cleanup(home)
  }
}

// ── shell timing: the generated literal through the host shells ─────────────

function shellTiming(lib) {
  const dir = mkdtempSync(join(tmpdir(), 'harnessed-codex-live-shim-'))
  try {
    writeFileSync(join(dir, 'hook.cjs'), lib.CODEX_HOOK_SHIM)
    writeFileSync(join(dir, 'install.json'), JSON.stringify({ mode: 'npm', assetsRoot: ROOT }))
    const payload = readFileSync(
      join(ROOT, 'tests', 'fixtures', 'codex-hooks', '0.154', 'UserPromptSubmit.json'),
      'utf8',
    )
    const cmd = lib
      .codexHookCommand({ id: 'inject-state', args: [] }, 'npm')
      .replaceAll('${PLUGIN_ROOT}', dir)
    const shells = isWin
      ? [
          ['pwsh (codex default here)', 'pwsh', ['-NoProfile', '-Command', cmd], false],
          ['cmd /c', 'cmd.exe', ['/d', '/s', '/c', `"${cmd}"`], true],
        ]
      : [['sh -c', 'sh', ['-c', cmd], false]]
    for (const [label, bin, args, verbatim] of shells) {
      const ms = []
      for (let i = 0; i < 10; i++) {
        const t = performance.now()
        const r = spawnSync(bin, args, {
          input: payload,
          env: { ...process.env, PLUGIN_DATA: dir, HARNESSED_ROOT_OVERRIDE: join(dir, 'state') },
          windowsVerbatimArguments: verbatim,
          encoding: 'utf8',
        })
        ms.push(performance.now() - t)
        if (r.status !== 0) {
          check(`shell ${label} exit 0`, false, r.stderr.slice(0, 200))
          break
        }
      }
      log(
        `timing ${label}: p50=${Math.round(ms.sort((a, b) => a - b)[4])}ms p95=${Math.round(p95(ms))}ms (n=${ms.length})`,
      )
      check(`shell ${label} p95 < 1000ms`, p95(ms) < 1000)
    }
  } finally {
    cleanup(dir)
  }
}

// ── stage B: real ~/.codex, namespaced probe plugin, one real turn ──────────

async function stageB(lib) {
  const P = 'harnessed-probe-live'
  const M = 'harnessed-probe-live-mkt'
  const codexHome = process.env.CODEX_HOME?.trim() || join(homedir(), '.codex')
  const mkt = mkdtempSync(join(tmpdir(), 'harnessed-codex-live-mkt-'))
  const dataDir = join(codexHome, 'plugins', 'data', `${P}-${M}`)
  const cacheDir = join(codexHome, 'plugins', 'cache', M)
  const state = mkdtempSync(join(tmpdir(), 'harnessed-codex-live-state-'))
  const repo = realpathSync(mkdtempSync(join(tmpdir(), 'harnessed-codex-live-repo-')))
  mkdirSync(join(repo, '.git'))
  const env = { ...process.env, HARNESSED_ROOT_OVERRIDE: state }
  let keys = []
  const a = appServer(env)
  try {
    // plugin = the generated literals for the three ported hooks, pointing at this checkout
    const events = [
      ['SessionStart', undefined, { id: 'inject-state', args: ['--invalidate'] }],
      ['UserPromptSubmit', undefined, { id: 'inject-state', args: [] }],
      ['PreToolUse', 'Bash', { id: 'check-docs', args: ['--hook'] }],
    ]
    const hooks = Object.fromEntries(
      events.map(([ev, matcher, ident]) => {
        const command = lib.codexHookCommand(ident, 'npm')
        return [
          ev,
          [
            {
              ...(matcher ? { matcher } : {}),
              hooks: [{ type: 'command', command, commandWindows: command }],
            },
          ],
        ]
      }),
    )
    const w = (rel, v) => {
      const f = join(mkt, rel)
      mkdirSync(dirname(f), { recursive: true })
      writeFileSync(f, typeof v === 'string' ? v : `${JSON.stringify(v, null, 2)}\n`)
    }
    w('.agents/plugins/marketplace.json', {
      name: M,
      owner: { name: 'harnessed' },
      plugins: [
        {
          name: P,
          source: `./plugins/${P}`,
          policy: { installation: 'AVAILABLE', authentication: 'ON_INSTALL' },
          version: '1.0.0',
        },
      ],
    })
    w(`plugins/${P}/.codex-plugin/plugin.json`, {
      name: P,
      description: 'harnessed codex-live probe',
      version: '1.0.0',
      author: { name: 'harnessed' },
    })
    w(`plugins/${P}/hooks/hooks.json`, { hooks })
    w(`plugins/${P}/hook.cjs`, lib.CODEX_HOOK_SHIM)
    mkdirSync(dataDir, { recursive: true })
    writeFileSync(join(dataDir, 'install.json'), JSON.stringify({ mode: 'npm', assetsRoot: ROOT }))
    // a workflow slot for the probe repo so the inject hook has something to say
    writeFileSync(
      join(state, 'workflows.json'),
      JSON.stringify({
        schemaVersion: 1,
        workflows: {
          [repo]: {
            schemaVersion: 1,
            phase: 'task',
            status: 'active',
            last_checkpoint_path: null,
            started_at: new Date().toISOString(),
            sub_progress: [{ sub: 'codex-live-probe', status: 'pending', gate_fired: true }],
          },
        },
      }),
    )
    check('B marketplace add', codex(['plugin', 'marketplace', 'add', mkt], env).code === 0)
    check('B plugin add', codex(['plugin', 'add', `${P}@${M}`], env).code === 0)

    await a.start()
    const listed = await a.call('hooks/list', { cwds: [repo] })
    const mine = (listed.result?.data ?? [])
      .flatMap((d) => d.hooks ?? [])
      .filter((h) => h.key.startsWith(`${P}@${M}:`))
    keys = mine.map((h) => h.key)
    check('B probe hooks listed', mine.length === 3, `${mine.length}`)
    const tw = await a.call('config/batchWrite', {
      edits: [
        {
          keyPath: 'hooks.state',
          value: Object.fromEntries(mine.map((h) => [h.key, { trusted_hash: h.currentHash }])),
          mergeStrategy: 'upsert',
        },
      ],
      reloadUserConfig: true,
    })
    check(
      'B probe hooks trusted',
      !tw.error,
      tw.error ? JSON.stringify(tw.error).slice(0, 200) : '',
    )

    const runs = []
    let agentText = ''
    const done = new Promise((res) => {
      a.setOnNote((m) => {
        if (m.method === 'hook/completed') runs.push(m.params.run)
        else if (m.method === 'item/completed' && m.params?.item?.type === 'agentMessage')
          agentText += m.params.item.text ?? ''
        else if (m.method === 'turn/completed') res()
      })
    })
    const t = await a.call('thread/start', {
      cwd: repo,
      sandbox: 'danger-full-access',
      approvalPolicy: 'never',
    })
    const threadId = t.result?.thread?.id
    await a.call('turn/start', {
      threadId,
      input: [
        {
          type: 'text',
          text: 'Run the shell command `git status` once, then reply DONE.',
          text_elements: [],
        },
      ],
    })
    await Promise.race([done, new Promise((r) => setTimeout(r, 240_000))])
    if (runs[0]) log(`hook run fields: ${Object.keys(runs[0]).join(', ')}`)
    const ours = runs.filter((r) => JSON.stringify(r).includes(P))
    for (const r of ours) {
      log(`hook ${r.eventName}: status=${r.status} durationMs=${r.durationMs}`)
      check(
        `B hook ${r.eventName} completed`,
        r.status === 'completed',
        JSON.stringify(r.entries ?? []).slice(0, 200),
      )
    }
    const inject = ours.find((r) => /userPromptSubmit/i.test(r.eventName))
    const ctx = (inject?.entries ?? [])
      .filter((e) => e.kind === 'context')
      .map((e) => e.text)
      .join('\n')
    check(
      'B PreToolUse (check-docs) hook fired',
      ours.some((r) => /preToolUse/i.test(r.eventName)),
    )
    check(
      'B UserPromptSubmit injected <workflow-state> as context',
      ctx.includes('<workflow-state>'),
      ctx.slice(0, 120),
    )
    const ms = ours.map((r) => r.durationMs).filter((x) => typeof x === 'number')
    check(
      'B hook durationMs p95 < 1000',
      ms.length > 0 && p95(ms) < 1000,
      `n=${ms.length} p95=${ms.length ? p95(ms) : '—'}ms`,
    )
    log(`agent: ${agentText.slice(0, 80)}`)
  } finally {
    // cleanup — always, even on failure
    if (keys.length > 0) {
      const d = await a.call('config/batchWrite', {
        edits: keys.map((k) => ({
          keyPath: `hooks.state."${k}"`,
          value: null,
          mergeStrategy: 'replace',
        })),
        reloadUserConfig: true,
      })
      check('B cleanup trust entries', !d.error)
    }
    a.kill()
    check('B cleanup plugin remove', codex(['plugin', 'remove', `${P}@${M}`], env).code === 0)
    check(
      'B cleanup marketplace remove',
      codex(['plugin', 'marketplace', 'remove', M], env).code === 0,
    )
    rmSync(cacheDir, { recursive: true, force: true })
    rmSync(dataDir, { recursive: true, force: true })
    for (const d of [mkt, state, repo]) cleanup(d)
    const left = codex(['plugin', 'list', '--json'], env).out
    check('B no probe plugin left', !left.includes(P))
    check('B no probe cache/data dir left', !existsSync(cacheDir) && !existsSync(dataDir))
  }
}

const version = fixtureDrift()
if (!version) process.exit(1)
const lib = await loadSrc()
await stageA(lib)
shellTiming(lib)
if (!isolatedOnly) await stageB(lib)
const failed = results.filter((r) => !r.ok)
log(`${results.length - failed.length}/${results.length} passed`)
process.exit(failed.length === 0 ? 0 : 1)
