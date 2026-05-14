// Phase 1.5 T3.2 — Semantic Router L2 (v0.1 stub, ≤150L hard limit).
//
// IMPL NOTE — implements ADR 0009 § Decision + D1.5-2 lock + D-20 LOC budget
// (≤150L). v0.1 is a STUB: `match()` always returns a no-match result. This
// is intentional — the routing engine's L1 keyword arbitrate (decisionRules.ts)
// + L3 fallback_supervisor LLM cover all current cases, and ML embedding deps
// are deferred to v0.2+ per D1.5-2 (RESEARCH § 2.4 fallback-path design).
//
// v0.2+ activation triggers (all required):
//   - routing sample corpus grows 30 → 100+ samples across multiple models
//   - user logs surface ≥10 real L1-miss + L3-mis-hit cases
//   - cross-OS CI verifies HuggingFace model fetch on all 3 platforms
// When activated, ONLY the body of `match()` changes — the contract
// (`match(prompt, threshold) -> Promise<SemanticMatchResult>`) is frozen here
// so v0.2+ is a drop-in body swap, not an interface change (PLAN.md § 4 #2/#3).
//
// The v0.2+ implementation will: embed `prompt` via lib/embedding.ts
// (EmbeddingProvider, BGE-small), kNN cosine-similarity against pre-embedded
// rule trigger phrases, and return the best rule whose confidence ≥ threshold.

import type { Rule } from './decisionRules.js'
import type { EmbeddingProvider } from './lib/embedding.js'

/**
 * Three-state-friendly result of {@link match} — narrow on `matched`:
 *  - `matched: true`  → `rule` is the semantically-matched rule, `confidence`
 *                       is the cosine similarity (≥ threshold).
 *  - `matched: false` → `rule` is null, `confidence` is 0 (v0.1 stub always).
 *
 * Mirrors the `EngineResult` discriminated-union style (F41 takeaway).
 */
export interface SemanticMatchResult {
  /** Whether a rule was matched above the similarity threshold. */
  matched: boolean
  /** The matched rule, or null when `matched` is false. */
  rule: Rule | null
  /** Cosine similarity confidence in [0, 1]; 0 in the v0.1 stub. */
  confidence: number
}

/** Default similarity threshold — aligned with LangChain industry baseline. */
export const DEFAULT_SEMANTIC_THRESHOLD = 0.85

/**
 * Semantic Router L2 — v0.1 STUB.
 *
 * Always returns `{ matched: false, rule: null, confidence: 0 }`. The routing
 * engine calls this between L1 keyword arbitrate and L3 fallback_supervisor;
 * in v0.1 it is a guaranteed pass-through to L3 (RESEARCH § 2.4).
 *
 * @param prompt    - the user task prompt to semantically match (unused in v0.1).
 * @param threshold - minimum cosine similarity to count as a match (unused in
 *                    v0.1; defaults to {@link DEFAULT_SEMANTIC_THRESHOLD}).
 * @returns a Promise of {@link SemanticMatchResult} — always no-match in v0.1.
 */
export async function match(
  prompt: string,
  threshold: number = DEFAULT_SEMANTIC_THRESHOLD,
): Promise<SemanticMatchResult> {
  // v0.1 stub — no embedding, no kNN. Reference the params so the contract is
  // visible to v0.2+ implementers and lint stays clean.
  void prompt
  void threshold
  return { matched: false, rule: null, confidence: 0 }
}

/**
 * v0.2+ activation seam — constructs the live semantic router once an
 * EmbeddingProvider is available. NOT wired in v0.1; throws to make accidental
 * early use loud rather than silently degrading.
 *
 * @param provider - the embedding provider (BGE-small in v0.2+).
 * @throws always in v0.1 — Semantic Router L2 is deferred (D1.5-2).
 */
export function createSemanticRouter(provider: EmbeddingProvider): never {
  void provider
  throw new Error(
    'Semantic Router L2 is a v0.1 stub — ML embedding deferred to v0.2+ (ADR 0009 / D1.5-2). ' +
      'Use match() which returns no-match, falling through to the L3 fallback supervisor.',
  )
}
