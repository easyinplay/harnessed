// Phase 60 — doctor probe for the master kill switch being left ON.
//
// `HARNESSED_OFF=1` exists so a control arm can run without harnessed's
// always-on surface (see src/platform/ablation.ts). Its whole value depends on
// being temporary, and its failure mode is silence: every hook no-ops, nothing
// prints, and the operator concludes harnessed does nothing. That is
// indistinguishable from a broken install unless something says it out loud.
//
// warn, not fail: an intentionally ablated machine is not unhealthy. The point
// is that `harnessed doctor` — the command you run when harnessed "isn't doing
// anything" — names the reason on the first screen.

import { ABLATION_ENV, isAblated } from '../../platform/ablation.js'
import type { CheckResult } from './check-builtin.js'

const NAME = 'ablation switch'

export function checkAblation(env: NodeJS.ProcessEnv = process.env): CheckResult {
  if (!isAblated(env)) {
    return { name: NAME, status: 'pass', message: 'active' }
  }
  return {
    name: NAME,
    status: 'warn',
    message: `${ABLATION_ENV}=1 — harnessed's always-on surface is OFF: every first-party hook no-ops (per-turn injection, SessionStart invalidation, Stop recovery, doc-discipline gate, dashboard autospawn). Nothing else is disabled, and no files were moved.`,
    fix: `unset ${ABLATION_ENV} (or set it to anything other than 1) and start a new session`,
  }
}
