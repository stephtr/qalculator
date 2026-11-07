import assert from 'node:assert/strict';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { brotliCompressSync, constants, gzipSync } from 'node:zlib';
import { load, start } from './runtime.mjs';

const [directory, mode] = process.argv.slice(2);
const root = resolve(directory);
if (mode === 'startup') {
  const began = performance.now();
  const { module, loads } = await load(root);
  assert(start(module).length > 0);
  assert.equal(loads.length, 0, 'Startup loaded deferred code');
  console.log(performance.now() - began);
  process.exit(0);
}

const sizes = {};
for (const file of readdirSync(root).filter(name => /\.(js|wasm)$/.test(name)).sort()) {
  const bytes = readFileSync(join(root, file));
  sizes[file] = {
    raw: bytes.length,
    gzip: gzipSync(bytes, { level: 9 }).length,
    brotli: brotliCompressSync(bytes, {
      params: { [constants.BROTLI_PARAM_QUALITY]: 11 },
    }).length,
  };
}

// Fresh processes avoid V8's compiled-module cache between startup samples.
const samples = Array.from({ length: 7 }, () => {
  const child = spawnSync(process.execPath, [fileURLToPath(import.meta.url), root, 'startup'], {
    encoding: 'utf8', timeout: 60000,
  });
  assert.equal(child.status, 0, child.stderr);
  const value = Number(child.stdout);
  assert(Number.isFinite(value) && value > 0, child.stdout);
  return value;
}).sort((a, b) => a - b);
const report = {
  sizes,
  startup: { runtime: process.version, unit: 'ms', samples, median: samples[3] },
};
writeFileSync(join(root, 'report.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
