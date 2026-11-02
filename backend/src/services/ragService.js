import { extractTextFromPdf } from './pdfService.js';
import { chunkPages } from '../utils/chunkText.js';
import { generateEmbedding, generateBatchEmbeddings } from './embeddingService.js';
import { vectorStore } from './vectorStore.js';
import { getGeminiClient, GEMINI_CONFIG } from '../config/gemini.js';

/**
 * RAG Service
 * 
 * Orchestrates the full Retrieval-Augmented Generation pipeline:
 * 1. PDF Text Ingestion & Page Extraction
 * 2. Text Chunking with Overlap & Page Tracking
 * 3. Gemini Vector Embedding Generation
 * 4. In-Memory Vector Storage
 * 5. Semantic Vector Retrieval via Cosine Similarity
 * 6. Grounded Answer Generation via Gemini LLM
 */

/**
 * Ingests an uploaded PDF buffer into the RAG system.
 * 
 * @param {Buffer} fileBuffer - The PDF file buffer
 * @param {object} fileMeta - Metadata (filename, size, mimetype)
 * @returns {Promise<object>} Ingestion summary statistics
 */
export async function ingestPdf(fileBuffer, fileMeta) {
  // 1. Text Extraction
  const { totalPages, pages, totalCharacters, info } = await extractTextFromPdf(fileBuffer);

  // 2. Text Chunking (preserving page numbers)
  const chunks = chunkPages(pages, {
    chunkSize: 650,
    chunkOverlap: 120,
  });

  if (chunks.length === 0) {
    throw new Error('No readable text chunks could be extracted from this PDF.');
  }

  // 3. Batch Embedding Generation using Gemini
  const chunkTexts = chunks.map((c) => c.text);
  const embeddings = await generateBatchEmbeddings(chunkTexts);

  // 4. Attach embeddings to chunks
  const chunksWithEmbeddings = chunks.map((chunk, index) => ({
    ...chunk,
    embedding: embeddings[index] || [],
  }));

  // 5. Store in In-Memory Vector Store
  const docInfo = {
    filename: fileMeta.filename || fileMeta.originalname,
    originalName: fileMeta.originalname,
    size: fileMeta.size,
    totalPages,
    totalCharacters,
    info,
  };

  vectorStore.setDocument(docInfo, chunksWithEmbeddings);

  return {
    success: true,
    document: vectorStore.getDocumentInfo(),
    chunksCount: chunks.length,
    totalPages,
    totalCharacters,
  };
}

/**
 * Direct RAG Question Answering pipeline:
 * 1. Embed query
 * 2. Retrieve top-k chunks
 * 3. Prompt Gemini with retrieved context only
 * 4. Return grounded answer + sources
 * 
 * @param {string} question - User question
 * @param {number} [topK=4] - Number of context chunks
 * @returns {Promise<object>}
 */
export async function answerWithRag(question, topK = 4) {
  if (vectorStore.isEmpty()) {
    throw new Error('No PDF document loaded. Please upload a PDF first.');
  }

  // Step 1: Embed question
  const questionEmbedding = await generateEmbedding(question.trim());

  // Step 2: Semantic vector search via cosine similarity
  const relevantChunks = vectorStore.similaritySearch(questionEmbedding, topK);

  if (relevantChunks.length === 0) {
    return {
      answer: 'The document does not contain sufficient information to answer this question.',
      sources: [],
    };
  }

  // Step 3: Format retrieved context
  const contextText = relevantChunks
    .map((c) => `[Source: Page ${c.pageNumber}, Chunk ID: ${c.id}]\n${c.text}`)
    .join('\n\n---\n\n');

  const docInfo = vectorStore.getDocumentInfo();
  const ai = getGeminiClient();

  const ragPrompt = `You are an AI research assistant. Answer the user's question STRICTLY and SOLELY based on the provided document excerpts.

Rules:
1. Base your answer only on the provided context below.
2. If the excerpts do not contain the answer, state clearly: "The document does not contain sufficient information to answer this question."
3. Cite the relevant page numbers whenever making a statement (e.g., "[Page 3]").
4. Keep the answer clear, professional, and well-structured.

--- CONTEXT EXCERPTS FROM "${docInfo?.originalName || 'PDF'}" ---
${contextText}
--- END CONTEXT EXCERPTS ---

User Question: ${question.trim()}

Answer:`;

  const response = await ai.models.generateContent({
    model: GEMINI_CONFIG.modelName,
    contents: ragPrompt,
    config: {
      temperature: 0.2,
    },
  });

  return {
    answer: response.text,
    sources: relevantChunks.map((c) => ({
      chunkId: c.id,
      pageNumber: c.pageNumber,
      similarityScore: c.similarity,
      textExcerpt: c.text,
    })),
  };
}

export default {
  ingestPdf,
  answerWithRag,
};

