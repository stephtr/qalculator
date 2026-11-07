import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';

export async function load(directory) {
  let ready;
  let exports;
  const done = new Promise(resolve => { ready = resolve; });
  const loads = [];
  const errors = [];
  const module = {
    print() {},
    printErr(text) { errors.push(text); },
    onRuntimeInitialized() { ready(); },
    instantiateWasm(imports, receive) {
      const instance = new WebAssembly.Instance(
        new WebAssembly.Module(readFileSync(join(directory, 'calc.wasm'))), imports,
      );
      exports = instance.exports;
      receive(instance);
      return exports;
    },
  };
  const context = vm.createContext({
    Module: module, document: { currentScript: { src: 'https://example.test/calc.js' } },
    console, performance, setTimeout, clearTimeout, TextDecoder, TextEncoder, WebAssembly, URL,
  });
  vm.runInContext(readFileSync(join(directory, 'calc.js'), 'utf8'), context);
  await done;
  return { module, exports, loads, errors };
}

export function calculate(module, expression) {
  const result = module.calculate(expression, 10000, 0);
  try {
    return { input: result.input, output: result.output, messages: result.messages };
  } finally {
    result.delete();
  }
}
