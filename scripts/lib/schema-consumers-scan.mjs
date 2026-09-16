// Pure text transforms for scripts/check-schema-consumers.mjs, split out so they
// can be unit-tested (tests/scripts/schema-consumers-scan.test.ts). Dependency-free:
// the gate runs in CI before `pnpm install`.
//
// Every one of these exists because the gate was once wrong in a way that
// weakened it quietly rather than breaking it loudly.

/** Strip comments so a mention in prose never counts as a read. Handles both the
 *  TS forms and yaml's `#`, since the workflow set searches yaml — a field named
 *  in a yaml comment is documentation, exactly like one named in a JSDoc block. */
export function stripComments(src, isYaml = false) {
  // yaml has no // or block comments; running the JS scanner over it deletes code
  // (an unquoted `workflows/<star>.yaml` in capabilities.yaml prose opened a
  // "block comment" and hid five facts that were plainly referenced).
  return isYaml ? src.replace(/^\s*#.*$/gm, '') : stripJsComments(src)
}

/** String-aware `//` and block-comment removal. The regex version it replaces
 *  treated a block-comment opener inside a STRING as a comment: the glob literal
 *  in scripts/check-workflow-schema.mjs (`'workflows/judgments/<star>.yaml'`)
 *  swallowed 13k of its 23k characters up to the next closer. Deleting code can
 *  only turn fields falsely DEAD (loud), but it also hid what that file really
 *  is — a schema mirror — so nobody noticed. Regex literals are not tracked:
 *  a quote inside one could desync the scanner, which is bounded by resetting
 *  string state at every newline (none of these sources has multi-line quotes
 *  outside template literals). */
export function stripJsComments(src) {
  let out = ''
  let quote = null // "'" | '"' | '`'
  for (let i = 0; i < src.length; i++) {
    const c = src[i]
    const n = src[i + 1]
    if (quote) {
      out += c
      if (c === '\\') {
        out += n ?? ''
        i += 1
      } else if (c === quote || (c === '\n' && quote !== '`')) {
        quote = null
      }
      continue
    }
    if (c === '/' && n === '/' && src[i - 1] !== ':') {
      while (i < src.length && src[i] !== '\n') i += 1
      out += '\n'
      continue
    }
    if (c === '/' && n === '*') {
      const end = src.indexOf('*/', i + 2)
      const skipped = end < 0 ? src.slice(i) : src.slice(i, end + 2)
      out += skipped.replace(/[^\n]/g, '')
      i = end < 0 ? src.length : end + 1
      continue
    }
    if (c === "'" || c === '"' || c === '`') quote = c
    out += c
  }
  return out
}

/** A TypeBox property declaration (`name: Type.X(...)`) WRITES a field's shape; it
 *  never reads one. scripts/check-workflow-schema.mjs mirrors the workflow schema
 *  line for line, so without this every mirrored field would look consumed. */
export function stripTypeboxDeclarations(src) {
  return src.replace(/^(\s*)[a-z_][A-Za-z0-9_]*\s*:\s*Type\.[^\n]*$/gm, '$1')
}

/** In yaml, a mapping KEY is where a field is WRITTEN, not read. Only a value can
 *  read one (a judgment expression such as `fires: requires_second_opinion`).
 *  Counting keys made every field that some yaml file merely sets look consumed:
 *  after the before-commit hook was deleted (4.42.0) `auto_fix_cmd` had no
 *  evaluator left, yet stayed green because four discipline yaml files declare it.
 *  Drop the key, keep the value. */
export function stripYamlKeys(src) {
  return src.replace(/^(\s*(?:-\s+)?)(?:[A-Za-z_][\w-]*|'[^']*'|"[^"]*")\s*:(?=\s|$)/gm, '$1')
}
