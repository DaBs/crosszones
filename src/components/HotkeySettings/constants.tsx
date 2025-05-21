import { HotkeyConfig } from './types';

export const HOTKEY_GROUPS = {
  WINDOW_POSITION: 'Window Position',
  CORNER_CONTROLS: 'Corner Controls',
  WINDOW_SIZING: 'Window Sizing',
  THIRD_CONTROLS: 'Third Controls',
  FOURTH_CONTROLS: 'Fourth Controls',
  MOVEMENT_CONTROLS: 'Movement Controls',
};
export const DEFAULT_HOTKEYS: HotkeyConfig[] = [
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
  { name: 'First Third', action: 'first-third', shortcut: '', icon: '+--', group: HOTKEY_GROUPS.THIRD_CONTROLS },
  { name: 'Center Third', action: 'center-third', shortcut: '', icon: '-+-', group: HOTKEY_GROUPS.THIRD_CONTROLS },
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
