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
export function matchSkipSub(requested: Set<string>, sub: string, master: string): string | null {
  if (requested.has(sub)) return sub
  const alias = `${master}-${sub}`
  if (requested.has(alias)) return alias
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
