#!/usr/bin/env node
// biome-ignore-all format: esbuild-generated (hook drift gate owns this file)
// biome-ignore-all lint: esbuild-generated
// biome-ignore-all assist/source/organizeImports: esbuild-generated
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url)
var __create = Object.create
var __defProp = Object.defineProperty
var __getOwnPropDesc = Object.getOwnPropertyDescriptor
var __getOwnPropNames = Object.getOwnPropertyNames
var __getProtoOf = Object.getPrototypeOf
var __hasOwnProp = Object.prototype.hasOwnProperty
var __require = /* @__PURE__ */ ((x) =>
  typeof require !== 'undefined'
    ? require
    : typeof Proxy !== 'undefined'
      ? new Proxy(x, {
          get: (a, b) => (typeof require !== 'undefined' ? require : a)[b],
        })
      : x)(function (x) {
  if (typeof require !== 'undefined') return require.apply(this, arguments)
  throw Error('Dynamic require of "' + x + '" is not supported')
})
var __esm = (fn, res) =>
  function __init() {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])((fn = 0))), res
  }
var __commonJS = (cb, mod) =>
  function __require2() {
    return (
      mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports
    )
  }
var __export = (target, all) => {
  for (var name in all) __defProp(target, name, { get: all[name], enumerable: true })
}
var __copyProps = (to, from, except, desc) => {
  if ((from && typeof from === 'object') || typeof from === 'function') {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, {
          get: () => from[key],
          enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable,
        })
  }
  return to
}
var __toESM = (mod, isNodeMode, target) => (
  (target = mod != null ? __create(__getProtoOf(mod)) : {}),
  __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule
      ? __defProp(target, 'default', { value: mod, enumerable: true })
      : target,
    mod,
  )
)

// package.json
var package_default
var init_package = __esm({
  'package.json'() {
    package_default = {
      name: 'harnessed',
      version: '5.0.5',
      description: 'AI coding harness package manager + composition orchestrator',
      type: 'module',
      license: 'Apache-2.0',
      author: 'easyinplay',
      repository: {
        type: 'git',
        url: 'https://github.com/easyinplay/harnessed.git',
      },
      homepage: 'https://github.com/easyinplay/harnessed#readme',
      bugs: 'https://github.com/easyinplay/harnessed/issues',
      keywords: [
        'claude-code',
        'ai-harness',
        'package-manager',
        'composition',
        'skill-pack',
        'mcp',
        'orchestrator',
      ],
      engines: {
        node: '>=22.0.0',
      },
      packageManager: 'pnpm@10.12.0',
      bin: {
        harnessed: './dist/cli.mjs',
        'harnessed-inject-state': './bin/harnessed-inject-state.mjs',
      },
      main: './dist/index.mjs',
      types: './dist/index.d.ts',
      exports: {
        '.': {
          types: './dist/index.d.ts',
          import: './dist/index.mjs',
          default: './dist/index.mjs',
        },
        './schemas': {
          types: './dist/schemas/index.d.ts',
          import: './dist/schemas/index.mjs',
        },
        './package.json': './package.json',
      },
      files: [
        'dist',
        'bin',
        'manifests',
        'messages',
        'workflows',
        'routing',
        'config-templates',
        'schemas',
        'README.md',
        'README-en.md',
        'README-zh.md',
        'LICENSE',
        'NOTICE',
        'THIRD-PARTY-NOTICES.md',
      ],
      scripts: {
        dev: 'tsup --watch',
        build: 'tsc --noEmit && tsup && node ./scripts/build-hooks.mjs',
        'build:hooks': 'node ./scripts/build-hooks.mjs',
        'build:schema': 'node ./scripts/build-schema.mjs',
        'validate:schema': 'node ./scripts/validate-schema.mjs',
        typecheck: 'tsc --noEmit',
        test: 'vitest run --passWithNoTests',
        'test:watch': 'vitest',
        'test:coverage': 'vitest run --coverage --passWithNoTests',
        'test:codex-live': 'node ./scripts/codex-live/run.mjs',
        bench: 'vitest bench --run',
        'bench:runtime': 'node scripts/benchmark-runtime.mjs',
        'test:runtime-channels': 'node scripts/runtime-channel-smoke.mjs',
        'test:docs': 'node --test tests/docs/install-channels.contract.mjs',
        lint: 'biome check .',
        'lint:fix': 'biome check --write .',
        format: 'biome format --write .',
        'build:binary': 'bun scripts/build-binary.mjs',
      },
      dependencies: {
        '@anthropic-ai/claude-agent-sdk': '0.3.142',
        '@clack/prompts': '^0.10.1',
        '@sinclair/typebox': '^0.34.49',
        ajv: '^8.20.0',
        'ajv-errors': '^3.0.0',
        'ajv-formats': '^3.0.1',
        commander: '^13.0.0',
        diff: '^9.0.0',
        'expr-eval': '^2.0.2',
        picocolors: '^1.1.1',
        'proper-lockfile': '^4.1.2',
        'smol-toml': '^1.9.1',
        undici: '^8.12.1',
        yaml: '^2.9.0',
      },
      devDependencies: {
        '@biomejs/biome': '^2.0.0',
        '@types/node': '^22.10.0',
        '@types/proper-lockfile': '^4.1.4',
        '@vitest/coverage-v8': '^4.0.0',
        esbuild: '0.27.7',
        tsup: '^8.3.0',
        typescript: '^5.6.0',
        vitest: '^4.0.0',
      },
      pnpm: {
        onlyBuiltDependencies: ['esbuild'],
      },
    }
  },
})

// src/cli/lib/updateReminderCache.ts
import fs from 'node:fs'
function isReminderVersion(value) {
  return (
    typeof value === 'string' &&
    value.length <= 128 &&
    /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(value)
  )
}
function parseCache(text, identity, now) {
  const cache = JSON.parse(text)
  if (!cache || cache.schemaVersion !== 1 || !cache.identity) return null
  const keys = ['host', 'runtime', 'channel', 'source', 'fingerprint']
  if (identity.host !== 'claude' && identity.host !== 'codex') return null
  for (const key of keys) {
    const value = cache.identity[key]
    if (
      typeof value !== 'string' ||
      !value.length ||
      value.length > 512 ||
      value !== identity[key]
    ) {
      return null
    }
  }
  const { installed, latest, state, checkedAt, retryAfter } = cache
  if (
    !isReminderVersion(installed) ||
    typeof checkedAt !== 'number' ||
    !Number.isSafeInteger(checkedAt) ||
    checkedAt < 0 ||
    checkedAt > now ||
    typeof retryAfter !== 'number' ||
    !Number.isSafeInteger(retryAfter) ||
    retryAfter < 0
  )
    return null
  if (state === 'unknown') {
    if (latest !== null || retryAfter !== checkedAt + REMINDER_RETRY_MS) return null
  } else if (
    !['behind', 'current', 'ahead'].includes(state ?? '') ||
    !isReminderVersion(latest) ||
    retryAfter !== 0
  )
    return null
  return {
    schemaVersion: 1,
    identity: { ...identity },
    installed,
    latest: latest ?? null,
    state,
    checkedAt,
    retryAfter,
  }
}
function readReminderCache(cachePath, identity, now = Date.now()) {
  let descriptor
  try {
    descriptor = fs.openSync(cachePath, fs.constants.O_RDONLY | fs.constants.O_NONBLOCK)
    const stat = fs.fstatSync(descriptor)
    if (!stat.isFile() || stat.size > REMINDER_MAX_BYTES) return null
    const buffer = Buffer.alloc(REMINDER_MAX_BYTES + 1)
    const bytes = fs.readSync(descriptor, buffer, 0, buffer.length, 0)
    if (bytes > REMINDER_MAX_BYTES || bytes < stat.size) return null
    return parseCache(buffer.toString('utf8', 0, bytes), identity, now)
  } catch {
    return null
  } finally {
    if (descriptor !== void 0) {
      try {
        fs.closeSync(descriptor)
      } catch {}
    }
  }
}
function shouldRefreshReminder(cache, now) {
  if (!cache) return true
  if (cache.retryAfter > now) return false
  return cache.state === 'unknown' || now - cache.checkedAt >= REMINDER_TTL_MS
}
var REMINDER_TTL_MS, REMINDER_RETRY_MS, REMINDER_MAX_BYTES, REMINDER_LOCK_STALE_MS
var init_updateReminderCache = __esm({
  'src/cli/lib/updateReminderCache.ts'() {
    'use strict'
    REMINDER_TTL_MS = 24 * 60 * 60 * 1e3
    REMINDER_RETRY_MS = 60 * 60 * 1e3
    REMINDER_MAX_BYTES = 16 * 1024
    REMINDER_LOCK_STALE_MS = 3e4
  },
})

