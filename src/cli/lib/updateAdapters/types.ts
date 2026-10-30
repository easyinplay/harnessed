import type { UpdateComponentResult, UpdateMode } from '../updateResult.js'

export type UpdateHost = 'claude' | 'codex' | null
export type UpdateRuntime = 'node' | 'bun' | 'compiled'
export type UpdateScope = 'global' | 'project' | 'user' | 'unknown'

export interface UpdateAdapterPlan {
  componentId: string
  mode: UpdateMode
  host: UpdateHost
  runtime: UpdateRuntime
  scope: UpdateScope
  cwd: string
}

export interface GsdRuntimeIdentity {
  packageName: string
  version: string
  host: Exclude<UpdateHost, null>
  scope: Exclude<UpdateScope, 'unknown'>
}

export type UpdateObservation =
  | { kind: 'known'; identity: GsdRuntimeIdentity; evidence: string }
  | { kind: 'not-installed'; reasonCode: string; evidence?: string }
  | { kind: 'unknown'; reasonCode: string; evidence?: string }

export interface UpdateInstallAction {
  command: string
  args: string[]
}

export type UpdateInstallResult = { ok: true } | { ok: false; message: string }

export type UpdateRuntimeVerification = { ok: true } | { ok: false; reasonCode: string }

export interface UpdateAdapterDependencies {
  observe: (plan: UpdateAdapterPlan) => Promise<UpdateObservation>
  verifyRuntime: (plan: UpdateAdapterPlan) => Promise<UpdateRuntimeVerification>
  install: (action: UpdateInstallAction) => Promise<UpdateInstallResult>
}

export interface UpdateAdapter {
  execute: (
    plan: UpdateAdapterPlan,
    dependencies: UpdateAdapterDependencies,
  ) => Promise<UpdateComponentResult>
}
