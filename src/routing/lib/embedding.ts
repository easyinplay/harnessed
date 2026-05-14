// Phase 1.5 T3.3 — embedding lib placeholder (interface only, ≤30L hard limit).
//
// IMPL NOTE — implements ADR 0009 § Decision + D1.5-2 lock + D-21 LOC budget
// (≤30L). v0.1 is interface-only — Semantic Router L2 (semanticRouter.ts) is a
// stub returning null, so no embedding implementation is needed yet. v0.2+
// implements this against BGE-small via @xenova/transformers (WASM runtime),
// gated on: 30 → 100+ routing samples × multi-model × stability validation
// (Pattern E spillover-to-lib/, mirrors lib/ralphLoop.ts split pattern).
// NO new deps in phase 1.5 (D1.5-2 + D1.5-5) — this file exports types only.

/** Embedding provider contract — v0.2+ implements; v0.1 ships the type only. */
export interface EmbeddingProvider {
  /** Embed text into a dense vector (BGE-small → 384-dim in the v0.2+ impl). */
  embed(text: string): Promise<number[]>
  /** Cosine similarity between two equal-length vectors, range [-1, 1]. */
  cosine(a: number[], b: number[]): number
}
