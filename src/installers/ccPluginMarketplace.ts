// Phase 2.1 install method 5/6 — cc-plugin × cc-plugin-marketplace per ADR
// 0004 § 5 + ADR 0005 + ADR 0010 errata D-20.
//
// v3.0.2 hotfix (scope flip): `--scope project` → `--scope user`. Sister
// mcpStdioAdd v3.0.2 reasoning — write to ~/.claude.json user-global config
// (CWD-independent) instead of <cwd>/.claude/settings.json (EPERMs in
// read-only CWD). CC #54803 user-scope-broken bug has been resolved.
//
// IMPL NOTE (Rule 1): hardcoded `--scope user` for `plugin install` step
// cannot be overridden by manifest fields; the manifest cmd string is
// informational; we authoritatively reconstruct args[].
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
// IMPL NOTE (v3.0.3 hotfix — verify reads ~/.claude.json directly): pre-v3.0.3
// verify spawned `claude plugin list --json` and stdout-matched the plugin
// name. Same timeout symptom as mcpStdioAdd v3.0.3 (cold-start exceeds 15s
// after sequential MCP adds). v3.0.3 reads `enabledPlugins` from
// `~/.claude.json` directly. Sister `readClaudeConfig.isPluginRegistered()`.

import { checkCmdString } from '../manifest/security.js'
import { backup } from './lib/backup.js'
import { confirmAt } from './lib/confirm.js'
import { renderDiff } from './lib/diff.js'
import { err } from './lib/err.js'
import { isAlreadyInstalled } from './lib/idempotent.js'
import { preflight } from './lib/preflight.js'
import { isPluginRegistered } from './lib/readClaudeConfig.js'
import { runArgs } from './lib/runClaudeArgs.js'
import { getMcpSpawnCwd } from './lib/safeCwd.js'
import { updateInstalled } from './lib/state.js'
import type { DiffPlan, Installer } from './lib/types.js'

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
  // v3.9.6 — idempotent_check probe (skip install if already-installed).
  if (await isAlreadyInstalled(ctx)) {
    return { ok: true, alreadyInstalled: true, backupId: 'noop-idempotent' }
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
  const pluginName = parsed.pluginAtMkt.split('@')[0] ?? parsed.pluginAtMkt

  // v3.0.2 hotfix: `--scope user` (writes ~/.claude.json) — CWD-independent,
  // EPERM-free in read-only launch dirs. Sister mcpStdioAdd v3.0.2 scope flip.
  const installArgs = ['plugin', 'install', parsed.pluginAtMkt, '--scope', 'user']
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

  // v3.0.2: `--scope user` writes ~/.claude.json (user-global enabledPlugins
  // map) instead of <cwd>/.claude/settings.json (project-local). Diff target
  // updated to mirror. No `--dry-run` flag on `claude plugin install` — cmd
  // echo remains the audit trail.
  const settingsFile = `${getMcpSpawnCwd()}/.claude.json`
  const newEntry = JSON.stringify({ enabledPlugins: { [parsed.pluginAtMkt]: true } }, null, 2)
  const plan: DiffPlan = {
    files: [
      {
        target: settingsFile,
        scope: 'HOME',
        oldText: '',
        newText: `// will be merged into ~/.claude.json enabledPlugins map by \`claude plugin install --scope user\`:\n${newEntry}\n`,
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

  // v3.0.2: spawn cwd at homedir() — `--scope user` writes ~/.claude.json
  // regardless of spawn cwd, but the CC CLI may create temp files in cwd;
  // homedir() avoids EPERM when user launches from a read-only CWD.
  const spawnCwd = install.cwd ?? getMcpSpawnCwd()

  // Step 1 — marketplace add (D-20: non-zero is non-fatal; step 2 is the decider).
  let stepOneStderr = ''
  if (parsed.marketplaceRef !== null) {
    const r1 = await runArgs(['plugin', 'marketplace', 'add', parsed.marketplaceRef], spawnCwd)
    stepOneStderr = r1.stderr
    // intentional: do not return on r1.exitCode !== 0
  }

  // Step 2 — plugin install. This is the authoritative outcome decider.
  const r2 = await runArgs(installArgs, spawnCwd)
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

  // v3.0.3 hotfix: verify reads ~/.claude.json directly via fs (no spawn).
  // Sister mcpStdioAdd v3.0.3 verify rationale.
  const registered = await isPluginRegistered(pluginName)
  if (!registered) {
    return {
      ok: false,
      phase: 'verify',
      backupId: bk.backupId,
      error: err(
        ctx,
        '/spec/verify/cmd',
        `verify: plugin '${pluginName}' not found in enabledPlugins map of ~/.claude.json after install spawn exit 0 (file may have been overwritten, or claude plugin install wrote to a non-default location)`,
        'verify-failed',
      ),
    }
  }

  await updateInstalled(ctx.cwd, ctx.manifest.metadata.name, install.git_ref, '')
  return { ok: true, backupId: bk.backupId, appliedFiles: [settingsFile] }
}
