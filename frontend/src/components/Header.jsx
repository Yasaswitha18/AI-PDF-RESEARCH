import React from 'react';
import { BookOpen, Sparkles, CheckCircle, AlertCircle, FileText } from 'lucide-react';

export function Header({ geminiConfigured, activeDocument }) {
  return (
    <header className="app-header">
      <div className="brand-section">
        <div className="brand-logo">
          <BookOpen size={22} color="#ffffff" />
        </div>
        <div>
          <div className="brand-title">
            AI PDF Research Assistant
            <span className="brand-badge">Gemini GenAI</span>
          </div>
          <p className="brand-desc">
            RAG Pipeline • Semantic Vector Search • Gemini Function-Calling Agent
          </p>
        </div>
      </div>

      <div className="header-meta">
        {activeDocument && (
          <div className="status-pill configured" title="Active PDF loaded in vector memory">
            <FileText size={14} color="#6ee7b7" />
            <span>{activeDocument.originalName || 'Document Active'}</span>
          </div>
        )}

        <div
          className={`status-pill ${geminiConfigured ? 'configured' : 'unconfigured'}`}
          title={
            geminiConfigured
              ? 'Gemini API key is configured'
              : 'Add GEMINI_API_KEY in backend/.env'
          }
        >
          <span className={`status-dot ${geminiConfigured ? 'configured' : 'unconfigured'}`} />
          <span>{geminiConfigured ? 'Gemini 2.5 Connected' : 'API Key Missing'}</span>
        </div>
      </div>
    </header>
  );
}

export default Header;

