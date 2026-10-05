const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync, readdirSync } = require('node:fs');
const { resolve } = require('node:path');

const dir = resolve(__dirname, '../public/locales');

// JSON.parse keeps the last of two equal keys silently, so read the raw keys.
for (const file of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
  test(`${file} has no duplicate keys`, () => {
    const keys = [...readFileSync(resolve(dir, file), 'utf8').matchAll(/^\s*"([^"]+)"\s*:/gm)].map((m) => m[1]);
    assert.deepEqual(keys.filter((k, i) => keys.indexOf(k) !== i), []);
  });
}
