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

import { existsSync } from 'node:fs'
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import * as p from '@clack/prompts'
import pkg from '../../package.json' with { type: 'json' }
import { checkCmdString } from '../manifest/security.js'
import { getAssetsRoot, isCompiledRuntime } from '../platform/assetsRoot.js'
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
  withCodexPluginLock,
} from './lib/codexPlugins.js'
import { confirmAt } from './lib/confirm.js'
import { renderDiff } from './lib/diff.js'
import { err } from './lib/err.js'
import { runHarnessArgs } from './lib/runClaudeArgs.js'
import { getMcpSpawnCwd } from './lib/safeCwd.js'
import { recordObservedInstall, updateInstalled } from './lib/state.js'
import type { DiffPlan, InstallContext, InstallResult } from './lib/types.js'
import { formatSpawnFail } from './lib/verifyMessage.js'

/** CODEX_HOME when set (codex honours it), else the codex descriptor home. */
export function resolveCodexHome(): string {
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

/** R8 — write trust only with consent; report accurately either way. Returns the
 *  "pending" message, or undefined when every hook of the plugin is trusted. */
async function ensureTrust(ctx: InstallContext, pluginId: string): Promise<string | undefined> {
  const name = ctx.manifest.metadata.name
  const mode = ctx.opts.codexHookTrust ?? 'deny'
  if (mode !== 'grant') {
    const listed = await listCodexHooks()
    if (!listed.ok) return `${TRUST_HINT(name)} (trust status unknown: ${listed.failure})`
    const ours = listed.value.filter((h) => h.key.startsWith(`${pluginId}:`))
    if (ours.length > 0 && ours.every((h) => h.trustStatus === 'trusted')) return undefined
    if (mode === 'deny') return TRUST_HINT(name)
    const ans = await p.confirm({
      message: `Trust harnessed's codex hook plugin ${pluginId}? codex runs trusted hooks on every matching event.`,
      initialValue: true,
    })
    if (p.isCancel(ans) || ans !== true) return TRUST_HINT(name)
  }
  const r = await trustCodexHooks([pluginId])
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

  const paths = codexHookPaths(resolveCodexHome(), name)
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
    if (await isCodexPluginInstalled(paths.pluginId)) {
      await recordObservedInstall(ctx.cwd, name, '', '')
      const trustPending = await ensureTrust(ctx, paths.pluginId)
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
    const cwd = getMcpSpawnCwd()
    const steps: string[][] = [
      ['plugin', 'marketplace', 'add', paths.marketplaceRoot],
      ['plugin', 'add', paths.pluginId],
    ]
    for (const args of steps) {
      const r = await runHarnessArgs('codex', args, cwd, 60_000)
      if (r.exitCode !== 0) {
        invalidateCodexPluginCache()
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
    invalidateCodexPluginCache()
    if (!(await isCodexPluginInstalled(paths.pluginId))) {
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
    const trustPending = await ensureTrust(ctx, paths.pluginId)
    await updateInstalled(ctx.cwd, name, '', '')
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

/** T7 — reverse of installCodexHook. Idempotent; codex CLI failures are reported. */
export async function removeCodexHook(
  manifestName: string,
  hookEvent: string,
): Promise<{ ok: true; removedPaths: string[] } | { ok: false; error: string }> {
  const paths = codexHookPaths(resolveCodexHome(), manifestName)
  return withCodexPluginLock(async () => {
    const cwd = getMcpSpawnCwd()
    // Collect trust keys BEFORE removal (hooks/list stops listing a removed plugin);
    // the deterministic key covers a codex that cannot list.
    const keys = new Set([codexHookTrustKey(paths.pluginName, hookEvent)])
    const listed = await listCodexHooks()
    if (listed.ok)
      for (const h of listed.value) if (h.key.startsWith(`${paths.pluginId}:`)) keys.add(h.key)

    if (await isCodexPluginInstalled(paths.pluginId)) {
      const r = await runHarnessArgs('codex', ['plugin', 'remove', paths.pluginId], cwd, 60_000)
      invalidateCodexPluginCache()
      if (r.exitCode !== 0)
        return {
          ok: false,
          error: formatSpawnFail('codex plugin remove', r.exitCode, r.stdout, r.stderr),
        }
    }
    // codex leaves the empty cache/<marketplace> dir behind (measured).
    await removeIfEmpty(paths.cacheMarketplaceDir)
    await untrustCodexHooks([...keys])

    const removed: string[] = []
    for (const dir of [paths.pluginDir, paths.dataDir]) {
      if (existsSync(dir)) {
        await rm(dir, { recursive: true, force: true })
        removed.push(dir)
      }
    }
    const remaining = await harnessedPluginDirs(paths.pluginsDir)
    if (remaining.length > 0) {
      await writeFile(
        paths.marketplaceJson,
        `${JSON.stringify(codexMarketplaceJson(remaining), null, 2)}\n`,
      )
    } else if (existsSync(paths.marketplaceRoot)) {
      const r = await runHarnessArgs(
        'codex',
        ['plugin', 'marketplace', 'remove', CODEX_HOOK_MARKETPLACE],
        cwd,
        60_000,
      )
      // "not configured" = already gone (marketplace remove is not idempotent, measured)
      if (r.exitCode !== 0 && !/not configured/i.test(`${r.stdout}${r.stderr}`))
        return {
          ok: false,
          error: formatSpawnFail('codex plugin marketplace remove', r.exitCode, r.stdout, r.stderr),
        }
      await rm(paths.marketplaceRoot, { recursive: true, force: true })
      removed.push(paths.marketplaceRoot)
    }
    return { ok: true, removedPaths: removed }
  })
}
