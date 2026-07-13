// Machine acceptance for bugfix-todo-api. Run inside the (possibly agent-edited)
// workspace: `node acceptance.mjs` — prints a checklist JSON to stdout and exits
// 0 only when every check passes.

import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
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

await check('tests-green', 'npm test exits 0 (all 5 tests pass)', () => {
  execFileSync('node', ['--test'], { cwd: root, stdio: 'pipe' })
})

await check('tests-untouched', 'test file was not modified', () => {
  const body = readFileSync(join(root, 'test', 'store.test.mjs'), 'utf8')
  const digest = createHash('sha256').update(body.replace(/\r\n/g, '\n')).digest('hex')
  const expected = readFileSync(join(root, '.test-digest'), 'utf8').trim()
  if (digest !== expected) throw new Error(`test file digest drift: ${digest}`)
})

await check('api-surface', 'store still exports createStore with add/complete/list', async () => {
  const mod = await import(pathToFileURL(join(root, 'src', 'store.mjs')).href)
  const s = mod.createStore()
  for (const k of ['add', 'complete', 'list']) {
    if (typeof s[k] !== 'function') throw new Error(`missing method ${k}`)
  }
})

const passRate = checks.filter((c) => c.pass).length / checks.length
console.log(JSON.stringify({ task: 'bugfix-todo-api', checks, passRate }, null, 2))
process.exit(passRate === 1 ? 0 : 1)
