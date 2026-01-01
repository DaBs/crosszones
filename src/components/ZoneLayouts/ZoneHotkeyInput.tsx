import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { getShortcutMapping } from '@/components/HotkeySettings/keyMapping';

interface ZoneHotkeyInputProps {
  layoutId: string;
  onRefresh?: () => void;
}

export const ZoneHotkeyInput: React.FC<ZoneHotkeyInputProps> = ({ layoutId, onRefresh }) => {
  const [shortcut, setShortcut] = useState<string>('');
  const [recording, setRecording] = useState(false);

  // Create ActivateLayout action as JSON string (serde uses kebab-case: activate-layout)
  const getActionJson = () => {
    return JSON.stringify({ "activate-layout": layoutId });
  };

  const loadHotkey = async () => {
    try {
      const allHotkeys = await invoke<[string, string][]>('get_all_hotkeys');
      const actionJson = getActionJson();
      
      // Find hotkey that matches this layout action
      const hotkey = allHotkeys.find(([_shortcut, action]) => action === actionJson);
      setShortcut(hotkey?.[0] || '');
    } catch (error) {
      console.error('Failed to load hotkey:', error);
    }
  };

  useEffect(() => {
    loadHotkey();
  }, [layoutId]);

  const handleKeyDown = async (e: React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.key === 'Escape') {
      setRecording(false);
      return;
    }

    const modifiers = [];
    if (e.ctrlKey) modifiers.push('control');
    if (e.altKey) modifiers.push('alt');
    if (e.shiftKey) modifiers.push('shift');
    if (e.metaKey) modifiers.push('super');

    if (!['control', 'alt', 'shift', 'super'].includes(e.key)) {
      modifiers.push(e.code);
    }

    if (modifiers.length > 0) {
      const newShortcut = modifiers.join('+');
      try {
        // Pass action as object that serde will deserialize (kebab-case: activate-layout)
        const action = { "activate-layout": layoutId };
        
        // Unregister existing hotkey for this action if any
        await invoke('unregister_hotkey_action', { action });
        
        // Register new hotkey
        await invoke('register_hotkey_action', { shortcut: newShortcut, action });
        
        setShortcut(newShortcut);
        setRecording(false);
        onRefresh?.();
      } catch (error) {
        console.error('Failed to register hotkey:', error);
      }
    }
  };

  const handleClear = async () => {
    try {
      const action = { "activate-layout": layoutId };
      await invoke('unregister_hotkey_action', { action });
      setShortcut('');
      onRefresh?.();
    } catch (error) {
      console.error('Failed to unregister hotkey:', error);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <div className="w-28 h-6 relative">
        <Input
          type="text"
          value={recording ? 'Press keys...' : getShortcutMapping(shortcut)}
          className={`w-28 h-6 text-xs select-none ${recording ? 'ring-2 ring-primary' : ''}`}
          readOnly
          placeholder="No shortcut"
          onFocus={() => setRecording(true)}
          onBlur={() => setRecording(false)}
          onKeyDown={handleKeyDown}
        />
      </div>
      <Button
        variant="outline"
        disabled={!shortcut}
        size="icon"
        className={`h-6 w-6 ${!shortcut ? 'invisible' : ''}`}
        onClick={handleClear}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
};
