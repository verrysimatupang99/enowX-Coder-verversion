import { useState, useEffect, useCallback } from 'react';

interface UseResizableSidebarOptions {
  storageKey: string;
  defaultWidth: number;
  minWidth?: number;
  maxWidth?: number;
  side: 'left' | 'right';
}

export function useResizableSidebar({
  storageKey,
  defaultWidth,
  minWidth = 200,
  maxWidth = 600,
  side,
}: UseResizableSidebarOptions) {
  const [width, setWidth] = useState(() => {
    const stored = localStorage.getItem(storageKey);
    return stored ? parseInt(stored, 10) : defaultWidth;
  });

  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    localStorage.setItem(storageKey, width.toString());
  }, [width, storageKey]);

  const handleResize = useCallback((delta: number) => {
    setWidth(prev => {
      // Left sidebar: drag right (+delta) = increase width
      // Right sidebar: drag left (-delta) = increase width
      const newWidth = side === 'left' ? prev + delta : prev - delta;
      return Math.max(minWidth, Math.min(maxWidth, newWidth));
    });
  }, [side, minWidth, maxWidth]);

  return { width, isResizing, setIsResizing, handleResize };
}
