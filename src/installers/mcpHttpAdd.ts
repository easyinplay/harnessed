// Phase 2.1 install method 3/6 — mcp-npm × mcp-http-add per ADR 0004 § 5 + ADR 0010 errata.
//
// IMPL NOTE (Rule 1 / CC #54803): mandatory --scope project; user scope is
// broken (rules silently land in ~/.claude.json but Claude Code fails to read
// them back). hardcoded `--scope project` here cannot be overridden by manifest
// fields — the manifest cmd string is treated as audit-trail only; we
// authoritatively reconstruct the args array. Mirrors mcpStdioAdd discipline.
//
// IMPL NOTE (Rule 1 / D-16 — env-resolution carve-out): `--header` values may
// carry `${ENV_VAR}` references that look like shell escapes to B1's
// checkCmdString. We resolve `${VAR}` from `process.env` BEFORE arg
// construction, so the post-construction B1 re-screen sees plain values only.
// Unset env var → InstallError keyword:'env-unset' before we touch the network.
//
// IMPL NOTE (Rule 1 / D-15 hot path): schema does NOT carry typed `url` or
// `headers` fields (the install method schema has only cmd/cwd/env/args/
// npm_version/idempotent_check). We extract the URL and headers by parsing
// the manifest `install.cmd` string (already B1-screened by schema validate).
// This matches the architectural discipline of "cmd is audit-trail; we
// reconstruct args authoritatively". Headers parsing is conservative:
// `--header "Key: Value"` (quoted) or `--header Key:\ Value` (escaped).
//
// IMPL NOTE (Rule 1 / H2 sister review fix — defense in depth): bypass
// lib/spawn.ts (which checks the literal cmd string once via checkCmdString)
// because our args[] is constructed locally; instead, we re-run
// checkCmdString on EVERY args[i] right before spawn. Same posture as
// mcpStdioAdd.

import { spawn } from 'node:child_process'
import { checkCmdString } from '../manifest/security.js'
import { backup } from './lib/backup.js'
import { confirmAt } from './lib/confirm.js'
import { renderDiff } from './lib/diff.js'
import { err } from './lib/err.js'
import { preflight } from './lib/preflight.js'
import type { ProcResult } from './lib/runClaudeArgs.js'
import { runArgs } from './lib/runClaudeArgs.js'
import { updateInstalled } from './lib/state.js'
import type { DiffPlan, Installer } from './lib/types.js'

// D-16 — resolve ${ENV_VAR} placeholders from process.env BEFORE arg
// construction. Returns either the resolved value or throws-style {error}.
// Result `{ ok: false, missing: string }` lets the caller emit a clear
// InstallError with keyword:'env-unset' (single-cause failure, no fallback).
function resolveEnvVars(
  value: string,
): { ok: true; resolved: string } | { ok: false; missing: string } {
  const pattern = /\$\{([A-Z_][A-Z0-9_]*)\}/g
  let resolved = value
  let match: RegExpExecArray | null
  pattern.lastIndex = 0
  // biome-ignore lint/suspicious/noAssignInExpressions: standard regex walk
  while ((match = pattern.exec(value)) !== null) {
    const name = match[1]
    if (name === undefined) continue
    const v = process.env[name]
    if (v === undefined || v === '') {
      return { ok: false, missing: name }
    }
    resolved = resolved.replace(match[0], v)
  }
  return { ok: true, resolved }
}

// Parse `--header "Key: Value"` (quoted) or `--header Key:Value` tokens out of
// the manifest cmd. Returns a flat header list ['--header','K: V', ...]
// suitable for direct `claude mcp add` invocation. ${ENV_VAR} resolved here.
function resolveHeaders(
  cmd: string,
): { ok: true; flat: string[] } | { ok: false; missing: string } {
  const flat: string[] = []
  // Match: --header "..."  OR  --header '...'  OR  --header <non-space-token>
  const re = /--header\s+(?:"([^"]+)"|'([^']+)'|(\S+))/g
  let m: RegExpExecArray | null
  // biome-ignore lint/suspicious/noAssignInExpressions: standard regex walk
  while ((m = re.exec(cmd)) !== null) {
    const raw: string | undefined = m[1] ?? m[2] ?? m[3]
    if (raw === undefined || raw.length === 0) continue
    const res = resolveEnvVars(raw)
    if (!res.ok) return { ok: false, missing: res.missing }
    flat.push('--header', res.resolved)
  }
  return { ok: true, flat }
}

// Extract URL from cmd. mcp-http-add cmd shape (CC docs / ADR 0001 / phase 2.1
// research): `claude mcp add --scope project --transport http <name> <url>
// [--header "..."]...`. We pick the first http(s):// token.
function extractUrl(cmd: string): string | null {
  const m = cmd.match(/\bhttps?:\/\/\S+/)
  return m ? m[0] : null
}

