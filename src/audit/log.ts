// src/audit/log.ts — Phase 4.3 W1 T1.1 (R8.1 audit log NEW infra per ADR 0018 PRIMARY).
// JSONL append-only writer + 11-field schema per D-01 LOCKED (CONTEXT.md L34-50).
// Sync (NOT async sister state.ts): logging path no-await + atomic O_APPEND per RESEARCH § 2.3.
// Single SoT for routing-decision dimension forward-only per D-02 LOCKED (cross-ref ADR 0019).

import { createHash } from 'node:crypto'
import { appendFileSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { type Static, Type } from '@sinclair/typebox'
import type { ArbitrateResult, TaskContext } from '../routing/agentDefinition.js'
import type { Rule } from '../routing/decisionRules.js'

const AUDIT_PATH = '.harnessed/audit.log'

export const AuditRecordSchema = Type.Object(
  {
    ts: Type.String(),
    phase: Type.String(),
    task_excerpt: Type.String(),
    task_sha1: Type.String(),
    matched_rule_id: Type.Union([Type.String(), Type.Null()]),
    primary_expert: Type.Union([Type.String(), Type.Null()]),
    secondary_expert: Type.Union([Type.String(), Type.Null()]),
    category: Type.String(),
    route_layer: Type.String(),
    outcome: Type.String(),
    session_id: Type.Union([Type.String(), Type.Null()]),
    iter_count: Type.Union([Type.Number(), Type.Null()]),
  },
  { additionalProperties: false },
)
export type AuditRecord = Static<typeof AuditRecordSchema>

export interface AuditCtx {
  outcome: string
  routeLayer: string
  sessionId?: string
  iterCount: number | null
}

export function buildAuditRecord(
  task: TaskContext,
  decision: ArbitrateResult,
  matched: Rule | null,
  ctx: AuditCtx,
): AuditRecord {
  return {
    ts: new Date().toISOString(),
    phase: task.phaseId ?? 'unknown',
    task_excerpt: task.task.slice(0, 200),
    task_sha1: createHash('sha1').update(task.task).digest('hex'),
    matched_rule_id: matched?.id ?? null,
    primary_expert: (decision.primary_expert as string | null) ?? null,
    secondary_expert: (decision.secondary_expert as string | null) ?? null,
    category: decision.category,
    route_layer: ctx.routeLayer,
    outcome: ctx.outcome,
    session_id: ctx.sessionId ?? null,
    iter_count: ctx.iterCount,
  }
}

export function emitAuditRecord(record: AuditRecord): void {
  mkdirSync(dirname(AUDIT_PATH), { recursive: true })
  appendFileSync(AUDIT_PATH, `${JSON.stringify(record)}\n`)
}
