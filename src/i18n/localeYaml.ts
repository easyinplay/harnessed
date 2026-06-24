// Phase 33 (v10.0 i18n Surface) NEW — locale-aware sibling-yaml picker.
//
// Single source for "given a yaml base name, which file does this locale read?"
// shared by loadRolePrompts (role-prompts.yaml) + buildDisciplinesSection
// (disciplines/<name>.yaml). Mirrors the Phase 29 SKILL.md sibling pick +
// messages/{en,zh-Hans}.json file pattern — zero schema change (siblings parse
// against the same shape as the base).
//
// Policy:
//   - en → ALWAYS the base `<baseName>.yaml`. en is the source-of-truth base;
//     there is no `<baseName>.en.yaml` sibling, so this is the byte-identical path.
//   - non-en → `<baseName>.<locale>.yaml` if it exists on disk, else fall back to
//     the base (drift-only: a missing sibling is fine, never an error).

import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { getLocale, type SupportedLocale } from './index.js'

/**
 * Resolve the locale-correct yaml file path for `<baseName>` under `dir`.
 * Default `locale` is `getLocale()` so explicit `--lang` / env flows through
 * (reuse the i18n layer's resolution; do NOT re-implement locale parsing).
 */
export function resolveLocaleYaml(
  dir: string,
  baseName: string,
  locale: SupportedLocale = getLocale(),
): string {
  if (locale !== 'en') {
    const sibling = join(dir, `${baseName}.${locale}.yaml`)
    if (existsSync(sibling)) return sibling
  }
  return join(dir, `${baseName}.yaml`)
}
