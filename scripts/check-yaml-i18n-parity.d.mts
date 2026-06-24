// Type declaration for check-yaml-i18n-parity.mjs so `tsc --noEmit` resolves the
// vitest import (scripts/** is in tsconfig include; allowJs is off, so a hand-written
// .mjs would otherwise raise TS7016). Runtime stays JS (uses the `yaml` package).

export interface YamlI18nViolation {
  file: string
  kind: 'orphan' | 'parse' | 'top-keys' | 'role-keys' | 'role-fields' | 'rule-ids' | 'rule-fields'
  detail: string
}

export interface YamlI18nResult {
  ok: boolean
  violations: YamlI18nViolation[]
}

export function checkYamlI18nParity(workflowsDir: string): YamlI18nResult
