// Phase 2.1 install method 6/6 — cc-skill-pack × npx-skill-installer per ADR
// 0004 § 5 + ADR 0007 install_type=npx + ADR 0010 errata D2.1-4/5/6.
//
// IMPL NOTE (Rule 1 / D2.1-4 + D2.1-5 — pinned skills@1.5.7 + --copy --global):
// the npx tool is `skills` (vercel-labs/skills). v1.5.7 is the research-pinned
// stable version (RESEARCH.md § 2). `--copy --global` is mandatory:
//   - `--copy` materializes SKILL.md files into ~/.claude/skills/<name>/ instead
//     of symlinks (default symlinks break on Windows + on systems with
//     ~/.claude on a different volume than the npx cache)
//   - `--global` writes to ~/.claude/skills/ (user-scope) instead of cwd
// These flags are encoded by the manifest cmd string; we PRESERVE the user's
// cmd verbatim through spawnCmd, AND we assert the required flags are present
// (preflight) to prevent silent mis-install via a typo'd manifest.
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

import { access } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { backup } from './lib/backup.js'
import { confirmAt } from './lib/confirm.js'
import { renderDiff } from './lib/diff.js'
import { err } from './lib/err.js'
import { preflight } from './lib/preflight.js'
import { DEFAULT_INSTALL_TIMEOUT_MS, DEFAULT_VERIFY_TIMEOUT_MS, spawnCmd } from './lib/spawn.js'
import { updateInstalled } from './lib/state.js'
import type { DiffPlan, Installer, InstallResult } from './lib/types.js'

// Extract `<owner/repo>` from `npx ... skills@<ver> add <owner/repo> ...`.
// Used to compute the expected SKILL.md path. Falls back to manifest
// metadata.name when the `add <ref>` token is absent.
function extractSkillName(cmd: string, fallback: string): string {
  const m = cmd.match(/\bskills(?:@\S+)?\s+add\s+(\S+)/i)
  if (!m || m[1] === undefined) return fallback
  const ref = m[1]
  // If owner/repo, take repo (last segment). If single name, use as-is.
  const seg = ref.split('/')
  return seg[seg.length - 1] ?? fallback
}

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

  // D2.1-5 — assert pinned `skills@1.5.7` is referenced in the cmd. We require
  // an explicit pin (not @latest) for reproducibility (ADR 0001). Research
  // pinned 1.5.7 (RESEARCH.md § 2); we don't hardcode "1.5.7" here because a
  // future minor bump (1.5.8) should be allowed via manifest update. We only
  // enforce shape: skills@<version-spec>, not @latest.
  if (!/\bskills@(?!latest\b)\S+/.test(install.cmd)) {
    return {
      ok: false,
      phase: 'preflight',
      error: {
        ...err(
          ctx,
          '/spec/install/cmd',
          `npx-skill-installer cmd must reference a pinned skills@<version> (got: '${install.cmd.slice(0, 100)}'); @latest is forbidden for reproducibility (ADR 0001)`,
          'skills-pin-required',
        ),
        suggest: 'change `skills@latest` → `skills@1.5.7` (current research-pinned stable)',
      },
    }
  }

  // D2.1-5 — assert --copy and --global flags are present. Either order, but
  // both are mandatory (research § 2). Silent omission would result in
  // broken-on-Windows symlinks (no --copy) or cwd-scope skills (no --global).
  if (!/\B--copy\b/.test(install.cmd) || !/\B--global\b/.test(install.cmd)) {
    return {
      ok: false,
      phase: 'preflight',
      error: {
        ...err(
          ctx,
          '/spec/install/cmd',
          `npx-skill-installer cmd must include both \`--copy\` and \`--global\` flags (D2.1-5)`,
          'skills-flags-required',
        ),
        suggest:
          '`--copy` materializes files (Windows symlink-safe); `--global` targets ~/.claude/skills/ (user scope)',
      },
    }
  }

  // L2 — per-user (~/.claude/skills/<name>/). pure-create DiffPlan with
  // SKILL.md as the target file under HOME scope. rollback = rm -rf the
  // skill dir.
  const name = ctx.manifest.metadata.name
  const skillSegment = extractSkillName(install.cmd, name)
  const skillDir = join(homedir(), '.claude', 'skills', skillSegment)
  const skillMdPath = join(skillDir, 'SKILL.md')
  const plan: DiffPlan = {
    files: [
      {
        target: skillMdPath,
        scope: 'HOME',
        oldText: '',
        newText: `// new SKILL.md created by: ${install.cmd}\n`,
      },
    ],
  }
  process.stdout.write(renderDiff(plan, ctx))

  const conf = await confirmAt('L2', { ...ctx, level: 'L2' })
  if (!conf.proceed) {
    const reason = conf.reason === 'flag-missing' ? 'level-flag-missing' : 'user-cancel'
    return { aborted: true, reason }
  }
  if (ctx.opts.dryRun) return { aborted: true, reason: 'user-cancel' }

  const bk = await backup(plan, ctx)
  if (!bk.ok) return { ok: false, phase: 'preflight', error: bk.error }

  // npx invocation (cmd from manifest; B1 re-screened by spawnCmd).
  // v3.0.2: explicit install timeout (60s — npx cold cache + skills add filesystem traverse).
  const sp = await spawnCmd(ctx, install.cmd, [], DEFAULT_INSTALL_TIMEOUT_MS)
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
  // Use fs.access (faster, deterministic, cross-OS) instead of spawning `test`.
  try {
    await access(skillMdPath)
  } catch {
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
  const vr = await spawnCmd(ctx, ctx.manifest.spec.verify.cmd, [], verifyTimeoutMs)
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
