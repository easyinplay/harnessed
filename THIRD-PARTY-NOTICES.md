# Third-Party Notices

`harnessed` itself is licensed under the Apache License 2.0 (see `LICENSE` and
`NOTICE` at the repo root). This file enumerates third-party material whose
text — verbatim or paraphrased — is incorporated into shipped harnessed source
files. Upstream attributions for each capability *manifest* (and its installed
side effects on the user's machine) continue to be tracked separately in
`NOTICES.md` (auto-populated by `harnessed install` from each manifest's
`metadata.upstream.notice` field).

---

## mattpocock/skills

- **Source**: https://github.com/mattpocock/skills
- **Commit SHA pinned**: `b8be62ffacb0118fa3eaa29a0923c87c8c11985c`
- **License**: MIT
- **Used in**: `workflows/role-prompts.yaml` — paraphrased methodology
  excerpts inlined into the `task-clarify`, `task-code`, and `discuss-subtask`
  sub-workflow role-prompt entries (introduced in v3.6.0 Phase 1). Each
  paraphrased block carries an inline attribution comment naming the source
  SKILL.md path and the pinned commit SHA.
- **Excerpts paraphrased (not redistributed verbatim)**:
  - `skills/engineering/grill-with-docs/SKILL.md` → `task-clarify.responsibility` + checklist
  - `skills/engineering/zoom-out/SKILL.md` → `task-code.checklist`
  - `skills/engineering/improve-codebase-architecture/SKILL.md` → `task-code.checklist`
  - `skills/productivity/grill-me/SKILL.md` → `discuss-subtask.responsibility` + checklist
- **Full upstream license text**: preserved at
  `.planning/v3.6.0/mattpocock-source/LICENSE` (not shipped in the npm
  tarball; retained for audit + license-compliance evidence). The SHA
  metadata + re-fetch instructions live in
  `.planning/v3.6.0/mattpocock-source/SHA.txt`.
- **Scope of redistribution**: only the paraphrased excerpts above are
  redistributed (no verbatim SKILL.md content ships in the npm tarball).
