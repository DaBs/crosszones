import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen, emit } from '@tauri-apps/api/event';
import { type ZoneLayout, type Zone } from '@/types/zoneLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Save, Edit } from 'lucide-react';
import { generateLayoutId } from '@/lib/utils';

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

  useEffect(() => {
    if (layout) {
      setName(layout.name);
    } else {
      setName('');
    }
  }, [layout]);

  useEffect(() => {
    // Listen for editor close events
    const setupListener = async () => {
      const unlisten = await listen('editor-closed', () => {
        setEditorOpen(false);
      });
      return unlisten;
    };
    setupListener();
  }, []);

  const handleOpenEditor = async () => {
    if (!name.trim()) {
      alert('Please enter a name for the zone layout first');
      return;
    }

    try {
      const layoutId = layout?.id || generateLayoutId();
      const initialZones = layout?.zones || [];
      
      await invoke('create_zone_editor_windows', {
        layoutId,
        layoutName: name.trim(),
        zones: initialZones,
      });
      
      setEditorOpen(true);
    } catch (error) {
      console.error('Failed to open editor:', error);
      alert('Failed to open zone editor');
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Please enter a name for the zone layout');
      return;
    }

    if (!editorOpen) {
      alert('Please open the editor and create at least one zone');
      return;
    }

    setIsSaving(true);
    try {
      // Request zones from editor if it's still open
      if (editorOpen) {
        await emit('request-zones');
        // Small delay to ensure zones are stored
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Get zones from stored state
      const zones = await invoke<Zone[]>('get_editor_zones');
      
      if (zones.length === 0) {
        alert('Please create at least one zone');
        setIsSaving(false);
        return;
      }

      const layoutToSave: ZoneLayout = {
        id: layout?.id || generateLayoutId(),
        name: name.trim(),
        zones: zones.sort((a, b) => a.number - b.number),
      };

      await invoke('save_zone_layout', { layout: layoutToSave });
      await invoke('destroy_all_editor_windows');
      setEditorOpen(false);
      onSave();
    } catch (error) {
      console.error('Failed to save zone layout:', error);
      alert('Failed to save zone layout');
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
          <CardTitle>Zone Editor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Click the button below to open the fullscreen zone editor on all your screens.
            You'll be able to split zones, merge them, and arrange them visually.
          </p>
          <Button 
            onClick={handleOpenEditor} 
            disabled={!name.trim()}
            className="w-full"
          >
            <Edit className="h-4 w-4 mr-2" />
            Open Zone Editor
          </Button>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={handleCancel}>
          Cancel
        </Button>
        <Button 
          onClick={handleSave} 
          disabled={isSaving || !name.trim() || !editorOpen}
        >
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Layout'}
        </Button>
      </div>
    </div>
  );
};

