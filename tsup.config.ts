import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    cli: 'src/cli.ts',
    'schemas/index': 'src/schemas/index.ts',
  },
  format: ['esm'],
  target: 'node22',
  outDir: 'dist',
  // Force .mjs extension to match package.json bin/exports field
  // (per ADR 0002 sec 3: "纯 ESM bin → .mjs")
  outExtension: () => ({ js: '.mjs' }),
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
  minify: false,
  shims: false,
  platform: 'node',
})
