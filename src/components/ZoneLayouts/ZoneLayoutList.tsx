import React, { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { type ZoneLayout } from '@/types/zoneLayout';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { ZonePreviewCanvas } from './ZonePreviewCanvas';
import { ZoneHotkeyInput } from './ZoneHotkeyInput';

interface ZoneLayoutListProps {
  layouts: ZoneLayout[];
  onLayoutSelect: (layout: ZoneLayout) => void;
  onLayoutDelete: (layoutId: string) => void;
  onNewLayout: () => void;
  onRefresh: () => void;
}

export const ZoneLayoutList: React.FC<ZoneLayoutListProps> = ({
  layouts,
  onLayoutSelect,
  onLayoutDelete,
  onNewLayout,
  onRefresh,
}) => {
  const [hotkeyRefreshKey, setHotkeyRefreshKey] = useState(0);

  const handleHotkeyRefresh = () => {
    setHotkeyRefreshKey(prev => prev + 1);
  };

  const handleDelete = async (layoutId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this zone layout?')) {
      try {
        await invoke('delete_zone_layout', { layoutId });
        onRefresh();
      } catch (error) {
        console.error('Failed to delete zone layout:', error);
        alert('Failed to delete zone layout');
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Zone Layouts</h2>
        <Button onClick={onNewLayout}>
          <Plus className="h-4 w-4 mr-2" />
          New Layout
        </Button>
      </div>

      {layouts.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              No zone layouts yet. Create one to get started!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-4">
          {layouts.map((layout) => (
            <Card
              key={layout.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{layout.name}</span>
                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onLayoutSelect(layout)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => handleDelete(layout.id, e)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
                <CardDescription>
                  {layout.zones.length} zone{layout.zones.length !== 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              {layout.zones.length > 0 && (
                <CardContent className="space-y-3">
                  <ZonePreviewCanvas 
                    zones={layout.zones} 
                    screenWidth={layout.screenWidth}
                    screenHeight={layout.screenHeight}
                  />
                  <div className="space-y-2 pt-2 border-t">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-muted-foreground">Activate Layout</span>
                      <ZoneHotkeyInput 
                        key={`${layout.id}-${hotkeyRefreshKey}`}
                        layoutId={layout.id} 
                        onRefresh={handleHotkeyRefresh}
                      />
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

