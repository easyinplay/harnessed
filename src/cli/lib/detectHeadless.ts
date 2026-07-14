// src/cli/lib/detectHeadless.ts — 4.31.2 (issue #7). Decide whether the current
// `harnessed gates` run is inside a headless `claude -p` session, so the
// Agent-Teams-upgrade gate can be suppressed (Agent Teams are session-scoped and
// leave orphan subprocesses that block a headless host from exiting — the 11h
// hang documented in issue #7).
//
// Detection is deliberately narrow. Two candidate signals were probed and
// REJECTED as auto-detectors:
//   - CC `system/init` carries no entrypoint/headless field (only cwd/model/
//     permissionMode); nothing to read.
//   - `process.stdout.isTTY` is FALSE in both interactive and headless sessions
//     here, because `harnessed gates` is always a Bash-tool subprocess with piped
//     stdio. Flipping on isTTY would disable Agent Teams for every normal user
//     (mass false-positive). So isTTY is accepted as a param for the signature
//     but NEVER used to assert headless — it only annotates the diagnostic.
//
// The one reliable signal is the explicit `HARNESSED_HEADLESS=1` env contract:
// harnessed's own headless entry points set it (evidence-pack runner; and it is
// documented for CI/headless callers), and CC propagates env to the gates
// subprocess. Default is conservative: unknown → interactive (teams allowed).

export interface HeadlessResult {
  headless: boolean
  /** 'explicit-env' | 'none' — for the gate reason string / diagnostics. */
  signal: string
}

/** Pure. `isTTY` is diagnostic-only (see file header) — it never asserts
 *  headless on its own. Conservative default: absent signal ⇒ interactive. */
export function detectHeadless(env: NodeJS.ProcessEnv, _isTTY: boolean): HeadlessResult {
  if (env.HARNESSED_HEADLESS === '1') return { headless: true, signal: 'explicit-env' }
  return { headless: false, signal: 'none' }
}
