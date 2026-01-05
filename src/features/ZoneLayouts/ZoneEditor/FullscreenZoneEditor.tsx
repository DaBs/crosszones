import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ZoneComponent } from './Zone';
import { MergeDialog } from './MergeDialog';
import { ContextMenu } from './ContextMenu';
import { InstructionsOverlay } from './InstructionsOverlay';
import { useZoneEditor } from './hooks/useZoneEditor';
import { useZoneDrag } from './hooks/useZoneDrag';
import { useZoneOperations } from './hooks/useZoneOperations';
import { useZoneResize } from './hooks/useZoneResize';

function FullscreenZoneEditor() {
  const containerRef = useRef<HTMLDivElement>(null);
  const zonesRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
  const [snapEnabled, setSnapEnabled] = useState<boolean>(true);

  const { editorData, zones, setZones, splitMode, zonesStateRef, handleCloseEditor } = useZoneEditor();

  const mergeInitiateRef = useRef<((draggedId: string, targetId: string) => void) | null>(null);

  const {
    draggedZone,
    mergeTarget,
    originalZonePosition,
    handleMouseDown,
    resetDrag,
    hasJustDragged,
    clearDragFlag,
  } = useZoneDrag({
    zones,
    setZones,
    containerRef,
    zonesStateRef,
    snapEnabled,
    onMergeInitiate: (draggedId, targetId) => {
      mergeInitiateRef.current?.(draggedId, targetId);
    },
  });

  const operations = useZoneOperations({
    zones,
    setZones,
    containerRef,
    zonesStateRef,
    originalZonePosition,
  });

  const { resizingZone, handleResizeStart } = useZoneResize({
    zones,
    setZones,
    containerRef,
    snapEnabled,
  });

  // Update the ref with the actual initiateMerge function
  useEffect(() => {
    mergeInitiateRef.current = operations.initiateMerge;
  }, [operations.initiateMerge]);

  // Handle context menu
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenu(null);
    };

    if (contextMenu) {
      window.addEventListener('click', handleClickOutside);
      return () => window.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenu]);

  const handleZoneMouseMove = (e: React.MouseEvent) => {
    if (draggedZone || resizingZone) return; // Don't show split bar while dragging or resizing

    setMousePosition({ x: e.clientX, y: e.clientY });
  };

  const handleZoneClick = (e: React.MouseEvent, zoneId: string) => {
    // Don't split if clicking on a button or if dragging/resizing
    const target = e.target as HTMLElement;
    if (target.tagName === 'BUTTON' || target.closest('button') || draggedZone || resizingZone) {
      return;
    }

    // Don't split if we just finished dragging (prevents split on drag release)
    if (hasJustDragged()) {
      clearDragFlag();
      return;
    }

    // Handle control-click to grow zone
    if (e.ctrlKey || e.metaKey) {
      if (hoveredZone === zoneId && !draggedZone && !resizingZone) {
        operations.handleGrowZone(zoneId);
      }
      return;
    }

    // Only split if hovering over this zone and we're not dragging/resizing
    if (hoveredZone === zoneId && !draggedZone && !resizingZone) {
      const splitCoord = splitMode === 'horizontal' ? e.clientX : e.clientY;
      operations.handleSplitZone(zoneId, splitCoord, splitMode);
    }
  };

  const handleZoneMouseLeave = () => {
    if (draggedZone !== hoveredZone) {
      setHoveredZone(null);
      setMousePosition(null);
    }
  };

  const handleZoneRef = (zoneId: string, el: HTMLDivElement | null) => {
    if (el) {
      zonesRef.current.set(zoneId, el);
    } else {
      zonesRef.current.delete(zoneId);
    }
  };

  const handleCloseEditorWithCleanup = async () => {
    await handleCloseEditor();
    setContextMenu(null);
  };
  
    // Calculate z-index based on zone size (smaller zones get higher z-index)
    const zoneZIndices = useMemo(() => {
      // Calculate area for each zone
      const zonesWithArea = zones.map(zone => ({
        id: zone.id,
        area: zone.width * zone.height,
      }));
      
      // Sort by area (smallest first)
      zonesWithArea.sort((a, b) => a.area - b.area);
      
      // Create a map of zone ID to z-index
      // Smallest zone gets highest z-index (start from a high number and decrease)
      const zIndexMap = new Map<string, number>();
      const baseZIndex = 100; // Base z-index for zones
      zonesWithArea.forEach((zone, index) => {
        // Smaller zones (earlier in sorted array) get higher z-index
        zIndexMap.set(zone.id, baseZIndex + (zones.length - index));
      });
      
      return zIndexMap;
    }, [zones]);

  // Render loading state
  if (!editorData) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-black/50 text-white">
        <div>Loading editor...</div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-screen overflow-hidden relative bg-transparent"
      style={{ width: '100vw', height: '100vh' }}
      onContextMenu={handleContextMenu}
    >
      {zones.map((zone) => (
        <ZoneComponent
          key={zone.id}
          zone={zone}
          hoveredZone={hoveredZone}
          draggedZone={draggedZone}
          mergeTarget={mergeTarget}
          resizingZone={resizingZone}
          splitMode={splitMode}
          mousePosition={mousePosition}
          containerRef={containerRef}
          onMouseDown={handleMouseDown}
          onMouseEnter={setHoveredZone}
          onMouseLeave={handleZoneMouseLeave}
          onMouseMove={handleZoneMouseMove}
          onClick={handleZoneClick}
          onZoneRef={handleZoneRef}
          onResizeStart={handleResizeStart}
          zIndex={zoneZIndices.get(zone.id) || 1}
        />
      ))}

      <InstructionsOverlay snapEnabled={snapEnabled} onSnapToggle={setSnapEnabled} />

      <ContextMenu
        position={contextMenu}
        onClose={() => setContextMenu(null)}
        onCloseEditor={handleCloseEditorWithCleanup}
      />

      <MergeDialog
        open={operations.showMergeDialog}
        onOpenChange={(open) => {
          if (!open) {
            operations.handleMergeCancel();
            resetDrag();
          }
        }}
        onConfirm={() => {
          operations.handleMergeConfirm();
          resetDrag();
        }}
        onCancel={() => {
          operations.handleMergeCancel();
          resetDrag();
        }}
      />
    </div>
  );
}

export { FullscreenZoneEditor };
