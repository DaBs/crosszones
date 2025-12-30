import React, { useState, useEffect, useRef, useCallback } from 'react';
import { invoke as invokeCore } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import type { Zone } from '@/types/zoneLayout';
import { generateZoneId } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ScreenInfo {
  x: number;
  y: number;
  width: number;
  height: number;
  id: string;
}

interface EditorData {
  layoutId: string;
  layoutName: string;
  zones: Zone[];
  screen: ScreenInfo;
}

function FullscreenZoneEditor() {
  const [editorData, setEditorData] = useState<EditorData | null>(null);
  const [zones, setZones] = useState<Zone[]>([]);
  const [draggedZone, setDraggedZone] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [originalZonePosition, setOriginalZonePosition] = useState<{ x: number; y: number } | null>(null);
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const [mergeTarget, setMergeTarget] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
  const [splitMode, setSplitMode] = useState<'horizontal' | 'vertical'>('horizontal');
  const [showMergeDialog, setShowMergeDialog] = useState(false);
  const [pendingMerge, setPendingMerge] = useState<{ draggedId: string; targetId: string } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const zonesRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const zonesStateRef = useRef<Zone[]>([]);
  
  // Keep zonesStateRef in sync with zones
  useEffect(() => {
    zonesStateRef.current = zones;
  }, [zones]);

  useEffect(() => {
    const setupListener = async () => {
      const unlistenEditorData = await listen<EditorData>('editor-data', (event) => {
        const data = event.payload;
        setEditorData(data);
        // If no zones, create a default fullscreen zone
        if (data.zones.length === 0) {
          const defaultZone: Zone = {
            id: generateZoneId(),
            x: 0,
            y: 0,
            width: 100,
            height: 100,
            number: 1,
          };
          setZones([defaultZone]);
        } else {
          setZones(data.zones);
        }
      });

      // Listen for zone storage requests (when saving while editor is open)
      const unlistenRequestZones = await listen('request-zones', async () => {
        // Use the ref to get the latest zones
        const currentZones = zonesStateRef.current;
        await invokeCore('store_editor_zones', { zones: currentZones });
      });

      return () => {
        unlistenEditorData();
        unlistenRequestZones();
      };
    };

    setupListener();
  }, []);

  // Handle ESC key to close editor and Shift key for split mode
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        await invokeCore('close_editor_windows', { zones });
      } else if (e.key === 'Shift') {
        setSplitMode('vertical');
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setSplitMode('horizontal');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [zones]);

  // Handle context menu
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleCloseEditor = async () => {
    await invokeCore('close_editor_windows', { zones });
    setContextMenu(null);
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

  const getZoneStyle = (zone: Zone): React.CSSProperties => {
    return {
      position: 'absolute',
      left: `${zone.x}%`,
      top: `${zone.y}%`,
      width: `${zone.width}%`,
      height: `${zone.height}%`,
      border: hoveredZone === zone.id || mergeTarget === zone.id
        ? '3px solid rgba(59, 130, 246, 1)'
        : '2px solid rgba(59, 130, 246, 0.6)',
      borderRadius: '8px',
      backgroundColor: hoveredZone === zone.id || mergeTarget === zone.id
        ? 'rgba(59, 130, 246, 0.2)'
        : 'rgba(59, 130, 246, 0.1)',
      cursor: draggedZone === zone.id ? 'grabbing' : 'grab',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: draggedZone === zone.id ? 'none' : 'all 0.2s',
      zIndex: draggedZone === zone.id ? 1000 : 1,
    };
  };

  const handleMouseDown = (e: React.MouseEvent, zoneId: string) => {
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
    
    setDraggedZone(zoneId);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!draggedZone || !dragStart || !containerRef.current) return;

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

        return { ...zone, x: newX, y: newY };
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
  }, [draggedZone, dragStart]);

  const handleMouseUp = useCallback(async () => {
    if (draggedZone && mergeTarget) {
      // Show merge dialog instead of alert
      setPendingMerge({ draggedId: draggedZone, targetId: mergeTarget });
      setShowMergeDialog(true);
    } else {
      // No merge, just cleanup
      setDraggedZone(null);
      setDragStart(null);
      setOriginalZonePosition(null);
      setMergeTarget(null);
    }
  }, [draggedZone, mergeTarget]);

  const handleMergeConfirm = () => {
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
  };

  const handleMergeCancel = () => {
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
    setDraggedZone(null);
    setDragStart(null);
    setOriginalZonePosition(null);
    setMergeTarget(null);
  };

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

  const handleSplitZone = (zoneId: string, splitPosition: number, direction: 'horizontal' | 'vertical') => {
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
  };

  const handleZoneMouseMove = (e: React.MouseEvent) => {
    if (draggedZone) return; // Don't show split bar while dragging
    
    setMousePosition({ x: e.clientX, y: e.clientY });
  };

  const handleZoneClick = (e: React.MouseEvent, zoneId: string) => {
    // Don't split if clicking on a button or if dragging
    const target = e.target as HTMLElement;
    if (target.tagName === 'BUTTON' || target.closest('button') || draggedZone) {
      return;
    }

    // Only split if hovering over this zone and we're not dragging
    if (hoveredZone === zoneId && !draggedZone) {
      const splitCoord = splitMode === 'horizontal' ? e.clientX : e.clientY;
      handleSplitZone(zoneId, splitCoord, splitMode);
    }
  };

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
      className="w-full h-screen relative bg-transparent"
      style={{ width: '100vw', height: '100vh' }}
      onContextMenu={handleContextMenu}
    >
      {zones.map((zone) => (
        <div
          key={zone.id}
          ref={(el) => {
            if (el) zonesRef.current.set(zone.id, el);
            else zonesRef.current.delete(zone.id);
          }}
          style={getZoneStyle(zone)}
          onMouseDown={(e) => handleMouseDown(e, zone.id)}
          onMouseEnter={() => setHoveredZone(zone.id)}
          onMouseLeave={() => {
            if (draggedZone !== zone.id) {
              setHoveredZone(null);
              setMousePosition(null);
            }
          }}
          onMouseMove={handleZoneMouseMove}
          onClick={(e) => handleZoneClick(e, zone.id)}
        >
          {/* Zone info displayed prominently in center */}
          <div className="flex flex-col items-center justify-center text-center pointer-events-none">
            <div className="text-6xl font-bold text-white drop-shadow-lg">
              {zone.number.toString().slice(0, 8)}
            </div>
            <div className="text-2xl font-semibold text-white mt-2">
              {zone.width.toFixed(1)}% × {zone.height.toFixed(1)}%
            </div>
          </div>
          
          {/* Split bar - follows mouse when hovering over zone */}
          {hoveredZone === zone.id && draggedZone === null && mousePosition && containerRef.current && (() => {
            const container = containerRef.current!;
            const rect = container.getBoundingClientRect();
            const zoneEl = zonesRef.current.get(zone.id);
            if (!zoneEl) return null;
            
            const zoneRect = zoneEl.getBoundingClientRect();
            const isInsideZone = 
              mousePosition.x >= zoneRect.left && 
              mousePosition.x <= zoneRect.right &&
              mousePosition.y >= zoneRect.top && 
              mousePosition.y <= zoneRect.bottom;
            
            if (!isInsideZone) return null;
            
            if (splitMode === 'horizontal') {
              // Vertical bar for horizontal split
              const xPercent = ((mousePosition.x - rect.left) / rect.width) * 100;
              const zoneXPercent = zone.x;
              const zoneWidthPercent = zone.width;
              
              if (xPercent < zoneXPercent || xPercent > zoneXPercent + zoneWidthPercent) return null;
              
              const cursorXInZone = ((mousePosition.x - zoneRect.left) / zoneRect.width) * 100;
              const leftWidth = cursorXInZone;
              const rightWidth = 100 - cursorXInZone;
              
              return (
                <>
                  {/* Split bar */}
                  <div
                    className="absolute top-0 bottom-0 w-1 bg-blue-500 shadow-lg pointer-events-none z-20"
                    style={{
                      left: `${cursorXInZone}%`,
                      transform: 'translateX(-50%)',
                    }}
                  />
                  {/* Dotted line to left edge */}
                  <div
                    className="absolute top-1/2 left-0 border-t-2 border-dashed border-blue-400/60 pointer-events-none z-20"
                    style={{
                      width: `${cursorXInZone}%`,
                      transform: 'translateY(-50%)',
                    }}
                  />
                  {/* Dotted line to right edge */}
                  <div
                    className="absolute top-1/2 right-0 border-t-2 border-dashed border-blue-400/60 pointer-events-none z-20"
                    style={{
                      width: `${rightWidth}%`,
                      transform: 'translateY(-50%)',
                    }}
                  />
                  {/* Measurement labels */}
                  <div
                    className="absolute top-1/2 left-0 pointer-events-none z-20 text-xs font-semibold text-blue-300 bg-blue-500/20 px-1 rounded"
                    style={{
                      left: `${cursorXInZone / 2}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    {leftWidth.toFixed(1)}%
                  </div>
                  <div
                    className="absolute top-1/2 right-0 pointer-events-none z-20 text-xs font-semibold text-blue-300 bg-blue-500/20 px-1 rounded"
                    style={{
                      right: `${rightWidth / 2}%`,
                      transform: 'translate(50%, -50%)',
                    }}
                  >
                    {rightWidth.toFixed(1)}%
                  </div>
                </>
              );
            } else {
              // Horizontal bar for vertical split
              const yPercent = ((mousePosition.y - rect.top) / rect.height) * 100;
              const zoneYPercent = zone.y;
              const zoneHeightPercent = zone.height;
              
              if (yPercent < zoneYPercent || yPercent > zoneYPercent + zoneHeightPercent) return null;
              
              const cursorYInZone = ((mousePosition.y - zoneRect.top) / zoneRect.height) * 100;
              const topHeight = cursorYInZone;
              const bottomHeight = 100 - cursorYInZone;
              
              return (
                <>
                  {/* Split bar */}
                  <div
                    className="absolute left-0 right-0 h-1 bg-blue-500 shadow-lg pointer-events-none z-20"
                    style={{
                      top: `${cursorYInZone}%`,
                      transform: 'translateY(-50%)',
                    }}
                  />
                  {/* Dotted line to top edge */}
                  <div
                    className="absolute left-1/2 top-0 border-l-2 border-dashed border-blue-400/60 pointer-events-none z-20"
                    style={{
                      height: `${cursorYInZone}%`,
                      transform: 'translateX(-50%)',
                    }}
                  />
                  {/* Dotted line to bottom edge */}
                  <div
                    className="absolute left-1/2 bottom-0 border-l-2 border-dashed border-blue-400/60 pointer-events-none z-20"
                    style={{
                      height: `${bottomHeight}%`,
                      transform: 'translateX(-50%)',
                    }}
                  />
                  {/* Measurement labels */}
                  <div
                    className="absolute left-1/2 top-0 pointer-events-none z-20 text-xs font-semibold text-blue-300 bg-blue-500/20 px-1 rounded"
                    style={{
                      top: `${topHeight / 2}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    {topHeight.toFixed(1)}%
                  </div>
                  <div
                    className="absolute left-1/2 bottom-0 pointer-events-none z-20 text-xs font-semibold text-blue-300 bg-blue-500/20 px-1 rounded"
                    style={{
                      bottom: `${bottomHeight / 2}%`,
                      transform: 'translate(-50%, 50%)',
                    }}
                  >
                    {bottomHeight.toFixed(1)}%
                  </div>
                </>
              );
            }
          })()}
        </div>
      ))}

      {/* Instructions overlay */}
      <div className="absolute bottom-4 left-4 bg-black/70 text-white p-4 rounded-lg text-sm space-y-1 max-w-xs">
        <div className="font-semibold mb-2">Zone Editor Instructions</div>
        <div>• Drag zones to move them</div>
        <div>• Hover over a zone and click to split (follows mouse)</div>
        <div>• Hold Shift to split vertically instead of horizontally</div>
        <div>• Drag a zone onto another to merge them</div>
        <div className="mt-2 text-xs text-gray-400">Press ESC or right-click to close</div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg py-1 z-[2000] min-w-[150px]"
          style={{
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            onClick={handleCloseEditor}
          >
            Close Editor
          </button>
        </div>
      )}

      {/* Merge Dialog */}
      <Dialog open={showMergeDialog} onOpenChange={(open) => {
        if (!open) {
          handleMergeCancel();
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Merge Zones</DialogTitle>
            <DialogDescription>
              Are you sure you want to merge these two zones? This will combine them into a single zone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleMergeCancel}>
              Cancel
            </Button>
            <Button onClick={handleMergeConfirm}>
              Merge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export { FullscreenZoneEditor };

