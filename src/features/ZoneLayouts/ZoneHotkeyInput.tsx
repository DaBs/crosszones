import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { getShortcutMapping } from '@/features/HotkeySettings/keyMapping';
import { handleHotkeyKeyDown } from '@/features/HotkeySettings/useHotkeyRecording';
import { showError } from '@/lib/toast';

interface ZoneHotkeyInputProps {
  layoutId: string;
  onRefresh?: () => void;
}

export const ZoneHotkeyInput: React.FC<ZoneHotkeyInputProps> = ({ layoutId, onRefresh }) => {
  const [shortcut, setShortcut] = useState<string>('');
  const [recording, setRecording] = useState(false);

  // Create ActivateLayout action payload
  const getActionPayload = () => {
    return { action: 'activate-layout', layout_id: layoutId };
  };

  const loadHotkey = async () => {
    try {
      const allHotkeys = await invoke<[string, string][]>('get_all_hotkeys');
      const actionPayload = getActionPayload();
      const actionJson = JSON.stringify(actionPayload);
      
      // Find hotkey that matches this layout action
      const hotkey = allHotkeys.find(([_shortcut, action]) => action === actionJson);
      setShortcut(hotkey?.[0] || '');
    } catch (error) {
      showError('Failed to load hotkey', error);
    }
  };

  useEffect(() => {
    loadHotkey();
  }, [layoutId]);

  const handleKeyDown = async (e: React.KeyboardEvent) => {
    handleHotkeyKeyDown(
      e,
      async (newShortcut: string) => {
        try {
          // Use new ActionPayload structure
          const action = getActionPayload();
          
          // Unregister existing hotkey for this action if any
          await invoke('unregister_hotkey_action', { action });
          
          // Register new hotkey
          await invoke('register_hotkey_action', { shortcut: newShortcut, action });
          
          setShortcut(newShortcut);
          setRecording(false);
          onRefresh?.();
        } catch (error) {
          showError('Failed to register hotkey', error);
        }
      },
      () => {
        setRecording(false);
      }
    );
  };

  const handleClear = async () => {
    try {
      const action = getActionPayload();
      await invoke('unregister_hotkey_action', { action });
      setShortcut('');
      onRefresh?.();
    } catch (error) {
      showError('Failed to unregister hotkey', error);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <div className="w-40 h-6 relative">
        <Input
          type="text"
          value={recording ? 'Press keys...' : getShortcutMapping(shortcut)}
          className={`w-40 h-6 text-xs select-none ${recording ? 'ring-2 ring-primary' : ''}`}
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
