import React, { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { type Zone } from '@/types/zoneLayout';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { generateZoneId } from '@/lib/utils';

interface ZoneEditorProps {
  zones: Zone[];
  onZonesChange: (zones: Zone[]) => void;
}

export const ZoneEditor: React.FC<ZoneEditorProps> = ({
  zones,
  onZonesChange,
}) => {
  const [screenDimensions, setScreenDimensions] = useState<{ width: number; height: number } | null>(null);

  // Get screen dimensions for preview
  useEffect(() => {
    const loadScreenDimensions = async () => {
      try {
        const [width, height] = await invoke<[number, number]>('get_primary_screen_dimensions');
        setScreenDimensions({ width, height });
      } catch (error) {
        console.error('Failed to get screen dimensions:', error);
        // Fallback to 16:9
        setScreenDimensions({ width: 1920, height: 1080 });
      }
    };
    loadScreenDimensions();
  }, []);

  // Cleanup: destroy all zone windows when component unmounts
  useEffect(() => {
    return () => {
      invoke('destroy_all_zone_windows').catch(console.error);
    };
  }, []);

  const handleDeleteZone = async (zoneId: string) => {
    try {
      await invoke('destroy_zone_window', { zoneId });
      onZonesChange(zones.filter(z => z.id !== zoneId));
    } catch (error) {
      console.error('Failed to destroy zone window:', error);
      // Still remove from UI even if window destruction fails
      onZonesChange(zones.filter(z => z.id !== zoneId));
    }
  };

  const handleAddZone = async () => {
    const nextNumber = zones.length > 0
      ? Math.max(...zones.map(z => z.number)) + 1
      : 1;

    const newZone: Zone = {
      id: generateZoneId(),
      x: 10,
      y: 10,
      width: 30,
      height: 30,
      number: nextNumber,
    };

    // Create the window immediately
    try {
      await invoke('create_zone_window', { zone: newZone });
    } catch (error) {
      console.error('Failed to create zone window:', error);
    }

    onZonesChange([...zones, newZone]);
  };

  // Calculate canvas dimensions based on screen size
  const canvasAspectRatio = screenDimensions 
    ? screenDimensions.width / screenDimensions.height 
    : 16 / 9;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Zones</h3>
        <Button onClick={handleAddZone} size="sm">
          Add Zone
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        Zones appear as draggable and resizable windows on your screen. Drag and resize them directly on the screen.
      </p>

      {zones.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              No zones yet. Click "Add Zone" to create your first zone window on screen.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Mini canvas preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Zone Layout Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="relative border-2 border-border rounded-lg bg-muted/20"
                style={{
                  width: '100%',
                  aspectRatio: canvasAspectRatio,
                  maxWidth: '100%',
                }}
              >
                {zones.map((zone) => (
                  <div
                    key={zone.id}
                    className="absolute border-2 border-primary/50 bg-primary/10 rounded cursor-pointer hover:bg-primary/20 hover:border-primary transition-colors group"
                    style={{
                      left: `${zone.x}%`,
                      top: `${zone.y}%`,
                      width: `${zone.width}%`,
                      height: `${zone.height}%`,
                    }}
                  >
                    <div className="absolute top-1 left-1 bg-primary text-primary-foreground rounded px-1.5 py-0.5 text-xs font-bold">
                      {zone.number}
                    </div>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteZone(zone.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Zone list */}
          <div className="space-y-2">
            {zones.map((zone) => (
              <Card key={zone.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded bg-primary text-primary-foreground text-sm font-bold">
                        {zone.number}
                      </span>
                      Zone {zone.number}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteZone(zone.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div>Position: {zone.x.toFixed(1)}%, {zone.y.toFixed(1)}%</div>
                    <div>Size: {zone.width.toFixed(1)}% × {zone.height.toFixed(1)}%</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

