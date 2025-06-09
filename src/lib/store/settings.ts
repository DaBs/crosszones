import { LazyStore } from '@tauri-apps/plugin-store';

export type SettingsSchema = {
  startAtStartup: boolean;
  startMinimized: boolean;
  closeToSystemTray: boolean;
};

export const store = new LazyStore('settings.json');

export const setSetting = async (key: keyof SettingsSchema, value: SettingsSchema[keyof SettingsSchema]) => {
  await store.set(key, value);
};

export const getSetting = async (key: keyof SettingsSchema) => {
  return await store.get(key);
};

export const getSettings = async () => {
  return await store.entries();
};