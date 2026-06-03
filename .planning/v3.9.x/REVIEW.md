---
phase: v3.9.x-uninstall-self
reviewed: 2026-05-27T00:00:00Z
depth: standard
files_reviewed: 4
files_reviewed_list:
  - src/cli/uninstall-self.ts
  - src/cli.ts
  - messages/en.json
  - tests/cli/uninstall-self.test.ts
findings:
  critical: 1
  warning: 4
  info: 4
  total: 9
status: issues_found
---

# Phase v3.9.x: Code Review Report — `harnessed uninstall-self`

**Reviewed:** 2026-05-27
**Depth:** standard
**Files Reviewed:** 4
**Status:** issues_found

## Summary

Reviewed the `uninstall-self` command implementation (new), its CLI registration (modified `src/cli.ts`), 19 i18n keys (modified `messages/en.json`), and 9 test cells (new). The implementation correctly follows the sister `src/cli/uninstall.ts` pattern (Commander + @clack/prompts + i18n + exit code conventions).

One BLOCKER: the `HARNESSED_ROOT_OVERRIDE` env var (designed for test isolation) is passed verbatim to `rm(path, { recursive: true, force: true })` without validation. If an attacker sets this to a destructive path (e.g., `/` or the user's home directory), the `uninstall-self --yes` command deletes arbitrary directories. The existing `getHarnessedRoot()` design was safe for read/create operations in other callers; this command is the first to use it for recursive deletion, making the latent design issue exploitable.

Four WARNINGs cover inflated discovery counts, silently swallowed removal errors, a misleading code comment, and test mock fidelity. Four INFO items cover an unused variable, a minor i18n typo, a redundant import, and an excessively weak test assertion.

## Critical Issues

### CR-01: `HARNESSED_ROOT_OVERRIDE` used as destructive `rm` target without path validation

**File:** `src/cli/uninstall-self.ts:110-113,208`, `src/installers/lib/harnessedRoot.ts:65-69`

**Issue:** `getHarnessedRoot()` returns the value of `HARNESSED_ROOT_OVERRIDE` verbatim when set (line 66-67 of harnessedRoot.ts). The `uninstall-self` command passes this trusted return value to `rm(root, { recursive: true, force: true })` at line 208. If an attacker or misconfiguration sets `HARNESSED_ROOT_OVERRIDE=/` (Unix) or `HARNESSED_ROOT_OVERRIDE=C:\` (Windows), the command recursively deletes the entire filesystem — or more realistically, a well-chosen writable path like the user's home directory. The harnessedRoot.ts comment says "Production code never sets this env var; the override has no effect on real CLI invocations" — this is a trust assumption, not a runtime guard. This command is the first caller to use `getHarnessedRoot()` for a destructive recursive `rm`; all prior callers used it for mkdir/read/write under the harneessed root, where the override was safe.

**Fix:** Add a path validation guard in `uninstall-self.ts` before the `rm` call:

```typescript
// Defense-in-depth: validate the state dir is a subpath of ~/.claude/
// before recursive deletion. Prevents HARNESSED_ROOT_OVERRIDE abuse.
const home = homedir()
const claudeDir = join(home, '.claude')
const resolvedRoot = resolve(harnessedRoot)
const normalizedClaude = resolve(claudeDir)
if (!resolvedRoot.startsWith(normalizedClaude + sep)) {
  console.error(t('uninstall_self.state_dir_blocked'))
  process.exit(1)
}
// ...proceed to rm(harnessedRoot, { recursive: true, force: true })
```

Alternatively, make `getHarnessedRoot()` validate its override at the library level so all future callers are protected.

## Warnings

### WR-01: `skillDirs` count is inflated — includes non-existent skill directories

**File:** `src/cli/uninstall-self.ts:129-133`

**Issue:** The loop builds `skillDirs` by joining `skillsDir` with every workflow name discovered from the bundled `workflows/` directory. These are bundled workflow names, not skill directories that actually exist at `~/.claude/skills/`. No `stat` or `access` call verifies existence before pushing. The inflated length propagates to the `discoverable` count (line 136), the summary display (line 147-148), and the removal counter `removedSkills` (line 217-218). Because `rm` is called with `force: true`, non-existent dirs are silently skipped, so the functional outcome is correct — but the user sees "removed 4 skill directory(ies)" even though only 1-2 actually existed and were removed. The comment at line 131 says "Use try/catch per dir since we can't stat without fs" but there is no try/catch — the comment describes intended behavior that was not implemented.

**Fix:**

```typescript
const skillDirs: string[] = []
for (const name of workflowNames) {
  const dir = join(skillsDir, name)
  try {
    await stat(dir)  // Verify existence before counting
    skillDirs.push(dir)
  } catch {
    // Directory doesn't exist or is inaccessible — skip
  }
}
```

This requires adding `stat` to the import from `node:fs/promises` at line 9.

### WR-02: Removal errors are silently swallowed — no warning at completion

**File:** `src/cli/uninstall-self.ts:175-213`

**Issue:** Each removal step swallows `rm`/`writeFile` errors with an empty `catch` block:
- Command file removal (line 179-181): empty catch, comment says "skip, warn at end" but no warning is emitted.
- Skill directory removal (line 190-192): empty catch, no warning.
- Settings modification (line 200-202): empty catch, no warning.
- State dir removal (line 210-211): empty catch, no warning.

If a permission error prevents deleting one command file, the user sees "removed 1 command file(s)" (for the successful one) and "uninstall-self complete" — no indication anything failed. Partial failure is indistinguishable from full success.

**Fix:** Collect failure paths and emit a warning section at the end:

```typescript
const failures: string[] = []

// In each catch block:
failures.push(`${path}: ${(e as Error).message}`)

// Before completion:
if (failures.length > 0) {
  console.error(t('uninstall_self.partial_failure', { failures: failures.join('\n  ') }))
}
```

Add a corresponding i18n key `uninstall_self.partial_failure`.

### WR-03: Console spy captures `console.warn` but `uninstall-self` only uses `console.log`/`console.error`

**File:** `tests/cli/uninstall-self.test.ts:46-49`

**Issue:** The test helper `runCli` spies on `console.warn` and routes output to `stdout` (lines 46-49), but the `uninstall-self.ts` implementation uses exclusively `console.log` (summary, removal, completion) and `console.error` (error messages, cancellation). The `console.warn` spy adds dead code and a slight risk: if a future change uses `console.warn`, it silently routes to `stdout` instead of `stderr`, which could mask output-destination bugs. This is consistent with the sister `uninstall.test.ts` helper (which also spies `console.warn` and routes to `stdout`), but the pattern is still questionable.

**Fix:** Either remove the `console.warn` spy (since the command doesn't use it) or route it to `stderr` to match expected behavior:

```typescript
vi.spyOn(console, 'warn').mockImplementation((...a: unknown[]) => {
  stderr += `${a.map(String).join(' ')}\n`
})
```

### WR-04: Test mock `stat` always returns `isDirectory: true` — fails to model nested workflow structure

**File:** `tests/cli/uninstall-self.test.ts:11`

**Issue:** The `stat` mock at line 11 returns `{ isDirectory: () => true }` unconditionally. This means every path (including files like `SKILL.md`) appears as a directory. In `scanWorkflowsNested`, this causes `discuss` and `verify` (which are actually nested 2-level dirs: `discuss/auto/`, `discuss/strategic/`, etc.) to be misidentified as flat top-level workflows with `SKILL.md`. The tests pass because assertions don't check the exact skill directory count, but the mock would not catch a regression where nested workflow names are incorrectly flattened by the scanning logic.

**Fix:** Model `stat` more accurately for the test scenario:

```typescript
const statMock = vi.mocked(stat)
// ...
function mockWithArtifacts(): void {
  statMock.mockImplementation(async (p: unknown) => {
    const path = String(p)
    if (path.endsWith('SKILL.md')) return { isDirectory: () => false } as any
    return { isDirectory: () => true } as any
  })
  // ...
}
```

## Info

### IN-01: Unused `total` variable

**File:** `src/cli/uninstall-self.ts:142`

**Issue:** `const total = discoverable + 1` is computed but never referenced. It was likely intended for a total-count summary line but was left orphaned.

**Fix:** Remove the line, or add a total-count summary message (e.g., `console.log(t('uninstall_self.summary.total', { total }))`).

### IN-02: `uninstall_self.yes_dryrun_conflict.fix` has awkward `| OR` phrasing

**File:** `messages/en.json:45`

**Issue:** The fix hint reads `"  fix:  harnessed uninstall-self --yes | OR harnessed uninstall-self --dry-run"`. The `| OR` uses two different separators redundantly. Compare with the sister key `uninstall.yes_dryrun_conflict.fix` at line 43, which uses cleaner parenthetical descriptions.

**Fix:**

```json
"uninstall_self.yes_dryrun_conflict.fix": "  fix:  harnessed uninstall-self --yes (immediate) OR harnessed uninstall-self --dry-run (preview)"
```

### IN-03: Redundant `resolve` import — `join` would suffice

**File:** `src/cli/uninstall-self.ts:11,114`

**Issue:** `resolve` is imported from `node:path` but used only once: `resolve(pkgRoot, 'workflows')`. Since `getPackageRoot()` already returns an absolute path, `join(pkgRoot, 'workflows')` produces the same result without the extra path-normalization step. `resolve` adds unnecessary complexity to the dependency footprint.

**Fix:** Replace `resolve(pkgRoot, 'workflows')` with `join(pkgRoot, 'workflows')` and remove `resolve` from the import.

### IN-04: Cell 3 assertion `rmMock.toHaveBeenCalled()` is too weak

**File:** `tests/cli/uninstall-self.test.ts:143`

**Issue:** The `--yes → remove artifacts` test only asserts `expect(rmMock).toHaveBeenCalled()`. This passes even if `rm` is called with wrong paths or called only once instead of for all expected targets. It does not verify the command actually removes the right things. Cells 7, 8, and 9 add more specific assertions, so this is not a gap — but cell 3 could be made more precise.

**Fix:** Add a minimal path check:

```typescript
const rmPaths = rmMock.mock.calls.map((c) => String(c[0]))
expect(rmPaths.length).toBeGreaterThan(2) // commands + skills + state dir
```

---

*Reviewed: 2026-05-27*
*Reviewer: Claude (gsd-code-reviewer)*
*Depth: standard*
