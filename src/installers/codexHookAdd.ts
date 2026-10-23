// v16.0 Phase 64 (ADR 0041) — cc-hook-add on codex: the hook ships as a LOCAL
// codex plugin instead of a settings.json entry.
//
//   ~/.codex/harnessed/marketplace/                        (harnessed-owned)
//     .agents/plugins/marketplace.json                     name: harnessed-local
//     plugins/harnessed-<manifest>/.codex-plugin/plugin.json
//     plugins/harnessed-<manifest>/hooks/hooks.json        hash-stable literal
//     plugins/harnessed-<manifest>/hook.cjs                npm-mode shim
//   ~/.codex/plugins/data/harnessed-<manifest>-harnessed-local/install.json
//                                                        (= ${PLUGIN_DATA}; codex
//                                                         store.rs plugin_data_root)
//   codex plugin marketplace add <dir>   (idempotent — "already added", exit 0)
//   codex plugin add harnessed-<manifest>@harnessed-local
//   trust: consented → app-server hooks/list + config/batchWrite (codexHookTrust.ts)
//
// Boundaries: nothing here reads or writes ~/.codex/config.toml or
// ~/.codex/hooks.json — codex's CLI and app-server own those. Every codex plugin
// operation is serialized (R5, withCodexPluginLock).

import { existsSync, type Stats } from 'node:fs'
import { lstat, mkdir, readdir, readFile, realpath, rm, stat, writeFile } from 'node:fs/promises'
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import { isDeepStrictEqual } from 'node:util'
import * as p from '@clack/prompts'
import pkg from '../../package.json' with { type: 'json' }
import { checkCmdString } from '../manifest/security.js'
import { getAssetsRoot, isCompiledRuntime } from '../platform/assetsRoot.js'
import type { HostInstallContext } from '../platform/hostInstallContext.js'
import { detectPlatform } from '../platform/platform.js'
import { backup } from './lib/backup.js'
import {
  CODEX_HOOK_MARKETPLACE,
  type CodexHookMode,
  codexHookPluginId,
  codexHookPluginName,
  codexHookTrustKey,
  codexMarketplaceJson,
  renderCodexHookPlugin,
} from './lib/codexHookPlugin.js'
import { listCodexHooks, trustCodexHooks, untrustCodexHooks } from './lib/codexHookTrust.js'
import {
  invalidateCodexPluginCache,
  isCodexPluginInstalled,
  listCodexPluginMetadata,
  withCodexPluginLock,
} from './lib/codexPlugins.js'
import { confirmAt } from './lib/confirm.js'
import { renderDiff } from './lib/diff.js'
import { err } from './lib/err.js'
import { readPluginEnablement } from './lib/readClaudeConfig.js'
import { runHarnessArgs } from './lib/runClaudeArgs.js'
import { getMcpSpawnCwd } from './lib/safeCwd.js'
import { recordObservedInstall, updateInstalled } from './lib/state.js'
import type { DiffPlan, InstallContext, InstallResult } from './lib/types.js'
import { formatSpawnFail } from './lib/verifyMessage.js'

/** CODEX_HOME when set (codex honours it), else the codex descriptor home. */
export function resolveCodexHome(hostContext?: HostInstallContext): string {
  if (hostContext) return hostContext.nativeHome
  const env = process.env.CODEX_HOME?.trim()
  return env ? env : detectPlatform().homeDir
}

export function codexHookPaths(codexHome: string, manifestName: string) {
  const pluginName = codexHookPluginName(manifestName)
  const marketplaceRoot = join(codexHome, 'harnessed', 'marketplace')
  return {
    pluginName,
    pluginId: codexHookPluginId(manifestName),
    marketplaceRoot,
    marketplaceJson: join(marketplaceRoot, '.agents', 'plugins', 'marketplace.json'),
    pluginsDir: join(marketplaceRoot, 'plugins'),
    pluginDir: join(marketplaceRoot, 'plugins', pluginName),
    dataDir: join(codexHome, 'plugins', 'data', `${pluginName}-${CODEX_HOOK_MARKETPLACE}`),
    cacheMarketplaceDir: join(codexHome, 'plugins', 'cache', CODEX_HOOK_MARKETPLACE),
  }
}

