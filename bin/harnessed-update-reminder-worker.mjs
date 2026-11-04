#!/usr/bin/env node
// biome-ignore-all format: esbuild-generated (hook drift gate owns this file)
// biome-ignore-all lint: esbuild-generated
// biome-ignore-all assist/source/organizeImports: esbuild-generated
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url)
var __create = Object.create
var __defProp = Object.defineProperty
var __getOwnPropDesc = Object.getOwnPropertyDescriptor
var __getOwnPropNames = Object.getOwnPropertyNames
var __getProtoOf = Object.getPrototypeOf
var __hasOwnProp = Object.prototype.hasOwnProperty
var __require = /* @__PURE__ */ ((x) =>
  typeof require !== 'undefined'
    ? require
    : typeof Proxy !== 'undefined'
      ? new Proxy(x, {
          get: (a, b) => (typeof require !== 'undefined' ? require : a)[b],
        })
      : x)(function (x) {
  if (typeof require !== 'undefined') return require.apply(this, arguments)
  throw Error('Dynamic require of "' + x + '" is not supported')
})
var __esm = (fn, res) =>
  function __init() {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])((fn = 0))), res
  }
var __commonJS = (cb, mod) =>
  function __require2() {
    return (
      mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports
    )
  }
var __export = (target, all) => {
  for (var name in all) __defProp(target, name, { get: all[name], enumerable: true })
}
var __copyProps = (to, from, except, desc) => {
  if ((from && typeof from === 'object') || typeof from === 'function') {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, {
          get: () => from[key],
          enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable,
        })
  }
  return to
}
var __toESM = (mod, isNodeMode, target) => (
  (target = mod != null ? __create(__getProtoOf(mod)) : {}),
  __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule
      ? __defProp(target, 'default', { value: mod, enumerable: true })
      : target,
    mod,
  )
)

// package.json
var package_default
var init_package = __esm({
  'package.json'() {
    package_default = {
      name: 'harnessed',
      version: '5.0.12',
      description: 'AI coding harness package manager + composition orchestrator',
      type: 'module',
      license: 'Apache-2.0',
      author: 'easyinplay',
      repository: {
        type: 'git',
        url: 'https://github.com/easyinplay/harnessed.git',
      },
      homepage: 'https://github.com/easyinplay/harnessed#readme',
      bugs: 'https://github.com/easyinplay/harnessed/issues',
      keywords: [
        'claude-code',
        'ai-harness',
        'package-manager',
        'composition',
        'skill-pack',
        'mcp',
        'orchestrator',
      ],
      engines: {
        node: '>=22.0.0',
      },
      packageManager: 'pnpm@10.12.0',
      bin: {
        harnessed: './dist/cli.mjs',
        'harnessed-inject-state': './bin/harnessed-inject-state.mjs',
      },
      main: './dist/index.mjs',
      types: './dist/index.d.ts',
      exports: {
        '.': {
          types: './dist/index.d.ts',
          import: './dist/index.mjs',
          default: './dist/index.mjs',
        },
        './schemas': {
          types: './dist/schemas/index.d.ts',
          import: './dist/schemas/index.mjs',
        },
        './package.json': './package.json',
      },
      files: [
        'dist',
        'bin',
        'manifests',
        'messages',
        'workflows',
        'routing',
        'config-templates',
        'schemas',
        'CHANGELOG.md',
        'README.md',
        'README-en.md',
        'README-zh.md',
        'LICENSE',
        'NOTICE',
        'THIRD-PARTY-NOTICES.md',
      ],
      scripts: {
        dev: 'tsup --watch',
        build: 'tsc --noEmit && tsup && node ./scripts/build-hooks.mjs',
        prepack: 'npm run build',
        'build:hooks': 'node ./scripts/build-hooks.mjs',
        'build:schema': 'node ./scripts/build-schema.mjs',
        'validate:schema': 'node ./scripts/validate-schema.mjs',
        typecheck: 'tsc --noEmit',
        test: 'vitest run --passWithNoTests',
        'test:watch': 'vitest',
        'test:coverage': 'vitest run --coverage --passWithNoTests',
        'test:codex-live': 'node ./scripts/codex-live/run.mjs',
        bench: 'vitest bench --run',
        'bench:runtime': 'node scripts/benchmark-runtime.mjs',
        'test:runtime-channels': 'node scripts/runtime-channel-smoke.mjs',
        'test:docs': 'node --test tests/docs/install-channels.contract.mjs',
        lint: 'biome check .',
        'lint:fix': 'biome check --write .',
        format: 'biome format --write .',
        'build:binary': 'bun scripts/build-binary.mjs',
      },
      dependencies: {
        '@anthropic-ai/claude-agent-sdk': '0.3.142',
        '@clack/prompts': '^0.10.1',
        '@sinclair/typebox': '^0.34.49',
        ajv: '^8.20.0',
        'ajv-errors': '^3.0.0',
        'ajv-formats': '^3.0.1',
        commander: '^13.0.0',
        diff: '^9.0.0',
        'expr-eval': '^2.0.2',
        picocolors: '^1.1.1',
        'proper-lockfile': '^4.1.2',
        'smol-toml': '^1.9.1',
        undici: '^8.12.1',
        yaml: '^2.9.0',
      },
      devDependencies: {
        '@biomejs/biome': '^2.0.0',
        '@types/node': '^22.10.0',
        '@types/proper-lockfile': '^4.1.4',
        '@vitest/coverage-v8': '^4.0.0',
        esbuild: '0.27.7',
        tsup: '^8.3.0',
        typescript: '^5.6.0',
        vitest: '^4.0.0',
      },
      pnpm: {
        onlyBuiltDependencies: ['esbuild'],
      },
    }
  },
})

// src/cli/lib/autoUpdateStatus.ts
import { mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
function autoUpdateStatusPath(stateRoot) {
  return join(stateRoot, AUTO_UPDATE_STATUS_FILE)
}
function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value)
}
function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
function isValidDateMs(value) {
  return isFiniteNumber(value) && !Number.isNaN(new Date(value).getTime())
}
function parseProgress(value) {
  if (!isPlainObject(value)) return null
  const { received, total, updatedAt } = value
  if (!isFiniteNumber(received) || received < 0) return null
  if (!isFiniteNumber(total) || total < 0) return null
  if (!isValidDateMs(updatedAt)) return null
  return { received, total, updatedAt }
}
function parseResult(value) {
  if (!isPlainObject(value)) return null
  const { version, status, reason, message, at } = value
  if (typeof version !== 'string') return null
  if (typeof status !== 'string' || !RESULT_STATUSES.includes(status)) return null
  if (reason !== void 0 && typeof reason !== 'string') return null
  if (message !== void 0 && typeof message !== 'string') return null
  if (!isValidDateMs(at)) return null
  const result = { version, status, at }
  if (typeof reason === 'string') result.reason = reason
  if (typeof message === 'string') result.message = message
  return result
}
function parseNotice(value) {
  if (!isPlainObject(value)) return null
  const { from, to, changelog, restart, at } = value
  if (typeof from !== 'string' || typeof to !== 'string') return null
  if (typeof changelog !== 'string' || typeof restart !== 'string') return null
  if (!isValidDateMs(at)) return null
  const consumedAt =
    typeof value.consumedAt === 'number' &&
    Number.isFinite(value.consumedAt) &&
    value.consumedAt >= 0
      ? value.consumedAt
      : 0
  return { from, to, changelog, restart, at, consumedAt }
}
function parseStatus(value) {
  if (!isPlainObject(value)) return null
  if (value.schemaVersion !== 1) return null
  const consent = value.consent
  if (!isPlainObject(consent)) return null
  if (typeof consent.autoUpdate !== 'boolean' || typeof consent.enabled !== 'boolean') return null
  if (typeof value.channel !== 'string' || !CHANNELS.includes(value.channel)) return null
  if (typeof value.installed !== 'string') return null
  if (value.latest !== null && typeof value.latest !== 'string') return null
  if (typeof value.state !== 'string' || !AUTO_UPDATE_STATES.includes(value.state)) return null
  const progress = parseProgress(value.progress)
  if (!progress) return null
  const lastResult = value.lastResult === null ? null : parseResult(value.lastResult)
  if (value.lastResult !== null && !lastResult) return null
  if (!Array.isArray(value.history)) return null
  const history = []
  for (const entry of value.history) {
    const parsed = parseResult(entry)
    if (!parsed) return null
    history.push(parsed)
  }
  const notice = value.notice === null ? null : parseNotice(value.notice)
  if (value.notice !== null && !notice) return null
  return {
    schemaVersion: 1,
    consent: { autoUpdate: consent.autoUpdate, enabled: consent.enabled },
    channel: value.channel,
    installed: value.installed,
    latest: value.latest,
    state: value.state,
    progress,
    lastResult,
    history,
    notice,
  }
}
function readAutoUpdateStatus(path) {
  let text
  try {
    text = readFileSync(path, 'utf8')
  } catch {
    return null
  }
  let parsed
  try {
    parsed = JSON.parse(text)
  } catch {
    return null
  }
  return parseStatus(parsed)
}
function writeAutoUpdateStatus(path, status) {
  const dir = dirname(path)
  mkdirSync(dir, { recursive: true })
  const tmp = `${path}.${process.pid}.${++tmpCounter}.tmp`
  try {
    writeFileSync(
      tmp,
      `${JSON.stringify(status, null, 2)}
`,
      'utf8',
    )
    renameSync(tmp, path)
  } catch (error) {
    try {
      rmSync(tmp, { force: true })
    } catch {}
    throw error
  }
}
function appendAutoUpdateHistory(status, entry) {
  const history = [...status.history, entry]
  const kept =
    history.length > AUTO_UPDATE_HISTORY_LIMIT
      ? history.slice(history.length - AUTO_UPDATE_HISTORY_LIMIT)
      : history
  return { ...status, lastResult: entry, history: kept }
}
var AUTO_UPDATE_STATUS_FILE,
  AUTO_UPDATE_STATUS_PATH_ENV,
  AUTO_UPDATE_RESUMABLE_MARKER,
  AUTO_UPDATE_HISTORY_LIMIT,
  AUTO_UPDATE_STATES,
  CHANNELS,
  RESULT_STATUSES,
  tmpCounter
var init_autoUpdateStatus = __esm({
  'src/cli/lib/autoUpdateStatus.ts'() {
    'use strict'
    AUTO_UPDATE_STATUS_FILE = 'auto-update-status.json'
    AUTO_UPDATE_STATUS_PATH_ENV = 'HARNESSED_AUTO_UPDATE_STATUS_PATH'
    AUTO_UPDATE_RESUMABLE_MARKER = '[resumable]'
    AUTO_UPDATE_HISTORY_LIMIT = 10
    AUTO_UPDATE_STATES = [
      'idle',
      'downloading',
      'verifying',
      'swapping',
      'handover',
      'updated',
      'failed',
      'skipped',
    ]
    CHANNELS = ['binary', 'npm', 'bun', 'node']
    RESULT_STATUSES = ['updated', 'failed', 'skipped']
    tmpCounter = 0
  },
})

// src/cli/lib/updateReminderPreferences.ts
import { closeSync, constants, fstatSync, openSync, readSync } from 'node:fs'
function readRaw(path) {
  let descriptor
  try {
    descriptor = openSync(path, constants.O_RDONLY | constants.O_NONBLOCK)
    const info = fstatSync(descriptor)
    if (!info.isFile() || info.size > MAX_PREFERENCES_BYTES) return { kind: 'unreadable' }
    const buffer = Buffer.alloc(info.size)
    const bytes = readSync(descriptor, buffer, 0, buffer.length, 0)
    return { kind: 'parsed', value: JSON.parse(buffer.toString('utf8', 0, bytes)) }
  } catch (error) {
    if (error.code === 'ENOENT') return { kind: 'missing' }
    return { kind: 'unreadable' }
  } finally {
    if (descriptor !== void 0) {
      try {
        closeSync(descriptor)
      } catch {}
    }
  }
}
function readUpdateReminderPreferencesFile(path) {
  const raw = readRaw(path)
  if (raw.kind === 'missing') {
    return {
      preferences: { enabled: true, autoUpdate: false, unreadable: false },
      missing: true,
      document: null,
    }
  }
  if (raw.kind === 'unreadable') {
    return {
      preferences: { enabled: false, autoUpdate: false, unreadable: true },
      missing: false,
      document: null,
    }
  }
  const value = raw.value
  const record = typeof value === 'object' && value !== null ? value : {}
  return {
    preferences: {
      enabled: record.enabled === true,
      // `autoUpdate` is INDEPENDENT of `enabled` — two separate consents.
      // Only a strict `true` counts; anything else is off.
      autoUpdate: record.autoUpdate === true,
      unreadable: false,
    },
    missing: false,
    document: typeof value === 'object' && value !== null ? record : null,
  }
}
var MAX_PREFERENCES_BYTES
var init_updateReminderPreferences = __esm({
  'src/cli/lib/updateReminderPreferences.ts'() {
    'use strict'
    MAX_PREFERENCES_BYTES = 64 * 1024
  },
})

// messages/en.json
var en_default
var init_en = __esm({
  'messages/en.json'() {
    en_default = {
      'setup.workflows_not_found': 'error: workflows directory not found at {{path}}',
      'setup.nothing_to_install':
        'setup: no workflow directories with SKILL.md found \u2014 nothing to install',
      'setup.dry_run.header': '[dry-run] setup would install {{count}} workflow(s) to {{path}}:',
      'setup.dry_run.run_hint': '  run without --dry-run to execute',
      'setup.copy_failed': '  error: failed to copy {{name}}: {{message}}',
      'setup.step_a_complete': 'Step A: {{count}} workflows installed to {{path}}',
      'setup.step_a_render.complete': '  generated {{count}}/{{total}} command files',
      'setup.step_a_render.warnings_header':
        '  [A.5] warnings \u2014 some capability cmds could not be fully resolved:',
      'setup.command_warning': '  [A.6] {{message}}',
      'setup.step_c.created': '  [C] created {{path}} + enabled Agent Teams',
      'setup.step_c.already_enabled': '  [C] Agent Teams already enabled ({{path}})',
      'setup.step_c.enabled_backup':
        '  [C] enabled Agent Teams in {{path}} (backup saved \u2192 {{backupPath}})',
      'setup.step_c.skipped': '  [C] Agent Teams enable skipped: {{message}}',
      'setup.step_d.created': '  [D] created {{path}} + wrote env.HARNESSED_USER_LANG={{lang}}',
      'setup.step_d.already_set':
        '  [D] env.HARNESSED_USER_LANG={{lang}} already set in {{path}} \u2014 respecting user override',
      'setup.step_d.enabled_backup':
        '  [D] wrote env.HARNESSED_USER_LANG={{lang}} in {{path}} (backup saved \u2192 {{backupPath}})',
      'setup.step_d.skipped': '  [D] User language write skipped: {{message}}',
      'setup.step_b_complete':
        'Upstream components: {{installed}} installed / {{already}} already-installed / {{skipped}} skipped / {{failed}} failed [{{seconds}}s]',
      'setup.complete':
        'setup complete \u2014 {{skills}} workflows + {{manifests}} base manifests configured',
      'setup.mcp_hint': 'Run /mcp in Claude Code to verify MCP server connections.',
      'setup.mcp_hint_codex': 'Run codex mcp list to verify MCP server connections.',
      'setup.search_key_hint.header':
        '\n\u26A0 Search MCP API keys missing \u2014 the server(s) below are installed but will fail at query time until the key is configured:',
      'setup.search_key_hint.header_codex':
        '\n\u26A0 Search MCP API keys not visible to this check: Codex checks only process env. Verify the tools first; if authentication fails, set the key in your shell environment.',
      'setup.search_key_hint.line':
        '  {{server}}: set {{envVar}} \u2014 add it to the ~/.claude/settings.json "env" block (e.g. {"env": {"{{envVar}}": "<your-key>"}}) or export {{envVar}} in your shell',
      'setup.search_key_hint.line_codex':
        '  {{server}}: set {{envVar}} in your shell environment (export {{envVar}}="<your-key>")',
      'setup.optional_offer.ecc_note':
        "  ecc (bonus tier): installing it unlocks finer-grained scenario orchestration (per-language review/build expert routing etc.); the trade-off is ~20k+ tokens/session of static listing overhead \u2014 inherent to ECC's own scale (281 skills / 94 commands / 67 agents), not introduced by harnessed.",
      'setup.bundled_summary':
        '\nharnessed workflows bundled at <packageRoot>/workflows/ (share-only, read-only)',
      'setup.bundled_location': '',
      'setup.doctor_hint': '\nRun harnessed doctor to verify your environment.',
      'agent_teams.missing_header':
        '\n\u26A0\uFE0F  Agent Teams not enabled \u2014 parallelism upgrade path unavailable',
      'agent_teams.missing_fix':
        '   fix: claude config set env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS 1',
      'agent_teams.missing_explanation':
        '   harnessed task parallelism uses Subagent or Agent Teams (CC 2.1.178+)',
      'agent_teams.missing_nonblocking':
        '   non-blocking \u2014 auto-degrades to subagent fan-out\n',
      'install.manifest_not_found': "error: manifest '{{name}}' not found",
      'install.manifest_not_found.fix':
        '  fix:  ensure manifests/tools/{{name}}.yaml, manifests/skill-packs/{{name}}.yaml, or manifests/optional/{{name}}.yaml exists',
      'install.audit_hint': "  fix:  run 'harnessed audit' to inspect manifest issues",
      'install.success': 'installed {{name}}',
      'install.success_with_version': 'installed {{name}}@{{version}}',
      'install.already_installed':
        'already-installed {{name}} (idempotent check hit; nothing to do)',
      'install.already_installed_with_version':
        'already-installed {{name}}@{{version}} (idempotent check hit; nothing to do)',
      'install.aborted': 'aborted: {{reason}}',
      'uninstall.dry_run.preview': "[dry-run] would uninstall '{{name}}' via method '{{method}}'",
      'uninstall.dry_run.run_hint': '  run without --dry-run to execute',
      'uninstall.confirm.prompt': "Uninstall '{{name}}'? This cannot be undone.",
      'uninstall.cancelled': 'aborted: user cancelled',
      'uninstall.completed': 'uninstalled {{name}}',
      'uninstall.unified.nothing': 'nothing to do \u2014 no harnessed artifacts found',
      'uninstall.unified.header': 'harnessed uninstall will remove the following:',
      'uninstall.unified.commands':
        '  Commands: {{count}} harnessed-generated slash command file(s) in ~/.claude/commands/',
      'uninstall.unified.agent_roles':
        '  Agent roles: {{count}} harnessed-generated codex agent role file(s) in ~/.codex/agents/',
      'uninstall.unified.skills':
        '  Skills: {{count}} workflow skill directory(ies) in ~/.claude/skills/',
      'uninstall.unified.settings':
        '  Settings: harnessed env vars (CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS, HARNESSED_USER_LANG) from ~/.claude/settings.json',
      'uninstall.unified.hooks':
        '  Hooks: {{count}} harnessed Stop/UserPromptSubmit hook(s) in ~/.claude/settings.json',
      'uninstall.unified.state_dir':
        '  State directory: ~/.claude/harnessed/ (includes backups, audit log, state, lock)',
      'uninstall.unified.upstream_note':
        '\nUpstream components (npm packages, MCP servers, CC plugins, git-cloned repos, npx skills) are NOT affected.',
      'uninstall.unified.dry_run_hint':
        '\n(dry-run \u2014 re-run without --dry-run to actually remove)',
      'uninstall.unified.confirm':
        "Remove harnessed's own files? Upstream components (npm packages, MCP servers, CC plugins, etc.) will NOT be affected. This cannot be undone.",
      'uninstall.unified.removing': 'removing harnessed files...',
      'uninstall.unified.removed_commands': '  removed {{count}} command file(s)',
      'uninstall.unified.removed_agent_roles': '  removed {{count}} codex agent role file(s)',
      'uninstall.unified.removed_skills': '  removed {{count}} skill directory(ies)',
      'uninstall.unified.removed_settings':
        '  removed harnessed env vars from ~/.claude/settings.json',
      'uninstall.unified.removed_hooks':
        '  removed {{count}} harnessed hook(s) from ~/.claude/settings.json',
      'uninstall.unified.removed_state_dir': '  removed ~/.claude/harnessed/',
      'uninstall.unified.partial_failure':
        '\n{{count}} item(s) could not be removed (permission denied or already gone):',
      'uninstall.unified.complete':
        "uninstall complete \u2014 harnessed's own files have been removed",
      'uninstall.unified.cli_hint_header':
        '\nto remove the harnessed CLI itself (the step above did not \u2014 it only cleared setup files):',
      'uninstall.unified.cli_hint_binary':
        '  binary: delete {{path}}\n          then remove {{dir}} from your PATH',
      'uninstall.unified.cli_hint_npm': '  npm: npm uninstall -g harnessed',
      'uninstall.unified.cli_hint_other':
        "  installed both ways? remove the other too \u2014 npm: 'npm uninstall -g harnessed' / binary: delete the exe + its bin dir from PATH",
      'gc.invalid_duration': "error: invalid --older-than '{{value}}'",
      'gc.invalid_duration.fix': '  fix:  use format <N>{d|h|m|w} e.g. 30d / 24h / 60m / 4w',
      'gc.no_backups': 'no backups found ({{root}} absent) \u2014 nothing to gc',
      'gc.no_old_snapshots': 'no snapshots older than {{cutoff}} (kept {{keptCount}} most-recent)',
      'gc.summary_will_delete': 'would delete {{count}} snapshot(s), ~{{sizeKb}} KB total:',
      'gc.summary_deleting': 'deleting {{count}} snapshot(s), ~{{sizeKb}} KB total:',
      'gc.dry_run_rerun_hint': '\n(dry-run \u2014 re-run without --dry-run to actually delete)',
      'gc.ledger_will_prune':
        'would prune {{count}} stale workflow slot(s) from the ledger (kept {{kept}}):',
      'gc.ledger_pruned':
        'pruned {{count}} stale workflow slot(s) from the ledger (kept {{kept}}):',
      'doctor.summary.fail': '\nsome checks failed (see fix hints above)',
      'doctor.summary.warn': '\nall checks ok (with warnings \u2014 see hints above)',
      'doctor.summary.pass': '\nall checks passed',
      'doctor.host_scope': 'host: {{host}} \u2014 {{applied}} of {{total}} checks apply\n',
      'doctor.matrix.legend':
        '\nn/a = the check is not declared for that host in the registry, so it was not run',
      'check_docs.clean': 'documentation discipline: no violations',
      'check_docs.state_line_limit':
        'STATE.md is {{lines}} lines > the {{limit}}-line digest limit \u2014 archive older phase narrative to RETROSPECTIVE.md (override for one run: HARNESSED_ALLOW_LONG_STATE=1)',
      'check_docs.state_key_decisions':
        "{{count}} '\u5173\u952E\u51B3\u8BAE ship \u603B\u7ED3' section(s) > {{limit}} \u2014 keep only the current one; move the rest to RETROSPECTIVE.md",
      'check_docs.state_errata':
        "historical commentary '{{excerpt}}' belongs in RETROSPECTIVE.md, not in the STATE digest",
      'check_docs.roadmap_narrative':
        'closing narrative inlined in an overview doc ({{signals}}) \u2014 ROADMAP carries one line + a pointer per phase; narrative goes to SUMMARY / VERIFICATION',
      'check_docs.summary_halt':
        '\ndocumentation discipline: {{halt}} blocking + {{warn}} advisory violation(s)',
      'check_docs.summary_warn':
        '\ndocumentation discipline: {{warn}} advisory violation(s) (non-blocking)',
      'backup.no_backups': 'no backups found ({{root}} absent)',
      'backup.no_backups_empty': 'no backups found ({{root}} empty)',
      'backup.total_snapshots': '\n{{count}} snapshot(s) total',
      'rollback.metadata_unreadable': 'error: cannot read {{path}}: {{message}}',
      'rollback.metadata_unreadable.fix':
        "  fix:  run 'harnessed backup list' to see available timestamps",
      'rollback.checksum_mismatch':
        'error: backup checksum mismatch for {{target}} (expected {{expected}}, got {{actual}})',
      'rollback.restored': 'restored {{count}} file(s) from {{timestamp}}',
      'status.no_installs': 'no installs recorded ({{path}} absent or empty)',
      'status.summary_installs': '\n{{count}} install(s) recorded',
      'status.lock_held': '\nlock: held (since {{since}}){{staleSuffix}}',
      'status.lock_held.stale_suffix': ' \u2014 STALE',
      'status.lock_release_hint': '  to release: wait for process to finish or delete {{path}}',
      'status.lock_free': '\nlock: free',
      'here.no_workflow': 'no active workflow for this repo ({{path}} has no entry for cwd)',
      'here.no_workflow.hint':
        '  to start: run a stage (e.g. `harnessed gates discuss`) or `harnessed run <workflow>`',
      'audit_log.no_records_file': 'no audit records found ({{path}} does not exist)',
      'audit_log.no_records_empty': 'no audit records found (audit.log is empty)',
      'audit_log.jq_missing': '\u2717 jq not found in PATH \u2014 run: harnessed doctor',
      'audit_log.tail_invalid': '\u2717 --tail must be a positive integer',
      'audit_log.head_invalid': '\u2717 --head must be a positive integer',
      'execute_task.require_task': 'error: --task <text> is required',
      'execute_task.load_phases_failed':
        'error: failed to load workflows/{{workflow}}/phases.yaml \u2014 {{message}}',
      'execute_task.precommit_skipped':
        '\u26A0\uFE0F before-commit pre-flight skipped ({{message}}); subagent will biome-check at commit time.',
      'research.require_query': 'error: --query <text> is required',
      'manifest_add.non_interactive_warn':
        '[ee-5-gate] WARN: --non-interactive skips 5-question prompt (D-03 dry-run-only). plan-phase hard reject still applies.',
      'manifest_add.dry_run_preview':
        '[manifest-add] dry-run preview for upstream: {{upstream}} \u2192 {{path}}',
      'manifest_add.empty_answer': 'error: EE-5 gate requires non-empty answer',
      'manifest_add.gate_passed_wrote': '[manifest-add] EE-5 gate passed; wrote {{path}}',
      'manifest_add.gate_passed_dry_run':
        '[manifest-add] EE-5 gate passed (dry-run); would write {{path}}',
      'resume.fail': '\u2717 {{error}}',
      'resume.corrupt': '\u2717 {{error}}\n    path: {{path}}',
      'auto_update.consent_on': '[harnessed] auto-update ON',
      'auto_update.consent_off': '[harnessed] auto-update OFF',
      'auto_update.preferences_replaced':
        '[harnessed] the preferences file was unreadable (invalid JSON) \u2014 it has been replaced.',
      'auto_update.reminder_off_note': `[harnessed] the update reminder is OFF \u2014 the "new version available" notice will not be printed. Use 'harnessed auto-update status' to check on it.`,
      'auto_update.path.host': '  host:        {{host}}',
      'auto_update.path.preferences': '  preferences: {{path}}',
      'auto_update.path.status': '  status:      {{path}}',
      'auto_update.error.unsupported_host': 'unsupported host: {{host}} (expected claude or codex)',
      'auto_update.error.runtime': 'could not resolve the {{host}} update-reminder runtime',
      'auto_update.notice.updated_from': 'harnessed updated {{from}} -> {{to}}.',
      'auto_update.notice.updated_to': 'harnessed updated to {{to}}.',
      'auto_update.notice.restart': 'Restart {{host}} so the new version + hooks take effect.',
      'auto_update.notice.codex_trust':
        "Codex hooks still need your trust confirmed \u2014 approve the harness hook registration in Codex (or run 'harnessed setup' there).",
    }
  },
})

