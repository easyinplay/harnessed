// Phase 18 — CodeGraph opt-in doctor detect. CodeGraph (@colbymchenry/codegraph,
// MIT, 100% local) is an optional semantic code index that self-installs via its
// own CLI; harnessed only catalogs (manifests/optional/codegraph.yaml) + detects.
// ALWAYS returns 'pass': the absence of an opt-in tool is not a health failure, so
// it never flips the doctor summary. Presence is detected by the per-project
// `.codegraph/` index directory (fs, deterministic, no subprocess).

import { existsSync } from 'node:fs'
import { join } from 'node:path'
import type { CheckResult } from './check-builtin.js'

export function checkCodeGraph(cwd: string = process.cwd()): CheckResult {
  const present = existsSync(join(cwd, '.codegraph'))
  if (present) {
    return {
      name: 'codegraph',
      status: 'pass',
      message: 'CodeGraph semantic index detected (.codegraph/)',
    }
  }
  return {
    name: 'codegraph',
    status: 'pass',
    message:
      'CodeGraph not configured (optional semantic index — fewer tool-calls on code navigation)',
    // v4.17.0 — BOTH enable steps: `npx @colbymchenry/codegraph` only wires the
    // MCP server into agents (upstream README step 2); the per-project index is
    // the separate `codegraph init` (step 3). The pre-4.17.0 hint stopped at
    // step 1, leaving `.codegraph/` absent and this check forever "not configured".
    fix: 'npx @colbymchenry/codegraph to wire agents, then `codegraph init` in each project to build the index (MIT, 100% local; auto-sync keeps it fresh)',
  }
}
