import { Settings, X } from 'lucide-react';
import { Button } from './ui/button';

interface TitleBarProps {
  isSettingsOpen: boolean
  setIsSettingsOpen: (isSettingsOpen: boolean) => void
}

export function TitleBar({ isSettingsOpen, setIsSettingsOpen }: TitleBarProps) {

  const variant = isSettingsOpen ? "secondary" : "ghost";

  return (
    <div className="flex w-full justify-end" data-tauri-drag-region>
      <Button
        variant={variant}
        size="icon"
        className="h-8 w-12 hover:bg-zinc-200 dark:hover:bg-zinc-800"
        onClick={() => setIsSettingsOpen(!isSettingsOpen)}
      >
        {isSettingsOpen ? <X className="h-4 w-4" /> : <Settings className="h-4 w-4" />}
      </Button>
    </div>
  );
} 