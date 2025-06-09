import { invoke } from '@tauri-apps/api/core';
import { LazyStore } from '@tauri-apps/plugin-store';

export type SettingsSchema = {
  startAtStartup: boolean;
  startMinimized: boolean;
  closeToSystemTray: boolean;
};

export const store = new LazyStore('settings.json');

export const setSettings = async (settings: SettingsSchema) => {
  await invoke('set_settings', { settings });
};

export const getSetting = async (key: keyof SettingsSchema) => {
  return await store.get(key);
};

export const getSettings = async () => {
  return await store.entries();
};