// node_modules/.pnpm/graceful-fs@4.2.11/node_modules/graceful-fs/polyfills.js
var require_polyfills = __commonJS({
  'node_modules/.pnpm/graceful-fs@4.2.11/node_modules/graceful-fs/polyfills.js'(exports, module) {
    var constants2 = __require('constants')
    var origCwd = process.cwd
    var cwd = null
    var platform = process.env.GRACEFUL_FS_PLATFORM || process.platform
    process.cwd = function () {
      if (!cwd) cwd = origCwd.call(process)
      return cwd
    }
    try {
      process.cwd()
    } catch (er) {}
    if (typeof process.chdir === 'function') {
      chdir = process.chdir
      process.chdir = function (d) {
        cwd = null
        chdir.call(process, d)
      }
      if (Object.setPrototypeOf) Object.setPrototypeOf(process.chdir, chdir)
    }
    var chdir
    module.exports = patch
    function patch(fs2) {
      if (
        constants2.hasOwnProperty('O_SYMLINK') &&
        process.version.match(/^v0\.6\.[0-2]|^v0\.5\./)
      ) {
        patchLchmod(fs2)
      }
      if (!fs2.lutimes) {
        patchLutimes(fs2)
      }
      fs2.chown = chownFix(fs2.chown)
      fs2.fchown = chownFix(fs2.fchown)
      fs2.lchown = chownFix(fs2.lchown)
      fs2.chmod = chmodFix(fs2.chmod)
      fs2.fchmod = chmodFix(fs2.fchmod)
      fs2.lchmod = chmodFix(fs2.lchmod)
      fs2.chownSync = chownFixSync(fs2.chownSync)
      fs2.fchownSync = chownFixSync(fs2.fchownSync)
      fs2.lchownSync = chownFixSync(fs2.lchownSync)
      fs2.chmodSync = chmodFixSync(fs2.chmodSync)
      fs2.fchmodSync = chmodFixSync(fs2.fchmodSync)
      fs2.lchmodSync = chmodFixSync(fs2.lchmodSync)
      fs2.stat = statFix(fs2.stat)
      fs2.fstat = statFix(fs2.fstat)
      fs2.lstat = statFix(fs2.lstat)
      fs2.statSync = statFixSync(fs2.statSync)
      fs2.fstatSync = statFixSync(fs2.fstatSync)
      fs2.lstatSync = statFixSync(fs2.lstatSync)
      if (fs2.chmod && !fs2.lchmod) {
        fs2.lchmod = function (path, mode, cb) {
          if (cb) process.nextTick(cb)
        }
        fs2.lchmodSync = function () {}
      }
      if (fs2.chown && !fs2.lchown) {
        fs2.lchown = function (path, uid, gid, cb) {
          if (cb) process.nextTick(cb)
        }
        fs2.lchownSync = function () {}
      }
      if (platform === 'win32') {
        fs2.rename =
          typeof fs2.rename !== 'function'
            ? fs2.rename
            : (function (fs$rename) {
                function rename(from, to, cb) {
                  var start = Date.now()
                  var backoff = 0
                  fs$rename(from, to, function CB(er) {
                    if (
                      er &&
                      (er.code === 'EACCES' || er.code === 'EPERM' || er.code === 'EBUSY') &&
                      Date.now() - start < 6e4
                    ) {
                      setTimeout(function () {
                        fs2.stat(to, function (stater, st) {
                          if (stater && stater.code === 'ENOENT') fs$rename(from, to, CB)
                          else cb(er)
                        })
                      }, backoff)
                      if (backoff < 100) backoff += 10
                      return
                    }
                    if (cb) cb(er)
                  })
                }
                if (Object.setPrototypeOf) Object.setPrototypeOf(rename, fs$rename)
                return rename
              })(fs2.rename)
      }
      fs2.read =
        typeof fs2.read !== 'function'
          ? fs2.read
          : (function (fs$read) {
              function read(fd, buffer, offset, length, position, callback_) {
                var callback
                if (callback_ && typeof callback_ === 'function') {
                  var eagCounter = 0
                  callback = function (er, _, __) {
                    if (er && er.code === 'EAGAIN' && eagCounter < 10) {
                      eagCounter++
                      return fs$read.call(fs2, fd, buffer, offset, length, position, callback)
                    }
                    callback_.apply(this, arguments)
                  }
                }
                return fs$read.call(fs2, fd, buffer, offset, length, position, callback)
              }
              if (Object.setPrototypeOf) Object.setPrototypeOf(read, fs$read)
              return read
            })(fs2.read)
      fs2.readSync =
        typeof fs2.readSync !== 'function'
          ? fs2.readSync
          : /* @__PURE__ */ (function (fs$readSync) {
              return function (fd, buffer, offset, length, position) {
                var eagCounter = 0
                while (true) {
                  try {
                    return fs$readSync.call(fs2, fd, buffer, offset, length, position)
                  } catch (er) {
                    if (er.code === 'EAGAIN' && eagCounter < 10) {
                      eagCounter++
                      continue
                    }
                    throw er
                  }
                }
              }
            })(fs2.readSync)
      function patchLchmod(fs3) {
        fs3.lchmod = function (path, mode, callback) {
          fs3.open(path, constants2.O_WRONLY | constants2.O_SYMLINK, mode, function (err, fd) {
            if (err) {
              if (callback) callback(err)
              return
            }
            fs3.fchmod(fd, mode, function (err2) {
              fs3.close(fd, function (err22) {
                if (callback) callback(err2 || err22)
              })
            })
          })
        }
        fs3.lchmodSync = function (path, mode) {
          var fd = fs3.openSync(path, constants2.O_WRONLY | constants2.O_SYMLINK, mode)
          var threw = true
          var ret
          try {
            ret = fs3.fchmodSync(fd, mode)
            threw = false
          } finally {
            if (threw) {
              try {
                fs3.closeSync(fd)
              } catch (er) {}
            } else {
              fs3.closeSync(fd)
            }
          }
          return ret
        }
      }
      function patchLutimes(fs3) {
        if (constants2.hasOwnProperty('O_SYMLINK') && fs3.futimes) {
          fs3.lutimes = function (path, at, mt, cb) {
            fs3.open(path, constants2.O_SYMLINK, function (er, fd) {
              if (er) {
                if (cb) cb(er)
                return
              }
              fs3.futimes(fd, at, mt, function (er2) {
                fs3.close(fd, function (er22) {
                  if (cb) cb(er2 || er22)
                })
              })
            })
          }
          fs3.lutimesSync = function (path, at, mt) {
            var fd = fs3.openSync(path, constants2.O_SYMLINK)
            var ret
            var threw = true
            try {
              ret = fs3.futimesSync(fd, at, mt)
              threw = false
            } finally {
              if (threw) {
                try {
                  fs3.closeSync(fd)
                } catch (er) {}
              } else {
                fs3.closeSync(fd)
              }
            }
            return ret
          }
        } else if (fs3.futimes) {
          fs3.lutimes = function (_a, _b, _c, cb) {
            if (cb) process.nextTick(cb)
          }
          fs3.lutimesSync = function () {}
        }
      }
      function chmodFix(orig) {
        if (!orig) return orig
        return function (target, mode, cb) {
          return orig.call(fs2, target, mode, function (er) {
            if (chownErOk(er)) er = null
            if (cb) cb.apply(this, arguments)
          })
        }
      }
      function chmodFixSync(orig) {
        if (!orig) return orig
        return function (target, mode) {
          try {
            return orig.call(fs2, target, mode)
          } catch (er) {
            if (!chownErOk(er)) throw er
          }
        }
      }
      function chownFix(orig) {
        if (!orig) return orig
        return function (target, uid, gid, cb) {
          return orig.call(fs2, target, uid, gid, function (er) {
            if (chownErOk(er)) er = null
            if (cb) cb.apply(this, arguments)
          })
        }
      }
      function chownFixSync(orig) {
        if (!orig) return orig
        return function (target, uid, gid) {
          try {
            return orig.call(fs2, target, uid, gid)
          } catch (er) {
            if (!chownErOk(er)) throw er
          }
        }
      }
      function statFix(orig) {
        if (!orig) return orig
        return function (target, options, cb) {
          if (typeof options === 'function') {
            cb = options
            options = null
          }
          function callback(er, stats) {
            if (stats) {
              if (stats.uid < 0) stats.uid += 4294967296
              if (stats.gid < 0) stats.gid += 4294967296
            }
            if (cb) cb.apply(this, arguments)
          }
          return options
            ? orig.call(fs2, target, options, callback)
            : orig.call(fs2, target, callback)
        }
      }
      function statFixSync(orig) {
        if (!orig) return orig
        return function (target, options) {
          var stats = options ? orig.call(fs2, target, options) : orig.call(fs2, target)
          if (stats) {
            if (stats.uid < 0) stats.uid += 4294967296
            if (stats.gid < 0) stats.gid += 4294967296
          }
          return stats
        }
      }
      function chownErOk(er) {
        if (!er) return true
        if (er.code === 'ENOSYS') return true
        var nonroot = !process.getuid || process.getuid() !== 0
        if (nonroot) {
          if (er.code === 'EINVAL' || er.code === 'EPERM') return true
        }
        return false
      }
    }
  },
})

