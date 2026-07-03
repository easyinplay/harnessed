// Phase 1.2 install method 2/2 — mcp-npm × mcp-stdio-add per ADR 0004 § 5.
//
// v3.0.2 hotfix (scope flip): `--scope project` → `--scope user`. The pre-
// v3.0.2 `--scope project` writes `<cwd>/.mcp.json`, which fails with EPERM
// when user runs `harnessed setup` from a read-only CWD (e.g. PowerShell
// default `C:\Windows\System32`). `--scope user` writes `~/.claude.json`
// user-global config, which is what `harnessed setup` actually wants (MCP
// servers should be available across all projects after onboarding, not
// only the current cwd).
//
// The pre-v3.0.2 IMPL NOTE referenced CC #54803 "user scope broken" — that
// CC bug has since been resolved by the Claude Code team; `--scope user`
// now reads back correctly. Verified via `claude mcp add --help` (2026-05-21).
//
// IMPL NOTE (Rule 1): hardcoded `--scope user` here cannot be overridden by
// manifest fields — the manifest cmd string is treated as audit-trail only;
// we authoritatively reconstruct the args array.
//
// IMPL NOTE (Rule 1 / H2 sister review fix — defense in depth): we bypass
// lib/spawn.ts (which checks the literal cmd string once via checkCmdString)
// because our args[] is constructed locally; instead, we re-run
// checkCmdString on EVERY args[i] right before spawn. This catches any
// future caller (phase 1.4 routing, test harness) that hands us a manifest
// where metadata.upstream.source / metadata.name / install.npm_version
// contains shell escapes — the schema-level B1 gate did not screen these
// non-cmd fields, so the runtime gate must.
//
// IMPL NOTE (v3.0.3 hotfix — verify reads ~/.claude.json directly): pre-v3.0.3
// verify spawned `claude mcp list` and string-matched the server name in
// stdout. User reports on Windows the spawn-based verify still times out 15s
// after 3 sequential `claude mcp add` calls (warm process pool exhausted),
// surfacing as `verify exit -1 ... [timeout]`. The underlying `claude mcp add
// --scope user` did succeed — `~/.claude.json` was written — but the verify
// spawn could not complete in budget. v3.0.3 reads `~/.claude.json` directly
// via `fs.readFile` + `JSON.parse` + `mcpServers[name]` check (sister
// `readClaudeConfig.ts`). Same authority (the file IS the contract; CC reads
// it on startup), zero spawn, zero timeout risk, cross-platform.

import { checkCmdString } from '../manifest/security.js'
import { backup } from './lib/backup.js'
import { confirmAt } from './lib/confirm.js'
import { renderDiff } from './lib/diff.js'
import { err } from './lib/err.js'
import { isAlreadyInstalled } from './lib/idempotent.js'
import { detectPlatform } from './lib/platform.js'
import { preflight } from './lib/preflight.js'
import { isMcpServerRegistered } from './lib/readClaudeConfig.js'
import { runHarnessArgs } from './lib/runClaudeArgs.js'
import { getMcpSpawnCwd } from './lib/safeCwd.js'
import { updateInstalled } from './lib/state.js'
import type { DiffPlan, Installer } from './lib/types.js'
import { formatSpawnFail } from './lib/verifyMessage.js'

