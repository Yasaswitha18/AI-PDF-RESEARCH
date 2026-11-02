import React, { useState } from 'react';
import { Search, Hash, Loader2 } from 'lucide-react';

export function KeywordSearch({ onSearch, hasDocument }) {
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!keyword.trim() || !hasDocument) return;

    setIsSearching(true);
    setError('');

    try {
      const data = await onSearch(keyword.trim());
      setResults(data);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="panel-card">
      <div className="panel-header">
        <h3 className="panel-title">
          <Search size={18} color="#f59e0b" />
          Keyword Search
        </h3>
        {results && (
          <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
            {results.totalOccurrences} found
          </span>
        )}
      </div>

      <form onSubmit={handleSearch} className="search-input-group">
        <input
          type="text"
          className="text-input"
          placeholder={hasDocument ? 'Find word or term...' : 'Upload PDF first...'}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          disabled={!hasDocument || isSearching}
        />
        <button
          type="submit"
          className="btn btn-secondary"
          disabled={!hasDocument || !keyword.trim() || isSearching}
        >
          {isSearching ? <Loader2 size={14} className="spinner" /> : <Search size={14} />}
        </button>
      </form>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '10px' }}>
          <span>{error}</span>
        </div>
      )}

      {results && results.matches && results.matches.length > 0 && (
        <div className="search-results-list">
          {results.matches.map((match, idx) => (
            <div key={idx} className="search-result-item">
              <span className="result-badge">Page {match.pageNumber}</span>
              <p className="result-text">{match.excerpt}</p>
            </div>
          ))}
        </div>
      )}

      {results && results.totalOccurrences === 0 && (
        <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textAlign: 'center', margin: '8px 0' }}>
          No occurrences found for "{results.keyword}".
        </p>
      )}
    </div>
  );
}

export default KeywordSearch;
