import React, { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { ZoneLayoutList } from '@/features/ZoneLayouts/ZoneLayoutList';
import { ZoneLayoutEditor } from '@/features/ZoneLayouts/ZoneLayoutDetails';
import type { ZoneLayout } from '@/types/zoneLayout';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { showError } from '@/lib/toast';

export const ZonesTab: React.FC = () => {
  const [layouts, setLayouts] = useState<ZoneLayout[]>([]);
  const [selectedLayout, setSelectedLayout] = useState<ZoneLayout | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<'list' | 'editor'>('list');

  const loadLayouts = async () => {
    try {
      setIsLoading(true);
      const loadedLayouts = await invoke<ZoneLayout[]>('get_all_zone_layouts');
      setLayouts(loadedLayouts);
    } catch (error) {
      showError('Failed to load zone layouts', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLayouts();
  }, []);

  const handleLayoutSelect = (layout: ZoneLayout) => {
    setSelectedLayout(layout);
    setView('editor');
  };

  const handleNewLayout = () => {
    setSelectedLayout(null);
    setView('editor');
  };

  const handleBack = () => {
    setSelectedLayout(null);
    setView('list');
  };

  const handleSave = () => {
    loadLayouts();
    handleBack();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center w-full">
        <div className="max-w-4xl w-full space-y-4">
          <Skeleton className="h-10 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <Skeleton className="h-24 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center w-full">
      <div className="max-w-4xl w-full">
        {view === 'list' ? (
          <ZoneLayoutList
            layouts={layouts}
            onLayoutSelect={handleLayoutSelect}
            onNewLayout={handleNewLayout}
            onRefresh={loadLayouts}
          />
        ) : (
          <ZoneLayoutEditor
            layout={selectedLayout}
            onBack={handleBack}
            onSave={handleSave}
          />
        )}
      </div>
    </div>
  );
};
