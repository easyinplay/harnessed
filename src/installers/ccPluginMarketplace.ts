// Phase 2.1 install method 5/6 — cc-plugin × cc-plugin-marketplace per ADR
// 0004 § 5 + ADR 0005 + ADR 0010 errata D-20.
//
// IMPL NOTE (Rule 1 / D-11 + D-12 + CC #54803): `--scope project` hardcoded
// for the `plugin install` step — same broken-user-scope rationale as
// mcpStdioAdd. Cannot be overridden by manifest fields; the manifest cmd
// string is informational; we authoritatively reconstruct args[].
//
// IMPL NOTE (Rule 1 / D-20 idempotency): Two sequential spawns:
//   Step 1: `claude plugin marketplace add <url>`
//   Step 2: `claude plugin install <plugin>@<marketplace> --scope project`
// Step-1 non-zero exit is non-fatal IF step-2 succeeds — marketplace already
// being registered is a benign state ("already exists" is the most common
// step-1 failure on re-install). We do NOT pre-probe `marketplace list`
// (extra spawn, extra failure surface); we let step-2 decide.
//
// IMPL NOTE (Rule 1 / parse install.cmd): the install method schema does not
// carry typed `marketplace_url`/`marketplace_name`/`plugin_name` fields (it
// has only cmd + git_ref + idempotent_check + optional marketplace_source).
// We parse the manifest cmd which is the user-facing audit-trail string,
// matching the architectural discipline already established by mcpStdioAdd
// (cmd is informational; args reconstructed authoritatively).
//
// IMPL NOTE (Rule 1 / H2 sister review fix): re-screen each constructed arg
// before spawn — same defense-in-depth posture as mcpStdioAdd/mcpHttpAdd.
//
// IMPL NOTE (Rule 1 / C6): verify uses `claude plugin list` exit code via
// `grep -q <plugin>`; we do NOT parse stdout. CLI output format is not a
// stable contract; exit code is. Mirrors mcpStdioAdd verify discipline.

import { spawn } from 'node:child_process'
import { checkCmdString } from '../manifest/security.js'
import { backup } from './lib/backup.js'
import { confirmAt } from './lib/confirm.js'
import { renderDiff } from './lib/diff.js'
import { preflight } from './lib/preflight.js'
import { updateInstalled } from './lib/state.js'
import type { DiffPlan, InstallContext, InstallError, Installer } from './lib/types.js'

function err(ctx: InstallContext, path: string, message: string, keyword: string): InstallError {
  return { file: ctx.manifest.metadata.name, path, message, line: null, column: null, keyword }
}

interface ProcResult {
  exitCode: number
  stderr: string
}

function runArgs(claudeArgs: string[], cwd: string, timeoutMs = 15_000): Promise<ProcResult> {
  return new Promise((resolve) => {
    const isWin = process.platform === 'win32'
    const child = isWin
      ? spawn('cmd.exe', ['/c', 'claude', ...claudeArgs], { cwd, windowsHide: true })
      : spawn('claude', claudeArgs, { cwd, shell: false })
    let stderr = ''
    child.stderr?.setEncoding('utf8').on('data', (c: string) => {
      stderr += c
    })
    const timer = setTimeout(() => {
      child.kill('SIGKILL')
      resolve({ exitCode: -1, stderr: `${stderr}[timeout after ${timeoutMs}ms]` })
    }, timeoutMs)
    child.on('error', (e) => {
      clearTimeout(timer)
      resolve({ exitCode: -1, stderr: `${stderr}${e.message}` })
    })
    child.on('close', (code) => {
      clearTimeout(timer)
      resolve({ exitCode: code ?? -1, stderr })
    })
  })
}