// node_modules/.pnpm/graceful-fs@4.2.11/node_modules/graceful-fs/legacy-streams.js
var require_legacy_streams = __commonJS({
  'node_modules/.pnpm/graceful-fs@4.2.11/node_modules/graceful-fs/legacy-streams.js'(
    exports,
    module,
  ) {
    var Stream = __require('stream').Stream
    module.exports = legacy
    function legacy(fs2) {
      return {
        ReadStream,
        WriteStream,
      }
      function ReadStream(path, options) {
        if (!(this instanceof ReadStream)) return new ReadStream(path, options)
        Stream.call(this)
        var self = this
        this.path = path
        this.fd = null
        this.readable = true
        this.paused = false
        this.flags = 'r'
        this.mode = 438
        this.bufferSize = 64 * 1024
        options = options || {}
        var keys = Object.keys(options)
        for (var index = 0, length = keys.length; index < length; index++) {
          var key = keys[index]
          this[key] = options[key]
        }
        if (this.encoding) this.setEncoding(this.encoding)
        if (this.start !== void 0) {
          if ('number' !== typeof this.start) {
            throw TypeError('start must be a Number')
          }
          if (this.end === void 0) {
            this.end = Infinity
          } else if ('number' !== typeof this.end) {
            throw TypeError('end must be a Number')
          }
          if (this.start > this.end) {
            throw new Error('start must be <= end')
          }
          this.pos = this.start
        }
        if (this.fd !== null) {
          process.nextTick(function () {
            self._read()
          })
          return
        }
        fs2.open(this.path, this.flags, this.mode, function (err, fd) {
          if (err) {
            self.emit('error', err)
            self.readable = false
            return
          }
          self.fd = fd
          self.emit('open', fd)
          self._read()
        })
      }
      function WriteStream(path, options) {
        if (!(this instanceof WriteStream)) return new WriteStream(path, options)
        Stream.call(this)
        this.path = path
        this.fd = null
        this.writable = true
        this.flags = 'w'
        this.encoding = 'binary'
        this.mode = 438
        this.bytesWritten = 0
        options = options || {}
        var keys = Object.keys(options)
        for (var index = 0, length = keys.length; index < length; index++) {
          var key = keys[index]
          this[key] = options[key]
        }
        if (this.start !== void 0) {
          if ('number' !== typeof this.start) {
            throw TypeError('start must be a Number')
          }
          if (this.start < 0) {
            throw new Error('start must be >= zero')
          }
          this.pos = this.start
        }
        this.busy = false
        this._queue = []
        if (this.fd === null) {
          this._open = fs2.open
          this._queue.push([this._open, this.path, this.flags, this.mode, void 0])
          this.flush()
        }
      }
    }
  },
})

// node_modules/.pnpm/graceful-fs@4.2.11/node_modules/graceful-fs/clone.js
var require_clone = __commonJS({
  'node_modules/.pnpm/graceful-fs@4.2.11/node_modules/graceful-fs/clone.js'(exports, module) {
    'use strict'
    module.exports = clone
    var getPrototypeOf =
      Object.getPrototypeOf ||
      function (obj) {
        return obj.__proto__
      }
    function clone(obj) {
      if (obj === null || typeof obj !== 'object') return obj
      if (obj instanceof Object) var copy = { __proto__: getPrototypeOf(obj) }
      else var copy = /* @__PURE__ */ Object.create(null)
      Object.getOwnPropertyNames(obj).forEach(function (key) {
        Object.defineProperty(copy, key, Object.getOwnPropertyDescriptor(obj, key))
      })
      return copy
    }
  },
})

