import { HotkeyConfig } from './types';
import { LayoutAction } from '../../types/snapping';

export const HOTKEY_GROUPS = {
  WINDOW_POSITION: 'Window Position',
  CORNER_CONTROLS: 'Corner Controls',
  WINDOW_SIZING: 'Window Sizing',
  THIRD_CONTROLS: 'Third Controls',
  FOURTH_CONTROLS: 'Fourth Controls',
  SIXTH_CONTROLS: 'Sixth Controls',
  MOVEMENT_CONTROLS: 'Movement Controls',
};

export const DEFAULT_HOTKEYS: HotkeyConfig[] = [
  // Window Position
  { name: 'Left Half', shortcut: '', layoutAction: LayoutAction.LeftHalf, group: HOTKEY_GROUPS.WINDOW_POSITION },
  { name: 'Right Half', shortcut: '', layoutAction: LayoutAction.RightHalf, group: HOTKEY_GROUPS.WINDOW_POSITION },
  { name: 'Center Half', shortcut: '', layoutAction: LayoutAction.CenterHalf, group: HOTKEY_GROUPS.WINDOW_POSITION },
  { name: 'Top Half', shortcut: '', layoutAction: LayoutAction.TopHalf, group: HOTKEY_GROUPS.WINDOW_POSITION },
  { name: 'Bottom Half', shortcut: '', layoutAction: LayoutAction.BottomHalf, group: HOTKEY_GROUPS.WINDOW_POSITION },

  // Corner Controls
  { name: 'Top Left', shortcut: '', layoutAction: LayoutAction.TopLeft, group: HOTKEY_GROUPS.CORNER_CONTROLS },
  { name: 'Top Right', shortcut: '', layoutAction: LayoutAction.TopRight, group: HOTKEY_GROUPS.CORNER_CONTROLS },
  { name: 'Bottom Left', shortcut: '', layoutAction: LayoutAction.BottomLeft, group: HOTKEY_GROUPS.CORNER_CONTROLS },
  { name: 'Bottom Right', shortcut: '', layoutAction: LayoutAction.BottomRight, group: HOTKEY_GROUPS.CORNER_CONTROLS },

  // Window Sizing
  { name: 'Maximize', shortcut: '', layoutAction: LayoutAction.Maximize, group: HOTKEY_GROUPS.WINDOW_SIZING },
  { name: 'Almost Maximize', shortcut: '', layoutAction: LayoutAction.AlmostMaximize, group: HOTKEY_GROUPS.WINDOW_SIZING },
  { name: 'Maximize Height', shortcut: '', layoutAction: LayoutAction.MaximizeHeight, group: HOTKEY_GROUPS.WINDOW_SIZING },
  { name: 'Make Smaller', shortcut: '', layoutAction: LayoutAction.Smaller, group: HOTKEY_GROUPS.WINDOW_SIZING },
  { name: 'Make Larger', shortcut: '', layoutAction: LayoutAction.Larger, group: HOTKEY_GROUPS.WINDOW_SIZING },
  { name: 'Center', shortcut: '', layoutAction: LayoutAction.Center, group: HOTKEY_GROUPS.WINDOW_SIZING },
  { name: 'Center Prominently', shortcut: '', layoutAction: LayoutAction.CenterProminently, group: HOTKEY_GROUPS.WINDOW_SIZING },
  { name: 'Restore', shortcut: '', layoutAction: LayoutAction.Restore, group: HOTKEY_GROUPS.WINDOW_SIZING },

  // Movement Controls
  { name: 'Move Left', shortcut: '', layoutAction: LayoutAction.MoveLeft, group: HOTKEY_GROUPS.MOVEMENT_CONTROLS },
  { name: 'Move Right', shortcut: '', layoutAction: LayoutAction.MoveRight, group: HOTKEY_GROUPS.MOVEMENT_CONTROLS },
  { name: 'Move Up', shortcut: '', layoutAction: LayoutAction.MoveUp, group: HOTKEY_GROUPS.MOVEMENT_CONTROLS },
  { name: 'Move Down', shortcut: '', layoutAction: LayoutAction.MoveDown, group: HOTKEY_GROUPS.MOVEMENT_CONTROLS },
  { name: 'Next Display', shortcut: '', layoutAction: LayoutAction.NextDisplay, group: HOTKEY_GROUPS.MOVEMENT_CONTROLS },
  { name: 'Previous Display', shortcut: '', layoutAction: LayoutAction.PreviousDisplay, group: HOTKEY_GROUPS.MOVEMENT_CONTROLS },

  // Third Controls
  { name: 'First Third', shortcut: '', layoutAction: LayoutAction.FirstThird, group: HOTKEY_GROUPS.THIRD_CONTROLS },
  { name: 'Center Third', shortcut: '', layoutAction: LayoutAction.CenterThird, group: HOTKEY_GROUPS.THIRD_CONTROLS },
  { name: 'Last Third', shortcut: '', layoutAction: LayoutAction.LastThird, group: HOTKEY_GROUPS.THIRD_CONTROLS },
  { name: 'First Two Thirds', shortcut: '', layoutAction: LayoutAction.FirstTwoThirds, group: HOTKEY_GROUPS.THIRD_CONTROLS },
  { name: 'Last Two Thirds', shortcut: '', layoutAction: LayoutAction.LastTwoThirds, group: HOTKEY_GROUPS.THIRD_CONTROLS },

  // Fourth Controls
  { name: 'First Fourth', shortcut: '', layoutAction: LayoutAction.FirstFourth, group: HOTKEY_GROUPS.FOURTH_CONTROLS },
  { name: 'Second Fourth', shortcut: '', layoutAction: LayoutAction.SecondFourth, group: HOTKEY_GROUPS.FOURTH_CONTROLS },
  { name: 'Third Fourth', shortcut: '', layoutAction: LayoutAction.ThirdFourth, group: HOTKEY_GROUPS.FOURTH_CONTROLS },
  { name: 'Last Fourth', shortcut: '', layoutAction: LayoutAction.LastFourth, group: HOTKEY_GROUPS.FOURTH_CONTROLS },
  { name: 'First Three Fourths', shortcut: '', layoutAction: LayoutAction.FirstThreeFourths, group: HOTKEY_GROUPS.FOURTH_CONTROLS },
  { name: 'Last Three Fourths', shortcut: '', layoutAction: LayoutAction.LastThreeFourths, group: HOTKEY_GROUPS.FOURTH_CONTROLS },

  // Sixth Controls (3x2 grid)
  { name: 'Top Left Sixth', shortcut: '', layoutAction: LayoutAction.TopLeftSixth, group: HOTKEY_GROUPS.SIXTH_CONTROLS },
  { name: 'Top Middle Sixth', shortcut: '', layoutAction: LayoutAction.TopCenterSixth, group: HOTKEY_GROUPS.SIXTH_CONTROLS },
  { name: 'Top Right Sixth', shortcut: '', layoutAction: LayoutAction.TopRightSixth, group: HOTKEY_GROUPS.SIXTH_CONTROLS },
  { name: 'Bottom Left Sixth', shortcut: '', layoutAction: LayoutAction.BottomLeftSixth, group: HOTKEY_GROUPS.SIXTH_CONTROLS },
  { name: 'Bottom Middle Sixth', shortcut: '', layoutAction: LayoutAction.BottomCenterSixth, group: HOTKEY_GROUPS.SIXTH_CONTROLS },
  { name: 'Bottom Right Sixth', shortcut: '', layoutAction: LayoutAction.BottomRightSixth, group: HOTKEY_GROUPS.SIXTH_CONTROLS },
  { name: 'Left Two Sixths', shortcut: '', layoutAction: null, group: HOTKEY_GROUPS.SIXTH_CONTROLS },
  { name: 'Middle Two Sixths', shortcut: '', layoutAction: null, group: HOTKEY_GROUPS.SIXTH_CONTROLS },
  { name: 'Right Two Sixths', shortcut: '', layoutAction: null, group: HOTKEY_GROUPS.SIXTH_CONTROLS },
  { name: 'Top Three Sixths', shortcut: '', layoutAction: null, group: HOTKEY_GROUPS.SIXTH_CONTROLS },
  { name: 'Bottom Three Sixths', shortcut: '', layoutAction: null, group: HOTKEY_GROUPS.SIXTH_CONTROLS },
];
