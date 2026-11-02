import axios from 'axios';

// Create configured Axios instance
const apiClient = axios.create({
  baseURL: 'http://localhost:5000/api',
  timeout: 60000, // 60s timeout for large PDF embedding generation
});

/**
 * Uploads a PDF document to the backend RAG pipeline.
 * 
 * @param {File} file - PDF file object
 * @param {Function} [onUploadProgress] - Progress callback
 */
export async function uploadPdf(file, onUploadProgress) {
  const formData = new FormData();
  formData.append('pdf', file);

  const response = await apiClient.post('/pdf/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress,
  });

  return response.data;
}

/**
 * Sends a user question to the Gemini AI Agent.
 * 
 * @param {string} question - User question
 * @param {Array<{ role: string, content: string }>} [history=[]] - Chat history
 */
export async function askAgent(question, history = []) {
  const response = await apiClient.post('/chat', {
    question,
    history,
  });

  return response.data;
}

/**
 * Requests an executive document summary.
 * 
 * @param {string} [focusTopic] - Optional topic focus
 */
export async function summarizeDocument(focusTopic = '') {
  const response = await apiClient.post('/pdf/summarize', {
    focusTopic,
  });

  return response.data;
}

/**
 * Performs a keyword lookup across the PDF.
 * 
 * @param {string} keyword - Word or phrase to locate
 */
export async function searchKeyword(keyword) {
  const response = await apiClient.post('/pdf/search', {
    keyword,
  });

  return response.data;
}

/**
 * Clears the active document and vector store.
 */
export async function clearActiveDocument() {
  const response = await apiClient.delete('/pdf');
  return response.data;
}

/**
 * Fetches active document status and Gemini setup health.
 */
export async function getDocumentStatus() {
  const response = await apiClient.get('/pdf/status');
  return response.data;
}

/**
 * Server health check.
 */
export async function checkHealth() {
  const response = await apiClient.get('/health');
  return response.data;
}

export default {
  uploadPdf,
  askAgent,
  summarizeDocument,
  searchKeyword,
  clearActiveDocument,
  getDocumentStatus,
  checkHealth,
};

