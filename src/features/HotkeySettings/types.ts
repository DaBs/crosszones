import { LayoutAction } from '../../types/snapping';

export interface HotkeyConfig {
  name: string;
  shortcut: string;
  layoutAction: LayoutAction | null;
  group: string;
  zoneNumber?: number; // For ApplyZone actions
}

// ActionPayload structure matching the Rust ActionPayload
export interface ActionPayload {
  action: string;
  zone_number?: number;
  layout_id?: string;
}

// Helper function to create an ActionPayload from a HotkeyConfig
export function createActionPayload(config: HotkeyConfig): ActionPayload | null {
  if (config.zoneNumber !== undefined) {
    return {
      action: 'apply-zone',
      zone_number: config.zoneNumber,
    };
  }
  if (config.layoutAction) {
    return {
      action: config.layoutAction,
    };
  }
  return null;
}

// Helper function to serialize a layout action to JSON string (as stored in backend)
// The backend now uses ActionPayload format: {"action": "left-half"} or {"action": "apply-zone", "zone_number": 1}
export function serializeLayoutAction(action: LayoutAction | null, zoneNumber?: number): string {
  if (zoneNumber !== undefined) {
    return JSON.stringify({ action: 'apply-zone', zone_number: zoneNumber });
  }
  if (action) {
    return JSON.stringify({ action });
  }
  return '';
} 