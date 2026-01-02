import React, { useRef, useMemo } from 'react';
import type { Zone } from '@/types/zoneLayout';
import { SplitBar } from './SplitBar';
import { ResizeHandle } from './types';
import { cn } from '@/lib/utils';

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
  zIndex?: number;
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
  zIndex = 1,
}: ZoneProps) {
  const zoneRef = useRef<HTMLDivElement | null>(null);

  const isHoveredOrMerged = hoveredZone === zone.id || mergeTarget === zone.id;
  const isDraggedOrResizing = draggedZone === zone.id || resizingZone === zone.id;

  // Calculate size label in pixels
  const sizeLabel = useMemo(() => {
    if (!containerRef.current) {
      return `${zone.width.toFixed(1)}% × ${zone.height.toFixed(1)}%`;
    }
    const containerRect = containerRef.current.getBoundingClientRect();
    const widthPx = Math.round((zone.width / 100) * containerRect.width);
    const heightPx = Math.round((zone.height / 100) * containerRect.height);
    return `${widthPx}px (${zone.width.toFixed(1)}%) × ${heightPx}px (${zone.height.toFixed(1)}%)`;
  }, [zone.width, zone.height, containerRef]);

  const getZoneStyle = (): React.CSSProperties => {
    // Use provided z-index, but override with 100 if dragged or resizing
    const finalZIndex = isDraggedOrResizing ? 100 : zIndex;
    
    return {
      left: `${zone.x}%`,
      top: `${zone.y}%`,
      width: `${zone.width}%`,
      height: `${zone.height}%`,
      zIndex: finalZIndex,
    };
  };

  const getResizeHandleStyle = (handle: ResizeHandle): React.CSSProperties => {
    const handleOffset = -6; // -12px / 2
    
    switch (handle) {
      case ResizeHandle.N:
        return { top: `${handleOffset}px`, left: '50%', transform: 'translateX(-50%)' };
      case ResizeHandle.S:
        return { bottom: `${handleOffset}px`, left: '50%', transform: 'translateX(-50%)' };
      case ResizeHandle.E:
        return { right: `${handleOffset}px`, top: '50%', transform: 'translateY(-50%)' };
      case ResizeHandle.W:
        return { left: `${handleOffset}px`, top: '50%', transform: 'translateY(-50%)' };
      case ResizeHandle.NE:
        return { top: `${handleOffset}px`, right: `${handleOffset}px` };
      case ResizeHandle.NW:
        return { top: `${handleOffset}px`, left: `${handleOffset}px` };
      case ResizeHandle.SE:
        return { bottom: `${handleOffset}px`, right: `${handleOffset}px` };
      case ResizeHandle.SW:
        return { bottom: `${handleOffset}px`, left: `${handleOffset}px` };
      default:
        return {};
    }
  };

  const getResizeHandleCursor = (handle: ResizeHandle): string => {
    switch (handle) {
      case ResizeHandle.N:
      case ResizeHandle.S:
        return 'cursor-ns-resize';
      case ResizeHandle.E:
      case ResizeHandle.W:
        return 'cursor-ew-resize';
      case ResizeHandle.NE:
      case ResizeHandle.SW:
        return 'cursor-nesw-resize';
      case ResizeHandle.NW:
      case ResizeHandle.SE:
        return 'cursor-nwse-resize';
      default:
        return 'cursor-default';
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
      className={cn(
        'absolute rounded-lg flex items-center justify-center',
        isHoveredOrMerged
          ? 'border-[3px] border-blue-500 bg-blue-500/60'
          : 'border-2 border-blue-500/60 bg-blue-500/40',
        isDraggedOrResizing ? 'cursor-grabbing' : 'cursor-grab transition-all duration-200'
      )}
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
          {sizeLabel}
        </div>
      </div>

      {/* Resize handles */}
      {showResizeHandles &&
        RESIZE_HANDLES.map((handle) => (
          <div
            key={handle}
            className={cn(
              'absolute w-3 h-3 bg-blue-500/90 border-2 border-white rounded-full z-[1001] pointer-events-auto',
              getResizeHandleCursor(handle)
            )}
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

