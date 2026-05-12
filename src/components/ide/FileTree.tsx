import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import {
  Folder,
  FolderOpen,
  File,
  FileText,
  FileCode,
  FileImage,
  FileVideo,
  FileArchive,
  CaretRight,
  CaretDown,
} from '@phosphor-icons/react';

interface DirEntry {
  name: string;
  path: string;
  is_dir: boolean;
  children?: DirEntry[];
  git_status?: string;
}

interface DirTree {
  root: DirEntry;
}

interface FileTreeProps {
  projectPath: string;
  onFileSelect?: (path: string) => void;
}

const getFileIcon = (name: string) => {
  const ext = name.split('.').pop()?.toLowerCase();
  
  switch (ext) {
    case 'ts':
    case 'tsx':
    case 'js':
    case 'jsx':
    case 'py':
    case 'rs':
    case 'go':
    case 'java':
    case 'c':
    case 'cpp':
    case 'h':
      return <FileCode size={14} />;
    case 'md':
    case 'txt':
    case 'json':
    case 'yaml':
    case 'yml':
    case 'toml':
      return <FileText size={14} />;
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'svg':
    case 'webp':
      return <FileImage size={14} />;
    case 'mp4':
    case 'webm':
    case 'mov':
      return <FileVideo size={14} />;
    case 'zip':
    case 'tar':
    case 'gz':
    case 'rar':
      return <FileArchive size={14} />;
    default:
      return <File size={14} />;
  }
};

const getGitStatusColor = (status?: string) => {
  switch (status) {
    case 'M':
      return 'text-yellow-500';
    case 'A':
      return 'text-green-500';
    case 'D':
      return 'text-red-500';
    case '??':
      return 'text-blue-400';
    default:
      return '';
  }
};

const TreeNode: React.FC<{
  entry: DirEntry;
  level: number;
  onFileSelect?: (path: string) => void;
}> = ({ entry, level, onFileSelect }) => {
  const [isOpen, setIsOpen] = useState(level === 0);

  const handleClick = () => {
    if (entry.is_dir) {
      setIsOpen(!isOpen);
    } else {
      onFileSelect?.(entry.path);
    }
  };

  return (
    <div>
      <div
        onClick={handleClick}
        className="flex items-center gap-1.5 px-2 py-1 hover:bg-[var(--hover-bg)] cursor-pointer text-xs group"
        style={{ paddingLeft: `${level * 12 + 8}px` }}
      >
        {entry.is_dir ? (
          <>
            {isOpen ? (
              <CaretDown size={12} className="text-[var(--text-muted)] shrink-0" />
            ) : (
              <CaretRight size={12} className="text-[var(--text-muted)] shrink-0" />
            )}
            {isOpen ? (
              <FolderOpen size={14} className="text-[var(--accent)] shrink-0" />
            ) : (
              <Folder size={14} className="text-[var(--accent)] shrink-0" />
            )}
          </>
        ) : (
          <>
            <span className="w-3 shrink-0" />
            <span className="text-[var(--text-muted)] shrink-0">{getFileIcon(entry.name)}</span>
          </>
        )}
        <span className="text-[var(--text)] truncate flex-1">{entry.name}</span>
        {entry.git_status && (
          <span className={`text-xs font-mono shrink-0 ${getGitStatusColor(entry.git_status)}`}>
            {entry.git_status}
          </span>
        )}
      </div>
      {entry.is_dir && isOpen && entry.children && (
        <div>
          {entry.children.map((child, idx) => (
            <TreeNode key={`${child.path}-${idx}`} entry={child} level={level + 1} onFileSelect={onFileSelect} />
          ))}
        </div>
      )}
    </div>
  );
};

export const FileTree: React.FC<FileTreeProps> = ({ projectPath, onFileSelect }) => {
  const [tree, setTree] = useState<DirTree | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTree();
  }, [projectPath]);

  const loadTree = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await invoke<DirTree>('read_directory_tree', {
        path: projectPath,
        maxDepth: 5,
      });
      setTree(data);
    } catch (err) {
      console.error('Failed to load directory tree:', err);
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-xs text-[var(--text-muted)]">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="text-xs text-red-400">Failed to load tree: {error}</div>
      </div>
    );
  }

  if (!tree) {
    return (
      <div className="p-4">
        <div className="text-xs text-[var(--text-muted)]">No project selected</div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <TreeNode entry={tree.root} level={0} onFileSelect={onFileSelect} />
    </div>
  );
};
