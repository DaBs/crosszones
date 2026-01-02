import { useState, useCallback, useEffect, useRef } from 'react';
import type { Zone } from '@/types/zoneLayout';
import { snapZoneEdges, preventOverlaps } from './useZoneSnap';

interface UseZoneDragProps {
  zones: Zone[];
  setZones: React.Dispatch<React.SetStateAction<Zone[]>>;
  containerRef: React.RefObject<HTMLDivElement>;
  zonesStateRef: React.MutableRefObject<Zone[]>;
  snapEnabled?: boolean;
  onMergeInitiate?: (draggedId: string, targetId: string) => void;
}

export function useZoneDrag({
  zones,
  setZones,
  containerRef,
  zonesStateRef,
  snapEnabled = true,
  onMergeInitiate,
}: UseZoneDragProps) {
  const [draggedZone, setDraggedZone] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [originalZonePosition, setOriginalZonePosition] = useState<{ x: number; y: number } | null>(null);
  const [mergeTarget, setMergeTarget] = useState<string | null>(null);
  const hasDraggedRef = useRef<boolean>(false);
  const initialMousePositionRef = useRef<{ x: number; y: number } | null>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent, zoneId: string) => {
    // Don't start dragging if clicking on a button or interactive element
    const target = e.target as HTMLElement;
    if (target.tagName === 'BUTTON' || target.closest('button')) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    // Store the original zone position before dragging
    const zone = zones.find((z) => z.id === zoneId);
    if (zone) {
      setOriginalZonePosition({ x: zone.x, y: zone.y });
    }

    // Reset drag tracking
    hasDraggedRef.current = false;
    initialMousePositionRef.current = { x: e.clientX, y: e.clientY };

    setDraggedZone(zoneId);
    setDragStart({ x: e.clientX, y: e.clientY });
  }, [zones]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!draggedZone || !dragStart || !containerRef.current) return;

    // Check if mouse has moved significantly (more than a few pixels) to consider it a drag
    if (initialMousePositionRef.current) {
      const moveDistance = Math.sqrt(
        Math.pow(e.clientX - initialMousePositionRef.current.x, 2) +
        Math.pow(e.clientY - initialMousePositionRef.current.y, 2)
      );
      if (moveDistance > 5) {
        hasDraggedRef.current = true;
      }
    }

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;

    // Convert pixel delta to percentage
    const deltaXPercent = (deltaX / rect.width) * 100;
    const deltaYPercent = (deltaY / rect.height) * 100;

    setZones((prevZones) => {
      return prevZones.map((zone) => {
        if (zone.id !== draggedZone) return zone;

        let newX = zone.x + deltaXPercent;
        let newY = zone.y + deltaYPercent;

        // Clamp to bounds
        newX = Math.max(0, Math.min(100 - zone.width, newX));
        newY = Math.max(0, Math.min(100 - zone.height, newY));

        // Create updated zone
        let updatedZone = { ...zone, x: newX, y: newY };

        // Snap to other zones' boundaries (if enabled)
        if (snapEnabled) {
          updatedZone = snapZoneEdges(updatedZone, prevZones, draggedZone);
        }

        // Prevent overlaps
        updatedZone = preventOverlaps(updatedZone, prevZones, draggedZone);

        return updatedZone;
      });
    });

    setDragStart({ x: e.clientX, y: e.clientY });

    // Check for merge target
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const mouseXPercent = (mouseX / rect.width) * 100;
    const mouseYPercent = (mouseY / rect.height) * 100;

    const targetZone = zonesStateRef.current.find((z) => {
      if (z.id === draggedZone) return false;
      return (
        mouseXPercent >= z.x &&
        mouseXPercent <= z.x + z.width &&
        mouseYPercent >= z.y &&
        mouseYPercent <= z.y + z.height
      );
    });

    setMergeTarget(targetZone?.id || null);
  }, [draggedZone, dragStart, containerRef, setZones, zonesStateRef, snapEnabled]);

  const handleMouseUp = useCallback(() => {
    if (draggedZone && mergeTarget && onMergeInitiate) {
      // Trigger merge dialog
      onMergeInitiate(draggedZone, mergeTarget);
    } else {
      // No merge, just cleanup
      setDraggedZone(null);
      setDragStart(null);
      setOriginalZonePosition(null);
      setMergeTarget(null);
    }
    // Note: hasDraggedRef.current remains true until next mousedown
    // This allows the click handler to check if a drag just occurred
  }, [draggedZone, mergeTarget, onMergeInitiate]);

  useEffect(() => {
    if (draggedZone) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggedZone, handleMouseMove, handleMouseUp]);

  const resetDrag = useCallback(() => {
    setDraggedZone(null);
    setDragStart(null);
    setOriginalZonePosition(null);
    setMergeTarget(null);
    hasDraggedRef.current = false;
    initialMousePositionRef.current = null;
  }, []);

  const hasJustDragged = useCallback(() => {
    return hasDraggedRef.current;
  }, []);

  const clearDragFlag = useCallback(() => {
    hasDraggedRef.current = false;
    initialMousePositionRef.current = null;
  }, []);

  return {
    draggedZone,
    mergeTarget,
    originalZonePosition,
    handleMouseDown,
    resetDrag,
    hasJustDragged,
    clearDragFlag,
  };
}
