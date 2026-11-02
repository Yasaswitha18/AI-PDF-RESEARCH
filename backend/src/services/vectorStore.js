import { cosineSimilarity } from '../utils/cosineSimilarity.js';

/**
 * In-Memory Vector Store
 * 
 * Stores document chunks, their high-dimensional vector embeddings,
 * and associated metadata directly in memory without requiring external
 * vector databases like Pinecone or ChromaDB.
 * 
 * Uses direct JavaScript manual cosine similarity for semantic retrieval.
 */
export class InMemoryVectorStore {
  constructor() {
    this.chunks = [];
    this.documentInfo = null;
  }

  /**
   * Sets the active document metadata and associated chunks with embeddings.
   * 
   * @param {object} docInfo - Document metadata (name, size, pages, etc.)
   * @param {Array<{ id: string, text: string, embedding: number[], pageNumber: number }>} chunks
   */
  setDocument(docInfo, chunks) {
    if (!Array.isArray(chunks)) {
      throw new TypeError('Chunks must be an array.');
    }

    this.documentInfo = {
      filename: docInfo.filename || 'unknown.pdf',
      originalName: docInfo.originalName || docInfo.filename || 'unknown.pdf',
      size: docInfo.size || 0,
      totalPages: docInfo.totalPages || 1,
      totalChunks: chunks.length,
      totalCharacters: docInfo.totalCharacters || chunks.reduce((acc, c) => acc + (c.text?.length || 0), 0),
      uploadedAt: new Date().toISOString(),
    };

    this.chunks = chunks.map((chunk, index) => ({
      id: chunk.id || `chunk_${index + 1}`,
      text: chunk.text || '',
      embedding: chunk.embedding || [],
      pageNumber: chunk.pageNumber || 1,
      charCount: chunk.text ? chunk.text.length : 0,
      chunkIndex: index + 1,
    }));
  }

  /**
   * Performs semantic similarity search against all stored chunks using cosine similarity.
   * 
   * @param {number[]} queryEmbedding - The embedding vector of the search query
   * @param {number} [topK=4] - Number of top relevant chunks to retrieve
   * @param {number} [threshold=0.0] - Optional minimum similarity threshold
   * @returns {Array<{ id: string, text: string, pageNumber: number, similarity: number, chunkIndex: number }>}
   */
  similaritySearch(queryEmbedding, topK = 4, threshold = 0.0) {
    if (!queryEmbedding || !Array.isArray(queryEmbedding) || queryEmbedding.length === 0) {
      throw new Error('Valid query embedding vector is required for similarity search.');
    }

    if (this.chunks.length === 0) {
      return [];
    }

    const scoredChunks = [];

    for (const chunk of this.chunks) {
      if (!chunk.embedding || chunk.embedding.length === 0) {
        continue;
      }

      const similarity = cosineSimilarity(queryEmbedding, chunk.embedding);

      if (similarity >= threshold) {
        scoredChunks.push({
          id: chunk.id,
          text: chunk.text,
          pageNumber: chunk.pageNumber,
          similarity: Number(similarity.toFixed(4)),
          chunkIndex: chunk.chunkIndex,
        });
      }
    }

    // Sort descending by similarity score
    scoredChunks.sort((a, b) => b.similarity - a.similarity);

    // Return the top K items
    return scoredChunks.slice(0, topK);
  }

  /**
   * Performs exact or case-insensitive keyword search across all stored chunks.
   * 
   * @param {string} keyword - Word or phrase to find
   * @param {number} [maxResults=10] - Maximum matching excerpts to return
   * @returns {object} { totalOccurrences, results: Array<{ chunkId, pageNumber, excerpt, matchIndex }> }
   */
  keywordSearch(keyword, maxResults = 10) {
    if (!keyword || typeof keyword !== 'string' || keyword.trim().length === 0) {
      return { totalOccurrences: 0, results: [] };
    }

    const needle = keyword.trim().toLowerCase();
    const results = [];
    let totalOccurrences = 0;

    for (const chunk of this.chunks) {
      const lowerText = chunk.text.toLowerCase();
      let pos = lowerText.indexOf(needle);

      while (pos !== -1) {
        totalOccurrences++;

        if (results.length < maxResults) {
          // Extract a surrounding context window (approx. 100 characters before and after)
          const windowStart = Math.max(0, pos - 80);
          const windowEnd = Math.min(chunk.text.length, pos + needle.length + 80);
          const prefix = windowStart > 0 ? '...' : '';
          const suffix = windowEnd < chunk.text.length ? '...' : '';
          const excerpt = prefix + chunk.text.substring(windowStart, windowEnd).trim() + suffix;

          results.push({
            chunkId: chunk.id,
            pageNumber: chunk.pageNumber,
            excerpt,
            matchIndex: pos,
          });
        }

        pos = lowerText.indexOf(needle, pos + needle.length);
      }
    }

    return {
      keyword: keyword.trim(),
      totalOccurrences,
      results,
    };
  }

  /**
   * Retrieves all document chunks.
   * @returns {Array}
   */
  getChunks() {
    return this.chunks;
  }

  /**
   * Retrieves active document metadata.
   * @returns {object|null}
   */
  getDocumentInfo() {
    return this.documentInfo;
  }

  /**
   * Checks whether a document is currently loaded.
   * @returns {boolean}
   */
  isEmpty() {
    return this.chunks.length === 0;
  }

  /**
   * Clears the current document, vector embeddings, and metadata.
   */
  clear() {
    this.chunks = [];
    this.documentInfo = null;
  }
}

// Export a singleton instance for the application session
export const vectorStore = new InMemoryVectorStore();
export default vectorStore;
