import React, { useEffect, useState } from 'react';
import { getVersion } from '@tauri-apps/api/app';
import { invoke } from '@tauri-apps/api/core';
import { Button } from '@/components/ui/button';
import { getSettings, resetSettings, setSetting, SettingsKey } from '@/lib/store/settings';
import { Settings as SettingsType } from '../../../src-tauri/bindings/Settings';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { showError } from '@/lib/toast';

interface SettingDefinition {
  key: SettingsKey;
  label: string;
  description: string;
  category: string;
  type: 'boolean' | 'string' | 'number';
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
    key: 'show_zone_drag_overlay',
    label: 'Show zone overlay during drag',
    description: 'Show visual zone indicators when dragging a window with the zone modifier key held',
    type: 'boolean',
    category: SettingCategory.Zones
  },
  {
    key: 'zone_overlay_opacity',
    label: 'Zone overlay opacity',
    description: 'Opacity of the zone overlay when dragging (0% = transparent, 100% = solid). Default 25%.',
    type: 'number',
    category: SettingCategory.Zones
  },
];

export const Settings: React.FC = () => {
  const [settings, setSettings] = useState<SettingsType>({} as SettingsType);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState('');


  const loadSettings = async () => {
    try {
      const settings = await getSettings();
      setSettings(Object.fromEntries(settings.map(([key, value]) => [key, value as any])) as SettingsType);
      setLoading(false);
    } catch (error) {
      showError('Failed to load settings', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
    
    getVersion()
      .then(setVersion)
      .catch(error => {
        showError('Failed to load version', error);
      });
  }, []);

  const handleChange = async (key: SettingsKey, value: boolean | string | number) => {
    try {
      await setSetting(key, value);
      setSettings(prev => ({ ...prev, [key]: value }) as SettingsType);
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
                <div key={setting.key} className="flex items-center justify-between gap-4">
                  <div className="space-y-0.5 flex-1 min-w-0">
                    <label className="text-sm font-medium leading-none">
                      {setting.label}
                    </label>
                    <p className="text-sm text-muted-foreground">
                      {setting.description}
                    </p>
                  </div>
                  {setting.type === 'number' ? (
                    <div className="flex items-center gap-2 shrink-0">
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={Number(settings[setting.key]) ?? 0.25}
                        onChange={(e) => handleChange(setting.key, e.target.valueAsNumber)}
                        className="w-24 h-2 rounded-lg appearance-none cursor-pointer bg-secondary accent-primary"
                      />
                      <span className="text-sm tabular-nums w-8">
                        {Math.round(((Number(settings[setting.key]) ?? 0.25) * 100))}%
                      </span>
                    </div>
                  ) : (
                    <Checkbox
                      checked={(setting.key === 'show_zone_drag_overlay' ? (settings[setting.key] ?? true) : settings[setting.key]) as boolean}
                      onCheckedChange={(checked) => handleChange(setting.key, setting.type === 'boolean' ? checked as boolean : checked as string)}
                    />
                  )}
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
                await resetSettings();
                await loadSettings();
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