// Parse `<plugin>@<marketplace>` and the marketplace URL/owner-repo from the
// manifest cmd. cmd shape (per real manifests + CC docs):
//   `/plugin marketplace add <owner/repo-or-url> && /plugin install <plugin>@<marketplace>`
// OR
//   `/plugin install <plugin>@<marketplace>`              (marketplace pre-registered)
// We extract:
//   - marketplaceRef:  the token after `marketplace add` (can be owner/repo or URL)
//   - pluginAtMkt:     the `<plugin>@<marketplace>` token after `plugin install`
interface ParsedCmd {
  marketplaceRef: string | null
  pluginAtMkt: string
}
function parseCmd(cmd: string): ParsedCmd | null {
  // marketplaceRef
  const mktMatch = cmd.match(/(?:\/?plugin)\s+marketplace\s+add\s+(\S+)/i)
  // pluginAtMkt — strip leading slash, strip trailing semicolons/&&
  const pluginMatch = cmd.match(/(?:\/?plugin)\s+install\s+(\S+)/i)
  if (!pluginMatch || pluginMatch[1] === undefined) return null
  const pluginAtMkt = pluginMatch[1].replace(/[;&]+$/, '')
  if (!pluginAtMkt.includes('@')) return null
  const mktRef = mktMatch && mktMatch[1] !== undefined ? mktMatch[1] : null
  return {
    marketplaceRef: mktRef,
    pluginAtMkt,
  }
}

