// v3.4.0 — global vitest setup: force i18n locale to 'en' for all tests so
// existing fixtures (which assert literal English strings verbatim) continue
// to pass regardless of the host machine's $LANG. Individual i18n tests
// override via setLocale() / __resetForTests() per-cell.

import { setLocale } from '../src/i18n/index.js'

setLocale('en')
