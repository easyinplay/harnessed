# Installer Failure Handoff

Date: 2026-10-23.

## Confirmed Input

The user installed standalone 4.49.2 and accepted the installer's setup prompt. Setup reported 12 verified base installations and one upstream-blocked gstack installation. The installer nevertheless printed only the self-update next step.

## Cause

`install.ps1` invokes the absolute installed binary with `setup` but does not inspect its native exit code before setting `ranSetup = true`. The installer's success-style tail therefore conflates a binary successfully installed with setup successfully completed.

A second outcome boundary has the same defect: `setup.ts` discards `runOptionalOffer` results, and its final exit code only considers base manifest failures. Declined optionals are not failures; explicitly selected optionals that fail must be reported in the final outcome.

## Boundaries

- Keep the successfully installed binary; do not uninstall or roll it back merely because setup is incomplete.
- Do not bypass gstack's upstream lease or change ACL/MSYS/native symlink policy.
- Do not auto-select hooks, trust plugins, or substitute code-review/code-simplifier implementations.
- Use isolated test fixtures, not a second real-machine installation.
- No new release is implied by this investigation.

## Verification

- Main-session build passed.
- Main-session setup/L4/optional regression: 12 files, 144 tests passed. Eval passed 14/14; scoped Biome and documentation discipline checks passed.
- Main-session real source setup: 13 base components, 12 verified already-installed and one gstack lease failure in 4.9 seconds. It printed `setup incomplete - 29 workflow(s) installed; 12 base component(s) configured; 1 component(s) failed (1 base, 0 optional).` and exited 1. No successful completion message was printed.
- Main-session combined installer/setup/L4/optional verification: 4 files, 76 tests passed; 5 Unix tests skipped on Windows. The installer fixture executes complete PowerShell 5.1 and 7 scripts through Invoke-Expression with isolated filesystem/checksum/cleanup behavior and a mocked native binary boundary. It verifies exits 1 and 23, catchable failure without killing the host, success and consent behavior.
- Worker verification ran all five Unix fixture scenarios in WSL, including actual execution of the printed retry command; shell syntax validation passed. Native macOS fixture verification is left to CI.
- Both installers retain the installed binary on setup failure, print an absolute retry command, and omit success-only next steps. PowerShell preserves LASTEXITCODE and throws a catchable terminating error; Unix exits with the original setup code.
- Final scoped Biome and diff checks passed. This source-only follow-up does not silently replace the installed 4.49.2 binary or constitute a new release. The main-branch one-line installer change and a future versioned CLI release are different delivery surfaces.
