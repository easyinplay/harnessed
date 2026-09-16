// Phase 5.2 W2 T2.1 — R10.4 path traversal guard (D-03 + D-08).
// Sister: src/cli/audit-log.ts REDACT_PATTERNS module-level pre-compile pattern.
// Pre-compile at module load (NOT inside guardPath — per PLAN sneak-block +
// RESEARCH § 3.1 Pitfall 4: do NOT use inside hot loop).
// D-08: PathTraversalError message generic — NOT echo user input (CSO veto).
// Karpathy hard limit ≤200L.

// D-03 LOCKED: 5 OWASP A1 path traversal vectors (CONTEXT.md D-03 L66-71).
const PATH_TRAVERSAL_PATTERNS: RegExp[] = [
  /\.\.\//, // (1) Unix dot-dot-slash: ../../etc/passwd
  /\.\.\\/, // (2) Windows backslash: ..\windows\system32
  // biome-ignore lint/suspicious/noControlCharactersInRegex: intentional null-byte injection detection (R10.4 D-03 OWASP A1 vector 3)
  /\x00/, // (3) Null byte injection: path\x00attack
  /%2[eE]%2[eE]/, // (4) URL-encoded dot-dot: %2e%2e%2fetc
  /%25[2][eE]%25[2][eE]/, // (5) Double-encoded: %252e%252e%252f
]

/** D-08: generic message — NOT echo back user input (attack reconnaissance leakage CSO veto). */
export class PathTraversalError extends Error {
  constructor() {
    super('path traversal attempt detected')
    this.name = 'PathTraversalError'
    Object.setPrototypeOf(this, PathTraversalError.prototype)
  }
}

/**
 * Guard a CLI argument that must be exactly ONE path segment — a sub-workflow
 * name, a backup timestamp, a manifest category or adapter name — before it is
 * joined into a path.
 *
 * `checkPathSafe` catches `../` and `..\` but not a bare `..`, and a bare `..`
 * is all it takes when the value is used as a segment: `harnessed rollback ..`
 * joined to the PARENT of the backup root and read a foreign `metadata.json`,
 * whose `files[].target` paths rollback then writes and unlinks. None of these
 * inputs legitimately contain a separator, so the strict rule is also the
 * correct one: non-empty, not `.`/`..`, no `/` or `\`, plus every
 * checkPathSafe vector. Throws PathTraversalError (generic message, D-08).
 */
export function checkSafeSegment(input: string): void {
  checkPathSafe(input)
  if (input === '' || input === '.' || input === '..' || /[\\/]/.test(input)) {
    throw new PathTraversalError()
  }
}

/**
 * Guard a user-supplied path/name against the 5 OWASP A1 traversal vectors.
 * Throws PathTraversalError on first match.
 * Safe: does NOT include user input in error message (D-08).
 * Call at CLI entry points only — NOT inside loops (RESEARCH § Pitfall 4).
 */
export function checkPathSafe(input: string): void {
  for (const re of PATH_TRAVERSAL_PATTERNS) {
    if (re.test(input)) throw new PathTraversalError()
  }
}
