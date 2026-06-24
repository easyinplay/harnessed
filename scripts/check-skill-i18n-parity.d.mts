// Type declaration for the dep-free check-skill-i18n-parity.mjs so `tsc --noEmit`
// resolves the vitest import (scripts/** is in tsconfig include; allowJs is off,
// so a hand-written .mjs would otherwise raise TS7016). Runtime stays JS.

export interface SkillI18nViolation {
  file: string
  kind: 'orphan' | 'frontmatter' | 'placeholder' | 'heading-shape'
  detail: string
}

export interface SkillI18nResult {
  ok: boolean
  violations: SkillI18nViolation[]
}

export function checkSkillI18nParity(workflowsDir: string): SkillI18nResult
