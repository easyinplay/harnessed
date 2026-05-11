// Manifest validator entry per ADR 0001 + GA-1.
// Pipeline: yaml.parseDocument -> doc.toJS() -> Ajv compiled validator -> typed Manifest.
// T4.1 baseline: parse + Ajv strict + discriminator. T4.2 adds friendly errors,
// T4.3 adds yaml CST line/column mapping.
//
// IMPL NOTE (Rule 1 / F8): tsconfig has `verbatimModuleSyntax: true` (per ADR
// 0002) which disables `esModuleInterop` synthetic-default behaviour at runtime.
// `ajv` 8 ships a named `Ajv` class export, so a named import works directly.
// `ajv-formats` exports only a default function, so we import it as a namespace
// and pull `.default` at runtime — that mirrors what the CJS module actually
// exposes (`module.exports = formatsPlugin; exports.default = formatsPlugin`).

import { Ajv, type ErrorObject } from 'ajv'
import * as ajvFormatsNs from 'ajv-formats'
import { parseDocument } from 'yaml'
import { ManifestSchema } from './schema/index.js'
import type { Manifest } from './schema/types.js'

// ajv-formats deref: under NodeNext + verbatimModuleSyntax we receive a
// namespace whose `.default` is the actual plugin function.
const addFormats = (ajvFormatsNs as unknown as { default: (a: Ajv) => Ajv }).default

// Ajv instance — created once, validator compiled lazily.
const ajv = addFormats(
  new Ajv({
    strict: true,
    strictSchema: true,
    strictTypes: true,
    strictRequired: true,
    allErrors: true,
    discriminator: true,
    allowUnionTypes: false,
  }),
)

let _compiled: ReturnType<typeof ajv.compile<Manifest>> | null = null
function getValidator() {
  if (!_compiled) {
    // ManifestSchema is a TypeBox-built JSON Schema object. Cast through unknown
    // because Ajv's generic does not infer Static<>.
    _compiled = ajv.compile<Manifest>(ManifestSchema as unknown as object)
  }
  return _compiled
}

export interface ValidationError {
  file: string
  path: string
  message: string
  line: number | null
  column: number | null
  keyword: string
}

export type ValidateResult =
  | { ok: true; manifest: Manifest }
  | { ok: false; errors: ValidationError[] }

export function validateManifestFile(yamlSource: string, filename: string): ValidateResult {
  const doc = parseDocument(yamlSource)

  if (doc.errors.length > 0) {
    return {
      ok: false,
      errors: doc.errors.map((e) => ({
        file: filename,
        path: '/',
        message: e.message,
        line: e.linePos?.[0]?.line ?? null,
        column: e.linePos?.[0]?.col ?? null,
        keyword: 'yaml-parse',
      })),
    }
  }

  const data = doc.toJS()
  const validate = getValidator()
  if (!validate(data)) {
    const errs: ErrorObject[] = validate.errors ?? []
    return {
      ok: false,
      errors: errs.map((err) => ({
        file: filename,
        path: err.instancePath || '/',
        message: err.message ?? 'unknown error',
        line: null,
        column: null,
        keyword: err.keyword,
      })),
    }
  }

  return { ok: true, manifest: data as Manifest }
}
