// src/cli/lib/changelogSection.ts — the shipped CHANGELOG, excerpted.
//
// Its own module (not `src/cli/update.ts`) because the auto-update handover
// runs inside the new binary's refresh path, and pulling the whole update
// command (commander, the coordinator, the repair machinery) in there would
// bloat the compiled worker bundle for one file read.

import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { getAssetsRoot } from '../../platform/assetsRoot.js'

/** The excerpt is a console line, not a document. */
const CHANGELOG_EXCERPT_LIMIT = 1200

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * The CHANGELOG section of one version, or the first section when no version
 * is given.
 *
 * With no argument: the FIRST `## ` section — the Keep-a-Changelog entry,
 * i.e. `[Unreleased]` when there is one. That is what `harnessed update`
 * prints today.
 *
 * With a version: that version's own `## [x.y.z]` section. The auto-update
 * notice needs exactly this: the NEW binary owns the NEW CHANGELOG, so it is
 * the only process that can excerpt the section of the version it just
 * installed (R14).
 *
 * Returns null when the file or the version is not there.
 */
export function changelogSection(version?: string): string | null {
  try {
    const path = join(getAssetsRoot(), 'CHANGELOG.md')
    if (!existsSync(path)) return null
    const body = readFileSync(path, 'utf8')
    const heading = version ? new RegExp(`^## \\[${escapeRegExp(version)}\\]`, 'm') : /^## /m
    const match = heading.exec(body)
    if (!match) return null
    const rest = body.slice(match.index)
    const next = rest.slice(1).search(/^## /m)
    const section = next >= 0 ? rest.slice(0, next + 1) : rest
    return section.trim().slice(0, CHANGELOG_EXCERPT_LIMIT)
  } catch {
    return null
  }
}
