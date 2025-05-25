import React, { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { AVAILABLE_HOTKEYS, HOTKEY_GROUPS } from './constants';
import { HotkeyConfig } from './types';
import { WindowSnapIcon } from '../WindowSnapIcon';
import { LayoutAction } from '../../types/snapping';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { X } from "lucide-react";

interface HotkeyGroupProps {
  title: string;
  configs: HotkeyConfig[];
  onShortcutChange: (action: LayoutAction, shortcut: string) => void;
  onShortcutClear: (action: LayoutAction) => void;
}

const HotkeyGroup: React.FC<HotkeyGroupProps> = ({ 
  title, 
  configs, 
  onShortcutChange, 
  onShortcutClear 
}) => {
  const [recording, setRecording] = useState<LayoutAction | null>(null);

  const handleKeyDown = (e: React.KeyboardEvent, action: LayoutAction) => {
    e.preventDefault();
    
    if (e.key === 'Escape') {
      setRecording(null);
      return;
    }
    
    const modifiers = [];
    if (e.ctrlKey) modifiers.push('control');
    if (e.altKey) modifiers.push('alt');
    if (e.shiftKey) modifiers.push('shift');
    if (e.metaKey) modifiers.push('meta');
    
    if (!['control', 'alt', 'shift', 'meta'].includes(e.key)) {
      modifiers.push(e.key);
    }
    
    if (modifiers.length > 0) {
      const shortcut = modifiers.join('+');
      onShortcutChange(action, shortcut);
      setRecording(null);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="p-3 pb-1">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-1">
        <div className="grid grid-cols-2 gap-2">
          {configs.map((config, index) => (
            <div key={index} className="flex items-center gap-2">
              {config.layoutAction && (
                <div className="flex items-center justify-center w-5 h-5 rounded bg-muted shrink-0">
                  <WindowSnapIcon action={config.layoutAction} width={14} height={10} />
                </div>
              )}
              <span className="text-xs">{config.name}</span>
              <div className="flex items-center gap-1 ml-auto">
                <Input
                  type="text"
                  value={recording === config.layoutAction ? 'Press keys...' : config.shortcut}
                  className={`w-32 h-7 text-xs ${recording === config.layoutAction ? 'ring-2 ring-primary' : ''}`}
                  readOnly
                  placeholder="Record shortcut"
                  onFocus={() => config.layoutAction && setRecording(config.layoutAction)}
                  onBlur={() => setRecording(null)}
                  onKeyDown={(e) => config.layoutAction && handleKeyDown(e, config.layoutAction)}
                />
                <Button
                  variant="outline"
                  disabled={!config.shortcut}
                  size="icon"
                  className={`h-7 w-7 ${!config.shortcut ? 'invisible' : ''}`}
                  onClick={() => config.layoutAction && onShortcutClear(config.layoutAction)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export const HotkeySettings: React.FC = () => {
  const [hotkeys, setHotkeys] = useState<HotkeyConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const updateHotkey = (action: LayoutAction, shortcut: string) => {
    setHotkeys(prev => prev.map(hotkey => 
      hotkey.layoutAction === action ? { ...hotkey, shortcut } : hotkey
    ));
  };

  const handleShortcutChange = async (action: LayoutAction, shortcut: string) => {
    try {
      const existingHotkey = hotkeys.find(h => h.layoutAction === action);
      if (existingHotkey) {
        await invoke('unregister_hotkey_action', { action });
        await invoke('register_hotkey_action', { shortcut, action });
        updateHotkey(action, shortcut);
      }
    } catch (error) {
      console.error('Failed to register hotkey:', error);
    }
  };

  const handleShortcutClear = async (action: LayoutAction) => {
    try {
      const existingHotkey = hotkeys.find(h => h.layoutAction === action);
      if (existingHotkey) {
        await invoke('unregister_hotkey_action', { action });
        updateHotkey(action, '');
      }
    } catch (error) {
      console.error('Failed to unregister hotkey:', error);
    }
  };

  const groupedHotkeys = Object.values(HOTKEY_GROUPS).map(group => ({
    title: group,
    configs: hotkeys.filter(hotkey => hotkey.group === group)
  }));

  useEffect(() => {
    const loadHotkeys = async () => {
      const existingHotkeys = await invoke('get_all_hotkeys') as [string, string][];

      const mappedHotkeys = AVAILABLE_HOTKEYS.map(hotkey => {
        const existingHotkey = existingHotkeys.find(h => h[1] === hotkey.layoutAction?.toString());
        return {
          ...hotkey,
          shortcut: existingHotkey?.[0] || ''
        };
      });

      setHotkeys(mappedHotkeys);
      setIsLoading(false);
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
        />
      ))}
    </div>
  );
};

export default HotkeySettings; 