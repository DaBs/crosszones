import React from 'react';

interface ContextMenuProps {
  position: { x: number; y: number } | null;
  onClose: () => void;
  onCloseEditor: () => void;
}

export function ContextMenu({ position, onClose, onCloseEditor }: ContextMenuProps) {
  if (!position) return null;

  return (
    <div
      className="fixed bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg py-1 z-[2000] min-w-[150px]"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        onClick={onCloseEditor}
      >
        Close Editor
      </button>
    </div>
  );
}

