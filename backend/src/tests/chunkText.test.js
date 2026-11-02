import test from 'node:test';
import assert from 'node:assert';
import { chunkText, chunkPages } from '../utils/chunkText.js';

test('chunkText - Handles empty or invalid inputs', () => {
  assert.deepStrictEqual(chunkText(''), []);
  assert.deepStrictEqual(chunkText(null), []);
  assert.deepStrictEqual(chunkText('   '), []);
});

test('chunkText - Leaves text shorter than chunkSize as single chunk', () => {
  const shortText = 'Machine learning is a subset of artificial intelligence.';
  const chunks = chunkText(shortText, { chunkSize: 200 });

  assert.strictEqual(chunks.length, 1);
  assert.strictEqual(chunks[0].text, shortText);
  assert.strictEqual(chunks[0].id, 'chunk_1');
  assert.strictEqual(chunks[0].pageNumber, 1);
});

test('chunkText - Splits long text with overlap', () => {
  const sampleSentence = 'Retrieval-Augmented Generation enhances LLM responses using external context. ';
  const longText = sampleSentence.repeat(25); // ~1950 chars

  const chunks = chunkText(longText, { chunkSize: 500, chunkOverlap: 100 });

  assert.ok(chunks.length > 1, 'Should create multiple chunks');
  
  for (const chunk of chunks) {
    assert.ok(chunk.id.startsWith('chunk_'));
    assert.ok(chunk.text.length > 0);
    // Chunks should roughly adhere to chunkSize bound
    assert.ok(chunk.text.length <= 650);
  }

  // Check overlap: chunk 2 should contain part of chunk 1's end
  const chunk1End = chunks[0].text.substring(chunks[0].text.length - 40);
  assert.ok(
    chunks[1].text.includes(chunk1End.substring(0, 20)),
    'Consecutive chunks should share overlapping text'
  );
});

test('chunkPages - Preserves page numbers across multiple pages', () => {
  const pages = [
    { pageNumber: 1, text: 'This is the introduction on page one. It covers project overview.' },
    { pageNumber: 2, text: 'This is the methodology on page two. It describes RAG architecture.' },
    { pageNumber: 3, text: 'This is the conclusion on page three. It summarizes findings.' },
  ];

  const chunks = chunkPages(pages, { chunkSize: 200, chunkOverlap: 50 });

  assert.strictEqual(chunks.length, 3);
  assert.strictEqual(chunks[0].pageNumber, 1);
  assert.strictEqual(chunks[1].pageNumber, 2);
  assert.strictEqual(chunks[2].pageNumber, 3);
  assert.strictEqual(chunks[0].id, 'chunk_1');
  assert.strictEqual(chunks[1].id, 'chunk_2');
  assert.strictEqual(chunks[2].id, 'chunk_3');
});

