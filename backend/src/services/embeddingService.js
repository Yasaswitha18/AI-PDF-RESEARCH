import { getGeminiClient, GEMINI_CONFIG } from '../config/gemini.js';

/**
 * Embedding Service
 * 
 * Generates dense numerical vector representations of text using
 * Google Gemini's official text-embedding-004 model via @google/genai.
 */

/**
 * Generates an embedding vector for a single text string.
 * 
 * @param {string} text - The input text to embed
 * @returns {Promise<number[]>} Array of floating-point numbers representing the embedding vector
 */
export async function generateEmbedding(text) {
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    throw new Error('Text to embed must be a non-empty string.');
  }

  const ai = getGeminiClient();

  try {
    const response = await ai.models.embedContent({
      model: GEMINI_CONFIG.embeddingModelName,
      contents: text.trim(),
    });

    // Check embedding response format
    if (response.embedding && Array.isArray(response.embedding.values)) {
      return response.embedding.values;
    }

    if (Array.isArray(response.embeddings) && response.embeddings[0]?.values) {
      return response.embeddings[0].values;
    }

    throw new Error('Unexpected response structure from Gemini Embedding API.');
  } catch (error) {
    throw new Error(`Gemini Embedding generation failed: ${error.message}`);
  }
}

/**
 * Generates embeddings for an array of text chunks.
 * Processes in manageable batches to respect rate limits.
 * 
 * @param {string[]} texts - Array of text strings to embed
 * @param {number} [batchSize=8] - Batch chunk size
 * @returns {Promise<Array<number[]>>}
 */
export async function generateBatchEmbeddings(texts, batchSize = 8) {
  if (!Array.isArray(texts) || texts.length === 0) {
    return [];
  }

  const results = [];
  const ai = getGeminiClient();

  for (let i = 0; i < texts.length; i += batchSize) {
    const slice = texts.slice(i, i + batchSize);

    try {
      // Try batch embed call first
      const response = await ai.models.embedContent({
        model: GEMINI_CONFIG.embeddingModelName,
        contents: slice,
      });

      if (Array.isArray(response.embeddings)) {
        for (const item of response.embeddings) {
          results.push(item.values);
        }
      } else if (response.embedding && Array.isArray(response.embedding.values)) {
        results.push(response.embedding.values);
      } else {
        throw new Error('Batch embedding format unsupported, falling back to individual calls.');
      }
    } catch {
      // Fallback: Embed individually if batch endpoint behaved differently
      for (const text of slice) {
        const singleEmbedding = await generateEmbedding(text);
        results.push(singleEmbedding);
      }
    }
  }

  return results;
}

export default {
  generateEmbedding,
  generateBatchEmbeddings,
};

