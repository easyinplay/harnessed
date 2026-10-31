import { execFileSync, spawn } from 'node:child_process'
import { realpathSync } from 'node:fs'
import { readdir, readFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import pkg from '../../../package.json' with { type: 'json' }
import { getLocale, setLocale } from '../../i18n/index.js'
import { withHostInstallEnv } from '../../installers/lib/runClaudeArgs.js'
import { getAssetsRoot, isCompiledRuntime } from '../../platform/assetsRoot.js'
import {
  captureHostInstallContext,
  type HostInstallContext,
} from '../../platform/hostInstallContext.js'
import { isBunRuntime } from '../../platform/runtime.js'
import {
  createAgentRepairResult,
  createRepairRequest,
  type RepairAuthorization,
  repairableComponents,
} from './agentRepair.js'
import { runAgentRepair } from './agentRepairRunner.js'
import { runOwnershipAdoption } from './ownershipAdoption.js'
import { findOwnershipRepairCandidates } from './ownershipAdoptionCandidate.js'
import { preparePackageUpdate } from './packageUpdateTarget.js'
import {
  buildUpdateResult,
  createUpdateComponent,
  createUpdateError,
  getUpdateExitCode,
  type UpdateComponentResult,
  type UpdateMode,
  type UpdateResult,
} from './updateResult.js'

export interface UpdateOptions {
  all?: boolean
  upstreams?: boolean
  json?: boolean
  nonInteractive?: boolean
  platform?: string
  lang?: string
  packageManager?: 'npm' | 'bun'
  check?: boolean
  dryRun?: boolean
  rollback?: boolean | string
  migrationReport?: boolean
  updateContinuation?: string
  repair?: boolean
  yes?: boolean
}

export interface UpdateRequest {
  mode: UpdateMode
  all: boolean
  json: boolean
  nonInteractive: boolean
}

export interface UpdateCoordinatorDependencies {
  host: UpdateResult['host']
  runtime: UpdateResult['runtime']
  selfUpdate: (request: UpdateRequest) => Promise<UpdateComponentResult>
  continueUpdate: (request: UpdateRequest) => Promise<UpdateComponentResult[]>
  inspect: (request: UpdateRequest) => Promise<UpdateComponentResult[]>
}

export async function runUpdateCoordinator(
  options: UpdateOptions,
  deps: UpdateCoordinatorDependencies,
): Promise<UpdateResult> {
  const request: UpdateRequest = {
    mode: options.check ? 'check' : options.dryRun ? 'dry-run' : 'apply',
    all: options.all === true || options.upstreams === true,
    json: options.json === true,
    nonInteractive: options.nonInteractive === true,
  }
  const components: UpdateComponentResult[] = []
  const result = (error: UpdateResult['error'] = null) =>
    buildUpdateResult({ ...request, host: deps.host, runtime: deps.runtime, components, error })
  const invalid = validateUpdateOptions(options)
  if (invalid) return result(createUpdateError(invalid, 'arguments', 'invalid-options'))
  try {
    if (request.mode !== 'apply') {
      components.push(...(await deps.inspect(request)))
      return result()
    }
    const self = await deps.selfUpdate(request)
    components.push(self)
    if (!['current', 'updated'].includes(self.status) || !request.all) return result()
    try {
      components.push(...(await deps.continueUpdate(request)))
    } catch (error) {
      if (error instanceof UpdateProtocolError)
        return result(createUpdateError(error, 'protocol', 'invalid-continuation'))
      components.push(
        createUpdateComponent({ id: 'closure', status: 'failed', reasonCode: 'handoff-failed' }),
      )
    }
    return result()
  } catch (error) {
    return result(createUpdateError(error))
  }
}

export function validateUpdateOptions(options: UpdateOptions): string | null {
  if (options.platform !== undefined && !['claude', 'codex'].includes(options.platform))
    return `unsupported host: ${options.platform}`
  if (options.check && options.dryRun) return '--check and --dry-run are mutually exclusive'
  if (options.packageManager !== undefined && !['npm', 'bun'].includes(options.packageManager))
    return 'unsupported package manager'
  if (options.rollback && (options.all || options.upstreams || options.check || options.dryRun))
    return '--rollback cannot be combined with update scope or preview options'
  if (options.migrationReport && (options.json || options.all || options.upstreams))
    return '--migration-report cannot be combined with --json or update scope'
  if (options.yes && !options.repair) return '--yes requires --repair'
  if (options.repair && !(options.all || options.upstreams))
    return '--repair requires --all or --upstreams'
  if (options.repair && (options.check || options.dryRun || options.migrationReport))
    return '--repair requires an applied update'
  if (options.repair && options.nonInteractive && !options.yes)
    return '--non-interactive --repair requires explicit --yes authorization'
  if (options.repair && options.json && !options.yes)
    return '--json --repair requires explicit --yes authorization'
  return null
}

class UpdateProtocolError extends Error {}

let envelopeWritten = false

export function hasWrittenUpdateEnvelope(): boolean {
  return envelopeWritten
}

export function wantsUpdateEnvelope(argv: string[]): boolean {
  return (
    argv.includes('update') &&
    argv.some(
      (arg) =>
        arg === '--json' ||
        arg === '--update-continuation' ||
        arg.startsWith('--update-continuation='),
    )
  )
}

export function updateFailureResult(
  cause: unknown,
  kind: 'arguments' | 'protocol' | 'fatal' = 'fatal',
  options: UpdateOptions = {},
): UpdateResult {
  const host = options.platform ?? process.env.HARNESSED_PLATFORM
  return buildUpdateResult({
    mode: options.check ? 'check' : options.dryRun ? 'dry-run' : 'apply',
    host: host === 'claude' || host === 'codex' ? host : null,
    runtime: isCompiledRuntime() ? 'compiled' : isBunRuntime() ? 'bun' : 'node',
    components: [],
    error: createUpdateError(cause, kind, kind === 'fatal' ? 'update-failed' : `invalid-${kind}`),
  })
}

export function renderHumanUpdateResult(result: UpdateResult, options: UpdateOptions = {}): string {
  const lines: string[] = []
  const self = result.components.find((component) => component.id === 'harnessed')
  if (self) {
    if (result.mode === 'check') {
      const comparison =
        self.status === 'planned'
          ? 'behind'
          : self.before === self.target
            ? 'current'
            : self.status === 'current'
              ? 'ahead'
              : 'unknown'
      lines.push(
        `  installed: ${self.before ?? 'unknown'}\n  latest:    ${self.target ?? 'unknown'}\n  status:    ${comparison}`,
      )
    } else if (result.mode === 'dry-run' && self.status === 'planned') {
      lines.push(
        result.runtime === 'compiled'
          ? '[harnessed] update --dry-run (compiled binary): would download, verify and replace the binary.'
          : `[harnessed] update --dry-run: would run: ${options.packageManager === 'bun' ? 'bun add --global' : 'npm i -g'} harnessed@latest (${self.before} -> ${self.target})`,
      )
    } else if (self.status === 'current') {
      lines.push(`[harnessed] already up to date (${self.after ?? self.before}).`)
    } else if (self.status === 'updated') {
      lines.push(`[harnessed] updated ${self.before} -> ${self.after}.`)
      lines.push(
        `[harnessed] updated. Restart ${result.host === 'codex' ? 'Codex' : 'Claude Code'} so the new version + hooks take effect.`,
      )
    } else
      lines.push(`  harnessed: ${self.status}${self.reasonCode ? ` (${self.reasonCode})` : ''}`)
  }
  if (result.mode === 'dry-run' && (options.all || options.upstreams))
    lines.push(
      '[harnessed] update --dry-run: would update reviewed installed upstreams; nothing installed.',
    )
  for (const component of result.components.filter((entry) => entry.id !== 'harnessed'))
    lines.push(
      `  ${component.id}: ${component.status}${component.reasonCode ? ` (${component.reasonCode})` : ''}`,
    )
  if (result.agentRepair)
    lines.push(
      '  agent repair: ' +
        result.agentRepair.status +
        (result.agentRepair.reasonCode ? ` (${result.agentRepair.reasonCode})` : ''),
    )
  return lines.join('\n')
}

export function emitUpdateResult(
  result: UpdateResult,
  json: boolean,
  options: UpdateOptions = {},
): void {
  if (json) {
    envelopeWritten = true
    console.log(JSON.stringify(result))
  } else {
    const human = renderHumanUpdateResult(result, options)
    if (human) console.log(human)
    for (const warning of result.warnings) console.warn(`[harnessed] ${warning}`)
    if (result.error) console.warn(`[harnessed] ${result.error.message}`)
  }
  process.exitCode = getUpdateExitCode(result)
}

interface UpdateTarget {
  executablePath: string
  entryPath?: string
  target: string
}

export function updateTarget(): UpdateTarget {
  const executablePath = realpathSync(process.execPath)
  if (isCompiledRuntime()) return { executablePath, target: executablePath }
  if (!process.argv[1]) throw new UpdateProtocolError('Package entry path is missing')
  const entryPath = realpathSync(resolve(process.argv[1]))
  return { executablePath, entryPath, target: entryPath }
}

function verifyTarget(target: UpdateTarget, version: string, context: HostInstallContext): void {
  const actual = execFileSync(
    target.executablePath,
    [...(target.entryPath ? [target.entryPath] : []), '--internal-update-identity'],
    {
      encoding: 'utf8',
      env: withHostInstallEnv(process.env, context),
      shell: false,
      windowsHide: true,
      timeout: 15_000,
    },
  ).trim()
  if (actual !== version)
    throw new Error(`Updated executable identity mismatch: expected ${version}, received ${actual}`)
}

async function updateSelf(
  options: UpdateOptions,
  request: UpdateRequest,
  context: HostInstallContext,
  target: UpdateTarget,
  targetKey?: string,
  onBinaryUpdated?: (finalize: () => Promise<boolean>) => void,
): Promise<UpdateComponentResult> {
  const { compareVersions, fetchLatestBunVersion, fetchLatestNpmVersion } = await import(
    './version-check.js'
  )
  if (isCompiledRuntime()) {
    const { finalizeBinarySelfUpdate, realSelfUpdateDeps, runBinarySelfUpdate } = await import(
      './selfUpdateBinary.js'
    )
    const binaryDeps = realSelfUpdateDeps(context)
    const result = await runBinarySelfUpdate(binaryDeps, {
      check: request.mode === 'check',
      dryRun: request.mode === 'dry-run',
      retainBackupForContinuation: request.all,
    })
    switch (result.status) {
      case 'current':
        return createUpdateComponent({
          id: 'harnessed',
          status: 'current',
          before: result.version,
          after: result.version,
          verified: true,
        })
      case 'updated':
        if (request.all) onBinaryUpdated?.(() => finalizeBinarySelfUpdate(binaryDeps, result))
        return createUpdateComponent({
          id: 'harnessed',
          status: 'updated',
          before: result.from,
          target: result.to,
          after: result.to,
          verified: true,
          restartRequired: true,
        })
      case 'checked':
        return createUpdateComponent({
          id: 'harnessed',
          status: result.cmp === 'behind' ? 'planned' : 'current',
          before: result.installed,
          target: result.latest,
          after: result.installed,
          verified: result.cmp !== 'unknown',
        })
      case 'dry-run':
        return createUpdateComponent({ id: 'harnessed', status: 'planned', before: pkg.version })
      case 'refused':
        return createUpdateComponent({
          id: 'harnessed',
          status: 'unsupported',
          reasonCode: 'self-update-refused',
        })
      case 'error':
        throw new Error(result.message)
    }
  }
  const manager = options.packageManager ?? 'npm'
  const latest = manager === 'bun' ? await fetchLatestBunVersion() : await fetchLatestNpmVersion()
  if (!latest)
    return createUpdateComponent({
      id: 'harnessed',
      status: 'failed',
      before: pkg.version,
      reasonCode: 'latest-version-unavailable',
    })
  const comparison = compareVersions(pkg.version, latest)
  if (comparison === 'unknown')
    return createUpdateComponent({
      id: 'harnessed',
      status: 'failed',
      before: pkg.version,
      reasonCode: 'version-unknown',
    })
  if (comparison !== 'behind')
    return createUpdateComponent({
      id: 'harnessed',
      status: 'current',
      before: pkg.version,
      target: latest,
      after: pkg.version,
      verified: true,
    })
  if (request.mode !== 'apply')
    return createUpdateComponent({
      id: 'harnessed',
      status: 'planned',
      before: pkg.version,
      target: latest,
      after: pkg.version,
      verified: true,
    })
  const plan = preparePackageUpdate(manager, {
    entryPath: target.entryPath,
    targetKey: targetKey ?? '',
  })
  if (!plan.ok)
    return createUpdateComponent({
      id: 'harnessed',
      status: 'failed',
      before: pkg.version,
      target: latest,
      after: pkg.version,
      reasonCode: plan.reasonCode,
    })
  execFileSync(plan.command, plan.args, {
    ...plan.options,
    stdio: ['ignore', 2, 2],
    timeout: 300_000,
  })
  return createUpdateComponent({
    id: 'harnessed',
    status: 'updated',
    before: pkg.version,
    target: latest,
    after: latest,
    verified: true,
    restartRequired: true,
  })
}

async function runAdapters(
  context: HostInstallContext,
  request: UpdateRequest,
): Promise<UpdateComponentResult[]> {
  const { resolveComponentPlan } = await import('../../installers/lib/componentPlan.js')
  const { isAlreadyInstalled } = await import('../../installers/lib/idempotent.js')
  const skillRuntime = await import('../../installers/lib/skillRuntime.js')
  const { spawnCmd } = await import('../../installers/lib/spawn.js')
  const { validateManifestFile } = await import('../../manifest/validate.js')
  const { executeRegisteredUpdate } = await import('./updateAdapters/registry.js')
  const results: UpdateComponentResult[] = []
  for (const directory of ['tools', 'skill-packs']) {
    const root = join(getAssetsRoot(), 'manifests', directory)
    for (const name of (await readdir(root)).filter((entry) => entry.endsWith('.yaml')).sort()) {
      const path = join(root, name)
      const validated = validateManifestFile(await readFile(path, 'utf8'), path)
      if (!validated.ok) {
        results.push(
          createUpdateComponent({ id: name, status: 'failed', reasonCode: 'invalid-manifest' }),
        )
        continue
      }
      const plan = resolveComponentPlan(validated.manifest, context, 'install')
      const ctx: import('../../installers/lib/types.js').InstallContext = {
        manifest: structuredClone(
          plan.manifest,
        ) as import('../../installers/lib/types.js').Manifest,
        hostContext: plan.context,
        level: 'L4',
        cwd: context.neutralSpawnCwd ?? context.userHome,
        opts: {
          apply: false,
          dryRun: false,
          system: false,
          nonInteractive: true,
          fullDiff: false,
          color: false,
        },
      }
      const componentId = plan.componentId
      if (componentId !== 'gsd') {
        const installed = await isAlreadyInstalled(ctx, { honorUpdateFlag: false })
        results.push(
          createUpdateComponent({
            id: componentId,
            status: installed ? 'unsupported' : 'not-installed',
            reasonCode: installed ? 'adapter-not-reviewed' : 'not-installed',
          }),
        )
        continue
      }
      if (
        plan.status !== 'supported' ||
        plan.manifest.metadata.upstream?.source !== '@opengsd/gsd-core'
      ) {
        results.push(
          createUpdateComponent({
            id: componentId,
            status: 'unsupported',
            reasonCode: 'unreviewed-source',
          }),
        )
        continue
      }
      const result = await executeRegisteredUpdate(
        {
          componentId,
          mode: request.mode === 'check' ? 'dry-run' : request.mode,
          host: context.hostId,
          runtime: isCompiledRuntime() ? 'compiled' : isBunRuntime() ? 'bun' : 'node',
          scope: 'global',
          cwd: ctx.cwd,
        },
        {
          observe: () => skillRuntime.observeGsdRuntimeIdentity(ctx),
          verifyRuntime: () => skillRuntime.verifyGsdRuntimeIntegrity(ctx),
          install: async (action) => {
            if (request.mode !== 'apply') throw new Error('Read-only update cannot install')
            const installed = await spawnCmd(ctx, action.command, action.args, 300_000, {
              neutralCwd: true,
            })
            if ('stdout' in installed) {
              if (installed.stdout) process.stderr.write(installed.stdout)
              if (installed.stderr) process.stderr.write(installed.stderr)
              return installed.exitCode === 0
                ? { ok: true }
                : { ok: false, message: `installer exit ${installed.exitCode}` }
            }
            return { ok: false, message: 'Installer failed' }
          },
        },
      )
      results.push(...result.components)
    }
  }
  return results
}

async function runFreshContinuation(
  context: HostInstallContext,
  target: UpdateTarget,
  continuation: import('./updateContinuation.js').UpdateContinuation,
): Promise<UpdateResult> {
  const { launchUpdateContinuation } = await import('./updateContinuation.js')
  let output = ''
  let childCode: number | null = null
  const launched = await launchUpdateContinuation(
    {
      ...target,
      continuation,
      env: {
        ...withHostInstallEnv(process.env, context),
        HARNESSED_PLATFORM: context.hostId,
        HARNESSED_ROOT_OVERRIDE: context.platform.stateRoot,
      },
    },
    {
      run: (executable, args, options) =>
        new Promise((resolveChild, reject) => {
          const child = spawn(executable, args, {
            cwd: options.cwd,
            env: options.env,
            shell: false,
            windowsHide: true,
            stdio: ['ignore', 'pipe', 'inherit'],
          })
          const timer = setTimeout(() => {
            void import('../../installers/lib/killTree.js').then(({ killProcessTree }) =>
              killProcessTree(child),
            )
          }, options.timeoutMs)
          timer.unref()
          child.stdout.on('data', (chunk: Buffer) => {
            output += chunk.toString('utf8')
            if (Buffer.byteLength(output) > 1024 * 1024) {
              child.kill()
              reject(new UpdateProtocolError('Continuation output is too large'))
            }
          })
          child.once('error', (error) => {
            clearTimeout(timer)
            reject(error)
          })
          child.once('close', (exitCode, signal) => {
            clearTimeout(timer)
            childCode = exitCode
            resolveChild({ exitCode, signal })
          })
        }),
    },
  )
  if (!output.trim() && launched.status === 'failed') throw new Error('Update handoff failed')
  let result: UpdateResult
  try {
    result = JSON.parse(output)
  } catch {
    throw new UpdateProtocolError('Continuation did not return exactly one JSON envelope')
  }
  if (
    !result ||
    result.schemaVersion !== 1 ||
    result.operation !== 'update' ||
    result.host !== context.hostId ||
    result.runtime !== continuation.runtime ||
    result.mode !== continuation.mode ||
    !Array.isArray(result.components) ||
    !Array.isArray(result.warnings) ||
    !['complete', 'planned', 'partial', 'failed'].includes(result.status) ||
    result.error === undefined ||
    getUpdateExitCode(result) !== childCode
  ) {
    throw new UpdateProtocolError('Continuation result identity or exit code mismatch')
  }
  return result
}

export async function executeUpdate(options: UpdateOptions): Promise<UpdateResult> {
  envelopeWritten = false
  const invalid = validateUpdateOptions(options)
  if (invalid) return updateFailureResult(invalid, 'arguments', options)
  if (isCompiledRuntime() && options.packageManager)
    return updateFailureResult(
      '--package-manager is not applicable to compiled binaries',
      'arguments',
      options,
    )
  if (options.rollback)
    return updateFailureResult(
      '--rollback with --json is not supported; omit --json to use binary rollback',
      'arguments',
      options,
    )
  try {
    const { createUpdateContinuation, decodeUpdateContinuation } = await import(
      './updateContinuation.js'
    )
    const { consumeUpdateLockContinuation, withUpdateLock } = await import('./updateLock.js')
    const context = captureHostInstallContext({ hostId: options.platform })
    const target = updateTarget()
    const runtime = isCompiledRuntime() ? 'compiled' : isBunRuntime() ? 'bun' : 'node'
    if (options.updateContinuation !== undefined) {
      let continuation: import('./updateContinuation.js').UpdateContinuation
      try {
        continuation = decodeUpdateContinuation(options.updateContinuation)
        if (
          continuation.host !== context.hostId ||
          continuation.runtime !== runtime ||
          continuation.channel !== (isCompiledRuntime() ? 'compiled' : 'package') ||
          continuation.mode !== 'apply' ||
          continuation.scope !== 'all' ||
          options.lang !== continuation.lang ||
          Object.keys(options).some((key) => key !== 'updateContinuation' && key !== 'lang')
        ) {
          throw new Error('Continuation invocation identity or options mismatch')
        }
        setLocale(continuation.lang)
        const consumed = await consumeUpdateLockContinuation({
          stateRoot: context.platform.stateRoot,
          target: target.target,
          protocolVersion: continuation.protocolVersion,
          targetKey: continuation.targetKey,
          nonce: continuation.nonce,
        })
        if (!consumed.ok) throw new Error(`Continuation refused: ${consumed.reason}`)
      } catch (error) {
        return updateFailureResult(error, 'protocol', options)
      }
      const request: UpdateRequest = {
        mode: continuation.mode,
        all: true,
        json: true,
        nonInteractive: continuation.nonInteractive,
      }
      const { refreshOwnedUpdate } = await import('./refreshOwnedUpdate.js')
      const components = await refreshOwnedUpdate(context)
      if (!components.some((component) => component.status === 'failed')) {
        components.push(...(await runAdapters(context, request)))
      }
      return buildUpdateResult({ mode: request.mode, host: context.hostId, runtime, components })
    }
    if (options.lang !== undefined) setLocale(options.lang)
    const lang = options.lang === undefined ? undefined : getLocale()
    let childResult: UpdateResult | undefined
    const dependencies: UpdateCoordinatorDependencies = {
      host: context.hostId,
      runtime,
      selfUpdate: (request) => updateSelf(options, request, context, target),
      inspect: async (request) => [
        await updateSelf(options, request, context, target),
        ...(request.all ? await runAdapters(context, request) : []),
      ],
      continueUpdate: async () => {
        throw new Error('Missing update lock')
      },
    }
    if (options.check || options.dryRun) return runUpdateCoordinator(options, dependencies)
    const locked = await withUpdateLock(
      { stateRoot: context.platform.stateRoot, target: target.target },
      async (lock) => {
        let finalizeBinaryUpdate: (() => Promise<boolean>) | undefined
        dependencies.continueUpdate = async (request) => {
          const selfVersion = verifiedSelfVersion
          verifyTarget(target, selfVersion, context)
          childResult = await runFreshContinuation(
            context,
            target,
            createUpdateContinuation({
              nonce: lock.nonce,
              targetKey: lock.targetKey,
              channel: isCompiledRuntime() ? 'compiled' : 'package',
              mode: request.mode,
              host: context.hostId,
              ...(lang === undefined ? {} : { lang }),
              runtime,
              scope: 'all',
              nonInteractive: request.nonInteractive,
              json: true,
              createdAt: Date.now(),
            }),
          )
          return childResult.components
        }
        let verifiedSelfVersion = pkg.version
        dependencies.selfUpdate = async (request) => {
          const self = await updateSelf(
            options,
            request,
            context,
            target,
            lock.targetKey,
            (finalize) => {
              finalizeBinaryUpdate = finalize
            },
          )
          verifiedSelfVersion = self.after ?? pkg.version
          if (self.status === 'updated' && !request.all)
            verifyTarget(target, verifiedSelfVersion, context)
          return self
        }
        const result = await runUpdateCoordinator(options, dependencies)
        const completed = childResult
          ? buildUpdateResult({
              ...result,
              warnings: childResult.warnings,
              error: childResult.error,
            })
          : result
        if (completed.status === 'complete') await finalizeBinaryUpdate?.()
        return completed
      },
    )
    if (locked.status === 'busy')
      return updateFailureResult('Another update owns this executable target', 'fatal', options)
    return options.repair
      ? await runAuthorizedAgentRepair(locked.value, options, context)
      : locked.value
  } catch (error) {
    return updateFailureResult(
      error,
      error instanceof UpdateProtocolError ? 'protocol' : 'fatal',
      options,
    )
  }
}

export interface AuthorizedAgentRepairDependencies {
  runAgentRepair?: typeof runAgentRepair
  runOwnershipAdoption?: typeof runOwnershipAdoption
  findOwnershipRepairCandidates?: typeof findOwnershipRepairCandidates
}

export async function runAuthorizedAgentRepair(
  deterministicResult: UpdateResult,
  options: UpdateOptions,
  context: HostInstallContext,
  dependencies: AuthorizedAgentRepairDependencies = {},
): Promise<UpdateResult> {
  const deterministicComponents = repairableComponents(deterministicResult)
  const ownershipCandidates =
    options.repair === true &&
    options.yes === true &&
    (options.all === true || options.upstreams === true)
      ? await (dependencies.findOwnershipRepairCandidates ?? findOwnershipRepairCandidates)(
          deterministicResult,
          context,
        )
      : []
  const components = [
    ...new Map(
      [...deterministicComponents, ...ownershipCandidates].map((component) => [
        component.id,
        component,
      ]),
    ).values(),
  ]
  if (components.length === 0)
    return {
      ...deterministicResult,
      agentRepair: createAgentRepairResult({ status: 'not-requested' }),
    }
  if (deterministicResult.components.some((component) => component.restartRequired))
    return {
      ...deterministicResult,
      agentRepair: createAgentRepairResult({
        requested: true,
        components: components.map((component) => component.id),
        execution: context.hostId,
        status: 'deferred',
        reasonCode: 'restart-required',
      }),
    }
  const authorization: RepairAuthorization = options.yes
    ? {
        confirmed: true,
        mode: 'explicit-yes',
        components: components.map((component) => component.id),
        grantedAt: new Date().toISOString(),
      }
    : {
        confirmed: false,
        mode: 'none',
        components: [],
        grantedAt: null,
      }
  const request = createRepairRequest(deterministicResult, context, authorization, components)
  const repairRunner = dependencies.runAgentRepair ?? runAgentRepair
  const adoptionRunner = dependencies.runOwnershipAdoption ?? runOwnershipAdoption
  const repair = await adoptionRunner({
    context,
    request,
    runRepair: () =>
      repairRunner(request, {
        verify: async (verificationRequest) => {
          const verification = await executeUpdate({
            all: true,
            check: true,
            json: true,
            nonInteractive: true,
            platform: verificationRequest.host,
            packageManager: options.packageManager,
          })
          const checked = new Map(
            verification.components.map((component) => [component.id, component]),
          )
          return verificationRequest.components.every((component) => {
            const current = checked.get(component.id)
            return current?.verified === true && ['current', 'updated'].includes(current.status)
          })
        },
      }),
  })
  return {
    ...deterministicResult,
    agentRepair: repair,
  }
}
