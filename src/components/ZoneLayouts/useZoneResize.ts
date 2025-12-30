import { useState, useCallback, useEffect } from 'react';
import type { Zone } from '@/types/zoneLayout';
import { ResizeHandle } from './types';
import { snapZoneEdges, preventOverlaps } from './useZoneSnap';

interface UseZoneResizeProps {
  zones: Zone[];
  setZones: React.Dispatch<React.SetStateAction<Zone[]>>;
  containerRef: React.RefObject<HTMLDivElement>;
  zonesStateRef: React.MutableRefObject<Zone[]>;
}

export function useZoneResize({
  zones,
  setZones,
  containerRef,
  zonesStateRef,
}: UseZoneResizeProps) {
  const [resizingZone, setResizingZone] = useState<string | null>(null);
  const [resizeHandle, setResizeHandle] = useState<ResizeHandle | null>(null);
  const [resizeStart, setResizeStart] = useState<{
    x: number;
    y: number;
    zone: Zone;
  } | null>(null);

  const handleResizeStart = useCallback((
    e: React.MouseEvent,
    zoneId: string,
    handle: ResizeHandle
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const zone = zones.find((z) => z.id === zoneId);
    if (!zone || !containerRef.current) return;

    setResizingZone(zoneId);
    setResizeHandle(handle);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      zone: { ...zone },
    });
  }, [zones, containerRef]);

  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!resizingZone || !resizeHandle || !resizeStart || !containerRef.current) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const deltaX = e.clientX - resizeStart.x;
    const deltaY = e.clientY - resizeStart.y;

    // Convert pixel delta to percentage
    const deltaXPercent = (deltaX / rect.width) * 100;
    const deltaYPercent = (deltaY / rect.height) * 100;

    setZones((prevZones) => {
      return prevZones.map((zone) => {
        if (zone.id !== resizingZone) return zone;

        const original = resizeStart.zone;
        let newX = original.x;
        let newY = original.y;
        let newWidth = original.width;
        let newHeight = original.height;

        // Handle resize based on handle type
        switch (resizeHandle) {
          case ResizeHandle.N: // North (top)
            newY = Math.max(0, original.y + deltaYPercent);
            newHeight = original.height - (newY - original.y);
            break;
          case ResizeHandle.S: // South (bottom)
            newHeight = Math.max(5, original.height + deltaYPercent); // Min 5% height
            if (newY + newHeight > 100) {
              newHeight = 100 - newY;
            }
            break;
          case ResizeHandle.E: // East (right)
            newWidth = Math.max(5, original.width + deltaXPercent); // Min 5% width
            if (newX + newWidth > 100) {
              newWidth = 100 - newX;
            }
            break;
          case ResizeHandle.W: // West (left)
            newX = Math.max(0, original.x + deltaXPercent);
            newWidth = original.width - (newX - original.x);
            break;
          case ResizeHandle.NE: // Northeast (top-right)
            newY = Math.max(0, original.y + deltaYPercent);
            newHeight = original.height - (newY - original.y);
            newWidth = Math.max(5, original.width + deltaXPercent);
            if (newX + newWidth > 100) {
              newWidth = 100 - newX;
            }
            break;
          case ResizeHandle.NW: // Northwest (top-left)
            newX = Math.max(0, original.x + deltaXPercent);
            newWidth = original.width - (newX - original.x);
            newY = Math.max(0, original.y + deltaYPercent);
            newHeight = original.height - (newY - original.y);
            break;
          case ResizeHandle.SE: // Southeast (bottom-right)
            newHeight = Math.max(5, original.height + deltaYPercent);
            if (newY + newHeight > 100) {
              newHeight = 100 - newY;
            }
            newWidth = Math.max(5, original.width + deltaXPercent);
            if (newX + newWidth > 100) {
              newWidth = 100 - newX;
            }
            break;
          case ResizeHandle.SW: // Southwest (bottom-left)
            newX = Math.max(0, original.x + deltaXPercent);
            newWidth = original.width - (newX - original.x);
            newHeight = Math.max(5, original.height + deltaYPercent);
            if (newY + newHeight > 100) {
              newHeight = 100 - newY;
            }
            break;
        }

        // Ensure minimum size
        if (newWidth < 5) {
          newWidth = 5;
          if (resizeHandle && (resizeHandle === ResizeHandle.W || resizeHandle === ResizeHandle.NW || resizeHandle === ResizeHandle.SW)) {
            newX = original.x + original.width - 5;
          }
        }
        if (newHeight < 5) {
          newHeight = 5;
          if (resizeHandle && (resizeHandle === ResizeHandle.N || resizeHandle === ResizeHandle.NW || resizeHandle === ResizeHandle.NE)) {
            newY = original.y + original.height - 5;
          }
        }

        // Create updated zone
        let updatedZone = {
          ...zone,
          x: newX,
          y: newY,
          width: newWidth,
          height: newHeight,
        };

        // Snap to other zones' boundaries
        updatedZone = snapZoneEdges(updatedZone, prevZones, resizingZone);

        // Prevent overlaps
        updatedZone = preventOverlaps(updatedZone, prevZones, resizingZone);

        return updatedZone;
      });
    });
  }, [resizingZone, resizeHandle, resizeStart, containerRef, setZones]);

  const handleResizeEnd = useCallback(() => {
    setResizingZone(null);
    setResizeHandle(null);
    setResizeStart(null);
  }, []);

  useEffect(() => {
    if (resizingZone) {
      window.addEventListener('mousemove', handleResizeMove);
      window.addEventListener('mouseup', handleResizeEnd);
      return () => {
        window.removeEventListener('mousemove', handleResizeMove);
        window.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [resizingZone, handleResizeMove, handleResizeEnd]);

  return {
    resizingZone,
    resizeHandle,
    handleResizeStart,
  };
}

