import { err } from './err.js'
import { verifyGstackLease } from './gstackLease.js'
import { verifySkillRuntime } from './skillRuntime.js'
import { DEFAULT_VERIFY_TIMEOUT_MS, spawnCmd } from './spawn.js'
import type { InstallContext, InstallResult } from './types.js'
import { formatVerifyFail } from './verifyMessage.js'

/** Verify only: presence detection never authorizes repairs or installation. */
export async function verifyInstalled(
  ctx: InstallContext,
  opts: { neutralCwd?: boolean } = {},
): Promise<InstallResult | null> {
  const verify = ctx.manifest.spec.verify
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
  const install = ctx.manifest.spec.install
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