// src/i18n/index.ts
import { readFileSync as readFileSync2 } from 'node:fs'
import { dirname as dirname2, join as join2, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
function mapToSupported(raw) {
  if (!raw) return 'en'
  if (/^zh([^a-z]|$)/i.test(raw)) return 'zh-Hans'
  return 'en'
}
function detectLocale() {
  const raw =
    process.env.HARNESSED_LANG ||
    process.env.LC_ALL ||
    process.env.LANG ||
    process.env.LANGUAGE ||
    safeIntlLocale()
  return mapToSupported(raw)
}
function safeIntlLocale() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().locale
  } catch {
    return void 0
  }
}
function messagesDir() {
  const here = dirname2(fileURLToPath(import.meta.url))
  const candidates = []
  if (wiredMessagesDirProvider) {
    try {
      candidates.push(wiredMessagesDirProvider())
    } catch {}
  }
  candidates.push(resolve(here, '..', '..', 'messages'), resolve(here, '..', 'messages'))
  for (const c of candidates) {
    try {
      readFileSync2(join2(c, 'en.json'), 'utf8')
      return c
    } catch {}
  }
  return resolve(process.cwd(), 'messages')
}
function loadLocale(locale) {
  if (cache[locale]) return cache[locale]
  const path = join2(messagesDir(), `${locale}.json`)
  try {
    const raw = readFileSync2(path, 'utf8')
    cache[locale] = JSON.parse(raw)
  } catch {
    cache[locale] = locale === 'en' ? en_default : {}
  }
  return cache[locale]
}
function getLocale() {
  if (currentLocale === null) currentLocale = detectLocale()
  return currentLocale
}
function t(key, params) {
  const locale = getLocale()
  const primary = loadLocale(locale)
  let template = primary[key]
  if (template === void 0 && locale !== 'en') {
    template = loadLocale('en')[key]
  }
  if (template === void 0) template = key
  if (!params) return template
  return template.replace(/\{\{(\w+)\}\}/g, (_match, name) => {
    const v = params[name]
    return v === void 0 ? `{{${name}}}` : String(v)
  })
}
var currentLocale, cache, wiredMessagesDirProvider
var init_i18n = __esm({
  'src/i18n/index.ts'() {
    'use strict'
    init_en()
    currentLocale = null
    cache = {}
    wiredMessagesDirProvider = null
  },
})

// src/cli/lib/autoUpdateNotice.ts
var autoUpdateNotice_exports = {}
__export(autoUpdateNotice_exports, {
  consumeAutoUpdateNotice: () => consumeAutoUpdateNotice,
  formatAutoUpdateNotice: () => formatAutoUpdateNotice,
  isPrintableAutoUpdateNotice: () => isPrintableAutoUpdateNotice,
  readAutoUpdateNotice: () => readAutoUpdateNotice,
  writeAutoUpdateNotice: () => writeAutoUpdateNotice,
})
function readAutoUpdateNotice(statusPath) {
  return readAutoUpdateStatus(statusPath)?.notice ?? null
}
function isPrintableAutoUpdateNotice(notice) {
  if (!notice) return false
  if (notice.to.trim() === '') return false
  return (notice.consumedAt ?? 0) === 0
}
function formatAutoUpdateNotice(notice) {
  const host = notice.restart.trim() || 'Claude Code'
  const from = notice.from.trim()
  const lines = []
  lines.push(
    from
      ? t('auto_update.notice.updated_from', { from, to: notice.to })
      : t('auto_update.notice.updated_to', { to: notice.to }),
  )
  const changelog = notice.changelog.trim()
  if (changelog) lines.push('', changelog)
  lines.push('', t('auto_update.notice.restart', { host }))
  if (host === 'Codex') {
    lines.push(t('auto_update.notice.codex_trust'))
  }
  return lines.join('\n')
}
function writeAutoUpdateNotice(statusPath, notice) {
  const status = readAutoUpdateStatus(statusPath)
  if (!status) return false
  try {
    writeAutoUpdateStatus(statusPath, { ...status, notice })
    return true
  } catch {
    return false
  }
}
function consumeAutoUpdateNotice(statusPath, now) {
  const status = readAutoUpdateStatus(statusPath)
  const notice = status?.notice
  if (!status || !notice) return false
  if ((notice.consumedAt ?? 0) !== 0) return false
  if (notice.to.trim() === '') return false
  try {
    writeAutoUpdateStatus(statusPath, { ...status, notice: { ...notice, consumedAt: now } })
    return true
  } catch {
    return false
  }
}
var init_autoUpdateNotice = __esm({
  'src/cli/lib/autoUpdateNotice.ts'() {
    'use strict'
    init_i18n()
    init_autoUpdateStatus()
  },
})

// src/cli/lib/updateReminderCache.ts
import fs from 'node:fs'
function isReminderVersion(value) {
  return (
    typeof value === 'string' &&
    value.length <= 128 &&
    /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(value)
  )
}
function parseCache(text, identity, now) {
  const cache2 = JSON.parse(text)
  if (!cache2 || cache2.schemaVersion !== 1 || !cache2.identity) return null
  const keys = ['host', 'runtime', 'channel', 'source', 'fingerprint']
  if (identity.host !== 'claude' && identity.host !== 'codex') return null
  for (const key of keys) {
    const value = cache2.identity[key]
    if (
      typeof value !== 'string' ||
      !value.length ||
      value.length > 512 ||
      value !== identity[key]
    ) {
      return null
    }
  }
  const { installed: installed2, latest, state, checkedAt, retryAfter } = cache2
  if (
    !isReminderVersion(installed2) ||
    typeof checkedAt !== 'number' ||
    !Number.isSafeInteger(checkedAt) ||
    checkedAt < 0 ||
    checkedAt > now ||
    typeof retryAfter !== 'number' ||
    !Number.isSafeInteger(retryAfter) ||
    retryAfter < 0
  )
    return null
  if (state === 'unknown') {
    if (latest !== null || retryAfter !== checkedAt + REMINDER_RETRY_MS) return null
  } else if (
    !['behind', 'current', 'ahead'].includes(state ?? '') ||
    !isReminderVersion(latest) ||
    retryAfter !== 0
  )
    return null
  return {
    schemaVersion: 1,
    identity: { ...identity },
    installed: installed2,
    latest: latest ?? null,
    state,
    checkedAt,
    retryAfter,
  }
}
function readReminderCache(cachePath, identity, now = Date.now()) {
  let descriptor
  try {
    descriptor = fs.openSync(cachePath, fs.constants.O_RDONLY | fs.constants.O_NONBLOCK)
    const stat2 = fs.fstatSync(descriptor)
    if (!stat2.isFile() || stat2.size > REMINDER_MAX_BYTES) return null
    const buffer = Buffer.alloc(REMINDER_MAX_BYTES + 1)
    const bytes = fs.readSync(descriptor, buffer, 0, buffer.length, 0)
    if (bytes > REMINDER_MAX_BYTES || bytes < stat2.size) return null
    return parseCache(buffer.toString('utf8', 0, bytes), identity, now)
  } catch {
    return null
  } finally {
    if (descriptor !== void 0) {
      try {
        fs.closeSync(descriptor)
      } catch {}
    }
  }
}
function shouldRefreshReminder(cache2, now) {
  if (!cache2) return true
  if (cache2.retryAfter > now) return false
  return cache2.state === 'unknown' || now - cache2.checkedAt >= REMINDER_TTL_MS
}
var REMINDER_TTL_MS, REMINDER_RETRY_MS, REMINDER_MAX_BYTES, REMINDER_LOCK_STALE_MS
var init_updateReminderCache = __esm({
  'src/cli/lib/updateReminderCache.ts'() {
    'use strict'
    REMINDER_TTL_MS = 24 * 60 * 60 * 1e3
    REMINDER_RETRY_MS = 60 * 60 * 1e3
    REMINDER_MAX_BYTES = 16 * 1024
    REMINDER_LOCK_STALE_MS = 3e4
  },
})

// src/platform/stateRoot.ts
import { homedir } from 'node:os'
import { join as join3, resolve as resolve2 } from 'node:path'
function canonicalStateRoot(hostId) {
  const override = process.env.HARNESSED_ROOT_OVERRIDE?.trim()
  if (override) return resolve2(override)
  const nativeHome =
    hostId === 'codex'
      ? process.env.CODEX_HOME?.trim() || join3(homedir(), '.codex')
      : process.env.CLAUDE_CONFIG_DIR?.trim() || join3(homedir(), '.claude')
  return resolve2(join3(nativeHome, 'harnessed'))
}
var init_stateRoot = __esm({
  'src/platform/stateRoot.ts'() {
    'use strict'
  },
})

// node_modules/.pnpm/graceful-fs@4.2.11/node_modules/graceful-fs/polyfills.js
var require_polyfills = __commonJS({
  'node_modules/.pnpm/graceful-fs@4.2.11/node_modules/graceful-fs/polyfills.js'(exports, module) {
    var constants2 = __require('constants')
    var origCwd = process.cwd
    var cwd = null
    var platform = process.env.GRACEFUL_FS_PLATFORM || process.platform
    process.cwd = function () {
      if (!cwd) cwd = origCwd.call(process)
      return cwd
    }
    try {
      process.cwd()
    } catch (er) {}
    if (typeof process.chdir === 'function') {
      chdir = process.chdir
      process.chdir = function (d) {
        cwd = null
        chdir.call(process, d)
      }
      if (Object.setPrototypeOf) Object.setPrototypeOf(process.chdir, chdir)
    }
    var chdir
    module.exports = patch
    function patch(fs2) {
      if (
        constants2.hasOwnProperty('O_SYMLINK') &&
        process.version.match(/^v0\.6\.[0-2]|^v0\.5\./)
      ) {
        patchLchmod(fs2)
      }
      if (!fs2.lutimes) {
        patchLutimes(fs2)
      }
      fs2.chown = chownFix(fs2.chown)
      fs2.fchown = chownFix(fs2.fchown)
      fs2.lchown = chownFix(fs2.lchown)
      fs2.chmod = chmodFix(fs2.chmod)
      fs2.fchmod = chmodFix(fs2.fchmod)
      fs2.lchmod = chmodFix(fs2.lchmod)
      fs2.chownSync = chownFixSync(fs2.chownSync)
      fs2.fchownSync = chownFixSync(fs2.fchownSync)
      fs2.lchownSync = chownFixSync(fs2.lchownSync)
      fs2.chmodSync = chmodFixSync(fs2.chmodSync)
      fs2.fchmodSync = chmodFixSync(fs2.fchmodSync)
      fs2.lchmodSync = chmodFixSync(fs2.lchmodSync)
      fs2.stat = statFix(fs2.stat)
      fs2.fstat = statFix(fs2.fstat)
      fs2.lstat = statFix(fs2.lstat)
      fs2.statSync = statFixSync(fs2.statSync)
      fs2.fstatSync = statFixSync(fs2.fstatSync)
      fs2.lstatSync = statFixSync(fs2.lstatSync)
      if (fs2.chmod && !fs2.lchmod) {
        fs2.lchmod = function (path, mode, cb) {
          if (cb) process.nextTick(cb)
        }
        fs2.lchmodSync = function () {}
      }
      if (fs2.chown && !fs2.lchown) {
        fs2.lchown = function (path, uid, gid, cb) {
          if (cb) process.nextTick(cb)
        }
        fs2.lchownSync = function () {}
      }
      if (platform === 'win32') {
        fs2.rename =
          typeof fs2.rename !== 'function'
            ? fs2.rename
            : (function (fs$rename) {
                function rename(from, to, cb) {
                  var start = Date.now()
                  var backoff = 0
                  fs$rename(from, to, function CB(er) {
                    if (
                      er &&
                      (er.code === 'EACCES' || er.code === 'EPERM' || er.code === 'EBUSY') &&
                      Date.now() - start < 6e4
                    ) {
                      setTimeout(function () {
                        fs2.stat(to, function (stater, st) {
                          if (stater && stater.code === 'ENOENT') fs$rename(from, to, CB)
                          else cb(er)
                        })
                      }, backoff)
                      if (backoff < 100) backoff += 10
                      return
                    }
                    if (cb) cb(er)
                  })
                }
                if (Object.setPrototypeOf) Object.setPrototypeOf(rename, fs$rename)
                return rename
              })(fs2.rename)
      }
      fs2.read =
        typeof fs2.read !== 'function'
          ? fs2.read
          : (function (fs$read) {
              function read(fd, buffer, offset, length, position, callback_) {
                var callback
                if (callback_ && typeof callback_ === 'function') {
                  var eagCounter = 0
                  callback = function (er, _, __) {
                    if (er && er.code === 'EAGAIN' && eagCounter < 10) {
                      eagCounter++
                      return fs$read.call(fs2, fd, buffer, offset, length, position, callback)
                    }
                    callback_.apply(this, arguments)
                  }
                }
                return fs$read.call(fs2, fd, buffer, offset, length, position, callback)
              }
              if (Object.setPrototypeOf) Object.setPrototypeOf(read, fs$read)
              return read
            })(fs2.read)
      fs2.readSync =
        typeof fs2.readSync !== 'function'
          ? fs2.readSync
          : /* @__PURE__ */ (function (fs$readSync) {
              return function (fd, buffer, offset, length, position) {
                var eagCounter = 0
                while (true) {
                  try {
                    return fs$readSync.call(fs2, fd, buffer, offset, length, position)
                  } catch (er) {
                    if (er.code === 'EAGAIN' && eagCounter < 10) {
                      eagCounter++
                      continue
                    }
                    throw er
                  }
                }
              }
            })(fs2.readSync)
      function patchLchmod(fs3) {
        fs3.lchmod = function (path, mode, callback) {
          fs3.open(path, constants2.O_WRONLY | constants2.O_SYMLINK, mode, function (err, fd) {
            if (err) {
              if (callback) callback(err)
              return
            }
            fs3.fchmod(fd, mode, function (err2) {
              fs3.close(fd, function (err22) {
                if (callback) callback(err2 || err22)
              })
            })
          })
        }
        fs3.lchmodSync = function (path, mode) {
          var fd = fs3.openSync(path, constants2.O_WRONLY | constants2.O_SYMLINK, mode)
          var threw = true
          var ret
          try {
            ret = fs3.fchmodSync(fd, mode)
            threw = false
          } finally {
            if (threw) {
              try {
                fs3.closeSync(fd)
              } catch (er) {}
            } else {
              fs3.closeSync(fd)
            }
          }
          return ret
        }
      }
      function patchLutimes(fs3) {
        if (constants2.hasOwnProperty('O_SYMLINK') && fs3.futimes) {
          fs3.lutimes = function (path, at, mt, cb) {
            fs3.open(path, constants2.O_SYMLINK, function (er, fd) {
              if (er) {
                if (cb) cb(er)
                return
              }
              fs3.futimes(fd, at, mt, function (er2) {
                fs3.close(fd, function (er22) {
                  if (cb) cb(er2 || er22)
                })
              })
            })
          }
          fs3.lutimesSync = function (path, at, mt) {
            var fd = fs3.openSync(path, constants2.O_SYMLINK)
            var ret
            var threw = true
            try {
              ret = fs3.futimesSync(fd, at, mt)
              threw = false
            } finally {
              if (threw) {
                try {
                  fs3.closeSync(fd)
                } catch (er) {}
              } else {
                fs3.closeSync(fd)
              }
            }
            return ret
          }
        } else if (fs3.futimes) {
          fs3.lutimes = function (_a, _b, _c, cb) {
            if (cb) process.nextTick(cb)
          }
          fs3.lutimesSync = function () {}
        }
      }
      function chmodFix(orig) {
        if (!orig) return orig
        return function (target, mode, cb) {
          return orig.call(fs2, target, mode, function (er) {
            if (chownErOk(er)) er = null
            if (cb) cb.apply(this, arguments)
          })
        }
      }
      function chmodFixSync(orig) {
        if (!orig) return orig
        return function (target, mode) {
          try {
            return orig.call(fs2, target, mode)
          } catch (er) {
            if (!chownErOk(er)) throw er
          }
        }
      }
      function chownFix(orig) {
        if (!orig) return orig
        return function (target, uid, gid, cb) {
          return orig.call(fs2, target, uid, gid, function (er) {
            if (chownErOk(er)) er = null
            if (cb) cb.apply(this, arguments)
          })
        }
      }
      function chownFixSync(orig) {
        if (!orig) return orig
        return function (target, uid, gid) {
          try {
            return orig.call(fs2, target, uid, gid)
          } catch (er) {
            if (!chownErOk(er)) throw er
          }
        }
      }
      function statFix(orig) {
        if (!orig) return orig
        return function (target, options, cb) {
          if (typeof options === 'function') {
            cb = options
            options = null
          }
          function callback(er, stats) {
            if (stats) {
              if (stats.uid < 0) stats.uid += 4294967296
              if (stats.gid < 0) stats.gid += 4294967296
            }
            if (cb) cb.apply(this, arguments)
          }
          return options
            ? orig.call(fs2, target, options, callback)
            : orig.call(fs2, target, callback)
        }
      }
      function statFixSync(orig) {
        if (!orig) return orig
        return function (target, options) {
          var stats = options ? orig.call(fs2, target, options) : orig.call(fs2, target)
          if (stats) {
            if (stats.uid < 0) stats.uid += 4294967296
            if (stats.gid < 0) stats.gid += 4294967296
          }
          return stats
        }
      }
      function chownErOk(er) {
        if (!er) return true
        if (er.code === 'ENOSYS') return true
        var nonroot = !process.getuid || process.getuid() !== 0
        if (nonroot) {
          if (er.code === 'EINVAL' || er.code === 'EPERM') return true
        }
        return false
      }
    }
  },
})

