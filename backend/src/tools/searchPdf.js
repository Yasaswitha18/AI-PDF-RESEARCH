import { vectorStore } from '../services/vectorStore.js';
import { generateEmbedding } from '../services/embeddingService.js';

/**
 * TOOL 1: search_pdf
 * 
 * Performs semantic search over the active PDF document using vector embeddings
 * and cosine similarity.
 * 
 * @param {object} args
 * @param {string} args.query - The search query or question to retrieve context for
 * @param {number} [args.topK=4] - Number of top chunks to retrieve (default: 4)
 * @returns {Promise<object>} Search results containing relevant chunks and page numbers
 */
export async function searchPdf({ query, topK = 4 }) {
  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    return {
      success: false,
      error: 'Query parameter is required for search_pdf.',
      matches: [],
    };
  }

  if (vectorStore.isEmpty()) {
    return {
      success: false,
      error: 'No document is currently active. Please upload a PDF document first.',
      matches: [],
    };
  }

  try {
    // 1. Generate query embedding
    const queryEmbedding = await generateEmbedding(query.trim());

    // 2. Perform cosine similarity search in memory
    const matches = vectorStore.similaritySearch(queryEmbedding, topK);

    if (matches.length === 0) {
      return {
        success: true,
        message: 'No semantically matching content found in the document for the query.',
        query,
        matches: [],
      };
    }

    return {
      success: true,
      query,
      resultsCount: matches.length,
      matches: matches.map((m) => ({
        chunkId: m.id,
        pageNumber: m.pageNumber,
        similarityScore: m.similarity,
        textExcerpt: m.text,
      })),
    };
  } catch (error) {
    return {
      success: false,
      error: `Semantic search failed: ${error.message}`,
      matches: [],
    };
  }
}

export default searchPdf;

