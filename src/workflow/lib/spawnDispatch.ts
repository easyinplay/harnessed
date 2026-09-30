// v16.0 Phase 66 T3b — pick the spawn mechanism for the host this process runs on.
//
// T2 built `codexExecSpawn` and left it with no caller, so on a codex host the
// CI / headless spawn still went through `sdkSpawn` — an in-process
// `@anthropic-ai/claude-agent-sdk` query, which on codex cannot work at all.
// This module is that missing edge, and nothing more: no retry, no envelope
// handling, no failure classification. Those live in the two spawners.
//
// WHY A SEPARATE MODULE and not three lines inside run.ts:
//   * run.ts is `vi.mock`ed by several suites; a new import of
//     `codexExecSpawn` there would have to be added to every mock factory.
//   * the routing decision is worth testing on its own, with both spawners
//     injected, which is impossible for a branch buried in a closure.
//
// SCOPE (task_plan R3). This is the CI / headless face only. `harnessed run` /
// `harnessed research` are gated off inside a live host session by
// `isNestedHarnessContext()` (src/cli/run.ts, src/cli/research.ts), and the
// interactive face was covered in Phase 65 by rendering the host's OWN spawn
// primitive into the SKILL.md body. Do not reach for this from an interactive
// path.
//
// Deliberately imports ONLY `sdkSpawn` from ./sdkSpawn.js — the same single
// binding run.ts imported before — so the suites that mock that module with a
// one-export factory keep working.

import { type HostId, toHostId } from '../../cli/lib/hostPrimitives.js'
import { detectPlatform } from '../../platform/platform.js'
import type { AgentDefinition } from './agentDefinition.js'
import { codexExecSpawn } from './codexExecSpawn.js'
import { sdkSpawn } from './sdkSpawn.js'

/** The call shape `ralphLoopWrap` drives, i.e. exactly today's `SdkSpawnOpts`
 *  subset that run.ts fills. Kept structural rather than importing
 *  `SdkSpawnOpts` so the codex branch is not typed against the claude path. */
export interface SpawnDispatchOpts {
  expertName: string
  /** claude only — see the codex note in `dispatchSpawn`. */
  resumeSessionId?: string
  /** claude only — see the codex note in `dispatchSpawn`. */
  onSessionId?: (id: string) => void
}

export interface SpawnDispatchDeps {
  hostId?: () => HostId
  sdkSpawn?: (def: AgentDefinition, opts: SpawnDispatchOpts) => Promise<string>
  codexExecSpawn?: (def: AgentDefinition, opts: { expertName: string }) => Promise<string>
}

/** The host this process is RUNNING under (not an install target). Honours
 *  `HARNESSED_PLATFORM`, which is also how a test pins it. */
export function resolveSpawnHost(): HostId {
  return toHostId(detectPlatform().id)
}

/**
 * Spawn one subagent through the mechanism the current host supports, and
 * return the shared JSON envelope string either spawner produces.
 *
 * claude — `sdkSpawn(def, opts)` with `opts` forwarded UNCHANGED. That call is
 *   byte-identical to the pre-dispatch one on purpose: 13 eval goldens and the
 *   tests/workflow/ assertions ride on it.
 *
 * codex — `codexExecSpawn(def, { expertName })`. The session fields are dropped,
 *   not translated: `codex exec --ephemeral` persists no session file (findings
 *   F5), so its `thread.started.thread_id` can never be replayed as a resume
 *   token. Forwarding `onSessionId` would make `ralphLoopWrap` hand that id back
 *   as `resumeSessionId` on the next iteration and every codex retry would
 *   claim to resume a session that does not exist. Each iteration is a fresh
 *   `codex exec`; that is the correct semantics here, not a limitation being
 *   papered over.
 *
 * `codexExecSpawn` re-checks the host at its own entry (`HostNotCodexError`), so
 * a caller that routes here wrongly still cannot launch codex from claude.
 */
export async function dispatchSpawn(
  def: AgentDefinition,
  opts: SpawnDispatchOpts,
  deps: SpawnDispatchDeps = {},
): Promise<string> {
  const host = (deps.hostId ?? resolveSpawnHost)()
  if (host === 'codex') {
    return (deps.codexExecSpawn ?? codexExecSpawn)(def, { expertName: opts.expertName })
  }
  return (deps.sdkSpawn ?? sdkSpawn)(def, opts)
}
