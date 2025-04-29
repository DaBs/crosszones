import React, { useState, useEffect } from 'react';
import './HotkeySettings.css';
import { invoke } from '@tauri-apps/api/core';

interface HotkeyConfig {
  name: string;
  action: string;
  shortcut: string;
  icon?: string;
  group: string;
}

interface HotkeyGroupProps {
  title: string;
  configs: HotkeyConfig[];
  onShortcutChange: (action: string, shortcut: string) => void;
  onShortcutClear: (action: string) => void;
}

const HOTKEY_GROUPS = {
  WINDOW_POSITION: 'Window Position',
  CORNER_CONTROLS: 'Corner Controls',
  WINDOW_SIZING: 'Window Sizing',
  THIRD_CONTROLS: 'Third Controls',
  FOURTH_CONTROLS: 'Fourth Controls',
  MOVEMENT_CONTROLS: 'Movement Controls',
};

const DEFAULT_HOTKEYS: HotkeyConfig[] = [
  // Window Position
  { name: 'Left Half', action: 'left-half', shortcut: '', icon: '◀', group: HOTKEY_GROUPS.WINDOW_POSITION },
  { name: 'Right Half', action: 'right-half', shortcut: '', icon: '▶', group: HOTKEY_GROUPS.WINDOW_POSITION },
  { name: 'Center Half', action: 'center-half', shortcut: '', icon: '◀▶', group: HOTKEY_GROUPS.WINDOW_POSITION },
  { name: 'Top Half', action: 'top-half', shortcut: '', icon: '▲', group: HOTKEY_GROUPS.WINDOW_POSITION },
  { name: 'Bottom Half', action: 'bottom-half', shortcut: '', icon: '▼', group: HOTKEY_GROUPS.WINDOW_POSITION },

  // Corner Controls
  { name: 'Top Left', action: 'top-left', shortcut: '', icon: '↖', group: HOTKEY_GROUPS.CORNER_CONTROLS },
  { name: 'Top Right', action: 'top-right', shortcut: '', icon: '↗', group: HOTKEY_GROUPS.CORNER_CONTROLS },
  { name: 'Bottom Left', action: 'bottom-left', shortcut: '', icon: '↙', group: HOTKEY_GROUPS.CORNER_CONTROLS },
  { name: 'Bottom Right', action: 'bottom-right', shortcut: '', icon: '↘', group: HOTKEY_GROUPS.CORNER_CONTROLS },

  // Window Sizing
  { name: 'Maximize', action: 'maximize', shortcut: '', icon: '□', group: HOTKEY_GROUPS.WINDOW_SIZING },
  { name: 'Almost Maximize', action: 'almost-maximize', shortcut: '', icon: '▢', group: HOTKEY_GROUPS.WINDOW_SIZING },
  { name: 'Maximize Height', action: 'maximize-height', shortcut: '', icon: '⇕', group: HOTKEY_GROUPS.WINDOW_SIZING },
  { name: 'Make Smaller', action: 'smaller', shortcut: '', icon: '−', group: HOTKEY_GROUPS.WINDOW_SIZING },
  { name: 'Make Larger', action: 'larger', shortcut: '', icon: '+', group: HOTKEY_GROUPS.WINDOW_SIZING },
  { name: 'Center', action: 'center', shortcut: '', icon: '⊟', group: HOTKEY_GROUPS.WINDOW_SIZING },
  { name: 'Center Prominently', action: 'center-prominently', shortcut: '', icon: '⊞', group: HOTKEY_GROUPS.WINDOW_SIZING },
  { name: 'Restore', action: 'restore', shortcut: '', icon: '↺', group: HOTKEY_GROUPS.WINDOW_SIZING },

  // Third Controls
  { name: 'First Third', action: 'first-third', shortcut: '', icon: '|◯', group: HOTKEY_GROUPS.THIRD_CONTROLS },
  { name: 'Center Third', action: 'center-third', shortcut: '', icon: '◯|◯', group: HOTKEY_GROUPS.THIRD_CONTROLS },
  { name: 'Last Third', action: 'last-third', shortcut: '', icon: '◯|', group: HOTKEY_GROUPS.THIRD_CONTROLS },
  { name: 'First Two Thirds', action: 'first-two-thirds', shortcut: '', icon: '||◯', group: HOTKEY_GROUPS.THIRD_CONTROLS },
  { name: 'Last Two Thirds', action: 'last-two-thirds', shortcut: '', icon: '◯||', group: HOTKEY_GROUPS.THIRD_CONTROLS },

  // Fourth Controls
  { name: 'First Fourth', action: 'first-fourth', shortcut: '', icon: '|◯◯◯', group: HOTKEY_GROUPS.FOURTH_CONTROLS },
  { name: 'Second Fourth', action: 'second-fourth', shortcut: '', icon: '◯|◯◯', group: HOTKEY_GROUPS.FOURTH_CONTROLS },
  { name: 'Third Fourth', action: 'third-fourth', shortcut: '', icon: '◯◯|◯', group: HOTKEY_GROUPS.FOURTH_CONTROLS },
  { name: 'Last Fourth', action: 'last-fourth', shortcut: '', icon: '◯◯◯|', group: HOTKEY_GROUPS.FOURTH_CONTROLS },
  { name: 'First Three Fourths', action: 'first-three-fourths', shortcut: '', icon: '|||◯', group: HOTKEY_GROUPS.FOURTH_CONTROLS },
  { name: 'Last Three Fourths', action: 'last-three-fourths', shortcut: '', icon: '◯|||', group: HOTKEY_GROUPS.FOURTH_CONTROLS },

  // Movement Controls
  { name: 'Move Left', action: 'move-left', shortcut: '', icon: '←', group: HOTKEY_GROUPS.MOVEMENT_CONTROLS },
  { name: 'Move Right', action: 'move-right', shortcut: '', icon: '→', group: HOTKEY_GROUPS.MOVEMENT_CONTROLS },
  { name: 'Move Up', action: 'move-up', shortcut: '', icon: '↑', group: HOTKEY_GROUPS.MOVEMENT_CONTROLS },
  { name: 'Move Down', action: 'move-down', shortcut: '', icon: '↓', group: HOTKEY_GROUPS.MOVEMENT_CONTROLS },
  { name: 'Next Display', action: 'next-display', shortcut: '', icon: '⇒', group: HOTKEY_GROUPS.MOVEMENT_CONTROLS },
  { name: 'Previous Display', action: 'previous-display', shortcut: '', icon: '⇐', group: HOTKEY_GROUPS.MOVEMENT_CONTROLS },
];

