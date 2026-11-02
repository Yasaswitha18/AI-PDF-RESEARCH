import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractTextFromPdf } from '../services/pdfService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test('extractTextFromPdf - Extracts text and page metadata from sample PDF', async () => {
  const fixturePath = path.join(__dirname, 'fixtures', 'sample.pdf');
  const buffer = fs.readFileSync(fixturePath);

  const result = await extractTextFromPdf(buffer);

  assert.ok(result.totalPages >= 1, 'Should have at least 1 page');
  assert.ok(result.pages.length >= 1, 'Should have page objects');
  assert.strictEqual(result.pages[0].pageNumber, 1);
  assert.ok(result.fullText.length > 0, 'Extracted text should not be empty');
  assert.ok(result.totalCharacters > 0, 'Total characters should be positive');
});

test('extractTextFromPdf - Throws error for empty or invalid buffer', async () => {
  await assert.rejects(
    async () => {
      await extractTextFromPdf(Buffer.from([]));
    },
    /Invalid PDF data/i
  );
});

test('extractTextFromPdf - Rejects non-buffer input', async () => {
  await assert.rejects(
    async () => {
      await extractTextFromPdf('not-a-buffer');
    },
    /Invalid PDF data/i
  );
});
