import React, { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { MagnifyingGlass, X } from '@phosphor-icons/react';

interface SearchResult {
  session_id: string;
  session_title: string;
  message_id: string;
  role: string;
  content: string;
  rank: number;
}

interface SessionSearchProps {
  projectId?: string;
  onSelectSession?: (sessionId: string) => void;
}

export const SessionSearch: React.FC<SessionSearchProps> = ({ projectId, onSelectSession }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setShowResults(false);
      return;
    }

    setLoading(true);
    try {
      const data = await invoke<SearchResult[]>('search_sessions', {
        query: searchQuery,
        projectId: projectId || null,
      });
      setResults(data);
      setShowResults(true);
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    // Debounce search
    const timer = setTimeout(() => {
      handleSearch(value);
    }, 300);
    
    return () => clearTimeout(timer);
  };

  const handleSelectResult = (sessionId: string) => {
    if (onSelectSession) {
      onSelectSession(sessionId);
    }
    setShowResults(false);
    setQuery('');
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className="bg-yellow-400/30 text-[var(--text)]">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="relative">
      <div className="relative">
        <MagnifyingGlass
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
        />
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder="Search sessions..."
          className="w-full pl-9 pr-8 py-2 text-xs bg-[var(--surface)] border border-[var(--border)] rounded-lg text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
              setShowResults(false);
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[var(--text-muted)] hover:text-[var(--text)] rounded"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {showResults && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-lg max-h-96 overflow-y-auto z-50">
          {loading ? (
            <div className="p-4 text-center text-xs text-[var(--text-muted)]">Searching...</div>
          ) : results.length > 0 ? (
            <div className="py-2">
              {results.map((result) => (
                <button
                  key={result.message_id}
                  onClick={() => handleSelectResult(result.session_id)}
                  className="w-full px-4 py-2 text-left hover:bg-[var(--hover-bg)] transition-colors"
                >
                  <div className="text-xs font-medium text-[var(--text)] mb-1">
                    {result.session_title}
                  </div>
                  <div className="text-xs text-[var(--text-muted)] line-clamp-2">
                    <span className="font-semibold">{result.role}:</span>{' '}
                    {highlightMatch(result.content, query)}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-xs text-[var(--text-muted)]">
              No results found
            </div>
          )}
        </div>
      )}
    </div>
  );
};
