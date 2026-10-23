// Standalone so Windows developers can also run this fixture in WSL without
// installing a second platform's Vitest native dependencies into node_modules.
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const code = Number(process.argv[2] ?? 23)
const mode = process.argv[3] ?? 'accept'
const installer = resolve(dirname(fileURLToPath(import.meta.url)), '../../install.sh')
const root = mkdtempSync(join(tmpdir(), 'installer-unix-'))
const home = join(root, "user's home")
const source = join(root, 'release')
const scratch = join(root, 'scratch')
const bin = join(home, '.local', 'bin', 'harnessed')
const log = join(root, 'calls.log')
for (const dir of [home, source, scratch]) mkdirSync(dir, { recursive: true })
const asset = process.platform === 'darwin' ? 'harnessed-darwin-arm64' : 'harnessed-linux-x64'
const content = `#!/usr/bin/env bash
printf '%s\\n' "$*" >> "$INSTALLER_TEST_LOG"
case "$1" in
  --version) echo 99.0.0 ;;
  setup) echo 'fixture setup result'; exit "$INSTALLER_TEST_CODE" ;;
  *) exit 99 ;;
esac
`
writeFileSync(join(source, asset), content)
writeFileSync(
  join(source, `${asset}.sha256`),
  `${createHash('sha256').update(content).digest('hex')}  ${asset}\n`,
)
const env = {
  ...process.env,
  HOME: home,
  TMPDIR: scratch,
  HARNESSED_INSTALLER_SOURCE_DIR: source,
  INSTALLER_TEST_LOG: log,
  INSTALLER_TEST_CODE: String(code),
  INSTALLER_TEST_SCRIPT: installer,
  INSTALLER_TEST_ANSWER: mode === 'decline' ? 'n' : 'y',
}

// Real PTY: stdin contains the piped script and consent comes from /dev/tty.
const pty = `
import errno, os, pty, select, sys, time
pid, fd = pty.fork()
if pid == 0:
    os.execvp('bash', ['bash', '-c', 'cat "$INSTALLER_TEST_SCRIPT" | bash'])
output, answered = b'', False
deadline = time.monotonic() + 10
while True:
    if time.monotonic() > deadline:
        os.kill(pid, 9)
        os.waitpid(pid, 0)
        raise RuntimeError('installer PTY timeout')
    if not select.select([fd], [], [], 0.1)[0]:
        continue
    try:
        chunk = os.read(fd, 65536)
    except OSError as error:
        if error.errno == errno.EIO:
            break
        raise
    if not chunk:
        break
    output += chunk
    if not answered and b'components)? (Y/n)' in output:
        os.write(fd, os.environ['INSTALLER_TEST_ANSWER'].encode() + b'\\n')
        answered = True
os.close(fd)
_, status = os.waitpid(pid, 0)
sys.stdout.buffer.write(output)
sys.exit(os.waitstatus_to_exitcode(status))
`

try {
  const result =
    mode === 'ci'
      ? spawnSync('bash', [installer], { env, encoding: 'utf8', timeout: 15_000 })
      : spawnSync('python3', ['-c', pty], { env, encoding: 'utf8', timeout: 15_000 })
  assert.ifError(result.error)
  const output = result.stdout + result.stderr
  process.stdout.write(output)
  const ranSetup = mode === 'accept'
  assert.equal(result.status, ranSetup ? code : 0)
  assert.ok(output.includes('installed harnessed v99.0.0'))
  assert.ok(existsSync(bin))
  assert.deepEqual(readdirSync(scratch), [])
  assert.deepEqual(
    readFileSync(log, 'utf8').trim().split(/\r?\n/),
    ranSetup ? ['--version', 'setup'] : ['--version'],
  )
  if (ranSetup && code !== 0) {
    assert.ok(output.includes(`setup failed (exit code ${code})`))
    assert.ok(!output.includes('[harnessed installer] next step'))
    const retry = output
      .split(/\r?\n/)
      .find((line) => line.startsWith('[harnessed installer] retry: '))
    assert.ok(retry, 'missing absolute retry command')
    const command = retry.slice('[harnessed installer] retry: '.length)
    const retried = spawnSync('bash', ['-c', command], {
      env: { ...env, INSTALLER_TEST_CODE: '0' },
      encoding: 'utf8',
      timeout: 5_000,
    })
    assert.equal(retried.status, 0, retried.stderr)
    assert.deepEqual(readFileSync(log, 'utf8').trim().split(/\r?\n/), [
      '--version',
      'setup',
      'setup',
    ])
  } else {
    assert.ok(!output.includes('setup failed'))
    assert.ok(
      output.includes(
        ranSetup ? '[harnessed installer] next step:' : '[harnessed installer] next steps:',
      ),
    )
  }
} finally {
  rmSync(root, { recursive: true, force: true })
}
