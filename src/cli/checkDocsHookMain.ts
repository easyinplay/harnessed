// Dedicated Codex/npm hook entry for `check-docs`. The plugin shim invokes this
// binary when it exists, avoiding a full `dist/cli.mjs` import on the PreToolUse
// hot path while sharing the exact command body with the public CLI.

import { runCheckDocsCommand } from './checkDocs.js'

const raw = process.argv.slice(2)
const args = raw[0] === 'check-docs' ? raw.slice(1) : raw
const value = (name: string): string | undefined => {
  const at = args.indexOf(`--${name}`)
  if (at >= 0) return args[at + 1]
  const prefix = `--${name}=`
  return args.find((a) => a.startsWith(prefix))?.slice(prefix.length)
}
const has = (name: string): boolean => args.includes(`--${name}`)

try {
  await runCheckDocsCommand({
    json: has('json'),
    cwd: value('cwd'),
    maxStateLines: value('max-state-lines'),
    hook: has('hook'),
    platform: value('platform'),
  })
} catch (error) {
  console.error((error as Error).message)
  process.exit(1)
}
