#!/usr/bin/env node
// Phase 1.1.1 hotfix H4 — bulk replace signed_by placeholder.
// Preserves LF line endings (.gitattributes compliance, A8 acceptance bar).
import { readFileSync, writeFileSync } from 'node:fs'
const files = process.argv.slice(2)
let n = 0
for (const f of files) {
  const orig = readFileSync(f, 'utf8')
  const next = orig.replace(/signed_by: harnessed-maintainers/g, 'signed_by: easyinplay')
  if (next !== orig) {
    writeFileSync(f, next, 'utf8')
    console.log('updated:', f)
    n++
  }
}
console.log(`${n} files modified`)
