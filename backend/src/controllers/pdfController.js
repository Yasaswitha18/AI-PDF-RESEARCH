import { ingestPdf } from '../services/ragService.js';
import { runPdfAgent } from '../agents/pdfAgent.js';
import { summarizePdf } from '../tools/summarizePdf.js';
import { findKeyword } from '../tools/findKeyword.js';
import { vectorStore } from '../services/vectorStore.js';
import { isGeminiConfigured } from '../config/gemini.js';

/**
 * PDF Controller
 * 
 * Handles incoming HTTP requests for PDF ingestion, AI chat agent,
 * summarization, keyword search, and document management.
 */

/**
 * POST /api/pdf/upload
 * Handles file upload, text extraction, chunking, embedding generation, and vector store ingestion.
 */
export async function uploadPdf(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No PDF file was uploaded. Please attach a file using the "pdf" field.',
      });
    }

    // Validate MIME type
    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({
        success: false,
        error: 'Invalid file format. Only PDF files are supported.',
      });
    }

    // Validate file size (10 MB limit)
    const MAX_SIZE_BYTES = 10 * 1024 * 1024;
    if (req.file.size > MAX_SIZE_BYTES) {
      return res.status(400).json({
        success: false,
        error: 'File size exceeds the 10 MB limit.',
      });
    }

    if (!isGeminiConfigured()) {
      return res.status(500).json({
        success: false,
        error: 'Gemini API key is missing. Please set GEMINI_API_KEY in backend/.env to generate embeddings.',
      });
    }

    // Process PDF and ingest into vector store
    const result = await ingestPdf(req.file.buffer, {
      originalname: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });

    return res.status(200).json({
      success: true,
      message: 'PDF successfully processed, embedded, and stored in vector memory.',
      data: result,
    });
  } catch (error) {
    console.error('[Upload Controller Error]:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'An error occurred while processing the PDF.',
    });
  }
}

/**
 * POST /api/chat
 * Dispatches user question to the Gemini AI Agent with tool calling capabilities.
 */
export async function chatWithDocument(req, res) {
  try {
    const { question, history = [] } = req.body;

    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'A valid "question" string is required in the request body.',
      });
    }

    if (vectorStore.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'No PDF document is currently loaded. Please upload a PDF first.',
      });
    }

    if (!isGeminiConfigured()) {
      return res.status(500).json({
        success: false,
        error: 'Gemini API key is missing. Please set GEMINI_API_KEY in backend/.env.',
      });
    }

    const agentResult = await runPdfAgent(question.trim(), history);

    return res.status(200).json({
      success: true,
      data: agentResult,
    });
  } catch (error) {
    console.error('[Chat Controller Error]:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'An error occurred during chat processing.',
    });
  }
}

/**
 * POST /api/pdf/summarize
 * Generates an executive summary of the uploaded document.
 */
export async function summarizeDocument(req, res) {
  try {
    const { focusTopic } = req.body || {};

    if (vectorStore.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'No PDF document is currently loaded. Please upload a PDF first.',
      });
    }

    if (!isGeminiConfigured()) {
      return res.status(500).json({
        success: false,
        error: 'Gemini API key is missing. Please set GEMINI_API_KEY in backend/.env.',
      });
    }

    const summaryResult = await summarizePdf({ focusTopic });

    if (!summaryResult.success) {
      return res.status(500).json({
        success: false,
        error: summaryResult.error || 'Failed to generate summary.',
      });
    }

    return res.status(200).json({
      success: true,
      data: summaryResult,
    });
  } catch (error) {
    console.error('[Summarize Controller Error]:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'An error occurred during summarization.',
    });
  }
}

/**
 * POST /api/pdf/search
 * Searches for a keyword or phrase in the PDF document.
 */
export async function searchKeywordInDocument(req, res) {
  try {
    const { keyword, maxResults = 10 } = req.body;

    if (!keyword || typeof keyword !== 'string' || keyword.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'A valid "keyword" string is required in the request body.',
      });
    }

    if (vectorStore.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'No PDF document is currently loaded. Please upload a PDF first.',
      });
    }

    const searchResult = await findKeyword({ keyword: keyword.trim(), maxResults });

    return res.status(200).json({
      success: true,
      data: searchResult,
    });
  } catch (error) {
    console.error('[Search Controller Error]:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'An error occurred during keyword search.',
    });
  }
}

/**
 * DELETE /api/pdf
 * Clears the active document and in-memory vector store.
 */
export function clearActiveDocument(req, res) {
  try {
    vectorStore.clear();
    return res.status(200).json({
      success: true,
      message: 'Active document and vector embeddings cleared successfully.',
    });
  } catch (error) {
    console.error('[Clear Controller Error]:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to clear active document.',
    });
  }
}

/**
 * GET /api/pdf/status
 * Returns current document status and Gemini setup health.
 */
export function getDocumentStatus(req, res) {
  const docInfo = vectorStore.getDocumentInfo();
  return res.status(200).json({
    success: true,
    data: {
      hasDocument: !vectorStore.isEmpty(),
      document: docInfo,
      geminiConfigured: isGeminiConfigured(),
    },
  });
}

export default {
  uploadPdf,
  chatWithDocument,
  summarizeDocument,
  searchKeywordInDocument,
  clearActiveDocument,
  getDocumentStatus,
};
