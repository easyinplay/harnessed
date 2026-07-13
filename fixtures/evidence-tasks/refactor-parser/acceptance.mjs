// Machine acceptance for refactor-parser. `node acceptance.mjs` prints a
// checklist JSON and exits 0 only when every check passes.

import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = dirname(fileURLToPath(import.meta.url))
const checks = []

async function check(id, desc, fn) {
  try {
    await fn()
    checks.push({ id, desc, pass: true })
  } catch (e) {
    checks.push({ id, desc, pass: false, detail: String(e.message ?? e).slice(0, 200) })
  }
}

await check('tests-green', 'npm test exits 0 (all 6 behavior tests stay green)', () => {
  execFileSync('node', ['--test'], { cwd: root, stdio: 'pipe' })
})

await check('tests-untouched', 'test file was not modified', () => {
  const body = readFileSync(join(root, 'test', 'parser.test.mjs'), 'utf8')
  const digest = createHash('sha256').update(body.replace(/\r\n/g, '\n')).digest('hex')
  const expected = readFileSync(join(root, '.test-digest'), 'utf8').trim()
  if (digest !== expected) throw new Error(`test file digest drift: ${digest}`)
})

await check('escape-module', 'src/escape.mjs exists and exports unescapeValue()', async () => {
  const p = join(root, 'src', 'escape.mjs')
  if (!existsSync(p)) throw new Error('src/escape.mjs missing')
  const mod = await import(pathToFileURL(p).href)
  if (typeof mod.unescapeValue !== 'function') throw new Error('unescapeValue not exported')
})

await check(
  'parser-imports-escape',
  'parser.mjs imports ./escape.mjs and drops the duplication',
  () => {
    const src = readFileSync(join(root, 'src', 'parser.mjs'), 'utf8')
    if (!/from\s+['"]\.\/escape\.mjs['"]/.test(src))
      throw new Error('parser.mjs does not import ./escape.mjs')
    const dupes = (src.match(/duplicated unescape block/g) ?? []).length
    if (dupes > 0) throw new Error(`duplicated blocks still present (${dupes} markers)`)
  },
)

const passRate = checks.filter((c) => c.pass).length / checks.length
console.log(JSON.stringify({ task: 'refactor-parser', checks, passRate }, null, 2))
process.exit(passRate === 1 ? 0 : 1)
