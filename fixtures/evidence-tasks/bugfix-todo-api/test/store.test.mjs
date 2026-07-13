import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createStore } from '../src/store.mjs'

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

test('list({dueBefore}) keeps todos strictly before the date', () => {
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
