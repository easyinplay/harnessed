import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    setupFiles: ['./tests/setup-i18n.ts'],
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
