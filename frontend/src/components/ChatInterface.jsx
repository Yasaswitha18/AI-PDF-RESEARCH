import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Bot,
  User,
  Sparkles,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Trash2,
  Loader2,
  FileSearch,
  ExternalLink,
} from 'lucide-react';

export function ChatInterface({
  messages,
  onSendMessage,
  onClearChat,
  isLoading,
  hasDocument,
  activeDocumentName,
}) {
  const [input, setInput] = useState('');
  const [expandedSources, setExpandedSources] = useState({});
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput('');
  };

  const toggleSources = (msgIndex) => {
    setExpandedSources((prev) => ({
      ...prev,
      [msgIndex]: !prev[msgIndex],
    }));
  };

  const samplePrompts = [
    'What are the main findings and objectives of this document?',
    'Summarize the methodology or key approaches used.',
    'What conclusions or future directions does the author suggest?',
    'Find and explain any specific data points, statistics, or metrics.',
  ];

  return (
    <div className="chat-container">
      {/* Header bar */}
      <div className="chat-header">
        <div className="chat-title-group">
          <Bot size={20} color="#818cf8" />
          <div>
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Gemini Research Agent</span>
            <span
              style={{
                marginLeft: '8px',
                fontSize: '0.7rem',
                color: 'var(--text-dim)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              gemini-2.5-flash
            </span>
          </div>
        </div>

        {messages.length > 0 && (
          <button
            className="btn btn-secondary"
            onClick={onClearChat}
            style={{ padding: '5px 10px', fontSize: '0.74rem' }}
            title="Clear chat history"
          >
            <Trash2 size={13} />
            Clear Chat
          </button>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="empty-chat">
            <div className="empty-icon">
              <Sparkles size={28} />
            </div>
            <h2 className="empty-title">
              {hasDocument
                ? `Ask questions about "${activeDocumentName || 'your PDF'}"`
                : 'Upload a PDF to Start Researching'}
            </h2>
            <p className="empty-subtitle">
              {hasDocument
                ? 'The Gemini AI agent will autonomously choose tools to search embeddings, find keywords, or summarize content.'
                : 'Upload a research paper, report, or syllabus to begin semantic Q&A with genuine RAG.'}
            </p>

            {hasDocument && (
              <div className="suggested-questions">
                <p
                  style={{
                    fontSize: '0.72rem',
                    color: 'var(--text-dim)',
                    textAlign: 'left',
                    marginBottom: '4px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                  }}
                >
                  Suggested Inquiries:
                </p>
                {samplePrompts.map((prompt, i) => (
                  <button
                    key={i}
                    className="suggested-btn"
                    onClick={() => onSendMessage(prompt)}
                    disabled={isLoading}
                  >
                    <span>{prompt}</span>
                    <ChevronRight size={14} color="var(--text-dim)" />
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          messages.map((msg, index) => (
            <div key={index} className={`message-row ${msg.role}`}>
              <div className={`message-avatar ${msg.role}`}>
                {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
              </div>

              <div className="message-body">
                {/* Display Agent Tool Execution Trace if present */}
                {msg.toolCalls && msg.toolCalls.length > 0 && (
                  <div>
                    {msg.toolCalls.map((tc, tcIdx) => (
                      <div key={tcIdx} className="tool-badge">
                        <Sparkles size={12} color="#a5b4fc" />
                        <span>
                          Agent Executed: <strong>{tc.toolName}</strong>
                          {tc.args?.query ? ` (query: "${tc.args.query}")` : ''}
                          {tc.args?.keyword ? ` (keyword: "${tc.args.keyword}")` : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="message-bubble">
                  <div className="markdown-content" style={{ whiteSpace: 'pre-wrap' }}>
                    {msg.content}
                  </div>

                  {/* Sources & Citations Accordion */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="sources-container">
                      <div
                        className="sources-header"
                        onClick={() => toggleSources(index)}
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                      >
                        {expandedSources[index] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        <span>
                          Cited Sources ({msg.sources.length} excerpt
                          {msg.sources.length > 1 ? 's' : ''})
                        </span>
                      </div>

                      {expandedSources[index] && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                          {msg.sources.map((src, srcIdx) => (
                            <div key={srcIdx} className="source-item">
                              <div className="source-meta">
                                <span className="source-page">Page {src.pageNumber}</span>
                                {src.similarityScore && (
                                  <span className="source-score">
                                    Similarity: {(src.similarityScore * 100).toFixed(1)}%
                                  </span>
                                )}
                              </div>
                              <p className="source-excerpt">{src.textExcerpt || src.text}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}

        {isLoading && (
          <div className="message-row assistant">
            <div className="message-avatar assistant">
              <Bot size={18} />
            </div>
            <div className="message-body">
              <div className="message-bubble" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Loader2 size={16} className="spinner" color="#818cf8" />
                <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                  Gemini Agent is researching document embeddings...
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="chat-input-area">
        <form onSubmit={handleSubmit} className="input-form">
          <input
            type="text"
            className="chat-input"
            placeholder={
              hasDocument
                ? 'Ask a question or request a summary (e.g., "What are the core conclusions?")...'
                : 'Upload a PDF document first to enable AI research...'
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={!hasDocument || isLoading}
          />
          <button
            type="submit"
            className="send-btn"
            disabled={!hasDocument || !input.trim() || isLoading}
            title="Send query to Gemini Agent"
          >
            {isLoading ? <Loader2 size={16} className="spinner" /> : <Send size={16} />}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ChatInterface;

