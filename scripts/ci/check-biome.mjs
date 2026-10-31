#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

export const ALLOWED_WARNINGS = [
  {
    path: 'src/cli/facts.ts',
    category: 'lint/style/useTemplate',
    message: 'Template literals are preferred over string concatenation.',
  },
]

const normalize = (path) => path.replaceAll('\\', '/')
const categoryOf = (diagnostic) => diagnostic.category ?? diagnostic.code?.value ?? 'unknown'
const lineOf = (diagnostic) =>
  diagnostic.location?.start?.line ?? diagnostic.location?.range?.start?.line ?? 1

export function classifyBiomeReport(report, allowedWarnings = ALLOWED_WARNINGS) {
  const diagnostics = report.diagnostics ?? []
  const allowed = diagnostics.filter((diagnostic) => {
    const path = normalize(diagnostic.location?.path ?? '')
    return allowedWarnings.some(
      (allowed) =>
        allowed.path === path &&
        allowed.category === categoryOf(diagnostic) &&
        allowed.message === diagnostic.message,
    )
  })
  const unexpected = diagnostics.filter((diagnostic) => !allowed.includes(diagnostic))
  return { ok: unexpected.length === 0, allowed, unexpected }
}

export function biomeGateFailed(status, classified) {
  return status !== 0 || !classified.ok
}

function main() {
  const reportDir = mkdtempSync(join(tmpdir(), 'harnessed-biome-'))
  const reportPath = join(reportDir, 'report.json')
  const require = createRequire(import.meta.url)
  const biome = require.resolve('@biomejs/biome/bin/biome')
  const result = spawnSync(
    process.execPath,
    [biome, 'check', '.', '--reporter=rdjson', '--reporter-file', reportPath],
    { encoding: 'utf8' },
  )
  if (result.error) {
    rmSync(reportDir, { recursive: true, force: true })
    console.error(`::error::unable to run Biome: ${result.error.message}`)
    process.exit(1)
  }

  if (!existsSync(reportPath)) {
    process.stderr.write(result.stderr ?? '')
    rmSync(reportDir, { recursive: true, force: true })
    console.error('::error::Biome did not create the JSON report file')
    process.exit(1)
  }

  let report
  try {
    report = JSON.parse(readFileSync(reportPath, 'utf8'))
  } catch {
    process.stderr.write(result.stderr ?? '')
    console.error('::error::Biome did not produce a JSON report')
    rmSync(reportDir, { recursive: true, force: true })
    process.exit(1)
  }
  rmSync(reportDir, { recursive: true, force: true })

  const classified = classifyBiomeReport(report)
  if (classified.unexpected.some((diagnostic) => !diagnostic.location?.path)) {
    const details = spawnSync(process.execPath, [biome, 'check', '.'], { encoding: 'utf8' })
    process.stdout.write(details.stdout ?? '')
    process.stderr.write(details.stderr ?? '')
  }
  for (const diagnostic of classified.unexpected) {
    const path = normalize(diagnostic.location?.path ?? '')
    const line = lineOf(diagnostic)
    if (path) {
      console.error(
        `::error file=${path},line=${line}::${categoryOf(diagnostic)}: ${diagnostic.message}`,
      )
    } else {
      console.error(`::error::${categoryOf(diagnostic)}: ${diagnostic.message}`)
    }
  }
  for (const allowed of ALLOWED_WARNINGS) {
    const diagnostic = classified.allowed.find(
      (candidate) =>
        normalize(candidate.location?.path ?? '') === allowed.path &&
        categoryOf(candidate) === allowed.category &&
        candidate.message === allowed.message,
    )
    if (!diagnostic) continue
    const line = lineOf(diagnostic)
    console.warn(
      `::warning file=${allowed.path},line=${line}::Known warning retained because this task forbids editing ${allowed.path}`,
    )
  }

  if (biomeGateFailed(result.status, classified)) {
    if (!classified.ok) process.exit(1)
    console.error(`::error::Biome exited ${result.status} without a blocking diagnostic`)
    process.exit(1)
  }
  console.log(
    `Biome hard gate: 0 blocking diagnostics, ${classified.allowed.length} reported baseline`,
  )
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main()
