import test from 'node:test';
import assert from 'node:assert/strict';
import { encryptJson, decryptJson, hashCanonicalJson, canonicalJson } from '../src/lib/crypto.js';

test('encryptJson roundtrip', () => {
  const obj = { schema: 'daily-v1', kss: 4, times: [280, 301] };
  const buf = encryptJson(obj);
  const out = decryptJson(buf);
  assert.deepEqual(out, obj);
});

test('canonicalJson stable key order', () => {
  const a = canonicalJson({ b: 1, a: 2 });
  const b = canonicalJson({ a: 2, b: 1 });
  assert.equal(a, b);
});

test('hashCanonicalJson changes when payload changes', () => {
  const h1 = hashCanonicalJson({ kss: 1 });
  const h2 = hashCanonicalJson({ kss: 2 });
  assert.notEqual(h1, h2);
});
