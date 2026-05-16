// Phase 3.1 W2 T2.3 — checkpoint module barrel (Phase 2.4 dashboard SSE channel
// reuse via STATE.md mtime touch). Re-exports schema + state + template + archive
// so consumers `import { ... } from '../checkpoint/index.js'`.
export * from './archive.js'
export * from './schema/index.js'
export * from './state.js'
export * from './template.js'
