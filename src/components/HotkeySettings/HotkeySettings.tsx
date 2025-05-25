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
    <Card className="max-w-md w-full">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <div className="space-y-1">
          {configs.map((config, index) => (
            <div key={index} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {config.layoutAction && (
                  <div className="flex items-center justify-center w-6 h-6 rounded-md bg-muted">
                    <WindowSnapIcon action={config.layoutAction} width={16} height={12} />
                  </div>
                )}
                <span className="font-medium text-sm">{config.name}</span>
              </div>
              <div className="flex items-center gap-1">
                <Input
                  type="text"
                  value={recording === config.layoutAction ? 'Press keys...' : config.shortcut}
                  className={`w-40 h-8 text-sm ${recording === config.layoutAction ? 'ring-2 ring-primary' : ''}`}
                  readOnly
                  placeholder="Record Shortcut"
                  onFocus={() => config.layoutAction && setRecording(config.layoutAction)}
                  onBlur={() => setRecording(null)}
                  onKeyDown={(e) => config.layoutAction && handleKeyDown(e, config.layoutAction)}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
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
      <div className="flex flex-wrap justify-center gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="w-[300px]">
            <CardHeader className="p-4 pb-2">
              <Skeleton className="h-5 w-24" />
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <div className="space-y-2">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="flex items-center justify-between gap-2">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-8 w-40" />
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
    <div className="flex flex-wrap justify-center gap-4">
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