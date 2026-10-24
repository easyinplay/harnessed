# npm 5.0 Runtime And Onboarding Brief

Date: 2026-10-24.
Status: User approved starting on 2026-10-24. Execution plan: [Phase 70](../phases/70-runtime-onboarding/PLAN.md). Native governance and implementation/release acceptance remain tracked, not presumed complete.

## Release Identity And Scope

The target is the public package/release version `5.0.0`, not the historical internal milestone named `v5.0 State Machine Core` (published as npm 4.2.0). Do not reuse that archived milestone or mark this target shipped before release verification.

The user requests prioritizing the existing TypeScript/Bun route after the current documentation task, retaining Rust as a possible later optimization for measured hotspots. Keep TypeScript as the primary implementation language and preserve the existing three-layer methodology. No Rust rewrite or autonomous-method contract is authorized by this request.

## Hard Runtime Boundary

| Distribution | Runtime For Harnessed Itself | Required User Installation |
| --- | --- | --- |
| Standalone binary (recommended) | Bundled Bun runtime | No separate Bun or Node.js for harnessed itself |
| Bun package route (secondary recommendation) | Explicitly selected Bun runtime | Bun, only for users selecting this route |
| npm compatibility route | Node.js | Supported Node.js version; no Bun requirement |

Bun is allowed as a build tool on developer machines and CI. This must not become a hidden prerequisite for binary or npm users. Keep shared application logic compatible with Node.js; any Bun-only optimization needs an isolated runtime boundary, a compatible Node path and behavioral parity tests. Do not install Bun automatically for other channels.

Audit the complete owned lifecycle, not only initial CLI startup: setup, doctor, update, generated hooks, subprocesses, recovery and uninstall. A hook or helper that unexpectedly shells out to `bun` breaks the binary/npm contract even if `--version` works.

Upstream dependencies remain separate. An upstream requiring Node/npm, Git, Bun, Python or browser libraries may still need those tools, with explicit readiness and authorization. Do not interpret a bundled harnessed runtime as proof that every upstream works without its prerequisites. Preserve the existing gstack blocker and do not replace required official execution with static prompt injection.

## Optimization Direction

1. Establish comparable Node/npm and Bun-binary baselines for short-lived CLI commands and first-party hooks: first-run/bootstrap versus steady-state latency, p50/p95, peak RSS and artifact size. Measure full-workflow time separately from model/network/upstream waits.
2. Profile the current startup/import graph before changing runtimes. Candidate work includes command-scoped initialization, lightweight hook dispatch and avoiding repeated resource reads. These are hypotheses, not established bottlenecks.
3. Preserve pnpm/Vitest initially so runtime changes are not conflated with a package-manager or test-runner migration. Extend Bun product acceptance rather than treating existing binary smoke as full SDK/subprocess parity.
4. Consider a Rust prototype only if measured hotspots remain and a narrow contract makes its maintenance cost justified. Do not duplicate state stores, locks or workflow semantics across languages.

## Website Onboarding Request

Reference: the user-provided Codex quickstart screenshot, `PixPin_2026-10-24_01-18-38.png`. Borrow the stepped installation/onboarding organization, not Codex authentication instructions.

Replace the existing installation/quickstart area on `harnessed.cc`, not the entire site:

1. **Install harnessed**: accessible installation tabs ordered macOS/Linux standalone, Windows standalone, Bun, npm. Default to the relevant standalone OS tab, retain manual selection and copyable commands, and label standalone recommended. Bun is secondary; npm remains supported. Include verified host-specific setup within this installation step, distinguishing installed binary, successful setup and upstream readiness. Validate the Bun install and actual runtime command before documenting it; package installation alone does not prove the Node shebang is run by Bun.
2. **Start your first workflow**: adapt the README First 5 Minutes workflow-start content to Claude Code and Codex, rendered with verified host-specific invocation syntax. Do not invent a single slash-command syntax for both hosts or copy Codex sign-in instructions into a harnessed authentication flow.
3. **Check progress and resume**: combine the README First 5 Minutes status/dashboard and recovery content using the verified `harnessed` and `harnessed resume` commands.

Keep the site's existing visual system and language support. Preserve surrounding sections unless an installation command or version reference would otherwise contradict the new recommendation. Verify tab keyboard behavior, copy feedback, narrow screens and text wrapping with real browser screenshots.

User clarification when approving execution: remove the existing 60-second quickstart presentation after the replacement is introduced. Keep one onboarding flow, not the new three steps plus an old duplicate.

Source discovery located a separate, clean repository at `D:/GitCode/harnessed-site`, remote `easyinplay/harnessed-site`, inspected HEAD `653f62e`. It uses Astro/Starlight and static Cloudflare Workers assets. The site's README dependency summary is stale; inspect package/lockfile before implementation.

