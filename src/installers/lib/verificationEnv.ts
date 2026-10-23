const ALLOWED_KEYS = [
  'PATH',
  'PATHEXT',
  'COMSPEC',
  'SystemRoot',
  'WINDIR',
  'HOME',
  'USERPROFILE',
  'APPDATA',
  'LOCALAPPDATA',
  'TEMP',
  'TMP',
  'TMPDIR',
  'CODEX_HOME',
  'CLAUDE_CONFIG_DIR',
  'HARNESSED_PLATFORM',
  'PLAYWRIGHT_BROWSERS_PATH',
  'MSYS',
  'CYGWIN',
  'MSYS2',
  'MSYS2_ARG_CONV_EXCL',
  'MSYS_NO_PATHCONV',
] as const

/** Keep only explicit runtime paths and existing native shell policy. */
export function verificationEnv(
  parent: NodeJS.ProcessEnv,
  overrides: NodeJS.ProcessEnv = {},
  platform: NodeJS.Platform = process.platform,
): NodeJS.ProcessEnv {
  const normalize = (key: string): string => (platform === 'win32' ? key.toUpperCase() : key)
  const allowed = new Map(ALLOWED_KEYS.map((key) => [normalize(key), key]))
  const env: NodeJS.ProcessEnv = {}
  for (const source of [parent, overrides]) {
    for (const [key, value] of Object.entries(source)) {
      const canonical = allowed.get(normalize(key))
      if (canonical !== undefined && value !== undefined) env[canonical] = value
    }
  }
  return env
}
