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
import { checkSecurityViolations } from './security.js'

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

// ADR 0010 errata (phase 2.1 T1.4) — install_type ↔ install.method 1:N closure
// enforcement. TypeBox `Type` cannot express cross-field constraints, so this
// is a validate-layer refinement rule. Maps each install_type enum value to its
// closed set of legal install.method values (ADR 0007 1:N closure). install
// methods not in this map (currently none) are unconstrained.
const INSTALL_TYPE_METHODS: Record<string, readonly string[]> = {
  npm: ['npm-cli'],
  mcp: ['mcp-stdio-add', 'mcp-http-add'],
  git: ['git-clone-with-setup'],
  skill: ['cc-plugin-marketplace', 'npx-skill-installer'],
}

function checkInstallTypeMismatch(manifest: Manifest, filename: string): ValidationError[] {
  const spec = manifest.spec as { install_type?: string; install?: { method?: string } }
  const installType = spec.install_type
  const method = spec.install?.method
  if (!installType || !method) return []
  const allowed = INSTALL_TYPE_METHODS[installType]
  if (!allowed || allowed.includes(method)) return []
  return [
    {
      file: filename,
      path: 'spec.install.method',
      message: `install_type '${installType}' is not compatible with install.method '${method}' (ADR 0007 1:N closure — expected one of: ${allowed.join(', ')})`,
      line: null,
      column: null,
      keyword: 'install-type-mismatch',
    },
  ]
}

export function validateManifestFile(yamlSource: string, filename: string): ValidateResult {
  const lineCounter = new LineCounter()
  const doc = parseDocument(yamlSource, { lineCounter })

  if (doc.errors.length > 0) {
    return {
      ok: false,
      errors: doc.errors.map((e) => yamlParseErrorToFriendly(e, filename)),
    }
  }

  // Phase 1.1.1 hotfix B1: pre-Ajv security gate. Reject `$(...)`, `${...}`,
  // backtick, etc. in any cmd field BEFORE structural validation so users
  // see the security failure first (not a confusing field-shape error).
  const securityErrors = checkSecurityViolations(doc, filename, lineCounter)
  if (securityErrors.length > 0) {
    return { ok: false, errors: securityErrors }
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

  // ADR 0010 errata (phase 2.1 T1.4) — cross-field install_type ↔ install.method
  // 1:N closure check. Runs after Ajv structural validation passes (needs a
  // well-formed manifest); TypeBox `Type` cannot express cross-field rules.
  const manifest = data as Manifest
  const crossFieldErrors = checkInstallTypeMismatch(manifest, filename)
  if (crossFieldErrors.length > 0) {
    return { ok: false, errors: crossFieldErrors }
  }

  return { ok: true, manifest }
}
