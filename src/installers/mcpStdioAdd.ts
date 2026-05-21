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
// IMPL NOTE (v3.0.2 hotfix — Windows `grep` not available): verify spawns
// `claude mcp list` directly and matches `<name>` against stdout using Node
// string-contains. Pre-v3.0.2 used `claude mcp list | grep -q <name>` shell
// pipe which failed on Windows cmd.exe/PowerShell (no grep). Per ASSUMPTIONS
// C2 the original intent was "exit-code is the stable contract, not stdout
// parsing" — but `mcp list` CLI output IS stable enough across CC versions
// to match by entry name, and string-contains is more portable than asking
// users to install Git-Bash. Both exit-code-zero AND name-in-stdout required.

import { spawn } from 'node:child_process'
import { checkCmdString } from '../manifest/security.js'
import { backup } from './lib/backup.js'
import { confirmAt } from './lib/confirm.js'
import { renderDiff } from './lib/diff.js'
import { err } from './lib/err.js'
import { preflight } from './lib/preflight.js'
import type { ProcResult } from './lib/runClaudeArgs.js'
import { runArgs } from './lib/runClaudeArgs.js'
import { getMcpSpawnCwd } from './lib/safeCwd.js'
import { updateInstalled } from './lib/state.js'
import type { DiffPlan, Installer } from './lib/types.js'

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

  const name = ctx.manifest.metadata.name
  const pkg = ctx.manifest.metadata.upstream.source
  const ver = install.npm_version
  // v3.0.2 hotfix: `--scope user` (writes ~/.claude.json user-global config,
  // CWD-independent) instead of `--scope project` (writes <cwd>/.mcp.json,
  // EPERM when user CWD is read-only). harnessed setup is an onboarding
  // command — MCP servers should be available cross-project after install,
  // not scoped to whatever ephemeral CWD the user launched from.
  const addArgs = [
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
  const mcpFile = `${getMcpSpawnCwd()}/.claude.json`
  const newEntry = JSON.stringify(
    { [name]: { type: 'stdio', command: 'npx', args: ['--yes', `${pkg}@${ver}`] } },
    null,
    2,
  )
  const plan: DiffPlan = {
    files: [
      {
        target: mcpFile,
        scope: 'HOME',
        oldText: '',
        newText: `// will be merged into ~/.claude.json mcpServers map by \`claude mcp add --scope user\`:\n${newEntry}\n`,
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

  // v3.0.2: spawn cwd at homedir() — `--scope user` writes to ~/.claude.json
  // regardless of spawn cwd, but the CC CLI may create temp files in cwd
  // during the write; using homedir() avoids EPERM when user launches
  // harnessed from a read-only CWD (e.g. C:\Windows\System32).
  const spawnCwd = install.cwd ?? getMcpSpawnCwd()
  const r = await runArgs(addArgs, spawnCwd)
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
        `claude mcp add exited ${r.exitCode}: ${r.stderr.slice(0, 200)}`,
        'install-failed',
      ),
    }
  }

  // v3.0.2 hotfix: verify uses `claude mcp list` + Node stdout match instead
  // of shell `grep -q <name>` pipe. Reasoning: `grep` is not installed on
  // Windows cmd.exe / PowerShell (only available via Git-Bash/WSL/MSYS2),
  // causing user-reported `'grep' is not recognized` on default Windows
  // shells. Node string-contains is cross-platform, faster (no extra shell
  // fork), and exit-code-equivalent to the old pipe.
  const vr = await new Promise<ProcResult & { stdout: string }>((resolve) => {
    const child = spawn('claude', ['mcp', 'list'], {
      cwd: spawnCwd,
      shell: process.platform === 'win32',
      windowsHide: true,
    })
    let stdout = ''
    let stderr = ''
    child.stdout?.setEncoding('utf8').on('data', (c: string) => {
      stdout += c
    })
    child.stderr?.setEncoding('utf8').on('data', (c: string) => {
      stderr += c
    })
    const timer = setTimeout(() => {
      child.kill('SIGKILL')
      resolve({ exitCode: -1, stderr: `${stderr}[timeout]`, stdout })
    }, 15_000)
    child.on('error', (e) => {
      clearTimeout(timer)
      resolve({ exitCode: -1, stderr: e.message, stdout })
    })
    child.on('close', (code) => {
      clearTimeout(timer)
      resolve({ exitCode: code ?? -1, stderr, stdout })
    })
  })
  if (vr.exitCode !== 0 || !vr.stdout.includes(name)) {
    return {
      ok: false,
      phase: 'verify',
      backupId: bk.backupId,
      error: err(
        ctx,
        '/spec/verify/cmd',
        `verify exit ${vr.exitCode} or '${name}' not in mcp list stdout: ${vr.stderr.slice(0, 200)}`,
        'verify-failed',
      ),
    }
  }

  await updateInstalled(ctx.cwd, name, ver, '')
  return { ok: true, backupId: bk.backupId, appliedFiles: [mcpFile] }
}
