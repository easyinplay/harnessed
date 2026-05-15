// Phase 1.4 T3.3 — main agent system prompt verbatim COMPLETE template (Pattern O).
// Phase 1.5 T5.1 — `<promise>COMPLETE</promise>` XML wrapper upgrade (ADR 0009 §
// Decision Errata 3 / D1.5-4 sub-item 3 / R2 fresh 2026-05-14).
// Phase 2.2 W2 T2.3 — dual-signal PRIMARY schema inject (ADR 0011 errata B-02
// B-27 PATTERNS § 2.3 / § 2.5 row 5). Belt-and-suspenders: when outputFormat
// json_schema is set on the query, agents emit a structured object conforming
// to COMPLETION_SCHEMA (PRIMARY signal); they ALSO emit
// `<promise>COMPLETE</promise>` (FALLBACK signal — required for inner-layer
// subagent completion detection per RESEARCH § 1.3 4-layer table).
//
// IMPL NOTE — 1:1 对应 docs/AGENT-DEFINITION-FACTORY-CONTRACT.md § 5.4 verbatim
// COMPLETE template. D-18 plan-checker enforce: any drift here = ADR 0009+
// errata trigger. F33 P1 mitigation — main agent must pass subagent final
// message verbatim (no summarize/paraphrase) so that the COMPLETE token
// survives round-trip.
//
// Phase 1.5 upgrade: raw `^COMPLETE$/m` regex → `<promise>COMPLETE</promise>`
// verbatim XML wrapper. The XML wrapper disambiguates think-out-loud text (e.g.
// "I should output COMPLETE to signal done") from the actual completion signal.
// SPIKE-REPORT-2.md § 3 validated `<promise>([^<]+)</promise>` extract is robust
// against false positives that the raw `^COMPLETE$/m` regex was prone to.
// Switching to the official `--add-plugin ralph-wiggum` plugin (phase 2.1+,
// ADR 0010+ evaluation window) keeps this protocol unchanged — `<promise>...
// </promise>` is the ralph-wiggum official tag format.
//
// Pattern O (phase 1.4) — verbatim instructional prompt template; the const
// SYSTEM_PROMPT is the single source of truth consumed by engine.ts and echoed
// inside agentDefinition.ts via COMPLETE_INSTRUCTION (routing-engine.test.ts
// asserts toContain to lock drift).

import { COMPLETION_SCHEMA } from './completionSchema.js'

/** Main agent system prompt — F33 P1 verbatim COMPLETE 强制 + skills fail-fast
 *  + max-iterations × maxTurns 兜底. Sourced 1:1 from contract § 5.4.
 *  Phase 2.2 W2 T2.3 appends a dual-signal segment for the SC3 PRIMARY path. */
export const SYSTEM_PROMPT = `## RULE: subagent COMPLETE marker
When you spawn a subagent and it returns a final message:
1. **DO NOT summarize, paraphrase, or interpret the subagent's final message**
2. **DO NOT skip or omit the COMPLETE marker**
3. The subagent will emit \`<promise>COMPLETE</promise>\` (exact verbatim XML wrapper) when done
4. You MUST verbatim grep \`<promise>COMPLETE</promise>\` from final message → if present, treat task as done
5. If \`<promise>COMPLETE</promise>\` absent → re-spawn subagent (max 20 iterations); after max, throw VerbatimCompleteFailError

## skills fail-fast handling
- SkillNotInstalledError → print user-friendly fix command (e.g., "Run: harnessed install <name>")
- RestartRequiredError → print "请 exit + restart Claude Code 让 plugin 生效"

## 兜底 max-iterations
- max-iterations 20 (external ralph-loop) × maxTurns 50 (internal AgentDefinition) = 1000 round-trips worst case

## Completion signal (dual-signal — emit BOTH)
If \`outputFormat: { type: 'json_schema' }\` is set on this query, emit a final-turn output conforming to the schema (status/phase/summary/blockers — keys: ${Object.keys(COMPLETION_SCHEMA.properties).join(', ')}).
AND emit \`<promise>COMPLETE</promise>\` (FALLBACK signal — required regardless of structured output presence, for inner-layer subagent completion detection per RESEARCH § 1.3).
`

/** Subagent-side CRITICAL RULE — prepended into AgentDefinition.prompt by the
 *  factory (T3.2). Instructs the subagent to emit `<promise>COMPLETE</promise>`
 *  verbatim once done so the main agent's XML-wrapper extract matches without
 *  paraphrase loss and without think-out-loud false positives. */
export const COMPLETE_INSTRUCTION = `## CRITICAL RULE: COMPLETE marker
When your task is done, emit the exact verbatim XML wrapper
\`<promise>COMPLETE</promise>\` on its own line and nothing else after it. Do
NOT emit any other variant — not "completed", not "DONE", not bare \`COMPLETE\`,
not "✅". The parent agent will verbatim grep \`<promise>COMPLETE</promise>\` —
any deviation fails the round-trip and forces a re-spawn (max 20 iterations).
`