export const installCcPluginMarketplace: Installer = async (ctx) => {
  const install = ctx.manifest.spec.install
  if (install.method !== 'cc-plugin-marketplace') {
    return {
      ok: false,
      phase: 'preflight',
      error: err(
        ctx,
        '/spec/install/method',
        `installCcPluginMarketplace received non-cc-plugin-marketplace method '${install.method}' (dispatch bug)`,
        'dispatch-mismatch',
      ),
    }
  }
  const pre = preflight(ctx)
  if (!pre.ok) {
    if (pre.abortReason === 'platform-mismatch')
      return { aborted: true, reason: 'platform-mismatch' }
    const e = pre.errors[0] ?? err(ctx, '/', 'preflight failed (no detail)', 'preflight')
    return { ok: false, phase: 'preflight', error: e }
  }

  const parsed = parseCmd(install.cmd)
  if (!parsed) {
    return {
      ok: false,
      phase: 'preflight',
      error: {
        ...err(
          ctx,
          '/spec/install/cmd',
          `cc-plugin-marketplace cmd must contain \`plugin install <plugin>@<marketplace>\` (parsed from: '${install.cmd.slice(0, 100)}')`,
          'cc-plugin-shape',
        ),
        suggest:
          'see manifests/tools/ralph-loop.yaml or manifests/tools/superpowers.yaml for shape',
      },
    }
  }
  const pluginName = parsed.pluginAtMkt.split('@')[0]

  // Step 2 args — `--scope project` hardcoded (D-12). Step-1 args optional.
  const installArgs = ['plugin', 'install', parsed.pluginAtMkt, '--scope', 'project']
  const allArgs: string[][] = []
  if (parsed.marketplaceRef !== null) {
    allArgs.push(['plugin', 'marketplace', 'add', parsed.marketplaceRef])
  }
  allArgs.push(installArgs)

  // H2 defense-in-depth — re-screen every arg of every step.
  for (const argSet of allArgs) {
    for (const a of argSet) {
      const violation = checkCmdString(a)
      if (violation) {
        return {
          ok: false,
          phase: 'preflight',
          error: err(
            ctx,
            '/spec/install/cmd',
            `shell escape detected in constructed cc-plugin arg '${a.slice(0, 60)}': ${violation.label} (${violation.hint})`,
            'security-gate-bypass',
          ),
        }
      }
    }
  }

  // L3 fixed — diff target is `.claude/settings.json` `enabledPlugins` key.
  // We simulate the entry textually (no `--dry-run` flag exists on
  // `claude plugin install`); the cmd echo is the audit trail.
  const settingsFile = `${ctx.cwd}/.claude/settings.json`
  const newEntry = JSON.stringify({ enabledPlugins: { [parsed.pluginAtMkt]: true } }, null, 2)
  const plan: DiffPlan = {
    files: [
      {
        target: settingsFile,
        scope: 'PROJECT',
        oldText: '',
        newText: `// will be merged into .claude/settings.json enabledPlugins map by \`claude plugin install\`:\n${newEntry}\n`,
      },
    ],
  }
  process.stdout.write(renderDiff(plan, ctx))

  const conf = await confirmAt('L3', { ...ctx, level: 'L3' })
  if (!conf.proceed) {
    const reason = conf.reason === 'flag-missing' ? 'level-flag-missing' : 'user-cancel'
    return { aborted: true, reason }
  }
  if (ctx.opts.dryRun) return { aborted: true, reason: 'user-cancel' }

  const bk = await backup(plan, ctx)
  if (!bk.ok) return { ok: false, phase: 'preflight', error: bk.error }

  // Step 1 — marketplace add (D-20: non-zero is non-fatal; step 2 is the decider).
  let stepOneStderr = ''
  if (parsed.marketplaceRef !== null) {
    const r1 = await runArgs(
      ['plugin', 'marketplace', 'add', parsed.marketplaceRef],
      install.cwd ?? ctx.cwd,
    )
    stepOneStderr = r1.stderr
    // intentional: do not return on r1.exitCode !== 0
  }

  // Step 2 — plugin install. This is the authoritative outcome decider.
  const r2 = await runArgs(installArgs, install.cwd ?? ctx.cwd)
  if (r2.exitCode !== 0) {
    return {
      ok: false,
      phase: 'spawn',
      backupId: bk.backupId,
      error: err(
        ctx,
        '/spec/install/cmd',
        `claude plugin install exited ${r2.exitCode}: ${r2.stderr.slice(0, 200)}${stepOneStderr ? ` | marketplace-add stderr: ${stepOneStderr.slice(0, 100)}` : ''}`,
        'install-failed',
      ),
    }
  }

  // Verify via `claude plugin list | grep -q <pluginName>`. C6: exit code is
  // the contract, not stdout parsing.
  const verifyShell = process.platform === 'win32' ? 'cmd.exe' : '/bin/sh'
  const verifyFlag = process.platform === 'win32' ? '/c' : '-c'
  const verifyLine = `claude plugin list --json | grep -q ${pluginName}`
  const violation = checkCmdString(verifyLine)
  if (violation) {
    return {
      ok: false,
      phase: 'verify',
      backupId: bk.backupId,
      error: err(
        ctx,
        '/spec/verify/cmd',
        `verify shell escape: ${violation.label}`,
        'security-gate-bypass',
      ),
    }
  }
  const vr = await new Promise<ProcResult>((resolve) => {
    const child = spawn(verifyShell, [verifyFlag, verifyLine], { cwd: ctx.cwd, windowsHide: true })
    let stderr = ''
    child.stderr?.setEncoding('utf8').on('data', (c: string) => {
      stderr += c
    })
    const timer = setTimeout(() => {
      child.kill('SIGKILL')
      resolve({ exitCode: -1, stderr: `${stderr}[timeout]` })
    }, 15_000)
    child.on('error', (e) => {
      clearTimeout(timer)
      resolve({ exitCode: -1, stderr: e.message })
    })
    child.on('close', (code) => {
      clearTimeout(timer)
      resolve({ exitCode: code ?? -1, stderr })
    })
  })
  if (vr.exitCode !== 0) {
    return {
      ok: false,
      phase: 'verify',
      backupId: bk.backupId,
      error: err(
        ctx,
        '/spec/verify/cmd',
        `verify exit ${vr.exitCode}: ${vr.stderr.slice(0, 200)}`,
        'verify-failed',
      ),
    }
  }

  await updateInstalled(ctx.cwd, ctx.manifest.metadata.name, install.git_ref, '')
  return { ok: true, backupId: bk.backupId, appliedFiles: [settingsFile] }
}
