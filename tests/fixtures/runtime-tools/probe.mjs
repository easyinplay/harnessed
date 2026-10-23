import { spawn } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'

const args = process.argv.slice(2)
if (args[0] === 'hang') setInterval(() => {}, 1000)
else if (args[0] === 'grandchild') {
  const child = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], {
    stdio: 'ignore',
    windowsHide: true,
  })
  console.log(JSON.stringify({ childPid: child.pid }))
  setInterval(() => {}, 1000)
} else if (args[0] === 'flood') process.stdout.write('x'.repeat(100_000))
else if (args[0] === 'invalid-utf8') process.stdout.write(Buffer.alloc(1024, 255))
else if (args[0] === 'truncated-utf8') process.stdout.write(Buffer.from([0xc3, 0xa9]))
else if (args[0] === 'mixed-utf8') {
  process.stdout.write(Buffer.alloc(512, 255))
  process.stderr.write(Buffer.alloc(512, 255))
} else if (args[0] === 'split-utf8') {
  process.stdout.write(Buffer.from([0xe2]))
  setTimeout(() => process.stdout.write(Buffer.from([0x82, 0xac])), 10)
} else if (args[0] === 'exit') process.exit(7)
else if (args[0] === 'env') console.log(JSON.stringify(process.env))
else if (args[0] === '--version') console.log('1.2.3')
else if (args[0] === 'gates' && args[1] === 'task' && args[2] === '--task') {
  console.log(JSON.stringify({ master: 'task', fire: [], skip: [], parallelism: {} }))
} else if (
  args[0] === 'prompt' &&
  args[1] === 'task-code' &&
  args[2] === '--task' &&
  args[4] === '--json'
) {
  console.log(JSON.stringify({ prompt: 'fixture task', model: 'fixture' }))
} else if (args.join(' ') === 'checkpoint intent task') {
  writeFileSync(join(process.env.HARNESSED_ROOT_OVERRIDE, 'intent-fixture.json'), '{}')
} else if (args.join(' ') === 'status --recover') console.log('fixture recovery')
else {
  console.error(`Unexpected fixture arguments: ${JSON.stringify(args)}`)
  process.exitCode = 8
}
