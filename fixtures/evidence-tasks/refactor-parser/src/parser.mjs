// A deliberately crude INI-style parser. It works and is fully covered by
// tests, but the value-unescaping logic is copy-pasted in TWO places (the
// top-level branch and the [section] branch) — see task.md.
//
// Grammar:
//   ; comment lines and blank lines are ignored
//   [section] opens a section; keys before any section land under ""
//   key = value        value may be double-quoted; quoted values support
//                      \n \t \" \\ escapes; unquoted values are trimmed and
//                      an unquoted trailing ; comment is stripped.

export function parse(text) {
  const result = { '': {} }
  let section = ''
  const lines = String(text).split(/\r?\n/)
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i]
    const line = raw.trim()
    if (line === '' || line.startsWith(';')) continue

    const sec = /^\[([^\]]+)\]$/.exec(line)
    if (sec) {
      section = sec[1].trim()
      if (!(section in result)) result[section] = {}
      continue
    }

    const eq = line.indexOf('=')
    if (eq === -1) throw new Error(`line ${i + 1}: expected key = value`)
    const key = line.slice(0, eq).trim()
    if (key === '') throw new Error(`line ${i + 1}: empty key`)
    let value = line.slice(eq + 1).trim()

    if (section === '') {
      // ---- duplicated unescape block #1 (top-level keys) ----
      if (value.startsWith('"')) {
        if (!value.endsWith('"') || value.length < 2) {
          throw new Error(`line ${i + 1}: unterminated quoted value`)
        }
        const inner = value.slice(1, -1)
        let out = ''
        for (let j = 0; j < inner.length; j++) {
          const ch = inner[j]
          if (ch === '\\') {
            const next = inner[j + 1]
            if (next === 'n') out += '\n'
            else if (next === 't') out += '\t'
            else if (next === '"') out += '"'
            else if (next === '\\') out += '\\'
            else throw new Error(`line ${i + 1}: bad escape \\${next}`)
            j++
          } else {
            out += ch
          }
        }
        value = out
      } else {
        const semi = value.indexOf(';')
        if (semi !== -1) value = value.slice(0, semi).trim()
      }
      result[''][key] = value
    } else {
      // ---- duplicated unescape block #2 (section keys) ----
      if (value.startsWith('"')) {
        if (!value.endsWith('"') || value.length < 2) {
          throw new Error(`line ${i + 1}: unterminated quoted value`)
        }
        const inner = value.slice(1, -1)
        let out = ''
        for (let j = 0; j < inner.length; j++) {
          const ch = inner[j]
          if (ch === '\\') {
            const next = inner[j + 1]
            if (next === 'n') out += '\n'
            else if (next === 't') out += '\t'
            else if (next === '"') out += '"'
            else if (next === '\\') out += '\\'
            else throw new Error(`line ${i + 1}: bad escape \\${next}`)
            j++
          } else {
            out += ch
          }
        }
        value = out
      } else {
        const semi = value.indexOf(';')
        if (semi !== -1) value = value.slice(0, semi).trim()
      }
      result[section][key] = value
    }
  }
  return result
}
