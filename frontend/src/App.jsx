import React, { useState, useEffect } from 'react';
import Header from './components/Header.jsx';
import UploadSection from './components/UploadSection.jsx';
import DocumentInfo from './components/DocumentInfo.jsx';
import KeywordSearch from './components/KeywordSearch.jsx';
import ChatInterface from './components/ChatInterface.jsx';
import {
  uploadPdf,
  askAgent,
  summarizeDocument,
  searchKeyword,
  clearActiveDocument,
  getDocumentStatus,
} from './services/api.js';

export function App() {
  const [activeDocument, setActiveDocument] = useState(null);
  const [geminiConfigured, setGeminiConfigured] = useState(true);
  const [messages, setMessages] = useState([]);
  
  // Loading & state flags
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [appAlert, setAppAlert] = useState(null);

  // Fetch initial status on component mount
  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await getDocumentStatus();
      if (response.success && response.data) {
        setGeminiConfigured(response.data.geminiConfigured);
        if (response.data.hasDocument && response.data.document) {
          setActiveDocument(response.data.document);
        } else {
          setActiveDocument(null);
        }
      }
    } catch {
      // Backend might be offline or starting up
      setGeminiConfigured(false);
    }
  };

  // Handle PDF Upload
  const handleUpload = async (file) => {
    setIsUploading(true);
    setUploadProgress(10);
    setUploadError('');
    setAppAlert(null);

    try {
      const result = await uploadPdf(file, (progressEvent) => {
        if (progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percent);
        }
      });

      if (result.success && result.data) {
        setActiveDocument(result.data.document);
        setUploadProgress(100);

        // Add system welcome message into chat
        setMessages([
          {
            role: 'assistant',
            content: `📄 **"${file.name}" successfully processed and ingested into vector memory!**\n\n- **Pages:** ${result.data.totalPages}\n- **Vector Chunks:** ${result.data.chunksCount}\n- **Characters:** ${result.data.totalCharacters?.toLocaleString()}\n\nYou can now ask questions, search for terms, or generate an executive summary. The Gemini AI agent is ready!`,
          },
        ]);
      }
    } catch (err) {
      console.error('Upload Error:', err);
      const errMsg =
        err.response?.data?.error ||
        err.message ||
        'Failed to process and embed the PDF. Please check your Gemini API key in backend/.env.';
      setUploadError(errMsg);
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  // Handle Chat Message
  const handleSendMessage = async (question) => {
    if (!question || isChatLoading) return;

    // Optimistically append user message
    const updatedMessages = [...messages, { role: 'user', content: question }];
    setMessages(updatedMessages);
    setIsChatLoading(true);

    try {
      // Format chat history for backend agent
      const historyPayload = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await askAgent(question, historyPayload);

      if (response.success && response.data) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: response.data.answer,
            toolCalls: response.data.toolCalls || [],
            sources: response.data.sources || [],
          },
        ]);
      } else {
        throw new Error(response.error || 'Failed to obtain answer from Gemini Agent.');
      }
    } catch (err) {
      console.error('Chat Error:', err);
      const errorMsg =
        err.response?.data?.error ||
        err.message ||
        'An error occurred while communicating with the Gemini AI agent.';
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ **Agent Error:** ${errorMsg}`,
        },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Handle PDF Summarization
  const handleSummarize = async () => {
    if (isSummarizing || !activeDocument) return;

    setIsSummarizing(true);
    setMessages((prev) => [
      ...prev,
      {
        role: 'user',
        content: 'Please generate an executive summary of this document.',
      },
    ]);
    setIsChatLoading(true);

    try {
      const response = await summarizeDocument();

      if (response.success && response.data) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: response.data.summary,
            toolCalls: [
              {
                toolName: 'summarize_pdf',
                args: {},
                summary: 'Generated executive document summary',
              },
            ],
          },
        ]);
      } else {
        throw new Error(response.error || 'Failed to generate document summary.');
      }
    } catch (err) {
      console.error('Summarize Error:', err);
      const errorMsg =
        err.response?.data?.error || err.message || 'Failed to generate document summary.';
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ **Summarization Error:** ${errorMsg}`,
        },
      ]);
    } finally {
      setIsSummarizing(false);
      setIsChatLoading(false);
    }
  };

  // Handle Clear Document
  const handleClear = async () => {
    try {
      await clearActiveDocument();
      setActiveDocument(null);
      setMessages([]);
      setAppAlert({ type: 'success', text: 'Document cleared from in-memory vector store.' });
      setTimeout(() => setAppAlert(null), 3500);
    } catch (err) {
      console.error('Clear Error:', err);
      setAppAlert({ type: 'error', text: 'Failed to clear document.' });
    }
  };

  return (
    <div className="app-container">
      <Header geminiConfigured={geminiConfigured} activeDocument={activeDocument} />

      <main className="dashboard-grid">
        {/* Left Column / Sidebar */}
        <aside className="sidebar">
          {appAlert && (
            <div className={`alert alert-${appAlert.type}`}>
              <span>{appAlert.text}</span>
            </div>
          )}

          {/* Upload Section */}
          <UploadSection
            onUpload={handleUpload}
            isUploading={isUploading}
            uploadProgress={uploadProgress}
            error={uploadError}
          />

          {/* Active Document Details */}
          {activeDocument && (
            <DocumentInfo
              document={activeDocument}
              onSummarize={handleSummarize}
              onClear={handleClear}
              isSummarizing={isSummarizing}
            />
          )}

          {/* Keyword Search Tool */}
          <KeywordSearch onSearch={searchKeyword} hasDocument={Boolean(activeDocument)} />
        </aside>

        {/* Right Column / Research Chat */}
        <section style={{ height: '100%', overflow: 'hidden' }}>
          <ChatInterface
            messages={messages}
            onSendMessage={handleSendMessage}
            onClearChat={() => setMessages([])}
            isLoading={isChatLoading}
            hasDocument={Boolean(activeDocument)}
            activeDocumentName={activeDocument?.originalName}
          />
        </section>
      </main>
    </div>
  );
}

export default App;

