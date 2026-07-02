// Phase 2.1 install method 6/6 — cc-skill-pack × npx-skill-installer per ADR
// 0004 § 5 + ADR 0007 install_type=npx + ADR 0010 errata D2.1-4/5/6.
//
// IMPL NOTE (Rule 1 / D2.1-4 + D2.1-5 — pinned skills@1.5.7 + --copy [--global]):
// the npx tool is `skills` (vercel-labs/skills). v1.5.7 is the research-pinned
// stable version (RESEARCH.md § 2). `--copy` is MANDATORY; `--global` is OPTIONAL:
//   - `--copy` materializes SKILL.md files into ~/.claude/skills/<name>/ instead
//     of symlinks (default symlinks break on Windows + on systems with
//     ~/.claude on a different volume than the npx cache). `--copy` ALONE already
//     installs into ~/.claude/skills/ (home/user-scope) — the path verify checks.
//   - `--global` only ADDITIONALLY suppresses the cwd copy. It is NOT required,
//     and some skill types (e.g. PromptScript) reject it outright
//     (`PromptScript does not support global skill installation`) — forcing it
//     would 300s-hang or fail those packs. So we make it opt-in per manifest.
// These flags are encoded by the manifest cmd string; we PRESERVE the user's
// cmd verbatim through spawnCmd, AND we assert `--copy` is present (preflight)
// to prevent silent mis-install (broken symlinks) via a typo'd manifest.
//
// IMPL NOTE (Rule 1 / D2.1-6 CRITICAL — real-path verify, NOT npx exit code):
// `npx skills add ... --copy --global` can exit 0 without actually writing
// SKILL.md to ~/.claude/skills/<name>/. Known causes:
//   - skills CLI default targets ~/.agents/ on some systems (D-02 bridge gap)
//   - npm prefix mis-configured
//   - permission errors silently swallowed by npx
// → verify by `test -f ~/.claude/skills/<name>/SKILL.md` (the REAL path).
// npx-success + verify-fail → InstallError keyword:'verify-failed' with a
// suggest pointing at the ~/.agents/ vs ~/.claude/ bridge limitation (D-02).
// This is the heart of the C6 directory-conflict gotcha — we cannot trust
// the spawn exit code; the filesystem is the only authority.
//
// IMPL NOTE (Rule 1 / D-1 reuse): thin orchestrator on top of spawnCmd. The
// real-path verify is fs-based (`fs.access` / `fs.stat`), not a spawned `test`
// — direct fs is faster, doesn't depend on /bin/test or cmd.exe behavior,
// and produces a clean Promise without process plumbing.

import { join } from 'node:path'
import { backup } from './lib/backup.js'
import { confirmAt } from './lib/confirm.js'
import { renderDiff } from './lib/diff.js'
import { err } from './lib/err.js'
import { detectSkillPresence, extractSkillName, isAlreadyInstalled } from './lib/idempotent.js'
import { detectPlatform, getSkillsDir } from './lib/platform.js'
import { preflight } from './lib/preflight.js'
import { DEFAULT_INSTALL_TIMEOUT_MS, DEFAULT_VERIFY_TIMEOUT_MS, spawnCmd } from './lib/spawn.js'
import { updateInstalled } from './lib/state.js'
import type { DiffPlan, Installer, InstallResult } from './lib/types.js'

