/**
 * Text Chunking Utility
 * 
 * Splits extracted document text into manageable, semantically coherent chunks
 * suitable for embedding models and vector retrieval.
 * 
 * Key Features:
 * - Chunk size between 500 and 800 characters (default: 650)
 * - Configurable overlap between consecutive chunks (default: 120 characters)
 * - Intelligent boundary splitting (attempts to break at paragraphs, sentence ends, or spaces)
 * - Preserves page numbers and chunk indexing
 */

/**
 * Splits a single continuous text string into overlapping chunks.
 * 
 * @param {string} text - The input text to chunk
 * @param {object} options
 * @param {number} [options.chunkSize=650] - Target character size per chunk (approx. 500-800)
 * @param {number} [options.chunkOverlap=120] - Overlap in characters between consecutive chunks
 * @param {number} [options.pageNumber=1] - Page number associated with this text
 * @param {number} [options.startIndex=1] - Starting ID index counter
 * @returns {Array<{ id: string, text: string, pageNumber: number, charCount: number, chunkIndex: number }>}
 */
export function chunkText(text, options = {}) {
  const {
    chunkSize = 650,
    chunkOverlap = 120,
    pageNumber = 1,
    startIndex = 1,
  } = options;

  if (!text || typeof text !== 'string') {
    return [];
  }

  const cleanText = text.replace(/\r\n/g, '\n').trim();
  if (cleanText.length === 0) {
    return [];
  }

  // If text is shorter than or equal to chunkSize, return a single chunk
  if (cleanText.length <= chunkSize) {
    return [
      {
        id: `chunk_${startIndex}`,
        text: cleanText,
        pageNumber,
        charCount: cleanText.length,
        chunkIndex: startIndex,
      },
    ];
  }

  const chunks = [];
  let currentStart = 0;
  let counter = startIndex;

  while (currentStart < cleanText.length) {
    let currentEnd = currentStart + chunkSize;

    if (currentEnd >= cleanText.length) {
      const remaining = cleanText.substring(currentStart).trim();
      if (remaining.length > 0) {
        chunks.push({
          id: `chunk_${counter++}`,
          text: remaining,
          pageNumber,
          charCount: remaining.length,
          chunkIndex: counter - 1,
        });
      }
      break;
    }

    // Look for natural breaking points near currentEnd within a search window
    const searchWindowStart = Math.max(currentStart + chunkSize - 80, currentStart);
    const searchWindow = cleanText.substring(searchWindowStart, currentEnd + 40);

    let splitOffset = -1;
    // Prefer paragraph breaks (\n\n), then sentence boundaries (". ", "? ", "! "), then newline, then space
    const breakPatterns = ['\n\n', '. ', '.\n', '?\n', '!\n', '\n', ' '];
    
    for (const pattern of breakPatterns) {
      const idx = searchWindow.lastIndexOf(pattern);
      if (idx !== -1) {
        splitOffset = searchWindowStart + idx + pattern.length;
        break;
      }
    }

    const actualEnd = (splitOffset > currentStart && splitOffset <= cleanText.length)
      ? splitOffset
      : currentEnd;

    const chunkContent = cleanText.substring(currentStart, actualEnd).trim();
    if (chunkContent.length > 0) {
      chunks.push({
        id: `chunk_${counter++}`,
        text: chunkContent,
        pageNumber,
        charCount: chunkContent.length,
        chunkIndex: counter - 1,
      });
    }

    // Move next start forward with overlap
    currentStart = actualEnd - chunkOverlap;
    if (currentStart >= actualEnd) {
      currentStart = actualEnd;
    }
  }

  return chunks;
}

/**
 * Chunks a collection of pages, preserving page metadata for each chunk.
 * 
 * @param {Array<{ pageNumber: number, text: string }>} pages - Array of extracted page objects
 * @param {object} options - Options passed to chunkText
 * @returns {Array<{ id: string, text: string, pageNumber: number, charCount: number, chunkIndex: number }>}
 */
export function chunkPages(pages, options = {}) {
  if (!Array.isArray(pages) || pages.length === 0) {
    return [];
  }

  const allChunks = [];
  let globalChunkIndex = 1;

  for (const page of pages) {
    if (!page.text || page.text.trim().length === 0) {
      continue;
    }

    const pageChunks = chunkText(page.text, {
      ...options,
      pageNumber: page.pageNumber || 1,
      startIndex: globalChunkIndex,
    });

    for (const chunk of pageChunks) {
      allChunks.push(chunk);
      globalChunkIndex++;
    }
  }

  return allChunks;
}

export default { chunkText, chunkPages };
