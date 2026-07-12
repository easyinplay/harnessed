#!/usr/bin/env node
// 4.30.0 (issue #6) — Stop hook: auto-recover silent "mode-B" tool-call
// corruption. Claude Code sometimes mis-samples the tool-open delimiter into a
// garbage word (count/court/…), so the whole <invoke>…</invoke> block is emitted
// as PLAIN TEXT — no tool runs, no error, the turn just ends and the model gets
// no failure signal. The Stop hook fires at turn end; on detecting the mode-B
// signature it returns {"decision":"block","reason":…} to hand the model one
// fresh turn to re-emit the call as a real tool_use — no user "retry" needed.
//
// Self-contained plain JS (no project imports) — must stay equivalent to
// src/checkpoint/modeBDetect.ts detectModeB; the parity test in
// tests/checkpoint/stopHook.test.ts runs this file and cross-checks. Fail-soft:
// ANY error or non-match exits 0 with no output (a Stop hook must never wedge a
// normal turn end).
//
// stdin payload (CC Stop hook): {session_id, transcript_path, stop_hook_active,
// hook_event_name, cwd, …}. Loop guard: stop_hook_active + a per-(session,
// message-signature) retry cap of MAX_RETRIES persisted under the state root.
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const MAX_RETRIES = 2
const TAIL_WINDOW = 200

function stateRoot() {
  const override = process.env.HARNESSED_ROOT_OVERRIDE
  return override !== undefined && override !== ''
    ? override
    : join(homedir(), '.claude', 'harnessed')
}

function stripCode(s) {
  return s.replace(/```[\s\S]*?```/g, '').replace(/`[^`]*`/g, '')
}

function lastIndexOfRe(s, reSrc) {
  const re = new RegExp(reSrc, 'g')
  let last = -1
  for (let m = re.exec(s); m !== null; m = re.exec(s)) last = m.index
  return last
}

// Mirror of src/checkpoint/modeBDetect.ts detectModeB.
function detectModeB(content) {
  if (!Array.isArray(content) || content.length === 0) return false
  if (content.some((b) => b && b.type === 'tool_use')) return false
  const text = content
    .filter((b) => b && b.type === 'text' && typeof b.text === 'string')
    .map((b) => b.text)
    .join('\n')
  if (text.length === 0) return false
  const stripped = stripCode(text)
  if (stripped.length === 0) return false
  const invokeAt = lastIndexOfRe(stripped, '<invoke name="')
  const paramAt = lastIndexOfRe(stripped, '<parameter name="')
  if (invokeAt < 0 || paramAt < 0) return false
  const lastTag = Math.max(invokeAt, paramAt)
  return stripped.length - lastTag <= TAIL_WINDOW
}

/** The signature of the corrupted message (its joined text), for the retry cap. */
function messageSig(content) {
  const text = content
    .filter((b) => b && b.type === 'text' && typeof b.text === 'string')
    .map((b) => b.text)
    .join('\n')
  return createHash('sha256').update(text).digest('hex').slice(0, 16)
}

/** Read the LAST assistant message's content blocks from a transcript JSONL.
 *  Streams from the file tail (transcripts run to 100k+ lines) — read the last
 *  ~256KB, split to lines, scan bottom-up for the last {type:'assistant'} entry.
 *  Returns null on any failure (fail-soft). */
function lastAssistantContent(transcriptPath) {
  try {
    if (!transcriptPath || !existsSync(transcriptPath)) return null
    const buf = readFileSync(transcriptPath)
    const slice = buf.length > 262144 ? buf.subarray(buf.length - 262144) : buf
    const lines = slice.toString('utf8').split('\n')
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].trim()
      if (!line) continue
      let obj
      try {
        obj = JSON.parse(line)
      } catch {
        continue // partial first line from the tail slice, or non-JSON
      }
      // CC transcript rows: {type:'assistant', message:{role, content:[…]}}
      if (obj && obj.type === 'assistant') {
        const content = obj.message?.content ?? obj.content
        return Array.isArray(content) ? content : null
      }
    }
  } catch {
    // fall through
  }
  return null
}

function retryStore(sessionId) {
  const id = createHash('sha256')
    .update(String(sessionId ?? 'nosession'))
    .digest('hex')
    .slice(0, 16)
  return join(stateRoot(), 'stop-hook-retries', `${id}.json`)
}

function readRetry(path) {
  try {
    if (!existsSync(path)) return { sig: '', count: 0 }
    const j = JSON.parse(readFileSync(path, 'utf8'))
    return { sig: typeof j.sig === 'string' ? j.sig : '', count: Number(j.count) || 0 }
  } catch {
    return { sig: '', count: 0 }
  }
}

function writeRetry(path, sig, count) {
  try {
    mkdirSync(join(path, '..'), { recursive: true })
    writeFileSync(path, JSON.stringify({ sig, count }), 'utf8')
    return true
  } catch {
    return false
  }
}

function readStdin() {
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

async function main() {
  const raw = await readStdin()
  let payload
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
