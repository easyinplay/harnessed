# Handoff — harnessed → Devin

Written at the end of the Phase 85 session (Claude Code, 2026-11-09). This file is
self-contained: an agent picking it up cold should be able to continue without
reading the transcript.

## 1. What this repository is

`harnessed` is an **AI coding-harness package manager and composition orchestrator**.
It does not vendor upstream code. It describes third-party components
(Claude Code plugins, gstack, GSD, superpowers, ECC, mattpocock skills, …) as
**manifests** and installs them into a host harness (Claude Code or Codex),
generates slash-command workflows, and arbitrates between the heterogeneous
upstreams it composes.

- Stack: Node.js 22 + TypeScript + pnpm + vitest + biome. A compiled `bun`
  binary is published alongside the npm package.
- Entry points: `src/cli.ts` → `src/cli/*` (commands), `src/installers/*` (the
  six install methods), `src/manifest/*` (schema + validation),
  `src/platform/*` (host descriptors: claude / codex), `src/workflow/*`
  (the workflow/composition engine), `workflows/` (YAML workflow definitions +
  judgments + capabilities).
- Package name `harnessed`, published to npm, releases on GitHub with three
  platform binaries.

## 2. Read these first (state lives here)

| File | What it gives you |
|---|---|
| `.planning/STATE.md` | Current pointer digest (<100 lines). Read this first. |
| `.planning/ROADMAP.md` | Phase pointers, one line per phase. |
| `.planning/REQUIREMENTS.md` | Numbered acceptance criteria. |
| `.planning/TODOS.md` | The 12 open deferred items with their rationale. |
| `.planning/phases/<NN>-<slug>/` | Per-phase CONTEXT / PLAN / SUMMARY. |
| `.planning/releases/<version>.md` | Release receipts (facts + evidence). |
| `docs/adr/` | Architecture decision records (one decision per file). |
| `docs/host-contract.md` | The install/uninstall ownership contract in prose. |
| `CHANGELOG.md` | Per-version narrative (English). |

## 3. Current state (as of this handoff)

- Branch `main`, HEAD `9187c28` ("docs(state): record the v5.0.15 release and
  the Phase 85 closeout"). Local HEAD == remote `main`.
- **npm `latest` = 5.0.15** (published 2026-11-09). Tag `v5.0.15` → commit
  `c64081e`. CI `42547570579` 9/9, publish run `42548003335` 4/4, GitHub
  release has 9 assets.
- Phase 85 (force-update authorization) is closed; its decisions live in
  `.planning/phases/85-force-update-authorization/CONTEXT.md` + `SUMMARY.md`.
- Phase 84 (auto-update / self-update) shipped in 5.0.13 but its acceptance
  criterion 13 — *"the binary that gets replaced must itself carry the
  auto-update feature, so it can only be proven after v5.0.13"* — is still open
  and needs a real-machine check on a machine running the **binary** channel.
- No active milestone. `TODOS.md` holds the candidate work (see §8).

## 4. What Phase 85 changed — and the contracts you must not break

Before v5.0.0, `harnessed setup`'s force-update pass refused to replace
anything it could not prove, and **nothing could prove anything**: the
declared-ownership machinery (Phase 82) was never wired into the refusal
gates. Phase 85 added the missing half. The refusal itself is unchanged and
still fail-closed.

### 4.1 The four proof channels

A force-update refresh is authorized only when the existing footprint is
**provably ours**:

1. **Skill packs** (`npx-skill-installer`, `npm-cli`): the manifest declares
   `spec.ownership.resources`, and **every** existing entry the declaration
   selects must pass that resource's marker check
   (`snapshotDeclaredOwnership` ⊆ `discoverDeclaredOwnership`). Additionally
   every name in `spec.install.installs_skills` must be covered by a declared
   selector — otherwise the declaration does not bound what a refresh may
   overwrite (`declaredCoversSkillNames`).
2. **Marketplace plugins** (`cc-plugin-marketplace`): the host plugin registry
   holds the plugin under the **qualified** identity the install command
   installs (`name@marketplace`). A bare name under a different marketplace is
   NOT a proof.
3. **Cloned components** (`git-clone-with-setup`): the existing checkout's
   `origin` remote equals the manifest's clone URL, **and** the command writes
   nothing outside that checkout (`externalWriteTargets`). A copy-out command
   (the ui-ux-pro-max shape: clone into a cache, copy out into the shared
   namespace) stays refused.
4. **Global npm** (`npm install -g <pkg>`): package-name scoped, so no
   ownership proof is needed — but it is a system-scope (L4) write. It runs in
   system scope **only in the confirmation-driven force pass**, and the consent
   prompt names the components and the scope change. The normal install pass
   still requires the explicit `--system` opt-in, and the documented
   `harnessed setup --system --non-interactive --update-installed` path is
   unchanged.

### 4.2 The receipt semantics

The ownership receipt records the paths an install **owns**. A refresh creates
nothing new, so a "new paths only" receipt would be empty and the install would
fail on its own receipt. An authorized refresh therefore records the footprint
it just proved.

### 4.3 The ownership roots

`spec.ownership.resources[].root` is a closed set of five:

`platform-skills` (host skills dir) · `agents-skills` (`<userHome>/.agents/skills`
— where the `skills` CLI really installs when it is not given `--global`, and
where the host-skills-dir entry is only a symlink) · `native-home` ·
`host-agents` · `host-commands`.

Adding a root means touching three places plus the schema:
`src/manifest/schema/spec.ts` (typebox literal),
`src/installers/lib/ownershipContract.ts` (root list + path resolution),
`src/installers/lib/skillOwnershipReceipt.ts` (`declaredRootPath`), then
`pnpm build:schema` and committing `schemas/manifest.v1.schema.json`.

### 4.4 Marker rules

A marker is a plain substring inside a declared file. It has to hold for
**every** file the selector admits, on **both** hosts. The GSD pack was the
proof of that rule: its marker demanded `gsd-core` from every skill, agent and
command, and nine of its skills plus four of its agents never contain that
text — so the declaration proved nothing and the pack was refused like an
undeclared one. Its marker is now the artifact's own `gsd-` identity (claude
writes `name: gsd-x`, codex writes `name: "gsd-x"`).

