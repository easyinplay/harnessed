// Phase 60 — `HARNESSED_OFF=1`, the master kill switch.
//
// Purpose is A/B: running the same task with and without harnessed, without
// uninstalling it. Before this, the only way to get a clean control arm was to
// uninstall the hooks and put them back afterwards.
//
// Scope is the ALWAYS-ON surface — the four hook entry points that Claude Code
// fires on its own (`bin/harnessed-inject-state.mjs` for both UserPromptSubmit
// and the SessionStart `--invalidate` half, `bin/harnessed-stop-hook.mjs`,
// `harnessed check-docs --hook`, `scripts/dashboard.mjs`). Explicit CLI calls
// (`harnessed run`, `gates`, `checkpoint`) are deliberately NOT gated: in a
// control arm you simply do not invoke them, and a `harnessed run` that
// silently did nothing would be a worse trap than one that runs.
//
// Deliberately NOT the Trellis shape. Their `trellis ablate` snapshots and
// removes files inside a crash-safe transaction, because Trellis vendors its
// state INTO your project — comparing requires destructive removal. harnessed
// installs into the host (`~/.claude/`), and its own always-on footprint is the
// hooks above, so an env switch reaches the whole surface with no file movement
// and therefore no restore-conflict class at all.
//
// Sister, narrower switch: `HARNESSED_INJECT_PC_OFF=1` (4.38.0) mutes only the
// <project-context> half of per-turn injection. This one mutes everything.
// Same `=== '1'` convention: exact, so a stray `HARNESSED_OFF=0` or
// `HARNESSED_OFF=false` cannot read as "on" by truthiness.

/** True when the operator has switched harnessed's always-on surface off. */
export function isAblated(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.HARNESSED_OFF === '1'
}

/** The env var name, so callers and messages cannot drift from each other. */
export const ABLATION_ENV = 'HARNESSED_OFF'
