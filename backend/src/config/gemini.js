import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

/**
 * Default models for the application:
 * - gemini-2.5-flash: Fast, high intelligence, native function calling
 * - text-embedding-004: Standard Google text embedding model
 */
export const GEMINI_CONFIG = {
  apiKey: process.env.GEMINI_API_KEY || '',
  modelName: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  embeddingModelName: process.env.GEMINI_EMBEDDING_MODEL || 'text-embedding-004',
};

let clientInstance = null;

/**
 * Returns true if a valid Gemini API key is configured.
 * @returns {boolean}
 */
export function isGeminiConfigured() {
  return Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0);
}

/**
 * Returns an initialized GoogleGenAI client.
 * Throws a user-friendly error if the API key is missing.
 * @returns {GoogleGenAI}
 */
export function getGeminiClient() {
  if (!isGeminiConfigured()) {
    throw new Error(
      'GEMINI_API_KEY is not configured in backend/.env. Please obtain an API key from Google AI Studio (https://aistudio.google.com/) and set GEMINI_API_KEY in your .env file.'
    );
  }

  if (!clientInstance) {
    clientInstance = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY.trim(),
    });
  }

  return clientInstance;
}

export default {
  GEMINI_CONFIG,
  isGeminiConfigured,
  getGeminiClient,
};
