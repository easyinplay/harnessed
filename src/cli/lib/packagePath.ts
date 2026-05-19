// v1.0.1 T1.1 — Single SoT for package root resolution.
//
// IMPL NOTE: Resolves package root via import.meta.url → up two levels from
// dist/cli.mjs → package root. Bundler-safe: tsup ESM build preserves
// import.meta.url. Fixes global-install consumers using process.cwd() which
// points to the user's project dir, not the harnessed package dir.

import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Returns the absolute path to the harnessed package root directory.
 * Works for both global installs (npm install -g) and local dev (ts-node / vitest).
 */
export function getPackageRoot(): string {
  // import.meta.url → file:///.../dist/cli.mjs (or src/cli/lib/packagePath.ts in test)
  // Go up: dist/cli.mjs → dist/ → package root  (2 levels)
  //        src/cli/lib/packagePath.ts → src/cli/lib/ → src/cli/ → src/ → package root (3 levels in source)
  // We detect which context we're in by checking for the 'dist' segment.
  const thisFile = fileURLToPath(import.meta.url)
  const thisDir = dirname(thisFile)
  // In dist: thisDir = <root>/dist  → up 1
  // In src:  thisDir = <root>/src/cli/lib → up 3
  if (thisDir.endsWith('dist') || thisDir.replace(/\\/g, '/').endsWith('/dist')) {
    return resolve(thisDir, '..')
  }
  // Source / test context — go up 3
  return resolve(thisDir, '..', '..', '..')
}
