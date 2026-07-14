// 4.31.2 (issue #7) — headless detection for the Agent-Teams-upgrade gate.
//
// Root cause (Phase 1 diagnosis): under headless `claude -p`, /auto's
// spawn-based orchestration (Agent Teams background spawn / ralph-loop) leaves
// orphan subprocesses whose piped stdio blocks the host from exiting (11h hang).
// Agent Teams are session-scoped (lost on /resume) — fundamentally incompatible
// with headless. Fix = suppress escalate_to_teams when headless.
//
// Detection reality (probed, NOT guessed): the CC `system/init` transcript
// exposes NO entrypoint/headless field (only cwd/session_id/model/permissionMode
// = bypassPermissions, which maps to --dangerously-skip-permissions, not
// headless). And `harnessed gates` runs as a Bash-tool subprocess whose stdout
// is ALWAYS a pipe (isTTY===false) in BOTH interactive and headless sessions —
// so isTTY cannot discriminate and using it would disable teams for everyone.
// The only reliable signal is the explicit `HARNESSED_HEADLESS=1` env, which
// harnessed's own headless entry points (evidence-pack runner; documented for
// CI/headless users) set and which propagates through CC to the gates subprocess.

import { describe, expect, it } from 'vitest'
import { detectHeadless } from '../../../src/cli/lib/detectHeadless.js'

describe('detectHeadless (issue #7 — conservative: never misjudge interactive)', () => {
  it('explicit HARNESSED_HEADLESS=1 → headless', () => {
    const r = detectHeadless({ HARNESSED_HEADLESS: '1' }, false)
    expect(r.headless).toBe(true)
    expect(r.signal).toBe('explicit-env')
  })

  it('HARNESSED_HEADLESS with any other value → NOT headless', () => {
    expect(detectHeadless({ HARNESSED_HEADLESS: '0' }, false).headless).toBe(false)
    expect(detectHeadless({ HARNESSED_HEADLESS: 'true' }, false).headless).toBe(false)
    expect(detectHeadless({ HARNESSED_HEADLESS: '' }, false).headless).toBe(false)
  })

  it('no env → NOT headless (conservative default)', () => {
    const r = detectHeadless({}, false)
    expect(r.headless).toBe(false)
    expect(r.signal).toBe('none')
  })

  // The load-bearing 误判-prevention test: isTTY===false alone must NOT flip
  // headless=true. In the gates-subprocess spawn context stdout is piped in
  // interactive sessions too — flipping on isTTY would disable Agent Teams for
  // every normal user.
  it('isTTY=false alone does NOT make headless (would mass-misjudge interactive)', () => {
    expect(detectHeadless({}, false).headless).toBe(false)
  })

  it('isTTY=true with explicit env still headless (explicit wins)', () => {
    expect(detectHeadless({ HARNESSED_HEADLESS: '1' }, true).headless).toBe(true)
  })
})
