import { platform } from "@tauri-apps/plugin-os";

interface KeyMapping {
  icon?: React.ReactNode;
  label: string;
  className?: string;
}

const ARROW_KEY_MAPPING: Record<string, KeyMapping> = {
  "ArrowUp": { label: "Up", className: "text-primary" },
  "ArrowDown": { label: "Down", className: "text-primary" },
  "ArrowLeft": { label: "Left", className: "text-primary" },
  "ArrowRight": { label: "Right", className: "text-primary" },
};

const MACOS_KEY_MAPPING: Record<string, KeyMapping> = {
  ...ARROW_KEY_MAPPING,
  "control": { label: "Ctrl", className: "text-primary" },
  "alt": { label: "Option", className: "text-primary" },
  "shift": { label: "Shift", className: "text-primary" },
  "meta": { label: "Cmd", className: "text-primary" },
  "super": { label: "Cmd", className: "text-primary" },
  "return": { label: "Return", className: "text-primary" },
};

const WINDOWS_KEY_MAPPING: Record<string, KeyMapping> = {
  ...ARROW_KEY_MAPPING,
  "control": { label: "CTRL", className: "text-primary" },
  "alt": { label: "ALT", className: "text-primary" },
  "shift": { label: "Shift", className: "text-primary" },
  "meta": { label: "WIN", className: "text-primary" },
  "super": { label: "WIN", className: "text-primary" },
};

export const getShortcutMapping = (completeShortcut: string): string => {
  const currentPlatform = platform();
  const KEY_MAPPING = currentPlatform === "macos" ? MACOS_KEY_MAPPING : WINDOWS_KEY_MAPPING;
  
  const shortcut = completeShortcut.split('+').map(key => key.replace('Key', ''));
  return shortcut.map(key => {
    const mapping = KEY_MAPPING[key];
    return mapping ? mapping.label : key;
  }).join('+');
};