// node_modules/.pnpm/graceful-fs@4.2.11/node_modules/graceful-fs/legacy-streams.js
var require_legacy_streams = __commonJS({
  'node_modules/.pnpm/graceful-fs@4.2.11/node_modules/graceful-fs/legacy-streams.js'(
    exports,
    module,
  ) {
    var Stream = __require('stream').Stream
    module.exports = legacy
    function legacy(fs2) {
      return {
        ReadStream,
        WriteStream,
      }
      function ReadStream(path, options) {
        if (!(this instanceof ReadStream)) return new ReadStream(path, options)
        Stream.call(this)
        var self = this
        this.path = path
        this.fd = null
        this.readable = true
        this.paused = false
        this.flags = 'r'
        this.mode = 438
        this.bufferSize = 64 * 1024
        options = options || {}
        var keys = Object.keys(options)
        for (var index = 0, length = keys.length; index < length; index++) {
          var key = keys[index]
          this[key] = options[key]
        }
        if (this.encoding) this.setEncoding(this.encoding)
        if (this.start !== void 0) {
          if ('number' !== typeof this.start) {
            throw TypeError('start must be a Number')
          }
          if (this.end === void 0) {
            this.end = Infinity
          } else if ('number' !== typeof this.end) {
            throw TypeError('end must be a Number')
          }
          if (this.start > this.end) {
            throw new Error('start must be <= end')
          }
          this.pos = this.start
        }
        if (this.fd !== null) {
          process.nextTick(function () {
            self._read()
          })
          return
        }
        fs2.open(this.path, this.flags, this.mode, function (err, fd) {
          if (err) {
            self.emit('error', err)
            self.readable = false
            return
          }
          self.fd = fd
          self.emit('open', fd)
          self._read()
        })
      }
      function WriteStream(path, options) {
        if (!(this instanceof WriteStream)) return new WriteStream(path, options)
        Stream.call(this)
        this.path = path
        this.fd = null
        this.writable = true
        this.flags = 'w'
        this.encoding = 'binary'
        this.mode = 438
        this.bytesWritten = 0
        options = options || {}
        var keys = Object.keys(options)
        for (var index = 0, length = keys.length; index < length; index++) {
          var key = keys[index]
          this[key] = options[key]
        }
        if (this.start !== void 0) {
          if ('number' !== typeof this.start) {
            throw TypeError('start must be a Number')
          }
          if (this.start < 0) {
            throw new Error('start must be >= zero')
          }
          this.pos = this.start
        }
        this.busy = false
        this._queue = []
        if (this.fd === null) {
          this._open = fs2.open
          this._queue.push([this._open, this.path, this.flags, this.mode, void 0])
          this.flush()
        }
      }
    }
  },
})

// node_modules/.pnpm/graceful-fs@4.2.11/node_modules/graceful-fs/clone.js
var require_clone = __commonJS({
  'node_modules/.pnpm/graceful-fs@4.2.11/node_modules/graceful-fs/clone.js'(exports, module) {
    'use strict'
    module.exports = clone
    var getPrototypeOf =
      Object.getPrototypeOf ||
      function (obj) {
        return obj.__proto__
      }
    function clone(obj) {
      if (obj === null || typeof obj !== 'object') return obj
      if (obj instanceof Object) var copy = { __proto__: getPrototypeOf(obj) }
      else var copy = /* @__PURE__ */ Object.create(null)
      Object.getOwnPropertyNames(obj).forEach(function (key) {
        Object.defineProperty(copy, key, Object.getOwnPropertyDescriptor(obj, key))
      })
      return copy
    }
  },
})

// node_modules/.pnpm/graceful-fs@4.2.11/node_modules/graceful-fs/graceful-fs.js
var require_graceful_fs = __commonJS({
  'node_modules/.pnpm/graceful-fs@4.2.11/node_modules/graceful-fs/graceful-fs.js'(exports, module) {
    var fs2 = __require('fs')
    var polyfills = require_polyfills()
    var legacy = require_legacy_streams()
    var clone = require_clone()
    var util = __require('util')
    var gracefulQueue
    var previousSymbol
    if (typeof Symbol === 'function' && typeof Symbol.for === 'function') {
      gracefulQueue = /* @__PURE__ */ Symbol.for('graceful-fs.queue')
      previousSymbol = /* @__PURE__ */ Symbol.for('graceful-fs.previous')
    } else {
      gracefulQueue = '___graceful-fs.queue'
      previousSymbol = '___graceful-fs.previous'
    }
    function noop() {}
    function publishQueue(context, queue2) {
      Object.defineProperty(context, gracefulQueue, {
        get: function () {
          return queue2
        },
      })
    }
    var debug = noop
    if (util.debuglog) debug = util.debuglog('gfs4')
    else if (/\bgfs4\b/i.test(process.env.NODE_DEBUG || ''))
      debug = function () {
        var m = util.format.apply(util, arguments)
        m = 'GFS4: ' + m.split(/\n/).join('\nGFS4: ')
        console.error(m)
      }
    if (!fs2[gracefulQueue]) {
      queue = global[gracefulQueue] || []
      publishQueue(fs2, queue)
      fs2.close = (function (fs$close) {
        function close(fd, cb) {
          return fs$close.call(fs2, fd, function (err) {
            if (!err) {
              resetQueue()
            }
            if (typeof cb === 'function') cb.apply(this, arguments)
          })
        }
        Object.defineProperty(close, previousSymbol, {
          value: fs$close,
        })
        return close
      })(fs2.close)
      fs2.closeSync = (function (fs$closeSync) {
        function closeSync3(fd) {
          fs$closeSync.apply(fs2, arguments)
          resetQueue()
        }
        Object.defineProperty(closeSync3, previousSymbol, {
          value: fs$closeSync,
        })
        return closeSync3
      })(fs2.closeSync)
      if (/\bgfs4\b/i.test(process.env.NODE_DEBUG || '')) {
        process.on('exit', function () {
          debug(fs2[gracefulQueue])
          __require('assert').equal(fs2[gracefulQueue].length, 0)
        })
      }
    }
    var queue
    if (!global[gracefulQueue]) {
      publishQueue(global, fs2[gracefulQueue])
    }
    module.exports = patch(clone(fs2))
    if (process.env.TEST_GRACEFUL_FS_GLOBAL_PATCH && !fs2.__patched) {
      module.exports = patch(fs2)
      fs2.__patched = true
    }
    function patch(fs3) {
      polyfills(fs3)
      fs3.gracefulify = patch
      fs3.createReadStream = createReadStream
      fs3.createWriteStream = createWriteStream2
      var fs$readFile = fs3.readFile
      fs3.readFile = readFile2
      function readFile2(path, options, cb) {
        if (typeof options === 'function') (cb = options), (options = null)
        return go$readFile(path, options, cb)
        function go$readFile(path2, options2, cb2, startTime) {
          return fs$readFile(path2, options2, function (err) {
            if (err && (err.code === 'EMFILE' || err.code === 'ENFILE'))
              enqueue([
                go$readFile,
                [path2, options2, cb2],
                err,
                startTime || Date.now(),
                Date.now(),
              ])
            else {
              if (typeof cb2 === 'function') cb2.apply(this, arguments)
            }
          })
        }
      }
      var fs$writeFile = fs3.writeFile
      fs3.writeFile = writeFile
      function writeFile(path, data, options, cb) {
        if (typeof options === 'function') (cb = options), (options = null)
        return go$writeFile(path, data, options, cb)
        function go$writeFile(path2, data2, options2, cb2, startTime) {
          return fs$writeFile(path2, data2, options2, function (err) {
            if (err && (err.code === 'EMFILE' || err.code === 'ENFILE'))
              enqueue([
                go$writeFile,
                [path2, data2, options2, cb2],
                err,
                startTime || Date.now(),
                Date.now(),
              ])
            else {
              if (typeof cb2 === 'function') cb2.apply(this, arguments)
            }
          })
        }
      }
      var fs$appendFile = fs3.appendFile
      if (fs$appendFile) fs3.appendFile = appendFile
      function appendFile(path, data, options, cb) {
        if (typeof options === 'function') (cb = options), (options = null)
        return go$appendFile(path, data, options, cb)
        function go$appendFile(path2, data2, options2, cb2, startTime) {
          return fs$appendFile(path2, data2, options2, function (err) {
            if (err && (err.code === 'EMFILE' || err.code === 'ENFILE'))
              enqueue([
                go$appendFile,
                [path2, data2, options2, cb2],
                err,
                startTime || Date.now(),
                Date.now(),
              ])
            else {
              if (typeof cb2 === 'function') cb2.apply(this, arguments)
            }
          })
        }
      }
      var fs$copyFile = fs3.copyFile
      if (fs$copyFile) fs3.copyFile = copyFile
      function copyFile(src, dest, flags, cb) {
        if (typeof flags === 'function') {
          cb = flags
          flags = 0
        }
        return go$copyFile(src, dest, flags, cb)
        function go$copyFile(src2, dest2, flags2, cb2, startTime) {
          return fs$copyFile(src2, dest2, flags2, function (err) {
            if (err && (err.code === 'EMFILE' || err.code === 'ENFILE'))
              enqueue([
                go$copyFile,
                [src2, dest2, flags2, cb2],
                err,
                startTime || Date.now(),
                Date.now(),
              ])
            else {
              if (typeof cb2 === 'function') cb2.apply(this, arguments)
            }
          })
        }
      }
      var fs$readdir = fs3.readdir
      fs3.readdir = readdir2
      var noReaddirOptionVersions = /^v[0-5]\./
      function readdir2(path, options, cb) {
        if (typeof options === 'function') (cb = options), (options = null)
        var go$readdir = noReaddirOptionVersions.test(process.version)
          ? function go$readdir2(path2, options2, cb2, startTime) {
              return fs$readdir(path2, fs$readdirCallback(path2, options2, cb2, startTime))
            }
          : function go$readdir2(path2, options2, cb2, startTime) {
              return fs$readdir(
                path2,
                options2,
                fs$readdirCallback(path2, options2, cb2, startTime),
              )
            }
        return go$readdir(path, options, cb)
        function fs$readdirCallback(path2, options2, cb2, startTime) {
          return function (err, files) {
            if (err && (err.code === 'EMFILE' || err.code === 'ENFILE'))
              enqueue([
                go$readdir,
                [path2, options2, cb2],
                err,
                startTime || Date.now(),
                Date.now(),
              ])
            else {
              if (files && files.sort) files.sort()
              if (typeof cb2 === 'function') cb2.call(this, err, files)
            }
          }
        }
      }
      if (process.version.substr(0, 4) === 'v0.8') {
        var legStreams = legacy(fs3)
        ReadStream = legStreams.ReadStream
        WriteStream = legStreams.WriteStream
      }
      var fs$ReadStream = fs3.ReadStream
      if (fs$ReadStream) {
        ReadStream.prototype = Object.create(fs$ReadStream.prototype)
        ReadStream.prototype.open = ReadStream$open
      }
      var fs$WriteStream = fs3.WriteStream
      if (fs$WriteStream) {
        WriteStream.prototype = Object.create(fs$WriteStream.prototype)
        WriteStream.prototype.open = WriteStream$open
      }
      Object.defineProperty(fs3, 'ReadStream', {
        get: function () {
          return ReadStream
        },
        set: function (val) {
          ReadStream = val
        },
        enumerable: true,
        configurable: true,
      })
      Object.defineProperty(fs3, 'WriteStream', {
        get: function () {
          return WriteStream
        },
        set: function (val) {
          WriteStream = val
        },
        enumerable: true,
        configurable: true,
      })
      var FileReadStream = ReadStream
      Object.defineProperty(fs3, 'FileReadStream', {
        get: function () {
          return FileReadStream
        },
        set: function (val) {
          FileReadStream = val
        },
        enumerable: true,
        configurable: true,
      })
      var FileWriteStream = WriteStream
      Object.defineProperty(fs3, 'FileWriteStream', {
        get: function () {
          return FileWriteStream
        },
        set: function (val) {
          FileWriteStream = val
        },
        enumerable: true,
        configurable: true,
      })
      function ReadStream(path, options) {
        if (this instanceof ReadStream) return fs$ReadStream.apply(this, arguments), this
        else return ReadStream.apply(Object.create(ReadStream.prototype), arguments)
      }
      function ReadStream$open() {
        var that = this
        open(that.path, that.flags, that.mode, function (err, fd) {
          if (err) {
            if (that.autoClose) that.destroy()
            that.emit('error', err)
          } else {
            that.fd = fd
            that.emit('open', fd)
            that.read()
          }
        })
      }
      function WriteStream(path, options) {
        if (this instanceof WriteStream) return fs$WriteStream.apply(this, arguments), this
        else return WriteStream.apply(Object.create(WriteStream.prototype), arguments)
      }
      function WriteStream$open() {
        var that = this
        open(that.path, that.flags, that.mode, function (err, fd) {
          if (err) {
            that.destroy()
            that.emit('error', err)
          } else {
            that.fd = fd
            that.emit('open', fd)
          }
        })
      }
      function createReadStream(path, options) {
        return new fs3.ReadStream(path, options)
      }
      function createWriteStream2(path, options) {
        return new fs3.WriteStream(path, options)
      }
      var fs$open = fs3.open
      fs3.open = open
      function open(path, flags, mode, cb) {
        if (typeof mode === 'function') (cb = mode), (mode = null)
        return go$open(path, flags, mode, cb)
        function go$open(path2, flags2, mode2, cb2, startTime) {
          return fs$open(path2, flags2, mode2, function (err, fd) {
            if (err && (err.code === 'EMFILE' || err.code === 'ENFILE'))
              enqueue([
                go$open,
                [path2, flags2, mode2, cb2],
                err,
                startTime || Date.now(),
                Date.now(),
              ])
            else {
              if (typeof cb2 === 'function') cb2.apply(this, arguments)
            }
          })
        }
      }
      return fs3
    }
    function enqueue(elem) {
      debug('ENQUEUE', elem[0].name, elem[1])
      fs2[gracefulQueue].push(elem)
      retry()
    }
    var retryTimer
    function resetQueue() {
      var now = Date.now()
      for (var i = 0; i < fs2[gracefulQueue].length; ++i) {
        if (fs2[gracefulQueue][i].length > 2) {
          fs2[gracefulQueue][i][3] = now
          fs2[gracefulQueue][i][4] = now
        }
      }
      retry()
    }
    function retry() {
      clearTimeout(retryTimer)
      retryTimer = void 0
      if (fs2[gracefulQueue].length === 0) return
      var elem = fs2[gracefulQueue].shift()
      var fn = elem[0]
      var args = elem[1]
      var err = elem[2]
      var startTime = elem[3]
      var lastTime = elem[4]
      if (startTime === void 0) {
        debug('RETRY', fn.name, args)
        fn.apply(null, args)
      } else if (Date.now() - startTime >= 6e4) {
        debug('TIMEOUT', fn.name, args)
        var cb = args.pop()
        if (typeof cb === 'function') cb.call(null, err)
      } else {
        var sinceAttempt = Date.now() - lastTime
        var sinceStart = Math.max(lastTime - startTime, 1)
        var desiredDelay = Math.min(sinceStart * 1.2, 100)
        if (sinceAttempt >= desiredDelay) {
          debug('RETRY', fn.name, args)
          fn.apply(null, args.concat([startTime]))
        } else {
          fs2[gracefulQueue].push(elem)
        }
      }
      if (retryTimer === void 0) {
        retryTimer = setTimeout(retry, 0)
      }
    }
  },
})

// node_modules/.pnpm/retry@0.12.0/node_modules/retry/lib/retry_operation.js
var require_retry_operation = __commonJS({
  'node_modules/.pnpm/retry@0.12.0/node_modules/retry/lib/retry_operation.js'(exports, module) {
    function RetryOperation(timeouts, options) {
      if (typeof options === 'boolean') {
        options = { forever: options }
      }
      this._originalTimeouts = JSON.parse(JSON.stringify(timeouts))
      this._timeouts = timeouts
      this._options = options || {}
      this._maxRetryTime = (options && options.maxRetryTime) || Infinity
      this._fn = null
      this._errors = []
      this._attempts = 1
      this._operationTimeout = null
      this._operationTimeoutCb = null
      this._timeout = null
      this._operationStart = null
      if (this._options.forever) {
        this._cachedTimeouts = this._timeouts.slice(0)
      }
    }
    module.exports = RetryOperation
    RetryOperation.prototype.reset = function () {
      this._attempts = 1
      this._timeouts = this._originalTimeouts
    }
    RetryOperation.prototype.stop = function () {
      if (this._timeout) {
        clearTimeout(this._timeout)
      }
      this._timeouts = []
      this._cachedTimeouts = null
    }
    RetryOperation.prototype.retry = function (err) {
      if (this._timeout) {
        clearTimeout(this._timeout)
      }
      if (!err) {
        return false
      }
      var currentTime = /* @__PURE__ */ new Date().getTime()
      if (err && currentTime - this._operationStart >= this._maxRetryTime) {
        this._errors.unshift(new Error('RetryOperation timeout occurred'))
        return false
      }
      this._errors.push(err)
      var timeout = this._timeouts.shift()
      if (timeout === void 0) {
        if (this._cachedTimeouts) {
          this._errors.splice(this._errors.length - 1, this._errors.length)
          this._timeouts = this._cachedTimeouts.slice(0)
          timeout = this._timeouts.shift()
        } else {
          return false
        }
      }
      var self = this
      var timer = setTimeout(function () {
        self._attempts++
        if (self._operationTimeoutCb) {
          self._timeout = setTimeout(function () {
            self._operationTimeoutCb(self._attempts)
          }, self._operationTimeout)
          if (self._options.unref) {
            self._timeout.unref()
          }
        }
        self._fn(self._attempts)
      }, timeout)
      if (this._options.unref) {
        timer.unref()
      }
      return true
    }
    RetryOperation.prototype.attempt = function (fn, timeoutOps) {
      this._fn = fn
      if (timeoutOps) {
        if (timeoutOps.timeout) {
          this._operationTimeout = timeoutOps.timeout
        }
        if (timeoutOps.cb) {
          this._operationTimeoutCb = timeoutOps.cb
        }
      }
      var self = this
      if (this._operationTimeoutCb) {
        this._timeout = setTimeout(function () {
          self._operationTimeoutCb()
        }, self._operationTimeout)
      }
      this._operationStart = /* @__PURE__ */ new Date().getTime()
      this._fn(this._attempts)
    }
    RetryOperation.prototype.try = function (fn) {
      console.log('Using RetryOperation.try() is deprecated')
      this.attempt(fn)
    }
    RetryOperation.prototype.start = function (fn) {
      console.log('Using RetryOperation.start() is deprecated')
      this.attempt(fn)
    }
    RetryOperation.prototype.start = RetryOperation.prototype.try
    RetryOperation.prototype.errors = function () {
      return this._errors
    }
    RetryOperation.prototype.attempts = function () {
      return this._attempts
    }
    RetryOperation.prototype.mainError = function () {
      if (this._errors.length === 0) {
        return null
      }
      var counts = {}
      var mainError = null
      var mainErrorCount = 0
      for (var i = 0; i < this._errors.length; i++) {
        var error = this._errors[i]
        var message = error.message
        var count = (counts[message] || 0) + 1
        counts[message] = count
        if (count >= mainErrorCount) {
          mainError = error
          mainErrorCount = count
        }
      }
      return mainError
    }
  },
})

