// src/cli/lib/runDeps.ts — injected side-effect seam for extracted CLI
// orchestration bodies (4.31.0 eval Slice A wave 0, CEO plan scope 0).
//
// The commander actions in cli/checkpoint.ts and cli/gates.ts delegate to
// exported run* functions that take this deps bundle. Production default =
// the real process/console (byte-identical behavior; existing tests spy on
// process.exit/console.* and are untouched). The eval runner passes a
// throwing exit (ExitError sentinel — the SAME convention the test harnesses
// already use, e.g. tests/cli/checkpoint.test.ts runCli) plus capturing
// printers, so scenarios drive the REAL guard orchestration in-process.

/** Sentinel thrown by non-process exits. Mirrors the shape the cli test
 *  harnesses construct locally (`process.exit(${code})` message + code). */
export class ExitError extends Error {
  constructor(public readonly code: number) {
    super(`process.exit(${code})`)
    this.name = 'ExitError'
  }
}

export interface RunDeps {
  /** Terminate the run. MUST not return — either process.exit or throw. */
  exit(code: number): never
  log(...args: unknown[]): void
  error(...args: unknown[]): void
  warn(...args: unknown[]): void
}

/** Production deps — the extracted bodies behave byte-identically to the
 *  pre-extraction inline closures. */
export const defaultRunDeps: RunDeps = {
  exit(code: number): never {
    return process.exit(code)
  },
  log: (...args: unknown[]) => {
    console.log(...args)
  },
  error: (...args: unknown[]) => {
    console.error(...args)
  },
  warn: (...args: unknown[]) => {
    console.warn(...args)
  },
}

/** Eval/test helper — throwing exit + captured output. */
export function captureRunDeps(): {
  deps: RunDeps
  stdout: string[]
  stderr: string[]
} {
  const stdout: string[] = []
  const stderr: string[] = []
  const deps: RunDeps = {
    exit(code: number): never {
      throw new ExitError(code)
    },
    log: (...args: unknown[]) => {
      stdout.push(args.map(String).join(' '))
    },
    error: (...args: unknown[]) => {
      stderr.push(args.map(String).join(' '))
    },
    warn: (...args: unknown[]) => {
      stderr.push(args.map(String).join(' '))
    },
  }
  return { deps, stdout, stderr }
}