async function readOr(path: string): Promise<string> {
  try {
    return await readFile(path, 'utf8')
  } catch {
    return ''
  }
}

async function harnessedPluginDirs(pluginsDir: string): Promise<string[]> {
  try {
    return (await readdir(pluginsDir)).filter((n) => n.startsWith('harnessed-'))
  } catch {
    return []
  }
}

const TRUST_HINT = (name: string) =>
  `codex hooks installed but NOT trusted yet — codex skips untrusted hooks. Re-run \`harnessed install ${name} --trust-codex-hooks\`, or trust them in codex's hook review.`

async function hookReadinessFailure(
  ctx: InstallContext,
  pluginId: string,
): Promise<InstallResult | null> {
  if (!ctx.hostContext) return null
  const enabled = await readPluginEnablement(pluginId, ctx.hostContext)
  if (enabled === true) return null
  return {
    ok: false,
    phase: 'verify',
    error: {
      ...err(
        ctx,
        '/spec/verify/cmd',
        `Plugin '${pluginId}' is installed but ${enabled === false ? 'disabled' : 'enablement is unknown'}; no automatic repair was performed.`,
        'verify-failed',
      ),
      suggest:
        'Review the hook plugin in the native Codex plugin management tool; harnessed will not override a disabled or unknown state.',
    },
  }
}

/** R8 — write trust only with consent; report accurately either way. Returns the
 *  "pending" message, or undefined when every hook of the plugin is trusted. */
async function ensureTrust(ctx: InstallContext, pluginId: string): Promise<string | undefined> {
  const name = ctx.manifest.metadata.name
  const mode = ctx.opts.codexHookTrust ?? 'deny'
  if (mode !== 'grant') {
    const listed = await listCodexHooks(
      ...(ctx.hostContext
        ? [{ hostContext: ctx.hostContext, cwd: getMcpSpawnCwd(ctx.hostContext) }]
        : []),
    )
    if (!listed.ok) return `${TRUST_HINT(name)} (trust status unknown: ${listed.failure})`
    const ours = listed.value.filter((h) => h.key.startsWith(`${pluginId}:`))
    if (
      ours.length > 0 &&
      ours.every(
        (h) =>
          h.trustStatus === 'trusted' &&
          typeof h.currentHash === 'string' &&
          h.currentHash.trim().length > 0,
      )
    )
      return undefined
    if (mode === 'deny') return TRUST_HINT(name)
    const ans = await p.confirm({
      message: `Trust harnessed's codex hook plugin ${pluginId}? codex runs trusted hooks on every matching event.`,
      initialValue: true,
    })
    if (p.isCancel(ans) || ans !== true) return TRUST_HINT(name)
  }
  const r = await trustCodexHooks(
    [pluginId],
    ...(ctx.hostContext
      ? [{ hostContext: ctx.hostContext, cwd: getMcpSpawnCwd(ctx.hostContext) }]
      : []),
  )
  if (!r.ok) return `${TRUST_HINT(name)} (trust RPC ${r.failure}: ${r.detail.slice(0, 120)})`
  if (r.value.missing.length > 0)
    return `${TRUST_HINT(name)} (codex did not list the plugin's hooks yet)`
  return undefined
}