// node_modules/.pnpm/graceful-fs@4.2.11/node_modules/graceful-fs/graceful-fs.js
var require_graceful_fs = __commonJS({
  'node_modules/.pnpm/graceful-fs@4.2.11/node_modules/graceful-fs/graceful-fs.js'(exports, module) {
    var fs2 = __require('fs')
    var polyfills = require_polyfills()
    var legacy = require_legacy_streams()
    var clone = require_clone()
    var util = __require('util')
    var gracefulQueue
    var previousSymbol
    if (typeof Symbol === 'function' && typeof Symbol.for === 'function') {
      gracefulQueue = /* @__PURE__ */ Symbol.for('graceful-fs.queue')
      previousSymbol = /* @__PURE__ */ Symbol.for('graceful-fs.previous')
    } else {
      gracefulQueue = '___graceful-fs.queue'
      previousSymbol = '___graceful-fs.previous'
    }
    function noop() {}
    function publishQueue(context, queue2) {
      Object.defineProperty(context, gracefulQueue, {
        get: function () {
          return queue2
        },
      })
    }
    var debug = noop
    if (util.debuglog) debug = util.debuglog('gfs4')
    else if (/\bgfs4\b/i.test(process.env.NODE_DEBUG || ''))
      debug = function () {
        var m = util.format.apply(util, arguments)
        m = 'GFS4: ' + m.split(/\n/).join('\nGFS4: ')
        console.error(m)
      }
    if (!fs2[gracefulQueue]) {
      queue = global[gracefulQueue] || []
      publishQueue(fs2, queue)
      fs2.close = (function (fs$close) {
        function close(fd, cb) {
          return fs$close.call(fs2, fd, function (err) {
            if (!err) {
              resetQueue()
            }
            if (typeof cb === 'function') cb.apply(this, arguments)
          })
        }
        Object.defineProperty(close, previousSymbol, {
          value: fs$close,
        })
        return close
      })(fs2.close)
      fs2.closeSync = (function (fs$closeSync) {
        function closeSync2(fd) {
          fs$closeSync.apply(fs2, arguments)
          resetQueue()
        }
        Object.defineProperty(closeSync2, previousSymbol, {
          value: fs$closeSync,
        })
        return closeSync2
      })(fs2.closeSync)
      if (/\bgfs4\b/i.test(process.env.NODE_DEBUG || '')) {
        process.on('exit', function () {
          debug(fs2[gracefulQueue])
          __require('assert').equal(fs2[gracefulQueue].length, 0)
        })
      }
    }
    var queue
    if (!global[gracefulQueue]) {
      publishQueue(global, fs2[gracefulQueue])
    }
    module.exports = patch(clone(fs2))
    if (process.env.TEST_GRACEFUL_FS_GLOBAL_PATCH && !fs2.__patched) {
      module.exports = patch(fs2)
      fs2.__patched = true
    }
    function patch(fs3) {
      polyfills(fs3)
      fs3.gracefulify = patch
      fs3.createReadStream = createReadStream
      fs3.createWriteStream = createWriteStream
      var fs$readFile = fs3.readFile
      fs3.readFile = readFile
      function readFile(path, options, cb) {
        if (typeof options === 'function') (cb = options), (options = null)
        return go$readFile(path, options, cb)
        function go$readFile(path2, options2, cb2, startTime) {
          return fs$readFile(path2, options2, function (err) {
            if (err && (err.code === 'EMFILE' || err.code === 'ENFILE'))
              enqueue([
                go$readFile,
                [path2, options2, cb2],
                err,
                startTime || Date.now(),
                Date.now(),
              ])
            else {
              if (typeof cb2 === 'function') cb2.apply(this, arguments)
            }
          })
        }
      }
      var fs$writeFile = fs3.writeFile
      fs3.writeFile = writeFile
      function writeFile(path, data, options, cb) {
        if (typeof options === 'function') (cb = options), (options = null)
        return go$writeFile(path, data, options, cb)
        function go$writeFile(path2, data2, options2, cb2, startTime) {
          return fs$writeFile(path2, data2, options2, function (err) {
            if (err && (err.code === 'EMFILE' || err.code === 'ENFILE'))
              enqueue([
                go$writeFile,
                [path2, data2, options2, cb2],
                err,
                startTime || Date.now(),
                Date.now(),
              ])
            else {
              if (typeof cb2 === 'function') cb2.apply(this, arguments)
            }
          })
        }
      }
      var fs$appendFile = fs3.appendFile
      if (fs$appendFile) fs3.appendFile = appendFile
      function appendFile(path, data, options, cb) {
        if (typeof options === 'function') (cb = options), (options = null)
        return go$appendFile(path, data, options, cb)
        function go$appendFile(path2, data2, options2, cb2, startTime) {
          return fs$appendFile(path2, data2, options2, function (err) {
            if (err && (err.code === 'EMFILE' || err.code === 'ENFILE'))
              enqueue([
                go$appendFile,
                [path2, data2, options2, cb2],
                err,
                startTime || Date.now(),
                Date.now(),
              ])
            else {
              if (typeof cb2 === 'function') cb2.apply(this, arguments)
            }
          })
        }
      }
      var fs$copyFile = fs3.copyFile
      if (fs$copyFile) fs3.copyFile = copyFile
      function copyFile(src, dest, flags, cb) {
        if (typeof flags === 'function') {
          cb = flags
          flags = 0
        }
        return go$copyFile(src, dest, flags, cb)
        function go$copyFile(src2, dest2, flags2, cb2, startTime) {
          return fs$copyFile(src2, dest2, flags2, function (err) {
            if (err && (err.code === 'EMFILE' || err.code === 'ENFILE'))
              enqueue([
                go$copyFile,
                [src2, dest2, flags2, cb2],
                err,
                startTime || Date.now(),
                Date.now(),
              ])
            else {
              if (typeof cb2 === 'function') cb2.apply(this, arguments)
            }
          })
        }
      }
      var fs$readdir = fs3.readdir
      fs3.readdir = readdir
      var noReaddirOptionVersions = /^v[0-5]\./
      function readdir(path, options, cb) {
        if (typeof options === 'function') (cb = options), (options = null)
        var go$readdir = noReaddirOptionVersions.test(process.version)
          ? function go$readdir2(path2, options2, cb2, startTime) {
              return fs$readdir(path2, fs$readdirCallback(path2, options2, cb2, startTime))
            }
          : function go$readdir2(path2, options2, cb2, startTime) {
              return fs$readdir(
                path2,
                options2,
                fs$readdirCallback(path2, options2, cb2, startTime),
              )
            }
        return go$readdir(path, options, cb)
        function fs$readdirCallback(path2, options2, cb2, startTime) {
          return function (err, files) {
            if (err && (err.code === 'EMFILE' || err.code === 'ENFILE'))
              enqueue([
                go$readdir,
                [path2, options2, cb2],
                err,
                startTime || Date.now(),
                Date.now(),
              ])
            else {
              if (files && files.sort) files.sort()
              if (typeof cb2 === 'function') cb2.call(this, err, files)
            }
          }
        }
      }
      if (process.version.substr(0, 4) === 'v0.8') {
        var legStreams = legacy(fs3)
        ReadStream = legStreams.ReadStream
        WriteStream = legStreams.WriteStream
      }
      var fs$ReadStream = fs3.ReadStream
      if (fs$ReadStream) {
        ReadStream.prototype = Object.create(fs$ReadStream.prototype)
        ReadStream.prototype.open = ReadStream$open
      }
      var fs$WriteStream = fs3.WriteStream
      if (fs$WriteStream) {
        WriteStream.prototype = Object.create(fs$WriteStream.prototype)
        WriteStream.prototype.open = WriteStream$open
      }
      Object.defineProperty(fs3, 'ReadStream', {
        get: function () {
          return ReadStream
        },
        set: function (val) {
          ReadStream = val
        },
        enumerable: true,
        configurable: true,
      })
      Object.defineProperty(fs3, 'WriteStream', {
        get: function () {
          return WriteStream
        },
        set: function (val) {
          WriteStream = val
        },
        enumerable: true,
        configurable: true,
      })
      var FileReadStream = ReadStream
      Object.defineProperty(fs3, 'FileReadStream', {
        get: function () {
          return FileReadStream
        },
        set: function (val) {
          FileReadStream = val
        },
        enumerable: true,
        configurable: true,
      })
      var FileWriteStream = WriteStream
      Object.defineProperty(fs3, 'FileWriteStream', {
        get: function () {
          return FileWriteStream
        },
        set: function (val) {
          FileWriteStream = val
        },
        enumerable: true,
        configurable: true,
      })
      function ReadStream(path, options) {
        if (this instanceof ReadStream) return fs$ReadStream.apply(this, arguments), this
        else return ReadStream.apply(Object.create(ReadStream.prototype), arguments)
      }
      function ReadStream$open() {
        var that = this
        open(that.path, that.flags, that.mode, function (err, fd) {
          if (err) {
            if (that.autoClose) that.destroy()
            that.emit('error', err)
          } else {
            that.fd = fd
            that.emit('open', fd)
            that.read()
          }
        })
      }
      function WriteStream(path, options) {
        if (this instanceof WriteStream) return fs$WriteStream.apply(this, arguments), this
        else return WriteStream.apply(Object.create(WriteStream.prototype), arguments)
      }
      function WriteStream$open() {
        var that = this
        open(that.path, that.flags, that.mode, function (err, fd) {
          if (err) {
            that.destroy()
            that.emit('error', err)
          } else {
            that.fd = fd
            that.emit('open', fd)
          }
        })
      }
      function createReadStream(path, options) {
        return new fs3.ReadStream(path, options)
      }
      function createWriteStream(path, options) {
        return new fs3.WriteStream(path, options)
      }
      var fs$open = fs3.open
      fs3.open = open
      function open(path, flags, mode, cb) {
        if (typeof mode === 'function') (cb = mode), (mode = null)
        return go$open(path, flags, mode, cb)
        function go$open(path2, flags2, mode2, cb2, startTime) {
          return fs$open(path2, flags2, mode2, function (err, fd) {
            if (err && (err.code === 'EMFILE' || err.code === 'ENFILE'))
              enqueue([
                go$open,
                [path2, flags2, mode2, cb2],
                err,
                startTime || Date.now(),
                Date.now(),
              ])
            else {
              if (typeof cb2 === 'function') cb2.apply(this, arguments)
            }
          })
        }
      }
      return fs3
    }
    function enqueue(elem) {
      debug('ENQUEUE', elem[0].name, elem[1])
      fs2[gracefulQueue].push(elem)
      retry()
    }
    var retryTimer
    function resetQueue() {
      var now = Date.now()
      for (var i = 0; i < fs2[gracefulQueue].length; ++i) {
        if (fs2[gracefulQueue][i].length > 2) {
          fs2[gracefulQueue][i][3] = now
          fs2[gracefulQueue][i][4] = now
        }
      }
      retry()
    }
    function retry() {
      clearTimeout(retryTimer)
      retryTimer = void 0
      if (fs2[gracefulQueue].length === 0) return
      var elem = fs2[gracefulQueue].shift()
      var fn = elem[0]
      var args = elem[1]
      var err = elem[2]
      var startTime = elem[3]
      var lastTime = elem[4]
      if (startTime === void 0) {
        debug('RETRY', fn.name, args)
        fn.apply(null, args)
      } else if (Date.now() - startTime >= 6e4) {
        debug('TIMEOUT', fn.name, args)
        var cb = args.pop()
        if (typeof cb === 'function') cb.call(null, err)
      } else {
        var sinceAttempt = Date.now() - lastTime
        var sinceStart = Math.max(lastTime - startTime, 1)
        var desiredDelay = Math.min(sinceStart * 1.2, 100)
        if (sinceAttempt >= desiredDelay) {
          debug('RETRY', fn.name, args)
          fn.apply(null, args.concat([startTime]))
        } else {
          fs2[gracefulQueue].push(elem)
        }
      }
      if (retryTimer === void 0) {
        retryTimer = setTimeout(retry, 0)
      }
    }
  },
})

