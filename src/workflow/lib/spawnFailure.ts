// v16.0 Phase 66 T3 — the five named spawn failures.
//
// Deliberately NOT a new invention: this is the `TrustFailure` /
// `RpcOutcome<T>` pair from `src/installers/lib/codexHookTrust.ts:49-58`
// re-pointed at the spawn boundary (task_plan R5).
//
// Why a union and not five Error subclasses: the kind has to survive being
// thrown across `src/workflow/run.ts`'s catch, stored, compared and (later,
// T4) written into the leaf ledger. A string tag does all of that; an
// `instanceof` chain does none of it once the value has crossed a module or a
// JSON boundary.
//
// WHAT EACH KIND MEANS (the boundaries are load-bearing — the codex judge in
// ./codexExecSpawn.ts applies them in this order):
//
//   SpawnTimeout         our own wall-clock cap fired. The only retryable kind.
//   SpawnAuthFailed      the harness could not authenticate. Checked BEFORE the
//                        exit code, because an auth failure also exits non-zero
//                        and "you are logged out" is the actionable verdict.
//   SpawnExitNonZero     the process itself failed — non-zero exit, a signal, or
//                        it never started (ENOENT). NOTE the converse does NOT
//                        hold: exit 0 proves nothing (findings F6/F8).
//   SpawnRefused         we got a well-formed run whose answer is "I will not /
//                        cannot do that": the sandbox rejected a tool call, the
//                        agent role does not exist, a turn failed. Legitimate
//                        output, useless to us.
//   SpawnOutputMalformed we got a run but not the contractual OUTPUT: no last
//                        message, no terminating event, stdout that was not
//                        JSONL. Structure missing, no refusal to explain it.
//
// Refused vs Malformed in one line: Refused = the run told us why it failed;
// Malformed = the run did not tell us anything we can parse.

/** The five named failures. Order is the SPEC's enumeration order. */
export const SPAWN_FAILURES = [
  'SpawnTimeout',
  'SpawnExitNonZero',
  'SpawnOutputMalformed',
  'SpawnAuthFailed',
  'SpawnRefused',
] as const

export type SpawnFailure = (typeof SPAWN_FAILURES)[number]

/** Sister of `RpcOutcome<T>` (codexHookTrust.ts:56). */
export type SpawnOutcome<T> =
  | { ok: true; value: T }
  | { ok: false; failure: SpawnFailure; detail: string }

export function isSpawnFailure(v: unknown): v is SpawnFailure {
  return typeof v === 'string' && (SPAWN_FAILURES as readonly string[]).includes(v)
}

/** A spawn failure raised as an exception. `name` is the kind so a stack trace
 *  and a serialized `{name, message}` both still say which of the five it was. */
export class SpawnFailureError extends Error {
  constructor(
    public readonly failure: SpawnFailure,
    detail: string,
  ) {
    super(detail)
    this.name = failure
  }
}

/** Recover the kind from a thrown value, whichever spawn path raised it.
 *
 *  Both paths tag their errors with a `failure` field — `SpawnFailureError`
 *  above (codex subprocess) and sdkSpawn's `SpawnTimeoutError` /
 *  `SpawnFailError` (claude in-process). Reading the field instead of matching
 *  class identity keeps this module free of any import from sdkSpawn, so
 *  nothing drags `@anthropic-ai/claude-agent-sdk` into the codex path.
 *
 *  `undefined` means "not a spawn failure" — the caller keeps its own handling
 *  (e.g. run.ts's MaxIterationsExceededError branch). */
export function classifySpawnError(err: unknown): SpawnFailure | undefined {
  if (!err || typeof err !== 'object') return undefined
  const tag = (err as { failure?: unknown }).failure
  return isSpawnFailure(tag) ? tag : undefined
}

/** One retry, timeouts only (SPEC). A refusal, a malformed run, a non-zero exit
 *  and an auth failure are all deterministic: repeating them just burns quota. */
export function isRetryableSpawnFailure(failure: SpawnFailure): boolean {
  return failure === 'SpawnTimeout'
}
