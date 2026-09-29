import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getEmbedding, loadApprovedNote, parseApprovedNote } from './knowledge-demo.mjs';

const note = (status = 'approved', body = 'A test-only factual sentence.') =>
  `---\nid: professional-role\nstatus: ${status}\napproved_on: 2026-09-28\n---\n# Test fixture\n\n${body}\n`;

test('drafts and ambiguous approval metadata cannot be indexed', () => {
  assert.throws(() => parseApprovedNote(note('draft')), /Only approved/);
  assert.throws(() => parseApprovedNote(note().replace('status: approved', 'status: approved\nstatus: draft')), /duplicate/);
});

test('empty or oversized notes cannot silently become incomplete chunks', () => {
  assert.throws(() => parseApprovedNote(note('approved', '')), /1–1000/);
  assert.throws(() => parseApprovedNote(note('approved', 'a'.repeat(1001))), /1–1000/);
});

test('edited text replaces the same vector ID and changes the verification hash', () => {
  const original = parseApprovedNote(note());
  const changed = parseApprovedNote(note('approved', 'A corrected test-only sentence.'));
  assert.equal(original.id, changed.id);
  assert.notEqual(original.hash, changed.hash);
});

test('knowledge stored in the code repository is rejected before reading content', async () => {
  await assert.rejects(() => loadApprovedNote(process.cwd()), /outside the website repository/);
});

test('unexpected model dimensions or non-finite values cannot enter the index', () => {
  const dimensions = Number(process.env.EMBEDDING_DIMENSIONS);
  assert.throws(() => getEmbedding({ data: [[1, 2, 3]] }), new RegExp(`${dimensions} finite`));
  const vector = Array(dimensions).fill(0.1);
  vector[dimensions - 1] = Infinity;
  assert.throws(() => getEmbedding({ data: [vector] }), new RegExp(`${dimensions} finite`));
});
