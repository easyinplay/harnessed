import { execFile } from 'node:child_process'
import { constants } from 'node:fs'
import { access, realpath, stat } from 'node:fs/promises'
import { isAbsolute, join, relative, resolve, sep } from 'node:path'
import type {
  UpdateObservation,
  UpdateRuntimeVerification,
} from '../../cli/lib/updateAdapters/types.js'
import type { HostInstallContext } from '../../platform/hostInstallContext.js'
import { detectPlatform, isHostId } from '../../platform/platform.js'
import { err } from './err.js'
import { requireNativeTool } from './nativeToolResolver.js'
import { withHostInstallEnv } from './runClaudeArgs.js'
import type { InstallContext, InstallResult } from './types.js'

async function requireFile(path: string): Promise<void> {
  try {
    const info = await stat(path)
    if (!info.isFile() || info.size === 0) throw new Error('not a nonempty file')
    await access(path, constants.R_OK)
  } catch {
    throw new Error(`Required installed resource is missing, empty or unreadable: ${path}`)
  }
}

async function skillRoot(dirs: string[], name: string): Promise<string> {
  for (const dir of dirs) {
    const root = join(dir, name)
    try {
      await stat(join(root, 'SKILL.md'))
    } catch {
      continue
    }
    await requireFile(join(root, 'SKILL.md'))
    return root
  }
  throw new Error(`Required installed skill is missing: ${name} (${dirs.join(', ')})`)
}

async function verifyGsd(
  root: string,
  dirs: string[],
  codex: boolean,
  cwd: string,
  context?: HostInstallContext,
): Promise<void> {
  await skillRoot(dirs, 'gsd-plan-phase')
  for (const phase of ['discuss-phase', 'plan-phase', 'execute-phase', 'verify-work', 'progress']) {
    await requireFile(join(root, 'gsd-core', 'workflows', `${phase}.md`))
  }
  await requireFile(join(root, 'gsd-core', 'bin', 'gsd-tools.cjs'))
  await requireFile(join(root, 'gsd-core', 'references', 'ui-brand.md'))
  // Only the roles used by the core plan/execute/verify path, not every optional GSD role.
  for (const role of ['phase-researcher', 'planner', 'plan-checker', 'executor', 'verifier']) {
    await requireFile(join(root, 'agents', `gsd-${role}.${codex ? 'toml' : 'md'}`))
  }
  const script = join(root, 'gsd-core', 'bin', 'gsd-tools.cjs')
  // A standalone harnessed binary is not Node; load the installed shim with external node.
  const identity = await probeGsdRuntimeIdentity(script, cwd, context)
  if (
    identity?.packageName !== '@opengsd/gsd-core' ||
    typeof identity.version !== 'string' ||
    !identity.version.trim()
  ) {
    throw new Error(
      `GSD runtime-identity did not prove @opengsd/gsd-core with a version: ${script}`,
    )
  }
}

async function probeGsdRuntimeIdentity(
  script: string,
  cwd: string,
  context?: HostInstallContext,
): Promise<Record<string, unknown>> {
  const output = await run('node', [script, 'runtime-identity'], cwd, context)
  let identity: unknown
  try {
    identity = JSON.parse(output)
  } catch {
    throw new Error(`GSD runtime-identity did not return JSON: ${script}`)
  }
  if (!identity || typeof identity !== 'object' || Array.isArray(identity))
    throw new Error(`GSD runtime-identity did not return an object: ${script}`)
  return identity as Record<string, unknown>
}

