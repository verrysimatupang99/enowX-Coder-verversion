import React, { useCallback, useEffect, useRef } from 'react';

interface ResizeHandleProps {
  onResize: (delta: number) => void;
  onResizeStart?: () => void;
  onResizeEnd?: () => void;
  side: 'left' | 'right';
  className?: string;
}

export const ResizeHandle: React.FC<ResizeHandleProps> = ({
  onResize,
  onResizeStart,
  onResizeEnd,
  side,
  className = '',
}) => {
  const isDragging = useRef(false);
  const lastPos = useRef(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    isDragging.current = true;
    lastPos.current = e.clientX;
    
    if (onResizeStart) onResizeStart();
    
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
  }, [onResizeStart]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;

      const delta = e.clientX - lastPos.current;
      lastPos.current = e.clientX;
      
      // Only call onResize if delta is significant (reduce jitter)
      if (Math.abs(delta) > 0) {
        onResize(delta);
      }
    };

    const handleMouseUp = () => {
      if (!isDragging.current) return;
      
      isDragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      
      if (onResizeEnd) onResizeEnd();
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [onResize, onResizeEnd]);

  return (
    <div
      className={`resize-handle ${className}`}
      onMouseDown={handleMouseDown}
      style={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        [side === 'left' ? 'right' : 'left']: -2,
        width: '8px',
        cursor: 'ew-resize',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Visible indicator on hover */}
      <div
        style={{
          width: '2px',
          height: '100%',
          backgroundColor: 'var(--border)',
          opacity: 0,
          transition: 'opacity 0.2s, background-color 0.2s',
        }}
        className="hover:opacity-100 hover:bg-[var(--accent)]"
      />
    </div>
  );
};
