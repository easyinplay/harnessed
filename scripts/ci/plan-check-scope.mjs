import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

export const PLAN_FILE = /(?:task_plan|(?:.*-)?PLAN)\.md$/

function planFiles(root, path, out = []) {
  const absolute = join(root, path)
  if (!existsSync(absolute)) return out
  if (statSync(absolute).isFile()) {
    if (PLAN_FILE.test(path)) out.push(path.split(sep).join('/'))
    return out
  }
  for (const name of readdirSync(absolute)) planFiles(root, join(path, name), out)
  return out
}

function gitChangedFiles(root) {
  const base = process.env.PLAN_CHECK_BASE
    ? process.env.PLAN_CHECK_BASE
    : process.env.GITHUB_BASE_REF
      ? `origin/${process.env.GITHUB_BASE_REF}`
      : 'HEAD^'
  try {
    return execFileSync(
      'git',
      ['diff', '--name-only', '--diff-filter=ACMR', `${base}...HEAD`, '--', '.planning/'],
      { cwd: root, encoding: 'utf8' },
    ).split(/\r?\n/)
  } catch {
    throw new Error(`unable to resolve plan-check base ${base}`)
  }
}

export function selectPlanCheckTargets({ root = process.cwd(), changedFiles } = {}) {
  const selected = new Set()
  for (const file of changedFiles ?? gitChangedFiles(root)) {
    const normalized = file.split(/[\\/]/).join('/')
    if (PLAN_FILE.test(normalized)) {
      for (const plan of planFiles(root, normalized)) selected.add(plan)
    }
  }

  const statePath = join(root, '.planning', 'STATE.md')
  const state = existsSync(statePath) ? readFileSync(statePath, 'utf8') : ''
  const currentStart = state.indexOf('## Current Position')
  const currentTail =
    currentStart >= 0 ? state.slice(currentStart + '## Current Position'.length) : ''
  const currentEnd = currentTail.search(/\n##\s/)
  const current = currentEnd >= 0 ? currentTail.slice(0, currentEnd) : currentTail
  const phase = /\bPhase\s+(\d+)\b/.exec(current ?? '')?.[1]
  const phasesRoot = join(root, '.planning', 'phases')
  if (phase && existsSync(phasesRoot)) {
    const phasePattern = new RegExp(`^0*${phase}-`)
    for (const name of readdirSync(phasesRoot)) {
      if (!phasePattern.test(name)) continue
      const phasePath = relative(root, join(phasesRoot, name))
      for (const plan of planFiles(root, phasePath)) selected.add(plan)
    }
  }

  return [...selected].sort()
}
