// Phase 1.4 T3.3 — main agent system prompt verbatim COMPLETE template (Pattern O).
//
// IMPL NOTE — 1:1 对应 docs/AGENT-DEFINITION-FACTORY-CONTRACT.md § 5.4 verbatim
// COMPLETE template (frozen at phase 1.3 ship). D-18 plan-checker enforce: any
// drift here = ADR 0008+ errata trigger. F33 P1 mitigation — main agent must
// pass subagent final message verbatim (no summarize/paraphrase) so that the
// COMPLETE token survives round-trip. ADR 0008 § Decision 4 cross-link covers
// the routing engine v1 接口契约 升级 tracking. SPIKE-REPORT.md § 3.1 实测
// (Step 3 PASS, claude CLI v2.1.133 on Win Git Bash) confirms verbatim grep
// `^COMPLETE$` 单行回流 FEASIBLE on the default model.
//
// Pattern O (新生 phase 1.4) — verbatim instructional prompt template; the
// const SYSTEM_PROMPT is the single source of truth consumed by engine.ts and
// echoed inside agentDefinition.ts via COMPLETE_INSTRUCTION (T4.1 cell 11
// asserts toContain to lock drift).

/** Main agent system prompt — F33 P1 verbatim COMPLETE 强制 + skills fail-fast
 *  + max-iterations × maxTurns 兜底. Sourced 1:1 from contract § 5.4. */
export const SYSTEM_PROMPT = `## RULE: subagent COMPLETE marker
When you spawn a subagent and it returns a final message:
1. **DO NOT summarize, paraphrase, or interpret the subagent's final message**
2. **DO NOT skip or omit the COMPLETE marker**
3. The subagent will output \`COMPLETE\` (exact uppercase string, on its own line) when done
4. You MUST verbatim grep \`^COMPLETE$\` from final message → if present, treat task as done
5. If COMPLETE absent → re-spawn subagent (max 20 iterations); after max, throw VerbatimCompleteFailError

## skills fail-fast handling
- SkillNotInstalledError → print user-friendly fix command (e.g., "Run: harnessed install <name>")
- RestartRequiredError → print "请 exit + restart Claude Code 让 plugin 生效"

## 兜底 max-iterations
- max-iterations 20 (external ralph-loop) × maxTurns 50 (internal AgentDefinition) = 1000 round-trips worst case
`

/** Subagent-side CRITICAL RULE — prepended into AgentDefinition.prompt by the
 *  factory (T3.2). Instructs the subagent to emit COMPLETE verbatim once done
 *  so the main agent's `^COMPLETE$` regex matches without paraphrase loss. */
export const COMPLETE_INSTRUCTION = `## CRITICAL RULE: COMPLETE marker
When your task is done, output the exact uppercase string \`COMPLETE\` on its
own line and nothing else after it. do NOT summarize or paraphrase. The
parent agent will verbatim grep \`^COMPLETE$\` (multiline) — any deviation
fails the round-trip and forces a re-spawn (max 20 iterations).
`
