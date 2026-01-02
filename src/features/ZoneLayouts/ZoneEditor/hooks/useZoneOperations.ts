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

  const handleGrowZone = useCallback((zoneId: string) => {
    const zone = zones.find((z) => z.id === zoneId);
    if (!zone) return;

    const otherZones = zones.filter((z) => z.id !== zoneId);
    
    // Calculate the zone's current boundaries
    const zoneLeft = zone.x;
    const zoneRight = zone.x + zone.width;
    const zoneTop = zone.y;
    const zoneBottom = zone.y + zone.height;

    // Find the maximum expansion in each direction
    let maxLeft = 0; // Can expand left to 0
    let maxRight = 100; // Can expand right to 100
    let maxTop = 0; // Can expand top to 0
    let maxBottom = 100; // Can expand bottom to 100

    // Check each other zone to see if it blocks expansion
    for (const otherZone of otherZones) {
      const otherLeft = otherZone.x;
      const otherRight = otherZone.x + otherZone.width;
      const otherTop = otherZone.y;
      const otherBottom = otherZone.y + otherZone.height;

      // Check if zones overlap vertically (can block horizontal expansion)
      const verticalOverlap = !(zoneBottom <= otherTop || zoneTop >= otherBottom);
      
      // Check if zones overlap horizontally (can block vertical expansion)
      const horizontalOverlap = !(zoneRight <= otherLeft || zoneLeft >= otherRight);

      if (verticalOverlap) {
        // This zone can block left/right expansion
        if (otherRight <= zoneLeft) {
          // Other zone is to the left, blocks left expansion
          maxLeft = Math.max(maxLeft, otherRight);
        }
        if (otherLeft >= zoneRight) {
          // Other zone is to the right, blocks right expansion
          maxRight = Math.min(maxRight, otherLeft);
        }
      }

      if (horizontalOverlap) {
        // This zone can block top/bottom expansion
        if (otherBottom <= zoneTop) {
          // Other zone is above, blocks top expansion
          maxTop = Math.max(maxTop, otherBottom);
        }
        if (otherTop >= zoneBottom) {
          // Other zone is below, blocks bottom expansion
          maxBottom = Math.min(maxBottom, otherTop);
        }
      }
    }

    // Create the expanded zone
    const expandedZone: Zone = {
      ...zone,
      x: maxLeft,
      y: maxTop,
      width: maxRight - maxLeft,
      height: maxBottom - maxTop,
    };

    // Only update if the zone actually changed
    if (
      expandedZone.x !== zone.x ||
      expandedZone.y !== zone.y ||
      expandedZone.width !== zone.width ||
      expandedZone.height !== zone.height
    ) {
      setZones((prevZones) =>
        prevZones.map((z) => (z.id === zoneId ? expandedZone : z))
      );
    }
  }, [zones, setZones]);

  return {
    showMergeDialog,
    pendingMerge,
    handleSplitZone,
    handleMergeConfirm,
    handleMergeCancel,
    initiateMerge,
    handleGrowZone,
  };
}

