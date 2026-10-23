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

let cache: Promise<readonly CodexMcpServerMetadata[] | null> | null = null

export function invalidateCodexMcpCache(): void {
  cache = null
}

async function listOnce(): Promise<readonly CodexMcpServerMetadata[] | null> {
  try {
    const r = await runHarnessArgs('codex', ['mcp', 'list', '--json'], getMcpSpawnCwd(), 30_000)
    return r.exitCode === 0 ? parseCodexMcpMetadata(r.stdout) : null
  } catch {
    return null
  }
}

/** Shared memoized, sanitized listing; null = unknown, not known missing. */
export function listCodexMcpServerMetadata(): Promise<readonly CodexMcpServerMetadata[] | null> {
  cache = cache ?? listOnce()
  return cache
}

/** Memoized registered set; disabled entries still count as registered. */
export async function listCodexMcpServers(): Promise<Set<string> | null> {
  const servers = await listCodexMcpServerMetadata()
  return servers === null ? null : new Set(servers.map((server) => server.name))
}

export async function isCodexMcpServerRegistered(name: string): Promise<boolean> {
  const names = await listCodexMcpServers()
  return names ? names.has(name) : false
}