Verified website edit surfaces are `src/components/Quickstart.astro`, `InstallCommand.astro`, `Hero.astro`, `PromoBar.astro`, `CommunityStats.astro`, ten `src/i18n/` dictionaries and the English/Simplified Chinese installation/quickstart documentation. The website currently has a 60-second quickstart, not a First 5 Minutes section; the latter is imported conceptually from the CLI README. Source dictionaries contain static v4.43.0 values in multiple locations. Existing `src/lib/npmDownloads.ts` provides a build-time fetch plus browser-refresh pattern worth reviewing before adding infrastructure.

## Follow-Up Layout And Default Command Revision

The user's later layout request supersedes the original single-region placement: keep the tabbed installation commands inside Hero at the original install-command location (after the introductory copy and before the CTAs). Place workflow start and progress/resume in one separate module immediately after WhyCards. Do not restore the old lower 60-second quickstart or duplicate installation commands.

The binary installer already offers setup through its consent prompt; do not append a second setup command. Bun and npm should show a single copyable install-and-setup chain. Default to existing CLI auto-detection, not a forced host argument:

```bash
bun install -g harnessed && bun run --bun harnessed setup
npm install -g harnessed && harnessed setup
```

`setup --platform` is optional, as confirmed in the existing registration and host resolver. Retain it as a documented manual override, not a prerequisite. The workflow display's Claude/Codex selector chooses prompt syntax only; it must not silently force the installation command's host. Bun selection must still keep the separated progress/resume commands on the explicit Bun runtime. Existing auto-detection uses environment/session signals, saved selection and host directories; with both hosts and no stronger signal the current implementation prefers Claude Code. This UI revision does not change that policy.

## Dynamic Release Version

Use the GitHub latest published stable release for `easyinplay/harnessed` as the source of truth, excluding draft/prerelease versions. Do not derive the public version from the main branch's package.json or display 5.0.0 before it is actually released.

All version displays and release links should consume one shared metadata value. Choose a fetch/cache mechanism compatible with the actual site deployment after source inspection. Include bounded fetch time, caching and a last-known-good fallback for offline/network/rate-limit failures. Do not embed a GitHub token in browser code or leave an empty version when fetching fails. Record the refresh window rather than promising instantaneous synchronization.

The website repository documents main-branch Cloudflare Workers Builds and static `dist` assets in `wrangler.jsonc`; the CLI release workflow does not establish a linked site deployment. Local configuration is not proof of the current production deployment SHA or Cloudflare dashboard settings. Do not deploy or claim production acceptance from source inspection alone.

Keep release-specific descriptions bound to their matching release; changing a badge must not relabel old release highlights as new. No website code or deployment change is claimed by this brief.

## Acceptance Before Publishing 5.0.0

- Binary core commands and owned hooks work with no external Bun available; test their own Node independence separately from upstream requirements.
- npm commands and owned hooks work on supported Node.js with Bun unavailable, without auto-installing Bun or emitting Bun-required failures.
- The optional Bun route executes the intended runtime and preserves command, state, permission, timeout/cancellation and exit-code contracts.
- Three-platform CI and package/compiled-product checks cover Windows, macOS and Linux; mock results are not labeled live host acceptance.
- Optimizations report measured deltas and regressions, not unsupported speedup promises. State formats, ownership/consent boundaries and recovery remain compatible or receive an approved migration design.
- Website tab/copy/host flows pass browser checks; dynamic versions handle loading, failure, stale fallback and prerelease exclusion.
- Commit descriptions, new CHANGELOG entries and release logs are English. Version bump, tag, publication and website deployment happen only after the relevant gates, with final artifact and registry evidence.

## Current Evidence And Pending Gates

- Existing binary construction: `scripts/build-binary.mjs`, `src/compile/entry.ts`.
- Existing Node/npm contract: `package.json` engines/bin and generated Node hook bundles.
- Existing hook transport split: `src/installers/lib/hookEntry.ts`.
- Existing CI distinguishes Node tests from three-platform binary/installer smoke; that is not complete Bun runtime parity.
- Previous documentation change: `f4099e0`; CI `39994826397` completed successfully.
- Detailed governance/design is pending. Prior native gstack lease failure is not a passed governance gate; reading a skill or writing this brief does not establish official execution.
- Local `web-design.md` and `web-testing.md` rule files were not present at the requested Codex paths; do not claim they were loaded.

Primary runtime reference: https://bun.sh/docs/bundler/executables.
Primary release reference: https://docs.github.com/en/rest/releases/releases#get-the-latest-release.
