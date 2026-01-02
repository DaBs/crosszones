import React, { useState, useEffect, useRef } from 'react';
import { listen } from '@tauri-apps/api/event';
import type { Zone, ZoneLayout } from '@/types/zoneLayout';
import { cn } from '@/lib/utils';

interface OverlayData {
  layout: ZoneLayout;
  screen: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface ZoneOverlayProps {
  zone: Zone;
  hoveredZone: string | null;
  zIndex?: number;
}

function ZoneOverlayComponent({ zone, hoveredZone, zIndex = 1 }: ZoneOverlayProps) {
  const isHovered = hoveredZone === zone.id;

  const getZoneStyle = (): React.CSSProperties => {
    return {
      left: `${zone.x}%`,
      top: `${zone.y}%`,
      width: `${zone.width}%`,
      height: `${zone.height}%`,
      zIndex: zIndex,
    };
  };

  return (
    <div
      className={cn(
        'absolute rounded-lg flex items-center justify-center pointer-events-none',
        isHovered
          ? 'border-[3px] border-primary/80 bg-primary/80'
          : 'border-2 border-primary/40 bg-primary/20'
      )}
      style={getZoneStyle()}
    >
      {/* Zone number displayed in center */}
      <div className="flex flex-col items-center justify-center text-center">
        <div className="text-4xl font-bold text-white drop-shadow-lg">
          {zone.number}
        </div>
      </div>
    </div>
  );
}

export function ZoneOverlay() {
  const [overlayData, setOverlayData] = useState<OverlayData | null>(null);
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Listen for overlay show event with layout and screen data
    const showUnlisten = listen<OverlayData>('drag-overlay-show', (event) => {
      setOverlayData(event.payload);
    });

    // Listen for overlay hide event
    const hideUnlisten = listen('drag-overlay-hide', () => {
      setOverlayData(null);
      setHoveredZone(null);
      setMousePosition(null);
    });

    // Listen for mouse position updates during drag
    const mouseUnlisten = listen<{ x: number; y: number }>('drag-overlay-mouse', (event) => {
      setMousePosition(event.payload);
      updateHoveredZone(event.payload);
    });

    return () => {
      showUnlisten.then((unlisten) => unlisten());
      hideUnlisten.then((unlisten) => unlisten());
      mouseUnlisten.then((unlisten) => unlisten());
    };
  }, []);

  const updateHoveredZone = (pos: { x: number; y: number }) => {
    if (!overlayData || !containerRef.current) {
      setHoveredZone(null);
      return;
    }

    const containerRect = containerRef.current.getBoundingClientRect();
    const relativeX = pos.x - containerRect.left;
    const relativeY = pos.y - containerRect.top;

    // Convert to percentage
    const xPercent = (relativeX / containerRect.width) * 100;
    const yPercent = (relativeY / containerRect.height) * 100;

    // Find zone at position
    const zone = overlayData.layout.zones.find((z) => {
      return (
        xPercent >= z.x &&
        xPercent <= z.x + z.width &&
        yPercent >= z.y &&
        yPercent <= z.y + z.height
      );
    });

    setHoveredZone(zone?.id || null);
  };

  useEffect(() => {
    if (mousePosition) {
      updateHoveredZone(mousePosition);
    }
  }, [mousePosition, overlayData]);

  // Calculate z-index based on zone size (smaller zones get higher z-index)
  const zoneZIndices = React.useMemo(() => {
    if (!overlayData) return new Map<string, number>();

    const zonesWithArea = overlayData.layout.zones.map((zone) => ({
      id: zone.id,
      area: zone.width * zone.height,
    }));

    zonesWithArea.sort((a, b) => a.area - b.area);

    const zIndexMap = new Map<string, number>();
    const baseZIndex = 100;
    zonesWithArea.forEach((zone, index) => {
      zIndexMap.set(zone.id, baseZIndex + (overlayData.layout.zones.length - index));
    });

    return zIndexMap;
  }, [overlayData]);

  if (!overlayData) {
    console.log('No overlay data');
    return null;
  }

  console.log('Overlay data', overlayData);

  return (
    <div
      ref={containerRef}
      className="w-full h-screen overflow-hidden relative bg-transparent"
      style={{ width: '100vw', height: '100vh' }}
    >
      {overlayData.layout.zones.map((zone) => (
        <ZoneOverlayComponent
          key={zone.id}
          zone={zone}
          hoveredZone={hoveredZone}
          zIndex={zoneZIndices.get(zone.id) || 1}
        />
      ))}
    </div>
  );
}
