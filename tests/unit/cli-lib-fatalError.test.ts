import { describe, expect, it } from 'vitest'
import { formatFatalEnvelope, wantsJsonEnvelope } from '../../src/cli/lib/fatalError.js'

// architecture review #10 — a `--json` invocation whose error ESCAPES to the
// process-root handlers (LockHeldError, fs faults, unknown master …) used to get
// only the human `error: …` line on stderr: nothing machine-parseable on stdout,
// so a driver loop / hook parsing stdout could not distinguish "failed" from
// "empty". The root handlers now ALSO print a JSON error envelope to stdout when
// the invocation asked for JSON.
describe('fatalError (#10 --json error envelope)', () => {
  it('wantsJsonEnvelope: true iff argv carries --json', () => {
    expect(wantsJsonEnvelope(['node', 'cli.mjs', 'resume', '--json'])).toBe(true)
    expect(wantsJsonEnvelope(['node', 'cli.mjs', 'eval', '--json', '--dir', 'x'])).toBe(true)
    expect(wantsJsonEnvelope(['node', 'cli.mjs', 'resume'])).toBe(false)
    expect(wantsJsonEnvelope([])).toBe(false)
  })

  it('formatFatalEnvelope: single-line JSON {error:{message}}', () => {
    const line = formatFatalEnvelope("unknown master 'x'")
    expect(line).not.toContain('\n')
    expect(JSON.parse(line)).toEqual({ error: { message: "unknown master 'x'" } })
  })

  it('formatFatalEnvelope: message is JSON-escaped verbatim (quotes/backslashes safe)', () => {
    const msg = 'EPERM: operation not permitted, mkdir "C:\\Program Files\\x"'
    expect(JSON.parse(formatFatalEnvelope(msg)).error.message).toBe(msg)
  })
})
