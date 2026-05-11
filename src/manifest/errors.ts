// Friendly error mapping per ADR 0001 + GA-1 § validator entry.
// Translates Ajv `ErrorObject[]` and yaml parse errors into a uniform
// `ValidationError` shape with path + keyword + line/column.
// T4.2 baseline: keyword + path + message (line/column populated by T4.3).

import type { ErrorObject } from 'ajv'

export interface ValidationError {
  file: string
  path: string
  message: string
  line: number | null
  column: number | null
  keyword: string
}

export function ajvErrorToFriendly(err: ErrorObject, file: string): ValidationError {
  // Build a path that includes the offending field name for `additionalProperties`
  // and `required` errors so callers can point users at the exact field.
  let path = err.instancePath || '/'
  const params = err.params as Record<string, unknown> | undefined
  if (
    err.keyword === 'additionalProperties' &&
    params &&
    typeof params['additionalProperty'] === 'string'
  ) {
    path = `${path}/${params['additionalProperty']}`
  } else if (
    err.keyword === 'required' &&
    params &&
    typeof params['missingProperty'] === 'string'
  ) {
    path = `${path}/${params['missingProperty']}`
  }

  return {
    file,
    path,
    message: err.message ?? 'unknown error',
    line: null,
    column: null,
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
