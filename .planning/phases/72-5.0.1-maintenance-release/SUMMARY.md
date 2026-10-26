# Phase72 Summary

Date: 2026-10-27 (Asia/Shanghai). Status: complete; public npm/GitHub version5.0.1.

## Delivered

- Cut the verified package-update dry-run safety correction: dry-run now remains read-only for default npm, explicit npm and explicit Bun under both package runtimes, including upstream/all flags.
- Simplified installation documentation across all11 README translations, retained one Bun install/setup command and explicit-runner caveat, and removed the redundant AI installation guide.
- Removed project-local Claude configuration from Git tracking while preserving local files and user-level installation behavior.

## Verification And Publication

- Carried Phase71 evidence:4468 serialized tests, updater RED16/GREEN69, focused156 tests, docs30, build and lint.
- Candidate96f338c rebuilt at5.0.1 and passed docs30, build/types/hooks, lint and exact-source CI40353980387 nine/nine.
- User explicitly confirmed publication after isolated preflight passed4/4. Tagv5.0.1 was pushed once; publish40355172102 passed4/4.
- Public npm briefly exposed propagation states (version404/latest5.0.0) before converging to5.0.1. Actual tarball1,197,184 bytes matched SHA512/SHA1, installed117 packages in an owned prefix, and the installed CLI printed5.0.1.
- All nine GitHub assets were downloaded. Binary hashes and Ed25519 signatures passed for macOS/Linux/Windows; tampered checksum text was rejected. The Windows executable printed5.0.1 in an isolated HOME/state and unpacked167 assets.
- Four real production website contexts each observed four version/link nodes move fromv5.0.0 tov5.0.1 with HTTP200 and no page errors or overflow.

## Limits

- The first binary verifier pass incorrectly passed base64 signature text as raw signature bytes and reported three false failures; corrected base64 decoding passed all signatures. The error and correction are retained in binary-acceptance.json.
- npm registry propagation and the browser sidecar model-rate limit were handled by bounded retries/main-session execution; neither is a product failure. Website screenshots were captured but not visually inspected by the main session because image input was unavailable.
- No native gstack governance pass, lock bypass, upstream setup, real global upgrade, runtime-mode change or new host was claimed or performed.

Evidence: [release receipt](../../releases/5.0.1.md), [npm acceptance](../../releases/5.0.1/npm-acceptance.json), [binary acceptance](../../releases/5.0.1/binary-acceptance.json), and the external site receipt `D:/GitCode/harnessed-site/.planning/npm-onboarding/release-5.0.1-site.md`.
