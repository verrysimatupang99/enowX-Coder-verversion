import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { DiffEditor } from '@monaco-editor/react';
import { RefreshCw } from 'lucide-react';

interface DiffPanelProps {
  repoPath: string;
}

interface GitDiff {
  path: string;
  diff: string;
  status: string;
}

export function DiffPanel({ repoPath }: DiffPanelProps) {
  const [diffs, setDiffs] = useState<GitDiff[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadDiffs = async () => {
    setLoading(true);
    try {
      // Get git status first
      const status = await invoke<{ files: { path: string; status: string }[] }>('git_status', { repoPath });
      
      // Load diff for each changed file
      const diffPromises = status.files.map(async (file) => {
        try {
          const diff = await invoke<string>('git_diff_file', { 
            repoPath, 
            filePath: file.path 
          });
          return { path: file.path, diff, status: file.status };
        } catch {
          return { path: file.path, diff: '', status: file.status };
        }
      });

      const results = await Promise.all(diffPromises);
      setDiffs(results.filter(d => d.diff));
      
      if (results.length > 0 && !selectedFile) {
        setSelectedFile(results[0].path);
      }
    } catch (err) {
      console.error('Failed to load diffs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDiffs();
  }, [repoPath]);

  const selectedDiff = diffs.find(d => d.path === selectedFile);

  const parseGitDiff = (diff: string): { original: string; modified: string } => {
    const lines = diff.split('\n');
    const original: string[] = [];
    const modified: string[] = [];

    for (const line of lines) {
      if (line.startsWith('---') || line.startsWith('+++') || line.startsWith('@@')) {
        continue;
      }
      
      if (line.startsWith('-')) {
        original.push(line.substring(1));
      } else if (line.startsWith('+')) {
        modified.push(line.substring(1));
      } else {
        original.push(line);
        modified.push(line);
      }
    }

    return {
      original: original.join('\n'),
      modified: modified.join('\n'),
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'A': return 'text-green-500';
      case 'M': return 'text-yellow-500';
      case 'D': return 'text-red-500';
      default: return 'text-[var(--text-muted)]';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'A': return 'Added';
      case 'M': return 'Modified';
      case 'D': return 'Deleted';
      default: return status;
    }
  };

  if (!repoPath) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <GitBranch size={48} className="text-[var(--border)] mb-4" />
        <h3 className="text-sm font-bold mb-2">No Project Selected</h3>
        <p className="text-xs text-[var(--text-muted)]">
          Open a project folder to view git diffs
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <RefreshCw size={24} className="animate-spin text-[var(--accent)]" />
      </div>
    );
  }

  if (diffs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <GitBranch size={48} className="text-[var(--border)] mb-4" />
        <h3 className="text-sm font-bold mb-2">No Changes</h3>
        <p className="text-xs text-[var(--text-muted)]">
          No uncommitted changes in this repository
        </p>
        <button
          onClick={loadDiffs}
          className="mt-4 px-3 py-1.5 text-xs bg-[var(--surface-2)] hover:bg-[var(--surface-3)] rounded-lg transition-colors flex items-center gap-2"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>
    );
  }

  const { original, modified } = selectedDiff ? parseGitDiff(selectedDiff.diff) : { original: '', modified: '' };

  return (
    <div className="flex flex-col h-full">
      {/* File List */}
      <div className="border-b border-[var(--border)] p-2 flex items-center gap-2 overflow-x-auto">
        {diffs.map((diff) => (
          <button
            key={diff.path}
            onClick={() => setSelectedFile(diff.path)}
            className={`
              px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-2
              ${selectedFile === diff.path 
                ? 'bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/30' 
                : 'bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-3)]'
              }
            `}
          >
            <span className={getStatusColor(diff.status)}>{getStatusLabel(diff.status)}</span>
            <span>{diff.path.split('/').pop()}</span>
          </button>
        ))}
        <button
          onClick={loadDiffs}
          className="ml-auto p-1.5 rounded-lg hover:bg-[var(--surface-2)] transition-colors"
          title="Refresh"
        >
          <RefreshCw size={14} className="text-[var(--text-muted)]" />
        </button>
      </div>

      {/* Diff Viewer */}
      <div className="flex-1 overflow-hidden">
        {selectedDiff && (
          <DiffEditor
            original={original}
            modified={modified}
            language={selectedDiff.path.split('.').pop() || 'plaintext'}
            theme="vs-dark"
            options={{
              readOnly: true,
              renderSideBySide: true,
              minimap: { enabled: false },
              fontSize: 13,
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
            }}
          />
        )}
      </div>
    </div>
  );
}

function GitBranch({ size, className }: { size: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M6 3v12M18 9a3 3 0 100-6 3 3 0 000 6zM6 21a3 3 0 100-6 3 3 0 000 6zM18 21a3 3 0 100-6 3 3 0 000 6zM18 9l-12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
