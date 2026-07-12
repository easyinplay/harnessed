// 4.30.0 (issue #6) — mode-B tool-call corruption detector.
//
// Claude Code occasionally mis-samples the tool-open delimiter into a garbage
// word (count/court/…, varies each time), so the whole <invoke>…</invoke> block
// is emitted as PLAIN TEXT. The harness does not recognize a tool call, no error
// is raised, the turn just ends — the model gets no failure signal and cannot
// self-recover. The Stop hook uses this detector to force one auto-retry.
//
// Detector (issue #6 comment — key on the structural invariant, not the garbage
// word, which changes every time): the tokens `<invoke name="` / `<parameter
// name="` ONLY ever exist as a structured tool_use block in normal operation, so
// their presence in an assistant message's TEXT content == corruption. Empirical
// run over a real 12,104-turn transcript: 76/76 true positives, 1 false positive
// (meta-discussion of the tags in un-fenced prose). Two false-positive gates kill
// that class: (a) strip fenced+inline code; (b) END-ANCHOR — real mode-B truncates
// AT the tool call so the tags sit in the message tail, while meta-discussion puts
// them mid-message with prose after.

/** A content block from an assistant message (Claude Code transcript shape). */
export interface ContentBlock {
  type?: string
  text?: string
  [k: string]: unknown
}

/** The last tool tag must sit within this many chars of the message end to count
 *  as tail-anchored. Real mode-B TRUNCATES at the corrupted tool call, so a tag is
 *  right at the tail (only the partial params follow); meta-discussion keeps
 *  writing sentences after the tags, pushing them far from the end. Absolute (not
 *  a ratio) so short mode-B messages — whose own truncated params are a big
 *  fraction of a small total — are not misjudged. Cleared the lone empirical FP
 *  (12k-turn run) with all 76 TPs intact. */
const TAIL_WINDOW = 200

const INVOKE_RE = /<invoke name="/g
const PARAM_RE = /<parameter name="/g

function stripCode(s: string): string {
  // fenced ```…``` then inline `…` — so meta-discussion of the tags inside code
  // never false-positives.
  return s.replace(/```[\s\S]*?```/g, '').replace(/`[^`]*`/g, '')
}

function lastIndexOfRe(s: string, re: RegExp): number {
  let last = -1
  re.lastIndex = 0
  for (let m = re.exec(s); m !== null; m = re.exec(s)) last = m.index
  return last
}

/**
 * True when the assistant message content is a mode-B corruption: no structured
 * tool_use block this turn, yet the code-stripped text carries BOTH tool-call
 * tags with the last one anchored in the message tail.
 */
export function detectModeB(content: ContentBlock[]): boolean {
  if (!Array.isArray(content) || content.length === 0) return false
  // A real tool call is a structured tool_use block ⇒ never mode-B.
  if (content.some((b) => b && b.type === 'tool_use')) return false

  const text = content
    .filter((b) => b && b.type === 'text' && typeof b.text === 'string')
    .map((b) => b.text as string)
    .join('\n')
  if (text.length === 0) return false

  const stripped = stripCode(text)
  if (stripped.length === 0) return false

  // Invariant: both tags present in TEXT == the opening delimiter was mis-sampled.
  const invokeAt = lastIndexOfRe(stripped, INVOKE_RE)
  const paramAt = lastIndexOfRe(stripped, PARAM_RE)
  if (invokeAt < 0 || paramAt < 0) return false

  // End-anchor: the last tool tag sits within TAIL_WINDOW chars of the message
  // end (mode-B truncates at the tool call; meta-discussion continues in prose).
  const lastTag = Math.max(invokeAt, paramAt)
  return stripped.length - lastTag <= TAIL_WINDOW
}
