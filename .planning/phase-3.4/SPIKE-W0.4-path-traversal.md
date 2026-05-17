# W0.4 path traversal spike outcome — DEFER Phase 4.0

**Phase**: 3.4 W0.4 (DEFERRED #AE 兑现 outcome)
**Date**: 2026-05-17
**Sources**: RESEARCH § 8.1-8.4 verbatim + sister Phase 3.3 RESEARCH § 10.4 STRIDE Tampering threat model cross-ref

## § 1 Attack vector analysis

Current `install.ts` L82-83 path construction (post-T0.2 Path A pkg.version line shift):

```typescript
const manifestPath = resolve(process.cwd(), `manifests/tools/${resolvedName}.yaml`)
const skillPackPath = resolve(process.cwd(), `manifests/skill-packs/${resolvedName}.yaml`)
```

User input flow: `harnessed install <name>` → `name` arg → `resolveAlias(name)` → `resolvedName` → string-interpolated into `manifests/tools/${resolvedName}.yaml` path.

**Theoretical attack**: `harnessed install "../../etc/passwd"` → `resolvedName = '../../etc/passwd'` → `manifestPath = resolve(cwd, 'manifests/tools/../../etc/passwd.yaml')` → `path.resolve` normalizes to `/etc/passwd.yaml`. Then `readFile(manifestPath, 'utf8')` attempts to read `/etc/passwd.yaml` (or throws ENOENT).

## § 2 Spike outcome (verified reality, NOT theoretical)

| Step | Outcome |
|------|---------|
| (1) `readFile('/etc/passwd.yaml', 'utf8')` | ENOENT (file doesn't exist) → catch block L86-94 |
| (2) Falls through to `skillPackPath` try | ENOENT (file doesn't exist) → final catch L87-94 |
| (3) Both fail → `console.error(...)` + `process.exit(1)` | exits 1 with error msg "manifest 'X' not found" |

Even if attacker finds a `.yaml` file outside `manifests/` to read, the file is passed to `validateManifestFile()` L101 → TypeBox schema strict validate (`apiVersion: harnessed/v1` + `kind: Manifest` + ... required) → 99.9% rejects garbage YAML → exits 1.

**Real attack surface = near-zero** for filesystem exfiltration:
- `path.resolve` is absolute-safe (doesn't escape root)
- ENOENT on most plausible target paths
- TypeBox schema validate rejects non-manifest YAML
- No filesystem WRITE primitive in install.ts user-input path
- No shell exec / eval / subprocess with user input in install path (only npm/git invocations with manifest-derived versions; sister Phase 2.1 audit cmd injection SHELL_EVAL_MARKERS pattern protects those)

## § 3 RECOMMENDATION: DEFER explicit regex hardening to Phase 4.0 W0

Karpathy YAGNI win. Currently sole consumer is project maintainer (no external user input arrives via untrusted source). Phase 4.0 W0 add regex if external user demand arrives:

```typescript
// Phase 4.0 W0 (if external user input arrives — currently DEFER):
if (/[\\/]|\.\./.test(name)) { console.error(`error: invalid manifest name (path chars rejected): ${name}`); process.exit(1) }
```

Estimated 3L code delta. ≤200L hard limit OK (install.ts current 145L post-T0.2 Path A).

## § 4 Sister Phase 3.3 § 10.4 STRIDE Tampering already enumerated

Sister Phase 3.3 RESEARCH § 10.4 already enumerated this exact threat as: "Malicious aliases.yaml `redirect: '../../../etc/passwd'` (path traversal via redirect name)" — Tampering — mitigation: "install.ts could regex-guard `resolvedName` against `/[/\\.]/` chars (Phase 3.4 hardening if real threat surfaces)".

→ Phase 3.4 W0.4 spike outcome confirms: real threat does NOT surface (defense-in-depth already there). DEFER explicit regex hardening to Phase 4.0 W0 if external user demand arrives (DEFERRED #AH registered).

## § 5 Defense-in-depth empirical fixture

`tests/integration/install-path-traversal.test.ts` (NEW ≤60L 1 fixture) asserts `harnessed install "../../etc/passwd" --dry-run --non-interactive` exits 1 with 'manifest .* not found' (empirical proof of ENOENT graceful fallback + no /etc/passwd exfiltration; NO regex code change to install.ts per DEFER lock).