// node_modules/.pnpm/retry@0.12.0/node_modules/retry/lib/retry.js
var require_retry = __commonJS({
  'node_modules/.pnpm/retry@0.12.0/node_modules/retry/lib/retry.js'(exports) {
    var RetryOperation = require_retry_operation()
    exports.operation = function (options) {
      var timeouts = exports.timeouts(options)
      return new RetryOperation(timeouts, {
        forever: options && options.forever,
        unref: options && options.unref,
        maxRetryTime: options && options.maxRetryTime,
      })
    }
    exports.timeouts = function (options) {
      if (options instanceof Array) {
        return [].concat(options)
      }
      var opts = {
        retries: 10,
        factor: 2,
        minTimeout: 1 * 1e3,
        maxTimeout: Infinity,
        randomize: false,
      }
      for (var key in options) {
        opts[key] = options[key]
      }
      if (opts.minTimeout > opts.maxTimeout) {
        throw new Error('minTimeout is greater than maxTimeout')
      }
      var timeouts = []
      for (var i = 0; i < opts.retries; i++) {
        timeouts.push(this.createTimeout(i, opts))
      }
      if (options && options.forever && !timeouts.length) {
        timeouts.push(this.createTimeout(i, opts))
      }
      timeouts.sort(function (a, b) {
        return a - b
      })
      return timeouts
    }
    exports.createTimeout = function (attempt, opts) {
      var random = opts.randomize ? Math.random() + 1 : 1
      var timeout = Math.round(random * opts.minTimeout * Math.pow(opts.factor, attempt))
      timeout = Math.min(timeout, opts.maxTimeout)
      return timeout
    }
    exports.wrap = function (obj, options, methods) {
      if (options instanceof Array) {
        methods = options
        options = null
      }
      if (!methods) {
        methods = []
        for (var key in obj) {
          if (typeof obj[key] === 'function') {
            methods.push(key)
          }
        }
      }
      for (var i = 0; i < methods.length; i++) {
        var method = methods[i]
        var original = obj[method]
        obj[method] = function retryWrapper(original2) {
          var op = exports.operation(options)
          var args = Array.prototype.slice.call(arguments, 1)
          var callback = args.pop()
          args.push(function (err) {
            if (op.retry(err)) {
              return
            }
            if (err) {
              arguments[0] = op.mainError()
            }
            callback.apply(this, arguments)
          })
          op.attempt(function () {
            original2.apply(obj, args)
          })
        }.bind(obj, original)
        obj[method].options = options
      }
    }
  },
})

// node_modules/.pnpm/retry@0.12.0/node_modules/retry/index.js
var require_retry2 = __commonJS({
  'node_modules/.pnpm/retry@0.12.0/node_modules/retry/index.js'(exports, module) {
    module.exports = require_retry()
  },
})

// node_modules/.pnpm/signal-exit@3.0.7/node_modules/signal-exit/signals.js
var require_signals = __commonJS({
  'node_modules/.pnpm/signal-exit@3.0.7/node_modules/signal-exit/signals.js'(exports, module) {
    module.exports = ['SIGABRT', 'SIGALRM', 'SIGHUP', 'SIGINT', 'SIGTERM']
    if (process.platform !== 'win32') {
      module.exports.push(
        'SIGVTALRM',
        'SIGXCPU',
        'SIGXFSZ',
        'SIGUSR2',
        'SIGTRAP',
        'SIGSYS',
        'SIGQUIT',
        'SIGIOT',
        // should detect profiler and enable/disable accordingly.
        // see #21
        // 'SIGPROF'
      )
    }
    if (process.platform === 'linux') {
      module.exports.push('SIGIO', 'SIGPOLL', 'SIGPWR', 'SIGSTKFLT', 'SIGUNUSED')
    }
  },
})

// node_modules/.pnpm/signal-exit@3.0.7/node_modules/signal-exit/index.js
var require_signal_exit = __commonJS({
  'node_modules/.pnpm/signal-exit@3.0.7/node_modules/signal-exit/index.js'(exports, module) {
    var process2 = global.process
    var processOk = function (process3) {
      return (
        process3 &&
        typeof process3 === 'object' &&
        typeof process3.removeListener === 'function' &&
        typeof process3.emit === 'function' &&
        typeof process3.reallyExit === 'function' &&
        typeof process3.listeners === 'function' &&
        typeof process3.kill === 'function' &&
        typeof process3.pid === 'number' &&
        typeof process3.on === 'function'
      )
    }
    if (!processOk(process2)) {
      module.exports = function () {
        return function () {}
      }
    } else {
      assert = __require('assert')
      signals = require_signals()
      isWin = /^win/i.test(process2.platform)
      EE = __require('events')
      if (typeof EE !== 'function') {
        EE = EE.EventEmitter
      }
      if (process2.__signal_exit_emitter__) {
        emitter = process2.__signal_exit_emitter__
      } else {
        emitter = process2.__signal_exit_emitter__ = new EE()
        emitter.count = 0
        emitter.emitted = {}
      }
      if (!emitter.infinite) {
        emitter.setMaxListeners(Infinity)
        emitter.infinite = true
      }
      module.exports = function (cb, opts) {
        if (!processOk(global.process)) {
          return function () {}
        }
        assert.equal(typeof cb, 'function', 'a callback must be provided for exit handler')
        if (loaded === false) {
          load()
        }
        var ev = 'exit'
        if (opts && opts.alwaysLast) {
          ev = 'afterexit'
        }
        var remove = function () {
          emitter.removeListener(ev, cb)
          if (
            emitter.listeners('exit').length === 0 &&
            emitter.listeners('afterexit').length === 0
          ) {
            unload()
          }
        }
        emitter.on(ev, cb)
        return remove
      }
      unload = function unload2() {
        if (!loaded || !processOk(global.process)) {
          return
        }
        loaded = false
        signals.forEach(function (sig) {
          try {
            process2.removeListener(sig, sigListeners[sig])
          } catch (er) {}
        })
        process2.emit = originalProcessEmit
        process2.reallyExit = originalProcessReallyExit
        emitter.count -= 1
      }
      module.exports.unload = unload
      emit = function emit2(event, code, signal) {
        if (emitter.emitted[event]) {
          return
        }
        emitter.emitted[event] = true
        emitter.emit(event, code, signal)
      }
      sigListeners = {}
      signals.forEach(function (sig) {
        sigListeners[sig] = function listener() {
          if (!processOk(global.process)) {
            return
          }
          var listeners = process2.listeners(sig)
          if (listeners.length === emitter.count) {
            unload()
            emit('exit', null, sig)
            emit('afterexit', null, sig)
            if (isWin && sig === 'SIGHUP') {
              sig = 'SIGINT'
            }
            process2.kill(process2.pid, sig)
          }
        }
      })
      module.exports.signals = function () {
        return signals
      }
      loaded = false
      load = function load2() {
        if (loaded || !processOk(global.process)) {
          return
        }
        loaded = true
        emitter.count += 1
        signals = signals.filter(function (sig) {
          try {
            process2.on(sig, sigListeners[sig])
            return true
          } catch (er) {
            return false
          }
        })
        process2.emit = processEmit
        process2.reallyExit = processReallyExit
      }
      module.exports.load = load
      originalProcessReallyExit = process2.reallyExit
      processReallyExit = function processReallyExit2(code) {
        if (!processOk(global.process)) {
          return
        }
        process2.exitCode = code /* istanbul ignore next */ || 0
        emit('exit', process2.exitCode, null)
        emit('afterexit', process2.exitCode, null)
        originalProcessReallyExit.call(process2, process2.exitCode)
      }
      originalProcessEmit = process2.emit
      processEmit = function processEmit2(ev, arg) {
        if (ev === 'exit' && processOk(global.process)) {
          if (arg !== void 0) {
            process2.exitCode = arg
          }
          var ret = originalProcessEmit.apply(this, arguments)
          emit('exit', process2.exitCode, null)
          emit('afterexit', process2.exitCode, null)
          return ret
        } else {
          return originalProcessEmit.apply(this, arguments)
        }
      }
    }
    var assert
    var signals
    var isWin
    var EE
    var emitter
    var unload
    var emit
    var sigListeners
    var loaded
    var load
    var originalProcessReallyExit
    var processReallyExit
    var originalProcessEmit
    var processEmit
  },
})

// node_modules/.pnpm/proper-lockfile@4.1.2/node_modules/proper-lockfile/lib/mtime-precision.js
var require_mtime_precision = __commonJS({
  'node_modules/.pnpm/proper-lockfile@4.1.2/node_modules/proper-lockfile/lib/mtime-precision.js'(
    exports,
    module,
  ) {
    'use strict'
    var cacheSymbol = /* @__PURE__ */ Symbol()
    function probe(file, fs2, callback) {
      const cachedPrecision = fs2[cacheSymbol]
      if (cachedPrecision) {
        return fs2.stat(file, (err, stat2) => {
          if (err) {
            return callback(err)
          }
          callback(null, stat2.mtime, cachedPrecision)
        })
      }
      const mtime = new Date(Math.ceil(Date.now() / 1e3) * 1e3 + 5)
      fs2.utimes(file, mtime, mtime, (err) => {
        if (err) {
          return callback(err)
        }
        fs2.stat(file, (err2, stat2) => {
          if (err2) {
            return callback(err2)
          }
          const precision = stat2.mtime.getTime() % 1e3 === 0 ? 's' : 'ms'
          Object.defineProperty(fs2, cacheSymbol, { value: precision })
          callback(null, stat2.mtime, precision)
        })
      })
    }
    function getMtime(precision) {
      let now = Date.now()
      if (precision === 's') {
        now = Math.ceil(now / 1e3) * 1e3
      }
      return new Date(now)
    }
    module.exports.probe = probe
    module.exports.getMtime = getMtime
  },
})

// node_modules/.pnpm/proper-lockfile@4.1.2/node_modules/proper-lockfile/lib/lockfile.js
var require_lockfile = __commonJS({
  'node_modules/.pnpm/proper-lockfile@4.1.2/node_modules/proper-lockfile/lib/lockfile.js'(
    exports,
    module,
  ) {
    'use strict'
    var path = __require('path')
    var fs2 = require_graceful_fs()
    var retry = require_retry2()
    var onExit = require_signal_exit()
    var mtimePrecision = require_mtime_precision()
    var locks = {}
    function getLockFile(file, options) {
      return options.lockfilePath || `${file}.lock`
    }
    function resolveCanonicalPath(file, options, callback) {
      if (!options.realpath) {
        return callback(null, path.resolve(file))
      }
      options.fs.realpath(file, callback)
    }
    function acquireLock(file, options, callback) {
      const lockfilePath = getLockFile(file, options)
      options.fs.mkdir(lockfilePath, (err) => {
        if (!err) {
          return mtimePrecision.probe(lockfilePath, options.fs, (err2, mtime, mtimePrecision2) => {
            if (err2) {
              options.fs.rmdir(lockfilePath, () => {})
              return callback(err2)
            }
            callback(null, mtime, mtimePrecision2)
          })
        }
        if (err.code !== 'EEXIST') {
          return callback(err)
        }
        if (options.stale <= 0) {
          return callback(
            Object.assign(new Error('Lock file is already being held'), { code: 'ELOCKED', file }),
          )
        }
        options.fs.stat(lockfilePath, (err2, stat2) => {
          if (err2) {
            if (err2.code === 'ENOENT') {
              return acquireLock(file, { ...options, stale: 0 }, callback)
            }
            return callback(err2)
          }
          if (!isLockStale(stat2, options)) {
            return callback(
              Object.assign(new Error('Lock file is already being held'), {
                code: 'ELOCKED',
                file,
              }),
            )
          }
          removeLock(file, options, (err3) => {
            if (err3) {
              return callback(err3)
            }
            acquireLock(file, { ...options, stale: 0 }, callback)
          })
        })
      })
    }
    function isLockStale(stat2, options) {
      return stat2.mtime.getTime() < Date.now() - options.stale
    }
    function removeLock(file, options, callback) {
      options.fs.rmdir(getLockFile(file, options), (err) => {
        if (err && err.code !== 'ENOENT') {
          return callback(err)
        }
        callback()
      })
    }
    function updateLock(file, options) {
      const lock2 = locks[file]
      if (lock2.updateTimeout) {
        return
      }
      lock2.updateDelay = lock2.updateDelay || options.update
      lock2.updateTimeout = setTimeout(() => {
        lock2.updateTimeout = null
        options.fs.stat(lock2.lockfilePath, (err, stat2) => {
          const isOverThreshold = lock2.lastUpdate + options.stale < Date.now()
          if (err) {
            if (err.code === 'ENOENT' || isOverThreshold) {
              return setLockAsCompromised(file, lock2, Object.assign(err, { code: 'ECOMPROMISED' }))
            }
            lock2.updateDelay = 1e3
            return updateLock(file, options)
          }
          const isMtimeOurs = lock2.mtime.getTime() === stat2.mtime.getTime()
          if (!isMtimeOurs) {
            return setLockAsCompromised(
              file,
              lock2,
              Object.assign(new Error('Unable to update lock within the stale threshold'), {
                code: 'ECOMPROMISED',
              }),
            )
          }
          const mtime = mtimePrecision.getMtime(lock2.mtimePrecision)
          options.fs.utimes(lock2.lockfilePath, mtime, mtime, (err2) => {
            const isOverThreshold2 = lock2.lastUpdate + options.stale < Date.now()
            if (lock2.released) {
              return
            }
            if (err2) {
              if (err2.code === 'ENOENT' || isOverThreshold2) {
                return setLockAsCompromised(
                  file,
                  lock2,
                  Object.assign(err2, { code: 'ECOMPROMISED' }),
                )
              }
              lock2.updateDelay = 1e3
              return updateLock(file, options)
            }
            lock2.mtime = mtime
            lock2.lastUpdate = Date.now()
            lock2.updateDelay = null
            updateLock(file, options)
          })
        })
      }, lock2.updateDelay)
      if (lock2.updateTimeout.unref) {
        lock2.updateTimeout.unref()
      }
    }
    function setLockAsCompromised(file, lock2, err) {
      lock2.released = true
      if (lock2.updateTimeout) {
        clearTimeout(lock2.updateTimeout)
      }
      if (locks[file] === lock2) {
        delete locks[file]
      }
      lock2.options.onCompromised(err)
    }
    function lock(file, options, callback) {
      options = {
        stale: 1e4,
        update: null,
        realpath: true,
        retries: 0,
        fs: fs2,
        onCompromised: (err) => {
          throw err
        },
        ...options,
      }
      options.retries = options.retries || 0
      options.retries =
        typeof options.retries === 'number' ? { retries: options.retries } : options.retries
      options.stale = Math.max(options.stale || 0, 2e3)
      options.update = options.update == null ? options.stale / 2 : options.update || 0
      options.update = Math.max(Math.min(options.update, options.stale / 2), 1e3)
      resolveCanonicalPath(file, options, (err, file2) => {
        if (err) {
          return callback(err)
        }
        const operation = retry.operation(options.retries)
        operation.attempt(() => {
          acquireLock(file2, options, (err2, mtime, mtimePrecision2) => {
            if (operation.retry(err2)) {
              return
            }
            if (err2) {
              return callback(operation.mainError())
            }
            const lock2 = (locks[file2] = {
              lockfilePath: getLockFile(file2, options),
              mtime,
              mtimePrecision: mtimePrecision2,
              options,
              lastUpdate: Date.now(),
            })
            updateLock(file2, options)
            callback(null, (releasedCallback) => {
              if (lock2.released) {
                return (
                  releasedCallback &&
                  releasedCallback(
                    Object.assign(new Error('Lock is already released'), { code: 'ERELEASED' }),
                  )
                )
              }
              unlock(file2, { ...options, realpath: false }, releasedCallback)
            })
          })
        })
      })
    }
    function unlock(file, options, callback) {
      options = {
        fs: fs2,
        realpath: true,
        ...options,
      }
      resolveCanonicalPath(file, options, (err, file2) => {
        if (err) {
          return callback(err)
        }
        const lock2 = locks[file2]
        if (!lock2) {
          return callback(
            Object.assign(new Error('Lock is not acquired/owned by you'), { code: 'ENOTACQUIRED' }),
          )
        }
        lock2.updateTimeout && clearTimeout(lock2.updateTimeout)
        lock2.released = true
        delete locks[file2]
        removeLock(file2, options, callback)
      })
    }
    function check(file, options, callback) {
      options = {
        stale: 1e4,
        realpath: true,
        fs: fs2,
        ...options,
      }
      options.stale = Math.max(options.stale || 0, 2e3)
      resolveCanonicalPath(file, options, (err, file2) => {
        if (err) {
          return callback(err)
        }
        options.fs.stat(getLockFile(file2, options), (err2, stat2) => {
          if (err2) {
            return err2.code === 'ENOENT' ? callback(null, false) : callback(err2)
          }
          return callback(null, !isLockStale(stat2, options))
        })
      })
    }
    function getLocks() {
      return locks
    }
    onExit(() => {
      for (const file in locks) {
        const options = locks[file].options
        try {
          options.fs.rmdirSync(getLockFile(file, options))
        } catch (e) {}
      }
    })
    module.exports.lock = lock
    module.exports.unlock = unlock
    module.exports.check = check
    module.exports.getLocks = getLocks
  },
})

// node_modules/.pnpm/proper-lockfile@4.1.2/node_modules/proper-lockfile/lib/adapter.js
var require_adapter = __commonJS({
  'node_modules/.pnpm/proper-lockfile@4.1.2/node_modules/proper-lockfile/lib/adapter.js'(
    exports,
    module,
  ) {
    'use strict'
    var fs2 = require_graceful_fs()
    function createSyncFs(fs3) {
      const methods = ['mkdir', 'realpath', 'stat', 'rmdir', 'utimes']
      const newFs = { ...fs3 }
      methods.forEach((method) => {
        newFs[method] = (...args) => {
          const callback = args.pop()
          let ret
          try {
            ret = fs3[`${method}Sync`](...args)
          } catch (err) {
            return callback(err)
          }
          callback(null, ret)
        }
      })
      return newFs
    }
    function toPromise(method) {
      return (...args) =>
        new Promise((resolve5, reject) => {
          args.push((err, result) => {
            if (err) {
              reject(err)
            } else {
              resolve5(result)
            }
          })
          method(...args)
        })
    }
    function toSync(method) {
      return (...args) => {
        let err
        let result
        args.push((_err, _result) => {
          err = _err
          result = _result
        })
        method(...args)
        if (err) {
          throw err
        }
        return result
      }
    }
    function toSyncOptions(options) {
      options = { ...options }
      options.fs = createSyncFs(options.fs || fs2)
      if (
        (typeof options.retries === 'number' && options.retries > 0) ||
        (options.retries &&
          typeof options.retries.retries === 'number' &&
          options.retries.retries > 0)
      ) {
        throw Object.assign(new Error('Cannot use retries with the sync api'), { code: 'ESYNC' })
      }
      return options
    }
    module.exports = {
      toPromise,
      toSync,
      toSyncOptions,
    }
  },
})

