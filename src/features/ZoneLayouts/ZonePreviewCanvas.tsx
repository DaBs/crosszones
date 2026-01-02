import React, { useMemo } from 'react';
import type { Zone } from '@/types/zoneLayout';

interface ZonePreviewCanvasProps {
  zones: Zone[];
  width?: number;
  screenWidth?: number;
  screenHeight?: number;
}

export const ZonePreviewCanvas: React.FC<ZonePreviewCanvasProps> = ({
  zones,
  width = 200,
  screenWidth,
  screenHeight,
}) => {
  // Calculate aspect ratio from screen dimensions if available, otherwise from zones' bounding box
  const aspectRatio = useMemo(() => {
    // If we have screen dimensions, use them for accurate aspect ratio
    if (screenWidth && screenHeight && screenWidth > 0 && screenHeight > 0) {
      return screenWidth / screenHeight;
    }

    // Fallback to calculating from zones' bounding box
    if (zones.length === 0) return 16 / 9; // Default aspect ratio

    // Find the bounding box of all zones
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    zones.forEach((zone) => {
      minX = Math.min(minX, zone.x);
      minY = Math.min(minY, zone.y);
      maxX = Math.max(maxX, zone.x + zone.width);
      maxY = Math.max(maxY, zone.y + zone.height);
    });

    // Calculate the actual dimensions of the bounding box (in percentage)
    const layoutWidth = maxX - minX;
    const layoutHeight = maxY - minY;

    // If layout dimensions are valid, use them
    // If zones cover the full screen (100x100%), use default 16:9 aspect ratio
    // Otherwise, use the calculated ratio from the bounding box
    if (layoutWidth > 0 && layoutHeight > 0) {
      // If zones span the full screen (or close to it), use standard screen aspect ratio
      if (layoutWidth >= 99 && layoutHeight >= 99) {
        return 16 / 9; // Default screen aspect ratio
      }
      return layoutWidth / layoutHeight;
    }

    return 16 / 9; // Default aspect ratio
  }, [zones, screenWidth, screenHeight]);

  // Calculate height based on width and aspect ratio
  const height = width / aspectRatio;

  // Sort zones by number to ensure consistent rendering
  const sortedZones = [...zones].sort((a, b) => a.number - b.number);

  // Margin around zones (as percentage to maintain proportions)
  const marginPercent = 1.5;

  return (
    <div
      className="relative rounded-lg bg-primary border-1 border-white/20 overflow-hidden"
      style={{
        width: `${width}px`,
        height: `${height}px`,
        maxWidth: '100%',
      }}
    >
      {sortedZones.map((zone) => {
        // Calculate zone position and size with margin
        const x = zone.x + marginPercent;
        const y = zone.y + marginPercent;
        const zoneWidth = zone.width - marginPercent * 2;
        const zoneHeight = zone.height - marginPercent * 2;

        // Skip if zone is too small
        if (zoneWidth <= 0 || zoneHeight <= 0) return null;

        return (
          <div
            key={zone.id}
            className="absolute flex items-center justify-center rounded-md bg-white/15 border-[3px] border-white/20 text-white font-bold text-sm"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              width: `${zoneWidth}%`,
              height: `${zoneHeight}%`,
            }}
          >
            {zoneWidth > 10 && zoneHeight > 10 && (
              <span>{zone.number}</span>
            )}
          </div>
        );
      })}
    </div>
  );
};
