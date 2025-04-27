import React, { useState, useEffect } from 'react';
import './HotkeySettings.css';
import { invoke } from '@tauri-apps/api/core';

interface HotkeyConfig {
  name: string;
  action: string;
  shortcut: string;
  icon?: string;
}

interface HotkeyGroupProps {
  title: string;
  configs: HotkeyConfig[];
  onShortcutChange: (action: string, shortcut: string) => void;
  onShortcutClear: (action: string) => void;
}

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
    
    // Only add the key if it's not a modifier
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
  const [windowControls, setWindowControls] = useState<HotkeyConfig[]>([
    { name: 'Left Half', action: 'left-half', shortcut: '', icon: '◀' },
    { name: 'Right Half', action: 'right-half', shortcut: '', icon: '▶' },
    { name: 'Center Half', action: 'center-half', shortcut: '', icon: '◀▶' },
    { name: 'Top Half', action: 'top-half', shortcut: '', icon: '▲' },
    { name: 'Bottom Half', action: 'bottom-half', shortcut: '', icon: '▼' },
  ]);

  const [cornerControls, setCornerControls] = useState<HotkeyConfig[]>([
    { name: 'Top Left', action: 'top-left', shortcut: '', icon: '↖' },
    { name: 'Top Right', action: 'top-right', shortcut: '', icon: '↗' },
    { name: 'Bottom Left', action: 'bottom-left', shortcut: '', icon: '↙' },
    { name: 'Bottom Right', action: 'bottom-right', shortcut: '', icon: '↘' },
  ]);

  const [windowSizing, setWindowSizing] = useState<HotkeyConfig[]>([
    { name: 'Maximize', action: 'maximize', shortcut: '', icon: '□' },
    { name: 'Almost Maximize', action: 'almost-maximize', shortcut: '', icon: '▢' },
    { name: 'Maximize Height', action: 'maximize-height', shortcut: '', icon: '⇕' },
    { name: 'Make Smaller', action: 'smaller', shortcut: '', icon: '−' },
    { name: 'Make Larger', action: 'larger', shortcut: '', icon: '+' },
    { name: 'Center', action: 'center', shortcut: '', icon: '⊟' },
    { name: 'Center Prominently', action: 'center-prominently', shortcut: '', icon: '⊞' },
    { name: 'Restore', action: 'restore', shortcut: '', icon: '↺' },
  ]);

  const [thirdControls, setThirdControls] = useState<HotkeyConfig[]>([
    { name: 'First Third', action: 'first-third', shortcut: '', icon: '|◯' },
    { name: 'Center Third', action: 'center-third', shortcut: '', icon: '◯|◯' },
    { name: 'Last Third', action: 'last-third', shortcut: '', icon: '◯|' },
    { name: 'First Two Thirds', action: 'first-two-thirds', shortcut: '', icon: '||◯' },
    { name: 'Last Two Thirds', action: 'last-two-thirds', shortcut: '', icon: '◯||' },
  ]);

  const [fourthControls, setFourthControls] = useState<HotkeyConfig[]>([
    { name: 'First Fourth', action: 'first-fourth', shortcut: '', icon: '|◯◯◯' },
    { name: 'Second Fourth', action: 'second-fourth', shortcut: '', icon: '◯|◯◯' },
    { name: 'Third Fourth', action: 'third-fourth', shortcut: '', icon: '◯◯|◯' },
    { name: 'Last Fourth', action: 'last-fourth', shortcut: '', icon: '◯◯◯|' },
    { name: 'First Three Fourths', action: 'first-three-fourths', shortcut: '', icon: '|||◯' },
    { name: 'Last Three Fourths', action: 'last-three-fourths', shortcut: '', icon: '◯|||' },
  ]);

  const [movementControls, setMovementControls] = useState<HotkeyConfig[]>([
    { name: 'Move Left', action: 'move-left', shortcut: '', icon: '←' },
    { name: 'Move Right', action: 'move-right', shortcut: '', icon: '→' },
    { name: 'Move Up', action: 'move-up', shortcut: '', icon: '↑' },
    { name: 'Move Down', action: 'move-down', shortcut: '', icon: '↓' },
    { name: 'Next Display', action: 'next-display', shortcut: '', icon: '⇒' },
    { name: 'Previous Display', action: 'previous-display', shortcut: '', icon: '⇐' },
  ]);

  // Function to update a shortcut in a config array
  const updateShortcut = (
    configs: HotkeyConfig[], 
    setConfigs: React.Dispatch<React.SetStateAction<HotkeyConfig[]>>,
    action: string, 
    shortcut: string
  ) => {
    setConfigs(configs.map(config => 
      config.action === action ? { ...config, shortcut } : config
    ));
  };

  // Function to handle shortcut changes
  const handleShortcutChange = async (action: string, shortcut: string) => {
    try {
      // First, unregister any existing shortcut for this action
      const allConfigs = [
        ...windowControls, 
        ...cornerControls, 
        ...windowSizing, 
        ...thirdControls, 
        ...fourthControls, 
        ...movementControls
      ];
      
      const existingConfig = allConfigs.find(config => config.action === action);
      if (existingConfig && existingConfig.shortcut) {
        await invoke('unregister_hotkey', { shortcut: existingConfig.shortcut });
      }
      
      // Register the new shortcut
      await invoke('register_hotkey', { shortcut, action });
      
      // Update the UI
      if (windowControls.some(config => config.action === action)) {
        updateShortcut(windowControls, setWindowControls, action, shortcut);
      } else if (cornerControls.some(config => config.action === action)) {
        updateShortcut(cornerControls, setCornerControls, action, shortcut);
      } else if (windowSizing.some(config => config.action === action)) {
        updateShortcut(windowSizing, setWindowSizing, action, shortcut);
      } else if (thirdControls.some(config => config.action === action)) {
        updateShortcut(thirdControls, setThirdControls, action, shortcut);
      } else if (fourthControls.some(config => config.action === action)) {
        updateShortcut(fourthControls, setFourthControls, action, shortcut);
      } else if (movementControls.some(config => config.action === action)) {
        updateShortcut(movementControls, setMovementControls, action, shortcut);
      }
    } catch (error) {
      console.error('Failed to register hotkey:', error);
      // You might want to show an error message to the user here
    }
  };

  // Function to handle shortcut clearing
  const handleShortcutClear = async (action: string) => {
    try {
      const allConfigs = [
        ...windowControls, 
        ...cornerControls, 
        ...windowSizing, 
        ...thirdControls, 
        ...fourthControls, 
        ...movementControls
      ];
      
      const existingConfig = allConfigs.find(config => config.action === action);
      if (existingConfig && existingConfig.shortcut) {
        await invoke('unregister_hotkey', { shortcut: existingConfig.shortcut });
        
        // Update the UI
        if (windowControls.some(config => config.action === action)) {
          updateShortcut(windowControls, setWindowControls, action, '');
        } else if (cornerControls.some(config => config.action === action)) {
          updateShortcut(cornerControls, setCornerControls, action, '');
        } else if (windowSizing.some(config => config.action === action)) {
          updateShortcut(windowSizing, setWindowSizing, action, '');
        } else if (thirdControls.some(config => config.action === action)) {
          updateShortcut(thirdControls, setThirdControls, action, '');
        } else if (fourthControls.some(config => config.action === action)) {
          updateShortcut(fourthControls, setFourthControls, action, '');
        } else if (movementControls.some(config => config.action === action)) {
          updateShortcut(movementControls, setMovementControls, action, '');
        }
      }
    } catch (error) {
      console.error('Failed to unregister hotkey:', error);
      // You might want to show an error message to the user here
    }
  };

  return (
    <div className="hotkey-settings">
      <h2>Window Layout Hotkeys</h2>
      <p>Click on a shortcut field and press the keys you want to use for that action.</p>
      
      <HotkeyGroup 
        title="Window Position" 
        configs={windowControls} 
        onShortcutChange={handleShortcutChange}
        onShortcutClear={handleShortcutClear}
      />
      
      <HotkeyGroup 
        title="Corner Controls" 
        configs={cornerControls} 
        onShortcutChange={handleShortcutChange}
        onShortcutClear={handleShortcutClear}
      />
      
      <HotkeyGroup 
        title="Window Sizing" 
        configs={windowSizing} 
        onShortcutChange={handleShortcutChange}
        onShortcutClear={handleShortcutClear}
      />
      
      <HotkeyGroup 
        title="Third Controls" 
        configs={thirdControls} 
        onShortcutChange={handleShortcutChange}
        onShortcutClear={handleShortcutClear}
      />
      
      <HotkeyGroup 
        title="Fourth Controls" 
        configs={fourthControls} 
        onShortcutChange={handleShortcutChange}
        onShortcutClear={handleShortcutClear}
      />
      
      <HotkeyGroup 
        title="Movement Controls" 
        configs={movementControls} 
        onShortcutChange={handleShortcutChange}
        onShortcutClear={handleShortcutClear}
      />
    </div>
  );
};

export default HotkeySettings; 