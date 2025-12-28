import React from 'react';
import { TabsContent } from '@/components/ui/tabs';
import { HotkeysTab } from './HotkeysTab';
import { LayoutAreasTab } from './LayoutAreasTab';
import { SettingsTab } from './SettingsTab';

export const MainView: React.FC = () => {
  return (
    <div className="w-full h-full flex flex-col bg-background">
      <TabsContent value="hotkeys" className="flex-1 mt-0 p-6 overflow-auto">
        <HotkeysTab />
      </TabsContent>
      
      <TabsContent value="layout-areas" className="flex-1 mt-0 p-6 overflow-auto">
        <LayoutAreasTab />
      </TabsContent>
      
      <TabsContent value="settings" className="flex-1 mt-0 p-6 overflow-auto">
        <SettingsTab />
      </TabsContent>
    </div>
  );
};

