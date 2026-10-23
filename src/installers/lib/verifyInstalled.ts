import { codexHookPluginId } from './codexHookPlugin.js'
import { isHarnessedHookKey, listCodexHooks } from './codexHookTrust.js'
import { listCodexMcpServerMetadata } from './codexMcpServers.js'
import { err } from './err.js'
import { verifyGstackLease } from './gstackLease.js'
import { readPluginEnablement } from './readClaudeConfig.js'
import { verifySkillRuntime } from './skillRuntime.js'
import { DEFAULT_VERIFY_TIMEOUT_MS, spawnCmd } from './spawn.js'
import type { InstallContext, InstallResult } from './types.js'
import { formatVerifyFail } from './verifyMessage.js'

/** Verify only: presence detection never authorizes repairs or installation. */
export async function verifyInstalled(
  ctx: InstallContext,
  opts: { neutralCwd?: boolean } = {},
): Promise<InstallResult | null> {
  const install = ctx.manifest.spec.install
  const nativeStructural =
    ctx.hostContext?.hostId === 'codex' &&
    !ctx.opts.dryRun &&
    (install.method === 'mcp-stdio-add' ||
      install.method === 'mcp-http-add' ||
      install.method === 'cc-hook-add')
  if (
    ctx.hostContext?.hostId === 'codex' &&
    !ctx.opts.dryRun &&
    (install.method === 'mcp-stdio-add' || install.method === 'mcp-http-add')
  ) {
    const entries = await listCodexMcpServerMetadata(ctx.hostContext)
    const enabled = entries?.find((entry) => entry.name === ctx.manifest.metadata.name)?.enabled
    if (enabled !== true)
      return {
        ok: false,
        phase: 'verify',
        error: err(
          ctx,
          '/spec/verify/cmd',
          enabled === false
            ? `Codex MCP server ${ctx.manifest.metadata.name} is disabled.`
            : `Codex MCP enablement is unknown for ${ctx.manifest.metadata.name}; readiness is not established.`,
          enabled === false ? 'mcp-disabled' : 'mcp-enablement-unknown',
        ),
      }
  }
  if (
    ctx.hostContext &&
    !ctx.opts.dryRun &&
    (install.method === 'cc-plugin-marketplace' ||
      (install.method === 'cc-hook-add' && ctx.hostContext.hostId === 'codex'))
  ) {
    const id =
      install.method === 'cc-hook-add'
        ? codexHookPluginId(ctx.manifest.metadata.name)
        : install.cmd.match(/\bplugin\s+(?:install|add)\s+['"]?([^\s'"]+@[^\s'"]+)/)?.[1]
    const enabled = id ? await readPluginEnablement(id, ctx.hostContext) : null
    if (enabled !== true)
      return {
        ok: false,
        phase: 'verify',
        error: {
          ...err(
            ctx,
            '/spec/verify/cmd',
            enabled === false
              ? `Plugin ${id} is disabled; no automatic enablement or repair was attempted.`
              : `Plugin enablement is unknown for ${id ?? ctx.manifest.metadata.name}; readiness is not established.`,
            enabled === false ? 'plugin-disabled' : 'plugin-enablement-unknown',
          ),
        },
      }
  }
  if (ctx.hostContext?.hostId === 'codex' && install.method === 'cc-hook-add' && !ctx.opts.dryRun) {
    const id = codexHookPluginId(ctx.manifest.metadata.name)
    const listed = await listCodexHooks({ hostContext: ctx.hostContext, cwd: ctx.cwd })
    const hooks = listed.ok
      ? listed.value.filter(
          (hook) =>
            isHarnessedHookKey(hook.key) &&
            hook.key.startsWith(`${id}:`) &&
            (hook.pluginId === undefined || hook.pluginId === id),
        )
      : []
    if (
      !listed.ok ||
      hooks.length === 0 ||
      hooks.some((hook) => hook.trustStatus !== 'trusted' || !hook.currentHash.trim())
    ) {
      return {
        ok: false,
        phase: 'verify',
        error: err(
          ctx,
          '/spec/verify/cmd',
          `Codex hook trust is not established for ${id}${listed.ok ? '' : ` (${listed.failure})`}; no automatic trust or repair was attempted.`,
          'hook-trust-unresolved',
        ),
      }
    }
  }
  const declaredVerify = nativeStructural
    ? ctx.manifest.spec.harness_overrides?.codex?.verify
    : undefined
  // Structural evidence proves registration/enablement/trust, not authentication or runtime.
  if (nativeStructural && !declaredVerify) return null
  const verify = declaredVerify ?? ctx.manifest.spec.verify
  const result = await spawnCmd(
    ctx,
    verify.cmd,
    [],
    verify.timeout_ms ?? DEFAULT_VERIFY_TIMEOUT_MS,
    {
      posixShell: true,
      ...opts,
      envMode: 'verify',
    },
  )
  const systemFlag = install.method === 'npm-cli' && !/\bnpx\b/.test(install.cmd) ? ' --system' : ''
  const suggest = `Repair the existing installation or PATH, then rerun \`${verify.cmd}\`; or explicitly reinstall with \`harnessed setup --update-installed${systemFlag}\`. No automatic repair was attempted.`
  if (!('exitCode' in result)) {
    if (!('error' in result)) return result
    return {
      ...result,
      phase: result.phase === 'preflight' ? 'preflight' : 'verify',
      error: {
        ...result.error,
        path: '/spec/verify/cmd',
        message: `verify failed (cmd: ${verify.cmd}): ${result.error.message}`,
        suggest,
      },
    }
  }
  const expected = verify.expected_exit_code ?? 0
  if (result.exitCode === expected) {
    const leaseFailure = await verifyGstackLease(ctx)
    if (leaseFailure) return leaseFailure
    const runtime = await verifySkillRuntime(ctx)
    return runtime && 'error' in runtime
      ? { ...runtime, error: { ...runtime.error, suggest: runtime.error.suggest ?? suggest } }
      : runtime
  }
  return {
    ok: false,
    phase: 'verify',
    error: {
      ...err(
        ctx,
        '/spec/verify/cmd',
        formatVerifyFail(verify.cmd, result.exitCode, expected, result.stdout, result.stderr),
        'verify-failed',
      ),
      suggest,
    },
  }
}
