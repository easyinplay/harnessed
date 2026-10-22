// v3.4.0 — global vitest setup: force i18n locale to 'en' for all tests so
// existing fixtures (which assert literal English strings verbatim) continue
// to pass regardless of the host machine's $LANG. Individual i18n tests
// override via setLocale() / __resetForTests() per-cell.

import { mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { setLocale } from '../src/i18n/index.js'

setLocale('en')

// Dual-host developer machines can carry a real ~/.claude (GateGuard, plugins,
// settings). After the ambient host env is stripped below, platform detection
// would otherwise fall through to that directory and leak developer config into
// supposedly neutral tests. Give every test process an empty home instead; tests
// that intentionally exercise home resolution override these values per-cell.
const neutralTestHome = mkdtempSync(join(tmpdir(), 'harnessed-test-home-'))
process.env.HOME = neutralTestHome
process.env.USERPROFILE = neutralTestHome
process.on('exit', () => {
  try {
    rmSync(neutralTestHome, { recursive: true, force: true })
  } catch {
    // A locked test-created file must not turn a completed suite into a crash.
  }
})
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

// v16.0 Phase 63 T5 — the suite must resolve the same host whether it runs in a
// plain terminal, inside Claude Code or inside a codex shell. detectPlatform()
// sniffs CLAUDE_CODE_SESSION_ID / CODEX_SESSION_ID and honours HARNESSED_PLATFORM
// ahead of the pin and the directory probe (ADR 0040), and HARNESSED_ROOT_OVERRIDE
// no longer short-circuits platform resolution — so strip the ambient host env
// here; a test that needs one sets it explicitly (vi.stubEnv).
for (const k of Object.keys(process.env)) {
  if (k.startsWith('CODEX_') || k === 'CLAUDE_CODE_SESSION_ID' || k === 'HARNESSED_PLATFORM') {
    delete process.env[k]
  }
}