// node_modules/.pnpm/proper-lockfile@4.1.2/node_modules/proper-lockfile/index.js
var require_proper_lockfile = __commonJS({
  'node_modules/.pnpm/proper-lockfile@4.1.2/node_modules/proper-lockfile/index.js'(
    exports,
    module,
  ) {
    'use strict'
    var lockfile3 = require_lockfile()
    var { toPromise, toSync, toSyncOptions } = require_adapter()
    async function lock(file, options) {
      const release = await toPromise(lockfile3.lock)(file, options)
      return toPromise(release)
    }
    function lockSync(file, options) {
      const release = toSync(lockfile3.lock)(file, toSyncOptions(options))
      return toSync(release)
    }
    function unlock(file, options) {
      return toPromise(lockfile3.unlock)(file, options)
    }
    function unlockSync(file, options) {
      return toSync(lockfile3.unlock)(file, toSyncOptions(options))
    }
    function check(file, options) {
      return toPromise(lockfile3.check)(file, options)
    }
    function checkSync(file, options) {
      return toSync(lockfile3.check)(file, toSyncOptions(options))
    }
    module.exports = lock
    module.exports.lock = lock
    module.exports.unlock = unlock
    module.exports.lockSync = lockSync
    module.exports.unlockSync = unlockSync
    module.exports.check = check
    module.exports.checkSync = checkSync
  },
})

