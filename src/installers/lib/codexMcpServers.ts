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
// bearer tokens in the HTTP-transport rows. Unknown → `null` → callers treat it as
// "not registered" (fail-closed: a verify that cannot confirm must not pass).
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

/** Registered server names, or null when the listing is unrecognizable. */
export function parseCodexMcpList(stdout: string): Set<string> | null {
  const text = stdout.trim()
  if (!text.startsWith('[')) return null
  try {
    const parsed = JSON.parse(text) as unknown
    if (!Array.isArray(parsed)) return null
    const names = new Set<string>()
    for (const entry of parsed as { name?: unknown }[]) {
      if (typeof entry?.name === 'string' && entry.name !== '') names.add(entry.name)
    }
    return names
  } catch {
    return null
  }
}

let cache: Promise<Set<string> | null> | null = null

export function invalidateCodexMcpCache(): void {
  cache = null
}

async function listOnce(): Promise<Set<string> | null> {
  const r = await runHarnessArgs('codex', ['mcp', 'list', '--json'], getMcpSpawnCwd(), 30_000)
  return r.exitCode === 0 ? parseCodexMcpList(r.stdout) : null
}

/** Memoized registered set; null = unknown (codex absent / unparseable). */
export function listCodexMcpServers(): Promise<Set<string> | null> {
  cache = cache ?? listOnce()
  return cache
}

export async function isCodexMcpServerRegistered(name: string): Promise<boolean> {
  const names = await listCodexMcpServers()
  return names ? names.has(name) : false
}
