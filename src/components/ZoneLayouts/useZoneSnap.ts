import type { Zone } from '@/types/zoneLayout';

const SNAP_THRESHOLD = 0.2; // Percentage threshold for snapping

interface SnapPoints {
  x: number[]; // Vertical lines (left/right edges)
  y: number[]; // Horizontal lines (top/bottom edges)
}

/**
 * Get all snap points from other zones (excluding the current zone)
 */
export function getSnapPoints(zones: Zone[], excludeZoneId: string): SnapPoints {
  const xPoints = new Set<number>([0, 100]); // Container boundaries
  const yPoints = new Set<number>([0, 100]); // Container boundaries

  zones.forEach((zone) => {
    if (zone.id === excludeZoneId) return;

    // Add left and right edges
    xPoints.add(zone.x);
    xPoints.add(zone.x + zone.width);

    // Add top and bottom edges
    yPoints.add(zone.y);
    yPoints.add(zone.y + zone.height);
  });

  return {
    x: Array.from(xPoints).sort((a, b) => a - b),
    y: Array.from(yPoints).sort((a, b) => a - b),
  };
}

/**
 * Snap a value to the nearest snap point within threshold
 */
function snapToPoint(value: number, snapPoints: number[], threshold: number): number {
  for (const point of snapPoints) {
    const distance = Math.abs(value - point);
    if (distance <= threshold) {
      return point;
    }
  }
  return value;
}

/**
 * Snap zone edges to other zones' boundaries
 */
export function snapZoneEdges(
  zone: Zone,
  zones: Zone[],
  excludeZoneId: string
): Zone {
  const snapPoints = getSnapPoints(zones, excludeZoneId);
  const left = snapToPoint(zone.x, snapPoints.x, SNAP_THRESHOLD);
  const right = snapToPoint(zone.x + zone.width, snapPoints.x, SNAP_THRESHOLD);
  const top = snapToPoint(zone.y, snapPoints.y, SNAP_THRESHOLD);
  const bottom = snapToPoint(zone.y + zone.height, snapPoints.y, SNAP_THRESHOLD);

  // Calculate new position and size from snapped edges
  const newX = left;
  const newY = top;
  const newWidth = right - left;
  const newHeight = bottom - top;

  // Ensure minimum size
  const minSize = 5;
  const finalWidth = Math.max(newWidth, minSize);
  const finalHeight = Math.max(newHeight, minSize);

  // Adjust position if width/height was clamped
  let finalX = newX;
  let finalY = newY;
  if (finalWidth > newWidth) {
    // If we had to increase width, try to maintain the right edge
    finalX = Math.max(0, right - finalWidth);
  }
  if (finalHeight > newHeight) {
    // If we had to increase height, try to maintain the bottom edge
    finalY = Math.max(0, bottom - finalHeight);
  }

  // Clamp to container bounds
  finalX = Math.max(0, Math.min(100 - finalWidth, finalX));
  finalY = Math.max(0, Math.min(100 - finalHeight, finalY));

  return {
    ...zone,
    x: finalX,
    y: finalY,
    width: finalWidth,
    height: finalHeight,
  };
}

/**
 * Check if two zones overlap
 */
function zonesOverlap(zone1: Zone, zone2: Zone): boolean {
  return (
    zone1.x < zone2.x + zone2.width &&
    zone1.x + zone1.width > zone2.x &&
    zone1.y < zone2.y + zone2.height &&
    zone1.y + zone1.height > zone2.y
  );
}

/**
 * Adjust zone position to prevent overlaps with other zones
 */
export function preventOverlaps(zone: Zone, zones: Zone[], excludeZoneId: string): Zone {
  let adjustedZone = { ...zone };

  // Check for overlaps with each other zone
  for (const otherZone of zones) {
    if (otherZone.id === excludeZoneId) continue;

    if (zonesOverlap(adjustedZone, otherZone)) {
      // Try to snap to boundaries to resolve overlap
      const snapPoints = getSnapPoints(zones, excludeZoneId);

      // Try snapping left edge to other zone's right edge
      if (adjustedZone.x < otherZone.x + otherZone.width && adjustedZone.x + adjustedZone.width > otherZone.x) {
        const distanceToRight = Math.abs(adjustedZone.x - (otherZone.x + otherZone.width));
        const distanceToLeft = Math.abs((adjustedZone.x + adjustedZone.width) - otherZone.x);

        if (distanceToRight < distanceToLeft && distanceToRight < SNAP_THRESHOLD) {
          adjustedZone.x = otherZone.x + otherZone.width;
        } else if (distanceToLeft < SNAP_THRESHOLD) {
          adjustedZone.x = otherZone.x - adjustedZone.width;
        }
      }

      // Try snapping top edge to other zone's bottom edge
      if (adjustedZone.y < otherZone.y + otherZone.height && adjustedZone.y + adjustedZone.height > otherZone.y) {
        const distanceToBottom = Math.abs(adjustedZone.y - (otherZone.y + otherZone.height));
        const distanceToTop = Math.abs((adjustedZone.y + adjustedZone.height) - otherZone.y);

        if (distanceToBottom < distanceToTop && distanceToBottom < SNAP_THRESHOLD) {
          adjustedZone.y = otherZone.y + otherZone.height;
        } else if (distanceToTop < SNAP_THRESHOLD) {
          adjustedZone.y = otherZone.y - adjustedZone.height;
        }
      }

      // Clamp to bounds after adjustment
      adjustedZone.x = Math.max(0, Math.min(100 - adjustedZone.width, adjustedZone.x));
      adjustedZone.y = Math.max(0, Math.min(100 - adjustedZone.height, adjustedZone.y));
    }
  }

  return adjustedZone;
}

