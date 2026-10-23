import { execFileSync } from 'node:child_process'
import { build } from 'esbuild'
import { beforeAll, describe, expect, it } from 'vitest'

const SDK = '@anthropic-ai/claude-agent-sdk'
let dispatcherBundle: string
let sdkBundle: string
let sdkImports: Array<{ path: string; kind: string; external?: boolean }>

beforeAll(async () => {
  const options = {
    bundle: true,
    write: false,
    splitting: false,
    format: 'esm',
    platform: 'node',
    target: 'node22',
    packages: 'external',
    metafile: true,
  } as const
  const dispatcher = await build({
    ...options,
    entryPoints: ['src/workflow/lib/spawnDispatch.ts'],
  })
  const sdk = await build({ ...options, entryPoints: ['src/workflow/lib/sdkSpawn.ts'] })
  dispatcherBundle = dispatcher.outputFiles[0]?.text ?? ''
  sdkBundle = sdk.outputFiles[0]?.text ?? ''
  sdkImports = Object.values(dispatcher.metafile.outputs).flatMap((output) => output.imports)
})

// Execute the actual single-file bundle without a file or local-wrapper mock.
// The VM linker observes the external SDK boundary; only that SDK is replaced.
const runner = `
import { readFileSync } from 'node:fs';
import { SourceTextModule, SyntheticModule } from 'node:vm';
const { code, mode } = JSON.parse(readFileSync(0, 'utf8'));
const sdkLoads = [];
const originalError = new Error('SDK boundary failure');
let queries = 0;
const sdkQuery = () => {
  queries++;
  if (mode === 'query-error') throw originalError;
  return (async function* () {
    if (mode === 'stream-error') throw originalError;
    yield { type: 'result', subtype: 'success', result: 'done' };
  })();
};
async function external(specifier, phase) {
  let namespace;
  if (specifier === '@anthropic-ai/claude-agent-sdk') {
    sdkLoads.push(phase);
    if (mode === 'import-error') throw originalError;
    namespace = { query: sdkQuery };
  } else {
    namespace = await import(specifier);
  }
  return new SyntheticModule(Object.keys(namespace), function () {
    for (const key of Object.keys(namespace)) this.setExport(key, namespace[key]);
  });
}
const module = new SourceTextModule(code, {
  importModuleDynamically: async (specifier) => {
    const imported = await external(specifier, 'dynamic');
    await imported.link(() => { throw new Error('Unexpected synthetic import'); });
    await imported.evaluate();
    return imported;
  },
});
await module.link((specifier) => external(specifier, 'static'));
await module.evaluate();
const initialSdkLoads = [...sdkLoads];
const def = { description: 'expert', prompt: 'BASE PROMPT' };
let result;
let sameError;
if (mode.startsWith('injected-')) {
  const host = mode.slice('injected-'.length);
  const spawner = async () => 'injected';
  result = await module.namespace.dispatchSpawn(def, { expertName: '01-code' }, {
    hostId: () => host,
    ...(host === 'claude' ? { sdkSpawn: spawner } : { codexExecSpawn: spawner }),
  });
} else if (mode === 'claude') {
  result = await module.namespace.dispatchSpawn(def, { expertName: '01-code' }, {
    hostId: () => 'claude',
  });
} else if (mode.endsWith('-error')) {
  try {
    await module.namespace.sdkSpawn(def, { expertName: '01-code', timeoutMs: 1000 });
  } catch (error) {
    sameError = error === originalError;
  }
} else if (mode === 'metadata') {
  result = [
    new module.namespace.SpawnFailError().failure,
    new module.namespace.SpawnTimeoutError(1).failure,
  ];
}
console.log(JSON.stringify({ initialSdkLoads, sdkLoads, queries, result, sameError }));
`

function execute(code: string, mode: string) {
  return JSON.parse(
    execFileSync(
      process.execPath,
      [
        '--experimental-vm-modules',
        '--disable-warning=ExperimentalWarning',
        '--input-type=module',
        '-e',
        runner,
      ],
      { input: JSON.stringify({ code, mode }), encoding: 'utf8', timeout: 10_000 },
    ),
  )
}

describe('single-file ESM SDK external boundary', () => {
  it('keeps the SDK external import dynamic with splitting disabled', () => {
    expect(sdkImports.filter((entry) => entry.path === SDK)).toEqual([
      { path: SDK, kind: 'dynamic-import', external: true },
    ])
  })

  it('imports the dispatcher bundle without loading the external SDK', () => {
    expect(execute(dispatcherBundle, 'import')).toEqual({
      initialSdkLoads: [],
      sdkLoads: [],
      queries: 0,
    })
  })

  it.each(['claude', 'codex'])('runs an injected %s spawner without loading the SDK', (host) => {
    expect(execute(dispatcherBundle, `injected-${host}`)).toEqual({
      initialSdkLoads: [],
      sdkLoads: [],
      queries: 0,
      result: 'injected',
    })
  })

  it('loads the external SDK only when the default Claude spawner runs', () => {
    expect(execute(dispatcherBundle, 'claude')).toEqual({
      initialSdkLoads: [],
      sdkLoads: ['dynamic'],
      queries: 1,
      result: '{"subtype":"success","text":"done","result":"done"}',
    })
  })

  it('reads SDK error-class metadata without loading the external SDK', () => {
    expect(execute(sdkBundle, 'metadata')).toEqual({
      initialSdkLoads: [],
      sdkLoads: [],
      queries: 0,
      result: ['SpawnOutputMalformed', 'SpawnTimeout'],
    })
  })

  it.each([
    'import-error',
    'query-error',
    'stream-error',
  ])('preserves the original error object for %s', (mode) => {
    expect(execute(sdkBundle, mode)).toEqual({
      initialSdkLoads: [],
      sdkLoads: ['dynamic'],
      queries: mode === 'import-error' ? 0 : 1,
      sameError: true,
    })
  })
})
