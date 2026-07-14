// Machine acceptance for compound-recurring-todos (7 requirements, R1-R7).
// Run inside the (possibly agent-edited) workspace: `node acceptance.mjs` —
// prints a checklist JSON to stdout, exit 0 only when every check passes.
//
// R3 is verified against an EMBEDDED snapshot of the original tests (written
// to a temp file and executed), so an agent editing test/store.test.mjs cannot
// silently weaken the original contract.

import { execFileSync } from 'node:child_process'
import { readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
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

async function freshStore() {
  // cache-bust so repeated acceptance runs in one process see current code
  const href = `${pathToFileURL(join(root, 'src', 'store.mjs')).href}?t=${Date.now()}-${Math.random()}`
  const mod = await import(href)
  return mod.createStore()
}

// ── R1: recurrence field accepted, invalid values rejected ────────────────
await check(
  'r1-recurrence-field',
  "add() accepts 'daily'|'weekly', rejects others loudly",
  async () => {
    const s = await freshStore()
    const a = s.add({ title: 'daily standup', due: '2026-07-01', recurrence: 'daily' })
    if (a.recurrence !== 'daily') throw new Error('recurrence not preserved on the todo')
    s.add({ title: 'weekly review', due: '2026-07-01', recurrence: 'weekly' })
    let threw = false
    try {
      s.add({ title: 'bad', due: '2026-07-01', recurrence: 'monthly' })
    } catch (e) {
      threw = true
      if (!/recurrence/i.test(String(e.message)))
        throw new Error('rejection message must mention recurrence')
    }
    if (!threw) throw new Error("invalid recurrence 'monthly' was not rejected")
  },
)

// ── R2: complete() spawns the next instance exactly once ──────────────────
await check(
  'r2-next-instance-once',
  'complete() rolls due forward once; re-complete is idempotent',
  async () => {
    const s = await freshStore()
    const t = s.add({ title: 'water plants', due: '2026-07-31', recurrence: 'daily' })
    s.complete(t.id)
    const all1 = s.list({ includeDone: true })
    if (all1.length !== 2) throw new Error(`expected 2 todos after complete, got ${all1.length}`)
    const next = all1.find((x) => x.id !== t.id)
    if (!next || next.done) throw new Error('next instance missing or not pending')
    if (next.title !== 'water plants') throw new Error('next instance title mismatch')
    if (next.recurrence !== 'daily') throw new Error('next instance must stay recurring')
    if (next.due !== '2026-08-01')
      throw new Error(`daily roll across month boundary: expected 2026-08-01, got ${next.due}`)
    s.complete(t.id) // idempotent — must NOT spawn again
    const all2 = s.list({ includeDone: true })
    if (all2.length !== 2)
      throw new Error(`re-complete spawned another instance (${all2.length} todos)`)
  },
)

// ── R3: original tests pass UNMODIFIED (embedded snapshot) ─────────────────
const ORIGINAL_TESTS = `import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createStore } from './src/store.mjs'

test('add() assigns ids and trims titles', () => {
  const s = createStore()
  const a = s.add({ title: '  write report ' })
  assert.equal(a.id, 1)
  assert.equal(a.title, 'write report')
})

test('add() rejects malformed due dates', () => {
  const s = createStore()
  assert.throws(() => s.add({ title: 'x', due: '07/20/2026' }), /invalid due date/)
})

test('list({includeDone:false}) hides completed todos', () => {
  const s = createStore()
  const a = s.add({ title: 'a' })
  s.add({ title: 'b' })
  s.complete(a.id)
  assert.deepEqual(
    s.list({ includeDone: false }).map((t) => t.title),
    ['b'],
  )
})

test('list({dueBefore}) keeps todos due on or before the date', () => {
  const s = createStore()
  s.add({ title: 'early', due: '2026-07-10' })
  s.add({ title: 'late', due: '2026-07-30' })
  s.add({ title: 'undated' })
  assert.deepEqual(
    s.list({ dueBefore: '2026-07-20' }).map((t) => t.title),
    ['early'],
  )
})

test('list({dueBefore}) includes a todo due exactly on the boundary date', () => {
  const s = createStore()
  s.add({ title: 'boundary', due: '2026-07-20' })
  assert.deepEqual(
    s.list({ dueBefore: '2026-07-20' }).map((t) => t.title),
    ['boundary'],
  )
})
`
await check(
  'r3-originals-green',
  'embedded snapshot of the original 5 tests passes against src/',
  () => {
    const snap = join(root, '.acceptance-r3.test.mjs')
    writeFileSync(snap, ORIGINAL_TESTS)
    try {
      execFileSync('node', ['--test', snap], { cwd: root, stdio: 'pipe' })
    } finally {
      rmSync(snap, { force: true })
    }
  },
)

// ── R4: ≥4 new tests covering recurrence incl. invalid + idempotency ──────
await check(
  'r4-new-tests',
  '>=4 new tests; recurrence + invalid-value + idempotency covered',
  () => {
    const files = readdirSync(join(root, 'test')).filter((f) => /\.(mjs|js|cjs)$/.test(f))
    let body = ''
    for (const f of files) body += readFileSync(join(root, 'test', f), 'utf8')
    const testCount = (body.match(/\btest\(/g) ?? []).length + (body.match(/\bit\(/g) ?? []).length
    if (testCount < 9)
      throw new Error(`expected >=9 total tests (5 original + >=4 new), found ${testCount}`)
    if (!/recurr/i.test(body)) throw new Error('no test mentions recurrence')
    if (!/(invalid|reject|throws)/i.test(body)) throw new Error('no invalid-value test found')
    if (!/(idempot|twice|again|second)/i.test(body))
      throw new Error('no idempotency edge test found')
  },
)

// ── R5: README API docs with example ───────────────────────────────────────
await check(
  'r5-readme-docs',
  'README.md documents recurrence + complete(), with a fenced example',
  () => {
    const md = readFileSync(join(root, 'README.md'), 'utf8')
    if (!/recurrence/i.test(md)) throw new Error('README does not mention recurrence')
    if (!/complete/i.test(md)) throw new Error('README does not document complete() behavior')
    const fenced = md.match(/```[\s\S]*?```/g) ?? []
    if (!fenced.some((b) => /recurrence|complete/i.test(b))) {
      throw new Error('no fenced code-block example covering the new API')
    }
  },
)

// ── R6: spawned instances participate in dueBefore filtering ──────────────
await check(
  'r6-duebefore-interaction',
  'next instance participates in list({dueBefore}) boundary semantics',
  async () => {
    const s = await freshStore()
    const t = s.add({ title: 'weekly report', due: '2026-07-01', recurrence: 'weekly' })
    s.complete(t.id)
    const onBoundary = s.list({ dueBefore: '2026-07-08' }).filter((x) => x.due === '2026-07-08')
    if (onBoundary.length !== 1)
      throw new Error(`expected the 2026-07-08 instance on the boundary, got ${onBoundary.length}`)
    const before = s.list({ dueBefore: '2026-07-07' }).filter((x) => x.due === '2026-07-08')
    if (before.length !== 0) throw new Error('2026-07-08 instance leaked into dueBefore=2026-07-07')
  },
)

// ── R7: npm test green ─────────────────────────────────────────────────────
await check('r7-tests-green', 'npm test exits 0', () => {
  execFileSync('node', ['--test'], { cwd: root, stdio: 'pipe' })
})

const passRate = checks.filter((c) => c.pass).length / checks.length
console.log(JSON.stringify({ task: 'compound-recurring-todos', checks, passRate }, null, 2))
process.exit(passRate === 1 ? 0 : 1)
