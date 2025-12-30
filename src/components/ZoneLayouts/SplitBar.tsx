import React from 'react';
import type { Zone } from '@/types/zoneLayout';

interface SplitBarProps {
  zone: Zone;
  zoneRect: DOMRect;
  containerRect: DOMRect;
  mousePosition: { x: number; y: number };
  splitMode: 'horizontal' | 'vertical';
}

interface SplitConfig {
  position: number;
  firstSize: number;
  secondSize: number;
  firstSizePx: number;
  secondSizePx: number;
  splitBarClass: string;
  splitBarStyle: React.CSSProperties;
  guideLineClass: string;
  firstGuideStyle: React.CSSProperties;
  secondGuideStyle: React.CSSProperties;
  firstLabelStyle: React.CSSProperties;
  secondLabelStyle: React.CSSProperties;
}

function SplitBarVisuals({ config }: { config: SplitConfig }) {
  return (
    <>
      {/* Split bar */}
      <div className={config.splitBarClass} style={config.splitBarStyle} />
      {/* Dotted line to first edge */}
      <div className={config.guideLineClass} style={config.firstGuideStyle} />
      {/* Dotted line to second edge */}
      <div className={config.guideLineClass} style={config.secondGuideStyle} />
      {/* Measurement labels */}
      <div
        className="absolute pointer-events-none z-20 text-xs font-semibold text-white-300 bg-white-500/20 px-1 rounded"
        style={config.firstLabelStyle}
      >
        {Math.round(config.firstSizePx)}px ({config.firstSize.toFixed(1)}%)
      </div>
      <div
        className="absolute pointer-events-none z-20 text-xs font-semibold text-white-300 bg-white-500/20 px-1 rounded"
        style={config.secondLabelStyle}
      >
        {Math.round(config.secondSizePx)}px ({config.secondSize.toFixed(1)}%)
      </div>
    </>
  );
}

export function SplitBar({
  zone,
  zoneRect,
  containerRect,
  mousePosition,
  splitMode,
}: SplitBarProps) {
  const isHorizontal = splitMode === 'horizontal';

  // Calculate position and validate bounds
  const containerPos = isHorizontal
    ? ((mousePosition.x - containerRect.left) / containerRect.width) * 100
    : ((mousePosition.y - containerRect.top) / containerRect.height) * 100;

  const zoneStart = isHorizontal ? zone.x : zone.y;
  const zoneSize = isHorizontal ? zone.width : zone.height;

  if (containerPos < zoneStart || containerPos > zoneStart + zoneSize) return null;

  // Calculate cursor position within zone
  const cursorInZone = isHorizontal
    ? ((mousePosition.x - zoneRect.left) / zoneRect.width) * 100
    : ((mousePosition.y - zoneRect.top) / zoneRect.height) * 100;

  const firstSize = cursorInZone;
  const secondSize = 100 - cursorInZone;

  // Calculate pixel sizes
  const firstSizePx = isHorizontal
    ? (firstSize / 100) * zoneRect.width
    : (firstSize / 100) * zoneRect.height;
  const secondSizePx = isHorizontal
    ? (secondSize / 100) * zoneRect.width
    : (secondSize / 100) * zoneRect.height;

  // Configure styles based on split mode
  const config: SplitConfig = isHorizontal
    ? {
        position: cursorInZone,
        firstSize,
        secondSize,
        firstSizePx,
        secondSizePx,
        splitBarClass: 'absolute top-0 bottom-0 w-1 bg-blue-500 shadow-lg pointer-events-none z-20',
        splitBarStyle: {
          left: `${cursorInZone}%`,
          transform: 'translateX(-50%)',
        },
        guideLineClass: 'absolute top-1/2 border-t-2 border-dashed border-blue-400/60 pointer-events-none z-20',
        firstGuideStyle: {
          left: 0,
          width: `${cursorInZone}%`,
          transform: 'translateY(-50%)',
        },
        secondGuideStyle: {
          right: 0,
          width: `${secondSize}%`,
          transform: 'translateY(-50%)',
        },
        firstLabelStyle: {
          top: '50%',
          left: `${cursorInZone / 2}%`,
          transform: 'translate(-50%, -50%)',
        },
        secondLabelStyle: {
          top: '50%',
          right: `${secondSize / 2}%`,
          transform: 'translate(50%, -50%)',
        },
      }
    : {
        position: cursorInZone,
        firstSize,
        secondSize,
        firstSizePx,
        secondSizePx,
        splitBarClass: 'absolute left-0 right-0 h-1 bg-blue-500 shadow-lg pointer-events-none z-20',
        splitBarStyle: {
          top: `${cursorInZone}%`,
          transform: 'translateY(-50%)',
        },
        guideLineClass: 'absolute left-1/2 border-l-2 border-dashed border-blue-400/60 pointer-events-none z-20',
        firstGuideStyle: {
          top: 0,
          height: `${cursorInZone}%`,
          transform: 'translateX(-50%)',
        },
        secondGuideStyle: {
          bottom: 0,
          height: `${secondSize}%`,
          transform: 'translateX(-50%)',
        },
        firstLabelStyle: {
          left: '50%',
          top: `${cursorInZone / 2}%`,
          transform: 'translate(-50%, -50%)',
        },
        secondLabelStyle: {
          left: '50%',
          bottom: `${secondSize / 2}%`,
          transform: 'translate(-50%, 50%)',
        },
      };

  return <SplitBarVisuals config={config} />;
}

