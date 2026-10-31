#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const tagBaselines = Array.from({ length: 29 }, (_, index) => {
  const number = String(index + 1).padStart(4, '0')
  return { number, ref: `adr-${number}-accepted` }
})

export const ADR_BASELINES = [
  ...tagBaselines,
  { number: '0030', ref: 'ace452ea9db2558a5431cadc34bf34f6ca182df8' },
  { number: '0031', ref: 'f2200db7f4d97453bb9ed23b2fa86a8f46ba29ab' },
  { number: '0032', ref: '87bc743227f5f6a20d1ae0218e12dae85d134b70' },
]

function git(root, args) {
  return spawnSync('git', args, { cwd: root, encoding: 'utf8' })
}

export function checkAdrBaselines(root = process.cwd(), baselines = ADR_BASELINES) {
  const adrDir = join(root, 'docs', 'adr')
  const names = readdirSync(adrDir)
  const errors = []

  for (const { number, ref } of baselines) {
    const refCheck = git(root, ['rev-parse', '--verify', '--quiet', `${ref}^{commit}`])
    if (refCheck.status !== 0) {
      errors.push(`missing baseline ref ${ref} for ADR ${number}`)
      continue
    }

    const matches = names.filter((name) => name.startsWith(`${number}-`) && name.endsWith('.md'))
    if (matches.length !== 1) {
      errors.push(`expected exactly one docs/adr/${number}-*.md file, found ${matches.length}`)
      continue
    }

    const file = `docs/adr/${matches[0]}`
    const diff = git(root, ['diff', '--exit-code', ref, '--', file])
    if (diff.status !== 0) {
      errors.push(`ADR ${number} changed since ${ref}\n${diff.stdout}${diff.stderr}`.trim())
    }
  }

  return { ok: errors.length === 0, errors }
}

function main() {
  const result = checkAdrBaselines()
  if (!result.ok) {
    for (const error of result.errors) console.error(`::error::${error}`)
    process.exit(1)
  }
  console.log(`A7: ${ADR_BASELINES.length} ADR baselines verified`)
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main()
