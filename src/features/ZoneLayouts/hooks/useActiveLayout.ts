import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { showError } from '@/lib/toast';

/**
 * Hook to manage the active zone layout ID.
 * Automatically loads the initial active layout and listens for changes.
 */
export function useActiveLayout() {
  const [activeLayoutId, setActiveLayoutId] = useState<string | null>(null);

  // Load initial active layout
  useEffect(() => {
    const loadActiveLayout = async () => {
      try {
        const activeId = await invoke<string | null>('get_active_zone_layout_id');
        setActiveLayoutId(activeId);
      } catch (error) {
        showError('Failed to load active layout', error);
      }
    };
    loadActiveLayout();
  }, []);

  // Listen for active layout changes
  useEffect(() => {
    let isMounted = true;

    const setupListener = async () => {
      const unlisten = await listen<string>('active-layout-changed', (event) => {
        if (isMounted) {
          setActiveLayoutId(event.payload);
        }
      });
      return unlisten;
    };

    let unlistenPromise = setupListener();

    return () => {
      isMounted = false;
      unlistenPromise.then((unlisten) => {
        unlisten();
      }).catch(() => {
        // Ignore errors during cleanup
      });
    };
  }, []);

  return activeLayoutId;
}
