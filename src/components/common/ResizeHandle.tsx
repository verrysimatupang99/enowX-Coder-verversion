import React from 'react';

interface ResizeHandleProps {
  onMouseDown: (e: React.MouseEvent) => void;
  side: 'left' | 'right';
  isResizing?: boolean;
}

export const ResizeHandle: React.FC<ResizeHandleProps> = ({
  onMouseDown,
  side,
  isResizing = false,
}) => {
  return (
    <div
      onMouseDown={onMouseDown}
      style={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        [side === 'left' ? 'right' : 'left']: -4,
        width: '8px',
        cursor: 'ew-resize',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
      }}
    >
      {/* Visible line */}
      <div
        style={{
          width: '1px',
          height: '100%',
          backgroundColor: isResizing ? 'var(--accent)' : 'var(--border)',
          transition: isResizing ? 'none' : 'background-color 0.2s',
          opacity: isResizing ? 1 : 0,
        }}
        className="hover:opacity-100 hover:bg-[var(--accent)]"
      />
    </div>
  );
};
