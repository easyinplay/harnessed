// Main library entry — re-exports public APIs.
// phase 1.1 batch 1: skeleton only; schema validator wired in batch 2 (T3+).

import pkg from '../package.json' with { type: 'json' }

export const VERSION = pkg.version
