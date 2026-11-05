import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fieldNames, isFinding, parseArgs } from './probe.mjs';

test('a private collection that can be listed is a finding', () => {
  assert.equal(isFinding('denied', 200), true);
});

test('a denied response is not a finding', () => {
  assert.equal(isFinding('denied', 403), false);
});

test('a public collection is never a finding', () => {
  assert.equal(isFinding('public', 200), false);
});

test('reports field names and never values', () => {
  const names = fieldNames({ documents: [{ fields: { email: { stringValue: 'someone@example.com' } } }] });
  assert.deepEqual(names, ['email']);
  assert.equal(JSON.stringify(names).includes('someone'), false);
});

test('parses comma-separated collections', () => {
  const options = parseArgs(['--project', 'demo', '--key', 'k', '--denied', 'users, orders', '--public', 'catalog']);
  assert.deepEqual(options.denied, ['users', 'orders']);
  assert.deepEqual(options.open, ['catalog']);
});
