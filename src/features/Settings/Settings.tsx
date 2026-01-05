import React, { useEffect, useState } from 'react';
import { getVersion } from '@tauri-apps/api/app';
import { invoke } from '@tauri-apps/api/core';
import { Button } from '@/components/ui/button';
import { getSetting, setSettings as setSettingsStore, SettingsKey } from '../../lib/store/settings';
import { Settings } from '../../../src-tauri/bindings/Settings';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SettingsOverlayProps {
  open: boolean;
}

interface SettingDefinition {
  key: SettingsKey;
  label: string;
  description: string;
  category: string;
}

const SETTINGS_SCHEMA: SettingDefinition[] = [
  {
    key: 'auto_start',
    label: 'Start at startup',
    description: 'Launch CrossZones when you start your computer',
    category: 'Application'
  },
  {
    key: 'start_minimized',
    label: 'Start minimized',
    description: 'Start CrossZones in the system tray',
    category: 'Application'
  },
  {
    key: 'close_to_system_tray',
    label: 'Close to system tray',
    description: 'Close CrossZones to the system tray',
    category: 'Application'
  },
  {
    key: 'show_layout_activation_notification',
    label: 'Show layout activation notification',
    description: 'Show a notification when switching zone layouts',
    category: 'Zones'
  }
];

export const SettingsOverlay: React.FC<SettingsOverlayProps> = ({ open }) => {
  const [settings, setSettings] = useState<Settings>({} as Settings);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState('');

  useEffect(() => {
    if (open) {
      setLoading(true);
      Promise.all(
        SETTINGS_SCHEMA.map(setting => 
          getSetting(setting.key).then(value => [setting.key, value as boolean])
        )
      ).then(results => {
        setSettings(Object.fromEntries(results) as Settings);
        setLoading(false);
      });
      getVersion().then(setVersion);  
    }
  }, [open]);

  const handleToggle = async (key: SettingsKey, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    await setSettingsStore(newSettings);
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const settingsByCategory = SETTINGS_SCHEMA.reduce((acc, setting) => {
    if (!acc[setting.category]) {
      acc[setting.category] = [];
    }
    acc[setting.category].push(setting);
    return acc;
  }, {} as Record<string, SettingDefinition[]>);

  if (!open) return null;

  return (
    <div className="fixed mt-8 inset-0 z-50 bg-background">
      {/* Content */}
      <div className="container mx-auto p-6 max-w-2xl pt-16">
        {loading ? (
          <div>Loading...</div>
        ) : (
          <div className="space-y-6">
            {Object.entries(settingsByCategory).map(([category, categorySettings]) => (
              <Card key={category}>
                <CardHeader>
                  <CardTitle>{category}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {categorySettings.map(setting => (
                    <div key={setting.key} className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <label className="text-sm font-medium leading-none">
                          {setting.label}
                        </label>
                        <p className="text-sm text-muted-foreground">
                          {setting.description}
                        </p>
                      </div>
                      <Checkbox
                        checked={settings[setting.key] as boolean}
                        onCheckedChange={(checked) => handleToggle(setting.key, checked as boolean)}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      <div className="container mx-auto p-6 max-w-2xl pt-16">
        <Button variant="outline" onClick={async () => {
          setSettings(prev => ({ ...prev, auto_start: false, start_minimized: false, close_to_system_tray: false, show_layout_activation_notification: false, zone_drag_modifier_key: null }));
          await setSettingsStore({
            auto_start: false,
            start_minimized: false,
            close_to_system_tray: false,
            show_layout_activation_notification: false,
            zone_drag_modifier_key: null,
          });
          // Also clear all hotkeys
          await invoke('clear_all_hotkeys');
        }}>Reset settings</Button>
      </div>
      <div className="container mx-auto p-6 max-w-2xl pt-16">
        <label className="text-sm font-medium leading-none">Version: {version}</label>
      </div>
    </div>
  );
};
