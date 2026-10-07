// v16.0 post-close — where the reply-language preference lives on a host that cannot
// take an env key.
//
// `buildLanguageSection` (src/cli/prompt.ts) reads `env.HARNESSED_USER_LANG`. On claude
// that key is written into `~/.claude/settings.json`'s `env` block at setup time and the
// host injects it into every process it spawns, so `harnessed prompt` sees it. codex has
// no such mechanism: `supportsEnvKeyWrite: false`, `settingsPath: null`. The key was
// therefore never written anywhere and the entire `## Language` section — including
// `disciplines/language.yaml`'s preserve-English categories — was absent from every
// codex subagent prompt.
//
// This pin is a plain-text file in harnessed's OWN state root, a sibling of the Phase 63
// `.platform` pin. The constraints leave little else: `~/.codex/config.toml` is off
// limits (ADR 0041 — credentials, and codex's to write), there is no JSON settings file,
// and editing a shell profile would mean writing a file harnessed does not own.
//
// Deliberately NOT derived from the resolved locale (`getLocale()` / LANG / LC_ALL):
// that answers "which locale's yaml and CLI strings to load", while this answers "what
// language should the model reply in", which the user states via `setup --user-lang`.
// Conflating them would give someone who ran `--user-lang zh-Hans` on an English-locale
// machine Chinese replies on claude and English on codex.
//
// Plain text, one line, not JSON: it holds exactly one scalar, and `.platform` next to
// it already established the convention. Unparseable or unknown content is treated as
// absent rather than forwarded — the value is spliced into `Respond in <name>`, so a
// hand-edited or corrupted pin must not be able to put arbitrary text into every prompt.

import { readFileSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { detectPlatform } from '../../platform/platform.js'

/** Supported reply languages — same closed set as `enableUserLangInSettings`. */
export type UserLangCode = 'en' | 'zh-Hans'

const SUPPORTED: readonly string[] = ['en', 'zh-Hans']

/** File name inside the state root. Sibling of the `.platform` pin. */
export const USER_LANG_PIN = 'user-lang'

/** `<stateRoot>/user-lang` for the ACTIVE host. */
export function userLangPinPath(): string {
  return join(detectPlatform().stateRoot, USER_LANG_PIN)
}

/** Write the pin (creating the state root if needed). Returns the path written. */
export async function writeUserLangPin(code: UserLangCode): Promise<string> {
  const path = userLangPinPath()
  await mkdir(detectPlatform().stateRoot, { recursive: true })
  await writeFile(path, `${code}\n`, 'utf8')
  return path
}

/**
 * The pinned code, or `undefined` when there is no usable pin.
 *
 * Sync + fail-soft on purpose: the one caller is a prompt build that must never throw
 * because of a missing or malformed state file, and the read is a single short file.
 */
export function readUserLangPin(): UserLangCode | undefined {
  let raw: string
  try {
    raw = readFileSync(userLangPinPath(), 'utf8')
  } catch {
    return undefined
  }
  const value = raw.trim()
  return SUPPORTED.includes(value) ? (value as UserLangCode) : undefined
}
