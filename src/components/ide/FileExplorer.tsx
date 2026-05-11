import React, { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { 
  File, 
  Folder, 
  FolderOpen, 
  ChevronRight, 
  ChevronDown,
  FileCode,
  FileText,
  FileImage,
  FileJson,
  FileArchive,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileNode[];
}

interface FileExplorerProps {
  projectPath: string | null;
  onFileSelect?: (path: string) => void;
}

const getFileIcon = (name: string) => {
  const ext = name.split('.').pop()?.toLowerCase();
  
  if (ext === 'json') return FileJson;
  if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext ?? '')) return FileImage;
  if (['zip', 'tar', 'gz', 'rar'].includes(ext ?? '')) return FileArchive;
  if (['ts', 'tsx', 'js', 'jsx', 'rs', 'py', 'go', 'java', 'c', 'cpp', 'h'].includes(ext ?? '')) return FileCode;
  if (['md', 'txt', 'log'].includes(ext ?? '')) return FileText;
  
  return File;
};

const FileTreeNode: React.FC<{
  node: FileNode;
  depth: number;
  onFileSelect?: (path: string) => void;
  expandedPaths: Set<string>;
  onToggleExpand: (path: string) => void;
}> = ({ node, depth, onFileSelect, expandedPaths, onToggleExpand }) => {
  const isExpanded = expandedPaths.has(node.path);
  const Icon = node.isDirectory 
    ? (isExpanded ? FolderOpen : Folder)
    : getFileIcon(node.name);

  const handleClick = () => {
    if (node.isDirectory) {
      onToggleExpand(node.path);
    } else {
      onFileSelect?.(node.path);
    }
  };

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-1 px-2 py-1 cursor-pointer hover:bg-[var(--hover)] rounded text-sm',
          'transition-colors duration-100'
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={handleClick}
      >
        {node.isDirectory && (
          <span className="flex-shrink-0">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-[var(--text-secondary)]" />
            ) : (
              <ChevronRight className="w-4 h-4 text-[var(--text-secondary)]" />
            )}
          </span>
        )}
        {!node.isDirectory && <span className="w-4" />}
        <Icon className="w-4 h-4 text-[var(--text-secondary)] flex-shrink-0" />
        <span className="truncate text-[var(--text)]">{node.name}</span>
      </div>
      {node.isDirectory && isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <FileTreeNode
              key={child.path}
              node={child}
              depth={depth + 1}
              onFileSelect={onFileSelect}
              expandedPaths={expandedPaths}
              onToggleExpand={onToggleExpand}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const FileExplorer: React.FC<FileExplorerProps> = ({ projectPath, onFileSelect }) => {
  const [tree, setTree] = useState<FileNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!projectPath) {
      setTree([]);
      return;
    }

    setLoading(true);
    setError(null);

    invoke<FileNode[]>('list_files', { path: projectPath })
      .then((nodes) => {
        setTree(nodes);
        // Auto-expand root
        if (nodes.length > 0 && nodes[0].isDirectory) {
          setExpandedPaths(new Set([nodes[0].path]));
        }
      })
      .catch((err) => {
        console.error('Failed to load file tree:', err);
        setError(String(err));
      })
      .finally(() => setLoading(false));
  }, [projectPath]);

  const handleToggleExpand = (path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  if (!projectPath) {
    return (
      <div className="flex items-center justify-center h-full text-[var(--text-secondary)] text-sm">
        No project selected
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-[var(--text-secondary)] text-sm">
        Loading files...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-red-500 text-sm p-4 text-center">
        {error}
      </div>
    );
  }

  if (tree.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-[var(--text-secondary)] text-sm">
        Empty directory
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto py-2">
      {tree.map((node) => (
        <FileTreeNode
          key={node.path}
          node={node}
          depth={0}
          onFileSelect={onFileSelect}
          expandedPaths={expandedPaths}
          onToggleExpand={handleToggleExpand}
        />
      ))}
    </div>
  );
};
