import React, { useState, useEffect, useRef } from 'react';
import { listen } from '@tauri-apps/api/event';
import { useLocation } from 'wouter';
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
          : 'border-2 border-primary/40 bg-secondary/60'
      )}
      style={getZoneStyle()}
    >
      {/* Zone number displayed in center */}
      <div className="flex flex-col items-center justify-center text-center">
        <div className="text-8xl font-bold text-white drop-shadow-lg">
          {zone.number}
        </div>
      </div>
    </div>
  );
}

export function ZoneOverlay() {
  const [location] = useLocation();
  const [overlayData, setOverlayData] = useState<OverlayData | null>(null);
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load overlay data from events (primary method)
  useEffect(() => {
    const unlisten = listen<OverlayData>('overlay-data', (event) => {
      setOverlayData(event.payload);
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  // Also support URL parameters for backwards compatibility (fallback)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const dataParam = urlParams.get('data');
    
    if (dataParam) {
      try {
        // Decode base64 data
        const decoded = atob(dataParam);
        const data: OverlayData = JSON.parse(decoded);
        setOverlayData(data);
      } catch (error) {
        console.error('Failed to parse overlay data from URL:', error);
      }
    }
  }, [location]);
  

  const updateHoveredZone = React.useCallback((pos: { x: number; y: number }) => {
    if (!overlayData || !containerRef.current) {
      setHoveredZone(null);
      return;
    }

    // pos.x and pos.y are in screen coordinates
    // containerRect is relative to viewport, but since overlay window is fullscreen at screen.x, screen.y
    // we need to convert screen coordinates to container-relative coordinates
    const relativeX = pos.x - overlayData.screen.x;
    const relativeY = pos.y - overlayData.screen.y;

    // Convert to percentage
    const xPercent = (relativeX / overlayData.screen.width) * 100;
    const yPercent = (relativeY / overlayData.screen.height) * 100;

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
  }, [overlayData]);

  useEffect(() => {
    // Listen for virtual cursor position updates during drag
    // The webview can't receive real mouse events because the dragged window is above it,
    // so we receive virtual cursor position events emitted from the Rust backend
    const mouseUnlisten = listen<{ x: number; y: number }>('virtual-cursor', (event) => {
      setMousePosition(event.payload);
    });

    return () => {
      mouseUnlisten.then((unlisten) => unlisten());
    };
  }, []);

  useEffect(() => {
    if (mousePosition && overlayData) {
      updateHoveredZone(mousePosition);
    }
  }, [mousePosition, overlayData, updateHoveredZone]);

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
    return null;
  }

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
