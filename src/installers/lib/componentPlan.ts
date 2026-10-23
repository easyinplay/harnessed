import { Value } from '@sinclair/typebox/value'
import { NpmCli } from '../../manifest/schema/installMethods/npmCli.js'
import type { HostInstallContext } from '../../platform/hostInstallContext.js'
import { isCodexPortableHook } from './codexHookPlugin.js'
import type { Manifest } from './types.js'
import { verificationEnv } from './verificationEnv.js'

export type ComponentOperation = 'install' | 'inspect' | 'update' | 'uninstall'
export type DeclarationSource = 'base' | 'host-override' | 'native-adapter'
export type DeepReadonly<T> = { readonly [K in keyof T]: DeepReadonly<T[K]> }

interface ComponentPlanFields {
  readonly componentId: string
  readonly context: HostInstallContext
  readonly operation: ComponentOperation
  readonly manifest: DeepReadonly<Manifest>
  /** Declaration selection, not observed installation provenance or ownership. */
  readonly sources: Readonly<{
    install: DeclarationSource
    verify: DeclarationSource
    uninstall: DeclarationSource
  }>
}

export type ResolvedComponentPlan = ComponentPlanFields &
  (
    | { readonly status: 'supported' }
    | {
        readonly status: 'unsupported'
        readonly reason: 'harness-mismatch' | 'unsupported-operation'
        readonly detail?: string
      }
  )

function freezeDeep<T>(value: T): DeepReadonly<T> {
  if (value !== null && typeof value === 'object') {
    for (const child of Object.values(value)) freezeDeep(child)
    Object.freeze(value)
  }
  return value as DeepReadonly<T>
}

/** Reviewed global-package teardown exception; never an ownership inference. */
export function isReviewedNeutralTeardown(manifest: Manifest): boolean {
  const commands: Record<string, string> = {
    ctx7: 'npm uninstall -g ctx7',
    'playwright-cli': 'npm uninstall -g @playwright/cli',
  }
  const spec = manifest.spec
  return (
    Object.hasOwn(commands, manifest.metadata.name) &&
    spec.type === 'cli-npm' &&
    spec.component_type === 'cli-binary' &&
    spec.install_type === 'npm' &&
    Value.Check(NpmCli, spec.install) &&
    spec.uninstall?.cmd === commands[manifest.metadata.name] &&
    (spec.uninstall.cleanup_paths === undefined ||
      (Array.isArray(spec.uninstall.cleanup_paths) && spec.uninstall.cleanup_paths.length === 0))
  )
}

/** Pure declaration resolution. Support never establishes resource ownership. */
export function resolveComponentPlan(
  manifest: Manifest,
  context: HostInstallContext,
  operation: ComponentOperation,
): ResolvedComponentPlan {
  const override = context.hostId === 'codex' ? manifest.spec.harness_overrides?.codex : undefined
  const effective = structuredClone(manifest)
  if (override) {
    effective.spec.install = structuredClone(override.install)
    effective.spec.verify = structuredClone(override.verify ?? manifest.spec.verify)
    if (operation === 'uninstall' && override.uninstall) {
      effective.spec.uninstall = structuredClone(override.uninstall)
    }
  }
  const method = effective.spec.install.method
  const nativeTeardown =
    operation === 'uninstall' &&
    (method === 'mcp-stdio-add' ||
      method === 'mcp-http-add' ||
      (method === 'cc-hook-add' &&
        typeof effective.spec.install.hook_command === 'string' &&
        isCodexPortableHook(effective.spec.install.hook_command)))
  const rootKey = context.hostId === 'codex' ? 'CODEX_HOME' : 'CLAUDE_CONFIG_DIR'
  const declaredNativeHome =
    verificationEnv({}, effective.spec.install.env, context.os)[rootKey] ?? context.nativeHome
  const nativeHome =
    (context.hostId === 'codex' ? declaredNativeHome.trim() : declaredNativeHome) ||
    context.platform.homeDir
  const fields: ComponentPlanFields = {
    componentId: manifest.metadata.name,
    context: Object.freeze({
      ...context,
      platform: Object.freeze({ ...context.platform }),
      nativeHome,
    }),
    operation,
    manifest: freezeDeep(effective),
    sources: Object.freeze({
      install: override
        ? 'host-override'
        : context.hostId === 'codex' && effective.spec.install.method === 'cc-hook-add'
          ? 'native-adapter'
          : 'base',
      verify: override?.verify ? 'host-override' : 'base',
      uninstall:
        context.hostId === 'codex' && operation === 'uninstall'
          ? override?.uninstall
            ? 'host-override'
            : nativeTeardown
              ? 'native-adapter'
              : 'base'
          : 'base',
    }),
  }
  if (context.hostId === 'codex' && operation === 'uninstall') {
    // Static support is shared by preview and execution. Runtime resource checks
    // remain mandatory even for a declaration supported by this policy.
    const validName = /^[a-z0-9][a-z0-9-]*$/.test(effective.metadata.name)
    const portableHook = method === 'cc-hook-add' && nativeTeardown && !override?.uninstall
    if (validName && (isReviewedNeutralTeardown(effective) || portableHook)) {
      return Object.freeze({ ...fields, status: 'supported' })
    }
    let detail = `no safe codex uninstall contract for '${manifest.metadata.name}'`
    if (!validName) detail = 'invalid native resource identity'
    else if (method === 'mcp-stdio-add' || method === 'mcp-http-add') {
      detail = 'registration-only metadata cannot establish native MCP source identity for teardown'
    } else if (method === 'cc-plugin-marketplace') {
      detail = 'Codex plugin teardown lacks reviewed command and ownership policy'
    } else if (override?.uninstall) {
      detail = 'explicit uninstall selects a declaration, not reviewed command/cleanup ownership'
    }
    return Object.freeze({
      ...fields,
      status: 'unsupported',
      reason: 'unsupported-operation',
      detail,
    })
  }
  if (
    context.hostId === 'codex' &&
    !override &&
    manifest.spec.install.method === 'cc-plugin-marketplace'
  ) {
    return Object.freeze({ ...fields, status: 'unsupported', reason: 'harness-mismatch' })
  }
  return Object.freeze({ ...fields, status: 'supported' })
}

export function effectiveInstallMethod(
  plan: ResolvedComponentPlan,
): Manifest['spec']['install']['method'] {
  return plan.manifest.spec.install.method
}

export function installGroupForPlan(plan: ResolvedComponentPlan): string {
  switch (effectiveInstallMethod(plan)) {
    case 'mcp-stdio-add':
    case 'mcp-http-add':
      return 'mcp-tool'
    case 'cc-plugin-marketplace':
    case 'git-clone-with-setup':
    case 'npx-skill-installer':
    case 'cc-hook-add':
      return 'command'
    case 'npm-cli':
      return 'cli-binary'
    default:
      return 'other'
  }
}
