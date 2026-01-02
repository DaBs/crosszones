import { useState, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import type { Zone } from '@/types/zoneLayout';
import { generateZoneId } from '@/lib/utils';
import { showError } from '@/lib/toast';

interface ScreenInfo {
  x: number;
  y: number;
  width: number;
  height: number;
  id: string;
}

interface EditorData {
  layoutId: string;
  layoutName: string;
  zones: Zone[];
  screen: ScreenInfo;
}

export function useZoneEditor() {
  const [editorData, setEditorData] = useState<EditorData | null>(null);
  const [zones, setZones] = useState<Zone[]>([]);
  const [splitMode, setSplitMode] = useState<'horizontal' | 'vertical'>('horizontal');
  const zonesStateRef = useRef<Zone[]>([]);

  // Keep zonesStateRef in sync with zones
  useEffect(() => {
    zonesStateRef.current = zones;
  }, [zones]);

  // Store zones whenever they change (this will emit the zones-updated event)
  useEffect(() => {
    // Only store if we have zones and editor data (meaning editor is open)
    if (zones.length > 0 && editorData) {
      invoke('store_editor_zones', { zones }).catch((error) => {
        showError('Failed to store editor zones', error);
      });
    }
  }, [zones, editorData]);

  useEffect(() => {
    let unlistenEditorData: (() => void) | null = null;
    let unlistenRequestZones: (() => void) | null = null;

    const setupListener = async () => {
      unlistenEditorData = await listen<EditorData>('editor-data', (event) => {
        const data = event.payload;
        setEditorData(data);
        // If no zones, create a default fullscreen zone
        if (data.zones.length === 0) {
          const defaultZone: Zone = {
            id: generateZoneId(),
            x: 0,
            y: 0,
            width: 100,
            height: 100,
            number: 1,
          };
          setZones([defaultZone]);
        } else {
          setZones(data.zones);
        }
      });

      // Listen for zone storage requests (when saving while editor is open)
      unlistenRequestZones = await listen('request-zones', async () => {
        // Use the ref to get the latest zones
        const currentZones = zonesStateRef.current;
        await invoke('store_editor_zones', { zones: currentZones });
      });
    };

    setupListener();

    return () => {
      if (unlistenEditorData) {
        unlistenEditorData();
      }
      if (unlistenRequestZones) {
        unlistenRequestZones();
      }
    };
  }, []);

  // Handle ESC key to close editor and Shift key for split mode
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        await invoke('close_editor_windows', { zones: zonesStateRef.current });
      } else if (e.key === 'Shift') {
        setSplitMode('vertical');
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setSplitMode('horizontal');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const handleCloseEditor = async () => {
    await invoke('close_editor_windows', { zones });
  };

  return {
    editorData,
    zones,
    setZones,
    splitMode,
    zonesStateRef,
    handleCloseEditor,
  };
}

