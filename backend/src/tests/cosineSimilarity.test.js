import test from 'node:test';
import assert from 'node:assert';
import { cosineSimilarity } from '../utils/cosineSimilarity.js';

test('Cosine Similarity - Identical vectors have similarity of 1.0', () => {
  const vecA = [1, 2, 3, 4];
  const vecB = [1, 2, 3, 4];
  const sim = cosineSimilarity(vecA, vecB);
  assert.strictEqual(Math.round(sim * 1000) / 1000, 1.0);
});

test('Cosine Similarity - Scalar multiples have similarity of 1.0', () => {
  const vecA = [1, 2, 3];
  const vecB = [2, 4, 6];
  const sim = cosineSimilarity(vecA, vecB);
  assert.strictEqual(Math.round(sim * 1000) / 1000, 1.0);
});

test('Cosine Similarity - Orthogonal vectors have similarity of 0.0', () => {
  const vecA = [1, 0];
  const vecB = [0, 1];
  const sim = cosineSimilarity(vecA, vecB);
  assert.strictEqual(sim, 0.0);
});

test('Cosine Similarity - Opposite vectors have similarity of -1.0', () => {
  const vecA = [1, 2, 3];
  const vecB = [-1, -2, -3];
  const sim = cosineSimilarity(vecA, vecB);
  assert.strictEqual(Math.round(sim * 1000) / 1000, -1.0);
});

test('Cosine Similarity - Zero vector handling does not return NaN', () => {
  const vecA = [0, 0, 0];
  const vecB = [1, 2, 3];
  const sim = cosineSimilarity(vecA, vecB);
  assert.strictEqual(sim, 0);
  assert.ok(!Number.isNaN(sim));
});

test('Cosine Similarity - Throws on mismatched vector dimensions', () => {
  const vecA = [1, 2];
  const vecB = [1, 2, 3];
  assert.throws(() => {
    cosineSimilarity(vecA, vecB);
  }, /dimension mismatch/i);
});

test('Cosine Similarity - Throws on non-array input', () => {
  assert.throws(() => {
    cosineSimilarity('invalid', [1, 2]);
  }, TypeError);
});

