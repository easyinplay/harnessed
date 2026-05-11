# Third-Party Notices

> Auto-populated by `harnessed install` from each manifest's
> `metadata.upstream.notice` field (see ADR-0001).
> v0.1.0 phase 1.1 starts empty; phase 1.2+ adds entries per upstream installed.

No third-party content vendored as of v0.1.0-alpha.1 (phase 1.1).

## Format (when populated)

Each entry follows the form:

```
### <upstream-name> (<license>)

<notice text from manifest metadata.upstream.notice>

Source: <repository URL>
Installed via: <install.method>
Pinned at: <git_ref or npm_version>
```

## Compliance

- All vendored content (`vendor/`) — see `vendor/ENTRY-CRITERIA.md` for whitelist
- All upstream dependencies — see `manifests/**/*.yaml` for full attribution data
- License compatibility — Apache-2.0 only accepts MIT / Apache-2.0 / BSD-3-Clause / ISC / 0BSD upstream