### 4.5 Honest failure reporting

`keptExisting` entries carry a `retryable` flag. A refusal
(`update-unsupported`) is a **contract** decision — re-running setup cannot
change the outcome — so the summary says so and names the upstream tool, instead
of promising a retry that cannot succeed.

## 5. Environment (Windows) — read before touching the shell

- Default shell is **Git Bash (MSYS2)**. Use POSIX syntax, forward slashes,
  `/dev/null` (not `NUL`).
- Package manager: **corepack pnpm** (`corepack pnpm ...`). `pnpm` is not on PATH
  directly. Node 22, `bun` via winget.
- Tool preference (enforced by a hook): `rg` not `grep`, `fd` not `find`,
  `eza` not `ls`, `bat -pp` not `cat`, `jq` for JSON, `tldr` not `man`.
- **Never** put a command with `=>` or `>` inside an inline `node -e`/`python -c`
  — the shell turns it into a redirect and leaves 0-byte debris files in the
  repo root. Write the snippet to a file first.
- **Never** pipe a verification command and read the exit code of the pipe:
  `cmd | tail` reports `tail`'s status, not the command's. Redirect to a file
  and check `$?` instead.
- Inline snippets containing backticks or `$(` get mangled by the shell's
  double quotes — write them to a file.
- vitest's global timeout is **30 s** (raised deliberately for this repo).
  Raise per-test budgets, never lower them.

## 6. Network reality on this machine (important)

`github.com` over HTTPS (the git transport) is **unreachable** from this box:
`git push` fails with "Failed to connect to github.com:443". `api.github.com`
**is** reachable, and `gh` CLI works.

So a plain `git push` will fail. Two supported paths:

1. **Retry** — the outage was intermittent during this session; `curl` to
   `github.com` succeeded later for some IPs.
2. **Push through the GitHub REST Data API** (what was actually used for
   v5.0.15): create the blobs, the tree (with `base_tree`), the commit (same
   tree, same parents, same author/committer/date, **the raw message bytes** —
   `%B` appends a newline and changes the SHA) and finally PATCH the ref. The
   published commit SHA then equals the local one, so there is no divergence.
   Reference implementation: the flow used on 2026-11-09 is reproduced in §9.

Also note `gh auth token` prints a **credential** — never echo it into a file,
a commit, a log or a chat message. It was already leaked once (see
`TODOS.md`).

## 7. Conventions

- **Commits**: conventional-commit subject + English prose body +
  `Signed-off-by: easyinplay <easyinplay@gmail.com>`. Example:
  `feat(install): authorize the force-update pass when ownership is provable`.
- **CHANGELOG / release notes / release receipts**: English.
- **Commit with an explicit pathspec.** Another session shares this worktree;
  a bare `git commit` would sweep its half-finished index entries into your
  commit. Stage and commit the same explicit path list:
  `git add -- <paths> && git commit -F <msg-file> -- <paths>`.
- **Push policy**: pushing `main` after a harnessed commit is pre-approved.
  **Tagging and publishing still need the user's explicit go** (this session
  had it: "顺便发一下新版本").
- **Biome before every TS/JS commit**: `corepack pnpm exec biome check --write`.
  Three CI-red recurrences came from skipping it.
