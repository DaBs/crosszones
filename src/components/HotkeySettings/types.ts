import { LayoutAction } from '../../types/snapping';

export interface HotkeyConfig {
  name: string;
  shortcut: string;
  layoutAction: LayoutAction | null;
  group: string;
} 