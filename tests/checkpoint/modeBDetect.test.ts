// 4.30.0 (issue #6) — mode-B tool-call corruption detector. The model sometimes
// mis-samples the tool-open delimiter into a garbage word (count/court/…), so the
// whole <invoke>…</invoke> block is emitted as PLAIN TEXT and no tool runs. The
// detector keys on the structural invariant (issue #6 comment): these tags only
// ever exist as a structured tool_use block, so their presence in TEXT content ==
// mode-B corruption. False-positive gate: end-anchor/unterminated (real mode-B
// truncates mid-call) + code-fence strip (suppresses meta-discussion of the tags).

import { describe, expect, it } from 'vitest'
import { detectModeB } from '../../src/checkpoint/modeBDetect.js'

// helper: an assistant message content-block array
const text = (t: string) => [{ type: 'text', text: t }]

describe('detectModeB — structural tag-in-text invariant', () => {
  it('fires on the real corruption signature (garbage word + unterminated <invoke>)', () => {
    // verbatim shape from issue #6 evidence
    const msg = text(
      '本次用到:Bash(核实 61-03)。做外科修改。\n\ncourt\n<invoke name="Read">\n<parameter name="file_path">/d/x</parameter>',
    )
    expect(detectModeB(msg)).toBe(true)
  })

  it('fires on the second real signature (count + <invoke name="Edit">)', () => {
    const msg = text(
      '路径修正是当前唯一 BLOCKER。改。\n\ncount\n<invoke name="Edit">\n<parameter name="a">b',
    )
    expect(detectModeB(msg)).toBe(true)
  })

  it('does NOT fire when the turn produced a structured tool_use block', () => {
    const msg = [
      { type: 'text', text: 'let me read it' },
      { type: 'tool_use', name: 'Read', input: { file_path: '/x' } },
    ]
    expect(detectModeB(msg)).toBe(false)
  })

  it('does NOT fire on meta-discussion inside a fenced code block', () => {
    const msg = text(
      'The detector matches when text contains:\n```js\n`<invoke name="Bash">` and `<parameter name="x">`\n```\nThat is the rule.',
    )
    expect(detectModeB(msg)).toBe(false)
  })

  it('does NOT fire on meta-discussion with tags mid-message + prose after (not truncated)', () => {
    // the one false-positive class from the 12k-turn empirical run: tags in prose,
    // NOT at end, followed by more text → end-anchor gate rejects it.
    const msg = text(
      'The bug is that <invoke name="Bash"> with <parameter name="cmd"> leaks as text. ' +
        'We fix it with a Stop hook. Here is a long paragraph explaining the whole design in detail ' +
        'so the invoke tag sits far from the end of the message and is clearly terminated discussion. ' +
        'More prose. More prose. More prose to push the tag out of the tail region entirely, done.',
    )
    expect(detectModeB(msg)).toBe(false)
  })

  it('requires BOTH <invoke name=" AND <parameter name=" (single tag = no fire)', () => {
    expect(detectModeB(text('garbage\n<invoke name="Bash">'))).toBe(false)
  })

  it('empty / text-only-no-tags → no fire', () => {
    expect(detectModeB(text('just a normal reply, no tags at all'))).toBe(false)
    expect(detectModeB([])).toBe(false)
  })
})
