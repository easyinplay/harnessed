// CSV stats CLI: `node src/cli.mjs <file.csv> --mean|--min|--max [--column name]`.
// The CSV must have a header row; `--column` defaults to `value`. Unknown flags
// exit 2 with an error on stderr.

import { readFileSync } from 'node:fs'
import { max, mean, min } from './stats.mjs'

const KNOWN = new Map([
  ['--mean', mean],
  ['--min', min],
  ['--max', max],
])

export function parseCsvColumn(text, column) {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
  if (lines.length < 2) throw new Error('csv needs a header row and at least one data row')
  const header = lines[0].split(',').map((h) => h.trim())
  const idx = header.indexOf(column)
  if (idx === -1) throw new Error(`no such column: ${column}`)
  return lines.slice(1).map((l) => {
    const cell = l.split(',')[idx]?.trim()
    const n = Number(cell)
    if (!Number.isFinite(n)) throw new Error(`not a number: ${cell}`)
    return n
  })
}

export function runCli(argv) {
  const args = argv.slice()
  const file = args.shift()
  if (!file)
    throw Object.assign(new Error('usage: cli.mjs <file.csv> --mean|--min|--max'), { exitCode: 2 })
  let column = 'value'
  const ops = []
  while (args.length > 0) {
    const a = args.shift()
    if (a === '--column') {
      column = args.shift() ?? column
    } else if (KNOWN.has(a)) {
      ops.push(a)
    } else {
      throw Object.assign(new Error(`unknown flag: ${a}`), { exitCode: 2 })
    }
  }
  if (ops.length === 0)
    throw Object.assign(new Error('pick at least one of --mean|--min|--max'), { exitCode: 2 })
  const values = parseCsvColumn(readFileSync(file, 'utf8'), column)
  const out = {}
  for (const op of ops) out[op.slice(2)] = KNOWN.get(op)(values)
  return out
}

if (
  process.argv[1] &&
  import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/').split('/').pop())
) {
  try {
    console.log(JSON.stringify(runCli(process.argv.slice(2))))
  } catch (e) {
    console.error(String(e.message ?? e))
    process.exit(e.exitCode ?? 1)
  }
}
