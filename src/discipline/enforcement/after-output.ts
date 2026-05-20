// src/discipline/enforcement/after-output.ts — Phase v3.0-3.3 W0 T3.3.W0.9 (R30.9).
// Hook trigger: response emission 后 (chat target only);validate output-style + language rules.
//
// NOTE: v3.0 unit-test only; production response output wire deferred v3.x per K5 + D-09
// superset commitment (M-3 advisory inline patch). Heuristics here are seed for v3.x
// production integration with chat response stream.

import { loadDiscipline } from '../../workflow/disciplineLoader.js'

export interface OutputHookCtx {
  responseText: string
  responseTarget: 'chat' | 'file' | 'commit-message'
  userRequestedEmoji: boolean
  packageRoot: string
}

const EM_DASH_RE = /——|—/
const EMOJI_RE = /\p{Emoji_Presentation}/u
const SYCOPHANTIC_RE = /(好问题|太棒了|完美|希望对你有帮助|还需要别的吗|要不要我帮你)/
const END_RECAP_RE = /## 总结|## Summary|综上所述|In summary/

/** Returns warning strings; does NOT exit. Caller emits via console.warn. */
export async function runAfterOutputHook(ctx: OutputHookCtx): Promise<string[]> {
  if (ctx.responseTarget !== 'chat') return []
  const warns: string[] = []
  // Eagerly load both styles for cache warm + future fields (no field reads needed today).
  await Promise.all([
    loadDiscipline('output-style', ctx.packageRoot),
    loadDiscipline('language', ctx.packageRoot),
  ])

  const firstSentence = ctx.responseText.split(/[。.!?\n]/)[0] ?? ''
  if (firstSentence.length > 100) warns.push('BLUF missing: first sentence > 100 char')

  if (EM_DASH_RE.test(ctx.responseText)) warns.push('em-dash detected (auto-fix recommended)')

  if (!ctx.userRequestedEmoji && EMOJI_RE.test(ctx.responseText)) {
    warns.push('emoji used without explicit user request')
  }

  if (SYCOPHANTIC_RE.test(ctx.responseText)) warns.push('sycophantic phrase detected')

  const lastChunk = ctx.responseText.slice(-200)
  if (END_RECAP_RE.test(lastChunk)) warns.push('redundant end recap detected')

  for (const w of warns) console.warn(`⚠️ output-style: ${w}`)
  return warns
}