export async function installCodexHook(ctx: InstallContext): Promise<InstallResult> {
  const install = ctx.manifest.spec.install
  if (install.method !== 'cc-hook-add')
    return {
      ok: false,
      phase: 'preflight',
      error: err(
        ctx,
        '/spec/install/method',
        `dispatch bug: ${install.method}`,
        'dispatch-mismatch',
      ),
    }
  const name = ctx.manifest.metadata.name
  const mode: CodexHookMode = isCompiledRuntime() ? 'binary' : 'npm'
  const rendered = renderCodexHookPlugin(
    {
      manifestName: name,
      event: install.hook_event,
      ...(install.hook_matcher !== undefined ? { matcher: install.hook_matcher } : {}),
      hookCommand: install.hook_command,
    },
    mode,
  )
  // R2 — no codex port for this hook (stop-hook-recover: CC transcript-shaped).
  if (!rendered) return { aborted: true, reason: 'harness-mismatch' }

  // Defense in depth (sister ccHookAdd): the manifest's tail args land in a command
  // codex runs through the user's shell.
  const violation = checkCmdString(install.hook_command)
  if (violation)
    return {
      ok: false,
      phase: 'preflight',
      error: err(
        ctx,
        '/spec/install/hook_command',
        `shell escape detected in hook_command: ${violation.label} (${violation.hint})`,
        'security-gate-bypass',
      ),
    }

  const paths = codexHookPaths(resolveCodexHome(ctx.hostContext), name)
  if (ctx.hostContext && (await isCodexPluginInstalled(paths.pluginId, ctx.hostContext))) {
    const readinessFailure = await hookReadinessFailure(ctx, paths.pluginId)
    if (readinessFailure) return readinessFailure
  }
  const others = (await harnessedPluginDirs(paths.pluginsDir)).filter((n) => n !== paths.pluginName)
  const info = `${JSON.stringify(
    { mode, assetsRoot: getAssetsRoot(), harnessedVersion: pkg.version },
    null,
    2,
  )}\n`
  const targets: { target: string; content: string }[] = [
    ...rendered.files.map((f) => ({
      target: join(paths.marketplaceRoot, f.path),
      content: f.content,
    })),
    // fallback copy beside the shim (the cached plugin copy) — ${PLUGIN_DATA} wins
    { target: join(paths.pluginDir, 'install.json'), content: info },
    {
      target: paths.marketplaceJson,
      content: `${JSON.stringify(codexMarketplaceJson([...others, paths.pluginName]), null, 2)}\n`,
    },
    { target: join(paths.dataDir, 'install.json'), content: info },
  ]
  const plan: DiffPlan = {
    files: await Promise.all(
      targets.map(async (t) => ({
        target: t.target,
        scope: 'HOME' as const,
        oldText: await readOr(t.target),
        newText: t.content,
      })),
    ),
  }
  const changed = plan.files.filter((f) => f.oldText !== f.newText)

  // Idempotent: files identical + plugin installed → only the trust step remains.
  if (changed.length === 0 && !ctx.opts.dryRun && ctx.opts.updateInstalled !== true) {
    if (
      await isCodexPluginInstalled(paths.pluginId, ...(ctx.hostContext ? [ctx.hostContext] : []))
    ) {
      const trustPending = await ensureTrust(ctx, paths.pluginId)
      if (!trustPending)
        await recordObservedInstall(
          ctx.cwd,
          name,
          '',
          '',
          ...(ctx.hostContext ? [ctx.hostContext] : []),
        )
      return {
        ok: true,
        alreadyInstalled: true,
        backupId: 'idempotent-skip',
        ...(trustPending ? { trustPending } : {}),
      }
    }
  }

  if (!ctx.opts.quiet) process.stdout.write(renderDiff({ files: changed }, ctx))
  const conf = await confirmAt('L3', { ...ctx, level: 'L3' })
  if (!conf.proceed) {
    return {
      aborted: true,
      reason: conf.reason === 'flag-missing' ? 'level-flag-missing' : 'user-cancel',
    }
  }
  if (ctx.opts.dryRun) return { aborted: true, reason: 'user-cancel' }

  return withCodexPluginLock(async () => {
    const bk = await backup({ files: changed }, ctx)
    if (!bk.ok) return { ok: false, phase: 'preflight', error: bk.error }
    for (const f of changed) {
      await mkdir(dirname(f.target), { recursive: true })
      await writeFile(f.target, f.newText)
    }
    const cwd = getMcpSpawnCwd(...(ctx.hostContext ? [ctx.hostContext] : []))
    const steps: string[][] = [
      ['plugin', 'marketplace', 'add', paths.marketplaceRoot],
      ['plugin', 'add', paths.pluginId],
    ]
    for (const args of steps) {
      const r = await runHarnessArgs(
        'codex',
        args,
        cwd,
        60_000,
        ...(ctx.hostContext ? [ctx.hostContext] : []),
      )
      if (r.exitCode !== 0) {
        invalidateCodexPluginCache(...(ctx.hostContext ? [ctx.hostContext] : []))
        return {
          ok: false,
          phase: 'spawn',
          backupId: bk.backupId,
          error: err(
            ctx,
            '/spec/install/hook_command',
            formatSpawnFail(`codex ${args.slice(0, -1).join(' ')}`, r.exitCode, r.stdout, r.stderr),
            'install-failed',
          ),
        }
      }
    }
    invalidateCodexPluginCache(...(ctx.hostContext ? [ctx.hostContext] : []))
    if (
      !(await isCodexPluginInstalled(paths.pluginId, ...(ctx.hostContext ? [ctx.hostContext] : [])))
    ) {
      return {
        ok: false,
        phase: 'verify',
        backupId: bk.backupId,
        error: err(
          ctx,
          '/spec/install/hook_command',
          `verify: ${paths.pluginId} not listed as installed by \`codex plugin list\` after add`,
          'verify-failed',
        ),
      }
    }
    const readinessFailure = await hookReadinessFailure(ctx, paths.pluginId)
    if (readinessFailure) return { ...readinessFailure, backupId: bk.backupId } as InstallResult
    const trustPending = await ensureTrust(ctx, paths.pluginId)
    if (!trustPending)
      await updateInstalled(ctx.cwd, name, '', '', ...(ctx.hostContext ? [ctx.hostContext] : []))
    return {
      ok: true,
      backupId: bk.backupId,
      appliedFiles: changed.map((f) => f.target),
      ...(trustPending ? { trustPending } : {}),
    }
  })
}