/** Read-only GSD identity evidence for reviewed update adapters. */
export async function observeGsdRuntimeIdentity(ctx: InstallContext): Promise<UpdateObservation> {
  const context = ctx.hostContext
  if (!context || !isHostId(context.hostId) || context.hostId !== context.platform.id)
    return { kind: 'unknown', reasonCode: 'unknown-host' }
  if (!isAbsolute(context.nativeHome))
    return { kind: 'unknown', reasonCode: 'unproven-scope', evidence: context.nativeHome }
  const script = join(context.nativeHome, 'gsd-core', 'bin', 'gsd-tools.cjs')
  try {
    await requireFile(script)
  } catch {
    return { kind: 'not-installed', reasonCode: 'runtime-missing', evidence: script }
  }
  try {
    const runtimePath = relative(await realpath(context.nativeHome), await realpath(script))
    if (runtimePath === '..' || runtimePath.startsWith(`..${sep}`) || isAbsolute(runtimePath))
      return { kind: 'unknown', reasonCode: 'unproven-scope', evidence: script }
  } catch {
    return { kind: 'unknown', reasonCode: 'unproven-scope', evidence: script }
  }
  let identity: Record<string, unknown>
  try {
    identity = await probeGsdRuntimeIdentity(script, ctx.cwd, ctx.hostContext)
  } catch (error) {
    return {
      kind: 'unknown',
      reasonCode: 'runtime-probe-failed',
      evidence: error instanceof Error ? error.message : script,
    }
  }
  if (
    typeof identity.packageName !== 'string' ||
    typeof identity.version !== 'string' ||
    !identity.version.trim()
  ) {
    return { kind: 'unknown', reasonCode: 'runtime-identity-incomplete', evidence: script }
  }
  if (identity.packageName !== '@opengsd/gsd-core')
    return { kind: 'unknown', reasonCode: 'wrong-package', evidence: script }
  return {
    kind: 'known',
    identity: {
      packageName: identity.packageName,
      version: identity.version,
      host: context.hostId,
      scope: 'global',
    },
    evidence: script,
  }
}

export async function verifyGsdRuntimeIntegrity(
  ctx: InstallContext,
): Promise<UpdateRuntimeVerification> {
  const context = ctx.hostContext
  if (!context || !isHostId(context.hostId) || context.hostId !== context.platform.id)
    return { ok: false, reasonCode: 'unknown-host' }
  const observation = await observeGsdRuntimeIdentity(ctx)
  if (observation.kind !== 'known') return { ok: false, reasonCode: observation.reasonCode }
  const root = context.nativeHome
  const codex = context.hostId === 'codex'
  const dirs = [
    ...new Set([codex ? context.platform.skillsDir : join(root, 'skills'), join(root, 'skills')]),
  ]
  try {
    await verifyGsd(root, dirs, codex, ctx.cwd, context)
    return { ok: true }
  } catch {
    return { ok: false, reasonCode: 'skill-runtime-incomplete' }
  }
}

function run(
  binary: string,
  args: string[],
  cwd: string,
  context?: HostInstallContext,
): Promise<string> {
  const env: NodeJS.ProcessEnv = {
    PATH: process.env.PATH,
    SystemRoot: process.env.SystemRoot,
    WINDIR: process.env.WINDIR,
    TEMP: process.env.TEMP,
    TMP: process.env.TMP,
    PYTHONDONTWRITEBYTECODE: '1',
    PYTHONIOENCODING: 'utf-8',
    PYTHONUTF8: '1',
  }
  return new Promise((resolveOutput, reject) => {
    const runtimeEnv = context ? withHostInstallEnv(env, context) : env
    const nativeBinary = requireNativeTool(binary, {
      env: runtimeEnv,
      cwd,
    })
    const child = execFile(
      nativeBinary ?? binary,
      args,
      {
        cwd,
        shell: false,
        windowsHide: true,
        timeout: 5_000,
        maxBuffer: 256 * 1024,
        encoding: 'utf8',
        // Probes need an interpreter, not the host's provider credentials or Python startup hooks.
        env: runtimeEnv,
      },
      (error, stdout, stderr) => {
        if (error)
          reject(new Error(`Runtime command failed (${binary}): ${stderr.trim() || error.message}`))
        else resolveOutput(stdout)
      },
    )
    child.stdin?.end()
  })
}

async function python(
  cwd: string,
  context?: HostInstallContext,
): Promise<{ binary: string; args: string[] }> {
  const probe = 'import sys; assert sys.version_info >= (3, 8); print("HARNESSED_PYTHON_OK")'
  for (const [binary, prefix] of [
    ['python3', []],
    ['python', []],
    ['py', ['-3']],
  ] as const) {
    const args = [...prefix, '-B', '-S']
    try {
      if (
        (await run(binary, [...args, '-I', '-c', probe], cwd, context)).trim() ===
        'HARNESSED_PYTHON_OK'
      ) {
        return { binary, args }
      }
    } catch {
      // A launcher or stale PATH shim is not a usable Python interpreter; try the next one.
    }
  }
  throw new Error(
    'Python 3.8+ is required for this installed skill; no usable python3, python or py -3 was found',
  )
}

