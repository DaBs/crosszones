import React, { useState } from 'react';
import './HotkeySettings.css';
import { invoke } from '@tauri-apps/api/core';
import { DEFAULT_HOTKEYS, HOTKEY_GROUPS } from './constants';
import { HotkeyConfig } from './types';
import { WindowSnapIcon } from '../WindowSnapIcon';
import { LayoutAction } from '../../types/snapping';

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
    if (e.ctrlKey) modifiers.push('Ctrl');
    if (e.altKey) modifiers.push('Alt');
    if (e.shiftKey) modifiers.push('Shift');
    if (e.metaKey) modifiers.push('Meta');
    
    if (!['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) {
      modifiers.push(e.key);
    }
    
    if (modifiers.length > 0) {
      const shortcut = modifiers.join('+');
      onShortcutChange(action, shortcut);
      setRecording(null);
    }
  };

  return (
    <div className="hotkey-group">
      <h3>{title}</h3>
      {configs.map((config, index) => (
        <div key={index} className="hotkey-row">
          <div className="hotkey-label">
            {config.layoutAction && (
              <div className="hotkey-label-icon">
                <WindowSnapIcon action={config.layoutAction} width={30} />
              </div>
            )}
            <span className="hotkey-label-text">{config.name}</span>
          </div>
          <div className="hotkey-input-wrapper">
            <input
              type="text"
              value={recording === config.layoutAction ? 'Press keys...' : config.shortcut}
              className={`hotkey-input ${recording === config.layoutAction ? 'recording' : ''}`}
              readOnly
              placeholder="Record Shortcut"
              onFocus={() => config.layoutAction && setRecording(config.layoutAction)}
              onBlur={() => setRecording(null)}
              onKeyDown={(e) => config.layoutAction && handleKeyDown(e, config.layoutAction)}
            />
            {config.shortcut && (
              <button 
                className="clear-button"
                onClick={() => config.layoutAction && onShortcutClear(config.layoutAction)}
              >
                x
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export const HotkeySettings: React.FC = () => {
  const [hotkeys, setHotkeys] = useState<HotkeyConfig[]>(DEFAULT_HOTKEYS);

  const updateHotkey = (action: LayoutAction, shortcut: string) => {
    setHotkeys(prev => prev.map(hotkey => 
      hotkey.layoutAction === action ? { ...hotkey, shortcut } : hotkey
    ));
  };

  const handleShortcutChange = async (action: LayoutAction, shortcut: string) => {
    try {
      const existingHotkey = hotkeys.find(h => h.layoutAction === action);
      if (existingHotkey) {
        await invoke('unregister_hotkey', { action });
        await invoke('register_hotkey', { shortcut, action });
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
        await invoke('unregister_hotkey', { action });
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

  return (
    <div className="hotkey-settings">      
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