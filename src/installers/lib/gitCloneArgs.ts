// Locate `<dest>` in a manifest cmd's `git clone [flags] <url> <dest>`.
//
// Shared by the installer (D-15 SHA-verify runs `git rev-parse HEAD` in <dest>)
// and the idempotency probe. Both used to skip TWO tokens for every flag they
// did not know. git has many flags that take no value (`--quiet`,
// `--single-branch`, `--no-checkout`, ...), so the walk slid one token: the URL
// was read as <dest>, rev-parse ran in a directory that does not exist, and the
// SHA pin check degraded to a warning — the supply-chain pin silently bypassed.
//
// Now every flag is classified. An unknown flag makes the whole parse return
// null, which the installer already turns into a clear preflight error: failing
// loudly on a flag we do not understand beats guessing where <dest> is.

/** Flags whose value is the NEXT token (`--depth 1`). */
const VALUE_FLAGS = new Set([
  '-b',
  '--branch',
  '--depth',
  '-o',
  '--origin',
  '-u',
  '--upload-pack',
  '--reference',
  '--reference-if-able',
  '--separate-git-dir',
  '-c',
  '--config',
  '--shallow-since',
  '--shallow-exclude',
  '-j',
  '--jobs',
  '--filter',
  '--template',
  '--server-option',
  '--bundle-uri',
  '--ref-format',
])

/** Flags that take no value. (`--recurse-submodules` only takes one as `=pathspec`.) */
const BARE_FLAGS = new Set([
  '-q',
  '--quiet',
  '-v',
  '--verbose',
  '--progress',
  '-n',
  '--no-checkout',
  '--bare',
  '--mirror',
  '-l',
  '--local',
  '--no-local',
  '--no-hardlinks',
  '-s',
  '--shared',
  '--single-branch',
  '--no-single-branch',
  '--tags',
  '--no-tags',
  '--recursive',
  '--recurse-submodules',
  '--shallow-submodules',
  '--no-shallow-submodules',
  '--remote-submodules',
  '--no-remote-submodules',
  '--sparse',
  '--reject-shallow',
  '--no-reject-shallow',
  '--also-filter-submodules',
])

const CLAUSE_END = new Set(['&&', ';', '|', '||'])

/** Raw `<dest>` token (unexpanded, e.g. `~/x`) plus the index of `git clone` in
 *  `cmd`, or null when the shape cannot be parsed with certainty. */
export function parseGitCloneDest(cmd: string): { raw: string; cloneIdx: number } | null {
  const idx = cmd.indexOf('git clone')
  if (idx < 0) return null
  const tokens = cmd
    .slice(idx + 'git clone'.length)
    .trim()
    .split(/\s+/)
  let i = 0
  while (i < tokens.length) {
    const t = tokens[i] as string
    if (t === '--') {
      i += 1
      break
    }
    if (!t.startsWith('-')) break
    if (t.startsWith('--') && t.includes('=')) i += 1
    else if (VALUE_FLAGS.has(t)) i += 2
    else if (BARE_FLAGS.has(t)) i += 1
    else return null
  }
  const url = tokens[i]
  const dest = tokens[i + 1]
  if (!url || CLAUSE_END.has(url)) return null
  if (!dest || CLAUSE_END.has(dest)) return null
  return { raw: dest, cloneIdx: idx }
}