async function removeIfEmpty(dir: string): Promise<void> {
  try {
    if ((await readdir(dir)).length === 0) await rm(dir, { recursive: true, force: true })
  } catch {
    /* absent */
  }
}

type HookPaths = ReturnType<typeof codexHookPaths>
type HookMarketplace = {
  name: string
  owner: { name: string }
  plugins: {
    name: string
    source: string
    policy: { installation: string; authentication: string }
    version: string
  }[]
}

async function entryOrAbsent(path: string): Promise<Stats | null> {
  try {
    return await lstat(path)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null
    throw error
  }
}

function confined(root: string, path: string): boolean {
  const rel = relative(root, path)
  return rel !== '..' && !rel.startsWith(`..${sep}`) && !isAbsolute(rel)
}

/** Check each ancestor before reading or descending: neither a directory name
 * nor a native registry entry grants authority over a symlink's destination. */
async function nativeRemovalTree(
  nativeHome: string,
  target: string,
): Promise<Map<string, 'file' | 'directory'>> {
  const root = resolve(nativeHome)
  const tree = new Map<string, 'file' | 'directory'>()
  if (!isAbsolute(nativeHome) || !confined(root, resolve(target)))
    throw new Error(`Removal target is not confined to native home: ${target}`)
  const configuredRoot = await entryOrAbsent(root)
  if (!configuredRoot) return tree
  const rootEntry = configuredRoot.isSymbolicLink() ? await stat(root) : configuredRoot
  if (!rootEntry.isDirectory()) throw new Error(`Native home is not a canonical directory: ${root}`)
  const canonicalRoot = await realpath(root)
  async function check(path: string): Promise<Stats | null> {
    let at = root
    let entry: Stats | null = rootEntry
    for (const segment of relative(root, path).split(sep).filter(Boolean)) {
      at = join(at, segment)
      entry = await entryOrAbsent(at)
      if (!entry) return null
      if (entry.isSymbolicLink()) throw new Error(`Symbolic link/junction in removal target: ${at}`)
      if (!confined(canonicalRoot, await realpath(at)))
        throw new Error(`Canonical removal target is not confined: ${at}`)
    }
    return entry
  }
  async function walk(path: string): Promise<void> {
    const entry = await check(path)
    if (!entry) return
    const key = relative(target, path).split(sep).join('/')
    if (entry.isDirectory()) {
      tree.set(key, 'directory')
      for (const child of await readdir(path)) await walk(join(path, child))
    } else if (entry.isFile()) tree.set(key, 'file')
    else throw new Error(`Unknown removal target type: ${path}`)
  }
  await walk(target)
  return tree
}

