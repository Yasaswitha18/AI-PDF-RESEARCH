import React from 'react';
import { FileText, Layers, Trash2, Sparkles, Hash, HardDrive } from 'lucide-react';

export function DocumentInfo({
  document,
  onSummarize,
  onClear,
  isSummarizing,
}) {
  if (!document) {
    return null;
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 KB';
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="panel-card">
      <div className="panel-header">
        <h3 className="panel-title">
          <FileText size={18} color="#06b6d4" />
          Active Document
        </h3>
        <span
          style={{
            fontSize: '0.68rem',
            fontFamily: 'var(--font-mono)',
            color: '#67e8f9',
            background: 'var(--accent-cyan-light)',
            padding: '2px 6px',
            borderRadius: '4px',
          }}
        >
          IN-MEMORY RAG
        </span>
      </div>

      <div
        style={{
          fontSize: '0.86rem',
          fontWeight: 600,
          color: 'var(--text-main)',
          wordBreak: 'break-all',
          marginBottom: '8px',
        }}
      >
        {document.originalName || document.filename}
      </div>

      <div className="doc-stats">
        <div className="stat-box">
          <div className="stat-label">Total Pages</div>
          <div className="stat-value">{document.totalPages || 1}</div>
        </div>
        <div className="stat-box">
          <div className="stat-label">Vector Chunks</div>
          <div className="stat-value">{document.totalChunks || 0}</div>
        </div>
        <div className="stat-box">
          <div className="stat-label">Characters</div>
          <div className="stat-value">
            {document.totalCharacters ? document.totalCharacters.toLocaleString() : 'N/A'}
          </div>
        </div>
        <div className="stat-box">
          <div className="stat-label">File Size</div>
          <div className="stat-value">{formatFileSize(document.size)}</div>
        </div>
      </div>

      <div className="action-buttons">
        <button
          className="btn btn-primary"
          style={{ flex: 1 }}
          onClick={onSummarize}
          disabled={isSummarizing}
          title="Trigger Gemini to generate executive document summary"
        >
          <Sparkles size={14} />
          {isSummarizing ? 'Summarizing...' : 'Summarize PDF'}
        </button>

        <button
          className="btn btn-danger"
          onClick={onClear}
          title="Clear document from in-memory vector store"
        >
          <Trash2 size={14} />
          Clear
        </button>
      </div>
    </div>
  );
}

export default DocumentInfo;
