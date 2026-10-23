// v16.0 post-close (ADR 0041) — "which MCP servers are registered", from the codex CLI.
//
// Replaces the `[mcp_servers.<name>]` header regex over ~/.codex/config.toml, which
// read the whole file into memory — including the plaintext `experimental_bearer_token`
// line — just to match a table header. Migrating it surfaced a second reader in the
// same pass (`probeSearchMcpKey` via `readUserClaudeJson`, guarded there), and with
// both closed ADR 0041's "harnessed neither writes nor reads config.toml" holds without
// an exception clause: `mcpConfigPath` now carries only its labelling duty (naming the
// write target in the diff plan shown to the user).
//
// Shape measured on codex-cli 0.155.1 (Windows) via an in-memory config override —
// `codex mcp list --json -c 'mcp_servers.<probe>={command="node",args=["-e",""]}'`,
// which reads nothing off disk and writes nothing, so it needs no cleanup and can
// never disturb the user's real config:
//
//   [ { "name": "<server>", "enabled": true, "disabled_reason": null,
//       "transport": { "type": "stdio", "command": …, "args": […], "env": null,
//                      "env_vars": [], "cwd": null },
//       "startup_timeout_sec": null, "tool_timeout_sec": null,
//       "auth_status": "unsupported" } ]
//
// A top-level ARRAY, unlike `codex plugin list --json`'s object. Registration is
// judged by `name` presence alone: `enabled: false` still means registered, and the
// callers (install idempotence + post-install verify) must not try to re-add a server
// the user has deliberately disabled.
//
// No plain-table fallback, deliberately. `codex plugin list` has one because a codex
// without `--json` was a real possibility there; here the flag is present on the
// pinned version, and a table parser would have to chew through output that can carry
// bearer tokens in the HTTP-transport rows. Unknown stays null in the listing
// APIs; the legacy boolean API returns false when registration cannot be confirmed.
//
// One spawn costs ~1.7 s and setup probes several manifests, so the listing is
// memoized per process. Installers MUST invalidate after adding a server: the
// idempotence pre-check populates the memo BEFORE the add, so a stale memo would make
// the post-add verify look at a set that cannot contain the new name.
//
// Own module (not a readClaudeConfig export): tests factory-mock readClaudeConfig, and
// adding an export to a factory-mocked module breaks every mocker of it.

import { resolve } from 'node:path'
import {
  captureHostInstallContext,
  type HostInstallContext,
} from '../../platform/hostInstallContext.js'
import { runHarnessArgs } from './runClaudeArgs.js'
import { getMcpSpawnCwd } from './safeCwd.js'

/** Only registration and enablement metadata; never transport or credentials. */
export interface CodexMcpServerMetadata {
  readonly name: string
  readonly enabled: boolean | null
}

export function parseCodexMcpMetadata(stdout: string): readonly CodexMcpServerMetadata[] | null {
  const text = stdout.trim()
  if (!text.startsWith('[')) return null
  try {
    const parsed = JSON.parse(text) as unknown
    if (!Array.isArray(parsed)) return null
    const servers: CodexMcpServerMetadata[] = []
    for (const entry of parsed as { name?: unknown; enabled?: unknown }[]) {
      if (typeof entry?.name === 'string' && entry.name !== '') {
        servers.push({
          name: entry.name,
          enabled: typeof entry.enabled === 'boolean' ? entry.enabled : null,
        })
      }
    }
    return servers
  } catch {
    return null
  }
}

/** Registered server names, or null when the listing is unrecognizable. */
export function parseCodexMcpList(stdout: string): Set<string> | null {
  const servers = parseCodexMcpMetadata(stdout)
  return servers === null ? null : new Set(servers.map((server) => server.name))
}

const cache = new Map<string, Promise<readonly CodexMcpServerMetadata[] | null>>()
function cacheKey(context?: HostInstallContext): string {
  const c = context ?? captureHostInstallContext({ hostId: 'codex' })
  return JSON.stringify([c.hostId, c.os, resolve(c.userHome), resolve(c.nativeHome)])
}

export function invalidateCodexMcpCache(context?: HostInstallContext): void {
  if (context) cache.delete(cacheKey(context))
  else cache.clear()
}

async function listOnce(
  context?: HostInstallContext,
): Promise<readonly CodexMcpServerMetadata[] | null> {
  if (context && context.hostId !== 'codex') return null
  try {
    const r = context
      ? await runHarnessArgs(
          'codex',
          ['mcp', 'list', '--json'],
          getMcpSpawnCwd(context),
          30_000,
          context,
        )
      : await runHarnessArgs('codex', ['mcp', 'list', '--json'], getMcpSpawnCwd(), 30_000)
    return r.exitCode === 0 ? parseCodexMcpMetadata(r.stdout) : null
  } catch {
    return null
  }
}

/** Shared memoized, sanitized listing; null = unknown, not known missing. */
export function listCodexMcpServerMetadata(
  context?: HostInstallContext,
): Promise<readonly CodexMcpServerMetadata[] | null> {
  const key = cacheKey(context)
  let result = cache.get(key)
  if (!result) {
    result = listOnce(context)
    cache.set(key, result)
  }
  return result
}

/** Memoized registered set; disabled entries still count as registered. */
export async function listCodexMcpServers(
  context?: HostInstallContext,
): Promise<Set<string> | null> {
  const servers = await listCodexMcpServerMetadata(context)
  return servers === null ? null : new Set(servers.map((server) => server.name))
}

export async function isCodexMcpServerRegistered(
  name: string,
  context?: HostInstallContext,
): Promise<boolean> {
  const names = await listCodexMcpServers(context)
  return names ? names.has(name) : false
}
