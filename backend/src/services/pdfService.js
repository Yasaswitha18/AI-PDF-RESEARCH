import pdf from 'pdf-parse';

/**
 * PDF Service
 * 
 * Handles reading and extracting textual content and page metadata from PDF buffers.
 */
export async function extractTextFromPdf(pdfBuffer) {
  if (!pdfBuffer || !Buffer.isBuffer(pdfBuffer) || pdfBuffer.length === 0) {
    throw new Error('Invalid PDF data: Buffer is empty or missing.');
  }

  const pages = [];

  // Custom page renderer to capture page-by-page text
  const renderOptions = {
    pagerender: function (pageData) {
      return pageData.getTextContent().then(function (textContent) {
        let lastY;
        let text = '';

        for (const item of textContent.items) {
          if (lastY === item.transform[5] || !lastY) {
            text += item.str;
          } else {
            text += '\n' + item.str;
          }
          lastY = item.transform[5];
        }

        const trimmed = text.trim();
        pages.push({
          pageNumber: pageData.pageIndex + 1,
          text: trimmed,
        });

        return trimmed;
      });
    },
  };

  let data;
  try {
    data = await pdf(pdfBuffer, renderOptions);
  } catch (err) {
    throw new Error(`Failed to parse PDF document: ${err.message}`);
  }

  // Ensure pages are sorted by pageNumber
  pages.sort((a, b) => a.pageNumber - b.pageNumber);

  // Fallback if custom renderer didn't capture pages
  if (pages.length === 0 && data.text && data.text.trim().length > 0) {
    pages.push({
      pageNumber: 1,
      text: data.text.trim(),
    });
  }

  const totalCharacters = pages.reduce((acc, p) => acc + p.text.length, 0);

  if (totalCharacters === 0) {
    throw new Error(
      'The uploaded PDF appears to be empty or contains only scanned images without extractable digital text.'
    );
  }

  return {
    totalPages: data.numpages || pages.length,
    pages,
    fullText: data.text || pages.map((p) => p.text).join('\n\n'),
    totalCharacters,
    info: data.info || {},
  };
}

export default {
  extractTextFromPdf,
};
