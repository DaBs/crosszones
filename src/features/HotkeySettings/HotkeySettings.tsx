import React, { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { AVAILABLE_HOTKEYS, HOTKEY_GROUPS } from './constants';
import { type LayoutAction } from '@/types/snapping';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { HotkeyConfigComponent } from './HotkeyConfig';
import { type HotkeyConfig, serializeLayoutAction, createActionPayload } from './types';
import { handleHotkeyKeyDown } from './useHotkeyRecording';
import { showError } from '@/lib/toast';

interface HotkeyGroupProps {
  title: string;
  configs: HotkeyConfig[];
  onShortcutChange: (config: HotkeyConfig, shortcut: string) => void;
  onShortcutClear: (config: HotkeyConfig) => void;
  spanFullWidth?: boolean;
}

const HotkeyGroup: React.FC<HotkeyGroupProps> = ({ 
  title, 
  configs, 
  onShortcutChange, 
  onShortcutClear,
  spanFullWidth = false
}) => {
  const [recording, setRecording] = useState<string | null>(null);

  const handleKeyDown = (e: React.KeyboardEvent, config: HotkeyConfig) => {
    handleHotkeyKeyDown(
      e,
      (shortcut: string) => {
        onShortcutChange(config, shortcut);
        setRecording(null);
      },
      () => {
        setRecording(null);
      }
    );
  };

  const getRecordingKey = (config: HotkeyConfig): string | null => {
    if (config.zoneNumber !== undefined) {
      return `zone-${config.zoneNumber}`;
    }
    return config.layoutAction || null;
  };

  return (
    <Card className={`w-full ${spanFullWidth ? 'col-span-2' : ''}`}>
      <CardHeader className="p-3 pb-1">
        <CardTitle className="text-sm font-medium select-none">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-1">
        <div className="grid grid-cols-2 gap-2">
          {configs.map((config, index) => (
            <HotkeyConfigComponent 
              key={index} 
              config={config} 
              index={index} 
              recording={recording === getRecordingKey(config)} 
              setRecording={(rec) => setRecording(rec ? getRecordingKey(config) : null)} 
              onShortcutClear={() => onShortcutClear(config)} 
              handleKeyDown={(e) => handleKeyDown(e, config)} 
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export const HotkeySettings: React.FC = () => {
  const [hotkeys, setHotkeys] = useState<HotkeyConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const updateHotkey = (config: HotkeyConfig, shortcut: string) => {
    setHotkeys(prev => prev.map(hotkey => {
      if (config.zoneNumber !== undefined && hotkey.zoneNumber === config.zoneNumber) {
        return { ...hotkey, shortcut };
      }
      if (config.layoutAction && hotkey.layoutAction === config.layoutAction) {
        return { ...hotkey, shortcut };
      }
      return hotkey;
    }));
  };

  const handleShortcutChange = async (config: HotkeyConfig, shortcut: string) => {
    try {
      // Create the action payload with consistent structure
      const actionPayload = createActionPayload(config);
      if (!actionPayload) {
        return;
      }

      // Unregister existing hotkey for this action
      await invoke('unregister_hotkey_action', { action: actionPayload });
      
      // Register new hotkey
      await invoke('register_hotkey_action', { shortcut, action: actionPayload });
      
      updateHotkey(config, shortcut);
    } catch (error) {
      showError('Failed to register hotkey', error);
    }
  };

  const handleShortcutClear = async (config: HotkeyConfig) => {
    try {
      // Create the action payload with consistent structure
      const actionPayload = createActionPayload(config);
      if (!actionPayload) {
        return;
      }

      await invoke('unregister_hotkey_action', { action: actionPayload });
      updateHotkey(config, '');
    } catch (error) {
      showError('Failed to clear hotkey', error);
    }
  };

  const groupedHotkeys = Object.values(HOTKEY_GROUPS).map(group => ({
    title: group,
    configs: hotkeys.filter(hotkey => hotkey.group === group)
  }));

  useEffect(() => {
    const loadHotkeys = async () => {
      try {
        const existingHotkeys = await invoke('get_all_hotkeys') as [string, string][];

        const mappedHotkeys = AVAILABLE_HOTKEYS.map(hotkey => {
          const serializedAction = serializeLayoutAction(hotkey.layoutAction, hotkey.zoneNumber);
          const existingHotkey = existingHotkeys.find(h => h[1] === serializedAction);
          return {
            ...hotkey,
            shortcut: existingHotkey?.[0] || ''
          };
        });

        setHotkeys(mappedHotkeys);
        setIsLoading(false);
      } catch (error) {
        showError('Failed to load hotkeys', error);
        setIsLoading(false);
      }
    };

    loadHotkeys();
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="w-full">
            <CardHeader className="p-3 pb-1">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent className="p-3 pt-1">
              <div className="grid grid-cols-2 gap-2">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="flex items-center gap-2">
                    <Skeleton className="h-5 w-5 rounded" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-7 w-32 ml-auto" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {groupedHotkeys.map(({ title, configs }) => (
        <HotkeyGroup
          key={title}
          title={title}
          configs={configs}
          onShortcutChange={handleShortcutChange}
          onShortcutClear={handleShortcutClear}
          spanFullWidth={title === HOTKEY_GROUPS.CUSTOM_LAYOUT_ZONES}
        />
      ))}
    </div>
  );
};

export default HotkeySettings; 