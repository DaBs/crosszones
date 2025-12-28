import React, { useEffect, useState } from 'react';
import { getVersion } from '@tauri-apps/api/app';
import { Button } from '@/components/ui/button';
import { getSetting, setSettings as setSettingsStore, SettingsKey } from '@/lib/store/settings';
import { Settings } from '../../src-tauri/bindings/Settings';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
  }
];

export const SettingsTab: React.FC = () => {
  const [settings, setSettings] = useState<Settings>({} as Settings);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState('');

  useEffect(() => {
    setLoading(true);
    Promise.all(
      SETTINGS_SCHEMA.map(setting => 
        getSetting(setting.key).then(value => [setting.key, typeof value === 'boolean' ? value : false])
      )
    ).then(results => {
      setSettings(Object.fromEntries(results) as Settings);
      setLoading(false);
    })
    .catch(error => {
      console.error('Failed to load settings:', error);
      setLoading(false);
    });
    getVersion().then(setVersion);  
  }, []);

  const handleToggle = async (key: SettingsKey, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    try {
      await setSettingsStore(newSettings);
      setSettings(prev => ({ ...prev, [key]: value }));
    } catch (error) {
      console.error('Failed to update setting:', error);
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
                    checked={settings[setting.key]}
                    onCheckedChange={(checked) => {
                      if (typeof checked === 'boolean') {
                        handleToggle(setting.key, checked);
                      }
                    }}
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
              setSettings(prev => ({ ...prev, auto_start: false, start_minimized: false, close_to_system_tray: false }));
              await setSettingsStore({
                auto_start: false,
                start_minimized: false,
                close_to_system_tray: false,
              });
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

