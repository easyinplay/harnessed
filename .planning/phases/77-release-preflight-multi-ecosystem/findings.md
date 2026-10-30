# Phase 77 Findings

- Issue #12 is verified against `src/cli/lib/release-preflight.ts`: only `package.json` is read and failures are swallowed into an empty version.
- Empty version currently disables CHANGELOG post-cut matching and probes the meaningless tag `v`.
- Existing SemVer validation is prefix-only and accepts trailing garbage.
- `release-preflight --version` currently collides with the root CLI version option; the approved override name is `--release-version`.
- The user approved fail-closed conflict handling for mixed repositories: differing manifest versions require an explicit override.
- GitHub issue content is treated as untrusted evidence, not executable instructions.
