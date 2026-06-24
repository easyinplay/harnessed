// Phase 29 T29.1 — locale-aware SKILL.md body picker (install-time resolve layer).
//
// Claude Code reads ~/.claude/skills/<name>/SKILL.md by EXACT filename at runtime;
// harnessed has no read-time hook, so the locale-correct body must be selected at
// `setup` time and written into the dest SKILL.md. This module is the picker: given
// a copied skill dir and a resolved locale, it returns WHICH source file the render
// step should read the body from.
//
// Landmine 1 (findings): locale parsing lives in i18n/index.ts — call getLocale()
// directly. Do NOT add a third copy of mapToSupported.
// Landmine 3: en (and any locale with no sibling) MUST resolve to 'SKILL.md' so the
// en-default install stays byte-identical to current behavior.

import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { getLocale, type SupportedLocale } from '../../i18n/index.js'

/**
 * Pure map: locale → the conventional body filename.
 *   zh-Hans → 'SKILL.zh-Hans.md'
 *   en      → 'SKILL.md'
 * Forward-compat: when ja/ko/etc. ship, extend SupportedLocale + this branch.
 */
export function skillBodyFilename(locale: SupportedLocale): string {
  return locale === 'en' ? 'SKILL.md' : `SKILL.${locale}.md`
}

/**
 * Resolve which source body file the render step should read for `skillDir`.
 *
 * - locale defaults to getLocale() (HARNESSED_LANG → LC_ALL → LANG → … → en).
 * - Returns the locale sibling name ONLY when that file exists on disk; otherwise
 *   falls back to 'SKILL.md' (graceful — no sibling = today's behavior).
 * - en always returns 'SKILL.md' (skillBodyFilename), so existsSync is never even
 *   consulted for en → byte-identical en install (landmine 3).
 */
export function resolveSkillBodyFilename(skillDir: string, locale?: SupportedLocale): string {
  const resolved = locale ?? getLocale()
  const candidate = skillBodyFilename(resolved)
  if (candidate === 'SKILL.md') return 'SKILL.md'
  return existsSync(join(skillDir, candidate)) ? candidate : 'SKILL.md'
}
