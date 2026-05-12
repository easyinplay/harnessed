# Security Policy

## Supported Versions

harnessed v0.1.0-alpha is **pre-release**; no production security guarantees.
Once v1.0.0 ships, security fixes will be backported to the latest minor version.

## Reporting a Vulnerability

**Do not file public GitHub issues for security vulnerabilities.**

Use one of:

1. **GitHub Security Advisories** (preferred): https://github.com/easyinplay/harnessed/security/advisories/new
2. **Email**: easyinplay@gmail.com (subject prefix `[harnessed-security]`)

### Scope

In-scope vulnerabilities:

- Manifest validator security boundary bypass (`src/manifest/security.ts` shell-escape detection)
- Routing engine prompt injection (when phase 1.4+ ships)
- Installer arbitrary code execution beyond declared upstream `cmd` (when phase 1.2+ ships)
- Schema artifact tampering vectors

Out-of-scope:

- Vulnerabilities in **upstream packages** themselves (gstack / GSD / ralph-loop / Tavily MCP / Exa MCP / ctx7 / planning-with-files / superpowers / mattpocock-skills / karpathy-skills) — report to those projects directly. harnessed only describes them via manifests; trust delegation is by design (see `THREAT-MODEL.md` when v0.4 ships).
- Issues requiring a malicious user already having write access to a victim's `manifests/` directory.

### Response SLA

- Acknowledgment: **48 hours**
- Initial assessment: **7 days**
- Fix or disclosure decision: **30 days** (CVE assignment if applicable)

## Disclosure Policy

We follow coordinated disclosure: 90-day default window, extendable on mutual agreement. Researchers receive credit in `NOTICES.md` and the release notes for the fix.

## Known Limitations (v0.1 phase 1.1.1)

- Installer (`cc-plugin-marketplace` / `git-clone-with-setup` / `npm-cli` / `mcp-stdio-add` methods) **not yet shipped** — security model is "validator-only" until phase 1.2.
- Schema enforces 3 dangerous shell-escape patterns (`$(...)`, `${...}`, backtick) at the validator level (`src/manifest/security.ts`); dangerous yaml tags are rejected at parse time by `yaml@2.x` default schema. Bypass attempts are themselves valid security reports.
- `git_ref` field on `cc-plugin-marketplace` and `git-clone-with-setup` install methods is regex-pinned to SHA (7-40 hex) or SemVer tag — branch refs (HEAD/main/master) are rejected to prevent silent drift.

## See Also

- `docs/adr/0001-manifest-schema-v1.md` § "字段拒绝清单" — schema-level security 约束
- `vendor/ENTRY-CRITERIA.md` — vendor 准入门槛
- `PROJECT-SPEC.md` § 7 — 风险登记
- `PROJECT-SPEC.md` § 8.2 / 8.3 — vendor + hook 安全约束
