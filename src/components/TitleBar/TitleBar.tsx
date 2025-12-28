import { TabsList, TabsTrigger } from '../ui/tabs';
import { Keyboard, Settings, PanelsTopLeft } from 'lucide-react';
import { platform } from '@tauri-apps/plugin-os';
import { useMemo } from 'react';

const IS_MACOS = platform() === 'macos';

export function TitleBar() {
  const isMacOS = IS_MACOS;

  const macosRoundedClass = useMemo(() => {
    return isMacOS ? 'rounded-none rounded-b-lg rounded-out-t-lg' : 'rounded-lg';
  }, [isMacOS]);
  
  return (
    <div className="flex w-full justify-center items-center h-12 px-4" data-tauri-drag-region>
      <div className="flex-1" data-tauri-drag-region></div>
      <TabsList 
        className={`relative inline-flex h-auto bg-muted p-1 shadow-sm ${macosRoundedClass}`}
      >
        <TabsTrigger 
          value="hotkeys" 
          className="rounded-md px-4 py-2 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm data-[state=inactive]:text-muted-foreground [&[data-state=active]_svg]:text-primary"
        >
          <Keyboard className="h-4 w-4 mr-2" />
          Hotkeys
        </TabsTrigger>
        <TabsTrigger 
          value="zones" 
          className="rounded-md px-4 py-2 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm data-[state=inactive]:text-muted-foreground [&[data-state=active]_svg]:text-primary"
        >
          <PanelsTopLeft className="h-4 w-4 mr-2" />
          Zones
        </TabsTrigger>
        <TabsTrigger 
          value="settings" 
          className="rounded-md px-4 py-2 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm data-[state=inactive]:text-muted-foreground [&[data-state=active]_svg]:text-primary"
        >
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </TabsTrigger>
      </TabsList>
      <div className="flex-1" data-tauri-drag-region></div>
    </div>
  );
} 