function knownVersion(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(value)
  )
}

async function generatedHookFiles(
  pluginDir: string,
  pluginName: string,
  requestedEvent?: string,
): Promise<{ files: string[]; info: unknown }> {
  const info = JSON.parse(await readFile(join(pluginDir, 'install.json'), 'utf8')) as {
    mode?: unknown
    assetsRoot?: unknown
    harnessedVersion?: unknown
  }
  if (
    !info ||
    (info.mode !== 'npm' && info.mode !== 'binary') ||
    typeof info.assetsRoot !== 'string' ||
    !isAbsolute(info.assetsRoot) ||
    !knownVersion(info.harnessedVersion) ||
    Object.keys(info).sort().join(',') !== 'assetsRoot,harnessedVersion,mode'
  )
    throw new Error(`Unrecognized first-party install info: ${pluginDir}`)
  const hooks = JSON.parse(await readFile(join(pluginDir, 'hooks', 'hooks.json'), 'utf8')) as {
    hooks?: Record<string, { matcher?: string; hooks?: { command?: string }[] }[]>
  }
  const events = Object.keys(hooks?.hooks ?? {})
  const event = events[0]
  if (events.length !== 1 || !event || (requestedEvent !== undefined && requestedEvent !== event))
    throw new Error(`Unrecognized first-party hook event: ${pluginDir}`)
  const group = hooks.hooks?.[event]?.[0]
  const command = group?.hooks?.[0]?.command
  // biome-ignore lint/suspicious/noTemplateCurlyInString: Codex expands this literal plugin placeholder.
  const head = info.mode === 'npm' ? 'node "${PLUGIN_ROOT}/hook.cjs" ' : 'harnessed '
  const suffix = ' --platform codex'
  if (typeof command !== 'string' || !command.startsWith(head) || !command.endsWith(suffix))
    throw new Error(`Unrecognized first-party hook command: ${pluginDir}`)
  const rendered = renderCodexHookPlugin(
    {
      manifestName: pluginName.slice('harnessed-'.length),
      event,
      ...(group?.matcher !== undefined ? { matcher: group.matcher } : {}),
      hookCommand: `harnessed ${command.slice(head.length, -suffix.length)}`,
    },
    info.mode,
  )
  if (!rendered || rendered.pluginName !== pluginName)
    throw new Error(`Unrecognized first-party hook identity: ${pluginDir}`)
  const files = ['install.json']
  for (const expected of rendered.files) {
    const path = expected.path.slice(`plugins/${pluginName}/`.length)
    const content = await readFile(join(pluginDir, path), 'utf8')
    if (path === '.codex-plugin/plugin.json') {
      const descriptor = JSON.parse(content) as { version?: unknown }
      if (
        !knownVersion(descriptor?.version) ||
        !isDeepStrictEqual(descriptor, {
          ...JSON.parse(expected.content),
          version: descriptor.version,
        })
      )
        throw new Error(`Unrecognized first-party plugin descriptor: ${pluginDir}`)
    } else if (path === 'hook.cjs') {
      const header = content.split(/\r?\n/)[1] ?? ''
      if (
        !header.startsWith('// harnessed codex hook shim') ||
        !header.includes('GENERATED by `harnessed install` (ADR 0041)')
      )
        throw new Error(`Unrecognized first-party hook shim: ${pluginDir}`)
    } else if (!isDeepStrictEqual(JSON.parse(content), JSON.parse(expected.content)))
      throw new Error(`Unrecognized first-party hook content: ${pluginDir}`)
    files.push(path)
  }
  return { files, info }
}

function exactGeneratedTree(
  tree: Map<string, 'file' | 'directory'>,
  files: string[],
  label: string,
): void {
  const expected = new Map<string, 'file' | 'directory'>([['', 'directory']])
  for (const file of files) {
    expected.set(file, 'file')
    let parent = dirname(file).split(sep).join('/')
    while (parent !== '.') {
      expected.set(parent, 'directory')
      parent = dirname(parent).split(sep).join('/')
    }
  }
  for (const [path, kind] of tree)
    if (expected.get(path) !== kind) throw new Error(`Unknown/foreign content in ${label}: ${path}`)
  for (const [path, kind] of expected)
    if (tree.get(path) !== kind) throw new Error(`Missing generated content in ${label}: ${path}`)
}

