// src/cli/lib/updateSignature.ts — architecture review #12: second-factor
// signature for the compiled-binary self-update channel.
//
// The self-update engine downloads `<asset>` AND `<asset>.sha256` from the SAME
// origin (the GitHub release), so the sha256 check only guards transport
// corruption — an attacker who can replace release assets replaces both files
// and the check passes. The `.sha256` content is therefore ed25519-signed at
// publish time (scripts/sign-binaries.mjs in the publish.yml binaries matrix;
// private key = the HARNESSED_SIGNING_KEY repo secret) into a sibling
// `<asset>.sha256.sig` (base64), and the client verifies it against THIS
// embedded public key — a factor the release origin does not hold. Rotation =
// ship a binary with the new key, sign with both during the overlap.
//
// node:crypto native ed25519 — zero new dependencies.

import { createPublicKey, verify as edVerify } from 'node:crypto'

/** The harnessed release signing public key (ed25519 SPKI). Generated
 *  2026-07-28; private half lives ONLY in the GitHub Actions secret. */
export const HARNESSED_RELEASE_PUBKEY_PEM = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAgCsfkZ+uCRNIBSHGfiOzp+TCSwQqOVJW1tsCW/beF4g=
-----END PUBLIC KEY-----
`

/** true ⇔ `sigBase64` is a valid ed25519 signature over the EXACT `shaText`
 *  bytes under `publicKeyPem` (default: the embedded release key). Never
 *  throws — malformed input verifies false (callers treat false as a hard
 *  integrity error; distinguishing "bad sig" from "garbage sig" adds nothing). */
export function verifyShaSignature(
  shaText: string,
  sigBase64: string,
  publicKeyPem: string = HARNESSED_RELEASE_PUBKEY_PEM,
): boolean {
  try {
    const sig = Buffer.from(sigBase64.trim(), 'base64')
    if (sig.length === 0) return false
    return edVerify(null, Buffer.from(shaText, 'utf8'), createPublicKey(publicKeyPem), sig)
  } catch {
    return false
  }
}
