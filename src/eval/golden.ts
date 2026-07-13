// src/eval/golden.ts — golden load/write/normalize/diff (4.31.0 Slice A, T3).
//
// Determinism contract (CEO plan rev2 issue 2 + final-review note):
// - abs tmp paths → `<TMP>` placeholder. The RUNNER passes realpath'd roots
//   (fs.realpath first — Windows os.tmpdir() may return an 8.3 short path like
//   `EASYI~1`, while engine outputs carry the long form; without realpath the
//   replacement would miss).
// - `\` → `/` separator unification (goldens recorded on Windows must compare
//   equal on the ubuntu CI step; engine outputs are the only backslash source).
// - timestamp fields stripped recursively (started_at/completed_at/paused_at/
//   timestamp): state.ts/engineHook.ts stamp `new Date()` without an injection
//   seam — stripping is the documented fallback, not laziness.

import { readFileSync, writeFileSync } from 'node:fs'

const TIMESTAMP_KEYS = new Set(['started_at', 'completed_at', 'paused_at', 'timestamp'])

function normalizeString(s: string, roots: string[]): string {
  let out = s
  for (const root of roots) {
    // Replace both separator spellings of each root.
    const fwd = root.replace(/\\/g, '/')
    out = out.split(root).join('<TMP>')
    out = out.split(fwd).join('<TMP>')
  }
  return out.replace(/\\/g, '/')
}

/** Recursively normalize an engine-output value for golden storage/compare. */
export function normalizeGolden(value: unknown, tmpRoots: string[]): unknown {
  if (typeof value === 'string') return normalizeString(value, tmpRoots)
  if (Array.isArray(value)) return value.map((v) => normalizeGolden(v, tmpRoots))
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (TIMESTAMP_KEYS.has(k)) continue
      out[k] = normalizeGolden(v, tmpRoots)
    }
    return out
  }
  return value
}

/** null when the golden file does not exist / is unreadable (MISSING-GOLDEN
 *  at the runner layer); throws never. */
export function loadGolden(path: string): unknown | null {
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch {
    return null
  }
}

export function writeGolden(path: string, value: unknown): void {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

/** Structural diff → human-readable lines (empty = equal). Depth-first,
 *  path-labelled; good enough for trap triage, not a full JSON differ. */
export function diffGolden(expected: unknown, actual: unknown, path = ''): string[] {
  if (JSON.stringify(expected) === JSON.stringify(actual)) return []
  const label = path || '(root)'
  const isObj = (v: unknown): v is Record<string, unknown> =>
    !!v && typeof v === 'object' && !Array.isArray(v)
  if (Array.isArray(expected) && Array.isArray(actual)) {
    const out: string[] = []
    const len = Math.max(expected.length, actual.length)
    if (expected.length !== actual.length) {
      out.push(`${label}: expected length ${expected.length}, actual ${actual.length}`)
    }
    for (let i = 0; i < len; i++) {
      out.push(...diffGolden(expected[i], actual[i], `${path}[${i}]`))
    }
    return out
  }
  if (isObj(expected) && isObj(actual)) {
    const out: string[] = []
    for (const k of new Set([...Object.keys(expected), ...Object.keys(actual)])) {
      out.push(...diffGolden(expected[k], actual[k], path ? `${path}.${k}` : k))
    }
    return out
  }
  return [`${label}: expected ${JSON.stringify(expected)}, actual ${JSON.stringify(actual)}`]
}
