// Type declaration for check-host-primitives.mjs so `tsc --noEmit` resolves the
// vitest import (scripts/** is in tsconfig include; allowJs is off, so a
// hand-written .mjs would otherwise raise TS7016). Runtime stays JS.
// Sibling: scripts/check-skill-i18n-parity.d.mts.

export interface HostPrimitiveViolation {
  /** Repo-relative, forward-slashed path of the offending surface. */
  file: string
  /** 1-based line in the RENDERED text (0 when the site has no line, e.g. a
   *  render failure or a stale allowlist entry). */
  line: number
  /** The matched Claude-Code token, or `(render)` / `(stale-mask)` for the two
   *  non-token violation kinds. */
  token: string
  /** The offending line, or the failure message. */
  detail: string
  /** Yaml field name, present only for the yaml surfaces. */
  field?: string
}

export interface HostPrimitiveResult {
  ok: boolean
  violations: HostPrimitiveViolation[]
  warnings: string[]
}

export interface HostPrimitiveMask {
  phrase: string
  why: string
}

export interface HostPrimitiveYamlSurface {
  /** Path relative to `workflows/`. */
  file: string
  /** Scalar keys whose values a production path renders. */
  fields: string[]
  /** When set, only rules whose `id` is listed count as a rendered surface. */
  ruleIds?: string[]
}

export declare const CC_TOKENS: string[]
export declare const MASKS: HostPrimitiveMask[]
export declare const YAML_SURFACES: HostPrimitiveYamlSurface[]

export function hostMapMarkers(repoRoot: string): { start: string; end: string }
export function maskPhrase(text: string, phrase: string): { text: string; count: number }
export function scanCcTokens(text: string): Array<{ token: string; at: number }>
export function checkHostPrimitives(repoRoot: string): HostPrimitiveResult
