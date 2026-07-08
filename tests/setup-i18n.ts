// v3.4.0 — global vitest setup: force i18n locale to 'en' for all tests so
// existing fixtures (which assert literal English strings verbatim) continue
// to pass regardless of the host machine's $LANG. Individual i18n tests
// override via setLocale() / __resetForTests() per-cell.

import { mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { setLocale } from '../src/i18n/index.js'

setLocale('en')

// v4.20.1 — pin the neutral spawn cwd (getNeutralSpawnCwd env-first override) so
// suites that reach the real spawnCmd never create <stateRoot>/.spawn/ against a
// real or fake homedir during unit tests. The dir must EXIST (a rare real spawn
// with a missing cwd would ENOENT). installers-lib-safeCwd.test.ts deletes this
// env per-cell to exercise the fs branch.
const neutralTestSpawnDir = join(tmpdir(), 'harnessed-test-neutral-spawn')
try {
  mkdirSync(neutralTestSpawnDir, { recursive: true })
} catch {
  /* tmpdir creation failure → env still set; mocked spawns ignore cwd anyway */
}
process.env.HARNESSED_SPAWN_CWD = neutralTestSpawnDir
