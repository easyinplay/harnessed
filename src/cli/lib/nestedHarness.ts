import { detectPlatform } from '../../platform/platform.js'

/** issue #1 — detect that an in-process SDK spawn command (`harnessed run`,
 *  `harnessed research`) is being invoked from inside an AI harness session
 *  subprocess (the footgun: the nested spawn hangs). True ONLY when: no explicit
 *  override AND the active platform exposes a session id env (Phase 35 seam) AND
 *  it is set AND stdin is not an interactive TTY (the Bash-tool / piped case). A
 *  human at a real terminal (TTY) or CI (no session env) is left alone.
 *
 *  Shared so every in-process spawn entry point is guarded — `research` had no
 *  guard and reproduced the issue's 108s hang (external review L3). */
export function isNestedHarnessContext(): boolean {
  if (process.env.HARNESSED_ALLOW_NESTED === '1') return false
  const sessEnv = detectPlatform().sessionIdEnv
  if (!sessEnv) return false
  const sid = process.env[sessEnv]?.trim()
  if (!sid) return false
  return !process.stdin.isTTY
}
