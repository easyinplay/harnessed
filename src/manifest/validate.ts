// Manifest validator entry per ADR 0001 + GA-1.
// Pipeline: yaml.parseDocument -> doc.toJS() -> Ajv compiled validator -> typed Manifest.
// T4.1 baseline: parse + Ajv strict + discriminator.
// T4.2 extracts friendly-error mapping to ./errors.ts.
// T4.3 adds yaml CST line/column mapping.
//
// IMPL NOTE (Rule 1 / F8): tsconfig has `verbatimModuleSyntax: true` (per ADR
// 0002) which disables `esModuleInterop` synthetic-default behaviour at runtime.
// `ajv` 8 ships a named `Ajv` class export, so a named import works directly.
// `ajv-formats` exports only a default function, so we import it as a namespace
// and pull `.default` at runtime — that mirrors what the CJS module actually
// exposes (`module.exports = formatsPlugin; exports.default = formatsPlugin`).

import { Ajv } from 'ajv'
import * as ajvFormatsNs from 'ajv-formats'
import { LineCounter, parseDocument } from 'yaml'
import { ajvErrorToFriendly, type ValidationError, yamlParseErrorToFriendly } from './errors.js'
import { ManifestSchema } from './schema/index.js'
import type { Manifest } from './schema/types.js'

const addFormats = (ajvFormatsNs as unknown as { default: (a: Ajv) => Ajv }).default

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
    _compiled = ajv.compile<Manifest>(ManifestSchema as unknown as object)
  }
  return _compiled
}

export type { ValidationError } from './errors.js'

export type ValidateResult =
  | { ok: true; manifest: Manifest }
  | { ok: false; errors: ValidationError[] }

export function validateManifestFile(yamlSource: string, filename: string): ValidateResult {
  const lineCounter = new LineCounter()
  const doc = parseDocument(yamlSource, { lineCounter })

  if (doc.errors.length > 0) {
    return {
      ok: false,
      errors: doc.errors.map((e) => yamlParseErrorToFriendly(e, filename)),
    }
  }

  const data = doc.toJS()
  const validate = getValidator()
  if (!validate(data)) {
    const errs = validate.errors ?? []
    return {
      ok: false,
      errors: errs.map((err) => ajvErrorToFriendly(err, filename, doc, lineCounter)),
    }
  }

  return { ok: true, manifest: data as Manifest }
}