// src/cli/lib/autoUpdate.ts
import {
  mkdirSync as mkdirSync2,
  renameSync as renameSync2,
  rmSync as rmSync2,
  writeFileSync as writeFileSync2,
} from 'node:fs'
import { dirname as dirname3 } from 'node:path'
function isAutoUpdateConsentGranted(consent) {
  return consent.schemaVersion === 1 && consent.autoUpdate === true
}
function mapSelfUpdateFailureReason(message) {
  const text = message.toLowerCase()
  if (
    text.includes('integrity') ||
    text.includes('signature') ||
    text.includes('sha256') ||
    text.includes('ed25519')
  )
    return 'integrity'
  if (text.includes('smoke') || text.includes('--version')) return 'smoke'
  if (
    text.includes('swap') ||
    text.includes('rollback') ||
    text.includes('rename') ||
    text.includes('binary aside')
  )
    return 'swap'
  if (text.includes('handover') || text.includes('owned-state')) return 'handover'
  return 'network'
}
function isCriticalOutcome(outcome) {
  return outcome.critical === true || outcome.message.startsWith('CRITICAL')
}
function disableAutoUpdateConsent(path) {
  const { document } = readUpdateReminderPreferencesFile(path)
  const next = document ? { ...document } : { schemaVersion: 1, enabled: true }
  next.autoUpdate = false
  mkdirSync2(dirname3(path), { recursive: true })
  const temporary = `${path}.${process.pid}.tmp`
  try {
    writeFileSync2(
      temporary,
      `${JSON.stringify(next, null, 2)}
`,
      'utf8',
    )
    renameSync2(temporary, path)
  } catch (error) {
    try {
      rmSync2(temporary, { force: true })
    } catch {}
    throw error
  }
}
function quotaBlocked(status, version, now) {
  if (!status) return false
  const entries = status.lastResult ? [...status.history, status.lastResult] : status.history
  return entries.some((entry) => {
    if (entry.version !== version) return false
    if (entry.status !== 'failed') return false
    if ((entry.message ?? '').startsWith(AUTO_UPDATE_RESUMABLE_MARKER)) return false
    return Math.abs(now - entry.at) < AUTO_UPDATE_FAILURE_QUOTA_MS
  })
}
function baseStatus(deps, preferences, channel, installed2, version) {
  const now = deps.now()
  return {
    schemaVersion: 1,
    consent: { autoUpdate: preferences.autoUpdate, enabled: preferences.enabled },
    channel,
    installed: installed2,
    latest: version,
    state: 'idle',
    progress: { received: 0, total: 0, updatedAt: now },
    lastResult: null,
    history: [],
    notice: null,
  }
}
function persist(deps, preferences, channel, installed2, version, patch) {
  const existing = deps.readStatus()
  const base = existing ?? baseStatus(deps, preferences, channel, installed2, version)
  let next = {
    ...base,
    consent: { autoUpdate: preferences.autoUpdate, enabled: preferences.enabled },
    channel,
    installed: installed2,
    latest: version,
    state: patch.state ?? base.state,
  }
  if (patch.result) next = appendAutoUpdateHistory(next, patch.result)
  if (patch.notice) next = { ...next, notice: patch.notice }
  deps.writeStatus(next)
  return next
}
async function runAutoUpdate(deps, options) {
  const version = options.targetVersion
  const preferences = deps.readPreferences()
  if (!isAutoUpdateConsentGranted(preferences)) {
    return { status: 'skipped', reason: 'consent-off', version }
  }
  const channel = deps.channel()
  const installed2 = deps.installedVersion()
  if (channel !== 'binary') {
    persist(deps, preferences, channel, installed2, version, {
      state: 'skipped',
      result: { version, status: 'skipped', reason: 'npm-channel', at: deps.now() },
    })
    return { status: 'skipped', reason: 'npm-channel', version }
  }
  if (quotaBlocked(deps.readStatus(), version, deps.now())) {
    deps.log(`auto-update: ${version} already failed once in the last 24h \u2014 skipping`)
    return { status: 'skipped', reason: 'rate-limited', version }
  }
  const execPath = deps.target()
  if (!(await deps.execDirWritable(execPath))) {
    const message = `the directory of ${execPath} is not writable \u2014 the binary cannot be replaced`
    persist(deps, preferences, channel, installed2, version, {
      state: 'failed',
      result: { version, status: 'failed', reason: 'exec-dir-readonly', message, at: deps.now() },
    })
    return { status: 'error', reason: 'exec-dir-readonly', message, version }
  }
  const stateRoot = deps.context().platform.stateRoot
  let locked
  try {
    locked = await deps.withLock({ stateRoot, target: execPath }, () =>
      runLockedRound(deps, {
        preferences,
        channel,
        installed: installed2,
        version,
      }),
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    persist(deps, preferences, channel, installed2, version, {
      state: 'failed',
      result: {
        version,
        status: 'failed',
        reason: 'exec-dir-readonly',
        message: `could not take the update lock: ${message}`,
        at: deps.now(),
      },
    })
    return { status: 'error', reason: 'exec-dir-readonly', message, version }
  }
  if (locked.status === 'busy') {
    persist(deps, preferences, channel, installed2, version, {
      state: 'skipped',
      result: { version, status: 'skipped', reason: 'busy', at: deps.now() },
    })
    return { status: 'skipped', reason: 'busy', version }
  }
  return locked.value
}
async function runLockedRound(deps, input) {
  const { preferences, channel, installed: installed2, version } = input
  if (quotaBlocked(deps.readStatus(), version, deps.now())) {
    return { status: 'skipped', reason: 'rate-limited', version }
  }
  persist(deps, preferences, channel, installed2, version, { state: 'downloading' })
  let outcome
  try {
    outcome = await deps.selfUpdate()
  } catch (error) {
    const message2 = error instanceof Error ? error.message : String(error)
    persist(deps, preferences, channel, installed2, version, {
      state: 'failed',
      result: { version, status: 'failed', reason: 'network', message: message2, at: deps.now() },
    })
    return { status: 'error', reason: 'network', message: message2, version }
  }
  if (outcome.status === 'updated') {
    const from = outcome.from
    const to = outcome.to
    persist(deps, preferences, channel, installed2, version, {
      state: 'updated',
      result: { version: to, status: 'updated', at: deps.now() },
    })
    persist(deps, preferences, channel, installed2, version, {
      notice: { from, to: '', changelog: '', restart: '', at: deps.now(), consumedAt: 0 },
    })
    const handover = await deps.handover({ from, to, statusPath: deps.statusPath() })
    if (!handover.ok) {
      const message2 = handover.error ?? 'the owned-state handover failed'
      persist(deps, preferences, channel, installed2, version, {
        state: 'updated',
        result: {
          version: to,
          status: 'updated',
          reason: 'handover',
          message: message2,
          at: deps.now(),
        },
      })
      return { status: 'updated', reason: 'handover', message: message2, version: to }
    }
    persist(deps, preferences, channel, installed2, version, { state: 'updated' })
    return { status: 'updated', version: to }
  }
  if (outcome.status === 'current') {
    persist(deps, preferences, channel, installed2, version, {
      state: 'skipped',
      result: { version, status: 'skipped', at: deps.now() },
    })
    return { status: 'skipped', reason: 'current', version }
  }
  if (outcome.status === 'refused') {
    const message2 = outcome.reason
    persist(deps, preferences, channel, installed2, version, {
      state: 'skipped',
      result: {
        version,
        status: 'skipped',
        reason: 'npm-channel',
        message: message2,
        at: deps.now(),
      },
    })
    return { status: 'skipped', reason: 'npm-channel', message: message2, version }
  }
  if (outcome.status === 'checked' || outcome.status === 'dry-run') {
    persist(deps, preferences, channel, installed2, version, {
      state: 'skipped',
      result: { version, status: 'skipped', at: deps.now() },
    })
    return { status: 'skipped', reason: 'current', version }
  }
  const critical = isCriticalOutcome(outcome)
  const reason = critical ? 'swap-critical' : mapSelfUpdateFailureReason(outcome.message)
  const resumable = outcome.progressed === true
  const message = resumable ? `${AUTO_UPDATE_RESUMABLE_MARKER} ${outcome.message}` : outcome.message
  persist(deps, preferences, channel, installed2, version, {
    state: 'failed',
    result: { version, status: 'failed', reason, message, at: deps.now() },
  })
  if (critical) {
    try {
      disableAutoUpdateConsent(deps.preferencesPath())
    } catch (error) {
      deps.log(
        `auto-update: could not turn the auto-update consent off: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }
  return { status: 'error', reason, message: outcome.message, version }
}
var AUTO_UPDATE_FAILURE_QUOTA_MS
var init_autoUpdate = __esm({
  'src/cli/lib/autoUpdate.ts'() {
    'use strict'
    init_autoUpdateStatus()
    init_updateReminderPreferences()
    AUTO_UPDATE_FAILURE_QUOTA_MS = 24 * 60 * 60 * 1e3
  },
})

// src/platform/packagePath.ts
var init_packagePath = __esm({
  'src/platform/packagePath.ts'() {
    'use strict'
  },
})

// src/platform/platform.ts
import { existsSync, readFileSync as readFileSync3 } from 'node:fs'
import { homedir as homedir2 } from 'node:os'
import { join as join4 } from 'node:path'
function claudeDescriptor(home = homedir2()) {
  const claudeHome = join4(home, '.claude')
  return {
    id: 'claude',
    homeDir: claudeHome,
    stateRoot: join4(claudeHome, 'harnessed'),
    settingsPath: join4(claudeHome, 'settings.json'),
    skillsDir: join4(claudeHome, 'skills'),
    commandsDir: join4(claudeHome, 'commands'),
    pluginsRegistry: join4(claudeHome, 'plugins', 'installed_plugins.json'),
    // mcpConfigPath is a SIBLING of `.claude` (`<home>/.claude.json`), based on
    // the same home base — not a child of homeDir.
    mcpConfigPath: join4(home, '.claude.json'),
    // claude writes its env keys into JSON settings.json (capability present).
    supportsEnvKeyWrite: true,
    // Claude Code exposes the active session id to Bash-invoked CLI + hooks.
    sessionIdEnv: 'CLAUDE_CODE_SESSION_ID',
  }
}
function codexDescriptor(home = homedir2()) {
  const codexHome = join4(home, '.codex')
  const configToml = join4(codexHome, 'config.toml')
  return {
    id: 'codex',
    homeDir: codexHome,
    stateRoot: join4(codexHome, 'harnessed'),
    settingsPath: null,
    // SHARED convention dir, NOT <homeDir>/skills.
    skillsDir: join4(home, '.agents', 'skills'),
    commandsDir: join4(codexHome, 'prompts'),
    pluginsRegistry: null,
    mcpConfigPath: configToml,
    supportsEnvKeyWrite: false,
    // Measured on codex-cli 0.154: codex shells carry it, equal to hook session_id.
    sessionIdEnv: 'CODEX_SESSION_ID',
  }
}
function isHostId(id) {
  return HOST_IDS.includes(id)
}
function descriptorFor(id, home = homedir2()) {
  return id === 'codex' ? codexDescriptor(home) : claudeDescriptor(home)
}
function configuredHome(envVar) {
  const value = process.env[envVar]?.trim()
  return value || void 0
}
function descriptorForConfiguredHome(id, home = homedir2()) {
  const descriptor = descriptorFor(id, home)
  const nativeHome = configuredHome(id === 'codex' ? 'CODEX_HOME' : 'CLAUDE_CONFIG_DIR')
  if (nativeHome === void 0) return descriptor
  if (id === 'codex') {
    return {
      ...descriptor,
      homeDir: nativeHome,
      stateRoot: join4(nativeHome, 'harnessed'),
      commandsDir: join4(nativeHome, 'prompts'),
      mcpConfigPath: join4(nativeHome, 'config.toml'),
    }
  }
  return {
    ...descriptor,
    homeDir: nativeHome,
    stateRoot: join4(nativeHome, 'harnessed'),
    settingsPath: join4(nativeHome, 'settings.json'),
    skillsDir: join4(nativeHome, 'skills'),
    commandsDir: join4(nativeHome, 'commands'),
    pluginsRegistry: join4(nativeHome, 'plugins', 'installed_plugins.json'),
  }
}
function detectPlatform(home = homedir2()) {
  const resolved = resolveHost(home)
  const override = process.env.HARNESSED_ROOT_OVERRIDE
  if (override !== void 0 && override !== '') return { ...resolved, stateRoot: override }
  return resolved
}
function resolveHost(home) {
  return resolveHostWithReason(home).descriptor
}
function resolveHostWithReason(home = homedir2()) {
  const claudeHome = configuredHome('CLAUDE_CONFIG_DIR')
  const codexHome = configuredHome('CODEX_HOME')
  const envPlatform = process.env.HARNESSED_PLATFORM?.trim()
  const explicitHost = envPlatform !== void 0 && isHostId(envPlatform) ? envPlatform : void 0
  if (explicitHost === void 0 && claudeHome !== void 0 && codexHome !== void 0) {
    throw new Error('both CLAUDE_CONFIG_DIR and CODEX_HOME are set; pass --platform claude|codex')
  }
  const base = descriptorForConfiguredHome('claude', home)
  const codex = descriptorForConfiguredHome('codex', home)
  const skipped = []
  if (envPlatform !== void 0 && envPlatform !== '') {
    const d = isHostId(envPlatform) ? descriptorForConfiguredHome(envPlatform, home) : void 0
    if (d) {
      return {
        descriptor: d,
        reason: { kind: 'env-platform', envVar: 'HARNESSED_PLATFORM', value: envPlatform },
        skipped,
      }
    }
    skipped.push({ kind: 'env-platform-unknown', envVar: 'HARNESSED_PLATFORM', value: envPlatform })
  }
  if (claudeHome !== void 0 || codexHome !== void 0) {
    const id = claudeHome !== void 0 ? 'claude' : 'codex'
    return {
      descriptor: id === 'claude' ? base : codex,
      reason: {
        kind: 'env-platform',
        envVar: id === 'claude' ? 'CLAUDE_CONFIG_DIR' : 'CODEX_HOME',
        value: id === 'claude' ? claudeHome : codexHome,
      },
      skipped,
    }
  }
  const inClaude = Boolean(process.env.CLAUDE_CODE_SESSION_ID?.trim())
  const inCodex = Boolean(process.env.CODEX_SESSION_ID?.trim())
  if (inClaude !== inCodex) {
    return {
      descriptor: inClaude ? base : codex,
      reason: {
        kind: 'host-session-env',
        envVar: inClaude ? 'CLAUDE_CODE_SESSION_ID' : 'CODEX_SESSION_ID',
      },
      skipped,
    }
  }
  if (inClaude && inCodex) skipped.push({ kind: 'host-session-env-ambiguous' })
  for (const pinRoot of [codex.stateRoot, base.stateRoot]) {
    const pinPath = join4(pinRoot, '.platform')
    try {
      const value = readFileSync3(pinPath, 'utf8').trim()
      const d = isHostId(value) ? descriptorForConfiguredHome(value, home) : void 0
      if (d) return { descriptor: d, reason: { kind: 'platform-pin', pinPath, value }, skipped }
      skipped.push({ kind: 'platform-pin-unknown', pinPath, value })
    } catch {}
  }
  try {
    if (existsSync(base.homeDir)) {
      return {
        descriptor: base,
        reason: { kind: 'directory-probe', probedDir: base.homeDir },
        skipped,
      }
    }
    if (existsSync(codex.homeDir)) {
      return {
        descriptor: codex,
        reason: { kind: 'directory-probe', probedDir: codex.homeDir },
        skipped,
      }
    }
  } catch {}
  return { descriptor: base, reason: { kind: 'fallback' }, skipped }
}
var HOST_IDS
var init_platform = __esm({
  'src/platform/platform.ts'() {
    'use strict'
    HOST_IDS = ['claude', 'codex']
  },
})

// src/platform/assetsRoot.ts
function isCompiledRuntime(url = import.meta.url) {
  return isCompiledModuleUrl(url)
}
function isCompiledModuleUrl(url) {
  let s = url
  try {
    s = decodeURIComponent(url)
  } catch {}
  const normalized2 = s.replace(/\\/g, '/').toLowerCase()
  return BUNFS_MARKERS.some((m) => normalized2.includes(m))
}
var BUNFS_MARKERS
var init_assetsRoot = __esm({
  'src/platform/assetsRoot.ts'() {
    'use strict'
    init_packagePath()
    init_platform()
    BUNFS_MARKERS = ['/$bunfs/', '/~bun/']
  },
})

// src/platform/runtime.ts
function isBunRuntime(versions = process.versions, compiled) {
  return (
    typeof versions.bun === 'string' &&
    versions.bun.trim().length > 0 &&
    !(compiled ?? isCompiledRuntime())
  )
}
function bunExecutable() {
  return isBunRuntime() ? process.execPath : process.platform === 'win32' ? 'bun.exe' : 'bun'
}
var init_runtime = __esm({
  'src/platform/runtime.ts'() {
    'use strict'
    init_assetsRoot()
  },
})

// src/cli/lib/version-check.ts
var version_check_exports = {}
__export(version_check_exports, {
  compareVersionNames: () => compareVersionNames,
  compareVersions: () => compareVersions,
  fetchLatestBunVersion: () => fetchLatestBunVersion,
  fetchLatestNpmVersion: () => fetchLatestNpmVersion,
  fetchLatestVersion: () => fetchLatestVersion,
})
import { exec, execFile } from 'node:child_process'
import { promisify } from 'node:util'
function parse(v) {
  const m = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/.exec(v.trim())
  if (!m) return null
  return { nums: [Number(m[1]), Number(m[2]), Number(m[3])], pre: m[4] ?? null }
}
function compareVersions(installed2, latest) {
  const a = parse(installed2)
  const b = parse(latest)
  if (!a || !b) return 'unknown'
  for (let i = 0; i < 3; i++) {
    const ai = a.nums[i] ?? 0
    const bi = b.nums[i] ?? 0
    if (ai < bi) return 'behind'
    if (ai > bi) return 'ahead'
  }
  if (a.pre && !b.pre) return 'behind'
  if (!a.pre && b.pre) return 'ahead'
  if (a.pre && b.pre && a.pre !== b.pre) return a.pre < b.pre ? 'behind' : 'ahead'
  return 'current'
}
function compareVersionNames(a, b) {
  const relation = compareVersions(a, b)
  if (relation === 'ahead') return 1
  if (relation === 'behind') return -1
  if (relation === 'current') return 0
  const segments = (v) =>
    v.split('.').map((part) => {
      const n = Number.parseInt(part, 10)
      return Number.isNaN(n) ? 0 : n
    })
  const as = segments(a)
  const bs = segments(b)
  for (let i = 0; i < Math.max(as.length, bs.length); i++) {
    const diff = (as[i] ?? 0) - (bs[i] ?? 0)
    if (diff !== 0) return diff
  }
  return 0
}
function npmExecutable() {
  return process.platform === 'win32' ? 'npm.cmd' : 'npm'
}
async function defaultRunner() {
  if (process.platform === 'win32') {
    const { stdout: stdout2 } = await execAsync('npm view harnessed version', {
      timeout: 8e3,
      windowsHide: true,
    })
    return stdout2
  }
  const { stdout } = await execFileAsync(npmExecutable(), ['view', 'harnessed', 'version'], {
    timeout: 8e3,
    windowsHide: true,
  })
  return stdout
}
async function fetchLatestVersion(runner) {
  try {
    if (runner !== void 0) return await fetchLatestNpmVersion(runner)
    return isBunRuntime() ? await fetchLatestBunVersion() : await fetchLatestNpmVersion()
  } catch {
    return null
  }
}
async function fetchLatestNpmVersion(runner = defaultRunner) {
  try {
    const out = (await runner()).trim()
    return /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(out) ? out : null
  } catch {
    return null
  }
}
async function defaultBunRunner() {
  const { stdout } = await execFileAsync(
    bunExecutable(),
    ['info', 'harnessed@latest', 'version', '--json'],
    { timeout: 8e3, windowsHide: true, shell: false },
  )
  return stdout
}
async function fetchLatestBunVersion(runner = defaultBunRunner) {
  try {
    const version = JSON.parse(await runner())
    return typeof version === 'string' && /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version)
      ? version
      : null
  } catch {
    return null
  }
}
var execFileAsync, execAsync
var init_version_check = __esm({
  'src/cli/lib/version-check.ts'() {
    'use strict'
    init_runtime()
    execFileAsync = promisify(execFile)
    execAsync = promisify(exec)
  },
})

// src/platform/hostInstallContext.ts
var hostInstallContext_exports = {}
__export(hostInstallContext_exports, {
  captureHostInstallContext: () => captureHostInstallContext,
  createHostInstallContext: () => createHostInstallContext,
})
import { homedir as homedir3 } from 'node:os'
function createHostInstallContext(platform, selection) {
  if (platform.id !== 'claude' && platform.id !== 'codex') {
    throw new Error(`unsupported host: ${platform.id}`)
  }
  const nativeHome = platform.id === 'codex' ? selection.nativeHome?.trim() : selection.nativeHome
  const neutralSpawnCwd = selection.neutralSpawnCwd?.trim()
  return Object.freeze({
    hostId: platform.id,
    os: selection.os,
    userHome: selection.userHome,
    platform: Object.freeze({ ...platform }),
    nativeHome: nativeHome || platform.homeDir,
    ...(neutralSpawnCwd ? { neutralSpawnCwd } : {}),
  })
}
function captureHostInstallContext(options = {}) {
  if (options.hostId !== void 0 && !isHostId(options.hostId)) {
    throw new Error(`unsupported host: ${options.hostId}`)
  }
  const userHome = options.userHome ?? homedir3()
  const platformEnv = process.env.HARNESSED_PLATFORM?.trim()
  const explicitHost =
    options.hostId ?? (platformEnv !== void 0 && isHostId(platformEnv) ? platformEnv : void 0)
  const hostId = explicitHost ?? detectPlatform(userHome).id
  if (!isHostId(hostId)) throw new Error(`unsupported host: ${hostId}`)
  const platform = descriptorForConfiguredHome(hostId, userHome)
  const rootKey = platform.id === 'codex' ? 'CODEX_HOME' : 'CLAUDE_CONFIG_DIR'
  const nativeHome = process.env[rootKey]?.trim() || platform.homeDir
  return createHostInstallContext(platform, {
    os: options.os ?? process.platform,
    userHome,
    nativeHome,
    neutralSpawnCwd: process.env.HARNESSED_SPAWN_CWD,
  })
}
var init_hostInstallContext = __esm({
  'src/platform/hostInstallContext.ts'() {
    'use strict'
    init_platform()
  },
})

// src/installers/lib/killTree.ts
import { spawnSync } from 'node:child_process'
function descendantsOf(pid) {
  const r = spawnSync('pgrep', ['-P', String(pid)], { encoding: 'utf8', timeout: 2e3 })
  if (r.status !== 0 || typeof r.stdout !== 'string') return []
  const out = []
  for (const tok of r.stdout.split(/\s+/)) {
    const child = Number(tok)
    if (Number.isInteger(child) && child > 0) out.push(child, ...descendantsOf(child))
  }
  return out
}
function killProcessTree(child) {
  const pid = child.pid
  if (pid === void 0) {
    child.kill('SIGKILL')
    return
  }
  if (process.platform === 'win32') {
    const r = spawnSync('taskkill', ['/PID', String(pid), '/T', '/F'], {
      windowsHide: true,
      stdio: 'ignore',
      timeout: 5e3,
    })
    if (r.status === 0) return
    child.kill('SIGKILL')
    return
  }
  const tree = descendantsOf(pid)
  child.kill('SIGKILL')
  for (const d of tree) {
    try {
      process.kill(d, 'SIGKILL')
    } catch {}
  }
}
var init_killTree = __esm({
  'src/installers/lib/killTree.ts'() {
    'use strict'
  },
})

// src/installers/lib/winSpawn.ts
import { win32 } from 'node:path'
var extname, join5
var init_winSpawn = __esm({
  'src/installers/lib/winSpawn.ts'() {
    'use strict'
    ;({ extname, join: join5 } = win32)
  },
})

// src/installers/lib/runClaudeArgs.ts
function withHostInstallEnv(env, hostContext) {
  if (!hostContext) return env
  const pins = {
    HOME: hostContext.userHome,
    USERPROFILE: hostContext.userHome,
    HARNESSED_PLATFORM: hostContext.hostId,
    HARNESSED_ROOT_OVERRIDE: hostContext.platform.stateRoot,
    HARNESSED_SPAWN_CWD: hostContext.neutralSpawnCwd ?? '',
    [hostContext.hostId === 'codex' ? 'CODEX_HOME' : 'CLAUDE_CONFIG_DIR']: hostContext.nativeHome,
  }
  const result = { ...env }
  if (hostContext.os === 'win32') {
    for (const key of Object.keys(result)) {
      if (Object.hasOwn(pins, key.toUpperCase())) delete result[key]
    }
  }
  return { ...result, ...pins }
}
var init_runClaudeArgs = __esm({
  'src/installers/lib/runClaudeArgs.ts'() {
    'use strict'
    init_killTree()
    init_winSpawn()
  },
})

// src/cli/lib/proxyDispatcher.ts
function hasProxyEnv() {
  return PROXY_VARS.some((k) => (process.env[k] ?? '').trim() !== '')
}
async function ensureProxyDispatcher(deps = {}) {
  if (installed) return 'already'
  if (!hasProxyEnv()) return 'no-proxy-env'
  const isCompiled = deps.isCompiled ?? (() => isCompiledRuntime())
  if (isCompiled()) return 'native-runtime'
  const load =
    deps.loadUndici ??
    (async () => {
      const spec = 'undici'
      return await import(spec)
    })
  try {
    const mod = await load()
    const Agent = mod.EnvHttpProxyAgent
    const setGlobalDispatcher = mod.setGlobalDispatcher
    if (typeof Agent !== 'function' || typeof setGlobalDispatcher !== 'function') {
      return 'unavailable'
    }
    setGlobalDispatcher(new Agent())
    installed = true
    return 'installed'
  } catch {
    return 'unavailable'
  }
}
var PROXY_VARS, installed
var init_proxyDispatcher = __esm({
  'src/cli/lib/proxyDispatcher.ts'() {
    'use strict'
    init_assetsRoot()
    PROXY_VARS = ['HTTP_PROXY', 'http_proxy', 'HTTPS_PROXY', 'https_proxy', 'ALL_PROXY']
    installed = false
  },
})

// src/cli/lib/updateSignature.ts
import { createPublicKey, verify as edVerify } from 'node:crypto'
function verifyShaSignature(shaText, sigBase64, publicKeyPem = HARNESSED_RELEASE_PUBKEY_PEM) {
  try {
    const sig = Buffer.from(sigBase64.trim(), 'base64')
    if (sig.length === 0) return false
    return edVerify(null, Buffer.from(shaText, 'utf8'), createPublicKey(publicKeyPem), sig)
  } catch {
    return false
  }
}
var HARNESSED_RELEASE_PUBKEY_PEM
var init_updateSignature = __esm({
  'src/cli/lib/updateSignature.ts'() {
    'use strict'
    HARNESSED_RELEASE_PUBKEY_PEM = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAgCsfkZ+uCRNIBSHGfiOzp+TCSwQqOVJW1tsCW/beF4g=
-----END PUBLIC KEY-----
`
  },
})

// src/cli/lib/selfUpdateBinary.ts
var selfUpdateBinary_exports = {}
__export(selfUpdateBinary_exports, {
  RELEASES_LATEST_URL: () => RELEASES_LATEST_URL,
  assetNameFor: () => assetNameFor,
  execDirWritable: () => execDirWritable,
  finalizeBinarySelfUpdate: () => finalizeBinarySelfUpdate,
  realSelfUpdateDeps: () => realSelfUpdateDeps,
  resolveLatestRelease: () => resolveLatestRelease,
  runBinaryRollback: () => runBinaryRollback,
  runBinarySelfUpdate: () => runBinarySelfUpdate,
})
import { createHash } from 'node:crypto'
import { createWriteStream } from 'node:fs'
import {
  access,
  chmod,
  copyFile as fsCopyFile,
  rename as fsRename,
  unlink as fsUnlink,
  mkdir,
  readdir,
  readFile,
  stat,
} from 'node:fs/promises'
import { basename, dirname as dirname4, join as join6 } from 'node:path'
import { Readable, Transform } from 'node:stream'
import { pipeline } from 'node:stream/promises'
function assetNameFor(platform, arch) {
  const plat = { win32: 'windows', darwin: 'darwin', linux: 'linux' }[platform] ?? platform
  const ext = platform === 'win32' ? '.exe' : ''
  return `harnessed-${plat}-${arch}${ext}`
}
function normalized(p) {
  return p.replace(/\\/g, '/')
}
function downloadFailureMessage(error, version, url) {
  const detail = error instanceof Error ? error.message : String(error)
  const target = version ? ` for release v${version}` : ''
  return `download failed${target}${url ? ` (tried ${url})` : ''}: ${detail} \u2014 the original binary was left untouched; if the network blocks GitHub, use the npm channel (\`npm i -g harnessed@latest\`) or a local build via \`HARNESSED_UPDATE_SOURCE_DIR=<dir> harnessed update\``
}
async function sha256File(p) {
  const buf = await readFile(p)
  return createHash('sha256').update(buf).digest('hex')
}
function parseShaText(text) {
  const m = /^([0-9a-fA-F]{64})\b/.exec(text.trim())
  return m?.[1]?.toLowerCase() ?? null
}
async function runBinarySelfUpdate(deps, opts) {
  const rename = deps.fsOps?.rename ?? fsRename
  const copyFile = deps.fsOps?.copyFile ?? fsCopyFile
  const unlink = deps.fsOps?.unlink ?? fsUnlink
  if (normalized(deps.execPath).includes('/node_modules/')) {
    return { status: 'refused', reason: 'binary lives under node_modules (npm-managed)' }
  }
  const asset = assetNameFor(deps.platform, deps.arch)
  const execDir = dirname4(deps.execPath)
  const execBase = basename(deps.execPath)
  const ext = deps.platform === 'win32' ? '.exe' : ''
  const tempPath = join6(execDir, `.harnessed-update-${deps.pid}${ext}`)
  const bakPath = join6(execDir, `${execBase}.bak-${deps.currentVersion}`)
  let targetVersion = null
  let assetUrl = null
  let shaUrl = null
  let sigUrl = null
  let assetFallbackUrl
  let shaFallbackUrl
  let sigFallbackUrl
  let sourceAsset = null
  let sourceSha = null
  if (deps.sourceDir) {
    sourceAsset = join6(deps.sourceDir, asset)
    sourceSha = join6(deps.sourceDir, `${asset}.sha256`)
    if (opts.check) {
      try {
        const version = (await deps.smoke(sourceAsset)).trim()
        if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(version)) {
          throw new Error(`--version smoke returned unexpected output: ${version.slice(0, 80)}`)
        }
        return {
          status: 'checked',
          installed: deps.currentVersion,
          latest: version,
          cmp: compareVersions(deps.currentVersion, version),
        }
      } catch (e) {
        return {
          status: 'error',
          message: `could not check the local binary version: ${e.message}`,
        }
      }
    }
  } else {
    const rel = await deps.resolveRelease()
    if (rel === null) {
      return {
        status: 'error',
        message:
          'could not resolve the latest release from GitHub (no release information returned) \u2014 use the npm channel (`npm i -g harnessed@latest`), or point `HARNESSED_UPDATE_SOURCE_DIR=<dir>` at a local build and re-run `harnessed update`',
      }
    }
    if ('error' in rel) {
      const publishing = rel.kind === void 0 || rel.kind === 'publishing'
      const remedy = publishing
        ? 'the release may still be publishing (retry in a few minutes) or use the npm channel (`npm i -g harnessed@latest`)'
        : 'the original binary was left untouched; use the npm channel (`npm i -g harnessed@latest`) or point `HARNESSED_UPDATE_SOURCE_DIR=<dir>` at a local build and re-run `harnessed update`'
      return { status: 'error', message: `${rel.error} \u2014 ${remedy}` }
    }
    targetVersion = rel.version
    assetUrl = rel.assetUrl
    shaUrl = rel.shaUrl
    sigUrl = rel.sigUrl ?? null
    assetFallbackUrl = rel.assetFallbackUrl
    shaFallbackUrl = rel.shaFallbackUrl
    sigFallbackUrl = rel.sigFallbackUrl
    if (opts.check) {
      return {
        status: 'checked',
        installed: deps.currentVersion,
        latest: rel.version,
        cmp: compareVersions(deps.currentVersion, rel.version),
      }
    }
    const cmp = compareVersions(deps.currentVersion, rel.version)
    if (cmp !== 'behind') {
      return { status: 'current', version: deps.currentVersion }
    }
  }
  const partPath = deps.sourceDir
    ? null
    : join6(execDir, `.harnessed-update-${targetVersion ?? 'unknown'}.part`)
  const verifyPath = partPath ?? tempPath
  const stagingPath = deps.sourceDir
    ? tempPath
    : join6(execDir, `.harnessed-update-${targetVersion ?? 'unknown'}${ext}`)
  if (opts.dryRun) {
    const backupDir2 = 'bin-backup/<oldver>/ under the harnessed state root'
    const steps = [
      deps.sourceDir
        ? `copy ${sourceAsset} \u2192 ${stagingPath} (local source dir \u2014 rehearsal seam)`
        : `download ${assetUrl ?? `latest ${asset}`} \u2192 ${partPath} (resumable fragment)`,
      `verify sha256 against ${deps.sourceDir ? sourceSha : (shaUrl ?? `${asset}.sha256`)}`,
      ...(deps.sourceDir
        ? []
        : ['verify the ed25519 signature (.sha256.sig) against the embedded release public key']),
      ...(deps.platform === 'win32' ? [] : ['chmod 755 the downloaded binary']),
      'smoke: spawn `--version` on the new binary',
      `rename ${deps.execPath} \u2192 ${bakPath} (same-dir, same-volume)`,
      `rename ${stagingPath} \u2192 ${deps.execPath}`,
      `copy the .bak to ${backupDir2} (rollback net)`,
      'delete the .bak (fail-soft \u2014 kept on Windows EPERM or when the backup copy failed)',
    ]
    return { status: 'dry-run', steps }
  }
  try {
    if (deps.sourceDir && sourceAsset) {
      await fsCopyFile(sourceAsset, tempPath)
    } else if (assetUrl && partPath) {
      await deps.downloadTo(assetUrl, partPath, assetFallbackUrl)
    }
  } catch (e) {
    if (!partPath) await unlink(tempPath).catch(() => {})
    return { status: 'error', message: downloadFailureMessage(e, targetVersion, assetUrl) }
  }
  try {
    const shaText = deps.sourceDir
      ? await readFile(sourceSha ?? '', 'utf8')
      : await deps.fetchShaText(shaUrl ?? '', shaFallbackUrl)
    const expected = parseShaText(shaText)
    if (!expected) throw new Error(`malformed .sha256 content`)
    const actual = await sha256File(verifyPath)
    if (actual !== expected) {
      throw new Error(
        `sha256 mismatch \u2014 expected ${expected.slice(0, 12)}\u2026, got ${actual.slice(0, 12)}\u2026`,
      )
    }
    if (!deps.sourceDir) {
      const sigText = await deps
        .fetchShaText(sigUrl ?? `${shaUrl ?? ''}.sig`, sigFallbackUrl)
        .catch(() => {
          throw new Error(`missing .sha256.sig (signature is contractual since 4.32.19)`)
        })
      if (!verifyShaSignature(shaText, sigText, deps.publicKeyPem)) {
        throw new Error(
          `ed25519 signature over .sha256 did not verify \u2014 the release assets may be tampered`,
        )
      }
    }
  } catch (e) {
    await unlink(verifyPath).catch(() => {})
    return {
      status: 'error',
      message: `integrity verification failed: ${e.message} \u2014 aborted; original binary untouched`,
    }
  }
  if (partPath) {
    try {
      await unlink(stagingPath).catch(() => {})
      await rename(partPath, stagingPath)
    } catch (e) {
      return {
        status: 'error',
        message: `could not stage the verified download: ${e.message} \u2014 the download was kept for the next attempt; original binary untouched`,
      }
    }
  }
  let smokeRan = false
  try {
    if (deps.platform !== 'win32') await chmod(stagingPath, 493)
    const out = (await deps.smoke(stagingPath)).trim()
    smokeRan = true
    const m = /^(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)/.exec(out)
    if (!m) throw new Error(`--version smoke returned unexpected output: ${out.slice(0, 80)}`)
    if (targetVersion !== null && out !== targetVersion) {
      throw new Error(`--version mismatch: expected ${targetVersion}, got ${out.slice(0, 80)}`)
    }
    targetVersion = targetVersion ?? m[1] ?? null
  } catch (e) {
    if (partPath && !smokeRan) {
      await rename(stagingPath, partPath).catch(() => {})
    } else {
      await unlink(stagingPath).catch(() => {})
    }
    return {
      status: 'error',
      message: `new binary failed the --version smoke: ${e.message} \u2014 aborted; original binary untouched`,
    }
  }
  try {
    await rename(deps.execPath, bakPath)
  } catch (e) {
    if (partPath) await rename(stagingPath, partPath).catch(() => {})
    else await unlink(stagingPath).catch(() => {})
    return {
      status: 'error',
      message: `could not move the current binary aside: ${e.message} \u2014 original untouched`,
    }
  }
  try {
    await rename(stagingPath, deps.execPath)
  } catch (e) {
    try {
      await rename(bakPath, deps.execPath)
      if (partPath) await rename(stagingPath, partPath).catch(() => {})
      else await unlink(stagingPath).catch(() => {})
      return {
        status: 'error',
        message: `swap failed (${e.message}) \u2014 rolled back to the previous binary`,
      }
    } catch (rb) {
      if (partPath) await rename(stagingPath, partPath).catch(() => {})
      return {
        status: 'error',
        critical: true,
        message: `CRITICAL: swap failed AND rollback failed (${rb.message}). Restore manually: copy "${bakPath}" "${deps.execPath}"`,
      }
    }
  }
  let backupDir = null
  let copied = false
  try {
    const dir = join6(deps.stateRoot(), 'bin-backup', deps.currentVersion)
    await mkdir(dir, { recursive: true })
    await copyFile(bakPath, join6(dir, execBase))
    backupDir = dir
    copied = true
  } catch (e) {
    deps.log(
      `warning: could not copy the previous binary to bin-backup (${e.message}) \u2014 keeping ${bakPath} as the rollback net`,
    )
  }
  let bakRemoved = false
  if (copied && !opts.retainBackupForContinuation) {
    try {
      await unlink(bakPath)
      bakRemoved = true
    } catch {}
  }
  return {
    status: 'updated',
    from: deps.currentVersion,
    to: targetVersion ?? '(unknown)',
    bakPath,
    bakRemoved,
    backupDir,
  }
}
async function finalizeBinarySelfUpdate(deps, outcome) {
  if (outcome.bakRemoved || outcome.backupDir === null) return outcome.bakRemoved
  const unlink = deps.fsOps?.unlink ?? fsUnlink
  try {
    await unlink(outcome.bakPath)
    outcome.bakRemoved = true
    return true
  } catch {
    return false
  }
}
async function runBinaryRollback(deps, opts) {
  const rename = deps.fsOps?.rename ?? fsRename
  const copyFile = deps.fsOps?.copyFile ?? fsCopyFile
  const unlink = deps.fsOps?.unlink ?? fsUnlink
  if (normalized(deps.execPath).includes('/node_modules/')) {
    return { status: 'refused', reason: 'binary lives under node_modules (npm-managed)' }
  }
  const asset = assetNameFor(deps.platform, deps.arch)
  const backupsRoot = join6(deps.stateRoot(), 'bin-backup')
  let versions = []
  try {
    const entries = await readdir(backupsRoot, { withFileTypes: true })
    for (const e of entries) {
      if (!e.isDirectory()) continue
      const has = await access(join6(backupsRoot, e.name, asset)).then(
        () => true,
        () => false,
      )
      if (has) versions.push(e.name)
    }
  } catch {
    versions = []
  }
  if (versions.length === 0) {
    return {
      status: 'error',
      message: `no rollback candidates \u2014 ${backupsRoot} holds no banked ${asset}`,
    }
  }
  let target
  if (opts.version) {
    if (!versions.includes(opts.version)) {
      return {
        status: 'error',
        message: `no backup for version ${opts.version} \u2014 available: ${versions.sort().join(', ')}`,
      }
    }
    target = opts.version
  } else {
    target = versions.reduce((a, b) => (compareVersions(a, b) === 'behind' ? b : a))
  }
  const backupBin = join6(backupsRoot, target, asset)
  const execDir = dirname4(deps.execPath)
  const execBase = basename(deps.execPath)
  const ext = deps.platform === 'win32' ? '.exe' : ''
  const tempPath = join6(execDir, `.harnessed-rollback-${deps.pid}${ext}`)
  const bakPath = join6(execDir, `${execBase}.bak-${deps.currentVersion}`)
  try {
    await fsCopyFile(backupBin, tempPath)
    if (deps.platform !== 'win32') await chmod(tempPath, 493)
    const out = (await deps.smoke(tempPath)).trim()
    if (!/^\d+\.\d+\.\d+/.test(out)) {
      throw new Error(`--version smoke returned unexpected output: ${out.slice(0, 80)}`)
    }
  } catch (e) {
    await unlink(tempPath).catch(() => {})
    return {
      status: 'error',
      message: `rollback staging failed: ${e.message} \u2014 original binary untouched`,
    }
  }
  try {
    await rename(deps.execPath, bakPath)
  } catch (e) {
    await unlink(tempPath).catch(() => {})
    return {
      status: 'error',
      message: `could not move the current binary aside: ${e.message} \u2014 original untouched`,
    }
  }
  try {
    await rename(tempPath, deps.execPath)
  } catch (e) {
    try {
      await rename(bakPath, deps.execPath)
      return {
        status: 'error',
        message: `swap failed (${e.message}) \u2014 restored the previous binary`,
      }
    } catch (rb) {
      return {
        status: 'error',
        message: `CRITICAL: swap failed AND restore failed (${rb.message}). Restore manually: copy "${bakPath}" "${deps.execPath}"`,
      }
    }
  }
  let copied = false
  try {
    const dir = join6(backupsRoot, deps.currentVersion)
    await mkdir(dir, { recursive: true })
    await copyFile(bakPath, join6(dir, execBase))
    copied = true
  } catch (e) {
    deps.log(`warning: could not bank the replaced binary (${e.message}) \u2014 keeping ${bakPath}`)
  }
  if (copied) await unlink(bakPath).catch(() => {})
  return { status: 'rolled-back', from: deps.currentVersion, to: target, backupUsed: backupBin }
}
function headerOf(res, name) {
  const headers = res.headers
  if (!headers || typeof headers.get !== 'function') return null
  return headers.get(name)
}
function parseContentRange(value) {
  if (!value) return null
  const text = value.trim()
  const unsat = /^bytes\s+\*\/(\d+|\*)$/i.exec(text)
  if (unsat) return { start: null, total: unsat[1] === '*' ? null : Number(unsat[1]) }
  const m = /^bytes\s+(\d+)-(\d+)\/(\d+|\*)$/i.exec(text)
  if (!m) return null
  return { start: Number(m[1]), total: m[3] === '*' ? null : Number(m[3]) }
}
function numberOrUndefined(value) {
  if (value === null) return void 0
  const n = Number(value)
  return Number.isFinite(n) ? n : void 0
}
async function fileSize(p) {
  try {
    return (await stat(p)).size
  } catch {
    return 0
  }
}
async function fetchWithTimeout(url, timeoutMs, net = {}, headers = {}, controller) {
  await ensureProxyDispatcher()
  const doFetch = net.fetchImpl ?? fetch
  const ac = controller ?? new AbortController()
  const timer = setTimeout(() => {
    ac.abort(new RequestTimeoutError(`the request to ${url} timed out after ${timeoutMs} ms`))
  }, timeoutMs)
  try {
    return await doFetch(url, {
      signal: ac.signal,
      headers: { 'user-agent': `harnessed/${package_default.version}`, ...headers },
      // GitHub's asset endpoint answers 302 → release-assets.githubusercontent.com
      // only when the Accept header asks for the raw bytes; without it the API
      // returns asset METADATA JSON instead of the file.
      redirect: 'follow',
    })
  } finally {
    clearTimeout(timer)
  }
}
function isTransientNetworkError(error) {
  const code = error?.code
  if (code && ['ECONNRESET', 'ECONNREFUSED', 'ETIMEDOUT', 'EPIPE', 'EAI_AGAIN'].includes(code)) {
    return true
  }
  const message = error instanceof Error ? error.message : String(error)
  return /socket connection was closed|ECONNRESET|ETIMEDOUT|network|terminated|fetch failed/i.test(
    message,
  )
}
async function fetchAsset(url, fallbackUrl, timeoutMs, net, label, consume, extra) {
  const sleep = net.sleep ?? ((ms) => new Promise((r) => setTimeout(r, ms)))
  const attempts = []
  let lastError
  for (const candidate of [url, fallbackUrl].filter((u) => !!u)) {
    for (let attempt = 1; attempt <= DOWNLOAD_ATTEMPTS; attempt++) {
      const ac = new AbortController()
      try {
        const offset =
          extra?.existingBytes === void 0
            ? 0
            : await (typeof extra.existingBytes === 'function'
                ? extra.existingBytes()
                : extra.existingBytes)
        const headers = {
          accept: 'application/octet-stream',
          ...extra?.headers,
        }
        if (offset > 0) headers.range = `bytes=${offset}-`
        const res = await fetchWithTimeout(candidate, timeoutMs, net, headers, ac)
        if (!res.ok) {
          if (res.status === 416) {
            throw new RangeNotSatisfiableError(
              parseContentRange(headerOf(res, 'content-range'))?.total ?? null,
            )
          }
          lastError = new Error(`HTTP ${res.status} downloading ${candidate}`)
          if (res.status < 500) break
        } else {
          return await consume(res, ac, offset)
        }
      } catch (error) {
        if (error instanceof RangeNotSatisfiableError) throw error
        lastError = error
        const retryable =
          error instanceof RangeMismatchError ||
          error instanceof TransferStalledError ||
          isTransientNetworkError(error)
        if (!retryable) break
      }
      attempts.push(candidate)
      if (attempt < DOWNLOAD_ATTEMPTS) await sleep(250 * attempt)
    }
  }
  throw new Error(
    `${label} download failed (${attempts.length} attempt(s) over ${[url, fallbackUrl].filter(Boolean).join(', ')}): ${lastError instanceof Error ? lastError.message : String(lastError)}`,
  )
}
function formatBytes(n) {
  if (n >= 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`
  if (n >= 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${n} B`
}
function formatRate(received, elapsedMs) {
  if (received <= 0 || elapsedMs <= 0) return '0 KB/s'
  return `${(received / 1024 / (elapsedMs / 1e3)).toFixed(1)} KB/s`
}
function transferStats(received, elapsedMs) {
  const seconds = (elapsedMs / 1e3).toFixed(1)
  const rate = received > 0 ? `, ${formatRate(received, elapsedMs)} average` : ''
  return `${received} bytes received in ${seconds} s${rate}`
}
async function streamAssetToFile(res, dest, ac, stallTimeoutMs, progressIntervalMs, log, opts) {
  if (!res.body) throw new Error('the release asset response carried no body')
  const started = Date.now()
  const initialBytes = opts?.initialBytes ?? 0
  let received = initialBytes
  let attemptBytes = 0
  let lastProgressAt = started
  let stalled = false
  let stallTimer
  const resetStall = () => {
    if (stallTimer) clearTimeout(stallTimer)
    stallTimer = setTimeout(() => {
      stalled = true
      ac.abort(
        new TransferStalledError(`no data received for ${Math.round(stallTimeoutMs / 1e3)} s`),
      )
    }, stallTimeoutMs)
  }
  const meter = new Transform({
    transform(chunk, _encoding, callback) {
      received += chunk.length
      attemptBytes += chunk.length
      const now = Date.now()
      if (now - lastProgressAt >= progressIntervalMs) {
        lastProgressAt = now
        const total = opts?.totalBytes
        const totalPart = total ? ` / ${formatBytes(total)}` : ''
        log(
          `downloading ${formatBytes(received)}${totalPart} (${formatRate(attemptBytes, now - started)})`,
        )
      }
      resetStall()
      callback(null, chunk)
    },
  })
  resetStall()
  try {
    await pipeline(
      // undici types the body as a DOM-ish ReadableStream; node:stream/web's
      // class is the one Readable.fromWeb accepts.
      Readable.fromWeb(res.body),
      meter,
      // flags 'a' appends (a 206 continues the fragment); 'w' truncates (a
      // 200 rewrites it — a retried attempt must not append to the bytes a
      // previous attempt already wrote).
      createWriteStream(dest, { flags: opts?.append ? 'a' : 'w' }),
      { signal: ac.signal },
    )
  } catch (e) {
    if (stalled) {
      throw new TransferStalledError(
        `the download stalled \u2014 no data for ${Math.round(stallTimeoutMs / 1e3)} s (${transferStats(attemptBytes, Date.now() - started)})`,
      )
    }
    throw e
  } finally {
    if (stallTimer) clearTimeout(stallTimer)
  }
}
async function downloadResumableAsset(url, fallbackUrl, dest, net, log) {
  const stallTimeoutMs = net.stallTimeoutMs ?? ASSET_STALL_TIMEOUT_MS
  const progressIntervalMs = net.progressIntervalMs ?? ASSET_PROGRESS_INTERVAL_MS
  let forceFullDownload = false
  const offsetOf = async () => {
    if (forceFullDownload) return 0
    return await fileSize(dest)
  }
  for (let round = 0; round < 2; round++) {
    try {
      await fetchAsset(
        url,
        fallbackUrl,
        ASSET_HEADERS_TIMEOUT_MS,
        net,
        'binary',
        async (res, attempt, requested) => {
          const range = parseContentRange(headerOf(res, 'content-range'))
          const start = range ? range.start : null
          const totalBytes =
            res.status === 206
              ? (range?.total ?? void 0)
              : numberOrUndefined(headerOf(res, 'content-length'))
          if (res.status === 206) {
            if (start === null || start !== requested) {
              await fsUnlink(dest).catch(() => {})
              forceFullDownload = true
              throw new RangeMismatchError(
                `the server answered 206 starting at ${start ?? '?'}, not ${requested}`,
              )
            }
            await streamAssetToFile(res, dest, attempt, stallTimeoutMs, progressIntervalMs, log, {
              append: true,
              initialBytes: requested,
              totalBytes,
            })
            return
          }
          await streamAssetToFile(res, dest, attempt, stallTimeoutMs, progressIntervalMs, log, {
            append: false,
            initialBytes: 0,
            totalBytes,
          })
        },
        { existingBytes: offsetOf },
      )
      return
    } catch (e) {
      if (e instanceof RangeNotSatisfiableError) {
        const have = await fileSize(dest)
        if (e.total !== null && e.total === have) return
        await fsUnlink(dest).catch(() => {})
        forceFullDownload = true
        continue
      }
      throw e
    }
  }
  throw new Error('the release asset could not be downloaded (the server ignored the resume range)')
}
async function resolveLatestRelease(platform = process.platform, arch = process.arch, net = {}) {
  let res
  try {
    res = await fetchWithTimeout(RELEASES_LATEST_URL, RELEASE_METADATA_TIMEOUT_MS, net)
  } catch (e) {
    const budget = `${RELEASE_METADATA_TIMEOUT_MS / 1e3} s timeout budget`
    return {
      error:
        e instanceof RequestTimeoutError
          ? `the request to the GitHub releases API timed out (${budget})`
          : `the request to the GitHub releases API failed or timed out (${budget}): ${e instanceof Error ? e.message : String(e)}`,
      kind: e instanceof RequestTimeoutError ? 'timeout' : 'network',
    }
  }
  if (!res.ok) {
    return { error: `the GitHub releases API returned HTTP ${res.status}`, kind: 'http' }
  }
  let body
  try {
    body = await res.json()
  } catch (e) {
    return {
      error: `the GitHub releases API response could not be parsed: ${e instanceof Error ? e.message : String(e)}`,
      kind: 'parse',
    }
  }
  const version = (body.tag_name ?? '').replace(/^v/, '')
  if (!/^\d+\.\d+\.\d+/.test(version)) {
    return {
      error: `the GitHub releases API response could not be parsed: unexpected tag_name "${body.tag_name ?? ''}"`,
      kind: 'parse',
    }
  }
  const asset = assetNameFor(platform, arch)
  const pick = (name) => body.assets?.find((a) => a.name === name)
  const found = pick(asset)
  const sha = pick(`${asset}.sha256`)
  const sig = pick(`${asset}.sha256.sig`)
  if (!found?.browser_download_url && !found?.url) {
    return { error: `asset ${asset} not found on release v${version}`, kind: 'publishing' }
  }
  if (!sha?.browser_download_url && !sha?.url) {
    return { error: `asset ${asset}.sha256 not found on release v${version}`, kind: 'publishing' }
  }
  const pair = (a) => {
    const api = a?.url
    const browser = a?.browser_download_url
    return api && browser
      ? { primary: api, fallback: browser }
      : { primary: api ?? browser ?? '', fallback: void 0 }
  }
  const assetPair = pair(found)
  const shaPair = pair(sha)
  const sigPair = pair(sig)
  return {
    version,
    assetUrl: assetPair.primary,
    shaUrl: shaPair.primary,
    sigUrl: sigPair.primary || void 0,
    assetFallbackUrl: assetPair.fallback,
    shaFallbackUrl: shaPair.fallback,
    sigFallbackUrl: sigPair.fallback,
  }
}
function realSelfUpdateDeps(context, net = {}) {
  const log = (line) => console.warn(line)
  return {
    execPath: process.execPath,
    platform: process.platform,
    arch: process.arch,
    currentVersion: package_default.version,
    sourceDir: process.env.HARNESSED_UPDATE_SOURCE_DIR?.trim() || null,
    resolveRelease: () => resolveLatestRelease(process.platform, process.arch, net),
    downloadTo: async (url, dest, fallbackUrl) => {
      await downloadResumableAsset(url, fallbackUrl, dest, net, log)
    },
    fetchShaText: async (url, fallbackUrl) => {
      return fetchAsset(url, fallbackUrl, CHECKSUM_TIMEOUT_MS, net, 'checksum', (res) => res.text())
    },
    smoke: async (bin) => {
      const { execFile: execFile2 } = await import('node:child_process')
      const { promisify: promisify2 } = await import('node:util')
      const { stdout } = await promisify2(execFile2)(bin, ['--version'], {
        timeout: 3e4,
        windowsHide: true,
        shell: false,
        env: withHostInstallEnv(process.env, context),
      })
      return stdout
    },
    stateRoot: () => context.platform.stateRoot,
    log,
    pid: process.pid,
  }
}
async function execDirWritable(execPath) {
  try {
    await access(
      dirname4(execPath),
      2,
      /* W_OK */
    )
    return true
  } catch {
    return false
  }
}
var OWNER_REPO,
  RELEASES_LATEST_URL,
  RELEASE_METADATA_TIMEOUT_MS,
  ASSET_HEADERS_TIMEOUT_MS,
  CHECKSUM_TIMEOUT_MS,
  ASSET_STALL_TIMEOUT_MS,
  ASSET_PROGRESS_INTERVAL_MS,
  RequestTimeoutError,
  TransferStalledError,
  RangeMismatchError,
  RangeNotSatisfiableError,
  DOWNLOAD_ATTEMPTS
var init_selfUpdateBinary = __esm({
  'src/cli/lib/selfUpdateBinary.ts'() {
    'use strict'
    init_package()
    init_runClaudeArgs()
    init_proxyDispatcher()
    init_updateSignature()
    init_version_check()
    OWNER_REPO = 'easyinplay/harnessed'
    RELEASES_LATEST_URL = `https://api.github.com/repos/${OWNER_REPO}/releases/latest`
    RELEASE_METADATA_TIMEOUT_MS = 3e4
    ASSET_HEADERS_TIMEOUT_MS = 12e4
    CHECKSUM_TIMEOUT_MS = 3e4
    ASSET_STALL_TIMEOUT_MS = 12e4
    ASSET_PROGRESS_INTERVAL_MS = 6e4
    RequestTimeoutError = class extends Error {}
    TransferStalledError = class extends Error {}
    RangeMismatchError = class extends Error {}
    RangeNotSatisfiableError = class extends Error {
      constructor(total) {
        super('the requested range is not satisfiable')
        this.total = total
      }
      total
    }
    DOWNLOAD_ATTEMPTS = 3
  },
})

// src/cli/lib/updateLock.ts
var updateLock_exports = {}
__export(updateLock_exports, {
  UPDATE_LOCK_PROTOCOL_VERSION: () => UPDATE_LOCK_PROTOCOL_VERSION,
  acquireUpdateLock: () => acquireUpdateLock,
  consumeUpdateLockContinuation: () => consumeUpdateLockContinuation,
  updateTargetKey: () => updateTargetKey,
  withUpdateLock: () => withUpdateLock,
})
import { createHash as createHash2, randomBytes, timingSafeEqual } from 'node:crypto'
import {
  closeSync as closeSync2,
  fsyncSync,
  mkdirSync as mkdirSync3,
  openSync as openSync2,
  readFileSync as readFileSync4,
  realpathSync,
  renameSync as renameSync3,
  statSync,
  unlinkSync,
  writeFileSync as writeFileSync3,
} from 'node:fs'
import {
  basename as basename2,
  dirname as dirname5,
  join as join7,
  resolve as resolve3,
} from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
function normalizeTarget(target) {
  let candidate = resolve3(target)
  const missing = []
  for (;;) {
    try {
      let canonical = resolve3(realpathSync.native(candidate), ...missing)
      if (/\.(?:[cm]?js|ts)$/.test(canonical)) {
        for (let directory = dirname5(canonical); ; ) {
          try {
            const manifest = JSON.parse(readFileSync4(join7(directory, 'package.json'), 'utf8'))
            if (manifest.name === 'harnessed') canonical = directory
            break
          } catch (error) {
            if (error.code !== 'ENOENT') throw error
          }
          const parent = dirname5(directory)
          if (parent === directory) break
          directory = parent
        }
      }
      return process.platform === 'win32' ? canonical.toLowerCase() : canonical
    } catch (error) {
      if (error.code !== 'ENOENT') throw error
      missing.unshift(basename2(candidate))
      const parent = dirname5(candidate)
      if (parent === candidate) throw error
      candidate = parent
    }
  }
}
function updateTargetKey(target) {
  return createHash2('sha256').update(normalizeTarget(target), 'utf8').digest('hex')
}
function pathsFor(target) {
  const anchor = `${target}.harnessed-update-anchor`
  return { anchor, path: `${anchor}.json` }
}
function ensureAnchor(anchor) {
  mkdirSync3(dirname5(anchor), { recursive: true })
  const descriptor = openSync2(anchor, 'a', 384)
  closeSync2(descriptor)
}
function guarded(anchor, work, recover = true) {
  const release = import_proper_lockfile.default.lockSync(anchor, {
    realpath: true,
    retries: 0,
    stale: recover ? 3e4 : Number.MAX_SAFE_INTEGER,
    update: 1e3,
  })
  try {
    return work()
  } finally {
    release()
  }
}
function defaultIsProcessAlive(pid) {
  try {
    process.kill(pid, 0)
    return true
  } catch (error) {
    return error.code !== 'ESRCH'
  }
}
function sameSecret(left, right) {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer)
}
function readLockRecord(path) {
  try {
    if (statSync(path).size > MAX_LOCK_BYTES) return null
    const value = JSON.parse(readFileSync4(path, 'utf8'))
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null
    if (
      value.protocolVersion !== UPDATE_LOCK_PROTOCOL_VERSION ||
      typeof value.target !== 'string' ||
      typeof value.targetKey !== 'string' ||
      typeof value.nonce !== 'string' ||
      !Number.isInteger(value.ownerPid) ||
      (value.ownerPid ?? 0) <= 0 ||
      !Number.isFinite(value.createdAt) ||
      !Number.isFinite(value.heartbeatAt) ||
      (value.consumedAt !== null && !Number.isFinite(value.consumedAt))
    )
      return null
    return value
  } catch (error) {
    if (error instanceof SyntaxError || error.code === 'ENOENT') return null
    throw error
  }
}
function removeTemporaryLockRecord(path) {
  try {
    unlinkSync(path)
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
  }
}
function writeLockRecord(path, record) {
  const temporary = `${path}.${randomBytes(12).toString('hex')}.tmp`
  try {
    const descriptor = openSync2(temporary, 'wx', 384)
    try {
      writeFileSync3(
        descriptor,
        `${JSON.stringify(record)}
`,
        'utf8',
      )
      fsyncSync(descriptor)
    } finally {
      closeSync2(descriptor)
    }
    renameSync3(temporary, path)
  } finally {
    removeTemporaryLockRecord(temporary)
  }
}
async function consumeUpdateLockContinuation(options) {
  if (options.protocolVersion !== UPDATE_LOCK_PROTOCOL_VERSION)
    return { ok: false, reason: 'protocol-mismatch' }
  const target = normalizeTarget(options.target)
  const targetKey = updateTargetKey(target)
  if (options.targetKey !== targetKey) return { ok: false, reason: 'target-mismatch' }
  const { anchor, path } = pathsFor(target)
  ensureAnchor(anchor)
  return guarded(anchor, () => {
    const current = readLockRecord(path)
    if (!current || current.target !== target || current.targetKey !== targetKey) {
      return { ok: false, reason: 'target-mismatch' }
    }
    if (!sameSecret(options.nonce, current.nonce)) return { ok: false, reason: 'nonce-mismatch' }
    if (current.consumedAt !== null) return { ok: false, reason: 'nonce-consumed' }
    if (!defaultIsProcessAlive(current.ownerPid)) return { ok: false, reason: 'target-mismatch' }
    const timestamp = (options.now ?? Date.now)()
    writeLockRecord(path, {
      ...current,
      ownerPid: options.pid ?? process.pid,
      heartbeatAt: timestamp,
      consumedAt: timestamp,
    })
    return { ok: true }
  })
}
async function acquireUpdateLock(options) {
  const now = options.now ?? Date.now
  const target = normalizeTarget(options.target)
  const targetKey = updateTargetKey(target)
  const { anchor, path } = pathsFor(target)
  const nonce = options.nonce ?? randomBytes(24).toString('base64url')
  const busy = (ownerPid = null) => ({
    status: 'busy',
    targetKey,
    ownerPid,
  })
  ensureAnchor(anchor)
  try {
    return guarded(
      anchor,
      () => {
        const current = readLockRecord(path)
        let modified = null
        try {
          modified = statSync(path).mtimeMs
        } catch (error) {
          if (error.code !== 'ENOENT') throw error
        }
        if (modified !== null) {
          const stale =
            now() - (current?.heartbeatAt ?? modified) >
            Math.max(1e3, options.staleAfterMs ?? DEFAULT_STALE_AFTER_MS)
          if (
            !stale ||
            (options.maxStaleRecoveries ?? 1) <= 0 ||
            (current && (options.isProcessAlive ?? defaultIsProcessAlive)(current.ownerPid))
          )
            return busy(current?.ownerPid)
        }
        const timestamp = now()
        writeLockRecord(path, {
          protocolVersion: UPDATE_LOCK_PROTOCOL_VERSION,
          target,
          targetKey,
          nonce,
          ownerPid: options.pid ?? process.pid,
          createdAt: timestamp,
          heartbeatAt: timestamp,
          consumedAt: null,
        })
        const handle = {
          path,
          target,
          targetKey,
          nonce,
          async refresh() {
            try {
              guarded(anchor, () => {
                const current2 = readLockRecord(path)
                if (current2 && sameSecret(current2.nonce, nonce))
                  writeLockRecord(path, { ...current2, heartbeatAt: now() })
              })
            } catch (error) {
              if (error.code !== 'ELOCKED') throw error
            }
          },
          consumeContinuation: (input) =>
            consumeUpdateLockContinuation({ stateRoot: options.stateRoot, target, ...input, now }),
          async release() {
            for (let attempt = 0; attempt < 10; attempt++) {
              try {
                guarded(anchor, () => {
                  const current2 = readLockRecord(path)
                  if (current2 && sameSecret(current2.nonce, nonce)) unlinkSync(path)
                })
                return
              } catch (error) {
                if (error.code !== 'ELOCKED') throw error
                await delay(20)
              }
            }
            throw new Error('Update lock release guard remained busy')
          },
        }
        return { status: 'acquired', lock: handle }
      },
      (options.maxStaleRecoveries ?? 1) > 0,
    )
  } catch (error) {
    if (error.code === 'ELOCKED') return busy()
    throw error
  }
}
async function withUpdateLock(options, work) {
  const acquired = await acquireUpdateLock(options)
  if (acquired.status === 'busy') return acquired
  const heartbeat = setInterval(
    () => void acquired.lock.refresh().catch(() => {}),
    Math.max(1e3, Math.min(3e4, Math.floor((options.staleAfterMs ?? DEFAULT_STALE_AFTER_MS) / 3))),
  )
  heartbeat.unref()
  try {
    return { status: 'completed', value: await work(acquired.lock) }
  } finally {
    clearInterval(heartbeat)
    await acquired.lock.release()
  }
}
var import_proper_lockfile, UPDATE_LOCK_PROTOCOL_VERSION, DEFAULT_STALE_AFTER_MS, MAX_LOCK_BYTES
var init_updateLock = __esm({
  'src/cli/lib/updateLock.ts'() {
    'use strict'
    import_proper_lockfile = __toESM(require_proper_lockfile(), 1)
    UPDATE_LOCK_PROTOCOL_VERSION = 1
    DEFAULT_STALE_AFTER_MS = 5 * 6e4
    MAX_LOCK_BYTES = 16 * 1024
  },
})

// src/cli/lib/ownedRefreshFlag.ts
var OWNED_REFRESH_FLAG
var init_ownedRefreshFlag = __esm({
  'src/cli/lib/ownedRefreshFlag.ts'() {
    'use strict'
    OWNED_REFRESH_FLAG = '--internal-owned-refresh'
  },
})

// src/cli/lib/ownedRefresh.ts
import { spawn } from 'node:child_process'
async function spawnOwnedRefresh(
  execPath,
  context,
  deps = {},
  timeoutMs = OWNED_REFRESH_TIMEOUT_MS,
) {
  const spawnImpl = deps.spawn ?? spawn
  return new Promise((resolve5) => {
    let child
    try {
      child = spawnImpl(execPath, [OWNED_REFRESH_FLAG], {
        env: withHostInstallEnv(process.env, context),
        // stdout is dropped on purpose: the handover's result is the exit code,
        // and the parent owns the user-facing line. Keeping the child's stdout
        // empty also means an abrupt child exit cannot truncate a half-written
        // summary. stderr stays inherited so a failed refresh explains itself.
        stdio: ['ignore', 'ignore', 'inherit'],
        windowsHide: true,
        shell: false,
      })
    } catch (error) {
      resolve5({
        ok: false,
        exitCode: null,
        error: error instanceof Error ? error.message : String(error),
      })
      return
    }
    const timer = setTimeout(() => {
      try {
        killProcessTree(child)
      } catch {}
      resolve5({ ok: false, exitCode: null, error: `timed out after ${timeoutMs}ms` })
    }, timeoutMs)
    child.on('error', (error) => {
      clearTimeout(timer)
      resolve5({ ok: false, exitCode: null, error: error.message })
    })
    child.on('close', (code) => {
      clearTimeout(timer)
      resolve5({ ok: code === 0, exitCode: code })
    })
  })
}
var OWNED_REFRESH_TIMEOUT_MS
var init_ownedRefresh = __esm({
  'src/cli/lib/ownedRefresh.ts'() {
    'use strict'
    init_killTree()
    init_runClaudeArgs()
    init_autoUpdateStatus()
    init_ownedRefreshFlag()
    OWNED_REFRESH_TIMEOUT_MS = 18e4
  },
})

// src/cli/lib/autoUpdateHandover.ts
var autoUpdateHandover_exports = {}
__export(autoUpdateHandover_exports, {
  AUTO_UPDATE_STATUS_PATH_ENV: () => AUTO_UPDATE_STATUS_PATH_ENV,
  handoverAutoUpdate: () => handoverAutoUpdate,
})
async function handoverAutoUpdate(input, deps) {
  const { from, statusPath } = input
  try {
    const { readAutoUpdateNotice: readAutoUpdateNotice2 } = await Promise.resolve().then(
      () => (init_autoUpdateNotice(), autoUpdateNotice_exports),
    )
    const notice = readAutoUpdateNotice2(statusPath)
    if (notice) writeAutoUpdateNotice(statusPath, { ...notice, from })
  } catch {}
  const previous = process.env[AUTO_UPDATE_STATUS_PATH_ENV]
  process.env[AUTO_UPDATE_STATUS_PATH_ENV] = statusPath
  try {
    const execPath = deps.execPath
    const context = deps.context
    const spawnImpl = deps.spawnOwnedRefresh ?? spawnOwnedRefresh
    const refresh = await spawnImpl(execPath, context, { spawn: deps.spawn })
    return refresh.ok ? { ok: true } : { ok: false, error: refresh.error }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) }
  } finally {
    if (previous === void 0) delete process.env[AUTO_UPDATE_STATUS_PATH_ENV]
    else process.env[AUTO_UPDATE_STATUS_PATH_ENV] = previous
  }
}
var init_autoUpdateHandover = __esm({
  'src/cli/lib/autoUpdateHandover.ts'() {
    'use strict'
    init_autoUpdateNotice()
    init_autoUpdateStatus()
    init_ownedRefresh()
  },
})

