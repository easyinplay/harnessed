// Phase 88 — scoped JSON backups: pure helpers shared by lib/backup.ts
// (emit) and cli/rollback.ts (validate + restore).
//
// A json-subtree backup payload is a versioned diff document recording only
// the OLD values of the keys the install plan changed — never the whole file
// and never the new image:
//
//   { "version": 1, "changes": [{ "path": ["a","b"], "existed": true, "value": <old> }] }
//
// existed:false marks a key the install ADDED (no old value to record).
// Rollback reverts exactly those paths and leaves every other current key —
// including credentials the plan never touched — untouched.
//
// Prototype safety: JSON-parsed keys like "__proto__" are literal data. All
// reads go through own-property checks and all writes through
// Object.defineProperty, so restoring a "__proto__" path creates an own data
// property instead of mutating the object prototype.

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue }

export type JsonObject = { [key: string]: JsonValue }

export interface SubtreeChange {
  path: string[]
  existed: boolean
  value?: JsonValue
}

export interface SubtreePayload {
  version: 1
  changes: SubtreeChange[]
}

export const SUBTREE_PAYLOAD_VERSION = 1

/**
 * Format discriminator stored in the metadata `sha1` field of json-subtree
 * entries instead of a real digest. It is deliberately NOT a 40-char hex
 * string, so a released rollback (which sha1-verifies then byte-restores
 * every non-empty backup) can never hash-match it: an old reader always
 * fails closed on scoped snapshots rather than writing the diff payload
 * into the user's JSON file. The real payload digest lives in
 * `payloadSha1` — see backup.ts/rollback.ts.
 */
export const SUBTREE_ENTRY_SHA1 = 'json-subtree-v1'

export function isJsonObject(v: unknown): v is JsonObject {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/** Parse text as JSON; return the object only when the root is a plain object. */
export function tryParseJsonObject(text: string): JsonObject | null {
  try {
    const v: unknown = JSON.parse(text)
    return isJsonObject(v) ? v : null
  } catch {
    return null
  }
}

function hasOwn(obj: object, key: string): boolean {
  return Object.hasOwn(obj, key)
}

/** Write an own enumerable data property — safe for "__proto__" etc. */
function setOwn(obj: JsonObject, key: string, value: JsonValue): void {
  Object.defineProperty(obj, key, {
    value,
    writable: true,
    enumerable: true,
    configurable: true,
  })
}

function deepEqualJson(a: JsonValue, b: JsonValue): boolean {
  if (a === b) return true
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((v, i) => deepEqualJson(v, b[i] as JsonValue))
  }
  if (isJsonObject(a) && isJsonObject(b)) {
    const aKeys = Object.keys(a)
    const bKeys = Object.keys(b)
    return (
      aKeys.length === bKeys.length &&
      aKeys.every((k) => hasOwn(b, k) && deepEqualJson(a[k] as JsonValue, b[k] as JsonValue))
    )
  }
  return false
}

/**
 * Recursive object diff. Objects recurse; arrays, scalars and type
 * transitions are atomic (one whole-value change). Emits old-key changes in
 * old-key order, then added keys in new-key order — deterministic.
 */
export function diffJsonObjects(oldObj: JsonObject, newObj: JsonObject): SubtreeChange[] {
  const changes: SubtreeChange[] = []
  const walk = (o: JsonObject, n: JsonObject, base: string[]) => {
    for (const key of Object.keys(o)) {
      const path = [...base, key]
      if (!hasOwn(n, key)) {
        changes.push({ path, existed: true, value: o[key] })
      } else {
        compare(o[key] as JsonValue, n[key] as JsonValue, path)
      }
    }
    for (const key of Object.keys(n)) {
      if (!hasOwn(o, key)) changes.push({ path: [...base, key], existed: false })
    }
  }
  const compare = (a: JsonValue, b: JsonValue, path: string[]) => {
    if (isJsonObject(a) && isJsonObject(b)) {
      walk(a, b, path)
    } else if (!deepEqualJson(a, b)) {
      changes.push({ path, existed: true, value: a })
    }
  }
  walk(oldObj, newObj, [])
  return changes
}

