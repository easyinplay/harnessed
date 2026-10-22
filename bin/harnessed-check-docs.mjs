#!/usr/bin/env node
// biome-ignore-all format: esbuild-generated (hook drift gate owns this file)
// biome-ignore-all lint: esbuild-generated
// biome-ignore-all assist/source/organizeImports: esbuild-generated

// src/cli/checkDocs.ts
import { existsSync, readFileSync as readFileSync2 } from "node:fs";
import { join as join2 } from 'node:path'

// src/i18n/index.ts
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// messages/en.json
var en_default = {
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
  'agent_teams.missing_fix': '   fix: claude config set env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS 1',
  'agent_teams.missing_explanation':
    '   harnessed task parallelism uses Subagent or Agent Teams (CC 2.1.178+)',
  'agent_teams.missing_nonblocking': '   non-blocking \u2014 auto-degrades to subagent fan-out\n',
  'install.manifest_not_found': "error: manifest '{{name}}' not found",
  'install.manifest_not_found.fix':
    '  fix:  ensure manifests/tools/{{name}}.yaml, manifests/skill-packs/{{name}}.yaml, or manifests/optional/{{name}}.yaml exists',
  'install.audit_hint': "  fix:  run 'harnessed audit' to inspect manifest issues",
  'install.success': 'installed {{name}}',
  'install.success_with_version': 'installed {{name}}@{{version}}',
  'install.already_installed': 'already-installed {{name}} (idempotent check hit; nothing to do)',
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
  'uninstall.unified.removed_settings': '  removed harnessed env vars from ~/.claude/settings.json',
  'uninstall.unified.removed_hooks':
    '  removed {{count}} harnessed hook(s) from ~/.claude/settings.json',
  'uninstall.unified.removed_state_dir': '  removed ~/.claude/harnessed/',
  'uninstall.unified.partial_failure':
    '\n{{count}} item(s) could not be removed (permission denied or already gone):',
  'uninstall.unified.complete': "uninstall complete \u2014 harnessed's own files have been removed",
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
  'gc.ledger_pruned': 'pruned {{count}} stale workflow slot(s) from the ledger (kept {{kept}}):',
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
}

