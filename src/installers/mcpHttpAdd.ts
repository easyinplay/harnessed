// Phase 2.1 install method 3/6 — mcp-npm × mcp-http-add per ADR 0004 § 5 + ADR 0010 errata.
//
// v3.0.2 hotfix (scope flip): `--scope project` → `--scope user`. Sister
// mcpStdioAdd.ts v3.0.2 reasoning verbatim — `--scope project` writes
// `<cwd>/.mcp.json` which EPERMs in read-only CWD (C:\Windows\System32);
// `--scope user` writes `~/.claude.json` user-global, CWD-independent.
// The pre-v3.0.2 CC #54803 "user scope broken" bug has been resolved by the
// Claude Code team (verified via `claude mcp add --help` 2026-05-21).
//
// IMPL NOTE (Rule 1): hardcoded `--scope user` here cannot be overridden by
// manifest fields — the manifest cmd string is treated as audit-trail only;
// we authoritatively reconstruct the args array. Mirrors mcpStdioAdd.
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
//
// IMPL NOTE (v3.0.3 hotfix — verify reads ~/.claude.json directly): mirrors
// mcpStdioAdd v3.0.3 — drop spawn-based verify in favor of fs-based check
// against the authoritative `mcpServers` map.

import { checkCmdString } from '../manifest/security.js'
import { backup } from './lib/backup.js'
import { confirmAt } from './lib/confirm.js'
import { renderDiff } from './lib/diff.js'
import { err } from './lib/err.js'
import { isAlreadyInstalled } from './lib/idempotent.js'
import { preflight } from './lib/preflight.js'
import { isMcpServerRegistered } from './lib/readClaudeConfig.js'
import { runArgs } from './lib/runClaudeArgs.js'
import { getMcpSpawnCwd } from './lib/safeCwd.js'
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
  // v3.9.8 Cat G — sister mcpStdioAdd, pre-probe idempotent_check, always
  // honor user config (never re-modify regardless of opts.updateInstalled).
  if (await isAlreadyInstalled(ctx, { honorUpdateFlag: false })) {
    return { ok: true, alreadyInstalled: true, backupId: 'noop-idempotent' }
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

  // v3.0.2 hotfix: `--scope user` writes ~/.claude.json (user-global config,
  // CWD-independent). Pre-v3.0.2 `--scope project` writes <cwd>/.mcp.json
  // which EPERMs in read-only CWD. Mirrors mcpStdioAdd v3.0.2 scope flip.
  const addArgs = ['mcp', 'add', '--scope', 'user', '--transport', 'http', ...hdr.flat, name, url]

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

  // v3.0.2: diff target is ~/.claude.json (user-global, `--scope user`)
  // instead of <cwd>/.mcp.json (project-local). Entry shape per CC spec:
  // { [name]: { type: 'http', url, headers: {Key:Value} } } — non-stdio.
  const mcpFile = `${getMcpSpawnCwd()}/.claude.json`
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
  // regardless of spawn cwd, but the CC CLI may create temp files in cwd;
  // homedir() avoids EPERM when user launches harnessed from a read-only CWD.
  const spawnCwd = install.cwd ?? getMcpSpawnCwd()
  const r = await runArgs(addArgs, spawnCwd)
  if (r.exitCode !== 0) {
    // ADR 0004 idempotent contract: server already registered is not a failure.
    // v3.0.2: match on "already exists" substring (CC CLI error message no
    // longer mentions ".mcp.json" specifically with --scope user).
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
        `claude mcp add (http) exited ${r.exitCode}: ${r.stderr.slice(0, 200)}`,
        'install-failed',
      ),
    }
  }

  // v3.0.3 hotfix: verify reads ~/.claude.json directly via fs (no spawn).
  // Sister mcpStdioAdd v3.0.3 verify rationale verbatim — cross-platform,
  // instant, immune to cold-start timeout.
  const registered = await isMcpServerRegistered(name)
  if (!registered) {
    return {
      ok: false,
      phase: 'verify',
      backupId: bk.backupId,
      error: err(
        ctx,
        '/spec/verify/cmd',
        `verify: '${name}' not found in mcpServers map of ~/.claude.json after install spawn exit 0 (file may have been overwritten, or claude mcp add wrote to a non-default location)`,
        'verify-failed',
      ),
    }
  }

  await updateInstalled(ctx.cwd, name, install.npm_version, '')
  return { ok: true, backupId: bk.backupId, appliedFiles: [mcpFile] }
}
