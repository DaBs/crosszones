
import { platform } from '@tauri-apps/plugin-os';
import { Settings, X } from 'lucide-react';
import { Button } from './ui/button';
import { WindowTitlebar } from "tauri-controls"

interface TitleBarProps {
  isSettingsOpen: boolean
  setIsSettingsOpen: (isSettingsOpen: boolean) => void
}

export function TitleBar({ isSettingsOpen, setIsSettingsOpen }: TitleBarProps) {

  const currentPlatform = platform() as "macos" | "windows" | "gnome";
  
  // TODO: Just update / import tauri-controls to avoid this
  const WindowTitlebarWrapper = currentPlatform === "windows" ? WindowTitlebar : "div";

  return (
    <WindowTitlebarWrapper windowControlsProps={{ platform: currentPlatform }} className="bg-sidebar" controlsOrder="left">
      <div className="flex w-full justify-end" data-tauri-drag-region>
        <Button
          variant="default"
          size="icon"
          className="h-8 w-12 hover:bg-zinc-200 dark:hover:bg-zinc-800"
          onClick={() => setIsSettingsOpen(true)}
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </WindowTitlebarWrapper>
  );
} 