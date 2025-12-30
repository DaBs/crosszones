import React from 'react';
import type { Zone } from '@/types/zoneLayout';

interface SplitBarProps {
  zone: Zone;
  zoneRect: DOMRect;
  containerRect: DOMRect;
  mousePosition: { x: number; y: number };
  splitMode: 'horizontal' | 'vertical';
}

export function SplitBar({
  zone,
  zoneRect,
  containerRect,
  mousePosition,
  splitMode,
}: SplitBarProps) {
  if (splitMode === 'horizontal') {
    // Vertical bar for horizontal split
    const xPercent = ((mousePosition.x - containerRect.left) / containerRect.width) * 100;
    const zoneXPercent = zone.x;
    const zoneWidthPercent = zone.width;

    if (xPercent < zoneXPercent || xPercent > zoneXPercent + zoneWidthPercent) return null;

    const cursorXInZone = ((mousePosition.x - zoneRect.left) / zoneRect.width) * 100;
    const leftWidth = cursorXInZone;
    const rightWidth = 100 - cursorXInZone;

    return (
      <>
        {/* Split bar */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-blue-500 shadow-lg pointer-events-none z-20"
          style={{
            left: `${cursorXInZone}%`,
            transform: 'translateX(-50%)',
          }}
        />
        {/* Dotted line to left edge */}
        <div
          className="absolute top-1/2 left-0 border-t-2 border-dashed border-blue-400/60 pointer-events-none z-20"
          style={{
            width: `${cursorXInZone}%`,
            transform: 'translateY(-50%)',
          }}
        />
        {/* Dotted line to right edge */}
        <div
          className="absolute top-1/2 right-0 border-t-2 border-dashed border-blue-400/60 pointer-events-none z-20"
          style={{
            width: `${rightWidth}%`,
            transform: 'translateY(-50%)',
          }}
        />
        {/* Measurement labels */}
        <div
          className="absolute top-1/2 left-0 pointer-events-none z-20 text-xs font-semibold text-blue-300 bg-blue-500/20 px-1 rounded"
          style={{
            left: `${cursorXInZone / 2}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          {leftWidth.toFixed(1)}%
        </div>
        <div
          className="absolute top-1/2 right-0 pointer-events-none z-20 text-xs font-semibold text-blue-300 bg-blue-500/20 px-1 rounded"
          style={{
            right: `${rightWidth / 2}%`,
            transform: 'translate(50%, -50%)',
          }}
        >
          {rightWidth.toFixed(1)}%
        </div>
      </>
    );
  } else {
    // Horizontal bar for vertical split
    const yPercent = ((mousePosition.y - containerRect.top) / containerRect.height) * 100;
    const zoneYPercent = zone.y;
    const zoneHeightPercent = zone.height;

    if (yPercent < zoneYPercent || yPercent > zoneYPercent + zoneHeightPercent) return null;

    const cursorYInZone = ((mousePosition.y - zoneRect.top) / zoneRect.height) * 100;
    const topHeight = cursorYInZone;
    const bottomHeight = 100 - cursorYInZone;

    return (
      <>
        {/* Split bar */}
        <div
          className="absolute left-0 right-0 h-1 bg-blue-500 shadow-lg pointer-events-none z-20"
          style={{
            top: `${cursorYInZone}%`,
            transform: 'translateY(-50%)',
          }}
        />
        {/* Dotted line to top edge */}
        <div
          className="absolute left-1/2 top-0 border-l-2 border-dashed border-blue-400/60 pointer-events-none z-20"
          style={{
            height: `${cursorYInZone}%`,
            transform: 'translateX(-50%)',
          }}
        />
        {/* Dotted line to bottom edge */}
        <div
          className="absolute left-1/2 bottom-0 border-l-2 border-dashed border-blue-400/60 pointer-events-none z-20"
          style={{
            height: `${bottomHeight}%`,
            transform: 'translateX(-50%)',
          }}
        />
        {/* Measurement labels */}
        <div
          className="absolute left-1/2 top-0 pointer-events-none z-20 text-xs font-semibold text-blue-300 bg-blue-500/20 px-1 rounded"
          style={{
            top: `${topHeight / 2}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          {topHeight.toFixed(1)}%
        </div>
        <div
          className="absolute left-1/2 bottom-0 pointer-events-none z-20 text-xs font-semibold text-blue-300 bg-blue-500/20 px-1 rounded"
          style={{
            bottom: `${bottomHeight / 2}%`,
            transform: 'translate(-50%, 50%)',
          }}
        >
          {bottomHeight.toFixed(1)}%
        </div>
      </>
    );
  }
}

