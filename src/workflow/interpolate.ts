// src/workflow/interpolate.ts — Phase 3.2 W1 T1.6 (D-02 JINJA LOCKED).
// Karpathy YAGNI ≤30L — zero npm template-lib dep (sister Phase 3.1 D-02 zero
// FSM-lib precedent). Throws on undefined var + on any {{ ... }} that strict
// regex misses (fail-loud per RESEARCH § 3 — strict_variables=True equivalent).
export class InterpolationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InterpolationError'
  }
}
const STRICT = /\{\{\s*(\w+)\s*\}\}/g
const ANY_TEMPLATE = /\{\{[^}]*\}\}/
/** Substitute {{ var }} placeholders in template with vars[name]. Throws on
 *  undefined var OR residual {{ ... }} (e.g. `{{ a.b }}` — `\w+` 不命中 '.',
 *  fail-loud per RESEARCH § 2.3 fixture 5 + § 3 strict_variables=True). */
export function interpolate(template: string, vars: Record<string, string>): string {
  const out = template.replace(STRICT, (_m, name: string) => {
    const v = vars[name]
    if (v === undefined) {
      throw new InterpolationError(
        `undefined template variable '${name}' (template excerpt: ${template.slice(0, 80)})`,
      )
    }
    return v
  })
  if (ANY_TEMPLATE.test(out)) {
    throw new InterpolationError(`unsupported template syntax in: ${out.slice(0, 80)}`)
  }
  return out
}
