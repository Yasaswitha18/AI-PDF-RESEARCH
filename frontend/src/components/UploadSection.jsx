import React, { useState, useRef } from 'react';
import { UploadCloud, File, Loader2, AlertCircle } from 'lucide-react';

export function UploadSection({ onUpload, isUploading, uploadProgress, error }) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [validationError, setValidationError] = useState('');
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragActive(false);
  };

  const validateAndUpload = (file) => {
    setValidationError('');

    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setValidationError('Please select a valid PDF file (.pdf).');
      return;
    }

    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_SIZE) {
      setValidationError('File size exceeds 10 MB limit. Please select a smaller PDF.');
      return;
    }

    onUpload(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndUpload(e.target.files[0]);
    }
  };

  return (
    <div className="panel-card">
      <div className="panel-header">
        <h3 className="panel-title">
          <UploadCloud size={18} color="#818cf8" />
          Upload Research PDF
        </h3>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Max 10 MB</span>
      </div>

      <div
        className={`dropzone ${isDragActive ? 'active' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="application/pdf,.pdf"
          style={{ display: 'none' }}
          disabled={isUploading}
        />

        {isUploading ? (
          <div>
            <Loader2 size={32} className="spinner dropzone-icon" color="#818cf8" style={{ margin: '0 auto 10px' }} />
            <p className="dropzone-text">Extracting & Embedding PDF Chunks...</p>
            <p className="dropzone-subtext">Generating Gemini vector embeddings</p>
            {uploadProgress > 0 && (
              <div
                style={{
                  width: '100%',
                  height: '4px',
                  background: 'var(--border-subtle)',
                  borderRadius: '2px',
                  marginTop: '12px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${uploadProgress}%`,
                    height: '100%',
                    background: 'var(--primary)',
                    transition: 'width 0.2s ease',
                  }}
                />
              </div>
            )}
          </div>
        ) : (
          <div>
            <File size={32} className="dropzone-icon" style={{ margin: '0 auto 10px' }} />
            <p className="dropzone-text">Drag & drop your PDF file here</p>
            <p className="dropzone-subtext">or click to browse your files</p>
            <button
              type="button"
              className="browse-btn"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              Browse PDF
            </button>
          </div>
        )}
      </div>

      {(validationError || error) && (
        <div className="alert alert-error" style={{ marginTop: '12px' }}>
          <AlertCircle size={15} style={{ flexShrink: 0 }} />
          <span>{validationError || error}</span>
        </div>
      )}
    </div>
  );
}

export default UploadSection;

