'use strict';

const assert = require('node:assert/strict');
const {randomUUID} = require('node:crypto');
const test = require('node:test');

const library = require('../dist');
const wordsModule = require('../dist/words');

const {
  decode,
  encode,
  toUuid,
  toHumanReadable,
  WORDS,
} = library;

test('exports the CommonJS API', () => {
  assert.deepEqual(
    Object.keys(library).sort(),
    ['WORDS', 'decode', 'encode', 'toHumanReadable', 'toUuid'],
  );
  assert.equal(encode, toHumanReadable);
  assert.equal(decode, toUuid);
  assert.equal(wordsModule.WORDS, WORDS);
});

test('dictionary has exactly 2,048 unique, delimiter-safe words', () => {
  assert.equal(WORDS.length, 2048);
  assert.equal(new Set(WORDS).size, 2048);
  assert.ok(Object.isFrozen(WORDS));
  assert.ok(WORDS.every((word) => /^[a-z]{3,8}$/.test(word)));
  assert.deepEqual([...WORDS].sort(), WORDS);
  assert.equal(new Set(WORDS.map((word) => word.slice(0, 4))).size, 2048);
});

test('matches stable encoding vectors', () => {
  const vectors = new Map([
    [
      '00000000-0000-0000-0000-000000000000',
      'Abandon00-Abandon00-Abandon00-Abandon00-Abandon00-Abandon00-Abandon00-Abandon00',
    ],
    [
      'ffffffff-ffff-ffff-ffff-ffffffffffff',
      'Zoo31-Zoo31-Zoo31-Zoo31-Zoo31-Zoo31-Zoo31-Zoo31',
    ],
    [
      '01234567-89ab-cdef-0123-456789abcdef',
      'Abuse03-Earth07-Meadow11-Social15-Abuse03-Earth07-Meadow11-Social15',
    ],
  ]);

  for (const [uuid, readable] of vectors) {
    assert.equal(encode(uuid), readable);
    assert.equal(decode(readable), uuid);
  }
});

test('bijectively maps every possible 16-bit word-number pair', () => {
  const seen = new Set();

  for (let value = 0; value <= 0xffff; value += 1) {
    const chunk = value.toString(16).padStart(4, '0');
    const uuid = `${chunk}0000-0000-0000-0000-000000000000`;
    const readable = encode(uuid);
    const firstToken = readable.slice(0, readable.indexOf('-'));

    assert.equal(decode(readable), uuid);
    assert.equal(seen.has(firstToken), false);
    seen.add(firstToken);
  }

  assert.equal(seen.size, 65536);
});

test('round-trips random UUIDs', () => {
  for (let index = 0; index < 1000; index += 1) {
    const uuid = randomUUID();
    assert.equal(decode(encode(uuid)), uuid);
  }
});

test('encoding the same UUID repeatedly always returns the same value', () => {
  const uuid = '123e4567-e89b-12d3-a456-426614174000';
  const expected = encode(uuid);

  for (let index = 0; index < 1000; index += 1) {
    assert.equal(encode(uuid), expected);
  }
});

test('decoding the same readable ID repeatedly always returns the same UUID', () => {
  const readable = 'Banana30-Earth07-Trigger27-Barrel19-Picture22-Draw06-Beef23-Divorce00';
  const expected = decode(readable);

  for (let index = 0; index < 1000; index += 1) {
    assert.equal(decode(readable), expected);
  }
});

test('repeated encode/decode cycles remain stable', () => {
  const originalUuid = '01234567-89ab-cdef-0123-456789abcdef';
  const originalReadable = encode(originalUuid);
  let uuid = originalUuid;

  for (let index = 0; index < 1000; index += 1) {
    const readable = encode(uuid);
    assert.equal(readable, originalReadable);
    uuid = decode(readable);
    assert.equal(uuid, originalUuid);
  }
});

test('accepts uppercase and braced UUIDs', () => {
  const uppercase = '01234567-89AB-CDEF-0123-456789ABCDEF';
  assert.equal(decode(encode(uppercase)), uppercase.toLowerCase());
  assert.equal(decode(encode(`{${uppercase}}`)), uppercase.toLowerCase());
});

test('decodes human-readable values case-insensitively', () => {
  const uuid = '123e4567-e89b-12d3-a456-426614174000';
  const readable = encode(uuid);

  assert.equal(decode(readable.toLowerCase()), uuid);
  assert.equal(decode(readable.toUpperCase()), uuid);
});

test('always emits eight capitalized tokens with two-digit suffixes', () => {
  for (let index = 0; index < 100; index += 1) {
    const tokens = encode(randomUUID()).split('-');
    assert.equal(tokens.length, 8);
    assert.ok(tokens.every((token) => /^[A-Z][a-z]+(?:0\d|[12]\d|3[01])$/.test(token)));
  }
});

test('rejects invalid UUID values', () => {
  const invalidValues = [
    '',
    'not-a-uuid',
    '0123456789abcdef0123456789abcdef',
    '01234567-89ab-cdef-0123-456789abcde',
    '01234567-89ab-cdef-0123-456789abcdef0',
    'g1234567-89ab-cdef-0123-456789abcdef',
    '{01234567-89ab-cdef-0123-456789abcdef',
    '01234567-89ab-cdef-0123-456789abcdef}',
    ' 01234567-89ab-cdef-0123-456789abcdef',
    '01234567-89ab-cdef-0123-456789abcdef ',
  ];

  for (const value of invalidValues) {
    assert.throws(() => encode(value), /Invalid UUID/);
  }

  for (const value of [null, undefined, 42, {}, []]) {
    assert.throws(() => encode(value), /UUID must be a string/);
  }
});

test('rejects malformed human-readable values', () => {
  const validTail = '-Abandon00'.repeat(7);
  const invalidValues = [
    ['Abacus00', /exactly 8/],
    [`Unknownword00${validTail}`, /Unknown dictionary word/],
    [`Abandon32${validTail}`, /between 00 and 31/],
    [`Abandon99${validTail}`, /between 00 and 31/],
    [`Abandon0${validTail}`, /Invalid word-number pair/],
    [`Abandon000${validTail}`, /Invalid word-number pair/],
    [`Abandon-00${validTail}`, /exactly 8/],
    [`Abandon 00${validTail}`, /Invalid word-number pair/],
    [`Abandon+00${validTail}`, /Invalid word-number pair/],
    [`Éclair00${validTail}`, /Invalid word-number pair/],
    [` Abandon00${validTail}`, /Invalid word-number pair/],
    [`Abandon00 ${validTail}`, /Invalid word-number pair/],
  ];

  for (const [value, expectedError] of invalidValues) {
    assert.throws(() => decode(value), expectedError);
  }

  for (const value of [null, undefined, 42, {}, []]) {
    assert.throws(() => decode(value), /must be a string/);
  }
});
