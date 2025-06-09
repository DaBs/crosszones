import { getCurrentWindow } from '@tauri-apps/api/window';
import { useState, useEffect } from 'react';
import { Settings, X, Minimize, Maximize } from 'lucide-react';
import { Button } from './ui/button';
import { useTheme } from './theme-provider';

export function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false);
  const { theme } = useTheme();

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
      className={`fixed top-0 left-0 right-0 h-8 flex items-center justify-between px-2 select-none ${
        theme === 'dark' ? 'bg-zinc-900' : 'bg-zinc-100'
      }`}
    >
      <div className="flex items-center gap-2">
        <img src="/assets/icon.png" alt="App Icon" className="w-4 h-4" />
        <span className="text-sm font-medium">CrossZones</span>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => {/* TODO: Open settings */}}
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
            <Minimize className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-12 hover:bg-zinc-200 dark:hover:bg-zinc-800"
            onClick={handleMaximize}
          >
            <Maximize className="h-4 w-4" />
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