// Machine acceptance for feature-cli-stats. `node acceptance.mjs` prints a
// checklist JSON and exits 0 only when every check passes.

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

await check('tests-green', 'npm test exits 0 (incl. the 4 median acceptance tests)', () => {
  execFileSync('node', ['--test'], { cwd: root, stdio: 'pipe' })
})

await check('tests-untouched', 'median acceptance test file was not modified', () => {
  const body = readFileSync(join(root, 'test', 'median.test.mjs'), 'utf8')
  const digest = createHash('sha256').update(body.replace(/\r\n/g, '\n')).digest('hex')
  const expected = readFileSync(join(root, '.test-digest'), 'utf8').trim()
  if (digest !== expected) throw new Error(`test file digest drift: ${digest}`)
})

await check('immutability', 'median() does not mutate its input', async () => {
  const { median } = await import(pathToFileURL(join(root, 'src', 'stats.mjs')).href)
  const input = [3, 1, 2]
  median(input)
  if (input.join(',') !== '3,1,2') throw new Error(`input mutated: ${input.join(',')}`)
})

const passRate = checks.filter((c) => c.pass).length / checks.length
console.log(JSON.stringify({ task: 'feature-cli-stats', checks, passRate }, null, 2))
process.exit(passRate === 1 ? 0 : 1)
