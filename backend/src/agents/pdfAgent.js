import { Type } from '@google/genai';
import { getGeminiClient, GEMINI_CONFIG } from '../config/gemini.js';
import { vectorStore } from '../services/vectorStore.js';
import { searchPdf } from '../tools/searchPdf.js';
import { summarizePdf } from '../tools/summarizePdf.js';
import { findKeyword } from '../tools/findKeyword.js';

/**
 * AI Agent Tool Declarations
 * Registered with Gemini native function calling schema
 */
export const pdfTools = [
  {
    functionDeclarations: [
      {
        name: 'search_pdf',
        description:
          'Search the uploaded PDF document using semantic vector search and cosine similarity. Use this tool whenever the user asks a conceptual question, seeks factual information, or asks what the document says about a topic.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            query: {
              type: Type.STRING,
              description: 'The search query or concept to look up in the document embeddings.',
            },
            topK: {
              type: Type.INTEGER,
              description: 'The number of most relevant chunks to retrieve (default: 4).',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'summarize_pdf',
        description:
          'Generate an executive summary and high-level overview of the entire uploaded PDF document or a specific section. Use this tool when the user asks to summarize, give an overview, or highlight key points of the PDF.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            focusTopic: {
              type: Type.STRING,
              description: 'Optional specific topic or theme within the document to focus the summary on.',
            },
          },
        },
      },
      {
        name: 'find_keyword',
        description:
          'Search the PDF text for exact occurrences of a specific keyword, phrase, or term. Use this tool when the user asks where a particular word/phrase appears, how many times a term is mentioned, or for keyword occurrences.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            keyword: {
              type: Type.STRING,
              description: 'The word or phrase to search for in the document.',
            },
            maxResults: {
              type: Type.INTEGER,
              description: 'Maximum number of matching occurrences to return (default: 8).',
            },
          },
          required: ['keyword'],
        },
      },
    ],
  },
];

/**
 * Deduplicates sources by chunkId or pageNumber + excerpt
 */
function deduplicateSources(sources) {
  const seen = new Set();
  const deduped = [];

  for (const s of sources) {
    const key = s.chunkId || `${s.pageNumber}-${s.textExcerpt?.substring(0, 40)}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(s);
    }
  }

  return deduped;
}

/**
 * Executes the AI Agent loop using Gemini Native Function Calling.
 * 
 * 1. Sends user message and tool definitions to Gemini.
 * 2. Gemini autonomously decides which tool to call (or responds directly).
 * 3. Backend executes the requested JavaScript function.
 * 4. Sends function response back to Gemini.
 * 5. Gemini synthesizes the final grounded answer.
 * 
 * @param {string} userMessage - User's input question or instruction
 * @param {Array<{ role: string, content: string }>} [chatHistory=[]] - Optional previous turns
 * @returns {Promise<{ answer: string, toolCalls: Array, sources: Array }>}
 */
export async function runPdfAgent(userMessage, chatHistory = []) {
  if (!userMessage || typeof userMessage !== 'string' || userMessage.trim().length === 0) {
    throw new Error('User message is required.');
  }

  const ai = getGeminiClient();
  const docInfo = vectorStore.getDocumentInfo();

  const systemInstruction = `You are the AI PDF Research Assistant, an intelligent document analysis agent.
Current Active Document: "${docInfo?.originalName || 'No document loaded'}" (Total Pages: ${docInfo?.totalPages || 0}, Chunks: ${docInfo?.totalChunks || 0}).

Guidelines:
1. Always rely on your available tools ('search_pdf', 'summarize_pdf', 'find_keyword') to fetch accurate facts from the document.
2. For questions about concepts, explanations, or specific details in the document, call 'search_pdf'.
3. For requests to summarize, give an overview, or highlight main points, call 'summarize_pdf'.
4. When asked where a specific word, phrase, or term appears, call 'find_keyword'.
5. If the user greeting is conversational (e.g. "hi", "hello"), you may respond politely and invite them to ask about their document.
6. When answering from document context, cite specific page numbers (e.g., "[Page 2]").
7. If the retrieved context does not contain sufficient information to answer the question, clearly state: "The document does not contain sufficient information to answer this question."
8. Format your final answers cleanly with markdown (bullet points, bold text, headers where appropriate).`;

  // Build existing history for the chat session if provided
  const history = [];
  for (const item of chatHistory) {
    if (item.role === 'user' && item.content) {
      history.push({ role: 'user', parts: [{ text: item.content }] });
    } else if (item.role === 'assistant' && item.content) {
      history.push({ role: 'model', parts: [{ text: item.content }] });
    }
  }

  const chat = ai.chats.create({
    model: GEMINI_CONFIG.modelName,
    history,
    config: {
      systemInstruction,
      tools: pdfTools,
      temperature: 0.2,
    },
  });

  const toolCallsExecuted = [];
  const accumulatedSources = [];
  const MAX_AGENT_TURNS = 5;
  let turnCount = 0;

  // Send the initial user message
  let response = await chat.sendMessage({
    message: userMessage.trim(),
  });

  // Agent execution loop: while Gemini requests function calls
  while (response.functionCalls && response.functionCalls.length > 0 && turnCount < MAX_AGENT_TURNS) {
    turnCount++;

    for (const call of response.functionCalls) {
      const toolName = call.name;
      const toolArgs = call.args || {};

      let toolOutput;

      if (toolName === 'search_pdf') {
        toolOutput = await searchPdf(toolArgs);
        if (toolOutput.matches && toolOutput.matches.length > 0) {
          accumulatedSources.push(...toolOutput.matches);
        }
      } else if (toolName === 'summarize_pdf') {
        toolOutput = await summarizePdf(toolArgs);
      } else if (toolName === 'find_keyword') {
        toolOutput = await findKeyword(toolArgs);
        if (toolOutput.matches && toolOutput.matches.length > 0) {
          for (const m of toolOutput.matches) {
            accumulatedSources.push({
              chunkId: m.chunkId,
              pageNumber: m.pageNumber,
              similarityScore: null,
              textExcerpt: m.excerpt,
            });
          }
        }
      } else {
        toolOutput = { success: false, error: `Unrecognized tool: ${toolName}` };
      }

      toolCallsExecuted.push({
        toolName,
        args: toolArgs,
        turn: turnCount,
        summary: toolOutput.success !== false
          ? `Executed ${toolName} successfully`
          : `Tool error: ${toolOutput.error}`,
      });

      // Send the tool execution result back to Gemini
      response = await chat.sendMessage({
        message: [
          {
            functionResponse: {
              name: toolName,
              response: { result: toolOutput },
            },
          },
        ],
      });
    }
  }

  return {
    answer: response.text || 'I could not generate an answer for this query.',
    toolCalls: toolCallsExecuted,
    sources: deduplicateSources(accumulatedSources),
    documentInfo: docInfo,
  };
}

export default {
  runPdfAgent,
  pdfTools,
};

