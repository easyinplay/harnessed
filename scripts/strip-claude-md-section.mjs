#!/usr/bin/env node
// Phase 2.3 W2 T2.4 — cross-platform CLAUDE.md section stripper (sed -i replacement).
// Replaces ad-hoc `sed -i` invocations from karpathy-skills.yaml migration cleanup.
// macOS BSD sed requires empty-string arg for -i (`sed -i ''`), Linux GNU sed forbids
// it, Windows lacks sed entirely — this node script unifies all three platforms.
// 沿袭 check-transparency-verdicts.mjs node-walker pattern; karpathy YAGNI ≤40L.
//
// Usage: node scripts/strip-claude-md-section.mjs <start-marker> <end-marker> <file>
//        node scripts/strip-claude-md-section.mjs --help

import { existsSync, readFileSync, writeFileSync } from 'node:fs'

const args = process.argv.slice(2)
if (args.length === 1 && (args[0] === '--help' || args[0] === '-h')) {
  console.log('Usage: strip-claude-md-section.mjs <start-marker> <end-marker> <file>')
  console.log('Removes lines from <start-marker> through <end-marker> inclusive in <file>.')
  console.log('Idempotent: exits 0 if file missing or markers absent. No backup written.')
  process.exit(0)
}
if (args.length !== 3) {
  console.error('error: expected 3 args (start-marker, end-marker, file). Use --help.')
  process.exit(2)
}
const [startMarker, endMarker, filePath] = args
if (!existsSync(filePath)) process.exit(0) // idempotent — nothing to strip

const text = readFileSync(filePath, 'utf8')
const lines = text.split(/\r?\n/)
const startIdx = lines.findIndex((l) => l.includes(startMarker))
const endIdx = lines.findIndex((l) => l.includes(endMarker))
if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) process.exit(0) // idempotent

const stripped = [...lines.slice(0, startIdx), ...lines.slice(endIdx + 1)]
// Preserve trailing newline shape of original (Unix-style LF, no CRLF reintroduce).
const out = stripped.join('\n').replace(/\n+$/, '\n')
writeFileSync(filePath, out, 'utf8')
console.log(`[strip-claude-md-section] removed ${endIdx - startIdx + 1} lines from ${filePath}`)
