// src/workflow/skipSubs.ts — 4.23.2 (issue #5 defect 2) shared skip-sub
// matching for the two gate-eval loops (src/cli/gates.ts + masterOrchestrator).
//
// delegates_to[].sub are BARE names (paranoid / multispec) but everything the
// user sees is the FLATTENED `<master>-<sub>` name (fire[] entries, slash
// commands: /verify-paranoid). `--skip-sub verify-paranoid` therefore silently
// missed the exact-match Set. Accept both spellings, and surface requested
// names that matched nothing instead of ignoring them silently.
//
// Extracted as its own module (not appended to an existing one) per the
// vi.mock-factory drift rule — sister precedent: src/cli/lib/gateContext.ts.

/** Return the requested name that skips `sub` (exact bare name, or the
 *  flattened `<master>-<sub>` alias), or null when nothing matches. */
// 4.31.0 (eval 首日战果) — `clarify` is the /auto SOP's historical name for the
// interactively-completed discuss work (`--skip-sub clarify` appears verbatim in
// every installed SKILL text), but auto's delegates clause is named `discuss`.
// Without this synonym every compliant /auto run prints a stray "ignored" warning
// (silently swallowed pre-4.23.2, exposed by the unmatched-skip warning).
// 4.32.22 — each entry is a BIDIRECTIONAL pair, not a one-way rewrite: the two
// spellings name the same work, and which one is the clause vs the requested name
// differs per master. /auto's clause is `discuss`, /task's is still `clarify`
// (workflows/task/auto/workflow.yaml:42), while the 4.32.20 SOP text prints
// `--skip-sub discuss` for BOTH — one-way matching let `gates task
// --skip-sub discuss` fire task-clarify, spawning a brainstorming subagent for
// clarification the main session had already done interactively.
//
// Pairing is PER-ENTRY and never transitive: matching only ever relates the two
// members of one entry, so adding a second entry that happens to share a value
// (e.g. `{ foo: 'discuss' }`) must not make `foo` a synonym of `clarify`.
const SKIP_SYNONYMS: Record<string, string> = { clarify: 'discuss' }

export function matchSkipSub(requested: Set<string>, sub: string, master: string): string | null {
  if (requested.has(sub)) return sub
  const alias = `${master}-${sub}`
  if (requested.has(alias)) return alias
  for (const [a, b] of Object.entries(SKIP_SYNONYMS)) {
    // Return the REQUESTED spelling (not `sub`) — warnUnmatchedSkips diffs the
    // matched set against `requested`, so reporting the clause name misfires.
    if (b === sub && requested.has(a)) return a
    if (a === sub && requested.has(b)) return b
  }
  return null
}

/** Warn once per requested skip name that matched no delegation clause. */
export function warnUnmatchedSkips(
  requested: Set<string>,
  matched: Set<string>,
  master: string,
  validSubs: string[],
  warn: (message: string) => void,
): void {
  for (const name of requested) {
    if (matched.has(name)) continue
    warn(
      `⚠️ --skip-sub "${name}" ignored: not a sub of master ${master}; ` +
        `valid subs: ${validSubs.join(', ')}`,
    )
  }
}
