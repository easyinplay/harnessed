import { createUpdateComponent, type UpdateComponentResult } from '../updateResult.js'
import type {
  GsdRuntimeIdentity,
  UpdateAdapter,
  UpdateAdapterDependencies,
  UpdateAdapterPlan,
  UpdateInstallAction,
  UpdateObservation,
  UpdateRuntimeVerification,
} from './types.js'

const GSD_PACKAGE = '@opengsd/gsd-core'

function parseVersion(version: string) {
  const match =
    /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([\da-zA-Z-]+(?:\.[\da-zA-Z-]+)*))?(?:\+[\da-zA-Z-]+(?:\.[\da-zA-Z-]+)*)?$/.exec(
      version,
    )
  if (!match || match[0] !== version) return null
  const prerelease = match[4]?.split('.') ?? []
  if (prerelease.some((part) => /^\d+$/.test(part) && part.length > 1 && part.startsWith('0')))
    return null
  return {
    core: match.slice(1, 4).map((part) => BigInt(part)),
    prerelease,
  }
}

function isVersionIncrease(before: string, after: string): boolean {
  const previous = parseVersion(before)
  const next = parseVersion(after)
  if (!previous || !next) return false
  for (const [index, part] of previous.core.entries()) {
    const nextPart = next.core[index] ?? 0n
    if (part !== nextPart) return part < nextPart
  }
  if (previous.prerelease.length === 0) return false
  if (next.prerelease.length === 0) return true
  for (const [index, part] of previous.prerelease.entries()) {
    const nextPart = next.prerelease[index]
    if (nextPart === undefined) return false
    if (part === nextPart) continue
    const numeric = /^\d+$/.test(part)
    const nextNumeric = /^\d+$/.test(nextPart)
    if (numeric && nextNumeric) return BigInt(part) < BigInt(nextPart)
    if (numeric !== nextNumeric) return numeric
    return part < nextPart
  }
  return previous.prerelease.length < next.prerelease.length
}

function component(
  plan: UpdateAdapterPlan,
  status: UpdateComponentResult['status'],
  values: Partial<UpdateComponentResult> = {},
): UpdateComponentResult {
  return createUpdateComponent({
    id: plan.componentId,
    status,
    target: 'latest',
    ...values,
  })
}

function unsupported(plan: UpdateAdapterPlan, reasonCode: string): UpdateComponentResult {
  return component(plan, 'unsupported', { reasonCode })
}

function validateIdentity(plan: UpdateAdapterPlan, identity: GsdRuntimeIdentity): string | null {
  if (identity.packageName !== GSD_PACKAGE) return 'wrong-package'
  if (typeof identity.version !== 'string' || !parseVersion(identity.version))
    return 'invalid-version'
  if (plan.host === null) return 'unknown-host'
  if (identity.host !== plan.host) return 'wrong-host'
  if (plan.scope !== 'global' || identity.scope !== 'global') return 'unproven-scope'
  return null
}

function actionFor(plan: UpdateAdapterPlan): UpdateInstallAction {
  return {
    command: 'npx',
    args: ['--yes', `${GSD_PACKAGE}@latest`, `--${plan.host}`, `--${plan.scope}`],
  }
}

function knownObservation(
  plan: UpdateAdapterPlan,
  observation: UpdateObservation,
):
  | { identity: GsdRuntimeIdentity; invalidReason: null }
  | { identity: null; invalidReason: string } {
  if (observation.kind !== 'known') {
    return { identity: null, invalidReason: observation.reasonCode }
  }
  const invalidReason = validateIdentity(plan, observation.identity)
  return invalidReason
    ? { identity: null, invalidReason }
    : { identity: observation.identity, invalidReason: null }
}

async function verifyRuntime(
  plan: UpdateAdapterPlan,
  dependencies: UpdateAdapterDependencies,
): Promise<UpdateRuntimeVerification> {
  try {
    return await dependencies.verifyRuntime(plan)
  } catch {
    return { ok: false, reasonCode: 'runtime-verification-failed' }
  }
}

async function executeGsd(
  plan: UpdateAdapterPlan,
  dependencies: UpdateAdapterDependencies,
): Promise<UpdateComponentResult> {
  if (plan.host === null) return unsupported(plan, 'unknown-host')
  if (plan.scope !== 'global') return unsupported(plan, 'unproven-scope')

  let beforeObservation: UpdateObservation
  try {
    beforeObservation = await dependencies.observe(plan)
  } catch {
    return component(plan, 'failed', { reasonCode: 'observation-failed' })
  }

  if (beforeObservation.kind === 'not-installed')
    return component(plan, 'not-installed', { reasonCode: beforeObservation.reasonCode })
  if (beforeObservation.kind === 'unknown') return unsupported(plan, beforeObservation.reasonCode)

  const before = knownObservation(plan, beforeObservation)
  if (!before.identity) return unsupported(plan, before.invalidReason)

  const beforeVersion = before.identity.version
  if (plan.mode === 'dry-run') {
    const verification = await verifyRuntime(plan, dependencies)
    if (!verification.ok)
      return component(plan, 'failed', {
        before: beforeVersion,
        reasonCode: verification.reasonCode,
      })
    return component(plan, 'planned', {
      before: beforeVersion,
      reasonCode: 'reviewed-upstream-action',
      verified: true,
    })
  }

  let installResult: Awaited<ReturnType<UpdateAdapterDependencies['install']>>
  try {
    installResult = await dependencies.install(actionFor(plan))
  } catch {
    installResult = { ok: false, message: 'upstream installer threw' }
  }

  let afterObservation: UpdateObservation
  try {
    afterObservation = await dependencies.observe(plan)
  } catch {
    afterObservation = { kind: 'unknown', reasonCode: 'observation-failed' }
  }
  const after = knownObservation(plan, afterObservation)

  if (after.identity) {
    const verification = await verifyRuntime(plan, dependencies)
    if (!verification.ok)
      return component(plan, 'failed', {
        before: beforeVersion,
        after: after.identity.version,
        reasonCode: verification.reasonCode,
      })
  }

  if (installResult.ok && after.identity?.version === beforeVersion) {
    return component(plan, 'current', {
      before: beforeVersion,
      after: beforeVersion,
      verified: true,
    })
  }

  if (
    installResult.ok &&
    after.identity &&
    isVersionIncrease(beforeVersion, after.identity.version)
  ) {
    return component(plan, 'updated', {
      before: beforeVersion,
      after: after.identity.version,
      verified: true,
    })
  }

  if (!installResult.ok && after.identity?.version === beforeVersion) {
    return component(plan, 'retained', {
      before: beforeVersion,
      after: beforeVersion,
      verified: true,
      reasonCode: 'update-failed-retained',
    })
  }

  return component(plan, 'failed', {
    before: beforeVersion,
    after: after.identity?.version ?? null,
    reasonCode: installResult.ok ? 'update-not-applied' : 'update-failed',
  })
}

export const gsdUpdateAdapter: UpdateAdapter = { execute: executeGsd }
