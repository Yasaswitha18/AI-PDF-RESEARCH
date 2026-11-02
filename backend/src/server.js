import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pdfRoutes from './routes/pdfRoutes.js';
import { chatWithDocument } from './controllers/pdfController.js';
import { isGeminiConfigured, GEMINI_CONFIG } from './config/gemini.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend Vite dev server and general clients
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    geminiConfigured: isGeminiConfigured(),
    llmModel: GEMINI_CONFIG.modelName,
    embeddingModel: GEMINI_CONFIG.embeddingModelName,
  });
});

// Chat endpoint (required by specification: POST /api/chat)
app.post('/api/chat', chatWithDocument);

// PDF feature routes (/api/pdf/upload, /api/pdf/summarize, /api/pdf/search, DELETE /api/pdf, /api/pdf/status)
app.use('/api/pdf', pdfRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Global Error Handler]:', err.message);

  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'Uploaded file exceeds the maximum 10 MB limit.',
      });
    }
    return res.status(400).json({
      success: false,
      error: `File upload error: ${err.message}`,
    });
  }

  return res.status(500).json({
    success: false,
    error: err.message || 'Internal Server Error',
  });
});

// Start Express server only when not running in test mode
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🚀 AI PDF Research Assistant Backend Server Running`);
    console.log(`📡 URL: http://localhost:${PORT}`);
    console.log(`🔑 Gemini Configured: ${isGeminiConfigured() ? 'YES' : 'NO (Add GEMINI_API_KEY in backend/.env)'}`);
    console.log(`🧠 LLM Model: ${GEMINI_CONFIG.modelName}`);
    console.log(`📐 Embedding Model: ${GEMINI_CONFIG.embeddingModelName}`);
    console.log(`=======================================================`);
  });
}

export default app;