- **Schema regen needs a fresh build**: after touching `src/manifest/schema/*`,
  run `corepack pnpm build` and then `corepack pnpm build:schema`, and commit
  `schemas/manifest.v1.schema.json`. A stale `dist/` silently regenerates the
  old schema and the CI goes green on a lie.
- **Doc discipline** (three layers, one fact one home):
  `.planning/STATE.md` is a **digest** (<100 lines, pointer only — no history,
  no narratives); `.planning/ROADMAP.md` is one line per phase plus a pointer;
  the narrative of a phase lives in that phase's `SUMMARY.md`; the facts of a
  release live in `.planning/releases/<version>.md`. Hand-offs are transient —
  consume once, then archive; do not pile them in `.planning/` root.
- **Do not edit** `src/cli/facts.ts` (a known biome baseline warning lives
  there on purpose).

## 8. Verification — the exact gate list

Run in this order before pushing:

```bash
corepack pnpm exec tsc --noEmit                 # 0 errors
corepack pnpm exec biome check --write          # 0 blocking diagnostics
corepack pnpm exec vitest run --no-file-parallelism   # 455 files / 5644 tests, 0 failures
node scripts/check-deferred-items.mjs
node scripts/check-host-primitives.mjs
node scripts/check-provenance.mjs
node scripts/check-schema-consumers.mjs
node scripts/check-skill-i18n-parity.mjs
node scripts/check-state-archive-stale.mjs
node scripts/check-transparency-verdicts.mjs
node scripts/check-upstream-freshness.mjs
node scripts/check-workflow-schema.mjs
node scripts/check-yaml-i18n-parity.mjs
node scripts/ci/check-adr-baselines.mjs
node scripts/ci/check-biome.mjs
corepack pnpm build                             # regenerates dist/ and bin/
corepack pnpm build:hooks && git diff --exit-code bin/   # zero drift
```

Then push and **verify the CI conclusion yourself** (`gh run list` →
`conclusion == success`). Do not treat "pushed" as "green": in July 2026 a red
main sat for a week unnoticed, and macOS jobs are sometimes cancelled by the
runner with no runner assigned — those need `gh run rerun --failed`.

## 9. The API push fallback (reference implementation)

Save this as a file (not inline) and run `node <file> <commit-sha>` from the
repo root. It rebuilds the exact same commit through the API and moves
`refs/heads/main`.

