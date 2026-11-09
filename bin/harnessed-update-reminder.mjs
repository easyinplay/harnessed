#!/usr/bin/env node
// biome-ignore-all format: esbuild-generated (hook drift gate owns this file)
// biome-ignore-all lint: esbuild-generated
// biome-ignore-all assist/source/organizeImports: esbuild-generated
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) =>
  function __init() {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])((fn = 0))), res
  }

// package.json
var package_default
var init_package = __esm({
  'package.json'() {
    package_default = {
      name: 'harnessed',
      version: '5.0.15',
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
function hasResumableAutoUpdateWork(status) {
  if (!status) return false
  const entries = status.lastResult ? [...status.history, status.lastResult] : status.history
  const resumableFailure = entries.some(
    (entry) =>
      entry.status === 'failed' && (entry.message ?? '').startsWith(AUTO_UPDATE_RESUMABLE_MARKER),
  )
  if (resumableFailure) return true
  return IN_PROGRESS_STATES.includes(status.state) && status.progress.received > 0
}
var AUTO_UPDATE_STATUS_FILE,
  AUTO_UPDATE_RESUMABLE_MARKER,
  AUTO_UPDATE_STATES,
  CHANNELS,
  RESULT_STATUSES,
  IN_PROGRESS_STATES,
  tmpCounter
var init_autoUpdateStatus = __esm({
  'src/cli/lib/autoUpdateStatus.ts'() {
    'use strict'
    AUTO_UPDATE_STATUS_FILE = 'auto-update-status.json'
    AUTO_UPDATE_RESUMABLE_MARKER = '[resumable]'
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
    IN_PROGRESS_STATES = ['downloading', 'verifying', 'swapping', 'handover']
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
function isReminderProbeFailure(value) {
  return typeof value === 'string' && REMINDER_PROBE_FAILURES.includes(value)
}
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
  const { installed, latest, state, checkedAt, retryAfter, stale, lastError } = cache2
  if (
    !isReminderVersion(installed) ||
    typeof checkedAt !== 'number' ||
    !Number.isSafeInteger(checkedAt) ||
    checkedAt < 0 ||
    checkedAt > now ||
    typeof retryAfter !== 'number' ||
    !Number.isSafeInteger(retryAfter) ||
    retryAfter < 0
  )
    return null
  if (stale !== void 0 && typeof stale !== 'boolean') return null
  if (lastError !== void 0 && !isReminderProbeFailure(lastError)) return null
  if (state === 'unknown') {
    if (latest !== null || retryAfter !== checkedAt + REMINDER_RETRY_MS) return null
    if (stale === true) return null
  } else {
    if (!['behind', 'current', 'ahead'].includes(state ?? '') || !isReminderVersion(latest))
      return null
    if (stale === true) {
      if (retryAfter <= checkedAt) return null
    } else if (retryAfter !== 0) return null
  }
  return {
    schemaVersion: 1,
    identity: { ...identity },
    installed,
    latest: latest ?? null,
    state,
    checkedAt,
    retryAfter,
    ...(stale === true ? { stale: true } : {}),
    ...(lastError !== void 0 ? { lastError } : {}),
  }
}
function readReminderCache(cachePath, identity, now = Date.now()) {
  let descriptor
  try {
    descriptor = fs.openSync(cachePath, fs.constants.O_RDONLY | fs.constants.O_NONBLOCK)
    const stat = fs.fstatSync(descriptor)
    if (!stat.isFile() || stat.size > REMINDER_MAX_BYTES) return null
    const buffer = Buffer.alloc(REMINDER_MAX_BYTES + 1)
    const bytes = fs.readSync(descriptor, buffer, 0, buffer.length, 0)
    if (bytes > REMINDER_MAX_BYTES || bytes < stat.size) return null
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
  if (cache2.stale === true) return true
  return cache2.state === 'unknown' || now - cache2.checkedAt >= REMINDER_TTL_MS
}
function isReminderWorkerActive(cachePath, now) {
  try {
    const lock = fs.statSync(`${cachePath}.lock`)
    return now - lock.mtimeMs < REMINDER_LOCK_STALE_MS
  } catch {
    return false
  }
}
var REMINDER_TTL_MS,
  REMINDER_RETRY_MS,
  REMINDER_MAX_BYTES,
  REMINDER_LOCK_STALE_MS,
  REMINDER_PROBE_FAILURES
var init_updateReminderCache = __esm({
  'src/cli/lib/updateReminderCache.ts'() {
    'use strict'
    REMINDER_TTL_MS = 24 * 60 * 60 * 1e3
    REMINDER_RETRY_MS = 60 * 60 * 1e3
    REMINDER_MAX_BYTES = 16 * 1024
    REMINDER_LOCK_STALE_MS = 3e4
    REMINDER_PROBE_FAILURES = [
      'github-rate-limited',
      'github-timeout',
      'github-unavailable',
      'npm-unavailable',
      'invalid-version',
    ]
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

// src/compile/updateReminderEntrypoint.ts
init_package()
init_autoUpdateStatus()
init_updateReminderPreferences()
import { createHash } from 'node:crypto'
import { statSync } from 'node:fs'
import { homedir as homedir2 } from 'node:os'
import { dirname as dirname3, isAbsolute, join as join4, resolve as resolve3 } from 'node:path'
import { fileURLToPath as fileURLToPath2 } from 'node:url'

// src/cli/updateReminderHookMain.ts
init_autoUpdateNotice()
init_autoUpdateStatus()
init_updateReminderCache()
import childProcess from 'node:child_process'
async function runUpdateReminderHook(options) {
  try {
    const now = (options.now ?? Date.now)()
    const write =
      options.write ??
      ((text) => {
        process.stdout.write(text)
      })
    let resumable = false
    if (options.statusPath) {
      try {
        const status = readAutoUpdateStatus(options.statusPath)
        const notice = status?.notice ?? null
        if (notice && isPrintableAutoUpdateNotice(notice)) {
          write(`${formatAutoUpdateNotice(notice)}
`)
          consumeAutoUpdateNotice(options.statusPath, now)
        }
        resumable = hasResumableAutoUpdateWork(status)
      } catch {}
    }
    const cache2 = readReminderCache(options.cachePath, options.identity, now)
    if (options.enabled && cache2?.state === 'behind') {
      try {
        const known = cache2.stale === true ? ' (last known)' : ''
        write(
          `Harnessed update available: ${cache2.installed} -> ${cache2.latest}${known}. Run /harnessed-update.
`,
        )
      } catch {}
    }
    if (
      (options.enabled || options.autoUpdate) &&
      (shouldRefreshReminder(cache2, now) || resumable) &&
      !isReminderWorkerActive(options.cachePath, now)
    ) {
      const spawn = options.spawn ?? childProcess.spawn
      const child = spawn(options.worker.executable, options.worker.args, {
        detached: true,
        stdio: 'ignore',
        windowsHide: true,
        shell: false,
      })
      child.once('error', () => {})
      child.unref()
    }
  } catch {}
  return 0
}

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
      explicitStateRoot = resolve3(value)
    } else return null
  }
  const nativeHome = resolve3(
    (host === 'codex' ? process.env.CODEX_HOME?.trim() : process.env.CLAUDE_CONFIG_DIR) ||
      join4(homedir2(), host === 'codex' ? '.codex' : '.claude'),
  )
  const stateRoot = explicitStateRoot ?? canonicalStateRoot(host)
  const channel = options.compiled ? 'binary' : process.versions.bun ? 'bun' : 'npm'
  const source = channel === 'binary' ? BINARY_SOURCE : `${channel}:harnessed`
  const fingerprint = createHash('sha256')
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
    cachePath: join4(stateRoot, `update-reminder-${host}.json`),
    preferencesPath: join4(stateRoot, UPDATE_REMINDER_PREFERENCES_FILE),
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
          : join4(
              dirname3(fileURLToPath2(import.meta.url)),
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
async function runUpdateReminderEntrypoint(options = {}) {
  try {
    const runtime = resolveUpdateReminderRuntime(options)
    if (!runtime) return 0
    const consents = readConsents(runtime.preferencesPath)
    if (!anyConsent(consents)) return 0
    if (!statSync(runtime.stateRoot).isDirectory()) return 0
    return await runUpdateReminderHook({
      ...runtime,
      enabled: consents.enabled,
      autoUpdate: consents.autoUpdate,
    })
  } catch {}
  return 0
}

// bin/harnessed-update-reminder.mjs.entry.ts
await runUpdateReminderEntrypoint()
