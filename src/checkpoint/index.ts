// Phase 3.1 W2 T2.3 — checkpoint module barrel (Phase 2.4 dashboard SSE channel
// reuse via STATE.md mtime touch). Re-exports schema + state + template + archive
// so consumers `import { ... } from '../checkpoint/index.js'`.
// Phase 3.1 W4 T4.4 — add sigintTrap / compact / resume (Wave 4 trio).
export * from './archive.js'
export * from './compact.js'
export * from './resume.js'
export * from './schema/index.js'
export * from './sigintTrap.js'
export * from './state.js'
export * from './template.js'