const HotkeyGroup: React.FC<HotkeyGroupProps> = ({ 
  title, 
  configs, 
  onShortcutChange, 
  onShortcutClear 
}) => {
  const [recording, setRecording] = useState<string | null>(null);

  const handleKeyDown = (e: React.KeyboardEvent, action: string) => {
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
            {config.icon && <span className="hotkey-icon">{config.icon}</span>}
            <span>{config.name}</span>
          </div>
          <div className="hotkey-input-wrapper">
            <input
              type="text"
              value={recording === config.action ? 'Press keys...' : config.shortcut}
              className={`hotkey-input ${recording === config.action ? 'recording' : ''}`}
              readOnly
              placeholder="Record Shortcut"
              onFocus={() => setRecording(config.action)}
              onBlur={() => setRecording(null)}
              onKeyDown={(e) => handleKeyDown(e, config.action)}
            />
            {config.shortcut && (
              <button 
                className="clear-button"
                onClick={() => onShortcutClear(config.action)}
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

  const updateHotkey = (action: string, shortcut: string) => {
    setHotkeys(prev => prev.map(hotkey => 
      hotkey.action === action ? { ...hotkey, shortcut } : hotkey
    ));
  };

  const handleShortcutChange = async (action: string, shortcut: string) => {
    try {
      const existingHotkey = hotkeys.find(h => h.action === action);
      if (existingHotkey) {
        await invoke('unregister_hotkey', { action: existingHotkey.action });
        await invoke('register_hotkey', { shortcut, action });
        updateHotkey(action, shortcut);
      }
    } catch (error) {
      console.error('Failed to register hotkey:', error);
    }
  };

  const handleShortcutClear = async (action: string) => {
    try {
      const existingHotkey = hotkeys.find(h => h.action === action);
      if (existingHotkey) {
        await invoke('unregister_hotkey', { action: existingHotkey.action });
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
      <h2>Window Layout Hotkeys</h2>
      <p>Click on a shortcut field and press the keys you want to use for that action.</p>
      
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