export const installMcpHttpAdd: Installer = async (ctx) => {
  const install = ctx.manifest.spec.install
  if (install.method !== 'mcp-http-add') {
    return {
      ok: false,
      phase: 'preflight',
      error: err(
        ctx,
        '/spec/install/method',
        `installMcpHttpAdd received non-mcp-http-add method '${install.method}' (dispatch bug)`,
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
  const url = extractUrl(install.cmd)
  if (!url) {
    return {
      ok: false,
      phase: 'preflight',
      error: err(
        ctx,
        '/spec/install/cmd',
        `mcp-http-add cmd missing http(s):// URL token (parsed from install.cmd: '${install.cmd.slice(0, 80)}')`,
        'http-url-missing',
      ),
    }
  }

  // D-16: resolve --header ${ENV_VAR} BEFORE constructing addArgs. Unset env
  // var → fail clear, do not silently drop the header (would expose a public
  // unauth call to a presumed-auth server).
  const hdr = resolveHeaders(install.cmd)
  if (!hdr.ok) {
    return {
      ok: false,
      phase: 'preflight',
      error: {
        ...err(
          ctx,
          '/spec/install/cmd',
          `mcp-http-add --header references unset env var '${hdr.missing}'; set it (export ${hdr.missing}=...) or remove the header from the manifest`,
          'env-unset',
        ),
        suggest: `export ${hdr.missing}=<value> && harnessed install <name>`,
      },
    }
  }

  // Authoritative args — `--scope project` hardcoded (D-12, CC #54803,
  // transport-agnostic broken-user-scope). manifest cmd is informational only.
  const addArgs = [
    'mcp',
    'add',
    '--scope',
    'project',
    '--transport',
    'http',
    ...hdr.flat,
    name,
    url,
  ]

  // H2 defense-in-depth — re-screen each constructed arg. Header values were
  // env-resolved above, so no ${VAR} pattern reaches this check; URL is a
  // plain http(s) string.
  for (const a of addArgs) {
    const violation = checkCmdString(a)
    if (violation) {
      return {
        ok: false,
        phase: 'preflight',
        error: err(
          ctx,
          '/spec/install/cmd',
          `shell escape detected in constructed mcp-http-add arg '${a.slice(0, 60)}': ${violation.label} (${violation.hint})`,
          'security-gate-bypass',
        ),
      }
    }
  }

  // L3 fixed — diff shows .mcp.json will gain an entry. We simulate the entry
  // textually rather than calling `claude mcp add --dry-run` (CLI flag not
  // documented; unstable contract). Entry shape per CC spec:
  // { [name]: { type: 'http', url, headers: {Key:Value} } } — non-stdio.
  const mcpFile = `${ctx.cwd}/.mcp.json`
  // Reassemble headers as an object for the diff preview (purely informational).
  const headersObj: Record<string, string> = {}
  for (let i = 0; i < hdr.flat.length; i += 2) {
    const kv = hdr.flat[i + 1]
    if (!kv) continue
    const ci = kv.indexOf(':')
    if (ci > 0) headersObj[kv.slice(0, ci).trim()] = kv.slice(ci + 1).trim()
  }
  const entry =
    Object.keys(headersObj).length > 0
      ? { [name]: { type: 'http', url, headers: headersObj } }
      : { [name]: { type: 'http', url } }
  const newEntry = JSON.stringify(entry, null, 2)
  const plan: DiffPlan = {
    files: [
      {
        target: mcpFile,
        scope: 'PROJECT',
        oldText: '',
        newText: `// will be merged into .mcp.json mcpServers map by \`claude mcp add\`:\n${newEntry}\n`,
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

  const r = await runArgs(addArgs, install.cwd ?? ctx.cwd)
  if (r.exitCode !== 0) {
    // ADR 0004 idempotent contract (v1.0.4): "already exists in .mcp.json" is
    // not a failure — the server is already registered. Return ok + alreadyInstalled
    // so the outer CLI can classify it separately from a real failure.
    if (r.stderr.includes('already exists in .mcp.json')) {
      return { ok: true, alreadyInstalled: true, backupId: bk.backupId }
    }
    return {
      ok: false,
      phase: 'spawn',
      backupId: bk.backupId,
      error: err(
        ctx,
        '/spec/install/cmd',
        `claude mcp add (http) exited ${r.exitCode}: ${r.stderr.slice(0, 200)}`,
        'install-failed',
      ),
    }
  }

  // Verify via `claude mcp list` exit code piped through `grep -q <name>`.
  // For OAuth-authenticated servers a `claude mcp get <name>` exposes the
  // pending-auth surface, but exit-code-on-`mcp list` is the stable contract
  // matching mcpStdioAdd verify pattern (C2 discipline).
  const verifyShell = process.platform === 'win32' ? 'cmd.exe' : '/bin/sh'
  const verifyFlag = process.platform === 'win32' ? '/c' : '-c'
  const verifyLine = `claude mcp list | grep -q ${name}`
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

  await updateInstalled(ctx.cwd, name, install.npm_version, '')
  return { ok: true, backupId: bk.backupId, appliedFiles: [mcpFile] }
}
