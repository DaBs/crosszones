import { getCurrentWindow } from '@tauri-apps/api/window';
import { useState, useEffect } from 'react';
import { Settings, X, Minus, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from './ui/button';

/*
Fundamentally, having to completely replace the window's title bar is kind of off-putting.
Ideally, Tauri would have some kind of variant of what e.g. Electron's title bar is.
But, it is what it is for now.
*/

interface TitleBarProps {
  isSettingsOpen: boolean
  setIsSettingsOpen: (isSettingsOpen: boolean) => void
}

export function TitleBar({ setIsSettingsOpen }: TitleBarProps) {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    const unlisten = getCurrentWindow().onResized(() => {
      getCurrentWindow().isMaximized().then(setIsMaximized);
    });

    return () => {
      unlisten.then(fn => fn());
    };
  }, []);

  const handleMinimize = () => getCurrentWindow().minimize();
  const handleMaximize = () => getCurrentWindow().toggleMaximize();
  const handleClose = () => getCurrentWindow().close();

  return (
    <div
      data-tauri-drag-region
      className="fixed top-0 left-0 right-0 h-8 flex items-center justify-between select-none bg-accent"
    >
      <div className="flex items-center gap-2 pl-4">
        <img src="/assets/icon.png" alt="App Icon" className="w-4 h-4" />
        <span className="text-sm font-medium">CrossZones</span>
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

        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-12 hover:bg-zinc-200 dark:hover:bg-zinc-800"
            onClick={handleMinimize}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-12 hover:bg-zinc-200 dark:hover:bg-zinc-800"
            onClick={handleMaximize}
          >
            {isMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-12 hover:bg-red-500 hover:text-white"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
} 