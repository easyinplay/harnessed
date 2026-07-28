#!/usr/bin/env node
// architecture review #12 — sign each dist-bin/*.sha256 with the release
// ed25519 private key (HARNESSED_SIGNING_KEY repo secret, PEM) into a sibling
// `<file>.sig` (base64). The self-update client verifies against the public
// key embedded in src/cli/lib/updateSignature.ts — the cross-origin second
// factor the release origin does not hold. Runs in the publish.yml binaries
// matrix between build and upload; the upload glob `dist-bin/harnessed-*`
// picks the .sig files up automatically.
//
// Hard-fails on a missing key or zero .sha256 inputs: an unsigned release
// would brick `harnessed update` for every >=4.32.19 binary (the signature is
// contractual on the client).

import { createPrivateKey, sign } from 'node:crypto'
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const pem = process.env.HARNESSED_SIGNING_KEY
if (!pem || !pem.includes('PRIVATE KEY')) {
  console.error('[sign-binaries] FATAL: HARNESSED_SIGNING_KEY secret missing or not a PEM')
  process.exit(1)
}
const key = createPrivateKey(pem)

const dir = 'dist-bin'
const shaFiles = readdirSync(dir).filter((f) => f.endsWith('.sha256'))
if (shaFiles.length === 0) {
  console.error(`[sign-binaries] FATAL: no .sha256 files under ${dir}/`)
  process.exit(1)
}
for (const f of shaFiles) {
  const p = join(dir, f)
  const sig = sign(null, readFileSync(p), key).toString('base64')
  writeFileSync(`${p}.sig`, sig)
  console.error(`[sign-binaries] signed: ${p}.sig`)
}
