import React, { useCallback, useEffect, useRef } from 'react';

interface ResizeHandleProps {
  onResize: (delta: number) => void;
  direction: 'horizontal' | 'vertical';
  className?: string;
}

export const ResizeHandle: React.FC<ResizeHandleProps> = ({
  onResize,
  direction,
  className = '',
}) => {
  const isDragging = useRef(false);
  const startPos = useRef(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    startPos.current = direction === 'horizontal' ? e.clientX : e.clientY;
    e.preventDefault();
  }, [direction]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;

      const currentPos = direction === 'horizontal' ? e.clientX : e.clientY;
      const delta = currentPos - startPos.current;
      startPos.current = currentPos;
      onResize(delta);
    };

    const handleMouseUp = () => {
      isDragging.current = false;
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [direction, onResize]);

  return (
    <div
      className={`resize-handle ${direction} ${className}`}
      onMouseDown={handleMouseDown}
      style={{
        cursor: direction === 'horizontal' ? 'col-resize' : 'row-resize',
        width: direction === 'horizontal' ? '4px' : '100%',
        height: direction === 'vertical' ? '4px' : '100%',
        backgroundColor: 'transparent',
        position: 'relative',
        zIndex: 10,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'var(--border)',
          opacity: 0,
          transition: 'opacity 0.2s',
        }}
        className="hover:opacity-100"
      />
    </div>
  );
};
