// Phase 2.2 W4 T4.1 — SDK query() async-iterable consumer (ADR 0011 errata).
//
// IMPL NOTE — main-process spawn wrapper. Replaces engine.ts defaultSpawn
// placeholder (T4.2). Engine.route → defaultSpawn → sdkSpawn → query() with
// outputFormat:{type:'json_schema',schema:COMPLETION_SCHEMA} PRIMARY (B-02 /
// B-07 SC3) + agents:{ [expertName]: sdkDef } registration. Returns a JSON
// envelope string consumed by ralphLoopWrap.isComplete 4-layer dual-signal
// (T2.4):
//   layer 1 outer PRIMARY  — env.structured_output.status === 'COMPLETE'
//   layer 2 outer FALLBACK — extractPromise(env.text ?? env.result)
//   layer 3 inner FALLBACK — extractPromise(raw) when JSON.parse fails
//   layer 4 final FAIL     — both signals absent (B-07 Tier C)
// Session resume (CD-4) is captured here via `onSessionId` callback but
// CD-4 wire-up to v0.3.0 checkpoint (T1.2 SC4 PARTIAL → T4.4 DEFERRED per
// B-35). Closure infra is in ralphLoopWrap (T2.4); sdkSpawn merely passes
// `opts.resumeSessionId` to `options.resume` when present.
//
// B-25 split rationale: engine.ts ≤200L hard limit (B-23) — putting the
// real query() consumer here keeps engine orchestration thin.

import { query, type SDKMessage, type SDKResultMessage } from '@anthropic-ai/claude-agent-sdk'
import type { AgentDefinition } from './agentDefinition.js'
import { COMPLETION_SCHEMA, type SdkResultEnvelope } from './completionSchema.js'
import { injectFactoryInternalFields, toSdkAgentDefinition } from './sdkReconcile.js'

export interface SdkSpawnOpts {
  /** Subagent name registered in `agents` map; e.g. 'tavily-mcp', 'ui-ux-pro-max'. */
  expertName: string
  /** SDK session id to resume (CD-4 deferred to v0.3.0; closure-ready). */
  resumeSessionId?: string
  /** Callback fired when SDK emits system:init with session_id (T4.4 hook). */
  onSessionId?: (id: string) => void
  /** Wall-clock cap for this one spawn. Defaults to HARNESSED_SPAWN_TIMEOUT_MS or
   *  DEFAULT_SPAWN_TIMEOUT_MS; 0 disables. */
  timeoutMs?: number
}

export class SpawnFailError extends Error {
  constructor(public lastMessage?: SDKResultMessage) {
    super('sdkSpawn produced no result message')
    this.name = 'SpawnFailError'
  }
}

/** One hour. A real phase can legitimately run long; the cap exists so a hung
 *  subagent cannot hang a CI job forever (ralph-loop bounds iterations, not time). */
export const DEFAULT_SPAWN_TIMEOUT_MS = 60 * 60 * 1000

export class SpawnTimeoutError extends Error {
  constructor(public timeoutMs: number) {
    super(`sdkSpawn exceeded its ${timeoutMs}ms wall-clock timeout (HARNESSED_SPAWN_TIMEOUT_MS)`)
    this.name = 'SpawnTimeoutError'
  }
}

function envSpawnTimeoutMs(): number {
  const raw = Number.parseInt(process.env.HARNESSED_SPAWN_TIMEOUT_MS ?? '', 10)
  return Number.isFinite(raw) && raw >= 0 ? raw : DEFAULT_SPAWN_TIMEOUT_MS
}

/** Narrow SDKResultMessage.subtype to the discriminator we care about. */
type ResultSubtype = SDKResultMessage['subtype']

/** Spawn a subagent via SDK query() — main-process async-iterable consumer.
 *  Returns a JSON envelope string consumed by ralphLoopWrap.isComplete
 *  (4-layer dual-signal). On success the envelope carries the structured
 *  output (PRIMARY) AND the result text (FALLBACK), enabling B-07 graceful
 *  degrade if outputFormat doesn't populate structured_output server-side. */
export async function sdkSpawn(def: AgentDefinition, opts: SdkSpawnOpts): Promise<string> {
  const sdkDef = toSdkAgentDefinition(def) // 14→5 字段 unpack (B-01)
  const injectedPrompt = injectFactoryInternalFields(def, def.initialPrompt ?? def.prompt) // 9-字段 prompt inject
  const queryOptions: Record<string, unknown> = {
    // The prompt runs as the MAIN thread of this query, so the def's declared
    // limits must land on the query options; registering them only on the
    // `agents` entry (or rendering them into prompt text) enforces nothing.
    allowedTools: def.tools ?? ['Read', 'Edit', 'Write', 'Grep', 'Glob', 'Bash', 'Task'],
    ...(def.disallowedTools?.length ? { disallowedTools: def.disallowedTools } : {}),
    ...(def.maxTurns ? { maxTurns: def.maxTurns } : {}),
    // bypassPermissions additionally needs allowDangerouslySkipPermissions; a
    // manifest field must not be able to switch that on, so it is not forwarded.
    ...(def.permissionMode && def.permissionMode !== 'bypassPermissions'
      ? { permissionMode: def.permissionMode }
      : {}),
    agents: { [opts.expertName]: sdkDef },
    // PRIMARY signal (B-02 / B-07 SC3) — structured output via json_schema.
    outputFormat: { type: 'json_schema', schema: COMPLETION_SCHEMA },
  }
  if (opts.resumeSessionId) queryOptions.resume = opts.resumeSessionId

  const timeoutMs = opts.timeoutMs ?? envSpawnTimeoutMs()
  const abortController = new AbortController()
  queryOptions.abortController = abortController

  // SDK `query()` returns AsyncIterable<SDKMessage>; we consume until result.
  // biome-ignore lint/suspicious/noExplicitAny: SDK options 接口含未导出 union — 用 unknown record + cast。
  const q = query({ prompt: injectedPrompt, options: queryOptions as any })

  let result: SDKResultMessage | undefined
  const consume = (async () => {
    for await (const msg of q as AsyncIterable<SDKMessage>) {
      if (msg.type === 'system' && msg.subtype === 'init') {
        opts.onSessionId?.(msg.session_id)
      }
      if (msg.type === 'result') {
        result = msg as SDKResultMessage
      }
    }
  })()
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    if (timeoutMs > 0) {
      // Race rather than rely on the iterator honouring the abort: a stream that
      // never yields again would otherwise still hang here.
      const timedOut = new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          abortController.abort()
          reject(new SpawnTimeoutError(timeoutMs))
        }, timeoutMs)
      })
      consume.catch(() => {}) // its rejection after a timeout is expected, not unhandled
      await Promise.race([consume, timedOut])
    } else {
      await consume
    }
  } finally {
    clearTimeout(timer)
  }
  if (!result) throw new SpawnFailError()

  // Build envelope consumed by isComplete 4-layer (lib/ralphLoop.ts T2.4).
  // SDKResultSuccess.structured_output is typed `unknown` — narrow safely.
  const structuredOutput =
    'structured_output' in result
      ? (result.structured_output as SdkResultEnvelope['structured_output'])
      : undefined
  const subtype: ResultSubtype = result.subtype
  const text = 'result' in result ? result.result : undefined

  const envelope: SdkResultEnvelope = {
    subtype,
    ...(structuredOutput ? { structured_output: structuredOutput } : {}),
    ...(text != null ? { text, result: text } : {}),
  }
  return JSON.stringify(envelope)
}
