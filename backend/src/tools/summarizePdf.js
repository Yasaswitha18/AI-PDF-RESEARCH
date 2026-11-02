import { vectorStore } from '../services/vectorStore.js';
import { getGeminiClient, GEMINI_CONFIG } from '../config/gemini.js';

/**
 * TOOL 2: summarize_pdf
 * 
 * Generates an executive summary of the uploaded document using Gemini.
 * Handles both short and long documents by chunking sections if necessary.
 * 
 * @param {object} [args]
 * @param {string} [args.focusTopic] - Optional specific topic to focus the summary on
 * @returns {Promise<object>} Generated summary and metadata
 */
export async function summarizePdf(args = {}) {
  const { focusTopic } = args;

  if (vectorStore.isEmpty()) {
    return {
      success: false,
      error: 'No document is currently active. Please upload a PDF document first.',
    };
  }

  const chunks = vectorStore.getChunks();
  const docInfo = vectorStore.getDocumentInfo();
  const ai = getGeminiClient();

  // Combine full text representation
  const combinedText = chunks.map((c) => `[Page ${c.pageNumber}] ${c.text}`).join('\n\n');

  try {
    // If the document is under ~8,000 characters, summarize in one pass
    if (combinedText.length <= 8000) {
      const prompt = `You are an expert research analyst. Please provide a clear, professional summary of the following document.
${focusTopic ? `Special Focus: ${focusTopic}\n` : ''}
Document Name: ${docInfo?.originalName || 'Uploaded PDF'}
Total Pages: ${docInfo?.totalPages || 1}

Structure your response with:
1. **Executive Overview**: 2-3 concise sentences summarizing the document's purpose and core thesis.
2. **Key Findings / Core Topics**: 3-5 bullet points highlighting major insights, methodologies, or data.
3. **Conclusions & Takeaways**: 1-2 concluding sentences on the significance or next steps.

--- DOCUMENT CONTENT ---
${combinedText}
--- END DOCUMENT CONTENT ---`;

      const response = await ai.models.generateContent({
        model: GEMINI_CONFIG.modelName,
        contents: prompt,
      });

      return {
        success: true,
        summary: response.text,
        documentName: docInfo?.originalName,
        totalPages: docInfo?.totalPages,
        totalChunks: chunks.length,
      };
    }

    // For longer documents: Map-Reduce Summarization
    // Group chunks into sections of ~6 chunks each
    const sectionSize = 6;
    const sectionSummaries = [];

    for (let i = 0; i < chunks.length; i += sectionSize) {
      const slice = chunks.slice(i, i + sectionSize);
      const sectionText = slice.map((c) => `[Page ${c.pageNumber}] ${c.text}`).join('\n\n');

      const sectionPrompt = `Summarize the key information from this section of the document in 2-3 bullet points:
${sectionText}`;

      const secResponse = await ai.models.generateContent({
        model: GEMINI_CONFIG.modelName,
        contents: sectionPrompt,
      });

      sectionSummaries.push(secResponse.text);
    }

    // Final synthesis pass
    const finalPrompt = `You are an expert research analyst. Synthesize the following section summaries into a single cohesive, high-level document summary.
${focusTopic ? `Special Focus: ${focusTopic}\n` : ''}
Document Name: ${docInfo?.originalName || 'Uploaded PDF'}

Structure your response with:
1. **Executive Overview**: 2-3 concise sentences.
2. **Key Findings / Core Topics**: Bulleted list of main points across all sections.
3. **Conclusions & Takeaways**: High-level conclusion.

--- SECTION SUMMARIES ---
${sectionSummaries.join('\n\n')}
--- END SECTION SUMMARIES ---`;

    const finalResponse = await ai.models.generateContent({
      model: GEMINI_CONFIG.modelName,
      contents: finalPrompt,
    });

    return {
      success: true,
      summary: finalResponse.text,
      documentName: docInfo?.originalName,
      totalPages: docInfo?.totalPages,
      totalChunks: chunks.length,
    };
  } catch (error) {
    return {
      success: false,
      error: `Document summarization failed: ${error.message}`,
    };
  }
}

export default summarizePdf;
