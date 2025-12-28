import { TabsList, TabsTrigger } from './ui/tabs';
import { Keyboard, Settings, PanelsTopLeft } from 'lucide-react';

/**
 * Renders a centered title bar containing tabbed navigation for Hotkeys, Layout Areas, and Settings.
 *
 * The bar includes left and right drag regions for window dragging and a centered TabsList with three TabsTrigger items,
 * each showing an icon and a label.
 *
 * @returns The JSX element for the title bar with centered tabs and drag regions.
 */
export function TitleBar() {
  return (
    <div className="flex w-full justify-center items-center h-12 px-4" data-tauri-drag-region>
      <div className="flex-1" data-tauri-drag-region></div>
      <TabsList className="inline-flex h-auto rounded-lg bg-muted p-1 shadow-sm">
        <TabsTrigger 
          value="hotkeys" 
          className="rounded-md px-4 py-2 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm data-[state=inactive]:text-muted-foreground [&[data-state=active]_svg]:text-primary"
        >
          <Keyboard className="h-4 w-4 mr-2" />
          Hotkeys
        </TabsTrigger>
        <TabsTrigger 
          value="layout-areas" 
          className="rounded-md px-4 py-2 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm data-[state=inactive]:text-muted-foreground [&[data-state=active]_svg]:text-primary"
        >
          <PanelsTopLeft className="h-4 w-4 mr-2" />
          Layout Areas
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