// src/cli/updateReminderWorkerMain.ts
var updateReminderWorkerMain_exports = {}
__export(updateReminderWorkerMain_exports, {
  runUpdateReminderWorker: () => runUpdateReminderWorker,
})
import { randomUUID } from 'node:crypto'
import { realpathSync as realpathSync2, statSync as statSync2 } from 'node:fs'
import asyncFs from 'node:fs/promises'
import { dirname as dirname6, join as join8 } from 'node:path'
function autoUpdateChannel(channel) {
  if (channel === 'binary' || channel === 'npm' || channel === 'bun' || channel === 'node') {
    return channel
  }
  return 'npm'
}
function resumeFragmentBytes(execPath, version) {
  try {
    return statSync2(join8(dirname6(execPath), `.harnessed-update-${version}.part`)).size
  } catch {
    return 0
  }
}
function readAutoUpdateConsent(preferencesPath) {
  const { preferences, document } = readUpdateReminderPreferencesFile(preferencesPath)
  const schemaVersion = typeof document?.schemaVersion === 'number' ? document.schemaVersion : null
  return { ...preferences, schemaVersion }
}
async function runAutomaticUpdate(options, targetVersion) {
  const preferencesPath = options.preferencesPath
  if (!preferencesPath) return
  if (!isAutoUpdateConsentGranted(readAutoUpdateConsent(preferencesPath))) return
  const [
    { captureHostInstallContext: captureHostInstallContext2 },
    engine,
    { withUpdateLock: withUpdateLock2 },
  ] = await Promise.all([
    Promise.resolve().then(() => (init_hostInstallContext(), hostInstallContext_exports)),
    Promise.resolve().then(() => (init_selfUpdateBinary(), selfUpdateBinary_exports)),
    Promise.resolve().then(() => (init_updateLock(), updateLock_exports)),
  ])
  const context = captureHostInstallContext2({ hostId: options.identity.host })
  const stateRoot = options.stateRoot ?? dirname6(options.cachePath)
  const statusPath = autoUpdateStatusPath(stateRoot)
  const deps = {
    readPreferences: () => readAutoUpdateConsent(preferencesPath),
    channel: () => autoUpdateChannel(options.identity.channel),
    installedVersion: () => options.installed,
    context: () => context,
    // The lock target is the exec path — `updateTarget().target` for the
    // binary channel is exactly `realpath(process.execPath)`
    // (updateCoordinator.ts:233-239). It is spelled out here instead of
    // importing the coordinator, which would drag the i18n and the repair
    // machinery into the always-resident reminder worker bundle.
    target: () => realpathSync2(process.execPath),
    execDirWritable: (execPath) => engine.execDirWritable(execPath),
    withLock: async (input, work) =>
      withUpdateLock2({ stateRoot: input.stateRoot, target: input.target }, async () => work()),
    selfUpdate: async () => {
      const outcome = await engine.runBinarySelfUpdate(engine.realSelfUpdateDeps(context), {})
      if (outcome.status !== 'error') return outcome
      const progressed =
        mapSelfUpdateFailureReason(outcome.message) === 'network' &&
        resumeFragmentBytes(realpathSync2(process.execPath), targetVersion) > 0
      return { ...outcome, progressed }
    },
    handover: async (input) => {
      const { handoverAutoUpdate: handoverAutoUpdate2 } = await Promise.resolve().then(
        () => (init_autoUpdateHandover(), autoUpdateHandover_exports),
      )
      const result = await handoverAutoUpdate2(
        { from: input.from, to: input.to, statusPath: input.statusPath },
        { context, execPath: realpathSync2(process.execPath) },
      )
      return { ok: result.ok, error: result.error }
    },
    statusPath: () => statusPath,
    readStatus: () => readAutoUpdateStatus(statusPath),
    writeStatus: (status) => writeAutoUpdateStatus(statusPath, status),
    preferencesPath: () => preferencesPath,
    now: () => Date.now(),
    // The worker has no stdout (stdio: 'ignore') — the status file is the
    // report channel.
    log: () => {},
  }
  await runAutoUpdate(deps, { targetVersion })
}
async function runUpdateReminderWorker(options) {
  let release
  let temporary
  let timer
  const controller = new AbortController()
  let owned = false
  let autoUpdateTarget = null
  try {
    const now = options.now ?? Date.now
    if (!isReminderVersion(options.installed)) return 0
    await asyncFs.mkdir(dirname6(options.cachePath), { recursive: true })
    release = await import_proper_lockfile2.default.lock(options.cachePath, {
      realpath: false,
      retries: 0,
      stale: REMINDER_LOCK_STALE_MS,
      update: 1e4,
      onCompromised: () => {
        owned = false
        controller.abort()
      },
    })
    owned = true
    const cache2 = readReminderCache(options.cachePath, options.identity, now())
    if (!shouldRefreshReminder(cache2, now())) return 0
    let latest = null
    try {
      const observation = await Promise.race([
        options.observe(controller.signal),
        new Promise((_, reject) => {
          timer = setTimeout(() => {
            controller.abort()
            reject(new Error('timeout'))
          }, 8e3)
        }),
      ])
      if (isReminderVersion(observation.latest)) latest = observation.latest
    } catch {}
    const checkedAt = now()
    const state = latest === null ? 'unknown' : compareVersions(options.installed, latest)
    if (state === 'behind' && latest !== null) autoUpdateTarget = latest
    const result = {
      schemaVersion: 1,
      identity: { ...options.identity },
      installed: options.installed,
      latest,
      state,
      checkedAt,
      retryAfter: state === 'unknown' ? checkedAt + REMINDER_RETRY_MS : 0,
    }
    const text = `${JSON.stringify(result)}
`
    if (!owned || Buffer.byteLength(text) > REMINDER_MAX_BYTES) return 0
    temporary = `${options.cachePath}.${randomUUID()}.tmp`
    await asyncFs.writeFile(temporary, text, { encoding: 'utf8', flag: 'wx', mode: 384 })
    if (owned) await asyncFs.rename(temporary, options.cachePath)
  } catch {
  } finally {
    if (timer) clearTimeout(timer)
    controller.abort()
    if (temporary) await asyncFs.unlink(temporary).catch(() => {})
    if (release) await release().catch(() => {})
    if (autoUpdateTarget) {
      try {
        await runAutomaticUpdate(options, autoUpdateTarget)
      } catch {}
    }
  }
  return 0
}
var import_proper_lockfile2
var init_updateReminderWorkerMain = __esm({
  'src/cli/updateReminderWorkerMain.ts'() {
    'use strict'
    import_proper_lockfile2 = __toESM(require_proper_lockfile(), 1)
    init_autoUpdate()
    init_autoUpdateStatus()
    init_updateReminderCache()
    init_updateReminderPreferences()
    init_version_check()
  },
})

