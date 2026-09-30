import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    setupFiles: ['./tests/setup-i18n.ts'],
    // v16.0 post-close — vitest's 5s default is wrong for this suite. Most of these
    // tests are not unit-pure: they copy real trees, render every workflow, and run a
    // real `setup` against a tmp package root. Four separate load-dependent false reds
    // came out of that default in the v16.0 milestone alone (`setup.test.ts`,
    // `setup-agent-teams.test.ts`, `promptHostGolden.test.ts`, `setup-locale.test.ts`),
    // each costing a debugging pass that found nothing wrong with the commit that went
    // red. A file-level override per victim is whack-a-mole; the default is the bug.
    //
    // 30s is deliberately generous. The cost of being generous is that a genuinely hung
    // test takes 30s to surface instead of 5s; the cost of being tight is a red suite
    // that means nothing. Individual files may still raise this (the heaviest golden
    // wants 60s) but should not LOWER it — a stale tighter per-cell override is exactly
    // what made the first of those four incidents hard to read.
    testTimeout: 30_000,
    // Same exposure: `beforeEach` hooks here mkdir/copy fixture trees.
    hookTimeout: 30_000,
    // CI excludes dev-machine-only dogfood tests (real-probe Agent Teams env var /
    // planning-with-files plugin install / etc — CI runner 没这些 setup 自然 fail);
    // Phase 3.4 W1.1 research schema v2→v3 后 research-v2.test.ts 死代码留 baseline。
    exclude: process.env.CI
      ? ['**/node_modules/**', 'tests/**/*.dogfood.test.ts', 'tests/workflow/research-v2.test.ts']
      : ['**/node_modules/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/cli.ts'],
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80,
      },
    },
    benchmark: {
      include: ['tests/integration/*.bench.ts'],
    },
  },
})
