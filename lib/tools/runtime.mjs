import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';

export async function load(directory) {
  let ready;
  const done = new Promise(resolve => { ready = resolve; });
  const loads = [];
  const errors = [];
  const module = {
    print() {},
    printErr(text) { errors.push(text); },
    onRuntimeInitialized() { ready(); },
    wasmBinary: readFileSync(join(directory, 'calc.wasm')),
  };
  const context = vm.createContext({
    Module: module, document: { currentScript: { src: 'https://example.test/calc.js' } },
    console, performance, setTimeout, clearTimeout, TextDecoder, TextEncoder, WebAssembly, URL,
    XMLHttpRequest: class {
      open(method, file) { this.file = file; }
      overrideMimeType() {}
      send() {
        this.responseText = readFileSync(join(directory, 'calc.deferred.wasm')).toString('latin1');
        this.status = 200;
        loads.push(this.file);
      }
    },
  });
  vm.runInContext(readFileSync(join(directory, 'calc.js'), 'utf8'), context);
  await done;
  return { module, exports: vm.runInContext('wasmExports', context), loads, errors };
}

export function start(module) {
  const variables = module.getVariables();
  assert(module.version() >= 4);
  for (const option of [
    'angle 1', 'units on', 'varunits on', 'decimal comma on',
    'decimal comma off', 'prefix on', 'limit implicit multiplication off',
  ]) {
    assert.equal(module.set_option(option), true, option);
  }
  return variables;
}

export function calculate(module, expression) {
  const result = module.calculate(expression, 10000, 0);
  try {
    return { input: result.input, output: result.output, messages: result.messages };
  } finally {
    result.delete();
  }
}
