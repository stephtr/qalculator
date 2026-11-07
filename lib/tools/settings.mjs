import assert from 'node:assert/strict';
import { calculate, load } from './runtime.mjs';

const cases = [
  ['2×3', '6'], ['√(144)', '12'], ['1 Å to nm', '0.1 nm'],
  ['1 µm to nm', '1000 nm'], ['atom(H, name)', '"Hydrogen"'],
];

for (const directory of process.argv.slice(2).length ? process.argv.slice(2) : ['.', 'reference']) {
  const { module } = await load(directory);
  for (const mode of ['off', 'on']) {
    assert.equal(module.set_option(`unicode ${mode}`), true);
    for (const [expression, text] of cases) {
      const result = calculate(module, expression);
      assert.equal(result.messages, '', expression);
      assert.equal(result.output.replace(/<[^>]*>/g, '').replace(/\s+/gu, ' '), text, expression);
    }
    assert.equal(module.set_option('precision invalid'), false);
    assert.equal(module.set_option('nonexistent option'), false);
  }
}