```js
// push-via-api.mjs — push the EXACT local commit through the REST Data API.
// Why: this machine cannot reach github.com over HTTPS; api.github.com works.
import { execFileSync } from 'node:child_process'

const REPO = 'easyinplay/harnessed'
const REPO_DIR = 'D:/GitCode/harnessed'
const commit = process.argv[2]
const ref = process.argv[3] ?? 'refs/heads/main'
if (!commit) { console.error('usage: node push-via-api.mjs <commit-sha> [ref]'); process.exit(2) }

const token = execFileSync('gh', ['auth', 'token'], { encoding: 'utf8' }).trim()
const git = (...a) => execFileSync('git', a, { encoding: 'utf8', cwd: REPO_DIR, maxBuffer: 256 * 1024 * 1024 })
const gitBin = (...a) => execFileSync('git', a, { encoding: 'buffer', cwd: REPO_DIR, maxBuffer: 256 * 1024 * 1024 })

async function api(method, path, body) {
  const res = await fetch(`https://api.github.com${path}`, {
    method,
    headers: {
      authorization: `Bearer ${token}`,
      accept: 'application/vnd.github+json',
      'x-github-api-version': '2022-11-28',
      'user-agent': 'harnessed-push-via-api',
      ...(body ? { 'content-type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}\n${text.slice(0, 800)}`)
  return text ? JSON.parse(text) : null
}

const meta = (f) => git('show', '-s', `--format=${f}`, commit).replace(/\n$/, '')
const treeSha = meta('%T')
const parents = meta('%P').split(' ').filter(Boolean)
// The RAW message bytes. `%B` appends a newline, which changes the commit SHA.
const rawCommit = gitBin('cat-file', 'commit', commit)
const message = rawCommit.subarray(rawCommit.indexOf(Buffer.from([0x0a, 0x0a])) + 2).toString('utf8')
const author = { name: meta('%an'), email: meta('%ae'), date: meta('%aI') }
const committer = { name: meta('%cn'), email: meta('%ce'), date: meta('%cI') }
const baseTree = parents.length ? git('show', '-s', '--format=%T', parents[0]).trim() : null

const entries = []
for (const line of git('diff-tree', '--no-commit-id', '--raw', '-r', commit).split('\n')) {
  if (!line.trim()) continue
  const path = line.slice(line.indexOf('\t') + 1)
  const fields = line.slice(0, line.indexOf('\t')).split(/\s+/)
  const newMode = fields[1]
  if (fields[4] === 'D') { entries.push({ path, mode: newMode, type: 'blob', sha: null }); continue }
  const blob = await api('POST', `/repos/${REPO}/git/blobs`, {
    content: gitBin('show', `${commit}:${path}`).toString('base64'), encoding: 'base64',
  })
  entries.push({ path, mode: newMode, type: 'blob', sha: blob.sha })
}

const tree = await api('POST', `/repos/${REPO}/git/trees`, { ...(baseTree ? { base_tree: baseTree } : {}), tree: entries })
if (tree.sha !== treeSha) { console.error(`tree mismatch: ${tree.sha} vs ${treeSha}`); process.exit(1) }

const created = await api('POST', `/repos/${REPO}/git/commits`, { message, tree: tree.sha, parents, author, committer })
if (created.sha !== commit) { console.error(`commit mismatch: ${created.sha} vs ${commit} — ref NOT updated`); process.exit(1) }

const updated = await api('PATCH', `/repos/${REPO}/git/${ref}`, { sha: created.sha, force: false })
console.log(`pushed ${ref} → ${updated.object.sha}`)
```

Tagging works the same way: `POST /repos/{repo}/git/tags` (annotated tag object:
`tag`, `message`, `object`, `type: 'commit'`, `tagger: {name, email, date}`) then
`POST /repos/{repo}/git/refs` with `ref: refs/tags/<tag>`. Creating the ref
through the API still fires the `push` event, so the publish workflow starts.
The local tag object can be rebuilt byte-identically with `git mktag` (compare
the SHA the API returns) and wired up with `git update-ref refs/tags/<tag> <sha>`.

## 10. Landmines (things that cost real time this session)

- **A 30 s test timeout is not a slow test.** The first four "should refresh"
  cases hung for exactly 30 s: the mocked `spawn` returned the **same** child
  object on every call, and the fake emitted `close` once — the second spawn
  waited on an event that had already fired. Use `mockImplementation(() =>
  makeChild(0))`, not `mockReturnValue`.
- **The full suite catches gate regressions that focused runs miss.** The first
  full run of Phase 85 failed 20 tests: the clone gate had dropped the "already
  installed" signal, the L4 rescue asked twice, and a pinned message drifted.
  Run the full suite before claiming done.
- **A piped command hides its exit code** (§5). The "successful" full-suite run
  that reported 20 failures had exit code 0 because of `| tail -30`.
- **Parallel agents in one worktree corrupt `.git/index`.** Give agents their
  own worktree, or forbid them from running git at all.
- **`npm view` / `npm dist-tag ls` is cached**; the registry lies for minutes
  after a publish. Verify with a direct registry query:
  `curl -s https://registry.npmjs.org/-/package/harnessed/dist-tags`.
- **Subagents get 429s** (account-level quota); resume does not help. Finish
  the work in the main session and trust the local test run.
- **A stale `dist/` regenerates a stale schema** (§7).
- **Do not trust `new-diagnostics` hints** after an edit — they are often
  stale snapshots of a mid-edit file. Run `tsc --noEmit` before reacting.

## 11. Open work (candidates, in `TODOS.md` order)

No milestone is active; the user picks the next one. The most relevant open
items:

1. **Phase 84 acceptance criterion 13** — the real-machine check of the
   auto-update channel on a machine running the compiled binary (the replaced
   binary must itself carry the auto-update feature; only provable after
   v5.0.13).
2. **Slice 3** of the bun-compile track — npm per-platform optionalDependencies
   binary packages (P3, deliberately still open).
3. **Gemini host milestone** — approved 2026-10-14, not started. Per the
   project's three-layer workflow it needs gstack `/office-hours` +
   `/plan-ceo-review` first, and the gemini hook / subagent / skills
   directories must be **measured** before anything is written into the
   HostAdapter contract.
4. **G5/OMC ambiguity threshold** (P3, approved for a discuss phase).
5. **User-only, cannot be scripted**: revoke the leaked GitHub OAuth token
   (`gho_…`), rotate the Context7 API key (`ctx7sk-…`), narrow the
   over-scoped `gh` keyring token, and decide whether the installer should
   back up the whole `settings.json` (it currently copies plaintext
   credentials into the backup dir).
6. **Scheduled**: remove the `stop-hook` identity after 2027-02-03.

## 12. Working style that fits this repo

- Surgical changes, one concern per commit, English commit bodies that explain
  *why*.
- When a decision is architectural, write an ADR (one decision per file,
  immutable) and reference it from the phase CONTEXT.
- Phase work follows: CONTEXT (decisions) → PLAN (tasks) → execute with tests
  → SUMMARY (what shipped + evidence) → release receipt.
- Keep the fail-closed contracts intact. The Phase 85 work *added* proof
  paths; it did not weaken any refusal.
