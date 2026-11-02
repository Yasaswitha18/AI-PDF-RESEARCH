import { Router } from 'express';
import multer from 'multer';
import {
  uploadPdf,
  chatWithDocument,
  summarizeDocument,
  searchKeywordInDocument,
  clearActiveDocument,
  getDocumentStatus,
} from '../controllers/pdfController.js';

const router = Router();

// Configure Multer for in-memory PDF uploads (10 MB limit)
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF documents are allowed.'), false);
    }
  },
});

// PDF Ingestion endpoint
router.post('/upload', upload.single('pdf'), uploadPdf);

// Summarization endpoint
router.post('/summarize', summarizeDocument);

// Keyword search endpoint
router.post('/search', searchKeywordInDocument);

// Clear active document endpoint
router.delete('/', clearActiveDocument);

// Document & Gemini status endpoint
router.get('/status', getDocumentStatus);

// Also expose chat under /pdf/chat in addition to /api/chat
router.post('/chat', chatWithDocument);

export default router;

