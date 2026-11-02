/**
 * Cosine Similarity Utility
 * 
 * Computes the cosine of the angle between two multi-dimensional numerical vectors.
 * Formula: CosineSimilarity(A, B) = (A · B) / (||A|| * ||B||)
 * 
 * Values range from:
 *   1.0: Identical direction (highest semantic similarity)
 *   0.0: Orthogonal / unrelated
 *  -1.0: Directly opposite
 * 
 * @param {number[]} vecA - First vector
 * @param {number[]} vecB - Second vector
 * @returns {number} Cosine similarity score between -1 and 1
 */
export function cosineSimilarity(vecA, vecB) {
  if (!Array.isArray(vecA) || !Array.isArray(vecB)) {
    throw new TypeError('Both arguments must be arrays of numbers.');
  }

  if (vecA.length === 0 || vecB.length === 0) {
    return 0;
  }

  if (vecA.length !== vecB.length) {
    throw new Error(
      `Vector dimension mismatch: vector A has length ${vecA.length}, but vector B has length ${vecB.length}.`
    );
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    const a = vecA[i];
    const b = vecB[i];

    dotProduct += a * b;
    normA += a * a;
    normB += b * b;
  }

  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);

  // Guard against division by zero for zero-magnitude vectors
  if (magnitude === 0) {
    return 0;
  }

  const similarity = dotProduct / magnitude;

  // Clamp floating point inaccuracies to [-1, 1] range
  return Math.max(-1, Math.min(1, similarity));
}

export default cosineSimilarity;
