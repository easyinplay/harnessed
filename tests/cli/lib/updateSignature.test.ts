import { sign as edSign, generateKeyPairSync } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import {
  HARNESSED_RELEASE_PUBKEY_PEM,
  verifyShaSignature,
} from '../../../src/cli/lib/updateSignature.js'

// architecture review #12 — the binary self-update fetched the asset AND its
// .sha256 from the SAME origin (the GitHub release), so the hash only guarded
// transport corruption: an attacker who can replace release assets replaces
// both. The .sha256 content is now ed25519-signed in CI (private key = repo
// secret) and the client verifies with this embedded public key — a second
// factor the release origin does not hold.
describe('updateSignature (#12 ed25519 over .sha256)', () => {
  const pair = generateKeyPairSync('ed25519')
  const pubPem = pair.publicKey.export({ type: 'spki', format: 'pem' }).toString()
  const shaText = 'a'.repeat(64) + '  harnessed-linux-x64\n'
  const goodSig = edSign(null, Buffer.from(shaText, 'utf8'), pair.privateKey).toString('base64')

  it('valid signature over the exact sha text → true', () => {
    expect(verifyShaSignature(shaText, goodSig, pubPem)).toBe(true)
  })

  it('tampered sha text → false', () => {
    expect(verifyShaSignature(`${'b'.repeat(64)}  harnessed-linux-x64\n`, goodSig, pubPem)).toBe(
      false,
    )
  })

  it('garbage / non-base64 / wrong-key signature → false, never throws', () => {
    expect(verifyShaSignature(shaText, 'not-a-signature', pubPem)).toBe(false)
    expect(verifyShaSignature(shaText, '', pubPem)).toBe(false)
    const other = generateKeyPairSync('ed25519')
    const otherSig = edSign(null, Buffer.from(shaText, 'utf8'), other.privateKey).toString('base64')
    expect(verifyShaSignature(shaText, otherSig, pubPem)).toBe(false)
  })

  it('default key = the embedded release public key (parseable, ed25519 SPKI)', () => {
    expect(HARNESSED_RELEASE_PUBKEY_PEM).toContain('BEGIN PUBLIC KEY')
    // wrong-key sig against the embedded default must be false (and not throw)
    expect(verifyShaSignature(shaText, goodSig)).toBe(false)
  })
})
