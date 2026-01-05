import React, { useEffect, useState } from 'react';
import { getVersion } from '@tauri-apps/api/app';
import { invoke } from '@tauri-apps/api/core';
import { Button } from '@/components/ui/button';
import { getSetting, setSettings as setSettingsStore, SettingsKey } from '@/lib/store/settings';
import { Settings } from '../../src-tauri/bindings/Settings';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { showError } from '@/lib/toast';

interface SettingDefinition {
  key: SettingsKey;
  label: string;
  description: string;
  category: string;
  type: 'boolean' | 'string';
}

enum SettingCategory {
  Application = 'Application',
  Zones = 'Zones',
}

const CATEGORY_LABELS: Record<SettingCategory, string> = {
  [SettingCategory.Application]: 'Application',
  [SettingCategory.Zones]: 'Zones',
};

const SETTINGS_SCHEMA: SettingDefinition[] = [
  {
    key: 'auto_start',
    label: 'Start at startup',
    description: 'Launch CrossZones when you start your computer',
    type: 'boolean',
    category: SettingCategory.Application
  },
  {
    key: 'start_minimized',
    label: 'Start minimized',
    description: 'Start CrossZones in the system tray',
    type: 'boolean',
    category: SettingCategory.Application
  },
  {
    key: 'close_to_system_tray',
    label: 'Close to system tray',
    description: 'Close CrossZones to the system tray',
    type: 'boolean',
    category: SettingCategory.Application
  }, 
  {
    key: 'show_layout_activation_notification',
    label: 'Show layout activation notification',
    description: 'Show a notification when a layout is activated',
    type: 'boolean',
    category: SettingCategory.Zones
  },
  {
    key: 'zone_drag_modifier_key',
    label: 'Zone drag modifier key',
    description: 'The key to hold while dragging a window to show zone overlay',
    type: 'string',
    category: SettingCategory.Zones
  },
];

export const SettingsTab: React.FC = () => {
  const [settings, setSettings] = useState<Settings>({} as Settings);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState('');

  useEffect(() => {
    setLoading(true);
    Promise.all(
      SETTINGS_SCHEMA.map(setting => 
        getSetting(setting.key).then(value => [setting.key, setting.type === 'boolean' ? value : false])
      )
    ).then(results => {
      setSettings(Object.fromEntries(results) as Settings);
      setLoading(false);
    })
    .catch(error => {
      showError('Failed to load settings', error);
      setLoading(false);
    });
    
    getVersion()
      .then(setVersion)
      .catch(error => {
        showError('Failed to load version', error);
      });
  }, []);

  const handleToggle = async (key: SettingsKey, value: boolean | string) => {
    const newSettings = { ...settings, [key]: value };
    try {
      await setSettingsStore(newSettings);
      setSettings(prev => ({ ...prev, [key]: value }));
    } catch (error) {
      showError('Failed to update setting', error);
    }
  };

  const settingsByCategory = SETTINGS_SCHEMA.reduce((acc, setting) => {
    if (!acc[setting.category]) {
      acc[setting.category] = [];
    }
    acc[setting.category].push(setting);
    return acc;
  }, {} as Record<string, SettingDefinition[]>);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex justify-center w-full">
      <div className="space-y-6 max-w-2xl w-full">
        {Object.entries(settingsByCategory).map(([category, categorySettings]) => (
          <Card key={category}>
            <CardHeader>
              <CardTitle>{CATEGORY_LABELS[category as SettingCategory]}</CardTitle>
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
                    onCheckedChange={(checked) => handleToggle(setting.key, setting.type === 'boolean' ? checked as boolean : checked as string)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
        <div className="flex items-center justify-between">
          <Button 
            variant="outline" 
            onClick={async () => {
              try {
                setSettings(prev => ({ ...prev, auto_start: false, start_minimized: false, close_to_system_tray: false, show_layout_activation_notification: false, zone_drag_modifier_key: '' }));
                await setSettingsStore({
                  auto_start: false,
                  start_minimized: false,
                  close_to_system_tray: false,
                  show_layout_activation_notification: false,
                  zone_drag_modifier_key: null,
                });
                // Also clear all hotkeys
                await invoke('clear_all_hotkeys');
              } catch (error) {
                showError('Failed to reset settings', error);
              }
            }}
          >
            Reset settings
          </Button>
          <label className="text-sm font-medium leading-none">Version: {version}</label>
        </div>
      </div>
    </div>
  );
};

