// 4.30.0 (issue #6) — Stop hook entry: auto-recover silent "mode-B" tool-call
// corruption. Claude Code sometimes mis-samples the tool-open delimiter into a
// garbage word (count/court/…), so the whole <invoke>…</invoke> block is emitted
// as PLAIN TEXT — no tool runs, no error, the turn just ends and the model gets
// no failure signal. The Stop hook fires at turn end; on detecting the mode-B
// signature it returns {"decision":"block","reason":…} to hand the model one
// fresh turn to re-emit the call as a real tool_use — no user "retry" needed.
//
// architecture review #5 — this TS module is the SINGLE SOURCE for the hook.
// `scripts/build-hooks.mjs` esbuild-bundles it into the self-contained,
// dep-free `bin/harnessed-stop-hook.mjs` that the npm-mode hook runs and the
// compiled `harnessed stop-hook` subcommand dynamic-imports. The mode-B detector
// is imported from `./modeBDetect.js` (no hand-mirror); the file-resolution glue
// below lives here (hook-specific, no other consumer). Fail-soft: ANY error or
// non-match exits 0 with no output (a Stop hook must never wedge a turn end).
//
// stdin payload (CC Stop hook): {session_id, transcript_path, stop_hook_active,
// hook_event_name, cwd, …}. Loop guard: stop_hook_active + a per-(session,
// message-signature) retry cap of MAX_RETRIES persisted under the state root.

import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { type ContentBlock, detectModeB } from './modeBDetect.js'

const MAX_RETRIES = 2

function stateRoot(): string {
  const override = process.env.HARNESSED_ROOT_OVERRIDE
  return override !== undefined && override !== ''
    ? override
    : join(homedir(), '.claude', 'harnessed')
}

/** The signature of the corrupted message (its joined text), for the retry cap. */
function messageSig(content: ContentBlock[]): string {
  const text = content
    .filter((b) => b && b.type === 'text' && typeof b.text === 'string')
    .map((b) => b.text as string)
    .join('\n')
  return createHash('sha256').update(text).digest('hex').slice(0, 16)
}

/** Read the LAST assistant message's content blocks from a transcript JSONL.
 *  Streams from the file tail (transcripts run to 100k+ lines) — read the last
 *  ~256KB, split to lines, scan bottom-up for the last {type:'assistant'} entry.
 *  Returns null on any failure (fail-soft). */
function lastAssistantContent(transcriptPath: string | undefined): ContentBlock[] | null {
  try {
    if (!transcriptPath || !existsSync(transcriptPath)) return null
    const buf = readFileSync(transcriptPath)
    const slice = buf.length > 262144 ? buf.subarray(buf.length - 262144) : buf
    const lines = slice.toString('utf8').split('\n')
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = (lines[i] ?? '').trim()
      if (!line) continue
      let obj: { type?: string; message?: { content?: unknown }; content?: unknown }
      try {
        obj = JSON.parse(line)
      } catch {
        continue // partial first line from the tail slice, or non-JSON
      }
      // CC transcript rows: {type:'assistant', message:{role, content:[…]}}
      if (obj && obj.type === 'assistant') {
        const content = obj.message?.content ?? obj.content
        return Array.isArray(content) ? (content as ContentBlock[]) : null
      }
    }
  } catch {
    // fall through
  }
  return null
}

function retryStore(sessionId: unknown): string {
  const id = createHash('sha256')
    .update(String(sessionId ?? 'nosession'))
    .digest('hex')
    .slice(0, 16)
  return join(stateRoot(), 'stop-hook-retries', `${id}.json`)
}

function readRetry(path: string): { sig: string; count: number } {
  try {
    if (!existsSync(path)) return { sig: '', count: 0 }
    const j = JSON.parse(readFileSync(path, 'utf8'))
    return { sig: typeof j.sig === 'string' ? j.sig : '', count: Number(j.count) || 0 }
  } catch {
    return { sig: '', count: 0 }
  }
}

function writeRetry(path: string, sig: string, count: number): boolean {
  try {
    mkdirSync(join(path, '..'), { recursive: true })
    writeFileSync(path, JSON.stringify({ sig, count }), 'utf8')
    return true
  } catch {
    return false
  }
}

function readStdin(): Promise<string> {
  return new Promise((resolve) => {
    let data = ''
    if (process.stdin.isTTY) return resolve('')
    process.stdin.setEncoding('utf8')
    process.stdin.on('data', (c) => {
      data += c
    })
    process.stdin.on('end', () => resolve(data))
    process.stdin.on('error', () => resolve(data))
    setTimeout(() => resolve(data), 2000).unref?.()
  })
}

async function main(): Promise<void> {
  const raw = await readStdin()
  let payload: {
    stop_hook_active?: boolean
    transcript_path?: string
    session_id?: unknown
  }
  try {
    payload = JSON.parse(raw)
  } catch {
    return // no payload → nothing to do
  }
  // Loop guard 1: the runtime flags a stop that was already re-issued by a hook.
  if (payload.stop_hook_active === true) return

  const content = lastAssistantContent(payload.transcript_path)
  if (!content || !detectModeB(content)) return

  // Loop guard 2: per-(session, message signature) retry cap. Only honor the cap
  // when the increment persists — else count would freeze and never recover.
  const sig = messageSig(content)
  const store = retryStore(payload.session_id)
  const prev = readRetry(store)
  const count = prev.sig === sig ? prev.count : 0
  if (count >= MAX_RETRIES) return // give up — avoid an infinite corrupt loop
  const saved = writeRetry(store, sig, count + 1)
  if (!saved) return // could not record → do not block (fail-soft, no loop risk)

  process.stdout.write(
    `${JSON.stringify({
      decision: 'block',
      reason:
        'MODE-B tool corruption detected: your previous message emitted a tool call as plain text (the opening delimiter was mis-sampled to a garbage word). Re-emit that exact same tool call now as a real tool call — content unchanged.',
    })}\n`,
  )
}

main().catch(() => {
  // fail-soft — a Stop hook must never wedge a normal turn end
})