async function preflightHookRemoval(
  nativeHome: string,
  paths: HookPaths,
  event: string,
): Promise<{ empty: true } | { empty: false; marketplace: HookMarketplace }> {
  const marketplaceTree = await nativeRemovalTree(nativeHome, paths.marketplaceRoot)
  const dataTree = await nativeRemovalTree(nativeHome, paths.dataDir)
  await nativeRemovalTree(nativeHome, paths.cacheMarketplaceDir)
  const targetPrefix = `plugins/${paths.pluginName}`
  if (!marketplaceTree.has(targetPrefix)) {
    if (dataTree.size > 0)
      throw new Error(`Hook data has no provable generated plugin identity: ${paths.dataDir}`)
    return { empty: true }
  }
  const pluginNames = [...marketplaceTree]
    .filter(([path, kind]) => kind === 'directory' && /^plugins\/[^/]+$/.test(path))
    .map(([path]) => path.slice('plugins/'.length))
    .sort()
  const files = ['.agents/plugins/marketplace.json']
  let targetInfo: unknown
  for (const name of pluginNames) {
    if (!/^harnessed-[a-z0-9][a-z0-9-]*$/.test(name))
      throw new Error(`Unknown/foreign plugin namespace: ${name}`)
    const generated = await generatedHookFiles(
      join(paths.pluginsDir, name),
      name,
      name === paths.pluginName ? event : undefined,
    )
    if (name === paths.pluginName) targetInfo = generated.info
    files.push(...generated.files.map((file) => `plugins/${name}/${file}`))
  }
  exactGeneratedTree(marketplaceTree, files, paths.marketplaceRoot)
  const marketplace = JSON.parse(await readFile(paths.marketplaceJson, 'utf8')) as HookMarketplace
  const expected = codexMarketplaceJson(pluginNames) as HookMarketplace
  if (!Array.isArray(marketplace?.plugins))
    throw new Error('Unrecognized generated marketplace identity')
  for (const plugin of expected.plugins) {
    const actual = marketplace.plugins.find((entry) => entry?.name === plugin.name)
    if (!knownVersion(actual?.version))
      throw new Error(`Unrecognized generated marketplace entry: ${plugin.name}`)
    plugin.version = actual.version
  }
  if (!isDeepStrictEqual(marketplace, expected))
    throw new Error('Unrecognized generated marketplace identity/source')
  if (dataTree.size > 0) {
    exactGeneratedTree(dataTree, ['install.json'], paths.dataDir)
    if (
      !isDeepStrictEqual(
        JSON.parse(await readFile(join(paths.dataDir, 'install.json'), 'utf8')),
        targetInfo,
      )
    )
      throw new Error(`Hook data does not match generated plugin identity: ${paths.dataDir}`)
  }
  return { empty: false, marketplace }
}

/** T7 — reverse of installCodexHook. Idempotent; codex CLI failures are reported. */
export async function removeCodexHook(
  manifestName: string,
  hookEvent: string,
  hostContext?: HostInstallContext,
): Promise<
  { ok: true; removedPaths: string[] } | { ok: false; phase?: 'preflight' | 'spawn'; error: string }
