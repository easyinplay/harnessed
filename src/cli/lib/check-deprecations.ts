// src/cli/lib/check-deprecations.ts — Phase 3.3 W1 T1.6 — D-02 DOCTOR-ONLY-WARN
// PRIMARY helper (sister Phase 3.2 W1 T1.4 probe-gstack.ts 48L sister-share
// extract pattern for Karpathy ≤200L 守门 — keeps doctor.ts ≤200L). Lists
// deprecated manifests by reading manifests/aliases.yaml (D-01 RICH schema)
// + emits CheckResult for doctor 7th check warning output. Table format
// multi-deprecation aggregation per Discretion locked (RESEARCH § 3.2 verbatim).
import { listDeprecations } from '../../manifest/aliases.js'

export interface CheckResult {
  name: string
  status: 'pass' | 'warn' | 'fail'
  message: string
  fix?: string
}

/** Doctor 7th check: list deprecated manifests from aliases.yaml. D-02 DOCTOR-
 *  ONLY-WARN: status='warn' when deprecations exist (install path silently
 *  redirects, doctor surface here is human-readable audit). */
export function checkDeprecations(): CheckResult {
  try {
    const deprecations = listDeprecations()
    if (deprecations.length === 0) {
      return { name: 'deprecated manifests', status: 'pass', message: 'no deprecated manifests' }
    }
    const lines = deprecations.map(({ old, entry }) => {
      const removal = entry.removal_date ? `, removes ${entry.removal_date}` : ''
      return `  '${old}' → '${entry.redirect}' (since ${entry.since_version}, ${entry.deprecation_date}${removal}; ${entry.reason})`
    })
    return {
      name: 'deprecated manifests',
      status: 'warn',
      message: `${deprecations.length} deprecated manifest(s):\n${lines.join('\n')}`,
      fix: 'install paths auto-redirect; consider migrating manifest references to new names',
    }
  } catch (e) {
    return {
      name: 'deprecated manifests',
      status: 'fail',
      message: `aliases.yaml load error: ${(e as Error).message}`,
      fix: 'verify manifests/aliases.yaml schema (see docs/PROJECT-SPEC.md)',
    }
  }
}
