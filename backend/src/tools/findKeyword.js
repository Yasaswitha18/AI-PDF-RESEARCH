import { vectorStore } from '../services/vectorStore.js';

/**
 * TOOL 3: find_keyword
 * 
 * Searches the extracted PDF document for specific keywords or exact phrases.
 * Returns occurrence counts, surrounding context excerpts, and page numbers.
 * 
 * @param {object} args
 * @param {string} args.keyword - The specific word or phrase to locate
 * @param {number} [args.maxResults=8] - Maximum occurrences to return
 * @returns {Promise<object>} Match statistics, page references, and excerpts
 */
export async function findKeyword({ keyword, maxResults = 8 }) {
  if (!keyword || typeof keyword !== 'string' || keyword.trim().length === 0) {
    return {
      success: false,
      error: 'Keyword parameter is required for find_keyword.',
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

  const result = vectorStore.keywordSearch(keyword.trim(), maxResults);

  if (result.totalOccurrences === 0) {
    return {
      success: true,
      keyword: keyword.trim(),
      totalOccurrences: 0,
      message: `The keyword "${keyword.trim()}" was not found in the uploaded document.`,
      matches: [],
    };
  }

  return {
    success: true,
    keyword: keyword.trim(),
    totalOccurrences: result.totalOccurrences,
    matches: result.results.map((r) => ({
      chunkId: r.chunkId,
      pageNumber: r.pageNumber,
      excerpt: r.excerpt,
    })),
  };
}

export default findKeyword;