async function verifyPlanning(
  root: string,
  cwd: string,
  context?: HostInstallContext,
): Promise<void> {
  const script = join(root, 'scripts', 'session-catchup.py')
  await requireFile(script)
  for (const name of ['init-session', 'check-complete']) {
    await requireFile(
      join(
        root,
        'scripts',
        `${name}.${(context?.os ?? process.platform) === 'win32' ? 'ps1' : 'sh'}`,
      ),
    )
  }
  for (const name of ['task_plan', 'progress', 'findings']) {
    await requireFile(join(root, 'templates', `${name}.md`))
  }
  const py = await python(cwd, context)
  // Parsing verifies the helper without executing catchup (which reads private session histories).
  await run(
    py.binary,
    [
      ...py.args,
      '-I',
      '-c',
      'import ast, pathlib, sys; ast.parse(pathlib.Path(sys.argv[1]).read_text(encoding="utf-8-sig"))',
      script,
    ],
    cwd,
    context,
  )
}

async function verifyUi(root: string, cwd: string, context?: HostInstallContext): Promise<void> {
  const script = join(root, 'scripts', 'search.py')
  await requireFile(script)
  await requireFile(join(root, 'scripts', 'core.py'))
  const data = [
    'styles',
    'prompts',
    'colors',
    'charts',
    'landing',
    'products',
    'ux-guidelines',
    'typography',
    'stacks/html-tailwind',
  ].map((name) => join(root, 'data', `${name}.csv`))
  for (const path of data) await requireFile(path)
  const py = await python(cwd, context)
  await run(
    py.binary,
    [
      ...py.args,
      '-I',
      '-c',
      [
        'import csv, sys',
        'for path in sys.argv[1:]:',
        '    with open(path, encoding="utf-8-sig", newline="") as source:',
        '        rows = csv.DictReader(source)',
        '        assert rows.fieldnames and next(rows, None), "No data rows: " + path',
      ].join('\n'),
      ...data,
    ],
    cwd,
    context,
  )
  for (const mode of [
    ['--domain', 'style'],
    ['--stack', 'html-tailwind'],
  ]) {
    // The Tailwind guideline corpus has responsive rules, not dashboard product descriptions.
    const query = mode[0] === '--stack' ? 'responsive' : 'dashboard'
    const output = await run(
      py.binary,
      [...py.args, script, query, ...mode, '--json', '--max-results', '1'],
      cwd,
      context,
    )
    let result: { error?: unknown; count?: unknown; results?: unknown }
    try {
      result = JSON.parse(output)
    } catch {
      throw new Error(`UI helper did not return JSON search results: ${script}`)
    }
    if (
      !result ||
      result.error ||
      typeof result.count !== 'number' ||
      result.count < 1 ||
      !Array.isArray(result.results) ||
      result.results.length < 1 ||
      !result.results.every(
        (row: unknown) =>
          row !== null &&
          typeof row === 'object' &&
          !Array.isArray(row) &&
          Object.values(row).some((value) => typeof value === 'string' && value.trim().length > 0),
      )
    ) {
      throw new Error(`UI helper returned no usable search results (${mode.join(' ')}): ${script}`)
    }
  }
}

/** Read-only resource checks; null means verified or not applicable. */
export async function verifySkillRuntime(ctx: InstallContext): Promise<InstallResult | null> {
  const name = ctx.manifest.metadata.name
  if (ctx.opts.dryRun || !['gsd', 'planning-with-files', 'ui-ux-pro-max'].includes(name))
    return null
  const platform = ctx.hostContext?.platform ?? detectPlatform()
  const hostId = ctx.hostContext?.hostId ?? platform.id
  if (hostId !== 'codex' && hostId !== 'claude') return null
  const codex = hostId === 'codex'
  if (!codex && name !== 'gsd') return null
  const rootKey = codex ? 'CODEX_HOME' : 'CLAUDE_CONFIG_DIR'
  const root =
    ctx.hostContext?.nativeHome ??
    resolve((ctx.manifest.spec.install.env?.[rootKey] ?? process.env[rootKey]) || platform.homeDir)
  const dirs = [
    ...new Set([
      ctx.hostContext && !codex ? join(root, 'skills') : platform.skillsDir,
      join(root, 'skills'),
    ]),
  ]
  try {
    if (name === 'gsd') await verifyGsd(root, dirs, codex, ctx.cwd, ctx.hostContext)
    else {
      const installedRoot = await skillRoot(dirs, name)
      if (name === 'planning-with-files')
        await verifyPlanning(installedRoot, ctx.cwd, ctx.hostContext)
      else await verifyUi(installedRoot, ctx.cwd, ctx.hostContext)
    }
    return null
  } catch (error) {
    return {
      ok: false,
      phase: 'verify',
      error: err(ctx, '/spec/verify/cmd', (error as Error).message, 'skill-runtime-incomplete'),
    }
  }
}