export const installMcpStdioAdd: Installer = async (ctx) => {
  const install = ctx.manifest.spec.install
  if (install.method !== 'mcp-stdio-add') {
    return {
      ok: false,
      phase: 'preflight',
      error: err(
        ctx,
        '/spec/install/method',
        `installMcpStdioAdd received non-mcp-stdio-add method '${install.method}' (dispatch bug)`,
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
  // v3.9.8 Cat G — pre-probe idempotent_check (read-only; e.g. `claude mcp list
  // | grep -q tavily`). MCP installer ALWAYS honors user config — ignores
  // ctx.opts.updateInstalled so force-update never re-modifies ~/.claude.json
  // mcpServers (v3.9.6 dogfood concern: avoid overwriting hand-tuned MCP entries).
  if (await isAlreadyInstalled(ctx, { honorUpdateFlag: false })) {
    return { ok: true, alreadyInstalled: true, backupId: 'noop-idempotent' }
  }

  const name = ctx.manifest.metadata.name
  const pkg = ctx.manifest.metadata.upstream.source
  const ver = install.npm_version
  // v4.14.0 — platform routing. claude keeps the v3.0.2 shape verbatim; codex
  // uses its own CLI (`codex mcp add <name> -- <command...>` — no --scope /
  // --transport flags, findings.md research). Any OTHER harness id has no MCP
  // write path → honest 'harness-mismatch' skip, never a claude-CLI side effect.
  const platform = detectPlatform()
  if (platform.id !== 'claude' && platform.id !== 'codex') {
    return { aborted: true, reason: 'harness-mismatch' }
  }
  const bin = platform.id
  // v3.0.2 hotfix (claude): `--scope user` (writes ~/.claude.json user-global
  // config, CWD-independent) instead of `--scope project` (writes <cwd>/.mcp.json,
  // EPERM when user CWD is read-only). harnessed setup is an onboarding
  // command — MCP servers should be available cross-project after install,
  // not scoped to whatever ephemeral CWD the user launched from.
  const addArgs =
    bin === 'codex'
      ? ['mcp', 'add', name, '--', 'npx', '--yes', `${pkg}@${ver}`]
      : [
          'mcp',
          'add',
          '--scope',
          'user',
          '--transport',
          'stdio',
          name,
          '--',
          'npx',
          '--yes',
          `${pkg}@${ver}`,
        ]

  // H2 defense-in-depth — re-screen each constructed arg. metadata.name and
  // metadata.upstream.source pass through B1 only as YAML scalars; never as
  // shell tokens. Re-check in case a future schema change relaxes those fields.
  for (const a of addArgs) {
    const violation = checkCmdString(a)
    if (violation) {
      return {
        ok: false,
        phase: 'preflight',
        error: err(
          ctx,
          '/spec/install/cmd',
          `shell escape detected in constructed mcp-add arg '${a.slice(0, 60)}': ${violation.label} (${violation.hint})`,
          'security-gate-bypass',
        ),
      }
    }
  }

  // v3.0.2: diff target is ~/.claude.json (user-global config) instead of
  // <cwd>/.mcp.json (project-local config). `--scope user` flag writes to
  // ~/.claude.json. Simulate entry textually — `claude mcp add --dry-run`
  // CLI flag is not documented, relying on it would be unstable contract.
  // v4.14.0: codex target is ~/.codex/config.toml [mcp_servers.<name>] table
  // (written by `codex mcp add`).
  const mcpFile = bin === 'codex' ? platform.mcpConfigPath : `${getMcpSpawnCwd()}/.claude.json`
  const newEntry = JSON.stringify(
    { [name]: { type: 'stdio', command: 'npx', args: ['--yes', `${pkg}@${ver}`] } },
    null,
    2,
  )
  const mergeNote =
    bin === 'codex'
      ? `// will be written as [mcp_servers.${name}] into ~/.codex/config.toml by \`codex mcp add\`:`
      : '// will be merged into ~/.claude.json mcpServers map by `claude mcp add --scope user`:'
  const plan: DiffPlan = {
    files: [
      {
        target: mcpFile,
        scope: 'HOME',
        oldText: '',
        newText: `${mergeNote}\n${newEntry}\n`,
      },
    ],
  }
  if (!ctx.opts.quiet) process.stdout.write(renderDiff(plan, ctx))

  const conf = await confirmAt('L3', { ...ctx, level: 'L3' })
  if (!conf.proceed) {
    const reason = conf.reason === 'flag-missing' ? 'level-flag-missing' : 'user-cancel'
    return { aborted: true, reason }
  }
  if (ctx.opts.dryRun) return { aborted: true, reason: 'user-cancel' }

  const bk = await backup(plan, ctx)
  if (!bk.ok) return { ok: false, phase: 'preflight', error: bk.error }

  // v3.0.2: spawn cwd at homedir() — `--scope user` writes to ~/.claude.json
  // regardless of spawn cwd, but the CC CLI may create temp files in cwd
  // during the write; using homedir() avoids EPERM when user launches
  // harnessed from a read-only CWD (e.g. C:\Windows\System32).
  const spawnCwd = install.cwd ?? getMcpSpawnCwd()
  const r = await runHarnessArgs(bin, addArgs, spawnCwd)
  if (r.exitCode !== 0) {
    // ADR 0004 idempotent contract (v1.0.4): server already registered is
    // not a failure. The pre-v3.0.2 error string was "already exists in
    // .mcp.json"; with --scope user the CC CLI now reports it as
    // "already exists in" the user-config (~/.claude.json or similar).
    // Match on the stable "already exists" substring.
    if (r.stderr.includes('already exists')) {
      return { ok: true, alreadyInstalled: true, backupId: bk.backupId }
    }
    return {
      ok: false,
      phase: 'spawn',
      backupId: bk.backupId,
      error: err(
        ctx,
        '/spec/install/cmd',
        // v4.16.3 — formatSpawnFail parity with the other 4 installers
        // (tail-END + stdout fallback; CC CLI errors can land on stdout).
        formatSpawnFail(`${bin} mcp add`, r.exitCode, r.stdout, r.stderr),
        'install-failed',
      ),
    }
  }

  // v3.0.3 hotfix: verify reads ~/.claude.json directly via fs (no spawn).
  // `~/.claude.json` is the authoritative file CC reads on startup; `claude
  // mcp list` is just a pretty-printer over the same data. Reading the file
  // is cross-platform, instantaneous, and immune to the v3.0.2 cold-start
  // timeout that surfaced when 3 MCP installers ran sequentially in setup.
  const registered = await isMcpServerRegistered(name)
  if (!registered) {
    // v4.14.0 — config label follows the platform (claude JSON map vs codex
    // TOML table); claude wording is byte-identical to pre-4.14.0.
    const cfgLabel =
      bin === 'codex'
        ? '[mcp_servers] table of ~/.codex/config.toml'
        : 'mcpServers map of ~/.claude.json'
    return {
      ok: false,
      phase: 'verify',
      backupId: bk.backupId,
      error: err(
        ctx,
        '/spec/verify/cmd',
        `verify: '${name}' not found in ${cfgLabel} after install spawn exit 0 (file may have been overwritten, or ${bin} mcp add wrote to a non-default location)`,
        'verify-failed',
      ),
    }
  }

  await updateInstalled(ctx.cwd, name, ver, '')
  return { ok: true, backupId: bk.backupId, appliedFiles: [mcpFile] }
}
