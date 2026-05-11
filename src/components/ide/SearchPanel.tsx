import { useState, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { MagnifyingGlass, X, TextAa, Asterisk, Files } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface SearchMatch {
  filePath: string;
  lineNumber: number;
  lineContent: string;
  matchStart: number;
  matchEnd: number;
}

interface SearchResult {
  matches: SearchMatch[];
  totalMatches: number;
  filesSearched: number;
}

interface SearchPanelProps {
  rootPath: string;
  onClose: () => void;
}

export function SearchPanel({ rootPath, onClose }: SearchPanelProps) {
  const [query, setQuery] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [showReplace, setShowReplace] = useState(false);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [useRegex, setUseRegex] = useState(false);
  const [filePattern, setFilePattern] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SearchResult | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setSearching(true);
    try {
      const result = await invoke<SearchResult>('search_in_files', {
        rootPath,
        query,
        isRegex: useRegex,
        caseSensitive,
        filePattern: filePattern || null,
        excludePatterns: null,
      });
      setResults(result);
      setSelectedFiles(new Set());
    } catch (err) {
      console.error('Search failed:', err);
      alert(`Search failed: ${err}`);
    } finally {
      setSearching(false);
    }
  };

  const handleReplace = async () => {
    if (!results || selectedFiles.size === 0) return;

    const confirmed = confirm(
      `Replace ${results.totalMatches} occurrences in ${selectedFiles.size} files?`
    );
    if (!confirmed) return;

    try {
      await invoke('replace_in_files', {
        filePaths: Array.from(selectedFiles),
        search: query,
        replace: replaceText,
        isRegex: useRegex,
        caseSensitive,
      });
      alert('Replacement complete');
      handleSearch();
    } catch (err) {
      console.error('Replace failed:', err);
      alert(`Replace failed: ${err}`);
    }
  };

  const toggleFileSelection = (filePath: string) => {
    const newSelection = new Set(selectedFiles);
    if (newSelection.has(filePath)) {
      newSelection.delete(filePath);
    } else {
      newSelection.add(filePath);
    }
    setSelectedFiles(newSelection);
  };

  const selectAllFiles = () => {
    if (!results) return;
    const allFiles = new Set(results.matches.map((m) => m.filePath));
    setSelectedFiles(allFiles);
  };

  const groupedMatches = results?.matches.reduce((acc, match) => {
    if (!acc[match.filePath]) {
      acc[match.filePath] = [];
    }
    acc[match.filePath].push(match);
    return acc;
  }, {} as Record<string, SearchMatch[]>);

  return (
    <div className="h-full flex flex-col bg-[var(--surface)] border-l border-[var(--border)]">
      <div className="flex items-center justify-between p-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <MagnifyingGlass size={18} weight="bold" className="text-[var(--text)]" />
          <span className="text-sm font-bold">Search & Replace</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-[var(--surface-2)] rounded transition-colors"
        >
          <X size={16} weight="bold" />
        </button>
      </div>

      <div className="p-3 space-y-2 border-b border-[var(--border)]">
        <div className="relative">
          <input
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search..."
            className="w-full px-3 py-2 pr-24 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <button
              onClick={() => setCaseSensitive(!caseSensitive)}
              className={cn(
                'p-1 rounded transition-colors',
                caseSensitive
                  ? 'bg-[var(--accent)] text-white'
                  : 'hover:bg-[var(--surface)]'
              )}
              title="Match case"
            >
              <TextAa size={14} weight="bold" />
            </button>
            <button
              onClick={() => setUseRegex(!useRegex)}
              className={cn(
                'p-1 rounded transition-colors',
                useRegex
                  ? 'bg-[var(--accent)] text-white'
                  : 'hover:bg-[var(--surface)]'
              )}
              title="Use regex"
            >
              <Asterisk size={14} weight="bold" />
            </button>
            <button
              onClick={() => setShowReplace(!showReplace)}
              className={cn(
                'p-1 rounded transition-colors',
                showReplace
                  ? 'bg-[var(--accent)] text-white'
                  : 'hover:bg-[var(--surface)]'
              )}
              title="Toggle replace"
            >
              <Files size={14} weight="bold" />
            </button>
          </div>
        </div>

        {showReplace && (
          <input
            type="text"
            value={replaceText}
            onChange={(e) => setReplaceText(e.target.value)}
            placeholder="Replace with..."
            className="w-full px-3 py-2 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />
        )}

        <input
          type="text"
          value={filePattern}
          onChange={(e) => setFilePattern(e.target.value)}
          placeholder="File pattern (e.g., *.tsx)"
          className="w-full px-3 py-2 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        />

        <div className="flex gap-2">
          <button
            onClick={handleSearch}
            disabled={searching || !query.trim()}
            className="flex-1 px-3 py-2 bg-[var(--accent)] text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            {searching ? 'Searching...' : 'Search'}
          </button>
          {showReplace && results && selectedFiles.size > 0 && (
            <button
              onClick={handleReplace}
              className="flex-1 px-3 py-2 bg-[var(--accent)] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Replace ({selectedFiles.size})
            </button>
          )}
        </div>
      </div>

      {results && (
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-3 border-b border-[var(--border)] flex items-center justify-between">
            <span className="text-xs text-[var(--text-muted)]">
              {results.totalMatches} matches in {Object.keys(groupedMatches || {}).length} files
              ({results.filesSearched} searched)
            </span>
            {showReplace && (
              <button
                onClick={selectAllFiles}
                className="text-xs text-[var(--accent)] hover:underline"
              >
                Select all
              </button>
            )}
          </div>

          <div className="space-y-2 p-3">
            {Object.entries(groupedMatches || {}).map(([filePath, matches]) => (
              <div key={filePath} className="space-y-1">
                <div className="flex items-center gap-2">
                  {showReplace && (
                    <input
                      type="checkbox"
                      checked={selectedFiles.has(filePath)}
                      onChange={() => toggleFileSelection(filePath)}
                      className="w-4 h-4"
                    />
                  )}
                  <span className="text-xs font-mono text-[var(--text)] font-medium">
                    {filePath.replace(rootPath, '')}
                  </span>
                  <span className="text-xs text-[var(--text-muted)]">
                    ({matches.length})
                  </span>
                </div>
                {matches.map((match, idx) => (
                  <div
                    key={idx}
                    className="ml-6 p-2 bg-[var(--surface-2)] rounded text-xs font-mono"
                  >
                    <span className="text-[var(--text-muted)] mr-2">
                      {match.lineNumber}:
                    </span>
                    <span className="text-[var(--text)]">
                      {match.lineContent.substring(0, match.matchStart)}
                      <mark className="bg-yellow-300 dark:bg-yellow-600 px-0.5">
                        {match.lineContent.substring(match.matchStart, match.matchEnd)}
                      </mark>
                      {match.lineContent.substring(match.matchEnd)}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
