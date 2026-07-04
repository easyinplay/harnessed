// v3.4.0 NEW — lightweight i18n loader for harnessed CLI user-facing strings.
//
// Design (Karpathy simplicity):
//   1. Lazy-load `messages/{en,zh}.json` on first `t()` call (no top-level fs cost).
//   2. Locale resolution priority:
//        a. setLocale() explicit (e.g. from --lang flag in src/cli.ts)
//        b. process.env.HARNESSED_LANG
//        c. process.env.LANG / LC_ALL / LANGUAGE (POSIX)
//        d. Intl.DateTimeFormat().resolvedOptions().locale
//        e. 'en' fallback
//   3. Fallback chain on missing key: current → 'en' → raw key (defensive).
//   4. `{{param}}` interpolation via String.prototype.replaceAll regex.
//
// Backward compat: default locale 'en' keys verbatim mirror current literal
// console output → existing test fixtures continue to assert literal strings.

import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
// B1 (v4.19.0) — 内嵌 en 表(tsup json-import 打进 bundle,同 package.json version
// 机制)。compiled 二进制 / 任何 messages/ 不可读环境下,t() 兜底到真实英文文案而非
// 裸奔 key(spike 实测 bug)。zh-Hans 文件在场时路径逐字节不变。
// 注意:i18n 不得静态依赖 assetsRoot/packagePath —— 全局 setupFiles(tests/setup-i18n.ts)
// 会在任何 vi.mock 注册前预加载 i18n,连带把依赖链钉进未 mock 的模块缓存,击穿
// gates/setup-locale 等既有 packagePath mock(B1 实测)。compiled 模式的 messages/
// 解包接线属 Phase 2;Phase 1 由内嵌 en 承担 compiled 可用性。
import enEmbedded from '../../messages/en.json' with { type: 'json' }

export type SupportedLocale = 'en' | 'zh-Hans'

const SUPPORTED: ReadonlySet<SupportedLocale> = new Set(['en', 'zh-Hans'])

let currentLocale: SupportedLocale | null = null
const cache: Partial<Record<SupportedLocale, Record<string, string>>> = {}

/**
 * Map a raw BCP 47 / POSIX locale string to one of the supported translation
 * tables. Policy (v3.4.0):
 *   - `zh*` (zh-CN / zh-Hans / zh-TW / zh.UTF-8 / etc.) → 'zh-Hans'
 *   - Any other input (en / ko / ja / fr / de / es / etc.) → 'en'
 *     ('en' is the universal default — translations are only en + zh-Hans today)
 * Forward-compat: when ja/ko/fr/etc. tables ship, extend match branches here.
 */
function mapToSupported(raw: string | undefined): SupportedLocale {
  if (!raw) return 'en'
  // Match `zh` followed by end-of-string OR any non-letter separator
  // (`_` / `-` / `.` / ` ` etc.). `\b` is unsuitable here because `_` is a
  // word char in JS regex, so `zh_CN` would not have a boundary after `h`.
  if (/^zh([^a-z]|$)/i.test(raw)) return 'zh-Hans'
  return 'en'
}

function detectLocale(): SupportedLocale {
  const raw =
    process.env.HARNESSED_LANG ||
    process.env.LC_ALL ||
    process.env.LANG ||
    process.env.LANGUAGE ||
    safeIntlLocale()
  return mapToSupported(raw)
}

function safeIntlLocale(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().locale
  } catch {
    return undefined
  }
}

function messagesDir(): string {
  // dist/cli.mjs and src/i18n/index.ts both resolve via package root sibling `messages/`.
  const here = dirname(fileURLToPath(import.meta.url))
  const candidates = [resolve(here, '..', '..', 'messages'), resolve(here, '..', 'messages')]
  for (const c of candidates) {
    try {
      readFileSync(join(c, 'en.json'), 'utf8')
      return c
    } catch {
      // try next candidate
    }
  }
  // Last-resort: cwd/messages (test env friendly)
  return resolve(process.cwd(), 'messages')
}

function loadLocale(locale: SupportedLocale): Record<string, string> {
  if (cache[locale]) return cache[locale]
  const path = join(messagesDir(), `${locale}.json`)
  try {
    const raw = readFileSync(path, 'utf8')
    cache[locale] = JSON.parse(raw) as Record<string, string>
  } catch {
    // B1: en 文件不可读 → 内嵌表兜底(compiled / 资产缺失环境的可用性优先)。
    // zh-Hans 不可读 → 空表,t() 的既有 current→en 链会落到内嵌 en。
    cache[locale] = locale === 'en' ? (enEmbedded as Record<string, string>) : {}
  }
  return cache[locale] as Record<string, string>
}

/** Set the active locale explicitly (e.g. from CLI `--lang` flag). */
export function setLocale(locale: string | undefined): void {
  if (!locale) return
  const mapped = mapToSupported(locale)
  if (SUPPORTED.has(mapped)) currentLocale = mapped
}

/** Get the active locale (lazy-detect on first use). */
export function getLocale(): SupportedLocale {
  if (currentLocale === null) currentLocale = detectLocale()
  return currentLocale
}

/** Reset cache + locale — for unit tests only. */
export function __resetForTests(): void {
  currentLocale = null
  for (const k of Object.keys(cache)) delete cache[k as SupportedLocale]
}

/**
 * Translate a key with optional `{{param}}` interpolation.
 * Fallback chain: current locale → 'en' → raw key.
 */
export function t(key: string, params?: Record<string, string | number>): string {
  const locale = getLocale()
  const primary = loadLocale(locale)
  let template = primary[key]
  if (template === undefined && locale !== 'en') {
    template = loadLocale('en')[key]
  }
  if (template === undefined) template = key
  if (!params) return template
  return template.replace(/\{\{(\w+)\}\}/g, (_match, name: string) => {
    const v = params[name]
    return v === undefined ? `{{${name}}}` : String(v)
  })
}
