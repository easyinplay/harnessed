// Compat probe (Phase 88): produce a mixed backup snapshot with the NEW
// backup() — subtree + byte + created-sentinel entries — then the released
// v5.0.15 harnessed.exe is asked to roll it back. Expectation: the legacy
// two-pass reader checksum-verifies every entry first, cannot match the
// non-hex 'json-subtree-v1' discriminator, and aborts with ZERO mutations.

import { backup } from 'D:/GitCode/harnessed/src/installers/lib/backup.js'
import type {
  DiffPlan,
  InstallContext,
  Manifest,
} from 'D:/GitCode/harnessed/src/installers/lib/types.js'
import { writeFileSync } from 'node:fs'

const cwd = process.env.PROBE_CWD
if (!cwd) throw new Error('PROBE_CWD required')

const manifest = {
  metadata: { name: 'compat-probe' },
} as unknown as Manifest

const plan: DiffPlan = {
  files: [
    // subtree candidate — settings.json with a fake secret + one changed hook
    {
      target: `${cwd}/settings.json`,
      scope: 'HOME',
      oldText: JSON.stringify(
        {
          env: { API_KEY: 'sk-fake-PROBESECRET' },
          hooks: { SessionStart: [{ type: 'command', command: 'old-hook' }] },
        },
        null,
        2,
      ),
      newText: JSON.stringify(
        {
          env: { API_KEY: 'sk-fake-PROBESECRET' },
          hooks: { SessionStart: [{ type: 'command', command: 'harnessed-hook' }] },
        },
        null,
        2,
      ),
    },
    // plain byte backup
    { target: `${cwd}/plain.txt`, scope: 'HOME', oldText: 'orig\n', newText: 'changed\n' },
    // created sentinel (file absent at backup time)
    { target: `${cwd}/newfile.txt`, scope: 'HOME', oldText: '', newText: 'created\n' },
  ],
}

const ctx: InstallContext = {
  manifest,
  opts: {
    apply: true,
    dryRun: false,
    system: false,
    nonInteractive: true,
    fullDiff: false,
    color: false,
  },
  level: 'L3',
  cwd,
}

// Fixtures written from the same oldText bytes so the on-disk content is
// byte-identical to the plan image.
for (const f of plan.files) {
  if (f.oldText !== '') writeFileSync(f.target, f.oldText, 'utf8')
}

const r = await backup(plan, ctx)
console.log(JSON.stringify(r))
