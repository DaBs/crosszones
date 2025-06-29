import { Settings } from 'lucide-react';
import { Button } from './ui/button';
import { platform } from '@tauri-apps/plugin-os';

interface TitleBarProps {
  isSettingsOpen: boolean
  setIsSettingsOpen: (isSettingsOpen: boolean) => void
}

export function TitleBar({ setIsSettingsOpen }: TitleBarProps) {

  // Left is not visible on macOS
  const isLeftVisible = platform() !== 'macos';
  
  return (
    <div
      data-tauri-drag-region
      className="fixed top-0 left-0 right-0 h-8 flex items-center justify-between select-none bg-accent"
    >
      <div className={`flex items-center gap-2 ${!isLeftVisible ? 'invisible' : ''}`}>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-12 hover:bg-zinc-200 dark:hover:bg-zinc-800"
          onClick={() => setIsSettingsOpen(true)}
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <img src="/assets/icon.png" alt="App Icon" className="w-4 h-4" />
        <span className="text-sm font-medium select-none">CrossZones</span>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-12 hover:bg-zinc-200 dark:hover:bg-zinc-800"
          onClick={() => setIsSettingsOpen(true)}
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
} 