> {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(manifestName) || (hostContext && hostContext.hostId !== 'codex'))
    return {
      ok: false,
      phase: 'preflight',
      error: 'Refusing hook removal: invalid first-party namespace or host context',
    }
  const nativeHome = resolveCodexHome(hostContext)
  const paths = codexHookPaths(nativeHome, manifestName)
  return withCodexPluginLock(async () => {
    let preflight: Awaited<ReturnType<typeof preflightHookRemoval>>
    try {
      preflight = await preflightHookRemoval(nativeHome, paths, hookEvent)
    } catch (error) {
      return {
        ok: false,
        phase: 'preflight',
        error: `Refusing hook removal: ${(error as Error).message}. Review these resources with the native Codex management tool; no removal or untrust was performed.`,
      }
    }
    invalidateCodexPluginCache(...(hostContext ? [hostContext] : []))
    const entries = await listCodexPluginMetadata(...(hostContext ? [hostContext] : []))
    if (entries === null)
      return {
        ok: false,
        phase: 'preflight',
        error:
          'Refusing hook removal: native plugin registration is unknown. Review the plugin with the native Codex management tool; no removal or untrust was performed.',
      }
    const nativeInstalled = entries.some((entry) => entry.pluginId === paths.pluginId)
    if (preflight.empty) {
      if (nativeInstalled)
        return {
          ok: false,
          phase: 'preflight',
          error:
            'Refusing hook removal: the exact native plugin remains registered but no generated payload/data identity is available. Review the plugin with the native Codex management tool; no removal or untrust was performed.',
        }
      return { ok: true, removedPaths: [] }
    }
    const cwd = getMcpSpawnCwd(...(hostContext ? [hostContext] : []))
    // Collect trust keys BEFORE removal (hooks/list stops listing a removed plugin);
    // the deterministic key covers a codex that cannot list.
    const keys = new Set([codexHookTrustKey(paths.pluginName, hookEvent)])
    const listed = await listCodexHooks(...(hostContext ? [{ hostContext, cwd }] : []))
    if (listed.ok)
      for (const h of listed.value) if (h.key.startsWith(`${paths.pluginId}:`)) keys.add(h.key)

    let nativeRemoved = false
    if (nativeInstalled) {
      const r = await runHarnessArgs(
        'codex',
        ['plugin', 'remove', paths.pluginId],
        cwd,
        60_000,
        ...(hostContext ? [hostContext] : []),
      )
      invalidateCodexPluginCache(...(hostContext ? [hostContext] : []))
      if (r.exitCode !== 0)
        return {
          ok: false,
          phase: 'spawn',
          error: formatSpawnFail('codex plugin remove', r.exitCode, r.stdout, r.stderr),
        }
      nativeRemoved = true
    }
    // codex leaves the empty cache/<marketplace> dir behind (measured).
    await removeIfEmpty(paths.cacheMarketplaceDir)
    const untrusted = await untrustCodexHooks(
      [...keys],
      ...(hostContext ? [{ hostContext, cwd }] : []),
    )
    if (!untrusted.ok)
      return {
        ok: false,
        phase: 'spawn',
        error: `Hook trust cleanup failed (${untrusted.failure}: ${untrusted.detail}). ${nativeRemoved ? 'Partial removal: the native plugin was already removed.' : 'The native plugin was not removed.'} Generated payload/data were preserved; review native hook trust before retrying.`,
      }

    const removed: string[] = []
    for (const dir of [paths.pluginDir, paths.dataDir]) {
      if (existsSync(dir)) {
        await rm(dir, { recursive: true, force: true })
        removed.push(dir)
      }
    }
    const remaining = preflight.marketplace.plugins.filter(
      (plugin) => plugin.name !== paths.pluginName,
    )
    if (remaining.length > 0) {
      await writeFile(
        paths.marketplaceJson,
        `${JSON.stringify({ ...preflight.marketplace, plugins: remaining }, null, 2)}\n`,
      )
    } else if (existsSync(paths.marketplaceRoot)) {
      const r = await runHarnessArgs(
        'codex',
        ['plugin', 'marketplace', 'remove', CODEX_HOOK_MARKETPLACE],
        cwd,
        60_000,
        ...(hostContext ? [hostContext] : []),
      )
      // "not configured" = already gone (marketplace remove is not idempotent, measured)
      if (r.exitCode !== 0 && !/not configured/i.test(`${r.stdout}${r.stderr}`))
        return {
          ok: false,
          phase: 'spawn',
          error: formatSpawnFail('codex plugin marketplace remove', r.exitCode, r.stdout, r.stderr),
        }
      await rm(paths.marketplaceRoot, { recursive: true, force: true })
      removed.push(paths.marketplaceRoot)
    }
    return { ok: true, removedPaths: removed }
  })
}
