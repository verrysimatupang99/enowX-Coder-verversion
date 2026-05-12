import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { GitBranch, GitCommit, GitFork, RefreshCw } from 'lucide-react';

interface GitStatus {
  branch: string;
  files: GitFileStatus[];
}

interface GitFileStatus {
  path: string;
  status: string;
}

interface GitBranchInfo {
  name: string;
  isCurrent: boolean;
}

interface GitPanelProps {
  repoPath: string;
}

export function GitPanel({ repoPath }: GitPanelProps) {
  const [status, setStatus] = useState<GitStatus | null>(null);
  const [branches, setBranches] = useState<GitBranchInfo[]>([]);
  const [commitMessage, setCommitMessage] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const loadStatus = async () => {
    try {
      const result = await invoke<GitStatus>('git_status', { repoPath });
      setStatus(result);
      setSelectedFiles(new Set(result.files.map((f) => f.path)));
    } catch (err) {
      console.error('Failed to load git status:', err);
    }
  };

  const loadBranches = async () => {
    try {
      const result = await invoke<GitBranchInfo[]>('git_list_branches', { repoPath });
      setBranches(result);
    } catch (err) {
      console.error('Failed to load branches:', err);
    }
  };

  const handleCommit = async () => {
    if (!commitMessage.trim() || selectedFiles.size === 0) return;
    setLoading(true);
    try {
      await invoke('git_commit', {
        repoPath,
        message: commitMessage,
        files: Array.from(selectedFiles),
      });
      setCommitMessage('');
      await loadStatus();
    } catch (err) {
      console.error('Commit failed:', err);
      alert(`Commit failed: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async (branchName: string) => {
    setLoading(true);
    try {
      await invoke('git_checkout_branch', { repoPath, branchName });
      await loadStatus();
      await loadBranches();
    } catch (err) {
      console.error('Checkout failed:', err);
      alert(`Checkout failed: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleFile = (path: string) => {
    setSelectedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  useEffect(() => {
    loadStatus();
    loadBranches();
  }, [repoPath]);

  const statusColor = (status: string) => {
    switch (status) {
      case 'modified':
        return 'text-yellow-500';
      case 'added':
        return 'text-green-500';
      case 'deleted':
        return 'text-red-500';
      case 'untracked':
        return 'text-blue-500';
      default:
        return 'text-[var(--text-muted)]';
    }
  };

  return (
    <div className="flex h-full flex-col bg-zinc-900 text-sm text-zinc-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-3 py-2">
        <div className="flex items-center gap-2">
          <GitBranch className="h-4 w-4" />
          <span className="font-semibold">{status?.branch || 'Loading...'}</span>
        </div>
        <button
          onClick={() => {
            loadStatus();
            loadBranches();
          }}
          className="rounded p-1 hover:bg-zinc-800"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Branch Switcher */}
      <div className="border-b border-zinc-800 p-3">
        <div className="mb-1 text-xs font-semibold text-zinc-400">BRANCHES</div>
        <div className="space-y-1">
          {branches.map((branch) => (
            <button
              key={branch.name}
              onClick={() => !branch.isCurrent && handleCheckout(branch.name)}
              disabled={branch.isCurrent || loading}
              className={`flex w-full items-center gap-2 rounded px-2 py-1 text-left ${
                branch.isCurrent
                  ? 'bg-blue-600 text-white'
                  : 'hover:bg-zinc-800 disabled:opacity-50'
              }`}
            >
              <GitFork className="h-3 w-3" />
              <span className="truncate">{branch.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Changed Files */}
      <div className="flex-1 overflow-y-auto border-b border-zinc-800 p-3">
        <div className="mb-1 text-xs font-semibold text-zinc-400">
          CHANGES ({status?.files.length || 0})
        </div>
        {status?.files.length === 0 ? (
          <div className="py-4 text-center text-xs text-zinc-500">No changes</div>
        ) : (
          <div className="space-y-1">
            {status?.files.map((file) => (
              <label
                key={file.path}
                className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-zinc-800"
              >
                <input
                  type="checkbox"
                  checked={selectedFiles.has(file.path)}
                  onChange={() => toggleFile(file.path)}
                  className="h-3 w-3"
                />
                <span className={`text-xs ${statusColor(file.status)}`}>
                  {file.status[0].toUpperCase()}
                </span>
                <span className="flex-1 truncate text-xs">{file.path}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Commit Section */}
      <div className="p-3">
        <textarea
          value={commitMessage}
          onChange={(e) => setCommitMessage(e.target.value)}
          placeholder="Commit message..."
          className="mb-2 w-full resize-none rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-zinc-200 placeholder-zinc-500 focus:border-blue-500 focus:outline-none"
          rows={3}
        />
        <button
          onClick={handleCommit}
          disabled={!commitMessage.trim() || selectedFiles.size === 0 || loading}
          className="flex w-full items-center justify-center gap-2 rounded bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <GitCommit className="h-3 w-3" />
          Commit ({selectedFiles.size})
        </button>
      </div>
    </div>
  );
}