// node_modules/.pnpm/retry@0.12.0/node_modules/retry/lib/retry_operation.js
var require_retry_operation = __commonJS({
  'node_modules/.pnpm/retry@0.12.0/node_modules/retry/lib/retry_operation.js'(exports, module) {
    function RetryOperation(timeouts, options) {
      if (typeof options === 'boolean') {
        options = { forever: options }
      }
      this._originalTimeouts = JSON.parse(JSON.stringify(timeouts))
      this._timeouts = timeouts
      this._options = options || {}
      this._maxRetryTime = (options && options.maxRetryTime) || Infinity
      this._fn = null
      this._errors = []
      this._attempts = 1
      this._operationTimeout = null
      this._operationTimeoutCb = null
      this._timeout = null
      this._operationStart = null
      if (this._options.forever) {
        this._cachedTimeouts = this._timeouts.slice(0)
      }
    }
    module.exports = RetryOperation
    RetryOperation.prototype.reset = function () {
      this._attempts = 1
      this._timeouts = this._originalTimeouts
    }
    RetryOperation.prototype.stop = function () {
      if (this._timeout) {
        clearTimeout(this._timeout)
      }
      this._timeouts = []
      this._cachedTimeouts = null
    }
    RetryOperation.prototype.retry = function (err) {
      if (this._timeout) {
        clearTimeout(this._timeout)
      }
      if (!err) {
        return false
      }
      var currentTime = /* @__PURE__ */ new Date().getTime()
      if (err && currentTime - this._operationStart >= this._maxRetryTime) {
        this._errors.unshift(new Error('RetryOperation timeout occurred'))
        return false
      }
      this._errors.push(err)
      var timeout = this._timeouts.shift()
      if (timeout === void 0) {
        if (this._cachedTimeouts) {
          this._errors.splice(this._errors.length - 1, this._errors.length)
          this._timeouts = this._cachedTimeouts.slice(0)
          timeout = this._timeouts.shift()
        } else {
          return false
        }
      }
      var self = this
      var timer = setTimeout(function () {
        self._attempts++
        if (self._operationTimeoutCb) {
          self._timeout = setTimeout(function () {
            self._operationTimeoutCb(self._attempts)
          }, self._operationTimeout)
          if (self._options.unref) {
            self._timeout.unref()
          }
        }
        self._fn(self._attempts)
      }, timeout)
      if (this._options.unref) {
        timer.unref()
      }
      return true
    }
    RetryOperation.prototype.attempt = function (fn, timeoutOps) {
      this._fn = fn
      if (timeoutOps) {
        if (timeoutOps.timeout) {
          this._operationTimeout = timeoutOps.timeout
        }
        if (timeoutOps.cb) {
          this._operationTimeoutCb = timeoutOps.cb
        }
      }
      var self = this
      if (this._operationTimeoutCb) {
        this._timeout = setTimeout(function () {
          self._operationTimeoutCb()
        }, self._operationTimeout)
      }
      this._operationStart = /* @__PURE__ */ new Date().getTime()
      this._fn(this._attempts)
    }
    RetryOperation.prototype.try = function (fn) {
      console.log('Using RetryOperation.try() is deprecated')
      this.attempt(fn)
    }
    RetryOperation.prototype.start = function (fn) {
      console.log('Using RetryOperation.start() is deprecated')
      this.attempt(fn)
    }
    RetryOperation.prototype.start = RetryOperation.prototype.try
    RetryOperation.prototype.errors = function () {
      return this._errors
    }
    RetryOperation.prototype.attempts = function () {
      return this._attempts
    }
    RetryOperation.prototype.mainError = function () {
      if (this._errors.length === 0) {
        return null
      }
      var counts = {}
      var mainError = null
      var mainErrorCount = 0
      for (var i = 0; i < this._errors.length; i++) {
        var error = this._errors[i]
        var message = error.message
        var count = (counts[message] || 0) + 1
        counts[message] = count
        if (count >= mainErrorCount) {
          mainError = error
          mainErrorCount = count
        }
      }
      return mainError
    }
  },
})

// node_modules/.pnpm/retry@0.12.0/node_modules/retry/lib/retry.js
var require_retry = __commonJS({
  'node_modules/.pnpm/retry@0.12.0/node_modules/retry/lib/retry.js'(exports) {
    var RetryOperation = require_retry_operation()
    exports.operation = function (options) {
      var timeouts = exports.timeouts(options)
      return new RetryOperation(timeouts, {
        forever: options && options.forever,
        unref: options && options.unref,
        maxRetryTime: options && options.maxRetryTime,
      })
    }
    exports.timeouts = function (options) {
      if (options instanceof Array) {
        return [].concat(options)
      }
      var opts = {
        retries: 10,
        factor: 2,
        minTimeout: 1 * 1e3,
        maxTimeout: Infinity,
        randomize: false,
      }
      for (var key in options) {
        opts[key] = options[key]
      }
      if (opts.minTimeout > opts.maxTimeout) {
        throw new Error('minTimeout is greater than maxTimeout')
      }
      var timeouts = []
      for (var i = 0; i < opts.retries; i++) {
        timeouts.push(this.createTimeout(i, opts))
      }
      if (options && options.forever && !timeouts.length) {
        timeouts.push(this.createTimeout(i, opts))
      }
      timeouts.sort(function (a, b) {
        return a - b
      })
      return timeouts
    }
    exports.createTimeout = function (attempt, opts) {
      var random = opts.randomize ? Math.random() + 1 : 1
      var timeout = Math.round(random * opts.minTimeout * Math.pow(opts.factor, attempt))
      timeout = Math.min(timeout, opts.maxTimeout)
      return timeout
    }
    exports.wrap = function (obj, options, methods) {
      if (options instanceof Array) {
        methods = options
        options = null
      }
      if (!methods) {
        methods = []
        for (var key in obj) {
          if (typeof obj[key] === 'function') {
            methods.push(key)
          }
        }
      }
      for (var i = 0; i < methods.length; i++) {
        var method = methods[i]
        var original = obj[method]
        obj[method] = function retryWrapper(original2) {
          var op = exports.operation(options)
          var args = Array.prototype.slice.call(arguments, 1)
          var callback = args.pop()
          args.push(function (err) {
            if (op.retry(err)) {
              return
            }
            if (err) {
              arguments[0] = op.mainError()
            }
            callback.apply(this, arguments)
          })
          op.attempt(function () {
            original2.apply(obj, args)
          })
        }.bind(obj, original)
        obj[method].options = options
      }
    }
  },
})

// node_modules/.pnpm/retry@0.12.0/node_modules/retry/index.js
var require_retry2 = __commonJS({
  'node_modules/.pnpm/retry@0.12.0/node_modules/retry/index.js'(exports, module) {
    module.exports = require_retry()
  },
})

// node_modules/.pnpm/signal-exit@3.0.7/node_modules/signal-exit/signals.js
var require_signals = __commonJS({
  'node_modules/.pnpm/signal-exit@3.0.7/node_modules/signal-exit/signals.js'(exports, module) {
    module.exports = ['SIGABRT', 'SIGALRM', 'SIGHUP', 'SIGINT', 'SIGTERM']
    if (process.platform !== 'win32') {
      module.exports.push(
        'SIGVTALRM',
        'SIGXCPU',
        'SIGXFSZ',
        'SIGUSR2',
        'SIGTRAP',
        'SIGSYS',
        'SIGQUIT',
        'SIGIOT',
        // should detect profiler and enable/disable accordingly.
        // see #21
        // 'SIGPROF'
      )
    }
    if (process.platform === 'linux') {
      module.exports.push('SIGIO', 'SIGPOLL', 'SIGPWR', 'SIGSTKFLT', 'SIGUNUSED')
    }
  },
})

// node_modules/.pnpm/signal-exit@3.0.7/node_modules/signal-exit/index.js
var require_signal_exit = __commonJS({
  'node_modules/.pnpm/signal-exit@3.0.7/node_modules/signal-exit/index.js'(exports, module) {
    var process2 = global.process
    var processOk = function (process3) {
      return (
        process3 &&
        typeof process3 === 'object' &&
        typeof process3.removeListener === 'function' &&
        typeof process3.emit === 'function' &&
        typeof process3.reallyExit === 'function' &&
        typeof process3.listeners === 'function' &&
        typeof process3.kill === 'function' &&
        typeof process3.pid === 'number' &&
        typeof process3.on === 'function'
      )
    }
    if (!processOk(process2)) {
      module.exports = function () {
        return function () {}
      }
    } else {
      assert = __require('assert')
      signals = require_signals()
      isWin = /^win/i.test(process2.platform)
      EE = __require('events')
      if (typeof EE !== 'function') {
        EE = EE.EventEmitter
      }
      if (process2.__signal_exit_emitter__) {
        emitter = process2.__signal_exit_emitter__
      } else {
        emitter = process2.__signal_exit_emitter__ = new EE()
        emitter.count = 0
        emitter.emitted = {}
      }
      if (!emitter.infinite) {
        emitter.setMaxListeners(Infinity)
        emitter.infinite = true
      }
      module.exports = function (cb, opts) {
        if (!processOk(global.process)) {
          return function () {}
        }
        assert.equal(typeof cb, 'function', 'a callback must be provided for exit handler')
        if (loaded === false) {
          load()
        }
        var ev = 'exit'
        if (opts && opts.alwaysLast) {
          ev = 'afterexit'
        }
        var remove = function () {
          emitter.removeListener(ev, cb)
          if (
            emitter.listeners('exit').length === 0 &&
            emitter.listeners('afterexit').length === 0
          ) {
            unload()
          }
        }
        emitter.on(ev, cb)
        return remove
      }
      unload = function unload2() {
        if (!loaded || !processOk(global.process)) {
          return
        }
        loaded = false
        signals.forEach(function (sig) {
          try {
            process2.removeListener(sig, sigListeners[sig])
          } catch (er) {}
        })
        process2.emit = originalProcessEmit
        process2.reallyExit = originalProcessReallyExit
        emitter.count -= 1
      }
      module.exports.unload = unload
      emit = function emit2(event, code, signal) {
        if (emitter.emitted[event]) {
          return
        }
        emitter.emitted[event] = true
        emitter.emit(event, code, signal)
      }
      sigListeners = {}
      signals.forEach(function (sig) {
        sigListeners[sig] = function listener() {
          if (!processOk(global.process)) {
            return
          }
          var listeners = process2.listeners(sig)
          if (listeners.length === emitter.count) {
            unload()
            emit('exit', null, sig)
            emit('afterexit', null, sig)
            if (isWin && sig === 'SIGHUP') {
              sig = 'SIGINT'
            }
            process2.kill(process2.pid, sig)
          }
        }
      })
      module.exports.signals = function () {
        return signals
      }
      loaded = false
      load = function load2() {
        if (loaded || !processOk(global.process)) {
          return
        }
        loaded = true
        emitter.count += 1
        signals = signals.filter(function (sig) {
          try {
            process2.on(sig, sigListeners[sig])
            return true
          } catch (er) {
            return false
          }
        })
        process2.emit = processEmit
        process2.reallyExit = processReallyExit
      }
      module.exports.load = load
      originalProcessReallyExit = process2.reallyExit
      processReallyExit = function processReallyExit2(code) {
        if (!processOk(global.process)) {
          return
        }
        process2.exitCode = code /* istanbul ignore next */ || 0
        emit('exit', process2.exitCode, null)
        emit('afterexit', process2.exitCode, null)
        originalProcessReallyExit.call(process2, process2.exitCode)
      }
      originalProcessEmit = process2.emit
      processEmit = function processEmit2(ev, arg) {
        if (ev === 'exit' && processOk(global.process)) {
          if (arg !== void 0) {
            process2.exitCode = arg
          }
          var ret = originalProcessEmit.apply(this, arguments)
          emit('exit', process2.exitCode, null)
          emit('afterexit', process2.exitCode, null)
          return ret
        } else {
          return originalProcessEmit.apply(this, arguments)
        }
      }
    }
    var assert
    var signals
    var isWin
    var EE
    var emitter
    var unload
    var emit
    var sigListeners
    var loaded
    var load
    var originalProcessReallyExit
    var processReallyExit
    var originalProcessEmit
    var processEmit
  },
})

