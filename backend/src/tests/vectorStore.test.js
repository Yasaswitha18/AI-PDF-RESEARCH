import test from 'node:test';
import assert from 'node:assert';
import { InMemoryVectorStore } from '../services/vectorStore.js';

test('InMemoryVectorStore - Ingests document and chunks correctly', () => {
  const store = new InMemoryVectorStore();
  const docMeta = {
    originalName: 'research-paper.pdf',
    size: 20480,
    totalPages: 2,
  };

  const sampleChunks = [
    { id: 'chunk_1', text: 'Transformers revolutionize NLP.', embedding: [1, 0, 0], pageNumber: 1 },
    { id: 'chunk_2', text: 'Embeddings map text to vectors.', embedding: [0, 1, 0], pageNumber: 2 },
  ];

  store.setDocument(docMeta, sampleChunks);

  assert.strictEqual(store.isEmpty(), false);
  assert.strictEqual(store.getDocumentInfo().originalName, 'research-paper.pdf');
  assert.strictEqual(store.getDocumentInfo().totalChunks, 2);
  assert.strictEqual(store.getChunks().length, 2);
});

test('InMemoryVectorStore - Semantic similarity search retrieves closest vector', () => {
  const store = new InMemoryVectorStore();
  const sampleChunks = [
    { id: 'chunk_1', text: 'AI agents and tool calling.', embedding: [1, 0, 0], pageNumber: 1 },
    { id: 'chunk_2', text: 'Cooking recipes and cakes.', embedding: [0, 1, 0], pageNumber: 2 },
    { id: 'chunk_3', text: 'Software engineering practices.', embedding: [0.9, 0.1, 0], pageNumber: 3 },
  ];

  store.setDocument({ originalName: 'sample.pdf' }, sampleChunks);

  // Search vector aligned with chunk 1
  const queryVec = [1, 0, 0];
  const results = store.similaritySearch(queryVec, 2);

  assert.strictEqual(results.length, 2);
  assert.strictEqual(results[0].id, 'chunk_1');
  assert.strictEqual(results[0].similarity, 1.0);
  assert.strictEqual(results[1].id, 'chunk_3');
});

test('InMemoryVectorStore - Clear removes all chunks and document info', () => {
  const store = new InMemoryVectorStore();
  store.setDocument({ originalName: 'demo.pdf' }, [
    { id: 'chunk_1', text: 'Some text', embedding: [0.5, 0.5], pageNumber: 1 },
  ]);

  assert.strictEqual(store.isEmpty(), false);
  store.clear();
  assert.strictEqual(store.isEmpty(), true);
  assert.strictEqual(store.getDocumentInfo(), null);
  assert.strictEqual(store.getChunks().length, 0);
});

