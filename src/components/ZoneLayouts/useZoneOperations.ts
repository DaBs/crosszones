import { useState, useCallback } from 'react';
import type { Zone } from '@/types/zoneLayout';
import { generateZoneId } from '@/lib/utils';

interface UseZoneOperationsProps {
  zones: Zone[];
  setZones: React.Dispatch<React.SetStateAction<Zone[]>>;
  containerRef: React.RefObject<HTMLDivElement>;
  zonesStateRef: React.MutableRefObject<Zone[]>;
  originalZonePosition: { x: number; y: number } | null;
}

export function useZoneOperations({
  zones,
  setZones,
  containerRef,
  zonesStateRef,
  originalZonePosition,
}: UseZoneOperationsProps) {
  const [showMergeDialog, setShowMergeDialog] = useState(false);
  const [pendingMerge, setPendingMerge] = useState<{ draggedId: string; targetId: string } | null>(null);

  const handleSplitZone = useCallback((zoneId: string, splitPosition: number, direction: 'horizontal' | 'vertical') => {
    const zone = zones.find((z) => z.id === zoneId);
    if (!zone || !containerRef.current) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const newZones: Zone[] = [];
    const nextNumber = Math.max(...zones.map((z) => z.number)) + 1;

    if (direction === 'horizontal') {
      // Split horizontally (left/right) - splitPosition is X coordinate
      const splitPercent = ((splitPosition - rect.left) / rect.width) * 100;
      const relativeX = splitPercent - zone.x;

      if (relativeX <= 0 || relativeX >= zone.width) return; // Invalid split position

      const leftZone: Zone = {
        id: zone.id,
        x: zone.x,
        y: zone.y,
        width: relativeX,
        height: zone.height,
        number: zone.number,
      };
      const rightZone: Zone = {
        id: generateZoneId(),
        x: zone.x + relativeX,
        y: zone.y,
        width: zone.width - relativeX,
        height: zone.height,
        number: nextNumber,
      };
      newZones.push(leftZone, rightZone);
    } else {
      // Split vertically (top/bottom) - splitPosition is Y coordinate
      const splitPercent = ((splitPosition - rect.top) / rect.height) * 100;
      const relativeY = splitPercent - zone.y;

      if (relativeY <= 0 || relativeY >= zone.height) return; // Invalid split position

      const topZone: Zone = {
        id: zone.id,
        x: zone.x,
        y: zone.y,
        width: zone.width,
        height: relativeY,
        number: zone.number,
      };
      const bottomZone: Zone = {
        id: generateZoneId(),
        x: zone.x,
        y: zone.y + relativeY,
        width: zone.width,
        height: zone.height - relativeY,
        number: nextNumber,
      };
      newZones.push(topZone, bottomZone);
    }

    const updatedZones = zones.filter((z) => z.id !== zoneId).concat(newZones);
    setZones(updatedZones);
  }, [zones, setZones, containerRef]);

  const handleMergeConfirm = useCallback(() => {
    if (!pendingMerge) return;

    const { draggedId, targetId } = pendingMerge;
    const currentZones = zonesStateRef.current;
    const dragged = currentZones.find((z) => z.id === draggedId)!;
    const target = currentZones.find((z) => z.id === targetId)!;

    // Use original position for the dragged zone, not the current dragged position
    const draggedOriginal = originalZonePosition
      ? { ...dragged, x: originalZonePosition.x, y: originalZonePosition.y }
      : dragged;

    const mergedZone: Zone = {
      id: target.id,
      x: Math.min(draggedOriginal.x, target.x),
      y: Math.min(draggedOriginal.y, target.y),
      width: Math.max(draggedOriginal.x + draggedOriginal.width, target.x + target.width) - Math.min(draggedOriginal.x, target.x),
      height: Math.max(draggedOriginal.y + draggedOriginal.height, target.y + target.height) - Math.min(draggedOriginal.y, target.y),
      number: target.number,
    };

    const newZones = currentZones.filter((z) => z.id !== draggedId && z.id !== targetId);
    newZones.push(mergedZone);

    // Renumber zones
    const sortedZones = newZones.sort((a, b) => {
      if (a.y !== b.y) return a.y - b.y;
      return a.x - b.x;
    });
    const renumberedZones = sortedZones.map((z, idx) => ({ ...z, number: idx + 1 }));

    setZones(renumberedZones);
    handleMergeCancel();
  }, [pendingMerge, zonesStateRef, originalZonePosition, setZones]);

  const handleMergeCancel = useCallback(() => {
    // Restore original position if merge was cancelled
    if (pendingMerge && originalZonePosition) {
      setZones((prevZones) =>
        prevZones.map((z) =>
          z.id === pendingMerge.draggedId
            ? { ...z, x: originalZonePosition!.x, y: originalZonePosition!.y }
            : z
        )
      );
    }

    setShowMergeDialog(false);
    setPendingMerge(null);
  }, [pendingMerge, originalZonePosition, setZones]);

  const initiateMerge = useCallback((draggedId: string, targetId: string) => {
    setPendingMerge({ draggedId, targetId });
    setShowMergeDialog(true);
  }, []);

  return {
    showMergeDialog,
    pendingMerge,
    handleSplitZone,
    handleMergeConfirm,
    handleMergeCancel,
    initiateMerge,
  };
}

