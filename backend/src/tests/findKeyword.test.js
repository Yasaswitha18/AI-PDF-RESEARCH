import test from 'node:test';
import assert from 'node:assert';
import { InMemoryVectorStore } from '../services/vectorStore.js';

test('Keyword Search - Locates exact and case-insensitive keyword occurrences', () => {
  const store = new InMemoryVectorStore();
  store.setDocument({ originalName: 'paper.pdf' }, [
    {
      id: 'chunk_1',
      text: 'Deep learning models, specifically transformer architectures, dominate natural language processing.',
      embedding: [0.1, 0.2],
      pageNumber: 1,
    },
    {
      id: 'chunk_2',
      text: 'The transformer mechanism relies on multi-head self-attention layers.',
      embedding: [0.3, 0.4],
      pageNumber: 2,
    },
  ]);

  const searchResult = store.keywordSearch('transformer');
  assert.strictEqual(searchResult.totalOccurrences, 2);
  assert.strictEqual(searchResult.results.length, 2);
  assert.strictEqual(searchResult.results[0].pageNumber, 1);
  assert.strictEqual(searchResult.results[1].pageNumber, 2);
  assert.ok(searchResult.results[0].excerpt.toLowerCase().includes('transformer'));
});

test('Keyword Search - Returns zero results for absent keyword', () => {
  const store = new InMemoryVectorStore();
  store.setDocument({ originalName: 'paper.pdf' }, [
    { id: 'chunk_1', text: 'Cloud infrastructure on AWS and GCP.', embedding: [0.1], pageNumber: 1 },
  ]);

  const result = store.keywordSearch('quantum');
  assert.strictEqual(result.totalOccurrences, 0);
  assert.strictEqual(result.results.length, 0);
});

test('Keyword Search - Gracefully handles empty query', () => {
  const store = new InMemoryVectorStore();
  store.setDocument({ originalName: 'paper.pdf' }, [
    { id: 'chunk_1', text: 'Some text', embedding: [0.1], pageNumber: 1 },
  ]);

  const result = store.keywordSearch('');
  assert.strictEqual(result.totalOccurrences, 0);
  assert.deepStrictEqual(result.results, []);
});

