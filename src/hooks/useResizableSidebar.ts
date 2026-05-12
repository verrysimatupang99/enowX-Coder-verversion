import { useState, useEffect } from 'react';

interface UseResizableSidebarOptions {
  storageKey: string;
  defaultWidth: number;
  minWidth?: number;
  maxWidth?: number;
}

export function useResizableSidebar({
  storageKey,
  defaultWidth,
  minWidth = 200,
  maxWidth = 600,
}: UseResizableSidebarOptions) {
  const [width, setWidth] = useState(() => {
    const stored = localStorage.getItem(storageKey);
    return stored ? parseInt(stored, 10) : defaultWidth;
  });

  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    localStorage.setItem(storageKey, width.toString());
  }, [width, storageKey]);

  const startResize = (e: React.MouseEvent, side: 'left' | 'right') => {
    e.preventDefault();
    setIsResizing(true);

    const startX = e.clientX;
    const startWidth = width;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = side === 'left' 
        ? moveEvent.clientX - startX  // drag right = positive = increase
        : startX - moveEvent.clientX; // drag left = positive = increase (inverted)

      const newWidth = Math.max(minWidth, Math.min(maxWidth, startWidth + delta));
      setWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return { width, isResizing, startResize };
}
