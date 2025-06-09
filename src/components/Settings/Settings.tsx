import React, { useEffect, useState } from 'react';
import { Button } from '../ui/button';
import { X } from 'lucide-react';
import { getSetting, setSetting } from '../../lib/store/settings';
import { Checkbox } from '../ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface SettingsOverlayProps {
  open: boolean;
  onClose: () => void;
}

type SettingKey = 'startAtStartup' | 'startMinimized' | 'closeToSystemTray';

interface SettingDefinition {
  key: SettingKey;
  label: string;
  description: string;
  category: string;
}

const SETTINGS_SCHEMA: SettingDefinition[] = [
  {
    key: 'startAtStartup',
    label: 'Start at startup',
    description: 'Launch CrossZones when you start your computer',
    category: 'Application'
  },
  {
    key: 'startMinimized',
    label: 'Start minimized',
    description: 'Start CrossZones in the system tray',
    category: 'Application'
  },
  {
    key: 'closeToSystemTray',
    label: 'Close to system tray',
    description: 'Close CrossZones to the system tray',
    category: 'Application'
  }
];

export const SettingsOverlay: React.FC<SettingsOverlayProps> = ({ open, onClose }) => {
  const [settings, setSettings] = useState<Record<SettingKey, boolean>>({} as Record<SettingKey, boolean>);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      setLoading(true);
      Promise.all(
        SETTINGS_SCHEMA.map(setting => 
          getSetting(setting.key).then(value => [setting.key, value as boolean])
        )
      ).then(results => {
        setSettings(Object.fromEntries(results) as Record<SettingKey, boolean>);
        setLoading(false);
      });
    }
  }, [open]);

  const handleToggle = async (key: SettingKey, value: boolean) => {
    await setSetting(key, value);
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
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4"
        onClick={onClose}
        aria-label="Close settings"
      >
        <X className="w-4 h-4" />
      </Button>

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
                        checked={settings[setting.key]}
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
    </div>
  );
};
