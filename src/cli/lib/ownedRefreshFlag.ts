// Hidden internal handover flag — NOT a public command.
//
// Issue #35: after a compiled-binary self-update the NEW binary owns the NEW
// assets (`<stateRoot>/assets/<newVersion>`, unpacked by compile/entry.ts on the
// new binary's first start). Only the NEW binary can therefore install the NEW
// workflow skills, re-register the owned hooks, and delete the stale legacy
// command files. The OLD binary hands that work over through this flag — the
// same shape as the npm channel's `--update-continuation` handover.
//
// Deliberately NOT a commander subcommand: the CLI surface contract pins the
// public top-level command set (32) and requires every public command to be
// documented in all 10 README locales. This flag must stay invisible in both.
//
// Own module (not ownedRefresh.ts) so `src/cli.ts` can recognise the flag
// without pulling the installer graph into every CLI start.
export const OWNED_REFRESH_FLAG = '--internal-owned-refresh'