/**
 * True when the tree contains a number JSON.stringify cannot round-trip:
 * non-finite values (e.g. JSON.parse('1e400') → Infinity, which stringifies
 * as `null`) and integers beyond Number.MAX_SAFE_INTEGER (silently
 * re-serialized to a different value). Scoped backups refuse these outright —
 * a subtree restore re-serializes the whole file, so an unsafe number ANYWHERE
 * (even on an untouched key) would be corrupted. Own-property safe traversal.
 */
export function containsUnsafeJsonNumber(value: JsonValue): boolean {
  if (typeof value === 'number') {
    return !Number.isFinite(value) || (Number.isInteger(value) && !Number.isSafeInteger(value))
  }
  if (Array.isArray(value)) return value.some(containsUnsafeJsonNumber)
  if (isJsonObject(value)) {
    return Object.keys(value).some((k) => containsUnsafeJsonNumber(value[k] as JsonValue))
  }
  return false
}

/** True when one path equals or is a prefix of the other (dup or ancestor/descendant). */
function pathsOverlap(a: string[], b: string[]): boolean {
  const n = Math.min(a.length, b.length)
  return a.slice(0, n).every((seg, i) => seg === b[i])
}

/**
 * Validate a parsed payload. Rejects unknown versions, malformed changes
 * (bad path shape, missing/inconsistent existed+value) and duplicate or
 * ancestor/descendant-overlapping paths.
 */
export function validateSubtreePayload(
  parsed: unknown,
): { ok: true; changes: SubtreeChange[] } | { ok: false; reason: string } {
  if (!isJsonObject(parsed)) return { ok: false, reason: 'payload is not a JSON object' }
  if (parsed.version !== SUBTREE_PAYLOAD_VERSION) {
    return { ok: false, reason: `unsupported payload version ${String(parsed.version)}` }
  }
  const raw = parsed.changes
  if (!Array.isArray(raw)) return { ok: false, reason: 'changes is not an array' }
  const changes: SubtreeChange[] = []
  for (const item of raw) {
    if (!isJsonObject(item)) return { ok: false, reason: 'change entry is not an object' }
    const { path, existed } = item as { path?: unknown; existed?: unknown }
    if (
      !Array.isArray(path) ||
      path.length === 0 ||
      !path.every((seg): seg is string => typeof seg === 'string')
    ) {
      return { ok: false, reason: 'change path must be a non-empty string array' }
    }
    if (typeof existed !== 'boolean') {
      return { ok: false, reason: 'change existed must be boolean' }
    }
    const hasValue = hasOwn(item, 'value')
    if (existed && !hasValue) {
      return { ok: false, reason: 'existed change missing old value' }
    }
    if (!existed && hasValue) {
      return { ok: false, reason: 'added-path change must not carry a value' }
    }
    const p = path as string[]
    for (const prev of changes) {
      if (pathsOverlap(prev.path, p)) {
        return {
          ok: false,
          reason: `duplicate or overlapping change path ${JSON.stringify(p)}`,
        }
      }
    }
    const change: SubtreeChange = { path: p, existed }
    if (hasValue) change.value = (item as { value: JsonValue }).value
    changes.push(change)
  }
  return { ok: true, changes }
}

/**
 * Apply validated changes to the CURRENT parsed target, in place.
 * Every path's parents must already exist as plain objects — a missing or
 * non-object parent means the user changed an ancestor the install also
 * touched, which is a refusal, never an overwrite. Leaf: restore the old
 * value (existed) or delete the key the install added.
 */
export function applySubtreeChanges(
  current: JsonObject,
  changes: SubtreeChange[],
): { ok: true } | { ok: false; reason: string } {
  for (const change of changes) {
    let node: JsonObject = current
    for (const seg of change.path.slice(0, -1)) {
      const next: unknown = hasOwn(node, seg) ? node[seg] : undefined
      if (!isJsonObject(next)) {
        return {
          ok: false,
          reason: `conflict at ${JSON.stringify(change.path)}: parent ${JSON.stringify(seg)} is missing or not an object`,
        }
      }
      node = next
    }
    // path is non-empty — guaranteed by validateSubtreePayload.
    const leaf = change.path[change.path.length - 1] as string
    if (change.existed) {
      setOwn(node, leaf, change.value as JsonValue)
    } else if (hasOwn(node, leaf)) {
      delete node[leaf]
    }
  }
  return { ok: true }
}