// src/compile/updateReminderEntrypoint.ts
import { createHash as createHash3 } from 'node:crypto'
init_package()
init_autoUpdateStatus()
init_updateReminderPreferences()
import { homedir as homedir4 } from 'node:os'
import { dirname as dirname7, isAbsolute, join as join9, resolve as resolve4 } from 'node:path'
import { fileURLToPath as fileURLToPath2 } from 'node:url'

// src/cli/updateReminderHookMain.ts
init_autoUpdateNotice()
init_autoUpdateStatus()
init_updateReminderCache()

// src/compile/updateReminderEntrypoint.ts
init_stateRoot()
var UPDATE_REMINDER_OPERATION = 'update-reminder'
var UPDATE_REMINDER_WORKER_OPERATION = 'update-reminder-worker'
var UPDATE_REMINDER_PREFERENCES_FILE = 'update-reminder-preferences.json'
var BINARY_SOURCE = 'https://api.github.com/repos/easyinplay/harnessed/releases/latest'
function resolveUpdateReminderRuntime(options = {}) {
  const args = [...(options.args ?? process.argv.slice(2))]
  if (args[0] === UPDATE_REMINDER_OPERATION || args[0] === UPDATE_REMINDER_WORKER_OPERATION)
    args.shift()
  let host = 'claude'
  let explicitStateRoot
  let platformSpecified = false
  for (let index = 0; index < args.length; index += 2) {
    const flag = args[index]
    const value = args[index + 1]
    if (
      !flag ||
      value === void 0 ||
      [flag, value].some((argument) =>
        Array.from(argument).some((character) => character < ' ' || character === '\x7F'),
      )
    )
      return null
    if (flag === '--platform') {
      if (platformSpecified || (value !== 'claude' && value !== 'codex')) return null
      platformSpecified = true
      host = value
    } else if (flag === '--state-root') {
      if (explicitStateRoot !== void 0 || !isAbsolute(value)) return null
      explicitStateRoot = resolve4(value)
    } else return null
  }
  const nativeHome = resolve4(
    (host === 'codex' ? process.env.CODEX_HOME?.trim() : process.env.CLAUDE_CONFIG_DIR) ||
      join9(homedir4(), host === 'codex' ? '.codex' : '.claude'),
  )
  const stateRoot = explicitStateRoot ?? canonicalStateRoot(host)
  const channel = options.compiled ? 'binary' : process.versions.bun ? 'bun' : 'npm'
  const source = channel === 'binary' ? BINARY_SOURCE : `${channel}:harnessed`
  const fingerprint = createHash3('sha256')
    .update(
      JSON.stringify([
        host === 'codex' ? stateRoot : nativeHome,
        process.execPath,
        package_default.version,
        source,
      ]),
    )
    .digest('hex')
  return {
    stateRoot,
    nativeHome,
    cachePath: join9(stateRoot, `update-reminder-${host}.json`),
    preferencesPath: join9(stateRoot, UPDATE_REMINDER_PREFERENCES_FILE),
    // The auto-update status file of THIS host — the hook reads the pending
    // update notice from it, the worker writes the run state into it.
    statusPath: autoUpdateStatusPath(stateRoot),
    installed: package_default.version,
    identity: {
      host,
      runtime: options.compiled ? 'binary' : process.versions.bun ? 'bun' : 'node',
      channel,
      source,
      fingerprint,
    },
    worker: {
      executable: process.execPath,
      args: [
        options.compiled
          ? UPDATE_REMINDER_WORKER_OPERATION
          : join9(
              dirname7(fileURLToPath2(import.meta.url)),
              'harnessed-update-reminder-worker.mjs',
            ),
        '--platform',
        host,
        ...(explicitStateRoot ? ['--state-root', explicitStateRoot] : []),
      ],
    },
  }
}
function readConsents(path) {
  const { preferences, missing, document } = readUpdateReminderPreferencesFile(path)
  if (preferences.unreadable) return { enabled: false, autoUpdate: false }
  if (missing) return { enabled: true, autoUpdate: false }
  const known = document?.schemaVersion === 1
  return { enabled: known && preferences.enabled, autoUpdate: known && preferences.autoUpdate }
}
function anyConsent(consents) {
  return consents.enabled || consents.autoUpdate
}
async function runUpdateReminderWorkerEntrypoint(options = {}) {
  try {
    const runtime = resolveUpdateReminderRuntime(options)
    if (!runtime) return 0
    const consents = readConsents(runtime.preferencesPath)
    if (!anyConsent(consents)) return 0
    const { runUpdateReminderWorker: runUpdateReminderWorker2 } = await Promise.resolve().then(
      () => (init_updateReminderWorkerMain(), updateReminderWorkerMain_exports),
    )
    return await runUpdateReminderWorker2({
      ...runtime,
      observe: async (signal) => {
        if (runtime.identity.channel === 'binary') {
          const response = await fetch(BINARY_SOURCE, {
            signal,
            headers: { 'user-agent': `harnessed/${package_default.version}` },
          })
          if (!response.ok) return { latest: null }
          const value = await response.json()
          return {
            latest: typeof value.tag_name === 'string' ? value.tag_name.replace(/^v/, '') : null,
          }
        }
        const {
          fetchLatestBunVersion: fetchLatestBunVersion2,
          fetchLatestNpmVersion: fetchLatestNpmVersion2,
        } = await Promise.resolve().then(() => (init_version_check(), version_check_exports))
        return {
          latest: await (runtime.identity.channel === 'bun'
            ? fetchLatestBunVersion2()
            : fetchLatestNpmVersion2()),
        }
      },
    })
  } catch {}
  return 0
}

// bin/harnessed-update-reminder-worker.mjs.entry.ts
await runUpdateReminderWorkerEntrypoint()