// node_modules/.pnpm/proper-lockfile@4.1.2/node_modules/proper-lockfile/lib/mtime-precision.js
var require_mtime_precision = __commonJS({
  'node_modules/.pnpm/proper-lockfile@4.1.2/node_modules/proper-lockfile/lib/mtime-precision.js'(
    exports,
    module,
  ) {
    'use strict'
    var cacheSymbol = /* @__PURE__ */ Symbol()
    function probe(file, fs2, callback) {
      const cachedPrecision = fs2[cacheSymbol]
      if (cachedPrecision) {
        return fs2.stat(file, (err, stat) => {
          if (err) {
            return callback(err)
          }
          callback(null, stat.mtime, cachedPrecision)
        })
      }
      const mtime = new Date(Math.ceil(Date.now() / 1e3) * 1e3 + 5)
      fs2.utimes(file, mtime, mtime, (err) => {
        if (err) {
          return callback(err)
        }
        fs2.stat(file, (err2, stat) => {
          if (err2) {
            return callback(err2)
          }
          const precision = stat.mtime.getTime() % 1e3 === 0 ? 's' : 'ms'
          Object.defineProperty(fs2, cacheSymbol, { value: precision })
          callback(null, stat.mtime, precision)
        })
      })
    }
    function getMtime(precision) {
      let now = Date.now()
      if (precision === 's') {
        now = Math.ceil(now / 1e3) * 1e3
      }
      return new Date(now)
    }
    module.exports.probe = probe
    module.exports.getMtime = getMtime
  },
})

// node_modules/.pnpm/proper-lockfile@4.1.2/node_modules/proper-lockfile/lib/lockfile.js
var require_lockfile = __commonJS({
  'node_modules/.pnpm/proper-lockfile@4.1.2/node_modules/proper-lockfile/lib/lockfile.js'(
    exports,
    module,
  ) {
    'use strict'
    var path = __require('path')
    var fs2 = require_graceful_fs()
    var retry = require_retry2()
    var onExit = require_signal_exit()
    var mtimePrecision = require_mtime_precision()
    var locks = {}
    function getLockFile(file, options) {
      return options.lockfilePath || `${file}.lock`
    }
    function resolveCanonicalPath(file, options, callback) {
      if (!options.realpath) {
        return callback(null, path.resolve(file))
      }
      options.fs.realpath(file, callback)
    }
    function acquireLock(file, options, callback) {
      const lockfilePath = getLockFile(file, options)
      options.fs.mkdir(lockfilePath, (err) => {
        if (!err) {
          return mtimePrecision.probe(lockfilePath, options.fs, (err2, mtime, mtimePrecision2) => {
            if (err2) {
              options.fs.rmdir(lockfilePath, () => {})
              return callback(err2)
            }
            callback(null, mtime, mtimePrecision2)
          })
        }
        if (err.code !== 'EEXIST') {
          return callback(err)
        }
        if (options.stale <= 0) {
          return callback(
            Object.assign(new Error('Lock file is already being held'), { code: 'ELOCKED', file }),
          )
        }
        options.fs.stat(lockfilePath, (err2, stat) => {
          if (err2) {
            if (err2.code === 'ENOENT') {
              return acquireLock(file, { ...options, stale: 0 }, callback)
            }
            return callback(err2)
          }
          if (!isLockStale(stat, options)) {
            return callback(
              Object.assign(new Error('Lock file is already being held'), {
                code: 'ELOCKED',
                file,
              }),
            )
          }
          removeLock(file, options, (err3) => {
            if (err3) {
              return callback(err3)
            }
            acquireLock(file, { ...options, stale: 0 }, callback)
          })
        })
      })
    }
    function isLockStale(stat, options) {
      return stat.mtime.getTime() < Date.now() - options.stale
    }
    function removeLock(file, options, callback) {
      options.fs.rmdir(getLockFile(file, options), (err) => {
        if (err && err.code !== 'ENOENT') {
          return callback(err)
        }
        callback()
      })
    }
    function updateLock(file, options) {
      const lock2 = locks[file]
      if (lock2.updateTimeout) {
        return
      }
      lock2.updateDelay = lock2.updateDelay || options.update
      lock2.updateTimeout = setTimeout(() => {
        lock2.updateTimeout = null
        options.fs.stat(lock2.lockfilePath, (err, stat) => {
          const isOverThreshold = lock2.lastUpdate + options.stale < Date.now()
          if (err) {
            if (err.code === 'ENOENT' || isOverThreshold) {
              return setLockAsCompromised(file, lock2, Object.assign(err, { code: 'ECOMPROMISED' }))
            }
            lock2.updateDelay = 1e3
            return updateLock(file, options)
          }
          const isMtimeOurs = lock2.mtime.getTime() === stat.mtime.getTime()
          if (!isMtimeOurs) {
            return setLockAsCompromised(
              file,
              lock2,
              Object.assign(new Error('Unable to update lock within the stale threshold'), {
                code: 'ECOMPROMISED',
              }),
            )
          }
          const mtime = mtimePrecision.getMtime(lock2.mtimePrecision)
          options.fs.utimes(lock2.lockfilePath, mtime, mtime, (err2) => {
            const isOverThreshold2 = lock2.lastUpdate + options.stale < Date.now()
            if (lock2.released) {
              return
            }
            if (err2) {
              if (err2.code === 'ENOENT' || isOverThreshold2) {
                return setLockAsCompromised(
                  file,
                  lock2,
                  Object.assign(err2, { code: 'ECOMPROMISED' }),
                )
              }
              lock2.updateDelay = 1e3
              return updateLock(file, options)
            }
            lock2.mtime = mtime
            lock2.lastUpdate = Date.now()
            lock2.updateDelay = null
            updateLock(file, options)
          })
        })
      }, lock2.updateDelay)
      if (lock2.updateTimeout.unref) {
        lock2.updateTimeout.unref()
      }
    }
    function setLockAsCompromised(file, lock2, err) {
      lock2.released = true
      if (lock2.updateTimeout) {
        clearTimeout(lock2.updateTimeout)
      }
      if (locks[file] === lock2) {
        delete locks[file]
      }
      lock2.options.onCompromised(err)
    }
    function lock(file, options, callback) {
      options = {
        stale: 1e4,
        update: null,
        realpath: true,
        retries: 0,
        fs: fs2,
        onCompromised: (err) => {
          throw err
        },
        ...options,
      }
      options.retries = options.retries || 0
      options.retries =
        typeof options.retries === 'number' ? { retries: options.retries } : options.retries
      options.stale = Math.max(options.stale || 0, 2e3)
      options.update = options.update == null ? options.stale / 2 : options.update || 0
      options.update = Math.max(Math.min(options.update, options.stale / 2), 1e3)
      resolveCanonicalPath(file, options, (err, file2) => {
        if (err) {
          return callback(err)
        }
        const operation = retry.operation(options.retries)
        operation.attempt(() => {
          acquireLock(file2, options, (err2, mtime, mtimePrecision2) => {
            if (operation.retry(err2)) {
              return
            }
            if (err2) {
              return callback(operation.mainError())
            }
            const lock2 = (locks[file2] = {
              lockfilePath: getLockFile(file2, options),
              mtime,
              mtimePrecision: mtimePrecision2,
              options,
              lastUpdate: Date.now(),
            })
            updateLock(file2, options)
            callback(null, (releasedCallback) => {
              if (lock2.released) {
                return (
                  releasedCallback &&
                  releasedCallback(
                    Object.assign(new Error('Lock is already released'), { code: 'ERELEASED' }),
                  )
                )
              }
              unlock(file2, { ...options, realpath: false }, releasedCallback)
            })
          })
        })
      })
    }
    function unlock(file, options, callback) {
      options = {
        fs: fs2,
        realpath: true,
        ...options,
      }
      resolveCanonicalPath(file, options, (err, file2) => {
        if (err) {
          return callback(err)
        }
        const lock2 = locks[file2]
        if (!lock2) {
          return callback(
            Object.assign(new Error('Lock is not acquired/owned by you'), { code: 'ENOTACQUIRED' }),
          )
        }
        lock2.updateTimeout && clearTimeout(lock2.updateTimeout)
        lock2.released = true
        delete locks[file2]
        removeLock(file2, options, callback)
      })
    }
    function check(file, options, callback) {
      options = {
        stale: 1e4,
        realpath: true,
        fs: fs2,
        ...options,
      }
      options.stale = Math.max(options.stale || 0, 2e3)
      resolveCanonicalPath(file, options, (err, file2) => {
        if (err) {
          return callback(err)
        }
        options.fs.stat(getLockFile(file2, options), (err2, stat) => {
          if (err2) {
            return err2.code === 'ENOENT' ? callback(null, false) : callback(err2)
          }
          return callback(null, !isLockStale(stat, options))
        })
      })
    }
    function getLocks() {
      return locks
    }
    onExit(() => {
      for (const file in locks) {
        const options = locks[file].options
        try {
          options.fs.rmdirSync(getLockFile(file, options))
        } catch (e) {}
      }
    })
    module.exports.lock = lock
    module.exports.unlock = unlock
    module.exports.check = check
    module.exports.getLocks = getLocks
  },
})

