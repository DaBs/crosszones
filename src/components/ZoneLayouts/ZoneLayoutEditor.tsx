import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { type ZoneLayout, type Zone } from '@/types/zoneLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ZoneEditor } from './ZoneEditor';
import { ArrowLeft, Save } from 'lucide-react';
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
  const [zones, setZones] = useState<Zone[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (layout) {
      setName(layout.name);
      setZones([...layout.zones]);
    } else {
      setName('');
      setZones([]);
    }
  }, [layout]);

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Please enter a name for the zone layout');
      return;
    }

    setIsSaving(true);
    try {
      const layoutToSave: ZoneLayout = {
        id: layout?.id || generateLayoutId(),
        name: name.trim(),
        zones: zones.sort((a, b) => a.number - b.number),
      };

      await invoke('save_zone_layout', { layout: layoutToSave });
      onSave();
    } catch (error) {
      console.error('Failed to save zone layout:', error);
      alert('Failed to save zone layout');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = async () => {
    await invoke('destroy_all_zone_windows');
    onBack();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
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
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Zone Editor</CardTitle>
        </CardHeader>
        <CardContent>
          <ZoneEditor
            zones={zones}
            onZonesChange={setZones}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={handleCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isSaving || !name.trim()}>
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Layout'}
        </Button>
      </div>
    </div>
  );
};

