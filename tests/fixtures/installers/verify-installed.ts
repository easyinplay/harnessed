import { readFileSync } from 'node:fs'
import type { InstallContext } from '../../../src/installers/lib/types.js'
import { verifyInstalled } from '../../../src/installers/lib/verifyInstalled.js'

const file = process.argv[2]
if (!file) throw new Error('Expected an InstallContext JSON file')
const ctx = JSON.parse(readFileSync(file, 'utf8')) as InstallContext
console.log(JSON.stringify(await verifyInstalled(ctx, { neutralCwd: true })))
