import assert from 'node:assert/strict'
import { test } from 'node:test'
import { parse } from '../src/parser.mjs'

test('top-level and section keys', () => {
  const doc = parse(['name = demo', '[db]', 'host = localhost', 'port = 5432'].join('\n'))
  assert.deepEqual(doc, { '': { name: 'demo' }, db: { host: 'localhost', port: '5432' } })
})

test('comments and blank lines are ignored', () => {
  const doc = parse(['; header comment', '', 'a = 1', '[s]', '; inner', 'b = 2'].join('\n'))
  assert.deepEqual(doc, { '': { a: '1' }, s: { b: '2' } })
})

test('quoted values unescape \\n \\t \\" and backslash (both branches)', () => {
  const doc = parse(['top = "a\\nb\\t\\"c\\\\"', '[s]', 'inner = "x\\ny"'].join('\n'))
  assert.equal(doc[''].top, 'a\nb\t"c\\')
  assert.equal(doc.s.inner, 'x\ny')
})

test('unquoted trailing ; comment is stripped in both branches', () => {
  const doc = parse(['a = 1 ; keep it', '[s]', 'b = 2 ; also'].join('\n'))
  assert.equal(doc[''].a, '1')
  assert.equal(doc.s.b, '2')
})

test('errors: missing =, empty key, unterminated quote, bad escape', () => {
  assert.throws(() => parse('nonsense'), /expected key = value/)
  assert.throws(() => parse('= v'), /empty key/)
  assert.throws(() => parse('a = "oops'), /unterminated/)
  assert.throws(() => parse('a = "b\\qc"'), /bad escape/)
})

test('repeated [section] merges keys', () => {
  const doc = parse(['[s]', 'a = 1', '[t]', 'x = 9', '[s]', 'b = 2'].join('\n'))
  assert.deepEqual(doc.s, { a: '1', b: '2' })
})
