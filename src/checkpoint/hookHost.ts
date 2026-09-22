// v16.0 Phase 64 (ADR 0041) — host + session identity for a hook process.
//
// A codex hook process has NO CODEX_* env (measured, codex-cli 0.154: the
// app-server replays its parent's env snapshot — which, when codex was started
// from a Claude Code terminal, even carries CLAUDE_CODE_SESSION_ID). So the
// codex plugin passes the host explicitly (`--platform codex` in the generated
// command literal) and the session id is read from the hook's stdin payload
// (`session_id` == the codex shell's CODEX_SESSION_ID, measured — the same key
// the CLI scopes the ledger with). Claude Code hooks never pass the flag and
// keep their env-based path byte-for-byte.
//
// Dependency-free (node: builtins only): bundled into bin/*.mjs by build-hooks.

/** `--platform <id>` from a hook argv, or null. */
export function platformArg(argv: readonly string[]): string | null {
  const i = argv.indexOf('--platform')
  const v = i >= 0 ? argv[i + 1] : undefined
  return v && !v.startsWith('-') ? v : null
}

/** An explicit `--platform <id>` wins over every detectPlatform() signal: it is
 *  the ADR 0040 level-1 explicit channel, delivered through HARNESSED_PLATFORM. */
export function applyPlatformArg(
  argv: readonly string[],
  env: NodeJS.ProcessEnv = process.env,
): string | null {
  const id = platformArg(argv)
  if (id) env.HARNESSED_PLATFORM = id
  return id
}

/** `session_id` from a hook stdin payload; undefined for anything malformed. */
export function sessionIdFromPayload(raw: string): string | undefined {
  try {
    const v = (JSON.parse(raw) as { session_id?: unknown } | null)?.session_id
    return typeof v === 'string' && v.trim() ? v.trim() : undefined
  } catch {
    return undefined
  }
}

/** The whole hook stdin, bounded: a hook must never hang the user's turn, so a
 *  stdin that does not close within `timeoutMs` resolves with what arrived. */
export function readHookStdin(timeoutMs = 1000): Promise<string> {
  if (process.stdin.isTTY) return Promise.resolve('')
  return new Promise((resolve) => {
    let data = ''
    const done = () => {
      clearTimeout(timer)
      process.stdin.removeAllListeners()
      process.stdin.pause()
      resolve(data)
    }
    const timer = setTimeout(done, timeoutMs)
    process.stdin.setEncoding('utf8')
    process.stdin.on('data', (c: string) => {
      data += c
    })
    process.stdin.on('end', done)
    process.stdin.on('error', done)
  })
}