// src/i18n/index.ts
var currentLocale = null
var cache = {}
function mapToSupported(raw2) {
  if (!raw2) return 'en'
  if (/^zh([^a-z]|$)/i.test(raw2)) return 'zh-Hans'
  return 'en'
}
function detectLocale() {
  const raw2 =
    process.env.HARNESSED_LANG ||
    process.env.LC_ALL ||
    process.env.LANG ||
    process.env.LANGUAGE ||
    safeIntlLocale()
  return mapToSupported(raw2)
}
function safeIntlLocale() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().locale
  } catch {
    return void 0
  }
}
var wiredMessagesDirProvider = null
function messagesDir() {
  const here = dirname(fileURLToPath(import.meta.url))
  const candidates = []
  if (wiredMessagesDirProvider) {
    try {
      candidates.push(wiredMessagesDirProvider())
    } catch {}
  }
  candidates.push(resolve(here, '..', '..', 'messages'), resolve(here, '..', 'messages'))
  for (const c of candidates) {
    try {
      readFileSync(join(c, 'en.json'), 'utf8')
      return c
    } catch {}
  }
  return resolve(process.cwd(), 'messages')
}
function loadLocale(locale) {
  if (cache[locale]) return cache[locale]
  const path = join(messagesDir(), `${locale}.json`)
  try {
    const raw2 = readFileSync(path, 'utf8')
    cache[locale] = JSON.parse(raw2)
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

// src/platform/ablation.ts
function isAblated(env = process.env) {
  return env.HARNESSED_OFF === '1'
}

// src/cli/checkDocs.ts
var DEFAULT_MAX_STATE_LINES = 100
var KEY_DECISIONS_SECTION_RE = /^##\s+.*关键决议\s*ship\s*总结/gm
var KEY_DECISIONS_SECTION_LIMIT = 1
var HISTORICAL_ERRATA_RE = /W-[1-9]\s+errata|sister\s+review\s+M[1-9]\s+修正/
var ROADMAP_NARRATIVE_SIGNALS = [
  { id: 'commit-hash', test: hasCommitHash },
  { id: 'test-tally', test: (l) => /\b\d{2,}\s*\/\s*0\b/.test(l) },
  { id: 'ci-verdict', test: (l) => /\bCI\s+(green|red|绿|红)/i.test(l) },
  { id: 'lesson', test: (l) => /(教训|lesson\s*[:：]|lessons?\s+learned)/i.test(l) },
]
function hasCommitHash(line) {
  for (const m of line.matchAll(/\b[0-9a-f]{7,40}\b/g)) {
    if (/\d/.test(m[0]) && /[a-f]/.test(m[0])) return true
  }
  return false
}
function read(cwd, rel) {
  const p = join2(cwd, rel)
  if (!existsSync(p)) return null
  try {
    return readFileSync2(p, 'utf8')
  } catch {
    return null
  }
}
function contentLines(content) {
  const lines = content.split(/\r?\n/)
  if (lines[lines.length - 1] === '') lines.pop()
  return lines
}
function collectDocViolations(opts) {
  const limit = opts.maxStateLines ?? DEFAULT_MAX_STATE_LINES
  const out = []
  const state = read(opts.cwd, join2('.planning', 'STATE.md'))
  if (state !== null) {
    const lines = contentLines(state)
    if (lines.length > limit && !opts.allowLongState) {
      out.push({
        rule: 'state-digest-line-limit',
        tier: 'halt',
        file: '.planning/STATE.md',
        message: t('check_docs.state_line_limit', { lines: lines.length, limit }),
      })
    }
    const sections = state.match(KEY_DECISIONS_SECTION_RE) ?? []
    if (sections.length > KEY_DECISIONS_SECTION_LIMIT) {
      out.push({
        rule: 'state-key-decisions-section-limit',
        tier: 'warn',
        file: '.planning/STATE.md',
        message: t('check_docs.state_key_decisions', {
          count: sections.length,
          limit: KEY_DECISIONS_SECTION_LIMIT,
        }),
      })
    }
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] ?? ''
      if (HISTORICAL_ERRATA_RE.test(line)) {
        out.push({
          rule: 'state-historical-errata',
          tier: 'warn',
          file: '.planning/STATE.md',
          line: i + 1,
          message: t('check_docs.state_errata', { excerpt: line.trim().slice(0, 80) }),
        })
      }
    }
  }
  const roadmap = read(opts.cwd, join2('.planning', 'ROADMAP.md'))
  if (roadmap !== null) {
    const lines = contentLines(roadmap)
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] ?? ''
      const hits = ROADMAP_NARRATIVE_SIGNALS.filter((s) => s.test(line)).map((s) => s.id)
      if (hits.length > 0) {
        out.push({
          rule: 'roadmap-no-inline-narrative',
          tier: 'warn',
          file: '.planning/ROADMAP.md',
          line: i + 1,
          message: t('check_docs.roadmap_narrative', { signals: hits.join(', ') }),
        })
      }
    }
  }
  return out
}
function exitCodeFor(violations) {
  if (violations.some((v) => v.tier === 'halt')) return 2
  return violations.length > 0 ? 1 : 0
}
function shouldGateForHookPayload(raw2) {
  if (!raw2.trim()) return false
  let payload
  try {
    payload = JSON.parse(raw2)
  } catch {
    return false
  }
  if (payload?.tool_name !== 'Bash') return false
  const cmd = payload.tool_input?.command
  return typeof cmd === 'string' && /\bgit\s+(?:-\S+\s+)*commit\b/.test(cmd)
}
function codexHookOutput(code, lines) {
  const text = lines.join('\n')
  if (code === 2)
    return JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason: text,
      },
    })
  if (code === 1) return JSON.stringify({ systemMessage: text })
  return null
}
async function readStdin() {
  if (process.stdin.isTTY) return ''
  try {
    const chunks = []
    for await (const c of process.stdin) chunks.push(c)
    return Buffer.concat(chunks).toString('utf8')
  } catch {
    return ''
  }
}
async function runCheckDocsCommand(opts) {
  if (opts.hook && isAblated()) process.exit(0)
  if (opts.hook && !shouldGateForHookPayload(await readStdin())) process.exit(0)
  const parsed = Number(opts.maxStateLines)
  const violations = collectDocViolations({
    cwd: opts.cwd ?? process.cwd(),
    ...(Number.isFinite(parsed) && parsed > 0 ? { maxStateLines: parsed } : {}),
    allowLongState: !!process.env.HARNESSED_ALLOW_LONG_STATE,
  })
  const code = exitCodeFor(violations)
  const summary = code === 2 ? 'halt' : code === 1 ? 'warn' : 'pass'
  if (opts.hook && opts.platform === 'codex') {
    const lines = violations.map((v) => {
      const where = v.line === void 0 ? v.file : `${v.file}:${v.line}`
      return `${v.tier === 'halt' ? '\u2717' : '\u26A0'} ${where} [${v.rule}] ${v.message}`
    })
    const verdict = codexHookOutput(code, lines)
    if (verdict !== null)
      process.stdout.write(`${verdict}
`)
    process.exit(0)
  }
  if (opts.json) {
    console.log(JSON.stringify({ violations, summary, exit_code: code }, null, 2))
  } else if (violations.length === 0) {
    console.log(t('check_docs.clean'))
  } else {
    for (const v of violations) {
      const where = v.line === void 0 ? v.file : `${v.file}:${v.line}`
      console.error(`${v.tier === 'halt' ? '\u2717' : '\u26A0'} ${where} [${v.rule}] ${v.message}`)
    }
    console.error(
      code === 2
        ? t('check_docs.summary_halt', {
            halt: violations.filter((v) => v.tier === 'halt').length,
            warn: violations.filter((v) => v.tier === 'warn').length,
          })
        : t('check_docs.summary_warn', { warn: violations.length }),
    )
  }
  process.exit(code)
}

// src/cli/checkDocsHookMain.ts
var raw = process.argv.slice(2)
var args = raw[0] === 'check-docs' ? raw.slice(1) : raw
var value = (name) => {
  const at = args.indexOf(`--${name}`)
  if (at >= 0) return args[at + 1]
  const prefix = `--${name}=`
  return args.find((a) => a.startsWith(prefix))?.slice(prefix.length)
}
var has = (name) => args.includes(`--${name}`)
try {
  await runCheckDocsCommand({
    json: has('json'),
    cwd: value('cwd'),
    maxStateLines: value('max-state-lines'),
    hook: has('hook'),
    platform: value('platform'),
  })
} catch (error) {
  console.error(error.message)
  process.exit(1)
}
