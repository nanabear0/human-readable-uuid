'use strict';

const assert = require('node:assert/strict');
const {readFileSync, statSync} = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const packageJson = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));

test('has no runtime dependencies', () => {
  assert.equal(packageJson.dependencies, undefined);
  assert.equal(packageJson.optionalDependencies, undefined);
  assert.equal(packageJson.peerDependencies, undefined);
});

test('publishes only the CommonJS build and documentation', () => {
  assert.deepEqual(packageJson.files, [
    'dist/index.js',
    'dist/index.d.ts',
    'dist/words.js',
    'dist/words.d.ts',
    'README.md',
    'LICENSE',
    'THIRD_PARTY_LICENSES.md',
  ]);
  assert.equal(packageJson.type, 'commonjs');
  assert.equal(packageJson.main, './dist/index.js');
  assert.equal(packageJson.module, undefined);
});

test('keeps compiled runtime files below 40 KiB total', () => {
  const runtimeBytes = [
    'dist/index.js',
    'dist/words.js',
  ].reduce((total, file) => total + statSync(path.join(root, file)).size, 0);

  assert.ok(runtimeBytes < 40 * 1024, `Runtime is ${runtimeBytes} bytes`);
});
