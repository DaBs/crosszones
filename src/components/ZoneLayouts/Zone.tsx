import React, { useRef } from 'react';
import type { Zone } from '@/types/zoneLayout';
import { SplitBar } from './SplitBar';
import { ResizeHandle } from './types';

const RESIZE_HANDLES: ResizeHandle[] = Object.values(ResizeHandle);

interface ZoneProps {
  zone: Zone;
  hoveredZone: string | null;
  draggedZone: string | null;
  mergeTarget: string | null;
  resizingZone: string | null;
  splitMode: 'horizontal' | 'vertical';
  mousePosition: { x: number; y: number } | null;
  containerRef: React.RefObject<HTMLDivElement>;
  onMouseDown: (e: React.MouseEvent, zoneId: string) => void;
  onMouseEnter: (zoneId: string) => void;
  onMouseLeave: () => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onClick: (e: React.MouseEvent, zoneId: string) => void;
  onZoneRef: (zoneId: string, el: HTMLDivElement | null) => void;
  onResizeStart: (e: React.MouseEvent, zoneId: string, handle: ResizeHandle) => void;
}

export function ZoneComponent({
  zone,
  hoveredZone,
  draggedZone,
  mergeTarget,
  resizingZone,
  splitMode,
  mousePosition,
  containerRef,
  onMouseDown,
  onMouseEnter,
  onMouseLeave,
  onMouseMove,
  onClick,
  onZoneRef,
  onResizeStart,
}: ZoneProps) {
  const zoneRef = useRef<HTMLDivElement | null>(null);

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
      cursor: draggedZone === zone.id ? 'grabbing' : resizingZone === zone.id ? 'grabbing' : 'grab',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: draggedZone === zone.id || resizingZone === zone.id ? 'none' : 'all 0.2s',
      zIndex: draggedZone === zone.id || resizingZone === zone.id ? 1000 : 1,
    };
  };

  const getResizeHandleStyle = (handle: ResizeHandle): React.CSSProperties => {
    const handleSize = 12;
    const handleOffset = -handleSize / 2;
    
    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      width: `${handleSize}px`,
      height: `${handleSize}px`,
      backgroundColor: 'rgba(59, 130, 246, 0.9)',
      border: '2px solid white',
      borderRadius: '50%',
      cursor: getResizeCursor(handle),
      zIndex: 1001,
      pointerEvents: 'auto',
    };

    switch (handle) {
      case ResizeHandle.N:
        return { ...baseStyle, top: `${handleOffset}px`, left: '50%', transform: 'translateX(-50%)' };
      case ResizeHandle.S:
        return { ...baseStyle, bottom: `${handleOffset}px`, left: '50%', transform: 'translateX(-50%)' };
      case ResizeHandle.E:
        return { ...baseStyle, right: `${handleOffset}px`, top: '50%', transform: 'translateY(-50%)' };
      case ResizeHandle.W:
        return { ...baseStyle, left: `${handleOffset}px`, top: '50%', transform: 'translateY(-50%)' };
      case ResizeHandle.NE:
        return { ...baseStyle, top: `${handleOffset}px`, right: `${handleOffset}px` };
      case ResizeHandle.NW:
        return { ...baseStyle, top: `${handleOffset}px`, left: `${handleOffset}px` };
      case ResizeHandle.SE:
        return { ...baseStyle, bottom: `${handleOffset}px`, right: `${handleOffset}px` };
      case ResizeHandle.SW:
        return { ...baseStyle, bottom: `${handleOffset}px`, left: `${handleOffset}px` };
      default:
        return baseStyle;
    }
  };

  const getResizeCursor = (handle: ResizeHandle): string => {
    switch (handle) {
      case ResizeHandle.N:
      case ResizeHandle.S:
        return 'ns-resize';
      case ResizeHandle.E:
      case ResizeHandle.W:
        return 'ew-resize';
      case ResizeHandle.NE:
      case ResizeHandle.SW:
        return 'nesw-resize';
      case ResizeHandle.NW:
      case ResizeHandle.SE:
        return 'nwse-resize';
      default:
        return 'default';
    }
  };

  const showResizeHandles = hoveredZone === zone.id && draggedZone === null && resizingZone === null;

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

      {/* Resize handles */}
      {showResizeHandles &&
        RESIZE_HANDLES.map((handle) => (
          <div
            key={handle}
            style={getResizeHandleStyle(handle)}
            onMouseDown={(e) => {
              e.stopPropagation();
              onResizeStart(e, zone.id, handle);
            }}
          />
        ))}

      {/* Split bar */}
      {splitBar}
    </div>
  );
}

