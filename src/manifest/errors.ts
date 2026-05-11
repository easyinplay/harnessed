// Friendly error mapping per ADR 0001 + GA-1 § validator entry.
// Translates Ajv `ErrorObject[]` and yaml parse errors into a uniform
// `ValidationError` shape with path + keyword + line/column.
// T4.3 adds yaml LineCounter + doc.getIn() for precise source location.

import type { ErrorObject } from 'ajv'
import type { Document, LineCounter, Node } from 'yaml'

export interface ValidationError {
  file: string
  path: string
  message: string
  line: number | null
  column: number | null
  keyword: string
}

/**
 * Translate a JSON Pointer instancePath ("/spec/install/method") into the
 * key-path array yaml@2 expects ("spec", "install", "method"). Numeric
 * segments are coerced for sequence indexing.
 */
function instancePathToKeyPath(instancePath: string): Array<string | number> {
  if (!instancePath || instancePath === '/') return []
  return instancePath
    .split('/')
    .filter(Boolean)
    .map((seg) => {
      const n = Number(seg)
      return Number.isInteger(n) && String(n) === seg ? n : seg
    })
}

/**
 * Resolve `instancePath` to a yaml node by walking the parsed Document, then
 * convert the node's start offset to a 1-indexed `{ line, col }` via the
 * supplied LineCounter. Returns `{ null, null }` if the node cannot be located
 * (e.g. when validation reports a missing field, the node never existed).
 */
function locateLineFromDoc(
  doc: Document.Parsed,
  lineCounter: LineCounter,
  instancePath: string,
): { line: number | null; column: number | null } {
  const path = instancePathToKeyPath(instancePath)
  // For empty path the document root sits at offset 0.
  let node: unknown
  if (path.length === 0) {
    node = doc.contents
  } else {
    node = doc.getIn(path, true)
  }

  if (!node || typeof node !== 'object') return { line: null, column: null }
  const range = (node as Node).range
  if (!range) return { line: null, column: null }

  const offset = range[0]
  const pos = lineCounter.linePos(offset)
  return { line: pos.line, column: pos.col }
}

/**
 * Map an Ajv error to ValidationError. When `doc` + `lineCounter` are supplied,
 * line/column are populated from the yaml CST.
 */
export function ajvErrorToFriendly(
  err: ErrorObject,
  file: string,
  doc?: Document.Parsed,
  lineCounter?: LineCounter,
): ValidationError {
  let path = err.instancePath || '/'
  const params = err.params as Record<string, unknown> | undefined
  if (
    err.keyword === 'additionalProperties' &&
    params &&
    typeof params.additionalProperty === 'string'
  ) {
    path = `${path}/${params.additionalProperty}`
  } else if (err.keyword === 'required' && params && typeof params.missingProperty === 'string') {
    path = `${path}/${params.missingProperty}`
  }

  let line: number | null = null
  let column: number | null = null
  if (doc && lineCounter) {
    // For required-field errors the missing field has no node; resolve to the
    // parent path instead so the user is pointed at the parent block.
    const lookupPath = err.keyword === 'required' ? err.instancePath || '/' : path
    const loc = locateLineFromDoc(doc, lineCounter, lookupPath)
    line = loc.line
    column = loc.column
  }

  return {
    file,
    path,
    message: err.message ?? 'unknown error',
    line,
    column,
    keyword: err.keyword,
  }
}

export interface YamlParseLike {
  message: string
  linePos?: ReadonlyArray<{ line: number; col: number }>
}

export function yamlParseErrorToFriendly(err: YamlParseLike, file: string): ValidationError {
  return {
    file,
    path: '/',
    message: err.message,
    line: err.linePos?.[0]?.line ?? null,
    column: err.linePos?.[0]?.col ?? null,
    keyword: 'yaml-parse',
  }
}
