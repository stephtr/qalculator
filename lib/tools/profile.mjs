import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { calculate, load, start } from './runtime.mjs';

const corpus = JSON.parse(readFileSync(new URL('./expressions.json', import.meta.url)));
const [mode, directory, suite, index] = process.argv.slice(2);
const root = resolve(directory);

if (mode === 'train') {
  const { module, exports } = await load(root);
  start(module);
  for (const { expr } of corpus.train) {
    assert(!calculate(module, expr).messages.includes('Error:'), expr);
  }
  const write = exports.__write_profile;
  const size = write(0, 0);
  const ptr = module._malloc(size);
  assert.equal(write(ptr, size), size);
  writeFileSync('profile.data', new Uint8Array(exports.memory.buffer, ptr, size));
  module._free(ptr);
} else if (mode === 'case') {
  const { expr, text } = corpus[suite][Number(index)];
  const baseline = await load('reference');
  const actual = await load(root);
  assert.equal(JSON.stringify(start(actual.module)), JSON.stringify(start(baseline.module)));
  assert.equal(actual.loads.length, 0, 'Startup loaded deferred code');
  const result = calculate(actual.module, expr);
  assert.deepEqual(result, calculate(baseline.module, expr), expr);
  if (suite !== 'edge') assert(!result.messages.includes('Error:'), expr);
  if (text !== undefined) {
    assert.equal(result.output.replace(/<[^>]*>/g, '').replace(/\s+/gu, ' '), text, expr);
  }
  const loads = actual.loads.length;
  assert.deepEqual(calculate(actual.module, expr), result, expr);
  assert.equal(actual.loads.length, loads, 'Deferred code loaded twice');
  assert(loads <= 1);
  console.log(loads);
} else {
  assert.equal(mode, 'verify');
  const coverage = {};
  // Isolate queries so previous cold calls cannot hide profile misses.
  for (const [name, cases] of Object.entries(corpus)) {
    let initialOnly = 0;
    for (let i = 0; i < cases.length; i++) {
      const child = spawnSync(process.execPath, [fileURLToPath(import.meta.url), 'case', root, name, String(i)], {
        encoding: 'utf8', timeout: 60000,
      });
      assert.equal(child.status, 0, `${cases[i].expr}: ${child.stderr}`);
      if (Number(child.stdout) === 0) initialOnly++;
    }
    coverage[name] = { count: cases.length, initialOnly };
  }
  assert.equal(coverage.train.initialOnly, coverage.train.count);
  assert(coverage.common.initialOnly / coverage.common.count >= 0.95);
  assert(coverage.uncommon.initialOnly < coverage.uncommon.count);

  const { module, loads } = await load(root);
  start(module);
  const info = module.info();
  assert.equal(module.info(), info);
  assert(loads.length <= 1, 'Deferred module loaded more than once');

  writeFileSync('coverage.json', JSON.stringify(coverage, null, 2) + '\n');
}
