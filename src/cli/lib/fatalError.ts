// src/cli/lib/fatalError.ts — architecture review #10: the --json error envelope
// for ESCAPED failures.
//
// Every commander action that offers `--json` emits its own structured result on
// the happy/handled paths (resume prints the full result object, advance prints
// {next, unit, hint}, …). But an error that ESCAPES the action (LockHeldError,
// fs faults, unknown master …) lands in the process-root unhandledRejection /
// uncaughtException handlers in src/cli.ts, which printed only the human
// `error: …` line on stderr — a machine consumer parsing stdout (driver loops:
// `while harnessed advance --json; do…`, the generated /auto pre-exec, hooks)
// saw exit 1 with an EMPTY stdout and could not surface WHY.
//
// These helpers are the testable core the root handlers wire up: when the argv
// asked for JSON, ALSO print a single-line {error:{message}} envelope to stdout
// (the machine channel) before the human stderr line + exit 1. Scope is the
// literal `--json` flag — commands whose stdout is JSON by contract without a
// flag (gates) still signal via exit code; adding per-command sniffing here
// would couple this leaf to the command roster.

/** true ⇔ this invocation asked for machine-readable output. */
export function wantsJsonEnvelope(argv: string[]): boolean {
  return argv.includes('--json')
}

/** Single-line JSON error envelope for stdout. Shape {error:{message}} keeps it
 *  disjoint from every command's success payload (none has a top-level `error`),
 *  so `JSON.parse(stdout).error` is a reliable failure probe. */
export function formatFatalEnvelope(message: string): string {
  return JSON.stringify({ error: { message } })
}