export const installNpxSkillInstaller: Installer = async (ctx) => {
  const install = ctx.manifest.spec.install
  if (install.method !== 'npx-skill-installer') {
    return {
      ok: false,
      phase: 'preflight',
      error: err(
        ctx,
        '/spec/install/method',
        `installNpxSkillInstaller received non-npx-skill-installer method '${install.method}' (dispatch bug)`,
        'dispatch-mismatch',
      ),
    }
  }
  const pre = preflight(ctx)
  if (!pre.ok) {
    if (pre.abortReason === 'platform-mismatch')
      return { aborted: true, reason: 'platform-mismatch' }
    const e = pre.errors[0] ?? err(ctx, '/', 'preflight failed (no detail)', 'preflight')
    return { ok: false, phase: 'preflight', error: e }
  }
  // v3.9.6 — idempotent_check probe (skip install if already-installed).
  if (await isAlreadyInstalled(ctx)) {
    return { ok: true, alreadyInstalled: true, backupId: 'noop-idempotent' }
  }

  // D2.1-5 (relaxed) — assert --copy is present. `--global` is OPTIONAL.
  // `--copy` alone already materializes SKILL.md into ~/.claude/skills/<name>/
  // (Windows symlink-safe); `--global` only additionally suppresses the cwd
  // copy. Some skill types (e.g. PromptScript) DO NOT support --global at all
  // (`PromptScript does not support global skill installation`), so forcing it
  // would make those packs uninstallable. We still fail-loud on missing --copy
  // (without it the default symlinks break on Windows + cross-volume ~/.claude).
  if (!/\B--copy\b/.test(install.cmd)) {
    return {
      ok: false,
      phase: 'preflight',
      error: {
        ...err(
          ctx,
          '/spec/install/cmd',
          `npx-skill-installer cmd must include the \`--copy\` flag (D2.1-5)`,
          'skills-flags-required',
        ),
        suggest:
          '`--copy` materializes files into ~/.claude/skills/ (Windows symlink-safe); `--global` is optional and unsupported by some skill types (e.g. PromptScript)',
      },
    }
  }

  // v4.14.0 T4 — per-platform --agent injection. The skills CLI targets a
  // specific agent's skills dir; pinning it in manifest cmds hardcoded CC
  // (4.13.0 regression on codex). Inject from the active descriptor instead:
  // claude → claude-code, codex → codex (both verified valid agent ids via
  // `skills ls --agent` probe, findings.md). An explicit manifest --agent wins;
  // unknown platform ids inject nothing (skills CLI auto-detects).
  const AGENT_BY_PLATFORM: Record<string, string | undefined> = {
    claude: 'claude-code',
    codex: 'codex',
  }
  const platformId = detectPlatform().id
  const agentId = AGENT_BY_PLATFORM[platformId]
  const hasExplicitAgent = /(?:^|\s)(?:--agent|-a)\s/.test(install.cmd)
  const effectiveCmd =
    agentId && !hasExplicitAgent ? `${install.cmd} --agent ${agentId}` : install.cmd

  // L2 — per-user (<skillsDir>/<name>/). pure-create DiffPlan with SKILL.md as
  // the target file under HOME scope. rollback = rm -rf the skill dir.
  // v4.14.0 — skillsDir via descriptor (was hardcoded ~/.claude/skills).
  const name = ctx.manifest.metadata.name
  const skillSegment = extractSkillName(install.cmd, name)
  const skillDir = join(getSkillsDir(), skillSegment)
  const skillMdPath = join(skillDir, 'SKILL.md')
  const plan: DiffPlan = {
    files: [
      {
        target: skillMdPath,
        scope: 'HOME',
        oldText: '',
        newText: `// new SKILL.md created by: ${effectiveCmd}\n`,
      },
    ],
  }
  if (!ctx.opts.quiet) process.stdout.write(renderDiff(plan, ctx))

  const conf = await confirmAt('L2', { ...ctx, level: 'L2' })
  if (!conf.proceed) {
    const reason = conf.reason === 'flag-missing' ? 'level-flag-missing' : 'user-cancel'
    return { aborted: true, reason }
  }
  if (ctx.opts.dryRun) return { aborted: true, reason: 'user-cancel' }

  const bk = await backup(plan, ctx)
  if (!bk.ok) return { ok: false, phase: 'preflight', error: bk.error }

  // npx invocation (cmd from manifest + injected --agent; B1 re-screened by
  // spawnCmd — agent ids are alnum+dash, they pass checkCmdString).
  // v3.0.2: explicit install timeout (60s — npx cold cache + skills add filesystem traverse).
  const sp = await spawnCmd(ctx, effectiveCmd, [], DEFAULT_INSTALL_TIMEOUT_MS)
  if (!('exitCode' in sp)) return { ...sp, backupId: bk.backupId } as InstallResult
  if (sp.exitCode !== 0) {
    return {
      ok: false,
      phase: 'spawn',
      backupId: bk.backupId,
      error: err(
        ctx,
        '/spec/install/cmd',
        `npx skills add exited ${sp.exitCode}: ${sp.stderr.slice(0, 200)}`,
        'install-failed',
      ),
    }
  }

  // D2.1-6 CRITICAL — real-path verify. npx exit 0 ≠ files actually written.
  // v4.13.0 — probe via detectSkillPresence (shared with the idempotent_check
  // detector): indicator sub-skills + `--skill` name across ~/.claude/skills AND
  // ~/.agents/skills. Pre-4.13.0 this checked ONE hardcoded ~/.claude/skills
  // path built from the repo segment — multi-skill packs (mattpocock) and
  // --skill installs (design-taste-frontend) failed verify even on success.
  const present = await detectSkillPresence(install.cmd, name)
  if (!present) {
    return {
      ok: false,
      phase: 'verify',
      backupId: bk.backupId,
      error: {
        ...err(
          ctx,
          '/spec/verify/cmd',
          `npx skills add reported success but SKILL.md is missing at ${skillMdPath}; the skills CLI may have written to ~/.agents/ instead (D-02 bridge limitation) or the npm prefix is misconfigured`,
          'verify-failed',
        ),
        suggest: `check if SKILL.md exists at ~/.agents/${skillSegment}/SKILL.md (skills CLI default on some systems); if so, copy or symlink it into ~/.claude/skills/${skillSegment}/`,
      },
    }
  }

  // Optional secondary verify: run the manifest verify.cmd (often a grep
  // check) for parity with other installers and to surface install-specific
  // post-conditions like "CLAUDE.md was patched".
  // v3.0.2: verify honors spec.verify.timeout_ms (default 15s).
  const verifyTimeoutMs = ctx.manifest.spec.verify.timeout_ms ?? DEFAULT_VERIFY_TIMEOUT_MS
  // v23 (4.5.1) — verify cmds use POSIX builtins (test/grep/|); route through Git Bash on Windows.
  const vr = await spawnCmd(ctx, ctx.manifest.spec.verify.cmd, [], verifyTimeoutMs, {
    posixShell: true,
  })
  if (!('exitCode' in vr)) return { ...vr, backupId: bk.backupId } as InstallResult
  const expected = ctx.manifest.spec.verify.expected_exit_code ?? 0
  if (vr.exitCode !== expected) {
    return {
      ok: false,
      phase: 'verify',
      backupId: bk.backupId,
      error: err(
        ctx,
        '/spec/verify/cmd',
        `manifest verify cmd exit ${vr.exitCode} ≠ expected ${expected}: ${vr.stderr.slice(0, 200)}`,
        'verify-failed',
      ),
    }
  }

  await updateInstalled(ctx.cwd, name, install.npm_version, '')
  return { ok: true, backupId: bk.backupId, appliedFiles: [skillMdPath] }
}