// node_modules/.pnpm/proper-lockfile@4.1.2/node_modules/proper-lockfile/lib/adapter.js
var require_adapter = __commonJS({
  'node_modules/.pnpm/proper-lockfile@4.1.2/node_modules/proper-lockfile/lib/adapter.js'(
    exports,
    module,
  ) {
    'use strict'
    var fs2 = require_graceful_fs()
    function createSyncFs(fs3) {
      const methods = ['mkdir', 'realpath', 'stat', 'rmdir', 'utimes']
      const newFs = { ...fs3 }
      methods.forEach((method) => {
        newFs[method] = (...args) => {
          const callback = args.pop()
          let ret
          try {
            ret = fs3[`${method}Sync`](...args)
          } catch (err) {
            return callback(err)
          }
          callback(null, ret)
        }
      })
      return newFs
    }
    function toPromise(method) {
      return (...args) =>
        new Promise((resolve2, reject) => {
          args.push((err, result) => {
            if (err) {
              reject(err)
            } else {
              resolve2(result)
            }
          })
          method(...args)
        })
    }
    function toSync(method) {
      return (...args) => {
        let err
        let result
        args.push((_err, _result) => {
          err = _err
          result = _result
        })
        method(...args)
        if (err) {
          throw err
        }
        return result
      }
    }
    function toSyncOptions(options) {
      options = { ...options }
      options.fs = createSyncFs(options.fs || fs2)
      if (
        (typeof options.retries === 'number' && options.retries > 0) ||
        (options.retries &&
          typeof options.retries.retries === 'number' &&
          options.retries.retries > 0)
      ) {
        throw Object.assign(new Error('Cannot use retries with the sync api'), { code: 'ESYNC' })
      }
      return options
    }
    module.exports = {
      toPromise,
      toSync,
      toSyncOptions,
    }
  },
})

// node_modules/.pnpm/proper-lockfile@4.1.2/node_modules/proper-lockfile/index.js
var require_proper_lockfile = __commonJS({
  'node_modules/.pnpm/proper-lockfile@4.1.2/node_modules/proper-lockfile/index.js'(
    exports,
    module,
  ) {
    'use strict'
    var lockfile2 = require_lockfile()
    var { toPromise, toSync, toSyncOptions } = require_adapter()
    async function lock(file, options) {
      const release = await toPromise(lockfile2.lock)(file, options)
      return toPromise(release)
    }
    function lockSync(file, options) {
      const release = toSync(lockfile2.lock)(file, toSyncOptions(options))
      return toSync(release)
    }
    function unlock(file, options) {
      return toPromise(lockfile2.unlock)(file, options)
    }
    function unlockSync(file, options) {
      return toSync(lockfile2.unlock)(file, toSyncOptions(options))
    }
    function check(file, options) {
      return toPromise(lockfile2.check)(file, options)
    }
    function checkSync(file, options) {
      return toSync(lockfile2.check)(file, toSyncOptions(options))
    }
    module.exports = lock
    module.exports.lock = lock
    module.exports.unlock = unlock
    module.exports.lockSync = lockSync
    module.exports.unlockSync = unlockSync
    module.exports.check = check
    module.exports.checkSync = checkSync
  },
})

// src/platform/packagePath.ts
var init_packagePath = __esm({
  'src/platform/packagePath.ts'() {
    'use strict'
  },
})

// src/platform/platform.ts
var init_platform = __esm({
  'src/platform/platform.ts'() {
    'use strict'
  },
})

// src/platform/assetsRoot.ts
function isCompiledRuntime(url = import.meta.url) {
  return isCompiledModuleUrl(url)
}
function isCompiledModuleUrl(url) {
  let s = url
  try {
    s = decodeURIComponent(url)
  } catch {}
  const normalized = s.replace(/\\/g, '/').toLowerCase()
  return BUNFS_MARKERS.some((m) => normalized.includes(m))
}
var BUNFS_MARKERS
var init_assetsRoot = __esm({
  'src/platform/assetsRoot.ts'() {
    'use strict'
    init_packagePath()
    init_platform()
    BUNFS_MARKERS = ['/$bunfs/', '/~bun/']
  },
})

// src/platform/runtime.ts
function isBunRuntime(versions = process.versions, compiled) {
  return (
    typeof versions.bun === 'string' &&
    versions.bun.trim().length > 0 &&
    !(compiled ?? isCompiledRuntime())
  )
}
function bunExecutable() {
  return isBunRuntime() ? process.execPath : process.platform === 'win32' ? 'bun.exe' : 'bun'
}
var init_runtime = __esm({
  'src/platform/runtime.ts'() {
    'use strict'
    init_assetsRoot()
  },
})

// src/cli/lib/version-check.ts
var version_check_exports = {}
__export(version_check_exports, {
  compareVersions: () => compareVersions,
  fetchLatestBunVersion: () => fetchLatestBunVersion,
  fetchLatestNpmVersion: () => fetchLatestNpmVersion,
  fetchLatestVersion: () => fetchLatestVersion,
})
import { exec, execFile } from 'node:child_process'
import { promisify } from 'node:util'
function parse(v) {
  const m = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/.exec(v.trim())
  if (!m) return null
  return { nums: [Number(m[1]), Number(m[2]), Number(m[3])], pre: m[4] ?? null }
}
function compareVersions(installed, latest) {
  const a = parse(installed)
  const b = parse(latest)
  if (!a || !b) return 'unknown'
  for (let i = 0; i < 3; i++) {
    const ai = a.nums[i] ?? 0
    const bi = b.nums[i] ?? 0
    if (ai < bi) return 'behind'
    if (ai > bi) return 'ahead'
  }
  if (a.pre && !b.pre) return 'behind'
  if (!a.pre && b.pre) return 'ahead'
  if (a.pre && b.pre && a.pre !== b.pre) return a.pre < b.pre ? 'behind' : 'ahead'
  return 'current'
}
function npmExecutable() {
  return process.platform === 'win32' ? 'npm.cmd' : 'npm'
}
async function defaultRunner() {
  if (process.platform === 'win32') {
    const { stdout: stdout2 } = await execAsync('npm view harnessed version', {
      timeout: 8e3,
      windowsHide: true,
    })
    return stdout2
  }
  const { stdout } = await execFileAsync(npmExecutable(), ['view', 'harnessed', 'version'], {
    timeout: 8e3,
    windowsHide: true,
  })
  return stdout
}
async function fetchLatestVersion(runner) {
  try {
    if (runner !== void 0) return await fetchLatestNpmVersion(runner)
    return isBunRuntime() ? await fetchLatestBunVersion() : await fetchLatestNpmVersion()
  } catch {
    return null
  }
}
async function fetchLatestNpmVersion(runner = defaultRunner) {
  try {
    const out = (await runner()).trim()
    return /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(out) ? out : null
  } catch {
    return null
  }
}
async function defaultBunRunner() {
  const { stdout } = await execFileAsync(
    bunExecutable(),
    ['info', 'harnessed@latest', 'version', '--json'],
    { timeout: 8e3, windowsHide: true, shell: false },
  )
  return stdout
}
async function fetchLatestBunVersion(runner = defaultBunRunner) {
  try {
    const version = JSON.parse(await runner())
    return typeof version === 'string' && /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version)
      ? version
      : null
  } catch {
    return null
  }
}
var execFileAsync, execAsync
var init_version_check = __esm({
  'src/cli/lib/version-check.ts'() {
    'use strict'
    init_runtime()
    execFileAsync = promisify(execFile)
    execAsync = promisify(exec)
  },
})

