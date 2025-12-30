import React, { useRef } from 'react';
import type { Zone } from '@/types/zoneLayout';
import { SplitBar } from './SplitBar';

interface ZoneProps {
  zone: Zone;
  hoveredZone: string | null;
  draggedZone: string | null;
  mergeTarget: string | null;
  splitMode: 'horizontal' | 'vertical';
  mousePosition: { x: number; y: number } | null;
  containerRef: React.RefObject<HTMLDivElement>;
  onMouseDown: (e: React.MouseEvent, zoneId: string) => void;
  onMouseEnter: (zoneId: string) => void;
  onMouseLeave: () => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onClick: (e: React.MouseEvent, zoneId: string) => void;
  onZoneRef: (zoneId: string, el: HTMLDivElement | null) => void;
}

export function ZoneComponent({
  zone,
  hoveredZone,
  draggedZone,
  mergeTarget,
  splitMode,
  mousePosition,
  containerRef,
  onMouseDown,
  onMouseEnter,
  onMouseLeave,
  onMouseMove,
  onClick,
  onZoneRef,
}: ZoneProps) {
  const zoneRef = useRef<HTMLDivElement>(null);

  const getZoneStyle = (): React.CSSProperties => {
    return {
      position: 'absolute',
      left: `${zone.x}%`,
      top: `${zone.y}%`,
      width: `${zone.width}%`,
      height: `${zone.height}%`,
      border: hoveredZone === zone.id || mergeTarget === zone.id
        ? '3px solid rgba(59, 130, 246, 1)'
        : '2px solid rgba(59, 130, 246, 0.6)',
      borderRadius: '8px',
      backgroundColor: hoveredZone === zone.id || mergeTarget === zone.id
        ? 'rgba(59, 130, 246, 0.2)'
        : 'rgba(59, 130, 246, 0.1)',
      cursor: draggedZone === zone.id ? 'grabbing' : 'grab',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: draggedZone === zone.id ? 'none' : 'all 0.2s',
      zIndex: draggedZone === zone.id ? 1000 : 1,
    };
  };

  const shouldShowSplitBar =
    hoveredZone === zone.id &&
    draggedZone === null &&
    mousePosition &&
    containerRef.current &&
    zoneRef.current;

  let splitBar = null;
  if (shouldShowSplitBar) {
    const container = containerRef.current!;
    const containerRect = container.getBoundingClientRect();
    const zoneRect = zoneRef.current!.getBoundingClientRect();

    // Check if mouse is inside zone
    const isInsideZone =
      mousePosition.x >= zoneRect.left &&
      mousePosition.x <= zoneRect.right &&
      mousePosition.y >= zoneRect.top &&
      mousePosition.y <= zoneRect.bottom;

    if (isInsideZone) {
      splitBar = (
        <SplitBar
          zone={zone}
          zoneRect={zoneRect}
          containerRect={containerRect}
          mousePosition={mousePosition}
          splitMode={splitMode}
        />
      );
    }
  }

  return (
    <div
      ref={(el) => {
        zoneRef.current = el;
        onZoneRef(zone.id, el);
      }}
      style={getZoneStyle()}
      onMouseDown={(e) => onMouseDown(e, zone.id)}
      onMouseEnter={() => onMouseEnter(zone.id)}
      onMouseLeave={onMouseLeave}
      onMouseMove={onMouseMove}
      onClick={(e) => onClick(e, zone.id)}
    >
      {/* Zone info displayed prominently in center */}
      <div className="flex flex-col items-center justify-center text-center pointer-events-none">
        <div className="text-6xl font-bold text-white drop-shadow-lg">
          {zone.number.toString().slice(0, 8)}
        </div>
        <div className="text-2xl font-semibold text-white mt-2">
          {zone.width.toFixed(1)}% × {zone.height.toFixed(1)}%
        </div>
      </div>

      {/* Split bar */}
      {splitBar}
    </div>
  );
}

