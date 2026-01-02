import React, { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { ZoneLayout } from '@/types/zoneLayout';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { ZonePreviewCanvas } from './ZonePreviewCanvas';
import { ZoneHotkeyInput } from './ZoneHotkeyInput';
import { DeleteConfirmDialog } from './ZoneEditor/DeleteConfirmDialog';
import { useActiveLayout } from './hooks/useActiveLayout';
import { showError } from '@/lib/toast';

interface ZoneLayoutListProps {
  layouts: ZoneLayout[];
  onLayoutSelect: (layout: ZoneLayout) => void;
  onNewLayout: () => void;
  onRefresh: () => void;
}

export const ZoneLayoutList: React.FC<ZoneLayoutListProps> = ({
  layouts,
  onLayoutSelect,
  onNewLayout,
  onRefresh,
}) => {
  const [hotkeyRefreshKey, setHotkeyRefreshKey] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [layoutToDelete, setLayoutToDelete] = useState<string | null>(null);
  const activeLayoutId = useActiveLayout();

  const handleHotkeyRefresh = () => {
    setHotkeyRefreshKey(prev => prev + 1);
  };

  const handleDeleteClick = (layoutId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLayoutToDelete(layoutId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!layoutToDelete) return;
    
    try {
      await invoke('delete_zone_layout', { layoutId: layoutToDelete });
      onRefresh();
      setDeleteDialogOpen(false);
      setLayoutToDelete(null);
    } catch (error) {
      showError('Failed to delete zone layout', error);
      setDeleteDialogOpen(false);
      setLayoutToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setLayoutToDelete(null);
  };

  return (
    <>
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
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
          {layouts.map((layout) => {
            const isActive = activeLayoutId === layout.id;
            return (
            <Card
              key={layout.id}
              className={`cursor-pointer hover:shadow-md transition-shadow ${
                isActive ? 'bg-primary' : ''
              }`}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className={`${isActive ? 'text-primary-foreground' : ''}`}>{layout.name}</span>
                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onLayoutSelect(layout)}
                    >
                      <Edit2 className={`h-4 w-4 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => handleDeleteClick(layout.id, e)}
                    >
                      <Trash2 className={`h-4 w-4 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                    </Button>
                  </div>
                </CardTitle>
                <CardDescription className={`${isActive ? 'text-primary-foreground' : ''}`}>
                  {layout.zones.length} zone{layout.zones.length !== 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              {layout.zones.length > 0 && (
                <CardContent className="space-y-3">
                  <ZonePreviewCanvas 
                    zones={layout.zones} 
                    screenWidth={layout.screenWidth ?? undefined}
                    screenHeight={layout.screenHeight ?? undefined}
                  />
                  <div className="space-y-2 pt-2 border-t">
                    <div className="flex items-center justify-between text-xs">
                      <span className={`font-medium ${isActive ? 'text-primary-foreground' : 'text-muted-foreground'}`}>Activate Layout</span>
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
            );
          })}
        </div>
      )}
      </div>
    </>
  );
};