// src/cli/updateReminderWorkerMain.ts
var updateReminderWorkerMain_exports = {}
__export(updateReminderWorkerMain_exports, {
  runUpdateReminderWorker: () => runUpdateReminderWorker,
})
import { randomUUID } from 'node:crypto'
import asyncFs from 'node:fs/promises'
import { dirname } from 'node:path'
async function runUpdateReminderWorker(options) {
  let release
  let temporary
  let timer
  const controller = new AbortController()
  let owned = false
  try {
    const now = options.now ?? Date.now
    if (!isReminderVersion(options.installed)) return 0
    await asyncFs.mkdir(dirname(options.cachePath), { recursive: true })
    release = await import_proper_lockfile.default.lock(options.cachePath, {
      realpath: false,
      retries: 0,
      stale: REMINDER_LOCK_STALE_MS,
      update: 1e4,
      onCompromised: () => {
        owned = false
        controller.abort()
      },
    })
    owned = true
    const cache = readReminderCache(options.cachePath, options.identity, now())
    if (!shouldRefreshReminder(cache, now())) return 0
    let latest = null
    try {
      const observation = await Promise.race([
        options.observe(controller.signal),
        new Promise((_, reject) => {
          timer = setTimeout(() => {
            controller.abort()
            reject(new Error('timeout'))
          }, 8e3)
        }),
      ])
      if (isReminderVersion(observation.latest)) latest = observation.latest
    } catch {}
    const checkedAt = now()
    const state = latest === null ? 'unknown' : compareVersions(options.installed, latest)
    const result = {
      schemaVersion: 1,
      identity: { ...options.identity },
      installed: options.installed,
      latest,
      state,
      checkedAt,
      retryAfter: state === 'unknown' ? checkedAt + REMINDER_RETRY_MS : 0,
    }
    const text = `${JSON.stringify(result)}
`
    if (!owned || Buffer.byteLength(text) > REMINDER_MAX_BYTES) return 0
    temporary = `${options.cachePath}.${randomUUID()}.tmp`
    await asyncFs.writeFile(temporary, text, { encoding: 'utf8', flag: 'wx', mode: 384 })
    if (owned) await asyncFs.rename(temporary, options.cachePath)
  } catch {
  } finally {
    if (timer) clearTimeout(timer)
    controller.abort()
    if (temporary) await asyncFs.unlink(temporary).catch(() => {})
    if (release) await release().catch(() => {})
  }
  return 0
}
var import_proper_lockfile
var init_updateReminderWorkerMain = __esm({
  'src/cli/updateReminderWorkerMain.ts'() {
    'use strict'
    import_proper_lockfile = __toESM(require_proper_lockfile(), 1)
    init_updateReminderCache()
    init_version_check()
  },
})

// src/compile/updateReminderEntrypoint.ts
init_package()
import { createHash } from 'node:crypto'
import { closeSync, constants, fstatSync, openSync, readSync, statSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname as dirname2, isAbsolute, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// src/cli/updateReminderHookMain.ts
init_updateReminderCache()

// src/compile/updateReminderEntrypoint.ts
var UPDATE_REMINDER_OPERATION = 'update-reminder'
var UPDATE_REMINDER_WORKER_OPERATION = 'update-reminder-worker'
var UPDATE_REMINDER_PREFERENCES_FILE = 'update-reminder-preferences.json'
var BINARY_SOURCE = 'https://api.github.com/repos/easyinplay/harnessed/releases/latest'
function resolveUpdateReminderRuntime(options = {}) {
  const args = [...(options.args ?? process.argv.slice(2))]
  if (args[0] === UPDATE_REMINDER_OPERATION || args[0] === UPDATE_REMINDER_WORKER_OPERATION)
    args.shift()
  let host = 'claude'
  let explicitStateRoot
  let platformSpecified = false
  for (let index = 0; index < args.length; index += 2) {
    const flag = args[index]
    const value = args[index + 1]
    if (
      !flag ||
      value === void 0 ||
      [flag, value].some((argument) =>
        Array.from(argument).some((character) => character < ' ' || character === '\x7F'),
      )
    )
      return null
    if (flag === '--platform') {
      if (platformSpecified || (value !== 'claude' && value !== 'codex')) return null
      platformSpecified = true
      host = value
    } else if (flag === '--state-root') {
      if (explicitStateRoot !== void 0 || !isAbsolute(value)) return null
      explicitStateRoot = resolve(value)
    } else return null
  }
  const nativeHome = resolve(
    (host === 'codex' ? process.env.CODEX_HOME?.trim() : process.env.CLAUDE_CONFIG_DIR) ||
      join(homedir(), host === 'codex' ? '.codex' : '.claude'),
  )
  const stateRoot =
    explicitStateRoot ??
    resolve(process.env.HARNESSED_ROOT_OVERRIDE || join(nativeHome, 'harnessed'))
  const channel = options.compiled ? 'binary' : process.versions.bun ? 'bun' : 'npm'
  const source = channel === 'binary' ? BINARY_SOURCE : `${channel}:harnessed`
  const fingerprint = createHash('sha256')
    .update(
      JSON.stringify([
        host === 'codex' ? stateRoot : nativeHome,
        process.execPath,
        package_default.version,
        source,
      ]),
    )
    .digest('hex')
  return {
    stateRoot,
    nativeHome,
    cachePath: join(stateRoot, `update-reminder-${host}.json`),
    preferencesPath: join(stateRoot, UPDATE_REMINDER_PREFERENCES_FILE),
    installed: package_default.version,
    identity: {
      host,
      runtime: options.compiled ? 'binary' : process.versions.bun ? 'bun' : 'node',
      channel,
      source,
      fingerprint,
    },
    worker: {
      executable: process.execPath,
      args: [
        options.compiled
          ? UPDATE_REMINDER_WORKER_OPERATION
          : join(dirname2(fileURLToPath(import.meta.url)), 'harnessed-update-reminder-worker.mjs'),
        '--platform',
        host,
        ...(explicitStateRoot ? ['--state-root', explicitStateRoot] : []),
      ],
    },
  }
}
function reminderEnabled(path) {
  let descriptor
  try {
    descriptor = openSync(path, constants.O_RDONLY | constants.O_NONBLOCK)
    const info = fstatSync(descriptor)
    if (!info.isFile() || info.size > 1024) return false
    const buffer = Buffer.alloc(1025)
    const bytes = readSync(descriptor, buffer, 0, buffer.length, 0)
    if (bytes > 1024 || bytes < info.size) return false
    const value = JSON.parse(buffer.toString('utf8', 0, bytes))
    return (
      typeof value === 'object' &&
      value !== null &&
      'schemaVersion' in value &&
      value.schemaVersion === 1 &&
      'enabled' in value &&
      value.enabled === true
    )
  } catch (error) {
    return error.code === 'ENOENT'
  } finally {
    if (descriptor !== void 0) {
      try {
        closeSync(descriptor)
      } catch {}
    }
  }
}
async function runUpdateReminderWorkerEntrypoint(options = {}) {
  try {
    const runtime = resolveUpdateReminderRuntime(options)
    if (!runtime || !reminderEnabled(runtime.preferencesPath)) return 0
    const { runUpdateReminderWorker: runUpdateReminderWorker2 } = await Promise.resolve().then(
      () => (init_updateReminderWorkerMain(), updateReminderWorkerMain_exports),
    )
    return await runUpdateReminderWorker2({
      ...runtime,
      observe: async (signal) => {
        if (runtime.identity.channel === 'binary') {
          const response = await fetch(BINARY_SOURCE, {
            signal,
            headers: { 'user-agent': `harnessed/${package_default.version}` },
          })
          if (!response.ok) return { latest: null }
          const value = await response.json()
          return {
            latest: typeof value.tag_name === 'string' ? value.tag_name.replace(/^v/, '') : null,
          }
        }
        const {
          fetchLatestBunVersion: fetchLatestBunVersion2,
          fetchLatestNpmVersion: fetchLatestNpmVersion2,
        } = await Promise.resolve().then(() => (init_version_check(), version_check_exports))
        return {
          latest: await (runtime.identity.channel === 'bun'
            ? fetchLatestBunVersion2()
            : fetchLatestNpmVersion2()),
        }
      },
    })
  } catch {}
  return 0
}

// bin/harnessed-update-reminder-worker.mjs.entry.ts
await runUpdateReminderWorkerEntrypoint()
