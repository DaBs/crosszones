import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen, emit } from '@tauri-apps/api/event';
import type { ZoneLayout, Zone } from '@/types/zoneLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Save, Edit } from 'lucide-react';
import { generateLayoutId } from '@/lib/utils';
import { ZonePreviewCanvas } from './ZonePreviewCanvas';
import { showError, showWarning } from '@/lib/toast';

interface ZoneLayoutEditorProps {
  layout: ZoneLayout | null;
  onBack: () => void;
  onSave: () => void;
}

export const ZoneLayoutEditor: React.FC<ZoneLayoutEditorProps> = ({
  layout,
  onBack,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [currentZones, setCurrentZones] = useState<Zone[]>([]);

  useEffect(() => {
    if (layout) {
      setName(layout.name);
      setCurrentZones(layout.zones);
    } else {
      setName('');
      setCurrentZones([]);
    }
  }, [layout]);

  useEffect(() => {
    // Listen for zone update events when editor is open
    if (!editorOpen) return;

    let unlistenFn: (() => void) | null = null;

    const setupListener = async () => {
      const unlisten = await listen<Zone[]>('zones-updated', (event) => {
        setCurrentZones(event.payload);
      });
      unlistenFn = unlisten;
    };

    setupListener();

    return () => {
      if (unlistenFn) {
        unlistenFn();
      }
    };
  }, [editorOpen]);

  useEffect(() => {
    // Listen for editor close events
    const setupListener = async () => {
      const unlisten = await listen('editor-closed', async () => {
        setEditorOpen(false);
        // Update zones from stored state when editor closes
        try {
          const zones = await invoke<Zone[]>('get_editor_zones');
          setCurrentZones(zones);
        } catch (error) {
          showError('Failed to get editor zones', error);
        }
      });
      return unlisten;
    };
    setupListener();
  }, []);

  const handleOpenEditor = async () => {
    if (!name.trim()) {
      showWarning('Please enter a name for the zone layout first');
      return;
    }

    try {
      const layoutId = layout?.id || generateLayoutId();
      const initialZones = currentZones.length > 0 ? currentZones : (layout?.zones || []);
      
      await invoke('create_zone_editor_windows', {
        layoutId,
        layoutName: name.trim(),
        zones: initialZones,
      });
      
      setEditorOpen(true);
      // Update zones from stored state after opening
      setTimeout(async () => {
        try {
          const zones = await invoke<Zone[]>('get_editor_zones');
          if (zones.length > 0) {
            setCurrentZones(zones);
          }
        } catch (error) {
          showError('Failed to get editor zones', error);
        }
      }, 500);
    } catch (error) {
      showError('Failed to open zone editor', error);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      showWarning('Please enter a name for the zone layout');
      return;
    }

    if (currentZones.length === 0) {
      showWarning('Please open the editor and create at least one zone');
      return;
    }

    setIsSaving(true);
    try {
      // Request zones from editor if it's still open
      if (editorOpen) {
        await emit('request-zones');
        
        // Get latest zones from stored state
        const zones = await invoke<Zone[]>('get_editor_zones');
        if (zones.length > 0) {
          setCurrentZones(zones);
        }
      }

      // Get screen dimensions - use stored layout's dimensions if available, otherwise get from first screen
      let screenWidth = layout?.screenWidth;
      let screenHeight = layout?.screenHeight;
      
      if (!screenWidth || !screenHeight) {
        try {
          const screens = await invoke<Array<{ width: number; height: number }>>('get_all_screens');
          if (screens.length > 0) {
            screenWidth = screens[0].width;
            screenHeight = screens[0].height;
          }
        } catch (error) {
          showError('Failed to get screen dimensions', error);
          // Use existing layout dimensions or leave undefined
        }
      }

      const layoutToSave: ZoneLayout = {
        id: layout?.id || generateLayoutId(),
        name: name.trim(),
        zones: currentZones.sort((a, b) => a.number - b.number),
        screenWidth: screenWidth ?? null,
        screenHeight: screenHeight ?? null,
      };

      await invoke('save_zone_layout', { layout: layoutToSave });
      await invoke('destroy_all_editor_windows');
      setEditorOpen(false);
      onSave();
    } catch (error) {
      showError('Failed to save zone layout', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = async () => {
    await invoke('destroy_all_editor_windows');
    setEditorOpen(false);
    onBack();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={handleCancel}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-2xl font-semibold">
          {layout ? 'Edit Zone Layout' : 'New Zone Layout'}
        </h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Layout Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Layout Name
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter layout name..."
              disabled={editorOpen}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Zone Preview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentZones.length > 0 ? (
            <div className="flex justify-center">
              <ZonePreviewCanvas 
                zones={currentZones} 
                width={450}
                screenWidth={layout?.screenWidth ?? undefined}
                screenHeight={layout?.screenHeight ?? undefined}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm text-muted-foreground mb-4">
                No zones yet. Open the zone editor to create zones.
              </p>
              <Button 
                onClick={handleOpenEditor} 
                disabled={!name.trim()}
              >
                <Edit className="h-4 w-4 mr-2" />
                Open Zone Editor
              </Button>
            </div>
          )}
          {currentZones.length > 0 && (
            <div className="flex justify-center">
              <Button 
                onClick={handleOpenEditor} 
                disabled={!name.trim()}
                variant="outline"
                className="w-full"
              >
                <Edit className="h-4 w-4 mr-2" />
                {editorOpen ? 'Zone Editor Open' : 'Open Zone Editor'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={handleCancel}>
          Cancel
        </Button>
        <Button 
          onClick={handleSave} 
          disabled={isSaving || !name.trim()}
        >
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Layout'}
        </Button>
      </div>
    </div>
  );
};

